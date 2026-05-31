# Phase 79: OR Landing + Elections + Discovery - Pattern Map

**Mapped:** 2026-05-30
**Files analyzed:** 7 (Landing.jsx + 5 SQL migrations + 1 PowerShell generator)
**Analogs found:** 7 / 7

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/pages/Landing.jsx` | component | request-response | `src/pages/Landing.jsx` (Phase 69 edit) | exact |
| `migrations/237_or_elections.sql` | migration | CRUD | `migrations/183_me_2026_elections_foundation.sql` (Phase 55 Plan 01) | exact |
| `migrations/238_or_statewide_races.sql` | migration | CRUD | Phase 69 Plans 02+03 (CA statewide + US House race INSERT pattern) | exact |
| `migrations/239_or_legislative_races.sql` | migration | CRUD | `migrations/184_me_2026_legislative_races.sql` (Phase 55 Plan 02) | exact |
| `migrations/generate_or_legislative_races.ps1` | utility | batch/transform | `migrations/generate_me_legislative_races.ps1` (Phase 55 Plan 02) | exact |
| `migrations/240_portland_city_races.sql` | migration | CRUD | Phase 69 Plan 02 (race INSERT with office_id subquery) | role-match |
| `migrations/241_or_discovery_jurisdictions.sql` | migration | CRUD | Phase 69 Plan 04 (discovery_jurisdictions INSERT pattern) | exact |

---

## Pattern Assignments

### `src/pages/Landing.jsx` (component, request-response)

**Analog:** `src/pages/Landing.jsx` lines 8-19 (current state) + Phase 69-01-PLAN.md action block

**Current COVERAGE_AREAS shape** (`src/pages/Landing.jsx` lines 8-20):
```jsx
const COVERAGE_AREAS = [
  { county: 'Monroe County', state: 'Indiana', address: '100 W Kirkwood Ave, Bloomington, IN 47404' },
  { county: 'Los Angeles County', state: 'California', browseGovernmentList: ['0644000', '06037', '0622710'], browseStateAbbrev: 'CA', browseCountyGeoId: '06037' },
  { county: 'San Diego', state: 'California', browseGovernmentList: ['0666000'], browseStateAbbrev: 'CA' },
  { county: 'Fremont', state: 'California', browseGovernmentList: ['0626000'], browseStateAbbrev: 'CA' },
  { county: 'San Francisco', state: 'California', browseGovernmentList: ['0667000'], browseStateAbbrev: 'CA' },
  { county: 'San Jose', state: 'California', browseGovernmentList: ['0668000'], browseStateAbbrev: 'CA' },
  { county: 'Sacramento', state: 'California', browseGovernmentList: ['0664000'], browseStateAbbrev: 'CA' },
  { county: 'Berkeley', state: 'California', browseGovernmentList: ['0606000'], browseStateAbbrev: 'CA' },
  { county: 'Collin County', state: 'Texas', browseStateAbbrev: 'TX', browseCountyGeoId: '48085', browseGovernmentList: ['4801924',...] },
  { county: 'Cambridge', state: 'Massachusetts', browseGovernmentList: ['2511000'], browseStateAbbrev: 'MA' },
  { county: 'Portland', state: 'Maine', browseGovernmentList: ['2360545'], browseStateAbbrev: 'ME' },
];
```

**New OR entry to append after line 19** (D-01, direct model = Portland ME entry at line 19):
```jsx
  { county: 'Portland', state: 'Oregon', browseGovernmentList: ['4159000'], browseStateAbbrev: 'OR' },
