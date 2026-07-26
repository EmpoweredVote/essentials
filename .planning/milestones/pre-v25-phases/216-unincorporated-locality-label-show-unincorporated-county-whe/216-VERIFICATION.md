---
phase: 216-unincorporated-locality-label
verified: 2026-07-22T00:00:00Z
status: passed
score: 4/4 must-haves verified
---

# Phase 216 Verification — Unincorporated Locality Label

## Goal

When a searched point (address OR anonymous coordinate) falls outside any incorporated place but
within a county, the results-page locality banner reads "Unincorporated {County}, {ST}" (e.g.
"Unincorporated Pima County, AZ") — gated to place-loaded states so a place-less-looking city in
an un-loaded state never false-positives.

## Observable Truths

| # | Truth | Verified | Evidence |
|---|-------|----------|----------|
| 1 | Backend runs a place probe (`ST_Covers`, `mtfcc IN ('G4110','G4120')`) and a county probe (`mtfcc='G4020'`) in `resolveOfficialsAtPoint`, attaching `locality` at both return points, mirroring `tribal_land` | ✅ | `essentialsService.ts:806-863` — `tribalQueryText`, `placeQueryText`, `countyNameQueryText` are three parallel, structurally-identical `ST_Covers` probes run together in one `Promise.all` (line 847-853). `locality` is computed once (line 862) and attached at the early-return object (line 875) and the normal-return object (line 944), exactly mirroring how `tribal_land` is attached at both points. |
| 2 | `incorporated` is `true`/`false` only in the 11 place-loaded states (AZ,CA,IN,ME,MD,MA,NV,OR,TX,UT,VA — MO excluded); elsewhere `null`. `county_name` always populated | ✅ | `PLACE_LOADED_STATES` (line 633-635) is exactly `new Set(['AZ','CA','IN','ME','MD','MA','NV','OR','TX','UT','VA'])` — 11 entries, MO absent. `buildLocality()` (line 648-664): returns `{incorporated:null,...}` when state is falsy or not in the set (still populating `county_name` unconditionally from `countyRow`, per D-03); returns `incorporated:true/false` only inside the gate. |
| 3 | `locality` added to `/candidates/search` explicit subset object; inherited verbatim by the coordinate route | ✅ | `essentialsCandidates.ts:118` adds `locality: result.locality ?? {...}` to the explicit response object alongside `politicians`/`tribal_land`/`county`/`jurisdiction`. `essentialsCoordinateLookup.ts:78-79` calls `getRepresentativesByCoordinate` and does `res.status(200).json(result)` — full-object passthrough, no field-level construction — so it inherits `locality` automatically. Confirmed the route file was not touched for this phase (per 216-01-SUMMARY's explicit statement and the file's own content, which has no `locality`-specific code). |
| 4 | Frontend threads `locality`: `api.jsx` unwraps on both entry points, `usePoliticianData` surfaces it, `Results.jsx` `representingCity` returns "Unincorporated {county}" for `incorporated===false` in both address mode (via hook) and coordinate mode (via `coordLocality` state), suppressed when null | ✅ | `src/lib/localityLabel.js` — pure `unincorporatedLabel()`, returns label only when `incorporated===false && county_name` truthy, else `null`. `src/lib/api.jsx:116-122` (search) and `:548-556` (coordinate) both unwrap `locality`. `src/hooks/usePoliticianData.js:44,48,92-94,116` mirrors `tribalLand`'s state/reset/set/return shape for `locality`. `src/pages/Results.jsx`: `coordLocality` state (line 407) set in `resolveCoordinate` (line 1056-1069); `representingCity` memo checks `unincorporatedLabel(coordLocality)` in the coordinate branch (line 1174-1176) and `unincorporatedLabel(incorporationInfo)` in address mode (line 1204-1205) — placed textually **before** the `parseCityFromAddress` postal-city fallback (line 1208), so the authoritative backend flag wins. Browse mode untouched. |
| 5 (evidence) | Live production evidence: backend smoke (216-02) + frontend UAT (216-04), operator-signed | ✅ | 216-02-SUMMARY.md: 3 fixtures (unincorporated Pima Co. AZ / incorporated Tucson AZ / un-loaded-state Chicago IL) × 2 entry paths, zero DB-write delta (84479/82869/6871 row counts unchanged), no coordinate echo, deployed commit `b0842f57` confirmed present in `C:/EV-Accounts` git log. 216-04-SUMMARY.md: 5 live UAT checks (address-unincorporated, coordinate-unincorporated, Tucson control, Chicago control, regression sweep) all passed, deployed commit `95dda22f` confirmed present in essentials git log. Both SHAs independently re-verified in this pass (`git log -1 <sha>` in each repo). Operator typed "approved" on both checkpoints per the SUMMARYs. |

