---
phase: 219-elections-candidates-backfill
plan: 07
subsystem: data-seeding
tags: [collin-county, elections, races, candidates, texas, sql-migration, thin-city-backfill, off-cycle-term]
status: complete
dependency-graph:
  requires: [219-01]
  provides: [migration-1398-authored]
  affects: [essentials.elections, essentials.races, essentials.race_candidates]
tech-stack:
  added: []
  patterns:
    - "Mint own election row by (name, election_date, state) via ON CONFLICT (name, election_date, state) DO NOTHING (migration 044's elections_name_date_state_unique constraint) — resolved afterward by name/date/state, never a hardcoded literal UUID"
    - "Continuing-incumbent-only backfill: when a seat's remaining term start date (already-cited in an earlier, applied seeding migration) reveals an off-cycle reference year with no independently-sourced opponent this session, seed exactly ONE cited candidate (the known officeholder) under a minted own-election row, with description text stating the full roster/opponent(s) were not re-verified this session — mirrors migration 1396's Weston Council Member Place 5 precedent"
    - "Explicit `IF v_office_id IS NULL THEN RAISE EXCEPTION` guard after every one of the 25 office lookups — office_id is nullable on essentials.races (migration 042), so a wrong geo_id/title would otherwise silently create an orphan race instead of failing loudly"
    - "candidate_status='active' always; is_incumbent=true on every row in this migration (every seeded person is a continuing incumbent re-winning their own seat, not an open-seat flip) — winner-ness expressed purely via politician_id linkage"
    - "Per-city 'total race count = pre-existing (migration 100) + newly-seeded' explicit apply-script gate, plus a byte-for-byte before/after/re-run snapshot (race id + candidate count) of all 10 pre-existing migration-100 races for these 5 cities, proving this migration never touches, duplicates, or ON-CONFLICT-swallows an existing race"
key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/1398_collin_thin_backfill_a.sql"
    - "C:/EV-Accounts/backend/scripts/_apply-migration-1398_collin_thin_backfill_a.ts"
  modified: []
decisions:
  - "Web-research tooling for this session was limited to `curl` (no WebSearch/WebFetch) — targeted fetches against murphytx.org, prospertx.gov, and cityofallen.org's own elections pages returned CivicPlus JS-shell/SPA content with no usable server-rendered roster data, and a Ballotpedia search surfaced no indexed 'City elections in <city>, Texas (2024/2025)' page for any of these 5 smaller cities. Rather than leave every remaining office undocumented-open, reused the already-cited, already-applied officeholder + term-start-date data from migrations 094 (Allen), 096 (Murphy/Prosper), and 097 (Anna/Lucas) to identify both the correct reference-cycle year and the correct continuing-incumbent name for all 25 backfilled offices."
  - "All 25 new races seed exactly ONE candidate (the known continuing incumbent) with is_incumbent=true and an explicit description noting the full roster/opponent(s) were not independently re-verified this session — this is a real, cited race (not a zero-candidate shell, not a fabrication), matching the exact 'known officeholder, unresolved full roster' precedent already established in migrations 1395 (McKinney/Richardson partial fields) and 1396 (Weston sole-candidate)."
  - "Murphy Mayor is the one exception: seeded under the SHARED 2026-05-02 election row (not minted) because migration 096's own header comment ('Murphy Mayor (Scott Bradley) — re-elected unopposed May 3, update term to 2026-2029') is itself a citable finding that this seat WAS on the May 2026 ballot, uncontested, and was simply never seeded as a race by migration 100 — a genuine D-03 declared-elected-unopposed backfill, not a fabrication."
  - "Lucas's office naming uses 'Lucas City Council Place N' (matching migration 100's existing Place 1/2 races) rather than the generic 'Council Member Place N' string used by the other 4 cities, for internal position_name consistency within Lucas's own race list — office.title in the DB stays 'Council Member Place N' either way; only the display position_name string differs."
  - "Did NOT touch the politicians table (Scott Bradley's stale valid_to=2026-05-01, per migration 096's own never-executed TODO to bump it to 2029) — out of this plan's races/candidates-only scope; flagged as an in-passing note for the orchestrator, matching the Longview D3 officeholder-seating-gap precedent from 219-RESEARCH.md Open Question 2."
