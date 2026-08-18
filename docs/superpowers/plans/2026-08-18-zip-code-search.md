# ZIP Code Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a visitor type a 5-digit ZIP into the search box and get every official who serves any part of it, including the genuine duplication where a ZIP spans district lines.

**Architecture:** ZIP polygons (Census ZCTAs) already have a home in `essentials.geofence_boundaries` as `mtfcc='G6350'` — currently Indiana-only. We import them nationwide (simplified), add an *area*-based resolver alongside the existing *point* resolver, and surface it through the existing `GET /essentials/candidates/:zip` route (today a stub that ignores the ZIP). The frontend gains a `'zip'` input kind and a `?zip=` Results mode that speaks in area voice — "Officials serving 46220" — never claiming a given official is the visitor's own.

**Tech Stack:** Express/TypeScript backend (`C:\EV-Accounts\backend`), PostGIS on Supabase, `pg` Pool (`lib/db.ts`), vitest + supertest (backend), React 19 + Vite + react-router (`C:\Transparent Motivations\essentials`), vitest (frontend, **pure functions only** — no jsdom, no testing-library), ogr2ogr + psql for the import.

**Spec:** `docs/superpowers/specs/2026-08-18-zip-code-search-design.md` (in the `essentials` repo)

## Global Constraints

- **Two repos.** Backend work is in `C:\EV-Accounts` (branch `master`, auto-deploys to Render on push). Frontend work is in `C:\Transparent Motivations\essentials` (branch `main`, auto-deploys to Render on push). Never `cd` between them in one command — use `git -C`.
- **`'G6350'` must be excluded from the district-join fallback clause BEFORE any nationwide ZCTA data lands.** Task 1 is a hard prerequisite of Task 6. Shipping data first exposes the *existing address path* to wrong joins.
- **Every spatial query is one predicate per branch with an explicit `OPERATOR(public.&&)` prefilter.** Never an `OR` of mixed-direction spatial predicates — that cannot drive `idx_geofence_boundaries_geometry` and caused a measured 4,286 ms Parallel Seq Scan in the 2026-07-01 browse-stall regression.
- **Schema-qualify PostGIS.** Use `public.ST_*` and `OPERATOR(public.&&)` — the app role's `search_path` does not include `public`.
- **Upsert key is `(geo_id, mtfcc)`**, never `geo_id` alone. `geo_id` is not unique in `geofence_boundaries` (`46220` could collide across layers).
- **Explicit field whitelists.** DB rows are never spread into responses (`essentialsService.ts` house rule, enforced by `architecture.test.ts`).
- **No service-role client in `src/routes/`** — `architecture.test.ts` bans it. All DB access goes through `src/lib/`.
- **Area share threshold is presentation-only: 2%.** Nothing is dropped server-side. A hard server cutoff would lose Bloomington from 47401.
- **Multi-state floor: `share >= 0.01`.**
- **Simplification tolerance: `0.0005` degrees (~55 m).**
- **Frontend tests are pure functions.** There is no React test harness in `essentials` (no jsdom, no `@testing-library`). Logic that needs testing gets extracted into `src/lib/*.js` with a colocated `*.test.js`; component wiring is verified in the browser.

### Verified facts (measured 2026-08-18 — do not re-litigate)

| Fact | Value |
|---|---|
| ZCTA polygons present | Indiana only — 807 rows, `mtfcc='G6350'`, `source='census_tiger_2024'` |
| `G6350` references in `EV-Accounts` source | **Zero** (full-repo grep) |
| CTE-supplied geometry drives the GIST index | **Yes** — `Index Scan using idx_geofence_boundaries_geometry`, CTE as InitPlan, 43 ms for 46220 |
| `geofence_boundaries.geometry` type | generic `GEOMETRY`, SRID 4326 (no MULTIPOLYGON constraint) |
| `geofence_boundaries.state` | `bpchar(2)`, **nullable**, holds state FIPS (`'18'` for Indiana) |
| Unique index for upsert | `geofence_boundaries_geo_id_mtfcc_key` on `(geo_id, mtfcc)` |
| FIPS/USPS maps | `FIPS_TO_USPS`, `USPS_TO_FIPS` in `backend/src/lib/usStateCodes.ts` |
| `tl_2024_us_zcta520.zip` | 529 MB, ~33.8k polygons, one nationwide file (no per-state slices) |

### Ground truth for tests (queried live against the Indiana ZCTAs)

| ZIP | US House | State Senate | State House | Places (any) | Places (>=2%) |
|---|---|---|---|---|---|
| 46220 | 1 | 3 | **4** | 2 | 1 |
| 46032 | 1 | 3 | 3 | 2 | 2 |
| 47401 | 1 | 2 | 2 | 1 | 1 |
| 46360 | 1 | 2 | 2 | **7** | **1** |

---

## File Structure

**Backend (`C:\EV-Accounts\backend`)**

| File | Responsibility |
|---|---|
| `src/lib/geoIdGuard.ts` | *Modify.* Becomes the single source of truth for the fallback MTFCC exclusion list; gains `'G6350'`. |
| `src/lib/geoIdGuard.test.ts` | *Create.* Guards the exclusion list and its rendering into both SQL copies. |
| `src/lib/essentialsService.ts` | *Modify.* Consumes the shared exclusion list; gains `buildDistrictQuery()`, `resolveOfficialsInArea()`, `getOfficialsByZip()`. |
| `src/lib/essentialsService.area.test.ts` | *Create.* Pure-function tests for share/ambiguity/state rollups. |
| `src/lib/candidateService.ts` | *Modify.* Delete the dead `getCandidatesByZip` stub. |
| `src/routes/essentialsCandidates.ts` | *Modify.* `GET /:zip` calls the real resolver and returns the new wrapper. |
| `src/routes/essentialsCandidates.test.ts` | *Modify.* Retarget the `:zip` mocks at `getOfficialsByZip`. |
| `scripts/load-zcta-boundaries.sh` | *Create.* Nationwide ZCTA import, idempotent and resumable. |

**Frontend (`C:\Transparent Motivations\essentials`)**

| File | Responsibility |
|---|---|
| `src/lib/inputClassifier.js` | *Modify.* Adds the `'zip'` kind ahead of the address checks. |
| `src/lib/inputClassifier.test.js` | *Modify.* Two existing assertions invert deliberately (see Task 7). |
| `src/lib/localitySearch.js` | *Modify.* Adds `zipRoute(zip)`. |
| `src/lib/zipResults.js` | *Create.* Pure helpers: share split, ambiguity copy, heading label. |
| `src/lib/zipResults.test.js` | *Create.* Tests for the above. |
| `src/lib/api.jsx` | *Modify.* `fetchOfficialsByZip()` replaces the dead `fetchCandidates()`. |
| `src/components/LocationCombobox.jsx` | *Modify.* `'zip'` gets an Enter-hint row and dispatches `onSubmitZip`. |
| `src/pages/Landing.jsx` | *Modify.* Wires `onSubmitZip` to `zipRoute`. |
| `src/pages/Results.jsx` | *Modify.* `?zip=` entry mode, area voice, banner guard. |

---

## Task 1: Guard `G6350` out of the district-join fallback

The district join's last clause is a catch-all: `OR (gb.mtfcc NOT IN (...) AND gb.mtfcc NOT LIKE 'X%')` — meaning *match any district type for this geo_id*. `G6350` is in neither list, so a ZCTA row falls through and joins to any district whose `geo_id` equals the ZIP string. The list is currently duplicated verbatim in two files; this task makes it one constant and adds `'G6350'`.

**Files:**
- Modify: `C:\EV-Accounts\backend\src\lib\geoIdGuard.ts`
- Modify: `C:\EV-Accounts\backend\src\lib\essentialsService.ts` (the `districtQueryText` fallback clause, ~line 764)
- Test: `C:\EV-Accounts\backend\src\lib\geoIdGuard.test.ts` (create)

**Interfaces:**
- Consumes: nothing.
- Produces: `FALLBACK_EXCLUDED_MTFCCS: readonly string[]` and `FALLBACK_EXCLUDED_MTFCC_SQL_LIST: string` (a comma-joined, single-quoted SQL list, e.g. `'G5210','G5220',...`), both exported from `lib/geoIdGuard.js`. Task 2 and Task 3 both interpolate `FALLBACK_EXCLUDED_MTFCC_SQL_LIST`.

- [ ] **Step 1: Write the failing test**

Create `C:\EV-Accounts\backend\src\lib\geoIdGuard.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  FALLBACK_EXCLUDED_MTFCCS,
  FALLBACK_EXCLUDED_MTFCC_SQL_LIST,
  MTFCC_DISTRICT_TYPE_GUARD,
} from './geoIdGuard.js';

describe('fallback MTFCC exclusion list', () => {
  it("excludes G6350 so a ZCTA can never join to a district by bare geo_id", () => {
    // A ZIP polygon has no districts. Without this, geo_id '46220' would match
    // any district row that happens to carry '46220' via the catch-all clause.
    expect(FALLBACK_EXCLUDED_MTFCCS).toContain('G6350');
  });

  it('renders the list as a single-quoted SQL IN list', () => {
    expect(FALLBACK_EXCLUDED_MTFCC_SQL_LIST).toContain("'G6350'");
    expect(FALLBACK_EXCLUDED_MTFCC_SQL_LIST).toContain("'G5200V26'");
    expect(FALLBACK_EXCLUDED_MTFCC_SQL_LIST.startsWith("'")).toBe(true);
  });

  it('builds the guard SQL from the shared list so the copies cannot drift', () => {
    expect(MTFCC_DISTRICT_TYPE_GUARD).toContain(FALLBACK_EXCLUDED_MTFCC_SQL_LIST);
  });

  it('leaves no hard-coded duplicate of the list in essentialsService.ts', () => {
    // Drift guard: the second copy of this list used to live inline in the
    // districtQueryText fallback clause. It must now interpolate the constant.
    const src = readFileSync('src/lib/essentialsService.ts', 'utf8');
    expect(src).not.toContain("'G5400','G5410','G5420','G5200V26'");
    expect(src).toContain('FALLBACK_EXCLUDED_MTFCC_SQL_LIST');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /c/EV-Accounts/backend && npx vitest run src/lib/geoIdGuard.test.ts`
Expected: FAIL — `FALLBACK_EXCLUDED_MTFCCS` is not exported from `./geoIdGuard.js`.

- [ ] **Step 3: Add the shared constants to `geoIdGuard.ts`**

