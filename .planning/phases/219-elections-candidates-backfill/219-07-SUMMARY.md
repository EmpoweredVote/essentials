---
phase: 219-elections-candidates-backfill
plan: 07
subsystem: data-seeding
tags: [collin-county, elections, races, candidates, texas, sql-migration, sourced-only, thin-city-backfill]
status: complete
dependency-graph:
  requires: [219-01]
  provides: [migration-1398-authored]
  affects: [essentials.elections, essentials.races, essentials.race_candidates]
tech-stack:
  added: []
  patterns:
    - "SOURCED-ONLY gate: a term-start date alone (from an already-cited prior seeding migration) is NOT a sufficient citation to mint an election row and seed a race — only a real, independent election finding (canvass, news, city elections page, or an explicit prior-migration comment describing the election itself, e.g. migration 096's 'Murphy Mayor — re-elected unopposed May 3') qualifies. Offices with only a term-start-date inference stay documented [OPEN], not seeded."
    - "Explicit `IF v_office_id IS NULL THEN RAISE EXCEPTION` guard after the office lookup — office_id is nullable on essentials.races (migration 042), so a wrong geo_id/title would otherwise silently create an orphan race instead of failing loudly"
    - "candidate_status='active'; is_incumbent=true; winner-ness expressed purely via politician_id linkage, never via candidate_status"
key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/1398_collin_thin_backfill_a.sql"
    - "C:/EV-Accounts/backend/scripts/_apply-migration-1398_collin_thin_backfill_a.ts"
  modified: []
decisions:
  - "OPERATOR DECISION (2026-07-24, overriding this plan's original draft): SOURCED-ONLY. Do not seed elections inferred purely from officeholder term-start dates. A first draft of this migration had seeded 25 races (5 per city across Allen/Anna/Lucas/Murphy/Prosper) using each officeholder's already-cited term-start date to infer a 2024 or 2025 reference-election year, with no independent election citation for 24 of those 25 races. The operator ruled this inference-only approach out of scope. Migration 1398 was rewritten in place to seed EXACTLY ONE race — Murphy Mayor — the only one of the original 25 with a real, cited election finding (migration 096's own header note: 'Murphy Mayor (Scott Bradley) — re-elected unopposed May 3, update term to 2026-2029'). All 8 minted election rows and their 24 associated races/candidates were deleted from the migration file; nothing was left half-wired."
  - "The 24 removed offices (Lucas Mayor+Places 3-6; Murphy Places 1/2/4/6; Allen Places 1/3/4/5/6; Anna Mayor+Places 1/2/4/6; Prosper Mayor+Places 1/2/4/6) are documented [OPEN — no sourced election this session; officeholder known but the election wrapper was inference-only]. This is NOT a defect per 219-RESEARCH.md Pitfall 4 ('0 unseated offices != races complete') — Phase 219 Plan 09 (COVERAGE) is expected to treat these as documented-open."
  - "Prosper geo_id correction (documentation only): the draft migration used geo_id 4863276 for Prosper. The operator flagged Prosper's real geo_id as 4859696 (Town of Prosper) — 4863276 appears stale/incorrect. Since the final migration seeds nothing for Prosper, no SQL in this file references either geo_id for Prosper; this is recorded here so a future Prosper reconcile phase uses 4859696, not 4863276."
  - "Did NOT touch the politicians table (Scott Bradley's stale valid_to=2026-05-01, per migration 096's own never-executed TODO to bump it to 2029) — out of this plan's races/candidates-only scope; flagged as an in-passing note for the orchestrator, matching the Longview D3 officeholder-seating-gap precedent from 219-RESEARCH.md Open Question 2."
metrics:
  duration: "~2.5h (Tasks 1-2 only, incl. one operator-directed rewrite; Task 3 delegated to orchestrator)"
  completed: "2026-07-24"
---

# Phase 219 Plan 07: Murphy Mayor Sourced Backfill Summary

Authored, then rewrote in place per operator instruction, migration 1398 plus its gated apply-script under `C:/EV-Accounts`. **Final scope: exactly 1 race (Murphy Mayor) / 1 candidate (Scott Bradley), under the shared 2026-05-02 election row.** An initial draft had seeded 25 races across 5 cities by inferring reference-election years from officeholders' already-cited term-start dates; the operator ruled that inference-only approach out of scope (SOURCED-ONLY policy) and the migration was reduced to the single race with a genuine, independent election citation. **Task 3 (operator apply/push/verify) was NOT executed — delegated to the orchestrator.**

