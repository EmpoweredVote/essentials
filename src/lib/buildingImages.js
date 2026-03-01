/**
 * Building image mapping for Essentials tier sections.
 * Federal: always the real US Capitol photo.
 * State: real capitol building per state, fallback to generic SVG.
 * Local: curated images for select cities, fallback to generic SVG.
 */

/** Map of state abbreviation → kebab-case file stem for state capitol images */
const STATE_CAPITOLS = {
  AL: 'alabama',
  AK: 'alaska',
  AZ: 'arizona',
  AR: 'arkansas',
  CA: 'california',
  CO: 'colorado',
  CT: 'connecticut',
  DE: 'delaware',
  FL: 'florida',
  GA: 'georgia',
  HI: 'hawaii',
  ID: 'idaho',
  IL: 'illinois',
  IN: 'indiana',
  IA: 'iowa',
  KS: 'kansas',
  KY: 'kentucky',
  LA: 'louisiana',
  ME: 'maine',
  MD: 'maryland',
  MA: 'massachusetts',
  MI: 'michigan',
  MN: 'minnesota',
  MS: 'mississippi',
  MO: 'missouri',
  MT: 'montana',
  NE: 'nebraska',
  NV: 'nevada',
  NH: 'new-hampshire',
  NJ: 'new-jersey',
  NM: 'new-mexico',
  NY: 'new-york',
  NC: 'north-carolina',
  ND: 'north-dakota',
  OH: 'ohio',
  OK: 'oklahoma',
  OR: 'oregon',
  PA: 'pennsylvania',
  RI: 'rhode-island',
  SC: 'south-carolina',
  SD: 'south-dakota',
  TN: 'tennessee',
  TX: 'texas',
  UT: 'utah',
  VT: 'vermont',
  VA: 'virginia',
  WA: 'washington',
  WV: 'west-virginia',
  WI: 'wisconsin',
  WY: 'wyoming',
};

/** Reverse map: lowercase full state name → abbreviation (derived from STATE_CAPITOLS) */
const STATE_NAME_TO_ABBREV = Object.fromEntries(
  Object.entries(STATE_CAPITOLS).map(([abbrev, stem]) => [
    stem.replace(/-/g, ' '),  // "new-york" → "new york"
    abbrev,
  ])
);

const FEDERAL_IMAGE = '/images/us-capitol.jpg';

const CURATED_LOCAL = {
  bloomington: '/images/bloomington-city-hall.jpg',
  'los angeles': 'https://zlbutxtrjcixpdgfzrgv.storage.supabase.co/storage/v1/object/public/politician-photos/la_county/building_photos/0644000.jpg',
  'long beach': 'https://zlbutxtrjcixpdgfzrgv.storage.supabase.co/storage/v1/object/public/politician-photos/la_county/building_photos/0643000.jpg',
  glendale: 'https://zlbutxtrjcixpdgfzrgv.storage.supabase.co/storage/v1/object/public/politician-photos/la_county/building_photos/0630000.jpg',
  pomona: 'https://zlbutxtrjcixpdgfzrgv.storage.supabase.co/storage/v1/object/public/politician-photos/la_county/building_photos/0658072.jpg',
  torrance: 'https://zlbutxtrjcixpdgfzrgv.storage.supabase.co/storage/v1/object/public/politician-photos/la_county/building_photos/0680000.jpg',
  pasadena: 'https://zlbutxtrjcixpdgfzrgv.storage.supabase.co/storage/v1/object/public/politician-photos/la_county/building_photos/0656000.jpg',
  'west covina': 'https://zlbutxtrjcixpdgfzrgv.storage.supabase.co/storage/v1/object/public/politician-photos/la_county/building_photos/0684200.jpg',
  downey: 'https://zlbutxtrjcixpdgfzrgv.storage.supabase.co/storage/v1/object/public/politician-photos/la_county/building_photos/0619766.jpg',
  burbank: 'https://zlbutxtrjcixpdgfzrgv.storage.supabase.co/storage/v1/object/public/politician-photos/la_county/building_photos/0608954.jpg',
  carson: 'https://zlbutxtrjcixpdgfzrgv.storage.supabase.co/storage/v1/object/public/politician-photos/la_county/building_photos/0611530.jpg',
  norwalk: 'https://zlbutxtrjcixpdgfzrgv.storage.supabase.co/storage/v1/object/public/politician-photos/la_county/building_photos/0652526.jpg',
};

const FALLBACK_LOCAL = '/images/city-hall-generic.svg';
const FALLBACK_STATE = '/images/state-capitol-generic.svg';

/**
 * Get building images for each tier.
 * @param {string} representingCity - City name from politician data
 * @param {string} stateAbbrev - Two-letter state abbreviation (e.g., "IN", "CA")
 * @returns {{ Local: string, State: string, Federal: string }}
 */
export function getBuildingImages(representingCity, stateAbbrev) {
  const city = (representingCity || '').toLowerCase();

  // Local: check curated cities, else null (no placeholder)
  let localImage = null;
  for (const [key, src] of Object.entries(CURATED_LOCAL)) {
    if (city.includes(key)) {
      localImage = src;
      break;
    }
  }

  // State: look up abbreviation for real capitol photo, else null
  let stateImage = null;
  const abbrev = (stateAbbrev || '').toUpperCase();
  if (STATE_CAPITOLS[abbrev]) {
    stateImage = `/images/state-capitols/${STATE_CAPITOLS[abbrev]}.jpg`;
  }

  return {
    Local: localImage,
    State: stateImage,
    Federal: FEDERAL_IMAGE,
  };
}

/**
 * Parse a two-letter state abbreviation from an address string.
 * Matches "ST 84057" (abbreviation before ZIP) or "South Dakota, USA" (state name suffix).
 * @param {string} address
 * @returns {string|null} Two-letter abbreviation or null
 */
export function parseStateFromAddress(address) {
  const addr = address || '';

  // Pattern 1: two-letter abbreviation before a ZIP code (e.g., "Orem, UT 84057")
  const zipMatch = addr.match(/\b([A-Z]{2})\s+\d{5}\b/);
  if (zipMatch) return zipMatch[1];

  // Pattern 2: full state name before ", USA" at the end
  // Handles both "South Dakota, USA" and "Pierre, South Dakota, USA"
  const suffixMatch = addr.match(/(?:^|,)\s*([^,]+?)\s*,\s*USA\s*$/i);
  if (suffixMatch) {
    const abbrev = STATE_NAME_TO_ABBREV[suffixMatch[1].toLowerCase().trim()];
    if (abbrev) return abbrev;
  }

  return null;
}
