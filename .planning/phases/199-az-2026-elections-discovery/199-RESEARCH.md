# Phase 199: AZ 2026 Elections & Discovery — Research

**Researched:** 2026-07-17
**Domain:** Election/race-shell/discovery data-seeding (Supabase Postgres, `essentials` schema)
**Confidence:** HIGH (DB facts SQL-verified live; cycle facts cross-verified against Ballotpedia/Wikipedia/county sources)

> ⚠️ **THREE CONTEXT CORRECTIONS the planner MUST honor** (details below):
> 1. **AZ 2026 primary date is `2026-07-21`, NOT `2026-08-04`.** Arizona moved its primary to the second-to-last Tuesday in July via HB 2022 (signed 2026-02-06). D-05's date is wrong.
> 2. **Pima County Board of Supervisors is NOT on the 2026 ballot.** AZ county supervisors are elected in presidential years (2024, 2028). All 5 Pima supervisors were elected Nov 2024 → next election 2028. D-03's "Pima BoS is up in 2026 (gubernatorial cycle)" is factually wrong. **Do NOT seed Pima BoS race shells.**
> 3. **Corporation Commission = 2 of 5 seats up** (not 5). Seed a 2-seat contest, not 5 shells.
>
> One bonus: **South Tucson DOES have 2026 races** (3 council seats) — D-03 left this "to be verified"; it is confirmed on the ballot.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Hand-seed confirmed candidates only for the high-salience, low-volume tier — **statewide** (Governor, SoS, AG, Treasurer, Superintendent, Mine Inspector, Corporation Commission) **+ federal** (verify/complete the existing 9 US House races, already carrying 39 candidates).
- **D-02:** Leave the **90 legislative seats + all Tucson-metro local races as shells** for the armed discovery cron to populate. Do NOT hand-seed their candidates in this phase.
- **D-03:** Seed local shells **only where the 2026 cycle is confirmed** by research.
- **D-04:** Seed shells **only against offices that already exist** in the DB. Do NOT create new office rows this phase. Pima constitutional offices + Superior Court retention deferred.
- **D-05:** Seed the **AZ 2026 Statewide Primary** election row in addition to the existing general, mirroring VA/MD. *(Researcher note: date is 2026-07-21, not 2026-08-04 — see correction above.)*
- **D-06:** Arm **statewide (FIPS `04`) + Pima County** jurisdictions, **one row per election date** → 4 `discovery_jurisdictions` rows.
- **D-07:** Allowlist per row: `azsos.gov`, `azcleanelections.gov`, `pima.gov` / `recorder.pima.gov`, `ballotpedia.org`.
- **D-08:** **No `cron_active` column exists** — arming is date-window driven. Do NOT add or reference `cron_active`.

### Claude's Discretion (resolved in this research)
- Migration numbering + repo → **cross-repo `C:/EV-Accounts/backend/migrations/`, next number `1372`** (see Migration Plan).
- `ext_id` / seat-anchoring scheme → **races have no ext_id; anchor via `(election_id, position_name)` + `office_id`** (see Seat-Anchoring).
- AZ cities in coverage UI → **already present in `src/lib/coverage.js`; NO edit needed** (Landing.jsx no longer holds `COVERAGE_CITIES`).

### Deferred Ideas (OUT OF SCOPE)
- Pima County constitutional offices (Sheriff, Recorder, Assessor, County Attorney, Clerk, Treasurer, Superintendent) — no new office rows.
- Superior Court judicial retention races.
- School board 2026 races (no school-board badge yet).
- Hand-seeding legislative + local candidates (left to discovery cron).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AZ-ELEC-01 | AZ 2026 race shells seeded (statewide + US House + legislative + Tucson-metro local), confirmed candidate slate populated where filing is closed, and `discovery_jurisdictions` armed with the AZ domain allowlist + cron. | Seed Manifest (§4) gives exact office rows → race shells with counts; Candidate Slate (§5) gives confirmed filed slates + "ship as shell" flags; Discovery Rows (§7) gives the 4 rows with source_url + allowed_domains; Migration Plan (§6) gives numbering + repo; Validation Architecture (§9) gives per-criterion verification. |
</phase_requirements>

## Summary

This is a pure SQL data-seeding phase against the live `essentials` schema, following the well-trodden VA/OR/MD elections→races→discovery migration pattern (cross-repo `C:/EV-Accounts/backend/migrations/`, executor-authors/orchestrator-applies split used by AZ phases 191–198). The DB already holds the AZ 2026 general election row (`e21f5757-071e-4851-9c06-83520d96460e`) with 9 US House race shells + 39 candidates. All AZ offices the phase needs (6 statewide + 5 corp commission + 30 senate + 60 house + local) already exist — so **zero new office rows** are required (satisfies D-04).

