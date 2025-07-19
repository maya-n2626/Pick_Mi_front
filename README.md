# Pick-Mi-_fronted# Pick_Mi_front
// 7. Map Navigation
const mapBtn = document.getElementById("to-map-btn");
console.log("mapBtn is", mapBtn);
if (mapBtn) {
  mapBtn.addEventListener("click", () => {
    console.log("Map button clicked");
        console.log("google.maps is", window.google && google.maps);

    show("map-screen");
    loadBigMap();
  });
}



document.getElementById("to-map-btn").addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("הדפדפן שלך לא תומך בגיאולוקיישן.");
  }

  // רק כאן שואלים הרשאה, ובאותו מקום בונים את המפה
  navigator.geolocation.getCurrentPosition(
    pos => {
      // 1. עוברים למסך המפה
      show("map-screen");

      // 2. יוצרים את המפה במיקום שלך
      const userLoc = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };
      const map = new google.maps.Map(
        document.getElementById("big-map"),
        { center: userLoc, zoom: 14 }
      );
      // 3. מוסיפים Marker
      new google.maps.Marker({ position: userLoc, map, title: "המיקום שלך" });
    },
    err => {
      if (err.code === err.PERMISSION_DENIED) {
        alert("לא אישרת את השימוש במיקום, לא ניתן להציג מפה.");
      } else {
        console.warn("שגיאה בקבלת מיקום:", err);
        alert("לא הצלחנו לקבל את המיקום שלך.");
      }
    }
  );
});
