# 152-01 SUMMARY — West Covina Reconcile (Wave 1)

**Status:** ✅ Complete
**Requirement:** WCOV-01
**Migration:** 1010_west_covina_reconcile.sql (STRUCTURAL — registered in schema_migrations; committed to EV-Accounts `0b662f9c`)
**Date:** 2026-06-21

## What was done
Reconciled the existing partial, dual-chamber West Covina seed in one idempotent structural migration:
1. **geo_id backfill** — gov `1982a9fa` geo_id NULL → `0684200` (empty-string-guarded); state already CA.
2. **Dual-chamber merge** — moved the 2 doomed-chamber (`b1a2c4cb`) offices (Diaz `abd27abb`, Gutierrez `0f3cce5f`) into survivor `12c9360a`, asserted doomed empty, deleted `b1a2c4cb`. End state: ONE `City Council` chamber with 5 offices.
3. **One-directional link repair** — set `politicians.office_id` for Diaz (`f5bf4ec4`→`abd27abb`) and Gutierrez (`22fc2cdc`→`0f3cce5f`). All 5 seats now bidirectional.
4. **By-district relabel (CVRA, Ord. 2310)** — At-Large → D1–D5.

## Pre-flight findings (for Plan 02)
- **Shared-district defect (Pomona/Torrance class):** Diaz + Gutierrez both pointed to district `0e70a17e`. Resolved by creating a NEW `District 3` row for Diaz (repointed office `abd27abb`) and relabeling `0e70a17e`→`District 1` (Gutierrez).
- **The other 3 had own rows** (relabeled in place): Lopez-Viado `adf5b635`→D2, Cantos `85817d95`→D4, Wu `970809db`→D5.
- **DEVIATION (documented):** Pre-flight found an orphan `West Covina Mayor` LOCAL_EXEC district row `31a431df` (geo_id 0684200, **no office references it**) — not anticipated by the plan's "no LOCAL_EXEC row" assumption. Folded a **guarded DELETE** into 1010 (deletes only if office-less). This serves the plan's own ZERO-LOCAL_EXEC acceptance criterion and matches research (rotational mayor, no separate office). No separately-seated mayor exists.
- All 5 members CURRENT (no departures, no new politician). Roster verified vs research §D-02/§D-03.

## Final district UUIDs (for Plan 02)
| District | Member | ext_id | office_id | district_id |
|---|---|---|---|---|
| District 1 | Brian Gutierrez | -201108 | 0f3cce5f | 0e70a17e (relabeled) |
| District 2 | Letty Lopez-Viado (**Mayor**) | 687361 | 4a8f2fd6 | adf5b635 (relabeled) |
| District 3 | Rosario Diaz | -201107 | abd27abb | **new row** (created) |
| District 4 | Ollie Cantos (**Mayor Pro Tem**) | 687365 | 50471af9 | 85817d95 (relabeled) |
| District 5 | Tony Wu | 687367 | 65bf4e71 | 970809db (relabeled) |

## Verification (all green)
- geo_id `0684200/CA` ✓ · one `City Council` chamber ✓ · doomed `b1a2c4cb` gone ✓
- survivor office_count = 5 ✓ · bidirectional links = 5/5 ✓ · distinct district_id per seat = 5 ✓
- LOCAL_EXEC rows for geo_id 0684200 = 0 ✓ (orphan removed; rotational mayor)
- D1–D5 occupant mapping correct ✓ · split-section check = 0 rows ✓
- migration 1010 registered ✓ + committed to EV-Accounts ✓
- Idempotent: all writes guarded (re-run = 0 rows).

## Handoff to Plan 02 (Wave 2)
- Structure is clean: ONE chamber `12c9360a`, 5 districted seats, bidirectional, no LOCAL_EXEC.
- Plan 02 sets: `official_count=5` on `12c9360a`; **Mayor title on D2 (Lopez-Viado)** + **Mayor Pro Tem title on D4 (Cantos)** as titles-on-seat (NOT a separate office, NOT LOCAL_EXEC); title normalization; live-roster re-confirm vs westcovina.gov/177. NO new politician, NO unlink expected.
- Next structural migration = 1011.
