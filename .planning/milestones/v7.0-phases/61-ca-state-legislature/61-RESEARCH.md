# Phase 61: CA State Legislature - Research

**Researched:** 2026-05-21
**Domain:** California state legislature DB seeding — 40 senators + 80 assembly members, chambers, offices, headshots
**Confidence:** HIGH (all critical DB facts derived from live summaries + confirmed migration records)

---

## Summary

Phase 61 seeds all 120 CA state legislators (40 senators + 80 assembly members) with politician rows, office rows linked to the Phase 57 SLDU/SLDL district boundaries, and headshots at 600×750.

**CRITICAL: The proposed external_id schemes in CONTEXT.md conflict with the live DB and must not be used.** The live DB contains CA exec external_ids `-6000101`-`-6000108` and federal slots `-6000201`, `-6000203`, `-6000204`, `-6000301`-`-6000352`. The senator scheme `-6000101`-`-6000140` would write over 8 CA governors/officers. The assembly scheme `-6000201`-`-6000280` would collide with Padilla, Cárdenas, and Aguilar. New non-conflicting ranges are defined below.

**CRITICAL: The CA Senate and CA Assembly chambers do not yet exist in the DB.** Phase 59 only created 8 executive chambers. Migration 194 (61-01) must CREATE both legislative chambers before inserting office rows.

Assembly headshots have a clean bulk URL pattern: `https://webapi.assembly.ca.gov/district-media/assets/members/assembly_member_NN.jpg` (500×500 square, needs 4:5 crop + resize). Senate headshots require per-district page visits to sdNN.senate.ca.gov (no consistent bulk pattern, varying sizes and filenames).

**Primary recommendation:** Use migration 194 for senators (new politician rows + offices + chamber creation), migration 195 for assembly dedup (update existing -100049..-100119 rows + insert office rows), and plan 61-03 for headshots (assembly scriptable, senate per-district).

---

## CRITICAL: External_id Conflict Resolution

### Live DB State (confirmed from Phase 59-02 + 60-01 summaries)

| Range | Occupant |
|-------|----------|
| `-6000101` to `-6000108` | CA constitutional officers (Newsom through Thurmond) — migration 192 |
| `-6000201` | Alex Padilla (U.S. Senator) — migration 193 |
| `-6000202` | (reserved for Schiff scheme alignment) |
| `-6000203` | Tony Cárdenas (stale/deactivated CD-29) — migration 193 |
| `-6000204` | Pete Aguilar (U.S. House CD-33) — migration 193 |
| `-6000301` to `-6000352` | CA US House reps (CD-01 through CD-52) — migration 193 |
| `-100049` to `-100119` | CA Assembly pre-existing seed (full range extent to verify in 61-02 audit) |

### Proposed Non-Conflicting Scheme

| Tier | Scheme | Range |
|------|--------|-------|
| CA State Senators | `-6001001` (SD-01) through `-6001040` (SD-40) | `-6001001` to `-6001040` |
| CA Assembly members (new scheme) | `-6002001` (AD-01) through `-6002080` (AD-80) | `-6002001` to `-6002080` |

**Rationale:**
- `-6001xxx` = CA State Senate (new tier — no existing occupants in this range confirmed from prior phase records)
- `-6002xxx` = CA State Assembly (new scheme replacing -100049..-100119 pre-existing range)
- These are clearly above the `-6000xxx` CA executive/federal range and do not conflict

**Pre-check required in 61-01**: Before writing senators, confirm zero rows exist in `-6001001` to `-6001040`:
```sql
SELECT external_id, full_name FROM essentials.politicians
WHERE external_id BETWEEN -6001040 AND -6001001;
-- Expected: 0 rows
```

---

## Standard Stack

### Core

| Tool | Purpose | Why Standard |
|------|---------|--------------|
| psql + .sql migration files | Apply politician/office seed data | Established project pattern for all state legislatures |
| PowerShell generator script (.ps1) | Generate repetitive migration SQL from roster array | Phase 52 (ME senate), Phase 39 (MA) proved pattern |
| PIL (Pillow) | 4:5 crop then resize 600×750 LANCZOS q90 | Established project headshot pattern |
| /find-headshots skill | Per-senator headshot approval | Mandatory — never batch import without approval |

### Database Tables Involved

| Table | Phase 61 Usage |
|-------|----------------|
| `essentials.chambers` | 2 new rows: CA Senate + CA Assembly (neither exists yet) |
| `essentials.politicians` | 40 new senator rows (61-01); 80 assembly rows (dedup/update in 61-02) |
| `essentials.offices` | 40 senator office rows (61-01); 80 assembly office rows (61-02) |
| `essentials.politician_images` | Up to 120 new rows (61-03); pre-existing assembly headshots skip |

---

## Architecture Patterns

### Confirmed DB State (from Phase 57, 59, 60 summaries)

**CA government UUID:** `e0f33bda-bfb5-4dd0-9816-576e6ce35fac`

