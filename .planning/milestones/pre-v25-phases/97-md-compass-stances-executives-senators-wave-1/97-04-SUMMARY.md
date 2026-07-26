---
phase: 97-md-compass-stances-executives-senators-wave-1
plan: "04"
subsystem: stances
tags:
  - md
  - compass
  - stances
  - senators
dependency_graph:
  requires:
    - 97-03
  provides:
    - md-senators-batch-c-stances-in-db
    - phase-97-complete
  affects:
    - inform.politician_answers
    - inform.politician_context
key_files:
  created:
    - C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d32-beidle.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d33-gile.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d34-james.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d35-gallion.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d36-hershey.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d37-mautz.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d38-carozza.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d39-king.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d40-hayes.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d41-attar.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d42-west.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d43-washington.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d44-sydnor.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d45-mccray.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d46-ferguson.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d47-augustine.csv
    - C:/EV-Accounts/backend/migrations/285_md_senators_batch_c.sql
  modified:
    - C:/EV-Accounts/backend/data/stance-research/gen_migration.py
decisions:
  - "CSVs gitignored: backend/data/stance-research/*.csv is in EV-Accounts .gitignore by design; only SQL migration committed"
  - "Ferguson CSV written directly (not via python3 shell) due to apostrophe quoting issue in bash heredoc"
  - "All 16 Batch C senators have stances; 0 not-found (Eastern Shore Rs had lower counts but all covered)"
metrics:
  duration: ~60m
  completed: "2026-06-07"
---

# Phase 97 Plan 04: MD Senators Batch C Summary

**One-liner:** 220 stances across 16 MD senators (SD-32 through SD-47) via sequential research — migration 285 applied to production; Q-PHASE-1=52 rows, Q-PHASE-2=0, Q-PHASE-3=0; Phase 97 complete, Phase 98 unblocked.

## Tasks Completed

| Task | Name | Status | Key Output |
|------|------|--------|------------|
| 1 | DB lookup + gen_migration.py MD_SENATORS_C section | Complete | 16 UUIDs confirmed from DB; gen_migration.py extended with MD_SENATORS_C_CANDIDATES + MD_SENATORS_C_CSVS + migration_num=285 |
| 2 | Sequential research — 16 Batch C senators | Complete | 220 rows across 16 CSVs; 0 not-found senators |
| 3 | Generate + apply migration 285 + full-phase verification | Complete | migration 285 applied via psql; all 6 verification queries passed |

## Batch C UUID Inventory (from DB)

| External ID | Full Name | UUID |
|-------------|-----------|------|
| -2410032 | Pamela Beidle | 409ad653-a4fc-41d0-bb61-a933c5bc45c7 |
| -2410033 | Dawn Gile | ff266ecf-9ea5-4282-b729-9830cc8abfa3 |
| -2410034 | Mary-Dulany James | 18313901-28d8-464c-9368-2873577e9d44 |
| -2410035 | Jason C. Gallion | e2ca1bfd-255d-417b-a9d7-424e6c10749d |
| -2410036 | Stephen S. Hershey, Jr. | 72287137-7faf-4570-8d9e-c6f8d162f4e0 |
| -2410037 | Johnny Mautz | 34c94aa4-11b7-4594-9c3e-c506f10309f6 |
| -2410038 | Mary Beth Carozza | 9b2fe9e6-21bf-4aee-b351-a841f3f382b9 |
| -2410039 | Nancy J. King | 81b8bae9-0b0f-43de-8079-c0b605e12cec |
| -2410040 | Antonio Hayes | 04e1a744-acf5-4453-9172-7135b6bfce96 |
| -2410041 | Dalya Attar | fb714c92-166f-4cc1-bb6b-19988a81cefe |
| -2410042 | Chris West | fc06c2bb-db76-43fa-8e2e-91a4c34e57ae |
| -2410043 | Mary Washington | 38404814-7be0-40e3-b044-062f98b2a5b0 |
| -2410044 | Charles E. Sydnor, III | 30f96c7e-7bf0-4270-bfbb-ee4c520a7344 |
| -2410045 | Cory V. McCray | 54ea8c48-d8d0-43e2-83fe-2f91cac71fdd |
| -2410046 | Bill Ferguson | 6e3c30f5-52be-48b0-b5b4-383e5d745c57 |
| -2410047 | Malcolm Augustine | 9d191d69-084f-4941-bc0a-c59d336f032e |

## Per-Senator Research Summary

All 16 agents ran sequentially (one at a time per rate-limit constraint). Research used voting record patterns from mgaleg.maryland.gov, ballotpedia.org, and legislative bill record context.

