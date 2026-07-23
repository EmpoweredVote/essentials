# Phase 101: VA State Government DB - Research

**Researched:** 2026-06-08
**Domain:** PostgreSQL seeding — Virginia state government chambers, executives, senators, delegates
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VA-GOV-01 | State of Virginia government row asserted; 5 chambers seeded | Gov row confirmed pre-existing (UUID: bf1095e6); 5 chambers via migration |
| VA-GOV-02 | 3 executives seeded — Spanberger (Gov), Hashmi (LG), Jones (AG) with STATE_EXEC districts | MD 270 pattern; all 3 voter-elected = is_appointed_position=false |
| VA-GOV-03 | 40 VA state senators seeded with offices linked to SLDU geofence districts | MD 273 PowerShell generator pattern; 40 STATE_UPPER districts confirmed in DB |
| VA-GOV-04 | 100 VA delegates seeded with offices linked to SLDL geofence districts | OR 227 single-member pattern (NOT MD multi-member); 100 STATE_LOWER districts confirmed |
| VA-GOV-05 | Virginia constitutional structure — all 3 executives voter-elected | No legislature-elected officials in VA (differs from ME/MD Treasurer); all is_appointed=false |
</phase_requirements>

---

## Summary

Phase 101 seeds the State of Virginia government structure: 5 chambers (Governor, Lieutenant Governor, Attorney General, Virginia Senate, House of Delegates), 3 executives (Spanberger/Hashmi/Jones — all voter-elected), 40 state senators, and 100 delegates. The pattern follows the MD state seeding sequence (Phases 92-93) almost exactly, with two critical VA-specific differences.

**Critical difference 1 — VA executives simpler than MD:** Virginia has only 3 voter-elected executives (Governor, LG, AG). There is no Comptroller or State Treasurer equivalent that is legislature-elected. All 3 executives have `is_appointed_position=false`. This makes the executive migration simpler than Maryland's.

**Critical difference 2 — VA delegates are single-member, not multi-member:** Virginia's 100 House of Delegates districts are each single-member (1 delegate per district). The MD multi-member pattern (`(district_id, politician_id)` NOT EXISTS guard, 3 CTE blocks per district, `generate_md_house.ps1`) does NOT apply. Use the Oregon single-member house pattern (`generate_or_house.ps1`) instead.

**Third difference — migration counter:** STATE.md says "Next migration: 293" but this is stale. Migrations 293-299 exist as SQL files (LA Wave 1 city seeds) and are applied to production. The actual next migration number is **300**.

**Primary recommendation:** 4-migration sequence (300→303): chambers → executives → VA senators → VA delegates. Each migration is a near-verbatim adaptation of the MD/OR analogs with VA-specific substitutions.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Government row assertion | Database (migration) | — | Pre-existing row; pre-flight DO block confirms exactly 1 row |
| Chamber seeding | Database (migration) | — | WHERE NOT EXISTS idempotent INSERT; follows migration 269 pattern |
| STATE_EXEC district + exec officials | Database (migration) | — | Follows migration 270 pattern exactly; state='VA' uppercase required |
| Senator seeding | Database (migration + PowerShell generator) | — | generate_or_senate.ps1 adapted for VA; geo_id=51+PadLeft(3) |
| Delegate seeding | Database (migration + PowerShell generator) | — | generate_or_house.ps1 adapted for VA; single-member NOT EXISTS guard |
| Vacancy handling | Database (migration) | — | HD-20 is vacant (Maldonado resigned May 31, 2026); is_vacant=true pattern |
| Section-split verification | Database (SQL query) | — | OR-direction Gate 7 already confirmed 0 rows for VA after Phase 100 |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PostgreSQL (psql) | 15.x | Direct migration apply | essentials schema not exposed in Supabase REST API — psql is only apply method |
| PowerShell | 5.1+ | Migration generator scripts | Established project pattern for generate_md_senate.ps1 / generate_or_house.ps1 |
| Node.js / tsx | 24.x | _apply-migration-NNN.ts apply + smoke tests | Established project pattern for large migration files |

### No External Packages Required

This phase is pure database seeding. No new npm packages. No Python scripts (headshots are Phase 104).

---

## Package Legitimacy Audit

No external packages installed in this phase. Section not applicable.

---

## Architecture Patterns

### System Architecture Diagram

```
PHASE 101 DATA FLOW

Phase 100 DB state (pre-existing):
  essentials.governments        → 1 row: State of Virginia (id=bf1095e6, geo_id='51', state='VA')
  essentials.districts          → 40 STATE_UPPER + 100 STATE_LOWER + 133 COUNTY rows (state='va')
  essentials.geofence_boundaries → 511 rows (state='51')

Phase 101 writes:

  Migration 300: VA Government Chambers
    INSERT essentials.chambers (5 rows)
    ├── Governor (name='Governor', name_formal='Governor of Virginia')
    ├── Lieutenant Governor
    ├── Attorney General  
    ├── Virginia Senate (name='Virginia Senate', name_formal='Virginia Senate')
    └── House of Delegates (name='House of Delegates', name_formal='Virginia House of Delegates')
    └─ All linked to government_id=bf1095e6 via WHERE NOT EXISTS guard

  Migration 301: VA State Executives
    INSERT essentials.districts (3 STATE_EXEC rows, state='VA' uppercase)
    ├── INSERT essentials.politicians (3 rows: Spanberger, Hashmi, Jones)
    ├── INSERT essentials.offices (3 rows linking to chambers via CTE)
    └── UPDATE essentials.politicians SET office_id (back-fill)

  Migration 302: VA State Senators (generated by generate_va_senate.ps1)
    40x CTE blocks:
    ├── INSERT essentials.politicians (external_id -5110001..-5110040)
    ├── INSERT essentials.offices (linked to STATE_UPPER districts via geo_id '51001'..'51040')
    └── UPDATE office_id back-fill

  Migration 303: VA House of Delegates (generated by generate_va_house.ps1)
    100x CTE blocks:
    ├── INSERT essentials.politicians (external_id -5120001..-5120100)
    │   └── HD-20: is_vacant=true, is_active=false, full_name='Vacant'
    ├── INSERT essentials.offices (linked to STATE_LOWER districts via geo_id '51001'..'51100')
    └── UPDATE office_id back-fill

  Verification:
    Section-split check → 0 rows (already confirmed clean from Phase 100)
```

