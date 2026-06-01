# Phase 79: OR Landing + Elections + Discovery - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire Portland, OR into Landing.jsx COVERAGE_AREAS, seed OR 2026 election rows (bare primary May 19 record + general November 3), create general-election race rows for OR Governor, US Senate (Merkley), all 6 US House CDs, and the full 90-race OR state legislative scaffold (30 Senate + 60 House). Check for and handle any Portland city council 2026 races (researcher must verify — new charter elected all officials Nov 2024 for 4-year terms). Arm discovery_jurisdictions for Portland and statewide races with cron_active=true.

No frontend changes beyond Landing.jsx COVERAGE_AREAS. No headshots. No compass stances. No Multnomah County commissioner races (out of scope for v8.0).

</domain>

<decisions>
## Implementation Decisions

### Landing.jsx Entry
- **D-01:** Add Portland, OR entry following the Portland, ME model (line 19): `{ county: 'Portland', state: 'Oregon', browseGovernmentList: ['4159000'], browseStateAbbrev: 'OR' }`. Portland geo_id='4159000' confirmed in Phase 72 smoke test. No county geo_id addition needed.

### OR Election Rows
- **D-02:** Create two election rows in `essentials.elections`: OR 2026 Primary (election_name='OR 2026 Primary', election_date='2026-05-19') and OR 2026 General (election_name='OR 2026 General', election_date='2026-11-03'). Follow the ME/CA `election_name` convention.
- **D-03:** Primary election row is bare — no race rows for the primary. The primary already happened (May 19, 2026). All race rows link to the November 3 general election only. Consistent with CA Phase 69 precedent (primary skipped when effectively over).

### OR General Election Race Rows
- **D-04:** Create race rows for OR Governor, US Senate (Merkley), and all 6 US House CDs (CD-01 through CD-06) — all linked to the OR 2026 General election_id. All race_candidates left empty on creation; discovery fills via cron.
- **D-05:** Include Jeff Merkley's US Senate race row (NATIONAL_UPPER district). Merkley is up for reelection in 2026 — same pattern as Susan Collins (ME Phase 55). Researcher confirms Merkley's politician_id from Phase 74 external_id range (-4101002).
- **D-06:** Create the full 90-race OR state legislative scaffold: 30 STATE_UPPER races (senate districts SD-01 through SD-30) + 60 STATE_LOWER races (house districts HD-01 through HD-60), all general election only. Matches ME Phase 55 pattern. All race_candidates empty. Researcher must confirm each seat has a corresponding office_id from Phase 75.

### Portland City Council 2026 Races
- **D-07:** Researcher must verify whether any Portland city council, mayoral, or auditor seats are up in 2026. Portland's new charter (effective Jan 2025) elected all 12 councilors + Mayor Keith Wilson + City Auditor Simone Rede in November 2024 for 4-year terms. Expected finding: no 2026 races. If no 2026 races confirmed → do NOT create Portland city race rows for this cycle.
- **D-08:** Regardless of 2026 race findings, create a discovery_jurisdictions row for Portland with cron_active=true. If no 2026 races: election_date='2028-11-03' (estimated next Portland election). If 2026 races exist: set election_date accordingly and also create race rows.

### Discovery Architecture
- **D-09:** Sequential discovery processing only — never parallel. Established project rule.
- **D-10:** Create discovery_jurisdictions rows for Portland (city elections source — researcher confirms correct URL; likely portlandoregon.gov/auditor) and OR statewide (sos.oregon.gov/elections/ for Governor + Senate + House). Do NOT duplicate discovery rows if a row already exists for a geoid (ON CONFLICT DO NOTHING guard).
- **D-11:** All race_candidates empty on creation — no pre-linking of primary winners. Discovery agent (via sos.oregon.gov) will find and stage candidates.

### Claude's Discretion
- Exact sos.oregon.gov candidate listing URL format for the OR Governor, Senate, and US House discovery source rows
- Portland city elections source URL (portlandoregon.gov/auditor/elections/ vs sos.oregon.gov — researcher confirms)
- Whether OR Governor 2026 race is Kotek seeking a second term or another open-seat structure (researcher verifies at sos.oregon.gov)
- Whether to create one combined discovery_jurisdictions row for all OR statewide races or separate rows per race type
- Migration numbering (next is 236 per Phase 77.1 SUMMARY — confirm before writing)
- OR primary election_date: confirm whether sos.oregon.gov lists May 19 or May 20 as the official primary date

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Landing.jsx
- `src/pages/Landing.jsx` — COVERAGE_AREAS array (lines 8-19); browseGovernmentList pattern; Portland, ME entry (line 19) is the direct model for the OR entry

### CA Phase 69 Analog (exact same phase type)
- `.planning/phases/69-landing-elections-discovery/69-CONTEXT.md` — CA Landing + Elections + Discovery context: primary-skip decision, discovery source URL strategy (SOS vs. city clerk), discovery_jurisdictions INSERT pattern, race row creation pattern

