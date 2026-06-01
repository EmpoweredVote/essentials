# Phase 78: CA Playbook Retrospective - Research

**Researched:** 2026-05-29
**Domain:** Documentation / playbook update + milestone closure
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Include ALL CA-specific traps discovered during v7.0 — the 6 roadmap-required topics PLUS all additional traps that are CA-specific and not already covered as general playbook guidance.

**D-02:** The 6 roadmap-required topics: charter vs. general law city structure, RCV cities (SF/Berkeley), TIGER CD key verification for CA, LAUSD sub-district geofence pattern, lavote.gov election ID maintenance, AEM/CQ5 CMS headshot pattern (Sacramento).

**D-03:** Additional traps to include (all confirmed from v7.0 summaries):
- CA pre-existing seed: government row + 8 chambers already existed in production with NULL geo_id and short names; migration 189 needed WHERE NOT EXISTS + UPDATE geo_id='06' fix
- CA `districts.state='CA'` casing: pre-existing CA districts use uppercase 'CA'; migrations that filter `districts.state` must match the pre-existing casing
- CA mtfcc swap: STATE_UPPER=G5220, STATE_LOWER=G5210 (inverse of TIGER codes); routing unaffected because essentialsService.ts joins on gb.mtfcc, not d.mtfcc
- External ID conflict: planned CA House rep range (-1000xx) was already occupied by pre-existing CA Assembly members; CA House reps now use -60003xx scheme
- DataSF Socrata vs ArcGIS GeoHub: SF uses DataSF Socrata API (native WGS84, no outSR needed, field=sup_dist_num as float); LA GeoHub and Sacramento use ArcGIS MapServer (requires outSR=4326)
- SF consolidated city-county: SF returns BOTH G4110 and G4020 for any SF address — expected behavior; smoke tests must assert both
- Berkeley RCV punt: set election_method='rcv' on CHAMBER row at seed time, not as a follow-up TODO
- CA cousub CCD pattern: CA G4040 rows are CCDs (FUNCSTAT='S'); do NOT add CA to COUSUB_FUNCSTAT_STATES
- CA jungle primary: ONE unified primary race row for ALL candidates; NOT separate D/R primaries; sos.ca.gov is authoritative source

**D-04:** Both inline AND summary section: weave CA-specific GOTCHAs inline into relevant existing steps, AND add a "California Quick Reference" block near the top (after Cities Onboarded table) listing all CA traps with step pointers.

**D-05:** Add all 6 CA cities + CA state row as individual table rows in the Cities Onboarded table. Cities: California (state), San Francisco, San Diego, San Jose, Sacramento, Fremont, Berkeley. Each row captures: election method, headshot source pattern, geofence loader type, external_id scheme.

**D-06:** Full close across all three files:
- ROADMAP.md: mark Phase 78 complete; mark v7.0 milestone shipped
- STATE.md: update last_activity to reflect v7.0 completion + Phase 78
- PROJECT.md: add v7.0 CA city requirements to the Validated list

### Claude's Discretion

- Exact wording and formatting of the "California Quick Reference" block
- Which step numbers to attach inline CA annotations to (based on reading current playbook step content)
- Ordering of CA cities in the Cities Onboarded table (suggest chronological: CA state → SF → San Jose → San Diego → Sacramento → Fremont → Berkeley)
- How to abbreviate Notable Patterns column content to fit table format

### Deferred Ideas (OUT OF SCOPE)

- lavote.gov election ID auto-detection script
- Board of Equalization (BOE) district geofences
- Any new CA city data work (Oakland, Long Beach, etc.)

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PLAYBOOK-CA-01 | LOCATION-ONBOARDING.md updated with CA-specific GOTCHAs (charter vs. general law cities, RCV jurisdictions like SF/Berkeley, TIGER CD key verification for CA, LAUSD sub-district geofence pattern, lavote.gov election ID maintenance) | All 9 CA GOTCHAs documented below with exact source phase, problem, solution, and CA example. The playbook's existing GOTCHA format and step structure are confirmed. |

</phase_requirements>

---

## Summary

Phase 78 is a pure documentation and milestone-closure phase — no database migrations, no code changes, no external dependencies. The deliverable is a comprehensive update to `LOCATION-ONBOARDING.md` with every CA-specific trap discovered during the v7.0 milestone (Phases 57–70), followed by closing v7.0 across ROADMAP.md, STATE.md, and PROJECT.md.

All source material for the GOTCHAs exists in phase SUMMARY.md and CONTEXT.md files already read during this research session. No web searches or library documentation are needed. The current playbook structure is confirmed: GOTCHAs use `> [GOTCHA] **...**:` blockquote format, the Cities Onboarded table is near the top, and inline GOTCHAs connect to specific checklist items within each step.

The primary planning challenge is organizing 9 distinct CA GOTCHAs across Steps 1–7 without duplication, producing a "California Quick Reference" summary block that cross-links to the inline placements, and writing 7 new rows for the Cities Onboarded table.

