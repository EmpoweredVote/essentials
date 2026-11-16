/**
 * Unit tests for CategorizedStances.jsx — pure-logic only (no jsdom, no React
 * render), following the SectionBanner.test.js pattern: import the exported
 * helpers from the .jsx, and read the source text where the thing being
 * guarded is a JSX detail rather than a function.
 *
 * The source-text assertions are regression guards for three defects found in
 * review on 2026-10-15. Each one is invisible in a passing build and in a
 * screenshot, which is why they are pinned here.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { API_ORIGIN } from '../lib/apiOrigin';
import {
  groupTopicsByCategory,
  groupTitleForTopic,
  initialOpenTitle,
  quotesApiUrl,
  reconcilePicks,
  accordionTopicIdFor,
  pickedFirst,
} from './CategorizedStances.jsx';

const SRC = readFileSync(new URL('./CategorizedStances.jsx', import.meta.url), 'utf8');

const topic = (id, category) => ({
  id,
  short_title: `topic-${id}`,
  categories: category ? [{ title: category }] : [],
});

describe('groupTopicsByCategory', () => {
  it('buckets each topic under its primary category exactly once', () => {
    const topics = [
      topic(1, 'Health Care'),
      topic(2, 'Education and Schools'),
      topic(3, 'Health Care'),
    ];
    const groups = groupTopicsByCategory(topics);
    expect(groups.map((g) => g.title)).toEqual(['Health Care', 'Education and Schools']);
    expect(groups.flatMap((g) => g.topics.map((t) => t.id)).sort()).toEqual([1, 2, 3]);
  });

  it('uses only the FIRST listed category, so a multi-category topic is not duplicated', () => {
    const multi = { id: 9, categories: [{ title: 'Environment' }, { title: 'Economy' }] };
    const groups = groupTopicsByCategory([multi]);
    expect(groups).toHaveLength(1);
    expect(groups[0].title).toBe('Environment');
  });

  it('falls back to "Other Issues" when a topic has no category', () => {
    expect(groupTopicsByCategory([topic(1, null)])[0].title).toBe('Other Issues');
  });

  it('orders largest first, breaking ties alphabetically so the order is stable', () => {
    const topics = [
      topic(1, 'Zoning'),
      topic(2, 'Abortion'),
      topic(3, 'Health Care'),
      topic(4, 'Health Care'),
    ];
    expect(groupTopicsByCategory(topics).map((g) => g.title))
      .toEqual(['Health Care', 'Abortion', 'Zoning']);
  });

  it('survives an empty or missing topic list', () => {
    expect(groupTopicsByCategory([])).toEqual([]);
    expect(groupTopicsByCategory(undefined)).toEqual([]);
  });
});

describe('groupTitleForTopic', () => {
  const groups = groupTopicsByCategory([topic(1, 'Health Care'), topic(2, 'Zoning')]);

  it('finds the owning group', () => {
    expect(groupTitleForTopic(groups, 2)).toBe('Zoning');
  });

  it('compares ids as strings — a deep link carries them as text', () => {
    expect(groupTitleForTopic(groups, '2')).toBe('Zoning');
  });

  it('returns null for no id and for an id nobody owns', () => {
    expect(groupTitleForTopic(groups, null)).toBeNull();
    expect(groupTitleForTopic(groups, 999)).toBeNull();
  });
});

describe('initialOpenTitle — a group is always open', () => {
  const groups = groupTopicsByCategory([
    topic(1, 'Health Care'), topic(2, 'Health Care'), topic(3, 'Zoning'),
  ]);

  it('opens the deep-linked group when there is one', () => {
    expect(initialOpenTitle(groups, 3)).toBe('Zoning');
  });

  it('opens the largest group when there is no deep link', () => {
    // Regression guard: every group collapsed left a signed-out visitor
    // looking at a column of empty headers where four positions used to show.
    expect(initialOpenTitle(groups, null)).toBe('Health Care');
  });

  it('falls back to the largest group when the deep-linked id is not present', () => {
    expect(initialOpenTitle(groups, 999)).toBe('Health Care');
  });

  it('returns null only when there is nothing to open', () => {
    expect(initialOpenTitle([], 3)).toBeNull();
  });

  it('opens nothing under collapsedByDefault unless a topic is deep-linked', () => {
    expect(initialOpenTitle(groups, null, { collapsedByDefault: true })).toBeNull();
    expect(initialOpenTitle(groups, 999, { collapsedByDefault: true })).toBeNull();
    expect(initialOpenTitle(groups, 3, { collapsedByDefault: true })).toBe('Zoning');
  });
});

/**
 * A model of StanceAccordion's auto-open effect (ev-ui 0.16.0,
 * StanceAccordion.jsx:320-326): keyed on [initialExpandedTopicId,
 * topics.length], it calls handleToggle, which collapses a topic that is
 * already expanded. Feed it the props one accordion instance sees over a run of
 * renders and it returns the topic left expanded. There is no DOM test
 * environment here, so this stands in for rendering the real component.
 */
