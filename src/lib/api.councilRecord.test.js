import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('./auth', () => ({ apiFetch: vi.fn(), publicFetch: vi.fn() }));

import { apiFetch } from './auth';
import { fetchCouncilRecord } from './api';

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
