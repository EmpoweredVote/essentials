---
phase: 219-elections-candidates-backfill
plan: 04
subsystem: data-seeding
tags: [collin-county, elections, races, candidates, texas, sql-migration, fallback-year, runoff]
status: complete
dependency-graph:
  requires: [219-01]
  provides: [migration-1395-authored]
  affects: [essentials.elections, essentials.races, essentials.race_candidates]
tech-stack:
  added: []
  patterns:
    - "Mint own election row by (name, election_date, state) via ON CONFLICT (name, election_date, state) DO NOTHING (migration 044's elections_name_date_state_unique constraint) — resolved afterward by name/date/state, never a hardcoded literal UUID"
    - "General vs runoff seats use distinct city-prefixed position_names (e.g. 'McKinney Mayor' vs 'McKinney Mayor Runoff') under separate election rows so they never ON CONFLICT-collide"
    - "election_type='special' for a runoff row (schema CHECK on essentials.elections has no literal 'runoff' value — matches migration 187's Longview D3 runoff precedent)"
    - "Explicit `IF v_office_id IS NULL THEN RAISE EXCEPTION` guard after every office lookup — office_id is nullable on essentials.races (migration 042), so an unguarded wrong geo_id/title would silently create an orphan race instead of failing loudly"
    - "candidate_status='active' always; winner expressed via politician_id linkage, never a status value"
    - "Reuse offices.politician_id for a winner ONLY when the office already holds that exact cited person (assumed via the Phase-218/1393/1394 seeding-record pattern, NOT independently DB-verified this session — no DB access)"
key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/1395_mckinney_richardson_2025_races.sql"
    - "C:/EV-Accounts/backend/scripts/_apply-migration-1395_mckinney_richardson_2025_races.ts"
  modified: []
decisions:
  - "McKinney's 'Place 3' citation (Feltus defeated Warren) does not literally match any of McKinney's 7 real office titles (Mayor, At-Large Place 1/2, District 1-4, per migration 088) — mapped to 'Council Member District 3' as a best-guess (sequential 1-4 numbering reasoning), NOT independently re-verified this session (no web-search tool available). Guarded by a hard RAISE EXCEPTION if the office isn't found under that title. Flagged as the #1 verification item for the orchestrator before Task 3."
  - "Richardson's geo_id is given as 4861796 throughout this phase's planning docs (PREFLIGHT/RESEARCH, both compiled from a live Task-1 DB probe), but the original Richardson seeding migrations (089/095/099) used geo_id 4863500 (migration 088/089's own header comment: 'FIPS place GEOID: 4863500'). Trusted the live-probed 4861796 as current ground truth (consistent with RESEARCH's documented pattern of Phase 217 correcting several cities' stale geo_ids), guarded by RAISE EXCEPTION if office lookup fails. Flagged for orchestrator DB verification before Task 3."
  - "Feltus/Warren/Garrison seeded with full_name=surname-only, first_name=NULL — no first name was ever sourced in PREFLIGHT/RESEARCH for these three candidates; left honestly partial rather than fabricated."
  - "McKinney's Mayor General race and At-Large Place 1 General race each seed only the 2 cited candidates (the top-2 who advanced to runoff) out of a reported 4-candidate and 5-candidate field respectively — the other candidates in each field were never named in any source this session and are not fabricated."
metrics:
  duration: "~2h (Tasks 1-2 only; Task 3 delegated to orchestrator)"
  completed: "2026-07-24"
---

# Phase 219 Plan 04: McKinney/Richardson 2025 Reference-Cycle Races Summary

Authored migration 1395 (8 races / 16 candidates across McKinney's May-2025 general + June-2025 runoff and Richardson's May-2025 general) plus its gated apply-script under `C:/EV-Accounts`, minting three new own-election rows by name/date/state. Neither city is linked to the shared 2026-05-02 TX election row anywhere in this migration — enforced by an explicit apply-script wrong-row guard. **Task 3 (operator apply/push/verify) was NOT executed — delegated to the orchestrator.**

## Task 1: Cited rosters

