# Phase 166: CCSD Board of Trustees Deep-Seed - Pattern Map

**Mapped:** 2026-06-29
**Files analyzed:** 6 new/modified artifacts (1 TS loader, 1 structural migration, 1 headshot migration + 1 gitignored py script, 11 stance migrations, 1 coverage.js edit, 1 optional smoke-test extension)
**Analogs found:** 6 / 6 (all exact or role-match; every analog read in full this session)

> This phase is a **data-seed**, not application code. "Role" = artifact kind; "data flow" = the seed mechanism (TIGER geofence load / structural DDL+DML / audit-only DML / frontend config). RESEARCH.md already carries Patterns 1–5 with adapted code; this PATTERNS.md pins each one to a **read, line-numbered analog** on disk so the planner can copy verbatim. Where RESEARCH.md and the on-disk analog differ, the analog wins.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `C:/EV-Accounts/backend/scripts/load-ccsd-school-boundary.ts` | loader (TS) | file-I/O → DB insert (TIGER UNSD geofence) | `C:/EV-Accounts/backend/scripts/load-or-school-boundaries.ts` | exact (single-GEOID variant) |
| `C:/EV-Accounts/backend/migrations/1107_ccsd_board_of_trustees.sql` | migration (structural, registered) | DDL+DML, single shared SCHOOL district | `254_or_school_districts.sql` (school shape) + `1055_clark_county_commission.sql` (single-district + ledger) | exact (composite of two) |
| `C:/EV-Accounts/backend/migrations/1108_ccsd_trustees_headshots.sql` | migration (audit-only) | CRUD into `politician_images` | `1094_north_las_vegas_city_council_headshots.sql` | exact |
| `C:/EV-Accounts/backend/scripts/_tmp-ccsd-trustees-headshots.py` | script (gitignored) | file-I/O fetch → crop/resize → Storage PUT | NLV/Boulder City `_tmp-*-headshots.py` (gitignored — not on disk; reconstruct from 164/165 SUMMARY + 1094 manifest) | role-match (pattern only) |
| `C:/EV-Accounts/backend/migrations/1109..1119_ccsd_*_stances.sql` (11) | migration (audit-only, one per trustee) | DML into `inform.politician_answers`+`politician_context` | `1057_clark_county_commission_naft_stances.sql` | exact |
| `C:/Transparent Motivations/essentials/src/lib/coverage.js` | config (frontend) | static surfacing data | existing NV block (lines 184–191) + `coverageAreaToPath` `browseGeoId` branch (lines 306–313) | role-match (no in-file school precedent) |
| `C:/EV-Accounts/backend/scripts/smoke-nv-geofences.ts` (optional extend) | test (TS smoke) | PIP `ST_Covers` assertions | same file (lines 33–91 address table) | exact (self-extend) |

---

## Pattern Assignments

### `load-ccsd-school-boundary.ts` (loader, TIGER UNSD file-I/O → geofence insert)

**Analog:** `C:/EV-Accounts/backend/scripts/load-or-school-boundaries.ts` (read in full, 269 lines).

**Copy the file verbatim and change ONLY the config block** (analog lines 31–46). The download/redirect/cache (73–97), zip extract (104–116), `shapefile.open` + GEOID-field filter (149–184), the geometry insert (210–219), and post-insert verification (240–254) are all reused unchanged.

**Config block to change** (analog lines 31–46 → CCSD values):
```typescript
const TIGER_URL      = 'https://www2.census.gov/geo/tiger/TIGER2024/UNSD/tl_2024_32_unsd.zip'; // NV FIPS 32
const MTFCC          = 'G5420';
const STATE          = '32';                    // Nevada FIPS — geofence_boundaries.state convention
const SOURCE         = 'tiger_unsd_nv_2024';
const EXPECTED_COUNT = 1;
const TARGET_GEOIDS  = new Map<string, string>([
  ['3200060', 'Clark County School District'],
]);
// also rename baseName/tmpRoot (analog lines 50–53): tl_2024_32_unsd, .tmp-nv-school-unsd
```

**The geometry insert — copy verbatim** (analog lines 210–219; `ocd_id` = the GEOID, same as the OR loader):
```typescript
INSERT INTO essentials.geofence_boundaries
  (geo_id, ocd_id, name, state, mtfcc, geometry, source, imported_at)
VALUES ($1, $2, $3, $4, $5,
  public.ST_ForcePolygonCCW(
    public.ST_SetSRID(public.ST_Force2D(public.ST_GeomFromGeoJSON($6)), 4326)
  ),
  $7, now())
ON CONFLICT (geo_id, mtfcc) DO NOTHING
// params: [geoId, geoId, name, STATE, MTFCC, geometryJson, SOURCE]
```

