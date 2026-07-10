# Phase 195: Oro Valley Deep-Seed - Pattern Map

**Mapped:** 2026-07-10
**Files analyzed:** 6 distinct artifacts (1 structural migration, 1 audit headshot migration, 7 audit
stance migrations counted as 1 repeated pattern, 1 headshot pipeline script, 2 frontend config edits)
**Analogs found:** 6 / 6 (100% — every artifact has a direct, named, DB/disk-verified analog)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `C:/EV-Accounts/backend/migrations/1305_town_of_oro_valley.sql` | migration (structural) | CRUD (INSERT-only, idempotent) | `C:/EV-Accounts/backend/migrations/1131_beaverton_city_council.sql` | exact — same greenfield at-large-Mayor-plus-6-council shape, both fresh INSERTs (not a reconcile), both nonpartisan |
| `C:/EV-Accounts/backend/migrations/1306_town_of_oro_valley_headshots.sql` | migration (audit-only) | CRUD (INSERT-only, idempotent) | `C:/EV-Accounts/backend/migrations/1132_beaverton_headshots.sql` | exact — 7 rows, mixed per-image `photo_license`, unregistered in ledger |
| `C:/EV-Accounts/backend/migrations/1307..1313_oro_valley_*_stances.sql` (7 files) | migration (audit-only) | CRUD (INSERT-only, idempotent, upsert-on-conflict) | `C:/EV-Accounts/backend/migrations/1290_pima_supervisor_1_stances.sql` (+1291-1294; also Tucson's 1298-1304) | exact — one file per official, same header/comment/gate conventions |
| `C:/EV-Accounts/backend/scripts/_tmp-oro-valley-headshots.py` (gitignored, not in RESEARCH's file list but required to produce migration 1306's URLs) | utility (headshot pipeline) | batch / file-I/O | `C:/EV-Accounts/backend/scripts/_tmp-beaverton-headshots.py` (referenced by 1132's header comment; not separately read this session — Beaverton's headshots migration header names it directly) | role-match — same crop/resize/upload shape as every prior phase's `_tmp-*-headshots.py` |
| `src/lib/coverage.js` (MODIFIED — append `'Oro Valley'` to the EXISTING Arizona `areas[]` array) | config/utility | CRUD (static data, read-only at runtime) | the Arizona block itself, same file, lines 199-207 (already contains one `'Tucson'` entry) | exact — plain append, no new `{ name: 'Arizona', ... }` block needed (Pitfall 8) |
| `src/lib/buildingImages.js` (MODIFIED — add `'oro valley'` key to `CURATED_LOCAL`) | config/utility | CRUD (static data, read-only at runtime) | existing `tucson` entry, same file, lines 420-427 | exact — same single-variant object shape, new state-scoped key |

## Pattern Assignments

### `C:/EV-Accounts/backend/migrations/1305_town_of_oro_valley.sql` (structural migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1131_beaverton_city_council.sql` (full file read, 385 lines)
— chosen over Tucson's 1296 or Torrance's 936/937 because Beaverton is (a) a fresh greenfield INSERT
migration, not a reconcile/repair of pre-existing bad data (Torrance), and (b) a pure at-large
Mayor+6-council shape with NO ward geofences (matching Oro Valley exactly), whereas Tucson needed a
ward-geofence-loader shape this phase explicitly does NOT need.

**Header/warning-comment convention** (Source: lines 1-18) — copy the discipline verbatim, adapting the
divergences already flagged by RESEARCH:
```sql
-- CRITICAL: the generated identifier column on essentials.chambers is NEVER included in an INSERT.
-- CRITICAL: essentials.governments has NO unique constraint on geo_id — use WHERE NOT EXISTS guard.
-- CRITICAL: districts.state must be 'az' (lowercase) to match routing queries.
-- CRITICAL: governments.state = 'AZ' (uppercase). offices.representing_state = 'AZ' (uppercase).
-- CRITICAL: district_type='LOCAL_EXEC' for Mayor; district_type='LOCAL' for council (NOT 'COUNTY').
-- CRITICAL: at-large council — NO ward geofences; all 6 share ONE LOCAL district row.
-- CRITICAL: party = NULL for all 7 (nonpartisan) — do NOT record a party value.
```

**Pre-flight hard-abort guard** (Source: lines 22-31) — copy verbatim, retarget the government name:
```sql
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name = 'City of Beaverton, Oregon, US') > 0 THEN
    RAISE EXCEPTION 'Migration 1131 already applied — aborting re-run';
  END IF;
END $$;
```
Oro Valley: `WHERE name = 'Town of Oro Valley, Arizona, US'`.

**Government row pattern** (Source: lines 40-47):
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'City of Beaverton, Oregon, US',
       'LOCAL', 'OR', 'Beaverton', '4105350'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'City of Beaverton, Oregon, US'
);
```
Oro Valley delta: `name='Town of Oro Valley, Arizona, US'`, `type='Town'` (per RESEARCH's explicit
`type='Town'` call, NOT `'LOCAL'` like Beaverton — verify this against the actual `governments.type`
enum/convention at plan time, since Beaverton's own value here is the generic `'LOCAL'` tier tag, not a
human-readable type; RESEARCH's Architecture Patterns diagram calls for `type='Town'` explicitly),
`state='AZ'`, `city='Oro Valley'`, `geo_id='0451600'`.

**Chamber pattern** (Source: lines 49-61) — `official_count=7` (Mayor + 6), copy verbatim:
```sql
INSERT INTO essentials.chambers (id, name, name_formal, government_id, official_count)
SELECT gen_random_uuid(),
       'City Council',
       'Beaverton City Council',
       (SELECT id FROM essentials.governments WHERE name = 'City of Beaverton, Oregon, US'),
       7
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'City Council'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'City of Beaverton, Oregon, US')
);
```
Oro Valley delta: `name='Town Council'`, `name_formal='Oro Valley Town Council'`, `official_count=7`,
`government_id` subquery retargeted to `'Town of Oro Valley, Arizona, US'`.

**Two district rows — CRITICAL DELTA from Beaverton (mtfcc value):**
Beaverton's Step 3/4 set `mtfcc=NULL` on both district rows (Source: lines 63-77) because Beaverton's
migration predates the project's later G4110-reuse convention. RESEARCH explicitly requires Oro Valley's
two new rows to carry `mtfcc='G4110'` (reusing the ALREADY-LIVE Phase-190 geofence, same convention
Tucson's Mayor row used — see `1296_city_of_tucson.sql` lines 141-146, cited in the 194-PATTERNS.md
flagship map). Do not copy Beaverton's `NULL` mtfcc verbatim — use the Tucson `G4110` convention instead:
```sql
-- Step 3: LOCAL_EXEC district (Mayor — town-wide)
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL_EXEC', 'az', '0451600', 'Town of Oro Valley (Mayor)', 'G4110'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '0451600' AND district_type = 'LOCAL_EXEC' AND state = 'az'
);

