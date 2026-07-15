# Phase 202: Palm Springs Deep-Seed - Pattern Map

**Mapped:** 2026-07-12
**Files analyzed:** 8 (5 backend new, 1 backend audit-migration group of 5, 2 frontend modified/no-op)
**Analogs found:** 8 / 8

This phase is the same shape as Riverside County (Phase 201), itself reused from Pima County
(Phase 193). Riverside is the STRONGER analog than Pima here because Riverside's ArcGIS endpoint
already confirmed the `f=geojson` direct-fetch shape that Palm Springs' `Palm_Springs_Voting_
Districts_2022_(View)` FeatureServer also uses (RESEARCH verified this session) — no rings
conversion needed, unlike Pima. The one structural difference from Riverside: Palm Springs is a
**City** (not a standalone County) with a **rotational Mayor/Mayor Pro Tem** title-on-seat pair
(Riverside's Board of Supervisors had a Chair annotation instead — same *mechanic* function, title
annotated directly on the seat's office row, no separate office/chamber/LOCAL_EXEC district). The
Mayor/Mayor-Pro-Tem-as-title-on-seat SQL shape itself is best sourced from Bellflower (156-02) /
West Covina (152-02), because Palm Springs needs the title set correctly **at INSERT time** (all 5
council members are brand-new politicians in a greenfield city — closer to Bellflower's
create-Santa-Ines-as-Mayor-at-INSERT shape than to West Covina's UPDATE-an-existing-seat shape,
since West Covina/Bellflower's other 4 members already existed in the DB pre-phase, whereas ALL 5
Palm Springs members are net-new here).

## File Classification

| New/Modified File | Repo | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|---|
| `backend/scripts/load-palmsprings-council-boundaries.ts` | EV-Accounts | geofence loader (one-time ETL) | file-I/O (HTTP fetch → PostGIS INSERT) | `backend/scripts/load-riverside-supervisor-boundaries.ts` (read in full, on disk) | exact — same ArcGIS `f=geojson` direct fetch shape (RESEARCH-confirmed for both), same 5-district county/city-council pattern, same defensive `DISTRICT` string-parse pitfall |
| `backend/migrations/13xx_palm_springs_city_council.sql` | EV-Accounts | structural migration (government/chamber/districts/offices) | CRUD (transactional seed) | `backend/migrations/1314_riverside_county_board_of_supervisors.sql` (read in full, on disk) for the government+chamber+district+office+back-fill+post-verification shape, **plus** `.planning/milestones/v17.0-phases/156-bellflower-deep-seed/156-02-PLAN.md` (Task 2, Santa Ines create+seat-as-Mayor-at-INSERT) for the Mayor/Mayor-Pro-Tem-as-title-set-at-creation-time pattern | exact — government type changes County→City, chamber Board of Supervisors→City Council, title convention "Supervisor, District N"→"Councilmember"/"Mayor"/"Mayor Pro Tem", all 5 politicians created fresh (greenfield) |
| `backend/migrations/13xx_palm_springs_headshots.sql` | EV-Accounts | audit-only migration (politician_images seed) | CRUD (batch INSERT, idempotent) | `backend/migrations/1315_riverside_county_headshots.sql` (read in full, on disk) | exact — identical column shape `(id, politician_id, url, type, photo_license)`, same `WHERE NOT EXISTS` idempotency, same audit-only/unregistered convention |
| `backend/scripts/_tmp-palmsprings-headshots.py` | EV-Accounts | headshot ETL pipeline (gitignored, orchestrator-run) | file-I/O (download → crop/resize → Storage upload) | `backend/scripts/_tmp-riverside-supervisors-headshots.py` (read in full, on disk) | exact — reuse `crop_to_4_5()`/`resize_600x750()`/`to_rgb_white_background()`/`upload_to_storage()`/`resolve_politician_id()`/`head_check()` verbatim; only `ROSTER` + `source_url_for()` change |
| `backend/migrations/13xx..13xx_palm_springs_councilmember_N_stances.sql` (5 files) | EV-Accounts | audit-only migration (compass stances) | CRUD (evidence-only INSERT, one politician at a time) | `backend/migrations/1316_riverside_supervisor_1_stances.sql` (read in part, on disk) | exact — same two-table INSERT shape (`inform.politician_answers` + `inform.politician_context`), same evidence-only/honest-blank header-comment discipline, same non-judicial 36/36-topic scope (City Council is not a judicial office) |
| `src/lib/coverage.js` | essentials (this repo) | config/data (COVERAGE_STATES→California→areas[] surfacing) | CRUD (static array append) | itself — existing California `areas[]` array (this repo, lines 10-40+), specifically the alphabetical gap between `Norwalk` (line 30) and `Palmdale` (line 31) | exact — same file, append one entry, alphabetical insert point already identified |
| `src/lib/buildingImages.js` | essentials (this repo) | config/data (CURATED_LOCAL banner keying) | N/A — **no change** | itself — the existing `'palm springs'` key, already live at line 436 | exact — **NO-OP**, banner already shipped in Phase 201; confirmed present this session, verbatim: `'palm springs': { state: 'CA', src: '.../cities/palm-springs.jpg' }` |
| Palm Springs banner asset | essentials (this repo) | asset processing (banner image) | N/A — **no change** | `scripts/banners/process_banner.py` + `upload_banner.py` | N/A — **skip entirely**, `cities/palm-springs.jpg` already uploaded and live (Ph201) |

## Pattern Assignments

### `backend/scripts/load-palmsprings-council-boundaries.ts` (geofence loader)

**Analog:** `C:/EV-Accounts/backend/scripts/load-riverside-supervisor-boundaries.ts` (258 lines, read
in full). Copy this file's entire structure verbatim — it is a stronger match than Pima's
ArcGIS-rings loader because RESEARCH confirmed the Palm Springs FeatureServer also returns GeoJSON
directly (no rings conversion needed).

**Config block to copy (lines 46-61), replace values:**
```typescript
// CRITICAL: outSR=4326 required — confirm the source SRID; RESEARCH's confirmed query already
// specifies outSR=4326 explicitly.
// CRITICAL: f=geojson (NOT f=json) — Palm Springs' Palm_Springs_Voting_Districts_2022_(View)
// FeatureServer/0 endpoint returns a GeoJSON FeatureCollection directly (RESEARCH-confirmed
// this session, 5 valid Polygon features, DISTRICT attribute "1".."5" as STRING).
const PALMSPRINGS_COUNCIL_URL =
  'https://services.arcgis.com/f48yV21HSEYeCYMI/arcgis/rest/services/' +
  'Palm_Springs_Voting_Districts_2022_%28View%29/FeatureServer/0/query' +
  '?where=1%3D1&outFields=*&returnGeometry=true&f=geojson&outSR=4326';
