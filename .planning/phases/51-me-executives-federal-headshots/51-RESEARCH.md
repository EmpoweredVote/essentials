# Phase 51: ME Executives + Federal Officials + Headshots - Research

**Researched:** 2026-05-18
**Domain:** Maine statewide executives + federal delegation (US Senators, 2 US House reps) + headshots
**Confidence:** HIGH

---

## Summary

This research establishes everything needed to seed the 4 ME statewide executives and 4 ME federal
officials (2 US Senators + 2 US House reps) into the DB, wire their districts and chambers, and
import their headshots.

Three migrations are needed:
- Migration 169: 4 STATE_EXEC districts + 4 politician/office pairs for ME executives
  (Governor, AG, SoS, Treasurer) — AG/SoS/Treasurer have is_appointed_position=true
- Migration 170: ME NATIONAL_UPPER district + 2 US Senators (Collins, King) + 2 US House reps
  (Pingree/ME-01, Golden/ME-02) — uses existing shared federal chamber UUIDs

**CRITICAL INCUMBENT CORRECTION:** The phase context says Treasurer = "Henry Beck" but Henry Beck
LEFT OFFICE on January 6, 2025. The current Maine Treasurer is **Joseph C. Perry** (D), elected
by the Legislature in December 2024. This was confirmed directly from maine.gov/treasurer. Use
"Joseph C. Perry" in all migrations.

**CRITICAL DB FACT:** ME Executive chambers were ALREADY created in Phase 50 (migration 168).
Plan 51-01 does NOT need to create chambers — it only needs to create STATE_EXEC districts and
insert politicians + offices using the existing chamber IDs confirmed below.

**Primary recommendation:** Model executive migration directly after Phase 40 Plan 40-01
(MA executives) but omit the chamber-creation step (chambers already exist from Phase 50).
Federal migration follows Plan 40-02 exactly but with 2 reps instead of 9.

---

## Standard Stack

### Core: Libraries and Tools
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| PIL (Pillow) | installed | crop 4:5 then resize 600x750 LANCZOS q90 | Established project pattern for all headshots |
| psql | system | Apply SQL migrations | Standard; DATABASE_URL from C:/EV-Accounts/backend/.env |
| /find-headshots skill | v1 | Per-photo approval workflow | Mandatory — never batch import without approval |

### Database Architecture: Verified Live DB Facts

**ME government row (Phase 50, migration 168):**
- UUID: `da88de8b-9afa-4d87-86d5-7eb83c3e9792`
- name: `'State of Maine'`
- state: `'ME'` (uppercase)
- geo_id: `'23'`

**ME executive chambers (Phase 50, migration 168) — ALREADY EXIST:**
| Chamber Name | UUID | Slug |
|---|---|---|
| Maine Attorney General | `fc5dca62-2232-44de-89a1-3afe28f998c9` | maine-attorney-general |
| Maine Governor | `cd5ab918-e3d5-445b-a899-2f9864c1c0f1` | maine-governor |
| Maine House of Representatives | `5820521b-cd21-4bf1-9296-fd848230d542` | maine-house-of-representatives |
| Maine Secretary of State | `94118587-35db-4bc2-90d0-ca52b878bbe8` | maine-secretary-of-state |
| Maine Senate | `e5018769-ca38-44ea-bd07-47ba5f08bb7c` | maine-senate |
| Maine Treasurer | `47e1e78b-6103-4e7d-a222-55fc48bb9743` | maine-treasurer |

Note: Maine House and Maine Senate chambers are not needed for Phase 51 — they are listed for completeness.

**Existing US Federal chambers (shared — do NOT create new ones):**
- `U.S. Senate` — UUID `7cbe07bc-84b8-433b-952b-540e7de18a92`
- `U.S. House of Representatives` — UUID `c2facc31-7b13-428c-b7b9-32d0d3b95f76`