function expandedAfter(renders) {
  let prevDeps;
  let expanded = null;
  for (const { id, length } of renders) {
    const deps = [id, length];
    const changed = !prevDeps || deps.some((d, i) => !Object.is(d, prevDeps[i]));
    if (changed && id && length > 0) expanded = expanded === String(id) ? null : String(id);
    prevDeps = deps;
  }
  return expanded;
}

describe('a radar-label pick opens its topic once and leaves it open', () => {
  const deepLink = { isDeepLinkGroup: false, initialExpandedTopicId: undefined };
  const fresh = { id: '7', n: 1 };
  const spent = { id: '7', n: 1, spent: true };

  it('keeps the picked topic open when the group\'s topic count changes later', () => {
    // The reader clicks a label: the group opens and topic 7 expands. Then
    // research states resolve and the group gains a topic (3 → 4). Before the
    // fix the id stayed set, the effect re-fired on the new length, and 7
    // silently collapsed under the reader.
    const renders = [
      { id: accordionTopicIdFor(fresh, deepLink), length: 3 },
      { id: accordionTopicIdFor(spent, deepLink), length: 3 },
      { id: accordionTopicIdFor(spent, deepLink), length: 4 },
    ];
    expect(expandedAfter(renders)).toBe('7');
  });

  it('passes a fresh pick, withdraws a spent one, and leaves the deep link alone', () => {
    expect(accordionTopicIdFor(fresh, deepLink)).toBe('7');
    expect(accordionTopicIdFor(spent, deepLink)).toBeUndefined();
    expect(accordionTopicIdFor(undefined, { isDeepLinkGroup: true, initialExpandedTopicId: '9' })).toBe('9');
    expect(accordionTopicIdFor(undefined, { isDeepLinkGroup: false, initialExpandedTopicId: '9' })).toBeUndefined();
  });

  it('keeps a deep-linked topic open when the group\'s topic count changes later', () => {
    // Same defect on the deep-link path: the id stayed set for the life of the
    // page, so research states arriving collapsed the topic the link opened.
    const link = (spentFlag) => accordionTopicIdFor(undefined, {
      isDeepLinkGroup: true, initialExpandedTopicId: '9', deepLinkSpent: spentFlag,
    });
    const renders = [
      { id: link(false), length: 3 },
      { id: link(true), length: 3 },
      { id: link(true), length: 4 },
    ];
    expect(expandedAfter(renders)).toBe('9');
    expect(SRC).toMatch(/deepLinkSpent: spentDeepLink === String\(initialExpandedTopicId\)/);
  });

  it('drops a pick whose topic a lens change removed from the group', () => {
    // The group survives the lens change but topic 7 does not; a pick left in
    // place would have the accordion fetch context for a row it never renders.
    const before = { 'Health Care': { id: '7', n: 1, spent: true }, Economy: { id: '2', n: 2 } };
    const groups = [
      { title: 'Health Care', topics: [topic(8, 'Health Care')] },
      { title: 'Economy', topics: [topic(2, 'Economy')] },
    ];
    expect(reconcilePicks(before, groups)).toEqual({ Economy: { id: '2', n: 2 } });
  });

  it('returns the same picks object when nothing changes, so the prune is a no-op', () => {
    const picks = { Economy: { id: '2', n: 1 } };
    expect(reconcilePicks(picks, [{ title: 'Economy', topics: [topic(2, 'Economy')] }])).toBe(picks);
  });

  it('holds the picked topic first after its id is withdrawn', () => {
    const topics = [topic(1), topic(2), topic(3)];
    expect(pickedFirst(topics, { id: '3' }).map((t) => t.id)).toEqual([3, 1, 2]);
    expect(pickedFirst(topics, undefined)).toBe(topics);
    expect(pickedFirst(topics, { id: '1' })).toBe(topics);
  });

  it('marks each pick spent in an effect and prunes picks against the groups', () => {
    expect(SRC).toMatch(/\{ \.\.\.p, spent: true \}/);
    expect(SRC).toMatch(/setPicks\(\(prev\) => reconcilePicks\(prev, groups\)\)/);
    expect(SRC).toMatch(/topics=\{pickedFirst\(group\.topics, pinned\)\}/);
  });
});