// NOTE the URL-encoded parentheses (%28View%29) — required, literal (View) is part of the
// service's REST path segment (RESEARCH Pattern 2).

const MTFCC          = 'X0022';   // next unused X-code after X0021/Riverside — DB-verify unused at execute time
const STATE_CODE     = 'ca';      // CRITICAL: lowercase — required for LOCAL-tier routing
const SOURCE         = 'services.arcgis.com-palm-springs-voting-districts-2022-featureserver0-2026';
const GEO_ID_PREFIX  = 'palm-springs-ca-council-district-';
const EXPECTED_COUNT = 5;
```

**Fetch + district-number extraction — copy lines 79-160 verbatim.** The `DISTRICT` field is
confirmed a STRING (`"1".."5"`) by RESEARCH (Pitfall 2) — keep the same defensive
`parseInt(String(rawDist ?? ''), 10)` + range-reject (1-5) pattern (lines 133-141) even though the
field name itself is already confirmed (no fallback-chain guesswork needed here, unlike Riverside's
unconfirmed attribute name) — still reject any out-of-range value before forming `geo_id`, same
discipline. The confirmed FeatureServer also has a `CouncilName` attribute (RESEARCH) — worth
logging (not required for the geo_id, but a free cross-check against the roster):
```typescript
const rawDist = props['DISTRICT'];   // confirmed field name, string "1".."5"
const dist = parseInt(String(rawDist ?? ''), 10);
if (isNaN(dist) || dist < 1 || dist > EXPECTED_COUNT) {
  console.warn(`  WARNING: district value '${String(rawDist)}' out of range 1-${EXPECTED_COUNT} — skipping.`);
  continue;
}
const councilName = props['CouncilName'];  // cross-check log only, not used to form geo_id
if (councilName) console.log(`  District ${dist} CouncilName (cross-check): ${councilName}`);
```

**INSERT statement — copy lines 182-191 verbatim** (`ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($3),
4326))` form + `ON CONFLICT (geo_id, mtfcc) DO NOTHING` + `ST_IsValid` return). Keep the
`ST_MakeValid` repair fallback (lines 199-226) verbatim; a hard `EXPECTED_COUNT` shortfall must
abort with `process.exit(1)` exactly like Riverside (lines 161-167), never silently load a partial
set. Copy the per-district summary query (lines 229-242) and final verify-with hint (line 252),
swapping `X0021`→`X0022` and the Riverside centroid sanity range for Palm Springs' (~-116.5°
lon, ~33.8° lat).

---

### `backend/migrations/13xx_palm_springs_city_council.sql` (structural)

**Primary analog:** `C:/EV-Accounts/backend/migrations/1314_riverside_county_board_of_supervisors.sql`
(477 lines, read in full, on disk) for the overall shape: government + chamber + pre-flight
geofence assertion + 5 LOCAL district rows + 5×(politician+office) blocks + back-fill + post-
verification DO block + ledger registration. **Verify the actual next migration number at execute
time** — disk MAX as of this mapping is 1327 (`1327_utahco_candidate_office_rows_delete.sql`,
confirmed via `ls` this session); the Palm Springs structural migration should be numbered one past
whatever the disk MAX is when the plan executes.

**Secondary analog for Mayor/Mayor-Pro-Tem-at-INSERT:** `.planning/milestones/v17.0-phases/
156-bellflower-deep-seed/156-02-PLAN.md` Task 2 (Santa Ines create+seat, title='Mayor' set directly
in the office INSERT's SELECT list, not a later UPDATE — since Santa Ines was a brand-new
politician/office in that wave, same situation as ALL FIVE Palm Springs members here).

**Government + chamber INSERT — copy Riverside's shape verbatim (lines 69-96), substitute names/type:**
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'City of Palm Springs, California, US',
       'City', 'CA', 'Palm Springs', '0655254'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'City of Palm Springs, California, US'
);

INSERT INTO essentials.chambers (id, name, name_formal, government_id, official_count)
SELECT gen_random_uuid(),
       'City Council',
       'Palm Springs City Council',
       (SELECT id FROM essentials.governments WHERE name = 'City of Palm Springs, California, US'),
       5
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'City Council'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'City of Palm Springs, California, US')
);
```
`official_count = 5` (the rotational Mayor is one of the 5 by-district seats — NOT a 6th excluded
seat, unlike Lancaster/Pomona/El Monte's directly-elected LOCAL_EXEC mayor model; RESEARCH Pattern 1).

**Pre-flight geofence assertion — copy Riverside's shape verbatim (lines 106-112), substitute mtfcc/count:**
```sql
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.geofence_boundaries
      WHERE state = 'ca' AND mtfcc = 'X0022') < 5 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: fewer than 5 X0022 geofences found — run load-palmsprings-council-boundaries.ts before applying this migration.';
  END IF;
END $$;
```

**5x LOCAL district INSERT — copy the per-district block shape verbatim (Riverside lines 114-157,
repeat 5x), substitute geo_id prefix/mtfcc:**
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'ca', 'palm-springs-ca-council-district-1',
       'Palm Springs City Council District 1', 'X0022'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = 'palm-springs-ca-council-district-1' AND district_type = 'LOCAL' AND state = 'ca'
);
-- repeat for districts 2-5
```
CRITICAL casing (confirmed again from Riverside/Pima): `districts.state = 'ca'` LOWERCASE (LOCAL-tier
routing join key); `governments.state = 'CA'` and `offices.representing_state = 'CA'` stay UPPERCASE
(free-text label convention only).

**Politician + office blocks — copy Riverside's `WITH ins_p AS (...) INSERT INTO offices` shape
verbatim (lines 172-335, 5 blocks), but set `title` DIRECTLY per the Bellflower Mayor-at-INSERT
model, NOT `'Supervisor, District N'`:**
```sql
-- BLOCK 4: Council District 4 Naomi Soto (Mayor) — set Mayor at INSERT, Bellflower 156-02 Task-2 model
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Naomi Soto', 'Naomi', 'Soto', '<party — verify at execute>',
          true, false, false, true, -401Nxxx)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'City Council'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'City of Palm Springs, California, US')),
       p.id,
       'Mayor', 'CA', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = 'palm-springs-ca-council-district-4'
  AND d.district_type = 'LOCAL'
  AND d.state = 'ca'
  AND d.mtfcc = 'X0022'
  AND p.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id);
