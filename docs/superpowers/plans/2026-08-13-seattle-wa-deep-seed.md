# Seattle WA Deep Seed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Seed Seattle, King County, and the 49-district WA legislature — geofences, offices, incumbents, 2026 candidates, headshots, banners, and city/county stances — with the candidate layer landing before the August 21 certification gate.

**Architecture:** Three ordered groups. **Group A** is the pre-certification critical path: the WA TIGER load that gates all routing, then the legislative and county structures the 2026 races must attach to, then the race and candidate seeding. **Group B** is the single cull event on/after August 21. **Group C** is the ungated remainder — Seattle city, headshots, banners, stances, documentation.

**Tech Stack:** PostgreSQL/PostGIS (Supabase), TypeScript loaders run via `npx tsx`, SQL migrations applied through the `supabase-local` MCP as the `postgres` role, Playwright for JS-rendered headshot pages.

Design spec: `docs/superpowers/specs/2026-08-13-seattle-wa-deep-seed-design.md`

---

## Global Constraints

These apply to **every** task. Violating any one of them has previously produced a defect that took a follow-up milestone to unwind.

**Migrations**

- Migration files live in `C:/EV-Accounts/backend/migrations`. That repo pushes to Render — **never** run bare `git` there; always use `git -C "C:/EV-Accounts" …`.
- **Never hard-code a migration number in advance.** The counter drifts hourly from parallel workstreams. Immediately before every commit, run `node C:/EV-Accounts/backend/scripts/check-migration-numbers.mjs` and take the number it reports. The on-disk maximum at plan-writing time was **1741**, which will be stale by execution.
- Apply migrations **as the `postgres` role** via `mcp__supabase-local__apply_migration` or `execute_sql`. The `ev_migrator` role sees **zero rows** under RLS, and `ev_api` cannot write `public.*`. A migration that "succeeded" under the wrong role may have written nothing.
- **Verify on row counts, never on absence of an error.** Every task below ends with a count query and an expected number.
- Data-seed migrations do **not** register in `supabase_migrations.schema_migrations`. Do not query the ledger to confirm a seed landed.
- `mcp__supabase-local` **is production**. Every write is live.

**Schema**

- `essentials.districts.government_id` is frequently NULL — **join districts by `geo_id`**, never by `government_id`.
- `essentials.offices` has no `politician_id`, no `seat_label`, no `is_active`, and no `email`. Occupancy lives in `essentials.office_terms`; emails live on `politicians.email_addresses` (a `TEXT[]`).
- Occupancy requires **both** gates: an `office_terms` row with real dates **and** `politicians.is_incumbent`. Never leave `term_start`/`term_end` both NULL — that pair reads downstream as "currently serving".
- `races` and `race_candidates` have **no unique constraint** on the dedupe key. Use `NOT EXISTS`, **never** `ON CONFLICT`.
- Every row in one election needs a **distinct `position_name`** (partial unique indexes on `(election_id, position_name)`).

**Tooling**

- **Never use a bash heredoc to write a script file** — heredocs eat backslashes. Use the Write tool.
- Use forward slashes in all Markdown paths. Tailwind v4 scans Markdown and a raw backslash path crashes the build.

**Data integrity**

- **Never cite a URL that was not fetched.** Retrieve before writing.
- Party affiliation is **never** displayed on profiles.
- A subagent claiming it verified something is not verification. Re-run the check yourself.

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts` | Statewide TIGER loader; per-state allowlist + expected counts | Modify — add WA |
| `C:/EV-Accounts/backend/scripts/verify-wa-tiger-import.sql` | WA post-load count assertions | Create |
| `C:/EV-Accounts/backend/scripts/smoke-wa-geofences.ts` | Point-in-polygon smoke test for a Seattle address | Create |
| `C:/EV-Accounts/backend/scripts/load-seattle-council-boundaries.ts` | Seattle 7 council districts → X0025 | Create |
| `C:/EV-Accounts/backend/scripts/load-kingcounty-council-boundaries.ts` | King County 9 council districts → X0026 | Create |
| `C:/EV-Accounts/backend/migrations/<n>_wa_legislature_structure.sql` | 49 SLDU + 49 SLDL districts, 2 chambers, 147 offices | Create |
| `C:/EV-Accounts/backend/migrations/<n>_wa_legislature_incumbents.sql` | 147 politicians + office_terms | Create |
| `C:/EV-Accounts/backend/migrations/<n>_king_county_structure.sql` | Standalone government, chambers, 14 offices | Create |
| `C:/EV-Accounts/backend/migrations/<n>_king_county_incumbents.sql` | 13 elected + 1 appointed Sheriff | Create |
| `C:/EV-Accounts/backend/migrations/<n>_wa_2026_races_candidates.sql` | Legislative + county races and full filed field | Create |
| `C:/EV-Accounts/backend/migrations/<n>_wa_2026_cull.sql` | Post-certification top-two cull | Create |
| `C:/EV-Accounts/backend/migrations/<n>_seattle_structure.sql` | Seattle government, 3 chambers, 11 offices | Create |
| `C:/EV-Accounts/backend/migrations/<n>_seattle_incumbents.sql` | 11 politicians + office_terms | Create |
| `src/lib/buildingImages.js` | Banner registry (`CURATED_LOCAL`) | Modify — 2 entries |
| `LOCATION-ONBOARDING.md` | City rows + Washington Quick Reference | Modify |
| `.planning/WA-GAPS.md` | Explicit uncovered scope | Create |

---

# GROUP A — Pre-certification critical path

Everything in Group A should land before **August 21**.

---

### Task 1: WA TIGER load — places and legislative districts

This gates every other task. No WA address routes to any city until it lands.

**Files:**
- Modify: `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts:37` (allowlist) and the expected-counts section
- Create: `C:/EV-Accounts/backend/scripts/verify-wa-tiger-import.sql`

**Interfaces:**
- Produces: `essentials.geofence_boundaries` rows at `mtfcc IN ('G4110','G5210','G5220')` with `state='53'`, keyed by `geo_id`. Every later task joins districts to these by `geo_id`.

- [ ] **Step 1: Add WA to the loader allowlist**

In `load-state-tiger-boundaries.ts`, add to `STATE_LAYER_ALLOWLIST` alongside the other states:

```typescript
  // WA. place: Washington's incorporated cities and towns are elected governments.
  // cousub is deliberately EXCLUDED — WA county subdivisions are statistical CCDs
  // (FUNCSTAT='S'), not elected bodies, same as CA. Do NOT add WA to
  // COUSUB_FUNCSTAT_STATES.
  // sldu/sldl: WA has 49 legislative districts. Each elects ONE senator and TWO
  // representatives over the SAME boundary, so sldl is 49 polygons covering 98
  // seats — it is NOT 98 polygons. Verify the MTFCC values the loader reads back;
  // CA has G5210/G5220 inverted relative to the TIGER convention.
  // cd119 and county are already loaded for WA (10 + 39) — not re-run here.
  WA: new Set(['place', 'sldu', 'sldl']),
