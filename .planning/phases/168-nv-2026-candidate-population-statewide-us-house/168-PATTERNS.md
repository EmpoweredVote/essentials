# Phase 168: NV 2026 Candidate Population — Statewide & US House - Pattern Map

**Mapped:** 2026-06-30
**Files analyzed:** 2 new files (migration + smoke harness)
**Analogs found:** 2 / 2

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `C:/EV-Accounts/backend/migrations/1114_nv_2026_candidates.sql` | migration | CRUD (INSERT race_candidates) | `1072_seed_2026_statewide_general_candidates.sql` | exact |
| `C:/EV-Accounts/backend/scripts/_apply-migration-1114.ts` | smoke harness | request-response (DB assertions) | `_apply-migration-1113.ts` + `_apply-migration-1112.ts` | exact |

---

## Pattern Assignments

### `C:/EV-Accounts/backend/migrations/1114_nv_2026_candidates.sql` (migration, CRUD)

**Primary analog:** `C:/EV-Accounts/backend/migrations/1072_seed_2026_statewide_general_candidates.sql`
**Secondary analog (US House shape):** `C:/EV-Accounts/backend/migrations/1091_seed_ca_2026_house_candidates.sql`

---

**Header comment pattern** (1072 lines 1–19):

```sql
-- Migration 1114: Seed Nov 3 2026 NV general-election candidates for statewide + US House races
--
-- Populates essentials.race_candidates for the 10 in-scope NV 2026 general-election races
-- seeded in Phase 167 (migration 1112): 6 STATE_EXEC (Governor, Lt. Governor, Attorney General,
-- Secretary of State, Treasurer, Controller) + 4 NATIONAL_LOWER (NV-01…NV-04).
--
-- Candidates are the verified Nov 3 general-election ballot, confirmed against NV SoS official
-- primary results (nvsos.gov/SOSelectionPages/results/2026StateWidePrimary/ElectionSummary.aspx)
-- and multiple AP-called news sources. Only CONFIRMED candidates are seeded — evidence-only (D-04).
--
-- Incumbents are linked to their existing politician records (politician_id) so the feed shows
-- their photo/profile via COALESCE(rc.photo_url, pi.url). Cross-office links (D-02): Aaron Ford
-- (current AG running for Governor) and Nicole Cannizzaro / Carrie Buck (current legislators
-- running for statewide/federal office) are linked by live-queried politician_id. Challengers
-- with no existing record have politician_id = NULL; headshots added in Plan 02 via find-headshots.
-- Party is intentionally NOT stored (antipartisan design — D-06).
--
-- Held back (not yet certified — add after official certification):
--   * Governor independents (Battenberg et al.) — declared but cert status unconfirmed (D-04)
--   * NV-01 independents (Bobby Khan, Steven St John, Anthony Thomas Jr., Victor Willert) — same
-- Idempotent: skips a (race_id, full_name) pair that already exists.
-- NO schema_migrations INSERT (D-06; on-disk counter authoritative).
```

---

**Core INSERT pattern** (1072 lines 20–52, adapted for NV):

