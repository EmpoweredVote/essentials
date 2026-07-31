---
phase: 220-contact-data-backfill
plan: 03
subsystem: database
tags: [postgres, migration, sql, contact-data, texas-municipal]

# Dependency graph
requires:
  - phase: 220-contact-data-backfill (220-01)
    provides: locked migration-number map (1406 assigned to this plan) + Frisco Place 4 seating resolution context
provides:
  - "Migration 1406: idempotent seat/role-alias email_addresses seeding for Blue Ridge, Nevada, Melissa (19 seats)"
  - "Gated apply-script (gitignored) ready for the operator to run in plan 220-06"
affects: [220-06 (apply wave), 220-contact-data-backfill closeout]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Seat-alias email seeding via UPDATE ... FROM (VALUES (geo_id, title, email)) JOIN governments->chambers->offices, guarded by array_append + NOT (email_addresses @> ARRAY[...]) idempotency check (extends the 1405 web_form_url VALUES-join pattern to array-append semantics)"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/1406_collin_seat_alias_emails.sql
    - C:/EV-Accounts/backend/scripts/_apply-migration-1406_collin_seat_alias_emails.ts (gitignored, not committed)
  modified: []

key-decisions:
  - "Melissa Place 5 seeded as the personal address cackerman@cityofmelissa.com verbatim (breaks the placeN@ pattern) rather than fabricating a place5@ alias, per RESEARCH.md and D-05."
  - "McKinney's existing District#@/mayor@ pattern (migration 093) was NOT re-seeded — referenced only as the pattern model in the migration's header comment, per plan instruction."
  - "Office seat titles ('Mayor', 'Council Member Place N') confirmed against prior migrations (093, 098, 1389, 1390, 1393, 1401, 1405) rather than re-derived, since this plan has no DB access."

requirements-completed: [COLLIN-CONTACT-02]

coverage:
  - id: D1
    description: "Migration 1406 authored: idempotent seat-alias email_addresses seeding for Blue Ridge (6 seats), Nevada (6 seats), Melissa (7 seats) keyed by geo_id + office title"
    requirement: COLLIN-CONTACT-02
    verification:
      - kind: other
        ref: "npx tsc --noEmit (project flags) on apply-script: clean; test -f migrations/1406_collin_seat_alias_emails.sql: exists"
        status: pass
    human_judgment: true
    rationale: "SQL correctness against production schema (office titles, seat->politician_id join) cannot be verified without DB access, which this plan does not have (no Supabase MCP). The gated apply-script's g-a..g-e checks must run against live data at apply time (plan 220-06) to confirm the migration behaves as authored."

# Metrics
duration: 18min
completed: 2026-07-24
status: complete
---

# Phase 220 Plan 03: Seat-Alias Emails (Blue Ridge, Nevada, Melissa) Summary

**Authored migration 1406 — idempotent array-append seeding of 19 published seat/role-alias emails across Blue Ridge, Nevada, and Melissa, keyed by geo_id + office title, with a gated apply-script enforcing the D-02 no-generic-catch-all guard.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-07-24T19:22:00Z
- **Completed:** 2026-07-24T19:40:12Z
- **Tasks:** 1 completed
- **Files modified:** 2 (both new)

## Accomplishments
- Authored `1406_collin_seat_alias_emails.sql`: one idempotent `UPDATE ... FROM (VALUES ...)` join seeding 19 seat aliases (Blue Ridge Mayor + Place 1–5, Nevada Mayor + Place 1–5, Melissa Mayor + Place 1–6) onto each seat's currently-seated official's `email_addresses`, guarded so re-application is net-zero.
- Melissa Place 5 seeded as the sourced personal address (`cackerman@cityofmelissa.com`), transcribed exactly as RESEARCH.md gives it rather than forcing it into the `placeN@` shape.
- Authored the gated apply-script (`_apply-migration-1406_collin_seat_alias_emails.ts`, gitignored per `backend/scripts/_*` convention) mirroring migration 1393's gate structure: g-a (every targeted seat carries its expected alias), g-b (0 generic catch-all local-parts — `info`/`cityhall`/`contact`/bare `council` — across the 3 geo_ids), g-c (inform.politician_answers row count unchanged), g-d (split-section check returns 0 rows), g-e (idempotent re-run: no lost or duplicated aliases).
- Confirmed office-title convention (`Mayor`, `Council Member Place N`) for all three cities against 7 prior migrations (093, 098, 1389, 1390, 1393, 1401, 1405) rather than guessing, since this plan has no Supabase MCP / DB access.

