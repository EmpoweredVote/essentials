import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

vi.mock('./auth', () => ({ apiFetch: vi.fn(), publicFetch: vi.fn() }));

import { apiFetch } from './auth';
import { fetchCouncilRecord, fetchAllCouncilRecord } from './api';

afterEach(() => vi.restoreAllMocks());

describe('fetchCouncilRecord', () => {
  it('requests the council-record route with limit and offset', async () => {
    apiFetch.mockResolvedValue({ ok: true, json: async () => ({ total: 1, items: [{}] }) });
    const out = await fetchCouncilRecord('pol-1', { limit: 50, offset: 10 });
    expect(apiFetch).toHaveBeenCalledWith('/essentials/politicians/pol-1/council-record?limit=50&offset=10');
    expect(out.total).toBe(1);
  });

  it('treats a failed request as total 0 and logs the URL and status', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    apiFetch.mockResolvedValue({ ok: false, status: 500 });
    const out = await fetchCouncilRecord('pol-1');
    expect(out).toEqual({ total: 0, items: [] });
    const logged = err.mock.calls.flat().join(' ');
    expect(logged).toContain('/essentials/politicians/pol-1/council-record');
    expect(logged).toContain('500');
  });

  it('stays silent on a 404', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    apiFetch.mockResolvedValue({ ok: false, status: 404 });
    expect(await fetchCouncilRecord('pol-1')).toEqual({ total: 0, items: [] });
    expect(err).not.toHaveBeenCalled();
  });

  it('treats a thrown error as total 0', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    apiFetch.mockRejectedValue(new Error('network'));
    expect(await fetchCouncilRecord('pol-1')).toEqual({ total: 0, items: [] });
  });
});

describe('fetchAllCouncilRecord (pages until total is reached)', () => {
  // A block body: a function returned from beforeEach runs as its teardown.
  beforeEach(() => {
    apiFetch.mockReset();
  });
  // Answers each page from a list of `total` placeholder items, honouring limit and offset like the API.
  const serve = (total, cap = 200) => {
    const all = Array.from({ length: total }, (_, i) => ({ bill_id: `b${i}` }));
    apiFetch.mockImplementation(async (url) => {
      const q = new URLSearchParams(url.split('?')[1] || '');
      const limit = Math.min(Number(q.get('limit') ?? 50), cap);
      const offset = Number(q.get('offset') ?? 0);
      return { ok: true, json: async () => ({ total, items: all.slice(offset, offset + limit) }) };
    });
  };
  const offsets = () => apiFetch.mock.calls.map(([u]) => new URLSearchParams(u.split('?')[1]).get('offset'));

  it('reads every page of a record longer than one page', async () => {
    serve(450);
    const out = await fetchAllCouncilRecord('pol-1');
    expect(out.total).toBe(450);
    expect(out.items).toHaveLength(450);
    expect(out.items[449]).toEqual({ bill_id: 'b449' });
    expect(offsets()).toEqual(['0', '200', '400']);
    expect(apiFetch.mock.calls.every(([u]) => u.includes('limit=200'))).toBe(true);
  });

  it('makes one request when the first page holds everything', async () => {
    serve(3);
    const out = await fetchAllCouncilRecord('pol-1');
    expect(out.items).toHaveLength(3);
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });

  it('stops at the page cap and warns', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    serve(1000);
    const out = await fetchAllCouncilRecord('pol-1', { pageSize: 10, maxPages: 3 });
    expect(apiFetch).toHaveBeenCalledTimes(3);
    expect(out.items).toHaveLength(30);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls.flat().join(' ')).toContain('pol-1');
  });

  it('stops when a page comes back empty (a failed page), keeping what it has', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    let n = 0;
    apiFetch.mockImplementation(async () =>
      n++ === 0
        ? { ok: true, json: async () => ({ total: 300, items: Array.from({ length: 200 }, (_, i) => ({ bill_id: `b${i}` })) }) }
        : { ok: false, status: 500 },
    );
    const out = await fetchAllCouncilRecord('pol-1');
    expect(out.items).toHaveLength(200);
    expect(apiFetch).toHaveBeenCalledTimes(2);
  });

  it('returns the empty shape when there is no record', async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 404 });
    expect(await fetchAllCouncilRecord('pol-1')).toEqual({ total: 0, items: [] });
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });
});
