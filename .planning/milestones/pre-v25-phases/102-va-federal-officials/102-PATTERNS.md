# Phase 102: VA Federal Officials - Pattern Map

**Mapped:** 2026-06-08
**Files analyzed:** 1 (single migration)
**Analogs found:** 2 / 1 (two analogs for one file — MD is primary, OR is secondary)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `C:/EV-Accounts/backend/migrations/311_va_federal_officials.sql` | migration | CRUD | `C:/EV-Accounts/backend/migrations/275_md_federal_officials.sql` | exact |

---

## Pattern Assignments

### `C:/EV-Accounts/backend/migrations/311_va_federal_officials.sql` (migration, CRUD)

**Primary analog:** `C:/EV-Accounts/backend/migrations/275_md_federal_officials.sql` (MD — senators pre-seeded, 8 House reps)
**Secondary analog:** `C:/EV-Accounts/backend/migrations/224_or_federal_officials.sql` (OR — fuller pre-flight block)

VA-102 is structurally identical to MD-275: senators are already fully seeded, so the migration only asserts their existence and then inserts 11 (vs. MD's 8) House reps.

---

### Pattern 1: File header comment block

**Source:** `275_md_federal_officials.sql` lines 1–24

```sql
-- Migration 311: VA Federal Officials (11 US House Reps)
--
-- US Senators are ALREADY SEEDED (Warner ext=-400080, Kaine ext=-400079).
-- This migration asserts their existence then seeds only the 11 House reps.
--
-- Uses existing shared federal chambers (no new chambers created):
--   U.S. Senate                    7cbe07bc-84b8-433b-952b-540e7de18a92
--   U.S. House of Representatives  c2facc31-7b13-428c-b7b9-32d0d3b95f76
--
-- CRITICAL: state='VA' UPPERCASE for NATIONAL_UPPER/NATIONAL_LOWER (Pitfall 5)
-- CRITICAL: Senator offices already exist — do NOT re-insert senators
-- CRITICAL: NOT EXISTS guard for House reps uses (district_id, chamber_id) — single-member federal
-- All inserts idempotent (ON CONFLICT DO NOTHING / NOT EXISTS guards).
--
-- Roster (11 House Reps, 119th Congress, verified [DATE]):
--   VA-01: [full_name] ([party]) — geo_id 5101
--   ...
--   VA-11: [full_name] ([party]) — geo_id 5111
```

---

### Pattern 2: Pre-flight assertion — NATIONAL_UPPER district count

**Source:** `275_md_federal_officials.sql` lines 27–34

```sql
-- ===== STEP 1: Assert VA NATIONAL_UPPER district exists =====
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.districts
      WHERE district_type = 'NATIONAL_UPPER' AND state = 'VA') <> 1 THEN
    RAISE EXCEPTION 'Pre-flight failed: VA NATIONAL_UPPER district not found';
  END IF;
END $$;
```

VA adaptation: change `state = 'MD'` to `state = 'VA'`. The VA NATIONAL_UPPER district has `geo_id='51'`.

---

### Pattern 3: Pre-flight assertion — both senators already seeded

**Source:** `275_md_federal_officials.sql` lines 36–43

```sql
-- ===== STEP 2: Assert both US senators already seeded =====
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.politicians
      WHERE external_id IN (-400033, -400034)) <> 2 THEN
    RAISE EXCEPTION 'Pre-flight failed: MD US senators not found (ext -400033/-400034)';
  END IF;
END $$;
```

VA adaptation: change external_ids to `-400080` (Warner) and `-400079` (Kaine). Error message should read `VA US senators not found (ext -400080/-400079)`.

---

### Pattern 4: Optional richer pre-flight block (NATIONAL_LOWER count + chamber existence)

**Source:** `224_or_federal_officials.sql` lines 46–93

The OR migration has a more thorough pre-flight that also asserts the NATIONAL_LOWER district count and verifies both federal chamber rows exist. This is a good addition for VA-102 given the 11-district scope:

```sql
DO $$
DECLARE
  v_national_upper_count INT;
  v_national_lower_count INT;
  v_senate_count INT;
  v_house_count INT;
BEGIN
  SELECT COUNT(*) INTO v_national_upper_count
  FROM essentials.districts
  WHERE district_type = 'NATIONAL_UPPER' AND state = 'VA' AND geo_id = '51';

  IF v_national_upper_count != 1 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: Expected 1 NATIONAL_UPPER VA district (geo_id=51), found %', v_national_upper_count;
  END IF;

  SELECT COUNT(*) INTO v_national_lower_count
  FROM essentials.districts
  WHERE district_type = 'NATIONAL_LOWER' AND state = 'VA'
    AND geo_id IN ('5101','5102','5103','5104','5105','5106','5107','5108','5109','5110','5111');

  IF v_national_lower_count != 11 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: Expected 11 NATIONAL_LOWER VA districts (geo_ids 5101-5111), found %', v_national_lower_count;
  END IF;

  SELECT COUNT(*) INTO v_senate_count
  FROM essentials.chambers WHERE name = 'U.S. Senate';

  IF v_senate_count != 1 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: Expected 1 chamber with name=''U.S. Senate'', found %', v_senate_count;
  END IF;

  SELECT COUNT(*) INTO v_house_count
  FROM essentials.chambers WHERE name = 'U.S. House of Representatives';

  IF v_house_count != 1 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: Expected 1 chamber with name=''U.S. House of Representatives'', found %', v_house_count;
  END IF;

  -- Assert both VA senators exist
  IF (SELECT COUNT(*) FROM essentials.politicians
      WHERE external_id IN (-400080, -400079)) <> 2 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: VA US senators not found (ext -400080/-400079)';
  END IF;

  RAISE NOTICE 'Pre-flight passed: NATIONAL_UPPER=%, NATIONAL_LOWER=%, Senate chambers=%, House chambers=%',
    v_national_upper_count, v_national_lower_count, v_senate_count, v_house_count;
END $$;
```

---

### Pattern 5: House rep CTE block (one per district — repeat 11 times)

**Source:** `275_md_federal_officials.sql` lines 49–75 (MD-01 block)

This is the atomic unit to replicate for each of VA-01 through VA-11. Key substitutions per rep:

| Placeholder | Source |
|---|---|
| `[full_name]` | Researcher-verified 119th Congress name |
| `[first_name]` | Split from full_name |
| `[last_name]` | Split from full_name |
| `[party]` | `'Republican'` or `'Democrat'` |
| `[external_id]` | `-5102001` through `-5102011` (CD number determines last 3 digits) |
| `[geo_id]` | `'5101'` through `'5111'` |
| `state = 'VA'` | Uppercase per Pitfall 5 |
| `representing_state` | `'VA'` |
| `chamber_id` | `'c2facc31-7b13-428c-b7b9-32d0d3b95f76'` (hardcoded UUID, MD pattern) |

```sql
-- ----- VA-01: [Full Name] ([Party]) (-5102001) — geo_id '5101' -----
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), '[Full Name]', '[First]', '[Last]', '[Party]',
          true, false, false, true, -5102001)
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
       'U.S. Representative', 'VA', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '5101' AND d.district_type = 'NATIONAL_LOWER' AND d.state = 'VA'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id
      AND o.chamber_id = 'c2facc31-7b13-428c-b7b9-32d0d3b95f76'
  );
```

**Repeat for VA-02 through VA-11**, incrementing `external_id` and `geo_id` in lockstep with the CD number (external_id last 3 digits = 001..011, geo_id = 5101..5111).

**Note on OR vs. MD chamber reference style:**
- MD (lines 64, 74): hardcodes the chamber UUID directly — `'c2facc31-7b13-428c-b7b9-32d0d3b95f76'`
- OR (lines 130, 140): uses a subselect — `(SELECT id FROM essentials.chambers WHERE name = 'U.S. House of Representatives')`

Both are idempotent. MD's hardcoded UUID style is preferred for VA-102 since the UUID is confirmed in CONTEXT.md (D-06). This avoids a subquery on each of 11 blocks.

---

### Pattern 6: office_id back-fill

**Source:** `275_md_federal_officials.sql` lines 275–282

```sql
-- ===== STEP 4: office_id back-fill =====
-- Scoped to -5102011..-5102001 covering all 11 VA US House reps.
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -5102011 AND -5102001
  AND p.office_id IS NULL;
```

VA adaptation: change range from `-2440008 AND -2440001` to `-5102011 AND -5102001`. Senators (Warner/Kaine) already have `office_id` set — they are excluded by the range scope and the `IS NULL` guard.

---

### Pattern 7: Transaction wrapper

**Source:** `275_md_federal_officials.sql` lines 25, 284

```sql
BEGIN;
-- ... all content ...
COMMIT;
```

Standard for all federal official migrations. No savepoints needed.

---

## Shared Patterns

### state= casing rule (Pitfall 5)
**Source:** `275_md_federal_officials.sql` line 10 comment; `224_or_federal_officials.sql` line 57
**Apply to:** All `WHERE` clauses filtering `essentials.districts` by state

```sql
-- CRITICAL: NATIONAL_UPPER and NATIONAL_LOWER districts use UPPERCASE state codes
-- e.g. state = 'VA'  (not 'va')
```

### NOT EXISTS guard semantics for single-member districts
**Source:** `275_md_federal_officials.sql` lines 71–75; decision D-08

```sql
AND NOT EXISTS (
  SELECT 1 FROM essentials.offices o
  WHERE o.district_id = d.id
    AND o.chamber_id = 'c2facc31-7b13-428c-b7b9-32d0d3b95f76'
);
```

For NATIONAL_LOWER (single-member CDs) this guard on `(district_id, chamber_id)` is correct. It blocks a second office row for the same CD. This differs from NATIONAL_UPPER senators, which use `(district_id, politician_id)` — but that case does not apply here since senators are pre-seeded and untouched.

### ON CONFLICT idempotency for politician inserts
**Source:** `275_md_federal_officials.sql` line 56; `224_or_federal_officials.sql` line 122

```sql
ON CONFLICT (external_id) DO NOTHING
RETURNING id
```

If the migration is re-run after a partial failure, `RETURNING id` will return NULL for already-inserted rows, and the `AND p.id IS NOT NULL` predicate in the office INSERT will safely skip the office row too (which the NOT EXISTS guard would also catch).

---

## No Analog Found

None — the MD migration is an exact structural match for VA-102.

---

## Key Differences: VA-102 vs. MD-275

| Dimension | MD-275 | VA-102 |
|---|---|---|
| State code | `'MD'` | `'VA'` |
| FIPS | 24 | 51 |
| House rep count | 8 | 11 |
| House external_id prefix | `-244xxxx` | `-5102xxx` |
| geo_id range | `2401–2408` | `5101–5111` |
| Senator external_ids asserted | `-400033, -400034` | `-400080, -400079` |
| NATIONAL_UPPER geo_id | `'24'` | `'51'` |
| `representing_state` | `'MD'` | `'VA'` |
| office_id backfill range | `BETWEEN -2440008 AND -2440001` | `BETWEEN -5102011 AND -5102001` |

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/`
**Files scanned:** 2 (275_md_federal_officials.sql, 224_or_federal_officials.sql)
**Pattern extraction date:** 2026-06-08
