# Phase 92: MD State Government DB - Research

**Researched:** 2026-06-05
**Domain:** PostgreSQL DB seeding — MD executive branch government scaffolding
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Aruna Miller (LG) gets her own standalone chamber (`Lieutenant Governor`) and her own `STATE_EXEC` district. Do NOT model her under the Governor's chamber. 5 chambers total.

**D-02:** Dereck Davis (MD State Treasurer) is seeded in this phase (not deferred). Full executive branch in one migration pass.

**D-03:** Dereck Davis `is_appointed_position=true` on his office row; `is_appointed=true` on his politician row.

### Claude's Discretion

- Exact headshot sources for all 5 officials (researched and documented below).
- Migration numbers are 269/270 (verify via directory listing — researched below).
- Pre-flight assertion structure: verify State of Maryland row DOES already exist before inserting chambers (unlike CA where a state row pre-existed, MD also pre-exists — from migration 174).
- Smoke test assertions for Phase 92 are optional; researcher recommends including a quick executive-presence query.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MD-GOV-01 | MD state government row + 5 constitutional officer chambers seeded (Governor, LG, AG, Comptroller, State Treasurer) | Government row pre-exists from migration 174 — chambers migration only needs assert+insert pattern from OR migration 222 |
| MD-GOV-02 | Governor Wes Moore + LG Aruna Miller + AG Anthony Brown + Comptroller Brooke Lierman seeded with offices + headshots at 600×750 | Officials migration follows OR migration 223 CTE pattern; headshot URLs verified and accessible (documented below) |
| MD-GOV-06 | All MD officials have headshots at 600×750 in Supabase Storage (executives portion) | Dereck Davis headshot sourced from Wikimedia Commons; all 5 URLs verified HTTP 200 |
</phase_requirements>

---

## Summary

Maryland's executive branch seeding follows the OR pattern (migrations 222/223) almost exactly, with one critical difference: the "State of Maryland" government row was already seeded in **migration 174** (`174_senate_infrastructure.sql`) as part of a bulk 50-state government stub creation. This means Migration A (chambers) does NOT insert the government row — it asserts the row already exists (exactly 1 row) and creates the 5 chamber scaffolds under it.

The OR short-name chamber convention is the correct precedent: `name='Governor'`, `name_formal='Governor of Maryland'`. All 5 STATE_EXEC districts use `state='MD'` (uppercase) and `geo_id='24'` — the OR 223a fix confirmed that STATE_EXEC rows must use the uppercase postal abbreviation, not the loader's lowercase `'md'`.

Headshot research confirmed accessible official photo URLs for all 5 officials. The Maryland Governor's and Lieutenant Governor's office both serve photos via `cdn.maryland.gov` as WebP images. The Comptroller's site serves a direct PNG. The AG's office has a 512×512 JPEG. Dereck Davis has a recent Wikimedia Commons crop photo. All are downloadable without authentication.

**Primary recommendation:** Follow OR migrations 222/223 as the exact template. The key MD-specific adjustments are: (1) assert government row exists (not insert), (2) 5 separate STATE_EXEC districts (ME pattern, not OR shared district), (3) `is_appointed_position=true` for State Treasurer only, (4) migration numbers 269/270.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Government row assertion | Database / Migration | — | Row pre-exists from migration 174; only a pre-flight assertion needed |
| Chamber scaffolding | Database / Migration | — | 5 INSERT WITH WHERE NOT EXISTS guards |
| STATE_EXEC districts | Database / Migration | — | 5 separate districts (one per office), ME pattern |
| Politicians + Offices | Database / Migration | — | CTE pattern from OR migration 223 |
| office_id back-fill | Database / Migration | — | UPDATE after all inserts, scoped to -240010..-240001 |
| Headshot download + resize | Local tooling (Python/PIL or ImageMagick) | — | Download from source → crop 4:5 → resize 600×750 Lanczos q90 |
| Headshot upload | Supabase Storage via MCP | — | `mcp__supabase-local__storage_upload` or equivalent |
| politician_images row | Database / Migration or direct insert | — | `url` column (not `storage_url`) with `type='default'` |

