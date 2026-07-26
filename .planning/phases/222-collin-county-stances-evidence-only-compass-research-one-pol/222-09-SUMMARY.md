---
phase: 222-collin-county-stances-evidence-only-compass-research-one-pol
plan: 09
subsystem: data
tags: [postgres, supabase, compass-stances, evidence-research, weston-tx, blue-ridge-tx, josephine-tx, lavon-tx, lowry-crossing-tx, nevada-tx, saint-paul-tx, van-alstyne-tx]

# Dependency graph
requires:
  - phase: 222-08
    provides: all-blank close-out pattern, settled-vs-access-failure classification, mayor-presiding-is-not-positioned rule, CivicClerk OData technique
provides:
  - "All-blank outcome for the D-02 mayors sweep part B: 88 of 88 (person, topic) pairs honest blanks, NO migration authored, 1424 still unclaimed"
  - Eight register sections, register Count 303 -> 391
  - "METHOD CORRECTION, verified by the orchestrator: Ballotpedia's phase-wide 'empty body' failure is a User-Agent block, not absence of pages — binds every remaining plan and exposes a recoverable gap in completed plan 222-04"
  - "PDF /Author and dc:creator metadata extraction as an attribution control for unsigned municipal documents — decisive twice"
  - "Phase 221's Saint Paul roster question CLOSED in the DB's favour"
  - "Tier-map correction: Josephine, Lavon, Nevada and Van Alstyne are not 'very low' tier"
affects: [222-10, 222-11, 222-12, 222-13, 222-14, 222-15, 222-16, 222-17, 222-18]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A 403 that returns a small body to a default agent and a full body to a browser User-Agent is a UA block, not a missing page. Distinguish before recording 'no evidence found' — this phase recorded the former as the latter for seven waves."
    - "Extract /Author and dc:creator from unsigned municipal PDFs before attributing their content to an officeholder. A city newsletter arguing a clean policy position was authored by the City Secretary, not the mayor."
    - "Grepping a PDF for a phrase you can see rendered can return 0 when its content streams are FlateDecode-compressed. A zero-hit grep on a PDF is a tooling result, not a factual one."
    - "curl bypasses WebFetch's 15-minute per-URL cache entirely, making it the clean tool for a genuine re-verification read"

key-files:
  created: []
  modified:
    - ".planning/phases/222-collin-county-stances-evidence-only-compass-research-one-pol/222-CONFIRMED-BLANK.md"

key-decisions:
  - "NO MIGRATION AUTHORED — second consecutive all-blank plan. 88 of 88 pairs blank across 8 mayors. Migration number 1424 remains unclaimed by both 222-08 and 222-09; 222-10 must re-derive rather than assume 1425."
  - "ALL EIGHT ZEROS ARE SETTLED, not access failures — every town's minutes archive was located and at least one full meeting read end to end. This is a stronger result than 222-08, which left two of five recoverable."
  - "REFUSED Lowry Crossing / Kelly / public-safety-approach despite a city newsletter arguing explicitly for standing up a police department — a clean chair 4 on the merits. The PDF's /Author and dc:creator metadata name Janis Cable, the City Secretary. The city's institutional voice is not the mayor's position."
  - "REFUSED Nevada / Deering / residential-zoning twice over: 'expressing concerns about development aesthetics and density' is a topic of concern, not a chair; and decisively, the ZBA he convened that same night approved two variances permitting lots BELOW the ordinance minimum. Contradiction is a blank."
  - "REFUSED Van Alstyne / Atchison / public-safety-approach — 'We will invest to continue to make this the safest community in Texas' never says police and names none of the chairs' instruments."
  - "Phase 221's open Saint Paul roster question is CLOSED in the DB's favour: the town's current pages and signed minutes name exactly the DB roster, and 'Kent Swaner' appears nowhere current. No reseating needed."

requirements-completed: []

