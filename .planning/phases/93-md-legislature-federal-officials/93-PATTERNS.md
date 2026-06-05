# Phase 93: MD Legislature + Federal Officials - Pattern Map

**Mapped:** 2026-06-05
**Files analyzed:** 7 new files
**Analogs found:** 7 / 7

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `C:/EV-Accounts/backend/migrations/272_md_legislative_chambers.sql` | migration | CRUD | `C:/EV-Accounts/backend/migrations/269_md_government_chambers.sql` | exact (same state, same pattern, chambers-only) |
| `C:/EV-Accounts/backend/migrations/generate_md_senate.ps1` | utility (generator) | transform | `C:/EV-Accounts/backend/migrations/generate_or_senate.ps1` | exact (same role, same 1:1 district model) |
| `C:/EV-Accounts/backend/migrations/273_md_state_senators.sql` | migration | CRUD | `C:/EV-Accounts/backend/migrations/226_or_state_senators.sql` | exact (generated output, same structure) |
| `C:/EV-Accounts/backend/migrations/generate_md_house.ps1` | utility (generator) | transform | `C:/EV-Accounts/backend/migrations/generate_or_house.ps1` | role-match (same structure; multi-member twist is new) |
| `C:/EV-Accounts/backend/migrations/274_md_delegates.sql` | migration | CRUD | `C:/EV-Accounts/backend/migrations/227_or_state_house.sql` | role-match (same CTE pattern; NOT EXISTS guard differs for multi-member) |
| `C:/EV-Accounts/backend/migrations/275_md_federal_officials.sql` | migration | CRUD | `C:/EV-Accounts/backend/migrations/170_me_federal_officials.sql` | exact (same shared federal chambers pattern) |
| `scripts/md_legislature_headshots.py` (senators plan 93-05, delegates plan 93-06) | utility (script) | file-I/O | `scripts/md_executives_headshots.py` | exact (same state, same script structure) |

---

## Pattern Assignments

### `272_md_legislative_chambers.sql` (migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/269_md_government_chambers.sql`

This is the closest possible analog — same state (Maryland), same government row lookup pattern, same WHERE NOT EXISTS guard, same `slug` GENERATED ALWAYS constraint. Migration 272 adds 2 legislative chambers instead of 5 executive ones.

**File header pattern** (lines 1-32 of 269):
```sql
-- Migration 272: MD legislative chambers under the existing State of Maryland government row
--
-- Purpose: Seeds Maryland Senate and Maryland House of Delegates chambers
-- under the pre-existing State of Maryland government row (geo_id='24').
-- No governments INSERT — row pre-exists from migration 174.
-- No officials, offices, or districts — chambers-only migration.
--
-- CRITICAL: slug is GENERATED ALWAYS on essentials.chambers — never include
-- in INSERT column list.
-- CRITICAL: use name+state subquery to resolve government_id (no unique
-- constraint on geo_id in essentials.governments).
-- Idempotency: all INSERTs guarded by WHERE NOT EXISTS on (name + government_id).
```

**Pre-flight assertion pattern** (lines 35-46 of 269):
```sql
BEGIN;

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name = 'State of Maryland' AND state = 'MD') <> 1 THEN
    RAISE EXCEPTION
      'Pre-flight failed: expected exactly 1 State of Maryland government row; found %',
      (SELECT COUNT(*) FROM essentials.governments
       WHERE name = 'State of Maryland' AND state = 'MD');
  END IF;
END $$;
```

**Additional pre-flight for migration 272** (no analog — new assertion, derived from CONTEXT.md D-08):
```sql
-- Assert no MD legislative chambers exist yet (fail-fast before any insert)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.chambers c
      JOIN essentials.governments g ON g.id = c.government_id
      WHERE g.name = 'State of Maryland'
        AND c.name IN ('Maryland Senate', 'Maryland House of Delegates')) <> 0 THEN
    RAISE EXCEPTION 'Pre-flight failed: MD legislative chambers already exist';
  END IF;
END $$;
```

