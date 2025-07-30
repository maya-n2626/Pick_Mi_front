import { signup } from "./modules/auth.js";
import { goto } from "./modules/ui.js";

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("signup-form").onsubmit = async (e) => {
    e.preventDefault();
    const errEl = document.getElementById("signup-error");
    errEl.classList.add("hidden");
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;
    try {
      await signup(email, password);
      alert("נרשמת בהצלחה! אנא התחברי.");
      goto("login");
    } catch (err) {
      errEl.textContent = err;
      errEl.classList.remove("hidden");
    }
  };

  document.getElementById("back-to-login").addEventListener("click", () => {
    goto("login");
  });
});