**Primary recommendation:** Single plan (78-01-PLAN.md) executes three sequential tasks: (1) write all CA GOTCHAs into LOCATION-ONBOARDING.md, (2) add CA cities to the Cities Onboarded table + Quick Reference block, (3) close the v7.0 milestone across ROADMAP.md, STATE.md, and PROJECT.md.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Playbook update (GOTCHAs) | Documentation | — | Pure markdown edit; no code or DB changes |
| Cities Onboarded table | Documentation | — | Table row additions only |
| California Quick Reference block | Documentation | — | New markdown section near top of file |
| Milestone closure (ROADMAP/STATE/PROJECT) | Documentation | — | Status flag and list updates in planning files |

---

## Standard Stack

### Core

No external packages required. This phase is documentation-only.

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Write tool | — | Create/modify markdown files | Standard for file edits in this codebase |

### Installation

None required.

---

## Package Legitimacy Audit

Not applicable — no packages installed in this phase.

---

## Architecture Patterns

### System Architecture Diagram

```
v7.0 Phase SUMMARY.md files (source material)
        │
        ▼
  Research (this doc) — distills GOTCHAs
        │
        ▼
  78-01-PLAN.md — planner task list
        │
        ├──► LOCATION-ONBOARDING.md (primary deliverable)
        │         ├── California Quick Reference block (new, near top)
        │         ├── Cities Onboarded table (7 new rows)
        │         └── Inline GOTCHAs weaved into Steps 1–7
        │
        ├──► ROADMAP.md (v7.0 milestone → shipped; Phase 78 → complete)
        ├──► STATE.md (last_activity updated)
        └──► PROJECT.md (Validated list extended with v7.0 CA requirements)
```

### Recommended Project Structure

No new files or directories. All edits are to existing files:

```
LOCATION-ONBOARDING.md       ← Primary deliverable
.planning/ROADMAP.md         ← Milestone status update
.planning/STATE.md           ← last_activity update
.planning/PROJECT.md         ← Validated list extension
```

---

## Playbook Structure Analysis (Current State)

Reading the current `LOCATION-ONBOARDING.md` confirms the following structure that CA GOTCHAs must integrate with:

**Sections in order:**
1. Intro + How to Use
2. Core Principle: Citizen Experience First
3. Cities Onboarded (table) ← new CA rows go here
4. ← "California Quick Reference" block goes HERE (D-04, between table and Step 1)
5. Step 1: Government Structure Research
6. Step 2: Election System Confirmation
7. Step 3: Geofence Sources
8. Step 4: Data Sources
9. Step 5: Schema Decisions Before Migration
10. Step 6: Migration Order
11. Step 7: Common Pitfalls (check-before-every-migration table)
12. Step 8: Phase Templates
13. Compass and Treasury Tracker stubs
14. Checklist Summary

**Existing GOTCHA format (must match):**
```
> [GOTCHA] **[Bold label]:** [problem description and solution]
```

**Existing pitfall table format (Step 7):**
```
| Pitfall | How to Catch It |
|---------|----------------|
| [Pitfall description] | [How to detect] |
```

[VERIFIED: Read LOCATION-ONBOARDING.md in full]

---

## GOTCHA Inventory: All 9 CA-Specific Traps

Every GOTCHA below is sourced directly from v7.0 phase SUMMARY.md or CONTEXT.md files read during research. No training-data assumptions.

### GOTCHA CA-1: CA Pre-Existing Seed (Step 1 + Step 5)

**Source:** 59-01-SUMMARY.md, 78-CONTEXT.md D-03 [VERIFIED: read directly]

**Problem:** The State of California government row AND all 8 executive chambers AND all 8 executive politicians were already seeded in production before v7.0. The government row had `geo_id=NULL`. The chambers used SHORT names without "California" prefix (e.g., "Governor" not "California Governor"). Writing a standard government/chamber INSERT without pre-checking would create duplicates or fail silently.

**Solution:**
1. Before writing ANY CA state-level government migration, run:
   `SELECT id, geo_id FROM essentials.governments WHERE name = 'State of California'`
   If it returns a row with `geo_id=NULL`, apply an UPDATE — do not INSERT.
2. Before inserting chambers, check for existing chamber names using the short-name convention (`Governor`, `Attorney General`, etc. — not `California Governor`).
3. Before inserting politician rows for CA constitutional officers, check `external_id` ranges — all 8 may already exist.

**CA example:** Migration 189 was written as UPDATE + WHERE NOT EXISTS guards (not INSERT). All 8 chamber INSERTs were no-ops. Exec politician rows also pre-existed under positive external_ids; migration 192 deduped and updated to -06000xxx scheme.

**Placement:** Step 1 (government structure research) inline callout + Step 5 (schema decisions) inline callout.

---

### GOTCHA CA-2: districts.state Casing = 'CA' (Uppercase) (Step 3 + Step 6)

**Source:** 61-01-SUMMARY.md, 57-02-SUMMARY.md [VERIFIED: read directly]

**Problem:** CA STATE_UPPER and STATE_LOWER districts were loaded before the TIGER loader lowercase-abbrev pattern was established. All pre-existing CA state legislature district rows have `state='CA'` (uppercase), while TIGER-loaded states (ME, OR, TX, MA) use lowercase (`'ca'`, `'me'`). Migration JOIN clauses that use `d.state = 'ca'` will return 0 rows for CA — a silent failure producing no officials in routing results.

**CA example from 61-01-SUMMARY.md:** Pre-check `WHERE state='ca'` returned 0 rows; actual data has `state='CA'`. This is a pre-existing data quality issue — do not attempt to fix it by renaming the rows (120+ district rows would require re-linking all offices).

