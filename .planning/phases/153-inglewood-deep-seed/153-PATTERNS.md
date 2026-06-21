# Phase 153: Inglewood Deep-Seed - Pattern Map

**Mapped:** 2026-06-21
**Files analyzed:** 4 new migration files (1018–1021+)
**Analogs found:** 4 / 4

---

## File Classification

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `1018_inglewood_reconcile.sql` | migration | CRUD (structural) | `1010_west_covina_reconcile.sql` + `1000_elmonte_reconcile.sql` | exact (dual-chamber-merge = WC; directly-elected Mayor kept as-is = EM) |
| `1019_inglewood_complete.sql` | migration | CRUD (structural) | `1001_elmonte_complete.sql` | exact (create new member + back-pointer repair + official_count excludes Mayor) |
| `1020_inglewood_headshots.sql` | migration | file-I/O + CRUD | `1002_elmonte_headshots.sql` + `1012_west_covina_headshots.sql` | exact (EM = greenfield INSERT pattern; WC = UPDATE existing + photo_origin_url on politicians) |
| `1021_inglewood_*_stances.sql` (×5) | migration | CRUD | `1013_tony_wu_stances.sql` + `1017_brian_gutierrez_stances.sql` | exact (paired answers+context; CHAIRS model; honest blanks) |

---

## Pattern Assignments

### `1018_inglewood_reconcile.sql` (structural, registers in schema_migrations)

**Primary analog:** `C:/EV-Accounts/backend/migrations/1010_west_covina_reconcile.sql`
**Secondary analog:** `C:/EV-Accounts/backend/migrations/1000_elmonte_reconcile.sql`

The file must combine: geo_id backfill (both analogs), dual-chamber merge (1010), one-directional link repair (1010), Eloy Morales dedup + photo migrate (new for this phase — see pattern below), by-district relabel with shared-district split guard (1010/1000), and keep directly-elected Mayor as-is (1000).

#### Pattern 1: File header + scope comment

