---
phase: 31-donor-court-conflict-map
plan: "03"
subsystem: database
tags: [skipped]
completed: 2026-05-09
duration: 0 minutes (skipped)

decisions:
  - id: D1
    decision: Skipped migration 122 and apply-court-research.ts loader entirely
    rationale: Option C (Legal Donor Activity) queries transparent_motivations.contributions in real-time — no pre-computed court conflict table needed
    impact: No new DB table created; backend service function queries contributions directly
---

# Phase 31 Plan 03: Migration 122 + Loader Summary

**One-liner:** Skipped entirely — Option C pivot eliminated the need for the donor_court_conflicts table. Backend queries contributions at request time instead.

## Why Skipped

Plan 03 existed to:
1. Create `essentials.donor_court_conflicts` table (migration 122)
2. Load `court-research-results.json` into it via `apply-court-research.ts`

Since court research was dropped (Plan 02 Task 2 skipped), there is no court data to store. The "Legal Donor Activity" section (Plan 04) queries `transparent_motivations.contributions` in real-time using the same occupation-keyword filter logic from `identify-legal-donors.ts`.

**Next migration remains 122** — not consumed by this phase.