```

- [ ] **Step 2: Dry-run to measure the real place count**

Every prior state recorded its count as "confirmed via dry-run" rather than guessing. Do the same.

Run:
```bash
cd "C:/EV-Accounts/backend" && npx tsx scripts/load-state-tiger-boundaries.ts --state WA --fips 53 --layers place,sldu,sldl --dry-run
```

Expected: no DB writes; printed counts for each layer. Record the G4110 place count — call it `WA_PLACE_COUNT`. Expect `sldu` = 49 and `sldl` = 49. **If `sldl` reports 98, stop** — that contradicts the multi-member model and the whole district/office mapping in Task 2 needs rechecking before proceeding.

- [ ] **Step 3: Record the confirmed counts in the loader**

Add a WA expected-counts block matching the existing per-state blocks, using the measured number and today's date:

```typescript
      place: WA_PLACE_COUNT,  // confirmed via dry-run 2026-08-13 — WA G4110 incorporated places
      sldu: 49,               // 49 WA legislative districts (1 senator each)
      sldl: 49,               // 49 polygons, 98 representatives (2 per district)
```

- [ ] **Step 4: Run the real load**

```bash
cd "C:/EV-Accounts/backend" && npx tsx scripts/load-state-tiger-boundaries.ts --state WA --fips 53 --layers place,sldu,sldl
```

- [ ] **Step 5: Write the verification SQL**

Create `C:/EV-Accounts/backend/scripts/verify-wa-tiger-import.sql`:

```sql
-- WA TIGER import verification.
-- Every query must match its expected value before Task 2 begins.

-- 1. Layer counts. Replace <WA_PLACE_COUNT> with the dry-run number from Step 2.
SELECT mtfcc, count(*) AS n
FROM essentials.geofence_boundaries
WHERE state = '53'
GROUP BY mtfcc
ORDER BY mtfcc;
-- Expected: G4000=1, G4020=39, G5200=10, G4110=<WA_PLACE_COUNT>, G5210=49, G5220=49

-- 2. Seattle exists as a place and its geo_id is what we will seed against.
SELECT geo_id, name, mtfcc
FROM essentials.geofence_boundaries
WHERE state = '53' AND mtfcc = 'G4110' AND name ILIKE 'Seattle%';
-- Expected: exactly 1 row. RECORD the geo_id — it is presumed 5363000 but the
-- authoritative value is whatever this returns. Four prior cities were seeded
-- against a wrong estimated geo_id.

-- 3. Which MTFCC is upper vs lower? Do not assume; CA has these inverted.
SELECT mtfcc, count(*), min(name) AS sample_name
FROM essentials.geofence_boundaries
WHERE state = '53' AND mtfcc IN ('G5210','G5220')
GROUP BY mtfcc;
-- Read sample_name to decide which is Senate and which is House.
-- RECORD the mapping; Task 2 depends on it.

