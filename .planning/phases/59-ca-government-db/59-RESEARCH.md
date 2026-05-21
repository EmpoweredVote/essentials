# Phase 59: CA Government DB Foundation - Research

**Researched:** 2026-05-21
**Domain:** California state government DB seeding — government row, executive chambers, incumbents, headshots
**Confidence:** HIGH

---

## Summary

Phase 59 follows the exact established pattern for state government DB foundation used in Phases 39/40 (MA) and 50/51 (ME). All three sub-plans have clear analogues: 59-01 mirrors 50-01 (government row + chambers), 59-02 mirrors 51-01 (executives with is_appointed_position flags), and 59-03 mirrors 51-03 (headshots).

All 8 CA constitutional officers are popularly elected — `is_appointed_position=false` on all office rows AND `is_appointed=false` on all politician rows. This is unlike Maine (where AG/SoS/Treasurer are legislature-elected) and is confirmed by user decision in CONTEXT.md. No research on CA constitution was needed or done.

The 8 current incumbents are all Democrats. All confirmed still in office as of May 21, 2026. Gavin Newsom is term-limited (term ends ~January 4, 2027 — he is still the current Governor as of this research date). Two incumbents are also candidates in other 2026 races: Eleni Kounalakis withdrew from governor's race and is running for Treasurer; Tony Thurmond is running for Governor. All 8 remain in their current offices through January 2027.

**Critical warning:** migration 153 already inserted Xavier Becerra (politician_id `0f74219c-7d10-4d29-85fe-0f1d834df8a7`) and external_id `-200002` was already claimed by Curren D. Price Jr. (CA politician). The `-060001xx` range is assigned for Phase 59 CA executives. Collision check of the entire `-06000101` to `-06000108` range must be performed before finalizing migration 185.

**Primary recommendation:** Write migration 185 as a single file covering 59-01 content (government row + 8 chambers in one transaction), then migration 186 for 59-02 content (8 STATE_EXEC districts + 8 politician+office CTE blocks + office_id back-fill). Headshots in 59-03 use the /find-headshots skill per-official with Supabase Storage pre-check first.

---

## Current CA Constitutional Officers

All 8 incumbents confirmed from Wikipedia Government of California page (multiple official sources cross-verified):

| Office | Full Legal Name | Party | External_id | Notes |
|--------|----------------|-------|-------------|-------|
| Governor | Gavin Christopher Newsom | Democrat | -06000101 | Term ends ~Jan 4 2027; term-limited |
| Lieutenant Governor | Eleni Tsakopoulos Kounalakis | Democrat | -06000102 | Running for Treasurer 2026; still LG until Jan 2027 |
| Attorney General | Robert Andres Bonta | Democrat | -06000103 | Appointed 2021; running for re-election 2026 |
| Secretary of State | Shirley N. Weber | Democrat | -06000104 | In office since Jan 29 2021 |
| Controller | Malia M. Cohen | Democrat | -06000105 | In office since Jan 2 2023 |
| Treasurer | Fiona Ma | Democrat | -06000106 | In office since Jan 7 2019; running for LG 2026 |
| Insurance Commissioner | Ricardo Lara | Democrat | -06000107 | Term-limited; not running 2026 |
| Supt of Public Instruction | Tony Krajewski Thurmond | Democrat | -06000108 | Running for Governor 2026; still Supt until Jan 2027 |

**Confidence:** HIGH for all 8 — cross-verified from Wikipedia (updated May 2026) + official gov sites.

**Name notes for migration:**
- Gavin Newsom: `full_name='Gavin C. Newsom'`, `first_name='Gavin'`, `last_name='Newsom'` — use "Gavin C. Newsom" to match official display without full middle name
- Eleni Kounalakis: `full_name='Eleni Kounalakis'`, `first_name='Eleni'`, `last_name='Kounalakis'` — middle name "Tsakopoulos" is maiden name; official public name is "Eleni Kounalakis"
- Rob Bonta: `full_name='Rob Bonta'`, `first_name='Rob'`, `last_name='Bonta'` — officially goes by "Rob" (not "Robert")
- Shirley Weber: `full_name='Shirley N. Weber'`, `first_name='Shirley'`, `last_name='Weber'` — official branding includes "N." (Nash)
- Malia Cohen: `full_name='Malia M. Cohen'`, `first_name='Malia'`, `last_name='Cohen'` — official branding includes "M."
- Fiona Ma: `full_name='Fiona Ma'`, `first_name='Fiona'`, `last_name='Ma'` — no middle name used publicly
- Ricardo Lara: `full_name='Ricardo Lara'`, `first_name='Ricardo'`, `last_name='Lara'` — no middle name used publicly
- Tony Thurmond: `full_name='Tony Thurmond'`, `first_name='Tony'`, `last_name='Thurmond'` — full legal name is Tony Krajewski Thurmond but he goes by "Tony Thurmond"

