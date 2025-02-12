const pinchable = (elm, options = { maxScale: 2.0, minScale: 1.0 }) => {
  elm.classList.add('pinchable');

  let initialTouchPoints = [];
  let transformOrigin = { x: 0, y: 0 };
  let currentScale = 1.0;
  let appliedScale = 1.0;
  let currentTranslate = { x: 0.0, y: 0.0 };
  let appliedTranslate = { x: 0.0, y: 0.0 };

  const dbg = document.querySelector('#debug');

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
    appliedScale = Math.max(appliedScale * currentScale, 1.0);
    currentScale = 1.0;
    appliedTranslate = {
      x: appliedTranslate.x + currentTranslate.x,
      y: appliedTranslate.y + currentTranslate.y,
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
      const scale = lastDist / initialDist;

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

  const transformPinchable = (scale, translate) => {

    const minScale = options.minScale / appliedScale;
    const maxScale = options.maxScale / appliedScale;

    currentScale = Math.min(Math.max(scale, minScale), maxScale);
    const nextScale = appliedScale * currentScale;

    const maxX = transformOrigin.x * (nextScale - 1) - appliedTranslate.x;
    const maxY = transformOrigin.y * (nextScale - 1) - appliedTranslate.y;
    const minX = -(elm.clientWidth - transformOrigin.x) * (nextScale - 1) - appliedTranslate.x;
    const minY = -(elm.clientHeight - transformOrigin.y) * (nextScale - 1) - appliedTranslate.y;
    const dX = Math.max(Math.min(translate.x, maxX), minX);
    const dY = Math.max(Math.min(translate.y, maxY), minY);
    const translateX = dX + appliedTranslate.x;
    const translateY = dY + appliedTranslate.y;

    currentTranslate = { x: dX, y: dY };

    const transform = `translate(${translateX}px, ${translateY}px) scale(${nextScale})`;
    elm.style.transform = transform;
    elm.style.transformOrigin = `${transformOrigin.x}px ${transformOrigin.y}px`;

    dbg.innerHTML = `
      <div>
        <div>origin: {x: ${transformOrigin.x}, y: ${transformOrigin.y} }</div>
        <div>translate: { x: ${translateX}, y: ${translateY} }</div>
        <div>scale: ${nextScale}</div>
        <div>currentTranslate: { x: ${currentTranslate.x}, y: ${currentTranslate.y} }</div>
        <div>currentScale: ${currentScale}</div>
        <div>appliedTranslate: { x: ${appliedTranslate.x}, y: ${appliedTranslate.y} }</div>
        <div>appliedScale: ${appliedScale}</div>
      </div>
    `;
  };

  const getOffset = (elm, touch) => {
    const rect = elm.getBoundingClientRect();
    console.log(touch.clientX, touch.clientY)
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
    console.log(imageCenter);
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