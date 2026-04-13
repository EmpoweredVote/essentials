# Essentials — Empowered Vote

## What This Is

Essentials is a civic engagement web app that helps people discover who represents them and who is running in upcoming elections. It covers Monroe County, IN and Los Angeles County, CA. It works fully for anonymous users (Inform tier) and provides enhanced jurisdiction-aware experiences for Connected accounts.

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

### Active

<!-- Current scope. Building toward these. -->

- [ ] Dedicated `/elections` top-level page — standalone route, not buried in Results
- [ ] Connected user auto-forward on Elections page — jurisdiction → immediate fetch, no address input
- [ ] Inform/no-jurisdiction users see address input on Elections page with county shortcuts
- [ ] Unopposed race handling — badge on section header for 1-candidate races ("Running Unopposed")
- [ ] No-candidates race handling — section notice ("No candidates have filed") for 0-candidate races
- [ ] Backend LEFT JOIN fix — races with 0 candidates currently silently dropped by INNER JOIN
- [ ] Navigation entries — Elections card on Landing page + Elections item in site header

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
- **Database state**: 2 elections loaded (2026 Indiana Primary May 5, 2026 LA County Primary June 2), 61 races, 124 candidates, 6,928 geofence boundaries.
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
| Elections as separate page (not in Results) | Users shouldn't need to "find" elections buried under address search | — Pending |

---
*Last updated: 2026-04-12 — Milestone v2.0 Elections Page started*
