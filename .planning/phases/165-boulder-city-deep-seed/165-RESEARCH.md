# Phase 165: Boulder City Deep-Seed - Research

**Researched:** 2026-06-29
**Domain:** Boulder City, NV city government seed (at-large, no-ward model) + headshots + evidence-only compass stances
**Confidence:** HIGH (roster/form-of-government, headshot sources, migration counter, geo_id/casing, external_id block, stance evidence richness)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01: Single-city-district model is PRIMARY (not a fallback)**
Boulder City elects its council purely at-large — no wards. All 5 members (Mayor + 4 council) attach to the one existing Boulder City G4110 city geofence (geo_id `3206500`, loaded by Phase 158). A Boulder City address returns the Mayor + all 4 at-large council members. No ward loader, no custom ward MTFCC.

**D-01a: NO ward-boundary loader, NO custom ward MTFCC**
Unlike LV X0015 / Henderson X0016 / NLV X0017 — Boulder City has no wards.

**D-01b: Two-district-type pattern on a single geofence**
Mayor on a LOCAL_EXEC district (geo_id `3206500`); 4 council members on a shared LOCAL district (geo_id `3206500`). Both districts reference the same G4110 geofence. Produces 0 section-split and an at-large "Council Member" label (no ward number).

**D-02: Mayor modeling**
Directly-elected Mayor (Joe Hardy, elected 2022) as a distinct at-large seat, "Mayor" title, LOCAL_EXEC district, sorted first. NOT rotational/title-on-seat. Chamber official_count=5.

**D-03: Office scope**
Mayor + City Council only. Elected Municipal Court judge deferred to a future judicial-compass phase. Non-elected offices out of scope.

**D-04: Government modeling + IDs**
Standalone government "City of Boulder City, Nevada, US" (NOT nested under State of NV). INSERT via WHERE NOT EXISTS. Greenfield. external_id block −3208001..−3208005 confirmed free. geo_id = `3206500` (TIGER G4110 place FIPS).

**D-04a: At-large title**
Council member title = "Council Member" (no ward number). Chamber name = "Boulder City City Council" or "Boulder City Council" (planner chooses).

**D-05: Stance topic scope + headshots**
All live compass topics, one agent at a time, evidence-only, 100% cited, honest blank spokes, zero defaults, chairs model. No judicial topics. D-07 emphasis: growth-and-development (Controlled Growth Ordinance), economic-development (solar lease revenue), taxes (lowest property tax in NV, solar-funded budget), local-environment/data-centers (Eldorado Valley charter + 2026 ballot question).

**D-06: Headshot sourcing chain**
bcnv.org / flybouldercity.com official council portraits first → established workarounds if blocked → free alternates. 600×750, crop-4:5 then resize (Lanczos q90), no text/graphic overlays, no fabrication. `photo_license` set at execution.

**D-07: Boulder City civic issues flagged for stance emphasis**
Controlled Growth Ordinance (120-unit/year residential cap, 45+ years old), no-gambling charter (one of two NV cities banning gaming), solar-energy land lease revenue (~33% of city budget), data centers in Eldorado Valley (Feb 2026 council vote + Nov 2026 ballot question).

### Claude's Discretion

- Exact council-office district structure: 1 shared LOCAL district on geo_id `3206500` carrying 4 at-large "Council Member" offices + 1 LOCAL_EXEC Mayor office on `3206500`.
- Chamber name ("Boulder City City Council" vs "Boulder City Council") matching official body.
- Exact external_id assignment within the confirmed −3208xxx block.
- Migration numbering: next migration is 1100 (on-disk MAX = 1099; Wave-0 re-verifies before any write).

### Deferred Ideas (OUT OF SCOPE)

- Boulder City elected Municipal Court judge — future judicial-compass phase.
- Non-elected city offices (City Attorney, City Manager, City Clerk) — out of scope.
- Ward-precise routing / ward geofences — not applicable (at-large city).

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CLARK-05 | Boulder City deep-seeded — government + roster + headshots + evidence-only stances | (1) Roster verified: Mayor Hardy + 4 at-large council members confirmed from bcnv.org + flybouldercity.com; (2) 5 headshots: all 5 available via flybouldercity.com ImageRepository — NO WAF, high-res JPEG confirmed (2080×2499 to 1733×2042); (3) Stance evidence: Controlled Growth Ordinance, solar lease votes, camping ban, data-center ballot question all provide cited council-level evidence; (4) coverage.js NV block — append Boulder City after North Las Vegas at line 188 |

</phase_requirements>

---

## Summary

Phase 165 deep-seeds the City of Boulder City, Nevada — 1 standalone government, 1 chamber ("Boulder City City Council"), 5 officials (directly-elected Mayor + 4 at-large council members), 5 headshots, and evidence-only compass stances for all 5. This is structurally the simplest NV city deep-seed to date: Boulder City has no wards, making it a pure at-large model closer to the Clark County Commission (all offices on one shared district) than to the three prior ward cities.

**Form of government confirmed: council-manager, at-large.** Boulder City's city charter establishes a council-manager form with a Mayor and four City Council members who serve as nonpartisan and at-large. The Mayor is directly elected on a separate ballot line (4-year term), not rotational. Five seated officials total; official_count=5. This is the structural opposite of LV/Henderson/NLV — no ward geofences, no custom MTFCC, no ward boundary loader. [VERIFIED: bcnv.org/27/Government — "council-manager form of government"; "Mayor and four City Council members, who serve as nonpartisan and at-large"]

**Live roster confirmed (2026-06-29):** Mayor Joe Hardy (elected 2022, term expires 2026), Mayor Pro Tem Sherri Jorgensen (elected 2021, re-elected 2024, term expires 2028), Council members Cokie Booth (elected 2022, term expires 2026), Steve Walton (elected 2022, term expires 2026), Denise E. Ashurst (elected Nov 2024 — defeated incumbent Matt Fox — term expires 2028). [VERIFIED: bcnv.org/159/City-Council + flybouldercity.com/941/Meet-the-Council] Note: Hardy, Booth, and Walton have terms expiring 2026 — their seats are on the June 9 / Nov 3, 2026 ballot. They remain the seated officials until the outcome and inauguration; seed all five as is_active=true, is_incumbent=true.

**Headshots: NO WAF — all 5 available at high resolution from flybouldercity.com.** Unlike Henderson and North Las Vegas (Akamai WAF-403), flybouldercity.com serves individual council member portraits via a clean ImageRepository endpoint (no authentication, no Akamai/Cloudflare block). All 5 images return HTTP 200 with image/jpeg content-type at sizes ranging from 1733×2042 to 2080×2600 — well above the 600×750 target, requiring crop-4:5 then resize as normal. This is the most favorable headshot situation since Clark County (which had AEM thumbnails requiring upscaling); Boulder City has full-resolution originals. [VERIFIED: curl probes 2026-06-29, all 5 documentIds confirmed]

