export const showScreen = (screenId) => {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active");
  });
  const screen = document.getElementById(screenId);
  if (screen) {
    screen.classList.add("active");
  } else {
    console.error(`Screen with ID "${screenId}" not found.`);
  }
};
