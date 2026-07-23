# Phase 109: MA Tier 2 Cities - Research

**Researched:** 2026-06-10
**Domain:** Massachusetts city government seeding — 5 cities (Worcester, Springfield, Lowell, Brockton, Quincy)
**Confidence:** HIGH (geo_ids DB-verified; rosters from official city websites; patterns from Phase 108)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MA-TIER2-01 | Worcester address returns LOCAL section with Mayor + City Councillors; best-effort headshots at 600×750 | Migration seeds 11-member council + Mayor; worcesterma.gov headshot URL pattern discovered |
| MA-TIER2-02 | Springfield, Lowell, Brockton, and Quincy each return LOCAL sections with Mayor + council incumbents; best-effort headshots | 4 migrations (one per city) + headshot migration; rosters verified from official sources; city-manager model for Lowell documented |
</phase_requirements>

---

## Summary

Phase 109 seeds the 5 largest Massachusetts cities outside Boston so that any address in those cities returns a populated LOCAL section. All 5 cities are G4110 places whose geofences are already loaded in production (state='25'). No new TIGER loads are required — this is a pure government/officials seeding phase.

**Critical roster correction:** The ROADMAP states "Mayor Robert Sullivan" for Brockton. This is outdated. Sullivan lost the 2025 municipal election. **Moises M. Rodrigues was inaugurated as Brockton's 51st Mayor on January 5, 2026** (first person of color elected mayor of Brockton). [VERIFIED: brockton.ma.us/news + GBH news 2026-01-05]

**Critical model correction:** Lowell uses Plan E (council-manager) government. The Mayor (currently Erik R. Gitschier) is **elected by the council from its members**, not directly elected by voters — the same model as Cambridge (Siddiqui). The City Manager (Thomas A. Golden Jr.) is appointed. Both are `is_appointed=true` in the DB. The 11 council members (3 at-large + 8 district) are directly elected (`is_appointed=false`).

All 5 cities need a **full new government structure** built from scratch — no scaffolding exists. The migration pattern follows the Boston/Alexandria model: CREATE government + chamber + districts + politicians + offices in a single city migration, then headshots in a separate migration.

**Primary recommendation:** One migration per city (5 city migrations = 351–355) + one headshots migration (356). Use a single LOCAL district per city (city geo_id, no per-district geofences). Encode ward/district in office title strings (Maine Tier 2 pattern). No per-ward geofences needed.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| City government rows (5 cities) | Database / Storage | — | SQL migrations INSERT into essentials.governments |
| City Council chambers (5 chambers) | Database / Storage | — | One chamber per city in SQL migrations |
| LOCAL district rows (5 cities) | Database / Storage | — | Single LOCAL district per city; geo_id = G4110 city geo_id |
| LOCAL_EXEC district rows (5 Mayors) | Database / Storage | — | One LOCAL_EXEC district per city; geo_id = G4110 city geo_id |
| Politicians + offices (5 cities) | Database / Storage | — | WITH ins_p + UPDATE offices pattern per city |
| Headshot sourcing | API / Backend | — | Python script downloads from city websites + resizes |
| Headshot storage | CDN / Static | Database / Storage | Supabase Storage (politician_photos bucket) + politician_images rows |

---

## Geo IDs (DB-Verified)

All 5 cities already have G4110 geofences in production. [VERIFIED: essentials.geofence_boundaries, queried 2026-06-10]

| City | geo_id | TIGER Name | state |
|------|--------|-----------|-------|
| Worcester | 2582000 | Worcester city | 25 |
| Springfield | 2567000 | Springfield city | 25 |
| Lowell | 2537000 | Lowell city | 25 |
| Brockton | 2509000 | Brockton city | 25 |
| Quincy | 2555745 | Quincy city | 25 |

Note: "Quincy city" geo_id='2555745' has a non-round number because of TIGER's GEOID structure for Massachusetts places.

---

## Current Rosters (Verified)

### Worcester (#2) — Mayor-Council, 11 members [VERIFIED: worcesterma.gov/city-council/councilors, 2026]

**Government model:** Elected Mayor (at-large seat) + 5 Councilors-at-Large + 5 District Councilors. 11 total.

| Name | Role | External ID |
|------|------|-------------|
| Joseph M. Petty | Mayor & Councilor-at-Large | -258200001 |
| Khrystian E. King | Councilor-at-Large (Vice Chairman) | -258200002 |
| Satya B. Mitra | Councilor-at-Large | -258200003 |
| Kathleen M. Toomey | Councilor-at-Large | -258200004 |
| Morris A. Bergman | Councilor-at-Large | -258200005 |
| Gary Rosen | Councilor-at-Large | -258200006 |
| Tony Economou | District 1 Councilor | -258200007 |
| Robert A. Bilotta | District 2 Councilor | -258200008 |
| John P. Fresolo | District 3 Councilor | -258200009 |
| Luis A. Ojeda | District 4 Councilor | -258200010 |
| Jose A. Rivera | District 5 Councilor | -258200011 |

**Notes:**
- Petty holds BOTH "Mayor" seat AND "Councilor-at-Large" seat. DB model: one politician, one office with title='Mayor' (the at-large membership is implicit in the mayor role — no separate office row needed per Cambridge/ME Tier 2 precedent). OR: seed him as one politician in LOCAL_EXEC district with title='Mayor'; other at-large seats link to LOCAL district. Planner's call on whether to split or combine.
- Worcester does have 5 geographic districts, but **this phase does NOT load per-district geofences** (only single city geo_id='2582000' is used). District labels go in office titles: "City Councilor (District 1)" etc. Same as Maine Tier 2 pattern.
- Kathleen M. Toomey goes by "Kate Toomey" colloquially but official name is "Kathleen M. Toomey".

