import { resetPassword } from "./modules/auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("reset-password-form");
  const errorEl = document.getElementById("reset-error");
  const successEl = document.getElementById("reset-success");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.style.display = "none";
    successEl.style.display = "none";

    const password = document.getElementById("reset-password").value;
    const confirmPassword = document.getElementById("reset-password-confirm").value;

    if (password !== confirmPassword) {
      errorEl.textContent = "Passwords do not match.";
      errorEl.style.display = "block";
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
      errorEl.textContent = "Invalid or missing reset token.";
      errorEl.style.display = "block";
      return;
    }

    try {
      await resetPassword(token, password);
      successEl.textContent = "Your password has been reset successfully! You can now log in.";
      successEl.style.display = "block";
      form.reset();
    } catch (err) {
      errorEl.textContent = err.message || "An error occurred. Please try again.";
      errorEl.style.display = "block";
    }
  });
});