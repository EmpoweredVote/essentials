# Phase 44: MA 2026 Elections + Challengers — Research

**Researched:** 2026-05-17
**Domain:** Elections schema, races modeling, discovery_jurisdictions, MA 2026 calendar
**Confidence:** HIGH (schema from live DB + migration source; calendar from official sources)

## Summary

Phase 44 seeds the 2026 Massachusetts election infrastructure: a general election row (November 3, 2026), a primary row for the Azeem 2nd Middlesex State Senate race (September 1, 2026), discovery_jurisdictions for MA state/federal discovery runs, and a 2027 Cambridge placeholder election row.

The election schema is three-level: `elections` → `races` → `race_candidates`. Races tie to elections via `election_id`; candidates tie to races via `race_id`. State-level races without a linked office use `office_id = NULL` and are surfaced via the statewide query path (`e.state = 'MA'`). District-level races with an `office_id` are surfaced via the district path. Both query paths filter by election date against `CURRENT_DATE`.

The MA 2026 election calendar is confirmed from sec.state.ma.us and Ballotpedia: primary September 1, 2026; general November 3, 2026. All 40 state senate seats and all 160 state house seats are up. All 9 congressional seats are up. Ed Markey's Class II Senate seat is up. The 2nd Middlesex Democratic primary has 5 known candidates including Azeem. The 2027 Cambridge placeholder election is a minimal row with `election_type='general'`, `jurisdiction_level='city'`, election_date in the far future (won't be swept by the 180-day discovery cron).

**Primary recommendation:** Next migration is 162 (160 and 161 are taken). Use three migration files: 162 (elections + Azeem primary + known candidates), 163 (discovery_jurisdictions for MA), 164 (2027 Cambridge placeholder).

---

## Schema Reference (Verified from Live DB + Migrations)

### essentials.elections columns
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default uuid_generate_v4() | |
| name | text | NOT NULL | e.g. "2026 Massachusetts General" |
| election_date | date | NOT NULL | PostgreSQL date type |
| election_type | text | NOT NULL, CHECK IN ('primary','general','retention','special') | |
| jurisdiction_level | text | NOT NULL, CHECK IN ('federal','state','county','city','district') | |
| state | character(2) | nullable | e.g. 'MA' |
| description | text | nullable | |
| created_at | timestamptz | NOT NULL DEFAULT now() | |
| updated_at | timestamptz | NOT NULL DEFAULT now() | |

**Unique constraint:** `UNIQUE (name, election_date, state)` — use ON CONFLICT on this.

### essentials.races columns
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| election_id | uuid | NOT NULL, FK → elections | |
| office_id | uuid | nullable, FK → offices | NULL for statewide races without DB office |
| position_name | text | NOT NULL | e.g. "MA State Senate 2nd Middlesex District" |
| primary_party | text | nullable | Only for primary elections |
| seats | int | NOT NULL DEFAULT 1 | |
| description | text | nullable | |

**Unique constraints:**
- `UNIQUE (election_id, position_name, primary_party)` (named constraint)
- Partial unique index: `UNIQUE (election_id, position_name) WHERE primary_party IS NULL`

ON CONFLICT pattern for general races: `ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING`

### essentials.race_candidates columns
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| race_id | uuid | NOT NULL, FK → races | |
| politician_id | uuid | nullable, FK → politicians | NULL for challengers without a politician record |
| full_name | text | NOT NULL | |
| first_name | text | nullable | |
| last_name | text | nullable | |
| photo_url | text | nullable | |
| is_incumbent | boolean | NOT NULL DEFAULT false | |
| candidate_status | text | DEFAULT 'active', CHECK IN ('active','withdrawn','filed') | |
| last_verified_at | timestamptz | nullable | |
| source | text | nullable | e.g. 'sos_ma', 'ballotpedia', 'manual' |
| external_id | text | nullable | SoS filing ID if available |

**Partial unique index on external_id:** `UNIQUE (external_id) WHERE external_id IS NOT NULL`

