import { getNoteContent, deleteNote } from "./modules/notes.js";
import { goto } from "./modules/ui.js";

document.addEventListener("DOMContentLoaded", async () => {
  const noteId = localStorage.getItem("noteId");
  const storedLocation = localStorage.getItem("lastKnownLocation");
  let lastKnownLocation = null;

  if (storedLocation) {
    lastKnownLocation = JSON.parse(storedLocation);
  }

  if (!noteId || !lastKnownLocation) {
    goto("home");
    return;
  }

  const note = await getNoteContent(noteId, lastKnownLocation.lat, lastKnownLocation.lon);

  const contentDiv = document.getElementById("note-content");
  contentDiv.innerHTML = "";
  contentDiv.style.position = "relative";
  const backgroundImg = document.createElement("img");
  backgroundImg.classList.add("note-background");
  backgroundImg.src = note.content.drawingData
    ? "/images/WriteBrush.png"
    : "/images/WritePen (1).png";
  contentDiv.appendChild(backgroundImg);
  if (note.content.text) {
    const p = document.createElement("p");
    p.textContent = note.content.text;
    p.classList.add("note-text");
    contentDiv.appendChild(p);
  }
  if (note.content.drawingData) {
    const img = document.createElement("img");
    img.src = note.content.drawingData;
    img.alt = "ציור";
    img.style.maxWidth = "100%";
    img.style.display = "block";
    img.classList.add("note-canvas");
    contentDiv.appendChild(img);
  }

  document
    .getElementById("close-note-btn")
    .addEventListener("click", async () => {
      try {
        await deleteNote(noteId, lastKnownLocation.lat, lastKnownLocation.lon);
      } catch (e) {
        console.warn("המחיקה נכשלה", e);
      }
      localStorage.removeItem("noteId");
      goto("home");
    });
});