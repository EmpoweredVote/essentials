# Phase 62: LA Backlog Closure - Research

**Researched:** 2026-05-21
**Domain:** LA civic data seeding, CA Governor jungle primary, LAUSD board officials, lavote.gov discovery, migration application
**Confidence:** HIGH (codebase evidence) / MEDIUM (DB state — max client connections prevented live queries)

---

## Summary

Phase 62 closes four distinct LA backlog items. Each has a different risk profile. The most complex is LAUSD board member seeding because it requires: creating a SCHOOL district type row per board sub-district, a chamber, linking offices to the Phase 58 geofences, seeding 7 politicians, and uploading headshots. The simplest is migration 171 application (already-written SQL). The CA Governor race is already correctly structured as a jungle primary; the gap is that existing candidates are `race_candidates` rows without `politician_id` links — the Phase 62 decision to create full politician rows (with profile pages) requires both politician INSERT and `race_candidates.politician_id` UPDATE.

The lavote.gov election ID issue is likely about the `source_url` in `essentials.discovery_jurisdictions` — the `id=4338` URL parameter currently serves the June 2026 election (confirmed live 2026-05-21), so the stored value may already be correct. The planner should include a DB query to verify the current stored URL before writing an UPDATE.

**Primary recommendation:** Execute in four parallel sub-plans: (1) migration 171 + pre-flight 182 check, (2) CA Governor politician rows + race_candidates links, (3) LAUSD government/chamber/districts/offices/politicians/headshots, (4) lavote.gov source_url verification + discovery test.

---

## DB State (from codebase evidence — live DB inaccessible due to max client connections at research time)

### Migration Status

From `STATE.md`:
- **Migration 171** (`171_la_council_votes.sql`): **UNAPPLIED** — explicitly noted in STATE.md pending todos: "Migration 171 (171_la_council_votes.sql) — unapplied; folded into Phase 62-01; apply when Phase 62 begins."
- **Migration 182** (`182_fix_security_invoker_public_views.sql`): **STATUS UNKNOWN** — STATE.md says "verify applied status before Phase 62 work via `SELECT version FROM supabase_migrations.schema_migrations WHERE version='182'`". This is a pre-flight check, not a blocking prerequisite from code evidence.
- **Next migration**: **196** — confirmed in STATE.md: "Next migration is 196"

### Migration 171 Content (read directly from file)

`C:\EV-Accounts\backend\migrations\171_la_council_votes.sql` creates:
- `meetings.la_council_agenda_items` — one row per council file number; `UNIQUE (council_file_number)`
- `meetings.la_council_votes` — one row per politician × vote event; `UNIQUE (politician_id, council_file_number, vote_date, item_number)`
- 3 indexes: `la_council_votes_politician_idx`, `la_council_votes_cfn_idx`, `la_council_votes_date_idx`
- Uses `CREATE TABLE IF NOT EXISTS` — safe to apply even if partially applied
- Does NOT use `BEGIN/COMMIT` — transaction handling needed at application layer

**Status check query:**
```sql
SELECT version FROM supabase_migrations.schema_migrations WHERE version IN ('171', '182');
```
If 171 is absent → apply it. If 182 is absent → apply it first (blocking prerequisite per CONTEXT).

### CA Governor Race Structure (confirmed from codebase)

From `seed-la-county-2026-primary-state-federal.sql` and `ingest-ca-sos-2026-challengers.ts`:
- Race exists: `position_name='CA Governor'`, `primary_party=NULL` (jungle primary — correct)
- Election: `2026 LA County Primary` (id=`1ebca37f-cf96-47f4-bc2b-47ef266721fe`)
- Race type: statewide (office_id IS NULL — matched by `election.state='CA'`)
- 9 Calmatters-sourced candidates already seeded as `race_candidates` (Becerra, Bianco, Hilton, Mahan, Porter, Steyer, Thurmond, Villaraigosa, Yee)
- Long-tail SoS candidates (~54) were added then **reverted** by `revert-ca-sos-governor-candidates.ts`
- All current candidates have `source='calmatters-2026'`, `politician_id=NULL`
- **Gap**: No politician rows exist yet for external_ids `-6003001` through `-6003013`

**CA Governor primary date**: June 3, 2026 (per migration 117 comment)
**General election**: post-primary, top 2 advance (no general race row to create yet)