**What is NOT broken:** Routing works because `essentialsService.ts` joins on `gb.mtfcc` and `d.district_type`, not on `d.state`.

**Solution:** When writing CA legislature migration JOINs, use `state='CA'` (uppercase) for STATE_UPPER and STATE_LOWER. This applies only to CA — all other TIGER-loaded states use lowercase.

**Placement:** Step 3 (geofence sources) inline callout + Step 6 (migration order) inline callout.

---

### GOTCHA CA-3: CA mtfcc Swap (STATE_UPPER=G5220, STATE_LOWER=G5210) (Step 3)

**Source:** 61-01-SUMMARY.md [VERIFIED: read directly]

**Problem:** CA `districts` rows have `mtfcc='G5220'` for STATE_UPPER (senate) and `mtfcc='G5210'` for STATE_LOWER (assembly) — the inverse of standard TIGER codes. A naive JOIN on `d.mtfcc = gb.mtfcc` will produce wrong results (returning assembly districts when querying senate, and vice versa).

**What is NOT broken:** Routing works because `essentialsService.ts` joins on `gb.mtfcc` (from `geofence_boundaries`), not on `d.mtfcc`. The `d.mtfcc` column value in `districts` is irrelevant to routing.

**Solution:** Do NOT attempt to correct this — it would require re-seeding all 120 CA state district rows plus re-linking all 120 offices. Smoke tests for CA routing must use the essentialsService join pattern, not a raw `d.mtfcc` join.

**Placement:** Step 3 (geofence sources) inline callout.

---

### GOTCHA CA-4: External ID Range Collision — Use -60003xx for CA House Reps (Step 5)

**Source:** 60-01-SUMMARY.md [VERIFIED: read directly]

**Problem:** The planned external_id range for CA US House representatives (-100049..-100119) was already occupied by pre-existing CA State Assembly members seeded before v7.0. Using that range caused a duplicate key constraint error on the first migration attempt.

**Solution:** CA federal House reps use the `-60003xx` scheme: CD-01 → -6000301, CD-52 → -6000352. The full established scheme for CA:
- CA executive constitutional officers: -6000101 through -6000108
- CA US Senators: -6000201, -6000202 (and -6000204 for Aguilar edge case)
- CA House reps: -6000301 through -6000352
- CA State Senators: -6001001 through -6001040
- CA Assembly members: -6002001 through -6002080
- CA Governor race challengers: -6003001 through -6003013
- LAUSD board members: -6004001 through -6004007

**Pre-flight rule:** Before assigning any external_id range for CA, run:
`SELECT external_id FROM essentials.politicians WHERE external_id BETWEEN -N AND -M`
to confirm the range is clear.

**Placement:** Step 5 (schema decisions) inline callout.

---

### GOTCHA CA-5: DataSF Socrata vs ArcGIS MapServer (outSR=4326) (Step 3)

**Source:** 63-01-SUMMARY.md, 68-01-SUMMARY.md, 58-01-SUMMARY.md [VERIFIED: read directly]

**Problem:** CA city open data APIs use TWO different GIS backends with different coordinate system defaults:

1. **DataSF Socrata** (SF, Berkeley): Returns native WGS84. Do NOT add `outSR=4326`. The district number field is different per city:
   - SF: `sup_dist_num` (returns float, e.g. `11.0` — use `parseInt(String())`)
   - Berkeley: `district` (lowercase, string values "1"-"8")

2. **ArcGIS MapServer** (LA GeoHub, Sacramento, San Diego, Fremont, San Jose): Returns CA State Plane feet by default (SRID 2229 or similar). MUST add `outSR=4326` to the query URL. The district number field is typically `DISTRICT` (integer) or `DISTRICTINT` (integer) — check the API's field schema before coding.

**Silent failure mode:** Omitting `outSR=4326` on ArcGIS endpoints returns coordinates in feet (X≈6,900,000, Y≈2,100,000) instead of degrees. PostGIS accepts the insert but ST_Covers will return zero rows for any address lookup — smoke test is the only catch.

**CA example coordinates that confirm WGS84:** `lon≈-122.xx, lat≈37.xx` for Bay Area; `lon≈-118.xx, lat≈34.xx` for LA.

**Placement:** Step 3 (geofence sources) inline callout — adjacent to the existing ArcGIS pattern note.

---

### GOTCHA CA-6: SF Consolidated City-County Returns Both G4110 and G4020 (Step 3)

**Source:** 57-02-SUMMARY.md [VERIFIED: read directly]

**Problem:** San Francisco is a consolidated city-county. Any SF address lookup returns BOTH a G4110 row (geo_id=0667000, "San Francisco city") AND a G4020 row (geo_id=06075, "San Francisco County"). This is correct TIGER behavior, not a duplicate or routing error.

**Trap for smoke tests:** A smoke test that asserts "exactly one G4110 row" or "no G4020 row" for an SF address will fail incorrectly. The correct assertion is: assert BOTH G4110 (geo_id=0667000) AND G4020 (geo_id=06075) are present.

**No other CA city behaves this way.** Other cities return G4110 only for the city tier; the county G4020 is a separate administrative boundary. SF is unique because the city and county governments are merged.

