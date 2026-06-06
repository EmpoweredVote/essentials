# Phase 96: MD 2026 Elections + Discovery Pipeline + Landing - Context

**Gathered:** 2026-06-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Seed Maryland's 2026 election infrastructure: two election rows (primary + general), legislative scaffold race rows (one per district using seats=N), a discovery_jurisdictions row for MD statewide, and a Landing.jsx COVERAGE_CITIES entry for Maryland.

All prerequisite data is already in production:
- 141 delegate offices + 47 senator offices (migrations 273 + 274)
- 8 US House offices, Governor, LG, AG, Comptroller, Van Hollen US Senate offices (migrations 270 + 275)
- St. Mary's County + Leonardtown officials (migrations 276 + 277)
- MD geofence_boundaries: 47 SLDU rows + 71 SLDL rows (157 G4110, 24 G4020, 8 CD — migration 246)

Out of scope:
- Compass stances (Phases 97-98)
- v11.0 verification (Phase 99)
- Baltimore City government seeding (future milestone)

</domain>

<decisions>
## Implementation Decisions

### Delegate District Race Structure

- **D-01:** One race row per DISTRICT (not one per delegate seat). This is the correct approach given the `UNIQUE (election_id, position_name, primary_party)` constraint on `essentials.races`.
  - Whole-district multi-member races (e.g., 3 delegates in one geofence): `seats=3` (or N as appropriate), one row with `position_name='MD House Delegate District X'`
  - Sub-district races (District XA, District XB): one row per sub-district with `seats=N` matching the ACTUAL delegate count for that sub-district (researcher queries delegate count per sub-district before writing migrations)
  - **NOTE:** ROADMAP success criteria says "141 delegate scaffold rows" and "198 total" — these are based on a one-row-per-seat model that conflicts with the unique constraint. The correct total will be fewer than 198. Planner should document the actual count and note the deviation from ROADMAP wording in the plan.

- **D-02:** All race rows link to the GENERAL election only (the OR bare-primary pattern). Primary election row exists in `essentials.elections` but no races reference it. Candidate discovery will populate general-race candidates via the cron agent.

### discovery_jurisdictions — Schema Constraint

- **D-03:** `essentials.discovery_jurisdictions` has NO `cron_active` column. The ROADMAP success criteria reference to "cron_active=true" is stale language. Discovery eligibility is date-based: rows within the 180-day cron window before `election_date` are automatically eligible. Follow the ME/OR pattern exactly: two rows, one per election_date (primary + general), with `jurisdiction_geoid='24'` and `state='MD'`.

### Landing.jsx Entry

- **D-04:** Maryland entry goes in `COVERAGE_CITIES` (same array as Cambridge, Portland ME, Portland OR). Entry bundles both Leonardtown AND St. Mary's County geo_ids so clicking Maryland shows both the town council AND the county commission officials.
  ```js
  { label: 'Leonardtown', state: 'Maryland', browseGovernmentList: ['2446475', '24037'], browseStateAbbrev: 'MD' }
  ```

### Claude's Discretion

- **MD primary date:** Maryland SBE 2026 primary is July 14, 2026. Researcher MUST verify at elections.maryland.gov before writing the election row (not assumed correct).
- **Discovery allowed_domains:** Use `['elections.maryland.gov', 'mgaleg.maryland.gov', 'ballotpedia.org', 'maryland.gov']` as the starting allowlist. Researcher may refine.
- **Discovery source_url:** Use Maryland SBE candidate filing page — researcher finds the correct 2026 URL at elections.maryland.gov.
- **Race row total:** Planner queries the sub-district distribution (how many districts have A/B sub-districts vs. whole-district 3-seat) to determine the actual race count. Document the count in the plan and note deviation from ROADMAP's "198 total" estimate.
- **Migration numbering:** Start from 278 (confirmed next available in STATE.md). Verify by listing `C:/EV-Accounts/backend/migrations/` before writing.
- **Van Hollen US Senate race:** Chris Van Hollen's seat (Class 3) is up in 2026. Angela Alsobrooks (Class 2, elected 2024) is NOT up for re-election. One US Senate race row only.
- **Election naming:** Follow MA/ME pattern: `'2026 Maryland State Primary'` + `'2026 Maryland General Election'` and `state='MD'`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and Roadmap
- `.planning/REQUIREMENTS.md` — MD-ELECTIONS-01 (election rows), MD-ELECTIONS-02 (race rows), MD-ELECTIONS-03 (discovery_jurisdictions + Landing.jsx); Phase 96 success criteria
- `.planning/ROADMAP.md` §Phase 96 — 4 success criteria; note that "198 total race rows" is a ROADMAP estimate based on one-row-per-seat — actual count will differ (see D-01)

### Closest Migration Templates

**Elections foundation:**
- `C:/EV-Accounts/backend/migrations/237_or_2026_elections.sql` — Minimal elections-only migration; bare primary row pattern; ON CONFLICT (name, election_date, state) DO NOTHING
- `C:/EV-Accounts/backend/migrations/238_or_statewide_races.sql` — Statewide races (Governor, US Senate, US House) with office_id subquery; ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING
- `C:/EV-Accounts/backend/migrations/239_or_legislative_races.sql` — Legislative scaffold races per district; shows DO $$ + DECLARE pattern with office_id lookup by geo_id + district_type + chamber name