### Springfield (#3) — Mayor-Council, 13 members [VERIFIED: springfield-ma.gov/cos/city-council-members, 2026]

**Government model:** Elected Mayor + 5 Councilors-at-Large + 8 Ward Councilors. 13 total (14 including Mayor).

| Name | Role | External ID |
|------|------|-------------|
| Domenic J. Sarno | Mayor | -256700001 |
| Michael A. Fenton | Ward 2 Councilor (Council President) | -256700002 |
| Melvin A. Edwards | Ward 3 Councilor (Council VP) | -256700003 |
| Maria Perez | Ward 1 Councilor | -256700004 |
| Malo L. Brown | Ward 4 Councilor | -256700005 |
| Lavar Click-Bruce | Ward 5 Councilor | -256700006 |
| Victor G. Davila | Ward 6 Councilor | -256700007 |
| Gerry Martin | Ward 7 Councilor | -256700008 |
| Zaida Govan | Ward 8 Councilor | -256700009 |
| Justin Hurst | Councilor-at-Large | -256700010 |
| Jose Delgado | Councilor-at-Large | -256700011 |
| Kateri Walsh | Councilor-at-Large | -256700012 |
| Tracye Whitfield | Councilor-at-Large (Council President for at-large) | -256700013 |
| Brian Santaniello | Councilor-at-Large | -256700014 |

**Notes:**
- Domenic Sarno is in his **sixth term** as Mayor. [VERIFIED: wikipedia.org/wiki/Domenic_Sarno]
- Council structure confirmed: "five members elected citywide and one from each of the city's eight wards" = 13 + Mayor = 14 total officials. [VERIFIED: springfield-ma.gov/cos/city-council-members]
- Michael A. Fenton holds title "Council President" — per Alexandria/Boston precedent, store as "City Councilor (Ward 2)" with the procedural President title NOT creating a separate office. Planner may choose to add role_canonical='president' if schema supports it.
- External IDs assigned sequentially -256700001 (Mayor) → -256700014 (last at-large).

### Lowell (#4) — Plan E (Council-Manager), 11 council members + City Manager [VERIFIED: lowellma.gov/533/Meet-the-City-Council + lowellma.gov/198/City-Manager, 2026]

**Government model:** Plan E — City Manager appointed by Council; Mayor elected by Council from its own members (ceremonial/presiding role). 11 council members directly elected by voters (3 at-large + 8 district seats). [VERIFIED: citizenportal.ai article on 2026 inauguration]

| Name | Role | is_appointed | External ID |
|------|------|-------------|-------------|
| Thomas A. Golden, Jr. | City Manager | true | -253700001 |
| Erik R. Gitschier | Mayor (council-elected, at-large seat) | true | -253700002 |
| Rita Mercier | Councilor-at-Large | false | -253700003 |
| Vesna Nuon | Councilor-at-Large | false | -253700004 |
| Daniel Rourke | District 1 Councilor | false | -253700005 |
| Corey Robinson | District 2 Councilor | false | -253700006 |
| Belinda M. Juran | District 3 Councilor | false | -253700007 |
| Sean McDonough | District 4 Councilor | false | -253700008 |
| Kimberly Scott | District 5 Councilor | false | -253700009 |
| Sokhary Chau | District 6 Councilor | false | -253700010 |
| Sidney L. Liang | District 7 Councilor | false | -253700011 |
| John Descoteaux | District 8 Councilor | false | -253700012 |

**DB model notes:**
- City Manager Golden: `is_appointed=true`, title='City Manager', district_type=LOCAL, same district as council (Cambridge precedent: Yi-An Huang as City Manager, is_appointed=true). No LOCAL_EXEC district for City Manager (LOCAL_EXEC is for directly-elected executives; Cambridge does not use it for the City Manager).
- Mayor Gitschier: `is_appointed=true`, title='Mayor', district_type=LOCAL. Same district as council (Cambridge precedent: Siddiqui holds Mayor + City Councillor via two office rows). However, planner should decide: give Gitschier ONLY the 'Mayor' office (not a separate Councilor office) since he's listed as an at-large member who becomes Mayor by council vote.
- No LOCAL_EXEC district for Lowell — consistent with Cambridge model (no popularly-elected Mayor).
- Note: "Erik Gitschier" and "Erik Gitscheer" both appear in sources. The official city website uses "Gitschier". [ASSUMED: spelling; planner should verify against lowellma.gov/549/City-Mayor]

### Brockton (#5) — Mayor-Council, 11 members [VERIFIED: brockton.ma.us/government/city-council/ + brockton.ma.us/news/, 2026]

**Government model:** Elected Mayor + 4 Councilors-at-Large + 7 Ward Councilors. 12 total (Mayor + 11 council).

**CRITICAL CORRECTION: Mayor is Moises M. Rodrigues (NOT Robert Sullivan).** Sullivan lost the November 2025 election. Rodrigues inaugurated January 5, 2026. [VERIFIED: brockton.ma.us/news/moises-m-rodrigues-sworn-in-as-51st-mayor-of-brockton-pledges-unity-and-accountable-leadership/]

