# Phase 167: NV 2026 Elections & Discovery - Pattern Map

**Mapped:** 2026-06-29
**Files analyzed:** 6 (3 SQL migrations + 3 apply scripts)
**Analogs found:** 6 / 6

---

## File Classification

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `migrations/1111_nv_2026_general_election.sql` | election seed | batch INSERT | `migrations/1109_seed_tx_ny_2026_house_elections_races.sql` | exact |
| `scripts/_apply-migration-1111.ts` | apply script | request-response | `scripts/_apply-migration-322.ts` | role-match |
| `migrations/1112_nv_2026_races.sql` | race seed | batch INSERT | `migrations/1109_seed_tx_ny_2026_house_elections_races.sql` | exact |
| `scripts/_apply-migration-1112.ts` | apply script | request-response | `scripts/_apply-migration-280.ts` | role-match |
| `migrations/1113_nv_2026_discovery.sql` | discovery seed | batch INSERT | `migrations/325_va_2026_discovery.sql` | exact |
| `scripts/_apply-migration-1113.ts` | apply script | request-response | `scripts/_apply-migration-325.ts` | exact |

---

## Pattern Assignments

### `migrations/1111_nv_2026_general_election.sql` (election seed, batch INSERT)

**Analog:** `C:/EV-Accounts/backend/migrations/1109_seed_tx_ny_2026_house_elections_races.sql`

**Full structure pattern** (lines 25-36, adapted to single NV row):
```sql
BEGIN;

-- One general election row, NOT EXISTS idempotency guard, no ON CONFLICT
INSERT INTO essentials.elections (id, name, election_date, election_type, jurisdiction_level, state)
SELECT gen_random_uuid(), v.name, '2026-11-03T08:00:00.000Z'::timestamptz, 'general', 'state', v.st
FROM (VALUES
  ('TX 2026 Statewide General', 'TX'),
  ('NY 2026 Statewide General', 'NY')
) v(name, st)
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.elections e WHERE e.name = v.name
);
```
For NV: single-row variant — `'NV 2026 Statewide General'`, `'NV'`, `'2026-11-03T08:00:00.000Z'::timestamptz`, `election_type='general'`, `jurisdiction_level='state'`.

**Post-verify DO $$ block pattern** (lines 65-108, adapted):
```sql
DO $$
DECLARE
  n_elections int;
BEGIN
  SELECT count(*) INTO n_elections FROM essentials.elections
   WHERE name = 'NV 2026 Statewide General';
  IF n_elections <> 1 THEN
    RAISE EXCEPTION 'Expected 1 NV election, found %', n_elections;
  END IF;
  RAISE NOTICE 'OK: NV 2026 Statewide General election row present';
END $$;

COMMIT;
-- NO schema_migrations ledger INSERT (D-08: matches 1109 pattern)
```

**Critical naming rule:** Election name MUST be `NV 2026 Statewide General` — NOT `2026 Nevada General Election`. The `{ST} 2026 Statewide General` naming convention is established by 1109 (CA, TX, NY all follow it). The VA/MD names (`2026 Virginia General Election`, `2026 Maryland General Election`) are the stale older style.

**No `schema_migrations` ledger INSERT** — 1109 omits it; follow that pattern for 1111/1112/1113.

---

### `scripts/_apply-migration-1111.ts` (apply script, request-response)

**Analog:** `C:/EV-Accounts/backend/scripts/_apply-migration-322.ts`

**Imports + pool pattern** (lines 1-8):
```typescript
import 'dotenv/config';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import path from 'path';

const pool = new Pool({ connectionString: process.env['DATABASE_URL'], ssl: { rejectUnauthorized: false } });

const sql = readFileSync(path.join(process.cwd(), 'migrations', '322_va_2026_elections.sql'), 'utf8');
```
For 1111: change filename to `'1111_nv_2026_general_election.sql'`.

