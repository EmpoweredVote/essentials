// Topics on the legislative record: each item is filed under Compass categories (and topics the Compass
// does not cover, under "Other topics"). Tags come from the API's `topic_tags`; on localhost only, a
// stand-in fills them while the API does not (src/mocks/recordTopics.js).
import { previewTopicTags, RECORD_TOPICS_PREVIEW } from '../mocks/recordTopics';
import { shortCategory } from './recordGuide';

export const OTHER_GROUP = 'other';

/** Lookups over GET /api/compass/topics: by id, short title and key, plus the category list. */
export function buildTopicIndex(topics) {
  const byKey = new Map();
  const categories = new Map();
  for (const t of topics || []) {
    for (const k of [t.id, t.short_title, t.topic_key, t.title]) {
      if (k) byKey.set(String(k).toLowerCase(), t);
    }
    for (const c of t.categories || []) {
      if (c && c.title && !categories.has(c.title)) categories.set(c.title, shortCategory(c.title));
    }
  }
  return { byKey, categories };
}

function fromCompassTopic(topic) {
  const category = topic.categories && topic.categories[0] && topic.categories[0].title;
  return { group: category || OTHER_GROUP, label: topic.short_title || topic.title, compass: true };
}

/**
 * Normalised tags for one record item: [{ group, label, compass }], where `group` is a Compass
 * category title or OTHER_GROUP. Ceremonial items are not tagged by the stand-in.
 */
export function itemTopics(item, index, { preview = RECORD_TOPICS_PREVIEW, ceremonial = false } = {}) {
  if (!index) return [];
  const tags = Array.isArray(item && item.topic_tags) ? item.topic_tags : null;
  if (tags && tags.length) {
    return tags
      .map((tag) => {
        const key = typeof tag === 'string' ? tag : tag && (tag.id || tag.short_title || tag.name);
        if (!key) return null;
        const topic = index.byKey.get(String(key).toLowerCase());
        if (topic) return fromCompassTopic(topic);
        if (index.categories.has(key)) return { group: key, label: index.categories.get(key), compass: true };
        return { group: OTHER_GROUP, label: String(key), compass: false };
      })
      .filter(Boolean);
  }
  if (!preview || ceremonial) return [];
  return previewTopicTags(item && item.title)
    .map((t) => {
      if (t.other) return { group: OTHER_GROUP, label: t.other, compass: false };
      if (!index.categories.has(t.category)) return null;
      const topic = t.topic && index.byKey.get(t.topic.toLowerCase());
      return { group: t.category, label: topic ? topic.short_title : index.categories.get(t.category), compass: true };
    })
    .filter(Boolean);
}

/** Whether the item matches the chosen topic group ('all' matches everything). */
export function matchesTopic(topics, group) {
  if (!group || group === 'all') return true;
  return (topics || []).some((t) => t.group === group);
}

/**
 * The topic filter's choices, most items first: [{ group, label, count }], "Other topics" last.
 * `taggedItems` is a list of tag lists, one per item.
 */
export function topicChoices(taggedItems, index) {
  const counts = new Map();
  for (const tags of taggedItems) {
    for (const g of new Set(tags.map((t) => t.group))) counts.set(g, (counts.get(g) || 0) + 1);
  }
  const choices = [...counts.entries()]
    .filter(([g]) => g !== OTHER_GROUP)
    .map(([group, count]) => ({ group, label: (index && index.categories.get(group)) || shortCategory(group), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  if (counts.has(OTHER_GROUP)) choices.push({ group: OTHER_GROUP, label: 'Other topics', count: counts.get(OTHER_GROUP) });
  return choices;
}