**Placement:** Step 3 (geofence sources) inline callout.

---

### GOTCHA CA-7: CA COUSUB (G4040) are CCDs — Do NOT Add CA to COUSUB_FUNCSTAT_STATES (Step 3)

**Source:** 57-01-SUMMARY.md [VERIFIED: read directly]

**Problem:** The TIGER loader applies a FUNCSTAT='A' filter for states in `COUSUB_FUNCSTAT_STATES` (currently only MA). CA G4040 records are all FUNCSTAT='S' (Census County Divisions — statistical areas, not active governments). If CA were added to `COUSUB_FUNCSTAT_STATES`, the filter would skip ALL 404 CA G4040 records, loading zero cousub boundaries for CA.

**Solution:** Do NOT add 'CA' to `COUSUB_FUNCSTAT_STATES`. The 404 CA G4040 records are all CCDs and should load without FUNCSTAT filtering. The current loader (as of Phase 57) correctly handles this via the state-conditional check.

**CA cousub count:** TIGER 2024 CA cousub file has 404 records — NOT 1,057 (that figure is from TIGERweb BAS25, a different dataset). The pre-flight assertion in `load-state-tiger-boundaries.ts` is set to 404.

**Practical impact:** CA G4040 boundaries are primarily needed for unincorporated areas like East LA, where there is no G4110 incorporated city. For the 6 v7.0 target cities (all incorporated G4110), G4040 is a secondary boundary.

**Placement:** Step 3 (geofence sources) inline callout — adjacent to the existing cousub GOTCHA.

---

### GOTCHA CA-8: CA Jungle Primary — One Unified Race Row (Step 2 + Step 6)

**Source:** 62-CONTEXT.md [VERIFIED: read directly]

**Problem:** California uses a "jungle primary" (top-two) system. ALL candidates from ALL parties compete in a single unified primary race, and the top 2 vote-getters advance to the general election regardless of party. This is structurally different from ME/TX where separate D/R primaries are normal.

**If you model CA statewide races on the ME pattern** (separate Democratic primary + Republican primary race rows), you will create fake races that do not exist — the CA primary ballot has no party-specific primary races.

**Authoritative source:** California Secretary of State (sos.ca.gov) — not Ballotpedia, which sometimes describes the top-two system using confusing terminology.

**Structure to use:**
- ONE `elections` row for the CA primary date (June 3, 2026)
- ONE `races` row per office (e.g., "CA Governor Primary 2026")
- ALL candidates linked as `race_candidates` to that single race row
- No separate "CA Governor Democratic Primary" or "CA Governor Republican Primary" rows

**Post-primary:** After June primary results, update the general election race to show only the top 2 finishers.

**Placement:** Step 2 (election system confirmation) inline callout.

---

### GOTCHA CA-9: Berkeley (and SF) RCV — Set election_method='rcv' at Seed Time (Step 2 + Step 6)

**Source:** 68-01-SUMMARY.md, 78-CONTEXT.md D-03 [VERIFIED: read directly]

**Problem:** Phase 68 seeded Berkeley's 3 chambers (Mayor, City Council, City Auditor) without setting `election_method='rcv'` on the chamber rows — left as a TODO for Phase 69. This required a second migration pass to correct, adding unnecessary complexity.

**Root cause:** The temptation to defer RCV flagging is high because "we're not seeding elections yet." But `election_method` is a property of the governing body (how the seat is filled), not the election contest. It belongs on the chamber row, set at structure-seed time.

**CA RCV cities (as of v7.0):**
- San Francisco: Mayor, Board of Supervisors (all 11 districts), City Attorney, DA, Assessor-Recorder, Public Defender, Sheriff, Treasurer — all chambers use RCV
- Berkeley: Mayor, City Council (all 8 districts), City Auditor — all chambers use RCV
- San Jose: Mayor, City Council — both chambers use RCV (set in Phase 69)

**Rule:** When seeding any RCV chamber, set `election_method='rcv'` in the same migration that creates the chamber row. Do not leave it as a follow-up TODO.

**Placement:** Step 2 (election system confirmation) inline callout — adjacent to existing RCV GOTCHA.

---

### GOTCHA CA-10: AEM/CQ5 CMS Headshot Pattern (Sacramento) (Step 7 / Data Sources)

**Source:** 66-03-SUMMARY.md [VERIFIED: read directly]

**Problem:** Sacramento's cityofsacramento.gov uses the Adobe Experience Manager (AEM) / CQ5 CMS. Official headshots are embedded as **CSS `background-image` URLs in `style` attributes**, not as `<img src>` tags. WebFetch and most HTML parsers skip inline CSS — the headshot URLs are invisible to standard web scraping tools.

**Solution:** Use raw `curl` + `grep` to extract the background-image URLs:
```bash
curl -s "https://www.cityofsacramento.gov/mayor-council/mayor" | grep -o 'background-image:url([^)]+)'
```
This returns URLs like `/content/dam/portal/mayor-council/mayor/...` which are then prepended with `https://www.cityofsacramento.gov` to form the full download URL.

**Image processing note:** Sacramento CMS renditions often produce square images (514×514 or 500×500). Apply center crop to 4:5 ratio, then resize to 600×750 Lanczos q90.

