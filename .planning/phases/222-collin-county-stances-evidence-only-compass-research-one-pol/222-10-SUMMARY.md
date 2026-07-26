---
phase: 222-collin-county-stances-evidence-only-compass-research-one-pol
plan: 10
subsystem: data
tags: [postgres, supabase, compass-stances, evidence-research, anna-tx, murphy-tx]

# Dependency graph
requires:
  - phase: 222-09
    provides: Ballotpedia browser-UA unlock, PDF /Author attribution control, settled-vs-access-failure classification, all-blank close-out pattern
provides:
  - "All-blank outcome: 77 of 77 (person, topic) pairs honest blanks across Anna's 5 and Murphy's 2 council members; no migration authored, 1424 still unclaimed"
  - Two register sections, register Count 391 -> 468
  - "ANNA MINUTES CRACKED — the CivicClerk unauthenticated OData API, documented in the register so it survives the session. Converts 222-08's Anna access-failure zero into a settled zero."
  - "NEW RISK CLASS: the Ballotpedia UA unlock exposes real, fully-populated, WRONG-PERSON pages. ballotpedia.org/Jessica_Walden is a Georgia House candidate with a party label."
affects: [222-11, 222-12, 222-13, 222-14, 222-15, 222-16, 222-17, 222-18]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A CivicClerk portal that renders an empty SPA still serves everything through its unauthenticated OData API: /v1/Events?$filter=… (key access Events(id) 404s — you must $filter), each event carrying inline publishedFiles[], then GetMeetingFileStream(fileId=N,plainText=false)"
    - "Action minutes (mover, seconder, tally, no reasoning) are a STRUCTURAL explanation for a city-wide zero, not a research shortfall — worth stating explicitly because it converts an open question into a closed one"
    - "Unlocking a source can introduce a homonym risk it did not previously have: a 403 yields nothing, but a working fetch can yield a confident, populated page about the wrong person"
    - "Read the staff report behind a motion before scoring it — an FTE addition that looks like a funding increase can be a military-leave backfill with no General Fund impact"

key-files:
  created: []
  modified:
    - ".planning/phases/222-collin-county-stances-evidence-only-compass-research-one-pol/222-CONFIRMED-BLANK.md"

key-decisions:
  - "NO MIGRATION AUTHORED — third consecutive all-blank plan (222-08, 222-09, 222-10, plus the Plano gap-closure insert). 1424 remains unclaimed by all four."
  - "REFUSED Kelley/public-safety-approach and Ison/public-safety-approach despite Kelley MOVING and Ison SECONDING 'the addition of 1 FTE position within the Police Department' (2026-06-02, 7-0) — a named, affirmative, on-topic sponsorship that looked like a clean chair 4. The staff report behind it shows a backfill for an officer on 12-month military leave with 'no anticipated financial impact to the General Fund'. Maintenance of existing strength, not an increase."
  - "REFUSED Toten's twin lone dissents (2025-09-09, 6-1) against Anna's FY2026 property-tax revenue increase and rate — both entirely unexplained, and he voted FOR the budget they fund (7-0). An unexplained dissent cannot locate a chair, and taxes is ruled out regardless."
  - "REFUSED Walden's P&Z chairmanship and construction career, Singh's EDC vice-presidency, Toten's 'Light the Town Blue' and First Responders Feast, Baker's omnibus budget motion, and Kelley's 20-year Dallas PD career — all adjacency, the named defect class."
  - "Anna's zeros are RECLASSIFIED from 222-08's access-failure to SETTLED. Anna's minutes are pure action minutes — mover, seconder, tally, no reasoning — which is a structural reason no compass position can be recovered from them, not a failure to look."

requirements-completed: []

