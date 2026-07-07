# Phase 175: Washington County Commission Deep-Seed - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-30
**Phase:** 175-washington-county-commission-deep-seed
**Areas discussed:** Routing granularity, Roster & body name

---

## Area selection

| Option | Description | Selected |
|--------|-------------|----------|
| Chair modeling | Confirm Multnomah elected-Chair pattern | (accepted as recommended, not opened) |
| Routing granularity | Single county district vs per-district geofences | ✓ |
| Roster & body name | How research verifies roster + official name | ✓ |
| Nothing — write CONTEXT | Proceed on precedent | |

**User's choice:** Routing granularity + Roster & body name
**Notes:** Chair modeling left at the recommended Multnomah pattern (distinct "County Chair" office on COUNTY district, role_canonical NULL, Chair-first). "Nothing" not selected — user wanted to open the two areas.

---

## Routing granularity

| Option | Description | Selected |
|--------|-------------|----------|
| Single county district | All 5 return for any WashCo address (Multnomah/Clark precedent) | |
| Per-district geofences | Custom polygons so each address returns its 1 commissioner | ✓ |
| Single now, defer per-district | Ship single-county-district, defer per-district | |

**User's choice:** Per-district geofences (divergence from Multnomah/Clark precedent)
**Notes:** Mechanism reuses the established custom X00xx ward-geofence ingest (Portland/LV/NLV), so not first-of-kind.

### Follow-up: Chair routing under per-district model

| Option | Description | Selected |
|--------|-------------|----------|
| Chair (county-wide) + 1 commissioner | Chair returns everywhere; D1-4 route by polygon | ✓ |
| Only the 1 matched commissioner | Chair routes by polygon (wrong — Chair is at-large) | |
| Chair + all 4 commissioners | Everyone returns everywhere | |

**User's choice:** Chair (county-wide) + 1 matched commissioner
**Notes:** Matches how the seats are actually elected — Chair at-large, Districts 1–4 geographic.

### Follow-up: Boundary source

| Option | Description | Selected |
|--------|-------------|----------|
| Official Washington County GIS | County open-data portal commissioner-district boundaries | ✓ |
| Census/TIGER if one exists | Unlikely — TIGER doesn't carry county-commission districts | |
| Researcher decides best source | Leave fully to researcher | |

**User's choice:** Official Washington County GIS
**Notes:** Researcher locates exact shapefile/GeoJSON; planner assigns custom X00xx mtfcc + district_type before load.

---

## Roster & body name

| Option | Description | Selected |
|--------|-------------|----------|
| Match official county site | Verify live roster + exact body name from washingtoncountyor.gov; no hardcoding | ✓ |
| Match site, name = 'Board of County Commissioners' | Standardize to Clark/St. Mary's convention | |
| Match site, name = 'Board of Commissioners' | Standardize to Multnomah convention | |

**User's choice:** Match official county site
**Notes:** No hardcoding from memory — roster turnover (e.g. 2024 elections) may have occurred; name the chamber exactly as the county labels it.

---

## Claude's Discretion

- External_id range for the 5 officials (Wave-0 probe; non-colliding OR block).
- Next migration number (estimate 1118; confirm DB ledger MAX at Wave-0).
- Custom X00xx mtfcc code + district_type for the 4 commission-district geofences.
- Migration split (structural + audit-only headshots + per-official stance migrations).
- Whether commissioner offices carry a free-text "District N" label (recommended).

## Deferred Ideas

- Washington County row officers (Sheriff, DA, Assessor, Clerk, Treasurer, etc.) — separate future phase.
- Metro regional government (tri-county Metro Council) — separate future phase.