**Discovery jurisdictions:**
- `C:/EV-Accounts/backend/migrations/183_me_2026_elections_foundation.sql` — Two discovery rows (primary + general); note comment "no cron_active column — date-based horizon only"; ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING

### Landing.jsx
- `src/pages/Landing.jsx` — `COVERAGE_CITIES` array (lines 14-24); `COVERAGE_COUNTIES` array (lines 8-12); MD entry goes into COVERAGE_CITIES using the pattern at line 22 (Cambridge) or 21 (Portland ME)

### DB Schema Constraints (critical)
- `essentials.races` — `UNIQUE (election_id, position_name, primary_party)`; PARTIAL index `WHERE primary_party IS NULL`; this constraint is why one-row-per-seat doesn't work cleanly for multi-member districts
- `essentials.elections` — `UNIQUE (name, election_date, state)` — check before INSERT
- `essentials.discovery_jurisdictions` — NO `cron_active` column; UNIQUE (jurisdiction_geoid, election_date)
- `essentials.districts` — state casing: `'md'` (lowercase) for STATE_UPPER/STATE_LOWER/COUNTY/LOCAL; `'MD'` (uppercase) for NATIONAL_LOWER/NATIONAL_UPPER (confirmed in D-07 of accumulated STATE.md context)

### Office ID Confirmation (from Phase 96 DB query)
- Governor Wes Moore: `office_id = 1a7ac65d-983a-4c62-85bc-d506ea2755a3`
- LG Aruna Miller: `office_id = 7e15c4f7-6e58-4d04-a755-46430258f0bd` *(LG not typically on ballot; omit from race rows)*
- AG Anthony Brown: `office_id = 6f9fd58a-442c-4c58-bd6d-f36a1bcbf114`
- Comptroller Brooke Lierman: `office_id = 816a9ad0-f2ac-48b3-918a-aa75aa2f9efd`
- US Senate Chris Van Hollen: `office_id = 59092640-43df-4dea-bac3-441690c76ad9`
- 8 US House reps: confirmed present in DB (external_ids -2440001 through -2440008)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `generate_or_legislative_races.ps1` — PowerShell generator template; produces one DO $$ block per district; adapt for MD Senate (47 districts × STATE_UPPER) and MD House (71 SLDL geofences × STATE_LOWER with seats=N)
- `generate_me_legislative_races.ps1` — Same pattern for ME; provides alternate reference

### Established Patterns
- **Post-verification DO block**: Mandatory in every seeding migration (gates: election count, race count). Roll back on failure. Follow migration 183/237 structure.
- **`ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING`** — races idempotency guard (partial index — the WHERE clause is required)
- **`ON CONFLICT (name, election_date, state) DO NOTHING`** — elections row idempotency
- **`ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING`** — discovery_jurisdictions idempotency
- **Office_id lookup pattern for legislative races**: `SELECT o.id FROM essentials.offices o JOIN essentials.districts d ON d.id = o.district_id JOIN essentials.chambers ch ON ch.id = o.chamber_id WHERE d.geo_id = '{geoid}' AND d.district_type = '{type}' AND d.state = '{state}' AND ch.name = '{chamber}' LIMIT 1`
  - For MD Senate: `district_type='STATE_UPPER'`, `state='md'`, `ch.name='Maryland State Senate'`
  - For MD House: `district_type='STATE_LOWER'`, `state='md'`, `ch.name='Maryland House of Delegates'`
  - For sub-districts: same lookup — each A/B sub-district has its own geo_id in geofence_boundaries

### Integration Points
- **elections/me endpoint**: Races link to election rows via `election_id`; Connected users auto-load via this endpoint on the Elections page
- **discovery agent**: Reads discovery_jurisdictions rows within 180-day window; `allowed_domains` array gates which websites the agent can cite
- **Landing.jsx**: `browseGovernmentList` values are passed to the representatives API; both `'2446475'` (Leonardtown) and `'24037'` (St. Mary's County) must have corresponding governments + officials in the DB (confirmed via Phase 95)

</code_context>

<specifics>
## Specific Ideas

- Landing entry pattern exactly: `{ label: 'Leonardtown', state: 'Maryland', browseGovernmentList: ['2446475', '24037'], browseStateAbbrev: 'MD' }` — insert after Portland Oregon entry at line 23
- Researcher must query actual sub-district delegate distribution before generating legislative race SQL: `SELECT d.geo_id, d.name, d.district_type, COUNT(o.id) as seat_count FROM essentials.districts d JOIN essentials.offices o ON o.district_id = d.id WHERE d.state = 'md' AND d.district_type = 'STATE_LOWER' GROUP BY d.geo_id, d.name, d.district_type ORDER BY d.name`
- For the AG and Comptroller races: both are on the 2026 ballot (4-year terms, last elected 2022). Governor is also up. LG is on the same ticket as Governor (not a separate race row). State Treasurer is General Assembly-appointed (is_appointed_position=true) — NO race row.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 96-MD 2026 Elections + Discovery Pipeline + Landing*
*Context gathered: 2026-06-06*