**Other CA cities NOT affected:** SF (media.api.sf.gov direct JPEG), San Diego (sandiego.gov direct JPEG), San Jose (mix of sanjoseca.gov + Wikimedia), Fremont (fremont.gov CDN paths via Node.js UA workaround), Berkeley (berkeleyca.gov direct JPEG).

**Placement:** Step 4 (data sources) inline callout + Step 7 pitfall table.

---

### GOTCHA CA-11: lavote.gov Election ID Maintenance (Step 2 + Step 6)

**Source:** 62-CONTEXT.md, STATE.md [VERIFIED: read directly]

**Problem:** The LA County elections discovery pipeline depends on a `source_url` field in `discovery_jurisdictions` that contains a lavote.gov election ID (e.g., `?id=4338`). This ID changes with every election cycle — June primary AND November general are separate IDs. If the ID is not updated, the discovery agent queries a stale election page that returns zero or incorrect candidates.

**Solution:** After every LA County election (June and November), manually update the `discovery_jurisdictions` row for LA County:
```sql
UPDATE essentials.discovery_jurisdictions
SET source_url = 'https://lavote.gov/home/voting-elections/current-elections/election-results/...?id=<NEW_ID>'
WHERE id = '9fd492a8-895e-4bd7-91e7-81f9bfa2b3e2';
```
Find the new ID by browsing lavote.gov and extracting the current election URL parameter.

**Two updates per year:** This is not a "one-and-done" setup. The June primary and November general each have distinct election IDs. Document both in STATE.md as pending operational tasks after each election.

**Post-June-3 2026 backlog item already flagged** in STATE.md: the November 2026 general requires a new ID update before the November cron run.

**Placement:** Step 2 (election system confirmation) inline callout — adjacent to the discovery_jurisdictions GOTCHA.

---

## Cities Onboarded Table — New Rows

Seven new rows to append to the existing Cities Onboarded table (after the Maine rows):

| City | State | Onboarded | Election method | Notable patterns |
|------|-------|-----------|-----------------|-----------------|
| California (state) | CA | 2026-05-21 | plurality (state primary: jungle/top-two) | Pre-existing seed: govt row + 8 exec chambers + 8 politicians existed before v7.0; geo_id was NULL (fixed to '06' in migration 189); chamber names use short form ('Governor', not 'California Governor'); mtfcc swap (STATE_UPPER=G5220, STATE_LOWER=G5210); districts.state='CA' uppercase |
| San Francisco | CA | 2026-05-22 | rcv (all chambers) | Consolidated city-county: both G4110 (0667000) + G4020 (06075) returned for any SF address; DataSF Socrata loader (no outSR, field=sup_dist_num float); sf.gov circular PNG headshots (alpha corners safe in 4:5 crop); 20 officials across 10 chambers; ext_ids -630001..–630028 |
| San Jose | CA | 2026-05-23 | rcv (Mayor + City Council) | ArcGIS DISTRICTINT field (not DISTRICT); outSR=4326 required; City Attorney + Auditor are APPOINTED per SJ Charter — no chambers created; geo_id=0668000; ext_ids -640001, -640010..-640019 |
| San Diego | CA | 2026-05-22 | plurality | ArcGIS outSR=4326 required (WKID 2230 native); DISTRICT field holds council member name (changes elections) — use integer DISTRICT field for district number; sandiego.gov headshots (public_domain); D4 Foster headshot has anomalous CMS filename; ext_ids -650001..-650018 |
| Sacramento | CA | 2026-05-28 | plurality (no RCV yet) | AEM/CQ5 CMS headshots: CSS background-image, curl+grep required (WebFetch cannot extract); ArcGIS DISTNUM field; outSR=4326 required; City Attorney/Auditor/Treasurer/Clerk all APPOINTED; geo_id=0664000; ext_ids -660001, -660010..-660017 |
| Fremont | CA | 2026-05-22 | plurality | ArcGIS outSR=4326 required (WKID 102643 native); fremont.gov 403 workaround (Node.js browser UA + Referer header); City Attorney APPOINTED per charter; geo_id=0626000; ext_ids -670001, -670010..-670015 |
| Berkeley | CA | 2026-05-22 | rcv (Mayor, City Council, City Auditor) | Socrata loader (NO outSR, field='district' lowercase string); City Attorney APPOINTED; both Mayor and Auditor share single LOCAL_EXEC district; geo_id=0606000; ext_ids -680001..-680017 |

[VERIFIED: all data drawn directly from phase SUMMARY.md files and STATE.md accumulated context]

---

## California Quick Reference Block Content

The "California Quick Reference" block sits between the Cities Onboarded table and Step 1. It serves as a pre-flight checklist for any agent starting a CA city onboarding. Format: table with trap name, step pointer, and one-line summary.

Recommended content:

```markdown
## California Quick Reference

**Read this before starting any CA city.** These traps are CA-specific — general playbook guidance above does not warn for them.

| Trap | See Step | One-Line Summary |
|------|----------|-----------------|
| Pre-existing CA seed | Step 1, Step 5 | CA govt row + 8 chambers + 8 politicians pre-existed; always pre-check before writing any CA state-level INSERT |
| districts.state casing | Step 3, Step 6 | Pre-existing CA districts use state='CA' (uppercase); lowercase 'ca' returns 0 rows |
| mtfcc swap | Step 3 | CA STATE_UPPER=G5220, STATE_LOWER=G5210 (inverse); do NOT join on d.mtfcc — routing uses gb.mtfcc |
| External ID range collision | Step 5 | -1000xx range occupied by CA Assembly; CA House reps use -60003xx; always pre-check range |
| DataSF vs ArcGIS (outSR) | Step 3 | SF/Berkeley use Socrata (native WGS84, no outSR); LA/Sacramento/SD/Fremont/SJ use ArcGIS (must add outSR=4326) |
| SF consolidated city-county | Step 3 | SF returns G4110 + G4020 for any address — assert BOTH in smoke tests |
| CA COUSUB = CCDs | Step 3 | CA G4040 are all FUNCSTAT='S'; do NOT add CA to COUSUB_FUNCSTAT_STATES |
| CA jungle primary | Step 2 | ONE unified primary race row for ALL candidates; sos.ca.gov is authoritative (not Ballotpedia) |
| RCV at seed time | Step 2, Step 6 | Set election_method='rcv' on chamber row during structure migration — not as a follow-up TODO |
| AEM/CQ5 headshots (Sacramento) | Step 4 | cityofsacramento.gov embeds headshots in CSS background-image — use curl+grep, not WebFetch |
| lavote.gov election ID | Step 2 | ID changes per cycle (June + November); update discovery_jurisdictions row manually after each election |
```
```

---

## Step-by-Step Placement Map

This map tells the planner exactly where each GOTCHA is added in the playbook:

| GOTCHA | Inline Placement | Pitfall Table? |
|--------|-----------------|----------------|
| CA-1: Pre-existing seed | Step 1 required-questions list + Step 5 GOTCHA callout | Yes — "CA state-level government/chambers pre-existed before v7.0" |
| CA-2: districts.state casing | Step 3 after TIGER GOTCHA on districts.state | No (covered by existing districts.state GOTCHA — add CA-specific annotation) |
| CA-3: mtfcc swap | Step 3 new inline GOTCHA | Yes |
| CA-4: External ID collision | Step 5 GOTCHA callout after migration number check | Yes |
| CA-5: DataSF vs ArcGIS | Step 3 new inline GOTCHA | Yes |
| CA-6: SF consolidated city-county | Step 3 new inline GOTCHA | No (only relevant for SF smoke tests) |
| CA-7: CA COUSUB = CCDs | Step 3 after existing cousub GOTCHA | No (already in cousub GOTCHA, needs CA annotation) |
| CA-8: CA jungle primary | Step 2 new inline GOTCHA | Yes |
| CA-9: Berkeley/SF RCV at seed time | Step 2 adjacent to existing RCV GOTCHA | No (RCV GOTCHA already covers chamber-level; add CA note) |
| CA-10: AEM/CQ5 headshots | Step 4 new inline callout | Yes |
| CA-11: lavote.gov election ID | Step 2 new inline GOTCHA | Yes |

---

## Milestone Closure Scope

### ROADMAP.md Changes Required

1. Phase 78 row in progress table: change status from `Pending` to `Complete`, set date to 2026-05-29
2. v7.0 milestone header: change `🚧 **v7.0 California** — Phases 57-70, 78 (in progress)` to `✅ **v7.0 California** — Phases 57-70, 78 (shipped YYYY-MM-DD)`
3. Phase 78 plans section: mark `78-01-PLAN.md` as `[x]`

[VERIFIED: current ROADMAP.md state read; Phase 78 row shows `Pending`]

### STATE.md Changes Required

1. Update `milestone` field (currently `v2.2`) — NOTE: this appears to be the parked v2.2 milestone in the header; the active work is v7.0. The `last_activity` is the correct field to update.
2. Update `last_activity` to: `2026-05-29 -- Phase 78 complete — CA Playbook Retrospective; v7.0 milestone shipped`
3. Update `Current Position` section to reflect Phase 78 complete

[VERIFIED: current STATE.md read; `last_activity: 2026-05-29 -- Phase 78 context gathered — CA Playbook Retrospective`]

### PROJECT.md Changes Required

Add to the `### Validated` list (after the v6.0 Maine entries), a new entry summarizing v7.0 CA deliverables. Based on the existing v6.0 pattern, the entry should cover:
- CA TIGER geofences (G4110, G4040, SLDU, SLDL, CD, counties)
- LAUSD board district geofences + 7 officials
- State of California government DB + 8 constitutional officers + 120 legislators + 54 federal officials
- 6 CA city deep seeds at full depth (SF, San Jose, San Diego, Sacramento, Fremont, Berkeley)
- CA 2026 elections (Governor + 52 US House) + discovery pipeline
- 965 compass stances across 68 officials
- Playbook updated with 11 CA-specific GOTCHAs

[VERIFIED: current PROJECT.md read; v7.0 section still shows Active/Current Milestone — to be moved to Validated]

---

## Common Pitfalls

