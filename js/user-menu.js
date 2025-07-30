import { deleteAccount } from "./modules/auth.js";
import { goto } from "./modules/ui.js";

document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("delete-account-btn")
    .addEventListener("click", async () => {
      const ok = confirm(
        "אתה בטוח שברצונך למחוק את החשבון שלך? פעולה זו אינה ניתנת לביטול.",
      );
      if (!ok) return;

      try {
        const pwd = prompt("הכנס את הסיסמה הנוכחית כדי לאשר מחיקה:");
        if (!pwd) return alert("מחיקה בוטלה – לא הוזנה סיסמה.");
        await deleteAccount(pwd);
        alert("החשבון נמחק בהצלחה.");
        localStorage.removeItem("jwt");
        goto("login");
      } catch (err) {
        console.error("Error deleting account:", err);
        alert("אירעה שגיאה במחיקת החשבון: " + err);
      }
    });

  const backBtn = document.getElementById("user-menu-back-btn");
  if (backBtn) {
    backBtn.addEventListener("click", () => goto("home"));
  }
});