# Phase 222: Collin County Stances - Research

**Researched:** 2026-07-24
**Domain:** Evidence-only political-stance research (compass "chairs" model) for Texas general-law municipal officeholders — this phase's unknowns are operational (live worklist derivation, exact topic question/answer text, per-city evidence availability, throughput/batching, the write mechanics), not architectural. No app code, no schema, no UI changes.
**Confidence:** HIGH on write mechanics and topic question/answer text (both directly confirmed against very recent, in-repo migration files and a UUID-exact cross-check); MEDIUM on the live 157/55/102 scope numbers (this research session had no live DB tool access — see Environment Availability); MEDIUM/LOW on per-city evidence-source richness (a small, targeted sample was generalized per the task's own instruction, not an exhaustive 23-city audit).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Scope & Sequencing**
- **D-01:** Attempt **all 102** un-stanced in-scope officeholders (comprehensive), not a subset.
- **D-02:** **Evidence-first ordering** — research the 7 higher-evidence cities first (Plano, Frisco, McKinney, Allen, Richardson, Prosper, Celina) plus **every city's mayor**, then the smaller towns. Best hit-rate early.
- **D-03:** **One politician at a time** (sequential, inline, no worktree) — parallel fan-outs burn quota. See `stance_research_one_at_a_time` and the Ph211 sequential-inline model.

**Evidence Bar & Sources**
- **D-04:** **Strict standard** — assign a 1–5 chair only when a **cited source shows an explicit, on-topic position**: a stated stance, a recorded council vote/motion, or a candidate-questionnaire answer. Suggestive-but-not-explicit → **blank spoke**. No party-based or pattern inference (evidence-only + antipartisan).
- **D-05:** **Acceptable source types:** candidate questionnaires (Ballotpedia, VOTE411), public statements / news coverage, council votes & meeting minutes, official government bios, campaign/official sites. Each applied stance must carry its source evidence.

**Topic Set**
- **D-06:** Research the **8 canonical Local Lens topics** per officeholder (the finalized set the profile compass renders — the REQUIREMENTS "deferred pending local-question finalization" note is **STALE**; the Local Lens is locked in `inform.compass_lenses` and already in use by the 55).
- **D-07:** **Also attempt the 3 legacy tail topics** (Taxation & Public Spending, Growth & Development Pace, Healthcare Access) **where explicit evidence exists** — do not force them; blank if unsourced. Leave the existing 55's records as-is (no cleanup pass).

**Blanks**
- **D-08:** **Per-person blank register** — attempt everyone; for each person with no sourced positions, log a "searched, no public positions found" note (with the sources checked) in a `222-CONFIRMED-BLANK`-style register, mirroring 221. Durable; prevents a later phase re-searching the same dead ends. Blank is a SUCCESS state, never a defaulted stance (`stance_no_default_value`).

### Claude's Discretion
- Per-city batch sizes, exact source-search order per person, and the shape of the applied-stance evidence citation (as long as evidence is captured) are Claude's discretion within the rules above.

### Locked by prior decisions (NOT re-litigated)
- Stances are discrete 1–5 "chairs", not a polarity scale (`compass_chairs_not_polarity`).
- Research ALL applicable topics per politician, evidence-only (`stance_research_all_topics`).
- No default value — no evidence = blank (`stance_no_default_value`).
- Antipartisan — party never displays on profiles (`antipartisan_display`).
- Apply format: agents get question + 5 answer options, output 1–5, applied via parseInt (`stance_research_format`).

### Deferred Ideas (OUT OF SCOPE)
- **Standardize the existing 55 to the canonical 8** (drop/normalize legacy tail topics) — declined for this phase (would touch already-done records); note as a possible future cleanup task.
- **School-board stances** — blocked until a school-board badge exists (`no_school_board_stances_until_badge`).
- **Non-Collin backfill** using the same Local Lens method — out of milestone.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| COLLIN-STANCE-01 | Per-politician, all-topic, evidence-only research for the ~102 un-stanced Collin officeholders | §A (live worklist SQL + gotchas), §C (per-city evidence tier map), §D (throughput/batching), the reused `politician-stance-researcher` subagent (Architecture Patterns) |
| COLLIN-STANCE-02 | Apply 1–5 stances, blank where unsourced, into the live compass | §B (exact question/answer text for all 11 topics), §E (exact SQL insert/upsert shape, migration numbering convention), Code Examples (a real, current migration to copy) |
</phase_requirements>

## Summary

This phase reduces to running an **already-proven, repeatedly-used** stance-research workflow — the same one used across 20+ prior deep-seed phases (AZ Tucson-metro, Coachella Valley, MA tier-3 waves, LA Wave 2, etc.) — against a new list of ~102 Collin County, TX officeholders. **Nothing new needs to be built.** A dedicated subagent (`politician-stance-researcher`, `C:/EV-Accounts/.claude/agents/politician-stance-researcher.md`) already encodes the evidence hierarchy, the quote-selection/de-identification rules, the inversion-trap table, and the exact per-topic question/answer scales; a dedicated skill (`compass-topic-builder`) exists only for *authoring new* topics, which is out of scope here (all 11 topics this phase needs already exist and are live). The write path — `inform.politician_answers` (value) + `inform.politician_context` (reasoning + sources) upserted via a numbered, git-committed but **unregistered ("audit-only")** SQL migration per politician or per small batch — is identical to the pattern used in migrations 1307–1313 (Oro Valley, three weeks ago) and 998 (Downey).

**The one genuine unknown this research resolves is operational, not architectural:** (1) confirming the exact, current question/answer text for all 11 topics this phase needs (two different in-repo reference files disagree on 3 of them — resolved below, §B), (2) mapping which of the 23 Collin cities will actually yield evidence versus which will end mostly blank (§C), and (3) flagging that this research session had **no live database tool access**, so the 157/55/102 scope anchor in CONTEXT.md must be **re-derived live** at execution time, exactly as Phase 221 had to re-derive its own stale headshot-scope numbers.

**Primary recommendation:** Reuse the `politician-stance-researcher` subagent verbatim for the per-politician research step, but **override its embedded scale text for `housing`, `taxes`, and `healthcare`** with the current wording in §B (its built-in defaults for these 3 topics are pre-rewrite and stale — see Pitfall 1). Batch by government (23 cities), evidence-first per D-02, one migration file per government (or per person for the highest-evidence cities), applied and committed immediately after each government completes — never batched across governments — so an interruption loses at most one city's work.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Per-politician evidence research (web) | External research (WebFetch/WebSearch, this phase's execution session) | — | Ground-truth civic data; not derivable from code or the existing DB |
| Stance value + evidence storage | Database (`inform.politician_answers` value, `inform.politician_context` reasoning/sources — Supabase Postgres) | — | Idempotent SQL migrations against production via `C:/EV-Accounts`, applied by the operator/orchestrator (no Supabase MCP in the executor) |
| Topic/question definitions | Database (`inform.compass_topics`, `inform.compass_lenses` — already seeded, locked, live) | — | This phase is a pure consumer of the existing Local Lens; it authors zero new topics |
| Display of seeded stances (spokes, chair rendering) | Frontend (`@empoweredvote/ev-ui` `CompassCard`/`MiniCompass`, npm-installed) | `essentials/src/lib/compass.js` (`computeDisplaySpokes`, pure spoke-selection logic) | Verified this session by reading `src/lib/compass.js` — spokes render automatically off `inform.politician_answers` rows; **no frontend code change is required or in scope** |
| Coverage-chip surfacing (`hasContext: true`) | `essentials/src/lib/coverage.js` (Texas block) | — | 12 of the 24 TX entries (Blue Ridge, Fairview, Farmersville, Josephine, Lavon, Lowry Crossing, Lucas, Nevada, Parker, Saint Paul, Van Alstyne, Weston) currently have **no** `hasContext: true` chip — any one of them gaining its first stance row flips that flag; this is a small, easy-to-miss close-out task (see Pitfall 5) |

**No frontend or backend code changes are required or in scope for this phase** — 100% SQL data migrations against production via `C:/EV-Accounts`, plus one small `coverage.js` data edit at close if any zero-stance city gains its first row.

