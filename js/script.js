import {
  signup,
  signin,
  forgotPassword,
  deleteAccount,
} from "./modules/auth.js";

import {
  throwNote,
  getNearbyNotes,
  getNoteContent,
  deleteNote,
} from "./modules/notes.js";
import { show, gotoLogin } from "./modules/ui.js";
import { fetchAllUsers, fetchAllNotes } from "./modules/admin.js";
import { initCanvas, isCanvasEmpty } from "./modules/canvas.js";

import { isAdmin } from "./modules/auth.js";

function updateAdminButtonVisibility() {
  const adminBtn = document.getElementById("admin-btn");
  if (adminBtn) {
    adminBtn.classList.toggle("hidden", !isAdmin());
  }
}
let lastKnownLocation = {
  lat: null,
  lon: null,
  placeId: null,
};

async function getPlaceIdFromCoordinates(lat, lon) {
  return new Promise(async (resolve) => {
    const center = new google.maps.LatLng(lat, lon);

    const request = {
      fields: ["displayName", "location", "id"],
      locationRestriction: {
        center,
        radius: 100, // Search within 100 meters
      },
      includedPrimaryTypes: [
        "park",
        "school",
        "university",
        "library",
        "shopping_mall",
        "restaurant",
        "cafe",
        "bar",
        "gym",
        "movie_theater",
        "museum",
        "church",
        "mosque",
        "synagogue",
        "city_hall",
        "police",
        "post_office",
      ],
      maxResultCount: 1,
      rankPreference: google.maps.places.SearchNearbyRankPreference.DISTANCE,
    };

    try {
      const { places } = await google.maps.places.Place.searchNearby(request);
      if (places && places.length > 0) {
        resolve(places[0].id);
      } else {
        console.warn("⚠️ No nearby places found.");
        resolve("0");
      }
    } catch (error) {
      console.warn("⚠️ Error during Place.searchNearby:", error);
      resolve("0");
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  updateAdminButtonVisibility();

  // === Event Listeners & Flow ===

  // 0. מ‑Login ל‑Signup
  document.getElementById("to-signup").onclick = () => {
    document.getElementById("signup-error").classList.add("hidden");
    show("signup-screen");
  };

  // 2. טיפול ב‑Signup
  document.getElementById("signup-form").onsubmit = async (e) => {
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
  document.getElementById("login-form").onsubmit = async (e) => {
    e.preventDefault();
    try {
      const email = document.getElementById("login-email").value.trim();
      const pwd = document.getElementById("login-password").value.trim();
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
  document.getElementById("forgot-form").onsubmit = async (e) => {
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
          async (position) => {
            lastKnownLocation.lat = position.coords.latitude;
            lastKnownLocation.lon = position.coords.longitude;
            lastKnownLocation.placeId = await getPlaceIdFromCoordinates(
              lastKnownLocation.lat,
              lastKnownLocation.lon,
            );
            console.log(
              "📍 Location and Place ID set in write-note-screen:",
              lastKnownLocation,
            );
          },
          (err) => {
            console.warn("⚠️ לא ניתן לקבל מיקום במסך כתיבה:", err);
            alert("לא ניתן לקבל מיקום. לא ניתן לשמור את הפתק.");
          },
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
      let drawingData = null;
      if (!isCanvasEmpty(canvas)) {
        drawingData = canvas.toDataURL();
      }

      console.log("🖊 text to send:", text);
      console.log("🖼 drawingData to send:", drawingData);

      console.log("📍 Location to send:", lastKnownLocation);

      await throwNote(
        text,
        drawingData,
        lastKnownLocation.lat,
        lastKnownLocation.lon,
        lastKnownLocation.placeId,
      );
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

      const text = textInput.value.trim();
      let drawingData = null;
      if (!isCanvasEmpty(canvas)) {
        drawingData = canvas.toDataURL();
      }
      console.log("🖊 text to send:", text);
      console.log("🖼 drawingData to send:", drawingData);

      console.log("📍 Location to send:", lastKnownLocation);

      await throwNote(
        text,
        drawingData,
        lastKnownLocation.lat,
        lastKnownLocation.lon,
        lastKnownLocation.placeId,
      );
      gotoHome(lastKnownLocation);
    });
  }

  //go to home
  async function gotoHome(locationData) {
    show("home-content");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        locationData.lat = pos.coords.latitude;
        locationData.lon = pos.coords.longitude;
        locationData.placeId = await getPlaceIdFromCoordinates(
          locationData.lat,
          locationData.lon,
        );
        console.log("📍 Location and Place ID set in gotoHome:", locationData);

        // 1. שליפת פתקים קרובים
        const notes = await getNearbyNotes(
          locationData.lat,
          locationData.lon,
          500,
        );
        console.log("Data for STATIC map:", JSON.stringify(notes, null, 2));

        renderNotesOnHome(notes, locationData);
        // 2. הרכבת URL של Static Map עם מרקרים
        const sizeW = 400,
          sizeH = 300;
        const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        const base = "https://maps.googleapis.com/maps/api/staticmap";
        const centerParam =
          `center=${locationData.lat},${locationData.lon}` +
          `&zoom=15&size=${sizeW}x${sizeH}&scale=2`;
        const markerIconUrl = "../images/ClosedNote.png";

        const userMarker = `markers=icon:${encodeURIComponent(markerIconUrl)}|${locationData.lat},${locationData.lon}`;
        const noteMarkers = notes
          .map(
            (n) =>
              `markers=icon:${encodeURIComponent(markerIconUrl)}|${n.location.lat},${n.location.lon}`,
          )
          .join("&");
        const url = `${base}?${centerParam}&${userMarker}&${noteMarkers}&key=${key}`;

        // 3. הצגת המפה הסטטית כרקע ה־card
        const container = document.getElementById("home-content");
        container.style.backgroundImage = `url("${url}")`;
        container.style.backgroundSize = "cover";
        container.style.backgroundPosition = "center";

        // 4. הצגת/הסתרת כפתור Admin
        updateAdminButtonVisibility();
      },
      (err) => {
        console.warn("לא ניתן לקבל מיקום:", err);
      },
    );
  }
  //open notes on screen
  async function openNoteAndShow(noteId) {
    const note = await getNoteContent(
      noteId,
      lastKnownLocation.lat,
      lastKnownLocation.lon,
    );

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
      ? "/images/WriteBrush.png"
      : "/images/WritePen (1).png";
    contentDiv.appendChild(backgroundImg);
    if (note.content.text) {
      const p = document.createElement("p");
      p.textContent = note.content.text;
      p.classList.add("note-text");
      contentDiv.appendChild(p);
    }
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
  const noteText = document.getElementById("note-text");
  const textColorPicker = document.getElementById("text-color");
  const textWeightSelector = document.getElementById("text-weight");

  if (noteText && textColorPicker) {
    textColorPicker.addEventListener("input", () => {
      noteText.style.color = textColorPicker.value;
    });
  }

  //render notes on home
  function renderNotesOnHome(notes, locationData) {
    const notesList = document.getElementById("notes-list");
    notesList.innerHTML = "";

    const mapWidth = 800; // Static map width in pixels (400 * 2 because scale=2)
    const mapHeight = 600; // Static map height in pixels (300 * 2)
    const zoom = 15;
    const iconSize = 50; // Your note image size (px)

    const centerLat = locationData.lat;
    const centerLon = locationData.lon;

    function latLngToPoint(lat, lon) {
      const siny = Math.sin((lat * Math.PI) / 180);
      const y = 0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI);
      const x = (lon + 180) / 360;
      return { x, y };
    }

    function latLngToPixel(lat, lon) {
      const scale = Math.pow(2, zoom);
      const centerPt = latLngToPoint(centerLat, centerLon);
      const targetPt = latLngToPoint(lat, lon);

      const dx = (targetPt.x - centerPt.x) * 256 * scale;
      const dy = (targetPt.y - centerPt.y) * 256 * scale;

      return {
        left: mapWidth / 2 + dx,
        top: mapHeight / 2 + dy,
      };
    }

    notes.forEach((note) => {
      const { lat, lon } = note.location;
      const pixel = latLngToPixel(lat, lon);

      // Clamp values to keep note image fully inside the screen
      const clampedLeft = Math.min(
        Math.max(pixel.left - iconSize / 2, 0),
        mapWidth - iconSize,
      );
      const clampedTop = Math.min(
        Math.max(pixel.top - iconSize / 2, 0),
        mapHeight - iconSize,
      );

      const noteEl = document.createElement("img");
      noteEl.src = "/images/ClosedNote.png";
      noteEl.alt = "פתק";
      noteEl.classList.add("floating-note");

      noteEl.style.position = "absolute";
      noteEl.style.left = `${clampedLeft}px`;
      noteEl.style.top = `${clampedTop}px`;
      noteEl.style.width = `${iconSize}px`;
      noteEl.style.cursor = "pointer";

      noteEl.addEventListener("click", () => {
        openNoteAndShow(note.id);
        noteEl.remove();
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
      console.log("Location data for this note:", note.location);

      if (
        note &&
        note.location &&
        note.location.latitude != null &&
        note.location.longitude != null
      ) {
        console.log("✅ Coordinates are valid. Creating marker.");

        const title = note.content?.text?.trim() || "פתק ללא טקסט";

        const noteMarkerElement = document.createElement("img");
        noteMarkerElement.src = "/images/ClosedNote.png";
        noteMarkerElement.style.width = "40px";
        noteMarkerElement.style.height = "40px";

        new google.maps.marker.AdvancedMarkerElement({
          position: {
            lat: Number(note.location.latitude),
            lng: Number(note.location.longitude),
          },
          map,
          title,
          content: noteMarkerElement,
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
  document
    .getElementById("close-note-btn")
    .addEventListener("click", async () => {
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
  [
    "app-icon1",
    "app-icon2",
    "app-icon3",
    "app-icon4",
    "app-icon5",
    "app-icon6",
  ].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener("click", () => {
        show("user-menu-screen");
        const backBtn = document.getElementById("user-menu-back-btn");
        backBtn &&
          backBtn.addEventListener("click", () => gotoHome(lastKnownLocation));
      });
    }
  });

  //Delete Account
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
  document
    .getElementById("admin-back")
    .addEventListener("click", () => gotoHome(lastKnownLocation));

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
          placeId: await getPlaceIdFromCoordinates(
            position.coords.latitude,
            position.coords.longitude,
          ),
        };

        // יצירת המפה
        const map = new google.maps.Map(document.getElementById("big-map"), {
          center: { lat: lastKnownLocation.lat, lng: lastKnownLocation.lon },
          zoom: 14,
          mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
        });

        // הוספת סמן של המיקום הנוכחי
        const userMarkerElement = document.createElement("img");
        userMarkerElement.src = "/images/Generic avatar.png";
        userMarkerElement.style.width = "40px";
        userMarkerElement.style.height = "40px";

        new google.maps.marker.AdvancedMarkerElement({
          position: { lat: lastKnownLocation.lat, lng: lastKnownLocation.lon },
          map,
          title: "המיקום שלך",
          content: userMarkerElement,
        });

        // שלב קריטי: קבלת הפתקים מהשרת
        console.log("Fetching notes for map...");
        const notes = await getNearbyNotes(
          lastKnownLocation.lat,
          lastKnownLocation.lon,
          5000, // הגדלתי את הרדיוס ל-5 ק"מ כדי לוודא שאנחנו תופסים משהו
        );

        // רינדור הפתקים על המפה
        renderNotesOnMap(notes, map);
      } catch (error) {
        // כאן נתפוס כל שגיאה שתתרחש בתהליך
        console.error(
          "❌ An error occurred while loading the map or notes:",
          error,
        );

        if (error.code === error.PERMISSION_DENIED) {
          alert("לא אישרת שימוש במיקום, לא ניתן להציג את המפה.");
        } else {
          alert(
            "אירעה שגיאה בטעינת המפה. בדוק את הקונסול (F12) לפרטים נוספים.",
          );
        }
      }
    });
  }

  // === Initial Screen ===
  gotoLogin();
});
