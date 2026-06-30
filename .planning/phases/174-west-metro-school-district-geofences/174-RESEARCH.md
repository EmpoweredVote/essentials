# Phase 174: West-Metro School-District Geofences - Research

**Researched:** 2026-06-30
**Domain:** TIGER UNSD shapefile loader (G5420 geofences) for 5 Oregon west-metro school districts
**Confidence:** HIGH — all 5 GEOIDs verified via TIGERweb ACS2024 REST API (layer 10); exemplar loader read in full; schema confirmed from multiple prior phases

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Create a **dedicated west-metro loader script** (e.g. `load-or-westmetro-school-boundaries.ts`), cloned from `C:/EV-Accounts/backend/scripts/load-or-school-boundaries.ts`. Do **not** mutate the existing Multnomah loader. `EXPECTED_COUNT=5`, own `TARGET_GEOIDS` map of 5 entries. Same idempotent `ON CONFLICT (geo_id, mtfcc) DO NOTHING` insert; same `mtfcc='G5420'`, `state='41'`, `geo_id` = GEOID value directly.

- **D-02:** Tag the 5 new rows with a **distinct source string** — `tiger_unsd_or_2024_westmetro` — so the phase-186 audit can count west-metro rows separately from the 6 Multnomah rows (`tiger_unsd_or_2024`). The loader's post-insert verification counts `WHERE state='41' AND mtfcc='G5420' AND source='tiger_unsd_or_2024_westmetro'` and asserts `= 5`.

- **D-03:** Require a **real-address routing spot-check for all 5 districts** — not just the 2 named in SC#1. Each district must demonstrate a known in-district address resolving to the correct G5420 geo_id.

### Claude's Discretion

- Exact filename of the new loader script and the exact source-tag string (within the `tiger_unsd_or_2024_westmetro` intent).
- Which specific in-district test addresses to use for the 5 routing spot-checks.
- Whether to reuse the same `.tmp-or-school-unsd` download cache or a fresh temp dir.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WM-GEO-01 | West-metro school-district G5420 geofences loaded (TIGER UNSD pattern) for all 5 districts; any west-metro address routes to its correct school district; section-split scan clean | (1) All 5 GEOIDs confirmed via TIGERweb ACS2024 layer 10 (Unified School Districts); (2) All 5 are in the UNIFIED layer — confirmed present in tl_2024_41_unsd.zip; (3) Exemplar loader `load-or-school-boundaries.ts` read in full; (4) Distinct source tag `tiger_unsd_or_2024_westmetro` isolates west-metro rows; (5) G5420 section-split scan formulation documented; (6) 5 in-district test addresses proposed |

</phase_requirements>

---

## Summary

Phase 174 is a mechanical clone of the v10.0 Multnomah loader (`load-or-school-boundaries.ts`). The entire implementation is a new file with 3 constant changes: `TARGET_GEOIDS` (5 west-metro entries instead of 6 Multnomah), `EXPECTED_COUNT = 5`, and `SOURCE = 'tiger_unsd_or_2024_westmetro'`. Everything else — TIGER URL, download logic, zip extract, shapefile filter, geometry insertion SQL, idempotency guard, and post-insert assertion — is copied verbatim.

The critical research questions are all resolved:

1. **All 5 GEOIDs confirmed** via TIGERweb ACS2024 REST API (Unified School Districts layer 10, which corresponds to the TIGER UNSD shapefile): Beaverton SD 48J = `4101920`, Hillsboro SD 1J = `4100023`, Tigard-Tualatin SD 23J = `4112240`, Forest Grove SD 15 = `4105160`, Sherwood SD 88J = `4111290`. [VERIFIED: TIGERweb REST API layer 10]

2. **All 5 are unified districts** — they appear in TIGERweb layer 10 (Unified School Districts), which is the API analog of `tl_2024_41_unsd.zip`. All serve PK-12 grade spans; none are elementary-only (ELSD) or secondary-only (SCSD). The loader's "all-5-found-or-fail" assert will not trip. [VERIFIED: TIGERweb REST API layer 10 — each GEOID returned a NAME record from the Unified layer]

3. **The TIGER UNSD zip file is accessible** — the `tl_2024_41_unsd.zip` at the existing census.gov URL returned binary content successfully, confirming the file exists. [VERIFIED: census.gov TIGER2024/UNSD URL returned binary data]

4. **Section-split scan formulation** is a duplicate-geo_id / orphaned-row check (not the government_bodies office-coverage query). The correct check is: no G5420 row for these 5 geo_ids should be duplicated, and no row should exist with a mismatched state. The complete SQL is documented below.

5. **No migration ledger entry is required** for the loader — confirmed by v10.0 precedent. The loader writes directly via its own pg Pool; zero registration in `schema_migrations`. The on-disk counter is authoritative. However, the on-disk MAX as of 2026-06-30 is `1116` (not 1115 as noted in STATE.md at milestone start); the executor must run `ls migrations/ | sort -V | tail -1` to get the current MAX before any phase migration.

