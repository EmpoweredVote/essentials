---
phase: 52-me-state-legislature
plan: 01
subsystem: essentials-data
tags: [postgresql, migration, maine, state-senate, powershell, generator-script]

# Dependency graph
requires:
  - phase: phase-49-plan-01
    provides: 35 STATE_UPPER districts loaded from TIGER, geo_id 23001-23035, state='me' lowercase
  - phase: phase-50-plan-01
    provides: Maine Senate chamber (name='Maine Senate') created by migration 168
provides:
  - 35 Maine state senator politicians (132nd Legislature), external_ids -231001 to -231035
  - 35 Maine Senate offices, one per STATE_UPPER district, chamber='Maine Senate'
  - office_id back-filled on all 35 politicians
  - generate_me_senate.ps1 PowerShell generator script
  - 172_me_state_senate_officials.sql migration (applied to live DB)
affects: [phase-52-plan-03-headshots]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PowerShell generator script (.ps1) for repetitive 35-senator SQL — Phase 39 MA pattern adapted for ME"
    - "Compound last name handling: 'Talbot Ross' stays together as last_name; first_name='Rachel'"
    - "ME STATE_UPPER districts: d.state='me' lowercase, d.district_type='STATE_UPPER' required in WHERE"
    - "district_type disambiguation: STATE_UPPER and STATE_LOWER share geo_ids 23001-23035, only district_type differentiates"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/generate_me_senate.ps1
    - C:/EV-Accounts/backend/migrations/172_me_state_senate_officials.sql
  modified: []

key-decisions:
  - "Office title is bare 'Senator' (not compound 'Senator, State Senate District N') — district label reached via district_id FK"
  - "Full legal names used from senators alphabetical listing (/senate/senators/9536), not individual page nicknames ('Jeff'=Jeffrey L., 'Dick'=Richard, 'Rick'=Richard A., 'Mattie'=Matthea E. L.)"
  - "Richard Bradstreet: official listing uses full name; individual page shows 'Dick' — legal name used in DB"
  - "External_id scheme: -231000 - N (D1=-231001, D35=-231035); 0 conflicts found"

patterns-established:
  - "ME senator external_id range: -231001 to -231035 (occupied)"
  - "ME house rep external_id range: -232001 to -232151 (free for Plan 52-02)"
  - "ME STATE_UPPER geo_id format: '23' + lpad(district, 3, '0') e.g. District 9 → '23009'"

# Metrics
duration: 7min
completed: 2026-05-19
---

# Phase 52 Plan 01: ME State Senate Officials Summary

**35 Maine 132nd Legislature senators seeded into essentials with offices linked to STATE_UPPER districts via migration 172; PowerShell generator script (Phase 39 MA pattern) produces idempotent SQL from verified roster**

## Performance

- **Duration:** 7 min
- **Started:** 2026-05-19T13:57:20Z
- **Completed:** 2026-05-19T14:04:44Z
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments

- Verified 35-senator roster from legislature.maine.gov (confirmed full legal names, parties, district assignments)
- Generated `generate_me_senate.ps1` (35-entry roster array, idempotent SQL blocks, UTF-8 no-BOM output)
- Generated and applied `172_me_state_senate_officials.sql`: 35 senator politicians + 35 offices + office_id back-fill UPDATE
- All 10 verification queries passed; idempotency confirmed (re-run: all INSERT 0 0, UPDATE 0)

## Roster Verification Notes

No corrections to party, district assignment, or external_id were required. Name display corrections noted:

| District | Roster Name | Individual Page Display | Note |
|----------|-------------|------------------------|------|
| 5 | Russell J. Black | "Russell Black" (page title) | Full name "Russell J. Black" on alphabetical listing |
| 14 | Craig V. Hickman | "Craig Hickman" (page title) | Full name "Craig V. Hickman" on alphabetical listing |
| 15 | Richard Bradstreet | "Dick Bradstreet" (page title) | "Richard Bradstreet" on official listing; "Dick" is nickname |
| 17 | Jeffrey L. Timberlake | "Jeff Timberlake" (page title) | "Jeffrey L. Timberlake" on alphabetical listing |
| 18 | Richard A. Bennett | "Rick Bennett" (page title) | "Richard A. Bennett" on alphabetical listing |
| 23 | Matthea E. L. Daughtry | "Mattie Daughtry" (page title) | "Matthea E. L. Daughtry" on alphabetical listing |
| 28 | Rachel Talbot Ross | Confirmed ✓ | Compound last_name='Talbot Ross' |
| 35 | Mark W. Lawrence | "Mark Lawrence" (page title) | "Mark W. Lawrence" on alphabetical listing |

**Decision:** Used official alphabetical listing names (full legal names) throughout, not individual page nicknames.

## Task Commits

1. **Task 1: Verify roster + write generate_me_senate.ps1 + generate migration** - `d195c0a` (feat — EV-Accounts repo)
2. **Task 2: Apply migration + verify 10 queries** - applied via psql (DB operation, no code commit needed)

**Plan metadata:** (committed with docs commit below)

## First-Run Migration Output (psql)