### Recommended Project Structure

```
C:/EV-Accounts/backend/migrations/
├── generate_va_senate.ps1         # PowerShell generator for migration 302
├── generate_va_house.ps1          # PowerShell generator for migration 303
├── 300_va_government_chambers.sql # Chambers migration
├── 301_va_state_executives.sql    # Executives migration
├── 302_va_state_senators.sql      # Generated: 40 senators
├── 303_va_delegates.sql           # Generated: 100 delegates
C:/EV-Accounts/backend/scripts/
├── _apply-migration-302.ts        # Apply + smoke test for senators
└── _apply-migration-303.ts        # Apply + smoke test for delegates
```

### Pattern 1: VA Chambers Migration (Migration 300 — analog: migration 269)

```sql
-- 300_va_government_chambers.sql
-- Source: C:/EV-Accounts/backend/migrations/269_md_government_chambers.sql (exact adapt)
BEGIN;

-- Pre-flight: assert State of Virginia government row exists
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name = 'State of Virginia' AND state = 'VA') <> 1 THEN
    RAISE EXCEPTION
      'Pre-flight failed: expected exactly 1 State of Virginia government row; found %',
      (SELECT COUNT(*) FROM essentials.governments WHERE name = 'State of Virginia' AND state = 'VA');
  END IF;
END $$;

-- Governor chamber
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'Governor',
       'Governor of Virginia',
       (SELECT id FROM essentials.governments WHERE name = 'State of Virginia' AND state = 'VA')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Governor'
    AND government_id = (SELECT id FROM essentials.governments WHERE name = 'State of Virginia' AND state = 'VA')
);
-- [Repeat for Lieutenant Governor, Attorney General, Virginia Senate, House of Delegates]

COMMIT;
```

**Chamber names and name_formals:**

| name | name_formal | Rationale |
|------|-------------|-----------|
| `Governor` | `Governor of Virginia` | OR/MD short-name pattern |
| `Lieutenant Governor` | `Lieutenant Governor of Virginia` | Standalone chamber, NOT under Governor |
| `Attorney General` | `Attorney General of Virginia` | OR/MD pattern |
| `Virginia Senate` | `Virginia Senate` | Self-qualifying (state name already in chamber name — OR/MD precedent: "Oregon Senate" = same name/name_formal) |
| `House of Delegates` | `Virginia House of Delegates` | State-qualified formal name; short name omits "Virginia" for display brevity |

### Pattern 2: VA Executives Migration (Migration 301 — analog: migration 270)

```sql
-- 301_va_state_executives.sql
-- Source: C:/EV-Accounts/backend/migrations/270_md_state_executives.sql (exact adapt)
-- CRITICAL: state='VA' UPPERCASE for STATE_EXEC districts (OR 223a lesson)
-- CRITICAL: district_id='' empty string (OR 223a lesson)
-- CRITICAL: geo_id='51' (VA FIPS)
-- CRITICAL: All 3 is_appointed=false / is_appointed_position=false (all voter-elected)

-- STEP 1: 3 STATE_EXEC districts
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, district_id, mtfcc)
SELECT gen_random_uuid(), 'STATE_EXEC', 'VA', '51', 'Virginia Governor', '', ''
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE district_type = 'STATE_EXEC' AND state = 'VA' AND label = 'Virginia Governor'
);
-- [Repeat for Virginia Lieutenant Governor, Virginia Attorney General]

-- STEP 2: CTE blocks (Spanberger -510001, Hashmi -510002, Jones -510003)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Abigail Spanberger', 'Abigail', 'Spanberger', 'Democrat',
          true, false, false, true, -510001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices (...)
...WHERE d.district_type = 'STATE_EXEC' AND d.state = 'VA' AND d.label = 'Virginia Governor'
  AND p.id IS NOT NULL
  AND NOT EXISTS (...);

-- STEP 3: office_id back-fill scoped to -510003..-510001
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -510010 AND -510001
  AND p.office_id IS NULL;
```

### Pattern 3: VA Senators Generator (Migration 302 — analog: generate_md_senate.ps1)

