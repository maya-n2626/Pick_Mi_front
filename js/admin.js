import { fetchAllUsers, fetchAllNotes } from "./modules/admin.js";
import { goto } from "./modules/ui.js";
import { getUser } from "./modules/auth.js";

// Check if user is logged in
if (!getUser()) {
  goto("login");
}

document.addEventListener("DOMContentLoaded", () => {
  fetchAllUsers();
  fetchAllNotes();

  document.getElementById("admin-back").addEventListener("click", () => {
    goto("home");
  });
});