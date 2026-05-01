# Richardson Incumbent Politicians — Staging

**Source date:** 2026-05-01
**Status:** Human review complete — emails confirmed. Migration 095 applied.
**Total incumbents:** 7 (Mayor + District 1-4 + Place 5-6)
**Post-election update flags:** NONE — Richardson has no May 2026 council races (bond + charter amendments only).
**Term length quirk:** 2-year terms (all elected May 2025, all expire May 2027). Richardson is unusual — most TX municipalities use 3-year terms.
**Title quirk:** Richardson officially calls all 7 seats "Place 1-6", but Phase 12 migration 089 chose DB titles 'Council Member District 1-4' for the first four seats (which have district residency requirements). Lookup in migration 095 MUST use DB titles. SQL comments in the migration document this mapping.

## DB Office Title Verification

Verified via psql query against `essentials.offices` for `geo_id='4863500'` on 2026-05-01:

```
 Council Member District 1
 Council Member District 2
 Council Member District 3
 Council Member District 4
 Council Member Place 5
 Council Member Place 6
 Mayor
(7 rows)
```

Titles match the staging file's `office_title (DB)` column exactly.

## Roster (geo_id 4863500)

| city | office_title (DB) | city_label (informational) | full_name | first_name | last_name | preferred_name | email | bio_url | valid_from | valid_to | term_date_precision | citation_url | notes |
|------|-------------------|----------------------------|-----------|------------|-----------|----------------|-------|---------|------------|----------|---------------------|--------------|-------|
| Richardson | Mayor | Mayor | Amir Omar | Amir | Omar | Amir | Amir.Omar@cor.gov | https://www.cor.net/government/city-council/who-are-our-city-council-members/amir-omar | 2025-05-01 | 2027-05-01 | month | https://www.cor.net/government/city-council | Elected May 2025; 2-year term ends May 2027 |
| Richardson | Council Member District 1 | Place 1 | Curtis Dorian | Curtis | Dorian | Curtis | Curtis.Dorian@cor.gov | https://www.cor.net/government/city-council/who-are-our-city-council-members/curtis-dorian | 2025-05-01 | 2027-05-01 | month | https://www.cor.net/government/city-council | DB title 'District 1' = Richardson's official 'Place 1' (district residency requirement) |
| Richardson | Council Member District 2 | Place 2 | Jennifer Justice | Jennifer | Justice | Jennifer | Jennifer.Justice@cor.gov | https://www.cor.net/government/city-council/who-are-our-city-council-members/jennifer-justice | 2025-05-01 | 2027-05-01 | month | https://www.cor.net/government/city-council | DB title 'District 2' = Richardson's official 'Place 2' (district residency requirement) |
| Richardson | Council Member District 3 | Place 3 | Dan Barrios | Dan | Barrios | Dan | Dan.Barrios@cor.gov | https://www.cor.net/government/city-council/who-are-our-city-council-members/dan-barrios | 2025-05-01 | 2027-05-01 | month | https://www.cor.net/government/city-council | DB title 'District 3' = Richardson's official 'Place 3' (district residency requirement) |
| Richardson | Council Member District 4 | Place 4 | Joe Corcoran | Joe | Corcoran | Joe | Joe.Corcoran@cor.gov | https://www.cor.net/government/city-council/who-are-our-city-council-members/joe-corcoran | 2025-05-01 | 2027-05-01 | month | https://www.cor.net/government/city-council | DB title 'District 4' = Richardson's official 'Place 4' (district residency requirement) |
| Richardson | Council Member Place 5 | Place 5 | Ken Hutchenrider | Ken | Hutchenrider | Ken | Ken.Hutchenrider@cor.gov | https://www.cor.net/government/city-council/who-are-our-city-council-members/ken-hutchenrider | 2025-05-01 | 2027-05-01 | month | https://www.cor.net/government/city-council | At-large (no district residency requirement) |
| Richardson | Council Member Place 6 | Place 6 | Arefin Shamsul | Arefin | Shamsul | Arefin | Arefin.Shamsul@cor.gov | https://www.cor.net/government/city-council/who-are-our-city-council-members/arefin-shamsul | 2025-05-01 | 2027-05-01 | month | https://www.cor.net/government/city-council | At-large (no district residency requirement) |

## Verification Notes

### Source confidence
- **Names (HIGH):** All 7 names confirmed from May 2025 Richardson election results (multiple sources: richardsontoday.com, web search election results). All 7 members were newly elected May 3, 2025.
- **Terms (HIGH):** Richardson uses 2-year terms. All current members elected May 2025, terms expire May 2027. Next council election: May 1, 2027.
- **Bio URLs (MEDIUM):** URL pattern `https://www.cor.net/government/city-council/who-are-our-city-council-members/{first-last}` is confirmed from research (Arefin Shamsul's page indexed by Google). Individual pages return 403 to external scrapers but are user-accessible in a browser.
- **Emails (HIGH):** All 7 emails confirmed by user as `Firstname.Lastname@cor.gov` (cor.gov email domain). Bio URLs are on cor.net website. Pattern confirmed during checkpoint review 2026-05-01.

### Flags and rules applied
- All emails confirmed as `Firstname.Lastname@cor.gov` — user confirmed this pattern during checkpoint review 2026-05-01. Originally staged as NULL per CONTEXT.md policy (cor.net returns 403 to scrapers); user correction applied.
- All bio URLs follow the cor.net pattern; pages return 403 to scrapers but are user-accessible.
- All terms: `valid_from='2025-05-01'`, `valid_to='2027-05-01'`, `term_date_precision='month'` (2-year staggered terms).
- All `party = NULL` (Texas municipal elections are nonpartisan).
- All `is_active=true`, `is_incumbent=true`, `is_vacant=false`, `is_appointed=false`.
- `data_source='cor.net'` for all 7 rows.
- No May 2026 election for Richardson council → no post-election flag entries needed.

### District/Place title mapping (CRITICAL for migration SQL)
Richardson officially calls all seats "Place 1" through "Place 6". Migration 089 (already applied) used "District 1-4" for the first four seats due to their geographic district residency requirements:

| Richardson official label | DB title in essentials.offices | Residency requirement |
|--------------------------|-------------------------------|----------------------|
| Place 1 | Council Member District 1 | Must live in District 1 geographic area |
| Place 2 | Council Member District 2 | Must live in District 2 geographic area |
| Place 3 | Council Member District 3 | Must live in District 3 geographic area |
| Place 4 | Council Member District 4 | Must live in District 4 geographic area |
| Place 5 | Council Member Place 5 | At-large (can live anywhere in city) |
| Place 6 | Council Member Place 6 | At-large (can live anywhere in city) |

Migration 095 MUST use the DB titles as WHERE clause keys — using "Place 1-4" will return NULL and trigger RAISE EXCEPTION.
