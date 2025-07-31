import { state } from "./state.js";

const API_BASE = import.meta.env.VITE_API_URL;

const apiFetch = async (path, options = {}) => {
  const headers = { ...(options.headers || {}) };
  const token = state.currentUser?.token;
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

const apiFetchPublic = async (path, options = {}) => {
  const headers = { ...(options.headers || {}) };
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

export const authAPI = {
  signup: (email, password) =>
    apiFetchPublic("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  signin: (email, password) =>
    apiFetchPublic("/api/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  forgotPassword: (email) =>
    apiFetchPublic("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token, newPassword) =>
    apiFetchPublic("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    }),
  deleteAccount: (password) =>
    apiFetch("/api/auth/me", {
      method: "DELETE",
      body: JSON.stringify({ password }),
    }), // Requires auth
};

export const notesAPI = {
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

export const adminAPI = {
  getAllUsers: () => apiFetch("/api/admin/users"),
  getAllNotes: () => apiFetch("/api/admin/notes"),
  getNotesByUserId: (userId) => apiFetch(`/api/admin/users/${userId}/notes`),
  deleteUser: (userId) =>
    apiFetch(`/api/admin/users/${userId}`, { method: "DELETE" }),
  deleteNoteAsAdmin: (noteId) =>
    apiFetch(`/api/admin/notes/${noteId}`, { method: "DELETE" }),
};
