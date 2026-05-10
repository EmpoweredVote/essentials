---
phase: 31-donor-court-conflict-map
plan: "02"
subsystem: campaign-finance
tags: [campaign-finance, legal-donors, court-research, skipped]
completed: 2026-05-09
duration: ~5 minutes (Task 1 auto; Task 2 skipped by design)

decisions:
  - id: D1
    decision: Skipped lacourt.org court research — user chose Option C (donor transparency only)
    rationale: lacourt.org PAOS charges $1.00–$4.75 per search; with ~237 firms across 4 candidates the cost was not justified for this phase
    impact: Plan 03 skipped entirely (no court data table); Plan 04 modified to "Legal Donor Activity" display with no court columns
---

# Phase 31 Plan 02: Manual lacourt.org Research Summary

**One-liner:** Task 1 (workbook generation) auto-executed; Task 2 (lacourt.org searches) skipped by design — user chose Option C: display legal donor activity only, no court research.

## What Was Done

**Task 1 (auto):** Generated `court-research-workbook.txt` (657 lines, 237 firms across 4 candidates) and pre-created stub `court-research-results.json` (265 entries, all PENDING). Opened lacourt.org CivilIndex + CriminalIndex tabs.

**Task 2 (skipped):** User elected not to pay for lacourt.org PAOS searches ($1–$4.75/search). Decision made to pivot to Option C — show legal professional donors as a transparency feature without court cross-reference.

## Pivot Decision: Option C — Legal Donor Activity

- **Dropped:** court appearances, conflict computation, recusal tracking
- **Kept:** firm name, total donated, donor count, legal occupation context
- **Section heading:** "Legal Donor Activity" (not "Donor-Court Conflicts")
- **Zero state:** "No legal professional donor data available for this candidate."
- **Plan 03:** Skipped (no migration 122 needed)
- **Plan 04:** Modified to build LegalDonorActivitySection.jsx with real-time query

## Artifacts Left on Disk

- `court-research-workbook.txt` — available if research is done in a future phase
- `court-research-results.json` — stub with all PENDING, usable if court research is resumed later
- `court-research-input.json` — firm lists from Plan 01, still accurate