---

## Critical Pre-Research Findings

### Government Row Already Exists (Pre-empts Migration A's INSERT)

**VERIFIED** via `psql` query 2026-06-05:

```sql
SELECT name, type, state, geo_id FROM essentials.governments WHERE name = 'State of Maryland';
-- Result: 1 row — name='State of Maryland', type='STATE', state='MD', geo_id='24'
-- UUID: 85973301-a859-45c8-9b58-4a14ab7b44ab
```

The row was seeded in `174_senate_infrastructure.sql` (bulk 50-state government stub). Migration A must NOT insert this row — it asserts it exists (exactly 1) and proceeds to create chambers.

**No MD chambers exist yet:**
```sql
-- chambers with government_id = State of Maryland: 0 rows
-- districts with district_type='STATE_EXEC' AND state='MD': 0 rows
-- politicians with external_id BETWEEN -240010 AND -240001: 0 rows
```

### Next Migration Number: 269

**VERIFIED** via `SELECT MAX(version) FROM supabase_migrations.schema_migrations`:
- Tracked max version in DB: **267**
- `268_finance_summary_column.sql` exists on disk but was applied via Supabase dashboard (not tracked as version 268 in `schema_migrations`)
- Next file to create: **269** (then **270** for executives)
- Migration file names: `269_md_government_chambers.sql` / `270_md_state_executives.sql`

**STATE.md says "Next migration: 268" — THIS IS STALE.** The actual next free number is 269.

### politician_images Schema — Column is `url`, NOT `storage_url`

The CONTEXT.md incorrectly lists `storage_url` as a column on `politician_images`. **VERIFIED** via `information_schema.columns`:

```sql
-- Actual columns: id, politician_id, url, type, photo_license, focal_point
-- 'storage_url' does not exist — the column is 'url'
```

Live storage URL pattern (confirmed from existing rows):
```
https://kxsdzaojfaibhuzmclfq.supabase.co/storage/v1/object/public/politician_photos/{politician_id}/default.jpg
```

---

## Standard Stack

### Core
| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| PostgreSQL | 18.x (production) | Migration execution | via psql or mcp__supabase-local__apply_migration |
| Supabase Storage | — | Headshot hosting | bucket: `politician_photos` |
| Python / PIL (Pillow) or ImageMagick | system | 600×750 headshot processing | crop → resize Lanczos q90 |

No npm packages or new dependencies. Pure DB migration + headshot upload work.

---

## Package Legitimacy Audit

> No external packages installed in this phase. Section not applicable.

---

## Architecture Patterns

### System Architecture Diagram

```
Official website headshots (cdn.maryland.gov, oag.maryland.gov, etc.)
          |
          v
Local download + crop (4:5) + resize (600×750 Lanczos q90)
          |
          v
Supabase Storage upload → politician_photos/{politician_id}/default.jpg
          |
          v
Migration 270: INSERT essentials.politician_images (politician_id, url, type='default')
          |
Migration 269: INSERT essentials.chambers (5 rows under State of Maryland government_id)
          |
Migration 270: INSERT essentials.districts (5 STATE_EXEC rows, state='MD', geo_id='24')
          |
Migration 270: INSERT essentials.politicians (5 rows, external_ids -240001..-240005)
          |
Migration 270: INSERT essentials.offices (5 rows, CTE pattern)
          |
Migration 270: UPDATE essentials.politicians SET office_id (back-fill)
```

### Recommended Migration Structure

```
C:/EV-Accounts/backend/migrations/
├── 269_md_government_chambers.sql    # Assert gov row + 5 chamber INSERTs
└── 270_md_state_executives.sql       # 5 districts + 5 politicians + offices + back-fill
```

