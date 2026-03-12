// src/lib/compass.js
const API = import.meta.env.VITE_API_URL || "/api";

// All topics (full topic objects: { id, short_title, stances, ... })
export async function fetchTopics() {
  const res = await fetch(`${API}/compass/topics`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`fetchTopics failed: ${res.status}`);
  return res.json();
}
// Politician answers: [{ topic_id, value }, ...]
export async function fetchPoliticianAnswers(politicianId) {
  const res = await fetch(
    `${API}/compass/politicians/${politicianId}/answers`,
    { credentials: "include" }
  );
  if (!res.ok) throw new Error(`fetchPoliticianAnswers failed: ${res.status}`);
  return res.json();
}

// User's compass answers: [{ topic_id, value, write_in_text }, ...]
// Returns [] if the user is not logged in (401) or on any network error.
export async function fetchUserAnswers() {
  try {
    const res = await fetch(`${API}/compass/answers`, {
      credentials: "include",
    });
    if (res.status === 401) return [];
    if (!res.ok) throw new Error(`fetchUserAnswers failed: ${res.status}`);
    return res.json();
  } catch (err) {
    console.error("fetchUserAnswers error:", err);
    return [];
  }
}

// User's selected topic IDs: string[]
// Returns [] if the user is not logged in (401) or on any network error.
export async function fetchSelectedTopics() {
  try {
    const res = await fetch(`${API}/compass/selected-topics`, {
      credentials: "include",
    });
    if (res.status === 401) return [];
    if (!res.ok) throw new Error(`fetchSelectedTopics failed: ${res.status}`);
    return res.json();
  } catch (err) {
    console.error("fetchSelectedTopics error:", err);
    return [];
  }
}

