# Phase 110: MA 2026 Elections + Discovery — Pattern Map

**Mapped:** 2026-06-11
**Files analyzed:** 5 (2 SQL migrations + 2 apply scripts + 1 JSX edit)
**Analogs found:** 5 / 5

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `migrations/357_ma_2026_statewide_races.sql` | migration | CRUD (UPDATE + INSERT) | `migrations/279_md_2026_statewide_races.sql` | exact |
| `migrations/358_ma_2026_legislative_races.sql` | migration | CRUD (CTE-JOIN INSERT) | `migrations/280_md_2026_legislative_races.sql` | role-match (MA uses CTE-JOIN; MD used per-DO-$$ blocks — pattern is **different**, see notes) |
| `scripts/_apply-migration-357.ts` | apply script | request-response | `scripts/_apply-migration-324.ts` | exact |
| `scripts/_apply-migration-358.ts` | apply script | request-response | `scripts/_apply-migration-280.ts` | exact |
| `src/pages/Landing.jsx` (edit) | component | request-response (static config) | `src/pages/Landing.jsx` lines 14–26 | exact (self-analog) |

---

## Pattern Assignments

### `migrations/357_ma_2026_statewide_races.sql` (migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/279_md_2026_statewide_races.sql`
**Secondary analog:** `C:/EV-Accounts/backend/migrations/324_va_2026_races.sql`

**Critical difference from analog:** Migration 357 must also UPDATE 2 existing NULL-office_id rows before inserting new rows. The MD and VA analogs are pure INSERT. The UPDATE block comes first.

**UPDATE pattern — no analog exists; use raw SQL (lines do not apply from analog):**
```sql
-- Step 1: Fix NULL office_id on 2 existing US Senate Massachusetts race rows
UPDATE essentials.races
SET office_id = '215e8e94-ab07-4ca8-b7a1-ccf7aec0c4f4'
WHERE position_name = 'U.S. Senate Massachusetts'
  AND election_id IN (
    SELECT id FROM essentials.elections WHERE state = 'MA' AND name LIKE '2026 Massachusetts%'
  )
  AND office_id IS NULL;
```

**Core WITH-CTE INSERT pattern** (from `279_md_2026_statewide_races.sql` lines 24–43, adapted for MA):
```sql
WITH gen_elec AS (
  SELECT id FROM essentials.elections WHERE name = '2026 Massachusetts General Election' AND state = 'MA'
)
INSERT INTO essentials.races (election_id, office_id, position_name, primary_party, seats)
SELECT gen_elec.id, t.office_id_val::uuid, t.position_name_val, NULL, 1
FROM gen_elec, (VALUES
  ('21f9e818-904d-4a19-879b-438f447bcd68', 'Governor of Massachusetts'),
  ('2a3279e2-3d67-408a-971c-294ef602c293', 'U.S. House MA-01'),
  ('372f56fe-4f30-4526-80f2-1a66c5fe870b', 'U.S. House MA-02'),
  ('badb581b-e37f-4359-9735-e779ff2a7c71', 'U.S. House MA-03'),
  ('0b7dc3a6-310c-4c18-92bb-2e25230701e6', 'U.S. House MA-04'),
  ('5c4f577c-f8af-4d12-ba30-24129ff5d099', 'U.S. House MA-06'),
  ('293d949e-69cf-45a0-85fa-9ae72aabef13', 'U.S. House MA-08'),
  ('7f423afd-6a6b-4741-8eeb-cff9577b006f', 'U.S. House MA-09')
) AS t(office_id_val, position_name_val)
ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING;
```

**race_candidates INSERT pattern** (from `110-RESEARCH.md` Pattern 5):
```sql
INSERT INTO essentials.race_candidates (race_id, politician_id, is_incumbent, is_official_candidate)
SELECT r.id, '7cf1080e-6e7e-4f5b-be00-6fb170896a7c', true, true
FROM essentials.races r
JOIN essentials.elections e ON r.election_id = e.id
WHERE e.state = 'MA' AND r.position_name = 'Governor of Massachusetts'
  AND e.name = '2026 Massachusetts General Election'
ON CONFLICT DO NOTHING;
```
**NOTE:** Verify race_candidates column names before writing (`SELECT column_name FROM information_schema.columns WHERE table_schema='essentials' AND table_name='race_candidates'`).