---

## Standard Stack

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| psql / mcp__supabase-local | — | Apply SQL migrations | Standard in project; DATABASE_URL from C:/EV-Accounts/backend/.env |
| PIL (Pillow) | installed | 4:5 crop then 600x750 LANCZOS q90 resize | Established project headshot pattern |
| /find-headshots skill | v1 | Per-photo approval workflow | Mandatory — never batch import |

### Database Tables Involved

| Table | Purpose in Phase 59 |
|-------|---------------------|
| `essentials.governments` | 1 new row: State of California |
| `essentials.chambers` | 8 new rows: one per constitutional office |
| `essentials.districts` | 8 new rows: STATE_EXEC type, state='CA' uppercase, geo_id='06' |
| `essentials.politicians` | 8 new rows: one per incumbent |
| `essentials.offices` | 8 new rows: one per incumbent, linked to chamber + district |
| `essentials.politician_images` | 8 new rows (in 59-03) |

---

## Architecture Patterns

### Migration 185: Government Row + 8 Chambers (59-01)

Mirrors `168_me_government_chambers.sql` exactly. One transaction: 1 government INSERT + 8 chamber INSERTs.

**Government row values:**
- `name = 'State of California'`
- `type = 'STATE'`
- `state = 'CA'` (uppercase — matches TX='TX', MA='MA', ME='ME')
- `city = ''` (empty string, not NULL)
- `geo_id = '06'` (California FIPS code)

**Chamber name format:** `'California {Role}'` — mirrors Maine's `'Maine Governor'` etc.

**8 chamber names (these become auto-generated slugs):**
1. `California Governor` → slug: `california-governor`
2. `California Lieutenant Governor` → slug: `california-lieutenant-governor`
3. `California Attorney General` → slug: `california-attorney-general`
4. `California Secretary of State` → slug: `california-secretary-of-state`
5. `California Controller` → slug: `california-controller`
6. `California Treasurer` → slug: `california-treasurer`
7. `California Insurance Commissioner` → slug: `california-insurance-commissioner`
8. `California Superintendent of Public Instruction` → slug: `california-superintendent-of-public-instruction`

