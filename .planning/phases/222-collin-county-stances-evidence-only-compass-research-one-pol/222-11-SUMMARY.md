---
phase: 222-collin-county-stances-evidence-only-compass-research-one-pol
plan: 11
subsystem: data
tags: [postgres, supabase, compass-stances, evidence-research, fairview-tx, princeton-tx]

# Dependency graph
requires:
  - phase: 222-10
    provides: Ballotpedia UA unlock + wrong-person hazard, CivicClerk OData pattern, settled-vs-access-failure classification, staff-report-behind-the-motion control
provides:
  - "3 chairs applied via migration 1503 (APPLIED to production 2026-07-30): Works (Fairview) residential-zoning=1, Todd (Princeton) growth-and-development=2, Washington (Princeton) public-safety-approach=4"
  - "FAIRVIEW FLIPPED 0 -> 1 STANCES — the phase's FIRST coverage-chip (Pitfall 5) trigger; 222-18 must add hasContext: true for Fairview in src/lib/coverage.js"
  - "First executed Lavine-precedent upgrade: Washington's 2026-05-12 found-nothing note on public-safety replaced — prior pass 'checked wash4council.com' but the site serves an empty SPA shell to curl/WebFetch, so it never read the content (recovered via headless render + embedded JSON)"
  - Two register sections, register Count 468 -> 564 (96 blanks: Fairview 65, Princeton 31)
affects: [222-12, 222-13, 222-14, 222-15, 222-16, 222-17, 222-18]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Square Online SPA sites (wash4council.com) serve an empty shell to curl/WebFetch — content is recoverable from the embedded __BOOTSTRAP_STATE__ JSON in the raw HTML or a headless render; a prior 'checked <site>, found nothing' note against such a site is an access failure in disguise, not a considered refusal"
    - "Princeton AgendaCenter ViewFile serves by numeric ID and ignores the date prefix in the URL — URL guessing returns wrong meetings; Princeton standalone minutes are ScanSnap image scans (pdftotext ~10 bytes) readable only via visual PDF extraction"
    - "Fairview standalone Minutes PDFs are PaperStream image scans with no text layer; draft minutes ride inside Agenda Packets with full text layers (17 packets recovered the complete May 2025 - June 2026 corpus)"
    - "A relayed absentee support-message reported by local press ('sent a message that she supported...') records the fact of a member's position in their own name — accepted at chair 2 with an operator flag, distinct from the refused presiding-officer misattribution class"

key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/1503_222_fairview_princeton_councils_stances.sql (on branch data/phase-222-stances, commits 304e529d + 76bd3957 — NOT master, NOT pushed)"
  modified:
    - ".planning/phases/222-collin-county-stances-evidence-only-compass-research-one-pol/222-CONFIRMED-BLANK.md"

key-decisions:
  - "Migration number 1503 claimed from live origin/master max 1502 (fetched twice on 2026-07-30) — the STATE.md-era band 1468-1490 was already consumed by other sessions and is dead; rev-2 note 6's band assignment is superseded by note 5's always-re-check rule"
  - "Works residential-zoning=1 accepted on the Kuykendall precedent (strict low-density preservation via zoning ordinances); honest limitation flagged and carried in the migration header: chair 1's community-vote clause is not in her platform, and chair 2 is affirmatively contrary"
  - "Todd growth-and-development=2 accepted: Herald-reported absentee support message for the June 23, 2025 moratorium extension is the member's own named position; operator flag preserved (fact-of-support, not personal reasoning). Overwrites nothing — her 8 prior notes cover the 8 Local Lens topics and growth is not among them (verified live)"
  - "Washington public-safety-approach=4 accepted as the phase's first executed Lavine upgrade after orchestrator verification that the 2026-05-12 pass could not have read the SPA-shell site it claimed to check; chair 4 not 5 (no top-priority-over-services claim); the bundled EDC clause refused as adjacency"
  - "Five Fairview near-misses + five Princeton near-misses refused on the record (Connelly/MLK motion, Stanley/DART plank, Sheehan/NTRA x2, Works/smart-growth; Todd/budget-dissent + TIRZ critique, Washington/moratorium unexplained Aye + strategic-growth generic, Rutledge/understaffed-forum + commercial-tax-base class)"
  - "taxes: researched, no rows written per the standing 2026-07-25 operator ruling; Todd's explained FY26 budget/rate Nay preserved verbatim in the register for any future municipal-scope rewrite"

requirements-completed: []

