# Phase 211: Deep-Dive Stance Research (Trump, Vance, Rubio) - Context

**Gathered:** 2026-07-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Full-compass, evidence-cited stance research is completed and applied for three federal
figures — **Donald Trump** (President), **J.D. Vance** (VP), and **Marco Rubio** (Secretary of
State; former FL Senator) — so their compasses render from real, sourced positions.

This is a **data phase**. No application code changes. It reuses the established stance-research
workflow (research agent → cited artifact → apply script → upsert into
`inform.politician_answers`). Independent of the tabs/lens work (Phases 207–210).

**Live DB starting state (verified 2026-07-19):**

| Official | politician_id | Role | Existing answers |
|---|---|---|---|
| Donald Trump | `104102e6-08c1-494f-a9d4-6ef129595bf2` | President | 21 (no stored citation) |
| J.D. Vance | `a809747d-3e53-4e9e-b3a1-6641dac2455c` | VP | 24 (no stored citation) |
| Marco Rubio | `7c8e4442-e13e-485a-8993-b05ca110410d` | Sec. of State (fmr. Senator) | 0 |

**44 active compass topics** (`inform.compass_topics WHERE is_active = true`). `office_scope` is
null on all — no built-in applicability filter. `inform.politician_answers` has **no citation
column** (`politician_id, topic_id, value, write_in_text`); citations live only in the research
artifact (`bundle.json`), so "100% cited" is an artifact/provenance guarantee, not a DB field.

</domain>

<decisions>
## Implementation Decisions

### Topic scope
- **D-01:** Research **all 44 active compass topics** for each of the three officials — no
  pre-filtering. This includes the 8 `judicial-*` topics and the ~11 hyper-local topics
  (city-sanitation, jail-capacity, residential-zoning, rent-regulation, transportation-priorities,
  growth-and-development, local-environment, local-immigration, data-centers,
  economic-development, homelessness-response), which are expected to come back mostly **blank**
  for federal figures.
- **D-02:** No evidence for a topic = **honest blank spoke**. Never fabricate, never default to
  chair 3. (Chair-matching model: read all 5 chair statements from `inform.compass_stances` for
  the topic, assign the single chair the documented evidence matches, else leave blank.)

### Existing-answer handling
- **D-03:** **Full overwrite pass** for all three officials. Research all 44 from scratch and
  upsert, replacing Trump's 21 and Vance's 24 legacy values. Guarantees every live answer traces
  to a `bundle.json` citation — no uncited legacy survives.
- **D-04:** **Snapshot** the existing answers (pre-pass SELECT of Trump/Vance current
  `topic_id`/`value`) into the bundle/log before overwriting, so the pass is auditable/reversible.
- **D-05:** If a topic a legacy answer currently exists for comes back **unsourced** (no citable
  evidence for any chair), **delete the legacy answer** so the spoke goes truly blank. Nothing
  uncited may remain in the DB after the pass. (These are very well-documented figures, so
  deletions on national topics should be rare; expect deletions mainly on hyper-local/judicial
  topics if legacy junk exists there.)

### Evidence hierarchy
- **D-06:** Rank evidence: **official acts/votes in office** (executive orders / signed legislation
  for Trump; recorded floor votes for Rubio's Senate record & Vance's Senate record; formal
  administration policy) **> on-record public statements > campaign rhetoric** (tiebreaker only).
  Actions in office reflect the truest position.
- **D-07:** **Recent authoritative action governs** the assigned chair (esp. current 2025 term/role),
  but the agent MAY cite older record as supporting context in the note. Full career record is in
  bounds as evidence; the *assigned chair* reflects where they stand now.

### Rubio framing
- **D-08:** Lead with Rubio's **current Secretary of State actions/statements**; his 14-year FL
  Senate record backfills topics his SecState role hasn't touched. (Consistent with D-07
  "recent governs.")
- **D-09:** **Attribution guardrail** — when a SecState action is plainly *executing the President's
  agenda* rather than Rubio's own position, the agent must flag this in the citation note and, where
  his personal Senate record speaks to the same chair, cite it alongside. The compass must reflect
  Rubio, not the office he currently administers.