**Smoke test structure** (lines 10-46):
```typescript
try {
  await pool.query(sql);
  console.log('Migration 322 applied successfully');

  // Smoke test 1: Election count
  const r1 = await pool.query(`
    SELECT COUNT(*) as cnt FROM essentials.elections
    WHERE state = 'VA' AND election_date IN ('2026-08-04', '2026-11-03')
  `);
  console.log('VA 2026 election rows:', r1.rows[0].cnt, '(expected 2)');

  // Smoke test 2: Primary date check
  const r2 = await pool.query(`
    SELECT election_date FROM essentials.elections
    WHERE name = '2026 Virginia State Primary' AND state = 'VA'
  `);
  console.log('Primary election_date:', r2.rows[0]?.election_date, '(expected 2026-08-04)');

  // ... more spot-checks ...

  // Smoke test 4: Ledger entry
  const r4 = await pool.query(`
    SELECT version FROM supabase_migrations.schema_migrations WHERE version = '322'
  `);
  console.log('Ledger entry 322:', r4.rows.length > 0 ? 'PRESENT' : 'MISSING');

} catch (e: any) {
  console.error('Error applying migration 322:', e.message);
  process.exit(1);
} finally {
  await pool.end();
}
```
For 1111: adapt to NV — check `WHERE name = 'NV 2026 Statewide General'` returns 1 row, `election_date = '2026-11-03'`, `jurisdiction_level = 'state'`. **Omit the ledger smoke test** (no ledger INSERT in 1111 per D-08); replace with a `jurisdiction_level` spot-check instead.

---

### `migrations/1112_nv_2026_races.sql` (race seed, batch INSERT)

**Analog:** `C:/EV-Accounts/backend/migrations/1109_seed_tx_ny_2026_house_elections_races.sql`

**Core races INSERT pattern** (lines 39-62) — the VALUES + JOIN approach that resolves office via `districts.geo_id`:
```sql
INSERT INTO essentials.races (id, election_id, office_id, position_name, primary_party, seats)
SELECT gen_random_uuid(), el.id, o.id, 'U.S. Representative District ' || v.cd, NULL, 1
FROM (VALUES
  ('TX','4801',1),('TX','4802',2), ...
) v(st, geo_id, cd)
JOIN essentials.elections el ON el.name = (v.st || ' 2026 Statewide General')
JOIN essentials.districts d ON d.geo_id = v.geo_id AND d.district_type = 'NATIONAL_LOWER'
JOIN essentials.offices o ON o.district_id = d.id
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.races r WHERE r.election_id = el.id AND r.office_id = o.id
);
```

**NV adaptation — NATIONAL_LOWER (4 US House races):**
```sql
INSERT INTO essentials.races (id, election_id, office_id, position_name, primary_party, seats)
SELECT gen_random_uuid(), el.id, o.id, 'U.S. Representative District ' || v.cd, NULL, 1
FROM (VALUES
  ('3201',1),('3202',2),('3203',3),('3204',4)
) v(geo_id, cd)
JOIN essentials.elections el ON el.name = 'NV 2026 Statewide General'
JOIN essentials.districts d ON d.geo_id = v.geo_id AND d.district_type = 'NATIONAL_LOWER'
JOIN essentials.offices o ON o.district_id = d.id
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.races r WHERE r.election_id = el.id AND r.office_id = o.id
);
```
**NOTE:** NV NATIONAL_LOWER geo_ids `'3201'..'3204'` are assumed from Phase 158 TIGER load pattern. Executor MUST verify with `SELECT geo_id FROM essentials.districts WHERE district_type='NATIONAL_LOWER' AND state ILIKE 'nv' ORDER BY geo_id` before writing migration.

**NV adaptation — STATE_UPPER (11 Senate districts): add ILIKE casing guard**
```sql
INSERT INTO essentials.races (id, election_id, office_id, position_name, primary_party, seats)
SELECT gen_random_uuid(), el.id, o.id, 'Nevada State Senate District ' || lpad(v.dn::text, 2, '0'), NULL, 1
FROM (VALUES (2),(8),(9),(10),(12),(13),(14),(16),(17),(20),(21)) v(dn)
JOIN essentials.elections el ON el.name = 'NV 2026 Statewide General'
JOIN essentials.districts d
  ON d.district_type = 'STATE_UPPER'
  AND d.state ILIKE 'nv'
  -- geo_id format: executor must verify (e.g. '32002' for D2 — run verification query first)
JOIN essentials.offices o ON o.district_id = d.id
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.races r WHERE r.election_id = el.id AND r.office_id = o.id
);
```
**CRITICAL:** The geo_id JOIN condition for STATE_UPPER must match the actual format from the DB. The research notes `'32002'` as an example (5-char NV FIPS prefix + 3-digit district), but this MUST be verified. One approach: join on a derived expression matching the geo_id format; alternatively use `d.label` or a VALUES list of known geo_ids after the verification query. The `ILIKE 'nv'` guard is mandatory (D-09 mixed-casing trap).

