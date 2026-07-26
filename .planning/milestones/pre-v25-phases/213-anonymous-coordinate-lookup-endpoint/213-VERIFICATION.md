---
phase: 213-anonymous-coordinate-lookup-endpoint
verified: 2026-07-21T00:00:00Z
status: passed
score: 3/3 must-haves verified
overrides_applied: 0
---

# Phase 213: Anonymous Coordinate Lookup Endpoint Verification Report

**Phase Goal:** Anyone can submit raw decimal coordinates and get back officials for that point with zero authentication, zero persistence, and no privacy exposure.
**Verified:** 2026-07-21
**Status:** passed
**Re-verification:** No — initial verification

**CRITICAL NOTE ON REPO LOCATION:** All implementation code for this phase lives in the separate `C:/EV-Accounts` git repository (accounts-api Express backend), NOT in this `essentials` planning repo. All code-level checks below were run directly against `C:/EV-Accounts/backend/src/...`.

## Goal Achievement

### Observable Truths (Roadmap Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Posting a valid US decimal lat/lng returns officials via PostGIS `ST_Covers`, no auth required, no rows written | VERIFIED | Live curl `POST https://accounts-api.empowered.vote/api/essentials/coordinate-lookup` with `{"lat":39.17,"lng":-86.52}` and **no Authorization header** returned `200` with 138 politicians (exactly 1 `NATIONAL_LOWER`, 4 `NATIONAL_UPPER`, 21 `STATE_EXEC`, etc.). `resolveOfficialsAtPoint`/`getRepresentativesByCoordinate`/`deriveStateAbbrevForPoint`/`findCoveringCdGeoId` (lines 612-1080 of `essentialsService.ts`) contain zero `INSERT`/`UPDATE`/`DELETE` statements (grep-verified) — SELECT-only. `optionalAuth` middleware (`middleware/auth.ts:102-110`) proceeds unauthenticated when no Bearer token is present — confirmed both by source read and by the live 200/422 responses returned with zero auth headers sent. |
| 2 | Coordinates outside US bbox or lat/lng-swapped are rejected with a clear, specific error — never silently queried as valid | VERIFIED | Live curl confirms all three distinct 422 codes: swapped `{lat:-86.52,lng:39.17}` → `422 SWAPPED_COORDINATES`; London `{lat:51.5,lng:-0.12}` → `422 OUTSIDE_US_BOUNDS`; malformed `{lat:"abc"}` → `422 INVALID_COORDINATES`. Source (`coordinateValidation.ts`) implements the exact 4-step evaluation order specified in the plan (finite/magnitude guard → in-box → swap-guard → out-of-box), with the swap guard reachable ahead of the malformed guard for a swapped US coordinate (`classifyCoordinate(-93.0, 45.0)` → `SWAPPED_COORDINATES`, unit-tested). |
| 3 | Response never echoes raw coordinates verbatim; no raw coordinates in server logs or analytics | VERIFIED | Live 200 response body for `{lat:39.17,lng:-86.52}` contains no `"39.17"` or `"-86.52"` substring (grep-confirmed); `matchedAddress` is `""`. `essentialsCoordinateLookup.ts`'s only log statement is `console.error(..., (err as Error).message)` — never `req.body`/`lat`/`lng`. No analytics/telemetry import exists in the route file. |

**Score:** 3/3 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `C:/EV-Accounts/backend/src/lib/coordinateValidation.ts` | `US_BBOX` + `classifyCoordinate` pure function, 422 taxonomy | VERIFIED | Exports `US_BBOX`, `CoordinateRejectionCode`, `classifyCoordinate`. Standalone (no DB/HTTP/essentialsService imports). Correct evaluation order per plan. |
| `C:/EV-Accounts/backend/src/lib/coordinateValidation.test.ts` | Unit coverage: bbox membership, Aleutian antimeridian, swap guard, malformed input | VERIFIED | 12/12 tests pass (`npx vitest run` — confirmed live in this session). Includes explicit swapped-Minneapolis assertion (`SWAPPED_COORDINATES`, not `INVALID_COORDINATES`). |
| `C:/EV-Accounts/backend/src/lib/essentialsService.ts` (`getRepresentativesByCoordinate`) | Coordinate-only entry point, no geocode, exact single House rep, state-scoped floor, empty `matchedAddress` | VERIFIED | Exported function at line 1038; does not call `geocodeAddress`; does not call/merge `getFederalOfficials`; calls `getStatewideOfficials` only as a zero-rows fallback; inlines `pickHouseRep` filtering on `NATIONAL_LOWER` + matching geo_id; sets `matchedAddress = ''` unconditionally at the end. |
| `C:/EV-Accounts/backend/src/routes/essentialsCoordinateLookup.ts` | POST handler wiring `classifyCoordinate` → 422 taxonomy → `getRepresentativesByCoordinate` | VERIFIED | Single `router.post('/', optionalAuth, coordinateLookupLimiter, handler)`; reads `req.body.lat`/`lng` only (no `req.query`); rate-limited (60s/30/req.ip); catch block logs only `(err as Error).message`. |
| `C:/EV-Accounts/backend/src/routes/essentialsCoordinateLookup.test.ts` | Supertest coverage: 200 path + 3x 422 + no-echo | VERIFIED | 5/5 tests pass (confirmed live in this session): 200 path (exactly 1 `NATIONAL_LOWER`, no coord echo), `SWAPPED_COORDINATES`, `OUTSIDE_US_BOUNDS`, `INVALID_COORDINATES` (malformed), `INVALID_COORDINATES` (missing). |
| `C:/EV-Accounts/backend/src/index.ts` | Route mount before `/api/essentials` catch-all | VERIFIED | `app.use('/api/essentials/coordinate-lookup', essentialsCoordinateLookupRouter)` at line 158, before `app.use('/api/essentials', essentialsRouter)` at line 163. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `getRepresentativesByCoordinate` | `ST_Covers` over `geofence_boundaries` | shared `resolveOfficialsAtPoint` core | VERIFIED | `resolveOfficialsAtPoint` (lines 625-858) is the single core both `getRepresentativesByAddress` and `getRepresentativesByCoordinate` call; `ST_MakePoint($1::float8, $2::float8)` with `$1`=lng, `$2`=lat preserved with footgun comments on every new query site. |
| `getRepresentativesByCoordinate` | `getStatewideOfficials` / `getPoliticiansByArea` | state-scoped fallback floor | VERIFIED | `getStatewideOfficials` called only when zero `STATEWIDE_DISTRICT_TYPES` rows present; `getPoliticiansByArea(cdGeoId, 'G5200')` + inlined `pickHouseRep` called only when zero `NATIONAL_LOWER` rows present; `getFederalOfficials` is never imported/called anywhere in `essentialsService.ts`'s coordinate path (grep-confirmed absence). |
| `essentialsCoordinateLookup.ts` | `classifyCoordinate` | import + 422 passthrough | VERIFIED | Imported and called; `code`/`message` returned verbatim from the classification result. |
| `essentialsCoordinateLookup.ts` | `getRepresentativesByCoordinate` | import, called only on `{ok:true}` | VERIFIED | Confirmed by source and by supertest assertions that the mock is never called on any 422 path. |
| `index.ts` | `essentialsCoordinateLookupRouter` | `app.use` before catch-all | VERIFIED | Line 158 vs. line 163 (catch-all) — mount ordering correct. |

