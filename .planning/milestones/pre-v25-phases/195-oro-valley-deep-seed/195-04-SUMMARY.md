---
phase: 195-oro-valley-deep-seed
plan: 04
status: complete
completed: 2026-07-11
requirements: [BANR-01, SUB-01]
---

# 195-04 Summary — Oro Valley banner + coverage chip

## What was built
- **Banner (BANR-01):** Cañada del Oro (CDO) Riverfront Park pedestrian **trail bridge**, processed to
  the 1700×540 banner spec and uploaded to Storage at `cities/oro-valley.jpg` (CDN HTTP 200). A real
  ground-level photo — no AI, no aerial.
  - Subject | author | license: **Oro Valley CDO Trail Bridge | Djmaschek | CC BY-SA 3.0** (Wikimedia Commons)
  - Deliberately distinct from the Pima County Catalina/Pusch-Ridge landscape banner, the Tucson downtown
    streetscape, and the AZ-state Phoenix skyline (operator-approved via a 3-up side-by-side). Per Open
    Question 2, chose a non-mountain subject over the two shortlisted Pusch-Ridge candidates.
- **Frontend wiring (essentials repo, committed @ `8fb5b6c4`):**
  - `buildingImages.js` CURATED_LOCAL: added single-variant `'oro valley': { state:'AZ', src: cities/oro-valley.jpg }` with attribution comment.
  - `coverage.js`: appended `{ label:'Oro Valley', browseGovernmentList:['0451600'], browseStateAbbrev:'AZ', hasContext:true }` to the **existing** Arizona `COVERAGE_STATES` block (exactly one Arizona block; Pima County untouched in `COVERAGE_COUNTIES`).

## Verification
- `curl -sI cities/oro-valley.jpg` → HTTP 200; processed image = 1700×540 (banner spec).
- Both frontend modules parse (`node import()` → ok); `buildingImages.test.js` → 11/11 green.
- Exactly ONE `name: 'Arizona'` block; Oro Valley NOT in `COVERAGE_COUNTIES` (Pitfall 8 avoided).
- **Purple/"Stances" chip:** `hasContext:true` set; `LocalityMatches.jsx:87` renders the chip from
  `area.hasContext`; DB-honest (Plan 03 seeded 28 stances). Chip renders on the live site after the next
  frontend deploy.
- **Live E2E (Task 3, operator-confirmed):** POST `11000 N La Cañada Dr, Oro Valley, AZ 85737` to the live
  `/api/essentials/candidates/search` → HTTP 200, formatted address "…ORO VALLEY, AZ, 85737", returns
  exactly the 7 seeded officials under **Town of Oro Valley, Arizona, US**: Mayor Winfield + Vice-Mayor
  Barrett + 5 Council Members (Jones-Ivey, Nicolson, Greene, Murphy, Robb). No duplicate / wrong-jurisdiction
  office; party not displayed (antipartisan).

## Follow-up
- Frontend deploy to Render needed for the banner + chip to appear live (code is committed and correct).