```
Repeat the identical block shape for the other 4:
- D1 Grace Elena Garner → `title = 'Councilmember'`
- D2 Jeffrey Bernstein → `title = 'Councilmember'`
- D3 Ron deHarte → `title = 'Councilmember'`
- D4 Naomi Soto → `title = 'Mayor'` (as shown above)
- D5 David H. Ready → `title = 'Mayor Pro Tem'`

`ext_id` range: assign the next free `-401Nxxx` block collision-safe (Riverside used
`-4010001..-4010005`; Palm Springs should use the next unused block — DB-verify unclaimed at
execute time, do not hardcode blindly per RESEARCH Assumption A2/Pitfall 4).

**office_id back-fill — copy Riverside's shape verbatim (lines 342-347), adjust the `external_id
BETWEEN` range to the actual assigned block.**

**Post-verification DO block — copy Riverside's Step 6 shape verbatim (lines 359-465), with these
substitutions:**
- Gate (a): 1 government row named `'City of Palm Springs, California, US'`.
- Gate (b)/(c): 5 offices on LOCAL X0022 districts, each district holds exactly 1 office.
- Gate (d): appointed count = 0 (confirm at execute time; no appointee flagged in CONTEXT.md recon).
- Gate (e): section-split — 0 offices reachable under any non-Palm-Springs government.
- **Gate (f) replaces Riverside's single-Chair-annotation check with an exactly-one-Mayor +
  exactly-one-Mayor-Pro-Tem assert** (adapt Bellflower/West-Covina's `title='Mayor'` COUNT=1 pattern,
  Task 2 SQL shape in `156-02-PLAN.md`):
```sql
-- Gate (f): exactly 1 Mayor and exactly 1 Mayor Pro Tem, on the confirmed D4/D5 seats
SELECT COUNT(*) INTO v_mayor_count
FROM essentials.offices o JOIN essentials.districts d ON d.id = o.district_id
WHERE d.geo_id LIKE 'palm-springs-ca-council-district-%' AND d.mtfcc = 'X0022' AND o.title = 'Mayor';
IF v_mayor_count <> 1 THEN
  RAISE EXCEPTION 'Post-verification FAILED: expected exactly 1 Mayor, found %', v_mayor_count;
