---
phase: 216-unincorporated-locality-label
plan: 01
subsystem: api
tags: [postgis, st_covers, express, vitest, tiger, geofence]

# Dependency graph
requires:
  - phase: 213-anonymous-coordinate-lookup-endpoint
    provides: resolveOfficialsAtPoint shared core (tribal_land precedent, PostGIS ST_Covers pattern)
provides:
  - "locality field on AddressSearchResult: { incorporated: boolean|null, place_name: string|null, county_name: string|null }"
  - "buildLocality(state, placeRows, countyRow) pure gate helper, PLACE_LOADED_STATES const (11 states, MO excluded)"
  - "placeQueryText / countyNameQueryText ST_Covers probes wired into resolveOfficialsAtPoint's shared Promise.all"
  - "locality exposed on POST /candidates/search subset; inherited verbatim by /coordinate-lookup"
affects: [216-02, 216-03, 216-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dedicated narrow ST_Covers geofence probe run in the shared Promise.all (tribal_land precedent), attached at both return points of resolveOfficialsAtPoint"
    - "Static-source assertion tests for SQL-shape/wiring guarantees a mock-pg unit test can't otherwise exercise"

key-files:
  created:
    - C:/EV-Accounts/backend/test/essentialsService-locality.test.ts
    - C:/EV-Accounts/backend/src/routes/essentialsCandidates.test.ts
  modified:
    - C:/EV-Accounts/backend/src/lib/essentialsService.ts
    - C:/EV-Accounts/backend/src/routes/essentialsCandidates.ts
    - C:/EV-Accounts/backend/src/routes/essentialsCoordinateLookup.test.ts

key-decisions:
  - "PLACE_LOADED_STATES is the 11-state hardcoded list from 216-CONTEXT.md's live DB ground-truth query (AZ CA IN ME MD MA NV OR TX UT VA), NOT a dynamic per-request gate — MO's 1 incidental G4110 row is excluded by construction"
  - "county_name is computed unconditionally from countyRow, never gated by PLACE_LOADED_STATES (D-03)"
  - "essentialsCoordinateLookup.ts left untouched — it passes the full result through verbatim and inherits locality automatically"

patterns-established:
  - "Unit tests importing the real essentialsService.ts module must stub SUPABASE_URL/SUPABASE_ANON_KEY/SUPABASE_SERVICE_ROLE_KEY/DATABASE_URL/ADMIN_INGEST_TOKEN via process.env.X ??= '...' before import, since env.ts process.exits(1) on missing vars and pg is mocked (no real connection needed)"

requirements-completed: [LOC-01, LOC-02, LOC-03]

coverage:
  - id: D1
    description: "buildLocality() pure helper + PLACE_LOADED_STATES gate returns correct three-state (true/false/null) shape, county_name always populated"
    requirement: "LOC-01"
    verification:
      - kind: unit
        ref: "backend/test/essentialsService-locality.test.ts#buildLocality (Phase 216, LOC-01/02) — 8 tests"
        status: pass
    human_judgment: false
  - id: D2
    description: "Two ST_Covers probes (place G4110/G4120, county G4020) wired into the shared Promise.all with correct lng/lat order; locality attached at both return points of resolveOfficialsAtPoint"
    requirement: "LOC-01"
    verification:
      - kind: unit
        ref: "backend/test/essentialsService-locality.test.ts#resolveOfficialsAtPoint locality wiring (static-source assertions, Phase 216 Task 2) — 5 tests"
        status: pass
      - kind: other
        ref: "npx tsc --noEmit (accounts-api backend)"
        status: pass
    human_judgment: false
  - id: D3
    description: "locality exposed on POST /candidates/search subset response; coordinate route inherits it verbatim (unmodified file)"
    requirement: "LOC-03"
    verification:
      - kind: unit
        ref: "backend/src/routes/essentialsCandidates.test.ts#POST /api/essentials/candidates/search — subset-key smoke test (LOC-03) — 2 tests"
        status: pass
    human_judgment: false
  - id: D4
    description: "Live end-to-end verification (real DB, real address/coordinate lookups) that locality resolves correctly for Pima County AZ / Monroe County IN fixtures"
    verification: []
    human_judgment: true
    rationale: "This plan is source-level only (per its own <success_criteria>: 'Live verification happens in 216-02'). No live/DB-backed test run was performed here — deferred to 216-02's checkpoint."

# Metrics
duration: 8min
completed: 2026-07-22
status: complete
---

# Phase 216 Plan 01: Backend Locality Probe Summary

**Added a `locality` signal (incorporated/place_name/county_name) to accounts-api's shared `resolveOfficialsAtPoint`, gated to an 11-state PLACE_LOADED_STATES allowlist, and exposed it on both `/candidates/search` and `/coordinate-lookup`.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-22T22:27:53Z
- **Completed:** 2026-07-22T22:35:44Z
- **Tasks:** 3/3 completed
- **Files modified:** 5 (2 created, 3 modified) — all in C:/EV-Accounts (accounts-api backend)

## Accomplishments
- `buildLocality(state, placeRows, countyRow)` pure helper + `PLACE_LOADED_STATES` const (`AZ, CA, IN, ME, MD, MA, NV, OR, TX, UT, VA` — 11 states, MO excluded per the 216-CONTEXT.md live DB ground-truth query), unit-tested with 8 behavior cases.
- Two new `ST_Covers` geofence probes (`placeQueryText` filtered to `mtfcc IN ('G4110','G4120')`, `countyNameQueryText` filtered to `mtfcc = 'G4020'`) wired into `resolveOfficialsAtPoint`'s shared `Promise.all`, mirroring `tribalQueryText`'s exact SRID/ST_Covers expression and `$1=lng, $2=lat` coordinate order. `locality` attached at both the empty-early-return and normal-return objects.
- `locality` added to the explicit `/candidates/search` subset response object; `/coordinate-lookup` inherits it automatically (that file was NOT touched — it returns the full result verbatim).
- New `essentialsCandidates.test.ts` route smoke test (none existed before this phase) guards the 5-key subset shape (`politicians, tribal_land, locality, county, jurisdiction`) against future accidental field drops.

## Task Commits

Each task was committed atomically in `C:/EV-Accounts` (accounts-api, `master` branch — NOT pushed, per plan instructions):

1. **Task 1: buildLocality() pure helper + failing unit test (RED→GREEN)** - `f8874a5c` (feat)
2. **Task 2: Wire the two ST_Covers probes + attach locality at both return points** - `92f9ed51` (feat)
3. **Task 3: Expose locality on /candidates/search subset + subset-key smoke test (LOC-03)** - `76301dbe` (feat)

**Plan metadata:** committed separately in the essentials repo (this SUMMARY + STATE.md/ROADMAP.md), see final-commit step.

_Note: Task 1 was authored TDD-style (test file written alongside the implementation and run to green in one commit) rather than as separate RED-then-GREEN commits — buildLocality is a small pure function where the plan's own action step specified writing both together; all 8 test cases passed on first run with no red-phase iteration needed._

## Files Created/Modified
- `C:/EV-Accounts/backend/src/lib/essentialsService.ts` - Added `locality` field to `AddressSearchResult`, `PLACE_LOADED_STATES` const, `buildLocality()` helper, `placeQueryText`/`countyNameQueryText` probes wired into the shared `Promise.all`, `locality` attached at both `resolveOfficialsAtPoint` return points
- `C:/EV-Accounts/backend/src/routes/essentialsCandidates.ts` - Added `locality` (with safe default) to the `/candidates/search` subset response object
- `C:/EV-Accounts/backend/test/essentialsService-locality.test.ts` (NEW) - 13 tests: 8 behavior cases for `buildLocality`/`PLACE_LOADED_STATES`, 5 static-source assertions for the probe wiring
- `C:/EV-Accounts/backend/src/routes/essentialsCandidates.test.ts` (NEW) - 2 tests: subset-key smoke test + missing-locality default fallback
- `C:/EV-Accounts/backend/src/routes/essentialsCoordinateLookup.test.ts` - Updated the `makeAddressSearchResult` test fixture with the new required `locality` field (typecheck fix only; the route file itself, `essentialsCoordinateLookup.ts`, was NOT modified)

## Decisions Made
- **PLACE_LOADED_STATES hardcoded, not dynamic**: matches the planner's explicit decision in 216-01-PLAN.md — a per-request "any G4110 row" dynamic gate would false-positive Missouri's 1 incidental place row; the static 11-state list (with a comment citing the 216-CONTEXT.md ground-truth query) is simpler and matches the TIGER loader's own "adding a state is a code change, on purpose" philosophy.
- **county_name always unconditional**: never gated by PLACE_LOADED_STATES (D-03) — county boundaries are loaded nationwide and are safe to surface regardless of place-layer coverage.
- **essentialsCoordinateLookup.ts left untouched**: it does `res.json(result)` verbatim, so it inherits `locality` for free once `resolveOfficialsAtPoint` populates it — editing it would have been unnecessary scope creep.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Stubbed required env vars in the new unit test file so it can import the real essentialsService.ts module**
- **Found during:** Task 1
- **Issue:** `essentialsService.ts` imports `./db.js` → `./env.ts` at module load time, which `process.exit(1)`s if `SUPABASE_URL`/`SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY`/`DATABASE_URL`/`ADMIN_INGEST_TOKEN` aren't set. The pre-existing sibling test (`essentialsService-tribal-land.test.ts`) hits this same issue and has 1 failing test as a result — confirmed pre-existing (reproduced identically in a clean baseline `npm test` run captured before any 216-01 changes).
- **Fix:** Added `process.env.X ??= '...'` stubs at the top of `essentialsService-locality.test.ts`, before the `pg` mock and before importing the service. No real DB connection is ever attempted (pg's `Pool` class is fully mocked), so dummy values are safe.
- **Files modified:** `C:/EV-Accounts/backend/test/essentialsService-locality.test.ts`
- **Verification:** All 13 tests in the new file pass (`npx vitest run test/essentialsService-locality.test.ts` exits 0).
- **Committed in:** `f8874a5c` (Task 1 commit)

**2. [Rule 1 - Bug] Updated essentialsCoordinateLookup.test.ts's fixture for the new required `locality` field**
- **Found during:** Task 2
- **Issue:** Adding `locality` as a required (non-optional) field on `AddressSearchResult` broke `npx tsc --noEmit` — the pre-existing `makeAddressSearchResult` test fixture in `essentialsCoordinateLookup.test.ts` no longer satisfied the interface.
- **Fix:** Added `locality: { incorporated: null, place_name: null, county_name: null }` to the fixture. Route source file (`essentialsCoordinateLookup.ts`) itself was NOT touched.
- **Files modified:** `C:/EV-Accounts/backend/src/routes/essentialsCoordinateLookup.test.ts`
- **Verification:** `npx tsc --noEmit` exits 0; `essentialsCoordinateLookup.test.ts`'s own 5 tests still pass.
- **Committed in:** `92f9ed51` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking test-env fix, 1 blocking typecheck fix)
**Impact on plan:** Both necessary to satisfy the plan's own stated acceptance criteria (unit tests green, `tsc --noEmit` clean). No scope creep — no unrelated files touched.

## Issues Encountered

- **Full `npm test` (accounts-api backend) does not exit 0** — 9 test files / 21 tests fail, but all are pre-existing and unrelated to this plan's 3 changed/created source files. Confirmed by diffing a baseline `npm test` run (captured before any 216-01 changes) against the post-change run: failing-file count went from 10→9 and failing-test count from 29→21 (strictly better, zero new failures). The remaining failures are:
  - `test/essentialsService-tribal-land.test.ts` — same env-var-at-import-time issue as Task 1's deviation #1 above, on a file this plan did not touch (documented in `deferred-items.md`, out of scope per the scope-boundary rule).
  - `../tests/integration/treasury-cities.test.ts`, `../tests/architecture/coordinateLeakage.test.ts`, `../tests/integration/architecture.test.ts`, `../tests/integration/compass.test.ts`, `../tests/integration/ctcCivicSpaces.test.ts`, `../tests/integration/env-validation.test.ts`, `../tests/integration/gems.test.ts`, `test/arcgis-sources-coverage.test.ts` — pre-existing local-dev-environment failures (missing local Postgres credentials, missing external network access, etc.), confirmed unrelated to any file this plan touched.
  - This plan's own new/modified test files (`essentialsService-locality.test.ts`, `essentialsCandidates.test.ts`, `essentialsCoordinateLookup.test.ts`) all pass 100% (13 + 2 + 5 = 20 tests, 0 failures).
  - Logged to `.planning/phases/216-unincorporated-locality-label-show-unincorporated-county-whe/deferred-items.md`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Backend `locality` field is live in source (not yet deployed — 216-02 is the push-to-Render/live-smoke checkpoint plan per the plan's own explicit scope boundary).
- 216-03 (frontend threading) can proceed once 216-02 confirms the field is live on `accounts-api.empowered.vote`.
- Exact `PLACE_LOADED_STATES` list committed: `AZ, CA, IN, ME, MD, MA, NV, OR, TX, UT, VA` (11 states).
- Accounts-api commit SHAs (local `master`, NOT pushed): `f8874a5c`, `92f9ed51`, `76301dbe`.
- Confirmed: `essentialsCoordinateLookup.ts` was NOT modified (only its test fixture was, for a typecheck fix).

---
*Phase: 216-unincorporated-locality-label*
*Completed: 2026-07-22*

## Self-Check: PASSED

All 5 files (2 created + 3 modified in C:/EV-Accounts, plus this SUMMARY.md and deferred-items.md
in essentials) confirmed present on disk. All 3 accounts-api commit hashes (f8874a5c, 92f9ed51,
76301dbe) confirmed present in `git -C "C:/EV-Accounts" log`.
