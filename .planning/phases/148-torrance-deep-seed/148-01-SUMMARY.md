---
phase: 148-torrance-deep-seed
plan: 01
wave: 1
status: complete
requirements: [TORR-01]
migrations: [936_torrance_reconcile.sql]
note: STRUCTURAL — migration 936 registered in supabase_migrations.schema_migrations (version '936', name 'torrance_reconcile')
new_at_large_uuid: f0344be1-8f0a-4244-9fa3-05119d11f584   # Sheikh's office 0542b22b repointed here
---

# Phase 148 Wave 1 — Torrance Reconcile — SUMMARY

**Outcome:** The pre-existing partial, duplicate-chamber Torrance seed is now a single clean `City Council`
chamber (`f6fcb0ba`) with 7 AT-LARGE-shaped offices (6 At-Large council + 1 directly-elected Mayor),
the Brigitte-Lewis typo duplicate removed, and the shared At-Large district defect resolved. Migration
**936** (structural) applied + registered. Zero drift at pre-flight; split-section check 0 rows.

## Pre-flight (STOP-on-drift) — PASSED
All preconditions confirmed live (2026-06-20), both link directions + the user ROSTER/AT-LARGE overrides:
- gov `b3e97e65` geo_id NULL, state CA, "City of Torrance, California, US"
- two `City Council` chambers: survivor `f6fcb0ba` (4 correctly-linked offices, official_count 7 stale) + doomed `2583b565` (4 offices, official_count NULL)
- survivor offices (KEEP): Gerson `7f596dd4`/683376, Kaji `8391fb00`/683364, Kalani `143f683f`/683370, Bridgett Lewis `95879f8c`/683366 — all distinct At-Large rows, both link directions OK
- doomed offices: Chen/Mayor `c5b5b1b3` (district `a99b86b0` Torrance Mayor LOCAL_EXEC), Brigitte Lewis `bf157ee7` (-201101, DUP), Mattucci `220e2cb5`, Sheikh `0542b22b` — last three all on shared At-Large `84e45ab7`
- Brigitte (-201101 / `7f74014f`): 0 stances, 0 images, 0 most-FK; **1 `politician_contacts` row** (deleted as a dependent) — confirmed ≠ real Bridgett (683366 / `9e24181e`, kept)
- 5 At-Large LOCAL rows + 1 `Torrance Mayor` LOCAL_EXEC `a99b86b0`; no `District N`, no Betty Lieu in roster

## Changes applied (migration 936, idempotent, atomic transaction)
1. geo_id backfilled to `0680000` (empty-string guard)
2. Brigitte-Lewis typo duplicate deleted — office `bf157ee7` → her `politician_contacts` row → politician `7f74014f`
3. shared-At-Large split: created **new At-Large LOCAL row `f0344be1-8f0a-4244-9fa3-05119d11f584`**; Sheikh's office `0542b22b` repointed to it; Mattucci's `220e2cb5` keeps `84e45ab7`
4. chamber merge: moved Chen/Mattucci/Sheikh's 3 offices into survivor `f6fcb0ba`; inline assert proved doomed empty; deleted doomed chamber `2583b565`
5. registered migration 936 in schema_migrations

## Deviation
- Pre-flight checked stances/images (both 0) but the first apply hit an FK from `essentials.politician_contacts` (1 row). Resolved by deleting Brigitte's contact row before the politician delete; first transaction rolled back fully (no partial writes). Migration file updated to match.

## Post-verification — ALL GREEN
- geo_id `0680000`; exactly 1 'City Council' chamber; doomed `2583b565` gone; survivor 7 offices
- Brigitte (-201101) gone; Bridgett (683366) present
- Sheikh on `f0344be1…`, Mattucci on `84e45ab7` (distinct); 6 At-Large LOCAL rows; 0 'District N'
- `Torrance Mayor` LOCAL_EXEC `a99b86b0` untouched; no new Mayor row; no back-pointer/official_count change (Plan 02)
- feedback_section_split_check → 0 rows for Torrance
- migration 936 registered (ledger MAX now 936)

## For Plan 02
- New At-Large UUID for Sheikh: `f0344be1-8f0a-4244-9fa3-05119d11f584`
- Broken back-pointers to repair (politicians.office_id NULL): Chen `3dfd7349`→`c5b5b1b3`, Mattucci `2b4b35a8`→`220e2cb5`, Sheikh `9ac3ac10`→`0542b22b`
- Set survivor `f6fcb0ba` official_count = 7 (currently 7 but stale-derived; re-affirm)
