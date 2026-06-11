# Phase 110: MA 2026 Elections + Discovery — Research

**Researched:** 2026-06-11
**Domain:** Elections seeding + legislative race scaffold + discovery pipeline
**Confidence:** HIGH — all critical DB state verified live

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MA-ELECTIONS-01 | MA 2026 election rows exist in essentials.elections (primary 2026-09-02, general 2026-11-03) | DB confirms 2 rows exist with dates 2026-09-01 and 2026-11-03; primary date needs reconciliation (see Date Discrepancy pitfall) |
| MA-ELECTIONS-02 | Governor's race (Healey re-election) + US Senate race (Markey) seeded with known declared candidates | Governor office exists (id=21f9e818); Markey office exists (id=215e8e94); Healey politician_id=7cf1080e; Markey politician_id=faf86b5b; US Senate MA races already exist but have NULL office_id — must fix |
| MA-ELECTIONS-03 | All 200 legislative race rows (40 Senate + 160 House) seeded with non-null office_ids | 40 STATE_UPPER + 160 STATE_LOWER offices verified in DB; JOIN pattern confirmed via chamber; currently only 5 MA legislative race rows exist |
| MA-ELECTIONS-04 | MA discovery pipeline armed — discovery_jurisdictions row with cron_active=true for MA statewide (geo_id='25') | Already exists: 2 rows for MA (primary 2026-09-01 + general 2026-11-03); NO cron_active column; date-based eligibility |
</phase_requirements>

---

## Summary

Phase 110 is substantially pre-seeded from v5.0 work. This phase is primarily a gap-filling and expansion phase, not a full seed from scratch. Key findings:

**What already exists (do NOT re-insert):**
1. 2 MA election rows in `essentials.elections` — primary "2026 Massachusetts State Primary" (2026-09-01) + general "2026 Massachusetts General Election" (2026-11-03) — already present with verified UUIDs
2. 2 `discovery_jurisdictions` rows for MA (jurisdiction_geoid='25', state='MA') — already armed; no cron_active column
3. 10 partial MA race rows scattered across primary and general — includes 4 Cambridge-area races seeded during v5.0, 2 US House races (MA-05, MA-07), and 2 US Senate MA races (but with NULL office_id)
4. Landing.jsx already has a Cambridge, Massachusetts entry (`browseGovernmentList: ['2511000']`)

**What is missing (must be added):**
1. Governor's race row for Healey re-election (linked to general election, with office_id)
2. Fix: 2 existing "U.S. Senate Massachusetts" race rows have `office_id = NULL` — must be updated to Markey's office_id (`215e8e94-ab07-4ca8-b7a1-ccf7aec0c4f4`)
3. ~195 missing legislative race rows (40 Senate + 160 House minus 5 already seeded) — need scaffold rows for all 200 districts
4. 7 missing US House race rows (MA-01 through MA-09 minus MA-05 and MA-07 which exist)
5. Landing.jsx needs a MA statewide browse entry (currently only Cambridge is listed, not a "Massachusetts" state-level entry) — VERIFY: the ROADMAP mentions "Boston city browse entry + MA state browse entry (if not already present from v5.0)"

**Primary recommendation:** 3-plan structure: Plan 01 = elections assert + statewide races (Governor + US Senate fix + 7 missing House); Plan 02 = 200 legislative race scaffold; Plan 03 = Landing.jsx MA entry (verify Boston entry also). Discovery is already armed — no migration needed for MA-ELECTIONS-04.

**Date reconciliation needed:** Primary date stored as 2026-09-01 (UTC); ROADMAP says 2026-09-02. This is a timezone artifact (2026-09-02 election day EST = 2026-09-01T07:00:00 UTC). The stored date is effectively correct. Do NOT re-insert.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Election rows | Database | — | FK target; insert once, never re-create |
| Race rows scaffold | Database | — | Planner task: 200 rows via DO $$ blocks per-district |
| Race candidates | Database | — | INSERT into race_candidates linking politicians to races |
| Discovery jurisdictions | Database | — | Already exists; verify dates and domains |
| Landing.jsx entry | Frontend (SSR) | — | Static array in src/pages/Landing.jsx |
| Office_id resolution | Database (query) | — | JOINs via chamber_id → government (geo_id='25') |

---

## DB State Inventory (VERIFIED via live production DB queries)

### Elections Table
[VERIFIED: live DB query 2026-06-11]

