---
phase: 52-me-state-legislature
plan: 02
subsystem: essentials-data
tags: [maine, state-legislature, house-of-representatives, migration, powershell-generator, postgresql]

# Dependency graph
requires:
  - phase: phase-49-plan-01
    provides: 151 STATE_LOWER (G5220) districts loaded with geo_id '23001'..'23151', state='me', district_type='STATE_LOWER'
  - phase: phase-50-plan-01
    provides: Maine House of Representatives chamber (slug='maine-house-of-representatives', id=5820521b-cd21-4bf1-9296-fd848230d542)
provides:
  - 150 named politicians for ME House districts (external_ids -232001..-232151 excl. -232029)
  - 1 vacant office for District 29 (Kathy Javner deceased, no special election)
  - 151 essentials.offices rows for the Maine House chamber, one per STATE_LOWER district
  - politicians.office_id back-filled for all 150 named reps
  - generate_me_house.ps1 generator script with verified 151-entry roster
  - migration 173 idempotent SQL file
affects:
  - phase-52-plan-03-headshots

# Tech tracking
tech-stack:
  added: []
  patterns:
    - PowerShell generator script (.ps1) for repetitive 151-block SQL migrations (Phase 39 MA pattern)
    - Vacant seat modeled as office with politician_id=NULL, is_vacant=true (no politician row)
    - office_id back-fill UPDATE scoped to external_id BETWEEN range, guarded by IS NULL

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/generate_me_house.ps1
    - C:/EV-Accounts/backend/migrations/173_me_state_house_officials.sql
  modified: []

key-decisions:
  - "District 94 (Cloutier resigned) is NO LONGER vacant: Scott Harriman (Democrat) won special election 2026 and is seated — verified from legislature.maine.gov 2026-05-19"
  - "District 29 (Javner deceased) confirmed still vacant as of 2026-05-19 — no special election held"
  - "D. Michael Ray (D40) uses first_name='D. Michael' per official legislature display name"
  - "W. Edward Crockett (D112) uses first_name='W. Edward' per official legislature display name"
  - "Sharon Frost (D58) is Unenrolled party — not Republican as the research WebFetch artifact implied"
  - "Tribal reps Aaron Dana and Brian Reynolds NOT seeded — no STATE_LOWER district geofence exists for tribal seats"

patterns-established:
  - "ME house reps use simple title='Representative' (no compound 'Representative, District N')"
  - "External ID range for ME house: -232001 to -232151 (District N = -232000 - N)"

# Metrics
duration: 45min
completed: 2026-05-19
---

# Phase 52 Plan 02: ME State House Officials Summary

**150 named Maine House representatives + 1 vacant office seeded via migration 173 with PowerShell generator, including 7 verified roster corrections from live legislature.maine.gov data**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-05-19T13:27:00Z
- **Completed:** 2026-05-19T14:12:17Z
- **Tasks:** 2/2
- **Files modified:** 2 created (generate_me_house.ps1, 173_me_state_house_officials.sql)

## Accomplishments

- Built generate_me_house.ps1 with fully verified 151-entry roster array (150 named + 1 vacant) from live legislature.maine.gov
- Applied migration 173 to live DB: 151 `INSERT 0 1` rows (150 named-rep CTE blocks + 1 vacant office), `UPDATE 150` (office_id back-fill), `COMMIT`
- All 12 verification queries passed; idempotency confirmed (all `INSERT 0 0`, `UPDATE 0` on re-run)

## Task Commits