-- 4. Geometry validity — a bad ring silently breaks point-in-polygon routing.
SELECT count(*) AS invalid_geoms
FROM essentials.geofence_boundaries
WHERE state = '53' AND NOT ST_IsValid(geom);
-- Expected: 0. If nonzero, apply ST_MakeValid to the affected rows and re-check.
```

- [ ] **Step 6: Run the verification and confirm every expectation**

```bash
node C:/EV-Accounts/backend/scripts/check-migration-numbers.mjs
```
Then execute each query in `verify-wa-tiger-import.sql` via `mcp__supabase-local__execute_sql` and confirm the expected value. Record `WA_PLACE_COUNT`, the **Seattle geo_id**, and the **G5210/G5220 upper-lower mapping** — Tasks 2 and 7 consume all three.

- [ ] **Step 7: Write the smoke test**

Create `C:/EV-Accounts/backend/scripts/smoke-wa-geofences.ts`, following the shape of `smoke-or-geofences.ts`. It asserts that a downtown Seattle coordinate (lat 47.6062, lng -122.3321) resolves to exactly one G4110 place, one G4020 county, one G5200 congressional, one G5210, and one G5220 polygon.

Note `ST_MakePoint` takes **(longitude, latitude)** — reversing them is the single most common cause of a zero-row smoke result.

- [ ] **Step 8: Run the smoke test**

```bash
cd "C:/EV-Accounts/backend" && npx tsx scripts/smoke-wa-geofences.ts
```
Expected: 5 rows, county = King County (53033).

- [ ] **Step 9: Commit**

```bash
git -C "C:/EV-Accounts" add backend/scripts/load-state-tiger-boundaries.ts backend/scripts/verify-wa-tiger-import.sql backend/scripts/smoke-wa-geofences.ts
git -C "C:/EV-Accounts" commit -m "feat(geo): load WA TIGER places and legislative districts"
```

---

### Task 2: WA legislature structure — districts, chambers, 147 offices

**Files:**
- Create: `C:/EV-Accounts/backend/migrations/<n>_wa_legislature_structure.sql`

**Interfaces:**
- Consumes: the G5210/G5220 mapping and geo_ids from Task 1.
- Produces: 98 `essentials.districts` rows (49 upper + 49 lower), 2 `chambers` rows (`State Senate`, `House of Representatives`) under the existing State of Washington government, and 147 `offices` rows. Tasks 3 and 5 join to these offices.

- [ ] **Step 1: Confirm the parent government and existing naming convention**

```sql
SELECT id, name, geo_id FROM essentials.governments WHERE state='WA';
-- Expected: 1 row, 'State of Washington', geo_id '53'. RECORD the id.

SELECT name, slug FROM essentials.chambers c
JOIN essentials.governments g ON c.government_id=g.id WHERE g.state='WA';
-- Expected: 5 rows using the SHORT form ('Governor', not 'Washington Governor').
-- New chambers must match this convention: 'State Senate', 'House of Representatives'.
```

- [ ] **Step 2: Write the structure migration**

Create the migration file (number from `check-migration-numbers.mjs` at commit time). It must:

1. Insert 49 `STATE_UPPER` districts and 49 `STATE_LOWER` districts, joined to geofences by `geo_id`, matching the casing convention already used by WA rows in `essentials.districts`.
2. Insert the two chambers under the State of Washington government id.
3. Insert 49 Senator offices (one per upper district) and 98 Representative offices (**two per lower district**, titled `Representative Position 1` and `Representative Position 2`).

The multi-member guard — this is the Maryland trap and the single most likely failure in this task:

```sql
-- CORRECT — guards on the seat, so both positions insert:
INSERT INTO essentials.offices (id, chamber_id, district_id, title)
SELECT gen_random_uuid(), :house_chamber_id, d.id, 'Representative Position ' || p.pos
FROM essentials.districts d
CROSS JOIN (SELECT 1 AS pos UNION ALL SELECT 2) p
WHERE d.district_type = 'STATE_LOWER' AND d.geo_id LIKE '53%'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id
      AND o.title = 'Representative Position ' || p.pos
  );

-- WRONG — guarding on (district_id, chamber_id) makes Position 2 a no-op in
-- every district and silently lands 49 offices instead of 98.
```

- [ ] **Step 3: Apply as postgres**

Apply via `mcp__supabase-local__apply_migration`. Confirm the role is `postgres` — under `ev_migrator`, RLS hides every row and the result is indistinguishable from success.

- [ ] **Step 4: Verify on counts**

```sql
SELECT district_type, count(*) FROM essentials.districts
WHERE geo_id LIKE '53%' AND district_type IN ('STATE_UPPER','STATE_LOWER')
GROUP BY district_type;
-- Expected: STATE_UPPER=49, STATE_LOWER=49

SELECT c.name, count(o.id) AS offices
FROM essentials.chambers c
JOIN essentials.governments g ON c.government_id=g.id
LEFT JOIN essentials.offices o ON o.chamber_id=c.id
WHERE g.state='WA' AND c.name IN ('State Senate','House of Representatives')
GROUP BY c.name;
-- Expected: State Senate=49, House of Representatives=98
-- A House count of 49 means the NOT EXISTS guard was keyed on chamber. Fix and re-apply.

