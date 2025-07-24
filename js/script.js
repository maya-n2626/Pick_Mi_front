
let lastKnownLocation = {
  lat: null,
  lon: null,
  placeId: null
};

document.addEventListener("DOMContentLoaded", function() {
;

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
  if (lat == null || lon == null) {
    throw new Error("מיקום לא תקף — lat/lon חסרים");
  }
  return apiFetch(`/api/notes/nearby?lat=${lat}&lon=${lon}&radius=${radius}`);
}

  async function getNoteContent(id, lat, lon) {
    

    return apiFetch(`/api/notes/${id}?lat=${lat}&lon=${lon}`);
  }
async function deleteNote(id, lat, lon) {
  console.log("ID:", id, "LAT:", lat, "LON:", lon);

  return apiFetch(`/api/notes/${id}`, {
    method: "DELETE",
  body: JSON.stringify({
      latitude: Number(lat),
      longitude: Number(lon)
    })  });
}



// 1. כשלוחצים על הכפתור החדש בדף הבית
const newNoteBtn = document.getElementById("new-note-btn");
if (newNoteBtn) {
  newNoteBtn.addEventListener("click", () => {
    show("write-note-screen");

    // === בקשת מיקום ===
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          lastKnownLocation.lat = position.coords.latitude;
          lastKnownLocation.lon = position.coords.longitude;
          lastKnownLocation.placeId = "temp-place-id"; // זמני או לחשב בעתיד
          console.log("📍 Location set in write-note-screen:", lastKnownLocation);
        },
        (err) => {
          console.warn("⚠️ לא ניתן לקבל מיקום במסך כתיבה:", err);
          alert("לא ניתן לקבל מיקום. לא ניתן לשמור את הפתק.");
        }
      );
    } else {
      alert("המכשיר שלך לא תומך במיקום גיאוגרפי.");
    }
  });
}




// 2. חזרה מדף כתיבה
const writeBackBtn = document.getElementById("write-back-btn");
if (writeBackBtn) {
  writeBackBtn.addEventListener("click", () => {
    gotoHome();
  });
}



// 3. מעבר מצפייה/כתיבה לצביעה
const toBrushBtn = document.getElementById("to-brush-btn");
if (toBrushBtn) {
  toBrushBtn.addEventListener("click", () => {
    show("brush-note-screen");
  });
}

// 4. חזרה מדף הצביעה
const brushBackBtn = document.getElementById("brush-back-btn");
if (brushBackBtn) {
  brushBackBtn.addEventListener("click", () => {
    show("write-note-screen");
  });
}


// 5. כשלוחצים שמור פתק בצביעה
document.getElementById("save-drawing-note-btn").addEventListener("click", async () => {
  // למשל: תאסוף את הטקסט מ־textarea והציור מ־canvas
const saveBtn = document.getElementById("save-drawing-note-btn");
if (saveBtn) {
  saveBtn.addEventListener("click", async () => {
    const textInput = document.getElementById("note-text");
    const canvas = document.getElementById("note-canvas");

    if (!textInput || !canvas) {
      console.warn("❗ אלמנט note-text או note-canvas לא נמצא בדף הזה");
      return;
    }

  const text = textInput.value.trim() || "פתק מצויר בלבד";
    const drawingData = canvas.toDataURL();
    console.log("🖊 text to send:", text);
   console.log("🖼 drawingData to send:", drawingData);

  console.log("📍 Location to send:", lastKnownLocation);


    await throwNote(text, drawingData, lastKnownLocation.lat, lastKnownLocation.lon, lastKnownLocation.placeId);
    gotoHome();
  });
}
});

const saveTextBtn = document.getElementById("save-text-note-btn");
if (saveTextBtn) {
  saveTextBtn.addEventListener("click", async () => {
    const textInput = document.getElementById("note-text");

    if (!textInput) {
      console.warn("❗ אלמנט note-text לא נמצא");
      return;
    }

    const text = textInput.value;
    const drawingData = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjwvc3ZnPg==";

    console.log("📍 Location to send:", lastKnownLocation);


   await throwNote(
  text,
  drawingData,
  lastKnownLocation.lat,
  lastKnownLocation.lon,
  lastKnownLocation.placeId
);

    gotoHome();
c
});
 
  
}
//open note function