**Primary recommendation:** Clone `load-or-school-boundaries.ts` to `load-or-westmetro-school-boundaries.ts`. Change only the 3 constants. Run `--dry-run` first to confirm all 5 GEOIDs resolve. Run live. Verify with `smoke-or-westmetro-school.ts` against 5 in-district addresses.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| G5420 boundary download + insert | Database / Storage (geofence_boundaries) | CDN / External (census.gov TIGER) | TS loader downloads UNSD shapefile, filters to 5 GEOIDs, inserts polygons with geometry — same as v10.0 Multnomah loader |
| GEOID filter | Loader script (in-process) | — | `TARGET_GEOIDS` Map constant; loader processes only the 5 matching rows from the statewide shapefile |
| Routing (address → school district) | Database (PostGIS ST_Covers) | API / Backend | Existing backend PIP query against `essentials.geofence_boundaries` — no change required; 5 new G5420 rows are automatically live |
| Post-load verification | Database (SELECT COUNT) | — | Loader's built-in post-insert assertion; supplemented by smoke test script |
| Section-split scan | Database (SELECT query) | — | Manual SQL via psql; verifies no duplicate or mis-state G5420 rows |
| Phase-186 audit isolation | Source tag (D-02) | — | `WHERE source='tiger_unsd_or_2024_westmetro'` isolates the 5 west-metro rows from the 6 Multnomah rows |

---

## Standard Stack

This phase introduces **no new npm packages**. The loader's dependencies (`pg`, `adm-zip`, `shapefile`, `dotenv`, `https`, `fs`, `path`) are already present in `C:/EV-Accounts/backend` — used by the existing `load-or-school-boundaries.ts` and `load-ccsd-school-boundary.ts`.

### Core (reused from Multnomah loader)

| Tool / Pattern | Version | Purpose | Basis |
|----------------|---------|---------|-------|
| `pg` (Pool) | already installed | DB connection, parameterized queries | `load-or-school-boundaries.ts` line 62 |
| `adm-zip` | already installed | Extract `tl_2024_41_unsd.zip` | `load-or-school-boundaries.ts` lines 108–113 |
| `shapefile` | already installed | Read .shp + .dbf files | `load-or-school-boundaries.ts` line 150 |
| `dotenv/config` | already installed | Load DATABASE_URL from `.env` | `load-or-school-boundaries.ts` line 21 |
| `npx tsx` | already installed | Run TypeScript loader | Phase 166 executor pattern |

### No Package Legitimacy Audit Required

No new packages are installed in this phase — all dependencies pre-exist.

---

## The 5 Target GEOIDs

**CRITICAL: These are the exact values the planner MUST hardcode into `TARGET_GEOIDS`.**

| District | TIGER NAME (as in shapefile) | GEOID | Verification |
|----------|------------------------------|-------|--------------|
| Beaverton SD 48J | "Beaverton School District 48J" | `4101920` | [VERIFIED: TIGERweb REST /School/MapServer/10 GEOID='4101920'] |
| Hillsboro SD 1J | "Hillsboro School District 1J" | `4100023` | [VERIFIED: TIGERweb REST /School/MapServer/10 GEOID='4100023'] |
| Tigard-Tualatin SD 23J | "Tigard-Tualatin School District 23J" | `4112240` | [VERIFIED: TIGERweb REST /School/MapServer/10 GEOID='4112240'] |
| Forest Grove SD 15 | "Forest Grove School District 15" | `4105160` | [VERIFIED: TIGERweb REST /School/MapServer/10 GEOID='4105160'] |
| Sherwood SD 88J | "Sherwood School District 88J" | `4111290` | [VERIFIED: TIGERweb REST /School/MapServer/10 GEOID='4111290'] |

**GEOID format note:** Each GEOID is 7 characters (2-digit state FIPS `41` + 5-digit district code), matching the TIGER UNSD `GEOID` field exactly and the Multnomah loader pattern (e.g. `4110040` for Portland Public Schools).

**TIGER NAME vs. display name note:** The TIGER NAME field value is what the loader reads from the shapefile's DBF. The loader stores it as-is in `geofence_boundaries.name`. Downstream phases (183-184) reference the district by `geo_id`, not by name, so the TIGER name string does not need to match the human-display name exactly.

---

## UNSD vs. ELSD/SCSD Risk — RESOLVED

The #1 risk to the loader running clean was: are all 5 districts in the UNSD (unified) shapefile, or do any live in ELSD (elementary-only) or SCSD (secondary/union-high) layers?

**VERDICT: All 5 are unified districts.**

