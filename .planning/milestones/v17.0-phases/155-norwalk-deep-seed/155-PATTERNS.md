# Phase 155: Norwalk Deep-Seed — Pattern Map

**Mapped:** 2026-06-22
**Files analyzed:** 4 new migration files (1034–1037+)
**Analogs found:** 4 / 4

---

## File Classification

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `1034_norwalk_reconcile.sql` | migration/structural | CRUD (geo_id backfill + chamber merge + link repair + LOCAL_EXEC conversion) | `1026_burbank_reconcile.sql` | role-match (adds LOCAL_EXEC→At-Large conversion — no exact prior analog for that step; use RESEARCH.md code example) |
| `1035_norwalk_complete.sql` | migration/structural | CRUD (title assignment + official_count) | `1027_burbank_complete.sql` | exact |
| `1036_norwalk_headshots.sql` | migration/audit-only | file-I/O (curl download + Supabase Storage upload + politician_images row) | `1028_burbank_headshots.sql` | exact (simpler: no Chrome UA; same UPDATE + INSERT pattern) |
| `1037_norwalk_*_stances.sql` (×5) | migration/audit-only | CRUD (paired politician_answers + politician_context per topic) | `1029_konstantine_anthony_stances.sql` | exact |

---

## Pattern Assignments

### `1034_norwalk_reconcile.sql` (structural, CRUD)

**Primary analog:** `C:/EV-Accounts/backend/migrations/1026_burbank_reconcile.sql`
**Secondary analog:** RESEARCH.md §Code Examples (LOCAL_EXEC conversion — no prior migration has this exact step)

**File header pattern** (lines 1–33 of `1026_burbank_reconcile.sql`):
```sql
-- 1034_norwalk_reconcile.sql
-- Phase 155 Wave 1 (NRWK-01): reconcile City of Norwalk structural defects.
-- Gov 15897159-e6bf-4d7e-9b45-44d62c4ebb8a 'City of Norwalk, California, US'.
-- STRUCTURAL migration (registers in supabase_migrations.schema_migrations). Idempotent.
-- DB-verified pre-flight 2026-06-22 (155-01 Task 1): NO DRIFT.
--
-- NORWALK IS AT-LARGE WITH A ROTATIONAL MAYOR (RESEARCH §Form of Government Verdict):
-- ...description of decisions...
```

**Step 1 — geo_id backfill** (lines 36–40 of `1026`):
```sql
-- (1) geo_id backfill (empty-string-safe guard)
UPDATE essentials.governments
   SET geo_id = '0652526'
 WHERE id = '15897159-e6bf-4d7e-9b45-44d62c4ebb8a'
   AND (geo_id IS NULL OR geo_id = '');
```

**Step 2 — one-directional back-pointer repair** (lines 42–53 of `1026`):
```sql
-- (2) Repair 4 one-directional back-pointers (politicians.office_id NULL).
-- Four offices in the SURVIVOR chamber are one-directional; repair BEFORE chamber moves.
-- Guarded IS DISTINCT FROM (idempotent).
UPDATE essentials.politicians
   SET office_id = '5edc1993-<full-uuid>'      -- Ayala's LOCAL_EXEC office (will be converted in step 4)
 WHERE id = '5e8bcf17-3a4d-4614-a71c-c4ea8396f7cb'
   AND office_id IS DISTINCT FROM '5edc1993-<full-uuid>';  -- Tony Ayala

UPDATE essentials.politicians
   SET office_id = '119e0ffd-<full-uuid>'
 WHERE id = 'e3b9af1b-3704-4bc5-a6ef-ab1f814bd29d'
   AND office_id IS DISTINCT FROM '119e0ffd-<full-uuid>';  -- Rick Ramirez

UPDATE essentials.politicians
   SET office_id = '87df841f-<full-uuid>'
 WHERE id = 'bd64253b-0bd1-4b9f-85b1-76180c760d07'
   AND office_id IS DISTINCT FROM '87df841f-<full-uuid>';  -- Margarita Rios

UPDATE essentials.politicians
   SET office_id = '4d8a62f7-<full-uuid>'
 WHERE id = 'ba647863-25fb-4ccf-9cb0-5a1c912d1b27'
   AND office_id IS DISTINCT FROM '4d8a62f7-<full-uuid>';  -- Ana Valencia
-- NOTE: Perez (bidirectional-clean in doomed chamber) does NOT need link repair here.
```

