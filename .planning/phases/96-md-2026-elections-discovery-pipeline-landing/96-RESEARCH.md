# Phase 96: MD 2026 Elections + Discovery Pipeline + Landing - Research

**Researched:** 2026-06-06
**Domain:** SQL migration authoring, election data seeding, discovery pipeline, React UI
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01 — Delegate District Race Structure**
- One race row per DISTRICT (not one per delegate seat). Enforced by `UNIQUE (election_id, position_name, primary_party)`.
- Whole-district multi-member races: `seats=N` (e.g., `seats=3`), one row with `position_name='MD House Delegate District X'`
- Sub-district races (XA, XB, XC): one row per sub-district with `seats=N` matching actual delegate count for that sub-district.
- ROADMAP "198 total" is based on a one-row-per-seat model that conflicts with the unique constraint. Actual count will be fewer. Plan must document deviation.

**D-02 — Bare Primary Pattern**
- All race rows link to GENERAL election only. Primary election row exists but no races reference it (bare primary).

**D-03 — discovery_jurisdictions Schema**
- NO `cron_active` column. Eligibility is date-based (180-day cron window). Follow ME/OR pattern: two rows per `jurisdiction_geoid='24'`, one per election_date (primary + general).

**D-04 — Landing.jsx Entry**
- MD entry goes into `COVERAGE_CITIES` array.
- Exact object: `{ label: 'Leonardtown', state: 'Maryland', browseGovernmentList: ['2446475', '24037'], browseStateAbbrev: 'MD' }`
- Insert after the Portland Oregon entry (currently line 23).

### Claude's Discretion

- **MD primary date:** CONTEXT.md said July 14, 2026. VERIFIED as June 23, 2026. See Critical Finding below.
- **Discovery allowed_domains:** `['elections.maryland.gov', 'mgaleg.maryland.gov', 'ballotpedia.org', 'maryland.gov']`
- **Discovery source_url:** Researcher finds correct 2026 URL. VERIFIED below.
- **Race row total:** Researcher queries sub-district distribution to determine actual count. VERIFIED below — 130 total (not 198).
- **Migration numbering:** Start from 278. VERIFIED: highest existing migration is 277.
- **Van Hollen US Senate race:** One US Senate race row only. Angela Alsobrooks (Class 2) is NOT up in 2026.
- **Election naming:** `'2026 Maryland State Primary'` + `'2026 Maryland General Election'`, `state='MD'`

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MD-ELECTIONS-01 | MD 2026 elections seeded — Governor race + 1 US Senate (Van Hollen) + 8 US House + 47 senate scaffold + 141 house delegate scaffold rows | DB query confirms 71 SLDL geo_ids + 47 SLDU geo_ids; 8 US House office_ids verified; statewide office_ids confirmed in CONTEXT.md |
| MD-ELECTIONS-02 | discovery_jurisdictions row created for MD statewide, cron_active=true, armed for 2026 election cycle | Schema confirmed: no cron_active column; two rows (primary + general) per ME/OR pattern; source_url verified |
| MD-ELECTIONS-03 | Landing.jsx updated with MD entry — Leonardtown city browse + MD state browse | Current COVERAGE_CITIES array structure confirmed at lines 14-24; insertion point after line 23 confirmed |

</phase_requirements>

---

## Summary

Phase 96 seeds Maryland's 2026 election infrastructure via SQL migrations and one JSX edit. The migration work follows established patterns from OR (migrations 237-239) and ME (migration 183). The critical new research finding is that the MD primary date is **June 23, 2026**, not July 14 as suggested in CONTEXT.md — this is a hard correction requiring the planner to use the verified date.

The DB queries confirm the actual race row geometry: 71 SLDL geofence rows (mix of whole-district seats=3 and sub-district seats=1 or 2) + 47 SLDU rows (all seats=1) + 8 US House + 4 statewide = **130 total race rows**. The ROADMAP estimate of 198 is based on a one-row-per-seat model that was superseded by D-01's one-row-per-district constraint. The plan must explicitly document this deviation.