**CA chamber short names** (8 executive chambers, use these in WHERE clauses):
```
Governor, Lieutenant Governor, Attorney General, Secretary of State,
Controller, Treasurer, Commissioner of Insurance, Superintendent of Public Instruction
```

**CA legislature chambers** (DO NOT EXIST YET — must create in 61-01 migration 194):
- `California State Senate` → slug will auto-generate as `california-state-senate`
- `California State Assembly` → slug will auto-generate as `california-state-assembly`
- Both: `government_id = (SELECT id FROM essentials.governments WHERE name = 'State of California')`

**CA SLDU districts (STATE_UPPER):**
- 40 rows confirmed (G5210, Phase 57 smoke test: G5210=40)
- `geo_id = '06' + zero-padded-3-digit-district` (e.g., SD-01 → `'06001'`, SD-40 → `'06040'`)
- `district_type = 'STATE_UPPER'`, `state = 'ca'` (lowercase — confirmed from Phase 57 TIGER loader)
- Example: SF City Hall smoke test returned `G5210 geo_id=06011 name=State Senate District 11`

**CA SLDL districts (STATE_LOWER):**
- 80 rows confirmed (G5220, Phase 57 smoke test: G5220=80)
- `geo_id = '06' + zero-padded-3-digit-district` (e.g., AD-01 → `'06001'`, AD-80 → `'06080'`)
- `district_type = 'STATE_LOWER'`, `state = 'ca'` (lowercase)
- Example: SF City Hall smoke test returned `G5220 geo_id=06017 name=Assembly District 17`
- CRITICAL: STATE_UPPER and STATE_LOWER share geo_id namespace — disambiguate by district_type in all WHERE clauses

**Next migration number:** 194 (confirmed from STATE.md and Phase 60-02 summary)

### Migration 194: 61-01 — CA Senate Chambers + 40 Senators

Structure mirrors `172_me_state_senate_officials.sql` exactly, with additions for chamber creation.

```sql
BEGIN;

-- Step 0: Create CA Senate chamber (doesn't exist — 8 exec chambers only from Phase 59)
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'California State Senate',
       'California State Senate',
       (SELECT id FROM essentials.governments WHERE name = 'State of California')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'California State Senate'
    AND government_id = (SELECT id FROM essentials.governments WHERE name = 'State of California')
);

-- Step 1 (optional pre-check): 40 senator CTEs
-- For each district SD-01 to SD-40:
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), '{senator_name}', '{first}', '{last}', '{party}',
          true, false, false, true, -6001001)  -- SD-01 example
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers WHERE name = 'California State Senate'
          AND government_id = (SELECT id FROM essentials.governments WHERE name = 'State of California')),
       p.id,
       'Senator', 'CA', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '06001' AND d.district_type = 'STATE_UPPER' AND d.state = 'ca'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id
      AND o.chamber_id = (SELECT id FROM essentials.chambers WHERE name = 'California State Senate'
                          AND government_id = (SELECT id FROM essentials.governments WHERE name = 'State of California'))
  );

-- Step 2: office_id back-fill
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -6001040 AND -6001001
  AND p.office_id IS NULL;

COMMIT;
```

**Key differences from ME senate (migration 172):**
- Must CREATE the CA Senate chamber (ME already had it from Phase 50)
- `state = 'ca'` (lowercase) not `'me'`
- `representing_state = 'CA'` (uppercase — matches federal pattern)
- geo_id format: `'06' + zero-padded-3-digit` (e.g., `'06001'` not just `'1'`)
- Title: `'Senator'` (same as ME)

### Migration 195: 61-02 — CA Assembly Chamber + Dedup + Offices

Models Phase 59's dedup approach (migration 192) for the pre-existing assembly rows.

```sql
BEGIN;

-- Step 0: Create CA Assembly chamber
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'California State Assembly',
       'California State Assembly',
       (SELECT id FROM essentials.governments WHERE name = 'State of California')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'California State Assembly'
    AND government_id = (SELECT id FROM essentials.governments WHERE name = 'State of California')
);

-- Step 1: Update existing assembly member external_ids from -100xxx to -6002xxx scheme
-- For each AD district with a pre-existing politician:
UPDATE essentials.politicians
SET external_id = -6002001  -- AD-01 example
WHERE external_id = -100049; -- old value from Phase 60 audit

-- (repeat for each pre-existing row)

-- Step 2: INSERT for any AD districts without a pre-existing politician
-- (fill gaps if the -100049..-100119 range didn't cover all 80 districts)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), '{member_name}', '{first}', '{last}', '{party}',
          true, false, false, true, -6002001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
-- office INSERT (same pattern as senators)

-- Step 3: INSERT assembly offices for ALL 80 assembly members
-- (both those with updated external_ids AND newly inserted ones)

-- Step 4: office_id back-fill
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -6002080 AND -6002001
  AND p.office_id IS NULL;

COMMIT;
```

