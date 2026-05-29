# Phase 73: OR Government DB Foundation - Context

**Gathered:** 2026-05-28
**Status:** Ready for planning

> **Note:** This context covers implementation decisions for the full OR block (Phases 73–77). Decisions from this discussion apply to all downstream OR phases.

<domain>
## Phase Boundary

Phase 73 creates the 7 Oregon state government chamber rows under the pre-existing State of Oregon governments row (geo_id='41'). No government row creation needed — it already exists. Phase 73 scope is chambers only; politicians and offices come in Phase 74+.

</domain>

<decisions>
## Implementation Decisions

### Phase 73 — OR Government Chambers

- **D-01:** State of Oregon government row (geo_id='41') already exists — Phase 73 only creates chambers (no government row INSERT needed). Use `WHERE NOT EXISTS` guard keyed on chamber name + government_id subquery.
- **D-02:** 7 chambers to create: Governor, Oregon Senate, Oregon House of Representatives, Attorney General, Secretary of State, State Treasurer, Labor Commissioner.
- **D-03:** All 7 chambers are `is_appointed_position=false` — all are voter-elected in Oregon. This differs from Maine where AG/SoS/Treasurer were legislature-elected (`is_appointed_position=true`).
- **D-04:** GENERATED ALWAYS slug on chambers — never include in INSERT column list (established pattern from Phase 50).
- **D-05:** Next migration number: **221** (verify before writing — Phase 72 introduced no DB migration so 221 is the expected next; confirmed in Phase 72 SUMMARY).

### Phase 74 — OR Executives + Federal Officials [informational]

- **D-06** [informational]: 5 OR constitutional officers to seed: Governor Tina Kotek, AG Dan Rayfield, SoS LaVonne Griffin-Valade, Treasurer Elizabeth Steiner, Labor Commissioner Christina Stephenson.
- **D-07** [informational]: Include the Oregon Labor Commissioner as a seeded official — it is a statewide voter-elected race unique to OR (no ME/CA analog but consistent with "seed all elected officials" rule).
- **D-08** [informational]: External ID scheme follows OR FIPS prefix: `-41xxxxx` range (e.g., -410001 for Kotek). Check ME pattern (-230001) for exact convention before writing migration.
- **D-09** [informational]: Headshots for executives land in Phase 74 (same phase as federal officials). Phase 73 is scaffolding only.
- **D-10** [informational]: STATE_EXEC districts for OR use geo_id='41' (state FIPS), district_id='', mtfcc='' — same pattern as ME (geo_id='23') from Phase 51.
- **D-11** [informational]: 6 OR congressional districts already loaded (Phase 72 TIGER): CD-01 through CD-06. Portland is Congressional District 1 (geo_id=4101, confirmed by Phase 72 smoke test).
- **D-12** [informational]: US Senators: Ron Wyden + Jeff Merkley. Both link to NATIONAL_UPPER district.

### Phase 75 — OR State Legislature [informational]

- **D-13** [informational]: 30 OR State Senators → offices linked to STATE_UPPER districts (30 rows, state='or' lowercase).
- **D-14** [informational]: 60 OR House Reps → offices linked to STATE_LOWER districts (60 rows, state='or' lowercase).
- **D-15** [informational]: Headshot source: oregonlegislature.gov (researcher to confirm direct URL patterns).
- **D-16** [informational]: districts.state casing for loader-inserted rows is 'or' (lowercase) — confirmed in Phase 72 SUMMARY. NATIONAL_LOWER/NATIONAL_UPPER use 'OR' uppercase (pre-seeded, pre-existing pattern).

### Phase 76 — Portland City Council District Geofences [informational]

- **D-17** [informational]: Phase 76 (geofences) ships BEFORE Phase 77 (city seed) — council members cannot be linked to working districts until geofences exist.
- **D-18** [informational]: Portland's 4 council districts are from the 2024 charter reform (effective Jan 2025) — they are NOT in TIGER. Source from Portland Maps / Socrata ArcGIS (same pattern as Berkeley X0009 ArcGIS FeatureServer).
- **D-19** [informational]: Portland city boundary geo_id='4159000' (confirmed by Phase 72 smoke test). Multnomah County geo_id='41051'.

### Phase 77 — Portland City Structure + Officials [informational]

