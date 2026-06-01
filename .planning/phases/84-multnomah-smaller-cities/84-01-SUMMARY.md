---
phase: 84-multnomah-smaller-cities
plan: "01"
subsystem: database/backend
tags: [phase-84, multnomah, oregon, cities, government-seeding, routing, migration]
dependency_graph:
  requires: [phase-72-or-geofences, phase-83-multnomah-county]
  provides: [gresham-government, troutdale-government, fairview-government, wood-village-government, maywood-park-government, 5-city-local-routing]
  affects: [routing-local-section, smoke-test-84]
tech_stack:
  added: []
  patterns: [WITH-ins_p-CTE, WHERE-NOT-EXISTS-idempotency, office_id-backfill, post-verification-DO-block]
key_files:
  created:
    - C:/EV-Accounts/backend/migrations/246_multnomah_cities_government.sql
    - C:/EV-Accounts/backend/scripts/smoke-multnomah-cities.ts
  modified: []
decisions:
  - "D-05 OVERRIDDEN: Gresham is at-large Position 1-6, not ward-based — no custom geofences needed"
  - "WV + MP Mayors: is_appointed=true + is_appointed_position=true (council-selected)"
  - "E'an Todd: escaped as E''an (doubled ASCII apostrophe U+0027) in migration SQL"
metrics:
  duration: "45 minutes"
  completed: "2026-06-01"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
---

# Phase 84 Plan 01: Multnomah Smaller Cities Government Seeding Summary

**One-liner:** Migration 246 seeds 5 Multnomah city governments + 10 districts + 31 officials with LOCAL/LOCAL_EXEC routing; smoke test passes SC1/SC2/SC3 for all 5 city centroids.

## What Was Built

Migration 246 (`C:/EV-Accounts/backend/migrations/246_multnomah_cities_government.sql`) seeds all 5 incorporated Multnomah County cities outside Portland in a single BEGIN/COMMIT transaction. Smoke test (`smoke-multnomah-cities.ts`) validates routing for all 5 cities.

### Applied to Production Supabase

Migration 246 applied via `pg` client to production Supabase. All post-verification DO block gates passed inside the transaction. Migration ledger entry: `version='246'`.

## Verification Results

### Pre-flight Gates (before apply)
- External ID range -4131240 to -4183959: **0 rows** (clear)
- G4110 boundaries for 5 cities: **5 rows** (Phase 72 intact)
- Migration 246 in ledger: **0 rows** (not yet applied)

### Post-apply SQL Gates
| Gate | Expected | Actual | Status |
|------|----------|--------|--------|
| 1: Governments | 5 | 5 | PASS |
| 2: Chambers (for our 5 cities) | 5 | 5 | PASS |
| 3: Districts | 10 | 10 | PASS |
| 4: Politicians | 31 | 31 | PASS |
| 5: Offices | 31 | 31 | PASS |
| 6: NULL office_ids | 0 | 0 | PASS |
| 7: Section-split orphans | 0 | 0 | PASS |
| 8: WV+MP Mayor is_appointed_position=true | 2 | 2 | PASS |
| 9: WV+MP Mayor is_appointed_position=false | 0 | 0 | PASS |
| 10: Migration ledger entry | 1 | 1 | PASS |

Note on Gate 2: The plan's verification SQL used `LIKE 'City of % Oregon, US'` (missing comma) which also matched Portland's pre-existing 'City Council' chamber (returning 6 rows total). Our 5 new chambers are correct — confirmed via exact name match returning 5 rows.

### Smoke Test Output (`npx tsx scripts/smoke-multnomah-cities.ts`)
```
ALL ASSERTIONS PASSED

Phase 84 success criteria:
  SC1: All 5 city centroids return correct G4110 geo_id [PASS]
  SC2: All 5 cities return LOCAL + LOCAL_EXEC officials [PASS]
  SC3: Section-split check — 0 orphans across 5 cities [PASS]
```

### Idempotency Test
Re-applying migration 246 produced no additional rows: govts=5, districts=10, politicians=31, offices=31 (unchanged). PASS.

### Phase 83 Regression Check
`npx tsx scripts/smoke-multnomah-county.ts` — ALL ASSERTIONS PASSED. County routing intact.

## Generated IDs

