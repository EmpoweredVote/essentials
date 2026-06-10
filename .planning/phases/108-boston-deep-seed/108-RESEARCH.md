# Phase 108: Boston Deep Seed - Research

**Researched:** 2026-06-10
**Domain:** Boston city government structure, school committee governance, geofence strategy, SQL migration patterns
**Confidence:** HIGH (all critical facts verified against official sources)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** 3 plans — Plan 01: City government structure (Mayor + councillors), Plan 02: School Committee, Plan 03: Headshots
- **D-02:** Starting migration: 347
- **D-05:** G5420 geofence(s) inserted directly in Plan 02 migration — no MA G5420 loader
- **D-08:** External ID scheme: Mayor Wu = `-2507000001`, Councillors = `-2507000002` through `-2507000014`
- **D-09:** Mayor Wu is LOCAL_EXEC district_type; Councillors are LOCAL district_type
- **D-10:** `districts.state = 'ma'` (lowercase) for LOCAL, LOCAL_EXEC, SCHOOL
- **D-11:** `governments.state = 'MA'` (uppercase); `offices.representing_state = 'MA'` (uppercase)
- **D-12:** `mtfcc=NULL` on LOCAL and LOCAL_EXEC district rows
- **D-13:** `slug` is GENERATED ALWAYS on essentials.chambers — never include in INSERT
- **D-14:** `essentials.governments` has no unique constraint on geo_id — WHERE NOT EXISTS guard required
- **D-15:** `party=NULL` on all politicians
- **D-16:** `is_appointed=false, is_appointed_position=false` for elected officials
- **D-17:** `politician_images.type = 'default'`
- **D-18:** Boston geo_id='2507000' (G4110) already in geofence_boundaries — assert, do NOT re-insert
- **D-19:** Boston government row name: `'City of Boston, Massachusetts, US'`
- **D-20:** `geofence_boundaries.state = '25'` (FIPS numeric string for Massachusetts)
- **D-21:** Headshot sources: `boston.gov/city-council` (council), `bostonpublicschools.org` (school committee)
- **D-22:** 600×750, Lanczos, q90; crop 4:5 ratio first — never stretch
- **D-23:** Best-effort for school committee members — document gaps for officials without findable photos

### Claude's Discretion
- **D-03:** Researcher determines School Committee election topology (at-large vs hybrid)
- **D-04:** Researcher finds BPS TIGER UNSD geo_id
- **D-06:** Researcher confirms `election_method` values for both chambers

### Deferred Ideas (OUT OF SCOPE)
- Compass stances for Mayor Wu, councillors, school committee — deferred to Phase 111+
- MA elections (race rows, discovery pipeline) — deferred to Phase 110
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MA-DEEP-01 | Boston address returns LOCAL section with Mayor Wu + all 13 Boston City Councillors | City gov structure migration (Plan 01) seeds 1 Mayor + 13 Councillors (4 at-large + 9 district) under Boston geo_id |
| MA-DEEP-02 | All Boston city officials + School Committee have headshots at 600×750 in Supabase Storage | Plan 03 headshot migration using verified boston.gov URL patterns |
| MA-DEEP-03 | Boston School Committee members seeded with SCHOOL district type, appear for Boston address | Plan 02 seeds 7 appointed members under SCHOOL district with BPS geo_id='2502790' |
</phase_requirements>

---

## Summary

Phase 108 seeds the City of Boston's government structure (Mayor Wu + 13 City Councillors + 7 School Committee members) with headshots so any Boston address returns a complete LOCAL and SCHOOL section. Research uncovered **two critical corrections** to the CONTEXT.md assumptions that fundamentally change the plan structure.

**Correction 1 — City Council structure (D-07 is wrong):** The CONTEXT.md states Boston uses an all-at-large model (13 at-large councillors). This is incorrect. Boston City Council has **9 single-member district seats + 4 at-large seats** since 1982. District councillors require per-district geofences loaded from the City's ArcGIS FeatureServer before politicians can be linked to individual districts. This is the same pattern as Portland OR (Phase 76+).

**Correction 2 — School Committee is appointed, not elected, and has 7 members (not 13):** The CONTEXT.md Phase description states "13 elected members since November 2024 ballot measure (Question 5)." This is factually incorrect on all counts. (a) The committee has 7 members, not 13. (b) Members are appointed by the Mayor, not elected. (c) No 2024 ballot measure converted it to elected status. A 2023 Home Rule Petition passed the City Council but was vetoed by Mayor Wu. A new petition was introduced in January 2025 and passed the City Council in May 2025, but it requires the state legislature and a voter referendum before taking effect — none of which has happened. The committee is APPOINTED as of 2026-06-10.

