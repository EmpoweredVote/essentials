# State

## Current Position

Phase: 2 — Elections Page
Plan: —
Status: Ready to plan
Last activity: 2026-04-12 — Phase 1 (Backend Fix) complete and verified

Progress: [█████░░░░░░░░░░░░░░░] Phase 1 of 4 complete (1/4 phases)

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-12)
See: .planning/ROADMAP.md (created 2026-04-12)

**Core value:** A resident can look up who represents them — and who is on their ballot — without creating an account.
**Current focus:** Milestone v2.0 — Elections Page, Phase 2 — Elections Page

## Performance Metrics

- Phases complete: 1/4
- Requirements shipped: 1/13
- Plans complete: 1

## Accumulated Context

### Key Decisions

- Candidate ordering is seeded-random per session (sessionStorage key `ev:election-seed`), never alphabetical
- Party data lives on races (`primary_party`), never on individual candidates — antipartisan design
- Connected users must never see address input if `me.jurisdiction` is non-null (EDOC-01)
- Elections data lives in `essentials` schema on Postgres, served by Express backend at `C:\EV-Accounts`
- Elections page is a standalone top-level route (`/elections`), not embedded in Results
- LEFT JOIN with `candidate_status != 'withdrawn'` in ON clause (not WHERE) — standard pattern for optional relationships (preserves 0-candidate race rows where WHERE would make them invisible)

### Known Architecture

- Frontend: React 19/JSX + Vite + Tailwind CSS 4, deployed to Netlify
- Backend: Express TypeScript at `C:\EV-Accounts`, deployed via Render push to `master`
- Elections query: `electionService.ts` → `getElectionsByCoordinate(lat, lng)` — geocodes address, PostGIS geofence match
- Backend now returns 0-candidate races with empty `candidates: []` array (Phase 1 fix deployed)
- Existing component: `ElectionsView.jsx` handles randomization and grouping — extend for unopposed/empty in Phase 3
- Connected user detection: `detectUserState()` from CompassContext — `jurisdiction` non-null = auto-fetch

### Database State (as of 2026-04-12)

- 2 elections: 2026 Indiana Primary (May 5), 2026 LA County Primary (June 2)
- 61 races, 124 candidates
- 6,928 geofence boundaries loaded

### Pending Todos

None.

## Session Continuity

Last session: 2026-04-12
Stopped at: Phase 1 complete — ready to plan Phase 2

---
*State initialized: 2026-04-12 — Roadmap created*