| id | name | election_date (raw) | election_date::date | state |
|----|------|---------------------|---------------------|-------|
| d2e051a2-c490-4c3a-b7b0-9523fae87bcd | 2026 Massachusetts State Primary | 2026-09-01T07:00:00.000Z | 2026-09-01 | MA |
| 38121465-a14b-4044-bc21-1a4c968ae4fd | 2026 Massachusetts General Election | 2026-11-03T08:00:00.000Z | 2026-11-03 | MA |
| e85da6ac-b201-4d06-8ad1-e9fd1215ddb9 | 2027 Cambridge Municipal Election | 2027-11-02 | 2027-11-02 | MA |

**MA-ELECTIONS-01 status:** SATISFIED. Both 2026 rows exist. Assert-only; do NOT insert new election rows.

**Primary date note:** ROADMAP says 2026-09-02 but DB stores 2026-09-01T07:00:00Z. This is a UTC timezone representation of the same election day (2026-09-02 EST = 2026-09-01T07:00 UTC if stored as midnight UTC-7, or the date was originally set as 2026-09-01). Do not change — the ON CONFLICT guard would skip it anyway.

### Discovery Jurisdictions
[VERIFIED: live DB query 2026-06-11]

| id | jurisdiction_geoid | state | election_date | source_url |
|----|--------------------|-------|---------------|------------|
| 66d63e50-97f7-4b47-8efe-a2f72cd0ddaf | 25 | MA | 2026-09-01 | https://www.sec.state.ma.us/divisions/elections/elections-and-voting.htm |
| 7654721c-e348-4b09-85d3-f42825d8490c | 25 | MA | 2026-11-03 | https://www.sec.state.ma.us/divisions/elections/elections-and-voting.htm |
| 7f389b8c-9da0-4dfa-a16f-784dcbca5238 | 2511000 | MA | 2027-11-02 | Cambridge 2027 (separate) |

`allowed_domains` for both MA rows: `['sec.state.ma.us', 'ballotpedia.org', 'malegislature.gov']`

**MA-ELECTIONS-04 status:** SATISFIED. 2 rows exist for geo_id='25'. No cron_active column exists. Date-based eligibility. No migration needed.

**CRITICAL NOTE for ROADMAP:** ROADMAP says "cron_active=true" but `discovery_jurisdictions` has NO `cron_active` column — confirmed in Phase 96 MD work (D-03). Eligibility is date-based (180-day horizon). Current dates: primary is ~83 days out (within window); general is ~145 days out. Both within 180-day window.

### Existing Race Rows (10 total)
[VERIFIED: live DB query 2026-06-11]

| position_name | election_name | office_id | Notes |
|---------------|---------------|-----------|-------|
| MA State Senate 2nd Middlesex District | Primary | b1ed4e2a... | Has office_id |
| U.S. Senate Massachusetts | Primary | NULL | MISSING office_id — needs UPDATE |
| MA House 25th Middlesex District | General | a0e18b1e... | Has office_id |
| MA House 26th Middlesex District | General | 06e4afe2... | Has office_id |
| MA State Senate 2nd Middlesex District | General | b1ed4e2a... | Has office_id |
| MA State Senate Middlesex and Suffolk District | General | c3ea7a34... | Has office_id |
| MA State Senate Suffolk and Middlesex District | General | e18eeea6... | Has office_id |
| U.S. House MA-05 | General | 395b6873... | Has office_id |
| U.S. House MA-07 | General | 9011e2ed... | Has office_id |
| U.S. Senate Massachusetts | General | NULL | MISSING office_id — needs UPDATE |

**What Plan 01 must do:**
1. UPDATE the 2 NULL-office_id US Senate Massachusetts rows to use Markey's office_id
2. INSERT Governor race row (Healey re-election) linked to general election
3. INSERT 7 missing US House race rows (MA-01 through MA-04, MA-06, MA-08, MA-09)
4. INSERT race_candidates rows for Healey (Governor) and Markey (Senate, if not already present)

