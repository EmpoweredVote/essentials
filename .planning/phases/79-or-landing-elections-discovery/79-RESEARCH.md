# Phase 79: OR Landing + Elections + Discovery - Research

**Researched:** 2026-05-30
**Domain:** Oregon Elections Seed, Landing.jsx Integration, Discovery Pipeline
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Add Portland, OR entry following Portland, ME model: `{ county: 'Portland', state: 'Oregon', browseGovernmentList: ['4159000'], browseStateAbbrev: 'OR' }`. Portland geo_id='4159000' confirmed.
- **D-02:** Two OR elections: OR 2026 Primary (election_date='2026-05-19') and OR 2026 General (election_date='2026-11-03').
- **D-03:** Primary row is bare — no race rows. All race rows link to November 3 general only.
- **D-04:** Race rows for OR Governor, US Senate (Merkley), and all 6 US House CDs — all general election only. race_candidates left empty on creation.
- **D-05:** Include Jeff Merkley US Senate race. Merkley politician_id confirmed via external_id=-4101002.
- **D-06:** Full 90-race OR state legislative scaffold: 30 STATE_UPPER + 60 STATE_LOWER, general election only, race_candidates empty.
- **D-07:** Researcher must verify Portland 2026 city races. (RESULT: YES, 2026 races confirmed — see findings below.)
- **D-08:** Create discovery_jurisdictions for Portland with cron_active logic (no such column — see schema finding); election_date per findings below.
- **D-09:** Sequential discovery processing only — never parallel.
- **D-10:** Create discovery_jurisdictions rows for Portland and OR statewide. ON CONFLICT DO NOTHING guard.
- **D-11:** All race_candidates empty on creation.

### Claude's Discretion

- Exact sos.oregon.gov candidate listing URL for OR statewide races (Governor, Senate, US House)
- Portland city elections source URL
- OR Governor 2026 race structure (Kotek seeking second term or open seat)
- One combined vs. separate discovery_jurisdictions rows for OR statewide races
- Migration numbering
- OR primary date confirmation

### Deferred Ideas (OUT OF SCOPE)

- OR G4040 COUSUB towns — v8.1+
- Washington County + Clackamas County officials — v8.1+
- Multnomah County Commissioner races — separate phase
- Post-November 2026 follow-up for 2028 cycle
</user_constraints>

---

## Summary

Phase 79 wires Portland OR into the landing page, seeds two OR 2026 election rows, creates race rows for all statewide and state legislative offices, and arms the discovery pipeline. This is a pure data migration phase — no schema changes, no frontend changes beyond Landing.jsx COVERAGE_AREAS.

**Critical finding — Portland 2026 races DO exist.** D-07 expected "no 2026 races" but is WRONG. Portland's 2022 charter intentionally staggered terms: Districts 1 and 2 were elected to 4-year terms in 2024; Districts 3 and 4 were elected to 2-year terms and are UP FOR ELECTION November 3, 2026. The City Auditor (Simone Rede, also on 2-year term) is also on the 2026 ballot. This adds 7 additional race rows (3 seats per district × 2 districts + 1 auditor) and an additional discovery_jurisdictions row for Portland.

**Migration number:** The next free migration number is 237. Migration 236 was applied 2026-05-30 (OR legislator Unicode name fix). Sequence: 235=fix_portland_officials_is_appointed, 236=fix_or_legislator_names_unicode.

**no `cron_active` column exists** in `essentials.discovery_jurisdictions`. The CONTEXT.md references this column but it does not exist in the live schema. The cron automatically sweeps all rows where `election_date > now() AND election_date <= horizon (180 days)`. Inserting a row with a future election_date within the horizon automatically makes it active.

**Primary recommendation:** Structure the phase as: Plan 01 (Landing.jsx + elections rows), Plan 02 (statewide race rows: Governor, Senate, US House 6 CDs), Plan 03 (90 OR legislative races via PowerShell generator), Plan 04 (Portland city races: D3×3 + D4×3 + Auditor = 7 races), Plan 05 (discovery_jurisdictions: Portland + OR statewide), Plan 06 (verification).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Landing.jsx COVERAGE_AREAS entry | Frontend | — | Static array in JSX component; one line addition |
| OR election rows | Database | — | essentials.elections — purely data |
| OR statewide race rows | Database | — | essentials.races + offices JOIN |
| OR legislative race scaffold | Database | — | essentials.races bulk insert via generator script |
| Portland city race rows | Database | — | essentials.races referencing existing office_ids |
| Discovery jurisdictions | Database | Backend (cron) | DB rows trigger cron; no backend code change |
| Discovery pipeline cron | Backend | — | discoveryCron.ts sweeps by election_date window; no code change needed |

---

## Standard Stack