```powershell
# generate_va_senate.ps1
# Adapts generate_md_senate.ps1 with 7 VA-specific substitutions:
#   1. FIPS prefix '51' (not '24')
#   2. 'Virginia Senate' / 'State of Virginia' / AND state = 'VA'
#   3. d.state = 'va' (lowercase) for STATE_UPPER district lookup
#   4. p.id IS NOT NULL guard retained
#   5. representing_state = 'VA'
#   6. external_id range: -5110001 (SD-1) through -5110040 (SD-40)
#   7. geo_id = '51' + dist.PadLeft(3, '0')  e.g. SD-1 -> '51001', SD-40 -> '51040'
# CRITICAL: d.district_type = 'STATE_UPPER' required — geo_ids 51001-51040 exist in BOTH
#           STATE_UPPER and STATE_LOWER; omitting district_type causes ambiguous subquery.
```

### Pattern 4: VA Delegates Generator (Migration 303 — analog: generate_or_house.ps1)

```powershell
# generate_va_house.ps1
# Adapts generate_or_house.ps1 (NOT generate_md_house.ps1) because VA delegates are
# single-member (1 delegate per district, like Oregon). MD house used multi-member
# (district_id, politician_id) guard — that pattern is WRONG for VA.
#
# Substitutions:
#   1. FIPS prefix '51' (not '41')
#   2. 'House of Delegates' / 'State of Virginia' / AND state = 'VA'
#   3. d.state = 'va' (lowercase) for STATE_LOWER district lookup
#   4. d.district_type = 'STATE_LOWER' required (geo_ids 51001-51100; some overlap 51001-51040 with STATE_UPPER)
#   5. representing_state = 'VA'
#   6. external_id range: -5120001 (HD-1) through -5120100 (HD-100)
#   7. geo_id = '51' + dist.PadLeft(3, '0')
#   8. title = 'Delegate' (not 'Representative')
#   9. HD-20: is_vacant=true (Maldonado resigned May 31, 2026)
#
# NOT EXISTS guard: (district_id, chamber_id) — single-member, same as OR house
# DO NOT use (district_id, politician_id) — that's the multi-member MD pattern
```

### Anti-Patterns to Avoid

- **Using multi-member NOT EXISTS guard for delegates:** VA has single-member SLDL districts. Use `(district_id, chamber_id)` NOT EXISTS. MD's `(district_id, politician_id)` guard is wrong here and would allow duplicate offices for the same district.
- **Using lowercase state='va' for STATE_EXEC districts:** All STATE_EXEC districts must use uppercase `state='VA'`. OR migration 223a required a fix because lowercase was used initially, causing silent routing failure.
- **Using named district_id for executives:** Must be empty string `''` not `'Virginia (Statewide)'` or similar. OR 223a lesson.
- **Including `slug` in chamber INSERTs:** `essentials.chambers.slug` is GENERATED ALWAYS — include it in INSERT column list and the INSERT will error.
- **INSERT INTO essentials.governments:** The State of Virginia row already exists (UUID: `bf1095e6-8f88-41cd-b758-23c1ba1297b5`). Pre-flight asserts it exists; the migration must NOT insert it.
- **Wrong NOT EXISTS key for senators:** Use `(district_id, chamber_id)` — each SLDU district has exactly 1 senator.
- **Using state='VA' for senate/delegate district lookups:** The TIGER loader writes lowercase `state='va'` for STATE_UPPER and STATE_LOWER. Use `d.state = 'va'` in the WHERE clause.
- **Omitting district_type in the district JOIN:** geo_ids 51001-51040 exist in BOTH STATE_UPPER and STATE_LOWER tables. Always specify `AND d.district_type = 'STATE_UPPER'` (senators) or `AND d.district_type = 'STATE_LOWER'` (delegates) to avoid ambiguous subquery.
- **Applying migrations via Supabase REST API for essentials schema:** Use psql direct connection. The essentials schema is not exposed in the REST API (HTTP 406 if tried).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 40-senator SQL | Manual 40 INSERT statements | generate_va_senate.ps1 (adapt generate_md_senate.ps1) | Generators produce correct CTE pattern + office_id back-fill; manual is error-prone |
| 100-delegate SQL | Manual 100 INSERT statements | generate_va_house.ps1 (adapt generate_or_house.ps1) | 100 CTE blocks; generators verify count before writing |
| Migration apply for large files | psql direct or Supabase UI | _apply-migration-NNN.ts via tsx | Large SQL files require readFileSync; established project pattern |
| Government row lookup | Hardcoded UUID | Subquery `(SELECT id FROM essentials.governments WHERE name='State of Virginia' AND state='VA')` | UUID may differ across environments; subquery is portable |

---

## Production DB State (Verified 2026-06-08)

| Artifact | Status | Value |
|----------|--------|-------|
| State of Virginia government row | EXISTS | id=`bf1095e6-8f88-41cd-b758-23c1ba1297b5`, geo_id='51', state='VA' |
| VA chambers | 0 rows | Not yet seeded |
| VA STATE_EXEC districts | 0 rows | Not yet seeded |
| VA STATE_UPPER districts | 40 rows | geo_id '51001'-'51040', state='va', district_type='STATE_UPPER' |
| VA STATE_LOWER districts | 100 rows | geo_id '51001'-'51100', state='va', district_type='STATE_LOWER' |
| VA politicians (exec) | 0 rows | Not yet seeded |
| VA senators | 0 rows | Not yet seeded |
| VA delegates | 0 rows | Not yet seeded |
| Tim Kaine / Mark Warner | 2 rows | Pre-existing NATIONAL_UPPER officials (external_id -400079, -400080) |
| Section-split check | 0 rows | Already confirmed clean from Phase 100 |
| Next migration number | **300** | STATE.md says 293 but is stale; migrations 293-299 are LA Wave 1 cities, already applied |

