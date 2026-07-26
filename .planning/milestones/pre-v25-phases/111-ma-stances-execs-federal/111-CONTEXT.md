# Phase 111: MA Stances — Executives + Federal Officials - Context

**Gathered:** 2026-06-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Evidence-only compass stances for all 6 MA state executives and all 11 MA federal officials (17 total). Ingested as per-individual SQL migration files starting at 359. Compass render on Healey profile verified as acceptance criterion.

</domain>

<decisions>
## Implementation Decisions

### Topic Scope
- **D-01:** All compass topics attempted for EVERY official — no tier-based exclusions. Evidence-only throughout; blank spoke = no evidence found. NEVER default to neutral/center/likely as a fallback.
- **D-02:** The 1–5 value scale is a compass position scale (not Likert). Agents output the numeric position 1–5 directly per the topic's defined axis. `parseInt(r.value)` in apply scripts, no conversion.

### Research Depth
- **D-03:** No artificial time cap for statewide execs or federal officials — all have documented public records sufficient for real research. Blank spoke is acceptable only when evidence is genuinely absent after full search.
- **D-04:** US House reps (MA-01 through MA-09) follow D-03 — no sliding cap. All are current US House members with congressional voting records available via congress.gov, govtrack.us, VoteSmart, ontheissues.org.

### Migration Structure
- **D-05:** Per-individual SQL files — one migration per politician. Naming convention: `{N}_{firstname}_{lastname}_stances.sql` (e.g., `359_healey_stances.sql`, `360_driscoll_stances.sql`). Starting migration: **359**.
- **D-06:** Apply each migration immediately when that politician's research completes — no batching across people. Sequential order: Healey (359) → Driscoll (360) → Campbell (361) → Goldberg (362) → DiZoglio (363) → Galvin (364) → Warren (365) → Markey (366) → Neal (367) → McGovern (368) → Trahan (369) → Auchincloss (370) → Clark (371) → Moulton (372) → Pressley (373) → Lynch (374) → Keating (375).
- **D-07:** Migration format follows migration 282 (MD exec stances) exactly: `BEGIN; ... COMMIT;` with ON CONFLICT upsert on both `inform.politician_answers` and `inform.politician_context`. Topic UUID reference block in migration header.

### Research Agent Protocol
- **D-08:** Run ONE research agent per politician — never in parallel. Parallel burns rate limit quota with no usable output.
- **D-09:** Target 18–21+ stances for Healey, Warren, Markey (high public record). ROADMAP minimums: ≥15 for these three; ≥8 for all remaining executives and federal reps.
- **D-10:** 100% citation rate — every stance value in `inform.politician_context` must have at least one URL in the `sources` array. Uncited stances are not allowed.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 111 — Goal, priority order, success criteria
- `.planning/REQUIREMENTS.md` §MA-STANCES-01/02 — 2 requirements this phase closes

### Pattern Migration (closest analog — copy structure)
- `C:/EV-Accounts/backend/migrations/282_md_exec_stances.sql` — canonical structure template: topic UUID reference block, per-official sections, `inform.politician_answers` + `inform.politician_context` ON CONFLICT upsert, `BEGIN; ... COMMIT;` wrapper, idempotency pattern

### MA Officials Seeded By (need politician_id UUIDs)
- `C:/EV-Accounts/backend/migrations/154_ma_state_executives.sql` — 6 MA execs (external_ids: Healey=-200001, Driscoll=-200003, Campbell=-200004, Goldberg=-200005, DiZoglio=-200006, Galvin=-200007; -200002 was skipped due to CA conflict)
- `C:/EV-Accounts/backend/migrations/155_ma_us_senators.sql` — Warren (-200101) + Markey (-200102)
- `C:/EV-Accounts/backend/migrations/156_ma_us_house_reps.sql` — 9 MA House reps (-200201 through -200209)

### Phase Patterns
- `.planning/phases/111-ma-stances-execs-federal/111-PATTERNS.md` — full migration structure, politician UUID table, per-stance INSERT pattern

### Prior Stances Context (direct analog)
- `.planning/phases/106-va-compass-stances/106-CONTEXT.md` — VA stances CONTEXT.md that this phase mirrors (same D-01..D-10 decisions)
- `.planning/phases/106-va-compass-stances/106-PATTERNS.md` — exact migration file templates

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `C:/EV-Accounts/backend/migrations/282_md_exec_stances.sql` — Full SQL structure template: copy the topic UUID reference block verbatim (all active topics), per-official comment headers, ON CONFLICT upsert pattern, `$$...$$` dollar-quoting for reasoning text

### Established Patterns
- **Chair philosophy:** No stance row is better than a fabricated neutral. If research finds no evidence for a topic, that topic is omitted entirely — no INSERT at all.
- **Compass render:** `computeDisplaySpokes()` in `src/lib/compass.js` reads from `inform.politician_answers` directly.
- **Sequential execution:** Each politician's research agent completes → migration written and applied → next politician starts. No parallel agents (D-08).

### Integration Points
- `inform.politician_answers (politician_id, topic_id, value)` — primary stance table
- `inform.politician_context (politician_id, topic_id, reasoning, sources)` — citation table
- `essentials.politicians` — looked up by `external_id` to resolve `politician_id` UUIDs
- mcp__supabase-local__execute_sql: apply stance migrations directly (mcp__supabase-local IS production per CLAUDE.md)

</code_context>

<specifics>
## Specific Ideas

- Migration numbering starts at 359 (358 was the last Phase 110 migration: `358_ma_2026_legislative_races.sql`).
- MA executive external_ids from migration 154: Healey=-200001, Driscoll=-200003, Campbell=-200004, Goldberg=-200005, DiZoglio=-200006, Galvin=-200007.
- Senators: Warren=-200101, Markey=-200102 (from migration 155).
- MA House reps (from migration 156): Neal(MA-01)=-200201, McGovern(MA-02)=-200202, Trahan(MA-03)=-200203, Auchincloss(MA-04)=-200204, Clark(MA-05)=-200205, Moulton(MA-06)=-200206, Pressley(MA-07)=-200207, Lynch(MA-08)=-200208, Keating(MA-09)=-200209.
- Healey: former MA AG (2013–2023) + Governor (2023–present) — expect rich record on abortion, healthcare, immigration (immigration enforcement from AG role), civil-rights, judicial-*, campaign-finance, housing, climate-change.
- Warren: 12-year Senate career (2013–present) + 2020 presidential run — expect very rich record; consumer protection, healthcare, taxes, banking-regulation, campaign-finance, climate-change, immigration, social-security.
- Markey: 40+ year Congressional record (US House 1976–2013 + Senate 2013–present) — one of longest-serving members; expect broad coverage across almost all topics.

</specifics>

<deferred>
## Deferred Ideas

None — scope fully defined by ROADMAP Phase 111.

</deferred>

---

*Phase: 111-MA Stances Execs + Federal*
*Context gathered: 2026-06-11*