```sql
BEGIN;

-- ============================================================
-- SECTION 1: Statewide executive races (6 offices, STATE_EXEC)
-- race_ids resolved via Wave 0 pre-check query; hardcoded here
-- after live resolution against essentials.races.
-- ============================================================
INSERT INTO essentials.race_candidates
  (race_id, politician_id, full_name, first_name, last_name, is_incumbent, candidate_status, source)
SELECT v.race_id::uuid, v.politician_id::uuid, v.full_name, v.first_name, v.last_name,
       v.is_incumbent, 'active', v.source
FROM (VALUES
  -- Governor (race_id = [resolved UUID from Wave 0 query])
  -- Joe Lombardo: is_incumbent=true; politician_id from live query WHERE full_name='Joe Lombardo'
  ('[gov_race_id]', '[lombardo_pid]', 'Joe Lombardo', 'Joe', 'Lombardo', true,
   'https://en.wikipedia.org/wiki/2026_Nevada_gubernatorial_election'),
  -- Aaron Ford: cross-office (current AG, running for Gov); D-02 link if record found
  ('[gov_race_id]', '[ford_pid_or_NULL]', 'Aaron Ford', 'Aaron', 'Ford', false,
   'https://en.wikipedia.org/wiki/2026_Nevada_gubernatorial_election'),

  -- Lt. Governor (race_id = [resolved UUID])
  ('[ltgov_race_id]', '[anthony_pid]', 'Stavros Anthony', 'Stavros', 'Anthony', true,
   'https://www.nbcnews.com/politics/2026-primary-elections/nevada-lieutenant-governor-results'),
  ('[ltgov_race_id]', NULL, 'Sandra Jauregui', 'Sandra', 'Jauregui', false,
   'https://www.nbcnews.com/politics/2026-primary-elections/nevada-lieutenant-governor-results'),

  -- Attorney General — OPEN SEAT (Ford ran for Gov; is_incumbent=false for ALL candidates)
  ('[ag_race_id]', '[cannizzaro_pid_or_NULL]', 'Nicole Cannizzaro', 'Nicole', 'Cannizzaro', false,
   'https://www.reviewjournal.com/news/politics-and-government/nevada/cannizzaro-wins-democratic-attorney-general-primary-other-statewide-races-competitive-3836096/'),
  ('[ag_race_id]', NULL, 'Adriana Guzmán Fralick', 'Adriana', 'Guzmán Fralick', false,
   'https://www.reviewjournal.com/news/politics-and-government/nevada/cannizzaro-wins-democratic-attorney-general-primary-other-statewide-races-competitive-3836096/'),

  -- Secretary of State
  ('[sos_race_id]', '[aguilar_pid]', 'Cisco Aguilar', 'Cisco', 'Aguilar', true,
   'https://www.kolotv.com/2026/06/16/marchant-wins-gop-primary-nevada-secretary-state/'),
  ('[sos_race_id]', NULL, 'Jim Marchant', 'Jim', 'Marchant', false,
   'https://www.kolotv.com/2026/06/16/marchant-wins-gop-primary-nevada-secretary-state/'),

  -- Treasurer — OPEN SEAT (Conine term-limited, ran for AG, lost — NO row for Conine; is_incumbent=false ALL)
  ('[treas_race_id]', NULL, 'Tya Mathis-Coleman', 'Tya', 'Mathis-Coleman', false,
   'https://www.reviewjournal.com/news/politics-and-government/nevada/cannizzaro-wins-democratic-attorney-general-primary-other-statewide-races-competitive-3836096/'),
  ('[treas_race_id]', NULL, 'Drew Johnson', 'Drew', 'Johnson', false,
   'https://www.reviewjournal.com/news/politics-and-government/nevada/johnson-carter-treasurer-primary-stays-razor-thin-as-nevada-count-continues-3836538/'),

  -- Controller — Andy Matthews confirmed external_id = -3200006 (migration 1050)
  ('[ctrl_race_id]', (SELECT id FROM essentials.politicians WHERE external_id = -3200006),
   'Andy Matthews', 'Andy', 'Matthews', true,
   'https://www.nvsos.gov/SOSelectionPages/results/2026StateWidePrimary/ElectionSummary.aspx'),
  ('[ctrl_race_id]', NULL, 'Michael MacDougall', 'Michael', 'MacDougall', false,
   'https://thenevadaindependent.com/article/2026-nevada-primary-election-results-live-blog')

) AS v(race_id, politician_id, full_name, first_name, last_name, is_incumbent, source)
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.race_candidates rc
  WHERE rc.race_id = v.race_id::uuid AND rc.full_name = v.full_name
);

-- ============================================================
-- SECTION 2: US House races (4 districts, NATIONAL_LOWER)
-- race_ids resolved via Wave 0 pre-check query.
-- Note: NV-02 is an OPEN SEAT (Amodei retired); is_incumbent=false all candidates.
-- Lynn Chapman (IAP, NV-02) is confirmed on general ballot per 2news.com (2026-06-30).
-- NV-01 independents and Governor independents held back (see held-back comment above).
-- ============================================================
INSERT INTO essentials.race_candidates
  (race_id, politician_id, full_name, first_name, last_name, is_incumbent, candidate_status, source)
SELECT v.race_id::uuid, v.politician_id::uuid, v.full_name, v.first_name, v.last_name,
       v.is_incumbent, 'active', v.source
FROM (VALUES
  -- NV-01 (Dina Titus incumbent; Carrie Buck = live-query for Phase-160 senator record)
  ('[nv01_race_id]', '[titus_pid]', 'Dina Titus', 'Dina', 'Titus', true,
   'https://en.wikipedia.org/wiki/2026_United_States_House_of_Representatives_elections_in_Nevada'),
  ('[nv01_race_id]', '[buck_pid_or_NULL]', 'Carrie Buck', 'Carrie', 'Buck', false,
   'https://en.wikipedia.org/wiki/2026_United_States_House_of_Representatives_elections_in_Nevada'),

  -- NV-02 (OPEN SEAT — Amodei retired; is_incumbent=false all; Lynn Chapman IAP confirmed)
  ('[nv02_race_id]', NULL, 'David Flippo', 'David', 'Flippo', false,
   'https://www.pbs.org/newshour/politics/trump-backed-david-flippo-wins-nevada-republican-primary-for-u-s-house-seat'),
  ('[nv02_race_id]', '[benitez_pid_or_NULL]', 'Teresa Benitez-Thompson', 'Teresa', 'Benitez-Thompson', false,
   'https://www.2news.com/news/local/voters-decide-david-flippo-teresa-benitez-thompson-advance-to-november/article_ea56d1ef-11f7-47a1-9308-d0733e5d9558.html'),
  ('[nv02_race_id]', NULL, 'Lynn Chapman', 'Lynn', 'Chapman', false,
   'https://www.2news.com/news/local/voters-decide-david-flippo-teresa-benitez-thompson-advance-to-november/article_ea56d1ef-11f7-47a1-9308-d0733e5d9558.html'),

  -- NV-03 (Susie Lee incumbent)
  ('[nv03_race_id]', '[lee_pid]', 'Susie Lee', 'Susie', 'Lee', true,
   'https://www.sanfordherald.com/news/national/candidates-notch-wins-in-nevada-u-s-house-primaries/article_ea45dd0b-74f8-5e3e-bff4-2d9b054992a5.html'),
  ('[nv03_race_id]', NULL, 'Marty O''Donnell', 'Marty', 'O''Donnell', false,
   'https://www.sanfordherald.com/news/national/candidates-notch-wins-in-nevada-u-s-house-primaries/article_ea45dd0b-74f8-5e3e-bff4-2d9b054992a5.html'),

  -- NV-04 (Steven Horsford incumbent)
  ('[nv04_race_id]', '[horsford_pid]', 'Steven Horsford', 'Steven', 'Horsford', true,
   'https://www.thecentersquare.com/nevada/article_c1f7da4e-1714-4ce0-a97a-931ed2458904.html'),
  ('[nv04_race_id]', NULL, 'Cody Whipple', 'Cody', 'Whipple', false,
   'https://www.thecentersquare.com/nevada/article_c1f7da4e-1714-4ce0-a97a-931ed2458904.html')

) AS v(race_id, politician_id, full_name, first_name, last_name, is_incumbent, source)
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.race_candidates rc
  WHERE rc.race_id = v.race_id::uuid AND rc.full_name = v.full_name
);
```