**Primary recommendation:** Generate the MD house legislative races using the same PowerShell generator pattern as OR (`generate_or_legislative_races.ps1`), adapted to use the 71 actual geo_ids from the DB query with their correct `seats=N` values. Split across three migrations (278 elections, 279 statewide races, 280 legislative races) plus a fourth for discovery_jurisdictions + Landing (281).

## Critical Finding: Primary Date Correction

**CONTEXT.md states:** July 14, 2026
**VERIFIED from elections.maryland.gov:** June 23, 2026

[VERIFIED: elections.maryland.gov/elections/2026/index.html] — Official Maryland SBE page explicitly lists "Primary Election Day: June 23, 2026". Early voting runs June 11-18, 2026. This is the date that MUST appear in the `election_date` column of the `essentials.elections` primary row.

The CONTEXT.md date of July 14 is incorrect. Planner must use **2026-06-23**.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Election rows (INSERT) | Database / Supabase | — | Pure data seeding via SQL migration |
| Race rows scaffold | Database / Supabase | — | Generated SQL; one row per district geo_id |
| discovery_jurisdictions rows | Database / Supabase | — | Cron agent reads this table at runtime |
| Landing.jsx COVERAGE_CITIES entry | Frontend (React) | — | Static array in src/pages/Landing.jsx |
| Cron discovery agent | Backend / API | — | Reads discovery_jurisdictions; out of scope for this phase |

## Standard Stack

This phase requires no new npm packages. All work is SQL migrations + one JSX edit.

### Tools Used

| Tool | Version | Purpose |
|------|---------|---------|
| psql / Supabase | Production | Migration execution via `_apply-migration-NNN.ts` scripts |
| PowerShell | 5.1+ | Generator script for legislative race SQL (adapted from OR pattern) |
| React / JSX | Existing | Landing.jsx COVERAGE_CITIES array edit |

## Package Legitimacy Audit

No new packages installed in this phase. N/A.

---

## Architecture Patterns

### System Architecture Diagram

```
elections.maryland.gov  →  [Researcher verifies dates/source_url]
                                    ↓
                    SQL Migrations (278-281)
                    ├── 278: essentials.elections (2 rows: primary + general)
                    ├── 279: essentials.races — statewide (Gov, US Senate, 8x US House, AG, Comptroller)
                    ├── 280: essentials.races — legislative scaffold (47 senate + 71 house = 118 rows)
                    └── 281: essentials.discovery_jurisdictions (2 rows)
                             + src/pages/Landing.jsx (1 line added to COVERAGE_CITIES)
                                    ↓
                    [Runtime] Cron agent reads discovery_jurisdictions
                    within 180-day window before election_date
                              ↓
                    ElectionsView.jsx reads races via elections/me endpoint
```

### Recommended Migration Split

```
278_md_2026_elections.sql           — 2 election rows (primary + general)
279_md_2026_statewide_races.sql     — 12 statewide race rows (Gov + US Senate + 8x US House + AG + Comptroller)
280_md_2026_legislative_races.sql   — 118 legislative race rows (47 senate + 71 house) — generated by PowerShell
281_md_2026_discovery_landing.sql   — 2 discovery_jurisdictions rows
                                      (Landing.jsx edit co-deployed but is a frontend file, not SQL)
```

### Pattern 1: Election Row (Migration 278)

```sql
-- Source: C:/EV-Accounts/backend/migrations/237_or_2026_elections.sql + 183_me_2026_elections_foundation.sql
INSERT INTO essentials.elections (name, election_date, election_type, jurisdiction_level, state)
VALUES ('2026 Maryland State Primary', '2026-06-23', 'primary', 'state', 'MD')
ON CONFLICT (name, election_date, state) DO NOTHING;

INSERT INTO essentials.elections (name, election_date, election_type, jurisdiction_level, state)
VALUES ('2026 Maryland General Election', '2026-11-03', 'general', 'state', 'MD')
ON CONFLICT (name, election_date, state) DO NOTHING;
```

