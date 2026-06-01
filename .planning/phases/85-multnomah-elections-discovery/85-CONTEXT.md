# Phase 85: Multnomah Elections + Discovery - Context

**Gathered:** 2026-06-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Seed 2026 November General election race rows for Multnomah County commissioners and the 5 incorporated cities (Gresham, Troutdale, Fairview, Wood Village, Maywood Park), then add a Multnomah County discovery_jurisdictions row so the weekly cron pipeline can find candidates automatically.

Researcher determines which seats are actually on the November 2026 ballot from official sources — only confirmed seats get race rows. Discovery jurisdiction is one row for the whole Multnomah County area (geo_id='41051').

No school board races, no compass stances, no headshots — those are Phase 86+.

</domain>

<decisions>
## Implementation Decisions

### Elections — Which election to target
- **D-01:** November General only. Oregon's May 19 primary has already passed (today is June 1, 2026). Seed race rows linked to the 'OR 2026 General' election_id only.
- **D-02:** Migration SELECTs the existing 'OR 2026 General' row. If it doesn't exist yet, INSERT it first. Same pattern as migration 240 (Portland city races).
- **D-03:** No retroactive primary race rows — clean slate for the general.

### Race rows — Which offices
- **D-04:** Researcher determines which Multnomah County commissioner seats + Chair are on the November 2026 ballot from multco.us or sos.oregon.gov candidate filings. Not all 6 seats may be up (staggered 4-year terms). Only confirmed seats get race rows.
- **D-05:** Same for the 5 smaller cities: researcher verifies which council seats (and Mayor where applicable) are on the November 2026 ballot per city. Each city may have a different stagger pattern.
- **D-06:** Race row position_name convention: follow Portland city races pattern — e.g., "Multnomah County Commissioner District 1", "Gresham City Council Ward 1", etc. Researcher proposes; planner confirms.
- **D-07:** ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING — same idempotency as migration 240.

### Plan structure
- **D-08:** 2 plans.
  - Plan 1 = migration 251: all race rows (county commissioner + all 5-city council), in one BEGIN/COMMIT block. County and city races together in one migration; office_ids looked up from live DB via SELECT.
  - Plan 2 = migration 252: Multnomah County discovery_jurisdictions row. Followed by smoke test: hit /essentials/elections-by-address with a real unincorporated Multnomah County address; verify races are returned.

### Discovery jurisdiction
- **D-09:** One discovery_jurisdictions row for Multnomah County area — geo_id='41051', jurisdiction_name='Multnomah County, Oregon'. This covers county commissioner races AND all 5 smaller city races (Multnomah County Elections administers all of them).
- **D-10:** source_url = 'https://www.multco.us/elections' (Multnomah County Elections main page).
- **D-11:** allowed_domains = ARRAY['multco.us', 'ballotpedia.org', 'sos.oregon.gov'].
- **D-12:** election_date = '2026-11-03' (same as OR 2026 General). Cron arms automatically via election_date window — no separate activation flag.
- **D-13:** WHERE NOT EXISTS guard (jurisdiction_geoid='41051' AND election_date='2026-11-03') for idempotency. Same pattern as migration 241.

### Smoke test
- **D-14:** Smoke test uses a real unincorporated Multnomah County address (not Portland, not inside any of the 5 smaller cities). Researcher must find a valid test address. Test hits the /essentials/elections-by-address API endpoint (or equivalent) and confirms races are returned.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Race row pattern (primary analog)
- `C:/EV-Accounts/backend/migrations/240_portland_city_races.sql` — Canonical race row migration: DO $$ DECLARE block, SELECT election_id, INSERT INTO essentials.races with ON CONFLICT guard. Migration 251 follows this structure exactly.

### Discovery jurisdictions pattern
- `C:/EV-Accounts/backend/migrations/241_or_discovery_jurisdictions.sql` — Canonical discovery_jurisdictions migration: WHERE NOT EXISTS guard, exact column set (jurisdiction_geoid, jurisdiction_name, state, election_date, source_url, allowed_domains). Migration 252 follows this structure.

### Phase 83 patterns (government/office IDs reference)
- `.planning/phases/83-multnomah-county-government-routing/83-01-SUMMARY.md` — Production DB IDs for Multnomah County (government ID, Board of Commissioners chamber ID, COUNTY district ID, all 6 official/office IDs). Researcher needs these to look up office_ids for race rows.
- `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql` — Source of all commissioner office IDs. Race rows reference these office_ids.

### Phase 84 patterns (smaller city office IDs reference)
- `.planning/phases/84-multnomah-smaller-cities/84-CONTEXT.md` — D-05 through D-07: at-large vs ward structure per city. Migration 246 is the source of office_ids for all 5 smaller city officials.
- `C:/EV-Accounts/backend/migrations/246_multnomah_cities_government.sql` — Source of all smaller city office IDs. Race rows reference these office_ids.

### Elections table reference
- `C:/EV-Accounts/backend/migrations/240_portland_city_races.sql` — Shows how to SELECT the OR 2026 General election_id from essentials.elections by name + state.

### OR discovery jurisdiction (existing — do NOT duplicate)
- `C:/EV-Accounts/backend/migrations/241_or_discovery_jurisdictions.sql` — OR statewide (geo_id='41') and Portland (geo_id='4159000') rows already exist. Migration 252 adds Multnomah County (geo_id='41051') only.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `C:/EV-Accounts/backend/migrations/240_portland_city_races.sql` — Near-copy template for migration 251. Replace Portland office_ids and position names with county/city equivalents. Keep the DO $$ DECLARE structure, the SELECT for election_id, and the ON CONFLICT guard.
- `C:/EV-Accounts/backend/migrations/241_or_discovery_jurisdictions.sql` — Near-copy template for migration 252. Replace geo_id, name, source_url, and allowed_domains.

### Established Patterns
- Race rows: ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING — partial index on position_name
- Discovery cron arms automatically when election_date is within 180 days — no cron_active column to set
- office_ids in race rows must be hardcoded (SELECTed from live DB during planning) — no dynamic lookup at apply time

### Integration Points
- `essentials.elections` ← SELECT 'OR 2026 General' row; INSERT if missing
- `essentials.races` ← new race rows for county commissioner + 5-city council seats
- `essentials.discovery_jurisdictions` ← new Multnomah County row (geo_id='41051')
- `/essentials/elections-by-address` API endpoint ← smoke test target (verifies races surfaced by backend)

</code_context>

<specifics>
## Specific Ideas

- Researcher must find a real unincorporated Multnomah County address for the smoke test — somewhere that is in the county but not in Portland, Gresham, Troutdale, Fairview, Wood Village, or Maywood Park. Rural route in East Multnomah County would work.
- Multnomah County Elections (multco.us/elections) administers all elections within the county including smaller city elections — this is why one discovery jurisdiction row with multco.us as source covers the whole county area.
- OR 2026 General is November 3, 2026. The primary (May 19) has passed; we seed General races only.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 85-Multnomah Elections + Discovery*
*Context gathered: 2026-06-01*
