const pinchable = (elm, options = {
  maxScale: 2.0,
  overPinchOut: 1.0,
  scrollMargin: 100,
}) => {
  elm.classList.add('pinchable');

  let initialTouchPoints = [];
  /** 拡大縮小前の元画像座標系で指定する */
  let transformOrigin = { x: 0, y: 0 };

  /** 未確定の拡大縮小率 */
  let currentScale = 1.0;
  /** 確定済みの拡大縮小率 */
  let appliedScale = 1.0;
  /** 未確定の平行移動 */
  let currentTranslate = { x: 0.0, y: 0.0 };
  /** 確定済みの平行移動 */
  let appliedTranslate = { x: 0.0, y: 0.0 };

  const dbg = document.querySelector('#debug');
  let nApplied = 0;

  elm.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleNumTouchesChanged(e);
  });

  elm.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.targetTouches.length === 1 && e.changedTouches.length === 1) {
      handleScroll(e);
    } else if (e.targetTouches.length === 2 && e.changedTouches.length === 2) {
      handlePinch(e);
    }
  });

  elm.addEventListener('touchend', (e) => {
    e.preventDefault();
    handleTouchEnd();
    handleNumTouchesChanged(e);
  });

  const handleNumTouchesChanged = (e) => {
    initialTouchPoints = [];
    for (let i = 0; i < e.targetTouches.length; i++) {
      initialTouchPoints.push(e.targetTouches[i]);
    }

    if (e.targetTouches.length > 0) {
      handleTouchStart(e);
    }
  };

  const handleTouchStart = (e) => {
    if (e.targetTouches.length === 1) {
      // 1本指スクロールの場合はどこがoriginでも関係ないので(0, 0)とする
      setTransformOrigin({ x: 0, y: 0 });
    } else if (e.targetTouches.length === 2) {
      // 2本指の場合は、2本の指のちょうど中間をoriginとする
      const offset1 = getOffset(elm, e.targetTouches[0]);
      const offset2 = getOffset(elm, e.targetTouches[1]);
      setTransformOrigin({
        x: (offset1.x + offset2.x) / 2 / appliedScale,
        y: (offset1.y + offset2.y) / 2 / appliedScale,
      });
    }
  };

  const handleTouchEnd = (e) => {
    applyCurrentTransform();
    transformPinchable(currentScale, currentTranslate);
  };

  const applyCurrentTransform = () => {
    nApplied += 1;
    const scaleBounds = calculateScaleBounds()
    const maxScale = scaleBounds.scaleMax;
    const minScale = scaleBounds.scaleMin;
    appliedScale = Math.max(Math.min(appliedScale * currentScale, maxScale), minScale);
    currentScale = 1.0;

    const translateBounds = calculateTranslateBounds(appliedScale)
    const xSum = appliedTranslate.x + currentTranslate.x;
    const ySum = appliedTranslate.y + currentTranslate.y;
    appliedTranslate = {
      x: Math.max(Math.min(xSum, translateBounds.xMax), translateBounds.xMin),
      y: Math.max(Math.min(ySum, translateBounds.yMax), translateBounds.yMin),
    };
    currentTranslate = { x: 0.0, y: 0.0 };
  };

  const handleScroll = (e) => {
    const initialTouch = initialTouchPoints[0];
    const lastTouch = e.targetTouches[0];
    const dX = lastTouch.clientX - initialTouch.clientX;
    const dY = lastTouch.clientY - initialTouch.clientY;

    transformPinchable(1.0, { x: dX, y: dY });
  };

  const handlePinch = (e) => {
    const p1 = initialTouchPoints.findLastIndex((t) => t.identifier === e.targetTouches[0].identifier);
    const p2 = initialTouchPoints.findLastIndex((t) => t.identifier === e.targetTouches[1].identifier);

    if (p1 >= 0 && p2 >= 0) {

      const initialDist = calcurateDistance(initialTouchPoints[p1], initialTouchPoints[p2]);
      const lastDist = calcurateDistance(e.targetTouches[0], e.targetTouches[1]);
      const scale = lastDist / Math.max(initialDist, 1);

      const initialX = (initialTouchPoints[p1].clientX + initialTouchPoints[p2].clientX) / 2;
      const initialY = (initialTouchPoints[p1].clientY + initialTouchPoints[p2].clientY) / 2;
      const currentX = (e.targetTouches[0].clientX + e.targetTouches[1].clientX) / 2;
      const currentY = (e.targetTouches[0].clientY + e.targetTouches[1].clientY) / 2;
      const scrollX = currentX - initialX;
      const scrollY = currentY - initialY;

      transformPinchable(scale, { x: scrollX, y: scrollY });
    }
  };

  const setTransformOrigin = ({ x, y }) => {
    // 新しいoriginを基準としてtranslateを計算しなおす
    appliedTranslate = {
      x: appliedTranslate.x - (transformOrigin.x - x) * (appliedScale - 1),
      y: appliedTranslate.y - (transformOrigin.y - y) * (appliedScale - 1)
    };
    transformOrigin = { x, y };
    transformPinchable(currentScale, { x: 0, y: 0 });
  };

  const calcurateDistance = (p1, p2) => Math.sqrt((p1.clientX - p2.clientX) ** 2 + (p1.clientY - p2.clientY) ** 2);

  /**
   * 適用できる拡大縮小率の上限、下限を返す。
   * @returns 拡大縮小率の上限・下限
   */
  const calculateScaleBounds = () => {
    return {
      scaleMax: options.maxScale,
      scaleMin: 1,
    };
  };

  /**
   * 拡大縮小率`scale`に対して、適用できる平行移動量の上限と下限を計算して返す。
   * @param {number} scale 拡大縮小率
   * @returns 平行移動量の上限・下限
   */
  const calculateTranslateBounds = (scale) => {
    // 拡大によって枠からはみ出した分だけ平行移動可能
    return {
      xMax: transformOrigin.x * (scale - 1),
      yMax: transformOrigin.y * (scale - 1),
      xMin: -(elm.clientWidth - transformOrigin.x) * (scale - 1),
      yMin: -(elm.clientHeight - transformOrigin.y) * (scale - 1),
    };
  };

  const transformPinchable = (dScale, dTranslate) => {

    // 今回のTransformで拡大縮小できる最大・最小値
    // 縮小については1.0倍を下回ってoverPinchOut倍まで縮小することができる
    const scaleBounds = calculateScaleBounds(appliedScale)
    const dScaleMax = scaleBounds.scaleMax / appliedScale;
    const dScaleMin = scaleBounds.scaleMin / appliedScale * options.overPinchOut;

    currentScale = Math.min(Math.max(dScale, dScaleMin), dScaleMax);
    const scale = appliedScale * currentScale;

    // 今回のTransformで平行移動できる最大・最小値
    // 本来可能な平行移動量 + マージン分だけ平行移動可能
    // またマージンは拡大縮小率によらず一定
    const translateBounds = calculateTranslateBounds(scale)
    const margin = options.scrollMargin;
    const dXMax = translateBounds.xMax - appliedTranslate.x + margin;
    const dYMax = translateBounds.yMax - appliedTranslate.y + margin;
    const dXMin = translateBounds.xMin - appliedTranslate.x - margin;
    const dYMin = translateBounds.yMin - appliedTranslate.y - margin;

    currentTranslate = {
      x: Math.max(Math.min(dTranslate.x, dXMax), dXMin),
      y: Math.max(Math.min(dTranslate.y, dYMax), dYMin),
    };
    const translateX = appliedTranslate.x + currentTranslate.x;
    const translateY = appliedTranslate.y + currentTranslate.y;

    const transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    elm.style.transform = transform;
    elm.style.transformOrigin = `${transformOrigin.x}px ${transformOrigin.y}px`;

    dbg.innerHTML = `
      <div>
        <div>origin: {x: ${transformOrigin.x}, y: ${transformOrigin.y} }</div>
        <div>translate: { x: ${translateX}, y: ${translateY} }</div>
        <div>scale: ${scale}</div>
        <div>currentTranslate: { x: ${currentTranslate.x}, y: ${currentTranslate.y} }</div>
        <div>currentScale: ${currentScale}</div>
        <div>appliedTranslate: { x: ${appliedTranslate.x}, y: ${appliedTranslate.y} }</div>
        <div>appliedScale: ${appliedScale}</div>
        <div>nApplied: ${nApplied}</div>
      </div>
    `;
  };

  const getOffset = (elm, touch) => {
    const rect = elm.getBoundingClientRect();
    return {
      x: touch.clientX - rect.x,
      y: touch.clientY - rect.y,
    };
  };

  const getCurrentCenter = () => {
    if (appliedScale === 1) {
      return {
        x: elm.clientWidth / 2,
        y: elm.clientHeight / 2,
      };
    } else {
      const offsetX = (-elm.clientWidth / 2 * (appliedScale - 1) - appliedTranslate.x) / appliedScale;
      const offsetY = (-elm.clientHeight / 2 * (appliedScale - 1) - appliedTranslate.y) / appliedScale;
      return {
        x: elm.clientWidth / 2 + offsetX,
        y: elm.clientHeight / 2 + offsetY,
      };
    }
  }

  const zoomIn = (ratio) => {
    const imageCenter = getCurrentCenter();
    setTransformOrigin(imageCenter);
    transformPinchable(ratio, { x: 0, y: 0 });
    applyCurrentTransform();
    setTransformOrigin({ x: 0, y: 0 });
  };

  const zoomOut = (ratio) => {
    const imageCenter = getCurrentCenter();
    setTransformOrigin(imageCenter);
    transformPinchable(1 / ratio, { x: 0, y: 0 });
    applyCurrentTransform();
    setTransformOrigin({ x: 0, y: 0 });
  };

  return {
    reset: () => {
      initialTouchPoints = [];
      transformOrigin = { x: 0, y: 0 };
      currentScale = 1.0;
      appliedScale = 1.0;
      currentTranslate = { x: 0.0, y: 0.0 };
      appliedTranslate = { x: 0.0, y: 0.0 };
      transformPinchable(currentScale, currentTranslate);
    },
    zoomIn,
    zoomOut,
  };
};