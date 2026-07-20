---
phase: 212-backend-place-name-resolver-national-fallback
plan: 01
subsystem: database
tags: [postgres, pg_trgm, gin-index, gazetteer, migration, accounts-api]

# Dependency graph
requires: []
provides:
  - "D-02 verified fact: nationwide US House CD data (G5200 boundaries + NATIONAL_LOWER districts) is already complete in production — no re-ingest needed"
  - "Migration 1377: GIN trigram indexes on essentials.governments.name + essentials.geofence_boundaries.name"
  - "Migration 1378: essentials.gazetteer_places + essentials.gazetteer_counties reference tables with GIN trgm name indexes (no population column)"
affects: [212-02-gazetteer-ingest, 212-03-resolver-migration-apply, 212-04-resolver-endpoint, 212-05-national-fallback-wiring]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "GIN trgm index idiom mirrored verbatim from migration 040: USING GIN (public.f_unaccent(lower(name)) extensions.gin_trgm_ops)"
    - "IF NOT EXISTS on every CREATE — idempotent re-apply safe for both migrations"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/1377_location_search_trgm_indexes.sql
    - C:/EV-Accounts/backend/migrations/1378_gazetteer_places_counties.sql
  modified: []

key-decisions:
  - "D-02 converted from assumption to verified fact via live psql pre-flight audit — no blind re-ingest task authored"
  - "1378 Gazetteer tables carry no population column, per amended D-06 (alphabetical name tiebreak instead)"

patterns-established:
  - "Wave-0 DB pre-flight audit pattern: verify prior-phase claims via direct psql count before writing dependent tasks, rather than trusting stale context assumptions"

requirements-completed: [RSLV-01, RSLV-02, RSLV-05, RSLV-06]

# Metrics
duration: 12min
completed: 2026-07-20
---

# Phase 212 Plan 01: Wave-0 DB Pre-Flight Audit & Resolver/Gazetteer Migration Authoring Summary

**Verified nationwide US House CD data is already complete in production (436 G5200 boundaries, 437 NATIONAL_LOWER tiger_geoid districts) and authored the two migrations the place-name resolver needs — GIN trgm indexes (1377) + Gazetteer reference tables (1378) — with zero live-DB writes.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-20T22:43:26Z
- **Completed:** 2026-07-20T22:46:25Z
- **Tasks:** 2 completed
- **Files modified:** 2 (both newly created)

## Accomplishments
- Ran the live psql pre-flight audit against production and converted 212-CONTEXT.md's D-02 "ingest from scratch" premise into a verified fact: **no re-ingest required**.
- Authored migration 1377 (resolver trgm indexes) reusing the migration-040 idiom verbatim — no extension/wrapper re-creation.
- Authored migration 1378 (Gazetteer nationwide reference tables) as the canonical column-set contract for the Plan 02 ingest script, explicitly omitting a population column per the amended D-06 tiebreak decision.
- Both migration files committed locally in the EV-Accounts repo (not pushed — live apply is gated to Plan 03).

## Task Commits

Each task was committed atomically:

1. **Task 1: Wave-0 DB pre-flight audit** — no commit (read-only psql queries against the live DB; no repo files created). Counts recorded below.
2. **Task 2: Author migrations 1377 + 1378** — `d94c3b97` (feat, EV-Accounts repo, master branch, local only)

**Plan metadata:** (this commit, essentials repo)

## Files Created/Modified
- `C:/EV-Accounts/backend/migrations/1377_location_search_trgm_indexes.sql` - GIN trgm indexes on governments.name + geofence_boundaries.name
- `C:/EV-Accounts/backend/migrations/1378_gazetteer_places_counties.sql` - gazetteer_places + gazetteer_counties tables + their GIN trgm name indexes

## Task 1: Pre-Flight Audit Results (verbatim)

Run against the live production DB (`postgresql://postgres.kxsdzaojfaibhuzmclfq@aws-0-us-west-1.pooler.supabase.com/postgres`) via psql:

```
(a) SELECT count(*) FROM essentials.geofence_boundaries WHERE mtfcc = 'G5200';
    => 436   (expect >= 435 -- PASS)

(b) SELECT count(*) FROM essentials.districts WHERE district_type = 'NATIONAL_LOWER' AND tiger_geoid IS NOT NULL;
    => 437   (expect >= 435 -- PASS)

(c) SELECT mtfcc, count(*) FROM essentials.geofence_boundaries WHERE mtfcc IN ('G5200','G5200V26') GROUP BY mtfcc;
    => G5200      | 436
       G5200V26   | 26
```

**Determination: D-02 verified — no re-ingest.** Both counts exceed the 435-district threshold, confirming the Phase 116/125 nationwide US House ingest (from an earlier milestone) remains complete and unregressed. Additionally, direct read of `C:/EV-Accounts/backend/src/lib/geoIdGuard.ts` (lines 16-29) confirms the general-purpose overlap-guard maps `mtfcc='G5200'` to `district_type='NATIONAL_LOWER'` and **explicitly excludes** `G5200V26` (the 2026 redistricting-vintage boundaries, 26 rows) from that catch-all — reserving it for the elections opt-in join only (`electionService.ts`). The "who represents you now" resolver path correctly uses the current-officeholder G5200 vintage, not the redistricting vintage.

This converts D-02's mechanism from "ingest from scratch" (as CONTEXT.md's original wording implied) to "verify only" — no new CD-loading task was authored, matching the RESEARCH.md's primary recommendation.

## Decisions Made
- **D-02 resolved as verify-only, not re-ingest** — the live pre-flight audit is decisive evidence; no ingest task was written for this plan or handed off to a later plan.
- **1378's column set intentionally omits population** — per the amended D-06 planning decision (2026-07-20), the resolver's tertiary ranking tiebreak is alphabetical name (A→Z), not population, so no separate Census population dataset is ingested alongside the Gazetteer Places/Counties data. Reinforced with an explicit top-of-file comment in the migration so the Plan 02 ingest script author does not accidentally reintroduce a population column.
- **Both migrations use IF NOT EXISTS everywhere** (indexes and tables) — idempotent, safe to re-run in Plan 03's live apply without a pre-check.

## Deviations from Plan

None — plan executed exactly as written. The pre-flight audit outcome (counts complete, D-02 verify-only) matched the RESEARCH.md's own predicted primary recommendation; no shortfall branch was triggered.

## Issues Encountered
None. psql was available locally (`C:\Program Files\PostgreSQL\18\bin\psql`) and connected to the live DATABASE_URL from `C:/EV-Accounts/backend/.env` without issue — the CRITICAL_CROSS_REPO_RULES fallback path (recording a blocker if DB were unreachable) was not needed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 02 (Gazetteer ingest script) can proceed directly against the 1378 column-set contract (geo_id/name/state/lsad/aland_sqmi/intptlat/intptlong for places, same minus lsad for counties) — no population column to account for.
- Plan 03 (live migration apply, gated/BLOCKING) has both 1377 and 1378 ready and idempotency-guarded; the pre-flight audit results above should be re-referenced at that checkpoint rather than re-run from scratch (though a cheap re-check before apply is good practice given data can drift).
- No blockers. D-02's disposition is settled — no dependent plan needs to author a nationwide CD re-ingest task.

---
*Phase: 212-backend-place-name-resolver-national-fallback*
*Completed: 2026-07-20*