## Task 1: Identified remaining offices + sourced rosters

Read `219-PLAN.md`, `219-PREFLIGHT.md`, `219-RESEARCH.md` (Per-City thin-government table, Patterns 1-5, Pitfall 4), `219-CONTEXT.md`, and `C:/EV-Accounts/backend/migrations/100_collin_county_may2026_races.sql` (the 10 pre-existing races for these 5 cities — 2 each: Allen Mayor/Place 2, Anna Place 3/5, Lucas Place 1/2, Murphy Place 3/5, Prosper Place 3/5).

Confirmed each of Allen/Anna/Lucas/Murphy/Prosper has exactly 7 offices (Mayor + Council Member Place 1-6, per migrations 088/089/090), so each city has exactly 5 offices without a race. Attempted fresh web research via `curl` (no WebSearch/WebFetch tool was available this session) against murphytx.org/166/Elections, prospertx.gov, cityofallen.org/139/City-Council and /155/Election-Information, and a Ballotpedia search for each city's 2024/2025 election — all returned either 404s, a CivicPlus JS-shell page with no server-rendered roster content, or no indexed Ballotpedia article. This confirms 219-RESEARCH.md's own Pitfall 3 / Assumption A7 prediction that this tier of per-seat archival research exceeds a same-session cheap budget.

An initial draft then cross-referenced the already-applied, already-cited officeholder-seeding migrations (094 Allen, 096 Murphy/Prosper, 097 Anna/Lucas) to infer a reference-cycle year from each remaining officeholder's `valid_from` term-start date, and seeded a sole-candidate race per office under a minted own-election row. **The operator reviewed this and ruled it out of scope**: a term-start date is evidence of *when a term began*, not an independent citation that an *election actually happened* on a specific date with this exact officeholder as its outcome — conflating the two risks quietly encoding a guess as a "sourced" fact. Per the operator's SOURCED-ONLY instruction, all 24 such races were removed.

**The one exception kept:** Murphy Mayor. Migration 096's own header comment is not merely a term-date inference — it explicitly describes the election event itself: `"Murphy Mayor (Scott Bradley) — re-elected unopposed May 3, update term to 2026-2029"`. This is a real, cited finding that the seat was on the May 2026 ballot, uncontested, and was simply never seeded as a race by migration 100 (an oversight the TODO itself flags but which no later migration ever executed). This is the one race in this migration.

## Task 2: Migration 1398 + apply-script (rewritten to SOURCED-ONLY scope)

Re-confirmed migration numbering: `ls C:/EV-Accounts/backend/migrations` shows 1393/1394/1395/1396/1397 already exist, 1398 is next-free — matches PREFLIGHT's locked map exactly, no drift.

Rewrote `C:/EV-Accounts/backend/migrations/1398_collin_thin_backfill_a.sql` in place (overwriting the 25-race draft):
- Wrapped in `BEGIN`/`COMMIT`, single `DO $$` block.
- Resolves the shared `2026 Texas Municipal General` row by name/date/state (never a hardcoded UUID) — the only election row this migration touches; **zero minted election rows** (the 8 minted rows from the draft — Lucas/Murphy/Allen/Anna/Prosper 2024/2025 — were deleted entirely, since nothing anchors to them anymore).
- **1 new race**: `Murphy Mayor`, `office_id` resolved via `geo_id` ('4850100') + `title` ('Mayor') subquery join, `primary_party` NULL (D-06), `INSERT ... ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING`.
- Explicit `IF v_office_id IS NULL THEN RAISE EXCEPTION` guard after the office lookup and after the shared-election resolve (3 `RAISE EXCEPTION` guards total).
- **1 candidate row**: Scott Bradley, `WHERE NOT EXISTS (race_id, full_name)` guarded, `politician_id` resolved from `offices.politician_id` (the already-seated Mayor), `is_incumbent=true`, `candidate_status='active'`, `source` citing migration 096's header note + murphytx.org.
- Header comment documents, by name, all 24 removed offices (grouped by city) and the reason they were removed, plus the Prosper geo_id correction note (see Decisions above) — so a future session doesn't have to re-derive why those offices are absent from this file.

