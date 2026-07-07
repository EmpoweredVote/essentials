# Phase 166 Plan 01 — Summary

**Plan:** 166-01 (Geofence + structural seed + surfacing)
**Status:** Complete
**Date:** 2026-06-29

## What was built

The structural + geofence + surfacing half of the Clark County School District (CCSD) deep-seed. The only NV deep-seed that loads a new geofence.

## Wave-0 BLOCKING checkpoint (operator-approved)

| Probe | Result |
|-------|--------|
| (a) On-disk migration MAX | 1106 → structural **1107** (no drift) |
| (b) external_id `-3209011..-3209001` collision | 0 |
| (c) Pre-existing CCSD government | 0 (greenfield) |
| (d) Pre-existing G5420 geofence `3200060` | 0 (greenfield load) |
| (e) Loader deps (adm-zip, shapefile) | both present |
| (f) Loader `--dry-run` | GEOID 3200060 found in `tl_2024_32_unsd.zip` |
| coverage.js NV block | LV+Henderson+NLV+Boulder City present (L186–189) |
| Roster | 11 members operator-verified vs ccsd.net/trustees |

**Operator decisions:** Approved to proceed. Henderson appointed trustee spelling locked as **Esparza-Stoffregan** (-gan, per live ccsd.net). Officers (President Stevens / VP Bustamante Adams / Clerk Dominguez) confirmed title-on-seat — 11 seats, not 14. Appointed four are nonvoting until 2027 (SB460) — affects Plan 03 stance evidence only.

## Artifacts

- `C:/EV-Accounts/backend/scripts/load-ccsd-school-boundary.ts` — single-GEOID variant of `load-or-school-boundaries.ts` (GEOID 3200060, `tl_2024_32_unsd.zip`, `source='tiger_unsd_nv_2024'`, EXPECTED_COUNT=1, `--dry-run`). Inserts real polygon directly (no geometry-copy migration).
- `C:/EV-Accounts/backend/migrations/1107_ccsd_board_of_trustees.sql` — structural (registered): gov + chamber + 1 SCHOOL district + 11 offices + office_id back-fill + post-verify DO block + ledger registration.
- `C:/EV-Accounts/backend/scripts/smoke-nv-geofences.ts` — extended: all 5 Clark County points now assert G5420 `3200060`.
- `src/lib/coverage.js` — CCSD appended to NV COVERAGE_STATES block (browseGeoId+browseMtfcc, hasContext:true).

## Run order (LOAD-BEFORE-MIGRATE) + results

1. Loader run: inserted 1 G5420 row; confirmed `geo_id='3200060' AND mtfcc='G5420'` geometry IS NOT NULL = 1, `source='tiger_unsd_nv_2024'`, `state='32'`.
2. Migration 1107 applied via `psql -f`: **Post-verification PASSED: gov_count=1, office_count=11, elected=7, appointed=4, split_orphans=0**. Ledger 1107 registered.
3. Post-apply audit: 1 SCHOOL district; 11 offices on it; official_count=11; districts.state = `nv` only; ledger 1107 = 1 row.
4. Smoke test: **ALL ASSERTIONS PASSED** — all 5 Clark County points return G5420 `3200060`.

## 11 external_id → UUID map (for Plans 02/03)

| ext_id | UUID | Name | Title | appointed |
|--------|------|------|-------|-----------|
| -3209001 | 76b03835-5935-4aa5-a407-e9e05f2a06e9 | Emily Stevens | Trustee, District A | false |
| -3209002 | 96ba9a30-bf00-4d6e-aebb-7a6cac741d39 | Lydia Dominguez | Trustee, District B | false |
| -3209003 | c984a8d5-0a03-41ae-b85d-d8455829859e | Tameka Henry | Trustee, District C | false |
| -3209004 | e59931c3-7474-41f9-a4a9-bf9ea7317830 | Brenda Zamora | Trustee, District D | false |
| -3209005 | df815b44-10fb-43d1-b329-7730bd08a3d0 | Lorena Biassotti | Trustee, District E | false |
| -3209006 | 97a70e4a-8f53-4816-bc4d-15d5d0ce3a14 | Irene Bustamante Adams | Trustee, District F | false |
| -3209007 | 9ba19701-6b5f-413e-8d7e-99b98824d25f | Linda P. Cavazos | Trustee, District G | false |
| -3209008 | f297e12a-2fac-4de4-b2d1-0ee1c769f93d | Isaac Barron | Trustee, Appointed – City of North Las Vegas | true |
| -3209009 | 6555ccfe-68cc-422c-92a2-0f0cb2195354 | Ramona Esparza-Stoffregan | Trustee, Appointed – City of Henderson | true |
| -3209010 | 78a3929a-0fd8-4754-bfad-a39327dd1800 | Adam Johnson | Trustee, Appointed – City of Las Vegas | true |
| -3209011 | 02b359b3-b7f4-4168-b2a4-edfc3d7b97d0 | Lisa Satory | Trustee, Appointed – Clark County | true |

## Self-Check: PASSED

- G5420 boundary loaded with geometry (source tiger_unsd_nv_2024).
- 1 government (LOCAL, geo_id 3200060, standalone) + 1 chamber (official_count=11) + 1 SCHOOL district + 11 offices (7 elected / 4 appointed).
- section-split=0; casing state='nv' lowercase; ledger 1107 registered.
- Smoke test green; coverage.js surfacing added.

## Key files
- created: C:/EV-Accounts/backend/scripts/load-ccsd-school-boundary.ts
- created: C:/EV-Accounts/backend/migrations/1107_ccsd_board_of_trustees.sql
- modified: C:/EV-Accounts/backend/scripts/smoke-nv-geofences.ts
- modified: src/lib/coverage.js

## Notes for Plan 02 (headshots) / Plan 03 (stances)
- Headshot migration = **1108** (audit-only); per-trustee stance migrations **1109–1119** (audit-only).
- ccsd.net + BoardDocs both WAF-403 (research) → per-trustee fallback chain mandatory; appointed-four likely thin photo coverage.
- Appointed four nonvoting until 2027 → expect statement-only stance evidence / honest blanks.
