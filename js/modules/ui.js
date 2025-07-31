export const showScreen = (screenId) => {
  const currentActiveScreen = document.querySelector(".screen.active");
  const newScreen = document.getElementById(screenId);

  if (currentActiveScreen) {
    // Handle specific exit animation for note-view-screen
    if (currentActiveScreen.id === "note-view-screen") {
      currentActiveScreen.classList.add("exit-transition");
      // Wait for the exit transition to complete before removing 'active'
      currentActiveScreen.addEventListener('transitionend', function handler() {
        currentActiveScreen.classList.remove("active", "exit-transition");
        currentActiveScreen.removeEventListener('transitionend', handler);
      }, { once: true });
    } else {
      currentActiveScreen.classList.remove("active");
    }
  }

  if (newScreen) {
    // Ensure no exit-transition class is present when activating
    newScreen.classList.remove("exit-transition");
    newScreen.classList.add("active");
  } else {
    console.error(`Screen with ID "${screenId}" not found.`);
  }
};
