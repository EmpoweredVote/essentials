# Phase 88: TX Collin County School Boards - Research

**Researched:** 2026-06-02
**Domain:** TX ISD geofence loading (TIGER UNSD), school board seeding (SQL migration), board member roster
**Confidence:** HIGH (GEOIDs verified via TIGERweb REST API; board rosters sourced from official ISD pages + verified election results)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: New dedicated `load-tx-school-boundaries.ts` (parallel to `load-or-school-boundaries.ts`). Do NOT extend `load-state-tiger-boundaries.ts`.
- D-02: Loader downloads `tl_2024_48_unsd.zip`, filters to 5 target GEOIDs, inserts into `essentials.geofence_boundaries` with `mtfcc='G5420'`, `state='48'`, `source='tiger_unsd_tx_2024'`. ON CONFLICT (geo_id, mtfcc) DO NOTHING.
- D-03: GEOIDs confirmed by researcher before coding.
- D-04: 2 plans. Plan 1: loader + migration 261 (governments + chambers + districts + officials + offices + smoke test). Plan 2: migration 262 (headshots, SQL audit-only only, no apply script).
- D-05: Each ISD gets one `essentials.governments` row, one chamber, one `essentials.districts` row with `district_type='SCHOOL'` linked to G5420 geo_id, and board member offices linked to that district row.
- D-06: `district_type='SCHOOL'` is mandatory — NOT 'SCHOOL_DISTRICT'.
- D-07: `districts.state` = `'tx'` (lowercase). `governments.state` = `'TX'` (uppercase). `offices.representing_state` = `'TX'` (uppercase).
- D-08: Board member names, seat counts, terms from each ISD's official website. TX ISDs typically 7-member boards with numbered place positions. Researcher verifies per ISD.
- D-09: Office titles: TX school boards use 'Board Member, Place [N]' for numbered positions or 'Board Member' for at-large. Researcher confirms per ISD.
- D-10: `party = NULL` for all officials (antipartisan design).
- D-11: `is_appointed = false`, `is_appointed_position = false` — board members are elected.
- D-12: External_id range: starts at -880001. Block -880001..-880035 approximately.
- D-13: Use full TIGER G5420 polygon for Frisco ISD (Collin+Denton) and Richardson ISD (Collin+Dallas). No clipping.
- D-14: Richardson ISD extends into Dallas County — residents in those portions will also see Richardson ISD board (correct behavior).
- D-15: Seed only 5 named ISDs. Do NOT expand to Prosper, Wylie, Celina, Lovejoy, Princeton, etc.
- D-16: Document coverage gap in migration comment.
- D-17: Check each ISD's official website for board member photos. Official website only.
- D-18: All images 600x750 JPEG, Lanczos q90, 4:5 crop first. `type='default'` in politician_images.
- D-19: Migration 262 is audit-only — SQL file only, no apply script. Documents source URL or 'No photo found on official ISD website.' per official.
- D-20: No 2026 school board race rows in this phase.
- D-21: Run section split check query after migration 261 applies.

### Claude's Discretion
- None specified.

### Deferred Ideas (OUT OF SCOPE)
- Secondary Collin County ISDs (Prosper, Wylie, Celina, Lovejoy, Princeton, etc.)
- TX school board elections (2026 race rows)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TX-SCHOOL-01 | Plano ISD — G5420 geofence + board seeded | GEOID 4835100 verified; 7 board members identified |
| TX-SCHOOL-02 | McKinney ISD — G5420 geofence + board seeded | GEOID 4829850 verified; 7 board members identified |
| TX-SCHOOL-03 | Allen ISD — G5420 geofence + board seeded | GEOID 4807890 verified; 7 board members identified |
| TX-SCHOOL-04 | Frisco ISD — G5420 geofence + board seeded | GEOID 4820010 verified; 7 board members identified |
| TX-SCHOOL-05 | Richardson ISD — G5420 geofence + board seeded | GEOID 4837020 verified; 7 board members identified |
</phase_requirements>

---

## Summary

Phase 88 is a direct analog of Phase 86 (OR school districts) and Phase 87 (CA school boards). The research task had five components: TIGER GEOID verification, board roster collection, headshot availability assessment, analog script review, and production DB pre-flight checks.

All five TX UNSD GEOIDs were confirmed via TIGERweb REST API (TIGERweb/School MapServer layer 10, ACS 2024 vintage). The TIGER file `tl_2024_48_unsd.zip` exists at the expected census.gov URL (16 MB). Board rosters for all 5 ISDs have been sourced — 4 ISDs use the standard TX 7-member at-large-by-place system; Richardson ISD uses a hybrid system (5 single-member geographic districts + 2 at-large places). The title convention across all 5 ISDs is "Board Member, Place [N]" (or "Board Member, Single-Member District [N]" for Richardson), which is consistent with D-09.

Production DB pre-flight results: 0 existing TX ISD government rows, 0 existing G5420 rows for state='48', and 0 rows in external_id block -880001..-880040 — all clear.

**Primary recommendation:** The loader script and migration 261 can be written immediately. The board roster data below is sufficient for the implementer to write all SQL blocks without additional research. Richardson ISD's hybrid seat structure is the only structural deviation from the other 4 ISDs and must be handled with appropriate title strings.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| TX UNSD geofence loading | Backend script (Node.js) | — | TIGER shapefile processing requires shapefile/pg; same pattern as load-or-school-boundaries.ts |
| G5420 geofence storage | Database (geofence_boundaries) | — | PostGIS geometry; routing lookup happens at DB tier |
| School board seeding | SQL migration | — | All entity creation (governments/chambers/districts/politicians/offices) handled in single atomic migration |
| Headshot processing | Manual (researcher executes) | Supabase Storage | 600x750 JPEG processed locally, uploaded to Storage; politician_images row inserted |
| Resident routing to SCHOOL section | Backend (essentialsService.ts) | — | No code changes needed; existing district_type='SCHOOL' routing handles it |

