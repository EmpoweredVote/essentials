# Phase 85: Multnomah Elections + Discovery - Pattern Map

**Mapped:** 2026-06-01
**Files analyzed:** 5 (2 SQL migrations + 2 apply scripts + 1 smoke test)
**Analogs found:** 5 / 5

## File Classification

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `migrations/251_multnomah_elections.sql` | migration | CRUD | `migrations/240_portland_city_races.sql` | exact |
| `migrations/252_multnomah_discovery.sql` | migration | CRUD | `migrations/241_or_discovery_jurisdictions.sql` | exact |
| `scripts/_apply-migration-251.ts` | utility | request-response | `scripts/_apply-migration-244.ts` | exact |
| `scripts/_apply-migration-252.ts` | utility | request-response | `scripts/_apply-migration-244.ts` | exact |
| `scripts/smoke-multnomah-elections.ts` | test | request-response | `scripts/smoke-multnomah-cities.ts` | exact |

All paths are relative to `C:/EV-Accounts/backend/`.

---

## Pattern Assignments

### `migrations/251_multnomah_elections.sql` (migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/240_portland_city_races.sql`

**Full migration structure** (lines 1-51 — entire file):
```sql
-- Migration 240: Portland City Races for OR 2026 General — Phase 79 Plan 04

DO $$
DECLARE
  v_general_id UUID;
BEGIN
  SELECT id INTO v_general_id FROM essentials.elections
  WHERE name = 'OR 2026 General' AND state = 'OR';

  INSERT INTO essentials.races (id, election_id, office_id, position_name, primary_party, seats)
  VALUES (gen_random_uuid(), v_general_id, '3c893213-931d-4a51-9e6f-c1ae958cd900'::uuid,
    'Portland City Council District 3 Seat A', NULL, 1)
  ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING;

  -- [repeat INSERT block per race row]

END $$;
```

**Key rules extracted from analog:**
- `DO $$ DECLARE v_general_id UUID; BEGIN ... END $$;` — wraps all INSERTs in a single PL/pgSQL block
- `SELECT id INTO v_general_id FROM essentials.elections WHERE name = 'OR 2026 General' AND state = 'OR'` — election_id lookup by name+state (resilient to DB restore)
- No INSERT for the election row itself (election `de10e3a7-f5c2-47e6-acd7-ee87be9413db` already exists)
- `INSERT INTO essentials.races (id, election_id, office_id, position_name, primary_party, seats)` — exact column set; no extra columns
- `gen_random_uuid()` for id
- `'<uuid>'::uuid` — office_id hardcoded as UUID literal with explicit cast
- `primary_party = NULL` — nonpartisan (general election, no party primary)
- `seats = 1` — all Multnomah County and city offices are single-member
- `ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING` — must include the `WHERE primary_party IS NULL` partial index clause; omitting it causes a constraint-matching error
- No migration ledger INSERT inside the DO block — ledger entry goes after `END $$;`
- No `BEGIN`/`COMMIT` wrapping the DO block — the DO block is self-contained

**Ledger entry pattern** (add after END $$):
```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('251')
ON CONFLICT (version) DO NOTHING;
```

**Migration 251 race rows (18 total):**

County (2 rows):
- office_id `4b4821cf-9a97-4044-8132-706290d22e27` → `'Multnomah County Chair'`
- office_id `3f01e9e8-bac6-4f0c-9793-ed14fbe2b22b` → `'Multnomah County Commissioner District 2'`

Gresham (4 rows):
- office_id `4658f141-8cfd-4739-a959-23322a3182e7` → `'Gresham Mayor'`
- office_id `be91f6d5-b46f-4ca2-9605-a1eb62b47c01` → `'Gresham City Council Position 2'`
- office_id `3c3cc31d-384e-4837-bd72-5c43faca3bc8` → `'Gresham City Council Position 4'`
- office_id `4cf1b2b1-e005-48d7-b8a4-67040d8199cd` → `'Gresham City Council Position 6'`

