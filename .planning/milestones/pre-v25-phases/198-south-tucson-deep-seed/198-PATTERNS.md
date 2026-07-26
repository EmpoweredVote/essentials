# Phase 198: South Tucson Deep-Seed - Pattern Map

**Mapped:** 2026-07-17
**Files analyzed:** 5 (1 structural migration + 1 headshots migration + 7 stance migrations treated as one pattern + 2 frontend files)
**Analogs found:** 5 / 5

**IMPORTANT — the single closest analog for the structural migration is now Sahuarita's OWN applied
migration (`1354_town_of_sahuarita.sql`), not the older Marana+Palm-Springs hybrid it was built from.**
South Tucson's structural shape is IDENTICAL to Sahuarita's (all at-large seats share ONE `LOCAL` district
row, NO `LOCAL_EXEC` row, council-chosen titles modeled purely via the `title` string, plain-style titles,
`role_canonical` NULL, nonpartisan `party=NULL`) with exactly TWO deltas:
1. **A THIRD council-chosen title** — South Tucson has Mayor + Vice Mayor + Acting Mayor (Sahuarita only
   has Mayor + Vice Mayor) — the post-verify gate needs a third title-assertion block, copied verbatim from
   gate (e)/(f)'s shape.
2. **`governments.type='City'`, not `'Town'`** — South Tucson is legally incorporated as a City (RESEARCH
   confirms via every source + the live Tucson `0477000` row), unlike Sahuarita/Oro-Valley/Marana which are
   legally Towns.