**Primary recommendation:** Add a Plan 00 (or fold into Plan 01) to load Boston council district geofences from ArcGIS before seeding politicians. Treat School Committee as 7 appointed members following the ACPS pattern, with `is_appointed=true, is_appointed_position=false` (appointed but publicly-accountable governing body). Revise D-07 to reflect the hybrid council structure.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Boston city government row | Database / Storage | — | SQL migration inserts into essentials.governments |
| City Council chamber row | Database / Storage | — | SQL migration, part of Plan 01 |
| Council district geofences (9 districts) | Database / Storage | API / Backend | ArcGIS GeoJSON loader script (TypeScript), same pattern as Portland OR |
| LOCAL_EXEC district (Mayor, citywide) | Database / Storage | — | geo_id='2507000', mtfcc=NULL |
| LOCAL at-large district (4 at-large seats) | Database / Storage | — | geo_id='2507000', mtfcc=NULL, shared with Mayor's geofence |
| LOCAL district rows (9 per-district seats) | Database / Storage | — | geo_id='boston-ma-council-district-{N}', mtfcc='X0013' |
| School Committee SCHOOL district + G5420 geofence | Database / Storage | — | Direct INSERT in Plan 02 migration (no TIGER UNSD loader) |
| Headshot storage | CDN / Static | Database / Storage | Supabase Storage (politician_photos bucket) + politician_images rows |
| Headshot sourcing | API / Backend | — | boston.gov Drupal image files (no auth required) |

---

## CRITICAL CORRECTIONS TO CONTEXT.MD

The following CONTEXT.md assumptions are factually wrong and MUST be corrected before planning:

### Correction 1: D-07 — City Council is NOT all at-large

**CONTEXT.md says:** "Boston City Council is at-large — all 13 councillors represent the whole city. No per-district geofences needed."

**ACTUAL STRUCTURE (verified from boston.gov):** [VERIFIED: boston.gov/departments/city-council]
- 4 **at-large** councillors representing the whole city
- 9 **district** councillors representing single-member geographic districts (Districts 1–9)
- District boundaries were redrawn in 2023, effective 2023 municipal election

**Planning impact:**
- 9 per-district geofences must be loaded before district politicians can be linked to districts
- A new ArcGIS boundary loader script (like `load-portland-council-boundaries.ts`) is needed
- This adds a Plan 00 (or moves into Plan 01 scope as an additional task)
- External ID scheme D-08 must assign councillors to the correct district (4 at-large link to geo_id='2507000', 9 district link to 'boston-ma-council-district-{N}')
- Next available mtfcc code for Boston council districts: `X0013`
- D-12 (mtfcc=NULL on LOCAL districts) applies ONLY to the at-large and LOCAL_EXEC districts, NOT to the 9 per-district geofences which use mtfcc='X0013'

### Correction 2: School Committee has 7 APPOINTED members (not 13 elected)

**CONTEXT.md says:** "Boston School Committee: 13 elected members since November 2024 ballot measure (previously appointed); district_type=SCHOOL"

**ACTUAL STATUS (verified from bostonpublicschools.org, boston.gov, WBUR 2026-01-05):** [VERIFIED: official sources]
- **7 voting members**, all appointed by the Mayor
- **Not elected** — appointed model established 1991
- The 2023 Home Rule petition passed City Council but was vetoed by Wu
- A new Home Rule petition passed City Council in May 2025 (8-4 vote); now requires MA legislature approval + Boston voter referendum — NOT yet law
- There is NO elected school committee as of 2026-06-10

**Current 7 members (as of 2026-06-10):** [VERIFIED: bostonpublicschools.org/school-committee/about/members]
1. Jeri Robinson — Chair
2. Rachel Skerritt — Vice Chair (appointed Aug 2025)
3. Dr. Stephen Alkins (reappointed Jan 2026)
4. Rafaela Polanco Garcia
5. Franklin Peralta (appointed Jan 2026)
6. Lydia Torres (appointed Jan 2026)
7. Quoc Tran

**Note on "Mah Noor":** Listed on the BPS members page but is a non-voting student representative (Boston Student Advisory Council member, current Brighton High School junior). Do NOT seed as a politician.

**Planning impact:**
- Seed 7 politicians (not 13)
- `is_appointed=true` on all 7 politicians (appointed by Mayor)
- `is_appointed_position=false` (the position itself is a public-facing governing role, not bureaucratic; consistent with how appointed school committees are handled in this project)
- The SCHOOL district has 7 offices, not 13
- Election method = `NULL` (no election)
- No sub-district geofences needed (single SCHOOL district, ACPS pattern)
- D-03 from CONTEXT.md is resolved: it's the simple at-large ACPS pattern

---

## Standard Stack

No new external libraries. This phase uses the established migration + TypeScript loader stack.

### Core

| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| Supabase MCP (`mcp__supabase-local`) | N/A | Apply SQL migrations to production DB | Project standard since v1.0 |
| TypeScript + tsx | Project version | ArcGIS boundary loader script | Matches all existing `load-*-council-boundaries.ts` scripts |
| PostgreSQL (Supabase) | 15.x | DB writes (governments, chambers, districts, offices, politicians) | Project standard |
| `pg` npm package | Project version | DB connection in loader scripts | Standard across all loader scripts |

### No New Packages Required

All dependencies already installed in C:/EV-Accounts/backend. The Boston council boundary loader follows the exact same pattern as `load-portland-council-boundaries.ts`.

---

## Package Legitimacy Audit

> No new packages required for this phase. All tooling already installed.

N/A — Skipped (no new packages).

---

## Architecture Patterns

### System Architecture Diagram

