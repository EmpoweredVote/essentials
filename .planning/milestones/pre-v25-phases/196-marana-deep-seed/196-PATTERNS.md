# Phase 196: Marana Deep-Seed - Pattern Map

**Mapped:** 2026-07-15
**Files analyzed:** 5 (1 structural migration, 1 headshot audit migration, 7 stance audit migrations counted as 1 pattern group, 2 frontend appends)
**Analogs found:** 5 / 5 (all exact — Phase 195 Oro Valley is a near-verbatim structural twin)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `C:/EV-Accounts/backend/migrations/1345_town_of_marana.sql` (provisional number — re-verify disk MAX at execute time) | migration | CRUD (structural seed) | `C:/EV-Accounts/backend/migrations/1305_town_of_oro_valley.sql` | exact |
| `C:/EV-Accounts/backend/migrations/1346_town_of_marana_headshots.sql` (audit-only, unregistered) | migration | CRUD (batch insert) | `C:/EV-Accounts/backend/migrations/1306_town_of_oro_valley_headshots.sql` | exact |
| `C:/EV-Accounts/backend/migrations/1347..1353_marana_<official>_stances.sql` (7 files, one per official, audit-only) | migration | CRUD (batch insert) | `C:/EV-Accounts/backend/migrations/1307_oro_valley_mayor_stances.sql` (+ 1308-1313 for the council-member shape) | exact |
| `src/lib/buildingImages.js` (append `marana` to `CURATED_LOCAL`) | config / data-map | transform (static lookup table) | existing `'oro valley'` entry, `src/lib/buildingImages.js` lines 448-456 | exact |
| `src/lib/coverage.js` (append `Marana` to the existing Arizona `areas[]`) | config / data-map | transform (static lookup table) | existing Arizona block, `src/lib/coverage.js` lines 201-213 | exact |

No sub-jurisdiction geofence loader is needed (Marana's whole-town G4110 boundary, `geo_id='0444270'`, already loaded from Phase 190 — confirmed in RESEARCH.md). No new TypeScript/backend service code — the existing `G4110→(LOCAL,LOCAL_EXEC)` routing map in `essentialsService.ts` covers Marana with zero code change, exactly as it did for Oro Valley.

## Pattern Assignments

### `C:/EV-Accounts/backend/migrations/1345_town_of_marana.sql` (migration, structural CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1305_town_of_oro_valley.sql` (read in full — 469 lines)

This file is copy-verbatim-with-substitutions. Substitute every Oro Valley fact for its Marana equivalent:

| Oro Valley (1305) | Marana (1345) |
|---|---|
| `geo_id='0451600'` | `geo_id='0444270'` |
| `'Town of Oro Valley, Arizona, US'` | `'Town of Marana, Arizona, US'` |
| ext_id block `-4009001..-4009007` | ext_id block `-4013001..-4013007` (DB-confirmed unused this session) |
| `'Town of Oro Valley (Mayor)'` / `'Town of Oro Valley (At-Large)'` district labels | `'Town of Marana (Mayor)'` / `'Town of Marana (At-Large)'` |
| Roster: Winfield(Mayor)/Barrett(VM)/Jones-Ivey/Nicolson/Greene/Murphy/Robb | Roster: Post(Mayor)/Ziegler(VM)/Cavanaugh/Comerford/Kai/Murphy/Officer — **re-verify at execute-time checkpoint before finalizing (Pitfall 1/2/3 — primary is 6 days out)** |
| Ledger version `'1305'` | Ledger version `'1345'` (re-verify disk MAX at execute time — Pitfall 6) |

**Header/warning-comment block** (lines 1-31 of 1305) — copy the CRITICAL/DEVIATION-NOTE comment discipline verbatim, substituting facts:
```sql
-- Migration 1305: Town of Oro Valley government + chamber + districts + officials + offices
-- ...
-- CRITICAL: districts.state must be 'az' (lowercase) to match routing queries.
-- CRITICAL: governments.state = 'AZ' (uppercase). offices.representing_state = 'AZ' (uppercase).
-- CRITICAL: district_type='LOCAL_EXEC' for Mayor; district_type='LOCAL' for council (NOT 'COUNTY').
-- CRITICAL: at-large council — NO ward geofences; all 6 council offices share ONE LOCAL district row.
-- CRITICAL: BOTH district rows carry mtfcc='G4110' ...
-- CRITICAL: party = NULL for all 7 ... — do NOT record a party value.
-- CRITICAL: geo_id '0451600' also appears in geofence_boundaries with state stored as FIPS '04' — every
--           office<->district join MUST scope district_type + mtfcc='G4110' + state='az', never bare geo_id.
```
For Marana: same geo_id-collision CRITICAL note but with `'0444270'`; add a Marana-specific CRITICAL/DEVIATION note that Post's Mayor seat and Murphy's council seat are currently held by **appointed, not elected**, officials (Pitfall 2) — flag this in the header exactly as the migration's own comment discipline demands elsewhere in this file family.

**Pre-flight guards** (lines 36-55) — copy verbatim, substitute geo_id/name:
```sql
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.geofence_boundaries
      WHERE geo_id = '0451600' AND mtfcc = 'G4110') < 1 THEN
    RAISE EXCEPTION 'Oro Valley G4110 geofence missing — run Phase 190 first';
  END IF;
END $$;

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name = 'Town of Oro Valley, Arizona, US') > 0 THEN
    RAISE EXCEPTION 'Migration 1305 already applied — aborting re-run';
  END IF;
END $$;
```
→ Marana: `geo_id = '0444270'`, name `'Town of Marana, Arizona, US'`, message `'Migration 1345 already applied — aborting re-run'`.

**Government + chamber INSERT** (lines 63-85) — copy verbatim shape:
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(), 'Town of Oro Valley, Arizona, US', 'Town', 'AZ', 'Oro Valley', '0451600'
WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE name = 'Town of Oro Valley, Arizona, US');

