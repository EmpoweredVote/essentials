# Phase 89: IN + ME School Board Completion — Research

**Researched:** 2026-06-03
**Domain:** Indiana school board correction (IPS + MCCSC routing) + Maine TIGER UNSD G5420 + 5 ME school board seeds
**Confidence:** HIGH (GEOID corrections critical — see below)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| IN-SCHOOL-01 | IPS D3 + D6 government bodies added; officials seeded for all 7 IPS seats (D1-D6 + At Large) | Critical correction: IPS has 5 districts + 2 At-Large (no D6); D3 = Hope Duke Star; D2 updated to Hasaan Rashid; GEOID = 1804770 |
| IN-SCHOOL-02 | Monroe County Community School Corporation board officials seeded for all 7 districts | MCCSC GEOID = 1800630 (not 1809480); D7 changed to Aja Jester; routing not yet wired |
| ME-SCHOOL-01 | Lewiston school board seeded (geofence + officials) | GEOID 2307320; 8-member ward-based committee; Ward 5 vacant/appointed |
| ME-SCHOOL-02 | Bangor school board seeded (geofence + officials) | GEOID 2302820; 7-member at-large committee; full roster identified |
| ME-SCHOOL-03 | South Portland, Auburn, and Biddeford school boards seeded (geofences + officials) | GEOIDs 2312330/2302610/2303150; all 3 boards identified |
</phase_requirements>

---

## Summary

Phase 89 is a corrective + expansion seeding phase. It has three distinct workstreams:

**Workstream 1 — IN correction (IPS):** The DB has IPS seeded with 5 geographic districts (D1-D5) + 2 at-large, but D3 and D2 are wrong/missing. The key DB correction is: add Hope Duke Star (D3, currently missing), update D2 from Gayle Cosby (resigned March 2026) to Hasaan Rashid (appointed April 2026), and wire routing by adding districts rows for IPS and MCCSC using their correct GEOIDs. CRITICAL: the known DB state was wrong about "D6" — IPS has NO District 6. The correct structure is D1–D5 + 2 At-Large.

**Workstream 2 — IN correction (MCCSC):** MCCSC is fully seeded (7 members) but missing districts rows. D7 member has changed from Brandon Shurr to Aja Jester. GEOID correction is critical: the guessed GEOID 1809480 in the known DB state is WRONG — that NCES LEAID belongs to Richland Bean Borden Community School Corporation (Ellettsville, IN). The correct MCCSC TIGER GEOID is 1800630.

**Workstream 3 — ME school boards (new):** Maine has zero G5420 geofences and zero school board seeds. This requires: (1) new `load-me-school-boundaries.ts` downloading `tl_2024_23_unsd.zip` and filtering to 5 GEOIDs, and (2) a migration seeding 5 government bodies + boards + officials for Lewiston, Bangor, South Portland, Auburn, and Biddeford.

**Primary recommendation:** Split into 3 plans. Plan 1 (IN fixes): loader for MCCSC+IPS geofences (tl_2024_18_unsd.zip) + migration 264 (IPS D3 add + D2 update + MCCSC D7 update + districts rows for both). Plan 2 (ME geofences + seed): loader for ME (tl_2024_23_unsd.zip) + migration 265 (5 ME governments + chambers + districts + officials). Plan 3 (headshots audit): migration 266 (audit-only for all new officials across both states).

---

## CRITICAL GEOID CORRECTIONS

### IPS GEOID
- **Known DB state said:** GEOID "likely 1800630" — WRONG
- **Correct IPS TIGER GEOID:** `1804770`
- Source: NCES CCD (nces.ed.gov/ccd/districtsearch/district_detail.asp?ID2=1804770), Census Reporter (censusreporter.org profiles 97000US1804770), publicschoolreview.com all confirm NCES LEAID = 1804770 for Indianapolis Public Schools. TIGER GEOID = NCES LEAID for school districts. [VERIFIED: NCES CCD search + multiple cross-references]

### IPS Board Structure
- **Known DB state said:** "Missing District 3 and District 6 chambers + officials" — PARTIALLY WRONG
- **Correct IPS structure:** 5 geographic districts (D1–D5) + 2 At-Large seats = 7 commissioners total. **There is NO District 6.**
- Source: myips.org/district-school-board/school-board/ (verified 2026-06-03)
- **What is actually missing from DB:**
  - D3 seat: Hope Duke Star (missing entirely — not in DB)
  - D2 seat: DB has Gayle Cosby (resigned March 2026); Hasaan Rashid appointed April 2026 — needs UPDATE
  - districts rows for IPS: none exist (routing broken)

### MCCSC GEOID
- **Known DB state said:** GEOID "likely 1809480 (source: moco_gis_arcgis_2024)" — WRONG
- **Correct MCCSC TIGER GEOID:** `1800630`
- Source: data.census.gov profile URL `g=9700000US1800630` confirms MCCSC maps to GEOID 1800630. NCES LEAID 1800630 = Monroe County Community School Corporation. GEOID 1809480 = Richland Bean Borden Community School Corporation (completely different district in Ellettsville, IN). [VERIFIED: data.census.gov + NCES CCD]

### MCCSC D7 Member Change
- **Known DB state said:** D7 = Brandon Shurr
- **Correct D7 member:** Aja Jester (confirmed from MCCSC news, 2026)
- Source: mccsc.edu board news 2026 (search confirmed) [VERIFIED: MCCSC official news 2026-06-03]

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| IN UNSD geofence loading (IPS + MCCSC) | Backend script (Node.js) | — | TIGER shapefile; same pattern as load-or/load-tx |
| ME UNSD geofence loading (5 districts) | Backend script (Node.js) | — | New load-me-school-boundaries.ts, tl_2024_23_unsd.zip |
| IPS D3 add + D2 update | SQL migration | — | INSERT new D3 official; UPDATE D2 politician |
| MCCSC D7 update + districts rows | SQL migration | — | UPDATE D7 politician; INSERT districts rows |
| ME government body + officials seed | SQL migration | — | 5 governments + chambers + districts + officials |
| Routing to school board members | API / Backend (essentialsService.ts) | DB (districts) | No code changes needed; district_type='SCHOOL' routing is live |
| Headshot processing + upload | Script (Python PIL) | Supabase Storage | All new officials; 600x750 JPEG |

---

## Standard Stack

### Core (all pre-established from Phases 86-88)

| Component | Version/Location | Purpose | Notes |
|-----------|-----------------|---------|-------|
| `load-me-school-boundaries.ts` | New (C:/EV-Accounts/backend/scripts/) | Download + filter tl_2024_23_unsd.zip | Copy from load-tx-school-boundaries.ts; change FIPS 48→23, 5 TX GEOIDs→5 ME GEOIDs |
| `load-in-school-boundaries.ts` | New (C:/EV-Accounts/backend/scripts/) | Download + filter tl_2024_18_unsd.zip | IPS (1804770) + MCCSC (1800630); 2 GEOIDs |
| migration 264 | New SQL | IN routing fix: IPS D3 add + D2 update + MCCSC D7 update + districts rows | Corrective migration for existing IN school seeds |
| migration 265 | New SQL | ME school board seed: 5 governments + chambers + districts + officials | New greenfield seed |
| migration 266 | New SQL (audit-only) | Headshots documentation for all Phase 89 officials | Follow migrations 255/258/262 pattern |
| `shapefile` npm | pre-installed | Parse TIGER .dbf/.shp | Already in package.json |
| `adm-zip` npm | pre-installed | Extract TIGER zip | Already in package.json |

