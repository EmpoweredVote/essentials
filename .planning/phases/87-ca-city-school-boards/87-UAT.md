---
status: diagnosed
phase: 87-ca-city-school-boards
source: [87-01-SUMMARY.md, 87-02-SUMMARY.md]
started: 2026-06-02T16:00:00Z
updated: 2026-06-02T16:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: The backend is running and the 34 newly-seeded CA school board officials are queryable from a cold start. A quick DB check (or health endpoint) returns live data without migration or startup errors.
result: skipped
reason: Testing on live production — migration 257 already applied, backend running on Render

### 2. SFUSD SCHOOL section
expected: Entering an address inside the SFUSD boundary (e.g., somewhere in San Francisco) shows a SCHOOL section on the Reps tab. It lists 7 officials with the title "Commissioner" — one for each of the 7 SFUSD board seats.
result: issue
reported: "SFUSD headshots are greyscale (B&W source photos). Officials' tiles are smaller than other sections — cascading layout effects. Title shows 'San Francisco Unified School District Board of Education' instead of 'Commissioner'."
severity: major

### 3. SDUSD SCHOOL section
expected: Entering an address inside the SDUSD boundary (somewhere in San Diego) shows a SCHOOL section listing 5 officials titled "Board Member (District A)" through "Board Member (District E)".
result: issue
reported: "Same title issue (shows chamber/government name instead of office title) and smaller tiles. Greyscale confirmed as a bug — validation boundary should prevent greyscale headshots from being accepted."
severity: major

### 4. SCUSD SCHOOL section
expected: Entering an address inside the Sacramento City USD boundary shows a SCHOOL section with 7 officials titled "Board Member (Area 1)" through "Board Member (Area 7)".
result: issue
reported: "Same title bug (shows 'Sacramento City Unified School District Board of Education') and smaller tiles. SCUSD headshots are color — no greyscale issue."
severity: major

### 5. SJUSD SCHOOL section
expected: Entering an address inside the SJUSD core boundary (southern/central San Jose) shows a SCHOOL section with 5 officials titled "Board Member (Trustee Area 1)" through "Board Member (Trustee Area 5)".
result: issue
reported: "Officials present, no headshots (expected). Tiles still small with no images — confirms size bug is CSS/layout, not image-driven. Section header and category name display 'San José' (with accent) while San Jose City Council shows 'San Jose' (no accent) — inconsistent spelling."
severity: major

### 6. FUSD SCHOOL section
expected: Entering an address inside the Fremont Unified SD boundary shows a SCHOOL section with 5 officials titled "Board Member (Area 1)" through "Board Member (Area 5)".
result: issue
reported: "FUSD routing confirmed working (5 officials appear). Bad test address caused initial false alarm. Title bug confirmed: shows district name instead of 'Board Member (Area N)'. Tile size bug also present."
severity: major

### 7. BUSD SCHOOL section
expected: Entering an address inside the Berkeley Unified SD boundary shows a SCHOOL section with 5 officials titled "Director" — using Berkeley's official term, not "Board Member".
result: issue
reported: "Same title bug and small tiles."
severity: major

### 8. Headshots on school board profiles
expected: Clicking through to a SFUSD, SDUSD (except Whitehurst-Payne), SCUSD, FUSD, or BUSD board member shows their headshot. SJUSD officials show no headshot (none available). Sharon Whitehurst-Payne (SDUSD District E) shows no headshot.
result: issue
reported: "SCUSD headshots display correctly in color. SFUSD headshots confirmed B&W/greyscale on profile pages."
severity: major

## Summary

total: 8
passed: 0
issues: 6
pending: 0
skipped: 1

## Gaps

