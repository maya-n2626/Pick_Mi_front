import { getNoteContent, deleteNote } from "./modules/notes.js";
import { goto } from "./modules/ui.js";
import { getUser } from "./modules/auth.js";
import { lastKnownLocation, updateCurrentLocation } from "./modules/location.js";

// Check if user is logged in
if (!getUser()) {
  goto("login");
}

window.initNoteContentMap = async function () {
  try {
    await updateCurrentLocation();
  } catch (err) {
    console.warn("⚠️ Could not get location in note-content:", err);
    alert("לא ניתן לקבל מיקום. לא ניתן להציג את הפתק.");
    goto("home");
    return;
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  const noteId = localStorage.getItem("noteId");

  console.log("note-content.js: noteId =", noteId);

  console.log("note-content.js: lastKnownLocation (after update) =", lastKnownLocation);

  if (!noteId || lastKnownLocation.lat === null) { // Check if lastKnownLocation.lat is null
    console.log("note-content.js: Redirecting to home due to missing noteId or location.");
    goto("home");
    return;
  }

  const note = await getNoteContent(noteId, lastKnownLocation.lat, lastKnownLocation.lon);
  console.log("note-content.js: Fetched note data:", note);

  const contentDiv = document.getElementById("note-content");
  console.log("note-content.js: contentDiv element:", contentDiv);
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
    console.log("note-content.js: Text content added.");
  }
  if (note.content.drawingData) {
    const img = document.createElement("img");
    img.src = note.content.drawingData;
    img.alt = "ציור";
    img.style.maxWidth = "100%";
    img.style.display = "block";
    img.classList.add("note-canvas");
    contentDiv.appendChild(img);
    console.log("note-content.js: Drawing data image added.");
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