coverage:
  - id: D1
    description: "3 chairs applied with paired context rows; migration 1503 applied to production via mcp__supabase-local__execute_sql (upserts returned clean; post-apply row-state verified)"
    requirement: "COLLIN-STANCE-02"
    verification:
      - kind: sql_gate
        ref: "Evidence-integrity gate scoped to all 9 plan politician_ids: 0 rows. Post-apply state: Works 1 answer/1 context; Todd 1/9 (8 prior notes intact); Washington 1/8 (note upgraded in place). Run by the orchestrator 2026-07-30, not delegated."
        status: pass
    human_judgment: true
  - id: D2
    description: "96 blank (person, topic) pairs registered (Fairview 65: 64 settled + 1 access failure Sheehan/homelessness; Princeton 31: all settled); register Count 468 -> 564"
    requirement: "COLLIN-STANCE-01"
    verification:
      - kind: manual_procedural
        ref: "Exactly-one-bucket reconcile at (person, topic) granularity: 9 x 11 = 99 = 3 applied + 96 registered, no overlap, no omission. Register commits 6621705d (Fairview) + 2c0db4e2 (Princeton), each touching only 222-CONFIRMED-BLANK.md."
        status: pass
    human_judgment: false
  - id: D3
    description: "All 3 citations independently re-verified by the orchestrator (not the research agents): worksforfairview.com quoted phrases confirmed via fresh curl; Herald 'Todd was absent but sent a message that she supported the second extension' confirmed via fresh curl; wash4council.com 'strong proponent of starting salary increases for our police and fire' confirmed in the embedded JSON of a fresh curl"
    requirement: "COLLIN-STANCE-02"
    verification:
      - kind: manual_procedural
        ref: "Orchestrator-side fetches 2026-07-30; direction checks against §B scales (strict preservation -> 1; infrastructure-gated growth -> 2; increase pay -> 4, not 5)"
        status: pass
    human_judgment: false

# Blockers / follow-ups for later plans
follow_ups:
  - "222-18: add hasContext: true for Fairview (Town of Fairview, geo_id 4825224) in src/lib/coverage.js — first 0->1 flip of the phase"
  - "Sheehan/homelessness access failure: Jan 6, 2026 meeting MP3 audio via CivicClerk externalMediaUrl is the retry path"
  - "Princeton Swagit video archive unconsumed (Sept 8, 2025 budget debate; Jan 13, 2025 extension; May 30, 2026 runoff forum) — highest-value unread Princeton source"
  - "Operator ruling 2026-07-30: dispatch research agents for waves 222-12..222-17 with model: opus; keep the session model for 222-18 close-out"
---

# 222-11: Fairview + Princeton councils — evidence-only stances

**One-liner:** 9 council members attempted one at a time across 11 topics (99 pairs) → 3 evidence-cited chairs APPLIED to production (migration 1503) + 96 honest blanks registered; Fairview flipped 0→1 stances (first coverage-chip trigger of the phase); Washington's row is the phase's first executed Lavine-precedent upgrade over a prior found-nothing note.

## What was done

- **Task 1 (Fairview, 6 people):** 1 chair (Works residential-zoning=1, her own 2026 platform, twice-verified) + 65 blanks (64 settled — Fairview minutes are action-only; 1 access failure — Sheehan/homelessness, MP3 retry path named). Register commit `6621705d`; migration commit `304e529d`.
- **Task 2 (Princeton, 3 people):** 2 chairs (Todd growth=2 via Herald-reported absentee support for the moratorium extension; Washington public-safety=4 via his campaign site, recovered from an SPA shell the 2026-05-12 pass could not read) + 31 settled blanks, corroborating 15 of 16 prior found-nothing notes. Register commit `2c0db4e2`; migration commit `76bd3957`.
- **Task 3 (blocking checkpoint):** operator approved 2026-07-30 ("continue" at the presented checkpoint with all three rows and their flags on the table). Orchestrator applied migration 1503 via `mcp__supabase-local__execute_sql`; evidence-integrity gate 0 rows; exactly-one-bucket reconcile passed; no `schema_migrations` write (no such table exists — no migration runner).

## Deviations

- Migration number: plan text and STATE.md assumed the 1468–1490 band; live origin/master max was 1502 → claimed **1503** per rev-2 note 5 (always re-check). Band ruling superseded.
- EV-Accounts commits made via a dedicated worktree (`C:/EV-Accounts-wt-222`) on `data/phase-222-stances` rather than `git -C` against the main checkout, so other sessions' use of the main checkout (on master) is never disturbed. Same branch contract as rev-2 note 7; nothing pushed.
- The plans' literal `^## {City}` register greps do not match the actual heading convention (`## Town of Fairview (4825224) — 222-11`) — known rev-2 note 28 discrepancy; artifact contract satisfied, 222-18 reconciles on city name.