-- Step 4: LOCAL at-large district (all 6 council members share this ONE row)
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'az', '0451600', 'Town of Oro Valley (At-Large)', 'G4110'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '0451600' AND district_type = 'LOCAL' AND state = 'az'
);
```
Both rows must be preceded by (or paired with) a pre-flight assertion that the `G4110`/`0451600`
`geofence_boundaries` row already exists (mirrors Tucson's Pitfall-5 pattern; Beaverton's migration
skipped this check because it never referenced a geofence row at all — Oro Valley should NOT skip it,
since RESEARCH explicitly found the districts-table gap against an already-live geofence).

**Politician + office block pattern, per official** (Source: lines 79-109 for the Mayor; lines 111-141
for a council seat) — copy shape verbatim, `party=NULL` on every politician row (already NULL in
Beaverton's own migration, confirming the nonpartisan convention directly, not just via a separate DB
query):
```sql
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Lacey Beaty', 'Lacey', 'Beaty', NULL,
          true, false, false, true, -4105351)
  ON CONFLICT (external_id) DO UPDATE
    SET is_active = EXCLUDED.is_active
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
                               WHERE name = 'City of Beaverton, Oregon, US')),
       p.id,
       'Mayor', 'OR', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '4105350'
  AND d.district_type = 'LOCAL_EXEC'
  AND d.state = 'or'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```
Oro Valley Mayor: `external_id=-4009001` (Winfield), `title='Mayor'`, `representing_state='AZ'`,
`d.geo_id='0451600'`, `d.state='az'`. External_id block confirmed unused: `-4009001..-4009007`.

**Council-seat title — CRITICAL DELTA from Beaverton's own convention:** Beaverton titles each council
seat `'Council Member (Position N)'` (Source: lines 132, 164, 198, 230, 262, 294 — six near-identical
blocks, one per position number). RESEARCH explicitly directs Oro Valley to use the **Torrance-precedent
plain, undifferentiated title instead** (Pitfall 3/Open Question 1) — do NOT copy Beaverton's numbered
title text, only its block *structure*:
```sql
-- Adapt Beaverton's Step 6-11 block shape, but title = 'Council Member' (no position number) for all 6:
       p.id,
       'Council Member', 'AZ', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '0451600'
  AND d.district_type = 'LOCAL'
  AND d.state = 'az'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```
One exception: Melanie Barrett's seat gets the Vice-Mayor title-suffix annotation (see below) — all
other 5 council members get the plain `'Council Member'` title with no suffix.

**Vice Mayor title-suffix annotation (LOCKED shape, unchanged pattern from Pima/Tucson/Beaverton's
Council-President precedent)** — Beaverton's own migration documents an directly analogous case at lines
17-18, 175-177 (Edward Kimmi's rotational Council President title is a title annotation, NOT a separate
office/seat):
```sql
-- Step 8: Council Member Position 3 Edward Kimmi (-4105354)
-- Kimmi holds the rotational Council President title — that is a title, not a separate seat.
-- ONE office row only.
```
Oro Valley: Melanie Barrett's office `title='Council Member (Vice Mayor)'`, `role_canonical` stays NULL
on ALL 7 offices — exactly matching the Tucson/Pima precedent already codified in
`194-PATTERNS.md`'s Pattern 2 excerpt. Do NOT create an 8th office row for Vice Mayor.

**office_id back-fill** (Source: lines 309-316) — copy verbatim, retarget the external_id list:
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id IN (
    -4105351,-4105352,-4105353,-4105354,-4105355,-4105356,-4105357
  )
  AND p.office_id IS NULL;
```
Oro Valley: `-4009001,-4009002,-4009003,-4009004,-4009005,-4009006,-4009007`.