**Ledger + Post-verify pattern** (from `324_va_2026_races.sql` lines 44–68):
```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('357')
ON CONFLICT (version) DO NOTHING;

DO $$
DECLARE v_null_count INT; v_fed_count INT;
BEGIN
  SELECT COUNT(*) INTO v_null_count FROM essentials.races r
  JOIN essentials.elections e ON r.election_id = e.id
  WHERE e.state='MA' AND e.name='2026 Massachusetts General Election' AND r.office_id IS NULL;
  IF v_null_count > 0 THEN RAISE EXCEPTION 'MA general races still have NULL office_id: %', v_null_count; END IF;

  SELECT COUNT(*) INTO v_fed_count FROM essentials.races r
  JOIN essentials.elections e ON r.election_id = e.id
  WHERE e.state='MA' AND e.name='2026 Massachusetts General Election'
    AND r.position_name IN (
      'Governor of Massachusetts','U.S. Senate Massachusetts',
      'U.S. House MA-01','U.S. House MA-02','U.S. House MA-03','U.S. House MA-04',
      'U.S. House MA-05','U.S. House MA-06','U.S. House MA-07','U.S. House MA-08','U.S. House MA-09'
    );
  IF v_fed_count <> 11 THEN RAISE EXCEPTION 'Expected 11 MA statewide/federal general races, found %', v_fed_count; END IF;
END $$;
```

---

### `migrations/358_ma_2026_legislative_races.sql` (migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/280_md_2026_legislative_races.sql`

**CRITICAL DIFFERENCE FROM MD ANALOG:** MD used 118 separate `DO $$ ... END $$` blocks (one per district), because MD districts have numeric geo_ids and hardcoded position names. MA has named districts (e.g., "Senator, Berkshire-Hampden-Franklin-Hampshire District") so position names cannot be hardcoded at authoring time. The RESEARCH.md Pattern 4 recommends a **single-SQL CTE-JOIN INSERT** instead. Do NOT copy the per-DO-$$ pattern from migration 280.

**Core CTE-JOIN INSERT pattern** (from `110-RESEARCH.md` Pattern 4 — no direct codebase analog for the pure-SQL approach, but the chamber JOIN structure mirrors the per-block subquery in migration 280 lines 21–27):

Per-block subquery from `280_md_2026_legislative_races.sql` lines 21–27 (the sub-pattern to generalize):
```sql
(SELECT o.id FROM essentials.offices o
 JOIN essentials.districts d ON d.id = o.district_id
 JOIN essentials.chambers ch ON ch.id = o.chamber_id
 WHERE d.geo_id = '24001' AND d.district_type = 'STATE_UPPER' AND d.state = 'md'
   AND ch.name = 'Maryland Senate' LIMIT 1)
```

**MA adaptation — single-statement CTE-JOIN (recommended approach):**
```sql
WITH gen_elec AS (
  SELECT id FROM essentials.elections WHERE name='2026 Massachusetts General Election' AND state='MA'
), leg_offices AS (
  SELECT o.id AS office_id, d.district_type,
    CASE WHEN d.district_type='STATE_UPPER'
         THEN 'MA State Senate ' || regexp_replace(o.title, '^Senator, ', '')
         ELSE 'MA House ' || regexp_replace(o.title, '^Representative, ', '')
    END AS position_name
  FROM essentials.offices o
  JOIN essentials.chambers ch ON o.chamber_id = ch.id
  JOIN essentials.governments g ON ch.government_id = g.id
  JOIN essentials.districts d ON o.district_id = d.id
  WHERE ch.name IN ('Massachusetts Senate', 'Massachusetts House of Representatives')
    AND d.district_type IN ('STATE_UPPER', 'STATE_LOWER')
)
INSERT INTO essentials.races (election_id, office_id, position_name, primary_party, seats)
SELECT gen_elec.id, leg_offices.office_id, leg_offices.position_name, NULL, 1
FROM gen_elec, leg_offices
ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING;
```

**Why `ch.name IN (...)` instead of `g.geo_id = '25'`:** DB has two governments with geo_id='25' ("State of Massachusetts" and "Commonwealth of Massachusetts"). Filtering by chamber name is the safe guard. See RESEARCH.md Pitfall 2.

**Ledger + Post-verify pattern** (from `280_md_2026_legislative_races.sql` pattern, adapted):
```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('358')
ON CONFLICT (version) DO NOTHING;

DO $$
DECLARE v_leg_count INT; v_null_count INT;
BEGIN
  SELECT COUNT(*) INTO v_leg_count FROM essentials.races r
  JOIN essentials.elections e ON r.election_id = e.id
  WHERE e.state='MA' AND e.name='2026 Massachusetts General Election'
    AND (r.position_name LIKE 'MA State Senate%' OR r.position_name LIKE 'MA House%');
  IF v_leg_count <> 200 THEN RAISE EXCEPTION 'Expected 200 MA legislative races, found %', v_leg_count; END IF;

  SELECT COUNT(*) INTO v_null_count FROM essentials.races r
  JOIN essentials.elections e ON r.election_id = e.id
  WHERE e.state='MA' AND r.office_id IS NULL;
  IF v_null_count > 0 THEN RAISE EXCEPTION 'MA races with NULL office_id: %', v_null_count; END IF;
END $$;
```

