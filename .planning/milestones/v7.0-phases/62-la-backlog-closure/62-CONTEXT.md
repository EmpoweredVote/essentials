# Phase 62: LA Backlog Closure - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Close all outstanding LA data gaps so an LA address returns a complete, accurate set of local officials. Deliverables: LAUSD board officials seeded with geofence links and headshots, CA Governor 2026 race corrected to jungle-primary structure with all challengers, lavote.gov election ID current, and LA city structure gap-closed (migration 171 applied and UI verified).

</domain>

<decisions>
## Implementation Decisions

### Governor challenger seeding
- Create full politician rows (not just race_candidate entries) — challengers get profile pages
- External_id scheme: **-6003001 through -6003013** reserved for CA Governor race candidates
- Researcher must pre-check what's already seeded (user believes an initial pass was done; only fill gaps)
- Headshots: check what already exists; fill gaps where missing — no bulk headshot work needed
- **CRITICAL: CA uses a jungle primary (top-two system)** — ONE unified primary race row for all candidates, regardless of party; top 2 advance to general election
- If existing Governor race rows were modeled on separate D/R primaries (ME pattern), fix the structure in the same migration that adds challengers
- Link challengers to the unified primary race row only; general race row updated post-June-3 primary results

### LAUSD board member seeding
- External_id scheme: **-6004001 through -6004007** (one per board district)
- Headshot source: **lausd.net/board official photos** — crop and resize to 600×750 as usual
- Chamber name: **"LAUSD Board of Education"**
- Government row: LAUSD gets its **own government row** (distinct legal entity, not part of LA City)
- District_type: `SCHOOL` (not `SCHOOL_DISTRICT`) per essentialsService.ts — already established in Phase 58 context
- Office geo_id links: `lausd-board-district-{1..7}` (geofences already loaded in Phase 58)

### LA city structure audit
- **Pre-flight check**: verify migration 182 (legacy views drop) is applied via `SELECT version FROM supabase_migrations.schema_migrations WHERE version='182'` — blocking prerequisite
- Primary gap-close action: apply migration 171 (la_council_votes.sql) — researcher reads the file to understand scope
- Post-migration smoke test: verify an LA address returns all 6 tiers: LA City Council, LAUSD board, LA County Supervisor, Assembly member, State Senator, US House rep
- Broader audit only if gaps discovered during smoke test

### lavote.gov election ID
- Researcher queries DB to find where the stale ID is stored and what the current value is
- Correct ID found by browsing lavote.gov live site and extracting from URL/API response
- After update: run a test discovery sweep for LA jurisdiction to confirm discovery pipeline works end-to-end
- Post-June-3 follow-up: document in STATE.md that the lavote.gov election ID needs updating again for the November 4 general

### Claude's Discretion
- Exact migration numbering (next available is 196)
- How to structure the LAUSD government row (geo_id, FIPS, etc.)
- Smoke test coordinate choice for the 6-tier LA verification

</decisions>

<specifics>
## Specific Ideas

- CA jungle primary is a fundamental structural difference from ME/TX — researcher should verify current race row structure before writing any migration
- User indicated some Governor challenger politician rows may already exist from a prior pass — researcher must inventory what's there before writing INSERT statements
- Migration 171 was written earlier and folded into Phase 62-01; researcher should read the actual SQL file to confirm it's still valid before applying

</specifics>

<deferred>
## Deferred Ideas

- lavote.gov election ID auto-detection script — documented as pending follow-up for post-June-3 general election update; not automated in this phase

</deferred>

---

*Phase: 62-la-backlog-closure*
*Context gathered: 2026-05-21*
