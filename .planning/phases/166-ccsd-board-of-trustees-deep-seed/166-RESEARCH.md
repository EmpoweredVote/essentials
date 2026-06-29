# Phase 166: CCSD Board of Trustees Deep-Seed - Research

**Researched:** 2026-06-29
**Domain:** Clark County School District (NV) school-district government seed + G5420 TIGER UNSD geofence load + headshots + evidence-only compass stances
**Confidence:** HIGH (UNSD GEOID, G5420 loader pattern, roster, migration counter, schema, external_id block); MEDIUM (headshot sourcing — primary sources WAF-blocked, fallback chain required at execution)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Seed **all 11 trustees** — 7 elected (Districts A–G), labeled `"Trustee, District A".."Trustee, District G"`; 4 appointed (per NV AB175/2023, appointed by Clark County, City of Las Vegas, City of Henderson, City of North Las Vegas), labeled by appointing jurisdiction, e.g. `"Trustee, Appointed – City of Henderson"`. Appointed-vs-elected distinction must be transparent in the title (no fabricated district letter for appointed seats).
- **D-01a:** Wave-0 verifies the live 11-member composition + exact appointing bodies + current officeholders. 2026 board officers (Stevens President / Bustamante Adams VP / Dominguez Clerk) are titles on existing trustees, NOT separate seats. Planner decides whether to surface officer roles.
- **D-02:** **Single G5420 `SCHOOL`-district routing is PRIMARY** (matches SF/SD/Portland/Boston/Berkeley). All 11 trustees attach to the ONE CCSD G5420 `SCHOOL` district. Any in-district address returns all 11. Per-trustee sub-district (A–G) routing is DEFERRED.
- **D-02a:** The CCSD G5420 TIGER UNSD boundary must be **LOADED this phase** — NV has no G5420 geofences (Phase 158 skipped school districts). CCSD is county-wide → boundary ≈ Clark County.
- **D-03:** Research all 45 live compass topics per trustee, one agent at a time, evidence-only / 100% cited / honest blank spokes / zero defaults / chairs model. Expect MORE honest blanks than a city council (most live topics are state/federal scope).
- **D-03a:** Lead the sweep with the education cluster: (1) school safety/SROs → `public-safety-approach` (CCSD has its own police department — richest CCSD-specific vein); (2) school choice/vouchers → `school-vouchers`; (3) curriculum/book/DEI → `civil-rights` + `religious-freedom` + `trans-athletes`; (4) funding/growth → `taxes`, `childcare`, `growth-and-development`, `residential-zoning`, `local-immigration`/`immigration`. Every placed stance requires a cited CCSD-board statement/vote.
- **D-04:** Standalone government `"Clark County School District, Nevada, US"` (INSERT via `WHERE NOT EXISTS`, NOT nested under State of NV). Greenfield.
- **D-04a:** Chamber name = `"Board of School Trustees"`. District `label` = CCSD district name; `district_type = SCHOOL`.
- **D-04b:** external_id block `−3209001..−3209011` (after Boulder City −3208xxx). `geo_id` = CCSD UNSD GEOID. Casing: `governments.state`/`offices.representing_state` uppercase `NV`; geofence `state='32'` FIPS; district join keys `state='nv'` lowercase.
- **D-05:** Headshot chain: ccsd.net/trustees + BoardDocs (go.boarddocs.com/nv/ccsdlv) first → Chrome-UA curl / background-image grep workarounds → free alternates (Wikimedia descriptive-UA, official campaign, Ballotpedia) → document a genuine gap if none exist. 600×750, crop-4:5 then Lanczos q90, no overlays/fabrication, mirrored to Storage `politician_photos/{uuid}-headshot.jpg`. Appointed trustees (newer) may have thinner photo coverage.

### Claude's Discretion

- Exact office-row structure under the single G5420 SCHOOL district (recommend: 1 shared SCHOOL district on the CCSD GEOID carrying all 11 trustee offices).
- Whether to surface board-officer roles (President/VP/Clerk) as title annotations or omit them.
- Exact external_id assignment within the confirmed `−3209xxx` block.
- Exact display string for trustee labels.
- Migration numbering: next migration is ~1107 (Wave-0 verifies on-disk MAX +1).

### Deferred Ideas (OUT OF SCOPE)

- Per-trustee sub-district (A–G) geofence routing.
- Education-native compass topics (compass-design concern).
- CCSD Superintendent + non-elected/administrative offices.
- Other NV school districts (Washoe, rural counties).

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CCSD-01 | CCSD Board of Trustees deep-seeded — board-district geofences (G5420 UNSD pattern) + elected roster + headshots + evidence-only stances | (1) **UNSD GEOID confirmed = `3200060`** (NCES ID 3200060; Census/TIGER UNSD `sch3200060`); (2) **G5420 loader template exists** (`load-or-school-boundaries.ts` + TIGER 2024 NV UNSD shapefile `tl_2024_32_unsd.zip` HTTP-200 verified); (3) **11-member roster confirmed** (7 elected A–G + 4 appointed) from ccsd.net/trustees; (4) **single-G5420 SCHOOL routing** proven by `254_or_school_districts.sql` (6 OR districts, all members on one G5420 boundary); (5) headshot fallback chain required (ccsd.net + BoardDocs both WAF-403); (6) **migration counter on-disk MAX = 1106 → next = 1107** (live `ls` confirmed) |

</phase_requirements>

---

## Summary

Phase 166 deep-seeds the Clark County School District — 1 standalone government (`"Clark County School District, Nevada, US"`), 1 chamber (`"Board of School Trustees"`), 11 trustees (7 elected Districts A–G + 4 appointed by jurisdiction), 11 headshots, and evidence-only compass stances. The structural model is the **single-G5420 SCHOOL-district** pattern that every existing school district in the app already uses (SF / San Diego / Portland / Boston / Berkeley), with two CCSD-specific divergences from the Boulder City (165) / Clark County Commission (161) templates: **(a) the G5420 TIGER UNSD boundary must be loaded this phase** (NV has none — Phase 158 skipped school districts), and **(b) the roster mixes elected and appointed members** whose distinction must be transparent in the office title.

**The G5420 load is the single new mechanism this phase introduces.** The canonical template is `C:/EV-Accounts/backend/scripts/load-or-school-boundaries.ts` — it downloads the state TIGER UNSD shapefile, filters to target GEOIDs, and inserts `geofence_boundaries` rows WITH geometry (`ST_GeomFromGeoJSON` → `ST_ForcePolygonCCW(ST_SetSRID(ST_Force2D(...),4326))`). For CCSD this is a one-district variant: shapefile `tl_2024_32_unsd.zip` (NV FIPS 32, confirmed HTTP-200, 403 KB), target GEOID `3200060`, `state='32'`, `mtfcc='G5420'`, `source='tiger_unsd_nv_2024'`. Because the loader inserts geometry directly from the shapefile, **no geometry-copy migration (à la `350_school_geofence_geometry.sql`) is needed** — that fix only applied to Boston/ACPS which were inserted as geometry-less shells in their structural migrations. CCSD loads a real polygon up front. [VERIFIED: load-or-school-boundaries.ts read in full; tl_2024_32_unsd.zip HTTP-200 via curl 2026-06-29]