---

### `scripts/_apply-migration-357.ts` (apply script, request-response)

**Analog:** `C:/EV-Accounts/backend/scripts/_apply-migration-324.ts` (exact match)

**Full structural pattern** (`324_va_2026_races.ts` lines 1–62 — copy verbatim, swap numbers/queries):

```typescript
import 'dotenv/config';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import path from 'path';

const pool = new Pool({ connectionString: process.env['DATABASE_URL'], ssl: { rejectUnauthorized: false } });

const sql = readFileSync(path.join(process.cwd(), 'migrations', '357_ma_2026_statewide_races.sql'), 'utf8');

async function main() {
  await pool.query(sql);
  console.log('Migration 357 applied successfully');

  // Smoke test 1: NULL office_id count for MA 2026 general races — expect 0
  const r1 = await pool.query(`
    SELECT COUNT(*) as cnt FROM essentials.races r
    JOIN essentials.elections e ON e.id = r.election_id
    WHERE e.state = 'MA' AND e.name = '2026 Massachusetts General Election'
      AND r.office_id IS NULL
  `);
  console.log('NULL office_id count:', r1.rows[0].cnt, '(expected 0)');

  // Smoke test 2: Statewide/federal race count — expect 11
  const r2 = await pool.query(`
    SELECT COUNT(*) as cnt FROM essentials.races r
    JOIN essentials.elections e ON e.id = r.election_id
    WHERE e.state = 'MA' AND e.name = '2026 Massachusetts General Election'
      AND r.position_name IN (
        'Governor of Massachusetts','U.S. Senate Massachusetts',
        'U.S. House MA-01','U.S. House MA-02','U.S. House MA-03','U.S. House MA-04',
        'U.S. House MA-05','U.S. House MA-06','U.S. House MA-07','U.S. House MA-08','U.S. House MA-09'
      )
  `);
  console.log('MA 2026 statewide/federal race rows:', r2.rows[0].cnt, '(expected 11)');

  // Smoke test 3: Healey in race_candidates for Governor — expect 1
  const r3 = await pool.query(`
    SELECT COUNT(*) as cnt FROM essentials.race_candidates rc
    JOIN essentials.races r ON rc.race_id = r.id
    JOIN essentials.elections e ON r.election_id = e.id
    WHERE e.state = 'MA' AND r.position_name = 'Governor of Massachusetts'
      AND rc.politician_id = '7cf1080e-6e7e-4f5b-be00-6fb170896a7c'
  `);
  console.log('Healey in Governor race_candidates:', r3.rows[0].cnt, '(expected 1)');

  // Smoke test 4: Ledger entry
  const r4 = await pool.query(`
    SELECT version FROM supabase_migrations.schema_migrations WHERE version = '357'
  `);
  console.log('Ledger entry 357:', r4.rows.length > 0 ? 'PRESENT' : 'MISSING');

  await pool.end();
}

main().catch(e => {
  console.error('Error applying migration 357:', e.message);
  process.exit(1);
});
```

**Pattern notes:**
- Use `async function main()` wrapper + `main().catch(...)` — this is the current standard (see migration 324 lines 10–62). The older pattern of top-level `try/catch` (migration 322) is still valid but the `async main()` style is preferred in recent scripts.
- `ssl: { rejectUnauthorized: false }` is required on all pool connections.
- Run from `C:/EV-Accounts/backend/` with `npx tsx scripts/_apply-migration-357.ts`.

---

### `scripts/_apply-migration-358.ts` (apply script, request-response)

**Analog:** `C:/EV-Accounts/backend/scripts/_apply-migration-280.ts` (exact match for structure; swap queries for MA)

**Full structural pattern** (from `_apply-migration-280.ts` lines 1–97 — copy wrapper, replace smoke tests):

