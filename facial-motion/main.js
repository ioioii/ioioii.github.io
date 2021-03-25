const canvas = document.querySelector('#canvas');
const img = document.querySelector('#image');
const context = canvas.getContext('2d');
const canvasWidth = canvas.clientWidth;
const canvasHeight = canvas.clientHeight;

const POINTS = [
  { x: 265, y: 419 }, // center
  { x: 100, y: 390 }, // left
  { x: 478, y: 406 }, // right
  { x: 282, y: 249 }, // top
  { x: 267, y: 580 }, // bottom
];
const INITIAL_CENTER = { ...POINTS[0] };

const MIN_X = Math.min(...POINTS.map(p => p.x));
const MIN_Y = Math.min(...POINTS.map(p => p.y));
const MAX_X = Math.max(...POINTS.map(p => p.x));
const MAX_Y = Math.max(...POINTS.map(p => p.y));

const render = () => {

  context.drawImage(img, 800, 500, 800, 800, 0, 0, canvasWidth, canvasHeight);

  const source = context.getImageData(0, 0, canvasWidth, canvasHeight);
  const pixels = [];
  const center = POINTS[0];

  for (let y = 0; y < source.height; y++) {
    for (let x = 0; x < source.width; x++) {
      const idx = (y * source.width + x) * 4;
      
      if (x <= MIN_X || MAX_X <= x || y <= MIN_Y || MAX_Y <= y) {
        const r = source.data[idx + 0];
        const g = source.data[idx + 1];
        const b = source.data[idx + 2];
        const a = source.data[idx + 3];
        pixels.push(r, g, b, a);
        continue;
      }

      let sourceX;
      if (x <= center.x) {
        const d = (x - MIN_X) / (center.x - MIN_X);
        sourceX = Math.floor((INITIAL_CENTER.x - MIN_X) * d + MIN_X);
      } else {
        const d = (x - center.x) / (MAX_X - center.x);
        sourceX = Math.floor((MAX_X - INITIAL_CENTER.x) * d + INITIAL_CENTER.x);
      }

      let sourceY;
      if (y <= center.y) {
        const d = (y - MIN_Y) / (center.y - MIN_Y);
        sourceY = Math.floor((INITIAL_CENTER.y - MIN_Y) * d + MIN_Y);
      } else {
        const d = (y - center.y) / (MAX_Y - center.y);
        sourceY = Math.floor((MAX_Y - INITIAL_CENTER.y) * d + INITIAL_CENTER.y);
      }

      const sourceIdx = (sourceY * source.width + sourceX) * 4;
      pixels.push(
        source.data[sourceIdx + 0],
        source.data[sourceIdx + 1],
        source.data[sourceIdx + 2],
        source.data[sourceIdx + 3]);
    }
  }

  const dest = new ImageData(new Uint8ClampedArray(pixels), source.width, source.height);
  context.putImageData(dest, 0, 0);

  POINTS.forEach(p => {
    context.beginPath();
    context.ellipse(p.x, p.y, 5, 5, 0, 0, 2*Math.PI);
    context.fill();
  });
};

img.addEventListener('load', e => {
  render();
});

canvas.addEventListener('click', e => {
  console.log(e);
  POINTS[0].x = e.clientX;
  POINTS[0].y = e.clientY;
  render();
});