**Chamber insert pattern** (lines 48-58 of 269 — copy exactly, change name/name_formal):
```sql
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'Maryland Senate',
       'Maryland State Senate',
       (SELECT id FROM essentials.governments WHERE name = 'State of Maryland' AND state = 'MD')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Maryland Senate'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'State of Maryland' AND state = 'MD')
);

INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'Maryland House of Delegates',
       'Maryland House of Delegates',
       (SELECT id FROM essentials.governments WHERE name = 'State of Maryland' AND state = 'MD')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Maryland House of Delegates'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'State of Maryland' AND state = 'MD')
);

COMMIT;
```

Note: `name_formal='Maryland House of Delegates'` (same as short name — same convention as `Oregon House of Representatives` in migration 222 line 83, where legislative chamber names are self-qualifying).

---

### `generate_md_senate.ps1` (utility/generator, transform)

**Analog:** `C:/EV-Accounts/backend/migrations/generate_or_senate.ps1`

Copy the entire OR senate generator and change: FIPS prefix `41` → `24`, state filter `'or'` → `'md'`, chamber name `'Oregon Senate'` → `'Maryland Senate'`, government name `'State of Oregon'` → `'State of Maryland'` (with `AND state = 'MD'` added — OR generator omits state in government subquery, MD must include it per 269 precedent), title `'Senator'` stays, `'OR'` → `'MD'` for `representing_state`, external_id range `-4110001` → `-2410001` through `-4110030` → `-2410047`.

**Script header and param block** (lines 1-17 of generate_or_senate.ps1):
```powershell
# generate_md_senate.ps1
# Generates migration 273: Maryland State Senate (47 senators)
# No vacant seats. [VERIFIED: mgaleg.maryland.gov, 2026-06-02]

param(
    [string]$Out = "C:/EV-Accounts/backend/migrations/273_md_state_senators.sql"
)

function EscSql([string]$s) { $s.Replace("'", "''") }
```

**SenatorBlock function** (lines 19-58 of generate_or_senate.ps1 — adapt for MD):
```powershell
function SenatorBlock($r) {
    $f   = EscSql $r.full
    $fn  = EscSql $r.first
    $ln  = EscSql $r.last
    $pa  = EscSql $r.party
    $gid = '24' + ([int]$r.dist).ToString().PadLeft(3, '0')  # e.g. dist=1 -> '24001'
@"
-- ===== SD-$($r.dist) ($gid): $($r.full) ($($r.party)) =====
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), '$f', '$fn', '$ln', '$pa',
          true, false, false, true, $($r.ext_id))
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Maryland Senate'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'State of Maryland' AND state = 'MD')),
       p.id,
       'Senator', 'MD', false, false
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '$gid' AND d.district_type = 'STATE_UPPER' AND d.state = 'md'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id
      AND o.chamber_id = (SELECT id FROM essentials.chambers
                           WHERE name = 'Maryland Senate'
                             AND government_id = (SELECT id FROM essentials.governments
                                                  WHERE name = 'State of Maryland' AND state = 'MD'))
  );

"@
}
```

CRITICAL differences from OR: `'24' + PadLeft(3,'0')` for geo_id; `AND state = 'MD'` added to government subquery; `d.state = 'md'` lowercase; `p.id IS NOT NULL` guard (OR generator omits this — add it for MD to be safe per RESEARCH.md anti-pattern note); `'MD'` for representing_state.

**Roster array structure** (lines 61-92 of generate_or_senate.ps1):
```powershell
$roster = @(
    @{ dist=1;  ext_id=-2410001; full='Mike McKay';          first='Mike';    last='McKay';     party='Republican' }
    @{ dist=2;  ext_id=-2410002; full='Paul D. Corderman';   first='Paul';    last='Corderman'; party='Republican' }
    # ... 47 entries total (see RESEARCH.md Current Incumbents table for full roster)
)
```