describe('source guards for defects that a build and a screenshot both pass', () => {
  it('scopes initialExpandedTopicId to the group that owns the topic', () => {
    // Passed to every group, each accordion calls handleToggle for an id it
    // does not render: a context fetch fires and the spinner never resolves
    // to a visible row.
    // A radar-label pick (focusTopic) is scoped the same way, per group via `picks`.
    expect(SRC).toMatch(/const isDeepLinkGroup = group\.title === deepLinkTitle;/);
    expect(SRC).toMatch(/initialExpandedTopicId=\{accordionTopicIdFor\(pick, \{\s*isDeepLinkGroup,/);
    expect(SRC).toMatch(/const pick = picks\[group\.title\];/);
    expect(SRC).not.toMatch(/initialExpandedTopicId=\{initialExpandedTopicId\}/);
  });

  it('drops aria-controls while the group is collapsed', () => {
    // The panel it names is behind `{open && …}`, and collapsed is the
    // default, so a static aria-controls points at nothing.
    expect(SRC).toMatch(/aria-controls=\{open \? panelId : undefined\}/);
  });

  it('sets no inline background on the group header button', () => {
    // `background` is shorthand for background-color, and an inline
    // declaration beats the hover: classes — the hover state never rendered.
    const button = SRC.slice(SRC.indexOf('<button'), SRC.indexOf('</button>'));
    expect(button).toMatch(/hover:bg-slate-100/);
    expect(button).not.toMatch(/background:/);
  });

  it('reconciles a late initialExpandedTopicId in an effect, not only on mount', () => {
    // CompassContext sets it behind several awaits, so the lazy useState
    // initializer alone dropped it and the targeted topic stayed hidden.
    expect(SRC).toMatch(/useEffect\(/);
    expect(SRC).toMatch(/honouredDeepLink/);
  });

  it('prints the "Stance Breakdown" heading once, not once per group', () => {
    // Every StanceAccordion renders its own by default. Measured on a real
    // four-category profile with all groups open: four headings, four
    // duplicate h3s in the outline.
    expect(SRC).toMatch(/showHeading=\{false\}/);
    expect(SRC.match(/<h3\b/g) || []).toHaveLength(1);
    expect(SRC).toMatch(/<h3[\s\S]{0,320}?Stance Breakdown[\s\S]{0,40}?<\/h3>/);
  });

  it('hands every accordion one shared quote list instead of letting each fetch', () => {
    // quotesCache is a per-instance ref upstream, so the politician's full
    // quote list was re-requested once per group a topic was expanded in.
    expect(SRC).toMatch(/quotes=\{quotes\}/);
    expect(SRC).toMatch(/essentials\/quotes\?politician_id=/);
  });
});

describe('quotesApiUrl', () => {
  it('falls back to the API_ORIGIN that CompassCard hands StanceAccordion', () => {
    // The hoisted fetch and the accordion's fetch must not end up addressing
    // different hosts.
    expect(quotesApiUrl(undefined)).toBe(API_ORIGIN);
    expect(quotesApiUrl('')).toBe(API_ORIGIN);
  });

  it('uses a configured base URL as given', () => {
    expect(quotesApiUrl('https://api.test')).toBe('https://api.test');
  });
});
