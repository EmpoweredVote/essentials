# Phase 101: VA State Government DB - Pattern Map

**Mapped:** 2026-06-08
**Files analyzed:** 6 (4 SQL migrations + 2 PowerShell generators)
**Analogs found:** 6 / 6

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `migrations/300_va_government_chambers.sql` | migration | CRUD | `migrations/269_md_government_chambers.sql` | exact |
| `migrations/301_va_state_executives.sql` | migration | CRUD | `migrations/270_md_state_executives.sql` | exact |
| `migrations/generate_va_senate.ps1` | utility | batch | `migrations/generate_md_senate.ps1` | exact |
| `migrations/302_va_state_senators.sql` | migration | CRUD | `migrations/273_md_state_senators.sql` (generated output) | exact |
| `migrations/generate_va_house.ps1` | utility | batch | `migrations/generate_or_house.ps1` | exact |
| `migrations/303_va_delegates.sql` | migration | CRUD | `migrations/227_or_state_house.sql` (generated output) | exact |
| `scripts/_apply-migration-302.ts` | utility | request-response | `scripts/_apply-migration-273.ts` | exact |
| `scripts/_apply-migration-303.ts` | utility | request-response | `scripts/_apply-migration-274.ts` | role-match |

All paths are under `C:/EV-Accounts/backend/`.

---

## Pattern Assignments

### `migrations/300_va_government_chambers.sql` (migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/269_md_government_chambers.sql`

**File header / pre-flight pattern** (lines 33-46):
```sql
BEGIN;

-- Pre-flight: assert State of Maryland government row exists (exactly 1 row)
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

**Chamber INSERT pattern — idempotent WHERE NOT EXISTS** (lines 48-58):
```sql
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'Governor',
       'Governor of Maryland',
       (SELECT id FROM essentials.governments WHERE name = 'State of Maryland' AND state = 'MD')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Governor'
    AND government_id = (SELECT id FROM essentials.governments WHERE name = 'State of Maryland' AND state = 'MD')
);
```

**VA substitutions required:**
- `'State of Maryland'` → `'State of Virginia'`
- `AND state = 'MD'` → `AND state = 'VA'`
- `'Governor of Maryland'` → `'Governor of Virginia'`
- 5 chambers total: Governor, Lieutenant Governor, Attorney General, Virginia Senate, House of Delegates
- `'Maryland Senate'` → `'Virginia Senate'` (name AND name_formal both = `'Virginia Senate'`)
- `'House of Delegates'` / `'Virginia House of Delegates'` (name = short, name_formal = state-qualified)
- Drop Comptroller and State Treasurer (VA has only 3 executives, not 5)

**Critical constraint (line 17 comment):**
```
-- CRITICAL: slug is GENERATED ALWAYS on essentials.chambers — never include
-- in INSERT column list or the INSERT will error.
```

---

### `migrations/301_va_state_executives.sql` (migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/270_md_state_executives.sql`

**STEP 1 — STATE_EXEC district INSERT pattern** (lines 59-64):
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, district_id, mtfcc)
SELECT gen_random_uuid(), 'STATE_EXEC', 'MD', '24', 'Maryland Governor', '', ''
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE district_type = 'STATE_EXEC' AND state = 'MD' AND label = 'Maryland Governor'
);
```

**STEP 2 — CTE politician + office INSERT pattern** (lines 106-137):
```sql
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Wes Moore', 'Wes', 'Moore', 'Democrat',
          true, false, false, true, -240001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Governor'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'State of Maryland' AND state = 'MD')),
       p.id,
       'Governor', 'MD', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.district_type = 'STATE_EXEC' AND d.state = 'MD' AND d.label = 'Maryland Governor'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id
      AND o.chamber_id = (SELECT id FROM essentials.chambers
                          WHERE name = 'Governor'
                            AND government_id = (SELECT id FROM essentials.governments
                                                 WHERE name = 'State of Maryland' AND state = 'MD'))
  );
```

**STEP 3 — office_id back-fill pattern** (lines 282-287):
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -240010 AND -240001
  AND p.office_id IS NULL;
```

