import { describe, it, expect } from 'vitest';
import { buildTopicIndex, itemTopics, topicChoices, matchesTopic, OTHER_GROUP } from './recordTopics';

const TOPICS = [
  { id: 't1', short_title: 'Housing', topic_key: 'housing', categories: [{ title: 'Economic Policy and Labor' }] },
  { id: 't2', short_title: 'Gun Policy', topic_key: 'guns', categories: [{ title: 'Public Safety and Law Enforcement' }] },
];
const index = buildTopicIndex(TOPICS);

describe('itemTopics', () => {
  it('uses the API tags when they are served', () => {
    expect(itemTopics({ title: 'x', topic_tags: ['t1', 'Veterans'] }, index, { preview: false })).toEqual([
      { group: 'Economic Policy and Labor', label: 'Housing', compass: true },
      { group: OTHER_GROUP, label: 'Veterans', compass: false },
    ]);
  });
  it('shows no topics in production while the API serves none', () => {
    expect(itemTopics({ title: 'Shooting ranges.', topic_tags: null }, index, { preview: false })).toEqual([]);
  });
  it('fills in from titles in the dev preview, but never for ceremonial items', () => {
    expect(itemTopics({ title: 'Shooting ranges.' }, index, { preview: true })).toEqual([
      { group: 'Public Safety and Law Enforcement', label: 'Gun Policy', compass: true },
    ]);
    expect(itemTopics({ title: 'Honoring a gun club.' }, index, { preview: true, ceremonial: true })).toEqual([]);
  });
});

describe('topicChoices', () => {
  it('orders categories by count and puts other topics last', () => {
    const tagged = [
      [{ group: OTHER_GROUP }],
      [{ group: 'Public Safety and Law Enforcement' }],
      [{ group: 'Public Safety and Law Enforcement' }, { group: 'Economic Policy and Labor' }],
    ];
    expect(topicChoices(tagged, index).map((c) => [c.label, c.count])).toEqual([
      ['Public Safety', 2],
      ['Economic Policy', 1],
      ['Other topics', 1],
    ]);
  });
  it('matches everything for "all"', () => {
    expect(matchesTopic([], 'all')).toBe(true);
    expect(matchesTopic([{ group: 'x' }], 'y')).toBe(false);
  });
});
