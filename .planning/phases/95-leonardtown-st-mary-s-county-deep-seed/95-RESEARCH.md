# Phase 95: Leonardtown / St. Mary's County Deep Seed - Research

**Researched:** 2026-06-05
**Domain:** Maryland local government seeding — county commission + incorporated town
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Seed elected officials only. No County Administrator, Town Manager, or other appointed staff.
- **D-02:** Two plans — Plan 95-01 (both government seedings, two migrations) + Plan 95-02 (headshots + verification).
- **D-03:** Official government website is the sole headshot source. If no photo found, document the gap — no LinkedIn, news, or social media.
- **D-04:** Headshots at 600x750 (4:5, Lanczos, q90) — crop first, then resize. Stored in `politician_photos` bucket at `{politician_id}-headshot.jpg`.

### Claude's Discretion

- External ID range for St. Mary's County officials: `-24037001` through `-24037009`
- External ID range for Leonardtown officials: `-2446475001` through `-2446475009` (see geo_id confirmation below — use geo_id `2446475` not `2443700`)
- Migration numbering: start from 276 (confirmed below)
- Post-verification DO block pattern in each migration (gates: government row count, offices count, section-split detector)
- Headshot script name: `md_local_headshots.py`

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MD-DEEP-01 | St. Mary's County government + Board of County Commissioners chamber seeded; county boundary linked | Geofence `geo_id='24037'` confirmed in DB; government name, type, chamber name, COUNTY district pattern all resolved |
| MD-DEEP-02 | Active St. Mary's County Commissioners seeded with offices + available headshots | All 5 commissioner names, titles, and photo URLs verified live from stmaryscountymd.gov |
| MD-DEEP-03 | Town of Leonardtown government + town officials seeded with available headshots | All 6 Leonardtown officials (Mayor + 5 Council) verified from official site + MD State Archives; all 6 photos confirmed live (Referer header required) |
</phase_requirements>

---

## Summary

Phase 95 seeds two local Maryland governments — St. Mary's County Board of County Commissioners and the Town of Leonardtown — into the database. Both geofence boundaries are already present from Phase 91. Both governments require a fresh government row, chamber, COUNTY/LOCAL district, politicians, offices, and office_id back-fill. All 11 officials have been identified and verified from authoritative sources. All headshots are available from official government websites.

**Critical discovery:** The Town of Leonardtown held a May 5, 2026 election. Three council seats (Earhart, Hollander, Slade) were up for election and all three incumbents won re-election. The website still shows incumbent names — the roster is current and accurate as of 2026-06-05.

**D-05 resolution (now CONFIRMED):** St. Mary's County commissioners use **Option A — all effectively at-large** for DB modeling purposes. The county has no sub-district geofence boundaries in our DB (only the G4020 county boundary exists). All 5 commissioners are elected county-wide by all St. Mary's County voters (district commissioners just need to reside in their district). Use ONE `COUNTY` district row (geo_id='24037') and five office rows all pointing to it. This matches the Multnomah County precedent exactly.

**Primary recommendation:** Follow migration 244 (Multnomah County) as the template for both government migrations. The structure is identical: government row → chamber → COUNTY/LOCAL district → politicians + offices via WITH CTE pattern → office_id back-fill → post-verification DO block.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Government/chamber seeding | Database (SQL migration) | — | Pure DB data; no API or UI changes |
| Address routing to local officials | Database (PostGIS) | — | Districts rows with correct geo_id + state='md' enable ST_Covers JOIN |
| Headshot processing | Python script (local) | Supabase Storage | Pillow crop/resize + REST upload + psycopg2 DB insert |
| Headshot display | Frontend (existing) | — | No UI changes; existing politician_images.type='default' filter handles it |
| Verification | DB query + manual | — | Section-split detector + UI spot-check |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Pillow | 10.x [ASSUMED] | Image crop/resize | Used in all prior headshot scripts (md_executives_headshots.py) |
| psycopg2-binary | 2.9.x [ASSUMED] | DB write for politician_images | essentials schema not exposed via Supabase REST API |
| urllib (stdlib) | stdlib | Image download + Storage upload | No external dep; proven in all prior scripts |
| PostgreSQL SQL | — | Migrations | All government seeding uses raw SQL via Supabase MCP |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Supabase MCP tool | — | Execute migration SQL | mcp__supabase-local__execute_sql for applying migrations |