**VA substitutions required:**
- `'MD'` → `'VA'` (all uppercase STATE_EXEC state column — CRITICAL; lowercase breaks routing)
- `'24'` → `'51'` (FIPS geo_id)
- `'State of Maryland'` / `AND state = 'MD'` → `'State of Virginia'` / `AND state = 'VA'`
- `'Maryland Governor'` → `'Virginia Governor'` (district label)
- `'Maryland Lieutenant Governor'` → `'Virginia Lieutenant Governor'`
- `'Maryland Attorney General'` → `'Virginia Attorney General'`
- Only 3 CTE blocks (Spanberger -510001, Hashmi -510002, Jones -510003) — drop Comptroller and State Treasurer
- All 3 have `is_appointed=false` and `is_appointed_position=false` (all voter-elected)
- Back-fill range: `BETWEEN -510010 AND -510001`
- `representing_state='VA'` on all 3 office rows

**Executives roster for migration 301:**

| Name | Title | external_id | is_appointed |
|------|-------|-------------|-------------|
| Abigail Spanberger | Governor | -510001 | false |
| Ghazala Hashmi | Lieutenant Governor | -510002 | false |
| Jay Jones | Attorney General | -510003 | false |

---

### `migrations/generate_va_senate.ps1` (utility, batch)

**Analog:** `C:/EV-Accounts/backend/migrations/generate_md_senate.ps1`

**Script structure pattern** (lines 19-67 of analog — `param`, `EscSql`, `SenatorBlock` function):
```powershell
param(
    [string]$Out = "C:/EV-Accounts/backend/migrations/273_md_state_senators.sql"
)

function EscSql([string]$s) { $s.Replace("'", "''") }

function SenatorBlock($r) {
    $f   = EscSql $r.full
    $fn  = EscSql $r.first
    $ln  = EscSql $r.last
    $pa  = EscSql $r.party
    $gid = '24' + ([int]$r.dist).ToString().PadLeft(3, '0')
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

**UTF-8 NoBOM write + CTE count verify pattern** (lines 123-163 of analog):
```powershell
$sb = [System.Text.StringBuilder]::new()
# ... AppendLine calls for header comments ...
$null = $sb.AppendLine("BEGIN;")
foreach ($r in $roster) {
    $null = $sb.AppendLine((SenatorBlock $r))
}
$null = $sb.AppendLine("-- ===== office_id back-fill =====")
$null = $sb.AppendLine("UPDATE essentials.politicians p")
$null = $sb.AppendLine("SET office_id = o.id")
$null = $sb.AppendLine("FROM essentials.offices o")
$null = $sb.AppendLine("WHERE o.politician_id = p.id")
$null = $sb.AppendLine("  AND p.external_id BETWEEN -2410047 AND -2410001")
$null = $sb.AppendLine("  AND p.office_id IS NULL;")
$null = $sb.AppendLine("")
$null = $sb.AppendLine("COMMIT;")

$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText($Out, $sb.ToString(), $utf8NoBom)
Write-Host "Written: $Out"