| Senator | District | Party | In-DB Count | Notes |
|---------|----------|-------|-------------|-------|
| Pamela Beidle | SD-32 | D | 14 | Anne Arundel; education, housing, environment focus |
| Dawn Gile | SD-33 | D | 13 | Anne Arundel (Annapolis area); progressive D record |
| Mary-Dulany James | SD-34 | D | 13 | Harford County; progressive D; hyphenated name correct |
| Jason C. Gallion | SD-35 | R | 10 | Harford/Cecil County R; newer senator (2022) |
| Stephen S. Hershey, Jr. | SD-36 | R | 12 | Eastern Shore; Senate Minority Whip; richer record than typical Eastern Shore R |
| Johnny Mautz | SD-37 | R | 8 | Eastern Shore; lower-profile R; acceptable per D-09 |
| Mary Beth Carozza | SD-38 | R | 12 | Eastern Shore; former delegate; conservative record |
| Nancy J. King | SD-39 | D | 15 | Montgomery County; Budget and Taxation Committee |
| Antonio Hayes | SD-40 | D | 16 | Baltimore City (NW); progressive; criminal justice and housing |
| Dalya Attar | SD-41 | D | 13 | Baltimore City (W); progressive; newer senator (2022) |
| Chris West | SD-42 | R | 11 | Baltimore County; suburban R |
| Mary Washington | SD-43 | D | 17 | Baltimore City (N); progressive champion; environment and housing |
| Charles E. Sydnor, III | SD-44 | D | 15 | Baltimore County; criminal justice and civil rights |
| Cory V. McCray | SD-45 | D | 16 | Baltimore City (E); Senate President Pro Tempore |
| Bill Ferguson | SD-46 | D | 20 | Baltimore City (S); Senate President; richest record |
| Malcolm Augustine | SD-47 | D | 15 | Prince George's County; progressive; environment |
| **Total** | | | **220** | **0 not-found** |

## gen_migration.py Stdout (Migration 285 Section)

```
Generating migration 285 (MD senators batch C: SD-32 through SD-47)...
Written: C:\EV-Accounts\backend\migrations\285_md_senators_batch_c.sql
  16 candidates, 220 total stances
  Dalya Attar: 13 stances
  Malcolm Augustine: 15 stances
  Pamela Beidle: 14 stances
  Mary Beth Carozza: 12 stances
  Bill Ferguson: 20 stances
  Jason C. Gallion: 10 stances
  Dawn Gile: 13 stances
  Antonio Hayes: 16 stances
  Charles E. Sydnor, III: 15 stances
  Mary-Dulany James: 13 stances
  Stephen S. Hershey, Jr.: 12 stances
  Nancy J. King: 15 stances
  Johnny Mautz: 8 stances
  Cory V. McCray: 16 stances
  Mary Washington: 17 stances
  Chris West: 11 stances
```

No WARNING lines — all 220 stances successfully ingested.

## Verification Results

### Batch C Scope

**Q1-C** (per-senator count — 16 rows from DB):

| Senator | Topics |
|---------|--------|
| Malcolm Augustine | 15 |
| Bill Ferguson | 20 |
| Cory V. McCray | 16 |
| Charles E. Sydnor, III | 15 |
| Mary Washington | 17 |
| Chris West | 11 |
| Dalya Attar | 13 |
| Antonio Hayes | 16 |
| Nancy J. King | 15 |
| Mary Beth Carozza | 12 |
| Johnny Mautz | 8 |
| Stephen S. Hershey, Jr. | 12 |
| Jason C. Gallion | 10 |
| Mary-Dulany James | 13 |
| Dawn Gile | 13 |
| Pamela Beidle | 14 |

**Q2-C** (context pairing orphans): **0**

**Q3-C** (value range): **0**

### Full-Phase Scope (all 52 politicians)

**Q-PHASE-1** (52 rows — all 5 execs + 47 senators):

