# Phase 217: Browse Geo_ID Reconcile - Context

**Gathered:** 2026-07-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Reconcile the 23-government Collin County, TX browse list (`COVERAGE_STATES` Texas
block in `src/lib/coverage.js`) against `essentials.governments` so every browse
entry resolves to a real government with a seated roster, **document the corrected
geo_id mapping**, and **spot-check the 5 previously-flagged cities** (Plano,
Richardson, Prosper, Princeton, Van Alstyne) for completeness — logging any
elections/contact/vacancy gaps as explicit follow-ups.

**⚠ Critical scoping note — the roadmap/REQUIREMENTS premise is STALE.** They state
the 5 cities' hardcoded geo_ids "resolve to nothing" (e.g. Plano `4863000`). This was
verified during discuss (2026-07-23) to be **already false**: `coverage.js` already
carries the corrected geo_ids and **all 24 Texas entries resolve in production**. The
milestone was scoped against an 82-day-old memory snapshot
(`project_collin_county_browse`, which still recorded the old `4863000`-style codes),
not against the current `coverage.js`. **The browse-resolution bug is already fixed in
code.** This phase therefore VERIFIES and DOCUMENTS the already-correct state rather
than implementing a fix.

**This is a verify + document phase — no code changes to geo_ids, no DB writes.**

</domain>

<decisions>
## Implementation Decisions