### Pattern 1: Migration A — Chambers (from OR migration 222)

**What:** Assert government row exists exactly once; create 5 chamber scaffolds with WHERE NOT EXISTS guards.

**Critical difference from ME:** MD government row pre-exists from migration 174. Use an ASSERT (expect 1 row), NOT an INSERT. If the assert fails (0 or >1 rows), RAISE EXCEPTION.

**Source:** `C:/EV-Accounts/backend/migrations/222_or_government_chambers.sql` [VERIFIED: read in full]

```sql
-- Migration 269: 5 MD executive chambers under the existing State of Maryland government row
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

-- Governor chamber
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

-- Lieutenant Governor chamber (D-01: standalone, not under Governor)
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'Lieutenant Governor',
       'Lieutenant Governor of Maryland',
       (SELECT id FROM essentials.governments WHERE name = 'State of Maryland' AND state = 'MD')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Lieutenant Governor'
    AND government_id = (SELECT id FROM essentials.governments WHERE name = 'State of Maryland' AND state = 'MD')
);

-- (Attorney General, Comptroller, State Treasurer — same pattern)

COMMIT;
```

### Pattern 2: Migration B — Executives (from OR migration 223)

**What:** Insert 5 STATE_EXEC districts, 5 politicians, 5 offices (CTE pattern), then back-fill office_id.

**Critical differences from OR 223:**
1. Use **5 separate STATE_EXEC districts** (ME pattern), not one shared district (OR pattern). Each executive gets their own `label` matching their chamber name.
2. `state='MD'` (uppercase) on all STATE_EXEC district rows — confirmed by OR 223a lesson (lowercase `'or'` caused silent routing failures).
3. `geo_id='24'` (MD FIPS), `district_id=''` (empty string), `mtfcc=''`.
4. `is_appointed_position=true` for State Treasurer ONLY (Davis, -240005); false for the other 4.
5. `is_appointed=true` for Davis politician row only.

**Source:** `C:/EV-Accounts/backend/migrations/223_or_executive_officials.sql` and `169_me_state_executives.sql` [VERIFIED: read in full]

```sql
-- Migration 270: MD State Executives (Moore, Miller, Brown, Lierman, Davis)
BEGIN;

-- Pre-flight: assert State of Maryland government row exists (same as migration 269)
DO $$ ... END $$;

-- STEP 1: Create 5 STATE_EXEC districts (one per office)
-- CRITICAL: state='MD' uppercase — lowercase 'md' breaks routing (OR 223a lesson)
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, district_id, mtfcc)
SELECT gen_random_uuid(), 'STATE_EXEC', 'MD', '24', 'Maryland Governor', '', ''
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE district_type = 'STATE_EXEC' AND state = 'MD' AND label = 'Maryland Governor'
);
-- (repeat for Lieutenant Governor, Attorney General, Comptroller, State Treasurer)

-- STEP 2: Politicians + Offices (one CTE block per executive)
-- Governor: Wes Moore (-240001)
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
SELECT gen_random_uuid(), d.id, c.id, p.id,
       'Governor', 'MD', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
JOIN essentials.chambers c ON c.name = 'Governor'
  AND c.government_id = (SELECT id FROM essentials.governments WHERE name = 'State of Maryland' AND state = 'MD')
WHERE d.district_type = 'STATE_EXEC' AND d.state = 'MD' AND d.label = 'Maryland Governor'
  AND p.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.chamber_id = c.id);

-- STEP 3: office_id back-fill
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -240010 AND -240001
  AND p.office_id IS NULL;

COMMIT;
```

### Anti-Patterns to Avoid