Note: General election is November 3, 2026 (uniform US federal election day). [ASSUMED — standard US federal election date; consistent with OR/ME pattern in existing migrations]

### Pattern 2: Statewide Race Row (Migration 279)

```sql
-- Source: C:/EV-Accounts/backend/migrations/238_or_statewide_races.sql
-- Note: MD uses DO $$ pattern from 183 (not the VALUES set pattern from 238)
-- because we need to RETURNING id for candidate linking
WITH gen_elec AS (
  SELECT id FROM essentials.elections WHERE name = '2026 Maryland General Election' AND state = 'MD'
)
INSERT INTO essentials.races (election_id, office_id, position_name, primary_party, seats)
VALUES (
  (SELECT id FROM gen_elec),
  '1a7ac65d-983a-4c62-85bc-d506ea2755a3',   -- Governor Wes Moore office_id (from CONTEXT.md)
  'Governor of Maryland',
  NULL,
  1
)
ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING;
```

Key: For statewide races with known office_ids (confirmed in CONTEXT.md), use the VALUES pattern from migration 238. No need for RETURNING since these scaffold races have no candidates yet.

### Pattern 3: Legislative Race Row with seats=N (Migration 280)

```sql
-- Source: C:/EV-Accounts/backend/migrations/239_or_legislative_races.sql (adapted)
-- Key difference from OR: seats parameter varies per district (1, 2, or 3)
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
     WHERE d.geo_id = '24010' AND d.district_type = 'STATE_UPPER' AND d.state = 'md'
       AND ch.name = 'Maryland State Senate' LIMIT 1),
    'MD State Senate District 10', NULL, 1)
  ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING;
END $$;
```

For SLDL (House):
```sql
-- Example: sub-district 11A (1 seat), 11B (2 seats)
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
     WHERE d.geo_id = '2411A' AND d.district_type = 'STATE_LOWER' AND d.state = 'md'
       AND ch.name = 'Maryland House of Delegates' LIMIT 1),
    'MD House Delegate Subdistrict 11A', NULL, 1)
  ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING;
END $$;
```

### Pattern 4: discovery_jurisdictions Row (Migration 281)

```sql
-- Source: C:/EV-Accounts/backend/migrations/183_me_2026_elections_foundation.sql
-- No cron_active column — eligibility is date-based (180-day window)
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

### Pattern 5: Landing.jsx Edit

Current COVERAGE_CITIES (lines 14-24):
```jsx
const COVERAGE_CITIES = [
  { label: 'Berkeley', ... },
  { label: 'Fremont', ... },
  { label: 'Sacramento', ... },
  { label: 'San Diego', ... },
  { label: 'San Francisco', ... },
  { label: 'San Jose', ... },
  { label: 'Portland', state: 'Maine', ... },
  { label: 'Cambridge', ... },
  { label: 'Portland', state: 'Oregon', ... },   // line 23 — INSERT AFTER HERE
];
```

Add after line 23:
```jsx
  { label: 'Leonardtown', state: 'Maryland', browseGovernmentList: ['2446475', '24037'], browseStateAbbrev: 'MD' },
```

### Post-verification DO Block (mandatory in seeding migrations)

Every seeding migration must include a post-verification block that counts inserted rows and raises an error if counts don't match expected:

```sql
DO $$
DECLARE
  v_election_count INT;
  v_race_count INT;
BEGIN
  SELECT COUNT(*) INTO v_election_count
    FROM essentials.elections WHERE state = 'MD' AND election_date IN ('2026-06-23', '2026-11-03');
  IF v_election_count < 2 THEN
    RAISE EXCEPTION 'Expected 2 MD election rows, found %', v_election_count;
  END IF;
