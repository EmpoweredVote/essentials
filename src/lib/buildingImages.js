/**
 * Building image mapping for Essentials tier sections.
 * Curated images for Bloomington IN and Los Angeles CA.
 * Fallback generic images for all other localities.
 */

const CURATED = {
  bloomington: {
    Local: '/images/bloomington-city-hall.svg',
    State: '/images/indiana-state-capitol.svg',
    Federal: '/images/us-capitol.svg',
  },
  'los angeles': {
    Local: '/images/la-city-hall.svg',
    State: '/images/california-state-capitol.svg',
    Federal: '/images/us-capitol.svg',
  },
};

const FALLBACK = {
  Local: '/images/city-hall-generic.svg',
  State: '/images/state-capitol-generic.svg',
  Federal: '/images/us-capitol.svg',
};

/**
 * Get building images for a given locality.
 * @param {string} representingCity - City name from politician data
 * @returns {{ Local: string, State: string, Federal: string }}
 */
export function getBuildingImages(representingCity) {
  const city = (representingCity || '').toLowerCase();
  if (city.includes('bloomington')) return CURATED.bloomington;
  if (city.includes('los angeles')) return CURATED['los angeles'];
  return FALLBACK;
}
