# Phase 13: Tier 1 Officials — Plano + McKinney - Research

**Researched:** 2026-05-01
**Domain:** Data seeding — essentials.politicians, linked to Phase 12 offices; TX municipal incumbents
**Confidence:** HIGH (politician identity and contact patterns); MEDIUM (some email addresses, term dates)

---

## Summary

Phase 13 seeds current incumbent politicians for Plano and McKinney into `essentials.politicians`, linked to the office rows created in Phase 12 (migration 088). This is pure SQL migration work with a human-review checkpoint before any inserts are written.

**Critical finding: The May 2, 2026 uniform election has no Plano or McKinney races.** Neither city has council seats on the May 2026 ballot. The current incumbents were elected in May 2025 (regular election) and January 2026 (Plano Place 7 special election). The "post-May 3, 2026 winners" framing in the CONTEXT.md does not apply to Plano or McKinney — the current pre-May 2026 roster IS the correct post-election roster for both cities. Both cities' next elections are May 2027.

Plano has 9 seats (Mayor/Place 6 + Places 1–5 and 7–8). McKinney has 7 seats (Mayor at-large + At-Large 1 + At-Large 2 + Districts 1–4). All seats are currently filled by confirmed incumbents. No runoffs are pending for either city.

**Primary recommendation:** Research agent browses `plano.gov/1345/Mayor-and-City-Council` and `mckinneytexas.org/1167/Council-Members` for the authoritative roster, cross-references election results from collincountyvotes.gov for term start dates, writes a staging markdown file, human reviews, then SQL migration is applied.

---

## Critical Pre-Phase Finding: No May 2026 Election for Plano or McKinney

### Confirmed from official sources

The May 2, 2026 uniform election ballot for Collin County was confirmed via NBC DFW and does NOT include Plano or McKinney. The Collin County cities with May 2, 2026 races are:
- Allen, Anna, Carrollton, Celina, Fairview, Frisco, Lucas, Murphy, Parker, Princeton, Sachse

McKinney's official elections page confirms: next general election is May 1, 2027 (seats: District 2, District 4, At-Large 2).

Plano held races in May 2025 for Mayor + Places 2, 4, 5, 8. Place 7 was filled via special election January 31, 2026 (Shun Thomas). Places 1, 3 were last elected May 2023.

**Implication:** There is no "post-election winner" to seed. The current roster is already the definitive set of incumbents. The CONTEXT.md's "seed post-May 3, 2026 winners" instruction applies to the election cycle generally — for Plano and McKinney specifically, the pre-May 2026 roster is the current roster. Seed it as-is.

**Citation:** https://www.nbcdfw.com/news/politics/lone-star-politics/collin-county-election-all-races-may-2-2026/4012500/ and https://www.mckinneytexas.org/139/Elections

---

## Confirmed Plano Roster (as of 2026-05-01)

All 9 seats filled. Source: https://www.plano.gov/1345/Mayor-and-City-Council (official city site, fetched 2026-05-01)

| Place | Title | Name | Elected/Took Office | Term End | Office IDs (Phase 12) |
|-------|-------|------|---------------------|----------|-----------------------|
| 6 (Mayor) | Mayor | John B. Muns | May 2021 (re-elected May 2025) | May 2029 | Mayor office in Plano chamber |
| 1 | Mayor Pro Tem / Council Member | Maria Tu | May 2019 (re-elected May 2023) | May 2027 | Council Member Place 1 |
| 2 | Council Member | Bob Kehr | May 2025 | May 2029 | Council Member Place 2 |
| 3 | Deputy Mayor Pro Tem / Council Member | Rick Horne | May 2023 | May 2027 | Council Member Place 3 |
| 4 | Council Member | Chris Krupa Downs | May 2025 | May 2029 | Council Member Place 4 |
| 5 | Council Member | Steve Lavine | May 2025 | May 2029 | Council Member Place 5 |
| 7 | Council Member | Shun Thomas | Feb 9, 2026 (special election Jan 31, 2026) | May 2027 | Council Member Place 7 |
| 8 | Council Member | Vidal Quintanilla | May 2025 | May 2029 | Council Member Place 8 |