### Anti-Patterns to Avoid

- **Including `slug` in any chamber INSERT:** `GENERATED ALWAYS` column — will error. Never include.
- **Using state='CA' (uppercase) for STATE_UPPER/STATE_LOWER district lookup:** TIGER loader used lowercase `'ca'`. Always use `state = 'ca'` in WHERE clauses for SLDU/SLDL districts.
- **Using state='ca' (lowercase) for `representing_state` on office rows:** Office rows use uppercase `'CA'` (same as ME uses 'ME').
- **Using geo_id without zero-padding:** `'06001'` not `'6001'` — all CA geo_ids use 5-digit format with leading '06'.
- **Using the conflicting senator scheme -6000101..-6000140:** Those IDs are occupied by CA executives. Use `-6001001`-`-6001040`.
- **Using the conflicting assembly scheme -6000201..-6000280:** Those IDs are partially occupied by Padilla/Cárdenas/Aguilar. Use `-6002001`-`-6002080`.
- **Hardcoding government UUID:** Always use `SELECT id FROM essentials.governments WHERE name = 'State of California'`.
- **Assuming CA chambers exist:** Phase 59 created only 8 executive chambers. CA Senate and CA Assembly chambers must be created in Phase 61.

---

## DB Audit Results

### Senator Pre-Check

