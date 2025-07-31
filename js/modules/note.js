import { state } from "./state.js";
import { notesAPI } from "./api.js";
import { showScreen } from "./ui.js";
import { showToast } from "./toast.js";
import { canvasService } from "./canvas.js";
import { locationService } from "./location.js";
import { homeController } from "./home.js";

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
    await homeController.loadNearbyNotes();
  },

  renderNote(note) {
    const container = document.getElementById("note-content");
    container.innerHTML = "";
    if (note.content.text) {
      const p = document.createElement("p");
      p.innerHTML = note.content.text;
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
  currentSlide: 0,
  init() {
    canvasService.init();
    this.setupTextControls();
    this.showSlide(this.currentSlide); // Initialize to the current slide
  },
  setupTextControls() {
    const textColorInput = document.getElementById("text-color");
    const fontSizeInput = document.getElementById("font-size");
    const noteTextInput = document.getElementById("note-text");

    if (textColorInput) {
      textColorInput.addEventListener("change", (event) => {
        document.execCommand("foreColor", false, event.target.value);
      });
    }

    if (fontSizeInput) {
      fontSizeInput.addEventListener("change", (event) => {
        // Font size needs to be applied using a font name (e.g., "1" to "7")
        // or by directly manipulating style.fontSize if execCommand is not sufficient.
        // For simplicity, we'll use execCommand with a fixed mapping for now.
        // A more robust solution might involve custom CSS classes or direct style manipulation.
        const size = event.target.value;
        // Map pixel size to execCommand font size (1-7)
        let commandSize;
        if (size <= 14) commandSize = 1;
        else if (size <= 16) commandSize = 2;
        else if (size <= 18) commandSize = 3;
        else if (size <= 24) commandSize = 4;
        else if (size <= 32) commandSize = 5;
        else commandSize = 6;
        document.execCommand("fontSize", false, commandSize);
        // After applying execCommand, we might need to manually set the px size
        // to ensure precise control and display in the editor.
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const span = document.createElement("span");
          span.style.fontSize = `${size}px`;
          range.surroundContents(span);
        }
      });
    }

    // Ensure placeholder functionality for contenteditable div
    if (noteTextInput) {
      const placeholder = noteTextInput.getAttribute('placeholder');
      if (placeholder) {
        noteTextInput.addEventListener('focus', () => {
          if (noteTextInput.textContent === placeholder) {
            noteTextInput.textContent = '';
            noteTextInput.classList.remove('placeholder-active');
          }
        });
        noteTextInput.addEventListener('blur', () => {
          if (noteTextInput.textContent.trim() === '') {
            noteTextInput.textContent = placeholder;
            noteTextInput.classList.add('placeholder-active');
          }
        });
        // Initial state
        if (noteTextInput.textContent.trim() === '') {
          noteTextInput.textContent = placeholder;
          noteTextInput.classList.add('placeholder-active');
        }
      }
    }
  },
  showSlide(index) {
    this.currentSlide = index;
    const swiperWrapper = document.querySelector(".swiper-wrapper");
    const slides = document.querySelectorAll(".swiper-slide");
    const prevSlideBtn = document.getElementById("prev-slide");
    const nextSlideBtn = document.getElementById("next-slide");

    if (swiperWrapper && slides.length > 0) {
      const slideWidth = slides[0].offsetWidth;
      swiperWrapper.style.transform = `translateX(-${index * slideWidth}px)`;

      // Update button styles
      if (index === 0) {
        prevSlideBtn.style.background = "#667eea";
        prevSlideBtn.style.color = "white";
        nextSlideBtn.style.background = "none";
        nextSlideBtn.style.color = "#667eea";
      } else {
        prevSlideBtn.style.background = "none";
        prevSlideBtn.style.color = "#667eea";
        nextSlideBtn.style.background = "#667eea";
        nextSlideBtn.style.color = "white";
        canvasService.init(); // Re-initialize canvas when switching to draw mode
      }
    }
  },
  async saveNote() {
    try {
      await locationService.getCurrentPosition();

      const textInput = document.getElementById("note-text").innerHTML;
      const drawingData = !canvasService.isCanvasEmpty()
        ? canvasService.getDataURL()
        : null;

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

      document.getElementById("note-text").innerHTML = "";
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