---

## TIGER GEOID Verification

**Source:** TIGERweb REST API — `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/School/MapServer/10/query` (layer 10 = ACS 2024 Unified School Districts) [VERIFIED: TIGERweb REST API, queried 2026-06-02]

| ISD | GEOID | Verified Name in TIGER |
|-----|-------|------------------------|
| Plano ISD | `4835100` | Plano Independent School District |
| McKinney ISD | `4829850` | McKinney Independent School District |
| Allen ISD | `4807890` | Allen Independent School District |
| Frisco ISD | `4820010` | Frisco Independent School District |
| Richardson ISD | `4837020` | Richardson Independent School District |

**TIGER file confirmed:** `tl_2024_48_unsd.zip` exists at `https://www2.census.gov/geo/tiger/TIGER2024/UNSD/tl_2024_48_unsd.zip` (16 MB, last modified 2025-06-27). [VERIFIED: census.gov directory listing, 2026-06-02]

**GEOID format note:** TX GEOIDs in the TIGER UNSD file are 7-digit strings (e.g., `4835100`), NOT the 10-digit padded format. This differs from OR GEOIDs (7-digit, e.g., `4110040`). Both use 7 digits in the GEOID field. The geo_id stored in geofence_boundaries is the GEOID value directly (same pattern as OR).

---

## Standard Stack

All tooling is pre-established from Phases 86 and 87.

### Core
| Tool/Library | Version | Purpose | Notes |
|--------------|---------|---------|-------|
| `shapefile` (npm) | pre-installed | Read .shp/.dbf from TIGER zip | Used in load-or-school-boundaries.ts |
| `adm-zip` (npm) | pre-installed | Extract TIGER zip | Same as OR loader |
| `pg` (npm) | pre-installed | PostgreSQL inserts | Pool with SSL |
| Supabase MCP | — | Apply SQL migration | mcp__supabase-local is production |

### Loader Script Location
`C:/EV-Accounts/backend/scripts/load-tx-school-boundaries.ts`

### Migration Files
- `C:/EV-Accounts/backend/migrations/261_tx_collin_county_school_boards.sql`
- `C:/EV-Accounts/backend/migrations/262_tx_collin_county_school_headshots.sql`

---

## Board Member Rosters

### CRITICAL NOTES ON DATA QUALITY

- **Plano ISD place numbers:** The trustee-profiles page confirms names and officer titles but does NOT explicitly label Place numbers in the navigation text. Place assignments are derived from cross-referencing 2025 election results (Lauren Tyra = Place 1 per election records, Nancy Humphrey = Place 3 per election records). Full place-to-name mapping below is [MEDIUM: verified via election records + official page]. Implementer should confirm Place 4-7 assignments by visiting individual profile pages.
- **McKinney ISD:** Place 4 and officer role for Amy Dankel need confirmation from the official board page (mckinneyisd.net/page/board-of-trustees renders too large for automated extraction). The data below is [MEDIUM: sourced from multiple news articles and election records].
- **Allen ISD:** Official board page renders too large for automated extraction. Roster assembled from 2024 + 2025 election results + Facebook election announcements + Ballotpedia. [MEDIUM confidence].
- **Frisco ISD:** Full 7-member roster confirmed from official meet-the-board page. [HIGH: verified from friscoisd.org].
- **Richardson ISD:** Full 7-member roster confirmed from official members page. [HIGH: verified from web.risd.org].

---

### Plano ISD (GEOID: 4835100)

**Board type:** 7 members, at-large by Place (Finalsite CMS website)
**Source:** `https://www.pisd.edu/about-our-district/board-of-trustees` + election records [MEDIUM: official page + cross-referenced election results]

| Place | Full Name | Officer Title | Term Note |
|-------|-----------|---------------|-----------|
| Place 1 | Dr. Lauren Tyra | Board President | Re-elected May 2025 |
| Place 2 | Sam Johnson | Board Member | Re-elected May 2025 |
| Place 3 | Nancy Humphrey | Board Vice President | Re-elected May 2025 |
| Place 4 | Michael Cook | Board Member | [ASSUMED — confirmed name from official page; place number inferred] |
| Place 5 | Tarrah Lantz | Board Member | [ASSUMED — confirmed name from official page; place number inferred] |
| Place 6 | Elisa Klein | Board Member | [ASSUMED — confirmed name from official page; place number inferred] |
| Place 7 | Katherine Goodwin | Board Secretary | [ASSUMED — confirmed name from official page; place number inferred] |

**IMPORTANT for implementer:** Place numbers for positions 4-7 are inferred. Before writing migration SQL, visit `https://www.pisd.edu/about-our-district/board-of-trustees/trustee-profiles` and check each individual profile page to confirm the Place number (the profile URL uses name-slug, not place number).

**Office title convention:** `'Board Member, Place [N]'` for all 7 (standard TX ISD pattern)
**Exception:** Board President/VP/Secretary are officer roles within the board, not different office titles — all 7 use `'Board Member, Place [N]'` as the office title in the migration.

