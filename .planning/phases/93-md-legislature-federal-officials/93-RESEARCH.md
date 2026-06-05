# Phase 93: MD Legislature + Federal Officials - Research

**Researched:** 2026-06-05
**Domain:** PostgreSQL DB seeding — Maryland state legislature + federal officials
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Multi-Member Delegate District Modeling**
- D-01: For "whole" SLDL districts (29 districts), create 3 office rows all titled 'Delegate' linked to the same district_id. No positional labels.
- D-02: For A/B-split districts (12 districts: 2,7,9,11,12,30,34,35,37,43,44,47): researcher must verify 2 vs 3 delegates per parent district. **RESOLVED: 3 delegates each (2+1 split across subdistricts).**
- D-03: For A/B/C-split districts (6 districts: 1,27,29,33,38,42): 1 office per subdistrict row, title='Delegate'.
- D-04: DB has 71 SLDL rows. Math: 29×3 + 6×3 + 12×3 = 87+18+36 = **141. Confirmed correct.**

**Headshot Scope**
- D-05: Best-effort inline headshots. Phase 93 complete when politicians seeded + headshots attempted. Phase 94 enforces 100%.
- D-06: Headshot plans split by chamber: senators first (Plan 93-05), delegates second (Plan 93-06).

**Migration Wave Structure**
- D-07: 4 seeding migrations: 272 (chambers), 273 (senators), 274 (delegates), 275 (federal).
- D-08: Migration 272 includes pre-flight assertions + inserts any missing parent STATE_LOWER rows if D-02 requires it. **D-02 resolved: no parent rows needed.**

**Federal Officials**
- D-09: Use existing shared federal chambers. Do NOT create state-specific federal chambers.
- D-10: Van Hollen = senior senator. Alsobrooks = junior senator.

### Claude's Discretion

- External ID numbering: senators -2410001..-2410047, delegates -2420001..-2420141, US senators -2430001..-2430002, US House -2440001..-2440008. Verify no collision with -240001..-240005.
- MD legislative chamber naming: `name='Maryland Senate'`, `name_formal='Maryland State Senate'`; `name='Maryland House of Delegates'`, `name_formal='Maryland House of Delegates'`.
- Generator script structure: PowerShell generators following OR pattern.
- Office back-fill UPDATE at end of each officials migration.
- Smoke test query at end of each migration.

### Deferred Ideas (OUT OF SCOPE)

None.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MD-GOV-03 | MD State Senate chamber + 47 senators seeded with offices linked to SLDU district boundaries | 47 senators verified on mgaleg.maryland.gov; SLDU geo_id format confirmed; chamber pattern from migration 222/269 |
| MD-GOV-04 | MD House of Delegates chamber + 141 delegates seeded with offices linked to SLDL boundaries; multi-member structure handled | 141 positions confirmed (140 seated + 1 vacant district 42A); A/B=3 delegates resolved; SLDL geo_ids confirmed from DB |
| MD-GOV-05 | 2 US senators + 8 US House reps seeded with correct districts | Van Hollen + Alsobrooks already seeded (ext -400033/-400034); 8 House reps confirmed; federal chamber UUIDs verified in DB |
| MD-GOV-06 | All MD officials have headshots at 600×750 | mgaleg.maryland.gov /2026RS/images/[lastname][num].jpg pattern confirmed; best-effort inline in Phase 93 |

</phase_requirements>

---

## Summary

Phase 93 seeds the Maryland General Assembly (Maryland Senate + Maryland House of Delegates chambers, 47 senators, 141 delegates) and handles 10 federal officials (2 US senators already pre-seeded + 8 US House reps to insert). All migration templates exist in C:/EV-Accounts/backend/migrations and follow established PowerShell-generator patterns from Oregon (Phase 73/74/75) and Maine (Phase 51).

The single most important pre-planning question — whether A/B-split SLDL districts elect 2 or 3 delegates — is now resolved: **every A/B parent district elects 3 delegates (2 from one subdistrict, 1 from the other)**. This means the 71 existing SLDL rows cover all 141 delegate positions with no parent STATE_LOWER rows needed. Migration 272 is chambers-only.

A significant surprise: both US senators (Van Hollen and Alsobrooks) are **already fully seeded** in the DB with correct NATIONAL_UPPER district, correct chamber_id, and office_id back-filled (external_ids -400033 and -400034). Migration 275 needs only the 8 US House reps. The pre-flight check in migration 275 should assert both senators already exist rather than inserting them.