---

**Verification SELECT pattern** (1072 lines 54–68, adapted for NV):

```sql
-- Verify per-race candidate counts after seeding.
SELECT r.position_name, d.district_type,
       count(rc.id) AS candidates,
       count(rc.politician_id) AS linked
FROM essentials.races r
JOIN essentials.elections e ON e.id = r.election_id
JOIN essentials.offices o ON o.id = r.office_id
JOIN essentials.districts d ON d.id = o.district_id
LEFT JOIN essentials.race_candidates rc ON rc.race_id = r.id
WHERE e.name = 'NV 2026 Statewide General'
  AND d.district_type IN ('STATE_EXEC', 'NATIONAL_LOWER')
GROUP BY r.position_name, d.district_type
ORDER BY d.district_type, r.position_name;

COMMIT;
-- NO schema_migrations INSERT (on-disk counter authoritative per D-06)
```

---

**Critical adaptations for NV (vs. 1072 analog):**

1. **race_id resolution is mandatory (Wave 0 pre-check).** The 1072 analog hardcodes UUIDs for races seeded in earlier migrations whose IDs were already known. For NV, the 10 race UUIDs were generated by `gen_random_uuid()` in migration 1112 and cannot be predicted. The planner must include a Wave 0 task that runs the race_id resolution query from RESEARCH.md (joining races → elections → offices → districts WHERE e.name = 'NV 2026 Statewide General') and substitutes the 10 live UUIDs into the VALUES before writing the migration.

