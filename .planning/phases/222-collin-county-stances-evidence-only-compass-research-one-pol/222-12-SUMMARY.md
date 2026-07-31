---
phase: 222-collin-county-stances-evidence-only-compass-research-one-pol
plan: 12
subsystem: data
tags: [postgres, supabase, compass-stances, evidence-research, melissa-tx, farmersville-tx, ocr]

# Dependency graph
requires:
  - phase: 222-11
    provides: Lavine-upgrade execution precedent, SPA-shell access-failure reclassification, worktree branch workflow (data/phase-222-stances), Opus dispatch ruling
provides:
  - "1 chair applied via migration 1507 (APPLIED to production 2026-07-30): Mike Henry (Farmersville Place 4) residential-zoning=3, located by elimination from a 4-year recorded legislative pattern"
  - "FARMERSVILLE FLIPPED 0 -> 1 STANCES — the phase's SECOND coverage-chip (Pitfall 5) trigger; 222-18 must add hasContext: true for geo_id 4825488 (joining Fairview 4825224)"
  - "Melissa ALL-BLANK: 66/66 pairs settled, all 48 prior 2026-05-12 found-nothing notes corroborated; no Melissa rows, correctly no Melissa migration content"
  - "OCR UNLOCK: Farmersville publishes ONLY text-layerless RICOH scanner images (minutes AND packets) — pdftoppm + Tesseract 5 (installed at C:/Program Files/Tesseract-OCR) converted 133 minutes PDFs / 1,050 pages into a searchable 2.07 MB corpus, Jan 2021 - Jun 2026"
  - Register Count 630 -> 684 (Melissa 66 + Farmersville 54); with Melissa at 564 -> 630 earlier in the plan
affects: [222-13, 222-14, 222-15, 222-16, 222-17, 222-18]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "When a city's agenda packets are ALSO image scans (unlike Melissa/Fairview where packets carry text layers), OCR is the corpus unlock: pdftoppm -r 200 -png + tesseract, parallelized; re-OCR decisive documents at 300 dpi for an independent recognition-layer verification"
    - "Melissa packets carry the PRIOR meeting's minutes as a consent item (4A/5A) — the passage for meeting M lives in meeting M+1's packet"
    - "A chair can be LOCATED BY ELIMINATION from a member's own motion record when each rejected chair is excluded by an affirmative recorded act (not by absence of evidence) — Henry: duplex denials exclude 5 and 2, citywide downzoning excludes 4, no voter-approval mechanism + MF PD approval excludes 1"
    - "Migration prefix collisions across concurrent sessions are LIVE: 1503 was claimed by this session (branch) and another session (origin/master) within hours — renumber the branch copy (filename-only if already applied), re-check max at every claim"

key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/1507_222_melissa_farmersville_councils_stances.sql (branch data/phase-222-stances, commit 8c08cae7 — NOT master, NOT pushed)"
  modified:
    - ".planning/phases/222-collin-county-stances-evidence-only-compass-research-one-pol/222-CONFIRMED-BLANK.md"
    - "C:/EV-Accounts/backend/migrations/1506_222_fairview_princeton_councils_stances.sql (renamed from 1503, commit 141c59a8)"

key-decisions:
  - "Henry residential-zoning=3 accepted: chair located by elimination from his own motions with stated density reasoning (proposed + moved the citywide MF downzoning O-2022-0208-001; moved denial of both duplex rezonings; moved approval of the corridor MF PD capped 'in order to control the density'). Third-person minutes mean no verbatim quote is claimed; BoxCast video is the named quote path"
  - "Orchestrator independently OCR'd media/5221 (200 dpi, fresh download) and confirmed the MF-2 24->18 / MF-1 18->12 proposal attributed to Henry by name, with Henry in the attendance line — the verification was not delegated"
  - "Melissa authors nothing: an all-blank city contributes no migration content (rev-2 note 25); its 66 zeros are all settled with structural reasons (action-only minutes, no bios, structurally absent topics)"
  - "Migration 1503 renumbered to 1506 after origin/master's concurrent 1503_civicpatch_tx_ma_contacts appeared; 1507 claimed against live max 1505. Rename is filename-only — the 222-11 SQL was already applied"
  - "Fox/homelessness refused: 'police should identify and assist' specifies no enforcement mechanism, compatible with chairs 2/3/4 alike. Nine Farmersville + five Melissa near-misses refused on the record"
  - "taxes: researched, no rows per the standing 2026-07-25 operator ruling"

