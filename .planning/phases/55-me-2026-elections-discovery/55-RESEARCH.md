# Phase 55: ME 2026 Elections + Discovery Pipeline - Research

**Researched:** 2026-05-20
**Domain:** Maine 2026 election seeding (elections, races, race_candidates), discovery_jurisdictions pipeline, PowerShell generator for 372 legislative race rows
**Confidence:** HIGH (schema verified from live source code; candidate data from Maine SOS + Ballotpedia/mainemorningstar.com cross-checked)

---

## Summary

Phase 55 seeds the 2026 Maine election infrastructure: two election rows (June 9 primary, Nov 3 general), statewide race rows with known candidates (Governor, US Senate, ME-01, ME-02), 372 empty legislative race rows (186 senate districts × 2 elections + 186 house districts × 2 elections = 372 total), two discovery_jurisdictions rows for cron-driven candidate discovery, and a Portland 2027 placeholder.

Two critical schema discrepancies exist between CONTEXT.md decisions and the actual codebase that the planner must address:

**Critical finding 1 — No `cron_active` column:** `essentials.discovery_jurisdictions` has no `cron_active` column. The cron sweep in `discoveryCron.ts` queries `WHERE election_date > now() AND election_date <= $1` (180-day horizon). There is NO on/off flag per jurisdiction row. For the Portland 2027 row, the `election_date='2027-11-02'` is naturally outside the 180-day window from any 2026 run date, so it is automatically inactive — no special column needed. The CONTEXT.md phrase "cron_active=true/false" is a conceptual description, not a column to insert.