Evidence:
- All 5 returned records from TIGERweb layer 10, which is explicitly labeled "Unified School Districts" (the ACS2024 vintage). This is the API layer corresponding to `tl_2024_41_unsd.zip`. [VERIFIED: TIGERweb REST]
- All 5 serve PK-12 grade spans (confirmed by NCES district detail pages). [CITED: nces.ed.gov district detail pages for each ID]
- The "J" suffix in OR district names (48J, 1J, 23J, 88J) stands for "joint" (multi-county), which is an Oregon-specific administrative designation meaning the district spans county lines — it is orthogonal to the unified/elementary/secondary classification. Joint districts can be any type, but these 5 are all unified.
- None appeared in a test of TIGERweb layer 12 (Elementary School Districts) or layer 16 (Secondary School Districts). [ASSUMED: not explicitly tested on those layers, but layer 10 presence confirms unified status]

The loader's "all-5-found-or-fail" assert will trigger cleanly.

---

## Architecture Patterns

### System Architecture Diagram

```
census.gov/TIGER2024/UNSD/tl_2024_41_unsd.zip
             |
             v
    load-or-westmetro-school-boundaries.ts
    (download + cache to .tmp-or-westmetro-unsd/)
             |
             v
    Extract zip → read .shp + .dbf
             |
    Filter: GEOID in {4101920, 4100023, 4112240, 4105160, 4111290}
             |
             v  (5 matching features)
    ST_ForcePolygonCCW(ST_SetSRID(ST_Force2D(ST_GeomFromGeoJSON(...)), 4326))
             |
             v
    essentials.geofence_boundaries
    (5 rows: mtfcc='G5420', state='41', source='tiger_unsd_or_2024_westmetro')
             |
             v
    Post-insert assert: COUNT WHERE source='tiger_unsd_or_2024_westmetro' = 5
             |
             v
    smoke-or-westmetro-school.ts
    (5 in-district address → ST_Covers → verify G5420 geo_id matches expected GEOID)
```

### Recommended Project Structure

New files (all in `C:/EV-Accounts/backend/scripts/`):

```
scripts/
├── load-or-westmetro-school-boundaries.ts   # The new loader (clone of load-or-school-boundaries.ts)
└── smoke-or-westmetro-school.ts             # New smoke test (clone of smoke-nv-geofences pattern)
```

No migration files are needed for this phase (loader writes via its own Pool).

### Pattern: Clone-and-configure (3 constant changes)

The loader is a 3-line diff from the Multnomah exemplar:

```typescript
// load-or-westmetro-school-boundaries.ts
// Source: C:/EV-Accounts/backend/scripts/load-or-school-boundaries.ts (read 2026-06-30)

const TIGER_URL    = 'https://www2.census.gov/geo/tiger/TIGER2024/UNSD/tl_2024_41_unsd.zip';  // UNCHANGED
const MTFCC        = 'G5420';        // UNCHANGED
const STATE        = '41';           // UNCHANGED (Oregon FIPS)
const SOURCE       = 'tiger_unsd_or_2024_westmetro';  // CHANGED (D-02: distinct tag)
const EXPECTED_COUNT = 5;            // CHANGED (D-01: 5 not 6)

const TARGET_GEOIDS = new Map<string, string>([  // CHANGED (D-01: 5 west-metro districts)
  ['4101920', 'Beaverton School District 48J'],   // VERIFIED: TIGERweb layer 10
  ['4100023', 'Hillsboro School District 1J'],    // VERIFIED: TIGERweb layer 10
  ['4112240', 'Tigard-Tualatin School District 23J'], // VERIFIED: TIGERweb layer 10
  ['4105160', 'Forest Grove School District 15'], // VERIFIED: TIGERweb layer 10
  ['4111290', 'Sherwood School District 88J'],    // VERIFIED: TIGERweb layer 10
]);

// Temp dir: use a fresh name to avoid mixing with Multnomah cache
const baseName = 'tl_2024_41_unsd';
const tmpRoot  = path.join(process.cwd(), '.tmp-or-westmetro-school-unsd');
// ... rest of file identical to load-or-school-boundaries.ts
```

**Note on temp dir:** The Multnomah loader uses `.tmp-or-school-unsd`. A separate temp dir (`.tmp-or-westmetro-school-unsd`) avoids cross-contamination if both loaders run in the same session. Both download the same statewide zip (`tl_2024_41_unsd.zip`) — the file is cached separately but that is harmless (≈3 MB). Claude's discretion per CONTEXT.md: the planner may choose to share the cache dir (save bandwidth) or use a separate dir (simpler provenance). Research recommends separate for clarity.

### Insert SQL (identical to exemplar)

```sql
-- Source: load-or-school-boundaries.ts lines 210-219 (read 2026-06-30)
INSERT INTO essentials.geofence_boundaries
  (geo_id, ocd_id, name, state, mtfcc, geometry, source, imported_at)
VALUES ($1, $2, $3, $4, $5,
  public.ST_ForcePolygonCCW(
    public.ST_SetSRID(public.ST_Force2D(public.ST_GeomFromGeoJSON($6)), 4326)
  ),
  $7, now())
ON CONFLICT (geo_id, mtfcc) DO NOTHING
```

Parameters: `[geoId, geoId, name, '41', 'G5420', geometryJson, 'tiger_unsd_or_2024_westmetro']`

