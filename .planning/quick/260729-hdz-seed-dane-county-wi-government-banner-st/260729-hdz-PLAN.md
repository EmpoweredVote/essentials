---
quick_id: 260729-hdz
description: Seed Dane County WI — government, banner, stances, headshots
created: 2026-07-29
mode: quick (orchestrator-executed; Supabase MCP is orchestrator-only, so DB work runs inline, not in gsd-executor)
---

# Quick Task 260729-hdz: Seed Dane County, WI

Clone the Racine County shape (migrations 1446 + 1454, importer script) for Dane County
(geo_id 55025), then banner + headshots + stances. TT gets pinged when it lands.

## Pre-verified facts (production reads, 2026-07-29)

- `essentials.governments` has NO Dane County row. Racine County = template
  (gov `eca16104`, 3 chambers: County Board / Countywide Elected Officials / Circuit Court).
- Dane COUNTY district EXISTS (`f6faefb7`, G4020, geo_id 55025) with ONE office already on it:
  County Executive, seated with Melissa Agard by migration 1480 (Madison seed), **chamber_id NULL**.
  The seed must ADOPT this office into the new Countywide chamber — not duplicate it.
- Dane County G4020 geofence loaded (census_tiger_2024). No county polygon work needed.
- Occupancy = `essentials.seat_officeholder(office, politician, term_start, source, how_started, precision)`
  → `office_terms`; `politicians.office_id` deprecated. offices has NO politician_id column anymore
  (1446/1454's insert style must be adapted).
- external_id band **-5536001..-5536217 verified free**:
  countywide officers -5536001..06 (Agard keeps -5535021), supervisors -5536101..137, judges -5536201..217.
- districts.state = lowercase 'wi'; chambers.slug GENERATED ALWAYS; chamber PEL defaults 'full'.
- Supervisor districts need custom polygons: mtfcc **'X-DC-SUP'**, geo_id `55025-sup-d{1..37}`,
  geofence source Dane County / WI LTSB ArcGIS (mirror import-racine-supervisor-districts.ts;
  GEOMETRY ONLY — names from the county roster page, never the GIS attribute).
- Migration number: **1491** (origin/master max = 1485; Ph222 claim 1468-1490 avoided).

## Tasks

1. **Research** (general-purpose agent — gsd-executor lacks web): Dane County roster with
   fetched sources: 37 supervisors by district, 6 countywide officers (Clerk, Treasurer,
   Register of Deeds, Sheriff, DA, Clerk of Circuit Court), 17 circuit judges by branch +
   chief judge; term starts w/ honest precision; ArcGIS endpoint for the 37 supervisory
   district polygons.
2. **Polygons**: `import-dane-supervisor-districts.ts` in EV-Accounts (clone Racine importer),
   run against prod; probe 3 addresses land in exactly 1 district each.
3. **Migration 1491_dane_county_government.sql**: gov row, 3 chambers, adopt Exec office into
   Countywide chamber, 6 officer offices + politicians + seat, 37 supervisor offices + seat,
   JUDICIAL district on 55025 + 17 branch offices + judges + seat + judge_details, post-verify
   DO block. Run via MCP; commit file in EV-Accounts.
4. **Surface**: COVERAGE_COUNTIES entry (search-only chip) + banner attribution/CURATED_LOCAL
   `'dane county'` in essentials; build check; commit.
5. **Banner**: licensed Commons photo (reads as Dane County; daytime; no AI/flag-only/aerial),
   crop 1700x540, upload `cities/dane-county.jpg` (one at a time per rule).
6. **Headshots**: county site portraits via /find-headshots conventions (600x750 4:5, crop then
   resize, no graphics), politician_images + photo_origin_url.
7. **Stances**: evidence-only, all-topics, sequential research agents (county board +
   countywide officers; judges excluded — judicial compass is a separate design), CSV +
   apply script in EV-Accounts (`npx tsx --env-file=.env`), then hasContext:true on the chip.
8. **Verify + close**: Madison-address overlap surfaces county officials; split-section SQL
   check; STATE.md quick-task row; SUMMARY.md; TT ping note in treasury-tracker repo.

## Sourcing rules in force

- Roster names from county pages, two-source where possible; no invented dates (precision
  'month'/'day' honesty); party NULL (antipartisan display + nonpartisan spring offices).
- Never cite an unfetched URL. Ballotpedia is not "always real".
