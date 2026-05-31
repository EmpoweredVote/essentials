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
- `mtfcc = 'G5420'` (TIGER unified school district code; semantically correct even though source is not TIGER)
- Load 7 rows only — one per board sub-district; no overall LAUSD boundary row
- **Note (post-research):** `geofence_boundaries` has NO `district_type` column — that column belongs to `essentials.districts`. Phase 58 inserts only into `geofence_boundaries` (no `districts` row). When Phase 62 creates the `districts` row, use `district_type = 'SCHOOL'` (matching `essentialsService.ts` and `resolve_user_jurisdiction`), NOT `'SCHOOL_DISTRICT'`.

### Shapefile source
- Primary source: LA GeoHub ArcGIS REST API — `https://maps.lacity.org/lahub/rest/services/LAUSD_Schools/MapServer/7` (publicly accessible, no auth)
- Use a standalone TypeScript loader script — not the TIGER loader, not direct SQL import
- Loader must be repeatable (upsert on re-run) to handle future redistricting
- Upsert key: `ON CONFLICT (geo_id, mtfcc) DO NOTHING` — the existing unique constraint on `geofence_boundaries` is `(geo_id, mtfcc)`; there is no `district_type` column to use as a key

### Routing edge cases
- Non-LAUSD addresses: spatial lookup finds no polygon → no row returned for LAUSD tier
- Partial-coverage cities: trust geometry — return LAUSD row if point is inside polygon; no city-exclusion list
- Unincorporated LA County: same spatial lookup as city addresses; geography is authoritative

### Claude's Discretion
- Handling of edge-case cities where LAUSD polygon overlaps another district's territory: trust geometry (confirmed by research — Beverly Hills/Santa Monica/Culver City are correctly excluded from LAUSD polygons)

### Smoke test design
- TypeScript smoke test script (same pattern as `smoke-ca-geofences.ts` from Phase 57)
- SQL gate: `COUNT=7` filtering by `geo_id LIKE 'lausd-board-district-%' AND mtfcc='G5420' AND state='06'` — NOT raw `mtfcc='G5420'` count (which would return 353, including 346 existing TIGER UNSD rows)
- Positive test: downtown LA (lon=-118.2437, lat=34.0522) → asserts at least 1 LAUSD row returned (do not hard-code district number)
- Negative test: Pasadena City Hall (lon=-118.1437, lat=34.1478) → asserts 0 LAUSD rows

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
