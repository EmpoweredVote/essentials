import { test, expect, apiIsUpWithRetry, CONTENT_LIMIT_MS } from './support.js';

// Checks on the journey harness itself, not on the app.

test('harness: the test timeout leaves room for two slow pages', async () => {
  // The profile and Compass journeys each wait for two pages; each wait may
  // take up to CONTENT_LIMIT_MS before it counts as a failure.
  expect(test.info().timeout).toBeGreaterThanOrEqual(2 * CONTENT_LIMIT_MS + 15_000);
});

test('harness: one failed preflight call is retried before the API counts as down', async () => {
  const replies = [500, 200];
  const fake = {
    post: async () => {
      const status = replies.shift();
      return { status: () => status, json: async () => ({ politicians: [{}] }) };
    },
  };
  expect(await apiIsUpWithRetry(fake, { gapMs: 0 })).toBe(true);
  expect(replies).toEqual([]);
});