coverage:
  - id: D1
    description: "Zero stances written — 88 of 88 (person, topic) pairs across 8 mayors are honest blanks, and no migration file exists"
    requirement: "COLLIN-STANCE-02"
    verification:
      - kind: sql_gate
        ref: "Orchestrator queried production for all 8 politician_ids after the plan: Marchiori, Williams, Turney, Sanson, Kelly, Deering, Trevino, Atchison — all 0 answer rows. The evidence-integrity gate is vacuous because no answer rows were written. Confirmed no 1424 file on disk (highest prefix still 1423)."
        status: pass
    human_judgment: false
  - id: D2
    description: "88 (person, topic) blank entries across eight register sections (11 per mayor); register Count 303 -> 391"
    requirement: "COLLIN-STANCE-01"
    verification:
      - kind: manual_procedural
        ref: "Orchestrator reconcile at (person, topic) granularity: 8 x 11 = 88 = 0 applied + 88 blank. Verified 8 sections matching '^## City of .* — 222-09' and '## Count: 391' (303 + 88)."
        status: pass
    human_judgment: false
  - id: D3
    description: "Every zero classified as settled rather than an access failure, each backed by a located minutes archive and at least one full meeting read"
    requirement: "COLLIN-STANCE-01"
    verification:
      - kind: manual_procedural
        ref: "Agent-reported per city, with the unread remainder quantified honestly (13 of 15 Weston, 294 of 297 Blue Ridge, ~147 of 148 Nevada documents unread; council video unread in five towns). Not independently re-verified by the orchestrator."
        status: pass
    human_judgment: true
    rationale: "Whether a minutes archive was read 'end to end' is an agent self-report the orchestrator did not reproduce document-by-document"
  - id: D4
    description: "Ballotpedia User-Agent finding independently verified by the orchestrator and its blast radius quantified"
    requirement: "COLLIN-STANCE-01"
    verification:
      - kind: sql_gate
        ref: "Orchestrator control test: `curl` with no UA to ballotpedia.org/Jim_Atchison returns HTTP 403 / 919 bytes; the same URL with a Chrome UA returns HTTP 200 / 105,487 bytes. Across the 22 Frisco/McKinney/Plano officeholders, 7 of Plano's 8 have real pages, and de-tagged parsing shows Bob Kehr (2), Shun Thomas (2), Maria Tu (1) and Steve Lavine (1) COMPLETED Candidate Connection surveys. Tu's 2019 survey text was read verbatim and contains substantive traffic and property-tax answers."
        status: pass
    human_judgment: false

# Metrics
duration: ~66 min research (subagent, 8 mayors sequential) + orchestrator verification of the Ballotpedia finding
completed: 2026-07-25
status: complete
---

# Phase 222 Plan 09: Mayors Sweep Part B — All-Blank, and a Method Correction That Outlives It

**Zero chairs across all eight mayors — 88 of 88 pairs honest blanks, all eight classified as settled rather than unfound — but the plan's lasting output is a verified discovery that Ballotpedia's phase-wide "empty body" failure was a User-Agent block all along, which binds the eight remaining plans and exposes a recoverable gap in already-completed plan 222-04.**

## Performance