### LAUSD Existing Infrastructure

From migration `114_la_government_geo_ids.sql` and `seed-la-county-2026-primary-state-federal.sql`:

**Government row** (already exists in DB):
- Name: `'Los Angeles Unified, California, US'`
- geo_id: `'0622710'` (Census unified school district GEOID)
- The CONTEXT.md decision says LAUSD gets "its own government row (distinct legal entity, not part of LA City)" — this row IS that separate government row; it already exists

**Existing LAUSD offices** (already seeded, linked to at-large district `0622710`):
| District | Current Member (WRONG in DB) | DB Office ID | CORRECT Member |
|----------|------------------------------|--------------|----------------|
| D2 | Scott Schmerelson (DB) | `013b6024-cbda-4746-8826-e33baa541081` | Dr. Rocio Rivas |
| D4 | Nick Melvoin (DB) | `6b906b77-f0f9-4ff9-b852-b0a11bfa4af6` | Nick Melvoin |
| D6 | Kelly Gonez (DB) | `0b95c93e-4b15-48c7-a21f-83155f7c5a24` | Kelly Gonez |

**CRITICAL DATA QUALITY ISSUE**: The DB has Schmerelson as District 2 but he is actually District 3. Dr. Rocio Rivas is District 2. This was seeded in the original LA seed script before LAUSD redistricting or before the Phase 58 research identified the correct mapping. Phase 62 migration must correct this.

**Existing LAUSD races** (in `2026 LA County Primary` election):
- LAUSD Board D2: has race row, linked to D2 office (which has wrong incumbent)
- LAUSD Board D4: has race row, linked to D4 office (Melvoin — correct)
- LAUSD Board D6: has race row, linked to D6 office (Gonez — correct)
- D2/D4/D6 are on the June 2, 2026 ballot (gubernatorial cycle)
- D1/D3/D5/D7 are on the November 2028 ballot — NOT on June 2026

**Geofences** (Phase 58 complete):
- `lausd-board-district-1` through `lausd-board-district-7` — all 7 in `geofence_boundaries`
- `mtfcc='G5420'`, `state='06'`

**What's MISSING** for Phase 62 LAUSD seeding:
1. A chamber row: `name='LAUSD Board of Education'` (does not exist yet)
2. Seven `essentials.districts` rows (district_type=`'SCHOOL'`, one per board sub-district)
3. Seven `essentials.offices` rows linked to the new districts (NOT the at-large 0622710)
4. Seven `essentials.politicians` rows (external_ids -6004001 through -6004007)
5. `politician_images` rows for headshots
6. Data fix: update existing D2 race/office to reflect Rocio Rivas (not Schmerelson)

### Current LAUSD Board Members (verified via WebSearch 2026-05-21)

| District | Member | 2026 Ballot? |
|----------|--------|--------------|
| D1 | Sherlett Hendy Newbill | No (2028 cycle) |
| D2 | Dr. Rocio Rivas | Yes (2026 June 2) |
| D3 | Scott Schmerelson | No (2028 cycle) |
| D4 | Nick Melvoin | Yes (2026 June 2) |
| D5 | Karla Griego | No (2028 cycle) |
| D6 | Kelly Gonez | Yes (2026 June 2) |
| D7 | Tanya Ortiz Franklin | No (2028 cycle) |

Schmerelson elected Board President Dec 2025. Rivas is Board Vice President.

### lavote.gov Election ID

The `source_url` column in `essentials.discovery_jurisdictions` stores the URL the discovery agent uses. The `id=4338` URL parameter (`https://www.lavote.gov/Apps/CandidateList/Index?id=4338`) is confirmed STILL VALID for the June 2, 2026 election (WebFetch confirmed live data as of 2026-05-21 showing "STATEWIDE DIRECT PRIMARY ELECTION - 6/2/2026").

**Key finding**: The id=4338 is NOT stale for this cycle. The "mandatory manual update" concern is about the November 2026 general election — after June 3, lavote.gov will assign a new election ID for the general election, and the discovery jurisdiction source_url will need updating then.

**Pre-flight check needed**: Query `essentials.discovery_jurisdictions WHERE state='CA' OR source_url ILIKE '%lavote%'` to see what source_url is currently stored. If it already has `?id=4338`, no update needed for this phase. If it has an older ID, update to `?id=4338`.

