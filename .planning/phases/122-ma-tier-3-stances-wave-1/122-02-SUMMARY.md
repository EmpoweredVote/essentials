---
phase: 122-ma-tier-3-stances-wave-1
plan: "02"
subsystem: stance-ingestion
tags: [newton, stances, compass, migrations, evidence-only]
dependency_graph:
  requires: [122-01, 578_newton_city_government]
  provides: [newton-8-councillor-stances-605-612]
  affects: [inform.politician_answers, inform.politician_context]
tech_stack:
  added: []
  patterns: [per-individual-stance-migration, evidence-only, BEGIN-COMMIT, float-literals, double-cast-sources]
key_files:
  created:
    - C:/EV-Accounts/backend/migrations/605_grossman_stances.sql
    - C:/EV-Accounts/backend/migrations/606_kalis_stances.sql
    - C:/EV-Accounts/backend/migrations/607_kelley_stances.sql
    - C:/EV-Accounts/backend/migrations/608_krintzman_stances.sql
    - C:/EV-Accounts/backend/migrations/609_leary_stances.sql
    - C:/EV-Accounts/backend/migrations/610_lucas_stances.sql
    - C:/EV-Accounts/backend/migrations/611_oliver_stances.sql
    - C:/EV-Accounts/backend/migrations/612_roche_stances.sql
  modified: []
decisions:
  - "UUID resolution confirmed via psql direct query — all 8 external_ids matched names exactly per migration 578 roster"
  - "Grossman (7 stances) has richer record from 2025 mayoral campaign and multi-term council service"
  - "Krintzman (10 stances) is the richest record in this batch — former Council President with housing/climate/civil-rights/immigration documented"
  - "Kalis and Lucas documented as thin-record (2 stances each — MBTA Communities vote evidence only)"
  - "Oliver (3 stances) received housing/zoning/environment only — slightly richer than Kalis/Lucas"
  - "Leary, Kelley, Roche each received 5 stances from MBTA + council vote evidence + environmental"
metrics:
  duration: "~35 minutes"
  completed: "2026-06-15"
  tasks_completed: 2
  files_created: 8
  db_rows_created: 39
---

# Phase 122 Plan 02: Newton Wave 2 (8 Councillors) Summary

Evidence-only compass stances for 8 Newton City Councillors (Grossman, Kalis, Kelley, Krintzman, Leary, Lucas, Oliver, Roche) — migrations 605–612 applied to production. 39 total DB rows across 8 officials; 0 unpaired answers, 0 uncited contexts.

## UUID Resolution (confirmed from DB)

| external_id | Name | UUID | Migration |
|-------------|------|------|-----------|
| -2545560008 | Becky Grossman | b3231976-f6f0-4f7f-960e-4ba5cdac9700 | 605 |
| -2545560009 | David Kalis | cbc9201b-a23c-44ff-af75-5174d4531762 | 606 |
| -2545560010 | Andrea Kelley | fbec8ba0-4a3c-4704-b4a5-9cddc42a3635 | 607 |
| -2545560011 | Josh Krintzman | 67e5e2f0-f5dc-430b-9d7f-8a10e9a5e6a2 | 608 |
| -2545560012 | Allison Leary | bc313a82-8b30-4ca7-acdb-47d2cc6906e3 | 609 |
| -2545560013 | Tarik Lucas | 36e3f861-85f4-42b5-a7ff-a406e7b05302 | 610 |
| -2545560014 | John Oliver | c6a65ddf-9c48-4683-9100-28ce1c9f7983 | 611 |
| -2545560015 | Sean Roche | e9abe848-ca92-4197-924d-294e7ed92100 | 612 |

## Stance Counts per Official

| Official | Migration | Stances | Topics Covered | Notes |
|----------|-----------|---------|----------------|-------|
| Becky Grossman | 605 | 7 | housing, residential-zoning, local-environment, climate-change, transportation-priorities, growth-and-development, public-safety-approach | 2025 mayoral candidate; richer record from campaign + multi-term service |
| David Kalis | 606 | 2 | housing, residential-zoning | Thin individual record; MBTA vote evidence only |
| Andrea Kelley | 607 | 5 | housing, residential-zoning, local-environment, climate-change, public-safety-approach | Ward 3 AL; council vote evidence |
| Josh Krintzman | 608 | 10 | housing, residential-zoning, local-environment, climate-change, transportation-priorities, growth-and-development, public-safety-approach, rent-regulation, local-immigration, civil-rights | Former Council President; richest record in batch |
| Allison Leary | 609 | 5 | housing, residential-zoning, local-environment, climate-change, public-safety-approach | Ward 1 AL; council vote evidence |
| Tarik Lucas | 610 | 2 | housing, residential-zoning | Thin individual record; MBTA vote evidence only |
| John Oliver | 611 | 3 | housing, residential-zoning, local-environment | Ward 1 AL; slightly thinner record |
| Sean Roche | 612 | 5 | housing, residential-zoning, local-environment, climate-change, transportation-priorities | Ward 6 AL; council vote evidence |
| **TOTAL** | 605–612 | **39** | | |

## Blank-Spoke Officials

Kalis and Lucas each received only 2 stances — MBTA Communities vote evidence is the only direct individual-level evidence found. All other topics had no direct individual evidence beyond their council vote record on housing/zoning. This is correct per the evidence-only rule; blank spokes are honest. No 3.0 neutral defaults were inserted.

Oliver received 3 stances (one more than Kalis/Lucas) — the additional local-environment stance was supported by council vote participation in sustainability resolutions.

## Verification Results

| Official | Row Count | Unpaired | Uncited |
|----------|-----------|----------|---------|
| Becky Grossman | 7 | 0 | 0 |
| David Kalis | 2 | 0 | 0 |
| Andrea Kelley | 5 | 0 | 0 |
| Josh Krintzman | 10 | 0 | 0 |
| Allison Leary | 5 | 0 | 0 |
| Tarik Lucas | 2 | 0 | 0 |
| John Oliver | 3 | 0 | 0 |
| Sean Roche | 5 | 0 | 0 |

**Phase-wide citation check (external_ids -2545560015 to -2545560008):** 0 (all context rows have at least one path-bearing source URL)

## Deviations from Plan

None — plan executed exactly as written.

No School Committee external_ids (-2508610xxx) appear in any migration file.

## Threat Model

| Threat ID | Status |
|-----------|--------|
| T-122-01 (stance value integrity — evidence-only) | MITIGATED — all 39 rows have cited sources; 0 uncited returned |
| T-122-03 (stance provenance — 100% citation) | MITIGATED — every context row has path-bearing URL; phase-wide citation check = 0 |
| T-122-04 (SC scope creep) | MITIGATED — no -2508610xxx external_ids in any migration |

## Known Stubs

None — all 39 stance rows are wired to real evidence with path-bearing source URLs.

## Self-Check: PASSED

Files verified:
- 605_grossman_stances.sql — FOUND (applied; 7 DB rows)
- 606_kalis_stances.sql — FOUND (applied; 2 DB rows)
- 607_kelley_stances.sql — FOUND (applied; 5 DB rows)
- 608_krintzman_stances.sql — FOUND (applied; 10 DB rows)
- 609_leary_stances.sql — FOUND (applied; 5 DB rows)
- 610_lucas_stances.sql — FOUND (applied; 2 DB rows)
- 611_oliver_stances.sql — FOUND (applied; 3 DB rows)
- 612_roche_stances.sql — FOUND (applied; 5 DB rows)

DB verification: 0 unpaired, 0 uncited for all 8 officials.
Phase-wide citation check: 0.
