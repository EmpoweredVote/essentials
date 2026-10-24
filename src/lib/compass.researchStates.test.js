/**
 * Stage 5 research states on the profile: which topics with no position still get a row, because the
 * person was researched on them (ev-accounts GET /api/compass/politicians/:id/research-states).
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { researchedTopics, fetchResearchStates } from './compass';

const T = (id) => ({ id, short_title: `T${id}` });
const scoped = [T('a'), T('b'), T('c'), T('d')];

describe('researchedTopics', () => {
  it('adds a no-stance topic and a doesnt-fit topic with passages, in scope order', () => {
    const states = [
      { topic_id: 'c', outcome: 'doesnt-fit', researched_on: '2026-10-20', passages: [{ kind: 'own-words', passage: 'x', source_url: 'https://e.org', source_date: null }] },
      { topic_id: 'b', outcome: 'no-stance', researched_on: '2026-10-20', passages: [] },
    ];
    expect(researchedTopics(scoped, [], states).map((t) => t.id)).toEqual(['b', 'c']);
  });

  it('skips a topic the person holds a position on', () => {
    const states = [{ topic_id: 'a', outcome: 'no-stance', researched_on: '2026-10-20', passages: [] }];
    expect(researchedTopics(scoped, [{ topic_id: 'a', value: 3 }], states)).toEqual([]);
  });

  it('skips a doesnt-fit topic with no passage left to show', () => {
    const states = [{ topic_id: 'd', outcome: 'doesnt-fit', researched_on: '2026-10-20', passages: [] }];
    expect(researchedTopics(scoped, [], states)).toEqual([]);
  });

  it('skips a topic outside the scope, and copes with no states', () => {
    expect(researchedTopics(scoped, [], [{ topic_id: 'z', outcome: 'no-stance', researched_on: '2026-10-20', passages: [] }])).toEqual([]);
    expect(researchedTopics(scoped, [], undefined)).toEqual([]);
  });
});

describe('fetchResearchStates', () => {
  // publicFetch reads the stored token; the node test environment has no localStorage.
  beforeEach(() => vi.stubGlobal('localStorage', { getItem: () => null }));
  afterEach(() => vi.unstubAllGlobals());

  it('returns [] when the request fails, so the profile renders as before', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })));
    expect(await fetchResearchStates('p1')).toEqual([]);
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network'); }));
    expect(await fetchResearchStates('p1')).toEqual([]);
  });

  it('returns the list from the research-states route', async () => {
    const list = [{ topic_id: 'b', outcome: 'no-stance', researched_on: '2026-10-20', passages: [] }];
    const f = vi.fn(async () => ({ ok: true, status: 200, json: async () => list }));
    vi.stubGlobal('fetch', f);
    expect(await fetchResearchStates('p1')).toEqual(list);
    expect(String(f.mock.calls[0][0])).toContain('/compass/politicians/p1/research-states');
  });
});