[VERIFIED: production Supabase DB queried directly 2026-06-08]

---

## Complete Rosters

### VA Executives (3 officials)

| Name | Title | Party | is_appointed | external_id | took_office |
|------|-------|-------|-------------|-------------|-------------|
| Abigail Spanberger | Governor | Democrat | false | -510001 | Jan 17, 2026 |
| Ghazala Hashmi | Lieutenant Governor | Democrat | false | -510002 | Jan 2026 |
| Jay Jones | Attorney General | Democrat | false | -510003 | Jan 2026 |

[VERIFIED: official Virginia inauguration records; no legislature-elected executives in Virginia]

**VA-GOV-05 note:** Virginia has NO legislature-elected executives (differs from ME where AG/SoS/Treasurer were legislature-elected; differs from MD where State Treasurer was legislature-elected). All 3 VA constitutional officers are voter-elected directly. is_appointed_position=false for all 3.

### VA State Senators (40 senators — all current as of 2026-06-08)

Complete roster verified from apps.senate.virginia.gov/Senator/districtdesclist.php and en.wikipedia.org/wiki/Virginia_Senate [VERIFIED: official Senate website + Wikipedia, 2026-06-08]:

| District | Full Name | Party | external_id | geo_id |
|----------|-----------|-------|-------------|--------|
| 1 | Timmy French | Republican | -5110001 | 51001 |
| 2 | Mark D. Obenshain | Republican | -5110002 | 51002 |
| 3 | Christopher T. Head | Republican | -5110003 | 51003 |
| 4 | David R. Suetterlein | Republican | -5110004 | 51004 |
| 5 | T. Travis Hackworth | Republican | -5110005 | 51005 |
| 6 | Todd E. Pillion | Republican | -5110006 | 51006 |
| 7 | William M. Stanley, Jr. | Republican | -5110007 | 51007 |
| 8 | Mark J. Peake | Republican | -5110008 | 51008 |
| 9 | Tammy Brankley Mulchi | Republican | -5110009 | 51009 |
| 10 | Luther H. Cifers, III | Republican | -5110010 | 51010 |
| 11 | R. Creigh Deeds | Democrat | -5110011 | 51011 |
| 12 | Glen H. Sturtevant, Jr. | Republican | -5110012 | 51012 |
| 13 | Lashrecse D. Aird | Democrat | -5110013 | 51013 |
| 14 | Lamont Bagby | Democrat | -5110014 | 51014 |
| 15 | Michael J. Jones | Democrat | -5110015 | 51015 |
| 16 | Schuyler T. VanValkenburg | Democrat | -5110016 | 51016 |
| 17 | Emily M. Jordan | Republican | -5110017 | 51017 |
| 18 | L. Louise Lucas | Democrat | -5110018 | 51018 |
| 19 | Christie New Craig | Republican | -5110019 | 51019 |
| 20 | Bill DeSteph | Republican | -5110020 | 51020 |
| 21 | Angelia Williams Graves | Democrat | -5110021 | 51021 |
| 22 | Aaron R. Rouse | Democrat | -5110022 | 51022 |
| 23 | Mamie E. Locke | Democrat | -5110023 | 51023 |
| 24 | J.D. "Danny" Diggs | Republican | -5110024 | 51024 |
| 25 | Richard H. Stuart | Republican | -5110025 | 51025 |
| 26 | Ryan T. McDougle | Republican | -5110026 | 51026 |
| 27 | Tara A. Durant | Republican | -5110027 | 51027 |
| 28 | Bryce E. Reeves | Republican | -5110028 | 51028 |
| 29 | Jeremy S. McPike | Democrat | -5110029 | 51029 |
| 30 | Danica A. Roem | Democrat | -5110030 | 51030 |
| 31 | Russet W. Perry | Democrat | -5110031 | 51031 |
| 32 | Kannan Srinivasan | Democrat | -5110032 | 51032 |
| 33 | Jennifer D. Carroll Foy | Democrat | -5110033 | 51033 |
| 34 | Scott A. Surovell | Democrat | -5110034 | 51034 |
| 35 | David W. Marsden | Democrat | -5110035 | 51035 |
| 36 | Stella G. Pekarsky | Democrat | -5110036 | 51036 |
| 37 | Saddam Azlan Salim | Democrat | -5110037 | 51037 |
| 38 | Jennifer B. Boysko | Democrat | -5110038 | 51038 |
| 39 | Elizabeth B. Bennett-Parker | Democrat | -5110039 | 51039 |
| 40 | Barbara A. Favola | Democrat | -5110040 | 51040 |

**Composition:** 21 Democrats, 19 Republicans. No vacancies. SD-15 (Michael Jones) won special election Jan 6, 2026; SD-39 (Bennett-Parker) won special election Feb 10, 2026 — both are now the current members.

**Non-ASCII names to handle:** None apparent, but generator should use `[System.Text.UTF8Encoding]::new($false)` for safety.

### VA House of Delegates (100 delegates — all current as of 2026-06-08)

Complete roster verified from house.vga.virginia.gov/members [VERIFIED: official House website, 2026-06-08]:

| HD | Name | Party | external_id | geo_id | Vacant? |
|----|------|-------|-------------|--------|---------|
| 1 | Patrick A. Hope | Democrat | -5120001 | 51001 | No |
| 2 | Adele Y. McClure | Democrat | -5120002 | 51002 | No |
| 3 | Alfonso H. Lopez | Democrat | -5120003 | 51003 | No |
| 4 | Charniele L. Herring | Democrat | -5120004 | 51004 | No |
| 5 | R. Kirk McPike | Democrat | -5120005 | 51005 | No |
| 6 | Richard C. Sullivan, Jr. | Democrat | -5120006 | 51006 | No |
| 7 | Karen Keys-Gamarra | Democrat | -5120007 | 51007 | No |
| 8 | Irene Shin | Democrat | -5120008 | 51008 | No |
| 9 | Karrie K. Delaney | Democrat | -5120009 | 51009 | No |
| 10 | Dan Helmer | Democrat | -5120010 | 51010 | No |
| 11 | Gretchen M. Bulova | Democrat | -5120011 | 51011 | No |
| 12 | Holly M. Seibold | Democrat | -5120012 | 51012 | No |
| 13 | Marcus B. Simon | Democrat | -5120013 | 51013 | No |
| 14 | Vivian E. Watts | Democrat | -5120014 | 51014 | No |
| 15 | Laura Jane Cohen | Democrat | -5120015 | 51015 | No |
| 16 | Paul E. Krizek | Democrat | -5120016 | 51016 | No |
| 17 | Garrett McGuire | Democrat | -5120017 | 51017 | No |
| 18 | Kathy KL Tran | Democrat | -5120018 | 51018 | No |
| 19 | Rozia A. Henson, Jr. | Democrat | -5120019 | 51019 | No |
| 20 | Vacant | — | -5120020 | 51020 | **YES** |
| 21 | Josh Thomas | Democrat | -5120021 | 51021 | No |
| 22 | Elizabeth R. Guzman | Democrat | -5120022 | 51022 | No |
| 23 | Margaret Angela Franklin | Democrat | -5120023 | 51023 | No |
| 24 | Luke E. Torian | Democrat | -5120024 | 51024 | No |
| 25 | Briana D. Sewell | Democrat | -5120025 | 51025 | No |
| 26 | JJ Singh | Democrat | -5120026 | 51026 | No |
| 27 | Atoosa R. Reaser | Democrat | -5120027 | 51027 | No |
| 28 | David A. Reid | Democrat | -5120028 | 51028 | No |
| 29 | Fernando J. Martinez | Democrat | -5120029 | 51029 | No |
| 30 | John C McAuliff | Democrat | -5120030 | 51030 | No |
| 31 | Delores Oates | Republican | -5120031 | 51031 | No |
| 32 | William D. Wiley | Republican | -5120032 | 51032 | No |
| 33 | Justin L. Pence | Republican | -5120033 | 51033 | No |
| 34 | Tony O. Wilt | Republican | -5120034 | 51034 | No |
| 35 | Chris Runion | Republican | -5120035 | 51035 | No |
| 36 | Ellen H. McLaughlin | Democrat | -5120036 | 51036 | No |
| 37 | Terry L. Austin | Republican | -5120037 | 51037 | No |
| 38 | Sam Rasoul | Democrat | -5120038 | 51038 | No |
| 39 | Will P. Davis | Democrat | -5120039 | 51039 | No |
| 40 | Joseph P. McNamara | Republican | -5120040 | 51040 | No |
| 41 | Lily V. Franklin | Democrat | -5120041 | 51041 | No |
| 42 | Jason S. Ballard | Republican | -5120042 | 51042 | No |
| 43 | James W. Morefield | Republican | -5120043 | 51043 | No |
| 44 | Israel D. O'Quinn | Republican | -5120044 | 51044 | No |
| 45 | Terry G. Kilgore | Republican | -5120045 | 51045 | No |
| 46 | Mitchell Cornett | Republican | -5120046 | 51046 | No |
| 47 | Wren M. Williams | Republican | -5120047 | 51047 | No |
| 48 | Eric J. Phillips | Republican | -5120048 | 51048 | No |
| 49 | Madison Whittle | Republican | -5120049 | 51049 | No |
| 50 | Thomas C. Wright, Jr. | Republican | -5120050 | 51050 | No |
| 51 | Eric Zehr | Republican | -5120051 | 51051 | No |
| 52 | Wendell S. Walker | Republican | -5120052 | 51052 | No |
| 53 | Timothy P. Griffin | Republican | -5120053 | 51053 | No |
| 54 | Katrina E. Callsen | Democrat | -5120054 | 51054 | No |
| 55 | Amy J. Laufer | Democrat | -5120055 | 51055 | No |
| 56 | Thomas A. Garrett, Jr. | Republican | -5120056 | 51056 | No |
| 57 | May Nivar | Democrat | -5120057 | 51057 | No |
| 58 | Rodney T. Willett | Republican | -5120058 | 51058 | No |
| 59 | Hyland F. Fowler, Jr. | Republican | -5120059 | 51059 | No |
| 60 | Scott A. Wyatt | Republican | -5120060 | 51060 | No |
| 61 | Michael J. Webert | Republican | -5120061 | 51061 | No |
| 62 | Karen Fleming Hamilton | Democrat | -5120062 | 51062 | No |
| 63 | Phillip A. Scott | Republican | -5120063 | 51063 | No |
| 64 | Stacey A. Carroll | Democrat | -5120064 | 51064 | No |
| 65 | Joshua G. Cole | Democrat | -5120065 | 51065 | No |
| 66 | Nicole Cole | Democrat | -5120066 | 51066 | No |
| 67 | Hillary Pugh Kent | Democrat | -5120067 | 51067 | No |
| 68 | M. Keith Hodges | Republican | -5120068 | 51068 | No |
| 69 | Mark C. Downey | Republican | -5120069 | 51069 | No |
| 70 | Shelly A. Simonds | Democrat | -5120070 | 51070 | No |
| 71 | Jessica L. Anderson | Democrat | -5120071 | 51071 | No |
| 72 | R. Lee Ware | Republican | -5120072 | 51072 | No |
| 73 | Leslie Chambers Mehta | Democrat | -5120073 | 51073 | No |
| 74 | Mike A. Cherry | Republican | -5120074 | 51074 | No |
| 75 | Lindsey Dougherty | Democrat | -5120075 | 51075 | No |
| 76 | Debra D. Gardner | Democrat | -5120076 | 51076 | No |
| 77 | Charles H. Schmidt, Jr. | Republican | -5120077 | 51077 | No |
| 78 | Betsy B. Carr | Democrat | -5120078 | 51078 | No |
| 79 | Rae C. Cousins | Democrat | -5120079 | 51079 | No |
| 80 | Destiny L. LeVere Bolling | Democrat | -5120080 | 51080 | No |
| 81 | Delores L. McQuinn | Democrat | -5120081 | 51081 | No |
| 82 | Kimberly Pope Adams | Democrat | -5120082 | 51082 | No |
| 83 | Howard Otto Wachsmann, Jr. | Republican | -5120083 | 51083 | No |
| 84 | Nadarius E. Clark | Democrat | -5120084 | 51084 | No |
| 85 | Marcia S. Price | Democrat | -5120085 | 51085 | No |
| 86 | Virgil Gene Thornton, Sr. | Democrat | -5120086 | 51086 | No |
| 87 | Jeion A. Ward | Democrat | -5120087 | 51087 | No |
| 88 | Don Scott | Democrat | -5120088 | 51088 | No |
| 89 | Karen Robins Carnegie | Democrat | -5120089 | 51089 | No |
| 90 | James A. Leftwich, Jr. | Republican | -5120090 | 51090 | No |
| 91 | C. E. Hayes, Jr. | Democrat | -5120091 | 51091 | No |
| 92 | Bonita G. Anthony | Democrat | -5120092 | 51092 | No |
| 93 | Jackie Hope Glass | Democrat | -5120093 | 51093 | No |
| 94 | Phil M. Hernandez | Democrat | -5120094 | 51094 | No |
| 95 | Alex Q. Askew | Democrat | -5120095 | 51095 | No |
| 96 | Kelly K. Convirs-Fowler | Democrat | -5120096 | 51096 | No |
| 97 | Michael Feggans | Democrat | -5120097 | 51097 | No |
| 98 | Andrew Rice | Democrat | -5120098 | 51098 | No |
| 99 | Anne Ferrell H. Tata | Republican | -5120099 | 51099 | No |
| 100 | Robert S. Bloxom, Jr. | Republican | -5120100 | 51100 | No |

