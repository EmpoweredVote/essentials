# Phase 185: WashCo 2026 Elections & Discovery - Pattern Map

**Mapped:** 2026-07-04
**Files analyzed:** 3 SQL migrations + 3 paired smoke-test scripts (planner may split races/candidates/discovery into more files — see CONTEXT Claude's Discretion; patterns below apply regardless of split)
**Analogs found:** 6 / 6 (all files have a strong, directly-verified analog on disk)

**Repo note:** All migration + smoke-test files for this phase live in `C:/EV-Accounts/backend/` (NOT the `essentials` repo). Live-reverified this session:
- On-disk migration max = **1211** → **next migration number = 1212** (RESEARCH.md's 1212 estimate CONFIRMED live 2026-07-04; re-verify again immediately before writing the first file — `ls C:/EV-Accounts/backend/migrations | grep -E '^[0-9]+_' | sed -E 's/^([0-9]+)_.*/\1/' | sort -n | tail`).
- No `_apply-migration-1109.ts` / `-1110.ts` exist on disk (those two migrations were applied via a different harness) — use the `_apply-migration-1111/1112/1113.ts` shape shown below as the template instead; it is the most recent and complete smoke-test pattern.

---

## File Classification

| New/Modified File (illustrative names — planner assigns final numbers) | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `migrations/1212_seed_washco_2026_local_races.sql` | migration (data-seed) | CRUD (bulk INSERT + idempotency guard) | `migrations/1112_nv_2026_races.sql` | exact (title + district-type join, multi-office-type in one file) |
| `migrations/1213_seed_washco_2026_race_candidates.sql` | migration (data-seed) | CRUD (bulk INSERT, cross-table wiring) | `migrations/1110_seed_tx_2026_house_candidates.sql` | exact (politicians-then-race_candidates insert order, reuse-vs-new resolution) |
| `migrations/1214_washco_2026_discovery.sql` | migration (data-seed) | CRUD (bulk INSERT, `ON CONFLICT`) | `migrations/1113_nv_2026_discovery.sql` | exact (no-ledger, date-based eligibility, single-state-cluster shape) — prefer over `325_va_2026_discovery.sql`/`281_md_2026_discovery.sql` for the ledger decision (see Shared Patterns) |
| `scripts/_apply-migration-1212.ts` | test (smoke-test harness) | request-response (DB query/assert) | `scripts/_apply-migration-1112.ts` | exact |
| `scripts/_apply-migration-1213.ts` | test (smoke-test harness) | request-response (DB query/assert) | `scripts/_apply-migration-1111.ts` (simple single-purpose harness shape; also see 1112 for multi-assertion style) | role-match |
| `scripts/_apply-migration-1214.ts` | test (smoke-test harness) | request-response (DB query/assert) | `scripts/_apply-migration-1113.ts` | exact |
| Discovery test-run trigger (no new file — a `curl`/script invocation, not a committed source file) | N/A (operational step, D-07) | event-driven (POST → async run → poll) | `essentialsDiscovery.ts` route (read-only reference; source already exists, not modified) | n/a — confirm invocation only |

---

## Pattern Assignments

### `migrations/1212_seed_washco_2026_local_races.sql` (migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1112_nv_2026_races.sql` (title/district-type join pattern — closer match than 1109 because it resolves multiple office/district types by `o.title` within one election, exactly like WashCo's mixed LOCAL_EXEC/LOCAL/COUNTY offices). Cross-reference `1109_seed_tx_ny_2026_house_elections_races.sql` for the overall file-header/comment convention.

**Header/comment convention** (1112, lines 1–29):
```sql
-- Migration 1112: Seed 63 NV 2026 race rows for the NV 2026 Statewide General election
--
-- Phase 167-02 (v18.0 NV 2026 Elections & Discovery, Plan 02).
-- Prerequisite: migration 1111 must already have inserted the 'NV 2026 Statewide General'
-- election row (Plan 01). All race INSERTs resolve election_id via a JOIN on that name literal.
--
-- ...
-- ILIKE 'nv' guard is MANDATORY on every districts JOIN (mixed-casing: both 'nv' and 'NV'
-- exist in production — D-09 verified live).
--
-- Idempotent: NOT EXISTS guards on (election_id, office_id) for each race.
-- NEVER use ON CONFLICT on essentials.races — no unique constraint exists (D-07).
-- No schema_migrations ledger INSERT — on-disk counter is authoritative (D-08, matches 1109).

BEGIN;
```
For Phase 185: replace the `ILIKE 'nv'` note with the OR casing trap — `districts.state` is **lowercase** `'or'` (per RESEARCH.md's confirmed convention; use `d.state = 'or'` exactly, matching migrations 1120/1178/1187/1196 — do not use `ILIKE` defensively here since the lowercase convention for OR local districts is already established, unlike NV's live mixed-casing bug).

**Title-based office resolution (the core pattern to copy)** (1112, lines 33–52):
```sql
INSERT INTO essentials.races (id, election_id, office_id, position_name, primary_party, seats)
SELECT gen_random_uuid(), el.id, o.id, v.pos, NULL, 1
FROM (VALUES
  ('Governor',            'Governor of Nevada'),
  ('Lieutenant Governor', 'Lieutenant Governor of Nevada'),
  ...
) v(title, pos)
JOIN essentials.elections el ON el.name = 'NV 2026 Statewide General'
JOIN essentials.districts d  ON d.geo_id = '32' AND d.district_type = 'STATE_EXEC' AND d.state ILIKE 'nv'
JOIN essentials.offices o    ON o.district_id = d.id AND o.title = v.title
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.races r WHERE r.election_id = el.id AND r.office_id = o.id
);
```
For Phase 185, adapt the district join per the confirmed office-resolution shape in RESEARCH.md (lines 315–334):
```sql
-- City seat (e.g. Tualatin Position 5 — office resolved by o.title on the LOCAL district):
JOIN essentials.elections el ON el.name = 'OR 2026 General' AND el.state ILIKE 'or'
JOIN essentials.districts d  ON d.geo_id = '4174950' AND d.district_type = 'LOCAL' AND d.state = 'or'
JOIN essentials.offices o    ON o.district_id = d.id AND o.title = 'Council Member (Position 5)'  -- verbatim title per Phase 179 seed

-- Washington County Chair (COUNTY district) / Commissioner D4 (custom LOCAL X0018 district):
JOIN essentials.districts d ON d.state = 'or' AND (
  (d.district_type = 'COUNTY' AND d.geo_id = '41067')
  OR (d.district_type = 'LOCAL' AND d.geo_id = 'washco-or-commissioner-district-4')
)
```
**Election FK subquery** — use the exact confirmed shape (D-08/CONTEXT), but Wave-0 gap flagged in RESEARCH.md line 414 requires a live re-check of stored `name`/`state` casing before trusting this literally:
```sql
JOIN essentials.elections el ON el.name = 'OR 2026 General' AND el.state ILIKE 'or'
```

**Post-write assertion block (copy this shape exactly)** (1112, lines 116–186):
```sql
DO $$
DECLARE
  n_exec int; n_upper int; ... n_nulloff int; n_party int;
BEGIN
  SELECT count(*) INTO n_exec ... WHERE el.name = 'NV 2026 Statewide General' AND d.district_type = 'STATE_EXEC';
  IF n_exec <> 6 THEN RAISE EXCEPTION 'Expected 6 NV STATE_EXEC races, found %', n_exec; END IF;
  ...
  SELECT count(*) INTO n_nulloff FROM essentials.races r JOIN essentials.elections el ON el.id = r.election_id
   WHERE el.name = 'NV 2026 Statewide General' AND r.office_id IS NULL;
  IF n_nulloff <> 0 THEN RAISE EXCEPTION 'Found % NV 2026 races with NULL office_id', n_nulloff; END IF;

  SELECT count(*) INTO n_party FROM essentials.races r JOIN essentials.elections el ON el.id = r.election_id
   WHERE el.name = 'NV 2026 Statewide General' AND r.primary_party IS NOT NULL;
  IF n_party <> 0 THEN RAISE EXCEPTION 'Found % NV 2026 races with non-NULL primary_party (antipartisan violation)', n_party; END IF;

  RAISE NOTICE 'OK: NV 2026 races 6+11+42+4=63, 0 NULL office_id, 0 non-NULL primary_party';
END $$;

COMMIT;
```
For Phase 185, add a **negative** assertion required by the phase requirements table (RESEARCH.md line 404): `0 school-board race rows exist for any west-metro G5420 district`:
```sql
SELECT count(*) INTO n_schoolboard
  FROM essentials.races r
  JOIN essentials.elections el ON el.id = r.election_id
  JOIN essentials.offices o ON o.id = r.office_id
  JOIN essentials.districts d ON d.id = o.district_id
 WHERE el.name = 'OR 2026 General' AND d.district_type = 'G5420'
   AND d.geo_id IN (/* the 5 west-metro school-board geo_ids */);
IF n_schoolboard <> 0 THEN RAISE EXCEPTION 'Found % unexpected school-board 2026 races', n_schoolboard; END IF;
```
Expected total race count per RESEARCH.md's seats-up table: **25** (or fewer if the planner excludes the 3 already-decided-in-May seats per Open Question 1 — confirm the final number before writing the assertion literal).

**Idempotency guard (never `ON CONFLICT` here)** — `essentials.races` has NO unique constraint; always `NOT EXISTS (SELECT 1 FROM essentials.races r WHERE r.election_id = el.id AND r.office_id = o.id)`.

---

### `migrations/1213_seed_washco_2026_race_candidates.sql` (migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1110_seed_tx_2026_house_candidates.sql`

**Insert order (politicians BEFORE race_candidates)** — copy this two-step shape (1110, lines 39–92 then 94–178):
```sql
BEGIN;

-- 1. Insert genuinely-new candidates as politicians rows (external_id = negative sentinel band).
INSERT INTO essentials.politicians (id, external_id, full_name, first_name, last_name, is_active)
SELECT gen_random_uuid(), v.ext, v.full_name, v.first_name, v.last_name, true
FROM (VALUES
  (-4810101, 'Yolanda Prince', 'Yolanda', 'Prince'),
  ...
) v(ext, full_name, first_name, last_name)
WHERE NOT EXISTS (SELECT 1 FROM essentials.politicians p WHERE p.external_id = v.ext);

-- 2. Insert race_candidates rows — mix of NEW (politician_id via external_id lookup)
--    and REUSE (politician_id via existing UUID literal or existing external_id lookup).
INSERT INTO essentials.race_candidates (id, race_id, politician_id, full_name, first_name, last_name, is_incumbent, candidate_status, source)
SELECT gen_random_uuid(), v.race_id, v.politician_id, v.full_name, v.first_name, v.last_name, v.is_incumbent, 'active', v.source
FROM (VALUES
  ('a282204e-...'::uuid, (SELECT id FROM essentials.politicians WHERE external_id=-100301), 'Nathaniel Moran', 'Nathaniel', 'Moran', true, 'https://en.wikipedia.org/...'),
  ('a282204e-...'::uuid, (SELECT id FROM essentials.politicians WHERE external_id=-4810101), 'Yolanda Prince', 'Yolanda', 'Prince', false, 'https://en.wikipedia.org/...')
) v(race_id, politician_id, full_name, first_name, last_name, is_incumbent, source)
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.race_candidates rc
  WHERE rc.race_id = v.race_id AND rc.full_name = v.full_name
);
```
**Applied to Phase 185's REUSE cases** (per RESEARCH.md's Candidate Slate Table, e.g. reuse Nafisa Fai/Pam Treece from Phase 175, Kipperlyn Sinclair from Phase 177, Octavio Gonzalez/Valerie Pratt from Phase 179, Dalin/Baker/López from Phase 182): resolve `politician_id` via a `SELECT id FROM essentials.politicians WHERE full_name = '...'` (or their existing external_id if known) rather than fabricating a new politicians row — this is the same "REUSE, not a new dup" discipline documented in 1110's header comments (lines 16–25).

**Citation discipline (mandatory per Pitfall 3 / Security Domain)** — every `race_candidates.source` value must be a real URL from RESEARCH.md's Candidate Slate Table (opb.org, hillsboronewstimes.com, city's own elections page, ballotpedia.org, etc.). Never fabricate a name for the 16 not-yet-confirmed races (RESEARCH.md Open Question 3) — ship those race rows with 0 `race_candidates` and let discovery fill them.