Read `219-PREFLIGHT.md` §4/§6/§7 (the settled per-city reference-cycle decisions, including the two explicit RESEARCH.md corrections), `219-RESEARCH.md` (Per-City table, Pitfall 1/2/3, Pattern 1-5), and `219-CONTEXT.md`. No WebSearch/WebFetch tool was available this session — all facts trace to PREFLIGHT's citations (themselves compiled by a prior WebSearch/WebFetch-equipped session with a live Task-1 DB probe).

**McKinney (4845744)** — real reference cycle = May 3, 2025 general + June 7, 2025 runoff (migration 100's own header comment already excludes McKinney from the shared 2026-05-02 row, "last election 2025"). Of McKinney's 7 real offices (Mayor + Council Member At-Large Place 1/2 + Council Member District 1-4, per migration 088), 4 were confirmed up in the 2025 cycle:
- **Mayor**: General — 4-candidate field, no majority (only Bill Cox and Scott Sanford named/sourced this session; the other 2 candidates in the field were never cited and are not fabricated). Runoff (June 7, 2025): **Bill Cox defeated Scott Sanford, 52.55%**.
- **Council Member District 1**: incumbent Justin Beller, unopposed (declared elected).
- **"Place 3"** (citation title, does not literally match any DB office — see Deviations below): **Feltus defeated Warren, ~54%** (first names never sourced this session).
- **Council Member At-Large Place 1**: General — 5-candidate field, no majority (only Ernest Lynch 29.33% and Garrison 19.97%, the top-2, named/sourced this session). Runoff (June 7, 2025, per this plan's own runoff-pairing text): **Ernest Lynch defeated Garrison**, certified alongside Cox (Garrison's first name never sourced).

Other 3 of 7 McKinney offices (Council Member District 2, District 4, At-Large Place 2) were **not confirmed up in the 2025 cycle this session** — left race-less, [OPEN] per PREFLIGHT, no cycle guessed.

**Richardson (4861796)** — real reference cycle = May 3, 2025 (the 2026-05-02 Richardson ballot was a charter/bond-only special election with zero council seats, confirmed via 2 independent sources per PREFLIGHT). Of Richardson's 7 real offices (Mayor + Council Member District 1-4 [= Richardson's own "Place 1-4"] + Place 5 + Place 6, per migration 089):
- **Mayor**: **Amir Omar (6,672 votes, 55.3%) defeated incumbent Bob Dubey (5,084, ~41%) and Alan C. North (485, ~3%)**. This CORRECTS RESEARCH.md's erroneous "Paul Voelker won Mayor" claim — no source found this session supports a Voelker win; Omar's win is independently confirmed across 3 sources per PREFLIGHT §6.
- **Council Member Place 6**: **incumbent Arefin Shamsul (7,023) defeated Lisa Kupfer (4,240)** — a straight 2-candidate race, NO runoff. This CORRECTS RESEARCH.md's erroneous "3-way runoff (Burdette/Frederick/Shamsul)" claim.

Places 1-5 were **not independently re-verified this session** — left race-less, [OPEN] per PREFLIGHT §4/§7.

Every runoff winner matches the PREFLIGHT citation (Cox/Lynch for McKinney; no runoff for Richardson).

## Task 2: Migration 1395 + apply-script