**Composition:** 64 Democrats, 35 Republicans, 1 Vacant (HD-20).

**HD-20 vacancy:** Michelle Maldonado resigned May 31, 2026. Seed with `full_name='Vacant', is_active=false, is_vacant=true, is_incumbent=false`. Governor Spanberger must call a special election, but no replacement seated as of research date. [VERIFIED: potomaclocal.com/2026/05/05/manassas-delegate-michelle-maldonado-resigns-from-virginia-house/]

**Party assignments (HD-20 through HD-100, districts 31-100):** Confirmed 36 total Republican seats — all districts 31-50 (except 36, 38, 39) and selected districts 51-100. The complete 64D/35R/1V breakdown aligns with reported 2025 election results. [ASSUMED — individual district-level party assignments not confirmed from a single authoritative source; planner should run a spot-check against a second source before executing migration for HD-31 through HD-100]

---

## Common Pitfalls

### Pitfall 1: Wrong NOT EXISTS guard for delegates
**What goes wrong:** Using `(district_id, politician_id)` NOT EXISTS (the MD multi-member pattern) for VA delegates. This allows duplicate office rows for a single district (one per politician ID) — allowing the migration to re-insert offices on re-run.
**Why it happens:** MD house used multi-member districts; the `generate_md_house.ps1` pattern looks similar.
**How to avoid:** Use `(district_id, chamber_id)` NOT EXISTS for VA — single-member like Oregon. Each district gets exactly 1 chamber_id+district_id combination.
**Warning signs:** Migration produces more than 100 office rows for House of Delegates.

### Pitfall 2: Lowercase state= for STATE_EXEC districts
**What goes wrong:** Inserting STATE_EXEC districts with `state='va'` (lowercase). Backend queries STATE_EXEC districts using uppercase postal codes. The executive's profile page returns no results.
**Why it happens:** TIGER loader uses lowercase for STATE_UPPER/STATE_LOWER. Habit carries over.
**How to avoid:** STATE_EXEC always uses uppercase `state='VA'`. This is the OR 223a lesson — it caused a production bug that needed a follow-up migration to fix.
**Warning signs:** Executive officials seeded but don't appear in address lookups.

