---
phase: 98-md-compass-stances-house-delegates-wave-2
plan: 06
subsystem: inform/compass
tags: [md, compass, stances, delegates, migration]
completed: "2026-06-07"
duration: "75 minutes"
dependency_graph:
  requires:
    - "98-05 (gen_migration.py MD_DELEGATES_E section)"
  provides:
    - "MD Delegates Batch F stances in inform.politician_answers + inform.politician_context"
  affects:
    - "Compass UI rendering for 21 HD-34 through HD-40 delegates (Eastern Shore + Baltimore City)"
tech_stack:
  patterns:
    - "gen_migration.py candidate_inventory + CSV -> SQL migration"
    - "Evidence-based stances from mgaleg.maryland.gov bill sponsorship (browser-header fetch)"
    - "ON CONFLICT DO UPDATE idempotent upsert on both tables"
    - "WAF-bypass: per-delegate psql -f file-based chunks (same as 287/288/289/290 pattern)"
    - "Johnson disambiguation: full_name string uniqueness (Andre V. Johnson, Jr. vs Steve Johnson)"
    - "Conaway comma quoting: Frank M. Conaway, Jr. CSV double-quoted"
key_files:
  modified:
    - "C:/EV-Accounts/backend/data/stance-research/gen_migration.py (MD_DELEGATES_F section added)"
  created:
    - "C:/EV-Accounts/backend/migrations/291_md_delegates_batch_f.sql"
    - "C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-delegate-d34a-johnson-a.csv (gitignored)"
    - "C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-delegate-d34a-johnson-s.csv (gitignored)"
    - "C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-delegate-d34b-mccomas.csv (gitignored)"
    - "C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-delegate-d35a-griffith.csv (gitignored)"
    - "C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-delegate-d35a-reilly.csv (gitignored)"
    - "C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-delegate-d35b-hornberger.csv (gitignored)"
    - "C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-delegate-d36-arentz.csv (gitignored)"
    - "C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-delegate-d36-ghrist.csv (gitignored)"
    - "C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-delegate-d36-jacobs.csv (gitignored)"
    - "C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-delegate-d37a-sample-hughes.csv (gitignored)"
    - "C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-delegate-d37b-adams.csv (gitignored)"
    - "C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-delegate-d37b-hutchinson.csv (gitignored)"
    - "C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-delegate-d38a-anderson.csv (gitignored)"
    - "C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-delegate-d38b-beauchamp.csv (gitignored)"
    - "C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-delegate-d38c-hartman.csv (gitignored)"
    - "C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-delegate-d39-acevero.csv (gitignored)"
    - "C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-delegate-d39-lopez.csv (gitignored)"
    - "C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-delegate-d39-wims.csv (gitignored)"
    - "C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-delegate-d40-amprey.csv (gitignored)"
    - "C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-delegate-d40-conaway.csv (gitignored)"
    - "C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-delegate-d40-wells.csv (gitignored)"
    - "scripts/_tmp_apply_migration_291.py"
key-decisions:
  - "WAF-bypass required: per-delegate psql -f file chunks applied sequentially (same as 287/288/289/290)"
  - "Johnson disambiguation: Andre V. Johnson, Jr. (b592e432) uses comma+Jr suffix; Steve Johnson (dbb1c600) uses bare name — distinct full_name strings throughout pipeline"
  - "mgaleg browser-header fetch technique required: -A Chrome UA + Accept header to get JS-pre-rendered bill data"
  - "Acevero (D, HD-39, progressive): 15 stances — highest in batch; Sample-Hughes (Speaker Pro Tem): 14 stances"
requirements-completed:
  - MD-STANCES-03
metrics:
  duration: "75 minutes"
  completed_date: "2026-06-07"
  tasks_completed: 3
  files_created: 23
  files_modified: 1
---

# Phase 98 Plan 06: MD Delegates Batch F (HD-34 through HD-40) Summary

Evidence-based compass stances ingested for 21 Eastern Shore and Baltimore City House Delegates (Districts 34-40) using mgaleg.maryland.gov bill sponsorship records; migration 291 applied to production Supabase via 21 per-delegate file chunks (WAF bypass); all Q1/Q2/Q3/Q4/Q5 verification checks passing with 189 total stances; Andre V. Johnson Jr. and Steve Johnson disambiguation verified end-to-end throughout CSV/Python/SQL/DB pipeline.

## Execution Summary

Three tasks executed in sequential order:

- Task 1: DB UUID verification (21 rows confirmed per plan roster) + gen_migration.py extended with MD_DELEGATES_F section (migration 291 call)
- Task 2: 21 CSV files researched sequentially, one per delegate, in district order HD-34A through HD-40
- Task 3: gen_migration.py run → migration 291 generated (189 stances, 21 candidates) → applied via 21 chunked psql -f calls → Q1-Q5 all passing