SELECT count(*) FROM (
  SELECT district_id FROM essentials.offices o
  JOIN essentials.districts d ON o.district_id=d.id
  WHERE d.district_type='STATE_LOWER' AND d.geo_id LIKE '53%'
  GROUP BY district_id HAVING count(*) <> 2
) x;
-- Expected: 0 — every lower district has exactly two seats.
```

- [ ] **Step 5: Commit**

```bash
node C:/EV-Accounts/backend/scripts/check-migration-numbers.mjs
git -C "C:/EV-Accounts" add backend/migrations/
git -C "C:/EV-Accounts" commit -m "feat(wa): legislature structure — 98 districts, 2 chambers, 147 offices"
```

---

### Task 3: WA legislature incumbents

Incumbents must exist **before** Task 5, so an incumbent running for re-election links to their existing politician row instead of minting a duplicate. Grouping by `full_name` finds **name collisions, not identity** — three different Mike Rogers exist in this database.

**Files:**
- Create: `C:/EV-Accounts/backend/migrations/<n>_wa_legislature_incumbents.sql`

**Interfaces:**
- Consumes: office ids from Task 2.
- Produces: 147 `politicians` rows at `external_id` in `-5310001..-5310049` (Senate) and `-5320001..-5320098` (House), each with an `office_terms` row.

- [ ] **Step 1: Pull the authoritative roster**

Source: `leg.wa.gov` member listing (probed clean, HTTP 200, no WAF). Capture for each member: full legal name, district number, chamber, position number for House members, term start, and official bio URL. Ballotpedia is a cross-check, never the primary source — and a Ballotpedia HTTP 200 is not identity confirmation.

- [ ] **Step 2: Confirm the external_id band is still free**

```sql
SELECT count(*) FROM essentials.politicians
WHERE external_id BETWEEN -5400000 AND -5300000;
-- Expected: 5 (the statewide executives only). Any other number means someone
-- else claimed part of the band — re-plan the range before writing.
```

- [ ] **Step 3: Write the incumbents migration**

147 `politicians` inserts guarded `ON CONFLICT (external_id) DO NOTHING` (that column has a real unique index), each paired with an `office_terms` row carrying a **real `term_start`** and `politicians.is_incumbent=true`.

- [ ] **Step 4: Apply as postgres and verify**

```sql
SELECT c.name, count(DISTINCT p.id) AS seated
FROM essentials.chambers c
JOIN essentials.governments g ON c.government_id=g.id
JOIN essentials.offices o ON o.chamber_id=c.id
JOIN essentials.office_terms ot ON ot.office_id=o.id
JOIN essentials.politicians p ON ot.politician_id=p.id
WHERE g.state='WA' AND c.name IN ('State Senate','House of Representatives')
GROUP BY c.name;
-- Expected: State Senate=49, House of Representatives=98

SELECT count(*) FROM essentials.office_terms ot
JOIN essentials.offices o ON ot.office_id=o.id
JOIN essentials.districts d ON o.district_id=d.id
WHERE d.geo_id LIKE '53%' AND ot.term_start IS NULL AND ot.term_end IS NULL;
-- Expected: 0 — NULL/NULL reads as "currently serving" and hides departures.

SELECT count(*) FROM (
  SELECT o.id FROM essentials.offices o
  JOIN essentials.districts d ON o.district_id=d.id
  JOIN essentials.office_terms ot ON ot.office_id=o.id
  WHERE d.geo_id LIKE '53%' AND d.district_type IN ('STATE_UPPER','STATE_LOWER')
  GROUP BY o.id HAVING count(*) > 1
) x;
-- Expected: 0 — no office double-seated.
```

- [ ] **Step 5: Commit**

```bash
node C:/EV-Accounts/backend/scripts/check-migration-numbers.mjs
git -C "C:/EV-Accounts" add backend/migrations/
git -C "C:/EV-Accounts" commit -m "feat(wa): seat 147 state legislators with office terms"
```

---

### Task 4: King County — geofences, government, offices, incumbents

**Files:**
- Create: `C:/EV-Accounts/backend/scripts/load-kingcounty-council-boundaries.ts`
- Create: `C:/EV-Accounts/backend/migrations/<n>_king_county_structure.sql`
- Create: `C:/EV-Accounts/backend/migrations/<n>_king_county_incumbents.sql`

**Interfaces:**
- Produces: 9 X0026 geofences (`kingcounty-wa-council-district-1..9`), a standalone `governments` row at `geo_id` 53033, and 14 offices. Task 5 attaches county races to these.

- [ ] **Step 1: Load the 9 council district boundaries**

Create `load-kingcounty-council-boundaries.ts` modeled on `load-washco-commissioner-boundaries.ts`. Source is the King County GIS ArcGIS service. Requirements carried from prior ArcGIS loads:

- `outSR=4326` is mandatory — the native projection is not WGS84 and omitting this silently loads unusable geometry.
- Apply `ST_MakeValid`; a prior ward polygon arrived with 19 rings and failed validity.
- `mtfcc='X0026'`, `geo_id='kingcounty-wa-council-district-N'`.

- [ ] **Step 2: Verify the geofences**

```sql
SELECT count(*) AS n, count(*) FILTER (WHERE NOT ST_IsValid(geom)) AS invalid
FROM essentials.geofence_boundaries WHERE mtfcc='X0026';
-- Expected: n=9, invalid=0
```

- [ ] **Step 3: Write the structure migration**

King County is a **standalone `governments` row at `geo_id` 53033 — not nested under State of Washington**, matching Clark County NV and Washington County OR.

Chambers and offices:

| Chamber | Offices |
|---|---|
| County Executive | 1 — `County Executive` |
| Metropolitan King County Council | 9 — `Councilmember, District 1..9` |
| Prosecuting Attorney | 1 |
| Assessor | 1 |
| Director of Elections | 1 |
| Sheriff | 1 — appointed |

Set `policy_engagement_level='none'` on the Sheriff chamber. That is an API-read per-chamber field requiring no deploy; it gives the appointed office the administrative treatment prior cities gave appointed clerks and auditors. Do **not** attempt this via `computeVariant` in `src/lib/classify.js` — that function is dead code.

- [ ] **Step 4: Write the incumbents migration**

External ids `-5303301..-5303314`. Confirm each name against `kingcounty.gov` before writing:

| Office | Incumbent |
|---|---|
| County Executive | Girmay Zahilay (elected Nov 2025) |
| Prosecuting Attorney | Leesa Manion |
| Assessor | John Wilson (incumbent; not seeking re-election) |
| Director of Elections | Julie Wise |
| Council Districts 1–9 | Confirm all nine from the official roster |

Set `is_appointed=true` on the Sheriff. The Council Chair is a **title on a seat**, not a separate office — do not create a tenth council row for it.

- [ ] **Step 5: Apply both as postgres and verify**

```sql
SELECT g.name, g.geo_id, c.name AS chamber, count(o.id) AS offices
FROM essentials.governments g
JOIN essentials.chambers c ON c.government_id=g.id
LEFT JOIN essentials.offices o ON o.chamber_id=c.id
WHERE g.geo_id='53033'
GROUP BY g.name, g.geo_id, c.name ORDER BY c.name;
-- Expected: 6 chambers; council=9, every other chamber=1. Total offices=14.

