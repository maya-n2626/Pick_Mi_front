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
  const btn = document.getElementById("admin-btn");
  if (btn) btn.classList.toggle("hidden", !isAdmin());
}

let lastKnownLocation = { lat: null, lon: null, placeId: null };

async function getPlaceIdFromCoordinates(lat, lon) {
  const center = new google.maps.LatLng(lat, lon);
  const request = {
    fields: ["displayName", "location", "id"],
    locationRestriction: { center, radius: 100 },
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
    return places && places.length ? places[0].id : "0";
  } catch {
    return "0";
  }
}
function renderNotesOnHome(notes, locationData) {
  const notesList = document.getElementById("notes-list");
  notesList.innerHTML = "";
  const mapW = 800,
    mapH = 600,
    zoom = 15,
    iconSize = 50;
  const centerLat = locationData.lat,
    centerLon = locationData.lon;
  function latLngToPoint(lat, lon) {
    const siny = Math.sin((lat * Math.PI) / 180);
    const y = 0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI);
    const x = (lon + 180) / 360;
    return { x, y };
  }
  function latLngToPixel(lat, lon) {
    const scale = Math.pow(2, zoom);
    const c = latLngToPoint(centerLat, centerLon);
    const t = latLngToPoint(lat, lon);
    return {
      left: mapW / 2 + (t.x - c.x) * 256 * scale,
      top: mapH / 2 + (t.y - c.y) * 256 * scale,
    };
  }
  notes.forEach((note) => {
    if (!note?.location?.lat || !note.location.lon) return;
    const { left, top } = latLngToPixel(note.location.lat, note.location.lon);
    const cl = Math.min(Math.max(left - iconSize / 2, 0), mapW - iconSize);
    const ct = Math.min(Math.max(top - iconSize / 2, 0), mapH - iconSize);
    const noteEl = document.createElement("img");
    noteEl.src = "/images/ClosedNote.png";
    noteEl.alt = "פתק";
    noteEl.classList.add("floating-note");
    noteEl.style.position = "absolute";
    noteEl.style.left = `${cl}px`;
    noteEl.style.top = `${ct}px`;
    noteEl.style.width = `${iconSize}px`;
    noteEl.style.cursor = "pointer";
    noteEl.onclick = () => {
      openNoteAndShow(note.id);
      noteEl.remove();
    };
    notesList.appendChild(noteEl);
  });
}