### essentials.discovery_jurisdictions columns
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| jurisdiction_geoid | text | NOT NULL | |
| jurisdiction_name | text | NOT NULL | |
| state | character(2) | NOT NULL | |
| election_date | date | NOT NULL | |
| source_url | text | nullable | |
| allowed_domains | text[] | nullable | Restricts agent fetch domains |

**Unique index:** `UNIQUE (jurisdiction_geoid, election_date)` — use ON CONFLICT on this.

**CRITICAL — NO is_active column.** The table has no active/inactive flag. The discovery cron only sweeps jurisdictions with `election_date > now() AND election_date <= now() + 180 days`. For "inactive" status, use an election_date beyond 180 days from today. November 2027 is ~18 months away — naturally outside the horizon.

---

## MA 2026 Election Calendar (Verified — HIGH confidence)

**Source:** sec.state.ma.us official elections division + Ballotpedia + Wikipedia

| Date | Event | Jurisdiction level |
|------|-------|--------------------|
| September 1, 2026 | State Primary | state |
| November 3, 2026 | State General Election | state |

**Offices up in 2026:**
- US Senate: Ed Markey's Class II seat (confirmed running; primary challenger Seth Moulton)
- US House: All 9 MA congressional seats (every 2 years)
- Governor + constitutional officers (Maura Healey seeking re-election)
- MA State Senate: All 40 seats (every 2 years, confirmed from live DB showing all 40 districts)
- MA State House: All 160 seats (every 2 years, confirmed from live DB showing all 160 districts)
- Governor's Council

**Warren (Class III) is NOT up in 2026. Her seat is 2028.**

---

## 2nd Middlesex State Senate Primary — Known Candidates (MEDIUM-HIGH confidence)

**Source:** Ballotpedia, Cambridge Day, Harvard Crimson, Winchester News (multiple sources agree)

Race: 2nd Middlesex District — Democratic Primary, September 1, 2026
Incumbent retiring: Patricia D. Jehlen (announced December she will not seek re-election)
District geo_id: 25D27 (verified in live DB)
Patricia Jehlen politician_id: `d40a0eda-36fc-4032-8382-20c76a36d6a6`

**Known Democratic primary candidates:**
1. Burhan Azeem — Cambridge Vice Mayor/City Councillor; politician_id: `d2358e54-6860-4382-8c8d-95a3dabea874`
2. Christine Barber — State Rep 34th Middlesex District; declared early January 2026
3. Tom Hopcroft — Winchester School Committee; declared early January 2026
4. Matt McLaughlin — Somerville City Councilor; declared December 2025
5. Erika Uyterhoeven — State Rep (Somerville); declared March 2026
6. Neheet Trivedi — Cambridge (mentioned in some sources as 6th candidate — LOW confidence, confirm before including)

**District coverage:** Medford, Somerville, parts of Cambridge and Winchester.

---

## US Senate Race — Known Candidates (HIGH confidence)

**Source:** Multiple polls, Ballotpedia, Boston Globe

Election: November 3, 2026 general (primary September 1, 2026)
Seat: Class II, currently held by Ed Markey

**Democratic primary candidates:**
- Edward J. Markey (incumbent) — politician_id: `faf86b5b-5add-4afb-a8e2-96b3e8be4b78`
- Seth Moulton (US Rep, primary challenger)
- William Gates
- Alexander Rikleen

**Republican primary candidates:**
- Nathan Bech
- John Deaton

Filing deadline: June 2, 2026 (not yet passed — candidates list may change)

---

## Congressional Races Covering Cambridge (VERIFIED from live DB)

**MA-05 (geo_id: 2505)**
- Incumbent: Katherine Clark — politician_id: `7bf73fb2-1b31-412e-913d-835bfd3e326d`
- Office ID: `395b6873-4743-4052-870a-a391e4ed4370`
- Known 2026 primary challengers: Jonathan Paz, Tarik Samman

**MA-07 (geo_id: 2507)**
- Incumbent: Ayanna Pressley — politician_id: `c61baf45-dc2a-4d78-b4b7-21b1e9d79464`
- Office ID: `9011e2ed-f77b-4de0-92c3-d7911a0ae391`
- Known 2026 challengers: Kelechi Linardon (general election Independent only)