## Task Commits

Each task was committed atomically:

1. **Task 1: Author migration 1406 (seat-alias emails) + gated apply-script** - `c30bded8` (feat, in `C:/EV-Accounts`)

**Plan metadata:** committed separately in `essentials` (see below).

## Files Created/Modified
- `C:/EV-Accounts/backend/migrations/1406_collin_seat_alias_emails.sql` - Idempotent seat-alias `email_addresses` seeding for Blue Ridge, Nevada, Melissa (19 seats total)
- `C:/EV-Accounts/backend/scripts/_apply-migration-1406_collin_seat_alias_emails.ts` - Gated apply-script (gitignored, not committed to git) with gates g-a..g-e; ready for the operator to run in plan 220-06

## Decisions Made
- Melissa Place 5's personal address is seeded verbatim, not normalized to a fabricated `place5@` alias — matches RESEARCH.md's explicit callout and D-05 (never fabricate).
- McKinney intentionally excluded from this migration's seed list (already baseline-complete via migration 093); referenced only in the header comment as the pattern this migration follows.
- Reused the exact office `title` strings already proven live by six prior migrations targeting these same three geo_ids, rather than re-deriving them, since this plan is authoring-only with no DB read access.

## Deviations from Plan

None - plan executed exactly as written. One clarification: the plan's suggested idempotency guard shape (`WHERE NOT (email_addresses @> ARRAY[<addr>]::text[])`, NULL coalesced to empty) was implemented via `array_append(COALESCE(email_addresses, ARRAY[]::text[]), v.email)` combined with the same `NOT (COALESCE(...) @> ARRAY[...])` WHERE guard — functionally identical to the plan's example, adapted to the `UPDATE ... FROM (VALUES ...)` batch-join shape used by the companion migration 1405 rather than one `DO $$` block per seat (093's older style). This is a structural choice, not a deviation from any locked decision.

## Issues Encountered
- The plan's literal verification command (`npx tsc --noEmit scripts/....ts`, no flags) reported `esModuleInterop`/top-level-await errors. Per the task prompt's known-false-positive note, re-ran with the project's actual `tsconfig.json` compiler flags (`--target ES2022 --module ESNext --moduleResolution bundler --esModuleInterop --skipLibCheck --strict`) explicitly, which passed clean. Root cause: `backend/tsconfig.json`'s `include` is scoped to `src/**/*`, so a bare `tsc <file-outside-src>` falls back to TS's compiler-option defaults (which lack `esModuleInterop` and default to an older target) instead of the project's real config — a known quirk of invoking `tsc` with explicit file arguments outside the configured `include` root, not a bug in the authored script.

## User Setup Required

None - no external service configuration required. The migration and apply-script are authoring artifacts only; the operator applies them in plan 220-06 via Supabase MCP (not by running the gitignored `.ts` script with a live `DATABASE_URL`, per this milestone's standing convention that gsd-executor has no Supabase MCP but the orchestrator/operator does).

## Next Phase Readiness
- Migration 1406 is ready for Wave 3 (plan 220-06) application alongside 1405, 1407, 1408 (and 1410 if needed), per the 220-PREFLIGHT.md locked migration-number map.
- No blockers. This plan's deliverable is authoring-only (no DB writes performed by this agent).

---
*Phase: 220-contact-data-backfill*
*Completed: 2026-07-24*

## Self-Check: PASSED
- FOUND: C:/EV-Accounts/backend/migrations/1406_collin_seat_alias_emails.sql
- FOUND: C:/EV-Accounts/backend/scripts/_apply-migration-1406_collin_seat_alias_emails.ts
- FOUND: commit c30bded8 (C:/EV-Accounts)
