# Phase 222: Collin County Stances - Context

**Gathered:** 2026-07-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Evidence-only compass stance research for Collin County officeholders who currently have no stances. Each researched officeholder carries **discrete 1–5 "chair" stances** on the applicable compass topics **where their positions are documented by a cited source**, and **blank spokes where not**. Party is never used or displayed (antipartisan). This phase applies stance data only — no schema, no app code, no UI changes.

**Live-audit scope anchor:** at discussion time, 157 in-scope active Collin officeholders exist; **55 already have ≥1 stance, 102 have none.** Phase 222 targets the 102. (Re-derive live at execution — rosters shift.) In-scope cities = the 23 Collin browse cities in `src/lib/coverage.js` (Texas block).

**Out of scope:** school-board members (no stance research until a board badge exists — see [[no_school_board_stances_until_badge]]); judicial/federal lenses; any change to the 55 already-stanced records beyond the optional legacy-tail top-up (D-07); finalizing/editing the Local Lens question set (it is already locked in the DB).
</domain>

<decisions>
## Implementation Decisions

### Scope & Sequencing
- **D-01:** Attempt **all 102** un-stanced in-scope officeholders (comprehensive), not a subset.
- **D-02:** **Evidence-first ordering** — research the 7 higher-evidence cities first (Plano, Frisco, McKinney, Allen, Richardson, Prosper, Celina) plus **every city's mayor**, then the smaller towns. Best hit-rate early.
- **D-03:** **One politician at a time** (sequential, inline, no worktree) — parallel fan-outs burn quota. See [[stance_research_one_at_a_time]] and the Ph211 sequential-inline model [[phase211_complete]].

### Evidence Bar & Sources
- **D-04:** **Strict standard** — assign a 1–5 chair only when a **cited source shows an explicit, on-topic position**: a stated stance, a recorded council vote/motion, or a candidate-questionnaire answer. Suggestive-but-not-explicit → **blank spoke**. No party-based or pattern inference (evidence-only + antipartisan).
- **D-05:** **Acceptable source types:** candidate questionnaires (Ballotpedia, VOTE411), public statements / news coverage, council votes & meeting minutes, official government bios, campaign/official sites. Each applied stance must carry its source evidence.

### Topic Set
- **D-06:** Research the **8 canonical Local Lens topics** per officeholder (the finalized set the profile compass renders — the REQUIREMENTS "deferred pending local-question finalization" note is **STALE**; the Local Lens is locked in `inform.compass_lenses` and already in use by the 55).
- **D-07:** **Also attempt the 3 legacy tail topics** (Taxation & Public Spending, Growth & Development Pace, Healthcare Access) **where explicit evidence exists** — do not force them; blank if unsourced. Leave the existing 55's records as-is (no cleanup pass).

### Blanks
- **D-08:** **Per-person blank register** — attempt everyone; for each person with no sourced positions, log a "searched, no public positions found" note (with the sources checked) in a `222-CONFIRMED-BLANK`-style register, mirroring 221. Durable; prevents a later phase re-searching the same dead ends. Blank is a SUCCESS state, never a defaulted stance ([[stance_no_default_value]]).

### Claude's Discretion
- Per-city batch sizes, exact source-search order per person, and the shape of the applied-stance evidence citation (as long as evidence is captured) are Claude's discretion within the rules above.

### Locked by prior decisions (NOT re-litigated)
- Stances are discrete 1–5 "chairs", not a polarity scale ([[compass_chairs_not_polarity]]).
- Research ALL applicable topics per politician, evidence-only ([[stance_research_all_topics]]).
- No default value — no evidence = blank ([[stance_no_default_value]]).
- Antipartisan — party never displays on profiles ([[antipartisan_display]]).
- Apply format: agents get question + 5 answer options, output 1–5, applied via parseInt ([[stance_research_format]]).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Stance-research method & guardrails (memory)
- Working rules: [[stance_research_one_at_a_time]], [[stance_research_all_topics]], [[stance_no_default_value]], [[compass_chairs_not_polarity]], [[antipartisan_display]], [[no_school_board_stances_until_badge]]
- Format & application: [[stance_research_format]] — question + 5 answers → 1–5 → parseInt apply
- Sequential-inline execution model (no worktree, one at a time): [[phase211_complete]]

