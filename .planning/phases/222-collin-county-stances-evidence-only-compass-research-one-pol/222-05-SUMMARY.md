---
phase: 222-collin-county-stances-evidence-only-compass-research-one-pol
plan: 05
subsystem: data
tags: [postgres, supabase, compass-stances, evidence-research, allen-tx]

# Dependency graph
requires:
  - phase: 222-04
    provides: taxes-unanswerable operator ruling, bio-page-only defect class, dispatch-to-general-purpose-subagent pattern, orchestrator-side-apply pattern
provides:
  - Allen (geo_id 4801924) stance migration 1421_222_allen_stances.sql, AUDIT-ONLY, applied to production — 1 evidence-cited chair
  - Allen section of 222-CONFIRMED-BLANK.md (10 person/topic blank entries, register Count 144 -> 154)
  - First application of the inherited taxes ruling to a live research pass, on the strongest taxes evidence the phase has yet seen (six years of recorded rate-cut votes) — held blank without re-litigation
affects: [222-06, 222-18]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A recorded council vote plus the officeholder's own stated reason for it, in the same source, is the cleanest chair-locating evidence type this phase has found — stronger than a questionnaire answer because direction and motive are both on the record"
    - "Pre-seat evidence is admissible when the person's identity in that earlier role is confirmed: the cited vote was cast as Council Place 4 (2019), the stance attaches to the same person now serving as Mayor"

key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/1421_222_allen_stances.sql"
  modified:
    - ".planning/phases/222-collin-county-stances-evidence-only-compass-research-one-pol/222-CONFIRMED-BLANK.md"

key-decisions:
  - "Schulmeister's `taxes` evidence is the most explicit this phase has encountered — Community Impact, March 17 2026: 'During my six years on Council, I voted to reduce the tax rate every year. A 5% Homestead Exemption was adopted. The level of city services may need to be adjusted...' — and it still produced NO row, per the settled 2026-07-25 ruling. Recorded here because it is the strongest test of that ruling so far: six years of rate-cut votes plus stated willingness to adjust service levels points at chair 4's text, but a uniform ad-valorem municipal rate is not 'cut taxes for everyone and scale back public services to match'. Evidence preserved verbatim in the register for a future municipal-scope rewrite."
  - "Board service rejected as evidence again: his Allen EDC and CDC board seats were NOT used for `economic-development` — the same adjacency defect the 222-01 county-wide audit deleted from two other Allen records on 2026-07-25"
  - "Texas SB4 rejected as a `local-immigration` default — state law is not the officeholder's position (the A4 defect deleted from two Plano records)"
  - "The $97M Allen police headquarters built during his tenure was NOT used for `public-safety-approach` — a capital project delivered under a council is not a member's funding-level position"

requirements-completed: []  # COLLIN-STANCE-01/02 advanced, not completed — 222-06 through 222-17 still write under both

coverage:
  - id: D1
    description: "1 evidence-cited compass chair applied to production: Chris Schulmeister (Allen Mayor) residential-zoning=3, sourced to his recorded August 2019 council vote against the 800-unit Allen City Center multifamily plan plus his own stated reason for it"
    requirement: "COLLIN-STANCE-02"
    verification:
      - kind: sql_gate
        ref: "Named evidence-integrity gate from 222-VALIDATION.md (all 8 predicates incl. the 11-canonical-UUID whitelist), run by the orchestrator against production scoped to politician_id 698da6ca-eadd-46a0-8e27-94ae48d23279 — returned 0 rows"
        status: pass
    human_judgment: false
  - id: D2
    description: "10 (person, topic) blank entries recorded in the Allen section of 222-CONFIRMED-BLANK.md, each naming why the available material does not locate a chair; register Count 144 -> 154"
    requirement: "COLLIN-STANCE-01"
    verification:
      - kind: manual_procedural
        ref: "Orchestrator exactly-one-bucket reconcile at (person, topic) granularity per the 222-01 operator ruling #4: Allen worklist = 1 person x 11 topics = 11 pairs = 1 applied + 10 blank. No pair in both, no pair in neither."
        status: pass
    human_judgment: false
  - id: D3
    description: "Migration 1421 applied to production live and confirmed present by row-level query; not registered in schema_migrations"
    requirement: "COLLIN-STANCE-02"
    verification:
      - kind: manual_procedural
        ref: "Orchestrator applied via mcp__supabase-local__execute_sql on 2026-07-25 under standing operator pre-authorization. Pre-apply query confirmed zero existing rows for this politician_id (matching the worklist assertion); post-apply query confirmed topic_key residential-zoning, value 3 (whole integer — the gate's ROUND() predicate passed), 1 source URL, paired context row present. The applied SQL contained no schema_migrations write."
        status: pass
    human_judgment: true
    rationale: "Live production apply requires the orchestrator's Supabase MCP binding — MCP tools are unbound in every subagent session (222-RESEARCH.md §B execution note 2)"

