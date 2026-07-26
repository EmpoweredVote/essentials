---
phase: 212-backend-place-name-resolver-national-fallback
plan: 06
subsystem: api
tags: [express, postgres, pg_trgm, lateral-join, resolve-endpoint]

# Dependency graph
requires:
  - phase: 212-04
    provides: locationSearchService.ts::searchPlaceNames resolver
  - phase: 212-05
    provides: essentialsLocationSearch.ts routes (GET / and GET /resolve) + live smoke test findings
provides:
  - "pickHouseRep() — pure, unit-tested selection of the actual NATIONAL_LOWER US House member from getPoliticiansByArea's overlap set, replacing the buggy [0] pick"
  - "Curated-government null-geo_id resolution via a LATERAL chambers->offices->districts lookup (G4110/G4020), fixing unresolvable + duplicate candidates"
affects: [213-address-lookup, 214-frontend-combobox]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure selection helpers extracted from route handlers for unit-testability without a DB (pickHouseRep)"
    - "LATERAL join with LIMIT 1 to deterministically resolve a one-to-many relationship (government -> multiple offices sharing one place geo_id) without reintroducing row fan-out"

key-files:
  created:
    - C:/EV-Accounts/backend/src/routes/essentialsLocationSearch.test.ts
  modified:
    - C:/EV-Accounts/backend/src/routes/essentialsLocationSearch.ts
    - C:/EV-Accounts/backend/src/lib/locationSearchService.ts
    - C:/EV-Accounts/backend/src/lib/locationSearchService.test.ts

key-decisions:
  - "FIX 1 selects the House rep by filtering getPoliticiansByArea's results on district_type==='NATIONAL_LOWER' AND geo_id===cdGeoId, rather than trusting array order (which is only ORDER BY p.id)"
  - "FIX 2 resolves a curated government's real geo_id via LATERAL ... LIMIT 1 over chambers->offices->districts filtered to mtfcc IN ('G4110','G4020'), only when governments.geo_id IS NULL — never overrides an existing geo_id"
  - "Governments with no linked G4110/G4020 district still resolve to geo_id:null (honest omission, not a fabricated id) — noted as a residual gap, not fixed here"

requirements-completed: [RSLV-01, RSLV-04, RSLV-05, RSLV-06, RSLV-07]

# Metrics
duration: 45min
completed: 2026-07-20
---

# Phase 212 Plan 06: Gap-Closure — Resolver House-Rep Selection + Curated Null-Geo_id Dedupe Summary

**Fixed two live-smoke-test defects in the Phase 212 place-name resolver: `/resolve` now returns the actual NATIONAL_LOWER US House member (not an arbitrary overlapping local/state official), and curated governments with `geo_id IS NULL` now resolve their real place geo_id via a LATERAL district lookup, eliminating unresolvable + duplicate candidates.**

## Performance

- **Duration:** 45 min
- **Started:** 2026-07-20T18:00:00-07:00 (approx)
- **Completed:** 2026-07-20T18:45:00-07:00
- **Tasks:** 1 (single combined gap-closure commit; both fixes are small, tightly-scoped code changes plus tests)
- **Files modified:** 3 modified, 1 created

## Accomplishments

- **FIX 1 (D-01 defect):** `GET /api/essentials/location-search/resolve` no longer returns `houseReps[0]` (an arbitrary district ordered only by `p.id` — observed live returning a MA state house rep for a MA CD, and a Marana city councilor for an AZ CD). Added `pickHouseRep(records, cdGeoId)`, an exported pure function that selects the record whose `district_type === 'NATIONAL_LOWER'` and `geo_id === cdGeoId` (the MTFCC_DISTRICT_TYPE_GUARD pairing for `'G5200'`), returning `null` (never a wrong pick) if no such record exists.
- **FIX 2 (curated null-geo_id defect):** `locationSearchService.ts`'s curated CTE now resolves a government's real place-level `geo_id`/`mtfcc` via `COALESCE(g.geo_id, place_district.district_geo_id)`, where `place_district` is a `LEFT JOIN LATERAL ... LIMIT 1` over `chambers -> offices -> districts` filtered to `d.mtfcc IN ('G4110', 'G4020')`, firing only when `g.geo_id IS NULL`. This makes the 204 previously-unresolvable curated governments (e.g. "City of Bloomington, Indiana, US") resolvable and lets the existing `DISTINCT ON (geo_id) ... ORDER BY geo_id, source_boost DESC` dedupe collapse them with their gazetteer/geofence twin into one candidate.
- Both fixes shipped with tests: a new route test file (`essentialsLocationSearch.test.ts`, 10 tests covering `pickHouseRep` directly plus full `/resolve` route behavior via supertest) and extended `locationSearchService.test.ts` (2 new functional/source-guard tests: a null-geo_id Bloomington fixture resolving to a single deduped candidate, plus source-guard regexes confirming the LATERAL/COALESCE SQL shape).
- `npm run build` (tsc) clean; full backend unit suite green (316 tests across 25 files, including the 3 touched by this plan).