No new packages installed. All operations are:
- SQL migrations via Supabase MCP (direct psql to production)
- PowerShell generator script for 90-race OR legislative scaffold
- One line JSX edit to Landing.jsx

---

## Package Legitimacy Audit

No packages installed in this phase.

---

## Architecture Patterns

### System Architecture Diagram

```
Landing.jsx COVERAGE_AREAS
  └── browseGovernmentList=['4159000'] → Results page → Portland OR politicians

essentials.elections (OR 2026 Primary + OR 2026 General)
  └── essentials.races (Governor + US Senate + 6 CDs + 30 Senate + 60 House + 7 Portland city)
       └── essentials.offices (pre-seeded Phases 74, 75, 77)
       └── essentials.race_candidates (empty at creation — discovery fills)

essentials.discovery_jurisdictions
  ├── OR statewide row (geo_id='41', sos.oregon.gov source)
  └── Portland city row (geo_id='4159000', portland.gov/auditor/elections source)
       └── discoveryCron.ts sweeps rows where election_date within 180-day horizon
```

### Recommended Project Structure

No new directories. All artifacts:
- Migration SQL files in `C:/EV-Accounts/backend/migrations/`
- PowerShell generator script in `C:/EV-Accounts/backend/migrations/`
- Landing.jsx edit in `src/pages/Landing.jsx` (line 19 insertion)

---

## Verified Database State

All facts verified against live production database on 2026-05-30.

### Migration Ledger (confirmed)

| Migration | Content | Applied |
|-----------|---------|---------|
| 235 | fix_portland_officials_is_appointed | Yes |
| 236 | fix_or_legislator_names_unicode | Yes (2026-05-30) |
| **237** | **NEXT AVAILABLE — Phase 79 first migration** | No |

[VERIFIED: live DB query 2026-05-30]

### OR Office Inventory (confirmed)

| Chamber | Count | office_id range |
|---------|-------|----------------|
| Oregon Senate | 30 | verified 30/30 non-null |
| Oregon House of Representatives | 60 | verified 60/60 non-null |
| Governor | 1 | id=780f76cd-2ec0-42fc-bb67-74a8911ca1c8 |
| Attorney General | 1 | n/a (not needed for race rows — is_appointed=false but no race) |
| Secretary of State | 1 | n/a |
| State Treasurer | 1 | n/a |
| Labor Commissioner | 1 | n/a |

Note: Only Governor needs a race row for this phase (voter-elected statewide). AG/SoS/Treasurer/LaborCommissioner are all voter-elected in Oregon but are NOT up for election in 2026. Their next elections are 2028 or 2030 per Oregon's cycle. [VERIFIED: sos.oregon.gov open-offices.pdf + STATE.md OR context]

### OR District geo_id Patterns (confirmed from DB)

| District Type | geo_id Format | State Casing | Example |
|---------------|---------------|--------------|---------|
| NATIONAL_UPPER (US Senate) | '41' | 'OR' (uppercase) | Merkley district |
| NATIONAL_LOWER (US House) | '4101' to '4106' | 'OR' (uppercase) | CD-01 = '4101' |
| STATE_EXEC (Governor) | '41' | 'OR' (uppercase) | Governor office district |
| STATE_UPPER (Senate) | '41001' to '41030' | 'or' (lowercase) | SD-01 = '41001' |
| STATE_LOWER (House) | '41001' to '41060' | 'or' (lowercase) | HD-01 = '41001' |
| LOCAL (Portland council) | 'portland-or-council-district-1' to '-4' | 'or' (lowercase) | D-3 = 'portland-or-council-district-3' |
| LOCAL_EXEC (Portland citywide) | '4159000' | — | Mayor, Auditor, City Admin, City Attorney |

[VERIFIED: live DB query 2026-05-30]

**CRITICAL GOTCHA:** STATE_UPPER and STATE_LOWER BOTH use geo_id pattern '41001' through '41030/41060'. District type disambiguates — the query MUST include `AND district_type='STATE_UPPER'` or `AND district_type='STATE_LOWER'` when looking up district_id for OR offices.

### OR Office ID Lookup Pattern (confirmed)

For state legislative race rows, join to office via chamber name + district geo_id:
```sql
-- OR Senate SD-01 office_id
SELECT id FROM essentials.offices
WHERE chamber_id = (SELECT id FROM essentials.chambers WHERE name='Oregon Senate'
  AND government_id=(SELECT id FROM essentials.governments WHERE name='State of Oregon'))
  AND district_id = (SELECT id FROM essentials.districts WHERE geo_id='41001' AND district_type='STATE_UPPER')
-- Returns: e319ea99-cbf5-40b3-a848-184c06e19f64
```