**Post-verification DO block gates** (Source: lines 324-375) — copy all four gates verbatim, retargeting
geo_id/state/name literals:
- Gate (a): government row count = 1.
- Gate (b): office count on `geo_id='0451600' AND district_type IN ('LOCAL','LOCAL_EXEC') AND state='az'`
  = 7.
- Gate (c): section-split check — the G4110 geofence for `0451600` must have LOCAL and LOCAL_EXEC district
  rows (this gate is the codified form of Pitfall 4 — copy verbatim, it directly encodes the exact gap
  RESEARCH found).
- Gate (d): office_id back-fill — 0 NULLs remaining across all 7 external_ids.
**Add ONE Oro-Valley-specific gate not in Beaverton's file** (Beaverton has no Vice-Mayor/rotational-title
gate of its own, unlike Pima/Tucson): copy the annotation-identity check pattern from
`1288_pima_county_board_of_supervisors.sql` (cited in 194-PATTERNS.md, lines 427-453) adapted to `(Vice
Mayor)` and Barrett's external_id, asserting exactly 1 matching office.

**Migration ledger footer** (Source: lines 378-385):
```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('1131')
ON CONFLICT (version) DO NOTHING;

COMMIT;
```
Oro Valley: `VALUES ('1305')`. **Re-verify both ledger MAX and disk MAX immediately before applying** —
RESEARCH documented a real same-day cross-workstream collision at migration 1296 this milestone
(Pitfall 6); do not trust the 1305 snapshot blindly.

