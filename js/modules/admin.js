import { adminAPI } from "./api.js";
import { showToast } from "./toast.js";
import { showConfirmation } from "./confirmation.js";

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
