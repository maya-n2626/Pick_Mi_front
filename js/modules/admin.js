// modules/admin.js



import { apiFetch } from './auth.js';

//=== Admin Endpoints ===
  export async function getAllUsers() { return apiFetch("/api/admin/users"); }
  export async function getAllNotesAdmin() { return apiFetch("/api/admin/notes"); }
  export async function getUserById(userId) { return apiFetch(`/api/admin/users/${userId}`); }
  export async function getNoteById(noteId) { return apiFetch(`/api/admin/notes/${noteId}`); }
  export async function getUserNotes(userId) { return apiFetch(`/api/admin/users/${userId}/notes`); }
  export async function deleteUser(userId) { return apiFetch(`/api/admin/users/${userId}`, { method: "DELETE" }); }
  export async function deleteNoteAdmin(noteId) { return apiFetch(`/api/admin/notes/${noteId}`, { method: "DELETE" }); }


export async function fetchAllUsers() {
  try {
    const users = await apiFetch("/api/admin/users");
    const container = document.getElementById("admin-users");
    container.innerHTML = users.map(u =>
      `<div class="note-card">
         <strong>${u.email}</strong> (${u.role})
         <button data-id="${u.id}" class="btn-link admin-delete-user">Delete User</button>
       </div>`
    ).join("");
    // רישום מאזינים למחיקה
    container.querySelectorAll(".admin-delete-user")
      .forEach(btn =>
        btn.onclick = async () => {
          if (!confirm("למחוק משתמש זה?")) return;
          await apiFetch(`/api/admin/users/${btn.dataset.id}`, { method: "DELETE" });
          fetchAllUsers();
        }
      );
  } catch (e) {
    alert("שגיאה בשליפת משתמשים: " + e);
  }
}

export async function fetchAllNotes() {
  try {
    const notes = await apiFetch("/api/admin/notes");
    const container = document.getElementById("admin-notes");
    container.innerHTML = notes.map(n =>
      `<div class="note-card">
         <p>${n.content.text}</p>
         <small>by ${n.userId}</small>
         <button data-id="${n.id}" class="btn-link admin-delete-note">Delete Note/button>
       </div>`
    ).join("");
    // רישום מאזינים למחיקה
    container.querySelectorAll(".admin-delete-note")
      .forEach(btn =>
        btn.onclick = async () => {
          if (!confirm("למחוק פתק זה?")) return;
          await apiFetch(`/api/admin/notes/${btn.dataset.id}`, { method: "DELETE" });
          fetchAllNotes();
        }
      );
  } catch (e) {
    alert("שגיאה בשליפת פתקים: " + e);
  }
}
  