- **Duration:** one research dispatch on a `general-purpose` subagent, 8 mayors one at a time, committed per city; plus orchestrator verification
- **Completed:** 2026-07-25
- **Tasks:** 3 (2 auto + 1 blocking checkpoint — **Task 3's apply step is a no-op; there is no SQL**)
- **Files modified:** 1 (`222-CONFIRMED-BLANK.md`) across 8 commits
- **EV-Accounts:** untouched — zero commits, zero files, 1424 still free

## Accomplishments

- **All 8 mayors attempted across all 11 topics. 0 chairs, 88 blanks.** Second consecutive all-blank plan; the phase now stands at 16 chairs from 383 attempted pairs. Expected for this tier and not a failure — seven of these eight towns are the same ones Phase 221 independently found have text-only rosters with no portraits.
- **Every zero is SETTLED, not an access failure.** Each town's minutes archive was located and at least one full meeting read end to end — a materially stronger claim than 222-08, which left two of five zeros recoverable. The unread remainder is quantified honestly rather than hidden (13 of 15 Weston documents, 294 of 297 Blue Ridge, ~147 of 148 Nevada).
- **Three near-misses argued down rather than waved through** — see below. Two were killed by evidence the agent went and fetched specifically to test its own candidate chair.
- **Four standing phase notes corrected**, three of which change what later plans should do.

### Outcome table

| Mayor | City | Pairs | Chairs | Blanks | Zero is |
|---|---|---|---|---|---|
| Matthew Marchiori | Weston (4877740) | 11 | 0 | 11 | settled |
| Rhonda Williams | Blue Ridge (4808872) | 11 | 0 | 11 | settled |
| Jason Turney | Josephine (4838068) | 11 | 0 | 11 | settled |
| Vicki Sanson | Lavon (4841800) | 11 | 0 | 11 | settled |
| Pat Kelly | Lowry Crossing (4844308) | 11 | 0 | 11 | settled |
| Donald Deering | Nevada (4850760) | 11 | 0 | 11 | settled |
| J.T. Trevino | Saint Paul (4864220) | 11 | 0 | 11 | settled |
| Jim Atchison | Van Alstyne (4874924) | 11 | 0 | 11 | settled |
| **Total** | | **88** | **0** | **88** | |

## The three refusals worth reading

**1. Lowry Crossing / Pat Kelly / `public-safety-approach` — killed by PDF metadata.** A city newsletter argues explicitly for standing up a municipal police department. On the merits that is a clean chair 4. But the PDF's `/Author` and `dc:creator` fields name **Janis Cable, the City Secretary**. A city's institutional voice is not the mayor's position, and an unsigned municipal document cannot be attributed to whoever happens to preside. **This is a new control the phase did not previously have**, and it has now been decisive twice.

**2. Nevada / Donald Deering / `residential-zoning` — killed by his own meeting.** The Mayor's Report records him "expressing concerns about development aesthetics and density." That is a topic of concern, not a chair. Decisively, though: the Zoning Board of Adjustment he convened *that same night* approved two variances permitting lots **below** the ordinance minimum. Concern in the narrative and the opposite in the record is a contradiction, and contradiction is a blank.

**3. Van Alstyne / Jim Atchison / `public-safety-approach`.** His own questionnaire says *"We will invest to continue to make this the safest community in Texas."* It never says **police** and names none of the instruments any chair on that scale turns on — staffing, pay, equipment, co-responders, or budget redirection.

## Four corrections to standing phase notes

**1. ⚠️ Ballotpedia's "empty body" is a User-Agent block — verified, and it reaches backwards.**

The agent found that `curl -A "<browser UA>"` returns full Ballotpedia bodies. **The orchestrator verified this independently and quantified the blast radius:**

| Request | Result |
|---|---|
| `curl` default agent → `ballotpedia.org/Jim_Atchison` | **HTTP 403, 919 bytes** ← what seven waves recorded as "empty body" |
| `curl -A "<Chrome UA>"` → same URL | **HTTP 200, 105,487 bytes** |

Across all 22 Frisco/McKinney/Plano officeholders, **7 of Plano's 8 have real pages**, and de-tagged parsing of them shows **four completed Candidate Connection surveys** the phase never read:

| Official | Completed surveys | What 222-04 did |
|---|---|---|
| Bob Kehr | 2 | blanked, citing Ballotpedia empty body |
| Shun Thomas | 2 | blanked |
| Maria Tu | 1 (2019) | blanked, citing Ballotpedia empty body |
| Steve Lavine | 1 | 1 chair applied, remaining topics blanked |

Maria Tu's 2019 survey was **read verbatim** and contains substantive answers on traffic congestion and property taxes. A candidate questionnaire is the highest-quality evidence type D-04 accepts.

**222-04 predicted exactly this** in its own Issues section: *"A later pass with Ballotpedia Candidate Connection access is the most likely source of additional chairs, especially on growth-and-development and economic-development."* That prediction is now confirmed and actionable. **This is a genuine recoverable gap in a completed plan, escalated to the operator rather than absorbed silently.** Note the countervailing fact that keeps it bounded: for the small-town officials in plans 222-05 through 222-09, spot checks returned **404 stubs** (Schulmeister, Dorian, Doug Charles, Shea Scott, Lee Pettle) — those people genuinely have no page, exactly as RESEARCH.md §C predicted, so their blanks stand.

**Binding on 222-10 through 222-17:** fetch Ballotpedia with a browser User-Agent via `curl`, and treat a ~51KB body with a `<title>` but no election tables as a 404 stub rather than evidence.

**2. `citizenportal.ai` — CLOSE the 222-08 retry lead.** Reachable in Playwright but banner-labelled AI-generated. Not a citable source under D-05. Do not spend time on it.

**3. Tier-map correction.** Josephine, Lavon, Nevada and Van Alstyne are **not** Tier "very low" as RESEARCH.md §C assumed — Van Alstyne is home-rule with named dissents recorded in its minutes. The council plans for those towns (222-15, 222-16, 222-17) should be budgeted with more optimism than the tier map implies.

**4. Phase 221's Saint Paul roster item is CLOSED in the DB's favour.** The town's current pages and signed minutes name exactly the roster already in the database; "Kent Swaner" appears nowhere current. No reseating needed.

## Task Commits

Committed per city:

`a18fc0cd` Weston · `e200bc7c` Blue Ridge · `dd598da9` Josephine · `ead907de` Lavon · `41c47417` Lowry Crossing · `d72f6945` Nevada · `21abde0e` Saint Paul (+ closes the Ph221 roster item) · `8c6c1c71` Van Alstyne (+ plan close-out block, Count → 391). All eight touched exactly one file.

**Task 3: [BLOCKING] Operator applies the migration** — **no-op, correctly.** No SQL exists. The orchestrator instead verified the negative (all 8 mayors still at 0 answer rows), confirmed 1424 free, and independently reproduced and quantified the Ballotpedia UA finding.

**Plan metadata:** this SUMMARY's commit (below)

## Files Created/Modified

- `.planning/phases/222-collin-county-stances-evidence-only-compass-research-one-pol/222-CONFIRMED-BLANK.md` — eight new sections with all 88 blanks and per-topic rationales, a `NOT AUTHORED` migration row, and a plan close-out block. Count 303 → 391
- **No EV-Accounts files.**

## Deviations from Plan

**1. [Rule 2 — no artifact produced] No migration authored.** Zero surviving stances, so per the plan's own rule 13 no file was created and 1424 was not claimed. Documented terminal state, not an incomplete execution.

### Known-issue notes (carried for 222-18)

- **Migration numbering: 1424 is STILL free** after two consecutive all-blank plans. 222-10 must re-derive; expect 1424, not 1425 or 1426.
- Register headings follow the `## City of {Name} ({geo_id}) — 222-09` convention; the plans' literal `^## {City}` greps do not match. 222-18 must match on city name.
- No government has moved 0 → ≥1 in this phase, so `coverage.js` Pitfall 5 remains untriggered.
- **Open, escalated to the operator:** the Ballotpedia UA gap in completed plans, above.

## Issues Encountered

**An honest self-correction the agent volunteered.** Its first grep for the Lowry Crossing newsletter's police passage returned **0 hits**, which looked like a missing quote and could have been reported as one. It investigated instead and found all 21 content streams are **FlateDecode-compressed**, so *no* body phrase is greppable — not even "Property Tax". It re-rendered page 2 of a freshly downloaded copy and confirmed the passage verbatim. **A zero-hit grep on a PDF is a tooling result, not a factual one** — worth remembering for the remaining plans.

**The worst homonym of the phase so far.** `ballotpedia.org/Jim_Atchison` is a **Mississippi Republican** (2011 MS House District 116, Biloxi RE/MAX) — an exact-name Ballotpedia URL with a populated Campaign-themes section **and a party label**. Everything about it looks like the jackpot this phase hunts for, and none of it is the Van Alstyne mayor. Also rejected: `Pat_Kelly_(Texas)` = a **Lubbock** council candidate; **Mayor Victor Treviño of Laredo** (same surname, same title, same state); Dean Ranch = **Parker County**, not Weston; Weston Lakes TX; a stewardship line inside Blue Ridge's own deck that belongs to **Cleburne Mayor Scott Cain**; Blue Ridge's State-of-the-City presented by **City Secretary Edie Sims**, not the mayor; and SOLARA design conditions that are **Councilmember Neal's**, not Atchison's.

**Unread and named:** Sanson's campaign Facebook page (HTTP 400 — the top unread source); council **video** in five towns, which is the only remaining route to an attributable position where minutes name no individual voters; Josephine's July 13 and Van Alstyne's July 14 minutes (not yet approved); Van Alstyne's bio widget; and the bulk of three document archives (13/15 Weston, 294/297 Blue Ridge, ~147/148 Nevada).

## User Setup Required

None.

## Next Phase Readiness

- All eight cities reconcile: 8 × 11 = 88 = 0 applied + 88 blank.
- `src/lib/coverage.js` unchanged — no government moved 0 → ≥1.
- COLLIN-STANCE-01/02 remain open.
- **222-10 is next: Anna councils (Toten, Bryan, Walden, Baker, Singh — 5) + Murphy councils (Ison, Kelley — 2) = 7 people**, confirmed live at the worklist counts.
- **Pass forward to 222-10:** migration 1424 is free; use a **browser User-Agent** on Ballotpedia; skip VOTE411 and `citizenportal.ai`; use CivicClerk OData where the portal SPA fails; extract PDF `/Author`/`dc:creator` before attributing; and note that **4 of Anna's 6 un-stanced people carry prior 2026-05-12 found-nothing notes** — replacing one with a genuinely sourced chair is a legitimate upgrade, lowering the bar to do so is not.

---
*Phase: 222-collin-county-stances-evidence-only-compass-research-one-pol*
*Completed: 2026-07-25*

## Self-Check: PASSED

- VERIFIED LIVE: all 8 mayors hold **0** `inform.politician_answers` rows after this plan
- VERIFIED: no `1424*` file exists; highest migration prefix on disk is still `1423`
- FOUND: 8 commits `a18fc0cd`…`8c6c1c71`; 8 sections matching `^## City of .* — 222-09`; `## Count: 391`
- VERIFIED FIRST-HAND (orchestrator, not delegated): the Ballotpedia UA control test (403/919b without UA vs 200/105,487b with), the 22-name Frisco/McKinney/Plano sweep, the four completed Candidate Connection surveys, and Maria Tu's 2019 survey text read verbatim
- NOT RUN (and not claimed): the evidence-integrity gate is **vacuous** for this plan — no new rows exist to test. No browse screenshot, no split-section check (222-18 gates). The agent's "settled zero" classification and its per-city minutes-read claims were **not** independently reproduced document-by-document by the orchestrator. Council video was not watched in any of the eight towns.