**Output builder and file writer** (lines 95-134 of generate_or_senate.ps1 — copy exactly, change migration number and expected count):
```powershell
$sb = [System.Text.StringBuilder]::new()
$null = $sb.AppendLine("-- Migration 273: Maryland State Senate Officials")
$null = $sb.AppendLine("-- 47 senators, no vacancies.")
$null = $sb.AppendLine("-- CRITICAL: d.state = 'md' (lowercase) - TIGER loader casing")
$null = $sb.AppendLine("-- CRITICAL: district_type = 'STATE_UPPER' required - geo_ids 24001-24047 exist in BOTH")
$null = $sb.AppendLine("--           STATE_UPPER and STATE_LOWER; omitting district_type causes ambiguous subquery")
$null = $sb.AppendLine("BEGIN;")
# ...foreach loop...
$null = $sb.AppendLine("-- ===== office_id back-fill =====")
$null = $sb.AppendLine("UPDATE essentials.politicians p")
$null = $sb.AppendLine("SET office_id = o.id")
$null = $sb.AppendLine("FROM essentials.offices o")
$null = $sb.AppendLine("WHERE o.politician_id = p.id")
$null = $sb.AppendLine("  AND p.external_id BETWEEN -2410047 AND -2410001")
$null = $sb.AppendLine("  AND p.office_id IS NULL;")
$null = $sb.AppendLine("COMMIT;")

# Write UTF-8 without BOM (required for psql)
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText($Out, $sb.ToString(), $utf8NoBom)
Write-Host "Written: $Out"

$content = Get-Content $Out -Raw
$cteCount = ([regex]::Matches($content, 'WITH ins_p AS')).Count
Write-Host "CTE blocks (senators): $cteCount  (expected 47)"
```

---

### `273_md_state_senators.sql` (migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/226_or_state_senators.sql`

This is the generated output of `generate_md_senate.ps1`. The pattern per senator block is lines 16-46 of 226_or_state_senators.sql. Do not hand-write — run the generator. The generated file will follow this header:

```sql
-- Migration 273: Maryland State Senate Officials
-- 47 senators, no vacancies.
--
-- Uses existing Maryland Senate chamber from Phase 93 migration 272.
-- Uses existing STATE_UPPER districts from Phase 91 TIGER load.
-- Idempotent: ON CONFLICT (external_id) DO NOTHING; WHERE NOT EXISTS on offices.
--
-- external_id range: -2410001 (SD-01 McKay) through -2410047 (SD-47 Augustine)
-- geo_id format: '24' + district_num.PadLeft(3, '0')  e.g. SD-01 -> '24001', SD-47 -> '24047'
-- CRITICAL: d.state = 'md' (lowercase) - TIGER loader casing for STATE_UPPER/STATE_LOWER
-- CRITICAL: district_type = 'STATE_UPPER' required - geo_ids 24001-24047 exist in BOTH
--           STATE_UPPER and STATE_LOWER; omitting district_type causes ambiguous subquery
--
BEGIN;
```

And end with the back-fill and COMMIT (lines 116-125 of 226 adapted for MD range).

---

### `generate_md_house.ps1` (utility/generator, transform)

**Analog:** `C:/EV-Accounts/backend/migrations/generate_or_house.ps1`

This is the most complex new file. The outer script structure (param block, EscSql, StringBuilder, UTF8NoBOM writer, CTE counter) copies OR exactly. The `RepBlock`/`DelegateBlock` function requires two key changes: (1) multi-member NOT EXISTS guard and (2) split geo_id construction for subdistricts.

**Script header**:
```powershell
# generate_md_house.ps1
# Generates migration 274: Maryland House of Delegates (141 delegates)
# 140 active + 1 vacant (District 42A).
#
# Three district categories:
#   Whole districts (29): geo_id='24' + dist.PadLeft(3,'0') — 3 CTE blocks per district
#   A/B/C subdistricts (6 parents x 3): geo_id='24' + dist.PadLeft(2,'0') + sub — 1 block each
#   A/B subdistricts (12 parents x 2): geo_id='24' + dist.PadLeft(2,'0') + sub — 1-2 blocks per sub
#
# CRITICAL: NOT EXISTS guard uses (district_id, politician_id) NOT (district_id, chamber_id).
# Using chamber_id would block the 2nd and 3rd office inserts for whole districts.

param(
    [string]$Out = "C:/EV-Accounts/backend/migrations/274_md_delegates.sql"
)

function EscSql([string]$s) { $s.Replace("'", "''") }
```

