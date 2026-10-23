import fs from 'node:fs';
import { request } from '@playwright/test';
import { isThisAppsBuild, preflightProblemWithRetry, API_DOWN_MARKER } from './support.js';

// Runs once, after the preview server is up and before any journey.
export default async function globalSetup(config) {
  fs.rmSync(API_DOWN_MARKER, { force: true });
  const ctx = await request.newContext({ baseURL: config.projects[0].use.baseURL });
  try {
    if (!(await isThisAppsBuild(ctx))) {
      throw new Error(
        `Something other than this app's build is answering ${config.projects[0].use.baseURL}. ` +
        'Stop it and run the journeys again.',
      );
    }
    const problem = await preflightProblemWithRetry(ctx);
    if (problem) {
      fs.writeFileSync(API_DOWN_MARKER, `${problem}\n`);
      console.warn(`Preflight failed: ${problem}. Every journey will be skipped.`);
    }
  } finally {
    await ctx.dispose();
  }
}