SELECT count(DISTINCT p.id) FROM essentials.politicians p
WHERE p.external_id BETWEEN -5303314 AND -5303301;
-- Expected: 14

SELECT count(*) FROM essentials.governments
WHERE geo_id='53033' AND name ILIKE '%King%';
-- Expected: 1 — and it must NOT be parented to the State of Washington row.
```

- [ ] **Step 6: Commit**

```bash
node C:/EV-Accounts/backend/scripts/check-migration-numbers.mjs
git -C "C:/EV-Accounts" add backend/scripts/load-kingcounty-council-boundaries.ts backend/migrations/
git -C "C:/EV-Accounts" commit -m "feat(king-county): standalone government, 9 council geofences, 14 offices"
```

---

### Task 5: 2026 races and full filed candidate field

**This is the task the August 21 deadline is about.** It must complete before certification.

**Files:**
- Create: `C:/EV-Accounts/backend/migrations/<n>_wa_2026_races_candidates.sql`

**Interfaces:**
- Consumes: legislative offices (Task 2), legislative incumbents (Task 3), King County offices and incumbents (Task 4).
- Produces: `races` and `race_candidates` rows on the existing `WA 2026 Statewide General` election (`51e7a875-bff9-4e96-adcf-41736454d25d`).

- [ ] **Step 1: Determine which Senate districts are actually on the ballot**

WA senators serve **staggered four-year terms**, so only roughly half the 49 districts have a Senate race in any even year. All 98 House seats are up every cycle.

Read the set from the **Secretary of State filed-candidate list**. Do not infer it from district numbering, and do not carry it over from a prior cycle. Record the list of Senate districts before writing any SQL.

- [ ] **Step 2: Assemble the filed field**

For each race, capture every filed candidate — this is pre-certification, so the full primary field, not survivors. Sources: WA SoS for legislative races, King County Elections for county races.

Also capture, for each candidate, whether they are an existing incumbent. Incumbents **must** link to their existing politician row from Task 3 or 4. Minting a fresh row for a sitting member creates a duplicate that a later dedupe pass will mistake for a name collision.

- [ ] **Step 3: Write the races and candidates migration**

Two constraints govern the SQL shape:

```sql
-- position_name must be DISTINCT across the whole election. WA's two-per-district
-- House seats make this sharp — these two must not collapse:
--   'WA Legislative District 43 Representative Position 1'
--   'WA Legislative District 43 Representative Position 2'

-- races and race_candidates have NO unique constraint on the dedupe key.
-- Use NOT EXISTS. ON CONFLICT will error or silently mis-target.
INSERT INTO essentials.races (id, election_id, position_name, office_id)
SELECT gen_random_uuid(), :election_id, :position_name, :office_id
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.races
  WHERE election_id = :election_id AND position_name = :position_name
);
```

- [ ] **Step 4: Apply as postgres and verify**

```sql
-- No duplicate position_name anywhere in the election.
SELECT count(*) FROM (
  SELECT position_name FROM essentials.races
  WHERE election_id='51e7a875-bff9-4e96-adcf-41736454d25d'
  GROUP BY position_name HAVING count(*) > 1
) x;
-- Expected: 0

-- Both House positions present in every district that has a House race.
SELECT count(*) FROM (
  SELECT substring(position_name from 'District [0-9]+') AS d
  FROM essentials.races
  WHERE election_id='51e7a875-bff9-4e96-adcf-41736454d25d'
    AND position_name LIKE '%Representative%'
  GROUP BY d HAVING count(*) <> 2
) x;
-- Expected: 0

-- No race left with zero candidates (a zero-candidate shell is hidden from
-- /results and reads as coverage that is not there).
SELECT r.position_name FROM essentials.races r
LEFT JOIN essentials.race_candidates rc ON rc.race_id=r.id
WHERE r.election_id='51e7a875-bff9-4e96-adcf-41736454d25d'
GROUP BY r.id, r.position_name HAVING count(rc.id)=0;
-- Expected: 0 rows

