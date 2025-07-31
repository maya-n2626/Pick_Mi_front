import { adminAPI } from "./api.js";
import { showToast } from "./toast.js";
import { showConfirmation } from "./confirmation.js";
import { noteViewController } from "./note.js";

function isDrawingEmpty(drawingData) {
  if (!drawingData) {
    return true;
  }
  // Common empty 1x1 transparent PNG data URL
  const emptyPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  // Common empty 1x1 transparent GIF data URL
  const emptyGif = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

  // Check for exact matches of common empty image data URLs
  if (drawingData === emptyPng || drawingData === emptyGif) {
    return true;
  }

  // Heuristic: if the base64 string is very short, it's likely an empty drawing.
  // A typical non-empty drawing will have a much larger base64 string.
  // The threshold of 100 characters is arbitrary but should catch most empty cases.
  if (drawingData.length < 100) {
    return true;
  }

  return false;
}

const adminController = {
  async init() {
    window.adminController = this;
    await this.loadUsers();
    await this.loadNotes();
    this.setupModalCloseButtons();
  },
  async loadUsers() {
    try {
      const users = await adminAPI.getAllUsers();
      const container = document.getElementById("admin-users");
      container.innerHTML = users
        .map(
          (user) => `
        <div class="admin-item" data-user-id="${user.id}" data-user-email="${user.email}">
          <div>
            <strong>${user.email}</strong>
            <span style="color: #666; margin-left: 10px;">ID: ${user.id}</span>
            <span style="color: #666; margin-left: 10px;">(${user.role})</span>
          </div>
          <button class="btn-danger" onclick="event.stopPropagation(); adminController.deleteUser('${user.id}')">Delete</button>
        </div>`,
        )
        .join("");

      // Add event listeners for viewing user notes
      container.querySelectorAll(".admin-item").forEach((item) => {
        item.addEventListener("click", (e) => {
          // Prevent opening modal if delete button was clicked
          if (e.target.classList.contains("btn-danger")) return;
          const userId = item.dataset.userId;
          const userEmail = item.dataset.userEmail;
          this.showUserNotesModal(userId, userEmail);
        });
      });
    } catch (error) {
      console.error("Error loading users:", error);
      document.getElementById("admin-users").innerHTML =
        "<p>Error loading users</p>";
    }
  },
  async showUserNotesModal(userId, userEmail) {
    try {
      const notes = await adminAPI.getNotesByUserId(userId);
      const modalNotesList = document.getElementById("modal-notes-list");
      document.getElementById("modal-username").textContent = userEmail;
      modalNotesList.innerHTML =
        notes.length > 0
          ? notes
              .map(
                (note) => `
        <div class="admin-item" data-note-id="${note.id}">
          <div>
            <p><strong>Sender:</strong> ${userEmail}</p>
            <p><strong>Note ID:</strong> ${note.id}</p>
            <p><strong>Content:</strong> ${note.content?.text ? new DOMParser().parseFromString(note.content.text, 'text/html').body.textContent.substring(0, 70) + (note.content.text.length > 70 ? "..." : "") : "No text content"}</p>
            <p><strong>Includes Drawing:</strong> ${isDrawingEmpty(note.content?.drawingData) ? "No" : "Yes"}</p>
          </div>
          <button class="btn-danger" onclick="event.stopPropagation(); adminController.deleteNote('${note.id}')">Delete</button>
        </div>
      `,
              )
              .join("")
          : "<p>No notes found for this user.</p>";

      modalNotesList.querySelectorAll(".admin-item").forEach((item) => {
        item.addEventListener("click", async (e) => {
          if (e.target.classList.contains("btn-danger")) return;
          const noteId = item.dataset.noteId;
          // Fetch full note content to display in detail modal
          const fullNote = notes.find((n) => n.id === noteId);
          if (fullNote) {
            this.showNoteDetailModal(fullNote.content);
          }
        });
      });

      document.getElementById("user-notes-modal").style.display = "block";
    } catch (error) {
      console.error("Error loading user notes:", error);
      showToast(`Error loading user notes: ${error.message}`, "error");
    }
  },
  showNoteDetailModal(noteContent) {
    const modalNoteContent = document.getElementById("modal-note-content");
    modalNoteContent.innerHTML = "";

    if (noteContent.text) {
      const p = document.createElement("p");
      p.innerHTML = noteContent.text;
      modalNoteContent.appendChild(p);
    }
    if (noteContent.drawingData) {
      const img = document.createElement("img");
      img.src = noteContent.drawingData;
      img.style.maxWidth = "100%";
      modalNoteContent.appendChild(img);
    }

    document.getElementById("note-detail-modal").style.display = "block";
  },
  setupModalCloseButtons() {
    document.querySelectorAll(".modal .close-button").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.target.closest(".modal").style.display = "none";
      });
    });
    window.addEventListener("click", (event) => {
      if (event.target.classList.contains("modal")) {
        event.target.style.display = "none";
      }
    });
  },
  async loadNotes() {
    try {
      const notes = await adminAPI.getAllNotes();
      const container = document.getElementById("admin-notes");
      container.innerHTML = notes
        .map(
          (note) => `
        <div class="admin-item" data-note-id="${note.id}">
          <div>
            <p><strong>Sender:</strong> ${note.userEmail || note.userId}</p>
            <p><strong>Note ID:</strong> ${note.id}</p>
            <p><strong>Content:</strong> ${note.content?.text ? new DOMParser().parseFromString(note.content.text, 'text/html').body.textContent.substring(0, 70) + (note.content.text.length > 70 ? "..." : "") : "No text content"}</p>
            <p><strong>Includes Drawing:</strong> ${isDrawingEmpty(note.content?.drawingData) ? "No" : "Yes"}</p>
          </div>
          <button class="btn-danger" onclick="event.stopPropagation(); adminController.deleteNote('${note.id}')">Delete</button>
        </div>`,
        )
        .join("");

      container.querySelectorAll(".admin-item").forEach((item) => {
        item.addEventListener("click", async (e) => {
          if (e.target.classList.contains("btn-danger")) return;
          const noteId = item.dataset.noteId;
          const fullNote = notes.find((n) => n.id === noteId);
          if (fullNote) {
            this.showNoteDetailModal(fullNote.content);
          }
        });
      });
    } catch (error) {
      console.error("Error loading notes:", error);
      document.getElementById("admin-notes").innerHTML =
        "<p>Error loading notes</p>";
    }
  },
  async deleteUser(userId) {
    showConfirmation("Are you sure you want to delete this user?", async () => {
      try {
        await adminAPI.deleteUser(userId);
        await this.loadUsers();
        showToast("User deleted successfully.");
      } catch (error) {
        console.error("Error deleting user:", error);
        showToast(`Error deleting user: ${error.message}`, "error");
      }
    });
  },
  async deleteNote(noteId) {
    showConfirmation("Are you sure you want to delete this note?", async () => {
      try {
        await adminAPI.deleteNoteAsAdmin(noteId);
        await this.loadNotes();
        showToast("Note deleted successfully.");
      } catch (error) {
        console.error("Error deleting note:", error);
        showToast(`Error deleting note: ${error.message}`, "error");
      }
    });
  },
};

export function initAdmin() {
  adminController.init();
}
