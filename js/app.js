// =================================================================
// Global State & Configuration
// =================================================================
const state = {
  currentUser: null,
  currentLocation: { lat: null, lon: null, placeId: null },
  currentNoteId: null,
};

const API_BASE = import.meta.env.VITE_API_URL;

// =================================================================
// Auth Controller - Manages all authentication logic
// =================================================================
const authController = {
  init() {
    const token = localStorage.getItem("jwt");
    if (token) {
      const userPayload = this.decodeJwt(token);
      if (userPayload) {
        state.currentUser = {
          token: token,
          user: userPayload,
        };
      } else {
        // Clear invalid token
        localStorage.removeItem("jwt");
      }
    }
  },

  decodeJwt(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid JWT');
      return JSON.parse(atob(parts[1]));
    } catch (e) {
      console.error("Failed to decode JWT:", e);
      return null;
    }
  },

  getUser() {
    return state.currentUser?.user;
  },

  getToken() {
    return state.currentUser?.token;
  },

  isAdmin() {
    return this.getUser()?.role === 'admin';
  },

  async signin(email, password) {
    const response = await apiFetch("/api/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const token = response.token;
    if (token) {
      localStorage.setItem("jwt", token);
      this.init(); // Re-initialize auth state from new token
    }
    return response;
  },

  logout() {
    localStorage.removeItem("jwt");
    state.currentUser = null;
    showScreen("login-screen");
  },
};

// =================================================================
// Utility Functions
// =================================================================
const showScreen = (screenId) => {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active");
  });
  const screen = document.getElementById(screenId);
  if (screen) {
    screen.classList.add("active");
  } else {
    console.error(`Screen with ID "${screenId}" not found.`);
  }
};

const showError = (elementId, message) => {
  const element = document.getElementById(elementId);
  element.textContent = message;
  element.style.display = "block";
  setTimeout(() => {
    element.style.display = "none";
  }, 5000);
};

// =================================================================
// API Fetch Wrapper
// =================================================================
const apiFetch = async (path, options = {}) => {
  const headers = { ...(options.headers || {}) };
  const token = authController.getToken();
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(API_BASE + path, { ...options, headers });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || response.statusText);
    }
    return response.status !== 204 ? response.json() : {};
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// =================================================================
// API Modules (Auth, Notes, Admin)
// =================================================================
// =================================================================
// API Modules (Auth, Notes, Admin)
// =================================================================
const authAPI = {
  signup: (email, password) => apiFetchPublic("/api/auth/signup", { method: "POST", body: JSON.stringify({ email, password }) }),
  forgotPassword: (email) => apiFetchPublic("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (token, newPassword) => apiFetchPublic("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token, newPassword }) }),
  deleteAccount: (password) => apiFetch("/api/auth/me", { method: "DELETE", body: JSON.stringify({ password }) }), // Requires auth
};

