---
phase: 212-backend-place-name-resolver-national-fallback
plan: 07
subsystem: api
tags: [postgis, gis, express, typescript, vitest, gap-closure]

# Dependency graph
requires:
  - phase: 212-backend-place-name-resolver-national-fallback
    provides: >
      GET /essentials/location-search + /resolve routes (212-05),
      essentials.gazetteer_places/gazetteer_counties nationwide reference
      tables (212-01/03), getCongressionalOverlapNote (212-04/05/06)
provides:
  - "'G4000' (state boundary MTFCC) added to /resolve's KNOWN_MTFCCS allowlist — bare state-name candidates no longer 422"
  - "Gazetteer-centroid point-in-polygon fallback in getCongressionalOverlapNote for Gazetteer-only (no-geometry) place candidates"
affects: [214-frontend-location-combobox]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Point-in-polygon fallback: when a geometry-based spatial overlap legitimately finds nothing (place has only a centroid, no polygon), fall back to ST_Contains(polygon, ST_Point(centroid)) against the same GIST-indexed table rather than trusting an empty geometry-join result at face value."

key-files:
  created: []
  modified:
    - C:/EV-Accounts/backend/src/routes/essentialsLocationSearch.ts
    - C:/EV-Accounts/backend/src/lib/essentialsBrowseService.ts
    - C:/EV-Accounts/backend/src/lib/essentialsBrowseService.test.ts
    - C:/EV-Accounts/backend/src/routes/essentialsLocationSearch.test.ts

key-decisions:
  - "Fallback lookup order: gazetteer_places first, then gazetteer_counties (a geo_id belongs to exactly one) — two small parameterized SELECTs rather than a single UNION ALL, so ordering/precedence is deterministic and each branch is independently unit-testable."
  - "Fallback logic extracted into a private helper (findContainingCdFromGazetteerCentroid) rather than inlined into getCongressionalOverlapNote's body, keeping the existing 'reuse-only, no new PostGIS query in this function's own body' source-guard test meaningful (the guard now correctly describes the primary geometry-overlap path; the fallback is its own clearly-scoped unit)."
  - "Fallback only fires when the primary geometry overlap returns zero G5200 pairs — never overrides a real (single or multi-CD) geometry result, so curated/deep-seeded places and counties with existing polygons are completely unaffected."

patterns-established:
  - "Point-in-polygon fallback pattern (see tech-stack.patterns) for future Gazetteer-only-coverage gaps (e.g. if a similar geometry-only gap surfaces for school districts or state legislative districts against Gazetteer-only rows)."

requirements-completed: [RSLV-05, RSLV-06]

# Metrics
duration: 35min
completed: 2026-07-20
---

# Phase 212 Plan 07: Gap-Closure — National-Fallback Blockers Summary

**Fixed two verifier-confirmed blockers in the place-name resolver's national-fallback path: state-tier resolves no longer 422 (missing 'G4000' MTFCC), and Gazetteer-only places (CDPs/incorporated places with no geofence polygon) now resolve their single overlapping US House district via a point-in-polygon fallback against the place's Census Gazetteer centroid.**

## Performance

- **Duration:** ~35 min
- **Completed:** 2026-07-20
- **Tasks:** 2 (both fixes authored, tested, and committed together per the gap-closure scope)
- **Files modified:** 4 (2 source, 2 test)

## Accomplishments

- **FIX A (RSLV-05 blocker):** Added `'G4000'` to `KNOWN_MTFCCS` in `essentialsLocationSearch.ts`. `GET /location-search` emits `mtfcc:"G4000"` for every State-tier candidate (all 50 states + DC), but `/resolve`'s input-validation allowlist previously omitted it, so the documented `GET /` → `GET /resolve` round-trip always 422'd for a bare state-name query (verified live pre-fix for IL geo_id 17 and AZ geo_id 04 per the verification report). The outdated doc comment claiming State-tier rows have "no paired geofence_boundaries row" (a `''` sentinel) was also corrected — production data shows they do have a paired `G4000` row.
- **FIX B (RSLV-05/RSLV-06/SC4 blocker):** Added a point-in-polygon fallback (`findContainingCdFromGazetteerCentroid`) inside `getCongressionalOverlapNote` in `essentialsBrowseService.ts`. The ~32k `essentials.gazetteer_places` rows (and `essentials.gazetteer_counties`) ingested by migration 1378 carry no polygon geometry — only a centroid (`intptlat`/`intptlong`) — so the existing geometry-based CD overlap legitimately found zero G5200 rows for any Gazetteer-only place candidate, which was indistinguishable from a genuine (impossible) zero-overlap area. The fallback now looks up the place's own Gazetteer centroid (places table first, then counties) and finds the containing congressional district via a parameterized, GIST-index-driven `ST_Contains(geometry, ST_SetSRID(ST_Point(lon, lat), 4326))` query against `essentials.geofence_boundaries WHERE mtfcc = 'G5200'`. Only fires when the primary overlap is empty; returns an honest `cdGeoIds: []` when no centroid exists or the centroid falls in no CD (never fabricates a representative).

