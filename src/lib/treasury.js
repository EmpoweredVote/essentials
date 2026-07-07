// src/lib/treasury.js
import { apiFetch } from './auth';

/**
 * Centralized Treasury Tracker base URL. Single source of truth consumed by
 * both the existing per-body text link (Results.jsx) and the tethered
 * feature-icon row (featureIcons.js) — see 187-01 "Open question resolved".
 */
export const TREASURY_URL =
  import.meta.env.VITE_TREASURY_URL || 'https://financials.empowered.vote';

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
    // Require the matched candidate to actually be municipality-shaped, mirroring
    // the entity_type guard already used by findStateTreasuryEntity (WR-01). Only
    // exclude when entity_type IS SET and isn't municipality-shaped — entities with
    // no entity_type must still pass so existing matches are unaffected.
    if (c.entity_type && !['municipality', 'city', 'town', 'village'].includes(c.entity_type)) return false;
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

/**
 * Finds the state-tier Treasury entity for a 2-letter state abbreviation.
 * Unlike findMatchingMunicipality, this is a direct entity_type + state match —
 * state Treasury entities are singular per state and have unambiguous plain names.
 * Confirmed via live /treasury/cities probe 2026-07-07 (50 entity_type: 'state' rows).
 *
 * @param {string} state - 2-letter abbrev, e.g. "TX"
 * @param {Array} cities - from fetchTreasuryCities()
 * @returns {object|null}
 */
export function findStateTreasuryEntity(state, cities) {
  if (!state || !Array.isArray(cities)) return null;
  const wantState = state.toUpperCase();
  return (
    cities.find(
      (c) =>
        c.entity_type === 'state' &&
        (c.state || '').toUpperCase() === wantState &&
        Array.isArray(c.available_datasets) &&
        c.available_datasets.length > 0
    ) || null
  );
}

/**
 * Finds the (currently singular) federal Treasury entity ("United States").
 * Confirmed via live /treasury/cities probe 2026-07-07 (1 entity_type: 'federal' row).
 *
 * @param {Array} cities - from fetchTreasuryCities()
 * @returns {object|null}
 */
export function findFederalTreasuryEntity(cities) {
  if (!Array.isArray(cities)) return null;
  return (
    cities.find(
      (c) =>
        c.entity_type === 'federal' &&
        Array.isArray(c.available_datasets) &&
        c.available_datasets.length > 0
    ) || null
  );
}
