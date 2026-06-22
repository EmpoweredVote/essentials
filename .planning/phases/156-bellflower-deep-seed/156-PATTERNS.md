# Phase 156: Bellflower Deep-Seed — Pattern Map

**Mapped:** 2026-06-22
**Files analyzed:** 7 migration files (2 structural, 1 headshot audit-only, 5 stance audit-only per member)
**Analogs found:** 7 / 7

---

## File Classification

| New Migration File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `1042_bellflower_reconcile.sql` | structural-migration | CRUD | `1034_norwalk_reconcile.sql` + `918_palmdale_reconcile.sql` | composite exact (norwalk = LOCAL_EXEC conversion + back-pointer repair; palmdale = by-district relabel + new district INSERT) |
| `1043_bellflower_complete.sql` | structural-migration | CRUD | `1035_norwalk_complete.sql` + `919_palmdale_complete.sql` | composite exact (norwalk = Mayor/Vice Mayor title-on-seat + official_count; palmdale = new-member create+seat + Mayor on existing office) |
| `1044_bellflower_headshots.sql` | audit-only-migration | CRUD | `1036_norwalk_headshots.sql` | exact (same Revize CMS NO-WAF pattern; 4 UPDATE + 1 INSERT) |
| `1045_bellflower_dunton_stances.sql` | audit-only-migration | CRUD | `1037_norwalk_ramirez_stances.sql` + `1038_norwalk_rios_stances.sql` | exact (same CTE WITH … INSERT pattern; richest record → most stances expected) |
| `1046_bellflower_koops_stances.sql` | audit-only-migration | CRUD | `1037_norwalk_ramirez_stances.sql` | exact |
| `1047_bellflower_santa_ines_stances.sql` | audit-only-migration | CRUD | `1038_norwalk_rios_stances.sql` | exact |
| `1048_bellflower_sanchez_stances.sql` | audit-only-migration | CRUD | `1037_norwalk_ramirez_stances.sql` | exact |
| `1049_bellflower_morse_stances.sql` | audit-only-migration | CRUD | `1037_norwalk_ramirez_stances.sql` | exact (thinnest record; expect fewest stances / most honest blanks) |

> NOTE: A 5th stance file (Morse) bumps the on-disk ledger to 1049. All 5 stance files are AUDIT-ONLY and
> NOT registered. The Wave 2 complete file registers as migration 1043. Ledger after Wave 2 commit = 1043
> (on-disk). Wave 3/4 files increment the on-disk filename counter only.

---

## Pattern Assignments

### `1042_bellflower_reconcile.sql` (structural, CRUD)

**Primary analog:** `C:/EV-Accounts/backend/migrations/1034_norwalk_reconcile.sql`
**Secondary analog:** `C:/EV-Accounts/backend/migrations/918_palmdale_reconcile.sql`

Bellflower's reconcile is a SUPERSET of Norwalk 1034: same geo_id backfill, same back-pointer repair,
same LOCAL_EXEC → At-Large conversion, same orphan-district delete — PLUS the Palmdale by-district relabeling
of the shared At-Large district into D1–D5 rows (Norwalk did NOT need this because Norwalk stays at-large).

**File header convention** (from `1034_norwalk_reconcile.sql` lines 1–41):
```sql
-- 1042_bellflower_reconcile.sql
-- Phase 156 Wave 1 (BLFL-01): reconcile City of Bellflower structural defects.
-- Gov d34bdac8-e928-45c5-aaa8-ca3950ec2d6c 'City of Bellflower, California, US'.
-- STRUCTURAL migration (registers in supabase_migrations.schema_migrations). Idempotent.
-- DB-verified pre-flight 2026-06-22 (156-01 Task 1): NO DRIFT.
-- ...key facts about by-district + rotational mayor mis-seed...
-- NOT done here (Wave 2 handles): Santa Ines create+seat, Mayor/MPT titles, official_count=5.
```

**geo_id backfill pattern** (`1034_norwalk_reconcile.sql` lines 44–48):
```sql
UPDATE essentials.governments
   SET geo_id = '0604982'
 WHERE id = 'd34bdac8-e928-45c5-aaa8-ca3950ec2d6c'
   AND (geo_id IS NULL OR geo_id = '');
```