```
BEGIN
INSERT 0 1  (x35 — one per senator)
UPDATE 35   (office_id back-fill)
COMMIT
```

## Idempotency Re-Run Output (psql)

```
BEGIN
INSERT 0 0  (x35 — all skipped via ON CONFLICT)
UPDATE 0    (office_id back-fill — all already set)
COMMIT
```

## Verification Query Results

| Query | Expected | Actual | Pass |
|-------|----------|--------|------|
| Q1: politician count (range -231035..-231001) | 35 | 35 | YES |
| Q2: Maine Senate office count | 35 | 35 | YES |
| Q3: politicians with NULL office_id | 0 | 0 | YES |
| Q4: offices linked to STATE_UPPER d.state='me' | 35 | 35 | YES |
| Q5: distinct office title | 'Senator' | 'Senator' | YES |
| Q6: distinct representing_state | 'ME' | 'ME' | YES |
| Q7: spot-check 5 senators | 5 rows | 5 rows | YES |
| Q8: orphan offices | 0 | 0 | YES |
| Q9: STATE_LOWER cross-contamination | 0 | 0 | YES |
| Q10: idempotency re-run | all 0s | all 0s | YES |

### Q7 Spot-Check Output

```
 external_id |     full_name      |   party    |  title  | geo_id |          label
-------------+--------------------+------------+---------+--------+--------------------------
     -231001 | Susan Bernard      | Republican | Senator | 23001  | State Senate District 1
     -231009 | Joseph M. Baldacci | Democrat   | Senator | 23009  | State Senate District 9
     -231011 | Chip Curry         | Democrat   | Senator | 23011  | State Senate District 11
     -231031 | Donna Bailey       | Democrat   | Senator | 23031  | State Senate District 31
     -231035 | Mark W. Lawrence   | Democrat   | Senator | 23035  | State Senate District 35
```

### Final Structural Checks

