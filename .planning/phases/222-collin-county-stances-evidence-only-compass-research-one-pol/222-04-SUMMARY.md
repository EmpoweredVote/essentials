---
phase: 222-collin-county-stances-evidence-only-compass-research-one-pol
plan: 04
subsystem: data
tags: [postgres, supabase, compass-stances, evidence-research, plano-tx, mckinney-tx]

# Dependency graph
requires:
  - phase: 222-03
    provides: Frisco stance migration precedent, blank-register skeleton, dispatch-to-general-purpose-subagent pattern
provides:
  - Plano (geo_id 4858016) topic-gap-fill migration 1418_222_plano_gapfill_stances.sql, AUDIT-ONLY, applied to production, revised down from 5 rows to 1 by operator ruling
  - McKinney (geo_id 4845744) topic-gap-fill migration 1419_222_mckinney_gapfill_stances.sql, AUDIT-ONLY, applied to production, 2 chairs
  - Operator ruling that `taxes` is structurally unanswerable for Texas municipal officeholders — binds plans 222-05 through 222-17, encoded in 222-RESEARCH.md §B
  - Discovery and remediation of the bio-page-only defect class (Dan Barrios / healthcare) via migration 1420, a class this phase had not previously checked for
  - Plano and McKinney sections of 222-CONFIRMED-BLANK.md (105 person/topic blank entries across both cities, register Count 144)
affects: [222-05, 222-06, 222-07, 222-08 through 222-17, 222-18]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Live re-derivation of the gap list at execution time rather than trusting a pre-deletion planning snapshot — 4 of 15 politician_ids differed from earlier planning documents"
    - "Operator ruling on a structurally-unanswerable topic scale (taxes) applied phase-wide and encoded into RESEARCH.md so downstream plans inherit it without re-litigating"
    - "Cross-check against an external, pre-existing audit document (party-prior-stance-contamination-audit.md) surfaced a defect class (bio-page-only sourcing) this phase's own signatures did not check for"

key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/1418_222_plano_gapfill_stances.sql"
    - "C:/EV-Accounts/backend/migrations/1419_222_mckinney_gapfill_stances.sql"
    - "C:/EV-Accounts/backend/migrations/1420_222_barrios_healthcare_bio_only_remediation.sql"
  modified:
    - ".planning/phases/222-collin-county-stances-evidence-only-compass-research-one-pol/222-CONFIRMED-BLANK.md"
    - ".planning/phases/222-collin-county-stances-evidence-only-compass-research-one-pol/222-RESEARCH.md"

key-decisions:
  - "OPERATOR RULING: `taxes` dropped as structurally unanswerable for Texas municipal officeholders for the rest of Phase 222 — the scale's outer four chairs (tax-by-wealth/company-size, or cut-taxes-and-shrink-services) are outside municipal power, leaving chair 3 as the only reachable value, which would flatten members who genuinely disagree (Tu/Horne argued FOR Plano's 2025 rate increase, Quintanilla cast the LONE VOTE AGAINST it) into an identical, misrepresentative chair. Migration 1418 revised down from 5 seeded rows to 1 as a result."
  - "Lavine/residential-zoning upsert replaced an existing found-nothing `politician_context` note (from a 2026-05-11 pass that missed the Haggard Farm content) with real sourced evidence — an upgrade in the intended direction, not a silent overwrite of good data"
  - "All 15 pairs that 222-02 had previously deleted were re-researched under this plan's live gap list; none was reinstated — only the same weak material (board service, demographic remarks, wrap-around-services clauses) resurfaced, and board service was explicitly reaffirmed as not evidence of a position"
  - "Bio-page-only defect class (Dan Barrios / healthcare, sourced solely to a Ballotpedia biography URL) found via cross-check against a pre-existing external audit, not this plan's own signatures — remediated on separate explicit operator authorization via migration 1420"