**Step 3 — chamber merge (move-then-delete)** (lines 55–70 of `1026`):
```sql
-- (3) MERGE duplicate chamber — move doomed-chamber office (Jennifer Perez) into SURVIVOR.
-- Target by UUID ONLY (both share name 'City Council' / slug 'norwalk-city-council').
UPDATE essentials.offices
   SET chamber_id = '97397b0f-61f1-4251-bf29-3fd5f99c0108'  -- SURVIVOR
 WHERE chamber_id = 'e7e787f7-4695-4747-9dd7-b111472ca9ae'; -- DOOMED

-- Assert the doomed chamber is empty before deleting it.
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.offices
        WHERE chamber_id = 'e7e787f7-4695-4747-9dd7-b111472ca9ae') > 0 THEN
    RAISE EXCEPTION 'Chamber e7e787f7 still has offices; aborting before delete';
  END IF;
END $$;

DELETE FROM essentials.chambers WHERE id = 'e7e787f7-4695-4747-9dd7-b111472ca9ae';
```

**Step 4 — re-point Perez's office to surviving At-Large district** (lines 72–81 of `1026`):
```sql
-- (4) Re-point Jennifer Perez's office from doomed At-Large district to the surviving one.
-- Guarded IS DISTINCT FROM (idempotent).
UPDATE essentials.offices
   SET district_id = '5677c0ab-e038-45d9-a744-141b28329036'  -- surviving At-Large district
 WHERE id = '8e25ebb7-<full-uuid>'                            -- Perez office
   AND district_id IS DISTINCT FROM '5677c0ab-e038-45d9-a744-141b28329036';
```

**Step 5 — delete orphaned doomed At-Large district** (lines 83–87 of `1026`):
```sql
-- (5) Delete the now-orphaned doomed 'At-Large' district f9e8037d.
-- Guarded: only if no office references it after the repoint above.
DELETE FROM essentials.districts d
 WHERE d.id = 'f9e8037d-e311-4583-9623-3201259ba7e4'
   AND NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id);
```

**Step 6 — LOCAL_EXEC Mayor → At-Large council seat conversion** (NORWALK-SPECIFIC — no exact prior migration; use RESEARCH.md code example):
```sql
-- (6) Convert Ayala's LOCAL_EXEC Mayor office to an At-Large council seat.
-- Norwalk's mayor IS ROTATIONAL (confirmed; the DB's LOCAL_EXEC office is a mis-seed).
-- Move the office into the survivor chamber + survivor At-Large district; change district_type
-- is handled via the district repoint (offices table has no district_type column — it's on
-- essentials.districts). After repoint, drop the orphan LOCAL_EXEC district.
-- Idempotent: guard chamber_id IS DISTINCT FROM survivor.
UPDATE essentials.offices
   SET chamber_id = '97397b0f-61f1-4251-bf29-3fd5f99c0108',   -- survivor At-Large chamber
       district_id = '5677c0ab-e038-45d9-a744-141b28329036',  -- survivor At-Large district
       title = 'Councilmember'
 WHERE id = '5edc1993-<full-uuid>'                            -- Ayala's LOCAL_EXEC Mayor office
   AND chamber_id IS DISTINCT FROM '97397b0f-61f1-4251-bf29-3fd5f99c0108';

-- Assert no office remains on the LOCAL_EXEC district before delete.
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.offices
        WHERE district_id = '4126e079-d0ff-494e-8371-d6ef2e98da3f') > 0 THEN
    RAISE EXCEPTION 'LOCAL_EXEC district 4126e079 still has offices; aborting delete';
  END IF;
END $$;

-- Drop the orphaned "Norwalk Mayor" LOCAL_EXEC district.
DELETE FROM essentials.districts
 WHERE id = '4126e079-d0ff-494e-8371-d6ef2e98da3f'
   AND NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = '4126e079-d0ff-494e-8371-d6ef2e98da3f');
```

