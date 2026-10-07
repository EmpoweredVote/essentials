/**
 * Tests for buildingImages.js — Bloomington wiring, graceful fallback, and the
 * address-parser regression guard for Phase 171 (ASST-01).
 *
 * Locks in that the D-04 dead-code deletion (removing the STATE_CAPITOLS image
 * fallback branch + FALLBACK_* constants) did NOT break the address parsers,
 * which still depend on the RETAINED STATE_CAPITOLS object via STATE_NAME_TO_ABBREV
 * and VALID_STATE_ABBREVS. Also asserts the unknown-jurisdiction gradient fallback
 * (criterion 4) and the Bloomington Storage rewire (criterion 2).
 */

import { describe, it, expect } from 'vitest';
import {
  getBuildingImages,
  parseCityFromAddress,
  parseStateFromAddress,
  stateAbbrevFromGeoId,
  resolveRepresentingCity,
} from './buildingImages.js';

const BLOOMINGTON_URL =
  'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/bloomington.jpg';
// CA became versioned on 2026-09-09 (CA-v2.jpg). The shipped frame lost the Golden Gate
// above the 6:1 desktop window; the re-crop moved it back inside. See buildingImages.js.
const CA_PANORAMA_URL =
  'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/states/CA-v2.jpg';

describe('getBuildingImages — Bloomington wiring + fallback (ASST-01)', () => {
  it('resolves Bloomington Local to the cities/bloomington.jpg Storage URL', () => {
    expect(getBuildingImages('Bloomington', 'IN').Local).toBe(BLOOMINGTON_URL);
  });

  it('returns null Local AND null State for an unknown jurisdiction (criterion 4)', () => {
    const imgs = getBuildingImages('Nowhere', 'ZZ');
    expect(imgs.Local).toBeNull();
    expect(imgs.State).toBeNull();
  });

  it('still resolves a panorama State for a covered state (unchanged behavior)', () => {
    expect(getBuildingImages('Anytown', 'CA').State).toBe(CA_PANORAMA_URL);
  });
});

describe('stateAbbrevFromGeoId — geo_id FIPS prefix is authoritative for state', () => {
  it('derives CA from a Los Angeles place geo_id', () => {
    expect(stateAbbrevFromGeoId('0644000')).toBe('CA');
  });
  it('derives CA from an LA County geo_id', () => {
    expect(stateAbbrevFromGeoId('06037')).toBe('CA');
  });
  it('derives MO from a Springfield, Missouri geo_id', () => {
    expect(stateAbbrevFromGeoId('2970000')).toBe('MO');
  });
  // Regression: government-list browse derives state from the first list geo_id's
  // FIPS prefix (Results.jsx userState), so a Henderson (NV) browse cannot show a
  // contradictory banner from a stale browse_state param.
  it('derives NV from a Henderson, Nevada place geo_id (government-list browse)', () => {
    expect(stateAbbrevFromGeoId('3231900')).toBe('NV');
  });
  it('returns null for empty/non-numeric input', () => {
    expect(stateAbbrevFromGeoId('')).toBeNull();
    expect(stateAbbrevFromGeoId(null)).toBeNull();
    expect(stateAbbrevFromGeoId('CA')).toBeNull();
  });
});

describe('address parsers intact after D-04 cleanup (STATE_CAPITOLS retained)', () => {
  it('parses the state abbreviation from a full street address', () => {
    expect(parseStateFromAddress('100 W Kirkwood Ave, Bloomington, IN, 47404')).toBe('IN');
  });

  it('parses the city from a full street address', () => {
    expect(parseCityFromAddress('100 W Kirkwood Ave, Bloomington, IN, 47404')).toBe('Bloomington');
  });

  it('parses a full state name via STATE_NAME_TO_ABBREV (depends on retained STATE_CAPITOLS)', () => {
    expect(parseStateFromAddress('Pierre, South Dakota, USA')).toBe('SD');
  });
});