```typescript
import 'dotenv/config';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import path from 'path';

const pool = new Pool({ connectionString: process.env['DATABASE_URL'], ssl: { rejectUnauthorized: false } });

const sql = readFileSync(path.join(process.cwd(), 'migrations', '358_ma_2026_legislative_races.sql'), 'utf8');

try {
  await pool.query(sql);
  console.log('Migration 358 applied successfully');

  // Smoke test 1: MA State Senate race count — expect 40
  const r1 = await pool.query(`
    SELECT COUNT(*) as cnt FROM essentials.races r
    JOIN essentials.elections e ON e.id = r.election_id
    WHERE e.state = 'MA' AND r.position_name LIKE 'MA State Senate%'
      AND e.name = '2026 Massachusetts General Election'
  `);
  console.log('MA State Senate race rows:', r1.rows[0].cnt, '(expected 40)');

  // Smoke test 2: MA House race count — expect 160
  const r2 = await pool.query(`
    SELECT COUNT(*) as cnt FROM essentials.races r
    JOIN essentials.elections e ON e.id = r.election_id
    WHERE e.state = 'MA' AND r.position_name LIKE 'MA House%'
      AND e.name = '2026 Massachusetts General Election'
  `);
  console.log('MA House race rows:', r2.rows[0].cnt, '(expected 160)');

  // Smoke test 3: Total legislative count — expect 200
  const r3 = await pool.query(`
    SELECT COUNT(*) as cnt FROM essentials.races r
    JOIN essentials.elections e ON e.id = r.election_id
    WHERE e.state = 'MA' AND e.name = '2026 Massachusetts General Election'
      AND (r.position_name LIKE 'MA State Senate%' OR r.position_name LIKE 'MA House%')
  `);
  console.log('Total MA legislative race rows:', r3.rows[0].cnt, '(expected 200)');

  // Smoke test 4: NULL office_id detector — must be 0
  const r4 = await pool.query(`
    SELECT COUNT(*) as cnt FROM essentials.races r
    JOIN essentials.elections e ON e.id = r.election_id
    WHERE e.state = 'MA' AND r.office_id IS NULL
  `);
  console.log('MA races with NULL office_id:', r4.rows[0].cnt, '(expected 0)');

  // Smoke test 5: Ledger entry
  const r5 = await pool.query(`
    SELECT version FROM supabase_migrations.schema_migrations WHERE version = '358'
  `);
  console.log('Ledger entry 358:', r5.rows.length > 0 ? 'PRESENT' : 'MISSING');

} catch (e: any) {
  console.error('Error applying migration 358:', e.message);
  process.exit(1);
} finally {
  await pool.end();
}
```

**Note:** Migration 280's apply script uses `try/catch/finally` style (not `async main()`). Either style is valid; the `try/catch/finally` form auto-calls `pool.end()` even on error.

---

### `src/pages/Landing.jsx` (edit — COVERAGE_CITIES array)

**Analog:** `src/pages/Landing.jsx` lines 14–26 (self-analog — existing entries show exact format)

**Current COVERAGE_CITIES array** (lines 14–26 — existing entries show the exact object shape):
```jsx
const COVERAGE_CITIES = [
  { label: 'Berkeley', state: 'California', browseGovernmentList: ['0606000'], browseStateAbbrev: 'CA' },
  { label: 'Fremont', state: 'California', browseGovernmentList: ['0626000'], browseStateAbbrev: 'CA' },
  { label: 'Sacramento', state: 'California', browseGovernmentList: ['0664000'], browseStateAbbrev: 'CA' },
  { label: 'San Diego', state: 'California', browseGovernmentList: ['0666000'], browseStateAbbrev: 'CA' },
  { label: 'San Francisco', state: 'California', browseGovernmentList: ['0667000'], browseStateAbbrev: 'CA' },
  { label: 'San Jose', state: 'California', browseGovernmentList: ['0668000'], browseStateAbbrev: 'CA' },
  { label: 'Portland', state: 'Maine', browseGovernmentList: ['2360545'], browseStateAbbrev: 'ME' },
  { label: 'Cambridge', state: 'Massachusetts', browseGovernmentList: ['2511000'], browseStateAbbrev: 'MA' },
  { label: 'Portland', state: 'Oregon', browseGovernmentList: ['4159000'], browseStateAbbrev: 'OR' },
  { label: 'Leonardtown', state: 'Maryland', browseGovernmentList: ['2446475', '24037'], browseStateAbbrev: 'MD' },
  { label: 'Alexandria', state: 'Virginia', browseGovernmentList: ['5101000', '51510'], browseStateAbbrev: 'VA' },
];
```

**What to add** (insert after the Cambridge entry at line 22, before the Portland Oregon entry):
```jsx
  { label: 'Boston', state: 'Massachusetts', browseGovernmentList: ['2507000'], browseStateAbbrev: 'MA' },
```

**Routing logic** (lines 81–88 — confirms `browseGovernmentList` path is correct):
```jsx
if (area.browseGovernmentList) {
  const params = new URLSearchParams({
    browse_government_list: area.browseGovernmentList.join(','),
    browse_label: area.label,
  });
  if (area.browseStateAbbrev) params.set('browse_state', area.browseStateAbbrev);
  ...
  navigate(`/results?${params}`);
}
```

