# Phase 23: New LOCAL Compass Topics - Context

**Gathered:** 2026-05-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Create 10 new LOCAL-scope compass topics in `inform.compass_topics` + `inform.compass_stances` with complete 5-stance metadata and correct scope tags in `inform.compass_topic_roles`. Primary execution in `C:\Focused Communities\supabase\migrations\`. Community creation (Phase 24) and scope audit (Phase 25) are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Topic list
- All 10 topics from `LOCAL-COMPASS-QUESTIONS-PROPOSED.md` are approved as-is (Chris Andrews review complete)
- No additions: Short-term rentals and 2020 Election accountability remain held
- Topics: Residential Zoning, Growth and Development Pace, Public Safety Approach, Homelessness Response, Economic Development Incentives, Transportation Priorities, Environmental Protection vs. Development, Rent Regulation, Local Immigration Enforcement, City Sanitation and Cleanliness

### Live status
- All 10 topics insert as `is_live = true` immediately — not held behind Phase 24 community creation

### Scope tags (compass_topic_roles)
- 6 topics get `LOCAL` only: Residential Zoning, Public Safety Approach, Homelessness Response, Environmental Protection vs. Development, Local Immigration Enforcement, City Sanitation and Cleanliness
- 4 topics get both `LOCAL` and `STATE`: Economic Development Incentives, Rent Regulation, Growth and Development Pace, Transportation Priorities
- Total: 14 rows in `compass_topic_roles` (10 LOCAL + 4 STATE for the multi-scope topics)
- All rows use `is_required = true` — matches existing pattern; researcher should verify what `is_required` does in `compassService.ts` before migration runs
- Scope tags are easy to adjust later; this is the initial assignment

### Stance content
- All 4 fields authored for all 50 stances: `text`, `description`, `supporting_points[]`, `example_perspectives[]`
- Claude generates content modeled on existing LOCAL stances (Criminalization of Homelessness, Jail Capacity, Data Center Development)
- User reviews before migration runs
- No national party framing anywhere — describe positions by their local policy effect, not by political affiliation

### Display ordering
- Not a migration concern — topic ordering on the selection/browse page is a UI grouping concern
- Around the compass widget, topics render in the order the user selected them (existing behavior)

### Migration structure
- Single migration for all 10 topics + 50 stances + 14 scope tags
- Pure INSERTs, no cross-topic dependencies
- `inform.compass_topics` UUIDs generated at migration time via `gen_random_uuid()`
- Phase 24 companion communities reference topic UUIDs by subquery on `topic_key`, not hardcoded values
- `ON CONFLICT DO NOTHING` on all inserts for idempotency

### Claude's Discretion
- `topic_key` naming convention for the 10 new topics (researcher should match existing pattern, e.g., `homelessness_response`, `residential_zoning`)
- Exact `description`, `supporting_points`, and `example_perspectives` content — Claude authors, user reviews
- Migration number within the Focused Communities sequence (researcher checks what the next available number is)

</decisions>

<specifics>
## Specific Ideas

- Topics validated by an ex-LA city councilman who now moderates a nonpartisan mayoral debate podcast — these are the issues candidates actually argue over
- Design principle confirmed: all questions are mechanism questions (who pays, who decides, what does the city do?) — not outcome questions. Outcome questions produce no differentiation.
- Homelessness Response (new) is complementary to, not duplicative of, existing "Criminalization of Homelessness" — different frames (service delivery vs. rights/enforcement). Both stay live per Phase 22 decision.
- Residential Zoning is distinct from existing "Affordable Housing" topic — Affordable Housing is about programs and subsidies; Residential Zoning is about who decides what gets built where.

</specifics>

<deferred>
## Deferred Ideas

- Short-term rentals (Airbnb/VRBO) — real disagreement but only salient in tourist towns and high-demand metros; not included in Phase 23
- 2020 Election accountability — design question pending; may need its own feature with evidence markers rather than a stance question; held for future design work
- Topic selection page grouping — topics should be grouped by similarity on the browse/select page; this is a UI concern outside Phase 23 scope

</deferred>

---

*Phase: 23-new-local-compass-topics*
*Context gathered: 2026-05-04*
