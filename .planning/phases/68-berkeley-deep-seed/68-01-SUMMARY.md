---
phase: 68-berkeley-deep-seed
plan: "01"
subsystem: essentials-data
tags: [berkeley, geofences, socrata, postgresql, postgis, tiger]

requires:
  - phase: 57-ca-geofences
    provides: "Berkeley city TIGER boundary (geo_id=0606000, G4110) required for routing"

provides:
  - "8 Berkeley council district polygons in geofence_boundaries (mtfcc=X0009)"
  - "Berkeley government scaffolding: 1 govt row + 3 chambers + 9 district rows"
  - "Loader script: load-berkeley-council-boundaries.ts (Socrata, idempotent)"
  - "Smoke test: smoke-berkeley-geofences.ts (3-gate, exits 0)"

affects:
  - "68-02 (FKs into chambers + districts created here)"
  - "Phase 69 (RCV election_method TODO on all 3 chambers)"

tech-stack:
  added: []
  patterns:
    - "Socrata GeoJSON loader pattern (native WGS84, no outSR — distinct from ArcGIS loaders)"
    - "X0009 MTFCC claimed for Berkeley council districts (X0010 is next)"

key-files:
  created:
    - "C:/EV-Accounts/backend/scripts/load-berkeley-council-boundaries.ts"
    - "C:/EV-Accounts/backend/scripts/smoke-berkeley-geofences.ts"
    - "C:/EV-Accounts/backend/migrations/213_berkeley_government_structure.sql"
  modified: []

key-decisions:
  - "Berkeley Socrata endpoint returns native WGS84 — no outSR=4326 needed (unlike ArcGIS loaders)"
  - "Field name is 'district' (lowercase, string values '1'-'8') — NOT 'DISTRICT' or 'sup_dist_num'"
  - "X0009 MTFCC claimed for Berkeley council districts"
  - "City Attorney NOT included — appointed by Council, not elected"
  - "Both Mayor and Auditor share single LOCAL_EXEC district (geo_id=0606000)"

duration: 25min
completed: 2026-05-22
---

# Phase 68 Plan 01: Berkeley Geofences + Government Structure Summary

**8 Berkeley council district polygons loaded from Socrata (X0009), Berkeley government scaffolding created (1 govt + 3 RCV chambers + 9 districts), smoke test exits 0**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-05-22
- **Tasks:** 2
- **Files modified:** 3 (all in C:/EV-Accounts/backend — outside essentials git repo)

## Accomplishments

- Loaded 8 Berkeley council district polygons from `data.cityofberkeley.info/resource/c8zs-8y7x.geojson` into `essentials.geofence_boundaries` with mtfcc='X0009', state='06'
- Applied migration 213: City of Berkeley government row + 3 chambers (Mayor, City Council, City Auditor — all with Phase 69 RCV TODO) + 8 LOCAL council districts + 1 LOCAL_EXEC district
- Smoke test passes all 3 gates: 8 rows count, Berkeley City Hall → District 4, Oakland → 0 rows

## Task Commits

Scripts and migration live in C:/EV-Accounts/backend (not a git repo). No code commits in essentials repo.

## Files Created/Modified

- `C:/EV-Accounts/backend/scripts/load-berkeley-council-boundaries.ts` — Socrata GeoJSON loader, pre-flight X0009 claim check, ON CONFLICT DO NOTHING idempotent
- `C:/EV-Accounts/backend/scripts/smoke-berkeley-geofences.ts` — 3-gate smoke test (count + Berkeley City Hall + Oakland negative)
- `C:/EV-Accounts/backend/migrations/213_berkeley_government_structure.sql` — Applied to live DB; government + chambers + districts

## Decisions Made

- **Socrata vs ArcGIS**: Berkeley uses Socrata (native WGS84). No `outSR=4326` param. Field is `district` (lowercase string), not `DISTRICT` (ArcGIS) or `sup_dist_num` (SF DataSF).
- **X0009 MTFCC**: Claimed for Berkeley council districts. X0010 is next available.
- **No City Attorney chamber**: Berkeley City Attorney is appointed by City Council — not elected, no chamber created.
- **Shared LOCAL_EXEC district**: Both Mayor and City Auditor offices in plan 68-02 will FK to single LOCAL_EXEC row (geo_id='0606000').

## Verification Gate Outputs

**Loader run:**
```
Pre-flight: X0009 is unclaimed — proceeding
Available fields: district, council_member, ...
Inserted: 8, Skipped: 0
Total Berkeley council district rows in geofence_boundaries: 8
```

**Re-run (idempotency):**
```
Pre-flight: X0009 has 8 existing Berkeley rows — re-run OK
Inserted: 0, Skipped: 8
```

**Centroid check (WGS84 confirmed):**
```sql
geo_id=berkeley-council-district-1, centroid=POINT(-122.29844456520428 37.87466500309823)
-- lon≈-122.29, lat≈37.87 — WGS84 degrees confirmed (no CRS issue)
```

**Migration 213 SQL gates:**
- Gate A: `SELECT COUNT(*) FROM essentials.governments WHERE name='City of Berkeley';` → **1**
- Gate B: Chambers → **3 rows: City Auditor, City Council, Mayor**
- Gate C: `SELECT COUNT(*) FROM essentials.districts WHERE geo_id LIKE 'berkeley-council-district-%' AND district_type='LOCAL' AND state='CA';` → **8**
- Gate D: `SELECT district_type FROM essentials.districts WHERE geo_id='0606000' AND state='CA' AND district_type IN ('LOCAL','LOCAL_EXEC');` → **LOCAL_EXEC**
- Gate E: Re-apply migration → 0 errors, 0 duplicate rows (idempotent)

**Smoke test:**
```
SC1: PASS (8 rows)
SC2: PASS (Berkeley City Hall → berkeley-council-district-4 / District 4)
SC3: PASS (Oakland returns 0 rows — no false positive)
ALL ASSERTIONS PASSED
```

## Pre-flight for 68-02

- `-680xxx external_id range is clear`: `SELECT external_id FROM essentials.politicians WHERE external_id BETWEEN -681000 AND -680000;` → **0 rows** ✓
- Berkeley City Hall resolves to **District 4** — use this for routing cross-reference in 68-02

## Deviations from Plan

None — plan executed exactly as written. Loader used Socrata pattern correctly; migration applied clean.

## Issues Encountered

None.

## Next Phase Readiness

- 68-02 can proceed: all 3 chambers and 9 district rows exist; -680xxx range is clear
- Berkeley City Hall (lon=-122.2726, lat=37.8709) routes to **berkeley-council-district-4** (District 4) via X0009 boundaries
- Next migration is 214 (213 applied 2026-05-22)

---
*Phase: 68-berkeley-deep-seed*
*Completed: 2026-05-22*