**MA state-level entry decision:** No existing entry in COVERAGE_CITIES uses `browseStateAbbrev` without `browseGovernmentList`. All city entries use `browseGovernmentList` pointing to a city geo_id. A statewide "Massachusetts" entry would require `browseGovernmentList` pointing to the state government geo_id or use a different routing path. The ROADMAP says "MA state browse entry (if not already present from v5.0)". Since this pattern has no precedent in COVERAGE_CITIES, the planner must decide: either add a MA state entry with `browseGovernmentList` set to a state-level geo_id (planner discretion), or defer it. The Boston entry is unambiguous and must be added.

---

## Shared Patterns

### Election ID Resolution
**Source:** `279_md_2026_statewide_races.sql` line 25 + `324_va_2026_races.sql` line 23
**Apply to:** Both migration 357 and 358 — never hardcode election UUIDs
```sql
WITH gen_elec AS (
  SELECT id FROM essentials.elections WHERE name = '2026 Massachusetts General Election' AND state = 'MA'
)
```

### ON CONFLICT Guard for Races
**Source:** `279_md_2026_statewide_races.sql` line 43 + `324_va_2026_races.sql` line 41
**Apply to:** Every INSERT into `essentials.races` in migrations 357 and 358
```sql
ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING
```

### Ledger Entry Pattern
**Source:** `279_md_2026_statewide_races.sql` lines 46–48
**Apply to:** End of every migration SQL file
```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('{N}')
ON CONFLICT (version) DO NOTHING;
```

### Post-Verify DO $$ Block
**Source:** `279_md_2026_statewide_races.sql` lines 52–71 + `324_va_2026_races.sql` lines 51–68
**Apply to:** End of both migration 357 and 358, after the ledger entry
```sql
DO $$
DECLARE v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count FROM essentials.races r
  JOIN essentials.elections e ON e.id = r.election_id
  WHERE e.state = 'MA' AND ...;
  IF v_count <> {expected} THEN RAISE EXCEPTION 'Expected {expected}, found %', v_count; END IF;
END $$;
```

### Apply Script Pool + Error Pattern
**Source:** `_apply-migration-324.ts` lines 1–6 + 59–62
**Apply to:** Both apply scripts 357 and 358
```typescript
import 'dotenv/config';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import path from 'path';

const pool = new Pool({ connectionString: process.env['DATABASE_URL'], ssl: { rejectUnauthorized: false } });
// ...
main().catch(e => {
  console.error('Error applying migration NNN:', e.message);
  process.exit(1);
});
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| UPDATE portion of `357_ma_2026_statewide_races.sql` | migration | CRUD (UPDATE) | No prior migration in the codebase performs UPDATE on races to fix NULL office_id — this is a unique repair operation |

The UPDATE pattern is straightforward SQL (`UPDATE ... SET office_id = '...' WHERE ... AND office_id IS NULL`) and requires no analog; see Pattern 2 in RESEARCH.md.

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/` (322, 324, 279, 280, 325), `C:/EV-Accounts/backend/scripts/` (all `_apply-migration-*.ts`), `C:/Transparent Motivations/essentials/src/pages/Landing.jsx`
**Files scanned:** 10
**Pattern extraction date:** 2026-06-11

### MA-Specific Pitfalls to Carry Forward to Plans

1. **Position name derivation from `offices.title`:** Migration 358 must strip `"Senator, "` or `"Representative, "` prefix from `o.title` via `regexp_replace(o.title, '^Senator, ', '')`. MD analog used hardcoded district numbers — this does not apply to MA.

2. **Chamber name guard:** Use `ch.name IN ('Massachusetts Senate', 'Massachusetts House of Representatives')` not `g.geo_id = '25'` in the leg_offices CTE. Two MA governments share geo_id='25'; only one has the correct chambers.

3. **ON CONFLICT DO NOTHING on race_candidates:** Markey is already in race_candidates for both Senate races from v5.0. All race_candidates INSERTs need `ON CONFLICT DO NOTHING`.

4. **Election rows are assert-only:** Both MA 2026 election rows exist. No INSERT for elections needed in either migration. The WITH CTE `SELECT id FROM essentials.elections WHERE name='...'` handles resolution.

5. **Apply script run directory:** Must run `npx tsx scripts/_apply-migration-357.ts` from `C:/EV-Accounts/backend/` (not `C:/EV-Accounts/`). The `path.join(process.cwd(), 'migrations', ...)` in the script assumes this working directory.
