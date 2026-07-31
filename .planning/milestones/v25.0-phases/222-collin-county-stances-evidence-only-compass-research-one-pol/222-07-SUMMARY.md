---
phase: 222-collin-county-stances-evidence-only-compass-research-one-pol
plan: 07
subsystem: data
tags: [postgres, supabase, compass-stances, evidence-research, prosper-tx, celina-tx, longview-tx]

# Dependency graph
requires:
  - phase: 222-06
    provides: orchestrator-side-apply pattern, register format, utility-rates-are-not-taxes rule, built-out-maintenance-is-not-growth-pace rule, demotion precedent
provides:
  - Prosper/Celina/Longview migration 1423_222_prosper_celina_stances.sql, AUDIT-ONLY, applied to production — 4 evidence-cited chairs across 3 of 8 people
  - Three register sections (Prosper 11, Celina 20, Longview 53 = 84 blanks), register Count 164 -> 248
  - A caught fabrication: a WebSearch summary attributed another member's motion and quote to Doug Charles; the primary minutes PDF disproved it (see Deviation 1)
  - Longview closed out, discharging the operator's 2026-07-25 keep-in-222-07 decision — no 19th plan needed
affects: [222-08, 222-18]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Read the primary minutes PDF, do not trust a search-layer summary of who made a motion. A search summary invented a clean, quotable chair for the wrong council member — a within-city misattribution that no homonym/city gate would ever catch."
    - "A recorded roll-call vote named in official minutes can carry a chair on its own, with no quote from the member, provided the ordinance's own text discriminates between adjacent chairs (here: no graduated warnings and no shelter obligation is what separates chair 5 from chair 4)"
    - "Re-verify outside the ~15-minute WebFetch cache window, or say plainly that the re-fetch may have hit cache. A same-minute re-fetch is not an independent read."
    - "Wrong-state homonym risk is not limited to people: Longview, WASHINGTON has its own city council and its own local paper (tdn.com), and surfaces on the same queries as Longview, Texas"

key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/1423_222_prosper_celina_stances.sql"
  modified:
    - ".planning/phases/222-collin-county-stances-evidence-only-compass-research-one-pol/222-CONFIRMED-BLANK.md"

key-decisions:
  - "REJECTED A FABRICATED CHAIR. A WebSearch summary asserted that Doug Charles made the motion approving the Bella Prosper rezoning and said 'I greatly appreciate the removal of the multifamily. That was my large hesitation.' The official June 9 2026 minutes PDF, read directly, shows the motion was Mayor Pro-Tem Bartley's, seconded by Kern, and the multifamily remark belongs to Councilmember Marcus E. Ray. Charles merely 'shared their appreciation.' Had this been accepted, a public civic profile would have carried another person's words — the exact T-222-05 repudiation threat this phase is built to prevent."
  - "DEMOTED — Shea Scott / growth-and-development. Verification asked directly whether he calls for slowing approvals AND whether he calls for investing ahead of growth, and BOTH are true: chair 2 ('We must slow down incentive-driven development'; growth 'outpacing our infrastructure') and chair 3 ('infrastructure leads growth instead of chasing it'; 'public safety is planned ahead of growth'). Unresolvable between two chairs -> blank."
  - "Shannon Moore's recorded NO vote on Ordinance 4495 produced a BLANK, not a low chair. A no vote with no stated reason cannot distinguish chairs 1, 2 and 3, and she has not sought repeal of the pre-existing public-camping ban. Refusing to read direction into an unexplained dissent is the same discipline as refusing to read it into party."
  - "Doug Charles / residential-zoning left blank despite unusually specific campaign text ('Mixed-use commercial developments (retail, dining, office—NOT apartments)'), because he then voted 6-0 on 2026-06-09 to approve a PD with 86 townhomes by right — contradicting chair 1's community-vote clause — and never addresses duplexes or ADUs. Platform text and recorded votes pointing at different chairs is a blank, not a tiebreak."
  - "Shane Lambert left fully blank; his only substantive source (Community Impact's March 16 2026 Place 5 questionnaire) is truncated mid-sentence by the publisher in 3 of its 4 answers, and 'Thoughtful incentives' is a qualifier, not a chair. Chair 3 would have been a defaulted middle value."
  - "Longview kept in 222-07 as an 8-person plan per the operator's 2026-07-25 decision; Mayor Kristen Ishihara (9 topics) and Jody Berryhill (2 topics) remain out of scope as partially stanced under D-07 and none of their rows was read or modified."