describe('getBuildingImages — exact match is opt-in (FL-7)', () => {
  it('an exact-match key does NOT match a longer sibling city', () => {
    // 'miami' is exact, so Miami Beach must fall through to no local banner.
    expect(getBuildingImages('Miami Beach', 'FL').Local).toBeNull();
    expect(getBuildingImages('Miami Gardens', 'FL').Local).toBeNull();
    expect(getBuildingImages('North Miami', 'FL').Local).toBeNull();
  });

  it('an exact-match key still matches its own city, case-insensitively', () => {
    expect(getBuildingImages('Miami', 'FL').Local).toContain('/cities/');
    expect(getBuildingImages('miami', 'FL').Local).toContain('/cities/');
  });

  it('Bradenton is exact, so Bradenton Beach gets no city banner', () => {
    expect(getBuildingImages('Bradenton', 'FL').Local).toContain('/cities/');
    expect(getBuildingImages('Bradenton Beach', 'FL').Local).toBeNull();
  });

  it('existing substring keys are UNCHANGED', () => {
    // Bloomington has no exact flag; substring behaviour must survive untouched.
    expect(getBuildingImages('Bloomington', 'IN').Local).toBe(BLOOMINGTON_URL);
    expect(getBuildingImages('City of Bloomington', 'IN').Local).toBe(BLOOMINGTON_URL);
  });

  it('state scoping still applies to an exact key', () => {
    // A Miami in another state must not take Florida's banner.
    expect(getBuildingImages('Miami', 'OK').Local).toBeNull();
  });
});

describe('getBuildingImages — Pennsylvania city banners (Knight PA-5b)', () => {
  it('both PA cities resolve, with and without a caller state', () => {
    // getBuildingImages() treats a MISSING caller state as match-allowed, so the
    // stateless call is the one that proves match:'exact' is doing the work.
    expect(getBuildingImages('Philadelphia', 'PA').Local).toContain('/cities/philadelphia.jpg');
    expect(getBuildingImages('Philadelphia', null).Local).toContain('/cities/philadelphia.jpg');
    expect(getBuildingImages('State College', 'PA').Local).toContain('/cities/state-college.jpg');
    expect(getBuildingImages('State College', null).Local).toContain('/cities/state-college.jpg');
  });

  it('a longer name containing the key gets NO banner', () => {
    expect(getBuildingImages('North Philadelphia', 'PA').Local).toBeNull();
    expect(getBuildingImages('Philadelphia Heights', 'PA').Local).toBeNull();
    expect(getBuildingImages('State College Borough', 'PA').Local).toBeNull();
  });

  it('state scoping still applies — New Philadelphia, OH takes nothing', () => {
    expect(getBuildingImages('New Philadelphia', 'OH').Local).toBeNull();
  });

  it('control: an unregistered PA city is null, so these assertions can fail', () => {
    expect(getBuildingImages('Nowhereville', 'PA').Local).toBeNull();
  });
});

describe('getBuildingImages — county tier (FL-7)', () => {
  it('returns the county banner when no city key matches', () => {
    expect(getBuildingImages('West Palm Beach', 'FL', '12099').Local).toContain('/counties/');
    expect(getBuildingImages('Boca Raton', 'FL', '12099').Local).toContain('/counties/');
    expect(getBuildingImages('Jupiter', 'FL', '12099').Local).toContain('/counties/');
  });

  it('a city banner WINS over the county banner', () => {
    // Miami is in Miami-Dade (12086), which has no county key; but the principle
    // is asserted with Palm Beach's geoid to prove precedence, not absence.
    expect(getBuildingImages('Miami', 'FL', '12099').Local).toContain('/cities/');
  });

  it('an unknown county geoid returns null, not a throw', () => {
    expect(getBuildingImages('Nowhere', 'FL', '99999').Local).toBeNull();
    expect(getBuildingImages('Nowhere', 'FL', null).Local).toBeNull();
    expect(getBuildingImages('Nowhere', 'FL').Local).toBeNull();
  });

  it('the county key is state-scoped', () => {
    expect(getBuildingImages('Anywhere', 'GA', '12099').Local).toBeNull();
  });
});