Confirmed migration numbering: `ls C:/EV-Accounts/backend/migrations` shows on-disk MAX = 1394 (219-03's migration, already committed) — 1395 is next-free, matching PREFLIGHT's locked map exactly, no drift.

Authored `C:/EV-Accounts/backend/migrations/1395_mckinney_richardson_2025_races.sql`:
- Wrapped in `BEGIN`/`COMMIT`, single `DO $$` block.
- **Mints 3 own election rows**: `McKinney TX City General 2025` (2025-05-03), `McKinney TX City Runoff 2025` (2025-06-07, `election_type='special'` — matches migration 187's Longview D3 runoff precedent, since the schema CHECK has no literal `'runoff'` value), `Richardson TX City General 2025` (2025-05-03) — each via `INSERT ... ON CONFLICT (name, election_date, state) DO NOTHING`, resolved into a local variable by name/date/state. Raises an exception if any mint+resolve fails. **Neither city ever resolves or references the shared `8eaba170` / `2026 Texas Municipal General` row anywhere in this file.**
- 8 races total, each city-prefixed and cycle-disambiguated (`'McKinney Mayor'` vs `'McKinney Mayor Runoff'`; `'McKinney Council Member At-Large Place 1'` vs `'... Runoff'`), `office_id` resolved via `geo_id` + `title` subquery join, `primary_party` NULL throughout (D-06), each `INSERT ... ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING`.
- **Added a defensive guard not present in 1393/1394**: an explicit `IF v_office_id IS NULL THEN RAISE EXCEPTION` check after every office lookup. `essentials.races.office_id` is nullable (migration 042) — without this guard, either of this migration's two flagged assumptions (McKinney's "Place 3" title mapping, Richardson's geo_id) being wrong would silently create an orphan race instead of failing loudly at apply time.
- 16 candidate rows, each `WHERE NOT EXISTS (race_id, full_name)` guarded. Winners carry `politician_id` resolved from `offices.politician_id`; losers have no `politician_id`, name fields only. Every row `candidate_status='active'`; `is_incumbent` set explicitly per seat per citation (Beller=true, Dubey=true, Shamsul=true; all others=false — no incumbency citation found).

Authored `C:/EV-Accounts/backend/scripts/_apply-migration-1395_mckinney_richardson_2025_races.ts`, mirroring 1394's gate shape, generalized for 3 distinct elections, plus 2 new gates specific to this plan's must-haves:
- Gate (a): per-geo_id race count > 0 for McKinney/Richardson.
- Gate (b): every one of the 8 target races has ≥1 candidate.
- Gate (c): 0 candidate rows with an illegal `candidate_status` (checked per distinct election).
- Gate (d): 0 seeded races with non-NULL `primary_party` (checked per distinct election).
- Gate (e): `inform.politician_answers` total count unchanged before/after (D-07).
- Gate (f): the project-standard split-section SQL check returns 0 rows.
- **Gate (h) — the wrong-row guard**: explicit assertion that 0 McKinney/Richardson races are linked to the shared `2026 Texas Municipal General` (2026-05-02) election row, checked both before AND after the apply (and again after the idempotent re-run) — the single most important invariant this migration exists to enforce.
- **Gate (i) — general/runoff distinctness**: for both seat pairs (Mayor, At-Large Place 1), asserts the general race and the runoff race resolve to two different, both-present race ids — never a missing side or a collided single row.
- Gate (g): re-applies the same SQL a second time in-script and asserts per-geo_id race counts, total candidate counts, and the wrong-row-guard count are all unchanged (idempotency).
- Exits non-zero if any gate fails; prints a summary of all counts either way.

**Type-check:** `cd "C:/EV-Accounts/backend" && npx tsc --noEmit --target ES2022 --module ESNext --moduleResolution bundler --esModuleInterop --strict --skipLibCheck scripts/_apply-migration-1395_mckinney_richardson_2025_races.ts` — clean, zero errors. A bare `npx tsc --noEmit <file>` (no explicit flags) reproduces the same category of pre-existing project-config-gap errors (`esModuleInterop`/top-level-`await`) that the identical bare invocation produces on the already-working `_apply-migration-1394...ts` script (confirmed by running the same bare command against it) — this repo's `tsconfig.json` scopes `include` to `src/**/*` only, excluding `scripts/`, so an explicit file argument bypasses project-config detection. Confirmed clean against the project's actual intended settings, matching 219-02/219-03's precedent exactly.

## Expected apply-time counts (for the orchestrator's Task 3 verification)

| City | Election | Races | Candidates |
|------|----------|-------|-----------|
| McKinney (4845744) | McKinney TX City General 2025 (2025-05-03) | 4 (Mayor, District 1, District 3 [="Place 3"], At-Large Place 1) | 7 (2+1+2+2) |
| McKinney (4845744) | McKinney TX City Runoff 2025 (2025-06-07) | 2 (Mayor Runoff, At-Large Place 1 Runoff) | 4 (2+2) |
| Richardson (4861796) | Richardson TX City General 2025 (2025-05-03) | 2 (Mayor, Place 6) | 5 (3+2) |
| **Total** | — | **8** | **16** |

## General/runoff pairs

| General race | Runoff race | Winner |
|---|---|---|
| McKinney Mayor | McKinney Mayor Runoff | Bill Cox |
| McKinney Council Member At-Large Place 1 | McKinney Council Member At-Large Place 1 Runoff | Ernest Lynch |

## Seats left race-less (documented reasons)

- McKinney Council Member District 2, District 4, At-Large Place 2 — not confirmed up in the 2025 cycle this session; [OPEN] per PREFLIGHT §4/§7.
- Richardson Council Member Place 1, 2, 3, 4, 5 — not independently re-verified this session (no source found reporting contested/uncontested status beyond Mayor + Place 6); [OPEN] per PREFLIGHT §4/§7.

## Items needing orchestrator DB verification before Task 3 (highest priority first)

1. **McKinney "Place 3" office-title mapping (highest priority)** — PREFLIGHT/RESEARCH cite "Place 3" (Feltus defeated Warren) as one of McKinney's 4 confirmed 2025 seats, but McKinney's actual 7 DB office titles (migration 088) are exactly `Mayor`, `Council Member At-Large Place 1`, `Council Member At-Large Place 2`, `Council Member District 1`-`District 4` — no literal "Place 3" exists. This migration maps "Place 3" → `Council Member District 3` as a best-guess (not independently re-verified this session, no web-search tool available). If wrong, the migration's `RAISE EXCEPTION` guard will fail loudly (not silently) at apply time — orchestrator should verify against `mckinneytexas.org/139/Elections` or the DB directly before running Task 3, and correct the title in the SQL if needed.
2. **Richardson geo_id discrepancy** — this phase's planning docs (PREFLIGHT/RESEARCH, compiled from a live Task-1 DB probe) consistently give Richardson's geo_id as `4861796`, but the original Richardson seeding migrations (089/095/099) used `4863500` (migration 088/089's own header comment literally states "FIPS place GEOID: 4863500"). This migration trusts `4861796` as current ground truth. If wrong, the migration's `RAISE EXCEPTION` guard will fail loudly — orchestrator should run `SELECT geo_id FROM essentials.governments WHERE name ILIKE '%Richardson%' AND state='TX'` before Task 3.
3. **Politician_id linkage assumption (all 6 winners)** — every winning candidate is linked via `offices.politician_id` (blind trust that the office's current officeholder = the cited winner, matching the exact pattern used unmodified in 1393/1394). This was **not independently DB-verified this session** (no DB access available to this executor). Names that must match the office's current holder for the link to be correct: McKinney Mayor → Bill Cox; McKinney Council Member District 1 → Justin Beller; McKinney Council Member District 3 (="Place 3") → Feltus; McKinney Council Member At-Large Place 1 → Ernest Lynch; Richardson Mayor → Amir Omar; Richardson Council Member Place 6 → Arefin Shamsul. If any office's current holder is a *different* person, the migration will link the wrong `politician_id` (it does not fail loudly on this specific mismatch, unlike the office-title guards above) — recommend the orchestrator run a quick pre-check query joining `offices.politician_id → politicians.first_name/last_name` for these 6 seats before applying, and re-seed name-only (no `politician_id`) for any seat where the current holder does not match.

## Task 3 — DELEGATED TO ORCHESTRATOR

**Task 3 (operator applies 1395, confirms gates green including the wrong-row guard, pushes, browse spot-check) was NOT executed by this subagent.** Per the objective's explicit instruction, the orchestrator (with Chris's authorization to apply/verify/push against production) performs: `npx tsx scripts/_apply-migration-1395_mckinney_richardson_2025_races.ts` from `C:/EV-Accounts/backend`, confirms all gates print green (including gate h's wrong-row guard and gate i's general/runoff distinctness check), resolves the two flagged office-title/geo_id assumptions above (re-running if a correction is needed), commits + pushes `C:/EV-Accounts` (Render auto-deploys), and does the live browse spot-check (`/results?browse_geo_id=4845744` McKinney, `/results?browse_geo_id=4861796` Richardson).

This subagent made **zero writes to the production database** and made **zero commits/pushes to `C:/EV-Accounts`** — the migration and apply-script files exist only as untracked files on disk in that repo (`scripts/_*` is gitignored in that repo regardless), ready for the orchestrator to apply.

## Deviations from Plan

### Auto-fixed / Research-adjusted

**1. [Rule 3-adjacent — tooling constraint] No WebSearch/WebFetch tool available this execution session**
- **Found during:** Task 1.
- **Issue:** The plan's Task 1 `<read_first>` lists live source URLs (mckinneytexas.org, dallasnews.com, communityimpact.com, etc.) implying fresh WebSearch/WebFetch confirmation, but this subagent's toolset this session did not include WebSearch or WebFetch.
- **Fix:** Relied entirely on the already-extensive, multiply-cited PREFLIGHT.md §4/§6 findings (themselves produced by a prior WebSearch/WebFetch-equipped session with a live DB probe). No new claims were fabricated; every seeded fact traces to a PREFLIGHT citation.
- **Files modified:** N/A (research-only).
- **Commit:** N/A.

**2. [Rule 2 — missing critical functionality] Added a hard office-lookup guard not present in 1393/1394**
- **Found during:** Task 2, while resolving McKinney's "Place 3" office-title ambiguity and Richardson's geo_id discrepancy (see below).
- **Issue:** `essentials.races.office_id` is nullable (migration 042) — the established 1393/1394 pattern has no guard against a wrong `geo_id`/`title` silently producing an orphan race with `office_id = NULL`. This migration has two flagged assumptions (below) that could plausibly be wrong.
- **Fix:** Added `IF v_office_id IS NULL THEN RAISE EXCEPTION ...` after every one of the 6 office lookups in this migration, so an incorrect assumption fails loudly at apply time instead of silently seeding a broken race.
- **Files modified:** `1395_mckinney_richardson_2025_races.sql`.
- **Commit:** N/A this repo (file lives in `C:/EV-Accounts`, not committed — Task 3 delegation).

**3. [Rule 4-adjacent — flagged, not silently resolved] McKinney "Place 3" office-title ambiguity**
- **Found during:** Task 2, resolving office_id for the seat PREFLIGHT/RESEARCH cite as "Place 3."
- **Issue:** No McKinney office is literally titled "Place 3" (migration 088's 7 real titles listed above). Mapping to the wrong office would either silently orphan the race (were it not for the new RAISE EXCEPTION guard) or, worse, link the wrong seat's `office_id`/`politician_id`.
- **Resolution:** Did NOT silently guess-and-proceed without flagging. Mapped to `Council Member District 3` (documented reasoning in the migration header) and prominently surfaced as the #1 verification item for the orchestrator in this SUMMARY and the final report — this is a genuine open question this executor cannot resolve without either DB access or a fresh mckinneytexas.org fetch, neither available this session.
- **Files modified:** `1395_mckinney_richardson_2025_races.sql` (header comment + inline `RAISE EXCEPTION` message).
- **Commit:** N/A this repo.

**4. [Rule 4-adjacent — flagged, not silently resolved] Richardson geo_id discrepancy (4861796 vs 4863500)**
- **Found during:** Task 2, resolving office_id joins for Richardson.
- **Issue:** This phase's own planning docs (PREFLIGHT/RESEARCH) consistently use geo_id `4861796` for Richardson, but the original Richardson seeding migrations (089/095/099) used `4863500` (with migration 088/089's header explicitly stating "FIPS place GEOID: 4863500"). No migration in the repo was found that updated Richardson's `governments.geo_id` between those two values.
- **Resolution:** Trusted the phase's own live-DB-probed value (`4861796`) as current ground truth, consistent with RESEARCH's documented pattern of Phase 217 correcting several cities' stale geo_ids post-initial-seed — but flagged prominently (migration header + this SUMMARY + final report) since this executor could not independently confirm which value is currently live in `essentials.governments`.
- **Files modified:** `1395_mckinney_richardson_2025_races.sql` (header comment + inline `RAISE EXCEPTION` messages).
- **Commit:** N/A this repo.

No bugs found, no blocking issues beyond the two flagged assumptions above (both are safe-fail via `RAISE EXCEPTION`, not silent data-integrity risks), no architectural questions requiring a plan change.

## Self-Check: PASSED
