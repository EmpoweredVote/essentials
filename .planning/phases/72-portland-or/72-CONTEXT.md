# Phase 72: Portland, OR - Context

**Gathered:** 2026-05-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Load Oregon TIGER state boundaries so that any OR address can be routed to the correct federal, state, and local representatives. Phase 72 = OR TIGER layers only (G4110 incorporated cities, G4020 counties, SLDU senate districts, SLDL house districts, CD congressional districts). This is the first phase of the v8.0 Oregon milestone and follows the same scope as Phase 49 (ME Geofences) and Phase 57 (CA Geofences) exactly.

Portland's custom 12-district council boundaries (from the 2024 charter reform) are NOT in scope here — they go in the Portland city deep seed phase. Multnomah County's custom commission district boundaries also go in a later phase.

</domain>

<decisions>
## Implementation Decisions

### Phase 72 TIGER Scope
- **D-01:** OR TIGER layers: G4110 (incorporated cities), G4020 (counties), SLDU (30 senate districts), SLDL (60 house districts), CD (6 congressional districts). Same layer set as Phase 49 (ME) and Phase 57 (CA).
- **D-02:** OR FIPS = 41. Multnomah County FIPS = 41051.
- **D-03:** Portland custom council district geofences (12 districts, new 2024 charter) → Portland city phase (future). Do NOT include in Phase 72.
- **D-04:** Multnomah County commission district boundaries (custom, not TIGER) → separate phase after Phase 72 government DB work. Do NOT include in Phase 72.
- **D-05:** OR TIGER CD key must be verified by browsing `https://www2.census.gov/geo/tiger/TIGER2024/CD/` before configuring STATE_LAYER_ALLOWLIST. ME used `cd119` (not `cd`) — apply the same pre-flight check for OR.

### v8.0 Oregon Milestone Structure (captured for planning purposes)
- **D-06:** Full v8.0 playbook pattern — same multi-phase approach as v6.0 ME and v7.0 CA. Phase 72 is the first phase; multiple phases follow for government DB, state legislature, executives, federal officials, Portland city deep seed, elections, etc.
- **D-07:** Multnomah County officials (5 elected commissioners) ARE in scope for v8.0. Only Multnomah — Washington County and Clackamas County are deferred to v8.1+.
- **D-08:** Multnomah County custom commission boundaries will require a custom loader script (like LA County supervisor loader in Phase 62). This loader work goes in a post-Phase-72 phase.

### Portland City Structure (locked now, used by the Portland city phase)
- **D-09:** Portland adopted a new Strong Mayor + 12-district council system in January 2025 (2022 Measure 26-228). This replaced the old 5-member commission form of government. Every future Portland city plan must use this new structure.
- **D-10:** City council title format: `"Councilor (District N, Seat A/B/C)"` — 12 districts × 3 seats each = 36 total council titles. Matches Portland's official seat naming.
- **D-11:** 3 separate chambers for Portland: Mayor, City Council, City Auditor. City Auditor is an independently elected oversight officer — NOT folded into the Mayor's LOCAL_EXEC chamber (matches Berkeley's Auditor pattern).
- **D-12:** Election method: `election_method = 'stv'` on both City Council and Mayor chambers. STV = Single Transferable Vote, Portland's official term for their multi-winner ranked-choice system.

### Elections + Discovery (locked now, used by the Portland elections phase)
- **D-13:** Portland's 3-seat STV district races → 3 separate race rows per district per seat (one race per Seat A/B/C). No schema migration needed. 36 total council races + 1 Mayor + 1 Auditor = 38 races per Portland election cycle.
- **D-14:** OR election discovery source — researcher finds the correct OR Secretary of State URL during the Phase 72 research phase. Do NOT hardcode a source URL here.

### Claude's Discretion
- Exact TIGER layer counts for OR (number of G4110 cities, COUSUB count if any)
- Whether OR has significant G4040 COUSUB population (like MA) that requires loading both G4110 and G4040 — researcher determines this
- Whether OR COUSUB is FUNCSTAT='S' (statistical, skip) or FUNCSTAT='A' (active MCDs, load) — check before loading
- Migration numbering (next is 221 per STATE.md — verify before writing any OR migrations)
- Loader script naming: follow `load-{state}-{layer}.ts` convention in `C:\EV-Accounts\backend\scripts`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### TIGER Loader Pattern (prior state examples)
- `C:\EV-Accounts\backend\scripts\load-state-tiger-boundaries.ts` — main TIGER loader; add OR to STATE_LAYER_ALLOWLIST exactly as ME and CA were added
- `.planning/phases/49-me-geofences/49-01-PLAN.md` — ME geofences plan: TIGER layer selection, loader config, smoke test pattern
- `.planning/phases/57-ca-geofences/` — CA geofences plans: shows CA-specific TIGER quirks (COUSUB FUNCSTAT='S', district.state casing) as comparison