**Back-pointer repair pattern** (`1034_norwalk_reconcile.sql` lines 51–70) — apply to all 4 existing Bellflower members:
```sql
-- Guard: IS DISTINCT FROM (idempotent — re-run changes 0 rows if already set)
UPDATE essentials.politicians
   SET office_id = 'bdd2040f-8f8d-4543-b017-3caad9be4510'  -- Dunton's office
 WHERE id = '31c35458-6cc0-43ad-b431-841846e81875'          -- Dunton pol
   AND office_id IS DISTINCT FROM 'bdd2040f-8f8d-4543-b017-3caad9be4510';

UPDATE essentials.politicians
   SET office_id = '3935cd4b-727b-41fb-96c3-87f66b0c385c'  -- Koops's office
 WHERE id = 'dd2c2cfd-401f-4b35-916f-caba8ca9b722'
   AND office_id IS DISTINCT FROM '3935cd4b-727b-41fb-96c3-87f66b0c385c';

UPDATE essentials.politicians
   SET office_id = '7408185f-600c-4b02-8949-431347f21390'  -- Morse's office
 WHERE id = 'd18dcb81-ad41-468f-9b12-a70ed21fd3a7'
   AND office_id IS DISTINCT FROM '7408185f-600c-4b02-8949-431347f21390';

UPDATE essentials.politicians
   SET office_id = '581c5602-b72c-49f6-8b6e-c3e653eefbce'  -- Sanchez's office
 WHERE id = '4384a5d8-68b2-4e24-81e2-5208f5c61a34'
   AND office_id IS DISTINCT FROM '581c5602-b72c-49f6-8b6e-c3e653eefbce';
```

**By-district relabel pattern — REPURPOSE 8db5a2e5 as D1, CREATE D2/D3/D4/D5** (`918_palmdale_reconcile.sql` lines 38–71):
```sql
-- Relabel the existing shared At-Large district 8db5a2e5 as District 1 (Morse).
-- Each UPDATE keyed on exact UUID, guarded IS DISTINCT FROM target label.
-- district_type, geo_id, state, government_id are NOT touched by the label relabel.
UPDATE essentials.districts SET label = 'District 1'
 WHERE id = '8db5a2e5-2172-474a-be23-e51c2a53f970'
   AND label IS DISTINCT FROM 'District 1';

-- Create District 2 (Koops), District 3 (Santa Ines — Wave 2 seats occupant),
-- District 4 (Sanchez), District 5 (Dunton — converted LOCAL_EXEC).
-- Guarded NOT EXISTS on (label, geo_id). All: government_id=d34bdac8, state='CA',
-- district_type='LOCAL', geo_id='0604982', mtfcc = same as 8db5a2e5 (copy from relabeled row).
INSERT INTO essentials.districts (label, district_type, geo_id, state, government_id)
SELECT 'District 2', 'LOCAL', '0604982', 'CA', 'd34bdac8-e928-45c5-aaa8-ca3950ec2d6c'
 WHERE NOT EXISTS (SELECT 1 FROM essentials.districts
                    WHERE label='District 2' AND geo_id='0604982');

-- Repeat for District 3, District 4, District 5 with same pattern.
```

> NOTE: chambers.slug is GENERATED — do not INSERT a slug column. districts has a `label` column (not
> `name`). `district_type='LOCAL'` for all 5 Bellflower council districts. `geo_id='0604982'` on all.

**Re-point office district_ids after relabeling** — reassign each existing office to its correct new district row:
```sql
-- Koops (D2): re-point his office from 8db5a2e5 (now D1 for Morse) to new D2 district uuid
UPDATE essentials.offices
   SET district_id = '<D2_uuid>'  -- resolved at apply time from INSERT above
 WHERE id = '3935cd4b-727b-41fb-96c3-87f66b0c385c'  -- Koops's office
   AND district_id IS DISTINCT FROM '<D2_uuid>';

-- Sanchez (D4): similar update to new D4 uuid
-- Dunton (D5): defer to the LOCAL_EXEC conversion step below (district_id and title set together)
-- Morse (D1): already on 8db5a2e5 which is now relabeled D1 — NO re-point needed
```