The primary research value is resolving three factual errors in CONTEXT and producing an exact seed manifest. **The AZ primary is 2026-07-21 (four days after this research date), not 2026-08-04.** Because the primary hasn't happened, the statewide/legislative *general-election nominees are not yet decided* — every "confirmed" slate is still a contested primary field. This makes D-01's "hand-seed confirmed candidates" a genuine decision: attach all *filed* candidates to NULL-party general shells now (mirroring the existing 39-candidate US House pattern) and accept a post-July-21 reconcile, or ship shells and let discovery + reconcile fill nominees. A post-July-21 roster reconcile is already owed per project memory.

Two structural gotchas drive the plan: (1) **AZ House is multi-member** — 30 districts × 2 members = 60 offices, but the `races` unique index `(election_id, position_name) WHERE primary_party IS NULL` forbids two identically-named shells, so House must be modeled as **30 two-winner races (`seats=2`)**, not 60. (2) **At-large multi-winner bodies** (Corp Commission, town councils) have no seat-differentiated offices, so `office_id` anchoring is inherently ambiguous — see Open Questions.

**Primary recommendation:** Seed the primary election row (corrected date `2026-07-21`), anchor ALL race shells to the *general* election `e21f5757…` (primary row stays bare, per VA pattern); seed 6 statewide + 1 two-seat Corp Commission + 30 Senate + 30 House(seats=2) + confirmed local shells (South Tucson, Oro Valley, Marana, Sahuarita only — NOT Pima BoS, NOT Tucson city); arm 4 discovery rows with corrected dates; no UI edit. Start migrations at 1372.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Election/race/discovery row persistence | Database (`essentials` schema, prod Supabase) | — | All work is idempotent SQL migrations applied via psql. |
| Migration authoring + apply | Backend repo (`C:/EV-Accounts/backend`) | — | AZ 191–198 established executor-authors-SQL / orchestrator-applies-via-tsx pattern. |
| Candidate roster currency | Discovery cron (reads `discovery_jurisdictions` within 180-day window) | Post-July-21 manual reconcile | D-02/D-06: date-armed cron fills shells; reconcile narrows to nominees. |
| Coverage surfacing (UI) | Frontend (`src/lib/coverage.js`) | — | Already seeded (194–198); no change this phase. |

## Confirmed 2026 Cycle Facts (external, cited)

| Fact | Value | Confidence | Source |
|------|-------|-----------|--------|
| AZ 2026 **primary** date | **2026-07-21** | HIGH | [CITED: news.ballotpedia.org/2026/02/13 — HB 2022 moved primary to 2nd-to-last Tue in July; signed 2026-02-06] + [CITED: elections.maricopa.gov primary-election-dates] |
| AZ 2026 **general** date | 2026-11-03 | HIGH | [VERIFIED: SQL — existing election row] + [CITED: en.wikipedia.org/wiki/2026_Arizona_elections] |
| Statewide execs up in 2026 | Governor, SoS, AG, Treasurer, Superintendent, Mine Inspector — **all 6** | HIGH | [CITED: ballotpedia.org/Arizona_state_executive_official_elections,_2026] + [CITED: Wikipedia 2026 Arizona elections] |
| First AZ gubernatorial with a running-mate (Lt. Gov) | 2026 | MEDIUM | [CITED: Ballotpedia Governor 2026] — does not affect seeding (no Lt. Gov office row exists; not seeded) |
| Corporation Commission seats up | **2 of 5** (at-large, statewide) | HIGH | [CITED: ballotpedia.org/Arizona_Corporation_Commission_election,_2026] + [CITED: yourvalley.net "two seats"] + [CITED: Wikipedia] |
| U.S. Senate | **Neither seat up** (first cycle w/o AZ Senate race since 2014) | HIGH | [CITED: Wikipedia 2026 Arizona elections] — matches CONTEXT exclusion (Kelly 2028, Gallego 2030) |
| U.S. House | All **9** districts (already seeded) | HIGH | [VERIFIED: SQL — 9 race shells + 39 candidates] |
| State Legislature | **All 90**: 30 Senate (1/district) + 60 House (2/district), 2-yr terms | HIGH | [CITED: ballotpedia.org Arizona State Senate/House elections 2026] + [CITED: Wikipedia] |
| **Pima County Board of Supervisors** | **NOT on 2026 ballot** — all 5 elected Nov 2024, 4-yr terms, next **2028** | HIGH | [CITED: ballotpedia.org/Pima_County,_Arizona,_elections,_2026] + [CITED: Wikipedia Maricopa BoS — AZ county supervisors elected in years divisible by 4] |
| Tucson city council | **NO 2026 race** — odd-year cycle (2025/2027); last election Nov 2025, next 2027 | HIGH | [CITED: ballotpedia.org City_elections_in_Tucson,_Arizona_(2025)] + [CITED: tucsonaz.gov Clerk Elections] |
| **South Tucson** | **3 council seats up in 2026** (4-yr terms), 8 candidates; primary 07-21, general 11-03 | HIGH | [CITED: southtucsonaz.gov/elections/page/candidate-information-2026] + [CITED: tucsonspotlight.org "8 candidates vie for 3 seats"] |
| Oro Valley | **Mayor (open) + 3 council seats** up in 2026 (even-year) | HIGH | [CITED: iloveov.com/2026-election] + [CITED: tucson.com "council races in Oro Valley, Marana, Sahuarita"] |
| Marana | **Mayor (2-yr term) + 4 council seats** up (nonpartisan; July-21 primary can win outright at >50%) | HIGH | [CITED: tucson.com] + [CITED: tucsonsentinel town races 2026] |
| Sahuarita | **3 council seats** up; **no direct mayor election** (council appoints mayor) | HIGH | [CITED: tucson.com "3 Sahuarita Town Council seats"] |

