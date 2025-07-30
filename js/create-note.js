import { throwNote } from "./modules/notes.js";
import { goto } from "./modules/ui.js";
import { initCanvas, isCanvasEmpty } from "./modules/canvas.js";
import { getUser } from "./modules/auth.js";
import { lastKnownLocation, updateCurrentLocation } from "./modules/location.js";

// Check if user is logged in
if (!getUser()) {
  goto("login");
}

document.addEventListener("DOMContentLoaded", function () {
  initCanvas();

  updateCurrentLocation().catch((err) => {
    console.warn("⚠️ Could not get location in create-note:", err);
    alert("לא ניתן לקבל מיקום. לא ניתן לשמור את הפתק.");
  });

  const saveBtn = document.getElementById("save-note-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const textInput = document.getElementById("note-text");
      const canvas = document.getElementById("note-canvas");

      const text = textInput ? textInput.value.trim() : "";
      let drawingData = null;
      if (canvas && !isCanvasEmpty(canvas)) {
        drawingData = canvas.toDataURL();
      }

      if (!text && !drawingData) {
        alert("Please write something or draw something before saving.");
        return;
      }

      await throwNote(
        text,
        drawingData,
        lastKnownLocation.lat,
        lastKnownLocation.lon,
        lastKnownLocation.placeId,
      );
      goto("home");
    });
  }

  const cancelBtn = document.getElementById("cancel-note-btn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      goto("home");
    });
  }

  const clearCanvasBtn = document.getElementById("clear-canvas-btn");
  if (clearCanvasBtn) {
    clearCanvasBtn.addEventListener("click", () => {
      const canvas = document.getElementById("note-canvas");
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  }

  const noteText = document.getElementById("note-text");
  const textColorPicker = document.getElementById("text-color");

  if (noteText && textColorPicker) {
    textColorPicker.addEventListener("input", () => {
      noteText.style.color = textColorPicker.value;
    });
  }

  const brushColorPicker = document.getElementById("brush-color");
  const brushSizeSlider = document.getElementById("brush-size");

  if (brushColorPicker) {
    brushColorPicker.addEventListener("input", () => {
      document.documentElement.style.setProperty('--brush-color', brushColorPicker.value);
    });
  }

  if (brushSizeSlider) {
    brushSizeSlider.addEventListener("input", () => {
      document.documentElement.style.setProperty('--brush-size', brushSizeSlider.value + 'px');
    });
  }

  const textSection = document.getElementById('text-note-section');
  const brushSection = document.getElementById('brush-note-section');
  const toggleTextBtn = document.getElementById('toggle-text-btn');
  const toggleBrushBtn = document.getElementById('toggle-brush-btn');

  toggleTextBtn.addEventListener('click', () => {
    textSection.style.display = 'block';
    brushSection.style.display = 'none';
  });

  toggleBrushBtn.addEventListener('click', () => {
    textSection.style.display = 'none';
    brushSection.style.display = 'block';
  });

});