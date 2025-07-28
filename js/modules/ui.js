// modules/uis.js
import { getNearbyNotes } from './notes.js'; // נצטרך את זה ל-gotoHome
import { API_BASE, jwt, apiFetch } from './auth.js'; // צריך את apiFetch ל-admin, ואת jwt ו-api_base ל-gotoHome

export function show(screenId) {
    document.querySelectorAll(
        ".container, #home-bg, #home-content, #map-screen, #settings-screen, #write-note-screen, #brush-note-screen, #note-content-screen, #admin-screen, #user-menu-screen"
    ).forEach(el => el.classList.add("hidden")); // הוסף את כל המסכים האפשריים

    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.remove("hidden");
    } else {
        console.warn(`מסך עם מזהה "${screenId}" לא נמצא.`);
    }

    if (screenId === "home-content") {
        document.getElementById("home-bg")?.classList.remove("hidden");
    }
}

export function renderNotesOnHome(notes) {
    const notesList = document.getElementById("notes-list");
    if (!notesList) {
        console.warn("אלמנט notes-list לא נמצא.");
        return;
    }
    notesList.innerHTML = "";

    notes.forEach(note => {
        const noteEl = document.createElement("img");
        noteEl.src = "../images/ClosedNote.png";
        noteEl.alt = "פתק";
        noteEl.classList.add("floating-note");

        // מיקום אקראי בעמוד
        noteEl.style.position = "absolute";
        noteEl.style.left = Math.random() * 80 + "%";
        noteEl.style.top = Math.random() * 200 + "px";
        noteEl.style.width = "50px";
        noteEl.style.cursor = "pointer";

        // לחיצה על הפתק: טוענת ומציגה אותו
        noteEl.addEventListener("click", () => {
            // כאן נצטרך לקרוא לפונקציה שפותחת את הפתק, היא צריכה להיות גלובלית או להישלח בפרמטר
            // לשם פשטות, נניח שהיא תהיה ב-script.js או שנוכל לייצא אותה מ notes.js
            // בינתיים, נשאיר פה הערה או שנצטרך להעביר פונקציה כפרמטר ל renderNotesOnHome
            const scriptJs = document.querySelector('script[src="./js/script.js"]');
            if (scriptJs && scriptJs.dataset.openNoteFunction) {
                 const openNoteAndShow = window[scriptJs.dataset.openNoteFunction];
                 if (openNoteAndShow) openNoteAndShow(note.id);
            } else {
                 console.error("פונקציית openNoteAndShow לא נגישה או לא מוגדרת.");
            }
            noteEl.remove(); // מסיר את הפתק מהמסך
        });

        notesList.appendChild(noteEl);
    });
}

export function renderNotesOnMap(notes, map) {
    console.log(`Starting to render ${notes.length} notes...`);

    notes.forEach((note, index) => {
        console.log(`--- Processing Note #${index + 1} ---`);
        console.log('Location data for this note:', note.location);

        if (note && note.location && note.location.latitude != null && note.location.longitude != null) {
            console.log('✅ Coordinates are valid. Creating marker.');

            const title = note.content?.text?.trim() || "פתק ללא טקסט";

            // כאן נצטרך לוודא ש-google.maps זמין
            if (typeof google !== 'undefined' && google.maps) {
                new google.maps.Marker({
                    position: {
                        lat: Number(note.location.latitude),
                        lng: Number(note.location.longitude)
                    },
                    map,
                    title,
                    icon: {
                        url: "../images/ClosedNote.png",
                        scaledSize: new google.maps.Size(40, 40),
                        anchor: new google.maps.Point(20, 20)
                    }
                }).addListener("click", () => {
                    // כמו ב-renderNotesOnHome, נצטרך גישה לפונקציית פתיחת הפתק
                    const scriptJs = document.querySelector('script[src="./js/script.js"]');
                    if (scriptJs && scriptJs.dataset.openNoteFunction) {
                        const openNoteAndShow = window[scriptJs.dataset.openNoteFunction];
                        if (openNoteAndShow) openNoteAndShow(note.id);
                    } else {
                        console.error("פונקציית openNoteAndShow לא נגישה או לא מוגדרת.");
                    }
                });
            } else {
                console.warn("Google Maps API לא טעון או לא זמין.");
            }
        } else {
            console.warn(`❌ SKIPPING note due to invalid or missing coordinates.`);
        }
    });
}

export function gotoLogin() {
    console.log("🔵 gotoLogin called");
    document.getElementById("login-error")?.classList.add("hidden");
    show("login-screen");
}

export async function gotoHome() {
    show("home-content");

    navigator.geolocation.getCurrentPosition(
        async pos => {
            const lastKnownLocation = {
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
                placeId: null // ניתן לעדכן את זה עם Place ID אמיתי בעתיד
            };

            // 1. שליפת פתקים קרובים
            const notes = await getNearbyNotes(lastKnownLocation.lat, lastKnownLocation.lon, 500);
            console.log("Data for STATIC map:", JSON.stringify(notes, null, 2));

            // כאן renderNotesOnHome צריכה לדעת איך לקרוא ל-openNoteAndShow
            renderNotesOnHome(notes); // שימו לב: הפונקציה renderNotesOnHome עדיין צריכה גישה ל-openNoteAndShow

            // 2. הרכבת URL של Static Map עם מרקרים
            const sizeW = 400, sizeH = 300;
            const key = "AIzaSyCbMIwPY6SqN9WsL7Fvn4E_r_2kpj6CrQY";
            const base = "https://maps.googleapis.com/maps/api/staticmap";
            const centerParam = `center=${lastKnownLocation.lat},${lastKnownLocation.lon}` +
                `&zoom=15&size=${sizeW}x${sizeH}`;
            const markerIconUrl = "https://cdn.jsdelivr.net/gh/maya-n2626/Pick_Mi_front@main/images/ClosedNote.png";

            const userMarker = `markers=color:blue|${lastKnownLocation.lat},${lastKnownLocation.lon}`;
            const noteMarkers = notes
                .map(n => `markers=icon:${encodeURIComponent(markerIconUrl)}|${n.location.latitude},${n.location.longitude}`)
                .join("&");
            const url = `${base}?${centerParam}&${userMarker}&${noteMarkers}&key=${key}`;

            // 3. הצגת המפה הסטטית כרקע ה-card
            const container = document.getElementById("home-content");
            if (container) {
                container.style.backgroundImage = `url("${url}")`;
                container.style.backgroundSize = "cover";
                container.style.backgroundPosition = "center";
            }

            // 4. הצגת/הסתרת כפתור Admin
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            const role = user.props?.role;
            document.getElementById("admin-btn")
                ?.classList[role === "admin" ? "remove" : "add"]("hidden");
        },
        err => {
            console.warn("לא ניתן לקבל מיקום:", err);
            // אם לא ניתן לקבל מיקום, עדיין ננסה להציג את מסך הבית
            // ייתכן שנצטרך לטעון מפה סטטית כלשהי או להציג הודעה
            const container = document.getElementById("home-content");
             if (container) {
                container.style.backgroundImage = `url("https://maps.googleapis.com/maps/api/staticmap?center=0,0&zoom=1&size=400x300&key=${key}")`; // מפה כללית
                container.style.backgroundSize = "cover";
                container.style.backgroundPosition = "center";
            }
        }
    );
}

// openNoteAndShow - יש להעביר את הפונקציה הזו לפה אם היא לא גלובלית ב-script.js
// או ליצור מנגנון קריאה אחר (למשל, EventEmitter)
/*
export async function openNoteAndShow(noteId) {
    // ... הקוד של הפונקציה ...
}
*/