**Step 7 — title normalization** (all 5 council titles to 'Councilmember' — Wave 1 only normalizes non-Mayor/non-VP; Mayor/VP set in Wave 2):
```sql
-- (7) Normalize 'Council Member' → 'Councilmember' (survivor chamber used 'Council Member' with space).
-- Ayala already set to 'Councilmember' in step 6. Normalize Ramirez + Valencia here.
-- (Perez → 'Mayor', Rios → 'Vice Mayor' are Wave 2 actions.)
UPDATE essentials.offices
   SET title = 'Councilmember'
 WHERE id IN (
   '119e0ffd-<full-uuid>',  -- Ramirez
   '4d8a62f7-<full-uuid>'   -- Valencia
 )
   AND title IS DISTINCT FROM 'Councilmember';
```

**Structural migration registration** (line 92–94 of `1026`, OUTSIDE the BEGIN/COMMIT):
```sql
-- Register structural migration in the ledger (OUTSIDE the transaction block).
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('1034', 'norwalk_reconcile')
ON CONFLICT (version) DO NOTHING;
```

**Key idempotency guards used:**
- `geo_id IS NULL OR geo_id = ''` (empty-string-safe geo_id guard)
- `IS DISTINCT FROM` on all UPDATE SET (re-run safe)
- `NOT EXISTS (SELECT 1 FROM essentials.offices WHERE district_id = ...)` before district DELETE
- `DO $$ ... IF COUNT > 0 THEN RAISE EXCEPTION ...` assert-empty-before-delete for chambers AND LOCAL_EXEC district
- All UUIDs targeted by UUID (never by name, since both chambers share the same name/slug)

---

### `1035_norwalk_complete.sql` (structural, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1027_burbank_complete.sql`

**Full file structure** (lines 1–59 of `1027`):

**Part A — Mayor/Vice Mayor title-on-seat** (lines 32–46 of `1027`):
```sql
-- Part A: Mayor / Vice Mayor titles (rotational, title-on-seat), normalize the rest.
-- All guarded IS DISTINCT FROM for idempotency.
-- CURRENT: Perez = Mayor, Rios = Vice Mayor (Dec 9 2025 reorganization).
-- DO NOT set Mayor on Ayala — he was Mayor Dec 2024–Dec 2025, current title = Councilmember.

UPDATE essentials.offices SET title = 'Mayor'
 WHERE politician_id = '3ed36508-9ae9-41af-aaba-e5e39bb87aa7'  -- Jennifer Perez
   AND title IS DISTINCT FROM 'Mayor';

UPDATE essentials.offices SET title = 'Vice Mayor'
 WHERE politician_id = 'bd64253b-0bd1-4b9f-85b1-76180c760d07'  -- Margarita L. Rios
   AND title IS DISTINCT FROM 'Vice Mayor';

-- Ramirez and Valencia → 'Councilmember' (already normalized in Wave 1; guard idempotent).
-- Ayala → already 'Councilmember' from Wave 1 LOCAL_EXEC conversion.
UPDATE essentials.offices SET title = 'Councilmember'
 WHERE politician_id IN (
   'e3b9af1b-3704-4bc5-a6ef-ab1f814bd29d',  -- Rick Ramirez
   'ba647863-25fb-4ccf-9cb0-5a1c912d1b27'   -- Ana Valencia
 )
   AND title IS DISTINCT FROM 'Councilmember';
```

**Part B — official_count** (lines 48–52 of `1027`):
```sql
-- Part B: official_count = 5 (all 5 are council seats; rotational Mayor IS included — West Covina/Burbank model).
-- Unlike Inglewood's directly-elected Mayor (excluded from council count), Norwalk's
-- rotational Mayor is one of the 5 At-Large seats.
UPDATE essentials.chambers SET official_count = 5
 WHERE id = '97397b0f-61f1-4251-bf29-3fd5f99c0108'
   AND official_count IS DISTINCT FROM 5;
```

**Structural registration** (line 56–58 of `1027`, OUTSIDE BEGIN/COMMIT):
```sql
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('1035', 'norwalk_complete')
ON CONFLICT (version) DO NOTHING;
```

