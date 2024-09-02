const pinchable = (elm) => {
  elm.classList.add('pinchable');

  let touchPoints = [];
  let currentScale = 1.0;
  let appliedScale = 1.0;

  const dbg = document.querySelector('#debug');

  elm.addEventListener('touchstart', (e) => {
    e.preventDefault();

    if (e.targetTouches.length === 2) {
      for (let i = 0; i < e.targetTouches.length; i++) {
        touchPoints.push(e.targetTouches[i]);
      }
    }

    updateBackground(e);
  });

  elm.addEventListener('touchmove', (e) => {
    e.preventDefault();

    if (!(e.touches.length === 2 && e.targetTouches.length === 2)) {
      updateBackground(e);
    }

    if (e.targetTouches.length === 2 && e.changedTouches.length === 2) {
      handlePinch(e);
    }
  });

  elm.addEventListener('touchcancel', (e) => {

  });

  elm.addEventListener('touchend', (e) => {
    e.preventDefault();

    if (e.targetTouches.length === 0) {
      e.target.style.background = 'black';
      appliedScale += currentScale;
      currentScale = 0.0;
    }
  });

  const handlePinch = (e) => {
    const p1 = touchPoints.findLastIndex((t) => t.identifier === e.targetTouches[0].identifier);
    const p2 = touchPoints.findLastIndex((t) => t.identifier === e.targetTouches[1].identifier);

    if (p1 >= 0 && p2 >= 0) {
      const initialDiffX = calcrateDiffX(touchPoints[p1], touchPoints[p2]);
      const initialDiffY = calcrateDiffY(touchPoints[p1], touchPoints[p2]);
      const lastDiffX = calcrateDiffX(e.targetTouches[0], e.targetTouches[1]);
      const lastDiffY = calcrateDiffY(e.targetTouches[0], e.targetTouches[1]);
      const diffX = lastDiffX - initialDiffX;
      const diffY = lastDiffY - initialDiffY;
      const diff = (Math.abs(diffX) > Math.abs(diffY)) ? diffX : diffY;
      currentScale = diff / 1000;
      transformPinchable({ x: 0, y: 0 }, appliedScale + currentScale);
    }
  };

  const calcrateDiffX = (p1, p2) => Math.abs(p1.clientX - p2.clientX);
  const calcrateDiffY = (p1, p2) => Math.abs(p1.clientY - p2.clientY);

  const transformPinchable = (center = {x: 0, y: 0}, scale = 1.0) => {
    const transform = `translate(${center.x}, ${center.y}) scale(${scale})`;
    elm.style.transform = transform;
  };

  const updateBackground = (e) => {
    switch (e.targetTouches.length) {
      case 1:
        dbg.style.background = 'yellow';
        break;
      case 2:
        dbg.style.background = 'pink';
        break;
      default:
        dbg.style.background = 'lightblue';
        break;
    }
  };
};