**Installation:** Pillow and psycopg2 are already installed from prior phases (md_executives_headshots.py and md_senators_headshots.py). No new installs expected.

---

## Package Legitimacy Audit

No new packages are introduced in this phase. All dependencies (Pillow, psycopg2-binary, urllib) were installed and validated in prior phases (92-94).

**Packages removed due to slopcheck:** none
**Packages flagged as suspicious:** none

---

## Architecture Patterns

### System Architecture Diagram

```
Address lookup (St. Mary's County address)
        |
        v
PostGIS ST_Covers query
        |
  geofence_boundaries (geo_id='24037', mtfcc='G4020')  [Phase 91]
        |
  districts (geo_id='24037', district_type='COUNTY', state='md')  [Migration 276 - NEW]
        |
  offices --> politicians  [Migration 276 - NEW]
        |
  API response: commissioners appear in COUNTY section

Address lookup (Leonardtown address)
        |
        v
PostGIS ST_Covers query
        |
  geofence_boundaries (geo_id='2446475', mtfcc='G4110')  [Phase 91]
        |
  districts (geo_id='2446475', district_type='LOCAL', state='md')  [Migration 277 - NEW]
        |
  offices --> politicians  [Migration 277 - NEW]
        |
  API response: Leonardtown officials appear in LOCAL section

Headshots (Plan 95-02):
  Official websites --> curl download --> Pillow crop/resize --> Supabase Storage upload
        |
  psycopg2 INSERT politician_images (type='default')
        |
  UI: politician profile page renders headshot
```

### Recommended Migration Structure

```
Migration 276: St. Mary's County government + commissioners
  Step 1: government row (INSERT ... WHERE NOT EXISTS)
  Step 2: Board of County Commissioners chamber (INSERT ... WHERE NOT EXISTS)
  Step 3: COUNTY district row (geo_id='24037', state='md', mtfcc='G4020')
  Step 4: 5 politician blocks (President + Commissioners D1-D4) via WITH CTE
  Step 5: office_id back-fill (WHERE office_id IS NULL)
  Step 6: Post-verification DO block (3 gates)
  Step 7: Migration ledger entry

Migration 277: Town of Leonardtown government + officials
  Step 1: government row (INSERT ... WHERE NOT EXISTS)
  Step 2: Town Council chamber (INSERT ... WHERE NOT EXISTS)
  Step 3: LOCAL district row (geo_id='2446475', state='md', mtfcc='G4110')
  Step 4: 6 politician blocks (Mayor + 5 Council Members) via WITH CTE
  Step 5: office_id back-fill (WHERE office_id IS NULL)
  Step 6: Post-verification DO block (3 gates)
  Step 7: Migration ledger entry
```

### Pattern: WITH CTE Politician + Office Insert (from migration 244)

```sql
-- Source: C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'James R. Guy', 'James', 'Guy', NULL,
          true, false, false, true, -24037001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Board of County Commissioners'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'St. Mary''s County, Maryland, US')),
       p.id,
       'President, Board of County Commissioners', 'MD', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '24037'
  AND d.district_type = 'COUNTY'
  AND d.state = 'md'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

### Pattern: Post-Verification DO Block

```sql
-- Source: C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql
DO $$
DECLARE
  v_gov_count INTEGER;
  v_office_count INTEGER;
  v_split_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_gov_count FROM essentials.governments
  WHERE name = 'St. Mary''s County, Maryland, US';
  IF v_gov_count <> 1 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 1 govt row, found %', v_gov_count;
  END IF;

  SELECT COUNT(*) INTO v_office_count
  FROM essentials.offices o
  JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.geo_id = '24037' AND d.district_type = 'COUNTY' AND d.state = 'md';
  IF v_office_count <> 5 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 5 offices, found %', v_office_count;
  END IF;

  SELECT COUNT(*) INTO v_split_count
  FROM essentials.geofence_boundaries gb
  WHERE gb.geo_id = '24037' AND gb.mtfcc = 'G4020'
    AND NOT EXISTS (
      SELECT 1 FROM essentials.districts d
      WHERE d.geo_id = gb.geo_id AND d.district_type = 'COUNTY' AND d.state = 'md'
    );
  IF v_split_count <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: section-split detector returned % orphan rows', v_split_count;
  END IF;

  RAISE NOTICE 'Post-verification PASSED: gov_count=%, office_count=%, split_orphans=%',
    v_gov_count, v_office_count, v_split_count;
