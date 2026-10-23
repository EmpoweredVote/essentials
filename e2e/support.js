import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test as base, expect } from '@playwright/test';
import { PREVIEW_PORT } from './constants.js';

const BASE_URL = `http://localhost:${PREVIEW_PORT}`;

// Stable input: LA City Hall area. Council District 14, LA County supervisor D1.
export const API_PINNED_ADDRESS = '500 W Temple St, Los Angeles, CA 90012';

// Written by global-setup.js when the preflight fails, holding the reason. Its
// presence turns every journey into a skip ("couldn't run"), so a live-API
// outage or a data problem in production does not block a PR.
export const API_DOWN_MARKER = path.join(path.dirname(fileURLToPath(import.meta.url)), '.api-down');
export const API_DOWN_REASON = "couldn't run — live API down";
export const NO_OFFICIALS_REASON = "couldn't run — live API is up but returned no officials for the pinned address";

// null when the live API, reached through the preview proxy, returns officials
// for the pinned address; otherwise the reason it did not.
export async function preflightProblem(request) {
  try {
    const res = await request.post('/api/essentials/candidates/search', {
      data: { query: API_PINNED_ADDRESS },
      timeout: 30_000,
    });
    if (res.status() !== 200) return API_DOWN_REASON;
    const body = await res.json();
    const list = Array.isArray(body) ? body : body?.politicians;
    return Array.isArray(list) && list.length > 0 ? null : NO_OFFICIALS_REASON;
  } catch {
    return API_DOWN_REASON;
  }
}

// True when the preview port serves this app's build, not some other server
// left running there (locally Playwright reuses whatever answers the port).
export async function isThisAppsBuild(request) {
  try {
    const res = await request.get('/');
    return res.ok() && (await res.text()).includes('<title>Empowered Essentials</title>');
  } catch {
    return false;
  }
}

// A user's main content should show within 5 s. Past that the journey still
// passes but is reported as slow; past 15 s it fails. The live API is shared
// with real users and sometimes slows for reasons a PR cannot cause (a profile
// opened right after a results page measured 4-7 s on production, 2026-10-21),
// so a hard 5 s limit would block good PRs.
export const CONTENT_BUDGET_MS = 5_000;
export const CONTENT_LIMIT_MS = 15_000;
export const SLOW_PAGES_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'test-results', 'slow-pages.txt');

export async function expectShownInTime(locator, what) {
  const started = Date.now();
  await expect(locator, `${what} did not show within ${CONTENT_LIMIT_MS / 1000} s`)
    .toBeVisible({ timeout: CONTENT_LIMIT_MS });
  const ms = Date.now() - started;
  if (ms > CONTENT_BUDGET_MS) {
    const note = `${what} took ${(ms / 1000).toFixed(1)} s (budget ${CONTENT_BUDGET_MS / 1000} s)`;
    base.info().annotations.push({ type: 'slow', description: note });
    fs.mkdirSync(path.dirname(SLOW_PAGES_FILE), { recursive: true });
    fs.appendFileSync(SLOW_PAGES_FILE, `${base.info().project.name}: ${note}\n`);
  }
}

// The preflight. A failed check is retried after a pause, so a brief network
// blip does not skip every journey and report the commit as checked.
export async function preflightProblemWithRetry(request, { attempts = 2, gapMs = 5_000 } = {}) {
  let problem = null;
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, gapMs));
    problem = await preflightProblem(request);
    if (!problem) return null;
  }
  return problem;
}

// Labels of visible pictures inside `scope` that finished loading with nothing
// to show (a broken link). Pictures still loading are not counted.
export function brokenImages(scope) {
  return scope.evaluate((el) => [...el.querySelectorAll('img')]
    .filter((img) => img.offsetParent !== null && img.complete && img.naturalWidth === 0)
    .map((img) => img.alt || img.currentSrc || img.src));
}

export const test = base.extend({
  // Runs around every test: skips when the preflight failed, blocks analytics,
  // and fails the test on an uncaught page error or a 5xx from our own API —
  // breaks a user would see even when every assertion passed.
  guard: [async ({ page }, use, testInfo) => {
    if (fs.existsSync(API_DOWN_MARKER)) {
      testInfo.skip(true, fs.readFileSync(API_DOWN_MARKER, 'utf8').trim() || API_DOWN_REASON);
    }

    // Keep the bot out of analytics and the Maze survey widget.
    await page.route(/posthog|maze\.co/, (route) => route.abort());

    const problems = [];
    page.on('pageerror', (err) => problems.push(`Page error: ${err.message}`));
    page.on('response', (res) => {
      if (res.url().startsWith(`${BASE_URL}/api/`) && res.status() >= 500) {
        problems.push(`API ${res.status()} on ${res.request().method()} ${res.url()}`);
      }
    });

    await use();

    expect(problems, 'The page threw an error or our API failed').toEqual([]);
  }, { auto: true }],
});

export { expect };
