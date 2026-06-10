---
phase: 109-ma-tier-2-cities
plan: "01"
subsystem: database
tags: [seeding, massachusetts, worcester, government, migration]
dependency_graph:
  requires:
    - Phase 107 (MA TIGER G4110 geofences for 58 MA cities — geo_id=2582000 must exist)
    - Phase 108 (migration counter — last migration was 350)
  provides:
    - Worcester government, chamber, 2 districts, 11 politicians, 11 offices (MA-TIER2-01 partially satisfied)
    - geo_id=2582000 no longer a section-split orphan
  affects:
    - essentials.governments (1 new row)
    - essentials.chambers (1 new row)
    - essentials.districts (2 new rows)
    - essentials.politicians (11 new rows)
    - essentials.offices (11 new rows)
    - supabase_migrations.schema_migrations (version '351')
tech_stack:
  added: []
  patterns:
    - "7-step city government migration pattern: pre-flight DO blocks → government/chamber/district INSERTs → WITH ins_p politician+office blocks → office_id back-fill → post-verification DO block → ledger INSERT"
    - "Tier 2 pattern: single city geo_id for all officials; ward/district in office title strings; no per-district geofences"
key_files:
  created:
    - C:/EV-Accounts/backend/migrations/351_worcester_government.sql
    - C:/EV-Accounts/backend/scripts/_apply-migration-351.ts
  modified: []
decisions:
  - "Option A for Mayor Petty: one office row in LOCAL_EXEC district (title='Mayor'), no separate at-large office row — his at-large membership is implicit in the Mayor role (A2 from research)"
  - "All 10 councillors share the single LOCAL district (geo_id='2582000'); ward/district encoded in title string per Tier 2 pattern"
  - "Migration applied via pg Pool (DATABASE_URL) which is equivalent to Supabase MCP for production writes"
metrics:
  duration: "~25 minutes"
  completed: "2026-06-10T22:20:00Z"
  tasks: 3
  files_created: 2
---

# Phase 109 Plan 01: Worcester Government Seeding Summary

**One-liner:** Worcester city government with Mayor Petty + 10 councillors seeded via migration 351 using the 7-step Tier 2 pattern (single LOCAL district, office-title encoding, no per-district geofences).

## What Was Built

Migration 351 seeds the complete City of Worcester government so any Worcester address returns a populated LOCAL section with Mayor Joseph M. Petty plus the 10 sitting city councillors (5 at-large + 5 district).

### Database Objects Created

| Object | Count | Key Values |
|--------|-------|-----------|
| governments | 1 | 'City of Worcester, Massachusetts, US' (type='LOCAL', state='MA', geo_id='2582000') |
| chambers | 1 | 'City Council' / 'Worcester City Council' |
| districts | 2 | LOCAL_EXEC (Worcester Citywide) + LOCAL (Worcester) — both mtfcc=NULL |
| politicians | 11 | Mayor Petty (-258200001) + 5 at-large + 5 district councillors |
| offices | 11 | Mayor in LOCAL_EXEC; all 10 councillors in LOCAL |
| schema_migrations | 1 | version='351' |

### Officials Seeded

| External ID | Full Name | Title |
|-------------|-----------|-------|
| -258200001 | Joseph M. Petty | Mayor |
| -258200002 | Khrystian E. King | City Councilor |
| -258200003 | Satya B. Mitra | City Councilor |
| -258200004 | Kathleen M. Toomey | City Councilor |
| -258200005 | Morris A. Bergman | City Councilor |
| -258200006 | Gary Rosen | City Councilor |
| -258200007 | Tony Economou | City Councilor (District 1) |
| -258200008 | Robert A. Bilotta | City Councilor (District 2) |
| -258200009 | John P. Fresolo | City Councilor (District 3) |
| -258200010 | Luis A. Ojeda | City Councilor (District 4) |
| -258200011 | Jose A. Rivera | City Councilor (District 5) |

## Verification Results

All post-verification gates from migration 351's DO block passed:

| Gate | Expected | Actual | Status |
|------|----------|--------|--------|
| Worcester government rows | 1 | 1 | PASS |
| City Council chamber | 1 | 1 | PASS |
| District rows (LOCAL_EXEC + LOCAL) | 2 | 2 | PASS |
| Worcester politicians | 11 | 11 | PASS |
| Offices linked to Worcester districts | 11 | 11 | PASS |
| Section-split orphans for geo_id=2582000 | 0 | 0 | PASS |
| Politicians with NULL office_id | 0 | 0 | PASS |

**MA G4110 section-split orphan count:** 53 (was 56 before Phase 109 Wave 1; Worcester + Springfield + Brockton all applied in parallel by this wave; expected 51 when all 5 Tier 2 cities complete).

**Ledger:** version='351' present in supabase_migrations.schema_migrations.

## Deviations from Plan

None — plan executed exactly as written.

### Note on Section-Split Count

The plan expected the MA orphan count to drop from 56 to 55 after this migration. The count is 53 instead because parallel agents (plans 02 and 04 for Springfield and Brockton) also ran concurrently in Wave 1 and applied migrations 352 and 354 before this verification query ran. This is expected behavior for a parallel execution wave and does not indicate any problem with migration 351.

## Known Stubs

None — all 11 politicians have offices with non-NULL office_id; all titles are correct; no placeholder data.

## Threat Flags

No new security-relevant surface beyond what the plan's threat model covers:

| Threat | Status |
|--------|--------|
| T-109-01: Migration re-run (Tampering) | Mitigated — WHERE NOT EXISTS on government, ON CONFLICT DO NOTHING on politicians, NOT EXISTS on (district_id, politician_id) for offices |
| T-109-02: PII disclosure | Accepted — all records are public elected officials |
| T-109-03: NULL office_id (Tampering) | Mitigated — Step 6 back-fill + Step 7 gate verified (0 NULL) |

## Self-Check

Files created:
- `C:/EV-Accounts/backend/migrations/351_worcester_government.sql` — FOUND (25,191 bytes, 621 lines)
- `C:/EV-Accounts/backend/scripts/_apply-migration-351.ts` — FOUND

DB state confirmed (post-migration queries):
- `SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -258200011 AND -258200001` → 11
- `SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -258200011 AND -258200001 AND office_id IS NULL` → 0
- `SELECT version FROM supabase_migrations.schema_migrations WHERE version = '351'` → PRESENT
- Worcester section-split orphan count → 0

## Self-Check: PASSED