```sql
-- OR House HD-01 office_id
SELECT id FROM essentials.offices
WHERE chamber_id = (SELECT id FROM essentials.chambers WHERE name='Oregon House of Representatives'
  AND government_id=(SELECT id FROM essentials.governments WHERE name='State of Oregon'))
  AND district_id = (SELECT id FROM essentials.districts WHERE geo_id='41001' AND district_type='STATE_LOWER')
-- Returns: 74263a7b-afde-4ca7-9b91-e442472a01f2
```

[VERIFIED: live DB query 2026-05-30]

### Portland Council Offices (confirmed)

All 12 Portland city council offices exist with correct district links:

| District | Seats | office titles | district_id |
|----------|-------|---------------|-------------|
| District 1 | 3 | City Councilor (District 1) × 3 | ee308098-73d3-4275-b592-483f579b4bd8 |
| District 2 | 3 | City Councilor (District 2) × 3 | 577805d8-ecaf-4eca-9ee3-37659ed13386 |
| District 3 | 3 | City Councilor (District 3) × 3 | 4961e1bd-160d-4f3c-a690-fad2e0173849 |
| District 4 | 3 | City Councilor (District 4) × 3 | 33a2b859-90e7-4ea6-bfd7-355bd2015ff2 |

City Auditor office (pre-existing from Phase 77):
- title='City Auditor', district linked to geo_id='4159000' (LOCAL_EXEC), id=a19813f9-ee4d-442d-b052-5c2f9f7db9c8

[VERIFIED: live DB query 2026-05-30]

---

## Findings: Claude's Discretion Items

### OR Primary Date [VERIFIED: sos.oregon.gov]

**Confirmed: May 19, 2026** is the official Oregon primary date. Multiple SOS documents confirm:
- `sos.oregon.gov/elections/Documents/open-offices.pdf` title: "Offices Open May 19, 2026, Primary Election"
- Multnomah County: "May 19, 2026 Primary Election"
- Wikipedia + Ballotpedia cross-reference confirms May 19

Use `election_date='2026-05-19'` for the OR 2026 Primary row.

### OR Governor 2026 [VERIFIED: multiple news sources]

**Tina Kotek is seeking a second term** — NOT an open seat. Kotek announced reelection December 4, 2025. She won the May 19, 2026 Democratic primary. Her Republican challenger is Christine Drazan (rematch of 2022 race). This is an INCUMBENT race, not an open seat.

- Kotek politician UUID: 66c3bd97-94d1-4287-b1b8-86605a38cb97 (external_id=-4100001)
- Kotek is_incumbent=true on the general election race row

### Jeff Merkley US Senate 2026 [VERIFIED: Wikipedia, multiple sources]

**Merkley seeking fourth term** (incumbent). Primary: won 93.2% May 19, 2026. General opponent: Republican state senator David Brock Smith. Election date: November 3, 2026.

- Merkley politician UUID: 0eabc969-c1a1-47b7-8d34-6113b723a170 (external_id=-4101002)
- Merkley office: id=3db3e08a-ed6c-4365-9e5a-9af1f94c4372 (NATIONAL_UPPER, district geo_id='41')

### Portland City Council 2026 Races [VERIFIED: portland.gov, Wikipedia]

**D-07 assumption was WRONG.** Portland 2026 races DO EXIST:

Under the new charter, 2024 staggered elections gave Districts 1 and 2 four-year terms; Districts 3 and 4 were intentionally given two-year terms to create the ongoing stagger. Districts 3 and 4 are therefore up for election November 3, 2026. City Auditor Simone Rede was also on a two-year term (elected 2024) and is up for reelection 2026.

**Races to create for Portland:**
- District 3: 3 seats (3 race rows, one per seat), multi-winner STV
- District 4: 3 seats (3 race rows, one per seat), multi-winner STV
- City Auditor: 1 seat (1 race row)
- **Total: 7 Portland race rows**

**Mayor Keith Wilson is NOT up in 2026** (4-year term from 2024, next election 2028).
**Districts 1 and 2 are NOT up in 2026** (4-year terms from 2024).

Source: portland.gov/auditor/elections/city-office-candidacy [VERIFIED: WebFetch 2026-05-30]

### Portland Discovery Source URL

City Auditor elections division is the authoritative source for Portland city elections:
- `https://www.portland.gov/auditor/elections` — main elections hub
- `https://www.portland.gov/auditor/elections/city-office-candidacy` — candidate filing info

**Recommended source_url for discovery_jurisdictions:**
`https://www.portland.gov/auditor/elections` [CITED: portland.gov/auditor/elections]

### OR Statewide Discovery Source URL

ORESTAR (Secretary of State candidate filing search) is the authoritative OR statewide source:
- `https://sos.oregon.gov/elections/Pages/Candidate-Filings-Local-Measures.aspx` — main filings page
- `https://secure.sos.state.or.us/orestar/cfFilings.do` — actual search interface