requirements-completed: []  # COLLIN-STANCE-01/02 advanced, not completed — 222-08 through 222-17 still write under both

coverage:
  - id: D1
    description: "4 evidence-cited compass chairs applied to production across 3 of 8 people: Shea Scott (Celina P4) economic-development=1 and public-safety-approach=4; Derrick Conley (Longview D1) homelessness=5; John Nustad (Longview D4) homelessness=5"
    requirement: "COLLIN-STANCE-02"
    verification:
      - kind: sql_gate
        ref: "Named evidence-integrity gate from 222-VALIDATION.md (all 8 predicates incl. the 11-canonical-UUID whitelist), run by the orchestrator against production scoped to all 8 of this plan's politician_ids — returned 0 rows. A companion count confirmed exactly 4 answer rows exist across the 8, i.e. the 5 fully-blank people hold zero rows."
        status: pass
    human_judgment: false
  - id: D2
    description: "84 (person, topic) blank entries recorded across three register sections — Prosper 11, Celina 20, Longview 53; register Count 164 -> 248"
    requirement: "COLLIN-STANCE-01"
    verification:
      - kind: manual_procedural
        ref: "Orchestrator exactly-one-bucket reconcile at (person, topic) granularity: 8 people x 11 topics = 88 pairs = 4 applied + 84 blank. Per city: Prosper 11 = 0 + 11; Celina 22 = 2 + 20; Longview 55 = 2 + 53. No pair in both, no pair in neither."
        status: pass
    human_judgment: false
  - id: D3
    description: "Migration 1423 applied to production live and confirmed present by row-level query; not registered in schema_migrations"
    requirement: "COLLIN-STANCE-02"
    verification:
      - kind: manual_procedural
        ref: "Orchestrator applied via mcp__supabase-local__execute_sql on 2026-07-25 under standing operator pre-authorization. Structural pre-checks on the file: 1 BEGIN / 1 COMMIT, 4 answers inserts, 4 context inserts, 8 ON CONFLICT clauses; the taxes UUID and the politician_ids of the 5 blank people appear ONLY in header comments, never in a VALUES clause (verified by line-anchored grep). Pre-apply query confirmed all 3 receiving politicians at zero existing rows. Post-apply query confirmed all 4 rows live with paired context and 2-3 sources each. The applied SQL contained no schema_migrations write."
        status: pass
    human_judgment: true
    rationale: "Live production apply requires the orchestrator's Supabase MCP binding — MCP tools are unbound in every subagent session"
  - id: D4
    description: "Longview (Gregg County, bundled into the TX browse list) fully dispositioned, discharging operator decision #2 from 222-01"
    requirement: "COLLIN-STANCE-01"
    verification:
      - kind: manual_procedural
        ref: "All 5 un-stanced Longview officeholders individually attempted against all 11 topics; 2 chairs applied, 53 blanks registered. The 2 partially-stanced Longview officeholders (Ishihara, Berryhill) confirmed untouched — the plan's 4 applied rows belong to 3 people, none of them Ishihara or Berryhill."
        status: pass
    human_judgment: false

# Metrics
duration: ~36 min research/authoring (subagent, 8 people sequential) + orchestrator apply
completed: 2026-07-25
status: complete
---

# Phase 222 Plan 07: Prosper + Celina + Longview Stance Research Summary

**4 evidence-cited chairs applied across 3 of 8 officeholders (88 pairs attempted, 84 honest blanks), and — more valuable than the chairs — a fabricated quote caught and killed by reading the primary minutes PDF instead of trusting a search summary.**

## Performance

- **Duration:** one research/authoring dispatch on a `general-purpose` subagent, 8 people processed strictly one at a time, committed per city; plus orchestrator-side apply
- **Completed:** 2026-07-25
- **Tasks:** 3 (2 auto + 1 blocking checkpoint, now satisfied)
- **Files modified:** 2 (1 new EV-Accounts migration, 1 essentials register with three appended sections)

## Accomplishments

- **88 pairs attempted → 4 chairs, 84 blanks (95% blank).** 5 of 8 people ended fully blank. Consistent with waves 3–6 (12 chairs from 152 pairs) and the expected D-04 outcome.
- **Caught a fabrication that would have put another person's words on a public profile.** See Deviation 1 — this is the single most important result of the plan, worth more than the 4 chairs.
- **Longview closed out.** All 5 un-stanced Longview officeholders attempted, discharging the operator's 2026-07-25 decision to keep Longview inside 222-07 rather than spin up a 19th plan. Both Longview chairs rest on a roll call recorded **by name** in the official signed minutes, read directly as a PDF.
- **Caught a wrong-state homonym class nobody had flagged: Longview, WASHINGTON.** A `tdn.com` story about a "Longview council" camping-adjacent ordinance, quoting "council member Ruth Kendall," was surfaced by search — no Ruth Kendall sits on Longview *Texas*'s council. Three further Washington sources (OPB, klog.com, longviewlibrary.org) were rejected the same way. Every Texas source was confirmed by an explicit marker (Gregg County appraisal district, Jo Ann Metcalf Municipal Building, City of Longview Texas seal).