**GEOID field filter** (analog lines 161–176): the loader logs first-feature field names and hard-fails if `GEOID` is missing; `--dry-run` (analog line 48) lists found GEOIDs without writing. Run `--dry-run` first per Wave-0.

**Run order (CRITICAL):** orchestrator runs this loader **before** `psql -f 1107_*.sql`. The SCHOOL district INSERT and the section-split DO block in 1107 reference the geofence row by `geo_id='3200060' AND mtfcc='G5420'`. No geometry-copy migration needed (the loader inserts the real polygon directly; the `350_school_geofence_geometry.sql` shell-backfill path does NOT apply here).

---

### `1107_ccsd_board_of_trustees.sql` (structural migration — REGISTERED)

**Composite of two read analogs:**
- **School-district shape** from `254_or_school_districts.sql` (read; 1632 lines) — `governments.type='LOCAL'`, `WHERE NOT EXISTS` government guard, `Board of …` chamber, `district_type='SCHOOL'` + `state='or'` lowercase + `mtfcc='G5420'`, board-member CTE blocks all on one G5420 district.
- **Single-shared-district + ledger + post-verify** from `1055_clark_county_commission.sql` (read; 404 lines) — all offices on ONE district, NV casing, office_id back-fill, post-verify DO block (gov=1 / office-count / section-split=0), out-of-transaction ledger registration.

**Government INSERT** — `254_or` lines 51–58 shape, CCSD values (`type='LOCAL'`, `state='NV'` uppercase):
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'Clark County School District, Nevada, US',
       'LOCAL', 'NV', NULL, '3200060'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'Clark County School District, Nevada, US'
);
```
> `governments` has NO unique constraint and NO `government_type` column — the `WHERE NOT EXISTS` guard is mandatory (`254_or` line 13, `1055` line 26). Use `type='LOCAL'` (school precedent), NOT `'County'`/`'City'`.

**Chamber INSERT** — `254_or` lines 111–121 shape; auto-generated path column NEVER in the column list (`254_or` line 12; `1055` line 25):
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
> `name_formal` must be non-empty. `official_count` was omitted in `254_or` chambers; if the planner includes it (per Boulder City), set `=11`.

**SCHOOL district INSERT** — `254_or` lines 191–196 shape, CCSD values, `state='nv'` lowercase:
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'SCHOOL', 'nv', '3200060', 'Clark County School District', 'G5420'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '3200060' AND district_type = 'SCHOOL' AND state = 'nv'
);
-- district_type='SCHOOL' (NOT 'SCHOOL_DISTRICT'); state='nv' LOWERCASE; mtfcc='G5420'
```

**Elected trustee CTE (×7, Districts A–G)** — copy the `254_or` board-member block verbatim (lines 252–281 = Block 1), swapping name/external_id/title. `is_appointed=false`, `is_appointed_position=false`, `party=NULL`:
```sql
-- BLOCK 1: Emily Stevens (District A, President) — -3209001
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Emily Stevens', 'Emily', 'Stevens', NULL,
          true, false, false, true, -3209001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(), d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Board of School Trustees'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'Clark County School District, Nevada, US')),
       p.id, 'Trustee, District A', 'NV', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '3200060' AND d.district_type = 'SCHOOL' AND d.state = 'nv'   -- LOWERCASE 'nv' (the #1 NV pitfall)
  AND p.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id);
```

**Appointed trustee CTE (×4)** — same block, but `is_appointed=true` on politician AND `is_appointed_position=true` on office; title carries the appointing jurisdiction, NO district letter:
```sql
-- BLOCK 8: Isaac Barron (Appointed – City of North Las Vegas) — -3209008
... VALUES (..., 'Isaac Barron', ..., NULL, true, true, false, true, -3209008) ...  -- is_appointed=TRUE
... 'Trustee, Appointed – City of North Las Vegas', 'NV', true, false, NULL ...      -- is_appointed_position=TRUE
```
> No on-disk CCSD-style appointed precedent exists — `254_or` sets `is_appointed=false` on all 38 elected members. CCSD's appointed four are the FIRST appointed school-board members in the app; set both flags honestly (RESEARCH §Pattern 2 / Pitfall 4). Use the SAME elected-block SQL skeleton with the two flags flipped + the jurisdiction title.