**UNSD GEOID confirmed: `3200060`.** Clark County School District is NCES district ID 3200060; the Census/TIGER unified-school-district GEOID is the same value (`sch3200060` in Data Commons; UNSD GEOID = state FIPS `32` + district code `00060`). This is the `geo_id` for both the G5420 geofence row and the standalone government. CCSD is a county-wide unified district, so its UNSD polygon is effectively coterminous with Clark County (G4020 `32003`). [VERIFIED: NCES district_detail ID 3200060; CITED: datacommons.org/place/geoId/sch3200060]

**Roster confirmed: 11 members (7 elected A–G + 4 appointed).** Elected: District A Emily Stevens (President), B Lydia Dominguez (Clerk), C Tameka Henry, D Brenda Zamora, E Lorena Biassotti, F Irene Bustamante Adams (VP), G Linda P. Cavazos. Appointed (AB175/2023): City of North Las Vegas → Isaac Barron, City of Henderson → Ramona Esparza-Stoffregen, City of Las Vegas → Adam Johnson, Clark County → Lisa Satory. The 2026 officers (Stevens/Bustamante Adams/Dominguez) are titles on existing elected trustees, not separate seats. **Appointed trustees are currently NONVOTING** — SB460 (2023, merged Cannizzaro/Lombardo education bill) grants them full voting rights effective 2027, but they remain barred from voting in officer elections and from serving as board officers. [VERIFIED: ccsd.net/trustees via WebFetch; CITED: reviewjournal.com appointed-trustees-voting-rights-2027; thenevadaindependent.com nonvoting-trustees]

**Headshots: BOTH primary sources are WAF-blocked (403) — a fallback chain is mandatory.** ccsd.net/trustees and go.boarddocs.com/nv/ccsdlv both return HTTP 403 to a standard Chrome UA (Akamai/WAF). This is the Henderson/NLV situation, not the clean Boulder City situation. Wave-0 must build the per-trustee fallback chain: try Chrome-UA + Referer against ccsd.net, then background-image grep, then Ballotpedia / Wikimedia (descriptive UA) / official campaign sites. Appointed trustees (newer seats) and Linda Cavazos are the highest gap risk. Document genuine gaps honestly — no fabrication. [VERIFIED: curl probes 2026-06-29 — ccsd.net/trustees/index.php = 403, BoardDocs Public = 403]

**Migration counter: on-disk MAX = 1106 → next structural migration = 1107.** [VERIFIED: live `ls C:/EV-Accounts/backend/migrations` 2026-06-29 — highest is 1106]

**Primary recommendation:** (1) Author `scripts/load-ccsd-school-boundary.ts` from the `load-or-school-boundaries.ts` template (one GEOID `3200060`, NV FIPS `32`, `source='tiger_unsd_nv_2024'`). (2) Author `1107_ccsd_board_of_trustees.sql` (structural, registered) modeled on `254_or_school_districts.sql` (school-district shape) + `1055_clark_county_commission.sql` (single-shared-district shape) — 1 government + 1 chamber + 1 SCHOOL district on `3200060` + 11 trustee offices. (3) `1108_ccsd_trustees_headshots.sql` (audit-only) + `1109..1119_ccsd_*_stances.sql` (audit-only, one per trustee). (4) Append CCSD to coverage.js NV block with `G5420` browse link. **The G5420 geofence load must run BEFORE migration 1107** (the SCHOOL district + section-split check reference the geofence row).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| CCSD G5420 boundary load | Database / Storage (geofence_boundaries) | CDN / external (census.gov TIGER) | TS loader downloads TIGER UNSD shapefile, inserts polygon with geometry; this is the ONE new mechanism |
| All-11-trustee routing | Database / Storage (single G5420 geofence) | API / Backend (ST_Covers PIP) | All 11 offices attach to one SCHOOL district on geo_id=3200060; backend resolves via existing PIP — same as SF/SD/Portland |
| Government/chamber/office seed | Database / Storage (migrations) | — | SQL migration writes essentials.* tables |
| Elected-vs-appointed distinction | Database (office title) | Frontend (label render) | Encoded in offices.title string; no schema flag needed for display |
| Headshot pipeline | API / Backend (Python script) | CDN / Static (Supabase Storage) | _tmp-*.py crops/resizes/uploads; WAF fallback chain handled in script source list |
| Stance research | API / Backend (inform schema) | — | inform.politician_answers + politician_context, applied via SQL |
| CCSD surfacing (purple chip) | Frontend (coverage.js) | — | Append to existing Nevada block; browse uses G5420 + GEOID |

---

## Standard Stack

Phase 166 introduces **no new npm/PyPI packages**, but it **reuses the school-boundary TS loader toolchain** that the city deep-seeds (162–165) did not need. The loader's dependencies (`pg`, `https`, `adm-zip`, `shapefile`, `dotenv`) are already present in `C:/EV-Accounts/backend` (used by `load-or-school-boundaries.ts`, `load-state-tiger-boundaries.ts`, etc.).

### Core (reused)

| Tool / Pattern | Purpose | Basis |
|----------------|---------|-------|
| `load-or-school-boundaries.ts` (template) | G5420 TIGER UNSD download + filter + insert-with-geometry | `C:/EV-Accounts/backend/scripts/load-or-school-boundaries.ts` (read in full) |
| `psql -f` (migration apply) | Apply structural + audit-only SQL | Phase 160/161/165 executor split |
| psycopg2 (headshot script) | DB UUID resolution from external_id | `_tmp-*-headshots.py` (Phases 161–165) |
| Pillow/PIL | crop-4:5 → resize 600×750 Lanczos q90 | Phase 161–165 pipeline |
| requests | HTTP fetch of headshot images (with fallback UA) | Phase 161–165 pipeline |
| `npx tsx scripts/smoke-nv-geofences.ts` | Geofence routing smoke test (extend with a CCSD G5420 expectation) | `C:/EV-Accounts/backend/scripts/smoke-nv-geofences.ts` (read in full) |

### Installation

No installs. The TS loader deps are confirmed in-tree by the existing OR/state loaders. Verify in Wave-0:
```bash
ls C:/EV-Accounts/backend/node_modules/adm-zip C:/EV-Accounts/backend/node_modules/shapefile  # both present
```

---

## Package Legitimacy Audit

No new external packages required for Phase 166. All TS loader dependencies (`pg`, `adm-zip`, `shapefile`, `dotenv`) and Python deps (`psycopg2`, `Pillow`, `requests`) are pre-existing in the project, exercised by prior school-district and headshot phases. **Package Legitimacy Gate skipped (no new installs).**

---

## Architecture Patterns

### System Architecture Diagram