Additionally, this is the **first enclave-jurisdiction phase in the milestone** — the D-03 BLOCKING
routing check (`ST_Area(ST_Intersection(...))` = 0) has NO prior migration-file analog; it is a NEW
pre-flight verification pattern introduced by 198-RESEARCH.md itself (Pattern 2), to be added as an
additional pre-flight `DO` block in the structural migration.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `C:/EV-Accounts/backend/migrations/1363_city_of_south_tucson.sql` (structural; disk MAX re-verify at execute time — RESEARCH confirmed disk MAX=1362, ledger MAX=1354, next structural=1363 on 2026-07-17) | migration | CRUD (batch INSERT/idempotent-guard) | `1354_town_of_sahuarita.sql` (near-verbatim structural copy: shared-LOCAL/no-LOCAL_EXEC/title-on-seat shape) — extend to a 3rd title gate + `type='City'` | exact (same author's own precedent, 2 deltas) |
| `C:/EV-Accounts/backend/migrations/<next>_city_of_south_tucson_headshots.sql` (audit-only, unregistered) | migration | batch/file-I/O (references uploaded Storage URLs) | `1355_town_of_sahuarita_headshots.sql` | exact |
| `C:/EV-Accounts/backend/migrations/<next..next+6>_south_tucson_*_stances.sql` (audit-only, one per official, evidence-cited) | migration | batch (evidence-only CRUD) | `1356_sahuarita_mayor_stances.sql` (+ siblings `1357`-`1362`) | exact |
| `src/lib/buildingImages.js` (add `south tucson` to `CURATED_LOCAL`) | config/data-map | transform (lookup table) | Existing `sahuarita:` / `marana:` entries (lines 465-476) in the same file | exact |
| `src/lib/coverage.js` (append `South Tucson` to Arizona `COVERAGE_STATES` block) | config/data-map | transform (lookup table) | Existing `{ label: 'Sahuarita', ... }` entry (line 219) in the same Arizona block | exact |

## Pattern Assignments

### `C:/EV-Accounts/backend/migrations/1363_city_of_south_tucson.sql` (migration, batch CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1354_town_of_sahuarita.sql` — read in full; this is a
near-verbatim structural copy, not a hybrid-of-two-files reconstruction (Sahuarita's own migration already
IS the "shared-LOCAL, no-LOCAL_EXEC, title-on-seat" template South Tucson needs).

**Header/CRITICAL-note pattern to copy and adapt (1354 lines 1-68):**
```sql
-- Migration 1363: City of South Tucson government + chamber + 1 shared LOCAL district + officials + offices
--
-- Form of government (RESEARCH-confirmed 2026-07-17, MEDIUM confidence — southtucsonaz.gov itself is
-- Cloudflare-JS-challenge-blocked; corroborated 3+ ways via WebSearch composites + Tucson Spotlight/
-- AZ Luminaria news — RE-CONFIRM via Playwright render at execute time before finalizing):
--   ALL 7 seats are elected AT-LARGE, NO wards. There is NO separately-elected Mayor office. THREE
--   titles — Mayor, Vice Mayor, AND Acting Mayor — are ALL council-chosen from among the 7 members
--   (South Tucson charter: "the council shall meet on the following Tuesday for the purpose of choosing
--   a mayor from among its membership" — language structurally identical to Sahuarita's Town Code
--   2.10.010 mechanism). Extends Sahuarita's (1354) two-title hybrid to a THIRD title.
--
-- CRITICAL/DEVIATION (mirrors 1354's own DEVIATION note, extended by one title): this migration is a
--   HYBRID — the Oro-Valley/Marana/Sahuarita "all at-large members share ONE LOCAL district row" DB
--   shape, MINUS any LOCAL_EXEC row (there is no separately-elected office it would represent), PLUS the
--   Palm-Springs/Sahuarita title-on-seat modeling — Mayor/Vice-Mayor/Acting-Mayor live PURELY in the
--   `title` string, `role_canonical` NULL on all 7, and a post-verify gate asserting "exactly 1 office
--   titled Mayor" / "exactly 1 titled Vice Mayor" / "exactly 1 titled Acting Mayor" — THREE independent
--   gates, not two. DO NOT create a LOCAL_EXEC row anywhere in this file.
--
-- CRITICAL: the generated identifier column (slug) on essentials.chambers is NEVER included in an INSERT.
-- CRITICAL: essentials.governments has NO unique constraint on geo_id — use WHERE NOT EXISTS guard on name.
-- CRITICAL: districts.state must be 'az' (lowercase) to match routing queries.
-- CRITICAL: governments.state = 'AZ' (uppercase). offices.representing_state = 'AZ' (uppercase).
-- CRITICAL: at-large council — NO ward geofences; ALL 7 offices share ONE LOCAL district row. NO
--           LOCAL_EXEC row exists in this file.
-- CRITICAL: the single LOCAL row carries mtfcc='G4110' (reuse the live Phase-190 geofence, geo_id='0468850').
-- CRITICAL: party = NULL for all 7 (nonpartisan, per AZ Luminaria "South Tucson elections are
--           nonpartisan") — do NOT record a party.
-- CRITICAL: geo_id '0468850' is South Tucson's own FIPS place code — DISTINCT from Tucson's '0477000'.
--           Every office<->district join MUST scope district_type='LOCAL' + mtfcc='G4110' + state='az'.
--
-- DEVIATION NOTE (governments.type): South Tucson is legally incorporated as a CITY (every source this
--   session — never "Town"), matching the Tucson (194) `0477000` row's type='City' — NOT the Oro-Valley/
--   Marana/Sahuarita Town convention. Confirm against the live Tucson row at author time.
--
-- CRITICAL (roster + title currency — RESEARCH's #1 risk, mirrors 1354's Task-2-style BLOCKING gate,
--   sharper here): South Tucson's July 21, 2026 primary is 4 days from the 2026-07-17 research date. 3
--   of 7 seats are up (Valenzuela, Flagg, Aguirre) — and the sitting MAYOR (Valenzuela) is HERSELF one
--   of the 3 incumbent candidates. Even a "no membership change" outcome does not resolve whether the
--   post-election council re-selects the same Mayor/Vice-Mayor/Acting-Mayor. A BLOCKING re-verify task
--   must independently confirm BOTH membership AND all 3 title holders before this migration is applied.
```

**D-03 BLOCKING enclave pre-flight — NO prior migration-file analog; copy directly from 198-RESEARCH.md
Code Examples (novel pattern, first enclave phase in the milestone):**
```sql
-- =============================================================================
-- Pre-flight (0): D-03 BLOCKING enclave-routing re-check — South Tucson's polygon must NOT overlap
-- Tucson's polygon in AREA (a true donut hole is the safe, expected signature; ST_Intersects alone
-- would misleadingly return true for merely-touching boundary edges). Re-run RESEARCH's exact query.
-- =============================================================================
DO $$
DECLARE
  v_intersection_sqkm NUMERIC;
BEGIN
  SELECT ST_Area(ST_Intersection(st.geometry, tuc.geometry)::geography) / 1e6
  INTO v_intersection_sqkm
  FROM essentials.geofence_boundaries st, essentials.geofence_boundaries tuc
  WHERE st.geo_id = '0468850' AND tuc.geo_id = '0477000';

  IF v_intersection_sqkm IS NULL OR v_intersection_sqkm > 0.001 THEN
    RAISE EXCEPTION 'D-03 BLOCKING enclave check FAILED: South Tucson/Tucson intersection area = % sqkm (expected ~0, a clean donut hole) — do NOT proceed', v_intersection_sqkm;
  END IF;
END $$;
```
Run this BEFORE the standard geofence-existence pre-flight (1354's pre-flight (1) pattern, re-scoped to
`geo_id='0468850'`). This is a genuinely new pre-flight class this phase introduces — no other migration
in the codebase has an enclave check; document it inline as the "Pattern 2" reference from RESEARCH.

**Government/chamber row pattern (1354 lines 100-122, substitute facts):**
```sql
-- Step 1: Government row (greenfield; type='City' — South Tucson deviation, see header DEVIATION NOTE)
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'City of South Tucson, Arizona, US',
       'City', 'AZ', 'South Tucson', '0468850'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'City of South Tucson, Arizona, US'
);

-- Step 2: City Council chamber (generated slug column omitted intentionally)
INSERT INTO essentials.chambers (id, name, name_formal, government_id, official_count)
SELECT gen_random_uuid(),
       'City Council',
       'South Tucson City Council',
       (SELECT id FROM essentials.governments WHERE name = 'City of South Tucson, Arizona, US'),
       7
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'City Council'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'City of South Tucson, Arizona, US')
);
```

**District row pattern (1354 lines 124-133 — ONE new LOCAL row, NO LOCAL_EXEC, verbatim shape):**
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'az', '0468850', 'City of South Tucson (At-Large)', 'G4110'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '0468850' AND district_type = 'LOCAL' AND state = 'az'
);
```

**Office/politician block pattern — copy the `WITH ins_p AS (...) INSERT INTO offices` shape verbatim
7 times (1354 lines 135-366), substituting names/ext_ids/titles:**
```sql
-- Step 4: Roxanna Valenzuela (-4015001) — title='Mayor' (council-chosen; re-verify at BLOCKING task
--         before apply, since she is herself an incumbent candidate in the imminent primary)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Roxanna Valenzuela', 'Roxanna', 'Valenzuela', NULL,
          true, false, false, true, -4015001)
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
                               WHERE name = 'City of South Tucson, Arizona, US')),
       p.id,
       'Mayor', 'AZ', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '0468850'
  AND d.district_type = 'LOCAL'
  AND d.state = 'az'
  AND d.mtfcc = 'G4110'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```
Repeat identically for the other 6 (external_ids `-4015002..-4015007`): Brown-Dominguez=`'Vice Mayor'`,
Robles=`'Acting Mayor'`, Jimenez/Diaz/Flagg/Aguirre=`'Council Member'`. All 7: `party=NULL`,
`is_active=true`, `is_incumbent=true`, `is_vacant=false`, `is_appointed=false`,
`representing_state='AZ'`, `is_appointed_position=false`, `role_canonical=NULL`. Greenfield —
`ON CONFLICT (external_id) DO NOTHING` (NOT Marana's `DO UPDATE`).

**office_id back-fill (1354 lines 368-379, verbatim shape, substitute ext_id list):**
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id IN (-4015001,-4015002,-4015003,-4015004,-4015005,-4015006,-4015007)
  AND p.office_id IS NULL;
```

