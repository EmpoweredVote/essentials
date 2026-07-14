/**
 * Tests for computeDisplaySpokes() — the compass comparison spoke-selection algorithm.
 *
 * Model: spokes are driven strictly by a *preferred* topic set —
 *   • Local Lens ON  → the curated LOCAL_LENS_TOPICS.
 *   • Local Lens OFF → the user's own selected/regular compass.
 * A spoke shows only when BOTH the user and the politician answered it and it's
 * within the provided scope. There is NO auto-substitution: if too few preferred
 * topics overlap, the caller renders "not enough shared topics" — the intended outcome.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  computeDisplaySpokes,
  LOCAL_LENS_TOPICS,
  FEDERAL_LENS_TOPICS,
  JUDICIAL_LENS_TOPICS,
  LENS_FALLBACKS,
  LENS_SELECTION_KEY,
  sanitizeLensColor,
  normalizeApiLens,
  isLensCalibrated,
  saveLensSelection,
  loadLensSelection,
  saveLensPending,
  loadLensPending,
  clearLensPending,
} from './compass.js';

const topic = (id, short_title) => ({ id, short_title });
const ans = (topic_id, value = 4) => ({ topic_id, value });

// vitest's default environment is 'node' (no jsdom), so `localStorage` is not a
// global here. The lens-persistence helpers under test wrap every localStorage
// call in try/catch (by design — storage-unavailable is non-fatal), so without
// a stand-in they'd silently no-op and the round-trip assertions below would be
// meaningless. This minimal in-memory shim is test-only scaffolding — it adds no
// dependency and exercises the real save/load code paths.
function createMemoryStorage() {
  let store = {};
  return {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; },
  };
}

const T = [
  topic('t1', 'Housing'),
  topic('t2', 'Homelessness'),
  topic('t3', 'Public Safety'),
  topic('t4', 'Transportation'),
  topic('t5', 'Zoning'),
  topic('t6', 'Econ Dev'),
];

describe("computeDisplaySpokes — lens OFF uses the user's selected compass", () => {
  it('shows selected topics both sides answered, in order; drops unanswered ones WITHOUT substituting', () => {
    const selectedTopics = ['t1', 't2', 't3', 't4'];
    const userAnswers = T.map((t) => ans(t.id));        // user answered everything
    const polAnswers = [ans('t1'), ans('t2'), ans('t5')]; // pol answered t1,t2 (selected) + t5 (not selected)

    const { displayTopicIds, hasEnoughSpokes, replacedSpokes } = computeDisplaySpokes({
      selectedTopics, userAnswers, polAnswers, scopedTopics: T, maxSpokes: 8, localLensActive: false,
    });

    // Only t1 & t2 (selected AND both-answered). t5 is NOT pulled in as a substitute.
    expect(displayTopicIds).toEqual(['t1', 't2']);
    expect(hasEnoughSpokes).toBe(false); // < 3 → "not enough shared topics" (expected)
    expect(replacedSpokes).toEqual({});  // no substitution ever
  });

  it('renders the comparison when ≥3 selected topics are shared, preserving order', () => {
    const selectedTopics = ['t4', 't1', 't3'];
    const userAnswers = T.map((t) => ans(t.id));
    const polAnswers = T.map((t) => ans(t.id));

    const { displayTopicIds, hasEnoughSpokes } = computeDisplaySpokes({
      selectedTopics, userAnswers, polAnswers, scopedTopics: T, maxSpokes: 8, localLensActive: false,
    });

    expect(hasEnoughSpokes).toBe(true);
    expect(displayTopicIds).toEqual(['t4', 't1', 't3']); // preferred order preserved
  });
});

describe('computeDisplaySpokes — lens ON uses LOCAL_LENS_TOPICS', () => {
  it('shows only lens topics (in lens order), never substituting non-lens topics', () => {
    const lensScoped = LOCAL_LENS_TOPICS.slice(0, 3).map((id, i) => topic(id, `Lens ${i}`));
    const scoped = [...lensScoped, topic('extra', 'Extra')];
    const userAnswers = scoped.map((t) => ans(t.id));
    const polAnswers = scoped.map((t) => ans(t.id)); // pol answered everything incl. 'extra'

    const { displayTopicIds, hasEnoughSpokes } = computeDisplaySpokes({
      selectedTopics: ['extra'], userAnswers, polAnswers, scopedTopics: scoped, maxSpokes: 8, localLensActive: true,
    });

    expect(hasEnoughSpokes).toBe(true);
    expect(displayTopicIds).toEqual(LOCAL_LENS_TOPICS.slice(0, 3)); // 'extra' excluded
  });
});

describe('computeDisplaySpokes — no preferred set falls back to bilateral overlap', () => {
  it('uses every shared in-scope topic when there are no selected topics and lens is off', () => {
    const userAnswers = T.map((t) => ans(t.id));
    const polAnswers = [ans('t1'), ans('t2'), ans('t3')];
    const { displayTopicIds, hasEnoughSpokes } = computeDisplaySpokes({
      selectedTopics: [], userAnswers, polAnswers, scopedTopics: T, maxSpokes: 8, localLensActive: false,
    });
    expect(hasEnoughSpokes).toBe(true);
    expect([...displayTopicIds].sort()).toEqual(['t1', 't2', 't3']);
  });
});

describe('computeDisplaySpokes — caps and guards', () => {
  it('caps at maxSpokes', () => {
    const selectedTopics = ['t1', 't2', 't3', 't4', 't5', 't6'];
    const userAnswers = T.map((t) => ans(t.id));
    const polAnswers = T.map((t) => ans(t.id));
    const { displayTopicIds } = computeDisplaySpokes({
      selectedTopics, userAnswers, polAnswers, scopedTopics: T, maxSpokes: 4, localLensActive: false,
    });
    expect(displayTopicIds.length).toBe(4);
    expect(displayTopicIds).toEqual(['t1', 't2', 't3', 't4']);
  });

  it('returns empty when polAnswers is null', () => {
    const r = computeDisplaySpokes({ selectedTopics: [], userAnswers: [], polAnswers: null, scopedTopics: T });
    expect(r.hasEnoughSpokes).toBe(false);
    expect(r.displayTopicIds).toEqual([]);
  });

  it('returns empty when scopedTopics is empty', () => {
    const r = computeDisplaySpokes({
      selectedTopics: ['t1'], userAnswers: [ans('t1')], polAnswers: [ans('t1')], scopedTopics: [],
    });
    expect(r.hasEnoughSpokes).toBe(false);
  });

  it('excludes preferred topics that are not in scope', () => {
    // 't9' is selected and both-answered but NOT in scopedTopics → must be excluded.
    const scoped = [topic('t1', 'A'), topic('t2', 'B'), topic('t3', 'C')];
    const userAnswers = [ans('t1'), ans('t2'), ans('t3'), ans('t9')];
    const polAnswers = [ans('t1'), ans('t2'), ans('t3'), ans('t9')];
    const { displayTopicIds } = computeDisplaySpokes({
      selectedTopics: ['t9', 't1', 't2'], userAnswers, polAnswers, scopedTopics: scoped, maxSpokes: 8, localLensActive: false,
    });
    expect(displayTopicIds).toEqual(['t1', 't2']); // t9 dropped (out of scope)
  });
});

describe('LENS_FALLBACKS', () => {
  it('carries name/description/color/topicIds for local, federal, and judicial', () => {
    const byKey = Object.fromEntries(LENS_FALLBACKS.map((l) => [l.key, l]));
    expect(byKey.local).toMatchObject({ name: 'Local Lens', color: '#5A9A6E', topicIds: LOCAL_LENS_TOPICS });
    expect(byKey.federal).toMatchObject({ name: 'Federal Lens', color: '#1E3A5F', topicIds: FEDERAL_LENS_TOPICS });
    expect(byKey.judicial).toMatchObject({ name: 'Judicial Lens', color: '#C2440A', topicIds: JUDICIAL_LENS_TOPICS });
    expect(byKey.local.description).toBeTruthy();
    expect(byKey.federal.description).toBeTruthy();
    expect(byKey.judicial.description).toBeTruthy();
  });
});

describe('sanitizeLensColor', () => {
  it('rejects a non-hex/injection string and returns the default', () => {
    expect(sanitizeLensColor('javascript:alert(1)')).toBe('#94A3B8');
  });

  it('passes through a valid 6-digit hex color unchanged', () => {
    expect(sanitizeLensColor('#1E3A5F')).toBe('#1E3A5F');
  });

  it('passes through a valid 3-digit hex color unchanged', () => {
    expect(sanitizeLensColor('#abc')).toBe('#abc');
  });

  it('honors a custom fallback', () => {
    expect(sanitizeLensColor('not-a-color', '#000000')).toBe('#000000');
  });
});

describe('normalizeApiLens', () => {
  it('passes through a well-formed API row, sanitizing color', () => {
    const row = { key: 'federal', name: 'Federal Lens', description: 'desc', color: '#1E3A5F', icon: 'capitol', topicIds: ['a', 'b'], autoDistrictTypes: ['NATIONAL_LOWER'] };
    expect(normalizeApiLens(row)).toEqual(row);
  });

  it('falls back to a title-cased key when name is missing, sanitizes a bad color, and coerces arrays', () => {
    const row = { key: 'state-house', color: 'javascript:alert(1)' };
    const result = normalizeApiLens(row);
    expect(result.name).toBe('State House');
    expect(result.color).toBe('#94A3B8');
    expect(result.topicIds).toEqual([]);
    expect(result.autoDistrictTypes).toEqual([]);
  });
});

describe('isLensCalibrated', () => {
  const lens8 = { topicIds: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] };
  const lens6 = { topicIds: ['a', 'b', 'c', 'd', 'e', 'f'] };

  it('is true for an 8-topic lens only when >=8 topics have value>0', () => {
    const answers8 = lens8.topicIds.map((id) => ans(id, 3));
    expect(isLensCalibrated(lens8, answers8)).toBe(true);

    const answers7 = lens8.topicIds.slice(0, 7).map((id) => ans(id, 3));
    expect(isLensCalibrated(lens8, answers7)).toBe(false);
  });

  it('ignores zero-value answers when counting', () => {
    const answers = [
      ...lens8.topicIds.slice(0, 7).map((id) => ans(id, 3)),
      ans(lens8.topicIds[7], 0), // value 0 does not count
    ];
    expect(isLensCalibrated(lens8, answers)).toBe(false);
  });

  it('needs only 6 answers for a 6-topic lens (min(8,size))', () => {
    const answers6 = lens6.topicIds.map((id) => ans(id, 3));
    expect(isLensCalibrated(lens6, answers6)).toBe(true);

    const answers5 = lens6.topicIds.slice(0, 5).map((id) => ans(id, 3));
    expect(isLensCalibrated(lens6, answers5)).toBe(false);
  });
});

describe('lens selection persistence', () => {
  beforeEach(() => {
    globalThis.localStorage = createMemoryStorage();
  });

  it('LENS_SELECTION_KEY is the documented persisted key name', () => {
    expect(LENS_SELECTION_KEY).toBe('ev:compassLens');
  });

  it('loadLensSelection falls back to custom for an unknown persisted value', () => {
    localStorage.setItem(LENS_SELECTION_KEY, 'x');
    expect(loadLensSelection(['custom', 'local'])).toBe('custom');
  });

  it('loadLensSelection returns the stored key when it is known', () => {
    saveLensSelection('local');
    expect(loadLensSelection(['custom', 'local'])).toBe('local');
  });

  it('loadLensSelection falls back to custom when nothing is stored', () => {
    expect(loadLensSelection(['custom', 'local'])).toBe('custom');
  });

  it('saveLensPending/loadLensPending/clearLensPending round-trip', () => {
    expect(loadLensPending()).toBeNull();
    saveLensPending('federal');
    expect(loadLensPending()).toBe('federal');
    clearLensPending();
    expect(loadLensPending()).toBeNull();
  });
});

describe('computeDisplaySpokes — Best Match (custom) biggest-disagreement fill (Req 9)', () => {
  // 10 topics, scopedTopics order defines the tie-break index (t1=0 .. t10=9).
  const BM = [
    topic('t1', 'A'), topic('t2', 'B'), topic('t3', 'C'), topic('t4', 'D'), topic('t5', 'E'),
    topic('t6', 'F'), topic('t7', 'G'), topic('t8', 'H'), topic('t9', 'I'), topic('t10', 'J'),
  ];

  it('user compass topics come first (in order), then remaining both-answered candidates fill by descending |diff|, ties by scopedTopics order, capped at maxSpokes', () => {
    const userValues = { t1: 3, t2: 3, t3: 1, t4: 5, t5: 2, t6: 4, t7: 3, t8: 1, t9: 5, t10: 3 };
    const polValues = { t1: 3, t2: 1, t3: 5, t4: 1, t5: 2, t6: 4, t7: 5, t8: 5, t9: 1, t10: 3 };
    // diffs (excluding t1,t2 which are selectedTopics): t3=4 t4=4 t5=0 t6=0 t7=2 t8=4 t9=4 t10=0
    const userAnswers = Object.entries(userValues).map(([id, v]) => ans(id, v));
    const polAnswers = Object.entries(polValues).map(([id, v]) => ans(id, v));
    const selectedTopics = ['t1', 't2'];

    const { displayTopicIds, hasEnoughSpokes } = computeDisplaySpokes({
      selectedTopics, userAnswers, polAnswers, scopedTopics: BM, maxSpokes: 8, localLensActive: false,
    });

    // t1,t2 first (selected order), then diff-4 ties broken by index (t3,t4,t8,t9),
    // diff-2 (t7), diff-0 ties broken by index (t5,t6,t10) — only need 6 more to hit 8.
    expect(displayTopicIds).toEqual(['t1', 't2', 't3', 't4', 't8', 't9', 't7', 't5']);
    expect(displayTopicIds.length).toBeLessThanOrEqual(8);
    expect(hasEnoughSpokes).toBe(true);
  });

  it('returns all shared candidates when the total is <= maxSpokes', () => {
    const scoped = BM.slice(0, 5); // t1..t5
    const userAnswers = scoped.map((t) => ans(t.id, 3));
    const polAnswers = scoped.map((t) => ans(t.id, 3));
    const selectedTopics = ['t1'];

    const { displayTopicIds } = computeDisplaySpokes({
      selectedTopics, userAnswers, polAnswers, scopedTopics: scoped, maxSpokes: 8, localLensActive: false,
    });

    expect([...displayTopicIds].sort()).toEqual(['t1', 't2', 't3', 't4', 't5']);
  });

  it('does NOT run the fill pass when an explicit lensTopicIds is set (curated-set intersection only)', () => {
    const lensIds = FEDERAL_LENS_TOPICS.slice(0, 3);
    const lensScoped = lensIds.map((id, i) => topic(id, `Lens ${i}`));
    const extraScoped = [topic('extraA', 'Extra A'), topic('extraB', 'Extra B'), topic('extraC', 'Extra C'), topic('extraD', 'Extra D'), topic('extraE', 'Extra E')];
    const scoped = [...lensScoped, ...extraScoped];
    const userAnswers = scoped.map((t) => ans(t.id, 3));
    const polAnswers = scoped.map((t) => ans(t.id, 1)); // large diffs on the extras — would dominate a fill pass if one ran

    const { displayTopicIds, hasEnoughSpokes } = computeDisplaySpokes({
      selectedTopics: [], userAnswers, polAnswers, scopedTopics: scoped, maxSpokes: 8, localLensActive: false, lensTopicIds: lensIds,
    });

    expect(displayTopicIds).toEqual(lensIds); // only the 3 lens topics — no fill from the extras
    expect(hasEnoughSpokes).toBe(true); // 3 meets the >=3 threshold; unaffected by the Req 9 fill pass
  });

  it('does NOT run the fill pass when localLensActive is true', () => {
    const lensScoped = LOCAL_LENS_TOPICS.slice(0, 3).map((id, i) => topic(id, `Lens ${i}`));
    const extraScoped = [topic('extraA', 'Extra A'), topic('extraB', 'Extra B'), topic('extraC', 'Extra C'), topic('extraD', 'Extra D'), topic('extraE', 'Extra E')];
    const scoped = [...lensScoped, ...extraScoped];
    const userAnswers = scoped.map((t) => ans(t.id, 3));
    const polAnswers = scoped.map((t) => ans(t.id, 1));

    const { displayTopicIds } = computeDisplaySpokes({
      selectedTopics: [], userAnswers, polAnswers, scopedTopics: scoped, maxSpokes: 8, localLensActive: true,
    });

    expect(displayTopicIds).toEqual(LOCAL_LENS_TOPICS.slice(0, 3));
  });
});
