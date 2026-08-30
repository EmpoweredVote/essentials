/**
 * Tests for computeDisplaySpokes() — the compass comparison spoke-selection algorithm.
 *
 * Model: spokes are driven by a *preferred* topic set —
 *   • Explicit lens (lensTopicIds set) → the curated lens topic set only, no fill.
 *   • Local Lens ON (localLensActive)  → the curated LOCAL_LENS_TOPICS only, no fill.
 *   • Best Match / Custom (both off, selectedTopics present) → the user's selected
 *     topics first, then (Req 9) remaining slots up to maxSpokes are filled from
 *     other both-answered, in-scope candidates ordered by descending
 *     |userValue - polValue|, ties broken by scopedTopics display order.
 * A spoke shows only when BOTH the user and the politician answered it and it's
 * within the provided scope. Only the Best Match/Custom case auto-fills; the
 * explicit-lens and local-lens branches never substitute — if too few of their
 * curated topics overlap, the caller renders "not enough shared topics".
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
  shouldApplyClear,
  buildCompassPayload,
  getAppliedClearedAt,
  setAppliedClearedAt,
  normalizeApiLens,
  isLensCalibrated,
  saveLensSelection,
  loadLensSelection,
  saveLensPending,
  loadLensPending,
  clearLensPending,
  resolveTabLens,
  TAB_DEFAULTS,
  normalizeUserLens,
  mergeLenses,
  pruneLensTopics,
  USER_LENS_COLOR,
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

describe("computeDisplaySpokes — lens OFF uses the user's selected compass (Best Match, Req 9)", () => {
  it('shows selected topics both sides answered first, then fills remaining slots (up to maxSpokes) with other both-answered in-scope topics', () => {
    const selectedTopics = ['t1', 't2', 't3', 't4'];
    const userAnswers = T.map((t) => ans(t.id));        // user answered everything
    const polAnswers = [ans('t1'), ans('t2'), ans('t5')]; // pol answered t1,t2 (selected) + t5 (not selected)

    const { displayTopicIds, hasEnoughSpokes, replacedSpokes } = computeDisplaySpokes({
      selectedTopics, userAnswers, polAnswers, scopedTopics: T, maxSpokes: 8, localLensActive: false,
    });

    // t1 & t2 (selected AND both-answered) first, then t5 fills a remaining slot
    // (both-answered, not selected) per the Req 9 Best Match fill pass. t3/t4 are
    // dropped from the "selected-first" phase (pol never answered them) but are not
    // eligible for the fill either since pol didn't answer them.
    expect(displayTopicIds).toEqual(['t1', 't2', 't5']);
    expect(hasEnoughSpokes).toBe(true); // 3 >= 3
    expect(replacedSpokes).toEqual({});  // replacedSpokes stays unused (stance-invert bookkeeping only)
  });

  it('renders the comparison when ≥3 selected topics are shared, preserving order, then fills remaining slots by disagreement', () => {
    const selectedTopics = ['t4', 't1', 't3'];
    const userAnswers = T.map((t) => ans(t.id));
    const polAnswers = T.map((t) => ans(t.id));

    const { displayTopicIds, hasEnoughSpokes } = computeDisplaySpokes({
      selectedTopics, userAnswers, polAnswers, scopedTopics: T, maxSpokes: 8, localLensActive: false,
    });

    expect(hasEnoughSpokes).toBe(true);
    // Selected topics first (order preserved), then the rest of T fills the
    // remaining slots (all diff 0 here since userAnswers/polAnswers are identical,
    // so ties are broken by scopedTopics order: t2, t5, t6).
    expect(displayTopicIds).toEqual(['t4', 't1', 't3', 't2', 't5', 't6']);
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

  it('excludes preferred topics that are not in scope (t9 is out-of-scope even though both-answered); the fill pass then adds the remaining in-scope candidate', () => {
    // 't9' is selected and both-answered but NOT in scopedTopics → must be excluded
    // from the "selected-first" phase, and it can never be pulled in by the Req 9
    // fill pass either, since the fill only draws candidates from scopedTopics.
    const scoped = [topic('t1', 'A'), topic('t2', 'B'), topic('t3', 'C')];
    const userAnswers = [ans('t1'), ans('t2'), ans('t3'), ans('t9')];
    const polAnswers = [ans('t1'), ans('t2'), ans('t3'), ans('t9')];
    const { displayTopicIds } = computeDisplaySpokes({
      selectedTopics: ['t9', 't1', 't2'], userAnswers, polAnswers, scopedTopics: scoped, maxSpokes: 8, localLensActive: false,
    });
    // t9 dropped (out of scope); t3 pulled in by the Req 9 fill (both-answered, in-scope, not selected).
    expect(displayTopicIds).toEqual(['t1', 't2', 't3']);
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

describe('resolveTabLens', () => {
  const judicialLens = { key: 'judicial', topicIds: JUDICIAL_LENS_TOPICS };
  const calibratedJudicialAnswers = JUDICIAL_LENS_TOPICS.map((id) => ans(id, 3));
  const lenses = [judicialLens];

  it('returns TAB_DEFAULTS[tabKey] when the default is a real, calibrated lens (judges -> judicial)', () => {
    expect(TAB_DEFAULTS.judges).toBe('judicial');
    expect(resolveTabLens('judges', {}, lenses, calibratedJudicialAnswers)).toBe('judicial');
  });

  it("returns 'custom' without a lens lookup when the candidate is 'custom' (representatives default)", () => {
    expect(TAB_DEFAULTS.representatives).toBe('custom');
    expect(resolveTabLens('representatives', {}, lenses, calibratedJudicialAnswers)).toBe('custom');
  });

  it("returns 'custom' when the tab default key is absent from lenses (education today)", () => {
    // 'education' is TAB_DEFAULTS.educators but not present in the passed lenses array.
    expect(TAB_DEFAULTS.educators).toBe('education');
    expect(resolveTabLens('educators', {}, lenses, calibratedJudicialAnswers)).toBe('custom');
  });

  it("returns 'custom' when the default key is present but uncalibrated for this user", () => {
    const fewAnswers = JUDICIAL_LENS_TOPICS.slice(0, 3).map((id) => ans(id, 3));
    expect(resolveTabLens('judges', {}, lenses, fewAnswers)).toBe('custom');
  });

  it('returns the default key unchanged when present AND calibrated', () => {
    expect(resolveTabLens('judges', {}, lenses, calibratedJudicialAnswers)).toBe('judicial');
  });

  it('prefers an explicitly-remembered pick over TAB_DEFAULTS, even resolving to custom', () => {
    // Remembered 'custom' on judges wins even though the tab default is 'judicial'.
    expect(resolveTabLens('judges', { judges: 'custom' }, lenses, calibratedJudicialAnswers)).toBe('custom');
  });

  it('returns a remembered calibrated real key unchanged', () => {
    expect(resolveTabLens('representatives', { representatives: 'judicial' }, lenses, calibratedJudicialAnswers)).toBe('judicial');
  });

  it("returns 'custom' for an unknown tabKey with no TAB_DEFAULTS entry and no memory", () => {
    expect(resolveTabLens('elections', {}, lenses, calibratedJudicialAnswers)).toBe('custom');
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


// ─── Cross-subdomain reset + payload preservation ────────────────────────────
//
// The shared compass slice cannot express a reset through its contents: `a`
// only carries the ≤8 topics on the compass, so an empty payload is
// indistinguishable from a peer that has not hydrated yet. Compass publishes an
// explicit `clearedAt` timestamp instead; these cover our half of that contract.

describe('shouldApplyClear', () => {
  it('applies a reset newer than the one already applied', () => {
    expect(shouldApplyClear({ a: {}, s: [], clearedAt: 200 }, 100)).toBe(true);
  });

  it('ignores a reset already applied, so a reload does not re-clear', () => {
    expect(shouldApplyClear({ a: {}, s: [], clearedAt: 100 }, 100)).toBe(false);
    expect(shouldApplyClear({ a: {}, s: [], clearedAt: 50 }, 100)).toBe(false);
  });

  // The important one: an unhydrated peer publishes an empty payload with no
  // timestamp. Treating "looks empty" as "was reset" would let it wipe a
  // populated compass — which is why the timestamp exists at all.
  it('never clears on an empty payload that carries no timestamp', () => {
    expect(shouldApplyClear({ a: {}, s: [], i: {} }, 0)).toBe(false);
    expect(shouldApplyClear({ a: {}, s: [], i: {} }, 100)).toBe(false);
  });

  it('tolerates a missing or malformed slice', () => {
    expect(shouldApplyClear(null, 0)).toBe(false);
    expect(shouldApplyClear(undefined, 0)).toBe(false);
    expect(shouldApplyClear({ clearedAt: 'nonsense' }, 0)).toBe(false);
  });
});

describe('buildCompassPayload', () => {
  // evContext.set() replaces the whole slice, so anything not carried forward is
  // deleted from shared state. This app reads write-ins but never authors them.
  it('preserves keys this app does not own, such as write-ins', () => {
    const prior = { a: { Housing: 1 }, s: ['t1'], i: {}, w: { Housing: 'my own words' } };
    const next = buildCompassPayload(prior, { a: { Zoning: 3 }, s: ['t5'], i: { Zoning: true } });
    expect(next.w).toEqual({ Housing: 'my own words' });
    expect(next.a).toEqual({ Zoning: 3 });
    expect(next.s).toEqual(['t5']);
  });

  it('carries forward unknown future keys rather than dropping them', () => {
    const next = buildCompassPayload({ somethingNew: 42 }, { a: {}, s: [], i: {} });
    expect(next.somethingNew).toBe(42);
  });

  it('handles a missing or malformed prior slice', () => {
    expect(buildCompassPayload(null, { a: {} })).toEqual({ a: {} });
    expect(buildCompassPayload('not an object', { a: {} })).toEqual({ a: {} });
  });
});

describe('applied clearedAt persistence', () => {
  beforeEach(() => {
    globalThis.localStorage = createMemoryStorage();
  });

  it('round-trips through storage and defaults to 0', () => {
    expect(getAppliedClearedAt()).toBe(0);
    setAppliedClearedAt(1234);
    expect(getAppliedClearedAt()).toBe(1234);
  });
});

// ---------------------------------------------------------------------------
// Custom (user-authored) lenses
// ---------------------------------------------------------------------------
//
// Editorial lenses come from GET /compass/lenses and carry a colour and icon.
// User lenses come from GET /compass/my-lenses and carry neither — the table
// stores identity, not presentation — so Essentials supplies both here, and the
// two sources are merged into the one array the chip row already renders.

describe('normalizeUserLens', () => {
  it('supplies the teal accent and tag icon the API does not store', () => {
    const out = normalizeUserLens({ key: 'u_7f3a91', name: 'My Eight', topicIds: ['a', 'b'] });
    expect(out.color).toBe(USER_LENS_COLOR);
    expect(out.icon).toBe('tag');
    expect(out.isUser).toBe(true);
  });

  it('falls back to a title-cased key when the lens has no name', () => {
    expect(normalizeUserLens({ key: 'u_7f3a91', topicIds: [] }).name).toBe('U 7f3a91');
  });

  it('coerces a missing or non-array topicIds to []', () => {
    expect(normalizeUserLens({ key: 'u_1' }).topicIds).toEqual([]);
    expect(normalizeUserLens({ key: 'u_1', topicIds: 'nope' }).topicIds).toEqual([]);
  });

  it('counts needsRecalibration into flagCount, defaulting to 0', () => {
    expect(normalizeUserLens({ key: 'u_1', needsRecalibration: [{ topicId: 't1' }, { topicId: 't2' }] }).flagCount).toBe(2);
    expect(normalizeUserLens({ key: 'u_1' }).flagCount).toBe(0);
    expect(normalizeUserLens({ key: 'u_1', needsRecalibration: 'nope' }).flagCount).toBe(0);
  });

  it('never lets an API-supplied colour through — user lenses are always teal', () => {
    // The endpoint has no colour column today, but the chip row renders colour
    // into an inline style, so this stays a closed door rather than a trusted
    // absence (the same reasoning as sanitizeLensColor).
    const out = normalizeUserLens({ key: 'u_1', color: 'javascript:alert(1)' });
    expect(out.color).toBe(USER_LENS_COLOR);
  });
});

describe('mergeLenses', () => {
  const editorial = [
    { key: 'federal', topicIds: FEDERAL_LENS_TOPICS },
    { key: 'judicial', topicIds: JUDICIAL_LENS_TOPICS },
  ];

  it('keeps editorial lenses first, user lenses after', () => {
    const merged = mergeLenses(editorial, [{ key: 'u_1' }, { key: 'u_2' }]);
    expect(merged.map((l) => l.key)).toEqual(['federal', 'judicial', 'u_1', 'u_2']);
  });

  it('🔴 an editorial key always wins a collision', () => {
    // Server validation restricts user keys to /^u_[a-z0-9]{4,32}$/, so this
    // should be unreachable. The chip row is a shared key namespace and lookups
    // there are `.find(l => l.key === activeLensKey)` — first match wins — so a
    // shadowing row would silently retarget an editorial chip. Structural, not
    // validated-somewhere-else.
    const merged = mergeLenses(editorial, [{ key: 'federal', name: 'Not Federal' }]);
    expect(merged.filter((l) => l.key === 'federal')).toHaveLength(1);
    expect(merged.find((l) => l.key === 'federal').name).toBeUndefined();
  });

  it('de-dupes repeated user keys, keeping the first', () => {
    const merged = mergeLenses([], [{ key: 'u_1', name: 'First' }, { key: 'u_1', name: 'Second' }]);
    expect(merged).toHaveLength(1);
    expect(merged[0].name).toBe('First');
  });

  it('tolerates missing/non-array sides', () => {
    expect(mergeLenses(null, null)).toEqual([]);
    expect(mergeLenses(editorial, undefined).map((l) => l.key)).toEqual(['federal', 'judicial']);
  });
});

describe('pruneLensTopics', () => {
  const lens = { key: 'u_1', topicIds: ['t1', 't2', 'gone'] };

  it('drops topic ids that no longer exist', () => {
    const [out] = pruneLensTopics([lens], ['t1', 't2', 't3']);
    expect(out.topicIds).toEqual(['t1', 't2']);
  });

  it('🔴 leaves every lens untouched when the topic list is empty', () => {
    // allTopics loads asynchronously. Pruning against an empty set would empty
    // every lens on first render — and because isLensCalibrated thresholds on
    // min(8, topicIds.length), a lens is not merely blanked, it is briefly
    // *un-prunable back*: a shrunken lens lowers its own calibration bar and can
    // light up as ready on fewer answers than it should need.
    expect(pruneLensTopics([lens], [])).toEqual([lens]);
    expect(pruneLensTopics([lens], null)).toEqual([lens]);
  });

  it('does not mutate the input lens', () => {
    const input = { key: 'u_1', topicIds: ['t1', 'gone'] };
    pruneLensTopics([input], ['t1']);
    expect(input.topicIds).toEqual(['t1', 'gone']);
  });

  it('compares as strings, so numeric ids still match', () => {
    const [out] = pruneLensTopics([{ key: 'u_1', topicIds: [1, 2] }], ['1', '2']);
    expect(out.topicIds).toHaveLength(2);
  });
});

describe('resolveTabLens with a custom lens', () => {
  const userLens = { key: 'u_7f3a91', topicIds: ['t1', 't2', 't3'] };
  const calibrated = userLens.topicIds.map((id) => ans(id, 3));

  it('honours a remembered custom lens per tab', () => {
    expect(resolveTabLens('representatives', { representatives: 'u_7f3a91' }, [userLens], calibrated)).toBe('u_7f3a91');
  });

  it("degrades to 'custom' once that lens is deleted — no new code needed", () => {
    // The deleted-lens path is the existing missing-lens check. Asserted so the
    // self-healing behaviour is pinned rather than assumed.
    expect(resolveTabLens('representatives', { representatives: 'u_7f3a91' }, [], calibrated)).toBe('custom');
  });

  it("degrades to 'custom' when the custom lens is not calibrated", () => {
    expect(resolveTabLens('representatives', { representatives: 'u_7f3a91' }, [userLens], [ans('t1', 3)])).toBe('custom');
  });

  it('is never a static TAB_DEFAULTS entry', () => {
    // Custom lenses are remembered, never built-in defaults — a per-user key
    // cannot be a static default without meaning something different per user.
    expect(Object.values(TAB_DEFAULTS).some((k) => String(k).startsWith('u_'))).toBe(false);
  });
});
