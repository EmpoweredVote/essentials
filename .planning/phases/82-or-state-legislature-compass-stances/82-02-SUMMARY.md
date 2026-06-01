---
phase: 82-or-state-legislature-compass-stances
plan: 02
subsystem: compass-stances
tags: [or-legislature, house-reps, compass, stances, ingestion]
dependency_graph:
  requires: [Plan 82-01 (migration 242, 30 senators), Phase 75 OR legislature seeding (migration 227)]
  provides: [inform.politician_answers rows for 60 OR house reps, inform.politician_context citations, migration 243]
  affects: [compass widget rendering on all 60 OR house rep profile pages]
tech_stack:
  added: []
  patterns: [apply-tina-kotek-stances.ts CSV-to-DB pattern, ON CONFLICT DO UPDATE upsert, inline citation writes]
key_files:
  created:
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-court-boice.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-virgle-osborne.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-dwayne-yunker.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-alek-skarlatos.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-pam-marsh.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-kim-wallan.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-john-lively.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-lisa-fragala.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-boomer-wright.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-david-gomberg.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-jami-cate.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-darin-harbick.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-nancy-nathanson.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-julie-fahey.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-shelly-boshart-davis.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-sarah-finger-mcdonald.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-ed-diehl.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-rick-lewis.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-tom-andersen.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-paul-evans.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-kevin-mannix.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-lesly-munoz.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-anna-scharf.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-lucetta-elmer.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-ben-bowman.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-sue-rieke-smith.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-ken-helm.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-dacia-grayber.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-susan-mclain.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-nathan-sosa.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-darcey-edwards.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-cyrus-javadi.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-shannon-isadore.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-mari-watanabe.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-farrah-chaichi.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-hai-pham.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-jules-walters.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-daniel-nguyen.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-april-dobson.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-annessa-hartman.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-mark-gamba.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-rob-nosse.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-tawna-sanchez.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-travis-nelson.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-thuy-tran.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-willy-chotzen.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-andrea-valderrama.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-lamar-wise.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-zach-hudson.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-ricki-ruiz.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-matt-bunch.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-jeff-helfrich.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-emerson-levy.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-jason-kropf.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-e-werner-reschke.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-emily-mcintire.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-gregory-smith.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-bobby-levy.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-vikki-breese-iverson.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-31-mark-owens.csv
    - C:/EV-Accounts/backend/scripts/apply-court-boice-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-virgle-osborne-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-dwayne-yunker-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-alek-skarlatos-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-pam-marsh-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-kim-wallan-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-john-lively-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-lisa-fragala-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-boomer-wright-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-david-gomberg-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-jami-cate-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-darin-harbick-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-nancy-nathanson-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-julie-fahey-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-shelly-boshart-davis-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-sarah-finger-mcdonald-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-ed-diehl-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-rick-lewis-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-tom-andersen-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-paul-evans-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-kevin-mannix-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-lesly-munoz-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-anna-scharf-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-lucetta-elmer-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-ben-bowman-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-sue-rieke-smith-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-ken-helm-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-dacia-grayber-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-susan-mclain-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-nathan-sosa-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-darcey-edwards-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-cyrus-javadi-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-shannon-isadore-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-mari-watanabe-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-farrah-chaichi-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-hai-pham-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-jules-walters-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-daniel-nguyen-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-april-dobson-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-annessa-hartman-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-mark-gamba-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-rob-nosse-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-tawna-sanchez-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-travis-nelson-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-thuy-tran-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-willy-chotzen-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-andrea-valderrama-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-lamar-wise-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-zach-hudson-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-ricki-ruiz-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-matt-bunch-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-jeff-helfrich-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-emerson-levy-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-jason-kropf-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-e-werner-reschke-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-emily-mcintire-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-gregory-smith-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-bobby-levy-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-vikki-breese-iverson-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-mark-owens-stances.ts
    - C:/EV-Accounts/backend/migrations/243_or_house_stances.sql
  modified: []
