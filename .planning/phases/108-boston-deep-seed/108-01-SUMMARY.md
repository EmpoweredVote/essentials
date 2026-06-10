---
phase: 108-boston-deep-seed
plan: 01
subsystem: database
tags: [postgres, postgis, arcgis, geofences, boston, massachusetts, city-government]

# Dependency graph
requires:
  - phase: 107-ma-town-geofences
    provides: MA G4040 COUSUB town boundaries; Boston G4110 geofence (geo_id=2507000) present from v5.0
provides:
  - 9 Boston council district geofences (mtfcc=X0013, state='25') in geofence_boundaries
  - City of Boston government row (name='City of Boston, Massachusetts, US', geo_id='2507000')
  - Boston City Council chamber (name='Boston City Council')
  - 11 district rows (1 LOCAL_EXEC + 1 LOCAL at-large + 9 LOCAL per-district)
  - 14 politicians (Mayor Wu + 4 at-large + 9 district councillors) with external_ids -2507000001..-2507000014
  - 14 offices with 0 NULL office_id, office_id back-fill complete
  - Migration 347 in supabase_migrations.schema_migrations ledger
affects:
  - 108-02 (school committee — references City of Boston government row)
  - 108-03 (headshots — references politician external_ids)
  - MA-DEEP-01 (Boston address routing with district councillors)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ArcGIS bulk-first with per-DISTRICT fallback fetch strategy for Boston council boundaries
    - X0013 mtfcc for Boston council district geofences (extends Portland X0012 registry)
    - Boston external_id scheme: -2507000001 (Mayor) through -2507000014 (District 9 councillor)
    - Single City Council chamber covering both at-large and district councillors (Cambridge pattern)

key-files:
  created:
    - C:/EV-Accounts/backend/scripts/load-boston-council-boundaries.ts
    - C:/EV-Accounts/backend/migrations/347_boston_government.sql
    - C:/EV-Accounts/backend/scripts/_apply-migration-347.ts

key-decisions:
  - "Boston bulk ArcGIS fetch (where=1=1) returns all 9 features — no per-DISTRICT fallback needed in practice (unlike Portland OR which had silent truncation at 3/4)"
  - "Single City Council chamber covers both at-large and district seats (Cambridge single-chamber precedent — simpler than two-chamber split)"
  - "Liz Breadon office title='City Councillor' not 'City Council President' (procedural title, Alexandria precedent A1)"
  - "D-07 CONTEXT.md error overridden: Boston has 9 district + 4 at-large seats (not all at-large); 9 per-district geofences loaded with mtfcc=X0013"

patterns-established:
  - "Boston council district geo_id pattern: boston-ma-council-district-{N} (N=1..9)"
  - "ArcGIS FeatureServer DISTRICT field is integer (not string like Portland OR); bulk fetch returns all 9 successfully"
  - "MA district rows: state='ma' lowercase; MA government rows: state='MA' uppercase"
  - "geofence_boundaries for Boston council districts: state='25' (MA FIPS numeric string)"

requirements-completed: [MA-DEEP-01]

# Metrics
duration: 9min
completed: 2026-06-10
---

# Phase 108 Plan 01: Boston City Government Summary

**City of Boston government seeded with Mayor Wu + 13 City Councillors (9 district + 4 at-large) via ArcGIS-sourced X0013 geofences and migration 347 — any Boston address now routes to correct LOCAL section**

## Performance

- **Duration:** 9 min
- **Started:** 2026-06-10T18:02:29Z
- **Completed:** 2026-06-10T18:12:01Z
- **Tasks:** 3
- **Files modified:** 3 (all in C:/EV-Accounts/backend, outside git repo)

## Accomplishments

- Loaded 9 Boston council district geofences (mtfcc=X0013, state='25') from City ArcGIS FeatureServer via bulk GeoJSON fetch (all 9 returned in single bulk call — no truncation observed)
- Applied migration 347: 1 government, 1 chamber, 11 district rows, 14 politicians, 14 offices; all 7 post-verification gates passed
- Edward M. Flynn correctly linked to District 2 (boston-ma-council-district-2); at-large councillors linked to geo_id='2507000' LOCAL district; office_id back-fill complete (0 NULL)

## Task Commits

Tasks executed in C:/EV-Accounts/backend (outside git repo — no per-task git commits). All production DB changes applied via _apply-migration-347.ts runner.

