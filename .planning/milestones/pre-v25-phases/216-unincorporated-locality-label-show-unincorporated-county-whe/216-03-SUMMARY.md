---
phase: 216-unincorporated-locality-label
plan: 03
subsystem: frontend
tags: [locality, banner, api-jsx, results-jsx, use-politician-data, pure-helper]

# Dependency graph
requires:
  - phase: 216-02
    provides: "accounts-api locality field LIVE in production (deployed commit b0842f57), verified against real Pima County/Tucson/Chicago fixtures on both address and coordinate entry paths"
provides:
  - "unincorporatedLabel() pure helper (src/lib/localityLabel.js) — the single place the 'Unincorporated {County}' rendering rule lives"
  - "locality threaded through both API entry points (searchPoliticians + lookupCoordinate) at source level"
  - "usePoliticianData exposes locality for address-mode consumers"
  - "Results.jsx renders 'Unincorporated {County}' in BOTH address mode (via incorporationInfo) and coordinate mode (via new coordLocality state), before any postal-city guess"
affects: [216-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dedicated coordinate-mode state (coordLocality) as a second data channel parallel to the address-mode hook, mirroring the existing browseResults/browseLoading pattern — required because usePoliticianData's `enabled` flag is always false for coordinate searches"
    - "Distinct local variable naming (incorporationInfo) when destructuring a hook field whose bare name would collide with a pre-existing page-level local (fromLocality/localityLabel from the browse_label URL param)"

key-files:
  created:
    - src/lib/localityLabel.js
    - src/lib/localityLabel.test.js
  modified:
    - src/lib/bannerProps.test.js
    - src/lib/api.jsx
    - src/lib/api.test.js
    - src/hooks/usePoliticianData.js
    - src/pages/Results.jsx

key-decisions:
  - "Coordinate mode's locality is NOT threaded through the hook (the hook is never enabled for coordinate searches) — a dedicated coordLocality useState populated inside resolveCoordinate() is the coordinate-mode parallel, exactly as RESEARCH Pitfall 1 flagged"
  - "The hook's locality field is destructured under the local name incorporationInfo in Results.jsx, not bare `locality`, to avoid colliding with the pre-existing fromLocality/localityLabel locals (ADR-0001, Pitfall 2)"
  - "tribal_land unwrap in lookupCoordinate() was explicitly NOT added — deferred per the 216-01 planner decision; only locality was added to avoid scope creep on this task"
  - "The unincorporatedLabel() check in both representingCity branches runs BEFORE the parseCityFromAddress fallback (address mode) and BEFORE the unconditional null return (coordinate mode) so the authoritative backend label always wins over a derived postal-city guess"

patterns-established: []

requirements-completed: [LOC-04]

coverage:
  - id: D1
    description: "unincorporatedLabel({incorporated:false, county_name:'Pima County'}) returns 'Unincorporated Pima County'; returns null for incorporated:true, incorporated:null, missing county_name, and null/undefined input"
    requirement: "LOC-04"
    verification:
      - kind: automated
        ref: "npx vitest run src/lib/localityLabel.test.js"
        status: pass
    human_judgment: false
  - id: D2
    description: "buildBannerProps('city', {representingCity:'Unincorporated Pima County', userState:'AZ'}) yields locationName 'Unincorporated Pima County, AZ' — no double state"
    requirement: "LOC-04"
    verification:
      - kind: automated
        ref: "npx vitest run src/lib/bannerProps.test.js"
        status: pass
    human_judgment: false
  - id: D3
    description: "searchPoliticians() and lookupCoordinate() both unwrap and return a locality key; lookupCoordinate does not gain a tribal_land unwrap (deferred, unchanged from baseline)"
    requirement: "LOC-04"
    verification:
      - kind: automated
        ref: "npx vitest run src/lib/api.test.js (17/17 pass, including two new LOC-04 lookupCoordinate cases); grep -c locality src/lib/api.jsx = 10"
        status: pass
    human_judgment: false
  - id: D4
    description: "usePoliticianData exposes locality (state decl + reset + set + return), mirroring tribalLand"
    requirement: "LOC-04"
    verification:
      - kind: automated
        ref: "grep -c locality src/hooks/usePoliticianData.js = 8 (state decl, reset, set, return, plus JSDoc lines)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Results.jsx wires coordLocality (state + resolveCoordinate set in both success/error branches) and unincorporatedLabel (coordinate branch + address branch, address branch textually before parseCityFromAddress fallback), destructuring the hook's locality as incorporationInfo (no bare `locality` local introduced)"
    requirement: "LOC-04"
    verification:
      - kind: automated
        ref: "grep -c coordLocality/unincorporatedLabel/incorporationInfo src/pages/Results.jsx = 3/3/3 each (>= 2-3 required); npm run build succeeds; full vitest suite 279/279 pass"
        status: pass
    human_judgment: false

# Metrics
duration: ~5min
completed: 2026-07-22
status: complete
---

# Phase 216 Plan 03: Frontend Locality Threading (LOC-04) Summary

**Threaded the live backend `locality` field through api.jsx (both entry points), usePoliticianData, and Results.jsx's representingCity resolution — via a new pure `unincorporatedLabel()` helper and a dedicated `coordLocality` state for the coordinate-only path — so unincorporated points now render "Unincorporated {County}, ST" in both address and coordinate search modes, instead of a misleading nearest-postal-city guess.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-07-22T23:40:14Z
- **Completed:** 2026-07-22T23:44:43Z
- **Tasks:** 3/3 completed
- **Files modified:** 7 (2 created, 5 modified)

## Accomplishments

- **`src/lib/localityLabel.js` (new):** pure `unincorporatedLabel(localityStatus)` helper — no React, no I/O, mirrors `bannerProps.js`'s testable-pure convention. Returns `Unincorporated ${county_name}` only when `incorporated === false && county_name`; returns `null` for `incorporated:true`, `incorporated:null`, missing `county_name`, or null/undefined input.
- **`src/lib/localityLabel.test.js` (new):** 6 cases covering every branch of the helper.
- **`src/lib/bannerProps.test.js`:** added a case confirming `buildBannerProps`'s existing state-dedup logic yields `'Unincorporated Pima County, AZ'` (no double state) for the new label shape.
- **`src/lib/api.jsx`:**
  - `searchPoliticians()`: unwraps `locality` from the `/candidates/search` subset response alongside the existing `tribal_land` unwrap.
  - `lookupCoordinate()`: unwraps `locality` from the coordinate response (`data.locality ?? null`, `null` on flat-array/error/no-body responses) — this function previously discarded everything but `politicians`/`matchedAddress`. Did **not** add a `tribal_land` unwrap here — that remains deferred per the 216-01 planner decision, kept out of scope for this task.
- **`src/hooks/usePoliticianData.js`:** added a `locality` state mirroring `tribalLand` — declared, reset to `null` at the start of each fetch, set from `result.locality || null` on success, and added to the hook's return object. JSDoc updated to document both `tribalLand` and `locality` return shapes.
- **`src/pages/Results.jsx`:**
  - Imports `unincorporatedLabel`.
  - New `coordLocality` state (parallel to `browseResults`/`browseLoading`) — the coordinate-mode data channel, since the hook's `enabled` flag is always `false` for coordinate searches (RESEARCH Pitfall 1).
  - Hook's `locality` destructured as `incorporationInfo` (NOT bare `locality`) to avoid colliding with the pre-existing `fromLocality`/`localityLabel` locals (the `from_locality`/`browse_label` URL-param derived variables already in this file — ADR-0001, Pitfall 2).
  - `resolveCoordinate()` now destructures `locality` from `lookupCoordinate()`'s return and calls `setCoordLocality(null)` in the error branch / `setCoordLocality(locality || null)` in the success branch.
  - `representingCity` `useMemo`: the `searchMode === 'coordinate'` branch now checks `unincorporatedLabel(coordLocality)` before its previous unconditional `return null`. The address-mode path checks `unincorporatedLabel(incorporationInfo)` immediately before the `parseCityFromAddress` postal-city fallback — so the authoritative backend label always wins. Both `incorporationInfo` and `coordLocality` added to the memo's dependency array. Browse mode is untouched.

## Task Commits

1. **Task 1: unincorporatedLabel() pure helper + bannerProps double-state test** — `ed21631e`
   - `src/lib/localityLabel.js`, `src/lib/localityLabel.test.js`, `src/lib/bannerProps.test.js`
2. **Task 2: Unwrap locality in api.jsx (both entry points) + surface in usePoliticianData** — `e25df8c9`
   - `src/lib/api.jsx`, `src/hooks/usePoliticianData.js`, `src/lib/api.test.js` (deviation fix, see below)
3. **Task 3: coordLocality state + representingCity branches in Results.jsx** — `0f39ca60`
   - `src/pages/Results.jsx`

## Files Created/Modified

- **Created:** `src/lib/localityLabel.js`, `src/lib/localityLabel.test.js`
- **Modified:** `src/lib/bannerProps.test.js`, `src/lib/api.jsx`, `src/lib/api.test.js`, `src/hooks/usePoliticianData.js`, `src/pages/Results.jsx`

## Decisions Made

- Coordinate mode's locality is deliberately NOT threaded through `usePoliticianData` — a dedicated `coordLocality` state populated inside `resolveCoordinate()` is the correct coordinate-mode parallel, since the hook is never `enabled` for coordinate searches.
- The hook's `locality` field is destructured as `incorporationInfo` in `Results.jsx` specifically to avoid colliding with the file's pre-existing `fromLocality`/`localityLabel` locals.
- `tribal_land` was intentionally NOT unwrapped in `lookupCoordinate()` — out of scope for LOC-04, deferred per 216-01.
- The `unincorporatedLabel()` check runs before the postal-city-guess fallback in address mode, and before the unconditional `null` in coordinate mode, so the authoritative backend flag always takes precedence.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Pre-existing `src/lib/api.test.js` lookupCoordinate assertions broke due to the new `locality` field**
- **Found during:** Task 2 verification (`npx vitest run src/lib/api.test.js`)
- **Issue:** Adding a `locality` key to every `lookupCoordinate()` return object caused 8 of the file's pre-existing `toEqual({...})` exact-shape assertions to fail (the new key wasn't in their expected objects).
- **Fix:** Updated all 8 affected assertions to include `locality: null` (matching the new no-locality-in-fixture behavior), and added two new LOC-04-specific cases: one asserting `locality` passthrough on a `{politicians, matchedAddress, locality}` success shape, and one asserting `locality` stays `null` on a flat-array success response (no locality field to unwrap).
- **Files modified:** `src/lib/api.test.js`
- **Commit:** `e25df8c9`