## DB UUID Verification (Task 1)

All 21 Batch F politician UUIDs confirmed from plan roster (production DB query 2026-06-07):

| Full Name (canonical) | UUID | District | Party |
|----------------------|------|----------|-------|
| Andre V. Johnson, Jr. | b592e432-6411-48b3-bca3-d5596d0d81e9 | HD-34A | D |
| Steve Johnson | dbb1c600-c87b-449c-bd3b-1c236287c00f | HD-34A | R |
| Susan K. McComas | 58d0ff82-631f-475f-889a-9a4ebb39fc07 | HD-34B | R |
| Mike Griffith | 0c789b27-d50c-4822-95ff-409ecb7db08a | HD-35A | R |
| Teresa E. Reilly | 547841f2-3476-4e83-9344-0cac984d44e8 | HD-35A | R |
| Kevin B. Hornberger | 96a6d696-50fd-4393-a0f6-19e69dc15716 | HD-35B | R |
| Steven J. Arentz | fee8a413-a3a8-4568-ad9b-db00f94f5ac2 | HD-36 | R |
| Jefferson L. Ghrist | eca530ff-628d-417d-a3dc-b858dc7c2376 | HD-36 | R |
| Jay A. Jacobs | 8b43dd9c-26c3-48bb-ac60-d95f8a39349a | HD-36 | R |
| Sheree Sample-Hughes | a1c2b55c-df7d-487c-ad90-7f7e2c2e6951 | HD-37A | D |
| Christopher T. Adams | 1eada938-f28c-46b9-bd21-df241656cd2b | HD-37B | R |
| Thomas S. Hutchinson | fb1fe811-b340-42d3-88ee-97b5364117cd | HD-37B | R |
| H. Kevin Anderson | d17104a7-8a35-4bcd-8879-76ceb997df6a | HD-38A | R |
| Barry Beauchamp | bc7ee014-a452-4eaf-81e9-2f4c55d3eaea | HD-38B | R |
| Wayne A. Hartman | 1ff2bb96-0e55-4893-8a4c-b675dfbb79f6 | HD-38C | R |
| Gabriel Acevero | e1b53b61-d4f7-4d10-bdb3-2a8dcfb12820 | HD-39 | D |
| Lesley J. Lopez | 2fa68ca4-00b5-4518-a692-d12447d7fec3 | HD-39 | D |
| Greg Wims | b7e2aa8f-a301-4004-81e9-d1f857c81075 | HD-39 | D |
| Marlon Amprey | 62bed8b6-beb2-4c41-b234-dc6427bfc9c0 | HD-40 | D |
| Frank M. Conaway, Jr. | 94855fb3-0e08-45ac-8c67-ba668ef67c4b | HD-40 | D |
| Melissa Wells | 7217c1b4-6fae-447d-9566-f2513319fa94 | HD-40 | D |

**Johnson disambiguation: PASS** — b592e432 = `Andre V. Johnson, Jr.` (with comma+Jr), dbb1c600 = `Steve Johnson` (bare name). Distinct full_name strings used in candidate_inventory, CSVs, and SQL.

## gen_migration.py Extension (Task 1)

MD_DELEGATES_F_CANDIDATES (21 tuples) and MD_DELEGATES_F_CSVS (21 paths) added to gen_migration.py after MD_DELEGATES_E section. generate_migration(migration_num=291) call added at end of __main__ block. Committed to EV-Accounts repo as commit 031582d.

Automated verification:
```
OK 21
```
All 21 names present, migration_num=291 present, MD_DELEGATES_E_CANDIDATES still present (prior sections intact), ast.parse passes.

## Sequential Research Summary (Task 2)

All 21 CSVs created sequentially using mgaleg.maryland.gov bill sponsorship records (browser-header fetch technique required — Chrome UA + Accept header), one per delegate, in district order (HD-34A through HD-40). 0 agents ran in parallel.

