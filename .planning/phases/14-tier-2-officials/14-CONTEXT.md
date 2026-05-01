# Phase 14: Tier 2 Officials — Allen, Frisco, Murphy, Celina, Prosper, Richardson - Context

**Gathered:** 2026-05-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Seed all incumbent mayor and council members for six Tier 2 Collin County cities (Allen, Frisco, Murphy, Celina, Prosper, Richardson) into `essentials.politicians`, linked to their `essentials.offices` rows, with contact info where publicly available. Headshots, Compass stances, and discovery jurisdiction setup are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Plan structure
- 3 plans, 3 migrations:
  - **14-01** (migration 094): Allen + Frisco — larger, established cities
  - **14-02** (migration 095): Richardson — standalone
  - **14-03** (migration 096): Murphy + Celina + Prosper — smaller/newer growth towns
- Migration numbering starts at 094 (093 was McKinney email backfill); always verify with `ls /c/EV-Accounts/backend/migrations/ | sort | tail -5` before writing migrations

### Post-election incumbency
- Trust official city websites as of research date — if a person is listed on the city's official council/roster page, they are the incumbent (`is_incumbent=true`, `is_active=true`)
- Newly elected May 3 winners listed on the official roster are seeded as incumbents (no distinction between returning vs. newly elected — if they're on the roster, they're the incumbent)
- Researcher must flag any seats that were on the May 3, 2026 ballot in the research output — these seats should be noted for post-seeding verification once all city rosters have had time to update

### Contact coverage
- **Email OR bio URL satisfies the contact requirement** — either one counts; email is not required
- Only use emails found explicitly on the city's official website (mailto: links or directly published) — no pattern inference unless the pattern is directly observed on the site (same standard as McKinney, where the email was found via mailto: links on the city page)
- If email is behind CloudFlare, a contact form, or not exposed as mailto: → seed `email_addresses = NULL` and use bio URL; that satisfies the requirement
- If the city website only lists names with no bio pages or emails → seed with NULL for both; name + office_id is sufficient

### Structural quirks and vacant seats
- Each city has its own governance structure — the goal is to understand and represent each community accurately, not force a uniform template
- Researcher must include a **Quirks section per city** in RESEARCH.md covering:
  - Unusual seat structures (e.g., Mayor holds a voting council seat by design, like Plano Place 6)
  - Vacant seats and why
  - Any structural feature that deviates from a standard "Mayor + N council members" pattern
  - If no quirks: explicitly state "standard structure, no quirks found"
- **User reviews the Quirks section before planning begins** — planning does not start until all quirks are reviewed and handling is confirmed
- Structural quirks are documented in **both** the migration SQL (short comment) and the plan file (full explanation)
- Genuinely vacant seats (no current officeholder): skip the politician row — the office row in `essentials.offices` exists; the politician row is created in a follow-up migration when the seat is filled

### Claude's Discretion
- Exact SQL structure within each migration
- Whether to use a single INSERT block per city or separate blocks
- Order of politicians within each city's INSERT

</decisions>

<specifics>
## Specific Ideas

- Plano Place 6 example: the "empty" seat is intentional — the Mayor holds it to participate in legislative duties. This kind of structural feature should be flagged and explained, not silently skipped. The lesson: always ask *why* a seat is empty or unusual.
- The researcher's job is discovery, not data entry. Surface what makes each city unique; bring it to review before writing SQL.
- May 3, 2026 TX election just happened — roster pages may lag 24-48 hours. Use official roster as source of truth on research day, but flag all seats that were on the May 3 ballot for a post-seeding recheck.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 14-tier-2-officials*
*Context gathered: 2026-05-01*
