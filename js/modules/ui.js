// modules/uis.js
import { getNearbyNotes } from './notes.js'; 
import { API_BASE, jwt, apiFetch } from './auth.js'; 

export function show(screenId) {
  document.querySelectorAll(
    ".container, #home-bg, #home-content, #map-screen, #settings-screen"
  ).forEach(el => el.classList.add("hidden"));
  document.getElementById(screenId).classList.remove("hidden");
  if (screenId === "home-content") {
    document.getElementById("home-bg").classList.remove("hidden");
  }
}

export function gotoLogin() {
      console.log("🔵 gotoLogin called");

    document.getElementById("login-error").classList.add("hidden");
    show("login-screen");
  }



// openNoteAndShow - יש להעביר את הפונקציה הזו לפה אם היא לא גלובלית ב-script.js
// או ליצור מנגנון קריאה אחר (למשל, EventEmitter)
/*
export async function openNoteAndShow(noteId) {
    // ... הקוד של הפונקציה ...
}
*/