**Recommended source_url for discovery_jurisdictions (statewide):**
`https://sos.oregon.gov/elections/Pages/Candidate-Filings-Local-Measures.aspx` [CITED: sos.oregon.gov]

### One Row vs. Separate Rows for OR Statewide [VERIFIED: CA pattern]

**Recommendation: ONE row for OR statewide** using jurisdiction_geoid='41' (Oregon FIPS), matching the CA pattern exactly:
- CA used one row: `jurisdiction_geoid='06'`, `jurisdiction_name='California Statewide'`
- ME used one row: `jurisdiction_geoid='23'`, `jurisdiction_name='State of Maine'`
- OR should use: `jurisdiction_geoid='41'`, `jurisdiction_name='State of Oregon'`

This single row covers the discovery cron for all statewide races (Governor, Senate, House, Legislature).

[VERIFIED: live DB query — CA row geo_id='06' confirmed 2026-05-30]

### Migration Number [VERIFIED: live DB query]

**Next migration is 237.** The last two applied migrations are 235 (fix_portland_officials_is_appointed) and 236 (fix_or_legislator_names_unicode), both 2026-05-30.

---

## `cron_active` Column — CRITICAL SCHEMA FINDING

[VERIFIED: live DB column inspection 2026-05-30]

**The `cron_active` column does NOT exist in `essentials.discovery_jurisdictions`.**

The actual schema is: `id, jurisdiction_geoid, jurisdiction_name, state, election_date, source_url, allowed_domains, created_at, updated_at`

The cron logic in `src/lib/discoveryCron.ts` (line 203-206) selects:
```sql
SELECT id, jurisdiction_name
FROM essentials.discovery_jurisdictions
WHERE election_date > now()
  AND election_date <= $1  -- horizon = now() + 180 days
ORDER BY election_date ASC
```

**All rows with election_date in the 0–180 day window are automatically swept.** There is no opt-in/opt-out flag. The CONTEXT.md D-08/D-10 references to `cron_active=true` are incorrect — do not include that column in any INSERT.

To activate discovery: insert the row with the correct election_date (within 180 days of cron run = within 180 days of November 3, 2026, so cron will pick up in approximately May 2026 if run again).

OR 2026 General = November 3, 2026 = 157 days from 2026-05-30. This is within the 180-day horizon. The row will be swept on the next Sunday cron run.

---

## Race Row Patterns

### Position Name Convention (from live DB)

| Race Type | Position Name Pattern | Example |
|-----------|----------------------|---------|
| Governor | 'Governor of [State]' | 'Governor of Maine' |
| US Senate | 'U.S. Senate [State]' | 'U.S. Senate Maine' |
| US House | 'U.S. House [State-abbrev]-[NN]' | 'U.S. House ME-01' |
| State Senate | '[State abbrev] State Senate District [N]' | 'ME State Senate District 1' |
| State House | '[State abbrev] State House District [N]' | 'ME State House District 1' |
| Portland council | (recommend) 'Portland City Council District [N] Seat [A/B/C]' | — |
| Portland auditor | (recommend) 'Portland City Auditor' | — |

[VERIFIED: live DB query on ME races 2026-05-30]

OR equivalents to use:
- `'Governor of Oregon'`
- `'U.S. Senate Oregon'`
- `'U.S. House OR-01'` through `'U.S. House OR-06'`
- `'OR State Senate District 1'` through `'OR State Senate District 30'`
- `'OR State House District 1'` through `'OR State House District 60'`
- `'Portland City Council District 3 Seat A'`, `'...Seat B'`, `'...Seat C'`
- `'Portland City Council District 4 Seat A'`, `'...Seat B'`, `'...Seat C'`
- `'Portland City Auditor'`

### ON CONFLICT Constraint Name (for races table)

The unique index allowing idempotent race inserts is:
```
CREATE UNIQUE INDEX idx_races_election_position_no_party
ON essentials.races USING btree (election_id, position_name)
WHERE (primary_party IS NULL)
```

Use this pattern in migrations:
```sql
ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING
```

[VERIFIED: live DB constraint inspection 2026-05-30]

### Elections Table Unique Constraint

```
UNIQUE (name, election_date, state)
```

Use `ON CONFLICT (name, election_date, state) DO NOTHING` for idempotent election inserts.

[VERIFIED: live DB 2026-05-30]

### elections.name Column

The column is named `name` (NOT `election_name`). This tripped research — confirmed via `information_schema.columns` query.

---

## OR Race Row Office Lookup Patterns