- **`state='md'` (lowercase) for STATE_EXEC districts:** OR migration 223 initially used lowercase; migration 223a had to fix it. ALL STATE_EXEC rows in production use uppercase (CA, IN, MA, ME, OR, TX, UT). Use `'MD'` on all MD STATE_EXEC inserts.
- **Including `slug` in chamber INSERT:** `slug` is `GENERATED ALWAYS` on `essentials.chambers` — adding it to the INSERT column list causes an error.
- **INSERT INTO governments:** The row already exists from migration 174. Do NOT insert it again. The pre-flight must ASSERT it exists (expect exactly 1).
- **Using `ON CONFLICT (geo_id)` for governments:** No unique constraint on geo_id — use `WHERE NOT EXISTS` guard.
- **`storage_url` column name:** The actual column on `politician_images` is `url` (not `storage_url`). CONTEXT.md has this wrong.
- **Modeling LG under Governor chamber:** D-01 explicitly prohibits this. LG gets own chamber + own STATE_EXEC district.
- **Shared STATE_EXEC district (OR pattern) instead of per-office districts (ME pattern):** OR used one shared district; ME used separate per-office districts. MD should follow ME pattern (confirmed by the fact that MD has 5 separate constitutionally distinct offices with individual titles).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Idempotent government insert | Custom UPSERT | `WHERE NOT EXISTS` guard on `name` | governments has no unique constraint on geo_id |
| Idempotent chambers | Custom UPSERT | `WHERE NOT EXISTS (name + government_id)` | Prevents duplicates on re-run |
| Politician insert + office in one step | Two separate INSERTs | CTE `WITH ins_p AS (INSERT ... RETURNING id)` | Ensures office links to the newly inserted politician atomically |
| Photo resizing | Custom resize script | Pillow (PIL) Lanczos resize, crop first then resize | Established project pattern; never stretch directly |

---

## Officials Data

### Confirmed Officials (all VERIFIED via official sources)

| external_id | full_name | Role | is_appointed | Notes |
|-------------|-----------|------|--------------|-------|
| -240001 | Wes Moore | Governor | false | Voter-elected; Democrat; inaugurated Jan 2023 |
| -240002 | Aruna Miller | Lieutenant Governor | false | Voter-elected; Democrat; Board of Public Works chair |
| -240003 | Anthony G. Brown | Attorney General | false | Voter-elected; Democrat; 47th AG, took office Jan 3 2023 |
| -240004 | Brooke Lierman | Comptroller | false | Voter-elected; Democrat; 34th Comptroller, first woman |
| -240005 | Dereck E. Davis | State Treasurer | true | Legislature-elected Jan 2023; Democrat; is_appointed=true |

**Dereck Davis full legal name:** Dereck Eugene Davis (born June 6, 1967). Official name used by the office: "Dereck E. Davis". [VERIFIED: treasurer.state.md.us/treasurer-bio/, Maryland State Archives msa.maryland.gov]

### Chamber Naming (OR short-name convention per D-01 guidance)

| name | name_formal |
|------|-------------|
| Governor | Governor of Maryland |
| Lieutenant Governor | Lieutenant Governor of Maryland |
| Attorney General | Attorney General of Maryland |
| Comptroller | Comptroller of Maryland |
| State Treasurer | Maryland State Treasurer |

**Rationale:** OR migration 222 established `name='Governor'` / `name_formal='Governor of Oregon'` as the most recent precedent. CA also uses short names. ME uses state-prefixed names (both columns identical: `'Maine Governor'`). The CONTEXT.md explicitly says to follow OR pattern for Phase 92.

### STATE_EXEC District Labels

| label | state | geo_id | district_id |
|-------|-------|--------|-------------|
| Maryland Governor | MD | 24 | (empty string) |
| Maryland Lieutenant Governor | MD | 24 | (empty string) |
| Maryland Attorney General | MD | 24 | (empty string) |
| Maryland Comptroller | MD | 24 | (empty string) |
| Maryland State Treasurer | MD | 24 | (empty string) |

---

## Headshot Sources

All URLs verified HTTP 200 as of 2026-06-05.