**Known columns in discovery_jurisdictions**:
- `id`, `jurisdiction_geoid`, `jurisdiction_name`, `state`, `election_date`, `source_url`, `allowed_domains`, `created_at`, `updated_at`
- No `election_id_external` column — the column name in phase62_research.ts was incorrect

---

## Architecture Patterns

### Pattern 1: Government Row Pre-Check

Per STATE.md GOTCHA: "before writing migrations for any CA state-level entity, always pre-check whether it already exists."

```sql
-- Check LAUSD government row
SELECT id, name, geo_id FROM essentials.governments
WHERE name ILIKE '%los angeles unified%' OR geo_id = '0622710';

-- Expected: 1 row ("Los Angeles Unified, California, US", geo_id='0622710')
-- UUID: look up at migration time; use subquery pattern in migration
```

The government row EXISTS. Phase 62 does NOT create a new government row — it uses the existing one via subquery.

### Pattern 2: LAUSD Chamber Creation

```sql
-- From CA exec pattern (migration 189/192); adapted for LAUSD
INSERT INTO essentials.chambers (name, government_id)
SELECT 'LAUSD Board of Education', g.id
FROM essentials.governments g
WHERE g.name = 'Los Angeles Unified, California, US'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.chambers c
    WHERE c.name = 'LAUSD Board of Education'
  );

-- CRITICAL: slug is a GENERATED column — never include in INSERT
```

### Pattern 3: SCHOOL District Row Creation

```sql
-- district_type='SCHOOL' — matches essentialsService.ts and resolve_user_jurisdiction
-- geo_id matches geofence_boundaries.geo_id for spatial routing
INSERT INTO essentials.districts (geo_id, label, mtfcc, district_type, state)
SELECT 
  'lausd-board-district-' || d.num, 
  'LAUSD Board District ' || d.num,
  'G5420',
  'SCHOOL',
  '06'
FROM (VALUES (1),(2),(3),(4),(5),(6),(7)) AS d(num)
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts 
  WHERE geo_id = 'lausd-board-district-' || d.num
);
```

Note: `districts.state` for SCHOOL districts should follow the `'06'` (lowercase-equivalent) pattern consistent with how CA state is stored. Check the existing CA districts.state patterns (STATE_UPPER/STATE_LOWER use `'CA'` uppercase per STATE.md).

### Pattern 4: LAUSD Office Creation (with politician_id linking)

```sql
-- CTE pattern from migration 194/195 (CA state legislators)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, is_active, is_appointed, is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Dr. Rocio Rivas', 'Rocio', 'Rivas', true, false, false, true, -6004002)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       ch.id,
       p.id,
       'Board Member',
       false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
CROSS JOIN (SELECT id FROM essentials.chambers WHERE name = 'LAUSD Board of Education') ch
WHERE d.geo_id = 'lausd-board-district-2'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.chamber_id = ch.id
  );
```

### Pattern 5: CA Governor Politician Row Creation

```sql
-- Create full politician rows with external_ids, then link to race_candidates
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, is_active, is_appointed, is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Xavier Becerra', 'Xavier', 'Becerra', true, false, false, false, -6003001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id, full_name
)
UPDATE essentials.race_candidates rc
SET politician_id = ins_p.id
FROM ins_p
JOIN essentials.races r ON r.position_name = 'CA Governor'
  AND r.election_id = '1ebca37f-cf96-47f4-bc2b-47ef266721fe'
WHERE rc.race_id = r.id
  AND lower(rc.full_name) = lower(ins_p.full_name)
  AND rc.politician_id IS NULL;
```

### Pattern 6: politician_images Insert (headshots)

```sql
-- From STATE.md: columns are id, politician_id, url, type, photo_license, focal_point
-- NO photo_origin_url column
INSERT INTO essentials.politician_images (id, politician_id, url, type)
VALUES (gen_random_uuid(), '{politician_uuid}', '{storage_url}', 'headshot')
ON CONFLICT (politician_id, type) DO UPDATE SET url = EXCLUDED.url;
```

### Anti-Patterns to Avoid

