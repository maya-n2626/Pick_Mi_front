import { initAuth } from "./modules/auth.js";
import { initNote } from "./modules/note.js";
import { initMap } from "./modules/map.js";
import { initAdmin } from "./modules/admin.js";
import { showScreen } from "./modules/ui.js";
import { noteEditorController } from "./modules/note.js";
import { initResetPassword } from "./modules/resetPassword.js";
import { authController } from "./modules/auth.js";
import { initHome } from "./modules/home.js";

document.addEventListener("DOMContentLoaded", () => {
  initAuth();
  initNote();

  const navButtons = {
    "show-map": "map-screen",
    "show-profile": "profile-screen",
    "admin-btn": "admin-screen",
    "new-note-btn": "note-editor-screen",
    "back-from-map": "home-screen",
    "back-from-editor": "home-screen",
    "back-from-profile": "home-screen",
    "back-from-admin": "home-screen",
    "show-signup": "signup-screen",
    "show-forgot": "forgot-screen",
    "back-to-login": "login-screen",
    "back-to-login-2": "login-screen",
  };

  for (const [btnId, screenId] of Object.entries(navButtons)) {
    document.getElementById(btnId).addEventListener("click", async () => {
      showScreen(screenId);
      if (btnId === "show-map") await initMap();
      if (btnId === "admin-btn") await initAdmin();
      if (btnId === "new-note-btn") {
        noteEditorController.init();
        noteEditorController.showSlide(0); // Show text editor by default
      }
    });
  }

  // Note editor slide navigation
  const prevSlideBtn = document.getElementById("prev-slide");
  const nextSlideBtn = document.getElementById("next-slide");

  if (prevSlideBtn) {
    prevSlideBtn.addEventListener("click", () => noteEditorController.showSlide(0));
  }
  if (nextSlideBtn) {
    nextSlideBtn.addEventListener("click", () => noteEditorController.showSlide(1));
  }

  const urlParams = new URLSearchParams(window.location.search);
  if (window.location.pathname.includes("reset-password") && urlParams.has("token")) {
    showScreen("reset-password-screen");
    initResetPassword();
  } else if (authController.getUser()) {
    showScreen("home-screen");
    initHome();
  } else {
    showScreen("login-screen");
  }

  console.log("PickMi SPA initialized");
});