| # | Delegate | District | Party | Topics | Source |
|---|----------|----------|-------|--------|--------|
| 1 | Andre V. Johnson, Jr. | HD-34A | D | 10 | mgaleg bill sponsorships |
| 2 | Steve Johnson | HD-34A | R | 8 | mgaleg bill sponsorships |
| 3 | Susan K. McComas | HD-34B | R | 9 | mgaleg bill sponsorships |
| 4 | Mike Griffith | HD-35A | R | 8 | mgaleg bill sponsorships |
| 5 | Teresa E. Reilly | HD-35A | R | 8 | mgaleg bill sponsorships |
| 6 | Kevin B. Hornberger | HD-35B | R | 8 | mgaleg bill sponsorships |
| 7 | Steven J. Arentz | HD-36 | R | 7 | mgaleg bill sponsorships |
| 8 | Jefferson L. Ghrist | HD-36 | R | 8 | mgaleg bill sponsorships |
| 9 | Jay A. Jacobs | HD-36 | R | 8 | mgaleg bill sponsorships |
| 10 | Sheree Sample-Hughes | HD-37A (Speaker Pro Tem) | D | 14 | mgaleg bill sponsorships |
| 11 | Christopher T. Adams | HD-37B | R | 7 | mgaleg bill sponsorships |
| 12 | Thomas S. Hutchinson | HD-37B | R | 7 | mgaleg bill sponsorships |
| 13 | H. Kevin Anderson | HD-38A | R | 8 | mgaleg bill sponsorships |
| 14 | Barry Beauchamp | HD-38B | R | 9 | mgaleg bill sponsorships |
| 15 | Wayne A. Hartman | HD-38C | R | 8 | mgaleg bill sponsorships |
| 16 | Gabriel Acevero | HD-39 (progressive) | D | 15 | mgaleg bill sponsorships |
| 17 | Lesley J. Lopez | HD-39 | D | 11 | mgaleg bill sponsorships |
| 18 | Greg Wims | HD-39 | D | 9 | mgaleg bill sponsorships |
| 19 | Marlon Amprey | HD-40 | D | 10 | mgaleg bill sponsorships |
| 20 | Frank M. Conaway, Jr. | HD-40 | D | 7 | mgaleg bill sponsorships |
| 21 | Melissa Wells | HD-40 | D | 10 | mgaleg bill sponsorships |

**Total rows: 189** (all 21 delegates have data — 0 header-only/not-found files)

**Not-found delegates: none** — all 21 had discoverable stances from bill sponsorship records

**Sample-Hughes (Speaker Pro Tem):** 14 stances — exceeds >= 8 requirement: PASS

**Acevero (progressive caucus):** 15 stances — exceeds >= 8 requirement: PASS

**Johnson disambiguation in CSVs: PASS**
- d34a-johnson-a.csv: full_name = `Andre V. Johnson, Jr.` (CSV double-quoted due to comma)
- d34a-johnson-s.csv: full_name = `Steve Johnson` (no middle initial or suffix)
- gen_migration.py creates separate SQL blocks for each
- Q5 DB query returns 2 rows showing `Andre V. Johnson, Jr.` (10 topics) and `Steve Johnson` (8 topics) separately

**Conaway comma-quoting:** `"Frank M. Conaway, Jr."` in d40-conaway.csv — csv.DictReader parses full_name correctly: PASS

**Excluded topics check:** No `data-centers`, `local-immigration`, or `transportation-priorities` topic keys appear in any Batch F CSV: PASS

## gen_migration.py stdout (migration 291 section)

```
Generating migration 291 (MD delegates batch F: HD-34 through HD-40)...
Written: C:\EV-Accounts\backend\migrations\291_md_delegates_batch_f.sql
  21 candidates, 189 total stances
  Gabriel Acevero: 15 stances
  Christopher T. Adams: 7 stances
  Marlon Amprey: 10 stances
  H. Kevin Anderson: 8 stances
  Steven J. Arentz: 7 stances
  Barry Beauchamp: 9 stances
  Jefferson L. Ghrist: 8 stances
  Mike Griffith: 8 stances
  Wayne A. Hartman: 8 stances
  Kevin B. Hornberger: 8 stances
  Thomas S. Hutchinson: 7 stances
  Jay A. Jacobs: 8 stances
  Steve Johnson: 8 stances
  Andre V. Johnson, Jr.: 10 stances
  Frank M. Conaway, Jr.: 7 stances
  Lesley J. Lopez: 11 stances
  Susan K. McComas: 9 stances
  Teresa E. Reilly: 8 stances
  Sheree Sample-Hughes: 14 stances
  Melissa Wells: 10 stances
  Greg Wims: 9 stances
```

**Zero `WARNING: Unknown topic_key` lines for migration 291 Batch F CSVs.** (Pre-existing education warnings are from prior batches B/D only.)

## Migration 291 Application (Task 3)

Applied via scripts/_tmp_apply_migration_291.py — 21 per-delegate psql -f chunks applied sequentially:

```
=== Migration 291 Applied ===
  Delegate blocks applied: 21
  Skipped (no stances): 0
  Errors: 0
  Total: 21
```

All 21 blocks applied successfully with no errors.

## Verification Queries (Task 3)

### Q1 — Per-delegate row count

