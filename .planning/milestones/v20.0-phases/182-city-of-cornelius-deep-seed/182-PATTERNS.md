# Phase 182: City of Cornelius Deep-Seed - Pattern Map

**Mapped:** 2026-07-03
**Files analyzed:** 6 (structural migration, headshot migration, headshot script, N stance migrations, coverage.js edit, buildingImages.js edit) — plus 2 banner pipeline scripts invoked as-is
**Analogs found:** 6 / 6

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `C:/EV-Accounts/backend/migrations/1196_cornelius_city_council.sql` (structural) | migration | CRUD (idempotent seed) | `1187_sherwood_city_council.sql` | exact (same milestone shape; +appointed-seat +vacant-seat deltas) |
| `C:/EV-Accounts/backend/migrations/1197_cornelius_headshots.sql` (audit-only) | migration | CRUD (idempotent seed) | `1188_sherwood_headshots.sql` | exact |
| `C:/EV-Accounts/backend/scripts/_tmp-cornelius-headshots.py` (gitignored) | utility (file-I/O + event pipeline) | file-I/O / batch | `_tmp-sherwood-headshots.py` | exact (simpler — no crop-judgment step, but RGBA composite retained) |
| `C:/EV-Accounts/backend/migrations/1198…120x_<lastname>_stances.sql` (per official, audit-only) | migration | CRUD (idempotent seed) | `1189_rosener_stances.sql` | exact (four-gate DO block template) |
| `src/lib/coverage.js` (Oregon block edit) | config/route-table | request-response (SSR surfacing) | existing Oregon block entries (Sherwood/Forest Grove/Tigard/Tualatin/Beaverton lines 98–109) | exact |
| `src/lib/buildingImages.js` (CURATED_LOCAL edit) | config | request-response (banner asset lookup) | `sherwood: { state: 'OR', src: ... }` entry (post-WR-03 format), lines 121–129 | exact |
| Banner processing invocation (no new file — script reuse) | utility (file-I/O) | batch/transform | `scripts/banners/process_banner.py` + `upload_banner.py` (used as-is per `docs/banner-asset-pipeline.md`) | exact (proven, no changes needed) |

No custom `X00xx` ward geofence file is anticipated — Charter §7 confirms pure at-large (see RESEARCH.md "Form of Government — RESOLVED"). If Wave-0 re-verification somehow reverses this, the analog would be `WashCo commissioner districts X0018` loader (Phase 175) — flagged here only as a contingency, not expected to be used.

---

## Pattern Assignments

### `1196_cornelius_city_council.sql` (migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1187_sherwood_city_council.sql` (440 lines, read in full)

**Header/pre-flight pattern** (lines 46–55):
```sql
BEGIN;

-- Pre-flight hard-abort guard.
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name = 'City of Sherwood, Oregon, US') > 0 THEN
    RAISE EXCEPTION 'Migration 1187 already applied — aborting re-run';
  END IF;
END $$;
```
Adapt literal to `'City of Cornelius, Oregon, US'`.

**Government + chamber pattern** (lines 57–79):
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(), 'City of Sherwood, Oregon, US', 'LOCAL', 'OR', 'Sherwood', '4167100'
WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE name = 'City of Sherwood, Oregon, US');

-- Chamber row. NOTE: chambers has a GENERATED ALWAYS column — never insert it.
INSERT INTO essentials.chambers (id, name, name_formal, government_id, official_count)
SELECT gen_random_uuid(), 'City Council', 'Sherwood City Council',
       (SELECT id FROM essentials.governments WHERE name = 'City of Sherwood, Oregon, US'), 7