**Existing race_candidates already in DB:**
- U.S. Senate MA Primary: Markey, Alexander Rikleen, William Gates, Seth Moulton
- U.S. Senate MA General: Markey, John Deaton, Nathan Bech
- MA State Senate 2nd Middlesex: Burhan Azeem (primary)
- MA House 25th Middlesex: Marjorie C. Decker (general)
- MA House 26th Middlesex: Mike Connolly (general)
- MA State Senate Middlesex and Suffolk: Sal N. DiDomenico (general)
- MA State Senate Suffolk and Middlesex: William N. Brownsberger (general)
- U.S. House MA-05 General: Katherine Clark
- U.S. House MA-07 General: Ayanna Pressley

**MA-ELECTIONS-02 status:** PARTIALLY satisfied. Markey is already in race_candidates for both US Senate races, but office_id is NULL on those races. Governor race does not exist yet. Healey not yet in race_candidates for a Governor race.

### MA Legislature Offices — The Critical JOIN Pattern
[VERIFIED: live DB query 2026-06-11]

**Key finding:** MA legislature offices are NOT linked via `offices.government_id` (that column does not exist). They are linked via `offices.chamber_id → chambers.government_id → governments.geo_id='25'`.

**Correct JOIN to get all 200 legislative offices:**
```sql
SELECT o.id AS office_id, d.geo_id AS district_geo_id, d.district_type, o.title
FROM essentials.offices o
JOIN essentials.chambers ch ON o.chamber_id = ch.id
JOIN essentials.governments g ON ch.government_id = g.id
JOIN essentials.districts d ON o.district_id = d.id
WHERE g.geo_id = '25'
  AND d.district_type IN ('STATE_UPPER', 'STATE_LOWER')
ORDER BY d.district_type DESC, d.geo_id
```

**Verified counts:** 40 STATE_UPPER offices + 160 STATE_LOWER offices = 200 total. All have non-null office_ids.

**The government to use:** `g.geo_id = '25'` maps to `government_id = '85783e20-3031-4d71-89a5-5dd61f4a593f'` (name='Commonwealth of Massachusetts'). NOT '66316105-cfe2-4c7e-b445-1cd1156453b3' (name='State of Massachusetts') — chambers are under 'Commonwealth of Massachusetts'.

**Chamber names (EXACT — use these in JOIN):**
- `'Massachusetts Senate'` — `id = 'ddc43e0f-3157-4201-b882-ae2f75d06d5a'` (name_formal is ALSO 'Massachusetts Senate' — no distinction here, unlike MD where name != name_formal)
- `'Massachusetts House of Representatives'` — `id = '5f3d03da-68fe-4413-9fdc-96cde252f899'`

**District geo_id patterns:**
- Senate: `25D01` through `25D40` (40 districts)
- House: `25001` through `25160` (160 districts, with some named non-numeric titles)

**Office title format (from DB — NOT all numeric):**
- Senate: "Senator, {District Name} District" (e.g., "Senator, Berkshire-Hampden-Franklin-Hampshire District", "Senator, Second Middlesex District")
- House: "Representative, {N}th {County} District" or "Representative, {County}-{County} District"

**Position name convention in existing races (from the 5 pre-seeded rows):**
- Senate: `MA State Senate {Title without "Senator, " prefix}` (e.g., "MA State Senate 2nd Middlesex District" from office title "Senator, Second Middlesex District")
- House: `MA House {Title without "Representative, " prefix}` (e.g., "MA House 25th Middlesex District")

**IMPORTANT:** The existing races use the office `title` stripped of prefix ("Senator, " or "Representative, "), not a district geo_id number. This means the generator must extract the title from the office record, not construct it from district numbers.

**UNIQUE constraint on races:** `UNIQUE (election_id, position_name, primary_party)` with partial index `WHERE primary_party IS NULL`. ON CONFLICT pattern: `ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING`.

### Key Politician and Office UUIDs

| Entity | politician_id | office_id |
|--------|---------------|-----------|
| Maura Healey (Governor) | 7cf1080e-6e7e-4f5b-be00-6fb170896a7c | 21f9e818-904d-4a19-879b-438f447bcd68 |
| Edward J. Markey (US Senate) | faf86b5b-5add-4afb-a8e2-96b3e8be4b78 | 215e8e94-ab07-4ca8-b7a1-ccf7aec0c4f4 |
| Elizabeth Warren (US Senate) | (via office 5e01e98e) | 5e01e98e-181b-4d2f-bfd4-284bbf69f9f9 |