INSERT INTO essentials.chambers (id, name, name_formal, government_id, official_count)
SELECT gen_random_uuid(), 'Town Council', 'Oro Valley Town Council',
       (SELECT id FROM essentials.governments WHERE name = 'Town of Oro Valley, Arizona, US'), 7
WHERE NOT EXISTS (SELECT 1 FROM essentials.chambers WHERE name = 'Town Council'
    AND government_id = (SELECT id FROM essentials.governments WHERE name = 'Town of Oro Valley, Arizona, US'));
```
→ Marana: `'Town of Marana, Arizona, US'`, `city='Marana'`, `name_formal='Marana Town Council'`, `official_count=7` (Mayor + 6). Never list the auto-generated `slug` column.

**Two district rows** (lines 87-101) — copy verbatim shape, substitute geo_id/labels:
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL_EXEC', 'az', '0451600', 'Town of Oro Valley (Mayor)', 'G4110'
WHERE NOT EXISTS (SELECT 1 FROM essentials.districts WHERE geo_id = '0451600' AND district_type = 'LOCAL_EXEC' AND state = 'az');

INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'az', '0451600', 'Town of Oro Valley (At-Large)', 'G4110'
WHERE NOT EXISTS (SELECT 1 FROM essentials.districts WHERE geo_id = '0451600' AND district_type = 'LOCAL' AND state = 'az');
```
→ Marana: `geo_id='0444270'`, `label='Town of Marana (Mayor)'` / `'Town of Marana (At-Large)'`. mtfcc stays `'G4110'` on both.