**Migration counter confirmed: 1099 on-disk MAX → next structural migration = 1100.** [VERIFIED: live ls of C:/EV-Accounts/backend/migrations/ on 2026-06-29 — highest file is 1099_north_las_vegas_cherchio_stances.sql]

**Primary recommendation:** Adapt `1093_north_las_vegas_city_council.sql` → `1100_boulder_city_city_council.sql`, dropping all ward-district logic (replace 4 LOCAL ward districts + 4 separate council member offices with 1 shared LOCAL district on `3206500` + 4 council offices on it). Adapt `_tmp-north-las-vegas-council-headshots.py` → `_tmp-boulder-city-council-headshots.py` using the flybouldercity.com ImageRepository URLs (all pre-confirmed, no fallback needed). Migrate stances starting at 1101 (audit-only). Migration block: 1100 structural + 1101 headshots + 1102–1106 stances (one per official).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| At-large council routing (all 5 members) | Database / Storage (existing G4110 geofence) | API / Backend (ST_Covers PIP) | All 5 offices attach to geo_id=3206500 G4110; backend resolves via existing PIP logic — no new geofence needed |
| Mayor LOCAL_EXEC ordering | API / Backend (groupHierarchy.js) | — | LOCAL_EXEC sorts before LOCAL automatically; no code change needed |
| Government/chamber/office seed | Database / Storage (migrations) | — | SQL migrations write to essentials.* tables |
| Headshot pipeline | API / Backend (Python script) | CDN / Static (Supabase Storage) | _tmp-*.py crops, resizes, uploads; Storage serves via CDN |
| Stance research | API / Backend (inform schema) | — | inform.politician_answers + inform.politician_context, applied via SQL |
| City surfacing (purple chip) | Frontend (coverage.js) | — | Append Boulder City to existing Nevada block in COVERAGE_STATES after North Las Vegas |

---

## Standard Stack

Phase 165 uses no new npm/PyPI packages. All tooling is reused from Phases 162–164.

### Core (reused from prior NV phases)

| Tool / Pattern | Version | Purpose | Basis |
|----------------|---------|---------|-------|
| psql -f (migration apply) | any | Apply structural + audit-only SQL migrations | Phase 160/161/163/164 executor split |
| psycopg2 (Python headshot script) | 2.x | DB UUID resolution from external_id | `_tmp-north-las-vegas-council-headshots.py` (Phase 164) |
| Pillow/PIL (Python) | any installed | crop-4:5 → resize 600×750 Lanczos q90 | Phase 162/163/164 headshot pipeline |
| requests (Python) | any installed | HTTP fetch of headshot images | Phase 162/163/164 headshot pipeline |

**No ward boundary loader script required** — the `load-*-ward-boundaries.ts` scripts from Phases 162/163/164 do NOT apply to Boulder City. This removes one entire Wave-0 task compared to all prior NV city phases.

---

## Package Legitimacy Audit

No new external packages required for Phase 165. All dependencies are pre-existing in the project.
Skipping Package Legitimacy Gate (no new installs).

---

## Architecture Patterns

### System Architecture Diagram

```
flybouldercity.com ImageRepository (no WAF, HTTP 200 confirmed)
    │ /ImageRepository/Document?documentId={10964,9459,10924,10899,14763}
    │ 5 high-res JPEG portraits (1733×2042 to 2080×2600)
    ▼
_tmp-boulder-city-council-headshots.py (Wave 1)
    │ crop-4:5 → resize 600×750 Lanczos q90 → Storage PUT
    ▼
Supabase Storage: politician_photos/{uuid}-headshot.jpg
    │
    ├──► migration 1100 (structural — registered)
    │       INSERT governments "City of Boulder City, Nevada, US"
    │       INSERT chambers "Boulder City City Council" (official_count=5)
    │       INSERT districts: 1 LOCAL_EXEC geo_id=3206500 (Mayor)
    │                          1 LOCAL  geo_id=3206500 (4 council members)
    │       INSERT 5 politicians + offices + back-fill
    │
    ├──► migration 1101 (audit-only, headshots)  →  5 politician_images rows
    │
    └──► migrations 1102–1106 (audit-only, one per official)
            inform.politician_answers + inform.politician_context

Backend ST_Covers query:
    Boulder City address → ST_Covers(gb.geometry, point) →
        G4110 geo_id=3206500 → LOCAL_EXEC district → Mayor Hardy
                             → LOCAL district → 4 council members (all 4)
    (No ward polygon needed — correct for an at-large city)

coverage.js COVERAGE_STATES NV block:
    ADD: { label: 'Boulder City', browseGovernmentList: ['3206500'], browseStateAbbrev: 'NV', hasContext: true }
    after North Las Vegas at line 188.
```

### Recommended Project Structure (new files)

```
C:/EV-Accounts/backend/
├── scripts/
│   └── _tmp-boulder-city-council-headshots.py  # NEW (gitignored)
└── migrations/
    ├── 1100_boulder_city_city_council.sql       # STRUCTURAL (registered)
    ├── 1101_boulder_city_council_headshots.sql  # AUDIT-ONLY
    ├── 1102_boulder_city_hardy_stances.sql      # AUDIT-ONLY (Mayor)
    ├── 1103_boulder_city_jorgensen_stances.sql  # AUDIT-ONLY
    ├── 1104_boulder_city_booth_stances.sql      # AUDIT-ONLY
    ├── 1105_boulder_city_walton_stances.sql     # AUDIT-ONLY
    └── 1106_boulder_city_ashurst_stances.sql    # AUDIT-ONLY

C:/Transparent Motivations/essentials/
└── src/lib/coverage.js                          # EDIT — append Boulder City after NLV at line 188
```

### Pattern 1: Structural Migration 1100 (at-large, 2 districts sharing same geo_id)

**What:** Seeds the government + chamber + 1 LOCAL_EXEC district + 1 LOCAL district (both on geo_id=`3206500`) + 5 politician+office CTEs + office_id back-fill + post-verify DO block + ledger registration.

**Key divergence from NLV (1093):** Replace the 4 LOCAL ward districts + 4 separate ward-specific office CTEs with a SINGLE LOCAL district on `3206500` + 4 at-large council office CTEs all pointing at that same district. The pre-flight ward-count assertion is REMOVED (no ward geofences to verify).

**Analog:** Clark County `1055_clark_county_commission.sql` is the closest structural model — all 7 offices on one shared district. NLV `1093` is the migration-shape template, but its ward-district blocks are replaced.

**Two-district setup on the same geo_id:**

```sql
-- Step 3a: LOCAL_EXEC for Mayor (geo_id = city G4110 place)
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL_EXEC', 'nv', '3206500', 'City of Boulder City', 'G4110'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '3206500' AND district_type = 'LOCAL_EXEC' AND state = 'nv'
);

-- Step 3b: LOCAL for 4 at-large council members (SAME geo_id — one shared district)
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'nv', '3206500', 'City of Boulder City', 'G4110'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '3206500' AND district_type = 'LOCAL' AND state = 'nv'
);
-- Result: 2 distinct district rows, both with geo_id='3206500', one LOCAL_EXEC + one LOCAL
-- Backend PIP resolves G4110 → both districts → Mayor (LOCAL_EXEC) + all 4 council (LOCAL)
```