**LOCAL_EXEC → District 5 council seat conversion** (`1034_norwalk_reconcile.sql` lines 101–123):
```sql
-- Convert Dunton's LOCAL_EXEC office (bdd2040f) to a District 5 council seat.
-- Re-point district_id from LOCAL_EXEC "Bellflower Mayor" b0002e15 to new D5 district uuid.
-- Set title = 'Councilmember' (Dunton is NOT the current Mayor; Santa Ines is).
-- Guard: district_id IS DISTINCT FROM target (idempotent).
UPDATE essentials.offices
   SET district_id = '<D5_uuid>',   -- new D5 district row created earlier in this migration
       title = 'Councilmember'
 WHERE id = 'bdd2040f-8f8d-4543-b017-3caad9be4510'   -- Dunton's formerly-LOCAL_EXEC office
   AND district_id IS DISTINCT FROM '<D5_uuid>';

-- Assert LOCAL_EXEC "Bellflower Mayor" district b0002e15 is now empty, then delete it.
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.offices
        WHERE district_id = 'b0002e15-e006-4791-b2f7-7a3389f58cb3') > 0 THEN
    RAISE EXCEPTION 'LOCAL_EXEC district b0002e15 still has offices; aborting delete';
  END IF;
END $$;

DELETE FROM essentials.districts d
 WHERE d.id = 'b0002e15-e006-4791-b2f7-7a3389f58cb3'
   AND NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id);
```

**Title normalization** (`1034_norwalk_reconcile.sql` lines 125–134):
```sql
-- Normalize 'Council Member' (with space) to 'Councilmember' on all 3 existing council offices.
-- Dunton's title set in the LOCAL_EXEC conversion above.
UPDATE essentials.offices
   SET title = 'Councilmember'
 WHERE id IN (
   '3935cd4b-727b-41fb-96c3-87f66b0c385c',  -- Koops
   '7408185f-600c-4b02-8949-431347f21390',  -- Morse
   '581c5602-b72c-49f6-8b6e-c3e653eefbce'   -- Sanchez (Wave 2 sets Mayor Pro Tem; safe to normalize here)
 )
   AND title IS DISTINCT FROM 'Councilmember';
```

**Schema_migrations registration** (`1034_norwalk_reconcile.sql` lines 139–141, OUTSIDE BEGIN/COMMIT block):
```sql
-- Register structural migration in the ledger (OUTSIDE the transaction block).
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('1042', 'bellflower_reconcile')
ON CONFLICT (version) DO NOTHING;
```

**STOP-on-drift pre-flight pattern** (`1034_norwalk_reconcile.sql` comment block): Use DO $$ RAISE EXCEPTION
blocks at the top of the file for any critical pre-condition (e.g., verifying the 4 existing offices are
still present under chamber a89b567a, confirming `schema_migrations` MAX and on-disk MAX both read correctly
before running).

---

### `1043_bellflower_complete.sql` (structural, CRUD)

**Primary analog:** `1035_norwalk_complete.sql`
**Secondary analog:** `919_palmdale_complete.sql`

Wave 2 creates Santa Ines (the missing 5th member), seats him in a new D3 office, sets Mayor on his seat,
sets Mayor Pro Tem on Sanchez's D4 seat, normalizes remaining titles, and sets official_count=5.
Norwalk 1035 handles the title-on-seat + official_count pattern cleanly. Palmdale 919 handles the
new-politician create + new-office INSERT + back-fill pattern.

**New politician INSERT** (`919_palmdale_complete.sql` lines 38–45):
```sql
INSERT INTO essentials.politicians
  (id, external_id, full_name, first_name, last_name, party, source,
   is_active, is_appointed, is_incumbent, is_vacant)
VALUES
  (gen_random_uuid(),
   -701002,                    -- replace with MIN(external_id)-1 from -7010xx range; query at apply time
   'Sonny R. Santa Ines', 'Sonny', 'Santa Ines', '',
   'bellflower.ca.gov', true, false, true, false)
ON CONFLICT (external_id) DO NOTHING;
```