### Governor
```sql
SELECT id FROM essentials.offices
WHERE chamber_id = (SELECT id FROM essentials.chambers
  WHERE name='Governor' AND government_id=(SELECT id FROM essentials.governments WHERE name='State of Oregon'))
-- Returns: 780f76cd-2ec0-42fc-bb67-74a8911ca1c8
```

### US Senate (Merkley)
```sql
SELECT id FROM essentials.offices WHERE id='3db3e08a-ed6c-4365-9e5a-9af1f94c4372'
-- OR via politician:
SELECT id FROM essentials.offices WHERE politician_id=(SELECT id FROM essentials.politicians WHERE external_id=-4101002)
-- Returns: 3db3e08a-ed6c-4365-9e5a-9af1f94c4372
```

### US House CD-NN
```sql
SELECT o.id FROM essentials.offices o
JOIN essentials.politicians p ON p.id=o.politician_id
WHERE p.external_id = -4102001  -- CD-01 (Bonamici)
-- external_ids: -4102001 (CD-01) through -4102006 (CD-06)
```

US House office_ids confirmed from live DB:
| CD | geo_id | office_id |
|----|--------|-----------|
| CD-01 | '4101' | 617febb8-3b45-4787-87af-8b8ecc008b05 |
| CD-02 | '4102' | 41b9876c-304d-4268-a751-25ea7e2009cc |
| CD-03 | '4103' | 62cb1965-8401-430c-8681-03a3e22e7c77 |
| CD-04 | '4104' | 94d89181-58c5-42b3-886f-4538131fd461 |
| CD-05 | '4105' | 1207f28b-6eea-4113-889c-3127292e29b9 |
| CD-06 | '4106' | 1e17d814-d999-4399-974c-3b36ec825ba7 |

[VERIFIED: live DB 2026-05-30]

### State Senate SD-01 through SD-30
geo_id pattern: FIPS = '41' + lpad(district_num, 3, '0') → SD-01 = '41001', SD-30 = '41030'

### State House HD-01 through HD-60
Same geo_id format: HD-01 = '41001', HD-60 = '41060'
CRITICAL: district_type='STATE_LOWER' disambiguates from STATE_UPPER (same geo_id numbers)

---

## PowerShell Generator for 90 OR Legislative Races

The ME Phase 55 generator (184_me_2026_legislative_races approach) is the direct template. Key adaptations for OR:

1. OR Senate districts: geo_id '41001' to '41030', district_type='STATE_UPPER'
2. OR House districts: geo_id '41001' to '41060', district_type='STATE_LOWER'
3. Position name format: `'OR State Senate District N'` and `'OR State House District N'`
4. No primary race rows — general only (D-03, D-06)
5. CRITICAL BOM fix: use `[System.IO.File]::WriteAllLines` with `UTF8Encoding($false)` — not `Out-File -Encoding UTF8`
6. Since no primary races, generator only produces 90 race rows (not 180 like ME which had primary + general)

[CITED: Phase 55-02 SUMMARY re: UTF-8 BOM fix]

---

## Portland City Race Architecture

### 7 Portland Races (D3 × 3 + D4 × 3 + Auditor)

All 7 races link to the OR 2026 General election_id. election_method context: Portland uses STV (multi-winner ranked choice) for council races and single-winner RCV for Auditor.

**Race rows to create:**
| position_name | office query pattern |
|---------------|---------------------|
| Portland City Council District 3 Seat A | title='City Councilor (District 3)', district geo_id='portland-or-council-district-3', LIMIT 1 (any — three offices are identical) |
| Portland City Council District 3 Seat B | same district, OFFSET 1 |
| Portland City Council District 3 Seat C | same district, OFFSET 2 |
| Portland City Council District 4 Seat A | title='City Councilor (District 4)', district geo_id='portland-or-council-district-4', LIMIT 1 |
| Portland City Council District 4 Seat B | same, OFFSET 1 |
| Portland City Council District 4 Seat C | same, OFFSET 2 |
| Portland City Auditor | office id=a19813f9-ee4d-442d-b052-5c2f9f7db9c8 |

**IMPORTANT:** The three council offices per district are truly identical (same title, same district_id). To create 3 distinct races, the position_name field (Seat A/B/C) distinguishes them. Each race row links to a different office_id (one of the three identical offices per district). The executor must enumerate all three office_ids per district to populate the 3 race rows.

[VERIFIED: live DB query showed 3 offices per district 2026-05-30]

---

## Discovery Jurisdictions

### Two rows to create

**Row 1: OR Statewide**
```sql
INSERT INTO essentials.discovery_jurisdictions
  (id, jurisdiction_geoid, jurisdiction_name, state, election_date, source_url, allowed_domains)
VALUES
  (gen_random_uuid(), '41', 'State of Oregon', 'OR', '2026-11-03',
   'https://sos.oregon.gov/elections/Pages/Candidate-Filings-Local-Measures.aspx',
   ARRAY['sos.oregon.gov', 'oregonlegislature.gov', 'ballotpedia.org']);
```

