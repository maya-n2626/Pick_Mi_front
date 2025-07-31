import { state } from "./state.js";
import { notesAPI } from "./api.js";
import { locationService } from "./location.js";
import { showToast } from "./toast.js";

const mapController = {
  map: null,
  async init() {
    try {
      await locationService.getCurrentPosition();
      this.initializeMap();
      await this.loadNotesOnMap();
    } catch (error) {
      console.error("Error initializing map:", error);
      showToast(`Error loading map: ${error.message}`, "error");
    }
  },
  initializeMap() {
    if (!window.google) {
      console.error("Google Maps not loaded");
      return;
    }
    this.map = new google.maps.Map(document.getElementById("map"), {
      center: {
        lat: state.currentLocation.lat,
        lng: state.currentLocation.lon,
      },
      zoom: 15,
      mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
      disableDefaultUI: true,
    });
    new google.maps.marker.AdvancedMarkerElement({
      position: {
        lat: state.currentLocation.lat,
        lng: state.currentLocation.lon,
      },
      map: this.map,
      title: "Your Location",
    });
  },
  async loadNotesOnMap() {
    try {
      const notes = await notesAPI.getNearbyNotes(
        state.currentLocation.lat,
        state.currentLocation.lon,
        5000,
      );
      notes.forEach((note) => {
        if (note.location?.latitude && note.location?.longitude) {
          const img = document.createElement("img");
          img.src = "./images/ClosedNote.png";
          img.style.width = "40px";
          new google.maps.marker.AdvancedMarkerElement({
            position: {
              lat: Number(note.location.latitude),
              lng: Number(note.location.longitude),
            },
            map: this.map,
            title: note.content?.text || "Note",
            content: img,
          });
        }
      });
    } catch (error) {
      console.error("Error loading notes on map:", error);
    }
  },
};

export function initMap() {
    mapController.init();
}