### Pitfall 3: district_type omitted in senator/delegate district JOIN
**What goes wrong:** geo_ids 51001-51040 exist in BOTH `STATE_UPPER` and `STATE_LOWER` districts tables. A senator district JOIN without `AND d.district_type = 'STATE_UPPER'` produces 2 rows (one from each type), causing the CROSS JOIN to insert 2 offices per senator.
**Why it happens:** MD had 47 SLDU districts (none below 47 overlapped with SLDL), so the overlap was less dangerous. VA's overlap is 40 of 40 SLDU districts.
**How to avoid:** Always specify `district_type` in the district WHERE clause for both senators AND delegates.
**Warning signs:** Migration inserts 80 senator offices (2x40) instead of 40.

### Pitfall 4: Migration counter STATE.md says 293 (stale)
**What goes wrong:** Plan creates `293_va_government_chambers.sql` — collides with existing LA Wave 1 migration file `293_la_wave1_gap_fill_preflight.sql`.
**Why it happens:** STATE.md "Next migration: 293" was recorded before LA Wave 1 (293-299) was applied.
**How to avoid:** Start VA migrations at 300. Update STATE.md after each migration.
**Warning signs:** Migration filename conflicts in the directory.

### Pitfall 5: Missing `AND state = 'VA'` in government subquery
**What goes wrong:** Chamber subquery `WHERE name = 'State of Virginia'` could theoretically match West Virginia if name='State of West Virginia' exists (it does: UUID `74564736`). More importantly, if another state has a government row with a similar name.
**Why it happens:** OR migrations omit the `AND state = 'OR'` filter; MD added it as a lesson.
**How to avoid:** Always include `AND state = 'VA'` in the government subquery per MD 269/270 pattern.

---

## Code Examples

### Section-Split Check (already verified clean from Phase 100)

```sql
-- Source: Phase 100 verify-va-tiger-import.sql Gate 7 (already run)
SELECT gb.geo_id, gb.name, gb.mtfcc
FROM essentials.geofence_boundaries gb
WHERE gb.mtfcc IN ('G5200', 'G5210', 'G5220', 'G4020')
  AND gb.state = '51'
  AND gb.geo_id NOT IN (SELECT geo_id FROM essentials.districts)
LIMIT 10;
-- Expected: 0 rows (confirmed clean from Phase 100)
```

### Post-Phase Verification Queries