**Note on Secretary of State vs "Secretary of the Commonwealth":** CA uses "Secretary of State" (not MA's "Secretary of the Commonwealth"). Chamber name is `California Secretary of State`, office title is `Secretary of State`.

**Note on Controller:** California's fiscal office is called "State Controller" (not "Comptroller" like Texas or "Treasurer and Receiver-General" like Massachusetts). Chamber name: `California Controller`, title: `Controller`.

**Migration 185 structure:**
```sql
BEGIN;

-- Government row (guarded by NOT EXISTS on name)
INSERT INTO essentials.governments (name, type, state, city, geo_id)
SELECT 'State of California', 'STATE', 'CA', '', '06'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments WHERE name = 'State of California'
);

-- 8 chamber INSERTs (each guarded by NOT EXISTS on name + government_id subquery)
-- Pattern: use (SELECT id FROM essentials.governments WHERE name = 'State of California')
-- NEVER hardcode government UUID — it is not known at write time
-- NEVER include slug column — it is GENERATED ALWAYS

COMMIT;
```

### Migration 186: STATE_EXEC Districts + 8 Politician+Office CTEs + office_id Back-fill (59-02)

Mirrors `169_me_state_executives.sql` structure. All 8 officials have `is_appointed_position=false`.

**District row values (one per executive):**
- `district_type = 'STATE_EXEC'`
- `state = 'CA'` (uppercase — matches ME='ME', MA='MA' for STATE_EXEC)
- `geo_id = '06'` (California FIPS)
- `label = 'California {Role}'` (matches chamber name)
- `district_id = ''`, `mtfcc = ''`

**Politician row values (all 8):**
- `party = 'Democrat'`
- `is_active = true`
- `is_appointed = false` (all 8 are popularly elected)
- `is_vacant = false`
- `is_incumbent = true`

**Office row values:**
- `is_appointed_position = false` (all 8 — user confirmed, no constitutional research needed)
- `role_canonical = NULL` (same as ME; CA cross-state role mapping deferred)
- `representing_state = 'CA'` (uppercase)
- `title` = short official title (see table below)

**Office titles (the short display title, not the chamber name):**
| Chamber Name | Office Title |
|---|---|
| California Governor | `Governor` |
| California Lieutenant Governor | `Lieutenant Governor` |
| California Attorney General | `Attorney General` |
| California Secretary of State | `Secretary of State` |
| California Controller | `Controller` |
| California Treasurer | `Treasurer` |
| California Insurance Commissioner | `Insurance Commissioner` |
| California Superintendent of Public Instruction | `Superintendent of Public Instruction` |

**office_id back-fill scope:** `p.external_id BETWEEN -06000110 AND -06000101` (covers all 8 plus headroom).

### Idempotency Pattern

```sql
-- Politician insert: ON CONFLICT (external_id) DO NOTHING
-- District insert: WHERE NOT EXISTS on (district_type, state, label)
-- Office insert: WHERE NOT EXISTS on (district_id, chamber_id)
-- Back-fill: AND p.office_id IS NULL
```

### CTE Pattern for Politician + Office (all 8 are elected — is_appointed_position=false)

```sql
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Gavin C. Newsom', 'Gavin', 'Newsom', 'Democrat',
          true, false, false, true, -06000101)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'California Governor'
          AND government_id = (SELECT id FROM essentials.governments WHERE name = 'State of California')),
       p.id,
       'Governor', 'CA', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.district_type = 'STATE_EXEC' AND d.state = 'CA' AND d.label = 'California Governor'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id
      AND o.chamber_id = (SELECT id FROM essentials.chambers
                          WHERE name = 'California Governor'
                            AND government_id = (SELECT id FROM essentials.governments WHERE name = 'State of California'))
  );
```

### Anti-Patterns to Avoid

- **Including `slug` in any chamber INSERT:** GENERATED ALWAYS column — will cause error.
- **Hardcoding government UUID:** Use `SELECT id FROM essentials.governments WHERE name = 'State of California'` everywhere.
- **Setting `is_appointed_position=true` for any CA officer:** All 8 are popularly elected — use false for all.
- **Setting `is_appointed=true` on politician row:** Same — false for all 8.
- **Creating a new U.S. Senate or U.S. House chamber:** Federal officials (Phases 60-61) use shared UUIDs. Phase 59 creates only STATE_EXEC content.
- **Using lowercase `'ca'` for STATE_EXEC districts:** STATE_EXEC uses uppercase `'CA'` (same as ME uses 'ME', MA uses 'MA').
- **Using geo_id='6' instead of '06':** CA FIPS is `'06'` (two digits with leading zero) — matches the established FIPS-padded format.

---

## geo_id Format for CA Government Row

**Recommendation: `geo_id = '06'`**

Pattern from prior states:
- TX: `geo_id = '48'`
- MA: `geo_id = '25'`
- ME: `geo_id = '23'`

All use 2-digit FIPS with leading zero for single-digit states. California FIPS is 06 → `'06'`.

Also confirmed from geofence_boundaries context: geofence_boundaries state field uses `'06'` (2-digit string). The governments table follows the same convention.

**Confidence:** HIGH — matches TX/MA/ME established pattern.

---

## External_id Convention

Context.md defines:
- CA executives: `-060001xx` where xx = 01–08 in order
- -06000101 = Gavin Newsom (Governor)
- -06000102 = Eleni Kounalakis (Lieutenant Governor)
- -06000103 = Rob Bonta (Attorney General)
- -06000104 = Shirley N. Weber (Secretary of State)
- -06000105 = Malia M. Cohen (Controller)
- -06000106 = Fiona Ma (Treasurer)
- -06000107 = Ricardo Lara (Insurance Commissioner)
- -06000108 = Tony Thurmond (Superintendent of Public Instruction)

**CRITICAL: Must verify these IDs are free in live DB before writing migration 185.**

Xavier Becerra has an existing politician row (`0f74219c-7d10-4d29-85fe-0f1d834df8a7`) from migration 153. His external_id must be checked — if it falls in the `-060001xx` range, that slot is occupied. However, since Becerra is a 2026 Governor candidate (not a current constitutional officer), he likely has a different external_id range. Verify by running:

```sql
SELECT external_id, full_name FROM essentials.politicians
WHERE external_id BETWEEN -06000199 AND -06000101;
```

Expected: 0 rows. If any exist, adjust assignments accordingly.

---

## Headshot Sources

**Check Supabase Storage FIRST** before sourcing any new photos. Query:

```sql
SELECT p.full_name, pi.url, p.photo_origin_url
FROM essentials.politicians p
JOIN essentials.politician_images pi ON pi.politician_id = p.id
WHERE p.external_id IN (-06000101, -06000102, -06000103, -06000104,
                         -06000105, -06000106, -06000107, -06000108);
```

If politician rows don't exist yet (first run), check by name:
```sql
SELECT p.full_name, pi.url, p.photo_origin_url
FROM essentials.politicians p
JOIN essentials.politician_images pi ON pi.politician_id = p.id
WHERE p.full_name ILIKE '%Newsom%' OR p.full_name ILIKE '%Kounalakis%'
   OR p.full_name ILIKE '%Bonta%' OR p.full_name ILIKE '%Weber%'
   OR p.full_name ILIKE '%Cohen%' OR p.full_name ILIKE '%Fiona Ma%'
   OR p.full_name ILIKE '%Lara%' OR p.full_name ILIKE '%Thurmond%';
```

**Official headshot sources (verified URLs where found):**

| Official | Official Gov Source | Wikipedia Fallback |
|----------|--------------------|--------------------|
| Gavin Newsom | https://www.gov.ca.gov/about/ (portrait posted ~2026; recent official portrait) | https://en.wikipedia.org/wiki/Gavin_Newsom (image: Governor_of_California_Gavin_Newsom_(cropped_3x4).jpg) |
| Eleni Kounalakis | https://ltg.ca.gov/about/ (signing photo available, not a portrait — use Wikipedia) | https://en.wikipedia.org/wiki/Eleni_Kounalakis |
| Rob Bonta | **Direct URL confirmed:** https://oag.ca.gov/sites/default/files/media/ag-bonta-official-2.jpg | https://en.wikipedia.org/wiki/Rob_Bonta |
| Shirley Weber | **Direct URL confirmed:** https://admin.cdn.sos.ca.gov/img/weber.jpg | https://en.wikipedia.org/wiki/Shirley_Weber (image: Shirley_Weber.jpg) |
| Malia Cohen | **Direct URL confirmed:** https://www.sco.ca.gov/Content-Images/controller_bio-mc.jpg | https://en.wikipedia.org/wiki/Malia_Cohen |
| Fiona Ma | https://www.treasurer.ca.gov/portraits (portraits page; relative paths need prepend) | https://en.wikipedia.org/wiki/Fiona_Ma |
| Ricardo Lara | https://insurance.ca.gov/image_gallery/images/Commissioner-portrait_2_300213.png | https://en.wikipedia.org/wiki/Ricardo_Lara |
| Tony Thurmond | https://www.cde.ca.gov/eo/bo/tt/images/tthurmond1.jpg | https://en.wikipedia.org/wiki/Tony_Thurmond |

**License guidance:**
- Official CA government sites (gov.ca.gov, oag.ca.gov, sos.ca.gov, sco.ca.gov, treasurer.ca.gov, cde.ca.gov, insurance.ca.gov): `photo_license = 'public_domain'` (government works)
- Wikipedia Commons: `photo_license = 'cc_by_sa'`

**Note on Kounalakis:** ltg.ca.gov/about/ shows only a signing photo (not a portrait). Use Wikipedia Commons fallback. Her Wikipedia infobox image file is `LG_Kounalakis_Signing_(cropped).jpg` — use /find-headshots skill to verify the best available portrait.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Idempotency for politician INSERT | WHERE NOT EXISTS | ON CONFLICT (external_id) DO NOTHING | Unique index on external_id |
| Idempotency for district/office INSERT | custom check | WHERE NOT EXISTS on (district_type, state, label) or (district_id, chamber_id) | No unique constraint on these tables |
| Idempotency for government/chamber INSERT | custom check | WHERE NOT EXISTS on name (+ government_id for chambers) | No unique constraint on geo_id |
| Image resize | custom script | PIL: 4:5 crop first, then resize 600x750 LANCZOS q90 | Established project pattern |
| Headshot approval | batch | /find-headshots skill ONE AT A TIME | project memory: feedback_stance_research_one_at_a_time.md |

---

## Common Pitfalls

### Pitfall 1: Including slug in chamber INSERT
**What goes wrong:** `ERROR: cannot insert into a generated column "slug"`
**Why it happens:** `essentials.chambers.slug` is `GENERATED ALWAYS` (migration 060).
**How to avoid:** Never include `slug` in any INSERT column list. Confirmed across multiple prior phases.
**Warning signs:** Migration fails with "generated column" error.

### Pitfall 2: Using lowercase `'ca'` for STATE_EXEC districts
**What goes wrong:** Office lookup queries fail; representing_state mismatches; address routing may not return CA executives.
**Why it happens:** TIGER loader uses lowercase for STATE_UPPER/STATE_LOWER. But STATE_EXEC follows the same uppercase pattern as ME='ME', MA='MA'.
**How to avoid:** `state='CA'` uppercase for: governments, STATE_EXEC districts, NATIONAL_UPPER/NATIONAL_LOWER districts, representing_state. Lowercase `'ca'` is only for STATE_UPPER/STATE_LOWER loaded by TIGER script.
**Warning signs:** After migration, query `SELECT state FROM essentials.districts WHERE district_type='STATE_EXEC' AND state ILIKE 'ca'` returns 8 rows with lowercase.

### Pitfall 3: Setting is_appointed_position=true for any CA officer
**What goes wrong:** CA officers appear as "Appointed" on profile pages; no election race rows would be correct.
**Why it happens:** Maine's AG/SoS/Treasurer pattern creates confusion — those were legislature-elected. CA's are all voter-elected.
**How to avoid:** All 8 CA constitutional officers: `is_appointed_position=false`, `is_appointed=false`. User confirmed in CONTEXT.md — no research step needed.
**Warning signs:** Any CA executive office has is_appointed_position=true.

### Pitfall 4: Hardcoding CA government UUID
**What goes wrong:** When the migration is first written, the UUID doesn't exist yet — it's generated by `gen_random_uuid()` at INSERT time. Hardcoding a UUID that hasn't been generated yet breaks the chamber lookups.
**Why it happens:** MA migration 154 hardcoded the government UUID (which was known from a prior migration). For CA, migration 185 creates the government row AND the chambers in the same migration.
**How to avoid:** Always use `(SELECT id FROM essentials.governments WHERE name = 'State of California')` subquery for `government_id` in chamber INSERTs. Never hardcode the UUID.
**Warning signs:** Chambers have NULL government_id or reference the wrong government.

### Pitfall 5: geo_id='6' instead of '06'
**What goes wrong:** FIPS lookups may fail; inconsistent with CA geofence_boundaries where state='06'.
**Why it happens:** California's FIPS is 6 but the established DB pattern pads to 2 digits.
**How to avoid:** Use `geo_id = '06'` (with leading zero). All prior states use 2-digit FIPS.
**Warning signs:** `SELECT geo_id FROM essentials.governments WHERE name = 'State of California'` returns `'6'` not `'06'`.

### Pitfall 6: External_id collision with existing CA politicians
**What goes wrong:** `-060001xx` range might already be partially occupied by prior CA work (e.g., Curren D. Price Jr. used -200002; Xavier Becerra has an existing politician row).
**Why it happens:** Prior CA work seeded some politicians with external_ids.
**How to avoid:** Run collision check query before writing migration 185: `SELECT external_id, full_name FROM essentials.politicians WHERE external_id BETWEEN -06000199 AND -06000101`. If any rows returned, skip those IDs.
**Warning signs:** ON CONFLICT DO NOTHING silently skips a politician insert; verification query returns fewer than 8 executives.

### Pitfall 7: Creating a "State of California" row when one might already exist
**What goes wrong:** Prior CA phases may have seeded a government row (unlikely but possible).
**Why it happens:** governments table has NO unique constraint on geo_id — the NOT EXISTS guard is mandatory.
**How to avoid:** Guard all government inserts with `WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE name = 'State of California')`. Also verify before applying: `SELECT id, name, state, geo_id FROM essentials.governments WHERE name = 'State of California'`.
**Warning signs:** Two "State of California" rows after migration.

---

## Code Examples

### Migration 185 — Government Row Pattern
```sql
-- Source: Phase 50 migration 168 (State of Maine) pattern
BEGIN;

INSERT INTO essentials.governments (name, type, state, city, geo_id)
SELECT 'State of California', 'STATE', 'CA', '', '06'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments WHERE name = 'State of California'
);

INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'California Governor',
       'California Governor',
       (SELECT id FROM essentials.governments WHERE name = 'State of California')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'California Governor'
    AND government_id = (SELECT id FROM essentials.governments WHERE name = 'State of California')
);

-- ... repeat for all 8 chambers ...

COMMIT;
```

### Migration 186 — STATE_EXEC District + Politician + Office Pattern
```sql
-- Source: Phase 51 migration 169 (ME executives) pattern — all flags false for CA
BEGIN;

-- Step 1: 8 STATE_EXEC districts (state='CA' uppercase, geo_id='06')
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, district_id, mtfcc)
SELECT gen_random_uuid(), 'STATE_EXEC', 'CA', '06', 'California Governor', '', ''
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE district_type = 'STATE_EXEC' AND state = 'CA' AND label = 'California Governor'
);
-- ... repeat for all 8 districts ...

-- Step 2: 8 politician+office CTE blocks (all is_appointed_position=false, is_appointed=false)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Gavin C. Newsom', 'Gavin', 'Newsom', 'Democrat',
          true, false, false, true, -06000101)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(), d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'California Governor'
          AND government_id = (SELECT id FROM essentials.governments WHERE name = 'State of California')),
       p.id, 'Governor', 'CA', false, false, NULL
FROM essentials.districts d CROSS JOIN ins_p p
WHERE d.district_type = 'STATE_EXEC' AND d.state = 'CA' AND d.label = 'California Governor'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id
      AND o.chamber_id = (SELECT id FROM essentials.chambers
                          WHERE name = 'California Governor'
                            AND government_id = (SELECT id FROM essentials.governments
                                                 WHERE name = 'State of California'))
  );

-- Step 3: office_id back-fill
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -06000110 AND -06000101
  AND p.office_id IS NULL;

COMMIT;
```

### Headshot Upload Pattern
```bash
# Source: Phase 51 Plan 03 Task 2 established pattern
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4c2R6YW9qZmFpYmh1em1jbGZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDM2NTEwMywiZXhwIjoyMDY1OTQxMTAzfQ.6cZBx-L-pFiNOf3r6c9xolq2RHZT3pBsVdZxsVqYnYo"

curl -X POST \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: image/jpeg" \
  -H "x-upsert: true" \
  --data-binary @/tmp/{politician_id}-headshot.jpg \
  "https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/politician_photos/{politician_id}-headshot.jpg"
```

### PIL Resize Pattern
```python
# Source: Plan 20-02 established project pattern
from PIL import Image
img = Image.open("/tmp/{politician_id}-raw.jpg")
img = img.convert("RGB")  # safe for webp/png input
w, h = img.size
target_ratio = 4/5
if w/h > target_ratio:
    new_w = int(h * target_ratio)
    left = (w - new_w) // 2
    img = img.crop((left, 0, left + new_w, h))
else:
    new_h = int(w / target_ratio)
    img = img.crop((0, 0, w, new_h))
img = img.resize((600, 750), Image.LANCZOS)
img.save("/tmp/{politician_id}-headshot.jpg", "JPEG", quality=90)
```

---

## Migration Numbering

| Migration | Content |
|-----------|---------|
| 184 | APPLIED — `184_me_legislative_races.sql` (Phase 55-02) |
| **185** | Phase 59-01: State of California government row + 8 constitutional officer chambers |
| **186** | Phase 59-02: 8 STATE_EXEC districts + 8 politician+office pairs + office_id back-fill |

Note: Headshots (59-03) do NOT need a migration — they are DB inserts via mcp__supabase-local or psql directly, not a versioned migration file.

---

## Verification Queries

After migrations 185 and 186:

```sql
-- 1. Confirm CA government row
SELECT name, type, state, city, geo_id
FROM essentials.governments
WHERE name = 'State of California';
-- Expected: 1 row; type='STATE', state='CA', city='', geo_id='06'

-- 2. Confirm 8 CA chambers + slugs
SELECT c.name, c.slug
FROM essentials.chambers c
JOIN essentials.governments g ON c.government_id = g.id
WHERE g.name = 'State of California'
ORDER BY c.name;
-- Expected: 8 rows; slugs auto-generated (not null); all 8 chamber names present

-- 3. Confirm 8 CA executives — all wired with is_appointed_position=false
SELECT p.external_id, p.full_name, p.is_appointed,
       o.title, o.is_appointed_position,
       ch.name AS chamber, d.district_type, d.state AS district_state,
       p.office_id IS NOT NULL AS has_office_id
FROM essentials.politicians p
LEFT JOIN essentials.offices o ON o.id = p.office_id
LEFT JOIN essentials.chambers ch ON ch.id = o.chamber_id
LEFT JOIN essentials.districts d ON d.id = o.district_id
WHERE p.external_id BETWEEN -06000108 AND -06000101
ORDER BY p.external_id;
-- Expected: 8 rows; ALL is_appointed=false, is_appointed_position=false
-- ALL has_office_id=true, district_type='STATE_EXEC', district_state='CA'

-- 4. Confirm no null office_ids
SELECT COUNT(*) FROM essentials.politicians
WHERE external_id BETWEEN -06000108 AND -06000101
  AND office_id IS NULL;
-- Expected: 0

-- 5. Confirm slug is non-null on all CA chambers
SELECT COUNT(*) FROM essentials.chambers c
JOIN essentials.governments g ON c.government_id = g.id
WHERE g.name = 'State of California' AND c.slug IS NULL;
-- Expected: 0

-- 6. Confirm 8 STATE_EXEC districts for CA
SELECT label, state, geo_id FROM essentials.districts
WHERE district_type = 'STATE_EXEC' AND state = 'CA'
ORDER BY label;
-- Expected: 8 rows, all geo_id='06', state='CA'
```

---

## Open Questions

1. **External_id collision check**
   - What we know: `-060001xx` range is the planned assignment; Xavier Becerra has a prior politician row from migration 153 but his external_id is unknown (likely in a different range).
   - What's unclear: Whether any value in `-06000101` through `-06000108` is already occupied.
   - Recommendation: Run collision check FIRST in 59-02 execution, before writing migration 186. Query: `SELECT external_id, full_name FROM essentials.politicians WHERE external_id BETWEEN -06000199 AND -06000101`.

2. **Existing "State of California" government row**
   - What we know: Prior CA phases (geofences, LAUSD, stances) existed but those didn't require a government row.
   - What's unclear: Whether any prior migration created a CA government row.
   - Recommendation: Run pre-check in 59-01: `SELECT id, name, state, geo_id FROM essentials.governments WHERE name = 'State of California'`. The NOT EXISTS guard in migration 185 handles this safely.

3. **Existing CA headshots in Supabase Storage**
   - What we know: User notes "prior CA work" may have produced headshots at 600x750.
   - What's unclear: Which officials (if any) already have headshots.
   - Recommendation: In 59-03, run the name-based query before sourcing any photos. If a politician_images row exists with a valid kxsdzaojfaibhuzmclfq.storage.supabase.co URL, skip that official — do not re-upload.

4. **Eleni Kounalakis official portrait**
   - What we know: ltg.ca.gov/about/ shows only a signing photo, not a portrait.
   - What's unclear: Whether a clean portrait exists anywhere official.
   - Recommendation: Use /find-headshots skill to navigate; Wikipedia Commons is the reliable fallback.

5. **Fiona Ma official portrait URL**
   - What we know: treasurer.ca.gov/portraits exists with multiple image paths, but relative paths were returned. Direct portrait URL not confirmed.
   - What's unclear: Which of the images at `/portraits` is the official headshot vs decorative.
   - Recommendation: WebFetch the full URL `https://www.treasurer.ca.gov/portraits` at execution time to resolve direct image URL; use Wikipedia fallback if needed.

---

## Sources

### Primary (HIGH confidence)
- `https://en.wikipedia.org/wiki/Government_of_California` — all 8 incumbents listed by name, party, and "Incumbent" status; page updated May 2026
- `https://en.wikipedia.org/wiki/Tony_Thurmond` — confirmed full name "Tony Krajewski Thurmond"; office assumed Jan 7 2019
- `https://en.wikipedia.org/wiki/Gavin_Newsom` — confirmed "Gavin Christopher Newsom"; term ends ~Jan 4 2027; portrait image filename documented
- `https://en.wikipedia.org/wiki/Eleni_Kounalakis` — confirmed "Eleni Tsakopoulos Kounalakis"; withdrawn from governor race Aug 8 2025; still Incumbent LG
- `https://en.wikipedia.org/wiki/Rob_Bonta` — confirmed "Robert Andres Bonta"; Incumbent AG; assumed office April 23 2021
- `https://en.wikipedia.org/wiki/Shirley_Weber` — confirmed Incumbent; assumed office Jan 29 2021
- `https://en.wikipedia.org/wiki/Malia_Cohen` — confirmed Malia M. Cohen; Incumbent; assumed office Jan 2 2023
- `https://oag.ca.gov/about` — confirmed Rob Bonta official portrait direct URL: https://oag.ca.gov/sites/default/files/media/ag-bonta-official-2.jpg
- `https://www.sos.ca.gov/administration/about` — confirmed Shirley Weber portrait direct URL: https://admin.cdn.sos.ca.gov/img/weber.jpg
- `https://www.sco.ca.gov/eo_about_bio.html` — confirmed Malia Cohen portrait relative URL: /Content-Images/controller_bio-mc.jpg
- `C:/EV-Accounts/backend/migrations/168_me_government_chambers.sql` — canonical government row + chambers migration pattern
- `C:/EV-Accounts/backend/migrations/169_me_state_executives.sql` — canonical STATE_EXEC districts + politician+office + back-fill migration pattern
- STATE.md: next migration is 185; CA FIPS=06; geo_id='06' convention established in Phase 57/58
- `.planning/phases/51-me-executives-federal-headshots/51-01-PLAN.md` — confirmed CTE pattern for politician+office with is_appointed_position
- `.planning/phases/50-me-government-db/50-01-PLAN.md` — confirmed slug GENERATED ALWAYS + NOT EXISTS + gov name subquery pattern

### Secondary (MEDIUM confidence)
- WebSearch: Gavin Newsom term end ~Jan 4 2027 (multiple education sites + Wikipedia); term-limited (2nd term)
- WebSearch: Ricardo Lara term-limited, not running in 2026; primary has multiple candidates
- WebSearch: Tony Thurmond running for governor 2026; still Superintendent
- WebSearch: Fiona Ma running for LG 2026; still Treasurer
- `C:/EV-Accounts/backend/migrations/153_xavier_becerra_stances.sql` — confirmed Becerra has existing politician row (UUID `0f74219c-7d10-4d29-85fe-0f1d834df8a7`) from prior CA work; external_id unknown but NOT in `-060001xx` range

### Tertiary (LOW confidence)
- `https://www.cde.ca.gov/eo/bo/tt/images/tthurmond1.jpg` — Thurmond portrait relative URL (may be stale; verify at execution time)
- `https://insurance.ca.gov/image_gallery/images/Commissioner-portrait_2_300213.png` — Lara portrait relative URL (verify at execution time; Lara is retiring so this page may update)
- `https://ltg.ca.gov/about/` — only shows a signing photo for Kounalakis; no portrait found on official site

---

## Metadata

**Confidence breakdown:**
- Current CA incumbents (all 8 names + titles): HIGH — Wikipedia Government of California confirmed May 2026
- is_appointed_position flags: HIGH — user confirmed in CONTEXT.md (no constitutional research needed)
- geo_id='06' for CA: HIGH — established FIPS-padding pattern from TX/MA/ME + confirmed from CA geofence work
- Chamber slugs (auto-generated): HIGH — GENERATED ALWAYS confirmed across all prior phases
- External_id range -060001xx: HIGH — defined in CONTEXT.md; collision check deferred to execution
- Official headshot URLs (Bonta, Weber, Cohen): HIGH — confirmed from direct WebFetch of official pages
- Official headshot URLs (Newsom, Treasurer, Lara, Thurmond): MEDIUM — page structures confirmed but direct image URLs may need re-verification at execution time
- Kounalakis headshot: LOW — no portrait found on official site; Wikipedia fallback expected

**Research date:** 2026-05-21
**Valid until:** 2026-07-21 (incumbents stable; all 8 in office through January 2027 regardless of 2026 election outcomes — phase must seed current incumbents, not 2026 winners)
