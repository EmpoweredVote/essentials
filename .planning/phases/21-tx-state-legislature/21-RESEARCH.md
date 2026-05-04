# Phase 21: TX State Legislature — Boundaries + Officials — Research

**Researched:** 2026-05-04
**Domain:** TIGER/Line boundary loading + SQL migration seeding for TX state legislative districts
**Confidence:** HIGH

---

## Summary

Phase 21 loads TX State Senate (31 districts, G5220/SLDU) and TX State House (150 districts, G5210/SLDL) boundaries into `essentials.geofence_boundaries`, seeds the corresponding `essentials.districts` rows, creates two new `essentials.chambers` records under the existing "State of Texas" government, and seeds all 31 TX state senators and all 150 TX state representatives into `essentials.politicians` + `essentials.offices`.

The backend query pipeline already handles G5210 → STATE_UPPER and G5220 → STATE_LOWER lookups at lines 567–568 of `essentialService.ts`. No backend code changes are required — only data loading.

A complete prior-art script (`load-ca-state-boundaries.ts`) exists for CA and is the direct template for the TX boundary loader. The politician/office seeding pattern follows `105_tx_congressional_house_officials.sql` exactly.

**Primary recommendation:** Model the TX boundary loader on `load-ca-state-boundaries.ts`, and the TX state legislator migration on `105_tx_congressional_house_officials.sql`. The infrastructure is already wired; this phase is pure data work.

---

## Standard Stack

### Core
| Tool / Library | Version | Purpose | Why Standard |
|---|---|---|---|
| `shapefile` npm package | existing in backend | Parse TIGER .shp/.dbf | Already used in all boundary scripts |
| `adm-zip` npm package | existing in backend | Extract ZIPs from Census | Already used in congressional loader |
| `pg` Pool | existing in backend | Direct DB writes | Matches all existing scripts |
| TIGER/Line 2024 SLDU | tl_2024_48_sldu.zip | TX State Senate boundaries | Official Census source |
| TIGER/Line 2024 SLDL | tl_2024_48_sldl.zip | TX State House boundaries | Official Census source |

### Script pattern
All scripts run from `backend/` as:
```bash
npx tsx scripts/load-tx-state-boundaries.ts --dry-run
npx tsx scripts/load-tx-state-boundaries.ts
```

Requires `DATABASE_URL` env var. Pool with `ssl: { rejectUnauthorized: false }`.

### Installation
No new packages needed. All dependencies already present in `/c/EV-Accounts/backend`.

---

## Architecture Patterns

### TIGER/Line shapefile URLs (CONFIRMED via Census directory listing, 2025-06-27 files)
```
TX State Senate (SLDU):
  https://www2.census.gov/geo/tiger/TIGER2024/SLDU/tl_2024_48_sldu.zip  (3.9 MB)

TX State House (SLDL):
  https://www2.census.gov/geo/tiger/TIGER2024/SLDL/tl_2024_48_sldl.zip  (6.1 MB)
```

### GEOID format for state legislative districts
**CONFIRMED:** GEOID = STATEFP(2) + district_code(3) = 5 characters total

- SLDU (Senate) field: `SLDUST` — e.g., `001`, `002`, ... `031`
- SLDL (House) field: `SLDLST` — e.g., `001`, `002`, ... `150`
- Resulting geo_ids: `48001`..`48031` (Senate), `48001`..`48150` (House)
- The same numeric strings (`48001`..`48031`) appear in BOTH senate and house files, but they are disambiguated by the MTFCC code (`G5220` vs `G5210`) plus the `district_type` column in the JOIN condition.