```
[ArcGIS FeatureServer]                 [boston.gov / bostonpublicschools.org]
     (9 district polygons)                    (headshot images)
           |                                         |
           v                                         v
[load-boston-council-boundaries.ts]    [Manual download + ImageMagick crop/resize]
     (new script, X0013 mtfcc)              (600x750, 4:5, Lanczos q90)
           |                                         |
           v                                         v
[geofence_boundaries (9 X0013 rows)]   [Supabase Storage politician_photos bucket]
           |                                         |
           v                                         v
[Migration 347: governments +          [Migration 349: politician_images rows]
 chambers + districts +                     (type='default', photo_license='public_domain')
 politicians + offices]
  - 1 government (City of Boston)
  - 2 chambers (City Council, School Committee)
  - 12 district rows:
    * 1 LOCAL_EXEC (Mayor, geo_id='2507000')
    * 1 LOCAL at-large (4 councillors, geo_id='2507000')
    * 9 LOCAL district (geo_id='boston-ma-council-district-{N}')
    * 1 SCHOOL (geo_id='2502790')
  - 21 politicians (1 Mayor + 13 councillors + 7 SC members)
  - 21 offices
```

### Recommended File Structure (new files)

```
C:/EV-Accounts/backend/
├── scripts/
│   └── load-boston-council-boundaries.ts    # new: 9 district geofences, X0013
├── migrations/
│   ├── 347_boston_council_district_geofences.sql   # (or loader-only, no migration needed)
│   ├── 347_boston_government.sql                   # Plan 01 (or 347 if loader is folded in)
│   ├── 348_boston_school_committee.sql             # Plan 02
│   └── 349_boston_headshots.sql                    # Plan 03
```

**Note on numbering:** If a loader script is used, it writes directly to geofence_boundaries with no migration ledger entry (matching Portland pattern). Migration numbering starts at 347 for the first government structure migration.

### Pattern 1: Boston Council District Geofences (new loader script)

**What:** TypeScript script fetching 9 district polygons from Boston's ArcGIS FeatureServer, inserting into geofence_boundaries with mtfcc='X0013'.

**Source:** `https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/CityCouncilDistricts_2023_5_25/FeatureServer/0/query` [VERIFIED: data.boston.gov dataset page]

**Key fields from FeatureServer:** `DISTRICT` (integer 1-9), `Councilor` (current name), `LONGNAME`, `SHORTNAME`. Spatial reference: Web Mercator (wkid 102100/3857) — MUST use `outSR=4326`.

**geo_id pattern:** `'boston-ma-council-district-{N}'` (N = 1..9). The `-ma-` qualifier prevents namespace collision with any future Portland-Boston homonym issue.

**mtfcc:** `X0013` (next available after X0012=Portland OR). [VERIFIED: load-portland-council-boundaries.ts comment "Next available is X0013"]

```typescript
// Source: load-portland-council-boundaries.ts pattern
const ARCGIS_URL = 'https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/CityCouncilDistricts_2023_5_25/FeatureServer/0/query';
const MTFCC      = 'X0013';
const STATE      = '25';     // MA FIPS (geofence_boundaries.state — NOT 'MA' or 'ma')
const EXPECTED_COUNT = 9;

// Query pattern: ?where=DISTRICT%3D{N}&outFields=DISTRICT,Councilor&outSR=4326&f=geojson
// NOTE: Test bulk fetch (where=1=1) first; if it returns all 9, use it.
// If silent truncation occurs (Portland OR lesson), fetch per-DISTRICT individually.
```

### Pattern 2: Government + Chamber Structure (Plan 01 migration)

Follows `312_alexandria_government.sql` exactly, adapted for Boston:

```sql
-- Source: C:/EV-Accounts/backend/migrations/312_alexandria_government.sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'City of Boston, Massachusetts, US',
       'LOCAL', 'MA', 'Boston', '2507000'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'City of Boston, Massachusetts, US'
);
```

**Districts:**
- 1 LOCAL_EXEC district: `geo_id='2507000', mtfcc=NULL, state='ma', label='Boston (Citywide)'`
- 1 LOCAL district (at-large): `geo_id='2507000', mtfcc=NULL, state='ma', label='Boston (At-Large)'`
- 9 LOCAL districts (per-district): `geo_id='boston-ma-council-district-{N}', mtfcc='X0013', state='ma', label='District N'` — reference the geofences loaded by the loader script

**Offices:**
- Mayor Wu → LOCAL_EXEC district, title='Mayor'
- 4 at-large councillors → LOCAL at-large district, title='City Councillor'
- 9 district councillors → respective LOCAL district-{N} rows, title='City Councillor'

**Election method:** [VERIFIED: Wikipedia Boston City Council + WebSearch results]
- At-large chamber: `'plurality_at_large'` (4 seats elected citywide by plurality)
- District chamber: `'fptp'` (9 single-member districts, first-past-the-post)
- NOTE: Boston City Council passed an RCV Home Rule Petition in May 2025, but it has NOT taken effect (requires MA legislature + voter referendum). Use current method.

**Chamber design:** One chamber "City Council" covers ALL 13 seats (both at-large and district). This is the simplest approach consistent with how this project models other cities. OR alternatively: two chambers "City Council (At-Large)" and "City Council (District)". The planner should choose; the single-chamber approach is simpler and matches Cambridge.

### Pattern 3: Boston School Committee (Plan 02 migration)

Follows `313_acps_school_board.sql` pattern adapted for BPS:

```sql
-- Source: C:/EV-Accounts/backend/migrations/313_acps_school_board.sql
-- BPS TIGER UNSD geo_id = '2502790' (MA FIPS=25, LEAID=02790)
-- geofence_boundaries.state = '25' (Massachusetts FIPS)
-- districts.state = 'ma' (lowercase)
-- is_appointed = true (mayor-appointed committee members)

INSERT INTO essentials.geofence_boundaries (geo_id, mtfcc, state)
SELECT '2502790', 'G5420', '25'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.geofence_boundaries
  WHERE geo_id = '2502790' AND mtfcc = 'G5420'
);
```

