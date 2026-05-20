# Phase 54: Maine City Officials — Known Gaps

**Last updated:** 2026-05-20
**Phase status:** Tier 2 (5 cities) seeded; Tier 3-4 (17 cities) intentionally deferred.

## 1. Tier 3-4 Cities — Status: Not Attempted

These 17 Maine cities have skeletal office rows from migration 177 (Phase 53) but no incumbents have been seeded in Phase 54. All are status `not attempted` — they are deferred to a future phase, not silently omitted.

| City | geo_id | Skeletal Offices | Incumbents Filled | Status |
|------|--------|------------------|-------------------|--------|
| Augusta | 2302100 | 18 | 0 | not attempted |
| Bath | 2303355 | 9 | 0 | not attempted |
| Belfast | 2303950 | 6 | 0 | not attempted |
| Brewer | 2306925 | 5 | 0 | not attempted |
| Calais | 2309585 | 7 | 0 | not attempted |
| Caribou | 2310565 | 7 | 0 | not attempted |
| Eastport | 2321730 | 5 | 0 | not attempted |
| Ellsworth | 2323200 | 7 | 0 | not attempted |
| Gardiner | 2327085 | 8 | 0 | not attempted |
| Hallowell | 2330550 | 8 | 0 | not attempted |
| Old Town | 2355225 | 7 | 0 | not attempted |
| Presque Isle | 2360825 | 7 | 0 | not attempted |
| Rockland | 2363590 | 5 | 0 | not attempted |
| Saco | 2364675 | 8 | 0 | not attempted |
| Sanford | 2365725 | 7 | 0 | not attempted |
| Waterville | 2380740 | 8 | 0 | not attempted |
| Westbrook | 2382105 | 15 | 0 | not attempted |

**Total Tier 3-4 cities deferred: 17.**

Skeletal office counts are from the live DB as of 2026-05-19 (migration 177 applied). Note Augusta (18) and Westbrook (15) have more skeletal offices due to larger council structures with multiple chambers (City Council + School Committee in the scaffold).

## 2. Tier 2 Contact-Data Gaps

These cities are fully seeded in Phase 54 but have missing per-seat email addresses (no city directory or only partial directory found on official sites). These are NOT seeding gaps — they are contact-data gaps to be closed in a later contact-enrichment phase.

| City | Missing Emails | Notes |
|------|----------------|-------|
| Lewiston | 6 of 8 (Mayor + Ward 2, 4, 5, 6, 7) | City directory at lewistonmaine.gov lists per-councilor pages but no email link on most |
| South Portland | 8 of 8 (entire council) | southportland.gov council page does not publish per-councilor emails publicly |
| Biddeford | 9 of 10 (entire council except Mayor) | biddefordmaine.org Mayor page has email; council member pages do not |

Auburn and Bangor are NOT in this table — their email harvests are complete (Auburn 8/8 from auburnmaine.gov directory; Bangor 9/9 from bangormaine.gov).

## 3. Tier 2 Headshot Gaps

Updated by Plan 54-03 (2026-05-20). Source: official city websites only — no social media, news, or campaign sites.

| City | Council Size | Headshots Uploaded | Headshots Missing | Notes |
|------|--------------|--------------------|--------------------|-------|
| Bangor | 9 | 9 | 0 | All 9 from bangormaine.gov/446 directory pages |
| South Portland | 7 unique (8 office rows) | 7 | 0 | All 7 from southportland.gov; Tipton counted once |
| Biddeford | 10 | 9 | 1 | 9 from individual biddefordmaine.org bio pages; Vadnais (At-Large 2) has no photo on her page |
| Auburn | 8 | 1 | 7 | Mayor Harmon only (auburnmaine.gov/government/mayor.php); 7 ward/at-large councilor profile pages all return 404 on rebuilt site; annual report uses map layout (no headshots); no fallback source found |
| Lewiston | 8 | 1 | 7 | Mayor Sheline only (lewistonmaine.gov/1182/Mayor); ward councilor pages serve circle-cropped PNGs with baked-in transparency — not suitable as rectangular headshots; rejected per project policy |

**Total Phase 54 headshots: 27 uploaded, 15 source not found across 42 unique politicians.**
