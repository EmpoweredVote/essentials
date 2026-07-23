// src/lib/localityLabel.js
// Pure function — no React import, no I/O, mirrors bannerProps.js's testable-pure
// convention so it can be unit-tested without jsdom.

/**
 * Derive the "Unincorporated {County}" banner label from the backend's `locality`
 * probe (see 216-01/216-02: `{ incorporated: boolean|null, place_name, county_name }`).
 *
 * Only renders when the point is confirmed OUTSIDE any incorporated place in a
 * place-loaded state (`incorporated === false`) AND a county name is present.
 * `incorporated === true` (has a place) and `incorporated === null` (un-loaded
 * state, unknown) both suppress the label — the caller falls back to its existing
 * place-name / postal-city resolution.
 *
 * @param {{incorporated: boolean|null, place_name?: string|null, county_name?: string|null}|null|undefined} localityStatus
 * @returns {string|null}
 */
export function unincorporatedLabel(localityStatus) {
  if (localityStatus?.incorporated === false && localityStatus?.county_name) {
    return `Unincorporated ${localityStatus.county_name}`;
  }
  return null;
}
