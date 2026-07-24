---
phase: 220-contact-data-backfill
plan: 04
subsystem: database
tags: [postgres, migration, sql, contact-data, texas-municipal]

# Dependency graph
requires:
  - phase: 220-contact-data-backfill (220-01)
    provides: locked migration-number map (1407 assigned to this plan) + Frisco Place 4 seating resolution (mig 1409, GO on seating / HOLD on this plan's contact batch)
provides:
  - "Migration 1407: idempotent personal email_addresses seeding for Frisco (Places 1,2,3,5,6 — Place 4 omitted), Princeton, Prosper, Allen, Fairview, Celina (42 seat rows attempted)"
  - "Gated apply-script (gitignored) ready for the operator to run in plan 220-06"
affects: [220-06 (apply wave), 220-contact-data-backfill closeout]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Personal-email seeding via UPDATE ... FROM (VALUES (geo_id, title, full_name, email)) JOIN governments->chambers->offices, guarded by array_append + NOT (email_addresses @> ARRAY[...]) idempotency AND an explicit p.full_name = v.full_name match — the full_name guard is new relative to migration 1406's seat-alias pattern, because a PERSONAL address (unlike a seat alias) must never attach to the wrong officeholder if the DB's seated politician has drifted from RESEARCH's live-sourced name."

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/1407_collin_personal_emails_a.sql
    - C:/EV-Accounts/backend/scripts/_apply-migration-1407_collin_personal_emails_a.ts (gitignored, not committed)

key-decisions:
  - "Frisco Place 4 is structurally omitted — the migration's VALUES list contains no Place 4 row at all (not just a WHERE-clause exclusion), and the apply-script's gate g-c asserts Frisco Place 4's politician_id/full_name/email_addresses are byte-for-byte unchanged before vs. after applying (and after a re-run), so the migration cannot touch that seat even accidentally."
  - "Added a p.full_name = v.full_name match to every row (beyond migration 1406's title-only match) as a Rule 2 safety addition: cross-referencing migration history (096/097/100/1389/1390) surfaced 5 seats whose May-2026 election winner was recorded only as a name-only essentials.race_candidates row, with no seating-correction migration re-pointing offices.politician_id — Frisco Mayor (Cheney vs. sourced Mark Hill), Frisco Place 6 (Livingston vs. sourced Brittany Colberg), Celina Place 4 (Wigginton vs. sourced Shea B. Scott), Celina Place 5 (Koehne vs. sourced Shane R. Lambert), Prosper Place 5 (Hodges vs. sourced Doug Charles). Without the full_name guard, a title-only join would misattribute these 5 personal emails to the wrong (stale) officeholder. With the guard, these 5 rows are expected to safely no-op until a future seating-correction migration (same idiom as mig 1409) reseats the actual winners — documented at length in the migration's own header so this is never mistaken for a bug."
  - "Fairview Seat 4 (John Stanley, JStanley@FairviewTexas.org) is already seeded by migration 1390 — included in this migration's VALUES list for completeness/idempotency, expected to simply match the existing-value guard and no-op."

requirements-completed: [COLLIN-CONTACT-02]

coverage:
  - id: D1
    description: "Migration 1407 authored: idempotent personal email_addresses seeding, 42 seat rows attempted across Frisco (6, Place 4 omitted), Princeton (8), Prosper (7), Allen (7), Fairview (7), Celina (7), keyed by geo_id + office title + full_name"
    requirement: COLLIN-CONTACT-02
    verification:
      - kind: other
        ref: "npx tsc --noEmit --target ES2022 --module ESNext --moduleResolution bundler --esModuleInterop --skipLibCheck (project's actual tsconfig.json flags) on apply-script: clean; test -f migrations/1407_collin_personal_emails_a.sql: exists"
        status: pass
    human_judgment: true
    rationale: "SQL correctness against production schema (office titles, seat->politician_id join, and especially the 5 known-possible full_name mismatches) cannot be verified without DB access, which this plan does not have (no Supabase MCP). The gated apply-script's g-a..g-f checks — including the g-a known-possible-skip distinction and the g-c Frisco-Place-4 untouched invariant — must run against live data at apply time (plan 220-06) to confirm actual coverage."

# Metrics
duration: 32min
completed: 2026-07-24
status: complete
---

# Phase 220 Plan 04: Personal Emails A (Frisco, Princeton, Prosper, Allen, Fairview, Celina) Summary

**Authored migration 1407 — idempotent personal email_addresses seeding across 6 cities (42 seat rows attempted), with Frisco Place 4 structurally omitted (already handled by mig 1409) and a name-match safety guard that surfaced 5 additional stale-seat gaps mirroring the Place 4 discrepancy.**

## Performance

- **Duration:** 32 min
- **Started:** 2026-07-24T20:05:00Z
- **Completed:** 2026-07-24T20:37:00Z
- **Tasks:** 1 completed
- **Files modified:** 2 (both new)

## Accomplishments
- Authored `1407_collin_personal_emails_a.sql`: one idempotent `UPDATE ... FROM (VALUES ...)` join seeding personal emails for Frisco (Mayor + Places 1,2,3,5,6 — Place 4 deliberately absent from the VALUES list), Princeton (Mayor + Places 1–7), Prosper (Mayor + Places 1–6), Allen (Mayor + Places 1–6), Fairview (Mayor + Seats 1–6), Celina (Mayor + Places 1–6) — 42 seat rows total, transcribed verbatim from 220-RESEARCH.md including every domain/TLD gotcha (allentx.gov not cityofallen.org; princetontx.us not .gov; celina-tx.gov with hyphen; FairviewTexas.org; friscotexas.gov; prospertx.gov, including the `craig_andres@` and `Abartley@` exceptions verbatim).
- **Confirmed Frisco Place 4 is fully omitted**, per the PREFLIGHT HOLD instruction: the migration's VALUES list contains zero rows for that office. The apply-script's gate g-c independently asserts (before apply, after apply, and after a re-run) that Frisco Place 4's `politician_id`, `full_name`, and `email_addresses` are byte-for-byte unchanged — a structural belt-and-suspenders guard on top of the VALUES-list omission.
- **Added a full_name match beyond title-only matching** (a Rule 2 safety addition relative to migration 1406's seat-alias pattern, which correctly does NOT need this since aliases attach to the office regardless of holder). Cross-referencing prior migrations (096, 097, 100, 1389, 1390) — since this plan has no DB access — surfaced that 5 of the 42 targeted seats have an election result recorded only as a name-only `race_candidates` row, with no seating-correction migration ever re-pointing `offices.politician_id`:
  - Frisco Mayor (DB likely still Jeff Cheney; RESEARCH sources Mark Hill)
  - Frisco Place 6 (DB likely still Brian Livingston; RESEARCH sources Brittany Colberg)
  - Celina Place 4 (DB likely still Wendie Wigginton; RESEARCH sources Shea B. Scott)
  - Celina Place 5 (DB likely still Mindy Koehne; RESEARCH sources Shane R. Lambert)
  - Prosper Place 5 (DB likely still Jeff Hodges; RESEARCH sources Doug Charles)

  Without the full_name guard, a title-only join (matching 1406's pattern) would have silently attached each of these 5 personal emails to the wrong (stale) officeholder — exactly the T-220-01/T-220-07 misattribution risk the plan's threat model calls out for Frisco Place 4 specifically, but which turns out to apply to 4 additional seats too. With the guard, all 5 rows will match zero DB rows and safely no-op (documented at length in the migration's own header, and reported by the apply-script's gate g-a as an informational "known-possible-skip," not a failure) until a future seating-correction migration reseats the actual winners — the same idiom migration 1409 used for Frisco Place 4.
- Authored the gated apply-script (`_apply-migration-1407_collin_personal_emails_a.ts`, gitignored per `backend/scripts/_*` convention): gate g-a (37 of 42 required rows present, with the 5 known-possible-skip rows logged informationally rather than failing), g-b (0 generic catch-all local-parts across the 6 geo_ids), g-c (Frisco Place 4 completely untouched, checked before/after apply and after re-run), g-d (`inform.politician_answers` row count unchanged), g-e (split-section check returns 0 rows), g-f (idempotent re-run: no lost/duplicated/changed emails across all 42 rows).
- Confirmed office-title conventions against prior migrations rather than guessing (no DB access this plan): `Mayor`/`Council Member Place N` for Frisco, Princeton, Prosper, Allen, Celina; `Mayor`/`Council Member Seat N` for Fairview (Town of Fairview uses "Seat," not "Place" — confirmed via migrations 097, 1389, 1390, 1405).
- Confirmed Prosper's currently-correct geo_id is `4859696` (not the stale `4863276` used in the original tier-seeding migrations 089/096/099) by cross-referencing migrations 1398 (which explicitly documents the drift), 1402, and 1405 — matching the geo_id already specified by the plan/PREFLIGHT/RESEARCH.

## Task Commits

Each task was committed atomically:

1. **Task 1: Author migration 1407 (personal emails A) + gated apply-script** - `14c5002e` (feat, in `C:/EV-Accounts`)

**Plan metadata:** committed separately in `essentials` (see below).

## Files Created/Modified
- `C:/EV-Accounts/backend/migrations/1407_collin_personal_emails_a.sql` - Idempotent personal-email `email_addresses` seeding for Frisco (5 of 6 non-Place-4 seats expected to succeed; Mayor and Place 6 flagged as known-possible-skips), Princeton (8/8), Prosper (6 of 7; Place 5 flagged), Allen (7/7), Fairview (7/7, one seat already-seeded), Celina (5 of 7; Places 4/5 flagged) — Frisco Place 4 structurally absent from the VALUES list
- `C:/EV-Accounts/backend/scripts/_apply-migration-1407_collin_personal_emails_a.ts` - Gated apply-script (gitignored, not committed to git) with gates g-a..g-f; ready for the operator to run in plan 220-06

## Decisions Made
- Frisco Place 4 omitted structurally (no VALUES row), not just filtered by a WHERE clause — the strongest possible guarantee this migration cannot touch that office, reinforced by apply-script gate g-c's before/after/re-run invariant check.
- Added `p.full_name = v.full_name` to the JOIN condition for every row (a deviation from migration 1406's title-only pattern, justified because these are personal — not alias — addresses that must attach to a specific human, not just a seat).
- Seeded all 5 known-possible-mismatch rows anyway (rather than omitting them like Frisco Place 4) because, unlike Place 4, there is no PREFLIGHT-level GO/HOLD resolution for these 5 seats — the full_name guard makes seeding them safe-by-construction (a no-op if wrong, a correct seed if the DB happens to already be current), and leaving them in the migration means a future seating-correction migration will retroactively pick up the email for free on its next run.
- Prosper's geo_id confirmed as `4859696` per the plan/PREFLIGHT/RESEARCH (not the older, drifted `4863276`), cross-checked against migration 1398's explicit documentation of the drift plus 1402/1405's confirmed usage of `4859696`.

## Deviations from Plan

**1. [Rule 2 - Missing critical functionality] Added a full_name safety guard beyond the plan's literal title-only join, and discovered 5 additional stale-seat gaps as a result.**
- **Found during:** Task 1, while cross-referencing office-title conventions against migration history (no DB access this plan).
- **Issue:** A title-only join (mirroring migration 1406's seat-alias pattern) would misattribute personal emails for 5 seats whose May-2026 election winner was recorded as a name-only `race_candidates` row but never actually seated via `offices.politician_id` — Frisco Mayor, Frisco Place 6, Celina Place 4, Celina Place 5, Prosper Place 5.
- **Fix:** Added `AND p.full_name = v.full_name` to the migration's WHERE clause for every row, ensuring a personal email only attaches when the DB's currently active officeholder's name matches RESEARCH's sourced name exactly. The 5 affected rows are expected to safely no-op (documented extensively in the migration header) rather than being either fabricated-around or silently mis-seeded.
- **Files modified:** `C:/EV-Accounts/backend/migrations/1407_collin_personal_emails_a.sql`, `C:/EV-Accounts/backend/scripts/_apply-migration-1407_collin_personal_emails_a.ts`
- **Commit:** `14c5002e`

No other deviations — the rest of the plan (Frisco Place 4 omission, TLD/domain verbatim transcription, idempotency shape, D-02 catch-all guard) executed exactly as written.

## Issues Encountered
- The plan's literal verification command (`npx tsc --noEmit scripts/....ts`, no flags) reported `esModuleInterop`/top-level-await errors — confirmed as the known false positive called out in the task prompt by reproducing the identical error set against the pre-existing, already-applied migration 1393's apply-script. Re-ran with the project's actual `tsconfig.json` compiler flags (`--target ES2022 --module ESNext --moduleResolution bundler --esModuleInterop --skipLibCheck`), which passed clean. Root cause (same as plan 220-03's finding): `backend/tsconfig.json`'s `include` is scoped to `src/**/*`, so a bare `tsc <file-outside-src>` falls back to TS's older compiler-option defaults instead of the project's real config.
- **Discovered but NOT fixed (out of scope, Rule 4 territory):** 5 seats across 3 cities (Frisco Mayor/Place 6, Celina Places 4/5, Prosper Place 5) have an unresolved May-2026 election result — a winner was recorded as a name-only `race_candidates` row, but no seating-correction migration ever re-pointed the office to them. This is the same category of issue Pitfall 3 flagged for Frisco Place 4 (which mig 1409 already fixed), but for these 5 seats no PREFLIGHT resolution exists yet. Reseating an officeholder is an architectural change (new officeholder identity, term dates, possibly `is_active` flips) requiring its own sourced/certified migration — not a contact-data change, and out of scope for this data-only phase. Flagging for a future migration (or an addition to 220-06/close-out) to reseat: Frisco Mayor → Mark Hill, Frisco Place 6 → Brittany Colberg, Celina Place 4 → Shea B. Scott, Celina Place 5 → Shane R. Lambert, Prosper Place 5 → Doug Charles (sworn in 2026-05-12 per migration 096's own header note).

## User Setup Required

None - no external service configuration required. The migration and apply-script are authoring artifacts only; the operator applies them in plan 220-06 via Supabase MCP.

## Next Phase Readiness
- Migration 1407 is ready for Wave 3 (plan 220-06) application alongside 1405, 1406, 1408 (and 1410 if needed), per the 220-PREFLIGHT.md locked migration-number map.
- **Follow-up recommended before or during 220-06 close-out:** consider a small seating-correction migration (mirroring 1409's idiom) for the 5 discovered stale seats, so a re-run of 1407 (or a targeted follow-up) can then seed their emails. Not blocking this plan's completion.
- No blockers to this plan's own deliverable. This plan's output is authoring-only (no DB writes performed by this agent, no Supabase MCP access).

---
*Phase: 220-contact-data-backfill*
*Completed: 2026-07-24*

## Self-Check: PASSED
- FOUND: C:/EV-Accounts/backend/migrations/1407_collin_personal_emails_a.sql
- FOUND: C:/EV-Accounts/backend/scripts/_apply-migration-1407_collin_personal_emails_a.ts
- FOUND: commit 14c5002e (C:/EV-Accounts)