WHERE NOT EXISTS (...);
```
Cornelius: `geo_id='4115550'` (CORRECTED — never `4115350`), `name_formal='Cornelius City Council'`, `official_count=5` if the vacant seat is seeded per the TX-23 precedent (recommended in RESEARCH.md), or `4` if omitted — planner decision.

**District split pattern** (lines 81–99) — LOCAL_EXEC (Mayor) + shared LOCAL (Councilors), both `state='or'` lowercase, same geo_id, `mtfcc=NULL`. Copy verbatim, swap geo_id/labels. Cornelius's Mayor is also a 2-year term (matches Sherwood's label style: `'Sherwood (Mayor, Citywide, 2-Year Term)'` → `'Cornelius (Mayor, Citywide, 2-Year Term)'`).

**D-16 CTE-hoist adaptation (IN-01, mandatory delta from the Sherwood template):** Sherwood's per-office INSERT repeats this subquery inline in every block (see lines 120–123, 156–159, 189–192, 222–225, 258–261, 291–294, 324–327 — 7 duplicate copies of the identical chamber lookup):
```sql
(SELECT id FROM essentials.chambers
 WHERE name = 'City Council'
   AND government_id = (SELECT id FROM essentials.governments
                        WHERE name = 'City of Sherwood, Oregon, US'))
```
Per D-16/182-CONTEXT, Cornelius's clone must hoist this into a single CTE referenced by every office INSERT, e.g.:
```sql
WITH chamber AS (
  SELECT id FROM essentials.chambers
  WHERE name = 'City Council'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'City of Cornelius, Oregon, US')
)
```
then each office INSERT's `chamber_id` column references `(SELECT id FROM chamber)` instead of repeating the nested subquery. Keep every other structural element (pairwise identity gate, four-gate patterns) intact.

**Elected-seat officer block (Mayor Dalin, Council President Godinez Valencia)** — copy the Rosener/Young WITH-block shape verbatim (lines 101–170), `is_appointed=false, is_appointed_position=false`.

**Appointed-seat officer block (Baker, López) — use Tigard 1159, NOT Sherwood:**
**Analog:** `C:/EV-Accounts/backend/migrations/1159_tigard_city_council.sql`, lines 101–134 (Mayor Hu) and 136–168 (Councilor Anderson):
```sql
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Yi-Kang Hu', 'Yi-Kang', 'Hu', NULL,
          true, true, false, true, -4173651)
  ON CONFLICT (external_id) DO UPDATE SET is_active = EXCLUDED.is_active
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   representing_city, is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(), d.id, (SELECT id FROM essentials.chambers ...), p.id,
       'Mayor', 'OR', 'Tigard', true, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '4173650' AND d.district_type = 'LOCAL_EXEC' AND d.state = 'or'
  AND NOT EXISTS (...);
```
Apply this exact shape to Baker (-4115553) and López (-4115554): `is_appointed=true` on the politicians row, `is_appointed_position=true` on the offices row. **López requires UTF-8 accented-character handling** — see the accented-name precedent below.

**Vacant-seat office row (5th seat, if seeded per RESEARCH.md's option (a) recommendation):**
**Analog:** `C:/EV-Accounts/backend/migrations/105_tx_congressional_house_officials.sql`, TX-23 block, lines 458–469:
```sql
-- TX-23: VACANT — office row only, no politician
-- (Seat vacant as of April 14, 2026; external_id -100323 intentionally unused)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state, is_appointed_position, is_vacant)
SELECT gen_random_uuid(), d.id, 'c2facc31-7b13-428c-b7b9-32d0d3b95f76'::uuid, NULL,
       'Representative', 'TX', false, true
FROM essentials.districts d
WHERE d.geo_id = '4823' AND d.district_type = 'NATIONAL_LOWER'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.chamber_id = 'c2facc31-7b13-428c-b7b9-32d0d3b95f76'::uuid
  );