**Primary recommendation:** Follow the OR PowerShell generator pattern exactly, adapting geo_id construction for MD's 5-character format (`24001`, `2402A`). The multi-member delegate generator is the only genuinely new pattern — use a loop that emits 3 CTE blocks per whole district, and be explicit about NOT EXISTS guard on `politician_id` (not district_id) to allow multiple offices per district.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Politician + office seeding | Database (PostgreSQL/Supabase) | — | Pure DB seeding; no UI or API changes |
| Chamber creation (272) | Database | — | One-time structural DDL equivalent |
| Generator scripts | Backend tooling (PowerShell) | — | Produces SQL; not deployed code |
| Headshot download + resize | Bash/Python script | Supabase Storage | mgaleg.maryland.gov → 600×750 JPEG → storage |
| Headshot DB record | Database | — | politician_images rows |

---

## Standard Stack

No new packages. This phase uses the established project stack: PostgreSQL (Supabase), PowerShell scripts (SQL generation), Python/PIL (headshot resize), Supabase Storage (photo upload).

### Package Legitimacy Audit

No external packages are installed in this phase. Existing dependencies (PIL/Pillow, psycopg2/pg client) are already installed.

---

## Architecture Patterns

### System Architecture Diagram

```
mgaleg.maryland.gov
  ├─ /mgawebsite/Members/Index/senate  ── senator roster (47) ──────────┐
  └─ /mgawebsite/Members/Index/house   ── delegate roster (141) ─────────┤
                                                                          ▼
PowerShell generator scripts                                     SQL migration files
  generate_md_senate.ps1  ────────────────── 273_md_state_senators.sql ──┐
  generate_md_house.ps1   ────────────────── 274_md_delegates.sql ────────┤
  (hand-written)          ────────────────── 272_md_legislative_chambers.sql
  (hand-written)          ────────────────── 275_md_federal_officials.sql  │
                                                                           ▼
mcp__supabase-local__apply_migration ──────────── Supabase DB (production)
  essentials.chambers  (2 new rows: Maryland Senate + Maryland House of Delegates)
  essentials.politicians  (47 senators + 141 delegates)
  essentials.offices      (47 + 141 + 8 = 196 new rows)

mgaleg.maryland.gov/2026RS/images/[lastname][num].jpg
  └── Python PIL → crop 4:5 → resize 600×750 → Supabase Storage: politician_photos/
      └── essentials.politician_images (1 row per seeded politician, type='default')
```

### Recommended File Structure
```
C:/EV-Accounts/backend/migrations/
├── 272_md_legislative_chambers.sql    # Chambers (hand-written)
├── generate_md_senate.ps1             # Generates 273
├── 273_md_state_senators.sql          # Generated
├── generate_md_house.ps1              # Generates 274 (multi-member logic)
├── 274_md_delegates.sql               # Generated
└── 275_md_federal_officials.sql       # US House reps (hand-written)
```

### Pattern 1: Chamber Insert (Migration 272)
**What:** Insert Maryland Senate and Maryland House of Delegates under State of Maryland government.
**When to use:** Migration 272 only.
**Example:**
```sql
-- Source: 269_md_government_chambers.sql (project codebase)
-- Pre-flight assert: exactly 1 'State of Maryland' govt row
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name = 'State of Maryland' AND state = 'MD') <> 1 THEN
    RAISE EXCEPTION 'Pre-flight failed: expected 1 State of Maryland row; found %',
      (SELECT COUNT(*) FROM essentials.governments
       WHERE name = 'State of Maryland' AND state = 'MD');
  END IF;
END $$;

-- Also assert: no Maryland Senate or House of Delegates chamber exists yet
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.chambers c
      JOIN essentials.governments g ON g.id = c.government_id
      WHERE g.name = 'State of Maryland'
        AND c.name IN ('Maryland Senate', 'Maryland House of Delegates')) <> 0 THEN
    RAISE EXCEPTION 'Pre-flight failed: MD legislative chambers already exist';
  END IF;
END $$;

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
```
Note: `slug` is GENERATED ALWAYS — never include in INSERT. [VERIFIED: 269_md_government_chambers.sql]

### Pattern 2: Senator CTE Block (Migration 273 generator)
**What:** One CTE block per senator — politician INSERT + office INSERT.
**When to use:** 47 times in generate_md_senate.ps1.
**Example:**
```powershell
# Source: generate_or_senate.ps1 (project codebase, adapted for MD)
function SenatorBlock($r) {
    $f  = EscSql $r.full
    $fn = EscSql $r.first
    $ln = EscSql $r.last
    $gid = '24' + ([int]$r.dist).ToString().PadLeft(3, '0')  # e.g. dist=1 -> '24001'
@"
-- ===== SD-$($r.dist) ($gid): $($r.full) =====
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), '$f', '$fn', '$ln', '$($r.party)',
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
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
"@
}
```
CRITICAL: `d.state = 'md'` lowercase — TIGER loader casing for STATE_UPPER/STATE_LOWER. [VERIFIED: project codebase]
CRITICAL: `district_type = 'STATE_UPPER'` — geo_ids 24001-24047 exist in BOTH STATE_UPPER and STATE_LOWER; omitting district_type causes ambiguous subquery. [VERIFIED: DB query]

