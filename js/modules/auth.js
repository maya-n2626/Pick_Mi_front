// modules/auth.js
import { apiFetch } from "./utils";

export async function signup(email, password) {
  return apiFetch("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function signin(email, password) {
  try {
    const response = await apiFetch("/api/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    console.log("signin response:", response);
    const { token, user } = response;
    localStorage.setItem("jwt", token);
    localStorage.setItem("user", JSON.stringify(user));
    return { user, token };
  } catch (err) {
    console.error("signin failed:", err);
    throw err;
  }
}

export async function forgotPassword(email) {
  return apiFetch("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token, newPassword) {
  return apiFetch("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
}

export async function deleteAccount(password) {
  return apiFetch("/api/auth/me", {
    method: "DELETE",
    body: JSON.stringify({ password }),
  });
}
