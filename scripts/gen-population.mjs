/**
 * Census Population Bundle Generator (Phase 188 — Location Stats Strip)
 *
 * Pulls US Census ACS 5-Year 2023 total-population data (variable B01003_001E) for
 * every US place + every state + the national total, and writes a committed static
 * bundle at src/data/population.js exporting:
 *   - POP_BY_FIPS         FIPS (or literal "US") -> population number
 *   - NAME_STATE_TO_FIPS  "lowercased place name|STATE_ABBREV" -> 7-digit place GEOID
 *
 * D-01/D-02: no runtime Census access — this script runs at build time only, on demand.
 * Never commits CENSUS_API_KEY; the key is read from the environment and never written
 * to the generated file.
 *
 * Usage:
 *   CENSUS_API_KEY=your-key node scripts/gen-population.mjs
 *   (or: npm run gen:population, with CENSUS_API_KEY exported in the shell)
 *
 * Free key signup: https://api.census.gov/data/key_signup.html
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { STATE_FIPS_TO_ABBREV } from '../src/lib/buildingImages.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '..', 'src', 'data', 'population.js');

const KEY = process.env.CENSUS_API_KEY;
if (!KEY) {
  console.error(
    'ERROR: CENSUS_API_KEY is not set.\n' +
      'Obtain a free key at https://api.census.gov/data/key_signup.html\n' +
      'then run: CENSUS_API_KEY=your-key node scripts/gen-population.mjs'
  );
  process.exit(1);
}

const VINTAGE = 2023;
const BASE = `https://api.census.gov/data/${VINTAGE}/acs/acs5`;
const VARIABLE = 'B01003_001E'; // Total Population

/**
 * Fetch a Census ACS5 query and return the data rows (header row stripped).
 * @param {string} qs querystring fragment, e.g. "for=place:*&in=state:*"
 * @returns {Promise<string[][]>}
 */
async function pull(qs) {
  const url = `${BASE}?get=NAME,${VARIABLE}&${qs}&key=${KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Census request failed (${res.status}) for ${qs}`);
  }
  const rows = await res.json(); // [header, ...data] — array-of-arrays
  if (!Array.isArray(rows) || rows.length < 1) {
    throw new Error(`Unexpected Census response shape for ${qs}: ${JSON.stringify(rows).slice(0, 200)}`);
  }
  return rows.slice(1); // drop header row
}

// Strip Census NAME geography suffixes to get the bare place name, mirroring
// getBuildingImages' lowercase/uppercase normalization (buildingImages.js:490-492).
const NAME_SUFFIX_RE = /\s+(city|town|village|borough|CDP|municipality)(\s+\(balance\))?,.*$/i;
function bareName(censusName) {
  return censusName.replace(NAME_SUFFIX_RE, '').trim();
}

console.log(`Fetching Census ACS5 ${VINTAGE} population data (variable ${VARIABLE})...`);

const places = await pull('for=place:*&in=state:*'); // cols: NAME, pop, state, place
console.log(`  places: ${places.length} rows`);

const states = await pull('for=state:*'); // cols: NAME, pop, state
console.log(`  states: ${states.length} rows`);

const us = await pull('for=us:1'); // cols: NAME, pop, us
console.log(`  us: ${us.length} rows`);

// Fail-fast assertions (Pitfall 1) — never write a bundle from a short/error response.
if (places.length <= 20000) {
  console.error(`ERROR: places.length (${places.length}) is not > 20000 — aborting write.`);
  process.exit(1);
}
if (states.length < 50) {
  console.error(`ERROR: states.length (${states.length}) is not >= 50 — aborting write.`);
  process.exit(1);
}
if (us.length !== 1 || !us[0] || Number.isNaN(Number(us[0][1]))) {
  console.error('ERROR: us pull did not return exactly one valid row — aborting write.');
  process.exit(1);
}

// Build POP_BY_FIPS. Keys are ALWAYS strings with leading zeros preserved (Pitfall 2).
const POP_BY_FIPS = {};
POP_BY_FIPS['US'] = Number(us[0][1]);

for (const row of states) {
  // [NAME, pop, state]
  const [, pop, stateFips] = row;
  POP_BY_FIPS[stateFips] = Number(pop);
}

let placeCollisions = 0;
for (const row of places) {
  // [NAME, pop, state, place]
  const [, pop, stateFips, placeFips] = row;
  const geoId = `${stateFips}${placeFips}`; // 7-digit place GEOID, string concatenation
  POP_BY_FIPS[geoId] = Number(pop);
}

// Build NAME_STATE_TO_FIPS index (D-03 fallback path for address-search mode).
const NAME_STATE_TO_FIPS = {};
for (const row of places) {
  const [name, , stateFips, placeFips] = row;
  const abbrev = STATE_FIPS_TO_ABBREV[stateFips];
  if (!abbrev) continue; // territory/unknown FIPS not in our 51-entry map — skip index entry
  const geoId = `${stateFips}${placeFips}`;
  const key = `${bareName(name).toLowerCase()}|${abbrev}`;
  if (NAME_STATE_TO_FIPS[key] != null && NAME_STATE_TO_FIPS[key] !== geoId) {
    placeCollisions += 1;
    console.warn(`  collision: "${key}" already -> ${NAME_STATE_TO_FIPS[key]}, skipping duplicate -> ${geoId}`);
    continue; // first-write-wins; browse geo_id path (D-05 primary) is unaffected
  }
  NAME_STATE_TO_FIPS[key] = geoId;
}
if (placeCollisions > 0) {
  console.warn(`  ${placeCollisions} name+state index collision(s) logged above (non-fatal, D-05 fallback only).`);
}

const placeCount = places.length;
const stateCount = states.length;
const nameIndexCount = Object.keys(NAME_STATE_TO_FIPS).length;
const regenDate = new Date().toISOString().slice(0, 10);

const header = `// AUTO-GENERATED by scripts/gen-population.mjs — DO NOT EDIT BY HAND.
// Source: US Census ACS 5-Year ${VINTAGE} (${VARIABLE}, Total Population).
// Regenerated: ${regenDate}.
// Rows: places=${placeCount}, states=${stateCount}, us=1. Name index entries: ${nameIndexCount}.
// Regenerate: CENSUS_API_KEY=... node scripts/gen-population.mjs
//   (free key: https://api.census.gov/data/key_signup.html)

// FIPS -> population. Keys:
//   place  = 7-digit place GEOID (2-digit state FIPS + 5-digit place FIPS), e.g. "0644000"
//   state  = 2-digit state FIPS, e.g. "48"
//   nation = the literal "US"
// All keys are strings with leading zeros preserved — never coerce a FIPS to a number.
export const POP_BY_FIPS = ${JSON.stringify(POP_BY_FIPS)};

// name+state -> place GEOID. Mirrors getBuildingImages key normalization
// (src/lib/buildingImages.js): lowercased bare place name (Census NAME with the
// " city, State" / " town, State" / " village, State" / " CDP, State" /
// " (balance), State" suffix stripped) + "|" + 2-letter state abbrev.
export const NAME_STATE_TO_FIPS = ${JSON.stringify(NAME_STATE_TO_FIPS)};
`;

writeFileSync(OUT_PATH, header, 'utf8');
console.log(`Wrote ${OUT_PATH}`);
console.log(`  POP_BY_FIPS entries: ${Object.keys(POP_BY_FIPS).length}`);
console.log(`  NAME_STATE_TO_FIPS entries: ${nameIndexCount}`);
