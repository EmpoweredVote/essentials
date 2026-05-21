# Phase 58: LAUSD Geofences - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Load the 7 LAUSD board district boundaries into `geofence_boundaries` as a distinct geofence type so any LA address also returns the resident's LAUSD board district. Non-LAUSD addresses (e.g. Pasadena) return no SCHOOL_DISTRICT row. Seeding LAUSD officials and displaying the board district in the UI are separate phases (Phase 62).

</domain>

<decisions>
## Implementation Decisions

### Geofence type identity
- `district_type = 'SCHOOL_DISTRICT'` (uppercase, matches existing convention; generalizes to future school districts)
- `mtfcc = 'G5420'` (TIGER unified school district code; semantically correct even though source is not TIGER)
- Load 7 rows only — one per board sub-district; no overall LAUSD boundary row
- API returns SCHOOL_DISTRICT rows alongside other tiers (no deferred surfacing); frontend handles unknown tiers gracefully

### Shapefile source
- Primary source: LAUSD GIS portal (authoritative; LAUSD publishes their own board district shapefiles)
- Use a standalone TypeScript loader script — not the TIGER loader, not direct SQL import
- Loader must be repeatable (upsert on re-run) to handle future redistricting
- Upsert key: composite of `name` + `state` + `district_type` (e.g. name='Board District 1', state='06', district_type='SCHOOL_DISTRICT')

### Routing edge cases
- Non-LAUSD addresses: API returns nothing for SCHOOL_DISTRICT tier — spatial lookup finds no polygon, no row returned
- Partial-coverage cities (e.g. addresses in cities that have both LAUSD overlap and their own district): trust geometry — return LAUSD row if point is inside polygon; no city-exclusion list
- Unincorporated LA County: same spatial lookup as city addresses; no distinction; geography is authoritative

### Claude's Discretion
- Handling of edge-case cities where LAUSD polygon overlaps another district's territory (verify actual overlap in research before deciding)

### Smoke test design
- TypeScript smoke test script (same pattern as `smoke-ca-geofences.ts` from Phase 57)
- SQL gate inside the script: assert `COUNT=7` in `geofence_boundaries WHERE district_type='SCHOOL_DISTRICT'`
- Positive test: 1 address inside LAUSD territory (downtown LA, ~-118.2437, 34.0522) → asserts SCHOOL_DISTRICT row returned
- Negative test: 1 Pasadena address → asserts no SCHOOL_DISTRICT row returned

</decisions>

<specifics>
## Specific Ideas

- Deferred idea: Other LA-area school districts (Pasadena Unified, Beverly Hills USD, etc.) — loading additional districts beyond LAUSD is a future phase

</specifics>

<deferred>
## Deferred Ideas

- **Loading other LA-area school districts** (Pasadena Unified, Beverly Hills USD, Santa Monica-Malibu USD, Burbank USD, etc.) — LAUSD only in Phase 58; other districts are their own future phase

</deferred>

---

*Phase: 58-lausd-geofences*
*Context gathered: 2026-05-21*