**Mayor CTE (LOCAL_EXEC, Hardy):**

```sql
-- Source: 1093_north_las_vegas_city_council.sql adapted for Boulder City
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Joe Hardy', 'Joe', 'Hardy', 'Non-Partisan',
          true, false, false, true, -3208001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Boulder City City Council'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'City of Boulder City, Nevada, US')),
       p.id,
       'Mayor', 'NV', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '3206500'
  AND d.district_type = 'LOCAL_EXEC'
  AND d.state = 'nv'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

**Council Member CTE (LOCAL, at-large — same for all 4 council members):**

```sql
-- All 4 council members attach to the SAME LOCAL district (geo_id='3206500', district_type='LOCAL')
-- Repeat for Jorgensen (-3208002), Booth (-3208003), Walton (-3208004), Ashurst (-3208005)
-- with appropriate titles 'Council Member' (no ward number) and status flags
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Sherri Jorgensen', 'Sherri', 'Jorgensen', 'Non-Partisan',
          true, false, false, true, -3208002)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Boulder City City Council'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'City of Boulder City, Nevada, US')),
       p.id,
       'Council Member', 'NV', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '3206500'
  AND d.district_type = 'LOCAL'   -- CRITICAL: LOCAL (not LOCAL_EXEC) for council members
  AND d.state = 'nv'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

### Pattern 2: Headshot Script (all 5 confirmed, no fallback needed)

**Analog:** `_tmp-north-las-vegas-council-headshots.py` (Phase 164). Copy verbatim; change only the OFFICIALS roster list, the guard-assertion range, and the header/print strings.

**OFFICIALS roster — all 5 pre-confirmed:**

```python
# Source: flybouldercity.com/941/Meet-the-Council ImageRepository
# ALL verified HTTP 200, image/jpeg, sizes 1733×2042 to 2080×2600 (high-res, no WAF)
# Standard Chrome UA sufficient — no Akamai / no descriptive UA needed for this source
OFFICIALS = [
    {'ext_id': -3208001, 'name': 'Joe Hardy',
     'url': 'https://www.flybouldercity.com/ImageRepository/Document?documentId=10964',
     'license': 'us_government_work'},
    {'ext_id': -3208002, 'name': 'Sherri Jorgensen',
     'url': 'https://www.flybouldercity.com/ImageRepository/Document?documentId=9459',
     'license': 'us_government_work'},
    {'ext_id': -3208003, 'name': 'Cokie Booth',
     'url': 'https://www.flybouldercity.com/ImageRepository/Document?documentId=10924',
     'license': 'us_government_work'},
    {'ext_id': -3208004, 'name': 'Steve Walton',
     'url': 'https://www.flybouldercity.com/ImageRepository/Document?documentId=10899',
     'license': 'us_government_work'},
    {'ext_id': -3208005, 'name': 'Denise E. Ashurst',
     'url': 'https://www.flybouldercity.com/ImageRepository/Document?documentId=14763',
     'license': 'us_government_work'},
]
# Guard assertion range: -3208005 <= m['ext_id'] <= -3208001
# No Wikimedia sources → no descriptive UA needed (Chrome UA sufficient)
# Crop notes: all images are near-portrait already (ratio ~0.83 to ~0.85 vs 0.8 target)
#   e.g. Hardy 2080×2499 → already close to 4:5; crop-to-4:5 removes a small amount
#   Booth 1857×2600 → wider than tall after crop? No: 1857/2600 = 0.714, taller than 4:5
#                    → crop_to_4_5 crops HEIGHT → new_h = int(1857/0.8) = 2321, keep top 2321px
# All images well above 600×750 — no upscaling; pure downscale Lanczos is clean
```

### Pattern 3: Stance Migration CTE Shape

Identical to `1095..1099_north_las_vegas_*_stances.sql` (Phase 164). Topic-key + is_live join; ON CONFLICT DO UPDATE; audit-only; zero defaults; chairs model. See §Stance Evidence below for Boulder City-specific topic richness.

### Pattern 4: coverage.js NV Block Addition

Current state (lines 183–190, confirmed 2026-06-29):

```javascript
{
  name: 'Nevada', abbrev: 'NV',
  areas: [
    { label: 'Las Vegas', browseGovernmentList: ['3240000'], browseStateAbbrev: 'NV', hasContext: true },
    { label: 'Henderson', browseGovernmentList: ['3231900'], browseStateAbbrev: 'NV', hasContext: true },
    { label: 'North Las Vegas', browseGovernmentList: ['3251800'], browseStateAbbrev: 'NV', hasContext: true },
  ],
},
```

After Phase 165 edit — append one line after North Las Vegas (line 188):

```javascript
      { label: 'Boulder City', browseGovernmentList: ['3206500'], browseStateAbbrev: 'NV', hasContext: true },
```

Browse verification link: `essentials.empowered.vote/results?browse_geo_id=3206500&browse_mtfcc=G4110`

### Anti-Patterns to Avoid

- **Using ward-district logic from NLV (1093)** — Boulder City has NO wards; drop the pre-flight X0017 count assertion and all 4 LOCAL ward-district INSERTs. Replace with 1 single LOCAL district on `3206500`.
- **Council member title with ward number** — at-large title is "Council Member" (no "Ward N" suffix). Unlike NLV.
- **Attempting flybouldercity.com without any User-Agent** — Chrome UA is sufficient and confirmed working. But do confirm the URL uses `flybouldercity.com` not `bcnv.org` for the Meet-the-Council portrait path (both domains are official; flybouldercity.com is confirmed for the portraits).
- **uppercase `d.state='NV'`** — the #1 silent failure mode across all NV phases. District join keys are lowercase `'nv'`. Uppercase matches zero rows.
- **Hardcoding the auto-generated path column in chamber INSERT** — GENERATED ALWAYS, never in the INSERT column list.
- **Using `photo_origin_url` column** — removed from `essentials.politician_images`; does not exist.
- **Seeding Hardy/Booth/Walton as inactive** — their terms expire 2026 but they remain seated until the Nov 3, 2026 election outcome and inauguration. Seed all five as `is_active=true, is_incumbent=true`.
- **Treating Mayor Pro Tem as a separate LOCAL_EXEC seat** — "Mayor Pro Tem" is Jorgensen's informal title/role within the council; she is NOT a separately-elected Mayor Pro Tem seat. She is a Council Member who holds the Mayor Pro Tem designation. Seed her as `title='Council Member'`, NOT `title='Mayor Pro Tem'` (or create a phantom 6th seat). The Mayor Pro Tem designation does not merit a separate office row — it is title-on-seat at most, but Boulder City's 5-seat structure is confirmed (no separate MPT election, no 6th seat).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Headshot download + crop + resize | Manual PIL one-off | Adapt `_tmp-north-las-vegas-council-headshots.py` | Correct crop-first-then-resize pipeline; RGBA→white-composite; x-upsert; per-member manifest; tested in 4 prior phases |
| Stance CTE shape | New schema inference | Copy Phase 164 stance migration exactly | topic_id join via is_live=true; ON CONFLICT idempotency; audit-only non-registration |
| Government INSERT guard | Unique constraint assumption | `WHERE NOT EXISTS (... WHERE name=...)` | `essentials.governments` has no unique constraint on geo_id or name |
| At-large routing for 4 council members | One LOCAL district per council member (overkill) | 1 shared LOCAL district on `3206500`, 4 office rows on it | All 4 members are at-large; one shared district is correct; individual districts would work but add unnecessary rows |