From Phase 59-02 and 60-01 summaries: CA State Senator rows do NOT exist in the DB.
- The CA exec external_id range (`-6000101`-`-6000108`) is occupied by constitutional officers, NOT senators.
- The CONTEXT.md's proposed senator scheme `-6000101`-`-6000140` conflicts with this range.
- Confirmed: no politician rows linked to a CA State Senate chamber (that chamber doesn't exist yet).

**Pre-check SQL to run before 61-01:**
```sql
-- Verify no rows in proposed new senator range
SELECT external_id, full_name FROM essentials.politicians
WHERE external_id BETWEEN -6001040 AND -6001001;
-- Expected: 0 rows

-- Also verify no CA State Senate chamber exists
SELECT name, slug FROM essentials.chambers
WHERE name LIKE '%State Senate%'
  AND government_id = (SELECT id FROM essentials.governments WHERE name = 'State of California');
-- Expected: 0 rows
```

### CA Assembly Pre-Existing Rows

The -100049 to -100119 range is occupied by CA Assembly members. Key facts:
- `-100049` = First assembly member (confirmed — Phase 60-01 discovered this when trying to use -100097 for Aguilar)
- `-100097` = Josh Lowenthal (CA Assembly, not Pete Aguilar) — Phase 60-01 explicit discovery
- The range has 71 possible odd-numbered slots between -100049 and -100119: 36 slots
- Total 80 assembly districts but only some have pre-existing rows (71 possible slots in the odd-number range suggests ~36 potential rows, leaving ~44 gaps)

**NOTE:** The Phase 60-01 summary says the plan originally assigned -100049..-100117 for 34 House reps and hit a collision, meaning the assembly range extends at least to -100097 (Lowenthal). The exact district-to-id mapping and gap analysis must be done in 61-02 with a live DB query.

**Pre-check SQL to run before 61-02:**
```sql
-- Get full audit of pre-existing assembly rows
SELECT p.external_id, p.full_name,
       COUNT(pi.id) as has_headshot,
       p.office_id IS NOT NULL as has_office_id
FROM essentials.politicians p
LEFT JOIN essentials.politician_images pi ON pi.politician_id = p.id
WHERE p.external_id BETWEEN -100119 AND -100049
ORDER BY p.external_id;
-- Expected: some rows (need to count to know how many gaps exist)
```

### CA Legislature Chambers

**Confirmed NOT existing** from Phase 59-01-SUMMARY.md — only 8 executive chambers were created/verified:
```
Governor, Lieutenant Governor, Attorney General, Secretary of State,
Controller, Treasurer, Commissioner of Insurance, Superintendent of Public Instruction
```
Neither "California State Senate" nor "California State Assembly" appears. These must be created in migration 194.

**Verification SQL:**
```sql
SELECT name, slug FROM essentials.chambers c
JOIN essentials.governments g ON g.id = c.government_id
WHERE g.name = 'State of California'
ORDER BY name;
-- Expected: 8 rows (executive only), no Senate/Assembly chambers
```

### SLDU/SLDL Districts

**Confirmed from Phase 57 smoke test output:**

| District Type | MTFCC | Count | geo_id Pattern | state |
|--------------|-------|-------|----------------|-------|
| STATE_UPPER (senate) | G5210 | 40 | `'06NNN'` (e.g. `'06011'`, `'06026'`, `'06039'`) | `'ca'` lowercase |
| STATE_LOWER (assembly) | G5220 | 80 | `'06NNN'` (e.g. `'06017'`, `'06052'`, `'06078'`) | `'ca'` lowercase |

Sample geo_ids verified:
- SD-11 → `'06011'`, SD-26 → `'06026'`, SD-39 → `'06039'`
- AD-17 → `'06017'`, AD-52 → `'06052'`, AD-78 → `'06078'`

**Disambiguation rule:** Both STATE_UPPER and STATE_LOWER use the same geo_id namespace (both `'06NNN'`). Always filter by `district_type` in WHERE clauses.

### Next Migration Number

**Confirmed: 194** from STATE.md (updated after Phase 60-02 completion):
> "Next migration is 194"

Migration 193 = `193_ca_federal_officials.sql` (applied 2026-05-21)

---

## CA Legislature Roster (Current)

### Current CA State Senators (40th Legislature, 2025-2026)

Research confirmed the current roster must be sourced from the official CA Senate roster at https://www.senate.ca.gov/senators at plan execution time. The Supt. period started Jan 2025 for the 40th Senate.

**Source URL for roster:** `https://www.senate.ca.gov/senators` (official listing with 40 senators and district numbers)

The executing agent must compile the complete 40-senator roster (names, parties, districts) from this source at plan execution time.

### Current CA Assembly Members (2025-2026 Session)

**Source URL for roster:** `https://www.assembly.ca.gov/assemblymembers` (official listing)

From the Assembly members page (verified 2026-05-21):
- 60 Democrats, 20 Republicans (from page analysis)
- All 80 districts are filled

The executing agent must compile the complete 80-member roster from this source at plan execution time.

---

## Headshot Sources

### CA Assembly: Bulk URL Pattern (HIGH CONFIDENCE)

**Primary source (VERIFIED):** `https://webapi.assembly.ca.gov/district-media/assets/members/assembly_member_NN.jpg`

Where `NN` = two-digit district number with leading zero (e.g., `01`, `07`, `80`).

**Verified dimensions:** 500×500 pixels (square JPEG)

**Processing required:**
- Image is SQUARE (1:1), NOT 4:5
- Must crop to 4:5 BEFORE resizing
- Standard crop: from 500×500, crop to 400×500 (center crop to 4:5 ratio) then resize to 600×750
- PIL pattern: `crop((50, 0, 450, 500))` then `resize((600, 750), Image.LANCZOS)`
- `photo_license = 'public_domain'` (official CA government images)

**Tested for:**
- `assembly_member_01.jpg` → 500×500 JPEG (235KB, quality=100)
- `assembly_member_30.jpg` → 500×500 JPEG (~22KB)
- `assembly_member_80.jpg` → 500×500 JPEG (~28KB)

**Coverage:** All 80 districts confirmed available from the assemblymembers listing page.

**Recommendation for 61-03:** Loop districts 01-80, download each assembly_member_NN.jpg, crop 400×500 from center, resize to 600×750 Lanczos q90. This can be scripted as a batch PowerShell/Python loop — no per-member manual lookup needed. Still upload and verify ONE AT A TIME per project memory rule.

### CA Senate: Per-District Approach (MEDIUM CONFIDENCE)

**No bulk API or consistent URL pattern exists for Senate photos.**

Each senator's district website must be visited individually:
- `https://sdNN.senate.ca.gov` (most districts, e.g., sd01, sd02, sd10, sd20, sd25)
- `https://srNN.senate.ca.gov` (some Republican senators use `sr` prefix, e.g., sr40 for SD-40 Sen. Jones)

**Headshot URL pattern varies by district:**
- Most use `/sites/sdNN.senate.ca.gov/files/website/sdNN_headshot.jpg`
- Some use `SDxx_headshot.jpg` (uppercase prefix)
- Some have `_footer_headshot.png` (274×258 — too small; look for full-size version)
- SD-40 Jones used: `/sites/sr40.senate.ca.gov/files/Jones_headshoto_2024.jpg`

**Verified dimensions by district:**
| District | Senator | Dimensions | Notes |
|---------|---------|-----------|-------|
| SD-02 | Mike McGuire | 450×600 | 3:4 ratio — needs crop to 4:5, then resize |
| SD-10 | Aisha Wahab | 1000×1400 | Good quality; needs crop+resize |
| SD-20 | Caroline Menjivar | headshot (size unverified) | URL confirmed: `sd20_headshot.jpg` |
| SD-25 | Sasha Renée Pérez | 512×512 (if _footer version) | Check if full-size exists; footer PNG may be low quality |
| SD-35 | Laura Richardson | 274×258 (footer thumb) | Very small — use Lanczos upscale per project policy |
| SD-40 | Brian Jones | varies | Both 2024 and 2025 portraits available |

**Processing required:**
- Photos will be various sizes and ratios
- Crop to 4:5 ratio first, then resize to 600×750 (Lanczos, q90)
- Upscale approved: Phase 52 ME House thumbnails (152×202) were upscaled with Lanczos — same policy applies
- Per project policy: Lanczos upscale acceptable for small official photos (coverage > pixel-perfect quality)

**Recommendation for 61-03:**
- Use /find-headshots skill per senator (40 runs), ONE AT A TIME
- Visit sdNN.senate.ca.gov (or srNN for Republican senators) for each
- Try `sdNN_headshot.jpg` first; fall back to page inspection if that fails
- Note: some districts use `sr` prefix — must determine which

**sr vs sd prefix:** Republican senators appear more likely to use `sr` prefix (Jones SD-40 → sr40). Check per senator.

### Headshots Already Uploaded (Pre-Existing Assembly)

Some -100049..-100119 Assembly rows may already have `politician_images` entries (uploaded during prior CA work). The pre-flight query in 61-02 must check headshot status before triggering any uploads. Only upload for rows without an existing `politician_images` entry.

```sql
SELECT p.external_id, p.full_name,
       CASE WHEN pi.id IS NOT NULL THEN 'HAS_HEADSHOT' ELSE 'NEEDS_HEADSHOT' END as status
FROM essentials.politicians p
LEFT JOIN essentials.politician_images pi ON pi.politician_id = p.id
WHERE p.external_id BETWEEN -100119 AND -100049
ORDER BY p.external_id;
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chamber lookup in office INSERT | Hardcoded UUID | Subquery `WHERE name = 'California State Senate'` | UUID not known until runtime; subquery is safe and idempotent |
| Idempotency for politician INSERT | WHERE NOT EXISTS | `ON CONFLICT (external_id) DO NOTHING` | Unique index on external_id |
| Idempotency for office INSERT | INSERT always | `WHERE NOT EXISTS on (district_id, chamber_id)` | No unique constraint on offices |
| Assembly photo batch | Manual download per-member | Loop `assembly_member_NN.jpg` for NN=01..80 | Consistent URL pattern makes scripting safe |
| Image crop | direct resize | Crop 4:5 first THEN resize | Assembly images are 500×500 (square); senate images have mixed ratios |
| External_id generation | Sequential from last used | Use new -6001xxx (senator) or -6002xxx (assembly) ranges | All prior CA ranges are occupied |

---

## Common Pitfalls

### Pitfall 1: Using conflicting external_id schemes
**What goes wrong:** `ON CONFLICT (external_id) DO NOTHING` silently updates the wrong row, or fails with a key constraint.
**Why it happens:** The proposed schemes in CONTEXT.md were written before Phase 60 confirmed that -6000101..-6000108 are CA execs and -6000201..-6000204 are federal slots.
**How to avoid:** Use `-6001001`-`-6001040` for senators, `-6002001`-`-6002080` for assembly members. Run the pre-check SQL before writing any migration.
**Warning signs:** Senator INSERT returns `ON CONFLICT` DO NOTHING when it shouldn't.

### Pitfall 2: Omitting chamber creation in 61-01
**What goes wrong:** Office INSERT references a non-existent chamber, finds NULL chamber_id, silently inserts offices with NULL chamber_id — or the subquery returns NULL and CROSS JOIN skips all inserts.
**Why it happens:** Phase 59 only created executive chambers. CA Senate and CA Assembly chambers don't exist.
**How to avoid:** Migration 194 must CREATE both chambers BEFORE the 40 senator CTEs. Verify after migration: `SELECT COUNT(*) FROM essentials.chambers WHERE name IN ('California State Senate', 'California State Assembly') AND government_id = ...` → expect 2.
**Warning signs:** Office INSERT produces 0 rows even though district row exists.

### Pitfall 3: Using state='CA' uppercase for STATE_UPPER/STATE_LOWER district lookup
**What goes wrong:** `WHERE d.geo_id = '06001' AND d.district_type = 'STATE_UPPER' AND d.state = 'CA'` returns 0 rows.
**Why it happens:** The TIGER loader used lowercase abbreviation (`abbrev = 'ca'`). STATE_UPPER/STATE_LOWER rows have `state = 'ca'`.
**How to avoid:** Always use `state = 'ca'` (lowercase) for STATE_UPPER and STATE_LOWER districts. The Phase 57 smoke test verified this.
**Warning signs:** Office INSERT produces 0 rows despite districts existing.

### Pitfall 4: Including slug column in chamber INSERT
**What goes wrong:** `ERROR: cannot insert into a generated column "slug"`
**Why it happens:** `essentials.chambers.slug` is `GENERATED ALWAYS` — confirmed across Phases 50, 52, 59.
**How to avoid:** Never include `slug` in any INSERT column list.

### Pitfall 5: geo_id without '06' prefix or wrong zero-padding
**What goes wrong:** District lookup returns 0 rows.
**Why it happens:** CA geo_ids are 5-character strings: `'06' + 3-digit-padded`. SD-01 is `'06001'`, NOT `'1'` or `'001'` or `'060001'`.
**How to avoid:** Use `'06' || lpad(district_number::text, 3, '0')` in generator scripts. Verify against Phase 57 smoke test values.
**Warning signs:** `geo_id = '06001'` works but `geo_id = '6001'` returns 0.

### Pitfall 6: Using src='sd' prefix for Republican senators
**What goes wrong:** `sdNN.senate.ca.gov` returns 503/404 for some Republican senators.
**Why it happens:** Some Republican senators use `srNN.senate.ca.gov` (e.g., sr40 = SD-40 Sen. Jones).
**How to avoid:** Try `sdNN` first. If 503/404, try `srNN`. Both URL schemes route to the senator's website.
**Warning signs:** Photo lookup returns connection error.

### Pitfall 7: Assembly photos are square — don't skip the crop step
**What goes wrong:** Photos uploaded as 600×500 or distorted 600×750.
**Why it happens:** `assembly_member_NN.jpg` files are 500×500 (square). Resizing directly to 600×750 without cropping first will distort the image.
**How to avoid:** Always crop 500×500 → 400×500 (center crop to 4:5 ratio) BEFORE resizing to 600×750 Lanczos.

### Pitfall 8: CA Assembly member name conflicts with existing politician rows
**What goes wrong:** A pre-existing assembly member has a different name format or there's a duplicate politician row.
**Why it happens:** The -100049..-100119 range was pre-seeded from unknown prior work. Names, parties, or external_ids may be in unexpected state.
**How to avoid:** Run the full audit SQL in 61-02 before writing any INSERT. Update the pre-existing rows (external_id change only); don't delete and re-insert.

---

## Code Examples

### Chamber Creation (required in 61-01 and 61-02)
```sql
-- Source: Phase 50 (migration 168) pattern + Phase 59-01 anti-pattern lesson
-- NEVER include slug column
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'California State Senate',
       'California State Senate',
       (SELECT id FROM essentials.governments WHERE name = 'State of California')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'California State Senate'
    AND government_id = (SELECT id FROM essentials.governments WHERE name = 'State of California')
);
```

### Senator INSERT + Office (CTE pattern from migration 172)
```sql
-- Source: C:/EV-Accounts/backend/migrations/172_me_state_senate_officials.sql
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Brian Jones', 'Brian', 'Jones', 'Republican',
          true, false, false, true, -6001040)  -- SD-40
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers WHERE name = 'California State Senate'
          AND government_id = (SELECT id FROM essentials.governments WHERE name = 'State of California')),
       p.id,
       'Senator', 'CA', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '06040' AND d.district_type = 'STATE_UPPER' AND d.state = 'ca'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id
      AND o.chamber_id = (SELECT id FROM essentials.chambers WHERE name = 'California State Senate'
                          AND government_id = (SELECT id FROM essentials.governments WHERE name = 'State of California'))
  );
