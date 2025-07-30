// modules/notes.js
import { apiFetch } from "./utils.js";

const PLACEHOLDER_DRAWING = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIW2NgAAIAAAUAAR4f7BQAAAAASUVORK5CYII=";

export async function throwNote(text, drawingData, lat, lon, placeId) {
  const content = { text };

  if (drawingData && drawingData !== PLACEHOLDER_DRAWING) {
    content.drawingData = drawingData;
  }

  return apiFetch("/api/notes", {
    method: "POST",
    body: JSON.stringify({
      content: content,
      location: { latitude: lat, longitude: lon, placeId },
    }),
  });
}

export async function getNearbyNotes(lat, lon, radius = 1000) {
  if (lat == null || lon == null) {
    throw new Error("מיקום לא תקף — lat/lon חסרים");
  }
  return apiFetch(`/api/notes/nearby?lat=${lat}&lon=${lon}&radius=${radius}`);
}

export async function getNoteContent(id, lat, lon) {
  return apiFetch(`/api/notes/${id}?lat=${lat}&lon=${lon}`);
}

export async function deleteNote(id, lat, lon) {
  console.log("ID:", id, "LAT:", lat, "LON:", lon);
  return apiFetch(`/api/notes/${id}`, {
    method: "DELETE",
    body: JSON.stringify({
      latitude: Number(lat),
      longitude: Number(lon),
    }),
  });
}