---

## Key Verified Facts

### Boulder City Government Structure

[VERIFIED: bcnv.org/27/Government — explicit "council-manager form of government"; "Mayor and four City Council members, who serve as nonpartisan and at-large"; confirmed 2026-06-29]
[VERIFIED: bcnv.org/159/City-Council — 5 names/titles/terms; confirmed 2026-06-29]
[VERIFIED: flybouldercity.com/941/Meet-the-Council — 5 names, election years; confirmed 2026-06-29]

**Form of government:** Council-manager. Directly-elected Mayor (at-large, 4-year term) + 4 at-large council members (4-year terms, staggered). No wards. Nonpartisan. Charter city.

**Seat count:** 5 total (Mayor + 4 council). `official_count=5`.

**Election cycle (staggered):** Mayor + 2 council seats in one even-year cycle; 2 council seats in the alternate even-year cycle. Mayor + Booth + Walton are on the 2026 ballot (term expires 2026). Jorgensen + Ashurst are on the 2028 ballot.

**Offices up in June/Nov 2026:** Mayor, Council Member (2 seats — Booth and Walton).

**Current roster (as of 2026-06-29):**

| Seat | Name | Title | Term / Status |
|------|------|-------|---------------|
| At-large (Mayor) | Joe Hardy | Mayor | Elected 2022; term expires 2026; on ballot June/Nov 2026; seated until inauguration post-Nov 2026. is_active=true, is_incumbent=true |
| At-large | Sherri Jorgensen | Mayor Pro Tem / Council Member | Elected 2021, re-elected Nov 2024; term expires 2028. is_appointed=false, is_incumbent=true |
| At-large | Cokie Booth | Council Member | Elected 2022; term expires 2026; on ballot 2026; seated until inauguration. is_active=true, is_incumbent=true |
| At-large | Steve Walton | Council Member | Elected 2022; term expires 2026; on ballot 2026; seated until inauguration. is_active=true, is_incumbent=true |
| At-large | Denise E. Ashurst | Council Member | Elected Nov 2024 (defeated incumbent Matt Fox, ~60% vs ~40%); term expires 2028. is_appointed=false, is_incumbent=true |

All `party='Non-Partisan'`.

### Boulder City geo_id (TIGER G4110 Place)

[VERIFIED: CONTEXT.md D-04 states "geo_id `3206500` (loaded by Phase 158)"; Phase 158 TIGER G4110 place for Boulder City, NV = FIPS 3206500]

**geo_id = `3206500`** (TIGER Place FIPS for City of Boulder City, NV).
**geofence_boundaries.state for G4110:** TIGER loader writes `state='32'` (FIPS string) for G4110 place boundaries. The `districts` rows for LOCAL and LOCAL_EXEC use `state='nv'` (lowercase). **Wave-0 must confirm the exact casing of the loaded Boulder City G4110 row** (`SELECT geo_id, state FROM essentials.geofence_boundaries WHERE name ILIKE '%Boulder City%' AND mtfcc='G4110'`).

### external_id Collision Analysis

[VERIFIED: CONTEXT.md D-04b cites Wave-0 collision probe confirming −3208001..−3208005 free; established in discussion phase]

**Proposed block:** −3208001..−3208005 (5 seats). Extends the LV/Henderson/NLV convention by incrementing the thousandths digit beyond −3207xxx (NLV). Wave-0 re-probe: `SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -3208005 AND -3208001` → expect 0.

**Suggested external_id assignment:**
- −3208001: Joe Hardy (Mayor)
- −3208002: Sherri Jorgensen (Council Member)
- −3208003: Cokie Booth (Council Member)
- −3208004: Steve Walton (Council Member)
- −3208005: Denise E. Ashurst (Council Member)

### Migration Counter

[VERIFIED: live ls C:/EV-Accounts/backend/migrations/ on 2026-06-29; highest file = 1099_north_las_vegas_cherchio_stances.sql]

**On-disk MAX = 1099.** Next structural migration = **1100**. Wave-0 must re-run `ls .../migrations/ | grep -oE '^[0-9]+' | sort -n | tail -1` immediately before execution — more may land between research and execution.

### Headshot Sources

[VERIFIED: curl probes to flybouldercity.com ImageRepository on 2026-06-29 — all 5 return HTTP 200, image/jpeg]

**Primary source (flybouldercity.com/941/Meet-the-Council): CLEAN — no WAF.** Unlike Henderson and North Las Vegas, the official Boulder City "Fly Boulder City" tourism/city portal serves council portraits directly without any Akamai or Cloudflare WAF. Standard Chrome User-Agent returns HTTP 200.

| Member | documentId | Verified Size | Content-Type |
|--------|-----------|---------------|--------------|
| Joe Hardy (Mayor) | 10964 | 2080×2499 RGB | image/jpeg |
| Sherri Jorgensen | 9459 | 2080×2600 RGB | image/jpeg |
| Cokie Booth | 10924 | 1857×2600 RGB | image/jpeg |
| Steve Walton | 10899 | 2080×2600 RGB | image/jpeg |
| Denise E. Ashurst | 14763 | 1733×2042 RGB | image/jpeg |

All images are well above 600×750 — pure downscale, no upscaling artifacts. Crop-to-4:5 removes a small amount from width or height depending on original ratio. All originals are near-portrait (ratio 0.71–0.84 vs 0.80 target) — `crop_to_4_5` handles each correctly. No RGBA transparency issues (all RGB).

**photo_license:** `us_government_work` (flybouldercity.com is an official city portal). Set at execution by operator per actual source.

**Fallback not expected to be needed.** Zero gap anticipated. Document a FAILED line in the manifest only if a URL 404s at execution time — confirmed clean as of 2026-06-29.

### Stance Evidence Richness (Boulder City Specifics)

[CITED: bouldercityreview.com, bcnv.org, reviewjournal.com, nevadaindependent.com, bcnv.org FY25 Annual Comprehensive Financial Report]

Boulder City's small size (~16,000 residents) means council members produce fewer individual votes on statewide issues, but the city's distinctive civic identity (growth ordinance, no-gambling charter, solar revenue, 2026 data-center ballot question) provides concentrated, well-documented council positions.