### OR Officials + Districts (prerequisite phases)
- `.planning/phases/72-portland-or/72-CONTEXT.md` — Portland geo_id='4159000' confirmed; OR FIPS=41; Multnomah County geo_id='41051'
- `.planning/phases/73-or-government-db/73-01-SUMMARY.md` — OR chambers confirmed, State of Oregon government UUID, migration 222 applied
- `.planning/phases/74-or-executives-federal/74-03-SUMMARY.md` — confirms external_id ranges: executives -4100001 to -4100005; US Senators -4101001 (Wyden) + -4101002 (Merkley); US House -4102001 to -4102006
- `.planning/phases/75-or-state-legislature/75-CONTEXT.md` — state legislature external_ids (-4110001..-4110030 senators; -4120001..-4120060 house reps); office_id back-fill pattern; migration 226+227 applied

### ME Phase 55 Analog (legislative scaffold pattern)
- `.planning/phases/55-me-elections-discovery/` — ME elections phase: full legislative scaffold approach (372 race rows), section-split check, discovery_jurisdictions pattern for a state post-geofence load

### Discovery System
- `C:\EV-Accounts\backend\lib\discoveryService.ts` — discovery pipeline; ON CONFLICT behavior for race_candidates upsert
- `C:\EV-Accounts\backend\lib\discoveryCron.ts` — cron schedule; discovery_jurisdictions cron_active=true triggers inclusion

### Phase Roadmap + Migration State
- `.planning/ROADMAP.md` — Phase 79 success criteria; v8.0 Oregon milestone
- `.planning/STATE.md` — migration ledger (migration 235 is last applied per Phase 77.1 SUMMARY; next is 236); Accumulated Context section for OR patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/pages/Landing.jsx` COVERAGE_AREAS array — add one entry; the `{ county, state, browseGovernmentList, browseStateAbbrev }` shape is already established; Portland, ME (line 19) is the direct model
- `essentials.elections` + `essentials.races` + `essentials.discovery_jurisdictions` — all tables already exist with the patterns established in ME Phase 55 and CA Phase 69; no schema changes needed

### Established Patterns
- Race row pattern: `(election_id, office_id)` — link to election via subquery on election_name; link to office via subquery on (chamber_id, title or geo_id)
- discovery_jurisdictions INSERT: `gen_random_uuid()` for id; `jurisdiction_geoid`, `jurisdiction_name`, `election_date`, `source_url`, `cron_active=true`; `ON CONFLICT DO NOTHING` guard
- OR districts.state casing: STATE_UPPER/STATE_LOWER use 'or' (lowercase, TIGER-loaded); NATIONAL_UPPER/NATIONAL_LOWER use 'OR' (uppercase, pre-seeded)
- Section-split check: run after every seeding phase; zero rows = clean

### Integration Points
- Landing.jsx `COVERAGE_AREAS` → `browse_government_list` browse param → backend essentialsService → politicians for Portland geo_id='4159000'
- `essentials.races` links to `essentials.offices` → requires Phase 75 office_ids for all 90 OR legislative seats to exist
- `essentials.races` links to `essentials.elections` → OR 2026 General election_id (to be created in this phase)
- US Senate race links to Merkley's NATIONAL_UPPER district (loaded in Phase 72 as part of TIGER SLDU) and his office_id (from Phase 74)

</code_context>

<specifics>
## Specific Ideas

- Portland OR discovery_jurisdictions source URL: portlandoregon.gov/auditor/elections is the city elections division — researcher confirms the exact candidate filing page URL
- OR state legislature race rows: 90 total (30 senate + 60 house); district geo_ids are SD-01 through SD-30 and HD-01 through HD-60 (loaded by Phase 72 TIGER)
- Ron Wyden is NOT up for reelection in 2026 (his term ends 2027) — only Merkley races in 2026 for OR Senate
- Portland City Hall coordinates for smoke tests: lat=45.5231, lon=-122.6794 (confirmed Phase 72)
- OR primary date on sos.oregon.gov should be verified — roadmap says May 19, but confirm the official date before writing the election_date value

</specifics>

<deferred>
## Deferred Ideas

- **OR G4040 COUSUB towns** — deferred from Phase 72; OR suburban cities (Salem, Eugene, Beaverton, etc.) are v8.1+ scope
- **Washington County + Clackamas County officials** — Portland's other metro counties; deferred to v8.1+
- **Multnomah County Commissioner races** — 5 elected commissioners; if any seats are up in 2026, out of scope for Phase 79; scope into a separate Multnomah County phase
- **Voter education for STV/RCV voting systems** — noted in Phase 72; future feature phase
- **Post-November 2026 follow-up** — after OR November 3 general, update discovery_jurisdictions source URLs for the 2028 cycle (similar to lavote.gov pattern)

</deferred>

---

*Phase: 79-or-landing-elections-discovery*
*Context gathered: 2026-05-30*
