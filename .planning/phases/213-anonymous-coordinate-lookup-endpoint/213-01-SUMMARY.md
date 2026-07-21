---
phase: 213-anonymous-coordinate-lookup-endpoint
plan: 01
subsystem: api
tags: [postgis, st_covers, express, typescript, coordinate-validation, accounts-api]

# Dependency graph
requires:
  - phase: 212-backend-place-name-resolver-national-fallback
    provides: getStatewideOfficials / getFederalOfficials / getPoliticiansByArea / pickHouseRep precedent, FIPS_TO_ABBREV
provides:
  - "coordinateValidation.ts — classifyCoordinate pure function + US_BBOX constant (422 taxonomy: OUTSIDE_US_BOUNDS / SWAPPED_COORDINATES / INVALID_COORDINATES)"
  - "getRepresentativesByCoordinate(lat, lng) exported from essentialsService.ts — geocode-free ST_Covers resolution reusing the AddressSearchResult shape"
  - "resolveOfficialsAtPoint private shared core extracted from getRepresentativesByAddress"
affects: [213-02 (route wiring), 213-03 (live smoke test), 214 (frontend combobox consumes getRepresentativesByCoordinate via the future route)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure classification function (no DB/HTTP) for privacy-critical input validation, exhaustively unit-tested"
    - "Shared point-resolution core extracted so both a geocoded address AND a raw coordinate resolve officials through the same ST_Covers query, never duplicating SQL"
    - "State derivation without geocoding: prefer a covering NATIONAL_LOWER/COUNTY district row, fall back to the raw G4000 state-boundary TIGER layer"

key-files:
  created:
    - C:/EV-Accounts/backend/src/lib/coordinateValidation.ts
    - C:/EV-Accounts/backend/src/lib/coordinateValidation.test.ts
  modified:
    - C:/EV-Accounts/backend/src/lib/essentialsService.ts

key-decisions:
  - "US_BBOX = lat [17.5, 72.0] x lng ([-180,-64] union [172,180] Aleutian sliver) — covers 50 states + DC + PR/USVI; Guam/American Samoa/CNMI intentionally excluded (no seeded data there)"
  - "Malformed-input guard checks only Number.isFinite + Math.abs(...) > 180 (not per-axis lat in [-90,90]) so a swapped coordinate falls through to the swap-guard branch instead of being misclassified as INVALID_COORDINATES"
  - "resolveOfficialsAtPoint extracted as a private (non-exported) shared core — getRepresentativesByAddress and getRepresentativesByCoordinate both call it; getRepresentativesByAddress's own behavior is unchanged (still geocodes first)"
  - "State-scoped floor (getStatewideOfficials) only invoked as a fallback when the shared core returns zero state-scoped district rows — avoids a redundant round-trip in the normal seeded case"
  - "pickHouseRep inlined directly in essentialsService.ts (duplicated from routes/essentialsLocationSearch.ts) rather than imported, to keep lib/ -> routes/ a one-way dependency"
  - "getFederalOfficials() is never imported or called on the coordinate path — the nationwide House/Senate roster must never appear in a single-point response"

patterns-established:
  - "classifyCoordinate 4-step evaluation order (finite/magnitude check -> in-box -> swapped-in-box -> out-of-box) is the canonical pattern for any future swap-guarded coordinate input"

requirements-completed: [RSLV-03]

# Metrics
duration: 12min
completed: 2026-07-21
---

# Phase 213 Plan 01: Coordinate Validation + No-Geocode Service Core Summary

**US-bbox + swap-guard `classifyCoordinate` (with Aleutian-antimeridian support) plus a geocode-free `getRepresentativesByCoordinate` that reuses the existing `ST_Covers` politician query and Phase 212 state-scoped floor.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-07-21T07:16:43Z
- **Completed:** 2026-07-21T07:28:26Z
- **Tasks:** 2 completed
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments
- `coordinateValidation.ts` exports `US_BBOX`, `CoordinateRejectionCode`, and `classifyCoordinate(lat, lng)` — a pure, DB-free, HTTP-free function distinguishing valid / `OUTSIDE_US_BOUNDS` / `SWAPPED_COORDINATES` / `INVALID_COORDINATES`, with the ordering fix so a swapped US coordinate (e.g. `(-93.0, 45.0)`) is never shadowed by the malformed-input guard.
- 12/12 unit tests green, including the Aleutian antimeridian point (`(52.9, 173.1)`, positive longitude) and the explicit swapped-Minneapolis regression assertion.
- `getRepresentativesByAddress` was refactored (behavior-preserving) to delegate its `ST_Covers` district/statewide/tribal query core to a new private `resolveOfficialsAtPoint` helper.
- New exported `getRepresentativesByCoordinate(lat, lng)` in `essentialsService.ts`: derives the covering state without a Census geocode, runs the same shared core, applies the state-scoped floor only as a genuine fallback, derives the exact single US House rep from the point's own congressional-district coverage (never merges the nationwide federal roster), and always returns an empty `matchedAddress` with no raw coordinate anywhere in the response.

## Task Commits

Each task was committed atomically (TDD gate sequence for Task 1):

1. **Task 1 (RED): failing coordinateValidation tests** - `5120214c` (test) — EV-Accounts repo
2. **Task 1 (GREEN): classifyCoordinate implementation** - `8b7fe341` (feat) — EV-Accounts repo
3. **Task 2: getRepresentativesByCoordinate + shared core extraction** - `a1ab5738` (feat) — EV-Accounts repo

_All three commits are in `C:/EV-Accounts` (accounts-api backend repo), not the essentials/GSD planning repo._

## Files Created/Modified
- `C:/EV-Accounts/backend/src/lib/coordinateValidation.ts` - `US_BBOX` constant + `classifyCoordinate` pure function; standalone, no DB/HTTP/service imports
- `C:/EV-Accounts/backend/src/lib/coordinateValidation.test.ts` - 12-case unit test matrix (bbox membership, Aleutian antimeridian, swap guard, malformed input)
- `C:/EV-Accounts/backend/src/lib/essentialsService.ts` - extracted `resolveOfficialsAtPoint` shared core; added `getRepresentativesByCoordinate`, `deriveStateAbbrevForPoint`, `findCoveringCdGeoId`, inlined `pickHouseRep`, `STATEWIDE_DISTRICT_TYPES`; imports `FIPS_TO_ABBREV`/`getStatewideOfficials`/`getPoliticiansByArea` from `essentialsBrowseService.js`

## Decisions Made
- See `key-decisions` in frontmatter above. Notably: the malformed-input guard was deliberately narrowed to only reject non-finite or `Math.abs(...) > 180` values (not a strict `[-90,90]` per-axis latitude check), because a genuinely swapped US coordinate legitimately carries a "latitude" slot outside that range and must reach the swap-guard branch — this was the specific blocker fix called out in the plan.
- The circular-import concern between `essentialsService.ts` (importing runtime functions from `essentialsBrowseService.ts`) and `essentialsBrowseService.ts` (importing `PoliticianFlatRecord`/`FinanceSummary` **types only** from `essentialsService.ts`) was verified safe: `import type` is erased at compile time, so there is no runtime cycle. Confirmed via `tsc --noEmit` (clean) and running both files' test suites together (36/36 pass).

## Deviations from Plan

None — plan executed exactly as written. The two footgun-order comments (`ST_MakePoint($1, $2)`) on the new `deriveStateAbbrevForPoint`/`findCoveringCdGeoId` helper queries were added inline during implementation to satisfy the plan's explicit acceptance criterion ("order-footgun comment present on the new path"), which is within the task's own `<action>` instructions, not an out-of-scope addition.

One wording adjustment was made to a doc comment in `coordinateValidation.ts` (replacing the literal strings "essentialsService"/"geocode" with equivalent prose) purely to satisfy the plan's own standalone-module grep acceptance check (`grep -v '^\s*//' ... | grep -c "geocode|essentialsService"` must be 0) — the JSDoc block-comment lines use `/** ... */` with `*`-prefixed continuation lines rather than `//`, so the original wording (which was semantically correct) tripped the literal-string grep. No behavior change.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required. No route, no HTTP surface, no new environment variables — this plan is lib-only per its objective ("zero HTTP surface yet").

## Requirements Note

`RSLV-03` is listed in all three plans' frontmatter (213-01/02/03) — it is the phase-level
requirement this multi-plan sequence collectively satisfies (lib core -> route -> live smoke
test), not something Plan 01 alone completes (this plan ships zero HTTP surface by design).
REQUIREMENTS.md traceability was left as "Pending" for RSLV-03 after this plan; it should be
checked off only once the actual endpoint exists and is smoke-tested (213-03).

## Next Phase Readiness

- `classifyCoordinate` and `getRepresentativesByCoordinate` are both fully unit-tested/typechecked and ready for Plan 02 to wire into a `POST /api/essentials/coordinate-lookup` route (per D-01), including the 422 validation-code mapping and any rate-limiting (Claude's discretion per 213-CONTEXT.md).
- Plan 02 should reuse `CoordinateRejectionCode` values verbatim in its JSON error envelope (`OUTSIDE_US_BOUNDS` / `SWAPPED_COORDINATES` / `INVALID_COORDINATES`) to mirror the D-07 requirement.
- No blockers. Both `npx vitest run src/lib/coordinateValidation.test.ts` and `npx tsc --noEmit` are green in the backend; `getRepresentativesByCoordinate` has not yet been exercised against a live DB (no route/HTTP path exists yet in this plan) — Plan 03's live smoke test is the first end-to-end verification against real geofence data.

## TDD Gate Compliance

Task 1 followed the RED -> GREEN gate sequence: `5120214c` (test, RED — failing tests confirmed via `npx vitest run`) followed by `8b7fe341` (feat, GREEN — all 12 tests passing). No REFACTOR commit was needed (implementation required no cleanup pass beyond the one wording fix folded into the GREEN commit).

## Self-Check: PASSED

- FOUND: `backend/src/lib/coordinateValidation.ts`
- FOUND: `backend/src/lib/coordinateValidation.test.ts`
- FOUND: `export async function getRepresentativesByCoordinate` in `backend/src/lib/essentialsService.ts`
- FOUND: commit `5120214c` (RED)
- FOUND: commit `8b7fe341` (GREEN)
- FOUND: commit `a1ab5738` (Task 2)

---
*Phase: 213-anonymous-coordinate-lookup-endpoint*
*Completed: 2026-07-21*
