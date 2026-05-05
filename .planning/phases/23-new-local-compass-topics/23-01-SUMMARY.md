---
phase: 23-new-local-compass-topics
plan: 01
subsystem: database
tags: [postgresql, compass, inform-schema, migrations]

# Dependency graph
requires:
  - phase: 22-compass-schema-audit
    provides: scope mechanism documented — compass_topic_roles is the scope filter; compassService.ts boolean conversion pattern confirmed
provides:
  - C:/Focused Communities/supabase/migrations/20260504000001_phase23_local_compass_topics.sql
  - 10 compass topics (residential-zoning, growth-and-development, public-safety-approach, homelessness-response, economic-development, transportation-priorities, local-environment, rent-regulation, local-immigration, city-sanitation)
  - 50 compass stances authored (5 per topic, values 1–5), all 4 fields complete (text, supporting_points, description, example_perspectives)
  - 14 compass_topic_roles rows — 6 LOCAL-only topics, 4 LOCAL+STATE topics
affects:
  - phase 23-02 (applies this migration via supabase db push)
  - phase 24 (fc_community_slug assignment for these 10 topics)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "LOCAL-scope topic pattern: INSERT INTO inform.compass_topic_roles (topic_id, role_scope, is_required) VALUES ('<uuid>', 'local', true) ON CONFLICT (topic_id, role_scope) DO NOTHING"
    - "LOCAL+STATE dual-scope pattern: two rows per topic in compass_topic_roles (one 'local', one 'state')"
    - "Stance authoring voice: mechanism-focused, neutral framing, no partisan labels; varied archetypes in example_perspectives"

key-files:
  created:
    - C:/Focused Communities/supabase/migrations/20260504000001_phase23_local_compass_topics.sql
  modified: []

key-decisions:
  - "6 topics are LOCAL-only: residential-zoning, growth-and-development, economic-development, rent-regulation, city-sanitation, local-immigration"
  - "4 topics are LOCAL+STATE (dual scope): public-safety-approach, homelessness-response, transportation-priorities, local-environment"
  - "local-immigration is LOCAL-only — deliberately separate from the existing federal/state Immigration and Treatment topic"
  - "homelessness-response (service delivery frame) kept complementary to existing Criminalization of Homelessness topic (rights/enforcement frame) per Phase 22 RETIRE-01 decision"
  - "Migration pre-approved by user via checkpoint before application — no revisions requested"

patterns-established:
  - "Scope distribution: determine LOCAL vs LOCAL+STATE by whether the topic has meaningful state-level policy variance (e.g. transportation funding, environmental regulation)"
  - "Stance scale: value 1 = most market/individual orientation; value 5 = most government/collective orientation (consistent with existing topics)"

# Metrics
duration: ~60min
completed: 2026-05-04
---

# Phase 23 Plan 01: Author LOCAL Compass Stances + Write Migration Summary

**50 LOCAL compass stances authored across 10 topics — migration file written, user-reviewed, ready for supabase db push**

## Performance

- **Duration:** ~60 min
- **Started:** 2026-05-04
- **Completed:** 2026-05-04
- **Tasks:** 2 (Task 1: write migration; Task 2: checkpoint:human-verify)
- **Files modified:** 1

## Accomplishments

- Authored 50 compass stances across 10 LOCAL-scope topics — all 4 fields complete (text, supporting_points, description, example_perspectives)
- Wrote 10 topic INSERTs + 50 stance INSERTs + 14 scope-role rows into a single idempotent migration file (1252 lines)
- User reviewed and approved migration content via checkpoint before application — zero revision requests
- Scope distribution confirmed: 6 LOCAL-only, 4 LOCAL+STATE; local-immigration isolated from federal topic

## Task Commits

Each task was committed atomically:

1. **Task 1: Author stances and write migration SQL** - `4619afa` (feat) — in `C:/Focused Communities` repo
2. **Task 2: checkpoint:human-verify** — no commit (user review step; approved with no changes)

**Plan metadata:** *(this commit)*

## Files Created/Modified

- `C:/Focused Communities/supabase/migrations/20260504000001_phase23_local_compass_topics.sql` — Full migration: 10 topic INSERTs, 50 stance INSERTs (ON CONFLICT topic_id+value), 14 scope-role INSERTs (ON CONFLICT topic_id+role_scope); 1252 lines; idempotent

## Migration Structure Summary

| # | topic_key | Scope | Stances |
|---|-----------|-------|---------|
| 1 | residential-zoning | LOCAL | 5 |
| 2 | growth-and-development | LOCAL | 5 |
| 3 | public-safety-approach | LOCAL + STATE | 5 |
| 4 | homelessness-response | LOCAL + STATE | 5 |
| 5 | economic-development | LOCAL | 5 |
| 6 | transportation-priorities | LOCAL + STATE | 5 |
| 7 | local-environment | LOCAL + STATE | 5 |
| 8 | rent-regulation | LOCAL | 5 |
| 9 | local-immigration | LOCAL | 5 |
| 10 | city-sanitation | LOCAL | 5 |

Total scope-role rows: 14 (6 topics × 1 row + 4 topics × 2 rows)

## Decisions Made

- **LOCAL vs LOCAL+STATE split:** Topics where state government meaningfully co-governs policy (public safety funding, homelessness services funding, transportation infrastructure, environmental regulation) got dual scope. Topics that are almost exclusively municipal (zoning, sanitation, rent control, economic incentives, local immigration cooperation) are LOCAL-only.
- **local-immigration isolated:** Deliberately separate from the existing cross-cutting "Immigration and Treatment" topic (federal/state frame). Local-immigration covers sanctuary policies and ICE cooperation — a distinct municipal decision domain.
- **Stance voice:** Neutral, mechanism-focused, no partisan labels. example_perspectives use varied archetypes (property owner, small business owner, environmental advocate, fiscal conservative, urban planner, etc.) rather than partisan labels.
- **Scale direction:** Value 1 = market/deregulation/individual orientation; value 5 = government intervention/collective orientation — consistent with all existing compass topics.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required for this plan. Migration application is handled in Plan 23-02.

## Next Phase Readiness

- Migration file is complete and user-approved — ready for `supabase db push` in Plan 23-02
- All 10 topic_keys and UUIDs are established in the migration; Plan 23-02 needs no authoring work
- Plan 23-02 prerequisite: Supabase project credentials available in `C:/Focused Communities` environment

---
*Phase: 23-new-local-compass-topics*
*Completed: 2026-05-04*