**Note on naming:** The official city site lists her as "Chris Krupa Downs" — use this full name. Research also found "Christene 'Chris' Krupa Downs" — use "Chris Krupa Downs" as the staging name, "Chris" as preferred_name.

**Bio page URL pattern:** `https://www.plano.gov/{page_id}/{Name-Slug}` — individual pages confirmed:
- Mayor: https://www.plano.gov/1349/Mayor-John-B-Muns
- Place 1: https://www.plano.gov/1355/Mayor-Pro-Tem-Maria-Tu
- Place 2: https://www.plano.gov/1354/Councilmember-Bob-Kehr
- Place 3: https://www.plano.gov/1356/Councilmember-Rick-Horne
- Place 4: https://www.plano.gov/1353/Councilmember-Chris-Krupa-Downs
- Place 5: https://www.plano.gov/1357/Councilmember-Steve-Lavine
- Place 7: https://www.plano.gov/1358/Councilmember-Shun-Thomas
- Place 8: https://www.plano.gov/1359/Councilmember-Vidal-Quintanilla

**Email pattern for Plano:** `{firstname}{lastname}@plano.gov` (lowercase, no separator). Confirmed pattern from search: `shunthomas@plano.gov`, `bobkehr@plano.gov`, `chrisdowns@plano.gov`, `mariatu@plano.gov`, `rickhorne@plano.gov`, `stevelavine@plano.gov`, `vidalquintanilla@plano.gov`. Mayor email: `mayor@plano.gov` (separate pattern for the Mayor role). Confidence: MEDIUM — pattern confirmed, individual emails not directly verified from official email listings (CloudFlare-protected contact form on city site).

**Research agent note:** Agent should verify each Plano bio URL is live and contains the member's name before staging; page IDs from the official council page are the citation URLs.

---

## Confirmed McKinney Roster (as of 2026-05-01)

All 7 seats filled. Source: https://www.mckinneytexas.org/1167/Council-Members (official city site, fetched 2026-05-01)

| Seat | Title | Name | Elected | Term End | Notes |
|------|-------|------|---------|----------|-------|
| Mayor (at-large) | Mayor | Bill Cox | Runoff June 2025 | May 2029 | Former council member/mayor pro tem |
| At-Large 1 | Council Member | Ernest Lynch | Runoff June 2025 | May 2029 | Former CEO Medical City McKinney |
| At-Large 2 | Mayor Pro Tem / Council Member | Michael Jones | May 2023 (or prior) | May 2027 | Term up May 2027 |
| District 1 | Council Member | Justin Beller | May 2025 (ran unopposed) | May 2029 | Banker |
| District 2 | Council Member | Patrick Cloutier | (prior cycle) | May 2027 | Term up May 2027 |
| District 3 | Mayor Pro Tem / Council Member | Geré Feltus | May 2025 (won 54%) | May 2029 | Physician; note accent in name |
| District 4 | Council Member | Rick Franklin | (prior cycle) | May 2027 | Term up May 2027 |

**Name note:** "Geré Feltus" — the accent in "Geré" is the official name form. Store as full_name='Geré Feltus', first_name='Geré', last_name='Feltus'.

**Bio page URL pattern (McKinney):** All bio anchors are on the single council page with in-page anchors:
- Mayor: https://www.mckinneytexas.org/1167/Council-Members#Mayor (or use the council page as citation)
- District 1: https://www.mckinneytexas.org/1167/Council-Members#District1
- District 2: https://www.mckinneytexas.org/1167/Council-Members#District2
- District 3: https://www.mckinneytexas.org/1167/Council-Members#District3
- District 4: https://www.mckinneytexas.org/1167/Council-Members#District4
- At-Large 1: https://www.mckinneytexas.org/1167/Council-Members#AtLarge1
- At-Large 2: https://www.mckinneytexas.org/1167/Council-Members#AtLarge2