External ID range: `-2502790001` through `-2502790007` (7 members)

**`is_appointed` flag:** This is a nuanced point. The 7 members are mayor-appointed. The CONTEXT.md D-16 states `is_appointed=false` for "all (Mayor, councillors, school committee are all voter-elected in current model)" — but this is based on the incorrect assumption that the committee is elected. The current committee is APPOINTED. Research recommendation: use `is_appointed=true` to accurately reflect how these members enter office. (This matches the semantic intent of the flag.) However, D-16 is a locked decision that said `is_appointed=false`. The planner should review this discrepancy — since D-16 was predicated on wrong information, the planner may need to override it.

### Anti-Patterns to Avoid

- **Single LOCAL district for all 13 councillors (D-07 error pattern):** Boston is NOT like Alexandria (pure at-large). Must model 9 district seats with per-district geofences.
- **Seeding school committee as 13 elected members:** Committee is 7 appointed members. No election, no sub-districts.
- **Including Mah Noor as a school committee member:** She is the non-voting student rep. Do NOT seed.
- **Including "Lena Parvex" as a school committee member:** She is the Executive Secretary (staff role). Do NOT seed.
- **Using `is_appointed_position=true` for school committee members:** They govern a public school system — this flag is for purely bureaucratic/staff positions. Use `false`.
- **Bulk ArcGIS query without testing:** Check if `where=1=1` returns all 9 features before assuming it works (Portland OR had silent truncation at 3 features).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Boston council district geofences | Manual PostGIS INSERT with hardcoded GeoJSON | `load-boston-council-boundaries.ts` (new TypeScript loader) | Polygons are large; ArcGIS source is authoritative and already GeoJSON-ready |
| BPS SCHOOL geofence | TIGER UNSD loader (doesn't exist for MA) | Direct INSERT into geofence_boundaries (no polygon needed for routing — geo_id match is sufficient) | Same as ACPS pattern; no loader exists; BPS boundary = entire Boston |
| Photo processing | Custom resize script | ImageMagick or Pillow: crop 4:5 first, resize 600x750 Lanczos q90 | Established project standard across all phases |

**Key insight:** The project uses geo_id matching (not PostGIS polygon intersection) for SCHOOL districts — BPS covers all of Boston, so geo_id='2502790' matching is sufficient without a real polygon. Direct INSERT with no geometry (or geometry=NULL) is correct per ACPS precedent.

---

## Current Roster (Verified)

### Mayor

| Role | Name | External ID | District/Type |
|------|------|-------------|---------------|
| Mayor | Michelle Wu | -2507000001 | LOCAL_EXEC, geo_id='2507000' |

[VERIFIED: boston.gov/departments/mayors-office/michelle-wu — current Mayor as of 2026-06-10]

### Boston City Councillors (13 total)

**At-Large (4 seats):** [VERIFIED: boston.gov/departments/city-council — current 2026-2027 roster]

| Name | External ID | District |
|------|-------------|---------|
| Ruthzee Louijeune | -2507000002 | At-Large |
| Julia M. Mejia | -2507000003 | At-Large |
| Erin J. Murphy | -2507000004 | At-Large |
| Henry Santana | -2507000005 | At-Large |

**District (9 seats):** [VERIFIED: boston.gov/departments/city-council]

| Name | External ID | District | Geo ID |
|------|-------------|---------|--------|
| Gabriela Coletta Zapata | -2507000006 | District 1 | boston-ma-council-district-1 |
| Edward M. Flynn | -2507000007 | District 2 | boston-ma-council-district-2 |
| John FitzGerald | -2507000008 | District 3 | boston-ma-council-district-3 |
| Brian Worrell | -2507000009 | District 4 | boston-ma-council-district-4 |
| Enrique J. Pepén | -2507000010 | District 5 | boston-ma-council-district-5 |
| Benjamin J. Weber | -2507000011 | District 6 | boston-ma-council-district-6 |
| Miniard Culpepper | -2507000012 | District 7 | boston-ma-council-district-7 |
| Sharon Durkan | -2507000013 | District 8 | boston-ma-council-district-8 |
| Liz Breadon (President) | -2507000014 | District 9 | boston-ma-council-district-9 |

**Note on Council President:** Liz Breadon holds the title "City Council President" but is elected from District 9. Her office title should be `'City Councillor'` (not 'President') per the Alexandria pattern where procedural titles are not separate offices. Alternatively use `role_canonical='president'` if that column exists and is used.

**Note on Enrique J. Pepén:** The name contains an accent (é). Profile URL uses `enrique-j-pepen` (no accent). In SQL use the full name with accent: `'Enrique J. Pepén'`. Same n-tilde precedent as Peña-Melnyk (MD).

### Boston School Committee (7 voting members) [VERIFIED: bostonpublicschools.org/school-committee/about/members, 2026-06-10]

| Name | External ID | Title | District |
|------|-------------|-------|---------|
| Jeri Robinson | -2502790001 | School Committee Chair | SCHOOL, geo_id='2502790' |
| Rachel Skerritt | -2502790002 | School Committee Vice Chair | SCHOOL, geo_id='2502790' |
| Dr. Stephen Alkins | -2502790003 | School Committee Member | SCHOOL, geo_id='2502790' |
| Rafaela Polanco Garcia | -2502790004 | School Committee Member | SCHOOL, geo_id='2502790' |
| Franklin Peralta | -2502790005 | School Committee Member | SCHOOL, geo_id='2502790' |
| Lydia Torres | -2502790006 | School Committee Member | SCHOOL, geo_id='2502790' |
| Quoc Tran | -2502790007 | School Committee Member | SCHOOL, geo_id='2502790' |

**is_appointed flag:** All 7 are mayor-appointed. D-16 was written assuming elected — planner must decide whether to override D-16 for SC members.

---

## BPS TIGER UNSD geo_id

**Confirmed:** `2502790` [VERIFIED: NCES CCD district search at nces.ed.gov/ccd/districtsearch/district_detail.asp?DistrictID=2502790]

**Construction:** Census TIGER UNSD GEOID = State FIPS (2 digits) + NCES LEAID (5 digits)
- MA FIPS = `25`
- Boston Public Schools LEAID = `02790`
- TIGER UNSD geo_id = `2502790`

This exactly mirrors the ACPS pattern: Virginia FIPS=51, LEAID=00090, geo_id='5100090'. [CITED: NCES documentation on GEOID structure]

**Validation:** The ArcGIS FeatureServer confirms LEAID 2502790 is the Boston district identifier used federally. Cross-confirmed via NCES district search URL parameter `DistrictID=2502790`.

---

## Boston Council District ArcGIS Source

**FeatureServer:** `https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/CityCouncilDistricts_2023_5_25/FeatureServer/0` [VERIFIED: data.boston.gov dataset page for "City Council Districts - 2023-2032"]

**Query endpoint:** `...FeatureServer/0/query?where=...&outFields=DISTRICT,Councilor,LONGNAME,SHORTNAME&outSR=4326&f=geojson`

**Key fields:**
- `DISTRICT` — integer 1-9 (district number)
- `Councilor` — current councillor name
- `LONGNAME` — full district name (e.g., "District 1 - Charlestown, East Boston, North End")
- `SHORTNAME` — abbreviated
- Spatial reference: Web Mercator (wkid=102100/3857) — **MUST use `outSR=4326` in query**

**District boundaries (effective 2023 municipal election, through 2032):**
- District 1: Charlestown, East Boston, North End
- District 2: Chinatown, Downtown, South Boston, South End
- Districts 3-9: Dorchester, Jamaica Plain, Roxbury, Back Bay, Allston-Brighton, etc.

**GeoJSON direct download (fallback):** `https://data.boston.gov/dataset/3e632d04-d7fe-4acd-bab7-75be4bdcfa96/resource/2d9092dd-5175-49ab-9b18-0c0efcef4153/download/city_council_districts___2023_2032.geojson`

---

## Headshot URL Patterns

### boston.gov City Council (Mayor + 13 Councillors)

**Base pattern:** `https://www.boston.gov/sites/default/files/styles/person_photo_profile_large_360x360_/public/img/library/photos/{YEAR}/{MM}/{LASTNAME}-headshot.{EXT}?itok={TOKEN}`

- Photos are 360x360 Drupal image derivatives; source originals are larger
- File extension varies: mostly `.png`, some `.jpg`
- The `itok` parameter is cache-busting; strip it from permanent storage or keep as-is
- Accented characters in names are stripped: "Pepén" → `pepen-headshot.png`

**Verified direct photo URLs:** [VERIFIED: individual boston.gov councillor profile pages]

| Person | Photo URL |
|--------|-----------|
| Michelle Wu (Mayor) | `https://www.boston.gov/sites/default/files/img/library/photos/2021/11/wu-headshot-portrait.jpg` |
| Liz Breadon (D9/President) | `https://www.boston.gov/sites/default/files/styles/person_photo_profile_large_360x360_/public/img/library/photos/2026/02/breadon-headshot.jpg` |
| Ruthzee Louijeune | `https://patterns-stg.boston.gov/sites/default/files/styles/person_photo_profile_large_360x360_/public/img/library/photos/2026/02/ruthzee-headshot.png` |
| Julia M. Mejia | `https://www.boston.gov/sites/default/files/styles/person_photo_profile_large_360x360_/public/img/library/photos/2026/02/mejia-headshot.png` |
| Erin J. Murphy | `https://www.boston.gov/sites/default/files/styles/person_photo_profile_large_360x360_/public/img/library/photos/2026/02/murphy-headshot.png` |
| Henry Santana | `https://www.boston.gov/sites/default/files/styles/person_photo_profile_large_360x360_/public/img/library/photos/2026/02/santana-headshot.jpg` |
| Gabriela Coletta Zapata | `https://patterns-stg.boston.gov/sites/default/files/styles/person_photo_profile_large_360x360_/public/img/library/photos/2026/02/coletta-headshot.png` |
| Edward M. Flynn | `https://www.boston.gov/sites/default/files/styles/person_photo_profile_large_360x360_/public/img/library/photos/2018/01/flynn-headshot.jpg` |
| John FitzGerald | `https://www.boston.gov/sites/default/files/styles/person_photo_profile_large_360x360_/public/img/library/photos/2026/02/fitzgerald-headshot.png` |
| Brian Worrell | `https://www.boston.gov/sites/default/files/styles/person_photo_profile_large_360x360_/public/img/library/photos/2026/02/worrell-headshot.png` |
| Enrique J. Pepén | `https://www.boston.gov/sites/default/files/styles/person_photo_profile_large_360x360_/public/img/library/photos/2026/02/pepen-headshot.png` |
| Benjamin J. Weber | `https://www.boston.gov/sites/default/files/styles/person_photo_profile_large_360x360_/public/img/library/photos/2026/02/weber-headshot.jpg` |
| Miniard Culpepper | `https://www.boston.gov/sites/default/files/styles/person_photo_profile_large_360x360_/public/img/library/photos/2026/02/culpepper-headshot.png` |
| Sharon Durkan | `https://www.boston.gov/sites/default/files/styles/person_photo_profile_large_360x360_/public/img/library/photos/2026/02/durkan-headshot.png` |

**Notes:**
- Some URLs use `patterns-stg.boston.gov` (staging CDN) instead of `www.boston.gov`. Both appear to resolve. Use `www.boston.gov` for production stability if a raw file URL is available.
- Michelle Wu's URL uses a different path: `/img/library/photos/` directly (not under `styles/`). This is a higher-resolution original (not the 360x360 derivative). Good — more pixels to crop from.
- All councillors have headshots from February 2026 (newly updated for 2026-2027 term).
- Flynn's photo is from 2018 (he has been on the council for many years).

### bostonpublicschools.org School Committee

Profile pages exist at `https://www.bostonpublicschools.org/school-committee/about/{slug}` but did not return extractable image URLs via WebFetch (JavaScript-rendered content). **Implementation approach:** Planner should include a task to manually scrape/inspect image URLs during Plan 03 execution, or use WebSearch to find member photos on news sites / Boston.gov appointment announcements.

**Alternative sources for school committee headshots:**
- Boston.gov appointment press releases (contain official photos for new appointees)
  - Jeri Robinson: `https://www.bostonpublicschools.org/school-committee/about/jeri-robinson-chair`
  - Rachel Skerritt: `https://www.boston.gov/news/mayor-wu-appoints-rachel-skerritt-boston-school-committee` (press release likely has photo)
  - Stephen Alkins, Lydia Torres, Franklin Peralta: `https://www.wbur.org/news/2026/01/05/boston-school-committee-new-appointed-members` (news article)
- BPS members page: `https://www.bostonpublicschools.org/school-committee/about/members` (JavaScript-rendered; must use browser DevTools or direct inspection to extract image URLs)
- BPS members are best-effort (D-23) — documented gaps acceptable

---

## Common Pitfalls

### Pitfall 1: Assuming Boston City Council is all at-large
**What goes wrong:** Seeding all 13 councillors to a single LOCAL district (geo_id='2507000') causes District 1-9 residents to see all 13 councillors instead of their specific district councillor + the 4 at-large councillors.
**Why it happens:** The CONTEXT.md D-07 stated this incorrectly.
**How to avoid:** Load 9 council district geofences (X0013) before seeding district politicians. Link district councillors to their respective geo_id='boston-ma-council-district-{N}' rows.
**Warning signs:** If a Dorchester address shows all 13 councillors as "local," the district routing is broken.

### Pitfall 2: Seeding 13 school committee members
**What goes wrong:** The phase description incorrectly says 13 elected members. Seeding 13 creates phantom politicians that don't exist.
**Why it happens:** CONTEXT.md contained a factual error about a November 2024 ballot measure.
**How to avoid:** Seed exactly 7 members from the verified current roster. School committee is appointed.
**Warning signs:** If external IDs -2502790008 through -2502790013 exist, they are phantom rows.

### Pitfall 3: BPS geofence geo_id confusion (city geo_id vs UNSD geo_id)
**What goes wrong:** Using geo_id='2507000' for both Boston city districts AND BPS SCHOOL district causes routing to incorrectly assign BPS offices to the city government.
**Why it happens:** Boston city and BPS share the same geographic extent.
**How to avoid:** City districts use geo_id='2507000'. BPS SCHOOL district uses geo_id='2502790'. They are distinct rows in essentials.districts with different district_types.
**Warning signs:** SCHOOL offices appear in the LOCAL section instead of their own section.

### Pitfall 4: Forgetting to load council district geofences before migration
**What goes wrong:** Plan 01 migration tries to INSERT districts with geo_id='boston-ma-council-district-{N}' but the geofence_boundaries rows don't exist yet. District routing fails for District 1-9 residents (PostGIS can't match their coordinates to any district polygon).
**Why it happens:** Portland OR had the same dependency — migration 229 (geofences) preceded migration 230 (government structure).
**How to avoid:** Run the boundary loader script BEFORE executing the government structure migration. Verify 9 X0013 rows in geofence_boundaries before proceeding.
**Warning signs:** A South Boston address doesn't return the District 2 councillor (Edward M. Flynn).