```

**How handleCountyClick routes this** (`src/pages/Landing.jsx` lines 71-82):
```jsx
const handleCountyClick = (area) => {
  if (area.browseGovernmentList) {
    const params = new URLSearchParams({
      browse_government_list: area.browseGovernmentList.join(','),
      browse_label: area.county,
    });
    if (area.browseStateAbbrev) params.set('browse_state', area.browseStateAbbrev);
    if (area.browseCountyGeoId) params.set('browse_county_geo_id', area.browseCountyGeoId);
    navigate(`/results?${params}`);
  }
  ...
```

**Edit instruction:** Single-line insertion. Append after `{ county: 'Portland', state: 'Maine', ... }` at line 19. Do not add a trailing comma after the new entry; match existing style (last entry has no comma, array closes on line 20).

---

### `migrations/237_or_elections.sql` (migration, CRUD)

**Analog:** Phase 55-01-PLAN.md Section 1 (election row INSERT) + Phase 69-02-PLAN.md Task 1 (CA statewide elections INSERT)

**elections INSERT pattern** (from Phase 55-01-PLAN.md lines 98-108):
```sql
INSERT INTO essentials.elections (name, election_date, election_type, jurisdiction_level, state)
VALUES ('OR 2026 Primary', '2026-05-19', 'primary', 'state', 'OR')
ON CONFLICT (name, election_date, state) DO NOTHING;

INSERT INTO essentials.elections (name, election_date, election_type, jurisdiction_level, state)
VALUES ('OR 2026 General', '2026-11-03', 'general', 'state', 'OR')
ON CONFLICT (name, election_date, state) DO NOTHING;
```

**Critical schema note** (from RESEARCH.md and confirmed in Phase 69-02-PLAN.md line 88):
- Column is `name` NOT `election_name` — the field was confirmed via `information_schema.columns`
- `ON CONFLICT (name, election_date, state) DO NOTHING` — the unique constraint is on these three columns
- No `cron_active` column — does not exist on `essentials.elections`
- State value is uppercase `'OR'` for `essentials.elections.state`

---

### `migrations/238_or_statewide_races.sql` (migration, CRUD)

**Analog:** Phase 69-02-PLAN.md Task 2 (Governor race UPDATE + subquery on election name) + Phase 69-03-PLAN.md Task 1 (WITH gen_elec pattern for bulk race INSERTs)

**WITH subquery pattern for bulk race INSERTs** (from Phase 69-03-PLAN.md lines 71-79):
```sql
WITH gen_elec AS (
  SELECT id FROM essentials.elections WHERE name = 'OR 2026 General'
)
INSERT INTO essentials.races (id, election_id, office_id, position_name, seats)
SELECT gen_random_uuid(), gen_elec.id, t.office_id_val, t.position_name_val, 1
FROM gen_elec, (VALUES
  ('780f76cd-2ec0-42fc-bb67-74a8911ca1c8', 'Governor of Oregon'),
  ('3db3e08a-ed6c-4365-9e5a-9af1f94c4372', 'U.S. Senate Oregon'),
  ('617febb8-3b45-4787-87af-8b8ecc008b05', 'U.S. House OR-01'),
  ('41b9876c-304d-4268-a751-25ea7e2009cc', 'U.S. House OR-02'),
  ('62cb1965-8401-430c-8681-03a3e22e7c77', 'U.S. House OR-03'),
  ('94d89181-58c5-42b3-886f-4538131fd461', 'U.S. House OR-04'),
  ('1207f28b-6eea-4113-889c-3127292e29b9', 'U.S. House OR-05'),
  ('1e17d814-d999-4399-974c-3b36ec825ba7', 'U.S. House OR-06')
) AS t(office_id_val, position_name_val)
ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING;
```

**ON CONFLICT constraint** (verified in RESEARCH.md): The partial unique index is:
```sql
-- Constraint name: idx_races_election_position_no_party
ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING
```

**Verified office_ids for this migration** (from RESEARCH.md):

| Race | office_id |
|------|-----------|
| Governor | 780f76cd-2ec0-42fc-bb67-74a8911ca1c8 |
| US Senate (Merkley) | 3db3e08a-ed6c-4365-9e5a-9af1f94c4372 |
| US House OR-01 | 617febb8-3b45-4787-87af-8b8ecc008b05 |
| US House OR-02 | 41b9876c-304d-4268-a751-25ea7e2009cc |
| US House OR-03 | 62cb1965-8401-430c-8681-03a3e22e7c77 |
| US House OR-04 | 94d89181-58c5-42b3-886f-4538131fd461 |
| US House OR-05 | 1207f28b-6eea-4113-889c-3127292e29b9 |
| US House OR-06 | 1e17d814-d999-4399-974c-3b36ec825ba7 |

---

### `migrations/generate_or_legislative_races.ps1` (utility, batch/transform)

**Analog:** `migrations/generate_me_legislative_races.ps1` (Phase 55-02-PLAN.md lines 72-158)

**Generator skeleton** (adapted from Phase 55-02-PLAN.md Task 1):
```powershell
$output = @()
$output += "-- Migration 239: OR 2026 Legislative Race Scaffold"
$output += "-- Generated by generate_or_legislative_races.ps1"
$output += "-- 30 Senate districts x 1 election + 60 House districts x 1 election = 90 rows"
$output += ""

# --- SENATE DISTRICTS (1..30) ---
for ($n = 1; $n -le 30; $n++) {
    $geo_id = "41" + ($n.ToString().PadLeft(3, '0'))  # '41001' through '41030'
    $pos = "OR State Senate District $n"

    $block = @"
DO `$`$
DECLARE
  v_general_id UUID;
BEGIN
  SELECT id INTO v_general_id FROM essentials.elections
  WHERE name = 'OR 2026 General' AND state = 'OR';

  INSERT INTO essentials.races (election_id, office_id, position_name, primary_party, seats)
  VALUES (v_general_id,
    (SELECT o.id FROM essentials.offices o
     JOIN essentials.districts d ON d.id = o.district_id
     JOIN essentials.chambers ch ON ch.id = o.chamber_id
     WHERE d.geo_id = '$geo_id' AND d.district_type = 'STATE_UPPER' AND d.state = 'or'
       AND ch.name = 'Oregon Senate' LIMIT 1),
    '$pos', NULL, 1)
  ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING;
END `$`$;
"@
    $output += $block
}

# --- HOUSE DISTRICTS (1..60) ---
for ($n = 1; $n -le 60; $n++) {
    $geo_id = "41" + ($n.ToString().PadLeft(3, '0'))  # '41001' through '41060'
    $pos = "OR State House District $n"

    $block = @"
DO `$`$
DECLARE
  v_general_id UUID;
BEGIN
  SELECT id INTO v_general_id FROM essentials.elections
  WHERE name = 'OR 2026 General' AND state = 'OR';

  INSERT INTO essentials.races (election_id, office_id, position_name, primary_party, seats)
  VALUES (v_general_id,
    (SELECT o.id FROM essentials.offices o
     JOIN essentials.districts d ON d.id = o.district_id
     JOIN essentials.chambers ch ON ch.id = o.chamber_id
     WHERE d.geo_id = '$geo_id' AND d.district_type = 'STATE_LOWER' AND d.state = 'or'
       AND ch.name = 'Oregon House of Representatives' LIMIT 1),
    '$pos', NULL, 1)
  ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING;
END `$`$;
"@
    $output += $block
}

# CRITICAL: Use UTF-8 without BOM — NOT Out-File -Encoding UTF8
[System.IO.File]::WriteAllLines(
  "239_or_2026_legislative_races.sql",
  $output,
  [System.Text.UTF8Encoding]::new($false)
)
Write-Host "Generated 239_or_2026_legislative_races.sql"
```

**Key differences from ME generator** (Phase 55-02-PLAN.md):
- ME had primary + general (2 elections per district = 372 rows); OR is general only (1 election = 90 rows)
- ME: `d.state = 'me'`; OR: `d.state = 'or'` (lowercase — TIGER-loaded casing)
- ME: `ch.name = 'Maine Senate'` / `'Maine House of Representatives'`; OR: `'Oregon Senate'` / `'Oregon House of Representatives'`
- ME geo_ids: `'23' + lpad(N,3,'0')`; OR geo_ids: `'41' + lpad(N,3,'0')`
- CRITICAL disambiguation: `d.district_type = 'STATE_UPPER'` vs `'STATE_LOWER'` — BOTH SD-01 and HD-01 use geo_id '41001'; the district_type is mandatory to resolve the correct office

**UTF-8 BOM fix** (confirmed in Phase 55-02-SUMMARY.md):
- `Out-File -Encoding UTF8` writes a BOM (EF BB BF) that PostgreSQL rejects with "syntax error at or near ''"
- Correct approach: `[System.IO.File]::WriteAllLines("filename", $output, [System.Text.UTF8Encoding]::new($false))`

---

### `migrations/239_or_legislative_races.sql` (migration, CRUD)

**Analog:** `migrations/184_me_2026_legislative_races.sql` (produced by Phase 55 generator)

This file is **generated** by `generate_or_legislative_races.ps1`. It should not be hand-written. After generation:

**Expected structure** (90 DO blocks, each producing 1 race row):
```sql
-- Migration 239: OR 2026 Legislative Race Scaffold
-- Generated by generate_or_legislative_races.ps1
-- 30 Senate districts x 1 election + 60 House districts x 1 election = 90 rows

DO $$
DECLARE
  v_general_id UUID;
BEGIN
  SELECT id INTO v_general_id FROM essentials.elections
  WHERE name = 'OR 2026 General' AND state = 'OR';

  INSERT INTO essentials.races (election_id, office_id, position_name, primary_party, seats)
  VALUES (v_general_id,
    (SELECT o.id FROM essentials.offices o
     JOIN essentials.districts d ON d.id = o.district_id
     JOIN essentials.chambers ch ON ch.id = o.chamber_id
     WHERE d.geo_id = '41001' AND d.district_type = 'STATE_UPPER' AND d.state = 'or'
       AND ch.name = 'Oregon Senate' LIMIT 1),
    'OR State Senate District 1', NULL, 1)
  ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING;
END $$;
...
```

**Verification after apply** (from Phase 55-02-PLAN.md lines 218-260):
```sql
SELECT COUNT(*) FROM essentials.races r
JOIN essentials.elections e ON e.id = r.election_id
WHERE e.state = 'OR' AND r.position_name LIKE 'OR State %';
-- Expected: 90

-- District-type disambiguation spot-check (CRITICAL):
SELECT r.position_name, r.office_id, d.district_type, ch.name
FROM essentials.races r
JOIN essentials.offices o ON o.id = r.office_id
JOIN essentials.districts d ON d.id = o.district_id
JOIN essentials.chambers ch ON ch.id = o.chamber_id
JOIN essentials.elections e ON e.id = r.election_id
WHERE e.state = 'OR'
  AND r.position_name IN ('OR State Senate District 1', 'OR State House District 1');
-- Expected: 2 rows with DIFFERENT office_ids
```

---

### `migrations/240_portland_city_races.sql` (migration, CRUD)

**Analog:** Phase 69-02-PLAN.md Task 1 (DO $$ block with RETURNING pattern for race rows)

**DO $$ block pattern with RETURNING + fallback** (from Phase 55-01-PLAN.md lines 140-145, Phase 69 analog):
```sql
DO $$
DECLARE
  v_general_id UUID;
  v_race UUID;
BEGIN
  SELECT id INTO v_general_id FROM essentials.elections
  WHERE name = 'OR 2026 General' AND state = 'OR';

  -- District 3: Three seats (Seat A, B, C — each links to one of 3 identical offices)
  INSERT INTO essentials.races (id, election_id, office_id, position_name, seats)
  VALUES (gen_random_uuid(), v_general_id,
    (SELECT o.id FROM essentials.offices o
     JOIN essentials.districts d ON d.id = o.district_id
     WHERE d.geo_id = 'portland-or-council-district-3'
     ORDER BY o.id LIMIT 1 OFFSET 0),
    'Portland City Council District 3 Seat A', 1)
  ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING;

  INSERT INTO essentials.races (id, election_id, office_id, position_name, seats)
  VALUES (gen_random_uuid(), v_general_id,
    (SELECT o.id FROM essentials.offices o
     JOIN essentials.districts d ON d.id = o.district_id
     WHERE d.geo_id = 'portland-or-council-district-3'
     ORDER BY o.id LIMIT 1 OFFSET 1),
    'Portland City Council District 3 Seat B', 1)
  ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING;

  -- ... Seat C with OFFSET 2, then District 4 Seats A/B/C ...

  -- City Auditor (hardcoded office_id from Phase 77 — a19813f9-ee4d-442d-b052-5c2f9f7db9c8)
  INSERT INTO essentials.races (id, election_id, office_id, position_name, seats)
  VALUES (gen_random_uuid(), v_general_id,
    'a19813f9-ee4d-442d-b052-5c2f9f7db9c8',
    'Portland City Auditor', 1)
  ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING;

END $$;
```

**Verified office lookups for Portland D3 and D4** (from RESEARCH.md):
- District 3: `d.geo_id = 'portland-or-council-district-3'` — 3 offices, order by `o.id`, use OFFSET 0/1/2
- District 4: `d.geo_id = 'portland-or-council-district-4'` — 3 offices, same pattern
- City Auditor: hardcoded `office_id = 'a19813f9-ee4d-442d-b052-5c2f9f7db9c8'`

**Position name uniqueness requirement** (RESEARCH.md Pitfall 6): Three offices per district are identical (same title, same district_id). Seat A/B/C suffixes make position_names distinct so `ON CONFLICT (election_id, position_name)` can distinguish them.

---

### `migrations/241_or_discovery_jurisdictions.sql` (migration, CRUD)

**Analog:** Phase 69-04-PLAN.md Task 1 (discovery_jurisdictions INSERT pattern with `WHERE NOT EXISTS` guard)

**Confirmed schema** (from RESEARCH.md — no `cron_active` column):
```
id uuid, jurisdiction_geoid text, jurisdiction_name text, state text,
election_date date, source_url text, allowed_domains text[], created_at timestamptz, updated_at timestamptz
```

**INSERT pattern from Phase 69-04-PLAN.md** (adapted for OR):
```sql
-- Row 1: OR Statewide
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

-- Row 2: Portland City
INSERT INTO essentials.discovery_jurisdictions
  (id, jurisdiction_geoid, jurisdiction_name, state, election_date, source_url, allowed_domains)
SELECT
  gen_random_uuid(), '4159000', 'City of Portland, Oregon', 'OR', '2026-11-03',
  'https://www.portland.gov/auditor/elections',
  ARRAY['portland.gov', 'multco.us', 'ballotpedia.org']
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.discovery_jurisdictions
  WHERE jurisdiction_geoid = '4159000' AND election_date = '2026-11-03'
);
```

**Why `WHERE NOT EXISTS` instead of `ON CONFLICT`** (RESEARCH.md Pitfall 7): `discovery_jurisdictions` has no unique constraint beyond the primary key. `ON CONFLICT DO NOTHING` with no unique constraint is silently accepted but does not prevent duplicates. The `WHERE NOT EXISTS` pattern using `(jurisdiction_geoid, election_date)` as the effective key is the correct idempotency guard.

**Cron sweep mechanics** (from `C:\EV-Accounts\backend\src\lib\discoveryCron.ts` lines 201-206):
```typescript
const jurisdictionsResult = await pool.query(
  `SELECT id, jurisdiction_name
     FROM essentials.discovery_jurisdictions
    WHERE election_date > now()
      AND election_date <= $1   -- horizon = now() + 180 days
    ORDER BY election_date ASC`,
  ...
);
```
Both OR rows use `election_date = '2026-11-03'`, which is 157 days from 2026-05-30 — within the 180-day window. No opt-in flag needed; insertion is sufficient for the cron to sweep them.

---

## Shared Patterns

### elections.name Column (cross-cutting gotcha)
**Source:** RESEARCH.md Pitfall 4 (verified via `information_schema.columns` 2026-05-30)
**Apply to:** All migrations that INSERT into or SELECT from `essentials.elections`
- Use `name` column, NOT `election_name` — the column is `name`
- Example: `WHERE name = 'OR 2026 General'` not `WHERE election_name = 'OR 2026 General'`

### Race INSERT Idempotency
**Source:** Phase 69-03-PLAN.md lines 71-79; RESEARCH.md confirmed constraint
**Apply to:** Migrations 238, 239, 240
```sql
ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING
```
The partial unique index `idx_races_election_position_no_party` covers `(election_id, position_name) WHERE primary_party IS NULL`. All OR race rows use `primary_party = NULL` (combined model), so this guard works for all of them.

### Election ID Subquery Pattern
**Source:** Phase 55-01-PLAN.md lines 35-37; Phase 69-02-PLAN.md Task 2
**Apply to:** Migrations 238, 239, 240
```sql
-- Fetch once at top of DO block:
SELECT id INTO v_general_id FROM essentials.elections
WHERE name = 'OR 2026 General' AND state = 'OR';
```
Or inline in a WITH CTE for bulk inserts (migration 238 pattern).

### Section-Split Check
**Source:** RESEARCH.md "Section-Split Check" section; STATE.md project rule
**Apply to:** Run after every migration plan that touches OR districts
```sql
SELECT COUNT(*) FROM essentials.geofence_boundaries gb
WHERE gb.state = '41'
  AND gb.geo_id NOT IN (
    SELECT geo_id FROM essentials.districts WHERE state IN ('or','OR','41')
  );