## Task Commits

Both fixes were authored, tested, and committed together as a single logical gap-closure change (per the plan's scope — two tightly-coupled mechanical fixes in the same resolve path):

1. **Both fixes + tests** — `bfc10673` (fix) in `C:/EV-Accounts` (branch `master`, **not pushed** — orchestrator handles deploy/push and re-smoke)

## Files Created/Modified

- `C:/EV-Accounts/backend/src/routes/essentialsLocationSearch.ts` — added `'G4000'` to `KNOWN_MTFCCS`; corrected the stale sentinel doc comment.
- `C:/EV-Accounts/backend/src/lib/essentialsBrowseService.ts` — added `findContainingCdFromGazetteerCentroid` helper + wired it into `getCongressionalOverlapNote` as a zero-CD fallback.
- `C:/EV-Accounts/backend/src/lib/essentialsBrowseService.test.ts` — updated the pre-existing "zero CDs overlap" test to account for the new fallback's additional pool.query calls; added 5 new tests covering: fallback finds a CD via `gazetteer_places` centroid, fallback finds a CD via `gazetteer_counties` centroid (no `gazetteer_places` row), centroid exists but no containing CD (honest `[]`), no centroid in either table (honest `[]`, never fabricated), and fallback never fires when the primary geometry overlap already found CD(s) (no override of a real multi-CD result).
- `C:/EV-Accounts/backend/src/routes/essentialsLocationSearch.test.ts` — added a route-level test confirming a State-tier candidate (`mtfcc=G4000`) resolves with HTTP 200 (not 422) and correctly reaches `getCongressionalOverlapNote('17', 'G4000')`.

## Decisions Made

See `key-decisions` in frontmatter. In short: two-step (places-then-counties) centroid lookup for deterministic testability; fallback logic kept in a separate helper function rather than inlined, so the pre-existing "no new PostGIS query authored in this function's own body" source-guard test remains meaningful for the primary reuse-based overlap path; fallback strictly gated on `cdGeoIds.length === 0` so it can never clobber a real geometry-derived multi-CD result.

## Deviations from Plan

None — plan executed exactly as diagnosed. Both fixes matched the diagnosis's prescribed approach (add `'G4000'` to the allowlist; add a point-in-polygon fallback keyed off the Gazetteer centroid using `ST_Contains` against the existing GIST-indexed `essentials.geofence_boundaries`). No architectural changes were needed — confirmed by code review that no other query path hard-codes assumptions about `mtfcc` values that would crash on `'G4000'` (the county-officials and district-overlap queries for a state-tier `geo_id` simply resolve to empty seed sets when no `G4020/G4040/G4110/G4120/X0001`-tier geofence exists for that geo_id, which is graceful, not a crash).

## Issues Encountered

One pre-existing unit test (`getCongressionalOverlapNote > returns needsExactAddress:false and an empty array when zero CDs overlap`) needed its mock call sequence extended from 2 to 4 `pool.query` calls, since the new fallback now always attempts the centroid lookup(s) when the primary overlap returns zero CDs. Updated in place (not a plan deviation — this is the same test scenario, just now exercising the full call chain including the honest-fallback-finds-nothing path).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Both RSLV-05/RSLV-06 blockers identified in the 212-VERIFICATION.md gaps are fixed and unit-tested. `npm run build` is clean and all 322 backend unit tests pass (10 new/updated across the two touched test files).
- **Not yet live-verified against production** — commits are local-only in `C:/EV-Accounts` (branch `master`, unpushed) per this plan's explicit scope; the orchestrator is responsible for pushing and re-running the live smoke tests (state-name round-trip for IL/AZ; Gazetteer-only place CD lookup for Paradise CDP CA / Sun City CDP AZ / North Springfield CDP VT) before Phase 214 (frontend combobox) begins consuming this endpoint.
- No `STATE.md` / `ROADMAP.md` / `REQUIREMENTS.md` changes were made by this gap-closure plan, per its explicit scope — those updates (if any) are the orchestrator's responsibility after live re-verification confirms both fixes hold in production.

---
*Phase: 212-backend-place-name-resolver-national-fallback*
*Completed: 2026-07-20*
