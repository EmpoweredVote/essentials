// src/lib/compass.js
import { apiFetch, publicFetch } from './auth';

// All topics (full topic objects: { id, short_title, stances, ... })
export async function fetchTopics() {
  const res = await apiFetch('/compass/topics');
  if (!res) throw new Error('fetchTopics failed: Unauthorized');
  if (!res.ok) throw new Error(`fetchTopics failed: ${res.status}`);
  return res.json();
}
// Politician answers: [{ topic_id, value }, ...]
export async function fetchPoliticianAnswers(politicianId) {
  const res = await apiFetch(`/compass/politicians/${politicianId}/answers`);
  if (!res) throw new Error('fetchPoliticianAnswers failed: Unauthorized');
  if (!res.ok) throw new Error(`fetchPoliticianAnswers failed: ${res.status}`);
  return res.json();
}

// User's compass answers: [{ topic_id, value, write_in_text }, ...]
// Returns [] if the user is not logged in (401) or on any network error.
export async function fetchUserAnswers() {
  try {
    const res = await apiFetch('/compass/answers');
    if (!res) return []; // 401 handled by apiFetch (redirects); treat as empty
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
    const res = await apiFetch('/compass/selected-topics');
    if (!res) return []; // 401 handled by apiFetch (redirects); treat as empty
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
    const res = await publicFetch('/compass/politicians');
    if (!res) throw new Error('fetchPoliticiansWithStances failed: Unauthorized');
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

    // Extract optional topic deep-link
    const topicId = typeof decoded.t === 'string' ? decoded.t : null;

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
      topicId,
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

// ─── Cross-subdomain address bridge (ev-context) ──────────────────────────────
// Written by essentials/src/pages/Results.jsx after a successful address search.
// Read by CompassV2 InlinePoliticianPicker for state pre-selection.
// Backed by the ev-context broker (https://ev-context.empowered.vote) under the
// top-level `address` key: { addr: string, state: string, ts: epoch ms }.
// 30-day staleness check is enforced at read time by callers as needed.

/**
 * Saves the user's last-searched address to ev-context for cross-subdomain
 * sharing. Other EV apps (compass, read-rank, etc.) pick this up live via
 * evContext.subscribe().
 *
 * Always writes the guest top-level `address` slice for back-compat. When a
 * `userId` is supplied (authed user, 260426-mc5), additionally mirrors into
 * the userId-stamped authed slice so cross-subdomain hydration for that user
 * is namespaced and won't leak across user switches.
 *
 * @param {string} addr   - Full formatted address string
 * @param {string} state  - USPS 2-letter state code (e.g. 'IN', 'CA')
 * @param {string=} userId - Optional authed user id; when present, also writes authed slice
 */
export function saveUserAddress(addr, state, userId) {
  if (!state || typeof state !== 'string') return;
  // Also clear the legacy .empowered.vote cookie if any device still has it
  // from a prior visit — prevents stale cookie data from out-living the broker write.
  try {
    document.cookie = 'evUserAddress=; domain=.empowered.vote; path=/; max-age=0; SameSite=Lax; Secure';
  } catch { /* noop */ }
  const addrPayload = { addr, state, ts: Date.now() };
  // Async, fire-and-forget; broker offline is non-fatal but means the write is lost.
  import('@empoweredvote/ev-ui').then(({ evContext }) => {
    evContext.get().then((current) => {
      const next = { ...(current || {}), address: addrPayload };
      evContext.set(next).catch(() => {});
    }).catch(() => {});
    if (userId) {
      evContext.setAuthedSlice(userId, { address: addrPayload }).catch(() => {});
    }
  }).catch(() => {});
}

/**
 * Async read of the cross-subdomain address bridge from ev-context.
 * Returns { addr, state } | null. Honors a 30-day TTL.
 *
 * When `userId` is provided (260426-mc5), prefers the userId-stamped authed
 * slice and falls back to the guest slice on miss / mismatch.
 */
export async function loadUserAddressFromContext({ ttlMs = 30 * 24 * 60 * 60 * 1000, userId } = {}) {
  try {
    const { evContext } = await import('@empoweredvote/ev-ui');
    if (userId) {
      const slice = await evContext.getAuthedSlice(userId);
      const a = slice && slice.address;
      if (a && typeof a.addr === 'string' && typeof a.state === 'string') {
        if (!a.ts || Date.now() - a.ts <= ttlMs) {
          return { addr: a.addr, state: a.state };
        }
      }
    }
    const shared = await evContext.get();
    const a = shared && shared.address;
    if (!a || typeof a.addr !== 'string' || typeof a.state !== 'string') return null;
    if (a.ts && Date.now() - a.ts > ttlMs) return null;
    return { addr: a.addr, state: a.state };
  } catch {
    return null;
  }
}

/**
 * Clears the cross-subdomain address from ev-context. Also nukes the legacy
 * .empowered.vote cookie in case it's still present from before the migration.
 */
export async function clearUserAddress() {
  try {
    document.cookie = 'evUserAddress=; domain=.empowered.vote; path=/; max-age=0; SameSite=Lax; Secure';
  } catch { /* noop */ }
  try {
    const { evContext } = await import('@empoweredvote/ev-ui');
    const current = await evContext.get();
    if (current && current.address) {
      const next = { ...current };
      delete next.address;
      await evContext.set(next);
    }
  } catch { /* noop */ }
}

/**
 * Fetches the authenticated user's verdicts from the backend.
 * Returns { [quote_id]: 'agreed' | 'disagreed' } shape.
 * Returns {} on error or non-ok response.
 * Must only be called inside an authRes.ok guard.
 */
export async function fetchUserVerdicts() {
  try {
    const res = await apiFetch('/compass/verdicts');
    if (!res || !res.ok) return {};
    const list = await res.json(); // [{ quote_id, supported, rank, session_size, ... }]
    const map = {};
    for (const item of list) {
      map[item.quote_id] = item.supported === true ? 'agreed' : 'disagreed';
    }
    return map;
  } catch {
    return {};
  }
}

// ─── Local Lens preset ────────────────────────────────────────────────────────

/**
 * The 8 curated topic UUIDs that define the Local Lens preset.
 * Order matches the user-approved sequence:
 * Housing, Homelessness, Residential Zoning, Civil Rights,
 * Public Safety Approach, Local Immigration Enforcement,
 * Economic Development Incentives, Transportation Priorities
 */
export const LOCAL_LENS_TOPICS = [
  '669cac97-66a6-4087-b036-936fbe62efb3', // Housing
  '4938766b-b45a-46e3-93bd-b8b30651271a', // Homelessness
  'd4f18138-a2e0-4110-b925-7387d9d0d16d', // Residential Zoning
  '0bc588c6-39e1-4084-b5de-cac909b8b762', // Civil Rights
  'e9ebefcd-c496-45e8-b816-a79f8442ba85', // Public Safety Approach
  'b9ccee94-ad96-4f10-b655-889d8e5abe92', // Local Immigration Enforcement
  'eb3d1247-0de1-4b7f-baec-7259861efd53', // Economic Development Incentives
  'ba59337e-30e2-4aba-a39a-426b3366eb27', // Transportation Priorities
];

/** localStorage keys for Local Lens state */
export const LOCAL_LENS_ACTIVE_KEY = 'ev:localLensActive';
export const LOCAL_LENS_SNAPSHOT_KEY = 'ev:localLensSnapshot';

/**
 * Judicial Lens — 8 topics for judges, DAs, and public defenders.
 * Mirrors JUDICIAL_LENS.topicIds in EV-CompassV2/src/lib/lenses.js.
 */
export const JUDICIAL_LENS_TOPICS = [
  '1fab5edf-6151-4da0-9704-a7f2113ba54c', // Bail & Pretrial
  '9d45acaf-1ba4-4cb8-95e1-5ed985223b91', // Court Access
  '9db07b16-1076-4b7d-ad89-ebe7b51f4336', // Criminal Justice
  'e5e48f0e-8f3a-40e1-8080-889fea389603', // Government Deference
  '448b1c9a-b6f3-42b8-8f39-d3bbb5bfa9ee', // Interpretation
  'c267e137-0ff9-4e7d-9d13-e3cea1756cd0', // Jail Capacity
  '6674d87e-999d-433a-aab7-3f626f59fd5f', // Legal Transparency
  'abb99d95-cbb1-4617-8f8b-f220ef6028ca', // Prosecution
];

/**
 * Persists Local Lens activation state and pre-lens snapshot to localStorage.
 * @param {boolean} isActive
 * @param {{ selectedTopics: string[], invertedSpokes: object } | null} snapshot
 */
export function saveLocalLensState(isActive, snapshot) {
  try {
    localStorage.setItem(LOCAL_LENS_ACTIVE_KEY, isActive ? 'true' : 'false');
    if (snapshot) {
      localStorage.setItem(LOCAL_LENS_SNAPSHOT_KEY, JSON.stringify(snapshot));
    } else {
      localStorage.removeItem(LOCAL_LENS_SNAPSHOT_KEY);
    }
  } catch { /* storage unavailable — non-fatal */ }
}

/**
 * Reads Local Lens state from localStorage.
 * @returns {{ active: boolean, snapshot: { selectedTopics: string[], invertedSpokes: object } | null }}
 */
export function loadLocalLensState() {
  try {
    const active = localStorage.getItem(LOCAL_LENS_ACTIVE_KEY) === 'true';
    const raw = localStorage.getItem(LOCAL_LENS_SNAPSHOT_KEY);
    return { active, snapshot: raw ? JSON.parse(raw) : null };
  } catch {
    return { active: false, snapshot: null };
  }
}

// ─── Shared spoke-selection algorithm ────────────────────────────────────────

/**
 * Pure function: computes which topic IDs to display as compass spokes.
 *
 * Used by CompassCard (profile page) and MiniCompass (elections tile).
 * Extracted from CompassCard.jsx §2 spoke-selection algorithm so both
 * components stay in lockstep without code duplication.
 *
 * @param {object} params
 * @param {string[]}  params.selectedTopics   - Topic UUIDs from user calibration (may exceed maxSpokes — capped internally)
 * @param {Array}     params.userAnswers       - [{ topic_id, value }, ...] — any value counts
 * @param {Array}     params.polAnswers        - [{ topic_id, value }, ...] — null/undefined safe
 * @param {Array}     params.scopedTopics      - Topic objects already filtered by districtScope
 * @param {number}    [params.maxSpokes=8]     - Hard cap on displayed spokes (default 8)
 * @param {boolean}   [params.localLensActive=false] - When true, preferredIds = LOCAL_LENS_TOPICS
 *
 * @returns {{
 *   displayTopicIds: string[],
 *   replacedSpokes: { [short_title]: boolean },
 *   hasEnoughSpokes: boolean,
 * }}
 */
export function computeDisplaySpokes({
  selectedTopics,
  userAnswers,
  polAnswers,
  scopedTopics,
  maxSpokes = 8,
  localLensActive = false,
}) {
  // Fast path: no politician answers or no scoped topics
  if (!polAnswers || scopedTopics.length === 0) {
    return { displayTopicIds: [], replacedSpokes: {}, hasEnoughSpokes: false };
  }

  // Build answer sets — String() coercion is defensive (UUIDs but kept from original)
  const polAnsweredSet = new Set(polAnswers.filter((a) => a.value > 0).map((a) => String(a.topic_id)));
  const userAnsweredSet = new Set(userAnswers.map((a) => String(a.topic_id)));

  let displayTopicIds = [];
  const replacedSpokes = {};

  // Determine preferred IDs (lens-aware)
  let preferredIds = null;
  if (localLensActive) {
    preferredIds = LOCAL_LENS_TOPICS.slice(0, maxSpokes);
  } else if (selectedTopics && selectedTopics.length > 0) {
    // Cap at maxSpokes — post-calibration bug can set all 36 topics as selected,
    // which would empty the replacement pool. This guard must never be removed.
    preferredIds = selectedTopics.slice(0, maxSpokes);
  }

  if (preferredIds !== null) {
    const topicById = new Map(scopedTopics.map((t) => [String(t.id), t]));
    const preferredSet = new Set(preferredIds.map(String));

    // Replacement pool: scoped topics not in preferred set where both sides have answered
    const replacementPool = scopedTopics.filter(
      (t) =>
        !preferredSet.has(String(t.id)) &&
        userAnsweredSet.has(String(t.id)) &&
        polAnsweredSet.has(String(t.id))
    );
    let ri = 0;

    for (const id of preferredIds) {
      if (!topicById.get(String(id))) continue; // topic not in scoped set — skip

      if (userAnsweredSet.has(String(id)) && polAnsweredSet.has(String(id))) {
        displayTopicIds.push(String(id));
      } else if (ri < replacementPool.length) {
        // Either side is missing an answer — substitute with a topic both have covered
        const sub = replacementPool[ri++];
        displayTopicIds.push(String(sub.id));
        replacedSpokes[sub.short_title] = true;
      }
      // else: no replacement available — spoke dropped
    }
  } else {
    // Fallback: no selectedTopics and not Lens — bilateral overlap
    displayTopicIds = scopedTopics
      .filter((t) => userAnsweredSet.has(String(t.id)) && polAnsweredSet.has(String(t.id)))
      .map((t) => String(t.id));
  }

  // Cap at maxSpokes
  if (displayTopicIds.length > maxSpokes) {
    displayTopicIds = displayTopicIds.slice(0, maxSpokes);
  }

  const hasEnoughSpokes = displayTopicIds.length >= 3;

  return { displayTopicIds, replacedSpokes, hasEnoughSpokes };
}

/**
 * Compute a new invertedSpokes map after applying Stance Max or Stance Min.
 *
 * Max: spokes whose display value is ≤ 2 are flipped outward (toward the edge).
 * Min: spokes whose display value is ≥ 4 are flipped inward (toward center).
 * Spokes at display value 3 are always left untouched.
 * Stored answer values are never modified — only the inversion state changes.
 *
 * Formula: displayValue = isInverted ? (6 - storedValue) : storedValue
 */
export function computeStanceSpokes(direction, userAnswers, allTopics, invertedSpokes) {
  const newMap = { ...invertedSpokes };
  for (const answer of userAnswers) {
    const v = Number(answer.value);
    if (!v) continue;
    const topic = allTopics.find(t => t.id === answer.topic_id);
    if (!topic?.short_title) continue;
    const short = topic.short_title;
    const isInv = !!newMap[short];
    const display = isInv ? (6 - v) : v;
    if (direction === 'max' && display <= 2) newMap[short] = !isInv;
    else if (direction === 'min' && display >= 4) newMap[short] = !isInv;
  }
  return newMap;
}