**ME NATIONAL_LOWER districts (Phase 49 — ALREADY EXIST):**
| geo_id | label | UUID |
|---|---|---|
| 2301 | Congressional District 1 | `5deede32-c52b-49e9-93c1-f7cd2e271630` |
| 2302 | Congressional District 2 | `3cc79d59-7e84-43c4-840c-e40e12980fc2` |

Note: NATIONAL_LOWER districts use `state = 'ME'` (uppercase) — confirmed from live DB.

**ME NATIONAL_UPPER district:** Does NOT exist yet. Must be created in migration 170.
Pattern: `district_type='NATIONAL_UPPER', state='ME', geo_id='23', label='Maine', district_id='Maine', mtfcc=''`

**STATE_EXEC districts for ME:** Do NOT exist yet. Must be created in migration 169.
Confirmed: no rows in essentials.districts WHERE district_type='STATE_EXEC' AND state='ME'.

**role_canonical column on essentials.offices:** EXISTS (nullable TEXT, added in Phase 40 migration 154).
No ALTER TABLE needed in Phase 51.

**is_appointed_position column on essentials.offices:** EXISTS (nullable boolean).
Set to `true` for AG, SoS, Treasurer. Set to `false` for Governor.

---

## Current Officeholders

### ME State Executives (4 officials — confirmed from maine.gov official pages)
Sources: maine.gov/governor/mills, maine.gov/ag, maine.gov/sos, maine.gov/treasurer

| Office | Official Title (display) | Incumbent | Party | is_appointed_position | Notes |
|--------|--------------------------|-----------|-------|----------------------|-------|
| Governor | Governor | Janet T. Mills | Democrat | false | Elected; term-limited |
| Attorney General | Attorney General | Aaron M. Frey | Democrat | true | Legislature-elected; no race rows |
| Secretary of State | Secretary of State | Shenna Bellows | Democrat | true | Legislature-elected; no race rows; running for Gov 2026 |
| Treasurer | Treasurer | Joseph C. Perry | Democrat | true | Legislature-elected; took office 2025-01-06; NO race rows |

**CRITICAL: Henry Beck is NOT the Treasurer.** He left office January 6, 2025.
Joseph C. Perry (Joe Perry) is the current Maine State Treasurer, elected by Joint Convention
of the House and Senate in December 2024.

**Full names for migration:**
- `'Janet T. Mills'` — first_name='Janet', last_name='Mills'
- `'Aaron M. Frey'` — first_name='Aaron', last_name='Frey'
- `'Shenna Bellows'` — first_name='Shenna', last_name='Bellows'
- `'Joseph C. Perry'` — first_name='Joseph', last_name='Perry'

### ME US Senators (2 — confirmed from official Senate websites)
| Senator | Full Name | Party | District | Notes |
|---------|-----------|-------|----------|-------|
| Senior Senator | Susan M. Collins | Republican | ME (NATIONAL_UPPER) | Up for re-election 2026 |
| Junior Senator | Angus S. King, Jr. | Independent | ME (NATIONAL_UPPER) | NOT up in 2026; next election 2030 |

**Note on Collins party:** She is Republican — use `party='Republican'` in migration.
**Note on King party:** He is Independent — use `party='Independent'` in migration.

### ME US House Representatives (2 — confirmed from official sources)
Source: congress.gov, Wikipedia 119th Congress

| geo_id | District | Full Name | Party | Notes |
|--------|----------|-----------|-------|-------|
| 2301 | ME-01 | Chellie Pingree | Democrat | Portland/southern coast; won November 2024 |
| 2302 | ME-02 | Jared Golden | Democrat | Bangor/rural; won November 2024 by ranked-choice |

**Chellie Pingree** — first_name='Chellie', last_name='Pingree'
**Jared Golden** — note: often listed as "Jared F. Golden" but "Jared Golden" is fine for DB

---

## External_id Assignments

### Proposed ME External_id Ranges — Confirmed FREE in Live DB