**New office INSERT with back-fill** (`919_palmdale_complete.sql` lines 47–74):
```sql
-- Insert District 3 office for Santa Ines in survivor chamber a89b567a.
-- Guarded NOT EXISTS on (chamber_id, politician_id). district_id = D3 uuid created in Wave 1.
INSERT INTO essentials.offices
  (politician_id, chamber_id, district_id, title,
   representing_state, representing_city, description, seats,
   normalized_position_name, partisan_type, salary,
   is_appointed_position, is_vacant, faces_retention_vote)
SELECT
  (SELECT id FROM essentials.politicians WHERE external_id = -701002),  -- Santa Ines
  'a89b567a-6085-44c0-94ce-2a922ebb1fa6',                               -- Bellflower City Council chamber
  '<D3_uuid>',                                                           -- D3 district row from Wave 1
  'Mayor',                                                               -- Santa Ines IS the current Mayor
  'CA', 'Bellflower', '', 0,
  'Council Member', '', '',
  false, false, false
 WHERE NOT EXISTS (
   SELECT 1 FROM essentials.offices o
    WHERE o.chamber_id = 'a89b567a-6085-44c0-94ce-2a922ebb1fa6'
      AND o.politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -701002)
 );

-- Back-fill politicians.office_id for Santa Ines (IS DISTINCT FROM guard).
UPDATE essentials.politicians p
   SET office_id = o.id
  FROM essentials.offices o
 WHERE o.chamber_id = 'a89b567a-6085-44c0-94ce-2a922ebb1fa6'
   AND o.politician_id = p.id
   AND p.external_id = -701002
   AND p.office_id IS DISTINCT FROM o.id;
```

**Mayor / Mayor Pro Tem title-on-seat pattern** (`1035_norwalk_complete.sql` lines 31–45 and `1011_west_covina_complete.sql` lines 19–26):
```sql
-- Santa Ines title is set at INSERT above (already 'Mayor').
-- Sanchez: set Mayor Pro Tem on his D4 council seat.
UPDATE essentials.offices SET title = 'Mayor Pro Tem'
 WHERE politician_id = '4384a5d8-68b2-4e24-81e2-5208f5c61a34'  -- Victor A. Sanchez
   AND title IS DISTINCT FROM 'Mayor Pro Tem';

-- Dunton/Koops/Morse: Councilmember (set in Wave 1; idempotent re-confirm here is optional).
-- Koops bio URL says "mayor" (stale — he was 2024 rotational Mayor); his title is Councilmember.
UPDATE essentials.offices SET title = 'Councilmember'
 WHERE politician_id IN (
   '31c35458-6cc0-43ad-b431-841846e81875',  -- Dunton D5
   'dd2c2cfd-401f-4b35-916f-caba8ca9b722',  -- Koops D2 (NOT Mayor despite stale bio URL)
   'd18dcb81-ad41-468f-9b12-a70ed21fd3a7'   -- Morse D1
 )
   AND title IS DISTINCT FROM 'Councilmember';
```

**official_count + exactly-one-Mayor assert** (`1035_norwalk_complete.sql` lines 47–61):
```sql
UPDATE essentials.chambers SET official_count = 5
 WHERE id = 'a89b567a-6085-44c0-94ce-2a922ebb1fa6'
   AND official_count IS DISTINCT FROM 5;

-- Exactly-one-Mayor assert (guard pattern from 1035_norwalk_complete.sql lines 53–61):
DO $$
DECLARE mayor_ct int;
BEGIN
  SELECT COUNT(*) INTO mayor_ct FROM essentials.offices
    WHERE chamber_id = 'a89b567a-6085-44c0-94ce-2a922ebb1fa6' AND title = 'Mayor';
  IF mayor_ct <> 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 Mayor in chamber a89b567a, found %', mayor_ct;
  END IF;
END $$;
```

**Schema_migrations registration** (OUTSIDE BEGIN/COMMIT, `1035_norwalk_complete.sql` lines 65–68):
```sql
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('1043', 'bellflower_complete')
ON CONFLICT (version) DO NOTHING;
```

---

### `1044_bellflower_headshots.sql` (audit-only, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1036_norwalk_headshots.sql`

Match is near-exact: same Revize CMS / NO-WAF pattern (bellflower.ca.gov uses cms5.revize.com, same as
norwalkca.gov). Key difference: 4 existing rows are UPDATEs (correct url + photo_license); Santa Ines
is an INSERT (no prior row). Norwalk 1036 did 5 UPDATEs; Bellflower 1044 does 4 UPDATEs + 1 INSERT.