### Pitfall 5: Mixed case on geofence_boundaries.state
**What goes wrong:** Boston's existing G4110 geofence has `state='25'` (FIPS numeric string). New council district geofences must also use `state='25'` (not 'MA' or 'ma').
**Why it happens:** geofence_boundaries.state uses numeric FIPS; districts.state uses lowercase text.
**How to avoid:** geofence_boundaries: `state='25'`. essentials.districts: `state='ma'`. Never swap.

### Pitfall 6: Accent character in politician name
**What goes wrong:** Enrique J. Pepén — the é accent must be preserved in `full_name`. Some tools strip accents.
**Why it happens:** Legacy of non-UTF8 tools in the pipeline.
**How to avoid:** Use proper UTF-8 string in SQL: `'Enrique J. Pepén'`. Same as Peña-Melnyk precedent (MD).
**Warning signs:** Name appears as "Enrique J. Pep?n" or "Enrique J. Pepen" in production.

### Pitfall 7: ArcGIS bulk query silent truncation (Portland OR lesson)
**What goes wrong:** The ArcGIS `where=1=1` query silently returns fewer than 9 features due to geometry transfer limits, without any error or pagination flag.
**Why it happens:** Boston's district polygons (especially Dorchester) are large multipolygons.
**How to avoid:** Test bulk fetch first. If `features.length < 9`, fall back to per-DISTRICT individual queries using `where=DISTRICT%3D{N}`.
**Warning signs:** districtMap has fewer than 9 entries after the fetch loop.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Boston School Committee appointed | Still appointed as of 2026-06-10 | 1991 (appointed); restoration ongoing effort | Seed as appointed, not elected |
| Boston council at-large model (pre-1982) | 9 district + 4 at-large since 1982 | 1981 referendum → 1982 election | Requires per-district geofences |
| Boston council districts (2013-2022 boundaries) | New redistricted boundaries (2023-2032), effective 2023 election | May 2023 City Council vote | Use CityCouncilDistricts_2023_5_25 FeatureServer |
| Boston council uses plurality-at-large / FPTP | Council passed RCV Home Rule petition May 2025 | May 2025 City Council vote | NOT yet law; use current method values |