2. **politician_id resolution via live query, not hardcoded UUIDs.** The 1072 analog hardcodes politician UUIDs for pre-existing incumbents. For NV, the pre-existing statewide exec UUIDs (Governor, Lt. Gov, AG, SoS) are unknown without a live query — only Andy Matthews is confirmed (`external_id = -3200006`). The two patterns for politician_id resolution are:
   - Confirmed external_id: `(SELECT id FROM essentials.politicians WHERE external_id = -3200006)` — use for Andy Matthews only.
   - Live-queried UUID: hardcode the UUID discovered in Wave 0 pre-check for the other incumbents — do not use the external_id subquery for records whose external_id is unknown.

3. **Cross-office D-02 linking.** Unlike 1072 (only sitting incumbents of each contested seat linked), NV requires linking candidates who hold a *different* office. Aaron Ford (current AG record) runs for Governor; Nicole Cannizzaro and Carrie Buck (current NV State Senator records from Phase 160) run for AG/House. Each requires a live query by name before the migration is written.

4. **Open-seat guard for AG and Treasurer.** Both races have `is_incumbent=false` for all candidates. This is different from the 1072 analog where every race had at least one `is_incumbent=true` row. The migration comment must explicitly note "OPEN SEAT" to prevent future confusion.

5. **No new politician INSERT block.** Unlike 1091/1110 (CA/TX House migrations), Phase 168 Plan 01 does NOT create politician records for challengers. Challenger records are created interactively by the `find-headshots` skill in Plan 02. The migration is race_candidates rows only (matching the simpler 1072 shape, not the 1091/1110 two-step shape).

6. **Split INSERT statements for statewide vs. US House.** The two sections each have their own `INSERT … SELECT … WHERE NOT EXISTS` block. This matches the separation of concern between STATE_EXEC and NATIONAL_LOWER races and makes idempotency clearer if one section needs to be re-run.

7. **Apostrophe escaping.** "Marty O'Donnell" contains a single quote — escape as `O''Donnell` in SQL string literals (PostgreSQL standard).

---

### `C:/EV-Accounts/backend/scripts/_apply-migration-1114.ts` (smoke harness, request-response)

**Primary analog:** `C:/EV-Accounts/backend/scripts/_apply-migration-1113.ts`
**Secondary analog (assertion style for race_candidates):** `C:/EV-Accounts/backend/scripts/_apply-migration-1112.ts`

---

**Boilerplate / file-read pattern** (`_apply-migration-1113.ts` lines 1–10):

```typescript
import 'dotenv/config';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import path from 'path';

const pool = new Pool({ connectionString: process.env['DATABASE_URL'], ssl: { rejectUnauthorized: false } });

const sql = readFileSync(path.join(process.cwd(), 'migrations', '1114_nv_2026_candidates.sql'), 'utf8');
```

---

**Migration apply + error handling pattern** (`_apply-migration-1113.ts` lines 11–59):