---

### `C:/EV-Accounts/backend/migrations/1306_town_of_oro_valley_headshots.sql` (audit-only migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1132_beaverton_headshots.sql` (full file read, 91 lines) —
chosen over Tucson/Pima's headshot migrations because Beaverton is itself a nonpartisan at-large city
with the exact same "mixed per-image license, no single WAF-friendly official source" shape RESEARCH
found for Oro Valley (`orovalleyaz.gov` is WAF-blocked, matching Beaverton's press_use-heavy mix more
closely than Tucson's Wikipedia-heavy mix).

**Header comment convention** (Source: lines 1-9):
```sql
-- Migration 1132: City of Beaverton City Council Headshots — AUDIT-ONLY (not registered in the ledger)
--
-- Records the essentials.politician_images rows for the 7 Beaverton officials whose 600x750
-- portraits were uploaded to Supabase Storage (politician_photos/{uuid}-headshot.jpg) by
-- _tmp-beaverton-headshots.py. One INSERT per official, guarded by WHERE NOT EXISTS on
-- politician_id (idempotent). type='default'. photo_license per actual source
-- (Mayor Beaty cc_by_2.0; council portraits press_use). 7/7 uploaded, 0 gaps.
--
-- AUDIT-ONLY: this migration intentionally does NOT write a ledger row.
```
Oro Valley delta: cite whatever actual per-official sources the execution-phase Playwright/`/find-headshots`
sourcing pass finds (per RESEARCH: `orovalleyaz.gov` WAF-blocked; `robb4ovcouncil.com` HTTP-200 confirmed
as one candidate fallback; Wikipedia/press coverage for the rest) — do not assume a uniform license value.

**Per-official INSERT block** (Source: lines 13-22, repeated 7x for Beaverton — 14-22 shown as the
template):
```sql
-- Lacey Beaty (Mayor, -4105351) — Wikimedia Commons
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -4105351),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/6f4e9c86-1c23-4569-ad1a-7614463420f1-headshot.jpg',
       'default', 'cc_by_2.0'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -4105351)
);
```
Oro Valley: 7 blocks, `external_id` in `-4009001..-4009007`, `type='default'` uniform, `photo_license`
per-image honest (mixed values expected — do not default to one license across all 7). No `COMMIT;`
trailing footer/ledger-registration INSERT — matches Beaverton's file ending exactly (`COMMIT;` on the
final line only, no ledger row).

---

### `C:/EV-Accounts/backend/migrations/1307..1313_oro_valley_*_stances.sql` (7 audit-only migrations, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1290_pima_supervisor_1_stances.sql` (+1291-1294) — the same
analog already fully extracted in `194-PATTERNS.md`'s Pattern Assignment for Tucson's 1298-1304 files
(that map's excerpt of lines 1-73 is directly reusable here, restated below for completeness rather than
re-reading the same file range):

**Header comment convention** — per-official file documents: external_id, politician UUID, party/tenure
one-liner (Oro Valley: `party=NULL` line instead of a party name), the EVIDENCE-ONLY/HONEST-BLANK/
AUDIT-ONLY disclosure paragraph, the full list of SEEDED topics with cited one-line justification, and
the full list of DELIBERATELY BLANK topics. Copy this documentation discipline verbatim per official
(Mayor + 6 council) — 36 non-judicial topics is the ceiling per official (Pitfall 7, re-confirmed
unchanged from Phase 193/194).