**Email pattern for McKinney:** Emails are CloudFlare-protected on the official council page. Pattern from RocketReach analysis: first-initial + last-name @ mckinneytexas.org (e.g., `jbeller@mckinneytexas.org`). One confirmed pattern seen in legistar: `district4@mckinneytexas.org` for Rick Franklin. McKinney may use role-based emails (district1, district2, etc.) rather than personal name emails. The agent should try to decode or confirm — if emails cannot be confirmed from official sources, leave null per CONTEXT.md instructions. Confidence: LOW for individual email addresses.

---

## essentials.politicians Table Schema

The full column set confirmed from `stagingService.ts`, `adminService.ts`, and `essentialsService.ts`:

### Columns used in politician INSERT (confirmed from source code)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | auto-generated |
| first_name | TEXT | |
| last_name | TEXT | |
| preferred_name | TEXT | nullable |
| full_name | TEXT | required |
| party | TEXT | NULL for TX (nonpartisan) |
| party_short_name | TEXT | NULL for TX |
| slug | TEXT | nullable; e.g. 'john-muns' |
| bio_text | TEXT | nullable |
| photo_origin_url | TEXT | nullable; leave null for new TX rows |
| photo_custom_url | TEXT | nullable |
| is_active | BOOLEAN | true for active incumbents |
| is_incumbent | BOOLEAN | true for current office-holders |
| is_vacant | BOOLEAN | false for filled seats |
| is_appointed | BOOLEAN | false for elected officials |
| external_id | BIGINT | nullable; BallotReady ID; leave null |
| office_id | UUID | FK to essentials.offices.id |
| valid_from | TEXT | term start date (e.g. '2025-05-10') |
| valid_to | TEXT | term end date (e.g. '2029-05-01') |
| term_date_precision | TEXT | nullable; e.g. 'month' or 'year' |
| urls | TEXT[] | nullable array; bio URL goes here |
| email_addresses | TEXT[] | nullable array; official email goes here |
| web_form_url | TEXT | nullable; contact form URL |
| bio_text | TEXT | nullable |
| notes | TEXT | nullable |
| data_source | TEXT | e.g. 'city-website' or 'plano.gov' |
| home_jurisdiction_geoid | TEXT | nullable |

**Key insight on contact fields:** Phase 13 uses `email_addresses` (text array) for official email and `urls` (text array) for bio URL. There is a separate `essentials.politician_contacts` table used by the full pipeline — but for this seeding phase, using `email_addresses` and `urls` array columns on the main table is the correct pattern (matches how `stagingService.ts` and the service layer reads contact data). The `politician_contacts` table is for the BallotReady/discovery pipeline, not for manually seeded records.

**Office linkage pattern:** `politicians.office_id` = the office row's UUID (FK). The `offices.politician_id` FK also exists and should be updated: after inserting the politician, UPDATE the office row to set `politician_id = new_politician_id`.

---

## Architecture Patterns

### Pattern 1: INSERT INTO essentials.politicians with office linkage

```sql
-- Source: stagingService.ts promoteToEssentials() + Phase 35 migration

DO $$
DECLARE
  v_politician_id UUID;
  v_office_id     UUID;
BEGIN
  -- Get the office_id from Phase 12
  SELECT id INTO v_office_id
  FROM essentials.offices o
  JOIN essentials.chambers ch ON ch.id = o.chamber_id
  JOIN essentials.governments g ON g.id = ch.government_id
  WHERE g.geo_id = '4863000'   -- Plano FIPS
    AND o.title = 'Mayor';

  IF v_office_id IS NULL THEN
    RAISE EXCEPTION 'Office not found for Plano Mayor';
  END IF;

  INSERT INTO essentials.politicians
    (first_name, last_name, full_name, is_active, is_incumbent, is_vacant, is_appointed,
     office_id, valid_from, valid_to, email_addresses, urls, data_source)
  VALUES
    ('John B.', 'Muns', 'John B. Muns', true, true, false, false,
     v_office_id, '2025-05-10', '2029-05-01',
     ARRAY['mayor@plano.gov'],
     ARRAY['https://www.plano.gov/1349/Mayor-John-B-Muns'],
     'plano.gov')
  RETURNING id INTO v_politician_id;

  -- Also update offices.politician_id (bidirectional FK)
  UPDATE essentials.offices
  SET politician_id = v_politician_id
  WHERE id = v_office_id;

  RAISE NOTICE 'Inserted Mayor John B. Muns (%)', v_politician_id;
END $$;
```