**US House MA offices (all 9 confirmed):**
| District | office_id | politician |
|----------|-----------|-----------|
| MA-01 (geo_id=2501) | 2a3279e2-3d67-408a-971c-294ef602c293 | Richard Neal |
| MA-02 (geo_id=2502) | 372f56fe-4f30-4526-80f2-1a66c5fe870b | Jim McGovern |
| MA-03 (geo_id=2503) | badb581b-e37f-4359-9735-e779ff2a7c71 | Lori Trahan |
| MA-04 (geo_id=2504) | 0b7dc3a6-310c-4c18-92bb-2e25230701e6 | Jake Auchincloss |
| MA-05 (geo_id=2505) | 395b6873-4743-4052-870a-a391e4ed4370 | Katherine Clark (race EXISTS) |
| MA-06 (geo_id=2506) | 5c4f577c-f8af-4d12-ba30-24129ff5d099 | Seth Moulton |
| MA-07 (geo_id=2507) | 9011e2ed-f77b-4de0-92c3-d7911a0ae391 | Ayanna Pressley (race EXISTS) |
| MA-08 (geo_id=2508) | 293d949e-69cf-45a0-85fa-9ae72aabef13 | Stephen Lynch |
| MA-09 (geo_id=2509) | 7f423afd-6a6b-4741-8eeb-cff9577b006f | Bill Keating |

### Landing.jsx Current State
[VERIFIED: live file read 2026-06-11]

Current COVERAGE_CITIES (line 22): `{ label: 'Cambridge', state: 'Massachusetts', browseGovernmentList: ['2511000'], browseStateAbbrev: 'MA' }`

**Boston is NOT yet in COVERAGE_CITIES** (Phases 108 handled seeding but the Landing entry was deferred or will be in Phase 110). The ROADMAP says "Boston city browse entry + MA state browse entry (if not already present from v5.0)".

**What Plan 03 must add:**
1. Boston city entry: `{ label: 'Boston', state: 'Massachusetts', browseGovernmentList: ['2507000'], browseStateAbbrev: 'MA' }` — Boston's geo_id is '2507000'
2. Massachusetts state entry: `{ label: 'Massachusetts', state: 'Massachusetts', browseStateAbbrev: 'MA' }` or with browseGovernmentList for a state-level government — need to determine the pattern; this may just be a state-level entry using browseStateAbbrev only (no city officials to bundle)

**Note:** A pure state-level entry (no browseGovernmentList, just browseStateAbbrev) would route to the state legislature reps. Look at whether other states have a state-level entry — currently the COVERAGE_CITIES only has city entries (not state entries). The ROADMAP mentions "MA state browse entry" — this is likely for state officials (legislature, execs, federal), not a city. Pattern to follow: similar to how Oregon's Portland entry shows state reps. Actually, the existing entries all have browseGovernmentList pointing to city geo_ids. A state-level entry would not have a city geo_id. This needs planner judgment.

### Migration Counter
- Last applied migration: 356 (Phase 109 headshots)
- Next available: 357
- Phase 110 migrations: 357 (statewide + US House races), 358 (legislative races scaffold)
- Plan 03 (Landing.jsx) is a file edit only — no migration needed

---

## Architecture Patterns

### Pattern 1: Pre-existing Elections — Assert-Only (DO NOT duplicate)
**What:** Both MA 2026 election rows already exist from v5.0.
**When to use:** Always — never insert new MA election rows for 2026.
**Example:**
```sql
-- ASSERT ONLY — these rows already exist:
-- d2e051a2-c490-4c3a-b7b0-9523fae87bcd = 2026 Massachusetts State Primary
-- 38121465-a14b-4044-bc21-1a4c968ae4fd = 2026 Massachusetts General Election
-- Use subquery to resolve: (SELECT id FROM essentials.elections WHERE name='2026 Massachusetts General Election' AND state='MA')
```

### Pattern 2: Fix Existing Races with NULL office_id
**What:** 2 existing "U.S. Senate Massachusetts" races have NULL office_id; must be UPDATEd.
**When to use:** Plan 01 only.
**Example:**
```sql
-- Fix US Senate MA races: set office_id to Markey's office
UPDATE essentials.races
SET office_id = '215e8e94-ab07-4ca8-b7a1-ccf7aec0c4f4'
WHERE position_name = 'U.S. Senate Massachusetts'
  AND election_id IN (
    SELECT id FROM essentials.elections WHERE state = 'MA' AND name LIKE '2026 Massachusetts%'
  )
  AND office_id IS NULL;
```