**Post-write assertion block** (1110, lines 180–223) — copy the shape: total-race-count check, `politician_id IS NULL` guard on active rows (only allowed if using `photo_url`-only challenger rows — confirm schema nullable rule at plan time), duplicate-full_name-within-race guard, and named-candidate spot-checks:
```sql
DO $$
DECLARE v_races int; v_nullpid int; v_dup int; v_active int; ...
BEGIN
  SELECT count(DISTINCT r.id), count(*) FILTER (WHERE rc.candidate_status='active' AND rc.politician_id IS NULL), count(*) FILTER (WHERE rc.candidate_status='active')
    INTO v_races, v_nullpid, v_active
  FROM essentials.races r ... LEFT JOIN essentials.race_candidates rc ON rc.race_id=r.id
  WHERE ...;
  IF v_nullpid<>0 THEN RAISE EXCEPTION 'FAIL: % active rows with NULL politician_id', v_nullpid; END IF;

  SELECT count(*) INTO v_dup FROM (
    SELECT lower(rc.full_name) FROM essentials.race_candidates rc JOIN essentials.races r ON r.id=rc.race_id
    WHERE ... GROUP BY lower(rc.full_name) HAVING count(*)>1) q;
  IF v_dup<>0 THEN RAISE EXCEPTION 'FAIL: % duplicate full_name', v_dup; END IF;
END $$;

COMMIT;
```
**Idempotency guard:** `race_candidates` has no unique constraint → `NOT EXISTS` on `(race_id, full_name)`. `politicians.external_id` DOES have a unique index → `ON CONFLICT (external_id) DO NOTHING` is correct there ONLY (Pitfall 4).