metrics:
  duration: "~2h (Tasks 1-2 only; Task 3 delegated to orchestrator)"
  completed: "2026-07-24"
---

# Phase 219 Plan 07: Allen/Anna/Lucas/Murphy/Prosper Thin-City Backfill A Summary

Authored migration 1398 (25 races / 25 candidates across 5 thin Collin cities — Allen, Anna, Lucas, Murphy, Prosper) plus its gated apply-script under `C:/EV-Accounts`, bringing all 5 cities from 2/7 to a complete 7/7 race coverage. Every new race is a real, cited continuing-incumbent seat under either a minted own-election row (2024 or 2025 cycle) or, for Murphy Mayor only, the shared 2026-05-02 row. **Task 3 (operator apply/push/verify) was NOT executed — delegated to the orchestrator.**

## Task 1: Identified remaining offices + sourced rosters

Read `219-PLAN.md`, `219-PREFLIGHT.md`, `219-RESEARCH.md` (Per-City thin-government table, Patterns 1-5, Pitfall 4), `219-CONTEXT.md`, and `C:/EV-Accounts/backend/migrations/100_collin_county_may2026_races.sql` (the 10 pre-existing races for these 5 cities — 2 each: Allen Mayor/Place 2, Anna Place 3/5, Lucas Place 1/2, Murphy Place 3/5, Prosper Place 3/5).

Confirmed each city has exactly 7 offices (Mayor + Council Member Place 1-6, per migrations 088/089/090), so each city needs exactly 5 more races. Attempted fresh web research via `curl` (no WebSearch/WebFetch tool was available this session) against murphytx.org/166/Elections, prospertx.gov, cityofallen.org/139/City-Council and /155/Election-Information, and a Ballotpedia search for each city's 2024/2025 election — all returned either 404s, a CivicPlus JS-shell page with no server-rendered roster content, or no indexed Ballotpedia article. This confirms 219-RESEARCH.md's own Pitfall 3 / Assumption A7 prediction that this tier of per-seat archival research exceeds a same-session cheap budget.

Instead of leaving all 25 remaining offices undocumented-open, cross-referenced the already-applied, already-cited officeholder-seeding migrations for these exact 5 cities:
- **Migration 097** (Anna + Lucas): every remaining Anna office (Mayor, Places 1/2/4/6) has `valid_from='2024-05-01'` — a single shared 2024 cycle. Lucas's Mayor + Places 3-6 (Kuykendall/Bierman/Lawrence/Fisher/Peterson) also all carry `valid_from='2024-05-01'` — confirming the plan's own backstop flag that these are continuing incumbents from an EARLIER cycle, not 2026.
- **Migration 094** (Allen): Places 1/3/5 carry `valid_from='2024-05-01'`; Places 4/6 carry `valid_from='2025-05-01'` — two distinct off-cycle years within the same city.
- **Migration 096** (Murphy + Prosper): Murphy Places 1/2 = 2024; Places 4/6 = 2025. Murphy Mayor (Scott Bradley) = `valid_from='2023-05-01', valid_to='2026-05-01'` — i.e. up for re-election in May 2026 — and the migration's own header comment states "Murphy Mayor (Scott Bradley) — re-elected unopposed May 3, update term to 2026-2029," confirming a real, cited, never-seeded 2026 declared-elected-unopposed race. Prosper Places 2/6 = 2024; Mayor + Places 1/4 = 2025.

Cross-checked against Phase 218's re-verification migrations (1388-1391): none of them touch any of these 25 offices (only Anna Place 3/5 and Lucas Place 1/2 — the already-existing migration-100 races — were re-verified in 218), so the 094/096/097 officeholder data stands unchallenged and current.

No opponent/challenger name for any of these 25 off-cycle seats was sourced this session — every race seeds exactly one cited candidate (the known continuing incumbent), never a fabricated field.

## Task 2: Migration 1398 + apply-script

Re-confirmed migration numbering: `ls C:/EV-Accounts/backend/migrations` shows 1393/1394/1395/1396/1397 already exist, 1398 is next-free — matches PREFLIGHT's locked map exactly, no drift.