### Behavioral Spot-Checks (Live Endpoint)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Valid Bloomington IN point → 200, 1 House rep, no echo | `curl -X POST .../coordinate-lookup -d '{"lat":39.17,"lng":-86.52}'` | `200`; `NATIONAL_LOWER` count = 1; `matchedAddress:""`; no `39.17`/`-86.52` substring | PASS |
| Swapped coordinate → `SWAPPED_COORDINATES` | `curl ... -d '{"lat":-86.52,"lng":39.17}'` | `422 {"code":"SWAPPED_COORDINATES", ...}` | PASS |
| London (outside US) → `OUTSIDE_US_BOUNDS` | `curl ... -d '{"lat":51.5,"lng":-0.12}'` | `422 {"code":"OUTSIDE_US_BOUNDS", ...}` | PASS |
| Malformed input → `INVALID_COORDINATES` | `curl ... -d '{"lat":"abc"}'` | `422 {"code":"INVALID_COORDINATES", ...}` | PASS |
| No coordinate/body logging in source | `grep -c "req.body.*console\|console.*lat\|console.*lng" essentialsCoordinateLookup.ts` | 0 matches | PASS |
| Zero-write source assertion | `grep -niE "INSERT INTO|UPDATE |DELETE FROM"` over lines 612-1080 of `essentialsService.ts` | 0 matches | PASS |

### Unit/Integration Test Suites (Run Live This Session)

| Suite | Command | Result |
|-------|---------|--------|
| `npx tsc --noEmit` | (backend) | Clean, no errors |
| `coordinateValidation.test.ts` | `npx vitest run` | 12/12 passed |
| `essentialsCoordinateLookup.test.ts` | `npx vitest run` | 5/5 passed |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| RSLV-03 | 213-01, 213-02, 213-03 | Anonymous, stateless coordinate lookup endpoint via `ST_Covers`, US bbox + swap guard, zero writes | SATISFIED | Live-verified end-to-end; `REQUIREMENTS.md` line 73 marks it "Complete" and this verification confirms the claim against actual code and the live deployed endpoint. No orphaned requirements — RSLV-03 is the only requirement mapped to Phase 213 in `REQUIREMENTS.md` and it matches all three plans' frontmatter exactly. |

### Anti-Patterns Found

None. Grep for `TBD|FIXME|XXX|HACK|PLACEHOLDER|placeholder|coming soon|not yet implemented` across all four Phase 213 source files (`coordinateValidation.ts`, `coordinateValidation.test.ts`, `essentialsCoordinateLookup.ts`, `essentialsCoordinateLookup.test.ts`) returned zero hits.

### Human Verification Required

None. All three roadmap success criteria are directly, programmatically verifiable (source inspection + live HTTP smoke test), and a human operator already signed off ("approved") at the 213-03 blocking checkpoint per the SUMMARY. No additional human verification items were identified.

### Gaps Summary

No gaps. All three ROADMAP Phase-213 success criteria are independently confirmed against the live production endpoint and the actual `C:/EV-Accounts` source (not merely SUMMARY.md narrative):

- Criterion 1 (valid point → officials, no auth, no writes): confirmed live + source SELECT-only.
- Criterion 2 (distinct rejections, never silently queried): confirmed live with all three distinct 422 codes.
- Criterion 3 (no coordinate echo/logging): confirmed live (no substring match) + source (single error-message-only log statement, no telemetry).

One minor observation, not a gap: the live Bloomington response includes 4 `NATIONAL_UPPER` records where 2 (the two sitting IN Senators) might be expected — this reflects the pre-existing `statewideQueryText`/data-seeding behavior inherited unchanged from `getRepresentativesByAddress` (not something Phase 213 introduced or was scoped to change), and does not affect any of the three phase success criteria or the BLOCKER-1 single-House-rep guard (which is specific to `NATIONAL_LOWER`, confirmed as exactly 1).

---

*Verified: 2026-07-21*
*Verifier: Claude (gsd-verifier)*