Live DB query confirmed: zero rows exist in `essentials.politicians` where
`external_id BETWEEN -230299 AND -230001`. All proposed IDs are free.

| external_id | Assignment |
|-------------|-----------|
| -230001 | Janet T. Mills (Governor) |
| -230002 | Aaron M. Frey (Attorney General) |
| -230003 | Shenna Bellows (Secretary of State) |
| -230004 | Joseph C. Perry (Treasurer) |
| -230101 | Susan M. Collins (US Senator, senior) |
| -230102 | Angus S. King, Jr. (US Senator, junior) |
| -230201 | Chellie Pingree (ME-01) |
| -230202 | Jared Golden (ME-02) |

**No collision check required** — entire -230001 to -230299 range is empty. Unlike MA, there is
no -230002 collision to worry about.

---

## Migration Numbering

| Migration | Content |
|-----------|---------|
| 168 | APPLIED — `168_me_government_chambers.sql` (Phase 50) |
| **169** | ME STATE_EXEC districts + 4 executives (Governor, AG, SoS, Treasurer) + their offices + office_id back-fill |
| **170** | ME NATIONAL_UPPER district + 2 US Senators + 2 US House reps + their offices + office_id back-fill |

Note: Migration 169 and 170 can be separate files (two-plan structure) or combined. The phase
roadmap specifies 51-01 for executives and 51-02 for federal officials — keep as two migrations.
Headshots are handled entirely in Plan 51-03 (no SQL migration for headshots).

---

## Architecture Patterns

### Pattern 1: ME STATE_EXEC District (no chamber creation needed)
```sql
-- STATE_EXEC districts for ME
-- state='ME' uppercase (matches NATIONAL_LOWER pattern; not lowercase like STATE_UPPER/STATE_LOWER)
-- geo_id='23' (Maine FIPS)
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, district_id, mtfcc)
SELECT gen_random_uuid(), 'STATE_EXEC', 'ME', '23', 'Maine Governor', '', ''
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE district_type = 'STATE_EXEC' AND state = 'ME' AND label = 'Maine Governor'
);
```

Repeat for each of: 'Maine Attorney General', 'Maine Secretary of State', 'Maine Treasurer'

### Pattern 2: ME Executive Politician + Office (is_appointed_position=true for AG/SoS/Treasurer)
```sql
-- Governor (is_appointed_position = false; elected office)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Janet T. Mills', 'Janet', 'Mills', 'Democrat',
          true, false, false, true, -230001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers WHERE name = 'Maine Governor'
        AND government_id = (SELECT id FROM essentials.governments WHERE name = 'State of Maine')),
       p.id,
       'Governor', 'ME', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.district_type = 'STATE_EXEC' AND d.state = 'ME' AND d.label = 'Maine Governor'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id
      AND o.chamber_id = (SELECT id FROM essentials.chambers WHERE name = 'Maine Governor'
                          AND government_id = (SELECT id FROM essentials.governments WHERE name = 'State of Maine'))
  );

-- AG (is_appointed_position = true; legislature-elected)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Aaron M. Frey', 'Aaron', 'Frey', 'Democrat',
          true, true, false, true, -230002)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers WHERE name = 'Maine Attorney General'
        AND government_id = (SELECT id FROM essentials.governments WHERE name = 'State of Maine')),
       p.id,
       'Attorney General', 'ME', true, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.district_type = 'STATE_EXEC' AND d.state = 'ME' AND d.label = 'Maine Attorney General'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id
      AND o.chamber_id = (SELECT id FROM essentials.chambers WHERE name = 'Maine Attorney General'
                          AND government_id = (SELECT id FROM essentials.governments WHERE name = 'State of Maine'))
  );
```

**Key: Set is_appointed=true on politicians table AND is_appointed_position=true on offices table for AG, SoS, Treasurer.**