### ⚠️ Source conflict noted & resolved (Pima BoS)
One WebSearch summary asserted "Pima County is holding general elections for board of supervisors on November 3, 2026" (Ballotpedia boilerplate). This is contradicted by the specific, corroborated facts that all five supervisors were elected Nov 2024 to 4-year terms and that AZ county supervisors are elected in years divisible by four (2024, 2028) — confirmed for both Pima and Maricopa. **Resolution: Pima BoS is NOT up in 2026.** The generic boilerplate is disregarded.

## DB-Verified Facts (SQL against live prod, read-only)

### Schema (verified — trust these over CONTEXT)
- **`essentials.races`**: `(id uuid pk, election_id uuid NOT NULL, office_id uuid NULL, position_name text NOT NULL, primary_party text NULL, seats int NOT NULL default 1, description text, created_at, updated_at)`.
  - Unique: `races_election_position_party_unique (election_id, position_name, primary_party)`.
  - **Partial unique (the ON CONFLICT target):** `idx_races_election_position_no_party (election_id, position_name) WHERE primary_party IS NULL`. → Use `ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING` for NULL-party shells (matches VA/OR pattern).
- **`essentials.elections`**: `(id, name, election_date date, election_type, jurisdiction_level, state, description, …)`. Unique: `(name, election_date, state)`. → `ON CONFLICT (name, election_date, state) DO NOTHING`.
- **`essentials.discovery_jurisdictions`**: `(id, jurisdiction_geoid text NOT NULL, jurisdiction_name text NOT NULL, state char NOT NULL, election_date date NOT NULL, source_url text, allowed_domains text[])`. Unique: `idx_discovery_jurisdictions_geoid_date (jurisdiction_geoid, election_date)`. **NO `cron_active` column — D-08 confirmed.**
- **`essentials.race_candidates`**: `(id, race_id NOT NULL, politician_id NULL, full_name NOT NULL, first_name, last_name, photo_url, is_incumbent, candidate_status default 'active', last_verified_at, source, external_id text, occupational_designation, website_url, …)`. No unique constraint beyond pk (id).
- **`essentials.offices`**: has **NO `ext_id` / `position_name` column.** Columns: `id, politician_id, chamber_id, district_id, title, representing_state, representing_city, description, seats, normalized_position_name, partisan_type, salary, is_appointed_position, is_vacant, vacant_since, faces_retention_vote, role_canonical`. Office identity for a race = `office_id` FK resolved via chamber name + district geo_id.
- **`essentials.chambers`**: no `chamber_type` column; group via `chambers.name`. External id lives on `chambers.external_id` / `politicians.external_id`, not offices.

### AZ office universe (SQL-verified, matches CONTEXT expected universe exactly)

| Chamber | Count | On 2026 ballot? | Race shells to seed |
|---------|------:|-----------------|---------------------|
| Governor | 1 | ✅ | 1 |
| Secretary of State | 1 | ✅ | 1 |
| Attorney General | 1 | ✅ | 1 |
| Treasurer | 1 | ✅ | 1 |
| Superintendent of Public Instruction | 1 | ✅ | 1 |
| State Mine Inspector | 1 | ✅ | 1 |
| Corporation Commission | 5 | ✅ (2 of 5 seats) | **1 race, seats=2** |
| State Senate | 30 | ✅ (all 30) | 30 (seats=1) |
| House of Representatives | 60 | ✅ (all 60 seats) | **30 races, seats=2** (2 members/district) |
| U.S. House of Representatives | 9 | ✅ | 0 (already seeded) |
| U.S. Senate | 2 | ❌ neither up | 0 |
| Board of Supervisors (Pima) | 5 | ❌ (2024→2028) | **0 — do NOT seed** |
| Town Council (OV 7 / Marana 7 / Sahuarita 7 = 21) | 21 | ✅ partial | see local manifest |
| City Council (Tucson 7 / South Tucson 7 = 14) | 14 | Tucson ❌ / S.Tucson ✅ | see local manifest |