**DelegateBlock function** (adapted from RepBlock in generate_or_house.ps1 lines 23-61):
```powershell
function DelegateBlock($r) {
    $f   = EscSql $r.full
    $fn  = EscSql $r.first
    $ln  = EscSql $r.last
    $pa  = EscSql $r.party
    # geo_id pre-computed on roster entry: $r.geo_id
    $gid = $r.geo_id
    $isVacant = $r.is_vacant
    $isActive = if ($isVacant) { 'false' } else { 'true' }
    $isIncumbent = if ($isVacant) { 'false' } else { 'true' }
@"
-- ===== $($r.label) ($gid): $($r.full) ($($r.party)) =====
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), '$f', '$fn', '$ln', '$pa',
          $isActive, false, $($isVacant.ToString().ToLower()), $isIncumbent, $($r.ext_id))
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Maryland House of Delegates'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'State of Maryland' AND state = 'MD')),
       p.id,
       'Delegate', 'MD', false, $($isVacant.ToString().ToLower())
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '$gid' AND d.district_type = 'STATE_LOWER' AND d.state = 'md'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );

"@
}
```

CRITICAL difference from OR RepBlock (lines 50-59): NOT EXISTS guard is `(district_id, politician_id)` not `(district_id, chamber_id)`. This is the only structural change for multi-member support.

**Geo_id computation in roster entries** (from generate_or_house.ps1 line 28, adapted):
```powershell
# Whole district: '24' + 3-digit padded
$gid = '24' + ([int]$dist).ToString().PadLeft(3, '0')   # dist=3 -> '24003'

# Subdistrict: '24' + 2-digit padded + letter
$gid = '24' + ([int]$dist).ToString().PadLeft(2, '0') + $sub  # dist=2, sub='A' -> '2402A'
```

**Non-ASCII delegate name handling** (from generate_or_house.ps1 line 87 — exact pattern):
```powershell
# Joseline Pena-Melnyk: ñ = [char]0x00F1
@{ ...; full="Joseline Pe$([char]0x00F1)a-Melnyk"; first='Joseline'; last="Pe$([char]0x00F1)a-Melnyk"; ... }
# Check full delegate roster for any other accented characters before finalizing
```

**Roster entry structure** (3 variants by district type):
```powershell
$roster = @(
    # --- Whole district (3 entries per district, same dist, different ext_id, same geo_id) ---
    @{ dist=3;  sub=$null; geo_id='24003'; label='HD-3 (1/3)'; ext_id=-2420001; full='...'; first='...'; last='...'; party='Democrat';    is_vacant=$false }
    @{ dist=3;  sub=$null; geo_id='24003'; label='HD-3 (2/3)'; ext_id=-2420002; full='...'; first='...'; last='...'; party='Democrat';    is_vacant=$false }
    @{ dist=3;  sub=$null; geo_id='24003'; label='HD-3 (3/3)'; ext_id=-2420003; full='...'; first='...'; last='...'; party='Republican';  is_vacant=$false }

    # --- A/B/C subdistrict (1 entry per row) ---
    @{ dist=1;  sub='A';   geo_id='2401A'; label='HD-1A';       ext_id=-2420XXX; full='...'; first='...'; last='...'; party='...'; is_vacant=$false }

    # --- A/B subdistrict (1-2 entries per subdistrict row, summing to 3 per parent) ---
    @{ dist=2;  sub='A';   geo_id='2402A'; label='HD-2A (1/2)'; ext_id=-2420XXX; full='...'; first='...'; last='...'; party='...'; is_vacant=$false }
    @{ dist=2;  sub='A';   geo_id='2402A'; label='HD-2A (2/2)'; ext_id=-2420XXX; full='...'; first='...'; last='...'; party='...'; is_vacant=$false }

    # --- Vacant seat ---
    @{ dist=42; sub='A';   geo_id='2442A'; label='HD-42A (VACANT)'; ext_id=-2420XXX; full='Vacant'; first=''; last='Vacant'; party=''; is_vacant=$true }
)
```