### Pattern 3: ME NATIONAL_UPPER District (shared by both senators)
```sql
-- Create NATIONAL_UPPER for ME — both Collins and King share this one district row
-- state='ME' uppercase (matches NATIONAL_LOWER pattern above)
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, district_id, mtfcc)
SELECT gen_random_uuid(), 'NATIONAL_UPPER', 'ME', '23', 'Maine', 'Maine', ''
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE district_type = 'NATIONAL_UPPER' AND state = 'ME'
);
```

### Pattern 4: ME US Senator (shared U.S. Senate chamber, NATIONAL_UPPER district)
```sql
-- Collins: Republican senator
-- Office uniqueness guard: (district_id, politician_id) — district is shared but politician_id makes rows unique
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Susan M. Collins', 'Susan', 'Collins', 'Republican',
          true, false, false, true, -230101)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       '7cbe07bc-84b8-433b-952b-540e7de18a92',
       p.id,
       'Senator', 'ME', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.district_type = 'NATIONAL_UPPER' AND d.state = 'ME'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

Repeat for King with party='Independent', external_id=-230102.

### Pattern 5: ME US House Rep (existing NATIONAL_LOWER districts by geo_id)
```sql
-- Pingree — ME-01 (geo_id='2301')
-- Office uniqueness guard: (district_id, chamber_id) — each rep has a unique district
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Chellie Pingree', 'Chellie', 'Pingree', 'Democrat',
          true, false, false, true, -230201)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       'c2facc31-7b13-428c-b7b9-32d0d3b95f76',
       p.id,
       'Representative', 'ME', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '2301' AND d.district_type = 'NATIONAL_LOWER' AND d.state = 'ME'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id
      AND o.chamber_id = 'c2facc31-7b13-428c-b7b9-32d0d3b95f76'
  );
```

Repeat for Golden with geo_id='2302', external_id=-230202.

### Pattern 6: office_id Back-fill (end of each migration)
```sql
-- At end of migration 169, scoped to ME executive external_ids
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -230010 AND -230001
  AND p.office_id IS NULL;

-- At end of migration 170, scoped to ME federal external_ids
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -230209 AND -230101
  AND p.office_id IS NULL;