Troutdale (3 rows):
- office_id `0b80a890-44f1-47be-bf6b-b17fc3eef9cb` → `'Troutdale City Council Seat 1'` (Davidson)
- office_id `f291ef52-c368-472c-bce1-948e803eaf23` → `'Troutdale City Council Seat 2'` (Wunn)
- office_id `10292aee-a4c1-4a74-88b2-b85e3ff40722` → `'Troutdale City Council Seat 3'` (Andrews)

Fairview (4 rows):
- office_id `0ff020a1-224f-4363-9c2f-8944b12ffcf2` → `'Fairview Mayor'`
- office_id `15f9aaf4-3d4b-4f34-9213-cb3a8ca19e94` → `'Fairview City Council Position 4'`
- office_id `15da3e65-a69f-429b-b0db-c4d450fb1c71` → `'Fairview City Council Position 5'`
- office_id `db927fb8-7627-4a22-b486-9888c22559b4` → `'Fairview City Council Position 6'`

Wood Village (2 rows):
- office_id `8e42ac99-e2bb-4ea5-b8f6-02372ca0b4a6` → `'Wood Village City Council Seat 1'` (Miner)
- office_id `c6c3259e-8883-4893-9fe4-50384d131f72` → `'Wood Village City Council Seat 2'` (Gothard)

Maywood Park (3 rows):
- office_id `23370dd5-9602-40b7-a820-74fd4b5055a1` → `'Maywood Park City Council Seat 1'` (Baltzell)
- office_id `bec2352c-e2ff-46c9-bdda-bd5bf13ae254` → `'Maywood Park City Council Seat 2'` (Berman)
- office_id `bbd553e7-1e67-4504-96dc-5f5c017eabd5` → `'Maywood Park City Council Seat 3'` (Welander)

---

### `migrations/252_multnomah_discovery.sql` (migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/241_or_discovery_jurisdictions.sql`

**Full migration structure** (lines 1-25 — entire file):
```sql
-- Migration 241: OR Discovery Jurisdictions — Phase 79 Plan 05

INSERT INTO essentials.discovery_jurisdictions
  (id, jurisdiction_geoid, jurisdiction_name, state, election_date, source_url, allowed_domains)
SELECT
  gen_random_uuid(), '41', 'State of Oregon', 'OR', '2026-11-03',
  'https://sos.oregon.gov/elections/Pages/Candidate-Filings-Local-Measures.aspx',
  ARRAY['sos.oregon.gov', 'oregonlegislature.gov', 'ballotpedia.org']
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.discovery_jurisdictions
  WHERE jurisdiction_geoid = '41' AND election_date = '2026-11-03'
);
```

**Key rules extracted from analog:**
- `INSERT ... SELECT gen_random_uuid(), ... WHERE NOT EXISTS (...)` — idempotent pattern; no DELETE+INSERT
- Column order: `id, jurisdiction_geoid, jurisdiction_name, state, election_date, source_url, allowed_domains`
- `WHERE NOT EXISTS` guard checks both `jurisdiction_geoid` AND `election_date` — both conditions required
- No DO $$ block — plain INSERT...SELECT is sufficient; no variables needed
- `ARRAY[...]` literal for `allowed_domains`
- No `cron_active` column — cron arms automatically when `election_date` is within 180 days

**Migration 252 values (from CONTEXT.md D-09 through D-13):**
- `jurisdiction_geoid = '41051'`
- `jurisdiction_name = 'Multnomah County, Oregon'`
- `state = 'OR'`
- `election_date = '2026-11-03'`
- `source_url = 'https://www.multco.us/elections'`
- `allowed_domains = ARRAY['multco.us', 'ballotpedia.org', 'sos.oregon.gov']`

**Ledger entry** (after the INSERT):
```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('252')
ON CONFLICT (version) DO NOTHING;
```

---

### `scripts/_apply-migration-251.ts` (utility, request-response)

**Analog:** `C:/EV-Accounts/backend/scripts/_apply-migration-244.ts`

**Imports pattern** (lines 1-4):
```typescript
import 'dotenv/config';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import path from 'path';
```

**Connection pattern** (line 6):
```typescript
const pool = new Pool({ connectionString: process.env['DATABASE_URL'], ssl: { rejectUnauthorized: false } });
```