### Pattern 2: Office lookup by city geo_id + office title

```sql
-- Reliable way to get office_id without hardcoding UUIDs
SELECT o.id
FROM essentials.offices o
JOIN essentials.chambers ch ON ch.id = o.chamber_id
JOIN essentials.governments g ON g.id = ch.government_id
WHERE g.geo_id = '4863000'  -- Plano
  AND o.title = 'Council Member Place 1';
```

### Pattern 3: Staging file format (for human review checkpoint)

The staging file is a Markdown table, one row per politician, written by the agent after browsing. Format:

```markdown
| City | Office Title | Name | First | Last | Preferred | email_addresses | urls | valid_from | valid_to | Citation URL |
|------|-------------|------|-------|------|-----------|-----------------|------|------------|----------|--------------|
| Plano | Mayor | John B. Muns | John B. | Muns | | mayor@plano.gov | https://www.plano.gov/1349/Mayor-John-B-Muns | 2025-05-10 | 2029-05-01 | https://www.plano.gov/1345/Mayor-and-City-Council |
```

All columns nullable except Name, First, Last, City, Office Title, and Citation URL. If email not found: leave empty. If bio URL not found: leave empty.

### Pattern 4: Migration wraps all politicians in a single DO block per city

Each city gets one DO block that inserts all politicians and updates all office rows. If any insert fails, the whole city rolls back (idempotency — the migration runs exactly once, per project convention).

### Anti-Patterns to Avoid

- **Hard-coded office UUIDs:** Never write `office_id = 'some-uuid'`. Always look up via geo_id + title join.
- **Skipping offices.politician_id update:** After inserting a politician, ALWAYS update `offices.politician_id` too — the service layer JOINs both ways.
- **Storing district info on politician:** Per CONTEXT.md, rely on `office_id` link only. No `district_type` or `district_label` columns on the politician row.
- **Using party = 'nonpartisan':** TX municipal elections are nonpartisan. `party = NULL`, `party_short_name = NULL`.
- **Contact fallbacks:** No city hall generic emails. If individual email not found, `email_addresses = NULL` (omit from INSERT or use NULL explicitly).
- **Leaving offices.politician_id NULL:** Both FKs must be populated. Check both after migration.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Lookup Phase 12 office UUIDs | Hard-coded UUID lookup table | JOIN on geo_id + office title pattern |
| Contact parsing from CloudFlare-protected emails | HTML scraping or brute-force | Use known email format pattern; if unverifiable leave null |
| Term date calculation | Custom date logic | Pull exact dates from official election result pages |
| Politician slug generation | Custom slug function | Set `slug = lower(regexp_replace(full_name, '[^a-zA-Z0-9]', '-', 'g'))` manually in SQL, or leave null |

**Key insight:** The office lookup pattern (`JOIN governments ON geo_id`) is the only safe way to link politicians to offices without hardcoding UUIDs that were generated at migration time.

---

## Common Pitfalls

### Pitfall 1: Missing `offices.politician_id` Update

**What goes wrong:** INSERT into `politicians` sets `politicians.office_id` correctly, but `offices.politician_id` is left NULL. The service layer JOINs `essentials.offices o ON o.politician_id = p.id` in several queries (e.g., `essentialsBodiesService.ts` lines 60, 119) — those queries return no results for politicians with no matching `offices.politician_id`.

**How to avoid:** Every DO block must include an UPDATE on `essentials.offices SET politician_id = v_politician_id WHERE id = v_office_id` after each INSERT.

### Pitfall 2: No May 2026 Election Change Needed

