// Global state management
const state = {
  currentUser: null,
  currentLocation: { lat: null, lon: null, placeId: null },
  currentNoteId: null,
  isDrawing: false,
  canvas: null,
  ctx: null,
};

// API Configuration
const API_BASE = import.meta.env.VITE_API_URL;

// Utility functions
const jwt = () => state.currentUser?.token || "";

const showScreen = (screenId) => {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active");
  });
  document.getElementById(screenId).classList.add("active");
};

const showError = (elementId, message) => {
  const element = document.getElementById(elementId);
  element.textContent = message;
  element.style.display = "block";
  setTimeout(() => {
    element.style.display = "none";
  }, 5000);
};

// API wrapper function
const apiFetch = async (path, options = {}) => {
  const headers = options.headers || {};
  if (!headers.Authorization && jwt()) {
    headers.Authorization = "Bearer " + jwt();
  }
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(API_BASE + path, {
      ...options,
      headers,
    });

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

// Authentication functions
const authAPI = {
  async signup(email, password) {
    return apiFetch("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async signin(email, password) {
    const response = await apiFetch("/api/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    state.currentUser = {
      token: response.token,
      user: response.user,
    };

    return response;
  },

  async forgotPassword(email) {
    return apiFetch("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async deleteAccount(password) {
    return apiFetch("/api/auth/me", {
      method: "DELETE",
      body: JSON.stringify({ password }),
    });
  },
};

// Notes API
const notesAPI = {
  async createNote(text, drawingData, lat, lon, placeId) {
    return apiFetch("/api/notes", {
      method: "POST",
      body: JSON.stringify({
        content: { text, drawingData },
        location: { latitude: lat, longitude: lon, placeId },
      }),
    });
  },

  async getNearbyNotes(lat, lon, radius = 1000) {
    return apiFetch(`/api/notes/nearby?lat=${lat}&lon=${lon}&radius=${radius}`);
  },

  async getNoteContent(id, lat, lon) {
    return apiFetch(`/api/notes/${id}?lat=${lat}&lon=${lon}`);
  },

  async deleteNote(id, lat, lon) {
    return apiFetch(`/api/notes/${id}`, {
      method: "DELETE",
      body: JSON.stringify({
        latitude: Number(lat),
        longitude: Number(lon),
      }),
    });
  },
};

// Admin API
const adminAPI = {
  async getAllUsers() {
    return apiFetch("/api/admin/users");
  },

  async getAllNotes() {
    return apiFetch("/api/admin/notes");
  },

  async deleteUser(userId) {
    return apiFetch(`/api/admin/users/${userId}`, { method: "DELETE" });
  },

  async deleteNoteAsAdmin(noteId) {
    return apiFetch(`/api/admin/notes/${noteId}`, { method: "DELETE" });
  },
};

// Location services
const locationService = {
  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          state.currentLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            placeId: "temp-place-id",
          };
          resolve(state.currentLocation);
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
      );
    });
  },
};

// Canvas drawing functionality
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