**NV adaptation — STATE_LOWER (42 Assembly districts):** Same pattern as STATE_UPPER but `district_type='STATE_LOWER'` and all 42 districts (01..42). `position_name = 'Nevada State Assembly District ' || lpad(v.dn::text, 2, '0')`.

**NV adaptation — STATE_EXEC (6 statewide execs):** Offices share a STATE_EXEC district; resolve each by the office's `title` (or via the external_id range -3200001..-3200006 from Phase 159). Example:
```sql
-- For each of 6 execs: JOIN on district_type='STATE_EXEC' AND state ILIKE 'nv'
-- then JOIN offices o ON o.district_id = d.id AND o.title = 'Governor'  (or use ext_id)
-- position_name per RESEARCH.md: 'Governor of Nevada', 'Lieutenant Governor of Nevada', etc.
-- Verify actual office titles with: SELECT o.title FROM essentials.offices o
--   JOIN essentials.districts d ON d.id=o.district_id
--   WHERE d.state ILIKE 'nv' AND d.district_type='STATE_EXEC'
```

**Post-verify block pattern** (lines 64-108 from 1109):
```sql
DO $$
DECLARE
  n_exec   int;
  n_upper  int;
  n_lower  int;
  n_house  int;
  n_nulloff int;
BEGIN
  SELECT count(*) INTO n_exec
    FROM essentials.races r
    JOIN essentials.elections el ON el.id = r.election_id
    JOIN essentials.offices o ON o.id = r.office_id
    JOIN essentials.districts d ON d.id = o.district_id
   WHERE el.name = 'NV 2026 Statewide General' AND d.district_type = 'STATE_EXEC';
  IF n_exec <> 6 THEN RAISE EXCEPTION 'Expected 6 NV exec races, found %', n_exec; END IF;

  SELECT count(*) INTO n_upper ... AND d.district_type = 'STATE_UPPER' ...;
  IF n_upper <> 11 THEN RAISE EXCEPTION 'Expected 11 NV senate races, found %', n_upper; END IF;

  SELECT count(*) INTO n_lower ... AND d.district_type = 'STATE_LOWER' ...;
  IF n_lower <> 42 THEN RAISE EXCEPTION 'Expected 42 NV assembly races, found %', n_lower; END IF;

  SELECT count(*) INTO n_house ... AND d.district_type = 'NATIONAL_LOWER' ...;
  IF n_house <> 4 THEN RAISE EXCEPTION 'Expected 4 NV House races, found %', n_house; END IF;

  -- Critical: zero NULL office_id
  SELECT count(*) INTO n_nulloff
    FROM essentials.races r
    JOIN essentials.elections el ON el.id = r.election_id
   WHERE el.name = 'NV 2026 Statewide General' AND r.office_id IS NULL;
  IF n_nulloff <> 0 THEN RAISE EXCEPTION 'Found % NV races with NULL office_id', n_nulloff; END IF;

  RAISE NOTICE 'OK: NV races 6+11+42+4=63, 0 null office_id';
END $$;

COMMIT;
```

**Anti-pattern to avoid (from D-07 and 1109 header):** MD migration 280 uses `ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING` — that relies on a partial unique index that does NOT exist on `essentials.races`. Using `ON CONFLICT` on NV races will fail with a Postgres error. Always use `NOT EXISTS` guards on `(election_id, office_id)`.

---

### `scripts/_apply-migration-1112.ts` (apply script, request-response)

**Analog:** `C:/EV-Accounts/backend/scripts/_apply-migration-280.ts`

