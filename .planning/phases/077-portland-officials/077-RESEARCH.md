# Phase 77: Portland City Structure + Officials - Research

**Researched:** 2026-05-29
**Domain:** Oregon city government seeding — government scaffold, chambers, districts, officials, headshots
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Portland uses **1 Portland City Council chamber** with **12 office rows** — 3 per district, each linked to the corresponding `portland-or-council-district-N` geofence. Routing returns all 3 members for the matched district naturally.
- **D-02:** Do NOT create 4 sub-chambers (one per district) — no prior analog; overly complex. Single chamber model confirmed.
- **D-03:** Mayor: **Keith Wilson** (citywide RCV, elected Nov 2024). Mayor office links to LOCAL_EXEC district (geo_id='4159000').
- **D-04:** City Administrator: appointed. `is_appointed_position=true`. No headshot required.
- **D-05:** City Attorney: researcher must confirm elected vs. appointed and current incumbent. (See Critical Finding below — APPOINTED, not elected.)
- **D-06:** Council member incumbents — researcher must confirm against official source. (See Critical Finding below — CONTEXT.md names are partially wrong.)
- **D-07:** All 3 council office rows within a district share the title **"City Council Member (District N)"**. No seat numbering.
- **D-08:** **Include Portland City Auditor Simone Rede** — elected citywide, `is_appointed_position=false`, headshot required.
- **D-09:** Portland OR government row does **not exist** — must be created in 77-01. [VERIFIED: DB query 2026-05-29]
- **D-10:** LOCAL_EXEC district for Portland citywide offices does not exist yet — must be created in 77-01. [VERIFIED: DB query 2026-05-29 — geo_id='4159000' has 0 districts rows]
- **D-11:** Portland council district rows already exist: `portland-or-council-district-{1-4}`, `district_type='LOCAL'`, `state='or'` (Phase 76). [VERIFIED: DB query 2026-05-29 — 4 rows confirmed]
- **D-12:** Portland OR officials use **`-690xxx`** range. Suggested layout: Mayor=-690001, City Auditor=-690002 *(see corrected scope below)*, City Administrator=-690003, Council D1(-690010..-690012), D2(-690013..-690015), D3(-690016..-690018), D4(-690019..-690021).
- **D-13:** Last applied migration: **229** (Portland council district rows, Phase 76). Next migration: **230**. [VERIFIED: DB query 2026-05-29]
- **D-14:** Headshot scope: all **elected** Portland officials (Mayor + 12 council + City Auditor). Excludes City Administrator. [Updated: City Attorney also excluded — appointed, not elected.]

### Claude's Discretion

- Exact government row `name` string for Portland (researcher selects consistent format)
- Chambers to create under Portland government row
- Headshot source URL patterns for portland.gov
- Whether City Attorney is elected or appointed under the 2025 charter

### Deferred Ideas (OUT OF SCOPE)

- Oregon elections (2026 races for Portland council seats)
- Compass stances for Portland officials
- Additional OR cities beyond Portland
</user_constraints>

---

## Summary

Phase 77 seeds the City of Portland OR's complete government structure and all officials. The work is structurally identical to the v7.0 California city deep-seed phases (63–68), with the same three-plan shape: scaffold (77-01), officials (77-02), headshots (77-03). Portland's unique feature is its 2025 charter reform — a 12-member multi-district council with 3 seats per district elected by RCV. The Phase 76 council district geofences are already in place.

Two critical corrections from the CONTEXT.md locked decisions have been discovered through live research:

1. **City Attorney is APPOINTED** (not elected). The 2025 Portland charter Article 2 lists only 3 elective offices: Mayor, Auditor, and 12 Councilors. The City Attorney (currently Robert L. Taylor) is appointed by and serves at the pleasure of the full City Council. `is_appointed_position=true`. No chamber, no headshot.

2. **Council incumbents differ from CONTEXT.md D-06.** The official Portland Auditor elected-officials page lists a different roster in Districts 1, 2, 3, and 4. The CONTEXT.md names reflect pre-election candidate expectations. The planner must use the verified official roster below.

Additionally, **City Administrator Michael Jordan** left office in December 2025. The current City Administrator is **Raymond C. Lee III** (confirmed Dec 2025). The CONTEXT.md decision to include the City Administrator as appointed (`is_appointed_position=true`) stands; only the name changes.