**Post-verify gate — copy gates (a)-(d), (g), (h) verbatim from 1354; EXTEND (e)/(f) to a THIRD gate (i)
for Acting Mayor (1354 lines 393-536, esp. the Mayor gate at lines 471-489 as the exact template to
triplicate):**
```sql
-- Gate (e): exactly 1 office title='Mayor' bound to external_id=-4015001 (Valenzuela)
SELECT COUNT(*) INTO v_mayor_count
FROM essentials.offices o
JOIN essentials.districts d ON d.id = o.district_id
WHERE d.geo_id = '0468850' AND d.mtfcc = 'G4110' AND d.state = 'az'
  AND o.title = 'Mayor';
IF v_mayor_count <> 1 THEN
  RAISE EXCEPTION 'Post-verification FAILED: expected exactly 1 office with title=Mayor, found %', v_mayor_count;
END IF;

SELECT p.external_id INTO v_mayor_extid
FROM essentials.offices o
JOIN essentials.districts d ON d.id = o.district_id
JOIN essentials.politicians p ON p.id = o.politician_id
WHERE d.geo_id = '0468850' AND d.mtfcc = 'G4110' AND d.state = 'az'
  AND o.title = 'Mayor';
IF v_mayor_extid <> -4015001 THEN
  RAISE EXCEPTION 'Post-verification FAILED: Mayor title is on external_id % — expected -4015001 (Roxanna Valenzuela)', v_mayor_extid;
END IF;

-- Gate (f): exactly 1 office title='Vice Mayor' bound to external_id=-4015002 (Brown-Dominguez)
-- [identical shape, substitute 'Vice Mayor' / -4015002]

-- Gate (i) [NEW — South Tucson's 3rd title, no Sahuarita equivalent]:
-- exactly 1 office title='Acting Mayor' bound to external_id=-4015003 (Robles)
SELECT COUNT(*) INTO v_am_count
FROM essentials.offices o
JOIN essentials.districts d ON d.id = o.district_id
WHERE d.geo_id = '0468850' AND d.mtfcc = 'G4110' AND d.state = 'az'
  AND o.title = 'Acting Mayor';
IF v_am_count <> 1 THEN
  RAISE EXCEPTION 'Post-verification FAILED: expected exactly 1 office with title=Acting Mayor, found %', v_am_count;
END IF;

SELECT p.external_id INTO v_am_extid
FROM essentials.offices o
JOIN essentials.districts d ON d.id = o.district_id
JOIN essentials.politicians p ON p.id = o.politician_id
WHERE d.geo_id = '0468850' AND d.mtfcc = 'G4110' AND d.state = 'az'
  AND o.title = 'Acting Mayor';
IF v_am_extid <> -4015003 THEN
  RAISE EXCEPTION 'Post-verification FAILED: Acting Mayor title is on external_id % — expected -4015003 (Pablo Robles)', v_am_extid;
END IF;
```
Also copy gate (a) government-row-count=1, gate (b)/(c) office-count=7-all-LOCAL-zero-non-LOCAL, gate (d)
party-NULL/is_appointed=false, gate (g) section-split=0, gate (h) office_id-backfill=0-NULLs — all
verbatim from 1354, re-scoped to `geo_id='0468850'` and the South Tucson government name.