```
census.gov TIGER 2024 UNSD: tl_2024_32_unsd.zip (HTTP 200, 403 KB confirmed)
    │ filter GEOID='3200060' (Clark County School District)
    ▼
scripts/load-ccsd-school-boundary.ts (Wave 1 — NEW, from load-or-school-boundaries.ts)
    │ ST_ForcePolygonCCW(ST_SetSRID(ST_Force2D(ST_GeomFromGeoJSON(geom)),4326))
    │ ON CONFLICT (geo_id, mtfcc) DO NOTHING
    ▼
essentials.geofence_boundaries
    geo_id='3200060', ocd_id='3200060', name='Clark County School District',
    state='32', mtfcc='G5420', source='tiger_unsd_nv_2024', geometry=<county-wide polygon>
    │   (loaded BEFORE migration 1107 — district + section-split reference it)
    ▼
ccsd.net/trustees (403 WAF) ─┐
go.boarddocs.com (403 WAF)  ─┤ fallback chain
Ballotpedia / Wikimedia(UA) ─┤  →  _tmp-ccsd-trustees-headshots.py (Wave 2)
official campaign sites     ─┘      crop-4:5 → 600×750 Lanczos q90 → Storage PUT
    ▼
Supabase Storage: politician_photos/{uuid}-headshot.jpg
    │
    ├──► migration 1107 (structural — REGISTERED)
    │       INSERT governments "Clark County School District, Nevada, US"
    │       INSERT chambers "Board of School Trustees"
    │       INSERT 1 SCHOOL district geo_id='3200060' mtfcc='G5420' state='nv'
    │       INSERT 11 politicians + offices (7 elected A–G + 4 appointed) + back-fill
    │       post-verify DO block: 1 gov, 11 offices on SCHOOL district, 0 section-split
    │
    ├──► migration 1108 (audit-only, headshots)  →  ≤11 politician_images rows (gaps documented)
    │
    └──► migrations 1109–1119 (audit-only, one per trustee)
            inform.politician_answers + inform.politician_context

Backend ST_Covers query:
    Clark County address → ST_Covers(gb.geometry, point) →
        G5420 geo_id=3200060 → SCHOOL district → all 11 trustees
    (Single boundary covers entire county — correct for a county-wide unified district)

coverage.js NV block:
    ADD: { label: 'Clark County School District',
           browseGovernmentList: ['3200060'], browseStateAbbrev: 'NV', hasContext: true }
```

### Recommended Project Structure (new files)

```
C:/EV-Accounts/backend/
├── scripts/
│   ├── load-ccsd-school-boundary.ts            # NEW — G5420 TIGER UNSD loader (from load-or-school-boundaries.ts)
│   └── _tmp-ccsd-trustees-headshots.py         # NEW (gitignored) — fallback-chain headshots
└── migrations/
    ├── 1107_ccsd_board_of_trustees.sql          # STRUCTURAL (registered): gov + chamber + 1 SCHOOL district + 11 offices
    ├── 1108_ccsd_trustees_headshots.sql         # AUDIT-ONLY
    ├── 1109_ccsd_stevens_stances.sql            # AUDIT-ONLY (per trustee)
    ├── 1110_ccsd_dominguez_stances.sql          # AUDIT-ONLY
    ├── ... (one per trustee through) ...
    └── 1119_ccsd_satory_stances.sql             # AUDIT-ONLY (11th trustee)

C:/Transparent Motivations/essentials/
└── src/lib/coverage.js                          # EDIT — append CCSD to NV block
```

### Pattern 1: G5420 TIGER UNSD Loader (the new mechanism)

**What:** Download the NV UNSD shapefile, filter to GEOID `3200060`, insert one `geofence_boundaries` row with geometry. **Single-GEOID variant of `load-or-school-boundaries.ts`.**

**Source: `C:/EV-Accounts/backend/scripts/load-or-school-boundaries.ts` (read in full).** Change only the config block:

```typescript
// CCSD adaptation of load-or-school-boundaries.ts
const TIGER_URL      = 'https://www2.census.gov/geo/tiger/TIGER2024/UNSD/tl_2024_32_unsd.zip'; // NV FIPS 32
const MTFCC          = 'G5420';
const STATE          = '32';                    // Nevada FIPS — geofence_boundaries.state convention
const SOURCE         = 'tiger_unsd_nv_2024';
const EXPECTED_COUNT = 1;
const TARGET_GEOIDS  = new Map<string, string>([
  ['3200060', 'Clark County School District'],
]);
```

Everything else (download-with-redirects + cache, AdmZip extract, `shapefile.open`, `GEOID` field filter, the `ST_ForcePolygonCCW(ST_SetSRID(ST_Force2D(ST_GeomFromGeoJSON($6)),4326))` insert, `ON CONFLICT (geo_id, mtfcc) DO NOTHING`, post-insert count verification) is copied verbatim. The insert column list is `(geo_id, ocd_id, name, state, mtfcc, geometry, source, imported_at)` — `ocd_id` is set to the GEOID value (same as `geo_id`), matching the OR loader.

**Run order (CRITICAL):** the orchestrator runs this loader **before** applying migration 1107. The SCHOOL district INSERT and the section-split DO block both reference the geofence row by `geo_id='3200060' AND mtfcc='G5420'`.

**No geometry-copy migration needed.** `350_school_geofence_geometry.sql` exists only because Boston (348) and ACPS (313) inserted geometry-less G5420 *shells* and had to back-fill geometry by copying the parent G4110 boundary. The TIGER loader inserts the real polygon directly, so CCSD skips that step. [VERIFIED: 350_school_geofence_geometry.sql read in full — it is a shell-backfill fix, not the standard load path]

### Pattern 2: Structural Migration 1107 (school-district shape, single shared SCHOOL district, 11 offices)

**What:** government + chamber + 1 SCHOOL district + 11 politician+office CTEs + office_id back-fill + post-verify DO block + ledger registration.

**Primary analog:** `254_or_school_districts.sql` (school-district shape — government type `'LOCAL'`, chamber, SCHOOL district `state='or'` lowercase + `mtfcc='G5420'`, board-member office CTEs all on one district). **Single-shared-district analog:** `1055_clark_county_commission.sql` (all members on one district; NV casing; ledger registration `(version, name)`).

**Government INSERT** (school-district naming + NV substitution):
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'Clark County School District, Nevada, US',
       'LOCAL', 'NV', NULL, '3200060'         -- type='LOCAL' per 254 school-district convention; geo_id = UNSD GEOID
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'Clark County School District, Nevada, US'
);
```
> Note the type divergence: `254_or` school districts use `type='LOCAL'`; the NV city/county phases used `'City'`/`'County'`. Follow the **school-district precedent** (`type='LOCAL'`) since this is a school district, not a city. `essentials.governments` has NO `government_type` column and no unique constraint — `WHERE NOT EXISTS` guard required. [VERIFIED: 254_or_school_districts.sql lines 51-58]

**Chamber INSERT** (auto-generated path column excluded):
```sql
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'Board of School Trustees',
       'Clark County School District Board of School Trustees',
       (SELECT id FROM essentials.governments WHERE name = 'Clark County School District, Nevada, US')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Board of School Trustees'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'Clark County School District, Nevada, US')
);
```
> `official_count` is optional in the INSERT (omitted in `254_or`; included in `165` Boulder City). If included, set `official_count=11`. NEVER include the auto-generated path column. `name_formal` must be non-empty.

**SCHOOL district INSERT** (one shared district, `state='nv'` lowercase, `mtfcc='G5420'`):
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'SCHOOL', 'nv', '3200060', 'Clark County School District', 'G5420'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '3200060' AND district_type = 'SCHOOL' AND state = 'nv'
);
-- CRITICAL: district_type='SCHOOL' (NOT 'SCHOOL_DISTRICT'); state='nv' LOWERCASE; mtfcc='G5420'
```

