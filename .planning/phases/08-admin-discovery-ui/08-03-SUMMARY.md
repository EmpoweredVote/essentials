---
phase: 08-admin-discovery-ui
plan: 03
subsystem: frontend
tags: [react, jsx, tailwind, admin, discovery, polling]

# Dependency graph
requires:
  - phase: 08-02
    provides: GET /api/admin/discovery/* endpoints
provides:
  - /admin/discovery page with jurisdictions panel, run history, coverage health
  - triggerDiscoveryRun in adminApi.js

key-files:
  created:
    - C:/Transparent Motivations/essentials/src/pages/admin/DiscoveryDashboard.jsx
  modified:
    - C:/Transparent Motivations/essentials/src/lib/adminApi.js
    - C:/Transparent Motivations/essentials/src/App.jsx

# Metrics
duration: 6min
completed: 2026-04-27
---

# Phase 8 Plan 03: Discovery Dashboard UI Summary

React admin discovery dashboard with three-section layout: sortable jurisdictions table with polling-driven run status, paginated run history with jurisdiction filter, and coverage health table flagging zero-candidate races.

## Accomplishments

- Added four discovery API helpers to adminApi.js: `fetchDiscoveryJurisdictions`, `fetchDiscoveryRuns`, `fetchDiscoveryCoverage`, `triggerDiscoveryRun`
- Built DiscoveryDashboard.jsx (605 lines) with three stacked sections, inline Spinner and Toast components, no new npm dependencies
- Jurisdictions section: sortable columns (click-to-sort with direction indicator), text search filter, status badges with `animate-pulse` for running state, Run Discovery button with optimistic state update
- Polling: `setInterval` at 4000ms while any row has running status; auto-clears when idle; re-fetches coverage on completion; emits toast per settled run
- Run History section: server-side pagination 25/page (Prev/Next), jurisdiction dropdown filter that resets page to 0 on change
- Coverage Health section: `zero_candidate_races > 0` rendered `text-red-600 font-bold`
- Wired `/admin/discovery` route in App.jsx inside `RequireAuth`

## Task Commits

1. **Task 1: adminApi.js helpers** - `33e878e` (feat)
2. **Task 2: DiscoveryDashboard.jsx** - `57a7fe0` (feat)
3. **Task 3: App.jsx route** - `480fc8d` (feat)

## Findings / Deviations

### Auth Mismatch: triggerDiscoveryRun will return 401 in production

**Finding:** The existing `POST /admin/discover/jurisdiction/:id` route in `essentialsDiscovery.ts` is gated by `requireAdminToken` (X-Admin-Token header), applied at mount time in `index.ts`. The `apiFetch` helper in the frontend sends JWT Bearer tokens only — it has no mechanism to send X-Admin-Token.

**Impact:** Clicking "Run Discovery" will return a 401 response. The UI handles this gracefully: the optimistic running state is reverted, and a red error toast is shown with the status code. No silent failure.

**Recommended fix (Wave 4 or future plan):** Add a new JWT-gated trigger endpoint (e.g., `POST /admin/discovery/trigger/:id`) using `requireAuth + requireAdmin` pattern, consistent with the Phase 8 discovery dashboard read endpoints. The existing X-Admin-Token route can remain for server-to-server use.

**Documented per plan instructions:** implemented as specified, finding recorded here for Wave 4 human verification.

### Auto-fixed Bug: Pre-existing build break in Prototype.jsx

**Rule 1 - Bug Fix:** `src/pages/Prototype.jsx` imported `CompassCardHorizontal` from `@empoweredvote/ev-ui`, but that component was removed from the ev-ui package. The build was already failing before plan 08-03 work began (verified via `git stash`).

**Fix:** Replaced `CompassCardHorizontal` with `PoliticianCard` (which is exported from ev-ui and serves a similar role). Removed unused props (`tierVisuals`, `view`, `surface`, `variant`, `onBuildCompass`) not present on `PoliticianCard`.

**Files modified:** `src/pages/Prototype.jsx`
**Included in commit:** `33e878e` (Task 1 commit)

## Backend Response Shape Verification

Verified against `C:/EV-Accounts/backend/src/routes/discoveryDashboard.ts`:

- `GET /discovery/jurisdictions` → flat array with fields: `id`, `name` (aliased from `jurisdiction_name`), `election_date`, `source_url`, `last_run_id`, `last_run_status`, `last_run_started_at`, `last_run_completed_at`, `last_run_candidates_found` (from `candidates_new`), `last_run_candidates_auto_upserted`, `active_candidates`
- `GET /discovery/runs` → `{ runs: [...], total: N, limit: N, offset: N }` with run fields: `id`, `jurisdiction_id`, `jurisdiction_name`, `status`, `started_at`, `completed_at`, `candidates_found`, `candidates_staged`, `candidates_auto_upserted`, `triggered_by`, `error_message`
- `GET /discovery/coverage` → flat array with fields: `id`, `name`, `total_races`, `races_with_candidates`, `zero_candidate_races`

All field names matched the backend spec exactly. Component implemented with matching field names.

## Next Phase Readiness

Wave 4 (human verify) is unblocked with one known issue: the "Run Discovery" button will return 401 until the trigger endpoint auth is addressed. All three read sections (jurisdictions, run history, coverage) should render correctly assuming JWT auth is working for the admin user.