## Required Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| `buildLocality` + `PLACE_LOADED_STATES` | `C:/EV-Accounts/backend/src/lib/essentialsService.ts` | Present, correct (11-state set, MO excluded, 3-state gate logic) |
| Place/county `ST_Covers` probes wired into shared core | `C:/EV-Accounts/backend/src/lib/essentialsService.ts` (`resolveOfficialsAtPoint`) | Present, attached at both return points |
| `locality` in `/candidates/search` subset | `C:/EV-Accounts/backend/src/routes/essentialsCandidates.ts` | Present (line 118) |
| Coordinate route unmodified (passthrough) | `C:/EV-Accounts/backend/src/routes/essentialsCoordinateLookup.ts` | Confirmed — no locality-specific code; full-object `res.json(result)` |
| `unincorporatedLabel()` pure helper | `src/lib/localityLabel.js` | Present, correct branch logic |
| `locality` unwrap (both entry points) | `src/lib/api.jsx` | Present (`searchPoliticians`, `lookupCoordinate`) |
| `locality` surfaced | `src/hooks/usePoliticianData.js` | Present, mirrors `tribalLand` |
| `representingCity` branches (address + coordinate) | `src/pages/Results.jsx` | Present, correctly ordered before postal-city fallback |
| Backend unit tests | `C:/EV-Accounts/backend/test/essentialsService-locality.test.ts`, `essentialsCandidates.test.ts` | Per 216-01-SUMMARY: 13 + 2 tests, all passing |
| Frontend unit tests | `src/lib/localityLabel.test.js`, `src/lib/bannerProps.test.js`, `src/lib/api.test.js` | Per 216-03/04-SUMMARY: full suite 279/279 passing |

## Requirements Coverage

| Requirement | Status | Notes |
|---|---|---|
| LOC-01 | Complete | Place + county `ST_Covers` probes verified in source, mirror `tribal_land` precedent exactly (same SRID/`ST_Covers` shape, same `Promise.all`, same dual-attach-point pattern). |
| LOC-02 | Complete | `PLACE_LOADED_STATES` set verified to be exactly `{AZ,CA,IN,ME,MD,MA,NV,OR,TX,UT,VA}` (11 states); MO confirmed absent. `county_name` confirmed unconditional in `buildLocality`. |
| LOC-03 | Complete | `locality` confirmed present in the explicit `/candidates/search` subset object; `essentialsCoordinateLookup.ts` confirmed unmodified (full-object passthrough). |
| LOC-04 | Complete | Full thread confirmed: `api.jsx` → `usePoliticianData`/`coordLocality` → `representingCity` → `buildBannerProps`. Ordering (unincorporated check before postal-city fallback) confirmed correct in both modes. |

`REQUIREMENTS.md` traceability table already marks LOC-01 through LOC-04 as Complete against Phase 216 — consistent with this independent verification.

## Anti-Patterns Checked

- **No stubs/placeholders**: `buildLocality`, the two new `ST_Covers` probes, and `unincorporatedLabel` are all real implementations with real logic — no hardcoded return values, no `TODO`/`FIXME` markers found in the changed regions.
- **No silent scope creep**: `essentialsCoordinateLookup.ts` was confirmed genuinely untouched (its only phase-216-related file is its test fixture, updated solely for a TypeScript type-check fix per 216-01-SUMMARY, not behavior).
- **No accidental gate bypass**: `county_name` is deliberately computed *before* and independent of the state-gate `if`, matching D-03's "county is always safe" decision — confirmed by reading the actual `buildLocality` body, not just the comment.
- **No naming collision**: `Results.jsx` destructures the hook's `locality` field as `incorporationInfo`, avoiding collision with the pre-existing `fromLocality`/`localityLabel` locals from the `browse_label` URL param — confirmed via grep, no bare `locality` local exists in the file.
- **No double-state / formatting regression**: 216-03-SUMMARY documents a `bannerProps.test.js` case asserting `"Unincorporated Pima County, AZ"` with no double state; not independently re-run in this pass but the underlying `buildBannerProps` dedup logic is pre-existing and unmodified by this phase.

## Human Verification

All items requiring human judgment were already completed and operator-signed during phase execution (per the phase's "backend-before-frontend" live-gate convention, consistent with project memory `v240_reset_recovery` and other v24.0 phases):

- **216-02 Task 3 checkpoint**: live backend smoke (3 fixtures × 2 paths + zero-write delta) — operator approved 2026-07-22.
- **216-04 Task 2 checkpoint**: live frontend UAT (5 checks spanning both search modes + 2 controls + regression sweep) — operator approved 2026-07-22.

No further human verification is required for this phase; the runtime-behavior truths (Observable Truth #5) are treated as already-verified live evidence per the verification brief's explicit instruction.

## Gaps Summary

None found. All 4 requirement IDs (LOC-01 through LOC-04) are backed by real, correctly-ordered, correctly-gated source code in both repos, and the runtime behavior is independently confirmed by operator-signed live production evidence (backend commit `b0842f57`, frontend commit `95dda22f`, both re-confirmed present in git history during this verification pass).

## Verification Metadata

- **Method**: Direct source read of all 6 named files across both repos (`essentialsService.ts`, `essentialsCandidates.ts`, `essentialsCoordinateLookup.ts`, `api.jsx`, `usePoliticianData.js`, `Results.jsx`, `localityLabel.js`), plus `PLACE_LOADED_STATES` set-membership check, `buildLocality` branch-by-branch read, cross-reference of all 4 SUMMARY.md files against actual code (not trusted at face value), and independent `git log -1 <sha>` re-verification of both deployed commits in their respective repos.
- **Not independently re-executed**: unit test suites (backend 13+2 tests, frontend 279 tests) and the live curl/UAT sessions — these are treated as valid per-plan evidence per the verification brief, since they were operator-approved against production on 2026-07-22 (same day).
- **Files read**: `.planning/phases/216-.../216-CONTEXT.md`, `216-01..04-SUMMARY.md`, `REQUIREMENTS.md`, `C:/EV-Accounts/backend/src/lib/essentialsService.ts` (lines 1-1267), `C:/EV-Accounts/backend/src/routes/essentialsCandidates.ts`, `C:/EV-Accounts/backend/src/routes/essentialsCoordinateLookup.ts`, `src/lib/localityLabel.js`, `src/lib/api.jsx`, `src/hooks/usePoliticianData.js`, `src/pages/Results.jsx`.
