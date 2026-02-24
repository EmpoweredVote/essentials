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

const FEDERAL_IMAGE = '/images/us-capitol.jpg';

const CURATED_LOCAL = {
  bloomington: '/images/bloomington-city-hall.jpg',
  'los angeles': '/images/la-city-hall.jpg',
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

  // Local: check curated cities, else generic SVG
  let localImage = FALLBACK_LOCAL;
  for (const [key, src] of Object.entries(CURATED_LOCAL)) {
    if (city.includes(key)) {
      localImage = src;
      break;
    }
  }

  // State: look up abbreviation for real capitol photo, else generic SVG
  let stateImage = FALLBACK_STATE;
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