END $$;
```

### Anti-Patterns to Avoid

- **Hardcoding election UUIDs:** Never embed UUID literals for election_id. Always use subquery: `SELECT id FROM essentials.elections WHERE name = '...' AND state = 'MD'`
- **Omitting the WHERE clause on ON CONFLICT:** `ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING` — the `WHERE primary_party IS NULL` is mandatory; it's a partial index, not a simple unique constraint
- **Using `state='MD'` for SLDU/SLDL lookups:** districts.state is `'md'` (lowercase) for STATE_UPPER and STATE_LOWER; `'MD'` (uppercase) for NATIONAL_LOWER/NATIONAL_UPPER. Confirmed per D-07 in STATE.md.
- **Including LG in race rows:** LG Aruna Miller runs on the same ticket as Governor; no separate LG race row
- **Including State Treasurer:** is_appointed_position=true — no race row
- **Including Angela Alsobrooks in US Senate race:** She is Class 2, elected 2024, NOT up in 2026. Only Van Hollen (Class 3) gets a race row.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 71 SLDL race INSERT statements | Write by hand | PowerShell generator (adapt `generate_or_legislative_races.ps1`) | Error-prone at scale; generator already proven for OR/ME |
| Election UUID resolution | Hardcode UUIDs | Subquery `SELECT id FROM essentials.elections WHERE name=... AND state=...` | UUIDs differ per environment; idempotency requires name+state lookup |
| Post-migration idempotency | Try-catch logic | `ON CONFLICT ... DO NOTHING` | Standard pattern; safe to re-run |

---

## Verified Data

### SLDL Sub-district Distribution (from live DB query)

**Whole-district geofences (seats=3):** 29 districts
Districts: 3, 4, 5, 6, 8, 10, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 28, 31, 32, 36, 39, 40, 41, 45, 46

**Sub-district geofences (variable seats):**

| geo_id | label | seats |
|--------|-------|-------|
| 2401A | Subdistrict 1A | 1 |
| 2401B | Subdistrict 1B | 1 |
| 2401C | Subdistrict 1C | 1 |
| 2402A | Subdistrict 2A | 2 |
| 2402B | Subdistrict 2B | 1 |
| 2407A | Subdistrict 7A | 2 |
| 2407B | Subdistrict 7B | 1 |
| 2409A | Subdistrict 9A | 2 |
| 2409B | Subdistrict 9B | 1 |
| 2411A | Subdistrict 11A | 1 |
| 2411B | Subdistrict 11B | 2 |
| 2412A | Subdistrict 12A | 2 |
| 2412B | Subdistrict 12B | 1 |
| 2427A | Subdistrict 27A | 1 |
| 2427B | Subdistrict 27B | 1 |
| 2427C | Subdistrict 27C | 1 |
| 2429A | Subdistrict 29A | 1 |
| 2429B | Subdistrict 29B | 1 |
| 2429C | Subdistrict 29C | 1 |
| 2430A | Subdistrict 30A | 2 |
| 2430B | Subdistrict 30B | 1 |
| 2433A | Subdistrict 33A | 1 |
| 2433B | Subdistrict 33B | 1 |
| 2433C | Subdistrict 33C | 1 |
| 2434A | Subdistrict 34A | 2 |
| 2434B | Subdistrict 34B | 1 |
| 2435A | Subdistrict 35A | 2 |
| 2435B | Subdistrict 35B | 1 |
| 2437A | Subdistrict 37A | 1 |
| 2437B | Subdistrict 37B | 2 |
| 2438A | Subdistrict 38A | 1 |
| 2438B | Subdistrict 38B | 1 |
| 2438C | Subdistrict 38C | 1 |
| 2442A | Subdistrict 42A | 1 |
| 2442B | Subdistrict 42B | 1 |
| 2442C | Subdistrict 42C | 1 |
| 2443A | Subdistrict 43A | 2 |
| 2443B | Subdistrict 43B | 1 |
| 2444A | Subdistrict 44A | 1 |
| 2444B | Subdistrict 44B | 2 |
| 2447A | Subdistrict 47A | 2 |
| 2447B | Subdistrict 47B | 1 |

Total sub-district rows: 42
Total whole-district rows: 29
**Total SLDL rows: 71** [VERIFIED: live DB query]

### SLDU Distribution (from live DB query)

47 districts, all seats=1, geo_ids 24001–24047 (sequential, no sub-districts). [VERIFIED: live DB query]

### Actual Race Row Count

| Category | Count |
|----------|-------|
| MD State Senate scaffold (SLDU) | 47 |
| MD House Delegate scaffold (SLDL) | 71 |
| Governor of Maryland | 1 |
| US Senate Maryland (Van Hollen) | 1 |
| US House MD-01 through MD-08 | 8 |
| AG Anthony Brown | 1 |
| Comptroller Brooke Lierman | 1 |
| **Total** | **130** |

**ROADMAP deviation:** ROADMAP says "198 total race rows" and "141 delegate scaffold rows". The actual count is 130 races total. This is because:
1. ROADMAP assumed one-row-per-seat (141 individual delegate seats) vs. one-row-per-district (71 SLDL geofences)
2. The unique constraint `UNIQUE (election_id, position_name, primary_party)` enforces the district-level model

Planner MUST document this deviation from ROADMAP in the plan notes.

### US House Office IDs (from live DB query)

| office_id | geo_id | district |
|-----------|--------|---------|
| 44eb9e42-ae4f-46b0-87dc-a4c8518330d2 | 2401 | Congressional District 1 |
| ff4f5b35-a627-42e3-82cd-d4e287cca040 | 2402 | Congressional District 2 |
| fcb4bb30-cfa4-473e-816a-d67df9c17e91 | 2403 | Congressional District 3 |
| 365904b7-b72c-4db4-8312-d4c4534a0abb | 2404 | Congressional District 4 |
| cabd5f12-6aa6-4742-96da-159660141c89 | 2405 | Congressional District 5 |
| 58e6825b-aa32-4532-8952-b8c94d83c371 | 2406 | Congressional District 6 |
| 7d1685dd-f832-4bf7-8f60-b8ee40152049 | 2407 | Congressional District 7 |
| 21839e79-ac55-4733-b517-db000431a9c1 | 2408 | Congressional District 8 |

[VERIFIED: live DB query against production Supabase]

### Statewide Office IDs (from CONTEXT.md, canonical_refs)

| Official | office_id | Race Row? |
|---------|-----------|-----------|
| Governor Wes Moore | 1a7ac65d-983a-4c62-85bc-d506ea2755a3 | YES |
| LG Aruna Miller | 7e15c4f7-6e58-4d04-a755-46430258f0bd | NO (same ticket as Gov) |
| AG Anthony Brown | 6f9fd58a-442c-4c58-bd6d-f36a1bcbf114 | YES |
| Comptroller Brooke Lierman | 816a9ad0-f2ac-48b3-918a-aa75aa2f9efd | YES |
| US Senate Chris Van Hollen | 59092640-43df-4dea-bac3-441690c76ad9 | YES |

### Migration Numbering (from `ls` of migrations dir)

Highest existing: `277_leonardtown_government.sql`
Next available: **278** [VERIFIED: ls C:/EV-Accounts/backend/migrations/]

### Discovery Source URL

[VERIFIED: elections.maryland.gov] — Candidate filing page confirmed at:
`https://elections.maryland.gov/elections/2026/primary_candidates/index.html`