- **Do NOT include `slug` in chamber INSERT**: `slug` is GENERATED column on `essentials.chambers`
- **Do NOT use `district_type='SCHOOL_DISTRICT'`**: correct value is `'SCHOOL'` (from essentialsService.ts)
- **Do NOT add `photo_origin_url`**: that column does not exist on `politician_images`
- **Do NOT re-add unique index on offices.politician_id**: was dropped in migration 159
- **Do NOT guess the LAUSD government UUID**: always use subquery `SELECT id FROM essentials.governments WHERE name = 'Los Angeles Unified, California, US'`
- **Do NOT create a new LAUSD government row**: one already exists (migration 114 confirms)

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| LAUSD chamber geometry | Roll your own | Government row already exists at geo_id='0622710'; use it | Extra government row would cause duplicate routing |
| District-to-geofence link | Manual geo_id guess | lausd-board-district-N pattern is deterministic (Phase 58 established) | Same pattern already in geofence_boundaries |
| Headshot upload | New upload pipeline | Use existing pattern: crop to 4:5 → resize to 600×750 → upload to Supabase Storage at {politician_id}-headshot.jpg | Established workflow per memory |
| lavote URL discovery | Custom scraper | Browse lavote.gov manually to confirm current id= parameter | Simple one-time check; id=4338 confirmed valid today |

---

## Common Pitfalls

### Pitfall 1: LAUSD Schmerelson District 2 vs 3 Data Error

**What goes wrong:** Existing DB has Schmerelson as District 2 incumbent (from original LA seed). District 2 is actually Dr. Rocio Rivas; Schmerelson is District 3.
**Why it happens:** Original seed script pre-dated Phase 58 research.
**How to avoid:** Phase 62 migration must both: (a) correct Schmerelson's office to link to `lausd-board-district-3` district, and (b) create Rivas as District 2 officeholder.
**Warning signs:** After migration, query shows Schmerelson at District 2 office.

### Pitfall 2: Applying Migration 171 Before Migration 182

**What goes wrong:** If migration 182 (legacy views security fix) is NOT applied, Phase 62 work may interact with an insecure DB state.
**Why it happens:** Migration 182 was written but may not have been applied.
**How to avoid:** Pre-flight check — query `SELECT version FROM supabase_migrations.schema_migrations WHERE version='182'` before any Phase 62 work. If absent, apply 182 first.
**Warning signs:** 182 not in schema_migrations table.

### Pitfall 3: CA Governor candidates.politician_id = NULL

**What goes wrong:** After creating politician rows, forgetting to UPDATE `race_candidates.politician_id` with the new politician UUIDs. Candidates show on Elections page but can't link to profile pages.
**Why it happens:** Two-step operation (INSERT politicians, then UPDATE race_candidates) is easy to partially execute.
**How to avoid:** Include the UPDATE as part of the same CTE pattern. Verify with query: `SELECT count(*) FROM race_candidates WHERE race_id = (SELECT id FROM races WHERE position_name='CA Governor') AND politician_id IS NULL`.
**Warning signs:** Governor candidate cards on Elections page show no profile link.

### Pitfall 4: LAUSD districts.state Value

**What goes wrong:** Using wrong state casing for LAUSD districts. Existing CA pre-loaded rows use `state='CA'` (uppercase) for STATE_UPPER/STATE_LOWER. SCHOOL districts created by TIGER loader use state='06' (numeric FIPS).
**Why it happens:** STATE.md notes: "CA districts.state casing: 3 pre-existing LA County rows with state='CA' (uppercase, pre-Phase 57); new 57 county rows landed as state='ca' (lowercase, loader abbrev)"
**How to avoid:** Use `state='06'` for LAUSD SCHOOL districts (numeric FIPS, same as geofence_boundaries.state). This matches how the Phase 58 geofence_boundaries rows were loaded.
**Warning signs:** ST_Covers queries return LAUSD geofence rows but JOIN to districts fails.

### Pitfall 5: LAUSD Government Row Already Exists

**What goes wrong:** Migration creates a new LAUSD government row when one already exists at `geo_id='0622710'`, causing duplicate governments.
**Why it happens:** STATE.md GOTCHA says pre-check before CA seeding.
**How to avoid:** Always use WHERE NOT EXISTS guard on government INSERT; verify existing row via pre-flight query.
**Warning signs:** Two LAUSD government rows in governments table.

### Pitfall 6: lavote.gov election ID 4338 is Current (not stale)

