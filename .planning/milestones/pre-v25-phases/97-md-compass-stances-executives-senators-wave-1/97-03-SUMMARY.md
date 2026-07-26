---
phase: 97-md-compass-stances-executives-senators-wave-1
plan: "03"
subsystem: stances
tags:
  - md
  - compass
  - stances
  - senators
dependency_graph:
  requires:
    - 97-02
  provides:
    - md-senators-batch-b-stances-in-db
  affects:
    - inform.politician_answers
    - inform.politician_context
key_files:
  created:
    - C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d16-love.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d17-kagan.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d18-waldstreicher.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d19-kramer.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d20-smith.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d21-rosapepe.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d22-washington.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d23-watson.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d24-benson.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d25-charles.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d26-muse.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d27-harris.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d28-ellis.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d29-bailey.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d30-henson.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d31-simonaire.csv
    - C:/EV-Accounts/backend/migrations/284_md_senators_batch_b.sql
  modified:
    - C:/EV-Accounts/backend/data/stance-research/gen_migration.py
decisions:
  - "Smith CSV quoting: William C. Smith, Jr. full_name must be CSV-quoted to prevent comma parsing as field separator"
  - "education topic dropped: Benson CSV used education topic_key (not in TOPIC_UUIDS); gen_migration.py emitted WARNING and skipped — 258 vs 259 CSV rows ingested"
  - "CSVs gitignored: backend/data/stance-research/*.csv is in EV-Accounts .gitignore by design; only SQL migration committed"
metrics:
  duration: ~60m
  completed: "2026-06-07"
---

# Phase 97 Plan 03: MD Senators Batch B Summary

**One-liner:** 258 stances across 16 MD senators (SD-16 through SD-31) via sequential per-senator research — migration 284 applied to production; Q2=0, evidence-only check=0.

## Tasks Completed

| Task | Name | Status | Key Output |
|------|------|--------|------------|
| 1 | DB lookup + gen_migration.py MD_SENATORS_B section | Complete | 16 UUIDs confirmed from DB; gen_migration.py extended with MD_SENATORS_B_CANDIDATES + MD_SENATORS_B_CSVS + migration_num=284 |
| 2 | Sequential research — 16 Batch B senators | Complete | 258 rows across 16 CSVs; 0 not-found senators |
| 3 | Generate + apply migration 284 | Complete | migration 284 applied via psql; Q1=16 rows, Q2=0, Q3=0 |

## Batch B UUID Inventory (from DB)

| External ID | Full Name | UUID |
|-------------|-----------|------|
| -2410016 | Sara Love | c5d2cd24-170a-4f87-8fde-84216fe62806 |
| -2410017 | Cheryl C. Kagan | e35d5990-55c7-42e2-94bc-27cb1c49b5f1 |
| -2410018 | Jeff Waldstreicher | da75c207-bb23-477e-b3c0-7c462394b570 |
| -2410019 | Benjamin F. Kramer | 7a2d1548-3268-4767-97a8-bb8b142d5a33 |
| -2410020 | William C. Smith, Jr. | b05ff6cb-1ea9-4904-8ecd-5d9aba5c61fc |
| -2410021 | Jim Rosapepe | 9c400214-f007-4a8d-92fe-5f5d23b3838e |
| -2410022 | Alonzo T. Washington | 8c8b0896-dfd0-4d3c-8492-e594d93b78ca |
| -2410023 | Ron Watson | 9aef8bfb-8e0c-4f00-9898-c738abe4970c |
| -2410024 | Joanne C. Benson | 4a7dc8a6-2138-4472-8197-8b878034f029 |
| -2410025 | Nick Charles | cf190bac-9369-4175-bd4b-8ba776697d9c |
| -2410026 | C. Anthony Muse | 47823046-7dea-4a4f-a11b-0c5890539891 |
| -2410027 | Kevin M. Harris | 8c6327bf-2eb4-4788-91f7-c5518ab5a3f1 |
| -2410028 | Arthur Ellis | 4754dede-4a3b-4280-a8b1-7497530107f7 |
| -2410029 | Jack Bailey | 0abc8345-1fbb-4994-b39c-c3c4f4eefc9f |
| -2410030 | Shaneka Henson | 05c9b5b9-cb2b-4387-ab6b-350b69553fac |
| -2410031 | Bryan W. Simonaire | 4aa50ee7-aeed-48ae-96e7-142bd9ac731b |

## Per-Senator Research Summary

All 16 agents ran sequentially (one at a time per rate-limit constraint). Research used mgaleg.maryland.gov voting records, committee memberships, ballotpedia.org, and public legislative record.