**SQL load pattern** (lines 8):
```typescript
const sql = readFileSync(path.join(process.cwd(), 'migrations', '244_multnomah_county_government.sql'), 'utf8');
```
Change to: `'migrations', '251_multnomah_elections.sql'`

**Apply + verify pattern** (lines 10-66):
```typescript
try {
  await pool.query(sql);
  console.log('Migration 251 applied successfully');

  // Post-apply verification queries
  const r1 = await pool.query(
    `SELECT COUNT(*) as cnt FROM essentials.races r
     JOIN essentials.elections e ON e.id = r.election_id
     WHERE e.name = 'OR 2026 General' AND r.position_name ILIKE '%Multnomah County%'`
  );
  console.log('County race rows:', r1.rows[0].cnt, '(expected 2)');

  const r2 = await pool.query(
    `SELECT COUNT(*) as cnt FROM essentials.races r
     JOIN essentials.elections e ON e.id = r.election_id
     WHERE e.name = 'OR 2026 General'
       AND r.position_name ~ '(Gresham|Troutdale|Fairview|Wood Village|Maywood Park)'`
  );
  console.log('City race rows:', r2.rows[0].cnt, '(expected 16)');

  const r3 = await pool.query(
    `SELECT COUNT(*) as cnt FROM supabase_migrations.schema_migrations WHERE version = '251'`
  );
  console.log('Ledger entry:', r3.rows[0].cnt, '(expected 1)');

} catch (e: any) {
  console.error('Error applying migration 251:', e.message);
  process.exit(1);
} finally {
  await pool.end();
}
```

**Error handling pattern** (lines 64-68):
```typescript
} catch (e: any) {
  console.error('Error applying migration 244:', e.message);
  process.exit(1);
} finally {
  await pool.end();
}
```

---

### `scripts/_apply-migration-252.ts` (utility, request-response)

**Analog:** `C:/EV-Accounts/backend/scripts/_apply-migration-244.ts`

Same imports, connection, and error handling pattern as `_apply-migration-251.ts` above.

**SQL load pattern:** Change filename to `'252_multnomah_discovery.sql'`

**Post-apply verification queries for migration 252:**
```typescript
const r1 = await pool.query(
  `SELECT COUNT(*) as cnt FROM essentials.discovery_jurisdictions
   WHERE jurisdiction_geoid = '41051' AND election_date = '2026-11-03'`
);
console.log('Discovery jurisdiction rows:', r1.rows[0].cnt, '(expected 1)');

const r2 = await pool.query(
  `SELECT jurisdiction_geoid, jurisdiction_name, source_url, allowed_domains, election_date
   FROM essentials.discovery_jurisdictions
   WHERE jurisdiction_geoid = '41051'`
);
console.log('Discovery row:', JSON.stringify(r2.rows[0]));

const r3 = await pool.query(
  `SELECT COUNT(*) as cnt FROM supabase_migrations.schema_migrations WHERE version = '252'`
);
console.log('Ledger entry:', r3.rows[0].cnt, '(expected 1)');
```

---

### `scripts/smoke-multnomah-elections.ts` (test, request-response)

**Analog:** `C:/EV-Accounts/backend/scripts/smoke-multnomah-cities.ts`

**Imports + dotenv pattern** (lines 1-4):
```typescript
import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();
```
Note: smoke tests use `Client` (single connection), not `Pool`. Apply scripts use `Pool`.

**Pre-flight guard pattern** (lines 97-100):
```typescript
if (!process.env['DATABASE_URL']) {
  process.stderr.write('ERROR: DATABASE_URL not set\n');
  process.exit(1);
}
```

**Client connect/disconnect pattern** (lines 101-108, 307-312):
```typescript
const client = new Client({
  connectionString: process.env['DATABASE_URL'],
  ssl: { rejectUnauthorized: false },
});
await client.connect();
// ... test body in try/finally
finally {
  await client.end();
}
```