END IF;

SELECT COUNT(*) INTO v_mpt_count
FROM essentials.offices o JOIN essentials.districts d ON d.id = o.district_id
WHERE d.geo_id LIKE 'palm-springs-ca-council-district-%' AND d.mtfcc = 'X0022' AND o.title = 'Mayor Pro Tem';
IF v_mpt_count <> 1 THEN
  RAISE EXCEPTION 'Post-verification FAILED: expected exactly 1 Mayor Pro Tem, found %', v_mpt_count;
END IF;
```
Re-verify the current Mayor/Mayor-Pro-Tem at execute time (CONTEXT.md D-note: Soto D4=Mayor,
Ready D5=Mayor Pro Tem as of Dec 2025 — but re-check palmspringsca.gov before writing, per every
prior rotational-mayor phase's discipline; RESEARCH Pitfall 3 — do NOT model a directly-elected
LOCAL_EXEC Mayor even though a petition is active, no measure adopted as of 2026-07-12).

**Ledger registration — copy Riverside's shape verbatim (lines 474-476), substitute version/name:**
```sql
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('<next-disk-max>', 'palm_springs_city_council')
ON CONFLICT (version) DO NOTHING;
```

---

### `backend/scripts/_tmp-palmsprings-headshots.py` (headshot pipeline)

**Analog:** `C:/EV-Accounts/backend/scripts/_tmp-riverside-supervisors-headshots.py` (417 lines, read
in full, on disk). Reuse verbatim: `to_rgb_white_background()` (lines 214-231 — mandatory RGBA→
white-composite fix, never a naive `convert('RGB')`), `crop_to_4_5()` (lines 234-254, crop-first,
never stretch), `resize_600x750()` (lines 257-261, Lanczos), `upload_to_storage()` (lines 264-278,
`x-upsert: true` PUT to `politician_photos/{uuid}-headshot.jpg`), `resolve_politician_id()` (lines
180-190, parameterized `external_id = %s`), `head_check()` (lines 193-200, dry-run every roster URL
first), the env-load block (lines 138-151), and the descriptive `HEADERS` User-Agent (lines 161-164).

**What changes:** the `ROSTER` list (5 entries mirroring lines 94-122's shape, `external_id` matching
the block assigned in the structural migration, `politician_id` captured from that migration's
actual `gen_random_uuid()` output), the guard assertions (`assert len(ROSTER) == 5`, external_id
uniqueness/range checks per lines 130-132), and `source_url_for()` — per CONTEXT.md/RESEARCH,
`palmspringsca.gov` returns WAF-403 to bots, so headshots must come from Ballotpedia, Wikimedia,
thepalmspringspost.com, or individual campaign sites (naomisoto.com, rondeharte.com) — test each
individually for reachability before committing a source, same discipline as Riverside's
per-member-hardcoded-URL approach:
```python
def source_url_for(member: dict) -> str:
    """No single CMS pattern — palmspringsca.gov is WAF-403; the 5 URLs must be
    hardcoded per member after individual reachability probes (campaign sites /
    Ballotpedia / Wikimedia / thepalmspringspost.com), same discipline as
    Riverside's per-district-site hardcoded photo_url approach."""
    return member['photo_url']