### Pitfall 1: Incomplete GOTCHA coverage
**What goes wrong:** A GOTCHA documented in a SUMMARY.md file is missed because only the CONTEXT.md was read.
**Why it happens:** CONTEXT.md lists the known GOTCHAs from discuss-phase, but SUMMARY.md files contain auto-fixed deviations that surfaced during execution — some of which are GOTCHAs not anticipated in CONTEXT.md.
**How to avoid:** Read both CONTEXT.md (D-03 list) AND the SUMMARY.md files for each phase. Compare the lists.
**Warning signs:** Missing the DataSF field name difference (`sup_dist_num` vs `district`), missing the migration number collision, missing the TIGER 2024 cousub count discrepancy (404 not 1,057).

### Pitfall 2: Duplicating existing GOTCHA coverage
**What goes wrong:** A CA GOTCHA is added that is already covered by the general playbook GOTCHA (e.g., `districts.state` casing).
**Why it happens:** Some GOTCHAs were originally documented as general rules; CA adds a specific twist.
**How to avoid:** For each CA GOTCHA, check if the playbook already has a general version. If yes, add a CA-specific annotation to the existing GOTCHA rather than a new one.
**Current overlaps to handle:** `districts.state` casing (existing general GOTCHA covers ME; CA annotation is `uppercase='CA'` vs lowercase), TIGER CD key (existing general GOTCHA covers cd119 for ME; CA uses `cd` standard key — no annotation needed).

### Pitfall 3: Wrong step placement for GOTCHAs
**What goes wrong:** A GOTCHA is placed in the wrong step (e.g., external_id collision in Step 6 instead of Step 5).
**Why it happens:** Some traps span multiple steps.
**How to avoid:** Use the Step-by-Step Placement Map above. When in doubt: place the GOTCHA at the step where the trap is FIRST encountered (research/planning), not where it would be fixed.

### Pitfall 4: ROADMAP milestone status encoding
**What goes wrong:** The ROADMAP milestone header uses a different format than existing shipped milestones.
**Why it happens:** Unicode emoji characters (✅, 🚧) must be used correctly.
**How to avoid:** Copy the exact format from an existing shipped milestone (e.g., v6.0 line: `✅ **v6.0 Maine Essentials** — Phases 49-56 (shipped 2026-05-20)`).

---

## Code Examples

### Existing GOTCHA Format (must match exactly)

[VERIFIED: from LOCATION-ONBOARDING.md]

```markdown
> [GOTCHA] **[Label]:** [Problem description. Solution description.]
```

