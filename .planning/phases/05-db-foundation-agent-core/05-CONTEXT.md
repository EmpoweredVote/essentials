# Phase 5: DB Foundation + Agent Core - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning

<domain>
## Phase Boundary

A discovery agent finds candidates from official election authority sources, normalizes names, scores confidence, detects withdrawals, and persists results to a staging table — triggerable on demand from the command line. No UI, no email, no cron automation. Those belong to Phases 6 and 7.

</domain>

<decisions>
## Implementation Decisions

### Agent discovery strategy
- Agent receives: `jurisdiction_name`, `state`, `election_date`, optional `source_url`, and the list of known races for that jurisdiction (as matching context, not a filter)
- When `source_url` is set: agent uses URL fetch as primary path — reads starting URL plus direct links on that page (one level deep only)
- When `source_url` is absent: agent uses bounded web search (max 1-2 searches) biased toward official domains (`.gov`, Secretary of State, county registrar, election commissioner) to locate the source, then fetches it
- Agent finds ALL candidates it encounters on the source — it is NOT restricted to known races. Race list from DB is context for matching, not a filter.
- This means "no matching race" flags become the radar for missing races (e.g., a LA Mayor race that was never seeded). Admin sees confidence='official', flagged=true, flag_reason='no matching race in DB'.

### Agent output schema
- Agent returns per candidate: `full_name`, `citation_url` (the exact URL where the name appears verbatim), `race_hint` (free-text description of the race, e.g. "Los Angeles Mayor")
- Agent does NOT self-score confidence — service layer computes confidence from source domain + fuzzy match
- No citation = no staging entry (hallucination prevention — already in requirements)

### Jurisdiction config schema (discovery_jurisdictions)
- Required fields: `jurisdiction_id` (FK to jurisdictions), `election_date`
- Optional fields: `source_url` (nullable), `allowed_domains` (text array, nullable)
- When `source_url` is absent: agent uses web search fallback
- When `allowed_domains` is absent: all citations from that jurisdiction default to `uncertain` confidence

### Confidence scoring rules
- `official` = citation URL domain is on the `allowed_domains` allowlist (name match supports but is not required — new candidates from official domains are still `official`)
- `matched` = domain NOT on allowlist, but candidate name fuzzy-matches an existing `race_candidates` row at ≥85% similarity
- `uncertain` = neither signal: domain not allowlisted AND fuzzy score <85%
- Confidence and `flagged` are independent: a candidate can be `confidence='official'` AND `flagged=true` with `flag_reason='no matching race in DB'`
- When no `allowed_domains` configured: source domain check cannot pass → domain signal always fails → ceiling is `matched` (if name match ≥85%) or `uncertain`

### Withdrawal diff behavior
- Withdrawal detection compares discovered candidates against existing `race_candidates` rows
- Scope: only races where the agent found ≥1 candidate. Races the agent didn't touch are left alone — absence of evidence is not evidence of withdrawal.
- Match logic: same 85% fuzzy threshold used for confidence scoring. If an existing candidate's name fuzzy-matches a discovered name at ≥85%, they are the same person. Below 85% = treated as absent.
- When an existing candidate is not found: write a `candidate_staging` row with `action='withdrawal'`, `flag_reason='no longer appears on official source'`. Admin reviews in the staging queue before anything is removed from `race_candidates`.

### Claude's Discretion
- Exact fuzzy match algorithm (Levenshtein vs token sort ratio — 85% threshold is fixed, algorithm is flexible)
- Name normalization rules (lowercase, trim, suffix removal — Jr/Sr/III/etc.)
- Web search query construction when no source_url is present
- Pagination detection heuristic on source pages
- Structure of `discovery_runs.raw_output` JSONB schema

</decisions>

<specifics>
## Specific Ideas

- The LA Mayor gap (discovered 2026-04-23): LA Mayor was a real race with multiple candidates but was never seeded in the DB — it never appeared on the elections page. This is the primary motivation for "agent finds ALL candidates, not just known races." The "no matching race" staging flags are the ballot completeness radar.
- Anthropic Console: web search must be enabled org-wide before Phase 5 execute (console.anthropic.com/settings/privacy) — already noted in STATE.md
- node-cron 4.2.1 already installed; migration numbering starts at 070

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-db-foundation-agent-core*
*Context gathered: 2026-04-23*
