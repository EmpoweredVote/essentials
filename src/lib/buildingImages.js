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
  'los angeles': 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/la_county/building_photos/0644000-skyline.jpg',
  'long beach': 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/la_county/building_photos/0643000.jpg',
  glendale: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/la_county/building_photos/0630000.jpg',
  pomona: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/la_county/building_photos/0658072.jpg',
  torrance: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/la_county/building_photos/0680000.jpg',
  pasadena: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/la_county/building_photos/0656000.jpg',
  'west covina': 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/la_county/building_photos/0684200.jpg',
  downey: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/la_county/building_photos/0619766.jpg',
  burbank: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/la_county/building_photos/0608954.jpg',
  carson: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/la_county/building_photos/0611530.jpg',
  norwalk: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/la_county/building_photos/0652526.jpg',
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
// Valid 2-letter codes (50 states + DC) — used to validate abbreviation matches
// so we don't pick up street/unit abbreviations that happen to precede digits.
const VALID_STATE_ABBREVS = new Set([...Object.keys(STATE_CAPITOLS), 'DC']);

/**
 * Parse the city name from an address string. The city is the comma-separated
 * segment immediately before the state token (2-letter abbreviation, optionally
 * followed by a ZIP and/or "USA"). Used as a fallback for tier-banner labels and
 * curated-image lookup when politician data has no `representing_city`.
 *
 * "100 W Kirkwood Ave, Bloomington, IN, 47404"      → "Bloomington"
 * "100 W Kirkwood Ave, Bloomington, IN 47404, USA"  → "Bloomington"
 * "Los Angeles, CA"                                 → "Los Angeles"
 * @param {string} address
 * @returns {string|null}
 */
export function parseCityFromAddress(address) {
  const addr = (address || '').trim();
  if (!addr) return null;

  const parts = addr.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length < 2) return null;

  for (let i = 1; i < parts.length; i++) {
    const abbrev = parts[i].match(/^([A-Za-z]{2})\b/);
    if (abbrev && VALID_STATE_ABBREVS.has(abbrev[1].toUpperCase())) {
      const city = parts[i - 1];
      // Guard against returning a street-number segment (cities don't start with a digit).
      if (city && !/^\d/.test(city)) return city;
      return null;
    }
  }

  // "City, Full State Name, USA" form.
  const suffixMatch = addr.match(/(?:^|,)\s*([^,]+?)\s*,\s*([^,]+?)\s*,\s*USA\s*$/i);
  if (suffixMatch && STATE_NAME_TO_ABBREV[suffixMatch[2].toLowerCase().trim()]) {
    return suffixMatch[1].trim();
  }

  return null;
}

export function parseStateFromAddress(address) {
  const addr = (address || '').trim();

  // Pattern 1: two-letter abbreviation before a ZIP, with a comma OR space
  // separator. Handles "Orem, UT 84057", the Census-normalized "Denver, CO,
  // 80202", and Google's "…, CO 80202, USA".
  const zipMatch = addr.match(/\b([A-Z]{2})\b,?\s+\d{5}(?:-\d{4})?\b/);
  if (zipMatch && VALID_STATE_ABBREVS.has(zipMatch[1])) return zipMatch[1];

  // Pattern 2: trailing two-letter abbreviation with no ZIP (e.g. "Denver, CO"
  // or "Denver, CO, USA").
  const trailMatch = addr.match(/,\s*([A-Za-z]{2})\s*(?:,\s*USA)?\s*$/i);
  if (trailMatch && VALID_STATE_ABBREVS.has(trailMatch[1].toUpperCase())) {
    return trailMatch[1].toUpperCase();
  }

  // Pattern 3: full state name before ", USA" at the end
  // Handles both "South Dakota, USA" and "Pierre, South Dakota, USA"
  const suffixMatch = addr.match(/(?:^|,)\s*([^,]+?)\s*,\s*USA\s*$/i);
  if (suffixMatch) {
    const abbrev = STATE_NAME_TO_ABBREV[suffixMatch[1].toLowerCase().trim()];
    if (abbrev) return abbrev;
  }

  return null;
}
