
let lastKnownLocation = {
  lat: null,
  lon: null,
  placeId: null
};

import { signup, signin, forgotPassword, resetPassword, deleteAccount, apiFetch, jwt, API_BASE } from './modules/auth.js';
import { throwNote, getNearbyNotes, getNoteContent, deleteNote } from './modules/notes.js';
import { show,  gotoLogin, } from './modules/ui.js';
import { fetchAllUsers, fetchAllNotes } from './modules/admin.js';
import {
  initCanvas} from './modules/canvas.js';


document.addEventListener("DOMContentLoaded", function() {

 const token = jwt();
if (!token) {
  console.warn("אין JWT – המשתמש לא מחובר");
} 
else {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log(payload);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user.props?.role;
  const adminBtn = document.getElementById("admin-btn");
  if (adminBtn) {
    adminBtn.classList[role === "admin" ? "remove" : "add"]("hidden");

}
}

  // === Event Listeners & Flow ===

    // 0. מ‑Login ל‑Signup
    document.getElementById("to-signup").onclick = () => {
      document.getElementById("signup-error").classList.add("hidden");
      show("signup-screen");
    };
     
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

    document.getElementById("back-to-login").addEventListener("click", gotoLogin);

  
    // 3. Sign In
    document.getElementById("login-form").onsubmit = async e => {
      e.preventDefault();
      try {
        const email = document.getElementById("login-email").value.trim();
        const pwd = document.getElementById("login-password").value;
        await signin(email, pwd);
        gotoHome(lastKnownLocation);
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
    gotoHome(lastKnownLocation);
  });
}



// 3. מעבר מצפייה/כתיבה לצביעה
const toBrushBtn = document.getElementById("to-brush-btn");
if (toBrushBtn) {
  toBrushBtn.addEventListener("click", () => {
    show("brush-note-screen");
    initCanvas();
  });
}

// 4. חזרה מדף הצביעה
const brushBackBtn = document.getElementById("brush-back-btn");
if (brushBackBtn) {
  brushBackBtn.addEventListener("click", () => {
    show("write-note-screen");
  });
}

//save text note  
const saveBtn = document.getElementById("save-text-note-btn");
if (saveBtn) {
  saveBtn.addEventListener("click", async () => {
    const textInput = document.getElementById("note-text");
    const canvas = document.getElementById("note-canvas");

    if (!textInput || !canvas) {
      console.warn("❗ אלמנט note-text או note-canvas לא נמצא בדף הזה");
      return;
    }

  const text = textInput.value.trim();
    const drawingData = canvas.toDataURL();

    
    console.log("🖊 text to send:", text);
   console.log("🖼 drawingData to send:", drawingData);

  console.log("📍 Location to send:", lastKnownLocation);


    await throwNote(text, drawingData, lastKnownLocation.lat, lastKnownLocation.lon, lastKnownLocation.placeId);
    gotoHome(lastKnownLocation);
  });
}
//save drawing
const saveBtn1 = document.getElementById("save-drawing-note-btn");
if (saveBtn1) {
  saveBtn1.addEventListener("click", async () => {
    const textInput = document.getElementById("note-text");
    const canvas = document.getElementById("note-canvas");

    if (!textInput || !canvas) {
      console.warn("❗ אלמנט note-text או note-canvas לא נמצא בדף הזה");
      return;
    }

  const text = textInput.value.trim() ;
    const drawingData = canvas.toDataURL();
    console.log("🖊 text to send:", text);
   console.log("🖼 drawingData to send:", drawingData);

  console.log("📍 Location to send:", lastKnownLocation);


    await throwNote(text, drawingData, lastKnownLocation.lat, lastKnownLocation.lon, lastKnownLocation.placeId);
    gotoHome(lastKnownLocation);
  });
}

//go to home
async function gotoHome(locationData) {
  show("home-content");

  navigator.geolocation.getCurrentPosition(
    async pos => {
            locationData.lat = pos.coords.latitude;
            locationData.lon = pos.coords.longitude;
            locationData.placeId = null;


      // 1. שליפת פתקים קרובים
      const notes = await getNearbyNotes(locationData.lat, locationData.lon, 500);
            console.log("Data for STATIC map:", JSON.stringify(notes, null, 2));

      renderNotesOnHome(notes);
      // 2. הרכבת URL של Static Map עם מרקרים
      const sizeW = 400, sizeH = 300;
      const key   = "AIzaSyCbMIwPY6SqN9WsL7Fvn4E_r_2kpj6CrQY";  
      const base  = "https://maps.googleapis.com/maps/api/staticmap";
      const centerParam = `center=${locationData.lat},${locationData.lon}` +
                        `&zoom=15&size=${sizeW}x${sizeH}`;
      const markerIconUrl = "https://cdn.jsdelivr.net/gh/maya-n2626/Pick_Mi_front@main/images/ClosedNote.png";

      const userMarker  = `markers=color:blue|${locationData.lat},${locationData.lon}`;
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
//open notes on screen
async function openNoteAndShow(noteId) {
    const PLACEHOLDER_DRAWING = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjwvc3ZnPg==";
    const note = await getNoteContent(noteId, lastKnownLocation.lat, lastKnownLocation.lon);

    console.log("מידע שהגיע מהשרת:", JSON.stringify(note, null, 2));
    
    const isDrawingNote = !!note.content.drawingData;
    console.log("האם זה פתק ציור?", isDrawingNote);
  
    const noteScreen = document.getElementById("note-content-screen");
    const contentDiv = document.getElementById("note-content");
    noteScreen.dataset.noteId = noteId;
    noteScreen.dataset.latitude = lastKnownLocation.lat;
    noteScreen.dataset.longitude = lastKnownLocation.lon;
    show("note-content-screen");
    contentDiv.innerHTML = "";
    contentDiv.style.position = "relative";
    const backgroundImg = document.createElement("img");
    backgroundImg.classList.add("note-background");
    backgroundImg.src = isDrawingNote
        ? "../images/WriteBrush.png"
        : "../images/WritePen (1).png";
    contentDiv.appendChild(backgroundImg);
    if (note.content.text) {
        const p = document.createElement("p");
        p.textContent = note.content.text;
        p.classList.add("note-text");
        contentDiv.appendChild(p);
    }
    const hasRealDrawing = note.content.drawingData && note.content.drawingData !== PLACEHOLDER_DRAWING;
    if (hasRealDrawing) {
        const img = document.createElement("img");
        img.src = note.content.drawingData;
        img.alt = "ציור";
        img.style.maxWidth = "100%";
        img.style.display = "block";
        img.classList.add("note-canvas");
        contentDiv.appendChild(img);
    }
}
  const noteText = document.getElementById("note-text");
  const textColorPicker = document.getElementById("text-color");
  const textWeightSelector = document.getElementById("text-weight");

  if (noteText && textColorPicker) {
    textColorPicker.addEventListener("input", () => {
      noteText.style.color = textColorPicker.value;
    });
  }

//render notes on home
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
//render notes on map
function renderNotesOnMap(notes, map) {
    console.log(`Starting to render ${notes.length} notes...`);

    notes.forEach((note, index) => {
        // הדפסה חדשה שמראה את פרטי המיקום של כל פתק
        console.log(`--- Processing Note #${index + 1} ---`);
        console.log('Location data for this note:', note.location);

        if (note && note.location && note.location.latitude != null && note.location.longitude != null) {
            console.log('✅ Coordinates are valid. Creating marker.');
            
            const title = note.content?.text?.trim() || "פתק ללא טקסט";
            
            new google.maps.Marker({
                position: {
                    lat: Number(note.location.latitude),
                    lng: Number(note.location.longitude)
                },
                map,
                title,
                icon: {
                    url: "../images/ClosedNote.png", 
                    scaledSize: new google.maps.Size(40, 40), 
                    anchor: new google.maps.Point(20, 20) 
                }
            }).addListener("click", () => openNoteAndShow(note.id));
        } else {
            console.warn(`❌ SKIPPING note due to invalid or missing coordinates.`);
        }
    });
}
//clear canvas
document.getElementById("clear-canvas-btn").addEventListener("click", () => {
  const canvas = document.getElementById("note-canvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});
  document.getElementById("clear-canvas-btn1").addEventListener("click", () => {
   const textInput = document.getElementById("note-text");
  if (textInput) textInput.value = "";
});

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
 ["app-icon1", "app-icon2", "app-icon3", "app-icon4", "app-icon5","app-icon6"].forEach(id => {
  const btn = document.getElementById(id);
  if (btn) {
    btn.addEventListener("click", () => {
      show("user-menu-screen");
      const backBtn = document.getElementById("user-menu-back-btn");
      backBtn && backBtn.addEventListener("click", () => gotoHome(lastKnownLocation));
    });
  }
});

//Delete Account
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
    gotoHome(lastKnownLocation);
  });
}
// כפתור פתיחת ה־Admin
document.getElementById("admin-btn").addEventListener("click", () => {
  show("admin-screen");
  fetchAllUsers();
  fetchAllNotes();
});

// back admin
document.getElementById("admin-back").addEventListener("click", () => gotoHome(lastKnownLocation));

  // === Helpers for Home & Map ===
const toMapBtn = document.getElementById("to-map-btn");
if (toMapBtn) {
    toMapBtn.addEventListener("click", async () => {
        try {
            // קבלת מיקום מהדפדפן
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            show("map-screen");

            lastKnownLocation = {
                lat: position.coords.latitude,
                lon: position.coords.longitude,
                placeId: null
            };

            // יצירת המפה
            const map = new google.maps.Map(document.getElementById("big-map"), {
                center: { lat: lastKnownLocation.lat, lng: lastKnownLocation.lon },
                zoom: 14
            });

            // הוספת סמן של המיקום הנוכחי
            new google.maps.Marker({
                position: { lat: lastKnownLocation.lat, lng: lastKnownLocation.lon },
                map,
                title: "המיקום שלך"
            });

            // שלב קריטי: קבלת הפתקים מהשרת
            console.log("Fetching notes for map...");
            const notes = await getNearbyNotes(
                lastKnownLocation.lat,
                lastKnownLocation.lon,
                5000 // הגדלתי את הרדיוס ל-5 ק"מ כדי לוודא שאנחנו תופסים משהו
            );

            // רינדור הפתקים על המפה
            renderNotesOnMap(notes, map);

        } catch (error) {
            // כאן נתפוס כל שגיאה שתתרחש בתהליך
            console.error("❌ An error occurred while loading the map or notes:", error);

            if (error.code === error.PERMISSION_DENIED) {
                alert("לא אישרת שימוש במיקום, לא ניתן להציג את המפה.");
            } else {
                alert("אירעה שגיאה בטעינת המפה. בדוק את הקונסול (F12) לפרטים נוספים.");
            }
        }
    });
}

  // === Initial Screen ===
  gotoLogin();
}
);