**Primary recommendation:** Use the verified 14-official roster (1 Mayor + 12 council members + 1 City Auditor) as elected officials with headshots, plus City Administrator and City Attorney as appointed officials with no headshots. Government name format: `'City of Portland, Oregon, US'` to match the OR state's ME-style convention.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Government scaffold (DB insert) | Database / Storage | — | SQL migration creates governments, chambers, districts rows |
| Official seed (DB insert) | Database / Storage | — | SQL migration creates politicians + offices rows |
| Headshot upload | Database / Storage | — | Supabase Storage upload + politician_images INSERT |
| Address routing | API / Backend | Database / Storage | essentialsService.ts JOIN chain: geofence → district → office → politician |
| Coverage display | Frontend Server (SSR) | CDN / Static | Landing.jsx COVERAGE_AREAS (deferred — out of Phase 77 scope) |

---

## Standard Stack

### Core (all inherited from prior phases — no new packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PostgreSQL (Supabase) | 15.x | Persistent data store | Project standard |
| `pg` Node.js client | project version | DB connection in scripts | Project standard |
| `tsx` | project version | Run TypeScript scripts | Project standard |
| `dotenv` | project version | Load DATABASE_URL | Project standard |

No new packages required. [VERIFIED: all prior city deep-seed phases 63–68 required zero new packages]

### Pattern: SQL Migration via Supabase Management API

All structural changes are SQL migrations applied via the Supabase Management API (POST to api.supabase.com/v1/projects/{ref}/database/query), wrapped in `BEGIN; ... COMMIT;`. This is the established pattern for all migrations from 205 onward.

---

## Package Legitimacy Audit

No new packages are installed in this phase. All tooling is pre-existing.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| (none) | — | — | — | — | — | — |

---

## Architecture Patterns

### System Architecture Diagram

```
portland.gov (headshot images, public)
       |
       v (curl/fetch → crop 4:5 → resize 600x750 Lanczos q90)
Supabase Storage (politician_photos bucket)
       |
       v (INSERT url, type='default', photo_license='public_domain')
essentials.politician_images
       |
       +-- politician_id FK
       |
essentials.politicians (-690001..-690021)
       |
       +-- office_id FK (back-filled via UPDATE)
       |
essentials.offices (14 rows: 1 Mayor + 12 council + 1 Auditor + 1 CityAdmin + 1 CityAtty)
       |
       +-- district_id FK
       |                      +-- LOCAL_EXEC (geo_id='4159000'): Mayor, Auditor, CityAdmin, CityAtty
       +-- essentials.districts
                              +-- LOCAL (portland-or-council-district-{1-4}): council offices
       |
       +-- chamber_id FK → essentials.chambers (created in 77-01)
       |
essentials.governments ('City of Portland, Oregon, US', geo_id='4159000')
```

Address routing flow:
```
User address → PostGIS ST_Covers → geofence_boundaries (X0012, state='41')
  → geo_id 'portland-or-council-district-N'
  → districts (district_type='LOCAL', state='or')
  → offices (3 per district)
  → politicians (3 council members for that district)
  + districts (district_type='LOCAL_EXEC', geo_id='4159000')
  → offices (Mayor + Auditor)
  → politicians (Wilson + Rede)
```

### Recommended Project Structure

```
C:/EV-Accounts/backend/migrations/
├── 230_portland_government_structure.sql   # governments + chambers + LOCAL_EXEC district
├── 231_portland_officials.sql              # 16 politicians + 16 offices + office_id back-fill
└── (audit-only headshot SQL, NOT in ledger)
```

### Pattern 1: Government Scaffold Migration (mirrors SD migration 207)

**What:** Creates government row + chambers + LOCAL_EXEC district. Uses `WHERE NOT EXISTS` guards throughout.

**When to use:** Plan 77-01

```sql
-- Source: migration 207_sd_government_structure.sql (established pattern)
BEGIN;

-- Government row (no unique constraint on geo_id — use WHERE NOT EXISTS)
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'City of Portland, Oregon, US',
       'LOCAL', 'OR', 'Portland', '4159000'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'City of Portland, Oregon, US' AND state = 'OR'
);

-- Chambers (slug is GENERATED ALWAYS — never include in INSERT)
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(), 'City Council', 'Portland City Council',
       (SELECT id FROM essentials.governments
        WHERE name='City of Portland, Oregon, US' AND state='OR')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name='City Council'
    AND government_id=(SELECT id FROM essentials.governments
                       WHERE name='City of Portland, Oregon, US' AND state='OR')
);

-- LOCAL_EXEC district for citywide offices (Mayor, City Auditor, City Administrator, City Attorney)
INSERT INTO essentials.districts (geo_id, district_type, label, state)
SELECT '4159000', 'LOCAL_EXEC', 'Portland (Citywide)', 'or'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id='4159000' AND state='or' AND district_type IN ('LOCAL','LOCAL_EXEC')
);

COMMIT;
```