```
Adapt: `politician_id=NULL`, `title='Councilor'`, `representing_state='OR'`, `representing_city='Cornelius'` (add this column — TX-23 predates the D-11 convention), `district_id` from the Cornelius LOCAL district (shared with the 3 filled councilor seats), `is_appointed_position=false`, `is_vacant=true`. External_id -4115555 stays intentionally unused (mirrors TX-23's unused -100323), matching this file's own comment convention. Add `vacant_since` if the exact departure date is later located (nullable — leave NULL if unknown, per RESEARCH.md A5).

**Accented-name (UTF-8) precedent for Edén López:**
**Analog:** `C:/EV-Accounts/backend/migrations/076_pasadena_races_and_candidates.sql`, line 53:
```sql
VALUES (v_race_d3, 'Erica Margarita Múnoz', 'Erica', 'Múnoz', 'Housing Navigator, Union Station Homeless Services', false, 'clerk_official');
```
Confirms accented characters (á/é/í/ó/ú/ñ) insert cleanly into the schema when the `.sql` file itself is saved UTF-8 without a BOM. Apply the same convention to `'Edén López'` / `'Edén'` / `'López'`.

**office_id back-fill pattern** (lines 340–348) — copy verbatim, adapt the `external_id IN (...)` list to Cornelius's 4 or 5 external_ids.

**Post-verification DO block (pairwise identity gate, D-15 WR-B form)** (lines 350–433) — copy the full structure: gov_count=1 check, office_count check (4 or 5), independent geofence-presence assertion **with the added name-match check per this phase's Pitfall 1** (Cornelius must additionally assert `name = 'Cornelius city'`, not just that a G4110 row exists for the geo_id — Sherwood's version only checked existence because its correction was an absent-value case, not a wrong-city collision), canonical section-split query, office_id null-count check, representing_city count check, and the pairwise `(external_id, full_name)` identity gate (lines 421–430):
```sql
SELECT COUNT(*) INTO v_pair_count
FROM essentials.politicians
WHERE (external_id, full_name) IN (
  (-4167101, 'Tim Rosener'), (-4167102, 'Kim Young'), ...
);
IF v_pair_count <> 7 THEN
  RAISE EXCEPTION 'Post-verification FAILED: pairwise identity gate — expected 7 exact (external_id, full_name) matches, found %', v_pair_count;
END IF;
```

**Ledger registration** (lines 435–440) — structural migrations register; copy verbatim with version `'1196'`.

---

### `1197_cornelius_headshots.sql` (migration, audit-only, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1188_sherwood_headshots.sql` (125 lines, read in full)

**Header note pattern** (lines 1–24) — same "AUDIT-ONLY: does NOT write a ledger row" framing plus the orchestrator note about pre-filled UUIDs from the structural migration and the delete-if-not-SUCCESS instruction. Adapt: Cornelius has 4 filled seats (not 7) — expect a clean 4/4, no fallback chain (per RESEARCH.md "best sourcing outcome in the milestone").

**Per-official INSERT pattern** (lines 28–37, repeat ×4):
```sql
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -4167101),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/bdde1b46-d4ff-4409-b215-ee9d4f41be06-headshot.jpg',
       'default', 'press_use'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -4167101)
);
```
`photo_license='press_use'` for all 4 (city-site studio portraits). No `photo_origin_url` column — do not include it.

**Post-verification gate (url-embeds-uuid)** (lines 107–123) — copy verbatim, adapt expected count to `4`:
```sql
DO $$
DECLARE n INTEGER;
BEGIN
  SELECT COUNT(*) INTO n
  FROM essentials.politician_images pi
  JOIN essentials.politicians p ON p.id = pi.politician_id
  WHERE p.external_id BETWEEN -4167107 AND -4167101
    AND pi.url LIKE '%' || pi.politician_id::text || '%';
  IF n <> 7 THEN
    RAISE EXCEPTION 'Expected 7 ... found %', n;
  END IF;
END $$;
```

---

### `_tmp-cornelius-headshots.py` (utility, file-I/O + batch)

**Analog:** `C:/EV-Accounts/backend/scripts/_tmp-sherwood-headshots.py` (490 lines, read in full — gitignored, on-disk template carrying WR-01/WR-02/WR-C fixes)

