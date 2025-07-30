import { getNearbyNotes, getNoteContent, deleteNote } from "./modules/notes.js";
import { goto } from "./modules/ui.js";
import { isAdmin } from "./modules/auth.js";

console.log("home.js is running");

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

async function updateLocationAndRenderHome() {
  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });

    lastKnownLocation.lat = position.coords.latitude;
    lastKnownLocation.lon = position.coords.longitude;
    lastKnownLocation.placeId = await getPlaceIdFromCoordinates(
      lastKnownLocation.lat,
      lastKnownLocation.lon,
    );
    localStorage.setItem("lastKnownLocation", JSON.stringify(lastKnownLocation));

    const notes = await getNearbyNotes(
      lastKnownLocation.lat,
      lastKnownLocation.lon,
      500,
    );

    renderNotesOnHome(notes, lastKnownLocation);

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
    container.style.backgroundImage = `url("${url}")`;
    container.style.backgroundSize = "cover";
    container.style.backgroundPosition = "center";

    window.updateAdminButtonVisibility();
  } catch (err) {
    console.warn("לא ניתן לקבל מיקום:", err);
  }
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
  const storedLocation = localStorage.getItem("lastKnownLocation");
  if (storedLocation) {
    lastKnownLocation = JSON.parse(storedLocation);
  }

  updateLocationAndRenderHome();

  const newNoteBtn = document.getElementById("new-note-btn");
  if (newNoteBtn) {
    newNoteBtn.addEventListener("click", () => {
      goto("write-note");
    });
  }

  document.addEventListener("DOMContentLoaded", function() {

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("jwt");
        goto("login");
      });
    }

    ["app-icon1"].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener("click", () => {
          goto("user-menu");
        });
      }
    });

    // The admin button is now dynamically added, so its event listener is attached when it's created.
    // No need to getElementById here.

    const toMapBtn = document.getElementById("to-map-btn");
    if (toMapBtn) {
      toMapBtn.addEventListener("click", async () => {
        goto("map");
      });
    }
  });
};