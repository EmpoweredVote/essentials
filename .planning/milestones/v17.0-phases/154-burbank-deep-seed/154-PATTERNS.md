# Phase 154: Burbank Deep-Seed - Pattern Map

**Mapped:** 2026-06-21
**Files analyzed:** 4 new migration files
**Analogs found:** 4 / 4

---

## File Classification

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `1026_burbank_reconcile.sql` | structural-registered | CRUD (geo_id backfill + chamber merge + link repair + district consolidation) | `1018_inglewood_reconcile.sql` + `1010_west_covina_reconcile.sql` | role-match (simpler than both — no person-dedup, no by-district relabel, no orphan LOCAL_EXEC) |
| `1027_burbank_complete.sql` | structural-registered | CRUD (title-on-seat + official_count) | `1011_west_covina_complete.sql` | exact (same at-large + rotational-mayor model; simpler than 1019 which created a new member) |
| `1028_burbank_headshots.sql` | audit-only | CRUD (politician_images verify-and-fix + greenfield INSERT) | `1020_inglewood_headshots.sql` | exact (same mix of UPDATE existing + INSERT greenfield; Liferay adaptive-media source vs ImageRepository — URL pattern differs) |
| `1029_burbank_stances_*.sql` | audit-only (one file per member) | CRUD (inform.politician_answers + inform.politician_context paired inserts) | `1021_inglewood_butts_stances.sql` (and siblings 1022–1025) | exact |

---

## KEY DIFFERENCES FROM INGLEWOOD (do not over-copy 1018/1019)

| Inglewood had | Burbank does NOT have | Action |
|---------------|-----------------------|--------|
| Person-dedup (Eloy Morales Jr. vs Eloy Morales) | No duplicate persons (5 distinct people, no dedup needed) | OMIT steps 3a/3b/3c of 1018 entirely |
| By-district relabeling (At-Large → District 1/3/4) | At-Large stays At-Large (CVRA ballot not passed) | OMIT the label UPDATE block at step (5) of 1018 |
| Directly-elected LOCAL_EXEC Mayor (Butts kept) | Rotational Mayor = title on Takahashi's existing seat | OMIT "Mayor kept as-is" note; DO NOT create LOCAL_EXEC; follow 1011 title-update pattern instead |
| official_count=4 (directly-elected Mayor excluded) | official_count=5 (rotational Mayor is council seat, counted) | Use `official_count = 5` (1011 West Covina model) |
| Orphan 'At-Large' district row from departed Dotson (deleted in 1019) | Doomed At-Large district `809bbb35` (deleted in 1026 after offices moved out) | Delete doomed district in Wave 1 (1026), not Wave 2 |
| New member created (Padilla -701002) in Wave 2 | No new members; all 5 DB rows confirmed current | OMIT Part A of 1019 entirely |
| Unlink departed Dotson in Wave 2 | No unlinking needed; all 5 current | OMIT Part B unlink steps of 1019 |

---

## Pattern Assignments

### `1026_burbank_reconcile.sql` (structural-registered, Wave 1)

**Primary analog:** `C:/EV-Accounts/backend/migrations/1018_inglewood_reconcile.sql`
**Secondary analog:** `C:/EV-Accounts/backend/migrations/1010_west_covina_reconcile.sql`

**Header comment pattern** (1018 lines 1-7):
```sql
-- 1026_burbank_reconcile.sql
-- Phase 154 Wave 1 (BURB-01): reconcile City of Burbank structural defects.
-- Gov 3e3deaea-c5f4-4a68-b3ae-a79589f544ea 'City of Burbank, California, US'.
-- STRUCTURAL migration (registers in supabase_migrations.schema_migrations). Idempotent.
-- DB-verified pre-flight 2026-06-21 (154-01 Task 1): NO DRIFT.
```

**Step (1): geo_id backfill — empty-string-safe guard** (1018 lines 50-54 / 1010 lines 43-47):
```sql
UPDATE essentials.governments
   SET geo_id = '0608954'
 WHERE id = '3e3deaea-c5f4-4a68-b3ae-a79589f544ea'
   AND (geo_id IS NULL OR geo_id = '');
```