**File header** (`1036_norwalk_headshots.sql` lines 1–20):
```sql
-- 1044_bellflower_headshots.sql
-- Phase 156 Wave 3 (BLFL-01): verify-and-fix all 5 Bellflower official headshots.
-- AUDIT-ONLY migration — raw SQL, NOT registered in supabase_migrations.schema_migrations.
-- Ledger stays at 1043. Idempotent (IS DISTINCT FROM guards on UPDATE; ON CONFLICT on INSERT).
--
-- Source: bellflower.ca.gov Revize CMS — NO WAF (standard curl -L, HTTP 200, no special UA).
-- CMS redirect: bellflower.ca.gov -> 302 -> cms5.revize.com/revize/bellflowerca/...
-- Pattern: bellflower.ca.gov/photo_gallery/Government/City%20Council/{Name}%20web.jpg
-- All 5 URLs confirmed HTTP 200; byte sizes: Santa Ines 37743, Sanchez 39472,
--   Dunton 43635, Koops 39461, Morse 48928.
-- WARNING: Santa Ines's older /revize_photo_gallery/ URL path returns 404 — use /photo_gallery/.
-- 4 existing members: UPDATE the pre-existing default row; Santa Ines: INSERT (no prior row).
```

**UPDATE pattern for existing member** (`1036_norwalk_headshots.sql` lines 25–28):
```sql
-- UPDATE existing default row: set canonical Supabase Storage URL + press_use license.
UPDATE essentials.politician_images
   SET url = 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg',
       photo_license = 'press_use'
 WHERE politician_id = '{pol_uuid}' AND type = 'default';
```

**INSERT pattern for Santa Ines (new member, no prior row)** — adapt from any prior greenfield headshot INSERT:
```sql
INSERT INTO essentials.politician_images (politician_id, url, type, photo_license)
VALUES (
  (SELECT id FROM essentials.politicians WHERE external_id = -701002),  -- Santa Ines
  'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{santa_ines_uuid}-headshot.jpg',
  'default',
  'press_use'
)
ON CONFLICT (politician_id, type) DO UPDATE
  SET url = EXCLUDED.url, photo_license = EXCLUDED.photo_license;
```

**photo_origin_url backfill on essentials.politicians** (`1036_norwalk_headshots.sql` lines 51–64):
```sql
-- Set photo_origin_url to the canonical bellflower.ca.gov source URL for each official.
-- IS DISTINCT FROM guard (idempotent).
UPDATE essentials.politicians
   SET photo_origin_url = 'https://bellflower.ca.gov/photo_gallery/Government/City%20Council/Santa%20Ines%20web.jpg'
 WHERE external_id = -701002  -- Santa Ines
   AND photo_origin_url IS DISTINCT FROM 'https://bellflower.ca.gov/photo_gallery/Government/City%20Council/Santa%20Ines%20web.jpg';

-- Repeat for Dunton, Koops, Morse, Sanchez with their respective URLs.
-- NOTE: Do NOT use ?t= timestamp parameters in photo_origin_url — use the clean URL
-- (optional timestamp verified to be non-required for serving).
```

**AUDIT-ONLY ledger note** (`1036_norwalk_headshots.sql` lines 68–79):
```sql
-- ============================ POST-VERIFICATION (audit-only; ledger UNCHANGED at 1043) =============================
-- 1. each official exactly one type='default' image at canonical {uuid}-headshot.jpg path
-- 2. photo_origin_url set on all 5 officials
-- 3. all 5 images press_use
-- 4. ledger unchanged: SELECT MAX(version::int) FROM supabase_migrations.schema_migrations;  -> 1043
```

---

### `1045_bellflower_dunton_stances.sql` through `1049_bellflower_morse_stances.sql` (audit-only, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1037_norwalk_ramirez_stances.sql` and `1038_norwalk_rios_stances.sql`

All 5 stance files share an identical CTE-based SQL structure. Copy verbatim structure from Norwalk 1037/1038;
substitute Bellflower-specific politician UUIDs and evidence-sourced stances.

