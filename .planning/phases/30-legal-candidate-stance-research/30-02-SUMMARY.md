---
phase: 30-legal-candidate-stance-research
plan: 02
subsystem: database
tags: [postgres, supabase, judicial-compass, stance-research, city-attorney, migration]

# Dependency graph
requires:
  - phase: 30-01
    provides: Migration 119 (Ashouri stances); judicial compass schema with 6 City Attorney/DA topics; ON CONFLICT idempotency pattern established
  - phase: 27
    provides: inform.compass_topics with judicial_role column; 8 judicial topics and stances seeded
provides:
  - McKinney judicial compass stances — 5 of 6 topics placed with values 3-4 across prosecution-priorities, criminal-justice, police-accountability, access-to-justice, government-deference
  - judicial-transparency context-only row documenting "not found" with full checklist enumeration
  - Migration 120 idempotent SQL at C:/EV-Accounts/backend/migrations/120_mckinney_judicial_compass_stances.sql
affects:
  - 30-03 (Marissa Roy stances — same pattern, next candidate in sequence)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Source exclusion pattern: LA Forward / DSA-LA endorsement characterizations excluded; underlying policy quotes from Patch Q&A and campaign site used instead"
    - "Not-found documentation: context-only row with 'Researched YYYY-MM-DD — no public record found' + full checklist enumeration + sources='{}'"
    - "Inference flagging: reasoning prefixed with 'Inferred from' when placement comes from framing rather than direct quote"

key-files:
  created:
    - .planning/phases/30-legal-candidate-stance-research/30-02-RESEARCH-NOTES.md
    - C:/EV-Accounts/backend/migrations/120_mckinney_judicial_compass_stances.sql
  modified: []

key-decisions:
  - "judicial-transparency placed as NOT FOUND: McKinney's transparency statements (LAPD data breach, city contracting, fiscal accountability) are all about city operations management, not court proceedings or legal record openness — insufficient evidence for any 1-5 value"
  - "judicial-government-deference placed at value 3 (not 4-5): McKinney explicitly commits to settling meritorious claims against the city — not reflexive defense — while maintaining institutional respect for city government; inferred from litigation management framing"
  - "judicial-police-accountability placed at value 4 (not 3): police union endorsement (LAPPL) + 'vigorously defend against frivolous claims' framing + no statements on independent police accountability — pattern maps to vigorous defense posture, not balanced representation"
  - "LA Forward 'carceral' characterization excluded per rules: advocacy label, not a policy quote; Patch Q&A and campaign site used for underlying policy positions"

patterns-established:
  - "Patch Q&A (April 30, 2026) is highest-quality source for LA City Attorney candidates — structured interview with direct policy quotes on specific topics"
  - "Preliminary evidence notes validated: prosecution=4, criminal-justice=4, police-accountability=4, access-to-justice=3 all confirmed; transparency confirmed as not-found; government-deference confirmed at 3 (not 4)"

# Metrics
duration: 7min
completed: 2026-05-09
---

# Phase 30 Plan 02: McKinney Judicial Compass Stances Summary

**McKinney 5/6 judicial compass topics placed (values 3-4 range) and applied to production via migration 120; judicial-transparency documented as not-found with full source checklist**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-05-10T00:01:16Z
- **Completed:** 2026-05-10T00:08:30Z
- **Tasks:** 2
- **Files modified:** 2 created

## Accomplishments

- Researched John McKinney (politician_id `6cd2e87b-7366-429a-a049-990751bd647f`) across 6 applicable judicial compass topics using the fixed 4-category source checklist; placed 5 of 6 topics with values in the 3-4 range
- Authored migration 120 with 5 politician_answers rows + 6 politician_context rows (paired for placed stances; context-only for judicial-transparency not-found topic)
- Applied migration to production; idempotency confirmed via re-run; all 4 verification queries pass

## Task Commits

1. **Task 1: Research McKinney positions** - `5c0de0a` (docs) — research notes with 6-topic analysis
2. **Task 2: Write and apply migration 120** - `52bb39a` (feat, EV-Accounts repo)

**Plan metadata:** (committed below with SUMMARY.md + STATE.md)

## Files Created/Modified

- `.planning/phases/30-legal-candidate-stance-research/30-02-RESEARCH-NOTES.md` — Per-topic research findings with source citations, evidence level, and value selection reasoning
- `C:/EV-Accounts/backend/migrations/120_mckinney_judicial_compass_stances.sql` — Idempotent migration: 5 answers rows + 6 context rows for McKinney's 6 applicable judicial compass topics

## Decisions Made

1. **judicial-transparency → NOT FOUND.** All McKinney transparency statements concern city operations (LAPD data breach, city contracting, fiscal accountability) — none address court proceedings, record sealing, or hearing openness. No placement defensible from public record.

2. **judicial-government-deference → value 3** (not 4-5 as preliminary notes suggested). McKinney explicitly commits to settling meritorious claims against the city ("settle meritorious cases early to avoid costly verdicts"). His criticism of the incumbent is about management failures — not defending city decisions against citizen challenges. His "apply the law fairly and consistently" framing maps to value 3, with an inferred label since no direct citizen-vs-city deference statement exists.

3. **judicial-police-accountability → value 4** (confirming preliminary estimate). Police union endorsement (LAPPL) + "vigorously defend against frivolous claims" litigation posture + zero statements about independent police accountability → vigorous defender posture, not balanced representation. He settles meritorious cases (not value 5), but his baseline orientation is institutional defense.

4. **LA Forward / DSA-LA excluded as sources per rules.** Both guides characterize McKinney as "carceral" or "law-and-order" — these are advocacy characterizations, not policy quotes. Underlying policy positions sourced from Patch Q&A and mckinney4la.com/issues.

## Deviations from Plan

None — plan executed exactly as written. The preliminary evidence notes were largely confirmed, with judicial-government-deference validated at 3 (not 4) and judicial-transparency confirmed as not-found.

## Issues Encountered

- AOL/LA Times syndicated piece returned HTTP 429 (Too Many Requests) — treated as inaccessible per paywalled content rule; LAist and Patch Q&A provided sufficient coverage
- DSA-LA PDF McKinney content was brief (characterization + endorsement data only) — used as negative confirmation that no detailed policy quotes exist, not as a policy source

## Next Phase Readiness

- Plan 30-03 (Marissa Roy) is ready to execute — same pattern as 30-01 and 30-02; uses migration 121
- McKinney has 5 placed judicial compass stances visible on production profile page
- judicial-transparency context row in DB documents the research gap for future follow-up if new sources emerge

---
*Phase: 30-legal-candidate-stance-research*
*Completed: 2026-05-09*