**Deprecated/outdated:**
- "13 elected school committee members" — this is a future aspirational state, not current fact
- 2013-2022 district boundaries — expired; use 2023-2032 boundaries only
- Any reference to "all-at-large Boston council" — has not been true since 1982

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Council President Liz Breadon's title in offices should be 'City Councillor' (not 'President') per Alexandria precedent | Architecture Patterns | Low — procedural vs. elected distinction; easy to update |
| A2 | `is_appointed_position=false` for school committee members (governing body, not bureaucratic staff) | Architecture Patterns | Low — cosmetic; consistent with ACPS precedent |
| A3 | Fetching school committee photos from BPS member profile pages requires browser inspection (JavaScript-rendered) | Headshot URL Patterns | Medium — if photos are available at static URLs, this is easier than assumed |
| A4 | The ArcGIS FeatureServer at services.arcgis.com/sFnw0xNflSi8J0uh will remain available | Architecture Patterns | Low — Boston city data; GeoJSON direct download is a fallback |
| A5 | Edward M. Flynn photo (2018) is current official photo | Headshot URL Patterns | Low — he may have a newer photo; the 2018 URL resolves |
| A6 | `patterns-stg.boston.gov` URLs for Louijeune and Coletta Zapata are stable (staging CDN) | Headshot URL Patterns | Medium — staging CDN URLs may rotate; may need to re-derive from `www.boston.gov` pattern |