```

### Assembly Dedup Pattern (Update + New Office)
```sql
-- Source: Phase 59-02 migration 192 dedup pattern
-- Step 1: Update external_id from old -100xxx scheme to new -6002xxx scheme
UPDATE essentials.politicians
SET external_id = -6002001  -- new AD-01 id
WHERE external_id = -100049;  -- old pre-existing id for AD-01 member

-- Step 2: Insert office row (new chamber required in 61-02)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers WHERE name = 'California State Assembly'
          AND government_id = (SELECT id FROM essentials.governments WHERE name = 'State of California')),
       p.id,
       'Assembly Member', 'CA', false, false, NULL
FROM essentials.districts d
CROSS JOIN (SELECT id FROM essentials.politicians WHERE external_id = -6002001) p
WHERE d.geo_id = '06001' AND d.district_type = 'STATE_LOWER' AND d.state = 'ca'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id
      AND o.chamber_id = (SELECT id FROM essentials.chambers WHERE name = 'California State Assembly'
                          AND government_id = (SELECT id FROM essentials.governments WHERE name = 'State of California'))
  );
```

### Assembly Headshot Batch Download (Python)
```python
# Source: Phase 57 pattern adapted for bulk assembly download
import urllib.request
from PIL import Image

for district in range(1, 81):
    nn = f"{district:02d}"
    url = f"https://webapi.assembly.ca.gov/district-media/assets/members/assembly_member_{nn}.jpg"
    urllib.request.urlretrieve(url, f"/tmp/assembly_{nn}_raw.jpg")
    
    img = Image.open(f"/tmp/assembly_{nn}_raw.jpg").convert("RGB")
    # Image is 500×500 square — crop center to 4:5 (400×500)
    w, h = img.size  # 500, 500
    new_w = int(h * 4/5)  # = 400
    left = (w - new_w) // 2  # = 50
    img = img.crop((left, 0, left + new_w, h))  # 400×500
    img = img.resize((600, 750), Image.LANCZOS)
    img.save(f"/tmp/assembly_{nn}_headshot.jpg", "JPEG", quality=90)