$content = Get-Content $Out -Raw
$cteCount = ([regex]::Matches($content, 'WITH ins_p AS')).Count
Write-Host "CTE blocks (senators): $cteCount  (expected 47)"
```

**VA substitutions required (7 changes):**
1. `$Out` default → `"C:/EV-Accounts/backend/migrations/302_va_state_senators.sql"`
2. `'24'` → `'51'` (FIPS prefix in `$gid` construction)
3. `'Maryland Senate'` → `'Virginia Senate'` (chamber name in SQL)
4. `'State of Maryland' AND state = 'MD'` → `'State of Virginia' AND state = 'VA'`
5. `d.state = 'md'` → `d.state = 'va'` (lowercase TIGER casing for STATE_UPPER)
6. `representing_state = 'MD'` → `representing_state = 'VA'`
7. external_id range: `-2410001..-2410047` → `-5110001..-5110040`; back-fill `BETWEEN -5110040 AND -5110001`
8. Roster: 40 entries (SD-1 through SD-40) with ext_ids -5110001 through -5110040 and geo_ids 51001 through 51040

**CRITICAL note carried from analog comments (line 15-16):**
```
# CRITICAL: district_type = 'STATE_UPPER' required - geo_ids 24001-24047 exist in BOTH
#           STATE_UPPER and STATE_LOWER; omitting district_type causes ambiguous subquery
```
For VA this is even more critical: geo_ids 51001-51040 exist in BOTH STATE_UPPER and STATE_LOWER (100% overlap for senators).

---

### `migrations/generate_va_house.ps1` (utility, batch)

**Analog:** `C:/EV-Accounts/backend/migrations/generate_or_house.ps1`

**RepBlock function pattern** (lines 23-61 of analog):
```powershell
function RepBlock($r) {
    $f   = EscSql $r.full
    $fn  = EscSql $r.first
    $ln  = EscSql $r.last
    $pa  = EscSql $r.party
    $gid = '41' + ([int]$r.dist).ToString().PadLeft(3, '0')
@"
-- ===== HD-$($r.dist) ($gid): $($r.full) ($($r.party)) =====
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
        WHERE name = 'Oregon House of Representatives'
          AND government_id = (SELECT id FROM essentials.governments WHERE name = 'State of Oregon')),
       p.id,
       'Representative', 'OR', false, false
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '$gid' AND d.district_type = 'STATE_LOWER' AND d.state = 'or'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id
      AND o.chamber_id = (SELECT id FROM essentials.chambers
                           WHERE name = 'Oregon House of Representatives'
                             AND government_id = (SELECT id FROM essentials.governments WHERE name = 'State of Oregon'))
  );
"@
}
```

**CRITICAL: The NOT EXISTS guard here is `(district_id, chamber_id)` — single-member pattern.** This is what VA delegates must use. The MD house used `(district_id, politician_id)` — that is the multi-member pattern and is WRONG for VA.

**VA substitutions required (9 changes):**
1. `$Out` default → `"C:/EV-Accounts/backend/migrations/303_va_delegates.sql"`
2. `'41'` → `'51'` (FIPS prefix in `$gid`)
3. `'Oregon House of Representatives'` → `'House of Delegates'`
4. `'State of Oregon'` → `'State of Virginia' AND state = 'VA'` (note: OR generator omits `AND state=` — MD/VA should add it per Pitfall 5)
5. `d.state = 'or'` → `d.state = 'va'` (lowercase TIGER casing)
6. `'Representative'` → `'Delegate'` (title on office row)
7. `'OR'` → `'VA'` (representing_state)
8. external_id range: `-4120001..-4120060` → `-5120001..-5120100`; back-fill `BETWEEN -5120100 AND -5120001`
9. Roster: 100 entries (HD-1 through HD-100)

**HD-20 vacancy special case — copy from MD vacant delegate pattern:**
```powershell
# HD-20 is vacant — Maldonado resigned May 31, 2026
# Use: full_name='Vacant', first_name='', last_name='', party='', is_active=false, is_vacant=true, is_incumbent=false
# The RepBlock function generates is_incumbent=true by default — HD-20 needs a special case
@{ dist=20; ext_id=-5120020; full='Vacant'; first=''; last=''; party=''; is_vacant=$true }
```

The block for HD-20 must override `is_active=false`, `is_vacant=true`, `is_incumbent=false`. Either handle inline or add an `if ($r.is_vacant)` branch in the generator function.

**Add `p.id IS NOT NULL` guard (MD senate lesson, line 4 of analog comments):**
The OR house generator omits the `AND p.id IS NOT NULL` guard. The MD senate generator adds it. VA should add it per MD pattern:
```sql
  AND p.id IS NOT NULL
```
(Already present in the OR house generator is NOT present — add it for VA.)

**CTE count verify line (bottom of script):**
```powershell
Write-Host "CTE blocks (delegates): $cteCount  (expected 100)"
```

---

### `scripts/_apply-migration-302.ts` (utility, request-response)

**Analog:** `C:/EV-Accounts/backend/scripts/_apply-migration-273.ts`

**Full structure pattern** (lines 1-89 of analog):
```typescript
import 'dotenv/config';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import path from 'path';

const pool = new Pool({ connectionString: process.env['DATABASE_URL'], ssl: { rejectUnauthorized: false } });