| Name | Role | External ID |
|------|------|-------------|
| Moises M. Rodrigues | Mayor | -250900001 |
| Marlon D. Green | Ward 1 Councilor | -250900002 |
| Maria T. Tavares | Ward 2 Councilor | -250900003 |
| Philip E. Griffin | Ward 3 Councilor | -250900004 |
| Susan Nicastro | Ward 4 Councilor | -250900005 |
| Jeffrey A. Thompson | Ward 5 Councilor | -250900006 |
| John Lally | Ward 6 Councilor (Council President) | -250900007 |
| Shirley Asack | Ward 7 Councilor | -250900008 |
| Carla Darosa | Councilor-at-Large | -250900009 |
| Jeff Charnel | Councilor-at-Large | -250900010 |
| Winthrop Farwell Jr. | Councilor-at-Large | -250900011 |
| David C. Teixeira | Councilor-at-Large | -250900012 |

**Notes:**
- "Suan Nicastro" in some sources; official brockton.ma.us uses "Susan Nicastro". [ASSUMED: verify against official site]
- Rodrigues was a former at-large city councilor before becoming Mayor.

### Quincy (#6) — Mayor-Council, 9 members [VERIFIED: quincyma.gov/government/elected_officials/city_council/index.php + quincyma.gov/government/elected_officials/mayor_s_office/mayor_s_bio.php, 2026]

**Government model:** Elected Mayor + 3 Councilors-at-Large + 6 Ward Councilors. 10 total (Mayor + 9 council).

| Name | Role | External ID |
|------|------|-------------|
| Thomas P. Koch | Mayor | -255574501 |
| David Jacobs | Ward 1 Councilor | -255574502 |
| Richard Ash | Ward 2 Councilor | -255574503 |
| Walter Hubley | Ward 3 Councilor | -255574504 |
| Virginia Ryan | Ward 4 Councilor | -255574505 |
| Maggie McKee | Ward 5 Councilor | -255574506 |
| Deborah Riley | Ward 6 Councilor | -255574507 |
| Noel DiBona | Councilor-at-Large | -255574508 |
| Anne Mahoney | Councilor-at-Large (Council President) | -255574509 |
| Ziqiang "Susan" Yuan | Councilor-at-Large | -255574510 |