describe('Florida state banner is versioned, not overwritten (FL-7)', () => {
  it('FL resolves to the versioned FL-v2.jpg', () => {
    // Overwriting states/FL.jpg does not reliably purge the CDN — measured on TX,
    // 2026-08-18. Every state replacement must be a NEW filename, so this asserts the
    // version is actually wired rather than the map entry merely existing.
    const state = getBuildingImages('Anytown', 'FL').State;
    expect(state).toContain('/states/FL-v2.jpg');
    expect(state).not.toContain('/states/FL.jpg');
  });

  it('Miami now carries the skyline that used to be the state banner', () => {
    expect(getBuildingImages('Miami', 'FL').Local).toContain('/cities/miami.jpg');
  });

  it('an unversioned state is unaffected', () => {
    // CO, not CA — CA was this test's example of an unversioned state until 2026-09-09,
    // when it was versioned too. The rule under test is the fall-through to <ABBR>.jpg,
    // so it needs a state that is genuinely absent from STATE_PANORAMA_FILES.
    expect(getBuildingImages('Anytown', 'CO').State).toContain('/states/CO.jpg');
  });
});

describe('California state banner is versioned, not overwritten (CA-3)', () => {
  it('CA resolves to the versioned CA-v2.jpg', () => {
    // Not an adjacency swap like FL — the photograph is unchanged. The shipped frame was
    // measured failing the 6:1 desktop band: the Golden Gate towers, Marin and the bay all
    // sat above rows 128-411 of 540, so desktop visitors saw rooftops on an asset whose own
    // credit names the bridge. The re-crop puts the bridge at 32% height.
    const state = getBuildingImages('Anytown', 'CA').State;
    expect(state).toContain('/states/CA-v2.jpg');
    expect(state).not.toContain('/states/CA.jpg');
  });
});

describe('resolveRepresentingCity — Local-tier banner label (district-type allowlist)', () => {
  // Reported bug: "877 W 1050 N, Orem, UT" banner-titled "Alpine School District".
  // Live POST /essentials/candidates/search returns the SCHOOL record (self-
  // referential representing_city="Alpine School District") sorted ahead of the
  // LOCAL Orem City Council record — this fixture mirrors that order.
  it("does not let a SCHOOL record's self-referential representing_city hijack the banner", () => {
    const list = [
      { district_type: 'SCHOOL', representing_city: 'Alpine School District', chamber_name: 'Alpine School Board' },
      { district_type: 'COUNTY', representing_city: 'Utah', chamber_name: 'Utah County Commission' },
      { district_type: 'LOCAL', representing_city: 'Orem', chamber_name: 'Orem City Council' },
    ];
    expect(
      resolveRepresentingCity({ searchMode: 'address', list, addressInput: '877 W 1050 N, Orem, UT' })
    ).toBe('Orem');
  });

  // Same hijack, different tier: COUNTY records carry their own county name (e.g.
  // "Utah" for Utah County), which must not out-rank the mayor's LOCAL_EXEC record.
  it("does not let a COUNTY record's self-referential representing_city hijack the banner", () => {
    const list = [
      { district_type: 'COUNTY', representing_city: 'Utah', chamber_name: 'Utah County Commission' },
      { district_type: 'LOCAL_EXEC', representing_city: 'Orem', chamber_name: 'Orem Mayor' },
    ];
    expect(
      resolveRepresentingCity({ searchMode: 'address', list, addressInput: '877 W 1050 N, Orem, UT' })
    ).toBe('Orem');
  });

  it('still guards against a NATIONAL/STATE stray representing_city (pre-existing behavior)', () => {
    const list = [{ district_type: 'NATIONAL_UPPER', representing_city: 'Inglewood', chamber_name: 'U.S. Senate' }];
    expect(
      resolveRepresentingCity({ searchMode: 'address', list, addressInput: '123 Main St, Riverside, CA' })
    ).toBe('Riverside');
  });

  it('falls back to a "City of X" chamber_name parse when no record has representing_city set', () => {
    const list = [{ district_type: 'LOCAL', chamber_name: 'City of Bloomington' }];
    expect(
      resolveRepresentingCity({ searchMode: 'address', list, addressInput: '100 W Kirkwood Ave, Bloomington, IN 47404' })
    ).toBe('Bloomington');
  });

  it('falls back to parsing the typed address when no local official carries a city of record', () => {
    expect(
      resolveRepresentingCity({ searchMode: 'address', list: [], addressInput: '100 W Kirkwood Ave, Bloomington, IN 47404' })
    ).toBe('Bloomington');
  });

  it('returns null in ZIP mode even with a matching LOCAL record (a ZIP has no single place of record)', () => {
    const list = [{ district_type: 'LOCAL', representing_city: 'Bloomington' }];
    expect(resolveRepresentingCity({ zipInfo: { states: ['IN'] }, list, addressInput: '' })).toBeNull();
  });

  it('uses the browse-mode label as-is', () => {
    expect(resolveRepresentingCity({ searchMode: 'browse', browseLabel: 'Culver City, CA' })).toBe('Culver City, CA');
  });
});