**Header/orchestration-note pattern** (lines 1–67) — copy verbatim structure: gitignored `_tmp-*` disclaimer, "executor WRITES, orchestrator RUNS" note, source confirmation note, photo_license note, bucket/path spec. **Key delta for Cornelius:** unlike Sherwood's square 600×600 JPEG sources, Cornelius's 4 sources are already exactly 1600×2000 (4:5) **RGBA PNGs with a fully transparent background outside a circular mask** — the composite step (already present, guarded as "not expected needed" in Sherwood's docstring at line 40–42) is now the PRIMARY required step, and the crop step is a no-op (ratio already matches).

**RGBA-to-white composite step** (lines 288–299, `process_headshot_bytes`):
```python
img = Image.open(io.BytesIO(raw_bytes))
if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
    rgba = img.convert('RGBA')
    bg = Image.new('RGB', rgba.size, (255, 255, 255))
    bg.paste(rgba, mask=rgba.split()[-1])
    img = bg
elif img.mode != 'RGB':
    img = img.convert('RGB')
```
This is the exact step Cornelius's pipeline actually exercises (Sherwood's sources never triggered this branch since they were plain JPEG). Keep it unmodified — it is already correct for a circular-cutout-on-transparent-canvas source.

**crop_to_4_5 pattern** (lines 230–257) — for Cornelius, `current_ratio` will be `1600/2000 = 0.8` exactly matching `target_ratio = 4.0/5.0 = 0.8`, so the `abs(current_ratio - target_ratio) < 0.001` early-return branch (line 244–245) fires and the function returns the image unmodified — no crop judgment needed, exactly as RESEARCH.md anticipates. Do not remove this early-return guard.

**Roster config block pattern** (lines 84–135) — adapt to Cornelius's 4 filled officials (Dalin, Godinez Valencia, Baker, López), each with `documentID`-based `corneliusor.gov/ImageRepository/Document?documentID=N` URLs (2325, 1977, 2324, 1979 respectively). Do NOT include a 5th entry for the vacant seat — its leftover image (documentID=1975) is confirmed blank; document as a genuine gap in the migration comment, not in this roster list.

**Guard checks pattern** (lines 137–150) — copy verbatim, adapt `!= 7` to `!= 4`.

**WR-01 (hard-fail on any failure)** (lines 479–485) and **WR-02 (prefetched_bytes reuse)** (lines 315–343, 346–357, 434–456) and **D-15 WR-C (`if len(OFFICIALS) > 0:` guard)** (line 435) — copy verbatim; all three fixes are load-bearing and must not regress.

**Config/env-load block, storage upload, resize functions** (lines 152–286, 260–285) — copy verbatim, no changes needed (bucket, target size, JPEG quality, Lanczos resample, descriptive User-Agent header are all milestone-stable constants).

---

### Stance migrations `1198…120x_<lastname>_stances.sql` (migration, per-official, audit-only, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1189_rosener_stances.sql` (87 lines, read in full)

**Header comment pattern** (lines 1–3):
```sql
-- Migration 1189: Tim Rosener (Mayor, Sherwood OR) compass stances — AUDIT-ONLY (not registered in the ledger)
-- Evidence-only; 100% cited; chairs model (value 1-5); 7 cited stances; blank spokes omitted.
-- topic_id resolved LIVE via JOIN on compass_topics.topic_key AND is_live=true (no hardcoded topic UUIDs).
```

**Answers-table VALUES + INSERT pattern** (lines 7–20):
```sql
WITH s(topic_key, val, reasoning, sources) AS (
  VALUES
    ('growth-and-development', 1, '<evidence-cited reasoning>', ARRAY['<url1>','<url2>']::text[]),
    ...
)
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
SELECT '<uuid>'::uuid, ct.id, s.val
FROM s JOIN inform.compass_topics ct ON ct.topic_key = s.topic_key AND ct.is_live = true
ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = EXCLUDED.value;
```

