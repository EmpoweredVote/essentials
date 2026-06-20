// Locality search fallback (ADR-0001).
//
// When a user submits a free-text query that isn't a precise street address,
// classify it with the Google Geocoder and route it usefully instead of erroring:
//   - street address  -> normal backend search (caller handles)
//   - covered city     -> Browse-by-Location for that city + precision banner
//   - state / county / uncovered city -> the landing coverage list for that state
//                                         (or an honest "not covered yet" banner)
//
// True county-wide browse isn't supported (we have no county name -> geo_id map),
// so a county query resolves to "covered areas in that county's state".

import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { normalizePlace, STATE_NAME_TO_ABBREV } from './coverage';
import { fetchBrowseAreas } from './api';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function ensureConfigured() {
  if (API_KEY && !window.google?.maps?.importLibrary) {
    setOptions({ key: API_KEY });
  }
}

function comp(components, type) {
  return components?.find((c) => c.types.includes(type)) || null;
}

/**
 * Classify a free-text query into { kind, cityName, countyName, stateAbbrev, stateName }.
 * kind is one of: 'address' | 'city' | 'county' | 'state' | 'unknown'.
 * Throws if the geocoder is unavailable or returns no results — callers should
 * treat a throw as "fall back to normal address search".
 */
export async function classifyQuery(query) {
  if (!API_KEY) throw new Error('no maps key');
  ensureConfigured();
  const { Geocoder } = await importLibrary('geocoding');
  const geocoder = new Geocoder();
  const { results } = await geocoder.geocode({
    address: query,
    componentRestrictions: { country: 'US' },
  });
  const top = results?.[0];
  if (!top) throw new Error('no geocode result');

  const types = top.types || [];
  const components = top.address_components || [];
  const stateComp = comp(components, 'administrative_area_level_1');
  const countyComp = comp(components, 'administrative_area_level_2');
  const localityComp = comp(components, 'locality') || comp(components, 'postal_town') || comp(components, 'sublocality');

  const out = {
    cityName: localityComp?.long_name || '',
    countyName: countyComp?.long_name || '',
    stateName: stateComp?.long_name || '',
    stateAbbrev: stateComp?.short_name || STATE_NAME_TO_ABBREV[(stateComp?.long_name || '').toLowerCase()] || '',
  };

  const hasStreet = !!comp(components, 'street_number')
    || types.some((t) => ['street_address', 'premise', 'subpremise', 'route'].includes(t));

  if (hasStreet) out.kind = 'address';
  else if (types.includes('postal_code')) out.kind = 'address'; // ZIP works with the backend
  else if (types.includes('locality') || types.includes('postal_town') || types.includes('sublocality')) out.kind = 'city';
  else if (types.includes('administrative_area_level_2')) out.kind = 'county';
  else if (types.includes('administrative_area_level_1')) out.kind = 'state';
  else out.kind = 'unknown';

  return out;
}

// TIGER place names carry a type suffix ("Payson city", "Alta town"); strip it for
// matching/labelling against the geocoded locality name ("Payson").
function cleanAreaName(name) {
  return (name || '').replace(/\s+(city|town|village|CDP|borough|municipality)$/i, '').trim();
}

/** Build a browse-by-area route from a coverage area ({ geo_id, mtfcc, name }). */
function browseAreaRoute(area) {
  const params = new URLSearchParams({
    browse_geo_id: area.geo_id,
    browse_mtfcc: area.mtfcc,
    browse_label: cleanAreaName(area.name),
    from_locality: '1',
  });
  return `/results?${params.toString()}`;
}

/**
 * Resolve a query to a navigation action. Returns one of:
 *   { kind: 'address' }      -> caller runs the normal /results?q= search
 *   { kind: 'browse', to }   -> navigate(to): Browse-by-Location for the matched city/county + banner
 *   { kind: 'coverage', to } -> navigate(to): landing coverage list / "not covered yet" banner
 * Never throws — any failure resolves to { kind: 'address' }.
 *
 * Coverage is read live from the browse-areas endpoint (the source of truth), not a
 * static list: an empty areas response means the state isn't covered.
 */
export async function resolveLocalityRoute(query) {
  let c;
  try {
    c = await classifyQuery(query);
  } catch {
    return { kind: 'address' };
  }

  if (!c || c.kind === 'address' || c.kind === 'unknown' || !c.stateAbbrev) return { kind: 'address' };

  const areas = await fetchBrowseAreas(c.stateAbbrev);
  const place = c.cityName || c.countyName || c.stateName || query;

  // No browseable areas => we don't cover this state.
  if (!areas.length) {
    return { kind: 'coverage', to: `/?uncovered=1&from_search=${encodeURIComponent(place)}` };
  }

  // Prefer the exact city, then fall back to the county.
  const cityTarget = normalizePlace(c.cityName);
  const countyTarget = normalizePlace(c.countyName);
  let match = null;
  if (cityTarget) {
    match = areas.find((a) => a.area_type === 'city' && normalizePlace(cleanAreaName(a.name)) === cityTarget);
  }
  if (!match && countyTarget) {
    match = areas.find((a) => a.area_type === 'county' && normalizePlace(a.name) === countyTarget);
  }
  if (match) return { kind: 'browse', to: browseAreaRoute(match) };

  // Covered state, but the specific place isn't a browseable area — show the state's list.
  return { kind: 'coverage', to: `/?coverage_state=${c.stateAbbrev}&from_search=${encodeURIComponent(place)}` };
}
