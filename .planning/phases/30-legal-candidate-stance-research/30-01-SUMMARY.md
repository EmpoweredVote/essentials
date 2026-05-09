---
phase: 30-legal-candidate-stance-research
plan: 01
subsystem: database
tags: [postgres, judicial-compass, politician-answers, politician-context, stance-research, sql-migration]

# Dependency graph
requires:
  - phase: 27-judicial-compass-db
    provides: "8 judicial compass topics + stances in inform.compass_topics; topic IDs confirmed"
  - phase: 29-bar-evaluation-data
    provides: "Ashouri politician_id confirmed in production; migration 118 was last applied"
provides:
  - "Aida Ashouri judicial compass stances: 6 politician_answers rows + 6 politician_context rows with source citations"
  - "Migration 119 applied to production (idempotent)"
affects:
  - "30-02, 30-03 (same ingestion pattern for McKinney and Roy)"
  - "Phase 31 any future City Attorney stance review"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Judicial stance research: fixed 4-category source checklist with LA-specific equivalents"
    - "Two-table idempotent write: politician_answers + politician_context via ON CONFLICT DO UPDATE"
    - "Not-found topics: politician_context-only row (no politician_answers); reasoning begins with 'Researched YYYY-MM-DD — no public record found'"
    - "Inference flagging: reasoning prefixed with 'Inferred from [source]' when value placed from implication not direct quote"

key-files:
  created:
    - ".planning/phases/30-legal-candidate-stance-research/30-01-RESEARCH-NOTES.md"
    - "C:/EV-Accounts/backend/migrations/119_ashouri_judicial_compass_stances.sql"
  modified: []

key-decisions:
  - "All 6 Ashouri topics placed (no not-found) — strong source coverage from Patch Q&A and platform"
  - "judicial-criminal-justice = 2 (not 1): she acknowledges serious/vehicular crimes must be prosecuted, maps to 'fair chance to make things right' not pure rehabilitation"
  - "judicial-government-deference = 1 (inferred): no direct quote on citizen-vs-government framing, but consistent platform direction is citizen-favoring; inference flagged in reasoning"
  - "judicial-transparency = 2 (inferred): general transparency/accountability framing; civil rights background supports default-open stance; no specific court-record quote found"
  - "Patch candidate profile Q&A is highest-quality source — structured interview with Ashouri's own words on specific policy questions"

patterns-established:
  - "Source priority for City Attorney candidates: Patch Q&A > campaign platform page > LAist voter guide > supplementary articles"
  - "Value 1 vs 2 distinction for prosecution-priorities: value 1 = housing/treatment explicitly preferred over criminal record; value 2 = diversion when available, prosecution when safety requires"

# Metrics
duration: 8min
completed: 2026-05-09
---

# Phase 30 Plan 01: Aida Ashouri Stance Ingestion Summary

**Ashouri judicial compass stances ingested: 6 of 6 topics placed (values 1-2 throughout) from Patch Q&A, LAist voter guide, and campaign platform, with migration 119 applied to production**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-09T23:50:10Z
- **Completed:** 2026-05-09T23:58:20Z
- **Tasks:** 2 of 2
- **Files modified:** 2 created

## Accomplishments
- Researched all 6 applicable judicial compass topics for Aida Ashouri using fixed 4-category source checklist with LA-specific equivalents
- Found public-record evidence supporting placed stances for all 6 topics — no "not found" rows needed
- Applied migration 119 to production: 6 politician_answers rows (values 1-2) + 6 politician_context rows with 3-4 source URLs each
- Idempotency confirmed: re-running migration produces 0 net new rows (ON CONFLICT DO UPDATE)

## Task Commits

1. **Task 1: Research Ashouri positions across all 6 topics** - `5a92ee4` (docs)
2. **Task 2: Write and apply migration 119** - `b58dc8a` in EV-Accounts (feat)

**Plan metadata:** (committed with this summary)

## Placed Stances Summary

| Topic | Value | Evidence Type |
|-------|-------|--------------|
| judicial-access-to-justice | 1 | Direct statements + career pattern |
| judicial-criminal-justice | 2 | Direct statements |
| judicial-government-deference | 1 | Inferred from platform framing |
| judicial-police-accountability | 1 | Direct statements |
| judicial-prosecution-priorities | 1 | Direct statements |
| judicial-transparency | 2 | Inferred from transparency framing |

**Inference-flagged topics:** judicial-government-deference, judicial-transparency (both prefixed "Inferred from..." in reasoning).

## Files Created/Modified
- `.planning/phases/30-legal-candidate-stance-research/30-01-RESEARCH-NOTES.md` — Per-topic research findings with source URLs and value reasoning
- `C:/EV-Accounts/backend/migrations/119_ashouri_judicial_compass_stances.sql` — Idempotent SQL with 12 INSERT/ON CONFLICT statements (6 answers + 6 context)

## Decisions Made
- **judicial-criminal-justice = 2, not 1:** Ashouri explicitly supports prosecution for serious crimes, vehicular crimes, and gun cases. Her position is rehabilitation-primary but not prosecution-abolition. Value 2 ("fair chance to make things right through treatment/community service") matches better than value 1 ("helping the person change their life") which implies purer rehabilitation without retained prosecution.
- **judicial-government-deference = 1 (inferred):** No single direct quote on the citizen-vs-government framing, but the consistent platform direction is unambiguous: she describes the office's job as "keeping the City Council accountable," says the city must be held accountable for its negligence, and her entire career background (civil rights, tenant rights, legal aid) is citizen-favoring. Inference explicitly flagged.
- **judicial-transparency = 2, not 1:** Her statements focus on office accountability and anti-corruption, not on a position that court secrecy always breeds injustice. Value 2 (default open; sealing requires compelling reason) fits her legal services background better than value 1's absolutist framing.
- **Patch Q&A is primary source:** The April 30, 2026 Patch profile contains a detailed structured Q&A with Ashouri's own words on criminal justice, prosecution priorities, and office operations — highest evidentiary quality of all sources consulted.

## Deviations from Plan

None - plan executed exactly as written. All 6 topics placed; no architectural changes required.

## Issues Encountered
- Ashouri had 11 pre-existing politician_answers/context rows for other (non-judicial) topics — confirmed these are separate topic IDs; the 6 new judicial rows bring her total to 17. No conflicts.
- DSA-LA voter guide (PDF, 126 pages): Ashouri content was minimal — she sought but did not receive DSA-LA endorsement; no substantive policy Q&A for her in the guide.
- Knock LA website returned no content; Abundant Housing LA had no Ashouri endorsement. These are documented in research notes.

## User Setup Required

None - no external service configuration required. Migration applied directly via psql.

## Next Phase Readiness
- Plan 30-02 (McKinney) is unblocked — can run immediately
- Plan 30-03 (Roy) follows 30-02 per sequential execution requirement (memory: feedback_stance_research_one_at_a_time)
- Migration 120 will be next for McKinney or Roy ingestion

---
*Phase: 30-legal-candidate-stance-research*
*Completed: 2026-05-09*