```
`photo_license` should be `'us_government_work'` only if the final source IS a .gov page (unlikely
here, per RESEARCH Assumption A4 — Ballotpedia coverage of Palm Springs is thin); expect `'press_use'`
(Ballotpedia/press) or a correct Wikimedia Commons license string for most/all of the 5 — do NOT
default to `us_government_work` for a non-.gov source, same rule Riverside's Chuck Washington row
demonstrates (`'press_use'` for the one Ballotpedia-sourced photo among 4 `.gov`-sourced ones).

**Orchestration note to preserve verbatim:** this script is gitignored (`backend/scripts/_*`), never
committed; the executor only WRITES it to disk, the ORCHESTRATOR runs it (PIL/requests/psycopg2 +
Storage access live only in the orchestrator shell) and then applies the audit migration authored
from the emitted manifest.

---

### `backend/migrations/13xx_palm_springs_headshots.sql` (audit-only, unregistered)

**Analog:** `C:/EV-Accounts/backend/migrations/1315_riverside_county_headshots.sql` (91 lines, read
in full, on disk). Copy the per-row shape verbatim, 5 rows:
```sql
-- Naomi Soto (District 4, Mayor, external_id=-401Nxxx)
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -401Nxxx),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg',
       'default', '<license — matches actual source>'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -401Nxxx)
);
```
Columns are exactly `(id, politician_id, url, type, photo_license)`. Header comment block should
state clearly this is AUDIT-ONLY, NOT registered in the migration ledger, applied via `psql -f`
AFTER the Python pipeline uploads to Storage. `type` MUST be `'default'` (UI filters on it, per
`project_schema_key_tables` memory note). politician UUIDs are captured from the structural
migration's actual output (recorded in the corresponding SUMMARY's "Politician UUID Manifest") —
NOT invented ahead of time.

---

### `backend/migrations/13xx..13xx_palm_springs_councilmember_N_stances.sql` (audit-only, one per councilmember)

**Analog:** `C:/EV-Accounts/backend/migrations/1316_riverside_supervisor_1_stances.sql` (read in
part, on disk — header comment block + first 2 topic INSERT pairs). Copy the file-header shape
verbatim: politician identity/context comment block (name, ext_id, politician_id, party-not-
displayed note, district description), evidence-only/honest-blank discipline statement, `BEGIN;`/
`COMMIT;` wrapper, and the two-table INSERT pattern per topic:
```sql
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
VALUES ('<councilmember-uuid>', '<topic-uuid>', <1.0-5.0>)
ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
VALUES ('<councilmember-uuid>', '<topic-uuid>',
        $$<evidence-based reasoning, cited>$$,
        ARRAY['<source-url-1>', '<source-url-2>', ...]::text[])
