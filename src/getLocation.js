// Promise wrapper around the browser Geolocation API.
// Resolves { lat, lon } or rejects with a GeolocationPositionError (err.code:
// 1 = permission denied, 2 = position unavailable, 3 = timeout).
// Requires a secure origin (https, or localhost in dev).
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported by this browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}