### Pattern 3: Multi-Member Delegate CTE Block (Migration 274 generator)
**What:** For whole SLDL districts: 3 CTE blocks per district, same geo_id, different external_id.
For subdistrict rows: 1 CTE block per subdistrict row (A/B, A/B/C).
**When to use:** generate_md_house.ps1.
**NOT EXISTS guard:** Must guard by `(district_id, politician_id)` NOT by `(district_id, chamber_id)` — the latter would block the 2nd and 3rd office inserts for the same whole district.
**Example:**
```powershell
# Whole district block (3 per district, same $gid different $extId)
function DelegateBlock($r) {
    $f   = EscSql $r.full
    $fn  = EscSql $r.first
    $ln  = EscSql $r.last
    $gid = $r.geo_id  # pre-computed: '24' + dist.PadLeft(3,'0') for whole; '24' + dist.PadLeft(2,'0') + letter for sub
@"
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), '$f', '$fn', '$ln', '$($r.party)',
          $($r.is_vacant.ToString().ToLower()), false, $($r.is_vacant.ToString().ToLower()),
          $((! $r.is_vacant).ToString().ToLower()), $($r.ext_id))
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
       'Delegate', 'MD', false, $($r.is_vacant.ToString().ToLower())
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
[ASSUMED — new pattern, derived from CONTEXT.md D-01 decision + CONTEXT.md code_context "New Pattern" section]

### Pattern 4: Federal Officials (Migration 275)
**What:** US senators already seeded (pre-flight assert); seed 8 US House reps using shared chamber.
**When to use:** Migration 275.
**Example:**
```sql
-- Source: 170_me_federal_officials.sql (project codebase, adapted for MD)
-- Pre-flight: assert Van Hollen (-400033) and Alsobrooks (-400034) already exist
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.politicians
      WHERE external_id IN (-400033, -400034)) <> 2 THEN
    RAISE EXCEPTION 'Pre-flight failed: MD US senators not found; check external_ids -400033/-400034';
  END IF;
END $$;

-- US House rep: Andy Harris, MD-01, geo_id='2401'
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
   is_appointed_position, is_vacant)
SELECT gen_random_uuid(),
       d.id,
       'c2facc31-7b13-428c-b7b9-32d0d3b95f76',   -- U.S. House of Representatives
       p.id,
       'U.S. Representative', 'MD', false, false
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '2401' AND d.district_type = 'NATIONAL_LOWER' AND d.state = 'MD'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.chamber_id = 'c2facc31-7b13-428c-b7b9-32d0d3b95f76'
  );