coverage:
  - id: D1
    description: "Zero stances written — 77 of 77 (person, topic) pairs across 7 council members are honest blanks; no migration file exists"
    requirement: "COLLIN-STANCE-02"
    verification:
      - kind: sql_gate
        ref: "Orchestrator queried production after the plan: Toten, Bryan, Walden, Baker, Singh, Ison, Kelley all at 0 answer rows. Evidence-integrity gate vacuous (no new rows). Highest migration prefix on disk still 1423; `git -C C:/EV-Accounts status --porcelain backend/migrations` clean."
        status: pass
    human_judgment: false
  - id: D2
    description: "77 blank entries across two register sections (11 per person); register Count 391 -> 468"
    requirement: "COLLIN-STANCE-01"
    verification:
      - kind: manual_procedural
        ref: "Reconcile at (person, topic) granularity: 7 x 11 = 77 = 0 applied + 77 blank. Sections verified at L6242 (Anna) and L6678 (Murphy); `## Count: 468` = 391 + 77."
        status: pass
    human_judgment: false
  - id: D3
    description: "Anna's minutes corpus opened via the CivicClerk OData API — 400 events enumerated back to 2024-03, 119 agendas and 9 packets extracted"
    requirement: "COLLIN-STANCE-01"
    verification:
      - kind: manual_procedural
        ref: "Agent-reported, with the full method written into the register. Not independently reproduced by the orchestrator. The corroborating outcome is that all three Anna people carrying prior 2026-05-12 found-nothing notes were independently re-confirmed blank."
        status: pass
    human_judgment: true
    rationale: "Whether the corpus was read exhaustively is an agent self-report; 17 scanned 2024 minutes PDFs lacking a text layer were explicitly NOT read"

# Metrics
duration: ~56 min research (subagent, 7 people sequential) + orchestrator verification
completed: 2026-07-25
status: complete
---

# Phase 222 Plan 10: Anna + Murphy Councils — All-Blank, and Anna's Minutes Cracked

**Zero chairs from 77 pairs across seven council members — the third consecutive all-blank plan — but it closed a retry path open since wave 8 by reaching Anna's minutes through an undocumented CivicClerk OData API, and it caught a new hazard the Ballotpedia unlock created.**

## Performance

- **Duration:** one research dispatch on a `general-purpose` subagent, 7 people one at a time, committed per city
- **Completed:** 2026-07-25
- **Tasks:** 3 (2 auto + 1 blocking checkpoint — **Task 3's apply step is a no-op; no SQL exists**)
- **Files modified:** 1 (`222-CONFIRMED-BLANK.md`) across 2 commits
- **EV-Accounts:** untouched — no commit, no file, 1424 still free

## Accomplishments

- **All 7 attempted across all 11 topics. 0 chairs, 77 blanks. All seven zeros SETTLED.**
- **Anna's minutes cracked** — the single most durable output of this plan. Wave 8 recorded "no Anna minute was read": `AgendaCenter` 404s (Anna does not use it), Laserfiche returns "Cookies are not enabled", the CivicClerk SPA renders nothing. All three of those remain true — but the SPA's **unauthenticated OData API** serves the whole corpus. The agent enumerated **400 events back to 2024-03** and extracted **119 agendas and 9 packets**; minutes ride inside the "Agenda Packet" PDFs as consent attachments. The full method is written into the register so it outlives this session.
- **And the answer Anna's minutes give is structural:** they are pure **action minutes** — mover, seconder, tally, no reasoning recorded. That is *why* Anna yields nothing, and it converts 222-08's open access-failure into a closed, settled zero for the whole city.
- **Independent corroboration of the prior pass.** Toten, Bryan and Singh each carry 8 found-nothing notes from an independent 2026-05-12 research pass. All three were re-confirmed blank here from a different source base (minutes rather than `annatexas.gov` and campaign material) — two independent passes, two and a half months apart, same conclusion.
- **`homelessness` and `local-immigration` are structural blanks in both cities** — zero such items exist anywhere in Anna's 119-agenda corpus or in any Murphy document read. That is a stronger statement than "nothing found."

### Outcome table

| City | People | Pairs | Chairs | Blanks | Zeros |
|---|---|---|---|---|---|
| Anna (4803300) | 5 | 55 | 0 | 55 | all settled |
| Murphy (4850100) | 2 | 22 | 0 | 22 | all settled |
| **Total** | **7** | **77** | **0** | **77** | |

## The refusal worth reading

**Kevin Kelley MOVED and Debbie Ison SECONDED "the addition of 1 FTE position within the Police Department"** (Murphy, 2026-06-02, carried 7-0). A named, affirmative, individually-attributable sponsorship of a police staffing increase — on its face a clean chair 4 on `public-safety-approach`, and for two people at once.

**The staff report behind it kills it.** The position is a **backfill for an officer on 12-month military leave**, with "**no anticipated financial impact to the General Fund**." That is maintenance of existing strength, not an increase in staffing, equipment or pay. Scoring it would have put a "wants more police funding" chair on two public profiles on the strength of a personnel placeholder.

The generalisable lesson: **read the staff report behind a motion before scoring the motion.** An agenda line item states what was voted on, not what it means.

Two further live calls, both refused: Ison's *"proactive, long-term planning… staying ahead of regional growth pressures"* (equally compatible with growth chairs 2 and 3, and it is maintenance framing about *other cities'* growth), and Kelley's *"keep pace while protecting the character of our community"* (refused across growth, transportation **and** residential-zoning — the same shared-vocabulary trap that kept Fairview's mayor blank in 222-08).

