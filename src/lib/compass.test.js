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

import { describe, it, expect } from 'vitest';
import { computeDisplaySpokes, LOCAL_LENS_TOPICS } from './compass.js';

const topic = (id, short_title) => ({ id, short_title });
const ans = (topic_id, value = 4) => ({ topic_id, value });

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