```
[VERIFIED: 170_me_federal_officials.sql pattern; chamber UUIDs verified in production DB]

### Anti-Patterns to Avoid
- **NOT EXISTS on `(district_id, chamber_id)` for multi-member districts:** This blocks insertion of the 2nd and 3rd delegate office for whole districts. Use `(district_id, politician_id)` instead.
- **Omitting `district_type` in district lookup:** geo_ids 24001–24047 exist in BOTH STATE_UPPER and STATE_LOWER — always include `AND district_type = 'STATE_UPPER'` (senators) or `AND district_type = 'STATE_LOWER'` (delegates).
- **Omitting `AND p.id IS NOT NULL`:** The `CROSS JOIN ins_p` returns 0 rows on a DO NOTHING conflict — without the IS NOT NULL guard, the office INSERT attempts against a null politician_id, which may silently skip or error.
- **Including `slug` in chambers INSERT:** `slug` is `GENERATED ALWAYS` — any attempt to set it causes a PostgreSQL error.
- **Inserting Van Hollen or Alsobrooks:** Both are already seeded (external_ids -400033/-400034) with fully working offices. Insertion would hit ON CONFLICT DO NOTHING silently — but the office INSERT would also no-op since it guards by (district_id, politician_id). Safe but wasteful; better to assert pre-existence and skip.

---

## Critical Verified Facts

### Delegate A/B District Resolution (D-02 RESOLVED)
**Finding:** Each of the 12 A/B-split parent districts elects **3 delegates total** — 2 from one subdistrict and 1 from the other. [VERIFIED: mgaleg.maryland.gov/mgawebsite/Members/Index/house, 2026-06-02 roster]

**Consequence for D-04:** No parent STATE_LOWER rows needed. The 71 existing SLDL rows cover all 141 delegate positions.

| Category | Districts | Rows in DB | Offices per parent | Total offices |
|----------|-----------|------------|-------------------|---------------|
| Whole districts | 29 (3,4,5,6,8,10,13...) | 29 | 3 (same geo_id) | 87 |
| A/B/C subdistricts | 6 (1,27,29,33,38,42) | 18 (3 each) | 1 per subdistrict | 18 |
| A/B subdistricts | 12 (2,7,9,11,12,30...) | 24 (2 each) | 1-2 per subdistrict (sums to 3) | 36 |
| **Total** | **47 parent districts** | **71 SLDL rows** | — | **141** |

### Vacant Seat: District 42A [VERIFIED: mgaleg.maryland.gov, 2026-06-02]
District 42A has a vacant seat. The delegate generator must emit a vacant politician row for this seat:
- `is_active=false, is_appointed=false, is_vacant=true, is_incumbent=false`
- `full_name='Vacant'` or similar placeholder, or a named politician row if one is being appointed
- The office row must have `is_vacant=true`

### Pre-Existing US Senators [VERIFIED: production DB query]
Both Maryland US senators are already fully seeded:
- Chris Van Hollen: `external_id=-400033`, office linked to NATIONAL_UPPER geo_id='24', chamber_id=`7cbe07bc-84b8-433b-952b-540e7de18a92`
- Angela Alsobrooks: `external_id=-400034`, same district and chamber
- Both have `office_id` back-filled. Migration 275 must NOT insert them; instead assert they exist.

### DB District Counts [VERIFIED: production DB query, 2026-06-05]
| district_type | state | count | Expected |
|--------------|-------|-------|---------|
| STATE_UPPER | md | 47 | 47 ✓ |
| STATE_LOWER | md | 71 | 71 ✓ |
| NATIONAL_LOWER | MD | 8 | 8 ✓ |
| NATIONAL_UPPER | MD | 1 | 1 ✓ (geo_id='24') |
| STATE_EXEC | MD | 5 | 5 ✓ |
| COUNTY | md | 24 | 24 ✓ |

### Federal Chamber UUIDs [VERIFIED: production DB query]
- `U.S. Senate` = `7cbe07bc-84b8-433b-952b-540e7de18a92`
- `U.S. House of Representatives` = `c2facc31-7b13-428c-b7b9-32d0d3b95f76`

These match the UUIDs hardcoded in 170_me_federal_officials.sql — no lookup needed.

### NATIONAL_LOWER geo_ids for MD [VERIFIED: production DB query]
`2401` (CD-1 Harris), `2402` (CD-2 Olszewski), `2403` (CD-3 Elfreth), `2404` (CD-4 Ivey), `2405` (CD-5 Hoyer), `2406` (CD-6 Delaney), `2407` (CD-7 Mfume), `2408` (CD-8 Raskin)

### Migration Counter [VERIFIED: directory listing of C:/EV-Accounts/backend/migrations]
Last migration file: `271_md_executive_headshots.sql`. Next migration: **272**. STATE.md is correct.

### SLDU Geo_id Format [VERIFIED: production DB query]
`'24' + dist.PadLeft(3,'0')` — e.g., district 1 → `24001`, district 47 → `24047`

### SLDL Geo_id Formats [VERIFIED: production DB query]
- Whole districts: `'24' + dist.PadLeft(3,'0')` — e.g., district 3 → `24003`, district 46 → `24046`
- A/B/C subdistricts: `'24' + dist.PadLeft(2,'0') + letter` — e.g., `2401A`, `2401B`, `2401C`, `2402A`, `2402B`

### Headshot URL Pattern [VERIFIED: mgaleg.maryland.gov/mgawebsite/Members/Index/senate and /house]
Pattern: `https://mgaleg.maryland.gov/2026RS/images/[lastname][optional_num].jpg`
- Most use lowercase lastname + two-digit suffix: `ferguson01.jpg`, `mckay02.jpg`, `ready01.jpg`
- Some use no suffix: `jennings.jpg`, `ferguson.jpg`
- Disambiguation: when multiple people share a last name, suffixes like `01`, `02` distinguish them
- Examples: `johnson01.jpg`, `johnson02.jpg` (two delegates named Johnson in district 34A)

---

## Current Incumbents

### 47 MD State Senators [VERIFIED: mgaleg.maryland.gov, Last Updated 2026-06-02]

| Dist | Full Name | Dist | Full Name |
|------|-----------|------|-----------|
| 1 | Mike McKay | 25 | Nick Charles |
| 2 | Paul D. Corderman | 26 | C. Anthony Muse |
| 3 | Karen Lewis Young | 27 | Kevin M. Harris |
| 4 | William G. Folden | 28 | Arthur Ellis |
| 5 | Justin Ready | 29 | Jack Bailey |
| 6 | Johnny Ray Salling | 30 | Shaneka Henson |
| 7 | J.B. Jennings | 31 | Bryan W. Simonaire |
| 8 | Carl Jackson | 32 | Pamela Beidle |
| 9 | Katie Fry Hester | 33 | Dawn Gile |
| 10 | Benjamin Brooks | 34 | Mary-Dulany James |
| 11 | Shelly Hettleman | 35 | Jason C. Gallion |
| 12 | Clarence K. Lam | 36 | Stephen S. Hershey, Jr. |
| 13 | Guy Guzzone | 37 | Johnny Mautz |
| 14 | Craig J. Zucker | 38 | Mary Beth Carozza |
| 15 | Brian J. Feldman | 39 | Nancy J. King |
| 16 | Sara Love | 40 | Antonio Hayes |
| 17 | Cheryl C. Kagan | 41 | Dalya Attar |
| 18 | Jeff Waldstreicher | 42 | Chris West |
| 19 | Benjamin F. Kramer | 43 | Mary Washington |
| 20 | William C. Smith, Jr. | 44 | Charles E. Sydnor, III |
| 21 | Jim Rosapepe | 45 | Cory V. McCray |
| 22 | Alonzo T. Washington | 46 | Bill Ferguson (President of Senate) |
| 23 | Ron Watson | 47 | Malcolm Augustine |
| 24 | Joanne C. Benson | | |

