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
//
// ⚠ PUBLISHING SURFACE: Treasury Tracker transcribes these attribution comments
// into user-visible per-image credit lines on its site (see TT's
// ESSENTIALS-TEAM-NOTE-banner-attribution-2026-07-29). Treat every
// "title | author | license" line as public copy: a wrong author here is a
// wrong author displayed publicly, and swapping a banner's SOURCE IMAGE
// without updating this block (and telling TT) leaves the old photographer
// credited. Verify the author on the Commons File: page, not by filename —
// near-identical filenames can belong to different photographers (the RI
// comma-twin, fixed in bb2b05ba, is the canonical example).
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
  // Bend, OR — RE-CROPPED 2026-07-27. Same photograph, re-cut lower.
  //   bend - Mirror Pond from The Emblem Club (Deschutes at Drake Park) | Spencer Dahl
  //          | CC BY-SA 3.0. Full-width 4510x1433 window of the 4510x2995 original,
  //          band-centred on original row 1950, downscaled 2.65x. Shows the Drake Park
  //          footbridge, the white-columned house, and the pond.
  //
  // ⚠ WHY IT CHANGED — READ BEFORE RE-CROPPING ANY BANNER. The previous crop centred the
  // Three Sisters in the upper third. That was framed against the 1700x540 FILE, but the
  // file is not what renders: SectionBanner used a fixed-height box (h-<120px>,
  // md:h-<180px>) at full width, so object-fit:cover kept only the middle ~44% of the
  // height on desktop — source rows 152-388 of 540. The peaks sat in rows 0-110 and were
  // cut entirely, leaving a wall of trees. The old comment's claim that the peaks land
  // "clear of the render-time gradient" was measuring the wrong frame.
  //
  // The original is 1.506:1, so a 3.148:1 crop keeps 1433 of its 2995 rows. Under the old
  // fixed-height box the visible band covered only 626 of those rows, and the peaks
  // (~699-1060) and pond (~1669-2263) sit ~1300px apart — they could not both be shown, so
  // this crop chose the pond.
  //
  // ⚠ THAT CONSTRAINT IS GONE. SectionBanner became an aspect-ratio box later the same day
  // (see BANNER_ASPECT), so the full 3.148:1 frame is visible and a centre crop would now
  // show the Three Sisters AND the pond together. bend-v2 is a workaround for a bug that no
  // longer exists; re-cropping centred on the original is now a live option, and the
  // pre-existing centre crop is archived at
  // cities/_archive/bend-mirrorpond-centrecrop-pre20260727.jpg. Kept as-is because the pond
  // framing was the operator's explicit choice — revisit, don't assume.
  //
  // Filename is versioned (-v2) deliberately: overwriting cities/bend.jpg in place left a
  // stale copy on the edge cache — the plain URL still served the old 346KB file while a
  // cache-busted request returned the new one. docs/shared-banner-assets.md claims the CDN
  // purges on overwrite; it did not here. Version the filename rather than trusting that.
  // Previous file archived at cities/_archive/bend-mirrorpond-centrecrop-pre20260727.jpg.
  bend: { state: 'OR', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/bend-v2.jpg' },
  // Madison, WI (2026-07-27). First Wisconsin city banner — WI's only local coverage had
  // been Racine County, and Madison was falling through to the tier-gradient placeholder.
  // State-scoped 'WI' because Madison is a city name in several states.
  //   madison - Downtown skyline across Lake Monona, State Capitol dome centred | John
  //             Benson | CC BY 2.5. Full-width window of the 2408x932 original at vertical
  //             anchor .45, downscaled 1.42x. Chosen over a sharper CC0 aerial of the
  //             isthmus because the aerial's subject is the isthmus SHAPE, which the
  //             middle-44% desktop crop removes; this skyline sits inside the band.
  madison: { state: 'WI', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/madison.jpg' },
  // Racine County WI cluster (2026-07-28), sourced when the 17 Racine-cluster
  // municipalities joined the landing page. All state-scoped 'WI'. The 'town of X'
  // keys ride the longest-key-first match so the civil towns beat their
  // city/village namesakes ("town of burlington" > "burlington"). No licensed
  // Commons photo exists for North Bay, Elmwood Park, or Raymond (checked
  // 2026-07-28) — those three intentionally fall through to the tier gradient.
  //   racine             - Monument Square, downtown Racine | Jeremy Atherton | CC BY-SA 2.5 (anchor .85)
  //   burlington-wi      - Downtown Historic District, WIS 36 | Royalbroil | CC BY-SA 3.0 (anchor 1.0)
  //   caledonia          - John Collins House (Greek Revival, NRHP) | Jim Roberts (Boscophotos) | CC BY-SA 4.0
  //   mount-pleasant     - Mount Pleasant Village Hall | Alinghi3 | CC BY-SA 3.0/GFDL (anchor .35)
  //   rochester-wi       - Village of Rochester Village Hall | Librerink8 | CC BY-SA 4.0 (anchor .15)
  //   sturtevant         - Western Union Junction Railroad Museum caboose | Znns | CC0
  //   union-grove        - Downtown Union Grove, US 45 | TheCatalyst31 | CC BY-SA 4.0 (anchor .7, brightened g.65/b1.12)
  //   waterford-wi       - Downtown Waterford Main St | TCP04 | CC BY 4.0 (anchor .7)
  //   wind-point         - Wind Point Lighthouse at Sunrise panorama | Tunads (Daniel J Simanek) | CC BY 3.0
  //   yorkville          - Yorkville #4 School (NRHP) | Porterhse | CC BY-SA 3.0
  //   town-of-burlington - Burlington Town Hall complex | Wikideas1 | CC0 (anchor 1.0)
  //   town-of-dover      - Dover Town Hall | Wikideas1 | CC0 (anchor .25)
  //   town-of-norway     - Town of Norway Municipal Building | Wikideas1 | CC0
  //   town-of-waterford  - Town of Waterford Municipal Building | Wikideas1 | CC0
  racine: { state: 'WI', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/racine.jpg' },
  burlington: { state: 'WI', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/burlington-wi.jpg' },
  caledonia: { state: 'WI', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/caledonia.jpg' },
  'mount pleasant': { state: 'WI', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/mount-pleasant.jpg' },
  rochester: { state: 'WI', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/rochester-wi.jpg' },
  sturtevant: { state: 'WI', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/sturtevant.jpg' },
  'union grove': { state: 'WI', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/union-grove.jpg' },
  waterford: { state: 'WI', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/waterford-wi.jpg' },
  'wind point': { state: 'WI', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/wind-point.jpg' },
  yorkville: { state: 'WI', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/yorkville.jpg' },
  'town of burlington': { state: 'WI', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/town-of-burlington.jpg' },
  // Dover/Norway chips read plain (no namesake conflict) so their banner keys
  // are plain too; storage paths keep the town-of- filenames.
  dover: { state: 'WI', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/town-of-dover.jpg' },
  norway: { state: 'WI', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/town-of-norway.jpg' },
  'town of waterford': { state: 'WI', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/town-of-waterford.jpg' },
  // Wisconsin COUNTY banner (2026-07-29 Dane County seed; third county-tier
  // CURATED_LOCAL key after Pima + Riverside). Reads as Dane County the place —
  // the Driftless Area along the Ice Age National Scenic Trail near Berry
  // (western Dane County), deliberately NOT the Capitol/Lake Monona skyline that
  // is Madison the city's banner. Key is 'dane county' to match coverage.js
  // browse_label 'Dane County'; storage file is hyphenated.
  //   dane county - Driftless Area banner, Ice Age Trail near Berry | Corey Coyle | CC BY 3.0
  'dane county': { state: 'WI', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/dane-county.jpg' },
  // Colorado Springs + El Paso County (2026-08-21, operator-certified). Licensed
  // Wikimedia Commons; state-scoped 'CO'. Both certified in the 6:1 DESKTOP band
  // (rows 128-411 of 540), not on the full frame.
  //
  // Neither is a skyline, deliberately. The Colorado STATE banner is the Denver
  // skyline backed by snowcapped Front Range peaks, and a Colorado Springs
  // downtown shot renders as that same composition one tier down the same page.
  // The strongest such candidate (Downtown Colorado Springs by David Shankbone,
  // CC BY-SA 3.0) was rejected on that adjacency alone, not on quality.
  //
  // El Paso County reads as the COUNTY the place — the Calhan Paint Mines, a
  // county-owned park on unincorporated ground out east — deliberately not the
  // red rock that is Colorado Springs the city's banner. Same split as Dane
  // County vs Madison above. Key matches the backend browse_label 'El Paso
  // County'; the storage file carries a -co suffix because El Paso County also
  // exists in Texas and would otherwise collide on the shared cities/ path.
  //   colorado springs - Garden of the Gods partial pano (Cheyenne Mountain at right) | WolfmanSF | CC BY-SA 4.0
  //   el paso county   - Calhan Paint Mines Archeological District, Pillars on the Rim | MElizabethTill | CC BY-SA 4.0
  'colorado springs': { state: 'CO', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/colorado-springs.jpg' },
  'el paso county': { state: 'CO', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/el-paso-county-co.jpg' },
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
  // Tarrant County city banners (2026-08-08 Tarrant seed). Wikimedia Commons,
  // ground-level daytime views per the standing no-aerial/no-AI banner rule.
  // State-scoped 'TX' matters more than usual here: Arlington, VA is a covered
  // jurisdiction (see the VA block above), so an unscoped 'arlington' key would
  // serve the Texas photo there the moment VA gets a banner.
  // Keys are space-form to match coverage.js browse_label; storage files are hyphenated.
  //   arlington    - City Center plaza (operator pick over the Globe Life Park frame) | Michael Barera | CC BY-SA 4.0
  //   fort worth   - Downtown Fort Worth Skyline, Trinity Park across the river | DerekAyala27 | CC BY 4.0
  //   grapevine    - historic Main Street, "Great Taste of Grapevine" banner | diego_bf109 | CC BY-SA 2.0
  //   mansfield    - historic Main Street storefronts (Flowers Etc./Casa del Sol) | Renelibrary | CC BY-SA 4.0
  //   north richland hills - TEXRail Trinity Metro station platform | DerekAyala27 | CC BY 4.0
  // Coverage gap (operator-accepted 2026-08-08): Euless. Commons has only a
  // 1046x683 welcome sign, a high school and a Michaels storefront -- nothing
  // on-subject clears the 1700px minimum, so Euless takes the tier gradient.
  arlington: { state: 'TX', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/arlington.jpg' },
  'fort worth': { state: 'TX', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/fort-worth.jpg' },
  grapevine: { state: 'TX', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/grapevine.jpg' },
  mansfield: { state: 'TX', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/mansfield.jpg' },
  'north richland hills': { state: 'TX', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/north-richland-hills.jpg' },
  // Austin (2026-08-18 Austin/Travis deep seed, migrations 1827-1831).
  //
  // ⚠ THE STATE BANNER MOVED FOR THIS. states/TX.jpg WAS this exact skyline photograph, so
  // Austin-the-capital and Texas-the-state were one subject. Rather than give Austin a
  // substitute view of itself, the state banner became the Chisos Mountains and this frame came
  // DOWN a tier — the same resolution WA used for Seattle, ME for Portland, OR for Mount Hood.
  // cities/austin.jpg is therefore BYTE-IDENTICAL to the pre-2026-08-18 states/TX.jpg
  // (sha256 62cba3d5..., 1700x540); this entry IS the archive, so no _archive copy was needed.
  //   austin - Austin, Texas Skyline 2018, downtown from Lady Bird Lake | Sk5893 | CC BY-SA 4.0
  //
  // The other way to resolve this collision is Nevada's: keep the state banner and give the
  // city a deliberately different vantage (NV state is the Las Vegas Strip, so the Las Vegas
  // city banner is the Welcome sign). That was offered and declined here — Austin's skyline
  // over Lady Bird Lake is the certified frame, and the alternatives that did NOT collide were
  // materially weaker in the 6:1 band.
  //
  // Migration 1831 backfilled representing_city='Austin'/representing_state='TX' onto the 11
  // city offices so this key resolves on its PRIMARY path. Before that it would still have
  // resolved for a typed address via the parse-the-address fallback in Results.jsx, but not
  // from the data — and never in ZIP mode, which returns null by design.
  // 🔴 Travis County's 12 offices deliberately keep representing_city = NULL (as Tarrant, King,
  // Collin and Dane do): a county-level representing_city would hijack the CITY banner for
  // every address in the county.
  austin: { state: 'TX', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/austin.jpg' },
  // Travis County reads as the COUNTY, not as Austin: Hamilton Pool Preserve, the collapsed
  // grotto on the west side of the county. Deliberately not the skyline, which now sits one
  // tier down at cities/austin.jpg — the same separation King County keeps from Seattle
  // (Snoqualmie Falls) and Dane from Madison (the Driftless).
  //   travis county - Hamilton Pool Preserve | Fredlyfish4 | CC BY-SA 4.0
  // 7986x2502 source, centred crop (wider than 3.148:1), 7877px retained against a 1700 target.
  //
  // ⚠ The frame contains beachgoers. Operator-reviewed and accepted 2026-08-18: at the shipped
  // 1700x540 they are 10-20px silhouettes with no facial detail — a distant crowd at a public
  // swimming hole, not identifiable individuals. This is NOT the same call as the Barton Springs
  // and Barton Creek frames rejected the same day, where subjects filled the FOREGROUND at close
  // range. The distinction is distance and scale, not the presence of people.
  //
  // ⚠ HOW THIS KEY REACHES THE SCREEN, because it is not obvious. County offices carry
  // representing_city = NULL by design (a county-level value would hijack the CITY banner for
  // every address in the county), so this resolves ONLY via browse_label. That label comes from
  // the BACKEND: /api/essentials/location-search?q=Travis returns
  // "Travis County, TX · County" with has_local_data true. Verified against production.
  // 🔴 It does NOT come from COVERAGE_COUNTIES in coverage.js — that array has no importers, so
  // Rollup drops it entirely. Entries there are source documentation only.
  //   Test it by LABEL, not by geo_id: grepping a built bundle for "Travis County",
  //   "King County" and "Kitsap County" returns 0 each. The geo_id proxy quoted elsewhere in
  //   these files is unreliable — 48453 appears 4 times in a built bundle from unrelated
  //   population/FIPS data, which would read as "the entry shipped" when it did not.
  'travis county': { state: 'TX', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/travis-county.jpg' },
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
  // California COUNTY banner (Phase 201, second county-tier CURATED_LOCAL key). Reads
  // as Riverside County the place — the historic Mission Inn facade in downtown
  // Riverside (the county seat civic landmark), deliberately distinct from the future
  // Palm Springs (Phase 202) and Indio (Phase 203) CITY banners in the same Coachella
  // Valley track. Key is space-form to match coverage.js browse_label 'Riverside
  // County'; storage file is hyphenated.
  //   riverside county - Mission Inn Hotel in Riverside, California | Maliagould | CC BY-SA 4.0
  'riverside county': { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/riverside-county.jpg' },
  // Coachella Valley / Riverside County CITY banners (surface on address search via
  // representingCity; no coverage chip). Longest-key-first matching keeps 'riverside county'
  // (county browse) distinct from 'riverside' (city address). All CA, state-scoped.
  //   riverside     - Fox Theater, Riverside, California | John Margolies | Public domain
  'riverside': { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/riverside.jpg' },
  //   temecula      - Old Town Temecula | John Ward (jdubphoto.com) | CC BY-SA 3.0
  'temecula': { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/temecula.jpg' },
  //   palm springs  - Palm Springs Palm Canyon Dr | R. Haupt (Renhau) | CC BY-SA 3.0
  'palm springs': { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/palm-springs.jpg' },
  //   indio         - "Welcome to Indio" sign on the palm-lined city boulevard | Northwalker | CC0
  'indio': { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/indio.jpg' },
  // Arizona CITY banner (Phase 194; banner image refreshed post-UAT). The historic
  // Hotel Congress corner on Congress Street in downtown Tucson (rooftop "HOTEL
  // CONGRESS 100" sign, Mission-Revival brick facade, streetcar wires) — a real,
  // level, ground-level street scene of the downtown historic district, reads as
  // Tucson the CITY, deliberately distinct from the Pima COUNTY landscape banner
  // (Catalinas + saguaro) and the AZ STATE banner (the Phoenix skyline). Single-variant
  // key (no same-named-city collision in the covered set); storage file cities/tucson.jpg.
  //   tucson        - Tucson May 2019 28 (Hotel Congress) | Michael Barera | CC BY-SA 4.0
  tucson: { state: 'AZ', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/tucson.jpg' },
  // Oro Valley community banner (Phase 195). The Cañada del Oro (CDO) Riverfront Park
  // pedestrian trail bridge — a distinctive rust-colored arched truss over the wash,
  // deliberately distinct from the Pima COUNTY Catalina/Pusch-Ridge landscape banner,
  // the Tucson CITY downtown streetscape, and the AZ STATE Phoenix skyline (its
  // mountains sit small in the far background; the bridge is the subject). Single-variant
  // key (no same-named-city collision); storage file cities/oro-valley.jpg (hyphenated),
  // coverage.js label is space-form 'Oro Valley'.
  //   oro valley    - Oro Valley CDO Trail Bridge | Djmaschek | CC BY-SA 3.0
  'oro valley': { state: 'AZ', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/oro-valley.jpg' },
  // Marana community banner (Phase 196). Hole #3 at The Golf Club at Dove Mountain
  // (Saguaro) — a real, ground-level Sonoran-desert golf scene (green fairway, water
  // hazard, saguaros) with the LOW distant Tortolita/Tucson ranges on the horizon.
  // Deliberately by the Tortolita range, NOT the Catalinas — so it does not collide
  // with the Pima COUNTY Catalina/Pusch-Ridge landscape banner, the Oro Valley CDO
  // Trail Bridge, the Tucson CITY downtown streetscape, or the AZ STATE Phoenix skyline.
  // Single-variant single-word key (no same-named-city collision); storage cities/marana.jpg.
  //   marana        - The Golf Club at Dove Mountain (Saguaro) no 3 | Bernard Gagnon | CC BY-SA 3.0
  marana: { state: 'AZ', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/marana.jpg' },
  // Sahuarita community banner (Phase 197). Sahuarita Lake (Rancho Sahuarita) in the
  // foreground with the Santa Rita Mountains (Mount Wrightson, due south) on the horizon —
  // a real, ground-level Santa-Cruz-Valley lakeshore scene. Deliberately the Santa Ritas
  // (SOUTH), NOT the Catalinas — so it does not collide with the Pima COUNTY Catalina/
  // Pusch-Ridge landscape banner or the Oro Valley CDO Trail Bridge; also distinct from the
  // Marana Tortolita/Dove-Mountain shot, the Tucson CITY downtown streetscape, and the AZ
  // STATE Phoenix skyline. Southern/Santa-Cruz-Valley identity (D-03 — no Catalinas, no
  // Tortolita). Single-variant single-word key (no same-named-city collision); storage
  // cities/sahuarita.jpg.
  //   sahuarita     - View from the northern edge of Sahuarita Lake (winter 2007) | Brian Basgen | CC BY-SA 3.0
  sahuarita: { state: 'AZ', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/sahuarita.jpg' },
  // South Tucson community banner (Phase 198). The South Tucson Municipal Complex / City Hall
  // — the arched "Administration" civic building with the blue "SOUTH TUCSON MUNICIPAL COMPLEX
  // 1601" monument sign and city seal — a real, ground-level CIVIC/URBAN streetscape (the sign
  // + seal make the jurisdiction unambiguous). This is the milestone's ONE non-landscape banner
  // (D-04): deliberately people/street/civic, NOT landscape. It avoids the Pima COUNTY
  // Catalinas, the Oro Valley CDO Trail Bridge, the Marana Tortolita/Dove-Mountain shot, the
  // Tucson CITY downtown/Hotel-Congress streetscape, the Sahuarita Lake/Santa-Ritas, and the
  // AZ STATE Phoenix skyline. (Operator-selected 2026-07-17 over a Star Motel roadside-signage
  // alt, for unambiguous civic identity.) QUOTED key (contains a space — mirrors the
  // 'oro valley' style, NOT the unquoted single-word marana:/sahuarita: style); single-variant
  // (no same-named-city collision); storage cities/south-tucson.jpg.
  //   south tucson  - South Tucson City Hall / Municipal Complex (Southtucson1.JPG) | Rgper22008 (Wikimedia Commons) | Public Domain
  'south tucson': { state: 'AZ', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/south-tucson.jpg' },
  // Washington: Seattle + King County (2026-08-14 Seattle deep seed, Task 9).
  // Operator-certified from a side-by-side artifact review at both shipped crop
  // ratios. State-scoped 'WA'; keys are space-form; storage files hyphenated.
  //
  // ⚠ THE STATE BANNER MOVED FOR THIS. states/WA.jpg WAS this exact Kerry Park
  // photograph, so Seattle-the-city and Washington-the-state were one subject.
  // Rather than give the state's largest city a side street, the state banner
  // became Hurricane Ridge and the Seattle shot came DOWN a tier — the same
  // resolution Maine used for its Portland skyline and Oregon for Mount Hood.
  // cities/seattle.jpg is therefore BYTE-IDENTICAL to the pre-2026-08-14
  // states/WA.jpg (sha256 8170493..., 1700x462, already brightened), which is
  // also why no _archive copy was needed: this entry IS the archive.
  //   seattle     - Seattle skyline from Kerry Park, Space Needle and Mt. Rainier | Daniel Schwen | CC BY-SA 4.0 [brightened]
  //
  // King County reads as the county, not as Seattle: Snoqualmie Falls from the
  // public overlook, anchor 0.45, then brightened (gamma 0.82, brightness 1.14,
  // contrast 1.06, color 1.08) because the whole Commons category is overcast.
  // The falls are a VERTICAL subject and crop badly to 3.15:1 — tighter windows
  // read as generic whitewater, so this frame keeps Salish Lodge for scale.
  // ⚠ Rejected on its own caption: 'Snoqualmie Falls August 18' is the prettiest
  // file in the category and its photographer describes it as "Wildfire Season
  // 2021. After three days on intense smoke" — that pink alpenglow is smoke.
  //   king county - Snoqualmie Falls from the public overlook | Kpsudeep | CC BY-SA 4.0 [brightened]
  //
  // ⚠ King County's 14 offices all carry representing_city = NULL (same as Dane,
  // Pima and Riverside), so this key resolves ONLY through browse_label in browse
  // mode — it needs the coverage.js 'King County' entry to have a path to screen.
  // Seattle's 11 offices DO carry representing_city = 'Seattle', so the city key
  // also resolves in address mode without the Beaverton-style backfill.
  seattle: { state: 'WA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/seattle.jpg' },
  'king county': { state: 'WA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/king-county.jpg' },

  // Washington, second pass: Bainbridge Island + Kitsap County (2026-08-17, the
  // Bainbridge finish-up — EV-Accounts mig 1820). Operator-certified from a
  // side-by-side artifact that rendered every candidate in the REAL SectionBanner
  // at BOTH shipped ratios, so each was judged on its rendered slice rather than
  // its full frame. State-scoped 'WA'; keys space-form, storage files hyphenated.
  //
  // Both frames were chosen because their subject is a HORIZONTAL BAND and so
  // survives the 6/1 desktop crop, which keeps only the middle 52.5%. That is the
  // exact property Bend lacked when it shipped broken.
  //   bainbridge island - Eagle Harbor and the Seattle ferry at the Bainbridge terminal | Ecoscapes | CC BY-SA 4.0
  //   kitsap county     - The Manette Bridge from the Bremerton waterfront | Joe Mabel | CC BY-SA 4.0
  //
  // ⚠ Rejected, and worth recording because it is the cheapest lesson here: the
  // best-composed frame of the eight reviewed was Poulsbo at night across Liberty
  // Bay (Jonathan Miske, CC BY-SA 2.0) — a flawless horizontal band of town lights
  // and reflections. It lost twice over: no other banner in this registry is a
  // night shot, and one small waterfront town cannot stand in for a county that is
  // mostly Bremerton, Silverdale and Port Orchard.
  //
  // ⚠ These two keys reach the screen by DIFFERENT routes, and only one of them
  // works from an address. Bainbridge Island's 7 council offices carry
  // representing_city = 'Bainbridge Island', so that key resolves in address mode.
  // Kitsap County's 9 offices carry representing_city = NULL (same as King, Dane,
  // Pima and Riverside), so 'kitsap county' resolves ONLY through browse_label —
  // it depends on the coverage.js 'Kitsap County' entry, which already exists.
  // A Bainbridge address therefore shows the ferry, never the bridge.
  //
  // ⚠ Key is the full phrase 'bainbridge island', not 'bainbridge'. The lookup is
  // a substring test over the caller's city, and Bainbridge is also a town in GA,
  // OH, NY and PA; the state scope catches those, but the longer key is the guard
  // that does not depend on the caller passing a state at all.
  'bainbridge island': { state: 'WA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/bainbridge-island.jpg' },
  'kitsap county': { state: 'WA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/kitsap-county.jpg' },
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
//   RI - Providence, RI skyline | boliyou | CC BY-SA 2.0
//        [2026-07-29: author corrected — this line recorded the Commons FILENAME
//         where the author belongs. Beware the comma: "Providence, RI skyline.jpg"
//         (boliyou, CC BY-SA 2.0, river level, summer) is ours;
//         "Providence RI skyline.jpg" (Quintin Soloviev, CC BY 4.0, aerial, winter)
//         is a different photo -- and Soloviev shot our CO/KS/MD banners, so the
//         wrong answer looks like the obvious one. Confirmed by matching states/RI.jpg
//         against both: mean abs diff/channel 6.63 vs boliyou, 45.38 vs Soloviev.]
//   SC - Arthur Ravenel Bridge (from water) | bbatsell | CC BY-SA 2.5
//   SD - Mount Rushmore National Memorial | Nick Amoscato | CC BY 2.0
//   TN - Nashville panorama | Kaldari | Public domain
//   TX - Chisos Mountains, Big Bend National Park | Tlshands | CC BY-SA 3.0
//        [2026-08-18: replaced the prior Austin, Texas Skyline 2018 (Sk5893, CC BY-SA 4.0) per
//         operator — the state banner was a photograph of Austin, so Texas and its capital
//         shared one subject. That skyline moved DOWN to cities/austin.jpg byte-for-byte
//         (see the Austin block in CURATED_LOCAL), the same resolution WA used for Seattle,
//         ME for Portland and OR for Mount Hood. Anchor n/a: the 16618x3456 source is wider
//         than 3.148:1, so the crop is horizontal and centred. Chosen from an artifact
//         rendering all eight candidates at BOTH shipped ratios; the deciding test was the
//         6:1 desktop band, where Guadalupe empties into pale sky exactly where the title and
//         stat row sit, and both Enchanted Rock frames read as undifferentiated granite.
//         Palo Duro was the runner-up and was passed over on subject collision, not quality:
//         ND already carries Painted Canyon at Theodore Roosevelt NP, the same visual family
//         of layered eroded badlands.
//         🔴 SERVED FROM states/TX-v2.jpg VIA STATE_PANORAMA_FILES, not states/TX.jpg — the
//         in-place overwrite was measured serving stale bytes on the plain URL. See the map.]
//   UT - SLC Skyline 2024 | Invictus323 | CC BY 4.0
//   VA - Richmond Skyline from East Grace Street | Don.s.okeefe | CC BY-SA 3.0 [brightened]
//   VT - Vermont fall foliage panorama | chensiyuan | CC BY-SA 4.0
//   WA - Hurricane Ridge, Olympic National Park | Iamsridhar | CC BY-SA 3.0
//        [2026-08-14: replaced the prior Kerry Park Seattle skyline per operator — the state
//         banner was a photograph of Seattle, so Washington and its largest city shared one
//         subject. That Kerry Park frame moved DOWN to cities/seattle.jpg byte-for-byte
//         (see the Washington block in CURATED_LOCAL), mirroring what ME did with Portland
//         and OR with Mount Hood. Anchor 0.68 from a 9195x2326 source; verified in the 6:1
//         desktop band, where all three Mount Rainier alternatives failed — Reflection Lake
//         cannot hold both the peak and its reflection at 6:1, and Rainier-filling-the-frame
//         clips the summit with no ground beneath it.]
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
 * States whose panorama file is VERSIONED instead of the default `<ABBREV>.jpg`.
 *
 * 🔴 WHY THIS MAP HAS TO EXIST. Replacing a state banner means overwriting the same object
 * path, and overwriting in place does NOT reliably invalidate the Supabase CDN. Measured on
 * 2026-08-18 while swapping Texas: seconds after the upload, the sha256 of
 * `states/TX.jpg` fetched WITHOUT a cache-buster was still the OLD Austin skyline, while the
 * same URL with `?v=` returned the new Chisos frame. SectionBanner requests the plain URL, so
 * users would have kept seeing the old picture for an unknown period.
 *
 * The rest of the file already versions filenames for exactly this reason — `FEDERAL_IMAGE`
 * is `us-capitol-banner-v2.jpg` and Bend is `bend-v2.jpg` — but the state path had no way to
 * express it, because the URL was built as `${abbrev}.jpg`. This map is that way.
 *
 * ⚠ Washington was swapped on 2026-08-14 by overwriting `states/WA.jpg`, and it serves the
 * new Hurricane Ridge frame today. That is not evidence overwriting works — only that the
 * cache eventually expires. Any future state replacement should get a versioned entry here
 * rather than repeat the overwrite and hope.
 */
const STATE_PANORAMA_FILES = {
  TX: 'TX-v2.jpg',
};

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
    stateImage = `${STATE_PANORAMA_BASE}${STATE_PANORAMA_FILES[abbrev] || `${abbrev}.jpg`}`;
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