decisions:
  - "Sequential one-at-a-time execution enforced (D-11) — all 60 house reps processed without parallel agents"
  - "Evidence-only standard held (D-12) — every stance row has OLIS, Ballotpedia, or OPB citation URL"
  - "LOW evidence Eastern OR members (HD-55..HD-60) capped at 3 stances per D-10 guidance"
  - "HIGH evidence Portland-area reps exceeded targets: Gamba=9, Nosse=9, Sanchez=9"
  - "Julie Fahey (former House Majority Leader) reached 10 stances, exceeding >=8 requirement"
  - "Migration 243 uses integer values (not 2.0 floats) per RESEARCH.md Open Question 2 resolution"
  - "Migration uses dollar-quoting for reasoning text per 82-PATTERNS.md specification"
  - "No not-found (header-only) CSVs needed — OLIS floor vote records provided citable evidence for all 60 reps"
metrics:
  duration: "~4 hours"
  completed: "2026-05-31"
  tasks: 7
  files: 121
---

# Phase 82 Plan 02: OR State House Compass Stances Summary

**One-liner:** 321 compass stances ingested for all 60 OR state house representatives via sequential one-at-a-time research, 60 CSV files, 60 apply scripts, and consolidated idempotent migration 243; combined with Plan 82-01 gives Oregon first full legislature-wide compass coverage (90 legislators, 536 stances).

## Per-House-Rep Outcome Table

| external_id | Full Name | District | Stance Count | Not Found |
|-------------|-----------|----------|--------------|-----------|
| -4120001 | Court Boice | HD-01 | 3 | N |
| -4120002 | Virgle Osborne | HD-02 | 3 | N |
| -4120003 | Dwayne Yunker | HD-03 | 3 | N |
| -4120004 | Alek Skarlatos | HD-04 | 6 | N |
| -4120005 | Pam Marsh | HD-05 | 7 | N |
| -4120006 | Kim Wallan | HD-06 | 4 | N |
| -4120007 | John Lively | HD-07 | 6 | N |
| -4120008 | Lisa Fragala | HD-08 | 6 | N |
| -4120009 | Boomer Wright | HD-09 | 3 | N |
| -4120010 | David Gomberg | HD-10 | 6 | N |
| -4120011 | Jami Cate | HD-11 | 3 | N |
| -4120012 | Darin Harbick | HD-12 | 3 | N |
| -4120013 | Nancy Nathanson | HD-13 | 8 | N |
| -4120014 | Julie Fahey | HD-14 | 10 | N |
| -4120015 | Shelly Boshart Davis | HD-15 | 5 | N |
| -4120016 | Sarah Finger McDonald | HD-16 | 6 | N |
| -4120017 | Ed Diehl | HD-17 | 3 | N |
| -4120018 | Rick Lewis | HD-18 | 3 | N |
| -4120019 | Tom Andersen | HD-19 | 6 | N |
| -4120020 | Paul Evans | HD-20 | 6 | N |
| -4120021 | Kevin Mannix | HD-21 | 7 | N |
| -4120022 | Lesly Muñoz | HD-22 | 6 | N |
| -4120023 | Anna Scharf | HD-23 | 4 | N |
| -4120024 | Lucetta Elmer | HD-24 | 3 | N |
| -4120025 | Ben Bowman | HD-25 | 6 | N |
| -4120026 | Sue Rieke Smith | HD-26 | 5 | N |
| -4120027 | Ken Helm | HD-27 | 6 | N |
| -4120028 | Dacia Grayber | HD-28 | 6 | N |
| -4120029 | Susan McLain | HD-29 | 6 | N |
| -4120030 | Nathan Sosa | HD-30 | 6 | N |
| -4120031 | Darcey Edwards | HD-31 | 3 | N |
| -4120032 | Cyrus Javadi | HD-32 | 5 | N |
| -4120033 | Shannon Isadore | HD-33 | 7 | N |
| -4120034 | Mari Watanabe | HD-34 | 6 | N |
| -4120035 | Farrah Chaichi | HD-35 | 6 | N |
| -4120036 | Hai Pham | HD-36 | 6 | N |
| -4120037 | Jules Walters | HD-37 | 6 | N |
| -4120038 | Daniel Nguyễn | HD-38 | 6 | N |
| -4120039 | April Dobson | HD-39 | 6 | N |
| -4120040 | Annessa Hartman | HD-40 | 6 | N |
| -4120041 | Mark Gamba | HD-41 | 9 | N |
| -4120042 | Rob Nosse | HD-42 | 9 | N |
| -4120043 | Tawna D. Sanchez | HD-43 | 9 | N |
| -4120044 | Travis Nelson | HD-44 | 7 | N |
| -4120045 | Thủy Trần | HD-45 | 6 | N |
| -4120046 | Willy Chotzen | HD-46 | 6 | N |
| -4120047 | Andrea Valderrama | HD-47 | 7 | N |
| -4120048 | Lamar Wise | HD-48 | 6 | N |
| -4120049 | Zach Hudson | HD-49 | 6 | N |
| -4120050 | Ricki Ruiz | HD-50 | 6 | N |
| -4120051 | Matt Bunch | HD-51 | 4 | N |
| -4120052 | Jeff Helfrich | HD-52 | 3 | N |
| -4120053 | Emerson Levy | HD-53 | 6 | N |
| -4120054 | Jason Kropf | HD-54 | 6 | N |
| -4120055 | E. Werner Reschke | HD-55 | 3 | N |
| -4120056 | Emily McIntire | HD-56 | 3 | N |
| -4120057 | Gregory Smith | HD-57 | 3 | N |
| -4120058 | Bobby Levy | HD-58 | 3 | N |
| -4120059 | Vikki Breese-Iverson | HD-59 | 4 | N |
| -4120060 | Mark Owens | HD-60 | 3 | N |