// UI Controllers
const homeController = {
  async init() {
    try {
      await locationService.getCurrentPosition();
      await this.loadNearbyNotes();
      this.setupAdminButton();
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

  renderNotes(notes) {
    const container = document.getElementById("notes-container");
    container.innerHTML = "";

    notes.forEach((note, index) => {
      const noteEl = document.createElement("div");
      noteEl.className = "floating-note";
      noteEl.style.left = Math.random() * 80 + "%";
      noteEl.style.top = Math.random() * 80 + "%";
      noteEl.style.animationDelay = Math.random() * 6 + "s";

      noteEl.addEventListener("click", () => {
        state.currentNoteId = note.id;
        noteViewController.loadNote(note.id);
      });

      container.appendChild(noteEl);
    });
  },

  setupAdminButton() {
    const user = state.currentUser?.user;
    const adminBtn = document.getElementById("admin-btn");
    if (user?.role === "admin") {
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
      await notesAPI.deleteNote(
        noteId,
        state.currentLocation.lat,
        state.currentLocation.lon,
      );
    } catch (error) {
      console.error("Error loading note:", error);
      alert("Error loading note: " + error.message);
    }
  },

  renderNote(note) {
    const container = document.getElementById("note-content");
    container.innerHTML = "";

    if (note.content.text) {
      const p = document.createElement("p");
      p.textContent = note.content.text;
      p.style.fontSize = "18px";
      p.style.lineHeight = "1.6";
      p.style.marginBottom = "20px";
      container.appendChild(p);
    }

    if (
      note.content.drawingData &&
      note.content.drawingData !==
        "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjwvc3ZnPg=="
    ) {
      const img = document.createElement("img");
      img.src = note.content.drawingData;
      img.style.maxWidth = "100%";
      img.style.borderRadius = "12px";
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

      const text = document.getElementById("note-text").value.trim();
      const drawingData = !canvasService.isCanvasEmpty(canvas)
        ? canvasService.getDataURL()
        : null;

      if (!text && !drawingData) {
        alert("Please add some content to your note");
        return;
      }

      await notesAPI.createNote(
        text,
        drawingData,
        state.currentLocation.lat,
        state.currentLocation.lon,
        state.currentLocation.placeId,
      );

      // Clear the editor
      document.getElementById("note-text").value = "";
      canvasService.clear();

      showScreen("home-screen");
      await homeController.loadNearbyNotes();
    } catch (error) {
      console.error("Error saving note:", error);
      alert("Error saving note: " + error.message);
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
      alert("Error loading map: " + error.message);
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
      styles: [
        {
          featureType: "all",
          elementType: "geometry.fill",
          stylers: [{ color: "#f0f0f0" }],
        },
      ],
    });

    // Add user location marker
    new google.maps.marker.AdvancedMarkerElement({
      position: {
        lat: state.currentLocation.lat,
        lng: state.currentLocation.lon,
      },
      map: this.map,
      title: "Your Location",
      icon: {
        scale: 8,
        fillColor: "#667eea",
        fillOpacity: 1,
        strokeColor: "#fff",
        strokeWeight: 2,
      },
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
        if (
          note.location &&
          note.location.latitude &&
          note.location.longitude
        ) {
          const img = document.createElement("img");
          img.src = "./images/ClosedNote.png";
          img.style.width = "40px";
          img.style.height = "40px";

          const marker = new google.maps.marker.AdvancedMarkerElement({
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
    await this.loadUsers();
    await this.loadNotes();
  },

  async loadUsers() {
    try {
      const users = await adminAPI.getAllUsers();
      const container = document.getElementById("admin-users");
      container.innerHTML = "";

      users.forEach((user) => {
        const userEl = document.createElement("div");
        userEl.className = "admin-item";
        userEl.innerHTML = `
                            <div>
                                <strong>${user.email}</strong>
                                <span style="color: #666; margin-left: 10px;">(${user.role})</span>
                            </div>
                            <button class="btn-danger" onclick="adminController.deleteUser('${user.id}')">Delete</button>
                        `;
        container.appendChild(userEl);
      });
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
      container.innerHTML = "";

      notes.forEach((note) => {
        const noteEl = document.createElement("div");
        noteEl.className = "admin-item";
        noteEl.innerHTML = `
                            <div>
                                <p>${note.content.text ? note.content.text.substring(0, 50) + "..." : "Drawing note"}</p>
                                <small style="color: #666;">by ${note.userId}</small>
                            </div>
                            <button class="btn-danger" onclick="adminController.deleteNote('${note.id}')">Delete</button>
                        `;
        container.appendChild(noteEl);
      });
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
      alert("Error deleting user: " + error.message);
    }
  },

  async deleteNote(noteId) {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      await adminAPI.deleteNoteAsAdmin(noteId);
      await this.loadNotes();
    } catch (error) {
      console.error("Error deleting note:", error);
      alert("Error deleting note: " + error.message);
    }
  },
};

// Initialize Google Maps
window.initMap = function () {
  console.log("Google Maps loaded");
};

// Event listeners
document.addEventListener("DOMContentLoaded", function () {
  // Update time
  const updateTime = () => {
    const now = new Date();
    document.getElementById("time").textContent = now.toLocaleTimeString(
      "en-US",
      { hour: "2-digit", minute: "2-digit" },
    );
  };
  updateTime();
  setInterval(updateTime, 60000);

  // Auth form handlers
  document
    .getElementById("login-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;

      try {
        await authAPI.signin(email, password);
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

  // Navigation handlers
  document.getElementById("show-signup").addEventListener("click", () => {
    showScreen("signup-screen");
  });

  document.getElementById("show-forgot").addEventListener("click", () => {
    showScreen("forgot-screen");
  });

  document.getElementById("back-to-login").addEventListener("click", () => {
    showScreen("login-screen");
  });

  document.getElementById("back-to-login-2").addEventListener("click", () => {
    showScreen("login-screen");
  });

  document.getElementById("show-map").addEventListener("click", async () => {
    showScreen("map-screen");
    await mapController.init();
  });

  document.getElementById("show-profile").addEventListener("click", () => {
    showScreen("profile-screen");
  });

  document.getElementById("admin-btn").addEventListener("click", async () => {
    showScreen("admin-screen");
    await adminController.init();
  });

  document.getElementById("new-note-btn").addEventListener("click", () => {
    showScreen("note-editor-screen");
    noteEditorController.init();
  });

  // Back navigation
  document.getElementById("back-from-map").addEventListener("click", () => {
    showScreen("home-screen");
  });

  document.getElementById("back-from-editor").addEventListener("click", () => {
    showScreen("home-screen");
  });

  document.getElementById("back-from-note").addEventListener("click", () => {
    showScreen("home-screen");
  });

  document.getElementById("back-from-profile").addEventListener("click", () => {
    showScreen("home-screen");
  });

  document.getElementById("back-from-admin").addEventListener("click", () => {
    showScreen("home-screen");
  });

  // Note editor actions
  document.getElementById("save-note").addEventListener("click", () => {
    noteEditorController.saveNote();
  });

  document.getElementById("clear-canvas").addEventListener("click", () => {
    canvasService.clear();
  });

  // Profile actions
  document.getElementById("logout-btn").addEventListener("click", () => {
    state.currentUser = null;
    showScreen("login-screen");
  });

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
        state.currentUser = null;
        showScreen("login-screen");
      } catch (error) {
        console.error("Error deleting account:", error);
        alert("Error deleting account: " + error.message);
      }
    });

  // Initialize app
  console.log("PickMi SPA initialized");
});