**Critical schema constraints:**
- `essentials.chambers.slug` is GENERATED ALWAYS — never include in INSERT
- `essentials.governments` has NO unique constraint on geo_id — use WHERE NOT EXISTS
- `essentials.districts` has NO unique constraint on (geo_id, district_type) — use WHERE NOT EXISTS
- `state='OR'` (uppercase) on governments row; `state='or'` (lowercase) on districts rows — matches OR loader convention

### Pattern 2: Officials Seed Migration (mirrors Berkeley migration 214 — WITH ins_p CTE)

**What:** Inserts politicians + offices using WITH ins_p CTE pattern. One CTE block per official. Back-fills politicians.office_id at end.

**When to use:** Plan 77-02

```sql
-- Source: migration 214_berkeley_officials.sql (established pattern)
-- Council member example (3 per district, same district_id for all 3 in each district):
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Candace Avalos', 'Candace', 'Avalos', NULL,
          true, false, false, true, -690010)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name='City Council'
          AND government_id=(SELECT id FROM essentials.governments
                             WHERE name='City of Portland, Oregon, US' AND state='OR')),
       p.id,
       'City Council Member (District 1)', 'OR', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = 'portland-or-council-district-1'
  AND d.district_type = 'LOCAL'
  AND d.state = 'or'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

**Key difference from Berkeley:** Portland has 3 council members per district — all 3 offices within a district use the same `d.geo_id = 'portland-or-council-district-N'` FK. Each has a separate CTE block with distinct external_id.

**Back-fill UPDATE (must be last in migration):**
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -690021 AND -690001
  AND p.office_id IS NULL;
```

### Pattern 3: Headshot Pipeline (mirrors Phase 68 pattern)

**What:** Download full-size PNG/JPG from portland.gov, crop to 4:5, resize to 600x750 Lanczos q90, upload to Supabase Storage.

**When to use:** Plan 77-03

```
Source URL pattern (full-size, drop the styles/ thumbnail prefix):
https://www.portland.gov/sites/default/files/public/2025/[Filename]---square---web.jpg
https://www.portland.gov/sites/default/files/public/2024/Wilson-Blue-Background_0.png  (Mayor)
https://www.portland.gov/sites/default/files/public/2022/auditor-simone-rede_1.jpg     (Auditor)

Storage path: {politician_id}-headshot.jpg
```

**politician_images INSERT:**
```sql
INSERT INTO essentials.politician_images
  (id, politician_id, url, type, photo_license, focal_point)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM essentials.politicians WHERE external_id = -690001),
  'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{politician_id}-headshot.jpg',
  'default',
  'public_domain',
  NULL
);
```

CRITICAL: `type` must be `'default'` — the UI `.find(img => img.type === 'default')` returns silent invisibility for any other value.

### Anti-Patterns to Avoid

- **Creating a City Attorney chamber:** City Attorney is appointed. NO chamber, NO office row with `is_appointed_position=false`, NO headshot.
- **Using D-06 incumbent names from CONTEXT.md:** Those names are wrong for Districts 1, 2, 3, 4. Use the verified roster in this file.
- **Including `slug` in chamber INSERT:** GENERATED ALWAYS column — will error.
- **Using `ON CONFLICT (geo_id, district_type) DO NOTHING` for districts:** No such unique constraint — use WHERE NOT EXISTS.
- **Using `state='OR'` for districts:** Districts use lowercase `state='or'` to match the OR TIGER loader convention.
- **Using `state='06'` for geofence_boundaries:** Portland OR boundaries use `state='41'` (FIPS). The districts rows use `state='or'`.
- **Uploading headshots with `type='headshot'`:** Must be `type='default'`. Wrong type = photo invisible in UI.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Headshot image processing | Custom resizer | Pillow/sharp (manual CLI) per established project pattern | Exact 4:5 crop → 600x750 Lanczos q90 is project-wide standard |
| DB idempotency | TRUNCATE + re-insert | WHERE NOT EXISTS guards | Allows safe re-runs without data loss |
| Routing verification | New service code | Existing essentialsService.ts ST_Covers JOIN chain | All city routing uses the same query; validate with a SQL point-in-polygon test |

