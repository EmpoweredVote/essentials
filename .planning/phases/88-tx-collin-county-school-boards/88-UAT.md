---
status: resolved
phase: 88-tx-collin-county-school-boards
source: 88-01-SUMMARY.md, 88-02-SUMMARY.md
started: 2026-06-03T00:00:00Z
updated: 2026-06-04T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running server/service. Clear ephemeral state (temp DBs, caches, lock files). Start the application from scratch. Server boots without errors, any seed/migration completes, and a primary query (health check, homepage load, or basic API call) returns live data.
result: skipped
reason: User tests on live production; server already running with migrations applied.

### 2. Plano ISD Routing
expected: Enter a Plano TX address (e.g. inside Plano city limits). The Representatives tab shows a "Plano Independent School District" section with 7 board members listed, titled "Board Member, Place 1" through "Board Member, Place 7".
result: issue
reported: "The Plano Independent school district people are all there, but they should be ordered by their place name Place 1, Place 2, Place 3, etc. Not by alphabetical. Also, the Mayor (John Muns) should be first in his section."
severity: major

### 3. McKinney ISD Routing
expected: Enter a McKinney TX address. The Representatives tab shows "McKinney Independent School District" with 7 board members, Place 1-7 titles. Six of seven members have headshot photos. Roxane Morrison (Place 4) appears without a photo but is still listed correctly.
result: issue
reported: "Both of the same concerns, the Board Members aren't in 'place #' order and should be and the mayor is not first."
severity: major

### 4. Allen ISD — No Headshots Acceptable
expected: Enter an Allen TX address. The Representatives tab shows "Allen Independent School District" with 7 board members listed (Place 1-7 titles). None of the 7 members have headshot photos — this is expected and acceptable; members still display with name and title.
result: issue
reported: "same issues - I don't even see a mayor at all for Allen."
severity: major

### 5. Frisco ISD Routing and Headshots
expected: Enter a Frisco TX address (e.g. Frisco city limits in Collin County). The Representatives tab shows "Frisco Independent School District" with 7 board members, all with headshot photos rendering correctly.
result: issue
reported: "same issues frisco City Council is called 'Council Place 3' instead of 'Frisco City Council', Mayor isn't first, and the Place #'s don't dictate order."
severity: major

### 6. Richardson ISD — Hybrid District/Place Titles
expected: Enter a Richardson TX address (or a Dallas-Collin overlap address inside Richardson ISD). The Representatives tab shows "Richardson Independent School District" with 7 board members. Board Members for seats 1-5 are titled "Board Member, District 1" through "District 5". Seats 6-7 are titled "Board Member, Place 6" and "Board Member, Place 7". All 7 have headshot photos.
result: issue
reported: "same issues, plus all of the pictures for the board members have a circle crop - white corner edges. None of these pictures work - no crops. Also, mayor isn't first and both the City Council and School district should be in order based on the number in the titles."
severity: major

### 7. Debbie Renteria — Accented Name Display
expected: In the Richardson ISD board section, the accented character in "Renteria" displays correctly rendered (not garbled). The name also appears correctly in any search or profile context.
result: pass
note: Name displays with correct accented i (i with acute). SUMMARY incorrectly documented the accented character as e — the actual Spanish spelling Renteria uses i-acute, confirmed correct in UI.

## Summary

total: 7
passed: 1
issues: 5
pending: 0
skipped: 1
blocked: 0

## Gaps

- truth: "School board members ordered by place/district number (Place 1, Place 2, ... Place 7)"
  status: resolved
  reason: "User reported: The Plano Independent school district people are all there, but they should be ordered by their place name Place 1, Place 2, Place 3, etc. Not by alphabetical."
  severity: major
  test: 2
  root_cause: "groupHierarchy.js line 478 regex /(?:district|seat|ward)\\s+(\\d+)/i is missing 'place' as a keyword. Office titles like 'Board Member, Place 1' don't match, so numeric sort is skipped and falls through to alphabetical last-name order. All 7 members in each ISD share one district_id UUID (one SCHOOL district per ISD), so parseInt(uuid) = NaN — the district_id numeric sort path is also inert."
  artifacts:
    - path: "src/lib/groupHierarchy.js"
      issue: "Line 478 regex missing 'place' keyword — /(?:district|seat|ward)\\s+(\\d+)/i should be /(?:district|place|seat|ward)\\s+(\\d+)/i"
  missing:
    - "Add 'place' to the office_title sort regex in groupHierarchy.js"
  debug_session: ""

- truth: "Mayor appears first in city government section"
  status: resolved
  reason: "User reported: The Mayor, John Muns, should also be first (Plano/McKinney/Frisco/Richardson). Mayor is not first in any Collin County TX city."
  severity: major
  test: 2
  root_cause: "TX city mayors have district_type='LOCAL' (not 'LOCAL_EXEC') because no separate LOCAL_EXEC district row was created in the Collin County migrations. groupHierarchy.js subGroupOrderScore() at line 382 awards score 10 (sorts first) only when pols.every(p => p.district_type === 'LOCAL_EXEC'). With district_type='LOCAL', the Mayor sub-group gets score 20 — same as the council sub-group. Tied scores fall to alphabetical label order: 'Council' (C) < 'Mayor' (M), so council renders first."
  artifacts:
    - path: "C:/EV-Accounts/backend/migrations/088_tx_tier1_cities.sql"
      issue: "Mayor and all council members inserted into one chamber with no separate LOCAL_EXEC district for Mayor — Mayor gets district_type='LOCAL' from geofence join, not 'LOCAL_EXEC'"
    - path: "src/lib/groupHierarchy.js"
      issue: "Line 382: subGroupOrderScore() condition pols.every(p => p.district_type === 'LOCAL_EXEC') excludes TX mayors with LOCAL district_type"
  missing:
    - "Option A (data): Add LOCAL_EXEC district rows for each TX city Mayor in a new migration, matching the SF/SD/Fremont/Sacramento pattern"
    - "Option B (code): Relax groupHierarchy.js subGroupOrderScore() to score 10 when LOCAL_EXEC_TITLE_RE matches office_title, regardless of district_type"
  debug_session: ""