### Compass data model (verified live 2026-07-24)
- `inform.compass_lenses` — **Local Lens** = `b9433139-1603-4145-a979-9083f9552b8d` (8 topics). Federal & Judicial lenses also exist (out of scope).
- Local Lens 8 topic IDs: Affordable Housing `669cac97-66a6-4087-b036-936fbe62efb3` · Civil Rights & Social Justice `0bc588c6-39e1-4084-b5de-cac909b8b762` · Criminalization of Homelessness `4938766b-b45a-46e3-93bd-b8b30651271a` · Economic Development Incentives `eb3d1247-0de1-4b7f-baec-7259861efd53` · Local Immigration Enforcement `b9ccee94-ad96-4f10-b655-889d8e5abe92` · Public Safety Approach `e9ebefcd-c496-45e8-b816-a79f8442ba85` · Residential Zoning `d4f18138-a2e0-4110-b925-7387d9d0d16d` · Transportation Priorities `ba59337e-30e2-4aba-a39a-426b3366eb27`
- Legacy tail 3 (D-07, attempt-if-evidence): Taxation & Public Spending `f7e5678d-dadd-4556-a2fc-446e24642ceb` · Growth & Development Pace `fb25c1ac-91cc-49bf-8afc-c7fa22ef45e4` · Healthcare Access `e8dad4a8-eb93-4931-91f5-d8fb5d7dd529`
- Answer table: `inform.politician_answers` (join on `politician_id`; NO unique geo_id) — [[schema_key_tables]]. Live compass topic IDs reference: [[compass_live_topic_ids]].
- Spoke selection / profile render: [[compass_spoke_selection]]

### Roadmap / requirements
- `.planning/ROADMAP.md` §"Phase 222: Collin County Stances" — COLLIN-STANCE-01/02, constraints
- `.planning/REQUIREMENTS.md` line ~51 — **STALE** deferral note (Local Lens now finalized; supersede)
- `src/lib/coverage.js` (Texas block) — the 23-city Collin scope

### Precedent
- `.planning/phases/221-…/221-CONFIRMED-BLANK.md` — the blank-register pattern D-08 mirrors
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `mcp__supabase-local__execute_sql` (production) — derive the live 102-person worklist and apply `inform.politician_answers` rows.
- 221 worklist/blank-register pattern — batched, per-government, per-person register.

### Established Patterns
- Sequential-inline stance research (one politician at a time), question + 5 answers → 1–5 chair, applied via parseInt ([[stance_research_format]]).
- `is_vacant` filter GOTCHA from 221: use `(is_vacant = false OR is_vacant IS NULL)` when deriving the scope, never `= false` alone (NULL = seated). See [[phase221_complete]].

### Integration Points
- Writes to `inform.politician_answers` only; the profile compass + Local Lens switcher render it automatically (no app change). Spot-check via live browse (`browse_government_list=…&browse_label=…&browse_state=TX` — see [[browse_link_format]]).
</code_context>

<specifics>
## Specific Ideas
- Mirror the 221 close-out shape: live BEFORE/AFTER coverage counts (people-with-≥1-stance delta) + a per-person blank register + a browse spot-check gate.
- Both mayors the user asked about (Mark Hill/Frisco, Chris Schulmeister/Allen) are in the 102 and in the priority tier (larger cities + mayors).
</specifics>

<deferred>
## Deferred Ideas
- **Standardize the existing 55 to the canonical 8** (drop/normalize legacy tail topics) — declined for this phase (would touch already-done records); note as a possible future cleanup task.
- **School-board stances** — blocked until a school-board badge exists ([[no_school_board_stances_until_badge]]).
- **Non-Collin backfill** using the same Local Lens method — out of milestone.
</deferred>

<open_questions>
## Open Questions for Research/Planning
- Confirm the live 102 count at execution (rosters shift) using `(is_vacant = false OR is_vacant IS NULL)`.
- Best per-city evidence sources for Collin small towns (many will have only Ballotpedia/VOTE411 candidate questionnaires, if anything) — researcher to map source availability per city to inform sequencing.
</open_questions>
