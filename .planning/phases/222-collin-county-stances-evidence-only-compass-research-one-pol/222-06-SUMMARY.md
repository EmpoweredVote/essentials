---
phase: 222-collin-county-stances-evidence-only-compass-research-one-pol
plan: 06
subsystem: data
tags: [postgres, supabase, compass-stances, evidence-research, richardson-tx]

# Dependency graph
requires:
  - phase: 222-05
    provides: orchestrator-side-apply pattern, register format, inherited taxes ruling, adjacency-refusal checklist
provides:
  - Richardson (geo_id 4861796) stance migration 1422_222_richardson_stances.sql, AUDIT-ONLY, applied to production — 1 evidence-cited chair
  - Richardson section of 222-CONFIRMED-BLANK.md (10 person/topic blank entries, register Count 154 -> 164)
  - Live-verified finding that the 107-name worklist has NOT drifted, de-risking plans 222-07..222-17
affects: [222-07, 222-18]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A self-audit re-fetch that DEMOTES a stance is the resample contract working as intended, not a research failure — the re-fetch is what established the evidence spanned two chairs without resolving"
    - "Utility-rate statements are not tax statements: an ~8%/yr water and wastewater increase is a fee/rate decision, not a position on the tax-and-spend balance"
    - "Built-out-city infrastructure maintenance is not growth-pace management — same distinction that kept Allen's mayor blank on growth-and-development"

key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/1422_222_richardson_stances.sql"
  modified:
    - ".planning/phases/222-collin-county-stances-evidence-only-compass-research-one-pol/222-CONFIRMED-BLANK.md"

key-decisions:
  - "`residential-zoning` was DEMOTED to blank by the Tier-1 self-audit. Dorian's quotes on middle housing are real and first-person ('We're always taking into consideration that we do need some middle ground housing'), but he never says WHERE it belongs, says nothing about multifamily, neighborhood character, or community votes. The evidence straddles chair 2 and chair 3 without resolving, and chair 3's 'protecting most residential zones' would have had to come from his silence rather than his statements. Blank is the correct outcome."
  - "The same May-2026 middle-housing material was legitimately used as CORROBORATION for the `housing` chair (where his CDBG spending preference is the primary, chair-locating evidence) while being refused as PRIMARY evidence for `residential-zoning`. Corroborating a chair located by other evidence is not the same as locating a chair."
  - "Utility rates refused as `taxes` evidence — the June 8 2026 water/wastewater plan (~8% annual residential increase) is the nearest material and is a rate decision, not a tax-and-spend position. No statement on Richardson's property-tax rate was found at all, and he is absent from the Sept 8 2025 FY26 tax-rate hearing coverage."
  - "Ethnicity/religion inference refused on `civil-rights` — this is the exact defect that got Mayor Amir Omar's and Arefin Shamsul's Richardson rows deleted by the 222-01 county-wide audit; not repeated here."
  - "Chamber of Commerce membership refused for `economic-development`, and Citizens Police & Fire Academy participation plus volunteering refused for `public-safety-approach` — adjacency, not positions."

requirements-completed: []  # COLLIN-STANCE-01/02 advanced, not completed — 222-07 through 222-17 still write under both