**Headshots:** Finalsite CMS at pisd.edu. Individual profile pages exist at `/about-our-district/board-of-trustees/trustee-profiles/[name]-profile`. The Finalsite CDN URL pattern is `resources.finalsite.net` (same pattern as SCUSD from Phase 87). Automated extraction was blocked (page content truncated). Implementer must visit each profile page manually to find photo URLs. [ASSUMED — Finalsite pattern expected; actual URLs unconfirmed]

---

### McKinney ISD (GEOID: 4829850)

**Board type:** 7 members, at-large by Place
**Source:** mckinneyisd.net, election records, Community Impact articles [MEDIUM: cross-referenced multiple sources]

| Place | Full Name | Officer Title | Source Confidence |
|-------|-----------|---------------|-------------------|
| Place 1 | Harvey Oaxaca | Board Member | [VERIFIED: mckinneyisd.net election records, elected May 2025] |
| Place 2 | Kenneth Ussery | Board Member | [VERIFIED: Community Impact article, elected May 2025] |
| Place 3 | Corey Homer | Board Member | [VERIFIED: Community Impact article, elected May 2025] |
| Place 4 | Roxane Morrison | Board President | [ASSUMED: name from search summary; confirm on official page] |
| Place 5 | Lynn Sperry | Board Secretary | [MEDIUM: confirmed via search, term exp. May 2027] |
| Place 6 | Stephanie O'Dell | Board Member | [MEDIUM: confirmed via Ballotpedia, term exp. May 2027] |
| Place 7 | Amy Dankel | Board Vice President | [VERIFIED: mckinneyisd.net official page, elected May 2025] |

**IMPORTANT for implementer:** Place 4 (Roxane Morrison) must be confirmed on the official board page before committing to migration. Visit `https://www.mckinneyisd.net/page/board-of-trustees`.

**Officer title note:** McKinney ISD refers to board leadership as President/Vice President/Secretary. As with Plano ISD, these are officer roles — the office title in migration SQL is `'Board Member, Place [N]'` for all 7.

**Headshots:** McKinney ISD uses a Thrillshare-based CMS. The board page at mckinneyisd.net/page/board-of-trustees likely has profile photos, but automated extraction was blocked (page too large). Implementer must check manually. [ASSUMED: photos likely present; URLs unconfirmed]

---

### Allen ISD (GEOID: 4807890)

**Board type:** 7 members, at-large by Place (3-year terms, not 4-year)
**Source:** Official allenisd.org + election results + Ballotpedia election history [MEDIUM: assembled from election records]

| Place | Full Name | Officer Title | Source |
|-------|-----------|---------------|--------|
| Place 1 | Sarah Mitchell | Board Member | [MEDIUM: elected May 2024, per Ballotpedia] |
| Place 2 | Veronica Yost | Board Member | [MEDIUM: elected May 2024, per Ballotpedia] |
| Place 3 | John Holley | Board Member | [MEDIUM: elected May 2024, per Ballotpedia] |
| Place 4 | Becca Kinnear | Board Member | [VERIFIED: election results May 2025, 54.46%] |
| Place 5 | Amanda Campbell | Board Member | [VERIFIED: election results May 2025, 62.13%] |
| Place 6 | Dr. Polly Montgomery | Board Member | [MEDIUM: elected May 2023, per Facebook election announcement] |
| Place 7 | Bill Parker | Board Member | [MEDIUM: elected May 2023, per election records] |

**IMPORTANT for implementer:** Allen ISD board page (allenisd.org/page/board-of-trustees) rendered too large for automated extraction. Confirm all 7 names before writing migration SQL. Officer titles (President, VP, Secretary) for the current year are not confirmed — the migration should use `'Board Member, Place [N]'` for all 7 regardless.

**Headshots:** Allen ISD uses Finalsite CMS (allenisd.org). The board page may have profile photos. Implementer must visit and check each profile. [ASSUMED: photos may be present on profile pages; URLs unconfirmed]

---

### Frisco ISD (GEOID: 4820010)

**Board type:** 7 members, at-large by Place
**Source:** `https://www.friscoisd.org/about/board-of-trustees/meet-the-board` [VERIFIED: confirmed from official friscoisd.org page, 2026-06-02]

| Place | Full Name | Officer Title |
|-------|-----------|---------------|
| Place 1 | Suresh Manduva | Board Member |
| Place 2 | Renee Sample | Board Member |
| Place 3 | Stephanie Elad | Board Member |
| Place 4 | Dynette Davis | Board President |
| Place 5 | Mark Hill | Board Secretary |
| Place 6 | Sherrie Salas | Board Member |
| Place 7 | Keith Maddox | Board Vice President |

**Notes:** Suresh Manduva, Renee Sample, and Stephanie Elad were elected in May 2026 (Places 1, 2, 3). Davis (Place 4) and Maddox (Place 7) were re-elected in May 2025. Mark Hill (Place 5) replaced "Misty Wamhoff" after May 2025 election (Wamhoff is listed in older sources; Hill listed as Secretary on current meet-the-board page — confirm current officer assignments on official page at implementation time).

**Headshots:** Frisco ISD uses SiteImprove/Finalsite CMS (friscoisd.org). Image URL pattern from official page:
`https://www.friscoisd.org/images/default-source/board-members/[lastname].jpg?sfvrsn=[version]`
Examples:
- `https://www.friscoisd.org/images/default-source/board-members/davis.jpg?sfvrsn=9697fd7_3`
- `https://www.friscoisd.org/images/default-source/board-members/maddox.jpg?sfvrsn=6d996ddc_5`
- `https://www.friscoisd.org/images/default-source/board-members/hill.jpg?sfvrsn=43583c7e_2`
All 7 members appear to have profile photos. [VERIFIED: URL pattern confirmed from official meet-the-board page]