### Governor Wes Moore
- **Source:** `cdn.maryland.gov` (Maryland state CDN, S3-backed)
- **URL:** `https://cdn.maryland.gov/maryland-cms/prod/governor/s3fs-public/styles/3_4_504x672_focal_point_webp/public/images/2026-04/gov%201st%20size.png.webp`
- **Format:** WebP, approx. 504×672 (3:4 ratio — slightly narrow 4:5 — center crop vertically)
- **HTTP check:** 200, ~2.8MB [VERIFIED]
- **Processing:** Download .webp → convert to JPEG → crop to 4:5 → resize 600×750 Lanczos q90
- **Fallback:** governor.maryland.gov biography page; Wikipedia commons

### Lieutenant Governor Aruna Miller
- **Source:** `cdn.maryland.gov`
- **URL:** `https://cdn.maryland.gov/maryland-cms/prod/governor/s3fs-public/styles/3_4_504x672_focal_point_webp/public/images/2026-04/lg%201st%20size.png.webp`
- **Format:** WebP, similar proportions to Moore photo
- **HTTP check:** 200, ~44KB [VERIFIED]
- **Processing:** Same as Moore
- **Note:** Also available at governor.maryland.gov/leadership/lt-governor

### Attorney General Anthony G. Brown
- **Source:** `oag.maryland.gov` (SharePoint PublishingImages)
- **URL:** `https://oag.maryland.gov/our-office/PublishingImages/AttorneyGeneral.jpg`
- **Format:** JPEG, 512×512 (square) — needs 4:5 center crop → resize 600×750
- **HTTP check:** 200, ~59.8KB [VERIFIED]
- **Metadata:** Created 2023-11-02, keywords "OAG, Attorney, General, MD, Maryland, AG"
- **Processing:** Square → crop to ~400×512 center → resize 600×750

### Comptroller Brooke Lierman
- **Source:** `marylandcomptroller.gov` (Adobe Experience Manager / JCR content repo)
- **URL:** `https://www.marylandcomptroller.gov/about/brooke-lierman/_jcr_content/root/container/heroContainer/hero.coreimg.png/1740686184941/comptroller-portrait-cropped.png`
- **Format:** PNG (already portrait-cropped per filename), ~2.8MB
- **HTTP check:** 200, ~2.8MB [VERIFIED]
- **Note:** The `/1740686184941/` segment is a cache-buster timestamp. The base path without timestamp also resolves.
- **Processing:** Inspect dimensions — likely already tall portrait; crop to 4:5 if needed → resize 600×750

### State Treasurer Dereck E. Davis
- **Primary source:** Wikimedia Commons (public domain government photo)
- **URL:** `https://upload.wikimedia.org/wikipedia/commons/c/cb/Dereck_E._Davis_4_23_2025_%2854473095147%29_%28cropped%29.jpg`
- **Format:** JPEG, full resolution ~1.3MB [VERIFIED HTTP 200]
- **Alternative source:** Maryland State Archives manual: `https://msa.maryland.gov/msa/mdmanual/08conoff/treasurer/images/1198-1-10687b.jpg` (200, ~46KB — smaller)
- **Processing:** Wikimedia image already cropped; verify dimensions, crop to 4:5 if needed → resize 600×750

---

## Common Pitfalls

### Pitfall 1: Wrong STATE_EXEC `state` casing (lowercase 'md' instead of 'MD')
**What goes wrong:** All other STATE_EXEC rows in production use uppercase (CA, IN, MA, ME, OR, TX, UT). If `state='md'` (lowercase) is inserted, backend queries filtering `districts.state='MD'` silently exclude all MD executives — officials appear in DB but don't surface in the API.
**Why it happens:** The TIGER loader uses lowercase `abbrev` for STATE_UPPER/STATE_LOWER/COUNTY districts. Copying the loader pattern to STATE_EXEC is wrong. OR migration 223 made this mistake and needed migration 223a to fix it.
**How to avoid:** Always use `state='MD'` (uppercase) for STATE_EXEC districts. Confirmed by querying `SELECT DISTINCT state FROM essentials.districts WHERE district_type='STATE_EXEC'` — all results are uppercase.
**Warning signs:** Executives seed without error but don't appear on `/representatives/me` responses.