### Anti-Patterns to Avoid

- **Mutating the Multnomah loader:** Adding west-metro GEOIDs to `load-or-school-boundaries.ts` breaks D-01 and the phase-186 audit isolation (both sets would share `source='tiger_unsd_or_2024'`).
- **Hard-coding wrong GEOIDs:** NCES IDs and TIGER GEOIDs are the same value for school districts, but Oregon FIPS is `41` and must prefix the district code. Example: Beaverton NCES code within OR = `01920`, full GEOID = `4101920`. All 5 verified above.
- **Using state='or' (lowercase) in geofence_boundaries:** The geofence row uses `state='41'` (FIPS numeric string), NOT `state='or'`. The `essentials.districts` row for downstream school-board phases uses `state='or'` (lowercase) — this is a separate table with different conventions. [VERIFIED: load-or-school-boundaries.ts line 33, STATE='41']
- **Registering this as a schema_migration:** The loader writes via its own Pool — NOT a registered migration. Per v10.0 precedent, no `schema_migrations` entry is created. The on-disk counter is NOT bumped by this phase. [VERIFIED: load-or-school-boundaries.ts — no schema_migrations INSERT]

---

## Section-Split Scan for G5420 Geofence Tier

The standard section-split scan (per `feedback_section_split_check`) checks for split government_bodies/office coverage (officials appearing in the wrong section because their district geo_id is shared across governments). That scan does NOT apply to geofence_boundaries rows, which have no government linkage.

The correct scan for the G5420 geofence tier is a **duplicate/integrity check** across the 5 new district geo_ids. SC#3 ("section-split scan = 0 rows") means:

**Gate 1 — No duplicate geo_ids for the west-metro batch:**
```sql
-- Must return 0 rows (no duplicate geo_id/mtfcc pairs in the west-metro batch)
SELECT geo_id, COUNT(*) AS cnt
FROM essentials.geofence_boundaries
WHERE state = '41'
  AND mtfcc = 'G5420'
  AND source = 'tiger_unsd_or_2024_westmetro'
GROUP BY geo_id
HAVING COUNT(*) > 1;
-- Expected: 0 rows
```

**Gate 2 — Exactly 5 west-metro rows inserted:**
```sql
SELECT COUNT(*) AS westmetro_count
FROM essentials.geofence_boundaries
WHERE state = '41'
  AND mtfcc = 'G5420'
  AND source = 'tiger_unsd_or_2024_westmetro';
-- Expected: 5
```

**Gate 3 — Existing 6 Multnomah rows untouched:**
```sql
SELECT COUNT(*) AS multnomah_count
FROM essentials.geofence_boundaries
WHERE state = '41'
  AND mtfcc = 'G5420'
  AND source = 'tiger_unsd_or_2024';
-- Expected: 6 (unchanged from v10.0 load)
```

**Gate 4 — All geometries valid (no NULL or invalid polygons):**
```sql
SELECT COUNT(*) AS invalid_count
FROM essentials.geofence_boundaries
WHERE state = '41'
  AND mtfcc = 'G5420'
  AND source = 'tiger_unsd_or_2024_westmetro'
  AND (geometry IS NULL OR NOT ST_IsValid(geometry));
-- Expected: 0
```

**Gate 5 — Sentinel: Beaverton SD geo_id present with correct name:**
```sql
SELECT geo_id, name, mtfcc, source
FROM essentials.geofence_boundaries
WHERE state = '41' AND geo_id = '4101920';
-- Expected: 1 row, name='Beaverton School District 48J', mtfcc='G5420'
```

**Note on the "section-split" terminology:** In the context of this geofence-only phase (no government/chambers/offices created), "section-split scan = 0" means the 5 new rows have no structural defects (no duplicates, all present, all valid geometry, Multnomah batch unaffected). The government_bodies section-split query from `feedback_section_split_check` is irrelevant here because this phase creates no government rows — those come in phases 183-184.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Download zip with redirects | Custom HTTP client | `downloadWithRedirects()` in exemplar | Census.gov issues 301/302 redirects; exemplar already handles this correctly |
| Extract zip file | Manual unzip | `AdmZip` (already in loader) | Cross-platform, already present |
| Read shapefile features | Custom binary parser | `shapefile` npm package (already installed) | Handles .shp + .dbf encoding correctly |
| Geometry normalization | Manual ST_* calls | `ST_ForcePolygonCCW(ST_SetSRID(ST_Force2D(...), 4326))` in the INSERT | Ring winding direction + SRID + Z-coordinate stripping are all needed; exemplar handles all three |
| Idempotency | Check-then-insert | `ON CONFLICT (geo_id, mtfcc) DO NOTHING` | Safe re-runs; no partial-state errors |

---

## In-District Routing Spot-Check Addresses (D-03)

One real street address per district for the 5 routing spot-checks. Each should resolve via `ST_Covers(geometry, ST_SetSRID(ST_MakePoint(lon, lat), 4326))` against `essentials.geofence_boundaries WHERE state='41'` and return the matching G5420 geo_id.