- **D-20** [informational]: Portland's 2025 charter: 12 council members across 4 multi-member districts (3 seats per district, elected by RCV). Use **1 Portland City Council chamber with 12 offices** — 3 office rows per district all linked to the same district geofence. Routing returns all 3 reps for the matched district naturally.
- **D-21** [informational]: Do NOT use 4 sub-chambers (one per district) — no prior analog; overly complex.
- **D-22** [informational]: Mayor Keith Wilson (citywide RCV, elected Nov 2024).
- **D-23** [informational]: City Administrator (Michael Jordan, appointed) seeded as `is_appointed_position=true`.
- **D-24** [informational]: City Attorney included — elected office in Portland (not appointed), same as SF pattern.
- **D-25** [informational]: Incumbents (all elected Nov 2024, took office Jan 2025):
  - District 1: Timur Ataseven, Loretta Smith, Tiffany Kachima
  - District 2: Candace Avalos, Maxine Dexter, Eric Zimmerman
  - District 3: Steve Novick, Angelita Morillo, Chris Carey
  - District 4: Jonathan Tasini, Elana Pirtle-Guiney, Mitch Green

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior Phase Summaries (confirmed reference values)
- `.planning/phases/72-portland-or/72-02-SUMMARY.md` — Portland geo_id='4159000', Multnomah County geo_id='41051', Congressional District 1 geo_id=4101, confirmed district counts (30 STATE_UPPER, 60 STATE_LOWER, 6 NATIONAL_LOWER), next migration=221
- `.planning/phases/50-me-government-db/50-01-SUMMARY.md` — ME chambers pattern (government_id subquery, WHERE NOT EXISTS guard, GENERATED ALWAYS slug)
- `.planning/phases/51-me-executives-federal-headshots/51-01-SUMMARY.md` — STATE_EXEC district pattern, is_appointed_position logic, external_id scheme for state executives

### Analog Phase Summaries (CA patterns)
- `.planning/phases/63-sf-deep-seed/` — SF Board of Supervisors pattern (1 chamber, multiple district offices) — closest analog to Portland's multi-member model

</canonical_refs>

<code_context>
## Existing Code Insights

### Established Patterns
- **WHERE NOT EXISTS guard on governments/chambers by name** — no unique constraint on geo_id; use name + government_id to deduplicate
- **GENERATED ALWAYS slug on chambers** — never include in INSERT column list or INSERT will error
- **government_id via subquery**: `(SELECT id FROM essentials.governments WHERE name='State of Oregon')`
- **STATE_EXEC district pattern**: geo_id=state FIPS, district_id='', mtfcc='', state=uppercase abbreviation ('OR')
- **STATE_UPPER/STATE_LOWER districts**: already loaded (Phase 72); offices link to these via district geo_id
- **Section-split check**: run after every geofence/seeding phase; zero rows = clean

### Integration Points
- `essentials.governments` → State of Oregon row (geo_id='41') exists, needs no creation
- `essentials.districts` → 97 non-county OR district rows already loaded (state='or' lowercase for COUNTY/STATE types, 'OR' uppercase for NATIONAL types)
- `essentials.geofence_boundaries` → 373 OR rows loaded by Phase 72; Portland G4110 geo_id='4159000' confirmed
- Phase 76 will create LOCAL_LOWER district rows for Portland council districts — Phase 77 offices link to these

</code_context>

<specifics>
## Specific Ideas

- Portland City Hall coordinates for smoke tests: lat=45.5231, lon=-122.6794 (confirmed in Phase 72)
- Bend rural fallback coordinates: lat=44.12, lon=-121.4 (confirmed in Phase 72)
- Oregon Legislature website: oregonlegislature.gov — expected headshot source for Phase 75

</specifics>

<deferred>
## Deferred Ideas

- Oregon elections (2026 races) — will follow city/state seeding, analogous to Phase 69 for CA
- Compass stances for OR officials — will follow all seeding phases, analogous to Phase 70 for CA
- Additional OR cities beyond Portland (Salem, Eugene, Gresham, Hillsboro, etc.) — future phases in v8.0 after the Portland deep seed is complete
- Portland Auditor (elected office) — confirm current incumbent and include in Phase 77 or a follow-up

</deferred>

---

*Phase: 73-or-government-db*
*Context gathered: 2026-05-28*