**Total stance rows ingested: 321 across all 60 house reps**

## Sub-Batch Sequential Confirmation

- Sub-batch A (HD-01 through HD-10): Completed sequentially, all 10 apply scripts logged "Done — Upserted: N, Skipped: 0" before next politician started. Committed at git hash 6fe322b.
- Sub-batch B (HD-11 through HD-20): Started only after sub-batch A fully complete. Completed sequentially. Committed at git hash 5ccb544.
- Sub-batch C (HD-21 through HD-30): Started only after sub-batch B fully complete. Completed sequentially. Committed at git hash 4e136e3.
- Sub-batch D (HD-31 through HD-40): Started only after sub-batch C fully complete. Completed sequentially. Committed at git hash 5c24544.
- Sub-batch E (HD-41 through HD-50): Started only after sub-batch D fully complete. Completed sequentially. Committed at git hash ac3e6f3.
- Sub-batch F (HD-51 through HD-60): Started only after sub-batch E fully complete. Completed sequentially. Committed at git hash 7042f05.
- Migration (Task 7): Started only after sub-batch F fully complete.

D-11 (ONE-AT-A-TIME) rule enforced throughout. No parallel research agents spawned.

## Migration 243 Results

- File: `C:/EV-Accounts/backend/migrations/243_or_house_stances.sql`
- Applied to production: SUCCESS
- Idempotency check (re-run): SUCCESS (stance count unchanged at 321)
- Ledger: version '243' present in supabase_migrations.schema_migrations
- Migration format: BEGIN; ... COMMIT; with per-rep comment blocks
- Values: integer notation (not 2.0 floats)
- Reasoning text: dollar-quoted ($$...$$)

## Quality Gate Results

| Gate | Result | Detail |
|------|--------|--------|
| Citation parity (QUALITY-01) | PASS | 0 uncited answers — every politician_answers row has a politician_context row |
| Value range (integers 1-5) | PASS | MIN=1, MAX=5, 0 rows with value outside 1-5 |
| No retired topic UUIDs | PASS | 0 matches for any of the 6 retired UUIDs in migration file |
| Coverage (all 60 house reps) | PASS | 60/60 house reps present; 0 with stance_count = 0 |
| Migration ledger | PASS | version='243' in supabase_migrations.schema_migrations |
| Sequential execution (QUALITY-02) | PASS | All 60 house reps processed one-at-a-time in order |
| Combined 90-legislator coverage | PASS | 90/90 OR legislators (30 senators + 60 house reps) with stances |

## Evidence Notes

**Exceeding HIGH evidence targets:**
- Julie Fahey (HD-14): 10 stances — former House Majority Leader, very documented Eugene progressive record
- Mark Gamba (HD-41): 9 stances — climate champion, former Mayor of Milwaukie, environmental justice focus
- Rob Nosse (HD-42): 9 stances — Portland SE, long tenure, LGBTQ+/healthcare champion
- Tawna D. Sanchez (HD-43): 9 stances — tribal/Native American advocate, former Urban League director

