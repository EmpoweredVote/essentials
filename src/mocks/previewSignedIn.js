// Stands in for: GET /api/compass/answers — the signed-in viewer's own compass answers
//
// Dev-only design preview. Add ?previewSignedIn to a profile URL on localhost and
// CompassContext hydrates with these sample answers, so the signed-in profile
// layout (comparison compass + stances) renders without an account. Ignored in
// production builds and never persisted — drop the param and the guest view returns.

export function isPreviewSignedIn() {
  return import.meta.env.DEV && new URLSearchParams(window.location.search).has('previewSignedIn');
}

// One sample answer (1–5, cycling) for every topic the API serves, in the
// GET /api/compass/answers row shape; the first eight topics are "selected".
export function previewAnswers(topics) {
  return {
    answers: topics.map((t, i) => ({ topic_id: t.id, value: (i % 5) + 1, write_in_text: '' })),
    selected: topics.slice(0, 8).map((t) => t.id),
  };
}
