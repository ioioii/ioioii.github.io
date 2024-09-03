const pinchable = (elm) => {
  elm.classList.add('pinchable');

  let initialTouchPoints = [];
  let transformOrigin = { x: 0, y: 0 };
  let currentScale = 1.0;
  let appliedScale = 1.0;

  const dbg = document.querySelector('#debug');

  elm.addEventListener('touchstart', (e) => {
    e.preventDefault();

    if (e.targetTouches.length === 2) {
      handlePinchStart(e);
    }
  });

  elm.addEventListener('touchmove', (e) => {
    e.preventDefault();

    if (e.targetTouches.length === 2 && e.changedTouches.length === 2) {
      handlePinch(e);
    }
  });

  elm.addEventListener('touchend', (e) => {
    e.preventDefault();

    if (e.targetTouches.length === 0) {
      handelPinchEnd();
    }
  });

  elm.addEventListener('touchcancel', (e) => {

  });

  const handlePinchStart = (e) => {
    for (let i = 0; i < e.targetTouches.length; i++) {
      initialTouchPoints.push(e.targetTouches[i]);
    }

    const offset1 = getOffset(elm, e.targetTouches[0]);
    const offset2 = getOffset(elm, e.targetTouches[1]);

    transformOrigin = {
      x: (offset1.x + offset2.x) / 2 / appliedScale,
      y: (offset1.y + offset2.y) / 2 / appliedScale,
    };
  };

  const handelPinchEnd = (e) => {
    initialTouchPoints = [];
    appliedScale = Math.max(appliedScale * currentScale, 1.0);
    currentScale = 1.0;
  };

  const handlePinch = (e) => {
    const p1 = initialTouchPoints.findLastIndex((t) => t.identifier === e.targetTouches[0].identifier);
    const p2 = initialTouchPoints.findLastIndex((t) => t.identifier === e.targetTouches[1].identifier);

    if (p1 >= 0 && p2 >= 0) {
      const initialDist = calcurateDistance(initialTouchPoints[p1], initialTouchPoints[p2]);
      const lastDist = calcurateDistance(e.targetTouches[0], e.targetTouches[1]);
      currentScale = (lastDist / initialDist);
      const scale = Math.max(appliedScale * currentScale, 1.0);

      const translateX = transformOrigin.x * (scale - 1.0);
      const translateY = transformOrigin.y * (scale - 1.0);
      const maxTranslateX = elm.clientWidth * (scale - 1.0);
      const maxTranslateY = elm.clientHeight * (scale - 1.0);

      const translate = {
        x: -Math.min(translateX, maxTranslateX),
        y: -Math.min(translateY, maxTranslateY),
      };

      transformPinchable(translate, scale);
    }
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
    const x = touch.clientX - (rect.x - elm.offsetLeft);
    const y = touch.clientY - (rect.y - elm.offsetTop);
    return { x, y };
  };
};