Authored `C:/EV-Accounts/backend/migrations/1398_collin_thin_backfill_a.sql`:
- Wrapped in `BEGIN`/`COMMIT`, single `DO $$` block.
- Resolves the shared `2026 Texas Municipal General` row by name/date/state (needed only for Murphy Mayor).
- **Mints 8 own election rows**: `Lucas TX City General 2024` (2024-05-04), `Murphy TX City General 2024`/`2025` (2024-05-04/2025-05-03), `Allen TX City General 2024`/`2025`, `Anna TX City General 2024`, `Prosper TX City General 2024`/`2025` — each via `INSERT ... ON CONFLICT (name, election_date, state) DO NOTHING`, resolved by name/date/state, guarded by `RAISE EXCEPTION` if the mint+resolve fails. Dates use the real Texas Secretary of State May-uniform-election dates for 2024 (May 4) and 2025 (May 3) — the same 2025-05-03 date already used twice in migration 1395.
- **25 new races**, each city-prefixed, `office_id` resolved via `geo_id` + `title` subquery join, `primary_party` NULL throughout (D-06), each `INSERT ... ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING` — a brand-new string per race, so the 10 pre-existing migration-100 races (different position_name strings) are structurally untouched.
- Explicit `IF v_office_id IS NULL THEN RAISE EXCEPTION` guard after all 25 office lookups (matches the 1395/1396/1397 defensive-guard convention).
- **25 candidate rows**, each `WHERE NOT EXISTS (race_id, full_name)` guarded. Every row carries `politician_id` (resolved from `offices.politician_id` — the same person already seated), `is_incumbent=true`, `candidate_status='active'`, and a `source` citing the original seeding migration (094/096/097) plus the Texas Secretary of State uniform election date.

Authored `C:/EV-Accounts/backend/scripts/_apply-migration-1398_collin_thin_backfill_a.ts`, mirroring 1395/1397's gate shape, generalized for 5 cities and 9 distinct election rows (8 minted + 1 shared reuse), plus the 2 gates the plan explicitly requires:
- Gate (a): per-geo_id **total** race count (pre-existing 2 + new 5) = 7 for all 5 cities; separately asserts the new-race count is exactly 5 and the pre-existing count is exactly 2 per city.
- Gate (b): every one of the 25 new races has ≥1 candidate.
- Gate (c): 0 candidate rows with an illegal `candidate_status` (checked per distinct election).
- Gate (d): 0 seeded races with non-NULL `primary_party`.
- Gate (e): `inform.politician_answers` total count unchanged before/after (D-07).
- Gate (f): the project-standard split-section SQL check returns 0 rows.
- Gate (h): Murphy Mayor is linked to the shared 2026-05-02 row (the one deliberate exception); every other one of the 24 new races is asserted NOT linked to the shared row.
- **Gate (i) — the plan's explicitly-required "existing races unchanged" gate**: snapshots (race id + candidate count) all 10 pre-existing migration-100 races BEFORE this migration runs (asserting all 10 already exist), AFTER it runs, and AFTER the idempotent re-run — asserting byte-for-byte identical race ids and candidate counts at every checkpoint. This is the load-bearing proof that no `ON CONFLICT` swallowed or altered an existing race.
- Gate (g): re-applies the same SQL a second time in-script and asserts per-geo_id new-race counts, total new-candidate counts, and the migration-100 snapshot are all unchanged (idempotency / net-zero re-run).
- Exits non-zero if any gate fails; prints a summary of all counts either way.