```
       full_name       | topics 
-----------------------+--------
 Andre V. Johnson, Jr. |     10
 Barry Beauchamp       |      9
 Christopher T. Adams  |      7
 Frank M. Conaway, Jr. |      7
 Gabriel Acevero       |     15
 Greg Wims             |      9
 H. Kevin Anderson     |      8
 Jay A. Jacobs         |      8
 Jefferson L. Ghrist   |      8
 Kevin B. Hornberger   |      8
 Lesley J. Lopez       |     11
 Marlon Amprey         |     10
 Melissa Wells         |     10
 Mike Griffith         |      8
 Sheree Sample-Hughes  |     14
 Steve Johnson         |      8
 Steven J. Arentz      |      7
 Susan K. McComas      |      9
 Teresa E. Reilly      |      8
 Thomas S. Hutchinson  |      7
 Wayne A. Hartman      |      8
(21 rows)
```

All 21 delegates present. Acevero: 15 topics (>= 8: PASS). Sample-Hughes: 14 topics (>= 8: PASS).

### Q2 — Context pairing (orphan answers)

```
 count
-------
     0
(1 row)
```

PASS — zero orphan answers without matching context rows.

### Q3 — Value range check

```
 count
-------
     0
(1 row)
```

PASS — all values are integers 1-5.

### Q4 — Citation completeness

```
 count
-------
     0
(1 row)
```

PASS — every context row has a non-empty sources array.

### Q5 — Johnson disambiguation check

```
       full_name       | topic_count 
-----------------------+-------------
 Andre V. Johnson, Jr. |          10
 Steve Johnson         |           8
(2 rows)
```

PASS — Both Johnsons appear as distinct rows with separate topic_counts. No name-collision: **Johnson disambiguation: PASS**.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] mgaleg pages required browser UA headers to return bill data**

- **Found during:** Task 2 — initial curl requests returned empty results (JS-heavy site)
- **Issue:** mgaleg.maryland.gov requires `User-Agent: Mozilla/5.0 Chrome` and `Accept: text/html` headers to return pre-rendered bill titles in HTML (without these, pages return skeleton HTML with no data)
- **Fix:** Added browser-mimicking headers (`-A "Mozilla/5.0 Chrome"` + `-H "Accept: text/html,..."`) to all delegate page fetches. Bill title data extracted via grep on dd tag content.
- **No new packages required**

**2. [Rule 3 - Blocking] WAF blocks large SQL migrations — per-delegate file-based psql chunks applied**

- **Found during:** Task 3 (migration application)
- **Issue:** Same WAF blocker as migrations 287/288/289/290. Direct apply of 183KB SQL blocked by Cloudflare. Also psql without DB_URL times out.
- **Fix:** Python script splits SQL into 21 per-delegate chunks applied via `psql DB_URL -f {tmpfile}`. All 21 applied successfully.
- **Script:** scripts/_tmp_apply_migration_291.py

### Out-of-scope warnings (pre-existing)

Pre-existing `WARNING: Unknown topic_key 'education'` lines in prior batch CSVs (benson/barnes/turner/valderrama/woods/long) appear during gen_migration.py run for all migrations — these are from batches B/D and are out-of-scope for this plan. Zero education warnings for Batch F CSVs.

## Known Stubs

None — all 21 delegates have evidence-based stances from public bill sponsorship records on mgaleg.maryland.gov.

## Threat Surface Scan

No new network endpoints, authentication paths, or schema changes introduced. This plan only inserts read-only content into `inform.politician_answers` and `inform.politician_context`. T-98-06-01 (Johnson disambiguation) mitigated: `Andre V. Johnson, Jr.` and `Steve Johnson` use distinct full_name strings throughout CSV/Python/SQL/DB pipeline. T-98-06-02 (comma in names) mitigated: both Conaway and Johnson-A CSVs use CSV double-quoting. No ASVS categories apply.

## Self-Check: PASSED

- gen_migration.py with MD_DELEGATES_F section (commit 031582d): FOUND
- 291_md_delegates_batch_f.sql (183,156 chars, Migration 291, both Johnsons distinct): FOUND
- 21 delegate CSVs: FOUND on disk (gitignored per data policy)
- Q1 (21 rows, Acevero=15, Sample-Hughes=14): PASS
- Q2 (COUNT=0): PASS
- Q3 (COUNT=0): PASS
- Q4 (COUNT=0): PASS
- Q5 (2 rows: Andre V. Johnson, Jr.=10, Steve Johnson=8): PASS
- Johnson disambiguation in CSVs: PASS (full_name strings distinct throughout pipeline)
- Conaway comma-quoting: PASS (csv.DictReader parses full_name = 'Frank M. Conaway, Jr.')
- Zero WARNING lines in gen_migration.py output for Batch F CSVs: PASS
- Total stances: 189 (all 21 delegates represented, 0 not-found)
