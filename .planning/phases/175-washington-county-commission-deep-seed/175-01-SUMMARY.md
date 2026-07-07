---
phase: 175-washington-county-commission-deep-seed
plan: 01
status: complete
completed: 2026-06-30
requirements: [WASH-01]
---

# Plan 175-01 Summary — WashCo Board of County Commissioners (structural)

## What was built

Standalone county government **'Washington County, Oregon, US'** (geo_id `41067`, NOT nested
under State of Oregon) + **Board of County Commissioners** chamber (official_count=5) + full
5-seat roster: directly-elected **County Chair** routing county-wide via the existing COUNTY
geofence (41067), and 4 district commissioners each routing via a custom **X0018** per-district
geofence loaded from the official Washington County GIS FeatureServer.

## Files (committed in EV-Accounts @ 415e4728)

- `C:/EV-Accounts/backend/scripts/load-washco-commissioner-boundaries.ts` — loader; native GeoJSON
  (f=geojson, outSR=4326) → `essentials.geofence_boundaries` as X0018 / state='or'. Live run
  inserted 4 valid MultiPolygons (0 repaired).
- `C:/EV-Accounts/backend/migrations/1120_washco_commission.sql` — structural migration; registered
  in ledger as `('1120','washco_commission')`.

## Wave-0 probe results (confirmed at execution)

- **Next migration number = 1120** (on-disk highest was 1119; ledger MAX registered = 1107).
  Downstream: headshots **1121**, stances **1122–1126**.
- COUNTY district `41067` PRE-EXISTED with `district_type='COUNTY'`, `state='or'` (correct
  lowercase), id `210ca980-7756-48aa-8de5-e092a3da327a` → the Step-3a guard correctly no-op'd
  (INSERT 0 0).
- external_id block `-410113..-410100` was FREE (0 rows).
- **X0018** unclaimed as an mtfcc (only a comment mention in mig 246; X0017 was highest real).
- FeatureServer live: 4 features, COMMDIST 1–4.
- Roster ground-truthed (D-06) against the CoCommissioners FeatureServer (Firstname/Lastname per
  district) + washingtoncountyor.gov/elections/county-officials. Body name verified as exactly
  'Board of County Commissioners'.

## 5 minted politician UUIDs (needed by Plans 02 & 03)

| Seat | Name | external_id | politician UUID | office title |
|------|------|-------------|-----------------|--------------|
| Chair | Kathryn Harrington | -410100 | `76b00811-8bf8-46c0-bb0c-9867c90fe9d4` | County Chair |
| D1 | Nafisa Fai | -410110 | `a1fe6f71-0d44-4c85-957f-06ffb6a4f825` | Commissioner, District 1 |
| D2 | Pam Treece | -410111 | `0cb0bffc-efea-4e0b-93e0-7a53eae10a42` | Commissioner, District 2 |
| D3 | Jason Snider | -410112 | `a98aeea6-c7cf-475c-96f2-100119c9037a` | Commissioner, District 3 |
| D4 | Jerry Willey | -410113 | `f010b78a-9050-4bba-baed-0070037cd2da` | Commissioner, District 4 |

## Verification gates (all pass)

1. X0018 geofences: `(4, true)` ✓
2. Government row: `1` ✓
3. Roster offices: `5` ✓
4. Chair on COUNTY 41067: `1` ✓
5. Commissioners on LOCAL X0018 districts: `4` ✓
6. Section-split scan (41067 / G4020 non-chair orphans): `0` ✓
7. Ledger registered 1120: `1` ✓
+ In-migration post-verification DO block: PASSED (gov=1, chair_offices=1, commissioner_offices=4, split_orphans=0).

## Headshot source URLs discovered (bonus for Plan 02)

All 5 on `media-production.washcotech.net` (from the county-officials page, `max_966_wide` style):
- Chair Harrington: `.../2023-01/Chair Harrington 22.jpg`
- Fai D1: `.../2023-01/Fai D1 22.jpg`
- Treece D2: `.../2023-01/Treece D2 22.jpg`
- Snider D3: `.../2025-01/snider.jpg`
- Willey D4: `.../2023-01/Willey D4 22.jpg`

## Deviations

- Migration numbered 1120 (plan/CONTEXT estimate of 1118 was stale — candidate migs 1115–1119
  landed after research). All downstream file numbers shifted accordingly (documented above).
- No other deviations.

## Self-Check: PASSED
