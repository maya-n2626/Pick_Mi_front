import { getNearbyNotes, getNoteContent } from "./modules/notes.js";
import { goto } from "./modules/ui.js";
import { getUser } from "./modules/auth.js";

// Check if user is logged in
if (!getUser()) {
  goto("login");
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

function renderNotesOnMap(notes, map) {
  notes.forEach((note) => {
    if (
      note &&
      note.location &&
      note.location.latitude != null &&
      note.location.longitude != null
    ) {
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
      }).addListener("click", () => {
        localStorage.setItem("noteId", note.id);
        goto("note-content");
      });
    } else {
      console.warn(`❌ SKIPPING note due to invalid or missing coordinates.`);
    }
  });
}

window.initMapPage = async function () {
  const storedLocation = localStorage.getItem("lastKnownLocation");
  if (storedLocation) {
    lastKnownLocation = JSON.parse(storedLocation);
  }

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });

    lastKnownLocation = {
      lat: position.coords.latitude,
      lon: position.coords.longitude,
      placeId: await getPlaceIdFromCoordinates(
        position.coords.latitude,
        position.coords.longitude,
      ),
    };
    localStorage.setItem("lastKnownLocation", JSON.stringify(lastKnownLocation));

    const map = new google.maps.Map(document.getElementById("big-map"), {
      center: { lat: lastKnownLocation.lat, lng: lastKnownLocation.lon },
      zoom: 14,
      mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
      disableDefaultUI: true, // This will remove all default UI controls
    });

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

    const notes = await getNearbyNotes(
      lastKnownLocation.lat,
      lastKnownLocation.lon,
      5000,
    );

    renderNotesOnMap(notes, map);
  } catch (error) {
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

  const backHomeBtn = document.getElementById("back-to-home");
  if (backHomeBtn) {
    backHomeBtn.addEventListener("click", () => {
      goto("home");
    });
  }
};