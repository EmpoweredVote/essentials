# McKinney Incumbent Politicians — Staging

**Source date:** 2026-05-01
**Status:** Awaiting human review before migration 092 is written.
**Total seats:** 7 (Mayor + At-Large 1, At-Large 2 + District 1–4)
**Total incumbents to insert:** 7

## Roster

| city | office_title | full_name | first_name | last_name | preferred_name | email | bio_url | valid_from | valid_to | term_date_precision | citation_url | notes |
|------|--------------|-----------|------------|-----------|----------------|-------|---------|------------|----------|---------------------|--------------|-------|
| McKinney | Mayor | Bill Cox | Bill | Cox | Bill | mayor@mckinneytexas.org | https://www.mckinneytexas.org/1167/Council-Members#Mayor | 2025-06-01 | 2029-05-01 | month | https://www.mckinneytexas.org/1167/Council-Members | Won June 2025 runoff; source: https://www.nbcdfw.com/news/politics/lone-star-politics/bill-cox-wins-runoff-for-mckinney-mayor/3858560/ |
| McKinney | Council Member At-Large 1 | Ernest Lynch | Ernest | Lynch | Ernest | AtLarge1@mckinneytexas.org | https://www.mckinneytexas.org/1167/Council-Members#AtLarge1 | 2025-06-01 | 2029-05-01 | month | https://www.mckinneytexas.org/1167/Council-Members | Won June 2025 runoff alongside Bill Cox |
| McKinney | Council Member At-Large 2 | Michael Jones | Michael | Jones | Michael | AtLarge2@mckinneytexas.org | https://www.mckinneytexas.org/1167/Council-Members#AtLarge2 | 2023-05-01 | 2027-05-01 | month | https://www.mckinneytexas.org/1167/Council-Members | Elected May 2023; term end inferred from 4-year cycle (next up May 2027); also listed as Mayor Pro Tem on city site |
| McKinney | Council Member District 1 | Justin Beller | Justin | Beller | Justin | District1@mckinneytexas.org | https://www.mckinneytexas.org/1167/Council-Members#District1 | 2025-05-01 | 2029-05-01 | month | https://www.mckinneytexas.org/1167/Council-Members | Ran unopposed May 2025 |
| McKinney | Council Member District 2 | Patrick Cloutier | Patrick | Cloutier | Patrick | District2@mckinneytexas.org | https://www.mckinneytexas.org/1167/Council-Members#District2 | 2023-05-01 | 2027-05-01 | month | https://www.mckinneytexas.org/1167/Council-Members | Prior election cycle; term end inferred from May 2027 expiry minus 4-year term — exact start date unconfirmed |
| McKinney | Council Member District 3 | Geré Feltus | Geré | Feltus | Geré | District3@mckinneytexas.org | https://www.mckinneytexas.org/1167/Council-Members#District3 | 2025-05-01 | 2029-05-01 | month | https://www.mckinneytexas.org/1167/Council-Members | Won May 2025 with 54%; first_name preserves é accent (UTF-8); also listed as Mayor Pro Tem on city site |
| McKinney | Council Member District 4 | Rick Franklin | Rick | Franklin | Rick | District4@mckinneytexas.org | https://www.mckinneytexas.org/1167/Council-Members#District4 | 2023-05-01 | 2027-05-01 | month | https://www.mckinneytexas.org/1167/Council-Members | Prior election cycle; term end inferred from May 2027 expiry minus 4-year term — exact start date unconfirmed |

## Verification Notes

- McKinney emails are CloudFlare-protected on the official council page. Email format is potentially `{first_initial}{last_name}@mckinneytexas.org` (LOW confidence per RocketReach analysis) but not verifiable from official sources. Per CONTEXT.md: leave email NULL rather than insert placeholder or guessed addresses.
- No May 2026 race for McKinney — McKinney's next general election is May 1, 2027 (seats: District 2, District 4, At-Large 2). The current roster IS the post-May 2026 roster.
- All party fields will be NULL in the migration (Texas municipal elections are nonpartisan).
- All bio URLs are anchor links on the single Council Members page (https://www.mckinneytexas.org/1167/Council-Members).
- Geré Feltus: first_name='Geré' — the é accent is the official name form per the McKinney city website. The essentials DB uses f_unaccent() for search, so accent-insensitive search still works.
- valid_from dates for Cox + Lynch use 2025-06-01 (June 2025 runoff; exact date of runoff was June 7, 2025 but month precision used per plan).
- valid_from dates for Beller + Feltus use 2025-05-01 (May 2025 winners).
- valid_from dates for Jones, Cloutier, Franklin use 2023-05-01 (inferred from term-end May 2027 minus 4-year term; exact start dates not confirmed from official sources — flagged in notes column).
- office_title values match Phase 12 migration 088 titles exactly: 'Mayor', 'Council Member At-Large 1', 'Council Member At-Large 2', 'Council Member District 1', 'Council Member District 2', 'Council Member District 3', 'Council Member District 4'.
- McKinney geo_id for office lookup: '4845744'.
- Source cross-checked: Research phase (13-RESEARCH.md) confirmed roster against mckinneytexas.org/1167/Council-Members (fetched 2026-05-01). No discrepancies found between research roster and plan roster.