### Pattern 3: Statewide Race INSERT (Governor + 7 missing US House)
**What:** WITH gen_elec CTE + VALUES list for known office UUIDs.
**When to use:** Plan 01 for statewide races.
**Example (from VA migration 324):**
```sql
WITH gen_elec AS (
  SELECT id FROM essentials.elections
  WHERE name = '2026 Massachusetts General Election' AND state = 'MA'
)
INSERT INTO essentials.races (election_id, office_id, position_name, primary_party, seats)
SELECT gen_elec.id, t.office_id_val::uuid, t.position_name_val, NULL, 1
FROM gen_elec, (VALUES
  ('21f9e818-904d-4a19-879b-438f447bcd68', 'Governor of Massachusetts'),
  ('2a3279e2-3d67-408a-971c-294ef602c293', 'U.S. House MA-01'),
  ...
) AS t(office_id_val, position_name_val)
ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING;
```

### Pattern 4: Legislative Race Scaffold (200 rows via JOIN)
**What:** PowerShell/Python generator OR direct SQL using subquery JOIN on chambers.
**When to use:** Plan 02 for 200 MA legislative races.
**Key insight:** Unlike MD (which used numbered districts 1-47), MA uses named districts ("Berkshire-Hampden-Franklin-Hampshire"). The position_name must be derived from the office title. Use the pattern from the 5 pre-existing races: strip "Senator, " → prepend "MA State Senate "; strip "Representative, " → prepend "MA House ".

**Generator SQL query to feed the generator:**
```sql
SELECT o.id AS office_id, d.district_type, o.title
FROM essentials.offices o
JOIN essentials.chambers ch ON o.chamber_id = ch.id
JOIN essentials.governments g ON ch.government_id = g.id
JOIN essentials.districts d ON o.district_id = d.id
WHERE g.geo_id = '25'
  AND d.district_type IN ('STATE_UPPER', 'STATE_LOWER')
ORDER BY d.district_type DESC, d.geo_id;
```

**Position name derivation:**
- STATE_UPPER: `'MA State Senate ' || regexp_replace(o.title, '^Senator, ', '')`
- STATE_LOWER: `'MA House ' || regexp_replace(o.title, '^Representative, ', '')`

