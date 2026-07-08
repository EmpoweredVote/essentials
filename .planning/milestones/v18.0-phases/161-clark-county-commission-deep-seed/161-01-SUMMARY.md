---
phase: 161-clark-county-commission-deep-seed
plan: 01
status: complete
completed: 2026-06-23
requirements: [CLARK-01]
migration: 1055
---

# Plan 161-01 Summary — Clark County Commission structural seed

**Goal achieved:** Standalone government "Clark County, Nevada, US" + chamber "Board of County Commissioners" + 7 commissioners, each linked to the single pre-existing COUNTY district (geo_id 32003, state='nv'), office_id back-filled, 0 section-split. Migration 1055 applied + registered.

## Wave-0 probes (inline orchestrator)
- **P1 ledger MAX:** 1053 → next structural **1055** ✓
- **P2 external_id collisions (−3200307..−3200301):** 0 ✓
- **P3 COUNTY district:** 1 row, geo_id 32003, district_type COUNTY, **state='nv' lowercase**, id f3708f34-… ✓
- No pre-existing Clark County government (greenfield) ✓; governments schema (id,name,type,state,city,geo_id) + Multnomah precedent (type='County', state UPPERCASE, city NULL) confirmed.

## Checkpoint
Operator approved the 7-member roster as-is. **Chair = Michael Naft (District A)** — corrected from Kirkpatrick during research; Vice-Chair = McCurdy (D); both modeled as title-on-seat. photo_license default `us_government_work` for Plan 02. No vacancies.

## Task-3 apply + audit (inline orchestrator, via psql)
Applied `1055_clark_county_commission.sql`: government INSERT, chamber INSERT, district INSERT no-op (already loaded), 7 office INSERTs, UPDATE 7 back-fill. In-migration DO block: **PASSED (gov=1, offices=7, split_orphans=0)**.

| Audit | Expected | Actual |
|-------|----------|--------|
| BCC offices (Clark County govt) | 7 | **7** ✓ |
| County-district linkage (geo_id 32003, state='nv') | 7 | **7** ✓ |
| office_id back-filled | 7 | **7** ✓ |
| Casing (Clark-scoped DISTINCT state) | 'nv' | **nv** ✓ |
| Section-split (Clark commissioners >1 govt) | 0 | **0** ✓ |
| Ledger (1055/1056 registered) | only 1055 | **1055**; MAX **1055** ✓ |

> Note: a broad casing query keyed only on chamber name "Board of County Commissioners" returns `md,nv` because St. Mary's County, MD shares the chamber name — a query artifact, NOT a defect. Government-scoped casing is `nv` only.

## Handoff — external_id → UUID map (Plans 02 + 03 consume)
| Dist | ext_id | UUID | name |
|------|--------|------|------|
| A | -3200301 | 033cf882-aa31-4f1f-b9e0-3b601da1703a | Michael Naft (Chair) |
| B | -3200302 | 61cac872-e8f3-4396-aacd-cf1be6509a92 | Marilyn Kirkpatrick |
| C | -3200303 | ef0d7745-8530-4588-aab5-80f6ba175725 | April Becker (R) |
| D | -3200304 | 6cdeb125-85fa-4e9c-80d3-7528a890fd0b | William McCurdy II (Vice-Chair) |
| E | -3200305 | 5ffa5251-9255-44ef-a5d5-8e158f29c6e5 | Tick Segerblom |
| F | -3200306 | 8b40944d-30a6-42f4-b4d0-bfa9427e36a6 | Justin Jones |
| G | -3200307 | b9411246-f74d-4502-9f6b-ed5facc37fa6 | James B. Gibson |

## Deviations
- Executor reworded a Step-4 comment to avoid the grep gate counting an 8th `ON CONFLICT (external_id) DO NOTHING` occurrence — no SQL change.

## Artifacts
- `C:/EV-Accounts/backend/migrations/1055_clark_county_commission.sql` (structural, registered '1055', idempotent)
