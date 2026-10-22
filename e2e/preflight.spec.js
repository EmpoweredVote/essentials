import { test, expect, apiIsUp } from './support.js';

// Not a journey: proves the live API answers through the preview proxy. When
// this fails every journey is skipped as "couldn't run", not failed.
test('live API answers the pinned address', async ({ request }) => {
  expect(await apiIsUp(request)).toBe(true);
});
