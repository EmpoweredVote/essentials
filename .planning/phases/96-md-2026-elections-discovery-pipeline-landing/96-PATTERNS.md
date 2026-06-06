# Phase 96: MD 2026 Elections + Discovery Pipeline + Landing - Pattern Map

**Mapped:** 2026-06-06
**Files analyzed:** 5 (4 new migrations + 1 modified JSX file)
**Analogs found:** 5 / 5

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `C:/EV-Accounts/backend/migrations/278_md_2026_elections.sql` | migration | CRUD | `C:/EV-Accounts/backend/migrations/237_or_2026_elections.sql` | exact |
| `C:/EV-Accounts/backend/migrations/279_md_2026_statewide_races.sql` | migration | CRUD | `C:/EV-Accounts/backend/migrations/238_or_statewide_races.sql` | exact |
| `C:/EV-Accounts/backend/migrations/280_md_2026_legislative_races.sql` | migration | CRUD | `C:/EV-Accounts/backend/migrations/239_or_legislative_races.sql` | role-match (MD has sub-districts + variable seats; OR is uniform seats=1) |
| `C:/EV-Accounts/backend/migrations/281_md_2026_discovery_landing.sql` | migration | CRUD | `C:/EV-Accounts/backend/migrations/183_me_2026_elections_foundation.sql` | exact (discovery_jurisdictions pattern) |
| `C:\Transparent Motivations\essentials\src\pages\Landing.jsx` | component | request-response | same file (line 23 insertion point) | exact |

---

## Pattern Assignments

### `278_md_2026_elections.sql` (migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/237_or_2026_elections.sql`

**Core pattern** (lines 1-12 of analog):
```sql
-- Migration 237: OR 2026 Elections — Phase 79 Plan 01
-- Seeds the two OR 2026 election rows that all downstream race rows reference.
-- D-03: The primary row is bare (no races link to it); all races link to the general election only.
-- Idempotent via ON CONFLICT (name, election_date, state) DO NOTHING.

INSERT INTO essentials.elections (name, election_date, election_type, jurisdiction_level, state)
VALUES ('OR 2026 Primary', '2026-05-19', 'primary', 'state', 'OR')
ON CONFLICT (name, election_date, state) DO NOTHING;

INSERT INTO essentials.elections (name, election_date, election_type, jurisdiction_level, state)
VALUES ('OR 2026 General', '2026-11-03', 'general', 'state', 'OR')
ON CONFLICT (name, election_date, state) DO NOTHING;
```

**MD adaptation — substitute these exact values:**
- Primary name: `'2026 Maryland State Primary'`
- Primary date: `'2026-06-23'` (VERIFIED — NOT July 14; SBE confirmed June 23)
- General name: `'2026 Maryland General Election'`
- General date: `'2026-11-03'`
- State: `'MD'`
- election_type: `'primary'` / `'general'`
- jurisdiction_level: `'state'`

**No post-verification block needed for 278** — election row count verified in downstream migrations.

---

### `279_md_2026_statewide_races.sql` (migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/238_or_statewide_races.sql`

**Core VALUES pattern** (lines 11-26 of analog):
```sql
WITH gen_elec AS (
  SELECT id FROM essentials.elections WHERE name = 'OR 2026 General' AND state = 'OR'
)
INSERT INTO essentials.races (id, election_id, office_id, position_name, primary_party, seats)
SELECT gen_random_uuid(), gen_elec.id, t.office_id_val::uuid, t.position_name_val, NULL, 1
FROM gen_elec, (VALUES
  ('780f76cd-2ec0-42fc-bb67-74a8911ca1c8', 'Governor of Oregon'),
  ('3db3e08a-ed6c-4365-9e5a-9af1f94c4372', 'U.S. Senate Oregon'),
  ('617febb8-3b45-4787-87af-8b8ecc008b05', 'U.S. House OR-01'),
  ...
) AS t(office_id_val, position_name_val)
ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING;
```