**Key schema note:** Congressional districts in DB use `district_type = 'NATIONAL_LOWER'` and `state = 'MA'` (uppercase, NOT 'ma' like state senate/house districts). The offices FK path works through `districts → offices` joining on district_id.

---

## Cambridge State Senate/House Districts (VERIFIED from live DB)

| geo_id | District type | Title | Incumbent | Politician ID |
|--------|---------------|-------|-----------|---------------|
| 25D26 | STATE_UPPER | Senator, Middlesex and Suffolk District | Sal N. DiDomenico | c7e94dda-1862-40fe-bda5-5fa2fe68f536 |
| 25D27 | STATE_UPPER | Senator, Second Middlesex District | Patricia D. Jehlen | d40a0eda-36fc-4032-8382-20c76a36d6a6 |
| 25D28 | STATE_UPPER | Senator, Suffolk and Middlesex District | William N. Brownsberger | 8a63eab9-1b32-48c6-ab4e-ba96c12ec5e7 |
| 25083 | STATE_LOWER | Representative, 25th Middlesex District | Marjorie C. Decker | 2b1a645a-72ce-4c0f-80ec-17565a2d6d10 |
| 25084 | STATE_LOWER | Representative, 26th Middlesex District | Mike Connolly | 49963775-d2d5-4ae2-95cf-b2b8d0ed2a92 |

Office IDs:
- 25D27: `b1ed4e2a-4a9c-4b41-9e46-8500f608e026`
- 25D26: `c3ea7a34-f13d-4804-9db7-7e3f62238cfc`
- 25D28: `e18eeea6-cdb2-42aa-833f-23267e6d813c`
- 25083: `a0e18b1e-478f-49b7-8ffb-351dc338875c`
- 25084: `06e4afe2-cbcf-421c-a569-c15b7d55a236`

---

## Architecture Patterns

### Pattern 1: Two Election Rows for Primary + General

