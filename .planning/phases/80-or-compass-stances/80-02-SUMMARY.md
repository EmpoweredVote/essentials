---
phase: 80-or-compass-stances
plan: 02
subsystem: database
tags: [compass, stances, oregon, house-representatives, csv, typescript]

requires:
  - phase: 80-or-compass-stances
    plan: 01
    provides: established apply script pattern with inline politician_context writes

provides:
  - 24 compass stances for Suzanne Bonamici (CD-1) in inform.politician_answers
  - 21 compass stances for Cliff Bentz (CD-2) in inform.politician_answers
  - 12 compass stances for Maxine Dexter (CD-3) in inform.politician_answers
  - 20 compass stances for Val Hoyle (CD-4) in inform.politician_answers
  - 13 compass stances for Janelle Bynum (CD-5) in inform.politician_answers
  - 18 compass stances for Andrea Salinas (CD-6) in inform.politician_answers
  - Citation rows in inform.politician_context for every stance (D-06 compliance)
  - 6 CSV files in C:/EV-Accounts/backend/data/stance-research/
  - 6 apply scripts in C:/EV-Accounts/backend/scripts/

affects: [80-or-compass-stances, compass-stances, or-officials, or-federal]

tech-stack:
  added: []
  patterns:
    - "apply script integration: write politician_context inline with politician_answers (pattern from Plan 01)"
    - "politician_context schema: reasoning (text) + sources (text[]) with ON CONFLICT DO UPDATE"
    - "politician_answers PK is (politician_id, topic_id) — no id column"

key-files:
  created:
    - C:/EV-Accounts/backend/data/stance-research/2026-05-30-suzanne-bonamici.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-30-cliff-bentz.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-30-maxine-dexter.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-30-val-hoyle.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-30-janelle-bynum.csv
    - C:/EV-Accounts/backend/data/stance-research/2026-05-30-andrea-salinas.csv
    - C:/EV-Accounts/backend/scripts/apply-suzanne-bonamici-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-cliff-bentz-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-maxine-dexter-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-val-hoyle-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-janelle-bynum-stances.ts
    - C:/EV-Accounts/backend/scripts/apply-andrea-salinas-stances.ts
  modified: []

key-decisions:
  - "All 6 apply scripts use parseInt(r.value) with no inversion (D-07 compliance)"
  - "politician_context written inline in apply loop (same pattern established in Plan 01)"
  - "Dexter/Bynum: combined federal House votes (first term) with OR state legislative record for topic coverage"

requirements-completed: [SC-1, SC-3]

duration: 25min
completed: 2026-05-31
---

# Phase 80 Plan 02: OR US House Representatives Compass Stances Summary

**108 evidence-cited compass stances ingested for all 6 Oregon US House Representatives via sequential research+apply runs; Bentz conservative lean confirmed (min=3, max=5, avg=4.29)**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-05-31
- **Completed:** 2026-05-31
- **Tasks:** 6 (Tasks 1-6, sequential per D-05)
- **Files modified:** 12 (6 CSVs + 6 apply scripts in C:/EV-Accounts/backend/)

## Accomplishments

- All 6 OR US House reps now have compass stances in `inform.politician_answers`
- Bonamici: 24 stances (target ≥10); Bentz: 21 (target ≥8); Dexter: 12 (target ≥5); Hoyle: 20 (target ≥8); Bynum: 13 (target ≥5); Salinas: 18 (target ≥5)
- Every stance row has a matching citation in `inform.politician_context` (reasoning + sources array)
- All 6 apply scripts use `parseInt(r.value)` with no inversion (D-07 compliance)
- All research agents ran ONE AT A TIME — no parallel execution (D-05 compliance, SC-3)
- Bentz (R, CD-2) scale sanity confirmed: min=3, max=5, avg=4.29 — conservative lean observable

## CSV Files Written

| File | Rows | Politician | Party | District |
|------|------|-----------|-------|---------|
| 2026-05-30-suzanne-bonamici.csv | 24 | Suzanne Bonamici (ext -4102001) | D | CD-1 |
| 2026-05-30-cliff-bentz.csv | 21 | Cliff Bentz (ext -4102002) | R | CD-2 |
| 2026-05-30-maxine-dexter.csv | 12 | Maxine Dexter (ext -4102003) | D | CD-3 |
| 2026-05-30-val-hoyle.csv | 20 | Val Hoyle (ext -4102004) | D | CD-4 |
| 2026-05-30-janelle-bynum.csv | 13 | Janelle Bynum (ext -4102005) | D | CD-5 |
| 2026-05-30-andrea-salinas.csv | 18 | Andrea Salinas (ext -4102006) | D | CD-6 |

**Total rows ingested: 108**

## Apply Scripts Written

| Script | csvPath | parseInt(r.value) | Inversion |
|--------|---------|-------------------|-----------|
| apply-suzanne-bonamici-stances.ts | 2026-05-30-suzanne-bonamici.csv | YES | NONE |
| apply-cliff-bentz-stances.ts | 2026-05-30-cliff-bentz.csv | YES | NONE |
| apply-maxine-dexter-stances.ts | 2026-05-30-maxine-dexter.csv | YES | NONE |
| apply-val-hoyle-stances.ts | 2026-05-30-val-hoyle.csv | YES | NONE |
| apply-janelle-bynum-stances.ts | 2026-05-30-janelle-bynum.csv | YES | NONE |
| apply-andrea-salinas-stances.ts | 2026-05-30-andrea-salinas.csv | YES | NONE |