| District | Test Address / Landmark | Approx. Lon | Approx. Lat | Expected G5420 geo_id |
|----------|------------------------|------------|------------|----------------------|
| Beaverton SD 48J | Beaverton City Hall (12725 SW Millikan Way, Beaverton OR 97005) | -122.8011 | 45.4871 | `4101920` |
| Hillsboro SD 1J | Hillsboro City Hall (150 E Main St, Hillsboro OR 97123) | -122.9898 | 45.5229 | `4100023` |
| Tigard-Tualatin SD 23J | Tigard City Hall (13125 SW Hall Blvd, Tigard OR 97223) | -122.7714 | 45.4312 | `4112240` |
| Forest Grove SD 15 | Forest Grove City Hall (1924 Council St, Forest Grove OR 97116) | -123.1073 | 45.5195 | `4105160` |
| Sherwood SD 88J | Sherwood City Hall (22560 SW Pine St, Sherwood OR 97140) | -122.8404 | 45.3565 | `4111290` |

**Confidence on test addresses:** [ASSUMED] — City hall coordinates are approximated from well-known addresses. The executor should geocode these before asserting specific lat/lon values. The critical verification is that the returned `geo_id` matches the expected GEOID above, not the exact coordinate.

**Routing mechanism:** The backend's existing `ST_Covers` query against `essentials.geofence_boundaries` (same query used by `smoke-or-geofences.ts` and `smoke-nv-geofences.ts`) already supports G5420. Adding 5 new G5420 rows is sufficient — no backend code change required.

**Smoke test script pattern:** Clone `smoke-or-geofences.ts` as `smoke-or-westmetro-school.ts`. Use `WHERE state = '41'` and assert each test address returns a G5420 row with the expected geo_id. Include a count check: `WHERE state='41' AND mtfcc='G5420' AND source='tiger_unsd_or_2024_westmetro'` = 5.

---

## Migration Ledger Confirmation

**The loader does NOT register a schema_migration.** Evidence:
- `load-or-school-boundaries.ts` (v10.0 exemplar) contains zero `INSERT INTO schema_migrations` statement — confirmed by reading the full 269-line file. [VERIFIED: load-or-school-boundaries.ts read in full 2026-06-30]
- The v10.0 Multnomah loader ran and the 6 G5420 rows exist with `source='tiger_unsd_or_2024'` — no migration was registered for them. [VERIFIED: 174-CONTEXT.md "DB state confirmed clean (2026-06-30): exactly 6 G5420/state='41' rows"]
- The CONTEXT.md explicitly flags: "NOTE: this loader writes via the TS script's own DB pool, NOT a registered migration — confirm at plan time whether any migration ledger entry is warranted".

**Conclusion:** Phase 174 bumps NEITHER `schema_migrations` NOR the on-disk migration file counter. The on-disk counter stays at whatever MAX exists when the phase runs. The executor must verify the current MAX before writing any downstream migration (for phases 183-184).

**Current on-disk MAX (2026-06-30):** `1116` — not `1115` as STATE.md noted at milestone start. The counter has moved since roadmap creation. The executor must re-confirm this at execution time with `ls C:/EV-Accounts/backend/migrations/ | sort -V | tail -1`. [VERIFIED: ls output 2026-06-30]

---

## Common Pitfalls

### Pitfall 1: Wrong GEOID (NCES format vs. TIGER format)
**What goes wrong:** Using a 5- or 7-digit NCES "state-within" code instead of the full 7-digit TIGER GEOID. Example: Beaverton NCES internal code is `01920`, but the TIGER GEOID is `4101920` (prepend state FIPS `41`).
**Why it happens:** Some data sources report the district code without the state prefix.
**How to avoid:** All 5 GEOIDs in the table above are the full 7-digit TIGER GEOID form. Use those exactly.
**Warning signs:** Loader dry-run reports "Found 0 GEOIDs" or "Missing: 4101920" — means GEOID mismatch.

### Pitfall 2: Wrong TIGER shapefile (ELSD or SCSD instead of UNSD)
**What goes wrong:** Loader downloads elementary (`tl_2024_41_elsd.zip`) or secondary (`tl_2024_41_scsd.zip`) shapefile and fails to find the 5 GEOIDs.
**Why it happens:** Typo in the URL constant.
**How to avoid:** URL must be `.../TIGER2024/UNSD/tl_2024_41_unsd.zip` (confirmed working). All 5 districts are UNIFIED. [VERIFIED]
**Warning signs:** Dry-run returns 0 matches but the GEOID format is correct.

### Pitfall 3: Mutating the Multnomah loader
**What goes wrong:** Editor opens `load-or-school-boundaries.ts` and saves the west-metro GEOIDs into it instead of creating a new file.
**Why it happens:** Convenience — the file is already open.
**How to avoid:** Always create a NEW file. The old Multnomah loader MUST NOT be touched. This is D-01 (locked).
**Warning signs:** `git diff` shows changes to `load-or-school-boundaries.ts`.