**MD adaptation — substitute these VALUES rows (12 total):**
```sql
WITH gen_elec AS (
  SELECT id FROM essentials.elections WHERE name = '2026 Maryland General Election' AND state = 'MD'
)
INSERT INTO essentials.races (election_id, office_id, position_name, primary_party, seats)
SELECT gen_elec.id, t.office_id_val::uuid, t.position_name_val, NULL, 1
FROM gen_elec, (VALUES
  ('1a7ac65d-983a-4c62-85bc-d506ea2755a3', 'Governor of Maryland'),
  ('6f9fd58a-442c-4c58-bd6d-f36a1bcbf114', 'Attorney General of Maryland'),
  ('816a9ad0-f2ac-48b3-918a-aa75aa2f9efd', 'Comptroller of Maryland'),
  ('59092640-43df-4dea-bac3-441690c76ad9', 'U.S. Senate Maryland'),
  ('44eb9e42-ae4f-46b0-87dc-a4c8518330d2', 'U.S. House MD-01'),
  ('ff4f5b35-a627-42e3-82cd-d4e287cca040', 'U.S. House MD-02'),
  ('fcb4bb30-cfa4-473e-816a-d67df9c17e91', 'U.S. House MD-03'),
  ('365904b7-b72c-4db4-8312-d4c4534a0abb', 'U.S. House MD-04'),
  ('cabd5f12-6aa6-4742-96da-159660141c89', 'U.S. House MD-05'),
  ('58e6825b-aa32-4532-8952-b8c94d83c371', 'U.S. House MD-06'),
  ('7d1685dd-f832-4bf7-8f60-b8ee40152049', 'U.S. House MD-07'),
  ('21839e79-ac55-4733-b517-db000431a9c1', 'U.S. House MD-08')
) AS t(office_id_val, position_name_val)
ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING;
```

**Critical differences from OR analog:**
- OR analog includes `gen_random_uuid()` for `id` column — omit this for MD (let DB auto-generate via default)
- OR omits AG and Comptroller (OR has no separate AG election in 2026) — MD must include both
- LG Aruna Miller (`7e15c4f7-6e58-4d04-a755-46430258f0bd`) is NOT included — runs on same ticket as Governor
- Angela Alsobrooks is NOT included — she is Class 2, not up until 2028
- All seats=1 for statewide races

**Post-verification block for 279:**
```sql
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM essentials.races r
  JOIN essentials.elections e ON e.id = r.election_id
  WHERE e.state = 'MD' AND e.name = '2026 Maryland General Election';
  IF v_count <> 12 THEN
    RAISE EXCEPTION 'Expected 12 MD statewide race rows, found %', v_count;
  END IF;
END $$;
```

---

### `280_md_2026_legislative_races.sql` (migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/239_or_legislative_races.sql` (generated by `generate_or_legislative_races.ps1`)

**Generator analog:** `C:/EV-Accounts/backend/migrations/generate_or_legislative_races.ps1`

**Core DO $$ block pattern** (lines 5-21 of 239 analog, one block per district):
```sql
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
```

**Generator pattern** (lines 17-41 of `generate_or_legislative_races.ps1`):
```powershell
for ($n = 1; $n -le 30; $n++) {
    $geo_id = "41" + ($n.ToString().PadLeft(3, '0'))
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
```

**UTF-8 no-BOM write pattern** (lines 71-76 of `generate_or_legislative_races.ps1`) — CRITICAL:
```powershell
[System.IO.File]::WriteAllLines(
  (Join-Path $PSScriptRoot '239_or_legislative_races.sql'),
  $output,
  [System.Text.UTF8Encoding]::new($false)
)
```

**MD adaptation differences from OR — the generator CANNOT use a simple loop:**