describe('South Carolina city banners (Knight slice 7) — run the matcher, do not reason about it', () => {
  // 'charlottesville'.includes('charlotte') is true and a missing caller state is
  // treated as match-allowed, so state scope alone is never the guard. South
  // Carolina stacks the traps: Columbia is also a city in KY, MS, SD and TN, WEST
  // Columbia SC sits across the river, and "Myrtle Beach" is a substring of NORTH
  // Myrtle Beach, a separate municipality up the coast.
  const COL = 'cities/columbia.jpg';
  const MYR = 'cities/myrtle-beach.jpg';
  const key = (r) => (r.Local ? r.Local.split('/').slice(-2).join('/') : null);

  it('resolves Columbia, SC to its own banner and focus', () => {
    const r = getBuildingImages('Columbia', 'SC');
    expect(key(r)).toBe(COL);
    expect(r.focus.Local).toBe('50% 82%');
  });

  it('resolves Myrtle Beach, SC to its own banner and focus', () => {
    const r = getBuildingImages('Myrtle Beach', 'SC');
    expect(key(r)).toBe(MYR);
    expect(r.focus.Local).toBe('50% 84%');
  });

  it('resolves with a missing caller state, which is match-allowed', () => {
    expect(key(getBuildingImages('Columbia', null))).toBe(COL);
    expect(key(getBuildingImages('Myrtle Beach', null))).toBe(MYR);
  });

  // THE NEGATIVES ARE THE POINT. A run where everything resolves proves nothing.
  it('does NOT hand the Columbia banner to another state\'s Columbia', () => {
    for (const st of ['MO', 'TN', 'KY', 'MS', 'SD']) {
      expect(key(getBuildingImages('Columbia', st)), st).toBeNull();
    }
  });

  it('does NOT hand the Columbia banner to WEST Columbia, SC', () => {
    expect(key(getBuildingImages('West Columbia', 'SC'))).toBeNull();
  });

  it('does NOT hand the Myrtle Beach banner to NORTH Myrtle Beach, SC', () => {
    // The exact-match flag is the only thing stopping this: North Myrtle Beach is
    // a separate municipality and 'north myrtle beach'.includes('myrtle beach').
    expect(key(getBuildingImages('North Myrtle Beach', 'SC'))).toBeNull();
  });

  it('does NOT match a city that merely starts with the key', () => {
    expect(key(getBuildingImages('Columbiana', 'SC'))).toBeNull();
  });

  it('leaves an unregistered SC city with no local banner', () => {
    // The control proving these checks can return non-null: Charleston is a real
    // SC city with no entry, and it must resolve to null rather than a neighbour.
    expect(key(getBuildingImages('Charleston', 'SC'))).toBeNull();
  });

  it('does not disturb the SC state tier', () => {
    const r = getBuildingImages('Columbia', 'SC');
    expect(r.State).toMatch(/states\/SC\.jpg$/);
    // No state focus is set for SC — retargeting a live state banner changes what
    // every address in the state sees and wants its own review.
    expect(r.focus.State).toBeNull();
  });

  it('keeps the focus map additive — the three tier keys are unchanged in shape', () => {
    // Other apps consume this registry as an API, so `focus` must be a sibling,
    // never a change to what Local/State/Federal mean.
    const r = getBuildingImages('Columbia', 'SC');
    expect(typeof r.Local).toBe('string');
    expect(typeof r.State).toBe('string');
    expect(typeof r.Federal).toBe('string');
    expect(r.focus).toEqual({ Local: '50% 82%', State: null, Federal: null });
  });

  it('a city with no focus returns null focus, not undefined', () => {
    const r = getBuildingImages('Bloomington', 'IN');
    expect(r.focus.Local).toBeNull();
  });
});

