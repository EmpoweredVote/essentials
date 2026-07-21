# Requirements: Essentials v24.0 — Results-Page Search & Header Overhaul

**Defined:** 2026-07-20
**Core Value:** A resident can look up who represents them — and who is on their ballot — without creating an account.

## v1 Requirements

Requirements for this milestone. Each maps to exactly one roadmap phase.

### SRCH — Unified Location Search (frontend)

- [ ] **SRCH-01**: The Results header shows a single location field, pre-filled with the current location and click-to-edit, replacing the Address/Browse mode toggle and the state→county→city LocationBrowser tree.
- [ ] **SRCH-02**: The field is an accessible combobox typeahead (WAI-ARIA combobox semantics + full keyboard support) that suggests covered-area and DB place-name matches as the user types.
- [x] **SRCH-03**: Typed input auto-classifies (full address / place name / decimal coordinates) and dispatches to the correct resolver with no manual mode switch.
- [x] **SRCH-04**: Ambiguous place names surface a candidate list that always shows the state qualifier (`City, ST` / `County, ST` / `ST`); the user picks — no silent best-guess.
- [x] **SRCH-05**: Decimal-degree coordinate input (`lat, lng`) resolves to a location profile.
- [ ] **SRCH-06**: The same location combobox powers the Landing-page search bar (one shared component).
- [ ] **SRCH-07**: The "Search by name" results-filter box is removed.
- [ ] **SRCH-08**: Google Places autocomplete is fully removed from Results + Landing, the dead `@googlemaps/js-api-loader` dependency is removed, and there are zero remaining `google`/`pac-container` references (acceptance grep).

### RSLV — Location Resolution (backend)

- [ ] **RSLV-01**: A DB place-name resolver endpoint returns ranked candidate locations `{geo_id, mtfcc, label, state}` for a city/county/state query, via pg_trgm/`f_unaccent` over `essentials.geofence_boundaries` + `essentials.governments`, with GIN trigram indexes added.
- [ ] **RSLV-02**: A build-time ingest of the free US Census Gazetteer Files (Places + Counties) populates a reference table, giving nationwide place-name coverage beyond the curated `coverage.js` catalog.
- [x] **RSLV-03**: An anonymous, stateless coordinate lookup endpoint returns officials for a decimal lat/lng via PostGIS `ST_Covers`, with US bounding-box validation and a swapped-lat/lng guard, performing no writes. — 213 (live smoke-verified 2026-07-21)
- [ ] **RSLV-04**: The US Census one-line geocoder is used only for full street addresses — never for bare place-name queries.
- [ ] **RSLV-05**: National fallback — any resolved US location returns at minimum US Senators + Governor/state executives + US House (every overlapping congressional district, backed by a nationwide `cd119` geofence load), plus county officials **where a county government exists** (best-effort, not gated — county rosters are not seeded nationwide); the exact single US House rep is returned when a precise point (address or coordinates) is available.
- [ ] **RSLV-06**: A city/county-name location profile lists every US House rep whose district overlaps the area, with an in-section note: "We need an exact address to tell you which one."
- [ ] **RSLV-07**: Wrong-state guard — a resolved location never returns officials bound to a different state (candidate-list + explicit state binding; regression guard against the prior browse `?q=` state-leak and `representing_city` hijack).

### HDR — Header Declutter

- [ ] **HDR-01**: The officials type filter defaults to Elected and the All/Appointed dropdown is removed.
- [ ] **HDR-02**: The Judges tab still shows appointed officials (per-tab override so the Elected default does not empty it).
- [ ] **HDR-03**: Compass lens controls collapse to icon buttons with accessible tooltips (gavel icon for Judicial), reclaiming the header's empty space.

## v2 Requirements

Deferred to a future milestone. Tracked, not in this roadmap.

### SRCH (future)

- **SRCH-F1**: DMS and other coordinate formats (`38°54'25"N, 77°02'11"W`).
- **SRCH-F2**: Reverse-geocode a coordinate to a full street label (v24.0 coordinate profiles use the covering place/county label).

### DATA (future)

- **DATA-F1**: Seed city/local officials and state-legislative-district geofences for the ~38 states that currently have only federal + county + state-exec coverage (so bare-city profiles carry local officials nationwide).

## Out of Scope

Explicitly excluded for v24.0.

| Feature | Reason |
|---------|--------|
| Seeding new city/local officials or state-legislature geofences | This is a search + resolver milestone; national fallback uses the already-nationwide federal/county/state-exec data. Broader local seeding tracked as DATA-F1. |
| DMS / non-decimal coordinate formats | Decimal degrees cover real paste behavior; DMS deferred (SRCH-F1). |
| ZIP as a primary/high-weight resolution signal | ZIPs straddle districts → low accuracy; accepted only as a weak signal, never the primary path. |
| Reverse-geocoding coordinates to a street address | Coordinate profiles use the covering place/county label; full reverse geocode deferred (SRCH-F2). |
| Reworking the Stances / `hasContext` badge (`coverage.js`) | Tangential to the search overhaul; revisit once resolution is DB-truth-based. |
| Google / paid geocoding providers with ads or branding on our forms | Explicit product constraint — own the search stack (Census + our DB resolver). |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| RSLV-01 | 212 | Pending |
| RSLV-02 | 212 | Pending |
| RSLV-04 | 212 | Pending |
| RSLV-05 | 212 | Pending |
| RSLV-06 | 212 | Pending |
| RSLV-07 | 212 | Pending |
| RSLV-03 | 213 | Complete |
| SRCH-01 | 214 | Pending |
| SRCH-02 | 214 | Pending |
| SRCH-03 | 214 | Complete |
| SRCH-04 | 214 | Complete |
| SRCH-05 | 214 | Complete |
| SRCH-06 | 214 | Pending |
| SRCH-08 | 214 | Pending |
| SRCH-07 | 215 | Pending |
| HDR-01 | 215 | Pending |
| HDR-02 | 215 | Pending |
| HDR-03 | 215 | Pending |

**Coverage:**
- v1 requirements: 18 total (SRCH 8, RSLV 7, HDR 3)
- Mapped to phases: 18/18 — Phase 212 (6), Phase 213 (1), Phase 214 (7), Phase 215 (4)
- Unmapped: 0 — no orphans, no duplicates

---
*Requirements defined: 2026-07-20*
*Last updated: 2026-07-20 — roadmap created, all 18 requirements mapped to Phases 212-215*
