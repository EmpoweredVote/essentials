# Phase 201 Context — Riverside County Board of Supervisors Deep-Seed

**Appended Coachella Valley, CA track. Compiled 2026-07-12 from recon + web research. Verify current officeholders at plan/execute time (2026 election certification pending).**

## DB pre-check (read-only, 2026-07-12)
- **Greenfield**: no `essentials.governments` row for Riverside County or either city.
- **Geofences already loaded** (Census TIGER 2024, `state='06'` = FIPS, NOT 'CA'):
  - Riverside County — geo_id `06065`, mtfcc `G4020`
  - (Palm Springs city `0655254`, Indio city `0636448` — for sibling phases)
- Only NEW geofences needed = 5 supervisorial-district **X-prefixed** polygons.

## Structure
- **5-member Board of Supervisors, elected by district (1-5)**; districts redrawn in 2021.
- **Chair chosen annually by the Board** (member vote — NOT rotational-by-seat). 2026 chair: Karen Spiegel (D2). 2025 chair was Manny Perez (D4).
- Standalone COUNTY government (geo_id 06065) — **NOT** nested under State of CA. COVERAGE_COUNTIES block (Pima County / Clark County pattern).

## Roster (verify at execute time)
| District | Supervisor | Official site |
|---|---|---|
| 1 | Jose Medina | rivcodistrict1.org |
| 2 | Karen Spiegel (Chair 2026) | rivcodistrict2.org/about-supervisor-karen-spiegel |
| 3 | Chuck Washington | supervisorchuckwashington.com/meet-chuck-staff |
| 4 | V. Manuel "Manny" Perez | rivco4.org |
| 5 | Dr. Yxstian Gutierrez | rivcodistrict5.org/biography |

**2026 election note:** June 2, 2026 primary — D2 & D4 on ballot; incumbents Spiegel & Perez leading, D5 Gutierrez won ~98.6%. No turnover expected; treat as "leading/won" pending certification.

## Constitutional officers
- **Seed (confirmed):** Sheriff–Coroner **Chad Bianco** ⚠ (running for CA Governor 2026 — re-verify still sitting), DA **Mike Hestrin**, Assessor–County Clerk–Recorder **Peter Aldana** (re-elected June 2026, rivcoacr.org).
- **DEFER (unconfirmed in research):** Auditor-Controller, Treasurer-Tax Collector — do NOT seed without verifying current names.

## Headshots — WAF-403 map
- Primary county domains **rivco.gov** and **rivcocob.org** → **HTTP 403** to bots.
- Headshots via the 5 individual district sites (above), Ballotpedia, or Wikimedia. Test each district domain individually.
- Standard pipeline: 4:5 crop FIRST → 600×750 Lanczos q90, `press_use`, `type='default'`.

## District geofence source (X-geofences)
- **Authoritative REST (use this):** `https://gis.countyofriverside.us/arcgis_mapping/rest/services/OpenData/SupervisorialDistricts/MapServer/0` — query `?f=geojson`.
- Hub dataset: gisopendata-countyofriverside.opendata.arcgis.com → "Supervisor Districts" (Shapefile/GeoJSON/KML).
- **Cross-check:** feature count = 5, district-number attribute present, reflects 2021 boundaries.

## Deep-seed unit (carry from milestone conventions)
government (WHERE NOT EXISTS) + BoS chamber → 5 district X-geofences → roster + constitutional officers → 600×750 headshots → evidence-only stances (ONE agent at a time, all live topics, 100% cited, no defaults, honest blanks) → licensed community banner (real street-scene/skyline, no AI/aerial, one at a time) → surface in `src/lib/coverage.js` COVERAGE_COUNTIES → split-section check (expect 0).

## Sources
rivcocob.org/riverside-county-board-supervisors · ballotpedia.org/Government_of_Riverside_County,_California · ballotpedia.org/Riverside_County,_California,_elections,_2026 · the 5 district sites · rivcoacr.org · riversidesheriff.org
