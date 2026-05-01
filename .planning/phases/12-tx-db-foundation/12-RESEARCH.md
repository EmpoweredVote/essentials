# Phase 12: TX DB Foundation - Research

**Researched:** 2026-04-30
**Domain:** PostgreSQL data seeding — essentials schema governments/chambers/offices
**Confidence:** HIGH

---

## Summary

Phase 12 inserts Texas state, Collin County, and 24 Collin County city governments into the existing `essentials` schema along with their chambers and seat-level offices. No code changes are required — this is pure SQL migration work against the live Postgres database.

The `essentials.governments` table does **not** have a `geo_id` column. The phase description and success criteria reference "correct FIPS geo_id" but this language is aspirational/imprecise. FIPS identifiers live in `essentials.discovery_jurisdictions.jurisdiction_geoid`, not in `governments`. The planner must reconcile this gap — either add a `geo_id` column to `governments` (schema migration + data) or store FIPS only in `discovery_jurisdictions` (Phase 16). Research recommendation: store FIPS in `discovery_jurisdictions` (Phase 16's job) and skip adding a column to `governments` in Phase 12; the success criteria can be reinterpreted as "24 cities have governments rows" plus FIPS goes to Phase 16.

The project uses numbered SQL migrations in `C:\EV-Accounts\backend\migrations\`. The highest numbered file is `086_award_inform_yellow_gem.sql`. STATE.md says next migration is 085 — this is now **stale and wrong**: 085 and 086 already exist. The actual next available number is **087**.

**Primary recommendation:** One migration (087) inserts TX state + Collin County + 24 city governments + one City Council chamber per city + Mayor/Council seat offices per city. All at-large — no district sub-chambers needed for TX cities.

---

## Critical Pre-Planning Finding: geo_id Does Not Exist on governments

The `essentials.governments` table has exactly **5 columns**:

| Column | Type | Nullable |
|--------|------|----------|
| id | uuid | NO (PK, gen_random_uuid()) |
| name | text | YES |
| type | text | YES |
| state | text | YES |
| city | text | YES |

There is **no `geo_id` column**. The phase requirements use the term "geo_id" but this concept does not exist on the `governments` table. FIPS GEOIDs for Census places are stored in `essentials.discovery_jurisdictions.jurisdiction_geoid` (7 digits for cities: state 2-digit + place 5-digit).

**Decision required for planner:** The success criteria say "governments contains rows with correct FIPS geo_id." Options:
1. Add a `geo_id` column to `essentials.governments` in this migration and populate it
2. Treat FIPS as belonging to `discovery_jurisdictions` (Phase 16) and skip the column — governments rows succeed criteria 2-4 without FIPS

Looking at existing data: no existing `governments` rows store FIPS codes anywhere. The "geo_id" requirement in the phase description appears to be forward-looking intent for Phase 16 discovery wiring.

**Recommended approach:** Add a `geo_id TEXT` column to `essentials.governments` as part of this migration. This makes the success criteria literally true, stores FIPS at the government level for future geofence queries, and is a 1-line ALTER TABLE. Populate it for all rows inserted in this migration.

---

## Migration Numbering — CORRECTION

STATE.md says "next migration is 085" — **this is wrong as of 2026-04-30.**

Current highest migration: `086_award_inform_yellow_gem.sql`

**Next available migration number: 087**

Always verify before writing: `ls /c/EV-Accounts/backend/migrations/ | sort | tail -5`

---

## Standard Stack

This phase uses no new libraries. It is pure SQL.

### Core
| Tool | Version | Purpose |
|------|---------|---------|
| PostgreSQL | (live DB) | Target database |
| SQL migration file | `087_*.sql` | DDL + DML in `C:\EV-Accounts\backend\migrations\` |
| mcp__supabase-local__execute_sql | — | Verification queries |
| mcp__supabase-local__apply_migration | — | Apply migration to live DB |

### Migration File Pattern (from codebase)
- Location: `C:\EV-Accounts\backend\migrations\NNN_description.sql`
- Wrapped in `BEGIN; ... COMMIT;`
- Use `DO $$ DECLARE ... BEGIN ... END $$;` for variable-driven INSERTs with `RETURNING id`
- All `CREATE TABLE`/`ALTER TABLE` use `IF NOT EXISTS` / `IF NOT EXISTS` for idempotency
- `INSERT` statements do **not** use `IF NOT EXISTS` — migrations are applied exactly once

---

## Architecture Patterns

### Existing Government → Chamber → Office Hierarchy

The hierarchy is: `governments` → `chambers` (via `government_id`) → `offices` (via `chamber_id`).

**governments row pattern** (from live data):
```sql
-- City type (existing pattern for LA cities):
INSERT INTO essentials.governments (name, type, state, city)
VALUES ('City of Long Beach, California, US', 'LOCAL', 'CA', NULL);

-- State type (from live data):
INSERT INTO essentials.governments (name, type, state, city)
VALUES ('State of California', 'STATE', 'CA', '');

-- County type (from live data):
INSERT INTO essentials.governments (name, type, state, city)
VALUES ('Monroe County, Indiana, US', 'County', 'IN', NULL);
```

**Existing `type` values in use** (from live DB):
- `'LOCAL'` — used for most CA city governments (dominant pattern)
- `'STATE'` — used for state governments
- `'County'` — used for Indiana counties
- `'City'` — used for Bloomington IN, Huntington Beach CA
- `'NATIONAL'` / `'federal'` — federal government

For TX cities, use `'LOCAL'` (consistent with all CA cities). For TX state use `'STATE'`. For Collin County use `'County'`.

**chambers row pattern** (from live data):
```sql
INSERT INTO essentials.chambers (government_id, name, name_formal, official_count, slug, policy_engagement_level, website_url)
VALUES (
  v_gov_id,
  'City Council',
  'Plano City Council',
  7,        -- total seats including Mayor
  'plano-city-council',
  'full',
  'https://www.plano.gov/1345/Mayor-and-City-Council'
);
```

Key chambers columns: `government_id` (FK), `name`, `name_formal`, `official_count`, `slug`, `policy_engagement_level` (NOT NULL, default `'full'`), `website_url`. The `external_id` (bigint) is nullable and was used by BallotReady — leave NULL for new TX rows.

**offices row pattern — at-large council seats** (from Beverly Hills, which is the cleanest TX analog):
```sql
-- Mayor seat (1 per city)
INSERT INTO essentials.offices (chamber_id, title, representing_city, representing_state, normalized_position_name, seats, partisan_type, is_appointed_position)
VALUES (v_chamber_id, 'Mayor', 'Plano', 'TX', 'Mayor', 1, NULL, false);

-- Council seat (one row per seat for seat-level tracking)
INSERT INTO essentials.offices (chamber_id, title, representing_city, representing_state, normalized_position_name, seats, partisan_type, is_appointed_position)
VALUES (v_chamber_id, 'Council Member Place 1', 'Plano', 'TX', 'Council Member', 1, NULL, false);
```

Key offices columns: `chamber_id` (FK), `title`, `representing_city`, `representing_state`, `normalized_position_name`, `seats`, `partisan_type` (NULL for nonpartisan TX), `is_appointed_position`, `is_vacant` (default false), `politician_id` (FK, leave NULL — filled in Phases 13-15).

**CRITICAL — nonpartisan:** Texas municipal elections are nonpartisan. Set `partisan_type = NULL` (not `'nonpartisan'`). Existing nonpartisan examples (CA cities) have `partisan_type = NULL`.

### Bloomington IN Pattern vs. Beverly Hills CA Pattern

The Bloomington pattern uses multiple chambers (one per district) with the chamber name encoding the district. For TX cities that are **at-large** (no districts), use the simpler **Beverly Hills/Long Beach pattern**: one chamber named "City Council," then separate office rows for each Place number.

Beverly Hills has: 1 chamber "City Council" → offices for Mayor (seats=1), Councilmember (seats=1 per seat). This is the correct TX model since all Tier 1-2 TX cities are at-large.

### slug Convention

Slugs on chambers follow `{city-name}-city-council` pattern (hyphenated, lowercase):
- `'long-beach-city-council'`
- `'beverly-hills-city-council'`
- `'plano-city-council'`

### DO $$ block pattern for chained INSERTs

```sql
DO $$
DECLARE
  v_gov_id      UUID;
  v_chamber_id  UUID;
BEGIN
  INSERT INTO essentials.governments (name, type, state, city)
  VALUES ('City of Plano, Texas, US', 'LOCAL', 'TX', NULL)
  RETURNING id INTO v_gov_id;

  INSERT INTO essentials.chambers (government_id, name, name_formal, official_count, slug, policy_engagement_level, website_url)
  VALUES (v_gov_id, 'City Council', 'Plano City Council', 9, 'plano-city-council', 'full', 'https://www.plano.gov/1345/Mayor-and-City-Council')
  RETURNING id INTO v_chamber_id;

  INSERT INTO essentials.offices (chamber_id, title, representing_city, representing_state, normalized_position_name, seats, partisan_type, is_appointed_position)
  VALUES
    (v_chamber_id, 'Mayor',                  'Plano', 'TX', 'Mayor',          1, NULL, false),
    (v_chamber_id, 'Council Member Place 1',  'Plano', 'TX', 'Council Member', 1, NULL, false),
    ...;
END $$;
```

---

## The 24 Target Cities — FIPS Codes and Council Seat Counts

### FIPS Code Format

- **Texas state FIPS:** `48` (2-digit state code)
- **Collin County FIPS:** `48085` (state 48 + county 085)
- **City place GEOIDs:** 7-digit = state (2) + place (5), e.g. Plano = `4863000`

Census place FIPS codes come from `st48_tx_place2020.txt` (Census 2020 reference file). Format for `discovery_jurisdictions.jurisdiction_geoid` (7-digit): `48` + 5-digit place code.

### Tier 1 Cities (Highest priority)

| City | Census Place Code | 7-digit GEOID | Council Structure | Total Seats |
|------|------------------|---------------|-------------------|-------------|
| Plano | 63000 | 4863000 | Mayor + 8 at-large members | 9 |
| McKinney | 45744 | 4845744 | Mayor (at-large) + 2 at-large + 4 district | 7 |
| Allen | 01924 | 4801924 | Mayor + 6 at-large (Place 1-6) | 7 |
| Frisco | 27684 | 4827684 | Mayor + 6 at-large (Place 1,2,3,4,5,6) | 7 |

**Notes:**
- Plano: Mayor + 8 council members. Council members named by district 1-4 but elected at-large within district pairs. Use Place 1-8 for seat-level offices.
- McKinney: Mayor elected at-large; 2 at-large council members; 4 district council members. Use District 1-4 + At Large 1-2 for office titles.
- Allen: Mayor + Place 1 through Place 6 (all at-large). Three-year staggered terms.
- Frisco: Mayor + Place 1 through Place 6 (all at-large, including Place 3 and 5).

### Tier 2 Cities

| City | Census Place Code | 7-digit GEOID | Council Structure | Total Seats |
|------|------------------|---------------|-------------------|-------------|
| Murphy | 50100 | 4850100 | Mayor + 6 at-large (Place 1-6) | 7 |
| Celina | 13684 | 4813684 | Mayor + 6 at-large (Place 1-6) | 7 |
| Prosper | 63276 | 4863276 | Mayor + 6 at-large (Town council) | 7 |
| Richardson | 63500 | 4863500 | Mayor (Place 7) + 2 at-large + 4 district | 7 |

**Notes:**
- Prosper is a "Town" not a "City" but uses City Council / Town Council — use "Town Council" in chamber name_formal; still type `'LOCAL'` in governments.
- Richardson: Mayor + Places 1-6 (Places 1-4 are district seats, 5-6 are at-large).

### Tier 3 Cities

| City | Census Place Code | 7-digit GEOID | Council Structure | Est. Seats |
|------|------------------|---------------|-------------------|------------|
| Anna | 03300 | 4803300 | Mayor + 6 at-large | 7 |
| Melissa | 47496 | 4847496 | Mayor + 6 at-large | 7 |
| Princeton | 63432 | 4863432 | Mayor + 7 at-large | 8 |
| Lucas | 45012 | 4845012 | Mayor + council (est. 5-6) | ~6-7 |
| Lavon | 41800 | 4841800 | Mayor + council | ~5-7 |
| Fairview | 25224 | 4825224 | Mayor + 6 seats (Seat 1-6) | 7 |
| Van Alstyne | 75960 | 4875960 | Mayor + 6 at-large (by place) | 7 |
| Farmersville | 25488 | 4825488 | Mayor + council | ~5-6 |

### Tier 4 Cities (small footprint)

| City | Census Place Code | 7-digit GEOID | Notes |
|------|------------------|---------------|-------|
| Parker | 55152 | 4855152 | Mayor + 5 councilmembers (6 total) |
| Saint Paul | 64220 | 4864220 | Small town, est. Mayor + 5-6 |
| Nevada | 50760 | 4850760 | Small town |
| Weston | 77740 | 4877740 | Small town (pop 283) |
| Lowry Crossing | 44308 | 4844308 | Very small |
| Josephine | 38068 | 4838068 | Small |
| Blue Ridge | 08872 | 4808872 | Small |
| Copeville | 16600 | 4816600 | May be unincorporated / CDP |

**Note on Tier 4:** Copeville appears to be a census-designated place (CDP), not an incorporated municipality. It may not have a city council. Research each city's actual municipal status before creating government/chamber/offices rows. If a place is unincorporated, skip it or create a government row only (no chamber/offices).

---

## Governments Table — Recommended name Convention

Following the existing pattern exactly:

| Government Level | name pattern | type | state | city |
|-----------------|--------------|------|-------|------|
| TX State | `'State of Texas'` | `'STATE'` | `'TX'` | `''` |
| Collin County | `'Collin County, Texas, US'` | `'County'` | `'TX'` | `NULL` |
| City | `'City of Plano, Texas, US'` | `'LOCAL'` | `'TX'` | `NULL` |
| Town | `'Town of Prosper, Texas, US'` | `'LOCAL'` | `'TX'` | `NULL` |

Note: The existing CA county (LA County) has `city = 'Los Angeles County'` as a quirk — do NOT copy this for Collin County; use `NULL` to match the IN county pattern.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| FIPS lookup | Custom lookup table | Use pre-researched values in this document |
| government_id chaining | Hard-coded UUIDs | `RETURNING id INTO v_*` pattern |
| Idempotency for city count | IF NOT EXISTS on INSERT | Apply once, verify with SELECT after |
| geo_id storage | New schema or table | Add single `geo_id TEXT` column to governments |

**Key insight:** Every prior migration that added cities used the DO $$ DECLARE ... RETURNING id pattern. Never hard-code UUIDs in INSERT chains — always capture with RETURNING.

---

## Common Pitfalls

### Pitfall 1: Migration Number Stale in STATE.md
**What goes wrong:** STATE.md says next migration is 085 but 085 and 086 already exist.
**How to avoid:** Always run `ls /c/EV-Accounts/backend/migrations/ | sort | tail -5` before writing a migration. Actual next is **087**.

### Pitfall 2: geo_id Does Not Exist on governments
**What goes wrong:** Writing `INSERT INTO essentials.governments (name, type, state, city, geo_id)` will fail — column does not exist.
**How to avoid:** Add `ALTER TABLE essentials.governments ADD COLUMN IF NOT EXISTS geo_id TEXT;` at the top of the migration before any inserts.

### Pitfall 3: Copeville May Not Be Incorporated
**What goes wrong:** Creating chamber/offices for an unincorporated CDP that has no city council.
**How to avoid:** For Tier 4 cities, verify municipal incorporation status before creating chamber + offices rows. A government row can still be created for a CDP; just omit chamber/offices if no council exists.

### Pitfall 4: Prosper Is a "Town" Not a "City"
**What goes wrong:** Calling it "City of Prosper" in the governments.name when Prosper is officially a "Town."
**How to avoid:** Use `'Town of Prosper, Texas, US'` in the name. Chamber formal name: `'Prosper Town Council'`.

### Pitfall 5: TX Elections Are Nonpartisan — partisan_type Must Be NULL
**What goes wrong:** Setting `partisan_type = 'nonpartisan'` (string). The existing pattern for nonpartisan offices is `NULL`, not a string value.
**How to avoid:** Always use `NULL` for partisan_type on TX city offices.

### Pitfall 6: McKinney and Richardson Have Mixed At-Large + District Seats
**What goes wrong:** Creating a single at-large chamber when some seats are district-based.
**How to avoid:** For McKinney and Richardson, create two sets of offices within one chamber (labeled appropriately: "District 1", "At Large 1") rather than two chambers. The Bloomington multi-chamber pattern is overkill here; one chamber with descriptive office titles is sufficient.

### Pitfall 7: Princeton Has 8 Seats (Mayor + 7)
**What goes wrong:** Creating only 6 council seats for Princeton like other cities.
**How to avoid:** Princeton has the Mayor + 7 Council Members = 8 total. Create 7 council seat offices + 1 mayor.

---

## Code Examples

### Full Pattern — One City (Plano template)

```sql
-- Source: live DB observation of Beverly Hills + Bloomington patterns
DO $$
DECLARE
  v_gov_id     UUID;
  v_chamber_id UUID;
BEGIN
  INSERT INTO essentials.governments (name, type, state, city, geo_id)
  VALUES ('City of Plano, Texas, US', 'LOCAL', 'TX', NULL, '4863000')
  RETURNING id INTO v_gov_id;

  INSERT INTO essentials.chambers (government_id, name, name_formal, official_count, slug, policy_engagement_level, website_url)
  VALUES (
    v_gov_id,
    'City Council',
    'Plano City Council',
    9,
    'plano-city-council',
    'full',
    'https://www.plano.gov/1345/Mayor-and-City-Council'
  )
  RETURNING id INTO v_chamber_id;

  INSERT INTO essentials.offices (chamber_id, title, representing_city, representing_state, normalized_position_name, seats, partisan_type, is_appointed_position)
  VALUES
    (v_chamber_id, 'Mayor',                  'Plano', 'TX', 'Mayor',          1, NULL, false),
    (v_chamber_id, 'Council Member Place 1',  'Plano', 'TX', 'Council Member', 1, NULL, false),
    (v_chamber_id, 'Council Member Place 2',  'Plano', 'TX', 'Council Member', 1, NULL, false),
    (v_chamber_id, 'Council Member Place 3',  'Plano', 'TX', 'Council Member', 1, NULL, false),
    (v_chamber_id, 'Council Member Place 4',  'Plano', 'TX', 'Council Member', 1, NULL, false),
    (v_chamber_id, 'Council Member Place 5',  'Plano', 'TX', 'Council Member', 1, NULL, false),
    (v_chamber_id, 'Council Member Place 6',  'Plano', 'TX', 'Council Member', 1, NULL, false),
    (v_chamber_id, 'Council Member Place 7',  'Plano', 'TX', 'Council Member', 1, NULL, false),
    (v_chamber_id, 'Council Member Place 8',  'Plano', 'TX', 'Council Member', 1, NULL, false);
END $$;
```

### Verification Query (run after migration)

```sql
-- Verify complete chain for any TX city
SELECT 
  g.name AS government, g.geo_id,
  c.name AS chamber, c.official_count,
  COUNT(o.id) AS office_count
FROM essentials.governments g
LEFT JOIN essentials.chambers c ON c.government_id = g.id
LEFT JOIN essentials.offices o ON o.chamber_id = c.id
WHERE g.state = 'TX'
GROUP BY g.name, g.geo_id, c.name, c.official_count
ORDER BY g.name;
```

### Orphan Check

```sql
-- No orphaned chambers (government_id must resolve)
SELECT c.id, c.name FROM essentials.chambers c
LEFT JOIN essentials.governments g ON g.id = c.government_id
WHERE g.id IS NULL AND c.id IN (SELECT id FROM essentials.chambers WHERE government_id IN (SELECT id FROM essentials.governments WHERE state = 'TX'));

-- No orphaned offices (chamber_id must resolve)  
SELECT o.id, o.title FROM essentials.offices o
LEFT JOIN essentials.chambers c ON c.id = o.chamber_id
WHERE c.id IS NULL;
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| BallotReady external_id on chambers | NULL (not used for new TX entries) | Skip external_id entirely |
| `type = 'City'` on governments (Bloomington) | `type = 'LOCAL'` (all CA cities) | Use `'LOCAL'` for TX cities |
| Populate governments.city (LA County quirk) | NULL for cities, '' for state | Use NULL for TX cities/county |

---

## Open Questions

1. **Copeville incorporated status**
   - What we know: Census FIPS place code 16600 exists; listed as a populated place
   - What's unclear: Whether it has an incorporated city council
   - Recommendation: Create a governments row; omit chamber/offices if no council found; document in migration comment

2. **Exact seat counts for Tier 3-4 cities (Lavon, Nevada, Weston, Josephine, Lowry Crossing, Blue Ridge, Farmersville)**
   - What we know: Most TX small cities have 5-7 council members; Parker confirmed at 6 total
   - What's unclear: Exact seat counts for the smallest Tier 4 cities
   - Recommendation: Research each city's official website during migration authoring; default to 5 council members + Mayor (6 total) if no authoritative source found; document uncertainty in migration comments

3. **geo_id column — add to governments or keep in discovery_jurisdictions only**
   - What we know: No existing geo_id column on governments; FIPS lives in discovery_jurisdictions
   - What's unclear: Whether adding geo_id to governments is sanctioned by project owner
   - Recommendation: Add `geo_id TEXT` column — makes success criteria literally satisfiable and costs nothing; document in plan that this is a Phase 12 addition

---

## Sources

### Primary (HIGH confidence)
- Live DB query via `mcp__supabase-local__execute_sql` — governments, chambers, offices schema verified
- Live DB query — existing data patterns for name, type, state, city observed
- `C:\EV-Accounts\backend\migrations\073_long_beach_discovery.sql` — offices INSERT pattern
- `C:\EV-Accounts\backend\migrations\078_beverly_hills_races_and_candidates.sql` — office + chamber pattern
- `C:\EV-Accounts\backend\migrations\086_award_inform_yellow_gem.sql` — confirmed highest existing migration
- https://www2.census.gov/geo/docs/reference/codes2020/place/st48_tx_place2020.txt — Census 2020 TX place codes (21 of 24 cities confirmed)
- https://www.census.gov/programs-surveys/geography/guidance/geo-identifiers.html — place GEOID format confirmed (state 2 + place 5 = 7 digits)

### Secondary (MEDIUM confidence)
- https://www.plano.gov/1345/Mayor-and-City-Council — Plano: Mayor + 8 council (9 total)
- https://www.mckinneytexas.org/1167/Council-Members — McKinney: 7 total (Mayor + 2 at-large + 4 district)
- https://www.cityofallen.org/917/Allen-City-Council — Allen: 7 total (Mayor + Place 1-6)
- https://www.friscotexas.gov/585/City-Council — Frisco: 7 total (Mayor + Place 1-6)
- https://www.murphytx.org/1961/City-Council — Murphy: 7 total (Mayor + Place 1-6)
- https://www.celina-tx.gov/319/City-Council — Celina: 7 total (Mayor + Place 1-6)
- https://www.prospertx.gov/223/Town-Council — Prosper: 7 total (Mayor + 6 at-large)
- https://www.cor.net/government/city-council — Richardson: 7 total (Mayor + Places 1-6)
- https://www.annatexas.gov/319/City-Council — Anna: 7 total
- https://www.cityofmelissa.com/202/City-Council — Melissa: 7 total
- https://princetontx.gov/286/City-Council — Princeton: 8 total (Mayor + 7)
- https://www.parkertexas.us/76/City-Council — Parker: 6 total (Mayor + 5)
- https://fairviewtexas.org/government/town-council.html — Fairview: 7 total (Mayor + Seat 1-6)
- https://en.wikipedia.org/wiki/Weston,_Texas — Weston FIPS: 48-77740
- https://en.wikipedia.org/wiki/St._Paul,_Collin_County,_Texas — Saint Paul FIPS: 48-64220
- https://roadsidethoughts.com/tx/copeville-xx-collin-census.htm — Copeville place code: 16600

### Tertiary (LOW confidence — verify during migration authoring)
- Lucas, Lavon, Farmersville, Nevada, Josephine, Lowry Crossing, Blue Ridge, Van Alstyne seat counts: not verified from official sources; estimate 6-7 total based on TX small-city norms

---

## Metadata

**Confidence breakdown:**
- Schema (governments/chambers/offices columns): HIGH — verified from live DB
- Migration pattern: HIGH — multiple migrations observed
- FIPS codes (Tier 1-2 cities): HIGH — from Census 2020 reference file
- FIPS codes (Tier 3-4 cities): HIGH for most, LOW for Copeville/Saint Paul/Weston (Wikipedia/single source)
- Council seat counts (Tier 1-2): HIGH — from official city websites
- Council seat counts (Tier 3-4): MEDIUM-LOW — some cities not individually verified
- geo_id column absence: HIGH — confirmed from live DB introspection

**Research date:** 2026-04-30
**Valid until:** 2026-07-30 (FIPS codes are stable; council seats may change after May 3 election)
