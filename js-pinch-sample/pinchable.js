const pinchable = (elm) => {
  elm.classList.add('pinchable');

  let initialTouchPoints = [];
  let lastTouchLength = 0;
  let transformOrigin = { x: 0, y: 0 };
  let currentScale = 1.0;
  let appliedScale = 1.0;
  let currentTranslate = { x: 0.0, y: 0.0 };
  let appliedTranslate = { x: 0.0, y: 0.0 };

  const dbg = document.querySelector('#debug');

  elm.addEventListener('touchmove', (e) => {
    e.preventDefault();

    if (lastTouchLength !== e.targetTouches.length) {
      handleNumTouchesChanged(e);
    }

    if (e.targetTouches.length === 1 && e.changedTouches.length === 1) {
      handleScroll(e);
    } else if (e.targetTouches.length === 2 && e.changedTouches.length === 2) {
      handlePinch(e);
    }
  });

  elm.addEventListener('touchend', (e) => {
    e.preventDefault();

    if (lastTouchLength === 1) {
      handleScrollEnd();
    } else if (lastTouchLength === 2) {
      handlePinchEnd();
    }
    handleNumTouchesChanged(e);
    lastTouchLength = e.targetTouches.length;
  });

  const handleNumTouchesChanged = (e) => {
    initialTouchPoints = [];
    for (let i = 0; i < e.targetTouches.length; i++) {
      initialTouchPoints.push(e.targetTouches[i]);
    }
    lastTouchLength = e.targetTouches.length;

    if (e.targetTouches.length === 2) {
      handlePinchStart(e);
    }
  };

  const handleScroll = (e) => {
    const initialTouch = initialTouchPoints[0];
    const lastTouch = e.targetTouches[0];
    const diffX = lastTouch.clientX - initialTouch.clientX;
    const diffY = lastTouch.clientY - initialTouch.clientY;
    currentTranslate = {
      x: diffX,
      y: diffY,
    };
    const minX = -elm.clientWidth * (appliedScale - 1);
    const minY = -elm.clientHeight * (appliedScale - 1);

    const translate = {
      x: Math.min(Math.max(appliedTranslate.x + diffX, minX), 0),
      y: Math.min(Math.max(appliedTranslate.y + diffY, minY), 0),
    }

    transformPinchable(translate, appliedScale);
  };

  const handleScrollEnd = (e) => {
    appliedScale = Math.max(appliedScale * currentScale, 1.0);
    currentScale = 1.0;

    const minX = -elm.clientWidth * (appliedScale - 1);
    const minY = -elm.clientHeight * (appliedScale - 1);

    appliedTranslate = {
      x: Math.min(Math.max(appliedTranslate.x + currentTranslate.x, minX), 0),
      y: Math.min(Math.max(appliedTranslate.y + currentTranslate.y, minY), 0),
    };
    currentTranslate = { x: 0.0, y: 0.0 };
  };

  const handlePinchStart = (e) => {
    const offset1 = getOffset(elm, e.targetTouches[0]);
    const offset2 = getOffset(elm, e.targetTouches[1]);

    transformOrigin = {
      x: (offset1.x + offset2.x) / 2,
      y: (offset1.y + offset2.y) / 2,
    };
  };

  const handlePinch = (e) => {
    const p1 = initialTouchPoints.findLastIndex((t) => t.identifier === e.targetTouches[0].identifier);
    const p2 = initialTouchPoints.findLastIndex((t) => t.identifier === e.targetTouches[1].identifier);

    if (p1 >= 0 && p2 >= 0) {

      const initialDist = calcurateDistance(initialTouchPoints[p1], initialTouchPoints[p2]);
      const lastDist = calcurateDistance(e.targetTouches[0], e.targetTouches[1]);
      currentScale = lastDist / initialDist;
      const scale = Math.max(appliedScale * currentScale, 1.0);

      const translateX = -transformOrigin.x * (scale - 1.0);
      const translateY = -transformOrigin.y * (scale - 1.0);

      currentTranslate = {
        x: translateX,
        y: translateY,
      };

      transformPinchable(currentTranslate, scale);
    }
  };

  const handlePinchEnd = (e) => {
    appliedScale = Math.max(appliedScale * currentScale, 1.0);
    currentScale = 1.0;
    appliedTranslate = currentTranslate;
    currentTranslate = { x: 0.0, y: 0.0 };
  };

  const calcurateDistance = (p1, p2) => Math.sqrt((p1.clientX - p2.clientX) ** 2 + (p1.clientY - p2.clientY) ** 2);

  const transformPinchable = (translate, scale) => {
    const transform = `translate(${translate.x}px, ${translate.y}px) scale(${scale})`;
    elm.style.transform = transform;

    dbg.innerHTML = `
      <div>
        <div>origin: {x: ${transformOrigin.x}, y: ${transformOrigin.y} }</div>
        <div>translate: { x: ${translate.x}, y: ${translate.y} }</div>
        <div>scale: ${scale}</div>
      </div>
    `;
  };

  const getOffset = (elm, touch) => {
    const rect = elm.getBoundingClientRect();
    const x = (touch.clientX + (elm.offsetLeft - rect.x)) / appliedScale;
    const y = (touch.clientY + (elm.offsetTop - rect.y)) / appliedScale;
    return { x, y };
  };
};