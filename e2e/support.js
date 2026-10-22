import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test as base, expect } from '@playwright/test';
import { PREVIEW_PORT } from './constants.js';

const BASE_URL = `http://localhost:${PREVIEW_PORT}`;

// Stable input: LA City Hall area. Council District 14, LA County supervisor D1.
export const API_PINNED_ADDRESS = '500 W Temple St, Los Angeles, CA 90012';

// Written by global-setup.js when the preflight fails. Its presence turns every
// journey into a skip ("couldn't run"), so a live-API outage does not block a PR.
export const API_DOWN_MARKER = path.join(path.dirname(fileURLToPath(import.meta.url)), '.api-down');
export const API_DOWN_REASON = "couldn't run — live API down";

// True when the live API, reached through the preview proxy, returns officials
// for the pinned address.
export async function apiIsUp(request) {
  try {
    const res = await request.post('/api/essentials/candidates/search', {
      data: { query: API_PINNED_ADDRESS },
      timeout: 30_000,
    });
    if (res.status() !== 200) return false;
    const body = await res.json();
    const list = Array.isArray(body) ? body : body?.politicians;
    return Array.isArray(list) && list.length > 0;
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

// The preflight. One failed call is retried after a pause, so a brief network
// blip does not skip every journey and report the commit as checked.
export async function apiIsUpWithRetry(request, { attempts = 2, gapMs = 5_000 } = {}) {
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, gapMs));
    if (await apiIsUp(request)) return true;
  }
  return false;
}

export const test = base.extend({
  // Runs around every test: skips when the preflight failed, blocks analytics,
  // and fails the test on an uncaught page error or a 5xx from our own API —
  // breaks a user would see even when every assertion passed.
  guard: [async ({ page }, use, testInfo) => {
    testInfo.skip(fs.existsSync(API_DOWN_MARKER), API_DOWN_REASON);

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
