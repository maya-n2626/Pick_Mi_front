import { state } from "./state.js";

export const locationService = {
  async getPlaceIdFromCoordinates(lat, lon) {
    if (!google.maps.places) {
      console.error("Google Maps Places service not available.");
      return "0";
    }
    const request = {
      fields: ["displayName", "location", "id"],
      locationRestriction: {
        center: { lat, lng: lon },
        radius: 500,
      },
      includedPrimaryTypes: [
        "park",
        "school",
        "university",
        "library",
        "shopping_mall",
        "restaurant",
        "cafe",
        "bar",
        "gym",
        "movie_theater",
        "museum",
        "church",
        "mosque",
        "synagogue",
        "city_hall",
        "police",
        "post_office",
      ],
      maxResultCount: 1,
      rankPreference: google.maps.places.SearchNearbyRankPreference.DISTANCE,
    };
    try {
      const { places } = await google.maps.places.Place.searchNearby(request);
      if (places && places.length > 0) {
        return places[0].id;
      } else {
        console.warn("⚠️ No nearby places found.");
        return "0"; // Return a default/null identifier
      }
    } catch (error) {
      console.warn("⚠️ Error during Place.searchNearby:", error);
      return "0";
    }
  },

  async getCurrentPosition() {
    const cachedLocation = localStorage.getItem("lastKnownLocation");
    if (cachedLocation) {
      const parsed = JSON.parse(cachedLocation);
      // If cache is recent (e.g., 5 minutes), return it.
      if (Date.now() - (parsed.timestamp || 0) < 300000) {
        state.currentLocation = parsed;
        return parsed;
      }
    }

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error("Geolocation is not supported."));
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const placeId = await this.getPlaceIdFromCoordinates(lat, lon);
          const location = { lat, lon, placeId, timestamp: Date.now() };

          state.currentLocation = location;
          localStorage.setItem("lastKnownLocation", JSON.stringify(location));
          resolve(location);
        },
        (err) => {
          console.warn("Could not get location:", err);
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );
    });
  },
};
