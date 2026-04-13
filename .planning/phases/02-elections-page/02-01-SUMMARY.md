---
phase: 02-elections-page
plan: 01
subsystem: ui
tags: [react, elections, tier-aware, routing, api]

requires:
  - phase: 01-backend-fix
    provides: Backend returns 0-candidate races with empty candidates array

provides:
  - Standalone /elections route rendering Elections page
  - Tier-aware auto-load for Connected users via elections/me endpoint
  - Address input with county shortcuts for Inform/no-jurisdiction users
  - Change location flow for Connected users (view-only, no saveMyLocation)
  - fetchMyElections() API function in src/lib/api.jsx
  - Generic state section labels in ElectionsView (State Legislature, State Executive)

affects: [03-unopposed-ux, 04-navigation]

tech-stack:
  added: []
  patterns:
    - compassLoading gate before any tier detection (prevents address input flash)
    - elections/me for Connected auto-load (skips geocoding entirely, uses stored geo_ids)
    - cancelled flag pattern in useEffect cleanup

key-files:
  created:
    - src/pages/Elections.jsx
  modified:
    - src/App.jsx
    - src/lib/api.jsx
    - src/components/ElectionsView.jsx

key-decisions:
  - "Use elections/me endpoint for Connected auto-load — city+state geocoding unreliable with Census Geocoder"
  - "locationLabel falls back to city+state string if X-Formatted-Address header is empty"
  - "ElectionsView state body labels changed to generic (State Legislature, State Executive) — Indiana was hardcoded"
  - "Accounts team seeding quality surfaced as concern — seeded candidates had to be mostly removed during QA"

patterns-established:
  - "Gate ALL tier detection on !compassLoading to prevent address input flash for Connected users"
  - "Elections page is view-only — never calls saveMyLocation"

duration: ~2h (including backend coordination and QA)
completed: 2026-04-13
---

# Plan 02-01: Elections Page Summary

**Standalone `/elections` page with tier-aware auto-load via `elections/me` endpoint, address input with county shortcuts, and change location flow**

## Performance

- **Duration:** ~2h (including backend coordination rounds)
- **Started:** 2026-04-12
- **Completed:** 2026-04-13T17:13:28Z
- **Tasks:** 2 (1 auto + 1 human verify)
- **Files modified:** 4

## Accomplishments

- Created `src/pages/Elections.jsx` — standalone Elections page at `/elections` with full tier-aware behavior
- Connected users with stored jurisdiction auto-load correct district races via `elections/me` (no geocoding, uses stored geo_ids directly)
- Inform and Connected-without-jurisdiction users see address input + Monroe County / LA County shortcuts
- Change location flow reveals address input above existing results without calling `saveMyLocation`
- Fixed hardcoded Indiana state labels in `ElectionsView.jsx` — now shows "State Legislature" / "State Executive" for all states

## Task Commits

1. **Task 1: Create Elections.jsx page** — `f464c03` (feat)
2. **Gap fix: Switch to elections/me for auto-load** — `3dc8fab` (feat) — discovered during human verify
3. **Gap fix: Generic state labels in ElectionsView** — `870e124` (fix) — discovered during QA

## Files Created/Modified

- `src/pages/Elections.jsx` — new standalone Elections page, tier-aware auto-load, address input, shortcuts, change location
- `src/App.jsx` — added `/elections` route and Elections import
- `src/lib/api.jsx` — added `fetchMyElections()` function (calls `GET /essentials/elections/me`)
- `src/components/ElectionsView.jsx` — fixed hardcoded "Indiana General Assembly" / "Indiana Executive" → generic labels

## Decisions Made

- **elections/me over city+state geocoding:** The original plan used `fetchElectionsByAddress(city + ', ' + state)` for Connected auto-load. During QA this failed — Census Geocoder needs full street addresses. Also discovered that even a representative address returns wrong-district races for users who don't live there. Switched to `elections/me` which uses stored geo_ids directly — faster, accurate, no geocoding.
- **locationLabel fallback:** If `X-Formatted-Address` header is empty, falls back to `city + ', ' + state`. Accounts team cannot do street-level reverse geocoding without a paid service.
- **Generic state labels:** `ElectionsView.jsx` had "Indiana General Assembly" and "Indiana Executive" hardcoded. Changed to "State Legislature" and "State Executive" — correct for all states.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Switched Connected auto-load from fetchElectionsByAddress to fetchMyElections**
- **Found during:** Human verify checkpoint
- **Issue:** `"Los Angeles, CA"` (city+state) fails Census Geocoder. Even when a representative address was used, it returned races for the wrong district — a Valley user would see downtown LA races.
- **Fix:** Filed `ACCOUNTS-TEAM-REQUEST-elections-me.md`; accounts team shipped `GET /essentials/elections/me` (commit `26037f5`). Updated `Elections.jsx` to call `fetchMyElections()` and added `fetchMyElections()` to `api.jsx`.
- **Files modified:** `src/pages/Elections.jsx`, `src/lib/api.jsx`
- **Committed in:** `3dc8fab`

**2. [Rule 1 — Auto-fix bug] Fixed hardcoded Indiana state labels in ElectionsView**
- **Found during:** QA — CA Governor appeared under "Indiana Executive" section
- **Issue:** `deriveBodyAndSubGroup` had `'Indiana General Assembly'` and `'Indiana Executive'` hardcoded for all state-level races regardless of state
- **Fix:** Changed to `'State Legislature'` and `'State Executive'`
- **Files modified:** `src/components/ElectionsView.jsx`
- **Committed in:** `870e124`

---

**Total deviations:** 2 auto-fixed (1 blocking API gap, 1 hardcoded label bug)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered

- **Accounts team data seeding quality:** During QA, the accounts team-seeded candidates for LA County races had to be mostly removed — incorrect or placeholder data was seeded alongside valid incumbents. Flagged as a process concern; CA Governor challenger candidates were filed separately via `ACCOUNTS-TEAM-REQUEST-ca-governor-candidates.md`.
- **State/Federal races initially missing:** LA County elections endpoint returned only 1 local race on first test. Filed `ACCOUNTS-TEAM-REQUEST-elections-state-federal-races.md`. Accounts team confirmed and fixed: missing race records + corrupted/incomplete CA geofences (MTFCC codes swapped, county FIPS colliding with legislative district geo_ids). Resolved same day.

## User Setup Required

None.

## Next Phase Readiness

- `/elections` route is live and rendering correctly across all tiers for LA County addresses
- Connected users auto-load with correct district races
- Phase 3 (Unopposed/Empty Race UX) can proceed — `ElectionsView` is the target component
- Phase 4 (Navigation) can proceed — the `/elections` route exists and is ready to be linked

**Known data gaps (accounts team backlog):**
- CA Governor challenger candidates not yet seeded (10 candidates filed in request)
- LAUSD board sub-district geofences pending (currently all 3 LAUSD board races show for any LAUSD-boundary address)
- CA SoS challenger ingestion script in progress for all CA primary races

---
*Phase: 02-elections-page*
*Completed: 2026-04-13*
