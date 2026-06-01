# Phase 85: Multnomah Elections + Discovery - Research

**Researched:** 2026-06-01
**Domain:** PostgreSQL migration / elections data seeding / discovery jurisdictions
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** November General only. OR May 19 primary has already passed. Seed race rows linked to 'OR 2026 General' election_id only.
**D-02:** Migration SELECTs the existing 'OR 2026 General' row. If it doesn't exist yet, INSERT it first. Same pattern as migration 240.
**D-03:** No retroactive primary race rows — clean slate for the general.
**D-04:** Researcher determines which Multnomah County commissioner seats + Chair are on the November 2026 ballot from multco.us or sos.oregon.gov. Only confirmed seats get race rows.
**D-05:** Same for the 5 smaller cities: researcher verifies which council seats are on the November 2026 ballot per city. Each city may have a different stagger pattern.
**D-06:** Race row position_name convention: follow Portland city races pattern — e.g., "Multnomah County Commissioner District 1", "Gresham City Council Position 1", etc. Researcher proposes; planner confirms.
**D-07:** ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING.
**D-08:** 2 plans. Plan 1 = migration 251: all race rows (county commissioner + all 5-city council), one BEGIN/COMMIT block. Plan 2 = migration 252: Multnomah County discovery_jurisdictions row + smoke test.
**D-09:** One discovery_jurisdictions row for Multnomah County area — geo_id='41051', jurisdiction_name='Multnomah County, Oregon'.
**D-10:** source_url = 'https://www.multco.us/elections'.
**D-11:** allowed_domains = ARRAY['multco.us', 'ballotpedia.org', 'sos.oregon.gov'].
**D-12:** election_date = '2026-11-03'. Cron arms automatically via election_date window.
**D-13:** WHERE NOT EXISTS guard (jurisdiction_geoid='41051' AND election_date='2026-11-03').
**D-14:** Smoke test uses a real unincorporated Multnomah County address. Researcher must find a valid test address.

### Claude's Discretion

None — all decisions are locked.

### Deferred Ideas (OUT OF SCOPE)

None listed.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ELECTIONS-01 | Multnomah County commissioner 2026 race rows seeded | County offices verified from DB; 2026 ballot seats confirmed from multco.us |
| ELECTIONS-02 | 2026 race rows seeded for each of the 5 smaller incorporated cities | All 5 city ballot seat counts verified from official city election pages |
| ELECTIONS-03 | discovery_jurisdictions row(s) created and cron armed for Multnomah County area | Pattern from migration 241; geo_id='41051'; election_date='2026-11-03' |
</phase_requirements>

## Summary

Phase 85 seeds 2026 November General election race rows for Multnomah County and 5 smaller cities, then adds a discovery_jurisdictions row to arm the weekly cron pipeline. This is a pure SQL migration phase — no code changes, no schema changes, no new tables.

The OR 2026 General election already exists in the DB (id=de10e3a7-f5c2-47e6-acd7-ee87be9413db). Migration 251 inserts race rows into essentials.races using office_ids looked up from the live DB. Migration 252 inserts one discovery_jurisdictions row for geo_id='41051'. Both migrations follow patterns already established in migrations 240 (races) and 241 (discovery).

**The critical research output for planning:** All 2026 ballot seats have been verified from official city and county sources. Office_ids for all candidate positions are confirmed from the live production database. The next migration number is 251.

**Primary recommendation:** Use migration 240 (Portland races) as the near-copy template for migration 251. Use migration 241 (OR discovery jurisdictions) as the near-copy template for migration 252.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Race row insertion | Database / Storage | — | SQL migration writes to essentials.races |
| Discovery jurisdiction row | Database / Storage | — | SQL migration writes to essentials.discovery_jurisdictions |
| Candidate discovery (cron) | API / Backend | — | discoveryCron.ts runs weekly, reads discovery_jurisdictions |
| Elections page display | Frontend Server (SSR) | API / Backend | Frontend calls /essentials/elections-by-address; backend joins races→offices→governments |
| Smoke test | API / Backend | — | Node.js script hits production DB + optionally the API endpoint |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pg (node-postgres) | 8.x (already installed) | Apply migration via pool.query | Same pattern as all prior migrations |
| tsx | (already installed) | Run TypeScript migration apply script | Same pattern as _apply-migration-244.ts |

No new packages needed for this phase.

## Package Legitimacy Audit

No new packages are installed in this phase. N/A.

## Architecture Patterns

### System Architecture Diagram

