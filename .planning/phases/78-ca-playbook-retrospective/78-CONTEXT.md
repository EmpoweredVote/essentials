# Phase 78: CA Playbook Retrospective - Context

**Gathered:** 2026-05-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Update LOCATION-ONBOARDING.md with all CA-specific GOTCHAs discovered during v7.0 (Phases 57–70), add v7.0 CA cities to the Cities Onboarded table, and close the v7.0 milestone across ROADMAP.md + STATE.md + PROJECT.md.

The playbook update must be written so a future agent can onboard any new CA city (e.g., Oakland, Long Beach) without repeating any v7.0 mistakes.

</domain>

<decisions>
## Implementation Decisions

### GOTCHA scope — what to document
- **D-01:** Include ALL CA-specific traps discovered during v7.0 — the 6 roadmap-required topics PLUS all additional traps that are CA-specific and not already covered as general playbook guidance.
- **D-02:** The 6 roadmap-required topics: charter vs. general law city structure, RCV cities (SF/Berkeley), TIGER CD key verification for CA, LAUSD sub-district geofence pattern, lavote.gov election ID maintenance, AEM/CQ5 CMS headshot pattern (Sacramento).
- **D-03:** Additional traps to include (all confirmed from v7.0 summaries):
  - CA pre-existing seed: CA government row + 8 chambers already existed in production before v7.0 with NULL `geo_id` and short names (without "California" prefix); migration 189 needed `WHERE NOT EXISTS` + `UPDATE geo_id='06'` fix (Phase 59)
  - CA `districts.state='CA'` casing: pre-existing CA districts use uppercase `'CA'`, unlike TIGER-loaded states that use lowercase. Routing works (join is on `gb.mtfcc` not `d.state`), but migrations that filter `districts.state` must match the pre-existing casing (Phase 61)
  - CA mtfcc swap: pre-existing CA data has STATE_UPPER=G5220 and STATE_LOWER=G5210 — opposite of the standard. Routing still works because `essentialsService.ts` joins on `gb.mtfcc` (from `geofence_boundaries`), not `d.mtfcc`. Do NOT attempt to correct this — it would require re-seeding all 80 district rows (Phase 61)
  - External ID conflict: planned CA House rep range (-1000xx) was already occupied by pre-existing CA Assembly members; CA House reps now use `-60003xx` scheme (Phase 60)
  - DataSF Socrata vs ArcGIS GeoHub: SF uses DataSF Socrata API (native WGS84, no `outSR` needed, field=`sup_dist_num` as float); LA GeoHub and Sacramento use ArcGIS MapServer (requires `outSR=4326` — native CRS is CA State Plane feet SRID 2229) (Phases 63, 66)
  - SF consolidated city-county: SF returns BOTH G4110 (city, geo_id=0667000) AND G4020 (county, geo_id=06075) for any SF address — this is expected behavior, not a bug; smoke tests must assert both, not just one (Phase 57)
  - Berkeley RCV punt: Phase 68 seeded Berkeley's 3 chambers but left `election_method` as default (not set to `'rcv'`); this was a documented TODO resolved in Phase 69. When seeding RCV cities, set `election_method='rcv'` on the CHAMBER row at seed time — don't leave it as a follow-up TODO (Phase 68)
  - CA cousub CCD pattern: CA G4040 rows are CCDs (FUNCSTAT='S'), not MCDs. Do NOT add CA to `COUSUB_FUNCSTAT_STATES` (which filters to FUNCSTAT='A' — that would exclude all CA COUSUBs). CA all-G4110 city coverage means most CA residents are in incorporated places; G4040 is only needed for unincorporated areas like East LA (Phase 57)
  - CA jungle primary: California uses top-two jungle primary — ONE unified primary race row for ALL candidates regardless of party, top 2 advance to general. NOT separate D/R primaries like Maine/Texas. If you find separate party-primary race rows for a CA statewide race, that is a data error (Phase 62)

### Placement strategy
- **D-04:** Both inline AND summary section:
  - Weave CA-specific GOTCHAs inline into the relevant existing steps (Step 1 for charter/government structure, Step 2 for jungle primary/elections, Step 3 for TIGER/LAUSD/ArcGIS, Step 7 for AEM/CQ5 headshots)
  - Add a "California Quick Reference" block near the top (after Cities Onboarded table) listing all CA traps with step pointers — for fast pre-flight scanning when starting a CA city

### Cities Onboarded table
- **D-05:** Add all 6 CA cities + CA state row as individual table rows. Use the same Notable Patterns column format as existing rows to capture the details most useful for borrowing.
- Cities to add: California (state), San Francisco, San Diego, San Jose, Sacramento, Fremont, Berkeley
- Each city row should capture: election method, headshot source pattern, geofence loader type (DataSF Socrata vs ArcGIS), and external_id scheme used

### Milestone close scope
- **D-06:** Full close across all three files:
  - `ROADMAP.md`: mark Phase 78 complete; mark v7.0 milestone shipped
  - `STATE.md`: update `last_activity` to reflect v7.0 completion + Phase 78
  - `PROJECT.md`: add v7.0 CA city requirements to the `### Validated` list