async function openNoteAndShow(noteId) {
  console.log("current lat:", lastKnownLocation.lat);
  console.log("current lon:", lastKnownLocation.lon);

  const note = await getNoteContent(noteId, lastKnownLocation.lat, lastKnownLocation.lon);
  console.log("📜 note from server:", note);

  const noteScreen = document.getElementById("note-content-screen");
  const contentDiv = document.getElementById("note-content");

  noteScreen.dataset.noteId = noteId;
  noteScreen.dataset.latitude = lastKnownLocation.lat;
  noteScreen.dataset.longitude = lastKnownLocation.lon;

  // הסתרת מסכים אחרים
  document.getElementById("home-content").classList.add("hidden");
  noteScreen.classList.remove("hidden");

  // ניקוי קודם
  contentDiv.innerHTML = "";
  contentDiv.style.position = "relative";

  // ✅ קביעת רקע לפי אם יש ציור
  const backgroundImg = document.createElement("img");
  backgroundImg.classList.add("note-background");
  backgroundImg.src = note.content.drawingData
    ? "../images/WriteBrush.png" // מברשת – אם זה פתק מצויר
    : "../images/WritePen (1).png"; // עט – אם זה רק טקסט
  contentDiv.appendChild(backgroundImg);

  // ✅ טקסט
  if (note.content.text) {
    const p = document.createElement("p");
    p.textContent = note.content.text;
    p.classList.add("note-text");
    contentDiv.appendChild(p);
  }

  // ✅ ציור – אם יש
  if (note.content.drawingData) {
    const img = document.createElement("img");
    img.src = note.content.drawingData;
    img.alt = "ציור";
    img.style.maxWidth = "100%";
    img.style.display = "block";
    img.classList.add("note-canvas");
    contentDiv.appendChild(img);
  }
}


  
//close note function 
document.getElementById("close-note-btn").addEventListener("click", async () => {
  const screen = document.getElementById("note-content-screen");
  const noteId = screen.dataset.noteId;
  const lat = screen.dataset.latitude;
  const lon = screen.dataset.longitude;

  try {
    await deleteNote(noteId, lat, lon);
  } catch (e) {
    console.warn("המחיקה נכשלה", e);
  }

  screen.classList.add("hidden");
  document.getElementById("note-content-screen").classList.add("hidden");
  document.getElementById("home-content").classList.remove("hidden");
});




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
function renderNotesOnHome(notes) {
  const notesList = document.getElementById("notes-list");
  notesList.innerHTML = "";

  notes.forEach(note => {
    const noteEl = document.createElement("img");
    noteEl.src = "../images/ClosedNote.png";
    noteEl.alt = "פתק";
    noteEl.classList.add("floating-note");

    // מיקום אקראי בעמוד
    noteEl.style.position = "absolute";
    noteEl.style.left = Math.random() * 80 + "%";
    noteEl.style.top = Math.random() * 200 + "px";
    noteEl.style.width = "50px";
    noteEl.style.cursor = "pointer";
    // לחיצה על הפתק: טוענת ומציגה אותו
    noteEl.addEventListener("click", () => {
      openNoteAndShow(note.id);  // מציג את הפתק (ציור או טקסט)
      noteEl.remove();           // מסיר את הפתק מהמסך
    });

    notesList.appendChild(noteEl);
  });
}


function renderNotesOnMap(notes, map) {
    console.log("📍 Rendering notes on map:", notes);

  notes.forEach(n => {
    const title = n.content?.text?.trim() || "פתק ללא טקסט";

    new google.maps.Marker({
      position: {
        lat: Number(n.location.lat),
        lng: Number(n.location.lon)
      },
      map,
      title,
      icon: {
        url: "../images/ClosedNote.png",
        size: new google.maps.Size(51, 43),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(25, 43)
      }
    });
          marker.addListener("click", () => openNoteAndShow(n.id));

  });

}


  function gotoLogin() {
      console.log("🔵 gotoLogin called");

    document.getElementById("login-error").classList.add("hidden");
    show("login-screen");
  }