### Existing state (SQL-verified)
- `essentials.elections` AZ rows: **1** — `AZ 2026 Statewide General`, `2026-11-03`, id `e21f5757-071e-4851-9c06-83520d96460e`. **No primary row.**
- Races under it: **9** US House shells (`U.S. Representative District 1..9`), all `primary_party` NULL, all `office_id` non-NULL.
- `race_candidates` under it: **39**.
- `discovery_jurisdictions` for AZ/`04*`: **0 rows** — all 4 new rows are net-new.
- Legislative districts: Senate `04001`–`04030` (`STATE_UPPER`, `state='az'`); House `04001`–`04030` (`STATE_LOWER`, `state='az'`), **2 members each** (verified `members=2` for every district).

## 4. Seed Manifest (exact — the planner can build migrations directly from this)

All race shells: `primary_party = NULL`, anchor to `election_id = e21f5757-071e-4851-9c06-83520d96460e` (the **general** — the primary row stays bare, per VA Plan 01). Resolve `election_id` by subquery `WHERE name='AZ 2026 Statewide General' AND state='AZ'` (do not hardcode the UUID in SQL if you prefer subquery-consistency; UUID is provided for reference).

### 4a. Elections row to add (D-05, corrected date)
| name | election_date | election_type | jurisdiction_level | state |
|------|--------------|---------------|--------------------|-------|
| `AZ 2026 Statewide Primary` | **`2026-07-21`** | primary | state | AZ |

> Match the naming style of the existing `AZ 2026 Statewide General` (prefix "AZ 2026 Statewide"). The primary row is **bare** (no races link to it) — it exists for consistency + so the discovery date-window logic can reference it. Note: as of the 2026-07-17 research date the primary is only 4 days out, so its discovery value is minimal; seed it anyway per D-05.

### 4b. Statewide race shells (6 single-winner) — office_id verified
| position_name (recommended) | office_id | incumbent (for sanity) |
|------------------------------|-----------|------------------------|
| `Governor` | `4d870c55-7937-41ba-8716-7a30da7e3e06` | Katie Hobbs |
| `Secretary of State` | `520719e6-cb1e-46a2-a99d-b83cc4d16d38` | Adrian Fontes |
| `Attorney General` | `2214a2e6-e96b-4055-8d58-471a55e89922` | Kris Mayes |
| `Treasurer` | `21f57932-e817-42a2-a5d6-55430990adfc` | Kimberly Yee |
| `Superintendent of Public Instruction` | `ba26bb00-515a-4445-8cc5-b24f28107663` | Tom Horne |
| `State Mine Inspector` | `73481f59-8969-4734-bd69-cdf6d97df7a3` | Les Presmyk |

*(Recommended: plain office titles for `position_name`. The 5 statewide offices with `role_canonical` set and 1 without — all are `STATE_EXEC`, `geo_id='04'`.)*

### 4c. Corporation Commission race shell (2 of 5 seats, at-large)
| position_name | seats | office_id | note |
|---------------|------:|-----------|------|
| `Arizona Corporation Commission` | **2** | *ambiguous — see Open Q1* | At-large 2-winner statewide race. 5 commissioner offices exist (office_ids: `686d5bbc…` Márquez Peterson, `c1f6279e…` Lopez, `a1af9a2f…` Thompson, `…Myers -4004003`, `…Walden -4004004`). |

> The two seats up in 2026 are the seats whose terms expire Jan 2027 (the seats last filled in 2022). Because commissioners run at-large (no per-seat district), model as **one race with `seats=2`**. `office_id` anchoring is a design decision — see Open Q1.

### 4d. Legislative race shells (60 total: 30 Senate + 30 House)
Resolve `office_id` by subquery per district:
```sql
-- Senate (seats=1):
(SELECT o.id FROM essentials.offices o
   JOIN essentials.chambers c ON c.id=o.chamber_id
   JOIN essentials.districts d ON d.id=o.district_id
 WHERE c.name='State Senate' AND d.district_type='STATE_UPPER'
   AND d.state='az' AND d.geo_id='0400N' LIMIT 1)
-- House (seats=2, multi-member → LIMIT 1 picks ONE of the two offices; see Open Q2):
(SELECT o.id FROM essentials.offices o
   JOIN essentials.chambers c ON c.id=o.chamber_id
   JOIN essentials.districts d ON d.id=o.district_id
 WHERE c.name='House of Representatives' AND d.district_type='STATE_LOWER'
   AND d.state='az' AND d.geo_id='0400N' LIMIT 1)
```
| chamber | districts | position_name pattern | seats | # races |
|---------|-----------|-----------------------|------:|--------:|
| State Senate | `04001`–`04030` | `State Senate District {N}` | 1 | 30 |
| House of Representatives | `04001`–`04030` | `State House District {N}` | **2** | 30 |

> Position-name patterns match the existing `districts.label` values (`State Senate District N` / `State House District N`). **House = 30 races (seats=2), not 60** — the partial unique index forbids duplicate `(election_id, position_name)` and AZ House is genuinely a 2-winner-per-district contest. This models 60 seats in 30 races; the discovery cron attaches all candidates to the 2-winner shell.