### Pitfall 2: Inserting government row that already exists
**What goes wrong:** `INSERT INTO essentials.governments ... WHERE NOT EXISTS` is idempotent but inserts a SECOND row if the NOT EXISTS guard uses the wrong column. `governments` has NO unique constraint on `geo_id` — a guard on `WHERE geo_id='24'` alone is correct, but a guard on name+state together is most precise.
**Why it happens:** Prior phases used `WHERE NOT EXISTS (SELECT 1 FROM governments WHERE name='...')`. Migration 174 already inserted the MD row. Running the insert again with a different WHERE guard can duplicate the row.
**How to avoid:** Migration 269 must assert exactly 1 row, not insert. Use `IF (SELECT COUNT(*) ... ) <> 1 THEN RAISE EXCEPTION`.
**Warning signs:** Two rows returned by `SELECT * FROM essentials.governments WHERE name = 'State of Maryland'`.

### Pitfall 3: `slug` column in chambers INSERT
**What goes wrong:** Including `slug` in the INSERT column list causes PostgreSQL to throw: `ERROR: column "slug" can only be updated to DEFAULT`.
**Why it happens:** `slug` is a `GENERATED ALWAYS` column on `essentials.chambers`.
**How to avoid:** Never list `slug` in INSERT statements. Only insert `id, name, name_formal, government_id`.

### Pitfall 4: `storage_url` vs `url` on politician_images
**What goes wrong:** The CONTEXT.md lists `storage_url` as the column name. The actual schema column is `url`. Inserting with `storage_url` causes a column-not-found error.
**Why it happens:** CONTEXT.md had a typo. Schema verified via `information_schema.columns`.
**How to avoid:** Always use `url` for the photo URL column. Use `type='default'` (not 'headshot').

### Pitfall 5: LG modeled under Governor chamber
**What goes wrong:** D-01 requires LG to have its own standalone chamber. If LG is modeled as a role under the Governor's chamber, Phase 93 and the API cannot surface her office independently.
**How to avoid:** Create `Lieutenant Governor` as a separate chamber row with its own `STATE_EXEC` district (label='Maryland Lieutenant Governor').

### Pitfall 6: State Treasurer modeled as voter-elected
**What goes wrong:** Dereck Davis is elected by the General Assembly, not by voters. Setting `is_appointed_position=false` and `is_appointed=false` misrepresents his office and would require adding election race rows that don't exist.
**How to avoid:** `is_appointed_position=true` on his office row; `is_appointed=true` on his politician row. Zero election race rows for his chamber.

---

## Runtime State Inventory

> Greenfield phase (no renaming/refactoring). This section is not applicable.

---

## State of the Art

| Pattern | Current Approach | Notes |
|---------|-----------------|-------|
| Government row | Pre-exists from migration 174 (senate infrastructure) | Use ASSERT, not INSERT |
| Chambers migration | OR migration 222 pattern (short name + state-qualified name_formal) | Most recent precedent |
| Officials migration | OR migration 223 CTE pattern | One CTE block per executive |
| STATE_EXEC district | One per office (ME pattern), state='MD' uppercase | OR used shared district but had casing bug |
| politician_images column | `url` (not `storage_url`) | CONTEXT.md had typo; verified via schema |

---

## Open Questions

1. **Photo dimensions for Wes Moore WebP**
   - What we know: URL accessible, ~2.8MB, labeled as `3_4_504x672`
   - What's unclear: Whether the WebP's actual pixel dimensions match the URL's style path
   - Recommendation: Download and inspect actual pixel dimensions before cropping

