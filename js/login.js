import { signin } from "./modules/auth.js";
import { goto } from "./modules/ui.js";

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("to-signup").onclick = () => {
    goto("signup");
  };

  document.getElementById("login-form").onsubmit = async (e) => {
    e.preventDefault();
    try {
      const email = document.getElementById("login-email").value.trim();
      const pwd = document.getElementById("login-password").value.trim();
      await signin(email, pwd);
      goto("home");
    } catch (_) {
      goto("wrong-password");
    }
  };

  document.getElementById("to-forgot").onclick = () =>
    goto("forgot-password");
});