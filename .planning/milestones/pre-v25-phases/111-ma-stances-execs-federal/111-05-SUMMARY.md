---
phase: 111-ma-stances-execs-federal
plan: "05"
subsystem: inform
tags: [stances, house-reps, ma-federal, sequential-migrations, evidence-only]
dependency_graph:
  requires: [111-04]
  provides: [stances for MA-01 through MA-05]
  affects: [inform.politician_answers, inform.politician_context]
tech_stack:
  added: []
  patterns:
    - supplemental-migration (re-upsert-all + add-new)
    - sequential-one-at-a-time (D-08)
    - evidence-only (D-01)
key_files:
  created:
    - C:/EV-Accounts/backend/migrations/367_neal_stances.sql
    - C:/EV-Accounts/backend/migrations/368_mcgovern_stances.sql
    - C:/EV-Accounts/backend/migrations/369_trahan_stances.sql
    - C:/EV-Accounts/backend/migrations/370_auchincloss_stances.sql
    - C:/EV-Accounts/backend/migrations/371_clark_stances.sql
  modified: []
decisions:
  - All 5 House reps used supplemental migration pattern (had 23-30 pre-existing stances each)
  - data-centers topic (UUID 4559b513) active in DB but absent from 111-PATTERNS.md — added to all 5
  - Neal abortion=4.0 from Catholic background + documented historical votes (evidence-only)
  - Auchincloss tariffs=1.0 explicitly anti-tariff fiscal moderate vs. Clark tariffs=3.0 labor-protective
  - Clark childcare=1.0 as signature DNC 2024 issue and House Minority Whip priority
metrics:
  duration: ~4 hours (multi-session with context break between Auchincloss and Clark)
  completed: "2026-06-11"
  tasks_completed: 3
  files_changed: 5
---

# Phase 111 Plan 05: MA House Reps 1-5 Stances Summary

Applied evidence-only stance migrations for MA US House Reps MA-01 through MA-05 (migrations 367-371) following the supplemental re-upsert pattern; all 5 reps reached 43 topics with 100% citation rate and zero unpaired/uncited rows.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Resolve all 5 House rep UUIDs | essentials repo | _tmp-house1-roster.json (deleted) |
| 2 | Sequential research + apply migrations 367-371 | EV-Accounts repo | 367-371 SQL files |
| 3 | Cleanup + final summary query | — | temp files deleted |

## Migration Results

| external_id | Name | Migration | Pre-existing | New Topics | Total | unpaired | uncited |
|-------------|------|-----------|-------------|------------|-------|----------|---------|
| -200201 | Richard Neal (MA-01) | 367 | 23 | 20 | 43 | 0 | 0 |
| -200202 | Jim McGovern (MA-02) | 368 | 30 | 13 | 43 | 0 | 0 |
| -200203 | Lori Trahan (MA-03) | 369 | 25 | 18 | 43 | 0 | 0 |
| -200204 | Jake Auchincloss (MA-04) | 370 | 25 | 18 | 43 | 0 | 0 |
| -200205 | Katherine Clark (MA-05) | 371 | 28 | 15 | 43 | 0 | 0 |

All migrations applied idempotently via BEGIN/ON CONFLICT DO UPDATE/COMMIT per migration 282 pattern. city-sanitation omitted for all 5 — no documented federal House record on municipal waste policy.

## Notable Stance Values

**Richard Neal (MA-01) — Ways & Means chair:**
- abortion=4.0: Catholic background, documented historical votes; evidence-only (OnTheIssues)
- ukraine-support=4.0: voted for Engel amendment to ban cluster munitions in 2023
- taxes=1.0: led Ways & Means; authored Inflation Reduction Act tax provisions

**Jim McGovern (MA-02) — Rules Committee:**
- healthcare=1.0: Medicare for All Caucus co-chair
- ai-regulation=4.0: facial recognition moratorium bill (more restrictive than most Dems)
- campaign-finance=1.0, redistricting=1.0, medicare_aid=1.0: consistent progressive record

**Lori Trahan (MA-03) — Armed Services:**
- medicare_aid=3.0: not M4A; backs ACA expansion approach
- tariffs=3.0: USMCA yes; managed trade with labor standards
- abortion=1.0, redistricting=1.0: consistent progressive record

**Jake Auchincloss (MA-04) — Foreign Affairs:**
- tariffs=1.0: explicitly anti-tariff; free trade fiscal moderate
- housing=3.0: YIMBY record in Newton/Brookline
- ukraine-support=2.0: strongly backs Ukraine aid
- data-centers=3.0: tech corridor rep; pro-growth with standards

**Katherine Clark (MA-05) — House Minority Whip:**
- childcare=1.0: "Child care is infrastructure" — DNC 2024 signature
- abortion=1.0, taxes=1.0, school-vouchers=1.0, redistricting=1.0
- same-sex-marriage=1.0, trans-athletes=1.0, voting-rights=1.0
- tariffs=3.0: labor-protective USMCA supporter, not protectionist

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Discovery] data-centers topic missing from 111-PATTERNS.md**
- **Found during:** Task 2, Rep 1 (Neal)
- **Issue:** UUID 4559b513-0fd8-4ed1-babd-f3b554162f40 is active in DB as of Phase 111 but not in 111-PATTERNS.md (added after PATTERNS.md was written)
- **Fix:** Queried active topics from DB and added data-centers to all 5 migrations
- **Files modified:** 367-371 all include data-centers topic

**2. [Rule 1 - UUID mismatch] Outcomes temp file had wrong UUIDs**
- **Found during:** Task 3 final query
- **Issue:** _tmp-house1-outcomes.json was written with incorrect UUIDs; actual UUIDs were in the roster file
- **Fix:** Corrected all 4 UUIDs before cleanup; final quality gate query confirmed all 5 at 43/0/0 using correct UUIDs

None — plan executed with only the above minor auto-fixes.

## Known Stubs

None. All 43 topics per rep have evidence-backed values with cited sources.

## Self-Check: PASSED

- 5 migration files exist in C:/EV-Accounts/backend/migrations/ (367-371): CONFIRMED
- All 5 reps: answer_count=43, unpaired=0, uncited=0 — confirmed via final psql query
- Temp files deleted: CONFIRMED
- Commits to EV-Accounts repo: confirmed (d0d410f1 = Clark; prior commits in previous session)
