# Phase Template: DB Foundation

Use this template when planning a phase that creates a new government row, chambers, and offices in the database.

**Applies to:** Steps 5 and 6 of LOCATION-ONBOARDING.md

---

## Valid election_method Values

`election_method` is a TEXT column on `essentials.chambers`. Valid values (as of v5.0):

| Value | Description |
|-------|-------------|
| `plurality` | Single vote; most votes wins; standard US municipal election |
| `stv_proportional` | Single Transferable Vote; ranked multi-seat election |
| `ranked_choice` | IRV (Instant Runoff Voting); single-seat ranked-choice |
| `runoff` | Top-two runoff if no majority in first round |

Do NOT invent new values. If the city uses a method not in this list, document it in STATE.md first and update this table before using it in a chambers INSERT.

---

## Council Structure Decision Tree

Before writing any SQL for offices, determine the city's government form:

**Strong Mayor-Council**
- Mayor is directly elected by voters as a separate executive role
- Mayor does NOT hold a council seat (they ARE the executive, not a council member)
- Schema: Mayor office → `district_type=LOCAL_EXEC`, `is_appointed_position=false`
- `offices.politician_id` unique index: keep (each politician holds at most one office)

**Council-Manager** [GOTCHA — requires index drop]
- Mayor is selected from within the council body (top vote-getter or a council vote)
- Mayor simultaneously holds a council seat (they are still a councillor + the Mayor title)
- Schema: Mayor office → `district_type=LOCAL`, `is_appointed_position=true`
- City Manager office → `is_appointed_position=true`
- Schema gotcha: one `politician_id` must point to BOTH the Councillor office AND the Mayor office
- **REQUIRED:** DROP the unique index on `essentials.offices.politician_id` in the migration before assigning `politician_id` to Mayor/Councillor offices for the same person
- Replace with non-unique index for join performance: `CREATE INDEX offices_politician_id_idx ON essentials.offices(politician_id)`
- *Cambridge example: Sumbul Siddiqui holds the City Councillor seat AND the Mayor title. Migration 159 dropped the unique index to allow this.*

**Commission**
- Commissioners serve as both legislative and executive (no separate Mayor/Manager)
- All commissioner offices: `district_type=LOCAL`, `is_appointed_position=false`
- `offices.politician_id` unique index: keep

---

## Pre-Migration Checklist

Before writing any SQL:

- [ ] Confirmed city geo_id (7-digit Census place code — NOT the county FIPS)
- [ ] Confirmed government name from official documents (e.g., "City of Cambridge" not "Cambridge")
- [ ] Confirmed all chamber names from official charter or city website
- [ ] [GOTCHA] `election_method` is a TEXT column, NOT a pg_constraint CHECK constraint. Do not run the `pg_constraint` query — it returns nothing useful. Instead, verify the value against the Valid election_method Values table above.
- [ ] Confirmed next migration number (`SELECT MAX(version) FROM supabase_migrations.schema_migrations;`)
- [ ] Confirmed seat counts for each chamber from official charter
- [ ] Confirmed which offices are is_appointed_position = true
- [ ] Confirmed whether any chamber uses a non-standard member title (double-l "Councillor", "Alderman", etc.)
- [ ] Confirmed slug is NOT included in chamber INSERT (slug is a GENERATED column — never insert it)

## Decisions to Record Before Migrating

| Decision | Answer |
|----------|--------|
| geo_id | |
| government name_formal | |
| Mayor district_type | LOCAL or LOCAL_EXEC |
| Mayor is_appointed_position | true / false |
| City Manager exists? | yes / no |
| election_method enum value | |
| enum exists in DB? | yes / no |
| Next migration number | |

## Migration Structure

```sql
-- 1. Government row
-- [GOTCHA] essentials.governments has NO unique constraint on geo_id
-- Use WHERE NOT EXISTS, not ON CONFLICT (geo_id) — that fails with "no unique constraint" error
INSERT INTO essentials.governments (id, name, name_formal, geo_id, state, county_geo_id, government_type)
SELECT
  gen_random_uuid(),
  '[short name]',
  '[official full name]',
  '[7-digit place code]',
  '[2-letter state abbrev]',
  '[5-digit county FIPS or NULL]',
  '[city|county|state|federal]'
WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE geo_id = '[7-digit place code]');

-- 2. Chambers (one per legislative/governing body)
-- NOTE: Do NOT include slug — it is a GENERATED column
INSERT INTO essentials.chambers (id, government_id, name, name_formal, chamber_type, seats, election_method)
VALUES (
  '[uuid]',
  (SELECT id FROM essentials.governments WHERE geo_id = '[geo_id]'),
  '[chamber name]',
  '[chamber name_formal]',
  '[chamber_type]',
  [seat count],
  '[election_method]'
) ON CONFLICT DO NOTHING;

-- 3. Offices (one per seat)
INSERT INTO essentials.offices (id, chamber_id, government_id, title, district_type, is_appointed_position, seat_number)
VALUES
  ('[uuid]', '[chamber_id]', '[government_id]', '[title]', '[district_type]', false, [seat_number]),
  -- repeat for each seat
ON CONFLICT DO NOTHING;
```