**Structure** (lines 1-97):
```typescript
import 'dotenv/config';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import path from 'path';

const pool = new Pool({ connectionString: process.env['DATABASE_URL'], ssl: { rejectUnauthorized: false } });
const sql = readFileSync(path.join(process.cwd(), 'migrations', '280_md_2026_legislative_races.sql'), 'utf8');

try {
  await pool.query(sql);
  console.log('Migration 280 applied successfully');

  // Smoke test: tier-by-tier counts + NULL office_id detector
  const r1 = await pool.query(`SELECT COUNT(*) as cnt FROM essentials.races r
    JOIN essentials.elections e ON e.id = r.election_id
    WHERE e.state = 'MD' AND r.position_name LIKE 'MD State Senate%'`);
  console.log('MD State Senate race rows:', r1.rows[0].cnt, '(expected 47)');

  // ... more tier counts ...

  const r5 = await pool.query(`SELECT COUNT(*) as cnt FROM essentials.races r
    JOIN essentials.elections e ON e.id = r.election_id
    WHERE e.state = 'MD' AND r.office_id IS NULL`);
  console.log('MD races with NULL office_id:', r5.rows[0].cnt, '(expected 0)');

} catch (e: any) {
  console.error('Error applying migration 280:', e.message);
  process.exit(1);
} finally {
  await pool.end();
}
```

For 1112: adapt to NV — 4 smoke tests (exec=6, senate=11, assembly=42, house=4) + total=63 + NULL office_id=0. No ledger smoke test per D-08.

**Key smoke test queries for NV 1112:**
```typescript
// Total races
const rTotal = await pool.query(`
  SELECT COUNT(*) as cnt FROM essentials.races r
  JOIN essentials.elections e ON e.id = r.election_id
  WHERE e.name = 'NV 2026 Statewide General'
`);
console.log('Total NV 2026 races:', rTotal.rows[0].cnt, '(expected 63)');

// NULL office_id guard — must be 0
const rNull = await pool.query(`
  SELECT COUNT(*) as cnt FROM essentials.races r
  JOIN essentials.elections e ON e.id = r.election_id
  WHERE e.name = 'NV 2026 Statewide General' AND r.office_id IS NULL
`);
console.log('NV races with NULL office_id:', rNull.rows[0].cnt, '(expected 0)');
```

---

### `migrations/1113_nv_2026_discovery.sql` (discovery seed, batch INSERT)

**Analog:** `C:/EV-Accounts/backend/migrations/325_va_2026_discovery.sql`

**Full pattern** (lines 30-67 from 325, adapted to NV — single general election only per D-02):
```sql
-- jurisdiction_geoid='32' (Nevada state FIPS, 2-digit bare, matches MD='24' / VA='51')
-- ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING — this constraint EXISTS
-- No cron_active column (D-05)

INSERT INTO essentials.discovery_jurisdictions
  (jurisdiction_geoid, jurisdiction_name, state, election_date, source_url, allowed_domains)
VALUES
  ('32', 'State of Nevada', 'NV', '2026-11-03',
   'https://ballotpedia.org/Nevada_elections,_2026',
   ARRAY['ballotpedia.org', 'nvsos.gov', 'nevada.gov', 'leg.state.nv.us'])
ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING;

-- Post-verify
DO $$
DECLARE v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM essentials.discovery_jurisdictions WHERE state = 'NV';
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'Expected 1 NV discovery_jurisdictions row, found %', v_count;
  END IF;
END $$;

-- NO schema_migrations ledger INSERT (D-08: matches 1109 pattern)
```

**Key differences from VA 325:**
- VA inserts 2 rows (primary + general); NV inserts 1 row (general only — primary is past, D-02).
- `jurisdiction_geoid='32'` (Nevada FIPS).
- `jurisdiction_name='State of Nevada'` (matches MD `'State of Maryland'` pattern, not VA `'Commonwealth of Virginia'`).
- `source_url='https://ballotpedia.org/Nevada_elections,_2026'` — Ballotpedia as primary (nvsos.gov returns 403 per research D-04).
- `allowed_domains` includes `nvsos.gov` so agent citations from there score as `confidence='official'`.
- **No `schema_migrations` ledger INSERT** (325 has one; NV 1113 must NOT — D-08).

