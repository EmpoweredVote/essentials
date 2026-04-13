# State

## Current Position

Phase: 1 — Backend Fix
Plan: —
Status: Ready to plan
Last activity: 2026-04-12 — Roadmap created for v2.0 Elections Page

Progress: [░░░░░░░░░░░░░░░░░░░░] 0/4 phases complete

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-12)
See: .planning/ROADMAP.md (created 2026-04-12)

**Core value:** A resident can look up who represents them — and who is on their ballot — without creating an account.
**Current focus:** Milestone v2.0 — Elections Page, Phase 1 — Backend Fix

## Performance Metrics

- Phases complete: 0/4
- Requirements shipped: 0/13
- Plans complete: 0

## Accumulated Context

### Key Decisions

- Candidate ordering is seeded-random per session (sessionStorage key `ev:election-seed`), never alphabetical
- Party data lives on races (`primary_party`), never on individual candidates — antipartisan design
- Connected users must never see address input if `me.jurisdiction` is non-null (EDOC-01)
- Elections data lives in `essentials` schema on Postgres, served by Express backend at `C:\EV-Accounts`
- Elections page is a standalone top-level route (`/elections`), not embedded in Results

### Known Architecture

- Frontend: React 19/JSX + Vite + Tailwind CSS 4, deployed to Netlify
- Backend: Express TypeScript at `C:\EV-Accounts`, deployed via Render push to `master`
- Elections query: `electionService.ts` → `getElectionsByCoordinate(lat, lng)` — geocodes address, PostGIS geofence match
- Current gap: INNER JOIN on `race_candidates` drops 0-candidate races (fixed in Phase 1)
- Existing component: `ElectionsView.jsx` handles randomization and grouping — extend for unopposed/empty in Phase 3
- Connected user detection: `detectUserState()` from CompassContext — `jurisdiction` non-null = auto-fetch

### Database State (as of 2026-04-12)

- 2 elections: 2026 Indiana Primary (May 5), 2026 LA County Primary (June 2)
- 61 races, 124 candidates
- 6,928 geofence boundaries loaded

### Pending Todos

None.

---
*State initialized: 2026-04-12 — Roadmap created*