-- Expected: 0
```

### State Casing Rules for OR
**Source:** RESEARCH.md "OR District geo_id Patterns"; Phase 75-CONTEXT.md decisions
**Apply to:** All OR migrations with district lookups
- `essentials.elections.state` = uppercase `'OR'`
- `essentials.districts.state` for STATE_UPPER/STATE_LOWER = lowercase `'or'` (TIGER-loaded)
- `essentials.districts.state` for NATIONAL_UPPER/NATIONAL_LOWER = uppercase `'OR'` (pre-seeded)

---

## No Analog Found

All files in Phase 79 have direct analogs. No novel patterns required.

| File | Notes |
|------|-------|
| All 7 files | Direct analogs exist from Phase 55 (ME) and Phase 69 (CA) |

---

## Metadata

**Analog search scope:** `.planning/phases/55-me-2026-elections-discovery/`, `.planning/phases/69-landing-elections-discovery/`, `src/pages/Landing.jsx`, `C:\EV-Accounts\backend\src\lib\discoveryCron.ts`
**Files scanned:** 12 planning files + 3 source files
**Pattern extraction date:** 2026-05-30

**Key analog relationship:**
- Phase 55 (ME elections) = primary analog for election row INSERT, DO $$ race block, PowerShell legislative generator
- Phase 69 (CA elections) = primary analog for WITH CTE bulk race INSERT, discovery_jurisdictions pattern, Landing.jsx COVERAGE_AREAS edit
- The two analogs are complementary; Phase 79 combines both (legislative scaffold from 55, statewide races from 69, discovery from 69)