OR uses sequential geo_ids (`41001`..`41060`) — simple `for` loop works.
MD SLDL geo_ids are NON-SEQUENTIAL (mix of whole-district `24003`-`24046` and sub-district `2401A`, `2401B`, `2401C`, etc.). The generator must use hardcoded arrays.

**MD generator must use hardcoded data arrays:**

Senate (SLDU) — 47 districts, all seats=1, geo_ids `24001`..`24047`:
```powershell
# Simple sequential loop works for senate (no sub-districts)
for ($n = 1; $n -le 47; $n++) {
    $geo_id = "24" + ($n.ToString().PadLeft(3, '0'))  # '24001' through '24047'
    $pos = "MD State Senate District $n"
    # district_type='STATE_UPPER', d.state='md', ch.name='Maryland State Senate', seats=1
}
```

House (SLDL) — 71 geofence rows, variable seats — must be hardcoded array:
```powershell
$houseDistricts = @(
  # Whole-district rows (seats=3): 29 districts
  @{ geo_id='24003'; label='District 3';        seats=3 },
  @{ geo_id='24004'; label='District 4';        seats=3 },
  @{ geo_id='24005'; label='District 5';        seats=3 },
  @{ geo_id='24006'; label='District 6';        seats=3 },
  @{ geo_id='24008'; label='District 8';        seats=3 },
  @{ geo_id='24010'; label='District 10';       seats=3 },
  @{ geo_id='24013'; label='District 13';       seats=3 },
  @{ geo_id='24014'; label='District 14';       seats=3 },
  @{ geo_id='24015'; label='District 15';       seats=3 },
  @{ geo_id='24016'; label='District 16';       seats=3 },
  @{ geo_id='24017'; label='District 17';       seats=3 },
  @{ geo_id='24018'; label='District 18';       seats=3 },
  @{ geo_id='24019'; label='District 19';       seats=3 },
  @{ geo_id='24020'; label='District 20';       seats=3 },
  @{ geo_id='24021'; label='District 21';       seats=3 },
  @{ geo_id='24022'; label='District 22';       seats=3 },
  @{ geo_id='24023'; label='District 23';       seats=3 },
  @{ geo_id='24024'; label='District 24';       seats=3 },
  @{ geo_id='24025'; label='District 25';       seats=3 },
  @{ geo_id='24026'; label='District 26';       seats=3 },
  @{ geo_id='24028'; label='District 28';       seats=3 },
  @{ geo_id='24031'; label='District 31';       seats=3 },
  @{ geo_id='24032'; label='District 32';       seats=3 },
  @{ geo_id='24036'; label='District 36';       seats=3 },
  @{ geo_id='24039'; label='District 39';       seats=3 },
  @{ geo_id='24040'; label='District 40';       seats=3 },
  @{ geo_id='24041'; label='District 41';       seats=3 },
  @{ geo_id='24045'; label='District 45';       seats=3 },
  @{ geo_id='24046'; label='District 46';       seats=3 },
  # Sub-district rows (42 rows, variable seats):
  @{ geo_id='2401A'; label='Subdistrict 1A';    seats=1 },
  @{ geo_id='2401B'; label='Subdistrict 1B';    seats=1 },
  @{ geo_id='2401C'; label='Subdistrict 1C';    seats=1 },
  @{ geo_id='2402A'; label='Subdistrict 2A';    seats=2 },
  @{ geo_id='2402B'; label='Subdistrict 2B';    seats=1 },
  @{ geo_id='2407A'; label='Subdistrict 7A';    seats=2 },
  @{ geo_id='2407B'; label='Subdistrict 7B';    seats=1 },
  @{ geo_id='2409A'; label='Subdistrict 9A';    seats=2 },
  @{ geo_id='2409B'; label='Subdistrict 9B';    seats=1 },
  @{ geo_id='2411A'; label='Subdistrict 11A';   seats=1 },
  @{ geo_id='2411B'; label='Subdistrict 11B';   seats=2 },
  @{ geo_id='2412A'; label='Subdistrict 12A';   seats=2 },
  @{ geo_id='2412B'; label='Subdistrict 12B';   seats=1 },
  @{ geo_id='2427A'; label='Subdistrict 27A';   seats=1 },
  @{ geo_id='2427B'; label='Subdistrict 27B';   seats=1 },
  @{ geo_id='2427C'; label='Subdistrict 27C';   seats=1 },
  @{ geo_id='2429A'; label='Subdistrict 29A';   seats=1 },
  @{ geo_id='2429B'; label='Subdistrict 29B';   seats=1 },
  @{ geo_id='2429C'; label='Subdistrict 29C';   seats=1 },
  @{ geo_id='2430A'; label='Subdistrict 30A';   seats=2 },
  @{ geo_id='2430B'; label='Subdistrict 30B';   seats=1 },
  @{ geo_id='2433A'; label='Subdistrict 33A';   seats=1 },
  @{ geo_id='2433B'; label='Subdistrict 33B';   seats=1 },
  @{ geo_id='2433C'; label='Subdistrict 33C';   seats=1 },
  @{ geo_id='2434A'; label='Subdistrict 34A';   seats=2 },
  @{ geo_id='2434B'; label='Subdistrict 34B';   seats=1 },
  @{ geo_id='2435A'; label='Subdistrict 35A';   seats=2 },
  @{ geo_id='2435B'; label='Subdistrict 35B';   seats=1 },
  @{ geo_id='2437A'; label='Subdistrict 37A';   seats=1 },
  @{ geo_id='2437B'; label='Subdistrict 37B';   seats=2 },
  @{ geo_id='2438A'; label='Subdistrict 38A';   seats=1 },
  @{ geo_id='2438B'; label='Subdistrict 38B';   seats=1 },
  @{ geo_id='2438C'; label='Subdistrict 38C';   seats=1 },
  @{ geo_id='2442A'; label='Subdistrict 42A';   seats=1 },
  @{ geo_id='2442B'; label='Subdistrict 42B';   seats=1 },
  @{ geo_id='2442C'; label='Subdistrict 42C';   seats=1 },
  @{ geo_id='2443A'; label='Subdistrict 43A';   seats=2 },
  @{ geo_id='2443B'; label='Subdistrict 43B';   seats=1 },
  @{ geo_id='2444A'; label='Subdistrict 44A';   seats=1 },
  @{ geo_id='2444B'; label='Subdistrict 44B';   seats=2 },
  @{ geo_id='2447A'; label='Subdistrict 47A';   seats=2 },
  @{ geo_id='2447B'; label='Subdistrict 47B';   seats=1 }
)
```