const sql = readFileSync(path.join(process.cwd(), 'migrations', '273_md_state_senators.sql'), 'utf8');

try {
  await pool.query(sql);
  console.log('Migration 273 applied successfully');

  // Smoke test 1: count check
  const r1 = await pool.query(`
    SELECT COUNT(*) as cnt FROM essentials.offices o
    JOIN essentials.chambers c ON c.id = o.chamber_id
    WHERE c.name = 'Maryland Senate' AND o.representing_state = 'MD'
  `);
  console.log('Senator offices (Maryland Senate chamber):', r1.rows[0].cnt, '(expected 47)');

  // Spot-check first district
  const r5 = await pool.query(`
    SELECT p.full_name, p.external_id, d.geo_id, d.district_type, d.state
    FROM essentials.politicians p
    JOIN essentials.offices o ON o.politician_id = p.id
    JOIN essentials.districts d ON d.id = o.district_id
    WHERE p.external_id = -2410001
  `);
  console.log('\nSpot-check SD-01:', JSON.stringify(r5.rows[0]));

  // NULL office_id check
  const r8 = await pool.query(`
    SELECT COUNT(*) as cnt FROM essentials.politicians
    WHERE external_id BETWEEN -2410047 AND -2410001 AND office_id IS NULL
  `);
  console.log('\nNULL office_id count (expected 0):', r8.rows[0].cnt);

} catch (e: any) {
  console.error('Error applying migration 273:', e.message);
  process.exit(1);
} finally {
  await pool.end();
}
```

**VA substitutions required:**
- Migration filename: `'273_md_state_senators.sql'` → `'302_va_state_senators.sql'`
- Chamber name in queries: `'Maryland Senate'` → `'Virginia Senate'`
- `representing_state = 'MD'` → `representing_state = 'VA'`
- external_id range: `-2410047 AND -2410001` → `-5110040 AND -5110001`
- Expected counts: `(expected 47)` → `(expected 40)`
- Spot-check targets: SD-01 French (-5110001), SD-20 DeSteph (-5110020), SD-40 Favola (-5110040)
- Error message: `'Error applying migration 273'` → `'Error applying migration 302'`

---

### `scripts/_apply-migration-303.ts` (utility, request-response)

**Analog:** `C:/EV-Accounts/backend/scripts/_apply-migration-273.ts` (use senator pattern, not MD delegates which has multi-member integrity checks)

**VA-specific smoke tests to add beyond the senator template:**

```typescript
// Extra smoke test for 303: HD-20 vacancy check
const rVacant = await pool.query(`
  SELECT p.full_name, p.is_vacant, p.is_active FROM essentials.politicians p
  WHERE p.external_id = -5120020
`);
console.log('\nHD-20 vacancy check:', JSON.stringify(rVacant.rows[0]));
// Expected: { full_name: 'Vacant', is_vacant: true, is_active: false }
```

**VA substitutions from senator template:**
- Migration filename: `'302_va_state_senators.sql'` → `'303_va_delegates.sql'`
- Chamber name: `'Virginia Senate'` → `'House of Delegates'`
- external_id range: `-5110040 AND -5110001` → `-5120100 AND -5120001`
- Expected counts: `(expected 40)` → `(expected 100)`
- Spot-checks: HD-1 Hope (-5120001), HD-50 Wright (-5120050), HD-100 Bloxom (-5120100)
- No multi-member integrity gates needed (single-member chamber)

---

## Shared Patterns

### Pre-flight Government Row Assertion
**Source:** `C:/EV-Accounts/backend/migrations/269_md_government_chambers.sql` lines 37-46
**Apply to:** Migration 300 (chambers), Migration 301 (executives)
```sql
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
Substitute `'State of Maryland'` / `'MD'` → `'State of Virginia'` / `'VA'`.

### Idempotent Chamber INSERT (WHERE NOT EXISTS)
**Source:** `C:/EV-Accounts/backend/migrations/269_md_government_chambers.sql` lines 48-58
**Apply to:** Migration 300 only. Never use ON CONFLICT for chambers (no unique constraint on name+gov_id).