**Per-topic INSERT pair pattern**:
```sql
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
VALUES ('<politician-uuid>', '<topic-uuid>', 2.0)
ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
VALUES ('<politician-uuid>', '<topic-uuid>',
        $$<evidence-grounded reasoning paragraph, cites specific votes/actions/dates>$$,
        ARRAY['<source url 1>', '<source url 2>']::text[])
ON CONFLICT (politician_id, topic_id) DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;
```
Delta: cite Tucson Local Media/Explorer News, Tucson Sentinel, AZPM, tucson.com/Arizona Daily Star, and
`iloveov.com` — never cite an unfetched `orovalleyaz.gov` agenda URL as if verified (Pitfall 5, the
identical WAF signature to Tucson's Pitfall 4). Plain sequential INSERT statements, `BEGIN;`/no `COMMIT;`
convention TBD per the actual Pima/Tucson file tail (confirm at execute time); no ledger-registration
footer regardless — these files are explicitly unregistered, same as 1306.

---

### `C:/EV-Accounts/backend/scripts/_tmp-oro-valley-headshots.py` (gitignored, utility, batch/file-I/O)

**Analog:** `_tmp-beaverton-headshots.py` (named in `1132_beaverton_headshots.sql`'s header comment, not
separately re-read this session — this session already extracted the full pipeline shape from
`_tmp-pima-supervisors-headshots.py` in `194-PATTERNS.md`, which remains the fully-read reference for the
`crop_to_4_5()` / `resize_600x750()` / `upload_to_storage()` / `dry_run_head_check()` functions). Copy
that pipeline verbatim; only the source-acquisition step changes for Oro Valley:
- `orovalleyaz.gov` is WAF-blocked (Akamai, same signature as Tucson) — the `/find-headshots` skill's
  Playwright flow is the required fallback for resolving each official's usable image URL BEFORE it is
  hardcoded into the script's `ROSTER` config block.
- `robb4ovcouncil.com` (Elizabeth Robb's personal campaign site, HTTP 200 confirmed) is a documented
  candidate fallback for one specific official.
- `photo_license` per `ROSTER` entry will be mixed (matching Beaverton's mixed `cc_by_2.0`/`press_use`
  pattern, not Tucson's more uniform mix) — document per-image in migration 1306's header comment.

---

### `src/lib/coverage.js` (MODIFIED — append to the EXISTING Arizona block)

**Analog:** the Arizona block itself, same file, current lines 199-207 (grep-confirmed live 2026-07-10):
```javascript
  {
    // First Arizona CITY entry (Phase 194). Pima County lives in COVERAGE_COUNTIES
    // (unrelated array) — do NOT add cities there. hasContext:true is DB-honest:
    // Plan 04 seeded evidence-only compass stances for the 7 Tucson officials.
    name: 'Arizona', abbrev: 'AZ',
    areas: [
      { label: 'Tucson', browseGovernmentList: ['0477000'], browseStateAbbrev: 'AZ', hasContext: true },
    ],
  },
];
```
**Action:** append ONE new object to the existing `areas` array — do NOT create a second `{ name:
'Arizona', ... }` block (Pitfall 8, this phase's version of Tucson's Pitfall 6):
```javascript
      { label: 'Oro Valley', browseGovernmentList: ['0451600'], browseStateAbbrev: 'AZ', hasContext: true },
```
`hasContext: true` is appropriate once ≥1 compass-stance row exists for an Oro Valley official (same
convention as the existing Tucson entry and every other `hasContext`-flagged area). Placement: inside
the same `areas: [...]` array, after the `'Tucson'` entry (file has no strict alphabetical enforcement
per Phase 194's own note — not a correctness requirement).

**Test coverage:** no dedicated `coverage.test.js` exists for any prior county/city addition (established
non-gap, Phase 162/193/194 precedent) — substitute verification is a
`node --input-type=module -e "import(...)"` parse-check plus a grep for the new `'Oro Valley'` label.

---

### `src/lib/buildingImages.js` (MODIFIED — add `'oro valley'` key to `CURATED_LOCAL`)

**Analog:** the existing `tucson` entry, same file, current lines 420-427 (grep-confirmed live
2026-07-10):
```javascript
  // Arizona CITY banner (Phase 194). Downtown Tucson skyline viewed from Sentinel
  // Peak (the downtown high-rise cluster with the Santa Catalina Mountains behind),
  // ...
  // Tucson the CITY, deliberately distinct from the Pima COUNTY landscape banner
  // (Catalinas + saguaro) and the AZ STATE banner (the Phoenix skyline). Single-variant
  // key (no same-named-city collision in the covered set); storage file cities/tucson.jpg.
  //   tucson        - View of Tucson from Sentinel Peak (leveled) | John Diebolt | Public domain
  tucson: { state: 'AZ', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/tucson.jpg' },
};
```
**Action:** add, in the same object (single-key entry — no array-of-variants form needed since 'oro
valley' has no same-named-city collision elsewhere in the covered set, unlike `portland`/`springfield`/
`fairview`, which use the array-of-`{state,src}` form seen elsewhere in this file):
```javascript
  // Arizona CITY banner (Phase 195). <fill in actual sourced photo/subject at execution
  // time — RESEARCH shortlisted 2 Pusch Ridge/Catalina-range Wikimedia Commons candidates
  // and flagged an Open Question about visual similarity to the Pima County banner (same
  // mountain range); a genuinely distinct subject (Oro Valley Marketplace, Steam Pump
  // Ranch, Community Center) is worth a deliberate look first>, deliberately distinct
  // from the Tucson downtown-streetscape banner and the AZ STATE Phoenix-skyline banner.
  // Key is space-form to match coverage.js label 'Oro Valley'; storage file hyphenated.
  //   oro valley    - <subject> | <author> | <license>
  'oro valley': { state: 'AZ', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/oro-valley.jpg' },
```
The author/license attribution comment MUST be filled in with the actual sourced photo's real
attribution at execution time — every existing entry in this file documents it this way; do not skip it
(matches the project's `project_banner_redo_technique` convention).

**Toolchain to reuse verbatim** (no code changes needed): `scripts/banners/process_banner.py` (crop to
1700×540) and `scripts/banners/upload_banner.py` (Storage is no-cache — overwrite = instant refresh).

**Test coverage:** `buildingImages.test.js` already exercises `CURATED_LOCAL` generically — no new test
file needed, just confirm `npx vitest run src/lib/buildingImages.test.js` stays green after adding the
`'oro valley'` key.

## Shared Patterns

### Idempotency guard convention (all structural + audit SQL)
**Source:** `1131_beaverton_city_council.sql` (governments: `WHERE NOT EXISTS` on name; chambers: `WHERE
NOT EXISTS` on name+government_id; districts: `WHERE NOT EXISTS` on geo_id+district_type+state;
politicians: `ON CONFLICT (external_id) DO UPDATE SET is_active=...`; offices: `WHERE NOT EXISTS` on
district_id+politician_id) and `1290_pima_supervisor_1_stances.sql` (`ON CONFLICT (politician_id,
topic_id) DO UPDATE SET ...`).
**Apply to:** every new/modified SQL file this phase (1305, 1306, 1307-1313).

### `state` casing discipline (LOCAL/LOCAL_EXEC = lowercase, table free-text = uppercase)
**Source:** `1131_beaverton_city_council.sql` header comment (lines 12-14) — `districts.state` must be
`'az'` lowercase for the LOCAL-tier routing join key; `governments.state`/`offices.representing_state`
stay uppercase `'AZ'`.
**Apply to:** migration 1305's two new `districts` rows (both LOCAL and LOCAL_EXEC) — the AZ-milestone
lowercase convention already confirmed to apply to LOCAL_EXEC too (Beaverton and Tucson both do this).

### geo_id collision scoping (never join on bare geo_id)
**Source:** every office↔district join in `1131_beaverton_city_council.sql` (`d.geo_id = '4105350' AND
d.district_type = 'LOCAL_EXEC'/'LOCAL' AND d.state = 'or'`, always 3-column scoping, never a bare
`geo_id` match).
**Apply to:** all 7 office↔district joins in migration 1305 — Oro Valley's `0451600` is itself a
multi-use geo_id (the same TIGER place code also appears in `geofence_boundaries` with `state` stored as
FIPS `'04'`, an unrelated convention from `districts.state`).

### Nonpartisan `party=NULL` convention
**Source:** `1131_beaverton_city_council.sql` — every one of the 7 politician INSERT VALUES rows uses
`NULL` for `party` (lines 84, 116, 148, 182, 214, 246, 278) — a directly-in-migration confirmation, not
just a separate SELECT query.
**Apply to:** all 7 politician rows in migration 1305 — this is the single biggest structural divergence
from Tucson (the AZ partisan outlier), and Beaverton is the better precedent to copy for this specific
convention.

### Vice Mayor / Council-President title-suffix annotation (LOCKED, no separate office)
**Source:** `1131_beaverton_city_council.sql` lines 17-18 and 175-177 (Kimmi's rotational Council
President title) — a directly-analogous "title annotation, not a separate seat" case within the SAME
file family as this phase's own structural analog, reinforcing the pattern already established by Pima's
`(Chair)` suffix and Tucson's `(Vice Mayor)` suffix.
**Apply to:** migration 1305's Melanie Barrett office (`'Council Member (Vice Mayor)'`), `role_canonical`
NULL on all 7 offices.

### Headshot pipeline (crop-first, 600×750, Storage x-upsert)
**Source:** `_tmp-pima-supervisors-headshots.py` `crop_to_4_5()` + `resize_600x750()` +
`upload_to_storage()` (fully extracted in `194-PATTERNS.md`).
**Apply to:** `_tmp-oro-valley-headshots.py` — reuse verbatim; only the source-acquisition step changes
(Playwright fallback for the WAF-blocked `orovalleyaz.gov` host).

### Migration numbering (disk-MAX authoritative, not ledger-MAX)
**Source:** RESEARCH's Pitfall 6 — ledger MAX=1296, disk MAX=1304 (Tucson's 7 unregistered stance files),
AND a real same-day collision already occurred once this milestone (`1296_senate_2026_deep_seed.sql`, an
unrelated concurrent workstream).
**Apply to:** re-verify both ledger MAX and disk MAX immediately before applying 1305/1306/1307-1313,
even though RESEARCH computed next=1305 on 2026-07-10 — drift is expected and has already recurred.

## No Analog Found

None — every artifact in this phase has a direct, named, already-read analog. The one genuinely novel
engineering surface is not a missing analog but a **deliberate divergence from the closest analog's own
convention**: migration 1305 must copy Beaverton's file *structure* verbatim while overriding two of
Beaverton's own choices — (1) `mtfcc` on the district rows (Beaverton used `NULL`; Oro Valley must use
`'G4110'` to match the Tucson G4110-reuse convention against the already-live Phase-190 geofence), and
(2) the council-seat title text (Beaverton used numbered `'(Position N)'`; Oro Valley must use the
Torrance-precedent plain `'Council Member'` per RESEARCH's Pitfall 3/Open Question 1).

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/` (globbed + grepped for `beaverton`/
`torrance`/`93*`/`113*`/`1290`), `src/lib/coverage.js`, `src/lib/buildingImages.js`. Cross-referenced
`194-PATTERNS.md` (Phase 194's flagship map) for the Pima/Tucson stance-migration and headshot-pipeline
excerpts already fully extracted there, to avoid re-reading files already in that map's context.
**Files scanned/read in full or targeted this session:** `1131_beaverton_city_council.sql` (385 lines,
full), `1132_beaverton_headshots.sql` (91 lines, full), `937_torrance_roster.sql` (27 lines, full),
`936_torrance_reconcile.sql` (70 lines, full — read to confirm Torrance is a reconcile-shape migration,
NOT a greenfield-shape analog for 1305), `coverage.js` (targeted grep, lines 128-208), `buildingImages.js`
(targeted grep, lines 159-163, 411-428, 516-520) — all read via non-overlapping ranges, no re-reads.
**Pattern extraction date:** 2026-07-10