function renderNotesOnMap(notes, map) {
  notes.forEach((note, idx) => {
    if (!note?.location?.latitude || !note.location.longitude) return;
    const title = note.content?.text?.trim() || "פתק ללא טקסט";
    const iconEl = document.createElement("img");
    iconEl.src = "/images/ClosedNote.png";
    iconEl.style.width = "40px";
    iconEl.style.height = "40px";
    new google.maps.marker.AdvancedMarkerElement({
      position: {
        lat: Number(note.location.latitude),
        lng: Number(note.location.longitude),
      },
      map,
      title,
      content: iconEl,
    }).addListener("click", () => openNoteAndShow(note.id));
  });
}
document.addEventListener("DOMContentLoaded", () => {
  updateAdminButtonVisibility();

  document.getElementById("to-signup").onclick = () => {
    document.getElementById("signup-error").classList.add("hidden");
    show("signup-screen");
  };

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

  document.getElementById("back-to-login").onclick = gotoLogin;
  document.getElementById("login-form").onsubmit = async (e) => {
    e.preventDefault();
    try {
      const email = document.getElementById("login-email").value.trim();
      const pwd = document.getElementById("login-password").value.trim();
      await signin(email, pwd);
      gotoHome(lastKnownLocation);
    } catch {
      show("wrong-password-screen");
    }
  };

  document.getElementById("wrong-back").onclick = gotoLogin;
  document.getElementById("wrong-forgot").onclick = () =>
    show("forgot-password-screen");
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
  if (forgotBackBtn) forgotBackBtn.onclick = gotoLogin;
  const sentBackBtn = document.getElementById("sent-back");
  if (sentBackBtn) sentBackBtn.onclick = gotoLogin;

  const newNoteBtn = document.getElementById("new-note-btn");
  if (newNoteBtn)
    newNoteBtn.onclick = () => {
      show("write-note-screen");
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            lastKnownLocation.lat = pos.coords.latitude;
            lastKnownLocation.lon = pos.coords.longitude;
            lastKnownLocation.placeId = await getPlaceIdFromCoordinates(
              lastKnownLocation.lat,
              lastKnownLocation.lon,
            );
          },
          (err) => alert("לא ניתן לקבל מיקום. לא ניתן לשמור את הפתק."),
        );
      } else {
        alert("המכשיר שלך לא תומך במיקום גיאוגרפי.");
      }
    };

  const writeBackBtn = document.getElementById("write-back-btn");
  if (writeBackBtn) writeBackBtn.onclick = () => gotoHome(lastKnownLocation);
  const toBrushBtn = document.getElementById("to-brush-btn");
  if (toBrushBtn)
    toBrushBtn.onclick = () => {
      show("brush-note-screen");
      initCanvas();
    };
  const brushBackBtn = document.getElementById("brush-back-btn");
  if (brushBackBtn) brushBackBtn.onclick = () => show("write-note-screen");

  const saveTextBtn = document.getElementById("save-text-note-btn");
  if (saveTextBtn)
    saveTextBtn.onclick = async () => {
      const textInput = document.getElementById("note-text"),
        canvas = document.getElementById("note-canvas");
      if (!textInput || !canvas) return;
      const text = textInput.value.trim();
      let drawingData = null;
      if (!isCanvasEmpty(canvas)) drawingData = canvas.toDataURL();
      await throwNote(
        text,
        drawingData,
        lastKnownLocation.lat,
        lastKnownLocation.lon,
        lastKnownLocation.placeId,
      );
      gotoHome(lastKnownLocation);
    };

  const saveDrawingBtn = document.getElementById("save-drawing-note-btn");
  if (saveDrawingBtn)
    saveDrawingBtn.onclick = async () => {
      const textInput = document.getElementById("note-text"),
        canvas = document.getElementById("note-canvas");
      if (!textInput || !canvas) return;
      const text = textInput.value.trim();
      let drawingData = null;
      if (!isCanvasEmpty(canvas)) drawingData = canvas.toDataURL();
      await throwNote(
        text,
        drawingData,
        lastKnownLocation.lat,
        lastKnownLocation.lon,
        lastKnownLocation.placeId,
      );
      gotoHome(lastKnownLocation);
    };

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
        try {
          const notes = await getNearbyNotes(
            locationData.lat,
            locationData.lon,
            500,
          );
          renderNotesOnHome(notes, locationData);
          const sizeW = 400,
            sizeH = 300,
            zoom = 15;
          const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
          if (!key) return;
          const base = "https://maps.googleapis.com/maps/api/staticmap";
          const centerParam = `center=${locationData.lat},${locationData.lon}&zoom=${zoom}&size=${sizeW}x${sizeH}&scale=2`;
          const icon = "../images/ClosedNote.png";
          const userMarker = `markers=icon:${encodeURIComponent(icon)}|${locationData.lat},${locationData.lon}`;
          const noteMarkers = notes
            .map(
              (n) =>
                `markers=icon:${encodeURIComponent(icon)}|${n.location.lat},${n.location.lon}`,
            )
            .join("&");
          const url = `${base}?${centerParam}&${userMarker}&${noteMarkers}&key=${key}`;
          const container = document.getElementById("home-content");
          container.style.backgroundImage = `url("${url}")`;
          container.style.backgroundSize = "cover";
          container.style.backgroundPosition = "center";
        } catch {
          alert("שגיאה בטעינת הפתקים.");
        }
        updateAdminButtonVisibility();
      },
      () => alert("לא ניתן לקבל מיקום."),
    );
  }

  async function openNoteAndShow(noteId) {
    const note = await getNoteContent(
      noteId,
      lastKnownLocation.lat,
      lastKnownLocation.lon,
    );
    show("note-content-screen");
    const contentDiv = document.getElementById("note-content");
    const noteScreen = document.getElementById("note-content-screen");
    noteScreen.dataset.noteId = noteId;
    contentDiv.innerHTML = "";
    contentDiv.style.position = "relative";
    const back = document.createElement("img");
    back.classList.add("note-background");
    back.src = note.content.drawingData
      ? "/images/WriteBrush.png"
      : "/images/WritePen (1).png";
    contentDiv.appendChild(back);
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

  document.getElementById("close-note-btn").onclick = async () => {
    const screen = document.getElementById("note-content-screen");
    const noteId = screen.dataset.noteId;
    await deleteNote(
      noteId,
      screen.dataset.latitude,
      screen.dataset.longitude,
    ).catch(() => {});
    screen.classList.add("hidden");
    show("home-content");
    gotoHome(lastKnownLocation);
  };

  document.getElementById("logout-btn").onclick = () => {
    localStorage.removeItem("jwt");
    gotoLogin();
  };

  [
    "app-icon1",
    "app-icon2",
    "app-icon3",
    "app-icon4",
    "app-icon5",
    "app-icon6",
  ].forEach((id) => {
    document.getElementById(id).onclick = () => show("user-menu-screen");
    document.getElementById("user-menu-back-btn").onclick = () =>
      gotoHome(lastKnownLocation);
  });

  document.getElementById("delete-account-btn").onclick = async () => {
    if (!confirm("אתה בטוח שברצונך למחוק את החשבון שלך?")) return;
    const pwd = prompt("הכנס את הסיסמה הנוכחית כדי לאשר מחיקה:");
    if (!pwd) return alert("מחיקה בוטלה.");
    try {
      await deleteAccount(pwd);
      alert("החשבון נמחק.");
      localStorage.removeItem("jwt");
      gotoLogin();
    } catch (err) {
      alert("אירעה שגיאה במחיקת החשבון: " + err);
    }
  };

  document.getElementById("back-to-home").onclick = () =>
    gotoHome(lastKnownLocation);

  document.getElementById("admin-btn").onclick = () => {
    show("admin-screen");
    fetchAllUsers();
    fetchAllNotes();
  };

  document.getElementById("admin-back").onclick = () =>
    gotoHome(lastKnownLocation);

  const toMapBtn = document.getElementById("to-map-btn");
  if (toMapBtn)
    toMapBtn.onclick = async () => {
      try {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej),
        );
        lastKnownLocation = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          placeId: await getPlaceIdFromCoordinates(
            pos.coords.latitude,
            pos.coords.longitude,
          ),
        };
        show("map-screen");
        setTimeout(async () => {
          const mapEl = document.getElementById("big-map");
          if (!mapEl || !window.google || !window.google.maps) {
            alert("שגיאה בטעינת המפה.");
            return;
          }
          const map = new google.maps.Map(mapEl, {
            center: { lat: lastKnownLocation.lat, lng: lastKnownLocation.lon },
            zoom: 14,
            mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
          });
          const avatar = document.createElement("img");
          avatar.src = "/images/Generic avatar.png";
          avatar.style.width = "40px";
          avatar.style.height = "40px";
          new google.maps.marker.AdvancedMarkerElement({
            position: {
              lat: lastKnownLocation.lat,
              lng: lastKnownLocation.lon,
            },
            map,
            title: "המיקום שלך",
            content: avatar,
          });
          try {
            const notes = await getNearbyNotes(
              lastKnownLocation.lat,
              lastKnownLocation.lon,
              5000,
            );
            renderNotesOnMap(notes, map);
          } catch {
            alert("שגיאה בטעינת הפתקים על המפה.");
          }
        }, 50);
      } catch (error) {
        if (error.code === error.PERMISSION_DENIED)
          alert("לא אישרת שימוש במיקום.");
        else alert("שגיאה בטעינת המפה.");
      }
    };

  gotoLogin();
});