This page contains "2026 Gubernatorial Primary Candidate Listings" with links to statewide and local candidate lists. Use this as `source_url` for both discovery_jurisdictions rows.

---

## Common Pitfalls

### Pitfall 1: Wrong Primary Date
**What goes wrong:** Using July 14, 2026 (from CONTEXT.md) instead of June 23, 2026 (verified from SBE)
**Why it happens:** CONTEXT.md estimate was incorrect before verification
**How to avoid:** Use `'2026-06-23'` in all election rows and discovery_jurisdictions rows
**Warning signs:** If a reviewer asks "why July 14?" — it's wrong

### Pitfall 2: Wrong districts.state Casing for Office Lookup
**What goes wrong:** Using `d.state = 'MD'` in office lookup JOINs for SLDU/SLDL districts
**Why it happens:** NATIONAL_LOWER uses uppercase 'MD'; STATE_LOWER/STATE_UPPER use lowercase 'md'
**How to avoid:** 
- For senate: `WHERE d.state = 'md' AND d.district_type = 'STATE_UPPER'`
- For house: `WHERE d.state = 'md' AND d.district_type = 'STATE_LOWER'`
- For US House: use hardcoded office_ids (already queried) to avoid ambiguity
**Warning signs:** Subquery returns NULL; race row gets `office_id = NULL`

