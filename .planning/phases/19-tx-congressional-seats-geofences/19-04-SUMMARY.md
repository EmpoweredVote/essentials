---
phase: 19-tx-congressional-seats-geofences
plan: "04"
subsystem: api
tags: [postgis, geofence, congressional-districts, national-lower, express, typescript]

# Dependency graph
requires:
  - phase: 19-01
    provides: "38 TX G5200 congressional district boundaries + district_id backfill"
  - phase: 19-02
    provides: "Collin County G4020 boundary (geo_id=48085, state=48)"
  - phase: 19-03
    provides: "37 TX US House politicians + 38 offices seeded (chamber c2facc31)"
provides:
  - "getPoliticiansByGovernmentList extended with optional countyGeoId PostGIS intersection"
  - "Route /by-government-list accepts county_geo_id from request body"
  - "Collin County automatically returns 5 NATIONAL_LOWER US House reps when county_geo_id=48085"
affects:
  - "19-05: Frontend - pass county_geo_id=48085 from Landing.jsx Collin County entry"
  - "Future county expansions using same G4020 PostGIS pattern"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PostGIS ST_Intersects(county_boundary, congressional_district) via G4020 ↔ G5200 join"
    - "Optional options param pattern for backwards-compatible service extension"
    - "Three-source merge dedup: local governments + statewide officials + congressional intersection"

key-files:
  created: []
  modified:
    - "C:/EV-Accounts/backend/src/lib/essentialsBrowseService.ts"
    - "C:/EV-Accounts/backend/src/routes/essentialsBrowse.ts"

key-decisions:
  - "countyGeoId passed via options object (not positional arg) to keep backwards-compatible call sites"
  - "districts table not filtered by state in PostGIS intersection query — geo_id uniqueness on G5200 is sufficient"
  - "400 (not 422) for invalid county_geo_id, consistent with plan spec"

# Metrics
duration: 15min
completed: 2026-05-03
---

# Phase 19 Plan 04: Backend PostGIS Intersection for US House Reps Summary

**PostGIS G4020↔G5200 intersection query wired into by-government-list endpoint — Collin County TX now returns 5 US House reps (Keith Self TX-3, Pat Fallon TX-4, + 3 others) when county_geo_id=48085 is supplied**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-05-03T21:29:00Z
- **Completed:** 2026-05-03T21:44:24Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- Extended `getPoliticiansByGovernmentList` with `options.countyGeoId` parameter — zero-impact on existing callers
- Added third PostGIS intersection query: finds NATIONAL_LOWER districts whose G5200 boundary intersects the G4020 county boundary
- Congressional rows merged via same Set-based deduplication as statewide rows
- Route `/by-government-list` now accepts `county_geo_id` from POST body with length validation (2-15 chars → 400 on invalid)
- Smoke-tested end-to-end against live DB: all 4 test cases pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend getPoliticiansByGovernmentList with countyGeoId + PostGIS intersection** - `cd33ff4` (feat)
2. **Task 2: Update /by-government-list route handler to forward county_geo_id** - `ff375b0` (feat)
3. **Task 3: Smoke-test backend changes** - (no file changes; verification only)

## Files Created/Modified

- `C:/EV-Accounts/backend/src/lib/essentialsBrowseService.ts` — Added `options: { countyGeoId?: string }` param to `getPoliticiansByGovernmentList`; PostGIS intersection query block; merge into congressionalRows
- `C:/EV-Accounts/backend/src/routes/essentialsBrowse.ts` — Destructure `county_geo_id` from body; validate (400 if invalid); pass as `{ countyGeoId }` to service

## Decisions Made

**Function signature change:**

Before:
```typescript
getPoliticiansByGovernmentList(
  governmentGeoIds: string[],
  stateAbbrev?: string
): Promise<PoliticianFlatRecord[]>
```

After:
```typescript
getPoliticiansByGovernmentList(
  governmentGeoIds: string[],
  stateAbbrev?: string,
  options: { countyGeoId?: string } = {}
): Promise<PoliticianFlatRecord[]>
```

The options object pattern (rather than a third positional arg) keeps all existing call sites unchanged — they pass no third arg and get the default `{}`.

**Column list in new PostGIS query:** Mirrors exactly the supplemental statewide query (lines 414-445 in original file) so the row shape is identical and can be processed by the same `allRows.map(...)` block.

**districts.state filter omitted from intersection query:** The G5200 geo_ids are globally unique, so an additional `d.state = stateAbbrev` filter is not required. The `county_gb.geo_id = $1 AND county_gb.mtfcc = 'G4020'` WHERE clause already scopes to the correct state's county boundary.

## Smoke Test Results

**Test A — Collin County (county_geo_id='48085') with full 23-city government list:**
- Total politicians returned: 179
- NATIONAL_LOWER count: 5
  - Brandon Gill geo_id=4826 (Republican) — TX-26
  - Keith Self geo_id=4803 (Republican) — TX-3
  - Pat Fallon geo_id=4804 (Republican) — TX-4
  - Lance Gooden geo_id=4805 (Republican) — TX-5
  - Julie Johnson geo_id=4832 (Democrat) — TX-32
- Keith Self (TX-3) and Pat Fallon (TX-4) confirmed present

**Test B — Same government list without county_geo_id:**
- NATIONAL_LOWER count: 0 (gating works correctly)
- Total politicians: 174 (no congressional reps added)

**Test C — LA County baseline (no county_geo_id):**
- Politicians returned: 55 (unchanged from pre-change baseline)

**Test D — Invalid county_geo_id='x' (1 char, below minimum 2):**
- HTTP 400 returned

## Deviations from Plan

None - plan executed exactly as written, with one minor adaptation:

The plan's pseudocode used `state_code`, `government_list`, and `government-list` as if the endpoint accepted those fields. The actual endpoint uses `government_geo_ids` (array) and `state`. The plan's SQL snippet was adapted accordingly — the county intersection query uses `$1` for `countyGeoId` only (no `$2` for `stateAbbrev` since the G5200 geo_ids are globally unique). The column list was verified against the actual supplemental statewide query and matched exactly.

## Issues Encountered

- Backend tsx watch mode was already running on port 3000 when smoke tests began; the file changes were picked up via auto-reload without needing a restart. All test results reflect the updated code.

## Next Phase Readiness

- Backend is complete and verified against live DB
- Ready for 19-05: Frontend — pass `county_geo_id` from Landing.jsx Collin County entry point so the UI surfaces US House reps
- The `browseByGovernmentList(ids, state)` API function in `src/lib/api.jsx` needs a third `countyGeoId` parameter, and Results.jsx needs to forward it

---
*Phase: 19-tx-congressional-seats-geofences*
*Completed: 2026-05-03*