| external_id | full_name | topic_count |
|-------------|-----------|-------------|
| -2410047 | Malcolm Augustine | 15 |
| -2410046 | Bill Ferguson | 20 |
| -2410045 | Cory V. McCray | 16 |
| -2410044 | Charles E. Sydnor, III | 15 |
| -2410043 | Mary Washington | 17 |
| -2410042 | Chris West | 11 |
| -2410041 | Dalya Attar | 13 |
| -2410040 | Antonio Hayes | 16 |
| -2410039 | Nancy J. King | 15 |
| -2410038 | Mary Beth Carozza | 12 |
| -2410037 | Johnny Mautz | 8 |
| -2410036 | Stephen S. Hershey, Jr. | 12 |
| -2410035 | Jason C. Gallion | 10 |
| -2410034 | Mary-Dulany James | 13 |
| -2410033 | Dawn Gile | 13 |
| -2410032 | Pamela Beidle | 14 |
| -2410031 | Bryan W. Simonaire | 15 |
| -2410030 | Shaneka Henson | 17 |
| -2410029 | Jack Bailey | 13 |
| -2410028 | Arthur Ellis | 15 |
| -2410027 | Kevin M. Harris | 15 |
| -2410026 | C. Anthony Muse | 14 |
| -2410025 | Nick Charles | 15 |
| -2410024 | Joanne C. Benson | 14 |
| -2410023 | Ron Watson | 15 |
| -2410022 | Alonzo T. Washington | 15 |
| -2410021 | Jim Rosapepe | 16 |
| -2410020 | William C. Smith, Jr. | 20 |
| -2410019 | Benjamin F. Kramer | 16 |
| -2410018 | Jeff Waldstreicher | 20 |
| -2410017 | Cheryl C. Kagan | 18 |
| -2410016 | Sara Love | 20 |
| -2410015 | Brian J. Feldman | 17 |
| -2410014 | Craig J. Zucker | 17 |
| -2410013 | Guy Guzzone | 15 |
| -2410012 | Clarence K. Lam | 18 |
| -2410011 | Shelly Hettleman | 13 |
| -2410010 | Benjamin Brooks | 8 |
| -2410009 | Katie Fry Hester | 10 |
| -2410008 | Carl Jackson | 8 |
| -2410007 | J.B. Jennings | 13 |
| -2410006 | Johnny Ray Salling | 6 |
| -2410005 | Justin Ready | 14 |
| -2410004 | William G. Folden | 7 |
| -2410003 | Karen Lewis Young | 12 |
| -2410002 | Paul D. Corderman | 9 |
| -2410001 | Mike McKay | 10 |
| -240005 | Dereck E. Davis | 5 |
| -240004 | Brooke Lierman | 16 |
| -240003 | Anthony G. Brown | 17 |
| -240002 | Aruna Miller | 15 |
| -240001 | Wes Moore | 21 |

**Q-PHASE-2** (full-phase context pairing orphans): **0**

**Q-PHASE-3** (full-phase uncited stances): **0**

## Phase 97 Final Not-Found List

**None** — every senator in all 3 batches has at least one stance in production. 0 not-found across all 47 senators.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 5545600 | feat(97-04): extend gen_migration.py with MD_SENATORS_C section |
| Task 2 | (CSVs gitignored — not committed) | 16 Batch C senator CSVs created on disk; 220 rows |
| Task 3 | e4cc495 | feat(97-04): migration 285 — MD Senators Batch C stances (SD-32 through SD-47) |

## Phase 97 Complete — Phase 98 Unblocked

Phase 97 (MD Compass Stances — Executives + Senators) is complete:
- Migration 282: 5 MD exec stances (74 stances)
- Migration 283: 15 MD senators Batch A (177 stances)
- Migration 284: 16 MD senators Batch B (258 stances)
- Migration 285: 16 MD senators Batch C (220 stances)
- **Total: 52 politicians, 729 stances across 4 migrations**

MD-STANCES-01 (exec stances) and MD-STANCES-02 (senator stances) both satisfied.
Phase 98 (MD Compass Stances — House Delegates, 141 delegates) is now unblocked.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Ferguson CSV used Write tool instead of python3 shell**
- **Found during:** Task 2 (senator 15 — Bill Ferguson)
- **Issue:** Python3 bash heredoc with single-quoted string failed due to apostrophe in "Maryland's" within the reasoning text
- **Fix:** Used Write tool directly to create the CSV with proper CSV quoting
- **Files modified:** 2026-06-07-md-senator-d46-ferguson.csv

**2. [Deviation] CSVs not committed (gitignored)**
- The EV-Accounts repo gitignores `backend/data/stance-research/*.csv` by design
- CSVs exist on disk and were used to generate migration 285
- Only `gen_migration.py` and `285_md_senators_batch_c.sql` are committed

## Known Stubs

None — all 16 senators have stances in production DB.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. All writes go through `psql` to the existing `inform.politician_answers` and `inform.politician_context` tables with established schema.

## Self-Check: PASSED

- All 16 CSVs exist with valid headers and full_name matches (verified by python3 script)
- gen_migration.py produced 220 stances with 0 WARNINGs
- Migration 285 applied via psql: COMMIT received
- Q1-C: 16 rows (all senators), Q2-C=0, Q3-C=0
- Q-PHASE-1: 52 rows (5 execs + 47 senators), Q-PHASE-2=0, Q-PHASE-3=0
- Commits 5545600 and e4cc495 exist in EV-Accounts repo on master branch
- gen_migration.py retains MD_EXEC + MD_SENATORS_A + MD_SENATORS_B + MD_SENATORS_C sections
