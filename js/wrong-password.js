import { goto } from "./modules/ui.js";

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("wrong-back").onclick = () => {
    goto("login");
  };
  document.getElementById("wrong-forgot").onclick = () =>
    goto("forgot-password");
});