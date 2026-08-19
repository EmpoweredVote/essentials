// zipResults.js — pure presentation helpers for the ?zip= Results mode.
//
// A ZIP is an AREA. It cannot tell us which side of a district line the visitor
// lives on, so this module's job is to present genuine ambiguity honestly:
// everything is shown, ranked by how much of the ZIP each district covers, with
// slivers behind a disclosure rather than deleted.
//
// Pure and DOM-free so it can be unit-tested — this repo has no jsdom or
// testing-library, so logic worth testing has to live outside the component.

/**
 * Below this share of the ZIP's area, an official goes behind the
 * "also partly in this ZIP" disclosure.
 *
 * PRESENTATION ONLY — the server never filters on share. Measured against real
 * data: ZIP 46360 touches 7 places and only 1 clears 2%, while ZIP 47401's
 * Bloomington slice sits under 10%. A server-side 10% cutoff would have deleted
 * a legitimate answer; 2% collapses noise without losing anyone.
 */
export const SHARE_DISCLOSURE_THRESHOLD = 0.02;

/** district_type -> plural human phrase, for the ambiguity sentence. */
const DISTRICT_TYPE_PLURALS = {
  NATIONAL_LOWER: 'US Representatives',
  NATIONAL_UPPER: 'US Senators',
  STATE_UPPER: 'state senators',
  STATE_LOWER: 'state house members',
  STATE_BOARD: 'state board members',
  COUNTY: 'county officials',
  LOCAL: 'local officials',
  LOCAL_EXEC: 'local executives',
  CITY_COUNCIL: 'council members',
  SCHOOL: 'school board members',
  SCHOOL_BOARD: 'school board members',
  JUDICIAL: 'judges',
};

/**
 * splitByShare(politicians) -> { primary, collapsed }
 *
 * `primary` is sorted share-descending with null shares (statewide offices) last
 * — a statewide official has no share because a state contains the whole ZIP,
 * and that is not a reason to bury them.
 *
 * Fails OPEN: an official with a missing/null share is primary, never hidden.
 */
export function splitByShare(politicians) {
  const list = Array.isArray(politicians) ? politicians : [];
  const primary = [];
  const collapsed = [];

  for (const p of list) {
    const share = p?.share;
    if (share == null || share >= SHARE_DISCLOSURE_THRESHOLD) primary.push(p);
    else collapsed.push(p);
  }

  const byShareDesc = (a, b) => {
    if (a.share == null && b.share == null) return 0;
    if (a.share == null) return 1;
    if (b.share == null) return -1;
    return b.share - a.share;
  };
  primary.sort(byShareDesc);
  collapsed.sort(byShareDesc);

  return { primary, collapsed };
}

/**
 * At most this many office types are named individually in the ambiguity
 * sentence. Real data justifies a cap: ZIP 47401 is ambiguous across SIX types
 * at once (13 local districts, 5 counties, 5 local executives, 2 judicial,
 * 2 state house, 2 state senate), and a six-clause sentence is unreadable.
 *
 * When truncated the sentence says "and other offices" rather than stopping
 * silently — understating the ambiguity would be the one unacceptable outcome.
 */
const MAX_AMBIGUITY_PHRASES = 3;

/**
 * One honest sentence about what this ZIP cannot pin down. '' when nothing is.
 *
 * `ambiguity` counts DISTINCT DISTRICTS, not people (see the backend's
 * rollUpAmbiguity) — so a 29-member county court never appears here. It arrives
 * sorted count-descending, so truncation keeps the largest ambiguities.
 */
export function ambiguityCopy(ambiguity) {
  const items = Array.isArray(ambiguity) ? ambiguity : [];
  if (items.length === 0) return '';

  const named = items.slice(0, MAX_AMBIGUITY_PHRASES);
  const truncated = items.length > MAX_AMBIGUITY_PHRASES;

  const phrases = named.map(
    ({ district_type, count }) => `${count} ${DISTRICT_TYPE_PLURALS[district_type] ?? 'officials'}`,
  );
  if (truncated) phrases.push('other offices');

  const joined =
    phrases.length === 1
      ? phrases[0]
      : `${phrases.slice(0, -1).join(', ')} and ${phrases[phrases.length - 1]}`;

  return `${joined} serve parts of this ZIP code.`;
}

/**
 * Area voice, deliberately. NOT "your representatives" — for most of the people
 * listed under a doubled office, that claim would be false.
 */
export function zipHeading(zip) {
  return `Officials serving ${zip}`;
}
