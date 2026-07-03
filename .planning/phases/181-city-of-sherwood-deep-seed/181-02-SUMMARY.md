---
phase: 181-city-of-sherwood-deep-seed
plan: 02
subsystem: structural-seed
tags: [migration, structural, sherwood, or, roster, pairwise-identity-gate]
dependency-graph:
  requires:
    - "181-01 (confirmed geo_id 4167100, ext_id block -4167101..-4167107, migration number 1187, roster)"
  provides:
    - "City of Sherwood, Oregon, US government row (geo_id 4167100)"
    - "Sherwood City Council chamber (official_count=7)"
    - "2 citywide districts: LOCAL_EXEC (Mayor, 2-Year Term) + LOCAL (At-Large, 6 Councilors)"
    - "7 seated offices with representing_city='Sherwood' inline, office_id back-filled"
    - "minted politician ext_id block -4167101..-4167107 for plans 03 (headshots) and 04 (stances)"
  affects:
    - "181-03-PLAN.md (headshots — consumes ext_ids, daniel-standke filename note)"
    - "181-04-PLAN.md (stances — consumes ext_ids, judicial-* skip list, Young CP / Mays pitfall notes)"
    - "181-05-PLAN.md (banner)"
tech-stack:
  added: []
  patterns:
    - "D-15 WR-B pairwise (external_id, full_name) identity gate — upgrade over Forest Grove/Tigard's two-independent-IN-lists gate"
    - "Directly-elected Mayor (LOCAL_EXEC) + shared at-large Council (LOCAL) — Forest Grove/Tualatin/Beaverton shape, zero appointed seats, plain titles"
    - "representing_city set INLINE on office INSERT (no backfill migration)"
key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/1187_sherwood_city_council.sql (440 lines, separate EV-Accounts repo)"
  modified: []
decisions:
  - "geo_id 4167100 used per Wave-0 correction (not the ROADMAP/CONTEXT-stated 4167450)"
  - "Mayor's term recorded as 2-YEAR in the LOCAL_EXEC district label/comment — unique in this milestone (every other WashCo Mayor is 4-year); does not change the structural shape"
  - "Kim Young's Council President designation is title-on-seat only (comment above her office block); title stays plain 'Councilor', single office row"
  - "Keith Mays seeded as a PLAIN Councilor with a pitfall-guard comment despite former-Mayor (2018-2022, 2005-2012) and former-Council-President (2001-2004) history"
metrics:
  duration: "~25 minutes (Task 1 authoring, prior turn) + orchestrator apply/verify/commit (this turn)"
  completed: 2026-07-03
---

# Phase 181 Plan 02: Sherwood Structural Migration Summary