```

### Districts.state Case Rule (critical)
| district_type | districts.state | offices.representing_state |
|--------------|----------------|---------------------------|
| STATE_EXEC | `'ME'` (uppercase) | `'ME'` |
| NATIONAL_UPPER | `'ME'` (uppercase) | `'ME'` |
| NATIONAL_LOWER | `'ME'` (uppercase) | `'ME'` |
| STATE_UPPER | `'me'` (lowercase) | — |
| STATE_LOWER | `'me'` (lowercase) | — |

Confirmed from live DB: existing NATIONAL_LOWER districts for ME use `state='ME'` uppercase.

### Anti-Patterns to Avoid
- **Creating ME executive chambers in Phase 51:** They already exist from Phase 50. Only insert if checking fails.
- **Creating a new US Senate or US House chamber for ME:** Use shared UUIDs.
- **Hardcoding government UUID:** Always use `SELECT id FROM essentials.governments WHERE name = 'State of Maine'`
- **Including slug in any chamber INSERT:** GENERATED ALWAYS column — omit it.
- **Using Henry Beck as Treasurer:** He left office January 6, 2025. Use Joseph C. Perry.
- **Using lowercase 'me' for STATE_EXEC/NATIONAL_UPPER districts:** Those use uppercase 'ME'.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Idempotency for politician insert | WHERE NOT EXISTS | ON CONFLICT (external_id) DO NOTHING | Unique index on external_id |
| Idempotency for district/office | custom check | WHERE NOT EXISTS on label or (district_id, chamber_id) | No unique constraint on these tables |
| Image resize | custom script | PIL LANCZOS 4:5 crop first, then 600x750 | Established project pattern |
| Headshot discovery | manual web browse | /find-headshots skill | Consistent approval workflow |

---

## Common Pitfalls

### Pitfall 1: Wrong Treasurer Incumbent
**What goes wrong:** Migration inserts Henry Beck — who resigned January 6, 2025.
**Why it happens:** The phase context was written with stale data.
**How to avoid:** Use `'Joseph C. Perry'` as the ME Treasurer. Confirmed from maine.gov/treasurer.
**Warning signs:** If `SELECT full_name FROM essentials.politicians WHERE external_id = -230004` returns 'Henry Beck'.

### Pitfall 2: Trying to Create ME Executive Chambers in Phase 51
**What goes wrong:** Chamber INSERT fails with duplicate (WHERE NOT EXISTS quietly skips) or creates a second unwanted chamber.
**Why it happens:** Phase 50 already created all 6 ME chambers.
**How to avoid:** Confirm the 6 chambers exist via query before writing migration 169. The chamber UUIDs are documented in this research.
**Warning signs:** After migration, chamber count for State of Maine goes above 6.

### Pitfall 3: Creating a New US Senate/House Chamber for ME
**What goes wrong:** "Maine US Senate" chamber created instead of using shared `7cbe07bc...`.
**Why it happens:** Pattern confusion between executive (per-state) and federal (shared) chambers.
**How to avoid:** Federal officials always use the shared national chambers. Collins + King → `7cbe07bc...`. Pingree + Golden → `c2facc31...`. No new chambers.
**Warning signs:** Chamber table gains a row with 'Maine' + 'Senate' or 'House' for federal officials.

### Pitfall 4: Missing is_appointed_position=true on AG/SoS/Treasurer Offices
**What goes wrong:** These legislature-elected officials appear as if they are elected positions.
**Why it happens:** is_appointed_position defaults to NULL/false.
**How to avoid:** Set is_appointed_position=true in ALL office inserts for AG, SoS, and Treasurer. Also set is_appointed=true on the politicians row.
**Warning signs:** `SELECT is_appointed_position FROM essentials.offices o JOIN essentials.politicians p ON p.id=o.politician_id WHERE p.external_id IN (-230002,-230003,-230004)` returns false or NULL.

### Pitfall 5: Creating Election Race Rows for Appointed Officials
**What goes wrong:** Planning phase creates election_races entries for AG, SoS, or Treasurer.
**Why it happens:** These are seeded like elected officials but must not have race rows.
**How to avoid:** Phase 51 creates ZERO election_races rows. All 4 executives + 4 federal officials: politicians + offices only. Elections for elected offices (Governor, US Senate, US House) are handled in a separate phase.

### Pitfall 6: NATIONAL_UPPER District state Case
**What goes wrong:** Looking up ME NATIONAL_UPPER with `state='me'` (lowercase) returns no rows.
**Why it happens:** Confusion with STATE_UPPER/STATE_LOWER which do use lowercase.
**How to avoid:** All NATIONAL_UPPER, NATIONAL_LOWER, and STATE_EXEC use uppercase state. Only STATE_UPPER and STATE_LOWER use lowercase.

### Pitfall 7: Slug Column in Chamber INSERT
**What goes wrong:** `ERROR: cannot insert into a generated column "slug"`
**Why it happens:** slug is GENERATED ALWAYS on essentials.chambers.
**How to avoid:** Never include `slug` in any INSERT column list.

### Pitfall 8: Using Statehouse geo_id '23' for Address Smoke Test
**What goes wrong:** Testing with geo_id='23' (the state FIPS) rather than Augusta city geo_id.
**Why it happens:** The state-level district geo_id happens to be '23' too.
**How to avoid:** For Statehouse smoke tests, use Augusta city geo_id `'2302100'` or the physical address: **210 State Street, Augusta, ME 04333**. Augusta's G4110 geofence exists in essentials.geofence_boundaries.

---

## Headshot Source Priorities

### Federal Officials

**Collins (U.S. Senate):**
- Official portrait: `https://www.collins.senate.gov/imo/media/image/Sen. Collins' Official Photo.jpg`
- Wikipedia fallback: https://en.wikipedia.org/wiki/Susan_Collins
- Note: File name has spaces in URL — encode as `Sen.%20Collins'%20Official%20Photo.jpg` if needed.

