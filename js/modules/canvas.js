// js/modules/canvas.js

let canvas; // משתנים שיימצאו על ידי initCanvas
let ctx;
let colorPicker;
let sizePicker;

let painting = false; // משתנים ששומרים את מצב הציור
let brushColor = "#000000";
let brushSize = 5;

export function isCanvasEmpty(canvas) {
  const ctx = canvas.getContext("2d");
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  return !pixels.some((channel) => channel !== 0);
}
export function initCanvas() {
  canvas = document.getElementById("note-canvas");
  colorPicker = document.getElementById("brush-color");
  sizePicker = document.getElementById("brush-size");

  if (!canvas) {
    console.warn("❗ אלמנט note-canvas לא נמצא. לא ניתן לאתחל את הקנבס.");
    return;
  }

  if (!colorPicker) console.warn("❗ פקד צבע מברשת (brush-color) לא נמצא.");
  if (!sizePicker) console.warn("❗ פקד גודל מברשת (brush-size) לא נמצא.");

  ctx = canvas.getContext("2d");

  // Set canvas dimensions to match its displayed size
  console.log("Canvas clientWidth:", canvas.clientWidth);
  console.log("Canvas clientHeight:", canvas.clientHeight);
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  if (colorPicker) {
    // הוספת מאזין רק אם הפקד קיים
    colorPicker.addEventListener("input", (e) => {
      brushColor = e.target.value;
    });
  }

  if (sizePicker) {
    // הוספת מאזין רק אם הפקד קיים
    sizePicker.addEventListener("input", (e) => {
      brushSize = e.target.value;
    });
  }

  // הוספת מאזיני אירועים לקנבס עצמו
  canvas.addEventListener("mousedown", startPaint);
  canvas.addEventListener("mouseup", stopPaint);
  canvas.addEventListener("mouseout", stopPaint);
  canvas.addEventListener("mousemove", draw);

  console.log("✅ Canvas initialized and listeners added.");
}

function startPaint(e) {
  painting = true;
  draw(e);
}

function stopPaint() {
  painting = false;
  ctx.beginPath();
}

function draw(e) {
  if (!painting || !ctx || !canvas) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  ctx.lineWidth = brushSize;
  ctx.lineCap = "round";
  ctx.strokeStyle = brushColor;

  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
}