**Headshots (D-02):** not part of this SQL file's row shape directly — `politician_images`/`press_use` rows follow the existing per-city headshot-pipeline convention (Phases 176–182); no new analog needed beyond what's already documented in project memory `project_headshot_skill`.

---

### `migrations/1214_washco_2026_discovery.sql` (migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1113_nv_2026_discovery.sql` (preferred — matches this phase's no-ledger convention) — cross-check against `325_va_2026_discovery.sql` / `281_md_2026_discovery.sql` for the column set only, NOT the ledger-writing tail (see Shared Patterns warning below).

**Full column set + row shape** (1113, lines 29–35):
```sql
INSERT INTO essentials.discovery_jurisdictions
  (jurisdiction_geoid, jurisdiction_name, state, election_date, source_url, allowed_domains)
VALUES
  ('32', 'State of Nevada', 'NV', '2026-11-03',
   'https://ballotpedia.org/Nevada_elections,_2026',
   ARRAY['ballotpedia.org', 'nvsos.gov', 'nevada.gov', 'leg.state.nv.us'])
ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING;
```
For Phase 185, insert **8 rows** (one VALUES tuple per jurisdiction) using the exact geo_id/name/source_url/allowed_domains from RESEARCH.md's Discovery Config table (lines 220–229), e.g.:
```sql
INSERT INTO essentials.discovery_jurisdictions
  (jurisdiction_geoid, jurisdiction_name, state, election_date, source_url, allowed_domains)
VALUES
  ('41067', 'Washington County, Oregon', 'OR', '2026-11-03',
   'https://sos.oregon.gov/elections/Pages/Candidate-Filings-Local-Measures.aspx',
   ARRAY['sos.oregon.gov','washingtoncountyor.gov','ballotpedia.org']),
  ('4105350', 'Beaverton, Oregon', 'OR', '2026-11-03',
   'https://beavertonoregon.gov/944/Elections',
   ARRAY['beavertonoregon.gov','washingtoncountyor.gov','sos.oregon.gov','ballotpedia.org'])
  -- ... 6 more rows (Hillsboro, Tigard, Tualatin, Forest Grove, Sherwood, Cornelius)
ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING;
```
**Casing reminder (Pitfall 5):** `discovery_jurisdictions.state = 'OR'` — UPPERCASE, unlike `districts.state = 'or'`. Do not conflate the two tables' casing conventions.