# Metrics
duration: ~10 min research/authoring (subagent) + orchestrator apply
completed: 2026-07-25
status: complete
---

# Phase 222 Plan 05: Allen Stance Research Summary

**Allen's one un-stanced officeholder — Mayor Chris Schulmeister — yielded 1 evidence-cited chair from 11 attempted topics (residential-zoning=3, applied live via migration 1421), with 10 honest blanks including the phase's strongest-yet `taxes` evidence held blank under the inherited operator ruling.**

## Performance

- **Duration:** one research/authoring dispatch on a `general-purpose` subagent (not `gsd-executor`, which has no WebSearch/WebFetch), plus orchestrator-side apply
- **Completed:** 2026-07-25
- **Tasks:** 3 (2 auto + 1 blocking checkpoint, now satisfied)
- **Files modified:** 2 (1 new EV-Accounts migration, 1 essentials register append)

## Accomplishments

- Attempted all 11 canonical topics for the single Allen worklist name. **1 chair sourced, 10 blank** — a 91% blank rate, consistent with waves 3–4 (10 chairs from 130 pairs) and correct under D-04.
- The one chair rests on the cleanest evidence type this phase has found: a **recorded council vote plus the officeholder's own stated reason for it in the same source**. At the August 2019 Allen City Council hearing on Wolverine Interests' Allen City Center plan (800 apartment units on 12 acres in the central business district) Schulmeister voted against advancing it, and told Bisnow (Sept 2, 2019) his reason was that the "density of the apartments was just too much relative to the retail." The same interview carries his affirmative position — "multifamily is what millennials are seeking and we have to be able to compete against neighboring cities" — and his wish for a revised plan rather than no project. Supporting multifamily/mixed-use in the downtown commercial core while rejecting one over-dense plan is chair 3; chairs 1, 2, 4 and 5 are each individually contradicted by that record.
- **Pre-seat evidence, correctly attached.** The cited vote was cast as Council Place 4 (May 2019 – May 2025, including two years as mayor pro tem); he was elected Mayor May 2, 2026 (3,278 votes, 81%) and sworn in May 26, 2026. Identity in both roles was confirmed on cityofallen.org before the vote was accepted as his — the homonym gate (Pitfall 2) and the wrong-role gate both cleared.

### Outcome table

| Pairs attempted | Chairs applied | Blanks | Blank rate |
|---|---|---|---|
| 11 | 1 | 10 | 91% |

### Applied chair

| Person | politician_id | Topic | Chair | Evidence |
|---|---|---|---|---|
| Chris Schulmeister (Allen Mayor) | `698da6ca-eadd-46a0-8e27-94ae48d23279` | residential-zoning | 3 | Recorded Aug 2019 council vote against the 800-unit Allen City Center plan with his own stated reason (retail-to-density imbalance), plus his own pro-multifamily-competitiveness quote in the same Bisnow interview |

### Adjacency and default traps refused (each one an audited defect class)

| Topic | Available material | Why it was not used |
|---|---|---|
| economic-development | Allen EDC + CDC board seats | Board service is not a position — the exact defect deleted from two other Allen records on 2026-07-25 |
| local-immigration | Texas SB4 bars sanctuary policies statewide | State law is not his position — the A4 defect deleted from two Plano records |
| public-safety-approach | $97M police HQ built during his tenure; "success trajectory with regard to Public Safety... in a fiscally sound manner" | A capital project delivered under a council is not a member's funding-level position; the quote names the subject without locating a chair |
| housing | 2019 pro-multifamily quote; "affordability" campaign theme | The quote is market-supply/regional-competitiveness (cross-topic inference); his own definition of "affordability" in the same Q&A is property tax and utility bills, not housing prices |
| growth-and-development | "transitioned from rapid growth to a mature city" | Describes a life-cycle stage, not a pace-management position; no build-ahead-of-growth commitment |

## Task Commits

