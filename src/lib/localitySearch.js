// Locality search routing (ADR-0001 -> Phase 214 refactor).
//
// Google Places' Geocoder classification is retired (D-09) in favor of the
// Phase 214 client heuristic (src/lib/inputClassifier.js) plus the live
// Phase 212 place-name resolver (searchLocationsByName). Two Google-free
// routing helpers are exported for the host pages (Plans 03/04):
//   - browseAreaRoute(candidate)     -> /results?browse_geo_id=...&browse_mtfcc=...&browse_label=...&from_locality=1
//   - coordinateRoute(lat, lng, raw) -> /results?lat=...&lng=...&coord_raw=...
//     (SRCH-05 cross-page coordinate hand-off contract — Landing navigates
//     here, Results reads lat/lng/coord_raw on mount and resolves through the
//     SAME shared coordinate path its own onSubmitCoordinate uses.)
//
// resolveLocalityRoute() keeps its pre-existing outer contract
// ({ kind: 'address' | 'browse' | 'coverage', to }) so Results.jsx/Landing.jsx's
// current call sites (unchanged by this plan; refactored in Plans 03/04) keep
// working end to end, but its classification step is now classifyInput() plus
// the live resolver instead of the Google Geocoder.

import { classifyInput } from './inputClassifier';
import { searchLocationsByName } from './api';

/**
 * Build a browse-by-area route from a /location-search candidate
 * ({ geo_id, mtfcc, label, state, has_local_data }). `label` is already the
 * resolver's clean display string (212 D-05/D-07) — no TIGER-suffix stripping
 * needed here, unlike the old static-catalog area shape this helper replaces.
 */
export function browseAreaRoute(candidate) {
  const params = new URLSearchParams({
    browse_geo_id: candidate.geo_id,
    browse_mtfcc: candidate.mtfcc,
    browse_label: candidate.label,
    from_locality: '1',
  });
  return `/results?${params.toString()}`;
}

/**
 * SRCH-05 cross-page coordinate hand-off contract. `raw` is the LITERAL text
 * the user typed (e.g. "39.17, -86.52"), carried purely so Results can
 * reconstruct the D-05 resting label from the user's own keystrokes — never
 * from a server response. Phase 213 deliberately never echoes coordinates
 * back; this URL is built entirely from client-sourced input placed in the
 * user's own browser URL, preserving that no-echo privacy contract.
 * URLSearchParams percent-encodes every value — never string-concatenate
 * untrusted input into this path (T-214-05, open-redirect/injection guard).
 */
export function coordinateRoute(lat, lng, raw) {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    coord_raw: raw,
  });
  return `/results?${params.toString()}`;
}

/**
 * Resolve a free-text query to a navigation action. Returns one of:
 *   { kind: 'address' }      -> caller runs the normal /results?q= search
 *   { kind: 'browse', to }   -> navigate(to): Browse-by-Location for the top-ranked candidate
 *   { kind: 'coverage', to } -> navigate(to): landing coverage list / "not covered yet" banner
 * Never throws — any failure resolves to { kind: 'address' }.
 *
 * Classification is now classifyInput() (D-02): address/coordinate-shaped
 * queries skip the resolver entirely and fall straight through to the address
 * path; only name-like queries hit the live /location-search resolver.
 */
export async function resolveLocalityRoute(query) {
  const classified = classifyInput(query);
  if (classified.kind !== 'name') return { kind: 'address' };

  const trimmed = query.trim();
  try {
    const { data } = await searchLocationsByName(trimmed);
    const candidates = Array.isArray(data) ? data : [];
    if (candidates.length > 0) {
      return { kind: 'browse', to: browseAreaRoute(candidates[0]) };
    }
  } catch {
    return { kind: 'address' };
  }

  // No candidates from the live resolver — honest "not covered yet" fallback
  // to the landing coverage list rather than a silent address-search miss.
  return { kind: 'coverage', to: `/?uncovered=1&from_search=${encodeURIComponent(trimmed)}` };
}