requirements-completed: []  # COLLIN-STANCE-01/02 advanced but NOT completed — 222-05 through 222-17 still write under both; requirement completion happens later in the phase

coverage:
  - id: D1
    description: "3 evidence-cited compass chairs applied to production across Plano and McKinney: Steve Lavine (Plano P5) residential-zoning=2; Ernest Lynch (McKinney AL1) homelessness=4; Michael Jones (McKinney AL2) growth-and-development=3"
    requirement: "COLLIN-STANCE-02"
    verification:
      - kind: manual_procedural
        ref: "Orchestrator row-level integrity check against production for all 3 politician_ids: 3 answer rows, each with a paired politician_context row, all values whole integers, every context row with >=1 fetched source URL, zero reasoning matching party keywords, zero forbidden phrases ('no record found'/'assumed'/'defaulted'). NOTE: this is an equivalent row-level check, NOT a run of the named 222-VALIDATION.md gate suite, which has not been executed for this plan."
        status: pass
    human_judgment: false
  - id: D2
    description: "105 (person, topic) blank entries recorded across Plano (58) and McKinney (47) sections of 222-CONFIRMED-BLANK.md, including the 8 taxes entries (4 per city) confirmed blank by the operator ruling"
    requirement: "COLLIN-STANCE-01"
    verification:
      - kind: manual_procedural
        ref: "Orchestrator exactly-one-bucket reconcile: Plano 59 pairs = 1 applied + 58 blank; McKinney 49 pairs = 2 applied + 47 blank; 108 pairs attempted total = 3 applied + 105 blank"
        status: pass
    human_judgment: false
  - id: D3
    description: "Migrations 1418 (revised) and 1419 applied to production live and confirmed present by row-level query"
    requirement: "COLLIN-STANCE-02"
    verification:
      - kind: manual_procedural
        ref: "Orchestrator applied via mcp__supabase-local__execute_sql on 2026-07-25 after operator approval; post-apply query confirmed all 3 answer+context pairs present with the intended values"
        status: pass
    human_judgment: true
    rationale: "Live production apply requires the orchestrator's Supabase MCP binding — MCP tools are unbound in subagent sessions"
  - id: D4
    description: "Bio-page-only defect (Dan Barrios / healthcare) discovered outside this plan's own scan and remediated via migration 1420 on separate explicit operator authorization"
    requirement: "COLLIN-STANCE-01"
    verification:
      - kind: manual_procedural
        ref: "Orchestrator confirmed post-apply: Barrios/healthcare absent from both inform.politician_answers and inform.politician_context; zero bio-page-only rows remain anywhere in the 24-government Collin scope"
        status: pass
    human_judgment: true
    rationale: "Discovered via cross-check against a pre-existing external audit document, not this plan's own written signatures — the operator judged the remediation scope and authorization separately from the plan's own Task 2/3 gate"

# Metrics
duration: N/A (executor session; apply performed by orchestrator on 2026-07-25)
completed: 2026-07-25
status: complete
---

# Phase 222 Plan 04: Plano + McKinney Topic-Gap-Fill Summary

**3 evidence-cited compass chairs applied to production across Plano and McKinney (Lavine/residential-zoning, Lynch/homelessness, Jones/growth-and-development) out of 108 live-re-derived (person, topic) pairs, with the operator ruling `taxes` structurally unanswerable for Texas municipal officeholders and a separate bio-page-only defect (Dan Barrios) discovered and remediated along the way.**

## Performance

- **Duration:** research + authoring session, plus orchestrator-side apply on 2026-07-25
- **Completed:** 2026-07-25
- **Tasks:** 3 (2 auto + 1 blocking checkpoint, now satisfied)
- **Files modified:** 5 (3 EV-Accounts migrations, 1 essentials register append, 1 essentials RESEARCH.md encode-forward note)

## Accomplishments