No vacant Senate seats. [VERIFIED: mgaleg.maryland.gov]

### 8 MD US House Representatives [VERIFIED: web search cross-referenced with house.gov sites, 2026-06-05]

| Dist | Full Name | Party | geo_id |
|------|-----------|-------|--------|
| 1 | Andy Harris | Republican | 2401 |
| 2 | Johnny Olszewski | Democrat | 2402 |
| 3 | Sarah Elfreth | Democrat | 2403 |
| 4 | Glenn Ivey | Democrat | 2404 |
| 5 | Steny Hoyer | Democrat | 2405 |
| 6 | April McClain Delaney | Democrat | 2406 |
| 7 | Kweisi Mfume | Democrat | 2407 |
| 8 | Jamie Raskin | Democrat | 2408 |

7 Democrats, 1 Republican. [VERIFIED: nbcnews.com 2024 results + olszewski.house.gov + mcclaindelaney.house.gov + mfume.house.gov]

### 2 MD US Senators [VERIFIED: vanhollen.senate.gov + production DB]
- **Chris Van Hollen** (Senior) — Democrat, external_id=-400033, already seeded
- **Angela Alsobrooks** (Junior) — Democrat, external_id=-400034, already seeded (took office Jan 2025, replaced Ben Cardin who retired)

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-CTE SQL generation | Hand-write 47+141 CTE blocks | PowerShell generator .ps1 | Human error rate at scale; generators are re-runnable |
| Headshot resize | PIL one-off commands | Established find-headshots.md workflow | Already handles 4:5 crop, 600×750 resize, Supabase upload, license tracking |
| Office uniqueness check | Custom logic | `AND NOT EXISTS (SELECT 1 FROM offices WHERE district_id=d.id AND politician_id=p.id)` | This exact pattern tested in OR/ME migrations |
| District ID lookup | Hardcode UUID | Sub-SELECT on geo_id + district_type + state | UUIDs change per environment; sub-select is environment-safe |
| Chamber ID lookup in migration 275 | Hardcode UUID | Hardcode is fine for shared federal chambers | UUIDs confirmed stable in production DB |

---

## Common Pitfalls

### Pitfall 1: District Type Ambiguity (CRITICAL)
**What goes wrong:** Omitting `district_type` in the WHERE clause for district lookups causes a "more than one row returned by subquery" error because geo_ids 24001–24047 exist in BOTH STATE_UPPER and STATE_LOWER tables.
**Why it happens:** OR had the same issue — geo_ids 41001–41030 exist in both tiers. MD has the same overlap.
**How to avoid:** Always include `AND d.district_type = 'STATE_UPPER'` for senators, `AND d.district_type = 'STATE_LOWER'` for delegates. Include `AND d.state = 'md'` (lowercase) for both.
**Warning signs:** Migration error "more than one row returned by subquery used as an expression."

### Pitfall 2: Multi-Member NOT EXISTS Guard
**What goes wrong:** Using `NOT EXISTS (... WHERE o.district_id = d.id AND o.chamber_id = ...)` for delegate offices blocks the 2nd and 3rd office inserts for the same whole district, because the 1st insert satisfies the guard.
**Why it happens:** Standard 1:1 pattern is (district_id, chamber_id) uniqueness. Multi-member breaks this assumption.
**How to avoid:** Use `NOT EXISTS (... WHERE o.district_id = d.id AND o.politician_id = p.id)`. Each politician can only have one office per district — this is the correct guard for multi-member.
**Warning signs:** Generator outputs 3 CTE blocks for a whole district but only 1 office is inserted.

### Pitfall 3: Inserting Pre-Existing US Senators
**What goes wrong:** Migration 275 inserts Van Hollen/Alsobrooks as new rows, creating duplicate politician records.
**Why it happens:** The OR pattern had pre-existing senators (Wyden/Merkley) too. The research step always checks for pre-existing federal officials.
**How to avoid:** Migration 275 includes a pre-flight assertion that both senators exist, and skips their INSERT. The 8 House reps are the only NEW politicians in migration 275.
**Warning signs:** The ON CONFLICT DO NOTHING guard on external_id would prevent duplicate politicians, but if external_ids -400033/-400034 are not used in migration 275, new conflicting rows might be inserted with different external_ids.