No other auto-fixes were needed — Tasks 1 and 3 executed exactly as planned.

**Total deviations:** 1 (test-assertion breakage caused directly by this task's own source change — in scope per the deviation rules' scope boundary, since it was caused by the edited function).

## Known Stubs

None. All new code paths are wired to real backend data (no hardcoded/placeholder values); the helper and its threading are fully exercised end-to-end at the source level.

## Threat Flags

None. This plan's changes stay within the threat model already registered in 216-03-PLAN.md (T-216-07/08/09) — no new network endpoints, auth paths, or schema changes were introduced; only client-side rendering of an already-live, already-approved backend field.

## Verification

- `npm run build` — succeeds (no new warnings beyond the pre-existing chunk-size notice).
- `npx vitest run` (full suite) — **279/279 tests pass** across 15 test files, including:
  - `src/lib/localityLabel.test.js` — 6/6 pass
  - `src/lib/bannerProps.test.js` — 7/7 pass (including the new double-state case)
  - `src/lib/api.test.js` — 17/17 pass (including 2 new LOC-04 cases + 8 fixed pre-existing assertions)
- Read-back confirmed: `coordLocality` set in `resolveCoordinate` (both branches); both `representingCity` branches call `unincorporatedLabel`; no bare `locality` local introduced in `Results.jsx` (destructured as `incorporationInfo`).
- Acceptance-criteria greps: `unincorporatedLabel` export count = 1; `coordLocality`/`unincorporatedLabel`/`incorporationInfo` each appear 3x in `Results.jsx`; `locality` appears 10x in `api.jsx` and 8x in `usePoliticianData.js`.