**Step (2): one-directional link repair (IS DISTINCT FROM guard)** (1018 lines 56-65):
```sql
-- Repair the two one-directional back-pointers (politicians.office_id NULL).
-- Anthony and Mullins are in the DOOMED chamber; repair BEFORE moving offices.
UPDATE essentials.politicians
   SET office_id = '1294961c-...'   -- Anthony's office UUID
 WHERE id = '6c4c7919-3e7f-41fa-8b1b-1c8b421fe4a7'
   AND office_id IS DISTINCT FROM '1294961c-...';  -- Konstantine Anthony
UPDATE essentials.politicians
   SET office_id = '9969febe-...'   -- Mullins's office UUID
 WHERE id = 'f933bd87-d397-4ef1-873b-57559b629000'
   AND office_id IS DISTINCT FROM '9969febe-...';  -- Zizette Mullins
```
Note: Resolve full office UUIDs at apply time via pre-flight query. The IS DISTINCT FROM guard is mandatory (idempotency).

**Step (3): chamber merge — move-then-delete with assert guard** (1018 lines 86-101 / 1010 lines 49-64):
```sql
-- MERGE duplicate chamber -- move BOTH doomed-chamber offices into the survivor FIRST.
-- Target by UUID ONLY (both chambers share name 'City Council' / slug 'burbank-city-council').
UPDATE essentials.offices
   SET chamber_id = '73422d25-c0a6-477a-b74f-2b38b94b6389'  -- SURVIVOR
 WHERE chamber_id = '6a72dbe8-06fa-4148-9152-1c8e2f11b30e'; -- DOOMED

-- Assert the doomed chamber is empty before deleting it.
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.offices
        WHERE chamber_id = '6a72dbe8-06fa-4148-9152-1c8e2f11b30e') > 0 THEN
    RAISE EXCEPTION 'Chamber 6a72dbe8 still has offices; aborting before delete';
  END IF;
END $$;

DELETE FROM essentials.chambers WHERE id = '6a72dbe8-06fa-4148-9152-1c8e2f11b30e';
```

**Step (4): re-point Anthony + Mullins to surviving At-Large district** (new for Burbank — derived from 1019 B1c district-repoint pattern):
```sql
-- Re-point the two moved offices from the doomed At-Large district to the surviving one.
UPDATE essentials.offices
   SET district_id = '15458750-78aa-4b9a-ade4-247e28bc25c2'  -- surviving At-Large district
 WHERE id IN ('1294961c-...', '9969febe-...')                 -- Anthony + Mullins offices
   AND district_id IS DISTINCT FROM '15458750-78aa-4b9a-ade4-247e28bc25c2';
```

**Step (5): delete the now-orphaned doomed At-Large district** (1019 lines 97-99, adapted):
```sql
-- Delete the doomed 'At-Large' district (guarded: only if no office references it after the repoint above).
DELETE FROM essentials.districts d
 WHERE d.id = '809bbb35-8d84-4e51-aef8-44547b32d063'
   AND NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id);
```

**Registration block** (1018 lines 118-120):
```sql
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('1026', 'burbank_reconcile')
ON CONFLICT (version) DO NOTHING;
```

**Post-verification block pattern** (1018 lines 122-134 — adapt UUIDs):
Key checks: geo_id='0608954', one 'City Council' chamber, doomed chamber gone, all 5 offices in survivor `73422d25`, all 5 bidirectional, doomed At-Large district `809bbb35` gone, section-split-check = 0 rows.

---

### `1027_burbank_complete.sql` (structural-registered, Wave 2)

**Primary analog:** `C:/EV-Accounts/backend/migrations/1011_west_covina_complete.sql`

**Header comment** (1011 lines 1-13 — adapt):
```sql
-- 1027_burbank_complete.sql
-- Phase 154 Wave 2 (BURB-01): finalize Burbank's 5-seat at-large roster.
-- Gov 3e3deaea; survivor council chamber 73422d25 (5 bidirectional offices after mig 1026).
-- STRUCTURAL migration (registers in supabase_migrations.schema_migrations). Idempotent.
--
-- ROTATIONAL MAYOR = TITLE ON A SEAT (West Covina 1011 / Downey model).
-- Current rotational state (Dec 15, 2025 reorganization meeting):
--   Mayor = Tamala Takahashi (pol ea6f7109, office 70e56076)
--   Vice Mayor = Zizette Mullins (pol f933bd87, office 9969febe)
-- NO new politician. NO unlink. All 5 current per RESEARCH §Roster Verdict.
```

**Part A: Mayor + Vice Mayor titles + normalize the rest** (1011 lines 17-27):
```sql
-- Part A: Mayor / Vice Mayor titles (rotational, title-on-seat), normalize the rest.
UPDATE essentials.offices SET title = 'Mayor'
 WHERE id = '70e56076-...'   -- Takahashi's office
   AND title IS DISTINCT FROM 'Mayor';
UPDATE essentials.offices SET title = 'Vice Mayor'
 WHERE id = '9969febe-...'   -- Mullins's office
   AND title IS DISTINCT FROM 'Vice Mayor';
UPDATE essentials.offices SET title = 'Council Member'
 WHERE id IN ('f205911b-...', 'caea9243-...', '1294961c-...')  -- Perez, Rizzotti, Anthony
   AND title IS DISTINCT FROM 'Council Member';
```
Note: Resolve exact office UUIDs via pre-flight at apply time; title string ('Council Member' or 'Councilmember') should match existing DB convention — check the current value and normalize to match.