**Topics likely to have cited evidence per D-07:**

| Topic Key | Evidence Richness | Notes |
|-----------|------------------|-------|
| `growth-and-development` | HIGH | Controlled Growth Ordinance (120 residential units/year cap, ~45 years old); council votes on allotment approvals; subdivision ratings (bouldercityreview.com has individual-vote coverage). Hardy, Jorgensen, Booth all have public Growth Ordinance positions. |
| `economic-development` | HIGH | Solar lease revenue is ~33% of city budget (FY25 ACFR: $13.7M from solar leases). Council votes on lease extensions (Dec 2024: council denied Boulder Flats Solar extension request), lease rewrites (2024: council approved rewrite for solar lease). |
| `taxes` | MEDIUM | Boulder City has the lowest property tax in Nevada (residents pay 1/3 of what Henderson residents pay) — council positions on solar-funded budget replace property-tax revenue; budget cycle coverage in Boulder City Review. |
| `local-environment` | MEDIUM | Eldorado Valley land-use restrictions (charter); 2022 ballot question (voters approved natural gas / clean energy storage as permitted uses); solar rezoning 783 acres (2023). |
| `data-centers` | HIGH (2026) | Feb 24, 2026: council voted unanimously to place data-center ballot question on the Nov 2026 ballot ("Should data center facilities be an approved land use within the Eldorado Valley Transfer Area...?"). This is a current, documented council vote with individual members on record. [CITED: reviewjournal.com, Nevada Current, hoodline.com 2026] Planning Commission rejected a proposed AI data center after three hours of public opposition. |
| `homelessness-response` | MEDIUM | Council voted 5-0 (May 2025) to outlaw camping/sleeping/storing property on public land. [CITED: bouldercityreview.com "Council outlaws camping, sleeping in public" 2025] Individual member votes determinable from meeting minutes. |
| `public-safety-approach` | MEDIUM-LOW | Boulder City has its own PD (BCPD, not LVMPD). Public safety budget coverage in Boulder City Review; likely some individual council positions on staffing/budget. |
| `housing` | MEDIUM-LOW | Controlled Growth Ordinance directly limits housing supply; council positions on the ordinance double as housing positions. Individual housing development votes (e.g. Sunrise Terrace subdivision) documented. |
| `transportation-priorities` | LOW | Small city, few transit decisions; possible Nevada Way remodel/streetscape coverage but sparse individual-vote evidence. |
| `cannabis-regulation` | LOW | No-gambling charter context; cannabis regulation likely exists but sparse council-level individual statements expected. |

**Evidence caveat:** Boulder City is a small city with low media coverage compared to LV/Henderson. bouldercityreview.com is the primary local source. For members with shorter records (Ashurst, elected Nov 2024), honest blanks are expected on most topics. Hardy has the richest record (former state senator, mayor since 2022; multiple documented positions on growth, solar, data centers). Jorgensen has documented positions on growth (voted to deny a subdivision plan, per search results) and regional council participation.

**Honest-blank expectation per member:**
- Hardy (Mayor): richest record — likely 6–10 evidenced topics
- Jorgensen: 4–7 topics (well-documented positions on growth, regional council, homelessness)
- Booth/Walton: 3–5 topics (less individual media coverage, but growth/solar votes documented)
- Ashurst: 2–4 topics (only Nov 2024 through present; limited individual vote record in short tenure)

---

## Common Pitfalls

### Pitfall 1: Carrying Ward Logic from NLV Migration Template
**What goes wrong:** Adapting 1093 NLV structural migration without removing the pre-flight ward assertion and 4 LOCAL ward-district INSERTs. The pre-flight `WHERE mtfcc='X0017' < 4` will fail immediately (0 X0017 rows, as intended). The 4 LOCAL ward district INSERTs reference geo_ids that don't exist.
**Why it happens:** NLV (1093) is the immediate structural template.
**How to avoid:** Drop the pre-flight block entirely. Replace 4 LOCAL ward districts with 1 LOCAL district on `geo_id='3206500'`. Replace 4 ward-specific council CTEs with 4 at-large council CTEs all referencing `d.geo_id='3206500' AND d.district_type='LOCAL'`.
**Warning signs:** Pre-flight RAISE EXCEPTION fires on migration apply; or 0 LOCAL offices seeded because the geo_ids don't match.

### Pitfall 2: Mayor Pro Tem Jorgensen seeded as separate LOCAL_EXEC seat
**What goes wrong:** Treating "Mayor Pro Tem" as a separately-elected position meriting its own LOCAL_EXEC district or 6th seat.
**Why it happens:** The title "Mayor Pro Tem" appears prominently in BCNv.org council listings. In some cities Mayor Pro Tem is an election-distinct role.
**How to avoid:** Boulder City's Mayor Pro Tem is a council-internal designation (not separately elected). Jorgensen is a Council Member whose colleagues designated her Mayor Pro Tem. Seed her as `title='Council Member'` on the shared LOCAL district (or add "Mayor Pro Tem" as a parenthetical if desired, but NOT as a 6th row or LOCAL_EXEC district). The chamber has exactly 5 seats.
**Warning signs:** Post-verify DO block finds 6 offices instead of 5; or 2 LOCAL_EXEC rows for `3206500`.

### Pitfall 3: flybouldercity.com vs bcnv.org URL confusion
**What goes wrong:** Using `bcnv.org/ImageRepository/Document?documentID=...` instead of `flybouldercity.com/ImageRepository/Document?documentId=...` — the bcnv.org domain has a group photo (documentID=14772) but individual member portraits are on flybouldercity.com.
**Why it happens:** Both are official city domains; bcnv.org is the primary city site; the search returned bcnv.org first.
**How to avoid:** The 5 individual portrait documentIds (10964, 9459, 10924, 10899, 14763) are confirmed on `www.flybouldercity.com`. Use that domain. Note: documentId parameter case is lowercase (`documentId=`) on flybouldercity.com vs uppercase (`documentID=`) on bcnv.org — use the correct parameter case per domain.
**Warning signs:** Wrong image served (group photo instead of individual portrait); or 404 if wrong domain.