**Row 2: Portland City**
```sql
INSERT INTO essentials.discovery_jurisdictions
  (id, jurisdiction_geoid, jurisdiction_name, state, election_date, source_url, allowed_domains)
VALUES
  (gen_random_uuid(), '4159000', 'City of Portland, Oregon', 'OR', '2026-11-03',
   'https://www.portland.gov/auditor/elections',
   ARRAY['portland.gov', 'multco.us', 'ballotpedia.org']);
```

**No ON CONFLICT clause possible** — discovery_jurisdictions has no unique constraint beyond primary key. Use `WHERE NOT EXISTS` guard or check before inserting (confirmed from live DB constraint inspection).

Cron sweep: November 3, 2026 is 157 days from 2026-05-30 — within the 180-day horizon. Both rows will be swept on next Sunday cron.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 90 OR legislative race rows | Manual SQL per district | PowerShell generator script | ME Phase 55 established the pattern; generator handles UTF-8 BOM correctly |
| Idempotent race inserts | Custom duplicate checks | `ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING` | Existing partial unique index |
| Idempotent election inserts | Existence checks | `ON CONFLICT (name, election_date, state) DO NOTHING` | Existing unique constraint |
| Discovery activation | Custom `cron_active` flag | Just insert the row with correct election_date | Cron uses date-window filter, not a flag column |

---

## Common Pitfalls

### Pitfall 1: STATE_UPPER vs. STATE_LOWER geo_id Collision
**What goes wrong:** OR Senate District 1 and OR House District 1 BOTH use geo_id='41001'. A query joining offices to districts by geo_id alone returns both rows.
**Why it happens:** TIGER assigns geo_ids by state FIPS + district number for both tiers.
**How to avoid:** Always add `AND district_type='STATE_UPPER'` or `AND district_type='STATE_LOWER'` in the district_id subquery.
**Warning signs:** Generator script producing NULL office_ids for some districts.

### Pitfall 2: `cron_active` Column Does Not Exist
**What goes wrong:** Including `cron_active=true` in the discovery_jurisdictions INSERT causes a SQL error.
**Why it happens:** CONTEXT.md referenced this column but it was removed or never existed in the live schema.
**How to avoid:** Never include `cron_active` in discovery_jurisdictions INSERTs. The column schema is: id, jurisdiction_geoid, jurisdiction_name, state, election_date, source_url, allowed_domains.

### Pitfall 3: Portland 2026 Races Missed
**What goes wrong:** Phase proceeds assuming no Portland 2026 races per D-07 expectation.
**Why it happens:** The 2024 charter reform staggered terms — Districts 3+4 were given 2-year terms intentionally.
**How to avoid:** Create 7 Portland race rows (D3×3 + D4×3 + Auditor). All link to OR 2026 General election_id. City Auditor office_id = a19813f9-ee4d-442d-b052-5c2f9f7db9c8.

### Pitfall 4: elections table column name
**What goes wrong:** Using `election_name` in queries/INSERTs instead of `name`.
**Why it happens:** Planning documents use "election_name" loosely; the actual column is `name`.
**How to avoid:** Schema: `id, name, election_date, election_type, jurisdiction_level, state, description`.

### Pitfall 5: BOM in PowerShell-generated SQL
**What goes wrong:** `Out-File -Encoding UTF8` writes a UTF-8 BOM; PostgreSQL rejects with "syntax error at or near ''"
**Why it happens:** PowerShell's default UTF-8 encoding includes BOM.
**How to avoid:** Use `[System.IO.File]::WriteAllLines("filename", $output, [System.Text.UTF8Encoding]::new($false))`

### Pitfall 6: Race position_name uniqueness for Portland council
**What goes wrong:** Three council seats per district but unique index is on `(election_id, position_name)`. Without Seat A/B/C suffix, all three would conflict.
**Why it happens:** Three offices per district, three race rows needed per district.
**How to avoid:** Use distinct position_names: 'Portland City Council District N Seat A', '...Seat B', '...Seat C'.

### Pitfall 7: No CONCAT or ON CONFLICT for discovery_jurisdictions
**What goes wrong:** `ON CONFLICT DO NOTHING` with no unique constraint silently does nothing — the rows INSERT normally without conflict protection.
**Why it happens:** discovery_jurisdictions has only a primary key constraint.
**How to avoid:** Use `WHERE NOT EXISTS (SELECT 1 FROM essentials.discovery_jurisdictions WHERE jurisdiction_geoid='41' AND election_date='2026-11-03')` guard. This ensures idempotency even without a unique constraint.

---

## Landing.jsx Integration