**Post-write assertion** (1113, lines 41–52):
```sql
DO $$
DECLARE v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count FROM essentials.discovery_jurisdictions WHERE state = 'OR' AND jurisdiction_geoid IN ('41067','4105350','4134100','4173650','4174950','4126200','4167100','4115550');
  IF v_count <> 8 THEN RAISE EXCEPTION 'Expected 8 WashCo discovery_jurisdictions rows, found %', v_count; END IF;
  RAISE NOTICE 'OK: 8 WashCo discovery_jurisdictions rows present';
END $$;
```
**No `schema_migrations` ledger INSERT** — follow 1113's tail comment exactly: `-- NO schema_migrations ledger INSERT (D-08: matches 1109 pattern)`. Do NOT copy 325/281's `SECTION 3` ledger-writing block (those are from an OLDER convention before the pure-data-seed vs. structural-migration reconciliation was settled — see Shared Patterns).

---

### Smoke-test scripts: `_apply-migration-1212/1213/1214.ts` (test, request-response)

**Analog:** `C:/EV-Accounts/backend/scripts/_apply-migration-1112.ts` (races — multi-assertion) and `_apply-migration-1113.ts` (discovery — single-assertion), both invoked identically.

**Full harness shape (copy verbatim, only the SQL filename/assertions change):**
```typescript
import 'dotenv/config';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import path from 'path';

const pool = new Pool({ connectionString: process.env['DATABASE_URL'], ssl: { rejectUnauthorized: false } });

const sql = readFileSync(path.join(process.cwd(), 'migrations', '1112_nv_2026_races.sql'), 'utf8');

try {
  await pool.query(sql);
  console.log('Migration 1112 applied successfully');

  const rTotal = await pool.query(`
    SELECT COUNT(*) as cnt FROM essentials.races r
    JOIN essentials.elections e ON e.id = r.election_id
    WHERE e.name = 'NV 2026 Statewide General'
  `);
  console.log('Total NV 2026 races:', rTotal.rows[0].cnt, '(expected 63)');

  // ... one console.log block per assertion, mirroring the migration's own DO $$ checks
} catch (e: any) {
  console.error('Error applying migration 1112:', e.message);
  process.exit(1);
} finally {
  await pool.end();
}
```
**Invocation (tsx, confirmed live):**
```
cd C:/EV-Accounts/backend
node node_modules/tsx/dist/cli.mjs scripts/_apply-migration-1212.ts
```
**Idempotency re-run check:** run each script TWICE — the second run must report the same counts (0 new rows inserted) because every INSERT is guarded by `NOT EXISTS` (races/race_candidates) or `ON CONFLICT ... DO NOTHING` (discovery_jurisdictions only).