describe('Michigan — the city takes the skyline and the state is versioned away from it', () => {
  const DET = 'cities/detroit.jpg';
  const key = (r) => (r.Local ? r.Local.split('/').slice(-2).join('/') : null);

  it('resolves Detroit, MI to its own banner, with no focus', () => {
    const r = getBuildingImages('Detroit', 'MI');
    expect(key(r)).toBe(DET);
    // The 0.50 anchor is baked into the asset, so the centred band is what was certified.
    expect(r.focus.Local).toBeNull();
  });

  it('resolves with a missing caller state, which is match-allowed', () => {
    expect(key(getBuildingImages('Detroit', null))).toBe(DET);
  });

  // THE NEGATIVES ARE THE POINT. 'detroit' is a substring of, or identical to, four other
  // places, and a stateless call cannot lean on the state scope.
  it('does NOT hand the Detroit banner to Detroit Lakes, MN', () => {
    expect(key(getBuildingImages('Detroit Lakes', 'MN'))).toBeNull();
    expect(key(getBuildingImages('Detroit Lakes', null))).toBeNull();
  });

  it('does NOT hand the Detroit banner to another state\'s Detroit', () => {
    for (const st of ['OR', 'TX', 'ME']) {
      expect(key(getBuildingImages('Detroit', st)), st).toBeNull();
    }
  });

  it('leaves an unregistered MI city with no local banner', () => {
    // The control proving these checks can return non-null: Kalamazoo is a real
    // Michigan city with no entry, and it must resolve to null.
    expect(key(getBuildingImages('Kalamazoo', 'MI'))).toBeNull();
  });

  it('serves the VERSIONED Michigan panorama, not the object it replaced', () => {
    // states/MI.jpg is still in the bucket serving its old bytes, and must not be read:
    // overwriting in place does not reliably purge the CDN.
    const r = getBuildingImages('Detroit', 'MI');
    expect(r.State).toMatch(/states\/MI-v2\.jpg$/);
    expect(r.State).not.toMatch(/states\/MI\.jpg$/);
    expect(r.focus.State).toBeNull();
  });

  it('control: a state with no version override is untouched', () => {
    expect(getBuildingImages('Akron', 'OH').State).toMatch(/states\/OH\.jpg$/);
  });
});

/**
 * Biloxi — Knight slice 16, stage MS-5. The last city banner of the programme.
 *
 * THE NEGATIVES ARE THE POINT, and here they are load-bearing rather than decorative.
 * Removing `match: 'exact'` from the biloxi entry was tried before this block was
 * written, and 'East Biloxi' immediately resolved to cities/biloxi.jpg — so the guard
 * is real and these tests fail when it is dropped. CURATED_LOCAL matches by SUBSTRING
 * unless an entry opts out.
 */
describe('Biloxi banner (MS-5)', () => {
  const key = (r) => (r.Local ? r.Local.split('/').slice(-2).join('/') : null);

  it('resolves Biloxi, MS to cities/biloxi.jpg', () => {
    expect(key(getBuildingImages('Biloxi', 'MS'))).toBe('cities/biloxi.jpg');
  });

  it('does NOT hand the Biloxi banner to a compound or neighbouring name', () => {
    for (const probe of ['East Biloxi', 'Biloxi City', "D'Iberville", 'Ocean Springs', 'Gulfport']) {
      expect(key(getBuildingImages(probe, 'MS')), probe).not.toBe('cities/biloxi.jpg');
    }
  });

  it('does NOT hand the Biloxi banner to another state', () => {
    for (const st of ['CA', 'LA', 'AL']) {
      expect(key(getBuildingImages('Biloxi', st)), st).not.toBe('cities/biloxi.jpg');
    }
  });

  it('leaves an unregistered MS city with no local banner', () => {
    // The control proving these checks can return non-null: Hattiesburg is a real
    // Mississippi city with no entry, and it must resolve to null.
    expect(key(getBuildingImages('Hattiesburg', 'MS'))).toBeNull();
  });

  it('carries the focus that keeps the tower crown inside the desktop band', () => {
    // Centred, the 6:1 band cuts the Beau Rivage crown off. Without this the banner
    // ships the Charlotte defect.
    expect(getBuildingImages('Biloxi', 'MS').focus.Local).toBe('50% 30%');
  });

  it('serves the UNVERSIONED Mississippi panorama, which is untouched by this wave', () => {
    const r = getBuildingImages('Biloxi', 'MS');
    expect(r.State).toMatch(/states\/MS\.jpg$/);
    expect(r.focus.State).toBeNull();
  });
});