**Per-district block for house (district_type='STATE_LOWER', ch.name='Maryland House of Delegates', seats=$d.seats):**
```sql
DO $$
DECLARE
  v_general_id UUID;
BEGIN
  SELECT id INTO v_general_id FROM essentials.elections
  WHERE name = '2026 Maryland General Election' AND state = 'MD';

  INSERT INTO essentials.races (election_id, office_id, position_name, primary_party, seats)
  VALUES (v_general_id,
    (SELECT o.id FROM essentials.offices o
     JOIN essentials.districts d ON d.id = o.district_id
     JOIN essentials.chambers ch ON ch.id = o.chamber_id
     WHERE d.geo_id = '2401A' AND d.district_type = 'STATE_LOWER' AND d.state = 'md'
       AND ch.name = 'Maryland House of Delegates' LIMIT 1),
    'MD House Delegate Subdistrict 1A', NULL, 1)
  ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING;
END $$;
```

**position_name convention (open question from RESEARCH.md):**
- Whole-district rows: `'MD House Delegate District N'`
- Sub-district rows: `'MD House Delegate Subdistrict NNA'`
- Senate rows: `'MD State Senate District N'`

**CRITICAL state casing rule:**
- For SLDU/SLDL office lookup: `d.state = 'md'` (lowercase)
- For US House/Senate (NATIONAL_LOWER/NATIONAL_UPPER): use hardcoded office_ids to avoid casing ambiguity

