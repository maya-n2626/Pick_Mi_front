import { getNearbyNotes, getNoteContent } from "./modules/notes.js";
import { goto } from "./modules/ui.js";
import { getUser } from "./modules/auth.js";
import { lastKnownLocation, updateCurrentLocation } from "./modules/location.js";

// Check if user is logged in
if (!getUser()) {
  goto("login");
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
    Object.assign(lastKnownLocation, JSON.parse(storedLocation));
  }

  try {
    await updateCurrentLocation();

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