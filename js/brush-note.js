import { throwNote } from "./modules/notes.js";
import { goto } from "./modules/ui.js";
import { initCanvas, isCanvasEmpty } from "./modules/canvas.js";

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
  initCanvas();

  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        lastKnownLocation.lat = position.coords.latitude;
        lastKnownLocation.lon = position.coords.longitude;
        lastKnownLocation.placeId = await getPlaceIdFromCoordinates(
          lastKnownLocation.lat,
          lastKnownLocation.lon,
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

  const brushBackBtn = document.getElementById("brush-back-btn");
  if (brushBackBtn) {
    brushBackBtn.addEventListener("click", () => {
      goto("write-note");
    });
  }

  const saveBtn1 = document.getElementById("save-drawing-note-btn");
  if (saveBtn1) {
    saveBtn1.addEventListener("click", async () => {
      const textInput = document.getElementById("note-text");
      const canvas = document.getElementById("note-canvas");

      if (!textInput || !canvas) {
        return;
      }

      const text = textInput.value.trim();
      let drawingData = null;
      if (!isCanvasEmpty(canvas)) {
        drawingData = canvas.toDataURL();
      }

      await throwNote(
        text,
        drawingData,
        lastKnownLocation.lat,
        lastKnownLocation.lon,
        lastKnownLocation.placeId,
      );
      goto("home");
    });
  }

  document.getElementById("clear-canvas-btn").addEventListener("click", () => {
    const canvas = document.getElementById("note-canvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });
});