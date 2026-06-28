// src/lib/treasury.js
import { apiFetch } from './auth';

/**
 * Fetches the list of Treasury municipalities from the backend.
 * Returns [] on network error or non-ok response (never throws).
 */
export async function fetchTreasuryCities() {
  try {
    const res = await apiFetch('/treasury/cities');
    if (!res || !res.ok) return [];
    const body = await res.json();
    return Array.isArray(body) ? body : [];
  } catch {
    return [];
  }
}

/**
 * Converts a Treasury city object to the slug format used by Treasury Tracker deep-links.
 * Matches treasury-tracker/src/App.tsx §30: `${name.toLowerCase().replace(/\s+/g, '-')}-${state.toLowerCase()}`
 *
 * Defensive: strips any residual `/`, `?`, `#` characters (T-122-02 mitigation).
 *
 * @param {{ name: string, state: string }} city
 * @returns {string} e.g. "bloomington-in"
 */
export function toTreasurySlug(city) {
  const name = city.name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[/?#]/g, '');
  const state = city.state
    .toLowerCase()
    .replace(/[/?#]/g, '');
  return `${name}-${state}`;
}

/** Normalize a string for loose matching: lowercase, collapse whitespace, trim. */
function normalize(s) {
  return (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Finds the best Treasury municipality match for a government body title.
 *
 * Matching strategy:
 * - The body title must start with (or equal) the normalized municipality name.
 * - The municipality must have available_datasets.length > 0 (has-data predicate).
 * - When a `state` is supplied, only treasury entities in that state are eligible.
 *   This disambiguates same-named cities across states (e.g. Salem UT must NOT
 *   match Salem MA, Saratoga Springs UT must NOT match Saratoga CA). When a city
 *   has no same-state treasury entity, this returns null so the caller renders
 *   no link rather than a wrong-state one.
 * - When multiple candidates match (e.g. "Bloomington" vs "Bloomington Township"),
 *   the longest-name candidate wins (most specific match).
 *
 * Returns null if no match or cities list is empty/falsy.
 *
 * @param {string} bodyTitle - e.g. "Bloomington Common Council"
 * @param {Array}  cities    - from fetchTreasuryCities()
 * @param {string} [state]   - 2-letter state abbrev (e.g. "UT") to constrain the match
 * @returns {object|null}    - matching city object, or null
 */
const ENTITY_TYPE_WORDS = ['township', 'county', 'village', 'borough', 'town', 'parish'];

export function findMatchingMunicipality(bodyTitle, cities, state) {
  if (!bodyTitle || !Array.isArray(cities)) return null;

  const t = normalize(bodyTitle);

  // Disambiguate by state: a Utah city must only match a Utah treasury entity.
  // Without this, name-only matching lets a same-named city in another state win
  // (Salem UT → salem-ma, Saratoga Springs UT → saratoga-ca).
  const wantState = typeof state === 'string' && /^[A-Za-z]{2}$/.test(state)
    ? state.toUpperCase()
    : null;

  // Strip "City of", "Town of", etc. prefixes before matching
  const stripped = t.replace(/^(city|town|village|county|township|borough) of /, '');

  const candidates = cities.filter((c) => {
    if (!c.available_datasets || c.available_datasets.length === 0) return false;
    if (wantState && (c.state || '').toUpperCase() !== wantState) return false;
    const cityName = normalize(c.name);
    const base = stripped === cityName || stripped.startsWith(cityName + ' ') ? stripped : t;
    if (base !== cityName && !base.startsWith(cityName + ' ')) return false;
    // Reject if the next word after the city name is a different entity type
    // e.g. "Bloomington Township" should not match the city of "Bloomington"
    const rest = base.slice(cityName.length).trim();
    const nextWord = rest.split(/\s+/)[0];
    if (nextWord && ENTITY_TYPE_WORDS.includes(nextWord)) return false;
    return true;
  });

  if (candidates.length === 0) return null;

  // Longest name wins (most specific match)
  return candidates.sort((a, b) => b.name.length - a.name.length)[0];
}
