# Plano Incumbent Politicians — Staging

**Source date:** 2026-05-01
**Status:** Awaiting human review before migration 091 is written.
**Total seats:** 9 (Mayor + Place 1-8) — Place 6 is the Mayor seat (Plano numbering quirk; do NOT seed a separate Place 6).
**Total incumbents to insert:** 8

## Roster

| city | office_title | full_name | first_name | last_name | preferred_name | email | bio_url | valid_from | valid_to | term_date_precision | citation_url | notes |
|------|--------------|-----------|------------|-----------|----------------|-------|---------|------------|----------|---------------------|--------------|-------|
| Plano | Mayor | John B. Muns | John | Muns | John | mayor@plano.gov | https://www.plano.gov/1349/Mayor-John-B-Muns | 2025-05-01 | 2029-05-01 | month | https://www.plano.gov/1349/Mayor-John-B-Muns | Re-elected May 2025; original term started May 2021; Place 6 internally but office title is Mayor |
| Plano | Council Member Place 1 | Maria Tu | Maria | Tu | Maria | mariatu@plano.gov | https://www.plano.gov/1355/Mayor-Pro-Tem-Maria-Tu | 2023-05-01 | 2027-05-01 | month | https://www.plano.gov/1355/Mayor-Pro-Tem-Maria-Tu | Re-elected May 2023; also serves as Mayor Pro Tem; original term started May 2019 |
| Plano | Council Member Place 2 | Bob Kehr | Bob | Kehr | Bob | bobkehr@plano.gov | https://www.plano.gov/1354/Councilmember-Bob-Kehr | 2025-05-01 | 2029-05-01 | month | https://www.plano.gov/1354/Councilmember-Bob-Kehr | Elected May 2025 |
| Plano | Council Member Place 3 | Rick Horne | Rick | Horne | Rick | rickhorne@plano.gov | https://www.plano.gov/1356/Councilmember-Rick-Horne | 2023-05-01 | 2027-05-01 | month | https://www.plano.gov/1356/Councilmember-Rick-Horne | Elected May 2023; also serves as Deputy Mayor Pro Tem |
| Plano | Council Member Place 4 | Chris Krupa Downs | Chris | Krupa Downs | Chris | chrisdowns@plano.gov | https://www.plano.gov/1353/Councilmember-Chris-Krupa-Downs | 2025-05-01 | 2029-05-01 | month | https://www.plano.gov/1353/Councilmember-Chris-Krupa-Downs | Elected May 2025; last_name='Krupa Downs' (compound); email drops 'krupa' — chrisdowns@plano.gov confirmed |
| Plano | Council Member Place 5 | Steve Lavine | Steve | Lavine | Steve | stevelavine@plano.gov | https://www.plano.gov/1357/Councilmember-Steve-Lavine | 2025-05-01 | 2029-05-01 | month | https://www.plano.gov/1357/Councilmember-Steve-Lavine | Elected May 2025 |
| Plano | Council Member Place 7 | Shun Thomas | Shun | Thomas | Shun | shunthomas@plano.gov | https://www.plano.gov/1358/Councilmember-Shun-Thomas | 2026-02-09 | 2027-05-01 | month | https://communityimpact.com/dallas-fort-worth/plano/government/2026/02/10/shun-thomas-sworn-in-as-newest-plano-city-council-member/ | Won Jan 31, 2026 special election; sworn in Feb 9, 2026; fills remainder of original Place 7 term expiring May 2027; Julie Holmer resigned to run for Collin County Commissioner |
| Plano | Council Member Place 8 | Vidal Quintanilla | Vidal | Quintanilla | Vidal | vidalquintanilla@plano.gov | https://www.plano.gov/1359/Councilmember-Vidal-Quintanilla | 2025-05-01 | 2029-05-01 | month | https://www.plano.gov/1359/Councilmember-Vidal-Quintanilla | Elected May 2025 |

## Verification Notes

- Plano City Council has 9 seats but only 8 distinct holders: the Mayor occupies what is internally Place 6. The Phase 12 office rows do NOT include "Council Member Place 6" — confirmed in 12-02-SUMMARY.md (Plano has 9 offices total = Mayor + Place 1-8 by title; the Place 6 collision is handled by titling the mayor seat "Mayor" only).
- No May 2026 race for Plano — current roster IS the post-May 2026 roster. Neither city has council seats on the May 2, 2026 ballot. Plano's next elections are May 2027. Confirmed via https://www.nbcdfw.com/news/politics/lone-star-politics/collin-county-election-all-races-may-2-2026/4012500/
- Place 7 was filled by Shun Thomas via Jan 31, 2026 special election (Julie Holmer resigned to run for Collin County Commissioner). Thomas was sworn in February 9, 2026. Term completes the original Place 7 term ending May 2027.
- All party fields will be NULL in the migration (Texas municipal = nonpartisan).
- Email confidence: MEDIUM — the {firstname}{lastname}@plano.gov pattern is well-attested from multiple search corroboration; individual emails not directly verified from official listings (CloudFlare-protected contact form on city site). Mayor email (mayor@plano.gov) follows a different pattern for the mayoral role. All 8 emails follow the stated pattern or known exception (chrisdowns vs chrisdowns+krupa).
- valid_from uses most recent term start: re-election date for May 2025 winners, most recent election for 2023 incumbents, and swearing-in date for Shun Thomas (Feb 9, 2026).
- valid_from/valid_to are approximate month-precision dates; term_date_precision='month' everywhere per research guidance.
- Sources: https://www.plano.gov/1345/Mayor-and-City-Council (official roster), https://communityimpact.com/dallas-fort-worth/plano-north/government/2025/05/03/kehr-downs-lavine-quintanilla-win-plano-city-council-races/ (2025 election results), https://communityimpact.com/dallas-fort-worth/plano/government/2026/02/10/shun-thomas-sworn-in-as-newest-plano-city-council-member/ (Shun Thomas)