### Outcome table

| City | People | Pairs | Chairs | Blanks | Fully-blank people |
|---|---|---|---|---|---|
| Town of Prosper (4859696) | 1 | 11 | 0 | 11 | 1 |
| City of Celina (4813684) | 2 | 22 | 2 | 20 | 1 |
| City of Longview (4843888) | 5 | 55 | 2 | 53 | 3 |
| **Total** | **8** | **88** | **4** | **84** | **5** |

### Applied chairs

| Person | politician_id | Topic | Chair | Evidence |
|---|---|---|---|---|
| Shea Scott (Celina P4) | `91128e4f-94f6-4119-8087-4449ee16964a` | economic-development | 1 | His own CI questionnaire (Mar 16 2026): "I will prioritize funding for essential services over taxpayer incentives for private developers" + "We must slow down incentive-driven development" |
| Shea Scott (Celina P4) | `91128e4f-94f6-4119-8087-4449ee16964a` | public-safety-approach | 4 | Star Local Media (Apr 17 2026): "I'll advocate for data-driven staffing models tied to response times, call volumes and competitive salaries" |
| Derrick Conley (Longview D1) | `c723b079-c7db-4376-b8d3-72ac896fefe2` | homelessness | 5 | Recorded Yes on Ordinance 4495 (May 23 2024), roll call by name in signed minutes, carried 5-2 |
| John Nustad (Longview D4) | `94957758-20db-4590-8cc9-ce54c24e2449` | homelessness | 5 | Same recorded Yes on Ordinance 4495 |

**Why the two Longview votes are chair 5 and not chair 4.** Ordinance 4495 added Article VIII to Chapter 58, prohibiting sleeping outside on *private* property with a criminal penalty up to $2,000. Longview already banned camping and sleeping on public property, so the vote closed the last place a person could lawfully sleep outdoors. Chair 4 requires graduated warnings *and* an obligation to maintain basic shelter options; the ordinance has neither. That textual absence is what discriminates the chairs — which is why a recorded vote with no member quote can still carry a chair here.

### Notable refusals (each one a chair not taken)

| Person | Topic | Material | Why blank |
|---|---|---|---|
| Doug Charles (Prosper) | residential-zoning | Platform: "Mixed-use commercial developments (retail, dining, office—**NOT apartments**)" — but voted 6-0 on 2026-06-09 to approve a PD with 86 townhomes by right | Platform text and recorded vote point at different chairs; never addresses duplexes/ADUs. Contradiction is a blank, not a tiebreak |
| Shannon Moore (Longview) | homelessness | Recorded **No** vote on Ordinance 4495 | An unexplained dissent cannot distinguish chairs 1/2/3, and she has not sought repeal of the pre-existing ban. Same discipline as refusing party inference |
| Brandon Smith (Longview) | civil-rights | NAACP forum attendance | Attendance is adjacency, not a position |
| Brandon Smith (Longview) | public-safety-approach | "they're not seeing a lot of patrolling" | Relays constituent perception, not his own position |
| Sidney Allen (Longview) | (all) | Every recorded remark is fee ratemaking — fire lift-assist $250, Maude Cobb discount, credit-card fees, water/trash | Fee ratemaking is not a compass position; also refused as taxes evidence per the 222-06 rule |
| Shane Lambert (Celina) | economic-development | "Thoughtful incentives for new developers as well as our small business owners" | "Thoughtful" is the only qualifier; chair 3 would be a defaulted middle value |

## Task Commits

Committed per city so an interruption would cost at most one city's work:

1. **Task 1: Research all 8, one politician at a time** — no file writes (research held for Task 2)
2. **Task 2: Author migration, self-audit, append register, commit** — essentials `958be5df` (Prosper register, 11 blanks), `108b6f22` (Celina register, 20 blanks), `fcfcf1d5` (Longview register, 53 blanks, Count → 248); EV-Accounts `aac1f50c` (migration 1423 with Prosper + Celina blocks), `975b2d10` (Longview block completes it). All three essentials commits verified to touch **only** `222-CONFIRMED-BLANK.md`.
3. **Task 3: [BLOCKING] Operator applies the migration and runs the evidence-integrity gate** — satisfied 2026-07-25 under standing operator pre-authorization. Orchestrator ran line-anchored structural pre-checks, applied migration 1423 via `mcp__supabase-local__execute_sql`, then ran the named gate (0 rows), a total-row-count check (exactly 4 across the 8 people), and the exactly-one-bucket reconcile (88 = 4 + 84).

