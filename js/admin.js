import { fetchAllUsers, fetchAllNotes } from "./modules/admin.js";
import { goto } from "./modules/ui.js";

document.addEventListener("DOMContentLoaded", () => {
  fetchAllUsers();
  fetchAllNotes();

  document.getElementById("admin-back").addEventListener("click", () => {
    goto("home");
  });
});