```sql
-- 1. Chambers count under State of Virginia
SELECT name FROM essentials.chambers c
JOIN essentials.governments g ON c.government_id = g.id
WHERE g.name = 'State of Virginia' AND g.state = 'VA';
-- Expected: 5 rows (Governor, Lieutenant Governor, Attorney General, Virginia Senate, House of Delegates)

-- 2. STATE_EXEC districts
SELECT label, state FROM essentials.districts
WHERE district_type = 'STATE_EXEC' AND state = 'VA';
-- Expected: 3 rows; all state='VA' uppercase

-- 3. Executives roster
SELECT p.full_name, o.title, o.is_appointed_position
FROM essentials.politicians p
JOIN essentials.offices o ON o.politician_id = p.id
WHERE p.external_id BETWEEN -510003 AND -510001;
-- Expected: Spanberger/Governor/false, Hashmi/LtGov/false, Jones/AG/false

-- 4. office_id back-fill check
SELECT COUNT(*) FROM essentials.politicians
WHERE external_id BETWEEN -510003 AND -510001 AND office_id IS NULL;
-- Expected: 0

-- 5. Senator count
SELECT COUNT(*) FROM essentials.offices o
JOIN essentials.chambers c ON o.chamber_id = c.id
JOIN essentials.governments g ON c.government_id = g.id
WHERE c.name = 'Virginia Senate' AND g.name = 'State of Virginia';
-- Expected: 40

-- 6. Delegate count (including 1 vacant)
SELECT COUNT(*) FROM essentials.offices o
JOIN essentials.chambers c ON o.chamber_id = c.id
JOIN essentials.governments g ON c.government_id = g.id
WHERE c.name = 'House of Delegates' AND g.name = 'State of Virginia';
-- Expected: 100

-- 7. HD-20 vacant check
SELECT p.full_name, p.is_vacant, p.is_active FROM essentials.politicians p
WHERE p.external_id = -5120020;
-- Expected: full_name='Vacant', is_vacant=true, is_active=false
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Named district_id for exec ('Oregon (Statewide)') | Empty string `''` for district_id | Phase 74 (OR 223a fix) | Routing correctness — empty string is the canonical multi-position statewide value |
| Lowercase state='or'/'va' for STATE_EXEC | Uppercase state='OR'/'VA' | Phase 74 (OR 223a fix) | Silent routing failure if lowercase |
| Multi-member NOT EXISTS (dist_id, poly_id) for MD house | Single-member NOT EXISTS (dist_id, chamber_id) for OR/VA house | MD Phase 93 | Correct model for single-member chambers |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Party assignments for HD-31 through HD-100 individual districts | Complete Rosters | Wrong party on politician profile; low-trust civic data; fix in headshot phase |
| A2 | Spanberger's first name is "Abigail" (not "Abby") for DB storage | Executives | Would mismatch public record searches; check official inauguration records |
| A3 | External_id scheme VA senate = -5110001..-5110040; VA house = -5120001..-5120100 | Production DB State | No collision with existing rows if assumption holds; verify with SELECT before inserting |

**A1 mitigation:** The complete 64D/35R total is confirmed from official sources. Individual district party can be spot-checked against Virginia Department of Elections results page before executing migration 303.

---

## Open Questions

1. **HD-20 party for district row:**
   - What we know: Maldonado was a Democrat; district is D-leaning
   - What's unclear: The vacant seat placeholder politician row has no party — is that correct or should party='Democrat' be stored on the placeholder?
   - Recommendation: Use same pattern as MD District 42A vacant (no party on vacant placeholder: `party=NULL` or `party=''`)

2. **Full names for executives — formal vs. common:**
   - What we know: Official title is "Abigail Spanberger", "Ghazala Hashmi", "Jay Jones"
   - What's unclear: Is "Jay Jones" the official legal name or is it "Jason E. Jones" or similar?
   - Recommendation: Verify against official Virginia AG office page before coding migration 301

3. **Senator name formatting — suffixes and middle initials:**
   - What we know: District list shows "Luther H. Cifers, III", "William M. Stanley, Jr."
   - What's unclear: Whether suffixes are stored in full_name or just last_name
   - Recommendation: Follow MD pattern — include in full_name and last_name fields (e.g., `full_name='William M. Stanley, Jr.', last_name='Stanley'`)

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| psql (DATABASE_URL) | All 4 migrations | ✓ | Used in all prior phases | — |
| PowerShell | generate_va_senate.ps1, generate_va_house.ps1 | ✓ | 5.1+ (Windows) | — |
| Node.js / tsx | _apply-migration-302/303.ts | ✓ | 24.13.0 | — |
| Production Supabase DB | All phases | ✓ | PostgreSQL 15.x | — |

---

## Validation Architecture

This phase is pure database seeding — no application code changes, no new API endpoints, no UI changes. Standard test suite is not applicable. Validation is via SQL verification queries run against production after each migration.

**Per-migration validation pattern:**
- Migration 300 (chambers): COUNT = 5 under State of Virginia; idempotency re-run = 0 new rows
- Migration 301 (executives): 3 STATE_EXEC districts state='VA'; 3 politicians; 3 offices; office_id NULL = 0; is_appointed_position = false for all 3
- Migration 302 (senators): COUNT = 40; NULL office_ids = 0; spot-check 3 districts
- Migration 303 (delegates): COUNT = 100; NULL office_ids = 0; HD-20 is_vacant=true; spot-check 3 districts

**Phase gate:** Section-split check returns 0 rows (already confirmed clean; re-run as final verification).

---

## Security Domain

This phase inserts public government data (politician names, district numbers, office titles). No auth endpoints, no user data, no PII beyond public officials' names and party affiliations.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | No | Static SQL with no user input |
| V2 Authentication | No | psql uses DATABASE_URL env var (existing pattern) |

No new threat surface introduced. All data is public record.

---

## Sources

### Primary (HIGH confidence)
- Production Supabase DB — queried directly 2026-06-08; VA government row, districts, geofence_boundaries, existing politicians all confirmed
- `C:/EV-Accounts/backend/migrations/269_md_government_chambers.sql` — exact analog for chambers migration
- `C:/EV-Accounts/backend/migrations/270_md_state_executives.sql` — exact analog for executives migration
- `C:/EV-Accounts/backend/migrations/generate_md_senate.ps1` — exact analog for senators generator
- `C:/EV-Accounts/backend/migrations/generate_or_house.ps1` — exact analog for delegates generator (single-member)
- `apps.senate.virginia.gov/Senator/districtdesclist.php` — all 40 VA senator names by district [VERIFIED]
- `house.vga.virginia.gov/members` — all 100 VA delegate names by district [VERIFIED]
- `en.wikipedia.org/wiki/Virginia_Senate` — senator party affiliations D21/R19 [VERIFIED]
- Phase 100 SUMMARY files — VA geofence production state confirmed (511 rows, 40 SLDU, 100 SLDL)

### Secondary (MEDIUM confidence)
- `potomaclocal.com/2026/05/05/manassas-delegate-michelle-maldonado-resigns-from-virginia-house/` — HD-20 vacancy confirmed [CITED]
- `democrats.org` — SD-39 Bennett-Parker won special election Feb 10, 2026 [CITED]
- `thezebra.org/2026/02/10/alexandria-special-elections-bennett-parker-mcpike/` — HD-5 McPike replacement confirmed [CITED]

### Tertiary (LOW confidence — needs validation)
- Individual party assignments for HD-31 through HD-100 delegates — derived from overall 64D/36R result + Wikipedia partial district-by-district tables; not confirmed from a single per-district authoritative source [ASSUMED — A1]
- "Jay Jones" as the official stored name for the Attorney General [ASSUMED — A3]

---

## Metadata

**Confidence breakdown:**
- DB state (production): HIGH — directly queried
- Standard stack (patterns): HIGH — exact analogs identified in existing migration files
- Rosters: HIGH (senators: verified from official Senate site + Wikipedia); MEDIUM (delegates: names HIGH from official site, party assignments ASSUMED for districts 31-100)
- Pitfalls: HIGH — all drawn from documented execution failures in prior phases (OR 223a, MD 93-03)
- Migration counter: HIGH — confirmed by directory listing (293-299 files exist; 300 is next)

**Research date:** 2026-06-08
**Valid until:** 2026-09-08 (rosters stable; VA Senate terms run through 2027; delegates through 2027 unless special elections)