2. **Dereck Davis photo license**
   - What we know: Wikimedia Commons photo tagged as government/public photo taken April 23, 2025
   - What's unclear: Whether `photo_license` field should be set (other rows have 'sourced' or empty string)
   - Recommendation: Set `photo_license='public_domain'` for Wikimedia Commons government photos, consistent with OR headshots pattern

3. **photo_license values pattern**
   - Checked: Some rows have `photo_license='sourced'`, others have empty string
   - Recommendation: Use `photo_license='public_domain'` for government official photos from government websites; Wikimedia Commons photos are also public_domain

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| psql | Migration verification queries | ✓ | PostgreSQL 18.x | mcp__supabase-local__execute_sql |
| mcp__supabase-local__apply_migration | Migration execution | ✓ | — | psql + DATABASE_URL |
| mcp__supabase-local__execute_sql | Verification queries | ✓ | — | psql |
| Supabase Storage | Headshot hosting | ✓ | — | — |
| Python + Pillow or ImageMagick | Headshot processing | [ASSUMED] system availability | — | Use PIL via pip install if not present |

---

## Validation Architecture

Phase 92 is pure DB seeding with no application code changes. Nyquist validation applies as lightweight SQL smoke queries.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Direct SQL verification via mcp__supabase-local__execute_sql |
| Config file | None — ad-hoc queries |
| Quick run command | `SELECT COUNT(*) FROM essentials.chambers c JOIN essentials.governments g ON g.id=c.government_id WHERE g.name='State of Maryland'` |
| Full suite command | 5-gate SQL verification (see Phase Requirements map below) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| MD-GOV-01 | 5 chambers under State of Maryland | SQL count | `SELECT COUNT(*) ... WHERE g.name='State of Maryland'` → expect 5 |
| MD-GOV-01 | 5 STATE_EXEC districts for MD | SQL count | `SELECT COUNT(*) FROM essentials.districts WHERE district_type='STATE_EXEC' AND state='MD'` → expect 5 |
| MD-GOV-02 | 5 politicians with external_ids -240001..-240005 | SQL check | `SELECT external_id, full_name FROM essentials.politicians WHERE external_id BETWEEN -240010 AND -240001 ORDER BY external_id` → expect 5 rows |
| MD-GOV-02 | All 5 have office rows with correct is_appointed_position | SQL check | `SELECT p.full_name, o.is_appointed_position FROM essentials.politicians p JOIN essentials.offices o ON o.politician_id=p.id WHERE p.external_id BETWEEN -240010 AND -240001` → Davis only has true |
| MD-GOV-06 | 5 politician_images rows type='default' | SQL count | `SELECT COUNT(*) FROM essentials.politician_images pi JOIN essentials.politicians p ON p.id=pi.politician_id WHERE p.external_id BETWEEN -240010 AND -240001 AND pi.type='default'` → expect 5 |

### Wave 0 Gaps
None — existing test infrastructure (psql/MCP queries) covers all phase requirements; no test file scaffolding needed.

---

## Security Domain

This phase performs only DB inserts of public government data (names, titles, official photos). No auth paths, no user data, no secrets. ASVS categories V2/V3/V4/V6 do not apply. V5 input validation is handled by parameterized SQL (no user-supplied input). No new endpoints created.

---

## Sources