**Post-verification queries** (lines 62–92 of `1027` — adapt for Norwalk UUIDs):
```sql
-- 1. title 'Mayor' on Perez (3ed36508), 'Vice Mayor' on Rios (bd64253b),
--    'Councilmember' on Ayala/Ramirez/Valencia:
--    SELECT o.title, p.full_name FROM essentials.offices o
--      JOIN essentials.politicians p ON p.id=o.politician_id
--      WHERE o.chamber_id='97397b0f-61f1-4251-bf29-3fd5f99c0108' ORDER BY p.external_id;
-- 2. ZERO LOCAL_EXEC offices under this gov:
--    SELECT COUNT(*) FROM essentials.offices o
--      JOIN essentials.districts d ON d.id=o.district_id
--      WHERE d.government_id='15897159-e6bf-4d7e-9b45-44d62c4ebb8a'
--        AND d.district_type='LOCAL_EXEC';
--    -> 0
-- 3. official_count=5:
--    SELECT official_count FROM essentials.chambers WHERE id='97397b0f-61f1-4251-bf29-3fd5f99c0108';
--    -> 5
-- 4. Exactly-one Mayor assert (from 992_downey_mayor_correction.sql lines 36–54):
DO $$
DECLARE mayor_count int; mayor_office uuid;
BEGIN
  SELECT count(*) INTO mayor_count FROM essentials.offices
    WHERE chamber_id = '97397b0f-61f1-4251-bf29-3fd5f99c0108' AND title = 'Mayor';
  IF mayor_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 Mayor in Norwalk chamber, found %', mayor_count;
  END IF;
END $$;
```

---

### `1036_norwalk_headshots.sql` (audit-only, file-I/O)

**Analog:** `C:/EV-Accounts/backend/migrations/1028_burbank_headshots.sql`

**File header** (lines 1–14 of `1028` — adapt):
```sql
-- 1036_norwalk_headshots.sql
-- Phase 155 (Norwalk deep-seed) Wave 3 — AUDIT-ONLY (raw SQL, NOT registered in
-- schema_migrations; ledger stays 1035). Idempotent.
--
-- All 5 existing images verified-and-replaced (existing DB images need wrong-person + 600×750 +
-- no-graphics check; Ramirez existing DB image uses broken URL 638169002126970000.jpg → MUST replace).
-- Source: norwalkca.gov Revize CMS — NO WAF; standard curl -L returns HTTP 200 (no Chrome UA needed).
-- URL pattern: https://www.norwalkca.gov/Image/Government/Mayor%20And%20City%20Council/{Name}/{Initials}%20-%20Digital%20Images%20-%20Copy.jpg?t={ts}
-- CRITICAL: Rios folder has DOUBLE SPACE: Margarita%20%20Rios (two %20%20 not one)
-- WRONG-PERSON GUARD (West Covina lesson): each portrait verified against norwalkca.gov council bio.
-- photo_origin_url is set on essentials.politicians (NOT on politician_images).
-- Canonical CDN host: kxsdzaojfaibhuzmclfq.storage.supabase.co
```

**UPDATE pattern for existing images** (lines 26–43 of `1028`):
```sql
-- ---- Perez 666845 pol 3ed36508: verify + re-upload (existing 1 image) ----
UPDATE essentials.politician_images
   SET url = 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/3ed36508-9ae9-41af-aaba-e5e39bb87aa7-headshot.jpg',
       type = 'default', photo_license = 'press_use'
 WHERE politician_id = '3ed36508-9ae9-41af-aaba-e5e39bb87aa7' AND type = 'default';

-- ---- Ramirez -201327 pol e3b9af1b: REPLACE broken URL (old 638169002126970000.jpg → new RR - Digital Images) ----
UPDATE essentials.politician_images
   SET url = 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/e3b9af1b-3704-4bc5-a6ef-ab1f814bd29d-headshot.jpg',
       type = 'default', photo_license = 'press_use'
 WHERE politician_id = 'e3b9af1b-3704-4bc5-a6ef-ab1f814bd29d' AND type = 'default';
-- (same pattern for Rios bd64253b, Ayala 5e8bcf17, Valencia ba647863)
```

