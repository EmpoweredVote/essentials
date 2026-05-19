---
phase: 49-me-geofences
verified: 2026-05-19T06:00:27Z
status: passed
score: 5/5 must-haves verified
---

# Phase 49: ME Geofences Verification Report

**Phase Goal:** Maine TIGER boundaries are loaded and any Maine address correctly routes to federal, state, and city representatives.
**Verified:** 2026-05-19T06:00:27Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth                                                                 | Status     | Evidence                                                                 |
|----|-----------------------------------------------------------------------|------------|--------------------------------------------------------------------------|
| 1  | All 5 MTFCC boundary layers loaded with correct counts               | VERIFIED   | Live DB: G4020=16, G4110=23, G5200=2, G5210=35, G5220=151 (227 total)   |
| 2  | Portland address returns ME-01 (G5200 geo_id=2301)                   | VERIFIED   | ST_Covers query: G5200 geo_id=2301 "Congressional District 1"            |
| 3  | Bangor address returns correct G5210 senate + G5220 house districts   | VERIFIED   | ST_Covers query: G5210 geo_id=23009 (SD 9), G5220 geo_id=23021 (HD 21)  |
| 4  | Portland address returns G4110 city boundary (geo_id='2360545')      | VERIFIED   | ST_Covers query: G4110 geo_id=2360545 "Portland city"                    |
| 5  | Rural Norridgewock returns no G4110 row                              | VERIFIED   | ST_Covers query: only G4020/G5200/G5210/G5220 — no G4110 row            |

**Score:** 5/5 truths verified

### Must-Haves Checklist

- [x] All 23 Maine city G4110 PLACE boundaries, 2 congressional G5200 boundaries, 35 SLDU senate boundaries, 151 SLDL house boundaries, and 16 county G4020 boundaries loaded in essentials.geofence_boundaries with state='23' — **Live DB count query: G4020=16, G4110=23, G5200=2, G5210=35, G5220=151**
- [x] A Portland address returns ME-01 (NATIONAL_LOWER) when queried — **ST_Covers(-70.2553, 43.6591): G5200 geo_id=2301 "Congressional District 1"**
- [x] A Bangor address returns the correct STATE_UPPER senate district and STATE_LOWER house district — **ST_Covers(-68.7712, 44.8012): G5210 geo_id=23009 (SD 9), G5220 geo_id=23021 (HD 21)**
- [x] A Portland address returns LOCAL city boundary row (geo_id='2360545') — **ST_Covers(-70.2553, 43.6591): G4110 geo_id=2360545 "Portland city"**
- [x] A rural Maine address outside any city returns the correct congressional and state legislative districts with no LOCAL row — **Norridgewock ST_Covers(-69.7624, 44.5588): G4020 + G5200 + G5210 + G5220 present; NO G4110 row**

### Required Artifacts

| Artifact                                                              | Expected                         | Status   | Details                                                                    |
|-----------------------------------------------------------------------|----------------------------------|----------|----------------------------------------------------------------------------|
| `essentials.geofence_boundaries` rows for state='23'                 | 227 rows across 5 MTFCC types    | VERIFIED | G4020=16, G4110=23, G5200=2, G5210=35, G5220=151                          |
| `load-state-tiger-boundaries.ts` ME in STATE_LAYER_ALLOWLIST         | ME registered                    | VERIFIED | `ME: new Set(['cd119', 'sldu', 'sldl', 'place', 'county'])`               |
| `load-state-tiger-boundaries.ts` ME in STATE_CITY_ASSERTIONS         | Portland city vintage gate       | VERIFIED | `ME: ['Portland city']` present in STATE_CITY_ASSERTIONS                   |
| `load-state-tiger-boundaries.ts` ME in STATE_RUN_MAKEVALID           | All layers get ST_MakeValid      | VERIFIED | `ME: new Set(['cd119', 'sldu', 'sldl', 'place', 'county'])` present        |
| `backend/scripts/smoke-me-geofences.ts`                              | Smoke test script for regression | VERIFIED | File exists at C:/EV-Accounts/backend/scripts/smoke-me-geofences.ts (89L) |
| `backend/scripts/verify-me-tiger-import.sql`                         | SQL verification gates           | VERIFIED | File created per 49-01-SUMMARY task record                                 |

### Key Link Verification

| From                          | To                                    | Via                     | Status   | Details                                                                |
|-------------------------------|---------------------------------------|-------------------------|----------|------------------------------------------------------------------------|
| Loader script                 | geofence_boundaries (state='23')      | ME allowlist + layers   | WIRED    | 227 rows present in live DB                                            |
| Point-in-polygon query        | Portland → ME-01 + city + county      | ST_Covers + state='23'  | WIRED    | All 5 expected MTFCCs returned for Portland coordinates                |
| Point-in-polygon query        | Bangor → ME-02 + city + county        | ST_Covers + state='23'  | WIRED    | All 5 expected MTFCCs returned for Bangor coordinates                  |
| Point-in-polygon query        | Norridgewock → districts (no city)    | ST_Covers + state='23'  | WIRED    | 4 rows returned (G4020/G5200/G5210/G5220); G4110 correctly absent      |

### Loader Modification Verification

```
grep -c "ME:" C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts
→ 3
```

ME appears in STATE_LAYER_ALLOWLIST (line 40), STATE_CITY_ASSERTIONS (line 50), and STATE_RUN_MAKEVALID (line 59) — all three required config structures.

### Anti-Patterns Found

None. All boundary rows loaded with valid geometries (0 invalid, 0 GeometryCollection per 49-01-SUMMARY gate 1 and 2).

### Human Verification Required

None. All success criteria are verifiable via point-in-polygon SQL queries against the live database.

## Gaps

None.

---

_Verified: 2026-05-19T06:00:27Z_
_Verifier: Claude (gsd-verifier)_