## ⚠️ New risk class: the Ballotpedia unlock cuts both ways

Wave 9 established that Ballotpedia's phase-wide "empty body" was a User-Agent block. This plan found the cost of fixing it:

**`ballotpedia.org/Jessica_Walden` resolves 200 with a fully-populated 144 KB page — and it is Jessica Walden (D), Georgia House District 144, who lost on 2018-11-06.**

Under the old 403 that page was simply unreachable and harmless. Now it returns confidently, in depth, with campaign content **and a party label** — and would have produced fabricated stances *plus* a partisanship contamination in a phase whose core promise is that party is never used and never displayed. This is the second such trap after wave 9's Mississippi Jim Atchison.

**Binding on 222-11 through 222-17: a 200 from Ballotpedia is not identity confirmation.** Confirm the office, the state and the city on the page itself before using a single word of it. `ballotpedia.org/Kevin_Kelley` correctly returned a disambiguation page — that is the benign case; the dangerous case is the one that looks certain.

**Ballotpedia's actual yield here:** 6 of 7 have real disambiguated pages, **0 of 7 completed a Candidate Connection survey**. Its genuine value was reproducing Murphy's two campaign-website platforms verbatim — including Kelley's, whose live site is unreachable. Consistent with the Plano insert's finding that the UA block cost little.

## Task Commits

1. **Task 1 — Anna council (5 people)** — `ed47ae8b`, register + Count 391→446
2. **Task 2 — Murphy council (2 people)** — `95eb657a`, register + close-out block, Count 446→468
3. **Task 3: [BLOCKING] Operator applies the migration** — **no-op, correctly.** No SQL exists. Orchestrator verified the negative (all 7 still at 0 answer rows), confirmed 1424 free and EV-Accounts clean.

**Plan metadata:** this SUMMARY's commit (below)

## Files Created/Modified

- `.planning/phases/222-collin-county-stances-evidence-only-compass-research-one-pol/222-CONFIRMED-BLANK.md` — Anna section (L6242) and Murphy section (L6678) with all 77 blanks and per-topic rationales; the CivicClerk OData method documented for reuse; a `NOT AUTHORED` migration row and close-out block. Count 391 → 468
- **No EV-Accounts files.**

## Deviations from Plan

**1. [Rule 2 — no artifact produced] No migration authored.** Zero surviving stances; per the plan's own rule no file was created and 1424 was not claimed. Documented terminal state.