### State Layer Decisions
- `.planning/STATE.md` — "Accumulated Context" section: TIGER gotchas from ME + CA (CD key must be verified, districts.state casing rules, COUSUB FUNCSTAT)
- `.planning/ROADMAP.md` — Phase 72 entry (v8.0 Oregon milestone); Phase 49 and 57 completion notes for cross-reference

### Portland Charter Reform
- Portland Charter 2022 (Measure 26-228) — researcher should read city source (portlandoregon.gov) for exact district boundaries and seat naming. The new 12-district structure took effect January 2025.

### Requirements
- `.planning/REQUIREMENTS.md` — v8.0 requirements not yet written; researcher should note what TIGER success criteria look like based on prior state patterns (GEO-01 equivalent)

### Code Patterns
- `.planning/PROJECT.md` — Stack context, essentials schema, migration patterns
- `C:\EV-Accounts\backend\data\` — loader scripts and their patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `load-state-tiger-boundaries.ts` TIGER loader: add `'OR'` to `STATE_LAYER_ALLOWLIST` exactly as `'ME'` and `'CA'` were added in Phases 49 and 57. Run from `C:\EV-Accounts\backend` (not `C:\EV-Accounts`) — dotenv looks for `.env` in cwd.
- Prior state smoke test scripts (e.g., `smoke-ca-geofences.ts`, `smoke-me-geofences.ts`) as templates for OR smoke test.

### Established Patterns
- TIGER CD key: browse `https://www2.census.gov/geo/tiger/TIGER2024/CD/` first — ME used `cd119` (not `cd`); CA may differ again. Wrong key = silent no-op.
- `districts.state` casing: lowercase for COUNTY/STATE_UPPER/STATE_LOWER (`'or'`), UPPERCASE for NATIONAL_LOWER (`'OR'`). Same as ME/CA patterns.
- `geofence_boundaries.state` = FIPS string (`'41'` for Oregon).
- Pre-flight assertion pattern: count expected boundaries before running loader (ME: 23 G4110 cities; CA: 482 G4110 cities + 404 G4040 COUSUB). Researcher must find OR expected counts.

### Integration Points
- OR results feed into: state legislature seed (future phase), OR executives + federal officials (future phase), Portland city deep seed (future phase)
- Smoke test should verify: Portland city address → G4110 Portland boundary → correct OR state/federal district routing
- Section-split check (`SELECT gb.geo_id ... WHERE gb.geo_id NOT IN (SELECT geo_id FROM essentials.districts)`) must return 0 rows after loader runs

</code_context>

<specifics>
## Specific Ideas

- OR FIPS = 41; Portland G4110 geo_id will be in the `0641xxx` range — researcher confirms exact geo_id from TIGER data
- Multnomah County G4020 geo_id = '41051' (FIPS format) — verify during smoke test that Portland address returns this county boundary
- OR has 6 congressional districts post-2022 redistricting (CD-1 through CD-6); OR-5 was new in 2023 from redistricting
- Jeff Merkley (US Senator) is up for re-election in 2026 — relevant for the OR elections phase planning

</specifics>

<deferred>
## Deferred Ideas

- **Voter education for non-standard voting systems (STV, RCV)** — User wants an explanation of how STV works so a voter new to Portland isn't overwhelmed. This touches both schema (`essentials.chambers` description field or new table) and frontend. Scope as its own phase or sub-feature in the Portland elections phase.
- **Washington County and Clackamas County officials** — Portland's other two counties; defer to v8.1+.
- **Portland-area suburban cities** (Beaverton, Gresham, Hillsboro, Lake Oswego) — after Portland city is proven, follow the same deep seed pattern; v8.1+.
- **OR G4040 COUSUB towns** — researcher should check whether OR has significant non-G4110 population (like MA's 293 towns); if so, a separate COUSUB phase like Phase 48 (MA Towns) may be needed.

</deferred>

---

*Phase: 72-portland-or*
*Context gathered: 2026-05-28*
