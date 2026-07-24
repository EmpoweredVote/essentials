---
phase: 219-elections-candidates-backfill
plan: 02
subsystem: data-seeding
tags: [collin-county, elections, races, candidates, texas, sql-migration]
status: complete
dependency-graph:
  requires: [219-01]
  provides: [migration-1393-authored]
  affects: [essentials.races, essentials.race_candidates]
tech-stack:
  added: []
  patterns:
    - "Resolve shared election_id by (name, election_date, state) — never hardcode literal UUID"
    - "ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING (races)"
    - "WHERE NOT EXISTS (race_id, full_name) guard (race_candidates)"
    - "candidate_status='active' always; winner expressed via politician_id linkage, never a status value"
key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/1393_collin_zero_race_shared_may2026.sql"
    - "C:/EV-Accounts/backend/scripts/_apply-migration-1393_collin_zero_race_shared_may2026.ts"
  modified: []
decisions:
  - "Research correction: PREFLIGHT's 'Blue Ridge Mayor/Place 1 contested' claim is superseded — the official Collin County May 2, 2026 canvass (all 19 pages, every jurisdiction with a countable ballot) omits Blue Ridge entirely, matching the same absence pattern independently confirmed for cancelled/uncontested Farmersville and Nevada. Seeded Blue Ridge Mayor/Place1/Place5 as D-03 single-candidate declared-elected, not Pattern 3 contested races."
  - "Van Alstyne Mayor kept as genuinely contested (Atchison 399-71 over Soucie) since that result carries an independent secondary-source citation (KTEN/Ballotpedia) with an actual vote count, uncorrelated with the Collin-only canvass (Van Alstyne straddles the Collin/Grayson county line)."
  - "Van Alstyne Place 6 (Zach Williams) seeded as D-03 single-candidate declared-elected — city's own bio text confirms an electoral win ('elected...in 2026') but no opponent/vote-count citation exists."
metrics:
  duration: "~2h (research-heavy: direct city-site fetches + official Collin County canvass PDF)"
  completed: "2026-07-24"
---

# Phase 219 Plan 02: Blue Ridge/Farmersville/Nevada/Van Alstyne Shared-Cycle Race Seeding Summary

Authored migration 1393 (10 races / 11 candidates across Blue Ridge, Farmersville, Nevada, Van Alstyne) plus its gated apply-script under `C:/EV-Accounts`, resolving the shared 2026-05-02 TX municipal election by name/date/state and correcting a PREFLIGHT research assumption about Blue Ridge's Mayor/Place 1 races after direct evidence from the official county canvass.

## Task 1: Cited rosters (research)

For each city I read PREFLIGHT.md §4, RESEARCH.md's per-city table, and migrations 090/1388/1389/1390 (existing office titles + Phase-218 politician_id links), then did fresh direct-fetch research to lock or correct each seat:

**Nevada (4850760)** — Mayor Donald Deering, Place 1 Mike Laye, Place 2 Paul Baker, all unopposed/declared-elected. Confirmed via direct fetch of `cityofnevadatx.org/government/city_council.php` (verbatim staff-directory listing) and `cityofnevadatx.org/government/elections.php`, which states verbatim: "The offices of Mayor and Council Member Positions 1 and 2 are elected in even-numbered years, while Council Member Positions 3, 4, and 5 are elected in odd-numbered years" — and its own term-expires table confirms Places 3/4/5 (Wilson/Laughter/Little) expire 2027, not up this cycle. **Places 3, 4, 5 left race-less** with that documented reason.

**Farmersville (4825488)** — Council Member Place 1 Coleman Strickland and Place 3 Kristi Mondy, both unopposed/declared-elected. Confirmed via direct fetch of `farmersvilletx.com/city-secretary/page/elections`, which states verbatim: "The May 2, 2026 City General Election has been cancelled. Incumbents Coleman Strickland (CC Place 1) and Kristi Mondy (CC Place 3) are the only applicants that were turned in to run for the positions listed below." The same page's roster table shows Mayor/Place2/Place4/Place5 were not among the filed 2026 applicants. **Mayor, Place 2, Place 4, Place 5 left race-less** with that documented reason.