Copy the 1010 header format verbatim, substituting Inglewood UUIDs and describing all 5 operations. Key items to document: SURVIVOR = `a25a6dea`, DOOMED = `8b99bcf0`, gov = `af811c4b`. Note that the Mayor is directly-elected LOCAL_EXEC (El Monte model, NOT West Covina's rotational).

**From `1010_west_covina_reconcile.sql` lines 1–39:**
```sql
-- 1010_west_covina_reconcile.sql
-- Phase 152 Wave 1 (WCOV-01): reconcile City of West Covina structural defects.
-- Gov 1982a9fa-dc56-482d-83fc-27bf69458b22 'City of West Covina, California, US'.
-- STRUCTURAL migration (registers in supabase_migrations.schema_migrations). Idempotent.
-- ...
-- Fixes:
--   (1) Backfill geo_id ...
--   (2) Merge the two duplicate 'City Council' chambers via move-then-delete: ...
--   (3) Repair the two one-directional links ...
--   (4) BY-DISTRICT form of government ...
```

#### Pattern 2: geo_id backfill (empty-string-safe guard)

**From `1010_west_covina_reconcile.sql` lines 43–47:**
```sql
UPDATE essentials.governments
   SET geo_id = '0684200'
 WHERE id = '1982a9fa-dc56-482d-83fc-27bf69458b22'
   AND (geo_id IS NULL OR geo_id = '');
```
**For Inglewood substitute:** geo_id `'0636546'`, gov id `'af811c4b-e4da-4f30-ac33-9a7fe7d434ba'`.

#### Pattern 3: Dual-chamber merge — move-then-assert-then-delete (UUID-targeted)

Both chambers share name 'City Council' / slug `inglewood-city-council`. Target by UUID ONLY.

**From `1010_west_covina_reconcile.sql` lines 49–64:**
```sql
-- Move ALL doomed-chamber offices into survivor FIRST.
-- Target by UUID ONLY (both chambers share name 'City Council' / slug '...').
UPDATE essentials.offices
   SET chamber_id = '12c9360a-60ac-476f-b2ac-055a26e891a0'  -- survivor
 WHERE chamber_id = 'b1a2c4cb-25b6-46c8-a3ab-852024e00f45'; -- doomed

-- Assert the doomed chamber is empty before deleting it.
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.offices
        WHERE chamber_id = 'b1a2c4cb-25b6-46c8-a3ab-852024e00f45') > 0 THEN
    RAISE EXCEPTION 'Chamber b1a2c4cb still has offices; aborting before delete';
  END IF;
END $$;

DELETE FROM essentials.chambers WHERE id = 'b1a2c4cb-25b6-46c8-a3ab-852024e00f45';
```
**For Inglewood substitute:** survivor `'a25a6dea-7f26-4f5e-bc6a-2a5d321063d5'`, doomed `'8b99bcf0-813d-459a-b7e1-f82e12080ffc'`.

#### Pattern 4: One-directional link repair (offices.politician_id set, politicians.office_id NULL)

**From `1010_west_covina_reconcile.sql` lines 66–75:**
```sql
-- Guarded IS DISTINCT FROM.
UPDATE essentials.politicians
   SET office_id = 'abd27abb-42c6-4734-b683-5fac4d978174'
 WHERE id = 'f5bf4ec4-7d1b-460e-b4e2-539826c59596'
   AND office_id IS DISTINCT FROM 'abd27abb-42c6-4734-b683-5fac4d978174'; -- Diaz
```
**For Inglewood:** 3 one-directional links in the DOOMED chamber before the move:
- Butts `f5775ca1` → office `90121859`
- Eloy-Jr `ff97a6bb` → office `7fd55592`
- Dotson `3e73448b` → office `6b20a733`

Repair these BEFORE the chamber merge move (repair the back-pointer so both links are live when the office moves to the survivor). The guard `AND office_id IS DISTINCT FROM '<office_uuid>'` prevents no-op re-runs.

#### Pattern 5: Eloy Morales dedup + photo migrate (NEW for this phase; no prior analog)

No exact file precedent exists; the pattern is assembled from the `unlink-not-delete` idiom used in every prior reconcile + the RESEARCH.md code example. The RESEARCH.md §Code Examples documents the intended shape:

```sql
-- Step 1: migrate the image row from dup (ff97a6bb / -201081) to survivor (6ed19c10 / 666263)
-- (Do this BEFORE unlinking so the row's politician_id is still traceable)
UPDATE essentials.politician_images
   SET politician_id = (SELECT id FROM essentials.politicians WHERE external_id = 666263)
 WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -201081);

-- Step 2: null the dup's office pointer (the dup office 7fd55592 no longer holds anyone)
UPDATE essentials.offices
   SET politician_id = NULL
 WHERE id = '7fd55592-XXXX-XXXX-XXXX-XXXXXXXXXXXX'  -- resolve at apply time from pre-flight
   AND politician_id IS NOT NULL;

-- Step 3: null the dup politician's office pointer
UPDATE essentials.politicians
   SET office_id = NULL
 WHERE external_id = -201081
   AND office_id IS NOT NULL;

-- Do NOT DELETE dup politician or image row.
```
IMPORTANT: Resolve office UUID `7fd55592` by querying at apply time, not by hardcoding from this document. The dup politician UUID `ff97a6bb` is confirmed in CONTEXT.md and is safe to use directly.

#### Pattern 6: Shared-district check + by-district relabel (with optional new-row creation)

For Inglewood the district map is confirmed: Gray D1 (office `8e9b0c61`), Faulk D4 (office `35b92278`), Eloy D3 (office `ddcd280b`) in survivor; the Dotson/Padilla seats will be D1-adjacent after Dotson unlink (the office `6b20a733` moved from DOOMED is reassigned to District 1 or becomes the Padilla D2 seat — resolve at pre-flight). The shared-district check is MANDATORY pre-flight.

**From `1010_west_covina_reconcile.sql` lines 79–99** (insert new district row + repoint displaced occupant + relabel single-occupant rows):
```sql
-- Create new district row for displaced occupant (guarded NOT EXISTS).
INSERT INTO essentials.districts (label, district_type, geo_id, state)
SELECT 'District 3', 'LOCAL', '0684200', 'CA'
 WHERE NOT EXISTS (SELECT 1 FROM essentials.districts WHERE label = 'District 3' AND geo_id = '0684200');

-- Repoint displaced occupant off the shared row to the new row.
UPDATE essentials.offices
   SET district_id = (SELECT id FROM essentials.districts WHERE label = 'District 3' AND geo_id = '0684200')
 WHERE id = 'abd27abb-42c6-4734-b683-5fac4d978174'
   AND district_id IS DISTINCT FROM
       (SELECT id FROM essentials.districts WHERE label = 'District 3' AND geo_id = '0684200');

-- Relabel single-occupant rows (guarded IS DISTINCT FROM).
UPDATE essentials.districts SET label = 'District 1'
 WHERE id = '0e70a17e-2ed9-434b-bfac-284eae4a1358' AND label IS DISTINCT FROM 'District 1';
```
**For Inglewood:** substitute geo_id `'0636546'`, state `'CA'`. District-to-office map:
- `8e9b0c61` (Gray) → District 1
- (Padilla D2 seat — either locate in pre-flight or create D2 fresh in 1019)
- `ddcd280b` (Eloy 666263, survivor) → District 3
- `35b92278` (Faulk) → District 4

#### Pattern 7: Directly-elected Mayor kept as-is (El Monte model)

**From `1000_elmonte_reconcile.sql` lines 93–94 (comment):**
```sql
-- (4) Mayor Ancona (office 57d646fc, district 2c00ef36 'El Monte Mayor' LOCAL_EXEC) untouched.
```
**For Inglewood:** Mayor Butts office `90121859` (moved from DOOMED to SURVIVOR during step 3 move). After moving, Butts's office remains LOCAL_EXEC with title 'Inglewood Mayor' — no district_type change, no label change. Add a comment confirming this explicitly (mirrors El Monte's "untouched" comment).

