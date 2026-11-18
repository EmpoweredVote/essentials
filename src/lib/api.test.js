/**
 * Tests for src/lib/api.jsx — searchLocationsByName + lookupCoordinate
 * (SRCH-04 / SRCH-05) + searchPoliticians (FL-7 county passthrough).
 * Mocks `./auth`'s publicFetch and apiFetch (per RESEARCH.md's
 * standard Vitest convention — no existing local precedent for testing
 * api.jsx's network functions to copy mock mechanics from).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./auth', () => ({
  apiFetch: vi.fn(),
  publicFetch: vi.fn(),
}));

import { publicFetch, apiFetch } from './auth';
import { searchLocationsByName, lookupCoordinate, searchPoliticians } from './api.jsx';

function mockResponse({ ok = true, status = 200, json, headers = {} } = {}) {
  return {
    ok,
    status,
    // searchPoliticians reads X-Data-Status / X-Formatted-Address off the
    // response headers; the other helpers never touch them.
    headers: { get: (name) => headers[String(name).toLowerCase()] ?? null },
    json: vi.fn().mockResolvedValue(json),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('searchLocationsByName (SRCH-04)', () => {
  it('returns { data, error: null } when the response is a bare array', async () => {
    const candidates = [{ geo_id: '1234', mtfcc: 'G4110', label: 'Springfield, IL', state: 'IL', has_local_data: true }];
    publicFetch.mockResolvedValue(mockResponse({ json: candidates }));

    const result = await searchLocationsByName('Springfield');

    expect(result).toEqual({ data: candidates, error: null });
    expect(publicFetch).toHaveBeenCalledTimes(1);
    expect(publicFetch).toHaveBeenCalledWith('/essentials/location-search?q=Springfield');
  });

  it('unwraps a { candidates: [...] } envelope to the same data array', async () => {
    const candidates = [{ geo_id: '5678', mtfcc: 'G4020', label: 'Sangamon County, IL', state: 'IL', has_local_data: false }];
    publicFetch.mockResolvedValue(mockResponse({ json: { candidates } }));

    const result = await searchLocationsByName('Sangamon');

    expect(result).toEqual({ data: candidates, error: null });
  });

  it('returns { data: [], error: "<status>" } on a non-ok response', async () => {
    publicFetch.mockResolvedValue(mockResponse({ ok: false, status: 500 }));

    const result = await searchLocationsByName('Springfield');

    expect(result).toEqual({ data: [], error: '500' });
  });

  it('returns { data: [], error: <message> } when fetch throws', async () => {
    publicFetch.mockRejectedValue(new Error('network down'));

    const result = await searchLocationsByName('Springfield');

    expect(result).toEqual({ data: [], error: 'network down' });
  });

  it('never calls apiFetch / triggers no login-redirect path (uses publicFetch only)', async () => {
    publicFetch.mockResolvedValue(mockResponse({ json: [] }));
    await searchLocationsByName('Bloomington');
    expect(publicFetch).toHaveBeenCalled();
  });
});

describe('lookupCoordinate (SRCH-05)', () => {
  it('returns { data: politicians, error: null, code: null, formattedAddress: "" } on success ({ politicians, matchedAddress } shape)', async () => {
    const politicians = [{ id: 'p1', office_title: 'U.S. Representative' }];
    publicFetch.mockResolvedValue(mockResponse({ json: { politicians, matchedAddress: '' } }));

    const result = await lookupCoordinate(39.17, -86.52);

    expect(result).toEqual({ data: politicians, error: null, code: null, formattedAddress: '', locality: null });
    expect(publicFetch).toHaveBeenCalledWith('/essentials/coordinate-lookup', {
      method: 'POST',
      body: JSON.stringify({ lat: 39.17, lng: -86.52 }),
    });
  });

  it('unwraps a flat-array success response into data', async () => {
    const flat = [{ id: 'p2', office_title: 'Governor' }];
    publicFetch.mockResolvedValue(mockResponse({ json: flat }));

    const result = await lookupCoordinate(39.17, -86.52);

    expect(result.data).toEqual(flat);
    expect(result.error).toBeNull();
  });

  it('LOC-04: passes through locality on success ({ politicians, locality } shape)', async () => {
    const politicians = [{ id: 'p1', office_title: 'County Supervisor' }];
    const locality = { incorporated: false, place_name: null, county_name: 'Pima County' };
    publicFetch.mockResolvedValue(mockResponse({ json: { politicians, matchedAddress: '', locality } }));

    const result = await lookupCoordinate(32.056939603926, -110.616578348179);

    expect(result.locality).toEqual(locality);
  });

  it('LOC-04: locality is null on a flat-array success response (no locality field to unwrap)', async () => {
    const flat = [{ id: 'p2', office_title: 'Governor' }];
    publicFetch.mockResolvedValue(mockResponse({ json: flat }));

    const result = await lookupCoordinate(39.17, -86.52);

    expect(result.locality).toBeNull();
  });

  it.each([
    ['SWAPPED_COORDINATES'],
    ['OUTSIDE_US_BOUNDS'],
    ['INVALID_COORDINATES'],
  ])('maps a 422 with body { code: "%s" } to that code with error "validation"', async (code) => {
    publicFetch.mockResolvedValue(mockResponse({ ok: false, status: 422, json: { code } }));

    const result = await lookupCoordinate(-86.52, 39.17);

    expect(result).toEqual({ data: [], error: 'validation', code, formattedAddress: '', locality: null });
  });

  it('defaults code to INVALID_COORDINATES on a 422 with an unparseable body', async () => {
    publicFetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: vi.fn().mockRejectedValue(new Error('bad json')),
    });

    const result = await lookupCoordinate(999, 999);

    expect(result).toEqual({ data: [], error: 'validation', code: 'INVALID_COORDINATES', formattedAddress: '', locality: null });
  });

  it('defaults code to INVALID_COORDINATES on a 422 with a missing code field', async () => {
    publicFetch.mockResolvedValue(mockResponse({ ok: false, status: 422, json: {} }));

    const result = await lookupCoordinate(999, 999);

    expect(result).toEqual({ data: [], error: 'validation', code: 'INVALID_COORDINATES', formattedAddress: '', locality: null });
  });

  it('returns { data: [], error: "500", code: null } on a non-422 non-ok response', async () => {
    publicFetch.mockResolvedValue(mockResponse({ ok: false, status: 500 }));

    const result = await lookupCoordinate(39.17, -86.52);

    expect(result).toEqual({ data: [], error: '500', code: null, formattedAddress: '', locality: null });
  });

  it('returns { data: [], error: <message>, code: null } when fetch throws', async () => {
    publicFetch.mockRejectedValue(new Error('network down'));

    const result = await lookupCoordinate(39.17, -86.52);

    expect(result).toEqual({ data: [], error: 'network down', code: null, formattedAddress: '', locality: null });
  });

  it('never calls apiFetch / triggers no login-redirect path (uses publicFetch only)', async () => {
    publicFetch.mockResolvedValue(mockResponse({ json: { politicians: [], matchedAddress: '' } }));
    await lookupCoordinate(39.17, -86.52);
    expect(publicFetch).toHaveBeenCalled();
  });
});

describe('searchPoliticians (FL-7: county passthrough)', () => {
  const WRAPPED = {
    politicians: [{ id: 1 }],
    tribal_land: { on_reservation: false },
    locality: { incorporated: true, place_name: 'Racine', county_name: 'Racine County' },
    county: { geoid: '55101', name: 'Racine County' },
  };

  it('surfaces county from the wrapped address-search response', async () => {
    apiFetch.mockResolvedValue(mockResponse({ json: WRAPPED }));

    const result = await searchPoliticians('730 Washington Ave, Racine, WI 53403');

    // The regression this guards: county was dropped here, so
    // usePoliticianData's setCounty(result.county || null) could only ever set
    // null and the county banner tier was unreachable in address mode.
    expect(result.county).toEqual({ geoid: '55101', name: 'Racine County' });
  });

  it('surfaces county alongside locality, not instead of it', async () => {
    apiFetch.mockResolvedValue(mockResponse({ json: WRAPPED }));

    const result = await searchPoliticians('730 Washington Ave, Racine, WI 53403');

    expect(result.locality).toEqual(WRAPPED.locality);
    expect(result.tribal_land).toEqual(WRAPPED.tribal_land);
    expect(result.data).toEqual(WRAPPED.politicians);
  });

  it('leaves county undefined on a legacy flat-array response', async () => {
    apiFetch.mockResolvedValue(mockResponse({ json: [{ id: 1 }] }));

    const result = await searchPoliticians('anywhere');

    expect(result.county).toBeUndefined();
    expect(result.data).toEqual([{ id: 1 }]);
  });

  it('carries a null county through unchanged (point with no county-tier officials)', async () => {
    // Tucson: the API answers `county: null` because Pima County seats no
    // officials in our data, while locality.county_name still names it.
    apiFetch.mockResolvedValue(mockResponse({
      json: {
        politicians: [],
        locality: { incorporated: true, place_name: 'Tucson', county_name: 'Pima County' },
        county: null,
      },
    }));

    const result = await searchPoliticians('100 N Stone Ave, Tucson, AZ 85701');

    expect(result.county).toBeNull();
    expect(result.locality.county_name).toBe('Pima County');
  });

  it('does not invent a county on an error response', async () => {
    apiFetch.mockResolvedValue(mockResponse({ ok: false, status: 500, json: {} }));

    const result = await searchPoliticians('anywhere');

    expect(result.status).toBe('error');
    expect(result.county).toBeUndefined();
  });
});
