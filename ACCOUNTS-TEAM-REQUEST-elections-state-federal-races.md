# Request: State and Federal Races Missing from Elections API Response

**From:** Essentials Frontend Team
**To:** Accounts API Team
**Date:** 2026-04-12
**Priority:** Medium — Elections page launched but only returning local races for LA County addresses

---

## Background

We launched the `/elections` page (Phase 2 of the Elections milestone). It calls `GET /essentials/elections-by-address?address=...` and renders whatever races the backend returns, grouped by tier (Local → State → Federal).

The page is working correctly — it renders all tiers, all races, all candidates for whatever the API returns. The issue is what the API is returning.

---

## The Problem

For a downtown LA address (`500 W Temple St, Los Angeles, CA 90012`), the elections endpoint returns **1 race**: LA County Board of Supervisors District 1.

A resident at that address also votes in:
- **State:** CA State Assembly (District TBD), CA State Senate (District TBD)
- **Federal:** US House of Representatives (Congressional District TBD)

None of those races are appearing in the response.

---

## Root Cause (inferred)

One of two things is happening — possibly both:

**1. Race records not loaded**
The `essentials.races` table may not have State Assembly, State Senate, or Congressional race records for the 2026 LA County Primary. If the races don't exist in the database, the geofence query can't return them.

**2. Geofences not loaded for CA state/federal districts**
The `essentials.geofence_boundaries` table may not have PostGIS geometries for CA State Assembly, State Senate, or Congressional districts. If the geofences aren't there, the `ST_Covers` point-in-polygon query won't match — even if the race records exist.

The `elections-by-address` endpoint geocodes the address to a lat/lng point and then runs a `ST_Covers` query against `geofence_boundaries`. Races are only returned when their district geofence contains the query point. If either the race records or the geofences are missing for State/Federal districts, those races silently drop from the response.

---

## What We're Asking For

### Ask 1 — Load State and Federal race records for the 2026 LA County Primary

Add race records for all State and Federal offices that appear on the 2026 LA County Primary ballot, including at minimum:

- CA State Assembly races (for districts covering LA County)
- CA State Senate races (for districts covering LA County)
- US House of Representatives races (for congressional districts covering LA County)

The existing race record schema (position_name, district_type, primary_party, election_id) is sufficient — no schema changes needed.

---

### Ask 2 — Load PostGIS geofences for CA state and federal districts

Ensure `essentials.geofence_boundaries` has geometries for:

- CA State Assembly districts (covering LA County)
- CA State Senate districts (covering LA County)
- US Congressional districts (covering LA County)

The Indiana data already works correctly for Monroe County (we can see State and Federal races in Indiana Primary results). We need the equivalent CA district geofences.

Census TIGER/Line shapefiles are the standard source for these boundaries — same source as the Indiana data already in the system.

---

## Expected Behavior After Fix

`GET /essentials/elections-by-address?address=500+W+Temple+St%2C+Los+Angeles%2C+CA+90012` should return races across all tiers:

```json
{
  "elections": [{
    "election_name": "2026 LA County Primary",
    "races": [
      { "position_name": "Los Angeles County Board of Supervisors District 1", "district_type": "COUNTY", ... },
      { "position_name": "CA State Assembly District XX", "district_type": "STATE_LOWER", ... },
      { "position_name": "CA State Senate District XX", "district_type": "STATE_UPPER", ... },
      { "position_name": "US Representative District XX", "district_type": "NATIONAL_LOWER", ... }
    ]
  }]
}
```

The frontend requires no changes — `ElectionsView` already renders Local, State, and Federal tiers.

---

## Acceptance Criteria

- `GET /essentials/elections-by-address?address=500+W+Temple+St%2C+Los+Angeles%2C+CA+90012` returns at least one State race and one Federal race in the response
- The district types on those races are `STATE_LOWER`, `STATE_UPPER`, and/or `NATIONAL_LOWER` (matching the existing pattern used for Indiana data)
- Monroe County results are unaffected

---

## Questions for the Accounts Team

1. Are State/Federal race records for the 2026 LA County Primary in the database? A quick `SELECT COUNT(*) FROM essentials.races WHERE district_type IN ('STATE_LOWER', 'STATE_UPPER', 'NATIONAL_LOWER') AND election_id = [LA County Primary ID]` would confirm.
2. Are CA state/federal district geofences in `essentials.geofence_boundaries`? A `SELECT COUNT(*) FROM essentials.geofence_boundaries gb JOIN essentials.districts d ON d.geo_id = gb.geo_id WHERE d.state = 'CA' AND d.district_type IN ('STATE_LOWER', 'STATE_UPPER', 'NATIONAL_LOWER')` would confirm.
3. Is this a data loading gap, or is the 2026 LA County Primary intentionally scoped to county-level races only for now?
