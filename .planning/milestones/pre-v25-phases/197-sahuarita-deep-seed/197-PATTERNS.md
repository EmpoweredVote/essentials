# Phase 197: Sahuarita Deep-Seed - Pattern Map

**Mapped:** 2026-07-16
**Files analyzed:** 5 (1 structural migration + 1 headshots migration + 7 stance migrations treated as one pattern + 2 frontend files)
**Analogs found:** 5 / 5

**IMPORTANT — structural model is a HYBRID, not a literal copy of one file.** Per RESEARCH.md, Sahuarita's
7 council seats are ALL at-large and share ONE `LOCAL` district row (Oro Valley/Marana DB shape), but Mayor
and Vice Mayor are council-CHOSEN TITLES with NO separately-elected office — there is **NO `LOCAL_EXEC` row
at all** (Palm Springs/Indio title-on-seat office-modeling shape). The planner must combine:
- **District/chamber/government shape** → Marana `1345_town_of_marana.sql` (minus its `LOCAL_EXEC` half)
- **Title-on-seat office modeling + post-verify gate for "exactly 1 Mayor / exactly 1 Vice Mayor"** → Palm Springs `1329_palm_springs_city_council.sql` gate (f)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `C:/EV-Accounts/backend/migrations/1354_town_of_sahuarita.sql` (structural; number re-verify at execute time — disk MAX=1353 confirmed 2026-07-16) | migration | CRUD (batch INSERT/idempotent-guard) | HYBRID: `1345_town_of_marana.sql` (district/chamber/govt shape, at-large shared-LOCAL) + `1329_palm_springs_city_council.sql` (title-on-seat office modeling + gate (f)) | hybrid-match (best of two role+data-flow-identical analogs) |
| `C:/EV-Accounts/backend/migrations/<next>_town_of_sahuarita_headshots.sql` (audit-only, unregistered) | migration | batch/file-I/O (references uploaded Storage URLs) | `1346_town_of_marana_headshots.sql` | exact |
| `C:/EV-Accounts/backend/migrations/<next..next+6>_sahuarita_*_stances.sql` (audit-only, one per official, evidence-cited) | migration | batch (evidence-only CRUD) | `1347_marana_mayor_stances.sql` (+ sibling `1348_marana_council_1_stances.sql` etc.) | exact |
| `src/lib/buildingImages.js` (add `sahuarita` to `CURATED_LOCAL`) | config/data-map | transform (lookup table) | Existing `marana:` / `'oro valley':` entries (lines 448-465) in the same file | exact |
| `src/lib/coverage.js` (append `Sahuarita` to Arizona `COVERAGE_STATES` block) | config/data-map | transform (lookup table) | Existing `{ label: 'Marana', ... }` entry (line 215) in the same Arizona block | exact |

## Pattern Assignments

### `C:/EV-Accounts/backend/migrations/1354_town_of_sahuarita.sql` (migration, batch CRUD)

**Analogs:** `1345_town_of_marana.sql` (district/chamber/govt shape) + `1329_palm_springs_city_council.sql` (title-on-seat modeling, gate (f))

**Why hybrid, not a straight copy:** Marana's migration creates TWO district rows — one `LOCAL_EXEC` for
a directly-elected Mayor, one `LOCAL` shared by the 6 at-large council members. Sahuarita has **no
directly-elected Mayor office** (RESEARCH confirmed via Town Code 2.05/2.10 + 3 other sources) — so the
`LOCAL_EXEC` half of Marana's shape must be DROPPED entirely. Instead, borrow Palm Springs' pattern of
putting the Mayor/Mayor-Pro-Tem distinction purely in the `title` string of an otherwise-ordinary office,
with `role_canonical` staying NULL and a post-verify gate asserting "exactly 1 office titled X".