## Verification Queries

Run after applying migration:

```sql
-- Confirm government row
SELECT id, name, name_formal, geo_id, state FROM essentials.governments WHERE geo_id = '[geo_id]';

-- Confirm chambers
SELECT id, name, seats, election_method FROM essentials.chambers WHERE government_id = (SELECT id FROM essentials.governments WHERE geo_id = '[geo_id]');

-- Confirm offices
SELECT o.title, o.district_type, o.is_appointed_position, o.seat_number
FROM essentials.offices o
JOIN essentials.chambers c ON o.chamber_id = c.id
JOIN essentials.governments g ON o.government_id = g.id
WHERE g.geo_id = '[geo_id]'
ORDER BY c.name, o.seat_number;
```

## Cambridge Example

> - geo_id: 2511000 (city place code — NOT 25017 which is Middlesex County)
> - government name_formal: "City of Cambridge"
> - City Council chamber: 9 seats, election_method = stv_proportional (verify enum exists before running)
> - Mayor office: is_appointed_position = true, district_type = LOCAL (not LOCAL_EXEC)
> - School Committee: 6 elected seats (Mayor is NOT an automatic member under 2025 charter)
> - City Manager: is_appointed_position = true office row + is_appointed = true on politician row
> - Member title: "Councillor" (double-l) — hard-code, do not normalize
> - Migration: check MAX(version) before writing file; as of v5.0 planning, next was 111

---

## Senator Office Uniqueness (state legislatures)

**Problem:** In a US bicameral legislature, two senators share the same NATIONAL_UPPER district (e.g., Maine: Collins + King both represent Maine's single NATIONAL_UPPER district, which has `district_id = [same UUID]`). If you model the office uniqueness key as `(district_id, chamber_id)`, the second senator INSERT violates the constraint because `chamber_id` is identical for both rows.

**Solution:** The uniqueness key for senator office rows must be `(district_id, politician_id)`, not `(district_id, chamber_id)`. Each senator is a distinct politician, so `politician_id` is the correct differentiator.

**Maine example:** Phase 51-02 migration 170 seeded Collins (external_id=-230101, UUID 6b817122) and King (external_id=-230102, UUID 4f4b2bff) on the same NATIONAL_UPPER district_id. Both use `(district_id, politician_id)` as the effective uniqueness key — verified working in production.

**For your state:** This applies to all 50 US states (each has two US senators). Also applies to state senate districts where any SLDU district is represented by more than one person (rare but possible for interim appointments).

---

## Legislature-Elected Offices (state-specific)

**Problem:** In some states, the Attorney General, Secretary of State, or Treasurer is elected by the legislature rather than by voters. These offices appear on no ballot. If you assume popular election and create `essentials.elections` or `essentials.races` rows for these chambers, you will display a fake election that does not exist.

**Solution:**
- Set `is_appointed_position=true` on the office row
- Create NO rows in `essentials.elections` or `essentials.races` for these chambers
- These officials still need politician rows and headshots — they just never appear in election infrastructure

**Research step:** Before assuming popular election for any state executive officer (AG, SoS, Treasurer, Comptroller), check the state constitution. Wikipedia's state government article is sufficient for this check.

**Maine example:** Frey (AG), Bellows (SoS), Perry (Treasurer) — all `is_appointed_position=true`; zero race rows in `essentials.races` for these chambers (Phase 51-01, migration 169). Maine legislature elects these officers in joint session every two years.

**States where this applies (non-exhaustive):** Maine, Tennessee, Virginia, New Hampshire. Always verify per state — do not assume.

---

## Common Mistakes

- Using county FIPS as geo_id → creates wrong government scope
- Including slug in chamber INSERT → PostgreSQL error (slug is generated)
- Using LOCAL_EXEC for a council-manager mayor → misrepresents power structure
- Seeding Mayor as School Committee member without confirming current charter
- Using `ON CONFLICT (geo_id)` for government INSERT → essentials.governments has no unique constraint on geo_id; use `WHERE NOT EXISTS`
- Not dropping `offices.politician_id` unique index for Council-Manager cities → unique constraint violation when Mayor also holds a council seat
- Running pg_constraint query to verify election_method → returns nothing; election_method is TEXT, check the Valid election_method Values table