Insert above `export const MTFCC_DISTRICT_TYPE_GUARD`:

```ts
/**
 * MTFCCs that must NOT reach the district-join catch-all clause.
 *
 * The catch-all (`mtfcc NOT IN (...) AND mtfcc NOT LIKE 'X%'`) means "match any
 * district_type for this geo_id", so any layer NOT listed here joins to a
 * district purely on a bare geo_id string match.
 *
 * G5200V26: 2026-vintage congressional boundaries — only the elections opt-in
 *   join (electionService.ts) may resolve against it.
 * G6350: ZIP Code Tabulation Areas. A ZCTA has no districts of its own, and its
 *   geo_id is a bare 5-digit ZIP ('46220') that can collide with district geo_ids.
 *   ZIPs resolve by AREA OVERLAP (resolveOfficialsInArea), never by geo_id.
 *
 * SINGLE SOURCE OF TRUTH — essentialsService.ts's districtQueryText interpolates
 * FALLBACK_EXCLUDED_MTFCC_SQL_LIST rather than restating the list.
 */
export const FALLBACK_EXCLUDED_MTFCCS: readonly string[] = [
  'G5210', 'G5220', 'G5200', 'G4020', 'G4040', 'G4110', 'G4120',
  'G5400', 'G5410', 'G5420', 'G5200V26', 'G6350',
];

/** The same list rendered for a SQL `IN (...)` clause. */
export const FALLBACK_EXCLUDED_MTFCC_SQL_LIST: string =
  FALLBACK_EXCLUDED_MTFCCS.map((m) => `'${m}'`).join(',');
```

Then replace the final clause inside `MTFCC_DISTRICT_TYPE_GUARD` — this line:

```
    OR (gp.mtfcc NOT IN ('G5210','G5220','G5200','G4020','G4040','G4110','G4120','G5400','G5410','G5420','G5200V26') AND gp.mtfcc NOT LIKE 'X%')
```

with:

```
    OR (gp.mtfcc NOT IN (${FALLBACK_EXCLUDED_MTFCC_SQL_LIST}) AND gp.mtfcc NOT LIKE 'X%')
```

- [ ] **Step 4: Update `essentialsService.ts` to interpolate the shared list**

Add to the existing import block near the top of `src/lib/essentialsService.ts`:

```ts
import { FALLBACK_EXCLUDED_MTFCC_SQL_LIST } from './geoIdGuard.js';
```

In `districtQueryText`, replace these two lines:

```
        OR (gb.mtfcc NOT IN ('G5210','G5220','G5200','G4020','G4040','G4110','G4120','G5400','G5410','G5420','G5200V26')
            AND gb.mtfcc NOT LIKE 'X%')
```

with:

```
        OR (gb.mtfcc NOT IN (${FALLBACK_EXCLUDED_MTFCC_SQL_LIST})
            AND gb.mtfcc NOT LIKE 'X%')
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd /c/EV-Accounts/backend && npx vitest run src/lib/geoIdGuard.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 6: Run the full backend suite for regressions**

Run: `cd /c/EV-Accounts/backend && npm test`
Expected: PASS. The guard string changed only by rendering the identical list plus `'G6350'` — no existing layer's behavior moves.

- [ ] **Step 7: Commit**

```bash
git -C /c/EV-Accounts add backend/src/lib/geoIdGuard.ts backend/src/lib/geoIdGuard.test.ts backend/src/lib/essentialsService.ts
git -C /c/EV-Accounts commit -m "fix(geo): exclude G6350 from the district-join catch-all

A ZCTA has no districts, but the fallback clause means 'match any
district_type for this geo_id' — so a ZIP polygon would join to any
district row carrying the bare ZIP string. Prerequisite of the
nationwide ZCTA import: without it the existing ADDRESS path inherits
the wrong join the moment the data lands.

Also collapses the list's two verbatim copies into one exported
constant, with a drift guard in the test.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Extract the shared district-join SQL builder

`resolveOfficialsAtPoint` holds a ~90-line SELECT/JOIN chain carrying hand-maintained "keep in step with" comments. Task 3 needs the same chain with a different spatial predicate. Extract first so there is one copy, not three.

**Files:**
- Modify: `C:\EV-Accounts\backend\src\lib\essentialsService.ts`
- Test: `C:\EV-Accounts\backend\src\lib\essentialsService.area.test.ts` (create)

**Interfaces:**
- Consumes: `FALLBACK_EXCLUDED_MTFCC_SQL_LIST` (Task 1).
- Produces:
  ```ts
  export function buildDistrictQuery(opts: {
    withPrefix?: string;        // CTE text placed before SELECT, e.g. "WITH zcta AS (...)"
    extraSelect?: string;       // extra select columns, must start with a comma
    spatialPredicate: string;   // the WHERE spatial condition
    orderByTail?: string;       // appended after "ORDER BY COALESCE(p.id, o.id)"
    includeChallengers?: boolean;
  }): string
  ```
  Task 3 calls this with a `withPrefix`.

- [ ] **Step 1: Write the failing test**

Create `C:\EV-Accounts\backend\src\lib\essentialsService.area.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildDistrictQuery } from './essentialsService.js';

describe('buildDistrictQuery', () => {
  const base = { spatialPredicate: 'public.ST_Covers(gb.geometry, $1)' };

  it('places the spatial predicate in the WHERE clause', () => {
    expect(buildDistrictQuery(base)).toContain('WHERE public.ST_Covers(gb.geometry, $1)');
  });

  it('keeps the G6350 exclusion in the catch-all clause', () => {
    expect(buildDistrictQuery(base)).toContain("'G6350'");
  });

  it('prepends a CTE when withPrefix is given', () => {
    const sql = buildDistrictQuery({ ...base, withPrefix: 'WITH zcta AS (SELECT 1)' });
    expect(sql.trimStart().startsWith('WITH zcta AS (SELECT 1)')).toBe(true);
  });

  it('omits any CTE text when withPrefix is absent', () => {
    expect(buildDistrictQuery(base)).not.toContain('WITH ');
  });

  it('appends extraSelect columns', () => {
    expect(buildDistrictQuery({ ...base, extraSelect: ', 1 AS share' })).toContain(', 1 AS share');
  });

  it('excludes challengers by default and admits them on request', () => {
    expect(buildDistrictQuery(base)).toContain("NOT ILIKE 'Candidate for%'");
    expect(buildDistrictQuery({ ...base, includeChallengers: true }))
      .not.toContain("NOT ILIKE 'Candidate for%'");
  });

  it('appends orderByTail after the DISTINCT ON key', () => {
    const sql = buildDistrictQuery({ ...base, orderByTail: ', share DESC NULLS LAST' });
    expect(sql).toContain('ORDER BY COALESCE(p.id, o.id), share DESC NULLS LAST');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /c/EV-Accounts/backend && npx vitest run src/lib/essentialsService.area.test.ts`
Expected: FAIL — `buildDistrictQuery` is not exported.

- [ ] **Step 3: Extract the builder**

In `src/lib/essentialsService.ts`, immediately above `async function resolveOfficialsAtPoint`, add the builder. Move the existing `districtQueryText` body into it verbatim — the SELECT list, the whole `FROM essentials.geofence_boundaries gb JOIN essentials.districts d ON ...` MTFCC-mapping block, the `offices`/`office_current_holder`/`politicians`/`chambers`/`governments`/`government_bodies` joins, and `${UPCOMING_ELECTIONS_LATERAL}` — changing only the four injection points:

```ts
/**
 * buildDistrictQuery — the ONE district-join query text, parameterized on its
 * spatial predicate.
 *
 * Extracted so the point path (ST_Covers against a coordinate) and the area path
 * (overlap against a ZCTA polygon) cannot drift. The MTFCC-to-district_type
 * mapping below is the load-bearing part: it must stay in step with
 * MTFCC_DISTRICT_TYPE_GUARD in geoIdGuard.ts, and that is exactly why there is
 * now one copy instead of one per caller.
 *
 * `spatialPredicate` is composed by callers from trusted, code-authored SQL only
 * — never from request input. All user values arrive as $n bind parameters.
 */
export function buildDistrictQuery(opts: {
  withPrefix?: string;
  extraSelect?: string;
  spatialPredicate: string;
  orderByTail?: string;
  includeChallengers?: boolean;
}): string {
  const { withPrefix = '', extraSelect = '', spatialPredicate, orderByTail = '', includeChallengers = false } = opts;
  return `
    ${withPrefix}
    SELECT DISTINCT ON (COALESCE(p.id, o.id))
           p.id, p.external_id, p.full_name, p.first_name, p.last_name, p.middle_initial,
           /* ...the existing column list, verbatim, through
              upcoming.next_primary_date, upcoming.next_general_date... */
           ${extraSelect}
    FROM essentials.geofence_boundaries gb
    JOIN essentials.districts d ON d.geo_id = gb.geo_id
      AND (
        /* ...the existing MTFCC-to-district_type mapping, verbatim... */
        OR (gb.mtfcc NOT IN (${FALLBACK_EXCLUDED_MTFCC_SQL_LIST})
            AND gb.mtfcc NOT LIKE 'X%')
      )
    JOIN essentials.offices o ON o.district_id = d.id
    LEFT JOIN essentials.office_current_holder och ON och.office_id = o.id
    LEFT JOIN essentials.politicians p ON p.id = och.politician_id
    LEFT JOIN essentials.chambers ch ON ch.id = o.chamber_id
    LEFT JOIN essentials.governments g ON g.id = ch.government_id
    LEFT JOIN essentials.government_bodies gvb
      ON gvb.state = d.state
      AND gvb.geo_id = d.geo_id
      AND gvb.body_key = COALESCE(NULLIF(ch.name_formal, ''), ch.name, '')
    ${UPCOMING_ELECTIONS_LATERAL}
    WHERE ${spatialPredicate}
    AND (p.is_active = true OR o.is_vacant = true)
    ${includeChallengers ? '' : "AND COALESCE(p.is_incumbent, true) = true AND COALESCE(o.title, '') NOT ILIKE 'Candidate for%'"}
    ORDER BY COALESCE(p.id, o.id)${orderByTail}
  `;
}
```

> **Do not retype the column list or the MTFCC mapping from memory.** Copy them out of the existing `districtQueryText` character-for-character, comments included. The `/* ... */` markers above are placeholders for that copied text and must not survive into the committed file.

- [ ] **Step 4: Point the existing caller at the builder**