## Top Evidence Sources Used

| Official | Top 3 Sources |
|----------|--------------|
| Suzanne Bonamici | clerk.house.gov vote records, bonamici.house.gov press releases, Congress.gov bill sponsorships |
| Cliff Bentz | clerk.house.gov vote records, bentz.house.gov issue pages, ballotpedia.org |
| Maxine Dexter | ballotpedia.org/Maxine_Dexter, OR legislature vote records (HB 2002/SB 9), dexter.house.gov |
| Val Hoyle | clerk.house.gov vote records, hoyle.house.gov issue pages, boli.oregon.gov (Labor Commissioner archive) |
| Janelle Bynum | ballotpedia.org/Janelle_Bynum, OR legislature vote records (HB 2003/SB 9), bynum.house.gov |
| Andrea Salinas | clerk.house.gov vote records, salinas.house.gov issue pages, ballotpedia.org/Andrea_Salinas |

## Per-Wave SQL Gate Result

```sql
SELECT p.full_name, COUNT(pa.politician_id) AS stance_count
FROM essentials.politicians p
LEFT JOIN inform.politician_answers pa ON pa.politician_id = p.id
WHERE p.external_id BETWEEN -4102006 AND -4102001
GROUP BY p.full_name
ORDER BY p.full_name;
```

Results:
- Andrea Salinas: 18 stances
- Cliff Bentz: 21 stances
- Janelle Bynum: 13 stances
- Maxine Dexter: 12 stances
- Suzanne Bonamici: 24 stances
- Val Hoyle: 20 stances

**All 6 rows with stance_count > 0. Bonamici ≥10 (24), Hoyle ≥8 (20), Bentz ≥8 (21) — all targets met.**

## Bentz Sanity Check (Conservative Scale Orientation)

```sql
SELECT MIN(value), MAX(value), AVG(value) FROM inform.politician_answers WHERE politician_id = 'fb00c887-11f5-46f2-b822-f9848368bbd2';
```

Result: `min=3.0, max=5.0, avg=4.29`

Scale orientation confirmed: Bentz (R) shows conservative lean with all values ≥3. Value scale is NOT inverted.

## Citation Coverage Verification

| Official | Answers | Contexts | Match |
|----------|---------|----------|-------|
| Andrea Salinas | 18 | 18 | OK |
| Cliff Bentz | 21 | 21 | OK |
| Janelle Bynum | 13 | 13 | OK |
| Maxine Dexter | 12 | 12 | OK |
| Suzanne Bonamici | 24 | 24 | OK |
| Val Hoyle | 20 | 20 | OK |

All 108 answer rows have matching politician_context citation rows. D-06 compliance: 100%.

## D-05 Compliance (One-At-A-Time)

Research and apply ran sequentially:
1. Task 1 (Bonamici) — completed before Task 2 started
2. Task 2 (Bentz) — completed before Task 3 started
3. Task 3 (Dexter) — completed before Task 4 started
4. Task 4 (Hoyle) — completed before Task 5 started
5. Task 5 (Bynum) — completed before Task 6 started
6. Task 6 (Salinas) — completed last

No parallel research agents were used. SC-3 compliance confirmed.

## Nyquist Spot-Check (Val Hoyle)

Val Hoyle (80-VALIDATION.md Nyquist target): 20 stances — exceeds ≥8 target. Value range 1-2 (progressive Democrat confirmed). All 20 answer rows have matching context rows.

## Deviations from Plan

None — plan executed exactly as written. The apply script pattern with inline politician_context writes was already established in Plan 01 and used directly here.

Note: per-wave SQL gate in plan used `COUNT(pa.id)` which is incorrect (politician_answers has no id column). Used `COUNT(pa.politician_id)` as established in Plan 01.

## Task Commits

Tasks 1-6 artifacts are in C:/EV-Accounts/backend (not git-tracked in essentials repo per project constraint: C:/EV-Accounts is not a git repo). The SUMMARY.md commit serves as the per-wave artifact commit.

## Self-Check: PASSED

- All 6 CSV files exist in C:/EV-Accounts/backend/data/stance-research/
- All 6 apply scripts exist in C:/EV-Accounts/backend/scripts/
- All 6 reps have stance_count > 0 in inform.politician_answers (per-wave SQL gate passed)
- Every answer row has matching politician_context row (100% coverage)
- Bentz has all values ≥3 (conservative scale orientation confirmed)
- D-05: sequential execution confirmed, no parallel runs

## Next Phase Readiness

- Plan 03 (Portland council + Mayor + Auditor — 13 people) ready to begin
- The apply script pattern with inline politician_context writes is confirmed working across Plans 01 and 02
- Note: use `COUNT(pa.politician_id)` not `COUNT(pa.id)` in all verification SQL

---
*Phase: 80-or-compass-stances*
*Completed: 2026-05-31*