**Elected trustee CTE** (7 blocks, Districts A–G — `254_or` board-member shape):
```sql
-- BLOCK 1: Emily Stevens (District A, President) — -3209001
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Emily Stevens', 'Emily', 'Stevens', NULL,
          true, false, false, true, -3209001)        -- party=NULL antipartisan; is_appointed=false (elected)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Board of School Trustees'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'Clark County School District, Nevada, US')),
       p.id,
       'Trustee, District A', 'NV', false, false, NULL    -- is_appointed_position=false for elected
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '3200060'
  AND d.district_type = 'SCHOOL'
  AND d.state = 'nv'                  -- LOWERCASE; uppercase matches 0 rows (the #1 NV pitfall)
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
-- Repeat for Dominguez (B), Henry (C), Zamora (D), Biassotti (E), Bustamante Adams (F), Cavazos (G)
```

**Appointed trustee CTE** (4 blocks — set `is_appointed=true` on politician AND `is_appointed_position=true` on office; title carries the appointing jurisdiction):
```sql
-- BLOCK 8: Isaac Barron (Appointed – City of North Las Vegas) — -3209008
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Isaac Barron', 'Isaac', 'Barron', NULL,
          true, true, false, true, -3209008)           -- is_appointed=TRUE
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers WHERE name = 'Board of School Trustees'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'Clark County School District, Nevada, US')),
       p.id,
       'Trustee, Appointed – City of North Las Vegas', 'NV', true, false, NULL  -- is_appointed_position=TRUE
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '3200060' AND d.district_type = 'SCHOOL' AND d.state = 'nv'
  AND p.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id);
-- Repeat for Esparza-Stoffregen (Henderson), Johnson (Las Vegas), Satory (Clark County)
```
> **Why `is_appointed`/`is_appointed_position` matter:** Portland school migration (`235_portland_officials_is_appointed`) shows this flag is render-significant. Elected trustees = false; appointed = true. The Portland board members were all elected (`is_appointed=false`); the CCSD appointed four are the first school-board appointees in the app, so set the flag honestly. [VERIFIED: 254_or sets is_appointed=false on all 38 elected OR board members]

**office_id back-fill** (range swap):
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -3209011 AND -3209001   -- more-negative bound first
  AND p.office_id IS NULL;
```

**Post-verify DO block** (school-district section-split + 11-office count):
```sql
DO $$
DECLARE v_gov_count INTEGER; v_office_count INTEGER; v_split_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_gov_count FROM essentials.governments
  WHERE name = 'Clark County School District, Nevada, US';
  IF v_gov_count <> 1 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 1 CCSD government row, found %', v_gov_count;
  END IF;

  SELECT COUNT(*) INTO v_office_count
  FROM essentials.offices o JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.geo_id = '3200060' AND d.district_type = 'SCHOOL' AND d.state = 'nv';
  IF v_office_count <> 11 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 11 trustee offices on SCHOOL district, found %', v_office_count;
  END IF;

  -- Section-split: G5420 geo_id=3200060 geofence must have a matching SCHOOL district
  SELECT COUNT(*) INTO v_split_count
  FROM essentials.geofence_boundaries gb
  WHERE gb.geo_id = '3200060' AND gb.mtfcc = 'G5420'
    AND NOT EXISTS (
      SELECT 1 FROM essentials.districts d
      WHERE d.geo_id = gb.geo_id AND d.district_type = 'SCHOOL' AND d.state = 'nv'
    );
  IF v_split_count <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: section-split detector returned % orphan rows', v_split_count;
  END IF;

  RAISE NOTICE 'Post-verification PASSED: gov=%, offices=%, split_orphans=%',
    v_gov_count, v_office_count, v_split_count;