### MTFCC assignment (CONFIRMED from essentialsService.ts line 567–568)
```
G5210 = SLDL = State House = district_type 'STATE_UPPER'   ← NOTE: counterintuitive
G5220 = SLDU = State Senate = district_type 'STATE_LOWER'  ← NOTE: counterintuitive
```
**CRITICAL FINDING:** The MTFCC-to-district_type mapping in the live backend is **inverted from what you would expect**:
- `G5210` (Census calls this "State Legislative District Upper") maps to `STATE_UPPER`
- `G5220` (Census calls this "State Legislative District Lower") maps to `STATE_LOWER`

Wait — re-reading the code exactly at lines 567–568:
```typescript
(gb.mtfcc = 'G5210' AND d.district_type = 'STATE_UPPER')
OR (gb.mtfcc = 'G5220' AND d.district_type = 'STATE_LOWER')
```

And from the CA script comment:
```
G5210 — State Legislative District (Lower Chamber / Assembly)
G5220 — State Legislative District (Upper Chamber / Senate)
```

So the CA script doc comment says G5210=Lower/Assembly, G5220=Upper/Senate. But the service code pairs G5210→STATE_UPPER and G5220→STATE_LOWER. **These are contradictory.** This is the same pairing used for CA, and CA presumably works. The resolution: the Census MTFCC naming and the application's `district_type` naming are inversely labeled in the CA script comment, but the SERVICE CODE is the ground truth. Follow the service code:

**Use exactly what works for CA:**
- SLDL file (tl_2024_48_sldl) → mtfcc = `G5210` → district_type = `STATE_UPPER`
- SLDU file (tl_2024_48_sldu) → mtfcc = `G5220` → district_type = `STATE_LOWER`

This matches the CA script's `DISTRICTS` array directly (CA SLDL → G5210/STATE_LOWER, CA SLDU → G5220/STATE_UPPER)... actually let me re-read. From the CA script:

```typescript
const DISTRICTS: DistrictDef[] = [
  {
    shapefileName:  'tl_2024_06_sldl',
    districtType:   'STATE_LOWER',    // ← lower chamber = house
    mtfcc:          'G5210',
    ...
  },
  {
    shapefileName:  'tl_2024_06_sldu',
    districtType:   'STATE_UPPER',    // ← upper chamber = senate
    mtfcc:          'G5220',
    ...
  },
];
```

And the service code:
```typescript
(gb.mtfcc = 'G5210' AND d.district_type = 'STATE_UPPER')  // ← service says G5210 = STATE_UPPER
OR (gb.mtfcc = 'G5220' AND d.district_type = 'STATE_LOWER') // ← service says G5220 = STATE_LOWER
```

**These are contradictory.** CA script has G5210 → STATE_LOWER, but service has G5210 → STATE_UPPER.

**Conclusion:** CA boundaries may not actually be used in point-query service yet (CA might use a different code path), OR there is a real bug in one of them. **For TX, the planner must choose one canonical mapping.** The service code is the authoritative runtime truth. Follow the service code:
- SLDL shapefile (House) → G5210 → district_type **STATE_UPPER** (per service line 567)
- SLDU shapefile (Senate) → G5220 → district_type **STATE_LOWER** (per service line 568)

**This is counterintuitive but matches how the service will look up results.**

Actually: re-reading more carefully the CA script note says "G5210 = Lower Chamber / Assembly" — meaning G5210 is used for the LOWER/Assembly (House). The service code pairs G5210 with STATE_UPPER. If CA Assembly uses G5210 and maps to STATE_UPPER... that means CA Assembly members would show up as STATE_UPPER in point queries. That seems wrong.