**photo_origin_url backfill pattern** (lines 63–92 of `1028`):
```sql
-- ---- photo_origin_url backfill on essentials.politicians (guarded IS DISTINCT FROM) ----
UPDATE essentials.politicians
   SET photo_origin_url = 'https://www.norwalkca.gov/Image/Government/Mayor%20And%20City%20Council/Jennifer%20Perez/JP%20-%20Digital%20Images%20-%20Copy.jpg?t=202512101807300'
 WHERE external_id = 666845
   AND photo_origin_url IS DISTINCT FROM 'https://www.norwalkca.gov/Image/Government/Mayor%20And%20City%20Council/Jennifer%20Perez/JP%20-%20Digital%20Images%20-%20Copy.jpg?t=202512101807300';

-- Ramirez -201327 — CORRECTED URL (old `638169002126970000.jpg` is HTTP 404 on CDN)
UPDATE essentials.politicians
   SET photo_origin_url = 'https://www.norwalkca.gov/Image/Government/Mayor%20And%20City%20Council/Rick%20Ramirez/RR%20-%20Digital%20Images%20-%20Copy.jpg?t=202508201332230'
 WHERE external_id = -201327
   AND photo_origin_url IS DISTINCT FROM 'https://www.norwalkca.gov/Image/Government/Mayor%20And%20City%20Council/Rick%20Ramirez/RR%20-%20Digital%20Images%20-%20Copy.jpg?t=202508201332230';

-- Rios -201328 — DOUBLE SPACE in folder name (%20%20)
UPDATE essentials.politicians
   SET photo_origin_url = 'https://www.norwalkca.gov/Image/Government/Mayor%20And%20City%20Council/Margarita%20%20Rios/MR%20-%20Digital%20Images%20-%20Copy.jpg?t=202512101808020'
 WHERE external_id = -201328
   AND photo_origin_url IS DISTINCT FROM 'https://www.norwalkca.gov/Image/Government/Mayor%20And%20City%20Council/Margarita%20%20Rios/MR%20-%20Digital%20Images%20-%20Copy.jpg?t=202512101808020';
-- (same IS DISTINCT FROM guard for Ayala -200876 + Valencia -201329)
```

**No greenfield INSERTs needed** (all 5 have existing images — use UPDATE, not INSERT...WHERE NOT EXISTS):
- Contrast with Burbank `1028` which had 2 greenfield INSERTs (lines 46–61); Norwalk has 0.
- If a re-crop fails and an image row must be deleted+re-inserted, use the INSERT...WHERE NOT EXISTS pattern from Burbank `1028` lines 46–52.

**Headshot fetch commands** (from RESEARCH.md §Code Examples):
```bash
# NO special User-Agent needed; -L follows the 302→200 redirect from norwalkca.gov to Revize CDN
curl -s -L -o perez.jpg \
  "https://www.norwalkca.gov/Image/Government/Mayor%20And%20City%20Council/Jennifer%20Perez/JP%20-%20Digital%20Images%20-%20Copy.jpg?t=202512101807300"

# CRITICAL: Rios has DOUBLE SPACE in folder name — use %20%20
curl -s -L -o rios.jpg \
  "https://www.norwalkca.gov/Image/Government/Mayor%20And%20City%20Council/Margarita%20%20Rios/MR%20-%20Digital%20Images%20-%20Copy.jpg?t=202512101808020"

# Ramirez — use CORRECTED filename (old 638169... URL is HTTP 404)
curl -s -L -o ramirez.jpg \
  "https://www.norwalkca.gov/Image/Government/Mayor%20And%20City%20Council/Rick%20Ramirez/RR%20-%20Digital%20Images%20-%20Copy.jpg?t=202508201332230"
```

**NOT registered** — schema_migrations MAX stays at 1035 after Wave 3.

---

### `1037_norwalk_*_stances.sql` ×5 (audit-only, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1029_konstantine_anthony_stances.sql`

