# Phase 69: Landing + Elections + Discovery - Context

**Gathered:** 2026-05-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire all 7 CA cities into Landing.jsx COVERAGE_AREAS, seed CA 2026 election rows (primary June 3 + general November 4), create race rows for the Governor and all 52 US House seats (general election only), and arm discovery_jurisdictions with cron_active=true for all 7 covered CA cities. This is the integration phase that makes CA usable end-to-end from the landing page.

</domain>

<decisions>
## Implementation Decisions

### Landing.jsx CA City Entries
- **D-01:** Follow the same pattern as SD/Fremont — one card per city, `{ county: 'CityName', state: 'California', browseGovernmentList: ['geo_id'], browseStateAbbrev: 'CA' }`. No county geo_id additions, no grouping.
- **D-02:** 4 new entries to add: San Francisco, San Jose, Sacramento, Berkeley. LA, SD, Fremont are already present. Researcher confirms correct geo_ids for each city.
- **D-03:** Entry labels use the city name (e.g., `county: 'San Francisco'`) not county descriptors — consistent with existing SD/Fremont/Cambridge entries.

### US House Race Structure
- **D-04:** November general election only — 52 race rows (one per CD), all tied to the November 4, 2026 general election_id. Do NOT create primary rows.
- **D-05:** Rationale: CA primary is June 3 (6 days away), filing is closed — arming discovery cron for general cycle is the right focus. Primary races are effectively over for US House.
- **D-06:** If a CA general election row does not yet exist, create it (election_name, election_date='2026-11-04', state='CA'). Verify whether `1ebca37f-cf96-47f4-bc2b-47ef266721fe` is the primary or general before linking.

### Governor Race
- **D-07:** Governor challengers were seeded in Phase 62 (migration 197). Verify that `cron_active=true` is set on the Governor discovery_jurisdictions or race row. If not, patch it.
- **D-08:** Governor race should be tied to the November general election, not the June primary (open seat, top-two system).

### Discovery_jurisdictions Source URLs
- **D-09:** Each CA city gets its own discovery_jurisdictions row with that city's official elections/city clerk candidate listing URL. Researcher finds the correct URL per city.
- **D-10:** LA already has a discovery_jurisdictions row (lavote.gov, migration 197) — do NOT create a duplicate for LA.
- **D-11:** All city rows should have `cron_active=true` and `election_date` = the nearest upcoming election for that city (June 3 primary or November 4 general, whichever is closer and has active races).
- **D-12:** CA SOS (`sos.ca.gov`) is the correct source for state-level races (Governor, US House). City clerk sites are for municipal races (city council, mayor).

### Claude's Discretion
- Exact CA SOS URL format for the Governor and US House discovery source.
- Whether to create a separate discovery_jurisdictions row for US House races (statewide) or reuse the CA SOS Governor row.
- Migration numbering (next is 221 per STATE.md).
- Whether to arm discovery for the CA primary (June 3) on any city rows given the 6-day proximity.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Landing.jsx
- `src/pages/Landing.jsx` — COVERAGE_AREAS array (lines 8-15); browseGovernmentList pattern; how browse params are set (lines 68-80)

### Elections + Discovery Pattern
- `supabase/migrations/197_ca_governor_challengers.sql` — discovery_jurisdictions INSERT pattern; existing CA election_id `1ebca37f-cf96-47f4-bc2b-47ef266721fe`; lavote.gov source URL pattern

### Phase Roadmap
- `.planning/ROADMAP.md` — Phase 69 success criteria (CITIES-07, ELECT-01 through ELECT-04); Phase 62 completion notes confirming Governor race seeded

### Requirements
- `.planning/REQUIREMENTS.md` — ELECT-01 through ELECT-04; CITIES-07; what "cron_active=true" means for discovery pipeline

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/pages/Landing.jsx` COVERAGE_AREAS array: add new entries following the exact `{ county, state, browseGovernmentList, browseStateAbbrev }` shape already used by SD/Fremont/Cambridge/Portland.

### Established Patterns
- Migration style: SQL applied directly via Supabase MCP tool; no `.sql` file required in `supabase/migrations/` (Phase 62-68 migrations confirm this).
- discovery_jurisdictions INSERT: `ON CONFLICT DO NOTHING` guard; `gen_random_uuid()` for id; explicit `state`, `jurisdiction_geoid`, `jurisdiction_name`, `election_date`, `source_url`, `cron_active` columns.
- Race row pattern: link to `election_id` from `essentials.elections`; link to `office_id` from `essentials.offices`; `cron_active=true` on races that should be swept.

### Integration Points
- CA elections row: verify if `1ebca37f-cf96-47f4-bc2b-47ef266721fe` is primary or general before creating new rows. Researcher should SELECT from `essentials.elections WHERE state='CA'` to see what exists.
- US House office rows exist (Phase 60 seeded all 52 reps with offices) — use those `office_id` values when creating race rows.
- Governor office row exists (Phase 59 seeded it) — use its `office_id` for the Governor race row.

</code_context>

<specifics>
## Specific Ideas

- SF geo_id is `0667000` (confirmed in v7.0 target city geo_ids from STATE.md); SJ is `0668000`; Sacramento is `0664000`; Berkeley is `0606000` — researcher should verify these against the DB before writing migrations.
- CA primary (June 3) and general (November 4) election rows: if both need to be created, use `election_name='CA 2026 Primary'` / `'CA 2026 General'` pattern matching existing state conventions.
- The comment in migration 197 notes election_date='2026-06-02' for existing CA rows — researcher should clarify whether that's the correct date or if June 3 is more accurate.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 69-landing-elections-discovery*
*Context gathered: 2026-05-28*