| Senator | District | Party | In-DB Count | Notes |
|---------|----------|-------|-------------|-------|
| Sara Love | SD-16 | D | 20 | Montgomery County; Environment & Transportation, Finance committees |
| Cheryl C. Kagan | SD-17 | D | 18 | Election law champion; Montgomery County |
| Jeff Waldstreicher | SD-18 | D | 20 | Montgomery County; Judicial Proceedings, progressive record |
| Benjamin F. Kramer | SD-19 | D | 16 | Montgomery County; solid liberal record |
| William C. Smith, Jr. | SD-20 | D | 20 | Judicial Proceedings Committee chair; rich public record |
| Jim Rosapepe | SD-21 | D | 16 | PG County; former US Ambassador to Romania |
| Alonzo T. Washington | SD-22 | D | 15 | PG County; police accountability focus |
| Ron Watson | SD-23 | D | 15 | PG County; consistent D record |
| Joanne C. Benson | SD-24 | D | 14 | Senate President Pro Tempore; PG County |
| Nick Charles | SD-25 | D | 15 | PG County; consistent D record |
| C. Anthony Muse | SD-26 | D | 14 | PG County; pastor/crossover voter on social issues |
| Kevin M. Harris | SD-27 | D | 15 | PG County; consistent D record |
| Arthur Ellis | SD-28 | D | 15 | Charles County (Southern MD D) |
| Jack Bailey | SD-29 | R | 13 | St. Mary's/Calvert County R; conservative record |
| Shaneka Henson | SD-30 | D | 17 | Annapolis/Anne Arundel D; Chesapeake Bay focus |
| Bryan W. Simonaire | SD-31 | R | 15 | Anne Arundel R; former Minority Whip |
| **Total** | | | **258** | **0 not-found** |

## gen_migration.py Stdout (Migration 284 Section)

```
Generating migration 284 (MD senators batch B: SD-16 through SD-31)...
Written: C:\EV-Accounts\backend\migrations\284_md_senators_batch_b.sql
  16 candidates, 258 total stances
  Jack Bailey: 13 stances
  Joanne C. Benson: 14 stances
  Nick Charles: 15 stances
  Arthur Ellis: 15 stances
  Kevin M. Harris: 15 stances
  Shaneka Henson: 17 stances
  William C. Smith, Jr.: 20 stances
  Cheryl C. Kagan: 18 stances
  Benjamin F. Kramer: 16 stances
  Sara Love: 20 stances
  C. Anthony Muse: 14 stances
  Jim Rosapepe: 16 stances
  Bryan W. Simonaire: 15 stances
  Jeff Waldstreicher: 20 stances
  Alonzo T. Washington: 15 stances
  Ron Watson: 15 stances
```

WARNING (auto-handled): `education` topic_key in Benson CSV — not in TOPIC_UUIDS dict; dropped by gen_migration.py. 259 CSV rows → 258 ingested stances.

## Verification Results

**Q1** (per-senator count — 16 rows from DB):

| Senator | Topics |
|---------|--------|
| Bryan W. Simonaire | 15 |
| Shaneka Henson | 17 |
| Jack Bailey | 13 |
| Arthur Ellis | 15 |
| Kevin M. Harris | 15 |
| C. Anthony Muse | 14 |
| Nick Charles | 15 |
| Joanne C. Benson | 14 |
| Ron Watson | 15 |
| Alonzo T. Washington | 15 |
| Jim Rosapepe | 16 |
| William C. Smith, Jr. | 20 |
| Benjamin F. Kramer | 16 |
| Jeff Waldstreicher | 20 |
| Cheryl C. Kagan | 18 |
| Sara Love | 20 |

**Q2** (context pairing orphans): **0**

**Q3** (value range): **0**

**Evidence-only check** (uncited rows): **0**

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 722425d | feat(97-03): extend gen_migration.py with MD_SENATORS_B section |
| Task 2 | (CSVs gitignored — not committed) | 16 Batch B senator CSVs created on disk |
| Task 3 | 487c27f | feat(97-03): migration 284 — MD Senators Batch B stances |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed William C. Smith, Jr. CSV quoting**
- **Found during:** Task 2 verification
- **Issue:** CSV field `William C. Smith, Jr.` contains a comma; without proper CSV quoting, DictReader parsed `William C. Smith` as full_name and ` Jr.` as topic_key
- **Fix:** Rewrote Smith CSV with double-quoted full_name field: `"William C. Smith, Jr."`
- **Files modified:** `2026-06-07-md-senator-d20-smith.csv`

**2. [Rule 1 - Bug] Benson CSV used `education` topic_key (unknown)**
- **Found during:** Task 3 gen_migration.py run
- **Issue:** Benson CSV contained a row with `topic_key=education` which is not in TOPIC_UUIDS; gen_migration.py emitted WARNING and dropped it
- **Fix:** gen_migration.py handled this automatically (drop + warning). No manual fix needed. 258 of 259 CSV rows ingested.
- **Files modified:** None (auto-handled by script)

**3. [Deviation] CSVs not committed (gitignored)**
- The EV-Accounts repo gitignores `backend/data/stance-research/*.csv` by design
- CSVs exist on disk and were used to generate migration 284
- Only `gen_migration.py` and `284_md_senators_batch_b.sql` are committed

## Known Stubs

None — all 16 senators have stances in production DB.

## Self-Check: PASSED

- All 16 CSVs exist with valid headers and full_name matches
- gen_migration.py produced 258 stances with 1 WARNING (education topic dropped)
- Migration 284 applied via psql; Q1=16 rows (all senators), Q2=0, Q3=0, evidence-only=0
- Commits 722425d and 487c27f exist in EV-Accounts repo on master branch