### 4e. Local race shells (D-03 — ONLY confirmed 2026 cycles)
| Government | Race(s) to seed | seats | office anchor | Do NOT seat? |
|-----------|-----------------|------:|---------------|--------------|
| **Pima County BoS** | — | — | — | ❌ **NONE** (2024→2028) |
| **City of Tucson** | — | — | — | ❌ **NONE** (odd-year) |
| **South Tucson** | `South Tucson City Council` | 3 | one of 7 South Tucson council offices (geo_id `0468850`) | at-large 3-winner |
| **Oro Valley** | `Oro Valley Mayor` | 1 | `b3c8f75c-e8f9-4097-ab14-5790e380f9df` (Mayor office) | single-winner |
| **Oro Valley** | `Oro Valley Town Council` | 3 | one of 6 OV council offices (geo_id `0451600`) | at-large 3-winner |
| **Marana** | `Marana Mayor` | 1 | `ac3daf57-c50a-4056-af79-acdda23551df` (Mayor office) | single-winner |
| **Marana** | `Marana Town Council` | 4 | one of 6 Marana council offices (geo_id `0444270`) | at-large 4-winner |
| **Sahuarita** | `Sahuarita Town Council` | 3 | one of 5 Sahuarita council offices (geo_id `0462140`) | at-large 3-winner (no mayor race) |

> **Local shell count: 7 races** (0 Pima, 0 Tucson, 1 South Tucson, 2 Oro Valley, 2 Marana, 1 Sahuarita). At-large council `office_id` anchoring is ambiguous (multiple undifferentiated council offices per body) — see Open Q1/Q2. Mayor offices are unambiguous singletons.

**Total new race shells:** 6 statewide + 1 corp + 30 senate + 30 house + 7 local = **74 race shells** (plus the pre-existing 9 US House = 83 races under the AZ general when done).

## 5. Confirmed Candidate Slate (D-01 hand-seed tier)

> ⚠️ **Timing caveat (drives a planning decision):** filing closed ~April 6, 2026, so the *filed* field is public — but the **primary is 2026-07-21**, so these are **primary-contest fields, NOT general-election nominees.** The existing 9 US House shells already carry all 39 *filed* candidates on NULL-party shells (≈4.3/race), i.e. the established pattern is "attach all filed candidates to the general shell, reconcile to nominees later." A post-July-21 reconcile is already owed (project memory).
>
> **Recommendation:** Either (A) mirror the US House pattern — attach all filed candidates (both parties) to the NULL-party statewide/corp shells now, then reconcile after 07-21; or (B) ship statewide/corp as **shells only** and let the armed discovery cron + post-07-21 reconcile fill nominees. Given the primary lands 4 days after this research and rosters will change materially, **(B) is the lower-risk default** unless the user explicitly wants the filed field seeded now. **Flag for discuss/planner.** In all cases, **pull the live roster from azsos.gov / azcleanelections.gov / Ballotpedia at execute time** — do not seed from the snapshot below without re-verification.

Filed fields captured this session (all [CITED: Ballotpedia state-executive 2026 pages], primary fields):

| Office | Democratic filed | Republican filed | Other/General filed |
|--------|------------------|------------------|---------------------|
| Governor | Katie Hobbs (inc.) | Andy Biggs, Scott Neely, David Schweikert | Teri Hourihan, William Pounds, Hugh Lytle, Leezah Sun |
| Secretary of State | Adrian Fontes (inc.) | Alexander Kolodin, Gina Swoboda | — |
| Attorney General | Kris Mayes (inc.) | Rodney Glassman, Warren Petersen | — |
| Treasurer | Nick Mansour | Elijah Norton, Katherine Haley | — |
| Superintendent | Teresa Leyba Ruiz, Michael Butts, Brett Newby | Thomas Horne (inc.), Kimberly Yee | Stephen Neal Jr. |
| Mine Inspector | Brian Matlock | Les Presmyk (inc.) | — |
| Corporation Commission (2 seats) | *slate not fully captured — pull fresh* | *pull fresh* | *pull fresh* |

**Ship-as-shell flag:** Corporation Commission slate was not fully resolved this session — [ASSUMED] the planner pulls it fresh from azsos.gov; if unresolved at execute time, **ship the Corp Commission race as a bare shell.**

### 5b. Existing 39 US House candidates (Q10 spot-check)
- 39 candidates across 9 races (~4.3/district) is a plausible complete *filed* field for a contested primary cycle. **No full re-seed required** (matches D-01 "verify/complete"). The general nominees finalize 07-21; the owed post-July-21 reconcile narrows all 9 shells to nominees. Recommend the planner add a note (not a task) that a reconcile is owed rather than re-seeding here.

## 6. Migration Plan (Claude's Discretion — resolved)

