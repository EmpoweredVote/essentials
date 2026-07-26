# Phase 201: Riverside County Board of Supervisors Deep-Seed - Context

**Gathered:** 2026-07-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Seed Riverside County, CA as a **standalone COUNTY government** (geo_id `06065`, NOT nested under
State of CA) with its **5-member, by-district Board of Supervisors** — the full deep-seed unit:
government + chamber → 5 supervisorial-district X-geofences → roster + 600×750 headshots →
evidence-only compass stances → licensed community banner → surface in `src/lib/coverage.js`
COVERAGE_COUNTIES. First entry in the appended Coachella Valley, CA track (Phases 201–203).

**In scope:** the 5 elected supervisors only.
**Out of scope:** countywide constitutional officers (Sheriff, DA, Assessor, etc.) — see D-01;
the two cities (Palm Springs = Phase 202, Indio = Phase 203).
</domain>

<decisions>
## Implementation Decisions

### Officials scope
- **D-01: Board of Supervisors ONLY — no constitutional officers.** Matches every prior county
  deep-seed precedent (DB-verified: Pima County = 5 offices, Clark County = 7, Multnomah = 5,
  Washington OR = 5 — all board-only, none with a separate Sheriff/DA/Assessor chamber). Keeps the
  compass clean (Sheriff/Assessor have no natural compass fit; DA would pull in the judicial compass).
  Sheriff Bianco / DA Hestrin / Assessor Aldana are **deferred** to a possible focused follow-up.

### Chair representation
- **D-02: Label "Chair" as a title on the sitting supervisor's district seat**, mirroring the
  rotational-mayor pattern (title on the existing seat, NO extra office row). 2026 chair = Karen
  Spiegel (D2). **Re-verify the current chair at execute time** — the annual chair vote and the June
  2026 election results are both pending final certification.

### Community banner
- **D-03: Riverside county-seat civic scene** (downtown Riverside / Mission Inn street scene) — the
  conventional way to represent the county, visually distinct from the Palm Springs & Indio city
  banners in 202/203. Real licensed street-scene photo, no AI/aerial. Source one at a time per the
  banner playbook; show candidates before committing.

### Deep-seed conventions (carried from milestone-wide rules)
- **D-04:** Standalone county government via `WHERE NOT EXISTS` (essentials.governments has no unique
  geo_id constraint). 5 supervisorial-district X-geofences (new mtfcc code, e.g. X0021 — assign next
  free per loader). Stances evidence-only, ONE research agent at a time, all live topics, 100% cited,
  no defaults, honest blank spokes. `hasContext:true` chip only once ≥1 stance row exists.

### Claude's Discretion
- DB verification steps (Bianco tenure, D5 roster, ArcGIS feature count = 5, section-split = 0) run
  inline during planning/execution — not user decisions.
- Exact X-geofence mtfcc number and ext_id range assigned at plan time (collision-safe, per prior
  county pattern).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase recon (this phase)
- `.planning/phases/201-riverside-county-board-of-supervisors-deep-seed/201-CONTEXT.md` — this file (decisions + recon below)

### Playbook & precedent
- `LOCATION-ONBOARDING.md` — cold-start city/county onboarding playbook (+ CA and NV/OR county Quick References)
- `docs/banner-asset-pipeline.md` — banner processing/upload (`scripts/banners/process_banner.py`, `upload_banner.py`)
- Prior county deep-seed precedent (board-only): Pima County (Phase 193), Clark County (Phase 161), Washington County OR (Phase 175) — see their phase dirs / milestone audits

### Surfacing
- `src/lib/coverage.js` — COVERAGE_COUNTIES block (add Riverside County entry)
- `src/lib/buildingImages.js` — CURATED_LOCAL banner entry + attribution

No new external ADRs/specs — requirements fully captured in decisions above + REQUIREMENTS.md CV-01.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **TIGER county boundary already loaded**: `essentials.geofence_boundaries` geo_id `06065`, mtfcc `G4020`, `state='06'` (FIPS, NOT 'CA'). No county-boundary load needed.
- **Standalone-county pattern**: replicate Pima/Clark/WashCo — county `governments` row (not under State of CA), single `Board of Supervisors` chamber, 5 district offices.
- **X-geofence loader**: prior counties used custom X-prefixed supervisorial-district polygons (LA County used X0005). Assign next free X-code.

### Established Patterns
- `essentials.chambers.slug` is a GENERATED column — never include in INSERT.
- `districts.state` casing: lowercase for STATE/COUNTY tiers.
- `politician_images.type` must be `'default'` (UI filters on it); headshots 4:5 crop FIRST → 600×750 Lanczos q90, `press_use`.
- Stance migrations apply audit-only (not registered in schema_migrations ledger); structural migs registered. Disk migration counter is authoritative.

### Integration Points
- District X-geofences must PIP-route: a probe point in each district returns exactly one supervisor (+ the county G4020).
- coverage.js COVERAGE_COUNTIES + purple chip reconciled against real DB stance counts.

## Recon facts (verify current officeholders at execute time; 2026 certification pending)

**Structure:** 5-member Board of Supervisors, by district (1–5), redrawn 2021. Chair chosen annually by member vote (2026: Spiegel D2; 2025: Perez D4).

**Roster:**
| District | Supervisor | Source site |
|---|---|---|
| 1 | Jose Medina | rivcodistrict1.org |
| 2 | Karen Spiegel (Chair 2026) | rivcodistrict2.org |
| 3 | Chuck Washington | supervisorchuckwashington.com |
| 4 | V. Manuel "Manny" Perez | rivco4.org |
| 5 | Dr. Yxstian Gutierrez | rivcodistrict5.org |

**Headshots — WAF-403:** primary domains rivco.gov + rivcocob.org return 403 to bots. Pull from the 5 individual district sites / Ballotpedia / Wikimedia; test each district domain individually.

**District geofence source:** REST `https://gis.countyofriverside.us/arcgis_mapping/rest/services/OpenData/SupervisorialDistricts/MapServer/0` → `?f=geojson` (authoritative). Hub mirror: gisopendata-countyofriverside.opendata.arcgis.com "Supervisor Districts". Cross-check feature count = 5, district-number attribute, 2021 boundaries.
</code_context>

<specifics>
## Specific Ideas

- Banner: downtown Riverside / Mission Inn civic scene (D-03).
- Chair as a seat title (D-02), same mechanism as the rotational-mayor relabel used for CA/AZ cities.
</specifics>

<deferred>
## Deferred Ideas

- **Riverside County constitutional officers** (Sheriff Chad Bianco — note 2026 gubernatorial run, DA Mike Hestrin, Assessor–County Clerk–Recorder Peter Aldana, plus unconfirmed Auditor-Controller + Treasurer-Tax Collector) — a possible focused follow-up phase; out of scope here per D-01.
- Additional Coachella Valley cities beyond Palm Springs (202) + Indio (203) — e.g. Cathedral City, Palm Desert, La Quinta — candidates for a future wave.

None of the above block Phase 201.
</deferred>

---

*Phase: 201-riverside-county-board-of-supervisors-deep-seed*
*Context gathered: 2026-07-12*