**Critical finding 2 — `election_method` is on `chambers`, not `races`:** The `election_method` column was added in migration 157 to `essentials.chambers`, not `essentials.races`. The races table has no such column (confirmed: no ALTER TABLE adds `election_method` to races in any migration). The CONTEXT.md decision to set `election_method='rcv'` or `='plurality'` on race rows cannot be implemented. If election method metadata is needed, it belongs on the chamber level and is already set (e.g., Portland's RCV chamber was set in migration 177). Race rows for this phase should NOT attempt to set `election_method`.

The 372 legislative race rows require a generator script approach (matching the Phase 39/52 pattern) due to volume — writing 372 INSERT blocks by hand is error-prone. The discovery service automatically receives all known races for an (election_date, state) pair as context, so the scaffold rows serve as matching hints even with no candidates.

**Primary recommendation:** Use two separate migrations — one for election rows + statewide races (migration 182), one for the 372 legislative race scaffolding (migration 183) via generator script. Do not attempt to set `election_method` on any race row.

---

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Supabase (pool.query) | live | Direct SQL migration execution | All essentials schema writes use pool.query, never supabase client |
| psql .sql migration files | system | Apply election/race seed data | Established project pattern for all election seeds |
| PowerShell generator script (.ps1) | system | Generate 372 legislative race INSERT blocks | Proved in Phase 39/52 — 372 hand-written blocks is impractical |
| Maine SOS candidate list (Excel) | 2026-03-16 | Source of truth for filed candidates | Filed-with-SOS requirement from CONTEXT.md; listing page confirmed live |

### Database State (confirmed from migrations + STATE.md)

**Next migration number:** 182 (migrations 180 and 181 applied 2026-05-19; 171_la_council_votes.sql still unapplied)

**ME federal office UUIDs (from migration 170 + STATE.md):**
| Official | External ID | Notes |
|---------|-------------|-------|
| Susan M. Collins (R, Senator) | -230101 | Up for re-election 2026 |
| Angus S. King, Jr. (I, Senator) | -230102 | NOT up in 2026 (term ends 2030) |
| Chellie Pingree (D, ME-01) | -230201 | Incumbent, no D primary challenger |
| Jared Golden (D, ME-02) | -230202 | NOT running 2026 — ME-02 is open seat |

**ME Governor office:** External ID -230001 (Janet T. Mills, term-limited — 2026 race is open)

**ME STATE_UPPER district geo_ids:** `'23001'` through `'23035'`, `district_type='STATE_UPPER'`, `state='me'` (lowercase)

**ME STATE_LOWER district geo_ids:** `'23001'` through `'23151'`, `district_type='STATE_LOWER'`, `state='me'` (lowercase)

**Portland geoid:** `'2360545'` (confirmed from STATE.md and migration 177 G4110 city record)

**Maine FIPS (state geoid for discovery_jurisdictions):** `'23'`

### Elections Table Schema
```sql
-- essentials.elections columns:
id, name, election_date, election_type (primary|general|retention|special),
jurisdiction_level (federal|state|county|city|district), state (char 2),
description, created_at, updated_at
-- Unique constraint: (name, election_date, state)
```

### Races Table Schema
```sql
-- essentials.races columns:
id, election_id, office_id (nullable), position_name, primary_party (null for general),
seats, description, created_at, updated_at
-- Unique constraint (non-null primary_party): (election_id, position_name, primary_party)
-- Partial unique index (null primary_party): (election_id, position_name) WHERE primary_party IS NULL
-- NO election_method column on this table
```

### Discovery_Jurisdictions Table Schema
```sql
-- essentials.discovery_jurisdictions columns (confirmed from migration 070):
id, jurisdiction_geoid (text), jurisdiction_name (text), state (char 2),
election_date (date), source_url (text nullable), allowed_domains (text[] nullable),
created_at, updated_at
-- Unique index: (jurisdiction_geoid, election_date)
-- NO cron_active column — cron eligibility is purely date-based (within 180-day horizon)
```

---

## Architecture Patterns

### Pattern 1: Elections + Statewide Races (Migration 182)
The established pattern from migrations 162/163 (MA 2026):

```sql
-- Step 1: Insert election rows (idempotent ON CONFLICT)
INSERT INTO essentials.elections (name, election_date, election_type, jurisdiction_level, state)
VALUES ('2026 Maine State Primary', '2026-06-09', 'primary', 'state', 'ME')
ON CONFLICT (name, election_date, state) DO NOTHING;

INSERT INTO essentials.elections (name, election_date, election_type, jurisdiction_level, state)
VALUES ('2026 Maine General Election', '2026-11-03', 'general', 'state', 'ME')
ON CONFLICT (name, election_date, state) DO NOTHING;

-- Step 2: Portland 2027 elections row (bare — no races yet)
INSERT INTO essentials.elections (name, election_date, election_type, jurisdiction_level, state)
VALUES ('2027 Portland Municipal Election', '2027-11-02', 'general', 'city', 'ME')
ON CONFLICT (name, election_date, state) DO NOTHING;
```

**DO block pattern for races + candidates:**
```sql
DO $$
DECLARE
  v_primary_id UUID;
  v_general_id UUID;
  v_race UUID;
BEGIN
  SELECT id INTO v_primary_id FROM essentials.elections
  WHERE name = '2026 Maine State Primary' AND state = 'ME';

  SELECT id INTO v_general_id FROM essentials.elections
  WHERE name = '2026 Maine General Election' AND state = 'ME';

  -- Governor primary (all 16 candidates, one combined race row — no primary_party split)
  INSERT INTO essentials.races (election_id, office_id, position_name, primary_party, seats)
  VALUES (v_primary_id,
    (SELECT o.id FROM essentials.offices o
     JOIN essentials.politicians p ON p.id = o.politician_id
     WHERE p.external_id = -230001),
    'Governor of Maine', NULL, 1)
  ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING
  RETURNING id INTO v_race;
  -- ...candidates INSERT loop follows
END $$;
```

### Pattern 2: ON CONFLICT Clause Selection
The unique constraint on `races` has two forms depending on `primary_party`:

```sql
-- For races WITH primary_party (primary elections split by party):
ON CONFLICT (election_id, position_name, primary_party) DO NOTHING

-- For races WITHOUT primary_party (general elections, or combined-party primaries):
ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING
```

**Decision from CONTEXT.md:** Governor, US Senate, and Congressional primaries use ONE combined race row with `primary_party=NULL`. This means ALL primary races in this phase use the `WHERE primary_party IS NULL` form.

### Pattern 3: Discovery Jurisdictions (No cron_active column)
```sql
-- ME 2026 Primary — already within 180-day horizon from today (June 9 is ~20 days away)
INSERT INTO essentials.discovery_jurisdictions
  (jurisdiction_geoid, jurisdiction_name, state, election_date, source_url, allowed_domains)
VALUES
  ('23', 'State of Maine', 'ME', '2026-06-09',
   'https://www.maine.gov/sos/elections-voting/upcoming-elections',
   ARRAY['maine.gov', 'legislature.maine.gov', 'ballotpedia.org'])
ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING;

-- ME 2026 General
INSERT INTO essentials.discovery_jurisdictions
  (jurisdiction_geoid, jurisdiction_name, state, election_date, source_url, allowed_domains)
VALUES
  ('23', 'State of Maine', 'ME', '2026-11-03',
   'https://www.maine.gov/sos/elections-voting/upcoming-elections',
   ARRAY['maine.gov', 'legislature.maine.gov', 'ballotpedia.org'])
ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING;

-- Portland 2027 placeholder — outside 180-day horizon, naturally inactive until ~May 2027
INSERT INTO essentials.discovery_jurisdictions
  (jurisdiction_geoid, jurisdiction_name, state, election_date, source_url, allowed_domains)
VALUES
  ('2360545', 'City of Portland, Maine', 'ME', '2027-11-02',
   'https://www.portlandmaine.gov/172/Elections-Voting',
   ARRAY['portlandmaine.gov', 'ballotpedia.org'])
ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING;
```

### Pattern 4: 372 Legislative Race Scaffolding via Generator Script
For the 372 empty legislative race rows (35 senate + 151 house × 2 elections), use a PowerShell generator script similar to Phase 52's `generate_me_senate.ps1` and `generate_me_house.ps1`.

**Key linkage pattern:** office_id is resolved by querying districts + offices at migration time, not hardcoded:

```sql
-- Governor office lookup example (subquery pattern):
office_id = (
  SELECT o.id FROM essentials.offices o
  JOIN essentials.politicians p ON p.id = o.politician_id
  WHERE p.external_id = -230001
  LIMIT 1
)
```

For the 186 state senate + house district offices, the correct pattern is:
```sql
-- Senate district N office lookup
(SELECT o.id FROM essentials.offices o
 JOIN essentials.districts d ON d.id = o.district_id
 JOIN essentials.chambers ch ON ch.id = o.chamber_id
 WHERE d.geo_id = '23' || lpad(N::text, 3, '0')
   AND d.district_type = 'STATE_UPPER'
   AND d.state = 'me'
   AND ch.name = 'Maine Senate'
 LIMIT 1)
```

The generator script produces one INSERT block per district per election (2 elections × 186 districts = 372 blocks).

### Pattern 5: race_candidates with source citing Maine SOS
```sql
-- Source citation: Maine SOS candidate list page URL (same URL for all ME entries)
INSERT INTO essentials.race_candidates
  (race_id, full_name, first_name, last_name, politician_id, is_incumbent, candidate_status, source)
SELECT v_race, 'Susan M. Collins', 'Susan', 'Collins',
       (SELECT id FROM essentials.politicians WHERE external_id = -230101),
       true, 'active', 'https://www.maine.gov/sos/elections-voting/upcoming-elections'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.race_candidates
  WHERE race_id = v_race AND full_name = 'Susan M. Collins'
);
```

### Recommended Migration Structure
```
C:/EV-Accounts/backend/migrations/
├── 182_me_2026_elections_foundation.sql   # elections rows + statewide races + candidates + discovery_jurisdictions
├── generate_me_legislative_races.ps1      # generator script for 372 race rows
└── 183_me_2026_legislative_races.sql      # generated: 372 legislative race scaffolding
```

### Anti-Patterns to Avoid
- **Setting `election_method` on race rows:** Column does not exist on `essentials.races`. Attempting to INSERT it will fail.
- **Adding a `cron_active` column to discovery_jurisdictions:** Column does not exist and must NOT be added. The cron uses date horizon only.
- **Splitting Governor/Senate/Congressional primaries by party:** CONTEXT.md decision is one combined race row with `primary_party=NULL` for all statewide primaries.
- **Inserting `slug` into chambers:** GENERATED ALWAYS — never INSERT slug.
- **Using `state='ME'` for STATE_UPPER/STATE_LOWER district lookups:** ME legislature districts use `state='me'` lowercase.
- **Hardcoding election UUIDs:** Always use subquery `WHERE name = '...' AND state = 'ME'` to fetch election_id.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 372 legislative race rows | Write 372 INSERTs by hand | PowerShell generator script | Phase 52 proved 186 blocks by hand is error-prone; 372 is worse |
| cron_active flag | Add a cron_active column + logic | Date-based horizon (existing cron query) | Column doesn't exist; Portland 2027 is naturally inactive by date |
| election_method on races | Add election_method to race rows | Skip entirely for this phase | Column is on chambers, not races; not required for discovery pipeline |
| Position name lookup | Hardcode position strings | `WHERE geo_id = '23' || lpad(N::text,3,'0')` | Verified pattern from Phase 49/52 live DB |

---

## Common Pitfalls

### Pitfall 1: No `cron_active` Column
**What goes wrong:** Migration fails with `column "cron_active" of relation "discovery_jurisdictions" does not exist`.
**Why it happens:** CONTEXT.md uses `cron_active=true/false` language conceptually, but the column was never added to the schema.
**How to avoid:** Do NOT include `cron_active` in any INSERT or UPDATE. Cron eligibility is purely `election_date > now() AND election_date <= now() + 180 days`.
**Warning signs:** psql error on INSERT into discovery_jurisdictions.

### Pitfall 2: `election_method` Does Not Exist on `races`
**What goes wrong:** Migration fails with `column "election_method" of relation "races" does not exist`.
**Why it happens:** CONTEXT.md decision referenced this as a races column but it was added to `chambers` in migration 157.
**How to avoid:** Omit `election_method` from all INSERT INTO essentials.races statements. It is NOT a races column.
**Warning signs:** psql error on INSERT into essentials.races.

### Pitfall 3: ME Primary Is Already in the 180-Day Window
**What goes wrong:** Discovery cron runs immediately after migration and processes both ME rows (primary and general) — not just the general as expected.
**Why it happens:** June 9, 2026 is only ~20 days from the migration date (2026-05-20). The cron will pick up the primary row immediately. The agent will try to find candidates for ~375 races.
**How to avoid:** Expect the cron to immediately run for the primary row. The large known-races list (375 rows) is passed as context but the agent still does only 1 web search with `max_uses=1` (because source_url is provided). Token cost ~$0.017/run × 2 rows = ~$0.034 per weekly sweep.
**Warning signs:** Sweep processes 2 ME jurisdictions immediately.

### Pitfall 4: Janet Mills Withdrew from Senate Race (CONTEXT.md Outdated)
**What goes wrong:** Seeding Janet Mills as a US Senate primary candidate when she suspended her campaign April 30, 2026.
**Why it happens:** CONTEXT.md predates the April 30 withdrawal announcement.
**How to avoid:** Do NOT seed Janet Mills as a US Senate candidate. The confirmed D primary candidates for US Senate are: Graham Platner + David Costello.
**Warning signs:** Outdated candidate count (3D listed, Mills is no longer active).

### Pitfall 5: Governor Primary Candidate Count Mismatch
**What goes wrong:** CONTEXT.md says "6D + 10R" for Governor; current data shows 5D + ~4-6R.
**Why it happens:** CONTEXT.md was written before the March 16 filing deadline; final count differs.
**How to avoid:** Use Maine SOS Primary Candidate List Excel (posted 3/16/2026) as source of truth. Known D candidates: Shenna Bellows, Troy Jackson, Angus King III, Hannah Pingree, Nirav Shah (5D). Known R candidates: Jonathan Bush, Bobby Charles, David Jones, Garrett Mason (4R, plus possible others). Verify count from SOS Excel before seeding.
**Warning signs:** Candidate count doesn't match SOS Excel.

### Pitfall 6: ME-02 Is an Open Seat (Jared Golden Not Running)
**What goes wrong:** Seeding Jared Golden as an incumbent candidate in the ME-02 race.
**Why it happens:** Jared Golden is the current ME-02 incumbent but is NOT running for re-election in 2026. ME-02 is an open seat.
**How to avoid:** The ME-02 race rows should have `is_incumbent=false` for all candidates. Known D primary candidates: Matt Dunlap, Jordan Wood, Joe Baldacci, Paige Loud. Known R: Paul LePage (no primary challenger).
**Warning signs:** Seeding Golden with `is_incumbent=true` for 2026.

### Pitfall 7: ME-01 Chellie Pingree Has No Primary Challenger
**What goes wrong:** Creating a primary race row for ME-01 when there is no D primary.
**Why it happens:** Chellie Pingree faces no D challenger; only R primary (Russell vs. Pietrowicz).
**How to avoid:** Only create a General race row for ME-01 with Pingree as D candidate. For the primary, either skip a ME-01 primary row entirely or create a R-primary-only row if needed for the R candidates.
**Note:** CONTEXT.md says "one race row per office per election cycle, not split by party primary" — so create one combined primary row with all filed candidates for ME-01.
**Warning signs:** Creating a "Democratic Primary ME-01" row when no such primary exists.

### Pitfall 8: Race Position_Name Must Be Unique per (election_id, NULL party)
**What goes wrong:** Duplicate race rows for the same position in the same election.
**Why it happens:** Not using ON CONFLICT correctly for null primary_party races.
**How to avoid:** Use `ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING` for all combined (non-party-split) primary races and all general races.
**Warning signs:** Duplicate races appear in the elections view.

### Pitfall 9: office_id Lookup for 372 Legislative Race Rows
**What goes wrong:** Setting `office_id=NULL` on legislative race rows when the offices exist from Phase 52.
**Why it happens:** Phase 52 seeded all 186 senate + house offices; the race rows should link to them.
**How to avoid:** Use the district-based subquery lookup (`WHERE geo_id = '23' || lpad(N::text,3,'0') AND district_type = 'STATE_UPPER/STATE_LOWER'`) to find office_id for each district.
**Warning signs:** Race rows show `office_id=NULL` when offices already exist; races don't appear on politician profiles.

### Pitfall 10: Discovery Scale — 375 Known Races as Context
**What goes wrong:** Agent context overwhelmed by 375 race rows (all legislative + statewide).
**Why it happens:** discoveryService passes ALL races for (election_date, state) as context. With 372 legislative scaffolding rows + statewide rows, the prompt becomes large.
**How to avoid:** The architecture already handles this — the known_races list is just matching context, not instruction scope. Agent only does 1 web search (max_uses=1 with source_url). The SOS Excel URL is the right source_url as it lists all candidates. Token cost is acceptable (~$0.017/run).
**Warning signs:** Agent returning 0 candidates. Check if source URL is returning pre-fetched content correctly.

---

## Candidate Data (Current as of 2026-05-20)

### 2026 Maine Governor Primary (June 9) — One Combined Race Row
**Source:** Maine Morning Star 2026-03-16, search results cross-checked

Democratic primary (5 candidates):
- Shenna Bellows — current Secretary of State
- Troy Jackson — former Maine Senate President
- Angus King III — businessman (not Senator Angus King Jr.)
- Hannah Pingree — current ME House Speaker
- Nirav Shah — public health official

Republican primary (4+ candidates, verify from SOS Excel):
- Jonathan Bush
- Bobby Charles
- David Jones
- Garrett Mason

Independent/General (non-party): Richard Bennett, W. Edward Crockett, John Glowa, Derek Levasseur, Alexander Murchison

### 2026 US Senate (Maine)
Primary (June 9):
- Susan M. Collins (R) — uncontested in R primary; `is_incumbent=true`; politician_id from external_id -230101
- Graham Platner (D) — SOS-filed, confirmed via Maine Morning Star
- David Costello (D) — SOS-filed
- ~~Janet Mills~~ — WITHDREW April 30, 2026; do NOT seed
- Carmen Calabrese (R) — challenging Collins; SOS-filed
- Daniel Smeriglio (R) — challenging Collins; SOS-filed

General (Nov 3):
- Susan M. Collins (R) + Democratic primary winner

### 2026 ME-01 Congressional Race
Primary (June 9): Chellie Pingree (D, no challenger) + Ronald Russell (R) + Joshua Pietrowicz (R)
General (Nov 3): Chellie Pingree (D, `is_incumbent=true`, politician_id from external_id -230201) + R primary winner

### 2026 ME-02 Congressional Race (Open Seat — Jared Golden not running)
Primary (June 9): Matt Dunlap (D), Jordan Wood (D), Joe Baldacci (D), Paige Loud (D) + Paul LePage (R, uncontested)
General (Nov 3): D primary winner + Paul LePage (R)

**Source for all candidate data:** Maine Morning Star 2026-03-16 (behind 403), search results from Ballotpedia/mainepublic.org/mainemorningstar.com cross-checked — MEDIUM confidence. Verify final counts against Maine SOS Excel at `https://www.maine.gov/sos/sites/maine.gov.sos/files/inline-files/2026%20Primary%20Candidate%20List%20posting%20FINAL%203.16.26.xlsx` before seeding.

---

## Code Examples

### Verified: Discovery Sweep Query (from discoveryCron.ts)
```typescript
// Source: C:/EV-Accounts/backend/src/lib/discoveryCron.ts line 203
const SWEEP_HORIZON_DAYS = 180;
const horizon = new Date();
horizon.setUTCDate(horizon.getUTCDate() + SWEEP_HORIZON_DAYS);

const jurisdictionsResult = await pool.query(
  `SELECT id, jurisdiction_name
     FROM essentials.discovery_jurisdictions
    WHERE election_date > now()
      AND election_date <= $1
    ORDER BY election_date ASC`,
  [horizon]
);
// NO cron_active filter — all rows within 180 days are processed
```

### Verified: Race Insert with Null primary_party (general election pattern)
```sql
-- Source: Migration 163 pattern, verified
INSERT INTO essentials.races (election_id, office_id, position_name, primary_party, seats)
VALUES (v_general_id, v_office_id, 'Governor of Maine', NULL, 1)
ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING
RETURNING id INTO v_race;

-- Fetch if already existed (ON CONFLICT RETURNING returns nothing on conflict)
IF v_race IS NULL THEN
  SELECT id INTO v_race FROM essentials.races
  WHERE election_id = v_general_id
    AND position_name = 'Governor of Maine'
    AND primary_party IS NULL;
END IF;
```

### Verified: Legislative Race Scaffold Block (generator output)
```sql
-- Pattern for one district × one election (for generator script to repeat 372 times)
-- Source: adapted from migration 162/163 patterns
DO $$
DECLARE
  v_primary_id UUID;
  v_general_id UUID;
  v_race UUID;
BEGIN
  SELECT id INTO v_primary_id FROM essentials.elections
  WHERE name = '2026 Maine State Primary' AND state = 'ME';

  SELECT id INTO v_general_id FROM essentials.elections
  WHERE name = '2026 Maine General Election' AND state = 'ME';

  -- Senate District 1: Primary
  INSERT INTO essentials.races (election_id, office_id, position_name, primary_party, seats)
  VALUES (v_primary_id,
    (SELECT o.id FROM essentials.offices o
     JOIN essentials.districts d ON d.id = o.district_id
     JOIN essentials.chambers ch ON ch.id = o.chamber_id
     WHERE d.geo_id = '23001' AND d.district_type = 'STATE_UPPER' AND d.state = 'me'
       AND ch.name = 'Maine Senate' LIMIT 1),
    'ME State Senate District 1', NULL, 1)
  ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING;

  -- Senate District 1: General
  INSERT INTO essentials.races (election_id, office_id, position_name, primary_party, seats)
  VALUES (v_general_id,
    (SELECT o.id FROM essentials.offices o
     JOIN essentials.districts d ON d.id = o.district_id
     JOIN essentials.chambers ch ON ch.id = o.chamber_id
     WHERE d.geo_id = '23001' AND d.district_type = 'STATE_UPPER' AND d.state = 'me'
       AND ch.name = 'Maine Senate' LIMIT 1),
    'ME State Senate District 1', NULL, 1)
  ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING;
END $$;
```

### Verified: Discovery Jurisdictions Insert (no cron_active)
```sql
-- Source: Migration 164 pattern, adapted for ME
INSERT INTO essentials.discovery_jurisdictions
  (jurisdiction_geoid, jurisdiction_name, state, election_date, source_url, allowed_domains)
VALUES
  ('23', 'State of Maine', 'ME', '2026-06-09',
   'https://www.maine.gov/sos/elections-voting/upcoming-elections',
   ARRAY['maine.gov', 'legislature.maine.gov', 'ballotpedia.org'])
ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING;
```

### Verified: Cron Sweep Confirmation Query
```sql
-- After migration, verify ME rows are picked up by next cron run:
SELECT jurisdiction_geoid, jurisdiction_name, election_date,
       election_date - CURRENT_DATE AS days_until_election
FROM essentials.discovery_jurisdictions
WHERE state = 'ME'
ORDER BY election_date;
-- ME 2026-06-09 row: ~20 days — IN scope for next sweep
-- ME 2026-11-03 row: ~166 days — IN scope for next sweep (< 180 days)
-- Portland 2027-11-02 row: ~532 days — OUT of scope until ~May 2027
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Party-split primary rows (e.g., "Democratic Primary Governor") | Combined primary row with `primary_party=NULL` for statewide races | Decided in CONTEXT.md; matches MA pattern for key statewide races |
| cron_active flag for controlling discovery | Date-based 180-day horizon (built into discoveryCron.ts) | No column to add; Portland 2027 is naturally inactive by date |

**No deprecated patterns in this phase** — all election/races patterns are from migrations 162-164 (Phase 44), the most recent elections seeding work.

---

## Open Questions

1. **Exact Governor Republican primary candidate count**
   - What we know: 4 named R candidates (Bush, Charles, Jones, Mason). CONTEXT.md said "10R" but this appears overstated.
   - What's unclear: Whether additional R candidates filed by March 16 deadline.
   - Recommendation: Download and read the SOS Excel file at `https://www.maine.gov/sos/sites/maine.gov.sos/files/inline-files/2026%20Primary%20Candidate%20List%20posting%20FINAL%203.16.26.xlsx` before seeding Governor race candidates.

2. **Joe Baldacci (D, ME-02) same as Senator Joe Baldacci (ME District 9)?**
   - What we know: ME Senate District 9 is represented by Joseph M. Baldacci (Democrat, external_id=-231009). ME-02 has a D primary candidate named "Joe Baldacci" running for Congress.
   - What's unclear: Whether this is the same person (senator who filed to run for Congress) or a different Joe Baldacci.
   - Recommendation: If the same person, link to politician_id from external_id=-231009. If different, use NULL politician_id. Verify from candidate filing or biographical info.

3. **ME House D29 vacancy — race row needed?**
   - What we know: CONTEXT.md says "create the race row but expect no incumbent candidate". The district 29 office is vacant (Kathy Javner deceased, per Phase 52).
   - What's unclear: Whether candidates filed for the special election to fill D29, or whether the June 2026 primary serves as the general election replacement mechanism.
   - Recommendation: Create the race row for D29 with no candidates (empty scaffold). Discovery pipeline will find candidates if any filed. No `is_incumbent` candidate row.

4. **Position name format for 372 legislative races**
   - What we know: MA used "MA State Senate 2nd Middlesex District" (compound with district label). ME district labels are "State Senate District N".
   - What's unclear: Whether to use "ME State Senate District 1" or "Maine State Senate District 1" or "State Senate District 1".
   - Recommendation: Use "ME State Senate District N" and "ME State House District N" (matches state abbreviation pattern used for other ME races like "U.S. House ME-01"). This is Claude's discretion per CONTEXT.md.

5. **Graham Platner SOS-filed confirmation**
   - What we know: Platner spoke at the Maine Democratic convention (May 2026), is the presumptive D nominee for Senate after Mills withdrew. Multiple news sources confirm him as a primary candidate.
   - What's unclear: The CONTEXT.md asked to "verify he's SOS-filed" — this research found multiple credible sources confirming he's on the June 9 primary ballot.
   - Recommendation: HIGH confidence Platner is SOS-filed. The March 16 deadline passed; he is confirmed on primary ballot per multiple sources. Seed with `source='https://www.maine.gov/sos/elections-voting/upcoming-elections'`.

6. **Discovery agent scale — 375 races in context**
   - What we know: With 372 legislative scaffold rows + statewide, each ME 2026 cron run receives ~375 `knownRaces` entries as context. The agent uses these only for matching, not as a constraint on what to find.
   - What's unclear: Whether 375 race names in the prompt causes token budget issues for the agent's `max_tokens=4096`.
   - Recommendation: The agent output (report_candidates tool call) is what consumes max_tokens budget — the known_races list is in the INPUT, which is unbounded on the input side. Input token costs are ~$3/MTok for Sonnet (acceptable). The plan should note this is acceptable and not try to segment jurisdictions.

---

## Sources

### Primary (HIGH confidence)
- `C:/EV-Accounts/backend/src/lib/discoveryCron.ts` — confirmed NO cron_active column; sweep uses 180-day horizon date filter only
- `C:/EV-Accounts/backend/src/lib/discoveryService.ts` — confirmed races loaded by (election_date, state); knownRaces passed as context to agent
- `C:/EV-Accounts/backend/migrations/070_discovery_tables.sql` — confirmed discovery_jurisdictions columns: no cron_active; unique on (jurisdiction_geoid, election_date)
- `C:/EV-Accounts/backend/migrations/042_election_schema.sql` — confirmed elections + races + race_candidates columns; no election_method on races
- `C:/EV-Accounts/backend/migrations/044_election_dedup_constraints.sql` — confirmed unique constraints: (name,date,state) on elections; (election_id, position_name, primary_party) on races + partial index for NULL
- `C:/EV-Accounts/backend/migrations/157_cambridge_government_chambers.sql` — confirmed election_method is ALTER TABLE on essentials.chambers, not races
- `C:/EV-Accounts/backend/migrations/162_ma_2026_elections_foundation.sql` — elections insert pattern with ON CONFLICT
- `C:/EV-Accounts/backend/migrations/163_ma_2026_key_races.sql` — DO block pattern for races + candidates; RETURNING + fallback SELECT pattern
- `C:/EV-Accounts/backend/migrations/164_ma_discovery_jurisdictions_cambridge_placeholder.sql` — discovery_jurisdictions insert pattern
- `C:/EV-Accounts/backend/migrations/170_me_federal_officials.sql` — confirmed ME federal politician external_ids and office UUIDs
- `C:/EV-Accounts/backend/migrations/169_me_state_executives.sql` — confirmed Governor office (external_id -230001)
- `.planning/STATE.md` — confirmed next migration is 182; Portland geo_id=2360545; ME FIPS=23; federal external_ids
- `.planning/phases/52-me-state-legislature/52-RESEARCH.md` — district geo_id patterns, state='me' lowercase for STATE_UPPER/STATE_LOWER
- `https://www.maine.gov/sos/elections-voting/upcoming-elections` — confirmed SOS candidate list page; Excel file at `2026 Primary Candidate List posting FINAL 3.16.26.xlsx`

### Secondary (MEDIUM confidence)
- Maine Morning Star 2026-03-16 search result — confirmed final filing list (behind 403, only abstract available)
- mainepublic.org 2026-05-03 — confirmed Graham Platner at Democratic convention (SOS-filed)
- washingtonpost.com 2026-04-30 — confirmed Janet Mills withdrew from Senate race
- Search results from mainemorningstar.com, mainepublic.org, pressherald.com — confirmed Platner as presumptive D nominee; Collins uncontested in R primary
- Search results from ballotpedia.org — confirmed ME-02 open seat; ME-01 Pingree no D challenger

### Tertiary (LOW confidence)
- Governor Republican candidate list (4 names: Bush, Charles, Jones, Mason) — from search results only; may be incomplete; verify from SOS Excel
- Governor Democratic candidate count "5D" — candidate names from search results confirmed by multiple sources but should be verified against SOS Excel

---

## Metadata

**Confidence breakdown:**
- Schema facts (no cron_active, no election_method on races): HIGH — verified from source code
- Migration structure and patterns: HIGH — verified from migrations 162/163/164
- Next migration number (182): HIGH — confirmed from STATE.md
- District geo_id patterns for office_id lookup: HIGH — from Phase 52 research verified live DB
- Maine SOS candidate list URL: HIGH — confirmed from maine.gov
- Portland elections URL: HIGH — confirmed from portlandmaine.gov search
- Current statewide candidate lists (US Senate, ME-02): MEDIUM — from news sources, not directly from SOS Excel
- Governor candidate full list: LOW — Republican primary count uncertain; verify from SOS Excel

**Research date:** 2026-05-20
**Valid until:** 2026-06-09 (primary election date; candidate list finalized at filing deadline 2026-03-16 but withdrawals tracked separately)
