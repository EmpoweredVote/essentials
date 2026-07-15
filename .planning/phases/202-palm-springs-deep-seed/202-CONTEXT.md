# Phase 202 Context — Palm Springs Deep-Seed

**Appended Coachella Valley, CA track. Compiled 2026-07-12 from recon + web research. Verify current officeholders at plan/execute time.**

## DB pre-check (read-only, 2026-07-12)
- **Greenfield**: no `essentials.governments` row for Palm Springs.
- **Geofence already loaded** (TIGER 2024, `state='06'`): Palm Springs city — geo_id `0655254`, mtfcc `G4110`.
- Only NEW geofences needed = 5 council-district **X-prefixed** polygons.

## Structure
- **5-member City Council, elected entirely BY DISTRICT** (adopted 2018 after CVRA pressure; no at-large seats remain).
- **Rotational mayor** (since 2019): council appoints Mayor + Mayor Pro Tem to 1-year terms; largely ceremonial. Use the **by-district relabel pattern** — Mayor/MPT are titles on their district seats, NOT separate LOCAL_EXEC rows or districts.
- ⚠ Early-2026 council was *discussing* switching to a directly-elected mayor (KESQ) — NOT adopted as of research; rotational stands. Re-check at execute time.

## Roster (verify at execute time)
| District | Officeholder | Role |
|---|---|---|
| 1 | Grace Elena Garner | Councilmember (up Nov 2026) |
| 2 | Jeffrey Bernstein | Councilmember (up Nov 2026) |
| 3 | Ron deHarte | Councilmember (term dates unconfirmed — verify) |
| 4 | **Naomi Soto** | **Mayor** (28th mayor, sworn Dec 2025, 1-yr term) |
| 5 | David H. Ready | **Mayor Pro Tem** (next to rotate into mayor) |

## Headshots — WAF-403 map
- **palmspringsca.gov → HTTP 403** to bots. Directory page: /government/mayor-city-council (image path not extractable behind WAF).
- Fallbacks: Ballotpedia, Wikimedia, campaign sites (naomisoto.com, rondeharte.com). Browser-UA / headless fetch if needed.
- Pipeline: 4:5 crop FIRST → 600×750 Lanczos q90, `press_use`, `type='default'`.

## District geofence source (X-geofences)
- ArcGIS Experience app: `https://experience.arcgis.com/experience/1a70cef86eb344a68d15547186bcb5a9` (2018 Council Districts) — inspect its network calls for the backing **FeatureServer** URL, then pull `?f=geojson`.
- City GIS portal (likely WAF): palmspringsca.gov/services/maps-gis.
- Fallback: California State Geoportal gis.data.ca.gov.
- **Cross-check:** feature count = 5, district-number attribute present.

## Deep-seed unit
government (WHERE NOT EXISTS) + City Council chamber → 5 district X-geofences → roster (rotational Mayor/MPT as seat titles) → 600×750 headshots → evidence-only stances (ONE agent at a time, all live topics, 100% cited, no defaults, honest blanks) → licensed banner (real street-scene/skyline, no AI/aerial, one at a time) → surface in `src/lib/coverage.js` → split-section check (expect 0).

## Sources
palmspringsca.gov/government/mayor-city-council · ballotpedia.org/Palm_Springs,_California · thepalmspringspost.com (Soto sworn in as 28th mayor) · kesq.com (directly-elected-mayor discussion 2026) · ArcGIS Experience 1a70cef8…