END $$;
```

### Pattern: Headshot Script (Python)

```python
# Source: scripts/md_executives_headshots.py (established template)
# Key: Referer header required for Leonardtown images (hotlink protection)
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...',
    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
    'Referer': 'https://leonardtown.somd.com/government/government-initial.htm',
}
# Crop to 4:5 FIRST, then resize to 600x750 Lanczos q90
# Upload to politician_photos bucket at {politician_id}-headshot.jpg
# INSERT politician_images (type='default', photo_license='public_domain') via psycopg2
```

### Anti-Patterns to Avoid

- **Including `slug` in chamber INSERT:** `slug` is GENERATED ALWAYS on `essentials.chambers` — never list it in INSERT column list or the statement errors.
- **Omitting WHERE NOT EXISTS on governments:** `essentials.governments` has no unique constraint on `geo_id` — without the guard, re-runs create duplicate rows.
- **Using uppercase `state='MD'` on COUNTY district:** For COUNTY and LOCAL district types, `state='md'` must be lowercase to match the PostGIS routing query. Only NATIONAL_LOWER uses uppercase `'MD'`.
- **Using uppercase `state='MD'` on LOCAL district:** Same rule — Leonardtown district row uses `state='md'` (lowercase).
- **Fetching Leonardtown photos without Referer header:** The site returns HTTP 403 without a Referer; the headshot script must include `Referer: https://leonardtown.somd.com/government/government-initial.htm`.
- **Using `type='headshot'` in politician_images:** The correct value is `type='default'`. The UI filters with `.find(img => img.type === 'default')`.

---

## Verified Roster Data

### St. Mary's County Board of County Commissioners

**Source:** [VERIFIED: stmaryscountymd.gov/csmc/] — fetched 2026-06-05
**Election model (D-05 RESOLVED):** All 5 commissioners elected county-wide by all St. Mary's County voters. District commissioners must reside in their district. No sub-district geofence boundaries in DB. DB model: **Option A — one COUNTY district row, 5 offices.**

| external_id | full_name | first_name | last_name | Title (office.title) | Photo URL |
|-------------|-----------|------------|-----------|----------------------|-----------|
| -24037001 | James R. Guy | James | Guy | President, Board of County Commissioners | `https://www.stmaryscountymd.gov/_Media/Global/Headshots/guy_james.jpg` |
| -24037002 | Eric Colvin | Eric | Colvin | Commissioner, District 1 | `https://www.stmaryscountymd.gov/_Media/Global/Headshots/colvin_eric.jpg` |
| -24037003 | Michael L. Hewitt | Michael | Hewitt | Commissioner, District 2 | `https://www.stmaryscountymd.gov/_Media/Global/Headshots/hewitt_michael.jpg` |
| -24037004 | Mike Alderson, Jr. | Mike | Alderson | Commissioner, District 3 | `https://www.stmaryscountymd.gov/_Media/Global/Headshots/alderson_mike.jpg` |
| -24037005 | Scott R. Ostrow | Scott | Ostrow | Commissioner, District 4 | `https://www.stmaryscountymd.gov/_Media/Global/Headshots/ostrow_scott.jpg` |

**Photo status:** All 5 URLs verified HTTP 200 (2026-06-05). No Referer header needed.
**photo_license:** `public_domain` (official government portraits).

**Note on title format:** The supervisor of elections page labels them "1st Commissioners District" etc., but the official CSMC page uses district number format. Use `Commissioner, District N` for consistency with internal project conventions (parallel to "Commissioner (District N)" pattern from Multnomah County). The President uses the formal full title: `President, Board of County Commissioners`.

**Note on James R. Guy:** Goes by "Randy" but full legal name is James R. Guy. Use `full_name='James R. Guy'`, `first_name='James'`, `last_name='Guy'`.

**Note on Mike Alderson:** Full name is "Mike Alderson, Jr." — include the suffix.

### Town of Leonardtown