**Race count verification query pattern** (adapted from post-verify DO block in RESEARCH.md):
```typescript
const r1 = await client.query<{ cnt: string }>(
  `SELECT COUNT(*) as cnt FROM essentials.races r
   JOIN essentials.elections e ON e.id = r.election_id
   WHERE e.name = 'OR 2026 General'
     AND r.position_name ILIKE '%Multnomah County%'`
);
const countyCount = parseInt(r1.rows[0].cnt, 10);
console.log(`County race rows: ${countyCount} (expected 2)`);
if (countyCount < 2) {
  errors.push(`FAIL: expected >= 2 county race rows, got ${countyCount}`);
  allPassed = false;
}
```

**Discovery jurisdiction verification query pattern:**
```typescript
const r2 = await client.query<{ cnt: string }>(
  `SELECT COUNT(*) as cnt FROM essentials.discovery_jurisdictions
   WHERE jurisdiction_geoid = '41051' AND election_date = '2026-11-03'`
);
const discoveryCount = parseInt(r2.rows[0].cnt, 10);
console.log(`Discovery jurisdiction rows: ${discoveryCount} (expected 1)`);
if (discoveryCount !== 1) {
  errors.push(`FAIL: expected 1 discovery_jurisdictions row for geo_id=41051, got ${discoveryCount}`);
  allPassed = false;
}
```

**All-passed exit pattern** (lines 300-316 of smoke-multnomah-cities.ts):
```typescript
console.log('\n=== Smoke Test Results ===');
if (allPassed) {
  console.log('ALL ASSERTIONS PASSED');
  process.exit(0);
} else {
  console.log(`FAILED (${errors.length} assertion(s)):`);
  for (const err of errors) {
    console.log(`  - ${err}`);
  }
  process.exit(1);
}

main().catch((err) => {
  console.error('Smoke test error:', err);
  process.exit(1);
});
```

**Smoke test address for D-14** (from RESEARCH.md — verified against live DB):
- Corbett OR coordinate: `lon: -122.2, lat: 45.5`
- Confirmed: G4020 (41051) present, G4110 absent — unincorporated Multnomah County

---

## Shared Patterns

### Election ID Lookup
**Source:** `C:/EV-Accounts/backend/migrations/240_portland_city_races.sql` lines 9-10
**Apply to:** `migrations/251_multnomah_elections.sql`
```sql
SELECT id INTO v_general_id FROM essentials.elections
WHERE name = 'OR 2026 General' AND state = 'OR';
```
Known election_id from RESEARCH.md: `de10e3a7-f5c2-47e6-acd7-ee87be9413db`. The SELECT is still preferred over hardcoding for resilience. No INSERT needed — election already exists.

### ON CONFLICT Partial Index Guard
**Source:** `C:/EV-Accounts/backend/migrations/240_portland_city_races.sql` line 16
**Apply to:** Every INSERT in `migrations/251_multnomah_elections.sql`
```sql
ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING
```
The `WHERE primary_party IS NULL` clause is mandatory — it matches the partial index definition. Omitting it causes a runtime error.

### WHERE NOT EXISTS Idempotency Guard
**Source:** `C:/EV-Accounts/backend/migrations/241_or_discovery_jurisdictions.sql` lines 8-11
**Apply to:** `migrations/252_multnomah_discovery.sql`
```sql
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.discovery_jurisdictions
  WHERE jurisdiction_geoid = '41051' AND election_date = '2026-11-03'
);
```

### Migration Ledger Entry
**Source:** `C:/EV-Accounts/backend/scripts/_apply-migration-244.ts` line 34
**Apply to:** Both `.sql` migrations and both apply scripts (in verification step)
```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('251')   -- or '252'
ON CONFLICT (version) DO NOTHING;
```

### Pool vs Client Convention
**Source:** Comparison of `_apply-migration-244.ts` (Pool) and `smoke-multnomah-county.ts` (Client)
**Apply to:** All new scripts
- Apply scripts (`_apply-migration-*.ts`): use `Pool` from `pg`
- Smoke test scripts (`smoke-*.ts`): use `Client` from `pg`

---

## No Analog Found

All 5 files have exact analogs in the codebase. No files require falling back to RESEARCH.md patterns.

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/`, `C:/EV-Accounts/backend/scripts/`
**Files scanned:** 7 (2 SQL migrations + 5 apply/smoke scripts)
**Pattern extraction date:** 2026-06-01