**Plan metadata:** this SUMMARY's commit (below)

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/1423_222_prosper_celina_stances.sql` - AUDIT-ONLY migration, 30,501 bytes, single BEGIN/COMMIT, 4 answer/context upsert pairs strictly alternating, all reasoning dollar-quoted with `$stz$`, 2-3 source URLs per row; documents all 5 zero-row people and the taxes ruling in header comments only. Applied to production, not registered in `schema_migrations`, committed locally on `master` and **not pushed**
- `.planning/phases/222-collin-county-stances-evidence-only-compass-research-one-pol/222-CONFIRMED-BLANK.md` - three new sections (`## Town of Prosper (4859696) — 222-07` L1347, `## City of Celina (4813684) — 222-07` L1519, `## City of Longview (4843888) — 222-07` L1764) with all 84 blanks and per-topic rationales; migration table row for 1423 flipped AUTHORED → APPLIED; Count 164 → 248

## Decisions Made

See `key-decisions` in frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — critical evidence defect] A search-layer fabrication attributed another council member's motion and quote to Doug Charles, and was rejected on the primary source**
- **Found during:** Task 1/2 (the mandated Tier-1 100% re-fetch for Prosper)
- **Issue:** A WebSearch summary asserted that Doug Charles made the motion approving the Bella Prosper rezoning and said *"I greatly appreciate the removal of the multifamily. That was my large hesitation."* That is a clean, quotable, chair-locating statement — exactly the shape of evidence this phase wants, and it was **not his**.
- **Fix:** The agent pulled the official **June 9, 2026 minutes PDF** and read all 6 pages. The motion was **Mayor Pro-Tem Bartley's**, seconded by **Kern**; the multifamily remark belongs to **Councilmember Marcus E. Ray**. Charles is recorded only as having "shared their appreciation." The candidate chair was discarded and `residential-zoning` left blank.
- **Why this matters more than the chairs:** this is a **within-city misattribution** — the homonym/city gate that protects against wrong-person errors would never have caught it, because the city was right and only the speaker was wrong. It is threat **T-222-05** (Repudiation: fabricated or mismatched source) landing for real, and it was stopped by the one control that works against it: reading the primary document.
- **Files modified:** none (the rejection is an absence of a row)
- **Verification:** migration 1423 contains no `48500428-…` (Charles) VALUES clause — his politician_id appears only in header comments
- **Committed in:** `958be5df` (register records the rejection and the correct attribution)

**2. [Rule 1 — evidence-bar correction] `Shea Scott / growth-and-development` demoted to blank**
- **Found during:** Task 2 self-audit
- **Issue:** Direct verification questions established that Scott satisfies chair 2 *and* chair 3 simultaneously — he calls for slowing approvals ("We must slow down incentive-driven development"; growth "unsustainable", "outpacing our…infrastructure") **and** for investing ahead of growth ("a city where infrastructure leads growth instead of chasing it"; "public safety is planned ahead of growth, not responding after the fact").
- **Fix:** No row written; moved to the register with the reason recorded. This is the second demotion in two waves and, as in 222-06, the re-verification pass is what surfaced it.
- **Files modified:** none
- **Verification:** the `growth-and-development` UUID does not appear in any VALUES clause in migration 1423
- **Committed in:** `108b6f22`

### Known-issue notes (carried for 222-18)

- **Register heading vs. the plan's literal grep** — as recorded in 222-06: the plan's `<automated>` greps anchor on `^## Prosper` / `^## Celina` / `^## Longview`, while sections follow the established `## Town of Prosper (4859696) — 222-07` convention. Artifact contract satisfied; literal grep not. 222-18 must match on city name, not the `^## {City}` anchor.
- **EV-Accounts is now 4 commits ahead of `origin/master`**, two of which (`ceb9afc1`, `ba6be0e8` — FEC amendment-backlog work) belong to a **concurrent workstream** and appeared mid-session. Still no push, and none of those commits was touched.

## Issues Encountered

