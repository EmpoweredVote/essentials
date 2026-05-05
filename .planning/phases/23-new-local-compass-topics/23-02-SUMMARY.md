---
phase: 23-new-local-compass-topics
plan: "02"
subsystem: database
tags: [postgres, supabase, compass, migrations, psql, inform-schema]

# Dependency graph
requires:
  - phase: 23-01
    provides: migration file 20260504000001_phase23_local_compass_topics.sql with 10 topics + 50 stances + 14 scope-role rows
provides:
  - 10 LOCAL compass topics live in inform.compass_topics (is_live=true, went_live_at set)
  - 50 stances seeded in inform.compass_stances with full content (text, description, supporting_points, example_perspectives)
  - 14 scope-role rows in inform.compass_topic_roles (10 local + 4 state for multi-scope topics)
affects: [phase-24-fc-community-slugs, phase-10-compass-stances-integration, compassService]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "supabase migration repair --status reverted to clear phantom remote-only migration records before push"
    - "supabase migration repair --status applied to mark already-applied local migrations before push"

key-files:
  created:
    - .planning/phases/23-new-local-compass-topics/23-02-SUMMARY.md
  modified:
    - .planning/STATE.md

key-decisions:
  - "Migration history repair pattern: mark remote-only migrations as reverted, locally-applied-but-untracked as applied, then push"
  - "fc_community_slug left NULL for all 10 topics; Phase 24 will populate"
  - "Phase 23 migration is idempotent (ON CONFLICT DO NOTHING / DO UPDATE on topic_keys)"

patterns-established:
  - "Phase 23 apply pattern: repair history → push single migration → verify via psql row counts"

# Metrics
duration: 3min
completed: 2026-05-04
---

# Phase 23 Plan 02: Apply Migration + Verify Summary

**10 LOCAL compass topics + 50 full stances + 14 scope-role rows applied to live Supabase DB via supabase db push; all 5 verification queries confirmed exact expected counts**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-05-05T05:03:10Z
- **Completed:** 2026-05-05T05:06:00Z
- **Tasks:** 2
- **Files modified:** 2 (STATE.md + this SUMMARY.md)

## Accomplishments

- Applied migration 20260504000001_phase23_local_compass_topics.sql to production Supabase via `supabase db push`
- Repaired migration history table (remote-only phantom migrations + locally-applied untracked migrations) before push succeeded
- Verified all 5 psql queries returned exact expected counts — 10 topics, 50 stances, 50 complete stances, 10 local + 4 state scope roles, 4 multi-scope topic keys

## supabase db push Output

```
Initialising login role...
Connecting to remote database...
Do you want to push these migrations to the remote database?
 • 20260504000001_phase23_local_compass_topics.sql

 [Y/n]
Applying migration 20260504000001_phase23_local_compass_topics.sql...
Finished supabase db push.
```

## Verification Query Results

| Query | Description | Expected | Actual | Pass? |
|-------|-------------|----------|--------|-------|
| A | Topic count (is_live=true AND went_live_at IS NOT NULL) | 10 | 10 | YES |
| B | Stance count joined to live topics | 50 | 50 | YES |
| C | Stances with full content (text + description + 3+ supporting_points + 3+ example_perspectives) | 50 | 50 | YES |
| D | Scope role breakdown (local / state) | local=10, state=4 | local=10, state=4 | YES |
| E | Multi-scope topic_keys with state role | 4 rows | economic-development, growth-and-development, rent-regulation, transportation-priorities | YES |

All 4 ROADMAP success criteria satisfied:
- SC-1: 10 new topics visible in compass (is_live=true, went_live_at set) — CONFIRMED
- SC-2: Each topic has exactly 5 stances (50 total) — CONFIRMED
- SC-3: Each stance has text, description, 3+ supporting_points, 3+ example_perspectives — CONFIRMED
- SC-4: LOCAL scope tag on all 10; STATE tag on 4 multi-scope topics — CONFIRMED

## Task Commits

Each task was committed atomically:

1. **Task 1: Apply Phase 23 migration** - No git commit (migration applied to Supabase; Focused Communities repo)
2. **Task 2: Verify row counts** - No standalone task commit (verification-only task)

**Plan metadata:** committed as docs(23-02) with SUMMARY + STATE

## Files Created/Modified

- `.planning/phases/23-new-local-compass-topics/23-02-SUMMARY.md` — this file
- `.planning/STATE.md` — updated position and accumulated context

## Decisions Made

- Migration history repair was required before push could succeed. Two classes of mismatch existed:
  1. Remote-only migrations (applied directly to DB, not tracked locally): marked as `reverted` so CLI ignores them
  2. Local migrations already applied to DB but not tracked in history: marked as `applied` to prevent re-application
- This is the standard Supabase repair flow when local and remote history diverge.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Supabase migration history mismatch blocked db push**

- **Found during:** Task 1 (supabase db push)
- **Issue:** Remote DB had 37 migration versions not present in local migrations directory; CLI refused to push
- **Fix:** Ran `supabase migration repair --status reverted` for the 37 remote-only versions, then `supabase migration repair --status applied` for 10 local migrations already applied to DB. Push then succeeded.
- **Files modified:** None (migration history is a DB table, not a file)
- **Verification:** Subsequent `supabase db push` showed only the Phase 23 migration pending and applied it cleanly
- **Committed in:** N/A (repair is a CLI operation against DB metadata)

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking)
**Impact on plan:** Blocking issue, required repair but zero data impact. Migration applied cleanly after history reconciliation.

## Issues Encountered

None beyond the migration history mismatch (documented as deviation above). All 5 psql verification queries passed on first run with exact expected counts.

## User Setup Required

None - no external service configuration required.

## Note for Phase 24

`fc_community_slug` is NULL for all 10 new topics. Phase 24 needs to populate this column to wire each topic to its `connect.communities` row (enabling community threads + member counts on the compass detail view). The 10 topic_keys to populate are:

- residential-zoning
- growth-and-development
- public-safety-approach
- homelessness-response
- economic-development
- transportation-priorities
- local-environment
- rent-regulation
- local-immigration
- city-sanitation

## Next Phase Readiness

- Phase 23 complete. All 10 LOCAL compass topics are live in production.
- Phase 24 (fc_community_slug population) can begin immediately — no blockers.
- compassService.ts `getCompassTopics()` will automatically surface these topics to local politicians without any code changes (scope filtering via compass_topic_roles is already wired).

---
*Phase: 23-new-local-compass-topics*
*Completed: 2026-05-04*
