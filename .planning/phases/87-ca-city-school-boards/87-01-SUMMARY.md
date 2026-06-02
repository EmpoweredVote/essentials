---
phase: "87"
plan: "01"
subsystem: database
tags: [school-boards, california, migration, seed-data]
dependency_graph:
  requires: [phase-57-ca-geofences]
  provides: [ca-school-board-officials]
  affects: [essentialsService-SCHOOL-routing]
tech_stack:
  added: []
  patterns: [phase-86-or-school-districts-pattern, WHERE-NOT-EXISTS-idempotency, office-id-backfill]
key_files:
  created:
    - C:/EV-Accounts/backend/migrations/257_ca_city_school_boards.sql
  modified: []
decisions:
  - "SFUSD office title: Commissioner (official SFUSD term, not Board Member)"
  - "BUSD office title: Director (official berkeleyschools.net term, not Board Member)"
  - "SJUSD trustee area assignments sourced from Ballotpedia (sjusd.org board page omits area numbers)"
  - "34 officials seeded (not 38) — 4 student board members excluded across 3 districts"
  - "Coverage gap documented: SJUSD and SCUSD cover only part of their cities"
metrics:
  duration: "9 minutes"
  completed: "2026-06-02T07:17:41Z"
  tasks_completed: 1
  tasks_total: 1
  files_created: 2
  files_modified: 0
---

# Phase 87 Plan 01: CA City School Board Seed Migration (257) Summary

Migration 257 seeds 6 CA city school district government bodies, Board of Education chambers, SCHOOL-type districts, and 34 elected board member officials with offices — enabling address-based SCHOOL section routing for residents of SFUSD, SDUSD, SCUSD, SJUSD, FUSD, and BUSD coverage areas.

## Tasks Completed

| Task | Description | Commit | Status |
|------|-------------|--------|--------|
| 1 | Write and apply migration 257 to production DB | 34af51e | PASSED |

## Migration 257 Details

**File:** `C:/EV-Accounts/backend/migrations/257_ca_city_school_boards.sql`
**Applied:** 2026-06-02 via psql DATABASE_URL

### What Was Seeded

| District | geo_id | Officials | Office Title Style |
|----------|--------|-----------|-------------------|
| San Francisco Unified SD | 0634410 | 7 | `Commissioner` |
| San Diego Unified SD | 0634320 | 5 | `Board Member (District A-E)` |
| Sacramento City Unified SD | 0633840 | 7 | `Board Member (Area 1-7)` |
| San José Unified SD | 0634590 | 5 | `Board Member (Trustee Area 1-5)` |
| Fremont Unified SD | 0614400 | 5 | `Board Member (Area 1-5)` |
| Berkeley Unified SD | 0604740 | 5 | `Director` |
| **Total** | | **34** | |

### Post-Verification Gates (All PASSED)

- (a) Government rows: 6/6
- (b) Board of Education chambers: 6/6
- (c) SCHOOL district rows (state='ca'): 6/6
- (d) Politicians in -870034..-870001 range: 34/34
- (e) Offices linked to SCHOOL districts: 34/34
- (f) Section-split orphan geofences: 0
- (g) office_id NULL count: 0

### Key Implementation Notes

- `district_type='SCHOOL'` (lowercase SCHOOL, not SCHOOL_DISTRICT) — routing invariant
- `districts.state='ca'` (lowercase) — routing convention
- `governments.state='CA'`, `offices.representing_state='CA'` (uppercase)
- `slug` omitted from chambers INSERT — GENERATED ALWAYS constraint
- `WHERE NOT EXISTS` guard on governments — no unique constraint on geo_id
- UTF-8 characters preserved: San José (é), José Magaña (é, ñ), José M. Navarro (é), Ka'Dijah Brown (apostrophe)

## Deviations from Plan

None — plan executed exactly as specified in CONTEXT.md decisions D-01 through D-19.

**Open question resolved:** BUSD office title chosen as `'Director'` (official berkeleyschools.net terminology) per research recommendation, consistent with SFUSD using `'Commissioner'` — each district uses its official title.

## Coverage Gap (Documented Per D-13)

- SJUSD covers the southern/central core of San Jose; residents in East Side Union, Evergreen, Natomas, Twin Rivers areas will not see a SCHOOL section.
- SCUSD covers the Sacramento City USD boundary; residents outside this boundary see no SCHOOL section.
- Documented in migration 257 comment block.

## Known Stubs

None — all 34 officials are wired to live district/chamber/government rows.

## Threat Flags

None — no new network endpoints, auth paths, or external-facing changes. Pure DB seed migration.

## Self-Check: PASSED

- Migration file exists: C:/EV-Accounts/backend/migrations/257_ca_city_school_boards.sql
- Migration ledger version='257': CONFIRMED via query
- 34 politicians in range: CONFIRMED via query
- 6 districts with state='ca': CONFIRMED via query
- Commit 34af51e exists: CONFIRMED