### Pitfall 3: Omitting WHERE Clause from ON CONFLICT
**What goes wrong:** `ON CONFLICT (election_id, position_name) DO NOTHING` fails with syntax error (partial index requires the WHERE clause)
**Why it happens:** Confusing partial unique index with regular unique constraint
**How to avoid:** Always write `ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING`
**Warning signs:** PostgreSQL error "there is no unique or exclusion constraint matching the ON CONFLICT specification"

### Pitfall 4: district 42A is_vacant placeholder
**What goes wrong:** District 42A in the DB has is_vacant=true (placeholder seeded after 2026-06-05 vacancy). The office lookup subquery will return the vacant office id — this is correct for a race row (the seat is being contested).
**Why it happens:** Vacancy occurred mid-seeding of delegate offices
**How to avoid:** No special handling needed; vacant offices still get race rows

### Pitfall 5: Generator Script geo_id Pattern Differs from OR
**What goes wrong:** OR geo_ids follow a simple sequential pattern (`41001`-`41030`). MD geo_ids do NOT — they use `24001`-`24047` for SLDU and a mix of `24010`/`2411A`/`2411B` for SLDL (no sequential ID pattern).
**Why it happens:** MD has sub-district geofences; OR does not
**How to avoid:** The MD generator script cannot use a simple `for ($n=1; $n -le 71; $n++)` loop. It needs the geo_id and seats hardcoded from the DB query results. Use the SLDL table above as the generator's data source.
**Warning signs:** Generator produces wrong geo_ids or wrong district labels

---

## Code Examples

### Generator Script Structure for MD House (adapted from OR pattern)

```powershell
# generate_md_legislative_races.ps1
# Produces 280_md_2026_legislative_races.sql
# 47 Senate districts (seats=1) + 71 House districts (variable seats) = 118 rows

# SLDU data — geo_ids 24001..24047, all seats=1
$senateDistricts = @(
  @{ geo_id='24001'; num=1;  seats=1 },
  @{ geo_id='24002'; num=2;  seats=1 },
  # ... through 24047
)

# SLDL data — mixed geo_ids, variable seats (from DB query)
$houseDistricts = @(
  # Whole-district rows (seats=3):
  @{ geo_id='24003'; label='District 3';        seats=3 },
  @{ geo_id='24004'; label='District 4';        seats=3 },
  # ...
  # Sub-district rows (variable):
  @{ geo_id='2401A'; label='Subdistrict 1A';    seats=1 },
  @{ geo_id='2401B'; label='Subdistrict 1B';    seats=1 },
  @{ geo_id='2401C'; label='Subdistrict 1C';    seats=1 },
  @{ geo_id='2402A'; label='Subdistrict 2A';    seats=2 },
  # ...
)

foreach ($d in $senateDistricts) {
  # Emit DO $$ block with district_type='STATE_UPPER', state='md', ch.name='Maryland State Senate', seats=$d.seats
}

foreach ($d in $houseDistricts) {
  # Emit DO $$ block with district_type='STATE_LOWER', state='md', ch.name='Maryland House of Delegates', seats=$d.seats
}
```