**Context-table INSERT pattern** (lines 22–35) — verbatim duplicate VALUES list (same topic_key/reasoning/sources), inserted into `inform.politician_context` instead of `politician_answers`:
```sql
INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
SELECT '<uuid>'::uuid, ct.id, s.reasoning, s.sources
FROM s JOIN inform.compass_topics ct ON ct.topic_key = s.topic_key AND ct.is_live = true
ON CONFLICT (politician_id, topic_id) DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;
```

**Four-gate post-verification DO block** (lines 37–85) — copy the full structure verbatim, adapting the hardcoded UUID/external_id/expected-count literals per official:
1. **Identity gate (WR-01)** (lines 41–47): asserts the hardcoded UUID's `external_id` matches the intended official — catches a wrong-but-existing UUID.
2. **Answers-count gate** (lines 48–51): `politician_answers` row count matches expected N.
3. **Context-parity gate (WR-03)** (lines 52–58): `politician_context` row count also matches N.
4. **Content-correspondence gate (WR-04, 181-REVIEW)** (lines 59–84): bidirectional set-equality check between `politician_answers` and `politician_context` on `topic_id`, PLUS a non-empty-reasoning/non-empty-sources assertion on every context row — catches a hand-edit that changes one table's topic set without mirroring the other.

**D-15 bilingual-evidence note for the planner:** Cornelius's stance agents should expect and are authorized to cite Spanish-language primary sources (city communications, council minutes, candidate statements) per CONTEXT.md D-15 — the migration's `reasoning` field is always written in English (faithful summary), but the `sources` ARRAY entries should be the original Spanish-language URLs, not a translated/mirrored URL. No structural change to the migration shape is needed for this — it is purely an evidence-sourcing instruction for the stance-research agent, not a schema or template change.

