// src/lib/population.js
import { POP_BY_FIPS, NAME_STATE_TO_FIPS } from '../data/population.js';
import { STATE_FIPS_TO_ABBREV } from './buildingImages.js';

/**
 * Forward map derived once: 2-letter state abbreviation -> 2-digit state FIPS
 * (D-04 inverse). Single source of truth is STATE_FIPS_TO_ABBREV — never
 * re-type a second 51-entry table.
 */
const ABBREV_TO_STATE_FIPS = Object.fromEntries(
  Object.entries(STATE_FIPS_TO_ABBREV).map(([fips, abbrev]) => [abbrev, fips])
);

/** Default maps bundle bound to the real committed data — the one-arg call form. */
const DEFAULT_MAPS = { POP_BY_FIPS, NAME_STATE_TO_FIPS, ABBREV_TO_STATE_FIPS };

/**
 * Pure resolver: maps a banner's location identity to a population number, or
 * null on any miss (STAT-03). Mirrors resolveFeatureIcons' tier-branch idiom
 * (src/lib/featureIcons.js) — no I/O, no router, no console.
 *
 * - tier 'federal' -> POP_BY_FIPS['US'] (D-06; always resolves given a real bundle).
 * - tier 'state' -> stateAbbrev -> 2-digit state FIPS -> POP_BY_FIPS[fips] (D-04).
 * - tier 'city' -> geoId (verbatim string, D-05 primary) or city+stateAbbrev via the
 *   name|state index (D-05 fallback).
 * - Any resolved population that is 0, NaN, or not a number returns null (STAT-03).
 *
 * @param {{tier:'federal'|'state'|'city', geoId?:string, city?:string, stateAbbrev?:string}} loc
 * @param {{POP_BY_FIPS:Object, NAME_STATE_TO_FIPS:Object, ABBREV_TO_STATE_FIPS:Object}} [maps]
 *   Injectable maps seam — defaults to the bound real bundle. Tests inject a tiny
 *   fixture object here instead of importing the ~700KB real bundle.
 * @returns {number|null} a positive finite number, or null on any miss.
 */
export function resolvePopulation({ tier, geoId, city, stateAbbrev } = {}, maps = DEFAULT_MAPS) {
  let fips = null;

  if (tier === 'federal') {
    fips = 'US';
  } else if (tier === 'state') {
    fips = maps.ABBREV_TO_STATE_FIPS[(stateAbbrev || '').toUpperCase()] || null;
  } else if (tier === 'city') {
    if (geoId && maps.POP_BY_FIPS[String(geoId)] != null) {
      fips = String(geoId);
    } else if (city && stateAbbrev) {
      fips = maps.NAME_STATE_TO_FIPS[`${city.toLowerCase()}|${stateAbbrev.toUpperCase()}`] || null;
    }
  }

  const pop = fips != null ? maps.POP_BY_FIPS[fips] : null;
  return typeof pop === 'number' && pop > 0 ? pop : null;
}