### Statewide Races — VALUES pattern (migration 279)

For statewide offices where office_ids are known, use the VALUES pattern from migration 238 (simpler than DO $$ when no RETURNING needed):

```sql
-- Source: pattern from 238_or_statewide_races.sql adapted with static office_ids
WITH gen_elec AS (
  SELECT id FROM essentials.elections
  WHERE name = '2026 Maryland General Election' AND state = 'MD'
)
INSERT INTO essentials.races (election_id, office_id, position_name, primary_party, seats)
SELECT gen_elec.id, t.office_id_val::uuid, t.position_name_val, NULL, 1
FROM gen_elec, (VALUES
  ('1a7ac65d-983a-4c62-85bc-d506ea2755a3', 'Governor of Maryland'),
  ('6f9fd58a-442c-4c58-bd6d-f36a1bcbf114', 'Attorney General of Maryland'),
  ('816a9ad0-f2ac-48b3-918a-aa75aa2f9efd', 'Comptroller of Maryland'),
  ('59092640-43df-4dea-bac3-441690c76ad9', 'U.S. Senate Maryland'),
  -- 8 US House:
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

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| One race row per seat (141 delegate rows) | One race row per district (71 rows) with `seats=N` | UNIQUE constraint enforces; ROADMAP count obsolete |
| `cron_active=true` column | Date-based eligibility (180-day window) | No column to set; just insert the row |

**Deprecated:**
- "cron_active=true" wording in REQUIREMENTS.md (MD-ELECTIONS-02): this is stale language. No such column exists. The REQUIREMENTS.md text should be ignored as written; the correct behavior is date-based.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | General election date is 2026-11-03 (consistent with OR/ME existing migrations) | Architecture Patterns / election row example | If MD has a different general date, election rows would be wrong — but Nov 3 is the standard US federal election day 2026 and matches all other state patterns |
| A2 | AG and Comptroller terms expire 2026 (both elected 2022, 4-year terms) | Standard Stack / statewide races | If either term is actually 6 years or offset differently, those race rows would be wrong |
| A3 | SLDU geo_ids are 24001-24047 sequential (all seats=1) | Verified Data section | DB query confirmed all 47 rows with seat_count=1 — LOW risk |

---

## Open Questions (RESOLVED)

1. **Position name format for SLDL multi-member races** — RESOLVED
   - What we know: OR uses `'OR State House District N'`; MD CONTEXT.md says `'MD House Delegate District X'`
   - What's unclear: For sub-districts, should it be `'MD House Delegate Subdistrict 11A'` or `'MD House Delegate District 11A'`?
   - Recommendation: Use `'MD House Delegate Subdistrict NNA'` for sub-districts (matches the DB `label` field pattern "State Legislative Subdistrict 11A") and `'MD House Delegate District N'` for whole-district rows. Planner should confirm position_name convention matches what the discovery agent and ElectionsView expect.
   - **Resolution:** Plans 96-02 use `'MD House Delegate Subdistrict NNA'` for sub-districts and `'MD House Delegate District N'` for whole-district rows.

2. **Position name for SLDU — senator vs. senate** — RESOLVED
   - What we know: OR uses `'OR State Senate District N'`
   - Recommendation: Use `'MD State Senate District N'` for consistency with OR pattern.
   - **Resolution:** Plans 96-02 use `'MD State Senate District N'` matching the OR pattern.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| psql / PostgreSQL client | Migration execution | ✓ | confirmed (used in research) | — |
| PowerShell | Generator script | ✓ | 5.1+ (Windows) | Write SQL by hand |
| Supabase production DB | All migrations | ✓ | via `_apply-migration-NNN.ts` pattern | — |

---

## Validation Architecture

No automated test framework applies to SQL migrations. Verification is:
1. Post-migration DO block in each SQL file (raises EXCEPTION if counts wrong)
2. Manual verification queries after each migration apply

**Per-migration verification queries:**

```sql
-- After 278: verify election rows
SELECT name, election_date, state FROM essentials.elections WHERE state = 'MD';
-- Expected: 2 rows