**King (U.S. Senate):**
- Official portrait: `https://www.king.senate.gov/imo/media/image/2013%20Senator%20King%20Official%20Portrait.jpg`
- Note: 2013 portrait — may appear dated; Wikipedia may have more current photo.
- Wikipedia fallback: https://en.wikipedia.org/wiki/Angus_King

**Pingree (U.S. House ME-01):**
- Official: https://pingree.house.gov/about (403 Forbidden — use /find-headshots skill instead)
- Wikipedia fallback: https://en.wikipedia.org/wiki/Chellie_Pingree
- Clerk photo pattern: `https://clerk.house.gov/...` (also 403 in research)

**Golden (U.S. House ME-02):**
- Official: https://golden.house.gov/about (403 Forbidden — use /find-headshots skill)
- Wikipedia fallback: https://en.wikipedia.org/wiki/Jared_Golden

**Recommendation for House reps:** Use /find-headshots skill first (it handles navigation and approval). Wikipedia infobox photos are reliable fallbacks.

### ME State Executives

**Janet T. Mills (Governor):**
- maine.gov about page: https://www.maine.gov/governor/mills/about
- Wikipedia: https://en.wikipedia.org/wiki/Janet_Mills
- maine.gov page does not have a dedicated download link — use /find-headshots or Wikipedia.

**Aaron M. Frey (AG):**
- Direct image URL: `https://www.maine.gov/ag/sites/maine.gov.ag/files/styles/large/public/images/Maine-Attorney-General-Aaron-Frey_0.jpg.webp`
- Wikipedia fallback: https://en.wikipedia.org/wiki/Aaron_Frey

**Shenna Bellows (SoS):**
- maine.gov about page: https://www.maine.gov/sos/about-us/about-the-secretary-of-state
- Wikipedia fallback: https://en.wikipedia.org/wiki/Shenna_Bellows

**Joseph C. Perry (Treasurer):**
- maine.gov biography: https://www.maine.gov/treasurer/about-us/treasurers-biography
- Wikipedia: https://en.wikipedia.org/wiki/Joe_Perry_(politician)

### Headshot Processing Rules (established project pattern)
1. Crop to 4:5 ratio FIRST (eyes ~1/3 from top, full head + shoulders)
2. THEN resize to 600x750 using Lanczos, quality=90
3. NEVER stretch — only crop
4. No superimposed text or graphics over face
5. Upload to Supabase Storage bucket 'headshots' with path `{politician_id}.jpg`
6. Run /find-headshots skill one official at a time (never batch)

```python
# Source: Plan 20-02 established project pattern
from PIL import Image
img = Image.open("/tmp/{politician_id}-raw.jpg")
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
img.convert("RGB").save("/tmp/{politician_id}-headshot.jpg", "JPEG", quality=90)
```

---

## Smoke Test Reference

**Success criterion 1:** Governor Janet Mills appears on a Statehouse address query.
- Statehouse address: **210 State Street, Augusta, ME 04333**
- Augusta city geo_id in geofence_boundaries: `2302100` (G4110, confirmed live)

**Success criterion 3:** Susan Collins and Angus King appear on any Maine address query.
- Any ME address will include the NATIONAL_UPPER district → both senators should appear.
- Test with any Portland, Augusta, or Bangor address.

**Success criterion 4 geographic references:**
- Portland address → ME-01 (geo_id=2301) → Chellie Pingree
- Bangor address → ME-02 (geo_id=2302) → Jared Golden; Bangor city geo_id=2302795
- Note: Bangor is in Penobscot County within ME-02 — confirmed from district structure.

---

## Verification Queries

After migrations 169 and 170, run these to confirm success:

```sql
-- 1. Confirm 4 ME executives — office wired with correct is_appointed_position
SELECT p.full_name, p.external_id, o.title, o.is_appointed_position,
       ch.name AS chamber, d.district_type, p.office_id IS NOT NULL AS has_office_id
FROM essentials.politicians p
JOIN essentials.offices o ON o.id = p.office_id
JOIN essentials.chambers ch ON ch.id = o.chamber_id
JOIN essentials.districts d ON d.id = o.district_id
WHERE p.external_id BETWEEN -230004 AND -230001
ORDER BY p.external_id;
-- Expected: 4 rows; is_appointed_position=false for Governor, true for AG/SoS/Treasurer

-- 2. Confirm AG/SoS/Treasurer have is_appointed_position=true, no election race rows
SELECT p.full_name, o.is_appointed_position
FROM essentials.politicians p
JOIN essentials.offices o ON o.id = p.office_id
WHERE p.external_id IN (-230002, -230003, -230004);
-- Expected: 3 rows, all is_appointed_position=true

-- 3. Confirm Collins + King linked to NATIONAL_UPPER
SELECT p.full_name, p.party, o.title, d.district_type, d.state
FROM essentials.politicians p
JOIN essentials.offices o ON o.id = p.office_id
JOIN essentials.districts d ON d.id = o.district_id
WHERE p.external_id IN (-230101, -230102)
ORDER BY p.external_id;
-- Expected: 2 rows; district_type='NATIONAL_UPPER', state='ME'; Collins=Republican, King=Independent

-- 4. Confirm Pingree (ME-01) and Golden (ME-02)
SELECT p.full_name, d.geo_id, d.district_type
FROM essentials.politicians p
JOIN essentials.offices o ON o.id = p.office_id
JOIN essentials.districts d ON d.id = o.district_id
WHERE p.external_id IN (-230201, -230202)
ORDER BY d.geo_id;
-- Expected: 2 rows; Pingree geo_id='2301', Golden geo_id='2302'

-- 5. Confirm no null office_ids in this batch
SELECT COUNT(*) FROM essentials.politicians
WHERE external_id BETWEEN -230202 AND -230001
  AND office_id IS NULL;
-- Expected: 0

-- 6. Confirm no new chamber rows created for ME federal
SELECT COUNT(*) FROM essentials.chambers
WHERE name LIKE '%U.S.%' OR name LIKE '%United States%';
-- Expected: 2 (same count as before — the two pre-existing shared chambers)

-- 7. Confirm 4 STATE_EXEC districts for ME
SELECT label, state, geo_id FROM essentials.districts
WHERE district_type = 'STATE_EXEC' AND state = 'ME'
ORDER BY label;
-- Expected: 4 rows — Maine Attorney General, Maine Governor, Maine Secretary of State, Maine Treasurer

-- 8. Confirm 1 NATIONAL_UPPER district for ME
SELECT district_type, state, geo_id, label FROM essentials.districts
WHERE district_type = 'NATIONAL_UPPER' AND state = 'ME';
-- Expected: 1 row, geo_id='23', label='Maine'
```

---

## Open Questions

1. **Angus King portrait date**
   - What we know: The official Senate URL has "2013" in the filename — it's his 2013 inauguration portrait.
   - What's unclear: Whether a more recent official portrait exists.
   - Recommendation: The /find-headshots skill will surface the best current option. Wikipedia's Angus King article likely has a more recent photo.

2. **Chellie Pingree and Jared Golden official portrait access**
   - What we know: Both house.gov /about pages returned 403 Forbidden. The /find-headshots skill handles this with browser navigation.
   - Recommendation: For Plan 51-03, use /find-headshots skill — it will navigate around 403 issues. Wikipedia is reliable fallback.

3. **No election race rows for any Phase 51 officials?**
   - What we know: Phase context says "no election race rows exist for appointed offices." Governor Janet Mills is term-limited. US Senate/House elections are separate phases.
   - Recommendation: Confirm with user before starting 51-01: Phase 51 seeds ZERO election_races rows. Elections are deferred to a later phase.

