import { forgotPassword } from "./modules/auth.js";
import { goto } from "./modules/ui.js";

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("forgot-form").onsubmit = async (e) => {
    e.preventDefault();
    const errEl = document.getElementById("forgot-error");
    errEl.classList.add("hidden");
    try {
      const email = document.getElementById("forgot-email").value.trim();
      await forgotPassword(email);
      goto("reset-sent");
    } catch (err) {
      errEl.textContent = err;
      errEl.classList.remove("hidden");
    }
  };
  const forgotBackBtn = document.getElementById("forgot-back-to-login");
  if (forgotBackBtn) {
    forgotBackBtn.addEventListener("click", () => {
      goto("login");
    });
  }
});