**File header** (lines 1–8 of `1029` — adapt):
```sql
-- 1037_norwalk_ramirez_stances.sql  (example; one file per member, numbered 1037–1041)
-- Phase 155 Norwalk deep-seed Wave 4 — evidence-only compass stances for Rick Ramirez
-- AUDIT-ONLY: raw SQL applied live via Supabase MCP, NOT registered in schema_migrations (ledger stays 1035).
-- CHAIRS model (value = the chair the evidence matches, never a polarity axis). 100% citation.
-- No defaulted/neutral values; honest blank spokes omitted. NO judicial-* topics (council-manager city).
-- politician_id e3b9af1b-3704-4bc5-a6ef-ab1f814bd29d | N stances.
```

**Core stance-row pattern** (lines 12–15 of `1029` — one block per topic):
```sql
-- homelessness-response = 2  (unanimous shelter ban Aug 2024; restrictive stance)
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
VALUES ('e3b9af1b-3704-4bc5-a6ef-ab1f814bd29d',
        (SELECT id FROM inform.compass_stances WHERE topic_key = 'homelessness-response'),  -- resolve live
        2)
  ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
VALUES ('e3b9af1b-3704-4bc5-a6ef-ab1f814bd29d',
        (SELECT id FROM inform.compass_stances WHERE topic_key = 'homelessness-response'),
        '<evidence-grounded reasoning for Ramirez specifically>',
        ARRAY['https://abc7.com/amp/post/norwalk-council-votes-expand-moratorium',
              'https://calmatters.org/housing/2024/10/...']::text[])
  ON CONFLICT (politician_id, topic_id) DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;
```

**IMPORTANT — Norwalk vs Burbank topic_id resolution:** Burbank `1029` uses hardcoded UUID topic_ids (e.g., `'e9ebefcd-c496-45e8-b816-a79f8442ba85'`). For Norwalk, the planner SHOULD use a CTE or subquery resolving `topic_id` by `topic_key` from the live `inform.compass_stances` table (never hardcode retired IDs — `project_compass_live_topic_ids`). Query live topic_ids at apply time:
```sql
-- Safe topic_id resolution pattern (alternative to hardcoding):
WITH topics AS (
  SELECT topic_key, id FROM inform.compass_stances
)
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
SELECT 'e3b9af1b-3704-4bc5-a6ef-ab1f814bd29d', t.id, 2
FROM topics t WHERE t.topic_key = 'homelessness-response'
ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = EXCLUDED.value;
```

**File ordering recommendation** (research-priority, one per file):
1. `1037_norwalk_ramirez_stances.sql` — Rick Ramirez (richest record, 2003+)
2. `1038_norwalk_rios_stances.sql` — Margarita Rios (2017+, law enforcement background)
3. `1039_norwalk_perez_stances.sql` — Jennifer Perez (2017+, current Mayor)
4. `1040_norwalk_ayala_stances.sql` — Tony Ayala (2017+, former Mayor)
5. `1041_norwalk_valencia_stances.sql` — Ana Valencia (2020+, thinnest record)

**Anchor stance for all 5** (unanimous Aug–Sept 2024 shelter ban — all were seated):
- Unanimous Aug 6, 2024 vote + Sept 17, 2024 extension → direct evidence for `homelessness-response` and `housing` topics for all 5.
- Sources: `abc7.com/amp/post/norwalk-council-votes-expand-moratorium`, `calmatters.org/housing/2024/10`, `gov.ca.gov/2024/09/16`.

**NOT registered** — schema_migrations MAX stays at 1035 after all stance migrations.

---

## Shared Patterns

### Idempotency — IS DISTINCT FROM guard
**Source:** `1026_burbank_reconcile.sql` lines 44–53, `1027_burbank_complete.sql` lines 32–52
**Apply to:** All UPDATE statements in 1034 and 1035
```sql
-- Always guard UPDATEs with IS DISTINCT FROM, not != or <>
UPDATE essentials.politicians
   SET office_id = '<target-uuid>'
 WHERE id = '<pol-uuid>'
   AND office_id IS DISTINCT FROM '<target-uuid>';
```

### Assert-empty-before-delete
**Source:** `1026_burbank_reconcile.sql` lines 61–68
**Apply to:** 1034, before every DELETE FROM essentials.chambers and before DELETE of LOCAL_EXEC district
```sql
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.offices
        WHERE chamber_id = '<doomed-chamber-uuid>') > 0 THEN
    RAISE EXCEPTION 'Chamber <uuid> still has offices; aborting before delete';
  END IF;
END $$;
```