```typescript
try {
  await pool.query(sql);
  console.log('Migration 1114 applied successfully');

  // Smoke test 1: Total race_candidates for NV 2026 statewide + House races
  const rTotal = await pool.query(`
    SELECT COUNT(*) as cnt
    FROM essentials.race_candidates rc
    JOIN essentials.races r ON r.id = rc.race_id
    JOIN essentials.elections e ON e.id = r.election_id
    WHERE e.name = 'NV 2026 Statewide General'
  `);
  console.log('Total NV 2026 race_candidates:', rTotal.rows[0].cnt, '(expected 21)');
  // 21 = 6 statewide races × 2 candidates + 2 open-seat statewide × 2 + NV-01×2 + NV-02×3 + NV-03×2 + NV-04×2
  // Adjust expected count to match actual seeded rows once race field is finalized.

  // Smoke test 2: All 6 STATE_EXEC races have ≥ 2 candidates
  const rExec = await pool.query(`
    SELECT r.position_name, COUNT(rc.id) as cnt
    FROM essentials.races r
    JOIN essentials.elections e ON e.id = r.election_id
    JOIN essentials.offices o ON o.id = r.office_id
    JOIN essentials.districts d ON d.id = o.district_id
    LEFT JOIN essentials.race_candidates rc ON rc.race_id = r.id
    WHERE e.name = 'NV 2026 Statewide General' AND d.district_type = 'STATE_EXEC'
    GROUP BY r.position_name
    HAVING COUNT(rc.id) < 2
  `);
  console.log('STATE_EXEC races with < 2 candidates (should be 0):', rExec.rows.length, '(expected 0)');

  // Smoke test 3: All 4 NATIONAL_LOWER races have ≥ 2 candidates
  const rHouse = await pool.query(`
    SELECT r.position_name, COUNT(rc.id) as cnt
    FROM essentials.races r
    JOIN essentials.elections e ON e.id = r.election_id
    JOIN essentials.offices o ON o.id = r.office_id
    JOIN essentials.districts d ON d.id = o.district_id
    LEFT JOIN essentials.race_candidates rc ON rc.race_id = r.id
    WHERE e.name = 'NV 2026 Statewide General' AND d.district_type = 'NATIONAL_LOWER'
    GROUP BY r.position_name
    HAVING COUNT(rc.id) < 2
  `);
  console.log('NATIONAL_LOWER races with < 2 candidates (should be 0):', rHouse.rows.length, '(expected 0)');

  // Smoke test 4: is_incumbent=true count per race never > 1
  const rIncumbent = await pool.query(`
    SELECT r.position_name, COUNT(rc.id) as incumbents
    FROM essentials.races r
    JOIN essentials.elections e ON e.id = r.election_id
    JOIN essentials.offices o ON o.id = r.office_id
    JOIN essentials.districts d ON d.id = o.district_id
    JOIN essentials.race_candidates rc ON rc.race_id = r.id AND rc.is_incumbent = true
    WHERE e.name = 'NV 2026 Statewide General'
      AND d.district_type IN ('STATE_EXEC', 'NATIONAL_LOWER')
    GROUP BY r.position_name
    HAVING COUNT(rc.id) > 1
  `);
  console.log('Races with > 1 incumbent (should be 0):', rIncumbent.rows.length, '(expected 0)');

  // Smoke test 5: Open-seat guard — AG and Treasurer races have 0 is_incumbent=true rows
  const rOpenSeat = await pool.query(`
    SELECT r.position_name, COUNT(rc.id) as incumbents
    FROM essentials.races r
    JOIN essentials.elections e ON e.id = r.election_id
    JOIN essentials.race_candidates rc ON rc.race_id = r.id AND rc.is_incumbent = true
    WHERE e.name = 'NV 2026 Statewide General'
      AND r.position_name IN ('Nevada Attorney General', 'Nevada State Treasurer')
    GROUP BY r.position_name
  `);
  console.log('Open-seat races with is_incumbent=true (should be 0):', rOpenSeat.rows.length, '(expected 0)');

  // Smoke test 6: Idempotency — apply migration SQL a second time, then check no new rows were added
  const cntBefore = (await pool.query(`
    SELECT COUNT(*) as cnt FROM essentials.race_candidates rc
    JOIN essentials.races r ON r.id = rc.race_id
    JOIN essentials.elections e ON e.id = r.election_id
    WHERE e.name = 'NV 2026 Statewide General'
  `)).rows[0].cnt;
  await pool.query(sql);
  const cntAfter = (await pool.query(`
    SELECT COUNT(*) as cnt FROM essentials.race_candidates rc
    JOIN essentials.races r ON r.id = rc.race_id
    JOIN essentials.elections e ON e.id = r.election_id
    WHERE e.name = 'NV 2026 Statewide General'
  `)).rows[0].cnt;
  console.log('Idempotency (before vs after re-run):', cntBefore, 'vs', cntAfter, '(must be equal)');

  // Smoke test 7: candidate_status = 'active' for all NV 2026 race_candidates
  const rStatus = await pool.query(`
    SELECT COUNT(*) as cnt
    FROM essentials.race_candidates rc
    JOIN essentials.races r ON r.id = rc.race_id
    JOIN essentials.elections e ON e.id = r.election_id
    WHERE e.name = 'NV 2026 Statewide General'
      AND rc.candidate_status != 'active'
  `);
  console.log('NV 2026 race_candidates with non-active status (should be 0):', rStatus.rows[0].cnt, '(expected 0)');

  // Smoke test 8: Zach Conine NOT in race_candidates (term-limited Treasurer who ran for AG, lost)
  const rConine = await pool.query(`
    SELECT COUNT(*) as cnt
    FROM essentials.race_candidates rc
    JOIN essentials.races r ON r.id = rc.race_id
    JOIN essentials.elections e ON e.id = r.election_id
    WHERE e.name = 'NV 2026 Statewide General'
      AND rc.full_name ILIKE '%Conine%'
  `);
  console.log('Zach Conine in NV 2026 race_candidates (should be 0):', rConine.rows[0].cnt, '(expected 0)');

  // No schema_migrations smoke test — no ledger INSERT per D-06

} catch (e: any) {
  console.error('Error applying migration 1114:', e.message);
  process.exit(1);
} finally {
  await pool.end();
}
```

