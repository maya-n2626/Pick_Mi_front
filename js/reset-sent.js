import { goto } from "./modules/ui.js";

document.addEventListener("DOMContentLoaded", function () {
  const sentBackBtn = document.getElementById("sent-back");
  if (sentBackBtn) {
    sentBackBtn.addEventListener("click", () => {
      goto("login");
    });
  }
});