Current COVERAGE_AREAS array (confirmed from src/pages/Landing.jsx):
- Line 8: array opens
- Line 19: last entry — `{ county: 'Portland', state: 'Maine', ... }`
- Line 20: array closes

New Portland OR entry (append after line 19):
```jsx
{ county: 'Portland', state: 'Oregon', browseGovernmentList: ['4159000'], browseStateAbbrev: 'OR' },
```

This follows D-01 exactly and matches the Portland ME pattern.

[VERIFIED: src/pages/Landing.jsx read 2026-05-30]

---

## Race Counts Summary

| Category | Count | Notes |
|----------|-------|-------|
| OR Governor | 1 | Kotek incumbent, general only |
| US Senate (Merkley) | 1 | General only |
| US House (CD-01 to CD-06) | 6 | General only |
| OR State Senate (SD-01 to SD-30) | 30 | General only |
| OR State House (HD-01 to HD-60) | 60 | General only |
| Portland Council D3 Seat A/B/C | 3 | General only |
| Portland Council D4 Seat A/B/C | 3 | General only |
| Portland City Auditor | 1 | General only, Simone Rede incumbent |
| **TOTAL** | **105** | All general election only |

---

## Suggested Plan Structure

| Plan | Content | Migration(s) |
|------|---------|-------------|
| 79-01 | Landing.jsx entry + 2 OR election rows | 237 (elections only) |
| 79-02 | OR statewide race rows (Governor + Senate + 6 CDs = 8 rows) | 238 |
| 79-03 | 90 OR legislative race rows via PowerShell generator | 239 |
| 79-04 | 7 Portland city race rows (D3×3 + D4×3 + Auditor) | 240 |
| 79-05 | 2 discovery_jurisdictions rows (OR statewide + Portland) | 241 |
| 79-06 | Verification (section-split check + race count assertions) | none |

---

## Section-Split Check

Run after every seeding plan (established project rule):
```sql
SELECT gb.geo_id
FROM essentials.geofence_boundaries gb
WHERE gb.state = '41'
  AND gb.geo_id NOT IN (SELECT geo_id FROM essentials.districts WHERE state='or' OR state='OR' OR state='41');
-- Expected: 0 rows
```

