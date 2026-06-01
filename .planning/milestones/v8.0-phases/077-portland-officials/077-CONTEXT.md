# Phase 77: Portland City Structure + Officials - Context

**Gathered:** 2026-05-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 77 creates Portland OR's city government scaffold (government row, chambers, LOCAL_EXEC district for citywide offices) and seeds all elected and appointed officials: Mayor Keith Wilson, all 12 city council members across 4 districts, City Attorney, City Auditor Simone Rede, and City Administrator Michael Jordan. Headshots (600×750) are uploaded to Supabase Storage for all elected officials. A Portland address must return all 3 council members for the matched district plus Mayor. No elections/races. No compass stances. No frontend changes.

</domain>

<decisions>
## Implementation Decisions

### Carried Forward from Phase 73 Context (D-20–D-25)

- **D-01:** Portland uses **1 Portland City Council chamber** with **12 office rows** — 3 per district, each linked to the corresponding `portland-or-council-district-N` geofence. Routing returns all 3 members for the matched district naturally.
- **D-02:** Do NOT create 4 sub-chambers (one per district) — no prior analog; overly complex. Single chamber model confirmed.
- **D-03:** Mayor: **Keith Wilson** (citywide RCV, elected Nov 2024). Mayor office links to LOCAL_EXEC district (geo_id='4159000').
- **D-04:** City Administrator: **Michael Jordan** (appointed). `is_appointed_position=true`. No headshot required (roadmap SC-4 covers elected officials only).
- **D-05:** City Attorney: elected office in Portland (not appointed). `is_appointed_position=false`. Researcher must confirm current incumbent and verify this status under the 2025 charter.
- **D-06:** Council member incumbents (elected Nov 2024, took office Jan 2025):
  - District 1: Timur Ataseven, Loretta Smith, Tiffany Kachima
  - District 2: Candace Avalos, Maxine Dexter, Eric Zimmerman
  - District 3: Steve Novick, Angelita Morillo, Chris Carey
  - District 4: Jonathan Tasini, Elana Pirtle-Guiney, Mitch Green

### Council Office Title Format

