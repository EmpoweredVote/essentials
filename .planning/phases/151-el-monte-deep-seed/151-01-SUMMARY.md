# 151-01 SUMMARY — El Monte structural reconcile (migration 1000)

**Status:** COMPLETE ✓ (applied live + verified idempotent + committed to EV-Accounts)
**Migration:** `1000_elmonte_reconcile.sql` (STRUCTURAL, registered `schema_migrations.version='1000'`); EV-Accounts commit `3cdba4aa`.
**Date:** 2026-06-21

## What was done
1. **geo_id backfill:** gov `f5fe3651-75c2-4ede-86e2-c13fc008d545` → `geo_id='0622230'` (was NULL), state CA.
2. **Chamber merge:** moved Longoria (office `3040818a`) + Ruedas (office `06d458fe`) from doomed `b41e0065` → survivor `5ca38f3a`, asserted empty, deleted `b41e0065`. ONE 'City Council' chamber remains (6 offices).
3. **By-district relabel + 3-way shared-district resolution** (RESEARCH §D-02, Ord. 3010 — overturned the At-Large default). Pre-flight found `ee390480` "At-Large" shared by **3** offices (Crippen-Thomas, Galvan, Herrera) with **no unused orphan row** to repurpose → created NEW rows for the two displaced occupants.
4. **Mayor untouched:** Ancona office `57d646fc` / district `2c00ef36` 'El Monte Mayor' LOCAL_EXEC kept exactly as-is.

## District UUID map (for Plan 02 — seat Cortez on District 6)
| District | UUID | Occupant (office) | Origin |
|----------|------|-------------------|--------|
| District 1 | `ee390480-3d15-4fee-a181-e75c53e2b7cb` | Crippen-Thomas (`211af77a`, ext -201202) | relabeled (kept on shared row) |
| District 2 | `ed9d15d1-53a4-45a5-b3de-1982176485f9` | Herrera (`7e9eac5e`, ext -201204) | **NEW** + repointed off ee390480 |
| District 3 | `717a7d6d-24ea-48ad-afe0-9890afb700d2` | Ruedas (`06d458fe`, ext 657390) | relabeled (own row) |
| District 4 | `12026291-cf3a-447e-bbba-42a51ba5bc2b` | Longoria (`3040818a`, ext 657386) | relabeled (own row) |
| District 5 | `7c450725-f951-4e96-ac83-0fe7d5e17cb0` | Galvan (`3ffcb893`, ext -201203) | **NEW** + repointed off ee390480 |
| **District 6** | **`0e2b4e3b-be0b-4919-b0b2-f19ce898b23b`** | **(unoccupied — Cortez seated in Plan 02)** | **NEW** |
| El Monte Mayor | `2c00ef36-ee81-42ef-b9cf-c742ff48749f` (LOCAL_EXEC) | Ancona (`57d646fc`, ext -200669) | UNTOUCHED |

Survivor chamber: `5ca38f3a-ea2e-4160-abb5-f897702b6cb6` (official_count still NULL — set to 6 in Plan 02).

## Key findings for Plan 02
- **Cortez ABSENT** — `SELECT ... WHERE first_name ILIKE '%marisol%' AND last_name ILIKE '%cortez%'` returned 0 rows. Plan 02 creates her fresh (next free custom ext_id resolved at apply time; range scan showed no existing -700/-701 collision near the target).
- **Back-pointers:** `politicians.office_id` is NULL for Crippen-Thomas, Galvan, Herrera, Ancona; set correctly for Longoria + Ruedas. Plan 02 repairs the 4 NULLs + sets Cortez's.
- **Migration counter:** on-disk MAX was 999; next structural = **1001** for Plan 02. (Live `schema_migrations` MAX is a `20260621044500` timestamp from the state_exec workstream — the integer file counter, not that, is authoritative; structural migrations register integer `version` strings like '1000'.)
- **Out-of-scope stray (left untouched):** a `'South El Monte Mayor'` LOCAL_EXEC district row is mis-tagged with El Monte's `geo_id 0622230` (belongs to South El Monte gov `71d17594`) — same class as the documented South Pasadena/0656000 stray. All verification is gov-scoped so it does not contaminate counts.

## Verification (all green)
- gov geo_id `0622230`; ONE 'City Council' chamber; doomed `b41e0065` gone; survivor 6 offices; exactly 1 LOCAL_EXEC office in chamber (Ancona).
- Roster: Crippen-Thomas D1 / Herrera D2 / Ruedas D3 / Longoria D4 / Galvan D5 / Ancona Mayor.
- 6 LOCAL district rows D1–D6 (D6 unoccupied); 0 leftover 'At-Large' rows; split-section check 0 rows.
- Idempotent: full re-apply changed 0 rows, no error. Migration 1000 registered.