**Part B: official_count=5** (1011 lines 28-30):
```sql
-- Part B: official_count = 5 (all 5 are council seats; rotational Mayor is included, not excluded).
UPDATE essentials.chambers SET official_count = 5
 WHERE id = '73422d25-c0a6-477a-b74f-2b38b94b6389'
   AND official_count IS DISTINCT FROM 5;
```
CRITICAL: Use 5, NOT 4. Inglewood used 4 because it had a separately-counted directly-elected Mayor. Burbank's rotational mayor is one of the 5 council seats (West Covina 1011 precedent: `official_count = 5`).

**Registration block** (1011 lines 33-35):
```sql
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('1027', 'burbank_complete')
ON CONFLICT (version) DO NOTHING;
```

**Post-verification block** (1011 lines 38-44 — adapt):
Key checks: 5 occupied offices + all bidirectional, title 'Mayor' on Takahashi, title 'Vice Mayor' on Mullins, ZERO LOCAL_EXEC offices under gov `3e3deaea`, official_count=5, all 5 district labels = 'At-Large' (none relabeled), section-split-check = 0 rows.

---

### `1028_burbank_headshots.sql` (audit-only, Wave 3)

**Primary analog:** `C:/EV-Accounts/backend/migrations/1020_inglewood_headshots.sql`
**Secondary analog:** `C:/EV-Accounts/backend/migrations/1012_west_covina_headshots.sql`

**Header comment** (1020 lines 1-20 — adapt):
```sql
-- 1028_burbank_headshots.sql
-- Phase 154 (Burbank deep-seed) Wave 3 — AUDIT-ONLY (raw SQL, NOT registered in
-- schema_migrations; ledger stays 1027). Idempotent.
--
-- 3 existing images (Perez, Anthony, Mullins) verified + re-uploaded at 600x750.
-- 2 greenfield INSERTs (Rizzotti, Takahashi — 0 images in DB).
-- Source: burbankca.gov Liferay adaptive-media system (Chrome UA required; HTTP 200 confirmed).
-- URL pattern: https://www.burbankca.gov/o/adaptive-media/image/{fileEntryId}/Preview-1000x0/{filename}.jpg?t={ts}
-- WRONG-PERSON GUARD (West Covina lesson): each portrait was visually verified as the actual
-- Burbank official before upload.
-- Canonical CDN host: kxsdzaojfaibhuzmclfq.storage.supabase.co
-- photo_origin_url is set on essentials.politicians (NOT on politician_images -- no such column there).
```