**Full CTE pattern** (`1037_norwalk_ramirez_stances.sql` lines 8–37):
```sql
-- AUDIT-ONLY — raw SQL, NOT registered in schema_migrations. Ledger stays 1043. Idempotent.
-- CHAIRS model (value = the chair the evidence matches). 100% citation. No defaults. Honest blanks.
-- NO judicial topics (council-manager city). topic_id resolved LIVE by topic_key (never hardcoded).

BEGIN;

WITH s(topic_key, val, reasoning, sources) AS (
  VALUES
  ('homelessness-response', 4,
   'reasoning text with cited evidence...',
   ARRAY['https://source1.example.com','https://source2.example.com']),
  ('housing', 3,
   'reasoning text...',
   ARRAY['https://source.example.com']),
  -- ...additional topics only if evidence exists; leave out entirely if no evidence (honest blank)
),
t AS (
  SELECT s.*, ct.id AS topic_id
  FROM s JOIN inform.compass_topics ct ON ct.topic_key = s.topic_key AND ct.is_live = true
),
ins_ans AS (
  INSERT INTO inform.politician_answers (politician_id, topic_id, value)
  SELECT '{pol_uuid}', topic_id, val FROM t
  ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = EXCLUDED.value
  RETURNING 1
)
INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
SELECT '{pol_uuid}', topic_id, reasoning, sources FROM t
ON CONFLICT (politician_id, topic_id) DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;

COMMIT;
-- Post: N answers + N paired context rows for {pol_uuid}; ledger unchanged (1043).
```

**Key constraint:** `topic_id` is NEVER hardcoded — always resolved via `JOIN inform.compass_topics ct ON ct.topic_key = s.topic_key AND ct.is_live = true`. This protects against retired topic IDs.

**Value semantics:** `val` is a CHAIR number (1–5), not a polarity score. Pick the chair whose text matches
the evidence. Blank if no evidence. Never default to 3 (neutral).

**Per-file politician UUID mapping:**
| File | Official | Pol UUID | Ext_id | Expected depth |
|------|---------|----------|--------|----------------|
| `1045_bellflower_dunton_stances.sql` | Ray Dunton | `31c35458-6cc0-43ad-b431-841846e81875` | -200583 | Richest (17 yrs) |
| `1046_bellflower_koops_stances.sql` | Dan Koops | `dd2c2cfd-401f-4b35-916f-caba8ca9b722` | -201149 | Medium-rich |
| `1047_bellflower_santa_ines_stances.sql` | Sonny R. Santa Ines | (new gen_random_uuid — resolve at apply time) | -701002 (verify) | Medium |
| `1048_bellflower_sanchez_stances.sql` | Victor A. Sanchez | `4384a5d8-68b2-4e24-81e2-5208f5c61a34` | -201151 | Medium |
| `1049_bellflower_morse_stances.sql` | Wendi Morse | `d18dcb81-ad41-468f-9b12-a70ed21fd3a7` | -201150 | Thinnest (2.5 yrs) |

---

## Shared Patterns

### Back-pointer repair (IS DISTINCT FROM guard)
**Source:** `1034_norwalk_reconcile.sql` lines 51–70
**Apply to:** `1042_bellflower_reconcile.sql`
```sql
UPDATE essentials.politicians
   SET office_id = '<office_uuid>'
 WHERE id = '<pol_uuid>'
   AND office_id IS DISTINCT FROM '<office_uuid>';
```
Use `IS DISTINCT FROM` (not `!=`) so the guard handles NULL correctly — `NULL != X` is NULL in Postgres and
the guard would not fire; `IS DISTINCT FROM` returns TRUE when the current value is NULL.

### Idempotent DELETE with NOT EXISTS guard
**Source:** `1034_norwalk_reconcile.sql` lines 97–99 and 121–123
**Apply to:** `1042_bellflower_reconcile.sql` (deleting LOCAL_EXEC district b0002e15)
```sql
DELETE FROM essentials.districts d
 WHERE d.id = '<district_uuid>'
   AND NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id);
```

### Assert-before-delete (DO $$ RAISE EXCEPTION)
**Source:** `1034_norwalk_reconcile.sql` lines 79–85 and 113–118
**Apply to:** `1042_bellflower_reconcile.sql` before deleting LOCAL_EXEC district b0002e15
```sql
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.offices
        WHERE district_id = 'b0002e15-e006-4791-b2f7-7a3389f58cb3') > 0 THEN
    RAISE EXCEPTION 'LOCAL_EXEC district b0002e15 still has offices; aborting before delete';
  END IF;
END $$;
```

### Schema_migrations registration (OUTSIDE BEGIN/COMMIT)
**Source:** `1034_norwalk_reconcile.sql` lines 139–141; `1035_norwalk_complete.sql` lines 65–68
**Apply to:** `1042_bellflower_reconcile.sql` and `1043_bellflower_complete.sql` only (NOT to audit-only files)
```sql
-- OUTSIDE the transaction block — executed even if the BEGIN/COMMIT block partially succeeded.
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('1042', 'bellflower_reconcile')   -- or 1043/bellflower_complete
ON CONFLICT (version) DO NOTHING;
```