---

### Discovery test-run trigger (D-07 — operational, no new source file)

**Confirmed invocation shape** (source-verified in RESEARCH.md, not re-verified again here since it requires no code changes):
```
POST https://accounts-api.empowered.vote/api/admin/discover/jurisdiction/:id
Header: X-Admin-Token: $ADMIN_INGEST_TOKEN   (read from C:/EV-Accounts/backend/.env — never log/echo/commit)
```
- `:id` = a `discovery_jurisdictions.id` UUID (returned by the `RETURNING id` clause on the INSERT, or a follow-up `SELECT id FROM essentials.discovery_jurisdictions WHERE jurisdiction_geoid='...'`).
- Response: `202 {status:'accepted', jurisdictionId}` immediately; poll `essentials.discovery_runs` for `status='completed'` and `error_message IS NULL`.
- **Host trap (carried from Phase 167):** use `accounts-api.empowered.vote` — `accounts-api.onrender.com` 404s.

---

## Shared Patterns

### Idempotency discipline (per-table rule — do not mix up)
**Source:** RESEARCH.md Pitfall 4, confirmed against live schema reads of `042_election_schema.sql`/`070_discovery_tables.sql`.
**Apply to:** all 3 migration files.
```
essentials.races            -> NOT EXISTS on (election_id, office_id)   -- NEVER ON CONFLICT
essentials.race_candidates  -> NOT EXISTS on (race_id, full_name)       -- NEVER ON CONFLICT
essentials.politicians      -> ON CONFLICT (external_id) DO NOTHING    -- has real unique index
essentials.discovery_jurisdictions -> ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING  -- has real unique index
```