1. **Task 1: Generate ME house migration 173 with 150 named reps + 1 vacant** - `423d843` (feat)
2. **Task 2: Apply migration 173 and verify** - DB-only operation, no additional commit (migration applied via psql, all verifications passed)

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/generate_me_house.ps1` - PowerShell generator script, 151-entry verified roster
- `C:/EV-Accounts/backend/migrations/173_me_state_house_officials.sql` - Generated migration: 150 CTE blocks + 1 VACANT block + office_id back-fill + BEGIN/COMMIT

## Roster Corrections from Task 1 Step 1 Verification

All corrections verified from live legislature.maine.gov member directory and individual profile pages on 2026-05-19.

### A. Abbreviated Names — Full Names Resolved

| District | Research Roster | Verified Full Name | Party | Note |
|----------|----------------|-------------------|-------|------|
| D40 | "D. Ray" | D. Michael Ray | Democrat | Profile page h2 shows `D. Michael Ray`; email `Michael.Ray@legislature.maine.gov`; city: Lincolnville |
| D112 | "W. Crockett" | W. Edward Crockett | Unenrolled | Profile page h2 shows `W. Edward Crockett`; email `Ed.Crockett@legislature.maine.gov`; city: Portland |

### B. Duplicate Names — Resolved to Correct Representatives

| District | Research Listed | Actual Representative | Party | Note |
|----------|----------------|----------------------|-------|------|
| D32 | "Walter Runte" | Steven Foster | Republican | SFOSTER.jpg image at D32; email `Steven.Foster@legislature.maine.gov`; city: Dexter |
| D34 | "Eleanor Sato" | Abigail Griffin | Republican | GRIFFIN.jpg image at D34; email `Abigail.Griffin@legislature.maine.gov`; city: Levant |
| D58 | "Michael Soboleski" | Sharon Frost | Unenrolled | Frost-2024.jpg image at D58; email `Sharon.Frost@legislature.maine.gov`; city: Belgrade |
| D73 | "Michael Soboleski" | Michael Soboleski | Republican | CONFIRMED correct — MSOBOLESKI.jpg at D73 only |
| D109 | "Eleanor Sato" | Eleanor Sato | Democrat | CONFIRMED correct — Sato-2024.jpg at D109 only |
| D143 | "Tiffany Roberts" | Ann Fredericks | Republican | FredericksA-2025.jpg at D143; email `Ann.Fredericks@legislature.maine.gov`; city: Sanford |
| D146 | "Walter Runte" | Walter Runte | Democrat | CONFIRMED correct — RUNTE.jpg at D146 only |
| D149 | "Tiffany Roberts" | Tiffany Roberts | Democrat | CONFIRMED correct — Roberts.jpg at D149 only |

### C. Vacancy Status Confirmations

| District | Research | Verified Status | Evidence |
|----------|----------|----------------|---------|
| D29 | VACANT (Kathy Javner deceased) | Still vacant — confirmed | Javner.jpg shows "Deceased" badge; no new member listed at D29; no special election |
| D94 | VACANT (Kristen Cloutier resigned) | **NO LONGER VACANT** | Scott Harriman (Democrat) won special election 2026; seated; profile at `/house/MemberProfiles/Details/3141`; city: Lewiston |

**D94 Correction Summary:** The research roster (2026-05-19) listed D94 as VACANT. The live member directory showed KCLOUTIER.jpg still in alphabetical list but also showed `Harriman-S-2026.jpg` at district 94. Scott Harriman (D, Lewiston) is the current incumbent. The migration seeds Harriman as a named rep with external_id=-232094, not a vacant block. This reduces vacant count from 2 → 1.

### D. Edge Case Spot-Checks

| Name | District | Verdict |
|------|----------|---------|
| Billy Bob Faulkingham | D12 | CONFIRMED: `data-order="Faulkingham, Billy Bob"` — first_name='Billy Bob', last_name='Faulkingham' (House Minority Leader) |

## First-Run psql Output

```
BEGIN
INSERT 0 1  (× 151 — 150 named-rep CTE blocks + 1 VACANT block)
UPDATE 150  (office_id back-fill for all 150 named reps)
COMMIT
```

## Idempotency Re-Run Output

```
BEGIN
INSERT 0 0  (× 151)
UPDATE 0
COMMIT
```

## Verification Query Results (12/12 passed)

**Query 1** — Named-rep politician count:
```sql
SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -232151 AND -232001;
-- Result: 150 (correct: 151 districts - 1 vacancy D29 = 150 named reps)
```

**Query 2** — Total ME House offices:
```sql
SELECT COUNT(*) FROM essentials.offices o JOIN essentials.chambers ch ON ch.id = o.chamber_id
WHERE ch.name = 'Maine House of Representatives';
-- Result: 151 (PASS)
```

**Query 3** — Named vs vacant offices:
```sql
SELECT COUNT(*) FILTER (WHERE o.politician_id IS NOT NULL) AS named,
       COUNT(*) FILTER (WHERE o.politician_id IS NULL) AS vacant
