import { state } from "./state.js";
import { showScreen } from "./ui.js";
import { authAPI } from "./api.js";
import { showToast } from "./toast.js";
import { showConfirmation } from "./confirmation.js";
import { homeController } from "./home.js";

export const authController = {
  init() {
    const token = localStorage.getItem("jwt");
    if (token) {
      const userPayload = this.decodeJwt(token);
      if (userPayload) {
        state.currentUser = {
          token: token,
          user: userPayload,
        };
      } else {
        // Clear invalid token
        localStorage.removeItem("jwt");
      }
    }
  },

  decodeJwt(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid JWT');
      return JSON.parse(atob(parts[1]));
    } catch (e) {
      console.error("Failed to decode JWT:", e);
      return null;
    }
  },

  getUser() {
    return state.currentUser?.user;
  },

  getToken() {
    return state.currentUser?.token;
  },

  isAdmin() {
    return this.getUser()?.role === 'admin';
  },

  async signin(email, password) {
    const response = await authAPI.signin(email, password);

    const token = response.token;
    if (token) {
      localStorage.setItem("jwt", token);
      this.init(); // Re-initialize auth state from new token
    }
    return response;
  },

  logout() {
    localStorage.removeItem("jwt");
    state.currentUser = null;
    showScreen("login-screen");
    homeController.setupAdminButton(); // Update admin button visibility on logout
  },
};

export async function initAuth() {
  authController.init();

  document
    .getElementById("login-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;
      try {
        await authController.signin(email, password);
        showScreen("home-screen");
        const { initHome } = await import("./home.js");
        initHome();
      } catch (error) {
        showToast(error.message, "error");
      }
    });

  document
    .getElementById("signup-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("signup-email").value.trim();
      const password = document.getElementById("signup-password").value;
      try {
        await authAPI.signup(email, password);
        showToast("Account created successfully! Please sign in.");
        showScreen("login-screen");
      } catch (error) {
        showToast(error.message, "error");
      }
    });

  document
    .getElementById("forgot-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("forgot-email").value.trim();
      try {
        await authAPI.forgotPassword(email);
        showToast(
          "If an account with that email exists, a password reset link has been sent.",
        );
        showScreen("login-screen");
      } catch (error) {
        showToast(error.message, "error");
      }
    });

  document
    .getElementById("logout-btn")
    .addEventListener("click", () => authController.logout());

  document
    .getElementById("delete-account-btn")
    .addEventListener("click", async () => {
      showConfirmation(
        "Are you sure you want to delete your account? This cannot be undone.",
        async () => {
          const password = prompt(
            "Enter your current password to confirm account deletion:",
          );
          if (!password) return;
          try {
            await authAPI.deleteAccount(password);
            showToast("Account deleted successfully.");
            authController.logout();
          } catch (error) {
            console.error("Error deleting account:", error);
            showToast(`Error deleting account: ${error.message}`, "error");
          }
        },
      );
    });

    const urlParams = new URLSearchParams(window.location.search);
    if (window.location.pathname.includes("reset-password") && urlParams.has("token")) {
        showScreen("reset-password-screen");
        // resetPasswordController.init();
    } else if (authController.getUser()) {
        showScreen("home-screen");
        const { initHome } = await import("./home.js");
        initHome();
    } else {
        showScreen("login-screen");
    }
}