---

## Sources

### Primary (HIGH confidence)
- Live DB query: `SELECT external_id, full_name FROM essentials.politicians WHERE external_id BETWEEN -230299 AND -230001` — confirmed 0 rows, all proposed IDs free
- Live DB query: chambers for State of Maine — confirmed all 6 chamber UUIDs and slugs
- Live DB query: ME NATIONAL_LOWER districts — confirmed geo_ids 2301/2302, state='ME' uppercase
- Live DB query: ME NATIONAL_UPPER — confirmed does NOT exist (0 rows)
- Live DB query: `SELECT id, name, type, state, geo_id FROM essentials.governments WHERE name = 'State of Maine'` — confirmed UUID `da88de8b-9afa-4d87-86d5-7eb83c3e9792`
- Live DB query: `is_appointed_position`, `role_canonical`, `representing_state` columns confirmed on essentials.offices
- Live DB query: Augusta city geo_id `2302100` (G4110) confirmed in essentials.geofence_boundaries
- `https://www.maine.gov/governor/mills/` — confirmed Governor Janet T. Mills, current as of May 2026
- `https://www.maine.gov/ag/about/message.shtml` — confirmed AG Aaron M. Frey
- `https://www.maine.gov/sos/` — confirmed SoS Shenna Bellows
- `https://www.maine.gov/treasurer/about-us/treasurers-biography` — confirmed Treasurer Joseph C. Perry (NOT Henry Beck); took office 2025-01-06
- Ballotpedia / Maine Morning Star search: Perry elected by Legislature December 2024, Beck left January 6, 2025
- `https://www.collins.senate.gov/` — confirmed Susan M. Collins, Republican, senior senator; 2026 re-election
- `https://www.king.senate.gov/` — confirmed Angus S. King, Jr., Independent, junior senator; NOT up in 2026
- Congress.gov + Wikipedia 119th Congress: Chellie Pingree (ME-01) + Jared Golden (ME-02) confirmed, both won November 2024
- Phase 50 SUMMARY.md: Maine government UUID, 6 chamber names/slugs, next migration is 169
- Phase 40 RESEARCH.md: Shared federal chamber UUIDs (U.S. Senate, U.S. House)

### Secondary (MEDIUM confidence)
- `https://www.collins.senate.gov/about/susan-collins` — Collins official portrait URL confirmed
- `https://www.king.senate.gov/about` — King official portrait URL (2013 portrait) confirmed
- `https://www.maine.gov/ag/sites/...` — Frey official photo URL confirmed (webp format)
- WebSearch: Joseph Perry elected December 2024, assumed office January 2025 — multiple news sources agree

### Tertiary (LOW confidence)
- maine.gov Frey photo URL uses `.webp` format — may need conversion to JPEG; verify at execution time

---

## Metadata

**Confidence breakdown:**
- ME executive incumbents (names + titles): HIGH — confirmed from maine.gov official pages
- Treasurer correction (Perry not Beck): HIGH — multiple sources confirm; maine.gov is authoritative
- ME federal officials (senators): HIGH — confirmed from official senate.gov pages
- ME federal officials (House reps): HIGH — both confirmed as 119th Congress incumbents post-2024 election
- External_id ranges: HIGH — live DB confirmed entire -230001 to -230299 range is free
- Chamber/district UUIDs: HIGH — live DB confirmed
- Headshot URLs for senators: MEDIUM — Collins portrait URL confirmed; King portrait URL confirmed (2013 dated)
- Headshot URLs for House reps: LOW — house.gov returns 403; use /find-headshots skill at execution time

**Research date:** 2026-05-18
**Valid until:** 2026-08-18 (incumbents stable; King not up until 2030; Governor Mills term-limited 2026; Perry in office until Legislature elects next; Collins running 2026 but still seated)