FROM essentials.offices o JOIN essentials.chambers ch ON ch.id = o.chamber_id
WHERE ch.name = 'Maine House of Representatives';
-- Result: named=150, vacant=1 (PASS)
```

**Query 4** — Named reps with office_id NULL:
```sql
SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -232151 AND -232001 AND office_id IS NULL;
-- Result: 0 (PASS)
```

**Query 5** — Offices linked to STATE_LOWER state='me':
```sql
SELECT COUNT(*) FROM essentials.offices o JOIN essentials.chambers ch ON ch.id = o.chamber_id
JOIN essentials.districts d ON d.id = o.district_id
WHERE ch.name = 'Maine House of Representatives' AND d.district_type = 'STATE_LOWER' AND d.state = 'me';
-- Result: 151 (PASS)
```

**Query 6** — Distinct office title:
```
title
--------------
Representative
(1 row, PASS)
```

**Query 7** — Distinct representing_state:
```
representing_state
--------------------
ME
(1 row, PASS)
```

**Query 8** — D29 and D94 vacancy status:
```
geo_id | label                   | is_vacant | no_politician
23029  | State House District 29 | t         | t             (PASS: vacant)
23094  | State House District 94 | f         | f             (PASS: Harriman seated)
```

**Query 9** — Spot-check 5 named reps:
```
external_id | full_name             | party      | title          | geo_id | label
-232001     | Lucien Daigle         | Republican | Representative | 23001  | State House District 1
-232012     | Billy Bob Faulkingham | Republican | Representative | 23012  | State House District 12
-232095     | Mana Abdi             | Democrat   | Representative | 23095  | State House District 95
-232132     | Ryan Fecteau          | Democrat   | Representative | 23132  | State House District 132
-232151     | Kristi Mathieson      | Democrat   | Representative | 23151  | State House District 151
(5 rows, PASS — all external_id↔geo_id patterns correct)
```

**Query 10** — Orphan offices:
```
orphan_offices
--------------
0 (PASS)
```

**Query 11** — STATE_UPPER cross-contamination:
```
state_upper_contamination
-------------------------
0 (PASS)
```

**Query 12** — Idempotency (re-run): all INSERT 0 0, UPDATE 0 (PASS)

**Final combined verification:**
```
named_offices | vacant_offices | total_offices
150           | 1              | 151 (PASS)

