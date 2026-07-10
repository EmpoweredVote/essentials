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
export const STATE_FIPS_TO_ABBREV = {
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
//   sherwood - Railroad St, Sherwood, Oregon | dreid1987 | CC BY 3.0
//   cornelius - Cornelius Civic Center - Oregon.JPG (city hall / public library) | M.O. Stevens | CC BY-SA 3.0
//   [2026-07-05 CA banner audit: 7 LA-county cities moved OFF la_county/building_photos
//    onto cities/<slug>.jpg with fresh licensed Wikimedia sources (operator-certified).
//    Los Angeles + Torrance kept their prior la_county/building_photos shots; Pomona +
//    Carson certified as-is.]
//   long-beach - Long Beach from Queensway Bay | Christophe.Finot | CC BY-SA 2.5
//   glendale - Glendale panorama (from a Griffith Park trail, city + Verdugo Mtns) | KeeganProbably | CC BY 4.0
//   pasadena - Pasadena City Hall (Day) | RBerteig | CC BY 2.0
//   west-covina - West Covina Civic Center | Wikimedia user ASDFGH | CC BY-SA 4.0
//   downey - Oldest operating McDonald's, Downey (Googie arches) | Northwalker | CC0 / Public Domain
//   burbank - Hollywood Burbank Airport & the Verdugo Mountains | Natecation | CC BY-SA 4.0
//   norwalk - Norwalk City Hall | Northwalker | CC0 / Public Domain
//   [2026-07-06 CA batch wave 2: 14 new CA cities added (operator-certified). Banner
//    renders in browse mode off the coverage.js browse_label, so no representing_city
//    dependency. San Diego + the "lower-crop" cities are a second review pass.]
//   san francisco - Downtown skyline from Twin Peaks | Dead.rabbit | CC BY-SA 4.0
//   san jose - Downtown San Jose skyline panorama | XAtsukex | CC BY 3.0
//   sacramento - Tower Bridge & downtown from Old Sacramento | Sydchrismom | CC BY-SA 4.0
//   berkeley - UC Berkeley campus & the Campanile from the hills | 4300streetcar | CC BY 4.0
//   santa monica - Santa Monica Pier & Pacific Wheel after sunset | Erwin Kreijne | CC BY 3.0
//   beverly hills - Rodeo Drive | Jess Hawsor | CC BY-SA 4.0
//   inglewood - SoFi Stadium | Troutfarm27 | CC BY-SA 4.0
//   west hollywood - Pacific Design Center (the 'Blue Whale') | Tony Mariotti | CC BY 2.0
//   lancaster - Antelope Valley California Poppy Reserve | Rennett Stowe | CC BY 2.0
//   hawthorne - SpaceX HQ & Falcon 9 booster | Juan Kulichevsky | CC BY-SA 2.0
//   bellflower - Bellflower City Hall | YonderStone | CC BY-SA 4.0
//   alhambra - San Gabriel Valley streetscape | Sony 1992 | CC0 / Public Domain
//   el monte - El Monte bus station | Oran Viriyincy | CC BY-SA 2.0
//   south gate - Leland R. Weaver Library | ShticktatorTal | CC BY-SA 4.0
//   [2026-07-06 CA batch wave 2b: 6 more certified after a second review pass.]
//   san diego - Downtown skyline across the bay (leveled +1.05deg, brightened) | Mds08011 | CC BY 4.0
//   fremont - Mission Peak over Lake Elizabeth | Oleg Alexandrov | CC BY-SA 3.0
//   culver city - Historic Culver Theater neon 'Culver' marquee | John Margolies / Library of Congress | Public Domain
//   palmdale - Palmdale vista: Lake Palmdale & the Antelope Valley | G-BDXH | CC0 / Public Domain
//   santa clarita - Six Flags Magic Mountain in the valley hills | Konrad Summers | CC BY-SA 2.0
//   whittier - Uptown Whittier, Greenleaf Avenue | Northwalker | CC0 / Public Domain
//   [2026-07-06 CA batch wave 2c: final 3 (thin-coverage suburbs, best licensed real photo).]
//   gardena - Arthur Lee Johnson Memorial Park 'City of Gardena' monument sign | Jengod | CC BY-SA 4.0
//   compton - Martin Luther King Jr. Memorial (city-seal sculpture), Civic Center | Eric Polk | CC BY 3.0
//   el segundo - Old Town Music Hall, Richmond St | Caterpillar84 | CC BY-SA 4.0
//
// WR-03 FIX (181-REVIEW): each entry now carries a `state` alongside `src` so
// getBuildingImages() can require a state match in addition to the substring
// match on `representingCity`. This prevents same-named-city collisions
// across states (e.g. Sherwood, OR vs. Sherwood, AR; Glendale, CA vs.
// Glendale, AZ) from incorrectly rendering the wrong city's banner.
const CURATED_LOCAL = {
  bloomington: { state: 'IN', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/bloomington.jpg' },
  beaverton: { state: 'OR', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/beaverton.jpg' },
  hillsboro: { state: 'OR', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/hillsboro.jpg' },
  tigard: { state: 'OR', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/tigard.jpg' },
  tualatin: { state: 'OR', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/tualatin.jpg' },
  'forest grove': { state: 'OR', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/forest-grove.jpg' },
  sherwood: { state: 'OR', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/sherwood.jpg' },
  cornelius: { state: 'OR', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/cornelius.jpg' },
  // Oregon Wave 2 city banners (2026-07-06, operator-certified). Licensed
  // Wikimedia Commons; state-scoped 'OR'. Keys are lowercase browse_label form;
  // storage files hyphenated. Hillsboro was re-cropped LOWER (same Steve Morgan
  // Orenco Station photo) to show the plaza ground -- storage overwrite only.
  //   gresham      - Historic civic building & veterans-memorial plaza | SkateOregon | CC BY 4.0
  //   wood village - Wood Village City Hall & Civic Center | Another Believer | CC BY-SA 4.0
  //   maywood park - leafy residential street (Tudor cottage & firs) | Tedder | CC BY 3.0
  //   portland     - Portland Japanese Garden, Heavenly Falls | Daderot | CC0 / Public Domain
  //                  (the majestic Mt. Hood / Mirror Lake shot became the OR STATE banner instead)
  //   troutdale    - 'Troutdale / Gateway to the Gorge' Centennial Arch | Another Believer | CC BY-SA 4.0
  //   fairview(OR) - Fairview Lake, autumn | Finetooth | CC BY-SA 3.0 (in the Fairview array below;
  //                  file is cities/fairview-or.jpg so it does not collide with TX Fairview)
  gresham: { state: 'OR', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/gresham.jpg' },
  'wood village': { state: 'OR', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/wood-village.jpg' },
  'maywood park': { state: 'OR', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/maywood-park.jpg' },
  // Portland exists in OR (Japanese Garden) and ME. The ME variant is the
  // Portland skyline that WAS the Maine state banner, moved here when the ME
  // state banner became the Androscoggin riverfront. ME file is portland-me.jpg
  // so it does not collide with OR's cities/portland.jpg.
  portland: [
    { state: 'OR', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/portland.jpg' },
    { state: 'ME', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/portland-me.jpg' },
  ],
  troutdale: { state: 'OR', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/troutdale.jpg' },
  // Maine city banners (2026-07-06, operator-certified). Licensed Wikimedia
  // Commons; state-scoped 'ME'. Portland ME = the ex-state Portland skyline
  // (see the portland array above). The Maine STATE banner is now the
  // Androscoggin riverfront (Auburn), NOT the Portland skyline.
  //   south portland - Bug Light (Portland Breakwater Light), Bug Light Park | Giorgio Galeotti | CC BY-SA 4.0
  //   bangor         - West Market Square Historic District | Warren LeMay | CC BY-SA 2.0
  //   biddeford      - Biddeford Pool harbor | Dcrjsr | CC BY 3.0
  //   lewiston       - Basilica of Saints Peter and Paul (entrance & rose window) | Carol Boldt | CC BY-SA 4.0
  //   auburn         - Androscoggin County Courthouse | Kenneth C. Zirkel | CC BY-SA 4.0
  'south portland': { state: 'ME', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/south-portland.jpg' },
  bangor: { state: 'ME', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/bangor.jpg' },
  biddeford: { state: 'ME', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/biddeford.jpg' },
  lewiston: { state: 'ME', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/lewiston.jpg' },
  auburn: { state: 'ME', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/auburn.jpg' },
  'los angeles': { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/la_county/building_photos/0644000-skyline.jpg' },
  'long beach': { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/long-beach.jpg' },
  glendale: { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/glendale.jpg' },
  pomona: { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/la_county/building_photos/0658072.jpg' },
  torrance: { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/la_county/building_photos/0680000.jpg' },
  pasadena: { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/pasadena.jpg' },
  'west covina': { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/west-covina.jpg' },
  downey: { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/downey.jpg' },
  burbank: { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/burbank.jpg' },
  carson: { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/la_county/building_photos/0611530.jpg' },
  norwalk: { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/norwalk.jpg' },
  'san francisco': { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/san-francisco.jpg' },
  'san jose': { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/san-jose.jpg' },
  sacramento: { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/sacramento.jpg' },
  berkeley: { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/berkeley.jpg' },
  'santa monica': { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/santa-monica.jpg' },
  'beverly hills': { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/beverly-hills.jpg' },
  inglewood: { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/inglewood.jpg' },
  'west hollywood': { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/west-hollywood.jpg' },
  lancaster: { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/lancaster.jpg' },
  hawthorne: { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/hawthorne.jpg' },
  bellflower: { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/bellflower.jpg' },
  alhambra: { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/alhambra.jpg' },
  'el monte': { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/el-monte.jpg' },
  'south gate': { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/south-gate.jpg' },
  'san diego': { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/san-diego.jpg' },
  fremont: { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/fremont.jpg' },
  'culver city': { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/culver-city.jpg' },
  palmdale: { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/palmdale.jpg' },
  'santa clarita': { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/santa-clarita.jpg' },
  whittier: { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/whittier.jpg' },
  gardena: { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/gardena.jpg' },
  compton: { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/compton.jpg' },
  'el segundo': { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/el-segundo.jpg' },
  // Massachusetts city banners (Wikimedia Commons; state-scoped so 'springfield'
  // does not collide with Springfield, MO). Batch 1 shipped 2026-07-06:
  //   quincy      - Marina Bay waterfront & clock tower | Sswonk | CC BY 3.0
  //   somerville  - Union Square, Boston skyline beyond | 4300streetcar | CC BY 4.0
  //   springfield - Downtown skyline across the Connecticut River | Steven Polom | CC BY 2.0
  //   waltham     - Moody Street downtown | Traveler100 | CC BY-SA 3.0
  //   worcester   - Downtown skyline from Union Station | 4300streetcar | CC BY 4.0
  quincy: { state: 'MA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/quincy.jpg' },
  somerville: { state: 'MA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/somerville.jpg' },
  // Springfield exists in MA (downtown skyline) and MO (Gillioz Theatre streetscape,
  // added with the VA/MD/MO batch). Array of state-scoped variants, resolved by
  // getBuildingImages's multi-variant loop. MA file = cities/springfield.jpg;
  // MO file = cities/springfield-mo.jpg (suffix avoids collision).
  springfield: [
    { state: 'MA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/springfield.jpg' },
    { state: 'MO', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/springfield-mo.jpg' },
  ],
  waltham: { state: 'MA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/waltham.jpg' },
  worcester: { state: 'MA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/worcester.jpg' },
  // Massachusetts batch 2 shipped 2026-07-06 (operator round-2 review):
  //   boston      - Financial District skyline from Boston Harbor (distinct from the
  //                 MA state banner's Charles-River skyline) | Beyond My Ken | CC BY-SA 4.0
  //   brockton    - Downtown Main St, Enterprise Bldg + City Hall dome | Tyoung0543 | CC BY-SA 4.0
  //   cambridge   - MIT Great Dome & Killian Court | Yishen Miao | CC BY-SA 3.0
  //   fall-river  - St. Anne's Church & Shrine over Kennedy Park | Leonardo DaSilva | CC BY 3.0
  //   lowell      - Boott Cotton Mills & Eastern Canal | National Park Service | Public Domain
  //   lynn        - Downtown Lynn with Nahant Bay (horizon leveled) | Terageorge | CC BY-SA 4.0
  //   medford     - Medford Square | John Phelan | CC BY 3.0
  //   new-bedford - Whaling District cobblestone street | Infrogmation | CC BY 2.5
  //   newton      - Newton City Hall & War Memorial (leveled) | Kenneth C. Zirkel | CC BY-SA 4.0
  boston: { state: 'MA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/boston.jpg' },
  brockton: { state: 'MA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/brockton.jpg' },
  cambridge: { state: 'MA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/cambridge.jpg' },
  'fall river': { state: 'MA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/fall-river.jpg' },
  lowell: { state: 'MA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/lowell.jpg' },
  lynn: { state: 'MA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/lynn.jpg' },
  medford: { state: 'MA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/medford.jpg' },
  'new bedford': { state: 'MA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/new-bedford.jpg' },
  newton: { state: 'MA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/newton.jpg' },
  // Utah city banners (Wikimedia Commons; state-scoped UT). Wave 1 batch shipped 2026-07-06:
  //   provo       - Downtown Provo with Y Mountain | Farragutful | CC BY-SA 4.0
  //   orem        - Mount Timpanogos over Orem | An Errant Knight | CC BY-SA 4.0
  //   ogden       - Historic 25th Street & Union Station | sirrobot (Flickr) | CC BY 2.0
  //   sandy       - Wasatch Range above Sandy | Scott Catron | CC BY-SA 3.0
  //   west jordan - Gardner Mill, Gardner Village | Tricia Simpson | CC BY-SA 3.0
  //   st. george  - St. George below the red sandstone cliffs | Stan Shebs | CC BY-SA 3.0
  //   lehi        - Lehi valley: Utah Lake + Wasatch | Don Ramey Logan | CC BY 4.0
  provo: { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/provo.jpg' },
  orem: { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/orem.jpg' },
  ogden: { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/ogden.jpg' },
  sandy: { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/sandy.jpg' },
  'west jordan': { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/west-jordan.jpg' },
  'st. george': { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/st-george.jpg' },
  lehi: { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/lehi.jpg' },
  // UT Wave 1 redos shipped 2026-07-06 (operator round-2):
  //   salt lake city  - Utah State Capitol (distinct from UT state banner's SLC skyline) | Pocksuppet1999 | CC BY-SA 3.0
  //   layton          - suburban neighborhood + Wasatch | D. Sharon Pruitt | CC BY 2.0
  //   west valley city- West Valley City Hall | Ben P L | CC BY-SA 2.0
  //   murray          - historic downtown State Street | CountyLemonade | CC BY 3.0
  //   draper          - Draper Temple + Wasatch foothills | Leon7 | CC BY-SA 3.0
  'salt lake city': { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/salt-lake-city.jpg' },
  layton: { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/layton.jpg' },
  'west valley city': { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/west-valley-city.jpg' },
  murray: { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/murray.jpg' },
  draper: { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/draper.jpg' },
  // UT Wave 2 batch (19 smaller cities, operator-certified 2026-07-06). Licensed Wikimedia
  // Commons; thin-coverage towns lean on landmarks/mountain-backdrops. Attribution in review notes.
  alpine: { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/alpine.jpg' },
  bluffdale: { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/bluffdale.jpg' },
  'cedar hills': { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/cedar-hills.jpg' },
  'cottonwood heights': { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/cottonwood-heights.jpg' },
  'eagle mountain': { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/eagle-mountain.jpg' },
  herriman: { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/herriman.jpg' },
  lindon: { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/lindon.jpg' },
  mapleton: { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/mapleton.jpg' },
  midvale: { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/midvale.jpg' },
  millcreek: { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/millcreek.jpg' },
  payson: { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/payson.jpg' },
  'pleasant grove': { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/pleasant-grove.jpg' },
  salem: { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/salem.jpg' },
  santaquin: { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/santaquin.jpg' },
  'saratoga springs': { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/saratoga-springs.jpg' },
  'south jordan': { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/south-jordan.jpg' },
  'south salt lake': { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/south-salt-lake.jpg' },
  taylorsville: { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/taylorsville.jpg' },
  vineyard: { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/vineyard.jpg' },
  // UT Wave 2 redos shipped 2026-07-06 (operator round-2): completes all 36 UT coverage cities.
  //   american fork - Mount Timpanogos Utah Temple (facade) | Rick Willoughby | CC BY 2.0
  //   holladay      - Holladay Village center + Mount Olympus | Derrellwilliams | CC BY-SA 4.0
  //   riverton      - strip with Wasatch behind | An Errant Knight | CC BY-SA 4.0
  //   spanish fork  - street with Wasatch behind | Ken Lund | CC BY-SA 2.0
  //   springville   - Main St below snowy Wasatch | Sbharris | CC BY-SA 3.0
  'american fork': { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/american-fork.jpg' },
  holladay: { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/holladay.jpg' },
  riverton: { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/riverton.jpg' },
  'spanish fork': { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/spanish-fork.jpg' },
  springville: { state: 'UT', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/springville.jpg' },
  // Texas city banners (Wikimedia Commons; state-scoped 'TX' so 'nevada'/'anna'
  // etc. do not collide with same-named cities elsewhere). Collin County + East
  // TX (Longview). Operator-certified 2026-07-06. Keys are space-form to match
  // coverage.js browse_label; storage files are hyphenated.
  //   allen        - Allen Heritage Center (old train depot) | Jphill19 | CC BY-SA 4.0
  //   anna         - 1894 Sherley & Bros Hardware Store ("Beech-Nut" ghost mural) | Ebmrreditor | CC BY-SA 4.0
  //   blue ridge   - Tilton Street downtown storefronts | Michael Barera | CC BY-SA 4.0
  //   celina       - historic downtown square | Nicolas Henderson | CC BY 2.0
  //   fairview     - rural ranch scene, Hart Road ("Keeping it Country") | Fairsaka | Public Domain
  //   farmersville - historic brick Main Street | Michael Barera | CC BY-SA 4.0
  //   frisco       - George A. Purefoy Municipal Center & clock tower | Michael Barera | CC BY-SA 4.0
  //   josephine    - Josephine City Park gazebo | Michael Barera | CC BY-SA 4.0
  //   lavon        - U.S. Post Office | Michael Barera | CC BY-SA 4.0
  //   longview     - Fredonia Street historic downtown | Michael Barera | CC BY-SA 4.0
  //   mckinney     - historic downtown square | Rick Ray | CC BY 2.0
  //   murphy       - Municipal Court & Police building | Flimbone08 | CC BY-SA 4.0
  //   nevada       - Cottonwood Creek Baptist Church | Michael Barera | CC BY-SA 4.0
  //   parker       - Southfork Ranch (the "Dallas" Ewing mansion) | Carol M. Highsmith | Public Domain
  //   plano        - Legacy West / Shops at Legacy plaza | Mohidshahab | CC BY-SA 4.0
  //   princeton    - "PRINCETON" municipal water tower | Pinecar | CC0
  //   prosper      - historic grain-elevator townscape | Colby Nate | CC BY 2.0
  //   richardson   - UT Dallas Engineering & Computer Science Complex | Stan9999 | Public Domain
  //   van alstyne  - historic Main Street & water tower | Renelibrary | CC BY-SA 3.0
  //   weston       - Weston City Hall (oldest town in Collin County) | City0fWeston | CC BY-SA 4.0
  // Coverage gaps (no licensed Commons photo -> tier-gradient fallback, operator-accepted):
  // Melissa, Saint Paul, Lowry Crossing, Lucas.
  allen: { state: 'TX', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/allen.jpg' },
  anna: { state: 'TX', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/anna.jpg' },
  'blue ridge': { state: 'TX', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/blue-ridge.jpg' },
  celina: { state: 'TX', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/celina.jpg' },
  // Fairview exists in both TX (Collin County) and OR (Multnomah County); this
  // entry is an ARRAY of state-scoped variants resolved by getBuildingImages's
  // multi-variant loop. TX file = cities/fairview.jpg; OR file = cities/fairview-or.jpg.
  fairview: [
    { state: 'TX', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/fairview.jpg' },
    { state: 'OR', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/fairview-or.jpg' },
  ],
  farmersville: { state: 'TX', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/farmersville.jpg' },
  frisco: { state: 'TX', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/frisco.jpg' },
  josephine: { state: 'TX', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/josephine.jpg' },
  lavon: { state: 'TX', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/lavon.jpg' },
  longview: { state: 'TX', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/longview.jpg' },
  mckinney: { state: 'TX', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/mckinney.jpg' },
  murphy: { state: 'TX', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/murphy.jpg' },
  nevada: { state: 'TX', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/nevada.jpg' },
  parker: { state: 'TX', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/parker.jpg' },
  plano: { state: 'TX', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/plano.jpg' },
  princeton: { state: 'TX', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/princeton.jpg' },
  prosper: { state: 'TX', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/prosper.jpg' },
  richardson: { state: 'TX', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/richardson.jpg' },
  'van alstyne': { state: 'TX', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/van-alstyne.jpg' },
  weston: { state: 'TX', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/weston.jpg' },
  // Nevada city banners (Wikimedia Commons; state-scoped 'NV'). Operator-certified
  // 2026-07-06. Keys are space-form to match coverage.js browse_label; storage
  // files are hyphenated. Note: the NV STATE banner is the Las Vegas Strip, so the
  // Las Vegas CITY banner is deliberately the Welcome sign instead (distinct vantage).
  //   las vegas       - 'Welcome to Fabulous Las Vegas' sign (Betty Willis), Las Vegas Blvd | Christian David | CC BY-SA 4.0
  //   henderson       - Lake Las Vegas South Shore (villas, lake, desert mountains) | Coolcaesar | CC BY-SA 4.0
  //   north las vegas - Aliante Nature Discovery Park (pond, pavilion, geese) | Kim Dung Ho | CC BY 2.0
  //   boulder city    - Hoover Dam from the overlook (the public-works landmark that defines the town) | Karlis Dambrans | CC BY 2.0
  'las vegas': { state: 'NV', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/las-vegas.jpg' },
  henderson: { state: 'NV', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/henderson.jpg' },
  'north las vegas': { state: 'NV', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/north-las-vegas.jpg' },
  'boulder city': { state: 'NV', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/boulder-city.jpg' },
  // Virginia + Maryland + Missouri city banners (FINAL batch, operator-certified
  // 2026-07-06). Licensed Wikimedia Commons; state-scoped. Keys are space-form to
  // match coverage.js browse_label; storage files hyphenated. Springfield MO is in
  // the springfield array above (state 'MO'), NOT here, to share that key with MA.
  //   alexandria    - Old Town King St historic storefronts | DiscoA340 | CC BY-SA 4.0
  //   falls church  - 'The Falls Church' (the 1769 namesake Episcopal church) | Southerngs | CC BY-SA 3.0
  //   leonardtown   - St. Mary's County Courthouse (county seat) + Maryland flag | Dougtone | CC BY-SA 2.0
  alexandria: { state: 'VA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/alexandria.jpg' },
  'falls church': { state: 'VA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/falls-church.jpg' },
  leonardtown: { state: 'MD', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/leonardtown.jpg' },
  // Arizona COUNTY banner (first county-tier CURATED_LOCAL key). Reads as Pima
  // County the place (Santa Catalina Mountains + Sonoran-desert saguaro foreground),
  // deliberately distinct from the future Tucson CITY banner (Phase 194, a downtown
  // streetscape) and the AZ STATE banner (the Phoenix skyline). Key is space-form to
  // match coverage.js browse_label 'Pima County'; storage file is hyphenated.
  //   pima county   - Santa Catalina Mountains from West Saguaro National Park near Tucson | WClarke | CC BY-SA 4.0
  'pima county': { state: 'AZ', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/pima-county.jpg' },
  // Arizona CITY banner (Phase 194). Downtown Tucson skyline viewed from Sentinel
  // Peak (the downtown high-rise cluster with the Santa Catalina Mountains behind),
  // horizon leveled and cropped to show the base of the downtown buildings — reads as
  // Tucson the CITY, deliberately distinct from the Pima COUNTY landscape banner
  // (Catalinas + saguaro) and the AZ STATE banner (the Phoenix skyline). Single-variant
  // key (no same-named-city collision in the covered set); storage file cities/tucson.jpg.
  //   tucson        - View of Tucson from Sentinel Peak (leveled) | John Diebolt | Public domain
  tucson: { state: 'AZ', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/tucson.jpg' },
};

// Curated wide panoramic state banners (skyline where iconic, natural landscape
// otherwise), hosted in production storage. All 50 states covered; any state not
// in the set returns null (graceful tier-gradient fallback in SectionBanner.jsx).
// Attribution (all Wikimedia Commons) - title | author | license:
// [2026-07-05 refresh: 15 banners updated per operator review. 10 new sources
//  (CO/HI/ID/LA/NC/ND/NH/NV/OH/WV) + 5 same-photo brightness lifts
//  (CT/IL/KY/VA/WA, marked [brightened]). Storage serves Cache-Control:no-cache,
//  so overwriting states/<ABBR>.jpg refreshes for all visitors on next load.]
//   AK - Mt. Hayes and the eastern Alaska Range | Paxson Woelber | CC BY 2.0
//   AL - Birmingham, Alabama (2023) | WeaponizingArchitecture | CC BY-SA 4.0
//   AR - Little Rock pano | Daniel Schwen | CC BY-SA 4.0
//   AZ - Downtown Phoenix (skyline + mountains) | DPPed | CC BY-SA 3.0
//   CA - Golden Gate Bridge and San Francisco | Brocken Inaglory | CC BY-SA 4.0
//   CO - Denver skyline with Rocky Mountains (clear daytime) | Quintin Soloviev | CC BY 4.0
//   CT - Hartford Skyline from Great River Park | KyleConstable | CC BY-SA 4.0 [brightened]
//   DE - Wilmington Delaware skyline | Tim Kiser | CC BY-SA 2.5
//   FL - Miami Late Afternoon Skyline | Euthman | CC BY 4.0
//   GA - Midtown Atlanta skyline | Marc Merlin | CC BY-SA 4.0
//   HI - Waikiki view from Diamond Head | Cristo Vlahos | CC BY-SA 3.0
//   IA - Morning Skyline, Des Moines, Iowa | Tony Webster | CC BY 2.0
//   ID - Downtown Boise from Camel's Back Park | Tamanoeconomico | CC BY-SA 4.0
//   IL - Chicago from North Avenue Beach | King of Hearts | CC BY-SA 3.0 [brightened]
//   IN - Downtown Indianapolis skyline | Momoneymoproblemz | CC BY-SA 4.0
//   KS - Wichita, Kansas skyline | Quintin Soloviev | CC BY 4.0
//   KY - Panorama de Louisville | Anindya Chakraborty | CC BY-SA 3.0 [brightened]
//   LA - New Orleans CBD from across the Mississippi | Michael Maples (USACE) | Public domain
//   MA - Boston skyline from Longfellow Bridge | King of Hearts | CC BY-SA 4.0
//   MD - Baltimore, Maryland skyline | Quintin Soloviev | CC BY 4.0
//   ME - Great Falls / Androscoggin River at Festival Plaza Park, Auburn | Kristen Wheatley | CC BY 2.0
//        [2026-07-06: replaced the Portland skyline per operator; that skyline moved to the Portland CITY banner (cities/portland-me.jpg)]
//   MI - Detroit Skyline from Windsor | TheWxResearcher | CC0
//   MN - Minneapolis Skyline from Stone Arch Bridge | w_lemay | CC BY-SA 2.0
//   MO - STL Skyline (Gateway Arch) | Buphoff | CC BY-SA 3.0
//   MS - Jackson MS Downtown Panorama | chmeredith | CC BY 2.0
//   MT - Glacier National Park, Montana | TerryDOtt | CC BY 2.0
//   NC - Charlotte uptown skyline (daytime) | Bruce Emmerling | CC BY-SA 4.0
//   ND - Painted Canyon overlook, Theodore Roosevelt NP | Acroterion | CC BY-SA 4.0
//   NE - Omaha skyline from Lincoln Monument | SounderBruce | CC BY-SA 4.0
//   NH - Mount Washington (summer) | YubYub41 | CC BY-SA 3.0
//   NJ - Newport, Jersey City panorama | King of Hearts | CC BY-SA 4.0
//   NM - Albuquerque & Sandia Mountains | Daniel Schwen | CC BY-SA 4.0
//   NV - Las Vegas Strip, Bellagio to Paris (daytime) | Paul Harrison | CC BY-SA 4.0
//   NY - Midtown Manhattan from Weehawken | King of Hearts | CC BY-SA 4.0
//   OH - Cincinnati skyline from Devou Park | Ynsalh | CC BY-SA 4.0
//   OK - Oklahoma City Skyline from Bricktown | Soonerfever | Public domain
//   OR - Mount Hood over the forest (Mirror Lake), majestic Mt. Hood | Oregon's Mt. Hood Territory | Public Domain
//        [2026-07-06: replaced the prior Portland-from-Pittock-Mansion skyline per operator -- state banner is now the mountain, Portland CITY banner is the Japanese Garden]
//   PA - Pittsburgh skyline panorama | Cbaile19 | CC0
//   RI - Providence, RI skyline | (Providence_RI_skyline) | CC BY-SA 2.0
//   SC - Arthur Ravenel Bridge (from water) | bbatsell | CC BY-SA 2.5
//   SD - Mount Rushmore National Memorial | Nick Amoscato | CC BY 2.0
//   TN - Nashville panorama | Kaldari | Public domain
//   TX - Austin, Texas Skyline 2018 | Sk5893 | CC BY-SA 4.0
//   UT - SLC Skyline 2024 | Invictus323 | CC BY 4.0
//   VA - Richmond Skyline from East Grace Street | Don.s.okeefe | CC BY-SA 3.0 [brightened]
//   VT - Vermont fall foliage panorama | chensiyuan | CC BY-SA 4.0
//   WA - Seattle (Space Needle and Mt. Rainier) | Daniel Schwen | CC BY-SA 4.0 [brightened]
//   WI - Milwaukee panorama (west, day) | Dori | CC BY-SA 3.0 US
//   WV - New River Gorge Bridge from overlook | Gabor Eszes (UED77) | CC BY-SA 3.0
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
  const abbrev = (stateAbbrev || '').toUpperCase();

  // Local: check curated cities, scoped by state to avoid same-named-city
  // collisions across states (WR-03 FIX, 181-REVIEW — e.g. Sherwood, OR vs.
  // Sherwood, AR; Glendale, CA vs. Glendale, AZ). A missing/unknown caller
  // state is treated as match-allowed so existing callers that don't pass
  // stateAbbrev keep working unchanged.
  let localImage = null;
  // Match the LONGEST key first so a more specific city name wins over one that
  // is a substring of it (e.g. "south portland" must beat "portland"). Otherwise
  // resolution order follows key length descending; ties keep insertion order.
  const curatedEntries = Object.entries(CURATED_LOCAL).sort(
    (a, b) => b[0].length - a[0].length
  );
  for (const [key, entry] of curatedEntries) {
    if (!city.includes(key)) continue;
    // An entry is either a single {state, src} or an ARRAY of state-scoped
    // variants for a city name that recurs across states (e.g. Fairview OR vs
    // Fairview TX). Pick the variant whose state matches the caller's; a
    // missing/unknown caller state or entry state is treated as match-allowed.
    const variants = Array.isArray(entry) ? entry : [entry];
    const match = variants.find((v) => !abbrev || !v.state || v.state === abbrev);
    if (match) {
      localImage = match.src;
      break;
    }
  }

  // State: curated panoramic banner if available; else null (graceful gradient fallback)
  let stateImage = null;
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