**Government row pattern** (Marana lines 77-85, adapt name/geo_id/state):
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'Town of Marana, Arizona, US',
       'Town', 'AZ', 'Marana', '0444270'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'Town of Marana, Arizona, US'
);
```
Sahuarita substitution: `'Town of Sahuarita, Arizona, US'`, `'Town'`, `'AZ'`, `'Sahuarita'`, `'0462140'`.

**Chamber row pattern** (Marana lines 87-99 — `official_count=7`, no separate Mayor chamber):
```sql
INSERT INTO essentials.chambers (id, name, name_formal, government_id, official_count)
SELECT gen_random_uuid(),
       'Town Council',
       'Marana Town Council',
       (SELECT id FROM essentials.governments WHERE name = 'Town of Marana, Arizona, US'),
       7
WHERE NOT EXISTS (...);
```
Sahuarita: same shape, `official_count=7` (matches — 7 at-large seats, no separate Mayor seat since Mayor
IS one of the 7).

**District row pattern — ONLY the LOCAL half of Marana's Step 4 (DROP the LOCAL_EXEC half, Marana lines 101-115):**
```sql
-- Step 4: LOCAL at-large district (all 6 council members share this ONE row — Torrance precedent).
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'az', '0444270', 'Town of Marana (At-Large)', 'G4110'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '0444270' AND district_type = 'LOCAL' AND state = 'az'
);
```
Sahuarita: ONE new `LOCAL` row, `geo_id='0462140'`, `mtfcc='G4110'`, `state='az'`, shared by ALL 7 offices
including the Mayor/Vice-Mayor-titled ones. **Do NOT insert a `LOCAL_EXEC` row for Sahuarita** — RESEARCH
Pitfall 3 explicitly flags this as an anti-pattern (a phantom seat with no electoral basis). Pre-flight
should also assert the G4110/0462140 boundary already exists (mirror Marana's pre-flight 1, lines 49-58).

**Office/politician block pattern — use Palm Springs' plain-title convention, NOT Marana's parenthetical-annotation convention** (Palm Springs lines 266-297, the Mayor block):
```sql
-- BLOCK 4: Council District 4 Naomi Soto (-4011004) — Mayor (rotational, title-on-seat)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Naomi Soto', 'Naomi', 'Soto', NULL,
          true, false, false, true, -4011004)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers WHERE name = 'City Council' AND government_id = (...)),
       p.id,
       'Mayor', 'CA', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = 'palm-springs-ca-council-district-4'
  AND d.district_type = 'LOCAL' AND d.state = 'ca' AND d.mtfcc = 'X0022'
  AND p.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id);
```
Sahuarita adaptation: all 7 offices join the SAME single `LOCAL` district row (`geo_id='0462140'`,
`mtfcc='G4110'`, `state='az'`) rather than per-seat districts (Palm Springs' 5 offices each have their OWN
district — Sahuarita instead follows Marana's shared-row join, `WHERE d.geo_id = '0462140' AND
d.district_type = 'LOCAL' AND d.state = 'az' AND d.mtfcc = 'G4110'`, repeated identically for all 7 blocks).
Titles: Murphy=`'Mayor'`, Egbert=`'Vice Mayor'` (RESEARCH's Alternatives-Considered table recommends the
PLAIN Palm-Springs-style label over Marana's `'Council Member (Vice Mayor)'` annotation — planner's final
call per RESEARCH A4, either renders correctly), other 5=`'Council Member'`. `role_canonical` NULL on all 7.
`party=NULL` on all 7 (nonpartisan). Use `ON CONFLICT (external_id) DO NOTHING` (greenfield — no
existing rows to update, unlike Marana's `DO UPDATE SET is_active` which handled a partial-existing roster).

**Post-verify gate for "exactly 1 Mayor / exactly 1 Vice Mayor" — copy Palm Springs gate (f) verbatim, substituting facts** (Palm Springs lines 432-475):
```sql
-- Gate (f): exactly 1 title='Mayor' AND exactly 1 title='Mayor Pro Tem' across the X0022 council districts
SELECT COUNT(*) INTO v_mayor_count
FROM essentials.offices o
JOIN essentials.districts d ON d.id = o.district_id
WHERE d.geo_id LIKE 'palm-springs-ca-council-district-%'
  AND d.district_type = 'LOCAL' AND d.state = 'ca' AND d.mtfcc = 'X0022'
  AND o.title = 'Mayor';