**Output builder** (lines 129-168 of generate_or_house.ps1 — adapt):
```powershell
$sb = [System.Text.StringBuilder]::new()
$null = $sb.AppendLine("-- Migration 274: Maryland House of Delegates Officials")
$null = $sb.AppendLine("-- 141 delegate offices (140 active + 1 vacant, District 42A).")
$null = $sb.AppendLine("-- CRITICAL: NOT EXISTS guard uses (district_id, politician_id) -- multi-member safe")
$null = $sb.AppendLine("-- CRITICAL: d.state = 'md' (lowercase)")
$null = $sb.AppendLine("-- CRITICAL: district_type = 'STATE_LOWER' required -- geo_ids 24001-24047 overlap with STATE_UPPER")
$null = $sb.AppendLine("BEGIN;")
foreach ($r in $roster) { $null = $sb.AppendLine((DelegateBlock $r)) }
$null = $sb.AppendLine("-- ===== office_id back-fill =====")
$null = $sb.AppendLine("UPDATE essentials.politicians p SET office_id = o.id")
$null = $sb.AppendLine("FROM essentials.offices o")
$null = $sb.AppendLine("WHERE o.politician_id = p.id")
$null = $sb.AppendLine("  AND p.external_id BETWEEN -2420141 AND -2420001")
$null = $sb.AppendLine("  AND p.office_id IS NULL;")
$null = $sb.AppendLine("COMMIT;")

$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText($Out, $sb.ToString(), $utf8NoBom)
Write-Host "Written: $Out"

$content = Get-Content $Out -Raw -Encoding UTF8
$cteCount = ([regex]::Matches($content, 'WITH ins_p AS')).Count
Write-Host "CTE blocks (delegates): $cteCount  (expected 141)"
```

---

### `274_md_delegates.sql` (migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/227_or_state_house.sql`

Generated output of `generate_md_house.ps1`. Do not hand-write 141 blocks. The generated file structure follows 227 exactly except for the NOT EXISTS guard change and multi-district geo_ids. Header pattern:

```sql
-- Migration 274: Maryland House of Delegates Officials
-- 141 delegate offices (140 active + 1 vacant, District 42A).
--
-- Uses existing Maryland House of Delegates chamber from Phase 93 migration 272.
-- Uses existing STATE_LOWER districts from Phase 91 TIGER load.
-- Idempotent: ON CONFLICT (external_id) DO NOTHING; WHERE NOT EXISTS (district_id, politician_id).
--
-- external_id range: -2420001 through -2420141
-- CRITICAL: NOT EXISTS guard = (district_id, politician_id) NOT (district_id, chamber_id)
--           Multi-member whole districts require 3 offices per district_id row.
-- CRITICAL: d.state = 'md' (lowercase)
-- CRITICAL: district_type = 'STATE_LOWER' required
--
BEGIN;
```

---

### `275_md_federal_officials.sql` (migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/170_me_federal_officials.sql`

Migration 170 is the exact template. MD differs from ME in one important way: MD US senators are ALREADY seeded (external_ids -400033, -400034) — so Step 2 becomes a pre-flight assertion instead of an INSERT. Steps 3-4 follow ME's House rep pattern verbatim.

**File header and pre-flight assertion** (lines 1-27 of 170 adapted):
```sql
-- Migration 275: MD Federal Officials (8 US House Reps)
--
-- US Senators are ALREADY SEEDED (Van Hollen -400033, Alsobrooks -400034).
-- This migration asserts their existence then seeds only the 8 House reps.
--
-- Uses existing shared federal chambers (no new chambers created):
--   U.S. Senate                    7cbe07bc-84b8-433b-952b-540e7de18a92
--   U.S. House of Representatives  c2facc31-7b13-428c-b7b9-32d0d3b95f76
--
-- CRITICAL: state='MD' UPPERCASE for NATIONAL_UPPER/NATIONAL_LOWER
-- CRITICAL: Senator office NOT EXISTS guard = (district_id, politician_id) because
--           both senators share the same NATIONAL_UPPER district
-- All inserts idempotent (WHERE NOT EXISTS / ON CONFLICT).

BEGIN;

-- ===== STEP 1: Assert MD NATIONAL_UPPER district exists =====
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.districts
      WHERE district_type = 'NATIONAL_UPPER' AND state = 'MD') <> 1 THEN
    RAISE EXCEPTION 'Pre-flight failed: MD NATIONAL_UPPER district not found';
  END IF;
END $$;

-- ===== STEP 2: Assert both US senators already seeded =====
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.politicians
      WHERE external_id IN (-400033, -400034)) <> 2 THEN
    RAISE EXCEPTION 'Pre-flight failed: MD US senators not found (ext -400033/-400034)';
  END IF;
END $$;
```

