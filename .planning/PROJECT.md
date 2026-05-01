# Essentials — Empowered Vote

## What This Is

Essentials is a civic engagement web app that helps people discover who represents them and who is running in upcoming elections. It covers Monroe County, IN, Los Angeles County, CA, and Collin County, TX. It works fully for anonymous users (Inform tier) and provides enhanced jurisdiction-aware experiences for Connected accounts. A dedicated Elections page at `/elections` gives any user instant access to their local ballot. Candidate data is populated by a Claude-powered discovery pipeline that finds candidates from official election authority sources, scores confidence, and stages them for admin review or auto-upsert.

## Core Value

A resident can look up who represents them — and who is on their ballot — without creating an account.

## Current Milestone: v3.0 Collin County, TX Coverage

**Goal:** Populate the Essentials + Compass database for 24 Collin County, TX cities — government structures, current incumbents, discovery jurisdiction setup, headshots, and Compass stances where public record exists.

**Target features:**
- DB foundation — TX state + Collin County + 24 city governments, chambers, offices in essentials schema
- Incumbent officials — Mayor + City Council for all 24 cities, prioritized Plano → McKinney → Allen → Frisco → Murphy → Celina → Prosper → Richardson → Tier 3 → Tier 4
- Discovery setup — all 24 cities in discovery_jurisdictions (collincountyvotes.gov source, Census GEOIDs)
- Headshots — find, resize (600×750 Lanczos q90), upload for Tier 1+2 politicians
- Compass stances — stance research for Plano, McKinney, Allen tier; best-effort for Tier 2

**Parked from v2.2 (backlog):**
- Race completeness audit (Phase 9)
- Compass stances integration for CA/IN (Phase 10)
- Indiana local races (Phase 11)
- Admin Discovery UI auth fix (Run Discovery 401 blocker)

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
- ✓ Jurisdiction registry — config-driven table of covered areas with election authority URLs — v2.1
- ✓ Claude discovery agent — citation-required structured output via forced tool_choice; finds candidates from official sources — v2.1
- ✓ Confidence scoring — official (domain allowlist), matched (fuzzy name ≥85%), uncertain (neither) — v2.1
- ✓ Staging queue — candidate_staging table; uncertain candidates held for admin approval — v2.1
- ✓ Auto-upsert — official/matched candidates with resolved race_id upserted directly to race_candidates — v2.1
- ✓ Admin approve/dismiss endpoints — approve triggers upsert to race_candidates; dismiss records reason — v2.1
- ✓ Admin staging review UI — JWT-gated React page with race grouping, confidence badges, urgency indicators, optimistic actions — v2.1
- ✓ On-demand discovery trigger — POST /admin/discover/jurisdiction/:id and /discover/race/:id — v2.1
- ✓ Weekly cron discovery — Sunday 02:00 UTC, sequential processing, in-process lock, auto-upsert enabled — v2.1
- ✓ Discovery run log — every run recorded to discovery_runs with status, counts, raw agent JSONB — v2.1
- ✓ Admin email notifications — urgency-aware review email, zero-candidate regression alert, failure alert — v2.1
- ✓ New jurisdiction onboarding — adding a discovery_jurisdictions row is sufficient to enable discovery and scheduling — v2.1
- ✓ Proximity-aware cron — daily cadence within 30 days of election, configurable per jurisdiction — v2.1

### Active

<!-- Current scope. Building toward these. — v3.0 -->

- [ ] TX DB foundation — essentials.governments + chambers + offices for TX state, Collin County, and 24 cities
- [ ] Tier 1 officials — Plano, McKinney, Allen, Frisco incumbents in essentials.politicians with contact info
- [ ] Tier 2 officials — Murphy, Celina, Prosper, Richardson incumbents in essentials.politicians
- [ ] Tier 3-4 officials — remaining 16 cities incumbents where findable online
- [ ] Discovery jurisdictions — all 24 cities in essentials.discovery_jurisdictions (collincountyvotes.gov, Census GEOIDs, allowed_domains)
- [ ] Headshots — Tier 1+2 politicians found, resized 600×750 Lanczos q90, uploaded
- [ ] Compass stances — Plano/McKinney/Allen tier researched and ingested; Tier 2 best-effort

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
- **Shipped v2.0**: Dedicated Elections page at `/elections` — 4 phases, 4 plans complete (2026-04-13).
- **Shipped v2.1**: Claude candidate discovery pipeline — 3 phases, 9 plans, 18/18 requirements (2026-04-25). ~1,733 LOC TypeScript in 6 core discovery files.
- **Discovery cost**: ~$0.017/run with claude-sonnet-4-6; $20 API credits loaded 2026-04-24.
- **Database state**: 2 elections (2026 Indiana Primary May 5, 2026 LA County Primary June 2), 61 races, 124+ candidates, 6,928 geofence boundaries. Discovery pipeline now auto-populates candidates.
- **Data gaps (accounts team backlog)**: CA Governor challenger candidates (10 filed, not seeded); LAUSD sub-district geofences pending; lavote.gov election ID changes each cycle (mandatory manual update).
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
| Forced tool_choice=report_candidates | 'any'/'auto' lets Claude pick web_search as final call, producing no typed results — forced tool is the only reliable citation-required output | ✓ Good — v2.1 |
| NAME_MATCH_THRESHOLD = 0.85 | 0.80 produced too many false-positive matches; 0.85 locked as project-wide constant | ✓ Good — v2.1 |
| No Postgres transaction in discovery orchestrator | Run row IS the audit trail; partial staging failures preserved and visible, not rolled back | ✓ Good — v2.1 |
| confidence + flagged computed independently | official + flagged=true = official source with no race in DB (ballot-completeness radar) | ✓ Good — v2.1 |
| Dual-router JWT+token staging pattern | JWT-gated browser router + X-Admin-Token server-to-server router under same prefix; auth at route level not mount level | ✓ Good — v2.1 |
| In-process lock (not Redis) for discovery sweep | Single-instance Render deployment; process restart clears lock; 2h TTL guards slow sweeps | ✓ Good — v2.1 |
| Sequential jurisdiction processing in cron | Never Promise.all — exhausts Anthropic rate limit quota with no usable output | ✓ Good — v2.1 |
| web_search max_uses: 1 (with sourceUrl) / 2 (without) | Prevents quota exhaustion per discovery run | ✓ Good — v2.1 |

---
*Last updated: 2026-04-30 after v3.0 milestone start (v2.2 parked, TX expansion begins)*