**Ledger registration (1354 lines 541-548, verbatim shape, substitute version number):**
```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('1363')
ON CONFLICT (version) DO NOTHING;
```
Re-verify disk MAX at execute time (RESEARCH confirmed 1362 as of 2026-07-17 — re-run `ls
C:/EV-Accounts/backend/migrations | sort -n | tail -5` before naming the file).

---

### `C:/EV-Accounts/backend/migrations/<next>_city_of_south_tucson_headshots.sql` (migration, audit-only batch)

**Analog:** `1355_town_of_sahuarita_headshots.sql`

**Full pattern (one block shown, repeat x7):**
```sql
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -4015001),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/<UUID>-headshot.jpg',
       'default', '<source description — see below>'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -4015001)
);
```
South Tucson adaptation: substitute the 7 external_ids (`-4015001..-4015007`), each official's Storage
UUID (post-upload), and `photo_license` text describing the ACTUAL source per D-06's order (direct
southtucsonaz.gov fetch first — but RESEARCH confirms this site is Cloudflare-JS-challenge-blocked to
non-browser clients, so `/find-headshots` Playwright fallback is the EXPECTED effective path here, a
different vendor signature than Sahuarita's CivicPlus soft-block; also try `/directory` staff page
alongside `/citycouncil`; then Ballotpedia/Wikimedia/news). Audit-only — does NOT register in the ledger.
`type='default'` for all 7.

---

### `C:/EV-Accounts/backend/migrations/<next..next+6>_south_tucson_*_stances.sql` (migration, audit-only batch, one per official)

**Analog:** `1356_sahuarita_mayor_stances.sql` (+ siblings `1357`-`1362`)