[CITED: STATE.md — run after every seeding phase]

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Portland expected no 2026 races | Portland D3+D4+Auditor ARE on 2026 ballot | Research finding 2026-05-30 | Must create 7 Portland race rows, not 0 |
| `cron_active=true` flag concept | Date-window filter (no flag column) | Already live | Never include `cron_active` in discovery_jurisdictions INSERTs |
| elections.election_name | elections.name | Already live | Use `name` column, not `election_name` |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Portland Auditor seat is up in 2026 (two-year term per charter stagger) | Portland Races | If wrong, remove that 1 race row — low impact |
| A2 | sos.oregon.gov Candidate Filings page is the right discovery source URL for statewide OR | Discovery Jurisdictions | Discovery agent may find different format; update source_url post-run |
| A3 | portland.gov/auditor/elections is the canonical Portland city elections source | Discovery Jurisdictions | May need to update to a more specific candidate listing page after Nov 2026 |
| A4 | OR AG, SoS, Treasurer, Labor Commissioner are NOT up in 2026 (their cycles don't align) | Race Counts | If any are on 2026 ballot, additional race rows needed — but sos.oregon.gov open-offices PDF confirms only Governor for 2026 statewide exec |

**Note on A4:** [VERIFIED: sos.oregon.gov search results 2026-05-30] — ORESTAR search results only listed Governor as the 2026 statewide executive race. OR AG/SoS/Treasurer/Labor Commissioner were not listed as 2026 offices. This is consistent with Oregon's election cycles.

---

## Open Questions

1. **Portland council race position_name seat labeling**
   - What we know: three offices per district are identical (same title, same district_id)
   - What's unclear: whether the discovery agent or elections UI will display "Seat A/B/C" labeling or if a different convention is preferred
   - Recommendation: Use 'Seat A/B/C' as established in Phase 72 CONTEXT.md (D-10: `"Councilor (District N, Seat A/B/C)"`) — this matches the official Portland seat naming

2. **Portland council offices — which office_id maps to which Seat**
   - What we know: three offices per district have equal priority; the DB doesn't name them Seat A/B/C
   - What's unclear: does it matter which office_id links to which seat label?
   - Recommendation: The seat labels (A/B/C) are just race row position_name suffixes for uniqueness; assign them arbitrarily to the three office_ids ordered by UUID. Discovery agent populates race_candidates regardless.

3. **OR statewide discovery row: jurisdiction_geoid '41' vs. state FIPS**
   - What we know: CA used '06' (2-digit FIPS string), ME used '23'
   - Recommendation: Use '41' (Oregon FIPS) for consistency with the established pattern

---

## Environment Availability

No external CLI tools required. All work is SQL migrations + one JSX edit.

| Dependency | Required By | Available | Fallback |
|------------|------------|-----------|----------|
| Supabase MCP (mcp__supabase-local) | All SQL migrations | Yes (live production DB) | — |
| PowerShell | Legislative race generator | Yes (Windows) | Write SQL manually |
| Git | Committing Landing.jsx change | Yes | — |

---

## Validation Architecture

Per-wave verification queries:

**After Plan 01 (elections rows):**
```sql
SELECT name, election_date FROM essentials.elections WHERE state='OR' ORDER BY election_date;
-- Expected: 2 rows (OR 2026 Primary 2026-05-19, OR 2026 General 2026-11-03)
```

**After Plan 02 (statewide race rows):**
```sql
SELECT COUNT(*) FROM essentials.races r
JOIN essentials.elections e ON e.id=r.election_id
WHERE e.state='OR';
-- Expected: 8 (1 Gov + 1 Senate + 6 House)
```

**After Plan 03 (legislative races):**
```sql
SELECT COUNT(*) FROM essentials.races r
JOIN essentials.elections e ON e.id=r.election_id
WHERE e.state='OR';
-- Expected: 98 (8 + 90 legislative)
```

**After Plan 04 (Portland city races):**
```sql
SELECT COUNT(*) FROM essentials.races r
JOIN essentials.elections e ON e.id=r.election_id
WHERE e.state='OR';
-- Expected: 105 (98 + 7 Portland)
```

**After Plan 05 (discovery jurisdictions):**
```sql
SELECT jurisdiction_geoid, jurisdiction_name, election_date FROM essentials.discovery_jurisdictions WHERE state='OR';
-- Expected: 2 rows (geo_id='41' + geo_id='4159000')
```

**Section-split check (run after every plan):**
```sql
SELECT COUNT(*) FROM essentials.geofence_boundaries gb
WHERE gb.state='41'
  AND gb.geo_id NOT IN (SELECT geo_id FROM essentials.districts WHERE state IN ('or','OR','41'));
-- Expected: 0
```

---

## Security Domain

This phase is data-only (SQL migrations + JSX constant edit). No auth paths, no new API endpoints, no user input handling.

ASVS categories: not applicable for pure data migration phases.

---

## Sources

### Primary (HIGH confidence)
- Live production database queries — all schema facts, office counts, geo_ids, migration ledger [VERIFIED: 2026-05-30]
- `src/lib/discoveryCron.ts` — discovery cron sweep logic (no `cron_active` column) [VERIFIED: 2026-05-30]
- `src/pages/Landing.jsx` — COVERAGE_AREAS array structure [VERIFIED: 2026-05-30]
- Phase 55-01-SUMMARY.md, 55-02-SUMMARY.md — ME elections scaffold pattern [VERIFIED: 2026-05-30]
- Phase 73-01-SUMMARY.md — State of Oregon UUID, OR chambers [VERIFIED: 2026-05-30]
- Phase 74-03-SUMMARY.md — OR exec/federal external_ids, office_ids [VERIFIED: 2026-05-30]

### Secondary (MEDIUM confidence)
- `sos.oregon.gov/elections/Documents/open-offices.pdf` — OR primary date May 19, 2026 confirmed in document title [CITED: sos.oregon.gov]
- `sos.oregon.gov/voting/Pages/current-election.aspx` — OR May 19 primary confirmed [CITED: sos.oregon.gov]
- `multco.us/info/may-19-2026-primary-election` — Multnomah County confirms May 19 primary [CITED: multco.us]
- `portland.gov/auditor/elections/city-office-candidacy` — Portland 2026 races: D3, D4, Auditor confirmed [CITED: portland.gov]
- Wikipedia 2026 Oregon gubernatorial election — Kotek seeking second term, Nov 3 general [CITED: wikipedia.org]
- Wikipedia 2026 US Senate election in Oregon — Merkley seeking fourth term, primary results [CITED: wikipedia.org]

### Tertiary (LOW confidence)
- Oregon general election date November 3, 2026 — confirmed across multiple sources; cross-referenced [MEDIUM]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages, all patterns from existing phases
- Migration numbering: HIGH — verified from live DB
- OR office counts: HIGH — verified 30+60+1 Governor from live DB
- Portland 2026 races: HIGH — verified from portland.gov official source
- Election dates: HIGH — May 19 from sos.oregon.gov, Nov 3 from multiple sources
- Discovery cron mechanics: HIGH — verified from source code
- Race position_names: MEDIUM — inferred from ME pattern; no OR-specific precedent yet

**Research date:** 2026-05-30
**Valid until:** 2026-08-30 (stable election data; discovery URLs may change post-election)