Inside `resolveOfficialsAtPoint`, replace the whole `const districtQueryText = \`...\`` block with:

```ts
  const districtQueryText = buildDistrictQuery({
    // CRITICAL: ST_MakePoint takes (longitude, latitude) = (Census x, Census y)
    // $1 = lng (Census coordinates.x), $2 = lat (Census coordinates.y)
    spatialPredicate: `public.ST_Covers(
      gb.geometry,
      public.ST_SetSRID(public.ST_MakePoint($1::float8, $2::float8), 4326)
    )`,
    includeChallengers,
  });
```

Leave `statewideQueryText`, `tribalQueryText`, `placeQueryText` and `countyNameQueryText` untouched — they are different queries, not callers of this one.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd /c/EV-Accounts/backend && npx vitest run src/lib/essentialsService.area.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 6: Prove the point path is byte-identical**

This is a pure refactor, so the generated SQL must not change. Run in a scratch node script or a temporary test:

Run: `cd /c/EV-Accounts/backend && npm test`
Expected: PASS, including `src/routes/essentialsCoordinateLookup.test.ts` and `src/routes/essentialsCandidates.test.ts`, which exercise the point path end to end through mocks.

- [ ] **Step 7: Commit**

```bash
git -C /c/EV-Accounts add backend/src/lib/essentialsService.ts backend/src/lib/essentialsService.area.test.ts
git -C /c/EV-Accounts commit -m "refactor(essentials): one district-join query, parameterized on its predicate

The point path and the coming area path need the same 90-line SELECT/JOIN
chain with different spatial predicates. Extract it once rather than let
the MTFCC-to-district_type mapping exist in three hand-synced copies.

Pure refactor — no behavior change to the address path.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: `resolveOfficialsInArea` — the ZIP resolver

The core of the feature. Tested against the Indiana ZCTAs already in the database, so it is provable *before* the nationwide import.

**Files:**
- Modify: `C:\EV-Accounts\backend\src\lib\essentialsService.ts`
- Test: `C:\EV-Accounts\backend\src\lib\essentialsService.area.test.ts` (extend)

**Interfaces:**
- Consumes: `buildDistrictQuery` (Task 2), `pool` from `./db.js`, `FIPS_TO_USPS` from `./usStateCodes.js`, `PoliticianFlatRecord` and `batchFetchImages`/`batchFetchCommittees` (existing in this file).
- Produces:
  ```ts
  export interface AreaOfficial extends PoliticianFlatRecord { share: number | null }
  export interface ZipSearchResult {
    zip: string;
    states: string[];                                        // USPS abbrevs, share >= 0.01
    county: { geoid: string; name: string } | null;           // dominant county
    politicians: AreaOfficial[];                              // share DESC, statewide last
    ambiguity: Array<{ district_type: string; count: number }>;
  }
  export function rollUpAmbiguity(politicians: Array<{ district_type: string }>): Array<{ district_type: string; count: number }>
  export async function resolveOfficialsInArea(zip: string): Promise<ZipSearchResult | null>  // null = no ZCTA polygon for this ZIP
  ```
  Task 4 wraps `resolveOfficialsInArea`; Task 5 serializes `ZipSearchResult`.

- [ ] **Step 1: Write the failing test for the pure rollup**

Append to `src/lib/essentialsService.area.test.ts`:

```ts
import { rollUpAmbiguity } from './essentialsService.js';