coverage:
  - id: D1
    description: "1 evidence-cited compass chair applied to production: Curtis Dorian (Richardson District 1) housing=3, sourced to his own stated preference at the May 18 2026 council work session for spending Richardson's ~$798K CDBG allocation on means-tested senior home repair over competing street/park uses"
    requirement: "COLLIN-STANCE-02"
    verification:
      - kind: sql_gate
        ref: "Named evidence-integrity gate from 222-VALIDATION.md (all 8 predicates incl. the 11-canonical-UUID whitelist), run by the orchestrator against production scoped to politician_id 6b512b29-d3c1-4709-829f-df78664ffee1 — returned 0 rows"
        status: pass
    human_judgment: false
  - id: D2
    description: "10 (person, topic) blank entries recorded in the Richardson section of 222-CONFIRMED-BLANK.md, each naming what material existed and why it does not locate a chair; register Count 154 -> 164"
    requirement: "COLLIN-STANCE-01"
    verification:
      - kind: manual_procedural
        ref: "Orchestrator exactly-one-bucket reconcile at (person, topic) granularity per the 222-01 operator ruling #4: Richardson worklist = 1 person x 11 topics = 11 pairs = 1 applied + 10 blank. No pair in both, no pair in neither."
        status: pass
    human_judgment: false
  - id: D3
    description: "Migration 1422 applied to production live and confirmed present by row-level query; not registered in schema_migrations"
    requirement: "COLLIN-STANCE-02"
    verification:
      - kind: manual_procedural
        ref: "Orchestrator applied via mcp__supabase-local__execute_sql on 2026-07-25 under standing operator pre-authorization. Pre-dispatch live query confirmed Dorian at stance_count 0 and his politician_id matching the worklist verbatim; post-apply query confirmed topic_key housing, value 3 (whole integer), 2 source URLs, paired context row. Structural pre-checks on the file: exactly 1 BEGIN / 1 COMMIT, 1 answers insert, 1 context insert, zero occurrences of the taxes UUID in the SQL body. The applied SQL contained no schema_migrations write."
        status: pass
    human_judgment: true
    rationale: "Live production apply requires the orchestrator's Supabase MCP binding — MCP tools are unbound in every subagent session (222-RESEARCH.md §B execution note 2)"
  - id: D4
    description: "Worklist non-drift established live for all 20 remaining cities, removing the need for per-plan re-derivation in 222-07..222-17"
    requirement: "COLLIN-STANCE-01"
    verification:
      - kind: sql_gate
        ref: "Orchestrator ran the RESEARCH.md §A scope query aggregated per government across all 24 geo_ids: live un-stanced counts match 222-01-WORKLIST.md exactly for every city (104 remaining = 107 - 2 Frisco - 1 Allen), and spot-checked politician_ids for Richardson, Prosper, Celina and Longview match the worklist verbatim"
        status: pass
    human_judgment: false

# Metrics
duration: ~12 min research/authoring (subagent) + orchestrator apply
completed: 2026-07-25
status: complete
---

# Phase 222 Plan 06: Richardson Stance Research Summary

**Richardson's one un-stanced officeholder — Curtis Dorian (District 1) — yielded 1 evidence-cited chair from 11 attempted topics (housing=3, applied live via migration 1422), with 10 honest blanks including one stance the Tier-1 self-audit correctly demoted.**

## Performance

- **Duration:** one research/authoring dispatch on a `general-purpose` subagent (not `gsd-executor`, which has no WebSearch/WebFetch), plus orchestrator-side apply
- **Completed:** 2026-07-25
- **Tasks:** 3 (2 auto + 1 blocking checkpoint, now satisfied)
- **Files modified:** 2 (1 new EV-Accounts migration, 1 essentials register append)

## Accomplishments

- Attempted all 11 canonical topics for the single Richardson worklist name. **1 chair sourced, 10 blank** (91%), consistent with waves 3–5.
- The applied chair is well-anchored: at the **May 18, 2026** council work session on Richardson's Community Development Block Grant participation (~$798K FY2027-28 allocation, ≥70% of which must benefit low/moderate-income residents), Dorian stated his own preference to spend it on housing rather than the competing street, infrastructure and park uses on the table — *"I would like to see [the funds] going into helping repair homes and keep the neighborhoods intact. We are so landlocked, and we do have a lot of neighborhoods that require [rehabilitation], and we have an aging population."* Directing means-tested public subsidy at households who could not otherwise maintain the housing they have is chair 3 (targeted help); chairs 1, 2, 4 and 5 are each ruled out by what he has *not* advocated (no city-built housing, no rent caps or inclusionary requirements, no deregulation-only position).
- **The self-audit did real work.** `residential-zoning` was initially a candidate chair and was **demoted to blank on re-fetch** — see Deviation 1. This is the 222-VALIDATION.md resample contract functioning as designed: the re-verification pass is what surfaced that the evidence never resolves between two chairs.

### Outcome table

| Pairs attempted | Chairs applied | Blanks | Demoted by self-audit | Blank rate |
|---|---|---|---|---|
| 11 | 1 | 10 | 1 | 91% |

### Applied chair

| Person | politician_id | Topic | Chair | Evidence |
|---|---|---|---|---|
| Curtis Dorian (Richardson D1) | `6b512b29-d3c1-4709-829f-df78664ffee1` | housing | 3 | His own stated CDBG spending preference (May 18 2026 work session) for means-tested senior home repair, corroborated by his May 11 2026 reaffirmation of the Envision Richardson affordable-housing objective |