...
IF v_mayor_count <> 1 THEN
  RAISE EXCEPTION 'Post-verification FAILED: expected exactly 1 office with title=Mayor, found %', v_mayor_count;
END IF;
...
SELECT p.external_id INTO v_mayor_extid ... AND o.title = 'Mayor';
IF v_mayor_extid <> -4011004 THEN
  RAISE EXCEPTION 'Post-verification FAILED: Mayor title is on external_id % — expected -4011004 (Naomi Soto, D4)', v_mayor_extid;
END IF;
```
Sahuarita: scope the gate to `d.geo_id = '0462140' AND d.mtfcc = 'G4110' AND d.state = 'az'` (single shared
row, not a `LIKE` pattern across per-seat districts), assert exactly 1 `title='Mayor'` bound to Murphy's
external_id and exactly 1 `title='Vice Mayor'` bound to Egbert's external_id.

**Other required gates (combine both analogs' gate sets):**
- Gate (a) government row count = 1 (both analogs, identical shape)
- Gate (b) office count = 7, ALL on the single LOCAL/G4110/0462140 district (Marana gate (b)/(c) shape, but NO `LOCAL_EXEC` count — only `LOCAL` count = 7, not split 1+6)
- Gate (d)-equivalent: party IS NULL for all 7 (Marana gate (d), lines 428-437)
- Gate (e)-equivalent: section-split — 0 offices reachable via this district under a non-Sahuarita government (both analogs have this; Marana lines 459-470, Palm Springs lines 416-430)
- Gate (g): office_id back-fill — 0 NULLs remaining (Marana lines 472-481)

**CRITICAL notes carried from both analogs' file headers:**
- `slug` column on `essentials.chambers` — NEVER in INSERT column list (both files' header CRITICAL notes).
- `essentials.governments` has NO unique constraint on `geo_id` — use `WHERE NOT EXISTS` guard on `name` (both).
- `districts.state` must be lowercase `'az'`; `governments.state`/`offices.representing_state` uppercase `'AZ'` (Marana header, lines 14-15).
- Every office↔district join scoped by `district_type` + `mtfcc='G4110'` + `state='az'`, never a bare `geo_id` (Marana header line 21-22).
- Migration ledger registration is a 2-column form OUTSIDE the transaction (Palm Springs lines 483-491) or 1-column form (Marana lines 489-495) — check which convention is currently live at execute time; both exist in the codebase.

---

### `C:/EV-Accounts/backend/migrations/<next>_town_of_sahuarita_headshots.sql` (migration, audit-only batch)

**Analog:** `1346_town_of_marana_headshots.sql`

**Full pattern** (lines 1-39, one block shown, repeat x7):
```sql
-- Jon Post (Mayor, -4013001) — 3b09d8a3-641f-43f9-b3cc-0ce695b54aef
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -4013001),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/3b09d8a3-641f-43f9-b3cc-0ce695b54aef-headshot.jpg',
       'default', 'Town of Marana official council portrait (municipal government work; public/press use)'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -4013001)
);
```
Sahuarita adaptation: substitute the 7 Sahuarita external_ids (`-4014001..-4014007`), each official's
Storage UUID (post-upload), and `photo_license` text describing the actual source (per D-05: direct
sahuaritaaz.gov fetch first, Playwright fallback if the soft-block from RESEARCH Pitfall 4 is hit, then
Ballotpedia/Wikimedia). This migration is AUDIT-ONLY — does NOT write a `supabase_migrations` ledger row
(per the header note, line 26 of the analog). `type='default'` for all 7.

---

### `C:/EV-Accounts/backend/migrations/<next..next+6>_sahuarita_*_stances.sql` (migration, audit-only batch, one per official)

**Analog:** `1347_marana_mayor_stances.sql` (+ sibling council-member stance files `1348`-`1353`)

**Header/documentation pattern** (lines 1-38 — evidence log listing seeded topics with a 1-line
justification, plus a DELIBERATELY BLANK section listing topics with no clear documented position):
```sql
-- SEEDED (6 topics):
--   data-centers              = 4  (championed the unanimous Jan. 6 2026 data-center rezoning; ...)
--   growth-and-development    = 4  ("If you're not growing, you're dying"; ...)
--   ...
-- DELIBERATELY BLANK (no clean, attributable documented Post position found):
--   Local: campaign-finance, city-sanitation, homelessness, ...
--   Non-local federal/state (a town mayor has no record on these): abortion, ai-regulation, ...
--   (No judicial-* topic is ever seeded.)
```

**Per-topic INSERT pair pattern** (lines 42-58 — `politician_answers` value + `politician_context` reasoning/sources):
```sql
-- ----- Jon Post / data-centers (value 4) -----
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
VALUES ('3b09d8a3-641f-43f9-b3cc-0ce695b54aef',
        '4559b513-0fd8-4ed1-babd-f3b554162f40',
        4.0)
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET value = EXCLUDED.value;

INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
VALUES ('3b09d8a3-641f-43f9-b3cc-0ce695b54aef',
        '4559b513-0fd8-4ed1-babd-f3b554162f40',
        $$As Mayor, Post championed the Beale Infrastructure data center. At the Jan. 6, 2026 Council meeting...$$,
        ARRAY['https://www.azfamily.com/2026/01/09/...',
              'https://www.kgun9.com/news/...']::text[])
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;
```
Sahuarita adaptation: one file per official (7 files), evidence-only against the 36 non-judicial live
`compass_topics` (RESEARCH-confirmed count: 44 live total, 8 judicial-scoped excluded). Salient local
issues flagged by RESEARCH for Sahuarita specifically: Copper World/Hudbay copper-mine proposal (water,
traffic, environment), Colorado River/CAP water allocation, data-center growth, general growth pressure.
No default values — honest blanks per the DELIBERATELY BLANK convention shown above. `$$...$$` dollar-quoting
for reasoning text (avoids quote-escaping issues) and `ARRAY[...]::text[]` for the sources array — both
verbatim reusable conventions.

---

### `src/lib/buildingImages.js` (config/data-map, transform)

**Analog:** existing `marana:` and `'oro valley':` `CURATED_LOCAL` entries (lines 448-465)

```javascript
// Oro Valley community banner (Phase 195). The Cañada del Oro (CDO) Riverfront Park
// pedestrian trail bridge — a distinctive rust-colored arched truss over the wash,
// deliberately distinct from the Pima COUNTY Catalina/Pusch-Ridge landscape banner,
// the Tucson CITY downtown streetscape, and the AZ STATE Phoenix skyline (its
// mountains sit small in the far background; the bridge is the subject). Single-variant
// key (no same-named-city collision); storage file cities/oro-valley.jpg (hyphenated),
// coverage.js label is space-form 'Oro Valley'.
//   oro valley    - Oro Valley CDO Trail Bridge | Djmaschek | CC BY-SA 3.0
'oro valley': { state: 'AZ', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/oro-valley.jpg' },
// Marana community banner (Phase 196). Hole #3 at The Golf Club at Dove Mountain
// (Saguaro) — a real, ground-level Sonoran-desert golf scene (green fairway, water
// hazard, saguaros) with the LOW distant Tortolita/Tucson ranges on the horizon.
// Deliberately by the Tortolita range, NOT the Catalinas — so it does not collide
// with the Pima COUNTY Catalina/Pusch-Ridge landscape banner, the Oro Valley CDO
// Trail Bridge, the Tucson CITY downtown streetscape, or the AZ STATE Phoenix skyline.
// Single-variant single-word key (no same-named-city collision); storage cities/marana.jpg.
//   marana        - The Golf Club at Dove Mountain (Saguaro) no 3 | Bernard Gagnon | CC BY-SA 3.0
marana: { state: 'AZ', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/marana.jpg' },
```
Sahuarita append (after the `marana:` entry, before the closing `};` at line 466): a comment block in the
same style documenting the chosen banner subject (per D-03/RESEARCH: pecan orchards front-runner but
resolution-risky at 532px — RESEARCH's Open Question 2 recommends the Sahuarita Lake photo, 3008×1645
CC BY-SA 3.0 by Brian Basgen, as the confirmed-usable fallback) and explicitly noting it is deliberately
distinct from Pima's Catalinas, Oro Valley's CDO bridge, Marana's Tortolita/Dove-Mountain, and the AZ-state
Phoenix skyline. Key: `sahuarita:` (single-word, no collision), `src` pointing to
`cities/sahuarita.jpg`.

---

### `src/lib/coverage.js` (config/data-map, transform)

**Analog:** existing `{ label: 'Marana', ... }` entry in the Arizona `COVERAGE_STATES` block (lines 202-216)

```javascript
{
    // First Arizona CITY entry (Phase 194). Pima County lives in COVERAGE_COUNTIES
    // (unrelated array) — do NOT add cities there. hasContext:true is DB-honest:
    // Plan 04 seeded evidence-only compass stances for the 7 Tucson officials.
    name: 'Arizona', abbrev: 'AZ',
    areas: [
      { label: 'Tucson', browseGovernmentList: ['0477000'], browseStateAbbrev: 'AZ', hasContext: true },
      // Oro Valley (Phase 195). Appended to the EXISTING Arizona block (not a second
      // block). hasContext:true is DB-honest — Plan 03 seeded evidence-only compass
      // stances for the 7 Oro Valley officials. Pima County stays in COVERAGE_COUNTIES.
      { label: 'Oro Valley', browseGovernmentList: ['0451600'], browseStateAbbrev: 'AZ', hasContext: true },
      // Marana (Phase 196). Appended to the EXISTING Arizona block (not a second block);
      // Plan 03 seeded 21 evidence-only compass stances across the 7 Marana officials, so
      // hasContext:true is honest. Pima County stays in COVERAGE_COUNTIES (untouched).
      { label: 'Marana', browseGovernmentList: ['0444270'], browseStateAbbrev: 'AZ', hasContext: true },
    ],
  },
```
Sahuarita: APPEND a 4th entry directly after the `Marana` line (do NOT create a new `{ name: 'Arizona', ... }`
block — RESEARCH Pitfall 7 explicitly flags this as the anti-pattern):
```javascript
{ label: 'Sahuarita', browseGovernmentList: ['0462140'], browseStateAbbrev: 'AZ', hasContext: true },
```
`hasContext: true` only once >=1 stance row actually exists in the DB (per the established convention in
every prior entry's comment) — set only after the stance migrations are applied, matching Tucson/Oro
Valley/Marana's pattern of documenting exactly how many stances justify the flag.

## Shared Patterns

### Idempotency guard convention (all migrations)
**Source:** Both `1345_town_of_marana.sql` and `1329_palm_springs_city_council.sql`
**Apply to:** The structural migration
`WHERE NOT EXISTS (...)` guards on every INSERT keyed by the natural-language identity (government `name`,
chamber `(name, government_id)`, district `(geo_id, district_type, state)`, office `(district_id,
politician_id)`); politicians use `ON CONFLICT (external_id) DO NOTHING` (greenfield, no pre-existing rows)
or `DO UPDATE SET is_active = EXCLUDED.is_active` (if any partial pre-existing rows are found — not
expected here per RESEARCH's greenfield confirmation).

### Section-split anti-pattern gate (all structural migrations)
**Source:** `1345_town_of_marana.sql` lines 459-470, `1329_palm_springs_city_council.sql` lines 416-430
**Apply to:** The structural migration's post-verify DO block
```sql
SELECT COUNT(*) INTO v_split_count
FROM essentials.offices o
JOIN essentials.districts d ON d.id = o.district_id
JOIN essentials.chambers c ON c.id = o.chamber_id
WHERE d.geo_id = '<sahuarita geo_id>' AND d.mtfcc = 'G4110' AND d.state = 'az'
  AND c.government_id <> (SELECT id FROM essentials.governments WHERE name = '<sahuarita gov name>');
IF v_split_count <> 0 THEN
  RAISE EXCEPTION 'Post-verification FAILED: section-split — % office(s) attached under a non-Sahuarita government', v_split_count;
END IF;
```

### Nonpartisan/antipartisan party=NULL gate
**Source:** `1345_town_of_marana.sql` lines 428-437 (Gate d)
**Apply to:** The structural migration — assert all 7 politicians have `party IS NULL`.

### Evidence-only stance citation format (dollar-quoting + text[] sources array)
**Source:** `1347_marana_mayor_stances.sql` lines 50-58
**Apply to:** All 7 Sahuarita stance migration files — `$$...$$` for reasoning (avoids apostrophe-escaping
issues in quoted names/statements), `ARRAY['url1','url2']::text[]` for sources, `ON CONFLICT (politician_id,
topic_id) DO UPDATE SET ...` for both `politician_answers` and `politician_context`.

### CURATED_LOCAL banner comment convention (distinctiveness-vs-prior-banners note)
**Source:** `src/lib/buildingImages.js` lines 448-465 (Oro Valley, Marana entries)
**Apply to:** The new `sahuarita:` entry — every prior AZ banner comment explicitly states which other
AZ banners (county/city/state) it is deliberately distinct from; the Sahuarita entry should do the same
(Catalinas=Pima/Oro-Valley, Tortolita/Dove-Mountain=Marana, Phoenix skyline=AZ state).

### coverage.js single-block-append convention
**Source:** `src/lib/coverage.js` lines 202-216
**Apply to:** The `areas` array append — never create a second `{ name: 'Arizona', ... }` block; always
append inside the existing one's `areas: [...]` array, following each prior entry's inline comment style
documenting which phase added it and why `hasContext` is true.

## No Analog Found

None. All 5 files this phase touches have a directly reusable analog (or a clean hybrid of two analogs)
already in the codebase.

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/` (Marana 1345-1349, Palm Springs 1329, Indio
1338), `src/lib/buildingImages.js`, `src/lib/coverage.js`
**Files scanned:** 7 migration files read directly (1329, 1338, 1345, 1346, 1347) + 2 frontend files
(targeted grep + context reads)
**Pattern extraction date:** 2026-07-16

## PATTERN MAPPING COMPLETE

**Phase:** 197 - sahuarita-deep-seed
**Files classified:** 5 (1 hybrid structural migration + 1 headshots migration + 7 stance-migration set + 2 frontend appends)
**Analogs found:** 5 / 5

### Coverage
- Files with exact analog: 4 (headshots migration, stance migrations, buildingImages.js, coverage.js)
- Files with hybrid-match analog (two files combined): 1 (structural migration — Marana district/chamber shape + Palm Springs title-on-seat/gate-(f) shape)
- Files with no analog: 0

### Key Patterns Identified
- Structural shape is a genuine hybrid: Marana's "all at-large seats share ONE `LOCAL` district row" DB
  shape, MINUS its `LOCAL_EXEC` Mayor row (there is no separately-elected Mayor in Sahuarita), PLUS Palm
  Springs' "Mayor/Mayor-Pro-Tem title-on-seat, `role_canonical` stays NULL, gate exactly-1-per-title"
  office-modeling pattern (Palm Springs gate (f) is verbatim-reusable, just re-scoped to the single shared
  district instead of a `LIKE` pattern across 5 per-seat districts).
- All migrations use `WHERE NOT EXISTS` / `ON CONFLICT ... DO NOTHING` idempotency guards, a mandatory
  post-verify `DO $$ ... RAISE EXCEPTION $$` gate block (row counts, party-NULL, section-split,
  title-count), and ledger registration OUTSIDE the `BEGIN`/`COMMIT` transaction for structural migrations
  only (headshots/stances migrations are audit-only and never register).
- Stance migrations follow a strict evidence-only convention: `$$...$$` dollar-quoted reasoning citing
  named, dated, quoted sources; `ARRAY[...]::text[]` sources; explicit "DELIBERATELY BLANK" documentation
  of topics with no citable position — no default/inferred values ever.
- Frontend touches are pure appends to existing arrays (`CURATED_LOCAL` object literal, Arizona
  `COVERAGE_STATES` block's `areas` array) — never create a new state block or duplicate structure.

### File Created
`.planning/phases/197-sahuarita-deep-seed/197-PATTERNS.md`

### Ready for Planning
Pattern mapping complete. Planner can now reference the Marana+Palm-Springs hybrid analog and the
headshots/stances/frontend analogs directly in PLAN.md files.
