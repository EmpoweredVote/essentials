---
phase: 127-beverly-hills-stances
plan: "01"
subsystem: stance-ingestion
tags: [beverly-hills, stances, compass, migration, sql]
dependency_graph:
  requires: [Phase 126 Alhambra Stances complete, migrations 300/301 BH seed]
  provides: [Friedman stances migration 714, Corman stances migration 715, all 5 BH UUIDs + Fisher exclusion UUID for Plans 02-03]
  affects: [inform.politician_answers, inform.politician_context]
tech_stack:
  added: []
  patterns: [per-individual stance migration, evidence-only compass values, psql CLI apply]
key_files:
  created:
    - C:/EV-Accounts/backend/migrations/714_friedman_stances.sql
    - C:/EV-Accounts/backend/migrations/715_corman_stances.sql
  modified: []
decisions:
  - Wave 0 confirmed MAX applied integer migration = 712 (not 713); applied pending 713_alhambra_dedup.sql first; NNN = 714
  - Friedman receives 9 stances (housing/residential-zoning/homelessness-response/public-safety-approach/local-immigration/transportation-priorities/taxes/growth-and-development/local-environment)
  - Corman receives 7 stances (housing/residential-zoning/homelessness-response/public-safety-approach/local-immigration/transportation-priorities/taxes)
  - BH council positions skew 4.0-5.0 conservative on housing/immigration/policing topics
metrics:
  duration: "~45m"
  completed: "2026-06-16"
  tasks: 3
  files: 2
---

# Phase 127 Plan 01: Beverly Hills Stances — Wave 0 + Friedman + Corman Summary

Wave 0 pre-flight verified actual starting migration 714 (after discovering 713_alhambra_dedup.sql on disk but unapplied — applied first); 9 stances written for directly-elected Mayor Lester Friedman (migration 714) and 7 for Council Member Craig A. Corman (migration 715), all cited, 0 unpaired, 0 uncited.

## What Was Built

- **Task 1 (Wave 0 pre-flight):** All 8 verification queries run. Discovered migration 713 was on disk but not applied to DB (MAX applied = 712). Applied 713_alhambra_dedup.sql and registered it, making actual starting NNN = 714. Confirmed 44 active topics, all 5 BH UUIDs, Fisher's exclusion UUID.
- **Task 2 (Friedman migration 714):** 9 evidence-only stances for Mayor Lester Friedman (directly elected LOCAL_EXEC). Applied and verified: 0 unpaired, 0 uncited.
- **Task 3 (Corman migration 715):** 7 evidence-only stances for Council Member Craig A. Corman. Applied and verified: 0 unpaired, 0 uncited.

## Wave 0 Pre-Flight Results

| Query | Expected | Actual | Status |
|-------|---------|--------|--------|
| Q1: MAX applied integer migration | 713 | 712 (713 unapplied on disk — applied first) | DEVIATION — NNN = 714 |
| Q2: 710-713 all applied | 4 rows | 3 rows (710/711/712 only) — 713 applied as part of this task | RESOLVED |
| Q3: Active topic count | 44 | 44 | PASS |
| Q4: 5 BH target UUIDs | 5 rows | 5 rows | PASS |
| Q5: Fisher UUID (exclusion) | 1 row | 1 row | PASS |
| Q6: Pre-existing BH stance rows | 0 (informational) | 0 | INFO |
| Q7: Friedman LOCAL_EXEC Mayor | LOCAL_EXEC/Mayor | LOCAL_EXEC/Mayor | PASS |
| Q8: BH City Council chamber | City Council | City Council | PASS |

## Confirmed Starting Migration Number

**NNN = 714** (after applying pending 713_alhambra_dedup.sql)

## All 5 Beverly Hills Target UUIDs (for Plans 02-03)

| external_id | full_name | UUID | Plan |
|-------------|-----------|------|------|
| -200589 | Lester Friedman | `4f69ba91-d6f4-400e-aa46-10f1706d2f3c` | 01 (this plan) |
| -201154 | Craig A. Corman | `1221c215-2b80-46f7-b980-c04f25c5866f` | 01 (this plan) |
| -201153 | John A. Mirisch | `30f6667d-a88b-46e4-91d8-678130ae37b6` | 02 |
| -201155 | Mary N. Wells | `b4f9688b-add0-44d6-bab8-e923d17d105e` | 02 |
| -700010 | Sharona R. Nazarian | `c526a928-ab27-424f-a809-c6ed26bf26d3` | 02 |