-- No incumbent duplicated as a fresh politician row.
SELECT p.full_name, count(*) FROM essentials.race_candidates rc
JOIN essentials.politicians p ON rc.politician_id=p.id
JOIN essentials.races r ON rc.race_id=r.id
WHERE r.election_id='51e7a875-bff9-4e96-adcf-41736454d25d'
GROUP BY p.full_name HAVING count(*) > 1;
-- Investigate every row. Identical names are not proof of duplication —
-- confirm identity against a source the seeding pass never touched.
```

- [ ] **Step 5: Commit**

```bash
node C:/EV-Accounts/backend/scripts/check-migration-numbers.mjs
git -C "C:/EV-Accounts" add backend/migrations/
git -C "C:/EV-Accounts" commit -m "feat(wa): 2026 legislative and King County races with full filed field"
```

---

# GROUP B — The certification gate

---

### Task 6: Top-two cull, on or after August 21

**Do not start this task before the Secretary of State certifies.** The gate is the **certified canvass**, not a press call or an election-night margin.

**Files:**
- Create: `C:/EV-Accounts/backend/migrations/<n>_wa_2026_cull.sql`

- [ ] **Step 1: Confirm certification has actually occurred**

Verify on the SoS site that the August 4 primary is certified. A results page showing complete-looking numbers is not certification.

- [ ] **Step 2: Establish the pre-cull baseline**

```sql
SELECT count(*) AS candidates_before
FROM essentials.race_candidates rc
JOIN essentials.races r ON rc.race_id=r.id
WHERE r.election_id='51e7a875-bff9-4e96-adcf-41736454d25d';
-- RECORD this number.
```

- [ ] **Step 3: Write the cull**

Covers **all** WA races in one pass — the legislative and county rows from Task 5 plus the 69 pre-verified congressional candidates already waiting on this gate.

Rules:
- Two advancers per race under WA's top-two system, regardless of party.
- A race that became **unopposed** and vanished from the ballot resolves to `won` — use the `result` column.
- Record the certified vote totals as the basis for each cull decision.

- [ ] **Step 4: Apply as postgres and verify the delta is exactly what was intended**

```sql
SELECT r.position_name, count(rc.id) AS advancing
FROM essentials.races r
JOIN essentials.race_candidates rc ON rc.race_id=r.id
WHERE r.election_id='51e7a875-bff9-4e96-adcf-41736454d25d'
GROUP BY r.id, r.position_name
HAVING count(rc.id) > 2;
-- Expected: 0 rows.

SELECT count(*) AS candidates_after
FROM essentials.race_candidates rc
JOIN essentials.races r ON rc.race_id=r.id
WHERE r.election_id='51e7a875-bff9-4e96-adcf-41736454d25d';
-- The drop from candidates_before must equal EXACTLY the number of
-- non-advancers identified in Step 3. A larger drop means the cull
-- over-matched — restore and narrow the predicate before proceeding.
```

- [ ] **Step 5: Commit**

```bash
node C:/EV-Accounts/backend/scripts/check-migration-numbers.mjs
git -C "C:/EV-Accounts" add backend/migrations/
git -C "C:/EV-Accounts" commit -m "feat(wa): top-two cull on certified August 2026 canvass"
```

---

# GROUP C — Seattle city and enrichment (ungated)

---

### Task 7: Seattle — geofences, government, offices, incumbents

**Files:**
- Create: `C:/EV-Accounts/backend/scripts/load-seattle-council-boundaries.ts`
- Create: `C:/EV-Accounts/backend/migrations/<n>_seattle_structure.sql`
- Create: `C:/EV-Accounts/backend/migrations/<n>_seattle_incumbents.sql`

- [ ] **Step 1: Load the 7 council district boundaries**

Source: Seattle ArcGIS / data.seattle.gov. `mtfcc='X0025'`, `geo_id='seattle-wa-council-district-N'`. Apply `outSR=4326` and `ST_MakeValid` as in Task 4.

```sql
SELECT count(*) AS n, count(*) FILTER (WHERE NOT ST_IsValid(geom)) AS invalid
FROM essentials.geofence_boundaries WHERE mtfcc='X0025';
-- Expected: n=7, invalid=0
```

- [ ] **Step 2: Write the structure migration**

Government row at the **Seattle geo_id recorded in Task 1 Step 6** (presumed 5363000 — use the verified value), under State of Washington.

| Chamber | Offices | District type |
|---|---|---|
| Mayor | 1 | LOCAL_EXEC |
| City Council | 9 | LOCAL — Districts 1–7 on X0025, Positions 8 and 9 citywide |
| City Attorney | 1 | LOCAL_EXEC |

Titles follow Seattle's own usage: **`Councilmember`** as one word; `Councilmember, District N`; `Councilmember, Position 8 (Citywide)` and `Position 9`.

Mayor is `LOCAL_EXEC` because Seattle's mayor is **directly elected**, not council-selected — the distinction that separates Boston's Wu from a Cambridge-style rotational mayor.

- [ ] **Step 3: Write the incumbents migration**

External ids `-5363001..-5363011`. Confirm every name and term start against `seattle.gov` before writing — the City Clerk's terms-of-office page is authoritative.

Known at planning time: Mayor **Katie Wilson** and City Attorney **Erika Evans**, both since January 2026; **Eddie Lin** (D2, elected Nov 2025); **Debora Juarez** (D5, *appointed* July 2025 — set `is_appointed=true`); **Dan Strauss** (D6) and **Robert Kettle** (D7), both elected Nov 2023; **Alexis Mercedes Rinck** (Position 8) and **Dionne Foster** (Position 9), both elected Nov 2025. Districts 1, 3 and 4 must be confirmed from the official roster.

- [ ] **Step 4: Apply as postgres and verify**

```sql
SELECT c.name AS chamber, count(o.id) AS offices, count(ot.politician_id) AS seated
FROM essentials.governments g
JOIN essentials.chambers c ON c.government_id=g.id
LEFT JOIN essentials.offices o ON o.chamber_id=c.id
LEFT JOIN essentials.office_terms ot ON ot.office_id=o.id
WHERE g.geo_id='<seattle_geo_id>'
GROUP BY c.name ORDER BY c.name;
-- Expected: Mayor 1/1, City Council 9/9, City Attorney 1/1