**What goes wrong:** Writing a migration to "fix" the source_url when it's already correct. Unnecessary UPDATE causes confusing history.
**Why it happens:** CONTEXT.md describes it as a "stale ID" concern, but the ID is confirmed valid.
**How to avoid:** Query the stored source_url first. If it already contains `?id=4338`, skip the UPDATE. Note in STATE.md that id will need updating after June 3 for the November general.
**Warning signs:** source_url UPDATE reports 0 rows updated.

### Pitfall 7: LAUSD D2/D4/D6 are on 2026 Ballot; D1/D3/D5/D7 are NOT

**What goes wrong:** Creating races or race candidates for all 7 LAUSD districts in Phase 62.
**Why it happens:** Easy to miss the LAUSD election cycle.
**How to avoid:** Existing DB already has races for D2/D4/D6 only. Phase 62 should leave the existing D2/D4/D6 race structure and not add D1/D3/D5/D7 races. The odd-numbered districts are on the November 2028 cycle.
**Warning signs:** Seven LAUSD races in the elections page for June 2026.

---

## CA Governor Candidates — External ID Assignments

Per CONTEXT.md decision: external_ids `-6003001` through `-6003013` are reserved. There are 9 confirmed Calmatters candidates + potential others. Assignments should be based on the 9 confirmed candidates:

| External ID | Full Name | Notes |
|-------------|-----------|-------|
| -6003001 | Xavier Becerra | Former AG/HHS secretary |
| -6003002 | Chad Bianco | Riverside County Sheriff |
| -6003003 | Steve Hilton | Fox News contributor |
| -6003004 | Matt Mahan | San Jose Mayor |
| -6003005 | Katie Porter | Former US Representative |
| -6003006 | Tom Steyer | Billionaire entrepreneur |
| -6003007 | Tony Thurmond | CA Superintendent (also in supt race as incumbent) |
| -6003008 | Antonio Villaraigosa | Former LA Mayor |
| -6003009 | Betty Yee | Former State Controller |
| -6003010 through -6003013 | Reserved | For additional verified candidates if needed |

**Note on Tony Thurmond**: He is also seeded as the Superintendent of Public Instruction incumbent (external_id=-6000108). Phase 62 should NOT create a duplicate politician row; instead, link the existing politician (-6000108) to the Governor race_candidates row. Use a different approach: UPDATE the race_candidates row to set politician_id = (the existing Thurmond politician id) rather than INSERT a new politician row.

**Note on headshots**: CONTEXT says "check what already exists; fill gaps where missing." CA exec politicians (-6000101 through -6000108) already have headshots. Becerra and Porter may have headshots from their federal service. Bianco, Hilton, Mahan, Steyer, Villaraigosa, Yee are new.

---

## LA City Structure Audit — Migration 171

Migration 171 creates tables in the `meetings` schema. This is infrastructure for the LA Council vote display feature. The migration is:
- Already written and verified as correct SQL
- Does NOT insert any rows — only creates tables and indexes
- Safe to apply at any time (IF NOT EXISTS guards)
- Does NOT depend on any other unapplied migrations

**6-Tier LA Address Smoke Test** (post-migration 171, post-LAUSD seeding):
Use downtown LA address: `500 W Temple St, Los Angeles, CA 90012` (lon=-118.2437, lat=34.0522)

Expected tiers returned:
1. LA City Council (geo_id: ocd-division style, council district covering downtown)
2. LAUSD Board District 2 (Dr. Rocio Rivas, lausd-board-district-2)
3. LA County Supervisor (geo_id: LA County D-2 or D-4 area)
4. CA Assembly member (AD-54 or AD-55)
5. CA State Senator (SD-26 or nearby)
6. US House rep (CD-34, Jimmy Gomez)

---

## Code Examples

### Pre-flight Migration Status Check

```sql
SELECT version FROM supabase_migrations.schema_migrations
WHERE version IN ('171', '182', '195', '196')
ORDER BY version;
-- Expect 195 present; 171 absent (unapplied); 182 unknown; 196 absent (next)
```

### Query: LA Discovery Jurisdiction Source URL

```sql
SELECT id, jurisdiction_name, source_url, state, election_date, cron_active
FROM essentials.discovery_jurisdictions
WHERE state = 'CA'
ORDER BY election_date;
-- Look for source_url containing lavote.gov — confirm it contains ?id=4338
```

### Query: CA Governor Race State