---

## Critical Findings (Corrections to CONTEXT.md)

### Finding CF-1: City Attorney is APPOINTED [VERIFIED: portland.gov/attorney + portland.gov/charter/2/2]

The 2025 Portland charter Article 2 (Section 2-201) lists exactly 3 elective offices: "twelve (12) Councilors, the Mayor and the Auditor." The City Attorney is **not** an elective office.

From [portland.gov/attorney/general-information-and-staff](https://www.portland.gov/attorney/general-information-and-staff): "the City Attorney is appointed by and serves at the pleasure of the City Council, and is the only City officer appointed by the full Council."

- **Current City Attorney:** Robert L. Taylor (appointed Feb 2025)
- **`is_appointed_position=true`**
- **No chamber needed** for City Attorney (no separate elected office)
- **No headshot** (appointed, excluded from SC-4)
- **CONTEXT.md D-05 is incorrect** — the phase must create a City Attorney office row as appointed, not elected

If the planner still wants to seed the City Attorney as an appointed official (analogous to SF's appointed Controller), that is valid — but `is_appointed_position=true` and no headshot.

### Finding CF-2: Incumbent Roster Differs from CONTEXT.md D-06 [VERIFIED: portland.gov/auditor/elections/elected-city-officials 2026-05-29]

The official Portland Auditor elections page lists the 14 current elected officials as of Jan 2025:

| Office | Name | Term |
|--------|------|------|
| Mayor | Keith Wilson | 2025–2028 |
| City Auditor | Simone Rede | 2025–2026 |
| District 1 | Candace Avalos | 2025–2028 |
| District 1 | Jamie Dunphy | 2025–2028 |
| District 1 | Loretta Smith | 2025–2028 |
| District 2 | Dan Ryan | 2025–2028 |
| District 2 | Elana Pirtle-Guiney | 2025–2028 |
| District 2 | Sameer Kanal | 2025–2028 |
| District 3 | Angelita Morillo | 2025–2026 |
| District 3 | Steve Novick | 2025–2026 |
| District 3 | Tiffany Koyama Lane | 2025–2026 |
| District 4 | Eric Zimmerman | 2025–2026 |
| District 4 | Mitch Green | 2025–2026 |
| District 4 | Olivia Clark | 2025–2026 |

**CONTEXT.md D-06 errors:**
- D1: CONTEXT listed "Timur Ataseven, Loretta Smith, Tiffany Kachima" → Correct: Candace Avalos, Jamie Dunphy, Loretta Smith
- D2: CONTEXT listed "Candace Avalos, Maxine Dexter, Eric Zimmerman" → Correct: Dan Ryan, Elana Pirtle-Guiney, Sameer Kanal
- D3: CONTEXT listed "Steve Novick, Angelita Morillo, Chris Carey" → Correct: Angelita Morillo, Steve Novick, Tiffany Koyama Lane
- D4: CONTEXT listed "Jonathan Tasini, Elana Pirtle-Guiney, Mitch Green" → Correct: Eric Zimmerman, Mitch Green, Olivia Clark

Some names from CONTEXT.md do appear on the official list, but in different districts.

### Finding CF-3: City Administrator is Raymond C. Lee III (not Michael Jordan) [VERIFIED: portland.gov/administration 2026-05-29]

Michael Jordan served as City Administrator through December 2025. Raymond C. Lee III was confirmed by City Council and appointed in December 2025. He is the current City Administrator.

- **Current City Administrator:** Raymond C. Lee III
- **`is_appointed_position=true`**
- **No headshot** (appointed official)

---

## Verified External ID Layout (revised for correct scope)

```
-690001  Mayor Keith Wilson
-690002  City Auditor Simone Rede
-690003  City Administrator Raymond C. Lee III (appointed)
-690004  City Attorney Robert L. Taylor (appointed)
-690010  Candace Avalos (D1)
-690011  Jamie Dunphy (D1)
-690012  Loretta Smith (D1)
-690013  Dan Ryan (D2)
-690014  Elana Pirtle-Guiney (D2)
-690015  Sameer Kanal (D2)
-690016  Angelita Morillo (D3)
-690017  Steve Novick (D3)
-690018  Tiffany Koyama Lane (D3)
-690019  Eric Zimmerman (D4)
-690020  Mitch Green (D4)
-690021  Olivia Clark (D4)
```

Pre-flight confirmed: 0 rows in essentials.politicians for external_id BETWEEN -699999 AND -690000. [VERIFIED: DB query 2026-05-29]

---

## Verified Government Name Format

**Recommendation: `'City of Portland, Oregon, US'`** with `state='OR'`

Rationale: The ME cities use the full form ("City of Portland, Maine, US"). The v7.0 CA cities use short form ("City of Berkeley"). Since OR is a separate state onboarding (v8.0) and the State of Oregon government already follows ME conventions, using the full form maintains consistency within the OR state block and avoids confusion with Portland, Maine (which already exists as "City of Portland, Maine, US" in the DB).

The subquery in all migrations will be:
```sql
(SELECT id FROM essentials.governments WHERE name='City of Portland, Oregon, US' AND state='OR')
```

---

## Verified Chambers to Create

Under the Portland OR government (following the Berkeley 3-chamber model, but without City Attorney):

| Chamber name | name_formal | Rationale |
|---|---|---|
| `City Council` | `Portland City Council` | 12 district-linked offices |
| `Mayor` | `Mayor of Portland` | 1 citywide office |
| `City Auditor` | `Portland City Auditor` | 1 citywide elected office |
| `City Administrator` | `Portland City Administrator` | 1 appointed office |
| `City Attorney` | `Portland City Attorney` | 1 appointed office |

That is 5 chambers. The City Administrator and City Attorney chambers have `is_appointed_position=true` on their office rows.

**Note:** Whether to create separate chambers for each appointed official is Claude's discretion. The minimum required chambers are City Council + Mayor + City Auditor (for the 14 elected officials). If appointed officials are seeded, they need a chamber too. Recommend seeding City Administrator and City Attorney as there is a direct analog (Berkeley had no appointed officials; SF had Controller + City Administrator with chambers; Portland is closer to SF).

---

## Headshot Sources (portland.gov)

All official portland.gov photos are public domain (government publication). URL pattern:

```
Thumbnail: https://www.portland.gov/sites/default/files/styles/1_1_160w/public/[year]/[filename]
Full-size: https://www.portland.gov/sites/default/files/public/[year]/[filename]
```

All council member photos are square (1:1 ratio). Must crop to 4:5 ratio first, then resize to 600x750 Lanczos q90.

**Known source URLs (full-size paths — drop `styles/1_1_160w/` prefix):**

| Official | Source URL | Year |
|---|---|---|
| Mayor Keith Wilson | `/sites/default/files/public/2024/Wilson-Blue-Background_0.png` | 2024 |
| City Auditor Simone Rede | `/sites/default/files/public/2022/auditor-simone-rede_1.jpg` | 2022 |
| Candace Avalos (D1) | `/sites/default/files/public/2025/Pink-Official-Background_0.png` | 2025 |
| Jamie Dunphy (D1) | `/sites/default/files/public/2025/Dunphy---IMG_8672---square---web.jpg` | 2025 |
| Loretta Smith (D1) | `/sites/default/files/public/2025/CouncilorSmithheadshot.jpg` | 2025 |
| Mitch Green (D4) | `/sites/default/files/public/2025/Green---IMG_8827---square---web.jpg` | 2025 |
| Tiffany Koyama Lane (D3) | `/sites/default/files/public/2025/Koyama-Lane---IMG_9037---square---web.jpg` | 2025 |
| Angelita Morillo (D3) | `/sites/default/files/public/2025/Morillo---IMG_9092---square---web.jpg` | 2025 |
| Dan Ryan (D2) | `/sites/default/files/public/2025/Ryan---IMG_8965---square---web.jpg` | 2025 |

**Remaining council members:** Visit `/council/districts/[N]/[first-name]-[last-name]` pages for Dan Ryan, Elana Pirtle-Guiney, Sameer Kanal, Steve Novick, Eric Zimmerman, and Olivia Clark to retrieve full-size filenames. The naming pattern is `[LastName]---IMG_XXXX---square---web.jpg`.

**City Auditor full page:** `/auditor/simone-rede` — headshot at `2022/auditor-simone-rede_1.jpg`.

---

## Migration Ledger Status (DB-verified 2026-05-29)

```
Last applied sequential migration: 229 (present in supabase_migrations.schema_migrations as version='229')
Next available: 230
```

DB verification queries run 2026-05-29:
- migration `'229'` confirmed present (Portland council districts, Phase 76)
- `'230'` not present (available for Phase 77 Plan 01)

Plan migrations:
- 230 = Portland government structure (77-01)
- 231 = Portland officials seed (77-02)
- Headshot SQL = audit-only (NOT added to ledger — follows Phase 75 pattern for 228_or_legislature_headshots.sql)

---

## Common Pitfalls

### Pitfall 1: Using CONTEXT.md D-06 Incumbent Names
**What goes wrong:** 9 of 12 council member names in CONTEXT.md D-06 are wrong. Seeding wrong names = bad data.
**Why it happens:** CONTEXT.md was written with pre-election candidate expectations rather than verified post-election official records.
**How to avoid:** Use the verified roster from CF-2 above (sourced from portland.gov/auditor/elections/elected-city-officials).
**Warning signs:** Names like "Timur Ataseven", "Tiffany Kachima", "Maxine Dexter", "Chris Carey", "Jonathan Tasini" are NOT serving on Portland City Council.

### Pitfall 2: Creating City Attorney as Elected
**What goes wrong:** City Attorney chamber seeded with `is_appointed_position=false`, office row with false, headshot uploaded — all incorrect.
**Why it happens:** CONTEXT.md D-05 stated elected status without charter verification.
**How to avoid:** City Attorney is appointed. See CF-1. Use `is_appointed_position=true`. No headshot.

### Pitfall 3: Using Michael Jordan as City Administrator
**What goes wrong:** Seeding Jordan who left office Dec 2025.
**Why it happens:** CONTEXT.md D-04 referenced Jordan before his departure.
**How to avoid:** Current City Administrator is Raymond C. Lee III (confirmed Dec 2025). See CF-3.

### Pitfall 4: Using Wrong `state` Casing in Districts
**What goes wrong:** INSERT `state='OR'` into essentials.districts causes routing mismatch (essentialsService.ts joins on lowercase state for LOCAL/LOCAL_EXEC).
**Why it happens:** Government row uses `state='OR'` (uppercase), but districts use `state='or'` (lowercase) for the OR loader.
**How to avoid:** Always `state='or'` (lowercase) for essentials.districts rows in Oregon context. [VERIFIED: Phase 76 migration 229 used `state='or'`; confirmed by DB query showing existing council district rows.]

### Pitfall 5: 3 Council Offices per District — Same District FK
**What goes wrong:** Creating separate district rows per seat (D1A, D1B, D1C) instead of linking all 3 to the same `portland-or-council-district-1`.
**Why it happens:** The "3 seats per district" language suggests 3 districts, but the routing model is 1 district → 3 offices → 3 politicians.
**How to avoid:** All 3 council offices for District 1 point to `d.geo_id = 'portland-or-council-district-1'` and `d.district_type = 'LOCAL'`. This is the locked D-01 decision.
**Warning signs:** Section-split detector returns non-zero rows (would catch this).

### Pitfall 6: Photo type='headshot' Instead of 'default'
**What goes wrong:** Headshots uploaded correctly to Storage but invisible on politician profile pages.
**Why it happens:** UI filter `.find(img => img.type === 'default')` requires exactly `'default'`.
**How to avoid:** Always `type='default'` in politician_images INSERT.

### Pitfall 7: Thumbnail URL Instead of Full-Size
**What goes wrong:** Downloading 160px-wide square thumbnails instead of full-size photos results in 160×160 sources that upscale badly.
**Why it happens:** The `styles/1_1_160w/` path is the default in rendered HTML.
**How to avoid:** Drop the `styles/1_1_160w/` segment from the URL to get the original uploaded file. Pattern: `https://www.portland.gov/sites/default/files/public/[year]/[filename]`.

---

## Pre-flight Verification Queries (run before writing migrations)

```sql
-- 1: Confirm -690xxx range is clear
SELECT external_id, full_name FROM essentials.politicians
WHERE external_id BETWEEN -699999 AND -690000;
-- Expected: 0 rows [VERIFIED: 0 rows as of 2026-05-29]

-- 2: Confirm Portland OR government row does NOT exist
SELECT id, name FROM essentials.governments
WHERE name='City of Portland, Oregon, US' AND state='OR';
-- Expected: 0 rows [VERIFIED: 0 rows as of 2026-05-29]

-- 3: Confirm 4 portland-or-council-district-N rows exist
SELECT geo_id, district_type, state FROM essentials.districts
WHERE geo_id LIKE 'portland-or-council-district-%';
-- Expected: 4 rows [VERIFIED: 4 rows, district_type='LOCAL', state='or']

-- 4: Confirm no LOCAL_EXEC district for geo_id='4159000'
SELECT geo_id, district_type FROM essentials.districts
WHERE geo_id='4159000';
-- Expected: 0 rows [VERIFIED: 0 rows as of 2026-05-29]

-- 5: Confirm migration 229 applied, 230 not yet
SELECT version FROM supabase_migrations.schema_migrations
WHERE version IN ('229','230') ORDER BY version;
-- Expected: only '229' [VERIFIED: '229' present, '230' absent]

-- 6: Name collision check (all 14 elected officials)
SELECT full_name, COUNT(*) FROM essentials.politicians
WHERE full_name IN (
  'Keith Wilson','Simone Rede',
  'Candace Avalos','Jamie Dunphy','Loretta Smith',
  'Dan Ryan','Elana Pirtle-Guiney','Sameer Kanal',
  'Angelita Morillo','Steve Novick','Tiffany Koyama Lane',
  'Eric Zimmerman','Mitch Green','Olivia Clark',
  'Raymond C. Lee III','Robert L. Taylor'
)
GROUP BY full_name HAVING COUNT(*) > 1;
-- Expected: 0 rows [VERIFIED: 0 rows as of 2026-05-29]

-- Section-split check (post 77-01, should remain 0 after 77-02)
SELECT ch.name_formal, COUNT(DISTINCT o.id) AS office_count
FROM essentials.offices o
JOIN essentials.chambers ch ON ch.id = o.chamber_id
WHERE ch.government_id = (SELECT id FROM essentials.governments
                          WHERE name='City of Portland, Oregon, US' AND state='OR')
GROUP BY ch.name_formal;
```

---

## Routing Verification (smoke test for 77-02)

```sql
-- Portland City Hall → 3 District 4 council members
SELECT p.full_name, d.geo_id, o.title
FROM essentials.geofence_boundaries gb
JOIN essentials.districts d ON d.geo_id = gb.geo_id
JOIN essentials.offices o ON o.district_id = d.id
JOIN essentials.politicians p ON p.id = o.politician_id
WHERE gb.mtfcc = 'X0012'
  AND ST_Covers(gb.geometry, ST_SetSRID(ST_MakePoint(-122.6794, 45.5231), 4326))
  AND o.is_vacant = false;
-- Expected: 3 rows for portland-or-council-district-4 (Zimmerman, Green, Clark)

-- Mayor routing via LOCAL_EXEC
SELECT p.full_name, o.title
FROM essentials.districts d
JOIN essentials.offices o ON o.district_id = d.id
JOIN essentials.politicians p ON p.id = o.politician_id
WHERE d.geo_id = '4159000' AND d.district_type = 'LOCAL_EXEC' AND d.state = 'or'
  AND p.external_id = -690001;
-- Expected: Keith Wilson, Mayor
```

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | SQL point-in-polygon queries (no automated test runner for data migrations) |
| Config file | none — verification via direct DB queries |
| Quick run command | SQL via Supabase Management API or pg client |
| Full suite command | All pre-flight + section-split + routing verification queries |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SC-1 | Portland government row + chambers exist | SQL gate | `SELECT COUNT(*) FROM essentials.chambers WHERE government_id=(...)` | ❌ Wave 0 — inline in 77-01 |
| SC-2 | 14+ officials seeded with office_ids | SQL gate | `SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -690021 AND -690001` | ❌ Wave 0 — inline in 77-02 |
| SC-3 | Portland address returns 3 council members + Mayor | Routing SQL | Point-in-polygon query above | ❌ Wave 0 — inline in 77-02 |
| SC-4 | All elected officials have headshots | SQL count | `SELECT COUNT(*) FROM essentials.politician_images pi JOIN essentials.politicians p ON p.id=pi.politician_id WHERE p.external_id BETWEEN -690021 AND -690001 AND p.external_id NOT IN (-690003,-690004)` | ❌ Wave 0 — inline in 77-03 |

### Wave 0 Gaps

- [ ] All verification queries are inline in each plan's tasks — no separate test files required for data migrations (established pattern from Phases 63–68)

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL (Supabase) | All migrations | ✓ | Supabase hosted | — |
| Node.js / tsx | Scripts (if any) | ✓ | project version | — |
| Portland.gov public images | Headshots | ✓ | public URLs | Wikimedia Commons for any 404 |
| Supabase Storage | Headshot upload | ✓ | live | — |

**Missing dependencies with no fallback:** None.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Commission-based government (1 city council, at-large seats) | Mayor-council with 4 multi-member districts, 3 seats each, RCV | Jan 2025 (2022 charter vote) | 12 council offices across 4 districts; no numbered seats |
| Michael Jordan as City Administrator | Raymond C. Lee III as City Administrator | Dec 2025 | CONTEXT.md D-04 name must be updated |
| City Attorney as potentially elected | City Attorney confirmed appointed | 2025 charter (verified) | No chamber/office with is_appointed_position=false for City Attorney |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Full-size portland.gov images available at `/sites/default/files/public/[year]/[filename]` (drop `styles/1_1_160w/` prefix) | Headshot Sources | Broken 404 — use thumbnail fallback or check via browser DevTools |
| A2 | Government `name='City of Portland, Oregon, US'` with `state='OR'` will route correctly through essentialsService.ts | Government Name | Wrong state casing could break routing; use exact casing as in ME precedent |
| A3 | City Administrator chamber is worth creating (optional appointed official) | Chambers | If omitted, no impact on routing; can skip if scope is too large |

**All critical claims (incumbents, City Attorney status, migration number, external_id range) are VERIFIED.**

---

## Open Questions

1. **Are appointed officials (City Attorney, City Administrator) worth seeding at all?**
   - What we know: Berkeley and Fremont omitted appointed positions entirely. SF and SD included them.
   - What's unclear: Phase scope says "City Administrator" is in scope (D-04), but City Attorney is now confirmed appointed — is City Attorney still wanted?
   - Recommendation: Seed City Administrator (D-04 is explicit); seed City Attorney with `is_appointed_position=true` only if planner wants parity with SF. Either way, no chamber and no headshot for both.

2. **Council office title: "City Council Member (District N)" vs "Council Member (District N)"**
   - What we know: CONTEXT.md D-07 says "City Council Member (District N)". Berkeley uses "Council Member (District N)".
   - What's unclear: Portland's own website refers to members as "City Councilor".
   - Recommendation: Honor D-07 locked decision — use "City Council Member (District N)".

---

## Sources

### Primary (HIGH confidence)

- [portland.gov/auditor/elections/elected-city-officials](https://www.portland.gov/auditor/elections/elected-city-officials) — 14 elected official names + terms (fetched 2026-05-29)
- [portland.gov/charter/2/2](https://www.portland.gov/charter/2/2) — Article 2: elective offices confirmed as Mayor, Auditor, 12 Councilors only (fetched 2026-05-29)
- [portland.gov/attorney/general-information-and-staff](https://www.portland.gov/attorney/general-information-and-staff) — City Attorney Robert L. Taylor confirmed appointed (fetched 2026-05-29)
- [portland.gov/administration/raymond-c-lee-iii](https://www.portland.gov/administration/raymond-c-lee-iii) — City Administrator Raymond C. Lee III confirmed Dec 2025 (fetched 2026-05-29)
- DB direct query (Supabase/pg client, 2026-05-29) — external_id range, migration ledger, Portland OR government non-existence, council districts confirmed

### Secondary (MEDIUM confidence)

- [portland.gov/council](https://www.portland.gov/council) — Council roster corroborating the elected-officials page (fetched 2026-05-29)
- Individual councilor profile pages on portland.gov — headshot URL patterns confirmed for Smith, Dunphy, Green, Koyama Lane, Morillo, Ryan (fetched 2026-05-29)
- [portland.gov/auditor/simone-rede](https://www.portland.gov/auditor/simone-rede) — Auditor headshot URL confirmed (fetched 2026-05-29)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all patterns from prior phases 63–68
- Architecture: HIGH — DB-verified pre-flight; established patterns
- Incumbent names: HIGH — verified directly from official Portland Auditor elections page
- City Attorney status: HIGH — verified from charter text + city attorney office page
- Headshot sources: MEDIUM — URL patterns confirmed for ~8 of 14 officials; remaining 6 follow same pattern
- Pitfalls: HIGH — based on verified findings

**Research date:** 2026-05-29
**Valid until:** 2026-12-01 (stable — elected officials serve until 2026 or 2028; City Administrator could change)