### Pitfall 4: Hardy/Booth/Walton seeded as inactive due to 2026 election
**What goes wrong:** Marking incumbents with expiring 2026 terms as `is_active=false` or `is_incumbent=false`.
**Why it happens:** Their terms expire 2026; they are on the June/Nov ballot.
**How to avoid:** Seed all five officials as `is_active=true, is_incumbent=true`. They remain the seated officials until the 2026 election outcomes and inaugurations. This matches the NLV precedent (Scott Black remained seated despite running for Mayor; Garcia-Anderson's appointment status was corrected but she remained active).
**Warning signs:** Browse UI shows vacant seats for Booth/Walton/Hardy positions.

### Pitfall 5: Two LOCAL districts on geo_id='3206500' (incorrect; only 1)
**What goes wrong:** Creating one LOCAL district per council member (4 rows) rather than one shared LOCAL district with 4 office rows.
**Why it happens:** NLV template had one LOCAL district per ward.
**How to avoid:** Boulder City has no wards — there is no reason to create separate LOCAL districts. One shared LOCAL district (`geo_id='3206500'`, `district_type='LOCAL'`, `state='nv'`) carries all 4 at-large council offices. The Clark County Commission (1055) is the correct structural analog (one COUNTY district, 7 office rows).
**Warning signs:** Post-verify finds 5 LOCAL districts for `3206500` instead of 1; section-split scan fails.

### Pitfall 6: Section-split risk from missing district (must verify via post-verify DO block)
**What goes wrong:** If the `WHERE NOT EXISTS` guard on the LOCAL district fires incorrectly (e.g., a pre-existing LOCAL district from a test run), council member offices may attach to the wrong district or fail to insert.
**Why it happens:** `essentials.governments` and by extension chambers have no unique constraint; neither do districts (which guard on `geo_id + district_type + state`).
**How to avoid:** Post-verify DO block asserts: 1 government, 1 LOCAL_EXEC office, 4 LOCAL offices (total 5), 0 section-split orphans (no G4110 `3206500` geofence row lacks a matching district). Confirm the 5-row count.

### Pitfall 7: All Phase 162/163/164 SQL pitfalls still apply
- **Lowercase `state='nv'`** for all district WHERE clauses; uppercase `'NV'` for governments / offices.representing_state.
- **Grep-gate forbidden tokens in .sql comments:** keep `slug`, `photo_origin_url`, `schema_migrations` (except in the actual ledger INSERT) out of comments. Use paraphrases.
- **Chambers auto-generated path column** is GENERATED ALWAYS — never include in INSERT column list.
- **politician_images column shape:** exactly `(id, politician_id, url, type, photo_license)` — no `photo_origin_url`.

---

## Stance Evidence — D-07 Boulder City Topics in Detail

### Controlled Growth Ordinance (growth-and-development)
[CITED: bouldercityreview.com/news/understanding-the-growth-ordinance-77784/]

The ordinance limits new residential construction to 120 units/year with a 30-unit/year per-developer cap. Passed ~45 years ago. Staff manage allotments; council votes on specific development approvals above staff recommendation. The Boulder City Review has covered multiple individual council votes on subdivision allotment requests. Jorgensen in particular has documented votes denying subdivision plans. Growth-and-development stances for most council members should be achievable with a search of Boulder City Review meeting coverage.

### Solar Land Lease Revenue (economic-development, taxes)
[CITED: bcnv.org/DocumentCenter/View/16340/FY25-Annual-Comprehensive-Financial-Report-PDF — "$13.7 million — one-third of the entire budget — comes from the solar leases"]
[CITED: bouldercityreview.com/news/council-denies-solar-lease-extension-request-89778/ — Dec 2024 council denied Boulder Flats Solar extension]
[CITED: bouldercityreview.com/news/city-government/rewrite-for-solar-lease-gets-councils-ok-102311/ — 2024 council approved solar lease rewrite]

Solar lease votes are individual council votes on record. The council's collective stance on solar development as a revenue source (lowest property tax in Nevada = explicitly enabled by solar revenue) is well-documented. Individual member positions on specific lease decisions are accessible in meeting minutes and Boulder City Review coverage.

### Data Centers in Eldorado Valley (data-centers)
[CITED: reviewjournal.com/news/environment/data-centers-will-be-on-the-ballot-in-this-southern-nevada-city-3727498/]
[CITED: hoodline.com/2026/03/boulder-city-desert-showdown-voters-to-decide-fate-of-data-hub-plan/]

Feb 24, 2026 city council voted to place "Should data center facilities be an approved land use within the Eldorado Valley Transfer Area...?" on the November 2026 ballot. This is a documented unanimous (or near-unanimous) vote. Individual council member statements at this meeting are likely on record. Nevada Independent and Nevada News and Views have broader coverage. Community opposition was intense — this topic will have stance evidence for all members who made public statements.

Note: Boulder City's charter (Section 144) requires voter approval before any new land use is permitted in the Eldorado Valley Transfer Area — the council itself cannot authorize data centers without a public vote. This is a strong `data-centers` stance signal for all members.

### No-Gambling Charter (economic-development cross-signal)
[CITED: bcnv.org/27/Government — "Charter prohibits gaming, which makes the City unique as the only City in the State of Nevada"] [ASSUMED: individual council member statements on maintaining the no-gambling charter are not in the research record — this is a structural fact, not a recent council vote]

The no-gambling charter is a constitutional feature of Boulder City, not an active council vote topic. Unless a council member has recently made a statement on it (which would be unusual given its settled status), this is background context rather than a citable stance. Do NOT infer stance values from the mere fact that the charter exists.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Clark County GISMO ward loader (NLV/Henderson/LV) | No ward loader needed for Boulder City | This phase | Removes an entire Wave-0 file and migration step |
| AEM thumbnail upscaling (Clark County 175×175) | Full-res JPEG downscaling (Boulder City 1733-2080px originals) | This phase | Cleaner headshots; no 4× upscale artifact concern |
| Per-member fallback chain (NLV 4 of 5 needed fallbacks) | Single source covers all 5 (flybouldercity.com) | This phase | No fallback research needed in Wave-0 |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `photo_license='us_government_work'` for flybouldercity.com portraits | Headshot Sources | May need to be `press_use` if flybouldercity.com is not legally the city's own content — operator sets at execution; functional impact is minimal |
| A2 | The February 24, 2026 data-center ballot vote was unanimous (all 5 members) | Stance Evidence | If split vote, individual stances diverge; adjust after confirming meeting minutes |
| A3 | Jorgensen's May 2025 camping ban vote was with the unanimous 5-0 majority | Stance Evidence | If she abstained or voted differently, adjust stance value |
| A4 | flybouldercity.com documentIds will still serve HTTP 200 at execution time | Headshot Sources | Small risk of CMS refresh rotating IDs; if 404 at execution, fall back to bcnv.org or Ballotpedia |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed. (Table above lists assumptions; they are low-risk.)

---

## Open Questions

1. **Mayor Pro Tem title display — "Council Member" vs "Mayor Pro Tem"**
   - What we know: Jorgensen holds the Mayor Pro Tem designation; Boulder City has no separately-elected MPT seat.
   - What's unclear: Whether the planner wants `title='Council Member'` or `title='Mayor Pro Tem'` for display purposes in the app.
   - Recommendation: Seed as `title='Council Member'` (at-large title, no confusion with a separately-elected position). The Mayor Pro Tem role is internal council designation. This is Claude's Discretion per D-04a.

2. **Chamber name — "Boulder City City Council" vs "Boulder City Council"**
   - What we know: bcnv.org consistently refers to "the City Council" and "Boulder City City Council" in page titles; the body is formally the Boulder City City Council.
   - What's unclear: Whether the display name should include the redundant "City" twice.
   - Recommendation: Use "Boulder City City Council" to match the official body name (all other NV cities use "City of X City Council" or "X City Council" — e.g., "North Las Vegas City Council", "Las Vegas City Council"). This is Claude's Discretion per D-04a.

---

## Validation Architecture

> workflow.nyquist_validation is not explicitly false in config; include this section.

### Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | TypeScript smoke scripts via `npx tsx` + inline SQL gates (`psql -f`) |
| Config file | none — ad-hoc scripts (project convention for deep-seeds) |
| Quick run command | `npx tsx scripts/smoke-nv-geofences.ts` (existing; extend with a Boulder City address probe) |
| Full suite command | Inline 9-check E2E SQL/HTTP verification |
| Estimated runtime | ~30 seconds |

### Phase Requirements → Test Map (at-large model)

| Req | Behavior | Test Type | Automated Command | File Exists |
|-----|----------|-----------|-------------------|-------------|
| CLARK-05 SC#1 | Boulder City address returns Mayor + all 4 council members (no ward routing) | smoke / SQL | Extend `smoke-nv-geofences.ts` with a Boulder City interior point; expected mtfccs = [G4020, G4110, G5200, G5210, G5220] (no X-tier — correct for at-large) | ❌ W0 |
| CLARK-05 SC#1 | Chamber = 5 seats, official_count=5 | SQL gate | `SELECT official_count FROM essentials.chambers WHERE name ILIKE '%Boulder City%Council%'` = 5 | ❌ W0 |
| CLARK-05 SC#1 | 1 LOCAL_EXEC district + 1 LOCAL district, both geo_id='3206500' | SQL gate | `SELECT district_type, COUNT(*) FROM essentials.districts WHERE geo_id='3206500' AND state='nv' GROUP BY district_type` → LOCAL_EXEC: 1, LOCAL: 1 | ❌ W0 |
| CLARK-05 SC#1 | Exactly 5 offices on geo_id='3206500' districts (1 LOCAL_EXEC + 4 LOCAL) | SQL gate | `SELECT d.district_type, COUNT(*) FROM essentials.offices o JOIN essentials.districts d ON d.id=o.district_id WHERE d.geo_id='3206500' AND d.state='nv' GROUP BY d.district_type` → LOCAL_EXEC: 1, LOCAL: 4 | ❌ W0 |
| CLARK-05 SC#1 | Mayor sorts first (LOCAL_EXEC before LOCAL) | SQL/manual | Verify groupHierarchy.js puts LOCAL_EXEC before LOCAL (already confirmed in prior phases; check via browse link) | manual |
| CLARK-05 SC#1 | No section-split | SQL gate | `SELECT COUNT(*) FROM essentials.geofence_boundaries gb WHERE gb.geo_id='3206500' AND gb.mtfcc='G4110' AND NOT EXISTS (SELECT 1 FROM essentials.districts d WHERE d.geo_id=gb.geo_id AND d.state='nv')` = 0 | ❌ W0 |
| CLARK-05 SC#2 | 5 officials have 600×750 headshots (0 gaps expected) | SQL gate | `SELECT COUNT(*) FROM essentials.politician_images pi JOIN essentials.politicians p ON p.id=pi.politician_id WHERE p.external_id BETWEEN -3208005 AND -3208001` = 5 | ❌ W0 |
| CLARK-05 SC#3 | Evidence-only stances render (no defaults) | SQL gate | `SELECT COUNT(*) FROM inform.politician_answers pa JOIN essentials.politicians p ON pa.politician_id=p.id WHERE p.external_id BETWEEN -3208005 AND -3208001` ≥ 1; every answer paired with non-null context; 0 null/default values | ❌ W0 |
| CLARK-05 SC#4 | Boulder City in coverage.js with hasContext:true | manual | Inspect `src/lib/coverage.js` Nevada block + browse `?browse_geo_id=3206500&browse_mtfcc=G4110` | manual |

### 9-Check E2E Verification (adapted from Phase 164 template, at-large model)

Adapted from `164-VALIDATION.md` with ward checks removed and at-large checks substituted:

1. **Government exists:** `SELECT id FROM essentials.governments WHERE name='City of Boulder City, Nevada, US'` — 1 row
2. **Chamber exists with correct count:** `SELECT official_count FROM essentials.chambers WHERE name ILIKE '%Boulder City%Council%'` = 5
3. **Two districts, both on 3206500:** `SELECT district_type FROM essentials.districts WHERE geo_id='3206500' AND state='nv'` → [LOCAL_EXEC, LOCAL] (exactly 2 rows)
4. **5 offices: 1 LOCAL_EXEC + 4 LOCAL:** count by district_type as above
5. **5 headshots:** COUNT from politician_images JOIN WHERE external_id BETWEEN -3208005 AND -3208001 = 5
6. **≥1 stance + 0 orphan answers:** `SELECT COUNT(*) FROM inform.politician_answers pa JOIN essentials.politicians p ON pa.politician_id=p.id WHERE p.external_id BETWEEN -3208005 AND -3208001` ≥ 1; all have paired politician_context
7. **0 section-split:** geofence_boundaries G4110 `3206500` has matching LOCAL/LOCAL_EXEC district — query above = 0
8. **Casing correct:** `SELECT DISTINCT state FROM essentials.districts WHERE geo_id='3206500'` = `'nv'` (lowercase only)
9. **Only 1100 registered:** `SELECT MAX(version) FROM supabase_migrations.schema_migrations WHERE version >= '1100'` = 1100; confirm 1101+ not present in schema_migrations

### Sampling Rate
- **After Wave 0 (structural migration 1100):** Run checks 1–4, 7, 8, 9
- **After Wave 1 (headshots, migration 1101):** Run check 5
- **After Wave 2 (stances, migrations 1102–1106):** Run check 6; run all 9 for phase sign-off
- **Phase gate:** All 9 checks green + operator browse-verify before `/gsd:verify-work`

### Wave 0 Requirements

- [ ] Wave-0 DB/disk probes: live on-disk migration MAX (`ls C:/EV-Accounts/backend/migrations | grep -oE '^[0-9]+' | sort -n | tail -1` — expect 1099 → next 1100); external_id collision (`SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -3208005 AND -3208001` → 0); Boulder City G4110 geo_id (expected 3206500) + casing (state='32'); no pre-existing Boulder City government (`SELECT COUNT(*) FROM essentials.governments WHERE name='City of Boulder City, Nevada, US'` → 0); no pre-existing LOCAL/LOCAL_EXEC districts on `3206500` (`SELECT COUNT(*) FROM essentials.districts WHERE geo_id='3206500' AND state='nv'` → 0)
- [ ] Wave-0 roster checkpoint: confirm Hardy/Jorgensen/Booth/Walton/Ashurst against bcnv.org/159/City-Council (5 seats, at-large, council-manager confirmed; Hardy/Booth/Walton on 2026 ballot but all seated)
- [ ] Note: NO ward-boundary loader to run (unlike Phases 162/163/164) — Boulder City is at-large
- [ ] Extend `smoke-nv-geofences.ts` with a Boulder City address probe (interior point within geo_id=3206500; expected mtfccs = [G4020, G4110, G5200, G5210, G5220]; NO X-tier expected)

### Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Correct-person headshot + at-large "Council Member" label | CLARK-05 SC#1/#2 | Visual identity + label display | Browse a Boulder City address; confirm Mayor first + all 4 council members + right photo + "Council Member" title (no ward number) |
| Coverage chip renders purple | CLARK-05 SC#4 | Frontend render | Visit `essentials.empowered.vote/results?browse_geo_id=3206500&browse_mtfcc=G4110` |

---

## Environment Availability

All external dependencies are the same as Phases 161–164. No new dependencies.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| psql | Migration apply | ✓ | confirmed by prior phases | — |
| Python 3 + Pillow/PIL | Headshot pipeline | ✓ | confirmed by prior phases | — |
| psycopg2 | Headshot pipeline UUID resolution | ✓ | confirmed by prior phases | — |
| requests (Python) | Headshot download | ✓ | confirmed by prior phases | — |
| Node.js / tsx | smoke-nv-geofences.ts | ✓ | confirmed by prior phases | — |
| flybouldercity.com ImageRepository | Headshot source | ✓ | HTTP 200 verified 2026-06-29 | None needed — all 5 confirmed |
| DATABASE_URL | Migration apply | ✓ | C:/EV-Accounts/backend/.env | — |

**Missing dependencies with no fallback:** None.

---

## Sources

### Primary (HIGH confidence)
- `bcnv.org/27/Government` — form of government (council-manager), at-large structure, official body quote
- `bcnv.org/159/City-Council` — live roster (5 names, titles, term expiration years)
- `flybouldercity.com/941/Meet-the-Council` — roster with election years + individual portrait documentIds
- curl probes to flybouldercity.com ImageRepository (2026-06-29) — all 5 portrait HTTP 200 + JPEG + pixel dimensions confirmed
- `bcnv.org/189/Elections` — 2026 offices up: Mayor + Council Member (2); June 9 primary / Nov 3 general
- Live `ls C:/EV-Accounts/backend/migrations/` — on-disk MAX 1099 confirmed
- `src/lib/coverage.js` lines 183–190 — current NV block with North Las Vegas already at line 188

### Secondary (MEDIUM confidence)
- `bcnv.org/DocumentCenter/View/16340/FY25-Annual-Comprehensive-Financial-Report-PDF` — $13.7M solar lease revenue = 33% of FY25 budget
- `bouldercityreview.com/news/understanding-the-growth-ordinance-77784/` — Controlled Growth Ordinance mechanics (120 units/year)
- `reviewjournal.com/news/environment/data-centers-will-be-on-the-ballot...` — Feb 2026 council vote placing data-center question on Nov 2026 ballot
- `bouldercityreview.com/news/council-outlaws-camping-sleeping-in-public-98968/` — May 2025 5-0 camping ban vote
- `bouldercityreview.com/news/ashurst-tops-fox-for-council-seat-89361/` — Nov 2024 election: Ashurst ~60%, Fox ~40%
- `bouldercity.com/unofficial-election-2024-results/` — Nov 2024 election results confirmation

### Tertiary (LOW confidence)
- Training knowledge on Boulder City charter gambling prohibition and Eldorado Valley acquisition — consistent with bcnv.org content but not independently re-verified in this session [ASSUMED baseline]

---

## Metadata

**Confidence breakdown:**
- Roster/form-of-government: HIGH — verified directly from bcnv.org + flybouldercity.com
- Headshot sources + WAF behavior: HIGH — confirmed via curl probes on all 5 URLs
- Migration counter: HIGH — live ls on 2026-06-29
- Stance evidence richness: MEDIUM — sourced from Boulder City Review search results and bcnv.org documents; per-member individual vote citations require execution-time research
- external_id block: HIGH — CONTEXT.md D-04b states Wave-0 collision probe confirmed −3208xxx free

**Research date:** 2026-06-29
**Valid until:** 2026-07-14 (30 days) — roster is stable until post-Nov-2026 elections; headshot URLs could rotate if CMS is updated

---

## RESEARCH COMPLETE

**Phase:** 165 - Boulder City Deep-Seed
**Confidence:** HIGH

### Key Findings

1. **At-large confirmed, no wards, council-manager form** — Boulder City is exactly as described: directly-elected Mayor + 4 at-large nonpartisan council members. No ward loader needed. Structural template is 2 districts (LOCAL_EXEC + LOCAL) on the single geo_id=3206500, with 4 office rows on the LOCAL district.

2. **Roster confirmed 5 members** — Hardy (Mayor), Jorgensen (MPT), Booth, Walton, Ashurst. Hardy/Booth/Walton terms expire 2026 (on ballot); all remain seated and should be seeded is_active=true. Ashurst elected Nov 2024, term 2028. Mayor Pro Tem is a council-internal designation — do NOT create a 6th seat.

3. **Zero headshot gaps anticipated** — flybouldercity.com serves all 5 individual council portraits via ImageRepository, no WAF, HTTP 200 confirmed, all high-resolution (1733–2080px wide). This is the best headshot situation since Phase 161 (Clark County AEM). Standard Chrome UA sufficient.

4. **Stance evidence concentrated on 4 distinctive Boulder City topics** — data-center ballot vote (Feb 2026, documented), Controlled Growth Ordinance (120-unit/year cap, 45+ years), solar lease revenue decisions (FY25 $13.7M = 33% of budget), and camping ban (May 2025 5-0). Honest blanks expected for Ashurst (Nov 2024 onward only) and for lower-coverage statewide topics across all members.

5. **Migration counter: 1099 on-disk → next structural = 1100** — confirmed live. Migration block: 1100 (structural, registered) + 1101 (headshots, audit-only) + 1102–1106 (stances, audit-only, one per official).

### File Created
`.planning/phases/165-boulder-city-deep-seed/165-RESEARCH.md`

### Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | No new packages; all tooling proven in Phases 162–164 |
| Government structure + roster | HIGH | Directly verified from bcnv.org + flybouldercity.com |
| Headshot sources + WAF | HIGH | curl probes confirmed all 5 (HTTP 200, image/jpeg, high-res) |
| Migration counter | HIGH | Live ls confirmed 1099 on-disk MAX |
| Stance evidence depth | MEDIUM | Search results confirm topic areas; per-member vote citations require agent research |
| external_id block | HIGH | CONTEXT.md confirmed free; Wave-0 re-probes before write |

### Open Questions
- Chamber name: "Boulder City City Council" vs "Boulder City Council" — Claude's Discretion per D-04a; recommend "Boulder City City Council" to match official naming convention.
- Mayor Pro Tem title in UI: seed Jorgensen as "Council Member" (recommended) vs "Mayor Pro Tem".

### Ready for Planning
Research complete. Planner can now create PLAN.md files. No blocking unknowns remain.