**Post-verification block for 280:**
```sql
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM essentials.races r
  JOIN essentials.elections e ON e.id = r.election_id
  WHERE e.state = 'MD';
  -- Expected: 12 statewide + 47 senate + 71 house = 130 total
  IF v_count <> 130 THEN
    RAISE EXCEPTION 'Expected 130 MD race rows total, found %', v_count;
  END IF;
END $$;
```

**ROADMAP deviation note (mandatory in migration header comment):**
ROADMAP said "198 total race rows" (one-row-per-seat model). Actual count is 130 (one-row-per-district, enforced by UNIQUE constraint). Document this in the migration header.

---

### `281_md_2026_discovery_landing.sql` (migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/183_me_2026_elections_foundation.sql` — Section 2 (lines 46-72)

**Core discovery_jurisdictions pattern** (lines 50-64 of 183 analog):
```sql
-- (no cron_active column — eligibility is date-based, 180-day horizon)

INSERT INTO essentials.discovery_jurisdictions
  (jurisdiction_geoid, jurisdiction_name, state, election_date, source_url, allowed_domains)
VALUES
  ('23', 'State of Maine', 'ME', '2026-06-09',
   'https://www.maine.gov/sos/elections-voting/upcoming-elections',
   ARRAY['maine.gov', 'legislature.maine.gov', 'ballotpedia.org'])
ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING;

INSERT INTO essentials.discovery_jurisdictions
  (jurisdiction_geoid, jurisdiction_name, state, election_date, source_url, allowed_domains)
VALUES
  ('23', 'State of Maine', 'ME', '2026-11-03',
   'https://www.maine.gov/sos/elections-voting/upcoming-elections',
   ARRAY['maine.gov', 'legislature.maine.gov', 'ballotpedia.org'])
ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING;
```

**MD adaptation — substitute these values:**
```sql
INSERT INTO essentials.discovery_jurisdictions
  (jurisdiction_geoid, jurisdiction_name, state, election_date, source_url, allowed_domains)
VALUES
  ('24', 'State of Maryland', 'MD', '2026-06-23',
   'https://elections.maryland.gov/elections/2026/primary_candidates/index.html',
   ARRAY['elections.maryland.gov', 'mgaleg.maryland.gov', 'ballotpedia.org', 'maryland.gov'])
ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING;

INSERT INTO essentials.discovery_jurisdictions
  (jurisdiction_geoid, jurisdiction_name, state, election_date, source_url, allowed_domains)
VALUES
  ('24', 'State of Maryland', 'MD', '2026-11-03',
   'https://elections.maryland.gov/elections/2026/primary_candidates/index.html',
   ARRAY['elections.maryland.gov', 'mgaleg.maryland.gov', 'ballotpedia.org', 'maryland.gov'])
ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING;
```

**Key differences from ME analog:**
- `jurisdiction_geoid = '24'` (Maryland FIPS)
- `state = 'MD'`
- Primary date: `'2026-06-23'` (verified from SBE)
- 4 allowed_domains vs ME's 3 (adds `maryland.gov`)
- The Landing.jsx JSX edit is co-deployed with this migration but is NOT SQL — it is a separate frontend file edit

**Post-verification block for 281:**
```sql
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM essentials.discovery_jurisdictions
  WHERE state = 'MD';
  IF v_count <> 2 THEN
    RAISE EXCEPTION 'Expected 2 MD discovery_jurisdictions rows, found %', v_count;
  END IF;
END $$;
```

---

### `src/pages/Landing.jsx` (component, request-response)

**Analog:** Same file — `COVERAGE_CITIES` array insertion at line 23