**Model/quota note (D-08):** stance agents run one at a time, `model=sonnet` (proven at 181's quota lesson), and author their own migration files directly — this pattern file does not need to enforce that; it is an orchestration instruction to carry into the plan.

---

### `src/lib/coverage.js` (config, request-response)

**Analog:** existing Oregon block, `src/lib/coverage.js` lines 98–109 (read via targeted grep):
```javascript
{ label: 'Beaverton',    browseGovernmentList: ['4105350'], browseStateAbbrev: 'OR', hasContext: true },
{ label: 'Fairview',     browseGovernmentList: ['4124250'], browseStateAbbrev: 'OR' },
{ label: 'Forest Grove', browseGovernmentList: ['4126200'], browseStateAbbrev: 'OR', hasContext: true },
{ label: 'Gresham',      browseGovernmentList: ['4131250'], browseStateAbbrev: 'OR' },
{ label: 'Hillsboro',    browseGovernmentList: ['4134100'], browseStateAbbrev: 'OR', hasContext: true },
{ label: 'Maywood Park', browseGovernmentList: ['4146730'], browseStateAbbrev: 'OR' },
{ label: 'Portland',     browseGovernmentList: ['4159000'], browseStateAbbrev: 'OR', hasContext: true },
{ label: 'Sherwood',     browseGovernmentList: ['4167100'], browseStateAbbrev: 'OR', hasContext: true },
{ label: 'Tigard',       browseGovernmentList: ['4173650'], browseStateAbbrev: 'OR', hasContext: true },
{ label: 'Troutdale',    browseGovernmentList: ['4174850'], browseStateAbbrev: 'OR' },
{ label: 'Tualatin',     browseGovernmentList: ['4174950'], browseStateAbbrev: 'OR', hasContext: true },
{ label: 'Wood Village', browseGovernmentList: ['4183950'], browseStateAbbrev: 'OR' },
```
The list is alphabetically ordered. Insert Cornelius's entry between `'Beaverton'` and `'Fairview'` alphabetically:
```javascript
{ label: 'Cornelius',    browseGovernmentList: ['4115550'], browseStateAbbrev: 'OR', hasContext: true },
```
(geo_id **must be the CORRECTED `'4115550'`**, never the ROADMAP-stated `'4115350'`.)

---

### `src/lib/buildingImages.js` (config, request-response)

**Analog:** `CURATED_LOCAL` post-WR-03 format, lines 112–129 (attribution comments + entries):
```javascript
//   tualatin - Tualatin Commons daytime | M.O. Stevens (Aboutmovies) | CC BY-SA 3.0
//   forest grove - Christmas Tree Recycling (Pacific Avenue street view, lower band) | Visitor7 | CC BY-SA 3.0
//   sherwood - Railroad St, Sherwood, Oregon | dreid1987 | CC BY 3.0
//
// WR-03 FIX (181-REVIEW): each entry now carries a `state` alongside `src` so
// ...
// across states (e.g. Sherwood, OR vs. Sherwood, AR; Glendale, CA vs.
// Glendale, AZ) from incorrectly rendering the wrong city's banner.
const CURATED_LOCAL = {
  bloomington: { state: 'IN', src: '...' },
  beaverton: { state: 'OR', src: '.../cities/beaverton.jpg' },
  ...
  tualatin: { state: 'OR', src: '.../cities/tualatin.jpg' },
  'forest grove': { state: 'OR', src: '.../cities/forest-grove.jpg' },
  sherwood: { state: 'OR', src: '.../cities/sherwood.jpg' },
  ...
};
```
Add:
```javascript
//   cornelius - Cornelius Civic Center - Oregon.JPG (city hall / public library) | M.O. Stevens | CC BY-SA 3.0
```
and
```javascript
cornelius: { state: 'OR', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/cornelius.jpg' },
```
Single-word lowercase key `cornelius` (no ambiguity risk vs. other-state cities of the same name, but keep the `state: 'OR'` field per the uniform post-WR-03 convention regardless).

**Matching function** (lines 219–223, `getBuildingImages`/city-substring matcher):
```javascript
let localImage = null;
for (const [key, entry] of Object.entries(CURATED_LOCAL)) {
  if (city.includes(key) && (!abbrev || !entry.state || entry.state === abbrev)) {
    localImage = entry.src;
```
No changes needed here — Cornelius's entry participates automatically once added to `CURATED_LOCAL`.

---

### Banner pipeline (script reuse, no new files)

**Analog:** `scripts/banners/process_banner.py` + `scripts/banners/upload_banner.py`, invoked per `docs/banner-asset-pipeline.md` Stage 3–4 (both files read/referenced, not modified):
```bash
python scripts/banners/process_banner.py \
  --url "https://upload.wikimedia.org/wikipedia/commons/.../Cornelius_Civic_Center_-_Oregon.JPG" \
  --output /tmp/cornelius.jpg \
  --vertical-anchor 0.5   # tune if the Civic Center candidate needs vertical framing help

python scripts/banners/upload_banner.py \
  --file /tmp/cornelius.jpg \
  --dest cities/cornelius.jpg
```
Per docs Stage 5, path scheme for standalone cities is `cities/<slug>.jpg` → `cities/cornelius.jpg`. Per Stage 7, add the attribution comment (see buildingImages.js section above). Per Stage 8, verify live at:
```
https://essentials.empowered.vote/results?browse_geo_id=4115550&browse_mtfcc=G4110
```
**Note the aspect-ratio compression risk flagged in RESEARCH.md:** the leading candidate ("Cornelius Civic Center - Oregon.JPG", 1679×1412, ~1.19:1) requires a materially larger crop down to the pipeline's 3.15:1 target than any predecessor banner has needed — expect to iterate on `--vertical-anchor` and preview before uploading; per D-14, the operator should confirm the Wave-0-collected street-level candidates from `Category:Cornelius, Oregon`/`Category:Washington County, Oregon` subcategories first, since a clean license + good crop-fit beats subject preference, but no ideal candidate was found as of RESEARCH.md's writing.

---

## Shared Patterns

### Antipartisan / UTF-8 / lowercase-state conventions (apply to ALL migration files)
**Source:** every Sherwood/Tigard/TX migration file's header comments (e.g. `1187_sherwood_city_council.sql` lines 28–39).
- `politicians.party` is ALWAYS `NULL`.
- `districts.state = 'or'` (lowercase); `governments.state = 'OR'` / `offices.representing_state = 'OR'` (uppercase) — same-named columns, opposite casing conventions, a proven milestone-wide trap.
- `chambers.slug` (GENERATED ALWAYS) — never INSERT.
- `essentials.governments` has NO unique constraint on `geo_id` — always use `WHERE NOT EXISTS`, never `ON CONFLICT`.
- Migration `.sql` files with accented characters (López) must be saved UTF-8 without a BOM.

### D-16 geofence-existence-AND-name-match probe (apply to Wave-0, referenced by the structural migration's post-verify block)
**Source:** RESEARCH.md "geo_id Verification" section + `1187_sherwood_city_council.sql` lines 379–385 (independent geofence-presence assertion).
Cornelius's variant must go one check further than Sherwood's, asserting the `name` column too:
```sql
SELECT name, geo_id, mtfcc FROM essentials.geofence_boundaries WHERE geo_id='4115550';
-- must return exactly 1 row, name='Cornelius city', mtfcc='G4110'
```
Apply this strengthened check inside the structural migration's post-verification DO block, not just at Wave-0 — this is the single highest-risk item in this phase per RESEARCH.md (the stated `4115350` silently resolves to a real, different city — "Coquille city" — rather than returning 0 rows).

### Deploy verification by bundle content, not hash (apply to the surfacing plan)
**Source:** CONTEXT.md D-16 / RESEARCH.md; carried from 181's 45-minute false-wait lesson. Grep the served JS bundle for the new geo_id (`4115550`) or asset path (`cities/cornelius.jpg`) rather than comparing build hashes (Render's static-build bundle hash ≠ local build hash). Render API key at `C:/EV-Accounts/backend/.env` reads deploy status for `srv-d7290ltm5p6s73ct3a2g` (essentials-frontend).