#### Pattern 8: Structural migration ledger registration

**From `1010_west_covina_reconcile.sql` lines 110–113:**
```sql
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('1010', 'west_covina_reconcile')
ON CONFLICT (version) DO NOTHING;
```
**For Inglewood:** version `'1018'`, name `'inglewood_reconcile'`. Placed AFTER the `COMMIT;` (outside the transaction, so it survives even if the transaction block rolls back on a re-run).

#### Pattern 9: Post-verification comments block

**From `1010_west_covina_reconcile.sql` lines 115–128:** Copy the block verbatim and adapt the SELECT queries for Inglewood's UUIDs and geo_id `'0636546'`. Include the split-section check query and the expected 0-rows result.

---

### `1019_inglewood_complete.sql` (structural, registers in schema_migrations)

**Primary analog:** `C:/EV-Accounts/backend/migrations/1001_elmonte_complete.sql`
**Secondary analog:** `C:/EV-Accounts/backend/migrations/1011_west_covina_complete.sql`

Handles: Dotson unlink, Padilla locate-or-create, back-pointer repair for all 5 current officials, official_count=4 (council only; Mayor excluded — El Monte convention).

#### Pattern 10: Unlink departed member (Dotson)

**From `1001_elmonte_complete.sql` context** (unlink-not-delete pattern implicit in every prior reconcile; the explicit shape is):
```sql
-- Unlink departed: null both pointers, KEEP politician + stance + photo rows.
UPDATE essentials.offices
   SET politician_id = NULL
 WHERE id = '6b20a733-XXXX-XXXX-XXXX-XXXXXXXXXXXX'  -- Dotson's office; resolve UUID at pre-flight
   AND politician_id IS NOT NULL;

UPDATE essentials.politicians
   SET office_id = NULL
 WHERE external_id = -201082  -- Dotson
   AND office_id IS NOT NULL;
```
Guard with `IS NOT NULL` to make idempotent.

#### Pattern 11: Create new politician + office + back-pointer (for Padilla D2 if absent from DB)