### NOT EXISTS guard for district DELETE
**Source:** `1026_burbank_reconcile.sql` lines 83–87
**Apply to:** 1034, both district deletes (doomed At-Large `f9e8037d` and LOCAL_EXEC `4126e079`)
```sql
DELETE FROM essentials.districts d
 WHERE d.id = '<district-uuid>'
   AND NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id);
```

### ON CONFLICT DO NOTHING for schema_migrations registration
**Source:** `1026_burbank_reconcile.sql` lines 92–94 (OUTSIDE BEGIN/COMMIT)
**Apply to:** 1034 and 1035 only (headshot + stance files are audit-only, never register)
```sql
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('<version>', '<name>')
ON CONFLICT (version) DO NOTHING;
```

### ON CONFLICT DO UPDATE for stance rows
**Source:** `1029_konstantine_anthony_stances.sql` lines 12–15
**Apply to:** All stance files (1037–1041)
```sql
ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = EXCLUDED.value;
ON CONFLICT (politician_id, topic_id) DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;
```

### Exactly-one Mayor assert
**Source:** `992_downey_mayor_correction.sql` lines 36–54
**Apply to:** 1035 post-verification (or inline DO block as guard)
```sql
DO $$
DECLARE mayor_count int;
BEGIN
  SELECT count(*) INTO mayor_count FROM essentials.offices
    WHERE chamber_id = '97397b0f-61f1-4251-bf29-3fd5f99c0108' AND title = 'Mayor';
  IF mayor_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 Mayor in Norwalk chamber, found %', mayor_count;
  END IF;
END $$;
```

---

## No Analog Found

No files lack an analog. All 4 migration categories have strong matches.

The LOCAL_EXEC → At-Large council seat conversion (Step 6 in 1034) has no exact prior SQL migration that performs this specific transform — prior phases either kept the LOCAL_EXEC (El Monte, Inglewood) or had no LOCAL_EXEC office at all (Burbank, West Covina). The RESEARCH.md §Code Examples provides the authoritative template for this step.

---

## Key UUIDs Reference (DB-confirmed 2026-06-22)

| Entity | UUID |
|--------|------|
| Gov: City of Norwalk | `15897159-e6bf-4d7e-9b45-44d62c4ebb8a` |
| SURVIVOR chamber | `97397b0f-61f1-4251-bf29-3fd5f99c0108` |
| DOOMED chamber | `e7e787f7-4695-4747-9dd7-b111472ca9ae` |
| Surviving At-Large district | `5677c0ab-e038-45d9-a744-141b28329036` |
| Doomed At-Large district | `f9e8037d-e311-4583-9623-3201259ba7e4` |
| LOCAL_EXEC "Norwalk Mayor" district | `4126e079-d0ff-494e-8371-d6ef2e98da3f` |
| Jennifer Perez pol | `3ed36508-9ae9-41af-aaba-e5e39bb87aa7` (ext 666845) |
| Margarita Rios pol | `bd64253b-0bd1-4b9f-85b1-76180c760d07` (ext -201328) |
| Tony Ayala pol | `5e8bcf17-3a4d-4614-a71c-c4ea8396f7cb` (ext -200876) |
| Rick Ramirez pol | `e3b9af1b-3704-4bc5-a6ef-ab1f814bd29d` (ext -201327) |
| Ana Valencia pol | `ba647863-25fb-4ccf-9cb0-5a1c912d1b27` (ext -201329) |
| Ayala's LOCAL_EXEC Mayor office | `5edc1993-...` (resolve full UUID at apply time) |

**Note:** Office UUIDs for Ayala `5edc1993`, Ramirez `119e0ffd`, Rios `87df841f`, Valencia `4d8a62f7`, and Perez `8e25ebb7` are abbreviated in the DB pre-check — planner must resolve full UUIDs in pre-flight Task 1 before writing migration SQL.

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/` (migrations 990–1033)
**Files read:** 1026, 1027, 1028, 1029, 1018 (grep), 1000 (grep), 992 (grep)
**Pattern extraction date:** 2026-06-22