### Idempotent Politician INSERT (ON CONFLICT external_id DO NOTHING)
**Source:** `C:/EV-Accounts/backend/migrations/270_md_state_executives.sql` lines 107-113
**Apply to:** Migrations 301, 302, 303. The `external_id` column has a unique constraint (`191_essentials_politicians_external_id_unique.sql`).

### Idempotent Office INSERT (NOT EXISTS district_id + chamber_id)
**Source:** `C:/EV-Accounts/backend/migrations/270_md_state_executives.sql` lines 130-137
**Apply to:** Migrations 301, 302, 303. Use `(district_id, chamber_id)` NOT EXISTS — single-member guard. NEVER use `(district_id, politician_id)` for VA.

### office_id Back-fill UPDATE
**Source:** `C:/EV-Accounts/backend/migrations/270_md_state_executives.sql` lines 282-287
**Apply to:** Migrations 301, 302, 303. Always scoped by external_id range + `office_id IS NULL` guard.

### UTF-8 NoBOM File Write (PowerShell)
**Source:** `C:/EV-Accounts/backend/migrations/generate_md_senate.ps1` lines 155-156
**Apply to:** generate_va_senate.ps1, generate_va_house.ps1
```powershell
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText($Out, $sb.ToString(), $utf8NoBom)
```
Required for psql compatibility. BOM causes psql parse errors.

### CTE Count Verification (PowerShell)
**Source:** `C:/EV-Accounts/backend/migrations/generate_md_senate.ps1` lines 160-162
**Apply to:** generate_va_senate.ps1 (expected 40), generate_va_house.ps1 (expected 100)
```powershell
$content = Get-Content $Out -Raw
$cteCount = ([regex]::Matches($content, 'WITH ins_p AS')).Count
Write-Host "CTE blocks: $cteCount  (expected 47)"
```

### Apply Script Structure (TypeScript)
**Source:** `C:/EV-Accounts/backend/scripts/_apply-migration-273.ts` lines 1-6
**Apply to:** `_apply-migration-302.ts`, `_apply-migration-303.ts`
```typescript
import 'dotenv/config';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import path from 'path';

const pool = new Pool({ connectionString: process.env['DATABASE_URL'], ssl: { rejectUnauthorized: false } });
```

---

## No Analog Found

None. All 6 output files have exact analogs in the codebase.

---

## Critical VA-Specific Deviations from Analogs

These are NOT pattern deviations — they are required VA substitutions that differ from what the analog does:

| Deviation | Analog behavior | VA required behavior | Source |
|-----------|----------------|----------------------|--------|
| STATE_EXEC state casing | `'MD'` uppercase (already correct in 270) | `'VA'` uppercase — NEVER `'va'` | OR 223a production bug |
| STATE_UPPER/LOWER district lookup state | `d.state = 'md'` lowercase | `d.state = 'va'` lowercase | TIGER loader casing |
| district_type in district JOIN | `AND d.district_type = 'STATE_UPPER'` | Required for senators AND delegates — 40 of 40 senate geo_ids overlap with delegate geo_ids | Pitfall 3 |
| NOT EXISTS guard for delegates | MD house uses `(district_id, politician_id)` | VA must use `(district_id, chamber_id)` — single-member like OR house | Pitfall 1 |
| Chambers count | MD: 5 | VA: 5 (different set — no Comptroller/Treasurer; add Virginia Senate + House of Delegates) | VA-GOV-01 |
| Executives count | MD: 5 (2 voter-elected + 1 appt) | VA: 3 (all voter-elected) | VA-GOV-05 |
| VA Senate chamber name | N/A | `name='Virginia Senate'`, `name_formal='Virginia Senate'` (same for both — OR/MD self-qualifying precedent) | Research Pattern 1 |
| Vacant delegate (HD-20) | MD has District 42A vacant | VA has HD-20 vacant (Maldonado resigned May 31, 2026) | Research Architecture Diagram |
| Government subquery safety | OR generator omits `AND state=` | VA must include `AND state = 'VA'` — West Virginia row also exists | Pitfall 5 |

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/` (all .sql and .ps1 files), `C:/EV-Accounts/backend/scripts/` (_apply-migration-*.ts files)
**Files scanned:** 12 files read in full
**Pattern extraction date:** 2026-06-08