### Primary (HIGH confidence)
- `C:/EV-Accounts/backend/migrations/168_me_government_chambers.sql` — ME chambers pattern; WHERE NOT EXISTS guards; GENERATED ALWAYS slug warning [VERIFIED: read in full]
- `C:/EV-Accounts/backend/migrations/169_me_state_executives.sql` — ME executives CTE pattern; per-office STATE_EXEC districts; office_id back-fill [VERIFIED: read in full]
- `C:/EV-Accounts/backend/migrations/222_or_government_chambers.sql` — OR short name/name_formal convention; pre-flight assert pattern [VERIFIED: read in full]
- `C:/EV-Accounts/backend/migrations/223_or_executive_officials.sql` — OR officials CTE pattern; single shared STATE_EXEC district [VERIFIED: read in full]
- `C:/EV-Accounts/backend/migrations/223a_or_executive_district_fix.sql` — confirms STATE_EXEC state casing must be uppercase; 'or' → 'OR' fix [VERIFIED: read in full]
- psql query against production DB 2026-06-05 — confirmed: State of Maryland exists (1 row), 0 chambers, 0 STATE_EXEC MD districts, 0 politicians in -240xxx range [VERIFIED]
- psql query `SELECT MAX(version) FROM supabase_migrations.schema_migrations` → 267 [VERIFIED]
- `information_schema.columns` for `essentials.politician_images` → column is `url` not `storage_url` [VERIFIED]
- `information_schema.columns` for `essentials.offices` → confirms all required columns present [VERIFIED]
- Live STATE_EXEC rows query → all 28 rows use uppercase state abbreviation [VERIFIED]

### Secondary (MEDIUM confidence)
- `https://cdn.maryland.gov/...gov%201st%20size.png.webp` — Governor Moore headshot; HTTP 200, ~2.8MB [VERIFIED accessible]
- `https://cdn.maryland.gov/...lg%201st%20size.png.webp` — LG Miller headshot; HTTP 200, ~44KB [VERIFIED accessible]
- `https://oag.maryland.gov/our-office/PublishingImages/AttorneyGeneral.jpg` — AG Brown 512×512 JPEG; HTTP 200, ~60KB [VERIFIED accessible]
- `https://www.marylandcomptroller.gov/.../comptroller-portrait-cropped.png` — Comptroller Lierman PNG; HTTP 200, ~2.8MB [VERIFIED accessible]
- `https://upload.wikimedia.org/wikipedia/commons/c/cb/Dereck_E._Davis_4_23_2025_(54473095147)_(cropped).jpg` — Treasurer Davis; HTTP 200, ~1.3MB [VERIFIED accessible]
- `https://msa.maryland.gov/msa/mdmanual/08conoff/treasurer/images/1198-1-10687b.jpg` — Davis backup; HTTP 200 [VERIFIED accessible]
- treasurer.state.md.us/treasurer-bio/ — Dereck E. Davis full legal name confirmed [CITED]
- msa.maryland.gov/msa/mdmanual/08conoff/treasurer/html/msa12208.html — Davis current status [CITED]

### Tertiary (LOW confidence)
- `174_senate_infrastructure.sql` comment context — confirms bulk 50-state government stub seeding purpose [VERIFIED: read in full]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Pillow/ImageMagick available on execution environment | Environment Availability | Headshot processing step requires manual pip install before execution |
| A2 | `photo_license='public_domain'` is the correct value for government official photos | Headshot Sources | Low — field is nullable; empty string is also acceptable |
| A3 | MD Governor and LG both use `party='Democrat'` | Officials Data | Party is stored in DB (used for internal data) but never displayed on politician profiles (antipartisan design) |
| A4 | Wes Moore's official name is "Wes Moore" not "Wesley Moore" or a middle-initial variant | Officials Data | Would cause a minor discrepancy with official name; governor.maryland.gov uses "Wes Moore" consistently |

**All DB schema facts, migration patterns, and existing DB state are VERIFIED — no assumptions in the critical path.**

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all migration patterns read from production files; DB state verified via psql
- Architecture: HIGH — direct precedents from migrations 168, 169, 222, 223, 223a
- Headshots: HIGH — all 5 URLs verified HTTP 200 with correct content types
- Next migration number: HIGH — confirmed via schema_migrations query
- Pitfalls: HIGH — OR 223a casing bug is the primary risk; documented and mitigated

**Research date:** 2026-06-05
**Valid until:** 2026-09-05 (stable domain; headshot URLs may rotate if CDN cache-busters change)
