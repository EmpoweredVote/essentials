---
phase: 220-contact-data-backfill
plan: 02
subsystem: database
tags: [postgres, sql-migration, collin-county, contact-data, web-form-url]

requires:
  - phase: 220-contact-data-backfill (plan 01, Wave 1)
    provides: locked migration-number map (220-PREFLIGHT.md, migration 1405 = this plan), Frisco Place 4 seating correction (mig 1409)
provides:
  - "Migration 1405: idempotent web_form_url batch UPDATE for 11 Collin-milestone cities with a confirmed submittable contact form"
  - "Gated apply-script (_apply-migration-1405_collin_web_form_url_batch.ts, local-only per repo convention) mirroring the 1393 gate shape"
affects: [220-06 (apply Wave), collin-county-contact-data-completeness]

tech-stack:
  added: []
  patterns: ["UPDATE ... FROM (VALUES(geo_id,url)) JOIN governments/chambers/offices, IS NULL-guarded, mirrors 1389/1393 idiom"]

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/1405_collin_web_form_url_batch.sql
    - C:/EV-Accounts/backend/scripts/_apply-migration-1405_collin_web_form_url_batch.ts (gitignored, not committed)
  modified: []

key-decisions:
  - "Committed only the .sql migration to C:/EV-Accounts — confirmed via git log that _apply-migration-*.ts scripts are never tracked (backend/scripts/_* is gitignored repo-wide, e.g. reference script 1393 has zero git history)."
  - "Excluded Anna, Allen, McKinney per RESEARCH.md's own recommendation (mayor-only form / 311-app / weak-fit form with no coverage gap)."
  - "Used p.is_active = true as an explicit extra guard alongside the o.politician_id = p.id join, even though the join alone already scopes to seated officials."

requirements-completed: [COLLIN-CONTACT-01]

coverage:
  - id: D1
    description: "Migration 1405 authored: idempotent UPDATE sets web_form_url for every seated official across 11 confirmed-form Collin cities, guarded on IS NULL, scoped by geo_id join."
    requirement: "COLLIN-CONTACT-01"
    verification:
      - kind: other
        ref: "cd C:/EV-Accounts/backend && test -f migrations/1405_collin_web_form_url_batch.sql"
        status: pass
    human_judgment: true
    rationale: "Migration is authored-only in this plan (not applied) — actual DB-write correctness (gates g-a..g-e) can only be verified when the operator applies it against production in Wave 3 (220-06)."
  - id: D2
    description: "Gated apply-script mirrors 1393's shape: per-geo_id coverage gate, out-of-scope guard, inform.* unchanged, split-section 0 rows, idempotent re-run net-zero."
    verification:
      - kind: other
        ref: "cd C:/EV-Accounts/backend && npx tsc --noEmit --target ES2022 --module ESNext --moduleResolution bundler --esModuleInterop --skipLibCheck --strict scripts/_apply-migration-1405_collin_web_form_url_batch.ts"
        status: pass
    human_judgment: false

duration: 22min
completed: 2026-07-24
status: complete
---

# Phase 220 Plan 02: web_form_url Batch (11 Confirmed-Form Cities) Summary

**Authored migration 1405 — one idempotent `UPDATE ... FROM (VALUES ...)` that stamps 11 Collin-county cities' sourced contact-form URL onto every currently seated official, plus a gated apply-script ready for Wave-3 operator apply.**

## Performance

- **Duration:** ~22 min
- **Started:** 2026-07-24T19:13:00Z
- **Completed:** 2026-07-24T19:35:00Z
- **Tasks:** 1 (single task per plan)
- **Files modified:** 2 (1 committed, 1 gitignored/local-only)

## Accomplishments
- Authored `1405_collin_web_form_url_batch.sql`: one `BEGIN/COMMIT`-wrapped, idempotent `UPDATE essentials.politicians ... FROM (VALUES(geo_id,url), ...) JOIN governments/chambers/offices ... WHERE p.web_form_url IS NULL AND p.is_active = true`, covering exactly the 11 geo_id → URL pairs specified in the plan (Farmersville, Lavon, Longview, Murphy, Princeton, Prosper, Van Alstyne, Blue Ridge, Melissa, Nevada, Fairview), transcribed verbatim from 220-RESEARCH.md's Per-City Sourcing Table.
- Header comment documents the exclusion rationale by concept (mayor-only form, 311-app, weak-fit staff form, mailto/PDF-only pages, WAF/JS-blocked GAP cities) without pasting any excluded city's literal URL/alias, per the plan's instruction.
- Authored `_apply-migration-1405_collin_web_form_url_batch.ts` mirroring 1393's structure: captures `inform.politician_answers` count before/after (gate g-c), asserts per-geo_id seated-count == matched-count for all 11 cities (gate g-a), asserts zero out-of-scope officials carry one of the 11 target URLs (gate g-b), runs the standard split-section query (gate g-d), and re-applies the SQL a second time asserting unchanged per-geo_id counts (gate g-e, idempotency).
- Confirmed both files exist and the SQL contains exactly the 11 enumerated pairs, no excluded city.