**Blue Ridge (4808872)** — Mayor Rhonda Williams, Place 1 David Apple, Place 5 Keith Chitwood. **Research correction:** I fetched the official Collin County "May 2, 2026 Joint General and Special Election — Summary Results Report — All Races" PDF (19 pages, every jurisdiction with a countable ballot that day, including 1-2-vote MUD director races) directly from `collincountytx.gov/elections/election-results-archive`. Blue Ridge is entirely absent from all 19 pages — the same absence pattern independently confirmed for Farmersville and Nevada (both of which have their own city-published cancellation notices). Direct fetch of `blueridgecity.com/elections` confirms the 3 seats actually up in 2026 (Mayor, 2 At-Large seats — one held by Apple, one genuinely "Open Seat") and that the city's own document library contains no contested-race notice for 2026 (only a stale 2023 unopposed-candidate certificate). This supersedes PREFLIGHT's "contested, retained" characterization of Mayor/Place 1 — no opponent name was ever cited by Phase 218 or 219-01's research despite direct effort, and the county-canvass absence is strong affirmative evidence of an uncontested cycle. All 3 seats seeded as D-03 single-candidate declared-elected. **Places 2, 3, 4 left race-less**: direct fetch of `blueridgecity.com/council` shows Braly/Sissom/Mattingly all list "Term ends May 2027" — a 2-year staggered term not up in the 2026-05-02 cycle.

**Van Alstyne (4874924)** — Mayor Jim Atchison defeated Kevin Soucie 399-71 (kept as genuinely contested — this citation, carried from Phase 218/1389, is an independent secondary source with an actual vote count, KTEN news + Ballotpedia, uncorrelated with the Collin-only canvass; Van Alstyne straddles the Collin/Grayson county line and plausibly certifies through Grayson County, which would explain its absence from the Collin report without contradicting the vote-count citation). Place 6 Zach Williams — migration 1390's own citation ("Zach Williams was elected to City Council Place 6 in 2026," per the city's own bio page) confirms a real electoral win but with no opponent/vote-count found; seeded as D-03 single-candidate declared-elected, `is_incumbent=false` (new to the seat, replacing the previously-stubbed Angelica Pena). **Places 1-5 left race-less**: no citation of any 2026-05-02 (or other) election was found this session for these 5 seats; remains [OPEN] per PREFLIGHT, deferred to a future reconcile phase.

## Task 2: Migration 1393 + apply-script

Confirmed migration numbering: `ls C:/EV-Accounts/backend/migrations` shows on-disk MAX = 1392, no `1393*` file or scripts collision exists — 1393 is still next-free, matching PREFLIGHT's locked map exactly (no drift).

Authored `C:/EV-Accounts/backend/migrations/1393_collin_zero_race_shared_may2026.sql`:
- Wrapped in `BEGIN`/`COMMIT`, single `DO $$` block.
- Resolves `election_id` via `SELECT id FROM essentials.elections WHERE name='2026 Texas Municipal General' AND election_date='2026-05-02' AND state='TX'` into a local variable (raises an exception if not found) — never a hardcoded UUID literal in an INSERT target.
- 10 races, each city-prefixed (`'Nevada Mayor'`, `'Blue Ridge Council Member Place 5'`, etc.), `office_id` resolved via `geo_id` + `title` subquery join, `primary_party` NULL throughout (D-06), each `INSERT ... ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING`.
- 11 candidate rows (10 races; Van Alstyne Mayor has 2 candidates), each `WHERE NOT EXISTS (race_id, full_name)` guarded. Winners carry `politician_id` resolved from `offices.politician_id` (reusing the Phase-218-seated officeholder and its photo, D-05); the one loser (Kevin Soucie) has no `politician_id`, name fields only. Every row `candidate_status='active'`; `is_incumbent` set explicitly per seat (true for all retained seats, false for the 2 genuinely new seats — Chitwood and Williams).

Authored `C:/EV-Accounts/backend/scripts/_apply-migration-1393_collin_zero_race_shared_may2026.ts`, mirroring 1389's gate shape:
- Captures `inform.politician_answers` count before any writes.
- Applies the migration SQL.
- Gate (a): per-geo_id race count > 0 for all 4 target geo_ids.
- Gate (b): every one of the 10 target races has ≥1 candidate.
- Gate (c): 0 candidate rows with `candidate_status NOT IN ('active','withdrawn','filed')` among this migration's races.
- Gate (d): 0 seeded races with non-NULL `primary_party`.
- Gate (e): `inform.politician_answers` total count unchanged before/after (D-07).
- Gate (f): the project-standard split-section SQL check returns 0 rows.
- Gate (g): re-applies the same SQL a second time in-script and asserts both per-geo_id race counts and total candidate counts are unchanged (idempotency).
- Exits non-zero if any gate fails; prints a summary of all counts either way.

