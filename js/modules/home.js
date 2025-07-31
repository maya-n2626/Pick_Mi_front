import { state } from "./state.js";
import { notesAPI } from "./api.js";
import { locationService } from "./location.js";
import { authController } from "./auth.js";
import { debounce } from "./utils.js";

const homeController = {
  resizeObserver: null,
  async init() {
    try {
      await locationService.getCurrentPosition();
      this.setupAdminButton();
      this.renderMap(); // Render map once
      await this.loadNearbyNotes(); // Then load notes

      const container = document.getElementById("notes-container");
      this.resizeObserver = new ResizeObserver(debounce(() => this.renderMap(), 250));
      this.resizeObserver.observe(container);

    } catch (error) {
      console.error("Error initializing home:", error);
    }
  },
  async loadNearbyNotes() {
    if (!state.currentLocation.lat || !state.currentLocation.lon) return;
    try {
      const notes = await notesAPI.getNearbyNotes(
        state.currentLocation.lat,
        state.currentLocation.lon,
        1000,
      );
      this.renderNotes(notes);
    } catch (error) {
      console.error("Error loading notes:", error);
    }
  },
  renderMap() {
    const container = document.getElementById("notes-container");
    if (!container || !state.currentLocation.lat) return;
    const mapWidth = container.offsetWidth;
    const mapHeight = container.offsetHeight;
    const centerLat = state.currentLocation.lat;
    const centerLon = state.currentLocation.lon;
    const zoom = 15;

    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${centerLat},${centerLon}&zoom=${zoom}&size=${mapWidth}x${mapHeight}&maptype=roadmap&markers=color:red%7Clabel:P%7C${centerLat},${centerLon}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`;
    container.style.backgroundImage = `url(${staticMapUrl})`;
    this.loadNearbyNotes();
  },
  renderNotes(notes) {
    const container = document.getElementById("notes-container");
    if (!container || !state.currentLocation.lat) return;

    const mapWidth = container.offsetWidth;
    const mapHeight = container.offsetHeight;
    const centerLat = state.currentLocation.lat;
    const centerLon = state.currentLocation.lon;
    const zoom = 15;

    // Clear only the notes, not the map background
    container.innerHTML = "";

    const project = (lat, lon) => {
      let siny = Math.sin((lat * Math.PI) / 180);
      siny = Math.min(Math.max(siny, -0.9999), 0.9999);
      return {
        x: 256 * (0.5 + lon / 360),
        y: 256 * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI)),
      };
    };

    const getPixelCoords = (lat, lon) => {
      const worldCoords = project(lat, lon);
      const centerCoords = project(centerLat, centerLon);
      const scale = Math.pow(2, zoom);
      const x = (worldCoords.x - centerCoords.x) * scale + mapWidth / 2;
      const y = (worldCoords.y - centerCoords.y) * scale + mapHeight / 2;
      return { x, y };
    };

    notes.forEach((note) => {
      if (note.location?.latitude && note.location?.longitude) {
        const { x, y } = getPixelCoords(
          note.location.latitude,
          note.location.longitude,
        );

        if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
          const noteEl = document.createElement("a");
          noteEl.className = "floating-note";
          noteEl.style.left = `${x}px`;
          noteEl.style.top = `${y}px`;
          noteEl.style.animationDelay = `${Math.random() * 6}s`;
          noteEl.innerHTML = `<img src="./images/ClosedNote.png" alt="Note">`;

          noteEl.addEventListener("click", async (e) => {
            e.preventDefault();
            state.currentNoteId = note.id;
            const { noteViewController } = await import("./note.js");
            const rect = noteEl.getBoundingClientRect();
            const clickX = e.clientX - rect.left + (rect.width / 2);
            const clickY = e.clientY - rect.top + (rect.height / 2);
            noteViewController.loadNote(note.id, `${clickX}px`, `${clickY}px`);
          });
          container.appendChild(noteEl);
        }
      }
    });
  },
  setupAdminButton() {
    const adminBtn = document.getElementById("admin-btn");
    if (authController.isAdmin()) {
      adminBtn.style.display = "block";
    } else {
      adminBtn.style.display = "none";
    }
  },
};

export function initHome() {
    homeController.init();
}

export { homeController };
