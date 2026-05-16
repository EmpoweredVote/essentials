# Phase Template: DB Foundation

Use this template when planning a phase that creates a new government row, chambers, and offices in the database.

**Applies to:** Steps 5 and 6 of LOCATION-ONBOARDING.md

---

## Pre-Migration Checklist

Before writing any SQL:

- [ ] Confirmed city geo_id (7-digit Census place code — NOT the county FIPS)
- [ ] Confirmed government name from official documents (e.g., "City of Cambridge" not "Cambridge")
- [ ] Confirmed all chamber names from official charter or city website
- [ ] Confirmed election_method enum value exists in DB (`SELECT constrname, consrc FROM pg_constraint WHERE conrelid = 'essentials.chambers'::regclass AND contype = 'c';`)
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
INSERT INTO essentials.governments (id, name, name_formal, geo_id, state, county_geo_id, government_type)
VALUES (
  gen_random_uuid(),
  '[short name]',
  '[official full name]',
  '[7-digit place code]',
  '[2-letter state abbrev]',
  '[5-digit county FIPS or NULL]',
  '[city|county|state|federal]'
) ON CONFLICT (geo_id) DO NOTHING;

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

## Common Mistakes

- Using county FIPS as geo_id → creates wrong government scope
- Including slug in chamber INSERT → PostgreSQL error (slug is generated)
- Using LOCAL_EXEC for a council-manager mayor → misrepresents power structure
- Seeding Mayor as School Committee member without confirming current charter
- Wrong election_method → DB constraint violation; verify enum value first