### Pitfall 4: SLDL/SLDU Geo_id Construction for Double-Digit Districts
**What goes wrong:** District 30 whole → `24030` (5 digits, correct). Subdistrict 30A → `2430A` (5 chars, correct). But 2-digit padding for subdistricts: `'24' + '30'.PadLeft(2,'0') + 'A' = '2430A'`. This is correct. Confusion arises because whole districts use PadLeft(3) but subdistricts use PadLeft(2).
**How to avoid:** Separate the two cases in the generator:
- Whole district: `$gid = '24' + ([int]$r.dist).ToString().PadLeft(3, '0')`
- Subdistrict: `$gid = '24' + ([int]$r.dist).ToString().PadLeft(2, '0') + $r.sub` (where sub is 'A', 'B', or 'C')

### Pitfall 5: SLDL State Casing
**What goes wrong:** Using `d.state = 'MD'` (uppercase) for SLDL/SLDU queries returns 0 rows.
**Why it happens:** TIGER loader writes STATE_UPPER/STATE_LOWER with lowercase state abbreviation (`md`), but NATIONAL_UPPER/NATIONAL_LOWER and STATE_EXEC use uppercase (`MD`). The 270_md_state_executives.sql explicitly notes this and cites the OR 223a fix.
**How to avoid:** STATE tiers → `d.state = 'md'`; NATIONAL and EXEC tiers → `d.state = 'MD'`.

### Pitfall 6: slug in Chambers INSERT
**What goes wrong:** Including `slug` in the INSERT column list causes a PostgreSQL error: "cannot insert into column 'slug'."
**Why it happens:** `slug` is `GENERATED ALWAYS AS` on essentials.chambers. PostgreSQL rejects explicit writes to GENERATED ALWAYS columns.
**How to avoid:** Never include `slug` in the INSERT column list. [VERIFIED: 269_md_government_chambers.sql header comment]

### Pitfall 7: PowerShell Unicode Encoding
**What goes wrong:** Non-ASCII characters in delegate names (e.g., accented characters in names like José, Ashanti with special chars) are silently mangled if hardcoded as literals in .ps1 files.
**Why it happens:** PowerShell 5.1 reads .ps1 files as ANSI codepage. UTF-8 saved characters are decoded as ANSI.
**How to avoid:** Use `[char]0xNNNN` escape sequences for any non-ASCII characters. [VERIFIED: generate_or_house.ps1 comments]
**Relevant MD delegates:** Check the full roster for accented characters. Joseline Peña-Melnyk (ñ = `[char]0x00F1`, hyphen is ASCII-safe). Gabriel Acevero, Valentín... review roster carefully.

### Pitfall 8: Vacant Seat (District 42A)
**What goes wrong:** Skipping district 42A entirely results in no office row for that subdistrict, causing downstream issues in Phase 96 (elections need an office to reference).
**How to avoid:** Create a vacant politician row (`is_vacant=true, is_active=false, is_incumbent=false`) and link it to a vacant office row (`is_vacant=true`). This is the established pattern for vacant seats.

---

## Code Examples

### Geo_id Construction Reference

```powershell
# Source: generate_or_senate.ps1 + DB geo_id verification (2026-06-05)

# Senator (STATE_UPPER): '24' + 3-digit padded number
$gid = '24' + ([int]$r.dist).ToString().PadLeft(3, '0')
# dist=1  -> '24001'
# dist=20 -> '24020'
# dist=47 -> '24047'

# Delegate whole district (STATE_LOWER): same format as senator
$gid = '24' + ([int]$r.dist).ToString().PadLeft(3, '0')
# dist=3  -> '24003'
# dist=46 -> '24046'

# Delegate subdistrict (A/B, A/B/C): '24' + 2-digit padded + letter
$gid = '24' + ([int]$r.dist).ToString().PadLeft(2, '0') + $r.sub
# dist=1,  sub='A' -> '2401A'
# dist=2,  sub='A' -> '2402A'
# dist=2,  sub='B' -> '2402B'
# dist=30, sub='A' -> '2430A'
# dist=42, sub='C' -> '2442C'
```

### External ID Ranges

```
# Source: CONTEXT.md Claude's Discretion + collision check vs existing -240001..-240005
#
# MD executive execs (existing, DO NOT COLLIDE):
#   -240001 (Gov Moore) through -240005 (Treasurer Davis)
#
# MD state senators (migration 273):
#   -2410001 (SD-01 McKay) through -2410047 (SD-47 Augustine)
#   Range: -2410047 to -2410001
#
# MD delegates (migration 274):
#   -2420001 through -2420141
#   Range: -2420141 to -2420001
#   Note: assign sequentially by district order within delegate roster
#
# US senators (ALREADY SEEDED — DO NOT REASSIGN):
#   -400033 (Van Hollen), -400034 (Alsobrooks)
#
# MD US House reps (migration 275):
#   -2440001 (CD-01 Harris) through -2440008 (CD-08 Raskin)
#   Range: -2440008 to -2440001
#
# Collision check: -2410xxx, -2420xxx, -2440xxx do not overlap with -240001..-240005 ✓
```