---

**Run command** (from `C:/EV-Accounts/backend`):
```
node node_modules/tsx/dist/cli.mjs backend/scripts/_apply-migration-1114.ts
```

---

**Critical adaptations for NV smoke harness (vs. 1113 analog):**

1. **race_candidates join pattern.** The 1112 analog asserts on `essentials.races`; the 1113 analog asserts on `essentials.discovery_jurisdictions`. The 1114 harness must join `race_candidates → races → elections WHERE e.name = 'NV 2026 Statewide General'` — the pattern from 1112 Smoke test 1 is the correct join chain to adapt.

2. **Idempotency test.** Run the SQL a second time within the same harness execution (count before, apply, count after — must be equal). This pattern is not in 1112/1113 but is listed in RESEARCH.md as required assertion 5. The `NOT EXISTS` guard in the migration ensures this holds.

3. **Conine-not-present guard.** This is a NV-specific business-logic assertion with no analog in prior harnesses — add it as Smoke test 8.

4. **Open-seat guard.** The AG and Treasurer races must have zero `is_incumbent=true` rows — NV-specific, no prior analog.

---

## Shared Patterns

### Antipartisan NULL party
**Source:** `1072_seed_2026_statewide_general_candidates.sql` (header comment) + `1091_seed_ca_2026_house_candidates.sql` (header comment line 17)
**Apply to:** `1114_nv_2026_candidates.sql` header comment and VALUES rows
```sql
-- Party is intentionally NOT stored (antipartisan design).
-- The candidate field (R/D/IAP) is used only to determine the ballot field during research;
-- it is never written to any column. race_candidates has no party column.
```

### Idempotent NOT EXISTS guard
**Source:** `1072_seed_2026_statewide_general_candidates.sql` lines 49–52
**Apply to:** Both INSERT blocks in `1114_nv_2026_candidates.sql`
```sql
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.race_candidates rc
  WHERE rc.race_id = v.race_id::uuid AND rc.full_name = v.full_name
);
```
Note: 1091 uses `rc.race_id = v.race_id` (no cast, because race_id is already typed `::uuid` in the VALUES). 1072 casts in the WHERE clause. Either works; use the 1072 cast-in-WHERE style for 1114 to match the simpler (no politician INSERT) migration shape.