me_chambers | me_house_districts
6           | 151 (both unchanged from Phase 50/49, PASS)
```

## The 150 Named Rep Tuples (for Plan 52-03 headshots)

| politician_id | full_name | external_id | district_geo_id |
|---------------|-----------|-------------|-----------------|
| 3a5abb5e-e742-4d99-94e9-5330c32f7cf4 | Lucien Daigle | -232001 | 23001 |
| a3ea95d3-cc5c-4867-a6b3-6004d5bd437a | Roger Albert | -232002 | 23002 |
| 6c9d5b66-c843-4170-ae7b-f516832b2312 | Mark Babin | -232003 | 23003 |
| 176c355c-b056-4131-8767-6805592af0d0 | Timothy Guerrette | -232004 | 23004 |
| c25255ea-8e03-4f8b-ab14-3c67d2a04e12 | Joseph Underwood | -232005 | 23005 |
| c31211fb-24d8-4698-b2f1-e6a26b562b35 | Donald Ardell | -232006 | 23006 |
| 4fdd39c4-23ea-408a-9dd8-6b931cc6d761 | Gregory Swallow | -232007 | 23007 |
| 7560948b-f1f1-422c-be0c-f92865c100f9 | Tracy Quint | -232008 | 23008 |
| 825c6de9-e46d-44ec-9093-fea10f93f60f | Arthur Mingo | -232009 | 23009 |
| e6155a4a-4fcf-4195-85c1-509f5d4c016d | William Tuell | -232010 | 23010 |
| 8eaadc47-e2ed-475e-bf29-6235039b4a60 | Tiffany Strout | -232011 | 23011 |
| 993299cd-a7b5-4246-a8f2-57e6eb7df1b9 | Billy Bob Faulkingham | -232012 | 23012 |
| 6ca03396-08d7-43ff-a101-f5a1aec11e3e | Russell White | -232013 | 23013 |
| 047962c6-216a-4ff6-b63e-04c900fb8af9 | Gary Friedmann | -232014 | 23014 |
| 1f171f1f-14e4-47ef-b715-0d676e815568 | Holly Eaton | -232015 | 23015 |
| 1037ec72-4bfe-4d5c-87b8-4eb2fa7d998b | Nina Milliken | -232016 | 23016 |
| a5c70691-3834-48f8-aeca-79b95c131884 | Steven Bishop | -232017 | 23017 |
| 084e79da-0515-491e-99cd-a663d1f85819 | Mathew McIntyre | -232018 | 23018 |
| 1f6fb9ae-a29b-4174-baf3-1116371c4955 | Richard Campbell | -232019 | 23019 |
| 59df0b0d-f559-4e37-8f3a-1f8ae5b09485 | Dani O'Halloran | -232020 | 23020 |
| c9d094fe-1054-4804-bd24-f2cd6ceb748d | Ambureen Rana | -232021 | 23021 |
| e6bd2fa6-6e8c-46e2-b13d-59f340a1a38f | Laura Supica | -232022 | 23022 |
| 74eb8c85-b789-4767-bdd1-206009b7cd11 | Amy Roeder | -232023 | 23023 |
| 9c446f79-a394-4d25-85a6-31304ae1ec58 | Sean Faircloth | -232024 | 23024 |
| dc70f61b-e541-4947-b09a-af8f983929a9 | Laurie Osher | -232025 | 23025 |
| c0b96558-d6b2-4029-b680-40c5cc815688 | James Dill | -232026 | 23026 |
| 8e7b29b6-7396-4e29-bdd8-4fe19c646d8e | Gary Drinkwater | -232027 | 23027 |
| 4d943425-994b-4761-a3a8-b77f69f6b4bf | Irene Gifford | -232028 | 23028 |
| cfa073a3-70af-4552-ae30-7c3236137cf0 | James White | -232030 | 23030 |
| 84f4f54e-6b77-4094-b6bd-d2304b919160 | Chad Perkins | -232031 | 23031 |
| 40e26806-48fe-492c-ac87-0be7715cc4b0 | Steven Foster | -232032 | 23032 |
| 2c454f77-c706-491c-87d5-0796b59371d4 | Kenneth Fredette | -232033 | 23033 |
| cf411069-e6d4-462f-86e9-ddea6b3de194 | Abigail Griffin | -232034 | 23034 |
| ecb8eddd-c6e2-4e90-a239-d98f4d7e0542 | James Thorne | -232035 | 23035 |
| 1c64f6b9-cd4e-4482-9208-4d8fa74ad9e2 | Kimberly Haggan | -232036 | 23036 |
| cce50333-2b4e-48f0-987c-7d1b579ee691 | Reagan Paul | -232037 | 23037 |
| ee45697c-6dc7-4789-bfe0-c97a34835e6e | Benjamin Hymes | -232038 | 23038 |
| 95c63dde-ea43-4ef5-9691-a61ed7233b30 | Janice Dodge | -232039 | 23039 |
| bf3d8a5d-f5a6-4bfa-b144-513898d12ed5 | D. Michael Ray | -232040 | 23040 |
| e7f224d2-659a-41fd-887c-e2c714956bf8 | Victoria Doudera | -232041 | 23041 |
| 73f801b5-b71b-4f01-9043-9dc2638049ff | Valli Geiger | -232042 | 23042 |
| 0bd82de2-6f06-4775-a716-cfa6568671ef | Ann Matlack | -232043 | 23043 |
| a80b01d7-0c4c-49c0-9914-fd296b4fb134 | William Pluecker | -232044 | 23044 |
| 4bbdb54e-664a-437e-9c2d-2c6939bf44c5 | Abden Simmons | -232045 | 23045 |
| b3737c12-af18-4419-b2f1-27ab6a599457 | Lydia Crafts | -232046 | 23046 |
| 2d5859a0-18ba-42d2-b272-fb9acd9890a1 | Wayne Farrin | -232047 | 23047 |
| 78c8864e-8ba1-40bf-b6ce-9f4b5b6df8c1 | Holly Stover | -232048 | 23048 |
| ba4f0f86-7159-4097-a6a6-ad45fbcf003c | Allison Hepler | -232049 | 23049 |
| 0316ee2f-fe0c-4122-a95a-2f43f55ce260 | David Sinclair | -232050 | 23050 |
| c08c1cf6-c505-4490-a1a3-be7945b8f2f2 | Rafael Macias | -232051 | 23051 |
| 8b288fec-b935-40b3-a7b1-ecb65d184b51 | Sally Cluchey | -232052 | 23052 |
| 8b1dca67-2cfa-456f-81b0-27cab1690388 | Michael Lemelin | -232053 | 23053 |
| 54600569-46e8-4830-88c1-c86cabed4488 | Karen Montell | -232054 | 23054 |
| 39fda5ab-f9fc-4e4c-a02a-1a86b55f4d32 | Daniel Shagoury | -232055 | 23055 |
| 85a1ae07-3743-4192-b516-b04f6035440a | Randall Greenwood | -232056 | 23056 |
| 0c1b5005-e1e5-4ba1-9e85-ce858371cd6e | Tavis Hasenfus | -232057 | 23057 |
| 7e3b308c-05e2-4109-91c0-cae55bba4534 | Sharon Frost | -232058 | 23058 |
| 5abdd7d2-32f2-455d-bfbb-95a75b0c7d3e | David Rollins | -232059 | 23059 |
| 6ad1021e-5f98-4215-a879-a9b76a57b9e3 | William Bridgeo | -232060 | 23060 |
| ac47488f-8044-4f39-a33e-0e3ff1c450fb | Alicia Collins | -232061 | 23061 |
| 05b465cb-f538-4a17-bb47-a12e4409b62b | Katrina Smith | -232062 | 23062 |
| a793b036-460a-4752-961f-53d460f8130a | Paul Flynn | -232063 | 23063 |
| 21f45688-4e19-42bb-b1c0-e17b5dba2d3a | Flavia DeBrito | -232064 | 23064 |
| ad28f54e-0639-4005-ade9-3be3b90c3d39 | Cassie Julia | -232065 | 23065 |
| 7a0017bb-cd74-43bb-9719-842aaa1bd383 | Robert Nutting | -232066 | 23066 |
| 60bf7e1e-583d-4838-a455-e39765db03e2 | Shelley Rudnicki | -232067 | 23067 |
| ee2ff8c8-d9b6-46a3-a13e-d97b9fdc8cab | Amanda Collamore | -232068 | 23068 |
| fe465340-16b2-43c4-8d0a-d748b201f3d5 | Dean Cray | -232069 | 23069 |
| f4c74fad-1aa0-46d3-98ea-f377f4e639ba | Jennifer Poirier | -232070 | 23070 |
| dc6a829a-5501-4f63-9d34-fa5210b80fc2 | John Ducharme | -232071 | 23071 |
| 80747346-be87-4d1b-9bf6-9ee80356ba7f | Elizabeth Caruso | -232072 | 23072 |
| 78c675a3-137e-4d9c-bf85-38bdf7f45c51 | Michael Soboleski | -232073 | 23073 |
| e8cbe890-b3ac-44b9-baf3-d4d988b7c1cc | Randall Hall | -232074 | 23074 |
| 022405cb-cab1-4ccb-867b-c5b5c56313da | Stephan Bunker | -232075 | 23075 |
| 7a9ebcbf-d2fa-4ca0-a133-178fb0d6fce1 | Sheila Lyman | -232076 | 23076 |
| b08821e4-7a92-498c-97f2-13138777e8ae | Tammy Schmersal-Burgess | -232077 | 23077 |
| a37ec3f9-faa6-4c06-8856-92fa618a28ad | Rachel Henderson | -232078 | 23078 |
| 6f9a255b-0f39-4907-8b96-682a59b91f39 | Michael Lance | -232079 | 23079 |
| 92bb2ff8-0967-41c3-a68a-efc7a072ead1 | Caldwell Jackson | -232080 | 23080 |
| c6b1a2ed-c20a-44ef-b9b0-58de24c5f837 | Peter Wood | -232081 | 23081 |
| 7e248174-dd02-4fc2-8995-943206641385 | Nathan Wadsworth | -232082 | 23082 |
| 26fa2e76-137e-4ace-b40a-fc49105c2a05 | Marygrace Cimino | -232083 | 23083 |
| 96e540d3-cf64-412e-8a09-bf28f6689d15 | Mark Walker | -232084 | 23084 |
| 496cc607-2296-4a7c-b2a0-0d56210805fd | Kimberly Pomerleau | -232085 | 23085 |
| 775d8ed7-0f01-43e0-b7c3-cd7b7f80f9c2 | Rolf Olsen | -232086 | 23086 |
| 14f6c68b-af34-495e-9179-9c767dd9f222 | David Boyer | -232087 | 23087 |
| 233ca29f-b25c-4191-8cf4-3f529fb933e9 | Quentin Chapman | -232088 | 23088 |
| 5200d94b-cca2-4927-89bf-48c2c4f527fd | Adam Lee | -232089 | 23089 |
| c1b625df-6943-49e8-a0a7-c603c4718ac1 | Laurel Libby | -232090 | 23090 |
| 98ea2b14-dfe7-4a4c-a755-a124a77a24eb | Joshua Morris | -232091 | 23091 |
| 2640d53c-bcdc-4335-a4a8-04442babe033 | Stephen Wood | -232092 | 23092 |
| 0e4492df-b9b8-429c-8a1e-1ab909042d7d | Julia McCabe | -232093 | 23093 |
| 9664affa-96b6-461f-976e-6cdf077cbf11 | Scott Harriman | -232094 | 23094 |
| 04a1f435-1a5c-42db-9efd-410e65652f40 | Mana Abdi | -232095 | 23095 |
| 1e8bac4b-6d4d-4425-8628-bdfdddf46058 | Michel Lajoie | -232096 | 23096 |
| b43d9033-090f-4fea-9000-7f7360dbd0e6 | Richard Mason | -232097 | 23097 |
| 8b0fe853-b289-40ad-95ba-dc1ea25e1c34 | Kilton Webb | -232098 | 23098 |
| d2c740be-74fc-4ab6-bca7-af9d6e7c7463 | Cheryl Golek | -232099 | 23099 |
| fb5600ed-e81a-4e9d-b3e2-9d57237349ad | Daniel Ankeles | -232100 | 23100 |
| a82316c1-dc9f-4ed7-9f3c-3866ed4ebe6f | Poppy Arford | -232101 | 23101 |
| 9f8eebbe-19e1-4986-9f5f-563887a94462 | Melanie Sachs | -232102 | 23102 |
| 1453d66e-9374-402b-8230-b89e0b5a3c49 | Arthur Bell | -232103 | 23103 |
| d886838f-6e64-43d7-ab84-5a8f300055df | Amy Arata | -232104 | 23104 |
| 0593d23d-88b2-4aa8-81e4-f974a7d9c793 | Anne Graham | -232105 | 23105 |
| d2828ca3-78e1-4885-a93e-af3a1976215b | Barbara Bagshaw | -232106 | 23106 |
| 307081dc-33cc-4bd2-9343-06fa90d29f03 | Mark Cooper | -232107 | 23107 |
| 0cf86dbe-b7be-4cf1-977b-97a98fc60fa9 | Parnell Terry | -232108 | 23108 |
| 34a3fabb-809d-4d11-866d-d270b4922f7e | Eleanor Sato | -232109 | 23109 |
| 1507e55f-fdce-4c66-8629-327444850fe7 | Christina Mitchell | -232110 | 23110 |
| 403fb454-25fd-4c9f-9657-975715511b57 | Amy Kuhn | -232111 | 23111 |
| 1e4353eb-d05f-4b84-994e-32e1f43295fa | W. Edward Crockett | -232112 | 23112 |
| 6794d63a-05d5-4bcc-99fc-f4f860529d16 | Grayson Lookner | -232113 | 23113 |
| 6f39ef78-1967-4a41-bc6f-f2ed372f10c3 | Dylan Pugh | -232114 | 23114 |
| fbc9df01-ec6f-4e8c-b1fe-884425a34047 | Michael Brennan | -232115 | 23115 |
| 8d45a199-5054-417f-b9a9-3874e113c5f4 | Samuel Zager | -232116 | 23116 |
| 0705d7cf-7e28-4543-9852-298bcafe4e66 | Matt Moonen | -232117 | 23117 |
| 8a68b1f1-52d6-442d-ba75-77885f30de58 | Yusuf Yusuf | -232118 | 23118 |
| d7ad5924-0e8a-4d11-93e3-56e1db5dd019 | Charles Skold | -232119 | 23119 |
| 2e737f21-8570-4ad2-8d68-9b0678ac2c3f | Deqa Dhalac | -232120 | 23120 |
| bb7a224e-a0af-4bd8-a2a9-d70c35e1eefc | Christopher Kessler | -232121 | 23121 |
| 6e1fd819-cbf6-4f93-9917-220ad3294902 | Matthew Beck | -232122 | 23122 |
| d3f89474-72f0-4a7a-a803-c32a865cec3a | Michelle Boyer | -232123 | 23123 |
| 24e1ccb6-7ac1-4d98-a35f-d73c347dd906 | Sophia Warren | -232124 | 23124 |
| 5d1feb93-3532-4e63-a175-5502fbcddae1 | Kelly Murphy | -232125 | 23125 |
| f7303b7d-0e06-4037-b9a4-9c7d12f37d6e | Drew Gattine | -232126 | 23126 |
| 835e9c91-f373-4c9d-af75-6a5dd68539ec | Morgan Rielly | -232127 | 23127 |
| d921e2be-d1e4-456a-915c-a4b3780dd633 | Suzanne Salisbury | -232128 | 23128 |
| 453e9798-bbe1-45f3-9898-4cd13d91fc61 | Marshall Archer | -232129 | 23129 |
| a44d3934-0db6-4fe4-9ba1-316098279e38 | Lynn Copeland | -232130 | 23130 |
| 185b5de5-50a4-4a5b-9cef-f64f0ab1cb4c | Lori Gramlich | -232131 | 23131 |
| 5b45bee6-4cdd-4800-83db-66e4e5b74c1d | Ryan Fecteau | -232132 | 23132 |
| 6465949e-7832-40cb-962f-839ebecf32ce | Marc Malon | -232133 | 23133 |
| 6793f0eb-ddaa-4c72-ac99-70876295279a | Traci Gere | -232134 | 23134 |
| 18b11787-c861-4996-aba5-3b863ea33b1d | Daniel Sayre | -232135 | 23135 |
| 289e568d-a9e5-4e9d-9626-3b11891cd12b | John Eder | -232136 | 23136 |
| ebd1c39c-73cc-4346-a7f3-55a4274045a3 | Nathan Carlow | -232137 | 23137 |
| c0a1a251-feb5-4ec7-bbbf-7cf7d3da31a6 | Mark Blier | -232138 | 23138 |
| bc4404a1-c75b-437e-a084-f261ebe82838 | David Woodsome | -232139 | 23139 |
| 6a008bbb-a2dd-4128-87cf-f2fe0278738b | Wayne Parry | -232140 | 23140 |
| 2b061c70-8654-4725-98cd-373a13badf86 | Lucas Lanigan | -232141 | 23141 |
| ec48f5a7-1efd-4942-8e13-65584102df0d | Anne-Marie Mastraccio | -232142 | 23142 |
| 65ce1f05-e156-4f5a-9e21-4241cc958c19 | Ann Fredericks | -232143 | 23143 |
| 7d67c63d-e895-4f2e-96f9-67939e065f01 | Jeffrey Adams | -232144 | 23144 |
| 4025a524-5e29-4c04-9026-009ba23878e5 | Robert Foley | -232145 | 23145 |
| a54704f7-023d-4351-80b5-9cfb397dfcf6 | Walter Runte | -232146 | 23146 |
| 0199d6a7-271e-40b1-aad0-2cf262c7046b | Holly Sargent | -232147 | 23147 |
| b13ec962-0772-4fdd-8399-59c3bc7fa19a | Thomas Lavigne | -232148 | 23148 |
| 0bbbb18d-1f67-4bd1-89d6-505a175d063c | Tiffany Roberts | -232149 | 23149 |
| ee8f52bc-ad53-4abf-b136-3898ead3e41b | Michele Meyer | -232150 | 23150 |
| 7ebe7923-3a6a-464e-9646-4e688459f614 | Kristi Mathieson | -232151 | 23151 |

## Vacant Office Tuple (for Plan 52-03 reference — no headshot needed)

| office_id | district_geo_id | label |
|-----------|----------------|-------|
| ddb05295-68a1-4247-8b69-476269e13840 | 23029 | State House District 29 |

## Tribal Representatives — Confirmed Not Seeded

Aaron Dana and Brian Reynolds are Tribal Representatives to the Maine House. They represent tribal governments (Penobscot Nation, Maliseet Nation respectively), not geographic STATE_LOWER districts. The DB has no STATE_LOWER district geofence for tribal seats. Decision: omit from migration. They appear only in the SQL comment header: `-- Tribal representatives (Aaron Dana, Brian Reynolds) NOT seeded -- no STATE_LOWER district geofence.`

## Decisions Made

1. **D94 Scott Harriman seeded as named rep (not vacant):** The research roster listed D94 as VACANT (Cloutier resigned). Live site verification on 2026-05-19 confirmed Scott Harriman (Democrat, Lewiston) won a special election in 2026 and is currently seated. The research note said "no special election as of 2026-05-19" but the live member list clearly showed Harriman at D94. Migration correctly seeds Harriman as external_id=-232094.

2. **Total counts adjusted from plan spec:** The plan spec said "149 named reps + 2 vacant offices." With Harriman filling D94, the actual result is 150 named reps + 1 vacant office (D29 only). All verification queries pass against these corrected counts.

3. **D40 first_name='D. Michael', D112 first_name='W. Edward':** The legislature uses abbreviated display names for these members. The profile page HTML confirms `D. Michael Ray` and `W. Edward Crockett` as the full names. Using initial+middle as first_name preserves the official format.

4. **Sharon Frost (D58) is Unenrolled, not Republican:** The research WebFetch artifact listed Soboleski at D58 (Republican). The actual D58 rep is Sharon Frost, who is Unenrolled party (badge `text-bg-secondary`, `U`). Seeded correctly.

## Deviations from Plan

The plan specified 149 named reps + 2 vacant offices. After live verification:
- D94 is NO LONGER vacant — Scott Harriman won special election
- Final counts: 150 named reps + 1 vacant office (D29 only)

Additionally, 7 roster corrections were required (6 duplicate-name resolutions + 2 abbreviated-name expansions) as documented in the Roster Corrections section above.

All corrections were auto-applied per plan instructions (Task 1 Step 1 explicitly directed verification of these issues).

## Issues Encountered

- Em dash character (`—`) in the D29 vacant reason string caused encoding artifacts in PowerShell heredoc output. Fixed by replacing with comma+space before re-running the generator.

## Next Phase Readiness

- Plan 52-03 (headshots) is fully unblocked: all 150 politician UUIDs, full_names, and district geo_ids are in the 150-row tuple table above
- D29 office UUID for vacant seat is documented above
- House headshots available from `/house/Repository/MemberProfiles/{uuid}_{Name}-{year}.jpg` — requires visiting individual profile pages per the find-headshots skill workflow
- Photo license: `public_domain` (government official portraits)

---
*Phase: 52-me-state-legislature*
*Completed: 2026-05-19*
