import { state } from "./state.js";

export const canvasService = {
  init() {
    const canvas = document.getElementById("drawing-canvas");
    if (!canvas) return;

    state.canvas = canvas;
    state.ctx = canvas.getContext("2d");

    // Set canvas dimensions to match its displayed size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let painting = false;

    const startPaint = (e) => {
      painting = true;
      this.draw(e);
    };

    const stopPaint = () => {
      painting = false;
      state.ctx.beginPath();
    };

    this.draw = (e) => {
      if (!painting) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const brushColor = document.getElementById("brush-color").value;
      const brushSize = document.getElementById("brush-size").value;

      state.ctx.lineWidth = brushSize;
      state.ctx.lineCap = "round";
      state.ctx.strokeStyle = brushColor;

      state.ctx.lineTo(x, y);
      state.ctx.stroke();
      state.ctx.beginPath();
      state.ctx.moveTo(x, y);
    };

    canvas.addEventListener("mousedown", startPaint);
    canvas.addEventListener("mouseup", stopPaint);
    canvas.addEventListener("mouseout", stopPaint);
    canvas.addEventListener("mousemove", this.draw);

    // Handle canvas resizing
    window.addEventListener("resize", () => {
      const img = state.ctx.getImageData(0, 0, state.canvas.width, state.canvas.height);
      state.canvas.width = state.canvas.offsetWidth;
      state.canvas.height = state.canvas.offsetHeight;
      state.ctx.putImageData(img, 0, 0);
    });

    // Touch events for mobile
    canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent("mousedown", {
        clientX: touch.clientX,
        clientY: touch.clientY,
      });
      canvas.dispatchEvent(mouseEvent);
    });

    canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent("mousemove", {
        clientX: touch.clientX,
        clientY: touch.clientY,
      });
      canvas.dispatchEvent(mouseEvent);
    });

    canvas.addEventListener("touchend", (e) => {
      e.preventDefault();
      const mouseEvent = new MouseEvent("mouseup", {});
      canvas.dispatchEvent(mouseEvent);
    });
  },

  clear() {
    if (state.canvas && state.ctx) {
      state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
    }
  },

  getDataURL() {
    return state.canvas ? state.canvas.toDataURL() : null;
  },
  isCanvasEmpty() {
    const pixels = state.ctx.getImageData(
      0,
      0,
      state.canvas.width,
      state.canvas.height,
    ).data;
    return !pixels.some((channel) => channel !== 0);
  },
};