## Task Commits

Each task was committed atomically:

1. **Task 1: Author migration 1405 (web_form_url batch) + gated apply-script** - `a661bf2a` (feat, in `C:/EV-Accounts`)

**Plan metadata:** committed in `essentials` repo (see below; this repo's docs commit follows this SUMMARY).

## Files Created/Modified
- `C:/EV-Accounts/backend/migrations/1405_collin_web_form_url_batch.sql` - idempotent web_form_url batch UPDATE for the 11 confirmed-form cities (committed, `a661bf2a`)
- `C:/EV-Accounts/backend/scripts/_apply-migration-1405_collin_web_form_url_batch.ts` - gated apply-script (NOT committed — see Deviations)

## Decisions Made
- Excluded Anna/Allen/McKinney/Parker/Saint Paul/Weston/Celina/Lucas/Lowry Crossing and the 3 GAP cities exactly as the plan specified; no additional cities added or removed from the 11-city scope.
- Kept `p.is_active = true` as an explicit belt-and-suspenders guard even though the `offices.politician_id = politicians.id` join already implies a seated official (vacant offices have `politician_id IS NULL`).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - process correction] Did not commit the apply-script to git**
- **Found during:** Task 1 commit step
- **Issue:** The plan's `files_modified` frontmatter lists both the `.sql` and `.ts` files as deliverables to commit. Attempting `git add` on the `.ts` file failed: `backend/scripts/_*` is gitignored repo-wide. Checking `git log`/`git ls-files` on the reference script `_apply-migration-1393_collin_zero_race_shared_may2026.ts` confirmed it has **zero** git history — it was never tracked either. This is an established, intentional repo convention (apply-scripts are local-only, ephemeral tooling; only the SQL migration is version-controlled).
- **Fix:** Committed only `1405_collin_web_form_url_batch.sql` to `C:/EV-Accounts`. The `.ts` apply-script remains on disk (required for the Wave-3 operator to run `npx tsx scripts/_apply-migration-1405_...ts`) but is not part of git history, matching the reference script's actual state.
- **Files affected:** `C:/EV-Accounts/backend/scripts/_apply-migration-1405_collin_web_form_url_batch.ts` (present on disk, untracked)
- **Verification:** `git -C "C:/EV-Accounts" check-ignore -v` confirms the `.gitignore:71` rule; `git ls-files` on the 1393 reference script returns empty, confirming this is standing convention, not a new gap.
- **Committed in:** N/A (intentionally not committed)

**2. [Rule 1 - tooling artifact] Verify command's bare `tsc --noEmit file.ts` reports spurious errors**
- **Found during:** Task 1 verification step
- **Issue:** The plan's `<automated>` verify command (`npx tsc --noEmit scripts/_apply-migration-1405_....ts`) reports `esModuleInterop`/top-level-`await` errors on both the new script and the reference script 1393, because bare `tsc --noEmit <file>` ignores `tsconfig.json`'s `target`/`module`/`esModuleInterop` settings when not invoked with `-p`. Confirmed this affects 1393 identically — pre-existing tooling quirk, not a defect in the new file.
- **Fix:** Re-ran the type-check with the project's actual compiler options passed explicitly on the CLI (`--target ES2022 --module ESNext --moduleResolution bundler --esModuleInterop --skipLibCheck --strict`); both the new script and the 1393 reference compile with zero errors under those options.
- **Files affected:** none (verification-only)
- **Verification:** `npx tsc --noEmit --target ES2022 --module ESNext --moduleResolution bundler --esModuleInterop --skipLibCheck --strict scripts/_apply-migration-1405_collin_web_form_url_batch.ts` → exit 0.
- **Committed in:** N/A (verification-only, no code change)

---

**Total deviations:** 2 (1 process correction re: git tracking convention, 1 verification-methodology clarification)
**Impact on plan:** No scope creep, no code defects. Both deviations are process/tooling clarifications that keep this plan consistent with the established repo convention already embodied by the reference script (1393) it was told to mirror.

## Issues Encountered
None beyond the two deviations documented above.

## User Setup Required
None - no external service configuration required. Migration 1405 is authored-only; the Wave-3 operator applies it via Supabase MCP / `npx tsx` per 220-PREFLIGHT.md's apply-batch note.

## Next Phase Readiness
- Migration 1405 (`.sql`, committed `a661bf2a`) and its apply-script (`.ts`, on-disk, local-only) are ready for 220-06 (Wave 3) to apply against production alongside migrations 1406–1408.
- No blockers. This plan performs no web/Supabase access itself, per its constraints — everything traced to 220-RESEARCH.md's Per-City Sourcing Table.

---
*Phase: 220-contact-data-backfill*
*Completed: 2026-07-24*

## Self-Check: PASSED
- FOUND: C:/EV-Accounts/backend/migrations/1405_collin_web_form_url_batch.sql
- FOUND: C:/EV-Accounts/backend/scripts/_apply-migration-1405_collin_web_form_url_batch.ts
- FOUND: commit a661bf2a (C:/EV-Accounts)
