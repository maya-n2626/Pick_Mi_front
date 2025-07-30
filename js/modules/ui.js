// modules/uis.js
export function show(screenId) {
  document
    .querySelectorAll(
      ".container, #home-bg, #home-content, #map-screen, #settings-screen",
    )
    .forEach((el) => el.classList.add("hidden"));
  document.getElementById(screenId).classList.remove("hidden");
  if (screenId === "home-content") {
    document.getElementById("home-bg").classList.remove("hidden");
  }
}

export function gotoLogin() {
  console.log("🔵 gotoLogin called");

  document.getElementById("login-error").classList.add("hidden");
  show("login-screen");
}
