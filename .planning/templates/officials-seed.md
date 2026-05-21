# Phase Template: Officials Seed

Use this template when planning a phase that seeds incumbent politicians with office linkages and contact data.

**Applies to:** Step 6 (Migration step 5) of LOCATION-ONBOARDING.md

---

## Multi-Tier City Seeding Strategy

When onboarding a state with many cities, use a tiered approach to manage coverage depth. The goal is visible, documented coverage — not silent omissions.

| Tier | Coverage | Who gets it |
|------|----------|-------------|
| Tier 1 | Incumbents + emails + headshots + addresses | Largest 1–3 cities; flagship coverage |
| Tier 2 | Incumbents + emails only (no headshots) | Next 5–10 cities by population |
| Tier 3–4 | Skeletal office rows only (`politician_id=NULL`) | All remaining cities; offices exist but no politicians seeded |

**GAPS.md requirement:** Create a `[STATE]-GAPS.md` file in the phase directory listing every Tier 3–4 city with status "not attempted." Silent omissions look identical to completed coverage — a GAPS.md makes the boundary explicit and creates a future phase backlog.

**Maine example:** Phase 53 = Tier 1 (Portland, 18 officials fully seeded with headshots and emails). Phase 54 = Tiers 2–4 (Lewiston/Bangor/SouthPortland/Auburn/Biddeford as Tier 2 incumbents + 18 skeletal cities as Tier 3–4). The GAPS.md in Phase 54 lists the 17 cities with `politician_id=NULL` offices and status "not attempted."

**Tier 2 external_id prefix pattern:** Use a 5-digit city-specific prefix per city to avoid collisions. Maine Tier 2 prefixes: Lewiston=-23387xxxx, Bangor=-23027xxxx, SouthPortland=-23719xxxx, Auburn=-23020xxxx, Biddeford=-23048xxxx.

---

## PowerShell Bulk-Seed Generator Pattern

For migrations with 100+ repetitive INSERT blocks (e.g., 151 House seat offices, 372 legislative race rows), hand-writing SQL invites arithmetic errors. Use a PowerShell script to generate the SQL file.

**CRITICAL encoding rule:** Use `[System.IO.File]::WriteAllLines($path, $lines, [System.Text.UTF8Encoding]::new($false))` to write the output file. The `$false` argument disables BOM (Byte Order Mark). Do NOT use `Out-File` or `Set-Content` — both produce BOM/UTF-16 that PostgreSQL rejects with a parse error at apply time.

```powershell
# Pattern from Phase 55-02 (generate_me_legislative_races.ps1)
$lines = @()
$lines += "-- ME 2026 Legislative Race Scaffold"
1..35 | ForEach-Object {
    $district = $_
    $lines += "INSERT INTO essentials.races (id, election_id, position_name, office_id, primary_party)"
    $lines += "SELECT gen_random_uuid(),"
    $lines += "  (SELECT id FROM essentials.elections WHERE name = '2026 ME State Primary' AND state = 'ME'),"
    $lines += "  'ME State Senate District $district',"
    $lines += "  (SELECT o.id FROM essentials.offices o"
    $lines += "   JOIN essentials.districts d ON o.district_id = d.id"
    $lines += "   WHERE d.geo_id = '23' AND d.district_type = 'STATE_UPPER' AND d.label LIKE 'Senate District $district%'),"
    $lines += "  'Democratic'"
    $lines += "WHERE NOT EXISTS (SELECT 1 FROM essentials.races WHERE position_name = 'ME State Senate District $district' AND primary_party = 'Democratic');"
}
[System.IO.File]::WriteAllLines(".\output\184_me_legislative_races.sql", $lines, [System.Text.UTF8Encoding]::new($false))
```

**Maine example:** Phase 55-02 PowerShell generator produced migration 184 (372 legislative race rows: 35 senate × 2 primaries + 151 house × 2 primaries). The generator ran in ~2 seconds; hand-writing would have been 400+ blocks prone to district numbering errors.

---

## essentials.offices and essentials.politicians Schema Gotchas

These columns do NOT exist — do not invent them in INSERT or UPDATE statements:

| Table | Column that does NOT exist | What to use instead |
|-------|---------------------------|---------------------|
| `essentials.offices` | `seat_label` | Embed in `title`: `'Council Member (Ward 3)'`, `'Council Member (At-Large 2)'` |
| `essentials.offices` | `is_active` | No equivalent; use `politician_id IS NULL` to identify unoccupied seats |
| `essentials.offices` | `email` | Emails belong on `politicians.email_addresses` (TEXT[] array) |
| `essentials.districts` | `short_label` | Only `label` exists |
| `essentials.politicians` | single-value `email_address` | Use `email_addresses TEXT[]`: `ARRAY['addr@domain']` in INSERT VALUES |

**UPDATE pattern for adding incumbent to an existing skeletal office** (where `politician_id IS NULL`): match on `(chamber_id, title)` — there is no `seat_label` to match on.

```sql
UPDATE essentials.offices
SET politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -23387001)
WHERE chamber_id = (SELECT id FROM essentials.chambers WHERE slug = 'lewiston-city-council')
  AND title = 'Council Member (Ward 1)'
  AND politician_id IS NULL;
```

**Maine example:** Phase 54 migration 180 used this exact pattern to add Lewiston incumbents to the skeletal offices seeded in migration 177.

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