async function gotoHome() {
  show("home-content");

  navigator.geolocation.getCurrentPosition(
    async pos => {
           lastKnownLocation = {
        lat:     pos.coords.latitude,
        lon:     pos.coords.longitude,
        placeId: null
      };


      // 1. שליפת פתקים קרובים
      const notes = await getNearbyNotes(lastKnownLocation.lat, lastKnownLocation.lon, 500);
      console.log("📍 nearby notes:", notes);

      renderNotesOnHome(notes);
      // 2. הרכבת URL של Static Map עם מרקרים
      const sizeW = 400, sizeH = 300;
      const key   = "AIzaSyCbMIwPY6SqN9WsL7Fvn4E_r_2kpj6CrQY";  
      const base  = "https://maps.googleapis.com/maps/api/staticmap";
      const centerParam = `center=${lastKnownLocation.lat},${lastKnownLocation.lon}` +
                        `&zoom=15&size=${sizeW}x${sizeH}`;
      const markerIconUrl = "https://cdn.jsdelivr.net/gh/maya-n2626/Pick_Mi_front@main/images/ClosedNote.png";

      const userMarker  = `markers=color:blue|${lastKnownLocation.lat},${lastKnownLocation.lon}`;
      const noteMarkers = notes
      .map(n => `markers=icon:${encodeURIComponent(markerIconUrl)}|${n.location.lat},${n.location.lon}`)
      .join("&");
       const url = `${base}?${centerParam}&${userMarker}&${noteMarkers}&key=${key}`;




      // 3. הצגת המפה הסטטית כרקע ה־card
      const container = document.getElementById("home-content");
      container.style.backgroundImage    = `url("${url}")`;
      container.style.backgroundSize     = "cover";
      container.style.backgroundPosition = "center";

      // 4. הצגת/הסתרת כפתור Admin
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const role = user.props?.role;
      document.getElementById("admin-btn")
        .classList[role === "admin" ? "remove" : "add"]("hidden");
    },
    err => {
      console.warn("לא ניתן לקבל מיקום:", err);
    }
  );
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

//icon-button

logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("jwt");
    gotoLogin();
  });

  userIcon.addEventListener("click", () => {
    show("user-menu-screen");
  });

  document.getElementById("user-menu-back-btn").addEventListener("click", () => {
    gotoHome();
  })

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
  

  // === Helpers for Home & Map ===
const toMapBtn = document.getElementById("to-map-btn");
if (toMapBtn) {
  toMapBtn.addEventListener("click", () => {

  navigator.geolocation.getCurrentPosition(
    
    async position => {
      show("map-screen");

      lastKnownLocation = {
      lat:     position.coords.latitude,
      lon:     position.coords.longitude,
      placeId: null
    };

      const map = new google.maps.Map(
        document.getElementById("big-map"),
      { center: { lat: lastKnownLocation.lat, lng: lastKnownLocation.lon }, zoom: 14 }
      );

      // סמן הבית
      new google.maps.Marker({
        position: { lat: lastKnownLocation.lat, lng: lastKnownLocation.lon },
        map,
        title: "המיקום שלך"
      });

      // מביאים את כל הפתקים באזור (לדוגמה 50 ק"מ)
      const notes = await getNearbyNotes( lastKnownLocation.lat,
      lastKnownLocation.lon,
      500);

      renderNotesOnMap(notes,map);

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
}

  async function loadNearbyNotes() {
  const userLoc = await getUserLocationPromise();
  const notes   = await getNearbyNotes(userLoc.lat, userLoc.lon);
  const container = document.getElementById("home-content");
  notes.forEach(n => {
    const el = document.createElement("div");
    el.className = "note-pin";
    el.style.left = `${n.offsetX}px`;
    el.style.top  = `${n.offsetY}px`;
    container.appendChild(el);

    el.onclick = () => openNoteDetail(n.id);
  });
}


const canvas = document.getElementById("note-canvas");
const ctx = canvas.getContext("2d");
const colorPicker = document.getElementById("brush-color");
const sizePicker = document.getElementById("brush-size");

let painting = false;
let brushColor = "#000000";
let brushSize = 5;

colorPicker.addEventListener("input", (e) => {
  brushColor = e.target.value;
});

sizePicker.addEventListener("input", (e) => {
  brushSize = e.target.value;
});

canvas.addEventListener("mousedown", startPaint);
canvas.addEventListener("mouseup", stopPaint);
canvas.addEventListener("mouseout", stopPaint);
canvas.addEventListener("mousemove", draw);

function startPaint(e) {
  painting = true;
  draw(e);
}

function stopPaint() {
  painting = false;
  ctx.beginPath();
}

function draw(e) {
  if (!painting) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  ctx.lineWidth = brushSize;
  ctx.lineCap = "round";
  ctx.strokeStyle = brushColor;

  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
}


  // === Initial Screen ===
  gotoLogin();
});
