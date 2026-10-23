import {
  test, expect, CONTENT_LIMIT_MS,
  preflightProblem, preflightProblemWithRetry, isThisAppsBuild, brokenImages,
  API_DOWN_REASON, NO_OFFICIALS_REASON,
} from './support.js';

// Checks on the journey harness itself, not on the app.

function fakeSearch(replies) {
  return {
    post: async () => {
      const { status, politicians = [{}] } = replies.shift();
      return { status: () => status, json: async () => ({ politicians }) };
    },
  };
}

test('harness: the test timeout leaves room for two slow pages', async () => {
  // The profile and Compass journeys each wait for two pages; each wait may
  // take up to CONTENT_LIMIT_MS before it counts as a failure.
  expect(test.info().timeout).toBeGreaterThanOrEqual(2 * CONTENT_LIMIT_MS + 15_000);
});

test('harness: one failed preflight call is retried before the API counts as down', async () => {
  const replies = [{ status: 500 }, { status: 200 }];
  expect(await preflightProblemWithRetry(fakeSearch(replies), { gapMs: 0 })).toBeNull();
  expect(replies).toEqual([]);
});

test('harness: an API error and an empty answer are reported differently', async () => {
  expect(await preflightProblem(fakeSearch([{ status: 503 }]))).toBe(API_DOWN_REASON);
  expect(await preflightProblem(fakeSearch([{ status: 200, politicians: [] }]))).toBe(NO_OFFICIALS_REASON);
});

test('harness: a different server on the preview port is not mistaken for this app', async () => {
  const page = (html) => ({ get: async () => ({ ok: () => true, text: async () => html }) });
  expect(await isThisAppsBuild(page('<html><head><title>Directory listing</title>'))).toBe(false);
  expect(await isThisAppsBuild(page('<html><head><title>Empowered Essentials</title>'))).toBe(true);
});

test('harness: a picture that failed to load is reported by its label', async ({ page }) => {
  await page.setContent('<main><img alt="Loaded" src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="><img alt="Broken" src="data:,"></main>');
  await expect.poll(() => brokenImages(page.locator('main'))).toEqual(['Broken']);
});