### candidate_status = 'active'
**Source:** `1072_seed_2026_statewide_general_candidates.sql` line 24
**Apply to:** All race_candidates INSERT blocks in `1114_nv_2026_candidates.sql`
```sql
-- Always use literal 'active' — never a variable, never NULL.
'active'  -- in the SELECT clause as the candidate_status column value
```

### No schema_migrations ledger row
**Source:** `1072_seed_2026_statewide_general_candidates.sql` (absence of INSERT INTO schema_migrations)
**Apply to:** `1114_nv_2026_candidates.sql` footer
```sql
COMMIT;
-- NO INSERT INTO schema_migrations — on-disk counter is authoritative (D-06).
```

### Pool + dotenv boilerplate
**Source:** `_apply-migration-1113.ts` lines 1–6
**Apply to:** `_apply-migration-1114.ts` header (copy verbatim, change only the migration filename on line 8)
```typescript
import 'dotenv/config';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import path from 'path';

const pool = new Pool({ connectionString: process.env['DATABASE_URL'], ssl: { rejectUnauthorized: false } });
```

### Error handling + pool.end()
**Source:** `_apply-migration-1113.ts` lines 54–59
**Apply to:** `_apply-migration-1114.ts` (copy verbatim, change migration number in error message)
```typescript
} catch (e: any) {
  console.error('Error applying migration 1114:', e.message);
  process.exit(1);
} finally {
  await pool.end();
}
```

---

## Wave 0 Pre-Check Queries (required before writing migration VALUES)

These queries must be run against the live DB before authoring the migration. They are not patterns to copy but mandatory data-gathering steps the planner must schedule as Wave 0 tasks.

### race_id resolution (10 UUIDs)
```sql
SELECT r.id AS race_id, r.position_name, d.district_type, d.geo_id
FROM essentials.races r
JOIN essentials.elections e ON e.id = r.election_id
JOIN essentials.offices o ON o.id = r.office_id
JOIN essentials.districts d ON d.id = o.district_id
WHERE e.name = 'NV 2026 Statewide General'
  AND d.district_type IN ('STATE_EXEC', 'NATIONAL_LOWER')
  AND d.state ILIKE 'nv'
ORDER BY d.district_type, d.geo_id;
-- Expected: 6 STATE_EXEC rows + 4 NATIONAL_LOWER rows = 10 total
```

### Incumbent politician_id resolution (statewide execs + House incumbents)
```sql
SELECT p.id, p.external_id, p.full_name, o.title, d.district_type
FROM essentials.politicians p
JOIN essentials.offices o ON o.id = p.office_id
JOIN essentials.districts d ON d.id = o.district_id
WHERE d.state ILIKE 'nv' AND p.is_active = true
  AND d.district_type IN ('STATE_EXEC', 'NATIONAL_LOWER')
ORDER BY d.district_type, p.full_name;
-- Expect: Lombardo, Anthony, Ford (AG), Aguilar, Titus, Lee, Horsford, Matthews
-- Andy Matthews already confirmed: external_id = -3200006
```

### Cross-office / legislator link checks (D-02)
```sql
-- Aaron Ford (current AG, running for Governor)
SELECT id, full_name, is_active FROM essentials.politicians WHERE full_name ILIKE '%Aaron Ford%';

-- Nicole Cannizzaro (NV State Senator, running for AG)
SELECT id, full_name, is_active FROM essentials.politicians WHERE full_name ILIKE '%Cannizzaro%';

-- Carrie Buck (NV State Senator, running for NV-01)
SELECT id, full_name, is_active FROM essentials.politicians WHERE full_name ILIKE '%Carrie Buck%';

-- Teresa Benitez-Thompson (former Assembly member, running for NV-02)
SELECT id, full_name, is_active FROM essentials.politicians WHERE full_name ILIKE '%Benitez%';
```

---

## No Analog Found

None — both files have strong analogs.

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/` + `C:/EV-Accounts/backend/scripts/`
**Files scanned:** 4 migration files (1072, 1091, 1110, 1112 referenced; 1072 + 1091 read in full) + 3 harness files (1111, 1112, 1113 read in full)
**Pattern extraction date:** 2026-06-30