**Current array** (lines 14-24 of Landing.jsx):
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
  { label: 'Portland', state: 'Oregon', browseGovernmentList: ['4159000'], browseStateAbbrev: 'OR' },  // line 23
];
```

**Insertion — add after line 23 (after Portland Oregon entry, before the closing `]`):**
```jsx
  { label: 'Leonardtown', state: 'Maryland', browseGovernmentList: ['2446475', '24037'], browseStateAbbrev: 'MD' },
```

**Pattern notes:**
- `browseGovernmentList` takes an array — two geo_ids bundle both Leonardtown (town council) and St. Mary's County (county commission) into one click
- `browseStateAbbrev` is `'MD'` (uppercase, passed to browse_state URL param)
- No `browseCountyGeoId` needed (used only in COVERAGE_COUNTIES entries like LA County)
- The `handleAreaClick` function at line 79 reads `browseGovernmentList` and builds the URL params — no changes to that function required

---

## Shared Patterns

### Idempotency Guards
**Apply to:** All 4 migrations

| Table | ON CONFLICT clause |
|-------|--------------------|
| `essentials.elections` | `ON CONFLICT (name, election_date, state) DO NOTHING` |
| `essentials.races` | `ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING` — the `WHERE` clause is MANDATORY (partial index, not simple unique) |
| `essentials.discovery_jurisdictions` | `ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING` |

### Election ID Resolution
**Apply to:** 279, 280, 281

Never hardcode UUID literals. Always resolve via subquery:
```sql
SELECT id FROM essentials.elections WHERE name = '2026 Maryland General Election' AND state = 'MD'
```

Or via DO $$ DECLARE pattern (preferred in 280 for legislative races):
```sql
DECLARE
  v_general_id UUID;
BEGIN
  SELECT id INTO v_general_id FROM essentials.elections
  WHERE name = '2026 Maryland General Election' AND state = 'MD';
```

### Post-Verification DO Block
**Apply to:** Every seeding migration (mandatory per established project pattern)

Structure:
```sql
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count FROM [table] WHERE [state condition];
  IF v_count <> [expected] THEN
    RAISE EXCEPTION 'Expected N rows, found %', v_count;
  END IF;
END $$;
```

### UTF-8 No-BOM File Write (PowerShell generator)
**Apply to:** `generate_md_legislative_races.ps1`

PostgreSQL rejects BOM-prefixed SQL files with a syntax error at position 0. Always use:
```powershell
[System.IO.File]::WriteAllLines(
  (Join-Path $PSScriptRoot '280_md_2026_legislative_races.sql'),
  $output,
  [System.Text.UTF8Encoding]::new($false)
)
```

### State Casing for districts.state
**Apply to:** 280 office lookup subqueries

- `d.state = 'md'` for `district_type` IN (`'STATE_UPPER'`, `'STATE_LOWER'`)
- Use hardcoded office_ids for US House (avoids `d.state = 'MD'` / `'NATIONAL_LOWER'` lookup complexity)

---

## No Analog Found

None — all 5 files have strong analogs in the codebase.

---

## Key Deviations to Document in Plans

| Migration | ROADMAP Claim | Actual | Reason |
|-----------|--------------|--------|--------|
| 280 | "141 delegate scaffold rows" | 71 SLDL rows | One-row-per-district (UNIQUE constraint) vs. one-row-per-seat |
| 280 | "198 total race rows" | 130 total | Same reason + accurate statewide count |
| All | "cron_active=true" in MD-ELECTIONS-02 | No such column | discovery_jurisdictions schema has no cron_active; date-based eligibility |
| 278 | CONTEXT.md: July 14 primary | June 23 primary | Verified from elections.maryland.gov |

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/` (SQL files 183, 237, 238, 239 + PS1 generators), `C:/Transparent Motivations/essentials/src/pages/Landing.jsx`
**Files scanned:** 6
**Pattern extraction date:** 2026-06-06