---

### Richardson ISD (GEOID: 4837020)

**Board type:** 7 members — HYBRID: 5 single-member geographic districts + 2 at-large places
**Source:** `https://web.risd.org/board/members/` [VERIFIED: confirmed from official risd.org board members page, 2026-06-02]

| Seat | Full Name | Officer Title |
|------|-----------|---------------|
| Single-Member District 1 | Megan Timme | Board Member |
| Single-Member District 2 | Vanessa Pacheco | Board Member |
| Single-Member District 3 | Debbie Rentería | Secretary |
| Single-Member District 4 | Regina Harris | Board Member |
| Single-Member District 5 | Rachel McGowan | Vice President |
| At Large Place 6 | Eric Eager | Board Member |
| At Large Place 7 | Chris Poteet | President |

**CRITICAL — Office title convention for Richardson ISD:** Richardson ISD's structure does NOT use "Place 1–7" for all seats. The title format must distinguish between single-member districts and at-large places:
- Single-member district members: `'Board Member, District [N]'`
- At-large members: `'Board Member, Place [N]'`

This is the ONLY ISD in this phase with a hybrid structure. All other 4 ISDs use the uniform Place numbering.

**Name note:** Debbie Rentería contains an accented character (é). The SQL file must be saved as UTF-8.

**Headshots:** Richardson ISD uses WordPress at web.risd.org. Each trustee has an individual bio page. Confirmed photo URL pattern:
`https://web.risd.org/board/wp-content/uploads/[FirstNameLastInitial].jpg`
Examples confirmed:
- Chris Poteet: `https://web.risd.org/board/wp-content/uploads/ChrisP.jpg`
- Rachel McGowan: `https://web.risd.org/board/wp-content/uploads/RachelM-1.jpg`
- Debbie Rentería: `https://web.risd.org/board/wp-content/uploads/DebbieR.jpg`
All 7 members appear to have photos. [VERIFIED: URL pattern confirmed from web.risd.org/board/chris-poteet/]

---

## Architecture Patterns

### System Architecture Diagram

```
census.gov TIGER UNSD
    |
    | tl_2024_48_unsd.zip (16 MB download)
    v
load-tx-school-boundaries.ts
    |-- Filter to 5 GEOIDs
    |-- Parse shapefile geometry
    v
essentials.geofence_boundaries
    (geo_id, mtfcc='G5420', state='48', source='tiger_unsd_tx_2024')
    |
    | geo_id referenced in districts + migration 261
    v
migration 261_tx_collin_county_school_boards.sql
    |-- 5 governments (state='TX')
    |-- 5 chambers (Board of Trustees)
    |-- 5 districts (district_type='SCHOOL', state='tx')
    |-- ~35 politicians (external_id -880001..-880035)
    |-- ~35 offices (linked to districts via district_id)
    |
    v
essentialsService.ts (no code change needed)
    |-- address lookup -> PostGIS ST_Covers -> geofence_boundaries G5420 row
    |-- district_type='SCHOOL' -> returns SCHOOL section in API response
    v
ev-ui frontend
    SCHOOL section appears alongside LOCAL city council + state + federal
```

### Recommended Project Structure
```
C:/EV-Accounts/backend/
├── scripts/
│   └── load-tx-school-boundaries.ts    (NEW — copy from load-or-school-boundaries.ts)
└── migrations/
    ├── 261_tx_collin_county_school_boards.sql    (NEW — copy structure from 257_ca_city_school_boards.sql)
    └── 262_tx_collin_county_school_headshots.sql (NEW — copy structure from 258_ca_city_school_headshots.sql)
```

### Pattern: Loader Script (from load-or-school-boundaries.ts)

Key substitutions from OR → TX:
```typescript
// Source: C:/EV-Accounts/backend/scripts/load-or-school-boundaries.ts
const TIGER_URL    = 'https://www2.census.gov/geo/tiger/TIGER2024/UNSD/tl_2024_48_unsd.zip'; // 41→48
const MTFCC        = 'G5420';
const STATE        = '48';           // Oregon '41' → Texas '48'
const SOURCE       = 'tiger_unsd_tx_2024';  // or→tx
const EXPECTED_COUNT = 5;            // 6 OR districts → 5 TX ISDs

const TARGET_GEOIDS = new Map<string, string>([
  ['4835100', 'Plano Independent School District'],
  ['4829850', 'McKinney Independent School District'],
  ['4807890', 'Allen Independent School District'],
  ['4820010', 'Frisco Independent School District'],
  ['4837020', 'Richardson Independent School District'],
]);

const baseName = 'tl_2024_48_unsd';         // 41→48
const tmpRoot  = path.join(process.cwd(), '.tmp-tx-school-unsd');  // or→tx
```

### Pattern: Migration SQL (from migration 257)

Key substitutions from CA → TX:
- `state='CA'` → `state='TX'` (governments, offices.representing_state)
- `state='ca'` → `state='tx'` (districts — LOWERCASE)
- Government names: `'[ISD Name], Texas, US'`
- External_id range: -880001..-880035 (was -870001..-870034 in CA)
- Migration version: `257` → `261`
- Pre-flight government name check: 5 TX ISD names
- Pre-flight external_id range check: -880035..-880001
- Pre-flight geofence check: 5 GEOIDs for TX
- Post-verification gates: 5 governments, 5 chambers, 5 SCHOOL districts, ~35 politicians, ~35 offices

### Pattern: Audit-Only Headshot Migration (from migration 258)