```
Migration 251 (race rows):
  SQL script
    → SELECT election_id FROM essentials.elections WHERE name='OR 2026 General'
    → INSERT INTO essentials.races (hardcoded office_ids) with ON CONFLICT DO NOTHING
    → POST-VERIFY: COUNT(*) check on inserted rows
    → INSERT INTO supabase_migrations.schema_migrations VERSION='251'

Migration 252 (discovery jurisdiction):
  SQL script
    → INSERT INTO essentials.discovery_jurisdictions WHERE NOT EXISTS (geo_id='41051' AND election_date='2026-11-03')
    → INSERT INTO supabase_migrations.schema_migrations VERSION='252'

Smoke test:
  _apply-migration-252.ts (or standalone script)
    → Hit /essentials/elections-by-address?address=<Corbett address>
    → Verify races are returned for the Multnomah County geo_id
```

### Recommended Project Structure

```
C:/EV-Accounts/backend/
├── migrations/
│   ├── 251_multnomah_elections.sql     ← Plan 01 output
│   └── 252_multnomah_discovery.sql     ← Plan 02 output
└── scripts/
    ├── _apply-migration-251.ts         ← Apply script for Plan 01
    └── _apply-migration-252.ts         ← Apply script for Plan 02
```

### Pattern 1: Race Row Migration (DO $$ DECLARE block)

```sql
-- Source: C:/EV-Accounts/backend/migrations/240_portland_city_races.sql
DO $$
DECLARE
  v_general_id UUID;
BEGIN
  SELECT id INTO v_general_id FROM essentials.elections
  WHERE name = 'OR 2026 General' AND state = 'OR';

  INSERT INTO essentials.races (id, election_id, office_id, position_name, primary_party, seats)
  VALUES (gen_random_uuid(), v_general_id, '<hardcoded-office-uuid>'::uuid,
    '<position_name>', NULL, 1)
  ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING;

END $$;
```

**Key rules:**
- `primary_party = NULL` (nonpartisan offices + general election pattern)
- `seats = 1` for all Multnomah offices (single-member races)
- `ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING` — partial index match
- office_id must be hardcoded UUID (no dynamic lookup at apply time)
- No migration ledger INSERT needed in the DO $$ block — add after END $$

### Pattern 2: Discovery Jurisdiction (WHERE NOT EXISTS)

```sql
-- Source: C:/EV-Accounts/backend/migrations/241_or_discovery_jurisdictions.sql
INSERT INTO essentials.discovery_jurisdictions
  (id, jurisdiction_geoid, jurisdiction_name, state, election_date, source_url, allowed_domains)
SELECT
  gen_random_uuid(), '41051', 'Multnomah County, Oregon', 'OR', '2026-11-03',
  'https://www.multco.us/elections',
  ARRAY['multco.us', 'ballotpedia.org', 'sos.oregon.gov']
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.discovery_jurisdictions
  WHERE jurisdiction_geoid = '41051' AND election_date = '2026-11-03'
);
```

### Anti-Patterns to Avoid

- **Dynamic office_id lookup in migration:** Never do `SELECT id FROM offices WHERE title=...` inside the race INSERT. Office_ids MUST be hardcoded from the live DB. Reason: if an office is accidentally duplicated, dynamic lookup returns wrong row.
- **Missing `WHERE primary_party IS NULL` on ON CONFLICT:** The partial index requires this clause. Without it, the ON CONFLICT does not match.
- **Inserting Auditor/Sheriff race rows:** Phase 85 scope is limited to commissioner seats and city council seats. The County Auditor and County Sheriff are also on the 2026 ballot, but they are NOT in Phase 85 scope (no office rows exist for them in the DB). Do not add them.
- **Using `election_type='general'` assumption:** The race rows only need `election_id`, `office_id`, `position_name`. The election_type is on the elections row, not the races row.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Race row insertion | Custom upsert logic | ON CONFLICT partial index pattern from migration 240 | Already established; matches partial index definition |
| Idempotency for discovery_jurisdictions | DELETE+INSERT | WHERE NOT EXISTS guard from migration 241 | Safe re-run; existing data preserved |
| Election_id lookup | Hardcoded UUID | SELECT by name+state (migration 240 pattern) | Resilient to DB restore; self-documenting |

## Verified 2026 Ballot Information

### Multnomah County Offices on 2026 November General Ballot