/**
 * The LA by-district seven (2026-10-06) — the South Pasadena collision, and the
 * per-banner focus that keeps each subject inside the 6:1 desktop band.
 *
 * 🔴 THE GUARD HERE IS KEY LENGTH, NOT `match: 'exact'`. CURATED_LOCAL matches by
 * SUBSTRING, longest key first. 'south pasadena' (14 chars) is therefore tried before
 * 'pasadena' (8) and wins. This is load-bearing and it was verified by running the
 * matcher over all 207 coverage labels, not reasoned about: BEFORE the 'south pasadena'
 * entry existed, the label "South Pasadena" resolved to cities/pasadena.jpg — it would
 * have published RBerteig's photograph of a DIFFERENT CITY under South Pasadena's name.
 * That is the same class of defect as the Portland ME and Fairview TX mis-credits that
 * banners.test.js pins, and licence attribution is the thing it breaks.
 *
 * Shortening that key, or adding match:'exact' to 'pasadena', reintroduces it. Both
 * directions are asserted below, because the fix must also NOT steal Pasadena's own
 * banner back.
 *
 * The focus tests are not decoration either. Desktop renders md:aspect-[6/1], which
 * shows 52.5% of the asset centred, and six of these seven lose their subject at the
 * default centre — the hat off Duarte's rider, the painted city name off South
 * Pasadena, Arcadia's cupola and its ground, the rooflines off Claremont and La Verne,
 * the mountains behind Glendora. Dropping a focus value re-ships that silently, and
 * mobile (aspect-[13/4], ~97% of the asset) will not reveal it.
 */
