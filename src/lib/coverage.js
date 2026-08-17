// Alpha Community coverage — the single source of truth for which areas Essentials
// has ingested. Consumed by the landing page (the browse list) and by the locality
// search fallback (resolving a city/state query to a covered browse target).
//
// hasContext: true = city has compass stances seeded (rendered as a purple chip).

export const COVERAGE_STATES = [
  {
    name: 'California', abbrev: 'CA',
    areas: [
      // hasContext restored true 2026-08-06: migration 1564 had flipped this false after retiring all
      // 19 of Alhambra's rows (every one cited a fabricated sgvtribune.com path or a 404 agendas index).
      // Migration 1567 re-researched the council from the city's own AgendaCenter minutes and restored
      // 16 rows across all five councilmembers, so the coverage claim is true again. Homelessness
      // Response is deliberately still blank for Lee, Wang and Maza — no position statement exists.
      { label: 'Alhambra', browseGovernmentList: ['0600884'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Bellflower', browseGovernmentList: ['0604982'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Berkeley', browseGovernmentList: ['0606000'], browseStateAbbrev: 'CA', hasContext: true },
      // hasContext flipped false 2026-08-02: migration 1538 retired all 5 of Beverly Hills'
      // stanced officials (Mirisch, Friedman, Nazarian, Corman, Wells). Every one of their rows
      // cited only URLs that never existed, so there was no evidence a reader could check. The
      // city keeps its browse entry; it has no compass coverage to claim until re-research.
      { label: 'Beverly Hills', browseGovernmentList: ['0606308'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Burbank', browseGovernmentList: ['0608954'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Carson', browseGovernmentList: ['0611530'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Compton', browseGovernmentList: ['0615044'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Culver City', browseGovernmentList: ['0617568'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Downey', browseGovernmentList: ['0619766'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'El Monte', browseGovernmentList: ['0622230'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'El Segundo', browseGovernmentList: ['0622412'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Fremont', browseGovernmentList: ['0626000'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Gardena', browseGovernmentList: ['0628168'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Glendale', browseGovernmentList: ['0630000'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Hawthorne', browseGovernmentList: ['0632548'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Indio', browseGovernmentList: ['0636448'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Inglewood', browseGovernmentList: ['0636546'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Lancaster', browseGovernmentList: ['0640130'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Long Beach', browseGovernmentList: ['0643000'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Los Angeles', browseGovernmentList: ['0644000'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Norwalk', browseGovernmentList: ['0652526'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Palm Springs', browseGovernmentList: ['0655254'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Palmdale', browseGovernmentList: ['0655156'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Pasadena', browseGovernmentList: ['0656000'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Pomona', browseGovernmentList: ['0658072'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Sacramento', browseGovernmentList: ['0664000'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'San Diego', browseGovernmentList: ['0666000'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'San Francisco', browseGovernmentList: ['0667000'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'San Jose', browseGovernmentList: ['0668000'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Santa Clarita', browseGovernmentList: ['0669088'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Santa Monica', browseGovernmentList: ['0670000'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'South Gate', browseGovernmentList: ['0673080'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Torrance', browseGovernmentList: ['0680000'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'West Covina', browseGovernmentList: ['0684200'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'West Hollywood', browseGovernmentList: ['0684410'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Whittier', browseGovernmentList: ['0685292'], browseStateAbbrev: 'CA', hasContext: true },
    ],
  },
  {
    name: 'Indiana', abbrev: 'IN',
    areas: [
      { label: 'Bloomington', address: '100 W Kirkwood Ave, Bloomington, IN 47404', hasContext: true },
    ],
  },
  {
    name: 'Maine', abbrev: 'ME',
    areas: [
      { label: 'Auburn',        browseGovernmentList: ['2302060'], browseStateAbbrev: 'ME' },
      { label: 'Bangor',        browseGovernmentList: ['2302795'], browseStateAbbrev: 'ME' },
      { label: 'Biddeford',     browseGovernmentList: ['2304860'], browseStateAbbrev: 'ME' },
      { label: 'Lewiston',      browseGovernmentList: ['2338740'], browseStateAbbrev: 'ME' },
      { label: 'Portland',      browseGovernmentList: ['2360545'], browseStateAbbrev: 'ME' },
      { label: 'South Portland',browseGovernmentList: ['2371990'], browseStateAbbrev: 'ME' },
    ],
  },
  {
    name: 'Maryland', abbrev: 'MD',
    areas: [
      { label: 'Leonardtown',      browseGovernmentList: ['2446475'], browseStateAbbrev: 'MD' },
    ],
  },
  {
    name: 'Massachusetts', abbrev: 'MA',
    areas: [
      { label: 'Boston',      browseGovernmentList: ['2507000'], browseStateAbbrev: 'MA', hasContext: true },
      { label: 'Brockton',    browseGovernmentList: ['2509000'], browseStateAbbrev: 'MA', hasContext: true },
      { label: 'Cambridge',   browseGovernmentList: ['2511000'], browseStateAbbrev: 'MA', hasContext: true },
      { label: 'Fall River',  browseGovernmentList: ['2523000'], browseStateAbbrev: 'MA', hasContext: true },
      // hasContext flipped false 2026-08-05: Lowell now holds ZERO stance answers. Migration 1562
      // (ev-accounts) retired all 17 remaining rows across 9 of its 12 seated officials, including the
      // mayor, because every one cited lowellsun.com articles that never existed — the host is the real
      // Lowell Sun and is live, but all 15 cited paths 404 and none was ever archived, while sibling
      // articles from the same months are densely captured. The 14 rows that also cited
      // lowellma.gov/council or /mayor lost their only other source to the landing-page ruling.
      { label: 'Lowell',      browseGovernmentList: ['2537000'], browseStateAbbrev: 'MA', hasContext: false },
      { label: 'Lynn',        browseGovernmentList: ['2537490'], browseStateAbbrev: 'MA', hasContext: false },
      { label: 'Medford',     browseGovernmentList: ['2539835'], browseStateAbbrev: 'MA', hasContext: true },
      { label: 'New Bedford', browseGovernmentList: ['2545000'], browseStateAbbrev: 'MA', hasContext: true },
      // hasContext flipped false 2026-08-04, operator ruling "landing pages don't count as
      // coverage". Migration 1548 (ev-accounts) retired 48 of Newton's 55 answers; the 7 that
      // survived are not evidence: Laredo's 3 cite only `newtonma.gov/government/mayor`, a landing
      // page that states no position, and Baker's 4 cite only his Suffolk Law faculty profile while
      // asserting council votes — reasoning from profession, not from a record. Newton keeps its
      // browse entry; it has nothing to claim until re-research.
      { label: 'Newton',      browseGovernmentList: ['2545560'], browseStateAbbrev: 'MA', hasContext: false },
      { label: 'Quincy',      browseGovernmentList: ['2555745'], browseStateAbbrev: 'MA', hasContext: true },
      { label: 'Somerville',  browseGovernmentList: ['2562535'], browseStateAbbrev: 'MA', hasContext: true },
      { label: 'Springfield', browseGovernmentList: ['2567000'], browseStateAbbrev: 'MA', hasContext: true },
      { label: 'Waltham',     browseGovernmentList: ['2572600'], browseStateAbbrev: 'MA', hasContext: false },
      { label: 'Worcester',   browseGovernmentList: ['2582000'], browseStateAbbrev: 'MA', hasContext: true },
    ],
  },
  {
    name: 'Missouri', abbrev: 'MO',
    areas: [
      { label: 'Springfield', browseGovernmentList: ['2970000', '2928860'], browseStateAbbrev: 'MO', hasContext: true },
    ],
  },
  {
    name: 'Oregon', abbrev: 'OR',
    areas: [
      { label: 'Beaverton',    browseGovernmentList: ['4105350'], browseStateAbbrev: 'OR', hasContext: true },
      // Bend (2026-07-24 deep seed) — first Central Oregon city; the rest of this block is
      // Portland west/east metro. browseGovernmentList = [place FIPS, Bend-La Pine SD GEOID];
      // Bend Metro Park & Recreation District (synthetic geo_id 'bend-or-park-rec-district',
      // mtfcc X0024) is NOT listed because browse geo-pair resolution only walks TIGER MTFCCs —
      // its 5 directors still surface from an in-district address via the coordinate feed.
      // hasContext:true is DB-honest: Mayor Kebler carries evidence-only compass stances.
      // Deschutes County lives in COVERAGE_COUNTIES (unrelated array) — do NOT add it here.
      { label: 'Bend',         browseGovernmentList: ['4105800', '4101980'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Cornelius',    browseGovernmentList: ['4115550'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Fairview',     browseGovernmentList: ['4124250'], browseStateAbbrev: 'OR' },
      { label: 'Forest Grove', browseGovernmentList: ['4126200'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Gresham',      browseGovernmentList: ['4131250'], browseStateAbbrev: 'OR' },
      { label: 'Hillsboro',    browseGovernmentList: ['4134100'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Maywood Park', browseGovernmentList: ['4146730'], browseStateAbbrev: 'OR' },
      // hasContext restored true 2026-08-07. It was flipped false on 08-04 under the operator ruling
      // "landing pages don't count as coverage", after migration 1558 retired 57 rows sole-sourced to
      // fabricated Willamette Week articles and the 15 survivors turned out to rest on
      // `portland.gov/council/agenda` and `/mayor` (landing pages stating no position) or on
      // oregonlive URLs with zero Wayback captures.
      //
      // Migrations 1608-1614 (ev-accounts) rebuilt the cluster on portland.gov's PER-MEMBER ROLL-CALL
      // RECORDS (`/council/districts/<n>/<name>/votes`), which give each councillor's individual
      // Yea/Nay/Absent per council document, plus per-member topical pages and — for the mayor, who
      // votes only to break ties — his published agenda. All 12 now hold 3-9 answers each (56 rows,
      // 117 citations, every one portland.gov). Zero cite the two banned landing pages, oregonlive, or
      // willametteweek, so the coverage claim is true again on the standard that flipped it off.
      //
      // 13 topics are deliberately still blank (mig 1614): Criminalization for the 7 councillors
      // seated after the camping ordinance passed, School Vouchers for 2 (Portland has no K-12
      // jurisdiction), Rent for 2 and Homelessness for 2 — all verified unsourceable, not unresearched.
      { label: 'Portland',     browseGovernmentList: ['4159000'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Sherwood',     browseGovernmentList: ['4167100'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Tigard',       browseGovernmentList: ['4173650'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Troutdale',    browseGovernmentList: ['4174850'], browseStateAbbrev: 'OR' },
      { label: 'Tualatin',     browseGovernmentList: ['4174950'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Wood Village', browseGovernmentList: ['4183950'], browseStateAbbrev: 'OR' },
    ],
  },
  {
    name: 'Texas', abbrev: 'TX',
    areas: [
      { label: 'Allen',         browseGovernmentList: ['4801924'], browseStateAbbrev: 'TX', hasContext: true },
      { label: 'Anna',          browseGovernmentList: ['4803300'], browseStateAbbrev: 'TX', hasContext: true },
      // Tarrant County big-six (2026-08-08 seed, migs 1621-1628). This is a SECOND, unconnected
      // TX cluster — every other TX entry here is Collin County area (plus Longview). None of the
      // six carries hasContext: the seed was roster + geofence + browse only, with no compass
      // stances, so claiming context would not be DB-honest.
      { label: 'Arlington',     browseGovernmentList: ['4804000'], browseStateAbbrev: 'TX' },
      { label: 'Blue Ridge',    browseGovernmentList: ['4808872'], browseStateAbbrev: 'TX' },
      { label: 'Celina',        browseGovernmentList: ['4813684'], browseStateAbbrev: 'TX', hasContext: true },
      // Euless: 4 of its 7 seats are seeded VACANT-by-design (Mayor, Places 2/4/5) — see mig 1628.
      { label: 'Euless',        browseGovernmentList: ['4824768'], browseStateAbbrev: 'TX' },
      // Phase 222 (2026-07-30/31): each of these four moved 0 -> >=1 evidence-cited compass
      // stance, so hasContext is DB-honest. Fairview: Works (residential-zoning).
      // Farmersville: Henry (residential-zoning). Lucas: Underhill + Orr. Parker: Sharpe.
      { label: 'Fairview',      browseGovernmentList: ['4825224'], browseStateAbbrev: 'TX', hasContext: true },
      { label: 'Farmersville',  browseGovernmentList: ['4825488'], browseStateAbbrev: 'TX', hasContext: true },
      // Fort Worth: districts run 2-11 (there is no District 1) + Mayor = 11 seats.
      { label: 'Fort Worth',    browseGovernmentList: ['4827000'], browseStateAbbrev: 'TX' },
      { label: 'Frisco',        browseGovernmentList: ['4827684'], browseStateAbbrev: 'TX', hasContext: true },
      { label: 'Grapevine',     browseGovernmentList: ['4830644'], browseStateAbbrev: 'TX' },
      { label: 'Josephine',     browseGovernmentList: ['4838068'], browseStateAbbrev: 'TX' },
      { label: 'Lavon',         browseGovernmentList: ['4841800'], browseStateAbbrev: 'TX' },
      { label: 'Longview',      browseGovernmentList: ['4843888'], browseStateAbbrev: 'TX', hasContext: true },
      { label: 'Lowry Crossing',browseGovernmentList: ['4844308'], browseStateAbbrev: 'TX' },
      { label: 'Lucas',         browseGovernmentList: ['4845012'], browseStateAbbrev: 'TX', hasContext: true },
      { label: 'Mansfield',     browseGovernmentList: ['4846452'], browseStateAbbrev: 'TX' },
      { label: 'McKinney',      browseGovernmentList: ['4845744'], browseStateAbbrev: 'TX', hasContext: true },
      { label: 'Melissa',       browseGovernmentList: ['4847496'], browseStateAbbrev: 'TX', hasContext: true },
      { label: 'Murphy',        browseGovernmentList: ['4850100'], browseStateAbbrev: 'TX', hasContext: true },
      { label: 'Nevada',        browseGovernmentList: ['4850760'], browseStateAbbrev: 'TX' },
      { label: 'North Richland Hills', browseGovernmentList: ['4852356'], browseStateAbbrev: 'TX' },
      { label: 'Parker',        browseGovernmentList: ['4855152'], browseStateAbbrev: 'TX', hasContext: true },
      { label: 'Plano',         browseGovernmentList: ['4858016'], browseStateAbbrev: 'TX', hasContext: true },
      { label: 'Princeton',     browseGovernmentList: ['4859576'], browseStateAbbrev: 'TX', hasContext: true },
      { label: 'Prosper',       browseGovernmentList: ['4859696'], browseStateAbbrev: 'TX', hasContext: true },
      { label: 'Richardson',    browseGovernmentList: ['4861796'], browseStateAbbrev: 'TX', hasContext: true },
      { label: 'Saint Paul',    browseGovernmentList: ['4864220'], browseStateAbbrev: 'TX' },
      { label: 'Van Alstyne',   browseGovernmentList: ['4874924'], browseStateAbbrev: 'TX' },
      { label: 'Weston',        browseGovernmentList: ['4877740'], browseStateAbbrev: 'TX' },
    ],
  },
  {
    name: 'Utah', abbrev: 'UT',
    areas: [
      { label: 'Alpine', browseGovernmentList: ['4900540'], browseStateAbbrev: 'UT' },
      { label: 'American Fork', browseGovernmentList: ['4901310'], browseStateAbbrev: 'UT' },
      { label: 'Bluffdale', browseGovernmentList: ['4906810'], browseStateAbbrev: 'UT' },
      { label: 'Cedar Hills', browseGovernmentList: ['4911440'], browseStateAbbrev: 'UT' },
      { label: 'Cottonwood Heights', browseGovernmentList: ['4916270'], browseStateAbbrev: 'UT' },
      { label: 'Draper', browseGovernmentList: ['4920120'], browseStateAbbrev: 'UT' },
      { label: 'Eagle Mountain', browseGovernmentList: ['4920810'], browseStateAbbrev: 'UT' },
      { label: 'Herriman', browseGovernmentList: ['4934970'], browseStateAbbrev: 'UT' },
      { label: 'Holladay', browseGovernmentList: ['4936070'], browseStateAbbrev: 'UT' },
      { label: 'Layton', browseGovernmentList: ['4943660'], browseStateAbbrev: 'UT', hasContext: true },
      { label: 'Lehi', browseGovernmentList: ['4944320'], browseStateAbbrev: 'UT', hasContext: true },
      { label: 'Lindon', browseGovernmentList: ['4945090'], browseStateAbbrev: 'UT' },
      { label: 'Mapleton', browseGovernmentList: ['4947950'], browseStateAbbrev: 'UT' },
      { label: 'Midvale', browseGovernmentList: ['4949710'], browseStateAbbrev: 'UT' },
      { label: 'Millcreek', browseGovernmentList: ['4950150'], browseStateAbbrev: 'UT' },
      { label: 'Murray', browseGovernmentList: ['4953230'], browseStateAbbrev: 'UT' },
      { label: 'Ogden', browseGovernmentList: ['4955980'], browseStateAbbrev: 'UT', hasContext: true },
      { label: 'Orem', browseGovernmentList: ['4957300'], browseStateAbbrev: 'UT', hasContext: true },
      { label: 'Payson', browseGovernmentList: ['4958730'], browseStateAbbrev: 'UT' },
      { label: 'Pleasant Grove', browseGovernmentList: ['4960930'], browseStateAbbrev: 'UT' },
      { label: 'Provo', browseGovernmentList: ['4962470'], browseStateAbbrev: 'UT', hasContext: true },
      { label: 'Riverton', browseGovernmentList: ['4964340'], browseStateAbbrev: 'UT' },
      { label: 'Salem', browseGovernmentList: ['4965770'], browseStateAbbrev: 'UT' },
      { label: 'Salt Lake City', browseGovernmentList: ['4967000'], browseStateAbbrev: 'UT', hasContext: true },
      { label: 'Sandy', browseGovernmentList: ['4967440'], browseStateAbbrev: 'UT', hasContext: true },
      { label: 'Santaquin', browseGovernmentList: ['4967770'], browseStateAbbrev: 'UT' },
      { label: 'Saratoga Springs', browseGovernmentList: ['4967825'], browseStateAbbrev: 'UT' },
      { label: 'South Jordan', browseGovernmentList: ['4970850'], browseStateAbbrev: 'UT' },
      { label: 'South Salt Lake', browseGovernmentList: ['4971070'], browseStateAbbrev: 'UT' },
      { label: 'Spanish Fork', browseGovernmentList: ['4971290'], browseStateAbbrev: 'UT' },
      { label: 'Springville', browseGovernmentList: ['4972280'], browseStateAbbrev: 'UT' },
      { label: 'St. George', browseGovernmentList: ['4965330'], browseStateAbbrev: 'UT', hasContext: true },
      { label: 'Taylorsville', browseGovernmentList: ['4975360'], browseStateAbbrev: 'UT' },
      { label: 'Vineyard', browseGovernmentList: ['4980420'], browseStateAbbrev: 'UT' },
      { label: 'West Jordan', browseGovernmentList: ['4982950'], browseStateAbbrev: 'UT', hasContext: true },
      { label: 'West Valley City', browseGovernmentList: ['4983470'], browseStateAbbrev: 'UT', hasContext: true },
    ],
  },
  {
    name: 'Virginia', abbrev: 'VA',
    areas: [
      { label: 'Alexandria', browseGovernmentList: ['5101000', '51510'], browseStateAbbrev: 'VA', hasContext: true },
      { label: 'Falls Church', browseGovernmentList: ['5127200', '51610'], browseStateAbbrev: 'VA', hasContext: true },
    ],
  },
  {
    name: 'Nevada', abbrev: 'NV',
    areas: [
      { label: 'Las Vegas', browseGovernmentList: ['3240000'], browseStateAbbrev: 'NV', hasContext: true },
      { label: 'Henderson', browseGovernmentList: ['3231900'], browseStateAbbrev: 'NV', hasContext: true },
      { label: 'North Las Vegas', browseGovernmentList: ['3251800'], browseStateAbbrev: 'NV', hasContext: true },
      { label: 'Boulder City', browseGovernmentList: ['3206500'], browseStateAbbrev: 'NV', hasContext: true },
    ],
  },
  {
    // First Arizona CITY entry (Phase 194). Pima County lives in COVERAGE_COUNTIES
    // (unrelated array) — do NOT add cities there. hasContext:true is DB-honest:
    // Plan 04 seeded evidence-only compass stances for the 7 Tucson officials.
    name: 'Arizona', abbrev: 'AZ',
    areas: [
      { label: 'Tucson', browseGovernmentList: ['0477000'], browseStateAbbrev: 'AZ', hasContext: true },
      // Oro Valley (Phase 195). Appended to the EXISTING Arizona block (not a second
      // block). hasContext:true is DB-honest — Plan 03 seeded evidence-only compass
      // stances for the 7 Oro Valley officials. Pima County stays in COVERAGE_COUNTIES.
      { label: 'Oro Valley', browseGovernmentList: ['0451600'], browseStateAbbrev: 'AZ', hasContext: true },
      // Marana (Phase 196). Appended to the EXISTING Arizona block (not a second block);
      // Plan 03 seeded 21 evidence-only compass stances across the 7 Marana officials, so
      // hasContext:true is honest. Pima County stays in COVERAGE_COUNTIES (untouched).
      { label: 'Marana', browseGovernmentList: ['0444270'], browseStateAbbrev: 'AZ', hasContext: true },
      // Sahuarita (Phase 197). Appended to the EXISTING Arizona block (not a second block);
      // Plan 03 seeded 14 evidence-only compass stances across the 7 Sahuarita officials, so
      // hasContext:true is honest. Pima County stays in COVERAGE_COUNTIES (untouched).
      { label: 'Sahuarita', browseGovernmentList: ['0462140'], browseStateAbbrev: 'AZ', hasContext: true },
      // South Tucson (Phase 198). Appended to the EXISTING Arizona block (not a second block);
      // Plan 03 seeded 14 evidence-only compass stances across the 7 South Tucson officials, so
      // hasContext:true is honest. South Tucson is a full enclave (donut hole) inside Tucson —
      // the geofence (geo_id 0468850) routes an in-limits address to South Tucson exclusively,
      // NOT Tucson. Pima County stays in COVERAGE_COUNTIES (untouched); this is NOT a county entry.
      { label: 'South Tucson', browseGovernmentList: ['0468850'], browseStateAbbrev: 'AZ', hasContext: true },
    ],
  },
  {
    // First Wisconsin block (2026-07-28): the Racine County cluster — 2 cities,
    // 11 villages, 4 towns, all fully seeded. The "Town of X" labels (operator
    // preference: no parentheticals) disambiguate WI civil towns from their
    // city/village namesakes (Town of Burlington ≠ City of Burlington; Town of
    // Waterford ≠ Village of Waterford); Dover and Norway keep the prefix for
    // consistency. Towns use 10-digit county-subdivision geo_ids, not 7-digit
    // place FIPS — fine here because by-government-list matches
    // governments.geo_id directly (no TIGER MTFCC walk).
    // hasContext is DB-honest per the 2026-07-29 stance push (126 evidence-only
    // answers across 55 officials): every muni EXCEPT North Bay and Elmwood
    // Park has at least one official with compass stances — those two yielded
    // zero evidence rows and stay unflagged.
    // Racine County itself lives in COVERAGE_COUNTIES (unrelated array).
    name: 'Wisconsin', abbrev: 'WI',
    areas: [
      { label: 'Burlington',         browseGovernmentList: ['5511200'], browseStateAbbrev: 'WI', hasContext: true },
      { label: 'Caledonia',          browseGovernmentList: ['5511950'], browseStateAbbrev: 'WI', hasContext: true },
      { label: 'Elmwood Park',       browseGovernmentList: ['5523725'], browseStateAbbrev: 'WI' },
      // Madison (2026-07-29): the 2026-07-27 session created all 21 officials
      // (Mayor + 20 alders, headshots included) and the banner, but the
      // governments/chambers wiring was never finished, so browse couldn't see
      // them. Repaired in-DB (government 5548000 + Mayor/Common Council
      // chambers + office links). hasContext is DB-honest: the 2026-07-29
      // Madison stance push landed 92 evidence-only answers across ALL 21
      // officials (apply-madison-stances.ts).
      { label: 'Madison',            browseGovernmentList: ['5548000'], browseStateAbbrev: 'WI', hasContext: true },
      { label: 'Mount Pleasant',     browseGovernmentList: ['5554875'], browseStateAbbrev: 'WI', hasContext: true },
      { label: 'North Bay',          browseGovernmentList: ['5557700'], browseStateAbbrev: 'WI' },
      { label: 'Racine',             browseGovernmentList: ['5566000'], browseStateAbbrev: 'WI', hasContext: true },
      { label: 'Raymond',            browseGovernmentList: ['5566350'], browseStateAbbrev: 'WI', hasContext: true },
      { label: 'Rochester',          browseGovernmentList: ['5568550'], browseStateAbbrev: 'WI', hasContext: true },
      { label: 'Sturtevant',         browseGovernmentList: ['5577925'], browseStateAbbrev: 'WI', hasContext: true },
      // WI civil towns. Dover and Norway have no city/village namesake so they
      // read plain; Burlington and Waterford keep the "Town of" prefix because
      // the City of Burlington and Village of Waterford are SEPARATE
      // governments with chips above — a plain duplicate label would be
      // indistinguishable on the grid AND would key the wrong banner
      // (buildingImages matches on the browse label).
      { label: 'Dover',              browseGovernmentList: ['5510120625'], browseStateAbbrev: 'WI', hasContext: true },
      { label: 'Norway',             browseGovernmentList: ['5510158600'], browseStateAbbrev: 'WI', hasContext: true },
      { label: 'Town of Burlington', browseGovernmentList: ['5510111225'], browseStateAbbrev: 'WI', hasContext: true },
      { label: 'Town of Waterford',  browseGovernmentList: ['5510183850'], browseStateAbbrev: 'WI', hasContext: true },
      { label: 'Union Grove',        browseGovernmentList: ['5581775'], browseStateAbbrev: 'WI', hasContext: true },
      { label: 'Waterford',          browseGovernmentList: ['5583825'], browseStateAbbrev: 'WI', hasContext: true },
      { label: 'Wind Point',         browseGovernmentList: ['5587700'], browseStateAbbrev: 'WI', hasContext: true },
      { label: 'Yorkville',          browseGovernmentList: ['5589550'], browseStateAbbrev: 'WI', hasContext: true },
    ],
  },
  {
    // Washington (2026-08-14 Seattle deep seed, migs 1742-1753; Bainbridge Island
    // added 2026-08-17). King County and Kitsap County are standalone and live in
    // COVERAGE_COUNTIES (unrelated array) — a county is deliberately NOT a chip
    // here, same convention as Dane/Pima/Riverside/Clark and as school districts.
    // Operator ruling 2026-08-17, worth keeping because it is the reason this
    // block has two entries and not four: counties stay OFF the landing grid, and
    // are reached by name through the search box instead, where the resolver tags
    // them COUNTY and appends their state so "Los Angeles County, CA" cannot be
    // mistaken for "Los Angeles, CA".
    // The 147 WA legislators are reached BY ADDRESS, through their G5210/G5220
    // district geofences — never from this list, and (verified 2026-08-15) NOT
    // from browse_state_officials=WA either: that endpoint returns statewide
    // executives plus federal officials only, for every state.
    //
    // hasContext true 2026-08-14. ⚠ THIS COMMENT USED TO CLAIM 10 OF 11 SEATTLE
    // OFFICIALS WERE BLANK AND THAT IT WAS "a researched finding, not a backlog".
    // THAT WAS AN OVERCLAIM AND IT HAS BEEN CORRECTED. Task 10 (migs 1754 + 1759)
    // searched exactly ONE source class — Legistar roll calls and ordinance PDFs —
    // and reported its output in the vocabulary of exhaustive research. What it
    // actually established was that 10 of 11 had no ROLL-CALL-PROVABLE chair.
    //
    // Migration 1784 (2026-08-15) re-ran the same officials against web sources,
    // led by The Urbanist's candidate questionnaires: 42 seated rows and 5
    // documented blanks, covering ALL 11 of 11 Seattle city offices. Strauss's two
    // original rows were re-checked against the new sources and CONFIRMED
    // unchanged. Write-up: backend/data/stance-research/
    // 2026-08-15-seattle-council-web-sources.md (EV-Accounts repo). Migration 1787
    // (Rivera's tree amendment) took it to 48 rows; verified against the live DB
    // 2026-08-17 — 11 of 11 offices, 48 answers.
    //
    // 🔑 The lesson worth keeping: a blank is only as strong as the search behind
    // it, and "we read the whole roll-call corpus" is not "we researched them".
    //
    // The label doubles as the banner key: buildingImages matches CURATED_LOCAL
    // on the lowercased browse label, so 'Seattle' here is what resolves
    // cities/seattle.jpg. Do not retitle it without checking that map.
    name: 'Washington', abbrev: 'WA',
    areas: [
      // Bainbridge Island (2026-08-16 Kitsap seed, EV-Accounts 3e8400db / c359d077
      // / b1b1c422): 7 offices, all 7 seated on dated terms, routed by address off
      // its own place geofence.
      // 2026-08-17 (EV-Accounts migs 1820/1821): all 7 councilmembers now carry
      // portraits, and hasContext is now TRUE — but on a thin margin worth naming.
      // Exactly TWO of the seven hold a compass chair: Mike Nelson and Lara Lant,
      // both Growth and Development Pace = 2, from their 2025 Bainbridge
      // Conservation Coalition survey answers. The other five are blank ON PURPOSE.
      // ⚠ THE ISLAND'S DEFINING VOTES HAVE NOT HAPPENED YET. The Comprehensive Plan
      // and Winslow Subarea Plan — residential zoning, growth pace, affordable
      // housing, tree canopy — were still in Planning Commission as of 2026-07-24
      // after a unanimous council remand of mandatory inclusionary zoning, with
      // adoption expected SEPTEMBER 2026. Re-enter then: that roll call should
      // evidence most of the remaining spokes for all seven at once.
      // It now HAS a curated banner — buildingImages 'bainbridge island'.
      { label: 'Bainbridge Island', browseGovernmentList: ['5303736'], browseStateAbbrev: 'WA', hasContext: true },
      { label: 'Seattle', browseGovernmentList: ['5363000'], browseStateAbbrev: 'WA', hasContext: true },
    ],
  },
];

// state name (long) -> USPS abbrev, for matching a geocoded administrative_area_level_1.
export const STATE_NAME_TO_ABBREV = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
  hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA', kansas: 'KS',
  kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD', massachusetts: 'MA',
  michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO', montana: 'MT',
  nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND',
  ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI',
  'south carolina': 'SC', 'south dakota': 'SD', tennessee: 'TN', texas: 'TX',
  utah: 'UT', vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV',
  wisconsin: 'WI', wyoming: 'WY', 'district of columbia': 'DC',
};

/** Normalize a place label for fuzzy comparison: lowercase, drop punctuation,
 *  expand the "st."/"saint" abbreviation, collapse whitespace. */
export function normalizePlace(s) {
  return (s || '')
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\bsaint\b/g, 'st')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Covered counties — browsable like cities (the county government's geo_id routes
// through browse-by-government-list, returning the county's own officials —
// supervisors/commissioners, sheriff, DA, assessor — plus statewide officials).
// Not shown on the landing grid, by operator ruling (reaffirmed 2026-08-17):
// counties are cities' peers in the data but read out of place among city chips.
//
// ⚠ Nothing in the BROWSER BUNDLE imports this array, so Rollup tree-shakes it out
// of the app — but it is NOT dead code: `scripts/gen-coverage.mjs` (the `prebuild`
// hook) reads it to emit `public/coverage.json`, the public catalog Treasury Tracker
// reads to decide where its banner may tether back into Essentials. So a row added
// here does nothing for this app's UI and everything for TT's cross-links. The JSON
// itself is gitignored and rebuilt by `prebuild` on every deploy, so there is
// nothing to commit but this file — run `npm run gen:coverage` only when you want
// to eyeball the catalog locally. What the header used to call "search-only"
// overstated it in the other direction: nothing here powers search either.
// What actually makes a county findable is the LocationCombobox, which queries
// GET /essentials/location-search live and tags each row from the resolver's own
// fields (mtfcc → COUNTY pill, plus the state in the label). Confirmed on the
// deployed site 2026-08-17: "los angeles" returns "Los Angeles County, CA" tagged
// COUNTY above "Los Angeles, CA", and "kitsap" returns "Kitsap County, WA".
// So a county missing from this array is still searchable; keep the rows in sync
// with essentials.governments anyway, because this list is where the coverage
// reasoning is written down.
export const COVERAGE_COUNTIES = [
  { label: 'Los Angeles County', browseGovernmentList: ['06037'], browseStateAbbrev: 'CA', hasContext: true },
  { label: "St. Mary's County", browseGovernmentList: ['24037'], browseStateAbbrev: 'MD' },
  { label: 'Greene County', browseGovernmentList: ['29077'], browseStateAbbrev: 'MO', hasContext: true },
  // Deschutes County (2026-07-24 Bend deep seed): 3 at-large commissioners + 4 countywide row
  // officers (Clerk, Assessor, Treasurer, Sheriff). No hasContext yet — the seeded compass
  // stances belong to 2026 CANDIDATES for county seats, not to sitting officeholders, so
  // claiming context here would not be DB-honest.
  { label: 'Deschutes County', browseGovernmentList: ['41017'], browseStateAbbrev: 'OR' },
  { label: 'Multnomah County', browseGovernmentList: ['41051'], browseStateAbbrev: 'OR' },
  { label: 'Washington County, OR', browseGovernmentList: ['41067'], browseStateAbbrev: 'OR', hasContext: true },
  { label: 'Box Elder County', browseGovernmentList: ['49003'], browseStateAbbrev: 'UT' },
  { label: 'Cache County', browseGovernmentList: ['49005'], browseStateAbbrev: 'UT' },
  { label: 'Davis County', browseGovernmentList: ['49011'], browseStateAbbrev: 'UT' },
  { label: 'Iron County', browseGovernmentList: ['49021'], browseStateAbbrev: 'UT' },
  { label: 'Salt Lake County', browseGovernmentList: ['49035'], browseStateAbbrev: 'UT', hasContext: true },
  { label: 'Summit County', browseGovernmentList: ['49043'], browseStateAbbrev: 'UT' },
  { label: 'Tooele County', browseGovernmentList: ['49045'], browseStateAbbrev: 'UT' },
  { label: 'Utah County', browseGovernmentList: ['49049'], browseStateAbbrev: 'UT', hasContext: true },
  { label: 'Washington County', browseGovernmentList: ['49053'], browseStateAbbrev: 'UT' },
  { label: 'Weber County', browseGovernmentList: ['49057'], browseStateAbbrev: 'UT' },
  { label: 'Clark County', browseGovernmentList: ['32003'], browseStateAbbrev: 'NV', hasContext: true },
  // Racine County (2026-07-28 WI cluster): county executive + 21-member County
  // Board + row officers + 10 Circuit Court judges. hasContext per the WI-muni
  // convention (>=1 official with evidence rows): supervisors Renee Kelly +
  // Tom Preusker carry stances from the 2026-07-29 cluster push. Thin (2/38)
  // but DB-honest.
  { label: 'Racine County', browseGovernmentList: ['55101'], browseStateAbbrev: 'WI', hasContext: true },
  // Dane County (2026-07-29 seed): county executive + 37-member County Board +
  // row officers + 17 Circuit Court branches. hasContext is DB-honest: 170
  // evidence-only answers across 42 officials (exec + officers + all 37
  // supervisors researched; Treasurer + Register of Deeds have no evidenced
  // positions; judges excluded by design).
  { label: 'Dane County', browseGovernmentList: ['55025'], browseStateAbbrev: 'WI', hasContext: true },
  { label: 'Pima County', browseGovernmentList: ['04019'], browseStateAbbrev: 'AZ', hasContext: true },
  { label: 'Riverside County', browseGovernmentList: ['06065'], browseStateAbbrev: 'CA', hasContext: true },
  // First two TEXAS counties (2026-08-08, migs 1621/1622). Each is a Commissioners Court:
  // County Judge + 4 precinct Commissioners. No hasContext — roster-only seed, no stances.
  // ⚠ Both share ONE countywide district (the Clark County NV pattern) because no commissioner
  // precinct geofences are loaded, so an address returns all five members rather than just its
  // own precinct's. Correct for the County Judge, over-inclusive for the commissioners.
  // ⚠ Collin's geo_id 48085 is ambiguous — it is also TX House District 85 (G5220). Anything
  // resolving this entry must qualify by mtfcc/district_type, never by geo_id alone.
  { label: 'Tarrant County', browseGovernmentList: ['48439'], browseStateAbbrev: 'TX' },
  { label: 'Collin County', browseGovernmentList: ['48085'], browseStateAbbrev: 'TX' },
  // King County WA (2026-08-14 Seattle deep seed): County Executive, 9-member
  // County Council, Assessor, Prosecuting Attorney, Director of Elections, and an
  // APPOINTED Sheriff (2020 charter amendment). Moved to even-year elections under
  // the 2022 charter change.
  // hasContext true 2026-08-15, Task 10 landed (migs 1754 + 1759): Balducci,
  // Dembowski, Perry, Zahilay, Barón and Mosqueda carried 9 rows between them
  // (jail-capacity, growth-and-development, local-immigration, taxes).
  // ⚠ The "other 8 of 14 are blank, which is a researched finding" note that used
  // to sit here did NOT survive re-research, the same way Seattle's did not: those
  // blanks came out of roll-call instruments only. Migrations 1785, 1786 and the
  // 2025 County Executive questionnaires (Zahilay + Balducci) re-ran them against
  // web sources and took the county to 11 of 14 offices at 35 rows — verified
  // against the live DB 2026-08-17. Dunn and von Reichbauer's no-vote reasoning
  // still holds for the 3 that remain blank; the lesson is that a no-vote finding
  // is a fact about one source class, not about a person.
  // ⚠ The flag was MISSING from the entry below until 2026-08-15 even though the
  // comment (and commit da64983c) claimed it was set. Set now.
  // ⚠ This flag has NO RUNTIME EFFECT: COVERAGE_COUNTIES has no importers, so
  // Rollup tree-shakes the whole array out of the production bundle. It is
  // source-only documentation. Verified: 53033 returns 0 occurrences in the live
  // bundle while Seattle's 5363000 returns 2.
  // ⚠ geo_id 53033 is NOT unique across MTFCCs — it is also LD33 Senate (G5210)
  // and LD33 House (G5220). Anything resolving this entry must qualify by
  // mtfcc/district_type, never by geo_id alone. Same trap as Collin County above.
  // ⚠ This entry is also what gives cities/king-county.jpg a browse label to key
  // off, since all 14 county offices carry representing_city = NULL.
  { label: 'King County', browseGovernmentList: ['53033'], browseStateAbbrev: 'WA', hasContext: true },
  // Kitsap County WA (2026-08-16 seed, EV-Accounts 3e8400db / c359d077): 9 offices,
  // all 9 seated on dated terms, seven of them on the 2026 general ballot.
  // Commissioner-district and city-ward boundaries are loaded as REFERENCE geometry
  // only, so an in-county address returns all three commissioners rather than just
  // its own district — the same over-inclusive shape as Tarrant/Collin above.
  // hasContext TRUE as of 2026-08-17 (EV-Accounts mig 1821), on a thin margin worth naming:
  // exactly TWO Kitsap people hold a chair — Commissioner Katie Walters (Growth and Development
  // Pace = 3) and sheriff candidate Brandon L. Myers (Public Safety Approach = 4), both from
  // their own filed 2026 voters'-pamphlet statements. The Assessor, Auditor, Clerk and Treasurer
  // are blank ON PURPOSE and should stay blank — they are administrative offices and none of the
  // 22 local-scope topics applies to them.
  // ⚠ This entry also gives cities/kitsap-county.jpg its only path to screen: all 9 county offices
  // carry representing_city = NULL, so the banner key resolves through browse_label alone.
  // Its city, Bainbridge Island, is a chip in COVERAGE_STATES — do NOT add it here.
  { label: 'Kitsap County', browseGovernmentList: ['53035'], browseStateAbbrev: 'WA', hasContext: true },
];

// Covered school districts (school-board deep-seeds). Search-only (not shown on
// the landing grid — a district chip among city chips reads out of place), same
// convention as counties. Each routes through browse-by-geofence to the board.
export const COVERAGE_SCHOOL_DISTRICTS = [
  { label: 'Clark County School District', browseGeoId: '3200060', browseMtfcc: 'G5420', browseStateAbbrev: 'NV' },
  { label: 'Beaverton School District 48J', browseGeoId: '4101920', browseMtfcc: 'G5420', browseStateAbbrev: 'OR' },
  { label: 'Hillsboro School District 1J', browseGeoId: '4100023', browseMtfcc: 'G5420', browseStateAbbrev: 'OR' },
  { label: 'Tigard-Tualatin School District 23J', browseGeoId: '4112240', browseMtfcc: 'G5420', browseStateAbbrev: 'OR' },
  { label: 'Forest Grove School District 15', browseGeoId: '4105160', browseMtfcc: 'G5420', browseStateAbbrev: 'OR' },
  { label: 'Sherwood School District 88J', browseGeoId: '4111290', browseMtfcc: 'G5420', browseStateAbbrev: 'OR' },
];

// Browsable states — every US state (each has statewide officials seeded:
// governor/AG/etc. + US Senators). A state routes to the "browse a state" view.
// Built from STATE_NAME_TO_ABBREV; DC excluded (no statewide executives).
const titleCasePlace = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());
export const COVERAGE_BROWSE_STATES = Object.entries(STATE_NAME_TO_ABBREV)
  .filter(([, abbrev]) => abbrev !== 'DC')
  .map(([name, abbrev]) => ({ label: titleCasePlace(name), browseState: abbrev }));

// ── City/area name search (locality typeahead) ───────────────────────────────

// Flattened, searchable view of every covered area, tagged with its kind + state.
// Name typeahead is intentionally limited to CITIES + STATES only — counties and
// school districts are excluded from search (they cluttered results and read out of
// place among city names). They remain reachable via direct browse links / the grid;
// COVERAGE_COUNTIES and COVERAGE_SCHOOL_DISTRICTS are still exported for that routing.
const ALL_COVERAGE_AREAS = [
  ...COVERAGE_STATES.flatMap((s) =>
    s.areas.map((a) => ({ ...a, kind: 'city', stateAbbrev: a.browseStateAbbrev || s.abbrev, stateName: s.name }))
  ),
  ...COVERAGE_BROWSE_STATES.map((s) => ({ ...s, kind: 'state' })),
];

/**
 * Search covered cities/areas by name for the search-box typeahead. Returns
 * ranked matches (name-prefix first, then stance-seeded, then alphabetical).
 * Returns [] for queries that look like a street address (leading digit) so the
 * address-lookup path owns that input and the two result lists don't collide.
 */
export function searchCoverageAreas(query, limit = 6) {
  const raw = (query || '').trim();
  if (raw.length < 2 || /^\d/.test(raw)) return [];
  const q = normalizePlace(raw);
  if (!q) return [];
  const matches = [];
  for (const area of ALL_COVERAGE_AREAS) {
    const idx = normalizePlace(area.label).indexOf(q);
    if (idx !== -1) matches.push({ area, idx });
  }
  matches.sort((a, b) =>
    a.idx - b.idx ||
    (b.area.hasContext ? 1 : 0) - (a.area.hasContext ? 1 : 0) ||
    a.area.label.localeCompare(b.area.label)
  );
  return matches.slice(0, limit).map((m) => m.area);
}

/**
 * Build the /results browse URL for a covered area. Mirrors Landing's
 * handleAreaClick routing so the typeahead and the grid navigate identically.
 */
export function coverageAreaToPath(area) {
  if (area.kind === 'state' || (area.browseState && !area.browseGovernmentList)) {
    const params = new URLSearchParams({ browse_state_officials: area.browseState, browse_label: area.label });
    return `/results?${params.toString()}`;
  }
  if (area.browseGovernmentList) {
    const params = new URLSearchParams({
      browse_government_list: area.browseGovernmentList.join(','),
      browse_label: area.label,
    });
    if (area.browseStateAbbrev) params.set('browse_state', area.browseStateAbbrev);
    if (area.browseCountyGeoId) params.set('browse_county_geo_id', area.browseCountyGeoId);
    // A county browse shows only the county government's own officials + statewide
    // (not every official inside the county-sized geofence).
    if (area.kind === 'county') params.set('browse_skip_overlap', '1');
    return `/results?${params.toString()}`;
  }
  if (area.browseGeoId) {
    const params = new URLSearchParams({
      browse_geo_id: area.browseGeoId,
      browse_label: area.label,
    });
    if (area.browseMtfcc) params.set('browse_mtfcc', area.browseMtfcc);
    if (area.browseCityFilter) params.set('browse_city_filter', area.browseCityFilter);
    if (area.browseSchoolFilter) params.set('browse_school_filter', area.browseSchoolFilter);
    return `/results?${params.toString()}`;
  }
  return `/results?q=${encodeURIComponent(area.address)}`;
}
