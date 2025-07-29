export const API_BASE = import.meta.env.VITE_API_URL;
export const jwt = () => localStorage.getItem("jwt") || "";

export async function apiFetch(path, options = {}) {
  const headers = options.headers || {};
  if (!headers.Authorization && jwt())
    headers.Authorization = "Bearer " + jwt();
  if (options.body && !headers["Content-Type"])
    headers["Content-Type"] = "application/json";

  const res = await fetch(API_BASE + path, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw err.error?.message || res.statusText;
  }
  return res.status !== 204 ? res.json() : {};
}
