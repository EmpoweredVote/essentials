// src/lib/compass.js
const API = import.meta.env.VITE_API_URL || "https://ev-backend-h3n8.onrender.com";

// All topics (full topic objects: { id, short_title, stances, ... })
export async function fetchTopics() {
  const res = await fetch(`${API}/compass/topics`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`fetchTopics failed: ${res.status}`);
  return res.json();
}
// Politician answers: [{ topic_id, value }, ...]
export async function fetchPoliticianAnswers(politicianId) {
  const res = await fetch(
    `${API}/compass/politicians/${politicianId}/answers`,
    { credentials: "include" }
  );
  if (!res.ok) throw new Error(`fetchPoliticianAnswers failed: ${res.status}`);
  return res.json();
}

/**
 * Build { [short_title]: value } only for the allowed short titles.
 * Any missing answers default to 0.
 */
export function buildAnswerMapByShortTitle(
  allTopics,
  allAnswers,
  allowedShorts
) {
  const allowed = new Set(allowedShorts.map((s) => s.toLowerCase()));
  const topicById = new Map(allTopics.map((t) => [t.id, t]));
  const shortById = new Map(allTopics.map((t) => [t.id, t.short_title]));

  // Initialize with 0 for each allowed short title
  const out = {};
  for (const t of allTopics) {
    if (allowed.has(String(t.short_title).toLowerCase())) {
      out[t.short_title] = 0;
    }
  }

  // Fill in any provided answers that match our allowed set
  for (const a of allAnswers) {
    const st = shortById.get(a.topic_id);
    if (!st) continue;
    if (allowed.has(String(st).toLowerCase())) {
      out[st] = a.value ?? 0;
    }
  }

  // Return topics filtered to our allowed set too (preserve full objects)
  const topicsFiltered = allTopics.filter((t) =>
    allowed.has(String(t.short_title).toLowerCase())
  );

  return { topicsFiltered, answersByShort: out };
}
