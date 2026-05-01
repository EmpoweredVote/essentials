# Phase 13: Tier 1 Officials — Plano + McKinney - Context

**Gathered:** 2026-05-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Research and seed all current incumbent officials (mayor + all council seats) for Plano and McKinney into `essentials.politicians`, linked to Phase 12 office rows, with contact information. Creating politicians in other cities and phases beyond Plano/McKinney are out of scope.

</domain>

<decisions>
## Implementation Decisions

### Post-election incumbents
- Seed post-May 3, 2026 winners as the current active incumbents
- If a seat flipped: set outgoing incumbent `is_active=false`, `is_incumbent=false`; insert winner as `is_active=true`, `is_incumbent=true` — both rows link to the same `office_id`
- If a seat went to a runoff (no majority yet): leave the seat empty; do not seed either candidate until runoff result is known
- Appointed mid-term incumbents count — seat-holder = incumbent regardless of whether they were elected or appointed
- Capture term start date and term end/expiration date for each incumbent where findable

### Research sourcing
- Two primary sources per city: official city website (plano.gov, mckinney.com) for full council roster; collincountyvotes.gov for May 3 election results
- Every inserted politician row must have a citation URL — same standard as the discovery pipeline; no citation = no insert
- Research method: agent-assisted (agent browses city website + county results and produces a structured list); human reviews before any SQL is written
- If city website still shows pre-election roster: seed what's available from county results + pre-election site data; note the gap in a comment; bio URL can be backfilled once city site updates

### Contact data
- Capture all four contact types where findable: official city email, bio/profile URL, office phone, social media / personal website
- Priority order when fields are limited: official email > bio URL > phone > social
- No contact info found: leave null — no placeholder values, no city hall fallbacks
- District/ward: captured via `office_id` link to Phase 12 office rows; not duplicated on the politician row

### Plan structure
- Two plan files: 13-01 (Plano) and 13-02 (McKinney) — each city ships independently
- Two SQL migrations: 091 seeds Plano politicians, 092 seeds McKinney politicians
- Each plan file includes four steps in order:
  1. Agent research step — browses city site + county results
  2. Markdown staging file — agent writes structured politician list (name, seat, office_id, contact info, citation URL); human reviews this before SQL is written
  3. SQL migration — INSERT statements written from the staging file and applied via `supabase db query --linked`
  4. Verification query — confirms row count, office_id links, is_active/is_incumbent flags, and null contact field rate

### Claude's Discretion
- Whether to store district info on the politician row or rely solely on the office_id link (recommendation: rely on office_id)
- Exact staging file format and field ordering
- How to handle multiple social media accounts (pick most official-looking, or primary one)

</decisions>

<specifics>
## Specific Ideas

- Agent-assisted research mirrors the discovery pipeline philosophy: Claude browses, human verifies, SQL is the final artifact
- Markdown staging file gives a clear human-review checkpoint before any DB writes — same pattern used for Tier 3-4 seeding in Phase 12

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 13-tier-1-officials-plano-mckinney*
*Context gathered: 2026-05-01*