- **D-07:** All 3 council office rows within a district share the title **"City Council Member (District N)"** — e.g., all 3 District 1 offices are titled "City Council Member (District 1)". No seat numbering (Portland's model has no numbered seats). Mirrors SF Board of Supervisors title pattern.

### Portland City Auditor

- **D-08:** **Include Portland City Auditor Simone Rede** in Phase 77 — elected citywide office (took office Jan 2025), `is_appointed_position=false`. Headshot required. Follows "seed all elected citywide officials" principle established in Phase 68 (Berkeley City Auditor). Adds 1 row to 77-02 and 1 headshot to 77-03.

### Government Scaffold (DB-Verified)

- **D-09:** Portland OR government row (geo_id='4159000') does **not exist** in the DB — must be created in 77-01. (Only Portland ME and South Portland ME government rows currently exist.)
- **D-10:** LOCAL_EXEC district for Portland citywide offices (Mayor, City Attorney, City Auditor) does not exist yet — must be created in 77-01 alongside the government scaffold. Follow the `geo_id='4159000'`, `district_type='LOCAL_EXEC'`, `state='or'` pattern (analog: Berkeley geo_id='0606000' LOCAL_EXEC).
- **D-11:** Portland council district rows already exist in DB: `portland-or-council-district-{1-4}`, `district_type='LOCAL'`, `state='or'` (created in Phase 76).

### External ID Scheme

- **D-12:** Portland OR officials use **`-690xxx`** range — confirmed clear (0 rows in -699999 to -690000). Researcher must pre-flight this range before writing the migration. Suggested layout:
  - Mayor: `-690001`
  - City Attorney: `-690002`
  - City Auditor: `-690003`
  - City Administrator: `-690004` (appointed)
  - Council members: `-690010` through `-690021` (3 per district, Districts 1–4)

### Migration Numbering

- **D-13:** Last applied migration: **229** (Portland council district rows, Phase 76). Next migration for Phase 77: **230**.

### Headshot Scope

- **D-14:** Roadmap SC-4: "All **elected** Portland officials have headshots." Applies to: Mayor, all 12 council members, City Attorney, City Auditor. **Excludes** City Administrator (appointed, is_appointed_position=true).

### Claude's Discretion

- Exact government row `name` string for Portland (researcher selects consistent format, e.g., "City of Portland, Oregon, US" matching how other OR/CA cities are named)
- Chambers to create under Portland government row — follow prior city patterns (separate chamber per office type)
- Headshot source URL patterns for portland.gov — researcher confirms
- Whether City Attorney is still elected under the 2025 Portland charter — researcher verifies (Phase 73 stated elected; if appointed, update is_appointed_position accordingly and remove from headshot scope)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior Phase Summaries (confirmed values)
- `.planning/phases/76-portland-council-geofences/76-01-SUMMARY.md` — confirms: 4 council district geo_ids (`portland-or-council-district-{1-4}`), district_type='LOCAL', state='or'; migration 229 applied; X0012 MTFCC claimed; Portland City Hall → District 4; next migration = 230
- `.planning/phases/72-portland-or/72-02-SUMMARY.md` — Portland city geo_id='4159000', Multnomah County geo_id='41051', district counts confirmed
- `.planning/phases/73-or-government-db/73-CONTEXT.md` — D-20 to D-25: full Phase 77 decisions locked in Phase 73 discussion; government scaffold approach; incumbent names

### Analog Phase Summaries (established patterns)
- `.planning/phases/63-sf-deep-seed/` — SF Board of Supervisors (1 chamber, district-linked offices) — closest structural analog to Portland's multi-member council model
- `.planning/phases/68-berkeley-deep-seed/` — Berkeley City Auditor included pattern; LOCAL_EXEC district geo_id format for citywide offices
- `.planning/phases/65-sd-deep-seed/` — SD government scaffold pattern (government row + chambers + LOCAL_EXEC district all in Plan 01)

### DB-Verified State
- Portland OR government row: **does not exist** (geo_id='4159000' not in essentials.governments)
- Portland OR LOCAL_EXEC district: **does not exist** (no row with geo_id='4159000' and district_type='LOCAL_EXEC')
- Portland council districts: **exist** (4 rows, portland-or-council-district-{1-4})
- External_id -690xxx range: **clear** (0 existing rows)

</canonical_refs>

<code_context>
## Existing Code Insights

### Established Patterns
- **WHERE NOT EXISTS guard on politicians by external_id** — no unique constraint at DB level; guard prevents duplicate inserts on re-run
- **GENERATED ALWAYS slug on politicians/chambers** — never include in INSERT column list
- **government_id via subquery**: `(SELECT id FROM essentials.governments WHERE name='City of Portland, Oregon, US')` (name TBD; researcher confirms)
- **chamber_id via subquery**: `(SELECT id FROM essentials.government_bodies WHERE government_id=... AND name='Portland City Council')`
- **district_id via subquery**: `(SELECT id FROM essentials.districts WHERE geo_id='portland-or-council-district-1' AND state='or')` (lowercase state casing)
- **LOCAL_EXEC district for citywide offices**: `geo_id='4159000'`, `district_type='LOCAL_EXEC'`, `state='or'` (matches Phase 72 city boundary geo_id)
- **Section-split check**: run after 77-01; zero rows = clean

### Established City Seeding Plan Shape
- Plan 01: government row + chambers + LOCAL_EXEC district + section-split verification
- Plan 02: incumbents (politicians + offices)
- Plan 03: headshots (600×750 JPEG, Lanczos, q90, public_domain license)

### Integration Points
- `essentials.geofence_boundaries` → 4 portland-or-council-district-{1-4} rows with X0012 MTFCC (Phase 76)
- `essentials.districts` → 4 portland-or-council-district-{1-4} rows (Phase 76); no LOCAL_EXEC for Portland yet
- `essentials.governments` → State of Oregon (geo_id='41') exists; City of Portland does NOT exist yet
- `essentials.politician_images` → headshots inserted here after Supabase Storage upload; photo_license='public_domain'

</code_context>

<specifics>
## Specific Ideas

- Portland City Hall smoke test coordinates: lat=45.5231, lon=-122.6794 (confirmed in Phase 72 + Phase 76 smoke tests); should resolve to District 4
- Prior smoke test confirmed: Portland City Hall → District 4 (`portland-or-council-district-4`) — so that district's 3 council members are the expected routing result for that test point
- City Administrator is the only appointed official — all others are elected

</specifics>

<deferred>
## Deferred Ideas

- Oregon elections (2026 races for Portland council seats) — follows city seed, analogous to Phase 69 for CA
- Compass stances for Portland officials — follows all seeding phases
- Additional OR cities beyond Portland (Salem, Eugene, etc.) — future v8.0 phases

</deferred>

---

*Phase: 077-portland-officials*
*Context gathered: 2026-05-29*
