# Phase 45: Playbook Retrospective - Context

**Gathered:** 2026-05-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Update `LOCATION-ONBOARDING.md` and the phase templates in `.planning/templates/` with learnings from the Cambridge, MA onboarding execution. Output is read by future Claude agents running city onboarding — not just human operators. Goal: make the next city faster and reduce the number of decisions requiring human verification.

This phase does NOT add new onboarding coverage, seed new data, or change the application. It updates documentation only.

</domain>

<decisions>
## Implementation Decisions

### Learning Selection Criteria

- A learning earns inclusion if it **prevents rework** — the test is: "Would a future Claude agent make the wrong assumption here without this note?"
- Learnings are categorized: **universal principles** (apply to any city) vs. **Cambridge examples** (illustrate the principle, not the rule)
- The citizen-experience-first principle is explicitly universal: honor how a city presents itself to residents, even when it creates backend complexity (e.g., "Commonwealth Treasurer" instead of "State Treasurer" for MA)
- Claude should identify the full set of rework-preventing learnings from STATE.md Phase 41-44 notes; user confirms or cuts before they're written into the playbook
- City-specific facts (Cambridge's STV election method, odd-year cycle, Commonwealth naming) are examples only — not rules to apply to future cities

### Update Depth vs. Structure

- The 8-step checklist structure is sound — Cambridge confirmed it; **no restructuring needed**
- Updates are additions within existing steps: verification callouts, pattern notes, Cambridge examples
- Add explicit `[VERIFY]` decision points — places where a future agent must pause and confirm before proceeding (wrong assumption causes rework)
- Add `[AUTO]` markers for steps Claude can complete with TIGER + public data alone (no human needed)
- Each step has: one-line action + a callout for 'why this matters' or 'common mistake' — "what at a glance, why in callouts"
- Add a **Core Principle** section before the checklist: citizen-experience-first stated explicitly as the reasoning anchor for all decisions

### Tag System

Use structured tags throughout both the playbook and templates:
- `[AUTO]` — Claude can complete this with TIGER / public data alone
- `[VERIFY]` — Pause and confirm before proceeding; wrong assumption causes rework
- `[GOTCHA]` — Common wrong assumption documented with the correct behavior
- `[PATTERN]` — Reusable technique from Cambridge worth preserving

City-specific examples formatted as: *Cambridge example: ...*  (italicized inline after the universal rule)

### Cities Onboarded Table

Add a **Cities Onboarded** status table near the top of LOCATION-ONBOARDING.md:
- Columns: City | State | Onboarded | Election method | Notable patterns
- Cambridge is the first row
- Future agents read this to see proven patterns and borrow from prior work
- Serves as a quick coverage inventory as the scale-up begins

### Template Updates

**Existing templates that need updates:**
1. **officials-seed** — Add a council structure decision tree before any SQL: Strong Mayor → Council-Manager → Commission. Each path documented with relevant patterns. Cambridge is the Council-Manager example (dual-office politician, appointed Mayor, non-unique offices.politician_id).
2. **db-foundation** — Embed correct idempotency guards in every SQL block. Table reference: governments uses WHERE NOT EXISTS (no geo_id unique constraint); other tables document their ON CONFLICT target.
3. **discovery-setup** + all templates — Add a reference block listing valid `election_method` enum values (plurality, stv_proportional, ranked_choice, etc.) to prevent migration failures from hallucinated values.

**New template to create:**
- **elections-seed** — Covers: election rows (primary + general), race seeding (with incumbents and challengers), discovery_jurisdictions rows, and placeholder elections for future cycles. Cambridge Phase 44 is the reference example.

### Claude's Discretion

- Exact wording of the Core Principle statement (the citizen-experience-first anchor)
- Which specific Phase 41-44 STATE.md notes pass the rework-prevention test (surface to user for confirmation)
- How many AUTO vs. VERIFY tags each checklist step gets
- Ordering of content additions within each step

</decisions>

<specifics>
## Specific Ideas

- The scale-up goal: once the playbook is mature, Claude should be able to onboard any US city/neighborhood autonomously — starting with the US geography. Cambridge is the first proof-of-concept.
- "Citizen experience first" means honoring how a city presents itself to residents — even when it creates backend complexity. This is the universal reasoning anchor.
- The [AUTO] / [VERIFY] tagging builds an explicit automation roadmap: as more cities are onboarded, the ratio of AUTO to VERIFY steps should grow.
- The officials-seed decision tree was the most significant structural gap: Council-Manager cities require a different schema pattern (non-unique politician_id on offices) that the original template didn't address.

</specifics>

<deferred>
## Deferred Ideas

- A separate COVERAGE.md tracking all onboarded cities at scale (for now, the Cities Onboarded table in LOCATION-ONBOARDING.md covers this)
- Automation tooling to actually execute city onboarding steps autonomously (this phase only documents the playbook — the tooling is future work)
- Per-city annotation appendix as cities beyond Cambridge accumulate (the inline italicized example pattern handles this until the list grows large enough to warrant its own file)

</deferred>

---

*Phase: 45-playbook-retrospective*
*Context gathered: 2026-05-17*