### Section-split scan (apply after every seeding wave)
**Source:** `1187_sherwood_city_council.sql` lines 387–399 (canonical GROUP BY/HAVING query), reused verbatim as the standing post-seed audit:
```sql
SELECT COUNT(*) FROM (
  SELECT o.district_id FROM essentials.offices o
  JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.geo_id = '<geo_id>'
  GROUP BY o.district_id
  HAVING COUNT(DISTINCT o.chamber_id) > 1
) x;
-- expect 0 rows
```

---

## No Analog Found

None. All 6 file categories have an exact or near-exact analog from the just-completed Sherwood phase (181), supplemented by Tigard's appointed-seat pattern (159) and TX-23's vacant-seat pattern (105) for the two genuinely new wrinkles this phase introduces (appointed seats + a real vacancy). If Wave-0 reverses the at-large finding (unexpected — Charter §7 is unambiguous primary-source text), the ward-geofence loader would need a fresh analog search against WashCo Commission's X0018 loader (Phase 175) — not pre-searched here since RESEARCH.md rates this near-zero probability.

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/` (1187, 1188, 1189, 1159, 105, 076), `src/lib/coverage.js`, `src/lib/buildingImages.js`, `C:/EV-Accounts/backend/scripts/_tmp-sherwood-headshots.py`, `docs/banner-asset-pipeline.md`, `scripts/banners/*.py` (referenced, not modified).
**Files scanned:** 9 read in full or targeted-range; 2 directory listings (`backend/migrations`, `backend/scripts`).
**Pattern extraction date:** 2026-07-03