**Self-audit cache disclosure, volunteered rather than glossed.** The first Celina re-fetch pass ran only minutes after the initial fetch and **may have hit the ~15-minute WebFetch cache**, so a second, later re-verification of both Celina stances was run — those two are cache-clean. The Prosper and Longview conclusions rest on **PDFs read directly with the Read tool**, not on WebFetch extraction, so the cache question does not apply to them.

**A secondary-source discrepancy corrected against the primary.** A search summary reported the Ordinance 4495 vote as "4-2"; the signed minutes record **5-2** with the roll call by name. The minutes were used.

**Sources unreadable this session.** Ballotpedia individual pages returned **empty bodies** for Doug Charles, Shea Scott, Shane Lambert and Brandon Smith (the known phase-wide failure). Star Local Media returned **HTTP 429** on one attempt, though its Place 4 profile did load. No VOTE411/LWV Collin questionnaire exists for any of these seats. **Community Impact truncates 3 of Shane Lambert's 4 questionnaire answers mid-sentence** — the single biggest recoverable gap in the plan. celinaradio.com's April 18 2026 Lambert interview is audio-only with no transcript. Longview's official council pages carry **no biography at all** for any of the five. No questionnaire exists for Nustad or Allen: both their elections were **cancelled** for lack of an opponent.

**Named follow-on: Longview is the highest-yield city for a future pass.** Only 3 of Longview's roughly-twice-monthly meetings were read, and its minutes are **near-verbatim** — unusually rich for locating explicit positions. All council and candidate-forum **video** across all three cities went unwatched. Sidney Allen's nine pre-2016 years were deliberately not mined as stale.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three cities reconcile at (person, topic) granularity: Prosper 11 = 0 + 11, Celina 22 = 2 + 20, Longview 55 = 2 + 53.
- `src/lib/coverage.js` needs no change — Prosper, Celina and Longview all already carry `hasContext: true`. Verified orchestrator-side. **No government in the phase so far has moved 0 → ≥1, so Pitfall 5 has not yet been triggered by any plan.**
- COLLIN-STANCE-01 and COLLIN-STANCE-02 remain open.
- **222-08 is next: the D-02 mayors sweep, part A.** Note a discrepancy the executor must respect: the plan's own objective names 8 mayors (Anna, Murphy, Fairview, Princeton, Melissa, Farmersville, Parker, Lucas), but the 222-01 live worklist and its per-plan assignment table cut this to **5** — Murphy, Princeton and Melissa's mayors are **already stanced** and therefore out of scope under D-07. The live worklist governs: **Pete Cain (Anna), John Hubbard (Fairview), Craig Overstreet (Farmersville), Lee Pettle (Parker), Dusty Kuykendall (Lucas)**. The same cut applies to 222-09's part B, which the worklist confirms at the full 8.
- Tier expectation drops sharply from here: 222-08 covers Medium/Low/Very-low tier towns, and 222-09 onward is almost entirely the Tier "very low" set that Phase 221 independently found has text-only rosters. Expect mostly honest blanks.

---
*Phase: 222-collin-county-stances-evidence-only-compass-research-one-pol*
*Completed: 2026-07-25*

## Self-Check: PASSED

- FOUND: `C:/EV-Accounts/backend/migrations/1423_222_prosper_celina_stances.sql` on disk (30,501 bytes), committed in `aac1f50c` + `975b2d10`, `git -C "C:/EV-Accounts" status --porcelain backend/migrations` clean
- FOUND: commits `958be5df`, `108b6f22`, `fcfcf1d5` in essentials `git log --oneline`; `git show --stat` confirms each touches only `222-CONFIRMED-BLANK.md`
- FOUND: register sections at L1347 (Prosper), L1519 (Celina), L1764 (Longview); `## Count: 248` (164 + 84)
- VERIFIED STRUCTURE: 1 BEGIN / 1 COMMIT / 4 answers / 4 context / 8 ON CONFLICT; line-anchored grep confirms the taxes UUID and the 5 blank people's politician_ids appear only in `--` comment lines, never in a VALUES clause
- VERIFIED LIVE: post-apply query returns exactly 4 rows across the 8 politician_ids — Scott economic-development=1 (2 src), Scott public-safety-approach=4 (2 src), Conley homelessness=5 (3 src), Nustad homelessness=5 (3 src) — each with a paired context row
- VERIFIED LIVE: named evidence-integrity gate returned 0 rows
- NOT RUN (and not claimed): browse-view screenshot, the split-section check, and any visual confirmation that the 4 new spokes render — all are 222-18 close-out gates. No council or candidate-forum video was watched. Only 3 of Longview's meetings were read.