## Standard Stack

Not applicable in the conventional sense — no libraries or frameworks are installed this phase. The "stack" is the already-established, repeatedly-proven stance-research toolchain:

### Core
| Tool | Version/Location | Purpose | Why Standard |
|------|---------|---------|--------------|
| `politician-stance-researcher` subagent | `C:/EV-Accounts/.claude/agents/politician-stance-researcher.md` (project-scope, `memory: project`) | Per-politician evidence research, quote-selection/de-identification, CSV/structured output | Used across 20+ prior stance-research phases (AZ Tucson-metro, Coachella Valley, all MA/LA/CA waves); already encodes the evidence hierarchy and inversion-trap table this phase needs |
| Raw SQL migrations (`C:/EV-Accounts/backend/migrations/NNNN_*.sql`) | Next available at research time: **1416** (last on-disk = 1415, `bend_or_2026_races_candidates.sql`) — **re-verify at execute time**, this counter is shared across concurrent milestone work and moves between sessions | Idempotent stance seeding into `inform.politician_answers` + `inform.politician_context` | Identical mechanism to every prior stance-seeding phase (938–998 Downey/LA wave, 1307–1313 Oro Valley) |
| `mcp__supabase-local__execute_sql` | — | Live worklist derivation, topic verification, applying migrations, post-seed gates | Production DB access; **not available to this research session** (see Environment Availability) — the operator/orchestrator runs this at plan/execute time |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| `WebFetch` | Direct URL fetch (Ballotpedia, official .gov bio pages, ontheissues.org, news articles) | Primary tool per the subagent's own tool rule — no rate-limit quota |
| `WebSearch` | Discovering a URL when the Tier-1/2 URL-pattern guesses 404 | The subagent's own rule says "NEVER use WebSearch" because it shares a rate-limited pool with **parallel sibling agents** — that constraint does not apply here since D-03 already mandates strictly sequential (one-at-a-time) execution. Recommend a light WebSearch budget (a small number of calls per person, not per topic) to discover URLs for small Collin towns that have no Ballotpedia page, rather than forcing WebFetch-only URL-pattern guessing to dead-end — see Pitfall 2 |
| `compass-topic-builder` skill | Authoring **new** topics | **Not needed this phase** — all 11 topics already exist and are live; do not invoke this skill |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Reusing `politician-stance-researcher` as-is | Writing a phase-specific prompt from scratch | The existing subagent already has the exact evidence hierarchy, quote gates, and CSV/inline-migration output conventions battle-tested across 20+ phases — reinventing it risks silently reintroducing the exact scale-direction bugs its inversion-trap table exists to prevent |
| Per-government migration files | One giant migration for all 102 people | A single giant file makes an interrupted session lose all uncommitted work; per-government (or smaller) files bound the blast radius to one city, matching D-08's per-city blank-register granularity |

**Installation:** None — no packages to install this phase.

## Package Legitimacy Audit

**Not applicable.** This phase installs zero external packages (no npm/pip/cargo dependencies). It is a pure data-seeding phase using tools and infrastructure already present in the repo.

## Architecture Patterns

### System Architecture Diagram

```
                         ┌─────────────────────────────────────────┐
                         │   §A: Live worklist derivation (SQL)     │
                         │   essentials.politicians (Collin scope)  │
                         │   LEFT JOIN inform.politician_answers    │
                         │   → ~102 un-stanced officeholders,       │
                         │     grouped by government (23 cities)   │
                         └───────────────────┬───────────────────────┘
                                             │  ordered per D-02
                                             ▼
        ┌───────────────────────────────────────────────────────────────┐
        │  For EACH government (city), evidence-first order:            │
        │  For EACH politician in that government, ONE AT A TIME:       │
        │                                                                │
        │   ┌────────────────────┐    ┌──────────────────────────────┐  │
        │   │ politician-stance- │───▶│ WebFetch (+ light WebSearch) │  │
        │   │ researcher subagent│    │ Ballotpedia / official .gov  │  │
        │   │ (§B question/answer│    │ bios / council minutes /     │  │
        │   │  text passed in)   │    │ VOTE411 / news (D-05 sources)│  │
        │   └─────────┬──────────┘    └──────────────────────────────┘  │
        │             │  per-topic: value 1–5 + reasoning + source URL  │
        │             │  OR genuinely no evidence → blank (D-04/D-08)   │
        │             ▼                                                 │
        │   ┌──────────────────────────────────────────────────────┐    │
        │   │ Author ONE migration file per government (or person)  │    │
        │   │ inform.politician_answers (politician_id, topic_id,   │    │
        │   │   value) + inform.politician_context (…, reasoning,   │    │
        │   │   sources) — ON CONFLICT DO UPDATE, AUDIT-ONLY         │    │
        │   └─────────────────────┬────────────────────────────────┘    │
        │                         │  applied immediately (not batched)  │
        │                         ▼                                    │
        │   ┌──────────────────────────────────────────────────────┐    │
        │   │ Update the government's row in the per-person blank   │    │
        │   │ register (222-CONFIRMED-BLANK.md, D-08) and commit     │    │
        │   └──────────────────────────────────────────────────────┘    │
        └───────────────────────────────────────────────────────────────┘
                                             │  after ALL 23 governments
                                             ▼
                         ┌─────────────────────────────────────────┐
                         │ §F: BEFORE/AFTER coverage delta,          │
                         │ split-section check, coverage.js          │
                         │ hasContext reconcile (Pitfall 5),         │
                         │ live browse spot-check                    │
                         └─────────────────────────────────────────┘
```

### Recommended Government/Batch Structure

Following D-02's evidence-first ordering, exactly as CONTEXT.md specifies:

**Tier 1 — highest evidence, do first (7 named cities + every mayor):**
Plano, Frisco, McKinney, Allen, Richardson, Prosper, Celina — plus explicitly prioritize the **mayor** of every other city in this pass regardless of city size (D-02's "every city's mayor" clause), since mayors are disproportionately likely to have a Ballotpedia page, a State-of-the-City address, or news coverage even in small towns.

**Tier 2 — medium evidence (mid-size cities with some local-news footprint):**
Anna, Murphy, Fairview, Princeton, Melissa, Parker, Lucas, Farmersville — council members not already covered as a Tier-1 mayor.

**Tier 3 — low/no known evidence (small-town councils, mirrors the 221 headshot finding):**
Blue Ridge, Josephine, Lavon, Lowry Crossing, Nevada, Saint Paul, Van Alstyne, Weston — council members not already covered as a Tier-1 mayor. Attempt every person anyway (D-01/D-08) — expect a high blank rate, not a skip.

Longview (the one non-Collin, Gregg County city carried in `coverage.js`'s TX block) is in-scope per the "23 Collin browse cities" anchor's own cross-reference to `coverage.js` — confirm at execute time whether Longview officeholders are actually included in the 102 or already fully covered (Longview already carries `hasContext: true`, suggesting its officials likely already have stances from a prior phase — reconcile via §A's live query, don't assume).

### Pattern: One migration file per government, applied immediately
**What:** Author `<next_number>_<city>_stances.sql` (or split further, one file per person, matching the 1307–1313 Oro Valley precedent) covering every politician sourced in that government during that session, then apply it via `mcp__supabase-local__execute_sql` (or the operator's equivalent) and commit to `C:/EV-Accounts` before moving to the next government.
**When to use:** Every government in this phase.
**Example:** See Code Examples below (migration 1307, copied nearly verbatim).

### Anti-Patterns to Avoid
- **One giant end-of-phase migration:** Defeats D-08's per-city blank register and means an interrupted session loses everything, not just the in-progress city.
- **Trusting the subagent's embedded scale text for `housing`/`taxes`/`healthcare`:** These 3 were rewritten in the "Plan D" topic-rewrite (2026-04-12/14) and the agent's built-in defaults are stale — see Pitfall 1.
- **Skipping the smallest towns because 221 found them photo-poor:** A poor headshot source (official site with no `<img>` portraits) says nothing about stance-evidence availability (council minutes, Ballotpedia, local news can still exist independently) — attempt every person per D-01.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Per-politician evidence research methodology (source tiers, quote gates, inversion traps) | A new stance-research prompt from scratch | The existing `politician-stance-researcher` subagent (`C:/EV-Accounts/.claude/agents/politician-stance-researcher.md`) | It already encodes 15+ inversion traps (topics where "1=progressive" is NOT a universal rule), 3 quote-selection gates, and a full de-identification protocol — all proven across 20+ phases; a fresh prompt risks re-deriving these the hard way |
| Determining which of the 11 topic UUIDs is "Criminalization of Homelessness" vs a similarly-named topic | Guessing from `short_title` text alone | The UUID cross-check in §B (exact UUID match between `src/lib/compass.js` `LOCAL_LENS_TOPICS`, CONTEXT.md, and `C:/EV-Accounts/backend/data/stance-research/wave3-topic-reference.txt`) | There is a similarly-named-but-distinct topic (`homelessness-response`, UUID `6fbf39ae...`) that is NOT one of the 8 Local Lens topics — name-matching alone would risk seeding the wrong topic_id |
| Writing to `inform.politician_answers`/`inform.politician_context` | A new insert helper/ORM call | The exact `VALUES (...) / ON CONFLICT (politician_id, topic_id) DO UPDATE` SQL pattern already used in migrations 1307–1313 and 998 | This is a hand-verified, currently-in-production pattern (3 weeks old) — copy it, don't reinvent the upsert shape |

**Key insight:** Every piece of this phase — the research methodology, the topic definitions, the write mechanics, even the blank-register convention — already exists in the codebase and has been exercised repeatedly this milestone and the prior one. The only genuinely new work is applying all of it to a new list of 102 names.

## Common Pitfalls

### Pitfall 1: The `politician-stance-researcher` subagent's embedded scale text is STALE for 3 of the 11 topics this phase needs
**What goes wrong:** The subagent file's own embedded topic list (used as its "authoritative scope" default per its own instructions) has different question/answer wording for `housing`, `taxes`, and `healthcare` than the current, live database wording.
**Why it happens:** The `inform.topic_rewrites` "Plan D" rewrite (completed 2026-04-12/14, per project memory `compass_live_topic_ids`) changed the question/answer text for Housing, Taxes, AI, Deportation, Healthcare, and Immigration — but the agent file (which predates that rewrite) was never updated. A second, more recent in-repo reference (`wave3-topic-reference.txt`, dated 2026-06-10) has the current wording and its UUIDs match CONTEXT.md's Local Lens IDs exactly (confirmed by direct comparison this session).
**How to avoid:** When dispatching the subagent for each politician, **explicitly pass the current question + 5-answer text from §B below** for `housing`, `taxes`, and `healthcare`, overriding whatever the agent would otherwise default to. For the other 8 topics (civil-rights, homelessness, residential-zoning, economic-development, local-immigration, public-safety-approach, transportation-priorities, growth-and-development) the two sources agree — no override strictly needed, but passing all 11 explicitly (as §B provides) is simplest and removes any ambiguity.
**Warning signs:** A stance value that reads oddly against the reasoning — e.g., a value of 2 justified by "supports raising taxes on the wealthy to fund existing services" when the agent's stale scale's value-2 text says something about "middle-class families," a subtly different claim.

### Pitfall 2: Small-town Collin officials are frequently outside Ballotpedia's coverage scope
**What goes wrong:** WebFetch-ing `ballotpedia.org/[First_Last]` for a small-town council member 404s or resolves to an unrelated same-named person in a different state (confirmed this session: `Jacqueline_Kiker_Brown_(Blue_Ridge_City_Council_Post_4,_Georgia...)` — a Georgia homonym trap, not the Texas Blue Ridge).
**Why it happens:** Ballotpedia's own scope statement (confirmed via WebSearch this session) covers only "the 100 largest cities in America by population" on a scheduled-update basis; Blue Ridge, TX (pop. ~1,000s) is well outside that. The subagent's memory (`MEMORY.md`) already documents a near-identical homonym trap for a different politician (Steven King, HI-2 vs. Iowa's Steve King) — the same risk-class recurs here.
**How to avoid:** Confirm state/city in the URL slug or page body before accepting a Ballotpedia hit as evidence for a Collin, TX person. For towns confirmed outside Ballotpedia's scope (§C, Tier 3), go straight to official council-minutes/agenda-center sources and local news rather than spending a fetch cycle on a Ballotpedia guess likely to 404 or homonym-trap.
**Warning signs:** A Ballotpedia URL that resolves but the page's own text names a different state, a different office type, or a different election year than expected.

### Pitfall 3: Frisco Place 4 officeholder confusion — RESOLVED, but a live cross-check is still worth 30 seconds
**What goes wrong:** Migration `1404` (2026-07-24) initially seated Gopal Ponangi as Frisco Place 4 based on a Collin-only canvass read; Ballotpedia still shows both Jared Elad and Ponangi as June 2025 runoff candidates (confirmed via WebSearch this session — both individual candidate pages still exist and are ambiguous on their own).
**Why it happens:** Frisco's Place 4 race was a Collin/Denton dual-county race; a Collin-only canvass read the wrong winner. This was **already caught and corrected** by migration `1409_frisco_place4_correct_seat_jared_elad.sql` (confirmed present in `C:/EV-Accounts/backend/migrations/`) — Elad is now the correctly-seated officeholder, and 221's `221-CONFIRMED-BLANK.md` explicitly records Ponangi as un-seated (`is_active=false`, `office_id=NULL`) and "not a headshot gap."
**How to avoid:** Do not re-litigate this — attach Frisco Place 4 stance evidence to whichever `politician_id` §A's live worklist query returns for that seat (should be Elad's `politician_id`, not Ponangi's). If §A's query somehow still surfaces Ponangi as active, treat that as a live-data regression worth a `checkpoint:human-verify`, not a silent re-application of the Ponangi seating.
**Warning signs:** Any query result showing two active politicians for the same Frisco Place 4 office, or a Ponangi row with `is_active=true`.

### Pitfall 4: `is_vacant` filter — reuse the Phase 221 fix, don't reintroduce the bug
**What goes wrong:** Filtering with `p.is_vacant = false` alone silently drops every row where `is_vacant IS NULL`.
**Why it happens:** `IS NULL` means "not explicitly marked vacant" — i.e., seated — but a plain `= false` comparison in SQL evaluates to `NULL` (neither true nor false) for a NULL operand, which `WHERE` treats as excluded. This exact bug hid **7 active, imageless officeholders** in the Phase 221 audit (Brittany Colberg, Doug Charles, Chris Schulmeister, and 4 others), undercounting the true scope by ~4% (153 vs. true 157).
**How to avoid:** Every worklist/scope query this phase MUST use `(p.is_vacant = false OR p.is_vacant IS NULL)`, never `p.is_vacant = false` alone. §A's SQL below already applies this.
**Warning signs:** A live-scope total that's suspiciously close to a stale prior estimate without independent re-derivation.

### Pitfall 5: A successful stance in a currently-`hasContext:false` city needs a `coverage.js` update, and it's easy to forget
**What goes wrong:** `src/lib/coverage.js`'s Texas block currently has `hasContext: true` on only 12 of the 24 entries (Allen, Anna, Celina, Frisco, Longview, McKinney, Melissa, Murphy, Plano, Princeton, Prosper, Richardson). The other 12 (Blue Ridge, Fairview, Farmersville, Josephine, Lavon, Lowry Crossing, Lucas, Nevada, Parker, Saint Paul, Van Alstyne, Weston) have **zero** stances today. If this phase sources even one stance in any of those 12, the chip should flip to `true` — but nothing forces that edit; it is easy to close the phase with data seeded but the chip still silently `false`.
**Why it happens:** `coverage.js` is a hand-maintained data file, not derived at runtime from `inform.politician_answers` — every prior phase that added a jurisdiction's first stance had to remember to append `hasContext: true` as an explicit step (e.g., "Oro Valley... hasContext:true is DB-honest: Plan 03 seeded evidence-only compass stances").
**How to avoid:** At phase close, re-run the BEFORE/AFTER query (§F) grouped by city and diff against the current `hasContext` flags in `coverage.js`; add `hasContext: true` to any of the 12 zero-coverage cities that gained ≥1 stance. Leave it `false`/absent for any city that ends the phase still at zero (an honest outcome, not a failure — small towns may end mostly blank per §C).
**Warning signs:** Phase closes with new `inform.politician_answers` rows for, say, Blue Ridge, but `coverage.js` still shows no `hasContext` flag on Blue Ridge's entry.

## Code Examples

Verified patterns from the current, live repository (not hypothetical):

### Idempotent stance + evidence upsert (copy this shape exactly)
```sql
-- Source: C:/EV-Accounts/backend/migrations/1307_oro_valley_mayor_stances.sql (applied 2026-07-11, AUDIT-ONLY)
BEGIN;

INSERT INTO inform.politician_answers (politician_id, topic_id, value)
VALUES ('<politician-uuid>',
        '<topic-uuid>',
        3.0)
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET value = EXCLUDED.value;

INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
VALUES ('<politician-uuid>',
        '<topic-uuid>',
        $$One-to-three-sentence reasoning citing a specific dated action or quote...$$,
        ARRAY['https://example.gov/source-page']::text[])
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;

COMMIT;
```
Repeat the `INSERT ... INSERT` pair once per (politician, topic) — see the full file for a 5-topic, single-politician example. Dollar-quoting (`$$...$$` or `$stz$...$stz$`) is used for `reasoning` text to safely embed quotes/apostrophes from sourced quotations.

### Resolving `politician_id` by `external_id` instead of hardcoding a UUID (alternate style, migration 998)
```sql
-- Source: C:/EV-Accounts/backend/migrations/998_horacio_ortiz_stances.sql
WITH pol AS (SELECT id FROM essentials.politicians WHERE external_id = -700991),
d(topic_key, val, reasoning, sources) AS (
 VALUES
  ('homelessness', 5::numeric, $stz$...reasoning...$stz$, ARRAY[$stz$https://...$stz$]::text[])
),
ans AS (
 INSERT INTO inform.politician_answers (politician_id, topic_id, value)
 SELECT pol.id, t.id, d.val
 FROM d JOIN inform.compass_topics t ON t.topic_key=d.topic_key AND t.is_live=true CROSS JOIN pol
 ON CONFLICT (politician_id, topic_id) DO UPDATE SET value=EXCLUDED.value
 RETURNING 1
)
INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
SELECT pol.id, t.id, d.reasoning, d.sources
FROM d JOIN inform.compass_topics t ON t.topic_key=d.topic_key AND t.is_live=true CROSS JOIN pol
ON CONFLICT (politician_id, topic_id) DO UPDATE SET reasoning=EXCLUDED.reasoning, sources=EXCLUDED.sources;
```
This `topic_key`-joined style is convenient for multi-topic, single-politician migrations since it avoids hand-copying each topic UUID.

## Research Question A: Live Worklist Derivation

**This research session had no live database tool access** (no `mcp__supabase-local__execute_sql` bound to this agent — the same "gsd-executor/research has no Supabase MCP" constraint documented for prior v25.0 phases, e.g. 220-RESEARCH.md's identical disclosure). **The 157/55/102 anchor in CONTEXT.md is therefore last-known, not re-verified this session.** Exactly as Phase 221 discovered for its own stale headshot-scope memo, the executor **MUST** re-run the query below live and treat its output as authoritative — this document's numbers are a planning anchor, not a fact.

### Exact SQL for the executor to run at plan/execute time

```sql
-- Step 1: Derive the live Collin-scope worklist with per-person stance counts.
-- CRITICAL: (is_vacant = false OR is_vacant IS NULL) — NEVER is_vacant = false alone
-- (NULL means seated; this exact bug hid 7 officeholders in the Phase 221 audit).
WITH collin_scope AS (
  SELECT p.id AS politician_id, p.full_name, o.title, o.representing_city,
         g.geo_id, g.name AS government_name
  FROM essentials.politicians p
  JOIN essentials.offices o ON o.id = p.office_id
  JOIN essentials.chambers ch ON ch.id = o.chamber_id
  JOIN essentials.governments g ON g.id = ch.government_id
  WHERE p.is_active = true
    AND (p.is_vacant = false OR p.is_vacant IS NULL)
    AND g.geo_id IN (
      '4801924','4803300','4808872','4813684','4825224','4825488','4827684','4838068',
      '4841800','4843888','4844308','4845012','4845744','4847496','4850100','4850760',
      '4855152','4858016','4859576','4859696','4861796','4864220','4874924','4877740'
    )  -- the 24-entry TX coverage.js block (23 Collin + Longview); cross-check names against o.representing_city
),
stance_counts AS (
  SELECT cs.*, COUNT(pa.topic_id) AS stance_count
  FROM collin_scope cs
  LEFT JOIN inform.politician_answers pa ON pa.politician_id = cs.politician_id
  GROUP BY cs.politician_id, cs.full_name, cs.title, cs.representing_city, cs.geo_id, cs.government_name
)
SELECT * FROM stance_counts ORDER BY government_name, title;

-- Step 2: BEFORE summary counts (record these before any writes).
SELECT
  COUNT(*) AS total_in_scope,
  COUNT(*) FILTER (WHERE stance_count > 0) AS with_stance,
  COUNT(*) FILTER (WHERE stance_count = 0) AS without_stance
FROM stance_counts;  -- (re-materialize the CTE above, or wrap Step 1 in a subquery)
```

**Notes for the executor:**
- `geo_id IN (...)` is used instead of `representing_city ILIKE ANY(...)` because it's the same cross-checked, government-row-precise approach 221 used — a city-name match can silently miss a government whose `representing_city` string doesn't exactly match `coverage.js`'s label (e.g., punctuation/casing drift).
- The `stance_count > 0` split assumes CONTEXT.md's 55/102 anchor was derived from **any** existing `inform.politician_answers` row (any topic, any lens), not specifically the 8 Local Lens topics. If the executor wants an apples-to-apples "has a Local-Lens-relevant stance" count instead, add `AND pa.topic_id IN ('669cac97...', ...)` restricted to the 11 topic UUIDs in §B. **Confirm which definition CONTEXT.md's 55/102 actually used before treating a mismatch as a discrepancy** — this research could not verify which definition was used (no DB access).
- Cross-check the resolved government set against `src/lib/coverage.js`'s Texas block exactly as 221's Task 1 did — flag any geo_id present in one but not the other.
- Confirm Longview's true status explicitly: it already carries `hasContext: true` in `coverage.js`, which suggests it may already be fully stanced (likely from an earlier phase, since it's a Gregg County city bundled into this TX list for browse purposes only) — don't assume it's part of the 102 without checking.

## Research Question B: Compass Topic Set — Verbatim Question + Answer Text

**Verification method (no live DB access this session):** Cross-referenced `src/lib/compass.js`'s `LOCAL_LENS_TOPICS` array (which is the frontend's offline fallback for the Local Lens, `key: 'local'`) against CONTEXT.md's 8 UUIDs (exact match, confirmed) and against `C:/EV-Accounts/backend/data/stance-research/wave3-topic-reference.txt` (dated 2026-06-10) — **every one of the 8 Local Lens UUIDs and all 3 legacy-tail UUIDs matches this file's `(id: ...)` annotations exactly.** This is a strong (UUID-level, not name-level) cross-check, but it is still `[CITED: repo file]`, not `[VERIFIED: live DB]` — recommend the executor spot-check 1–2 of these against `inform.compass_topics`/`inform.compass_stances` directly at the start of execution (a 30-second query) before mass-dispatching 102 research passes on unverified text.

**IMPORTANT — do not use the `politician-stance-researcher` subagent's own embedded scale text for `housing`, `taxes`, or `healthcare`.** That file's defaults are pre-"Plan D"-rewrite (stale since 2026-04-12/14) for exactly these 3 topics — see Pitfall 1. The text below is the current, correct wording for all 11 topics needed this phase.

### The 8 canonical Local Lens topics (D-06)

**1. Affordable Housing** — `669cac97-66a6-4087-b036-936fbe62efb3`
Q: *"What role should government play in making sure people can afford housing?"*
1. Directly build and operate public housing so anyone who needs a home can get one
2. Use rent caps, require new developments to include affordable units, and publicly fund new housing
3. Offer targeted help like subsidies for affordable projects, first-time buyer assistance, and easier building permits
4. Cut regulations and zoning rules so private developers can build more housing
5. Stay out of housing entirely and let the market decide prices and supply

**2. Civil Rights & Social Justice** — `0bc588c6-39e1-4084-b5de-cac909b8b762`
Q: *"What role should government play in addressing racial and social inequality?"*
1. Mandate racial equity requirements in all institutions and provide reparations
2. Strengthen civil rights enforcement and address systemic discrimination
3. Maintain current civil rights laws while promoting equal opportunity
4. Limit federal civil rights enforcement to clear cases of discrimination
5. Eliminate affirmative action and all race-based government programs

**3. Criminalization of Homelessness** — `4938766b-b45a-46e3-93bd-b8b30651271a` (topic_key: `homelessness`; do not confuse with the distinct, non-Local-Lens topic `homelessness-response`, UUID `6fbf39ae-6b19-4182-b4c2-6a8d25c86c0f`)
Q: *"How should government address people sleeping or camping in public spaces?"*
1. Protecting the right to sleep in public spaces and redirecting enforcement budgets toward permanent supportive housing and mental health services
2. Decriminalizing public sleeping while investing in shelter capacity, outreach workers, and voluntary service connections
3. Allowing enforcement only when adequate shelter beds are available, with citations diverting people to services rather than the criminal justice system
4. Prohibiting encampments on public property with graduated warnings and penalties, while requiring jurisdictions to maintain basic shelter options
5. Banning public camping and sleeping with criminal penalties to maintain public safety and order, relying on existing social services for those who seek help

**4. Economic Development Incentives** — `eb3d1247-0de1-4b7f-baec-7259861efd53` (topic_key: `economic-development`)
Q: *"How should your city attract businesses and support economic development?"*
1. No corporate tax incentives; invest in public services and infrastructure to attract business organically
2. Small business support and local entrepreneur programs only; avoid large corporate subsidies
3. Targeted incentives for specific industries with community benefit agreements and job quality requirements
4. Compete actively for major employers with significant tax abatements and infrastructure investment
5. Offer maximum incentives to attract any large employer; economic growth is the top city priority

**5. Local Immigration Enforcement** — `b9ccee94-ad96-4f10-b655-889d8e5abe92` (topic_key: `local-immigration`)
Q: *"How should your city's police department relate to federal immigration enforcement?"*
1. Refuse all ICE detainers; prohibit city employees from sharing immigration status information with federal agencies
2. Comply only with court-ordered detainers; protect undocumented crime victims and witnesses from referral
3. Follow federal law as required but do not use city resources for proactive immigration enforcement
4. Honor ICE detainers and share information proactively when federal agencies request it
5. Direct city police to actively assist with immigration enforcement and support federal detention operations

**6. Public Safety Approach** — `e9ebefcd-c496-45e8-b816-a79f8442ba85`
Q: *"How should your city fund and operate public safety services?"*
1. Redirect a significant portion of the police budget to social services, mental health, and community programs
2. Maintain current police staffing but shift non-violent calls to unarmed mental health co-responders
3. Keep current public safety funding while adding crisis response teams for mental health and addiction calls
4. Increase police staffing, equipment, and pay to improve response times and deter crime
5. Make expanding the police budget the top city spending priority over other municipal services

**7. Residential Zoning** — `d4f18138-a2e0-4110-b925-7387d9d0d16d`
Q: *"What should guide decisions about housing density and neighborhood character in your city?"*
1. Protect existing neighborhood character strictly; require community votes before any rezoning
2. Allow modest density increases (duplexes, accessory units) with strong design review and neighborhood input
3. Allow multifamily and mixed-use near commercial corridors while protecting most residential zones
4. Upzone broadly to allow multifamily by right; streamline approvals and reduce parking requirements
5. Eliminate single-family-only zoning; allow any housing type on any lot citywide

**8. Transportation Priorities** — `ba59337e-30e2-4aba-a39a-426b3366eb27`
Q: *"Where should your city focus its transportation investment?"*
1. Prioritize pedestrian infrastructure, cycling networks, and public transit; reduce parking requirements citywide
2. Invest equally in roads and multimodal options; require bike lanes and sidewalks on all new road projects
3. Maintain roads while selectively adding transit connections and pedestrian improvements where density supports it
4. Focus on road capacity and traffic flow; transportation investment should serve the majority who drive
5. Prioritize highway access and abundant free parking as the foundation of local transportation policy

### The 3 legacy-tail topics (D-07, attempt-if-evidence-exists only)

**9. Taxation & Public Spending** — `f7e5678d-dadd-4556-a2fc-446e24642ceb` (topic_key: `taxes`) — **REWRITTEN post-Plan-D; do not use the subagent's built-in scale for this topic**
Q: *"How should government balance what it collects in taxes against what it spends on public services?"*
1. Significantly raise taxes on wealthy people and large companies to fund more public services
2. Moderately raise taxes on wealthy people and large companies to fund existing services
3. Keep the current tax system mostly as-is with small adjustments to close unfair loopholes
4. Cut taxes for everyone and scale back public services to match
5. Drastically cut taxes and shrink government so people and businesses keep more of their money

**10. Growth & Development Pace** — `fb25c1ac-91cc-49bf-8afc-c7fa22ef45e4` (topic_key: `growth-and-development`) — unchanged since before the rewrite; agrees with the subagent's built-in text
Q: *"How should your city manage population growth and new development?"*
1. Impose growth limits; require voter approval for major annexations or large-scale developments
2. Allow growth only where existing infrastructure can support it; slow approvals until capacity catches up
3. Plan proactively — invest in infrastructure ahead of growth to support responsible expansion
4. Streamline permitting, reduce fees, and actively recruit development to grow the city's tax base
5. Remove regulatory barriers to development entirely; let market demand determine growth pace

**11. Healthcare Access** — `e8dad4a8-eb93-4931-91f5-d8fb5d7dd529` (topic_key: `healthcare`) — **REWRITTEN post-Plan-D; do not use the subagent's built-in scale for this topic**
Q: *"What role should government play in healthcare access?"*
1. Make healthcare free and available to everyone, paid for and run by the public sector
2. Make sure everyone has affordable coverage through a mix of public programs and regulated private insurance
3. Help people who can't afford care and expand programs for seniors and low-income residents, while keeping private insurance for everyone else
4. Only help the poorest people afford healthcare and leave everyone else to employers and private insurance
5. Stay out of healthcare entirely and let private markets handle all coverage decisions

## Research Question C: Per-City Evidence-Source Availability Map

**Method:** A small number of targeted WebSearch checks (Ballotpedia's own scope statement, a Community Impact Newspaper coverage check, a Frisco 2025-election spot-check, a VOTE411/LWV-Collin-County confirmation), generalized to all 23 cities using the same evidence-density signal 221 already established for headshots (city size + CMS sophistication correlates with online civic-record richness). This is a **tier map, not a per-city verified audit** — treat tier assignments below as `[CITED: this session's WebSearch]` for the cities explicitly checked, and `[ASSUMED — generalized from city-size/CMS pattern]` for the rest.

| Tier | Cities | Expected Sources | Expected Hit Rate |
|------|--------|------------------|--------------------|
| **High** (verified this session) | Frisco, Plano, McKinney, Allen, Richardson | Ballotpedia individual candidate pages **confirmed present** (Frisco 2025 Place 4/Place 2 races directly confirmed via WebSearch this session — multiple candidate pages exist); Community Impact Newspaper has a dedicated local bureau/reporter per city (confirmed for Frisco, McKinney); Star Local Media, local NBC5/WFAA/Fox4 DFW coverage for larger races; official CivicPlus/CivicEngage sites with searchable AgendaCenter minutes | High — expect most council members and all mayors to have at least one sourced topic |
| **Medium** (inferred; Community Impact/VOTE411 plausible but not individually confirmed) | Prosper, Celina, Anna, Murphy, Fairview, Princeton, Melissa | Community Impact covers the broader Collin County market (confirmed it publishes county-level candidate Q&As; city-level coverage for these mid-size cities is plausible but not individually verified this session); VOTE411/LWV of Collin County (confirmed as a real, active resource — `lwvcollin.org` directs voters to a personalized VOTE411 ballot) may carry a questionnaire; official council-minutes AgendaCenter should exist (all of these use CivicPlus per Ph220's research) | Medium — expect mayors and a handful of council members to yield a stance; several honest blanks expected for lower-profile seats |
| **Low** (inferred from small-town pattern, not individually confirmed) | Farmersville, Parker, Lucas, Weston | Below Ballotpedia's "100 largest cities" scope (confirmed as Ballotpedia's own stated scope boundary this session, and directly confirmed Blue Ridge falls outside it — these towns are comparably sized or smaller); official council-minutes AgendaCenter likely exists but is unlikely to contain explicit policy positions (procedural votes only, rarely a clean "on-topic position") | Low — expect mostly blanks except where a mayor gave a local-news interview or wrote a State-of-the-Town-style address |
| **Very low / likely mostly blank** (mirrors the 221 "text-only roster" finding) | Blue Ridge, Josephine, Lavon, Lowry Crossing, Nevada, Saint Paul, Van Alstyne | **Directly confirmed this session:** Blue Ridge has no Ballotpedia candidate coverage (search returned only an unrelated Georgia homonym and the city's own bare `/council` page). 221's `221-CONFIRMED-BLANK.md` already independently confirmed these exact 7 towns (identical list) have **text-only** official rosters with no portraits — the same small-town profile predicts thin-to-nonexistent policy-position evidence online | Very low — attempt every person per D-01/D-08, but expect the large majority to end honestly blank; this is the correct, honest outcome, not a research failure |

**Council-minutes / recorded-votes pattern (applies to any tier):** Ph220's contact-data research already confirmed the CMS platform for every one of these 23 cities is one of three families — CivicPlus/CivicEngage (majority, usually with an "AgendaCenter" or "FormCenter" minutes module), a WordPress-derivative (Farmersville/Drupal, Fairview/Ninja Forms), or a smaller niche CMS (Van Alstyne/Membershipware). Any of these can host searchable meeting minutes/agendas — a genuine D-05-qualifying source when a specific agenda item shows a recorded vote or motion — but reading them for an explicit position on one of the 11 compass topics (vs. a routine procedural vote) is labor-intensive and should not be assumed productive for every person.

**Longview caveat:** Longview already has `hasContext: true` and is a Gregg County (not Collin) city bundled into the TX browse list — confirm via §A's live query whether Longview officeholders are already fully stanced before spending research time there.

## Research Question D: Realistic Throughput and Batching

**Per-person cost estimate:** Based on the `politician-stance-researcher` subagent's documented methodology (WebFetch a handful of Tier 1–3 URLs per person, assess up to 11 topics, write reasoning + sources) and this milestone's own precedent (Oro Valley's 7 officials across ~36 topics took roughly one migration file each within a single wave), a reasonable estimate for **11 topics per person** (much lighter than the full 36-topic AZ sweeps) is:
- **High-tier cities:** ~5–10 minutes per politician (evidence is easy to find; the time cost is reading/synthesizing multiple sources, not searching for them)
- **Low/very-low-tier cities:** ~3–5 minutes per politician (a few WebFetch attempts that mostly 404 or return thin text-only pages, followed by an honest blank-register entry) — **faster per person, not slower**, since a genuine dead-end is quick to confirm once the Tier-1/2/3 URL patterns are exhausted

Across 102 people this suggests **roughly 8–14 hours of research time total**, heavily front-loaded toward the high-tier cities (more topics actually get sourced there, so more time per person) and fast through the Tier "very low" towns (mostly quick honest blanks).

**Recommended batch/checkpoint structure (survives interruption):**
1. **One plan/wave per evidence tier** (4 tiers as defined in §C), executed in D-02's mandated order (Tier 1 → Tier 2 → Tier 3 → Tier "very low").
2. **Within each tier, one migration file per government** (not per tier, not one giant file) — apply and commit immediately after each government's people are all researched, before moving to the next government. This bounds any crash/interruption to losing at most one city's un-applied work.
3. **Update `222-CONFIRMED-BLANK.md` (D-08) incrementally, per government**, alongside each migration — not as a single end-of-phase write. Mirrors 221's exact pattern (its blank register was assembled progressively across Batch A/B, not written once at the end).
4. **Commit after every government**, not after every tier — a tier can contain 5–8 governments; committing only at tier boundaries still risks losing several cities' work to an interruption.

This yields roughly 23 commit points (one per government) grouped into 4 waves/plans by tier — consistent with GSD's wave-based execution model and cheap to resume mid-tier if a session is interrupted.

## Research Question E: Application Mechanics

**Column set (confirmed via 3 live, currently-in-production migration files — 1307–1313 and 998):**
- `inform.politician_answers (politician_id uuid, topic_id uuid, value numeric)` — unique on `(politician_id, topic_id)`; `ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = EXCLUDED.value` makes re-application idempotent. Value is written as e.g. `3.0` (numeric, not integer, but always a whole 1–5 value per the `stance_research_format` convention — "value: 1–5 integer... apply via parseInt").
- `inform.politician_context (politician_id uuid, topic_id uuid, reasoning text, sources text[])` — **this is the evidence/citation storage** (answers Research Question E's ask to "inspect the live table for an existing evidence/source column" — it exists and is actively used, not something to add). Also unique on `(politician_id, topic_id)`, same `ON CONFLICT ... DO UPDATE` idempotency pattern. `reasoning` is a 1–3 sentence paragraph citing a specific dated action/quote; `sources` is a Postgres `text[]` array of real URLs.
- Both tables are written together, always as a pair, in every example found this session — never `politician_answers` alone without a matching `politician_context` row.

**Migration numbering & registration convention:** This phase should continue the exact pattern used by every stance-seeding migration found this session (938–998, 1307–1313): a numbered file `C:/EV-Accounts/backend/migrations/<N>_<slug>.sql`, **git-committed** to the repo, but explicitly marked **AUDIT-ONLY** in its own header comment and **NOT registered in `schema_migrations`** — meaning it does not advance the "official" structural migration ledger, but it IS a real, permanent, version-controlled file. The on-disk highest numeric prefix at research time is **1415** (`1415_bend_or_2026_races_candidates.sql`, unrelated OR work sharing the same global counter) — the executor must re-check this number live before assigning numbers, since concurrent milestone work moves it between sessions (confirmed: numbers 1411–1415 appeared between the research and writing of this document, none of them Collin-related).

**Applying the migrations:** Per this milestone's own established convention (explicitly stated in 220-03-SUMMARY.md: "the operator applies them ... via Supabase MCP (not by running the gitignored `.ts` script with a live `DATABASE_URL`, per this milestone's standing convention that gsd-executor has no Supabase MCP but the orchestrator/operator does)") — the phase-222 executor should **author** the SQL migration file (committed to git) and let the **orchestrator/operator apply it via `mcp__supabase-local__execute_sql`**, mirroring exactly how 218–220 worked. Do not assume the executor itself can run the apply step.

## Research Question F: Verification / Close-Out

### BEFORE/AFTER coverage query
```sql
-- Run once BEFORE any writes (BEFORE snapshot) and once again at phase close (AFTER snapshot).
-- Same collin_scope CTE as §A.
SELECT
  COUNT(*) AS total_in_scope,
  COUNT(*) FILTER (WHERE stance_count > 0) AS with_stance,
  COUNT(*) FILTER (WHERE stance_count = 0) AS without_stance
FROM stance_counts;
```
Report the delta (e.g., "55 → N with ≥1 stance, 102 → (102-N) remaining without"). Also break this down **per government** to drive the `coverage.js` `hasContext` reconcile (Pitfall 5):
```sql
SELECT government_name,
       COUNT(*) AS officeholders,
       COUNT(*) FILTER (WHERE stance_count > 0) AS with_stance
FROM stance_counts
GROUP BY government_name
ORDER BY government_name;
```
Any government showing `with_stance > 0` that currently has NO `hasContext: true` chip in `src/lib/coverage.js` needs that chip added at close.

### Split-section check (standing milestone convention)
This phase only inserts into `inform.politician_answers`/`inform.politician_context`, neither of which touches `essentials.offices`/`chambers`/`government_bodies`, so a regression here would indicate an unrelated bug — but run it anyway per convention:
```sql
SELECT ch.name_formal, COUNT(DISTINCT COALESCE(gb.display_name,'')) AS distinct_section_names,
  array_agg(DISTINCT COALESCE(gb.display_name, '(none)') ORDER BY COALESCE(gb.display_name, '(none)')) AS section_names,
  COUNT(DISTINCT o.id) AS office_count
FROM essentials.offices o
JOIN essentials.chambers ch ON ch.id = o.chamber_id
LEFT JOIN essentials.districts d ON d.id = o.district_id
LEFT JOIN essentials.government_bodies gb
  ON gb.geo_id = d.geo_id AND gb.state = d.state
  AND gb.body_key = COALESCE(NULLIF(ch.name_formal,''), ch.name)
WHERE ch.name_formal != ''
GROUP BY ch.name_formal
HAVING COUNT(DISTINCT COALESCE(gb.display_name,'')) > 1
ORDER BY office_count DESC;
```
Expected result: 0 rows.

### Live browse spot-check
Per `browse_link_format`, `browseGovernmentList` cities (all 23 Collin entries) use `?browse_government_list=<geo_id>&browse_label=<Label>&browse_state=TX`. Recommended spot-check set: one Tier-1 city (e.g., Frisco: `?browse_government_list=4827684&browse_label=Frisco&browse_state=TX`) and one newly-flipped zero-to-nonzero Tier-3/4 city (whichever one this phase actually sources a first stance for). Results render inside an iframe (ev-ui widget) — use a **screenshot**, not a Playwright text snapshot, to confirm the compass spokes actually render for the newly-stanced officeholder.

## Validation Architecture

No automated JS/TS test framework covers civic-data seeding in this codebase — every prior deep-seed/stance phase (150, 193–198, 201–203, 218–220) validates via inline SQL gates + a live browse/profile spot-check, not a unit-test suite. This phase follows the identical pattern.

### "Test" Framework
| Property | Value |
|----------|-------|
| Framework | In-transaction/migration-header assertions + post-apply SQL gates (the 1307–1313/998 convention) |
| Config file | None — per-migration file in `C:/EV-Accounts/backend/migrations` |
| Quick run command | The migration's own `BEGIN;...COMMIT;` block, applied via `mcp__supabase-local__execute_sql` |
| Full suite command | Re-run the §A worklist query after all migrations apply; re-run the split-section check |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COLLIN-STANCE-01 | Every in-scope officeholder was genuinely attempted (not skipped) | manual (register-based) | Diff the §A worklist's 102 names against `222-CONFIRMED-BLANK.md` entries + applied migration rows — every name must appear in exactly one of the two | ❌ Wave 0 — `222-CONFIRMED-BLANK.md` does not exist yet, created progressively during execution |
| COLLIN-STANCE-02 | Every applied stance has `value` 1–5, a real `topic_id` from the 11-topic set, and a non-empty `sources` array | SQL gate | `SELECT * FROM inform.politician_answers pa JOIN inform.politician_context pc USING (politician_id, topic_id) WHERE pa.value NOT BETWEEN 1 AND 5 OR pc.sources IS NULL OR array_length(pc.sources,1) IS NULL OR array_length(pc.sources,1) = 0;` — must return 0 rows for this phase's newly-applied rows | ✅ — runnable immediately, no new test file needed |

### What "correct" means for an applied stance
1. A `politician_answers` row exists with an integer-valued `value` in `[1,5]` and a `topic_id` from the 11-topic set in §B.
2. A matching `politician_context` row exists with a non-empty `sources` array (≥1 real URL) and a `reasoning` paragraph that names a specific action, quote, or vote — not a vague generality.
3. The `politician_id` is genuinely in-scope (appears in §A's live worklist), and — the single most important negative check — **the cited source, when re-fetched, actually contains an explicit, on-topic statement matching the assigned value's direction** (not a suggestive-but-not-explicit signal, per D-04).

### Sampling strategy for spot-checking applied stances against their cited sources
Given ~102 people × up to 11 topics (a large number of individual claims), a full re-verification of every citation is not practical within this phase's own scope, but a defensible sample is:
- **100% of Tier-1 city stances** (Plano/Frisco/McKinney/Allen/Richardson/Prosper/Celina) — highest-traffic profiles, highest risk of a wrong reasoning/value mismatch being visible to real users first.
- **A 20% random sample across Tier 2/3/4** — re-fetch the cited source URL and confirm the quote/claim is actually present and matches the assigned direction (checking against the inversion-trap table in the `politician-stance-researcher` agent file for that topic_key).
- **100% of any stance where the `value` is 1 or 5** (the extremes) — these are the values most likely to reflect an inversion-trap error (e.g., scoring a pro-civil-rights official as 1 when the topic's scale actually runs progressive-at-1, or vice versa for a topic where progressive is at 5).

### What a false-positive looks like (the single most important failure mode)
A stance applied **without** explicit, on-topic evidence — i.e., a value inferred from party affiliation, from a vague/suggestive statement, or from pattern-matching to a similarly-positioned official in the same city. Concretely: `pc.sources` contains a URL that, when actually read, discusses a *related* but *different* topic (e.g., a general "supports small business" quote used to score `economic-development` when the quote never mentions incentives/subsidies), or a URL that supports the *opposite* direction from the assigned value (an inversion-trap miss). **Detection:** the 20%+100%-extremes sample above; also watch for any migration whose `reasoning` text is suspiciously generic ("supports responsible growth," "balances competing interests") rather than citing a specific dated vote, quote, or action — CONTEXT.md's D-04 requires the latter.

### BEFORE/AFTER count queries
See Research Question F above — the same `stance_counts` CTE, run once before any writes and again at close, both in aggregate and grouped per government.

## Environment Availability

| Dependency | Required By | Available | Notes |
|------------|------------|-----------|-------|
| `WebFetch`/`WebSearch` (this research session) | Sourcing per-city evidence tiers (§C) | ✓ | Sufficient for the small targeted sample this research needed |
| `mcp__supabase-local__execute_sql` | Live worklist derivation (§A), applying migrations, all SQL gates | ✗ this session | This is exactly why §A gives exact, runnable SQL rather than live counts — the executor/orchestrator has this tool per the milestone's standing convention (see 220-03-SUMMARY.md's identical disclosure) |
| `politician-stance-researcher` subagent | Per-politician research at execution time | ✓ (exists in `C:/EV-Accounts/.claude/agents/`) | Confirmed present and current this session; note Pitfall 1's override requirement |
| WebFetch-only tool discipline (subagent's own rule) | Avoiding WebSearch/Playwright quota contention | N/A this phase | The subagent's "never WebSearch" rule exists specifically for **parallel** sibling-agent dispatch; D-03 already mandates strictly sequential execution, so this constraint doesn't bind the same way — see Standard Stack's Supporting-tools note |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** live DB access — fallback is the exact SQL provided in §A/§F, to be run by whichever session/role has `mcp__supabase-local__execute_sql` bound (the plan-phase orchestrator or the execute-phase session, per this milestone's established division of labor).

## Security Domain

**`security_enforcement` treated as enabled (absent from config = enabled), but this phase has essentially no new attack surface.** This is a server-side data-seeding phase — no new user-facing input surface, no new API endpoint, no new auth/session logic. The only "input" is web-sourced research text that a human/agent transcribes into a SQL migration file (not a live user-submitted form), and the only "output" is data already rendered by an existing, unchanged frontend component (`CompassCard`/`MiniCompass`).

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No new auth surface |
| V3 Session Management | No | No new session surface |
| V4 Access Control | No | Writes are via the existing production-DB-access convention (operator/orchestrator applies via MCP), not a new user-facing write path |
| V5 Input Validation | Marginal | The SQL gate in Validation Architecture (`value NOT BETWEEN 1 AND 5`) is the closest analogue — enforce it as a post-apply check, not app-level input validation, since there's no app-level input here |
| V6 Cryptography | No | No new secrets/crypto |

### Known Threat Patterns for this phase's stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection via a maliciously-crafted quote/URL scraped from a web source, embedded unescaped into a migration | Tampering | Dollar-quoting (`$$...$$` / `$stz$...$stz$`) as already used in every example migration this session — never string-concatenate scraped text into a bare SQL string; if a scraped quote itself contains a `$$`-matching delimiter (rare), use a distinct tag (`$stz$`, `$q1$`, etc.) per the existing convention |
| Fabricated/hallucinated source URL passed through to production | Repudiation / Information Disclosure (of false info) | The `politician-stance-researcher` subagent's own "mentally audit each URL... if you cannot find a real source, leave the source field blank" rule, plus this phase's D-04 evidence-only requirement and the Validation Architecture's spot-check sampling |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `wave3-topic-reference.txt`'s question/answer text is the current, live wording for all 11 topics (UUID-matched, not independently confirmed via a live DB query) | §B | Medium — if the live DB has since diverged from this file (e.g., a further un-recorded rewrite), the executor would hand the research agent stale wording for a topic; mitigated by recommending a 1–2-topic live spot-check before mass-dispatch |
| A2 | CONTEXT.md's 55/102 split was derived from "any" `inform.politician_answers` row, not restricted to the 11 topics this phase cares about | §A | Low-medium — affects only how the "already has ≥1 stance" baseline is interpreted; does not affect correctness of new writes, only the reported delta framing |
| A3 | The per-city evidence tier assignments in §C for the 14 cities NOT individually WebSearch-checked this session (Anna, Murphy, Fairview, Princeton, Melissa, Parker, Lucas, Farmersville, Josephine, Lavon, Nevada, Saint Paul, Van Alstyne, Weston) are accurate generalizations from the confirmed pattern (city size + CMS type + Ballotpedia's stated scope) | §C | Medium — a specific town could over- or under-perform its tier (e.g., a small town with an unusually active local Facebook-page-turned-news-source); the tier map is meant to inform sequencing/expectations, not gate whether a city is attempted (D-01 mandates attempting all 102 regardless) |
| A4 | The 12 currently-`hasContext:false` Collin cities in `coverage.js` genuinely have zero stances today (inferred from the flag itself, not independently counted via live DB) | Pitfall 5 | Low — if any of the 12 actually has ≥1 stance already (an un-reconciled flag from a much earlier phase), the Pitfall 5 close-out task is a no-op for that city, not harmful either way |
| A5 | Migration numbers 1411–1415 (observed on disk during this research session) belong to concurrent, unrelated work (Bend OR / Fairview email dedupe / Plano alias) and not to any in-flight Phase 222 work | §E | Low — purely informational; the executor re-derives the "next available" number live regardless, per standing convention |

## Open Questions

1. **Which definition did CONTEXT.md's 55/102 anchor actually use — "any stance" or "any of the 11 relevant-topic stances"?**
   - What we know: CONTEXT.md states "55 already have ≥1 stance, 102 have none" without specifying topic scope.
   - What's unclear: whether a person with, say, only a Federal-Lens stance (irrelevant to a municipal seat) was counted as "has a stance" in that anchor.
   - Recommendation: run both variants of the §A count at execution start and reconcile against 55/102; if they diverge, note which one CONTEXT.md's anchor actually matches and use that definition consistently for the BEFORE/AFTER delta.

2. **Is Longview (Gregg County) actually part of the 102, or already fully covered?**
   - What we know: Longview carries `hasContext: true` already and is bundled into the TX `coverage.js` block for browse purposes despite not being a Collin County government.
   - What's unclear: whether its officeholders are in the un-stanced 102 or were already stanced in an earlier phase (its `hasContext: true` chip suggests the latter).
   - Recommendation: let §A's live query settle this — if Longview shows 0 un-stanced people, simply skip it in the wave/batch plan without treating that as a gap.

3. **Should the Assumptions Log's tier map (§C) for the 14 not-individually-checked cities be refined with a few more targeted WebSearch checks before finalizing the wave 1 plan?**
   - What we know: the task instructions explicitly asked for a SMALL number of targeted checks, generalized — not an exhaustive 23-city audit.
   - What's unclear: whether the planner wants 2–3 more spot-checks (e.g., one Tier-2 city, one more Tier-3 city) before committing to the exact wave/batch order, or whether §C's current confidence level is sufficient to start Wave 1 (Tier 1, already the highest-confidence tier regardless).
   - Recommendation: start Wave 1 (Tier 1) regardless — its evidence richness is independently confirmed — and let the executor's own findings in Tier 2 refine or confirm the §C tier map before Wave 2 begins.

## Sources

### Primary (HIGH confidence — direct read of current, live repository files this session)
- `C:/EV-Accounts/.claude/agents/politician-stance-researcher.md` — subagent methodology, evidence hierarchy, inversion-trap table, CSV output format
- `C:/EV-Accounts/backend/data/stance-research/wave3-topic-reference.txt` (dated 2026-06-10) — UUID-exact question/answer text for all 11 topics
- `C:/EV-Accounts/backend/migrations/1307_oro_valley_mayor_stances.sql` (and 1308–1313) — current, in-production write-mechanics pattern
- `C:/EV-Accounts/backend/migrations/998_horacio_ortiz_stances.sql` — alternate topic_key-joined write style
- `essentials/src/lib/compass.js` — `LOCAL_LENS_TOPICS` UUID array (frontend fallback), spoke-selection logic confirming no frontend change needed
- `essentials/src/lib/coverage.js` — the 24-entry TX `coverage.js` block, `hasContext` flag audit
- `.planning/phases/221-.../221-CONFIRMED-BLANK.md` — the blank-register precedent + the 7-city "text-only roster" evidence pattern reused in §C
- `.planning/phases/220-contact-data-backfill/220-RESEARCH.md` — CMS-platform-per-city findings reused in §C; the "gsd-executor has no Supabase MCP" convention disclosure

### Secondary (MEDIUM confidence — WebSearch this session, cross-checked where possible)
- Ballotpedia's own scope statement ("100 largest cities... scheduled updates") and Frisco 2025 candidate-page confirmations
- Community Impact Newspaper's Collin County candidate-Q&A coverage confirmation
- League of Women Voters of Collin County (`lwvcollin.org`) directing to VOTE411 personalized ballots

### Tertiary (LOW confidence — inferred/generalized, not individually verified)
- Per-city evidence tier assignments in §C for the 14 cities not individually checked this session (see Assumption A3)

## Metadata

**Confidence breakdown:**
- Write mechanics (§E) / topic question-answer text (§B): HIGH — directly read from current, live, git-committed repository files, cross-checked by UUID.
- Live worklist counts (§A): MEDIUM — exact SQL provided and internally consistent with the 221 precedent, but this session had no DB tool access to execute it; CONTEXT.md's 157/55/102 anchor is unverified this session.
- Per-city evidence tiers (§C): MEDIUM/LOW — a small, explicitly-scoped sample generalized per the task's own instruction, not an exhaustive audit.
- Throughput/batching estimate (§D): MEDIUM — reasoned from this milestone's own precedent (Oro Valley et al.), not independently timed.

**Research date:** 2026-07-24
**Valid until:** ~7 days for the live worklist/scope counts (rosters shift, per this milestone's own repeated experience with stale scope memos); ~30 days for the topic question/answer text and write mechanics (stable unless another topic-rewrite event occurs — recommend a live spot-check at execution start regardless, per §B).

## RESEARCH COMPLETE