---

## Open Questions

1. **Is_appointed flag for School Committee members**
   - What we know: D-16 locked `is_appointed=false` for all officials, but was written assuming elected SC
   - What's unclear: Should appointed SC members have `is_appointed=true`?
   - Recommendation: Planner should override D-16 for SC members — use `is_appointed=true` to accurately reflect appointment model. The flag matters for displaying "Appointed" vs. "Elected" in the UI.

2. **Single chamber vs. two chambers for City Council**
   - What we know: 4 at-large + 9 district seats could be one chamber or two
   - What's unclear: Does the UI distinguish within a chamber, or does it expect separate chambers for display purposes?
   - Recommendation: Use ONE "City Council" chamber (Cambridge pattern). District vs. at-large is handled by the district row, not the chamber.

3. **Liz Breadon's office title**
   - What we know: She is Council President but represents District 9
   - What's unclear: Should her title be 'City Councillor' or 'City Council President'?
   - Recommendation: Use 'City Councillor' (consistent with Alexandria Vice Mayor pattern where procedural leadership titles are not separate offices). The role_canonical field could be 'president' if that field is populated in this project.

4. **BPS school committee headshot availability**
   - What we know: Individual profile pages exist at bostonpublicschools.org; images are JavaScript-rendered
   - What's unclear: Are high-res official photos available at static URLs through Boston.gov announcements?
   - Recommendation: During Plan 03 execution, check Boston.gov appointment press releases for each new member (official city photos are typically public_domain).

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase MCP | Migration application | ✓ | production | — |
| Node.js / tsx | ArcGIS boundary loader | ✓ | Project version | — |
| `pg` npm package | Loader DB connection | ✓ | Project version | — |
| Boston ArcGIS FeatureServer | Council district geofences | ✓ (verified) | 2023-2032 boundaries | GeoJSON direct download fallback |
| ImageMagick or Pillow | Headshot processing | [ASSUMED] | Unknown | Python Pillow already used in prior phases |
| boston.gov headshot URLs | Plan 03 headshots | ✓ (verified) | Current as of 2026-06-10 | Wikipedia/Wikimedia if broken |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:**
- ImageMagick: if unavailable, use Python Pillow (used in prior MA headshot phases)
- boston.gov URLs: `patterns-stg.boston.gov` URLs for 2 councillors may be staging; fallback is re-fetching from `www.boston.gov` profile pages