**House rep CTE pattern** (lines 101-127 of 170_me_federal_officials.sql — adapt for MD; note `role_canonical` column present in 170):
```sql
-- ===== STEP 3: US House Reps =====

-- ----- MD-01: Andy Harris (R) (-2440001) — geo_id '2401' -----
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Andy Harris', 'Andy', 'Harris', 'Republican',
          true, false, false, true, -2440001)
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
       'U.S. Representative', 'MD', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '2401' AND d.district_type = 'NATIONAL_LOWER' AND d.state = 'MD'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id
      AND o.chamber_id = 'c2facc31-7b13-428c-b7b9-32d0d3b95f76'
  );
```

NOTE: 170 uses `'Representative'` as title for ME House reps (line 118); CONTEXT.md specifies `'U.S. Representative'` for MD — follow CONTEXT.md. Also note `role_canonical` column in 170's office INSERT (line 54) — include it as NULL for consistency.

**Office back-fill** (lines 157-166 of 170, adapted):
```sql
-- ===== STEP 4: office_id back-fill =====
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -2440008 AND -2440001
  AND p.office_id IS NULL;

COMMIT;
```

---

### `scripts/md_senate_headshots.py` and `scripts/md_delegates_headshots.py` (utility/script, file-I/O)

**Analog:** `scripts/md_executives_headshots.py`

This is the exact template — same state, same Supabase URL, same PIL processing, same psycopg2 DB pattern, same storage bucket. The only differences are the OFFICIALS list, TMP_DIR paths, and headshot source URL pattern.

**Full script structure to copy** (md_executives_headshots.py lines 1-365):
- Lines 1-26: docstring, imports
- Lines 49-66: SUPABASE_URL, SERVICE_KEY validation (JWT check), BUCKET, STORAGE_BASE, TMP_DIR, TARGET_W/H constants — copy verbatim, change TMP_DIR
- Lines 80-116: OFFICIALS list — replace with MD legislators. Each entry: `(external_id, politician_id, name, source_url)`
- Lines 122-183: `crop_and_resize` and `download_image` and `process_image` functions — copy verbatim
- Lines 189-213: `upload_to_storage` function — copy verbatim
- Lines 223-278: `check_image_exists` and `insert_politician_image` via psycopg2 — copy verbatim
- Lines 283-364: `main()` loop and summary — copy verbatim

**OFFICIALS list structure for senators** (adapt from lines 80-116 pattern):
```python
OFFICIALS = [
    (
        -2410001,
        "<politician_id UUID from DB>",
        "Mike McKay",
        "https://mgaleg.maryland.gov/2026RS/images/mckay02.jpg",
    ),
    # ... 47 entries total
]
```

**mgaleg headshot URL pattern** (from RESEARCH.md Headshot URL Pattern section):
```
https://mgaleg.maryland.gov/2026RS/images/[lastname][optional_num].jpg
# Examples:
#   ferguson01.jpg, mckay02.jpg, ready01.jpg (most common: lowercase lastname + 2-digit suffix)
#   jennings.jpg (no suffix when name is unique)
# Disambiguation: johnson01.jpg / johnson02.jpg when multiple people share a last name
```

**TMP_DIR paths**:
```python
# Senators script:
TMP_DIR = Path("C:/Transparent Motivations/essentials/scripts/tmp_md_senate_headshots")

# Delegates script:
TMP_DIR = Path("C:/Transparent Motivations/essentials/scripts/tmp_md_delegate_headshots")
```

**Idempotency check** (lines 241-278 of md_executives_headshots.py — copy verbatim):
```python
def check_image_exists(politician_id: str, db_url: str) -> bool:
    """Check if a politician_images row already exists via psycopg2."""
    conn = psycopg2.connect(db_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) FROM essentials.politician_images"
                " WHERE politician_id = %s::uuid AND type = 'default'",
                (politician_id,)
            )
            row = cur.fetchone()
            return (row[0] > 0) if row else False
    finally:
        conn.close()
```

**politician_images insert** (lines 257-278 of md_executives_headshots.py — copy verbatim):
```python
cur.execute(
    """
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(), %s::uuid, %s, 'default', 'public_domain'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images WHERE politician_id = %s::uuid
)
""",
    (politician_id, url, politician_id)
)
```