```sql
SELECT r.id, r.position_name, r.primary_party, 
       COUNT(rc.id) AS candidate_count,
       COUNT(CASE WHEN rc.politician_id IS NOT NULL THEN 1 END) AS with_politician_link
FROM essentials.races r
LEFT JOIN essentials.race_candidates rc ON rc.race_id = r.id
WHERE r.election_id = '1ebca37f-cf96-47f4-bc2b-47ef266721fe'
  AND r.position_name = 'CA Governor'
GROUP BY r.id, r.position_name, r.primary_party;
-- Expect: primary_party=NULL, ~9 candidates, 0 with politician_link
```

### Query: LAUSD Existing Infrastructure

```sql
-- Government row
SELECT id, name, geo_id FROM essentials.governments
WHERE name ILIKE '%unified%';

-- Existing chambers for LAUSD government
SELECT c.id, c.name, c.slug FROM essentials.chambers c
JOIN essentials.governments g ON g.id = c.government_id
WHERE g.name ILIKE '%unified%';

-- Existing districts linked to LAUSD at-large geo_id
SELECT d.id, d.geo_id, d.label, d.district_type FROM essentials.districts d
WHERE d.geo_id LIKE 'lausd%' OR d.geo_id = '0622710';

-- Existing politicians with LAUSD external_ids
SELECT id, full_name, external_id FROM essentials.politicians
WHERE external_id BETWEEN -6004999 AND -6004000;
```

### Query: Verify 6-Tier Address Routing (smoke test coordinate)

```sql
-- Should return 6+ rows for downtown LA after Phase 62 is complete
SELECT gb.geo_id, gb.mtfcc, gb.name, d.district_type, p.full_name
FROM essentials.geofence_boundaries gb
LEFT JOIN essentials.districts d ON d.geo_id = gb.geo_id AND d.mtfcc = gb.mtfcc
LEFT JOIN essentials.offices o ON o.district_id = d.id AND o.is_vacant = false
LEFT JOIN essentials.politicians p ON p.id = o.politician_id
WHERE gb.geometry && ST_SetSRID(ST_MakePoint(-118.2437, 34.0522), 4326)
  AND ST_Covers(gb.geometry, ST_SetSRID(ST_MakePoint(-118.2437, 34.0522), 4326))
ORDER BY gb.mtfcc;
```

---

## LAUSD Headshots

**Source**: `lausd.net/board` (redirects to laschoolboard.org — blocked). Use WebSearch to find individual board member official pages.

**Alternative source pattern**: LAUSD official press releases and news articles often have headshots. Wikipedia pages for board members also have photos.

**Headshot workflow** (from memory):
1. Find photo from official source (LAUSD bio page or press release)
2. Crop to 4:5 ratio (centered on face, eyes at ~1/3 from top, full head + shoulders)
3. Resize to 600×750 via Lanczos, q90
4. Upload to Supabase Storage at `{politician_id}-headshot.jpg`
5. Insert `politician_images` row: `(id, politician_id, url, type='headshot')`
6. NO `photo_origin_url` column — does not exist

---

## Open Questions

1. **Is migration 182 applied?**
   - What we know: STATE.md says verify before Phase 62 begins
   - What's unclear: Live DB was inaccessible (max connections) at research time
   - Recommendation: Pre-flight query on migration 182 in Plan 62-01 as first task

2. **Does the LA discovery jurisdiction exist and what is its source_url?**
   - What we know: id=4338 is currently valid for June 2026; LA jurisdictions used lavote.gov for LA County races; the discovery script sourced from `?id=4338`
   - What's unclear: Whether a `discovery_jurisdictions` row exists for LA County with `source_url` pointing to lavote.gov, or if the LA discovery was seeded differently
   - Recommendation: Query `discovery_jurisdictions WHERE state='CA'` in Plan 62-04 to verify before any UPDATE

3. **Do any CA Governor candidates already have politician rows from a prior pass?**
   - What we know: External_ids -6003001 to -6003013 are "reserved" but DB was inaccessible to verify occupancy
   - What's unclear: Whether the "initial pass the user believes was done" actually created any politician rows
   - Recommendation: Pre-flight query `SELECT full_name, external_id FROM essentials.politicians WHERE external_id BETWEEN -6003999 AND -6003000` in Plan 62-02 before any INSERT