describe('LA by-district seven — collision and desktop-band focus', () => {
  const key = (r) => (r.Local ? r.Local.split('/').slice(-2).join('/') : null);

  const SEVEN = [
    ['Arcadia', 'cities/arcadia.jpg', '50% 65%'],
    ['Claremont', 'cities/claremont.jpg', '50% 38%'],
    ['Diamond Bar', 'cities/diamond-bar.jpg', null],
    ['Duarte', 'cities/duarte.jpg', '50% 40%'],
    ['Glendora', 'cities/glendora.jpg', '50% 0%'],
    ['La Verne', 'cities/la-verne.jpg', '50% 25%'],
    ['South Pasadena', 'cities/south-pasadena.jpg', '50% 8%'],
  ];

  it('resolves each of the seven to its OWN asset', () => {
    for (const [city, asset] of SEVEN) {
      expect(key(getBuildingImages(city, 'CA')), city).toBe(asset);
    }
  });

  // 🔴 THE COLLISION. Both directions, because a fix that only works one way is a
  // different bug: South Pasadena must not take Pasadena's photo, and Pasadena must
  // keep it.
  it('does NOT publish the Pasadena photograph under South Pasadena', () => {
    expect(key(getBuildingImages('South Pasadena', 'CA'))).toBe('cities/south-pasadena.jpg');
    expect(key(getBuildingImages('South Pasadena', 'CA'))).not.toBe('cities/pasadena.jpg');
  });

  it('leaves Pasadena itself on its own banner', () => {
    expect(key(getBuildingImages('Pasadena', 'CA'))).toBe('cities/pasadena.jpg');
  });

  it('wins on key length, so the collision survives a stateless call too', () => {
    // A missing caller state is match-allowed, so the state scope cannot be what is
    // separating these two. Only the longest-key-first ordering can.
    expect(key(getBuildingImages('South Pasadena', null))).toBe('cities/south-pasadena.jpg');
  });

  // THE NEGATIVES ARE THE POINT. Every one of these seven names exists in another
  // state, and each entry is state-scoped CA.
  it('does NOT hand any of the seven to another state', () => {
    for (const [city, state] of [
      ['Pasadena', 'TX'], ['Claremont', 'NH'], ['Arcadia', 'FL'],
      ['Duarte', 'TX'], ['Glendora', 'NJ'],
    ]) {
      expect(key(getBuildingImages(city, state)), `${city}, ${state}`).toBeNull();
    }
  });

  it('control: an unregistered LA County city is null, so these can fail', () => {
    // Covina is a real San Gabriel Valley city with no entry. Note it does NOT
    // inherit from the 'west covina' key, which is the longer string.
    expect(key(getBuildingImages('Covina', 'CA'))).toBeNull();
  });

  it('carries the focus that keeps each subject inside the 6:1 desktop band', () => {
    for (const [city, , focus] of SEVEN) {
      expect(getBuildingImages(city, 'CA').focus.Local, city).toBe(focus);
    }
  });

  it('Diamond Bar is the ONLY one with no focus, and that is deliberate', () => {
    // A wide ridge-trail overlook with the town mid-frame: it reads correctly at the
    // default centre band. If this ever needs a focus, the asset changed.
    expect(getBuildingImages('Diamond Bar', 'CA').focus.Local).toBeNull();
  });
});

/**
 * The LA County 55 (2026-10-06) — the El Monte collision, and the seven banners.
 *
 * EV-Accounts CA_0299 gave 55 city governments the geo_id that makes them nameable by a browse
 * URL, so all 55 now carry chips. Seven of them (the 50k+ cities) have a banner; the other 48
 * deliberately take the California state shot.
 *
 * 🔴 THE COLLISION, AND WHY match:'exact' ON 'el monte' IS LOAD-BEARING. CURATED_LOCAL matches
 * by SUBSTRING, so the moment "South El Monte" became a coverage label it resolved to
 * cities/el-monte.jpg — publishing Oran Viriyincy's photograph of EL MONTE under a different
 * city. Measured, not reasoned about: a matcher run over all 55 new labels before the fix found
 * exactly one inheriting a banner, and it was this one. Removing match:'exact' from 'el monte'
 * brings it straight back. Same class as the Portland ME and Fairview TX mis-credits that
 * banners.test.js pins, and licence attribution is what it breaks.
 *
 * Unlike 'south pasadena', length cannot save this one: 'el monte' is SHORTER than
 * "south el monte", so longest-key-first still reaches it. Exactness is the only fix available
 * short of giving South El Monte its own banner, and it has no usable photograph.
 */