### Known-issue notes (carried for 222-18)

- **1424 is STILL free** after four consecutive non-authoring passes. 222-11 must re-derive.
- Register headings follow the `## City of {Name} ({geo_id}) — 222-10` convention; the plans' literal `^## {City}` greps do not match. 222-18 must match on city name.
- No government has moved 0 → ≥1 in this phase; `coverage.js` Pitfall 5 remains untriggered.
- **Recommend CLOSING `gathergov.com` as a source** (403, and likely another AI-synthesis site of the `citizenportal.ai` class) rather than carrying it as a retry.

## Issues Encountered

**Sources that could not be read, with retry paths:** Anna's **17 scanned 2024 minutes PDFs** have no text layer and would need OCR — the one genuinely open Anna gap remaining; `annamatters.com` sub-pages (domain dead; only the root exists in Wayback); Anna's Swagit council video; `votekevinkelley.com` (**TLS handshake failure**, HTTP 409 over plain HTTP, and **no Wayback capture at all** — Ballotpedia's reproduction of his platform is the only surviving copy); Facebook pages; `gathergov.com` (403); `lwvcollin.org`/VOTE411 (403, correctly not retried per the standing note).

**Misattribution guarded against in a six-candidate article.** The Murphy Monitor printed six candidates' material together; the agent explicitly avoided cross-attributing **Andrew Chase's** turn-lane and signal material to Ison — he is the incumbent she beat and his section runs directly above hers — and **Laura Deel's** and **Manoj Varghese's** growth language to Kelley. It also declined to reuse the Bisnow "Destination Anna" quotes that belong to former mayor **Nate Pike** (2021), which 222-08 had already caught.

## User Setup Required

None.

## Next Phase Readiness

- Both cities reconcile: Anna 5 × 11 = 55 = 0 + 55; Murphy 2 × 11 = 22 = 0 + 22.
- `coverage.js` unchanged — no government moved 0 → ≥1.
- COLLIN-STANCE-01/02 remain open.
- **222-11 is next: Fairview councils (Connelly, Boggs, Hawkins, Stanley, Sheehan, Works — 6) + Princeton councils (Todd, Washington, Rutledge — 3) = 9 people**, all confirmed live at 0 stances. Fairview's mayor was done in 222-08; Princeton's mayor and four other members are already stanced and out of scope under D-07.
- **Pass forward to 222-11:** 1424 free; Ballotpedia works with a browser UA **but a 200 is not identity confirmation**; skip VOTE411, `citizenportal.ai` and `gathergov.com`; Fairview's minutes are reachable via **CivicClerk OData** (proved in 222-08) but are **action-only**, so its MP3 audio archive is the only route to Fairview quotes; **Todd and Washington carry prior 2026-05-12 found-nothing notes**, Rutledge does not.
- Fairview is the more promising of the two: 222-08 found it has genuinely contested, well-covered development fights, and its mayor produced the strongest single piece of evidence in that plan (even though it was ultimately off-scale).

---
*Phase: 222-collin-county-stances-evidence-only-compass-research-one-pol*
*Completed: 2026-07-25*

## Self-Check: PASSED

- VERIFIED LIVE: all 7 council members hold **0** `inform.politician_answers` rows after this plan
- VERIFIED: highest migration prefix on disk is `1423`; no `1424*` file; `git -C "C:/EV-Accounts" status --porcelain backend/migrations` empty
- FOUND: commits `ed47ae8b`, `95eb657a`; sections at L6242 and L6678; `## Count: 468`
- NOT RUN (and not claimed): evidence-integrity gate is **vacuous** — no new rows to test. No browse screenshot, no split-section check (222-18 gates). The orchestrator did **not** independently reproduce the CivicClerk OData enumeration or re-read the 119 agendas; those are agent self-reports. Anna's 17 scanned 2024 minutes PDFs were **not** read (no text layer), and no council video was watched in either city.