---

### `scripts/_apply-migration-1113.ts` (apply script, request-response)

**Analog:** `C:/EV-Accounts/backend/scripts/_apply-migration-325.ts`

**Full pattern** (lines 1-57):
```typescript
import 'dotenv/config';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import path from 'path';

const pool = new Pool({ connectionString: process.env['DATABASE_URL'], ssl: { rejectUnauthorized: false } });

const sql = readFileSync(path.join(process.cwd(), 'migrations', '325_va_2026_discovery.sql'), 'utf8');

try {
  await pool.query(sql);
  console.log('Migration 325 applied successfully');

  // Smoke test 1: Row count — expect 2
  const r1 = await pool.query(`
    SELECT COUNT(*) as cnt FROM essentials.discovery_jurisdictions WHERE state = 'VA'
  `);
  console.log('VA discovery_jurisdictions rows:', r1.rows[0].cnt, '(expected 2)');

  // Smoke test 2: Both election dates present
  const r2 = await pool.query(`
    SELECT election_date::text FROM essentials.discovery_jurisdictions
    WHERE state = 'VA' ORDER BY election_date
  `);
  console.log('VA election dates:', r2.rows.map((r: any) => r.election_date));

  // Smoke test 3: allowed_domains length for primary row — expect 4
  const r3 = await pool.query(`
    SELECT array_length(allowed_domains, 1) as domain_count
    FROM essentials.discovery_jurisdictions WHERE state = 'VA' AND election_date = '2026-08-04'
  `);
  console.log('allowed_domains length (primary):', r3.rows[0]?.domain_count, '(expected 4)');

  // Smoke test 4: source_url
  const r4 = await pool.query(`
    SELECT source_url FROM essentials.discovery_jurisdictions
    WHERE state = 'VA' AND election_date = '2026-08-04'
  `);
  console.log('source_url (primary):', r4.rows[0]?.source_url);

  // Smoke test 5: Ledger entry present
  const r5 = await pool.query(`
    SELECT version FROM supabase_migrations.schema_migrations WHERE version = '325'
  `);
  console.log('Ledger entry 325:', r5.rows.length > 0 ? 'PRESENT' : 'MISSING');

} catch (e: any) {
  console.error('Error applying migration 325:', e.message);
  process.exit(1);
} finally {
  await pool.end();
}
```

For 1113: adapt to NV — row count expected 1 (not 2), single election_date `'2026-11-03'`, `allowed_domains` length expected 4, `source_url` expected `https://ballotpedia.org/Nevada_elections,_2026`. **Drop smoke test 5** (no ledger INSERT in 1113 per D-08; 325 has it but NV should not). Replace with a `jurisdiction_geoid` check:
```typescript
const rGeo = await pool.query(`
  SELECT jurisdiction_geoid FROM essentials.discovery_jurisdictions WHERE state = 'NV'
`);
console.log('NV jurisdiction_geoid:', rGeo.rows[0]?.jurisdiction_geoid, '(expected 32)');
```

---

## Shared Patterns

### NOT EXISTS idempotency guard (races)
**Source:** `C:/EV-Accounts/backend/migrations/1109_seed_tx_ny_2026_house_elections_races.sql` lines 60-62
**Apply to:** All `essentials.races` INSERTs in migration 1112
```sql
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.races r WHERE r.election_id = el.id AND r.office_id = o.id
);
```
No `ON CONFLICT` — no unique constraint on `(election_id, office_id)`.

### NOT EXISTS idempotency guard (elections)
**Source:** `C:/EV-Accounts/backend/migrations/1109_seed_tx_ny_2026_house_elections_races.sql` lines 33-36
**Apply to:** Migration 1111 elections INSERT
```sql
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.elections e WHERE e.name = v.name
);
```

### ON CONFLICT idempotency (discovery_jurisdictions)
**Source:** `C:/EV-Accounts/backend/migrations/325_va_2026_discovery.sql` line 36
**Apply to:** Migration 1113 discovery INSERT — this constraint DOES exist
```sql
ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING;
```