END $$;
```

**Ledger registration** (OUTSIDE transaction, `(version, name)` form — only 1107 registers):
```sql
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('1107', 'ccsd_board_of_trustees')
ON CONFLICT (version) DO NOTHING;
```

### Pattern 3: Headshot Script (WAF fallback chain — NOT clean like Boulder City)

**Analog:** `_tmp-north-las-vegas-council-headshots.py` (Phase 164 — the WAF-handling variant with Chrome-UA + Wikimedia descriptive-UA branches). NOT the clean Boulder City variant.

ccsd.net and BoardDocs both return 403. The `OFFICIALS` list must carry a **per-trustee resolved source URL** found in Wave-0, with a documented `photo_license` per source. Expected source mix:
- ccsd.net trustee portrait JPEGs IF a Chrome-UA + Referer combination bypasses the WAF (Wave-0 to test; NLV/Henderson Akamai precedent suggests it may not).
- Background-image grep on the (curl-fetched) trustee HTML if portraits are CSS background images.
- Ballotpedia candidate-photo / Wikimedia Commons (descriptive UA: `EmpoweredVote-HeadshotBot/1.0 (https://empowered.vote; contact chris@empowered.vote)`) / official campaign sites for elected trustees.
- City portals for appointed trustees (Isaac Barron is also a North Las Vegas figure; Esparza-Stoffregen via Henderson; etc.).

Pipeline body (env-load, `crop_to_4_5`, `resize_600x750`, `upload_to_storage` with `x-upsert`, `resolve_politician_id`, RGBA→white-composite, manifest `SUCCESS/FAILED`) is copied verbatim from the NLV/Boulder City script. Guard: `len(OFFICIALS) == 11`, unique ext_ids, range `-3209011..-3209001`. Document any trustee with no clean source as a genuine gap (FAILED line, no row in 1108).

### Pattern 4: Stance Migration CTE Shape

Identical to `1109..1119` analog `1095_north_las_vegas_goynesbrown_stances.sql` / `1057_clark_county_commission_naft_stances.sql`. Topic-key + `is_live=true` join; `ON CONFLICT (politician_id, topic_id) DO UPDATE`; audit-only (not registered); zero defaults; chairs model. See §Stance Evidence below for CCSD topic emphasis.

### Pattern 5: coverage.js NV Block Addition

Current NV block (lines 183–191 after Boulder City was appended in Phase 165):
```javascript
{
  name: 'Nevada', abbrev: 'NV',
  areas: [
    { label: 'Las Vegas', browseGovernmentList: ['3240000'], browseStateAbbrev: 'NV', hasContext: true },
    { label: 'Henderson', browseGovernmentList: ['3231900'], browseStateAbbrev: 'NV', hasContext: true },
    { label: 'North Las Vegas', browseGovernmentList: ['3251800'], browseStateAbbrev: 'NV', hasContext: true },
    { label: 'Boulder City', browseGovernmentList: ['3206500'], browseStateAbbrev: 'NV', hasContext: true },
  ],
},
```
Append after Boulder City:
```javascript
    { label: 'Clark County School District', browseGovernmentList: ['3200060'], browseStateAbbrev: 'NV', hasContext: true },
```
Browse verification link: `essentials.empowered.vote/results?browse_geo_id=3200060&browse_mtfcc=G5420`
> Wave-0 must re-read the current NV block — line numbers shifted after the Phase 165 Boulder City append. Confirm the exact insertion point and whether the entry belongs in `COVERAGE_STATES` (city-style entries) vs `COVERAGE_COUNTIES`. The browse path for a G5420 school district uses `browse_geo_id` + `browse_mtfcc=G5420` (geofence-keyed), like the other school districts — not the `browseGovernmentList`/`browse_skip_overlap` county form. The planner verifies the correct browse-param shape for school districts against an existing seeded district (e.g. SF/Portland).

### Anti-Patterns to Avoid

- **Skipping the G5420 load** — NV has zero G5420 rows; without the loader the SCHOOL district has no geofence, ST_Covers returns nothing, no trustee ever resolves, and section-split fails. The loader MUST run before migration 1107.
- **Inserting a geometry-less G5420 shell** — do NOT replicate the Boston/ACPS shell+`350`-backfill path. The TIGER loader inserts real geometry directly. A shell would silently break routing (ST_Covers on NULL = NULL).
- **`district_type='SCHOOL_DISTRICT'`** — wrong. The app uses `'SCHOOL'` (confirmed in `254_or`).
- **Uppercase `d.state='NV'` in office/district WHERE clauses** — the #1 silent NV failure. District join keys are lowercase `'nv'`. The geofence row uses `'32'` (FIPS); `governments.state`/`offices.representing_state` use uppercase `'NV'`. Three different casings coexist.
- **Fabricating a district letter for appointed trustees** — appointed seats carry the appointing jurisdiction in the title, never a district letter. Set `is_appointed=true` + `is_appointed_position=true`.
- **Treating board officers (President/VP/Clerk) as separate seats** — they are titles on existing elected trustees (Stevens A, Bustamante Adams F, Dominguez B). 11 seats total, not 14.
- **Hardcoding the chamber auto-generated path column** — GENERATED ALWAYS, never in INSERT list.
- **`photo_origin_url` column** — removed from `politician_images`; does not exist.
- **Grep-gate forbidden tokens in SQL comments** — keep `slug`, `photo_origin_url`, `schema_migrations` (except the actual ledger INSERT) out of comments; paraphrase.
- **Defaulting stances to Neutral** — no evidence = blank spoke (no row). Most of the 45 live topics will be honest blanks for a school trustee.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| G5420 TIGER UNSD download + filter + geometry insert | Manual shapefile parsing / one-off SQL | Adapt `load-or-school-boundaries.ts` (single-GEOID variant) | Correct redirect-following download, AdmZip extract, `GEOID` field handling, `ST_ForcePolygonCCW(ST_SetSRID(ST_Force2D(...)))` insert, idempotent `ON CONFLICT (geo_id,mtfcc)` — tested across OR/CA/MA/TX |
| Single-shared-district routing for 11 trustees | One SCHOOL district per trustee | 1 shared SCHOOL district on `3200060`, 11 office rows | County-wide unified district has one boundary; this is the proven SF/SD/Portland pattern |
| Headshot download + crop + resize + WAF handling | Manual PIL one-off | Adapt `_tmp-north-las-vegas-council-headshots.py` | Crop-first-then-resize, RGBA→white-composite, x-upsert, Chrome-UA + Wikimedia descriptive-UA branches, per-member manifest |
| Stance CTE shape | New schema inference | Copy `1057`/`1095` stance migration | topic_id join via `is_live=true`; ON CONFLICT idempotency; audit-only non-registration |
| Government INSERT guard | Unique-constraint assumption | `WHERE NOT EXISTS (... WHERE name=...)` | `essentials.governments` has no unique constraint |

**Key insight:** The only genuinely new artifact this phase is the **G5420 loader**, and even that is a single-GEOID copy of an existing, battle-tested loader. Everything else is a verbatim copy of the 161/165 deep-seed shape with the roster and labels swapped.

---

## Runtime State Inventory

> This phase is greenfield (new government, new geofence row). No rename/refactor. Verified there is no pre-existing CCSD state to migrate:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — greenfield government; no pre-existing CCSD politicians/offices (Wave-0 `WHERE NOT EXISTS` + external_id collision probe confirm) | none |
| Live service config | None — no external service references CCSD this phase | none |
| OS-registered state | None | none |
| Secrets/env vars | None new — reuses `C:/EV-Accounts/backend/.env` DATABASE_URL + service key | none |
| Build artifacts | None — TS loader run inline, gitignored `_tmp-*.py` script | none |

**Nothing found in any category** — verified greenfield. The only "new state" is the G5420 geofence row, which is created (not migrated) by the loader.

---

## Common Pitfalls

### Pitfall 1: G5420 load skipped or geometry-less
**What goes wrong:** Migration 1107 runs but no trustee resolves for any address; section-split DO block fires.
**Why it happens:** NV has no G5420 rows (Phase 158 skipped school districts); easy to assume the geofence "already exists" like the city phases reused G4110.
**How to avoid:** Run `load-ccsd-school-boundary.ts` BEFORE migration 1107. Confirm `SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE geo_id='3200060' AND mtfcc='G5420' AND geometry IS NOT NULL` = 1.
**Warning signs:** ST_Covers returns no SCHOOL tier for a Clark County address; post-verify section-split > 0.

### Pitfall 2: Wrong shapefile / GEOID not found in shapefile
**What goes wrong:** Loader's `EXPECTED_COUNT` assertion fails because GEOID `3200060` is absent from the parsed features.
**Why it happens:** Using the wrong state FIPS file, or TIGER vintage mismatch.
**How to avoid:** Use `tl_2024_32_unsd.zip` (NV FIPS 32, confirmed HTTP-200). The loader logs first-feature field names — confirm `GEOID` field present and contains `3200060`. CCSD is the largest NV district; it WILL be in the UNSD file.
**Warning signs:** `ERROR: Expected 1 GEOIDs, found 0`.

### Pitfall 3: Headshot WAF (ccsd.net + BoardDocs both 403)
**What goes wrong:** Headshot script 403s on every ccsd.net URL.
**Why it happens:** ccsd.net/trustees and BoardDocs are behind an Akamai-style WAF (confirmed 403 to Chrome UA).
**How to avoid:** Wave-0 builds a per-trustee fallback chain (Ballotpedia, Wikimedia descriptive-UA, official campaign/city sites). Expect genuine gaps for appointed trustees and lower-profile members; document honestly. This is the Henderson/NLV situation, not Boulder City.
**Warning signs:** All 11 FAILED in manifest; 0 rows in 1108.

### Pitfall 4: Appointed trustees mislabeled or given a fabricated district
**What goes wrong:** Appointed trustees seeded with a district letter or `is_appointed=false`.
**Why it happens:** Copying the elected-trustee CTE without changing flags/title.
**How to avoid:** 4 appointed blocks set `is_appointed=true`, `is_appointed_position=true`, title = `"Trustee, Appointed – <Jurisdiction>"`. No district letter.
**Warning signs:** Profile shows an appointed trustee as "District H" or similar; appointed flag false.

### Pitfall 5: Board officers seeded as extra seats
**What goes wrong:** 14 offices instead of 11 (President/VP/Clerk added as separate rows).
**Why it happens:** Officer titles appear prominently on ccsd.net.
**How to avoid:** Officers are titles on Stevens (A), Bustamante Adams (F), Dominguez (B). 11 seats. Surface officer roles (if at all) as title annotations only.
**Warning signs:** Post-verify finds 12+ offices.

### Pitfall 6: Uppercase `state='NV'` on district/office WHERE clauses
The single most common NV silent failure (matches 0 rows → 0 offices). District join keys lowercase `'nv'`; geofence `'32'`; governments/representing_state uppercase `'NV'`.

### Pitfall 7: All prior NV SQL pitfalls still apply
Grep-gate forbidden tokens in comments; chambers auto-generated path column GENERATED ALWAYS; `politician_images` exactly `(id, politician_id, url, type, photo_license)`; `district_type='SCHOOL'` not `'SCHOOL_DISTRICT'`; `party=NULL` (antipartisan); ledger registers only 1107.

---

## Stance Evidence — D-03a CCSD Topic Emphasis

[CITED: en.wikipedia.org/wiki/Clark_County_School_District_Police_Department; reviewjournal.com; thenevadaindependent.com]

CCSD is the 5th-largest US district (~300K students) — far richer board-level coverage than a small city council. The education cluster is the high-yield vein; most of the other 40+ live topics (abortion, tariffs, Ukraine, Social Security) will be honest blanks for a school trustee.

| Topic Key | Evidence Richness | CCSD-Specific Notes |
|-----------|------------------|---------------------|
| `public-safety-approach` | **HIGH** | CCSD operates its **own police department** (CCSDPD — ~180 sworn officers, 40 civilian; NV POST Category I). The SRO / school-police staffing/budget debate is the single richest CCSD-specific vein. Board votes on CCSDPD budget, officer counts, SRO placement. [CITED: en.wikipedia.org/wiki/Clark_County_School_District_Police_Department] |
| `school-vouchers` | MEDIUM–HIGH | Charters, NV Opportunity Scholarships / ESAs, open enrollment — board resolutions and public statements on school choice / funding diversion. |
| `civil-rights` | MEDIUM | Book-review/library policy, DEI policy, curriculum-transparency votes. |
| `religious-freedom` | LOW–MEDIUM | Religious-content / opt-out policy if any board statements exist. |
| `trans-athletes` | LOW–MEDIUM | Transgender-student & athletics policy — only where a trustee is on record. |
| `taxes` | MEDIUM | Bond/capital measures, per-pupil-funding advocacy, budget votes. |
| `childcare` | LOW | Pre-K / early-childhood expansion positions. |
| `growth-and-development` / `residential-zoning` | LOW–MEDIUM | New-school siting / rezoning for school capacity in a fast-growing county. |
| `local-immigration` / `immigration` | LOW–MEDIUM | ICE-on-campus / sanctuary-school / undocumented-student-protection statements. |

**Honest-blank expectation:** Elected trustees with longer tenure (Stevens, Bustamante Adams, Cavazos) will have the most cited positions; newer elected (Henry, Zamora, Biassotti, Dominguez — all elected/seated Nov 2024) and the 4 **appointed (currently nonvoting until 2027)** trustees will have thin records. **Appointed trustees being nonvoting through 2026 means there are NO roll-call votes to attribute to them** — their stances must come from public statements only, and many will be blank. This is correct and honest. Evidence-integrity rule (164 lesson): verify roll-calls and confirm the statement is the individual trustee's, not the board's collective action, before placing a value.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| City phases (162–165) reused existing G4110 geofences | This phase LOADS a new G5420 boundary (loader script) | Phase 166 | Re-introduces the TS loader toolchain absent since Phase 158 |
| Boston/ACPS G5420 shells + `350` geometry-copy backfill | TIGER loader inserts real geometry directly | Phase 166 | No separate geometry-copy migration; one fewer step |
| All prior NV rosters fully elected | Mixed elected (A–G) + appointed (4 jurisdictions) | Phase 166 | First appointed-member roster in the app; `is_appointed`/title encode the distinction |
| Appointed trustees | Nonvoting through 2026; full voting rights 2027 (SB460), never officer-voting | NV SB460 (2023) | Stance evidence for appointed four is statement-only (no roll-calls) — expect blanks |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | UNSD GEOID `3200060` appears in `tl_2024_32_unsd.zip` with the `GEOID` field | Pattern 1 | Loader EXPECTED_COUNT fails; Wave-1 dry-run with `--dry-run` confirms before write (loader logs found GEOIDs). Low risk — CCSD is the largest NV district. |
| A2 | The 4 appointed-trustee names (Barron / Esparza-Stoffregen / Johnson / Satory) and their appointing jurisdictions are current as of 2026-06-29 | Roster | Wave-0 operator checkpoint against ccsd.net/trustees re-confirms (page is WAF'd to curl but readable in a browser); appointed seats can rotate. |
| A3 | `photo_license` per trustee depends on the actual fallback source found in Wave-0 | Headshots | Operator sets per source at execution (`us_government_work` / `public_domain` / `cc_by_sa_*` / `press_use`); functional impact minimal. |
| A4 | School-district browse uses `browse_geo_id` + `browse_mtfcc=G5420` (not the county `browseGovernmentList`+skip-overlap form) | Pattern 5 | If the school-district coverage entry needs a different shape, the chip/browse link breaks; planner verifies against an existing seeded G5420 district (SF/Portland). |
| A5 | `governments.type='LOCAL'` for the CCSD government (per `254_or` school-district precedent) | Pattern 2 | If the app expects a different type string for school governments, surfacing/labeling may differ; `254_or` is the authoritative precedent (6 OR districts all `'LOCAL'`). |

---

## Open Questions

1. **Does any Chrome-UA + Referer combination bypass the ccsd.net WAF for trustee portraits?**
   - What we know: ccsd.net/trustees and BoardDocs both 403 to a bare Chrome UA.
   - What's unclear: whether adding `Referer: https://ccsd.net/trustees/` or a cookie pass unblocks the portrait JPEGs (Henderson/NLV Akamai stayed blocked; Boulder City was clean).
   - Recommendation: Wave-0 tests; if blocked, go straight to the Ballotpedia/Wikimedia/campaign fallback chain per trustee.

2. **coverage.js entry placement — `COVERAGE_STATES` NV block vs a `COVERAGE_COUNTIES`-style school entry?**
   - What we know: city entries live in the NV `COVERAGE_STATES` block (Phase 165); county entries live in `COVERAGE_COUNTIES` (Phase 161).
   - What's unclear: which list a school district belongs in, and the exact browse-param shape for a G5420 district.
   - Recommendation: planner checks how an existing seeded school district (SF/Portland) is surfaced in coverage.js and mirrors it; default to the NV `COVERAGE_STATES` block with `browse_geo_id`+`browse_mtfcc=G5420` if no school-district precedent exists in coverage.js.

3. **Exact legal full names + diacritics for all 11 trustees.**
   - What we know: 11 names confirmed from ccsd.net/trustees.
   - What's unclear: middle initials / suffixes / diacritics (e.g. "Esparza-Stoffregen" spelling; "Linda P. Cavazos" middle initial).
   - Recommendation: Wave-0 operator checkpoint locks exact spellings against ccsd.net (file saved UTF-8 per `254_or` ñ/é precedent).

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| psql | Migration apply | ✓ | prior phases | — |
| Node.js / tsx | G5420 loader + smoke test | ✓ | prior phases | — |
| `adm-zip`, `shapefile`, `pg`, `dotenv` (npm) | G5420 loader | ✓ | in `C:/EV-Accounts/backend/node_modules` (used by load-or-school-boundaries.ts) | Wave-0 `ls node_modules` confirms |
| Python 3 + Pillow + psycopg2 + requests | Headshot pipeline | ✓ | prior phases | — |
| census.gov TIGER 2024 UNSD `tl_2024_32_unsd.zip` | G5420 boundary | ✓ | HTTP 200, 403 KB verified 2026-06-29 | — |
| ccsd.net / BoardDocs trustee portraits | Headshots (primary) | ✗ (403 WAF) | — | Ballotpedia / Wikimedia (descriptive UA) / campaign / city portals |
| DATABASE_URL + SERVICE_KEY | Migration + Storage | ✓ | `C:/EV-Accounts/backend/.env` | — |

**Missing dependencies with no fallback:** None blocking. The only ✗ (ccsd.net headshots) has a fallback chain; genuine per-trustee gaps are documented honestly.

---

## Validation Architecture

> workflow.nyquist_validation not explicitly false in config — section included. Data-seed phase: verification is SQL/HTTP gates + address-routing smoke tests, NOT a unit-test suite. Mirrors Phase 165 MINUS the at-large city checks PLUS the G5420-load + 11-office + appointed-flag checks.

### Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | TypeScript smoke scripts via `npx tsx` + inline SQL gates (`psql -f`) |
| Config file | none — ad-hoc scripts (project deep-seed convention) |
| Quick run command | `npx tsx scripts/smoke-nv-geofences.ts` (extend: assert CCSD G5420 covers a Clark County point) |
| Full suite command | Inline 10-check E2E SQL/HTTP verification |
| Estimated runtime | ~30 seconds |

### Phase Requirements → Test Map

| Req | Behavior | Test Type | Automated Command | File Exists |
|-----|----------|-----------|-------------------|-------------|
| CCSD-01 SC#1 | G5420 boundary loaded with geometry | SQL gate | `SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE geo_id='3200060' AND mtfcc='G5420' AND geometry IS NOT NULL` = 1 | ❌ W0 |
| CCSD-01 SC#1 | Clark County address returns the SCHOOL tier (G5420) | smoke | Extend `smoke-nv-geofences.ts`: existing Strip/LV/Henderson/NLV/Boulder City points should now ALSO return G5420 geo_id=3200060 | ❌ W0 |
| CCSD-01 SC#1 | Clark County address returns all 11 trustees | SQL/HTTP | `SELECT COUNT(*) FROM essentials.offices o JOIN essentials.districts d ON d.id=o.district_id WHERE d.geo_id='3200060' AND d.district_type='SCHOOL' AND d.state='nv'` = 11 | ❌ W0 |
| CCSD-01 SC#1 | 7 elected + 4 appointed split | SQL gate | `SELECT is_appointed_position, COUNT(*) FROM essentials.offices o JOIN essentials.districts d ON d.id=o.district_id WHERE d.geo_id='3200060' AND d.district_type='SCHOOL' GROUP BY 1` → false:7, true:4 | ❌ W0 |
| CCSD-01 SC#1 | Chamber present, official_count=11 (if set) | SQL gate | `SELECT official_count FROM essentials.chambers WHERE name='Board of School Trustees'` = 11 (or NULL if omitted) | ❌ W0 |
| CCSD-01 SC#1 | No section-split | SQL gate | section-split scan for geo_id=3200060 G5420 = 0 orphan rows | ❌ W0 |
| CCSD-01 SC#2 | ≤11 trustees have 600×750 headshots; gaps documented | SQL gate | `SELECT COUNT(*) FROM essentials.politician_images pi JOIN essentials.politicians p ON p.id=pi.politician_id WHERE p.external_id BETWEEN -3209011 AND -3209001` (target = 11 − documented gaps) | ❌ W0 |
| CCSD-01 SC#3 | Evidence-only stances render (no defaults) | SQL gate | `SELECT COUNT(*) FROM inform.politician_answers pa JOIN essentials.politicians p ON pa.politician_id=p.id WHERE p.external_id BETWEEN -3209011 AND -3209001` ≥ 1; every answer paired with non-null context; 0 default values | ❌ W0 |
| CCSD-01 SC#4 | CCSD in coverage.js with hasContext:true | manual | Inspect `src/lib/coverage.js` + browse `?browse_geo_id=3200060&browse_mtfcc=G5420` | ❌ W0 manual |
| — | Casing correct | SQL gate | `SELECT DISTINCT state FROM essentials.districts WHERE geo_id='3200060'` = `'nv'` only; geofence row state='32' | ❌ W0 |

### 10-Check E2E Verification

1. **G5420 geofence loaded:** `geo_id='3200060' AND mtfcc='G5420' AND geometry IS NOT NULL` = 1 row, `source='tiger_unsd_nv_2024'`
2. **Government exists:** `SELECT id FROM essentials.governments WHERE name='Clark County School District, Nevada, US'` — 1 row
3. **Chamber exists:** `Board of School Trustees` under the CCSD government — 1 row
4. **One SCHOOL district on 3200060:** `district_type='SCHOOL' AND state='nv' AND mtfcc='G5420'` — exactly 1
5. **11 offices on the SCHOOL district:** count = 11
6. **Elected/appointed split:** 7 `is_appointed_position=false` + 4 `=true`
7. **≤11 headshots (gaps documented):** count from politician_images BETWEEN range
8. **≥1 stance + 0 orphan answers:** every answer has paired context; 0 defaults
9. **0 section-split:** G5420 `3200060` geofence has matching SCHOOL district
10. **Casing + ledger:** districts.state `'nv'` only; geofence state `'32'`; `SELECT MAX(version) FROM supabase_migrations.schema_migrations` confirms 1107 registered, 1108+ absent

### Sampling Rate
- **After Wave 1 (G5420 loader + structural migration 1107):** checks 1–6, 9, 10
- **After Wave 2 (headshots 1108):** check 7
- **After Wave 3 (stances 1109–1119):** check 8; run all 10 for sign-off
- **Phase gate:** all 10 green + operator browse-verify (correct-person headshots + 11-trustee render + elected/appointed labels) before `/gsd:verify-work`

### Wave 0 Requirements
- [ ] On-disk migration MAX: `ls C:/EV-Accounts/backend/migrations | grep -oE '^[0-9]+' | sort -n | tail -1` (confirmed 1106 → next 1107; re-verify before write)
- [ ] external_id collision: `SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -3209011 AND -3209001` → 0
- [ ] No pre-existing CCSD government: `SELECT COUNT(*) FROM essentials.governments WHERE name='Clark County School District, Nevada, US'` → 0
- [ ] No pre-existing G5420 row for NV: `SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE geo_id='3200060'` → 0 (confirms greenfield load)
- [ ] Confirm TS loader deps present: `ls C:/EV-Accounts/backend/node_modules/adm-zip C:/EV-Accounts/backend/node_modules/shapefile`
- [ ] Loader `--dry-run`: `npx tsx scripts/load-ccsd-school-boundary.ts --dry-run` confirms GEOID `3200060` found in shapefile (logs found GEOIDs) BEFORE the real run
- [ ] Roster operator checkpoint vs ccsd.net/trustees: 7 elected A–G + 4 appointed; exact spellings/diacritics; confirm appointed jurisdictions; officers are title-on-seat
- [ ] Headshot WAF probe + fallback chain per trustee (ccsd.net Chrome-UA+Referer test; then Ballotpedia/Wikimedia/campaign)
- [ ] Extend `smoke-nv-geofences.ts`: the 4 incorporated-city points + the Strip point should ALL now return G5420 geo_id=3200060 (CCSD covers the whole county)

### Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Correct-person headshots + elected/appointed labels | CCSD-01 SC#1/#2 | Visual identity + label render | Browse a Clark County address; confirm 11 trustees, District A–G labels + appointed-jurisdiction labels, right photos, no overlays |
| Coverage chip renders purple | CCSD-01 SC#4 | Frontend render | Visit `essentials.empowered.vote/results?browse_geo_id=3200060&browse_mtfcc=G5420` |

---

## Sources

### Primary (HIGH confidence)
- `C:/EV-Accounts/backend/scripts/load-or-school-boundaries.ts` (read in full) — canonical G5420 TIGER UNSD loader template
- `C:/EV-Accounts/backend/migrations/254_or_school_districts.sql` (read) — school-district structural shape (gov type='LOCAL', SCHOOL district, board-member CTEs on one G5420)
- `C:/EV-Accounts/backend/migrations/350_school_geofence_geometry.sql` (read in full) — confirms shell+backfill is the EXCEPTION, not the load path
- `C:/EV-Accounts/backend/migrations/1055_clark_county_commission.sql` patterns (via 161-PATTERNS) — single-shared-district NV shape + ledger registration
- `C:/EV-Accounts/backend/scripts/smoke-nv-geofences.ts` (read in full) — geofence smoke-test harness (state='32', ST_Covers)
- Live `ls C:/EV-Accounts/backend/migrations` 2026-06-29 — on-disk MAX = 1106
- curl `tl_2024_32_unsd.zip` — HTTP 200, 403 KB, application/zip (2026-06-29)
- curl ccsd.net/trustees/index.php = 403; BoardDocs Public = 403 (2026-06-29)
- NCES district_detail ID 3200060 — Clark County (Nevada), state ID NV-02
- ccsd.net/trustees (WebFetch) — 11-member roster, officers, elected/appointed split

### Secondary (MEDIUM confidence)
- datacommons.org/place/geoId/sch3200060 — Census GEOID for CCSD
- reviewjournal.com/local/education/appointed-school-board-trustees-to-get-voting-rights-in-2027 — SB460, nonvoting-until-2027, no officer voting
- thenevadaindependent.com nonvoting-trustees / rescind-policy — AB175 appointed-trustee context
- en.wikipedia.org/wiki/Clark_County_School_District_Police_Department — CCSDPD ~180 sworn officers (SRO stance vein)
- en.wikipedia.org/wiki/Clark_County_School_District — 5th-largest US district, ~300K students
- Ballotpedia Clark County School District, Nevada, elections (2024) — Nov 2024 election results (Stevens A, Dominguez B, Henry C)

### Tertiary (LOW confidence)
- Exact appointed-trustee name spellings / diacritics — re-confirm in Wave-0 operator checkpoint [ASSUMED]

---

## Metadata

**Confidence breakdown:**
- UNSD GEOID + G5420 loader pattern: HIGH — loader read in full; shapefile HTTP-200; GEOID confirmed via NCES + Census
- Roster (11 members, elected/appointed split): HIGH — ccsd.net/trustees + Ballotpedia
- Migration counter: HIGH — live ls 2026-06-29 (1106 → 1107)
- Schema / migration shape: HIGH — 254_or + 1055/1095 read; 165/161 patterns
- Headshot sourcing: MEDIUM — primary sources WAF-403; fallback chain required, gaps likely for appointed trustees
- Stance evidence depth: MEDIUM — CCSDPD/SRO + vouchers veins identified; per-trustee citations need execution-time research; appointed-trustee blanks expected (nonvoting)

**Research date:** 2026-06-29
**Valid until:** 2026-07-29 (30 days) — roster stable until appointed-seat rotation or 2026 election turnover; headshot URLs/WAF may change

---

## RESEARCH COMPLETE

**Phase:** 166 - CCSD Board of Trustees Deep-Seed
**Confidence:** HIGH (structure/IDs/loader); MEDIUM (headshots/stances)

### Key Findings

1. **G5420 loader is the one new mechanism — template exists.** `load-or-school-boundaries.ts` is the canonical TIGER UNSD loader; CCSD is a single-GEOID variant (`tl_2024_32_unsd.zip`, GEOID `3200060`, state `32`, source `tiger_unsd_nv_2024`, insert geometry directly). Run it BEFORE migration 1107. No geometry-copy migration needed (that was a Boston/ACPS shell fix).

2. **UNSD GEOID = `3200060`** (NCES 3200060 / Census `sch3200060`). Same value for the geofence row AND the standalone government geo_id. County-wide unified district ≈ Clark County boundary.

3. **Roster = 11 (7 elected A–G + 4 appointed), fully confirmed.** Elected: Stevens(A,Pres), Dominguez(B,Clerk), Henry(C), Zamora(D), Biassotti(E), Bustamante Adams(F,VP), Cavazos(G). Appointed (AB175): Barron(NLV), Esparza-Stoffregen(Henderson), Johnson(Las Vegas), Satory(Clark County). Officers are titles, not seats. Appointed trustees are NONVOTING until 2027 (SB460) → statement-only stance evidence, expect blanks.

4. **Headshots: ccsd.net + BoardDocs both WAF-403** — fallback chain mandatory (Ballotpedia/Wikimedia-descriptive-UA/campaign/city portals). Document genuine gaps. This is the Henderson/NLV situation.

5. **Migration counter 1106 → next structural = 1107.** Block: 1107 structural (registered, includes nothing geofence — the loader runs separately as a TS script) + 1108 headshots (audit-only) + 1109–1119 stances (audit-only, one per trustee).

### File Created
`.planning/phases/166-ccsd-board-of-trustees-deep-seed/166-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| G5420 loader + UNSD GEOID | HIGH | Loader read in full; shapefile HTTP-200; GEOID via NCES + Census |
| Government/migration structure | HIGH | 254_or + 1055 + 165/161 patterns |
| Roster + elected/appointed split | HIGH | ccsd.net + Ballotpedia |
| Migration counter | HIGH | live ls 2026-06-29 |
| Headshot sourcing | MEDIUM | primary WAF-403; fallback chain + likely gaps |
| Stance evidence depth | MEDIUM | veins identified; per-trustee research at execution; appointed blanks |

### Open Questions
1. ccsd.net WAF bypass (Chrome-UA+Referer) — Wave-0 tests; else fallback chain.
2. coverage.js placement (COVERAGE_STATES NV block vs school-district shape) + exact G5420 browse-param form — planner mirrors an existing seeded school district.
3. Exact legal names/diacritics for 11 trustees — Wave-0 operator checkpoint.

### Ready for Planning
Research complete. The planner can write executable plans: (Wave 1) G5420 loader + structural migration 1107; (Wave 2) headshots 1108; (Wave 3) per-trustee stances 1109–1119; + coverage.js edit + 10-check E2E. No blocking unknowns.
