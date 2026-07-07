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