requirements-completed: []

coverage:
  - id: D1
    description: "1 chair applied with paired context row; migration 1507 applied to production via mcp__supabase-local__execute_sql"
    requirement: "COLLIN-STANCE-02"
    verification:
      - kind: sql_gate
        ref: "Evidence-integrity gate scoped to all 11 plan politician_ids: 0 rows. Post-apply: Henry 1 answer row. Run by the orchestrator 2026-07-30, not delegated."
        status: pass
    human_judgment: true
  - id: D2
    description: "120 blank (person, topic) pairs registered (Melissa 66 + Farmersville 54, ALL settled — zero access failures); register Count 630 -> 684 (Melissa commit cc7b54b7 took 564 -> 630)"
    requirement: "COLLIN-STANCE-01"
    verification:
      - kind: manual_procedural
        ref: "Exactly-one-bucket reconcile: 11 x 11 = 121 = 1 applied + 120 registered, no overlap, no omission. Register commits cc7b54b7 (Melissa) + 34979b1e (Farmersville), each touching only 222-CONFIRMED-BLANK.md."
        status: pass
    human_judgment: false
  - id: D3
    description: "Decisive citation independently re-verified by the orchestrator via fresh download + own OCR of farmersvilletx.com/media/5221 (Henry's MF-2/MF-1 density-reduction proposal, verbatim, correct speaker, correct city)"
    requirement: "COLLIN-STANCE-02"
    verification:
      - kind: manual_procedural
        ref: "Orchestrator-side curl + pdftoppm + Tesseract 2026-07-30; direction check: corridor-multifamily-with-caps + SF protection -> chair 3 by elimination"
        status: pass
    human_judgment: false

# Blockers / follow-ups for later plans
follow_ups:
  - "222-18: flip hasContext: true for BOTH Fairview (4825224, from 222-11) and Farmersville (4825488, this plan) in src/lib/coverage.js + split-section check + browse spot-check screenshots"
  - "Farmersville Facebook pages (4 of 6 Melissa members, Strickland's campaign page) return HTTP 400 without login — largest unread surface for both cities"
  - "amtrib.com (Anna-Melissa Tribune) is geo-blocked; Melissa's 26 un-swept 2021-2022 packets (30-80 MB each) remain; BoxCast video is the Henry verbatim-quote path"
  - "Operator ruling standing: Opus for research dispatches through 222-17"
---

# 222-12: Melissa + Farmersville councils — evidence-only stances

**One-liner:** 11 council members attempted one at a time across 11 topics (121 pairs) → 1 chair APPLIED (migration 1507: Henry, Farmersville, residential-zoning=3, located by elimination from his own 2021-2025 motion record, unlocked by OCR-ing 133 scanner-image PDFs) + 120 settled blanks; Farmersville flipped 0→1 (second chip trigger); Melissa all-blank with all 48 prior notes corroborated; migration 1503→1506 renumbered after a live cross-session prefix collision.

## What was done

- **Task 1 (Melissa, 6 people):** 0 chairs, 66/66 settled blanks. Structural: 2025-26 minutes are action-only ("There was no Council discussion."), standalone PDFs are Brother-scanner images (recovered via next-meeting packets), no officeholder bios, no Ballotpedia pages. Register commit `cc7b54b7`.
- **Task 2 (Farmersville, 5 people):** 1 chair + 54 settled blanks. All 133 minutes PDFs OCR'd (RICOH scans, packets too — the Melissa recovery does not work here). Farmersville minutes DO narrate member speech, making these the harder, better-grounded zeros. Register commit `34979b1e`.
- **Task 3 (blocking checkpoint):** operator typed "approve" 2026-07-30. Orchestrator applied 1507; gate 0 rows; reconcile 121 = 1 + 120; Pitfall-5 trigger #2 recorded.

## Deviations

- **Cross-session migration collision (live):** origin/master grew 1502→1505 mid-plan including its own `1503_civicpatch_tx_ma_contacts.sql`; our 1503 renamed to 1506 (commit `141c59a8`, filename-only, SQL already applied), 222-11-SUMMARY references updated, 1507 claimed for this plan.
- OCR tooling (pdftoppm + Tesseract 5) used for the first time in the phase; decisive documents verified at two resolutions plus an independent orchestrator OCR.