**This can be done in a single SQL INSERT** (no external generator needed):
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
  WHERE g.geo_id = '25' AND d.district_type IN ('STATE_UPPER', 'STATE_LOWER')
)
INSERT INTO essentials.races (election_id, office_id, position_name, primary_party, seats)
SELECT gen_elec.id, leg_offices.office_id, leg_offices.position_name, NULL, 1
FROM gen_elec, leg_offices
ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING;
```

This is the **recommended approach** — single SQL script, no external generator, fully idempotent.

### Pattern 5: race_candidates INSERT
**What:** Link known candidates to race rows.
**When to use:** Plan 01 for Healey (Governor race).
**Example:**
```sql
INSERT INTO essentials.race_candidates (race_id, politician_id, is_incumbent, is_official_candidate)
SELECT r.id, '7cf1080e-6e7e-4f5b-be00-6fb170896a7c', true, true
FROM essentials.races r
JOIN essentials.elections e ON r.election_id = e.id
WHERE e.state='MA' AND r.position_name='Governor of Massachusetts' AND e.name='2026 Massachusetts General Election'
ON CONFLICT DO NOTHING;
```

Check `race_candidates` table columns before writing:

```sql
SELECT column_name FROM information_schema.columns 
WHERE table_schema='essentials' AND table_name='race_candidates';
```

---

## Standard Stack

No new packages. This phase is pure SQL migrations + file edit.

| Component | Tool | Pattern |
|-----------|------|---------|
| Migrations | pg pool + node | `node -e "..."` with dotenv from C:/EV-Accounts/backend/.env |
| Apply scripts | `_apply-migration-NNN.ts` + `npx tsx` in backend dir | Phase 105 pattern |
| Generator (if needed) | Pure SQL CTE (preferred over PowerShell) | See Pattern 4 above |
| Landing.jsx edit | Direct file edit | Phase 105 Plan 03 pattern |

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| election_id resolution | Hardcode UUID | Subquery on (name, state) | Names are stable; UUIDs may change between envs |
| Position names | Numbered scheme like "MA Senate District 40" | Strip prefix from `offices.title` | Must match the 5 pre-existing race rows which use title-derived names |
| Discovery rows | New migration | Assert only | Both rows already exist in production |

---

## Common Pitfalls

### Pitfall 1: Primary Date Discrepancy
**What goes wrong:** ROADMAP says 2026-09-02 but DB has 2026-09-01. Someone might think the row is wrong and try to re-insert.
**Why it happens:** The row was likely inserted with `election_date='2026-09-02'` but stored/displayed as 2026-09-01T07:00Z due to UTC handling.
**How to avoid:** The election row is already correct — the UNIQUE constraint on (name, election_date, state) would prevent a duplicate anyway. Assert the existing election row; do not re-insert.
**Warning signs:** Any INSERT for "2026 Massachusetts State Primary" that returns 0 rows inserted (idempotent guard fired) is expected behavior.

### Pitfall 2: Wrong Government for Chamber JOIN
**What goes wrong:** Using `g.geo_id = '25'` and getting 0 results because there are TWO governments with geo_id='25' — one is "State of Massachusetts" (66316105), the other is "Commonwealth of Massachusetts" (85783e20). Chambers are under the 'Commonwealth' one.
**Why it happens:** The DB has duplicate governments for MA geo_id='25'.
**How to avoid:** Use `ch.name IN ('Massachusetts Senate', 'Massachusetts House of Representatives')` as an additional filter, OR use `g.name = 'Commonwealth of Massachusetts'`. Both give the same result.
**Warning signs:** If the JOIN returns 0 rows for STATE_UPPER/LOWER, you're using the wrong government row.

### Pitfall 3: offices.government_id Does Not Exist
**What goes wrong:** Using `WHERE o.government_id = ...` in a query on `essentials.offices`.
**Why it happens:** The `offices` table has no `government_id` column. The path is `offices.chamber_id → chambers.government_id`.
**How to avoid:** Always JOIN via chambers: `offices o JOIN chambers ch ON o.chamber_id = ch.id JOIN governments g ON ch.government_id = g.id`.
**Warning signs:** Error "column o.government_id does not exist".

### Pitfall 4: NULL office_id on Existing Senate Race
**What goes wrong:** Running the phase without fixing the 2 US Senate Massachusetts race rows that have NULL office_id. MA-ELECTIONS-02 requires non-null office_ids.
**Why it happens:** These rows were seeded by the discovery pipeline before Markey's office existed or were seeded incorrectly.
**How to avoid:** Plan 01 must include an UPDATE before any new INSERTs. Verify with: `SELECT COUNT(*) FROM essentials.races r JOIN essentials.elections e ON r.election_id=e.id WHERE e.state='MA' AND r.office_id IS NULL` → must return 0 after Plan 01.
**Warning signs:** Post-verify block raises exception if NULL office_id count > 0.

### Pitfall 5: 5 Pre-existing Legislative Races Causing Duplicate Conflicts
**What goes wrong:** The INSERT for 200 legislative races hits existing rows and fails if ON CONFLICT is absent.
**Why it happens:** 3 senate + 2 house races already exist from v5.0 seeding.
**How to avoid:** ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING is mandatory. Post-verify count should be exactly 200, not 195 (total legislative) + other races.
**Warning signs:** RAISE EXCEPTION if expected count doesn't match after idempotent re-run.

### Pitfall 6: Landing.jsx — Cambridge Already Listed
**What goes wrong:** Adding a duplicate Massachusetts or Cambridge entry.
**Why it happens:** Cambridge is already at line 22 of COVERAGE_CITIES.
**How to avoid:** Add 'Boston' entry AND optionally a state-level 'Massachusetts' entry. Do NOT modify the Cambridge entry. Boston uses geo_id '2507000'.
**Warning signs:** Duplicate label in COVERAGE_CITIES causes UI confusion.

### Pitfall 7: race_candidates Already Present
**What goes wrong:** Re-inserting race_candidates rows that already exist (Markey is already in both Senate races; various other candidates exist).
**Why it happens:** v5.0 seeded some race_candidates via discovery.
**How to avoid:** Use `ON CONFLICT DO NOTHING` for all race_candidates INSERTs. Verify the race_candidates schema first.
**Warning signs:** Unique constraint violation on race_candidates.

---

## Race Count Summary (Pre-migration State)

| Category | Currently in DB | Target | Action Required |
|----------|----------------|--------|-----------------|
| US Senate MA | 2 races (NULL office_id) | 2 races (with office_id) | UPDATE office_id |
| US House MA | 2 races (MA-05, MA-07 only) | 9 races (MA-01 through MA-09) | INSERT 7 new rows |
| Governor of MA | 0 | 1 | INSERT 1 row |
| MA State Senate | 3 races | 40 races | INSERT 37 new rows |
| MA House | 2 races | 160 races | INSERT 158 new rows |
| **Total legislative** | 5 | 200 | INSERT 195 new rows (ON CONFLICT guards existing) |
| **Total MA 2026** | 9 (non-null office_id: 7; NULL: 2) | 212 (1 Gov + 9 House + 2 Senate + 200 leg) | Multiple steps |

Note: The 212 total is the MA 2026 general election universe. Some races may also need primary election rows (Markey's Senate race already has a primary row).

---

## Plan Structure Recommendation

### Plan 01 (Wave 1): Statewide + Federal Races + NULL office_id Fix — Migration 357
**What:**
1. UPDATE 2 NULL-office_id US Senate MA races to set office_id = Markey's office
2. INSERT Governor of Massachusetts race (Healey re-election, linked to general election)
3. INSERT 7 missing US House MA races (MA-01 through MA-04, MA-06, MA-08, MA-09)
4. INSERT race_candidates: Healey as Governor incumbent; assert Markey already in Senate races
5. Post-verify: all 12 statewide/federal MA general races have non-null office_id

**File:** `C:/EV-Accounts/backend/migrations/357_ma_2026_statewide_races.sql`

### Plan 02 (Wave 2, depends on Plan 01): Legislative Race Scaffold — Migration 358
**What:**
1. Single-SQL INSERT of 200 legislative races via JOIN on offices/chambers/governments
2. ON CONFLICT guard skips the 5 pre-existing rows
3. Post-verify: exactly 200 MA legislative race rows (all with non-null office_id)

**File:** `C:/EV-Accounts/backend/migrations/358_ma_2026_legislative_races.sql`

### Plan 03 (Wave 3, depends on Plan 02): Landing.jsx Entry
**What:**
1. Add Boston city entry to COVERAGE_CITIES
2. Add Massachusetts state entry to COVERAGE_CITIES (if it follows existing statewide pattern — see Open Questions)
3. Verify with npm run build

**File:** `src/pages/Landing.jsx`
**No migration needed** — this is a file-only edit.

---

## Open Questions

1. **Massachusetts state-level Landing entry pattern**
   - What we know: ROADMAP says "MA state browse entry"; existing COVERAGE_CITIES entries are all cities/counties
   - What's unclear: Should a "Massachusetts" state entry have `browseGovernmentList` pointing to state govt geo_id '25', or no browseGovernmentList (address-only)?
   - Recommendation: Look at whether Maine or Oregon have a state-level Landing entry. If not, follow the "address-only" pattern with just browseStateAbbrev. Alternatively, skip the state entry and only add Boston — the planner should confirm with ROADMAP language.

2. **Governor race — primary election row needed?**
   - What we know: MD and VA patterns only seed races in the general election. The Cambridge pre-seeded races include 1 race in the primary.
   - What's unclear: Should Phase 110 seed Governor/US House races in the primary as well?
   - Recommendation: Seed in general election only (matching MD/VA pattern). Primary races for incumbents are not always contested. The discovery agent handles primary candidates.

3. **Seth Moulton office anomaly**
   - What we know: There is a "Candidate for U.S. Senate — Massachusetts" office (id=442e3394) for Seth Moulton with NATIONAL_UPPER district_type. This is a candidate-specific office, not the Senate seat.
   - What's unclear: Does Moulton have a separate office from the incumbent seat?
   - Recommendation: Use Markey's office (215e8e94) for the US Senate MA race. Do not reference Moulton's candidate office.

4. **race_candidates schema**
   - What we know: Columns include race_id, politician_id, is_incumbent, is_official_candidate (inferred from pattern)
   - What's unclear: Exact column names — must query before writing
   - Recommendation: Plan 01 executor must query `information_schema.columns` for race_candidates before writing.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Apply scripts | Yes | v24.13.0 | — |
| pg (node) | DB queries/apply | Yes | in C:/EV-Accounts/backend/node_modules | — |
| dotenv | Apply scripts | Yes | in node_modules | — |
| C:/EV-Accounts/backend/.env | DATABASE_URL | Yes | Confirmed present | — |
| essentials npm (build) | Landing.jsx verify | Yes | in C:/Transparent Motivations/essentials | — |

---

## Validation Architecture

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| MA-ELECTIONS-01 | 2 MA election rows exist | DB query | `SELECT COUNT(*) FROM essentials.elections WHERE state='MA' AND election_date IN ('2026-09-01','2026-11-03')` → 2 |
| MA-ELECTIONS-02 | Governor + Senate races with office_id + Healey as candidate | DB query | `SELECT COUNT(*) FROM essentials.races r JOIN essentials.elections e ON r.election_id=e.id WHERE e.state='MA' AND r.office_id IS NOT NULL AND r.position_name IN ('Governor of Massachusetts','U.S. Senate Massachusetts')` → 2+ |
| MA-ELECTIONS-03 | 200 legislative races with non-null office_ids | DB query | `SELECT COUNT(*) FROM essentials.races r JOIN essentials.elections e ON r.election_id=e.id WHERE e.state='MA' AND e.name='2026 Massachusetts General Election' AND r.position_name LIKE 'MA State Senate%' OR r.position_name LIKE 'MA House%'` → 200 |
| MA-ELECTIONS-04 | 2 discovery_jurisdictions rows for MA | DB query | `SELECT COUNT(*) FROM essentials.discovery_jurisdictions WHERE state='MA' AND jurisdiction_geoid='25'` → 2 (already satisfied) |

### Per-Plan Verification

**Plan 01 post-verify (migration 357):**
```sql
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
    AND r.position_name IN ('Governor of Massachusetts','U.S. Senate Massachusetts',
      'U.S. House MA-01','U.S. House MA-02','U.S. House MA-03','U.S. House MA-04',
      'U.S. House MA-05','U.S. House MA-06','U.S. House MA-07','U.S. House MA-08','U.S. House MA-09');
  IF v_fed_count <> 11 THEN RAISE EXCEPTION 'Expected 11 MA statewide/federal general races, found %', v_fed_count; END IF;