**Header/documentation pattern (evidence log + DELIBERATELY BLANK convention — copy shape verbatim):**
```sql
-- SEEDED (N topics):
--   <topic-slug>              = <value>  (<1-line justification citing a dated, named source>)
--   ...
-- DELIBERATELY BLANK (no clean, attributable documented position found):
--   Local: <list>
--   Non-local federal/state (a city councilmember has no record on these): <list>
--   (No judicial-* topic is ever seeded.)
```

**Per-topic INSERT pair pattern (identical to Sahuarita's — dollar-quoting + text[] sources):**
```sql
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
VALUES ('<politician-uuid>', '<topic-uuid>', <value>.0)
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET value = EXCLUDED.value;

INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
VALUES ('<politician-uuid>', '<topic-uuid>',
        $$<reasoning text, quoting/citing sources inline>$$,
        ARRAY['<source-url-1>', '<source-url-2>']::text[])
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;
```
South Tucson adaptation: one file per official (7 files), evidence-only against the 36 non-judicial live
`compass_topics` (RESEARCH-confirmed count, same as every prior AZ phase: 44 live / 8 judicial excluded).
Salient local issues flagged by RESEARCH: public safety/policing (Mayor Valenzuela's stated top priority),
city budget/department funding, the Mercado/South-4th-Ave small-business corridor. Use
`azluminaria.org`, `tucsonspotlight.org`, `tucson.com`, `tucsonsentinel.com`, `kgun9.com` as confirmed-
reachable evidence sources (RESEARCH confirms these are NOT WAF-blocked, unlike southtucsonaz.gov
itself). No default values — honest blanks per the DELIBERATELY BLANK convention. `$$...$$` dollar-
quoting and `ARRAY[...]::text[]` are both verbatim-reusable conventions.

---

### `src/lib/buildingImages.js` (config/data-map, transform)

**Analog:** existing `sahuarita:` entry (lines 466-476) and `marana:` entry (lines 457-465)

```javascript
// Sahuarita community banner (Phase 197). Sahuarita Lake (Rancho Sahuarita) in the
// foreground with the Santa Rita Mountains (Mount Wrightson, due south) on the horizon —
// ... [distinctiveness note] ...
// STATE Phoenix skyline. Southern/Santa-Cruz-Valley identity (D-03 — no Catalinas, no
// Tortolita). Single-variant single-word key (no same-named-city collision); storage
// cities/sahuarita.jpg.
//   sahuarita     - View from the northern edge of Sahuarita Lake (winter 2007) | Brian Basgen | CC BY-SA 3.0
sahuarita: { state: 'AZ', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/sahuarita.jpg' },
```
South Tucson append (after the `sahuarita:` entry, before the closing `};` at line 477): a comment block
in the same style documenting the chosen banner subject. Per D-04/RESEARCH: the front-runner (a
Chicano/community mural) has NO confirmed Commons-licensed photo this session — the execution-phase
sourcing pass should attempt a dedicated Flickr/Borderlore search for one of the 3 named South Tucson
murals (La Tusa/Tattoo Mural, Amor Querido, El Pueblo Viejo Salsa) first; if none is found at usable
resolution/license, fall back to one of the 2 verified Commons candidates ("South Tucson city limits
from 6th ave." or "South Tucson City Hall," both CC BY-SA 4.0, 2,816×2,112, Rgper22008 2009) or the
"Star motel south tucson" streetscape candidate (CC BY 2.0, Dan DeLuca/Flickr 2017, 3,840×2,866).
Explicitly note the comment is deliberately distinct from Pima's Catalinas, Oro Valley's CDO bridge,
Marana's Tortolita/Dove-Mountain, Tucson's Hotel Congress, Sahuarita's Lake/Santa-Ritas, and the AZ-state
Phoenix skyline — this is the ONE covered jurisdiction whose banner should read as people/street/art
rather than landscape (D-04). Key: `'south tucson':` (must be quoted — contains a space, matching the
`'oro valley':` precedent's quoting convention), `src` pointing to `cities/south-tucson.jpg` (hyphenated).

---

### `src/lib/coverage.js` (config/data-map, transform)

**Analog:** existing `{ label: 'Sahuarita', ... }` entry in the Arizona `COVERAGE_STATES` block (line 219)

```javascript
// Sahuarita (Phase 197). Appended to the EXISTING Arizona block (not a second block);
// Plan 03 seeded 14 evidence-only compass stances across the 7 Sahuarita officials, so
// hasContext:true is honest. Pima County stays in COVERAGE_COUNTIES (untouched).
{ label: 'Sahuarita', browseGovernmentList: ['0462140'], browseStateAbbrev: 'AZ', hasContext: true },
```
South Tucson: APPEND a 6th entry directly after the `Sahuarita` line (do NOT create a new
`{ name: 'Arizona', ... }` block — RESEARCH Pitfall 7 explicitly flags this as the anti-pattern, and the
Arizona block already has 5 entries: Tucson, Oro Valley, Marana, Sahuarita — this phase is the 6th):
```javascript
{ label: 'South Tucson', browseGovernmentList: ['0468850'], browseStateAbbrev: 'AZ', hasContext: true },
```
`hasContext: true` only once ≥1 stance row actually exists in the DB (per the established convention in
every prior entry's comment) — set only after the stance migrations are applied.

## Shared Patterns

### Idempotency guard convention (all migrations)
**Source:** `1354_town_of_sahuarita.sql` (and its own upstream analogs `1345_town_of_marana.sql` /
`1329_palm_springs_city_council.sql`)
**Apply to:** The structural migration
`WHERE NOT EXISTS (...)` guards on every INSERT keyed by the natural-language identity (government `name`,
chamber `(name, government_id)`, district `(geo_id, district_type, state)`, office `(district_id,
politician_id)`); politicians use `ON CONFLICT (external_id) DO NOTHING` (greenfield, no pre-existing rows).

### Section-split anti-pattern gate (all structural migrations)
**Source:** `1354_town_of_sahuarita.sql` lines 511-522
**Apply to:** The structural migration's post-verify DO block, re-scoped to `geo_id='0468850'` and
`'City of South Tucson, Arizona, US'`.

### Nonpartisan/antipartisan party=NULL gate
**Source:** `1354_town_of_sahuarita.sql` lines 450-459 (Gate d)
**Apply to:** The structural migration — assert all 7 politicians have `party IS NULL`.

### THREE-way title-on-seat gate (Mayor / Vice Mayor / Acting Mayor) — extends Sahuarita's two-gate pattern
**Source:** `1354_town_of_sahuarita.sql` lines 471-509 (gates (e)/(f) — the exact shape to triplicate)
**Apply to:** The structural migration's post-verify DO block — three independent, structurally identical
gates (`COUNT(*)=1` + `external_id` bound-check), one per title. This is the single most important
structural delta this phase introduces relative to its own closest analog.

### D-03 enclave-routing verification (`ST_Area(ST_Intersection(...))`) — NEW pattern, no prior analog
**Source:** `198-RESEARCH.md` § Pattern 2 / § Code Examples (novel this phase — South Tucson is the first
enclave/wholly-surrounded jurisdiction in the milestone)
**Apply to:** An additional pre-flight `DO` block in the structural migration, run BEFORE the standard
geofence-existence pre-flight. Re-run the exact query at execute time in case the geofence data changed.

### Evidence-only stance citation format (dollar-quoting + text[] sources array)
**Source:** `1356_sahuarita_mayor_stances.sql`
**Apply to:** All 7 South Tucson stance migration files — `$$...$$` for reasoning, `ARRAY['url1','url2']::text[]`
for sources, `ON CONFLICT (politician_id, topic_id) DO UPDATE SET ...` for both `politician_answers` and
`politician_context`.

### CURATED_LOCAL banner comment convention (distinctiveness-vs-prior-banners note)
**Source:** `src/lib/buildingImages.js` lines 448-476 (Oro Valley, Marana, Sahuarita entries)
**Apply to:** The new `'south tucson':` entry — every prior AZ banner comment explicitly states which
other AZ banners (county/city/state) it is deliberately distinct from; the South Tucson entry should do
the same (Catalinas=Pima/Oro-Valley, Dove-Mountain=Marana, Hotel-Congress=Tucson, Lake/Santa-Ritas=Sahuarita,
Phoenix-skyline=AZ-state) and additionally note it is the milestone's one cultural/urban (not landscape)
banner subject.

### coverage.js single-block-append convention
**Source:** `src/lib/coverage.js` lines 201-221
**Apply to:** The `areas` array append — never create a second `{ name: 'Arizona', ... }` block; always
append inside the existing one's `areas: [...]` array (this will be the 6th entry), following each prior
entry's inline comment style documenting which phase added it and why `hasContext` is true.

## No Analog Found

None as *files* — all 5 files this phase touches have a directly reusable analog (Sahuarita's own
migrations for the 3 backend files; existing `sahuarita:`/`marana:`/`{label:'Sahuarita'}` entries for the
2 frontend files). The one genuinely novel element is the **D-03 enclave-routing pre-flight check**
(`ST_Area(ST_Intersection(...))`), which has no prior migration-file precedent — its source is
`198-RESEARCH.md` itself (Pattern 2 / Code Examples), not an existing codebase file. It should be
authored as a new pre-flight `DO` block, not searched for elsewhere.

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/` (Sahuarita 1354-1362, and by extension its
own upstream analogs Marana 1345-1349 / Palm Springs 1329), `src/lib/buildingImages.js`,
`src/lib/coverage.js`
**Files scanned:** 3 migration files read directly (1354 in full; 1355, 1356 confirmed via 197-PATTERNS.md
extraction + direct grep) + 2 frontend files (targeted grep with context)
**Pattern extraction date:** 2026-07-17

## PATTERN MAPPING COMPLETE

**Phase:** 198 - south-tucson-deep-seed
**Files classified:** 5 (1 structural migration + 1 headshots migration + 7 stance-migration set + 2 frontend appends)
**Analogs found:** 5 / 5

### Coverage
- Files with exact analog: 5 (structural migration is a near-verbatim copy of Sahuarita's own 1354 with 2
  deltas — 3rd title gate + `type='City'`; headshots migration, stance migrations, buildingImages.js,
  coverage.js are all direct structural analogs of their Sahuarita equivalents)
- Files with hybrid-match analog: 0 (Sahuarita's own migration already IS the hybrid shape needed —
  no reconstruction from two older files required this time)
- Files with no analog: 0 (the one novel element, the enclave pre-flight check, is a new pattern sourced
  from RESEARCH.md itself, not a missing-file gap)

### Key Patterns Identified
- The structural migration is now a near-verbatim copy of Sahuarita's own applied migration
  (`1354_town_of_sahuarita.sql`) rather than a fresh two-file hybrid reconstruction — extend it by exactly
  two deltas: (1) a THIRD title-on-seat gate (Acting Mayor, alongside Mayor/Vice Mayor), copying gate
  (e)/(f)'s exact shape a third time; (2) `governments.type='City'` instead of `'Town'`.
- All migrations use `WHERE NOT EXISTS` / `ON CONFLICT ... DO NOTHING` idempotency guards, a mandatory
  post-verify `DO $$ ... RAISE EXCEPTION $$` gate block (row counts, party-NULL, section-split, THREE
  title-counts), and ledger registration OUTSIDE the `BEGIN`/`COMMIT` transaction for the structural
  migration only (headshots/stances migrations are audit-only and never register).
- This phase introduces the milestone's FIRST enclave-routing pre-flight check
  (`ST_Area(ST_Intersection(...))` = 0), which has no prior migration-file analog — author it fresh from
  RESEARCH.md's Pattern 2 / Code Examples, placed as an additional pre-flight `DO` block before the
  standard geofence-existence assertion.
- Stance migrations follow the same strict evidence-only convention as every prior AZ phase: `$$...$$`
  dollar-quoted reasoning citing named, dated, quoted sources; `ARRAY[...]::text[]` sources; explicit
  "DELIBERATELY BLANK" documentation of topics with no citable position.
- Frontend touches are pure appends to existing arrays (`CURATED_LOCAL` object literal, Arizona
  `COVERAGE_STATES` block's `areas` array, now becoming a 6th entry) — never create a new state block or
  duplicate structure.

### File Created
`.planning/phases/198-south-tucson-deep-seed/198-PATTERNS.md`

### Ready for Planning
Pattern mapping complete. Planner can now reference Sahuarita's own 1354 migration as the near-verbatim
structural analog (extended by the 3rd-title gate + `type='City'` delta), the headshots/stances/frontend
analogs directly, and RESEARCH.md's Pattern 2 for the novel enclave pre-flight check.