-- After 279: verify statewide races
SELECT position_name, seats FROM essentials.races r
JOIN essentials.elections e ON e.id = r.election_id
WHERE e.state = 'MD' ORDER BY position_name;
-- Expected: 12 rows (Gov, US Senate, 8x US House, AG, Comptroller)

-- After 280: verify legislative races
SELECT COUNT(*) FROM essentials.races r
JOIN essentials.elections e ON e.id = r.election_id
WHERE e.state = 'MD';
-- Expected: 130 rows (12 statewide + 47 senate + 71 house)

-- After 281: verify discovery rows
SELECT jurisdiction_geoid, election_date FROM essentials.discovery_jurisdictions
WHERE state = 'MD';
-- Expected: 2 rows

-- Section-split check (run after every seeding phase)
SELECT g.geo_id, g.display_name, g.tier
FROM essentials.governments g
WHERE g.geo_id IN ('2446475', '24037')
AND NOT EXISTS (
  SELECT 1 FROM essentials.government_bodies gb WHERE gb.government_id = g.id
);
-- Expected: 0 rows (St. Mary's County and Leonardtown already have government_bodies from Phase 95)
```

---

## Security Domain

No new authentication, session management, or access control surface in this phase. All work is SQL INSERT migrations run by admin. Input validation is N/A for pre-seeded static data. No security concerns specific to this phase.

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: elections.maryland.gov/elections/2026/index.html] — MD 2026 primary date (June 23, 2026)
- [VERIFIED: elections.maryland.gov/elections/2026/primary_candidates/index.html] — source_url for discovery_jurisdictions
- [VERIFIED: live DB query against production Supabase] — SLDL 71 geo_ids with seat counts, SLDU 47 geo_ids, US House 8 office_ids
- [VERIFIED: ls C:/EV-Accounts/backend/migrations/] — highest migration is 277; next available is 278
- [VERIFIED: C:/EV-Accounts/backend/migrations/237_or_2026_elections.sql] — election row pattern
- [VERIFIED: C:/EV-Accounts/backend/migrations/238_or_statewide_races.sql] — statewide race VALUES pattern
- [VERIFIED: C:/EV-Accounts/backend/migrations/239_or_legislative_races.sql] — DO $$ legislative scaffold pattern
- [VERIFIED: C:/EV-Accounts/backend/migrations/183_me_2026_elections_foundation.sql] — discovery_jurisdictions pattern, no cron_active column
- [VERIFIED: C:/EV-Accounts/backend/migrations/generate_or_legislative_races.ps1] — PowerShell generator pattern
- [VERIFIED: src/pages/Landing.jsx lines 1-24] — COVERAGE_CITIES current structure, insertion point after line 23

### Secondary (MEDIUM confidence)
- CONTEXT.md canonical_refs section — statewide office_ids for Gov, AG, Comptroller, Van Hollen

### Tertiary (LOW confidence)
- [ASSUMED] General election date 2026-11-03 (standard US federal election day; consistent with OR/ME migrations)
- [ASSUMED] AG and Comptroller seats both up in 2026 (4-year terms, elected 2022)

---

## Metadata

**Confidence breakdown:**
- Primary date: HIGH — directly verified from official MD SBE website
- Migration numbering: HIGH — confirmed via directory listing
- DB district geometry: HIGH — live production query
- US House office_ids: HIGH — live production query
- Source URL: HIGH — verified page exists at correct URL
- General election date: ASSUMED (LOW) — consistent with all prior state patterns

**Research date:** 2026-06-06
**Valid until:** 2026-09-01 (primary has passed by then; general election data still valid through November)