**Type-check:** `cd "C:/EV-Accounts/backend" && npx tsc --noEmit --target ES2022 --module ESNext --moduleResolution bundler --esModuleInterop --skipLibCheck scripts/_apply-migration-1398_collin_thin_backfill_a.ts` — clean, zero errors. A bare `npx tsc --noEmit <file>` (the plan's literal verify-command form, no explicit flags) reproduces the same category of pre-existing project-config-gap errors (`esModuleInterop`/top-level-`await`) that the identical bare invocation produces on the already-committed, already-accepted `_apply-migration-1395...ts` script (confirmed side-by-side: same error set, same line-error types, on both files) — this repo's `tsconfig.json` scopes `include` to `src/**/*` only, excluding `scripts/`, so an explicit file argument on the command line bypasses project-config auto-discovery entirely and falls back to `tsc`'s ES3/CommonJS defaults. Confirmed clean against the project's actual intended compiler settings (matching `tsconfig.json`'s `target`/`module`/`moduleResolution`/`esModuleInterop`), matching 219-04's precedent exactly. Both `migrations/1398_collin_thin_backfill_a.sql` and `scripts/_apply-migration-1398_collin_thin_backfill_a.ts` confirmed present on disk.

## Expected apply-time counts (for the orchestrator's Task 3 verification)

| City (geo_id) | Pre-existing (migration 100) | New (this migration) | Total | New races' election(s) |
|---|---|---|---|---|
| Lucas (4845012) | 2 (Place 1, Place 2) | 5 (Mayor, Place 3, 4, 5, 6) | 7 | Lucas TX City General 2024 (2024-05-04) |
| Murphy (4850100) | 2 (Place 3, Place 5) | 5 (Mayor, Place 1, 2, 4, 6) | 7 | Mayor → shared 2026-05-02; Places 1/2 → Murphy TX City General 2024; Places 4/6 → Murphy TX City General 2025 |
| Allen (4801924) | 2 (Mayor, Place 2) | 5 (Place 1, 3, 4, 5, 6) | 7 | Places 1/3/5 → Allen TX City General 2024; Places 4/6 → Allen TX City General 2025 |
| Anna (4803300) | 2 (Place 3, Place 5) | 5 (Mayor, Place 1, 2, 4, 6) | 7 | Anna TX City General 2024 (all 5) |
| Prosper (4863276) | 2 (Place 3, Place 5) | 5 (Mayor, Place 1, 2, 4, 6) | 7 | Places 2/6 → Prosper TX City General 2024; Mayor/Places 1/4 → Prosper TX City General 2025 |
| **Total** | **10** | **25** | **35** | 8 minted rows + 1 shared-row reuse |

Every new race seeds exactly 1 candidate (25 candidates total) — the known continuing incumbent, `is_incumbent=true`, `candidate_status='active'`.

## Still-race-less offices (documented reasons)

None remaining across these 5 cities — all 25 previously race-less offices (7 offices × 5 cities, minus the 10 pre-existing = 25) are now backfilled. Every remaining office had a knowable reference-cycle year (from an already-cited, already-applied prior seeding migration), so none needed to be left `[OPEN]` under Pitfall 4's "predates a reasonable research horizon" carve-out — the oldest cycle used here is 2024, well within a 4-year research horizon.

## Items needing orchestrator DB verification before Task 3 (highest priority first)

1. **All 25 politician_id linkages assume the 094/096/097-seeded officeholder is still the CURRENT holder of that office.** Cross-checked against Phase 218's re-verification migrations (1388-1391), which touch only Anna Place 3/5 and Lucas Place 1/2 (both already-existing migration-100 races, not any of these 25 offices) — so no contradicting update was found. Still, this was not a fresh live-DB query this session (no DB access available to this executor); recommend a quick pre-check joining `offices.politician_id → politicians.first_name/last_name` for all 25 target (geo_id, title) pairs before applying.
2. **Murphy Mayor's politicians-table term dates remain stale** (`valid_to='2026-05-01'` — migration 096's own TODO "update term to 2026-2029" was never executed by any later migration). This migration seeds the RACE correctly under the shared 2026-05-02 row but does NOT touch the politicians table (out of this plan's races/candidates-only scope). Flagged as an in-passing note, not fixed — matches the Longview D3 officeholder-seating-gap precedent (219-RESEARCH.md Open Question 2). Orchestrator/operator may want a follow-up bonus-fix, separate from this migration.
3. **No opponent/challenger exists for any of these 25 seats in this migration** — by design (D-04's "full filed field" ideal is honestly unmet for these off-cycle years; only the known continuing incumbent is cited). If the orchestrator has independent access to Collin County's 2024/2025 canvass archive, a follow-up migration could enrich these races with the actual opposing candidates without touching this migration's races (add via `WHERE NOT EXISTS` against the same race ids).

## Task 3 — DELEGATED TO ORCHESTRATOR

**Task 3 (operator applies 1398, confirms gates green including the per-city unchanged-existing-races gate, pushes, browse spot-check) was NOT executed by this subagent.** Per the objective's explicit instruction, the orchestrator performs: `cd C:/EV-Accounts/backend && npx tsx scripts/_apply-migration-1398_collin_thin_backfill_a.ts`, confirms all gates print green (including gate (i)'s byte-for-byte migration-100-unchanged snapshot and gate (h)'s Murphy-Mayor-on-shared-row assertion), resolves the DB-verification items flagged above (re-running if any politician_id linkage needs correction), commits + pushes `C:/EV-Accounts` (Render auto-deploys), and does the live browse spot-check (`/results?browse_geo_id=4803300` Anna, per the plan's how-to-verify).

This subagent made **zero writes to the production database** and made **zero commits/pushes to `C:/EV-Accounts`** — the migration and apply-script files exist only as untracked files on disk in that repo, ready for the orchestrator to apply.

## Deviations from Plan

### Auto-fixed / Research-adjusted

**1. [Rule 3-adjacent — tooling constraint] No WebSearch/WebFetch tool available this execution session; curl-based fetches proved unproductive against CivicPlus SPA sites**
- **Found during:** Task 1.
- **Issue:** The plan's Task 1 `<read_first>` lists live source URLs (cityofallen.org, annatexas.gov/1015/Elections, lucastexas.us/164/City-Council, murphytx.org, prospertx.gov/479/May-2026-General-Election) implying fresh confirmation, but this session's toolset had no WebSearch/WebFetch. `curl`-based fetches against several of these (and Ballotpedia) either 404'd or returned CivicPlus JS-shell content with no usable server-rendered candidate-roster data for the 2024/2025 off-cycle years.
- **Fix:** Reused the already-cited, already-applied officeholder + term-start-date data from migrations 094/096/097 to determine both the correct reference-cycle year and the correct continuing-incumbent candidate for all 25 backfilled offices — no web research fabricated, no candidate guessed.
- **Files modified:** N/A (research-only).
- **Commit:** N/A.

**2. [Rule 2 — missing critical functionality] Added the plan-required "existing races unchanged" gate (gate i) with a full before/after/re-run snapshot**
- **Found during:** Task 2, designing the apply-script.
- **Issue:** The plan explicitly requires "(i) explicit gate asserting existing migration-100 race count per city is UNCHANGED... no ON CONFLICT swallow of an existing race" — a stronger requirement than 1395/1397's per-city race-count-only gates.
- **Fix:** Added a dedicated snapshot function capturing race id + candidate count for all 10 pre-existing migration-100 races at 3 checkpoints (before this migration, after it, after its idempotent re-run), asserting byte-for-byte identity at every checkpoint — not just a count match, but the same race ids.
- **Files modified:** `_apply-migration-1398_collin_thin_backfill_a.ts`.
- **Commit:** N/A this repo (file lives in `C:/EV-Accounts`, not committed — Task 3 delegation).

**3. [Rule 4-adjacent — flagged, not silently resolved] All 25 politician_id linkages rely on migrations 094/096/097's officeholder data being still-current, not a fresh DB query**
- **Found during:** Task 2.
- **Issue:** This executor has no DB access; the officeholder-to-office mapping is trusted from already-applied migrations, cross-checked only against Phase 218's re-verification migrations (which happen not to touch any of these 25 offices).
- **Resolution:** Not silently assumed without flagging — surfaced as the #1 orchestrator verification item above, matching the 1395 precedent's equivalent flag for its own politician_id-linkage assumption.
- **Files modified:** N/A (documentation only, in this SUMMARY).
- **Commit:** N/A this repo.

No bugs found, no blocking issues beyond the flagged linkage-verification item above (safe-fail via `RAISE EXCEPTION` on any office-lookup mismatch, not a silent data-integrity risk), no architectural questions requiring a plan change.

## Self-Check: PASSED

- `C:/EV-Accounts/backend/migrations/1398_collin_thin_backfill_a.sql` — FOUND (25 races, 25 candidates, 8 minted elections, 34 RAISE EXCEPTION guards, 1 BEGIN/COMMIT block — verified via grep counts).
- `C:/EV-Accounts/backend/scripts/_apply-migration-1398_collin_thin_backfill_a.ts` — FOUND, type-checks clean under the project's actual compiler settings.
