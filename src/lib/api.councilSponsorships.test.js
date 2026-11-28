import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

vi.mock('./auth', () => ({ apiFetch: vi.fn(), publicFetch: vi.fn() }));

import { apiFetch } from './auth';
import { fetchCouncilSponsorships, fetchAllCouncilSponsorships } from './api';

afterEach(() => vi.restoreAllMocks());
// A block body: a function returned from beforeEach runs as its teardown.
beforeEach(() => {
  apiFetch.mockReset();
});

describe('fetchCouncilSponsorships', () => {
  it('requests the council-sponsorships route with limit and offset', async () => {
    apiFetch.mockResolvedValue({ ok: true, json: async () => ({ total: 1, items: [{}] }) });
    const out = await fetchCouncilSponsorships('pol-1', { limit: 50, offset: 10 });
    expect(apiFetch).toHaveBeenCalledWith('/essentials/politicians/pol-1/council-sponsorships?limit=50&offset=10');
    expect(out).toEqual({ total: 1, items: [{}], failed: false });
  });

  it('marks a 500 as failed and logs the URL and status', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    apiFetch.mockResolvedValue({ ok: false, status: 500 });
    const out = await fetchCouncilSponsorships('pol-1');
    expect(out).toEqual({ total: 0, items: [], failed: true });
    const logged = err.mock.calls.flat().join(' ');
    expect(logged).toContain('/essentials/politicians/pol-1/council-sponsorships');
    expect(logged).toContain('500');
  });

  it('stays silent and not failed on a 404', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    apiFetch.mockResolvedValue({ ok: false, status: 404 });
    expect(await fetchCouncilSponsorships('pol-1')).toEqual({ total: 0, items: [], failed: false });
    expect(err).not.toHaveBeenCalled();
  });

  it('marks a thrown error as failed', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    apiFetch.mockRejectedValue(new Error('network'));
    expect(await fetchCouncilSponsorships('pol-1')).toEqual({ total: 0, items: [], failed: true });
  });
});

describe('fetchAllCouncilSponsorships', () => {
  const serve = (total) => {
    const all = Array.from({ length: total }, (_, i) => ({ bill_id: `b${i}` }));
    apiFetch.mockImplementation(async (url) => {
      const q = new URLSearchParams(url.split('?')[1] || '');
      const limit = Math.min(Number(q.get('limit') ?? 50), 200);
      const offset = Number(q.get('offset') ?? 0);
      return { ok: true, json: async () => ({ total, items: all.slice(offset, offset + limit) }) };
    });
  };
  const offsets = () => apiFetch.mock.calls.map(([u]) => new URLSearchParams(u.split('?')[1]).get('offset'));

  it('reads every page of a list longer than one page', async () => {
    serve(450);
    const out = await fetchAllCouncilSponsorships('pol-1');
    expect(out.total).toBe(450);
    expect(out.items).toHaveLength(450);
    expect(out.failed).toBe(false);
    expect(offsets()).toEqual(['0', '200', '400']);
  });

  it('marks failed when a later page fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    let n = 0;
    apiFetch.mockImplementation(async () =>
      n++ === 0
        ? { ok: true, json: async () => ({ total: 300, items: Array.from({ length: 200 }, (_, i) => ({ bill_id: `b${i}` })) }) }
        : { ok: false, status: 500 },
    );
    const out = await fetchAllCouncilSponsorships('pol-1');
    expect(out.items).toHaveLength(200);
    expect(out.failed).toBe(true);
  });
});
