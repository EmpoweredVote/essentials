# Phase 203 Context — Indio Deep-Seed

**Appended Coachella Valley, CA track. Compiled 2026-07-12 from recon + web research. Verify current officeholders at plan/execute time.**

## DB pre-check (read-only, 2026-07-12)
- **Greenfield**: no `essentials.governments` row for Indio.
- **Geofence already loaded** (TIGER 2024, `state='06'`): Indio city — geo_id `0636448`, mtfcc `G4110`.
- Only NEW geofences needed = 5 council-district **X-prefixed** polygons.

## Structure
- Council–Manager. **5-member City Council, elected BY DISTRICT** (moved from at-large late-2010s to settle a CVRA challenge; no at-large seat).
- **Rotational mayor**: Council selects Mayor + Mayor Pro Tem from members each December. Use the **by-district relabel pattern** — Mayor/MPT are titles on their district seats, NOT separate LOCAL_EXEC rows.
- Districts defined by **Ordinance No. 1775** (Official Council District Map).

## Roster (verify at execute time)
| District | Full name | Title |
|---|---|---|
| 1 | Glenn Miller | Councilmember (outgoing Mayor, passed gavel Dec 2025) |
| 2 | Waymond Fermon | **Mayor Pro Tem** |
| 3 | **Elaine Holmes** | **Mayor** (selected Dec 2025; prior mayoral terms 2013/2017/2021) |
| 4 | Oscar Ortiz | Councilmember |
| 5 | Benjamin Guitron IV | Councilmember ⚠ **reconfirm full name** against live profile (CivicWeb lists "IV"; some snippets only "Benjamin") |

## Headshots — WAF-403 map
- **indio.org → HTTP 403** (CivicPlus/WAF). Directory: /departments/city-council/meet-your-representatives (CivicPlus StaffDirectory component id 38, e.g. Holmes = /Home/Components/StaffDirectory/StaffDirectory/38/181).
- **Working fallback (responded to bots):** `indio.civicweb.net/portal/members.aspx?id=10` — carries member photos.
- Browser-UA / Playwright for indio.org if needed. Pipeline: 4:5 crop FIRST → 600×750 Lanczos q90, `press_use`, `type='default'`.

## District geofence source (X-geofences)
- **City self-hosted ArcGIS REST (live):** `https://gis.indio.org/arcgis/rest/services/` — browse for a Boundaries/Districts FeatureServer/MapServer layer, pull `?f=geojson`.
- Map portal front-end: experience.arcgis.com/experience/c7f7f2efba5f4f2fabd9210b3ceafa4e.
- Fallback: county/state geoportal, or digitize from the Ord. 1775 PDF (behind WAF at /departments/city-manager/city-maps).
- **Cross-check:** feature count = 5, district-number attribute present.

## Deep-seed unit
government (WHERE NOT EXISTS) + City Council chamber → 5 district X-geofences → roster (rotational Mayor/MPT as seat titles) → 600×750 headshots → evidence-only stances (ONE agent at a time, all live topics, 100% cited, no defaults, honest blanks) → licensed banner (real street-scene/skyline, no AI/aerial, one at a time) → surface in `src/lib/coverage.js` → split-section check (expect 0).

## Sources
indio.civicweb.net/portal/members.aspx?id=10 · indio.org/departments/city-council (403 to bots) · theindiopost.com (Holmes Dec-2025 installation) · ballotpedia.org/Indio,_California · gis.indio.org/arcgis/rest/services
