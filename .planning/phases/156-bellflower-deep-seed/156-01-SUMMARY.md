# 156-01 SUMMARY — Bellflower reconcile (Wave 1)

**Plan:** 156-01-PLAN.md | **Requirement:** BLFL-01 | **Status:** ✓ Complete
**Migration:** `1042_bellflower_reconcile.sql` (STRUCTURAL, registered) — applied live + committed to EV-Accounts (`079252de`)
**Self-Check:** PASSED

## What was built

Reconciled the City of Bellflower (`d34bdac8`) structural defects in one idempotent migration: geo_id backfill, four one-directional back-pointer repairs, by-district relabel/split, and the LOCAL_EXEC-Mayor→council-seat conversion. Single chamber — no merge.

## Task 1 — pre-flight findings (no drift)

| Invariant | Confirmed |
|---|---|
| Gov `d34bdac8` | geo_id NULL→backfill, state CA |
| Chamber | exactly 1: `a89b567a` 'City Council', slug bellflower-city-council, official_count NULL, ext -200581 |
| Offices | 4, **all one-directional** (pol.office_id NULL) |
| Dunton -200583 | pol `31c35458` / office `bdd2040f` / LOCAL_EXEC district `b0002e15` 'Bellflower Mayor' / title 'Mayor' |
| Koops -201149 | pol `dd2c2cfd` / office `3935cd4b` / At-Large `8db5a2e5` |
| Morse -201150 | pol `d18dcb81` / office `7408185f` / At-Large `8db5a2e5` |
| Sanchez -201151 | pol `4384a5d8` / office `581c5602` / At-Large `8db5a2e5` |
| Shared At-Large district | `8db5a2e5` (LOCAL, mtfcc G4110, ocd place:bellflower, **government_id NULL**) |
| Next `-7010xx` slot | **-701003** (−701001 Cortez/−701002 Padilla used) → Santa Ines in Wave 2 |
| Migration counter | on-disk MAX 1041 → next **1042** |

## New district UUIDs (created this wave)

D1 = `8db5a2e5-2172-474a-be23-e51c2a53f970` (relabeled from At-Large; Morse) plus 4 new LOCAL rows D2/D3/D4/D5 (resolve at apply time via `label`+`geo_id`). **D3 is intentionally empty** — Santa Ines seated in Wave 2.

## Deviations from plan (intentional, correctness)

- **districts.government_id stays NULL** on the new D2–D5 rows. The plan/VALIDATION/PATTERNS assumed districts carry `government_id='d34bdac8'`, but the live schema has `government_id` NULL on every Bellflower district (and on all Palmdale by-district rows — districts link to the gov via `geo_id`). New rows mirror the existing D1 row (NULL) for consistency. Verification queries were keyed on `geo_id='0604982'` instead of `government_id`.
- New D2–D5 rows fully mirror `8db5a2e5` (ocd_id, district_id='0', num_officials=1, mtfcc='G4110') rather than Palmdale's sparse INSERT — cleaner, consistent dataset.

## Post-apply verification (all pass)

- geo_id=`0604982`; chamber_count=1; office_count=4; bidirectional mismatches=0
- 4 links repaired (Dunton/Koops/Morse/Sanchez office_id NOT NULL)
- LOCAL_EXEC district `b0002e15` deleted; **0** LOCAL_EXEC offices under the gov
- 5 distinct LOCAL districts D1–D5 (geo_id 0604982); no two offices share a district_id
- District map: **Morse=D1, Koops=D2, Sanchez=D4, Dunton=D5** (all 'Councilmember'); D3 empty
- 0 space-form 'Council Member' titles; migration 1042 registered
- government_bodies: single 'Bellflower City Council' row — no section split

## key-files.created
- `C:/EV-Accounts/backend/migrations/1042_bellflower_reconcile.sql`

## Enables Wave 2
Empty D3 district ready to seat Santa Ines (-701003, rotational Mayor); titles + official_count=5 finalized next.