### Pitfall 4: Routing test uses wrong state filter
**What goes wrong:** Smoke test queries `WHERE state = 'or'` instead of `WHERE state = '41'`.
**Why it happens:** Confusing `essentials.districts.state` (lowercase `'or'`) with `essentials.geofence_boundaries.state` (FIPS `'41'`).
**How to avoid:** Geofence boundaries always use the numeric FIPS code as a string. The geofence ST_Covers query must use `state = '41'`. [VERIFIED: smoke-or-geofences.ts line 72]
**Warning signs:** Routing query returns 0 rows even though loader ran successfully.

### Pitfall 5: On-disk migration counter stale
**What goes wrong:** Executor uses `1115` (STATE.md value at milestone start) as the next migration, but counter is now `1116`.
**Why it happens:** Other phases (FL 2026 elections etc.) consumed migrations between milestone planning and execution.
**How to avoid:** Always run `ls C:/EV-Accounts/backend/migrations/ | sort -V | tail -1` inline at execution start.
**Warning signs:** Duplicate migration number conflict when downstream phases (183-184) register their migrations.

---

## Code Examples

### Minimal TARGET_GEOIDS map for the new loader
```typescript
// Source: verified via TIGERweb REST /School/MapServer/10 (ACS2024), 2026-06-30
const TARGET_GEOIDS = new Map<string, string>([
  ['4101920', 'Beaverton School District 48J'],
  ['4100023', 'Hillsboro School District 1J'],
  ['4112240', 'Tigard-Tualatin School District 23J'],
  ['4105160', 'Forest Grove School District 15'],
  ['4111290', 'Sherwood School District 88J'],
]);
const EXPECTED_COUNT = 5;
const SOURCE = 'tiger_unsd_or_2024_westmetro';
```

### Post-load verification query (inline in loader, Step 8)
```typescript
// Source: load-or-school-boundaries.ts lines 241-253 (adapted)
const verify = await pool.query<{ cnt: string }>(`
  SELECT COUNT(*) AS cnt
  FROM essentials.geofence_boundaries
  WHERE state = $1
    AND mtfcc = $2
    AND source = $3
`, [STATE, MTFCC, SOURCE]);
const total = parseInt(verify.rows[0].cnt, 10);
if (total !== EXPECTED_COUNT) {
  console.warn(`  WARNING: Expected ${EXPECTED_COUNT} rows, found ${total}`);
} else {
  console.log(`  All ${EXPECTED_COUNT} west-metro OR school district boundaries loaded successfully.`);
}
```