**Source:** [VERIFIED: leonardtown.somd.com/government/government-initial.htm] fetched 2026-06-05, cross-referenced with [VERIFIED: msa.maryland.gov/msa/mdmanual/37mun/leonard/html/l.html] (MD State Archives Manual)

**2026 election confirmed:** May 5, 2026 election held. Three seats up for renewal (term ending May 2026). All three incumbents won. Roster post-election is current.

**Election results (from official 2026ElectionResults.pdf):**
- Mary Maday Slade — 244 votes (winner)
- Christy Sterling Hollander — 202 votes (winner) — note: name on 2026 ballot is "Christy Sterling Hollander" (vs "Maria C. (Christy) Hollander" in old docs)
- Heather M. Earhart — 188 votes (winner)
- Rodney Flowers — 128 votes (loser)
- Ken Held — 93 votes (loser)

**Current full roster (as of 2026-06-05):**

| external_id | full_name | first_name | last_name | Title (office.title) | Term ends | Photo URL |
|-------------|-----------|------------|-----------|----------------------|-----------|-----------|
| -2446475001 | Daniel W. Burris | Daniel | Burris | Mayor | May 2028 | `https://leonardtown.somd.com/government/TownCouncil/Mayor%20Dan%20Burris.JPG` |
| -2446475002 | J. Maguire Mattingly IV | Jay | Mattingly | Council Member | May 2028 | `https://leonardtown.somd.com/government/TownCouncil/JayMattingly.JPG` |
| -2446475003 | Nick B. Colvin | Nick | Colvin | Council Member | May 2028 | `https://leonardtown.somd.com/government/TownCouncil/NickColvin.JPG` |
| -2446475004 | Heather M. Earhart | Heather | Earhart | Council Member | May 2030 | `https://leonardtown.somd.com/government/TownCouncil/HeatherEarhart.jpg` |
| -2446475005 | Christy Hollander | Christy | Hollander | Council Member | May 2030 | `https://leonardtown.somd.com/government/TownCouncil/ChristyHollander.JPG` |
| -2446475006 | Mary Maday Slade | Mary | Slade | Council Member | May 2030 | `https://leonardtown.somd.com/government/TownCouncil/MarySlade.JPG` |

**Photo status:** HeatherEarhart.jpg is HTTP 200 directly. All 5 others require `Referer: https://leonardtown.somd.com/government/government-initial.htm` — confirmed HTTP 200 with Referer. Headshot script MUST send Referer header for all Leonardtown photos.

**photo_license:** `public_domain` (official government website portraits).

**Note on J. Maguire Mattingly IV:** Full name is "J. Maguire 'Jay' Mattingly IV". Use `full_name='J. Maguire Mattingly IV'`, `first_name='Jay'`, `last_name='Mattingly'`. The Vice President title is chosen by Council, not elected — do NOT use "Vice President" as the office title; use `Council Member` for all 5 council seats.

**Note on Christy Hollander:** Official website shows "Christy Hollander" and "Maria C. (Christy) Hollander"; the 2026 ballot used "Christy Sterling Hollander". Use `full_name='Christy Hollander'` (matching the official government page display name) unless the planner prefers the ballot name.

---

## Geofence Verification Results

All confirmed via direct psql query against production DB (2026-06-05):

| Query | Result | Status |
|-------|--------|--------|
| `WHERE state='24' AND mtfcc='G4020' AND geo_id='24037'` | `24037 | St. Mary's County | G4020` | CONFIRMED |
| `WHERE state='24' AND mtfcc='G4110' AND name ILIKE '%leonardtown%'` | `2446475 | Leonardtown town | G4110` | CONFIRMED |

**Key finding for CONTEXT.md:** The Leonardtown geo_id is `2446475` — NOT `2443700` as the CONTEXT.md estimated. The external ID range in Claude's Discretion used `2443700` as estimated FIPS; correct the external IDs to use `2446475` as the geo_id component: `-2446475001` through `-2446475009`.

**Existing governments check:** No government rows exist yet for St. Mary's County or Leonardtown. Clean slate — no WHERE NOT EXISTS false-positive risk.

---

## Migration Counter Verification

**File system check:** Highest migration file is `275_md_federal_officials.sql`. [VERIFIED: ls C:/EV-Accounts/backend/migrations/]