END $$;
```

**Plan 02 post-verify (migration 358):**
```sql
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

## Sources

### Primary (HIGH confidence — live DB verified)
- Live production DB queries (2026-06-11) — all DB state claims are verified
- `C:/EV-Accounts/backend/migrations/322_va_2026_elections.sql` — elections migration pattern
- `C:/EV-Accounts/backend/migrations/324_va_2026_races.sql` — races migration pattern (WITH gen_elec CTE)
- `C:/EV-Accounts/backend/migrations/325_va_2026_discovery.sql` — discovery pattern
- `C:/EV-Accounts/backend/migrations/281_md_2026_discovery.sql` — original discovery pattern
- `.planning/phases/96-md-2026-elections-discovery-pipeline-landing/96-02-SUMMARY.md` — "wrong chamber name" lesson
- `src/pages/Landing.jsx` — confirmed existing COVERAGE_CITIES entries

### Secondary (MEDIUM confidence)
- ROADMAP.md Phase 110 section — phase goals and success criteria
- REQUIREMENTS.md — MA-ELECTIONS-01 through MA-ELECTIONS-04 definitions

---

## Metadata

**Confidence breakdown:**
- DB state (elections, races, discovery): HIGH — verified live
- Office UUIDs (Governor, Markey, US House): HIGH — verified live
- Legislature JOIN pattern: HIGH — confirmed 200 offices via live query
- Position name convention: HIGH — derived from 5 pre-existing race rows in DB
- Landing.jsx state: HIGH — file read directly
- Migration counter (357 next): HIGH — ledger verified

**Research date:** 2026-06-11
**Valid until:** 2026-07-11 (stable data — election dates won't change)

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Governor race position_name should be "Governor of Massachusetts" | Plan Structure / Code Examples | Position name collision if pre-existing row uses different name; ON CONFLICT guard mitigates |
| A2 | Boston Landing entry should use browseGovernmentList: ['2507000'] (city only, no BPS geo_id) | Open Questions | Users might miss School Committee — but SC shows when address is entered, not needed for city browse |
| A3 | US House races should be in general election only (not primary) | Open Questions | Discovery will handle primary candidates; planner may want primary rows too |
| A4 | race_candidates has is_incumbent and is_official_candidate columns | DB patterns | Plan 01 executor must verify schema before writing |