// Politicians that have compass stances: [{ id, first_name, last_name, ... }]
// Public endpoint — returns [] on any error.
export async function fetchPoliticiansWithStances() {
  try {
    const res = await fetch(`${API}/compass/politicians`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error(`fetchPoliticiansWithStances failed: ${res.status}`);
    return res.json();
  } catch (err) {
    console.error("fetchPoliticiansWithStances error:", err);
    return [];
  }
}

/**
 * Build { [short_title]: value } only for the allowed short titles.
 * Any missing answers default to 0.
 */
export function buildAnswerMapByShortTitle(
  allTopics,
  allAnswers,
  allowedShorts
) {
  const allowed = new Set(allowedShorts.map((s) => s.toLowerCase()));
  const topicById = new Map(allTopics.map((t) => [t.id, t]));
  const shortById = new Map(allTopics.map((t) => [t.id, t.short_title]));

  // Initialize with 0 for each allowed short title (in allowedShorts order to preserve spoke layout)
  const out = {};
  const topicByShortLower = new Map(allTopics.map((t) => [t.short_title.toLowerCase(), t]));
  for (const s of allowedShorts) {
    const t = topicByShortLower.get(s.toLowerCase());
    if (t) out[t.short_title] = 0;
  }

  // Fill in any provided answers that match our allowed set
  for (const a of allAnswers) {
    const st = shortById.get(a.topic_id);
    if (!st) continue;
    if (allowed.has(String(st).toLowerCase())) {
      out[st] = a.value ?? 0;
    }
  }

  // Return topics in the same order as allowedShorts (preserves user's spoke layout)
  const topicByShort = new Map(allTopics.map((t) => [t.short_title.toLowerCase(), t]));
  const topicsFiltered = allowedShorts
    .map((s) => topicByShort.get(s.toLowerCase()))
    .filter(Boolean);

  return { topicsFiltered, answersByShort: out };
}

// ─── Guest compass bridge utilities ──────────────────────────────────────────

/** localStorage key for guest compass cache */
export const GUEST_COMPASS_KEY = "guestCompass";

/**
 * Reads window.location.hash for a compass fragment.
 * Fragment format: #compass=BASE64(JSON.stringify({ a: {[short_title]: value}, s: [uuid, ...], v: {[quote_id]: 'agreed'|'disagreed'} }))
 *
 * Returns { answers, selectedTopics, invertedSpokes, verdicts } on success,
 * or null if hash is missing, malformed, or has no useful data.
 *
 * - answers/selectedTopics/invertedSpokes are null/[] if compass data is absent (verdict-only fragment)
 * - verdicts is {} if v key is absent
 *
 * Side effect: strips the fragment from the URL via history.replaceState on successful parse.
 */
export function parseCompassFragment() {
  try {
    const hash = window.location.hash;
    if (!hash.startsWith("#compass=")) return null;

    const base64str = hash.slice("#compass=".length);
    if (!base64str) return null;

    const decoded = JSON.parse(atob(base64str));
    if (!decoded || typeof decoded !== 'object') return null;

    // Extract verdicts regardless of whether compass data is present
    const verdicts =
      decoded.v && typeof decoded.v === 'object' ? decoded.v : {};

    // Compass data is optional — only validate if present
    const hasCompassData =
      typeof decoded.a === 'object' &&
      decoded.a !== null &&
      Array.isArray(decoded.s);

    // Strip fragment from URL (same behavior as before)
    history.replaceState(null, '', window.location.pathname + window.location.search);

    // Return null only if there's nothing useful
    if (!hasCompassData && Object.keys(verdicts).length === 0) return null;

    return {
      answers: hasCompassData ? decoded.a : null,
      selectedTopics: hasCompassData ? decoded.s : [],
      invertedSpokes: decoded.i || {},
      verdicts,
    };
  } catch {
    return null;
  }
}

/**
 * Converts guest answers from { [short_title]: value } format (CompassV2 localStorage)
 * to the API format [{ topic_id, value, write_in_text }] used by CompassContext.
 *
 * @param {Object} guestAnswers - { [short_title]: number }
 * @param {Array}  allTopics    - full topic objects from fetchTopics()
 * @returns {Array} - [{ topic_id, value, write_in_text: "" }, ...]
 */
export function convertGuestAnswersToApiFormat(guestAnswers, allTopics) {
  const result = [];
  for (const [shortTitle, value] of Object.entries(guestAnswers)) {
    const topic = allTopics.find((t) => t.short_title === shortTitle);
    if (topic) {
      result.push({ topic_id: topic.id, value, write_in_text: "" });
    }
  }
  return result;
}

/**
 * Saves guest compass data to localStorage.
 * @param {Object} answers        - { [short_title]: value }
 * @param {Array}  selectedTopics - [uuid, ...]
 */
export function saveGuestCompass(answers, selectedTopics, invertedSpokes = {}) {
  localStorage.setItem(
    GUEST_COMPASS_KEY,
    JSON.stringify({ a: answers, s: selectedTopics, i: invertedSpokes })
  );
}

/**
 * Reads guest compass data from localStorage.
 * Returns { answers, selectedTopics } or null if missing/invalid.
 */
export function loadGuestCompass() {
  try {
    const raw = localStorage.getItem(GUEST_COMPASS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed.a !== "object" ||
      parsed.a === null ||
      !Array.isArray(parsed.s)
    ) {
      return null;
    }
    return { answers: parsed.a, selectedTopics: parsed.s, invertedSpokes: parsed.i || {} };
  } catch {
    return null;
  }
}

/**
 * Removes guest compass cache from localStorage.
 */
export function clearGuestCompass() {
  localStorage.removeItem(GUEST_COMPASS_KEY);
}

// ─── Guest verdict bridge utilities ──────────────────────────────────────────

/** localStorage key for guest verdict cache */
export const GUEST_VERDICTS_KEY = "guestVerdicts";

/**
 * Saves guest verdicts to localStorage.
 * @param {Object} verdicts - { [quote_id]: 'agreed' | 'disagreed' }
 */
export function saveGuestVerdicts(verdicts) {
  localStorage.setItem(GUEST_VERDICTS_KEY, JSON.stringify(verdicts));
}

/**
 * Reads guest verdicts from localStorage.
 * Returns { [quote_id]: 'agreed' | 'disagreed' } or null if missing/invalid.
 */
export function loadGuestVerdicts() {
  try {
    const raw = localStorage.getItem(GUEST_VERDICTS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Removes guest verdict cache from localStorage.
 */
export function clearGuestVerdicts() {
  localStorage.removeItem(GUEST_VERDICTS_KEY);
}