SELECT count(*) FROM essentials.office_terms ot
JOIN essentials.offices o ON ot.office_id=o.id
JOIN essentials.chambers c ON o.chamber_id=c.id
JOIN essentials.governments g ON c.government_id=g.id
WHERE g.geo_id='<seattle_geo_id>' AND ot.term_start IS NULL;
-- Expected: 0
```

- [ ] **Step 5: Commit**

```bash
node C:/EV-Accounts/backend/scripts/check-migration-numbers.mjs
git -C "C:/EV-Accounts" add backend/scripts/load-seattle-council-boundaries.ts backend/migrations/
git -C "C:/EV-Accounts" commit -m "feat(seattle): 7 council geofences, government, 11 offices and incumbents"
```

---

### Task 8: Headshots — 171 targets

All three hosts were probed on 2026-08-13 and answer plain `curl` with a Chrome UA, **no WAF**.

- [ ] **Step 1: Legislature (147) from leg.wa.gov**

**Scrape the roster HTML for `img src`.** Do not HEAD-probe computed filenames — that approach missed members with high suffix numbers on both mgaleg.maryland.gov and malegislature.gov.

- [ ] **Step 2: King County (13 + Sheriff) from kingcounty.gov**

The council page exposes 10 `<img>` tags directly. Source the countywide officers from their individual department pages.

- [ ] **Step 3: Seattle (11) — expect the AEM pattern**

The council roster returns 72KB with **zero `<img>` tags**, so portraits are CSS `background-image` or JS-rendered. `WebFetch` will silently fail here. Ladder, in order: `curl` + `grep` for `background-image` URLs → per-member bio pages → Playwright.

- [ ] **Step 4: Process every image identically**

600×750, 4:5, q90. **Crop first, then resize** — resizing before cropping distorts faces. Eyes at roughly the upper third. No graphics, logos, or badges composited in.

- [ ] **Step 5: Upload and link**

Bucket `politician_photos`, path `{politician_id}-headshot.jpg`. Insert `politician_images` as `(politician_id, url, type='default', photo_license=…)`. `photo_origin_url` lives on `politicians`, not on the image row.

- [ ] **Step 6: Spot-check identity, then verify coverage**

Wrong-person headshots have shipped repeatedly — West Covina, Pomona, Glendale. Confirm a sample of faces against a second independent source before declaring done.

```sql
SELECT g.name, count(DISTINCT p.id) AS officials,
       count(DISTINCT pi.politician_id) AS with_photo
FROM essentials.governments g
JOIN essentials.chambers c ON c.government_id=g.id
JOIN essentials.offices o ON o.chamber_id=c.id
JOIN essentials.office_terms ot ON ot.office_id=o.id
JOIN essentials.politicians p ON ot.politician_id=p.id
LEFT JOIN essentials.politician_images pi ON pi.politician_id=p.id
WHERE g.geo_id IN ('53','53033','<seattle_geo_id>')
GROUP BY g.name;
```

Report the real numbers. A gap is an honest outcome; a fabricated completion claim is not.

- [ ] **Step 7: Commit**

```bash
node C:/EV-Accounts/backend/scripts/check-migration-numbers.mjs
git -C "C:/EV-Accounts" add backend/migrations/
git -C "C:/EV-Accounts" commit -m "feat(wa): headshots for Seattle, King County and the legislature"
```

---

### Task 9: Banners

**Files:**
- Modify: `src/lib/buildingImages.js` (`CURATED_LOCAL`)

- [ ] **Step 1: Source the Seattle banner — one candidate at a time**

The WA **state** banner is already a Seattle photo (Space Needle and Mt. Rainier, `src/lib/buildingImages.js:670`). The city banner must therefore be **deliberately non-skyline** — a street-level civic or neighborhood subject — or the two tiers render as near-duplicates.

Real photography only: no AI generation, no aerial shots, and a photo is always preferred over a gradient. Present one candidate at a time for approval rather than a batch.

- [ ] **Step 2: Source the King County banner**

Also not the Seattle skyline, so all three tiers stay visually distinct.

- [ ] **Step 3: Crop with the low-sky anchor**

Anchor around **0.68** so the frame is not mostly sky — the most common banner defect in this codebase.

- [ ] **Step 4: Wire both into `CURATED_LOCAL`**

Keyed by geo_id: Seattle's verified geo_id and King County's `53033`. Leave the State of Washington entry untouched.

- [ ] **Step 5: Verify in the running app, then commit**

Load a Seattle address and a King County address and confirm three visually distinct banners across city, county and state.

```bash
git add src/lib/buildingImages.js
git commit -m "feat(banners): Seattle and King County banners, distinct from the WA state shot"
```

---

### Task 10: Stances — Seattle 11 + King County 13

Evidence-only research on 24 officials. The 147 legislators get **zero rows** by design.

- [ ] **Step 1: Read the live topic set from the database**

Do not work from a remembered topic list. Several topics have their pro end at the **high** chair, and some spokes are off-axis — orientation comes from the live record. Note that `invertedSpokes` is a **per-viewer** display toggle, not a property of the topic.

- [ ] **Step 2: Build the corpus, one official at a time**

Primary sources: `seattle.legistar.com` and `kingcounty.legistar.com` — genuine roll-call records of the same class that made the Berkeley annotated agenda work. Campaign material is a fallback, not a substitute.

Research one official at a time. Do not batch.

- [ ] **Step 3: Apply the chair rules to every row**

- A chair requires evidence describing **that chair**. Direction is not a chair.
- "Least extreme option" is a **tiebreaker only**. Reaching for it means the row is not evidenced — leave it blank.
- A silent record produces a **blank spoke**, and that is the correct answer.
- **Co-sponsorship counts as much as authorship.** An executive's signed plan outranks a co-sponsorship.
- Excluding a topic is **not** neutral.

- [ ] **Step 4: Handle the six thin-record officials explicitly**

Mayor Wilson, City Attorney Evans, Councilmembers Lin, Foster and Rinck, and Executive Zahilay all took office in January 2026 — roughly seven months of Legistar.

Their strongest evidence is prior-role and campaign material, Wilson's Transit Riders Union tenure especially. That evidence is legitimate, but it is exactly where the pre-tenure defect class came from: advocacy written up as officeholder action. **Label those rows as what they are** — a platform position or an advocacy record. Where that does not identify a specific chair, leave the spoke **blank**.

Debora Juarez is the inverse: appointed to D5 in 2025 but a councilmember from 2016–2023, so she carries a deep record.

- [ ] **Step 5: Verify sourcing per row, not per politician**

```sql
-- Rows with no source attached. A politician-level aggregate can look
-- well-sourced while individual rows are bare — test the ROW.
SELECT p.full_name, count(*) AS unsourced_rows
FROM inform.politician_answers pa
JOIN essentials.politicians p ON pa.politician_id=p.id
WHERE (p.external_id BETWEEN -5363011 AND -5363001      -- Seattle
    OR p.external_id BETWEEN -5303314 AND -5303301)     -- King County
  AND (pa.sources IS NULL OR cardinality(pa.sources) = 0)
