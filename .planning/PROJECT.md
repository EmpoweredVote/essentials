# Essentials — Empowered Vote

## What This Is

Essentials is a civic engagement web app that helps people discover who represents them and who is running in upcoming elections. It covers Monroe County, IN and Los Angeles County, CA. It works fully for anonymous users (Inform tier) and provides enhanced jurisdiction-aware experiences for Connected accounts. A dedicated Elections page at `/elections` gives any user instant access to their local ballot.

## Core Value

A resident can look up who represents them — and who is on their ballot — without creating an account.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Representatives lookup by address — geocodes to politicians via PostGIS geofence matching
- ✓ Politician profile pages (bio, legislative record, judicial scorecard)
- ✓ Candidate profile pages linked from election races
- ✓ Elections tab in Results — address-driven, fetches via `/essentials/elections-by-address`
- ✓ `ElectionsView.jsx` — randomized candidate ordering (session-seeded shuffle), grouped by tier → government body → race
- ✓ Connected user jurisdiction auto-populate — no address re-entry for known location
- ✓ Auth flow — redirect to Auth Hub, hash-fragment token extraction, `ev_token` in localStorage
- ✓ Three-tier detection — Inform / Connected-with-jurisdiction / Connected-no-jurisdiction
- ✓ Political Compass integration (via CompassContext)
- ✓ XP/gem awards for Connected users (service-to-service, idempotent)
- ✓ Coverage for Monroe County, IN and Los Angeles County, CA (data + geofences)
- ✓ Dedicated `/elections` top-level page — standalone route, not buried in Results — v2.0
- ✓ Connected user auto-forward on Elections page — jurisdiction → immediate fetch via `elections/me`, no address input — v2.0
- ✓ Inform/no-jurisdiction users see address input on Elections page with Monroe County and LA County shortcuts — v2.0
- ✓ Unopposed race handling — "Running Unopposed" photo overlay for 1-candidate races — v2.0
- ✓ No-candidates race handling — "No candidates have filed" coral notice for 0-candidate races — v2.0
- ✓ Backend LEFT JOIN fix — races with 0 candidates returned with `candidates: []`, not silently dropped — v2.0
- ✓ Navigation entries — "Upcoming Elections" card on Landing page + "Elections" item in site header — v2.0

### Active

<!-- Current scope. Building toward these. -->

- [ ] All races for Monroe County, IN 2026 primary verified and filled (DATA-01)
- [ ] All races for LA County, CA 2026 primary verified and filled (DATA-02)
- [ ] Candidate headshots uploaded for all candidates where available (DATA-03)
- [ ] Filter elections by tier (Local / State / Federal) (ELEC-F01)
- [ ] Share a specific election/race via deep link (ELEC-F02)

### Out of Scope

<!-- Explicit boundaries. -->

- Incumbency highlighting — deliberately excluded; anti-partisan mission, no "pole position"
- Alphabetical ordering — explicitly excluded; all candidate ordering is randomized per session seed
- Hiding empty/unopposed races — user confirmed wrong direction; all races must surface
- Real-time chat or notifications — not a civic lookup product
- Mobile app — web-first

## Context

- **Stack**: React 19 + Vite + Tailwind CSS 4 + React Router 7. UI components from `@empoweredvote/ev-ui`.
- **Backend**: Express API (`C:\EV-Accounts`), deployed via Render push to master. Database: Postgres with PostGIS in `essentials` schema.
- **Shipped v2.0**: Dedicated Elections page at `/elections` — all 13 requirements satisfied, 4 phases complete.
- **Database state**: 2 elections loaded (2026 Indiana Primary May 5, 2026 LA County Primary June 2), 61 races, 124 candidates, 6,928 geofence boundaries.
- **Data gaps (accounts team backlog)**: CA Governor challenger candidates (10 filed, not seeded); LAUSD sub-district geofences pending; CA SoS challenger ingestion in progress.
- **Auth**: Redirect-only flow via Auth Hub (`accounts.empowered.vote`). No direct login from Essentials.
- **Anti-patterns enforced**: No Google Places autocomplete. No address re-entry for Connected users. Party data on races only, never on candidates.

## Constraints

- **Tech stack**: React/JSX (not TypeScript on frontend). Backend is TypeScript.
- **Auth model**: Connected users must never be prompted for their address if `jurisdiction` is non-null — EDOC-01.
- **Data**: Candidate randomization is per-session (seeded shuffle in sessionStorage), not per-page-load.
- **Backend deploy**: Changes to backend require push to `master` branch at `C:\EV-Accounts` for Render deploy.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Seeded-shuffle candidate ordering | Antipartisan — prevents alphabetical bias across refreshes within a session | ✓ Good |
| Party affiliation on races, not candidates | Antipartisan mission — primary party context without candidate-level party display | ✓ Good |
| Hash-fragment token delivery | Prevents token leakage in server/CDN logs | ✓ Good |
| Elections as separate page (not in Results) | Users shouldn't need to "find" elections buried under address search | ✓ Good — v2.0 |
| `elections/me` for Connected auto-load | Census Geocoder unreliable with city+state; also returns wrong-district races | ✓ Good — v2.0 |
| Elections page view-only (no saveMyLocation) | Elections is a lookup destination, not a location-setting flow | ✓ Good — v2.0 |
| "Running Unopposed" as photo overlay | SubGroupSection has no badge slot; overlay consistent with Withdrawn banner pattern | ✓ Good — v2.0 |
| Left-border zebra stripe over background fill | rgba(0,0,0,0.03) invisible on all tier backgrounds; 2px #E5E7EB border is visible | ✓ Good — v2.0 |
| Local tier skips branch-first sort | BRANCH_ORDER correct for State/Federal but wrong for Local civic priority | ✓ Good — v2.0 |
| navItems two-step in Layout.jsx | Clean separation of Read & Rank injection from Elections append; no defaultNavItems mutation | ✓ Good — v2.0 |

---
*Last updated: 2026-04-13 after v2.0 milestone*