```

### Address Routing Smoke Test (for 61-01 verification)
```sql
-- Verify SF City Hall returns correct senator after 61-01 migration
SELECT p.full_name, d.geo_id, d.district_type
FROM essentials.geofence_boundaries gb
JOIN essentials.districts d
  ON d.geo_id = gb.geo_id AND d.mtfcc = gb.mtfcc
JOIN essentials.offices o ON o.district_id = d.id
JOIN essentials.politicians p ON p.id = o.politician_id
WHERE gb.geometry && ST_SetSRID(ST_MakePoint(-122.4191, 37.7792), 4326)
  AND ST_Contains(gb.geometry, ST_SetSRID(ST_MakePoint(-122.4191, 37.7792), 4326))
  AND d.district_type = 'STATE_UPPER'
  AND o.is_vacant = false;
-- Expected: 1 row — senator for SD-11 (geo_id '06011')

-- Also verify State Assembly:
-- SD-17 geo_id '06017' should return correct Assembly Member
SELECT p.full_name, d.geo_id, d.district_type
FROM essentials.geofence_boundaries gb
JOIN essentials.districts d
  ON d.geo_id = gb.geo_id AND d.mtfcc = gb.mtfcc
JOIN essentials.offices o ON o.district_id = d.id
JOIN essentials.politicians p ON p.id = o.politician_id
WHERE gb.geometry && ST_SetSRID(ST_MakePoint(-122.4191, 37.7792), 4326)
  AND ST_Contains(gb.geometry, ST_SetSRID(ST_MakePoint(-122.4191, 37.7792), 4326))
  AND d.district_type = 'STATE_LOWER'
  AND o.is_vacant = false;
