# Phase 27: Judicial Compass DB - Context

**Gathered:** 2026-05-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Author 8 judicial compass topics + 40 stances in the database, scoped exclusively to legal offices via a new `'judicial'` value in `inform.compass_topic_roles.role_scope`. Judges and City Attorney/DA candidates each see 6 applicable topics (4 universal + 2 role-specific). No federal/state/local candidate profiles are affected. Frontend display and companion communities are Phase 28.

</domain>

<decisions>
## Implementation Decisions

### Topic selection
The 8 judicial topics, exactly as scoped (4 universal + 2 judge-specific + 2 City Attorney/DA-specific):

**4 Universal (applies to both judges AND City Attorney/DA):**
1. Criminal Justice Approach
2. Access to Justice
3. Prosecutorial/Judicial Discretion
4. Transparency in Legal Proceedings

**2 Judge-specific:**
5. Judicial Interpretation (textualism vs. purposivism)
6. Bail and Pretrial Decisions

**2 City Attorney/DA-specific:**
7. Prosecution Priorities
8. Police Accountability

### Stance scale calibration
- All 5 stances (value=1 through value=5) must be positions a real candidate could **earnestly hold** — evidenceable, plausible positions, not theoretical extremes
- If a 5-point range doesn't produce 5 realistic positions for a given topic, extend the poles until all 5 stances are achievable in the real world
- Stance text should describe **observable behaviors** (what the candidate does / decides), not abstract philosophical positions
- Each `example_perspectives` entry should be framed as a **hypothetical court decision or ruling** — what this stance looks like in practice

### Sub-scope encoding
- Add a `judicial_role` column to `inform.compass_topics` (nullable TEXT, CHECK constraint: `'judge' | 'city_attorney_da' | NULL`)
  - `NULL` = universal (applies to all judicial role candidates)
  - `'judge'` = judge-only topics (topics 5–6 above)
  - `'city_attorney_da'` = City Attorney/DA-only topics (topics 7–8 above)
- `JUDICIAL` remains a single district_type value (no JUDICIAL_JUDGE / JUDICIAL_DA split)
- Phase 28 derives which sub-type to render from the office record (office title / chamber), not from district_type

### Scope isolation
- All 8 topics get a single `'judicial'` row in `inform.compass_topic_roles.role_scope`
- No `'federal'`, `'state'`, or `'local'` rows for any of these 8 topics
- `compassService.ts getCompassTopics()` must return zero judicial topics when called with local/state/federal scope — and return all judicial topics only when called with judicial scope

### Evidence standard (Phase 30 rule — locked here)
- **Primary source required** for any stance placement: the candidate's own words, a written ruling in their name, or official bar interview responses
- Secondary sources (news coverage, endorsement letters, ratings) can corroborate but **cannot stand alone**
- No valid primary source = **no placement** (leave topic blank; no guessing, no proxying from LACBA rating)
- Citation storage: **separate citations table** linking `inform.politician_answers` rows to one or more source URLs (not the `supporting_evidence` field) — planner must verify existing schema before creating new table

### Claude's Discretion
- Exact topic_key slugs (e.g., `criminal-justice-approach` vs. `criminal-justice`)
- `description` and `supporting_points` prose for each stance
- Whether the citations table already exists or needs to be created (check schema first)
- fc_community_slug — NULL for all 8 topics in Phase 27; Phase 28 populates

</decisions>

<specifics>
## Specific Ideas

- "All 5 stances need an objective callout — if the 5-point range doesn't produce 5 evidenceable positions, extend the range until it does." (User's exact framing)
- Example perspectives should read as hypothetical rulings, not abstract philosophy: "A judge with this stance would likely deny bail in high-profile violent crime cases"
- The `judicial_role` column approach is preferred over separate role_scope values — keeps filtering logic clean

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 27-judicial-compass-db*
*Context gathered: 2026-05-06*
