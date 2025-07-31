import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";

export function showToast(message, type = "success") {
  Toastify({
    text: message,
    duration: 3000,
    close: true,
    gravity: "top", // `top` or `bottom`
    position: "center", // `left`, `center` or `right`
    style: {
      background: type === "success" ? "#4CAF50" : "#F44336",
    },
    stopOnFocus: true, // Prevents dismissing of toast on hover
  }).showToast();
}