### Phase Shape (given the premise is stale)
- **D-01:** Run Phase 217 as a **lightweight verify + document pass**, not a code/DB
  fix. The browse-resolution work already exists in `coverage.js` + production DB.
  (User chose "Verify + document" over "mark done & skip" and over "re-audit whole
  milestone first.")
- **D-02:** Deliverables are: (1) a live browse spot-check confirming all 5 flagged
  cities render officials on the Collin browse page; (2) the corrected geo_id mapping
  table documented (in this phase's docs + REQUIREMENTS status flipped to met); (3) the
  5-city completeness gaps logged as follow-ups. No migrations, no `coverage.js` geo_id
  edits (they are already correct).
- **D-03:** Correct the stale planning artifacts as part of closing this phase — update
  REQUIREMENTS.md (COLLIN-BROWSE-01..04 → met, with the *actual* corrected geo_ids, not
  the phantom `4863000`), and correct the two stale memories
  (`project_collin_county_browse`, `project_v250_milestone_opened`).

### 5-City Gap Treatment (Plano/Richardson/Prosper/Princeton/Van Alstyne)
- **D-04:** **Log-not-absorb**, per the roadmap's milestone-wide convention. The
  vacancies / zero-race / contact gaps found in these 5 disjoint governments are
  documented as explicit follow-up notes (candidates for a later phase or a 219/220
  extension), **not** fixed inside Phase 217. (User chose "Log as follow-ups" over
  "Fix now in 217.") These 5 govs are outside 218–220's shared 18-government set.

### Verification Method
- **D-05:** Live spot-check via the browse path (`/results?browse_government_list=<geo_id>&browse_label=<City>&browse_state=TX`)
  for each of the 5 cities — read-only, no seeding, no localStorage wipes on the live
  page (per `no_playwright_on_user_live_browser`). The DB-level resolution + roster
  evidence gathered during discuss (below) backs this. Provide the live browse links at
  completion (per `provide_city_browse_links`).

### Claude's Discretion
- Exact wording/location of the geo_id mapping doc (phase docs vs. an appendix in
  REQUIREMENTS) and the format of the follow-up log are left to planning.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Browse mechanism
- `src/lib/coverage.js` — `COVERAGE_STATES` Texas block (lines ~116–142). Single source
  of truth for the browse list; already carries the corrected geo_ids. This is the file
  the roadmap calls "COVERAGE_AREAS / hardcoded geo_ids."
- `src/pages/Landing.jsx` §`handleAreaClick` (lines ~101–128) — builds the
  `browse_government_list` URL param from `coverage.js`; confirmed there is **no**
  second hardcoded Collin list.
- `src/pages/Results.jsx` — consumes `browse_government_list` and calls the
  by-government-list browse path.
- `C:\EV-Accounts\backend\src\lib\essentialsBrowseService.ts` —
  `getPoliticiansByGovernmentList()`; queries `governments → chambers → offices →
  politicians`, bypassing geofences (Collin TX has no geofence boundaries).
- `C:\EV-Accounts\backend\src\routes\essentialsBrowse.ts` — `POST
  /api/essentials/browse/by-government-list` route.

### Milestone planning
- `.planning/ROADMAP.md` §"Phase 217" + §"Milestone-wide conventions" — note the stale
  premise; "gaps surfaced in the 5 reconciled govs are documented, not absorbed."
- `.planning/REQUIREMENTS.md` §"Browse geo_id reconcile (COLLIN-BROWSE)" — **contains
  the stale `4863000` claim; must be corrected at phase close.**

### Corrected geo_id mapping (verified against production 2026-07-23)
The 5 flagged cities — **already correct in `coverage.js`**, phantom codes never present
in current code:
- Plano → `4858016` (phantom was `4863000`) → City of Plano, 8 seated
- Richardson → `4861796` (phantom `4863500`) → City of Richardson, 7 seated
- Prosper → `4859696` (phantom `4863276`) → Town of Prosper, 7 seated
- Princeton → `4859576` (phantom `4863432`) → City of Princeton, 7 seated
- Van Alstyne → `4874924` (phantom `4875960`) → City of Van Alstyne, 5 seated

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- The by-government-list browse path (frontend `browseByGovernmentList()` in
  `src/lib/api.jsx` + backend service/route above) is fully built and in production —
  nothing new to wire.
- `coverage.js` Texas block already lists all 24 entries (23 Collin + Longview) with
  correct geo_ids and `hasContext` flags.

### Established Patterns
- Collin TX browse deliberately bypasses PostGIS/geofences (no TX geofence boundaries
  loaded; Collin offices have `district_id = NULL`) — direct `governments → chambers →
  offices → politicians` join. Do NOT try to route Collin via geofences.

### Integration Points
- None new. Verification touches the live `/results` browse path read-only.

</code_context>

<specifics>
## Specific Ideas

**Spot-check findings for the 5 reconciled cities (production DB, 2026-07-23) — the
"log as follow-ups" payload for D-04:**

| City | offices | vacant | races | web_form_url | email gaps |
|------|---------|--------|-------|--------------|------------|
| Plano | 9 | 1 | 0 | 0/8 | — |
| Richardson | 7 | 0 | 0 | 0/7 | — |
| Prosper | 7 | 0 | 2 | 0/7 | 0 emails |
| Princeton | 8 | 1 | 1 | 0/7 | 0 emails |
| Van Alstyne | 7 | 2 | 0 | 0/5 | 0 emails |

Follow-up gaps to log (NOT fix in 217): 4 vacant offices (Plano 1, Princeton 1, Van
Alstyne 2); 3 zero-race cities (Plano, Richardson, Van Alstyne); `web_form_url` empty
across all 5; missing emails in Prosper/Princeton/Van Alstyne. `valid_to` is populated
for all seated officials.

</specifics>

<deferred>
## Deferred Ideas

- **Fix the 5-city gaps (vacancies/elections/contacts)** — per D-04 these are logged,
  not done here. Candidate for a follow-up phase or a scoped extension of 219 (races) /
  220 (contacts) to include Plano, Richardson, Prosper, Princeton, Van Alstyne. Note:
  these 5 are currently OUTSIDE the 18-government set 218–220 operate on.
- **Re-audit 218/219/220 gap lists against live DB** — the stale-premise incident is a
  warning that other "verified gaps" may have been derived from the same old memory
  snapshot. The user chose not to do a full re-audit now; recommend a quick DB re-verify
  at the start of each of 218–220 before seeding.
- **Milestone-memory hygiene** — the stale-geo_id claim should be corrected in
  `project_collin_county_browse` and `project_v250_milestone_opened` (handled at phase
  close per D-03).

### Reviewed Todos (not folded)
None — no pending todos matched this phase.

</deferred>

---

*Phase: 217-browse-geo-id-reconcile*
*Context gathered: 2026-07-23*
