# Phase 219: Elections & Candidates Backfill - Research

**Researched:** 2026-07-23
**Domain:** Municipal civic-data seeding (Texas general-law cities) — brownfield `elections`/`races`/`race_candidates` seeding onto already-seeded `governments`/`chambers`/`offices` (Phase 217/218 foundation)
**Confidence:** HIGH on schema/seeding mechanics (verified against live migration files + applied constraints); MEDIUM-HIGH on per-city reference-cycle facts (several confirmed this session, several still need execute-time confirmation); LOW on any specific losing-candidate roster not yet pulled from the county canvass.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Seed the **most-recent election each city actually HELD** — for the Collin cities
  that is the **certified May 2, 2026 uniform-date election** (results are public/certified
  now). If a city held nothing in May 2026 (off-cycle, or all seats canceled), fall back to
  its most-recent actual election, verified per city at execute time.
- **D-02:** Do NOT seed the next *upcoming* election (mostly May 2027) — candidate filing
  isn't open, so those would be zero-candidate shells the view hides. Rationale, verified in
  code: `src/pages/Results.jsx:1305` shows the nearest **upcoming** election and **falls back
  to the most-recent past** when none is upcoming — so seeded May 2, 2026 races display today
  and stay consistent with already-seeded neighbor cities (all on `2026-05-02`).
- **D-03:** Where a seat's election was **uncontested/canceled** (TX declares the lone
  candidate elected without a ballot), **still seed the race** and seed that single
  declared-elected candidate — `candidate_status = 'won'` (or 'unopposed'),
  `is_incumbent` as verified. One candidate ≠ zero-candidate shell, so it renders. This makes
  "thin" coverage accurate rather than a defect: a city stays thin only where a seat genuinely
  had no election in the reference cycle (document that, don't fabricate a race).
  **[RESEARCH CORRECTION — see Summary/Pitfall 2]:** `candidate_status` has no `'won'`/
  `'unopposed'` value in the live schema (CHECK constraint is `('active','withdrawn','filed')`)
  — seed `candidate_status='active'` and express "declared elected" via `is_incumbent`/
  `politician_id` linkage instead. The *intent* (still seed a real race + the one candidate) is
  unaffected; only the literal column value needs correcting.
- **D-04:** Seed the **full filed field per race — winners AND losers** — with
  `candidate_status` (won/lost) and `is_incumbent`. Matches existing neighbor data (e.g.
  Frisco = 11 candidates / 3 races, Parker = 7/2). Evidence-only: only candidates who actually
  appeared on the ballot / filed, cited; never guessed.
  **[RESEARCH CORRECTION — see Summary/Pitfall 2]:** same `candidate_status` correction as D-03
  applies here — seed all filed candidates as `candidate_status='active'`; distinguish the
  winner via `politician_id` linkage to the Phase-218-seated officeholder, not via status value.
- **D-05:** **Incumbents/winners already seated in Phase 218 reuse their existing politician
  photo** (link via `race_candidates.politician_id` → existing `politician_images`). For
  **non-incumbent candidates**, source 600×750 (4:5 crop-first, Lanczos, q90, eyes ~1/3 from
  top, head+shoulders, no text/graphics) where a real source exists; **honest-blank otherwise**
  — no fabrication. The 5 known zero-source cities (Blue Ridge, Farmersville, Lowry Crossing,
  Nevada, Saint Paul) stay blank where no source exists. See [[headshot_image_sizing]],
  [[headshot_cropping]], [[headshot_resize_no_distort]], [[headshot_no_graphics]],
  [[headshot_skill]].
- **D-06:** Evidence-only, cited; no fabricated candidates/incumbents; TX municipal offices
  are **nonpartisan** (`party = NULL`, never displayed — [[antipartisan_display]]).
- **D-07:** **No compass stance research this milestone** (deferred pending local-compass-
  question lock). Do not seed stances as a side effect. See [[stance_research_all_topics]].
- **D-08:** Hide zero-candidate shells; run the split-section SQL check after seeding
  ([[section_split_check]], [[elections_view_display_rules]]).

### Claude's Discretion
- **Election-record linkage:** Prefer **reusing the existing shared `2026-05-02` TX election
  row** (neighbors already link to it) rather than minting per-city elections — confirm/select
  the right shared `elections.id` at plan/execute time. Per-city elections only if the shared
  row's scope doesn't fit. **Research finding:** several cities (McKinney, Richardson, Plano,
  Weston, and the Longview/Princeton runoffs) do NOT fit the shared row — see the Per-City table.
- Per-city sourcing order and which thin cities to backfill first — planner/researcher choose.

### Deferred Ideas (OUT OF SCOPE)
- Compass stances for these candidates/officials — deferred this milestone (local-compass-
  question lock).
- Contact data (`web_form_url`, missing emails, `valid_to` term-end dates) → Phase 220.
- Next-upcoming (May 2027) race shells — not seeded now (D-02); revisit once TX 2027 filing
  opens as a future roster-reconcile.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| COLLIN-ELECT-01 | The 12 zero-race governments (Blue Ridge, Farmersville, Josephine, Lavon, McKinney, Melissa, Nevada, Saint Paul, Weston, Plano, Richardson, Van Alstyne) have their most-recent/next municipal races seeded with candidates where public records exist. | Per-City table (zero-race section) gives the reference-cycle finding + sourcing per government; Patterns 1-4 give the exact idempotent seeding recipe; Pitfall 1 explains why several of these need a fallback (non-2026) election year. |
| COLLIN-ELECT-02 | Cities with thin race coverage are reviewed and backfilled so seats with a known election have a corresponding race record. | Per-City table (thin section) lists existing reusable races + which offices still need backfill; Pattern 3's "bonus opportunity" note (Parker) shows how to link Phase-218-seated winners into already-existing race_candidates rows. |
| COLLIN-ELECT-03 | Every seeded race links to the correct office and shows on the `/results` elections view (no split-section or zero-candidate shells), verified per [[section_split_check]] and [[elections_view_display_rules]]. | Architectural Responsibility Map confirms the render path needs zero code changes (`ElectionsView.jsx:402` already hides empty races); Validation Architecture gives the exact split-section + race-count SQL gates; Pitfall 3 explains the `position_name` city-prefixing requirement that prevents a silent `ON CONFLICT` swallow. |
</phase_requirements>

## Summary

Phase 218 seated every genuinely-filled Collin County office with a cited incumbent. Phase 219's job is different in kind: it seeds the **event data** — `elections` → `races` → `race_candidates` — for the 12 zero-race governments and thickens 12 thin ones, so `/results` shows real ballot history instead of an empty Elections section. This is **pure data-seeding** onto an already-proven schema: a shared `elections` row named `'2026 Texas Municipal General'` (`election_date='2026-05-02'`, `state='TX'`, id `8eaba170-95f5-4c98-849e-19ff93a17680`) already anchors 11 cities' races (migration `100_collin_county_may2026_races.sql`), and `essentials.races` carries a **real partial unique constraint** — `UNIQUE (election_id, position_name) WHERE primary_party IS NULL` (migration `044`) — that makes idempotent `INSERT ... ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING` the correct, schema-enforced seeding idiom (not just a convention). `race_candidates` has no such constraint (verified: only a primary key + a partial-unique `external_id`), so candidate rows need an explicit `WHERE NOT EXISTS` guard.

**The single most important correction this research makes to CONTEXT.md's own wording:** `race_candidates.candidate_status` has a **CHECK constraint of exactly `('active','withdrawn','filed')`** (migration `042`) — there is **no `'won'`/`'lost'`/`'unopposed'` value in the schema**, and no migration in this codebase has ever used one (grep across 1300+ migrations found zero uses). D-03/D-04's phrasing ("candidate_status = 'won' (or 'unopposed')", "candidate_status (won/lost)") describes an intent the schema cannot literally satisfy — a plan that writes `candidate_status='won'` will hit a CHECK-constraint violation at execute time. The established, correct mechanism (confirmed against every prior TX/AZ migration and the frontend's own rendering logic) is: seed **every** filed candidate with `candidate_status='active'` (schema default meaning "was on this ballot," not "currently serving"); the **winner** is expressed by linking `race_candidates.politician_id` to the person's `essentials.politicians.id` row — which, for the 218-seated winners, **already exists** — while losers get denormalized name fields only, no `politician_id`. `ElectionsView.jsx` confirms this is exactly what the UI expects: it renders an "Unopposed"/"N seats" badge purely from `activeCandidates.length <= seats`, and filters only on `candidate_status === 'withdrawn'` — it has no concept of "won."

A second major finding: **Collin cities elect on staggered, multi-year terms**, not one shared election date. Migration 100's own header comment says it plainly: "Cities with no candidate races on May 2 ballot: McKinney (last election 2025), Plano (special election Jan 2026), Richardson (props only), Melissa (ISD only), Josephine (props only)." This session's live web research confirms and extends that: **Richardson's real reference cycle is May 3, 2025** (all 7 seats up, most unopposed, one runoff — its May 2026 ballot was a charter-amendment/bond-only special election, no council seats); **McKinney's real reference cycle is May 3, 2025** (+ a June 2025 runoff) — its 7 offices did NOT all turn over in 2025 (only Mayor, Place 3, District 1, At-Large 1 were up that cycle; the other 3 need their own prior-cycle research). This means D-01's per-city framing ("seed the most-recent election each city actually held") must in practice be applied **per-office**, not per-government, for any city with staggered terms — a government with 7 offices may need 2-3 different reference elections to backfill all of them honestly.

**Primary recommendation:** Split the phase into (1) a **shared-election tier** — cities whose gap is purely "add the missing races under the already-proven `8eaba170` election row" (Blue Ridge, Farmersville, Nevada, Van Alstyne, Weston, Longview's May slate, and all 12 thin cities' remaining offices) using the exact `ON CONFLICT` idiom from AZ migration `1375`; (2) a **fallback-election tier** — cities needing a different reference date entirely (McKinney → May 2025 + runoff; Richardson → May 2025; Plano → per-seat staggered dates + the existing Jan-2026 special; Melissa/Josephine/Lavon/Saint Paul → confirm at execute time, may be ISD-only/off-cycle); and (3) a **runoff-closure tier** — Longview D3 (already has its own election row from migration 187; the actual winner, Brandon Smith, is now known and can be seeded) and Princeton Place 4 (the runoff that superseded the already-seeded 4-candidate special election needs its own race+candidates, separate from the special-election race migration 100 already seeded). Every new race's `position_name` MUST be prefixed with the city name (e.g. `'Josephine Mayor'`, not `'Mayor'`) — the partial unique index is scoped only by `(election_id, position_name)`, not `office_id`, so unprefixed names from different cities under the shared election row would collide.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Election/race/candidate research (which cycle, who ran, who won) | External research (Collin/Gregg County canvass, city sites, TML directory, Ballotpedia, local news) | — | Ground-truth civic data; not derivable from code or the existing DB |
| Election/race/candidate row seeding | Database (`essentials.elections` / `essentials.races` / `essentials.race_candidates`, Supabase Postgres) | — | Idempotent SQL migrations against production via `C:/EV-Accounts` |
| Winner ↔ officeholder linkage | Database (`race_candidates.politician_id` → `essentials.politicians.id`, already seeded by Phase 218) | — | No new politician rows needed for the 218-seated winners; only losers/pre-218 winners may need new stub `politicians` rows if not already reused via `race_candidates` |
| Headshot reuse for winners | Database (`politician_images`, joined via `politicians.id`) + `/find-headshots` for genuine gaps | — | D-05: incumbents/winners already seated in 218 automatically carry their photo through the `politician_id` FK; no new image work needed for them |
| Display of seeded races | Frontend (`ElectionsView.jsx`, `Results.jsx`) — **read-only, no change this phase** | Backend (`accounts-api` `browse/elections-by-government-list`) — **read-only, no change** | Both paths are proven correct on the 11 already-race-bearing cities; this phase only supplies the data the render path is waiting on |
| Zero-candidate-shell hiding | Frontend (`ElectionsView.jsx:402`, `if ((race.candidates||[]).length===0) continue`) | — | Already implemented; confirms D-08 is a no-code-change requirement — just don't seed a race with 0 candidates |

**No frontend or backend code changes are required or in scope for this phase** — 100% SQL data migrations against production via `C:/EV-Accounts`.

## Standard Stack

Not applicable in the traditional sense — no libraries/frameworks installed. The "stack" is the established brownfield migration toolchain, unchanged from Phase 218.

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Raw SQL migrations (`C:/EV-Accounts/backend/migrations/NNNN_*.sql`) | — | Idempotent election/race/candidate seeding | Same mechanism as every prior deep-seed/backfill phase (218, 199, 206, AZ/CA/NV) |
| `npx tsx scripts/_apply-migration-NNNN_*.ts` (run from `C:/EV-Accounts/backend`) | — | Apply + inline SQL-gate verification | 218-series convention; gsd-executor has no Supabase MCP, so verification is embedded in a runnable script, not a live query the executor issues itself |
| `git -C "C:/EV-Accounts" push origin master` | — | Deploy (Render auto-deploy) | [[no_git_in_ev_accounts]] / [[backend_architecture]] |
| `/find-headshots` skill (Playwright/curl fallback pipeline) | — | Only if a winner has no reusable existing photo (rare — see D-05 note) | Established pipeline; but note most winners already got photos or honest-blanks in Phase 218-04 |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| `WebSearch` / `WebFetch` | Pull candidate rosters, canvass results, runoff outcomes | Per-city research task, one city/tier at a time |
| `collincountytx.gov/Elections/election-results-archive` | Official Collin County canvass PDFs (primary source) | Every Collin city's May 2026 (or fallback-year) roster |
| TML City Officials Directory (`directory.tml.org/profile/city/<id>`) | Cross-check current officeholder | Already used extensively by 218; same profile IDs reusable |
| Ballotpedia per-city election pages | Cross-check candidate rosters, especially staggered/off-cycle years | Secondary source per city |
| Local news (Community Impact, Princeton Herald, KERA, Longview News-Journal, wfaa.com) | Runoff results, special-election context | Where the county canvass PDF alone doesn't show runoff outcomes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Direct `race_candidates` INSERT (hand-curated) | Route through `essentials.candidate_staging` (discovery cron's intake) | Staging requires an existing `race_id` (nullable, but the approval workflow expects one) and is designed for the cron's automated proposals, not an authoritative historical backfill. **Check staging first for a shortcut** (see Don't Hand-Roll), but the seed itself should write `race_candidates` directly, matching every prior authoritative seed (100, 187, AZ 1296). |
| Plain `INSERT INTO races` (migration 100's own original pattern) | `INSERT ... ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING` (AZ migration 1375's pattern) | Migration 100 has **no idempotency guard at all** on its race INSERTs — it is not safely re-runnable. Migration 044 added the real partial-unique constraint two years before AZ's phases used it; 219 should use the modern `ON CONFLICT` idiom, which the constraint makes correct and enforced, not just a hopeful `WHERE NOT EXISTS`. |

