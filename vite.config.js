import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        // login: resolve(__dirname, "login.html"),
        // signup: resolve(__dirname, "signup.html"),
        // "wrong-password": resolve(__dirname, "wrong-password.html"),
        // "forgot-password": resolve(__dirname, "forgot-password.html"),
        // "reset-sent": resolve(__dirname, "reset-sent.html"),
        // home: resolve(__dirname, "home.html"),
        // "user-menu": resolve(__dirname, "user-menu.html"),
        // map: resolve(__dirname, "map.html"),
        // "create-note": resolve(__dirname, "create-note.html"),
        // "note-content": resolve(__dirname, "note-content.html"),
        // admin: resolve(__dirname, "admin.html"),
        // resetPassword: resolve(__dirname, "reset-password.html"),
      },
    },
  },
});