**office_id back-fill** — copy `1055` lines 334–339, swap the range (more-negative bound first):
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -3209011 AND -3209001
  AND p.office_id IS NULL;
```

**Post-verify DO block** — copy `1055` lines 348–393 shape; change geo_id→`3200060`, district_type→`SCHOOL`, mtfcc→`G5420`, office count→`11`:
```sql
-- Gate (a) gov=1; Gate (b) offices on SCHOOL district = 11; Gate (c) section-split = 0
-- section-split: geofence_boundaries gb WHERE gb.geo_id='3200060' AND gb.mtfcc='G5420'
--   AND NOT EXISTS (district d WHERE d.geo_id=gb.geo_id AND d.district_type='SCHOOL' AND d.state='nv')
```
> Optional extra gate the planner may add: assert the 7/4 elected/appointed split (`GROUP BY is_appointed_position` → false:7, true:4) per RESEARCH 10-check #6.

**Ledger registration** — copy `1055` lines 401–403 (OUTSIDE the COMMIT), `(version, name)` form; ONLY 1107 registers:
```sql
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('1107', 'ccsd_board_of_trustees')
ON CONFLICT (version) DO NOTHING;
```

**Pre-flight guard:** `254_or` uses `RAISE EXCEPTION` if the gov name exists (lines 29–42); `1055` uses `RAISE NOTICE` + idempotent re-run (lines 37–43). Either is fine — `1055`'s idempotent style is preferred for re-runnability.

---

### `1108_ccsd_trustees_headshots.sql` (audit-only headshot migration)

**Analog:** `1094_north_las_vegas_city_council_headshots.sql` (read in full, 79 lines) — the WAF-fallback variant (NLV's cityofnorthlasvegas.com was Akamai-403, sources were Wikimedia/Ballotpedia, exactly the CCSD situation).

**Per-trustee row** — copy `1094` lines 23–32 (one block per trustee), resolve `politician_id` by `external_id` (minted by 1107), `NOT EXISTS` idempotency, columns EXACTLY `(id, politician_id, url, type, photo_license)`:
```sql
-- -3209001 Emily Stevens (District A)
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -3209001),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/<uuid>-headshot.jpg',
       'default', '<photo_license>'   -- public_domain / press_use / cc_by_sa_* / us_government_work per source
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -3209001)
);
```

**Header pattern** — copy the `1094` lines 1–19 header: declare AUDIT-ONLY (no ledger INSERT, structural ledger stays at 1107), list the per-trustee source + license in a manifest comment, note ccsd.net/BoardDocs skipped (WAF-403). Footer (`1094` line 79): `-- AUDIT-ONLY: no schema_migrations INSERT (structural ledger stays at 1107).`

> `type='default'` on all rows. NO image-origin / `photo_origin_url` column (removed). Document genuine gaps as a FAILED line in the script manifest + NO row here (do not insert a placeholder).

---

### `_tmp-ccsd-trustees-headshots.py` (gitignored fetch/crop/resize/upload script)

**Analog:** the NLV/Boulder City `_tmp-*-headshots.py` scripts — **not on disk** (gitignored; `Glob` for `*headshot*.py` and `_tmp-north-las-vegas*.py` returned nothing). Reconstruct the pipeline from the `1094` manifest + `164-/165-SUMMARY.md` + `project_phase164_complete`/`project_phase165_complete` memories. Pipeline body to reproduce (per RESEARCH §Pattern 3, confirmed across 161–165):
- env-load `C:/EV-Accounts/backend/.env` (DATABASE_URL + SERVICE_KEY).
- `OFFICIALS` list of 11: `(external_id, name, source_url, photo_license)`; guard `len==11`, unique ext_ids in range `-3209011..-3209001`.
- `crop_to_4_5()` → `resize_600x750()` (Lanczos, q90); RGBA→white-composite.
- `resolve_politician_id()` by external_id (psycopg2).
- `upload_to_storage()` PUT with `x-upsert`, path `politician_photos/{uuid}-headshot.jpg`.
- **WAF fallback chain** per trustee: Chrome-UA + Referer against ccsd.net → background-image grep → Ballotpedia / Wikimedia (descriptive UA `EmpoweredVote-HeadshotBot/1.0 (https://empowered.vote; contact chris@empowered.vote)`) / campaign / city portals.
- per-member manifest `SUCCESS`/`FAILED`; FAILED = documented gap (no 1108 row).

---

### `1109..1119_ccsd_*_stances.sql` (audit-only, one per trustee)

**Analog:** `1057_clark_county_commission_naft_stances.sql` (read in full, 39 lines). Copy the CTE verbatim per trustee — only the politician UUID and the `VALUES` rows change.

**The full shape to copy** (`1057` lines 13–37):
```sql
BEGIN;
WITH s(topic_key, val, reasoning, sources) AS (
  VALUES
    ('public-safety-approach'::text, 4, '<cited CCSD-board statement/vote>', ARRAY['https://...']::text[]),
    ('school-vouchers'::text, 3, '<...>', ARRAY['https://...']::text[])
    -- one row per topic WITH cited evidence; omit topics with no evidence (honest blank, no row)
),
t AS (
  SELECT s.*, ct.id AS topic_id
  FROM s JOIN inform.compass_topics ct
    ON ct.topic_key = s.topic_key AND ct.is_live = true     -- resolve topic_id LIVE, never hardcode UUIDs
),
ins_ans AS (
  INSERT INTO inform.politician_answers (politician_id, topic_id, value)
  SELECT '<TRUSTEE_UUID>'::uuid, topic_id, val FROM t
  ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = EXCLUDED.value
  RETURNING 1
)
INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
  SELECT '<TRUSTEE_UUID>'::uuid, topic_id, reasoning, sources FROM t
  ON CONFLICT (politician_id, topic_id) DO UPDATE
    SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;
COMMIT;
```

**Header** (`1057` lines 1–10): AUDIT-ONLY (NOT registered, structural ledger stays at 1107), chairs model (value = the discrete position the evidence matches, not polarity), 100% cited, honest blanks, no defaults, `politician_id` resolved from the external_id minted by 1107.

> **CCSD topic emphasis** (D-03a / RESEARCH §Stance Evidence): lead with `public-safety-approach` (CCSDPD/SRO — richest vein), `school-vouchers`, `civil-rights`/`religious-freedom`/`trans-athletes`, `taxes`/`childcare`/`growth-and-development`/`residential-zoning`/`immigration`. Most of the 45 live topics will be honest blanks for a trustee. The 4 appointed trustees are **nonvoting through 2026** → statement-only evidence, expect many blanks (no roll-calls to attribute). Single-quote escaping = `''` (see `1057` line 15).

**Naming:** RESEARCH suggests `1109_ccsd_stevens_stances.sql` … `1119_ccsd_satory_stances.sql` (one per trustee, matching the `1102..1106_boulder_city_*_stances.sql` / `1057..1063_clark_county_commission_*_stances.sql` convention).

---

### `src/lib/coverage.js` (frontend surfacing — NV block append)

**Analog:** the existing NV block (read, lines 184–191) + the `coverageAreaToPath` `browseGeoId` branch (read, lines 306–313).

**KEY FINDING — no in-file school-district precedent.** `Grep` for `School`/`Unified`/`browseGeoId`/`browseMtfcc` in coverage.js: the only hits are inside the `coverageAreaToPath` function (lines 306–313). **No school district is currently surfaced as a coverage area** (SF/Portland/Boston etc. are routed but not listed here). So the planner is establishing the first school-district coverage entry — and must use the geofence-keyed `browseGeoId` + `browseMtfcc` shape, NOT the city/county `browseGovernmentList` shape.

**The function already supports the right shape** (lines 306–313 — copy this branch's expected fields):
```javascript
if (area.browseGeoId) {
  const params = new URLSearchParams({
    browse_geo_id: area.browseGeoId,
    browse_label: area.label,
  });
  if (area.browseMtfcc) params.set('browse_mtfcc', area.browseMtfcc);
  if (area.browseSchoolFilter) params.set('browse_school_filter', area.browseSchoolFilter);
  ...
}
```

**Append to the NV `areas` array** (after Boulder City, current line 189) — use `browseGeoId`+`browseMtfcc`, NOT `browseGovernmentList`:
```javascript
      { label: 'Clark County School District', browseGeoId: '3200060', browseMtfcc: 'G5420', browseStateAbbrev: 'NV', hasContext: true },
```
> ⚠ Line numbers will have shifted; re-read the NV block before editing. Verify whether the entry belongs in `COVERAGE_STATES` NV block (lines 184–191) vs `COVERAGE_COUNTIES` (lines 224–240, which already has `Clark County` → `32003` at line 239 using the `browseGovernmentList`+`browse_skip_overlap` county form). A school district is geofence-keyed, NOT a county — keep it in the NV `COVERAGE_STATES` block with the `browseGeoId` shape. Browse-verify link: `essentials.empowered.vote/results?browse_geo_id=3200060&browse_mtfcc=G5420`.

---

### `smoke-nv-geofences.ts` (optional test extension)

**Analog:** the same file (read in full, 284 lines). All 5 existing Clark County test points (Strip + 4 cities, lines 33–91) should ALSO now return `G5420 geo_id=3200060` once CCSD's county-wide boundary loads. Extend by adding `'G5420'` to each address's `expectedMtfcc` array and `G5420: '3200060'` to each `expectedGeoIds` map. The PIP query (lines 99–106, `state='32'` + `ST_Covers`) is unchanged.

---

## Shared Patterns

### NV three-casing rule (the #1 silent failure)
**Source:** `1055_clark_county_commission.sql` lines 27–30 + `254_or_school_districts.sql` lines 14–15.
**Apply to:** migration 1107 (all district/office WHERE clauses) + the loader + coverage.js.
```
districts.state / office WHERE join key  = 'nv'  (LOWERCASE — uppercase matches 0 rows)
geofence_boundaries.state                = '32'  (NV FIPS)
governments.state / offices.representing_state = 'NV' (UPPERCASE table label)
```

### Single shared district, many offices
**Source:** `1055` lines 102–135 (Block 1) — all 7 commissioners CROSS JOIN the ONE district by `geo_id`+`district_type`+`state`. **Apply to:** all 11 CCSD trustee CTEs (one SCHOOL district on `3200060`).

### Audit-only vs registered ledger split
**Source:** structural = `1055` lines 401–403 (registers `(version,name)`); audit-only = `1057` (no INSERT) + `1094` line 79 (explicit "no schema_migrations INSERT"). **Apply to:** ONLY 1107 registers; 1108 + 1109–1119 do NOT.

### Antipartisan + chambers GENERATED path + politician_images columns
**Source:** `254_or` lines 12, 18; `1094` lines 8–10. **Apply to:** `party=NULL` on all 11 (school-district precedent; note `1055` stored party for the county commission, but `254_or` school board uses NULL — follow the **school** precedent); never INSERT the chamber auto-generated path column; `politician_images` = exactly `(id, politician_id, url, type, photo_license)`.

### Grep-gate forbidden tokens in comments
**Source:** RESEARCH §Anti-Patterns + `feedback_section_split_check` memory. **Apply to:** all SQL — keep `slug`, `photo_origin_url`, `schema_migrations` (except the real ledger INSERT in 1107) out of comments; paraphrase.

---

## No Analog Found

| Artifact | Role | Reason |
|----------|------|--------|
| `_tmp-ccsd-trustees-headshots.py` | script | The NLV/Boulder City `_tmp-*-headshots.py` scripts are **gitignored** and not on disk. Reconstruct the pipeline from the `1094` headshot-migration manifest + 164/165 SUMMARY docs + `project_phase164/165_complete` memories (pipeline body documented in RESEARCH §Pattern 3). |
| coverage.js school-district entry | config | **No existing school district is surfaced in coverage.js** (Grep found zero `School`/`Unified` labels). CCSD is the first — use the `browseGeoId`+`browseMtfcc` branch the `coverageAreaToPath` function already supports (lines 306–313); there is no prior listed entry to mirror, only the function contract. |
| Appointed school-board member SQL | migration | No on-disk precedent for `is_appointed=true` on a school board (`254_or` is all-elected). Reuse the elected-block SQL skeleton with `is_appointed`/`is_appointed_position=true` + jurisdiction title flipped (RESEARCH §Pattern 2). |

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/scripts/` (loaders, smoke), `C:/EV-Accounts/backend/migrations/` (structural + audit), `C:/Transparent Motivations/essentials/src/lib/coverage.js` (frontend surfacing).
**Files read in full this session:** `load-or-school-boundaries.ts`, `254_or_school_districts.sql` (through line 1194 — the board-member CTE pattern repeats identically thereafter), `1055_clark_county_commission.sql`, `1057_clark_county_commission_naft_stances.sql`, `1094_north_las_vegas_city_council_headshots.sql`, `smoke-nv-geofences.ts`, `coverage.js`.
**On-disk facts confirmed:** migration MAX = 1106 (next structural = 1107); headshot `.py` scripts gitignored (absent); all stance/headshot migrations present on disk; coverage.js NV block ends at line 191 (Boulder City line 189).
**Pattern extraction date:** 2026-06-29
