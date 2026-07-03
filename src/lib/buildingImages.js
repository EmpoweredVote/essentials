/**
 * Building image mapping for Essentials tier sections.
 * Federal: always the real US Capitol photo (Supabase Storage).
 * State: curated wide panoramic banner per state (Supabase Storage); all 50 states
 *   covered. States without a panorama return null — SectionBanner.jsx renders the
 *   graceful tier-gradient fallback.
 * Local: curated banner art for select cities (Supabase Storage); uncurated cities
 *   return null and fall back to the same tier gradient.
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

/** US Census FIPS state code (the 2-digit prefix of a geo_id) → 2-letter abbreviation. */
const STATE_FIPS_TO_ABBREV = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO', '09': 'CT',
  '10': 'DE', '11': 'DC', '12': 'FL', '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL',
  '18': 'IN', '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME', '24': 'MD',
  '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS', '29': 'MO', '30': 'MT', '31': 'NE',
  '32': 'NV', '33': 'NH', '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND',
  '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI', '45': 'SC', '46': 'SD',
  '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV',
  '55': 'WI', '56': 'WY',
};

/**
 * Derive a 2-letter state abbreviation from a Census geo_id's FIPS prefix.
 * Census place/county/SLD geo_ids are FIPS-prefixed (first 2 digits = state FIPS),
 * so the geo_id is authoritative for the state regardless of any URL param — this
 * prevents a stale/contradictory `browse_state` from mislabeling real officials.
 * @param {string} geoId e.g. "0644000" (Los Angeles, CA) → "CA", "06037" → "CA"
 * @returns {string|null} 2-letter abbreviation, or null if not derivable
 */
export function stateAbbrevFromGeoId(geoId) {
  const s = String(geoId || '').trim();
  if (!/^\d{2}/.test(s)) return null;
  return STATE_FIPS_TO_ABBREV[s.slice(0, 2)] || null;
}

/** Reverse map: lowercase full state name → abbreviation (derived from STATE_CAPITOLS) */
const STATE_NAME_TO_ABBREV = Object.fromEntries(
  Object.entries(STATE_CAPITOLS).map(([abbrev, stem]) => [
    stem.replace(/-/g, ' '),  // "new-york" → "new york"
    abbrev,
  ])
);

// US Capitol from the Capitol Reflecting Pool (Wikimedia Commons) —
//   Panorama at the Capitol Reflecting Pool (September 2023) 02 | DiscoA340 | CC BY-SA 4.0
// Leveled 0.6° and cropped to 1700x540 with a thin water strip anchoring the bottom
// (operator-selected 2026-07-03). v2 filename busts the CDN cache on the old path.
const FEDERAL_IMAGE = 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/national/us-capitol-banner-v2.jpg';

