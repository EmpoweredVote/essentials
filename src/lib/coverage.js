// Alpha Community coverage — the single source of truth for which areas Essentials
// has ingested. Consumed by the landing page (the browse list) and by the locality
// search fallback (resolving a city/state query to a covered browse target).
//
// hasContext: true = city has compass stances seeded (rendered as a purple chip).

export const COVERAGE_STATES = [
  {
    name: 'California', abbrev: 'CA',
    areas: [
      { label: 'Alhambra', browseGovernmentList: ['0600884'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Bellflower', browseGovernmentList: ['0604982'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Berkeley', browseGovernmentList: ['0606000'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Beverly Hills', browseGovernmentList: ['0606308'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Burbank', browseGovernmentList: ['0608954'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Carson', browseGovernmentList: ['0611530'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Compton', browseGovernmentList: ['0615044'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Culver City', browseGovernmentList: ['0617568'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Downey', browseGovernmentList: ['0619766'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'El Monte', browseGovernmentList: ['0622230'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'El Segundo', browseGovernmentList: ['0622412'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Fremont', browseGovernmentList: ['0626000'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Gardena', browseGovernmentList: ['0628168'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Glendale', browseGovernmentList: ['0630000'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Hawthorne', browseGovernmentList: ['0632548'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Inglewood', browseGovernmentList: ['0636546'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Lancaster', browseGovernmentList: ['0640130'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Long Beach', browseGovernmentList: ['0643000'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Los Angeles', browseGovernmentList: ['0644000'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Norwalk', browseGovernmentList: ['0652526'], browseStateAbbrev: 'CA', hasContext: true },
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
      { label: 'Lowell',      browseGovernmentList: ['2537000'], browseStateAbbrev: 'MA', hasContext: true },
      { label: 'Lynn',        browseGovernmentList: ['2537490'], browseStateAbbrev: 'MA', hasContext: true },
      { label: 'Medford',     browseGovernmentList: ['2539835'], browseStateAbbrev: 'MA', hasContext: true },
      { label: 'New Bedford', browseGovernmentList: ['2545000'], browseStateAbbrev: 'MA', hasContext: true },
      { label: 'Newton',      browseGovernmentList: ['2545560'], browseStateAbbrev: 'MA', hasContext: true },
      { label: 'Quincy',      browseGovernmentList: ['2555745'], browseStateAbbrev: 'MA', hasContext: true },
      { label: 'Somerville',  browseGovernmentList: ['2562535'], browseStateAbbrev: 'MA', hasContext: true },
      { label: 'Springfield', browseGovernmentList: ['2567000'], browseStateAbbrev: 'MA', hasContext: true },
      { label: 'Waltham',     browseGovernmentList: ['2572600'], browseStateAbbrev: 'MA', hasContext: true },
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
      { label: 'Fairview',     browseGovernmentList: ['4124250'], browseStateAbbrev: 'OR' },
      { label: 'Forest Grove', browseGovernmentList: ['4126200'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Gresham',      browseGovernmentList: ['4131250'], browseStateAbbrev: 'OR' },
      { label: 'Hillsboro',    browseGovernmentList: ['4134100'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Maywood Park', browseGovernmentList: ['4146730'], browseStateAbbrev: 'OR' },
      { label: 'Portland',     browseGovernmentList: ['4159000'], browseStateAbbrev: 'OR', hasContext: true },
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
      { label: 'Blue Ridge',    browseGovernmentList: ['4808872'], browseStateAbbrev: 'TX' },
      { label: 'Celina',        browseGovernmentList: ['4813684'], browseStateAbbrev: 'TX', hasContext: true },
      { label: 'Fairview',      browseGovernmentList: ['4825224'], browseStateAbbrev: 'TX' },
      { label: 'Farmersville',  browseGovernmentList: ['4825488'], browseStateAbbrev: 'TX' },
      { label: 'Frisco',        browseGovernmentList: ['4827684'], browseStateAbbrev: 'TX', hasContext: true },
      { label: 'Josephine',     browseGovernmentList: ['4838068'], browseStateAbbrev: 'TX' },
      { label: 'Lavon',         browseGovernmentList: ['4841800'], browseStateAbbrev: 'TX' },
      { label: 'Longview',      browseGovernmentList: ['4843888'], browseStateAbbrev: 'TX', hasContext: true },
      { label: 'Lowry Crossing',browseGovernmentList: ['4844308'], browseStateAbbrev: 'TX' },
      { label: 'Lucas',         browseGovernmentList: ['4845012'], browseStateAbbrev: 'TX' },
      { label: 'McKinney',      browseGovernmentList: ['4845744'], browseStateAbbrev: 'TX', hasContext: true },
      { label: 'Melissa',       browseGovernmentList: ['4847496'], browseStateAbbrev: 'TX', hasContext: true },
      { label: 'Murphy',        browseGovernmentList: ['4850100'], browseStateAbbrev: 'TX', hasContext: true },
      { label: 'Nevada',        browseGovernmentList: ['4850760'], browseStateAbbrev: 'TX' },
      { label: 'Parker',        browseGovernmentList: ['4855152'], browseStateAbbrev: 'TX' },
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
// Search-only (not shown on the landing grid). Synced from essentials.governments.
export const COVERAGE_COUNTIES = [
  { label: 'Los Angeles County', browseGovernmentList: ['06037'], browseStateAbbrev: 'CA', hasContext: true },
  { label: "St. Mary's County", browseGovernmentList: ['24037'], browseStateAbbrev: 'MD' },
  { label: 'Greene County', browseGovernmentList: ['29077'], browseStateAbbrev: 'MO', hasContext: true },
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
];

// Covered school districts (school-board deep-seeds). Search-only (not shown on
// the landing grid — a district chip among city chips reads out of place), same
// convention as counties. Each routes through browse-by-geofence to the board.
export const COVERAGE_SCHOOL_DISTRICTS = [
  { label: 'Clark County School District', browseGeoId: '3200060', browseMtfcc: 'G5420', browseStateAbbrev: 'NV' },
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
const ALL_COVERAGE_AREAS = [
  ...COVERAGE_STATES.flatMap((s) =>
    s.areas.map((a) => ({ ...a, kind: 'city', stateAbbrev: a.browseStateAbbrev || s.abbrev, stateName: s.name }))
  ),
  ...COVERAGE_COUNTIES.map((c) => ({ ...c, kind: 'county', stateAbbrev: c.browseStateAbbrev })),
  ...COVERAGE_SCHOOL_DISTRICTS.map((d) => ({ ...d, kind: 'school district', stateAbbrev: d.browseStateAbbrev })),
  ...COVERAGE_BROWSE_STATES.map((s) => ({ ...s, kind: 'state' })),
];

/**
 * Search covered cities/areas by name for the search-box typeahead. Returns
 * ranked matches (name-prefix first, then stance-seeded, then alphabetical).
 * Returns [] for queries that look like a street address (leading digit) so the
 * Google address autocomplete owns that path and the two dropdowns don't collide.
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