describe('rollUpAmbiguity', () => {
  it('counts only district_types that appear more than once', () => {
    // 46220's real shape: 1 US Rep, 3 state senators, 4 state house members.
    const rows = [
      { district_type: 'NATIONAL_LOWER' },
      { district_type: 'STATE_UPPER' }, { district_type: 'STATE_UPPER' }, { district_type: 'STATE_UPPER' },
      { district_type: 'STATE_LOWER' }, { district_type: 'STATE_LOWER' },
      { district_type: 'STATE_LOWER' }, { district_type: 'STATE_LOWER' },
    ];
    expect(rollUpAmbiguity(rows)).toEqual([
      { district_type: 'STATE_LOWER', count: 4 },
      { district_type: 'STATE_UPPER', count: 3 },
    ]);
  });

  it('returns an empty array when every office is unambiguous', () => {
    expect(rollUpAmbiguity([{ district_type: 'NATIONAL_LOWER' }, { district_type: 'COUNTY' }])).toEqual([]);
  });

  it('ignores rows with no district_type rather than counting an empty bucket', () => {
    expect(rollUpAmbiguity([{ district_type: '' }, { district_type: '' }])).toEqual([]);
  });

  it('returns an empty array for an empty input', () => {
    expect(rollUpAmbiguity([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /c/EV-Accounts/backend && npx vitest run src/lib/essentialsService.area.test.ts`
Expected: FAIL — `rollUpAmbiguity` is not exported.

- [ ] **Step 3: Implement `rollUpAmbiguity`**

Add to `src/lib/essentialsService.ts`:

```ts
/**
 * rollUpAmbiguity — which offices a ZIP genuinely cannot pin down.
 *
 * Only district_types with MORE THAN ONE holder are ambiguity: one US
 * Representative for a ZIP is an answer, four state house members is a
 * disclosure the UI has to make. Sorted count-descending so the loudest
 * ambiguity leads the copy.
 */
export function rollUpAmbiguity(
  politicians: Array<{ district_type: string }>,
): Array<{ district_type: string; count: number }> {
  const counts = new Map<string, number>();
  for (const p of politicians) {
    const dt = p.district_type;
    if (!dt) continue;
    counts.set(dt, (counts.get(dt) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([district_type, count]) => ({ district_type, count }))
    .sort((a, b) => b.count - a.count || a.district_type.localeCompare(b.district_type));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /c/EV-Accounts/backend && npx vitest run src/lib/essentialsService.area.test.ts`
Expected: PASS (11 tests)

- [ ] **Step 5: Implement `resolveOfficialsInArea`**

Add to `src/lib/essentialsService.ts`:

```ts
export interface AreaOfficial extends PoliticianFlatRecord {
  /** Fraction of the ZIP's area this official's district covers. null for
   *  statewide offices — a state contains the whole ZIP, so a percentage
   *  there would be noise. */
  share: number | null;
}

export interface ZipSearchResult {
  zip: string;
  states: string[];
  county: { geoid: string; name: string } | null;
  politicians: AreaOfficial[];
  ambiguity: Array<{ district_type: string; count: number }>;
}

/** Shared CTE: the ZIP polygon and its area, looked up once per request.
 *  $1 = the normalized 5-digit ZIP. */
const ZCTA_CTE = `WITH zcta AS (
    SELECT geometry AS g, public.ST_Area(geometry) AS a
    FROM essentials.geofence_boundaries
    WHERE mtfcc = 'G6350' AND geo_id = $1
  )`;

/**
 * resolveOfficialsInArea — every official serving any part of a ZIP.
 *
 * The area analogue of resolveOfficialsAtPoint. A point falls on one side of
 * every district line; an area straddles them, so this legitimately returns
 * four state house members for a ZIP like 46220. Nothing is filtered by share:
 * a >=10% cutoff would drop Bloomington from 47401, and someone living in that
 * slice still has a real council member.
 *
 * Returns null when no ZCTA polygon exists for the ZIP — a well-formed string
 * that is not a real ZIP, which the route reports as 404 rather than as an
 * empty result.
 *
 * PERFORMANCE: the CTE is evaluated once as an InitPlan, so
 * `gb.geometry OPERATOR(public.&&) (SELECT g FROM zcta)` is an index condition
 * and drives idx_geofence_boundaries_geometry. Verified 2026-08-18: Index Scan,
 * 43 ms for 46220. Do NOT rewrite this as a join against an OR of predicates —
 * that is the 2026-07-01 browse-stall regression.
 */
export async function resolveOfficialsInArea(zip: string): Promise<ZipSearchResult | null> {
  // Excluding G6350 keeps ~30 neighbouring ZIP polygons out of the intersection
  // work. The geoIdGuard exclusion already stops them producing rows; this stops
  // us paying for them.
  const spatialPredicate = `gb.mtfcc <> 'G6350'
    AND gb.geometry OPERATOR(public.&&) (SELECT g FROM zcta)
    AND public.ST_Intersects(gb.geometry, (SELECT g FROM zcta))
    AND NOT public.ST_Touches(gb.geometry, (SELECT g FROM zcta))`;

  // Planar area in 4326: this is a RATIO at a single latitude, so degree
  // distortion cancels and a geography cast would only cost time.
  const shareExpr = `public.ST_Area(public.ST_Intersection(gb.geometry, (SELECT g FROM zcta)))
                     / NULLIF((SELECT a FROM zcta), 0)`;

  const districtQueryText = buildDistrictQuery({
    withPrefix: ZCTA_CTE,
    extraSelect: `, ${shareExpr} AS share, gb.name AS geofence_name`,
    spatialPredicate,
    orderByTail: ', share DESC NULLS LAST',
  });

  // States whose share of the ZIP is >= 1%. G4000 is the state-outline layer and
  // its geo_id is the state FIPS, so FIPS_TO_USPS maps it to the abbrev the
  // statewide query keys on. 53 polygons — cheap.
  const statesQueryText = `${ZCTA_CTE}
    SELECT gb.geo_id AS fips
    FROM essentials.geofence_boundaries gb
    WHERE gb.mtfcc = 'G4000'
      AND gb.geometry OPERATOR(public.&&) (SELECT g FROM zcta)
      AND public.ST_Intersects(gb.geometry, (SELECT g FROM zcta))
      AND public.ST_Area(public.ST_Intersection(gb.geometry, (SELECT g FROM zcta)))
          / NULLIF((SELECT a FROM zcta), 0) >= 0.01
    ORDER BY 1`;

  // Dominant county — the one covering most of the ZIP. Drives the county label.
  const countyQueryText = `${ZCTA_CTE}
    SELECT gb.geo_id AS geoid, gb.name
    FROM essentials.geofence_boundaries gb
    WHERE gb.mtfcc = 'G4020'
      AND gb.geometry OPERATOR(public.&&) (SELECT g FROM zcta)
      AND public.ST_Intersects(gb.geometry, (SELECT g FROM zcta))
    ORDER BY public.ST_Area(public.ST_Intersection(gb.geometry, (SELECT g FROM zcta))) DESC
    LIMIT 1`;

  const [districtResult, statesResult, countyResult] = await Promise.all([
    pool.query(districtQueryText, [zip]),
    pool.query(statesQueryText, [zip]),
    pool.query(countyQueryText, [zip]),
  ]);

  // No ZCTA row => the CTE is empty => every query returns zero rows. Distinguish
  // "not a real ZIP" from "real ZIP, nothing overlaps" with a direct existence check.
  if (districtResult.rows.length === 0 && statesResult.rows.length === 0) {
    const exists = await pool.query(
      `SELECT 1 FROM essentials.geofence_boundaries WHERE mtfcc = 'G6350' AND geo_id = $1`,
      [zip],
    );
    if (exists.rows.length === 0) return null;
  }

  const states = statesResult.rows
    .map((r) => FIPS_TO_USPS[r.fips as string])
    .filter((abbrev): abbrev is string => Boolean(abbrev));

  // Statewide officials for every state the ZIP meaningfully touches. Reuses the
  // same statewide query the point path runs, once per state.
  const statewideRows = states.length > 0
    ? (await Promise.all(states.map((s) => pool.query(buildStatewideQuery(), [s]))))
        .flatMap((r) => r.rows)
    : [];

  const politicians: AreaOfficial[] = [
    ...districtResult.rows.map((row) => ({
      ...mapPoliticianRow(row),
      share: row.share != null ? Number(row.share) : null,
    })),
    ...statewideRows.map((row) => ({ ...mapPoliticianRow(row), share: null })),
  ];

  await Promise.all([batchFetchImages(politicians), batchFetchCommittees(politicians)]);

  return {
    zip,
    states,
    county: countyResult.rows[0]
      ? { geoid: countyResult.rows[0].geoid as string, name: (countyResult.rows[0].name as string) ?? '' }
      : null,
    politicians,
    ambiguity: rollUpAmbiguity(districtResult.rows.map((r) => ({ district_type: (r.district_type as string) ?? '' }))),
  };
}
```

- [ ] **Step 6: Extract the two helpers this task assumed**

`resolveOfficialsInArea` above references `mapPoliticianRow` and `buildStatewideQuery`, neither of which exists yet. Both are extractions of code already inside `resolveOfficialsAtPoint`:

- `mapPoliticianRow(row): PoliticianFlatRecord` — lift the existing `rows.map((row) => ({ id: row.id as string, ... }))` object literal in `resolveOfficialsAtPoint` into a module-level function and have the point path call it. Copy the field list verbatim; do not retype it.
- `buildStatewideQuery(): string` — wrap the existing `statewideQueryText` template in a function returning the identical string, and have `resolveOfficialsAtPoint` call it.

Both are pure moves. The point path must produce identical output.

- [ ] **Step 7: Verify against real data**

The Indiana ZCTAs make this checkable now. Run each ZIP through the resolver via a scratch script (`C:\Users\Chris\AppData\Local\Temp\claude\...\scratchpad\zip-probe.mts`) or `psql`, and confirm against the ground-truth table in Global Constraints:

- `46220` — 4 rows with `district_type='STATE_LOWER'`, 3 with `STATE_UPPER`, 1 with `NATIONAL_LOWER`; `ambiguity` contains `{STATE_LOWER, 4}` and `{STATE_UPPER, 3}`; `states === ['IN']`
- `47401` — the Bloomington place row is **present**, with a share below 0.10 (the regression a naive threshold would cause)
- `46360` — 7 place rows present, exactly 1 with `share >= 0.02`
- Every returned `share` is `> 0` and `<= 1` (plus float tolerance), or `null` for statewide rows

- [ ] **Step 8: Confirm no Seq Scan**

Run `EXPLAIN (ANALYZE, BUFFERS)` on the generated `districtQueryText` with `$1='46220'`.
Expected: `Index Scan using idx_geofence_boundaries_geometry`, and **no** `Seq Scan on geofence_boundaries`. This mirrors the assertion at `backend/scripts/validate_pipeline.py:415`. If a Seq Scan appears, do **not** proceed — the contingency is to fetch the ZCTA geometry in a first round-trip and pass it as a bind parameter instead of a CTE reference.

- [ ] **Step 9: Commit**

```bash
git -C /c/EV-Accounts add backend/src/lib/essentialsService.ts backend/src/lib/essentialsService.area.test.ts
git -C /c/EV-Accounts commit -m "feat(essentials): resolveOfficialsInArea — every official serving a ZIP

A point falls on one side of every district line; a ZIP straddles them.
46220 has four state house members, and that is the answer, not a bug.

Shares are returned, never used to filter: a >=10% cutoff would drop
Bloomington from 47401. The 2% collapse is the UI's business.

Verified against the Indiana ZCTAs already in the DB — Index Scan on
idx_geofence_boundaries_geometry, no Seq Scan.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: `getOfficialsByZip` — caching wrapper, and delete the stub

**Files:**
- Modify: `C:\EV-Accounts\backend\src\lib\essentialsService.ts`
- Modify: `C:\EV-Accounts\backend\src\lib\candidateService.ts` (delete `getCandidatesByZip`)
- Test: `C:\EV-Accounts\backend\src\lib\essentialsService.area.test.ts` (extend)

**Interfaces:**
- Consumes: `resolveOfficialsInArea` (Task 3), `cache` from `./cache.js`.
- Produces: `export async function getOfficialsByZip(zip: string): Promise<ZipSearchResult | null>`. Task 5's route calls this.

- [ ] **Step 1: Write the failing test**

Append to `src/lib/essentialsService.area.test.ts`:

```ts
import { ZIP_CACHE_KEY_PREFIX } from './essentialsService.js';

describe('ZIP cache key', () => {
  it('is versioned past the old stub key', () => {
    // The deleted getCandidatesByZip wrote `candidates:zip:${zip}` holding
    // every active empowered_profile. Reusing that key would serve its garbage
    // payload to this reader.
    expect(ZIP_CACHE_KEY_PREFIX).toBe('candidates:zip:v2:');
    expect(ZIP_CACHE_KEY_PREFIX).not.toBe('candidates:zip:');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /c/EV-Accounts/backend && npx vitest run src/lib/essentialsService.area.test.ts`
Expected: FAIL — `ZIP_CACHE_KEY_PREFIX` is not exported.

- [ ] **Step 3: Implement the wrapper**

Add to `src/lib/essentialsService.ts`:

```ts
/**
 * Cache key prefix for ZIP lookups.
 *
 * VERSIONED DELIBERATELY. The removed candidateService.getCandidatesByZip wrote
 * `candidates:zip:${zip}` with a 900s TTL, holding every active
 * empowered_profiles row regardless of ZIP. Reusing the unversioned key would
 * serve that payload to this reader for up to 15 minutes after deploy.
 */
export const ZIP_CACHE_KEY_PREFIX = 'candidates:zip:v2:';

/** ZIP boundaries and officeholders both change on the order of months; 1h. */
const ZIP_CACHE_TTL_SECONDS = 3600;

export async function getOfficialsByZip(zip: string): Promise<ZipSearchResult | null> {
  const cacheKey = `${ZIP_CACHE_KEY_PREFIX}${zip}`;
  const cached = await cache.get<ZipSearchResult>(cacheKey);
  if (cached !== null) return cached;

  const result = await resolveOfficialsInArea(zip);
  // Cache the negative too — a bot walking 00000..99999 must not re-run the
  // spatial work for every miss. Same TTL; the ZCTA layer changes yearly.
  await cache.set(cacheKey, result, ZIP_CACHE_TTL_SECONDS);
  return result;
}
```

> `cache.get<T>` returns `null` for a miss, so a cached negative (`null`) re-runs the resolver rather than short-circuiting. That is an accepted inefficiency — correctness first, and a real 404 ZIP is rare traffic. Do not "fix" it with a sentinel unless profiling shows it matters.

Add `import { cache } from './cache.js';` if not already imported in this file.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /c/EV-Accounts/backend && npx vitest run src/lib/essentialsService.area.test.ts`
Expected: PASS

- [ ] **Step 5: Delete the stub**

In `src/lib/candidateService.ts`, delete the entire `getCandidatesByZip` function and its `// getCandidatesByZip` banner comment (currently ~lines 247-297). It ignores its `zip` argument and returns every active profile — leaving it in place is leaving a wrong answer one import away.

Then run: `cd /c/EV-Accounts/backend && npx tsc --noEmit`
Expected: one error, in `src/routes/essentialsCandidates.ts` — the now-dangling import. Task 5 fixes it.

- [ ] **Step 6: Commit**

```bash
git -C /c/EV-Accounts add backend/src/lib/essentialsService.ts backend/src/lib/candidateService.ts backend/src/lib/essentialsService.area.test.ts
git -C /c/EV-Accounts commit -m "feat(essentials): getOfficialsByZip + delete the ZIP stub

getCandidatesByZip ignored its zip argument and returned every active
empowered_profile — a live wrong answer, deleted rather than left one
import away from a caller.

Cache key is versioned to candidates:zip:v2: so the stub's payload
cannot outlive it in Redis.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: `GET /essentials/candidates/:zip` returns real officials

**Files:**
- Modify: `C:\EV-Accounts\backend\src\routes\essentialsCandidates.ts`
- Test: `C:\EV-Accounts\backend\src\routes\essentialsCandidates.test.ts`

**Interfaces:**
- Consumes: `getOfficialsByZip` (Task 4).
- Produces: the HTTP contract Task 7's `fetchOfficialsByZip` consumes:
  ```json
  { "zip": "46220", "states": ["IN"],
    "county": { "geoid": "18097", "name": "Marion County" },
    "politicians": [ { "...PoliticianFlatRecord": "...", "share": 0.38 } ],
    "ambiguity": [ { "district_type": "STATE_LOWER", "count": 4 } ] }
  ```
  Status codes: `200` resolved · `422 VALIDATION_ERROR` malformed ZIP · `404 ZIP_NOT_FOUND` well-formed but no such ZCTA · `500 INTERNAL_ERROR`.

- [ ] **Step 1: Write the failing tests**

In `src/routes/essentialsCandidates.test.ts`, replace the `vi.mock('../lib/candidateService.js', ...)` block with a mock of the new service symbol. Add to the hoisted mocks:

```ts
const { mockGetRepresentativesByAddress, mockGetOfficialsByZip } = vi.hoisted(() => ({
  mockGetRepresentativesByAddress: vi.fn(),
  mockGetOfficialsByZip: vi.fn(),
}));

vi.mock('../lib/essentialsService.js', () => ({
  getRepresentativesByAddress: mockGetRepresentativesByAddress,
  getPoliticiansFlatList: vi.fn(),
  getOfficialsByZip: mockGetOfficialsByZip,
}));
// NOTE: the candidateService mock is gone — the route no longer imports it.
```

Add `mockGetOfficialsByZip.mockReset();` to the existing `beforeEach`, then append:

```ts
describe('GET /api/essentials/candidates/:zip', () => {
  it('returns 422 for a malformed ZIP without touching the service', async () => {
    const res = await request(app).get('/api/essentials/candidates/4622');
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(mockGetOfficialsByZip).not.toHaveBeenCalled();
  });

  it('normalizes ZIP+4 to five digits before lookup', async () => {
    mockGetOfficialsByZip.mockResolvedValue({
      zip: '46220', states: ['IN'], county: null, politicians: [], ambiguity: [],
    });
    const res = await request(app).get('/api/essentials/candidates/46220-1234');
    expect(res.status).toBe(200);
    expect(mockGetOfficialsByZip).toHaveBeenCalledWith('46220');
  });

  it('returns 404 ZIP_NOT_FOUND when no ZCTA polygon exists', async () => {
    mockGetOfficialsByZip.mockResolvedValue(null);
    const res = await request(app).get('/api/essentials/candidates/00000');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('ZIP_NOT_FOUND');
  });

  it('passes share and ambiguity through to the response', async () => {
    mockGetOfficialsByZip.mockResolvedValue({
      zip: '46220',
      states: ['IN'],
      county: { geoid: '18097', name: 'Marion County' },
      politicians: [makeRep({ id: 'a', district_type: 'STATE_LOWER', share: 0.38 })],
      ambiguity: [{ district_type: 'STATE_LOWER', count: 4 }],
    });
    const res = await request(app).get('/api/essentials/candidates/46220');
    expect(res.status).toBe(200);
    expect(res.body.politicians[0].share).toBe(0.38);
    expect(res.body.ambiguity).toEqual([{ district_type: 'STATE_LOWER', count: 4 }]);
    expect(res.body.county.name).toBe('Marion County');
  });

  it('returns 200 with an empty politicians array for a real ZIP with no officials', async () => {
    mockGetOfficialsByZip.mockResolvedValue({
      zip: '99999', states: [], county: null, politicians: [], ambiguity: [],
    });
    const res = await request(app).get('/api/essentials/candidates/99999');
    expect(res.status).toBe(200);
    expect(res.body.politicians).toEqual([]);
  });

  it('returns 500 when the service throws', async () => {
    mockGetOfficialsByZip.mockRejectedValue(new Error('boom'));
    const res = await request(app).get('/api/essentials/candidates/46220');
    expect(res.status).toBe(500);
    expect(res.body.code).toBe('INTERNAL_ERROR');
  });
});
```

`makeRep` already exists in this file; extend its `overrides` type to accept `share` if TypeScript objects.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /c/EV-Accounts/backend && npx vitest run src/routes/essentialsCandidates.test.ts`
Expected: FAIL — the route still calls `getCandidatesByZip`, and `getOfficialsByZip` is not exported from the mocked module's real counterpart.

- [ ] **Step 3: Rewrite the route handler**

In `src/routes/essentialsCandidates.ts`, delete the `getCandidatesByZip` import and add `getOfficialsByZip` to the existing `essentialsService.js` import:

```ts
import { getRepresentativesByAddress, getPoliticiansFlatList, getOfficialsByZip } from '../lib/essentialsService.js';
```

Replace the `GET /:zip` handler and its doc block with:

```ts
// ---------------------------------------------------------------------------
// GET /api/essentials/candidates/:zip
// Auth: optional — works unauthenticated
//
// Every official who serves ANY PART of the ZIP. A ZIP is an area, not a point,
// so this legitimately returns several holders of the same office — 46220 has
// four state house members. Each carries `share`, the fraction of the ZIP its
// district covers; statewide offices carry share: null.
//
// NOTHING is filtered by share. The 2% collapse is presentation, applied by the
// client: a server-side cutoff would drop Bloomington from 47401, and a resident
// of that slice still has a real council member.
//
// 422 — malformed ZIP (not 5-digit or ZIP+4)
// 404 — well-formed but no such ZCTA polygon (i.e. not a real ZIP)
// 200 — resolved; `politicians` may be empty for a real ZIP we cover no offices in
// ---------------------------------------------------------------------------

router.get('/:zip', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const zip = req.params.zip as string;

    if (!ZIP_REGEX.test(zip)) {
      res.status(422).json({ code: 'VALIDATION_ERROR', message: 'Invalid ZIP code format' });
      return;
    }

    // Normalize to 5-digit — ZCTAs are 5-digit, and this keeps cache keys single-valued.
    const normalizedZip = zip.slice(0, 5);
    const result = await getOfficialsByZip(normalizedZip);

    if (result === null) {
      res.status(404).json({ code: 'ZIP_NOT_FOUND', message: 'No such ZIP code' });
      return;
    }

    res.setHeader('X-Data-Status', result.politicians.length === 0 ? 'no-geofence-data' : 'fresh');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.status(200).json({
      zip: result.zip,
      states: result.states,
      county: result.county,
      politicians: result.politicians,
      ambiguity: result.ambiguity,
    });
  } catch (err) {
    console.error('[GET /essentials/candidates/:zip] error:', err);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' });
  }
});
```

Also update the file's top doc block: the "CRITICAL: Only ACTIVE candidates... getCandidatesByZip enforces is_active = true" paragraph now describes a deleted function. Replace with a note that ZIP lookups resolve by area overlap through `essentialsService.getOfficialsByZip`, which admits active holders and vacant seats exactly as the address path does.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /c/EV-Accounts/backend && npx vitest run src/routes/essentialsCandidates.test.ts`
Expected: PASS (6 new + existing)

- [ ] **Step 5: Typecheck and full suite**

Run: `cd /c/EV-Accounts/backend && npx tsc --noEmit && npm test`
Expected: PASS, no dangling import.

- [ ] **Step 6: Commit**

```bash
git -C /c/EV-Accounts add backend/src/routes/essentialsCandidates.ts backend/src/routes/essentialsCandidates.test.ts
git -C /c/EV-Accounts commit -m "feat(api): GET /candidates/:zip returns everyone serving the ZIP

Replaces a stub that ignored the ZIP entirely. 404 now distinguishes
'not a real ZIP' from 'real ZIP, no offices covered' — the old handler
could not tell them apart because it never looked at the ZIP.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Nationwide ZCTA import

Runs only after Task 1 is deployed — the guard must precede the data. Indiana already works, which is why the resolver could be proven first; this extends it to the other 49 states.

**Files:**
- Create: `C:\EV-Accounts\scripts\load-zcta-boundaries.sh`

**Interfaces:**
- Consumes: `DB_URL` (a **direct** connection, port 5432 — not the 6543 pooler), `ogr2ogr`, `psql`.
- Produces: ~33.8k `essentials.geofence_boundaries` rows with `mtfcc='G6350'`. No code depends on this task's output signature.

- [ ] **Step 1: Write the script**

Create `C:\EV-Accounts\scripts\load-zcta-boundaries.sh`:

```bash
#!/usr/bin/env bash
# =============================================================================
# load-zcta-boundaries.sh
# Nationwide ZIP Code Tabulation Area (ZCTA) import -> essentials.geofence_boundaries
#
# PREREQUISITE: 'G6350' MUST already be excluded from the district-join fallback
# clause (lib/geoIdGuard.ts FALLBACK_EXCLUDED_MTFCCS). Without it, every address
# lookup can join a ZIP polygon to a district on a bare geo_id match. Verify the
# deployed backend has that change BEFORE running this.
#
# TIGER ships ZCTAs as ONE nationwide file (529 MB) — there are no per-state
# slices, so this is all-or-nothing.
#
# Geometries are simplified to ~55m on import. A ZCTA is only ever a QUERY
# SHAPE, never the district geometry an address resolves against, so the cost is
# a sub-point shift in share percentages. Full resolution would add an estimated
# 0.8-1.2 GB to a table whose geometry is currently 445 MB.
#
# Prerequisites: gdal (ogr2ogr), postgresql-client (psql)
# Usage: DB_URL="postgresql://...:5432/postgres" ./scripts/load-zcta-boundaries.sh
#
# Idempotent AND resumable:
#   - download: skipped if the zip is already present
#   - stage table: -overwrite
#   - merge: ON CONFLICT (geo_id, mtfcc) DO UPDATE
#   - state backfill: batched by leading digit, WHERE state IS NULL
# =============================================================================

set -euo pipefail

if [[ -z "${DB_URL:-}" ]]; then
  echo "ERROR: DB_URL is required (direct connection, port 5432 — NOT the 6543 pooler)."
  exit 1
fi

command -v ogr2ogr >/dev/null 2>&1 || { echo "ERROR: ogr2ogr not found. Install gdal."; exit 1; }
command -v psql    >/dev/null 2>&1 || { echo "ERROR: psql not found. Install postgresql-client."; exit 1; }

WORK_DIR="${WORK_DIR:-/tmp/tiger-zcta}"
SIMPLIFY_TOLERANCE="${SIMPLIFY_TOLERANCE:-0.0005}"   # degrees, ~55m
mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

ZIP_FILE="tl_2024_us_zcta520.zip"
SHP_FILE="$WORK_DIR/tl_2024_us_zcta520.shp"
URL="https://www2.census.gov/geo/tiger/TIGER2024/ZCTA520/$ZIP_FILE"

# --- Step 1: download (529 MB) --------------------------------------------
if [[ -f "$ZIP_FILE" ]]; then
  echo "[1/5] [skip] $ZIP_FILE already downloaded"
else
  echo "[1/5] Downloading $URL (529 MB, this takes a while)..."
  curl -sSL --fail "$URL" -o "$ZIP_FILE"
fi
unzip -o -q "$ZIP_FILE"
[[ -f "$SHP_FILE" ]] || { echo "ERROR: $SHP_FILE missing after unzip."; exit 1; }

# --- Step 2: stage table --------------------------------------------------
# TIGER is NAD83 (EPSG:4269); reproject to 4326 to match geofence_boundaries.
echo "[2/5] Staging shapefile -> essentials.geofence_zcta_stage ..."
psql "$DB_URL" -v ON_ERROR_STOP=1 -c \
  "DROP TABLE IF EXISTS essentials.geofence_zcta_stage;" >/dev/null

ogr2ogr \
  -f PostgreSQL "$DB_URL" \
  "$SHP_FILE" \
  -nln essentials.geofence_zcta_stage \
  -nlt MULTIPOLYGON \
  -t_srs EPSG:4326 \
  -lco GEOMETRY_NAME=geom \
  -lco SCHEMA=essentials \
  -overwrite \
  -sql "SELECT ZCTA5CE20 AS zcta5 FROM tl_2024_us_zcta520"

psql "$DB_URL" -v ON_ERROR_STOP=1 -c \
  "CREATE INDEX IF NOT EXISTS idx_zcta_stage_geom ON essentials.geofence_zcta_stage USING gist (geom);"

# --- Step 3: merge, simplified -------------------------------------------
# state is left NULL here and backfilled in Step 4 — the dominant-county
# spatial join is far too slow to hold open inside this transaction.
echo "[3/5] Merging into geofence_boundaries (simplify tolerance $SIMPLIFY_TOLERANCE) ..."
psql "$DB_URL" -v ON_ERROR_STOP=1 -c "
  INSERT INTO essentials.geofence_boundaries
    (geo_id, ocd_id, name, state, mtfcc, geometry, source, imported_at)
  SELECT s.zcta5,
         NULL,
         s.zcta5,
         NULL,
         'G6350',
         public.ST_SimplifyPreserveTopology(s.geom, ${SIMPLIFY_TOLERANCE}),
         'census_tiger_2024',
         now()
  FROM essentials.geofence_zcta_stage s
  WHERE s.zcta5 IS NOT NULL
  ON CONFLICT (geo_id, mtfcc) DO UPDATE
    SET geometry    = EXCLUDED.geometry,
        name        = EXCLUDED.name,
        source      = EXCLUDED.source,
        imported_at = now(),
        state       = NULL;
"

# --- Step 4: dominant-state backfill, batched ----------------------------
# ZCTAs cross state lines, so 'state' is the state covering the largest share.
# It is an indexing/display convenience — the resolver derives states spatially
# and never reads this column for correctness.
echo "[4/5] Backfilling dominant state FIPS (10 batches) ..."
for d in 0 1 2 3 4 5 6 7 8 9; do
  echo "       batch $d ..."
  psql "$DB_URL" -v ON_ERROR_STOP=1 -c "
    UPDATE essentials.geofence_boundaries z
    SET state = (
      SELECT LEFT(c.geo_id, 2)
      FROM essentials.geofence_boundaries c
      WHERE c.mtfcc = 'G4020'
        AND c.geometry OPERATOR(public.&&) z.geometry
        AND public.ST_Intersects(c.geometry, z.geometry)
      ORDER BY public.ST_Area(public.ST_Intersection(c.geometry, z.geometry)) DESC
      LIMIT 1
    )
    WHERE z.mtfcc = 'G6350'
      AND z.state IS NULL
      AND z.geo_id LIKE '${d}%';
  "
done

psql "$DB_URL" -v ON_ERROR_STOP=1 -c \
  "DROP TABLE IF EXISTS essentials.geofence_zcta_stage;"

# --- Step 5: verification -------------------------------------------------
echo "[5/5] Verification"

echo
echo "Row count (expect ~33,800) and states covered (expect ~56):"
psql "$DB_URL" -v ON_ERROR_STOP=1 -c "
  SELECT count(*) AS zcta_rows,
         count(DISTINCT state) AS states,
         count(*) FILTER (WHERE state IS NULL) AS unresolved_state
  FROM essentials.geofence_boundaries WHERE mtfcc = 'G6350';
"

echo "Geometry validity (expect invalid = 0):"
psql "$DB_URL" -v ON_ERROR_STOP=1 -c "
  SELECT count(*) FILTER (WHERE NOT public.ST_IsValid(geometry)) AS invalid
  FROM essentials.geofence_boundaries WHERE mtfcc = 'G6350';
"

echo "GUARD — no ZCTA may join to a district (expect 0):"
psql "$DB_URL" -v ON_ERROR_STOP=1 -c "
  SELECT count(*) AS leaked_district_joins
  FROM essentials.geofence_boundaries gb
  JOIN essentials.districts d ON d.geo_id = gb.geo_id
  WHERE gb.mtfcc = 'G6350';
"

echo "Ground truth — 46220 must show 4 state house + 3 state senate districts:"
psql "$DB_URL" -v ON_ERROR_STOP=1 -c "
  WITH zcta AS (
    SELECT geometry AS g FROM essentials.geofence_boundaries
    WHERE mtfcc = 'G6350' AND geo_id = '46220'
  )
  SELECT gb.mtfcc, count(*)
  FROM essentials.geofence_boundaries gb, zcta z
  WHERE gb.mtfcc IN ('G5200','G5210','G5220')
    AND gb.geometry OPERATOR(public.&&) z.g
    AND public.ST_Intersects(gb.geometry, z.g)
    AND NOT public.ST_Touches(gb.geometry, z.g)
  GROUP BY gb.mtfcc ORDER BY gb.mtfcc;
"

echo
echo "Table size after import:"
psql "$DB_URL" -v ON_ERROR_STOP=1 -c "
  SELECT pg_size_pretty(pg_total_relation_size('essentials.geofence_boundaries')) AS total;
"

echo
echo "=== Done. ==="
```

- [ ] **Step 2: Confirm the guard is deployed before running**

Run: `git -C /c/EV-Accounts log origin/master --oneline -5 | grep -i G6350`
Expected: Task 1's commit is present on `origin/master`. **If it is not, stop.** Loading this data against a backend without the guard exposes the address path to wrong joins.

- [ ] **Step 3: Dry-run against a scratch copy of the table, or accept the risk knowingly**

The merge is an upsert keyed on `(geo_id, mtfcc)` scoped to `mtfcc='G6350'`, so it can only touch ZCTA rows — the 807 Indiana rows are updated, nothing else is reachable. Re-read the `INSERT` and confirm every write is scoped to `'G6350'` before running against production.

- [ ] **Step 4: Run the import**

Run: `chmod +x /c/EV-Accounts/scripts/load-zcta-boundaries.sh && DB_URL="<direct 5432 connection>" /c/EV-Accounts/scripts/load-zcta-boundaries.sh`

Expected from Step 5's verification:
- `zcta_rows` ≈ 33,800; `unresolved_state` = 0 (a ZCTA with no county overlap would be a data problem worth investigating, not ignoring)
- `invalid` = 0
- `leaked_district_joins` = **0** — the behavioural proof of Task 1
- `46220` → `G5200`=1, `G5210`=3, `G5220`=4, matching the pre-import ground truth exactly. **A changed count here means simplification moved a boundary and the tolerance is too loose.**

- [ ] **Step 5: Re-run the resolver checks from Task 3 Step 7**

The Indiana numbers must be unchanged after the re-import at the new tolerance. Also spot-check one ZIP in a place-loaded state outside Indiana (e.g. `78701` Austin TX) and one in a state with no legislative layer (e.g. `33101` Miami FL — expect US Rep + Senators, no state legislators, which is the honest coverage answer).

- [ ] **Step 6: Commit the script**

```bash
git -C /c/EV-Accounts add scripts/load-zcta-boundaries.sh
git -C /c/EV-Accounts commit -m "feat(geo): nationwide ZCTA import for ZIP search

33.8k ZIP polygons, simplified to ~55m. TIGER ships one nationwide file,
so coverage is all-or-nothing; simplification keeps it to ~+150 MB
instead of ~+1 GB, and a ZCTA is only ever a query shape.

Verification asserts leaked_district_joins = 0 — the behavioural proof
that the G6350 guard holds — and re-checks 46220's district counts
against the pre-import ground truth so a too-loose tolerance is caught.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Frontend — the `'zip'` input kind and its route

**Files:**
- Modify: `C:\Transparent Motivations\essentials\src\lib\inputClassifier.js`
- Modify: `C:\Transparent Motivations\essentials\src\lib\inputClassifier.test.js`
- Modify: `C:\Transparent Motivations\essentials\src\lib\localitySearch.js`
- Modify: `C:\Transparent Motivations\essentials\src\lib\api.jsx`
- Modify: `C:\Transparent Motivations\essentials\src\components\LocationCombobox.jsx`
- Modify: `C:\Transparent Motivations\essentials\src\pages\Landing.jsx`

**Interfaces:**
- Consumes: the Task 5 HTTP contract.
- Produces:
  - `classifyInput(raw)` gains `{ kind: 'zip', zip: '46220' }`
  - `zipRoute(zip)` → `/results?zip=46220`
  - `fetchOfficialsByZip(zip)` → `{ data, error }` where `data` is `{ zip, states, county, politicians, ambiguity } | null`
  - `LocationCombobox` prop `onSubmitZip(zip, raw)`

  Task 8 consumes `fetchOfficialsByZip` and the `?zip=` param.

- [ ] **Step 1: Update the classifier tests — including two deliberate inversions**

In `src/lib/inputClassifier.test.js`, **delete** these two assertions from the `address detection` describe block:

```js
  it('classifies a bare 5-digit ZIP as address (flows through existing Census path)', () => {
    expect(classifyInput('90210')).toEqual({ kind: 'address' });
  });
  it('classifies a ZIP+4 as address', () => {
    expect(classifyInput('90210-1234')).toEqual({ kind: 'address' });
  });
```

> These are not broken tests. They encode the old behavior — routing bare ZIPs into the Census address path, which returns 422 `ADDRESS_NOT_FOUND` for every one of them. Inverting them IS the feature.

Add a new describe block:

```js
describe('classifyInput — ZIP detection', () => {
  it('classifies a bare 5-digit ZIP as zip, carrying the normalized code', () => {
    expect(classifyInput('46220')).toEqual({ kind: 'zip', zip: '46220' });
  });
  it('classifies a ZIP+4 as zip, normalized to five digits', () => {
    expect(classifyInput('46220-1234')).toEqual({ kind: 'zip', zip: '46220' });
  });
  it('trims surrounding whitespace', () => {
    expect(classifyInput('  46220  ')).toEqual({ kind: 'zip', zip: '46220' });
  });
  it('keeps a ZIP inside a longer string as an address, not a zip', () => {
    // A full address must still geocode to a POINT — the precise answer.
    expect(classifyInput('123 Main St, Bloomington IN 47401')).toEqual({ kind: 'address' });
  });
  it('keeps a city+ZIP string as an address', () => {
    expect(classifyInput('Bloomington 47401')).toEqual({ kind: 'address' });
  });
  it('does not treat a 4-digit number as a zip', () => {
    expect(classifyInput('4622')).toEqual({ kind: 'name' });
  });
  it('does not treat a 6-digit number as a zip', () => {
    expect(classifyInput('462201')).toEqual({ kind: 'name' });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd "/c/Transparent Motivations/essentials" && npx vitest run src/lib/inputClassifier.test.js`
Expected: FAIL — bare ZIPs still classify as `'address'`.

- [ ] **Step 3: Add the `'zip'` kind to the classifier**

In `src/lib/inputClassifier.js`, add the anchored regex next to the existing `ZIP_RE`:

```js
// A BARE ZIP — the entire input is a 5-digit ZIP (optionally +4). Anchored
// deliberately: ZIP_RE below matches a ZIP anywhere in a string, which is the
// address case ("123 Main St, Bloomington IN 47401" must still geocode to a
// POINT). Only an input that is nothing but a ZIP resolves as an AREA.
const BARE_ZIP_RE = /^(\d{5})(?:-\d{4})?$/;
```

Update the doc comment's return union to include `{ kind: 'zip', zip: string }`, then insert the check in `classifyInput` **after** the coordinate check and **before** the address check:

```js
  const bareZip = BARE_ZIP_RE.exec(value);
  if (bareZip) {
    return { kind: 'zip', zip: bareZip[1] };
  }
```

Ordering matters: `ADDRESS_LEADING_DIGIT_RE` requires a digit followed by whitespace so it would not catch `46220`, but `ZIP_RE` in the same condition would — so the bare-ZIP check must come first.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd "/c/Transparent Motivations/essentials" && npx vitest run src/lib/inputClassifier.test.js`
Expected: PASS

- [ ] **Step 5: Add `zipRoute` with a test**

Create the test in a new `src/lib/localitySearch.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { zipRoute } from './localitySearch.js';

describe('zipRoute', () => {
  it('builds the Results ZIP hand-off URL', () => {
    expect(zipRoute('46220')).toBe('/results?zip=46220');
  });
  it('percent-encodes rather than concatenating untrusted input', () => {
    expect(zipRoute('46220&x=1')).toBe('/results?zip=46220%26x%3D1');
  });
});
```

Run it (expect FAIL), then add to `src/lib/localitySearch.js`:

```js
/**
 * ZIP hand-off contract: Landing -> Results. Results reads ?zip= on mount and
 * resolves through fetchOfficialsByZip.
 *
 * URLSearchParams percent-encodes every value — never string-concatenate input
 * into this path (same guard as coordinateRoute).
 */
export function zipRoute(zip) {
  return `/results?${new URLSearchParams({ zip }).toString()}`;
}
```

Run again: PASS.

- [ ] **Step 6: Add `fetchOfficialsByZip` and delete the dead `fetchCandidates`**

In `src/lib/api.jsx`, delete `fetchCandidates` entirely (it has no callers and routes ZIPs at the old stub), and add:

```js
/**
 * Officials serving any part of a ZIP. Returns { data, error } like the browse
 * helpers. `data` is null when the backend reports 404 ZIP_NOT_FOUND — a
 * well-formed string that is not a real ZIP, which the UI must distinguish from
 * a real ZIP we cover no offices in.
 */
export async function fetchOfficialsByZip(zip) {
  try {
    const res = await publicFetch(`/essentials/candidates/${encodeURIComponent(zip)}`);
    if (res && res.status === 404) return { data: null, error: 'ZIP_NOT_FOUND' };
    if (!res || !res.ok) return { data: null, error: `${res?.status ?? 'unknown'}` };
    return { data: await res.json(), error: null };
  } catch (err) {
    console.error('fetchOfficialsByZip error:', err);
    return { data: null, error: err.message };
  }
}
```

- [ ] **Step 7: Wire the combobox**

In `src/components/LocationCombobox.jsx`:

Add `onSubmitZip` to the props doc block and destructuring, then in `dispatchSubmit` add a branch **before** the `'address'` branch:

```js
    if (classified.kind === 'zip') {
      onSubmitZip?.(classified.zip, value.trim());
    } else if (classified.kind === 'address') {
```

In `renderInlineRow`, add before the `'address'` row:

```js
    if (classified.kind === 'zip') {
      return (
        <p className="mt-2 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
          <span aria-hidden="true" className="text-[12px] font-semibold">↵</span>
          Press Enter to see everyone serving this ZIP code
        </p>
      );
    }
```

The debounce effect already bails for any `kind !== 'name'`, so a ZIP never reaches the name resolver — no change needed there.

- [ ] **Step 8: Wire Landing**

In `src/pages/Landing.jsx`, add `zipRoute` to the `localitySearch` import, add the handler beside `handleSubmitCoordinate`:

```js
  const handleSubmitZip = (zip) => {
    track('essentials_zip_searched', { method: 'manual' });
    navigate(zipRoute(zip));
  };
```

and pass `onSubmitZip={handleSubmitZip}` to `<LocationCombobox>` alongside the existing handlers.

- [ ] **Step 9: Run the full frontend suite and lint**

Run: `cd "/c/Transparent Motivations/essentials" && npm test && npm run lint`
Expected: PASS both.

- [ ] **Step 10: Commit**

```bash
git -C "/c/Transparent Motivations/essentials" add src/lib/inputClassifier.js src/lib/inputClassifier.test.js src/lib/localitySearch.js src/lib/localitySearch.test.js src/lib/api.jsx src/components/LocationCombobox.jsx src/pages/Landing.jsx
git -C "/c/Transparent Motivations/essentials" commit -m "feat(search): a bare ZIP is its own input kind

Typing 46220 used to classify as an address and 422 out of the Census
geocoder, which cannot resolve a bare ZIP. It now routes to the area
resolver.

Anchored deliberately: a ZIP inside a longer string stays an address, so
a full street address still geocodes to a point — the precise answer.
Two classifier assertions invert on purpose; they encoded the 422.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Results — the `?zip=` area-voice mode

**Files:**
- Create: `C:\Transparent Motivations\essentials\src\lib\zipResults.js`
- Test: `C:\Transparent Motivations\essentials\src\lib\zipResults.test.js` (create)
- Modify: `C:\Transparent Motivations\essentials\src\pages\Results.jsx`

**Interfaces:**
- Consumes: `fetchOfficialsByZip` (Task 7), the Task 5 response shape.
- Produces: nothing downstream — this is the last task.

- [ ] **Step 1: Write the failing tests for the pure helpers**

There is no React test harness in this repo (no jsdom, no `@testing-library`), so the logic worth testing goes in a pure module. Create `src/lib/zipResults.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { SHARE_DISCLOSURE_THRESHOLD, splitByShare, ambiguityCopy, zipHeading } from './zipResults.js';

describe('splitByShare', () => {
  it('keeps officials at or above the threshold as primary', () => {
    const pols = [{ id: 'a', share: 0.5 }, { id: 'b', share: 0.02 }];
    expect(splitByShare(pols).primary.map((p) => p.id)).toEqual(['a', 'b']);
    expect(splitByShare(pols).collapsed).toEqual([]);
  });

  it('collapses slivers below the threshold without dropping them', () => {
    // 46360's real shape: 7 places touch the ZIP, 6 are edge slivers.
    const pols = [
      { id: 'real', share: 0.61 },
      ...Array.from({ length: 6 }, (_, i) => ({ id: `sliver${i}`, share: 0.001 })),
    ];
    const { primary, collapsed } = splitByShare(pols);
    expect(primary.map((p) => p.id)).toEqual(['real']);
    expect(collapsed).toHaveLength(6);
    expect(primary.length + collapsed.length).toBe(pols.length);
  });

  it('treats a null share (statewide office) as primary, never a sliver', () => {
    expect(splitByShare([{ id: 'gov', share: null }]).collapsed).toEqual([]);
  });

  it('sorts primary by share descending, nulls last', () => {
    const pols = [{ id: 'a', share: 0.1 }, { id: 'sen', share: null }, { id: 'b', share: 0.9 }];
    expect(splitByShare(pols).primary.map((p) => p.id)).toEqual(['b', 'a', 'sen']);
  });

  it('handles an empty list', () => {
    expect(splitByShare([])).toEqual({ primary: [], collapsed: [] });
  });

  it('uses a 2% threshold — the value that keeps Bloomington in 47401', () => {
    expect(SHARE_DISCLOSURE_THRESHOLD).toBe(0.02);
  });
});

describe('ambiguityCopy', () => {
  it('names the office and count for a doubled district type', () => {
    expect(ambiguityCopy([{ district_type: 'STATE_LOWER', count: 4 }]))
      .toBe('4 state house members serve parts of this ZIP code.');
  });

  it('joins multiple ambiguities into one sentence', () => {
    expect(ambiguityCopy([
      { district_type: 'STATE_LOWER', count: 4 },
      { district_type: 'STATE_UPPER', count: 3 },
    ])).toBe('4 state house members and 3 state senators serve parts of this ZIP code.');
  });

  it('returns an empty string when nothing is ambiguous', () => {
    expect(ambiguityCopy([])).toBe('');
  });

  it('falls back to a generic phrase for an unmapped district type', () => {
    expect(ambiguityCopy([{ district_type: 'WEIRD_TYPE', count: 2 }]))
      .toBe('2 officials serve parts of this ZIP code.');
  });
});

describe('zipHeading', () => {
  it('speaks in area voice, never claiming the officials are the visitor\'s own', () => {
    expect(zipHeading('46220')).toBe('Officials serving 46220');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd "/c/Transparent Motivations/essentials" && npx vitest run src/lib/zipResults.test.js`
Expected: FAIL — the module does not exist.

- [ ] **Step 3: Implement `zipResults.js`**

Create `src/lib/zipResults.js`:

```js
// zipResults.js — pure presentation helpers for the ?zip= Results mode.
//
// A ZIP is an AREA. It cannot tell us which side of a district line the visitor
// lives on, so this module's job is to present genuine ambiguity honestly:
// everything is shown, ranked by how much of the ZIP each district covers, with
// slivers behind a disclosure rather than deleted.

/**
 * Below this share of the ZIP's area, an official goes behind the
 * "also partly in this ZIP" disclosure.
 *
 * PRESENTATION ONLY — the server never filters on share. Measured against real
 * data: ZIP 46360 touches 7 places and only 1 clears 2%, while ZIP 47401's
 * Bloomington slice sits under 10%. A server-side 10% cutoff would have deleted
 * a legitimate answer; 2% collapses noise without losing anyone.
 */
export const SHARE_DISCLOSURE_THRESHOLD = 0.02;

/** district_type -> plural human phrase, for the ambiguity sentence. */
const DISTRICT_TYPE_PLURALS = {
  NATIONAL_LOWER: 'US Representatives',
  STATE_UPPER: 'state senators',
  STATE_LOWER: 'state house members',
  COUNTY: 'county officials',
  LOCAL: 'local officials',
  LOCAL_EXEC: 'local executives',
  SCHOOL: 'school board members',
  JUDICIAL: 'judges',
  CITY_COUNCIL: 'council members',
  SCHOOL_BOARD: 'school board members',
  STATE_BOARD: 'state board members',
};

/**
 * splitByShare(politicians) -> { primary, collapsed }
 *
 * `primary` is sorted share-descending with null shares (statewide offices) last
 * — a statewide official has no share because a state contains the whole ZIP,
 * and that is not a reason to bury them.
 */
export function splitByShare(politicians) {
  const list = Array.isArray(politicians) ? politicians : [];
  const primary = [];
  const collapsed = [];

  for (const p of list) {
    const share = p?.share;
    if (share == null || share >= SHARE_DISCLOSURE_THRESHOLD) primary.push(p);
    else collapsed.push(p);
  }

  primary.sort((a, b) => {
    if (a.share == null && b.share == null) return 0;
    if (a.share == null) return 1;
    if (b.share == null) return -1;
    return b.share - a.share;
  });
  collapsed.sort((a, b) => (b.share ?? 0) - (a.share ?? 0));

  return { primary, collapsed };
}

/** One honest sentence about what this ZIP cannot pin down. '' when nothing is. */
export function ambiguityCopy(ambiguity) {
  const items = Array.isArray(ambiguity) ? ambiguity : [];
  if (items.length === 0) return '';

  const phrases = items.map(
    ({ district_type, count }) => `${count} ${DISTRICT_TYPE_PLURALS[district_type] ?? 'officials'}`,
  );
  const joined =
    phrases.length === 1
      ? phrases[0]
      : `${phrases.slice(0, -1).join(', ')} and ${phrases[phrases.length - 1]}`;

  return `${joined} serve parts of this ZIP code.`;
}

/**
 * Area voice, deliberately. Not "your representatives" — for most of the people
 * listed under a doubled office, that claim would be false.
 */
export function zipHeading(zip) {
  return `Officials serving ${zip}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd "/c/Transparent Motivations/essentials" && npx vitest run src/lib/zipResults.test.js`
Expected: PASS (11 tests)

- [ ] **Step 5: Add the `?zip=` entry mode to Results**

In `src/pages/Results.jsx`:

Add imports:

```js
import { fetchOfficialsByZip } from '../lib/api';
import { splitByShare, ambiguityCopy, zipHeading } from '../lib/zipResults';
```

Add state beside the other browse state:

```js
  const [zipInfo, setZipInfo] = useState(null); // { zip, states, county, ambiguity } | null
  const [zipNotFound, setZipNotFound] = useState(false);
```

Add the entry-mode effect next to the other `browse_*` on-mount readers (after the `browse_federal_officials` effect), following their established shape exactly:

```js
  // Handle ?zip=46220 — every official serving any part of a ZIP. Reuses browse
  // mode's many-officials-per-office rendering, because a ZIP genuinely returns
  // four state house members and browse mode is the one presentation that does
  // not claim any of them is yours.
  useEffect(() => {
    const zip = searchParams.get('zip');
    if (!zip) return;

    setSearchMode('browse');
    setBrowseLoading(true);
    setZipNotFound(false);
    setAddressInput(zip);

    fetchOfficialsByZip(zip).then(({ data, error }) => {
      if (error === 'ZIP_NOT_FOUND' || !data) {
        if (error && error !== 'ZIP_NOT_FOUND') console.error('zip lookup error:', error);
        setZipNotFound(true);
        setZipInfo(null);
        setBrowseResults([]);
        setBrowseLoading(false);
        return;
      }
      setZipInfo({ zip: data.zip, states: data.states, county: data.county, ambiguity: data.ambiguity });
      setBrowseResults(Array.isArray(data.politicians) ? data.politicians : []);
      setBrowseLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 6: Guard the banner against a stray `representing_city`**

Still in `Results.jsx`, in the `representingCity` `useMemo`, add a ZIP branch **before** the `searchMode === 'browse'` branch:

```js
    // ZIP mode has no single place of record: a ZIP can span several cities, and
    // deriving one from politician records would let a stray representing_city on
    // an overlapping district's official hijack the banner (the same hijack the
    // browse and coordinate branches below guard against). Return null and let the
    // state-level banner lead.
    if (zipInfo) return null;
```

Add `zipInfo` to that `useMemo`'s dependency array.

- [ ] **Step 7: Render the ZIP header, the ambiguity note, and the collapsed disclosure**

Where the results header renders (near the `searchMode === 'address' && activeQuery` block around line 2181), add a ZIP block using the pure helpers:

```jsx
              {zipInfo && (
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-[var(--ev-navy)] dark:text-white">
                    {zipHeading(zipInfo.zip)}
                  </h2>
                  {ambiguityCopy(zipInfo.ambiguity) && (
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {ambiguityCopy(zipInfo.ambiguity)}{' '}
                      Enter a full street address to see which ones are yours.
                    </p>
                  )}
                </div>
              )}
              {zipNotFound && (
                <p role="alert" className="mb-4 text-sm text-[var(--ev-coral)]">
                  We don&rsquo;t recognize that ZIP code. Check the digits, or enter a full street address.
                </p>
              )}
```

Then apply `splitByShare` where the ZIP-mode list feeds the grid: render `primary` normally, and put `collapsed` behind a `<details>` labelled "Also partly in this ZIP code ({collapsed.length})". Follow the existing grid/section components rather than introducing new card markup.

- [ ] **Step 8: Verify in the browser**

Run: `cd "/c/Transparent Motivations/essentials" && npm run dev`

Check each case by hand — there is no component-test harness, so this step is the verification, not a formality:
- `/results?zip=46220` — heading reads "Officials serving 46220"; four state house members appear; the note says "4 state house members and 3 state senators serve parts of this ZIP code."
- `/results?zip=46360` — one city in the main list, six behind the disclosure
- `/results?zip=47401` — Bloomington is present in the **main** list, not collapsed
- `/results?zip=00000` — the unrecognized-ZIP message, no empty grid
- Type `46220` into the Landing search box — the hint row reads "Press Enter to see everyone serving this ZIP code" and Enter navigates to `/results?zip=46220`
- Type `123 Main St, Bloomington IN 47401` — still the address hint and the address path
- Dark mode: heading, note, and disclosure are all legible
- No card anywhere in ZIP mode says "your representative"

- [ ] **Step 9: Run the suite and lint**

Run: `cd "/c/Transparent Motivations/essentials" && npm test && npm run lint && npm run build`
Expected: PASS all three. The build matters — `prebuild` runs `gen-coverage.mjs`.

- [ ] **Step 10: Commit**

```bash
git -C "/c/Transparent Motivations/essentials" add src/lib/zipResults.js src/lib/zipResults.test.js src/pages/Results.jsx
git -C "/c/Transparent Motivations/essentials" commit -m "feat(results): ?zip= mode, in area voice

'Officials serving 46220' — never 'your representatives'. A ZIP cannot
establish which side of a district line someone lives on, so for most of
the four state house members listed, the personal claim would be false.

Slivers are collapsed at 2%, never dropped: 46360 touches 7 places and
1 is real, but 47401's Bloomington slice sits under 10% and is a genuine
answer. Banner falls back to state — a ZIP has no single place of record
and a stray representing_city would hijack it.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**

| Spec section | Task |
|---|---|
| 1. What a ZIP can/cannot answer (ground truth) | Test fixtures in Tasks 3, 6, 8 |
| 2. Current state / broken stub | Task 4 (delete), Task 5 (route rewrite) |
| 3. Nationwide ZCTA import, simplified, `(geo_id,mtfcc)` upsert, dominant state | Task 6 |
| 3. Coverage this does/doesn't buy | Task 6 Step 5 (Miami spot-check) |
| 4. Trap 1 — `G6350` in the fallback clause + `geoIdGuard.ts` | Task 1; behavioural proof in Task 6 Step 4 |
| 4. Spatial predicate, `&&` prefilter, no OR | Task 3; EXPLAIN in Task 3 Step 8 |
| 4. Share, ranking, collapse (nothing dropped) | Task 3 (server), Task 8 (2% split) |
| 4. Multi-state ZIPs, >=1% | Task 3 (`statesQueryText`) |
| 4. Shared query body extraction | Task 2 |
| 5. API shape, `share`, `ambiguity` | Task 5 |
| 5. Trap 2 — cache key version | Task 4 |
| 5. Typeahead non-issue | No task needed — verified, nothing to change |
| 6. Classifier `'zip'` kind, ordering | Task 7 |
| 6. Combobox hint row | Task 7 Step 7 |
| 6. Results `?zip=` mode, area voice | Task 8 |
| 6. Banner: state, no `representing_city` | Task 8 Step 6 |
| 7. Testing (classifier, share math, 4 Indiana ZIPs, G6350 guard, no Seq Scan) | Tasks 1, 3, 6, 7, 8 |
| 8. Out of scope | No tasks — correctly absent |

No gaps.

**Placeholder scan:** The only intentional ellipses are the `/* ...verbatim... */` markers in Task 2 Step 3, where the instruction is explicitly *copy the existing text, do not retype it*, with a warning that the markers must not survive into the committed file. That is a copy instruction, not a TBD.

**Type consistency:** `ZipSearchResult` (Task 3) is what `getOfficialsByZip` returns (Task 4), what the route serializes (Task 5), and what `fetchOfficialsByZip` yields (Task 7). `share: number | null` holds that meaning in all four. `rollUpAmbiguity`'s output type matches `ambiguityCopy`'s input. `buildDistrictQuery`'s option names are identical in Tasks 2 and 3. `FALLBACK_EXCLUDED_MTFCC_SQL_LIST` is spelled the same in Tasks 1, 2 and 3.

**One ordering dependency worth restating:** Task 6 (data) must not land before Task 1 (guard) is **deployed**, not merely committed. Task 6 Step 2 checks `origin/master` for it and says stop if absent.