**Installation:** N/A — no packages installed.

**Migration numbering:** on-disk MAX in `C:/EV-Accounts/backend/migrations` = **1392** as of this research (2026-07-23; Phase 218's last migration) → next free is **1393**. Re-confirm at plan/execute time — the counter drifts across parallel workstreams (project convention, [[project_gsd_core_global_migration]]).

## Package Legitimacy Audit

**Not applicable.** This phase installs zero external npm/pip/crates packages — pure SQL data migrations against an already-modeled schema, plus (rarely) the already-vetted `/find-headshots` pipeline for any winner who needs a fresh photo. The Package Legitimacy Gate is skipped per its own scope condition.

## Architecture Patterns

### System Architecture Diagram

```
[Research: Collin/Gregg County canvass, city election pages, TML directory,
 Ballotpedia, local news — per city, per reference cycle]
        │  (evidence-only, cited; per-office reference-cycle check for staggered cities)
        ▼
[Resolve/select election_id]
   ┌─────────────────────────────┬───────────────────────────────┐
   │ Shared 2026-05-02 TX row     │ Fallback: own election row     │
   │ (8eaba170-…, most cities)     │ (McKinney 2025, Richardson 2025,│
   │                              │  Plano per-seat, Longview D3    │
   │                              │  runoff — already exists)        │
   └─────────────────────────────┴───────────────────────────────┘
        │
        ▼
[INSERT races — ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING]
   position_name MUST be city-prefixed (e.g. 'Josephine Mayor') — uniqueness is NOT scoped by office_id
        │
        ▼
[INSERT race_candidates — WHERE NOT EXISTS(race_id, full_name) guard]
   winner: politician_id = <existing politicians.id from Phase 218 or pre-existing>, candidate_status='active'
   loser:  politician_id = NULL, denormalized name fields only, candidate_status='active'
   (NO 'won'/'lost' status value exists — see Summary)
        │
        ▼
[Post-seed SQL gates: split-section check + races-per-office reconcile + candidate_status CHECK sanity
 + no-stances-side-effect assertion (D-07) + antipartisan assertion (0 non-NULL primary_party)]
        │
        ▼
[Read-only: ElectionsView.jsx hides any race with 0 candidates automatically — nothing to change]
        │
        ▼
[Live browse spot-check: /results?browse_geo_id=<geo_id> for a sample of newly-raced governments]
```

### Pattern 1: Resolve the shared election by name, never hardcode the literal UUID
```sql
-- Source: 099_collin_county_discovery_jurisdictions.sql (elections unique constraint: name, election_date, state)
(SELECT id FROM essentials.elections
   WHERE name = '2026 Texas Municipal General' AND election_date = '2026-05-02' AND state = 'TX')
-- literal id is 8eaba170-95f5-4c98-849e-19ff93a17680 — resolve by name/date/state for portability
```

### Pattern 2: Idempotent race insert (schema-enforced, not just convention)
```sql
-- Source: C:/EV-Accounts/backend/migrations/1375_az_2026_local_races.sql (verified live pattern);
-- constraint from 044_election_dedup_constraints.sql:
--   UNIQUE INDEX idx_races_election_position_no_party ON races(election_id, position_name)
--   WHERE primary_party IS NULL
INSERT INTO essentials.races (election_id, office_id, position_name, seats)
SELECT
  (SELECT id FROM essentials.elections WHERE name='2026 Texas Municipal General' AND election_date='2026-05-02' AND state='TX'),
  (SELECT o.id FROM essentials.offices o
     JOIN essentials.chambers ch ON ch.id = o.chamber_id
     JOIN essentials.governments g ON g.id = ch.government_id
    WHERE g.geo_id = '4808872' AND o.title = 'Mayor'),   -- Blue Ridge
  'Blue Ridge Mayor', 1
ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING;
```

### Pattern 3: Idempotent candidate attach — winner linked to Phase-218 politician, loser name-only
```sql
-- Source pattern: 100_collin_county_may2026_races.sql (candidate rows) +
-- 1389_collin_seat_cited_incumbents.sql (Phase 218's politician_id for the same person)
-- Winner (already seated by Phase 218 as the current officeholder — reuse the id, no new politician row,
-- no new headshot work — the FK carries the existing photo through automatically):
INSERT INTO essentials.race_candidates (race_id, politician_id, full_name, first_name, last_name, is_incumbent, candidate_status, source)
SELECT
  (SELECT r.id FROM essentials.races r
     WHERE r.election_id = (SELECT id FROM essentials.elections WHERE name='2026 Texas Municipal General' AND election_date='2026-05-02' AND state='TX')
       AND r.position_name = 'Blue Ridge Mayor'),
  (SELECT o.politician_id FROM essentials.offices o
     JOIN essentials.chambers ch ON ch.id=o.chamber_id JOIN essentials.governments g ON g.id=ch.government_id
    WHERE g.geo_id='4808872' AND o.title='Mayor'),         -- Rhonda Williams' politician_id, seated in 1389
  'Rhonda Williams', 'Rhonda', 'Williams', false, 'active', 'blueridgecity.com/council'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.race_candidates rc
   WHERE rc.race_id = (SELECT r.id FROM essentials.races r
       WHERE r.election_id=(SELECT id FROM essentials.elections WHERE name='2026 Texas Municipal General' AND election_date='2026-05-02' AND state='TX')
         AND r.position_name='Blue Ridge Mayor')
     AND rc.full_name = 'Rhonda Williams');

-- Loser (never became a politician record — denormalized name only, no politician_id):
INSERT INTO essentials.race_candidates (race_id, full_name, first_name, last_name, is_incumbent, candidate_status, source)
SELECT
  (SELECT r.id FROM essentials.races r
     WHERE r.election_id=(SELECT id FROM essentials.elections WHERE name='2026 Texas Municipal General' AND election_date='2026-05-02' AND state='TX')
       AND r.position_name='Blue Ridge Mayor'),
  'Opponent Name', 'Opponent', 'Name', false, 'active', '<cited source>'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.race_candidates rc
   WHERE rc.race_id=(SELECT r.id FROM essentials.races r
       WHERE r.election_id=(SELECT id FROM essentials.elections WHERE name='2026 Texas Municipal General' AND election_date='2026-05-02' AND state='TX')
         AND r.position_name='Blue Ridge Mayor')
     AND rc.full_name='Opponent Name');
```
**`is_incumbent` gotcha (matches Ph205/AZ precedent):** set explicitly on every row — `true` only if the person held this exact seat *before* this election (i.e., was already an officeholder going into the race), `false` for open-seat winners and all challengers. Do not rely on any column default.

### Pattern 4: Uncontested/declared-elected seat (D-03) — still seed a full race with the single candidate
```sql
-- Source: 100_collin_county_may2026_races.sql, Prosper Place 3/5 ('Declared elected — unopposed')
INSERT INTO essentials.races (election_id, office_id, position_name, seats, description)
VALUES (
  (SELECT id FROM essentials.elections WHERE name='2026 Texas Municipal General' AND election_date='2026-05-02' AND state='TX'),
  '<office_id>', 'Farmersville Council Member Place N', 1, 'Declared elected — unopposed'
)
ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING;
-- Candidate: candidate_status='active' (NOT 'won'/'unopposed' — schema forbids), is_incumbent per fact.
```

### Pattern 5: Runoff as its own election (Longview D3, Princeton Place 4)
```sql
-- Longview's D3 runoff ALREADY EXISTS as its own election row (migration 187,
-- 'Longview TX City Council District 3 Runoff 2026', 2026-06-13). Do NOT create a duplicate —
-- this phase only needs to (a) confirm the winner via longviewtexas.gov / Longview News-Journal,
-- and (b) seed the ORIGINAL May-2026 5-candidate General race as a SEPARATE race under the
-- shared 8eaba170 election (position_name 'Longview Council Member District 3'), since D-04
-- requires the full filed field, not just the 2-candidate runoff.
-- Princeton Place 4: same shape — the May-2026 4-candidate special election is ALREADY seeded
-- (migration 100, description='Unexpired term'); the June-2026 runoff (Rutledge beat Goria
-- 293-245, certified 2026-06-23) needs its OWN new race+2-candidates, its own election row
-- (name pattern: 'Princeton TX City Council Place 4 Runoff 2026', date 2026-06-13 or the
-- confirmed runoff date — re-verify at execute time), matching the Longview D3 shape exactly.
```

### Anti-Patterns to Avoid

- **Assuming every Collin city's reference cycle is `2026-05-02`.** Confirmed false for at least McKinney (real cycle: May 2025 + runoff), Richardson (real cycle: May 2025; the 2026-05-02 ballot was a charter/bond-only special election with **zero** council seats), and likely Melissa/Josephine (props/ISD-only in 2026, per-seat staggered otherwise). Verify per office, not per government.
- **Seeding `candidate_status='won'`, `'lost'`, or `'unopposed'`.** The CHECK constraint is `('active','withdrawn','filed')` — any other value fails the INSERT outright. Express "who won" via `politician_id` linkage, never via `candidate_status`.
- **Leaving `position_name` unprefixed by city (e.g. bare `'Mayor'`).** The partial unique index is `(election_id, position_name)` — NOT `(election_id, office_id, position_name)`. Two different cities' unprefixed `'Mayor'` races under the shared election row would collide on the second INSERT (silently no-op via `ON CONFLICT`, producing a missing race for the second city). Every prior migration (100, 1375) already follows city-prefixing; keep doing so.
- **Creating a duplicate election row for Longview's D3 runoff.** It already exists (migration 187) — reuse it by name, don't re-mint.
- **Duplicating a politician row for a winner Phase 218 already seated.** Link `race_candidates.politician_id` to the existing `politicians.id` (found via `offices.politician_id` for that seat) — inserting a second `politicians` row for the same person is the exact "duplicate officeholder" bug Phase 218-02 had to fix after the fact (see its Deviations section).
- **Treating "0 unseated offices" (Phase 218's gate) as proof a city's races are complete.** They are orthogonal facts — a fully-seated city (e.g. Farmersville, Lavon, Saint Paul, McKinney, Melissa, Richardson) can still have **zero** race rows, because 218 measured "does the office have a politician," not "does a race+ballot event exist for that seat."

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Checking whether the discovery cron already surfaced candidates for a zero-race city | Fresh WebSearch for every single city before checking the DB | Query `essentials.candidate_staging` joined through `discovery_jurisdictions` FIRST (`discovery_jurisdictions` has been armed since migration 099 for all 23 Collin cities) — the weekly cron may have already proposed candidate rows (with citations) sitting `pending`/`flagged` that can be reviewed and promoted instead of re-researched from scratch | Migration 070's schema shows `candidate_staging.race_id` is nullable — the cron can propose a candidate even before a `races` row exists, flagged `'no matching race in DB'`. Checking first could save significant per-city research time. **Caveat:** `discovery_jurisdictions.jurisdiction_geoid` was seeded with the STALE geo_ids for Plano (`4863000`), Princeton (`4863432`), Van Alstyne (`4875960`) that Phase 217 found were corrected on `governments.geo_id` post-seeding (per 218-02-SUMMARY) — a join on `jurisdiction_geoid = governments.geo_id` for those 3 cities may silently miss rows; join defensively or check by name too. |
| Idempotent race insertion | A hand-rolled `WHERE NOT EXISTS` subquery (migration 100's own un-guarded original pattern) | `ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING` (the real constraint from migration 044, used correctly in AZ migration 1375) | The constraint already exists and is enforced by Postgres — using the matching `ON CONFLICT` clause is both simpler and provably correct, unlike a hand-rolled guard that could drift out of sync with the actual constraint shape. |
| Determining who currently holds a seat, for `politician_id` linkage | Re-researching from scratch | `essentials.offices.politician_id` — Phase 218 already seeded/verified this for every office in Collin County (0 ambiguous seats, per 218-05's final gate) | Phase 218's work is authoritative and current as of 2026-07-24; re-deriving it risks contradicting the just-verified record. |
| Headshot sourcing for race winners | Running `/find-headshots` for every seeded candidate | Nothing — winners already seated by 218 automatically carry their `politician_images` row through the `race_candidates.politician_id → politicians.id` FK; only genuinely NEW people (open-seat winners/losers not seated by 218, e.g. a losing challenger) might need `/find-headshots`, and per D-05 only if a real source exists | 218-04 already resolved photo-vs-honest-blank for every current officeholder; duplicating that effort for the same people via race_candidates is wasted work. |

**Key insight:** This phase's hard part is **research** (which cycle, who ran, who won, per city, per staggered seat), not **mechanics** (the SQL idiom is already proven twice over — once in the original May-2026 seed, once in the AZ 2026 shells). Budget the bulk of planning/execution time on the per-city sourcing table below, not on schema design.

## Common Pitfalls

### Pitfall 1: Staggered multi-year terms mean "the city's most-recent election" is not one date
**What goes wrong:** A plan seeds all N offices for a city under a single reference election, silently fabricating a race for a seat whose term wasn't actually up that cycle (or missing a seat whose real election was a different year).
**Why it happens:** CONTEXT.md and the ROADMAP describe D-01 at the government level ("seed the most-recent election each city actually held"), but Texas general-law cities commonly stagger 2-3 year terms across different seats, so different offices in the SAME city can have different "most recent election" answers.
**How to avoid:** For every zero-race/thin office, check that SPECIFIC seat's own most-recent election (via the city's official elections page, TML directory profile, or county canvass archive) rather than assuming one city-wide date covers all its offices. Confirmed real-world cases this session: McKinney (Mayor/Place3/District1/At-Large1 were up May 2025; the other 3 offices were not — their reference cycle is unconfirmed, needs its own check), Plano (Place 7 = Jan-2026 special; other seats on a 3-year staggered rotation across 2023-2026).
**Warning signs:** A city where migration 100's own header comment already flags it as having "no candidate races" that cycle (McKinney, Plano, Richardson, Melissa, Josephine) — treat these five as confirmed-staggered/off-cycle, not confirmed-uncontested.

### Pitfall 2: `candidate_status` has no "won"/"lost" value — CONTEXT.md's wording cannot be taken literally
**What goes wrong:** A migration literally writes `candidate_status = 'won'` (per D-03's exact phrasing) or `'lost'` (per D-04) and the INSERT fails the CHECK constraint (`candidate_status IN ('active','withdrawn','filed')`), or — worse — someone widens the CHECK constraint to accommodate it, diverging from every other election-seeding phase in the codebase.
**Why it happens:** CONTEXT.md's decisions were written aspirationally without re-checking the live schema; migration 187 (Longview D3 runoff) made the same mistake in a code comment ("Mark the winning race_candidate with candidate_status = 'elected'" — never implemented, and would have failed the same CHECK).
**How to avoid:** Seed every candidate (winner and loser) with `candidate_status='active'` (the schema default, meaning "was on this ballot"). Express "who won" exclusively via `politician_id` linkage to the officeholder already seated by Phase 218 (or a new `politicians` row for a winner Phase 218 didn't cover, e.g. Longview/Princeton runoffs which are outside 218's Collin-only scope).
**Warning signs:** Any migration draft containing the literal string `'won'`, `'lost'`, `'unopposed'`, or `'elected'` inside a `candidate_status` value.

### Pitfall 3: `position_name` collisions under the shared election row
**What goes wrong:** Two different cities' races both named e.g. `'Mayor'` under the same `election_id` — the second INSERT silently no-ops via `ON CONFLICT ... DO NOTHING` (or, without the guard, violates the constraint), producing a missing race for whichever city was seeded second.
**Why it happens:** The partial unique index is `(election_id, position_name)` — it does NOT include `office_id`. Position names must be globally unique **within the shared election**, not just within a city.
**How to avoid:** Always prefix `position_name` with the city name (`'Josephine Mayor'`, `'Weston Council Member Place 5'`) — the exact convention migration 100 and AZ migration 1375 both already follow. Never seed a bare `'Mayor'`/`'Place N'` string under the shared election row.
**Warning signs:** A draft migration with `position_name` values that don't start with the city name.

### Pitfall 4: A "0 unseated offices" city (per Phase 218) can still have 0 races
**What goes wrong:** Skipping Farmersville, Lavon, Saint Paul, McKinney, Melissa, or Richardson because Phase 218's vacancy gate found nothing wrong with them — but "who holds the seat" (218's concern) and "does a race event exist" (219's concern) are unrelated facts.
**Why it happens:** These 6 cities were never in Phase 218's 11-city target list (their offices were already fully seated pre-218), so no per-city research exists yet for their election history.
**How to avoid:** Treat all 12 zero-race governments as needing fresh per-city election research regardless of their Phase 218 vacancy status.
**Warning signs:** A plan that reuses Phase 218's RESEARCH.md findings as if they cover election history for a city 218 never actually researched (Farmersville, Lavon, McKinney, Melissa, Richardson, Saint Paul were not among 218's 11 target cities).

### Pitfall 5: Longview and Princeton each have a superseded race that needs a SEPARATE new race, not an update
**What goes wrong:** Treating the already-seeded Longview D3 runoff race (migration 187) or Princeton Place 4 special-election race (migration 100) as "the whole story" and not also seeding the earlier/later companion race that D-04's "full filed field" requirement demands.
**Why it happens:** Both are two-stage elections (initial race → runoff) but only one stage is currently in the DB — Longview has the runoff only (no initial 5-candidate May race), Princeton has the initial special election only (no June runoff).
**How to avoid:** Seed the MISSING stage as its own race (own election row for the runoff dates, since they're not the shared 2026-05-02 date), linking the shared election for the initial-stage race where applicable (Longview's initial D3 race fits under the shared 8eaba170 row; Princeton's runoff needs its own new election row, distinct from the already-seeded special-election row).
**Warning signs:** A city where a "declared elected"/"unopposed"/runoff-only race is the ONLY race present and the city's own coverage (news search) shows a multi-candidate initial contest that never made it into the DB.

## Runtime State Inventory

> Not a rename/refactor/migration-of-data phase, but the discipline still applies: verify what already exists before writing, to avoid double-seeding.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | 11 cities already have partial race+candidate data (migration 100: Allen, Anna, Celina, Fairview, Frisco, Lowry Crossing, Lucas, Murphy, Parker, Princeton, Prosper) + Longview's D3 runoff shell (migration 187) — REUSE these races, only backfill the missing offices per city | Do not re-seed existing races; add only the missing office→race links under the same shared election_id (or Longview's own election for its runoff) |
| Live service config | `essentials.discovery_jurisdictions` has been armed for all 23 Collin cities since migration 099 (weekly cron); `essentials.candidate_staging` may already hold un-promoted, cited candidate proposals for some zero-race cities | Query `candidate_staging` before fresh WebSearch (see Don't Hand-Roll); the discovery cron may double-write independently of this phase's hand-seed — the `WHERE NOT EXISTS`/`ON CONFLICT` guards make concurrent writes safe either way |
| OS-registered state | None | None |
| Secrets/env vars | `DATABASE_URL` in `C:/EV-Accounts/backend/.env` (already present, reused) | None |
| Build artifacts | None (SQL migrations only) | None |
| Stances (must stay untouched, D-07) | `inform.politician_answers` / `inform.politician_context` | Zero writes this phase — verify with the same before/after row-count assertion pattern Phase 218 used (several seeded people may already legitimately carry v3.0-era stances; that's expected pre-existing data, not a violation, as long as this phase's own SQL writes nothing new to `inform.*`) |

## Per-City Research Findings (24 governments: 23 Collin + Longview/Gregg)

Every claim below is tagged with its source and confidence. Cities marked **[RE-VERIFY]** need a direct fetch/canvass check at execute time before locking in a roster; cities marked **[OPEN]** had no usable result surfaced this session and need fresh research from scratch.

### Zero-race governments (12)

| City (geo_id) | Offices | Reference cycle finding | Sourcing | Confidence |
|---|---|---|---|---|
| **Blue Ridge** (4808872) | 6 | 2026-05-02 confirmed for Mayor (Williams retained, contested) + Place 1 (Apple retained, contested) + Place 5 (Chitwood, new). Places 2/3/4 (Braly/Sissom/Mattingly) status/cycle unconfirmed — [RE-VERIFY] whether they were also up in 2026 or a prior staggered year. | blueridgecity.com/council [CITED, live-fetched by 218]; collincountytx.gov canvass archive for opponent names | MEDIUM (winners confirmed; opponents/other 3 seats open) |
| **Farmersville** (4825488) | 6 | 2026-05-02 confirmed: 2 uncontested seats (Kristi Mondy, Coleman Strickland — both incumbents, declared elected unopposed). Other 4 offices' cycle unconfirmed. | farmersvilletx.com/city-secretary/page/elections [CITED, WebSearch 2026-07-23] | MEDIUM (2 of 6 offices confirmed; 4 open) |
| **Josephine** (4838068) | 6 | May 2026 ballot = **props only**, per migration 100's own comment — matches 218's finding that Chappell (Place 5) is a continuing incumbent unaffected by any 2026 election. All 6 offices' real reference cycles need per-seat research (likely staggered 2022-2024). | cityofjosephinetx.com; directory.tml.org/profile/city/994 | LOW-MEDIUM — off-cycle confirmed, but no specific per-seat dates found this session |
| **Lavon** (4841800) | 6 | No result surfaced this session. **[OPEN]** | lavontx.gov/election-information/ (discovery_jurisdictions source_url) | LOW — needs fresh execute-time research |
| **McKinney** (4845744) | 7 | **Real reference cycle = May 3, 2025** (NOT 2026 — migration 100 explicitly excludes McKinney, "last election 2025"). Confirmed: Mayor runoff (Cox 46.78% vs Sanford 40.81%, 4-candidate field, no majority → runoff, final winner not yet re-confirmed this session — [RE-VERIFY]); Place 3 (Feltus beat Warren, ~54%); District 1 (incumbent Justin Beller, unopposed); At-Large 1 (Lynch 29.33% vs Garrison 19.97%, 5-candidate field, runoff — final winner [RE-VERIFY]). Only 4 of 7 offices confirmed up that cycle; other 3 need separate research. | mckinneytexas.org/139/Elections, mckinneytexas.org/2084/2025-Runoff-Election [CITED]; KERA News "mckinney-election-results-mayor-city-council-2025" [CITED]; Community Impact runoff coverage [CITED]; collincountyvotes.com/mckinney-may-2025-election-recap [CITED] | MEDIUM-HIGH on the 4 confirmed offices; runoff finals + other 3 offices need [RE-VERIFY] |
| **Melissa** (4847496) | 7 | **CONFLICTING SIGNALS — [RE-VERIFY] before seeding.** Migration 100's comment says "ISD only" (no city council candidates on the May 2026 ballot). A 2026-07-23 WebSearch surfaced a snippet suggesting Melissa's May 2026 ballot may have included Mayor + Place 2 + Place 4 — but this could be a filing announcement, not certified results. Confirm directly against the Collin County canvass PDF (`collincountytx.gov/docs/.../may-2-2026-joint-election...`) and cityofmelissa.com/287/Elections before committing to either read. | cityofmelissa.com/287/Elections; collincountytx.gov canvass archive | LOW — genuine conflict between two sources, must resolve at execute time |
| **Nevada** (4850760) | 6 | 2026-05-02 confirmed (per 218, itself flagged [RE-VERIFY] there): Mayor Deering, Place 1 Laye, Place 2 Baker — all unopposed. Places 3-5 status/cycle unconfirmed. | Per 218-RESEARCH: WebSearch synthesis of TML directory + cityofnevadatx.org (weaker citation tier — 218 itself recommends a direct city-site/canvass re-fetch) | MEDIUM (3 of 6 offices; carries forward 218's own re-verify flag) |
| **Saint Paul** (4864220) | 6 | No result surfaced this session (search engine returned Minnesota results for "Saint Paul" — disambiguation needed). **[OPEN]** | stpaultexas.us (discovery_jurisdictions source_url) | LOW — needs fresh execute-time research with a disambiguated query (e.g. "St. Paul Collin County Texas") |
| **Weston** (4877740) | 6 | 218 confirmed **NO May 2026 election** for Weston at all ("Weston had no May 2026 election" per 218-RESEARCH) — Marla Johnston's Place 5 term is `2024-11-01 → 2026-11-01` (Nov 2024 cycle, not May). This means Weston's reference cycle is **not** the shared 2026-05-02 election for any of its 6 seats — needs its own November-cycle election row(s). | westontexas.com/page/Mayor_Aldermen [CITED, live-fetched by 218] | MEDIUM (cycle date established; per-seat candidate rosters not yet researched) |
| **Plano** (4858016) | 9 | Most complex zero-race city: 3-year staggered terms across multiple years. Place 7 = Jan 31, 2026 special election (Shun Thomas won ~60.4%, no runoff needed). Place 6 = documented genuine vacancy (migration 1392, no election pending). Other 7 offices span 2023/2024/2025/2026 staggered cycles — needs a full per-seat term-history pull. | plano.gov/1402/Elections; Ballotpedia "City elections in Plano, Texas (2026)"; Community Impact | MEDIUM on Place 7 (fully cited); LOW on the other 7 offices' reference cycles (not researched this session) |
| **Richardson** (4861796) | 7 | **CONFIRMED: real reference cycle = May 3, 2025**, NOT 2026. The 2026-05-02 Richardson ballot was a **charter-amendment + bond-only special election with zero council seats** (confirmed via 2 independent sources — the collincountytx.gov PDF titles literally say "City of Richardson Special Election," and a WebSearch synthesis confirms "the next city council election would be held later in 2027," filing period Jan 13–Feb 12, 2027). May 2025: Places 1, 2, 3, 5, and 7 (Mayor) were unopposed; Place 6 was contested (Burdette/Frederick/Shamsul, went to runoff); Mayor race resolved to **Paul Voelker**. | collincountytx.gov canvass PDFs (May-2-2026 special election, titles confirm no council seats) [CITED]; cor.net/government/city-secretary/elections/election-results; richardsontoday.com "Unofficial Results from May 6 Richardson City Council" (note: date discrepancy — confirm May 1 vs May 6 at execute time) | MEDIUM-HIGH — cycle + most seats confirmed; exact May date (May 1 vs "May 6" headline) and Place 6 runoff final need [RE-VERIFY] |
| **Van Alstyne** (4874924) | 7 | 2026-05-02 confirmed (per 218): Mayor Atchison retained (399-71 over Soucie); Place 6 → Zach Williams, replacing a stubbed "Angelica Pena" — **[RE-VERIFY]** per 218's own flag (no direct election-result citation found, could be a resignation/appointment rather than an electoral win). Other 5 offices (Places 1-5) status/cycle unconfirmed. | KTEN news; Ballotpedia Atchison/Soucie candidate pages [CITED, per 218]; directory.tml.org/profile/city/524 | MEDIUM (Mayor race fully cited; Place 6 and other 5 offices need work) |

### Thin governments (12) — existing race reusable, city-prefixed office backfill needed

| City (geo_id) | Existing races (from migration 100/187, REUSE as-is) | Offices still needing a race | Notes |
|---|---|---|---|
| **Lowry Crossing** (4844308) | Ward 4 (`position_name='Lowry Crossing Council Ward 4'`, seats=2, 3 candidates: Outland/Simpson/Hijazen — already fully captures the Ward 4 ballot; Simpson→Place8, Hijazen→Place4 per 218) | Mayor + Ward 1 (2 seats) + Ward 2 (2 seats) + Ward 3 (2 seats) = 7 more offices | lowrycrossingtexas.org/operations/elections.php per 218's own recommendation; 218 left the Ward 4 first/second-seat assignment as a documented low-impact assumption — do not re-litigate |
| **Princeton** (4859576) | Place 4 special election (`description='Unexpired term'`, 4 candidates: Ramani/Goria/Rutledge/Abdulkareem) — this is the SPECIAL election only; the June 2026 runoff (Rutledge beat Goria 293-245, certified 2026-06-23) is **missing** and needs its own new race+election (Pattern 5) | Other 7 offices (Mayor + Places 1,2,3,5,6,7) + the Place 4 runoff | princetontx.gov/294/Elections; Princeton Herald [CITED, per 218] |
| **Longview** (4843888, Gregg Co — in-scope per operator request) | D3 runoff (migration 187, `election_id` own row `'Longview TX City Council District 3 Runoff 2026'`, 2026-06-13, Smith vs Cooper — **winner now confirmed: Brandon Smith, 223-204 (52.22%)** [CITED: Longview News-Journal 2026-06-13]) | The original May-2026 D3 general (5 candidates total per news coverage — full roster needed) under the shared 8eaba170 election, PLUS Mayor + Districts 1,2,4,5,6 (6 more offices) also under the shared election if Longview held its May 2026 general on the same uniform date (consistent with news coverage dated 2026-05-03 referencing "the May election") | longviewtexas.gov/3308/City-Election-Results; longviewtexas.gov/2154/General-Election-Candidates; Ballotpedia Brandon Smith 2026 candidate page; Longview News-Journal. **Also close the loop with Phase 218-style seating**: District 3's `offices.politician_id` still reflects hold-over Wray Wade (per migration 187's own comment) — flag as a bonus fix if in scope, or an explicit follow-up note if not (219's stated scope is elections/candidates, not officeholder seating — but leaving a stale hold-over on the books while seeding the winner as a *candidate* only would be an inconsistency worth flagging to the operator) |
| **Allen** (4801924) | Mayor (Schulmeister/Shafer) + Place 2 (Baril, unopposed) | 5 more offices (Places 1,3,4,5,6) | cityofallen.org |
| **Anna** (4803300) | Place 3 (Walden/Olivarez) + Place 5 (Jones/Baker) — note Anna's May-2026 race had **Susan Jones** losing to Elden Baker for Place 5, distinct from the Place 3 race's Mike Olivarez losing to Jessica Walden — both already fully captured | 5 more offices (Mayor + Places 1,2,4,6) | annatexas.gov/1015/Elections; directory.tml.org/profile/city/1286 |
| **Lucas** (4845012) | Place 1 (Alan/Underhill) + Place 2 (Awezec/Orr) | 5 more offices (Mayor + Places 3,4,5,6 — per 218, these 4 are ALREADY correctly seated with continuing incumbents Bierman/Lawrence/Fisher/Peterson, so their races are likely from an EARLIER cycle, not 2026) | lucastexas.us/164/City-Council; note the Place↔Seat naming-drift landmine from 218 — DB title stays "Place," city site now says "Seat" |
| **Murphy** (4850100) | Place 3 (Chase/Ison) + Place 5 (Deel/Fincanon+Varghese+Kelley) | 5 more offices | murphytx.org |
| **Prosper** (4863276) | Place 3 (Bartley, declared elected unopposed) + Place 5 (Charles, declared elected unopposed) | 5 more offices | prospertx.gov/479/May-2026-General-Election |
| **Parker** (4855152) | Mayor (Pettle/Arias/Tierce) + At-Large "Vote For 2" (Barron/Pilgrim/Meyer/Noe, seats=2, mapped to Place 1 office) — **bonus opportunity:** Pettle/Pilgrim/Barron are now Phase-218-seated officeholders; their EXISTING race_candidates rows (no `politician_id` set, per the original migration 100 INSERT) can be opportunistically UPDATEd to link `politician_id` now that it exists, matching D-05's photo-reuse intent | 4 more offices (Places 2,4,6 + confirm exact 6-office roster) | parkertexas.us/76/City-Council; parkertexas.us/87/Elections-Elecciones. Parker does not publish official Place numbers (positional convention per 218) |
| **Celina** (4813684) | Mayor (Tubbs/Cornelius/Becker) + Place 4 (Dunn/Scott) + Place 5 (Lambert/Baty) | 4 more offices | celinatx.gov/government/city-council |
| **Frisco** (4827684) | Mayor (Keating/Sowell/Vilhauer/Hill, open seat) + Place 5 (Rummel/Reddy/Karthik) + Place 6 (Colberg/Krishnarajanagar/Chalmers/Spencer, open seat) — matches CONTEXT's cited "11 candidates / 3 races" | 4 more offices | friscotexas.gov |
| **Fairview** (4825224) | Seat 2 (Boggs) + Seat 4 (Doi/Stanley) + Seat 6 (Riyad/Works) | 4 more offices (Mayor + Seats 1,3,5) | fairviewtexas.org |

**Effort framing:** most of the "backfill missing offices" work above is NOT yet researched at the individual candidate level — this table gives the sourcing map and known reusable data, not a finished roster. Budget per-tier research time accordingly (recommend splitting plans by tier: zero-race governments needing the shared 2026-05-02 election vs. those needing a fallback year vs. thin-city backfill vs. the two runoff-closure cities).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `candidate_status` CHECK constraint is exactly `('active','withdrawn','filed')` with no later ALTER widening it | Summary/Pitfall 2 | [VERIFIED: grep of migration 042 CREATE TABLE + full-codebase grep for any later ALTER — none found]. If a later migration this research missed widened the constraint, 'won'/'lost' values would actually be legal — re-check `\d essentials.race_candidates` at execute time. |
| A2 | Melissa's May 2026 ballot content (props-only per migration 100 vs. candidate-race per this session's WebSearch snippet) | Melissa findings | If the WebSearch snippet is correct and migration 100's comment is stale, a plan that treats Melissa as "props only" would wrongly apply the fallback-year path instead of the shared-election path, or vice versa. [RE-VERIFY] flagged explicitly. |
| A3 | Longview held its original May-2026 D3 (and Mayor/other-district) general election on the same 2026-05-02 uniform date as the shared Collin election, making it eligible to anchor under the same `8eaba170` election row despite being Gregg County | Longview findings | [CITED: Longview News-Journal article dated 2026-05-03 references "the May election"] — but if Longview's actual filing/election date differs even by a day from the Collin cities, a same-`election_id` join would be technically incorrect (though the `elections` table has no county scoping, so it would still "work" mechanically — the risk is factual accuracy of the `election_date`, not schema breakage). |
| A4 | McKinney's Mayor runoff (Cox vs. Sanford) and At-Large 1 runoff (Lynch vs. Garrison) final results, not yet independently re-confirmed this session | McKinney findings | Wrong winner seated as `politician_id`-linked if the runoff flipped the initial-round leader — re-verify via mckinneytexas.org/2084/2025-Runoff-Election or KERA/Community Impact runoff-result coverage before seeding. |
| A5 | Richardson's May 2025 election date is "May 3" (matching the statewide uniform date) vs. a "May 1"/"May 6" headline seen in one search snippet (richardsontoday.com) | Richardson findings | Minor — affects the seeded `election_date` precision only, not who won; confirm the exact date via cor.net's own election-results page before seeding. |
| A6 | Next migration number 1393 | Standard Stack | Drift expected across parallel workstreams; re-check disk MAX at plan/execute time. [VERIFIED: `ls` on migrations dir, 2026-07-23, MAX=1392] |
| A7 | Every specific losing-candidate name/spelling for the "backfill missing offices" thin-city table (Anna's other 5 offices, Lucas's other 4, etc.) | Per-City table | Not yet pulled from a canvass at all — treat as fully open research, not even a preliminary lead, for every office not explicitly named in this research. |

**Empty?** No — this backfill is intrinsically source-dependent per city/office; the table above is the operator/planner-facing surface for resolving each one.

## Open Questions

1. **Melissa's true May-2026 ballot content (props-only vs. candidate race).**
   - What we know: migration 100's comment says ISD-only/props-only; a WebSearch this session suggested Mayor+Place2+Place4 may have been contested.
   - What's unclear: which is current/correct.
   - Recommendation: fetch the Collin County canvass PDF for Melissa directly (`collincountytx.gov/docs/default-source/elections/election-results/` — search the archive index) before committing to a research path.

2. **Longview's officeholder-seating gap (D3 hold-over Wray Wade vs. confirmed winner Brandon Smith).**
   - What we know: the runoff winner is now confirmed (Smith, 223-204); migration 187's `offices.politician_id` for District 3 was never updated post-runoff (still reflects Wade, per that migration's own comment about hold-over capacity).
   - What's unclear: whether closing this gap (seating Smith as the current officeholder) is in Phase 219's scope (it's an officeholder-seating action, Phase 218's kind of work, not strictly "elections & candidates") or should be flagged as a follow-up.
   - Recommendation: seed the race+candidates (219's job) and flag the officeholder-seating gap explicitly to the operator as an in-passing bonus fix or an out-of-scope note — don't silently leave an inconsistency where the seeded winner isn't reflected as the current officeholder.

3. **Per-office staggered-term research depth.** For any city where only some offices are covered by this research (e.g., Anna's other 5, Lucas's other 4, McKinney's other 3), how much per-seat archival research is expected before Phase 219 can close? A city could theoretically need results going back 3-4 different election years to honestly backfill every office.
   - Recommendation: the planner should scope this explicitly per plan/wave — likely resolving each city's most-recent SINGLE election first (even if it only covers a subset of that city's offices), documenting any remaining offices whose last election predates a reasonable research horizon (e.g., >4 years) as a legitimately-out-of-cheap-reach gap rather than open-ended archival digging.

4. **Whether `essentials.candidate_staging` already has usable, cited rows for any of the 12 zero-race cities.** This research could not query the live DB directly (no Supabase MCP available to the researcher agent, matching the project's stated no-MCP-for-executor convention). The planner/operator should run this check as a first step before authoring fresh-research plans:
   ```sql
   SELECT cs.full_name, cs.race_hint, cs.citation_url, cs.confidence, cs.status, dj.jurisdiction_name
   FROM essentials.candidate_staging cs
   JOIN essentials.discovery_jurisdictions dj ON dj.id = cs.discovery_jurisdiction_id
   WHERE dj.jurisdiction_name IN ('Blue Ridge','Farmersville','Josephine','Lavon','McKinney','Melissa','Nevada','Saint Paul','Weston','Plano','Richardson','Van Alstyne')
   ORDER BY dj.jurisdiction_name, cs.full_name;
   ```

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `psql`/`DATABASE_URL` (`C:/EV-Accounts/backend/.env`) | Apply migrations (orchestrator) | ✓ (used 191-218) | prod | — |
| `npx tsx` (apply-script wrapper) | Smoke tests | ✓ | — | inline psql |
| collincountytx.gov canvass archive | Primary source data | ✓ (confirmed reachable this session) | — | TML directory / Ballotpedia / local news |
| directory.tml.org (TML City Officials Directory) | Cross-check current officeholder | ✓ | — | — |
| Ballotpedia per-city pages | Cross-check rosters | ✓ | — | local news |
| WebSearch / WebFetch | Extraction | ✓ | — | — |
| Supabase/`essentials` schema direct query | Checking `candidate_staging` for existing proposals | ✗ (no MCP available to this researcher agent) | — | operator/orchestrator runs the SQL in Open Question 4 inline before planning begins |

**Missing dependencies with no fallback:** None blocking — all research-critical sources are reachable via WebSearch/WebFetch.
**Missing dependencies with fallback:** Live DB query access (candidate_staging check) — fallback is having the operator/orchestrator run the provided SQL manually before the plan authors fresh-research tasks.

## Validation Architecture

No automated JS/TS test framework covers civic-data seeding in this codebase — every prior deep-seed/backfill phase (100, 187, 199, 206, 218) validates via inline SQL gates + apply-script assertions + a live browse spot-check, not a unit-test suite. This phase follows the identical pattern.

### "Test" Framework
| Property | Value |
|----------|-------|
| Framework | In-transaction/apply-script `DO $$ ... RAISE EXCEPTION`-style gates + post-apply SQL assertions (218-series convention) |
| Config file | None — per-migration apply script in `C:/EV-Accounts/backend/scripts` |
| Quick run command | `npx tsx scripts/_apply-migration-<NNNN>_<slug>.ts` (from `C:/EV-Accounts/backend`) |
| Full suite command | Re-apply every phase migration → assert idempotent net-zero on a second run |

### Phase Requirements → Verification Map
| Req ID | Behavior | Check | Automated command |
|--------|----------|-------|-------------------|
| COLLIN-ELECT-01 | 12 zero-race governments each have ≥1 seeded race with ≥1 candidate | Per-government race count > 0 | `SELECT g.name, COUNT(r.id) FROM essentials.governments g JOIN essentials.chambers ch ON ch.government_id=g.id JOIN essentials.offices o ON o.chamber_id=ch.id JOIN essentials.races r ON r.office_id=o.id WHERE g.geo_id IN (<12 geo_ids>) GROUP BY g.name;` — every row must be > 0 |
| COLLIN-ELECT-02 | Thin cities backfilled: every seat with a known election has a race | Per-city races-vs-offices reconcile against this research's per-city table | Manual reconcile against the Per-City table above + a documented reason for any office left race-less (genuinely no election found for that seat in the researched cycle) |
| COLLIN-ELECT-03 | No split-section defects; no zero-candidate shells masking a real race | Split-section SQL gate (0 rows) + a "race with 0 candidates" gate (0 rows, or explicitly documented as an open filing period — not applicable here, all seeded races are historical) | `SELECT ch.name_formal, COUNT(DISTINCT COALESCE(gb.display_name,'')) ... HAVING COUNT(...) > 1` (verbatim from [[section_split_check]], reused unmodified from 218's apply script) + `SELECT r.id FROM essentials.races r LEFT JOIN essentials.race_candidates rc ON rc.race_id=r.id WHERE rc.id IS NULL AND r.election_id IN (<this phase's election_ids>);` must be 0 rows |
| No `candidate_status` CHECK violations | Every seeded candidate uses a legal status value | Constraint is enforced by Postgres itself — INSERT fails hard if violated | N/A (schema-enforced, not a post-hoc query) |
| D-06 antipartisan | 0 non-NULL `primary_party` on any seeded race (general elections only) | `SELECT COUNT(*) FROM essentials.races WHERE election_id IN (<phase election_ids>) AND primary_party IS NOT NULL;` must be 0 | psql |
| D-07 no-stances side effect | `inform.politician_answers`/`inform.politician_context` row counts unchanged by this phase's SQL | Before/after total-row-count comparison (218's pattern — NOT a per-politician-id absence check, since some seeded people legitimately already have pre-existing stances) | psql before/after |
| Live render check (Success Criterion #4) | A resident browsing any of the 12 newly-raced governments sees a real race, not an empty Elections section | Manual: `/results?browse_geo_id=<geo_id>` for a sample of governments across zero-race and thin buckets | Human browse spot-check (matches 218-05's Task 2 pattern) |

### Sampling Rate
- **Per migration apply:** the apply-script's embedded gates (race count, candidate count, split-section, antipartisan, no-stances-side-effect).
- **Per tier merge (shared-election tier / fallback-election tier / runoff-closure tier):** re-run the full-23-government race-count reconcile against this research's Per-City table.
- **Phase gate:** all 12 zero-race governments have ≥1 race; all 12 thin governments' office count matches (or documents a gap in) this research's table; split-section clean; antipartisan clean; no-stances-side-effect clean; live browse spot-check of a representative sample (recommend at least one from each tier: Blue Ridge [shared-election], McKinney [fallback-year], Longview [runoff-closure]) approved by a human operator.

### Wave 0 Gaps
- [ ] Per-tier apply scripts `_apply-migration-<NNNN>_<slug>.ts` — author alongside each migration, mirroring the 218-series gate shape.
- [ ] Phase-close roll-up query (all 24 governments → race count vs. office count, with a documented reason for any remaining gap).
- [ ] The `candidate_staging` pre-check query from Open Question 4 — run once, up front, before authoring any per-city fresh-research task.
*(No JS/TS test infra needed — SQL-assertion model matches every prior Collin/AZ/NV/CA election-seeding phase.)*

## Security Domain

Not applicable — this phase performs no authentication, session, input-validation-surface, or cryptography work. It is exclusively SQL data seeding against a fixed, already-modeled schema (`essentials.elections`/`races`/`race_candidates`). `workflow.security_enforcement` is absent from `.planning/config.json` (treated as enabled per convention), but the ASVS categories (V2 Auth, V3 Session, V4 Access Control, V6 Crypto) have no surface here. The one relevant control is **V5 Input Validation**: escape apostrophes (`'` → `''`) in candidate names (Texas names with apostrophes/hyphens are common — e.g. "Donna Crenshaw Outland," "G Hijazen"), and validate every migration file parses before applying — consistent with the AZ Phase 206 research's Pitfall 4 finding (apostrophes/diacritics breaking literal SQL).

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Fabricated candidate/result (a name not actually on the historical ballot) | Tampering / Information disclosure | Evidence-only requirement (D-04/D-06); every seeded candidate must trace to a cited source; honest-document a gap rather than guess |
| `candidate_status` CHECK-constraint bypass attempt (widening the constraint to fit 'won'/'lost') | Tampering (schema integrity) | Do not alter the CHECK constraint — express winner status via `politician_id` linkage instead, per Pitfall 2 |
| SQL literal injection via a real name with `'`/`"` | Tampering | Escape apostrophes; UTF-8 diacritics preserved as-is |
| Accidental stance write (D-07 violation) | Integrity (scope violation) | Before/after row-count assertion on `inform.*` tables |
| `position_name` collision silently swallowing a second city's race via `ON CONFLICT ... DO NOTHING` | Data integrity (silent data loss) | Always city-prefix `position_name`; run the phase-close reconcile query to catch any missing race |

## Sources

### Primary (HIGH confidence — verified against live migration files / applied schema)
- `C:/EV-Accounts/backend/migrations/042_election_schema.sql` — `elections`/`races`/`race_candidates` CREATE TABLE + the `candidate_status CHECK ('active','withdrawn','filed')` constraint (the single most load-bearing fact in this research).
- `C:/EV-Accounts/backend/migrations/044_election_dedup_constraints.sql` — the real partial unique index `(election_id, position_name) WHERE primary_party IS NULL` on `races`; the `(name, election_date, state)` unique constraint on `elections`.
- `C:/EV-Accounts/backend/migrations/099_collin_county_discovery_jurisdictions.sql` — the shared `'2026 Texas Municipal General'` election row + all 23 cities' official-elections `source_url`/`allowed_domains` (a ready-made per-city sourcing map).
- `C:/EV-Accounts/backend/migrations/100_collin_county_may2026_races.sql` — the exact, applied precedent for 11 cities' races+candidates, including the "no candidate race" comment identifying McKinney/Plano/Richardson/Melissa/Josephine as off-cycle/special/props-only.
- `C:/EV-Accounts/backend/migrations/185_longview_tx_government.sql`, `187_longview_tx_d3_runoff_election.sql` — Longview's government/offices + the D3 runoff election row (already existing, reusable).
- `C:/EV-Accounts/backend/migrations/070_discovery_tables.sql` — `candidate_staging` schema (nullable `race_id`, mandatory `citation_url`).
- `C:/EV-Accounts/backend/migrations/1375_az_2026_local_races.sql` — the modern `ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING` idiom, proven live.
- `.planning/phases/218-vacancies-missing-people/218-RESEARCH.md`, `218-02-SUMMARY.md`, `218-04-SUMMARY.md`, `218-05-SUMMARY.md` — current officeholders + `politician_id`s for every Phase-218-seated winner (the D-05 photo-reuse mechanism's data source); per-city election-date facts for Blue Ridge/Nevada/Van Alstyne/Weston/Josephine.
- `src/components/ElectionsView.jsx:397-421,653-668` — confirms zero-candidate races are hidden entirely (`continue` on empty `race.candidates`), and the "Unopposed"/"N seats" badge logic depends only on `activeCandidates.length <= seats` and `candidate_status !== 'withdrawn'` — no "won" concept exists in the render path either.
- `src/pages/Results.jsx:1295-1335` — `nearestElection`/`electionsLabelSuffix` upcoming-with-past-fallback logic, confirming seeded 2026-05-02 (and earlier) races display today.
- `ls` on `C:/EV-Accounts/backend/migrations` — disk MAX = 1392 (next 1393), 2026-07-23.

### Secondary (MEDIUM confidence — WebSearch, cross-checked against an official/semi-official source)
- mckinneytexas.org/2084/2025-Runoff-Election; KERA News "mckinney-election-results-mayor-city-council-2025"; Community Impact McKinney runoff coverage; collincountyvotes.com "mckinney-may-2025-election-recap" — McKinney's real May-2025 reference cycle.
- collincountytx.gov canvass PDF titles ("City of Richardson Special Election") + WebSearch synthesis on the 2027 filing period — Richardson's May-2026 ballot had zero council seats; real cycle is May 2025.
- richardsontoday.com "Unofficial Results from May 6 Richardson City Council, Bond Election" — Richardson May-2025 roster (Places 1,2,3,5,7 unopposed; Place 6 runoff; Voelker won Mayor).
- farmersvilletx.com (via WebSearch synthesis) — Farmersville's 2 uncontested May-2026 seats.
- Longview News-Journal "Brandon Smith wins District 3 seat on Longview City Council" (2026-06-13); Ballotpedia Brandon Smith 2026 candidate page — Longview D3 runoff final result.

### Tertiary (LOW confidence — flagged for mandatory re-verification)
- Melissa's May-2026 ballot content (conflicting: migration 100 comment vs. a WebSearch snippet) — see Open Question 1.
- Lavon and Saint Paul — no usable result surfaced this session; fully open.
- Every "other N offices" cell in the Thin-city table (Anna's remaining 5, Lucas's remaining 4, etc.) — sourcing map only, no candidate names researched.

## Metadata

**Confidence breakdown:**
- Schema/seeding mechanics (constraint shapes, idempotent idioms, candidate_status values): HIGH — directly verified against CREATE TABLE/ALTER TABLE statements and a live-applied AZ migration using the exact idiom.
- Shared-election-row resolution + reuse of the 11 already-raced cities: HIGH — read directly from the applied migration.
- Per-city reference-cycle facts (McKinney/Richardson real cycle, Longview D3 winner, Farmersville uncontested seats): MEDIUM-HIGH — cross-checked across 2+ independent sources this session.
- Full candidate rosters for the "backfill missing offices" cells: LOW — sourcing map only, not yet researched at the individual-office level.
- Melissa's true 2026 ballot content: LOW — genuinely conflicting sources, unresolved.

**Research date:** 2026-07-23
**Valid until:** ~14 days for the schema/mechanics facts (stable, low churn); the specific per-city election facts should be treated as needing re-confirmation at execute time regardless of date, since several were sourced via WebSearch synthesis rather than a direct canvass-PDF fetch.