1. **Task 1: Create and run load-boston-council-boundaries.ts** - ArcGIS loader, dry-run + live run successful, 9 X0013 rows in geofence_boundaries
2. **Task 2: Write migration 347** - 347_boston_government.sql written with all acceptance criteria met
3. **Task 3: Write apply runner and apply migration 347** - _apply-migration-347.ts written and executed; all 7 smoke tests passed

**Plan metadata:** committed in final SUMMARY commit

## Files Created/Modified

- `C:/EV-Accounts/backend/scripts/load-boston-council-boundaries.ts` - ArcGIS FeatureServer loader for 9 Boston council district geofences (X0013, bulk-first with per-DISTRICT fallback)
- `C:/EV-Accounts/backend/migrations/347_boston_government.sql` - City of Boston government + City Council chamber + 11 districts + 14 politicians + 14 offices + 7-gate post-verification DO block + ledger entry 347
- `C:/EV-Accounts/backend/scripts/_apply-migration-347.ts` - Apply runner with 7 smoke tests; confirmed Edward M. Flynn in District 2

## Decisions Made

- **Boston council structure correction (CONTEXT.md D-07 override):** CONTEXT.md incorrectly stated Boston City Council is all at-large. Research confirmed 9 single-member district seats + 4 at-large. Per-district geofences loaded first; PLAN.md already included this correction in the objective.
- **Single chamber for City Council:** One "City Council" chamber covers all 13 seats (Cambridge single-chamber pattern). Simpler than two-chamber split; district vs. at-large distinction handled by district_type/geo_id.
- **Liz Breadon title='City Councillor':** She is Council President (procedural leadership role) but title follows Alexandria Vice Mayor precedent — procedural titles are not separate offices.
- **Bulk ArcGIS fetch successful:** Unlike Portland OR (which needed per-OBJECTID fallback due to silent truncation), Boston's FeatureServer returned all 9 features in a single `where=1=1` bulk query. The per-DISTRICT fallback code remains in the script for safety.

## Deviations from Plan

None — plan executed exactly as written. The PLAN.md already incorporated the RESEARCH.md correction about Boston's hybrid council structure (D-07 override was documented in the plan objective before execution).

## Issues Encountered

- `npx tsx` not on PATH in Bash environment (tsx not in node_modules/.bin symlink). Used `node node_modules/tsx/dist/cli.cjs` directly as the invoke pattern. This is an environment quirk, not a blocker.

## User Setup Required

None - migration applied directly to production DB via apply runner. No external service configuration required.

## Next Phase Readiness

- Phase 108 Plan 02 (Boston School Committee) can proceed: City of Boston government row exists, external_id range -2502790001..-2502790007 is clear
- Phase 108 Plan 03 (Headshots) can proceed after Plan 02: all 14 politician external_ids -2507000001..-2507000014 have politician rows in DB
- MA-DEEP-01 partially satisfied: Boston address routing to LOCAL section with Mayor Wu + district councillor + at-large councillors requires the PIP (point-in-polygon) engine to route via the new X0013 geofences

## Known Stubs

None — all 14 politicians and offices are fully seeded with real data. No placeholder values.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundaries introduced. ArcGIS geometry input is sanitized via parameterized SQL ($N placeholders) and ST_MakeValid pipeline per T-108-01 and T-108-02.

## Self-Check

### Files Created

- [x] C:/EV-Accounts/backend/scripts/load-boston-council-boundaries.ts — FOUND (created, outside git)
- [x] C:/EV-Accounts/backend/migrations/347_boston_government.sql — FOUND (created, outside git)
- [x] C:/EV-Accounts/backend/scripts/_apply-migration-347.ts — FOUND (created, outside git)

### DB Verification (from smoke test output)

- [x] Boston government rows: 1 (expected 1) — PASS
- [x] Boston council politicians: 14 (expected 14) — PASS
- [x] Boston districts: 11 (expected 11) — PASS
- [x] Boston offices: 14 (expected 14) — PASS
- [x] Politicians with NULL office_id: 0 (expected 0) — PASS
- [x] Ledger entry 347: PRESENT — PASS
- [x] District 2 councillor: Edward M. Flynn — PASS
- [x] Geofence count (X0013, state='25'): 9 — PASS

## Self-Check: PASSED

---
*Phase: 108-boston-deep-seed*
*Completed: 2026-06-10*