ON CONFLICT (politician_id, topic_id) DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;
```
**Mandatory conventions (memory-enforced, non-negotiable):**
- ONE research agent at a time — parallel stance research burns quota
  (`feedback_stance_research_one_at_a_time`).
- ALL live compass topics researched per councilmember, evidence-only, all 36 non-judicial topics
  (City Council is not a judicial office — same 36/36 scope as Riverside's Board of Supervisors).
- Topics with zero evidence are OMITTED ENTIRELY — no row at all, never a neutral/default value
  (`feedback_stance_no_default_value`).
- One file per councilmember (5 files).
- Stance migrations apply audit-only — NOT registered in `supabase_migrations.schema_migrations`.
- Per RESEARCH Open Question 3: the active directly-elected-mayor petition/debate is background
  context only — do not force it into an unrelated compass topic; skip unless a genuine topic match
  exists in the live ~36-topic set.

---

### `src/lib/coverage.js` (COVERAGE_STATES → California → areas[] entry)

**Analog:** the existing California `areas[]` array itself (this repo, lines 10-40+), specifically
the exact alphabetical gap between `Norwalk` (line 30) and `Palmdale` (line 31).

**Current array section (lines 30-31), exact insertion point:**
```javascript
{ label: 'Norwalk', browseGovernmentList: ['0652526'], browseStateAbbrev: 'CA', hasContext: true },
{ label: 'Palmdale', browseGovernmentList: ['0655156'], browseStateAbbrev: 'CA', hasContext: true },
```

**Exact pattern to insert (alphabetically between the two above):**
```javascript
{ label: 'Palm Springs', browseGovernmentList: ['0655254'], browseStateAbbrev: 'CA', hasContext: true },
```
`hasContext: true` should only be set once ≥1 stance row actually exists in
`inform.politician_answers` — if the coverage wave runs before the stance wave, stage this as
`hasContext: false` first (established Riverside/Pima/WashCo precedent: flip on once stances are
live, not before).

---

### `src/lib/buildingImages.js` (CURATED_LOCAL — NO CHANGE)

**Confirmed this session (lines 435-436):**
```javascript
//   palm springs  - Palm Springs Palm Canyon Dr | R. Haupt (Renhau) | CC BY-SA 3.0
'palm springs': { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/palm-springs.jpg' },
```
This key is already live (shipped Phase 201 as a banner-only add). **Do not touch this file this
phase.** `getBuildingImages()` needs no code change; the key already resolves via the address-search
`representingCity` path once Palm Springs offices exist (RESEARCH Architecture Diagram).

## Shared Patterns

### Casing convention (applies to loader + structural migration)
**Source:** every prior county/city phase (Riverside 201, Pima 193, WashCo 175, LA County),
reconfirmed live.
```
essentials.districts.state       = 'ca'  (lowercase) — LOCAL/COUNTY/STATE_UPPER/STATE_LOWER routing key
essentials.governments.state     = 'CA'  (uppercase) — free-text label
essentials.offices.representing_state = 'CA'  (uppercase) — free-text label
```
Apply to: `load-palmsprings-council-boundaries.ts`, the structural migration.

### Idempotency convention (applies to all migrations)
**Source:** `1314_riverside_county_board_of_supervisors.sql` / `1315_riverside_county_headshots.sql` /
`1316-1320_riverside_supervisor_N_stances.sql`.
```sql
-- governments/chambers/districts: WHERE NOT EXISTS guard (no unique constraint on name/geo_id)
-- politicians: ON CONFLICT (external_id) DO NOTHING
-- offices: WHERE NOT EXISTS (district_id, politician_id)
-- politician_images: WHERE NOT EXISTS (politician_id)
-- politician_answers/context: ON CONFLICT (politician_id, topic_id) DO UPDATE
```
Apply to: the structural migration, headshots migration, 5 stance migrations.

### Rotational Mayor / Mayor Pro Tem as title-on-seat (RESEARCH Pattern 1; Bellflower 156 / West Covina 152)
Set directly at office-INSERT time (Bellflower Santa Ines model, since ALL FIVE Palm Springs members
are net-new here, unlike Bellflower/West-Covina's 4-pre-existing+1-new or 5-pre-existing situations).
`title='Mayor'` on Soto's D4 office; `title='Mayor Pro Tem'` on Ready's D5 office; `title=
'Councilmember'` on the other 3. NO separate LOCAL_EXEC district, NO separate Mayor office/chamber.
`official_count=5` (the Mayor is one of the 5 seats, not excluded). Exactly-one-Mayor +
exactly-one-Mayor-Pro-Tem asserts inside the post-verification DO block (adapted from Riverside's
single-Chair-count gate (f) pattern, generalized to two roles).

### Orchestrator-run vs. executor-authored split
**Source:** every prior county/city phase (Riverside 201, Pima 193, Tucson 194, Oro Valley 195).
`gsd-executor` has NO Supabase MCP/Storage access. The executor:
- writes `load-palmsprings-council-boundaries.ts`, the structural migration, the headshot Python
  pipeline, the headshots migration, and the 5 stance migrations to disk
- does NOT run `npx tsx`, does NOT `psql -f` apply, does NOT run the Python pipeline, does NOT touch Storage
The orchestrator runs the loader, applies migrations via `psql -f` against
`C:/EV-Accounts/backend/.env` `DATABASE_URL`, runs the headshot pipeline, and captures UUIDs into
the audit migrations.

### Section-split / district-collision guard
**Source:** Riverside's Gate (e) (`1314`, lines 419-433); Pima's Pitfall 2 (`04019` 3-way collision)
is the standing caution class. No known Palm Springs-specific collision was found in this pass
(`0655254` is the pre-existing TIGER city geo_id, not touched by this migration's district rows),
but re-run the same defensive discipline anyway: never join or filter on a bare
`geo_id = '0655254'`; always scope with `AND district_type = 'LOCAL' AND mtfcc = 'X0022'` for the 5
new council districts, and never let the structural migration touch the pre-existing city geo_id
row.

## No Analog Found

None. Every planned file for this phase has an exact analog on disk from Phase 201 (Riverside), with
the Mayor/Mayor-Pro-Tem title-on-seat mechanic supplemented from Bellflower/West Covina. The
`buildingImages.js` banner file requires literally zero change (already shipped Ph201).

## Metadata

**Analog search scope:** `.planning/phases/201-riverside-county-board-of-supervisors-deep-seed/`
(201-PATTERNS.md read in full; 201-06-PLAN.md read in full for the audit-wave shape),
`.planning/milestones/v17.0-phases/156-bellflower-deep-seed/156-02-PLAN.md` and `152-west-covina-
deep-seed/152-02-PLAN.md` (both read in full, for the Mayor/Mayor-Pro-Tem title-on-seat precedent),
`C:/EV-Accounts/backend/scripts/load-riverside-supervisor-boundaries.ts` (258 lines, read in full),
`C:/EV-Accounts/backend/scripts/_tmp-riverside-supervisors-headshots.py` (417 lines, read in full),
`C:/EV-Accounts/backend/migrations/1314_riverside_county_board_of_supervisors.sql` (477 lines, read
in full), `1315_riverside_county_headshots.sql` (91 lines, read in full), `1316_riverside_
supervisor_1_stances.sql` (read in part, header + first 2 topics), `C:/EV-Accounts/backend/
migrations/` (directory listing, tail 15, to establish disk-MAX migration number = 1327) and a
targeted `grep` for the highest X-code in use (X0021), `C:/Transparent Motivations/essentials/src/
lib/coverage.js` and `buildingImages.js` (targeted reads confirming the California `areas[]`
insertion point and the already-live `'palm springs'` CURATED_LOCAL key).
**Files scanned:** 11 (201-PATTERNS.md, 201-06-PLAN.md, 156-02-PLAN.md, 152-02-PLAN.md full reads;
load-riverside-supervisor-boundaries.ts, _tmp-riverside-supervisors-headshots.py, 1314/1315
migrations full reads; 1316 migration partial read; migrations-directory listing + X-code grep;
coverage.js and buildingImages.js targeted reads).
**Pattern extraction date:** 2026-07-12