- **Repo:** `C:/EV-Accounts/backend/migrations/` (cross-repo). Rationale: elections/races/discovery live in the same prod `essentials` schema the AZ 191–198 deep-seeds wrote to, using the executor-authors-SQL / orchestrator-applies-via-`npx tsx` split. **Do NOT run git in `C:/EV-Accounts`** (Render deploys from master; project memory).
- **Numbering (disk-authoritative, Ph191 lesson):** highest migration file on disk = **1371**. Ledger bare-number max = 1363 (image/stance migs 1364–1371 intentionally bypass `schema_migrations`). **Next number = `1372`.**
- **Suggested split (planner may bundle):**
  - `1372_az_2026_primary_election.sql` — bare primary row (D-05, date `2026-07-21`).
  - `1373_az_2026_statewide_races.sql` — 6 statewide + 1 corp commission (seats=2).
  - `1374_az_2026_legislative_races.sql` — 30 Senate + 30 House (seats=2). Generate with a PowerShell helper like the `generate_or_legislative_races.ps1` precedent, or a single `DO $$` loop over geo_ids `04001`–`04030`.
  - `1375_az_2026_local_races.sql` — 7 local shells.
  - `1376_az_2026_discovery.sql` — 4 discovery rows.
- **Every migration** (elections/races/discovery — NOT the image/stance class) MUST include a ledger entry `INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('137X') ON CONFLICT (version) DO NOTHING;` and a companion `_apply-migration-137X.ts` with smoke tests (copy the VA 322/324/325 apply-script structure).
- **Idempotency:** elections `ON CONFLICT (name, election_date, state) DO NOTHING`; races `ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING`; discovery `ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING` (or `WHERE NOT EXISTS` per the 241 exemplar — both valid).

### Seat-Anchoring / ext_id scheme (Q15 — resolved)
- **`races` has NO `ext_id` column.** A race's identity is `(election_id, position_name)` (partial-unique when `primary_party` is NULL) plus its `office_id` FK. There is nothing to mint.
- **No new external_ids** are created (D-04 forbids new office/politician rows). The `-4004xxx` range noted in prior AZ phases is a *politician* `external_id` scheme (Superintendent `-4004001`, Mine Inspector `-4004002`, Corp Commissioners `-4004003…-4004007`) — irrelevant to race shells.
- **Anchoring = office_id resolution by subquery** (chamber name + district geo_id + district_type), exactly like OR migration 239.

## 7. Discovery Rows (D-06 / D-07 — corrected dates)

4 rows into `essentials.discovery_jurisdictions`. **Note corrected primary date `2026-07-21`.**

| jurisdiction_geoid | jurisdiction_name | state | election_date | source_url | allowed_domains |
|--------------------|-------------------|-------|---------------|-----------|-----------------|
| `04` | `State of Arizona` | AZ | `2026-07-21` | `https://azsos.gov/elections` *(see note)* | `{azsos.gov, azcleanelections.gov, pima.gov, recorder.pima.gov, ballotpedia.org}` |
| `04` | `State of Arizona` | AZ | `2026-11-03` | `https://azsos.gov/elections` | same 5 |
| `04019` | `Pima County, Arizona` | AZ | `2026-07-21` | `https://www.pima.gov/394/Elections` | same 5 |
| `04019` | `Pima County, Arizona` | AZ | `2026-11-03` | `https://www.pima.gov/394/Elections` | same 5 |

- **Pima geoid `04019`** matches `src/lib/coverage.js` (`Pima County browseGovernmentList: ['04019']`) and FIPS (state 04 + county 019). CONFIRMED.
- **Canonical Pima elections domain:** `pima.gov` (the **Pima County Elections Department** at `pima.gov/394/Elections` and candidate lists at `pima.gov/678/Candidates`) is authoritative for candidate data. `recorder.pima.gov` is voter registration (kept in allowlist per D-07). [CITED: search results — official Pima Elections pages].
- **AZ statewide source_url** `https://azsos.gov/elections` is [ASSUMED] as the stable landing page; the live 2026 candidate-list deep-link (e.g., an `apps.azsos.gov/…/2026/` path) should be verified at execute time — but the domain `azsos.gov` is correct and in the allowlist.
- **`allowed_domains` = 5 elements** exactly matching D-07 (curated set). The `state` column is `char` — pass `'AZ'`.
- Both dates are within the 180-day cron window relative to the 2026-07-17 research date (primary ~4 days out, general ~109 days out), so both rows arm immediately (D-08 date-driven, no flag).

## 8. UI / Coverage (Q17 — resolved: NO edit needed)

- `src/pages/Landing.jsx` **no longer contains `COVERAGE_CITIES`** — it imports `COVERAGE_STATES` from `src/lib/coverage.js`.
- `src/lib/coverage.js` **already lists all covered AZ jurisdictions** (SQL/grep-verified): Arizona block has Tucson (`0477000`), Oro Valley (`0451600`), Marana (`0444270`), Sahuarita (`0462140`), South Tucson (`0468850`), all `hasContext:true`; `COVERAGE_COUNTIES` has Pima County (`04019`). **No Landing.jsx / coverage.js change is required in this phase** (contrast with VA Phase 105 Plan 03, which predates the coverage.js refactor).

## Runtime State Inventory