**DB ledger check:** Short-form ledger only shows through `269` — migrations 270-275 were applied via Supabase MCP (different tracking mechanism). Data confirmed present for all 270-275 via row count queries.

**Next migration:** **276** for St. Mary's County; **277** for Leonardtown. [VERIFIED]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Geofence boundary linking | Custom geo lookup | `districts` row with matching `geo_id` | PostGIS ST_Covers JOIN on `geo_id` is the routing mechanism |
| Idempotency on government INSERT | Custom UPSERT | `WHERE NOT EXISTS` guard | `governments` table has no unique constraint on `geo_id` |
| Image crop/resize | Manual PIL code from scratch | Copy `crop_and_resize()` from `md_executives_headshots.py` | Pattern already validated: center crop for wide images, top crop for tall images |
| Headshot DB insert | Custom SQL string | Copy `insert_politician_image()` from `md_executives_headshots.py` | Pattern handles `WHERE NOT EXISTS` guard correctly |

---

## Common Pitfalls

### Pitfall 1: Wrong geo_id for Leonardtown External IDs
**What goes wrong:** CONTEXT.md estimated Leonardtown geo_id as `2443700` for external ID range. Actual DB geo_id is `2446475`.
**Why it happens:** Census FIPS place codes don't directly match the geo_id stored in geofence_boundaries (which uses GEOID from TIGER).
**How to avoid:** Always run the DB query to confirm geo_id before writing migrations. The confirmed geo_id is `2446475`. Use external IDs `-2446475001` through `-2446475006` for the 6 Leonardtown officials.
**Warning signs:** If a district INSERT uses `geo_id='2443700'`, ST_Covers will find no match and the officials won't appear in lookups.

### Pitfall 2: Leonardtown Photo 403 Without Referer
**What goes wrong:** 5 of 6 Leonardtown photo URLs return HTTP 403 when fetched without a Referer header (hotlink protection on leonardtown.somd.com).
**Why it happens:** The site checks Referer to prevent off-site hotlinking.
**How to avoid:** Add `Referer: https://leonardtown.somd.com/government/government-initial.htm` to all download requests in `md_local_headshots.py`.
**Warning signs:** HTTP 403 in download log for Leonardtown officials.

### Pitfall 3: Slug Column in Chamber INSERT
**What goes wrong:** Including `slug` in the INSERT column list causes a PostgreSQL error: "column 'slug' is a generated column."
**Why it happens:** `essentials.chambers.slug` is GENERATED ALWAYS.
**How to avoid:** Only include `(id, name, name_formal, government_id)` in the INSERT. Never list `slug`.

### Pitfall 4: Uppercase state='MD' on COUNTY/LOCAL Districts
**What goes wrong:** If `districts.state='MD'` (uppercase) is used for the COUNTY or LOCAL district, address lookups return no officials — the PostGIS routing query joins on lowercase state.
**Why it happens:** Casing rule is non-obvious: governments table uses uppercase, districts table uses lowercase for STATE/COUNTY/LOCAL types.
**How to avoid:** Use `state='md'` (lowercase) on all COUNTY and LOCAL district rows. Only NATIONAL_LOWER and NATIONAL_UPPER use uppercase `'MD'`.

### Pitfall 5: Vice President Title for Mattingly
**What goes wrong:** The Leonardtown website describes Mattingly as "Vice President" (a council-chosen role). If this is used as office.title, it implies a separately-elected office.
**Why it happens:** Councils often elect their own presiding officer from among elected members.
**How to avoid:** Use `title='Council Member'` for all 5 council members including Mattingly. The Vice President designation is internal council organization, not an elected office.

### Pitfall 6: Christy Hollander Name Variant
**What goes wrong:** The name "Christy Sterling Hollander" appears on the 2026 ballot and election results. Using this full name may differ from what the official government page shows.
**Why it happens:** Legal name vs. preferred name discrepancy.
**How to avoid:** Use `full_name='Christy Hollander'` matching the government website display. The ballot name includes the middle name "Sterling" but the official roster and website use the shorter form.

### Pitfall 7: Missing Migration Ledger Entry for 270-275
**What goes wrong:** If someone checks the DB ledger expecting to see migrations 270-275, they find only 269 and assume migrations haven't been applied.
**Why it happens:** Migrations 270-275 were applied via Supabase MCP which uses a different tracking format (timestamp-based). The data exists — confirmed by row counts.
**How to avoid:** For migrations 276 and 277, include the ledger entry: `INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('276') ON CONFLICT (version) DO NOTHING;` — this is the pattern from migration 244 and matches the short-form IDs already in the ledger for 257-269.