const notesAPI = {
  createNote: (text, drawingData, lat, lon, placeId) => {
    const content = { text: text || "" }; // Ensure text is always a string
    if (drawingData) {
      content.drawingData = drawingData;
    }

    return apiFetch("/api/notes", {
      method: "POST",
      body: JSON.stringify({
        content,
        location: { latitude: lat, longitude: lon, placeId },
      }),
    });
  },
  getNearbyNotes: (lat, lon, radius = 1000) =>
    apiFetch(`/api/notes/nearby?lat=${lat}&lon=${lon}&radius=${radius}`),
  getNoteContent: (id, lat, lon) =>
    apiFetch(`/api/notes/${id}?lat=${lat}&lon=${lon}`),
  deleteNote: (id, lat, lon) =>
    apiFetch(`/api/notes/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ latitude: Number(lat), longitude: Number(lon) }),
    }),
};

const adminAPI = {
  getAllUsers: () => apiFetch("/api/admin/users"),
  getAllNotes: () => apiFetch("/api/admin/notes"),
  deleteUser: (userId) =>
    apiFetch(`/api/admin/users/${userId}`, { method: "DELETE" }),
  deleteNoteAsAdmin: (noteId) =>
    apiFetch(`/api/admin/notes/${noteId}`, { method: "DELETE" }),
};

// =================================================================
// Location & Canvas Services
// =================================================================
const locationService = {
  async getPlaceIdFromCoordinates(lat, lon) {
    if (!google.maps.places) {
      console.error("Google Maps Places service not available.");
      return "0";
    }
    const request = {
      fields: ["displayName", "location", "id"],
      locationRestriction: {
        center: { lat, lng: lon },
        radius: 500,
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
        return places[0].id;
      } else {
        console.warn("⚠️ No nearby places found.");
        return "0"; // Return a default/null identifier
      }
    } catch (error) {
      console.warn("⚠️ Error during Place.searchNearby:", error);
      return "0";
    }
  },

  async getCurrentPosition() {
    const cachedLocation = localStorage.getItem("lastKnownLocation");
    if (cachedLocation) {
      const parsed = JSON.parse(cachedLocation);
      // If cache is recent (e.g., 5 minutes), return it.
      if (Date.now() - (parsed.timestamp || 0) < 300000) {
        state.currentLocation = parsed;
        return parsed;
      }
    }

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error("Geolocation is not supported."));
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const placeId = await this.getPlaceIdFromCoordinates(lat, lon);
          const location = { lat, lon, placeId, timestamp: Date.now() };

          state.currentLocation = location;
          localStorage.setItem("lastKnownLocation", JSON.stringify(location));
          resolve(location);
        },
        (err) => {
          console.warn("Could not get location:", err);
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );
    });
  },
};

const canvasService = {
  init() {
    const canvas = document.getElementById("drawing-canvas");
    if (!canvas) return;

    state.canvas = canvas;
    state.ctx = canvas.getContext("2d");

    let painting = false;

    const startPaint = (e) => {
      painting = true;
      this.draw(e);
    };

    const stopPaint = () => {
      painting = false;
      state.ctx.beginPath();
    };

    this.draw = (e) => {
      if (!painting) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const brushColor = document.getElementById("brush-color").value;
      const brushSize = document.getElementById("brush-size").value;

      state.ctx.lineWidth = brushSize;
      state.ctx.lineCap = "round";
      state.ctx.strokeStyle = brushColor;

      state.ctx.lineTo(x, y);
      state.ctx.stroke();
      state.ctx.beginPath();
      state.ctx.moveTo(x, y);
    };

    canvas.addEventListener("mousedown", startPaint);
    canvas.addEventListener("mouseup", stopPaint);
    canvas.addEventListener("mouseout", stopPaint);
    canvas.addEventListener("mousemove", this.draw);

    // Touch events for mobile
    canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent("mousedown", {
        clientX: touch.clientX,
        clientY: touch.clientY,
      });
      canvas.dispatchEvent(mouseEvent);
    });

    canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent("mousemove", {
        clientX: touch.clientX,
        clientY: touch.clientY,
      });
      canvas.dispatchEvent(mouseEvent);
    });

    canvas.addEventListener("touchend", (e) => {
      e.preventDefault();
      const mouseEvent = new MouseEvent("mouseup", {});
      canvas.dispatchEvent(mouseEvent);
    });
  },

  clear() {
    if (state.canvas && state.ctx) {
      state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
    }
  },

  getDataURL() {
    return state.canvas ? state.canvas.toDataURL() : null;
  },
  isCanvasEmpty() {
    const pixels = state.ctx.getImageData(
      0,
      0,
      state.canvas.width,
      state.canvas.height,
    ).data;
    return !pixels.some((channel) => channel !== 0);
  },
};

// =================================================================
// UI Controllers
// =================================================================
const homeController = {
  async init() {
    try {
      await locationService.getCurrentPosition();
      this.setupAdminButton();
      this.renderMap(); // Render map once
      await this.loadNearbyNotes(); // Then load notes
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

    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${centerLat},${centerLon}&zoom=${zoom}&size=${mapWidth}x${mapHeight}&maptype=roadmap&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`;
    container.style.backgroundImage = `url(${staticMapUrl})`;
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

          noteEl.addEventListener("click", (e) => {
            e.preventDefault();
            state.currentNoteId = note.id;
            noteViewController.loadNote(note.id);
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

const noteViewController = {
  async loadNote(noteId) {
    try {
      const note = await notesAPI.getNoteContent(
        noteId,
        state.currentLocation.lat,
        state.currentLocation.lon,
      );
      this.renderNote(note);
      showScreen("note-view-screen");
      // Delete the note in the background after showing it.
      notesAPI
        .deleteNote(
          noteId,
          state.currentLocation.lat,
          state.currentLocation.lon,
        )
        .catch((err) => console.error("Failed to delete note:", err));
    } catch (error) {
      console.error("Error loading note:", error);
      alert(`Error loading note: ${error.message}`);
      // If loading fails, go back and refresh to remove the potentially broken note.
      this.closeNote();
    }
  },

  async closeNote() {
    showScreen("home-screen");
    // Only reload the notes, not the whole map
    await homeController.loadNearbyNotes();
  },

  renderNote(note) {
    const container = document.getElementById("note-content");
    container.innerHTML = "";
    if (note.content.text) {
      const p = document.createElement("p");
      p.textContent = note.content.text;
      p.style.cssText =
        "font-size: 18px; line-height: 1.6; margin-bottom: 20px;";
      container.appendChild(p);
    }
    if (
      note.content.drawingData &&
      note.content.drawingData !==
        "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjwvc3ZnPg=="
    ) {
      const img = document.createElement("img");
      img.src = note.content.drawingData;
      img.style.cssText = "max-width: 100%; border-radius: 12px;";
      container.appendChild(img);
    }
  },
};

const noteEditorController = {
  init() {
    canvasService.init();
    this.setupModeToggle();
  },
  setupModeToggle() {
    const textMode = document.getElementById("text-mode");
    const drawMode = document.getElementById("draw-mode");
    const textEditor = document.getElementById("text-editor");
    const drawEditor = document.getElementById("draw-editor");
    textMode.addEventListener("click", () => {
      textEditor.style.display = "block";
      drawEditor.style.display = "none";
      textMode.style.background = "#667eea";
      textMode.style.color = "white";
      drawMode.style.background = "none";
      drawMode.style.color = "#667eea";
    });
    drawMode.addEventListener("click", () => {
      textEditor.style.display = "none";
      drawEditor.style.display = "block";
      drawMode.style.background = "#667eea";
      drawMode.style.color = "white";
      textMode.style.background = "none";
      textMode.style.color = "#667eea";
      canvasService.init();
    });
  },
  async saveNote() {
    try {
      await locationService.getCurrentPosition();

      const textInput = document.getElementById("note-text").value;
      const drawingData = !canvasService.isCanvasEmpty()
        ? canvasService.getDataURL()
        : null;

      if (!textInput.trim() && !drawingData) {
        alert("Please add some content to your note");
        return;
      }

      // Ensure text is an empty string if only a drawing is provided.
      const text = textInput.trim();

      await notesAPI.createNote(
        text,
        drawingData,
        state.currentLocation.lat,
        state.currentLocation.lon,
        state.currentLocation.placeId,
      );

      document.getElementById("note-text").value = "";
      canvasService.clear();
      showScreen("home-screen");
      await homeController.loadNearbyNotes();
    } catch (error) {
      console.error("Error saving note:", error);
      alert(`Error saving note: ${error.message}`);
    }
  },
};

const mapController = {
  map: null,
  async init() {
    try {
      await locationService.getCurrentPosition();
      this.initializeMap();
      await this.loadNotesOnMap();
    } catch (error) {
      console.error("Error initializing map:", error);
      alert(`Error loading map: ${error.message}`);
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

const adminController = {
  async init() {
    window.adminController = this;
    await this.loadUsers();
    await this.loadNotes();
  },
  async loadUsers() {
    try {
      const users = await adminAPI.getAllUsers();
      const container = document.getElementById("admin-users");
      container.innerHTML = users
        .map(
          (user) => `
        <div class="admin-item">
          <div>
            <strong>${user.email}</strong>
            <span style="color: #666; margin-left: 10px;">(${user.role})</span>
          </div>
          <button class="btn-danger" onclick="adminController.deleteUser('${user.id}')">Delete</button>
        </div>`,
        )
        .join("");
    } catch (error) {
      console.error("Error loading users:", error);
      document.getElementById("admin-users").innerHTML =
        "<p>Error loading users</p>";
    }
  },
  async loadNotes() {
    try {
      const notes = await adminAPI.getAllNotes();
      const container = document.getElementById("admin-notes");
      container.innerHTML = notes
        .map(
          (note) => `
        <div class="admin-item">
          <div>
            <p>${note.content?.text ? note.content.text.substring(0, 50) + "..." : "Drawing note"}</p>
            <small style="color: #666;">by ${note.userId}</small>
          </div>
          <button class="btn-danger" onclick="adminController.deleteNote('${note.id}')">Delete</button>
        </div>`,
        )
        .join("");
    } catch (error) {
      console.error("Error loading notes:", error);
      document.getElementById("admin-notes").innerHTML =
        "<p>Error loading notes</p>";
    }
  },
  async deleteUser(userId) {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await adminAPI.deleteUser(userId);
      await this.loadUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert(`Error deleting user: ${error.message}`);
    }
  },
  async deleteNote(noteId) {
    if (!confirm("Are you sure you want to delete this note?")) return;
    try {
      await adminAPI.deleteNoteAsAdmin(noteId);
      await this.loadNotes();
    } catch (error) {
      console.error("Error deleting note:", error);
      alert(`Error deleting note: ${error.message}`);
    }
  },
};

// =================================================================
// Main App Initialization
// =================================================================
document.addEventListener("DOMContentLoaded", () => {
  // Initialize auth state first
  authController.init();

  // Setup event listeners
  // Auth forms
  document
    .getElementById("login-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;
      try {
        await authController.signin(email, password);
        showScreen("home-screen");
        await homeController.init();
      } catch (error) {
        showError("login-error", error.message);
      }
    });

  document
    .getElementById("signup-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("signup-email").value.trim();
      const password = document.getElementById("signup-password").value;
      try {
        await authAPI.signup(email, password);
        alert("Account created successfully! Please sign in.");
        showScreen("login-screen");
      } catch (error) {
        showError("signup-error", error.message);
      }
    });

  document
    .getElementById("forgot-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("forgot-email").value.trim();
      try {
        await authAPI.forgotPassword(email);
        alert(
          "If an account with that email exists, a password reset link has been sent.",
        );
        showScreen("login-screen");
      } catch (error) {
        showError("forgot-error", error.message);
      }
    });

  // Navigation buttons
  const navButtons = {
    "show-signup": "signup-screen",
    "show-forgot": "forgot-screen",
    "back-to-login": "login-screen",
    "back-to-login-2": "login-screen",
    "show-map": "map-screen",
    "show-profile": "profile-screen",
    "admin-btn": "admin-screen",
    "new-note-btn": "note-editor-screen",
    "back-from-map": "home-screen",
    "back-from-editor": "home-screen",
    "back-from-note": null, // Handled by its own controller
    "back-from-profile": "home-screen",
    "back-from-admin": "home-screen",
  };

  for (const [btnId, screenId] of Object.entries(navButtons)) {
    document.getElementById(btnId).addEventListener("click", async () => {
      showScreen(screenId);
      if (btnId === "show-map") await mapController.init();
      if (btnId === "admin-btn") await adminController.init();
      if (btnId === "new-note-btn") noteEditorController.init();
    });
  }

  // Other actions
  document
    .getElementById("back-from-note")
    .addEventListener("click", () => noteViewController.closeNote());
  document
    .getElementById("save-note")
    .addEventListener("click", () => noteEditorController.saveNote());
  document
    .getElementById("clear-canvas")
    .addEventListener("click", () => canvasService.clear());
  document
    .getElementById("logout-btn")
    .addEventListener("click", () => authController.logout());

  document
    .getElementById("delete-account-btn")
    .addEventListener("click", async () => {
      const password = prompt(
        "Enter your current password to confirm account deletion:",
      );
      if (!password) return;
      if (
        !confirm(
          "Are you sure you want to delete your account? This cannot be undone.",
        )
      )
        return;
      try {
        await authAPI.deleteAccount(password);
        alert("Account deleted successfully.");
        authController.logout();
      } catch (error) {
        console.error("Error deleting account:", error);
        alert(`Error deleting account: ${error.message}`);
      }
    });

  // Set initial screen based on auth state
  const urlParams = new URLSearchParams(window.location.search);
  if (window.location.pathname.includes("reset-password") && urlParams.has("token")) {
    showScreen("reset-password-screen");
    resetPasswordController.init();
  } else if (authController.getUser()) {
    showScreen("home-screen");
    homeController.init();
  } else {
    showScreen("login-screen");
  }
  
  console.log("PickMi SPA initialized");
});