```sql
-- Safety guard at top:
DO $$
BEGIN
  RAISE EXCEPTION 'Migration 262 is AUDIT-ONLY and must not be applied. ...';
END $$;

-- Then one INSERT per official (or comment if no photo found):
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -880001),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/' ||
         (SELECT id FROM essentials.politicians WHERE external_id = -880001)::text || '-headshot.jpg',
       'default', 'public_domain'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -880001)
);
```

### Anti-Patterns to Avoid
- **Including slug in chamber INSERT:** `slug` is GENERATED ALWAYS — never include it in the INSERT column list (CRITICAL from STATE.md)
- **Using SCHOOL_DISTRICT:** Must be `district_type='SCHOOL'` — `'SCHOOL_DISTRICT'` breaks essentialsService.ts routing
- **Wrong state casing:** `districts.state` MUST be `'tx'` lowercase; `governments.state` MUST be `'TX'` uppercase; `offices.representing_state` MUST be `'TX'` uppercase
- **Omitting WHERE NOT EXISTS on governments:** `essentials.governments` has NO unique constraint on geo_id — must use WHERE NOT EXISTS guard
- **Adding politician_images without type='default':** UI filters with `.find(img => img.type === 'default')` — wrong type causes silent invisibility
- **Running git in C:/EV-Accounts:** Never run git commands there (project memory: feedback_no_git_in_ev_accounts.md)
- **Using SCHOOL_DISTRICT:** district_type must be 'SCHOOL' exactly

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TIGER shapefile parsing | Custom parser | `shapefile` npm package (already installed) | Handles .shp/.dbf format; already used in load-or-school-boundaries.ts |
| ZIP extraction | Custom unzip | `adm-zip` (already installed) | Already used in OR loader; handles census.gov zip format |
| Geometry insertion | Raw geometry strings | PostGIS `ST_ForcePolygonCCW(ST_SetSRID(ST_Force2D(ST_GeomFromGeoJSON(...)), 4326))` | Same pattern as OR loader |
| School board idempotency | Unique constraint | `WHERE NOT EXISTS` + `ON CONFLICT DO NOTHING` | governments has no unique constraint; established pattern |

---

## Production DB Pre-Flight Results

**Queried 2026-06-02 against production Supabase.**

| Check | Result |
|-------|--------|
| Existing TX ISD governments in essentials.governments | **0 rows** — clean, no conflicts |
| External_id block -880001..-880040 in essentials.politicians | **0 rows** — block is clear |
| TX G5420 rows in essentials.geofence_boundaries (state='48', mtfcc='G5420') | **0 rows** — loader required |

[VERIFIED: direct DB queries via Node.js + DATABASE_URL, 2026-06-02]

---

## External ID Block Allocation Plan

**Block: -880001 through -880035 (approximate)**

| ISD | Members | External_id Range |
|-----|---------|-------------------|
| Plano ISD | 7 | -880001 to -880007 |
| McKinney ISD | 7 | -880008 to -880014 |
| Allen ISD | 7 | -880015 to -880021 |
| Frisco ISD | 7 | -880022 to -880028 |
| Richardson ISD | 7 | -880029 to -880035 |

Total: 35 politicians. Block -880001..-880035.

---

## Common Pitfalls

### Pitfall 1: Richardson ISD Hybrid Seat Structure
**What goes wrong:** Implementer treats Richardson ISD as a standard Place 1-7 ISD and uses `'Board Member, Place [N]'` for all seats.
**Why it happens:** 4 of 5 ISDs use numbered places; Richardson is the exception.
**How to avoid:** Richardson ISD has 5 Single-Member Districts + 2 At-Large Places. Use `'Board Member, District [N]'` for Districts 1-5 and `'Board Member, Place [N]'` for At-Large Places 6-7.
**Warning signs:** Migration runs but office titles look wrong in the UI.

### Pitfall 2: Plano/McKinney/Allen Place Number Ambiguity
**What goes wrong:** Implementer uses inferred place numbers without verifying from the official site.
**Why it happens:** The official board pages render truncated content in automated fetches; place numbers require manual verification from individual profile pages.
**How to avoid:** Before writing migration SQL for Plano, McKinney, and Allen, implementer must manually visit each ISD's trustee profile pages to confirm place-to-name mapping.
**Warning signs:** Section looks wrong in UI (members in wrong "Place N" title).

### Pitfall 3: state='48' vs state='tx' vs state='TX'
**What goes wrong:** Wrong casing on districts.state breaks routing.
**Why it happens:** The conventions differ by table.
**How to avoid:** `geofence_boundaries.state='48'` (FIPS numeric); `districts.state='tx'` (lowercase abbreviation); `governments.state='TX'` (uppercase); `offices.representing_state='TX'` (uppercase).
**Warning signs:** Address lookup returns no SCHOOL section even after migration is applied.

### Pitfall 4: Frisco ISD Crosses County Lines
**What goes wrong:** Implementer tries to clip the Frisco ISD polygon to Collin County.
**Why it happens:** Phase scope is "Collin County" but Frisco ISD extends into Denton County.
**How to avoid:** D-13 explicitly requires the full TIGER polygon. No clipping. Residents in Denton County parts of Frisco ISD territory should see the board.
**Warning signs:** N/A — do not attempt clipping.

