let lastKnownLocation = {
  lat: null,
  lon: null,
  placeId: null,
};

export function getLastKnownLocation() {
  return lastKnownLocation;
}

export async function getPlaceIdFromCoordinates(lat, lon) {
  return new Promise(async (resolve) => {
    const center = new google.maps.LatLng(lat, lon);

    const request = {
      fields: ["displayName", "location", "id"],
      locationRestriction: {
        center,
        radius: 100, // Search within 100 meters
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
        resolve(places[0].id);
      } else {
        console.warn("⚠️ No nearby places found.");
        resolve("0");
      }
    } catch (error) {
      console.warn("⚠️ Error during Place.searchNearby:", error);
      resolve("0");
    }
  });
}

export async function updateCurrentLocation() {
  return new Promise((resolve, reject) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          lastKnownLocation.lat = position.coords.latitude;
          lastKnownLocation.lon = position.coords.longitude;
          lastKnownLocation.placeId = await getPlaceIdFromCoordinates(
            lastKnownLocation.lat,
            lastKnownLocation.lon,
          );
          localStorage.setItem("lastKnownLocation", JSON.stringify(lastKnownLocation));
          resolve(lastKnownLocation);
        },
        (err) => {
          console.warn("⚠️ Could not get location:", err);
          reject(err);
        },
      );
    } else {
      reject(new Error("Geolocation not supported."));
    }
  });
}