---

## Shared Patterns

### Government Subquery Pattern
**Source:** `C:/EV-Accounts/backend/migrations/269_md_government_chambers.sql` lines 50-57
**Apply to:** All 4 migrations (272, 273, 274, 275 is N/A for this)
```sql
(SELECT id FROM essentials.governments WHERE name = 'State of Maryland' AND state = 'MD')
```
Note: OR generator (generate_or_senate.ps1 line 43) omits `AND state = 'OR'`. MD migrations must include `AND state = 'MD'` to match 269 precedent.

### State Casing Rule
**Source:** RESEARCH.md Pitfall 5 (verified from 270_md_state_executives.sql)
**Apply to:** All district WHERE clauses in migrations 272, 273, 274, 275
```sql
-- STATE_UPPER / STATE_LOWER → d.state = 'md'  (lowercase)
-- NATIONAL_UPPER / NATIONAL_LOWER / STATE_EXEC → d.state = 'MD'  (uppercase)
```

### Idempotency Guard — `p.id IS NOT NULL`
**Source:** RESEARCH.md Anti-Patterns section; also 170_me_federal_officials.sql lines 63-66
**Apply to:** All CTE office INSERT SELECT statements in migrations 273, 274, 275
```sql
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE ...
  AND p.id IS NOT NULL   -- required: CROSS JOIN returns 0 rows on DO NOTHING conflict
```
Note: OR senator/house generators (226, 227) omit this guard. MD generators must add it.

### Office Back-fill Pattern
**Source:** `scripts/md_executives_headshots.py` analog for scripts; `226_or_state_senators.sql` lines 116-122 for SQL
**Apply to:** End of migrations 273, 274, 275
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN <range_low> AND <range_high>
  AND p.office_id IS NULL;
```

### UTF-8 NoBOM File Writer
**Source:** `generate_or_senate.ps1` lines 127-129 (and identical in generate_or_house.ps1 lines 161-163)
**Apply to:** Both MD generator scripts (generate_md_senate.ps1, generate_md_house.ps1)
```powershell
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText($Out, $sb.ToString(), $utf8NoBom)
```
Required because psql rejects UTF-8 BOM. Non-ASCII delegate names (e.g., Peña-Melnyk) require this.

### CTE Count Verification
**Source:** `generate_or_senate.ps1` lines 132-134; `generate_or_house.ps1` lines 165-168
**Apply to:** Both MD generator scripts
```powershell
$content = Get-Content $Out -Raw -Encoding UTF8
$cteCount = ([regex]::Matches($content, 'WITH ins_p AS')).Count
Write-Host "CTE blocks: $cteCount  (expected 47)"   # senators
Write-Host "CTE blocks: $cteCount  (expected 141)"  # delegates
```

---

## No Analog Found

All files have close analogs. No entries.

---

## Key Divergences from Analogs

These are places where copying the analog verbatim would introduce a bug:

| File | Analog Pattern | MD Deviation | Why |
|------|---------------|--------------|-----|
| 273, 274 generators | OR NOT EXISTS uses `(district_id, chamber_id)` | MD 274 must use `(district_id, politician_id)` | Multi-member whole districts — (district_id, chamber_id) blocks 2nd/3rd office insert |
| 273, 274 generators | OR omits `p.id IS NOT NULL` in CROSS JOIN | MD must include it | Defense against silent skip on DO NOTHING conflict |
| 273, 274 generators | OR government subquery omits state filter | MD uses `AND state = 'MD'` | 269 established this as MD canonical pattern |
| 275 | 170 inserts US senators | 275 asserts senators pre-exist, skips insert | Van Hollen (-400033) and Alsobrooks (-400034) already seeded |
| 275 | 170 uses title `'Representative'` | MD uses title `'U.S. Representative'` | CONTEXT.md D-09 / DB schema canonical title |
| 274 roster | OR single entry per district | MD whole districts need 3 entries per dist (same geo_id, different ext_id and name) | Multi-member model D-01 |

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/`, `C:/Transparent Motivations/essentials/scripts/`
**Files scanned:** 7 analog files read in full
**Pattern extraction date:** 2026-06-05