### Routing spot-check query pattern (for smoke test)
```typescript
// Source: smoke-or-geofences.ts lines 67-76 (adapted for state='41')
const res = await client.query(
  `SELECT geo_id, name, mtfcc
   FROM essentials.geofence_boundaries
   WHERE state = '41'
     AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326))
     AND mtfcc = 'G5420'
   ORDER BY name`,
  [lon, lat],
);
// Assert: res.rows[0].geo_id === expectedGeoId
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-district geometry shell (ACPS/Boston — no geometry on insert) | Geometry in the loader INSERT directly | v10.0 (Phase 78 OR school boundary load) | No follow-up geometry-backfill migration needed |
| Shared source tag for all OR school batches | Distinct source tag per batch (`tiger_unsd_or_2024` vs `tiger_unsd_or_2024_westmetro`) | This phase (D-02 new) | Phase-186 audit can count each batch independently |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Test address lat/lon values for the 5 routing spot-checks are approximate city hall coordinates | In-District Routing Spot-Check Addresses | The wrong coordinate might be outside the district boundary → smoke test FAIL; executor must geocode and verify coordinates |
| A2 | TIGER NAME field in shapefile matches the strings in the TARGET_GEOIDS map values (e.g. "Beaverton School District 48J") | Target GEOIDs table | If shapefile NAME field differs slightly, the name stored in geofence_boundaries.name will differ — does not affect routing (joins on geo_id) but affects display; executor should check --dry-run output |
| A3 | None of the 5 districts' TIGER polygons require `ST_MakeValid` (no self-intersections) | Code Examples | Henderson (Phase 163) needed ST_MakeValid for one ring; Sherwood/Forest Grove are smaller districts — unlikely but the loader's ON CONFLICT handles retries |

**If this table were empty:** All claims in this research were verified or cited — no user confirmation needed. A1 and A2 are low-risk; A3 is unlikely to trigger.

---

## Open Questions (RESOLVED)

> Both questions resolved at planning time (Phase 174 plan 174-01): neither affects which GEOIDs to use, the loader structure, or success criteria. Q1 is cosmetic (display name only; routing joins on geo_id) and handled by --dry-run inspection in plan Task 1. Q2 does not apply to this phase (no migration registered); the executor re-confirms the on-disk MAX inline for downstream phases 183-184 per Pitfall 5.

1. **TIGER NAME exact string in shapefile**
   - What we know: TIGERweb API returned "Beaverton School District 48J", "Hillsboro School District 1J", etc.
   - What's unclear: Whether the DBF `NAME` field in `tl_2024_41_unsd.zip` uses this exact string or a slightly different form (e.g. abbreviations).
   - Recommendation: The executor should run `--dry-run` first and inspect the console output line `Found GEOID=4101920: [name shown]` to confirm. The loader prints the NAME from TARGET_GEOIDS (not the shapefile NAME), so the shapefile's name is not directly visible — but the GEOID match is what matters for routing.

2. **On-disk migration counter at execution time**
   - What we know: MAX = 1116 as of 2026-06-30; this phase does not register a migration.
   - What's unclear: Whether additional migrations will be added between research and execution.
   - Recommendation: Executor always runs `ls C:/EV-Accounts/backend/migrations/ | sort -V | tail -1` as Wave 0 step.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js + npx tsx | Run loader script | ✓ | (existing, used by all prior loaders) | — |
| DATABASE_URL env var | Loader DB connection | ✓ | Production Supabase pooler | — |
| Internet access to census.gov | Download `tl_2024_41_unsd.zip` | ✓ | (~3 MB zip; confirmed HTTP-200 2026-06-30) | Use existing `.tmp-or-school-unsd/` cache if already downloaded |
| `adm-zip`, `shapefile`, `pg` npm packages | Loader dependencies | ✓ | Already in `C:/EV-Accounts/backend/node_modules` | — |
| `psql` CLI | Section-split scan SQL | ✓ | Used by all prior phases | Inline via pool.query in loader |

**Missing dependencies with no fallback:** None.

---

## Validation Architecture

**Note:** `workflow.nyquist_validation` is not explicitly set in `.planning/config.json` (config only contains `_auto_chain_active: true`) — treated as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Custom TypeScript smoke scripts (project convention) |
| Config file | None — standalone `npx tsx scripts/*.ts` scripts |
| Quick run command | `npx tsx scripts/load-or-westmetro-school-boundaries.ts --dry-run` |
| Full suite command | `npx tsx scripts/smoke-or-westmetro-school.ts` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WM-GEO-01 | 5 G5420 rows inserted for west-metro districts | integration | loader post-insert assert (COUNT = 5) | ❌ Wave 0 — create loader |
| WM-GEO-01 | Beaverton address returns geo_id `4101920` | smoke | `npx tsx scripts/smoke-or-westmetro-school.ts` | ❌ Wave 0 — create smoke script |
| WM-GEO-01 | Hillsboro address returns geo_id `4100023` | smoke | `npx tsx scripts/smoke-or-westmetro-school.ts` | ❌ Wave 0 — create smoke script |
| WM-GEO-01 | All 3 remaining districts spot-checked (D-03) | smoke | `npx tsx scripts/smoke-or-westmetro-school.ts` | ❌ Wave 0 — create smoke script |
| WM-GEO-01 | Section-split scan returns 0 rows | SQL gate | `psql $DATABASE_URL -c "SELECT ..."` | ❌ Wave 0 — inline SQL |
| WM-GEO-01 | Multnomah 6 rows untouched (source='tiger_unsd_or_2024') | SQL gate | `psql $DATABASE_URL -c "SELECT COUNT(*) ..."` | ❌ Wave 0 — inline SQL |

### Sampling Rate

- **Per wave:** `npx tsx scripts/load-or-westmetro-school-boundaries.ts --dry-run` (confirm 5 GEOIDs found before live run)
- **Phase gate:** `npx tsx scripts/smoke-or-westmetro-school.ts` exits 0 + section-split SQL returns 0 rows

### Wave 0 Gaps

- [ ] `scripts/load-or-westmetro-school-boundaries.ts` — the loader (clone of exemplar, 3-constant change)
- [ ] `scripts/smoke-or-westmetro-school.ts` — smoke test (5 in-district addresses, G5420 geo_id assertions)
- [ ] Section-split SQL gates (inline in plan or as `verify-or-westmetro-school.sql`)

---

## Security Domain

> Security enforcement applies. However, this phase is a data-load script (no API endpoints, no user input, no auth flows).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | — (no user auth in loader) |
| V3 Session Management | No | — |
| V4 Access Control | No | — |
| V5 Input Validation | Minimal | GEOID values are hardcoded constants — no user input |
| V6 Cryptography | No | — |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection via GEOID | Tampering | GEOID values are hardcoded constants, not user input; parameterized queries used anyway (confirmed in loader source) |
| Malicious TIGER zip content | Tampering | Census.gov is authoritative source; download-with-redirect checks HTTP 200 |

---

## Sources

### Primary (HIGH confidence)

- TIGERweb REST `/School/MapServer/10` (ACS2024 Unified School Districts layer) — all 5 GEOIDs queried individually and confirmed present with correct NAME values
- `C:/EV-Accounts/backend/scripts/load-or-school-boundaries.ts` — exemplar loader read in full (2026-06-30); all constants, SQL, and flow documented
- `C:/EV-Accounts/backend/scripts/load-ccsd-school-boundary.ts` — second UNSD loader read in full (confirms pattern is stable across NV and OR)
- `C:/EV-Accounts/backend/scripts/smoke-or-geofences.ts` — confirmed routing query pattern for state='41'
- `C:/EV-Accounts/backend/scripts/verify-or-tiger-import.sql` — confirmed no G5420 in the Phase 72 OR TIGER gates (only G4020/G4110/G5200/G5210/G5220)
- `C:/EV-Accounts/backend/migrations/254_or_school_districts.sql` — confirms downstream pattern (migration 254 creates districts + governments that reference these geo_ids; loader must run BEFORE it)
- `.planning/phases/174-west-metro-school-district-geofences/174-CONTEXT.md` — locked decisions read

### Secondary (MEDIUM confidence)

- [NCES district detail for Beaverton SD 48J](https://nces.ed.gov/ccd/districtsearch/district_detail.asp?ID2=4101920) — confirms ID 4101920, PK-12 grade span
- [NCES district detail for Hillsboro SD 1J](https://nces.ed.gov/ccd/districtsearch/district_detail.asp?Search=2&ID2=4100023) — confirms ID 4100023
- [NCES district detail for Tigard-Tualatin SD 23J](https://nces.ed.gov/ccd/districtsearch/district_detail.asp?ID2=4112240) — confirms ID 4112240
- [NCES district detail for Forest Grove SD 15](https://nces.ed.gov/ccd/districtsearch/district_detail.asp?Search=2&ID2=4105160) — confirms ID 4105160
- [NCES district detail for Sherwood SD 88J](https://nces.ed.gov/ccd/districtsearch/district_detail.asp?Search=2&DistrictID=4111290&ID2=4111290) — confirms ID 4111290
- TIGERweb `/School/MapServer/layers` — confirmed layer 10 = "Unified School Districts" (ACS2024 group)

### Tertiary (LOW confidence)

- Approximate city hall coordinates for the 5 routing test addresses — training knowledge; executor must geocode to confirm.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; exemplar read in full
- GEOIDs: HIGH — verified via TIGERweb REST API
- UNSD/ELSD/SCSD risk: HIGH — all 5 confirmed in Unified layer
- Architecture: HIGH — mechanical clone with 3 constant changes
- Section-split scan: HIGH — query formulated from understanding of the geofence schema
- Test addresses: LOW — approximate city hall coordinates, not geocode-verified

**Research date:** 2026-06-30
**Valid until:** 2027-01-01 (TIGER 2024 shapefiles stable; GEOIDs stable between census vintages)

---

## RESEARCH COMPLETE

**Phase:** 174 - West-Metro School-District Geofences
**Confidence:** HIGH

### Key Findings

- **All 5 GEOIDs confirmed via TIGERweb ACS2024 REST API (layer 10):** Beaverton `4101920`, Hillsboro `4100023`, Tigard-Tualatin `4112240`, Forest Grove `4105160`, Sherwood `4111290`. Each returned a matching NAME record from the Unified School Districts layer.
- **All 5 are UNIFIED districts** — present in `tl_2024_41_unsd.zip`, not ELSD or SCSD. The loader's "all-5-found-or-fail" assert will trigger cleanly.
- **Implementation is a 3-constant clone** of `load-or-school-boundaries.ts`: change `TARGET_GEOIDS` (5 entries), `EXPECTED_COUNT` (5), and `SOURCE` (`tiger_unsd_or_2024_westmetro`). TIGER URL, geometry SQL, and all other logic are unchanged.
- **No schema_migration registration** — confirmed by v10.0 precedent (loader writes via its own Pool). On-disk counter stays at current MAX (1116 as of research date; executor must re-verify).
- **Section-split scan for the geofence tier** is a duplicate/integrity check on the 5 new geo_ids (not the government_bodies office-coverage query) — 4 SQL gates documented.

### File Created

`C:\Transparent Motivations\essentials\.planning\phases\174-west-metro-school-district-geofences\174-RESEARCH.md`

### Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| GEOIDs | HIGH | Verified via TIGERweb REST API, individual queries per district |
| UNSD layer membership | HIGH | All 5 returned records from Unified layer (layer 10), not Secondary or Elementary |
| Standard stack | HIGH | Exemplar loader read in full; 3-constant change is the entire diff |
| Section-split scan | HIGH | Query derived from geofence schema understanding + prior OR phase SQL |
| Test addresses | LOW | Approximate city hall coordinates; executor must geocode |

### Open Questions

- TIGER NAME exact string in DBF (minor: affects display name in geofence_boundaries.name, not routing)
- On-disk migration counter at execution time (verify inline: current MAX = 1116)

### Ready for Planning

Research complete. Planner can now create PLAN.md files.
