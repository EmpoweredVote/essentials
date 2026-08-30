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
} from './buildingImages.js';

const BLOOMINGTON_URL =
  'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/bloomington.jpg';
const CA_PANORAMA_URL =
  'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/states/CA.jpg';

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
    expect(getBuildingImages('Anytown', 'CA').State).toContain('/states/CA.jpg');
  });
});