-- Expected: 1 row — assembly member for AD-17 (geo_id '06017')
```

---

## Planning Recommendations for Each Plan

### 61-01: Migration — 40 CA State Senators + SLDU offices (Migration 194)

**Pre-checks (tasks 1-2):**
1. Verify zero rows in `-6001001`-`-6001040` range
2. Verify CA State Senate chamber does not exist
3. Verify 40 STATE_UPPER districts exist with state='ca' lowercase
4. Fetch current senator roster from https://www.senate.ca.gov/senators

**Migration content (single migration 194):**
1. Create CA State Senate chamber (guarded by WHERE NOT EXISTS)
2. 40 CTE blocks (one per SD-01 through SD-40) using `-6001001`-`-6001040` scheme
3. `office_id` back-fill UPDATE for external_id BETWEEN -6001040 AND -6001001

**Verification:**
- Senate chamber exists with non-null slug
- 40 senator politician rows with correct external_ids
- 40 office rows linked to STATE_UPPER districts
- SF address routing returns correct SD-11 senator

### 61-02: Migration — 80 CA Assembly Members + SLDL offices (Migration 195)

**Pre-checks (tasks 1-2):**
1. Full audit of -100049..-100119 range (count rows, identify gaps, check headshots)
2. Verify CA State Assembly chamber does not exist
3. Verify 80 STATE_LOWER districts exist with state='ca' lowercase

**Migration content (single migration 195):**
1. Create CA State Assembly chamber (guarded by WHERE NOT EXISTS)
2. UPDATE external_ids for all pre-existing rows: `-100xxx` → `-6002xxx`
3. INSERT new politician rows for any AD districts with no pre-existing row
4. INSERT office rows for ALL 80 assembly members (link to SLDL districts via STATE_LOWER)
5. `office_id` back-fill UPDATE for external_id BETWEEN -6002080 AND -6002001

**Verification:**
- Assembly chamber exists with non-null slug
- 80 assembly politician rows with -6002001..-6002080 external_ids
- 80 office rows linked to STATE_LOWER districts
- SF address routing returns correct AD-17 assembly member

### 61-03: Headshots — All 120 State Legislators

**Batch structure recommendation:**
- Sub-task A: Assembly headshots (80 photos) — scriptable bulk download from `assembly_member_NN.jpg`
- Sub-task B: Senate headshots (40 photos) — per-senator via /find-headshots skill

**For Assembly:**
- Download all 80 from `https://webapi.assembly.ca.gov/district-media/assets/members/assembly_member_NN.jpg`
- Crop 500×500 → 400×500 (center crop), resize to 600×750 Lanczos q90
- Skip any assembly member that already has a `politician_images` entry (pre-existing headshot)
- Upload to `{politician_id}-headshot.jpg` in politician_photos bucket
- Insert `politician_images` row with `url`, `type='default'`, `photo_license='public_domain'`

**For Senate:**
- Use /find-headshots skill ONE SENATOR AT A TIME
- Primary URL: `https://sdNN.senate.ca.gov` (or `srNN` if 503)
- Look for `sdNN_headshot.jpg` or `SDxx_headshot.jpg` — inspect page if not found
- All photos will need 4:5 crop + resize (no consistent aspect ratio)
- Upscale acceptable per project policy (coverage > quality)
- photo_license = 'public_domain' (official government websites)
- `photo_origin_url` = source page URL (the senate.ca.gov district page)