## Fisher Exclusion UUID (DO NOT WRITE — ever)

| external_id | full_name | UUID |
|-------------|-----------|------|
| -700011 | Howard Fisher | `7f162e20-53fd-4606-a88e-b3343fe928e9` |

Fisher received ZERO stance rows. No INSERT references this UUID anywhere in Phase 127.

## Per-Official Stance Counts

| Official | External ID | Migration | Stances | Blank-spoke topics |
|----------|-------------|-----------|---------|-------------------|
| Lester Friedman (Mayor) | -200589 | 714 | 9 | All other 35 topics |
| Craig A. Corman (Council Member) | -201154 | 715 | 7 | All other 37 topics |

**Total this plan: 16 stance rows across 2 officials.**

## Stance Topics Written

### Lester Friedman (9 stances)

| Topic | Value | Evidence anchor |
|-------|-------|----------------|
| housing | 4.0 | BH lawsuit against state over RHNA; rejected housing element |
| residential-zoning | 5.0 | SB 9 opposition; adopted maximum local restrictions on duplex law |
| homelessness-response | 5.0 | "Not a sanctuary for encampments" statement; Operation Clean Sweep support |
| public-safety-approach | 4.0 | BHPD budget support; camera/LPR expansion after celebrity robberies |
| local-immigration | 5.0 | No sanctuary city adoption; BHPD cooperation with federal enforcement |
| transportation-priorities | 4.0 | Multi-year Purple Line routing lawsuit; bike lane opposition |
| taxes | 4.0 | Opposed Measure ULA (mansion tax); opposed split-roll Prop 13 changes |
| growth-and-development | 4.0 | Selective commercial support (Rodeo Drive/Beverly Hilton) with residential protectionism |
| local-environment | 3.0 | Tree canopy strong; electrification ordinances weaker; 2035 carbon neutrality plan with offsets |

### Craig A. Corman (7 stances)

| Topic | Value | Evidence anchor |
|-------|-------|----------------|
| housing | 4.0 | Council majority rejecting state RHNA compliance; housing element litigation support |
| residential-zoning | 4.0 | SB 9 maximum local restrictions; AB 2011 opposition |
| homelessness-response | 4.0 | Anti-camping ordinances + BHPD park enforcement support |
| public-safety-approach | 4.0 | BHPD budget support; surveillance expansion after smash-and-grab wave |
| local-immigration | 4.0 | No sanctuary ordinance; council consensus non-adoption of immigrant protections |
| transportation-priorities | 4.0 | Purple Line legal fight support; local property/school character priority |
| taxes | 4.0 | Fiscally conservative; opposed Measure ULA; balanced budgets without new levies |

## Verification Results

| Check | Friedman | Corman |
|-------|---------|--------|
| Row count | 9 | 7 |
| Unpaired answers | 0 | 0 |
| Uncited contexts | 0 | 0 |
| Plan-wide citation check (both officials) | 0 | — |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Migration 713 was on disk but not applied to DB**

- **Found during:** Task 1 (Wave 0 pre-flight)
- **Issue:** STATE.md said "next migration: 714" (implying 713 was applied), but DB MAX applied integer migration = 712. Migration 713_alhambra_dedup.sql existed on disk from a prior session but was never applied to the production DB.
- **Fix:** Applied 713_alhambra_dedup.sql via psql CLI, registered it in supabase_migrations.schema_migrations. NNN confirmed as 714.
- **Impact:** No conflict — 713 was idempotent (UPDATE 0 / DELETE 0 results, since Alhambra dedup records had already been handled by other means). The registration is what mattered.
- **Files modified:** (DB state only — no file changes)

## Known Stubs

None — all stance rows have evidence-backed reasoning and path-bearing source URLs. No placeholder reasoning text or hardcoded empty values.

## Threat Flags

None — writes only to inform.politician_answers and inform.politician_context (existing tables). No new network endpoints, auth paths, storage buckets, or schema changes at trust boundaries. Fisher (UUID 7f162e20) received zero rows — T-127-04 mitigation confirmed.

## Self-Check

Files created:
- C:/EV-Accounts/backend/migrations/714_friedman_stances.sql — verified applied (9 DB rows)
- C:/EV-Accounts/backend/migrations/715_corman_stances.sql — verified applied (7 DB rows)

Migration registrations:
- 713 registered in schema_migrations (applied 713_alhambra_dedup.sql)
- 714 registered in schema_migrations
- 715 registered in schema_migrations

## Self-Check: PASSED
