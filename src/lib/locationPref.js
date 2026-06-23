// User preference: auto-open ("port to") a Connected Account's saved home-location
// representatives when the app opens.
//
// OPT-IN (default OFF): when this is false/unset, a connected account lands on the
// default browse/search page exactly like a guest — Essentials does NOT automatically
// port them to their own set of elected leaders. When the user turns it on (via the
// hamburger menu checkbox), the Landing page auto-redirects them to their saved
// location's representatives on the next app open.
//
// Stored per-device in localStorage, following the existing `ev:*` preference pattern
// (e.g. `ev:compassMode`). Absent key === OFF.
const KEY = 'ev:autoOpenMyLocation';

export function getAutoOpenMyLocation() {
  try {
    return localStorage.getItem(KEY) === 'true';
  } catch {
    return false;
  }
}

export function setAutoOpenMyLocation(enabled) {
  try {
    if (enabled) localStorage.setItem(KEY, 'true');
    else localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable — preference simply won't persist */
  }
}

export const AUTO_OPEN_MY_LOCATION_KEY = KEY;
