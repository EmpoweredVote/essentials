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
 * - When multiple candidates match (e.g. "Bloomington" vs "Bloomington Township"),
 *   the longest-name candidate wins (most specific match).
 *
 * Returns null if no match or cities list is empty/falsy.
 *
 * @param {string} bodyTitle - e.g. "Bloomington Common Council"
 * @param {Array}  cities    - from fetchTreasuryCities()
 * @returns {object|null}    - matching city object, or null
 */
const ENTITY_TYPE_WORDS = ['township', 'county', 'village', 'borough', 'town', 'parish'];

export function findMatchingMunicipality(bodyTitle, cities) {
  if (!bodyTitle || !Array.isArray(cities)) return null;

  const t = normalize(bodyTitle);

  const candidates = cities.filter((c) => {
    if (!c.available_datasets || c.available_datasets.length === 0) return false;
    const cityName = normalize(c.name);
    if (t !== cityName && !t.startsWith(cityName + ' ')) return false;
    // Reject if the next word after the city name is a different entity type
    // e.g. "Bloomington Township" should not match the city of "Bloomington"
    const rest = t.slice(cityName.length).trim();
    const nextWord = rest.split(/\s+/)[0];
    if (nextWord && ENTITY_TYPE_WORDS.includes(nextWord)) return false;
    return true;
  });

  if (candidates.length === 0) return null;

  // Longest name wins (most specific match)
  return candidates.sort((a, b) => b.name.length - a.name.length)[0];
}
