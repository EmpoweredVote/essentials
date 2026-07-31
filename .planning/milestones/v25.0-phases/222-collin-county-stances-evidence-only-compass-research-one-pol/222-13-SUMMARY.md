---
phase: 222-collin-county-stances-evidence-only-compass-research-one-pol
plan: 13
subsystem: data
tags: [postgres, supabase, compass-stances, evidence-research, parker-tx, lucas-tx, ocr, civicclerk]

# Dependency graph
requires:
  - phase: 222-12
    provides: OCR unlock recipe (Tesseract), Henry elimination precedent, 1516-1525 migration band
provides:
  - "3 chairs applied via migration 1518 (APPLIED to production 2026-07-30): Sharpe (Parker P4), Underhill (Lucas P1), Orr (Lucas P2) — all residential-zoning=1 from their own campaign platforms (Works/Kuykendall statement class)"
  - "PARKER (4855152) AND LUCAS (4845012) BOTH FLIPPED 0 -> 1 — Pitfall-5 triggers #3 and #4; 222-18 now owes FOUR hasContext flips (with Fairview 4825224, Farmersville 4825488)"
  - "Grasslands lead resolved: City-Attorney-authored documents + representation roles — refused for Pilgrim/Sharpe/Barron by the same rule that protected the mayor; 222-08 register corrected (Lindy Pilgrim IS Buddy Pilgrim)"
  - "Lucas minutes UNLOCKED via CivicClerk OData ($skip walking, real page size 15) — 222-08's 'completely inaccessible' is CLOSED; third OData recovery after Fairview and Anna"
  - Register Count 738 -> 802 (Parker 684 -> 738 earlier in plan)
affects: [222-14, 222-15, 222-16, 222-17, 222-18]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CivicClerk OData server page size is 15 regardless of $top (rejects >1000) — walk with $skip in steps of 15; an 'empty' portal may be a pagination artifact"
    - "Swagit CC transcripts (Parker /videos/<id>/transcript) are unauthenticated verbatim speech but have NO speaker labels and mangle names — unattributable passages are refusals; Lucas has the same vendor but no captions (HTTP 204)"
    - "Hybrid scan PDFs return some text and look complete but are not — check bytes-PER-PAGE, not bytes (12 Parker + 1 Lucas file)"
    - "WebSearch summaries can FABRICATE biographies by fusing homonyms (a Colleen Halbert bio built from Murphy's Laura Deel) — never cite a search snippet without fetching"
    - "Adjacent-chairs-inseparable = blank, never the middle value (Sharpe/growth chairs 2-3, Underhill/public-safety chairs 3-4, Orr/growth chairs 1-2)"

key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/1518_222_parker_lucas_councils_stances.sql (branch data/phase-222-stances — NOT master, NOT pushed)"
  modified:
    - ".planning/phases/222-collin-county-stances-evidence-only-compass-research-one-pol/222-CONFIRMED-BLANK.md"

key-decisions:
  - "All three chairs accepted on the Works/Kuykendall statement-class precedent (now applied 5x phase-wide); shared honest limitation carried in the migration header (no community-vote clause in any platform; chair 2 affirmatively excluded in each case)"
  - "Underhill is the phase's FIRST genuine Ballotpedia Candidate Connection survey yield (April 20, 2026)"
  - "Second same-day migration prefix collision (origin/master shipped its own 1506/1507) — branch files renumbered 1516/1517, phase claims the 1516-1525 band; 1518 used for this plan"
  - "Grasslands refused for all three named members: /Author = City Attorney Catherine Clifton; Pilgrim/Bogdan appear as designated speakers (representation, not position); Pilgrim's one personal item refused on four grounds including his contrary council record"
  - "taxes: researched, no rows (operator ruling 2026-07-25)"

requirements-completed: []

coverage:
  - id: D1
    description: "3 chairs applied with paired context rows; migration 1518 applied to production"
    requirement: "COLLIN-STANCE-02"
    verification:
      - kind: sql_gate
        ref: "Evidence-integrity gate scoped to all 11 plan politician_ids: 0 rows. Post-apply: Sharpe/Underhill/Orr each 1 answer row. Run by the orchestrator 2026-07-30."
        status: pass
    human_judgment: true
  - id: D2
    description: "118 blank pairs registered (Parker 54 + Lucas 64, ALL settled, zero access failures); Count 684 -> 738 -> 802"
    requirement: "COLLIN-STANCE-01"
    verification:
      - kind: manual_procedural
        ref: "Exactly-one-bucket reconcile: 11 x 11 = 121 = 3 applied + 118 registered. Register commits 0862bc0d (Parker) + a5bd9574 (Lucas), each touching only 222-CONFIRMED-BLANK.md."
        status: pass
    human_judgment: false
  - id: D3
    description: "All 3 citations independently re-verified by the orchestrator via fresh curl: sharpeforparker.com/the-issues-1 (2-acre-minimum defense), Ballotpedia Underhill survey ('standing firmly against high-density development'), rebeccaorr.us ('never vote to add sewer')"
    requirement: "COLLIN-STANCE-02"
    verification:
      - kind: manual_procedural
        ref: "Orchestrator-side fetches 2026-07-30; direction checks: all strict-preservation -> 1, chair 2 excluded by each subject's opposition to any increase"
        status: pass
    human_judgment: false

# Blockers / follow-ups for later plans
follow_ups:
  - "222-18: flip hasContext: true for FOUR cities — Fairview 4825224, Farmersville 4825488, Parker 4855152, Lucas 4845012 — plus split-section check and browse spot-check screenshots"
  - "Parker Swagit VIDEO (speech already extracted via CC transcripts, needs speaker diarisation) and Lucas Swagit video (no captions at all) are the highest-value unread sources for both cities"
  - "lwvcollin.org is no longer 403 via curl but carries no candidate content (ClubExpress shell); VOTE411 still 403"
  - "Operator ruling standing: Opus for research dispatches through 222-17; migration band 1516-1525"
---

# 222-13: Parker + Lucas councils — evidence-only stances

**One-liner:** 11 council members attempted across 11 topics (121 pairs) → 3 chairs APPLIED (migration 1518: Sharpe, Underhill, Orr — all residential-zoning=1 from their own campaign platforms) + 118 settled blanks; Parker and Lucas both flipped 0→1 (chip triggers #3 and #4); the Grasslands lead resolved as City-authored representation material; Lucas's "inaccessible" minutes unlocked via CivicClerk OData pagination.

## What was done

- **Task 1 (Parker, 5):** 1 chair (Sharpe) + 54 settled blanks; 73 Swagit CC transcripts pulled (4.44 MB) but refused as unattributable (no speaker labels); 110/143 minutes OCR'd; fabricated-biography WebSearch trap caught. Register commit `0862bc0d`.
- **Task 2 (Lucas, 6):** 2 chairs (Underhill via the phase's first completed Candidate Connection survey; Orr via her own site's categorical no-sewer commitment) + 64 settled blanks; 185 minutes downloaded via OData $skip-walking and OCR'd; "Orr is a street name" grep trap handled. Register commit `a5bd9574`.
- **Task 3 (blocking checkpoint):** operator typed "approve" 2026-07-30. Orchestrator applied 1518; gate 0 rows; reconcile 121 = 3 + 118; chip triggers #3/#4 recorded.

## Deviations

- Second same-day cross-session migration collision → branch renumbered to 1516/1517, band 1516-1525 claimed, 1518 used here. All renames filename-only (SQL already applied).