### Governments (5)
| City | geo_id | government_id |
|------|--------|--------------|
| City of Gresham, Oregon, US | 4131250 | 2707e489-8a9d-4c44-bad4-d6956759697f |
| City of Troutdale, Oregon, US | 4174850 | d7dc3678-77f9-43dc-a65c-7184d88ff2d2 |
| City of Fairview, Oregon, US | 4124250 | cdbf5a13-a960-452b-a9d8-63f18616b7b0 |
| City of Wood Village, Oregon, US | 4183950 | a0b92103-1374-420c-b361-f2630c4c0d60 |
| City of Maywood Park, Oregon, US | 4146730 | 47232363-f692-4868-8ed4-76ded0a2c141 |

### Chambers (5)
| City | chamber_id | slug |
|------|-----------|------|
| Gresham | d5a5afe0-0e3b-473b-8bd9-2f443bfec39d | gresham-city-council |
| Troutdale | 0e1af608-257d-4cb6-bcff-5e779f10ee91 | troutdale-city-council |
| Fairview | 5cc47af1-434e-4929-ab11-0ff99bbf1a52 | fairview-city-council |
| Wood Village | 4f37f2d0-f4b3-4106-8659-3870b0378d98 | wood-village-city-council |
| Maywood Park | 0871c83f-52fa-467d-a6fc-3107bb344057 | maywood-park-city-council |

### Districts (10)
| geo_id | district_type | district_id | label |
|--------|--------------|-------------|-------|
| 4131250 | LOCAL_EXEC | acc4eda0-5b3f-424d-afdc-7af7582a79e9 | Gresham (Citywide) |
| 4131250 | LOCAL | 52f4dced-ec83-4d44-8d59-8d92541fbc39 | Gresham (At-Large) |
| 4174850 | LOCAL_EXEC | c75c0436-8997-4d14-8997-c1d70fafc24b | Troutdale (Citywide) |
| 4174850 | LOCAL | 0dcea591-06cc-4b81-84ce-bb080fcd763f | Troutdale (At-Large) |
| 4124250 | LOCAL_EXEC | a77b7126-de9b-400c-b848-4be7b03c0865 | Fairview (Citywide) |
| 4124250 | LOCAL | ba3313e7-e073-4d5b-b4a8-27241140efcb | Fairview (At-Large) |
| 4183950 | LOCAL_EXEC | 74cc6acb-511f-4808-a318-066dd8b620bd | Wood Village (Citywide) |
| 4183950 | LOCAL | 98ce622b-d560-4090-9db6-5b4b92d3cbe5 | Wood Village (At-Large) |
| 4146730 | LOCAL_EXEC | bc39f358-ac58-497d-9ba4-8a2113bb8a2c | Maywood Park (Citywide) |
| 4146730 | LOCAL | cda0cb5f-cb86-4914-ac7f-93cc9b8ff068 | Maywood Park (At-Large) |

