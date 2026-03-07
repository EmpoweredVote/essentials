// src/lib/compass.js
const API = import.meta.env.VITE_API_URL || "/api";

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

// User's compass answers: [{ topic_id, value, write_in_text }, ...]
// Returns [] if the user is not logged in (401) or on any network error.
export async function fetchUserAnswers() {
  try {
    const res = await fetch(`${API}/compass/answers`, {
      credentials: "include",
    });
    if (res.status === 401) return [];
    if (!res.ok) throw new Error(`fetchUserAnswers failed: ${res.status}`);
    return res.json();
  } catch (err) {
    console.error("fetchUserAnswers error:", err);
    return [];
  }
}

// User's selected topic IDs: string[]
// Returns [] if the user is not logged in (401) or on any network error.
export async function fetchSelectedTopics() {
  try {
    const res = await fetch(`${API}/compass/selected-topics`, {
      credentials: "include",
    });
    if (res.status === 401) return [];
    if (!res.ok) throw new Error(`fetchSelectedTopics failed: ${res.status}`);
    return res.json();
  } catch (err) {
    console.error("fetchSelectedTopics error:", err);
    return [];
  }
}

// Politicians that have compass stances: [{ id, first_name, last_name, ... }]
// Public endpoint — returns [] on any error.
export async function fetchPoliticiansWithStances() {
  try {
    const res = await fetch(`${API}/compass/politicians`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error(`fetchPoliticiansWithStances failed: ${res.status}`);
    return res.json();
  } catch (err) {
    console.error("fetchPoliticiansWithStances error:", err);
    return [];
  }
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