---

## Code Examples

### Government Row INSERT (St. Mary's County)
```sql
-- Source: C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql (adapted)
-- Note: governments.state uses UPPERCASE 'MD' (governments table convention)
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'St. Mary''s County, Maryland, US',
       'County', 'MD', NULL, '24037'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'St. Mary''s County, Maryland, US'
);
```

### Chamber INSERT (no slug column)
```sql
-- Source: C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql (adapted)
-- CRITICAL: slug is GENERATED ALWAYS — never include in INSERT
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'Board of County Commissioners',
       'St. Mary''s County Board of County Commissioners',
       (SELECT id FROM essentials.governments
        WHERE name = 'St. Mary''s County, Maryland, US')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Board of County Commissioners'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'St. Mary''s County, Maryland, US')
);
```

### COUNTY District INSERT (St. Mary's County)
```sql
-- Source: C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql (adapted)
-- CRITICAL: state='md' LOWERCASE for COUNTY type
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'COUNTY', 'md', '24037', 'St. Mary''s County', 'G4020'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '24037' AND district_type = 'COUNTY' AND state = 'md'
);
```

### LOCAL District INSERT (Leonardtown)
```sql
-- CRITICAL: state='md' LOWERCASE for LOCAL type
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'md', '2446475', 'Leonardtown', 'G4110'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '2446475' AND district_type = 'LOCAL' AND state = 'md'
);
```

### Python Download with Referer (Leonardtown)
```python
# Source: scripts/md_executives_headshots.py (adapted)
# Leonardtown requires Referer header to bypass hotlink protection
def download_leonardtown_image(url: str, name: str) -> bytes:
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': 'https://leonardtown.somd.com/government/government-initial.htm',
    }
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=45) as resp:
        return resp.read()
```

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| psql (PostgreSQL CLI) | DB queries + verification | Yes | confirmed working | — |
| Python 3 | Headshot script | Yes | confirmed working | — |
| Pillow | Image processing | Yes (prior phases) | installed | — |
| psycopg2-binary | DB write for images | Yes (prior phases) | installed | — |
| Supabase MCP | Migration execution | Yes | mcp__supabase-local__execute_sql | — |
| stmaryscountymd.gov | Commissioner headshots | Yes (HTTP 200) | — | — |
| leonardtown.somd.com | Council headshots | Yes (HTTP 200 w/ Referer) | — | — |

**Missing dependencies with no fallback:** None.

---

## Validation Architecture

Phase 95 is a DB-seeding phase with no automated test suite. Validation is via SQL gate queries and manual UI spot-check.

### Phase Requirements → Verification Map

| Req ID | Behavior | Verification Type | Command |
|--------|----------|-------------------|---------|
| MD-DEEP-01 | St. Mary's County govt + chamber seeded; county boundary linked | SQL gate in migration | Post-verification DO block in migration 276 |
| MD-DEEP-01 | Section-split detector = 0 | SQL gate | `SELECT COUNT(*) FROM geofence_boundaries gb WHERE gb.geo_id='24037' AND NOT EXISTS (SELECT 1 FROM districts d WHERE d.geo_id=gb.geo_id AND d.district_type='COUNTY')` |
| MD-DEEP-02 | 5 commissioners seeded with offices | SQL gate in migration | Post-verification DO block (v_office_count=5) |
| MD-DEEP-02 | Headshots uploaded | Python script output | Script exits 0 with no ERROR lines |
| MD-DEEP-03 | Leonardtown govt + 6 officials seeded | SQL gate in migration | Post-verification DO block in migration 277 (v_office_count=6) |
| MD-DEEP-03 | Leonardtown headshots uploaded | Python script output | Script exits 0 with no ERROR lines |
| All | Address lookup works | Manual UI spot-check | Navigate to app with St. Mary's County address + Leonardtown address; verify officials appear |