- Re-derived the live gap list at execution rather than trusting the 222-01-INTEGRITY-AUDIT.md pre-deletion ~93-slot estimate — the real figure was **108 missing (person, topic) pairs**, and **4 of the 15 politician_ids differed from earlier planning documents** (Bill Cox, Bob Kehr, Rick Horne, Steve Lavine), vindicating the plan's live-re-derivation requirement.
- Researched all 15 officeholders (Plano's 8, McKinney's 7) one at a time across every topic their live gap list marked unfilled, split into two sequential dispatches on `general-purpose` subagents (not `gsd-executor`, which has no WebSearch/WebFetch).
- Result: **3 chairs applied, 105 blanks** — a 97% blank rate against the 108 attempted pairs, which this plan treats as the evidence bar working correctly, not a failed pass. These 15 people had already been picked over by an earlier stance-assignment pass before this phase's evidence bar existed, so what remained unfilled were genuinely the hard topics: cases with no explicit, on-topic, dated statement, vote, or questionnaire answer.

### Outcome table

| Part | Pairs attempted | Chairs applied | Blanks |
|---|---|---|---|
| A — Plano (4858016) | 59 | 1 | 58 |
| B — McKinney (4845744) | 49 | 2 | 47 |
| **Total** | **108** | **3** | **105** |

### Applied chairs

| Person | politician_id | Topic | Chair | Evidence |
|---|---|---|---|---|
| Steve Lavine (Plano P5) | `ecef0481-27c7-4955-b822-83d64c7ef63f` | residential-zoning | 2 | His own published account of two Haggard Farm rezoning cases he led — organized a coalition against 4,000+ apartments, then negotiated a lower-density compromise |
| Ernest Lynch (McKinney AL1) | `c3e2d7a6-8096-4e91-9ee0-3cca445af72e` | homelessness | 4 | His own CI questionnaire (Mar 6 2025) committing to expand shelter capacity, plus his vote for both Oct 21 2025 camping ordinances |
| Michael Jones (McKinney AL2) | `09dbafc2-9252-40e4-9a1c-afda5b069f2e` | growth-and-development | 3 | His own CI questionnaire (Apr 3 2023): "I took the initiative to start addressing infrastructure rather than wait" |

### Migrations, all applied to production 2026-07-25 after operator approval

| Migration | Contents | EV-Accounts commit |
|---|---|---|
| `1418_222_plano_gapfill_stances.sql` | 1 chair (Lavine residential-zoning=2) — **revised down from 5 rows to 1** after the operator dropped the 4 `taxes` rows (see Deviation 1) | `932069b5` (initial 5-row author), revised in `6b21f386` |
| `1419_222_mckinney_gapfill_stances.sql` | 2 chairs (Lynch homelessness=4, Jones growth-and-development=3) | `ecee3b8a` |
| `1420_222_barrios_healthcare_bio_only_remediation.sql` | 1 deletion (Dan Barrios / healthcare, bio-page-only) | `6b21f386` (bundled with the taxes revision) |

Essentials register commits: `a4d06397` (part A, Count 42→96), `9a3b7ccc` (part B, Count 96→143), `e6d464df` (taxes ruling + bio-only follow-on, Count →144), `f4a2821e` (encode ruling + waves-2-4 notes into 222-RESEARCH.md §B).

Post-apply verification by the orchestrator (row-level query, not the named `222-VALIDATION.md` gate suite): all 3 chairs live, each with a paired context row, whole integers, ≥1 fetched source, zero party language, zero forbidden phrases.

## Task Commits

Each task was committed atomically:

1. **Task 1: Research the live Plano + McKinney gap list, one politician at a time** — no file writes (research output held for Task 2 per plan design; two sequential working notes, Plano then McKinney)
2. **Task 2: Author the gap-fill migration, self-audit, append the blank register, and commit** — essentials: `a4d06397` (register 54 Plano blanks, part A), `9a3b7ccc` (register McKinney blanks, part B); EV-Accounts: `932069b5` (Plano migration 1418, initial author), `ecee3b8a` (McKinney migration 1419)
3. **Task 3: [BLOCKING] Operator applies the gap-fill migration** — satisfied 2026-07-25: operator approved and additionally ruled on the `taxes` methodology question and the Barrios bio-only defect at the same checkpoint. Orchestrator applied all three migrations (1418 revised, 1419, 1420) via `mcp__supabase-local__execute_sql`, then the operator ruling and follow-on were encoded: `e6d464df` (essentials, taxes ruling + bio-only follow-on register sections), `6b21f386` (EV-Accounts, revises migration 1418 down to 1 row and authors migration 1420), `f4a2821e` (essentials, encodes the ruling into 222-RESEARCH.md §B for plans 222-05…222-17).

**Plan metadata:** this SUMMARY's commit (below)

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/1418_222_plano_gapfill_stances.sql` - AUDIT-ONLY migration, revised from 5 seeded rows to 1 (Lavine residential-zoning=2) after the operator dropped 4 `taxes` rows; applied to production, not registered in `schema_migrations`
- `C:/EV-Accounts/backend/migrations/1419_222_mckinney_gapfill_stances.sql` - AUDIT-ONLY migration, 2 answer/context upsert pairs (Lynch homelessness=4, Jones growth-and-development=3); applied to production
- `C:/EV-Accounts/backend/migrations/1420_222_barrios_healthcare_bio_only_remediation.sql` - AUDIT-ONLY migration, 1 deletion (Dan Barrios / healthcare, bio-page-only sourcing); applied to production
- `.planning/phases/222-collin-county-stances-evidence-only-compass-research-one-pol/222-CONFIRMED-BLANK.md` - Plano section (54 blanks) + McKinney section (47 blanks) appended, plus the taxes RULING section (8 entries reclassified as confirmed blank) and the bio-page-only follow-on section (1 entry); running Count 42 → 144
- `.planning/phases/222-collin-county-stances-evidence-only-compass-research-one-pol/222-RESEARCH.md` - §B updated to encode the taxes ruling and waves-2-4 execution notes so plans 222-05…222-17 inherit them without re-litigating

## Decisions Made

See `key-decisions` in frontmatter above; full narrative in "Deviations from Plan" below.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 4 — Architectural/methodology, OPERATOR RULING] `taxes` dropped as structurally unanswerable for Texas municipal officeholders**
- **Found during:** Task 3 (operator checkpoint)
- **Issue:** Part A originally seeded 5 rows: four `taxes` = 3 (Tu, Horne, Downs, Quintanilla) plus Lavine's zoning row. The `taxes` scale's chairs 1–2 require raising taxes on wealthy people and large companies; chairs 4–5 require scaling public services back. Texas cities levy a uniform ad-valorem property tax and do neither, so chair 3 is the only structurally reachable chair — it carries no discriminating information and actively misrepresents. Tu and Horne argued FOR Plano's 2025 rate increase, Quintanilla cast the LONE VOTE AGAINST it, Downs campaigned on holding rates down; in McKinney, Cloutier pushed rate cuts while Feltus DECLINED an exemption increase to protect services. All eight would have rendered as the identical chair 3. Assigning the middle chair because the outer four are unreachable is defaulting to a middle value, which D-04 forbids even with a real dated quote behind it.
- **Fix:** Operator ruled on 2026-07-25 to drop all four Plano `taxes` rows (and, since Part B was independently instructed to exclude `taxes` before authoring and reproduced the same flattening, McKinney's four `taxes` findings were confirmed blank on the same ruling rather than seeded at all) — all eight now sit in the register's dedicated RULING section as CONFIRMED BLANK, not a normal per-topic blank. `taxes` is treated as unanswerable for the rest of Phase 222. All eight members' tax evidence is preserved verbatim in the register so they can be placed if the question is ever rewritten with municipal scope. Follow-on logged: the Local Lens `taxes` question needs a municipal-scope rewrite; `healthcare` has the same defect from the opposite direction (all five chairs describe national policy), which is why every `healthcare` pair in this plan is blank and correctly so.
- **Files modified:** `C:/EV-Accounts/backend/migrations/1418_222_plano_gapfill_stances.sql` (revised 5→1 row), `.planning/phases/222-.../222-CONFIRMED-BLANK.md` (RULING section), `.planning/phases/222-.../222-RESEARCH.md` (§B, encoded forward)
- **Verification:** Post-apply query confirms zero Plano `taxes` rows written; register RULING section documents the reasoning and all eight members' preserved evidence
- **Committed in:** `6b21f386` (EV-Accounts), `e6d464df` + `f4a2821e` (essentials)

**2. [Rule 1 — Bug/upgrade] Lavine's row replaced an honest-blank note, not a silent overwrite**
- **Found during:** Task 1/2
- **Issue:** Lavine/residential-zoning already had a `politician_context` row with NO answer row: "Researched 2026-05-11 — no specific record found of Lavine stating a position on residential zoning density… Checked: steve4plano.com, Community Impact Q&A, Ballotpedia." That 2026-05-11 pass checked `steve4plano.com` but missed the Haggard Farm content this plan's research found and quoted from that same site.
- **Fix:** The upsert replaced the found-nothing note with real sourced evidence (chair 2, cited to the same site the earlier pass had checked) — the intended direction of an upsert, not a defect.
- **Files modified:** `C:/EV-Accounts/backend/migrations/1418_222_plano_gapfill_stances.sql`
- **Verification:** Post-apply query confirms Lavine's residential-zoning row now carries both an answer and a context row with a fetched source
- **Committed in:** `932069b5`

**3. [Rule 2 — Missing critical / D-08 completeness] All 15 pairs previously deleted by 222-02 were re-researched; none was reinstated**
- **Found during:** Task 1
- **Issue:** Plan design required re-attempting, on genuinely new evidence only, any (person, topic) pair 222-02 had deleted for lack of sourcing — a check this plan could not skip without leaving a completeness gap.
- **Fix:** All 8 Plano and 7 McKinney previously-deleted pairs were re-researched under this plan's live gap list. Only the same weak material resurfaced (Tu's immigration law practice, Muns's demographic remark, Thomas's wrap-around-services clause, MEDC/EDC board service). Feltus/economic-development surfaced genuinely new campaign text ("aggressive recruitment of forward-thinking companies") but it straddled chairs 3 and 4 with no incentive posture named, so it stayed blank. Both research passes stated explicitly that board service is not evidence of a position.
- **Files modified:** none (remediation held — all 15 remain blank)
- **Verification:** Register entries for all 15 pairs carry the re-research rationale and confirm no reinstatement
- **Committed in:** `a4d06397`, `9a3b7ccc`

**4. [Rule 2 — Missing critical, defect class outside plan scope] Bio-page-only row (Dan Barrios / healthcare) found and remediated separately**
- **Found during:** Task 3 (operator checkpoint, cross-checking against a pre-existing external audit)
- **Issue:** Cross-checking against `C:/EV-Accounts/.planning/todos/2026-07-24-party-prior-stance-contamination-audit.md` surfaced the bio-page-only class: 907 rows nationally sourced solely to a Ballotpedia biography URL, which carries no stance content. Exactly one existed in Collin scope — Dan Barrios / healthcare — and it survived 222-02 because that plan's Class A1 signature required NULL sources; this row had a source, just a useless one. That same audit also named a class this phase never checked for — stances citing votes cast before the member was seated — but re-verification found both of 222-02's dated-vote KEEPs hold against seating dates.
- **Fix:** Deleted via `1420_222_barrios_healthcare_bio_only_remediation.sql` on separate explicit operator authorization.
- **Files modified:** `C:/EV-Accounts/backend/migrations/1420_222_barrios_healthcare_bio_only_remediation.sql`, `.planning/phases/222-.../222-CONFIRMED-BLANK.md` (follow-on section)
- **Verification:** Post-apply query confirms Barrios/healthcare absent from both `inform.politician_answers` and `inform.politician_context`; zero bio-page-only rows remain anywhere in the 24-government Collin scope
- **Committed in:** `6b21f386` (EV-Accounts), `e6d464df` (essentials)

---

**Total deviations:** 4 (1 operator ruling/Rule 4-adjacent methodology decision, 1 Rule 1 upgrade, 1 Rule 2 completeness check with no reinstatement, 1 Rule 2 out-of-plan-scope defect remediated on separate authorization).
**Impact on plan:** No scope creep beyond what the operator explicitly authorized at the Task 3 checkpoint. The `taxes` ruling narrows this plan's own migration (5→1 rows) and binds all remaining plans in the phase; the Barrios fix closes a defect class this plan's own signatures would not have caught on their own.

## Issues Encountered

**Blocked sources (both parts).** Ballotpedia individual pages returned empty bodies for Tu, Kehr, Thomas, Quintanilla, Lynch, Feltus, and Cox; Star Local Media returned HTTP 429; D Magazine returned HTTP 403; `bob4plano.org` returned HTTP 404; `rickhorne4plano.org` does not resolve. All recorded in the register. A later pass with Ballotpedia Candidate Connection access is the most likely source of additional chairs, especially on growth-and-development and economic-development.

**Source conflict recorded.** Community Impact and `tx3dnews.com` disagree on the Oct 21 2025 McKinney roll call (CI: Beller alone against, then Beller+Feltus; tx3dnews: Jones against, Feltus supporting). Part B used CI only and recorded the discrepancy in the register. Lynch is not named as a dissenter in either account, so his yes vote — and therefore his applied chair — holds under both readings.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plano (geo_id 4858016) and McKinney (geo_id 4845744) are fully reconciled: every one of the 15 worklist officeholders appears in exactly one of {applied migration, blank register} for every one of the 11 topics, with no name in both and no name in neither.
- The `taxes` ruling and the Barrios bio-page-only defect class are now encoded in `222-RESEARCH.md` §B — plans 222-05 through 222-17 inherit both without needing to re-derive them.
- COLLIN-STANCE-01 and COLLIN-STANCE-02 are advanced but remain open — 222-05 through 222-17 still write under both; neither is marked complete by this plan.
- 222-05 is next in the sequential wave order and can proceed with the same live-re-derivation, dispatch-to-general-purpose-subagent, and orchestrator-side-apply patterns established here, plus the inherited `taxes`/bio-page-only rulings.

---
*Phase: 222-collin-county-stances-evidence-only-compass-research-one-pol*
*Completed: 2026-07-25*

## Self-Check: PASSED

- FOUND: `C:/EV-Accounts/backend/migrations/1418_222_plano_gapfill_stances.sql` (confirmed via `git -C "C:/EV-Accounts" log --oneline --all -- backend/migrations/1418_222_plano_gapfill_stances.sql` → commits `932069b5`, `6b21f386`)
- FOUND: `C:/EV-Accounts/backend/migrations/1419_222_mckinney_gapfill_stances.sql` (commit `ecee3b8a`)
- FOUND: `C:/EV-Accounts/backend/migrations/1420_222_barrios_healthcare_bio_only_remediation.sql` (bundled in commit `6b21f386`)
- FOUND: commits `a4d06397`, `9a3b7ccc`, `e6d464df`, `f4a2821e` in essentials `git log --oneline`
- FOUND: `.planning/phases/222-collin-county-stances-evidence-only-compass-research-one-pol/222-CONFIRMED-BLANK.md` contains `## City of Plano (4858016) — 222-04 part A`, `## City of McKinney (4845744) — 222-04 part B`, `## RULING: taxes is structurally unanswerable for municipal officeholders (2026-07-25)`, and `## Follow-on integrity remediation — bio-page-only row (2026-07-25)` sections, register Count: 144