### AUDIT-ONLY file header — no registration
**Source:** `1036_norwalk_headshots.sql` line 4; `1037_norwalk_ramirez_stances.sql` line 3
**Apply to:** `1044_bellflower_headshots.sql` and all 5 stance files
```sql
-- AUDIT-ONLY migration — raw SQL, NOT registered in supabase_migrations.schema_migrations.
-- Ledger stays at 1043. Idempotent.
```

### Exactly-one-Mayor assert
**Source:** `1035_norwalk_complete.sql` lines 53–61
**Apply to:** `1043_bellflower_complete.sql` after setting all titles
```sql
DO $$
DECLARE mayor_ct int;
BEGIN
  SELECT COUNT(*) INTO mayor_ct FROM essentials.offices
    WHERE chamber_id = 'a89b567a-6085-44c0-94ce-2a922ebb1fa6' AND title = 'Mayor';
  IF mayor_ct <> 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 Mayor in chamber a89b567a, found %', mayor_ct;
  END IF;
END $$;
```

### New district INSERT with NOT EXISTS guard
**Source:** `918_palmdale_reconcile.sql` lines 63–71
**Apply to:** `1042_bellflower_reconcile.sql` for D2/D3/D4/D5 district creates
```sql
INSERT INTO essentials.districts (label, district_type, geo_id, state, government_id)
SELECT 'District 2', 'LOCAL', '0604982', 'CA', 'd34bdac8-e928-45c5-aaa8-ca3950ec2d6c'
 WHERE NOT EXISTS (
   SELECT 1 FROM essentials.districts
    WHERE label = 'District 2' AND geo_id = '0604982'
 );
-- Repeat for District 3, 4, 5.
```

> **SLUG note:** `essentials.chambers.slug` is a GENERATED column — never INSERT or UPDATE it directly.
> District rows have a `label` column (string like 'District 1'), NOT a `name` or `slug` column.

---

## Schema Key Reference

| Table | Key columns | Notes |
|-------|-------------|-------|
| `essentials.governments` | `id`, `geo_id`, `state` | `geo_id='0604982'` currently NULL — backfill in Wave 1 |
| `essentials.chambers` | `id`, `government_id`, `official_count`, `slug` (GENERATED) | Single chamber `a89b567a`; slug auto-generated from name |
| `essentials.districts` | `id`, `government_id`, `label`, `district_type`, `geo_id`, `state` | `label` column (not `name`); `district_type='LOCAL'` for all 5 council districts; `district_type='LOCAL_EXEC'` on orphan `b0002e15` (to delete) |
| `essentials.offices` | `id`, `chamber_id`, `district_id`, `politician_id`, `title` | Bidirectional: `offices.politician_id` ↔ `politicians.office_id` |
| `essentials.politicians` | `id`, `external_id`, `full_name`, `first_name`, `last_name`, `office_id`, `photo_origin_url` | `photo_origin_url` set during Wave 3 headshot migration; new member ext_id in -7010xx range |
| `essentials.politician_images` | `politician_id`, `url`, `type`, `photo_license` | `type='default'`; `photo_license='press_use'`; `url` = Supabase Storage public URL `{uuid}-headshot.jpg` |
| `inform.politician_answers` | `politician_id`, `topic_id`, `value` | `ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = EXCLUDED.value` |
| `inform.politician_context` | `politician_id`, `topic_id`, `reasoning`, `sources` | `sources` is `text[]` (ARRAY of URL strings); `ON CONFLICT ... DO UPDATE` |
| `inform.compass_topics` | `id`, `topic_key`, `is_live` | ALWAYS join `ON ct.topic_key = s.topic_key AND ct.is_live = true` — never hardcode topic UUIDs |

---

## No Analog Found

All 7 migration files have close analogs. No patterns lack a codebase reference.

The one structural novelty — splitting a SINGLE shared At-Large district into FIVE by-district rows while
simultaneously converting a LOCAL_EXEC office — has no single exact prior analog but is fully covered by
compositing Norwalk 1034 (LOCAL_EXEC conversion) + Palmdale 918 (by-district relabel + new district INSERT).

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/` — specifically migs 918, 919, 1034, 1035,
1036, 1037, 1038, 1011.
**Files scanned:** 8
**Pattern extraction date:** 2026-06-22