### Adjacency and default traps refused

| Topic | Available material | Why it was not used |
|---|---|---|
| civil-rights | his ethnicity/religion | The exact inference that got Omar's and Shamsul's Richardson rows deleted by the 222-01 audit |
| economic-development | Chamber of Commerce membership; a 2023 "Economic development, infrastructure and revitalization" priority list | Membership is adjacency; a priority list names subjects without locating a chair |
| public-safety-approach | Citizens Police & Fire Academy participation, volunteering | Adjacency — not a staffing, funding, pay, or co-responder position |
| transportation-priorities | "continue building our infrastructure" (Oct 6 2025 bond, bundled with drainage/water) | No mode tradeoff stated; he is not quoted in the Feb 23 2026 DART items. Interurban's "reducing auto uses" refers to auto *businesses* |
| growth-and-development | infrastructure-maintenance argument | Richardson is >95% built out — maintenance is not build-ahead-of-growth pace management |
| local-immigration | Texas SB4 | State law is not his position (the A4 defect) |

## Task Commits

1. **Task 1: Research every un-stanced Richardson officeholder, one politician at a time** — no file writes (research output held for Task 2 per plan design)
2. **Task 2: Author the Richardson migration, self-audit, append the blank register, and commit** — EV-Accounts `2fcda047` (migration 1422, AUDIT-ONLY, **not pushed**); essentials `9ad91134` (register: Richardson section, Count 154 → 164)
3. **Task 3: [BLOCKING] Operator applies the Richardson migration and runs the evidence-integrity gate** — satisfied 2026-07-25 under standing operator pre-authorization. Orchestrator ran structural pre-checks on the file, applied migration 1422 via `mcp__supabase-local__execute_sql`, then ran the named `222-VALIDATION.md` evidence-integrity gate (0 rows) and the exactly-one-bucket reconcile (11 = 1 + 10).

**Plan metadata:** this SUMMARY's commit (below)

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/1422_222_richardson_stances.sql` - AUDIT-ONLY migration, 1 answer/context upsert pair, single BEGIN/COMMIT, dollar-quoted reasoning, 2 source URLs; applied to production, not registered in `schema_migrations`, committed locally on `master` and **not pushed**
- `.planning/phases/222-collin-county-stances-evidence-only-compass-research-one-pol/222-CONFIRMED-BLANK.md` - `## City of Richardson (4861796) — 222-06` section with all 10 blanks and per-topic rationales; migration table row for 1422 flipped AUTHORED → APPLIED; Count 154 → 164

## Decisions Made

See `key-decisions` in frontmatter. The load-bearing one is the `residential-zoning` demotion, detailed below.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — evidence-bar correction] `residential-zoning` demoted from a candidate chair to a blank during the Tier-1 self-audit**
- **Found during:** Task 2 (the mandated 100% cited-source re-fetch, before any SQL was written)
- **Issue:** Dorian's middle-housing statements are genuine and first-person, but the re-verification established that he never identifies *where* middle housing should go, and says nothing about multifamily, neighborhood character, or community approval requirements. The material spans chair 2 ("modest density increases with strong design review") and chair 3 ("multifamily and mixed-use near commercial corridors while protecting most residential zones") without resolving between them — and chair 3's protective clause would have had to be inferred from his silence.
- **Fix:** No `residential-zoning` row written; the topic was moved to the blank register with the reason recorded. The same May-2026 material was still used as *corroboration* for the `housing` chair, which is legitimate — corroborating a chair located by other evidence is not the same as locating a chair.
- **Files modified:** none (the demotion is an absence of a row)
- **Verification:** migration 1422 contains exactly one answers insert and one context insert; the `residential-zoning` UUID does not appear in the SQL body
- **Committed in:** `2fcda047` (the migration reflects the post-demotion state)

### Known-issue notes (not deviations, recorded for 222-18)