- truth: "Allen TX address returns city mayor in Representatives tab"
  status: resolved
  reason: "User reported: I don't even see a mayor at all for Allen."
  severity: major
  test: 4
  root_cause: "essentials.offices for Allen Mayor (id=684ffdb3-4073-4164-86f6-c151334fccb1) still has politician_id pointing to deactivated former Mayor Baine Brooks (is_active=false). New Mayor Chris Schulmeister (id=698da6ca-eadd-46a0-8e27-94ae48d23279) was seeded into politicians but the offices.politician_id back-fill UPDATE was never applied. The routing query JOINs offices to politicians via o.politician_id then filters WHERE p.is_active=true — Brooks is inactive, so Mayor row returns zero results. 6 council members do appear correctly."
  artifacts:
    - path: "essentials.offices"
      issue: "Allen Mayor row (id=684ffdb3) has politician_id=3e616ef8 (Baine Brooks, is_active=false) — needs update to Schulmeister UUID"
    - path: "essentials.politicians"
      issue: "Chris Schulmeister (id=698da6ca) has valid_from/valid_to/data_source=NULL — needs metadata filled in"
    - path: "C:/EV-Accounts/backend/migrations/094_allen_frisco_politicians.sql"
      issue: "Seeded Brooks correctly; post-election follow-up migration to transfer offices.politician_id to Schulmeister was never written"
  missing:
    - "New migration: UPDATE essentials.offices SET politician_id='698da6ca-eadd-46a0-8e27-94ae48d23279' WHERE id='684ffdb3-4073-4164-86f6-c151334fccb1'"
    - "New migration: UPDATE essentials.politicians SET valid_from='2026-05-03', data_source='collin_county_official' WHERE id='698da6ca-eadd-46a0-8e27-94ae48d23279'"
  debug_session: ".planning/debug/allen-tx-city-council-missing.md"

- truth: "Frisco city council section labeled 'Frisco City Council'"
  status: resolved
  reason: "User reported: Frisco City Council is called 'Council Place 3' instead of 'Frisco City Council'."
  severity: major
  test: 5
  root_cause: "essentials.government_bodies has no TX rows (only CA, IN, MA, US). The LEFT JOIN on government_bodies returns NULL for all TX politicians, so government_body_name=''. groupHierarchy.js getSubGroupLabel() skips all named-body rules (all require body to be truthy) and falls to the final fallback at line 271 which normalizes office_title: 'Council Member Place N' becomes 'Council Place N'."
  artifacts:
    - path: "essentials.government_bodies"
      issue: "No TX rows exist — Frisco/Plano/McKinney/Allen/Richardson have no government_body_name entries"
    - path: "src/lib/groupHierarchy.js"
      issue: "Line 262-274: getSubGroupLabel() final fallback normalizes office_title when government_body_name is empty, producing 'Council Place N' instead of chamber name"
  missing:
    - "Option A (data): Insert government_bodies rows for each TX city council chamber (state='tx', geo_id per city, body_key and display_name set)"
    - "Option B (code): In getSubGroupLabel() add fallback before line 271 to use chamber_name_formal or chamber_name when body is empty and district_type is LOCAL"
  debug_session: ".planning/debug/frisco-council-label-bug.md"

- truth: "Richardson ISD board member headshots display as clean rectangular photos"
  status: resolved
  reason: "User reported: all of the pictures for the board members have a circle crop - white corner edges. None of these pictures work - no crops."
  severity: major
  test: 6
  root_cause: "Richardson ISD source images at web.risd.org/board/wp-content/uploads/ are pre-circular-masked JPEGs (WordPress theme applied circular treatment before upload). The Phase 88-02 pipeline downloaded these white-cornered circular images, applied 4:5 crop and 600x750 resize, but preserved the white corner pixels. The resulting JPEGs in Supabase Storage contain a circular headshot silhouette with white fill in the four corners. The frontend rendering is correct — the bug is in the source images."
  artifacts:
    - path: "Supabase Storage politician_photos bucket"
      issue: "7 Richardson ISD headshots (external_ids -880029 to -880035) are circular-masked with white corners baked into the JPEG"
    - path: "C:/EV-Accounts/backend/migrations/262_tx_collin_county_school_headshots.sql"
      issue: "Documents Richardson ISD source URLs (web.risd.org/board/wp-content/uploads/) — source images are pre-circular"
  missing:
    - "Re-source Richardson ISD headshots: check individual bio pages at web.risd.org/board/[name-slug]/ for uncropped originals, or find press photos from ISD news articles"
    - "If no rectangular source exists: process by cropping to inscribed face region and compositing on neutral background before 600x750 resize"
  debug_session: ""
