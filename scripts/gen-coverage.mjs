// AUTO-GENERATES public/coverage.json from src/lib/coverage.js (the single source of truth).
// Vite copies public/ -> dist/, so the catalog ships at the site root: /coverage.json.
//
// This is the reciprocal of Treasury Tracker's /treasury/cities: a public, unauthenticated,
// CORS-enabled coverage catalog that lets TT learn which locations Essentials covers, so TT's
// banner can tether back into Essentials only where a real target exists.
// Contract: treasury-tracker .planning/phases/125-essentials-coverage-contract/ (shape "1b").
//
// Regenerate:  npm run gen:coverage   (also runs automatically via the `prebuild` hook)
//
// NOTE: Deliverable 2 (the national-officials browse route `?browse_federal_officials=1`) is LIVE,
// so the `federal` record is now emitted. It points at the national-officials browse target.

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  COVERAGE_STATES,
  COVERAGE_COUNTIES,
  COVERAGE_BROWSE_STATES,
} from '../src/lib/coverage.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../public/coverage.json');

// cities: flatten every covered area under each state.
// geoids is ALWAYS an array (single -> ["…"], geoid-less like Bloomington IN -> []).
// GEOID strings are preserved verbatim from coverage.js (leading zeros matter).
const cities = COVERAGE_STATES.flatMap((s) =>
  s.areas.map((a) => ({
    label: a.label,
    geoids: a.browseGovernmentList ?? [],
    state: a.browseStateAbbrev ?? s.abbrev,
    hasContext: !!a.hasContext,
  }))
);

const counties = COVERAGE_COUNTIES.map((c) => ({
  label: c.label,
  geoids: c.browseGovernmentList ?? [],
  state: c.browseStateAbbrev,
  hasContext: !!c.hasContext,
}));

// states: all 50 browsable states (DC excluded upstream — no statewide executives seeded).
const states = COVERAGE_BROWSE_STATES.map((s) => ({
  label: s.label,
  abbrev: s.browseState,
}));

// COVERAGE_SCHOOL_DISTRICTS is intentionally excluded — TT has no matching tier this milestone.

const catalog = {
  generatedAt: new Date().toISOString(),
  cities,
  counties,
  states,
  // Deliverable 2 (national-officials browse) is live — federal record enabled.
  federal: {
    label: 'United States',
    target: '/results?browse_federal_officials=1&browse_label=United+States',
  },
};

// Fail fast rather than ship a truncated catalog (mirrors gen-population.mjs).
if (cities.length < 1 || states.length < 50) {
  console.error(
    `gen-coverage: refusing to write — got ${cities.length} cities, ${states.length} states ` +
      `(expected >=1 city and 50 states). coverage.js may be broken.`
  );
  process.exit(1);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(catalog, null, 2) + '\n', 'utf8');
console.log(
  `coverage.json written: ${cities.length} cities, ${counties.length} counties, ` +
    `${states.length} states, federal record included -> ${OUT}`
);