**MEDIUM-HIGH evidence:**
- Nancy Nathanson (HD-13): 8 stances — long Eugene tenure, education background
- Kevin Mannix (HD-21): 7 stances — former AG candidate (2000, 2002), long political record

**LOW evidence Eastern OR with minimum citable stances (per D-10 guidance):**
- HD-55 E. Werner Reschke, HD-56 Emily McIntire, HD-57 Gregory Smith, HD-58 Bobby Levy, HD-60 Mark Owens: 3 stances each (OLIS floor votes for HB 2002 + 2023 walkout + anti-tax record)
- HD-52 Jeff Helfrich: 3 stances (Hood River, LOW)

**No not-found (header-only) CSVs:** All 60 house reps had OLIS floor vote records providing at least 3 citable stances (HB 2002 vote + 2023 walkout + tax positions). The 2023 House Republican walkout and HB 2002 floor votes provided citable evidence for all Republican members including Eastern OR members.

## Combined Coverage (Plans 82-01 + 82-02)

- OR State Senate: 30 senators, 215 stances (migration 242)
- OR State House: 60 house reps, 321 stances (migration 243)
- Combined: 90 OR legislators, 536 stances total
- Oregon is now the first state in the app with full legislature-wide compass coverage

## Unicode Preservation Verification

| Politician | DB full_name | Status |
|------------|-------------|--------|
| Lesly Muñoz (HD-22) | Lesly Muñoz | PASS — diacritic ñ preserved |
| Daniel Nguyễn (HD-38) | Daniel Nguyễn | PASS — diacritic ễ preserved |
| Thủy Trần (HD-45) | Thủy Trần | PASS — diacritics ủ and ầ preserved |

CSV filenames used ASCII slugs (lesly-munoz, daniel-nguyen, thuy-tran) as required. DB stores Unicode names correctly via PostgreSQL UTF-8.

## Surprising Evidence Outcomes

**Richer than expected:**
- Mark Gamba (HD-41): Expected 8+, got 9 — his former Milwaukie Mayor record and climate activism provided excellent evidence
- Rob Nosse (HD-42): Expected 6+, got 9 — Portland SE progressive with documented LGBTQ+, healthcare, housing, and rent regulation stances
- Tawna D. Sanchez (HD-43): Expected 8+, got 9 — former Urban League director with documented civil rights, tribal advocacy, and immigration stances

**Sparser than expected:**
- None — all LOW evidence Eastern OR members still had OLIS floor votes providing 3 citable stances minimum

## Deviations from Plan

**Rule 1 (Auto-fix bug) — CSV column offset in david-gomberg.csv:** The local-environment row in the initial david-gomberg.csv had the topic_id column missing (only 4 columns instead of 5). Fixed immediately before apply script run. The local-environment UUID `1935979c-b290-42e4-baa5-8cb0138b4ffa` was added to the row.

All other plan elements executed exactly as written. Sub-batches A through F ran sequentially per D-11. All apply scripts used apply-tina-kotek-stances.ts pattern with parseInt(r.value) direct. No scale inversion introduced.

## Known Stubs

None — all 321 stance rows are wired to real politician_id UUIDs and real compass topic IDs. No placeholder data.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes introduced. Migration 243 is a pure data migration writing to existing inform schema tables.

## Self-Check: PASSED

- 60 CSV files exist at C:/EV-Accounts/backend/data/stance-research/2026-05-31-*.csv
- 60 apply scripts exist at C:/EV-Accounts/backend/scripts/apply-*-stances.ts
- Migration file exists: C:/EV-Accounts/backend/migrations/243_or_house_stances.sql
- Migration ledger: version 243 confirmed in supabase_migrations.schema_migrations
- All SQL gates: PASS (0 uncited, 0 out-of-range, 60/60 coverage, 90/90 combined)
- Git commits: 6fe322b (sub-batch A), 5ccb544 (sub-batch B), 4e136e3 (sub-batch C), 5c24544 (sub-batch D), ac3e6f3 (sub-batch E), 7042f05 (sub-batch F)