## Task Commits

Single combined commit (both fixes are small and share the same gap-closure scope — no meaningful benefit to splitting into separate task commits for a 2-fix gap-closure plan):

1. **FIX 1 + FIX 2 + tests** - `334839d2` (fix) — "fix(212-06): correct /resolve House-rep selection + curated null-geo_id dedupe"

No plan-metadata commit in EV-Accounts (code repo) — per the orchestrator contract, code stays local/uncommitted-to-remote; this SUMMARY (committed in the essentials/planning repo) is the plan-completion record.

## Files Created/Modified

- `C:/EV-Accounts/backend/src/routes/essentialsLocationSearch.ts` - Added exported `pickHouseRep()` helper; `/resolve` now calls it instead of `houseReps[0]`.
- `C:/EV-Accounts/backend/src/routes/essentialsLocationSearch.test.ts` - **New.** 10 tests: 4 direct `pickHouseRep` unit tests (correct pick, null-when-no-match, empty array, explicit regression-vs-`[0]` case) + 3 validation tests + 3 `/resolve` route tests (correct rep returned, null when `needsExactAddress`, null honest-omission when no NATIONAL_LOWER record exists).
- `C:/EV-Accounts/backend/src/lib/locationSearchService.ts` - Curated CTE's `FROM`/`SELECT` clauses updated to resolve `geo_id`/`mtfcc` via the new `place_district` LATERAL join when `governments.geo_id IS NULL`; doc comment updated.
- `C:/EV-Accounts/backend/src/lib/locationSearchService.test.ts` - Added a null-geo_id Bloomington fixture test (single deduped candidate, `has_local_data:true`, resolved `geo_id`) and 2 source-guard tests confirming the LATERAL/COALESCE SQL shape and the `governments.geo_id IS NULL` gating condition.

## Decisions Made

- **pickHouseRep as a standalone exported pure function** (rather than inlining the `.find()` in the route handler) — makes the D-01 selection logic directly unit-testable without spinning up Express/supertest for every case, and gives a single, greppable place documenting the historical `[0]` bug for future maintainers.
- **LATERAL ... LIMIT 1 (not a plain JOIN)** for the curated null-geo_id resolution — a government can link to multiple offices/districts that all legitimately share the same place geo_id (Bloomington's Mayor/Clerk/At-Large offices all carry `geo_id 1805860`); a plain JOIN would reintroduce the exact row-fan-out the existing `DISTINCT ON (g.id)` guard was written to prevent. LATERAL + `LIMIT 1` picks one deterministically without needing a second dedupe pass.
- **Gating the LATERAL join on `g.geo_id IS NULL`** rather than always resolving via the district table — governments that already carry their own `geo_id` keep using it directly (unchanged behavior, zero risk of the fallback path silently overriding a correct value).
- **Residual gap left undone (by design):** governments with no linked G4110/G4020 district (no chamber/office/district row at all) still resolve to `geo_id: null`. This is the honest/correct behavior per the original diagnosis ("better than a wrong id") — not fixed here, and not in scope for this gap-closure plan.

## Deviations from Plan

None - plan executed exactly as written (both fixes matched the diagnosis's prescribed code shape; `PoliticianFlatRecord` was confirmed via direct read to already expose `district_type` and `geo_id` as documented, so no field-name adjustment was needed).

## Issues Encountered

- Initial route-test approach used `vi.importActual` to partially mock `locationSearchService.js` while overriding only `searchPlaceNames` — this pulled in the real module's `./db.js` import, which validates `DATABASE_URL`/`SUPABASE_*` env vars at import time and calls `process.exit(1)` when absent (as in this unit-test environment), crashing the whole test file. Fixed by fully mocking the module (both `searchPlaceNames` and a locally-declared `LocationSearchQueryTooShortError` class inside the `vi.mock` factory, per Vitest's hoisting rules) instead of partially mocking via `importActual`. No production code was affected; this was purely a test-harness fix.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both live-smoke-test defects from Phase 212's `/resolve` and curated candidate paths are fixed and locally committed in `C:/EV-Accounts` (commit `334839d2`, NOT pushed — orchestrator will push and re-run the live smoke test).
- `npm run build` clean; full unit suite green (316/316).
- Residual, out-of-scope gap: curated governments with genuinely no linked G4110/G4020 district still return `geo_id: null` — this is honest/expected, not a defect, but worth re-confirming against the live DB during the orchestrator's re-smoke to make sure the 204-government null-geo_id count drops as expected (most, not all, should now resolve).
- No STATE.md/ROADMAP.md changes made by this plan (per its scope).
