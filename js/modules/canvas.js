// modules/canvas.js

let canvas;
let ctx;
let colorPicker;
let sizePicker;

let painting = false;
let brushColor = "#000000";
let brushSize = 5;

export function initCanvas() {
    canvas = document.getElementById("note-canvas");
    colorPicker = document.getElementById("brush-color");
    sizePicker = document.getElementById("brush-size");

    if (!canvas) {
        console.warn("אלמנט Canvas לא נמצא.");
        return;
    }
    ctx = canvas.getContext("2d");



    if (colorPicker) {
        colorPicker.addEventListener("input", (e) => {
            brushColor = e.target.value;
        });
    }

    if (sizePicker) {
        sizePicker.addEventListener("input", (e) => {
            brushSize = e.target.value;
        });
    }

    canvas.addEventListener("mousedown", startPaint);
    canvas.addEventListener("mouseup", stopPaint);
    canvas.addEventListener("mouseout", stopPaint);
    canvas.addEventListener("mousemove", draw);
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
    if (!painting || !ctx) return;

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

export function clearCanvas() {
    if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}