Source: [multco.us/info/multnomah-county-candidate-election-cycles](https://multco.us/info/multnomah-county-candidate-election-cycles) [VERIFIED: official Multnomah County website]

| Office | On 2026 Ballot? | Note |
|--------|----------------|------|
| County Chair | YES | Jessica Vega Pederson term ends 2026 |
| Commissioner District 1 | NO | Meghan Moyer term ends 2028 |
| Commissioner District 2 | YES | Shannon Singleton running for Chair; seat expires 2026 |
| Commissioner District 3 | NO | Julia Brim-Edwards term ends 2028 |
| Commissioner District 4 | NO | Vince Jones-Dixon term ends 2028 |
| County Auditor | YES | (NOT in Phase 85 scope — no office row in DB) |
| County Sheriff | YES | (NOT in Phase 85 scope — no office row in DB) |

**Phase 85 county race rows: 2 total** — County Chair + Commissioner District 2.

**IMPORTANT — RCV in 2026:** Starting 2026, Multnomah County uses Ranked Choice Voting for county offices at the November General Election. No May primary for county offices. `seats=1` is still correct — RCV is an election method, not a seats count change. [VERIFIED: multco.us/info/ranked-choice-voting-rcv]

### Gresham City Council — 2026 November Ballot

Source: [greshamoregon.gov/government/elections/](https://www.greshamoregon.gov/government/elections/) [VERIFIED: official City of Gresham website]

Positions on ballot: **Mayor + Position 2 + Position 4 + Position 6** (4-year terms, staggered odd/even positions)

| Office (external_id) | On 2026 Ballot? | Position Name |
|---------------------|----------------|---------------|
| Mayor Travis Stovall (-4131251) | YES | Gresham Mayor |
| Position 1 Kayla Brown (-4131252) | NO | — |
| Position 2 Eddy Morales (-4131253) | YES | Gresham City Council Position 2 |
| Position 3 Cathy Keathley (-4131254) | NO | — |
| Position 4 Jerry Hinton (-4131255) | YES | Gresham City Council Position 4 |
| Position 5 Sue Piazza (-4131256) | NO | — |
| Position 6 Janine Gladfelter (-4131257) | YES | Gresham City Council Position 6 |

**Gresham race rows: 4 total**

### Troutdale City Council — 2026 November Ballot

Source: [troutdaleoregon.gov/executive/page/elections](https://www.troutdaleoregon.gov/executive/page/elections) [VERIFIED: official City of Troutdale website]

3 City Councilor positions (at-large, no position numbers — all candidates run against each other; top 3 elected). Mayor is NOT on 2026 ballot (terms run 2025–2028).

| Office (external_id) | On 2026 Ballot? | Position Name |
|---------------------|----------------|---------------|
| Mayor David Ripma (-4174851) | NO | — |
| City Councilor Carol Allen (-4174852) | UNKNOWN | See note |
| City Councilor Jesse Davidson (-4174853) | YES | Troutdale City Council |
| City Councilor John Leamy (-4174854) | UNKNOWN | See note |
| City Councilor Glenn White (-4174855) | UNKNOWN | See note |
| City Councilor Geoffrey Wunn (-4174856) | YES | Troutdale City Council |
| City Councilor Zach Andrews (-4174857) | YES | Troutdale City Council |

The official Troutdale elections page confirms 3 positions on November 2026 ballot with incumbents: Zach Andrews, Geoffrey Wunn, Jesse Davidson. Troutdale runs all councilors at-large with no position numbers — the race is one 3-seat at-large race, but we seed 3 individual race rows following the convention established for other multi-seat bodies.

**Troutdale race rows: 3 total** (individual rows, one per seat, using the same at-large office_id pattern — but actually each seat maps to a distinct office row since all 6 councilors have distinct office rows in DB)

**IMPORTANT Troutdale position_name convention decision:** Since Troutdale uses no position numbers, use "Troutdale City Council Seat [N]" where N is determined by incumbents' external_id order (-4174852..-4174857). Map verified incumbents first: Davidson(-4174853)=Seat 1, Wunn(-4174856)=Seat 2, Andrews(-4174857)=Seat 3. Planner should confirm this naming.

[ASSUMED: the 3 identified incumbents (Davidson/Wunn/Andrews) match the confirmed 3 seats up for election. The Troutdale elections page confirms these 3 names; term end dates not separately published.]

### Fairview City Council — 2026 November Ballot

Source: [fairvieworegon.gov/378/Elections](https://fairvieworegon.gov/378/Elections) [VERIFIED: official City of Fairview website]

Positions on ballot: **Mayor + Position 4 + Position 5 + Position 6** (4-year terms)

| Office (external_id) | On 2026 Ballot? | Position Name |
|---------------------|----------------|---------------|
| Mayor Keith Kudrna (-4124251) | YES | Fairview Mayor |
| Position 1 Jeff Dennerline (-4124252) | NO | — |
| Position 2 Steve Marker (-4124253) | NO | — |
| Position 3 E'an Todd (-4124254) | NO | — |
| Position 4 Jenni Weber (-4124255) | YES | Fairview City Council Position 4 |
| Position 5 Steve Owen (-4124256) | YES | Fairview City Council Position 5 |
| Position 6 Paul Copeland (-4124257) | YES | Fairview City Council Position 6 |

**Fairview race rows: 4 total**

### Wood Village City Council — 2026 November Ballot

Source: [woodvillageor.gov/government/city-council/](https://www.woodvillageor.gov/government/city-council/) — term end dates [VERIFIED: official City of Wood Village website]

2 council seats with terms ending 12/31/2026 go on ballot. Mayor (council-selected, is_appointed_position=true) does NOT go on the ballot.

| Office (external_id) | Term Ends | On 2026 Ballot? | Position Name |
|---------------------|-----------|----------------|---------------|
| Mayor Jairo Rios-Campos (-4183951) | 12/31/2028 | NO (council-selected) | — |
| Council President Dara Tan (-4183952) | 12/31/2028 | NO | — |
| City Councilor John Miner (-4183953) | 12/31/2026 | YES | Wood Village City Council |
| City Councilor Charlene Gothard (-4183954) | 12/31/2026 | YES | Wood Village City Council |
| City Councilor Patricia Smith (-4183955) | 12/31/2028 | NO | — |

**Wood Village race rows: 2 total**

**Position name convention:** Wood Village uses no position numbers. Use "Wood Village City Council Seat 1" and "Wood Village City Council Seat 2". [ASSUMED: seat numbers are researcher-assigned since no official numbering exists]

### Maywood Park City Council — 2026 November Ballot

Source: [cityofmaywoodpark.com/government/elections](https://cityofmaywoodpark.com/government/elections) [VERIFIED: official City of Maywood Park website]

3 positions on ballot: Jeff Baltzell, Miriam Berman, Thomas Welander. Kevin Bussema's position is NOT up (2-years of 4 remaining). Mayor (council-selected) does NOT go on ballot.

| Office (external_id) | On 2026 Ballot? | Position Name |
|---------------------|----------------|---------------|
| Mayor Jim Akers (-4146731) | NO (council-selected) | — |
| Council President Kevin Bussema (-4146732) | NO | — |
| City Councilor Jeff Baltzell (-4146733) | YES | Maywood Park City Council |
| City Councilor Miriam Berman (-4146734) | YES | Maywood Park City Council |
| City Councilor Thomas Welander (-4146735) | YES | Maywood Park City Council |

**Maywood Park race rows: 3 total**

**Position name convention:** Maywood Park uses no position numbers. Use "Maywood Park City Council Seat 1/2/3". [ASSUMED: seat numbers are researcher-assigned]

**Special note — Maywood Park term lengths:** The Maywood Park elections page specifies that of the 3 winners, top 2 get 4-year terms and 3rd gets a 2-year term. This is a single election with asymmetric outcomes. The convention here is 3 separate race rows (same as all other cities). `seats=1` per row. [ASSUMED: this matches existing project convention; no explicit prior precedent for this scenario]

## Confirmed Production DB State

### OR 2026 General Election
- **election_id:** `de10e3a7-f5c2-47e6-acd7-ee87be9413db` [VERIFIED: live DB query]
- Already exists — no INSERT needed
- Current race count: 105 (state legislators + Portland + US House + Gov + US Senate)

### Migration Ledger State
- Applied: 242, 243, 244, 246 (via ledger)
- Applied (no ledger entry): 240, 241 (Portland races + OR discovery — applied via Supabase MCP)
- **Next migration number: 251** [VERIFIED: file listing shows 250 is last in migrations/ dir; 247/248/249/250 are SQL files but NOT in ledger — 247=headshots audit-only; 248/249/250=SD stances]
- 248, 249, 250 applied via Supabase MCP without CLI ledger entries

### Existing Discovery Jurisdictions for OR
Already exist (do NOT duplicate): [VERIFIED: live DB query]
- `jurisdiction_geoid='41'` — State of Oregon statewide
- `jurisdiction_geoid='4159000'` — City of Portland
- Missing: `jurisdiction_geoid='41051'` (Multnomah County) — Phase 85 adds this

## Production DB Office IDs (Verified)

All office_ids below are verified from the live production Supabase DB. [VERIFIED: live DB query via pg client]

### Multnomah County Commissioner Offices

| Position | Office_ID | Politician | External_ID |
|----------|-----------|------------|-------------|
| County Chair | `4b4821cf-9a97-4044-8132-706290d22e27` | Jessica Vega Pederson | -410001 |
| Commissioner District 2 | `3f01e9e8-bac6-4f0c-9793-ed14fbe2b22b` | Shannon Singleton | -410011 |

### Gresham City Council Offices (2026 ballot seats)

| Position | Office_ID | Politician | External_ID |
|----------|-----------|------------|-------------|
| Mayor | `4658f141-8cfd-4739-a959-23322a3182e7` | Travis Stovall | -4131251 |
| Position 2 | `be91f6d5-b46f-4ca2-9605-a1eb62b47c01` | Eddy Morales | -4131253 |
| Position 4 | `3c3cc31d-384e-4837-bd72-5c43faca3bc8` | Jerry Hinton | -4131255 |
| Position 6 | `4cf1b2b1-e005-48d7-b8a4-67040d8199cd` | Janine Gladfelter | -4131257 |

### Troutdale City Council Offices (2026 ballot seats)

| Position | Office_ID | Politician | External_ID |
|----------|-----------|------------|-------------|
| City Councilor (Jesse Davidson) | `0b80a890-44f1-47be-bf6b-b17fc3eef9cb` | Jesse Davidson | -4174853 |
| City Councilor (Geoffrey Wunn) | `f291ef52-c368-472c-bce1-948e803eaf23` | Geoffrey Wunn | -4174856 |
| City Councilor (Zach Andrews) | `10292aee-a4c1-4a74-88b2-b85e3ff40722` | Zach Andrews | -4174857 |

### Fairview City Council Offices (2026 ballot seats)

| Position | Office_ID | Politician | External_ID |
|----------|-----------|------------|-------------|
| Mayor | `0ff020a1-224f-4363-9c2f-8944b12ffcf2` | Keith Kudrna | -4124251 |
| Position 4 | `15f9aaf4-3d4b-4f34-9213-cb3a8ca19e94` | Jenni Weber | -4124255 |
| Position 5 | `15da3e65-a69f-429b-b0db-c4d450fb1c71` | Steve Owen | -4124256 |
| Position 6 | `db927fb8-7627-4a22-b486-9888c22559b4` | Paul Copeland | -4124257 |

### Wood Village City Council Offices (2026 ballot seats)

| Position | Office_ID | Politician | External_ID |
|----------|-----------|------------|-------------|
| City Councilor (John Miner) | `8e42ac99-e2bb-4ea5-b8f6-02372ca0b4a6` | John Miner | -4183953 |
| City Councilor (Charlene Gothard) | `c6c3259e-8883-4893-9fe4-50384d131f72` | Charlene Gothard | -4183954 |

### Maywood Park City Council Offices (2026 ballot seats)

| Position | Office_ID | Politician | External_ID |
|----------|-----------|------------|-------------|
| City Councilor (Jeff Baltzell) | `23370dd5-9602-40b7-a820-74fd4b5055a1` | Jeff Baltzell | -4146733 |
| City Councilor (Miriam Berman) | `bec2352c-e2ff-46c9-bdda-bd5bf13ae254` | Miriam Berman | -4146734 |
| City Councilor (Thomas Welander) | `bbd553e7-1e67-4504-96dc-5f5c017eabd5` | Thomas Welander | -4146735 |

## Position Name Conventions (D-06)

Proposed position names for migration 251:

### County (2 rows)
- `Multnomah County Chair`
- `Multnomah County Commissioner District 2`

### Gresham (4 rows)
- `Gresham Mayor`
- `Gresham City Council Position 2`
- `Gresham City Council Position 4`
- `Gresham City Council Position 6`

### Troutdale (3 rows)
- `Troutdale City Council Seat 1` (Jesse Davidson's seat)
- `Troutdale City Council Seat 2` (Geoffrey Wunn's seat)
- `Troutdale City Council Seat 3` (Zach Andrews' seat)

### Fairview (4 rows)
- `Fairview Mayor`
- `Fairview City Council Position 4`
- `Fairview City Council Position 5`
- `Fairview City Council Position 6`

### Wood Village (2 rows)
- `Wood Village City Council Seat 1` (John Miner's seat)
- `Wood Village City Council Seat 2` (Charlene Gothard's seat)

### Maywood Park (3 rows)
- `Maywood Park City Council Seat 1` (Jeff Baltzell's seat)
- `Maywood Park City Council Seat 2` (Miriam Berman's seat)
- `Maywood Park City Council Seat 3` (Thomas Welander's seat)

**Total race rows in migration 251: 18** (2 county + 4 Gresham + 3 Troutdale + 4 Fairview + 2 Wood Village + 3 Maywood Park)

## Smoke Test Address

**Corbett OR coordinate: (-122.2, 45.5)** [VERIFIED: live DB query — G4020 (geo_id=41051) present, G4110 absent]

This coordinate is confirmed as:
- WITHIN Multnomah County (G4020 geo_id=41051 returned)
- NOT within any incorporated city (G4110 absent)
- NOT within Portland (geo_id=4159000 absent)
- NOT within Gresham, Troutdale, Fairview, Wood Village, or Maywood Park

This is the same coordinate used in the Phase 83 smoke test (smoke-multnomah-county.ts) and is already documented as a verified unincorporated Multnomah County address.

**Smoke test for Plan 2:** The smoke test must verify that after migration 251 is applied, a Multnomah County address returns races in the Elections page. The test should either:
1. Query essentials.races directly for the OR 2026 General election linked to county and city offices, OR
2. Hit the elections-by-address API endpoint (if available for scripted testing)

Pattern: `electionService.getElectionsByGovernmentGeoIds(['41051', '4131250', '4174850', '4124250', '4183950', '4146730'])` returns results including the seeded races.

## Common Pitfalls

### Pitfall 1: Seeding Auditor/Sheriff Race Rows
**What goes wrong:** The County Auditor and County Sheriff are on the 2026 November ballot. The DB has no office rows for either position (only commissioners + chair exist). Inserting race rows with NULL office_id violates the races.office_id NOT NULL constraint, or creates orphaned rows.
**Why it happens:** The ballot list includes 4 county offices; Phase 85 only seeds the 2 commissioner roles.
**How to avoid:** Only create race rows for offices that exist in essentials.offices. Auditor/Sheriff are out of scope for Phase 85.
**Warning signs:** SQL error on NOT NULL constraint, or races with NULL office_id in post-verification.

### Pitfall 2: Wrong ON CONFLICT Clause
**What goes wrong:** Omitting `WHERE primary_party IS NULL` from the ON CONFLICT clause causes a "there is no unique or exclusion constraint matching the ON CONFLICT specification" error.
**Why it happens:** The unique index on essentials.races is a partial index: `(election_id, position_name) WHERE primary_party IS NULL`.
**How to avoid:** Always use exact pattern: `ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING`
**Warning signs:** Migration apply error mentioning "unique constraint" or "exclusion constraint."

### Pitfall 3: Troutdale Position Name Uniqueness
**What goes wrong:** Troutdale has 6 councilors sharing the same at-large district; if we use the same `position_name` for multiple races we'll hit ON CONFLICT DO NOTHING and only get 1 row.
**Why it happens:** Troutdale councilors have no position numbers.
**How to avoid:** Use distinct position names: "Troutdale City Council Seat 1", "Troutdale City Council Seat 2", "Troutdale City Council Seat 3".
**Warning signs:** Race count post-verify shows fewer than 3 Troutdale rows.

### Pitfall 4: Double-Seeding OR 2026 General
**What goes wrong:** The migration attempts to INSERT 'OR 2026 General' even though it already exists, causing a duplicate key error.
**Why it happens:** Migration 240 (Portland races) inserts the election if missing; migration 251 follows same pattern. The election row already exists.
**How to avoid:** Use INSERT ... WHERE NOT EXISTS pattern (same as migration 240's D-02), or omit the INSERT entirely since the election exists. Best: keep the INSERT with WHERE NOT EXISTS for idempotency.
**Warning signs:** Unique constraint error on essentials.elections.

### Pitfall 5: Maywood Park Mayor/Council President Not On Ballot
**What goes wrong:** Including Jim Akers (Mayor, is_appointed_position=true) or Kevin Bussema (Council President, term ends 2028) in race rows.
**Why it happens:** Mayor is listed first in DB; researcher might assume all council members are on ballot.
**How to avoid:** Only seed Baltzell, Berman, Welander for Maywood Park. Mayor is council-selected. Bussema's term doesn't expire in 2026.
**Warning signs:** 4 Maywood Park rows instead of 3.

### Pitfall 6: Wood Village Council-Selected Mayor On Ballot
**What goes wrong:** Including Jairo Rios-Campos (Mayor) in race rows. He is council-selected (is_appointed_position=true) and will be re-selected by the new council in January 2027 — not via public election.
**Why it happens:** Mayor appears first in DB.
**How to avoid:** Only seed John Miner and Charlene Gothard (term ends 12/31/2026).
**Warning signs:** 3 Wood Village rows instead of 2; or position_name includes "Mayor."

## Code Examples

### Migration 251 Structure Template

```sql
-- Migration 251: Multnomah County + smaller city 2026 race rows — Phase 85 Plan 01
-- Total: 18 race rows (2 county + 4 Gresham + 3 Troutdale + 4 Fairview + 2 Wood Village + 3 Maywood Park)

DO $$
DECLARE
  v_general_id UUID;
BEGIN
  -- OR 2026 General already exists; SELECT it
  SELECT id INTO v_general_id FROM essentials.elections
  WHERE name = 'OR 2026 General' AND state = 'OR';

  -- Optionally: guard for missing election (INSERT if not found)
  -- Following migration 240 pattern exactly

  -- MULTNOMAH COUNTY (2 rows)
  INSERT INTO essentials.races (id, election_id, office_id, position_name, primary_party, seats)
  VALUES (gen_random_uuid(), v_general_id, '4b4821cf-9a97-4044-8132-706290d22e27'::uuid,
    'Multnomah County Chair', NULL, 1)
  ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING;

  -- [continue for all 18 rows]

END $$;

-- Ledger entry
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('251')
ON CONFLICT (version) DO NOTHING;
```

### Migration 252 Structure Template

```sql
-- Migration 252: Multnomah County discovery_jurisdictions row — Phase 85 Plan 02
INSERT INTO essentials.discovery_jurisdictions
  (id, jurisdiction_geoid, jurisdiction_name, state, election_date, source_url, allowed_domains)
SELECT
  gen_random_uuid(), '41051', 'Multnomah County, Oregon', 'OR', '2026-11-03',
  'https://www.multco.us/elections',
  ARRAY['multco.us', 'ballotpedia.org', 'sos.oregon.gov']
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.discovery_jurisdictions
  WHERE jurisdiction_geoid = '41051' AND election_date = '2026-11-03'
);

INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('252')
ON CONFLICT (version) DO NOTHING;
```

### Post-Verification Pattern for Migration 251

```sql
-- Post-verify DO block (include in migration 251 before COMMIT):
DO $$
DECLARE
  v_county_count INTEGER;
  v_city_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_county_count
  FROM essentials.races r
  JOIN essentials.elections e ON e.id = r.election_id
  WHERE e.name = 'OR 2026 General'
    AND r.position_name ILIKE '%Multnomah County%';

  IF v_county_count < 2 THEN
    RAISE EXCEPTION 'Expected >= 2 Multnomah County race rows, found %', v_county_count;
  END IF;

  SELECT COUNT(*) INTO v_city_count
  FROM essentials.races r
  JOIN essentials.elections e ON e.id = r.election_id
  WHERE e.name = 'OR 2026 General'
    AND r.position_name ~ '(Gresham|Troutdale|Fairview|Wood Village|Maywood Park)';

  IF v_city_count < 16 THEN
    RAISE EXCEPTION 'Expected >= 16 city race rows, found %', v_city_count;
  END IF;

  RAISE NOTICE 'Post-verify PASSED: county_rows=%, city_rows=%', v_county_count, v_city_count;
END $$;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Multnomah County holds May primary for county offices | County offices move to November General only with RCV | 2026 (new) | No primary race rows for county offices; general is the only ballot |
| Primary party races (primary_party NOT NULL) | Nonpartisan races (primary_party IS NULL) | Established pattern | Partial index guard must use WHERE primary_party IS NULL |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Troutdale 3 seats up = Jesse Davidson, Geoffrey Wunn, Zach Andrews | Verified Ballot Info | Wrong incumbents' seats could be seeded; verify against official troutdale elections page if any doubt |
| A2 | Troutdale position names use "Seat 1/2/3" convention | Position Name Conventions | No harm at insert time (ON CONFLICT catches duplicates); only cosmetic |
| A3 | Wood Village "Seat 1/2/3" convention for John Miner and Charlene Gothard | Position Name Conventions | Cosmetic only; no uniqueness risk since names will differ |
| A4 | Maywood Park "Seat 1/2/3" convention for 3 councilors | Position Name Conventions | Cosmetic only |
| A5 | Maywood Park 2-year vs 4-year term asymmetry is handled by 3 separate race rows each with seats=1 | Race Row Count | If project convention requires different handling for 2-year seats, planner must address |
| A6 | Migration 248/249/250 (SD stances) were applied via Supabase MCP without ledger entries | Migration Numbering | If they ARE in ledger, next migration is still 251; if NOT and we skip to 253+, causes gap |

**Confirmed assumptions:** A6 is directly verified — `SELECT version FROM schema_migrations WHERE version IN ('247','248','249','250')` returned empty. The Supabase MCP-applied migrations have no CLI ledger entries. Next migration is 251.

## Open Questions

1. **Troutdale Seat Numbering**
   - What we know: 3 seats confirmed (Davidson, Wunn, Andrews); no official position numbers
   - What's unclear: Which incumbent maps to Seat 1, 2, 3
   - Recommendation: Assign by external_id order (Davidson=-4174853=Seat 1, Wunn=-4174856=Seat 2, Andrews=-4174857=Seat 3). Planner confirms.

2. **Maywood Park Term Length Encoding**
   - What we know: Top 2 winners get 4-year terms, 3rd gets 2-year term
   - What's unclear: Whether this affects the race row (seats, or a term_years column)
   - Recommendation: All 3 rows use `seats=1`. No term_years column exists in essentials.races schema. This is cosmetic only for Phase 85.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL (via pg client) | Migration apply | ✓ | Supabase hosted | — |
| Node.js + tsx | Apply script | ✓ | v24.13.0 | — |
| DATABASE_URL in .env | Migration apply | ✓ | Confirmed via .env read | — |
| OR 2026 General election row | Race row INSERT | ✓ | id=de10e3a7... | INSERT if missing |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (C:/EV-Accounts/backend/vitest.config.ts) + manual smoke scripts |
| Config file | C:/EV-Accounts/backend/vitest.config.ts |
| Quick run command | `npx tsx scripts/_apply-migration-252.ts` (apply + verify) |
| Full suite command | `npx tsx scripts/smoke-multnomah-elections.ts` (races + discovery verification) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ELECTIONS-01 | County race rows exist in DB | smoke/SQL count | Post-verify DO block in migration 251 | ❌ Wave 0 |
| ELECTIONS-02 | City race rows exist in DB | smoke/SQL count | Post-verify DO block in migration 251 | ❌ Wave 0 |
| ELECTIONS-03 | discovery_jurisdictions row exists, cron-armed | smoke/SQL count | Post-verify in migration 252 | ❌ Wave 0 |
| D-14 | Unincorporated Multnomah County address returns races | smoke | `npx tsx scripts/smoke-multnomah-elections.ts` | ❌ Wave 0 |

### Wave 0 Gaps
- [ ] `scripts/smoke-multnomah-elections.ts` — covers ELECTIONS-01/02/03 + D-14
- [ ] `scripts/_apply-migration-251.ts` — apply script for Plan 01
- [ ] `scripts/_apply-migration-252.ts` — apply script for Plan 02

## Security Domain

This phase writes to the essentials schema via developer-privileged DATABASE_URL (Supabase pooler connection). No public-facing auth surface introduced. No secrets are stored. No new API endpoints added. Migration scripts log no sensitive data. Security risk is minimal — same threat model as all prior migration phases.

## Sources

### Primary (HIGH confidence)
- [multco.us/info/multnomah-county-candidate-election-cycles](https://multco.us/info/multnomah-county-candidate-election-cycles) — confirmed 4 county offices on 2026 ballot; D1/D3/D4 NOT on ballot
- [multco.us/info/november-3-2026-general-election](https://multco.us/info/november-3-2026-general-election) — confirmed Chair, D2, Auditor, Sheriff on ballot
- [greshamoregon.gov/government/elections/](https://www.greshamoregon.gov/government/elections/) — Mayor + Position 2/4/6 on 2026 ballot
- [troutdaleoregon.gov/executive/page/elections](https://www.troutdaleoregon.gov/executive/page/elections) — 3 positions (Andrews/Wunn/Davidson)
- [fairvieworegon.gov/378/Elections](https://fairvieworegon.gov/378/Elections) — Mayor + Position 4/5/6 on 2026 ballot
- [cityofmaywoodpark.com/government/elections](https://cityofmaywoodpark.com/government/elections) — 3 positions (Baltzell/Berman/Welander) on 2026 ballot
- [woodvillageor.gov/government/city-council/](https://www.woodvillageor.gov/government/city-council/) — John Miner + Charlene Gothard terms end 12/31/2026
- C:/EV-Accounts/backend/migrations/240_portland_city_races.sql — canonical race row migration pattern
- C:/EV-Accounts/backend/migrations/241_or_discovery_jurisdictions.sql — canonical discovery_jurisdictions migration pattern
- Live production DB (queried via pg client) — all office_ids, election_id, discovery_jurisdictions state

### Secondary (MEDIUM confidence)
- [opb.org/article/2026/02/04/shannon-singleton-multnomah-county-chair/](https://www.opb.org/article/2026/02/04/shannon-singleton-multnomah-county-chair/) — Shannon Singleton running for Chair, confirming D2 seat will be open

## Metadata

**Confidence breakdown:**
- Ballot seats confirmed: HIGH — verified from official city/county websites
- Office IDs: HIGH — queried directly from live production DB
- Migration pattern: HIGH — verified from migration 240 and 241 source files
- Smoke test address: HIGH — verified from Phase 83 documented test + live DB geometry query
- Position name conventions: MEDIUM — researcher-proposed for at-large councils; planner should confirm

**Research date:** 2026-06-01
**Valid until:** 2026-08-25 (candidate filing deadline) — after this date, the actual candidates filing for these seats changes but the race rows don't.
