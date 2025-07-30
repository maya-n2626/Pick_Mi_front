import { getNearbyNotes, getNoteContent, deleteNote } from "./modules/notes.js";
import { goto } from "./modules/ui.js";
import { isAdmin, getUser } from "./modules/auth.js";
import { lastKnownLocation, updateCurrentLocation } from "./modules/location.js";

console.log("home.js is running");

// Check if user is logged in
if (!getUser()) {
  goto("login");
}

window.updateAdminButtonVisibility = function () {
  const homeContent = document.getElementById("home-content");
  if (isAdmin()) {
    let adminBtn = document.getElementById("admin-btn");
    if (!adminBtn) {
      adminBtn = document.createElement("button");
      adminBtn.id = "admin-btn";
      adminBtn.classList.add("btn-link");
      adminBtn.textContent = "Admin";
      homeContent.insertBefore(adminBtn, homeContent.firstChild);
      adminBtn.addEventListener("click", () => {
        goto("admin");
      });
    }
  } else {
    const adminBtn = document.getElementById("admin-btn");
    if (adminBtn) {
      adminBtn.remove();
    }
  }
};

async function updateLocationAndRenderHome() {
  console.log("updateLocationAndRenderHome started.");
  try {
    await updateCurrentLocation();
    console.log("Geolocation position obtained and lastKnownLocation updated:", lastKnownLocation);

    console.log("Fetching nearby notes...");
    const notes = await getNearbyNotes(
      lastKnownLocation.lat,
      lastKnownLocation.lon,
      500,
    );
    console.log("Nearby notes fetched:", notes);

    renderNotesOnHome(notes, lastKnownLocation);
    console.log("Notes rendered on home.");

    const sizeW = 400,
      sizeH = 300;
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const base = "https://maps.googleapis.com/maps/api/staticmap";
    const centerParam =
      `center=${lastKnownLocation.lat},${lastKnownLocation.lon}` +
      `&zoom=15&size=${sizeW}x${sizeH}&scale=2`;
    const markerIconUrl = "../images/ClosedNote.png";

    const userMarker = `markers=icon:${encodeURIComponent(markerIconUrl)}|${lastKnownLocation.lat},${lastKnownLocation.lon}`;
    const noteMarkers = notes
      .map(
        (n) =>
          `markers=icon:${encodeURIComponent(markerIconUrl)}|${n.location.lat},${n.location.lon}`,
      )
      .join("&");
    const url = `${base}?${centerParam}&${userMarker}&${noteMarkers}&key=${key}`;

    const container = document.getElementById("home-content");
    if (container) {
      container.style.backgroundImage = `url("${url}")`;
      container.style.backgroundSize = "cover";
      container.style.backgroundPosition = "center";
      console.log("Background image set.");
    } else {
      console.warn("home-content container not found.");
    }

    window.updateAdminButtonVisibility();
    console.log("Admin button visibility updated.");
  } catch (err) {
    console.warn("לא ניתן לקבל מיקום:", err);
  }
  console.log("updateLocationAndRenderHome finished.");
}

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
        localStorage.setItem("noteId", note.id);
        localStorage.setItem("lastKnownLocation", JSON.stringify(lastKnownLocation));
        goto("note-content");
        noteEl.remove();
      });

    notesList.appendChild(noteEl);
  });
}

window.initHomeMap = async function () {
  console.log("initHomeMap called.");
  const storedLocation = localStorage.getItem("lastKnownLocation");
  if (storedLocation) {
    Object.assign(lastKnownLocation, JSON.parse(storedLocation));
    console.log("Loaded lastKnownLocation from localStorage:", lastKnownLocation);
  }

  await updateLocationAndRenderHome();
  console.log("updateLocationAndRenderHome completed.");

  const newNoteBtn = document.getElementById("new-note-btn");
  if (newNoteBtn) {
    newNoteBtn.addEventListener("click", () => {
      console.log("New Note button clicked.");
      goto("create-note");
    });
    console.log("New Note button event listener attached.");
  }

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      console.log("Logout button clicked.");
      localStorage.removeItem("jwt");
      goto("login");
    });
    console.log("Logout button event listener attached.");
  }

  ["app-icon1"].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener("click", () => {
        console.log(`${id} clicked.`);
        goto("user-menu");
      });
      console.log(`${id} event listener attached.`);
    }
  });

  const toMapBtn = document.getElementById("to-map-btn");
  if (toMapBtn) {
    toMapBtn.addEventListener("click", async () => {
      console.log("To Map button clicked.");
      goto("map");
    });
    console.log("To Map button event listener attached.");
  }

  // The admin button is now dynamically added, so its event listener is attached when it's created.
  // No need to getElementById here.

  console.log("All event listeners attached in initHomeMap.");
};