### ILIKE casing guard
**Source:** D-09 (live schema fact), used in all race INSERTs that JOIN on `essentials.districts`
**Apply to:** All district JOINs in migration 1112
```sql
AND d.state ILIKE 'nv'
```
NOT `= 'nv'` or `= 'NV'` — both case variants exist in production data.

### Apply script boilerplate
**Source:** `C:/EV-Accounts/backend/scripts/_apply-migration-325.ts` lines 1-6
**Apply to:** All three `_apply-migration-111N.ts` files
```typescript
import 'dotenv/config';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import path from 'path';

const pool = new Pool({ connectionString: process.env['DATABASE_URL'], ssl: { rejectUnauthorized: false } });
```
Invoke from `C:/EV-Accounts/backend` via:
```
node node_modules/tsx/dist/cli.mjs scripts/_apply-migration-1111.ts
```

### BEGIN/COMMIT transaction wrapper
**Source:** `C:/EV-Accounts/backend/migrations/1109_seed_tx_ny_2026_house_elections_races.sql` lines 25, 110
**Apply to:** Migrations 1111 and 1112
```sql
BEGIN;
-- ... INSERTs + DO $$ verify ...
COMMIT;
```
Migration 1113 (discovery) does not use BEGIN/COMMIT (matches 325 pattern which also has none).

### No schema_migrations ledger row
**Source:** `C:/EV-Accounts/backend/migrations/1109_seed_tx_ny_2026_house_elections_races.sql` (ends at line 110 with COMMIT; no ledger INSERT)
**Apply to:** All three NV migrations 1111/1112/1113
Do NOT add `INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('1111') ON CONFLICT DO NOTHING;`. Migrations 325 and 281 have ledger inserts, but 1109 (the D-09 canonical) does not. The on-disk counter is authoritative.

---

## Discovery Test Run (not a file — Plan 03 operator action)

**Source:** RESEARCH.md section "C. Discovery runner mechanism — RESOLVED"

The Plan 03 apply script should document (or execute inline) the discovery trigger:

```bash
# Step 1: Get the discovery_jurisdictions UUID
DISC_ID=$(psql $DATABASE_URL -At -c \
  "SELECT id FROM essentials.discovery_jurisdictions WHERE state='NV' AND election_date='2026-11-03'")

# Step 2: Trigger (returns HTTP 202 immediately)
curl -s -X POST \
  "https://accounts-api.onrender.com/api/admin/discover/jurisdiction/$DISC_ID" \
  -H "X-Admin-Token: $ADMIN_INGEST_TOKEN" \
  -H "Content-Type: application/json"

# Step 3: Wait ~90 seconds, then verify (async fire-and-forget)
psql $DATABASE_URL -c \
  "SELECT id, status, candidates_found, error_message FROM essentials.discovery_runs
   WHERE discovery_jurisdiction_id = '$DISC_ID'
   ORDER BY started_at DESC LIMIT 1;"
# Acceptance: status = 'completed', error_message = NULL
# candidates_found may be 0 — that is OK (D-03)
```

**Source for trigger endpoint:** `C:/EV-Accounts/backend/src/routes/essentialsDiscovery.ts` line 46: `POST /discover/jurisdiction/:id`, auth `requireAdminToken` (`X-Admin-Token` header).

---

## No Analog Found

None. All 6 files have strong analogs. The discovery test run is an operator action, not a file.

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/` and `C:/EV-Accounts/backend/scripts/`
**Key analog files read:**
- `migrations/1109_seed_tx_ny_2026_house_elections_races.sql` (111 lines — complete)
- `migrations/325_va_2026_discovery.sql` (68 lines — complete)
- `migrations/281_md_2026_discovery.sql` (59 lines — complete)
- `migrations/280_md_2026_legislative_races.sql` (lines 1-1048 sampled — DO $$ per-district pattern)
- `scripts/_apply-migration-325.ts` (57 lines — complete)
- `scripts/_apply-migration-322.ts` (47 lines — complete)
- `scripts/_apply-migration-280.ts` (97 lines — complete)
**Pattern extraction date:** 2026-06-29