**Type-check:** `cd "C:/EV-Accounts/backend" && npx tsc --noEmit --target ES2022 --module ESNext --moduleResolution bundler --esModuleInterop --strict --skipLibCheck scripts/_apply-migration-1393_collin_zero_race_shared_may2026.ts` — clean, zero errors. Note: a bare `npx tsc --noEmit <file>` (no explicit compiler flags) reports `esModuleInterop`/top-level-`await` errors on this file — but the identical bare invocation produces the identical errors on the already-applied, working `_apply-migration-1389...ts` script. This is because `tsconfig.json`'s `include` is scoped to `src/**/*` only (excludes `scripts/`), so passing an explicit file argument to `tsc` bypasses project-config detection and falls back to default (ES3-era) compiler options. This is a pre-existing project-config gap unrelated to this file; verified clean against the project's actual intended settings (`target: ES2022, module: ESNext, esModuleInterop: true` — read from `tsconfig.json`).

## Expected apply-time counts (for the orchestrator's Task 3 verification)

| City | Races | Candidates |
|------|-------|-----------|
| Nevada (4850760) | 3 (Mayor, Place 1, Place 2) | 3 |
| Farmersville (4825488) | 2 (Place 1, Place 3) | 2 |
| Blue Ridge (4808872) | 3 (Mayor, Place 1, Place 5) | 3 |
| Van Alstyne (4874924) | 2 (Mayor, Place 6) | 3 (Mayor has 2 candidates: Atchison + Soucie) |
| **Total** | **10** | **11** |

## Seats left race-less (documented reasons)

- Blue Ridge Places 2, 3, 4 (Braly, Sissom, Mattingly) — confirmed "Term ends May 2027" (not up this cycle).
- Farmersville Mayor, Place 2, Place 4, Place 5 — not among the seats filed for the cancelled May 2026 ballot per the city's own page.
- Nevada Places 3, 4, 5 (Wilson, Laughter, Little) — odd-year election cycle per the city's own elections page; last elected 2025, expires 2027.
- Van Alstyne Places 1-5 — no citation of any election found this session; remains [OPEN] for a future reconcile phase.

## Task 3 — DELEGATED TO ORCHESTRATOR

**Task 3 (operator applies 1393, confirms gates green, pushes, browse spot-check) was NOT executed by this subagent.** Per the objective's explicit instruction, the orchestrator (with Chris's authorization to apply/verify/push against production) performs: `npx tsx scripts/_apply-migration-1393_collin_zero_race_shared_may2026.ts` from `C:/EV-Accounts/backend`, confirms all gates print green, commits + pushes `C:/EV-Accounts` (Render auto-deploys), and does the live browse spot-check at `/results?browse_geo_id=4808872` (Blue Ridge).

This subagent made **zero writes to the production database** and made **zero commits/pushes to `C:/EV-Accounts`** — the migration and apply-script files exist only as untracked files on disk in that repo, ready for the orchestrator to apply.

## Deviations from Plan

### Auto-fixed / Research-corrected

**1. [Rule 1-adjacent — evidence correction] Blue Ridge Mayor/Place 1 reclassified from "contested" to "uncontested/declared-elected"**
- **Found during:** Task 1 research.
- **Issue:** PREFLIGHT.md characterized these two races as "contested, retained" without an opponent citation ever having been found across two prior research passes (Phase 218, Phase 219-01).
- **Fix:** Direct-fetched the official Collin County May 2, 2026 canvass (comprehensive, all jurisdictions) and confirmed Blue Ridge's total absence — the same signature as the two other confirmed-cancelled cities in this same plan (Farmersville, Nevada). Seeded as D-03 single-candidate declared-elected instead of Pattern-3 contested races requiring a fabricated or unfindable opponent.
- **Files modified:** `1393_collin_zero_race_shared_may2026.sql` (header comment documents the correction in full).
- **Commit:** N/A this repo (file lives in `C:/EV-Accounts`, not yet committed — see Task 3 delegation above).

No other deviations. Tasks 1-2 executed as planned; no bugs, no missing-functionality gaps, no blocking issues, no architectural questions encountered.

## Self-Check: PASSED

- FOUND: `C:/EV-Accounts/backend/migrations/1393_collin_zero_race_shared_may2026.sql`
- FOUND: `C:/EV-Accounts/backend/scripts/_apply-migration-1393_collin_zero_race_shared_may2026.ts`
- FOUND: `.planning/phases/219-elections-candidates-backfill/219-02-SUMMARY.md`
- Type-check clean under project's actual compiler options (verified above).
- No git commits/pushes made to `C:/EV-Accounts` by this subagent (verified: Task 3 delegated).