**What goes wrong:** Agent or planner assumes incumbents changed on May 2, 2026 and tries to research "post-election winners" for Plano/McKinney. Neither city has races on May 2, 2026.

**How to avoid:** Research phase confirmed: Plano and McKinney are NOT on the May 2, 2026 uniform election ballot. Current roster = definitive roster for this phase. No pre/post election comparison needed.

### Pitfall 3: Plano Place 7 Special Election Context

**What goes wrong:** Agent finds Julie Holmer listed as Place 7 in older sources and seeds her as incumbent.

**How to avoid:** Shun Thomas won the Place 7 special election January 31, 2026, was sworn in February 9, 2026. Julie Holmer resigned to run for Collin County Commissioner. Thomas is the current Place 7 incumbent. Citation: https://communityimpact.com/dallas-fort-worth/plano/government/2026/02/10/shun-thomas-sworn-in-as-newest-plano-city-council-member/

### Pitfall 4: McKinney Email Addresses Are CloudFlare-Protected

**What goes wrong:** Agent attempts to scrape McKinney council member emails and gets garbled text from the CloudFlare email protection script.

**How to avoid:** Do not attempt to decode the CloudFlare-protected emails programmatically. Instead: try the known email format `{first_initial}{last_name}@mckinneytexas.org`; if not verifiable, leave email_addresses = NULL and note in staging file. The city phone number is confirmed: 972-547-7501.

### Pitfall 5: Chris Krupa Downs Name Handling

**What goes wrong:** Using "Chris Downs" or "Christene Downs" when the official name is "Chris Krupa Downs."

**How to avoid:** The official Plano city website lists her as "Councilmember Chris Krupa Downs." Use `first_name='Chris'`, `last_name='Krupa Downs'`, `full_name='Chris Krupa Downs'`. Her preferred_name can be 'Chris'.

### Pitfall 6: Geré Feltus Accent Character

**What goes wrong:** Storing "Gere Feltus" (no accent) when the official name uses an accent.

**How to avoid:** The McKinney city website uses "Geré Feltus" with an accent. Store exactly: `first_name='Geré'`, `last_name='Feltus'`, `full_name='Geré Feltus'`. The trigram search index uses `f_unaccent(lower(full_name))` so accent-insensitive search will still work.

### Pitfall 7: Confusing Plano Office Titles — Place 6 = Mayor

**What goes wrong:** Inserting John Muns into "Council Member Place 6" instead of the "Mayor" office row.

**How to avoid:** The Phase 12 migration (088) created offices with titles 'Mayor' and 'Council Member Place 1' through 'Council Member Place 8'. "Place 6" corresponds to the Mayor seat historically but the office row title is 'Mayor' — always look up by title, not place number.

### Pitfall 8: slug Column on chambers is GENERATED

**What goes wrong:** Including `slug` in an INSERT INTO essentials.chambers statement.

**How to avoid:** This applies to Phase 12's chambers inserts, not Phase 13's politicians inserts. The `slug` column on `essentials.politicians` is a regular writable column (NOT generated). Safe to include in INSERT for politicians.

### Pitfall 9: valid_from / valid_to Are TEXT, Not DATE

**What goes wrong:** Passing `'2025-05-10'::date` or a date type, getting a type mismatch.

**How to avoid:** `valid_from` and `valid_to` are TEXT columns (confirmed in service layer: `COALESCE(p.valid_from, '') AS term_start`). Insert as ISO date strings: `'2025-05-10'`, `'2029-05-01'`.

---

## Code Examples

### Complete single-politician INSERT (Plano Mayor)

