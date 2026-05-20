# Phase 56: ME Playbook Retrospective - Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Capture Maine-specific learnings back into LOCATION-ONBOARDING.md and phase templates so the next state onboarding starts with Maine's hard-won knowledge built in. This phase produces documentation artifacts — no migrations, no code changes. The success bar is: **Chris Andrews (or any collaborator) could follow the playbook with Claude Code and onboard a new state without asking clarifying questions not answered in the docs.**

</domain>

<decisions>
## Implementation Decisions

### GOTCHA callout selection

Bar for a [GOTCHA]: **silent failure or hours of debugging** — not just "interesting to know."

All 9 of the following qualify and belong in the playbook:

**Schema traps:**
1. `slug` is a GENERATED column on `essentials.chambers` — never include in INSERT statements (will error)
2. `essentials.governments` has NO unique constraint on `geo_id` — WHERE NOT EXISTS pattern required for idempotent inserts
3. Senate office uniqueness key = `(district_id, politician_id)` not `(district_id, chamber_id)` — two senators share the same NATIONAL_UPPER district; chamber_id uniqueness would block the 2nd senator
4. Legislature-elected offices (ME AG, SoS, Treasurer) need `is_appointed_position=true` and NO election race rows

**Routing/TIGER traps:**
5. TIGER congressional file may not be named `cd` — check the archive (e.g., Maine = `tl_2024_23_cd119.zip`) [STATE-SPECIFIC: ME uses cd119]
6. `districts.state` casing: lowercase for STATE/COUNTY/LOCAL tiers, uppercase for NATIONAL_LOWER — set by loader's `abbrev`/`abbrevUpper` pattern; verify before running
7. RCV jurisdictions need `election_method='rcv'` on the **chamber** row, not just the race
8. Cities (G4110 PLACE) vs. towns (G4040 COUSUB) in TIGER — wrong layer = missing LOCAL routing [STATE-SPECIFIC: Maine has only 23 G4110 cities; most residents are in G4040 towns]
9. `districts.state` value set by loader's `abbrev`/`abbrevUpper` variables — always verify the loader config matches expected casing before running

**Placement:** Each GOTCHA goes **inline at the relevant step** in LOCATION-ONBOARDING.md, not in a summary section.

**Format:** Universal by default; `[STATE-SPECIFIC]` tag on callouts that are Maine outliers (items 5 and 8 above). Frame as: problem + how we responded + Maine example, so the next state can verify and adapt rather than copy blindly.

### Template update scope

All four template types get updated with Maine patterns:

- **City officials seeding template** — multi-tier pattern: Tier 1 deep seed (incumbents + headshots), Tier 2 incumbents only, Tier 3–4 skeletal offices with `politician_id=NULL` and documented gaps (not silent omissions)
- **Headshots template** — state legislature headshot sourcing pattern (mainelegislature.org style); thumbnail upscaling decision (152×202 → 600×750 approved with user sign-off)
- **Elections/discovery template** — legislature-elected = appointed; RCV `election_method` on chamber; `discovery_jurisdictions` with `cron_active` flag
- **Migration generator script pattern** — PowerShell bulk-seed generator for 150+ rows as reusable template

**Prescriptiveness:** Fill-in-the-blank with placeholders (`[STATE_FIPS]`, `[STATE_ABBREV]`, etc.) — Maine values shown as example comments so the next person can see the pattern and swap values.

**Location:** Key migration/script templates as **separate files** in `.planning/templates/`; LOCATION-ONBOARDING.md links to each with a one-line description of when to use it.

### STATE.md persistence

All four categories stay in STATE.md:
- Schema decisions → promote to general entries (problem + solution + Maine example)
- Routing/geofence patterns → promote to general, flag state-specific values
- Migration numbering / pending work → keep current (audit for staleness during Phase 56)
- Maine-specific operational facts (UUIDs, external_ids) → keep as Maine reference

**Framing rule for generalized entries:** "Problem + solution + Maine example" — name the problem, show how we solved it, note Maine's specific values. Don't assume other states work the same way as Maine and MA; capture the problem-solving approach, not just the answer.

**Pending Todos audit:** During Phase 56, review every item in STATE.md Pending Todos. Confirm still relevant, update or remove stale entries, keep only genuinely unfinished work. Items to verify: migration 171 (LA council votes, unapplied), migration 182 (legacy views drop, unapplied), post-June-9 follow-up migration (D primary winners).

### Usefulness validation (Phase 56-02)

Sign-off bar: **Chris Andrews could onboard a new state solo using Claude Code** without asking questions not answered in the playbook.

Four verification checks required for v6.0 sign-off:
1. **ME address smoke test** — Portland, Bangor, and a rural address all return correct officials and districts
2. **Discovery sweep confirmed active** — both 2026 ME elections (June 9 + Nov 3) are in cron scope
3. **Playbook readability review** — final read-through: would Chris Andrews be able to follow this solo? Any gaps?
4. **All 9 GOTCHAs present** — each callout is inline at the right step, not missing or floating

### Product coverage

**Phase 56 writes the full Essentials section** (geofences → DB → officials → elections → discovery).

**Compass and Treasury Tracker** get stub sections with ownership notes (`[TO BE COMPLETED BY COMPASS TEAM]`, `[TO BE COMPLETED BY TREASURY TEAM]`) — not left blank, but not fully authored in Phase 56.

### Claude's Discretion

- Exact wording and structure of individual GOTCHA callouts
- Whether to consolidate schema traps vs. routing traps into sub-sections or keep them flat
- How to organize the `.planning/templates/` directory structure

</decisions>

<specifics>
## Specific Ideas

- "This should get easier — as long as we keep learning." The playbook is a living document; Phase 56 captures what Maine taught, not what's universally true about all states.
- Compass and Treasury Tracker teams will author their own sections; Phase 56 creates the scaffold and stubs so those contributions have a clear home.
- Don't overgeneralize from Maine + MA: frame each callout around the problem and the reasoning, so a future onboarder for Alaska or Missouri can judge whether it applies.

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope.

</deferred>

---

*Phase: 56-me-playbook-retrospective*
*Context gathered: 2026-05-20*