1. **Task 1: Research every un-stanced Allen officeholder, one politician at a time** — no file writes (research output held for Task 2 per plan design)
2. **Task 2: Author the Allen migration, self-audit, append the blank register, and commit** — EV-Accounts `98a00ca2` (migration 1421, AUDIT-ONLY, **not pushed**); essentials `586f85d3` (register: Allen section, Count 144 → 154)
3. **Task 3: [BLOCKING] Operator applies the Allen migration and runs the evidence-integrity gate** — satisfied 2026-07-25 under standing operator pre-authorization. Orchestrator applied migration 1421 via `mcp__supabase-local__execute_sql`, then ran the named `222-VALIDATION.md` evidence-integrity gate (0 rows) and the exactly-one-bucket reconcile (11 = 1 + 10).

**Plan metadata:** this SUMMARY's commit (below)

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/1421_222_allen_stances.sql` - AUDIT-ONLY migration, 1 answer/context upsert pair, single BEGIN/COMMIT, dollar-quoted reasoning; applied to production, not registered in `schema_migrations`, committed locally on `master` and **not pushed**
- `.planning/phases/222-collin-county-stances-evidence-only-compass-research-one-pol/222-CONFIRMED-BLANK.md` - `## City of Allen (4801924) — 222-05` section with all 10 blanks and per-topic rationales; migration table row for 1421 flipped AUTHORED → APPLIED; Count 144 → 154

## Decisions Made

See `key-decisions` in frontmatter. The load-bearing one: the inherited `taxes` ruling was applied to its hardest case yet and held.

## Deviations from Plan

None. Scope, evidence bar, sequencing (a single person, so trivially one-at-a-time), migration numbering (1421 confirmed free on disk), and the no-push constraint were all met as written.

## Issues Encountered

**`chrisforallen.org` returned HTTP 404 on every fetch** — root and `/meet-chris/`, with and without `www.`. His campaign platform was never read, and this is the plan's material gap: search snippets indicate that site makes specific claims about police/fire pay, training and equipment (which could locate `public-safety-approach`) and about parks and trails. **No chair was assigned from a snippet.** Also unavailable: his Ballotpedia individual page resolved but returned an empty body (the known waves 3–4 failure mode); `lwvcollin.org/voters-guides` and `cityofallen.org/directory.aspx` returned HTTP 403. Star Local Media worked this session (July 10, 2026 interview, no HTTP 429) but carried no chair-locating statement. All recorded in the register so a later pass can retry.

**Follow-on already logged by 222-04, reinforced here:** the Local Lens `taxes` question needs a municipal-scope rewrite. Schulmeister is now the ninth officeholder with real, dated, explicit tax evidence that the current scale cannot represent.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Allen (4801924) is fully reconciled at (person, topic) granularity: 11 pairs = 1 applied + 10 blank, no pair in both or neither.
- `src/lib/coverage.js` needs no change for Allen — its entry already carries `hasContext: true` (Allen had 6 previously-stanced officeholders; this plan did not flip a government from zero). Verified by the orchestrator, so 222-18's Pitfall-5 reconcile can skip Allen. Richardson (222-06) is likewise already `hasContext: true`.
- COLLIN-STANCE-01 and COLLIN-STANCE-02 remain open — 222-06 through 222-17 still write under both.
- 222-06 (Richardson — Curtis Dorian, 1 person) is next in wave order and is the same shape as this plan: a single Tier-1-city officeholder, 100% cited-source resample required.

---
*Phase: 222-collin-county-stances-evidence-only-compass-research-one-pol*
*Completed: 2026-07-25*

## Self-Check: PASSED

- FOUND: `C:/EV-Accounts/backend/migrations/1421_222_allen_stances.sql` on disk (7,093 bytes), committed in `98a00ca2`, `git -C "C:/EV-Accounts" status --porcelain backend/migrations` clean
- FOUND: commit `586f85d3` in essentials `git log --oneline`
- FOUND: `222-CONFIRMED-BLANK.md` line 1059 `## City of Allen (4801924) — 222-05`, 10 `- Chris Schulmeister` blank bullets counted, `## Count: 154`
- VERIFIED LIVE: post-apply query returns `residential-zoning` / value 3 / 1 source / paired context row for `698da6ca-eadd-46a0-8e27-94ae48d23279`
- VERIFIED LIVE: named evidence-integrity gate returned 0 rows
- NOT RUN (and not claimed): browse-view screenshot and the split-section check — both are 222-18 close-out gates, not per-plan gates. Allen's own compass render was not visually confirmed this plan.