**Register heading vs. the plan's literal grep.** Plan 222-06's `<automated>` verify string is `grep -q "^## Richardson"`, but the section is headed `## City of Richardson (4861796) — 222-06` to match the register convention established by 222-03/222-04/222-05 (`## City of Frisco …`, `## City of Allen …`). The literal grep therefore fails while the artifact contract is genuinely satisfied. **The same mismatch exists in plan 222-05 (`^## Allen`) and is expected in later plans.** 222-18's reconcile must match on the city name, not the literal `^## {City}` anchor. Flagged rather than silently ignored, and rather than renaming sections away from the established convention.

## Issues Encountered

**Every `www.cor.net` URL returned HTTP 403.** His official council-member page and the city news/Week-in-Review pages were all unreachable, with a material consequence worth stating plainly: **no agenda packet, no minutes document, and no meeting video was opened for this plan.** Every vote cited is known only through news coverage. A later pass with working `cor.net` access is the most likely route to public-safety and tax-rate remarks this pass could not reach.

**Ballotpedia returned empty bodies** for his individual 2025 candidate page and for `City_elections_in_Richardson,_Texas_(2025)` — the known phase-wide failure mode, recorded as a fetch failure rather than as absence of evidence. No VOTE411/LWV Collin questionnaire exists for Richardson Place 1: he ran **unopposed** on May 3, 2025 (8,009 votes), so no candidate questionnaire appears to have been produced.

**Self-audit caveat, disclosed by the research agent rather than glossed.** WebFetch caches per URL for ~15 minutes, so the 100% re-verification re-ran extraction against the already-fetched page rather than guaranteeing a fresh network read. The verification *questions* were new and were answered from the page text; the quote presence, the Richardson-Texas confirmation, the first-person framing, the CDBG income-eligibility threshold, and the vote date/unanimity were each individually confirmed. Recorded because a re-fetch that may have hit cache is a weaker guarantee than one that provably did not.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Richardson (4861796) is fully reconciled at (person, topic) granularity: 11 pairs = 1 applied + 10 blank.
- `src/lib/coverage.js` needs no change — Richardson already carries `hasContext: true`. Verified orchestrator-side.
- **Worklist non-drift is established live for the whole remaining phase** (coverage item D4): per-government un-stanced counts match `222-01-WORKLIST.md` exactly for all 20 remaining cities, so 222-07..222-17 can take politician_ids from the worklist verbatim without a per-plan re-derivation stall. This is a genuine difference from 222-04, whose gap-list drifted because 222-02's deletions had moved per-person counts; the 107 worklist names are stable precisely because they hold zero rows and nothing has touched them.
- COLLIN-STANCE-01 and COLLIN-STANCE-02 remain open.
- 222-07 is next: Prosper (Doug Charles) + Celina (Shea Scott, Shane Lambert) + Longview (Conley, Moore, Smith, Nustad, Sidney Allen) = **8 people, confirmed live**. This is the first multi-city plan of the remaining set and the first to carry the operator's decision to keep Longview in 222-07 rather than create a 19th plan.
- Note for 222-07: EV-Accounts is now 3 commits ahead of `origin/master`, one of which (`b6f8b6f7`, an FEC amendment double-count fix) belongs to a **concurrent workstream**. Still no push.

---
*Phase: 222-collin-county-stances-evidence-only-compass-research-one-pol*
*Completed: 2026-07-25*

## Self-Check: PASSED

- FOUND: `C:/EV-Accounts/backend/migrations/1422_222_richardson_stances.sql` on disk (9,402 bytes), committed in `2fcda047`, `git -C "C:/EV-Accounts" status --porcelain backend/migrations` clean
- FOUND: commit `9ad91134` in essentials `git log --oneline`
- FOUND: `222-CONFIRMED-BLANK.md` line 1187 `## City of Richardson (4861796) — 222-06`, 10 `- Curtis Dorian` blank bullets counted, `## Count: 164`
- VERIFIED STRUCTURE: 1 BEGIN / 1 COMMIT / 1 answers insert / 1 context insert / 0 occurrences of the taxes UUID in the SQL body
- VERIFIED LIVE: post-apply query returns `housing` / value 3 / 2 sources / paired context row for `6b512b29-d3c1-4709-829f-df78664ffee1`
- VERIFIED LIVE: named evidence-integrity gate returned 0 rows
- NOT RUN (and not claimed): browse-view screenshot, the split-section check, and any visual confirmation that Dorian's compass spoke renders — all are 222-18 close-out gates, not per-plan gates