**From `1001_elmonte_complete.sql` lines 32–71:**
```sql
-- A1: Insert politician row (guarded by external_id conflict)
INSERT INTO essentials.politicians
  (id, external_id, full_name, first_name, last_name,
   is_active, is_appointed, is_incumbent, is_vacant,
   source, alternate_names)
VALUES
  (gen_random_uuid(), -701001, 'Marisol Cortez', 'Marisol', 'Cortez',
   true, false, true, false,
   'ci.el-monte.ca.us', '{}')
ON CONFLICT (external_id) DO NOTHING;

-- A2: Create the NEW office in the survivor chamber (guarded NOT EXISTS on chamber_id + district_id).
INSERT INTO essentials.offices
  (id, politician_id, chamber_id, district_id, title, representing_state, representing_city,
   description, seats, normalized_position_name, partisan_type, salary,
   is_appointed_position, is_vacant, faces_retention_vote)
SELECT
  gen_random_uuid(),
  (SELECT id FROM essentials.politicians WHERE external_id = -701001),
  '5ca38f3a-ea2e-4160-abb5-f897702b6cb6',
  '0e2b4e3b-be0b-4919-b0b2-f19ce898b23b',
  'Councilmember', 'CA', 'El Monte',
  '', 0, 'Council Member', '', '',
  false, false, false
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.offices
   WHERE chamber_id = '5ca38f3a-ea2e-4160-abb5-f897702b6cb6'
     AND district_id = '0e2b4e3b-be0b-4919-b0b2-f19ce898b23b');

-- A3: Back-pointer — set new politician.office_id → her new office
UPDATE essentials.politicians
   SET office_id = (SELECT id FROM essentials.offices
                      WHERE chamber_id = '5ca38f3a-ea2e-4160-abb5-f897702b6cb6'
                        AND district_id = '0e2b4e3b-be0b-4919-b0b2-f19ce898b23b')
 WHERE external_id = -701001
   AND office_id IS DISTINCT FROM (SELECT id FROM essentials.offices
                      WHERE chamber_id = '5ca38f3a-ea2e-4160-abb5-f897702b6cb6'
                        AND district_id = '0e2b4e3b-be0b-4919-b0b2-f19ce898b23b');
```
**For Inglewood Padilla D2:** substitute survivor chamber `'a25a6dea-7f26-4f5e-bc6a-2a5d321063d5'`, District 2 row UUID (query at pre-flight), title `'Councilmember'`, city `'Inglewood'`, source `'cityofinglewood.org'`. Assign ext_id from `SELECT MIN(external_id)-1 FROM essentials.politicians WHERE external_id < 0` (expect around `-7010xx`; pre-flight confirms exact value). ONLY execute Part A if Padilla is genuinely absent from DB after the pre-flight full-office scan.

#### Pattern 12: Back-pointer repair for existing members with NULL office_id

**From `1001_elmonte_complete.sql` lines 77–88:**
```sql
UPDATE essentials.politicians SET office_id = '211af77a-...'
 WHERE external_id = -201202 AND office_id IS DISTINCT FROM '211af77a-...'; -- member name
```
For Inglewood: after all moves in 1018 complete, run back-pointer repair for any member whose `politicians.office_id` is still NULL. (The 1018 link-repair step sets back-pointers for the 3 DOOMED-chamber members during the reconcile, but 1019 is the safety net for any missed ones.)

#### Pattern 13: official_count = 4 (council only; Mayor excluded)

**From `1001_elmonte_complete.sql` lines 91–95:**
```sql
-- official_count = 6 (the 6 council district seats; the directly-elected Mayor is the 7th office
-- but EXCLUDED from the count — Pasadena/Pomona precedent).
UPDATE essentials.chambers
   SET official_count = 6
 WHERE id = '5ca38f3a-ea2e-4160-abb5-f897702b6cb6'
   AND official_count IS DISTINCT FROM 6;
```
**For Inglewood:** official_count = `4`, chamber id `'a25a6dea-7f26-4f5e-bc6a-2a5d321063d5'`. The directly-elected Mayor Butts occupies a LOCAL_EXEC office and is NOT counted in this chamber's official_count (same convention as El Monte 151, RESEARCH §CQ-1).

#### Pattern 14: Ledger registration + post-verification block

Same shape as Pattern 8. For 1019: version `'1019'`, name `'inglewood_complete'`.

---

### `1020_inglewood_headshots.sql` (audit-only; NOT registered in schema_migrations)

**Primary analog:** `C:/EV-Accounts/backend/migrations/1002_elmonte_headshots.sql`
**Secondary analog:** `C:/EV-Accounts/backend/migrations/1012_west_covina_headshots.sql`