### Locked conventions (not re-discussed — established stance-research workflow)
- **D-10:** **One research agent at a time** (parallel burns quota) — per person or per batch, never
  a large concurrent fan-out.
- **D-11:** Artifact chain: `bundle.json` (per-stance `quote_text` + `source_url` + editor note +
  the 5 chairs) **+** CSV (`politician_id,topic_id,topic_key,value,notes`; value 1–5 integer; notes
  <120 chars, semicolons not commas) **+** apply script → `inform.politician_answers`.
- **D-12:** Apply script uses `parseInt(r.value)` directly — **no `3 - value` conversion**. Value is
  the chair number, not a polarity score.
- **D-13:** All apply/DB writes execute from `C:\EV-Accounts\backend` (`npx tsx scripts/...`).
  `mcp__supabase-local` IS production — writes are live.

### Claude's Discretion
- Per-topic research batching within a single agent run (all 44 topics in one prompt vs. grouped),
  provided the one-agent-at-a-time rule holds.
- Exact source-count / corroboration threshold per stance (planner/researcher to set a sane bar;
  default: at least one authoritative primary/reputable source per assigned chair).
- Whether to include a live render-verification checkpoint (SC-4) as its own plan/wave.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap / requirements
- `.planning/ROADMAP.md` §"Phase 211" (lines ~796–808) — goal + 4 success criteria (SC-1..SC-4).
- `.planning/REQUIREMENTS.md` — **RES-01** (the only requirement mapped to this phase).

### Stance-research workflow & data
- `C:\EV-Accounts\backend\data\stance-research\compass-topics-reference.md` — the topic + 5-chair
  reference used to build research prompts. **Note:** dated 2026-06-07 (44 topics); verify against
  live `inform.compass_topics` / `inform.compass_stances` before use in case chairs drifted.
- `C:\EV-Accounts\backend\data\stance-research\2026-07-12-va-retry-senators.bundle.json` — reference
  format for the cited `bundle.json` artifact (quote_text, source_url, editor_note, chairs).
- `C:\EV-Accounts\backend\scripts\` — location for the `apply-*-stances.ts` apply scripts.

### Live DB source of truth
- `inform.compass_topics` (44 active), `inform.compass_stances` (chair text per topic),
  `inform.politician_answers` (target upsert table — `politician_id, topic_id, value, write_in_text`).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Established stance-research pipeline: research agent → `bundle.json` + CSV → `apply-*-stances.ts`
  → upsert. Reuse verbatim; only the target officials and overwrite/delete semantics are new.
- Prior bundle artifacts (VA retry, senate-2026, etc.) under
  `C:\EV-Accounts\backend\data\stance-research\` serve as format templates.

### Established Patterns
- Chair-matching (not polarity scoring): assign the single chair whose text the evidence matches.
- `parseInt(value)` apply, value = chair 1–5.
- Antipartisan: the compass shows stances, never party. Deidentify/strip partisan self-labels in
  quotes where the artifact pipeline already does so (see VA bundle `deidentified_text`/`editor_note`).

### Integration Points
- Writes land in `inform.politician_answers`; profile/card compasses read from there and must render
  for all three officials (SC-4) once applied.
- Overwrite + delete semantics (D-03/D-05) require the apply script to both upsert researched chairs
  AND delete legacy rows for topics that came back unsourced.

</code_context>

<specifics>
## Specific Ideas

- Trump = President, Vance = VP, Rubio = Secretary of State (appointed) with a substantial prior FL
  Senate record — frame each per D-06..D-09.
- Expect near-full coverage on national topics (abortion, tariffs, immigration, deportation,
  ukraine-support, taxes, healthcare, climate, social-security, etc.); expect honest blanks on
  hyper-local and judicial-* topics.

</specifics>

<deferred>
## Deferred Ideas

- Broad school-board / judicial stance research (explicitly deferred at the milestone level; RES-01
  covers Trump/Vance/Rubio only).
- Authoring the 8 Education-lens topics (Phase 209, deferred).

None raised during discussion that belong in a different phase — discussion stayed within scope.

</deferred>

---

*Phase: 211-deep-dive-stance-research-trump-vance-rubio*
*Context gathered: 2026-07-19*
