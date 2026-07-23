# Phase 106: VA Compass Stances - Context

**Gathered:** 2026-06-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Evidence-only compass stances for all seeded VA officials across 3 tiers — 3 state executives (Spanberger, Hashmi, Jones), 2 US senators (Warner, Kaine), and ~16 Alexandria officials (7 city council + 9 ACPS board). Ingested as per-individual SQL migration files starting at 326. Compass render on Spanberger profile verified as acceptance criteria.

</domain>

<decisions>
## Implementation Decisions

### Topic Scope
- **D-01:** **All 44 compass topics attempted for EVERY official across all tiers** — no tier-based exclusions (no "federal-only for senators" or "local-only for council"). Evidence-only throughout; chair philosophy: blank spoke = no evidence found. NEVER default to neutral/center/likely.
- **D-02:** The 1–5 value scale is a position scale (not a Likert scale — not "highly agree / agree / neutral"). Agents output the numeric position 1–5 directly per the topic's defined scale. `parseInt(r.value)` in apply scripts, no conversion.

### Alexandria Depth
- **D-03:** **5-minute sliding cap per Alexandria official.** If no findings within 5 minutes, declare "no public record" and skip — no migration row for that person. If a finding comes in during the last 3 minutes of the cap, extend by 3 more minutes minimum, then re-apply the cap rule.
- **D-04:** Alexandria rule applies to both council members (7) and ACPS board members (9). No special exclusion for ACPS — research all 44 topics, declare no-record when none found. ACPS board members may only yield school-vouchers/childcare/education-adjacent findings; that's fine.

### Migration Structure
- **D-05:** **Per-individual SQL files** — one migration per politician. Naming: `{N}_{firstname}_{lastname}_stances.sql` (e.g., `326_spanberger_stances.sql`, `327_hashmi_stances.sql`). Starting migration: **326**.
- **D-06:** Apply each migration immediately when that politician's research completes — no batching across people. Sequential order: Spanberger → Hashmi → Jones → Warner → Kaine → Alexandria council members → ACPS board.
- **D-07:** Migration format follows migration 282 (MD exec stances) exactly: `BEGIN; ... COMMIT;` with ON CONFLICT upsert on both `inform.politician_answers` and `inform.politician_context`. Topic UUID reference block in migration header.

### Research Agent Protocol (carry forward from prior phases)
- **D-08:** Run ONE research agent per politician — never in parallel. Parallel burns rate limit quota with no usable output.
- **D-09:** Aim for 18–21+ stances per high-profile official (Spanberger, Warner, Kaine). ROADMAP minimums: ≥15 for Spanberger, ≥15 each for Warner/Kaine, ≥10 for Hashmi/Jones.
- **D-10:** 100% citation rate — every stance value in `inform.politician_context` must have at least one URL in the `sources` array. Uncited stances are not allowed.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 106 — Goal, priority order, success criteria (stance counts + compass render)
- `.planning/REQUIREMENTS.md` §VA-STANCES-01/02/03 — 3 requirements this phase closes

### Pattern Migration (closest analog — copy structure)
- `C:/EV-Accounts/backend/migrations/282_md_exec_stances.sql` — **canonical structure template**: topic UUID reference block, per-official sections, `inform.politician_answers` + `inform.politician_context` ON CONFLICT upsert, `BEGIN; ... COMMIT;` wrapper, idempotency pattern

### VA Officials Seeded By (need politician_id UUIDs)
- `C:/EV-Accounts/backend/migrations/317_va_state_executives.sql` — Spanberger, Hashmi, Jones (external_ids −5101001/−5101002/−5101003)
- `C:/EV-Accounts/backend/migrations/311_va_federal_officials.sql` — Warner (−400080) + Kaine (−400079)
- `C:/EV-Accounts/backend/migrations/312_alexandria_government.sql` — Mayor Gaskins (−5101000001) + 6 council (−5101000002..−5101000007)
- `C:/EV-Accounts/backend/migrations/313_acps_school_board.sql` — 9 ACPS board members

### Prior Stances Context
- `.planning/phases/102-va-federal-officials/102-CONTEXT.md` — VA federal official seeding context

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `C:/EV-Accounts/backend/migrations/282_md_exec_stances.sql` — Full SQL structure template: copy the topic UUID reference block verbatim (all 44 topic UUIDs), per-official comment headers, ON CONFLICT upsert pattern, `$$...$$` dollar-quoting for reasoning text

### Established Patterns
- **Chair philosophy:** No stance row is better than a fabricated neutral. If the research agent finds no evidence for a topic, that topic is simply omitted from the migration — no INSERT at all.
- **Compass render:** `computeDisplaySpokes()` in `src/lib/compass.js` is the single source of truth for spoke selection. Data from `inform.politician_answers` feeds directly into it.
- **Sequential execution:** Each politician's research agent completes, migration written and applied, then next politician starts. No parallel agents.

### Integration Points
- `inform.politician_answers (politician_id, topic_id, value)` — primary stance table
- `inform.politician_context (politician_id, topic_id, reasoning, sources)` — citation table
- `essentials.politicians` — looked up by `external_id` to resolve `politician_id` UUIDs
- Supabase MCP or psql: apply stance migrations directly (no audit-only pattern — stances are NOT headshots)

</code_context>

<specifics>
## Specific Ideas

- User confirmed: the 1–5 value scale is NOT highly agree/agree/neutral/disagree/highly disagree — it is a compass position scale. Research agents must understand the topic's specific axis before assigning a value.
- Migration numbering starts at 326 (325 was the last VA elections migration from Phase 105).
- Alexandria council roster (from migration 312): Mayor Alyia Gaskins, Vice Mayor Sarah Bagley, Canek Aguirre, John Chapman, Abdel-Rahman Elnoubi, Jacinta E. Greene, Sandy Marks.
- ACPS board: 9 members seeded in migration 313 — researcher must read that migration for names and external IDs.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 106-VA Compass Stances*
*Context gathered: 2026-06-09*
