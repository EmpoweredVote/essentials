# Phase 162: City of Las Vegas Deep-Seed - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-27
**Phase:** 162-city-of-las-vegas-deep-seed
**Areas discussed:** Ward routing granularity, Mayor modeling, Government & external_id block, Stances & headshot sourcing

---

## Ward routing granularity

| Option | Description | Selected |
|--------|-------------|----------|
| Single city geofence, show all 6 | Attach Mayor + 6 council members to one LV city district; show all 6 ward-labeled. Matches 161 + LA by-district cities. No custom polygons. | |
| Build custom ward geofences | Ingest LV's 6 ward polygons (first non-TIGER city-ward geofences) so an address returns its one correct ward member. Precisely meets SC#1. | ✓ |

**User's choice:** Build custom ward geofences.
**Notes:** Project's first non-TIGER city-ward geofences. Adds a Wave-0 GIS sourcing task. Mayor remains at-large (whole-city geofence).

### Ward fallback (follow-up question)

| Option | Description | Selected |
|--------|-------------|----------|
| Fall back to single-city, defer wards | If Wave-0 can't source clean ward polygons, attach all 6 to the city geofence (ward-labeled), defer ward precision, phase still completes. | ✓ |
| Block until ward polygons are found | Treat ward geofences as a hard requirement; pause phase until polygons sourced. | |

**User's choice:** Fall back to single-city, defer wards.
**Notes:** Safety net so the deep-seed isn't hard-blocked if no clean ward GIS source exists.

---

## Mayor modeling

| Option | Description | Selected |
|--------|-------------|----------|
| At-large seat in Council chamber | Mayor = distinct directly-elected at-large seat in the council chamber, "Mayor" title, city-wide, sorted first. NOT rotational. | ✓ |
| Separate LOCAL_EXEC office/chamber | Mayor in its own executive chamber separate from the 6-member council. | |

**User's choice:** At-large seat in Council chamber.
**Notes:** LV Mayor (Shelley Berkley) directly elected at-large, in office since Jan 2025. Chamber = Mayor + 6 ward seats (7 total). Explicitly not the LA rotational/title-on-seat pattern.

---

## Government & external_id block

| Option | Description | Selected |
|--------|-------------|----------|
| Standalone 'City of Las Vegas, Nevada, US' | Own government row, not nested under State of NV. Prevents city officials surfacing under the state tier. IDs via Wave-0 probe. | ✓ |
| Let me specify differently | Different naming/nesting preference (freeform). | |

**User's choice:** Standalone 'City of Las Vegas, Nevada, US'.
**Notes:** Mirrors Clark County (161) + LA-city naming. external_id block + geo_id confirmed via Wave-0 collision probe.

---

## Stances & headshot sourcing

| Option | Description | Selected |
|--------|-------------|----------|
| lasvegasnevada.gov → workarounds → free alternates | City site first; on WAF/403 use Chrome-UA/curl workarounds; then Wikimedia/campaign/Ballotpedia (free, descriptive UA); document gaps. 600×750, no overlays, no fabrication. | ✓ |
| Different sourcing priority | Different source order/constraint (freeform). | |

**User's choice:** lasvegasnevada.gov → workarounds → free alternates.
**Notes:** Stance methodology fully locked by standing rules (all live topics, one-at-a-time, evidence-only, ~18–21 depth, zero defaults).

---

## Claude's Discretion

- Exact LV ward-polygon data source + ingestion mechanism (Wave-0 research; greenfield for the project).
- Exact external_id range for the 7 seats (Wave-0 probe).
- Migration split + next migration number (confirm DB ledger MAX in Wave-0; ~1064 per v18.0 park memory).
- Council chamber name + per-ward free-text label.

## Deferred Ideas

- Single-city fallback as a permanent state (only if ward sourcing fails).
- Non-elected city offices (City Attorney, Municipal Court judges, City Manager).
- Reusing the LV ward-geofence pipeline for Henderson / North Las Vegas (Phases 163–164) if it generalizes.