> This is an additive data-seed (new rows), not a rename/refactor. No stored data is being renamed; no OS/service/secret state is touched.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | New rows only in `elections`/`races`/`discovery_jurisdictions`; no existing rows renamed | none beyond the INSERTs |
| Live service config | Discovery cron reads `discovery_jurisdictions` by date-window (no config change) | none |
| OS-registered state | None | None — verified (no scheduler/cron registration touched; cron is DB-date-driven) |
| Secrets/env vars | Uses existing `DATABASE_URL` in `C:/EV-Accounts/backend/.env` | none |
| Build artifacts | No code change (coverage.js already correct) → no rebuild needed | None — verified |

## 9. Validation Architecture

> `nyquist_validation` config not read as a file here; this is a data-seed phase with **no unit-test framework** — validation is SQL assertions inside each migration (`DO $$ … RAISE EXCEPTION`) plus a companion `_apply-migration-137X.ts` smoke-test script (VA 322/324/325 precedent). Every success criterion below maps to an automated check.

### "Test Framework"
| Property | Value |
|----------|-------|
| Framework | In-migration `DO $$ … RAISE EXCEPTION` blocks + `_apply-migration-*.ts` (pg smoke tests via `npx tsx`) |
| Config file | none — pattern is per-migration |
| Quick run | `cd C:/EV-Accounts && npx tsx backend/scripts/_apply-migration-137X.ts` |
| Full suite | Re-run each apply script in order (1372→1376); all idempotent (row counts stable on re-apply) |

### Success criterion → verification map
| Criterion | Automated check |
|-----------|-----------------|
| Primary election row exists w/ correct date | `SELECT election_date FROM essentials.elections WHERE name='AZ 2026 Statewide Primary' AND state='AZ'` = `2026-07-21`; count AZ elections = 2 |
| 6 statewide + 1 corp race shells, zero NULL office_id (single-winner) | `COUNT` of the 6 statewide position_names = 6; each `office_id IS NOT NULL`; corp race exists w/ `seats=2` |
| 30 Senate + 30 House shells | `COUNT` where position_name LIKE `State Senate District %` = 30 AND LIKE `State House District %` = 30; House rows all `seats=2` |
| Zero NULL office_id for legislative + mayor shells | `SELECT COUNT(*) … WHERE office_id IS NULL AND position_name IN (…legislative+mayor…)` = 0 |
| Local shells: exactly the 7 confirmed; **zero Pima BoS, zero Tucson** | assert 7 local rows present; assert `NOT EXISTS` any race with position_name LIKE `%Pima%Supervisor%` or `%Tucson Ward%`/`Tucson Mayor` under the 2026 general |
| 4 discovery rows w/ 5-element allowlist + corrected dates | `COUNT(*) discovery WHERE jurisdiction_geoid IN ('04','04019')` = 4; `array_length(allowed_domains,1)=5`; dates ∈ {`2026-07-21`,`2026-11-03`}; **no `cron_active` reference** |
| Race-count-per-election assertion | `SELECT COUNT(*) FROM races WHERE election_id='e21f5757…'` = 9 (existing) + 74 (new) = **83** after all plans |
| Idempotency | re-run every apply script → all counts unchanged |
| Ledger entries | `schema_migrations` contains `'1372'…'1376'` |

### Wave 0 gaps
- None (no test infrastructure to stand up). Each migration ships with its own `DO $$` verifier + apply-script; that is the established, sufficient pattern.

## 10. Common Pitfalls

- **Wrong primary date (2026-08-04).** The single highest-risk error. Use **`2026-07-21`** everywhere (elections row + both primary discovery rows).
- **Seeding Pima BoS shells.** Would create 5 dead race shells for a non-existent 2026 contest. Do NOT seed; add a negative assertion to the local-races verifier.
- **Seeding Tucson city shells.** Odd-year; no 2026 race. Do NOT seed.
- **Modeling AZ House as 60 shells.** Violates the `(election_id, position_name) WHERE primary_party IS NULL` partial-unique index and misrepresents the 2-winner contest. Use 30 shells `seats=2`.
- **Seeding all 5 Corp Commission seats.** Only 2 are up. One race, `seats=2`.
- **Anchoring statewide races to the primary election.** All race shells anchor to the **general** (`e21f5757…`); the primary row is bare (VA Plan 01 lesson).
- **Forgetting the ledger row.** elections/races/discovery migrations must write `schema_migrations` (apply script RAISEs if missing) — unlike the image/stance migration class which bypasses it.
- **Verify-grep false positives.** Ph202 lesson: verification greps that forbid a token (e.g., `cron_active`) fail if the token appears even in a comment. Keep migration comments clean of forbidden tokens.
- **Treating filed candidates as nominees.** Primary is 07-21; any hand-seeded statewide slate is a filed field, not the general ballot — reconcile owed.

