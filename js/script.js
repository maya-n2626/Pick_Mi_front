document.addEventListener("DOMContentLoaded", function() {
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

  // === Auth Endpoints ===
  async function signup(email, password) {
    return apiFetch("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  }
async function signin(email, password) {
  try {
    // שולחים את ה‑POST ל־/api/auth/signin
    const response = await apiFetch(`/api/auth/signin`, {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    // מדפיסים את כל ה‑response מהשרת
    console.log("signin response:", response);

    // שולפים את הטוקן והמשתמש
    const { token, user } = response;

    // שומרים את הטוקן ב־localStorage
    localStorage.setItem("jwt", token);

    // מחזירים גם את ה‑user וגם את ה‑token, למקרה שצריך אותם
    return { user, token };
  } catch (err) {
    console.error("signin failed:", err);
    throw err; // זורקים הלאה כדי שתוכלי לטפל ב‑.catch במקום הקריאה
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
  async function getAllUsers() {
    return apiFetch("/api/admin/users");
  }
  async function getAllNotesAdmin() {
    return apiFetch("/api/admin/notes");
  }
  async function getUserById(userId) {
    return apiFetch(`/api/admin/users/${userId}`);
  }
  async function getNoteById(noteId) {
    return apiFetch(`/api/admin/notes/${noteId}`);
  }
  async function getUserNotes(userId) {
    return apiFetch(`/api/admin/users/${userId}/notes`);
  }
  async function deleteUser(userId) {
    return apiFetch(`/api/admin/users/${userId}`, { method: "DELETE" });
  }
  async function deleteNoteAdmin(noteId) {
    return apiFetch(`/api/admin/notes/${noteId}`, { method: "DELETE" });
  }

  // === UI Navigation & Screens ===
  function show(screenId) {
    document.querySelectorAll(".container, #home-bg, #home-content, #map-screen")
      .forEach(el => el.classList.add("hidden"));
    document.getElementById(screenId).classList.remove("hidden");
    if (screenId === "home-content") {
      document.getElementById("home-bg").classList.remove("hidden");
    }
  }

  function gotoLogin() {
    document.getElementById("login-error").classList.add("hidden");
    show("login-screen");
  }

  function gotoHome() {
    show("home-content");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        setHomeBackgroundByLocation,
        () => setHomeBackgroundImage("../images/default.jpg")
      );
    } else {
      setHomeBackgroundImage("../images/default.jpg");
    }
    loadNearbyNotes();
  }

  // === Event Listeners & Flow ===

  // 1. Sign In
  document.getElementById("login-form").onsubmit = async e => {
    e.preventDefault();
    try {
      const email = document.getElementById("login-email").value.trim();
      const pwd = document.getElementById("login-password").value;
      console.log(email,pwd);
      await signin(email, pwd);
      
      gotoHome();
    } catch (_) {
      show("wrong-password-screen");
    }
  };



  // 2. Wrong Password Screen
  document.getElementById("wrong-back").onclick = gotoLogin;
  document.getElementById("wrong-forgot").onclick = () =>
    show("forgot-password-screen");

  // 3. Forgot Password Flow
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
  document.getElementById("forgot-back").onclick = gotoLogin;
  document.getElementById("sent-back").onclick = gotoLogin;

  // 4. Logout
  document.getElementById("logout-btn").onclick = () => {
    localStorage.removeItem("jwt");
    gotoLogin();
  };

  // 5. Map Navigation
  document.getElementById("to-map-btn").onclick = () => {
    show("map-screen");
    loadBigMap();
  };
  document.getElementById("back-to-home").onclick = gotoHome;
//6.admin
  function show(id) {
    document.querySelectorAll(".container, #home-bg, #home-content, #map-screen")
      .forEach(el => el.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
    if (id === "home-content") {
      document.getElementById("home-bg").classList.remove("hidden");
    }
  }

  document.getElementById("login-form").onsubmit = async e => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    try {
      await signin(email, password);
      const me = await apiFetch("/api/auth/me");
      if (me.role === "admin") {
        show("admin-panel");
        await renderUsers();
        await renderNotes();
      } else {
        show("home-content");
        loadNearbyNotes();
      }
    } catch (err) {
      alert("שגיאה בהתחברות: " + err);
    }
  };

  document.getElementById("logout-btn").onclick = () => {
    localStorage.removeItem("jwt");
    show("login-screen");
  };

  async function renderUsers() {
    const list = document.getElementById("users-list");
    list.textContent = "טוען...";
    try {
      const users = await getAllUsers();
      list.innerHTML = "";
      users.forEach(user => {
        const li = document.createElement("li");
        li.textContent = `${user.email} (ID: ${user._id})`;

        const viewNotesBtn = document.createElement("button");
        viewNotesBtn.textContent = "📄 פתקים";
        viewNotesBtn.onclick = async () => {
          const notes = await getUserNotes(user._id);
          alert(`למשתמש יש ${notes.length} פתקים`);
        };

        const viewDetailsBtn = document.createElement("button");
        viewDetailsBtn.textContent = "👁️ פרטים";
        viewDetailsBtn.onclick = async () => {
          const userDetails = await getUserById(user._id);
          alert(`ID: ${userDetails._id}\nאימייל: ${userDetails.email}\nנוצר בתאריך: ${new Date(userDetails.createdAt).toLocaleString()}`);
        };

        const delBtn = document.createElement("button");
        delBtn.textContent = "🗑️ מחק";
        delBtn.onclick = async () => {
          if (confirm("בטוח למחוק משתמש זה?")) {
            await deleteUser(user._id);
            await renderUsers();
          }
        };

        li.appendChild(viewNotesBtn);
        li.appendChild(viewDetailsBtn);
        li.appendChild(delBtn);
        list.appendChild(li);
      });
    } catch (err) {
      list.textContent = "שגיאה בטעינת משתמשים";
    }
  }

  async function renderNotes() {
    const list = document.getElementById("notes-list");
    list.textContent = "טוען...";
    try {
      const notes = await getAllNotesAdmin();
      list.innerHTML = "";
      notes.forEach(note => {
        const li = document.createElement("li");
        li.textContent = `ID: ${note._id} | טקסט: ${note.content?.text?.slice(0, 20) || "—"}`;

        const viewContentBtn = document.createElement("button");
        viewContentBtn.textContent = "👁️ תוכן";
        viewContentBtn.onclick = async () => {
          const noteDetails = await getNoteById(note._id);
          alert(`תוכן מלא:\n\n${noteDetails.content?.text || "[אין טקסט]"}`);
        };

        const delBtn = document.createElement("button");
        delBtn.textContent = "🗑️ מחק";
        delBtn.onclick = async () => {
          if (confirm("למחוק את הפתק?")) {
            await deleteNoteAdmin(note._id);
            await renderNotes();
          }
        };

        li.appendChild(viewContentBtn);
        li.appendChild(delBtn);
        list.appendChild(li);
      });
    } catch (err) {
      list.textContent = "שגיאה בטעינת פתקים";
    }
  }
  // === Helpers for Home & Map ===
  async function loadNearbyNotes() {
    const notesList = document.getElementById("notes-list");
    notesList.textContent = "טוען...";
    if (!navigator.geolocation) {
      notesList.textContent = "Geolocation לא נתמך.";
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const data = await getNearbyNotes(pos.coords.latitude, pos.coords.longitude);
          if (!data.length) {
            notesList.textContent = "אין פיקודים באזור הקרוב.";
          } else {
            notesList.innerHTML = data
              .map(n => `<div>פתק ID: ${n.id} – (${n.location.lat.toFixed(4)}, ${n.location.lon.toFixed(4)})</div>`)
              .join("");
          }
        } catch {
          notesList.textContent = "שגיאה בטעינת הפיקודים.";
        }
      },
      () => {
        notesList.textContent = "לא ניתן לקבל את המיקום שלך.";
      }
    );
  }

  function loadBigMap() {
    const map = new google.maps.Map(document.getElementById("big-map"), {
      center: { lat: 32.1, lng: 34.8 },
      zoom: 14
    });
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        map.setCenter(loc);
        new google.maps.Marker({ position: loc, map, title: "המיקום שלך" });
      });
    }
  }

  function setHomeBackgroundImage(url) {
    const bg = document.getElementById("home-bg");
    bg.style.backgroundImage = `url('${url}')`;
    bg.style.backgroundSize = "cover";
    bg.style.backgroundPosition = "center";
  }
  function setHomeBackgroundByLocation(pos) {
    const svc = new google.maps.places.PlacesService(document.createElement("div"));
    svc.nearbySearch(
      { location: new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude), radius: 200, type: ["park"] },
      (res, st) => {
        if (st === google.maps.places.PlacesServiceStatus.OK && res.length) {
          setHomeBackgroundImage("../images/Park_BG.png");
        } else {
          svc.nearbySearch(
            { location: new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude), radius: 700, type: ["beach"], keyword: "sea" },
            (r2, s2) => {
              if (s2 === google.maps.places.PlacesServiceStatus.OK && r2.length) {
                setHomeBackgroundImage("../images/sea.png");
              } else {
                setHomeBackgroundImage("../images/street.png");
              }
            }
          );
        }
      }
    );
  }

  // === Initial Screen ===
  gotoLogin();
});
