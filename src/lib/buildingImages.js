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
  springfield: { state: 'MA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/springfield.jpg' },
  waltham: { state: 'MA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/waltham.jpg' },
  worcester: { state: 'MA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/worcester.jpg' },
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
//   ME - Portland skyline 2024 | Seasider53 | CC BY 4.0
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
//   OR - Portland from Pittock Mansion | King of Hearts | CC BY-SA 4.0
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
  for (const [key, entry] of Object.entries(CURATED_LOCAL)) {
    if (city.includes(key) && (!abbrev || !entry.state || entry.state === abbrev)) {
      localImage = entry.src;
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
