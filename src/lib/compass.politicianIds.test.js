/**
 * Tests for fetchPoliticiansWithStances() — which politicians have a compass.
 *
 * It reads the light /compass/politicians/ids route and falls back to the full
 * /compass/politicians list when that route fails, so Essentials and the API
 * can deploy in either order. Either way the caller gets id strings.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// publicFetch(path) is fetch against the API base; stubbed so the test sees the
// path it asked for (the real one reads a token from localStorage).
const fetchMock = vi.hoisted(() => vi.fn());
vi.mock('./auth', () => ({ publicFetch: (path) => fetchMock(path), apiFetch: vi.fn() }));

import { fetchPoliticiansWithStances } from './compass';

const json = (body, status = 200) =>
  Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) });

const paths = () => fetchMock.mock.calls.map(([path]) => path);

beforeEach(() => {
  fetchMock.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fetchPoliticiansWithStances', () => {
  it('uses the ids-only route and returns its ids', async () => {
    fetchMock.mockReturnValueOnce(json(['a', 'b']));

    await expect(fetchPoliticiansWithStances()).resolves.toEqual(['a', 'b']);
    expect(paths()).toEqual(['/compass/politicians/ids']);
  });

  it('stringifies ids', async () => {
    fetchMock.mockReturnValueOnce(json([1, 2]));
    await expect(fetchPoliticiansWithStances()).resolves.toEqual(['1', '2']);
  });

  it('falls back to the full list when the ids route is missing (API not yet deployed)', async () => {
    fetchMock
      .mockReturnValueOnce(json({ code: 'NOT_FOUND' }, 404))
      .mockReturnValueOnce(json([{ id: 'a', full_name: 'A' }, { id: 7 }]));

    await expect(fetchPoliticiansWithStances()).resolves.toEqual(['a', '7']);
    expect(paths()).toEqual(['/compass/politicians/ids', '/compass/politicians']);
  });

  it('falls back when the ids route throws', async () => {
    fetchMock
      .mockReturnValueOnce(Promise.reject(new TypeError('network')))
      .mockReturnValueOnce(json([{ id: 'a' }]));

    await expect(fetchPoliticiansWithStances()).resolves.toEqual(['a']);
  });

  it('falls back when the ids route answers something that is not an array', async () => {
    fetchMock
      .mockReturnValueOnce(json({ unexpected: true }))
      .mockReturnValueOnce(json([{ id: 'a' }]));

    await expect(fetchPoliticiansWithStances()).resolves.toEqual(['a']);
  });

  it('returns [] when both routes fail', async () => {
    fetchMock
      .mockReturnValueOnce(json({}, 500))
      .mockReturnValueOnce(json({}, 500));

    await expect(fetchPoliticiansWithStances()).resolves.toEqual([]);
  });
});