### Antipartisan invariant
**Source:** every races/race_candidates analog (1109, 1110, 1112, 1113).
**Apply to:** races + race_candidates migrations.
`races.primary_party` always `NULL`; `race_candidates` table has **no party column at all** (schema-enforced, not just convention) — never attempt to write a party value anywhere in this phase.

### No-ledger vs. ledger-write reconciliation — DO NOT use 325/281's tail block
**Source:** RESEARCH.md "Ledger behavior" section (lines 280–284), confirmed against direct reads of 1113 (no ledger) vs. 325/281 (ledger, older convention) vs. 1120 (ledger, but it's a *structural* migration, not a data-seed).
**Apply to:** all 3 Phase 185 migrations — none should write `INSERT INTO supabase_migrations.schema_migrations`. This phase is entirely data-seed (all office_ids pre-exist from Phases 175–184), matching the 1109/1110/1112/1113 family, NOT the 325/281/1120 family. If a planner copy-pastes 325 or 281 wholesale, they MUST delete that migration's final `SECTION 3` block.

### `BEGIN;`/`COMMIT;` wrapping + post-write `DO $$ ... RAISE EXCEPTION` gate
**Source:** 1109, 1110, 1112 (races/candidates migrations wrap in `BEGIN;`/`COMMIT;` with an embedded assertion block that aborts the whole transaction on failure — a genuine safety net, not just cosmetic).
**Apply to:** races + race_candidates migrations. **Note:** the discovery migrations (1113/325/281) do NOT use explicit `BEGIN;`/`COMMIT;` wrapping (each statement is auto-committed; the `DO $$` block there is advisory/logging only, not an abort-gate, since a `RAISE EXCEPTION` inside a `DO $$` block outside an explicit transaction still rolls back only its own implicit statement). Match this file-by-file distinction rather than uniformly wrapping everything.

### OR casing trap — two DIFFERENT rules in two DIFFERENT tables
**Source:** RESEARCH.md Pitfall 5 + Schema Column Confirmation section.
**Apply to:** all 3 migrations.
```
essentials.districts.state              -> lowercase  'or'   (e.g. WHERE d.state = 'or')
essentials.elections.state / discovery_jurisdictions.state -> UPPERCASE 'OR'  (2-char, matches NV/VA/MD convention)
```

### Office resolution join (D-11, confirmed + corrected)
**Source:** RESEARCH.md lines 311–338, verified against migrations 1120/1178/1187/1196.
**Apply to:** the races migration.
```sql
-- Primary mechanism (works uniformly for city + county):
SELECT o.id, o.title
FROM essentials.districts d
JOIN essentials.offices o ON o.district_id = d.id
WHERE d.geo_id = '<city geo_id>'
  AND d.state = 'or'
  AND d.district_type IN ('LOCAL_EXEC','LOCAL')
  -- discriminate by o.title, e.g. 'Mayor', 'Council Member (Position 5)'
```
`representing_city` IS populated for the 7 cities (D-11's original "NULL" premise was stale per this research's own correction) and may be used as a secondary sanity-check assertion, e.g. `AND o.representing_city = 'Forest Grove'` — but do not rely on it as the PRIMARY join key since WashCo Commission (a county) has no `representing_city` at all.

---

## No Analog Found

None. All 3 migration files and all 3 smoke-test scripts have a directly-verified, structurally-identical analog on disk (1112/1110/1113 for the SQL; 1112/1111/1113 for the harness). The one non-file operational step (D-07's live discovery-run trigger) is fully specified by source-code reads already captured in RESEARCH.md and summarized above — no additional pattern search needed.

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/` (filtered to 1100s-range election/races/candidates/discovery migrations + 1120/1178/1187/1196 for office-join verification), `C:/EV-Accounts/backend/scripts/` (`_apply-migration-*.ts`).
**Files scanned:** 1109, 1110, 1111 (nv_2026_general_election), 1112, 1113, 1120, 1178, 1196 (grep only), 325, 281; smoke scripts 1111, 1112, 1113.
**Pattern extraction date:** 2026-07-04
