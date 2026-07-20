// src/lib/trivia.js
//
// Civic Trivia Championship (CTC) integration — mirror of treasury.js.
//
// A "community" has a CTC collection when a matching entry exists in CTC's
// public collections list. Essentials fetches that list through the
// accounts-api proxy (`/trivia/collections`, server-side cached) rather than
// calling the CTC backend cross-origin — same shape as `/treasury/cities`.
//
// City-tier collection slugs share the EXACT format produced by
// toTreasurySlug (`${name}-${state}`, e.g. "los-angeles-ca"), so matching a
// city is a straight slug comparison. State/federal collections match on
// tier + locale (parity with treasury's three tiers).
import { apiFetch } from './auth';

/**
 * Centralized CTC base URL (the Dashboard / "main page" lives at `/`).
 * Deep-links append `?collection=<slug>` so the Dashboard opens with that
 * collection pre-selected and its "Play Now" button primed (no auto-start).
 */
export const TRIVIA_URL =
  import.meta.env.VITE_TRIVIA_URL || 'https://ctc.empowered.vote';

/**
 * Fetches the list of CTC collections from the accounts-api proxy.
 * Returns [] on network error or non-ok response (never throws).
 * Accepts either a bare array or a `{ collections: [...] }` envelope.
 */
export async function fetchTriviaCollections() {
  try {
    const res = await apiFetch('/trivia/collections');
    if (!res || !res.ok) return [];
    const body = await res.json();
    const list = Array.isArray(body) ? body : body?.collections;
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/**
 * Converts a city {name, state} to the slug CTC uses for city collections.
 * Identical rules to toTreasurySlug (see treasury.js §30) so the two products
 * key off the same value. Strips residual `/`, `?`, `#`.
 *
 * @param {{ name: string, state?: string }} city
 * @returns {string} e.g. "los-angeles-ca" (or "los-angeles" when no state)
 */
export function toCollectionSlug(city) {
  const name = (city?.name || '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[/?#]/g, '');
  const state = (city?.state || '')
    .toLowerCase()
    .replace(/[/?#]/g, '');
  return state ? `${name}-${state}` : name;
}

/** Normalize a string for loose matching: lowercase, collapse whitespace, trim. */
function normalize(s) {
  return (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** A collection is usable only when it carries a non-empty slug (deep-link key). */
function hasSlug(c) {
  return typeof c?.slug === 'string' && c.slug.length > 0;
}

/**
 * Finds the city-tier CTC collection for a community.
 *
 * Matches by computing the expected slug from the (prefix-stripped) city name
 * plus the 2-letter state, then comparing against city-tier collection slugs.
 * Requires a valid state — city slugs are always state-suffixed, so without one
 * a match would be ambiguous across states (returns null → no chip).
 *
 * @param {string} city         - representing city, e.g. "Los Angeles"
 * @param {string} state        - 2-letter abbrev, e.g. "CA"
 * @param {Array}  collections  - from fetchTriviaCollections()
 * @returns {object|null}
 */
export function findMatchingCityCollection(city, state, collections) {
  if (!city || !Array.isArray(collections)) return null;
  const wantState =
    typeof state === 'string' && /^[A-Za-z]{2}$/.test(state) ? state.toLowerCase() : null;
  if (!wantState) return null;

  const strippedName = normalize(city).replace(
    /^(city|town|village|county|township|borough) of /,
    ''
  );
  const expected = toCollectionSlug({ name: strippedName, state: wantState });

  return (
    collections.find(
      (c) => hasSlug(c) && (c.tier === 'city' || !c.tier) && c.slug.toLowerCase() === expected
    ) || null
  );
}

/**
 * Finds the state-tier CTC collection for a full state name (e.g. "California").
 * CTC's localeCode is a language tag ("en-US"), not a state abbrev, so localeName
 * is the reliable match key.
 *
 * @param {string} stateName    - full state name, e.g. "California"
 * @param {Array}  collections  - from fetchTriviaCollections()
 * @returns {object|null}
 */
export function findStateCollection(stateName, collections) {
  if (!stateName || !Array.isArray(collections)) return null;
  const want = normalize(stateName);
  return (
    collections.find(
      (c) => hasSlug(c) && c.tier === 'state' && normalize(c.localeName) === want
    ) || null
  );
}

/**
 * Finds the (currently singular) federal CTC collection ("United States").
 *
 * @param {Array} collections - from fetchTriviaCollections()
 * @returns {object|null}
 */
export function findFederalCollection(collections) {
  if (!Array.isArray(collections)) return null;
  return collections.find((c) => hasSlug(c) && c.tier === 'federal') || null;
}