Authored and applied the single structural migration seeding the City of Sherwood government, City
Council chamber, two citywide districts, and all 7 officials — the exact Forest Grove/Tualatin/Beaverton
shape class (directly-elected Mayor + shared at-large council, zero appointed seats, plain titles) with
one new wrinkle (Mayor's 2-year term) — using the Wave-0-corrected geo_id 4167100 and upgrading the
post-verify identity gate to the D-15 WR-B pairwise `(external_id, full_name)` form.

## What Was Built

**Task 1** (prior turn) authored `C:/EV-Accounts/backend/migrations/1187_sherwood_city_council.sql`
(440 lines) modeled on Forest Grove's mig 1178: pre-flight hard-abort guard, government INSERT
(geo_id='4167100', state='OR' uppercase, guarded WHERE NOT EXISTS on name), chamber INSERT
(official_count=7, name_formal='Sherwood City Council'), two district INSERTs (LOCAL_EXEC labeled
'Sherwood (Mayor, Citywide, 2-Year Term)' + LOCAL labeled 'Sherwood (At-Large)', both state='or'
lowercase, geo_id='4167100'), seven office CTE blocks (politician ON CONFLICT (external_id) DO UPDATE
+ office CROSS JOIN district guarded on (district_id, politician_id)), office_id back-fill UPDATE keyed
on the explicit external_id list, a post-verification DO block with the independent geofence-presence
assertion, the canonical section-split GROUP BY/HAVING query, and the D-15 WR-B pairwise identity gate,
and a ledger INSERT registering version '1187'.

**Task 2** (this turn, orchestrator-executed checkpoint): applied the migration via `psql
"$DATABASE_URL" -f 1187_sherwood_city_council.sql` against live production on 2026-07-03. The migration
committed in a single transaction. The in-migration post-verify DO block emitted:

```
Post-verification PASSED: Sherwood gov=1, offices=7, geofence>=1, section-split=0,
office_id nulls=0, representing_city=7, pairwise_identity=7
```

The independent E2E gate (separate SELECTs, outside the migration transaction) then confirmed:

- **governments:** 1 row, `'City of Sherwood, Oregon, US'`, geo_id 4167100.
- **chamber:** `'City Council'`, official_count=7.
- **districts:** exactly 2 — LOCAL `'Sherwood (At-Large)'` + LOCAL_EXEC `'Sherwood (Mayor, Citywide,
  2-Year Term)'`, both `state='or'` lowercase, both geo_id 4167100. Zero ward/X00xx rows, zero per-seat
  districts.
- **office titles:** Mayor=1 (plain `'Mayor'`), Councilor=6 (plain `'Councilor'`, no position numbers,
  no wards).
- **per-person roster** (all `is_appointed=false`, all `representing_city='Sherwood'`):

  | ext_id | full_name | title | district_type |
  |--------|-----------|-------|----------------|
  | -4167101 | Tim Rosener | Mayor | LOCAL_EXEC |
  | -4167102 | Kim Young | Councilor (holds Council President title-on-seat) | LOCAL |
  | -4167103 | Renee Brouse | Councilor | LOCAL |
  | -4167104 | Taylor Giles | Councilor | LOCAL |
  | -4167105 | Keith Mays | Councilor (former Mayor/CP — plain title enforced) | LOCAL |
  | -4167106 | Doug Scott | Councilor | LOCAL |
  | -4167107 | Dan Standke | Councilor | LOCAL |

- **section-split scan:** 0 rows (canonical GROUP BY/HAVING query, independent of the in-migration gate).
- **office_id NULLs:** 0 across all 7 politicians.
- **Council-President modeling precedent-check:** confirmed Forest Grove's Valenzuela is also seeded as
  a plain `'Councilor'` in the live DB (designation lives in migration commentary only) — Sherwood's
  Young follows the identical shipped sister-city pattern.

Migration committed in the separate EV-Accounts repo at commit `60736ac4` on `master` (via `git -C
"C:/EV-Accounts"`, never `cd`'d into it).

**Hygiene confirmed:** no literal `slug` or `photo_origin_url` strings appear in the file's comments;
the single occurrence of `'4167450'` is the line-5 header comment documenting the Wave-0 geo_id
correction — no query in the file references it.

## Note for Plans 03/04 Consumers

- Politician UUIDs are **not** static — look them up live by `external_id` (-4167101 through -4167107);
  the migration used `ON CONFLICT (external_id) DO UPDATE`, minting UUIDs server-side.
- Headshot filenames use `daniel-standke` (NOT `dan-standke`) per the 181-01 Gate-C re-confirmation —
  plan 03 must use this slug.
- Keith Mays (-4167105) is seeded as a plain `'Councilor'` — plan 04 stance research must not attribute
  Mayor/Council-President-era positions to his current seat.
- All 8 `judicial-*` compass topics are skipped for the entire roster (A4 confirmed: City Attorney +
  Municipal Court Judge are council-appointed, non-elected).

## Deviations from Plan

None — plan executed exactly as written. All in-migration and independent E2E gates passed on first
application; no reconciliation, retry, or re-plan was required.

## Self-Check: PASSED

- FOUND: `C:/EV-Accounts/backend/migrations/1187_sherwood_city_council.sql` (referenced by orchestrator-run E2E gate; committed at EV-Accounts commit `60736ac4`)
- FOUND: EV-Accounts commit `60736ac4` (orchestrator-reported, applied and committed via `git -C "C:/EV-Accounts"`)
- FOUND: `.planning/phases/181-city-of-sherwood-deep-seed/181-02-SUMMARY.md` (this file)
