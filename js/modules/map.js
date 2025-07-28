// modules/map.js

// פונקציה לאתחול המפה
export async function initMap(lat, lon, getNearbyNotesCallback, renderNotesOnMapCallback) {
    // וודא ש-google.maps טעון
    if (typeof google === 'undefined' || !google.maps) {
        console.error("Google Maps API לא טעון. וודא שאתה טוען אותו ב-HTML שלך.");
        alert("שירותי מפה אינם זמינים.");
        return;
    }

    const map = new google.maps.Map(document.getElementById("big-map"), {
        center: { lat: lat, lng: lon },
        zoom: 14
    });

    // הוספת סמן של המיקום הנוכחי
    new google.maps.Marker({
        position: { lat: lat, lng: lon },
        map,
        title: "המיקום שלך"
    });

    console.log("Fetching notes for map...");
    const notes = await getNearbyNotesCallback(lat, lon, 5000); // שימוש בקולבק
    console.log("✅ Data received for map:", notes);

    renderNotesOnMapCallback(notes, map); // שימוש בקולבק
}