## Issues Encountered

None beyond the documented test-assertion deviation above.

## User Setup Required

None — no external service configuration required. No deploy/push performed in this plan (216-04 handles deployment).

## Next Phase Readiness

- LOC-04 satisfied at source level: `locality` threads through `api.jsx` (both entry points) → hook (address mode) + `coordLocality` (coordinate mode) → `representingCity` → `buildBannerProps`, rendering `"Unincorporated {County}, ST"` for both search modes.
- The naming-collision pitfall (bare `locality` vs. pre-existing `fromLocality`/`localityLabel`) and the coordinate-mode-parallel-state pitfall (hook never enabled for coordinate searches) are both handled per the RESEARCH document's flagged risks.
- No deploy/push was performed — this plan's scope is source-level threading only. **216-04 (deployment + live end-to-end verification of both address and coordinate modes against the real Pima County AZ / Tucson AZ / Chicago IL fixtures) may now begin.**

---
*Phase: 216-unincorporated-locality-label*
*Completed: 2026-07-22*

## Self-Check: PASSED

Created files confirmed on disk: `src/lib/localityLabel.js`, `src/lib/localityLabel.test.js`, this SUMMARY. All 3 task commits (`ed21631e`, `e25df8c9`, `0f39ca60`) confirmed present via `git log --oneline --all`. Full test suite (`npx vitest run`) 279/279 pass; `npm run build` succeeds.