**UPDATE pattern for existing images** (1020 lines 29-38 / 1012 lines 23-42):
```sql
-- Perez 663414 pol 96f91743: verify + re-upload (existing 1 image)
UPDATE essentials.politician_images
   SET url = 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/96f91743-def6-436c-9537-a4b836c1b3eb-headshot.jpg',
       type = 'default', photo_license = 'press_use'
 WHERE politician_id = '96f91743-def6-436c-9537-a4b836c1b3eb' AND type = 'default';
```
Repeat for Anthony (`6c4c7919`) and Mullins (`f933bd87`). Use UPDATE WHERE `politician_id = ... AND type = 'default'` (not WHERE id — the existing row's UUID is unknown until pre-flight).

**INSERT pattern for greenfield members** (1020 lines 53-59):
```sql
-- Rizzotti 663419 pol a83a63a8: greenfield INSERT (0 images; guarded NOT EXISTS)
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(), 'a83a63a8-3e0f-4a2e-9226-8c0cd26a1349',
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/a83a63a8-3e0f-4a2e-9226-8c0cd26a1349-headshot.jpg',
       'default', 'press_use'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
   WHERE politician_id = 'a83a63a8-3e0f-4a2e-9226-8c0cd26a1349' AND type = 'default');
```
Repeat for Takahashi (`ea6f7109`).

**photo_origin_url backfill on essentials.politicians** (1020 lines 62-71):
```sql
-- photo_origin_url = the burbankca.gov adaptive-media URL used as source
UPDATE essentials.politicians
   SET photo_origin_url = 'https://www.burbankca.gov/o/adaptive-media/image/2168721/Preview-1000x0/20221222-nikki-perez-portrait-001.jpg?t=1671722858156'
 WHERE external_id = 663414
   AND photo_origin_url IS DISTINCT FROM 'https://www.burbankca.gov/o/adaptive-media/image/2168721/Preview-1000x0/20221222-nikki-perez-portrait-001.jpg?t=1671722858156'; -- Perez
-- (repeat for all 5 with their respective fileEntryId URLs from RESEARCH.md §Headshots table)
```

**Audit-only trailer** (1020 lines 74-80):
```sql
-- ============================ POST-VERIFICATION (audit-only) =============================
-- 1. each of the 5 officials has exactly 1 type='default' image
-- 2. all 5 urls = politician_photos/{uuid}-headshot.jpg, all HTTP 200, all 600x750
-- 3. photo_origin_url set on all 5 politicians (burbankca.gov adaptive-media URLs)
-- 4. all portraits visually verified (human-verify checkpoint passed)
-- 5. schema_migrations MAX UNCHANGED at 1027 (audit-only; this file is NOT registered)
```

**Burbank-specific note:** Unlike Inglewood (CivicEngage ImageRepository `/ImageRepository/Document?documentID=NNNN`), Burbank uses Liferay adaptive-media URLs. Use the full adaptive-media URL as `photo_origin_url`. The curl fetch command requires `-A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"`.

**headshot URL reference table from RESEARCH.md §Headshots:**

| Official | pol UUID | fileEntryId | photo_origin_url |
|---------|----------|-------------|-----------------|
| Takahashi | `ea6f7109` | 3949213 | `https://www.burbankca.gov/o/adaptive-media/image/3949213/Preview-1000x0/20251208-portrait-Tamala-Takahashi-001.jpg?t=1766442190215` |
| Mullins | `f933bd87` | 3176813 | `https://www.burbankca.gov/o/adaptive-media/image/3176813/Preview-1000x0/20241223-zizette-mullins-portrait-002.jpg?t=1734997758573` |
| Anthony | `6c4c7919` | 2161825 | `https://www.burbankca.gov/o/adaptive-media/image/2161825/Preview-1000x0/20221219-konstantine-anthony-portrait-001+%281%29.jpg?t=1671524088528` |
| Perez | `96f91743` | 2168721 | `https://www.burbankca.gov/o/adaptive-media/image/2168721/Preview-1000x0/20221222-nikki-perez-portrait-001.jpg?t=1671722858156` |
| Rizzotti | `a83a63a8` | 3940848 | `https://www.burbankca.gov/o/adaptive-media/image/3940848/Preview-1000x0/20251215-portrait-Rizzotti-final.jpg?t=1765923026167` |

---

### `1029_burbank_stances_*.sql` (audit-only, Wave 4 — one file per member)

**Primary analog:** `C:/EV-Accounts/backend/migrations/1021_inglewood_butts_stances.sql` (and siblings 1022–1025)

**Recommended filenames** (follow 1021–1025 naming):
```
1029_konstantine_anthony_stances.sql    # richest record — research first
1030_nikki_perez_stances.sql
1031_tamala_takahashi_stances.sql
1032_zizette_mullins_stances.sql
1033_christopher_rizzotti_stances.sql   # thinnest — research last
```
Note: 1029 is confirmed the next free on-disk slot. Files 1030–1033 follow in sequence. Confirm on-disk MAX before each file creation at apply time.

**Header comment** (1021 lines 1-8 — adapt per member):
```sql
-- 1029_konstantine_anthony_stances.sql
-- Phase 154 Wave 4 (BURB-01): evidence-only compass stances for Konstantine Anthony
--   (Burbank City Council, 2nd term, former Mayor 2023; ext_id -201161, pol 6c4c7919-3e7f-41fa-8b1b-1c8b421fe4a7).
-- AUDIT-ONLY raw SQL: does NOT register in schema_migrations (ledger stays 1027). Committed to EV-Accounts.
-- CHAIRS model (value = the chair the evidence matches). 100% citation. Honest blanks for everything omitted.
-- Live non-judicial topic UUIDs confirmed at apply time (never hardcode retired IDs).
-- NO judicial-* topics (Burbank is council-manager; no directly-elected judicial officers).
```

**Paired INSERT pattern per stance** (1021 lines 12-19):
```sql
-- {topic-slug} = {N} ({chair description})
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
VALUES ('{pol_uuid}','{topic_uuid}',{N})
ON CONFLICT (politician_id, topic_id) DO UPDATE SET value=EXCLUDED.value;
INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
VALUES ('{pol_uuid}','{topic_uuid}',
$$Plain-language explanation of which evidence matches chair N and why. Cite the specific vote, quote, or action. Explain why it is chair N and not an adjacent chair.$$,
ARRAY['{source_url_1}','{source_url_2}']::text[])
ON CONFLICT (politician_id, topic_id) DO UPDATE SET reasoning=EXCLUDED.reasoning, sources=EXCLUDED.sources;
```
Note: `$$...$$` dollar-quoting is required for the reasoning text (avoids single-quote escaping issues). The sources array is `text[]` with real URLs — never placeholder strings.

**Trailer** (1021 line 73 — adapt):
```sql
COMMIT;
-- AUDIT-ONLY: not registered in schema_migrations (ledger stays 1027). {N} stances; remaining topics honest blanks.
```

**BEGIN/COMMIT wrapping:** All stance files use `BEGIN;` at the top and `COMMIT;` after the last pair (matching 1021 structure — all stances for one member in a single transaction).

**Known evidence for Anthony** (from RESEARCH.md §Stance Sources):
- `public-safety-approach`: "full abolitionist" (police/prison abolition declared 2023)
- `local-environment`: Green New Deal co-champion (50% carbon by 2030, carbon-neutral 2040)
- `rent-regulation`: voted YES on 4% soft cap Oct 2024; advocated for harder cap (chair 2 likely)
- `homelessness-response`: first shelter opened; declining homeless count cited
- Do NOT pre-assign chairs without running a research agent — this is landscape context only

---

## Shared Patterns

### Transaction + idempotency discipline
**Source:** All analogs (1010/1011/1018/1019/1020/1021)
**Apply to:** All 4 Burbank migration files

All structural migrations:
- Wrap in `BEGIN; ... COMMIT;` (single transaction)
- Use `AND (geo_id IS NULL OR geo_id = '')` for geo_id guards (empty-string-safe)
- Use `AND x IS DISTINCT FROM y` for UPDATE guards (not `AND x != y`, which misses NULLs)
- Use `ON CONFLICT (...) DO NOTHING` for INSERT guards where a unique constraint exists
- Assert before destructive deletes: `DO $$ BEGIN IF (SELECT COUNT(*) ...) > 0 THEN RAISE EXCEPTION ...; END IF; END $$;`

All audit-only migrations:
- No `BEGIN/COMMIT` registration block — but still wrap stances/headshots in `BEGIN; ... COMMIT;`
- NO `INSERT INTO supabase_migrations.schema_migrations` line
- End with comment: `-- AUDIT-ONLY: not registered in schema_migrations (ledger stays {N}).`

### Migration ledger registration
**Source:** 1018 lines 118-120, 1010 lines 110-113
**Apply to:** 1026 and 1027 only (structural)

```sql
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('{version}', '{name}')
ON CONFLICT (version) DO NOTHING;
```
This must appear AFTER the `COMMIT;` line (outside the transaction block) — same position as 1018 and 1010.

### Canonical Storage URL format
**Source:** 1020 lines 30-31, 1012 lines 24-25
**Apply to:** 1028_burbank_headshots.sql

Two observed variants in existing migrations:
- 1020 uses: `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg`
- 1012 uses: `https://kxsdzaojfaibhuzmclfq.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg`

Use the 1020 form (`.storage.supabase.co`) as it is the more recent migration — verify against an existing Burbank-adjacent politician row before writing.

### photo_origin_url lives on politicians, not politician_images
**Source:** 1020 line 19 (`photo_origin_url is set on essentials.politicians (NOT on politician_images -- the image table has no such column)`)
**Apply to:** 1028_burbank_headshots.sql

`politician_images` has columns: `id`, `politician_id`, `url`, `type`, `photo_license`.
`photo_origin_url` is a column on `essentials.politicians`. Always UPDATE `essentials.politicians` for photo origin, not `essentials.politician_images`.

### Live topic UUID resolution
**Source:** 1021 header comment + project_compass_live_topic_ids memory
**Apply to:** All 1029–1033 stance files

Never hardcode topic UUIDs in stance migration files. Query live at apply time:
```sql
SELECT id, slug FROM inform.compass_stances WHERE slug = '{topic-slug}';
```
Then substitute the UUID into the INSERT. 6 topic IDs are retired — see `project_compass_live_topic_ids` memory for the list to avoid.

---

## No Analog Found

None. All 4 planned migration files have strong analogs. The headshot pattern is fully covered by 1020 + 1012; the stance pattern by 1021–1025.

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/` (1000–1025 range)
**Files scanned:** 1010, 1011, 1018, 1019, 1020, 1021, 1012 (7 analog files read)
**Pattern extraction date:** 2026-06-21