### Supporting

| Component | Purpose | When to Use |
|-----------|---------|-------------|
| `smoke-phase89-in.ts` | Verify IPS and MCCSC routing | After migration 264 applied |
| `smoke-phase89-me.ts` | Verify ME 5 districts routing | After migration 265 applied |
| `_tmp-in-me-school-headshots.py` | Headshot processing | After both migrations applied |

---

## TIGER File Verification

### Indiana TIGER UNSD
- **Filename:** `tl_2024_18_unsd.zip`
- **URL:** `https://www2.census.gov/geo/tiger/TIGER2024/UNSD/tl_2024_18_unsd.zip`
- **File size:** 2.3 MB (confirmed from census.gov directory listing 2026-06-03)
- **Last modified:** 2025-06-27
- [VERIFIED: https://www2.census.gov/geo/tiger/TIGER2024/UNSD/]

**Target GEOIDs:**
| District | GEOID | Verified Name |
|----------|-------|---------------|
| Indianapolis Public Schools | `1804770` | Indianapolis Public Schools |
| Monroe County Community School Corporation | `1800630` | Monroe County Community School Corporation |

**EXPECTED_COUNT = 2**

### Maine TIGER UNSD
- **Filename:** `tl_2024_23_unsd.zip`
- **URL:** `https://www2.census.gov/geo/tiger/TIGER2024/UNSD/tl_2024_23_unsd.zip`
- **File size:** 2.6 MB (confirmed from census.gov directory listing 2026-06-03)
- **Last modified:** 2025-06-27
- [VERIFIED: https://www2.census.gov/geo/tiger/TIGER2024/UNSD/]

**Target GEOIDs (5 ME districts):**
| District | GEOID | NCES LEAID Source |
|----------|-------|-------------------|
| Lewiston Public Schools | `2307320` | nces.ed.gov ID2=2307320 [VERIFIED] |
| Bangor School Department | `2302820` | nces.ed.gov ID2=2302820 [VERIFIED] |
| South Portland Public Schools | `2312330` | nces.ed.gov ID2=2312330 [VERIFIED] |
| Auburn Public Schools | `2302610` | nces.ed.gov ID2=2302610 [VERIFIED] |
| Biddeford Public Schools | `2303150` | nces.ed.gov ID2=2303150 [VERIFIED] |

**EXPECTED_COUNT = 5**

**GEOID source note:** For school districts, TIGER GEOID = NCES LEAID. All 5 confirmed via NCES CCD district detail pages.

---

## Indiana Board Rosters

### Indianapolis Public Schools (IPS) — 7 members

**GEOID:** 1804770 | **Official site:** myips.org
**Structure:** 5 geographic districts (D1–D5) + 2 at-large = 7 commissioners
**Chamber name:** "Board of School Commissioners"

[VERIFIED: myips.org/district-school-board/school-board/ fetched 2026-06-03]

| Seat | Full Name | Officer Title | Term | DB Status |
|------|-----------|---------------|------|-----------|
| District 1 | Ashley Thomas | Commissioner | Jan 2025–Dec 2028 | In DB (correct) |
| District 2 | Hasaan Rashid | Commissioner | April 2026–Dec 2026 | **UPDATE NEEDED** (DB has Gayle Cosby) |
| District 3 | Hope Duke Star | President | Jan 2023–Dec 2026 | **MISSING — must INSERT** |
| District 4 | Allissa Impink | Secretary | Jan 2025–Dec 2028 | In DB (correct) |
| District 5 | Dr. Nicole Carey | Vice President | Jan 2023–Dec 2026 | In DB (correct) |
| At-Large | Angelia Moore | Commissioner | Jan 2023–Dec 2026 | In DB (correct) |
| At-Large | Deandra Thompson | Commissioner | Nov 2024–Dec 2028 | In DB (correct) |

**Migration 264 actions for IPS:**
1. INSERT new politician Hope Duke Star + office (D3)
2. UPDATE existing D2 politician: change full_name from 'Gayle Cosby' to 'Hasaan Rashid', first_name/last_name accordingly
3. INSERT districts row for IPS: `district_type='SCHOOL'`, `state='in'`, `geo_id='1804770'`, `mtfcc='G5420'`, `label='Indianapolis Public Schools'`
4. UPDATE all IPS offices to set district_id pointing to the new districts row
5. Back-fill office_id on new politician(s)

**Office title convention:** `'Board Member'` (IPS uses "Commissioner" but DB office title = 'Board Member' for consistency with pattern; OR: `'Commissioner'` — this is what IPS officially uses. Recommend `'Commissioner'` as it is the official IPS title, matching the LAUSD "LAUSD Board Member" pattern of using the official title.)

**Headshots:** IPS website uses placeholder/transparent images for all board members — NO photos available on myips.org. [VERIFIED: fetched 2026-06-03 — all `<img>` tags show transparent GIF placeholders.] Headshot source must be searched individually (Wikipedia, local news photos). This is documented in migration 266 as "No photo found on official IPS website."

### Monroe County Community School Corporation (MCCSC) — 7 members

**GEOID:** 1800630 | **Official site:** mccsc.edu
**Structure:** 7 geographic districts (D1–D7)
**Chamber name:** "Board of School Trustees"

[VERIFIED: mccsc.edu board roster search 2026-06-03]

| Seat | Full Name | Officer Title | DB Status |
|------|-----------|---------------|-----------|
| District 1 | Erin Wyatt | Trustee | In DB (correct) |
| District 2 | April Hennessey | Trustee | In DB (correct) |
| District 3 | Ashley Pirani | Secretary | In DB (correct) |
| District 4 | Tiana Williams Iruoje | Asst. Secretary | In DB (correct per name; confirm exact name form) |
| District 5 | Erin Cooperman | President | In DB (correct) |
| District 6 | Ross Grimes | Vice President | In DB (correct) |
| District 7 | Aja Jester | Trustee | **UPDATE NEEDED** (DB has Brandon Shurr) |

**Migration 264 actions for MCCSC:**
1. UPDATE D7 politician: change 'Brandon Shurr' → 'Aja Jester'
2. INSERT districts row: `district_type='SCHOOL'`, `state='in'`, `geo_id='1800630'`, `mtfcc='G5420'`, `label='Monroe County Community School Corporation'`
3. UPDATE all MCCSC offices to set district_id pointing to the new districts row

**Note on DB name for Tiana Williams Iruoje:** DB says "Tiana Williams Iruoje" per known DB state (which had "D4: Tiana Williams Iruoje"). MCCSC news 2026 confirms "Dr. Tiana Iruoje" but her full name is "Tiana Williams Iruoje." Confirm exact DB spelling before UPDATE.

**Headshots:** MCCSC website likely has board member photos (standard school district CMS pattern). [ASSUMED: check mccsc.edu/board at execution time]

---

## Maine Board Rosters

### Lewiston Public Schools — 8 members
**GEOID:** 2307320 | **Official site:** lewistonpublicschools.org
**Structure:** 7 ward seats (Wards 1–7) + 1 at-large = 8 members
**Chamber name:** "School Committee"
**NCES Source:** nces.ed.gov/ccd/districtsearch/district_detail.asp?ID2=2307320 [VERIFIED]

[MEDIUM: roster assembled from November 2025 election results + Sun Journal reporting]

| Seat | Full Name | Notes |
|------|-----------|-------|
| Ward 1 | Phoenix McLaughlin | Incumbent; not up 2025 |
| Ward 2 | Janet Beaudoin | Re-elected Nov 2025 |
| Ward 3 | Elizabeth Eames | Incumbent; not up 2025 |
| Ward 4 | Julia Harper | Won Nov 2025 |
| Ward 5 | VACANT / Appointee | Iman Osman won City Council, forfeited seat; replacement appointed by mayor (name not confirmed in research) |
| Ward 6 | Meghan Hird | Re-elected Nov 2025 |
| Ward 7 | Donna Gallant | Incumbent; not up 2025 |
| At-Large | Luke Jensen | Won Nov 2025 |

**Ward 5 status:** VACANT at the time of election results (Iman Osman forfeited School Committee seat upon winning City Council Ward 5). Mayor was to appoint a replacement. The appointee name was not confirmed in research. [LOW confidence — requires verification at implementation time from lewistonpublicschools.org/en-US/school-committee-bc9f3846/school-committee-members-ab24c81b]

**Office title convention:** `'School Committee Member (Ward N)'` for ward seats; `'School Committee Member (At-Large)'` for at-large seat.

**Headshots:** Lewiston uses Thrillshare/custom CMS. No direct photo URL pattern confirmed in research. Check lewistonpublicschools.org at implementation time. [ASSUMED: photos may exist]

### Bangor School Department — 7 members
**GEOID:** 2302820 | **Official site:** bangorschools.net
**Structure:** 7 members elected at-large, 3-year terms
**Chamber name:** "School Committee"
**NCES Source:** nces.ed.gov/ccd/districtsearch/district_detail.asp?ID2=2302820 [VERIFIED]
**Charter authority:** eCode360.com — "School Committee shall consist of seven members to be elected, at large, by popular vote." [VERIFIED]

[MEDIUM: roster assembled from meeting minutes + Nov 2025 election results + news coverage]

| Name | Officer Title | Notes |
|------|---------------|-------|
| Tim Surrette | Chair | New Chair after Nov 2025 |
| Katie Brydon | Vice Chair | |
| Mallory Cook | Member | Newly sworn Nov/Dec 2025; 3-year term |
| Ben Speed | Member | Newly sworn Nov/Dec 2025; 3-year term |
| Ben Sprague | Member | In Feb 2025 minutes |
| Shelly Okere | Member | In Feb 2025 minutes |
| Sara Luciano | Member | Chair in early 2025; may have been replaced by Surrette after election |

**Note on Sara Luciano:** Meeting minutes from Feb 2025 show Sara Luciano as Chair; after Nov 2025 election, Surrette became Chair. Luciano may still be a member (her term may not have expired in Nov 2025) or she may be the 7th member. [ASSUMED — confirm on bangorschools.net/page/school-committee at implementation time]

**Office title convention:** `'School Committee Member'` (at-large, no district qualifier)

**Headshots:** bangorschools.net uses Thrillshare CMS. Board photo availability unknown. [ASSUMED: check at implementation time]

### South Portland Public Schools — 7 members
**GEOID:** 2312330 | **Official site:** spsd.org / spsdme.org
**Structure:** 7 members — mix of numbered districts + at-large seats. Districts confirmed: D1, D2, D4, D5 identified; D3 and At-Large also exist.
**Chamber name:** "Board of Education"
**NCES Source:** nces.ed.gov/ccd/districtsearch/district_detail.asp?ID2=2312330 [VERIFIED]

[MEDIUM: assembled from multiple 2025-2026 news sources; District 3 held by board Chair]

| Seat | Full Name | Notes |
|------|-----------|-------|
| District 1 | Susan Rauscher | [ASSUMED: from search summary] |
| District 2 | Tyler Smith | New Vice Chair April 2026; elected Nov 2025 |
| District 3 | Rosemarie De Angelis | Chair (as of Dec 2025) |
| District 4 | George Risch | New member; won Nov 2025 special election |
| District 5 | VACANT | Adrian Dowling (Vice Chair) resigned April 2026 |
| At-Large | Jennifer Ryan | [ASSUMED: from search summary] |
| At-Large (or 7th) | Eleni Richardson | Won Nov 2025 special election; relatively new |

**CRITICAL:** This roster has multiple [ASSUMED] entries and a current vacancy (District 5 after Dowling resigned April 2026). **Implementer must verify the full current roster from spsd.org/board/members-of-the-board or spsdme.org before writing migration SQL.** The D5 seat may have been filled by appointment post-April 2026.

**Office title convention:** `'Board Member (District N)'` for district seats; `'Board Member'` for at-large seats.

**Headshots:** spsd.org uses JavaScript-heavy CMS; WebFetch returns 404. Check at implementation time. [ASSUMED: photos may exist]

### Auburn Public Schools — 8 members
**GEOID:** 2302610 | **Official site:** auburnschl.edu
**Structure:** 5 ward seats (Wards 1–5) + 3 at-large = 8 members
**Chamber name:** "School Committee"
**NCES Source:** nces.ed.gov/ccd/districtsearch/district_detail.asp?ID2=2302610 [VERIFIED]

[VERIFIED: Nov 2025 election results from sunjournal.com — all winners confirmed]

| Seat | Full Name | Notes |
|------|-----------|-------|
| Ward 1 | Korin McGuigan | Won Nov 2025 (100%); unopposed |
| Ward 2 | Misty Edgecomb | Won Nov 2025 |
| Ward 3 | Patricia Gautier | Won Nov 2025 |
| Ward 4 | Lydia Chapman | Won Nov 2025 (60% vs Gormley 40%) |
| Ward 5 | Daniel F. Poisson Sr. | Won Nov 2025 (68% vs Mercier) |
| At-Large | Pamela Albert | Won Nov 2025 (34% / 3-way) |
| At-Large | Olivia Jaye Rich | Won Nov 2025 (33% / 3-way) |
| At-Large | Nancy Pulk | Won Nov 2025 (33% / 3-way) |

**Confidence:** HIGH for names (confirmed election winners). Note that some incumbents may not have been on the Nov 2025 ballot (staggered terms) — these are all current members elected in Nov 2025. Pre-2025 incumbents whose seats weren't up are NOT in this list because the research only confirmed the Nov 2025 winners. **Implementer must check auburnschl.edu for the full current roster including any holdover members.**

**Office title convention:** `'School Committee Member (Ward N)'` for ward seats; `'School Committee Member (At-Large)'` for at-large.

**Headshots:** auburnschl.edu uses custom CMS. [ASSUMED: check at implementation time]

### Biddeford Public Schools — 7 members
**GEOID:** 2303150 | **Official site:** biddefordschools.me
**Structure:** 7 members, all elected at-large, 2-year terms
**Chamber name:** "School Committee"
**NCES Source:** nces.ed.gov/ccd/districtsearch/district_detail.asp?ID2=2303150 [VERIFIED]
**Charter authority:** sacobaynews.com — "ten vie for seven at-large seats" [VERIFIED]

[VERIFIED: Nov 2025 election winners from sacobaynews.com + biddeford-gazette.com]

| Name | Notes |
|------|-------|
| Amy Clearwater | Elected Nov 2025 (2,718 votes) |
| Meagan Desjardins | Elected Nov 2025 (3,242 votes — highest) |
| Michele Landry | Elected Nov 2025 (2,799 votes) |
| Marie Potvin | Elected Nov 2025 (3,175 votes) |
| Timothy Stebbins | Elected Nov 2025 (3,044 votes) |
| Karen Ruel | Elected Nov 2025 (2,486 votes) |
| Emily Henley | Elected Nov 2025 (2,667 votes) |

**Note:** The Nov 2025 election likely replaced the entire 7-member board (all 7 seats were on the ballot per "ten candidates for seven seats"). Previous incumbents Vadnais, McCurry, Forcier did not seek reelection. All 7 winners are confirmed. [VERIFIED: election vote totals confirmed via sacobaynews.com reporting]

**Office title convention:** `'School Committee Member'` (at-large, no district qualifier)

**Headshots:** biddefordschools.me uses custom CMS. [ASSUMED: check at implementation time]

---

## Migration Plan

### Migration Sequence

| Migration | Plan | Content | Type |
|-----------|------|---------|------|
| 264 | Plan 1 | IN routing fix: IPS D3 INSERT + D2 UPDATE + MCCSC D7 UPDATE + districts rows for IPS + MCCSC | Apply |
| 265 | Plan 2 | ME school boards: 5 governments + chambers + districts + officials | Apply |
| 266 | Plan 3 | Headshots audit-only for all Phase 89 officials | Audit-only |

**Migration 264 pre-condition:** IN TIGER loader must run first to insert G5420 rows for GEOIDs 1804770 (IPS) and 1800630 (MCCSC).

**Migration 265 pre-condition:** ME TIGER loader must run first to insert G5420 rows for all 5 ME GEOIDs.

**Conflicts:** Migrations 264, 265, 266 are confirmed clear. Last applied: 263. [CITED: STATE.md + known DB state]

### External ID Allocation

**Phase 89 block:** -890001 to -899999 (confirmed CLEAR per known DB state)

Recommended assignment:
| District | Count | External ID Range |
|----------|-------|-------------------|
| IPS D3 (Hope Duke Star — new) | 1 | -890001 |
| ME Lewiston (8 members) | 8 | -890011 to -890018 |
| ME Bangor (7 members) | 7 | -890021 to -890027 |
| ME South Portland (7 members) | 7 | -890031 to -890037 |
| ME Auburn (8 members) | 8 | -890041 to -890048 |
| ME Biddeford (7 members) | 7 | -890051 to -890057 |

**IPS D2 and MCCSC D7:** These are UPDATE operations on existing politicians (external_ids already assigned). No new external_ids needed for updates.

**Total new politicians:** 1 (IPS D3) + 8 + 7 + 7 + 8 + 7 = **38 new politicians**

---

## Architecture Patterns

### System Architecture Diagram

```
census.gov TIGER UNSD
    |
    +---> tl_2024_18_unsd.zip (IN, 2.3MB)
    |         load-in-school-boundaries.ts
    |         [filter GEOID IN (1804770, 1800630)]
    |         [INSERT geofence_boundaries state='18', mtfcc='G5420']
    |
    +---> tl_2024_23_unsd.zip (ME, 2.6MB)
              load-me-school-boundaries.ts
              [filter GEOID IN (5 ME GEOIDs)]
              [INSERT geofence_boundaries state='23', mtfcc='G5420']
                   |
                   v
    essentials.geofence_boundaries
    (2 IN rows + 5 ME rows, mtfcc='G5420')
                   |
          migration 264 (IN corrections)
          [INSERT D3 politician Hope Duke Star + office]
          [UPDATE D2 politician Gayle Cosby → Hasaan Rashid]
          [UPDATE MCCSC D7 Brandon Shurr → Aja Jester]
          [INSERT districts rows for IPS (1804770) + MCCSC (1800630)]
          [UPDATE offices.district_id for all IPS + MCCSC offices]
                   |
          migration 265 (ME seed)
          [5x government + chamber + districts + politicians + offices]
          [INSERT 38 new ME politicians (8+7+7+8+7)]
                   |
                   v
    essentialsService.ts (no code changes)
    [district_type='SCHOOL' routing for IN and ME]
                   |
                   v
    API response: school board members in SCHOOL section
```

### Recommended Project Structure
```
C:/EV-Accounts/backend/
├── scripts/
│   ├── load-in-school-boundaries.ts    # New (Plan 1) — IN TIGER UNSD loader
│   ├── load-me-school-boundaries.ts    # New (Plan 2) — ME TIGER UNSD loader
│   ├── smoke-phase89-in.ts             # New (Plan 1) — IPS + MCCSC routing smoke test
│   └── smoke-phase89-me.ts             # New (Plan 2) — 5 ME districts routing smoke test
└── migrations/
    ├── 264_in_school_routing_fix.sql   # New (Plan 1) — IPS/MCCSC corrections + districts
    ├── 265_me_city_school_boards.sql   # New (Plan 2) — 5 ME school board seeds
    └── 266_me_in_school_headshots.sql  # New (Plan 3) — AUDIT-ONLY headshots
```

### Loader Script Pattern (copy from load-tx-school-boundaries.ts)

**Indiana loader key differences:**
```typescript
const TIGER_URL    = 'https://www2.census.gov/geo/tiger/TIGER2024/UNSD/tl_2024_18_unsd.zip';
const STATE        = '18';
const SOURCE       = 'tiger_unsd_in_2024';
const EXPECTED_COUNT = 2;

const TARGET_GEOIDS = new Map<string, string>([
  ['1804770', 'Indianapolis Public Schools'],
  ['1800630', 'Monroe County Community School Corporation'],
]);
const baseName = 'tl_2024_18_unsd';
const tmpRoot  = path.join(process.cwd(), '.tmp-in-school-unsd');
```

**Maine loader key differences:**
```typescript
const TIGER_URL    = 'https://www2.census.gov/geo/tiger/TIGER2024/UNSD/tl_2024_23_unsd.zip';
const STATE        = '23';
const SOURCE       = 'tiger_unsd_me_2024';
const EXPECTED_COUNT = 5;

const TARGET_GEOIDS = new Map<string, string>([
  ['2307320', 'Lewiston Public Schools'],
  ['2302820', 'Bangor School Department'],
  ['2312330', 'South Portland Public Schools'],
  ['2302610', 'Auburn Public Schools'],
  ['2303150', 'Biddeford Public Schools'],
]);
const baseName = 'tl_2024_23_unsd';
const tmpRoot  = path.join(process.cwd(), '.tmp-me-school-unsd');
```

### Migration 264 — IN Corrections

Key patterns for the corrective migration:

```sql
-- Pre-flight: verify IPS government exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM essentials.governments WHERE name LIKE 'Indianapolis Public Schools%') THEN
    RAISE EXCEPTION 'Pre-flight FAILED: IPS government not found — Phase 89 Plan 1 requires existing seed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM essentials.governments WHERE name LIKE 'Monroe County Community School%') THEN
    RAISE EXCEPTION 'Pre-flight FAILED: MCCSC government not found';
  END IF;
END $$;

-- Pre-flight: IPS D3 politician does NOT exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM essentials.politicians WHERE full_name = 'Hope Duke Star') THEN
    RAISE EXCEPTION 'Pre-flight FAILED: Hope Duke Star already exists in DB';
  END IF;
END $$;

-- Pre-flight: G5420 geofences exist (loader must have run)
DO $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM essentials.geofence_boundaries
  WHERE geo_id IN ('1804770', '1800630') AND mtfcc = 'G5420';
  IF v_count <> 2 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: expected 2 G5420 rows for IN, found % (run load-in-school-boundaries.ts first)', v_count;
  END IF;
END $$;

-- Step 1: UPDATE D2 politician (Gayle Cosby → Hasaan Rashid)
UPDATE essentials.politicians
SET full_name = 'Hasaan Rashid', first_name = 'Hasaan', last_name = 'Rashid'
WHERE full_name = 'Gayle Cosby'
  AND EXISTS (
    SELECT 1 FROM essentials.offices o
    JOIN essentials.chambers ch ON ch.id = o.chamber_id
    JOIN essentials.governments g ON g.id = ch.government_id
    WHERE o.politician_id = essentials.politicians.id
      AND g.name LIKE 'Indianapolis Public Schools%'
  );

-- Step 2: INSERT districts row for IPS
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'SCHOOL', 'in', '1804770', 'Indianapolis Public Schools', 'G5420'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '1804770' AND district_type = 'SCHOOL' AND state = 'in'
);

-- Step 3: INSERT districts row for MCCSC
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'SCHOOL', 'in', '1800630', 'Monroe County Community School Corporation', 'G5420'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '1800630' AND district_type = 'SCHOOL' AND state = 'in'
);

-- Step 4: Wire all IPS offices to IPS SCHOOL district
UPDATE essentials.offices o
SET district_id = (
  SELECT d.id FROM essentials.districts d WHERE d.geo_id = '1804770' AND d.district_type = 'SCHOOL' AND d.state = 'in'
)
WHERE o.chamber_id IN (
  SELECT ch.id FROM essentials.chambers ch
  JOIN essentials.governments g ON g.id = ch.government_id
  WHERE g.name LIKE 'Indianapolis Public Schools%'
)
AND o.district_id IS NULL;

-- Step 5: Wire all MCCSC offices to MCCSC SCHOOL district
UPDATE essentials.offices o
SET district_id = (
  SELECT d.id FROM essentials.districts d WHERE d.geo_id = '1800630' AND d.district_type = 'SCHOOL' AND d.state = 'in'
)
WHERE o.chamber_id IN (
  SELECT ch.id FROM essentials.chambers ch
  JOIN essentials.governments g ON g.id = ch.government_id
  WHERE g.name LIKE 'Monroe County Community School%'
)
AND o.district_id IS NULL;

-- Step 6: INSERT IPS D3 (Hope Duke Star) with office
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed, is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Hope Duke Star', 'Hope', 'Star', NULL, true, false, false, true, -890001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(), d.id, ch.id, p.id,
       'Commissioner', 'IN', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
JOIN essentials.chambers ch ON ch.government_id = (
  SELECT id FROM essentials.governments WHERE name LIKE 'Indianapolis Public Schools%'
)
WHERE d.geo_id = '1804770' AND d.district_type = 'SCHOOL' AND d.state = 'in'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id
  );

-- Step 7: UPDATE MCCSC D7 (Brandon Shurr → Aja Jester)
UPDATE essentials.politicians
SET full_name = 'Aja Jester', first_name = 'Aja', last_name = 'Jester'
WHERE full_name = 'Brandon Shurr'
  AND EXISTS (
    SELECT 1 FROM essentials.offices o
    JOIN essentials.chambers ch ON ch.id = o.chamber_id
    JOIN essentials.governments g ON g.id = ch.government_id
    WHERE o.politician_id = essentials.politicians.id
      AND g.name LIKE 'Monroe County Community School%'
  );

-- Step 8: Back-fill office_id on new politician
UPDATE essentials.politicians SET office_id = o.id
FROM essentials.offices o
WHERE essentials.politicians.id = o.politician_id
  AND essentials.politicians.external_id = -890001
  AND essentials.politicians.office_id IS NULL;
```

### Migration 265 — ME School Board Seed Pattern

Follow migration 254 (OR school boards) structure exactly. Per district:
- Government: `'[District Name], Maine, US'`, `state='ME'`, `type='LOCAL'`
- Chamber: `'School Committee'`, `name_formal='[District Name] School Committee'`
- District: `district_type='SCHOOL'`, `state='me'` (LOWERCASE), `geo_id=GEOID`, `mtfcc='G5420'`
- Politicians: `party=NULL`, `is_appointed=false`, `external_id=-89XXXX`
- Offices: `representing_state='ME'`, `is_appointed_position=false`

**Office titles by district:**
| District | Title Pattern |
|----------|--------------|
| Lewiston | `'School Committee Member (Ward N)'` / `'School Committee Member (At-Large)'` |
| Bangor | `'School Committee Member'` (at-large, no qualifier) |
| South Portland | `'Board Member (District N)'` / `'Board Member'` for at-large |
| Auburn | `'School Committee Member (Ward N)'` / `'School Committee Member (At-Large)'` |
| Biddeford | `'School Committee Member'` (at-large, no qualifier) |

### Anti-Patterns to Avoid

- **Using GEOID 1809480 for MCCSC:** That is Richland Bean Borden Community School Corporation. The correct MCCSC GEOID is 1800630.
- **Using GEOID 1800630 for IPS:** The correct IPS GEOID is 1804770.
- **Inserting D6 for IPS:** IPS has NO District 6. The structure is D1-D5 + 2 At-Large = 7 seats.
- **Wrong districts.state casing:** `districts.state = 'in'` (lowercase) for Indiana SCHOOL rows; `districts.state = 'me'` (lowercase) for Maine SCHOOL rows.
- **Running git in C:/EV-Accounts:** Never (project memory).
- **Slug in chamber INSERT:** GENERATED ALWAYS column — never include.
- **ON CONFLICT on governments:** Use WHERE NOT EXISTS guard — no unique constraint.
- **Missing office district_id back-fill:** All existing IPS and MCCSC offices have district_id=NULL currently. Migration 264 must UPDATE them to point to the new districts rows or routing will remain broken.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TIGER zip download | Custom download | `downloadWithRedirects()` from load-or-school-boundaries.ts | Handles 301/302 redirects |
| GEOID lookup | Manual census query | Authoritative source: NCES CCD LEAID = TIGER GEOID | Already verified in this research |
| School routing | New essentialsService.ts code | Existing `district_type='SCHOOL'` routing | Already implemented from Phase 62 |
| IN corrections as new seed | Duplicate all existing IPS/MCCSC data | UPDATE/INSERT delta pattern | Existing governments/chambers/politicians rows must be preserved |
| MCCSC sub-district polygons (D1-D7) | 7 separate G5420 geofences | Single whole-district GEOID 1800630 | MCCSC uses whole-district routing (same as LAUSD/PPS pattern) |

---

## Runtime State Inventory

Phase 89 modifies existing politicians (D2 Cosby→Rashid, MCCSC D7 Shurr→Jester). These are simple UPDATE operations with no cascading runtime state effects. No rename/migration of keys, collections, or services. No runtime state inventory required beyond the DB corrections documented above.

---

## Common Pitfalls

### Pitfall 1: Wrong MCCSC GEOID (Critical)
**What goes wrong:** Migration 264 inserts districts row with geo_id='1809480' (wrong district). IPS/MCCSC routing never works.
**Why it happens:** The known DB state documented MCCSC GEOID as "likely 1809480" — this is factually wrong. 1809480 = Richland Bean Borden Community School Corporation (Ellettsville, IN).
**How to avoid:** Use geo_id='1800630' for MCCSC. Confirmed via data.census.gov profile URL parameter `g=9700000US1800630`.
**Warning signs:** After migration 264, Bloomington/Monroe County address returns no SCHOOL section. Or PostGIS ST_Covers fails for a Bloomington coordinate against geo_id='1800630'.

### Pitfall 2: IPS "District 6" Does Not Exist
**What goes wrong:** Planner creates a D6 chamber, government body, or districts row for IPS.
**Why it happens:** The known DB state said "MISSING: District 3 and District 6 chambers + officials" — D6 is fictional.
**How to avoid:** IPS has EXACTLY 5 geographic districts (D1–D5) + 2 At-Large positions. Verify at myips.org before coding any IPS SQL.
**Warning signs:** A D6 INSERT would create a ghost office that never routes to anyone.

### Pitfall 3: IPS D2 Politician Not Updated Before Routing
**What goes wrong:** Gayle Cosby remains as the D2 seat holder even after routing is wired, so the wrong person appears.
**Why it happens:** She resigned March 2026; Hasaan Rashid was appointed April 2026. The UPDATE must happen in the same migration as the districts row INSERT.
**How to avoid:** Migration 264 must UPDATE the D2 politician row before or alongside the districts wiring.
**Warning signs:** IPS lookup returns "Gayle Cosby" for D2.

### Pitfall 4: MCCSC Office district_id Back-Fill Missed
**What goes wrong:** All 7 MCCSC officials have district_id=NULL in essentials.offices (routing broken). Migration 264 inserts the districts row but fails to UPDATE offices.
**Why it happens:** The existing MCCSC offices were seeded without a districts row (migration pre-dated Phase 89). A districts row INSERT alone does not back-fill the offices.
**How to avoid:** Migration 264 must include an UPDATE step that sets district_id on all MCCSC offices to point to the new districts.id where geo_id='1800630'.
**Warning signs:** Smoke test shows 0 MCCSC officials returned even though districts row exists and geofence exists.

### Pitfall 5: Maine districts.state Must Be Lowercase
**What goes wrong:** Board members never appear in address lookups.
**Why it happens:** essentialsService.ts routing uses lowercase state for SCHOOL district joins. 'ME' (uppercase) does not match 'me'.
**How to avoid:** All Maine SCHOOL districts rows must use state='me' (lowercase). Pattern confirmed from OR (state='or') and TX (state='tx') precedents.
**Warning signs:** Smoke test shows G5420 geofence exists and districts row exists but API returns no SCHOOL section.

### Pitfall 6: South Portland Board Partial Roster
**What goes wrong:** Migration 265 uses the partial/approximate South Portland roster from this research document and inserts wrong members.
**Why it happens:** This research confirmed Rosemarie De Angelis, Tyler Smith, George Risch, Eleni Richardson, and Adrian Dowling's vacancy — but D1, D3, and one At-Large slot have [ASSUMED] names.
**How to avoid:** Before writing migration 265 South Portland block, implementer must verify the complete roster at spsd.org or spsdme.org. D5 may also be vacant or filled by appointment.
**Warning signs:** N/A — prevent by pre-verification step at implementation time.

### Pitfall 7: Lewiston Ward 5 Vacancy
**What goes wrong:** Migration 265 inserts a Ward 5 member without confirming who was appointed.
**Why it happens:** Iman Osman forfeited his seat; the mayoral appointee was not confirmed in research.
**How to avoid:** Check lewistonpublicschools.org/en-US/school-committee-bc9f3846/school-committee-members-ab24c81b at implementation time. If Ward 5 is still vacant, use `is_vacant=true` placeholder.
**Warning signs:** Wrong person for Ward 5 would be a data quality issue visible in production.

---

## Headshot Availability Summary

| District | Photos on Official Website | Source Pattern | Notes |
|----------|---------------------------|----------------|-------|
| IPS (D3 + D2 update) | NO — placeholder images only | N/A | myips.org shows transparent GIFs for all members; alternate sources needed |
| MCCSC | Unknown | Check mccsc.edu/board | [ASSUMED: likely present] |
| Lewiston | Unknown | lewistonpublicschools.org | Thrillshare CMS; check at implementation |
| Bangor | Unknown | bangorschools.net | Thrillshare CMS; check at implementation |
| South Portland | Unknown (JS-heavy CMS) | spsd.org / spsdme.org | Site returns 404 on direct fetch; check at implementation |
| Auburn | Unknown | auburnschl.edu | Custom CMS; check at implementation |
| Biddeford | Unknown | biddefordschools.me | [ASSUMED: check at implementation] |

**IPS headshots:** No photos on official website. For migration 266, document all IPS D3 + D2 as "No photo found on official IPS website." Wikipedia or local news photos may exist but require manual search.

**All other districts:** Headshot URLs cannot be pre-confirmed from this research (CMS sites blocked WebFetch or returned truncated content). Migration 266 is audit-only, so missing photos are documented as gaps rather than blocking.

---

## MCCSC Routing Strategy (Geo_id Decision)

**Decision:** Use whole-district geo_id='1800630' for all 7 MCCSC board member offices.

This matches the established pattern for school boards in this codebase:
- LAUSD: all 7 board members link to whole-district GEOID (not 7 sub-districts)
- IPS: all 7 commissioners link to whole-district GEOID 1804770
- PPS (Portland OR): all 7 zone board members link to whole-district GEOID 4110040

MCCSC's 7 districts are trustee residency zones, not separate service areas — all 7 board members represent the entire school corporation. One districts row (geo_id='1800630') linked to all 7 offices is correct.

**The "1809480 sub-district polygon" question:** The known DB state mentioned "MCCSC GEOID likely 1809480 (source: moco_gis_arcgis_2024)." This appears to reference MCCSC's sub-district boundary data from Monroe County GIS — not a TIGER UNSD polygon. TIGER UNSD has one whole-district polygon for MCCSC (GEOID=1800630). Do NOT create 7 sub-district geofences from ArcGIS data.

---

## Section-Split Check (post-migration)

After migration 264 (IN):
```sql
SELECT gb.geo_id FROM essentials.geofence_boundaries gb
WHERE gb.geo_id IN ('1804770', '1800630') AND gb.mtfcc = 'G5420'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.districts d
    WHERE d.geo_id = gb.geo_id AND d.district_type = 'SCHOOL' AND d.state = 'in'
  );
-- Must return 0 rows
```

After migration 265 (ME):
```sql
SELECT gb.geo_id FROM essentials.geofence_boundaries gb
WHERE gb.geo_id IN ('2307320','2302820','2312330','2302610','2303150') AND gb.mtfcc = 'G5420'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.districts d
    WHERE d.geo_id = gb.geo_id AND d.district_type = 'SCHOOL' AND d.state = 'me'
  );
-- Must return 0 rows
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Phase 89 "D6" for IPS | D1-D5 + 2 At-Large (no D6) | D6 does not exist; corrective only |
| MCCSC GEOID 1809480 (guessed) | Correct GEOID 1800630 | Wrong GEOID would produce zero routing |
| Gayle Cosby in IPS D2 | Hasaan Rashid (April 2026 appointment) | DB correction needed |
| Brandon Shurr in MCCSC D7 | Aja Jester (2026 change) | DB correction needed |
| IPS/MCCSC offices with NULL district_id | Back-fill to SCHOOL districts rows | Routing only works after back-fill |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | MCCSC TIGER GEOID = 1800630 | GEOID Verification | CRITICAL — verified via data.census.gov + NCES; risk is LOW |
| A2 | IPS TIGER GEOID = 1804770 | GEOID Verification | CRITICAL — verified via NCES CCD + multiple sources; risk is LOW |
| A3 | Lewiston Ward 5 appointee name unknown | Lewiston Roster | Ward 5 may be vacant or filled by mayoral appointment — verify at implementation |
| A4 | South Portland D1 = Susan Rauscher | South Portland Roster | From search summary only; [ASSUMED] — must verify at spsd.org |
| A5 | South Portland At-Large = Jennifer Ryan + Eleni Richardson | South Portland Roster | From search summary; [ASSUMED] |
| A6 | South Portland D5 is vacant (Dowling resigned April 2026) | South Portland Roster | Vacancy may have been filled by appointment post-April 2026 |
| A7 | Auburn Nov 2025 winners are ALL current members (no holdovers in research) | Auburn Roster | Some seats were NOT on Nov 2025 ballot; holdover members from prior elections are not in this roster — verify full current roster at auburnschl.edu |
| A8 | Bangor Sara Luciano is still a committee member (vs. departed) | Bangor Roster | Luciano was Chair in early 2025; if her term expired Nov 2025 and she did not run, she is gone. Confirm at bangorschools.net |
| A9 | MCCSC/IPS offices currently have district_id=NULL | Migration 264 | Confirmed by known DB state; if any offices were back-filled earlier the UPDATE is still idempotent via WHERE district_id IS NULL |
| A10 | All 7 new Biddeford members (Nov 2025 winners) make up the full current board | Biddeford Roster | All 7 seats were on the Nov 2025 ballot (10 candidates for 7 seats) — election replaced entire board. LOW risk. |
| A11 | MCCSC board name "Board of School Trustees" | MCCSC Roster | From mccsc.edu search; [VERIFIED] |
| A12 | IPS office title = 'Commissioner' | IPS Roster | IPS uses "Commissioner" officially vs generic "Board Member"; recommend 'Commissioner' for official accuracy |

---

## Open Questions

1. **Lewiston Ward 5 appointee name**
   - What we know: Iman Osman forfeited School Committee seat after winning City Council Ward 5 (Nov 2025)
   - What's unclear: Who was appointed as replacement by the Mayor
   - Recommendation: Check lewistonpublicschools.org/en-US/school-committee-bc9f3846/school-committee-members-ab24c81b at implementation time; if still vacant, use placeholder with `is_vacant=true`

2. **South Portland complete roster verification**
   - What we know: 4 confirmed names (De Angelis, Smith, Risch, Richardson); D5 vacant (Dowling resigned April 2026)
   - What's unclear: D1 (Susan Rauscher assumed), 7th member name; whether D5 vacancy has been filled
   - Recommendation: Implementer must access spsd.org or spsdme.org (requires JavaScript) before writing South Portland SQL block

3. **Auburn holdover board members**
   - What we know: 8 winners from Nov 2025 election confirmed
   - What's unclear: Whether any seats were NOT on Nov 2025 ballot (staggered terms would leave incumbents from prior cycles)
   - Recommendation: Check auburnschl.edu for complete current roster including both Nov 2025 winners and any holdovers

4. **IPS office title: 'Commissioner' vs 'Board Member'**
   - What we know: IPS officially calls members "Commissioners" in its charter/usage
   - What's unclear: Whether existing IPS offices in DB use 'Board Member' or 'Commissioner'
   - Recommendation: Before writing migration 264, query `SELECT title FROM essentials.offices o JOIN essentials.chambers ch ON ch.id = o.chamber_id JOIN essentials.governments g ON g.id = ch.government_id WHERE g.name LIKE 'Indianapolis Public Schools%'` to match existing title convention.

5. **MCCSC D4 name in DB**
   - What we know: DB was seeded as "Tiana Williams Iruoje"; MCCSC news says "Dr. Tiana Iruoje"
   - What's unclear: Whether DB name needs correction
   - Recommendation: Query `SELECT full_name FROM essentials.politicians WHERE full_name LIKE '%Iruoje%'` and leave unchanged unless name is clearly wrong (her full name is Tiana Williams Iruoje).

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js + tsx | IN/ME loaders | Assumed yes | Pre-existing | — |
| `shapefile` npm | Loader | Yes | pre-installed | — |
| `adm-zip` npm | Loader | Yes | pre-installed | — |
| census.gov TIGER UNSD (IN) | Loader | Yes | tl_2024_18_unsd.zip (2.3MB) confirmed | — |
| census.gov TIGER UNSD (ME) | Loader | Yes | tl_2024_23_unsd.zip (2.6MB) confirmed | — |
| DATABASE_URL in .env | Loader + migrations | Yes | In C:/EV-Accounts/backend/.env | Run from C:/EV-Accounts/backend |
| Python + PIL | Headshot processing | Assumed yes | Used in Phases 86-88 | — |
| Supabase MCP | Migrations 264/265 | Yes | mcp__supabase-local = production | — |

---

## Validation Architecture

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Verification Method |
|--------|----------|-----------|---------------------|
| IN-SCHOOL-01 | IPS routing: Indianapolis address returns board members incl. Hope Duke Star | Smoke | PostGIS query: ST_Covers(geofence, IPS address) → SCHOOL officials |
| IN-SCHOOL-01 | D2 shows Hasaan Rashid (not Gayle Cosby) | DB gate | SELECT full_name FROM politicians p JOIN offices o ON p.id=o.politician_id JOIN chambers ch ON ch.id=o.chamber_id JOIN governments g ON g.id=ch.government_id WHERE g.name LIKE 'Indianapolis Public Schools%' AND o.title LIKE '%District 2%' |
| IN-SCHOOL-02 | MCCSC routing: Bloomington address returns 7 board members | Smoke | PostGIS query with Bloomington coordinate (≈ -86.5264, 39.1653) |
| IN-SCHOOL-02 | D7 shows Aja Jester (not Brandon Shurr) | DB gate | SELECT full_name WHERE external_id = (old MCCSC D7 external_id) |
| ME-SCHOOL-01 | Lewiston address returns Lewiston School Committee members | Smoke | PostGIS query with Lewiston coordinate (≈ -70.2140, 44.0978) |
| ME-SCHOOL-02 | Bangor address returns Bangor School Committee members | Smoke | PostGIS query with Bangor City Hall coordinate (≈ -68.7772, 44.8012) |
| ME-SCHOOL-03 | South Portland, Auburn, Biddeford addresses return their board members | Smoke | 3 PostGIS queries |

### Smoke Test Coordinates

| District | Address Area | Approx Coordinate |
|----------|-------------|-------------------|
| IPS | Indianapolis | (-86.1581, 39.7684) |
| MCCSC | Bloomington, IN | (-86.5264, 39.1653) |
| Lewiston, ME | Lewiston City Hall area | (-70.2140, 44.0978) |
| Bangor, ME | Bangor City Hall area | (-68.7772, 44.8012) |
| South Portland, ME | South Portland City Hall | (-70.2788, 43.6415) |
| Auburn, ME | Auburn City Hall area | (-70.2312, 44.0978) |
| Biddeford, ME | Biddeford City Hall area | (-70.4520, 43.4909) |

---

## Security Domain

This phase is data seeding only. No new authentication, session management, or cryptography surfaces. The loader and migration follow established patterns with no new attack surface. ASVS V2-V6 do not apply. No user-facing input changes.

---

## Sources

### Primary (HIGH confidence)
- `https://www2.census.gov/geo/tiger/TIGER2024/UNSD/` — IN (2.3MB) and ME (2.6MB) UNSD files confirmed
- `https://nces.ed.gov/ccd/districtsearch/district_detail.asp?ID2=1804770` — IPS NCES LEAID = TIGER GEOID = 1804770
- `https://data.census.gov/profile/Monroe_County_Community_School_Corporation,_Indiana?g=9700000US1800630` — MCCSC GEOID = 1800630
- `https://nces.ed.gov/ccd/districtsearch/district_detail.asp?Search=2&details=1&DistrictID=1800630&ID2=1800630` — MCCSC NCES LEAID confirmed
- `https://nces.ed.gov/ccd/districtsearch/district_detail.asp?ID2=2307320` — Lewiston NCES LEAID = 2307320
- `https://nces.ed.gov/ccd/districtsearch/district_detail.asp?Search=2&details=1&DistrictID=2302820&DistrictID=2302820` — Bangor NCES LEAID = 2302820
- `https://nces.ed.gov/ccd/districtsearch/district_detail.asp?ID2=2312330` — South Portland NCES LEAID = 2312330
- `https://nces.ed.gov/ccd/districtsearch/district_detail.asp?Search=2&ID2=2302610&DistrictID=2302610&details=1` — Auburn NCES LEAID = 2302610
- `https://nces.ed.gov/ccd/districtsearch/district_detail.asp?ID2=2303150` — Biddeford NCES LEAID = 2303150
- `https://myips.org/district-school-board/school-board/` — IPS full board roster (7 members, no D6), headshots absent (transparent placeholders)
- `https://ecode360.com/13124362` — Bangor School Committee structure: 7 at-large members, 3-year terms
- C:/EV-Accounts/backend/scripts/load-tx-school-boundaries.ts — canonical loader pattern

### Secondary (MEDIUM confidence)
- Sun Journal (sunjournal.com) Nov 2025 results — Auburn 8 election winners (all 8 confirmed with vote counts)
- sacobaynews.com Nov 2025 results — Biddeford 7 at-large winners with vote counts
- wfyi.org/education/2026-03-10 + chalkbeat.org 2026-03-27 — IPS D2: Cosby resignation + Rashid appointment
- mccsc.edu board news 2026 — MCCSC 2026 roster including Aja Jester (D7 replacement)
- Lewiston school committee search results — 7 ward + 1 at-large structure; Nov 2025 winners confirmed
- bangorschools.net + bangordailynews.com — Bangor 7 at-large post-Nov 2025 roster

### Tertiary (LOW/ASSUMED confidence)
- South Portland D1 = Susan Rauscher, At-Large = Jennifer Ryan (from search summary — unverified)
- South Portland D5 vacancy (Dowling resigned April 2026) — confirmed by pressherald.com; appointee unknown
- MCCSC/Lewiston/Bangor headshot availability — [ASSUMED: check at implementation time]

---

## Metadata

**Confidence breakdown:**
- TIGER filenames (IN/ME): HIGH — confirmed via census.gov directory
- IPS TIGER GEOID (1804770): HIGH — verified NCES CCD + multiple cross-references
- MCCSC TIGER GEOID (1800630): HIGH — verified data.census.gov + NCES CCD
- IPS board structure (no D6, D3=Hope Star, D2=Rashid): HIGH — verified myips.org directly
- MCCSC D7 = Aja Jester: HIGH — verified MCCSC news 2026
- ME GEOIDs (all 5): HIGH — verified NCES CCD directly
- Auburn board roster: HIGH — election winners confirmed with vote counts
- Biddeford board roster: HIGH — election winners confirmed with vote counts
- Bangor board roster: MEDIUM — 6/7 members confirmed; Sara Luciano status uncertain
- Lewiston board roster: MEDIUM — 7/8 confirmed; Ward 5 appointee unknown
- South Portland board roster: MEDIUM — 5/7 confirmed; 2 ASSUMED + D5 vacancy
- Headshot availability: LOW — most districts not confirmed (CMS sites blocked or truncated)
- Migration numbers (264/265/266): HIGH — confirmed clear from known DB state

**Research date:** 2026-06-03
**Valid until:** 2026-07-03 (board membership stable until next ME elections Nov 2026; IN IPS D2 up for election Nov 2026)