describe('LA County 55 — the El Monte collision and the seven banners', () => {
  const key = (r) => (r.Local ? r.Local.split('/').slice(-2).join('/') : null);

  const WITH_BANNERS = [
    ['Huntington Beach', 'cities/huntington-beach.jpg', null],
    ['Montebello', 'cities/montebello.jpg', null],
    ['Monterey Park', 'cities/monterey-park.jpg', null],
    ['Pico Rivera', 'cities/pico-rivera.jpg', null],
    ['Redondo Beach', 'cities/redondo-beach.jpg', '50% 12%'],
    ['Lakewood', 'cities/lakewood.jpg', '50% 100%'],
    ['Lynwood', 'cities/lynwood.jpg', '50% 92%'],
  ];

  it('does NOT publish the El Monte photograph under South El Monte', () => {
    expect(key(getBuildingImages('South El Monte', 'CA'))).not.toBe('cities/el-monte.jpg');
    expect(key(getBuildingImages('South El Monte', 'CA'))).toBeNull();
  });

  it('leaves El Monte itself on its own banner', () => {
    expect(key(getBuildingImages('El Monte', 'CA'))).toBe('cities/el-monte.jpg');
  });

  it('keeps El Monte exact against any other compound, stateless call included', () => {
    // A missing caller state is match-allowed, so the state scope is not what separates these.
    expect(key(getBuildingImages('South El Monte', null))).toBeNull();
    expect(key(getBuildingImages('El Monte', null))).toBe('cities/el-monte.jpg');
  });

  it('resolves each of the seven banner cities to its OWN asset', () => {
    for (const [city, asset] of WITH_BANNERS) {
      expect(key(getBuildingImages(city, 'CA')), city).toBe(asset);
    }
  });

  it('carries the focus that keeps each subject inside the 6:1 desktop band', () => {
    for (const [city, , focus] of WITH_BANNERS) {
      expect(getBuildingImages(city, 'CA').focus.Local, city).toBe(focus);
    }
  });

  // ⚠ Baldwin Park and Paramount have NO banner ON PURPOSE. Commons has no usable photograph
  // for either: Baldwin Park's file titled "City Hall Complex" frames a retail strip at every
  // focus and its station photo is 640x400; Paramount has two files in category, neither usable,
  // and the only wider hit shows identifiable faces of private individuals. This test exists so
  // that a future "fix" has to be a deliberate one with a real source behind it.
  it('leaves Baldwin Park and Paramount on the state shot, deliberately', () => {
    expect(key(getBuildingImages('Baldwin Park', 'CA'))).toBeNull();
    expect(key(getBuildingImages('Paramount', 'CA'))).toBeNull();
  });

  // THE NEGATIVES ARE THE POINT. Every one of these names exists elsewhere, and each entry is
  // state-scoped CA.
  it('does NOT hand any of the seven to another state', () => {
    for (const [city, state] of [
      ['Huntington Beach', 'NY'], ['Montebello', 'NY'], ['Lakewood', 'CO'],
      ['Lakewood', 'OH'], ['Lynwood', 'WA'], ['Redondo Beach', 'FL'],
    ]) {
      expect(key(getBuildingImages(city, state)), city + ', ' + state).toBeNull();
    }
  });

  // The control is chosen, not generic: Huntington Park is a real LA County city with no entry
  // whose name STARTS with "Huntington", so it also proves the new 'huntington beach' key does
  // not over-reach onto a neighbour. (A first attempt used "Bellflower Heights" and failed — it
  // contains the existing 'bellflower' key, which is the substring behaviour these tests exist
  // to police.)
  it('control: a real LA County city with no entry is null, so these can fail', () => {
    expect(key(getBuildingImages('Huntington Park', 'CA'))).toBeNull();
  });
});

describe('WA third pass — Duvall and Redmond (2026-10-06 deep seed)', () => {
  it('Duvall resolves to its own asset, and carries a focus', () => {
    const r = getBuildingImages('Duvall', 'WA');
    expect(JSON.stringify(r)).toContain('cities/duvall.jpg');
    // The focus is load bearing here: at the default 50% the "DUVALL LIBRARY"
    // signboard — the only thing in frame that names the town — is clipped by
    // the top edge of the 6/1 desktop band.
    expect(JSON.stringify(r)).toContain('50% 25%');
  });

  it('Redmond resolves to its own asset', () => {
    expect(JSON.stringify(getBuildingImages('Redmond', 'WA'))).toContain('cities/redmond.jpg');
  });

  // Redmond, Oregon is a real city and is not seeded today. The key is state-scoped
  // so that it keys separately if it ever is, the way the two Saint Pauls already do.
  it('a Redmond in Oregon does NOT pick up the Washington asset', () => {
    expect(JSON.stringify(getBuildingImages('Redmond', 'OR'))).not.toContain('cities/redmond.jpg');
  });

  // Duvall sits in the same river valley as King County's Snoqualmie Falls banner,
  // and both are WA cities, so this guards the substring match from bleeding.
  it('Duvall does not pick up King County or Seattle', () => {
    const s = JSON.stringify(getBuildingImages('Duvall', 'WA'));
    expect(s).not.toContain('king-county.jpg');
    expect(s).not.toContain('cities/seattle.jpg');
  });
});