The September 1 primary and November 3 general are SEPARATE election rows. Do not combine them. The Azeem 2nd Middlesex race exists only in the primary election row — not in the general (winner of primary is then the candidate in the general, but that's future data).

Naming convention from existing rows:
- Primary: `"2026 Massachusetts State Primary"` — election_type='primary', jurisdiction_level='state', state='MA'
- General: `"2026 Massachusetts General"` — election_type='general', jurisdiction_level='state', state='MA'

### Pattern 2: District-Linked vs. Statewide Races

**District path** (office_id IS NOT NULL) — Used when:
- Race links to an existing office in the DB
- MA state senate races where district + office already exist (25D26, 25D27, etc.)
- MA congressional races where district + office already exist (2505, 2507, etc.)
- These show up on Elections page for residents in those districts

**Statewide path** (office_id IS NULL + e.state = 'MA') — Used when:
- Race has no corresponding office in the DB
- Governor race, AG race, other statewide executive races
- Discovery-staged races for districts not yet linked to offices
- Shows up for ALL MA residents regardless of district

**Cambridge residents see both** because `getElectionsByGeoIds` runs both queries and merges results.

### Pattern 3: Primary Race Modeling

Primary races use `primary_party` column on `essentials.races`:
```sql
INSERT INTO essentials.races (election_id, office_id, position_name, primary_party, seats)
VALUES (v_primary_id, 'b1ed4e2a-4a9c-4b41-9e46-8500f608e026',
        'MA State Senate 2nd Middlesex District', 'Democratic', 1);
```

The unique constraint is on `(election_id, position_name, primary_party)`. For primaries, same position_name can appear twice (Democratic + Republican) — differentiated by primary_party.

### Pattern 4: Cambridge 2027 Placeholder

Minimum viable placeholder election row:
```sql
INSERT INTO essentials.elections (name, election_date, election_type, jurisdiction_level, state)
VALUES ('2027 Cambridge Municipal Election', '2027-11-02', 'general', 'city', 'MA')
ON CONFLICT (name, election_date, state) DO NOTHING;
```

No races needed for the placeholder. The discovery_jurisdictions row for Cambridge is also a placeholder — election_date November 2027 puts it ~18 months away, naturally outside the 180-day cron horizon.

### Pattern 5: Discovery Jurisdictions for MA State

For state-level discovery (MA senate/house/federal races), the jurisdiction_geoid should be the state geo_id `'25'` (the MA government's geo_id from the DB). One row per election_date:

```sql
INSERT INTO essentials.discovery_jurisdictions
  (jurisdiction_geoid, jurisdiction_name, state, election_date, source_url, allowed_domains)
VALUES
  ('25', 'Commonwealth of Massachusetts', 'MA', '2026-09-01',
   'https://www.sec.state.ma.us/divisions/elections/elections-and-voting.htm',
   ARRAY['sec.state.ma.us', 'ballotpedia.org', 'malegislature.gov']),
  ('25', 'Commonwealth of Massachusetts', 'MA', '2026-11-03',
   'https://www.sec.state.ma.us/divisions/elections/elections-and-voting.htm',
   ARRAY['sec.state.ma.us', 'ballotpedia.org', 'malegislature.gov'])
ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING;
```

**NOTE:** The MA SoS does not yet have a searchable 2026 candidate database. Filing deadline for district candidates is May 26, 2026; for federal/statewide party candidates, June 2, 2026. Both deadlines are after today (May 17). Ballotpedia is the most reliable source for known candidates until SoS publishes the list.

### Pattern 6: Incumbent Linking in race_candidates

When an incumbent has an existing politician record, link via `politician_id`:
```sql
INSERT INTO essentials.race_candidates
  (race_id, full_name, first_name, last_name, politician_id, is_incumbent, candidate_status, source)
VALUES (v_race, 'Burhan Azeem', 'Burhan', 'Azeem', 'd2358e54-6860-4382-8c8d-95a3dabea874',
        false, 'active', 'ballotpedia');
```

Azeem is NOT an incumbent for the senate race — `is_incumbent = false`. He's a challenger running for a new office (Jehlen's seat).

Challengers without politician records omit `politician_id`:
```sql
INSERT INTO essentials.race_candidates
  (race_id, full_name, first_name, last_name, is_incumbent, candidate_status, source)
VALUES (v_race, 'Christine Barber', 'Christine', 'Barber', false, 'active', 'ballotpedia');
```

---

## Migration Number

**Next migration: 162** (confirmed from live DB and migration files)

Current last: `161_monica_rodriguez_topoff_stances.sql`
Available: 162, 163, 164, ...

The phase context said "next migration is 160" but migrations 160 and 161 have been applied since that was written.

---

## Election Row Names (Recommended)

Based on existing naming conventions in the DB:
- TX: `"2026 Texas Municipal General"`
- IN: `"2026 Indiana Primary"`
- CA: `"2026 LA County Primary"`

Recommended MA names:
- `"2026 Massachusetts State Primary"` (September 1, 2026; type=primary; level=state)
- `"2026 Massachusetts General"` (November 3, 2026; type=general; level=state)
- `"2027 Cambridge Municipal Election"` (November 2027; type=general; level=city)

---

## How the Elections Page Serves MA Residents

The `getElectionsByGeoIds` function (called by GET /essentials/elections/me) runs two concurrent queries:

1. **District query**: Finds races where `d.geo_id = ANY(userGeoIds)` — catches district-linked races (state senate, state house, congressional) for the user's specific districts.

2. **Statewide query**: Finds races where `r.office_id IS NULL AND e.state = 'MA'` — catches governor, AG, etc. that apply statewide.

**For state senate and congressional races with existing office_ids:** Use `office_id` to link the race. These will appear for the specific districts they cover.

**For races without DB offices:** Use `office_id = NULL` with `e.state = 'MA'`. These appear for all MA users.

**Date filtering logic:**
- General elections: `election_date >= DATE_TRUNC('year', CURRENT_DATE)` — shows all of 2026 general even before election day
- Non-general (primary, special): `election_date >= CURRENT_DATE - INTERVAL '30 days'` — shows within last 30 days

This means the November 3 general election row will be visible to MA residents starting January 1, 2026 (already past). The September 1 primary will be visible until September 31, 2026.

---

## Common Pitfalls

### Pitfall 1: Wrong jurisdiction_level for MA State Election
**What goes wrong:** Using `jurisdiction_level='federal'` or `jurisdiction_level='county'` for the MA state election.
**Correct value:** `jurisdiction_level='state'` — matches IN and CA primary patterns in the DB.
**Why it matters:** The elections page uses this to group/sort races.

### Pitfall 2: Azeem marked as incumbent
**What goes wrong:** Setting `is_incumbent = true` for Azeem in the 2nd Middlesex senate primary.
**Why it happens:** He's an incumbent Cambridge City Councillor, but NOT an incumbent for the state senate seat.
**Correct:** `is_incumbent = false` for ALL candidates in the 2nd Middlesex senate race (open seat).

### Pitfall 3: Missing primary_party on primary races
**What goes wrong:** Creating a primary race without `primary_party`, causing the partial unique index to treat it as a general election race.
**Correct:** Always set `primary_party = 'Democratic'` for Democratic primary races.

### Pitfall 4: is_active column doesn't exist
**What goes wrong:** Adding `is_active = false` to discovery_jurisdictions INSERT for the 2027 Cambridge row.
**Correct:** No `is_active` column exists. The cron horizon (180 days) naturally excludes the 2027 election.

### Pitfall 5: Primary election surfacing for all users
**What goes wrong:** Primary races appear on elections page for ALL MA users regardless of their registered party.
**Mitigation:** This is by design — the primary_party on races is displayed to show which party's primary it is. EV doesn't enforce closed primary restrictions at the display layer.

### Pitfall 6: Unique constraint on elections uses state (not jurisdiction_level)
**What goes wrong:** Using ON CONFLICT that doesn't include state.
**Correct constraint:** `UNIQUE (name, election_date, state)` — the uniqueness is on name + date + state.

### Pitfall 7: MA district geo_ids use lowercase state in some tables
**What goes wrong:** Querying `WHERE d.state = 'MA'` when state senate districts use `state = 'ma'` (lowercase).
**Context:** State senate/house districts have `state = 'ma'` (lowercase); congressional districts have `state = 'MA'` (uppercase). This is inconsistent legacy data. When filtering, use `ILIKE` or `LOWER()` if needed.

### Pitfall 8: Conflating the two query paths
**What goes wrong:** Seeding a state senate race with `office_id = NULL` expecting it to show up via district path.
**Correct:** Races with `office_id = NULL` only show via statewide path (all MA users). Races with `office_id` show via district path (only users in that district). State senate races 25D27 etc. should use `office_id` so only Cambridge-area residents see them.

---

## Code Examples

### MA Election Row INSERT (Primary)
```sql
-- 162_ma_2026_elections.sql pattern
INSERT INTO essentials.elections (name, election_date, election_type, jurisdiction_level, state)
VALUES ('2026 Massachusetts State Primary', '2026-09-01', 'primary', 'state', 'MA')
ON CONFLICT (name, election_date, state) DO NOTHING;
```

### MA Election Row INSERT (General)
```sql
INSERT INTO essentials.elections (name, election_date, election_type, jurisdiction_level, state)
VALUES ('2026 Massachusetts General', '2026-11-03', 'general', 'state', 'MA')
ON CONFLICT (name, election_date, state) DO NOTHING;
```

### 2nd Middlesex Race INSERT with Candidates
```sql
DO $$
DECLARE
  v_primary_id UUID;
  v_race       UUID;
BEGIN
  SELECT id INTO v_primary_id
  FROM essentials.elections
  WHERE name = '2026 Massachusetts State Primary' AND state = 'MA';

  INSERT INTO essentials.races
    (election_id, office_id, position_name, primary_party, seats)
  VALUES
    (v_primary_id, 'b1ed4e2a-4a9c-4b41-9e46-8500f608e026',
     'MA State Senate 2nd Middlesex District', 'Democratic', 1)
  ON CONFLICT (election_id, position_name, primary_party) DO NOTHING
  RETURNING id INTO v_race;

  IF v_race IS NULL THEN
    SELECT id INTO v_race FROM essentials.races
    WHERE election_id = v_primary_id
      AND position_name = 'MA State Senate 2nd Middlesex District'
      AND primary_party = 'Democratic';
  END IF;

  -- Azeem (linked politician, not incumbent for this race)
  INSERT INTO essentials.race_candidates
    (race_id, full_name, first_name, last_name, politician_id, is_incumbent, candidate_status, source)
  VALUES
    (v_race, 'Burhan Azeem', 'Burhan', 'Azeem',
     'd2358e54-6860-4382-8c8d-95a3dabea874', false, 'active', 'ballotpedia')
  ON CONFLICT DO NOTHING;

  -- Other candidates (no politician record)
  INSERT INTO essentials.race_candidates
    (race_id, full_name, first_name, last_name, is_incumbent, candidate_status, source)
  VALUES
    (v_race, 'Christine Barber', 'Christine', 'Barber', false, 'active', 'ballotpedia'),
    (v_race, 'Tom Hopcroft', 'Tom', 'Hopcroft', false, 'active', 'ballotpedia'),
    (v_race, 'Matt McLaughlin', 'Matt', 'McLaughlin', false, 'active', 'ballotpedia'),
    (v_race, 'Erika Uyterhoeven', 'Erika', 'Uyterhoeven', false, 'active', 'ballotpedia');
END $$;
```

### Discovery Jurisdictions INSERT Pattern
```sql
-- ON CONFLICT uses the unique index on (jurisdiction_geoid, election_date)
INSERT INTO essentials.discovery_jurisdictions
  (jurisdiction_geoid, jurisdiction_name, state, election_date, source_url, allowed_domains)
VALUES
  ('25', 'Commonwealth of Massachusetts', 'MA', '2026-09-01',
   'https://www.sec.state.ma.us/divisions/elections/elections-and-voting.htm',
   ARRAY['sec.state.ma.us', 'ballotpedia.org', 'malegislature.gov']),
  ('25', 'Commonwealth of Massachusetts', 'MA', '2026-11-03',
   'https://www.sec.state.ma.us/divisions/elections/elections-and-voting.htm',
   ARRAY['sec.state.ma.us', 'ballotpedia.org', 'malegislature.gov'])
ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING;
```

### Cambridge 2027 Placeholder + discovery_jurisdictions
```sql
-- Elections row
INSERT INTO essentials.elections (name, election_date, election_type, jurisdiction_level, state)
VALUES ('2027 Cambridge Municipal Election', '2027-11-02', 'general', 'city', 'MA')
ON CONFLICT (name, election_date, state) DO NOTHING;

-- Cambridge discovery_jurisdictions — beyond 180-day cron horizon, naturally inactive
INSERT INTO essentials.discovery_jurisdictions
  (jurisdiction_geoid, jurisdiction_name, state, election_date, source_url, allowed_domains)
VALUES
  ('2511000', 'City of Cambridge, Massachusetts', 'MA', '2027-11-02',
   'https://www.cambridgema.gov/departments/electioncommission/cambridgemunicipalelections',
   ARRAY['cambridgema.gov'])
ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING;
```

---

## Key UUIDs (Verified from Live DB)

**Governments:**
- Cambridge government: `6f7d55bc-d50c-47ff-b521-5767d1f763fb` (geo_id: 2511000)
- MA state government: `85783e20-3031-4d71-89a5-5dd61f4a593f` (geo_id: 25)

**Politicians:**
- Burhan Azeem: `d2358e54-6860-4382-8c8d-95a3dabea874`
- Patricia D. Jehlen (retiring): `d40a0eda-36fc-4032-8382-20c76a36d6a6`
- Edward J. Markey: `faf86b5b-5add-4afb-a8e2-96b3e8be4b78`
- Katherine Clark (MA-05): `7bf73fb2-1b31-412e-913d-835bfd3e326d`
- Ayanna Pressley (MA-07): `c61baf45-dc2a-4d78-b4b7-21b1e9d79464`

**Offices (Cambridge-area):**
- 25D27 (2nd Middlesex): `b1ed4e2a-4a9c-4b41-9e46-8500f608e026`
- 25D26 (Middlesex + Suffolk): `c3ea7a34-f13d-4804-9db7-7e3f62238cfc`
- 25D28 (Suffolk + Middlesex): `e18eeea6-cdb2-42aa-833f-23267e6d813c`
- 25083 (25th Middlesex House): `a0e18b1e-478f-49b7-8ffb-351dc338875c`
- 25084 (26th Middlesex House): `06e4afe2-cbcf-421c-a569-c15b7d55a236`
- MA-05 congressional: `395b6873-4743-4052-870a-a391e4ed4370`
- MA-07 congressional: `9011e2ed-f77b-4de0-92c3-d7911a0ae391`

---

## Open Questions

1. **Neheet Trivedi as 6th candidate in 2nd Middlesex**
   - Some sources mention Trivedi as a 6th candidate; most authoritative sources list 5
   - Recommendation: Include only the confirmed 5; Trivedi can be added via discovery if confirmed

2. **2027 Cambridge election date**
   - Cambridge holds elections "in November in odd years" (official)
   - 2025 was November 4 (first Tuesday of November)
   - 2027 first Tuesday of November = November 2, 2027
   - Used `2027-11-02` as the placeholder date (LOW confidence — confirm with Cambridge Election Commission when known)

3. **Which other 2026 races to seed in 44-01 vs. defer to discovery**
   - Plan 44-01 explicitly covers: Azeem primary + known 2nd Middlesex candidates + US Senate (Markey/Moulton) + MA-05/MA-07 congressional races
   - Remaining 37 senate + 160 house + 7 congressional districts: deferred to discovery run
   - Recommendation: Seed MA-05 and MA-07 races with known candidates in 44-01 (Cambridge coverage); let discovery handle the rest

4. **MA SoS candidate database not yet available**
   - Filing deadline May 26 for district candidates; June 2 for federal
   - As of May 17, official list not published on sec.state.ma.us
   - Ballotpedia and news sources are authoritative for now; discovery run should use Ballotpedia + SoS after June 2

5. **Governor + constitutional officer races**
   - Maura Healey running for re-election, AG and other offices also up
   - These should be statewide races (`office_id = NULL`) seeded in the November general election
   - Deferred to 44-02 discovery or manual seeding; not required for 44-01

---

## Sources

### Primary (HIGH confidence)
- Live DB queries via psql — schema verified from `\d essentials.discovery_jurisdictions`, `\d essentials.elections`
- Migration 042 (election schema), 044 (dedup constraints), 070 (discovery tables)
- Migration 099 (TX discovery_jurisdictions pattern), 100 (TX races pattern)
- sec.state.ma.us/divisions/elections/recent-updates/upcoming-elections.htm — primary Sep 1, general Nov 3
- Live DB politician_ids, office_ids, geo_ids all verified with SELECT queries

### Secondary (MEDIUM confidence)
- Ballotpedia — 2nd Middlesex candidates (5 confirmed, Trivedi unclear)
- Wikipedia / multiple news sources — Ed Markey Class II seat, Seth Moulton challenger
- Multiple MA news sources — Cambridge Day, Harvard Crimson, Winchester News confirming Azeem race

### Tertiary (LOW confidence)
- 2027 Cambridge election date (November 2, 2027) — inferred from "first Tuesday" pattern; not officially confirmed
- Neheet Trivedi as 6th 2nd Middlesex candidate — single source mention, not confirmed

---

## Metadata

**Confidence breakdown:**
- Schema (elections, races, race_candidates, discovery_jurisdictions): HIGH — verified from live DB
- Migration number (162 next): HIGH — verified from file listing
- MA 2026 calendar (Sep 1 primary, Nov 3 general): HIGH — official sec.state.ma.us
- 2nd Middlesex candidates (5 confirmed): MEDIUM — multiple news sources, not yet on official SoS list
- US Senate candidates (Markey, Moulton, etc.): MEDIUM — multiple credible sources
- 2027 Cambridge date: LOW — inferred, not officially published

**Research date:** 2026-05-17
**Valid until:** 2026-06-15 (candidate filing deadline Jun 2 may add/change names)
