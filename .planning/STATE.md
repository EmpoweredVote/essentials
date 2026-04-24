# State

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements — v2.1 Candidate Discovery
Last activity: 2026-04-23 — Milestone v2.1 started

Progress: [░░░░░░░░░░░░░░░░░░░░] v2.1 not started

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-13 after v2.0 milestone)

**Core value:** A resident can look up who represents them — and who is on their ballot — without creating an account.
**Current focus:** Planning next milestone — data completeness and Elections page enhancements

## Accumulated Context

### Key Decisions (carry forward)

- Candidate ordering is seeded-random per session (sessionStorage key `ev:election-seed`), never alphabetical
- Party data lives on races (`primary_party`), never on individual candidates — antipartisan design
- Connected users must never see address input if `me.jurisdiction` is non-null (EDOC-01)
- Elections data lives in `essentials` schema on Postgres, served by Express backend at `C:\EV-Accounts`
- Elections page is a standalone top-level route (`/elections`), not embedded in Results
- Use `elections/me` for Connected auto-load — Census Geocoder unreliable with city+state
- Elections page is view-only — never calls `saveMyLocation`
- LEFT JOIN with filter in ON clause (not WHERE) — standard pattern for optional relationships in this codebase
- Layout.jsx nav extension: two-step pattern (baseNavItems, then spread + append) — do not mutate defaultNavItems

### Known Architecture

- Frontend: React 19/JSX + Vite + Tailwind CSS 4, deployed to Render
- Backend: Express TypeScript at `C:\EV-Accounts`, deployed via Render push to `master`
- Elections query: `electionService.ts` → `getElectionsByCoordinate(lat, lng)` — geocodes address, PostGIS geofence match
- Backend returns 0-candidate races with empty `candidates: []` array (Phase 1 fix deployed)
- ElectionsView.jsx: three-state rendering (contested/unopposed/empty), branch sort, local civic priority, left-border zebra stripe

### Database State (as of 2026-04-12)

- 2 elections: 2026 Indiana Primary (May 5), 2026 LA County Primary (June 2)
- 61 races, 124 candidates
- 6,928 geofence boundaries loaded

### Pending Todos (accounts team backlog)

- CA Governor challenger candidates (10 filed, not yet seeded) — request filed 2026-04-13
- LAUSD sub-district geofences pending (all 3 board races show for any LAUSD address)
- CA SoS challenger ingestion script in progress (all CA primary races)

---
*State initialized: 2026-04-12 — Roadmap created*
*Updated: 2026-04-13 — v2.0 milestone complete*