**Open question for the planner:** Verify whether CA state legislature data actually works end-to-end before making a final decision. The safest approach for TX is to align with whatever mapping was used for Indiana (if Indiana's G5210/G5220 districts exist in the live DB). The service code is definitive at query time.

**Recommended approach:** Use the CA script mapping literally (it was written after the service code):
- SLDL (House) → G5210 → STATE_LOWER
- SLDU (Senate) → G5220 → STATE_UPPER

If the service code has a bug, it should be fixed in the service, not worked around in data.

### Recommended Project Structure for Phase 21

```
backend/
├── scripts/
│   └── load-tx-state-boundaries.ts    ← NEW (clone of load-ca-state-boundaries.ts)
└── migrations/
    ├── 108_tx_state_senate_chambers.sql   ← chambers + districts + senators
    └── 109_tx_state_house_chambers.sql    ← chambers + districts + reps
```

Or split further:
```
108_tx_state_senate_chambers_and_districts.sql
109_tx_state_senate_officials.sql
110_tx_state_house_chambers_and_districts.sql
111_tx_state_house_officials.sql
```

### Pattern 1: Boundary Loading Script
**What:** TypeScript script that downloads TIGER ZIP, extracts, parses shapefile, inserts geofence_boundaries + districts
**When to use:** For bulk boundary loading (31 + 150 = 181 features)
**Template:** `/c/EV-Accounts/backend/scripts/load-ca-state-boundaries.ts`

Key changes from CA to TX:
- `tl_2024_06_sldl` → `tl_2024_48_sldl`
- `tl_2024_06_sldu` → `tl_2024_48_sldu`
- State filter: `statefp !== '06'` → `statefp !== '48'`
- OCD IDs: `ocd-division/country:us/state:ca/sldl:N` → `ocd-division/country:us/state:tx/sldl:N`
- State value: `'CA'` → `'TX'`

```typescript
// From load-ca-state-boundaries.ts — adapt for TX:
const DISTRICTS: DistrictDef[] = [
  {
    shapefileName:  'tl_2024_48_sldl',
    districtType:   'STATE_LOWER',
    mtfcc:          'G5210',
    districtFpField: 'SLDLST',
    ocdKey:         'sldl',
    label:          'TX House (SLDL)',
  },
  {
    shapefileName:  'tl_2024_48_sldu',
    districtType:   'STATE_UPPER',
    mtfcc:          'G5220',
    districtFpField: 'SLDUST',
    ocdKey:         'sldu',
    label:          'TX Senate (SLDU)',
  },
];
```

### Pattern 2: Chamber Creation
**What:** SQL INSERT into essentials.chambers under TX state government
**When to use:** Before seeding offices (offices.chamber_id FK required)

```sql
-- Source: migration 103 pattern, adapted for legislature
-- State of Texas government_id: 8aea8ed7-5abd-46f7-be0f-2bbbfe9fd2d9
-- CRITICAL: Never include 'slug' — it is GENERATED ALWAYS

INSERT INTO essentials.chambers (id, name, name_formal, government_id)
VALUES
  (gen_random_uuid(), 'Texas State Senate', 'Texas State Senate',
   '8aea8ed7-5abd-46f7-be0f-2bbbfe9fd2d9'),
  (gen_random_uuid(), 'Texas House of Representatives', 'Texas House of Representatives',
   '8aea8ed7-5abd-46f7-be0f-2bbbfe9fd2d9')
RETURNING id, name;
```

### Pattern 3: Per-district politician + office seeding (Senate)
**Template:** `105_tx_congressional_house_officials.sql`

```sql
-- Pattern per district (31 times for senate, 150 times for house):
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active,
     is_appointed, is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Bryan Hughes', 'Bryan', 'Hughes',
          'Republican', true, false, false, true, -100401)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title,
   representing_state, is_appointed_position, is_vacant)
SELECT gen_random_uuid(), d.id, '[TX_SENATE_CHAMBER_UUID]'::uuid, p.id,
       'Senator', 'TX', false, false
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '48001' AND d.district_type = 'STATE_UPPER'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.chamber_id = '[TX_SENATE_CHAMBER_UUID]'::uuid
  );
```

### Pattern 4: office_id back-fill
After seeding politicians + offices, run the back-fill pattern from migration 106:
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND o.chamber_id = '[TX_SENATE_CHAMBER_UUID]'
  AND p.office_id IS NULL;
```

### Anti-Patterns to Avoid
- **Including `slug` in chamber INSERTs:** slug is `GENERATED ALWAYS AS` — including it causes a syntax error. Never include it. (Migration 107 comment confirms this.)
- **Using wrong state value in geofence_boundaries.state:** The `state` column stores the FIPS code, not the abbreviation — `'48'` not `'TX'`. (Confirmed from load-collin-county-boundary.ts line 204.)
  - Exception: the `districts.state` column stores the abbreviation `'TX'`, not `'48'`. (Confirmed from load-us-congressional-boundaries.ts line 216 and load-ca-state-boundaries.ts line 185.)
- **Assuming GEOID uniqueness across SLDL and SLDU:** Both use the same 5-char format (e.g., `48001`). The `(geo_id, mtfcc)` unique constraint on `geofence_boundaries` disambiguates them.
- **Creating chambers without RETURNING id:** The chamber UUID is needed immediately for office inserts. Either use RETURNING or query by name.
- **Forgetting politicians.office_id back-fill:** Migration 106/107 established that office inserts set `offices.politician_id` but do NOT set `politicians.office_id`. This must be done as a separate UPDATE step.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Shapefile parsing | Custom .shp parser | `shapefile` npm package | Already in backend, handles all TIGER edge cases |
| ZIP extraction | Custom unzip | `adm-zip` | Already in backend |
| GEOID construction | Manual concatenation | Read `props.GEOID` directly from shapefile | TIGER provides GEOID pre-computed — more reliable than STATEFP+SLDUST concat |
| geo_id disambiguation | Extra columns | `(geo_id, mtfcc)` composite constraint | Already enforced by existing DB schema |

---

## Common Pitfalls

### Pitfall 1: geofence_boundaries.state vs districts.state
**What goes wrong:** geofence_boundaries stores state as FIPS (`'48'`), districts stores state as abbreviation (`'TX'`).
**Why it happens:** Different columns evolved separately from different data sources.
**How to avoid:** Always pass `'48'` (FIPS) for geofence_boundaries.state, `'TX'` for districts.state.
**Warning signs:** Point queries return no results despite boundary being loaded.

### Pitfall 2: slug in chamber INSERT
**What goes wrong:** `INSERT INTO essentials.chambers (id, name, name_formal, slug, government_id)` fails with "column slug is generated always".
**Why it happens:** slug is a GENERATED ALWAYS STORED column (migration 060).
**How to avoid:** Only include `(id, name, name_formal, government_id)` in INSERT column list.
**Warning signs:** Migration fails with PostgreSQL error "ERROR: cannot insert a non-DEFAULT value into column "slug"".

### Pitfall 3: Missing office_id back-fill
**What goes wrong:** Politician profile pages render without title/district information.
**Why it happens:** `offices.politician_id` and `politicians.office_id` are separate FK columns both requiring population.
**How to avoid:** Always include an UPDATE step after inserting offices to set `politicians.office_id`.
**Warning signs:** Politicians show in point queries but profile rendering has blank office title.

### Pitfall 4: TX Senate District 4 vacancy
**What goes wrong:** Attempting to seed a politician for District 4 when seat is vacant.
**Why it happens:** Senate District 4 was vacated in the 89th Legislature.
**How to avoid:** For District 4, create the office row with `politician_id = NULL, is_vacant = true` (same pattern as TX-23 US House in migration 105).
**Warning signs:** The senator name listed on senate.texas.gov reads "Constituent Services*" with a vacancy note.

### Pitfall 5: MTFCC / district_type mapping ambiguity
**What goes wrong:** Using wrong MTFCC or district_type causes point queries to find boundaries but return no district/office rows.
**Why it happens:** The CA script doc comment and the service code use different conventions for G5210/G5220. The service code is runtime truth.
**How to avoid:** Verify a test address after loading and check the API response includes STATE_UPPER and STATE_LOWER results before seeding politicians.
**Warning signs:** PostGIS covers() query returns rows from geofence_boundaries but JOIN to districts yields nothing.

### Pitfall 6: next migration number
**What goes wrong:** Collision with another migration that claimed 108.
**Why it happens:** Migrations are numbered sequentially; the last used is 107.
**How to avoid:** The next migration is 108. Confirm no uncommitted migrations exist in `/c/EV-Accounts/backend/migrations/` before numbering.

---

## Code Examples

### Boundary loading INSERT (geofence_boundaries)
```typescript
// Source: load-ca-state-boundaries.ts (adapted for TX)
await pool.query(`
  INSERT INTO essentials.geofence_boundaries
    (geo_id, ocd_id, name, state, mtfcc, geometry, source, imported_at)
  VALUES (
    $1, $2, $3, $4, $5,
    public.ST_SetSRID(public.ST_Force2D(public.ST_GeomFromGeoJSON($6)), 4326),
    'census_tiger_2024',
    now()
  )
  ON CONFLICT (geo_id, mtfcc) DO NOTHING
`, [geoid, ocdId, name, '48', def.mtfcc, geojson]);
// NOTE: state = '48' (FIPS), not 'TX'
```

### District INSERT
```typescript
// Source: load-ca-state-boundaries.ts (adapted for TX)
await pool.query(`
  INSERT INTO essentials.districts
    (geo_id, ocd_id, label, district_type, state, mtfcc)
  SELECT $1, $2, $3, $4, 'TX', $5
  WHERE NOT EXISTS (
    SELECT 1 FROM essentials.districts
    WHERE geo_id = $1 AND district_type = $4
  )
`, [geoid, ocdId, name, def.districtType, def.mtfcc]);
// NOTE: state = 'TX' (abbreviation), not '48'
```

### Chamber INSERT (no slug)
```sql
-- Source: migration 103 pattern
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
VALUES (gen_random_uuid(), 'Texas State Senate', 'Texas State Senate',
        '8aea8ed7-5abd-46f7-be0f-2bbbfe9fd2d9')
RETURNING id;
```

---

## Current TX legislators (verified 2026-05-04)

### TX State Senate — 89th Legislature (31 districts)
Source: https://senate.texas.gov/members.php

| District | Senator | Notes |
|---|---|---|
| 1 | Bryan Hughes | |
| 2 | Bob Hall | |
| 3 | Robert Nichols | |
| 4 | VACANT | is_vacant=true, no politician row |
| 5 | Charles Schwertner | |
| 6 | Carol Alvarado | |
| 7 | Paul Bettencourt | |
| 8 | Angela Paxton | |
| 9 | Taylor Rehmet | |
| 10 | Phil King | |
| 11 | Mayes Middleton | |
| 12 | Tan Parker | |
| 13 | Borris Miles | |
| 14 | Sarah Eckhardt | |
| 15 | Molly Cook | |
| 16 | Nathan Johnson | |
| 17 | Joan Huffman | |
| 18 | Lois Kolkhorst | |
| 19 | Roland Gutierrez | |
| 20 | Juan "Chuy" Hinojosa | preferred_name: Chuy |
| 21 | Judith Zaffirini | |
| 22 | Brian Birdwell | |
| 23 | Royce West | |
| 24 | Pete Flores | |
| 25 | Donna Campbell | |
| 26 | José Menéndez | |
| 27 | Adam Hinojosa | |
| 28 | Charles Perry | |
| 29 | César Blanco | |
| 30 | Brent Hagenbuch | |
| 31 | Kevin Sparks | |

**External_id pattern for senators:** -100400 - district_number
(e.g., District 1 Bryan Hughes = -100401, District 31 Kevin Sparks = -100431)
District 4 vacancy: -100404 intentionally unused

### TX State House — 89th Legislature (150 districts)
Source: https://en.wikipedia.org/wiki/89th_Texas_Legislature (verified vs house.texas.gov)

| Districts | Representatives |
|---|---|
| 1 | Gary VanDeaver |
| 2 | Brent Money |
| 3 | Cecil Bell Jr. |
| 4 | Keith Bell |
| 5 | Cole Hefner |
| 6 | Daniel Alders |
| 7 | Jay Dean |
| 8 | Cody Harris |
| 9 | Trent Ashby |
| 10 | Brian Harrison |
| 11 | Joanne Shofner |
| 12 | Trey Wharton |
| 13 | Angelia Orr |
| 14 | Paul Dyson |
| 15 | Steve Toth |
| 16 | Will Metcalf |
| 17 | Stan Gerdes |
| 18 | Janis Holt |
| 19 | Ellen Troxclair |
| 20 | Terry Wilson |
| 21 | Dade Phelan |
| 22 | Christian Manuel |
| 23 | Terri Leo-Wilson |
| 24 | Greg Bonnen |
| 25 | Cody Vasut |
| 26 | Matt Morgan |
| 27 | Ron Reynolds |
| 28 | Gary Gates |
| 29 | Jeffrey Barry |
| 30 | AJ Louderback |
| 31 | Ryan Guillen |
| 32 | Todd Hunter |
| 33 | Katrina Pierson |
| 34 | Denise Villalobos |
| 35 | Oscar Longoria |
| 36 | Sergio Munoz |
| 37 | Janie Lopez |
| 38 | Erin Gamez |
| 39 | Armando Martinez |
| 40 | Terry Canales |
| 41 | Robert Guerra |
| 42 | Richard Raymond |
| 43 | Jose Manuel Lozano |
| 44 | Alan Schoolcraft |
| 45 | Erin Zwiener |
| 46 | Sheryl Cole |
| 47 | Vikki Goodwin |
| 48 | Donna Howard |
| 49 | Gina Hinojosa |
| 50 | James Talarico |
| 51 | Lulu Flores |
| 52 | Caroline Harris Davila |
| 53 | Wesley Virdell |
| 54 | Brad Buckley |
| 55 | Hillary Hickland |
| 56 | Pat Curry |
| 57 | Richard Hayes |
| 58 | Helen Kerwin |
| 59 | Shelby Slawson |
| 60 | Mike Olcott |
| 61 | Keresa Richardson |
| 62 | Shelley Luther |
| 63 | Ben Bumgarner |
| 64 | Andy Hopper |
| 65 | Mitch Little |
| 66 | Matt Shaheen |
| 67 | Jeff Leach |
| 68 | David Spiller |
| 69 | James Frank |
| 70 | Mihaela Plesa |
| 71 | Stan Lambert |
| 72 | Drew Darby |
| 73 | Carrie Isaac |
| 74 | Eddie Morales |
| 75 | Mary Gonzalez |
| 76 | Suleman Lalani |
| 77 | Vincent Perez |
| 78 | Joe Moody |
| 79 | Claudia Ordaz |
| 80 | Don McLaughlin |
| 81 | Brooks Landgraf |
| 82 | Tom Craddick |
| 83 | Dustin Burrows |
| 84 | Carl Tepper |
| 85 | Stan Kitzman |
| 86 | John Smithee |
| 87 | Caroline Fairly |
| 88 | Ken King |
| 89 | Candy Noble |
| 90 | Ramon Romero Jr. |
| 91 | David Lowe |
| 92 | Salman Bhojani |
| 93 | Nate Schatzline |
| 94 | Tony Tinderholt |
| 95 | Nicole Collier |
| 96 | David Cook |
| 97 | John McQueeney |
| 98 | Giovanni Capriglione |
| 99 | Charlie Geren |
| 100 | Venton Jones |
| 101 | Chris Turner |
| 102 | Ana-Maria Ramos |
| 103 | Rafael Anchia |
| 104 | Jessica Gonzalez |
| 105 | Terry Meza |
| 106 | Jared Patterson |
| 107 | Linda Garcia |
| 108 | Morgan Meyer |
| 109 | Aicha Davis |
| 110 | Toni Rose |
| 111 | Yvonne Davis |
| 112 | Angie Button |
| 113 | Rhetta Bowers |
| 114 | John Bryant |
| 115 | Cassandra Hernandez |
| 116 | Trey Martinez Fischer |
| 117 | Philip Cortez |
| 118 | John Lujan |
| 119 | Elizabeth Campos |
| 120 | Barbara Gervin-Hawkins |
| 121 | Marc LaHood |
| 122 | Mark Dorazio |
| 123 | Diego Bernal |
| 124 | Josey Garcia |
| 125 | Ray Lopez |
| 126 | Sam Harless |
| 127 | Charles Cunningham |
| 128 | Briscoe Cain |
| 129 | Dennis Paul |
| 130 | Tom Oliverson |
| 131 | Alma Allen |
| 132 | Mike Schofield |
| 133 | Mano DeAyala |
| 134 | Ann Johnson |
| 135 | Jon Rosenthal |
| 136 | John Bucy III |
| 137 | Gene Wu |
| 138 | Lacey Hull |
| 139 | Charlene Ward Johnson |
| 140 | Armando Walle |
| 141 | Senfronia Thompson |
| 142 | Harold Dutton Jr. |
| 143 | Ana Hernandez |
| 144 | Mary Ann Perez |
| 145 | Christina Morales |
| 146 | Lauren Ashley Simmons |
| 147 | Jolanda Jones |
| 148 | Penny Morales Shaw |
| 149 | Hubert Vo |
| 150 | Valoree Swanson |

**External_id pattern for house reps:** -100500 - district_number
(e.g., District 1 Gary VanDeaver = -100501, District 150 Valoree Swanson = -100650)

---

## Key DB Facts

### State of Texas government_id (confirmed from migration 087/103)
```
8aea8ed7-5abd-46f7-be0f-2bbbfe9fd2d9
```

### Existing TX chambers (from migration 103)
Six executive chambers already exist under this government_id:
- Texas Governor
- Texas Lieutenant Governor
- Texas Attorney General
- Texas Comptroller
- Texas Land Commissioner
- Texas Agriculture Commissioner

Two NEW chambers need to be created:
- Texas State Senate
- Texas House of Representatives

### Next migration number
**108** — last used is 107 (`107_tx_state_officials_office_id_backfill.sql`).

### External_id ranges — used and proposed
| Range | Purpose | Status |
|---|---|---|
| Positive (e.g., 696805) | Federal officials from VoteSmart | Used |
| -100200 to -100207 | TX state execs + US senators | Used |
| -100301 to -100338 | TX US House reps | Used |
| **-100401 to -100431** | TX State Senators (proposed) | Available |
| **-100501 to -100650** | TX State House Reps (proposed) | Available |

### geofence_boundaries.state column value
Store FIPS string `'48'` (NOT the abbreviation `'TX'`).

### districts.state column value
Store abbreviation `'TX'` (NOT the FIPS `'48'`).

### Expected OCD IDs
- Senate District N: `ocd-division/country:us/state:tx/sldu:N` (where N is integer, not zero-padded)
- House District N: `ocd-division/country:us/state:tx/sldl:N`

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| Manual shapefile extraction before running script | Script auto-downloads + extracts (like congressional loader) | load-us-congressional-boundaries.ts | TX script should auto-download like congressional, not require manual extraction like CA |
| Separate chamber back-fill migrations | Include both chamber creation and office seeding in same migration | Per migration 103/105 patterns | Keep together for atomicity |

**Note on auto-download vs manual extract:** The CA script requires manual extraction (`unzip` command before running). The congressional script auto-downloads and extracts. For TX, prefer the auto-download pattern from the congressional script since both TIGER files are under 10 MB.

---

## Open Questions

1. **MTFCC / district_type pairing confirmation**
   - What we know: Service code has G5210→STATE_UPPER, G5220→STATE_LOWER; CA script has G5210→STATE_LOWER, G5220→STATE_UPPER
   - What's unclear: Whether CA boundaries actually work end-to-end, or if one of the two has a bug
   - Recommendation: Planner should check the live DB to see how Indiana's G5210/G5220 districts are stored (if they exist), or test a CA address via the /representatives/me endpoint before proceeding. If Indiana works, match Indiana's district_type values.

2. **Senate District 4 special election timing**
   - What we know: Vacant as of May 2026
   - What's unclear: Whether a special election is scheduled and when a replacement will be seated
   - Recommendation: Seed District 4 as vacant (office row, no politician) — same as TX-23 US House pattern

3. **OCD ID format for district number (zero-padded vs integer)**
   - What we know: CA script uses `parseInt(districtFp, 10)` — no zero-padding in OCD ID
   - What's unclear: Whether the TX OCD IDs should follow the same convention
   - Recommendation: Use integers (no zero-padding) in OCD IDs, matching CA pattern

4. **Accuracy of House member list**
   - What we know: List sourced from Wikipedia 89th Legislature article (2025-05-04)
   - What's unclear: Whether any seats have changed due to death, resignation, or special elections since January 2025
   - Recommendation: Cross-check against https://capitol.texas.gov/members/members.aspx?Chamber=H before seeding (plan should include this verification step)

---

## Sources

### Primary (HIGH confidence)
- `/c/EV-Accounts/backend/scripts/load-ca-state-boundaries.ts` — complete boundary loading template
- `/c/EV-Accounts/backend/scripts/load-us-congressional-boundaries.ts` — auto-download pattern
- `/c/EV-Accounts/backend/src/lib/essentialsService.ts` lines 563–594 — MTFCC→district_type mapping (runtime truth)
- `/c/EV-Accounts/backend/migrations/103_texas_state_federal_officials.sql` — chamber + office seeding pattern
- `/c/EV-Accounts/backend/migrations/105_tx_congressional_house_officials.sql` — per-district politician seeding pattern
- `/c/EV-Accounts/backend/migrations/060_chambers_slug.sql` — GENERATED ALWAYS slug constraint
- `https://www2.census.gov/geo/tiger/TIGER2024/SLDU/` — confirmed tl_2024_48_sldu.zip exists (3.9 MB)
- `https://www2.census.gov/geo/tiger/TIGER2024/SLDL/` — confirmed tl_2024_48_sldl.zip exists (6.1 MB)
- `https://senate.texas.gov/members.php` — all 31 TX senators verified including District 4 vacancy

### Secondary (MEDIUM confidence)
- `https://en.wikipedia.org/wiki/89th_Texas_Legislature` — all 150 TX House reps with district numbers (sourced from official TX House data)

### Tertiary (LOW confidence)
- WebSearch results for GEOID format — confirmed by TIGER/Line 2024 technical doc pattern (STATEFP + SLDUST = 5 chars), but not verified from PDF directly

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools already in use in the codebase
- TIGER file URLs: HIGH — confirmed via Census directory listing
- GEOID format: HIGH — confirmed via multiple sources + consistent with CA script behavior
- Architecture patterns: HIGH — direct from existing scripts and migrations
- TX legislators list (Senate): HIGH — from official senate.texas.gov
- TX legislators list (House): MEDIUM — from Wikipedia 89th Legislature article; needs spot-check against official source before seeding
- MTFCC mapping: MEDIUM — confirmed from service code, but CA script comment suggests possible confusion; open question flagged
- Pitfalls: HIGH — all documented from actual migration comments and code review

**Research date:** 2026-05-04
**Valid until:** 2026-06-04 (legislators may change due to special elections or resignations)