---

## Validation Architecture

> workflow.nyquist_validation not explicitly set to false — treating as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | SQL post-verification DO blocks (project pattern) |
| Config file | none — inline in migration files |
| Quick run | Apply migration via Supabase MCP and read RAISE NOTICE output |
| Full suite | Section-split query + office count + geofence count queries |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MA-DEEP-01 | Boston address returns Mayor + 13 councillors | smoke | Query essentials districts+offices for geo_id='2507000' or 'boston-ma-council-district-*' | ❌ Wave 0 |
| MA-DEEP-01 | Council geofence routing works | integration | Smoke test: resolve a South Boston address, expect District 2 councillor | ❌ Wave 0 |
| MA-DEEP-02 | All 21 officials have headshots | smoke | `SELECT COUNT(*) FROM politician_images WHERE politician_id IN (SELECT id FROM politicians WHERE external_id BETWEEN -2507000014 AND -2507000001 OR external_id BETWEEN -2502790007 AND -2502790001)` | ❌ Wave 0 |
| MA-DEEP-03 | BPS school committee in SCHOOL section | smoke | Query districts WHERE district_type='SCHOOL' AND geo_id='2502790' AND state='ma'; expect 1 row with 7 offices | ❌ Wave 0 |

### Post-verification DO blocks (per migration pattern)

Each migration includes a terminal DO block with:
- Gate (a): government row count = 1
- Gate (b): chamber count = expected
- Gate (c): district rows = expected
- Gate (d): politician count = expected
- Gate (e): office count = expected
- Gate (f): section-split = 0 orphan geofences
- Gate (g): office_id back-fill complete (0 NULL)

### Wave 0 Gaps
- [ ] Smoke query file for MA-DEEP-01 routing verification (optional — inline migration gates are sufficient for plan execution)
- [ ] `load-boston-council-boundaries.ts` dry-run test before live run

---

## Security Domain

> security_enforcement not explicitly disabled — including section.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | — |
| V3 Session Management | No | — |
| V4 Access Control | No | — |
| V5 Input Validation | Yes (SQL) | SQL parameterized via `pg` Pool queries in loader script |
| V6 Cryptography | No | — |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection via ArcGIS district number | Tampering | Validate `distNum` is integer 1-9 before use in geo_id string; never interpolate into SQL directly — always use `$N` parameters |
| ArcGIS poisoned GeoJSON geometry | Tampering | Wrap in `ST_MakeValid(ST_ForcePolygonCCW(ST_SetSRID(ST_Force2D(ST_GeomFromGeoJSON($6)), 4326)))` — same as Portland OR loader |

---

## Sources

### Primary (HIGH confidence)
- `https://www.boston.gov/departments/city-council` — Current 13-member roster, 4 at-large + 9 district structure, 2026-2027 term confirmed
- `https://www.boston.gov/departments/city-council/{name}` — Individual councillor profile pages (14 pages inspected for headshot URLs)
- `https://www.bostonpublicschools.org/school-committee/about/members` — Current 7+1 school committee roster
- `https://nces.ed.gov/ccd/districtsearch/district_detail.asp?DistrictID=2502790` — BPS LEAID = 2502790, confirmed NCES
- `https://data.boston.gov/dataset/city-council-districts-2023-2032` — ArcGIS FeatureServer URL for council district boundaries
- `https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/CityCouncilDistricts_2023_5_25/FeatureServer/0` — Layer schema confirmed (DISTRICT field, 9 features)
- `C:/EV-Accounts/backend/scripts/load-portland-council-boundaries.ts` — X0013 next available mtfcc (current registry confirmed)
- `C:/EV-Accounts/backend/migrations/313_acps_school_board.sql` — ACPS pattern for SCHOOL district
- `C:/EV-Accounts/backend/migrations/312_alexandria_government.sql` — City government pattern
- `https://www.wbur.org/news/2026/01/05/boston-school-committee-new-appointed-members` — Jan 2026 appointments (Alkins, Torres, Peralta confirmed)

### Secondary (MEDIUM confidence)
- Wikipedia Boston City Council — 9 district + 4 at-large structure, FPTP for district / plurality-at-large for at-large seats; established 1982
- `https://en.wikipedia.org/wiki/Boston_City_Council` — Electoral methods confirmed
- WebSearch results: Boston City Council backed RCV Home Rule Petition May 2025 (8-4 vote) — confirms current method is still plurality/FPTP, not yet RCV
- `https://www.bostonpublicschools.org/school-committee/about/mah-noor` — Mah Noor is non-voting student rep, not a member

### Tertiary (LOW confidence)
- `patterns-stg.boston.gov` URLs for Louijeune and Coletta Zapata — staging CDN, may be less stable than production URLs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all pattern migrations verified in codebase
- Architecture (city council): HIGH — structure verified from official boston.gov pages
- Architecture (school committee): HIGH — appointed status verified from multiple official sources
- BPS geo_id: HIGH — confirmed from NCES CCD, matches ACPS derivation formula
- Headshot URLs: HIGH for 14 verified URLs; MEDIUM for staging-CDN variants; LOW for school committee (JS-rendered)
- Election methods: HIGH — Wikipedia + official sources cross-confirmed; RCV not yet in effect

**Research date:** 2026-06-10
**Valid until:** 2026-09-01 (school committee roster changes when new appointments occur; council roster stable until Nov 2027 elections)