- truth: "School board officials show their office title (e.g. 'Commissioner', 'Board Member (District A)')"
  status: diagnosed
  reason: "Title shows chamber/government name ('San Francisco Unified School District Board of Education') instead of office title. Affects all 6 districts."
  severity: major
  test: 2
  root_cause: "Results.jsx renderPoliticianCard has a hardcoded SCHOOL branch (lines ~1165-1169) that constructs card title from government_name+chamber_name, completely ignoring office_title. The cleanTitle variable holds the correct value ('Commissioner') but the SCHOOL branch never uses it."
  artifacts:
    - path: "src/pages/Results.jsx"
      issue: "SCHOOL branch of cardTitle uses government_name+chamber_name instead of cleanTitle (office_title)"
  missing:
    - "In SCHOOL cardTitle branch, return qualify(cleanTitle, pol) instead of concatenating government_name+chamber_name"

- truth: "School board official tiles display at normal size matching other rep sections"
  status: diagnosed
  reason: "Tiles are smaller/sparser than other sections. Confirmed not image-driven — SJUSD tiles are small with zero headshots."
  severity: major
  test: 2
  root_cause: "deriveSeatSubtitle() in Results.jsx returns null immediately for district_type !== 'LOCAL' and !== 'COUNTY', so SCHOOL cards get no subtitle line. Council cards get a subtitle ('District N') making them visually fuller. Both hit minHeight:130px but council cards have more content."
  artifacts:
    - path: "src/pages/Results.jsx"
      issue: "deriveSeatSubtitle line ~254: early return null for SCHOOL type — no subtitle derived"
  missing:
    - "Add SCHOOL to allowed types in deriveSeatSubtitle, extracting seat label from office_title parenthetical (e.g. 'Board Member (Area 1)' → 'Area 1')"

- truth: "Headshot upload pipeline rejects greyscale images — only color photos accepted"
  status: diagnosed
  reason: "7 SFUSD headshots uploaded as greyscale — source photos at sfusd.edu are explicitly B&W (filenames contain 'B&W', 'bw')."
  severity: major
  test: 2
  root_cause: "crop_and_resize() does 'if img.mode != RGB: img.convert(RGB)' — silently converts greyscale (mode L) to RGB without rejecting it. Same vulnerability in ca_senate_headshots.py and lausd-headshots/process.py. No check for img.mode == 'L' exists in any script."
  artifacts:
    - path: "scripts/_tmp-ca-school-headshots.py"
      issue: "Line 133: silent mode=L to RGB conversion, no rejection guard"
    - path: "scripts/ca_senate_headshots.py"
      issue: "Same silent greyscale conversion pattern"
    - path: "scripts/lausd-headshots/process.py"
      issue: "Same silent greyscale conversion pattern"
  missing:
    - "Add guard: if img.mode in ('L', 'LA'): skip with warning — apply to all headshot scripts"
    - "Find color replacement photos for 7 SFUSD officials (sfusd.edu only serves B&W — need LinkedIn, news, or external sources)"

- truth: "FUSD SCHOOL section appears for Fremont addresses"
  status: confirmed_ok
  reason: "User got 'couldn't find that address' for Fremont. Debug agent confirmed FUSD geofence and routing are fully functional."
  severity: blocker
  test: 6
  root_cause: "Bad test address: '3300 Capitol Ave, Fremont, CA 94538' — Capitol Ave does not exist in Fremont's street network. Census geocoder returns ADDRESS_NOT_FOUND. FUSD G5420 geofence IS loaded; district row IS present; routing returns all 5 FUSD officials at valid coords."
  artifacts: []
  missing:
    - "Re-test with valid address: '39001 Fremont Blvd, Fremont, CA 94538'"

- truth: "City name spelling is consistent across sections (San Jose)"
  status: diagnosed
  reason: "SJUSD section header shows 'San José' (with accent); San Jose City Council shows 'San Jose' (no accent)."
  severity: cosmetic
  test: 5
  root_cause: "migration 257 seeded government_name as 'San José Unified School District, California, US' with accent. getAccordionKey returns government_name verbatim for SCHOOL type (no government_bodies row to override). City of San Jose uses no accent."
  artifacts:
    - path: "C:/EV-Accounts/backend/migrations/257_ca_city_school_boards.sql"
      issue: "government_name seeded with 'San José' — inconsistent with city name 'San Jose'"
  missing:
    - "Follow-on migration to normalize government_name to 'San Jose Unified School District, California, US'"
