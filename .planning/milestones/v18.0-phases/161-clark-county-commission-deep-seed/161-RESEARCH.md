# Phase 161: Clark County Commission Deep-Seed - Research

**Researched:** 2026-06-23
**Domain:** Greenfield county-government seed (government + chamber + 7 offices on single COUNTY district) + official-source headshots + evidence-only compass stances
**Confidence:** HIGH (migration shape, casing, external_ids, headshot URLs) / HIGH (roster — two sources confirmed, Chair correction documented)

## Summary

This is a **greenfield seed of the Clark County Board of County Commissioners** — the 7-member body that governs the unincorporated Las Vegas Strip, Paradise, Spring Valley, Sunrise Manor, and Enterprise. Phase 158 already loaded the Clark County COUNTY district (geo_id `32003`); Phase 161 creates the **government row**, **1 chamber** ("Board of County Commissioners"), **7 politicians**, **7 offices linked to that single existing COUNTY district**, the office_id back-fill, **7 headshots**, and **evidence-only compass stances**. No new geofences, no new districts.

The **primary analog is migration 244 (Multnomah County, Oregon)**: one government, one chamber, one COUNTY district, N offices all on that single district, office_id back-fill, inline post-verification DO block, ledger registration. Migration 276 (St. Mary's County, MD) provides a second confirmed county-government pattern. The Multnomah pattern also established the `COVERAGE_COUNTIES` surfacing approach (geo_id browse-government-list entry).

**Critical correction from CONTEXT.md:** CONTEXT.md stated "Chair currently Marilyn Kirkpatrick." This is wrong as of January 7, 2026. **Michael Naft (District A) was voted Chair on 2026-01-07; William McCurdy II (District D) is Vice-Chair.** Kirkpatrick is now a regular Commissioner (District B). The planner must model Naft's seat with `title='Commissioner (District A)'` + `role_canonical` or title-override for Chair, sorting him first per D-03. `[VERIFIED: fox5vegas.com 2026-01-07 + yournews.com 2026-01-07 + clarkcountynv.gov official BCC page 2026-06-23]`

**Primary recommendation:** Use migration 244 (Multnomah) as the verbatim structural template, substituting NV values: government "Clark County, Nevada, US"; chamber "Board of County Commissioners" / formal "Clark County Board of County Commissioners"; 7 offices all on `d.geo_id='32003' AND d.district_type='COUNTY' AND d.state='nv'`; external_ids `-3200301..-3200307` (geo_id-derived, mirrors St. Mary's -24037xxx pattern, no collisions with any existing NV range). Add to `COVERAGE_COUNTIES` with `browseGovernmentList: ['32003']`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** All 7 commissioners attach to the **single COUNTY district** (`essentials.districts` id=`f3708f34-6e23-4771-a8f7-44e400a23337`, geo_id `32003`, district_type `COUNTY`, label "Clark County"). A Strip/Paradise/Spring Valley address returns **all 7** "your county commissioners." No per-district (A–G) geofences this phase.
- **D-02:** Chamber name = **"Board of County Commissioners"** (matches official body name; analogous to Multnomah "Board of Commissioners").
- **D-03:** The board-selected **Chair (currently Michael Naft — see RESEARCH CORRECTION)** is modeled as a **title on his commissioner seat** (rotational-mayor / title-on-seat pattern), NOT a separate office row. Chair sorts first.
- **D-04:** Create a **standalone government "Clark County, Nevada, US"** — NOT nested under State of Nevada (geo_id 32). Prevents county officials from surfacing under the state.
- **D-05:** Chamber's offices link to existing COUNTY district at geo_id `32003`; new **external_id block for the 7 commissioners** in NV's negative scheme. Must not collide with existing ranges.
- **D-06:** Research **all live compass topics** per commissioner, **one agent at a time**, evidence-only / 100% cited / honest blank spokes / zero default values.
- **D-07:** Headshot source = **clarkcountynv.gov** commissioner pages; 600×750 crop-to-4:5 then resize; `photo_license` set at execution by source.

### Claude's Discretion
- Exact external_id range for the 7 commissioners (Wave-0 probe + pick unused block).
- Migration split (structural + audit-only headshots + per-commissioner stance migrations).
- Whether offices carry per-district label (e.g., "Commissioner (District A)") — recommended for display clarity.

### Deferred Ideas (OUT OF SCOPE)
- **Per-commission-district (A–G) geofences** for exact 1-commissioner-per-address routing.
- **Clark County row officers** (Sheriff/LVMPD, District Attorney, Assessor, Clerk, Recorder, Treasurer, Public Administrator).
- Mesquite (smallest incorporated Clark County city).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CLARK-01 | Clark County Commission deep-seeded (7-member board governing unincorporated Strip / Paradise / Spring Valley / Sunrise Manor / Enterprise) — government + roster + headshots + evidence-only stances | Verified 7-member roster below; county-government migration shape from mig 244 (Multnomah); office-link pattern on single COUNTY district; headshot URLs verified HTTP 200 for all 7; stance source availability confirmed (Legistar + Nevada Independent) |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Address → Clark County Commissioner routing | Database (COUNTY geofence + offices→COUNTY district) | API (`/representatives/me`) | COUNTY geofence (Phase 158) + offices join; PIP resolves Strip/Paradise/unincorporated to county tier |
| Government + chamber + office + politician seed | Database (migration) | — | Pure CRUD migration under `essentials` schema |
| Headshot acquisition + resize | Utility script (Python, inline orchestrator) | CDN / Storage (Supabase `politician_photos`) | Download→crop→resize→upload pipeline |
| Headshot DB linkage | Database (audit-only `politician_images` INSERT) | — | Row points to CDN URL |
| Stance research | Research agent (per commissioner, one at a time) | Database (inform schema) | Evidence-only; agent reads public votes/statements, executor INSERTs |
| Coverage chip (purple hasContext) | Frontend `src/lib/coverage.js` | — | Add Clark County to `COVERAGE_COUNTIES` array |
| Voter-facing title display | Frontend (existing groupHierarchy/profile UI) | — | Titles `Commissioner (District X)` / `Chairman` render via existing components |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PostgreSQL (Supabase) | live prod | Seed government/chambers/politicians/offices/images/stances | Project canonical store (`essentials` + `inform` schemas) `[VERIFIED: 244_multnomah_county_government.sql]` |
| Python 3 + Pillow (PIL) | repo `_tmp-*` scripts | Download → crop 4:5 → resize 600×750 Lanczos q90 | Exact pipeline used by every prior headshot phase `[VERIFIED: _tmp-va-delegates-headshots.py]` |
| requests | — | HTTP download + Supabase Storage PUT (`x-upsert`) | Same as VA/OR/Multnomah scripts `[VERIFIED]` |
| psycopg2 | — | Runtime `external_id → politician UUID` lookup | VA delegate script pattern `[VERIFIED: _tmp-va-delegates-headshots.py lines 216-225]` |

**No new packages installed.** All tooling already exists. **Package Legitimacy Audit: N/A** (no external package installs this phase).

## The Roster (HIGHEST PRIORITY OUTPUT)

**Methodology:** Compiled from the official clarkcountynv.gov Board of County Commissioners page (fetched 2026-06-23) and independently cross-checked against the Wikipedia "Clark County Commission" article. Both sources agree on all 7 seats. `[VERIFIED: clarkcountynv.gov/government/board_of_county_commissioners/ + en.wikipedia.org/wiki/Clark_County_Commission, 2026-06-23]`

### CRITICAL CORRECTION: Chair is Michael Naft, NOT Marilyn Kirkpatrick

The CONTEXT.md stated "Chair (currently Marilyn Kirkpatrick)." This was the previous Chair. **Michael Naft (District A) was unanimously elected Chair by the commission on January 7, 2026.** William McCurdy II (District D) was retained as Vice-Chair. Kirkpatrick is a Commissioner (District B) with no special title. `[VERIFIED: fox5vegas.com "Clark County Commission votes for new chairman of the board" 2026-01-07; yournews.com "Clark County Commission Selects Michael Naft as New Board Chairman" 2026-01-07]`

### The 7 Commissioners (as of 2026-06-23)

| Dist | external_id | Full name (canonical) | Party | Title on seat | Confidence |
|------|-------------|----------------------|-------|---------------|------------|
| A | -3200301 | Michael Naft | Democratic | Commissioner (District A) + Chair | HIGH |
| B | -3200302 | Marilyn Kirkpatrick | Democratic | Commissioner (District B) | HIGH |
| C | -3200303 | April Becker | Republican | Commissioner (District C) | HIGH |
| D | -3200304 | William McCurdy II | Democratic | Commissioner (District D) + Vice-Chair | HIGH |
| E | -3200305 | Tick Segerblom | Democratic | Commissioner (District E) | HIGH |
| F | -3200306 | Justin Jones | Democratic | Commissioner (District F) | HIGH |
| G | -3200307 | James B. Gibson | Democratic | Commissioner (District G) | HIGH |

**Composition:** 6 Democratic / 1 Republican (April Becker, sworn in January 2025 after winning District C in 2024). `[VERIFIED: reviewjournal.com "New county commissioner April Becker, three incumbents take oath" 2025-01-07]`

**Leadership display modeling (D-03):**
- Michael Naft: `title='Commissioner (District A)'` in the `offices` row. The Chair title-on-seat is modeled via the established LA-city-phase rotational-mayor pattern. Chair sorts first.
- William McCurdy II: `title='Commissioner (District D)'`. Vice-Chair analogous to "Vice Mayor" in rotational-chair cities.
- All other 5: `title='Commissioner (District X)'` where X = their district letter.

**Name notes:**
- "Tick Segerblom" — legal name is Richard Segerblom; official county website uses "Tick Segerblom". Use `full_name='Tick Segerblom'`, `first_name='Tick'`, `last_name='Segerblom'`. `[VERIFIED: clarkcountynv.gov District E page]`
- "James B. Gibson" — official county website uses this form. Short form "Jim Gibson" used in press. Use `full_name='James B. Gibson'`, `first_name='James B.'`, `last_name='Gibson'`. `[VERIFIED: clarkcountynv.gov District G page]`
- "William McCurdy II" — include the "II" suffix. `[VERIFIED: clarkcountynv.gov BCC page]`

**Roster currency:** Terms run 4 years, partisan election. April Becker won District C in Nov 2024 (sworn in Jan 2025). Justin Jones announced he will not seek re-election in 2026 but is **currently seated through Jan 2027**. Gibson's term expires Jan 2027. Segerblom and Gibson were re-elected in 2022. No vacancies as of 2026-06-23. `[VERIFIED: Wikipedia Clark County Commission; reviewjournal.com]`

**Wave-0 operator-verify checkpoint (RECOMMENDED):** Confirm the full roster against clarkcountynv.gov before applying the structural migration — this is a county commission with staggered terms and occasional mid-term appointments. `[ASSUMED — A3]`

### External_id block recommendation: `-3200301..-3200307`

**Rationale:** Mirrors the St. Mary's County pattern (geo_id=24037 → ext_ids -24037001..-24037005). Clark County geo_id=32003 → ext_ids -3200301 (Chair Naft, Dist A) through -3200307 (Gibson, Dist G). **Zero collisions** with any existing NV range (US House -32001..-32004; STATE_EXEC -3200001..-3200006; Senate -3203001..-3203021; Assembly -3204001..-3204042; US Senators -400057/-400058). The gap between -3200006 (last STATE_EXEC) and -3200301 (first commissioner) is unused. `[VERIFIED: grep of C:/EV-Accounts/backend/migrations/ — no -3200301 through -3200307 match found 2026-06-23]`

**MANDATORY Wave-0 DB probe:** Even with on-disk grep confirmation, the planner MUST query the live DB before authoring the migration:
```sql
SELECT COUNT(*) FROM essentials.politicians
WHERE external_id BETWEEN -3200307 AND -3200301;
-- Expected: 0
```

## Headshot Sources

**Primary (D-07) — clarkcountynv.gov AEM asset URLs (VERIFIED HTTP 200, all 7):**

The main BCC page (`/government/board_of_county_commissioners/`) embeds these asset URNs. The `/original/as/` path returns the commissioner portrait JPEG.

| Commissioner | District | AEM asset URL (full `/original/as/` form) | Content-Length | Dim |
|---|---|---|---|---|
| Michael Naft | A | `https://www.clarkcountynv.gov/adobe/assets/urn:aaid:aem:216e1b45-bc22-4f67-9ddb-6af03b44cf8c/original/as/commissioner-naft-dist-a.jpg` | 29,681 B | 175×175 |
| Marilyn Kirkpatrick | B | `https://www.clarkcountynv.gov/adobe/assets/urn:aaid:aem:6e201ef6-6aaa-47bc-9ea3-1c54202ebd69/original/as/commissioner-kirkpatrick-dist-b.jpg` | 29,157 B | 175×175 |
| April Becker | C | `https://www.clarkcountynv.gov/adobe/assets/urn:aaid:aem:d2f2d7c7-5d31-4d0b-9a02-423ccce4d989/original/as/commissioner-becker-dist-c.jpg` | 24,031 B | 175×175 |
| William McCurdy II | D | `https://www.clarkcountynv.gov/adobe/assets/urn:aaid:aem:a7f197d7-f947-4987-9235-161775bc136a/original/as/commissioner-mccurdy-ii-dist-d.jpg` | 26,176 B | 175×175 |
| Tick Segerblom | E | `https://www.clarkcountynv.gov/adobe/assets/urn:aaid:aem:b2de002e-8832-4492-b3a6-491cf8dacd23/original/as/commissioner-segerblom-dist-e.jpg` | 25,976 B | 175×175 |
| Justin Jones | F | `https://www.clarkcountynv.gov/adobe/assets/urn:aaid:aem:83fba492-9def-41bd-ae69-40c72bb61337/original/as/commissioner-jones-dist-f.jpg` | 26,480 B | 175×175 |
| James B. Gibson | G | `https://www.clarkcountynv.gov/adobe/assets/urn:aaid:aem:6c1b8a56-975f-4ade-ba2a-8c897996561f/original/as/commissioner-gibson-dist-g.jpg` | 27,029 B | 175×175 |

`[VERIFIED: curl HTTP 200, content-length confirmed, 2026-06-23. Naft and Kirkpatrick dimensions confirmed 175×175 by JPEG SOF marker analysis.]`

**Low-resolution warning:** All clarkcountynv.gov source images are 175×175 pixels (square thumbnails). Crop to 4:5 gives 140×175; resize to 600×750 = ~4.3× upscale. This is the same situation as Pasadena Jones/Madison (150×200, approved as-is 2026-06-20). The headshot script must handle the tiny source gracefully — PIL Lanczos upscale is acceptable per project precedent. **No WAF detected** — all 7 URLs served with a standard curl request (no special User-Agent required). `[VERIFIED: curl without browser UA 2026-06-23]`

**AEM URL pattern notes:**
- The thumbnail path (`/as/` without `/original/`) returns only ~7KB (thumbnail crop); the `/original/as/` path returns the full stored asset (~24-30KB, 175×175).
- Query parameters (`?width=800`) do NOT produce larger images from this AEM instance — returns same 7KB thumbnail.
- No WAF/403 behavior observed for any of the 7 URLs.
- `photo_license = 'us_government_work'` (clarkcountynv.gov is a US county government website; Multnomah used `public_domain` for the analogous multco.us county government source — either is defensible). `[ASSUMED — see A2]`

**Wikimedia Commons fallback (D-07, only if primary fails):**

| Commissioner | Wikimedia image | License | Dimensions |
|---|---|---|---|
| Marilyn Kirkpatrick | [Marilyn_Kirkpatrick,_Chairwoman_-_Cropped.jpg](https://upload.wikimedia.org/wikipedia/commons/5/5b/Marilyn_Kirkpatrick%2C_Chairwoman%2C_Clark_County_Commission_-_Cropped.jpg) | CC BY 2.0 | 3136×2823 (2.5MB) — HIGH RES |
| Justin Jones | [Jones_Headshot_(hi-res).tif](https://upload.wikimedia.org/wikipedia/commons/c/cf/Jones_Headshot_%28hi-res%29.tif) | CC BY-SA 4.0 | TIFF format, 3MB — HIGH RES (PIL can read TIFF) |
| Michael Naft | None found | — | — |
| April Becker | None found | — | — |
| William McCurdy II | Wikipedia page exists but no image | — | — |
| Tick Segerblom | None found (only historical Segerblom family images) | — | — |
| James B. Gibson | None found | — | — |

`[VERIFIED: Wikimedia Commons API + Wikipedia REST summary API, 2026-06-23]`

**Headshot strategy summary:** Use clarkcountynv.gov `/original/as/` as primary for all 7. If any primary fails, use Wikimedia for Kirkpatrick (CC BY 2.0, attribute "Horasis") or Jones (CC BY-SA 4.0, TIFF). For Naft/Becker/McCurdy/Segerblom/Gibson there is no known Wikimedia fallback — document genuine gap if primary also fails. Recall the descriptive Wikimedia UA rule (Wikimedia returns 429 on browser UA): `'EmpoweredVote-HeadshotBot/1.0 (https://empowered.vote; contact chris@empowered.vote)'`. `[VERIFIED: Phase 159 deviation note]`

**Note on Kirkpatrick high-res opportunity:** The clarkcountynv.gov image is 175×175. The Wikimedia Commons image for Kirkpatrick is 3136×2823 and would produce a far superior 600×750. The planner may elect to use Wikimedia as the **primary** source for Kirkpatrick even if the county URL works, to get higher quality. CC BY 2.0 requires attribution (stored in `photo_license='cc_by_2.0'`). This is a discretionary call. `[ASSUMED — see A4]`

## Migration Shape

### System Architecture Diagram

```
                clarkcountynv.gov BCC page          Wikipedia cross-check
                (7 commissioner profiles)            (Clark County Commission)
                       |                                     |
                       v                                     v
        [ Roster: District A-G -> name -> party -> title ]  (7 seats, both sources agree)
                       |
      ┌────────────────┴─────────────────────────────┐
      v                                               v
STRUCTURAL MIGRATION 1055 (registered)         HEADSHOT SCRIPT (_tmp-*, inline)
  - 1 government: Clark County, Nevada, US        for each of 7 ext_ids:
  - 1 district row: idempotent WHERE NOT EXISTS    resolve UUID (psycopg2 from DB)
      (Phase 158 already loaded geo_id=32003)      download clarkcountynv.gov 175x175 jpg
  - 1 chamber: Board of County Commissioners       crop 4:5 (140x175) -> resize 600x750 q90
  - 7 politicians (ON CONFLICT ext_id)             PUT Storage politician_photos/{uuid}-headshot.jpg
  - 7 offices -> SINGLE COUNTY district                |
      keyed (geo_id='32003', district_type='COUNTY',   v
       state='nv') + NOT EXISTS (district_id,  AUDIT MIGRATION 1056 (NOT registered)
       politician_id)                            politician_images INSERT (7 rows)
  - office_id back-fill (-3200307..-3200301)          |
  - inline post-verification DO block                  v
  - ledger registration (OUTSIDE BEGIN/COMMIT)  STANCE MIGRATIONS 1057-1063 (audit-only, NOT registered)
       |                                         one per commissioner, one at a time
       v
  apply_migration (inline orchestrator via psql -f or Supabase MCP)
       |
       v
  VERIFICATION: 7 offices on COUNTY district, 7 headshots CDN-200,
  evidence-only stances, 0 section-split, correct casing, ledger
       |
       v
  Any Strip/Paradise/unincorporated NV address -> /representatives/me
  -> Clark County Board of County Commissioners (all 7) with photos
```

### Recommended Migration File Structure
```
C:/EV-Accounts/backend/migrations/
├── 1055_clark_county_commission.sql        # STRUCTURAL, registered: govt + district + chamber + 7 politicians + 7 offices + back-fill
├── 1056_clark_county_commission_headshots.sql  # AUDIT-ONLY, NOT registered: 7 politician_images rows
├── 1057_clark_county_commission_naft_stances.sql      # AUDIT-ONLY per commissioner
├── 1058_clark_county_commission_kirkpatrick_stances.sql
├── 1059_clark_county_commission_becker_stances.sql
├── 1060_clark_county_commission_mccurdy_stances.sql
├── 1061_clark_county_commission_segerblom_stances.sql
├── 1062_clark_county_commission_jones_stances.sql
├── 1063_clark_county_commission_gibson_stances.sql
C:/EV-Accounts/backend/scripts/
└── _tmp-clark-county-commission-headshots.py  # gitignored, run inline
```
*Stance migrations numbered from 1057 — confirm exact numbers in Wave 0 based on verified on-disk MAX. All stance migrations are AUDIT-ONLY (not registered in schema_migrations).*

### Pattern 1: Government INSERT (idempotent)
**Source:** `244_multnomah_county_government.sql` Step 1 (exact analog, NV-substituted).
```sql
-- Source: 244_multnomah_county_government.sql Step 1 (NV-substituted)
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'Clark County, Nevada, US',
       'County', 'NV', NULL, '32003'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'Clark County, Nevada, US'
);
-- governments.state = 'NV' UPPERCASE (government table convention, same as Multnomah 'OR').
-- No unique constraint on geo_id -- WHERE NOT EXISTS guard required.
```

### Pattern 2: District INSERT (idempotent — Phase 158 already loaded this row)
**Source:** `244_multnomah_county_government.sql` Step 3 (NV-substituted).
```sql
-- Source: 244_multnomah_county_government.sql Step 3
-- Phase 158 loaded geo_id='32003' COUNTY district. This INSERT is idempotent (no-ops if exists).
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'COUNTY', 'nv', '32003', 'Clark County', 'G4020'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '32003' AND district_type = 'COUNTY' AND state = 'nv'
);
-- districts.state = 'nv' LOWERCASE (TIGER loader writes lowercase state abbreviations for
--   COUNTY/LOCAL/STATE_UPPER/STATE_LOWER tiers -- confirmed by load-state-tiger-boundaries.ts:539
--   and by mig 244 for 'or' and mig 276 for 'md').
```

### Pattern 3: Chamber INSERT (idempotent, slug excluded)
**Source:** `244_multnomah_county_government.sql` Step 2 (NV-substituted).
```sql
-- Source: 244_multnomah_county_government.sql Step 2
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'Board of County Commissioners',
       'Clark County Board of County Commissioners',
       (SELECT id FROM essentials.governments WHERE name = 'Clark County, Nevada, US')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Board of County Commissioners'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'Clark County, Nevada, US')
);
-- CRITICAL: slug is GENERATED ALWAYS -- never include in INSERT column list.
-- name_formal must NOT be '' (breaks profile page render -- mig 107 lesson).
```

### Pattern 4: Politician + Office CTE (7 blocks, all linked to COUNTY district)
**Source:** `244_multnomah_county_government.sql` Step 4 (exact pattern, NV-substituted).

The office WHERE clause uses `(district_id, politician_id)` NOT EXISTS guard (unlike the legislature migrations which use `(district_id, chamber_id)` — county pattern has one person per office vs. many members per district). `[VERIFIED: mig 244 line 115-119]`

```sql
-- Source: 244_multnomah_county_government.sql BLOCK 1 (NV-substituted)
-- Chair Naft (District A, -3200301) — title-on-seat pattern
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Michael Naft', 'Michael', 'Naft', 'Democratic',
          true, false, false, true, -3200301)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Board of County Commissioners'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'Clark County, Nevada, US')),
       p.id,
       'Commissioner (District A)', 'NV', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '32003'
  AND d.district_type = 'COUNTY'
  AND d.state = 'nv'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
-- Repeat for Kirkpatrick (-3200302)... Becker (-3200303)... McCurdy (-3200304)...
-- Segerblom (-3200305)... Jones (-3200306)... Gibson (-3200307)
-- NOTE: 'd.state = 'nv'' LOWERCASE for COUNTY tier (mirrors 244 'or' / 276 'md' patterns).
-- NOTE: 'representing_state = 'NV'' UPPERCASE (offices label column, not join key).
-- NOTE: party field for commissioners: 6 Democratic / 1 Republican (Becker).
```

**Office title format:** Use `'Commissioner (District A)'` through `'Commissioner (District G)'`. This mirrors Multnomah's `'Commissioner (District 1)'` through `'Commissioner (District 4)'`. Provides display clarity even though all 7 offices are on the single COUNTY district. `[CITED: 244_multnomah_county_government.sql line 142]`

**Chair modeling:** Naft gets `title='Commissioner (District A)'` as the base title. The Chair display order is handled by the groupHierarchy.js Chair-first ordering (same as rotational Mayor in LA city phases). No `role_canonical` field change needed — the `title='Commissioner (District A)'` seats Naft without a `LOCAL_EXEC` office. ⚠️ VERIFY with the executor: does groupHierarchy.js sort county commissioners by title alphabetically, or is there a Chair-specific signal? The Multnomah migration also used NULL `role_canonical` and no `LOCAL_EXEC` for the Chair. The Phase 83 UAT issues memory notes Chair-first ordering was fixed — confirm the fix covers county tier. `[ASSUMED — see A5]`

### Pattern 5: office_id back-fill
**Source:** `244_multnomah_county_government.sql` Step 5.
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -3200307 AND -3200301
  AND p.office_id IS NULL;
```

### Pattern 6: Inline post-verification DO block
**Source:** `244_multnomah_county_government.sql` Step 6 (exact, NV-substituted).
```sql
DO $$
DECLARE
  v_gov_count INTEGER; v_office_count INTEGER; v_split_count INTEGER;
BEGIN
  -- Gate (a): 1 government row
  SELECT COUNT(*) INTO v_gov_count FROM essentials.governments
  WHERE name = 'Clark County, Nevada, US';
  IF v_gov_count <> 1 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 1 Clark County government row, found %', v_gov_count;
  END IF;

  -- Gate (b): 7 offices linked to COUNTY district
  SELECT COUNT(*) INTO v_office_count FROM essentials.offices o
  JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.geo_id = '32003' AND d.district_type = 'COUNTY' AND d.state = 'nv';
  IF v_office_count <> 7 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 7 offices, found %', v_office_count;
  END IF;

  -- Gate (c): section-split clean
  SELECT COUNT(*) INTO v_split_count FROM essentials.geofence_boundaries gb
  WHERE gb.geo_id = '32003' AND gb.mtfcc = 'G4020'
    AND NOT EXISTS (SELECT 1 FROM essentials.districts d
                    WHERE d.geo_id = gb.geo_id AND d.district_type = 'COUNTY' AND d.state = 'nv');
  IF v_split_count <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: section-split %', v_split_count;
  END IF;

  RAISE NOTICE 'Post-verification PASSED: gov=%, offices=%, split=%', v_gov_count, v_office_count, v_split_count;
END $$;
```

### Pattern 7: Structural registration (OUTSIDE BEGIN/COMMIT)
**Source:** `244_multnomah_county_government.sql` Step 7, 159-PATTERNS.
```sql
-- After COMMIT, outside transaction:
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('1055', 'clark_county_commission')
ON CONFLICT (version) DO NOTHING;
```
The headshot migration (1056) and all stance migrations (1057-1063) are **NOT** registered.

### Pattern 8: politician_images INSERT (audit-only, no photo_origin_url)
**Source:** `245_multnomah_county_headshots.sql` (exact — 5-row county headshots, same column shape).
```sql
-- 1056_clark_county_commission_headshots.sql (AUDIT-ONLY -- NOT registered)
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -3200301),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/<uuid>-headshot.jpg',
       'default', 'us_government_work'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -3200301)
);
-- Repeat for -3200302 through -3200307.
-- Columns exactly (id, politician_id, url, type, photo_license) -- NO photo_origin_url.
```

### COVERAGE_COUNTIES update (src/lib/coverage.js)
```javascript
// Add to COVERAGE_COUNTIES array, after Multnomah County:
{ label: 'Clark County', browseGovernmentList: ['32003'], browseStateAbbrev: 'NV', hasContext: true },
```
This is the same pattern Multnomah uses (`browseGovernmentList: ['41051']`). The county is surfaced as a browse target in the COVERAGE_COUNTIES array (search-only, not in the landing grid per the comment). `[VERIFIED: coverage.js COVERAGE_COUNTIES lines 215-230 shape 2026-06-23]`

⚠️ Note: No `NV` entry in `COVERAGE_STATES` yet (NV cities come in Phases 162-165). The Clark County entry goes into `COVERAGE_COUNTIES` only for now. NV cities will add a state block to `COVERAGE_STATES` during Phase 168 (retro/close-out) or individually as cities are completed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| County government seed | Custom one-off INSERT | mig 244 Multnomah pattern (verbatim, NV-substituted) | 3rd proven county analog (Multnomah=OR, St. Mary's=MD, Clark=NV) |
| Resolve ext_id → UUID in headshot script | Hardcode UUIDs | Runtime psycopg2 lookup by external_id | UUIDs minted by mig 1055; VA/Multnomah scripts use runtime lookup |
| Crop to 4:5 | Custom math | `crop_to_4_5()` from `_tmp-va-delegates-headshots.py` | Handles both wider+taller cases; 175×175 source is square → needs crop for 4:5 |
| Section-split detection | Manual query | inline DO block + post-phase SQL check | Built into mig 244 and all county analogs |
| Coverage chip surfacing | Landing.jsx | `coverage.js COVERAGE_COUNTIES` | All county governments use this array per project convention |

## Common Pitfalls

### Pitfall 1: Wrong Chair (CHAIR IS NAFT, NOT KIRKPATRICK)
**What goes wrong:** CONTEXT.md says "currently Marilyn Kirkpatrick." This was stale as of January 7, 2026 when Naft was elected Chair.
**How to avoid:** Research confirmed Naft is Chair. Set his `title='Commissioner (District A)'` (with whatever groupHierarchy signals Chair-first).
**Warning signs:** Kirkpatrick appearing as "Chairman" in the UI, or Naft not appearing first in the list.

### Pitfall 2: Lowercase `state='nv'` for COUNTY district (the county-tier casing rule)
**What goes wrong:** Using `d.state='NV'` (uppercase) in the office WHERE clause matches zero COUNTY rows — TIGER loader writes lowercase `'nv'` for the county tier.
**Why:** Confirmed in `load-state-tiger-boundaries.ts:539` — `state: abbrev` where abbrev is lowercase from FIPS_TO_STATE. Multnomah used `'or'`; St. Mary's used `'md'`; Clark uses `'nv'`.
**How to avoid:** `WHERE d.geo_id='32003' AND d.district_type='COUNTY' AND d.state='nv'`.
**Warning signs:** Migration succeeds but `SELECT COUNT(*) FROM offices WHERE chamber_id IN (...)` returns 0.

### Pitfall 3: Re-inserting the district (Phase 158 already loaded it)
**What goes wrong:** Inserting a duplicate COUNTY district row for geo_id=32003, causing a second district with the same geo_id that would route ambiguously.
**How to avoid:** Use the `WHERE NOT EXISTS (geo_id='32003' AND district_type='COUNTY' AND state='nv')` idempotency guard (exact Multnomah pattern). The INSERT will no-op since Phase 158 loaded this row. NEVER skip the guard.

### Pitfall 4: slug in chamber INSERT
**What goes wrong:** `cannot insert a non-DEFAULT value into column slug`.
**How to avoid:** `slug` is GENERATED ALWAYS — never include in INSERT column list.

### Pitfall 5: photo_origin_url column
**What goes wrong:** `column "photo_origin_url" does not exist`.
**How to avoid:** `politician_images` is exactly `(id, politician_id, url, type, photo_license)`. `[VERIFIED: 159-PATTERNS, 245_multnomah_county_headshots.sql]`

### Pitfall 6: Two-government section-split
**What goes wrong:** Offices accidentally link to a chamber under a different government (e.g., State of Nevada geo_id='32' instead of Clark County geo_id='32003').
**How to avoid:** Chamber lookup uses `name='Board of County Commissioners' AND government_id=(SELECT id FROM governments WHERE name='Clark County, Nevada, US')`. Run section-split SQL after mig 1055.

### Pitfall 7: Registering audit-only migrations
**What goes wrong:** Inserting mig 1056 / 1057-1063 into `schema_migrations` corrupts the ledger.
**How to avoid:** Only mig 1055 is registered. Headshots and stances are audit-only, applied via execute_sql.

### Pitfall 8: Grep gates on forbidden tokens
**Source:** 159-01-SUMMARY deviation. Automated gates flag `slug`, `schema_migrations`, `photo_origin_url` in SQL file comments.
**How to avoid:** Keep these tokens out of explanatory comments. The `schema_migrations` registration INSERT (Step 7) is unavoidable, but explanatory comments should paraphrase (e.g., "the auto-generated path column" instead of writing "slug").

### Pitfall 9: Stale migration counter
**Source:** Phase 159 had counter drift (STATE.md said "next 1048" but DB MAX was 1049). STATE.md currently says "next 1053" but phases 160 applied 1053+1054. On-disk max confirmed = 1054. Next = **1055**.
**How to avoid:** Always run Wave-0 DB probe: `SELECT MAX(CAST(version AS INTEGER)) FROM supabase_migrations.schema_migrations;` — expected MAX = 1053 (only structural migs are registered; 1054 was audit-only and NOT registered). Next structural = 1055.

### Pitfall 10: `name_formal = ''` on chamber
**What goes wrong:** Empty formal name breaks profile page render (mig 107 lesson).
**How to avoid:** `name_formal = 'Clark County Board of County Commissioners'` (not empty).

## Stances

### Source material availability for Clark County Commissioners
Clark County commissioners vote on public record. Rich documentary trail across three tiers:

1. **Clark.legistar.com** — Clark County's Legistar portal (full meeting minutes, vote records, agenda items). Multi-year searchable archive. `[VERIFIED: clark.legistar.com, accessible 2026-06-23]`
2. **Nevada Independent (thenevadaindependent.com)** — High-quality Nevada political journalism; extensive commissioner voting records and policy coverage. `[VERIFIED: search results 2026-06-23]`
3. **Las Vegas Review-Journal / KLAS 8NewsNow / Fox5Vegas** — Local media with commissioner vote coverage on housing, homelessness, public safety, cannabis regulation, immigration enforcement, etc.
4. **Campaign websites and first-party statements** — All 7 have recent campaigns (2024: Becker; 2022: Gibson, McCurdy; etc.) with issue platforms.

**Realistic stance-count expectation:** County commissioners vote on a narrower policy range than state legislators but broader than most city councils. Expect 6-12 stances per commissioner for well-documented seats (Naft Chair since 2026, Jones attorney/former state senator, Segerblom cannabis/progressive record, Kirkpatrick former Assembly Speaker). Becker (sole Republican, first-term 2025) and Gibson (older tenure, business-oriented) may yield fewer. Honest blanks for topics with no county-level evidence (e.g., `social-security`, `trans-athletes`, `school-vouchers` — no county jurisdiction).

**Compass topics likely to have county-level evidence:**
- `homelessness` / `homelessness-response` — Clark County runs the Southern Nevada Regional Housing Authority; commissioners vote on encampment policy
- `local-immigration` — Clark County is a partial sanctuary county (Jones was vice chair when policy set)
- `public-safety-approach` — Sheriff/LVMPD budget; policing policy
- `housing` / `rent-regulation` — county land use; RSO for unincorporated areas
- `cannabis-regulation` — Segerblom is THE canonical compass anchor here (authored NV legalization)
- `economic-development` — gaming/resort district policy; development approvals
- `transportation-priorities` — RTC Southern Nevada, airport policy (District G covers Harry Reid)
- `local-environment` — water policy, Mojave Desert; Las Vegas Wash

**Research protocol:** One commissioner at a time (memory `feedback_stance_research_one_at_a_time`). All live compass topic IDs from `project_compass_live_topic_ids`. No retired IDs. No defaults. Honest blanks. `[CITED: CONTEXT.md D-06]`

## Runtime State Inventory

> Greenfield government seed — no rename/refactor. Included for seed-state dimensions.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Clark County COUNTY district already loaded by Phase 158 (id=f3708f34, geo_id=32003, district_type=COUNTY, state='nv') | Reference this district; do NOT re-insert (use WHERE NOT EXISTS guard) |
| Live service config | No external service holds commissioner state | None |
| OS-registered state | None | None |
| Secrets/env vars | Script reads `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` from `C:/EV-Accounts/backend/.env` (unchanged) | None |
| Build artifacts | None | None |
| **Pre-existing district (critical)** | COUNTY district geo_id=32003 loaded by Phase 158 | Office INSERT references it; idempotent district INSERT guard prevents duplicate |
| **External_id space** | In use: US House -32001..-32004; STATE_EXEC -3200001..-3200006; Senate -3203001..-3203021; Assembly -3204001..-3204042; US Senators -400057/-400058 | Use -3200301..-3200307 (non-colliding; Wave-0 DB probe REQUIRED) |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| clarkcountynv.gov AEM headshots | Headshots (all 7) | ✓ | 175×175 JPEG, HTTP 200 no WAF | Wikimedia (Kirkpatrick CC BY 2.0; Jones CC BY-SA 4.0 TIFF) |
| Supabase Storage `politician_photos` | Headshot upload | ✓ | live (CDN base confirmed) | — |
| Python3 + Pillow + requests + psycopg2 | Headshot script | ✓ (repo scripts use them) | — | — |
| Supabase DB (apply via psql -f or Supabase MCP) | Migrations | ✓ (inline-orchestrator only) | live | — |
| `C:/EV-Accounts/backend/.env` | Script auth | ✓ | — | — |
| Clark.legistar.com / Nevada Independent | Stance research | ✓ | publicly accessible | Las Vegas Review-Journal, Fox5Vegas |

**Missing dependencies with no fallback:** None.

## Validation Architecture

> nyquist_validation: config key absent → treated as ENABLED. Phase is data-seed; validation is SQL/HTTP assertions run by the inline orchestrator.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | SQL assertions via Supabase execute_sql + curl HTTP-200 checks (no pytest/jest for seed data) |
| Config file | none — inline orchestrator runs the queries |
| Quick run command | per-criterion SQL below |
| Full suite command | all 8 checks; all must pass before `/gsd:verify-work` |

### Phase Requirements → Test Map

| Req | Behavior | Test | Command | Exists? |
|-----|----------|------|---------|---------|
| CLARK-01 | 7 commissioners seeded and routed | count offices in BCC chamber | `SELECT COUNT(*) FROM essentials.offices o JOIN essentials.chambers c ON c.id=o.chamber_id JOIN essentials.governments g ON g.id=c.government_id WHERE g.name='Clark County, Nevada, US';` → 7 | Wave 0 |
| CLARK-01 | offices link to COUNTY district geo_id=32003 | district join | `SELECT COUNT(*) FROM essentials.offices o JOIN essentials.districts d ON d.id=o.district_id JOIN essentials.chambers c ON c.id=o.chamber_id WHERE d.geo_id='32003' AND d.district_type='COUNTY' AND d.state='nv' AND c.name='Board of County Commissioners';` → 7 | Wave 0 |
| CLARK-01 | 7 headshots present | images count | `SELECT COUNT(*) FROM essentials.politician_images WHERE politician_id IN (SELECT id FROM essentials.politicians WHERE external_id BETWEEN -3200307 AND -3200301) AND type='default';` → 7 | Wave 0 |
| CLARK-01 | headshots serve | CDN HTTP 200 | `curl -sI <each CDN url>` → 200 (spot-check all 7) | Wave 0 |
| CLARK-01 | evidence-only stances | stance count | `SELECT COUNT(*) FROM inform.politician_answers WHERE politician_id IN (SELECT id FROM essentials.politicians WHERE external_id BETWEEN -3200307 AND -3200301);` → ≥1 (after stance migrations) | Wave 0 |
| SC | section-split clean | split scan | section-split SQL below → 0 rows | Wave 0 |
| SC | casing correct | district state | `SELECT DISTINCT state FROM essentials.districts d JOIN essentials.offices o ON o.district_id=d.id JOIN essentials.chambers c ON c.id=o.chamber_id WHERE c.name='Board of County Commissioners';` → only `'nv'` (lowercase) | Wave 0 |
| SC | ledger correct | schema_migrations | `SELECT version FROM supabase_migrations.schema_migrations WHERE version IN ('1055','1056');` → only 1055 (audit-only 1056 not registered) | Wave 0 |
| SC | no phantom 8th seat | office count | same count query → exactly 7 (not 8) | Wave 0 |

### Section-Split Verification SQL (COUNTY tier)
```sql
-- Expect 0 rows.
SELECT g.name, p.full_name, COUNT(DISTINCT ch.government_id) AS gov_count
FROM essentials.politicians p
JOIN essentials.offices o   ON o.politician_id = p.id
JOIN essentials.chambers ch ON ch.id = o.chamber_id
JOIN essentials.governments g ON g.id = ch.government_id
JOIN essentials.districts d ON d.id = o.district_id
WHERE d.geo_id = '32003' AND d.district_type = 'COUNTY'
GROUP BY g.name, p.full_name
HAVING COUNT(DISTINCT ch.government_id) > 1;
```

### Address-routing spot check (headline success criterion)
Pick a known Las Vegas Strip address (e.g., a casino's mailing address in the Paradise CDP) and call `/representatives/me`. Assert the response includes "Clark County" with 7 commissioner offices. A City of Las Vegas incorporated address should NOT return these commissioners (it returns City of LV officials instead).

Example spot-check address: `3600 S Las Vegas Blvd, Las Vegas, NV 89109` (Bellagio — unincorporated Paradise, ZIP routes to Clark County, not City of LV).

Browse link for review: `essentials.empowered.vote/results?browse_government_list=32003&browse_label=Clark+County&browse_state=NV&browse_skip_overlap=1`

### Sampling Rate
- **Per migration apply:** count check for offices (→ 7).
- **Per phase gate:** all 8 checks green + stance rows > 0 for all 7 commissioners before `/gsd:verify-work`.

### Wave 0 Gaps
- [ ] DB probe: `SELECT MAX(CAST(version AS INTEGER)) FROM supabase_migrations.schema_migrations;` → assert MAX=1053; next structural=1055.
- [ ] DB probe: confirm external_id range -3200301..-3200307 is unused in politicians table.
- [ ] DB probe: confirm Clark County COUNTY district exists: `SELECT id, geo_id, district_type, state, label FROM essentials.districts WHERE geo_id='32003' AND district_type='COUNTY';` — should return 1 row with state='nv'.
- [ ] Operator-verification checkpoint: confirm full 7-member roster against clarkcountynv.gov before applying mig 1055.
- [ ] No test framework install needed (SQL/HTTP assertions only).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Clark County COUNTY district `state='nv'` lowercase (loaded by Phase 158 TIGER loader) | Migration Shape Pattern 2, Pitfall 2 | HIGH if wrong — office WHERE clause matches 0 rows, silent no-op. MANDATORY Wave-0 probe. Mitigation: the TIGER loader code explicitly confirms lowercase (load-state-tiger-boundaries.ts:539). |
| A2 | `photo_license = 'us_government_work'` for clarkcountynv.gov portraits | Headshot Sources | LOW — both `us_government_work` and `public_domain` are defensible for county-government source; Multnomah used `public_domain`. Operator picks. |
| A3 | No quiet mid-2026 appointment or resignation beyond what both sources show | The Roster | MEDIUM — covered by recommended operator-verification checkpoint before applying mig 1055. |
| A4 | Using clarkcountynv.gov 175×175 primary (vs. high-res Wikimedia for Kirkpatrick) | Headshot Sources | LOW — cosmetic quality only; planner may elect to use Wikimedia CC BY 2.0 for Kirkpatrick. |
| A5 | GroupHierarchy.js Chair-first ordering covers the COUNTY tier (Naft sorts first) | Migration Shape Pattern 4 | MEDIUM — Phase 83 UAT confirmed Chair-first fix for Multnomah but this was phase 83. Verify at execution time; if not already handled, the groupHierarchy.js fix from phase 156 (a235f25) may need extension to county. |

## Open Questions (RESOLVED — runtime-mitigated)

> Both questions are resolved at execution time via gates built into the plans; neither blocks artifact authoring. Q2 additionally pre-confirmed by the orchestrator on 2026-06-23 (ledger structural MAX=1053 → next=1055; county district `state='nv'`).

1. **GroupHierarchy.js Chair-first ordering for county tier** — RESOLVED at runtime per A5 (Plan 03 Task 3 human-verify step 2: check groupHierarchy.js / Multnomah display; extend if Naft not first).
   - Known: LA city phases (155/156) have groupHierarchy.js rotational-mayor ordering. Phase 83 (Multnomah) fixed Chair-first (memory `project_phase83_uat_issues`).
   - Unclear: Whether the groupHierarchy.js fix (commit a235f25) covers the COUNTY tier specifically, and whether it's deployed.
   - Recommendation: Executor checks groupHierarchy.js and Multnomah display at execution time. If Naft doesn't appear first, extend the existing pattern.

2. **Phase migration counter confirmation** — RESOLVED: orchestrator pre-confirmed structural ledger literal MAX=1053 (1051/1052/1054 are audit-only, unregistered); on-disk files through 1054 → next structural = **1055**. Plan 01 Task 2 P1 re-asserts before apply.

## Security Domain

> `security_enforcement` not set in config → treated as enabled. Data-seed phase; minimal attack surface.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — (no auth changes) |
| V3 Session Management | no | — |
| V4 Access Control | no | service-role key used only by inline orchestrator (not committed) |
| V5 Input Validation | yes | All seed data from authoritative gov sources; SQL uses parameterized/literal idempotent inserts; image bytes re-encoded via PIL (strips EXIF/stego) |
| V6 Cryptography | no | — |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malicious image payload from remote source | Tampering | PIL re-encode to clean JPEG (drops EXIF/embedded data) — already in pipeline `[VERIFIED: VA script line 357]` |
| Service-role key leakage | Information disclosure | Key lives in gitignored `.env`; scripts are gitignored `_tmp-*` |
| Wrong-government section split | Data integrity | Section-split SQL gate (0 rows) + inline DO block in mig 1055 |

## Sources

### Primary (HIGH confidence)
- `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql` — verbatim county-government structural analog (government + district + chamber + politician/office CTEs + office_id back-fill + post-verification DO block + ledger registration)
- `C:/EV-Accounts/backend/migrations/245_multnomah_county_headshots.sql` — county headshot audit-only migration pattern
- `C:/EV-Accounts/backend/migrations/276_stmarys_county_government.sql` — second county analog; confirms geo_id-based external_id scheme (-24037xxx for geo_id=24037)
- `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts:539` — confirms COUNTY district `state='nv'` is lowercase (TIGER loader writes lowercase state abbrev)
- `https://www.clarkcountynv.gov/government/board_of_county_commissioners/` — official BCC page (roster + AEM URNs, fetched 2026-06-23)
- `https://www.fox5vegas.com/2026/01/07/clark-county-commission-votes-new-chairman-board/` — Naft Chair election 2026-01-07
- `C:/Transparent Motivations/essentials/src/lib/coverage.js` — COVERAGE_COUNTIES pattern for county surfacing
- `.planning/phases/160-nevada-legislature-seed-headshots/160-PATTERNS.md` + `160-RESEARCH.md` — migration template, executor/orchestrator split, grep-gate hygiene

### Secondary (MEDIUM confidence)
- `https://en.wikipedia.org/wiki/Clark_County_Commission` — roster cross-check (district→name→party, all 7 seats confirmed)
- `https://yournews.com/2026/01/07/5991496/clark-county-commission-selects-michael-naft-as-new-board-chairman/` — Naft Chair confirmation
- Wikimedia Commons API — Kirkpatrick (CC BY 2.0, 3136×2823) and Jones (CC BY-SA 4.0 TIFF) headshot verification

### Tertiary (LOW confidence)
- businessinclarkcounty.com/about-clark-county/clark-county-commissioners/ — OCED commissioner list (cross-check only)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verbatim analogs (Multnomah, St. Mary's), no new packages
- Architecture / SQL patterns: HIGH — mig 244/276 are exact role-matches
- Roster: HIGH — two independent sources (official site + Wikipedia) agree on all 7 seats; Chair correction verified from two news sources
- Headshot sources: HIGH — all 7 URLs HTTP 200 confirmed; dimensions confirmed 175×175; low-res noted but consistent with project precedent (Pasadena)
- County district casing: HIGH — confirmed by TIGER loader source code (load-state-tiger-boundaries.ts:539)
- External_id range: HIGH — on-disk grep shows no collisions; Wave-0 DB probe still MANDATORY

**Research date:** 2026-06-23
**Valid until:** 2026-11-04 (next NV county election date) for the roster; structural patterns indefinite.