Example from Step 3:
```markdown
> [GOTCHA] **[STATE-SPECIFIC] TIGER congressional file naming varies by state:** The loader key may not be `cd` — always browse `https://www2.census.gov/geo/tiger/TIGER2024/CD/` and check the actual filename for your state FIPS before configuring `STATE_LAYER_ALLOWLIST`. In Maine, the congressional file is `tl_2024_23_cd119.zip` — the correct loader key is `cd119`, not `cd`. Using the wrong key causes a silent no-op: the loader runs without error but loads zero boundaries.
```

### CA-Specific Inline GOTCHA Example (AEM/CQ5 headshots)

```markdown
> [GOTCHA] **[STATE-SPECIFIC: CA] AEM/CQ5 CMS embeds headshots in CSS `background-image`, not `<img>` tags:** Sacramento's cityofsacramento.gov uses Adobe Experience Manager (CQ5). Official headshots appear in `style="background-image:url(...)"` attributes — WebFetch and standard HTML parsers cannot extract them. Use raw curl + grep: `curl -s "https://www.cityofsacramento.gov/mayor-council/mayor" | grep -o 'background-image:url([^)]+)'`. This returns paths like `/content/dam/portal/mayor-council/...` which must be prepended with `https://www.cityofsacramento.gov`. Square CMS renditions (514×514 or 500×500): center-crop to 4:5 ratio, then resize 600×750 Lanczos q90. Phase 66 confirmed all 9 Sacramento officials were sourced this way.
```

### Pitfall Table Row Example (new CA rows)

```markdown
| CA jungle primary modeled as separate D/R primaries | CA uses top-two jungle primary — ONE unified race row for ALL candidates regardless of party; sos.ca.gov is authoritative |
| CA pre-existing seed silently duplicated | Before any CA state-level INSERT, run `SELECT id, geo_id FROM essentials.governments WHERE name = 'State of California'`; if geo_id IS NULL, UPDATE — do not INSERT |
| ArcGIS outSR=4326 omitted for CA city boundaries | CA State Plane feet (SRID 2229) looks valid to PostGIS but ST_Covers returns 0 rows for all addresses — always add outSR=4326 to ArcGIS MapServer queries for CA cities |
```

---

## State of the Art

No library upgrades or paradigm changes. This phase uses the same GSD planning tools (Write tool, file reads) as all prior playbook retrospectives.

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual GOTCHA notes in STATE.md | Structured playbook retrospective as its own phase | v5.0 (Phase 45, Cambridge MA) | GOTCHAs are now permanently documented and findable |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | ROADMAP.md v7.0 milestone should be marked as shipped 2026-05-29 (date of Phase 78 completion) | Milestone Closure Scope | Wrong date in historical record; low impact |
| A2 | The `milestone:` field in STATE.md YAML header (currently `v2.2`) refers to the last milestone to enter active execution, not the v7.0 milestone. The STATE.md `last_activity` and `Current Position` fields are the correct update targets for v7.0 closure | Milestone Closure Scope | If wrong, the YAML milestone field would also need updating — but STATE.md shows v2.2 as `Parked` so the field appears stale already |

---

## Open Questions

1. **Should REQUIREMENTS.md checkbox statuses be updated?**
   - What we know: REQUIREMENTS.md has many unchecked boxes for v7.0 requirements that are now complete (GOVDB-01, GOVDB-02, GOVDB-03, CITIES-01, CITIES-03, CITIES-04, CITIES-05, etc.)
   - What's unclear: Whether Phase 78 scope includes updating REQUIREMENTS.md checkbox status
   - Recommendation: Not included in D-06 scope (CONTEXT.md specifies only ROADMAP.md, STATE.md, PROJECT.md). If planner decides to include it, add as a separate task at the end.

2. **Should the `milestone` YAML field in STATE.md be updated from `v2.2` to `v7.0`?**
   - What we know: The YAML header shows `milestone: v2.2` which is parked; the active v7.0 work is reflected in `last_activity` and body text only
   - What's unclear: Whether STATE.md YAML milestone tracks "current active executing milestone" or something else
   - Recommendation: Leave `milestone: v2.2` unchanged (v2.2 is technically still parked, not closed). Update only `last_activity` and the `Current Position` section body.

---

## Environment Availability

Step 2.6: SKIPPED — this phase is purely documentation changes with no external dependencies, no tool execution, no database access, and no script runs.

---

## Validation Architecture

This phase has no automated test coverage — it is a documentation + milestone-closure phase. There are no `.test.ts` or `.spec.ts` files to run. The equivalent of "testing" is a human review of:

1. The LOCATION-ONBOARDING.md diff — does it include all 11 GOTCHAs in correct step positions?
2. The California Quick Reference block — does it cover all 11 traps?
3. The Cities Onboarded table — does it have 7 new rows with correct data?
4. ROADMAP.md — is Phase 78 checked off and v7.0 marked shipped?
5. STATE.md — is last_activity updated?
6. PROJECT.md — are v7.0 requirements added to Validated list?

No Wave 0 test infrastructure gaps.

---

## Security Domain

Not applicable — no code changes, no authentication logic, no data writes.

---

## Sources

### Primary (HIGH confidence)
- `.planning/phases/78-ca-playbook-retrospective/78-CONTEXT.md` — locked decisions, all 9 confirmed GOTCHAs from D-03
- `LOCATION-ONBOARDING.md` — current playbook structure, GOTCHA format, Cities Onboarded table format
- `.planning/phases/57-ca-geofences/57-01-SUMMARY.md` — CA TIGER loader: cousub CCD pattern, COUSUB_FUNCSTAT_STATES, fipsArg=06
- `.planning/phases/57-ca-geofences/57-02-SUMMARY.md` — SF consolidated city-county, smoke test pattern, target city geo_ids
- `.planning/phases/58-lausd-geofences/58-01-SUMMARY.md` — ArcGIS MapServer pattern, outSR=4326, geo_id format, mtfcc=G5420
- `.planning/phases/58-lausd-geofences/58-02-SUMMARY.md` — LAUSD smoke test: geo_id LIKE filter
- `.planning/phases/59-ca-government-db/59-01-SUMMARY.md` — CA pre-existing seed: NULL geo_id, short names, migration 189 fix
- `.planning/phases/60-ca-executives-federal-officials/60-01-SUMMARY.md` — CA external_id conflict: -1000xx occupied; -60003xx scheme
- `.planning/phases/61-ca-state-legislature/61-01-SUMMARY.md` — CA districts.state='CA' uppercase; mtfcc swap (G5220/G5210 reversed)
- `.planning/phases/62-la-backlog-closure/62-CONTEXT.md` — CA jungle primary decision; lavote.gov election ID maintenance
- `.planning/phases/63-sf-deep-seed/63-01-SUMMARY.md` — DataSF Socrata loader: native WGS84, sup_dist_num float field, X0006 mtfcc
- `.planning/phases/66-sacramento-deep-seed/66-03-SUMMARY.md` — AEM/CQ5 headshot pattern: CSS background-image, curl+grep
- `.planning/phases/68-berkeley-deep-seed/68-01-SUMMARY.md` — Berkeley RCV punt: chambers seeded without election_method='rcv'
- `.planning/ROADMAP.md` — current milestone status, Phase 78 pending
- `.planning/STATE.md` — accumulated CA context, last_activity, next migration number
- `.planning/REQUIREMENTS.md` — PLAYBOOK-CA-01 requirement definition
- `.planning/PROJECT.md` — Validated list structure, v7.0 Current Milestone section

### Secondary (MEDIUM confidence)
None — all findings sourced from project files directly.

### Tertiary (LOW confidence)
None.

---

## Metadata

**Confidence breakdown:**
- GOTCHA content: HIGH — all 9 (11 including lavote + Berkeley RCV) sourced directly from phase SUMMARY.md files read in this session
- Playbook structure: HIGH — LOCATION-ONBOARDING.md read in full
- Milestone closure scope: HIGH — ROADMAP.md, STATE.md, PROJECT.md all read in full
- CA Cities Onboarded table data: HIGH — all rows drawn from STATE.md accumulated context and SUMMARY.md files

**Research date:** 2026-05-29
**Valid until:** Indefinite — this is retrospective documentation; findings do not expire