// Curated standalone-city banner art (cities/<slug>.jpg in Storage, D-05) +
// LA-county skylines (la_county/building_photos/<geoid>.jpg). Attribution
// (Wikimedia Commons) - title | author | license:
//   bloomington - Kirkwood Ave. in Bloomington, IN | Yahala | CC BY-SA 3.0
//   beaverton - Beaverton Central and The Round, Beaverton, Oregon | M.O. Stevens | CC BY 3.0
//   hillsboro - East end of Orenco Station Plaza with MAX train arriving (2016) | Steve Morgan | CC BY-SA 4.0
//   tigard - Downtown Tigard Oregon | M.O. Stevens (Aboutmovies) | Public Domain
//   tualatin - Tualatin Commons daytime | M.O. Stevens (Aboutmovies) | CC BY-SA 3.0
//   forest grove - Christmas Tree Recycling (Pacific Avenue street view, lower band) | Visitor7 | CC BY-SA 3.0
const CURATED_LOCAL = {
  bloomington: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/bloomington.jpg',
  beaverton: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/beaverton.jpg',
  hillsboro: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/hillsboro.jpg',
  tigard: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/tigard.jpg',
  tualatin: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/tualatin.jpg',
  'forest grove': 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/forest-grove.jpg',
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

// Curated wide panoramic state banners (skyline where iconic, natural landscape
// otherwise), hosted in production storage. All 50 states covered; any state not
// in the set returns null (graceful tier-gradient fallback in SectionBanner.jsx).
// Attribution (all Wikimedia Commons) - title | author | license:
//   AK - Mt. Hayes and the eastern Alaska Range | Paxson Woelber | CC BY 2.0
//   AL - Birmingham, Alabama (2023) | WeaponizingArchitecture | CC BY-SA 4.0
//   AR - Little Rock pano | Daniel Schwen | CC BY-SA 4.0
//   AZ - Downtown Phoenix (skyline + mountains) | DPPed | CC BY-SA 3.0
//   CA - Golden Gate Bridge and San Francisco | Brocken Inaglory | CC BY-SA 4.0
//   CO - Denver Skyline at Blue Hour | Brian Papantonio | CC BY 2.0
//   CT - Hartford Skyline from Great River Park | KyleConstable | CC BY-SA 4.0
//   DE - Wilmington Delaware skyline | Tim Kiser | CC BY-SA 2.5
//   FL - Miami Late Afternoon Skyline | Euthman | CC BY 4.0
//   GA - Midtown Atlanta skyline | Marc Merlin | CC BY-SA 4.0
//   HI - Skyline from Kaka'ako Waterfront Park, Honolulu | The Eloquent Peasant | CC BY-SA 4.0
//   IA - Morning Skyline, Des Moines, Iowa | Tony Webster | CC BY 2.0
//   ID - Boise downtown panorama (foothills, daytime) | SniperProgrammer | CC BY-SA 3.0
//   IL - Chicago from North Avenue Beach | King of Hearts | CC BY-SA 3.0
//   IN - Downtown Indianapolis skyline | Momoneymoproblemz | CC BY-SA 4.0
//   KS - Wichita, Kansas skyline | Quintin Soloviev | CC BY 4.0
//   KY - Panorama de Louisville | Anindya Chakraborty | CC BY-SA 3.0
//   LA - New Orleans Skyline from Uptown | VerruckteDan | CC BY-SA 3.0
//   MA - Boston skyline from Longfellow Bridge | King of Hearts | CC BY-SA 4.0
//   MD - Baltimore, Maryland skyline | Quintin Soloviev | CC BY 4.0
//   ME - Portland skyline 2024 | Seasider53 | CC BY 4.0
//   MI - Detroit Skyline from Windsor | TheWxResearcher | CC0
//   MN - Minneapolis Skyline from Stone Arch Bridge | w_lemay | CC BY-SA 2.0
//   MO - STL Skyline (Gateway Arch) | Buphoff | CC BY-SA 3.0
//   MS - Jackson MS Downtown Panorama | chmeredith | CC BY 2.0
//   MT - Glacier National Park, Montana | TerryDOtt | CC BY 2.0
//   NC - Charlotte Skyline | James Willamor | CC BY-SA 3.0
//   ND - Badlands, Theodore Roosevelt NP | Acroterion | CC BY-SA 4.0
//   NE - Omaha skyline from Lincoln Monument | SounderBruce | CC BY-SA 4.0
//   NH - White Mountain National Forest | Debivort | CC BY-SA 3.0
//   NJ - Newport, Jersey City panorama | King of Hearts | CC BY-SA 4.0
//   NM - Albuquerque & Sandia Mountains | Daniel Schwen | CC BY-SA 4.0
//   NV - Las Vegas Strip (daytime) | Serge Melki | CC BY 2.0
//   NY - Midtown Manhattan from Weehawken | King of Hearts | CC BY-SA 4.0
//   OH - Cincinnati, Ohio Skyline | American Diabetio | CC BY-SA 4.0
//   OK - Oklahoma City Skyline from Bricktown | Soonerfever | Public domain
//   OR - Portland from Pittock Mansion | King of Hearts | CC BY-SA 4.0
//   PA - Pittsburgh skyline panorama | Cbaile19 | CC0
//   RI - Providence, RI skyline | (Providence_RI_skyline) | CC BY-SA 2.0
//   SC - Arthur Ravenel Bridge (from water) | bbatsell | CC BY-SA 2.5
//   SD - Mount Rushmore National Memorial | Nick Amoscato | CC BY 2.0
//   TN - Nashville panorama | Kaldari | Public domain
//   TX - Austin, Texas Skyline 2018 | Sk5893 | CC BY-SA 4.0
//   UT - SLC Skyline 2024 | Invictus323 | CC BY 4.0
//   VA - Richmond Skyline from East Grace Street | Don.s.okeefe | CC BY-SA 3.0
//   VT - Vermont fall foliage panorama | chensiyuan | CC BY-SA 4.0
//   WA - Seattle (Space Needle and Mt. Rainier) | Daniel Schwen | CC BY-SA 4.0
//   WI - Milwaukee panorama (west, day) | Dori | CC BY-SA 3.0 US
//   WV - New River Gorge Bridge | JaGa | CC BY-SA 4.0
//   WY - Teton Range Panorama Spring | GrandTetonNPS | Public domain
const STATE_PANORAMA_BASE =
  'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/states/';
const STATE_PANORAMAS = new Set([
  'AK', 'AL', 'AR', 'AZ', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'IA', 'ID', 'IL', 'IN',
  'KS', 'KY', 'LA', 'MA', 'MD', 'ME', 'MI', 'MN', 'MO', 'MS', 'MT', 'NC', 'ND', 'NE', 'NH',
  'NJ', 'NM', 'NV', 'NY', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VA',
  'VT', 'WA', 'WI', 'WV', 'WY',
]);

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

  // State: curated panoramic banner if available; else null (graceful gradient fallback)
  let stateImage = null;
  const abbrev = (stateAbbrev || '').toUpperCase();
  if (STATE_PANORAMAS.has(abbrev)) {
    stateImage = `${STATE_PANORAMA_BASE}${abbrev}.jpg`;
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
