---
phase: 173-nevada-playbook-retrospective-close
plan: "02"
subsystem: frontend-data + docs
tags: [coverage, nevada, v18.0, playbook, location-onboarding]
dependency_graph:
  requires: [".planning/v18.0-MILESTONE-AUDIT.md (Plan 01 output — purple-chip input set)"]
  provides:
    - "src/lib/coverage.js (NV block reconciled, CCSD plain)"
    - "LOCATION-ONBOARDING.md (NV rows + GOTCHAs + Nevada Quick Reference)"
  affects: ["Landing page NV grid (via COVERAGE_STATES import)", "locality typeahead", "Plan 03 (milestone close)"]
tech_stack:
  added: []
  patterns:
    - "hasContext flag-only edit (remove key for 0-stance jurisdictions; keep for >=1-stance)"
    - "LOCATION-ONBOARDING.md Quick Reference block pattern (NV follows CA/OR/MD/MA precedent)"
key_files:
  created: []
  modified:
    - src/lib/coverage.js
    - LOCATION-ONBOARDING.md
decisions:
  - "CCSD hasContext key removed (plain chip) — school-board compass deferred by design (D-01a); 0 stances confirmed by audit"
  - "Other 5 NV jurisdictions keep hasContext:true — all confirmed >=1 stance by Plan 01 audit (LV 36, Henderson 28, N.LV 18, Boulder City 19, Clark County 32)"
  - "NV GOTCHAs added to Step 1 (govt structure) rather than Steps 2/3 — standalone-county, MTFCCs, and casing are structure-level decisions"
  - "Nevada Quick Reference placed after MA Quick Reference section, before Step 1 — mirrors CA/OR/MD/MA block positioning"
metrics:
  duration_minutes: 25
  tasks_completed: 2
  files_created: 0
  files_modified: 2
  completed_date: "2026-06-30"
---

# Phase 173 Plan 02: Reconcile NV Coverage + Update Playbook — Summary

**One-liner:** Reconciled NV hasContext chips in coverage.js against the audit (CCSD plain, 5 cities/county keep purple chip) and added Nevada's full onboarding playbook footprint to LOCATION-ONBOARDING.md (6 rows + 3 GOTCHAs + Nevada Quick Reference block).

---

## What Was Built

### Task 1: coverage.js NV chip reconciliation

Single flag-only edit to `src/lib/coverage.js`:

- **Removed `hasContext: true`** from the CCSD entry (`browseGeoId: '3200060'`) — school-board compass is deferred by design (D-01a); 0 stances confirmed by the Plan 01 audit. CCSD remains listed and browsable as a plain entry.
- **Kept `hasContext: true`** on all other 5 NV jurisdictions, confirmed against Plan 01 audit counts:

| Jurisdiction | geo_id | Stance rows | Chip decision |
|---|---|---|---|
| City of Las Vegas | 3240000 | 36 | kept hasContext:true |
| City of Henderson | 3231900 | 28 | kept hasContext:true |
| City of North Las Vegas | 3251800 | 18 | kept hasContext:true |
| City of Boulder City | 3206500 | 19 | kept hasContext:true |
| Clark County | 32003 | 32 | kept hasContext:true |
| Clark County School District | 3200060 | 0 | hasContext key REMOVED (plain) |

- Verified `STATE_NAME_TO_ABBREV` has `nevada: 'NV'` (legislature ride-along auto-builds via `COVERAGE_BROWSE_STATES` — no separate grid row added).
- Node verify command exits 0: `NV coverage reconciled OK`.

### Task 2: LOCATION-ONBOARDING.md

Three additions:

**(A) 6 NV Cities Onboarded rows** appended after Bellflower (last prior row):
- City of Las Vegas: geo_id 3240000, X0015 wards, ext -3205001..-3205007 (Mayor Berkley -3205001 + 6 council), 36 stances, purple chip
- City of Henderson: geo_id 3231900, X0016 wards, ext -3206001..-3206005, Akamai WAF-403 fallback chain, 28 stances, purple chip
- City of North Las Vegas: geo_id 3251800, X0017 wards (GISMO PLACE=80), ext -3207xxx, WAF-403 → Wikimedia, 18 stances, purple chip
- City of Boulder City: geo_id 3206500, at-large/no wards, ext -3208xxx, flybouldercity.com NO-WAF, 19 stances, purple chip
- Clark County School District: geo_id 3200060/G5420, 7 elected + 4 appointed trustees, 0 stances by design, 7/11 headshots, plain chip
- Clark County: geo_id 32003, standalone county NOT under State of NV, ext -3200301..-3200307, Chair Naft title-on-seat, 32 stances, purple chip

LV ext_id range is recorded as **-3205001..-3205007** — correctly distinct from Henderson's -3206001..-3206005.

**(B) 3 net-new NV GOTCHAs** added to Step 1 (after last MA GOTCHA, before schema decisions table):
1. Clark County standalone-county-not-under-state pattern (D-06)
2. Custom ward MTFCCs per city (X0015/X0016/X0017 — do not mix) (D-06)
3. Lowercase 'nv' casing everywhere except STATE_EXEC/NATIONAL (D-06)

Two additional NV GOTCHAs captured in the Nevada Quick Reference block (WAF map, Wikimedia bot UA requirement).

**(C) `## Nevada Quick Reference` block** inserted between MA Quick Reference and Step 1, covering:
- Custom ward MTFCCs (X0015/X0016/X0017/G5420)
- Standalone-county-not-under-state pattern
- Per-city WAF map (Henderson Akamai-403, N.LV WAF-403→Wikimedia, Boulder City/Clark County NO-WAF)
- Lowercase 'nv' casing rule
- Wikimedia descriptive-UA requirement
- Legislature surfaces via browse_state_officials=NV (not city-grid row)
- School-board compass deferred rule
- ext_id schemes (all 8 ranges, LV -3205001..-3205007 distinct from Henderson -3206001..-3206005)
- geo_ids (all 6 metro jurisdictions)
- Browse params (statewide, city/county, CCSD)
- Legislature headshot source (archive.leg.state.nv.us/84th2027)
- Migration counter convention (audit-only unregistered; next migration 1115)

---

## Deviations from Plan

None — plan executed exactly as written. No GOTCHAs added to Steps 2/3 beyond what was already covered in the Quick Reference block (D-06 themes were captured between the Quick Reference table and the Step 1 GOTCHA callouts without duplication).

---

## Known Stubs

None.

---

## Threat Flags

None — static data-array flag edit (one boolean key removed) + markdown documentation additions. No new network endpoints, auth paths, file access patterns, or schema changes introduced.

---

## Self-Check: PASSED

- `src/lib/coverage.js` CCSD hasContext removed: CONFIRMED (node verify exits 0 with "NV coverage reconciled OK")
- `src/lib/coverage.js` other 5 NV entries unchanged: CONFIRMED (Las Vegas/Henderson/N.LV/Boulder City/Clark County all hasContext:true)
- `STATE_NAME_TO_ABBREV` has nevada:'NV': CONFIRMED
- LOCATION-ONBOARDING.md contains "Nevada Quick Reference": CONFIRMED (grep -qi OK)
- LOCATION-ONBOARDING.md contains all 6 jurisdiction names: CONFIRMED
- X0016 present: CONFIRMED
- X0017 present: CONFIRMED
- browse_state_officials=NV present: CONFIRMED
- ext-range -3200301 present: CONFIRMED
- LV ext-range -3205001 present: CONFIRMED
- Task 1 commit 06a9db3: CONFIRMED
- Task 2 commit bd57975: CONFIRMED
