


document.addEventListener("DOMContentLoaded", function() {

  // === Auth Endpoints ===

// === Constants & Tokens ===
  const API_BASE = "http://localhost:3000";
  const jwt = () => localStorage.getItem("jwt") || "";


  // === API Wrapper ===
  async function apiFetch(path, options = {}) {
    const headers = options.headers || {};
    if (!headers.Authorization && jwt()) headers.Authorization = "Bearer " + jwt();
    if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
    const res = await fetch(API_BASE + path, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw err.error?.message || res.statusText;
    }
    return res.status !== 204 ? res.json() : {};
  }


  async function signup(email, password) {
    return apiFetch("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  }

  async function signin(email, password) {
    try {
      const response = await apiFetch("/api/auth/signin", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      console.log("signin response:", response);
      const { token, user } = response;
      localStorage.setItem("jwt", token);
      localStorage.setItem("user", JSON.stringify(user));

      return { user, token };
    } catch (err) {
      console.error("signin failed:", err);
      throw err;
    }
  }

async function forgotPassword(email) {
    return apiFetch("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email })
    });
  }

  async function resetPassword(token, newPassword) {
    return apiFetch("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword })
    });
  }

   async function deleteAccount(password) {
    return apiFetch("/api/auth/me", {
      method: "DELETE",
      body: JSON.stringify({ password })
    });
  }

  // === Event Listeners & Flow ===
  
    // 0. מ‑Login ל‑Signup
    document.getElementById("to-signup").onclick = () => {
      document.getElementById("signup-error").classList.add("hidden");
      show("signup-screen");
    };
  
    // 1. חזרה מ‑Signup ל‑Login
    document.getElementById("signup-back").onclick = gotoLogin;
  
    // 2. טיפול ב‑Signup
    document.getElementById("signup-form").onsubmit = async e => {
      e.preventDefault();
      const errEl = document.getElementById("signup-error");
      errEl.classList.add("hidden");
      const email = document.getElementById("signup-email").value.trim();
      const password = document.getElementById("signup-password").value;
      try {
        await signup(email, password);
        alert("נרשמת בהצלחה! אנא התחברי.");
        show("login-screen");
      } catch (err) {
        errEl.textContent = err;
        errEl.classList.remove("hidden");
      }
    };
  
    // 3. Sign In
    document.getElementById("login-form").onsubmit = async e => {
      e.preventDefault();
      try {
        const email = document.getElementById("login-email").value.trim();
        const pwd = document.getElementById("login-password").value;
        await signin(email, pwd);
        gotoHome();
      } catch (_) {
        show("wrong-password-screen");
      }
    };
  
    // 4. Wrong Password Screen
    document.getElementById("wrong-back").onclick = gotoLogin;
    document.getElementById("wrong-forgot").onclick = () =>
      show("forgot-password-screen");
  
    // 5. Forgot Password Flow
    document.getElementById("to-forgot").onclick = () =>
      show("forgot-password-screen");
    document.getElementById("forgot-form").onsubmit = async e => {
      e.preventDefault();
      const errEl = document.getElementById("forgot-error");
      errEl.classList.add("hidden");
      try {
        const email = document.getElementById("forgot-email").value.trim();
        await forgotPassword(email);
        show("reset-sent-screen");
      } catch (err) {
        errEl.textContent = err;
        errEl.classList.remove("hidden");
      }
      
    };
    const forgotBackBtn = document.getElementById("forgot-back-to-login");
  if (forgotBackBtn) {
    forgotBackBtn.addEventListener("click", () => {
      gotoLogin();     
    });
  }
    
    //6.Sent back screen

   const sentBackBtn = document.getElementById("sent-back");
   console.log("sent-back element:", sentBackBtn);

   if (sentBackBtn) {
    sentBackBtn.addEventListener("click", gotoLogin);
   }
  
  

  // === Notes Endpoints ===
  async function throwNote(text, drawingData, lat, lon, placeId) {
    return apiFetch("/api/notes", {
      method: "POST",
      body: JSON.stringify({
        content: { text, drawingData },
        location: { latitude: lat, longitude: lon, placeId }
      })
    });
  }
  async function getNearbyNotes(lat, lon, radius = 500) {
    return apiFetch(`/api/notes/nearby?lat=${lat}&lon=${lon}&radius=${radius}`);
  }
  async function getNoteContent(id, lat, lon) {
    return apiFetch(`/api/notes/${id}?lat=${lat}&lon=${lon}`);
  }
  async function deleteNote(id, lat, lon) {
    return apiFetch(`/api/notes/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ latitude: lat, longitude: lon })
    });
  }

  // === Admin Endpoints ===
  async function getAllUsers() { return apiFetch("/api/admin/users"); }
  async function getAllNotesAdmin() { return apiFetch("/api/admin/notes"); }
  async function getUserById(userId) { return apiFetch(`/api/admin/users/${userId}`); }
  async function getNoteById(noteId) { return apiFetch(`/api/admin/notes/${noteId}`); }
  async function getUserNotes(userId) { return apiFetch(`/api/admin/users/${userId}/notes`); }
  async function deleteUser(userId) { return apiFetch(`/api/admin/users/${userId}`, { method: "DELETE" }); }
  async function deleteNoteAdmin(noteId) { return apiFetch(`/api/admin/notes/${noteId}`, { method: "DELETE" }); }

  // === UI Navigation & Screens ===
  function show(screenId) {
  document.querySelectorAll(
    ".container, #home-bg, #home-content, #map-screen, #settings-screen"
  ).forEach(el => el.classList.add("hidden"));
  document.getElementById(screenId).classList.remove("hidden");
  if (screenId === "home-content") {
    document.getElementById("home-bg").classList.remove("hidden");
  }
}


  function gotoLogin() {
      console.log("🔵 gotoLogin called");

    document.getElementById("login-error").classList.add("hidden");
    show("login-screen");
  }

  function gotoHome() {
    show("home-content");
   // if (navigator.geolocation) {
    //  navigator.geolocation.getCurrentPosition(
    //    setHomeBackgroundByLocation,
    //    () => setHomeBackgroundImage()
    //  );
     
      setHomeBackgroundImage();
    
    loadNearbyNotes();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = user.props?.role;              // מושכים את ה-role מתוך props
    const adminBtn = document.getElementById("admin-btn");

   if (role === "admin") {
  adminBtn.classList.remove("hidden");
} else {
  adminBtn.classList.add("hidden");
  }
}

  

// 6. Logout
const logoutBtn = document.getElementById("logout-btn");
console.log("logoutBtn is", logoutBtn);
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    console.log("Logout button clicked");
    localStorage.removeItem("jwt");
    gotoLogin();
  });
}
//7.Delete account
document.getElementById("settings-btn").addEventListener("click", () => {
  show("settings-screen");
});
document.getElementById("settings-back-btn").addEventListener("click", () => {
  gotoHome();
});
document.getElementById("delete-account-btn").addEventListener("click", async () => {
  const ok = confirm("אתה בטוח שברצונך למחוק את החשבון שלך? פעולה זו אינה ניתנת לביטול.");
  if (!ok) return;

  try {
    const pwd = prompt("הכנס את הסיסמה הנוכחית כדי לאשר מחיקה:");
    if (!pwd) return alert("מחיקה בוטלה – לא הוזנה סיסמה.");
    await deleteAccount(pwd);    
    alert("החשבון נמחק בהצלחה.");
    localStorage.removeItem("jwt");
    gotoLogin();
  } catch (err) {
    console.error("Error deleting account:", err);
    alert("אירעה שגיאה במחיקת החשבון: " + err);
  }
});



// 8. Back from Map
const backHomeBtn = document.getElementById("back-to-home");
console.log("backHomeBtn is", backHomeBtn);
if (backHomeBtn) {
  backHomeBtn.addEventListener("click", () => {
    console.log("Back to home clicked");
    gotoHome();
  });
}
// כפתור פתיחת ה־Admin
document.getElementById("admin-btn").addEventListener("click", () => {
  show("admin-screen");
  fetchAllUsers();
  fetchAllNotes();
});

// כפתור חזרה
document.getElementById("admin-back").addEventListener("click", gotoHome);

// פונקציות העמסת הנתונים
async function fetchAllUsers() {
  try {
    const users = await apiFetch("/api/admin/users");
    const container = document.getElementById("admin-users");
    container.innerHTML = users.map(u =>
      `<div class="note-card">
         <strong>${u.email}</strong> (${u.role})
         <button data-id="${u.id}" class="btn-link admin-delete-user">מחק משתמש</button>
       </div>`
    ).join("");
    // רישום מאזינים למחיקה
    container.querySelectorAll(".admin-delete-user")
      .forEach(btn =>
        btn.onclick = async () => {
          if (!confirm("למחוק משתמש זה?")) return;
          await apiFetch(`/api/admin/users/${btn.dataset.id}`, { method: "DELETE" });
          fetchAllUsers();
        }
      );
  } catch (e) {
    alert("שגיאה בשליפת משתמשים: " + e);
  }
}

async function fetchAllNotes() {
  try {
    const notes = await apiFetch("/api/admin/notes");
    const container = document.getElementById("admin-notes");
    container.innerHTML = notes.map(n =>
      `<div class="note-card">
         <p>${n.content.text}</p>
         <small>by ${n.userId}</small>
         <button data-id="${n.id}" class="btn-link admin-delete-note">מחק פתק</button>
       </div>`
    ).join("");
    // רישום מאזינים למחיקה
    container.querySelectorAll(".admin-delete-note")
      .forEach(btn =>
        btn.onclick = async () => {
          if (!confirm("למחוק פתק זה?")) return;
          await apiFetch(`/api/admin/notes/${btn.dataset.id}`, { method: "DELETE" });
          fetchAllNotes();
        }
      );
  } catch (e) {
    alert("שגיאה בשליפת פתקים: " + e);
  }
}


  // 8. Admin Flow (renderUsers / renderNotes)…
  

  // === Helpers for Home & Map ===
// Map Navigation + Geolocation
document.getElementById("to-map-btn").addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("הדפדפן שלך לא תומך בגיאולוקיישן.");
  }

  navigator.geolocation.getCurrentPosition(
    position => {
      // 1. עוברים למסך המפה
      show("map-screen");

      // 2. בונים מפה במיקום המשתמש
      const userLoc = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      const map = new google.maps.Map(
        document.getElementById("big-map"),
        {
          center: userLoc,
          zoom: 14
        }
      );

      // 3. מוסיפים Marker
      new google.maps.Marker({
        position: userLoc,
        map,
        title: "המיקום שלך"
      });
    },
    error => {
      if (error.code === error.PERMISSION_DENIED) {
        alert("לא אישרת את השימוש במיקום, לא ניתן להציג מפה.");
      } else {
        console.warn("שגיאה בקבלת מיקום:", error);
        alert("לא הצלחנו לקבל את המיקום שלך.");
      }
    }
  );
});



  async function loadNearbyNotes() { /* … */ }
  function setHomeBackgroundImage(url) { 
     const bg = document.getElementById("home-bg");
  // שמים תמונה כרקע CSS
  bg.style.backgroundImage = `url("${url}")`;
  bg.style.backgroundSize = "cover";          // כדי שהתמונה תתפרס על כל החלל
  bg.style.backgroundPosition = "center";     // כדי למרכז אותה

  }
  function setHomeBackgroundByLocation(pos) { /* … */ }

  // === Initial Screen ===
  gotoLogin();
});
