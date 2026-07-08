---
phase: 164-north-las-vegas-deep-seed
plan: 01
title: North Las Vegas structural seed + ward routing + surfacing
status: complete
completed: 2026-06-29
requirements: [CLARK-04]
---

# Phase 164 Plan 01 — Summary

Seeded the City of North Las Vegas structurally (Mayor + 4 ward-routed council
members) mirroring Phase 163 (Henderson) verbatim, loaded the 4 ward polygons as
X0017 geofences, and surfaced NLV with the purple hasContext chip in coverage.js.

## Wave-0 BLOCKING probes (Task 1 — all passed before any write)

| Probe | Result |
|-------|--------|
| (a) on-disk migration MAX | **1092** (1091 = `1091_seed_ca_2026_house_candidates.sql`, 1092 = `1092_phase149_dedup_redistricted_incumbents.sql`, both Phase 149) → structural number **1093**. No drift beyond the expected 1091/1092 landing; the stale "1091" note was NOT used. |
| (a2) registered ledger | versions are timestamp-style (e.g. 20260602031258); on-disk file number is authoritative, as documented. |
| (b) external_id collision −3207001..−3207005 | **0 rows** — block clear, used as planned. |
| (c) MTFCC X0017 | **unclaimed** (X0015=LV, X0016=Henderson present; X0017 absent). |
| (d) NLV G4110 | geo_id=**3251800**, state=**32** (TIGER FIPS) — Mayor attach point confirmed. |
| coverage.js NV block | held **Las Vegas (3240000)** + **Henderson (3231900)** before edit. |

**Roster operator checkpoint:** verified against Ballotpedia / Wikipedia / cityofnorthlasvegas.com / Nevada Current and operator-approved — **5 seats**:
Mayor Pamela Goynes-Brown (directly elected, term-limited but seated through Nov 2026, NOT rotational); Ward 1 Isaac E. Barrón; Ward 2 Ruth Garcia-Anderson (elected full term Nov 2024, is_appointed=false); Ward 3 Scott Black (still seated despite advancing to the Nov 2026 mayoral runoff — the Carrie Cox parallel); Ward 4 Richard Cherchio (re-elected unopposed 2024).

## Ward path taken

**X0017 ward polygons** (NOT the D-01b single-city fallback). Clean polygons sourced from the shared Clark County GISMO `PoliticalBoundaries/MapServer/5` layer filtered `where=PLACE=80`. Dry-run + live load both returned exactly 4 features (Ward 1=7 rings, Ward 2=7 rings, Ward 3=1, Ward 4=1; coords ~−115°/36°). All inserted as `ST_MultiPolygon`, **all ST_IsValid=true with NO ST_MakeValid repair needed**.

Verify: `SELECT COUNT(*), bool_and(ST_IsValid(geometry)) ... WHERE state='nv' AND mtfcc='X0017'` → **(4, true)**.

## Structural migration 1093 — applied, post-verify PASSED

`1093_north_las_vegas_city_council.sql` (343 lines) applied via `psql -f`:
- Post-verification NOTICE: **gov=1, exec=1, local=4, split_orphans=0**.
- `UPDATE 5` (office_id back-fill for all 5).
- Ledger registered version **1093** / `north_las_vegas_city_council`.
- Grep-gate PASS; no forbidden tokens (slug / photo_origin_url) in comments.

### external_id → UUID map (consumed by Plans 02/03)

| ext_id | UUID | Name | Title | Routing geo_id |
|--------|------|------|-------|----------------|
| −3207001 | `bc59a9f6-e308-4c1c-af96-0aebb8ac72c6` | Pamela Goynes-Brown | Mayor (LOCAL_EXEC) | 3251800 |
| −3207002 | `59c8b352-1ffb-44fc-89c2-68627ade8a8c` | Isaac E. Barrón | Council Member, Ward 1 | north-las-vegas-nv-council-ward-1 |
| −3207003 | `cefd942b-7c4f-4d7b-9726-95d8c5a42c9f` | Ruth Garcia-Anderson | Council Member, Ward 2 | north-las-vegas-nv-council-ward-2 |
| −3207004 | `80a3329f-c338-4991-afb3-b1670996ef7b` | Scott Black | Council Member, Ward 3 | north-las-vegas-nv-council-ward-3 |
| −3207005 | `806dbfb2-3e81-4d76-bd04-085bc523b76a` | Richard Cherchio | Council Member, Ward 4 | north-las-vegas-nv-council-ward-4 |

All `party='Non-Partisan'`, `is_active=true`, `is_incumbent=true`, `is_appointed=false`; Barrón accent preserved.

## coverage.js (Task 4)

Appended `{ label: 'North Las Vegas', browseGovernmentList: ['3251800'], browseStateAbbrev: 'NV', hasContext: true }` to the existing NV block (after Henderson). LV + Henderson entries preserved; single NV block; TX "Nevada" city untouched; Landing.jsx untouched.

Browse link: `essentials.empowered.vote/results?browse_geo_id=3251800&browse_mtfcc=G4110`

## Files

- `C:/EV-Accounts/backend/scripts/load-north-las-vegas-ward-boundaries.ts` (new)
- `C:/EV-Accounts/backend/migrations/1093_north_las_vegas_city_council.sql` (new, structural, registered)
- `C:/Transparent Motivations/essentials/src/lib/coverage.js` (modified — NV block)

## Next

- **Next migration: 1094** (Plan 02 headshots, audit-only).
- Plan 02: source/process/install 600×750 headshots for all 5 members (Goynes-Brown from Wikimedia Commons; others Wave-0 sourced).
- Plan 03: evidence-only stances (1095–1099, one research agent at a time) + final E2E verification.
