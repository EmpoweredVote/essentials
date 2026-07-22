// src/lib/bannerProps.js
// Pure function — no React import, no I/O, mirrors resolvePopulation/resolveFeatureIcons'
// no-side-effects convention so it can be unit-tested without jsdom.

const TIER_TO_MAP_KEY = { city: 'Local', state: 'State', federal: 'Federal' };

/**
 * Assemble the exact prop object <SectionBanner> needs for one tier, from the
 * already-resolved per-page maps. This is the ONE place tier->prop assembly
 * logic lives (SBAN-03) - both Results.jsx and ElectionsView.jsx call this
 * identically; neither page hand-assembles imageUrl/featureIcons/stats or
 * locationName inline anymore.
 *
 * @param {'city'|'state'|'federal'} tier
 * @param {{
 *   representingCity?: string|null,
 *   userState?: string|null,
 *   stateNames?: Record<string,string>,
 *   buildingImageMap?: {Local?:string|null, State?:string|null, Federal?:string|null},
 *   featureIconMap?: {Local?:Array, State?:Array, Federal?:Array},
 *   populationMap?: {Local?:object|null, State?:object|null, Federal?:object|null},
 * }} ctx
 * @returns {{tier:string, locationName:string, imageUrl:string|null, featureIcons:Array, stats:object|null}}
 */
export function buildBannerProps(tier, ctx = {}) {
  const {
    representingCity = null,
    userState = null,
    stateNames = {},
    buildingImageMap = {},
    featureIconMap = {},
    populationMap = {},
  } = ctx;

  const mapKey = TIER_TO_MAP_KEY[tier];

  let locationName;
  if (tier === 'city') {
    if (!representingCity) {
      locationName = 'Your City';
    } else if (userState) {
      // In browse mode representingCity is the resolver's full label, which already
      // ends in the state (e.g. "…, California, US, CA") — appending userState again
      // would double it ("…US, CA, CA"). Only append when the label's trailing
      // comma-segment isn't already the state abbrev or full name. Address mode
      // (representingCity = a bare city like "Plano") still gets ", TX" appended.
      const trailing = representingCity.split(',').pop().trim().toLowerCase();
      const alreadyHasState =
        trailing === userState.toLowerCase() ||
        trailing === (stateNames[userState] || '').toLowerCase();
      locationName = alreadyHasState ? representingCity : `${representingCity}, ${userState}`;
    } else {
      locationName = representingCity;
    }
  } else if (tier === 'state') {
    locationName = (userState && stateNames[userState]) || userState || 'Your State';
  } else {
    locationName = 'United States';
  }

  return {
    tier,
    locationName,
    imageUrl: buildingImageMap[mapKey] ?? null,
    featureIcons: featureIconMap[mapKey] ?? [],
    stats: populationMap[mapKey] ?? null,
  };
}