### Politicians (31) — external_id → politician_id → office_id
| external_id | full_name | politician_id |
|-------------|-----------|--------------|
| -4131251 | Travis Stovall | 8152aa41-5920-4b77-9b4b-14c5bde40c44 |
| -4131252 | Kayla Brown | 1fc5a9ec-086d-4f15-9d35-c11149783b82 |
| -4131253 | Eddy Morales | 15010acf-81a8-467b-9a84-18de494c2d67 |
| -4131254 | Cathy Keathley | 81648f4a-eb28-43dd-9368-97ccc19463bc |
| -4131255 | Jerry Hinton | 2efbeccb-be43-4637-ba5f-4b78aa169574 |
| -4131256 | Sue Piazza | 436f618a-84ec-48cf-a16d-e1b5532b8fd4 |
| -4131257 | Janine Gladfelter | 3881e5da-ad55-4f1e-b6b5-5091332ad2e7 |
| -4174851 | David Ripma | 3d541a36-ded8-4526-ab81-a19e347dc7cd |
| -4174852 | Carol Allen | bcb580d9-b8a5-49fe-8c94-b45d502b7501 |
| -4174853 | Jesse Davidson | 9fbd31da-61c3-4cfb-97d7-b46e5662d685 |
| -4174854 | John Leamy | f0a0b603-5252-4814-b806-36f9811d4cb7 |
| -4174855 | Glenn White | fa52105e-0278-44a3-bc6f-5c4a83b9bf2e |
| -4174856 | Geoffrey Wunn | 8c90648b-d5a5-45e9-8bf2-72bb2bb41c38 |
| -4174857 | Zach Andrews | cc6afbef-7404-4b5b-b8f6-6e9771fac247 |
| -4124251 | Keith Kudrna | 8cd38f06-a419-4fcd-823a-e7a5993d451d |
| -4124252 | Jeff Dennerline | abe06ff2-b738-4dcc-9728-edd75a62a0ea |
| -4124253 | Steve Marker | 07aabb93-5f06-4e95-80ce-0bc5657a7902 |
| -4124254 | E'an Todd | 3d57d4db-6a0a-4afb-8334-84c68cef69c5 |
| -4124255 | Jenni Weber | 9f2f1b93-6553-4c19-962f-7558f1f4c5a4 |
| -4124256 | Steve Owen | 262592f6-f8dd-4a22-9542-45ca58fdfe69 |
| -4124257 | Paul Copeland | 627b7099-0829-4551-b1e5-409aa1bb0dfc |
| -4183951 | Jairo Rios-Campos | 964c9691-3f40-4b95-86c9-d22cf10cc92d |
| -4183952 | Dara Tan | 0f7137d2-e780-4ca1-bdc4-7406f13df4ca |
| -4183953 | John Miner | 28119052-7b7e-4bb5-b4f4-fce0afcc88d4 |
| -4183954 | Charlene Gothard | 40d9f9da-55d0-451b-827d-113d75ea3a6e |
| -4183955 | Patricia Smith | 2411c25a-4141-4b5b-9e36-3b137430dec3 |
| -4146731 | Jim Akers | 88145fa2-5b34-4285-a467-326be4d06176 |
| -4146732 | Kevin Bussema | 098b7155-8e13-4980-b6fd-bfb436b3f3f2 |
| -4146733 | Jeff Baltzell | b719e16d-7a9f-43b8-b628-880758bc78b7 |
| -4146734 | Miriam Berman | 84f19fcd-f699-4bf8-a230-b780f6891f8c |
| -4146735 | Thomas Welander | f5bd2260-1809-4825-b0b5-5a47c59491e0 |

All 31 politicians have non-null `office_id` (back-fill complete).

## Special Cases Confirmed

### E'an Todd Apostrophe (Pitfall 7)
- Migration SQL uses `'E''an Todd'` (doubled ASCII apostrophe U+0027, not U+2019)
- DB record confirmed: `E'an Todd` stores correctly with plain ASCII apostrophe
- Smoke test uses `"E'an Todd"` (double-quoted TypeScript string, no escaping needed)
- Character confirmed consistent between SQL migration and TypeScript test

### Wood Village + Maywood Park Mayors
- Jairo Rios-Campos (-4183951): `is_appointed=true` on politician, `is_appointed_position=true` on office
- Jim Akers (-4146731): `is_appointed=true` on politician, `is_appointed_position=true` on office
- Gate 8 confirms: exactly 2 offices with `is_appointed_position=true` for these external_ids

### Charlene Gothard (-4183954)
- `is_appointed=true` on politician row (appointed to fill vacancy — Mark Clark resigned)
- `is_appointed_position=false` on office (council seat, not Mayor)

## Deviations from Plan

### Auto-Fixed Issues

None — plan executed exactly as written.

### Noted Observations

**1. Gate 2 LIKE query mismatch (plan verification SQL imprecision — not a data bug)**
- The plan's Gate 2 verification SQL used `LIKE 'City of % Oregon, US'` (missing comma before "Oregon")
- This pattern also matched the pre-existing 'City Council' chamber for 'City of Portland, Oregon, US', returning 6 rows
- Our 5 new chambers are correct (verified by exact name IN list returning 5 rows)
- The migration data is correct; the plan's Gate 2 test query was imprecise

## Known Stubs

None — all 31 officials are seeded with live data from official city websites. No placeholder values.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes beyond what the plan's threat model covers. Migration 246 writes only to `essentials` schema tables already in use.

## Self-Check

- [x] `C:/EV-Accounts/backend/migrations/246_multnomah_cities_government.sql` — EXISTS
- [x] `C:/EV-Accounts/backend/scripts/smoke-multnomah-cities.ts` — EXISTS
- [x] EV-Accounts commit `912c3ef` — confirmed via `git log`
- [x] All 10 SQL gates passed
- [x] Smoke test exits 0
- [x] Idempotency confirmed
- [x] Phase 83 not regressed

## Self-Check: PASSED