```sql
-- Source: stagingService.ts promoteToEssentials() pattern + essentialsService.ts getPoliticianById()
DO $$
DECLARE
  v_office_id     UUID;
  v_politician_id UUID;
BEGIN
  SELECT o.id INTO v_office_id
  FROM essentials.offices o
  JOIN essentials.chambers ch ON ch.id = o.chamber_id
  JOIN essentials.governments g ON g.id = ch.government_id
  WHERE g.geo_id = '4863000' AND o.title = 'Mayor';

  IF v_office_id IS NULL THEN
    RAISE EXCEPTION 'Plano Mayor office not found';
  END IF;

  INSERT INTO essentials.politicians
    (first_name, last_name, full_name,
     is_active, is_incumbent, is_vacant, is_appointed,
     office_id, valid_from, valid_to,
     email_addresses, urls, data_source)
  VALUES
    ('John B.', 'Muns', 'John B. Muns',
     true, true, false, false,
     v_office_id, '2025-05-10', '2029-05-01',
     ARRAY['mayor@plano.gov'],
     ARRAY['https://www.plano.gov/1349/Mayor-John-B-Muns'],
     'plano.gov')
  RETURNING id INTO v_politician_id;

  UPDATE essentials.offices
  SET politician_id = v_politician_id
  WHERE id = v_office_id;

  RAISE NOTICE 'Inserted: John B. Muns (Plano Mayor) — politician_id=%', v_politician_id;
END $$;
```

### Verification query after migration

```sql
-- Confirm row count, office links, is_active/is_incumbent flags, null contact rate
SELECT
  g.name AS city,
  o.title AS office,
  p.full_name,
  p.is_active,
  p.is_incumbent,
  p.office_id IS NOT NULL AS has_office_id_on_politician,
  o.politician_id IS NOT NULL AS has_politician_id_on_office,
  CASE WHEN p.email_addresses IS NOT NULL THEN 'email' ELSE 'null' END AS contact_email_status,
  CASE WHEN p.urls IS NOT NULL THEN 'bio' ELSE 'null' END AS bio_url_status
FROM essentials.politicians p
JOIN essentials.offices o ON o.id = p.office_id
JOIN essentials.chambers ch ON ch.id = o.chamber_id
JOIN essentials.governments g ON g.id = ch.government_id
WHERE g.geo_id IN ('4863000', '4845744')  -- Plano, McKinney
  AND p.is_active = true
ORDER BY g.name, o.title;
```

---

## Staging File Format

The agent writes a staging file at `.planning/phases/13-tier-1-officials-plano-mckinney/staging/plano-politicians.md` (and `mckinney-politicians.md`). The human reviews before SQL is written.

**Required columns:**
- city (Plano or McKinney)
- office_title (must match the Phase 12 office row title exactly, e.g. 'Mayor', 'Council Member Place 1')
- full_name
- first_name
- last_name
- preferred_name (optional, leave blank if none)
- email (leave blank if not found)
- bio_url (leave blank if not found)
- valid_from (ISO date, e.g. 2025-05-10)
- valid_to (ISO date, e.g. 2029-05-01)
- citation_url (required — must be a real URL pointing to the official source)
- notes (any ambiguity, special cases, accent characters)

**Example staging row:**
```
| McKinney | Mayor | Bill Cox | Bill | Cox | | | https://www.mckinneytexas.org/1167/Council-Members#Mayor | 2025-06-07 | 2029-06-01 | https://www.mckinneytexas.org/1167/Council-Members | Runoff winner June 7 2025 |
```

---

## Migration Structure

### Migration 091 — Plano politicians

File: `C:/EV-Accounts/backend/migrations/091_plano_politicians.sql`

Structure:
```sql
BEGIN;
-- Header comment with citation URLs
-- One DO block with all 9 Plano politicians
-- Each politician: look up office_id by geo_id + title, INSERT politician, UPDATE offices.politician_id
COMMIT;
```

### Migration 092 — McKinney politicians

File: `C:/EV-Accounts/backend/migrations/092_mckinney_politicians.sql`

Structure: same pattern, 7 politicians.

**Apply with:** `supabase db query --linked` (preferred per STATE.md — bypasses connection pooler max client issues)

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| Hard-coded office UUIDs in migration | JOIN on geo_id + title | UUIDs generated at apply time, unknowable before |
| inform.politicians (legacy) | essentials.politicians | Phase 35 deduplication merged inform into essentials |
| Separate politician_contacts table for all contact | Array columns (email_addresses, urls) for seeded rows | politician_contacts is for BallotReady/discovery pipeline |

