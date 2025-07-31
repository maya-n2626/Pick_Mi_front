import { authAPI } from "./api.js";
import { showToast } from "./toast.js";

const resetPasswordController = {
  init() {
    const form = document.getElementById("reset-password-form");
    form.addEventListener("submit", this.handleSubmit.bind(this));
  },
  async handleSubmit(e) {
    e.preventDefault();
    
    const newPassword = document.getElementById("reset-password").value;
    const confirmPassword = document.getElementById("reset-password-confirm").value;

    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
      showToast("Invalid or missing reset token.", "error");
      return;
    }

    try {
      await authAPI.resetPassword(token, newPassword);
      showToast("Your password has been reset successfully! You can now log in.");
      e.target.reset();
    } catch (err) {
      showToast(err.message || "An error occurred. Please try again.", "error");
    }
  },
};

export function initResetPassword() {
    resetPasswordController.init();
}