### Wave 0 Gaps
- No test infrastructure exists for migration phases — this is by design. Verification is embedded in post-verification DO blocks within each migration.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Upload headshots to `politician-headshots` bucket | Use `politician_photos` bucket | Phase 92 | Must not create new bucket; use existing |
| Storing district labels with geographic specificity | All county-wide-elected commissioners share one COUNTY district | Phase 83+ | Simplifies routing; no sub-district geofences needed |
| photo_license='cc_by' | photo_license='public_domain' | Phase 92 | Official government portraits are public domain |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Pillow and psycopg2 are already installed from prior phases | Standard Stack | Minor: add `pip install` step to Plan 95-02 if missing |
| A2 | `full_name='Christy Hollander'` is preferred over 'Christy Sterling Hollander' | Roster Data | Minor cosmetic: can update if user prefers ballot name |
| A3 | `districts.district_type='LOCAL'` is the correct value for incorporated town level | Architecture Patterns | HIGH: if wrong, address routing won't return Leonardtown officials; check existing LOCAL districts in DB before writing migration |

**A3 verification query (run before writing migration 277):**
```sql
SELECT DISTINCT district_type FROM essentials.districts WHERE district_type LIKE 'LOCAL%';
-- Also check a known incorporated place district:
SELECT geo_id, district_type, state, mtfcc FROM essentials.districts WHERE mtfcc='G4110' LIMIT 5;
```

---

## Open Questions

1. **district_type for Leonardtown (A3)**
   - What we know: COUNTY district type confirmed for county-level governments (Multnomah precedent). G4110 incorporated places likely use LOCAL or a specific type.
   - What's unclear: Whether an existing `LOCAL` district_type enum value exists and is used for G4110 places in this project.
   - Recommendation: Run the verification query above as the FIRST action in Plan 95-01 before writing migration 277. If LOCAL is not used, check the Collin County TX G4110 migrations for the established pattern.

2. **Christy Hollander name**
   - What we know: Government website shows "Christy Hollander"; 2026 ballot shows "Christy Sterling Hollander".
   - What's unclear: User preference.
   - Recommendation: Use "Christy Hollander" (government website display name) unless the user prefers the ballot name.

---

## Sources

### Primary (HIGH confidence)
- `stmaryscountymd.gov/csmc/` — Commissioner roster, titles, photo URL pattern; fetched 2026-06-05
- `stmaryscountymd.gov/supervisorofelections/electedofficials/` — Confirmed election model (President at-large + 4 district seats, all elected county-wide)
- `leonardtown.somd.com/government/government-initial.htm` — Full council roster, terms, photo URLs; fetched 2026-06-05
- `leonardtown.somd.com/government/2026ElectionResults.pdf` — 2026 election results confirming all 3 incumbents won; fetched 2026-06-05
- `msa.maryland.gov/msa/mdmanual/37mun/leonard/html/l.html` — MD State Archives: Leonardtown roster, terms; cross-referenced 2026-06-05
- Direct psql queries against production DB — confirmed geo_ids, no existing government rows, migration counter
- `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql` — Template migration; all SQL patterns sourced from here

### Secondary (MEDIUM confidence)
- `runforoffice.org/elected_offices/146902-st-mary-s-county-commissioner-at-large` — Corroborates at-large election model

### Tertiary (LOW confidence)
- WebSearch result stating "Thomas F. McKay" was Commissioner President in 2022 — not relevant to current roster (Guy replaced McKay)

---

## Metadata

**Confidence breakdown:**
- Roster data (St. Mary's County): HIGH — fetched directly from official government website
- Roster data (Leonardtown): HIGH — fetched from official site, confirmed by 2026 election results PDF and MD State Archives
- Geofence geo_ids: HIGH — confirmed via direct DB query
- Election model (D-05): HIGH — confirmed via official elections page
- Photo URLs (St. Mary's County): HIGH — all 5 URLs verified HTTP 200
- Photo URLs (Leonardtown): HIGH — all 6 URLs verified HTTP 200 (with Referer)
- Migration counter: HIGH — confirmed via file system listing + data verification
- district_type for LOCAL: MEDIUM — assumed based on district_type naming convention; verify before writing migration 277

**Research date:** 2026-06-05
**Valid until:** 2026-12-01 (stable local government; next Leonardtown election is May 2028 for Mayor+2; next St. Mary's County election is 2026 general for all 5 seats — check if any results change the roster before executing Plan 95-01)