**Per-official politician+office block** (repeat 7x, lines 103-332 for the Mayor/VM/5-plain-council pattern) — copy the `WITH ins_p AS (INSERT INTO politicians ...) INSERT INTO offices ...` CTE shape verbatim for each of the 7 Marana officials:
```sql
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Joseph "Joe" Winfield', 'Joseph', 'Winfield', NULL,
          true, false, false, true, -4009001)
  ON CONFLICT (external_id) DO UPDATE SET is_active = EXCLUDED.is_active
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(), d.id,
       (SELECT id FROM essentials.chambers WHERE name = 'Town Council'
        AND government_id = (SELECT id FROM essentials.governments WHERE name = 'Town of Oro Valley, Arizona, US')),
       p.id, 'Mayor', 'AZ', false, false, NULL
FROM essentials.districts d CROSS JOIN ins_p p
WHERE d.geo_id = '0451600' AND d.district_type = 'LOCAL_EXEC' AND d.state = 'az' AND d.mtfcc = 'G4110'
  AND NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id);
```
For Marana, the 7 blocks (per RESEARCH roster, subject to execute-time re-verify):
```
-4013001 Jon Post          Mayor          title='Mayor'                        LOCAL_EXEC/G4110/0444270
-4013002 Roxanne Ziegler   Council (VM)   title='Council Member (Vice Mayor)' LOCAL/G4110/0444270
-4013003 Patrick Cavanaugh Council        title='Council Member'              LOCAL/G4110/0444270
-4013004 Patti Comerford   Council        title='Council Member'              LOCAL/G4110/0444270  (open seat — confirm at execute time whether still sitting)
-4013005 Herb Kai          Council        title='Council Member'              LOCAL/G4110/0444270
-4013006 Teri Murphy       Council        title='Council Member'              LOCAL/G4110/0444270  (appointed, not yet elected to this seat — Pitfall 2)
-4013007 John Officer      Council        title='Council Member'              LOCAL/G4110/0444270
```
Party=NULL on all 7 (nonpartisan — mirrors the Oro Valley/Beaverton convention, do NOT record a value). `is_appointed=false` on all 7 politician rows (RESEARCH Assumption A4 — `is_appointed` is reserved for STATE_EXEC-tier constitutional officers per prior-phase convention, NOT used to flag Post's/Murphy's currently-appointed status; note this explicitly in the migration header per RESEARCH's own recommendation). `is_appointed_position=false`, `role_canonical=NULL` on all 7 offices.

**office_id back-fill** (lines 334-345) — copy verbatim, substitute the 7 ext_ids:
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id IN (-4009001,-4009002,-4009003,-4009004,-4009005,-4009006,-4009007)
  AND p.office_id IS NULL;
```
→ Marana: `IN (-4013001,-4013002,-4013003,-4013004,-4013005,-4013006,-4013007)`.

**Post-verify DO gate** (lines 348-467) — copy the full 7-gate shape verbatim (gate a: gov count=1; gate b: 7 offices under Town Council on the 2 G4110 districts; gate c: LOCAL_EXEC holds exactly 1 AND LOCAL holds exactly 6; gate d: party IS NULL on all 7; gate e: exactly 1 `(Vice Mayor)` office AND it belongs to the correct external_id; gate f: section-split = 0; gate g: office_id back-fill = 0 NULLs). Substitute `'0451600'`→`'0444270'`, `'Town of Oro Valley, Arizona, US'`→`'Town of Marana, Arizona, US'`, the 7 ext_ids, and the VM gate's expected external_id (`-4009002`→`-4013002` for Ziegler).

**Ledger registration** (lines 472-478, OUTSIDE `COMMIT`) — copy verbatim, substitute version number:
```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('1305')
ON CONFLICT (version) DO NOTHING;
```
→ `VALUES ('1345')` (re-verify actual disk-MAX+1 at execute time per Pitfall 6 — RESEARCH confirmed disk MAX=1344 this session, but Oro Valley's own research documented a real same-day collision risk).

---

### `C:/EV-Accounts/backend/migrations/1346_town_of_marana_headshots.sql` (migration, audit-only batch CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1306_town_of_oro_valley_headshots.sql` (read in full — 101 lines)

Copy the file-level shape verbatim: `BEGIN; ... 7x INSERT INTO essentials.politician_images ... COMMIT;` with NO ledger registration line (this file is intentionally unregistered — same as 1306).

```sql
-- Melanie Barrett (Council Member (Vice Mayor), -4009002) — c33b6be0-1192-4483-9343-28084a0f947d
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -4009002),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/c33b6be0-1192-4483-9343-28084a0f947d-headshot.jpg',
       'default', 'campaign photo, melaniebarrett.org (candidate campaign, press_use)'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -4009002)
);
```
For Marana, repeat once per official with the actual uploaded-image UUID (generated at upload time by the Python pipeline) and per-image `photo_license` text describing the real sourced provenance (do NOT use a uniform placeholder value — 1306's header comment explicitly warns `photo_license` VARIES per image). Header comment should note: (a) `maranaaz.gov` is Akamai-WAF-blocked (same signature, cite RESEARCH Pitfall 5), (b) check Ballotpedia candidate pages first for Post/Kai/Officer/Murphy (RESEARCH: 2026 candidates often have a photo already there) before falling back to `/find-headshots` Playwright, (c) `type='default'` on every row, guarded by `WHERE NOT EXISTS` on `politician_id` for idempotency.

---

### `C:/EV-Accounts/backend/migrations/1347..1353_marana_<official>_stances.sql` (7 files, audit-only batch CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1307_oro_valley_mayor_stances.sql` (read in full — 122 lines; same shape repeats across 1308-1313 for council members)

Copy the file-level shape verbatim, one file per Marana official:
```sql
BEGIN;

-- ----- Joe Winfield / growth-and-development (value 3) -----
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
VALUES ('d3009d53-a6f0-4ea0-b41d-658ce62e3753',
        'fb25c1ac-91cc-49bf-8afc-c7fa22ef45e4',
        3.0)
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET value = EXCLUDED.value;

INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
VALUES ('d3009d53-a6f0-4ea0-b41d-658ce62e3753',
        'fb25c1ac-91cc-49bf-8afc-c7fa22ef45e4',
        $$In his State of the Town addresses Winfield has framed ...$$,
        ARRAY['https://www.kgun9.com/...', ...]::text[])
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;

-- (repeat per seeded topic; SEEDED/DELIBERATELY-BLANK topic lists documented in the file header)

COMMIT;
```
Header comment discipline to copy verbatim (per-file, substituting facts): politician_id UUID + full name/title + tenure caveat (for Marana: explicitly note Post's/Murphy's appointed-not-elected status per RESEARCH Pitfall 2, since their "tenure" framing differs from a normally-elected incumbent); "EVIDENCE-ONLY / HONEST-BLANK / AUDIT-ONLY migration" boilerplate; the exact `SEEDED (N topics)` and `DELIBERATELY BLANK` topic-key lists (36 non-judicial live topics is the full universe per RESEARCH Pitfall 7 — no judicial-* topic ever seeded); AUDIT-ONLY note (touches only `inform.politician_answers` + `inform.politician_context`, no ledger registration, no `BEGIN`/structural-migration file relationship).

Sources for Marana stance research (per RESEARCH — confirmed reachable, NOT WAF-blocked): `tucsonlocalmedia.com/marana/`, `tucson.com`, `azpm.org`/`news.azpm.org`, KGUN9, Tucson Sentinel, AZ Luminaria. `maranaaz.gov` meeting agendas are ALSO WAF-blocked (Pitfall 5) — do not rely on them as a fetchable primary source at research time, though the Jan-2026 agenda PDF was already used this session via WebSearch composite to corroborate the roster.

---

### `src/lib/buildingImages.js` (config/data-map, transform)

**Analog:** existing `'oro valley'` `CURATED_LOCAL` entry, `src/lib/buildingImages.js` lines 448-456 (read directly — no re-read needed, already in context above)

Exact shape to append (insert a new comment block + entry directly after the `'oro valley'` line, before the closing `};` of `CURATED_LOCAL` at line 457):
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
```
Marana append (comment shape identical, subject substance per the chosen banner):
```javascript
// Marana community banner (Phase 196). <subject chosen by the one-at-a-time sourcing
// pass — candidate: Dove Mountain golf-course ground shot (Bernard Gagnon, CC BY-SA 3.0)
// or a Flickr-sourced Ed Honea Municipal Complex / Downtown Marana / Heritage River Park
// shot if found>, deliberately distinct from the Pima COUNTY Catalina/Pusch-Ridge landscape
// banner, the Tucson CITY downtown streetscape, the Oro Valley CDO Trail Bridge, and the AZ
// STATE Phoenix skyline — Marana sits by the Tortolita range, NOT the Catalinas (D-03 collision
// avoidance). Single-variant key; storage file cities/marana.jpg; coverage.js label 'Marana'.
//   marana        - <exact file title> | <photographer> | <license>
marana: { state: 'AZ', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/marana.jpg' },
```
Note: `marana` is a single unhyphenated word (unlike `'oro valley'`/`'las vegas'`), so it does NOT need quotes as an object key — match the plain-identifier style used by `tucson:` (line 447) and `henderson:` (line 400), not the quoted-string style used by multi-word keys.

---

### `src/lib/coverage.js` (config/data-map, transform)

**Analog:** existing Arizona block, `src/lib/coverage.js` lines 201-213 (read directly — already in context above)

Exact shape — append a 3rd entry to the EXISTING `areas[]` array (do NOT create a new `{ name: 'Arizona', ... }` block — Pitfall 8):
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
  ],
},
```
Marana append (insert as the 3rd `areas[]` entry, immediately after Oro Valley, before the closing `],`):
```javascript
    // Marana (Phase 196). Appended to the EXISTING Arizona block (not a third
    // block). hasContext:true only once stance rows actually exist in prod —
    // do NOT set true until the stance migrations (1347-1353) are applied.
    { label: 'Marana', browseGovernmentList: ['0444270'], browseStateAbbrev: 'AZ', hasContext: true },
```
`browseGovernmentList` value is the G4110 `geo_id` (`'0444270'`), matching the `['0477000']`/`['0451600']` single-element-array convention used by Tucson/Oro Valley (a plain government geo_id, not a district id).

## Shared Patterns

### Government/chamber/district/office structural shape (Torrance/Oro-Valley precedent)
**Source:** `C:/EV-Accounts/backend/migrations/1305_town_of_oro_valley.sql` (full file)
**Apply to:** `1345_town_of_marana.sql`
One `LOCAL_EXEC` district row for the Mayor + ONE shared `LOCAL` district row for all N council members (Marana: 6), both reusing an already-live G4110 geofence via `mtfcc='G4110'`, `state='az'` lowercase. Every office↔district join scopes `district_type` + `mtfcc` + `state`, never a bare `geo_id` (geo_id collides with the FIPS-keyed `geofence_boundaries` row for the same place). See excerpt above.

### Nonpartisan seeding (party=NULL)
**Source:** `1305_town_of_oro_valley.sql` politician INSERT blocks + post-verify gate (d)
**Apply to:** `1345_town_of_marana.sql`
`party` column is `NULL` on all 7 politician rows; a post-verify `DO` gate asserts `party IS NOT NULL` count = 0. Marana is confirmed nonpartisan via RESEARCH (Ballotpedia's own "At-large" candidate-page naming convention).

### Vice Mayor as title-suffix annotation (not a separate office)
**Source:** `1305_town_of_oro_valley.sql` Step 6 (Barrett) + post-verify gate (e)
**Apply to:** `1345_town_of_marana.sql` (Ziegler's office, ext_id -4013002)
`title = 'Council Member (Vice Mayor)'` on exactly one office; `role_canonical` stays `NULL` on all 7 offices; post-verify gate asserts exactly 1 office carries the `(Vice Mayor)` substring AND that its politician's external_id matches the confirmed sitting VM.

### Idempotent WHERE NOT EXISTS / ON CONFLICT guards
**Source:** every INSERT in `1305_town_of_oro_valley.sql`
**Apply to:** all Marana migrations
Governments: `WHERE NOT EXISTS` on `name`. Chambers: `WHERE NOT EXISTS` on `(name, government_id)`. Districts: `WHERE NOT EXISTS` on `(geo_id, district_type, state)`. Politicians: `ON CONFLICT (external_id) DO UPDATE SET is_active = EXCLUDED.is_active`. Offices: `WHERE NOT EXISTS (... o.district_id = d.id AND o.politician_id = p.id)`. Politician_images/politician_answers/politician_context in the audit-only files use the same `WHERE NOT EXISTS` / `ON CONFLICT (politician_id, topic_id) DO UPDATE` idiom (see 1306/1307 excerpts above).

### Post-verify DO-block gate + RAISE EXCEPTION rollback discipline
**Source:** `1305_town_of_oro_valley.sql` lines 358-467 (7 gates: gov count, office count, LOCAL_EXEC=1/LOCAL=N, party-NULL, VM-annotation-exactly-1-on-correct-seat, section-split=0, office_id-backfill=0)
**Apply to:** `1345_town_of_marana.sql`
Any gate failing `RAISE EXCEPTION` rolls back the whole `BEGIN...COMMIT` transaction — this is the safety net that prevents a partially-seeded government from ever committing.

### Frontend static-lookup append (never create a duplicate block/key)
**Source:** `src/lib/buildingImages.js` `CURATED_LOCAL` + `src/lib/coverage.js` Arizona `areas[]`
**Apply to:** `src/lib/buildingImages.js`, `src/lib/coverage.js`
Both files use flat JS object/array literals keyed by lowercase city name (space-form for multi-word, no quotes needed for single-word keys). Marana's edits are pure appends — no new top-level Arizona block, no new CURATED_LOCAL sub-structure. `hasContext: true` in `coverage.js` must only be set once ≥1 stance row actually exists in prod (Pitfall 8 / DB-honesty convention) — sequence the coverage.js edit AFTER the stance migrations apply, not before.

## No Analog Found

None. Every file this phase touches has a direct, recently-applied (Phase 195, 9 days prior) structural or config twin. The only genuinely novel work is non-code: the roster-currency re-verification (Pitfall 1/2/3) and the banner subject search (Open Question 2) — both are research/human-judgment tasks, not code patterns.

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/` (1305-1313 read in full), `src/lib/buildingImages.js` (lines 390-457 read), `src/lib/coverage.js` (lines 190-218 read), `.planning/phases/195-oro-valley-deep-seed/195-01-PLAN.md` (read in full).
**Files scanned:** 3 backend migration files read in full (1305, 1306, 1307) + 1 plan doc + 2 frontend files (targeted ranges) + `ls`/`sort -n` disk-MAX confirmation (1344).
**Pattern extraction date:** 2026-07-15