4. **Does "LAUSD Board of Education" chamber already exist?**
   - What we know: migration 114 set geo_id on existing LAUSD government; no migration was found that creates a "LAUSD Board of Education" chamber
   - What's unclear: Whether this chamber was created via a script or earlier migration not found
   - Recommendation: Query `chambers WHERE name='LAUSD Board of Education'` in Plan 62-03 as pre-flight

5. **LAUSD districts.state value for SCHOOL type**
   - What we know: geofence_boundaries.state='06' for LAUSD rows; CA STATE_UPPER/STATE_LOWER use 'CA' (uppercase); TIGER-loaded county rows use 'ca' (lowercase)
   - What's unclear: What value essentialsService.ts expects for SCHOOL district routing
   - Recommendation: Query `SELECT DISTINCT state FROM essentials.districts WHERE district_type='SCHOOL'` to see existing pattern before inserting

---

## Sources

### Primary (HIGH confidence)

- `C:\EV-Accounts\backend\migrations\171_la_council_votes.sql` — read directly; confirmed content creates meetings schema tables, no data inserts
- `C:\EV-Accounts\backend\migrations\182_fix_security_invoker_public_views.sql` — read directly; security invoker view fix for public.connected_profiles and public.action_log
- `C:\EV-Accounts\backend\migrations\114_la_government_geo_ids.sql` — read directly; confirmed LAUSD government row at geo_id='0622710' already exists
- `C:\EV-Accounts\backend\scripts\seed-la-county-2026-primary-state-federal.sql` — read fully; confirms CA Governor race structure (jungle primary, primary_party=NULL), existing LAUSD D2/D4/D6 office IDs and incumbent data errors (Schmerelson mis-assigned to D2)
- `C:\EV-Accounts\backend\scripts\ingest-ca-sos-2026-challengers.ts` — read fully; confirms 9 Calmatters candidates already seeded, long-tail reverted; confirms lavote.gov ?id=4338 URL
- `C:\EV-Accounts\backend\scripts\revert-ca-sos-governor-candidates.ts` — read fully; confirms only calmatters-2026 candidates remain; confirms jungle primary race structure (primary_party IS NULL)
- `C:\Transparent Motivations\essentials\.planning\STATE.md` — confirms migration 171 unapplied, migration 196 is next, LAUSD board district_type='SCHOOL', politician_images schema
- `C:\Transparent Motivations\essentials\.planning\phases\58-lausd-geofences\58-RESEARCH.md` — confirms 7 LAUSD board members, geo_id pattern lausd-board-district-{N}, district_type='SCHOOL'
- `C:\Transparent Motivations\essentials\.planning\phases\58-lausd-geofences\58-VERIFICATION.md` — confirms Phase 58 COMPLETE, 7 rows verified in live DB
- WebFetch `https://www.lavote.gov/Apps/CandidateList/Index?id=4338` — confirmed id=4338 serves June 2026 election as of 2026-05-21

### Secondary (MEDIUM confidence)

- WebSearch for LAUSD board members 2026 — confirmed D1-D7 membership: Newbill, Rivas, Schmerelson, Melvoin, Griego, Gonez, Franklin; Schmerelson is Board President Dec 2025, Rivas is VP
- `C:\EV-Accounts\backend\migrations\070_discovery_tables.sql` — confirmed discovery_jurisdictions schema (no election_id_external column; uses source_url)

### Tertiary (LOW confidence)

- Live DB queries for migration applied status — not completed due to max client connections
- LAUSD headshot source URLs — laschoolboard.org returned TLS error; blocked
- Whether any -6003xxx politician rows already exist — unverified

---

## Metadata

**Confidence breakdown:**
- Migration 171 content: HIGH — read directly from file
- Migration 182 applied status: LOW — DB inaccessible; must verify in Plan 62-01
- CA Governor race structure: HIGH — confirmed from seed scripts and ingest scripts
- LAUSD infrastructure inventory: HIGH (from migrations/scripts) / LOW (live DB state unverified)
- LAUSD board members: MEDIUM — WebSearch confirmed; LAUSD website blocked
- lavote.gov election ID: HIGH — WebFetch confirmed id=4338 still serves June 2026 data
- Next migration number: HIGH — STATE.md explicitly states "Next migration is 196"

**Research date:** 2026-05-21
**Valid until:** 2026-06-03 (lavote election ID will need update after June 2026 primary)