---

## Open Questions

1. **McKinney individual email addresses**
   - What we know: Email format is likely `{first_initial}{last_name}@mckinneytexas.org` per RocketReach analysis; one confirmed instance of `district4@mckinneytexas.org` for Rick Franklin via legistar
   - What's unclear: Whether McKinney uses name-based or role-based emails; CloudFlare protection prevents scraping
   - Recommendation: Agent should try https://mckinney.legistar.com/People.aspx for unprotected email display; if emails cannot be confirmed, leave null per CONTEXT.md. Do not guess.

2. **Plano term dates precision**
   - What we know: May 2025 winners took office ~May 10, 2025; Place 7 (Thomas) sworn in Feb 9, 2026; Places elected 2023 took office ~May 2023
   - What's unclear: Exact May dates for 2023 incumbents (Maria Tu, Rick Horne) and for "next term end" of those whose terms expire May 2027 vs May 2029
   - Recommendation: Use approximate dates (e.g., '2023-05-01' for term_start and '2027-05-01' for term_end) with `term_date_precision = 'month'` when exact day is unknown.

3. **McKinney At-Large 2 / District 2 / District 4 term start dates**
   - What we know: These seats were last on ballot May 2023 (based on cycle analysis — next up May 2027)
   - What's unclear: Exact 2023 election dates; Michael Jones, Patrick Cloutier, Rick Franklin exact terms
   - Recommendation: Use '2023-05-01' as approximate term_start with precision = 'month'.

---

## Sources

### Primary (HIGH confidence)
- https://www.plano.gov/1345/Mayor-and-City-Council — confirmed 8-member roster + bio page URLs
- https://www.mckinneytexas.org/1167/Council-Members — confirmed 7-member roster
- https://communityimpact.com/dallas-fort-worth/plano-north/government/2025/05/03/kehr-downs-lavine-quintanilla-win-plano-city-council-races/ — 2025 Plano election winners
- https://communityimpact.com/dallas-fort-worth/plano/government/2026/02/10/shun-thomas-sworn-in-as-newest-plano-city-council-member/ — Shun Thomas sworn in
- https://www.nbcdfw.com/news/politics/lone-star-politics/bill-cox-wins-runoff-for-mckinney-mayor/3858560/ — McKinney mayor runoff winner
- https://en.wikipedia.org/wiki/Plano_City_Council — Place-to-name mapping confirmed

### Secondary (MEDIUM confidence)
- https://www.nbcdfw.com/news/politics/lone-star-politics/collin-county-election-all-races-may-2-2026/4012500/ — confirmed no Plano/McKinney on May 2, 2026 ballot
- https://www.mckinneytexas.org/139/Elections — McKinney next election May 1, 2027
- WebSearch: Plano email format `{firstname}{lastname}@plano.gov` (multiple corroborating search results)

### Tertiary (LOW confidence)
- RocketReach analysis: McKinney email format `{first_initial}{last_name}@mckinneytexas.org` (75.1% of emails) — unverified against individual council member emails
- McKinney term start dates for 2023-elected members (Michael Jones, Patrick Cloutier, Rick Franklin) — approximated from election cycle analysis

---

## Metadata

**Confidence breakdown:**
- Plano full roster: HIGH — confirmed from official city website
- McKinney full roster: HIGH — confirmed from official city website
- No May 2026 election for Plano/McKinney: HIGH — confirmed from official election sites
- Plano email format: MEDIUM — pattern well-attested, individual emails not directly verified
- McKinney email format: LOW — pattern estimated, not directly verified (CloudFlare protection)
- Term start/end dates: MEDIUM for 2025 electees; LOW for 2023 electees (approximate)
- essentials.politicians schema: HIGH — directly from codebase (stagingService.ts, adminService.ts)
- Office linkage pattern: HIGH — directly from codebase (essentialsService.ts join patterns)

**Research date:** 2026-05-01
**Valid until:** 2026-06-01 (30 days — stable municipal roster; no elections scheduled until May 2027)