### Office ID Back-fill Pattern

```sql
-- Source: 270_md_state_executives.sql (project codebase)
-- Run at end of each officials migration, scoped to that migration's external_id range

-- After migration 273 (senators):
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -2410047 AND -2410001
  AND p.office_id IS NULL;

-- After migration 274 (delegates):
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -2420141 AND -2420001
  AND p.office_id IS NULL;

-- After migration 275 (US House reps):
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -2440008 AND -2440001
  AND p.office_id IS NULL;
```

### Smoke Test Queries

```sql
-- After migration 272: verify 2 new legislative chambers
SELECT name, name_formal FROM essentials.chambers c
JOIN essentials.governments g ON g.id = c.government_id
WHERE g.name = 'State of Maryland'
  AND c.name IN ('Maryland Senate', 'Maryland House of Delegates');
-- Expected: 2 rows

-- After migration 273: verify 47 senators
SELECT COUNT(*) FROM essentials.offices o
JOIN essentials.chambers c ON c.id = o.chamber_id
WHERE c.name = 'Maryland Senate' AND o.representing_state = 'MD';
-- Expected: 47

-- After migration 274: verify 141 delegate offices
SELECT COUNT(*) FROM essentials.offices o
JOIN essentials.chambers c ON c.id = o.chamber_id
WHERE c.name = 'Maryland House of Delegates' AND o.representing_state = 'MD';
-- Expected: 141 (140 active + 1 vacant)

-- After migration 275: verify 8 House reps + confirm senators unchanged
SELECT COUNT(*) FROM essentials.offices o
WHERE o.chamber_id = 'c2facc31-7b13-428c-b7b9-32d0d3b95f76'
  AND o.representing_state = 'MD';
-- Expected: 8

-- Section split check (run after all seeding migrations)
-- Flags any districts where only some government_bodies are covered
SELECT COUNT(*) FROM essentials.offices o
JOIN essentials.districts d ON d.id = o.district_id
WHERE d.state IN ('md', 'MD') AND o.representing_state = 'MD'
GROUP BY d.district_type;
```

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Multi-member delegate NOT EXISTS guard uses (district_id, politician_id) not (district_id, chamber_id) | Architecture Patterns - Pattern 3 | 2nd/3rd offices in whole districts would silently not insert; 141 target not reached |
| A2 | 'Maryland State Senate' is the correct name_formal for the Senate chamber | Standard Stack / Chamber naming | Wrong formal name — cosmetically wrong but non-blocking |
| A3 | 8 US House reps listed are current 119th Congress incumbents as of June 2026 | Current Incumbents table | Wrong rep seeded for a district — requires corrective migration |
| A4 | External ID ranges -2410xxx/-2420xxx/-2440xxx do not collide with other pre-existing external_ids | Code Examples | Collision on external_id causes ON CONFLICT DO NOTHING to silently skip politician inserts |

Note on A1: The pattern derives from CONTEXT.md's documented code insight ("NOT EXISTS guard on office insert must account for multiple offices per district"). This is the stated intended design, not an assumption. Marking [ASSUMED] because no existing migration has used this pattern yet in the project.

Note on A3: Steny Hoyer (MD-05) has served since 1981. Verify he has not announced retirement before seeding — he is 84 years old and known to be considering retirement. [ASSUMED based on training knowledge — should verify current status on house.gov before finalizing migration 275].

---

## Open Questions (RESOLVED)

1. **Steny Hoyer MD-05 retirement status** (RESOLVED: Verified at Plan 93-04 Task 1 execution via WebFetch before seeding; seeding deferred until confirmed at runtime.)
   - What we know: Hoyer re-elected 2024 per NBC results; currently serving.
   - What's unclear: Hoyer announced in late 2024 he would not seek re-election in 2026, but has not vacated mid-term. He should still be the current incumbent as of June 2026.
   - Recommendation: Confirm via house.gov/hoyer or news search before writing migration 275. If he has vacated mid-term (unlikely but possible), identify the replacement.

2. **District 42A vacant seat — named replacement?** (RESOLVED: Verified at Plan 93-03 Task 1 execution via mgaleg.maryland.gov roster check.)
   - What we know: District 42A shows as vacant on mgaleg.maryland.gov (as of 2026-06-02).
   - What's unclear: Whether a special election or appointment has since filled the seat.
   - Recommendation: Check mgaleg.maryland.gov at migration execution time (not research time). If still vacant, seed with `is_vacant=true` placeholder.