## 11. Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | AZ statewide discovery `source_url` = `https://azsos.gov/elections` (exact deep-link unverified) | §7 | LOW — domain correct + in allowlist; cron uses allowlist, not just the URL |
| A2 | Corp Commission 2026 candidate slate not captured → ship as shell unless pulled fresh | §5 | LOW — D-02 tolerates shells; discovery fills |
| A3 | Which specific 2 of 5 Corp Commission seats are up (assumed = seats last filled 2022, terms expiring Jan 2027) | §4c | LOW — at-large 2-winner race doesn't need per-seat identity |
| A4 | The 39 existing US House candidates are a complete filed field (spot-check only, not enumerated) | §5b | LOW — D-01 says verify/complete, not re-seed |
| A5 | At-large council `office_id` anchoring via deterministic `LIMIT 1` pick is acceptable | §4e / Open Q2 | MEDIUM — depends on how discovery cron maps candidates to shells |

## 12. Open Questions

1. **office_id anchoring for at-large multi-winner races (Corp Commission + town/city councils).** These bodies have N undifferentiated offices and no per-seat district, so a single race can only FK one `office_id`. **Options:** (a) anchor to a deterministic office (`LIMIT 1` by a stable order) to preserve a zero-NULL quality bar; (b) leave `office_id` NULL for at-large council/corp shells (the column is nullable) and rely on the discovery cron's jurisdiction-geoid matching. **Recommendation:** confirm how the discovery cron maps discovered candidates to race shells (by `office_id`? by jurisdiction geo? by `position_name`?) before choosing — this determines whether a `LIMIT 1` anchor is harmless or misleading. Single-winner races (statewide, mayors, senate) are unaffected (unambiguous office_id).
2. **House seats=2 vs 60 individual shells.** Recommended: 30 races `seats=2`. Confirm the frontend/profile rendering and the discovery cron both handle a `seats>1` race correctly (US House shells are all `seats=1`, so `seats=2` is a first for AZ). If the cron/UI assumes 1 seat, an alternative is per-seat naming — but AZ has no seat letters, so `seats=2` is the honest model.
3. **Hand-seed filed statewide candidates now, or ship shells + reconcile after 07-21?** (§5). Genuine decision; recommend shells-only default given the imminent primary. Needs user/planner confirmation.
4. **Primary election row value.** With the primary 4 days out, the `2026-07-21` primary discovery rows arm only briefly. Confirm the discovery cron won't error on a near-past election_date; if it might, consider seeding only the general-date discovery rows and still seeding the bare primary election row for record-keeping (D-05 satisfied). Low stakes.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL client (`pg`) + `tsx` | apply-migration scripts | ✓ | in `C:/EV-Accounts/backend` node_modules | — |
| `DATABASE_URL` (prod Supabase) | migrations | ✓ | `C:/EV-Accounts/backend/.env` | — |
| psql CLI | ad-hoc verification | ✓ | PostgreSQL 18 | tsx pg pool |
| Live prod DB (writes) | seeding | ✓ (via orchestrator-applies split) | — | — |

**Missing dependencies:** none.

## Sources

### Primary (HIGH)
- Live prod DB via `pg` (read-only) — schema, constraints, AZ office universe, existing election/races/candidates, discovery rows, ledger max. [VERIFIED this session]
- `.planning/phases/105-va-2026-elections-discovery/105-0{1,2,3}-PLAN.md` — elections/races/discovery migration pattern.
- `supabase/migrations/241_or_discovery_jurisdictions.sql`, `223_ca_discovery_jurisdictions.sql` — discovery shape (no `cron_active`).
- `supabase/migrations/239_or_legislative_races.sql` — legislative race-shell subquery pattern.
- `src/lib/coverage.js`, `src/pages/Landing.jsx` — coverage already seeded.

### Secondary (HIGH-MEDIUM, cited)
- news.ballotpedia.org/2026/02/13 (HB 2022 primary → July 21); elections.maricopa.gov primary-date notice.
- ballotpedia.org: Arizona state executive / Corporation Commission / State Senate / State House / Pima County 2026 election pages.
- en.wikipedia.org/wiki/2026_Arizona_elections; Maricopa County Board of Supervisors (county 4-yr presidential cycle).
- southtucsonaz.gov/elections (2026 candidate info); tucsonspotlight.org (South Tucson 3 seats); iloveov.com/2026-election; tucson.com (OV/Marana/Sahuarita council races).
- ballotpedia.org City_elections_in_Tucson_(2025); tucsonaz.gov Clerk Elections (odd-year).

### Tertiary (needs execute-time re-verification)
- azsos.gov statewide candidate deep-link (A1); Corp Commission 2026 slate (A2/A3).

## Metadata
- **Confidence:** cycle facts HIGH (multi-source cross-verified); DB facts HIGH (live SQL); candidate rosters MEDIUM (volatile, primary 4 days out — re-pull at execute).
- **Research date:** 2026-07-17 · **Valid until:** 2026-07-21 for candidate rosters (primary resolves nominees); ~30 days for structural/DB facts.

## RESEARCH COMPLETE