**Notes:**
- Thomas P. Koch is confirmed in his seventh term as of February 2026. [VERIFIED: quincyma.gov mayor's bio page]
- Anne Mahoney elected as Council President January 2026. [VERIFIED: thequincysun.com/mahoney-next-quincy-city-council-president/]
- Ziqiang Yuan goes by "Susan" Yuan. Store full_name='Ziqiang Yuan' with first_name='Ziqiang', last_name='Yuan'. [ASSUMED: verify against official quincyma.gov page]
- Quincy 2025 election was a historic anti-incumbent wave; 7 of 9 council seats changed hands. All names above are the NEW council inaugurated Jan 2026. [VERIFIED: thequincysun.com + quincyquarry.com]

---

## Migration Plan

**Starting migration:** 351 (last Phase 108 migration was 350) [VERIFIED: supabase_migrations.schema_migrations, queried 2026-06-10]

**Recommended structure:**

| Migration | City | Content |
|-----------|------|---------|
| 351 | Worcester | government + chamber + 2 districts (LOCAL_EXEC + LOCAL) + 11 politicians + 11 offices |
| 352 | Springfield | government + chamber + 2 districts + 14 politicians + 14 offices |
| 353 | Lowell | government + chamber + 1 district (LOCAL only — no LOCAL_EXEC) + 12 politicians + 12 offices |
| 354 | Brockton | government + chamber + 2 districts + 12 politicians + 12 offices |
| 355 | Quincy | government + chamber + 2 districts + 10 politicians + 10 offices |
| 356 | Headshots | politician_images rows for all available officials (best-effort across all 5 cities) |

**Total politicians:** 11 + 14 + 12 + 12 + 10 = 59 officials across 5 cities.

---

## Standard Stack

No new external libraries. Same migration + Python headshot stack as Phase 108.

### Core
| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| Supabase MCP (`mcp__supabase-local`) | N/A | Apply SQL migrations to production DB | Project standard |
| PostgreSQL (Supabase) | 15.x | DB writes | Project standard |
| Python + Pillow | Project version | Headshot download, crop 4:5, resize 600×750 Lanczos q90 | Phase 108 precedent |

### No New Packages Required

All dependencies already available. Headshot script follows the `scripts/_tmp-{city}-headshots.py` pattern from Phase 108.

---

## Package Legitimacy Audit

> No new packages required for this phase. All tooling already installed.

N/A — Skipped (no new packages).

---

## Architecture Patterns

### System Architecture Diagram

```
[5 official city websites]          [Python headshot script]
(mayors + council rosters)          (download + crop 4:5 + resize 600x750)
         |                                      |
         v                                      v
[SQL migrations 351-355]            [Supabase Storage politician_photos bucket]
(governments + chambers                        |
 + districts + politicians                     v
 + offices per city)               [Migration 356: politician_images rows]
         |                              (type='default' for all)
         v
[essentials.geofence_boundaries]
(G4110 rows already loaded, state='25')
         |
         v
[PostGIS routing: city address]
    → LOCAL section
    → Mayor + Council
```

### Recommended File Structure

```
C:/EV-Accounts/backend/
├── migrations/
│   ├── 351_worcester_government.sql
│   ├── 352_springfield_government.sql
│   ├── 353_lowell_government.sql
│   ├── 354_brockton_government.sql
│   ├── 355_quincy_government.sql
│   └── 356_ma_tier2_headshots.sql
├── scripts/
│   ├── _apply-migration-351.ts
│   ├── _apply-migration-352.ts
│   ├── _apply-migration-353.ts
│   ├── _apply-migration-354.ts
│   ├── _apply-migration-355.ts
│   └── _tmp-ma-tier2-headshots.py
```

### Pattern 1: City Government Migration (per city)

Follows `347_boston_government.sql` / `312_alexandria_government.sql` for cities WITH a directly-elected Mayor. Pattern for a mayor-council city:

```sql
-- Source: C:/EV-Accounts/backend/migrations/312_alexandria_government.sql
-- Source: C:/EV-Accounts/backend/migrations/347_boston_government.sql

BEGIN;

-- Step 1: Government row
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'City of Worcester, Massachusetts, US',
       'LOCAL', 'MA', 'Worcester', '2582000'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'City of Worcester, Massachusetts, US'
);

-- Step 2: Chamber (NO slug — GENERATED ALWAYS)
INSERT INTO essentials.chambers (id, name, name_formal, government_id, election_method)
SELECT gen_random_uuid(),
       'City Council',
       'Worcester City Council',
       (SELECT id FROM essentials.governments WHERE name = 'City of Worcester, Massachusetts, US'),
       'fptp'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'City Council'
    AND government_id = (SELECT id FROM essentials.governments WHERE name = 'City of Worcester, Massachusetts, US')
);

-- Step 3a: LOCAL_EXEC district (Mayor)
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL_EXEC', 'ma', '2582000', 'Worcester (Citywide)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '2582000' AND district_type = 'LOCAL_EXEC' AND state = 'ma'
);

-- Step 3b: LOCAL district (Council)
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'ma', '2582000', 'Worcester', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '2582000' AND district_type = 'LOCAL' AND state = 'ma'
);

-- Step 4: Politicians + Offices (WITH ins_p pattern)
-- Mayor (LOCAL_EXEC)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Joseph M. Petty', 'Joseph', 'Petty', NULL,
          true, false, false, true, -258200001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices (id, title, district_id, chamber_id, politician_id, representing_state, is_vacant, is_appointed_position)
SELECT gen_random_uuid(),
       'Mayor',
       (SELECT id FROM essentials.districts WHERE geo_id = '2582000' AND district_type = 'LOCAL_EXEC' AND state = 'ma'),
       (SELECT ch.id FROM essentials.chambers ch JOIN essentials.governments g ON ch.government_id = g.id WHERE g.geo_id = '2582000' AND ch.name = 'City Council'),
       (SELECT id FROM ins_p),
       'MA', false, false
WHERE (SELECT id FROM ins_p) IS NOT NULL;

-- ... (repeat for each councilor with title='City Councilor' or 'City Councilor (District N)')
-- Step 5: office_id back-fill
-- Step 6: Post-verification DO block
-- Step 7: Ledger INSERT

COMMIT;
```

### Pattern 2: Lowell (Council-Manager — No LOCAL_EXEC)

Cambridge is the reference for this model. Key differences:

```sql
-- Lowell: NO LOCAL_EXEC district (no popularly-elected mayor)
-- City Manager: is_appointed=true, title='City Manager'
-- Mayor (Gitschier): is_appointed=true, title='Mayor' — council-elected
-- All in same LOCAL district, same chamber

-- Step 3: Only ONE district type for Lowell
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'ma', '2537000', 'Lowell', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '2537000' AND district_type = 'LOCAL' AND state = 'ma'
);
-- NO LOCAL_EXEC district INSERT for Lowell
```

### Pattern 3: Office Titles

Following the Maine Tier 2 pattern of encoding ward/district in the office title:

| City | Office Title Pattern |
|------|---------------------|
| Worcester (at-large) | 'City Councilor' |
| Worcester (district) | 'City Councilor (District 1)' through 'City Councilor (District 5)' |
| Springfield (ward) | 'City Councilor (Ward 1)' through 'City Councilor (Ward 8)' |
| Springfield (at-large) | 'City Councilor' |
| Lowell (district) | 'City Councilor (District 1)' through 'City Councilor (District 8)' |
| Lowell (at-large) | 'City Councilor' |
| Brockton (ward) | 'City Councilor (Ward 1)' through 'City Councilor (Ward 7)' |
| Brockton (at-large) | 'City Councilor' |
| Quincy (ward) | 'City Councilor (Ward 1)' through 'City Councilor (Ward 6)' |
| Quincy (at-large) | 'City Councilor' |

### Pattern 4: External ID Scheme

Formula: `-(geo_id)(seq:003d)` where seq starts at 001. Same as Boston Phase 108 pattern (full 7-digit geo_id + 3-digit zero-padded seq).

```
Worcester  (geo_id=2582000): -258200001, -258200002, ..., -258200011
Springfield (geo_id=2567000): -256700001, -256700002, ..., -256700014
Lowell     (geo_id=2537000): -253700001, -253700002, ..., -253700012
Brockton   (geo_id=2509000): -250900001, -250900002, ..., -250900012
Quincy     (geo_id=2555745): -255574501, -255574502, ..., -255574510
```

No collisions with existing external_ids. [VERIFIED: essentials.politicians, queried 2026-06-10]

### Pattern 5: Post-Verification DO Block (per migration)

Each migration ends with a DO block asserting gate conditions:

```sql
DO $$
DECLARE
  v_count INT;
BEGIN
  -- Gate: government row exists
  SELECT COUNT(*) INTO v_count FROM essentials.governments WHERE name = 'City of Worcester, Massachusetts, US';
  IF v_count != 1 THEN RAISE EXCEPTION 'Worcester government: expected 1, got %', v_count; END IF;
  -- Gate: politician count
  SELECT COUNT(*) INTO v_count FROM essentials.politicians
    WHERE external_id BETWEEN -258200011 AND -258200001;
  IF v_count != 11 THEN RAISE EXCEPTION 'Worcester politicians: expected 11, got %', v_count; END IF;
  -- Gate: 0 NULL office_ids
  SELECT COUNT(*) INTO v_count FROM essentials.politicians
    WHERE external_id BETWEEN -258200011 AND -258200001 AND office_id IS NULL;
  IF v_count != 0 THEN RAISE EXCEPTION 'Worcester office_id back-fill incomplete: % NULL', v_count; END IF;
  RAISE NOTICE 'Worcester gates passed';
END $$;
```

### Anti-Patterns to Avoid

- **Per-ward geofences for Tier 2 cities:** Do NOT create per-ward geofences (X0013+ mtfcc) for Worcester, Springfield, Brockton, Lowell, or Quincy. This phase uses a single LOCAL district per city (city geo_id). Ward/district is encoded in the office title string, following the Maine Tier 2 precedent. Per-district geofences are a deep-seed feature (Boston Phase 108), not a Tier 2 feature.
- **LOCAL_EXEC district for Lowell:** Lowell has no popularly-elected Mayor. Do NOT create a LOCAL_EXEC district for Lowell. Only LOCAL district needed (Cambridge pattern).
- **Using Robert Sullivan for Brockton Mayor:** Sullivan lost the 2025 election. The current Mayor is Moises M. Rodrigues (inaugurated January 5, 2026).
- **Using lowercase 'MA' for governments.state:** `governments.state='MA'` (uppercase). `districts.state='ma'` (lowercase). Never swap.
- **Including slug in chamber INSERT:** `slug` is GENERATED ALWAYS — never include in INSERT column list.
- **Using ON CONFLICT for governments:** `essentials.governments` has no unique constraint on geo_id — use WHERE NOT EXISTS guard only.
- **Setting is_appointed_position=true for councilors:** City councillors govern directly; `is_appointed_position=false` always (they have no bureaucratic appointment, they hold elected/designated government seats).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Photo resizing | Custom resize logic | Python Pillow: crop 4:5 first, then resize to 600×750 Lanczos q90 | Project standard; Phase 108 precedent |
| Government ID lookup in office INSERT | Re-query government by name in every INSERT | Extract government UUID once into a variable in the WITH chain | Reduces query overhead; matches Phase 108 pattern |
| Ward-level routing | Per-ward geofences | Single city geo_id + office title encoding | Maine Tier 2 precedent; ward geofences are a deep-seed feature, not Tier 2 |

---

## Headshot Sources

### Worcester [VERIFIED: worcesterma.gov/city-council/councilors]

Pattern: `https://www.worcesterma.gov/media/council/{lastname}.jpg`

| Person | URL |
|--------|-----|
| Joseph M. Petty | `https://www.worcesterma.gov/media/council/petty.jpg` |
| Khrystian E. King | `https://www.worcesterma.gov/media/council/king.jpg` or `-headshot.jpg` |
| Satya B. Mitra | `https://www.worcesterma.gov/media/council/mitra.jpg` or `-headshot.jpg` |
| Kathleen M. Toomey | `https://www.worcesterma.gov/media/council/toomey.jpg` or `-headshot.jpg` |
| Morris A. Bergman | `https://www.worcesterma.gov/media/council/bergman.jpg` or `-headshot.jpg` |
| Gary Rosen | `https://www.worcesterma.gov/media/council/rosen.jpg` or `-headshot.jpg` |
| Tony Economou | `https://www.worcesterma.gov/media/council/economou.jpg` or `-headshot.jpg` |
| Robert A. Bilotta | `https://www.worcesterma.gov/media/council/bilotta.jpg` or `-headshot.jpg` |
| John P. Fresolo | `https://www.worcesterma.gov/media/council/fresolo.jpg` or `-headshot.jpg` |
| Luis A. Ojeda | `https://www.worcesterma.gov/media/council/ojeda.jpg` or `-headshot.jpg` |
| Jose A. Rivera | `https://www.worcesterma.gov/media/council/rivera.jpg` or `-headshot.jpg` |

**Note:** Both `/media/council/{name}.jpg` and `/media/council/{name}-headshot.jpg` variants appear. Try `-headshot.jpg` first (larger image), fall back to plain `.jpg`. [VERIFIED: individual URL patterns extracted from worcesterma.gov/city-council/councilors page source]

### Brockton Mayor [VERIFIED: brockton.ma.us/government/mayors-office/]

- Moises M. Rodrigues: `https://brockton.ma.us/wp-content/uploads/2026/01/MRodrigues-300x300.jpeg`

**Brockton council:** No headshot URL pattern verified for council members. brockton.ma.us uses WordPress CMS (`wp-content/uploads/`). Planner should inspect individual council member pages at `brockton.ma.us/government/city-council/` for photo URLs. [ASSUMED: individual pages exist with photos]

### Springfield [ASSUMED — not stable URLs]

Springfield uses TYPO3 CMS with processed/cached image URLs containing hash strings: `/cos/fileadmin/_processed_/XX/YY/csm_{name}_{hash}.jpg`. These hashes are not stable across cache invalidation. **Recommendation for planner:** visit individual council member pages at `springfield-ma.gov/cos/city-council-members` via browser, extract actual image sources via DevTools or link inspection. Stable source images may exist under `/cos/fileadmin/user_upload/` without the `_processed_` cache wrapper.

### Lowell [ASSUMED — needs inspection]

`lowellma.gov` uses CivicPlus CMS. Individual council member profile pages are linked from `lowellma.gov/533/Meet-the-City-Council`. Photo extraction requires visiting individual pages. No stable URL pattern verified yet.

### Quincy [ASSUMED — needs inspection]

`quincyma.gov` uses a custom CMS. Individual councilor pages are linked from the city council index. Photo extraction requires individual page visits. New council (inaugurated Jan 2026) may have limited official photos for some members.

---

## Common Pitfalls

### Pitfall 1: Using the Wrong Brockton Mayor Name
**What goes wrong:** Seeding Robert Sullivan (old mayor, 2019-2026) as current Mayor.
**Why it happens:** ROADMAP contains outdated information.
**How to avoid:** Use Moises M. Rodrigues. [VERIFIED: brockton.ma.us + GBH news 2026-01-05]
**Warning signs:** If you seed Sullivan, Rodrigues won't appear in any LOCAL section — plus an incorrect politician record pollutes production.

### Pitfall 2: Creating LOCAL_EXEC for Lowell
**What goes wrong:** Lowell's "Mayor" (Gitschier) is council-elected, not a directly-elected executive. Creating a LOCAL_EXEC district for Lowell would misrepresent the government model and possibly cause routing issues.
**Why it happens:** The Mayor title looks like an executive office.
**How to avoid:** No LOCAL_EXEC district for Lowell — only LOCAL district. `is_appointed=true` for Gitschier. Same as Cambridge (Siddiqui as Mayor + Huang as City Manager, both `is_appointed=true`, both in LOCAL district). [VERIFIED: Cambridge DB query + Lowell Plan E confirmation]
**Warning signs:** If a Lowell address shows the Mayor in the "Local Executive" section separately from councillors.

### Pitfall 3: Stale Quincy Council Members
**What goes wrong:** Seeding the pre-November-2025 Quincy council (massive anti-incumbent wave).
**Why it happens:** Research relies on stale data.
**How to avoid:** The current council (sworn in Jan 5, 2026) has 7 new members. Only Ash (Ward 2) and DiBona (at-large) from the old council returned. Use the verified roster above. [VERIFIED: thequincysun.com + quincyquarry.com]
**Warning signs:** Names like James Devine, William Harris, or Anthony Andronico in your migration (these are old members who lost).

### Pitfall 4: mtfcc Value on LOCAL/LOCAL_EXEC Districts
**What goes wrong:** Setting `mtfcc='G4110'` on LOCAL or LOCAL_EXEC district rows instead of NULL.
**Why it happens:** Cambridge's district has `mtfcc='G4110'` in the DB (pre-existing anomaly from v5.0), which might suggest this is the right value. Boston Phase 108 clarified this: LOCAL and LOCAL_EXEC districts must use `mtfcc=NULL`. [VERIFIED: 312_alexandria_government.sql, 347_boston_government.sql comments]
**How to avoid:** Always set `mtfcc=NULL` on manually-inserted LOCAL and LOCAL_EXEC districts.
**Warning signs:** If a district row has mtfcc='G4110', it's using the Cambridge legacy pattern, not the current standard.

### Pitfall 5: geofence_boundaries.state vs. districts.state Casing
**What goes wrong:** Using `state='MA'` (uppercase) in districts or `state='25'` in districts.
**Why it happens:** Multiple state columns with different casing rules.
**How to avoid:**
- `geofence_boundaries.state = '25'` (FIPS numeric)
- `essentials.districts.state = 'ma'` (lowercase postal)
- `essentials.governments.state = 'MA'` (uppercase postal)
- `essentials.offices.representing_state = 'MA'` (uppercase postal)
**Warning signs:** Run the section-split check after each migration.

### Pitfall 6: Duplicate Government Row for Duplicate Geo IDs
**What goes wrong:** Two government rows for the same city (no unique constraint on geo_id in essentials.governments).
**Why it happens:** Re-running a migration without WHERE NOT EXISTS guard.
**How to avoid:** Always use `WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE name = 'City of ...')`.

### Pitfall 7: Springfield Council Title Precision
**What goes wrong:** Using "Ward" vs "District" wrong, or giving Fenton title "Council President" instead of a councilor title.
**Why it happens:** Springfield uses "Ward" for geographic seats.
**How to avoid:** Springfield office titles: 'City Councilor (Ward 1)' through '(Ward 8)' for ward seats; 'City Councilor' for at-large. Fenton's title is 'City Councilor (Ward 2)' — "Council President" is a procedural title, not a separate DB office.

---

## Government Structure Summary

| City | geo_id | Districts | Mayor Type | Council Structure | Total Officials |
|------|--------|-----------|------------|-------------------|-----------------|
| Worcester | 2582000 | LOCAL_EXEC + LOCAL | Directly elected (also at-large) | 5 at-large + 5 district | 11 |
| Springfield | 2567000 | LOCAL_EXEC + LOCAL | Directly elected | 5 at-large + 8 ward | 14 |
| Lowell | 2537000 | LOCAL only | Council-elected (is_appointed=true) | 3 at-large + 8 district + City Manager | 12 |
| Brockton | 2509000 | LOCAL_EXEC + LOCAL | Directly elected | 4 at-large + 7 ward | 12 |
| Quincy | 2555745 | LOCAL_EXEC + LOCAL | Directly elected | 3 at-large + 6 ward | 10 |

**Note on Worcester Mayor:** Petty is simultaneously Mayor AND Councilor-at-Large. DB model options:
- Option A: One office row in LOCAL_EXEC district with title='Mayor' (cleanest; his at-large function is implicit in the Mayor role)
- Option B: Two office rows (Mayor + City Councilor) — requires that essentials.offices.politician_id uniqueness allows multi-office (it does — the unique index was dropped in Phase 108's development)

**Recommendation:** Option A — one office for Mayor in LOCAL_EXEC. The remaining 10 council members all link to the LOCAL district. This matches the standard pattern and avoids DB complexity.

---

## Section-Split Check Context

After Phase 108, the section-split check (geofence_boundaries for MA G4110 cities with no matching district) shows **56 orphan geofences**. [VERIFIED: queried 2026-06-10] This is expected — these are 56 MA G4110 cities with no seeded government yet.

After Phase 109 seeds all 5 cities, this count should drop to **51** (56 - 5). Run the section-split check after each city migration as a sanity check.

The section-split check for MA only (correct scoped query per Phase 107 lesson):

```sql
SELECT COUNT(*) as orphan_count
FROM essentials.geofence_boundaries g
WHERE g.state = '25'
  AND g.mtfcc = 'G4110'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.districts d
    WHERE d.geo_id = g.geo_id
  );
```

Expected: 56 before Phase 109 → 51 after all 5 cities seeded.

---

## State of the Art

| Old Information | Current Fact | Source | Impact |
|-----------------|-------------|--------|--------|
| Brockton Mayor: Robert Sullivan | Mayor: Moises M. Rodrigues (since Jan 5, 2026) | brockton.ma.us official news | Must use Rodrigues, not Sullivan |
| Quincy council: incumbents with multiple terms | 7 of 9 seats changed hands Nov 2025 | thequincysun.com | All-new roster; don't use pre-2026 names |
| Lowell Mayor: popularly-elected | Council-elected under Plan E (ceremonial) | lowellma.gov/517/City-Council | is_appointed=true for Mayor |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Lowell Mayor Erik Gitschier (council-elected) — spelling "Gitschier" (some sources say "Gitscheer") | Rosters | Low — easy name fix |
| A2 | Worcester Mayor Petty gets ONE office row (LOCAL_EXEC, title='Mayor'); no separate at-large Councilor row | Architecture Patterns | Low — cosmetic; both options are valid |
| A3 | Springfield council president title NOT stored as separate DB office (Fenton: 'City Councilor (Ward 2)') | Rosters | Low — procedural title, not an elected position |
| A4 | Brockton city website has individual ward councilor photo URLs accessible via WordPress pattern | Headshot Sources | Medium — 8 ward councilors may lack accessible photos; best-effort acceptable |
| A5 | Lowell, Springfield, Quincy headshot photos accessible from individual official council pages | Headshot Sources | Medium — some newly elected members may not have official photos yet |
| A6 | Quincy "Ziqiang Yuan" store as full_name='Ziqiang Yuan' (goes by "Susan") | Rosters | Low — name storage; easy to correct |
| A7 | Brockton Ward 4 councilor is "Susan Nicastro" (some sources say "Suan Nicastro") | Rosters | Low — verify against official brockton.ma.us |

---

## Open Questions (RESOLVED)

1. **Worcester Mayor: one office or two?**
   - What we know: Petty is Mayor AND Councilor-at-Large; two functional roles but one person
   - What's unclear: Should he have `title='Mayor'` in LOCAL_EXEC + separate `title='City Councilor'` in LOCAL?
   - Recommendation: Use ONE office with `title='Mayor'` in LOCAL_EXEC district. His at-large membership is implicit.

2. **Lowell City Manager in this phase?**
   - What we know: Thomas A. Golden Jr. is City Manager; Cambridge's Yi-An Huang was seeded as City Manager
   - What's unclear: Does the plan include seeding the City Manager?
   - Recommendation: YES — seed Golden in the same migration (is_appointed=true, title='City Manager', LOCAL district). Omitting him leaves an important official absent.

3. **Are Springfield councillor photos accessible via stable URLs?**
   - What we know: Springfield TYPO3 CMS uses hash-based processed URLs that may not be stable
   - What's unclear: Whether source images exist at stable `/cos/fileadmin/user_upload/` paths
   - Recommendation: During Plan 02 (headshots), inspect each member page's source HTML. Accept gaps for members with no accessible official photo — best-effort is the standard for Tier 2.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase MCP | Migration application | ✓ | production | — |
| Python 3 + Pillow | Headshot download/resize | ✓ (Phase 108 used it) | Project version | — |
| psql CLI | DB queries | ✓ | 15.x | Supabase MCP |
| worcesterma.gov | Worcester headshots | ✓ (verified URL pattern) | Current | Wikipedia/Wikimedia for individuals |
| brockton.ma.us | Brockton Mayor headshot | ✓ (verified URL) | Current | GBH/Boston Globe news photos |
| springfield-ma.gov | Springfield council | [ASSUMED] | Current | Individual social profiles (best-effort) |
| lowellma.gov | Lowell council | [ASSUMED] | Current | Individual social profiles (best-effort) |
| quincyma.gov | Quincy council | [ASSUMED] | Current | Individual social profiles (best-effort) |

**Missing dependencies with no fallback:** None.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | SQL post-verification DO blocks (project pattern) |
| Config file | None — inline in migration files |
| Quick run | Apply migration via Supabase MCP, read RAISE NOTICE output |
| Full suite | Section-split query + politician count + office_id NULL check per city |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MA-TIER2-01 | Worcester address returns Mayor + Council | smoke | `SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -258200011 AND -258200001` → expect 11 | ❌ Wave 0 |
| MA-TIER2-01 | Worcester LOCAL section routing | integration | Resolve Worcester address, expect LOCAL section with Petty | ❌ Wave 0 |
| MA-TIER2-02 | Springfield/Lowell/Brockton/Quincy seeded | smoke | Count politicians in each external_id range | ❌ Wave 0 |
| MA-TIER2-02 | Headshots uploaded | smoke | `SELECT COUNT(*) FROM essentials.politician_images WHERE politician_id IN (...)` for all 5 cities | ❌ Wave 0 |

### Wave 0 Gaps

- [ ] Post-verification DO blocks in each city migration (gates: 1 government, 1 chamber, correct district count, correct politician count, 0 NULL office_id)
- [ ] Section-split count check after each migration (expect 56 → 55 → ... → 51)

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | — |
| V3 Session Management | No | — |
| V4 Access Control | No | — |
| V5 Input Validation | Yes (SQL) | Parameterized queries only; no string interpolation in SQL |
| V6 Cryptography | No | — |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection in headshot script | Tampering | Use parameterized queries in all DB inserts from Python script; never f-string into SQL |

---

## Sources

### Primary (HIGH confidence)
- `https://www.worcesterma.gov/city-council/councilors` — Complete Worcester council roster + headshot URL pattern (2026 verified)
- `https://www.springfield-ma.gov/cos/city-council-members` — Springfield council roster (2026-2027 term, fetched 2026-06-10)
- `https://www.lowellma.gov/533/Meet-the-City-Council` — Lowell council roster (11 members + Mayor)
- `https://www.lowellma.gov/198/City-Manager` — Thomas A. Golden Jr. confirmed as City Manager
- `https://brockton.ma.us/government/city-council/` — Brockton council roster (12 officials)
- `https://brockton.ma.us/news/moises-m-rodrigues-sworn-in-as-51st-mayor-of-brockton-pledges-unity-and-accountable-leadership/` — Rodrigues as 51st Mayor, Jan 5 2026
- `https://brockton.ma.us/government/mayors-office/` — Rodrigues headshot URL confirmed
- `http://www.quincyma.gov/government/elected_officials/city_council/index.php` — Complete Quincy council roster
- `http://www.quincyma.gov/government/elected_officials/mayor_s_office/mayor_s_bio.php` — Koch in seventh term confirmed Feb 2026
- `essentials.geofence_boundaries` (production DB, queried 2026-06-10) — 5 city geo_ids confirmed G4110
- `supabase_migrations.schema_migrations` (production DB) — last migration is 350; Phase 109 starts at 351
- `essentials.governments` (production DB) — no existing governments for 5 Tier 2 cities (all-new)
- `C:/EV-Accounts/backend/migrations/312_alexandria_government.sql` — City government seeding pattern
- `C:/EV-Accounts/backend/migrations/347_boston_government.sql` — Phase 108 Boston pattern (most recent)
- `C:/EV-Accounts/backend/migrations/180_me_tier2_lewiston_bangor_southportland_incumbents.sql` — Maine Tier 2 pattern for district-in-title encoding

### Secondary (MEDIUM confidence)
- `https://citizenportal.ai/articles/7252671/` — Lowell council sworn in Jan 2026; Gitschier elected mayor by council; Plan E confirmed
- `https://thequincysun.com/mahoney-next-quincy-city-council-president/` — Anne Mahoney as Quincy Council President Jan 2026
- `https://quincyquarry.com/quincy/2025/11/05/quincy-local-elections-all-but-clean-house-of-incumbents/` — Quincy all-new council Nov 2025
- `https://www.wgbh.org/news/politics/2025-11-06/five-things-to-know-about-moises-rodrigues-the-new-brockton-mayor` — Rodrigues background
- Wikipedia: Domenic Sarno sixth term, Worcester Mayor Petty, Lowell Plan E government
- `essentials.politicians` + `essentials.offices` + `essentials.districts` (Cambridge DB data) — council-manager model reference

### Tertiary (LOW confidence)
- Springfield TYPO3 headshot URL pattern (hash-based, unstable; planner must verify per-member)
- Lowell and Quincy headshot source patterns (unverified; assume accessible but need per-page inspection)

---

## Metadata

**Confidence breakdown:**
- Geo IDs: HIGH — queried directly from production DB
- Migration number: HIGH — queried from supabase_migrations.schema_migrations
- City rosters: HIGH for Worcester, Springfield, Brockton, Quincy; HIGH for Lowell (Plan E structure); MEDIUM for precise name spelling variants
- Government model (mayor-council vs. council-manager): HIGH for all 5 cities
- Headshot sources: HIGH for Worcester (URL pattern verified); MEDIUM for Brockton Mayor; LOW for Springfield/Lowell/Quincy (need per-page inspection)
- External ID ranges: HIGH — no conflicts confirmed via DB query

**Research date:** 2026-06-10
**Valid until:** 2027-01-01 (rosters stable until next municipal election cycle; Lowell 2027, others 2027-2028)