### Pitfall 5: UTF-8 Characters in SQL
**What goes wrong:** Debbie Rentería (é character) gets mangled if file is saved as non-UTF-8.
**Why it happens:** Windows defaults to CP1252 on some editors.
**How to avoid:** Save migration 261 as UTF-8 (same note as Phase 87's San José). Verify with a byte check if needed.

### Pitfall 6: GEOID Field Name in Shapefile
**What goes wrong:** Shapefile uses 'GEOID' field but loader looks for wrong field name.
**Why it happens:** Different TIGER layers use different field names.
**How to avoid:** The OR loader already logs field names on the first feature (diagnostic step). The TX loader should do the same. TIGER UNSD confirmed uses 'GEOID' per load-or-school-boundaries.ts source comment.

### Pitfall 7: McKinney ISD Place 4 Name Uncertainty
**What goes wrong:** Migration uses wrong name for McKinney Place 4.
**Why it happens:** Name "Roxane Morrison" for Place 4 was sourced from a search summary, not directly from the official page.
**How to avoid:** Confirm Roxane Morrison on mckinneyisd.net/page/board-of-trustees before migration. Confidence is ASSUMED.

---

## Code Examples

### Loader Script: CONFIG section
```typescript
// Source: adapted from C:/EV-Accounts/backend/scripts/load-or-school-boundaries.ts
const TIGER_URL    = 'https://www2.census.gov/geo/tiger/TIGER2024/UNSD/tl_2024_48_unsd.zip';
const MTFCC        = 'G5420';
const STATE        = '48';
const SOURCE       = 'tiger_unsd_tx_2024';
const EXPECTED_COUNT = 5;

const TARGET_GEOIDS = new Map<string, string>([
  ['4835100', 'Plano Independent School District'],
  ['4829850', 'McKinney Independent School District'],
  ['4807890', 'Allen Independent School District'],
  ['4820010', 'Frisco Independent School District'],
  ['4837020', 'Richardson Independent School District'],
]);

const baseName = 'tl_2024_48_unsd';
const tmpRoot  = path.join(process.cwd(), '.tmp-tx-school-unsd');
```

### Migration 261: Pre-flight Blocks
```sql
-- Pre-flight 1: Government names not already present
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name IN (
        'Plano Independent School District, Texas, US',
        'McKinney Independent School District, Texas, US',
        'Allen Independent School District, Texas, US',
        'Frisco Independent School District, Texas, US',
        'Richardson Independent School District, Texas, US'
      )) > 0 THEN
    RAISE EXCEPTION 'Migration 261 already applied — aborting re-run';
  END IF;
END $$;

-- Pre-flight 2: External_id block is clear
DO $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM essentials.politicians
  WHERE external_id BETWEEN -880035 AND -880001;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: external_id block -880001..-880035 is not clear (% rows found)', v_count;
  END IF;
END $$;

-- Pre-flight 3: All 5 G5420 geofences exist (loader must run first)
DO $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM essentials.geofence_boundaries
  WHERE geo_id IN ('4835100','4829850','4807890','4820010','4837020')
    AND mtfcc = 'G5420';
  IF v_count <> 5 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: expected 5 G5420 geofence rows, found % (run load-tx-school-boundaries.ts first)', v_count;
  END IF;
END $$;
```

### Migration 261: Richardson ISD Sample Block (hybrid district structure)
```sql
-- District 3 trustee example (Single-Member District)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Debbie Rentería', 'Debbie', 'Rentería', NULL,
          true, false, false, true, -880031)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Board of Trustees'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'Richardson Independent School District, Texas, US')),
       p.id,
       'Board Member, District 3', 'TX', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '4837020'
  AND d.district_type = 'SCHOOL'
  AND d.state = 'tx'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

### Post-Verification Gate in Migration 261
```sql
DO $$
DECLARE
  v_gov_count     INTEGER;
  v_chamber_count INTEGER;
  v_dist_count    INTEGER;
  v_pol_count     INTEGER;
  v_off_count     INTEGER;
  v_split_count   INTEGER;
  v_null_count    INTEGER;
BEGIN
  -- Gate (a): 5 government rows
  SELECT COUNT(*) INTO v_gov_count FROM essentials.governments
  WHERE name IN (
    'Plano Independent School District, Texas, US',
    'McKinney Independent School District, Texas, US',
    'Allen Independent School District, Texas, US',
    'Frisco Independent School District, Texas, US',
    'Richardson Independent School District, Texas, US'
  );
  IF v_gov_count <> 5 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 5 government rows, found %', v_gov_count;
  END IF;

  -- Gate (c): 5 SCHOOL district rows
  SELECT COUNT(*) INTO v_dist_count FROM essentials.districts
  WHERE district_type = 'SCHOOL' AND state = 'tx'
    AND geo_id IN ('4835100','4829850','4807890','4820010','4837020');
  IF v_dist_count <> 5 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 5 SCHOOL district rows, found %', v_dist_count;
  END IF;

  -- Gate (d): 35 politicians in range
  SELECT COUNT(*) INTO v_pol_count FROM essentials.politicians
  WHERE external_id BETWEEN -880035 AND -880001;
  IF v_pol_count <> 35 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 35 politicians, found %', v_pol_count;
  END IF;

  -- Gate (f): Section-split check
  SELECT COUNT(*) INTO v_split_count
  FROM essentials.geofence_boundaries gb
  WHERE gb.geo_id IN ('4835100','4829850','4807890','4820010','4837020')
    AND gb.mtfcc = 'G5420'
    AND NOT EXISTS (
      SELECT 1 FROM essentials.districts d
      WHERE d.geo_id = gb.geo_id AND d.district_type = 'SCHOOL' AND d.state = 'tx'
    );
  IF v_split_count <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: section-split returned % orphan rows', v_split_count;
  END IF;

  RAISE NOTICE 'Migration 261 post-verification PASSED';
END $$;
```

---

## Headshot Availability Summary

| ISD | Photos Available | Source URL Pattern | Quality |
|-----|-----------------|-------------------|---------|
| Plano ISD | Likely yes (Finalsite CMS) | resources.finalsite.net (individual profile pages) | [ASSUMED: unconfirmed; check each profile] |
| McKinney ISD | Likely yes (Thrillshare CMS) | Unknown — check mckinneyisd.net/page/board-of-trustees | [ASSUMED: unconfirmed] |
| Allen ISD | Unknown | Check allenisd.org/page/board-of-trustees | [ASSUMED: unconfirmed] |
| Frisco ISD | YES — all 7 confirmed | `https://www.friscoisd.org/images/default-source/board-members/[lastname].jpg?sfvrsn=[ver]` | [VERIFIED: from friscoisd.org] |
| Richardson ISD | YES — all 7 confirmed | `https://web.risd.org/board/wp-content/uploads/[FirstNameLastInitial].jpg` | [VERIFIED: from web.risd.org] |

**Headshot processing reminder (from project memory):** Crop to 4:5 ratio FIRST, THEN resize to 600x750 — never stretch directly. Lanczos, q90. type='default' in politician_images.

---

## Canonical Reference Files (must-read before implementing)

1. **`C:/EV-Accounts/backend/scripts/load-or-school-boundaries.ts`** — Template for `load-tx-school-boundaries.ts`. Read fully before coding.
2. **`C:/EV-Accounts/backend/migrations/257_ca_city_school_boards.sql`** — Template for migration 261. Read fully before coding.
3. **`C:/EV-Accounts/backend/migrations/258_ca_city_school_headshots.sql`** — Template for migration 262.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| districts.state='SCHOOL_DISTRICT' | districts.state='SCHOOL' | Phase 62 LAUSD | Wrong type breaks essentialsService routing |
| Including slug in chamber INSERT | Never include slug — GENERATED ALWAYS | Established in migration 196+ | INSERT fails with generated column error |
| Positive external_ids for school board members | Negative external_ids (-880xxx) | Phase 86 established pattern | Avoids collision with city council positive IDs |
| offices.photo_origin_url | Column does not exist | Discovered Phase 63 | Never add this column — use politician_images |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Plano ISD Places 4-7 name-to-place assignment (Michael Cook, Tarrah Lantz, Elisa Klein, Katherine Goodwin) | Board Roster — Plano | Wrong "Place N" in office title; office displays incorrect label |
| A2 | McKinney ISD Place 4 = Roxane Morrison | Board Roster — McKinney | Wrong politician in migration; must be corrected before applying |
| A3 | Plano ISD has headshot photos on Finalsite CDN (resources.finalsite.net) | Headshot Availability | No photos = zero headshots in migration 262; not a blocking issue |
| A4 | McKinney ISD has headshot photos on official board page | Headshot Availability | No photos = zero headshots in migration 262; not a blocking issue |
| A5 | Allen ISD has headshot photos on official board page | Headshot Availability | No photos = zero headshots in migration 262; not a blocking issue |
| A6 | Allen ISD Place 7 = Bill Parker (elected May 2023) | Board Roster — Allen | Wrong politician in migration; must be corrected before applying |
| A7 | Frisco ISD Mark Hill = Board Secretary, Place 5 (post-May 2026) | Board Roster — Frisco | Officer titles change per year; title in migration SQL is 'Board Member, Place 5' regardless |

---

## Open Questions (RESOLVED)

1. **Plano ISD individual profile page photos** -- [RESOLVED in Plan 02]
   - What we know: Finalsite CMS; individual profile page URLs exist
   - What's unclear: Exact photo CDN URL and whether photos are headshots vs. group photos
   - Recommendation: Implementer visits each of 7 profile pages at pisd.edu/about-our-district/board-of-trustees/trustee-profiles/[name]-profile to extract photo URLs
   - **Resolution (Plan 02):** All 7 Plano ISD profile pages at pisd.edu had rectangular headshot photos via Finalsite CDN. All 7 uploaded successfully (external_ids -880001..-880007).

2. **McKinney ISD Place 4 trustee name** -- [RESOLVED in Plan 02]
   - What we know: Board had a May 2025 election for Places 1, 2, 3, 7; Place 4 not up for election; name "Roxane Morrison" from secondary sources only
   - What's unclear: Confirmed name for Place 4
   - Recommendation: Implementer must visit mckinneyisd.net/page/board-of-trustees and read the full board member listing before writing the Place 4 SQL block
   - **Resolution (Plan 02):** Roxane Morrison confirmed as Place 4 on official mckinneyisd.net page. Migration 261 name is correct. Morrison had no photo on the official board page; she is the one McKinney no-photo official (external_id -880011, documented in migration 262 audit).

3. **Frisco ISD board composition after May 2026 election** -- [RESOLVED in Plan 01]
   - What we know: Suresh Manduva, Renee Sample, Stephanie Elad won Places 1, 2, 3 in May 2026; the meet-the-board page was confirmed from friscoisd.org
   - What's unclear: Whether Misty Wamhoff is still listed (she appeared in pre-election sources for Place 5) vs. Mark Hill
   - Recommendation: Confirm on friscoisd.org/about/board-of-trustees/meet-the-board at implementation time (implementation is post-May 2026 election)
   - **Resolution (Plan 01):** Mark Hill confirmed as Board Secretary, Place 5 on the current friscoisd.org meet-the-board page. Misty Wamhoff is no longer listed. The 7-member roster in migration 261 is current.


## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js + tsx | load-tx-school-boundaries.ts | Assumed yes | pre-existing | — |
| shapefile npm pkg | Loader script | Yes | pre-installed | — |
| adm-zip npm pkg | Loader script | Yes | pre-installed | — |
| census.gov UNSD download | Loader script | Yes | tl_2024_48_unsd.zip confirmed | — |
| Supabase MCP | migration 261 | Yes | mcp__supabase-local = production | — |
| DATABASE_URL env var | Loader script | Yes | In .env at C:/EV-Accounts/backend | Run loader from that directory |
| Python + PIL | Headshot processing | Assumed yes | Used in Phase 87 | — |

**Run loader from:** `C:/EV-Accounts/backend` (not `C:/EV-Accounts`) — dotenv looks for `.env` in cwd.

---

## Validation Architecture

*(No automated test framework configured for this phase; migration has built-in post-verification DO block.)*

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Verification Method |
|--------|----------|-----------|---------------------|
| TX-SCHOOL-01 | Plano ISD board visible for Plano resident | Smoke test | PostGIS query: SELECT * FROM essentials.geofence_boundaries WHERE ST_Covers(geometry, ST_SetSRID(ST_Point(-96.6989, 33.0198), 4326)) AND mtfcc='G5420' |
| TX-SCHOOL-02 | McKinney ISD board visible for McKinney resident | Smoke test | PostGIS query with McKinney coordinate |
| TX-SCHOOL-03 | Allen ISD board visible for Allen resident | Smoke test | PostGIS query with Allen coordinate |
| TX-SCHOOL-04 | Frisco ISD board visible for Frisco resident | Smoke test | PostGIS query with Frisco coordinate |
| TX-SCHOOL-05 | Richardson ISD board visible for Richardson resident | Smoke test | PostGIS query with Richardson coordinate |
| All | Section-split = 0 | DB assertion | Built into migration 261 post-verification DO block |

### Suggested Test Coordinates
| ISD | Test Address Area | Approx Coordinate |
|-----|-------------------|-------------------|
| Plano ISD | Downtown Plano | (-96.6989, 33.0198) |
| McKinney ISD | Downtown McKinney | (-96.6155, 33.1976) |
| Allen ISD | Allen City Hall area | (-96.6706, 33.1032) |
| Frisco ISD | Frisco City Hall area | (-96.8236, 33.1501) |
| Richardson ISD | Downtown Richardson | (-96.7298, 32.9482) |

---

## Security Domain

No new authentication, input validation, or cryptography concerns in this phase. The loader and migration follow established patterns with no new attack surface. No user-facing input; no secrets beyond the existing DATABASE_URL.

---

## Sources

### Primary (HIGH confidence)
- TIGERweb REST API (`https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/School/MapServer/10`) — 5 TX GEOID lookups, all confirmed 2026-06-02
- `https://www2.census.gov/geo/tiger/TIGER2024/UNSD/` — tl_2024_48_unsd.zip existence confirmed 2026-06-02
- `https://www.friscoisd.org/about/board-of-trustees/meet-the-board` — full 7-member Frisco roster + photo URL pattern, 2026-06-02
- `https://web.risd.org/board/members/` — full 7-member Richardson roster, 2026-06-02
- `https://web.risd.org/board/chris-poteet/` — Richardson photo URL pattern confirmed, 2026-06-02
- `C:/EV-Accounts/backend/scripts/load-or-school-boundaries.ts` — canonical loader pattern
- `C:/EV-Accounts/backend/migrations/257_ca_city_school_boards.sql` — canonical migration structure
- `C:/EV-Accounts/backend/migrations/258_ca_city_school_headshots.sql` — canonical audit-only headshot migration
- Production DB direct query — pre-flight checks confirmed 2026-06-02

### Secondary (MEDIUM confidence)
- `https://www.pisd.edu/about-our-district/board-of-trustees` — Plano ISD 7 names + officer titles confirmed; Place numbers for 4-7 inferred from election records
- WebSearch election results (May 2025): Plano Place 1/2/3, McKinney Places 1/2/3/7, Allen Places 4/5
- `https://web.risd.org/board/members/` — Richardson 7 names + district/at-large structure
- WebSearch Ballotpedia/Community Impact articles — McKinney Places 5/6

### Tertiary (LOW / ASSUMED confidence)
- McKinney Place 4 = Roxane Morrison (from search summary only — must verify on official page)
- Allen ISD Places 1/2/3 = Sarah Mitchell/Veronica Yost/John Holley (from Ballotpedia election history)
- Allen ISD Place 7 = Bill Parker (from May 2023 election results)
- Plano ISD Place 4-7 assignments (names confirmed; place numbers inferred)

---

## Metadata

**Confidence breakdown:**
- TIGER GEOIDs: HIGH — verified directly via TIGERweb REST API
- Loader script changes: HIGH — direct copy+edit of OR template
- Migration 261 structure: HIGH — direct copy+edit of migration 257 template
- Frisco ISD roster: HIGH — verified from official site
- Richardson ISD roster: HIGH — verified from official site
- Plano ISD roster (names): HIGH; Place 4-7 assignments: MEDIUM/ASSUMED
- McKinney ISD roster: MEDIUM; Place 4 name: ASSUMED
- Allen ISD roster: MEDIUM — assembled from election records
- Headshot availability (Frisco/Richardson): HIGH; others: ASSUMED
- Production DB pre-flights: HIGH — verified by direct DB query

**Research date:** 2026-06-02
**Valid until:** 2026-07-02 (board membership changes at election time; next TX ISD elections May 2027 for most seats)
