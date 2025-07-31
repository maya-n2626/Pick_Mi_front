import Toastify from "toastify-js";
import { showToast } from "./toast.js";

export function showConfirmation(message, onConfirm) {
  const toast = Toastify({
    text: `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
        <p style="margin-bottom: 10px;">${message}</p>
        <div>
          <button id="confirm-yes" class="btn-primary" style="margin-right: 10px;">Yes</button>
          <button id="confirm-no" class="btn-secondary">No</button>
        </div>
      </div>
    `,
    duration: -1, // Indefinite
    close: true,
    gravity: "top",
    position: "center",
    style: {
      background: "#333",
    },
    escapeMarkup: false,
    onClick: function () {},
    onClose: function () {},
  }).showToast();

  document.getElementById("confirm-yes").addEventListener("click", () => {
    onConfirm();
    toast.hideToast();
  });

  document.getElementById("confirm-no").addEventListener("click", () => {
    toast.hideToast();
  });
}
