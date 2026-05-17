# Phase Template: Officials Seed

Use this template when planning a phase that seeds incumbent politicians with office linkages and contact data.

**Applies to:** Step 6 (Migration step 5) of LOCATION-ONBOARDING.md

---

## Pre-Seed Checklist

- [ ] Government row exists (db-foundation phase complete for this city)
- [ ] All chamber rows exist
- [ ] All office rows exist (one per seat)
- [ ] Confirmed official full names from primary source (not Wikipedia — Wikipedia lags name changes)
- [ ] Confirmed term start dates from official election results or city website
- [ ] Confirmed email addresses from official city website at time of seeding (NOT inferred from patterns)
- [ ] Checked whether any emails are behind Cloudflare or bot protection (if yes, email_address = NULL is acceptable)
- [ ] Confirmed whether any politician holds two offices simultaneously (e.g., Mayor + Councillor)
- [ ] Next migration number confirmed

## Data Source Priority

1. Official city website — members/officials page (e.g., cambridgema.gov/Departments/citycouncil/members)
2. State election authority — official results for term start dates and full legal names
3. MMA Data Hub or state municipal association — secondary check on key officials
4. Ballotpedia — useful if the city is covered; often incomplete for smaller cities

**Do NOT use:**
- Wikipedia as primary name source (lags by months after council changes)
- Open data portal (does not contain personnel/contact data)
- Pattern-inferred email addresses (guess and check against official source or set NULL)

## Politician Row Fields

```sql
INSERT INTO essentials.politicians (
  id,
  full_name,
  office_id,           -- primary office; dual-role politicians link to both offices separately
  government_id,
  is_incumbent,
  is_active,
  is_appointed,        -- true for City Manager, appointed Mayor, etc.
  valid_from,          -- term start date (YYYY-MM-DD)
  valid_to,            -- NULL if current term has no known end
  email_addresses,     -- TEXT[] — NULL if not verified; do not guess
  urls,                -- TEXT[] — bio/contact page URL
  data_source          -- citation string
) VALUES (...);
```

## Dual-Office Pattern

> [GOTCHA] Before seeding any incumbents in a Council-Manager city: verify that the unique index on `essentials.offices.politician_id` has been dropped (it should have been dropped in the offices migration). If the index still exists, the dual-office UPDATE will succeed for the first office but fail or behave unexpectedly for a second assignment.
> Check: `SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'offices' AND indexname LIKE '%politician_id%';`
> A **unique** index here means the drop migration was not applied — stop and fix before seeding.

When one politician holds two titles simultaneously (e.g., Cambridge Mayor who is also a City Councillor):

```sql
-- Step 1: Insert the politician ONCE
INSERT INTO essentials.politicians (id, full_name, ...) VALUES ('[uuid]', '[name]', ...);

-- Step 2: Link to primary office (e.g., Councillor seat)
UPDATE essentials.politicians SET office_id = (SELECT id FROM essentials.offices WHERE title = 'Councillor' AND seat_number = N)
WHERE id = '[uuid]';

-- Step 3: Update the Mayor office row to point to this politician_id
UPDATE essentials.offices SET politician_id = '[uuid]' WHERE title = 'Mayor' AND government_id = '[government_id]';
```

> **Cambridge example:**
> - Sumbul Siddiqui holds the City Councillor seat AND the Mayor title simultaneously (elected Mayor by council on 2026-01-05, third consecutive term)
> - ONE politician row for Siddiqui; office_id = her Councillor seat (primary display title)
> - The Mayor office row's politician_id = Siddiqui's UUID
> - Valid_from = 2026-01-06 (post-November 2025 election, Mayor elected 2026-01-05)
> - Email: pulled from cambridgema.gov/Departments/citycouncil/members at seeding time; format varies per member (NOT always firstname@cambridgema.gov)

## Verification Queries

```sql
-- All politicians for this government
SELECT p.full_name, o.title, o.seat_number, p.is_incumbent, p.is_appointed, p.email_addresses, p.valid_from
FROM essentials.politicians p
JOIN essentials.offices o ON p.office_id = o.id
JOIN essentials.governments g ON p.government_id = g.id
WHERE g.geo_id = '[geo_id]'
ORDER BY o.title, o.seat_number;

-- Check for politicians missing office linkage
SELECT p.full_name FROM essentials.politicians p WHERE p.government_id = '[government_id]' AND p.office_id IS NULL;

-- Check email coverage
SELECT COUNT(*) as total, COUNT(p.email_addresses) as with_email FROM essentials.politicians p WHERE p.government_id = '[government_id]';
```

## Common Mistakes

- Seeding Mayor as a separate elected politician (correct: same row as council seat, linked to Mayor office via UPDATE)
- Guessing email addresses from patterns without verifying against official source
- Using Wikipedia names that lag council changes
- Forgetting to set is_appointed = true for City Manager and other appointed officials
- Setting is_incumbent = false for currently serving officials
- Not verifying the Cambridge Mayor name from official source before migrating — this template previously had "McGovern" when the incumbent was Siddiqui; always confirm from cambridgema.gov before writing migration SQL