All 5 officials need valid headshots. Image states after Wave 1/2:
- Butts (-200740 / `f5775ca1`): 1 existing image (verify + re-crop if needed)
- Eloy Morales 666263 (`6ed19c10`): 1 image (migrated from dup in 1018 — verify it's the D3 city portrait; may need to UPDATE with the official documentID=21958 URL)
- Gray 666261 (`7a04bf87`): 1 existing image (verify + re-crop)
- Faulk 666264 (`729bc539`): 2 images → DEDUP to 1 (delete the extra row; keep type='default')
- Padilla D2 (ext_id TBD at pre-flight): 0 images → greenfield INSERT

#### Pattern 15: AUDIT-ONLY file header

**From `1002_elmonte_headshots.sql` lines 1–17:**
```sql
-- 1002_elmonte_headshots.sql
-- Phase 151 Wave 3 (ELMN-01): El Monte headshots. AUDIT-ONLY — applied via raw SQL, NOT registered in
-- supabase_migrations.schema_migrations (ledger MAX stays 1001). Idempotent.
-- ...
-- documentId sources (https://www.ci.el-monte.ca.us/ImageRepository/Document?documentId=NNNN):
--   7431 Crippen-Thomas(D1) · 7432 Herrera(D2) · ...
```
**For Inglewood:** ledger MAX stays 1019. Document each official's cityofinglewood.org documentID in the header comment:
- Gray D1: documentID=21642
- Padilla D2: documentID=21957
- Eloy D3: documentID=21958
- Faulk D4: documentID=21989
- Butts Mayor: documentID=20637 (or 20639 — test both)

#### Pattern 16: Greenfield INSERT for officials with 0 images (guarded NOT EXISTS)

**From `1002_elmonte_headshots.sql` lines 20–26:**
```sql
-- Padilla D2 (or any 0-image official): NEW — guarded INSERT.
INSERT INTO essentials.politician_images (politician_id, url, type, photo_license)
SELECT p.id,
  'https://kxsdzaojfaibhuzmclfq.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg',
  'default', 'press_use'
FROM essentials.politicians p
WHERE p.external_id = -701001  -- substitute Padilla's ext_id
  AND NOT EXISTS (SELECT 1 FROM essentials.politician_images pi WHERE pi.politician_id=p.id AND pi.type='default');
```
Storage path convention: `politician_photos/{politician_uuid}-headshot.jpg` where `{politician_uuid}` = the pol's UUID from `essentials.politicians.id`.

#### Pattern 17: UPDATE existing type='default' row to canonical path + license

**From `1002_elmonte_headshots.sql` lines 29–51:**
```sql
-- Members with pre-existing rows: point at canonical path + press_use.
UPDATE essentials.politician_images pi
   SET url='https://kxsdzaojfaibhuzmclfq.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg',
       photo_license='press_use'
 WHERE pi.type='default' AND pi.politician_id=(SELECT id FROM essentials.politicians WHERE external_id=NNNN);
```
Apply to: Butts, Eloy 666263, Gray 666261. For Eloy: after 1018 migrated the -201081 photo to 666263, this UPDATE overwrites it with the official city portrait at documentID=21958 (the official portrait is higher quality — correct, not an error; see RESEARCH Pitfall 3).

#### Pattern 18: Faulk dedup — delete the extra row, keep exactly one type='default'

**No direct file precedent** for a 2→1 dedup within politician_images. The shape is:
```sql
-- DEDUP Faulk (729bc539): keep one type='default', delete the other.
-- Pre-flight: SELECT id, url, photo_license FROM essentials.politician_images
--   WHERE politician_id = '729bc539-3175-4e5d-96ba-c18768890e1e' AND type='default';
-- Then delete the lower-quality / non-canonical row by its UUID.
DELETE FROM essentials.politician_images
 WHERE id = '<row_uuid_to_delete>'  -- resolved at pre-flight; never hardcode the wrong one
   AND politician_id = '729bc539-3175-4e5d-96ba-c18768890e1e'
   AND type = 'default';
-- Guard: after deletion, exactly 1 row remains.
```
Then UPDATE the surviving row to the canonical Supabase Storage URL (Pattern 17 shape).

#### Pattern 19: photo_origin_url backfill on essentials.politicians

**From `1002_elmonte_headshots.sql` lines 55–61** and **`1012_west_covina_headshots.sql` lines 45–54:**
```sql
-- photo_origin_url on politicians (the source actually used; guarded IS DISTINCT FROM).
UPDATE essentials.politicians
   SET photo_origin_url = 'https://www.cityofinglewood.org/ImageRepository/Document?documentID=21642'
 WHERE external_id = 666261
   AND photo_origin_url IS DISTINCT FROM 'https://www.cityofinglewood.org/ImageRepository/Document?documentID=21642'; -- Gray D1
```
Apply one UPDATE per official. If operator-supplied photo with no canonical URL: `SET photo_origin_url = NULL WHERE external_id = NNNN AND photo_origin_url IS NOT NULL` (see WC Cantos pattern at 1012 line 51–52).

#### Pattern 20: Audit-only post-verification block

**From `1002_elmonte_headshots.sql` lines 63–68:**
```sql
-- SELECT p.external_id, p.last_name, COUNT(pi.*) FILTER (WHERE pi.type='default') AS n_default
--   FROM essentials.politicians p LEFT JOIN essentials.politician_images pi ON pi.politician_id=p.id
--  WHERE p.external_id IN (-200740, 666261, ..., 666264, <padilla_ext_id>)
--  GROUP BY p.external_id, p.last_name;  -- each n_default = 1
-- SELECT MAX(version) FROM supabase_migrations.schema_migrations;  -- unchanged, stays 1019
```

---

### `1021_inglewood_stances_*.sql` (×5, one per official; audit-only)

**Primary analog:** `C:/EV-Accounts/backend/migrations/1013_tony_wu_stances.sql` (rich record, many stances)
**Secondary analog:** `C:/EV-Accounts/backend/migrations/1017_brian_gutierrez_stances.sql` (thin record, 3 stances, honest blanks)

Research order: Butts → Padilla → Morales Jr. → Faulk → Gray (richest → thinnest). Run ONE agent at a time.

#### Pattern 21: Stance file header (audit-only)

**From `1013_tony_wu_stances.sql` lines 1–5:**
```sql
-- 1013_tony_wu_stances.sql
-- Phase 152 Wave 4 (WCOV-01): evidence-only compass stances for Tony Wu (West Covina D5, ext_id 687367).
-- AUDIT-ONLY raw SQL: does NOT register in schema_migrations (ledger stays 1011). Committed to EV-Accounts.
-- CHAIRS model (value = the chair the evidence matches). 100% citation. Honest blanks for everything omitted.
-- pol_id 1bb5c062-9b9d-44de-820b-c3efe0d08222. 6 evidence-backed stances; all federal/state topics blank.
```
**For Inglewood:** substitute person name, district, ext_id, pol UUID, ledger stays 1019, count of evidence-backed stances. `NO judicial-*` topics (Inglewood is council-manager with appointed City Attorney).

#### Pattern 22: Per-stance block — paired answers + context inserts, one topic at a time

**From `1013_tony_wu_stances.sql` lines 9–17 (one stance block):**
```sql
-- public-safety-approach = 4
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
VALUES ('1bb5c062-9b9d-44de-820b-c3efe0d08222','e9ebefcd-c496-45e8-b816-a79f8442ba85',4)
ON CONFLICT (politician_id, topic_id) DO UPDATE SET value=EXCLUDED.value;
INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
VALUES ('1bb5c062-9b9d-44de-820b-c3efe0d08222','e9ebefcd-c496-45e8-b816-a79f8442ba85',
$$...reasoning text...$$,
ARRAY['https://...source1','https://...source2']::text[])
ON CONFLICT (politician_id, topic_id) DO UPDATE SET reasoning=EXCLUDED.reasoning, sources=EXCLUDED.sources;
```
Key structural rules:
- `ON CONFLICT (politician_id, topic_id) DO UPDATE` on BOTH inserts — idempotent re-run safe.
- `$$...$$` dollar-quoting for reasoning (avoids single-quote escaping).
- `ARRAY['url1','url2']::text[]` for sources (never an empty array; omit the topic entirely if no source).
- `topic_id` must be queried live (`SELECT id FROM inform.compass_stances WHERE slug='public-safety-approach'`) — never hardcode retired IDs. The UUIDs in the analogs above are the live production UUIDs as of 2026-06-21 and can be used as reference, but confirm at apply time.

#### Pattern 23: Thin-record / honest-blanks file (no padding)

**From `1017_brian_gutierrez_stances.sql` lines 1–19:**
```sql
-- Thin Nov-2024 record -> 3 well-cited stances + honest blanks (NOT padded).
BEGIN;
INSERT INTO inform.politician_answers (politician_id, topic_id, value) VALUES
('22fc2cdc-...','e9ebefcd-...',4),  -- public-safety-approach
('22fc2cdc-...','6fbf39ae-...',3),  -- homelessness-response
('22fc2cdc-...','eb3d1247-...',4)   -- economic-development
ON CONFLICT (politician_id, topic_id) DO UPDATE SET value=EXCLUDED.value;
INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources) VALUES
('22fc2cdc-...','e9ebefcd-...',$$...$$,ARRAY['...']::text[]),
('22fc2cdc-...','6fbf39ae-...',$$...$$,ARRAY['...']::text[]),
('22fc2cdc-...','eb3d1247-...',$$...$$,ARRAY['...']::text[])
ON CONFLICT (politician_id, topic_id) DO UPDATE SET reasoning=EXCLUDED.reasoning, sources=EXCLUDED.sources;
COMMIT;
-- AUDIT-ONLY: not registered in schema_migrations. Honest blanks on all other topics.
```
The multi-value `VALUES (...)` syntax (bulk insert for answers + bulk insert for context) is acceptable for thin records; the per-topic block syntax (Pattern 22) is used for rich records to aid readability. Either is valid.

**Inglewood unanimous-vote trap guard** (from RESEARCH §CQ-5): The Inglewood council voted 580/583 items unanimously. For any topic where the vote was unanimous, confirm the individual member's name appears in the record or use alternative evidence before placing them in a specific chair. Do NOT score all 5 members identically on every topic simply because the vote was unanimous — the evidence must anchor the SPECIFIC chair for each individual.

---

## Shared Patterns

### Idempotency guard: IS DISTINCT FROM
**Source:** `1010_west_covina_reconcile.sql` lines 71, 93–99; `1001_elmonte_complete.sql` lines 77–88
**Apply to:** Every `UPDATE` in all structural migrations
```sql
WHERE field IS DISTINCT FROM '<new_value>'
-- equivalent to: WHERE field != '<new_value>' OR field IS NULL
-- allows the UPDATE to correctly handle NULL -> value transitions
```

### Schema: districts.label (not 'name'), districts.state, districts.district_type
**Source:** `1000_elmonte_reconcile.sql` lines 63–71 + `1010_west_covina_reconcile.sql` lines 79–99
**Apply to:** Any INSERT or UPDATE on `essentials.districts`
```sql
INSERT INTO essentials.districts (label, district_type, geo_id, state)
SELECT 'District 2', 'LOCAL', '0636546', 'CA'  -- Inglewood geo_id
 WHERE NOT EXISTS (SELECT 1 FROM essentials.districts WHERE label = 'District 2' AND geo_id = '0636546');
-- Column is `label`, NOT `name`. district_type='LOCAL' for council seats, 'LOCAL_EXEC' for Mayor.
-- state='CA' always for Inglewood. geo_id='0636546'.
```

### Schema: chambers.slug is GENERATED (do NOT INSERT or UPDATE it)
**Source:** LOCATION-ONBOARDING.md §California Quick Reference (referenced in CONTEXT.md §Canonical References)
**Apply to:** Any INSERT on `essentials.chambers`
Chambers.slug is auto-generated from the name. Never specify it in INSERT column list; never UPDATE it directly.

### Structural migration transaction shape (BEGIN; ... COMMIT; then register OUTSIDE)
**Source:** `1010_west_covina_reconcile.sql` lines 41–113; `1001_elmonte_complete.sql` lines 26–102
```sql
BEGIN;
  -- all DDL/DML here
COMMIT;

-- Registration OUTSIDE the transaction (survives rollback on re-run):
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('1018', 'inglewood_reconcile')
ON CONFLICT (version) DO NOTHING;
```

### Audit-only migration transaction shape (BEGIN; ... COMMIT; no registration)
**Source:** `1002_elmonte_headshots.sql`; `1013_tony_wu_stances.sql` lines 7–69
```sql
BEGIN;
  -- INSERT/UPDATE rows here
COMMIT;
-- AUDIT-ONLY: not registered in schema_migrations (ledger stays 1019).
```

### Supabase Storage path convention
**Source:** `1002_elmonte_headshots.sql` lines 20–26; `1012_west_covina_headshots.sql` lines 24–42
```
politician_photos/{politician_uuid}-headshot.jpg
```
Full URL: `https://kxsdzaojfaibhuzmclfq.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg`
Upload via x-upsert (overwrites safely on re-run). Dimensions: 600×750, 4:5 crop first then resize, Lanczos, q90.

### photo_license values
**Source:** `1002_elmonte_headshots.sql` + `1012_west_covina_headshots.sql`
- Official city portrait sourced from cityofinglewood.org → `'press_use'`
- Operator-supplied portrait with no canonical URL → `'fair_use'` + set `photo_origin_url = NULL`

### Wrong-person headshot guard
**Source:** `1012_west_covina_headshots.sql` lines 8–11 (the Brian Gutierrez soccer-player miss)
Before uploading any headshot: visually confirm the portrait matches the official's name/district on the official city page. cityofinglewood.org portraits are labeled by district — low confusion risk, but still required per CONTEXT.md D-04.

---

## No Analog Found

| File / Pattern | Role | Data Flow | Reason |
|----------------|------|-----------|--------|
| Eloy Morales dedup step in 1018 (photo migrate + unlink-not-delete across two separate DB records for the same person) | migration | CRUD | No prior phase had a same-person duplicate across two DB records. The constituent operations (UPDATE politician_images.politician_id, null both link pointers) are individually proven; the combination is new. |
| Faulk 2→1 politician_images dedup (DELETE one of two type='default' rows) | migration | CRUD | No prior headshot migration needed to delete a duplicate image row. The DELETE by UUID after pre-flight identification is straightforward but has no exact file precedent. |

---

## Inglewood-Specific Reference Data (for planner/executor)

| Item | Value |
|------|-------|
| Gov UUID | `af811c4b-e4da-4f30-ac33-9a7fe7d434ba` |
| geo_id | `0636546` |
| Survivor chamber | `a25a6dea-7f26-4f5e-bc6a-2a5d321063d5` |
| Doomed chamber | `8b99bcf0-813d-459a-b7e1-f82e12080ffc` |
| Mayor Butts ext_id / pol UUID | `-200740` / `f5775ca1-...` |
| Mayor Butts office UUID | `90121859-...` (in DOOMED; moves to SURVIVOR in 1018) |
| Gray D1 ext_id / pol UUID | `666261` / `7a04bf87-...` |
| Gray D1 office UUID | `8e9b0c61-...` (SURVIVOR, bidirectional) |
| Eloy survivor ext_id / pol UUID | `666263` / `6ed19c10-7b34-47f0-8705-0d154271e362` |
| Eloy survivor office UUID | `ddcd280b-...` (SURVIVOR, bidirectional) |
| Eloy dup ext_id / pol UUID | `-201081` / `ff97a6bb-...` |
| Eloy dup office UUID | `7fd55592-...` (DOOMED, one-directional) |
| Faulk D4 ext_id / pol UUID | `666264` / `729bc539-3175-4e5d-96ba-c18768890e1e` |
| Faulk D4 office UUID | `35b92278-...` (SURVIVOR, bidirectional) |
| Dotson ext_id / pol UUID | `-201082` / `3e73448b-...` |
| Dotson office UUID | `6b20a733-...` (DOOMED, one-directional) |
| Padilla D2 ext_id | UNKNOWN — pre-flight must locate or assign new `-7010xx` |
| Next migration number | 1018 (on-disk authoritative; pre-flight re-confirms both MAX values) |
| Headshot URL pattern | `https://www.cityofinglewood.org/ImageRepository/Document?documentID={id}` |
| Storage bucket prefix | `politician_photos/` |
| official_count on survivor | 4 (council only; Mayor excluded — El Monte 151 convention) |

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/` (files 1000–1017)
**Files read:** 6 migration files (1000, 1001, 1002, 1010, 1011, 1012, 1013, 1017)
**Pattern extraction date:** 2026-06-21