GROUP BY p.full_name;
-- Every row returned needs either a real source or removal.
```

Confirm each cited URL was actually retrieved. A citation to a page that never existed is the `composed_citations` defect — 1,166 of them shipped once.

- [ ] **Step 6: Run the split-section check**

Run the standard post-seeding split-section scan. Expected: 0 rows.

- [ ] **Step 7: Commit**

```bash
node C:/EV-Accounts/backend/scripts/check-migration-numbers.mjs
git -C "C:/EV-Accounts" add backend/migrations/
git -C "C:/EV-Accounts" commit -m "feat(stances): evidence-only stances for Seattle and King County"
```

---

### Task 11: Documentation and gaps

**Files:**
- Create: `.planning/WA-GAPS.md`
- Modify: `LOCATION-ONBOARDING.md`

- [ ] **Step 1: Write the GAPS file**

Silent omissions look identical to completed coverage. Record each with status:

| Gap | Status |
|---|---|
| 147 legislators, 0 stance rows | Deferred by decision; own milestone |
| WA Supreme Court (9 justices) | Not attempted |
| King County Superior Court (~53) + Seattle Municipal Court (7) | Not attempted |
| Seattle Public Schools board (7 directors) | Not attempted; school boards are search-only with compass deferred |

Use forward slashes in every path — Tailwind scans `.planning/*.md` and a raw backslash crashes the build.

- [ ] **Step 2: Add the onboarded-city rows**

Add Seattle and King County to the "Cities Onboarded" table in `LOCATION-ONBOARDING.md`, matching the existing column format.

- [ ] **Step 3: Write the Washington Quick Reference section**

Follow the CA/OR/MD/MA/NV sections. Record at minimum:

- FIPS 53; `districts.state` casing as actually used
- MTFCCs: places G4110, X0025 Seattle council, X0026 King County council, and the **verified** G5210/G5220 upper-lower mapping
- **WA House districts are multi-member** — 49 SLDL polygons, 98 seats, `NOT EXISTS` guard on `(district_id, politician_id)`
- **WA Senate terms are staggered** — only about half of 49 districts appear on any even-year ballot; read the set from the SoS filed list
- King County is standalone at `geo_id` 53033, and moved to even-year elections under the 2022 charter amendment
- King County Sheriff is appointed (2020 charter amendment)
- Seattle has **no city office on the 2026 ballot**; next city cycle is 2027 for Districts 1–7
- Headshot hosts leg.wa.gov, kingcounty.gov, seattle.gov are all **NO-WAF**; seattle.gov council is AEM-style with zero `img` tags
- The WA state banner is already a Seattle photo — city banners must avoid the skyline
- External id bands: `-53000xx` execs, `-5310001..-5310049` Senate, `-5320001..-5320098` House, `-5363001..-5363011` Seattle, `-5303301..-5303314` King County

- [ ] **Step 4: Verify browse links resolve**

Confirm each tier loads: city and county via `?browse_government_list=<geo_id>`, state via `?browse_state_officials=WA`. Provide the live links at completion.

- [ ] **Step 5: Commit**

```bash
git add .planning/WA-GAPS.md LOCATION-ONBOARDING.md
git commit -m "docs(wa): Washington Quick Reference, onboarded rows, and GAPS"
```

---

## Self-Review

**Spec coverage:** All fourteen spec deliverables map to tasks — places load (1), SLDU/SLDL (1), Seattle geofences (7), King County geofences (4), government rows (4, 7), chambers and offices (2, 4, 7), incumbents (3, 4, 7), headshots (8), banners (9), candidates (5), cull (6), stances (10), GAPS (11), documentation (11).

**Ordering against the gate:** Tasks 1–5 form the pre-certification path. Task 3 precedes Task 5 deliberately, so incumbent candidates link to existing rows rather than minting duplicates.

**Known risks carried forward:** the multi-member House guard (Task 2), the staggered Senate set (Task 5), the AEM headshot pattern on seattle.gov (Task 8), and the state/city banner collision (Task 9).
