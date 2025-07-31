import { state } from "./state.js";
import { notesAPI } from "./api.js";
import { showScreen } from "./ui.js";
import { showToast } from "./toast.js";
import { canvasService } from "./canvas.js";
import { locationService } from "./location.js";

const noteViewController = {
  async loadNote(noteId, clickX = '50%', clickY = '50%') {
    try {
      const note = await notesAPI.getNoteContent(
        noteId,
        state.currentLocation.lat,
        state.currentLocation.lon,
      );
      this.renderNote(note);
      const noteViewScreen = document.getElementById("note-view-screen");
      noteViewScreen.style.transformOrigin = `${clickX} ${clickY}`;
      showScreen("note-view-screen");
      // Delete the note in the background after showing it.
      notesAPI
        .deleteNote(
          noteId,
          state.currentLocation.lat,
          state.currentLocation.lon,
        )
        .catch((err) => console.error("Failed to delete note:", err));
    } catch (error) {
      console.error("Error loading note:", error);
      showToast(`Error loading note: ${error.message}`, "error");
      // If loading fails, go back and refresh to remove the potentially broken note.
      this.closeNote();
    }
  },

  async closeNote() {
    showScreen("home-screen");
    const { homeController } = await import("./home.js");
    await homeController.loadNearbyNotes();
  },

  renderNote(note) {
    const container = document.getElementById("note-content");
    container.innerHTML = "";
    if (note.content.text) {
      const p = document.createElement("p");
      p.textContent = note.content.text;
      p.style.cssText =
        "font-size: 18px; line-height: 1.6; margin-bottom: 20px;";
      container.appendChild(p);
    }
    if (
      note.content.drawingData &&
      note.content.drawingData !==
        "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjwvc3ZnPg=="
    ) {
      const img = document.createElement("img");
      img.src = note.content.drawingData;
      img.style.cssText = "max-width: 100%; border-radius: 12px;";
      container.appendChild(img);
    }
  },
};

const noteEditorController = {
  init() {
    canvasService.init();
    this.setupModeToggle();
  },
  setupModeToggle() {
    const textMode = document.getElementById("text-mode");
    const drawMode = document.getElementById("draw-mode");
    const textEditor = document.getElementById("text-editor");
    const drawEditor = document.getElementById("draw-editor");
    textMode.addEventListener("click", () => {
      textEditor.style.display = "block";
      drawEditor.style.display = "none";
      textMode.style.background = "#667eea";
      textMode.style.color = "white";
      drawMode.style.background = "none";
      drawMode.style.color = "#667eea";
    });
    drawMode.addEventListener("click", () => {
      textEditor.style.display = "none";
      drawEditor.style.display = "block";
      drawMode.style.background = "#667eea";
      drawMode.style.color = "white";
      textMode.style.background = "none";
      textMode.style.color = "#667eea";
      canvasService.init();
    });
  },
  async saveNote() {
    try {
      await locationService.getCurrentPosition();

      const textInput = document.getElementById("note-text").value;
      const drawingData = !canvasService.isCanvasEmpty()
        ? canvasService.getDataURL()
        : null;

      if (!textInput.trim()) {
        showToast("Please add some text to your note", "error");
        return;
      }

      if (!textInput.trim() && !drawingData) {
        showToast("Please add some content to your note", "error");
        return;
      }

      const text = textInput.trim(); // Send empty string if only drawing is present

      await notesAPI.createNote(
        text,
        drawingData,
        state.currentLocation.lat,
        state.currentLocation.lon,
        state.currentLocation.placeId,
      );

      document.getElementById("note-text").value = "";
      canvasService.clear();
      showScreen("home-screen");
      await homeController.loadNearbyNotes();
    } catch (error) {
      console.error("Error saving note:", error);
      showToast(`Error saving note: ${error.message}`, "error");
    }
  },
};

export function initNote() {
    document
        .getElementById("back-from-note")
        .addEventListener("click", () => noteViewController.closeNote());
    document
        .getElementById("save-note")
        .addEventListener("click", () => noteEditorController.saveNote());
    document
        .getElementById("clear-canvas")
        .addEventListener("click", () => canvasService.clear());
}

export { noteViewController, noteEditorController };