- **Maine chambers for State of Maine:** 6 (unchanged from Phase 50)
- **STATE_UPPER districts for ME:** 35 (unchanged from Phase 49)

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/generate_me_senate.ps1` - PowerShell generator; 35-entry roster; emits migration 172
- `C:/EV-Accounts/backend/migrations/172_me_state_senate_officials.sql` - Migration: 35 senator + office CTE blocks + back-fill; wrapped in BEGIN/COMMIT

## Decisions Made

- Office title is bare `'Senator'` (not compound with district label) — matches TX pattern, not MA compound pattern
- Full legal names used (from alphabetical listing at /senate/senators/9536), not individual page nicknames
- District 15 senator stored as "Richard Bradstreet" (official), not "Dick Bradstreet" (page nickname)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## 35 Senator Tuples (for Plan 52-03 headshots)

| politician_id | full_name | external_id | district_id | geo_id |
|---------------|-----------|-------------|-------------|--------|
| 4fcdb98d-b61f-499d-8d19-8f9462c907dd | Susan Bernard | -231001 | 6c06bc41-7585-4d77-944f-eedddf6ea69e | 23001 |
| 9a76f4d8-61d0-4a4b-a5d2-cff71b608f05 | Trey L. Stewart | -231002 | 150224f4-65a0-4c99-b6b2-b1f8e7be08c9 | 23002 |
| a49f9cab-2681-4003-a4a7-398c569cbaf5 | Bradlee T. Farrin | -231003 | 55691162-83ad-4e5e-a353-0950109fd439 | 23003 |
| d435e628-4145-41c3-9dc4-4ff2b91b9acf | Stacey K. Guerin | -231004 | 590e6165-b870-425f-ad55-9741f787e51b | 23004 |
| 81db75c5-8c48-40f3-8cb1-7220def31e72 | Russell J. Black | -231005 | bd6e8de1-3176-47f2-933d-1118d2b94bf1 | 23005 |
| 26583d91-4019-4832-bc2e-36c0672d878a | Marianne Moore | -231006 | e448dafe-6ae7-4508-9e5f-e925b822b0b5 | 23006 |
| 1c14da77-9b45-478c-85b5-9b2f5dad1481 | Nicole C. Grohoski | -231007 | 64572181-6b36-4702-a529-3c9ab4f67d24 | 23007 |
| 653b504d-e5fd-4bc5-ab86-fc2b8129caf5 | Mike Tipping | -231008 | 9a3240a4-a9a1-479d-8cd0-d6aca6e875dc | 23008 |
| 56d01855-0c6d-478e-a74d-61017b0ecb37 | Joseph M. Baldacci | -231009 | 9c50ca87-aa0e-43df-aea0-9fe26005e9c4 | 23009 |
| f6fef6fa-30e2-4dac-9bf6-9b0250b24bd3 | David Haggan | -231010 | 91601092-0d45-49d7-94b5-b811772003e3 | 23010 |
| ff20c338-594f-4f9b-b667-08c29dc735b8 | Chip Curry | -231011 | 3e39d835-bdb2-49b5-94e4-ddc159683390 | 23011 |
| f0e9d708-32bf-4333-b696-d14707dcf468 | Pinny H. Beebe-Center | -231012 | cb18037d-5c32-492a-b40a-27cf1dab9a97 | 23012 |
| ceace463-1299-4c49-b5aa-e73af2534e0a | Cameron D. Reny | -231013 | 5b0e54e5-f6db-40b9-97be-ee5eb2926324 | 23013 |
| 838be693-3b76-413d-a37a-f1da2f3f1286 | Craig V. Hickman | -231014 | b860cea8-309c-4105-ad13-ea4b8ce1bd88 | 23014 |
| 7a6b6395-3308-4477-88f9-b5cb85722ee1 | Richard Bradstreet | -231015 | dfec05ef-5551-41f3-be80-31272fccfb90 | 23015 |
| dc583785-9207-41b7-a790-1bc87e0685de | Scott Cyrway | -231016 | 9253365d-27eb-4acb-8250-f07c71287123 | 23016 |
| f6c4c795-fac0-4b57-8b6e-0ae57515f941 | Jeffrey L. Timberlake | -231017 | 4196ea2c-8119-424b-a03b-ba5b6e37e652 | 23017 |
| e73bd689-240f-492a-bf01-f7be307367f8 | Richard A. Bennett | -231018 | 4dc1eb77-6591-4206-802b-1012b232af08 | 23018 |
| 90e18f37-3ae3-4466-8f56-1f1bcecdac7d | Joseph Martin | -231019 | 01fec42f-2ac7-444b-840e-b451c0f79d1d | 23019 |
| f1b5eb73-bc60-4e7a-a6b4-2702e8c40238 | Bruce Bickford | -231020 | ebf061b3-fcd2-4adf-9566-48a96409264d | 23020 |
| 9e1175bc-2df1-4c7e-808a-fd9f0faa5ea1 | Peggy R. Rotundo | -231021 | b8cde067-7f74-4784-b0b8-96e040881433 | 23021 |
| fc62e5af-90bc-42ad-90a5-6d0a586331e8 | James D. Libby | -231022 | 8286f81d-1d87-4026-883e-7f6cc13b85e8 | 23022 |
| 0ed25b30-633f-45f5-99f1-a32009b134f5 | Matthea E. L. Daughtry | -231023 | fe5ecd10-1f5c-4f17-a28b-dde54da31363 | 23023 |
| 71522fd3-94ba-442a-b52e-50b5f77adfcd | Denise Tepler | -231024 | 2e896e8a-a7d0-4c7e-8e58-5e4d90188fdf | 23024 |
| 69fece92-eade-468e-bf34-82bbac5b3da9 | Teresa S. Pierce | -231025 | bf36301d-ffe2-4a53-8514-a1b4ffa48467 | 23025 |
| b8bac865-38a9-45f7-8641-ebdedf416f30 | Timothy E. Nangle | -231026 | 644dc0ff-07c6-46e4-b6f6-531fdbf1176e | 23026 |
| 4eda22f0-a6db-485b-9d76-e76cf7a9a716 | Jill C. Duson | -231027 | 950c8ba2-1fc7-4926-87e4-ce2c54568dd3 | 23027 |
| ab357826-a155-4d8a-872f-de865129a256 | Rachel Talbot Ross | -231028 | 81ec9de3-aab5-4213-bc41-e02fbd2d0508 | 23028 |
| 0b0e2f33-d54b-486b-abe8-70c30b7c33eb | Anne M. Carney | -231029 | 68e701a3-aa1a-4ad3-b093-dff38f100918 | 23029 |
| 0d01124b-78df-448b-b34a-28f10b39ba8c | Stacy F. Brenner | -231030 | 2547c492-e3be-45ac-b780-3d2357ff2b50 | 23030 |
| 514dc276-d1a3-4ca2-9ee0-743684cd4bc9 | Donna Bailey | -231031 | 0b0c9cbb-d54e-4854-ae11-83633546b62a | 23031 |
| d03913a3-a9d8-44f8-a8af-e07786e1ef2e | Henry L. Ingwersen | -231032 | 3c8692e6-5603-4ebb-9a1b-7a088d91f062 | 23032 |
| 4248ed15-3a23-47e7-a24d-6235379b8e43 | Matt A. Harrington | -231033 | 2b363362-56ca-4c39-81ae-70624941186e | 23033 |
| 738c8451-84e5-4d17-a2eb-7e2de4e075c1 | Joseph Rafferty | -231034 | 2ee98aa5-5551-4296-8012-caf0209fab1f | 23034 |
| 1d61fa5a-1a71-4d45-9cd5-a0ded08ec7f8 | Mark W. Lawrence | -231035 | 1c156a24-ded8-48d4-9338-60c4800768b0 | 23035 |

## Next Phase Readiness

- Plan 52-02 (ME state house reps, migration 173) is unblocked — external_ids -232001..-232151 confirmed free
- Plan 52-03 (headshots for all ME legislators) is unblocked — senator politician_ids in table above
- All 35 senator politicians exist with office_id populated; profile pages can render title + chamber + district

---
*Phase: 52-me-state-legislature*
*Completed: 2026-05-19*