---

## Open Questions

1. **Exact assembly district-to-pre_existing_external_id mapping**
   - What we know: -100049..-100119 range occupied by CA Assembly (71 possible odd-numbered slots = ~36 values)
   - What's unclear: Which exact external_ids map to which assembly districts; how many gaps exist; which pre-existing rows already have headshots
   - Recommendation: Run the full audit SQL at start of 61-02; plan execution must establish this mapping before writing migration 195

2. **Which CA Senate districts use sr vs sd URL prefix**
   - What we know: Most use sd prefix; SD-40 (Jones, Republican) uses sr40; sr appears correlated with Republican senators
   - What's unclear: Whether all Republican senators use sr prefix or only some
   - Recommendation: During 61-03, try sdNN first, fall back to srNN if 503/404; document per senator in summary

3. **CA State Legislature session validation**
   - What we know: Current session is 2025-2026 California Legislature
   - What's unclear: Any vacancies or special election winners between now and execution
   - Recommendation: Re-verify roster from senate.ca.gov and assembly.ca.gov at execution time

4. **Assembly members with no pre-existing row (gaps in -100049..-100119)**
   - What we know: 80 districts exist but the -100049..-100119 odd range has max ~36 slots, suggesting ~44 gaps
   - What's unclear: Which specific districts lack pre-existing rows
   - Recommendation: The audit SQL will reveal gaps; new rows need both politician INSERT + office INSERT in migration 195

---

## Sources

### Primary (HIGH confidence)
- Phase 57-02-SUMMARY.md — confirmed G5210=40, G5220=80, geo_id format `'06NNN'`, state=`'ca'` lowercase
- Phase 59-01-SUMMARY.md — confirmed 8 executive chambers only; no CA Senate/Assembly chambers; chamber short names
- Phase 59-02-SUMMARY.md — confirmed CA exec external_ids -6000101..-6000108 in live DB
- Phase 60-01-SUMMARY.md — confirmed -100049..-100119 range occupied by CA Assembly; -6000201=Padilla; -6000203=Cárdenas; -6000204=Aguilar; -6000301..-6000352=CA House; migration 193 applied
- STATE.md — confirmed "Next migration is 194"; CA government UUID; confirmed assembly collision discovery
- C:/EV-Accounts/backend/migrations/172_me_state_senate_officials.sql — canonical migration pattern for state legislators
- https://webapi.assembly.ca.gov/district-media/assets/members/assembly_member_01.jpg — verified 500×500 JPEG
- https://webapi.assembly.ca.gov/district-media/assets/members/assembly_member_80.jpg — verified 500×500 JPEG
- https://www.assembly.ca.gov/assemblymembers — confirmed bulk URL pattern for all 80 districts

### Secondary (MEDIUM confidence)
- https://sd02.senate.ca.gov — headshot URL pattern: `/sites/sd02.senate.ca.gov/files/website/SD02_headshot.jpg`, size 450×600
- https://sd10.senate.ca.gov — headshot URL pattern: `/sites/sd10.senate.ca.gov/files/website/sd10_headshot.jpg`, size 1000×1400
- https://sd20.senate.ca.gov — headshot URL pattern confirmed: `sd20_headshot.jpg`
- https://sr40.senate.ca.gov/biography — Republican SD-40 Jones uses sr prefix; headshot at unusual filename
- https://sd35.senate.ca.gov — footer headshot PNG confirmed at 274×258 (small, upscale acceptable)

### Tertiary (LOW confidence)
- Senate URL prefix (sr vs sd for Republican senators) — not fully surveyed; confirmed for SD-40 only; behavior for other Republicans not verified

---

## Metadata

**Confidence breakdown:**
- External_id conflict: HIGH — derived directly from Phase 59-02/60-01 summaries confirming live DB state
- Proposed new schemes (-6001xxx, -6002xxx): HIGH — clearly outside all occupied ranges
- CA legislature chambers don't exist: HIGH — Phase 59-01 summary explicitly lists only 8 executive chambers
- SLDU/SLDL district geo_id format and state casing: HIGH — Phase 57-02 smoke test output shows exact values
- Next migration number (194): HIGH — STATE.md confirmed after Phase 60-02
- Assembly headshot URL pattern: HIGH — three URLs verified returning valid JPEGs
- Assembly photo dimensions (500×500 square): HIGH — PIL confirmed for 3 samples
- Senate headshot per-district approach: HIGH — confirmed no bulk pattern exists
- Senate photo dimensions: MEDIUM — only 2 senators sampled (450×600, 1000×1400)
- sr vs sd Senate URL prefix: LOW — only SD-40 confirmed as sr; pattern not fully surveyed

**Research date:** 2026-05-21
**Valid until:** 2026-07-21 (legislators stable mid-term; assembly photo API stable; headshot quality known)
