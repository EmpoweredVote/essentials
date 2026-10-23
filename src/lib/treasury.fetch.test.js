/**
 * fetchTreasuryCities must ask for the lean index shape. The bare
 * /treasury/cities carried one object per budget row (122 MB, Oct 2026) and
 * timed out, which silently emptied every treasury link.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const apiFetch = vi.fn();
vi.mock('./auth', () => ({ apiFetch: (path) => apiFetch(path) }));

const { fetchTreasuryCities, hasTreasuryData } = await import('./treasury');

describe('fetchTreasuryCities', () => {
  beforeEach(() => apiFetch.mockReset());

  it('requests the lean index shape, never the bare list', async () => {
    apiFetch.mockResolvedValue({ ok: true, json: async () => [] });
    await fetchTreasuryCities();
    expect(apiFetch).toHaveBeenCalledWith('/treasury/cities?fields=index&datasets=summary');
  });

  it('returns the rows as served', async () => {
    const rows = [{ id: 'a', name: 'Plano', state: 'TX', entity_type: 'municipality', has_data: true }];
    apiFetch.mockResolvedValue({ ok: true, json: async () => rows });
    expect(await fetchTreasuryCities()).toEqual(rows);
  });

  it('returns [] on a non-ok response', async () => {
    apiFetch.mockResolvedValue({ ok: false, json: async () => ({}) });
    expect(await fetchTreasuryCities()).toEqual([]);
  });
});

describe('hasTreasuryData', () => {
  it('is true only for has_data === true', () => {
    expect(hasTreasuryData({ has_data: true })).toBe(true);
    expect(hasTreasuryData({ has_data: false })).toBe(false);
    expect(hasTreasuryData({})).toBe(false);
    expect(hasTreasuryData(null)).toBe(false);
  });
});