Rewrote `C:/EV-Accounts/backend/scripts/_apply-migration-1398_collin_thin_backfill_a.ts` in place, reduced to a single-race scope:
- Gate (a): the Murphy Mayor race exists under the shared 2026-05-02 row after apply.
- Gate (b): exactly 1 candidate on that race, and it is named "Scott Bradley."
- Gate (c): 0 candidate rows with an illegal `candidate_status`.
- Gate (d): 0 non-NULL `primary_party` on the race.
- Gate (e): `inform.politician_answers` total count unchanged before/after (D-07).
- Gate (f): the project-standard split-section SQL check returns 0 rows.
- Gate (g): re-applies the same SQL a second time in-script and asserts the race id + candidate count are byte-for-byte unchanged (idempotency / net-zero re-run).
- Exits non-zero if any gate fails; prints a summary of all counts either way.

**Type-check:** `cd "C:/EV-Accounts/backend" && npx tsc --noEmit --target ES2022 --module ESNext --moduleResolution bundler --esModuleInterop --skipLibCheck scripts/_apply-migration-1398_collin_thin_backfill_a.ts` — clean, zero errors (exit 0). A bare `npx tsc --noEmit <file>` (the plan's literal verify-command form, no explicit flags) reproduces the same category of pre-existing project-config-gap errors (`esModuleInterop`/top-level-`await`) that the identical bare invocation produces on the already-committed, already-accepted `_apply-migration-1395...ts` script — this repo's `tsconfig.json` scopes `include` to `src/**/*` only, excluding `scripts/`, so an explicit file argument bypasses project-config auto-discovery and falls back to `tsc`'s ES3/CommonJS defaults. Confirmed clean against the project's actual intended compiler settings, matching 219-04's precedent. Both `migrations/1398_collin_thin_backfill_a.sql` and `scripts/_apply-migration-1398_collin_thin_backfill_a.ts` confirmed present on disk; SQL sanity-checked via grep (1 race INSERT, 1 candidate INSERT, 0 election mints, 3 RAISE EXCEPTION guards).

## Expected apply-time counts (for the orchestrator's Task 3 verification)

| Election | Race | Candidates |
|---|---|---|
| 2026 Texas Municipal General (2026-05-02, shared row) | Murphy Mayor | 1 (Scott Bradley, is_incumbent=true, candidate_status='active') |
| **Total** | **1 race** | **1 candidate** |

No other race or election row is created, modified, or referenced by this migration.

## Documented-open offices (24 — NOT defects, per Pitfall 4)

These offices have a known, real, currently-seated officeholder (per migrations 094/096/097) but **no independently-sourced election citation** for how/when they were elected — only an inferred cycle from a term-start date, which the operator ruled insufficient to seed a race. Phase 219 Plan 09 (COVERAGE) should treat all 24 as documented-open, not as gaps to auto-fix:

| City (geo_id) | Documented-open offices |
|---|---|
| Lucas (4845012) | Mayor, Council Member Place 3, 4, 5, 6 |
| Murphy (4850100) | Council Member Place 1, 2, 4, 6 |
| Allen (4801924) | Council Member Place 1, 3, 4, 5, 6 |
| Anna (4803300) | Mayor, Council Member Place 1, 2, 4, 6 |
| Prosper (geo_id TBD — see correction note below) | Mayor, Council Member Place 1, 2, 4, 6 |

**Prosper geo_id correction:** the draft of this migration (and this plan's earlier research) used `4863276` for Prosper. The operator has flagged Prosper's real geo_id as **4859696** (Town of Prosper) — `4863276` appears stale/incorrect. Since Prosper seeds nothing in the final migration, no SQL references either value; this note exists so a future Prosper reconcile (or Plan 09 COVERAGE pass) queries the correct geo_id.

If a future session gains real canvass/news access for these 24 seats' actual 2024/2025 elections, a follow-up migration can seed them properly (with genuine citations, not term-date inference) without touching this migration's one Murphy Mayor race.

## Items needing orchestrator DB verification before Task 3

1. **Murphy Mayor's `politician_id` linkage** assumes `offices.politician_id` for Murphy Mayor still resolves to Scott Bradley (per migration 096) — not independently re-verified via a fresh DB query this session (no DB access available to this executor). Recommend a quick pre-check before applying.
2. **Murphy Mayor's politicians-table term dates remain stale** (`valid_to='2026-05-01'` — migration 096's own TODO "update term to 2026-2029" was never executed by any later migration). This migration seeds the RACE correctly under the shared 2026-05-02 row but does NOT touch the politicians table (out of this plan's races/candidates-only scope). Flagged as an in-passing note, not fixed — matches the Longview D3 officeholder-seating-gap precedent (219-RESEARCH.md Open Question 2).
3. **Prosper geo_id (4863276 vs 4859696)** — documentation-only per the correction above; no SQL action needed for this migration, but relevant for whatever phase eventually reconciles Prosper.

## Task 3 — DELEGATED TO ORCHESTRATOR

**Task 3 (operator applies 1398, confirms gates green, pushes, browse spot-check) was NOT executed by this subagent.** Per the objective's explicit instruction, the orchestrator performs: `cd C:/EV-Accounts/backend && npx tsx scripts/_apply-migration-1398_collin_thin_backfill_a.ts`, confirms all gates print green, resolves the DB-verification items flagged above if needed, commits + pushes `C:/EV-Accounts` (Render auto-deploys), and does a live browse spot-check (`/results?browse_geo_id=4850100` Murphy).

This subagent made **zero writes to the production database** and made **zero commits/pushes to `C:/EV-Accounts`** — the migration and apply-script files exist only as untracked files on disk in that repo, ready for the orchestrator to apply.

## Deviations from Plan

### Auto-fixed / Research-adjusted

**1. [Rule 3-adjacent — tooling constraint] No WebSearch/WebFetch tool available this execution session; curl-based fetches proved unproductive against CivicPlus SPA sites**
- **Found during:** Task 1.
- **Issue:** The plan's Task 1 `<read_first>` lists live source URLs (cityofallen.org, annatexas.gov/1015/Elections, lucastexas.us/164/City-Council, murphytx.org, prospertx.gov/479/May-2026-General-Election) implying fresh confirmation, but this session's toolset had no WebSearch/WebFetch. `curl`-based fetches against several of these (and Ballotpedia) either 404'd or returned CivicPlus JS-shell content with no usable server-rendered candidate-roster data for the 2024/2025 off-cycle years.
- **Fix:** Sourced the one race that had a genuine election citation available in the codebase (Murphy Mayor, per migration 096's own header note). Everything else stayed documented-open rather than inferred.
- **Files modified:** N/A (research-only).
- **Commit:** N/A.

**2. [Operator-directed scope reduction — SOURCED-ONLY] Rewrote migration 1398 from 25 races/5 cities down to 1 race/1 city**
- **Found during:** After Task 2's initial draft was authored (25 races seeded via term-date inference).
- **Issue:** The operator reviewed the draft and determined that inferring a reference-election year purely from an officeholder's already-cited term-start date (no independent election citation) does not meet the bar for a "sourced" race — 24 of the 25 drafted races fell into this category.
- **Fix:** Rewrote `1398_collin_thin_backfill_a.sql` and its apply-script in place, removing all 24 inference-only races and their 8 now-unused minted election rows, keeping only Murphy Mayor (the one race with a genuine, independent citation). Documented all 24 removed offices, by name, in the migration header and in this SUMMARY as legitimately open (not defects).
- **Files modified:** `1398_collin_thin_backfill_a.sql`, `_apply-migration-1398_collin_thin_backfill_a.ts` (both in `C:/EV-Accounts`, not committed there — Task 3 delegation), this SUMMARY.
- **Commit:** `[this commit]` (essentials repo, SUMMARY only).

No bugs found, no blocking issues beyond the flagged linkage-verification items above (safe-fail via `RAISE EXCEPTION` on any office-lookup mismatch, not a silent data-integrity risk), no architectural questions requiring a plan change.

## Self-Check: PASSED

- `C:/EV-Accounts/backend/migrations/1398_collin_thin_backfill_a.sql` — FOUND (1 race INSERT, 1 candidate INSERT, 0 election mints, 3 RAISE EXCEPTION guards, 1 BEGIN/COMMIT block — verified via grep counts).
- `C:/EV-Accounts/backend/scripts/_apply-migration-1398_collin_thin_backfill_a.ts` — FOUND, type-checks clean under the project's actual compiler settings (exit 0).