3. **Senator/Delegate external_id assignment ordering for delegates** (RESOLVED: Order by district number ascending, then subdistrict letter, then alphabetically by name.)
   - What we know: CONTEXT.md says -2420001 through -2420141.
   - What's unclear: Whether to assign sequentially by district number (1A, 1B, 1C, 2A, 2B, 3, 3, 3...) or alphabetically by name.
   - Recommendation: Assign by district number ascending, then by subdistrict letter, then by name for multiple delegates in same whole district. This ensures stable ordering independent of name changes.

---

## Validation Architecture

### Test Framework
This phase is pure DB seeding — no application code changes. No unit/integration test framework applies.

| Property | Value |
|----------|-------|
| Framework | None (DB seeding only) |
| Config file | N/A |
| Quick validation | Smoke test SQL queries (see Code Examples) |
| Full validation | Row count checks + section split check |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MD-GOV-03 | 47 senators seeded with correct districts | SQL count | `SELECT COUNT(*) FROM offices WHERE chamber_name='Maryland Senate'` = 47 | Run post-273 |
| MD-GOV-04 | 141 delegate offices seeded | SQL count | `SELECT COUNT(*) FROM offices WHERE chamber_name='Maryland House of Delegates'` = 141 | Run post-274 |
| MD-GOV-05 | 8 House reps seeded; 2 senators pre-verified | SQL count | `SELECT COUNT(*) FROM offices WHERE chamber_id='c2facc31...' AND representing_state='MD'` = 8 | Run post-275 |
| MD-GOV-06 | Headshots best-effort | Manual inspect | Count politician_images rows for MD politicians | Post headshot plans |

### Wave 0 Gaps
None — test infrastructure is SQL queries, no test files needed.

---

## Security Domain

This phase performs no authentication, input validation, or session management. It applies parameterized SQL via the established migration pattern. No ASVS categories apply to DB seeding migrations.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase DB (production) | All migrations | ✓ | Supabase managed | — |
| Node.js + pg client | DB queries | ✓ | confirmed in EV-Accounts | — |
| PowerShell | Generator scripts | ✓ | Windows native 5.1 | — |
| Python + PIL | Headshot resize | ✓ | confirmed in prior phases | — |
| mgaleg.maryland.gov | Headshot images | ✓ | Site live, 2026RS images confirmed | congress.gov / Ballotpedia fallback |
| mcp__supabase-local | Migration apply | ✓ | Configured | — |

---

## Sources

### Primary (HIGH confidence)
- mgaleg.maryland.gov/mgawebsite/Members/Index/senate — 47 senator roster, verified 2026-06-02
- mgaleg.maryland.gov/mgawebsite/Members/Index/house — 141 delegate roster + A/B breakdown, verified 2026-06-02
- Production Supabase DB queries (2026-06-05) — district counts, federal chamber UUIDs, pre-existing MD politicians
- C:/EV-Accounts/backend/migrations/269_md_government_chambers.sql — MD chamber naming/pattern template
- C:/EV-Accounts/backend/migrations/270_md_state_executives.sql — MD politician/office CTE pattern
- C:/EV-Accounts/backend/migrations/generate_or_senate.ps1 — PowerShell generator template
- C:/EV-Accounts/backend/migrations/generate_or_house.ps1 — PowerShell generator template (house)
- C:/EV-Accounts/backend/migrations/170_me_federal_officials.sql — Federal officials seeding template
- C:/EV-Accounts/backend/migrations/222_or_government_chambers.sql — Chambers migration template

### Secondary (MEDIUM confidence)
- Web search results for MD US House Representatives 119th Congress — confirmed via nbcnews.com 2024 results + individual rep sites (olszewski.house.gov, mcclaindelaney.house.gov, mfume.house.gov)
- vanhollen.senate.gov — confirmed Van Hollen as senior senator

### Tertiary (LOW confidence)
- Training data for Steny Hoyer retirement intentions (unverified at research time)

---

## Metadata

**Confidence breakdown:**
- A/B delegate math: HIGH — verified directly from mgaleg.maryland.gov official roster
- DB state (district counts, pre-existing senators, federal chamber UUIDs): HIGH — verified via production DB
- Senator roster: HIGH — mgaleg.maryland.gov
- Delegate roster: HIGH — mgaleg.maryland.gov (141 confirmed, 1 vacant 42A)
- US House rep incumbents: HIGH — 2024 election results + official .house.gov sites
- Headshot URL pattern: HIGH — confirmed from live mgaleg.maryland.gov
- Multi-member NOT EXISTS guard: MEDIUM — derived from CONTEXT.md design decision, no prior migration uses this exact pattern
- Steny Hoyer incumbency: MEDIUM — 2024 election confirmed; retirement intent for 2026 is [ASSUMED]

**Research date:** 2026-06-05
**Valid until:** 2026-09-01 (roster may change if vacancies occur; headshot URLs stable until next session changes to 2027RS)
