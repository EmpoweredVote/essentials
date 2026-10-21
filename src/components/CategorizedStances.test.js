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

describe('source guards for defects that a build and a screenshot both pass', () => {
  it('scopes initialExpandedTopicId to the group that owns the topic', () => {
    // Passed to every group, each accordion calls handleToggle for an id it
    // does not render: a context fetch fires and the spinner never resolves
    // to a visible row.
    expect(SRC).toMatch(/initialExpandedTopicId=\{group\.title === deepLinkTitle \? initialExpandedTopicId : undefined\}/);
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
    expect(button).toMatch(/hover:bg-gray-50/);
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
