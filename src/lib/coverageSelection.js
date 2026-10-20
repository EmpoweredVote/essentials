// Which state the Landing page's "Choose an Alpha Community" rail opens on.
//
// There is no sensible hardcoded default here: opening on California only works
// for Californians. So the rail remembers the last state the user browsed and
// reopens it, and a cold visitor gets a prompt rather than a guess.
//
// Precedence, highest first:
//   1. ?coverage_state=XX  — an uncovered-area search bounced the user here and
//      wants that state shown. Visit-scoped, but it outranks memory while it lasts.
//   2. the remembered state — whatever they last clicked in the rail.
//   3. the signed-in user's home state — a reasonable first guess, not a default.
//   4. nothing — the panel shows "Pick a state" instead of pretending.
//
// Every candidate is validated against live coverage before it is trusted.
// scripts/gen-coverage.mjs regenerates COVERAGE_STATES on each build, so a state
// can leave the list between two visits; an unchecked localStorage value would
// then select a state that no longer has a row in the rail.

// Stored per-device in localStorage, following the existing `ev:*` preference
// pattern (e.g. `ev:compassMode`, `ev:autoOpenMyLocation`). Absent key === none.
const KEY = 'ev:lastCoverageState';

const normalize = (abbrev) =>
  (typeof abbrev === 'string' && abbrev.trim()) ? abbrev.trim().toUpperCase() : null;

export function resolveInitialCoverageState({
  deepLinkState,
  rememberedState,
  homeState,
  coveredAbbrevs = [],
} = {}) {
  const covered = new Set(coveredAbbrevs.map(normalize).filter(Boolean));
  for (const candidate of [deepLinkState, rememberedState, homeState]) {
    const abbrev = normalize(candidate);
    if (abbrev && covered.has(abbrev)) return abbrev;
  }
  return null;
}

// CompassContext hands us the signed-in user's home location as a formatted
// address string; this is the same "two caps immediately before a ZIP" shape it
// uses internally to mirror the state to ev-context.
export function homeStateFromAddress(formattedAddress) {
  if (typeof formattedAddress !== 'string') return null;
  const match = formattedAddress.match(/\b([A-Z]{2})\b\s*\d{5}/);
  return match ? match[1] : null;
}

export function getLastCoverageState() {
  try {
    return normalize(localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export function setLastCoverageState(abbrev) {
  try {
    const next = normalize(abbrev);
    if (next) localStorage.setItem(KEY, next);
    else localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable — the rail simply won't reopen where they left off */
  }
}

export const LAST_COVERAGE_STATE_KEY = KEY;