### Claude's Discretion
- Exact wording and formatting of the "California Quick Reference" block
- Which step numbers to attach inline CA annotations to (based on reading current playbook step content)
- Ordering of CA cities in the Cities Onboarded table (suggest chronological by onboarding order: CA state → SF → San Jose → San Diego → Sacramento → Fremont → Berkeley)
- How to abbreviate Notable Patterns column content to fit table format

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Playbook to update
- `LOCATION-ONBOARDING.md` — the document being updated; read in full before writing any changes to understand existing structure and avoid duplicate GOTCHAs

### v7.0 Phase Summaries (GOTCHA sources)
- `.planning/phases/57-ca-geofences/57-01-SUMMARY.md` — CA TIGER loader: cousub CCD pattern, ST_MakeValid, city-CCD coterminous pairs
- `.planning/phases/57-ca-geofences/57-02-SUMMARY.md` — CA smoke test pattern; SF consolidated city-county behavior
- `.planning/phases/58-lausd-geofences/58-01-SUMMARY.md` — LAUSD ArcGIS loader: outSR=4326, geo_id format, mtfcc=G5420 filter
- `.planning/phases/58-lausd-geofences/58-02-SUMMARY.md` — LAUSD smoke test: geo_id LIKE filter (not raw mtfcc count)
- `.planning/phases/59-ca-government-db/59-01-SUMMARY.md` — CA pre-existing seed: NULL geo_id, short names, migration 189 fix
- `.planning/phases/60-ca-executives-federal-officials/60-01-SUMMARY.md` — CA external_id conflict: -1000xx occupied by assembly; -60003xx scheme for House reps
- `.planning/phases/61-ca-state-legislature/61-01-SUMMARY.md` — CA districts.state='CA' uppercase casing; mtfcc swap (G5220/G5210 reversed)
- `.planning/phases/62-la-backlog-closure/62-CONTEXT.md` — CA jungle primary decision; lavote.gov election ID maintenance pattern
- `.planning/phases/63-sf-deep-seed/63-01-SUMMARY.md` — DataSF Socrata loader: native WGS84, sup_dist_num float field, X0006 mtfcc
- `.planning/phases/66-sacramento-deep-seed/66-03-SUMMARY.md` — AEM/CQ5 headshot pattern: CSS background-image, curl+grep, cityofsacramento.gov pattern
- `.planning/phases/68-berkeley-deep-seed/68-01-SUMMARY.md` — Berkeley RCV punt: chambers seeded without election_method='rcv'; resolved Phase 69

### Planning documents
- `.planning/ROADMAP.md` — v7.0 milestone entry to mark shipped; Phase 78 plan to mark complete
- `.planning/STATE.md` — last_activity and milestone fields to update
- `.planning/PROJECT.md` — validated requirements list to extend with v7.0 CA city entries

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `LOCATION-ONBOARDING.md` existing GOTCHA format: `> [GOTCHA] **[Description]:**` blockquote style with bold label — new CA GOTCHAs MUST match this format for visual consistency
- Existing inline TIGER GOTCHA pattern (Step 3) as the template for how to add CA-specific annotations

### Established Patterns
- GOTCHA style: blockquote `> [GOTCHA] **...:**` with bold intro, problem description, and CA example inline
- Cities Onboarded table columns: City | State | Onboarded | Election method | Notable patterns
- All existing TIGER GOTCHAs use `> [GOTCHA]` prefix — maintain this visual convention
- The "California Quick Reference" summary block should use a similar table or bullet-list format as Step 8's verification checklist

### Integration Points
- The Cities Onboarded table is near the top (after Core Principle section) — CA rows append after the existing Maine rows
- Inline CA GOTCHAs connect to specific `- [ ]` checklist items within each step
- The "California Quick Reference" block sits between the Cities Onboarded table and Step 1

</code_context>

<specifics>
## Specific Ideas

- The AEM/CQ5 headshot GOTCHA should name the specific curl+grep approach explicitly: `curl -s <url> | grep -o 'background-image:url([^)]+)'` — this was the key insight that saved the phase
- The lavote.gov election ID GOTCHA should note that the ID must be updated per election cycle (June primary AND November general) — two updates per year, not just one
- The CA pre-existing seed GOTCHA should warn agents to run `SELECT id, geo_id FROM essentials.governments WHERE name = 'State of California'` BEFORE writing any CA government row migration — if it returns a row with geo_id=NULL, apply an UPDATE, don't INSERT
- The jungle primary GOTCHA should call out that the CA Secretary of State's office (sos.ca.gov) is the authoritative source for race structure — not Ballotpedia

</specifics>

<deferred>
## Deferred Ideas

- lavote.gov election ID auto-detection script — would auto-extract the current election ID from the live site; deferred in Phase 62, still deferred here
- Board of Equalization (BOE) district geofences — 4 elected members by district; requires a separate shapefile source not in TIGER; deferred from Phase 59
- Any new CA city data work (Oakland, Long Beach, etc.) — this phase only updates documentation, no new city seeding

</deferred>

---

*Phase: 78-ca-playbook-retrospective*
*Context gathered: 2026-05-29*
