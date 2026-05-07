---
phase: 28-judicial-compass-frontend-communities
plan: 02
subsystem: database
tags: [supabase, postgres, compass, communities, judicial, migrations]

# Dependency graph
requires:
  - phase: 27-judicial-compass-db
    provides: "8 judicial compass topics live in inform.compass_topics (migration 113)"
  - phase: 24-companion-focused-communities
    provides: "connect.communities table + fc_community_slug pattern established"
provides:
  - "8 connect.communities rows seeded for judicial compass topics"
  - "All 8 inform.compass_topics judicial rows have fc_community_slug populated"
  - "COMPASS-06 satisfied: companion Focused Communities live for all judicial topics"
affects: [phase-29-judicial-frontend-links, phase-31-community-cta-cards]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DO $$ block with DECLARE + RAISE EXCEPTION guards prevents orphaned communities"
    - "ON CONFLICT (slug) DO NOTHING makes INSERT idempotent"
    - "fc_community_slug UPDATE guarded by IS NULL OR != condition for idempotency"

key-files:
  created: []
  modified:
    - "C:\\Focused Communities\\supabase\\migrations\\20260506000001_phase28_judicial_communities.sql"

key-decisions:
  - "Simplified descriptions at 7th-grade reading level approved at checkpoint (commit c482a8e)"
  - "Topic UUIDs resolved at migration runtime via topic_key lookup (not hardcoded)"
  - "supabase db push required no repair — migration applied cleanly first attempt"

patterns-established:
  - "Judicial community slug → topic_key mapping: slug uses plain noun phrase (criminal-justice-philosophy), topic_key uses judicial- prefix (judicial-criminal-justice)"

# Metrics
duration: 10min
completed: 2026-05-07
---

# Phase 28 Plan 02: Judicial Companion Communities Summary

**8 judicial Focused Communities seeded in connect.communities with simplified plain-language descriptions; all 8 inform.compass_topics fc_community_slug values populated via supabase db push**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-05-07T (continuation from checkpoint)
- **Completed:** 2026-05-07
- **Tasks:** 1 (Task 3 — Tasks 1 and 2 completed in prior session)
- **Files modified:** 1

## Accomplishments

- Migration `20260506000001_phase28_judicial_communities.sql` deployed to production via `supabase db push` with no repair needed
- 8 `connect.communities` rows seeded for all judicial compass topics, each with citizen-evaluation descriptions at 7th-grade reading level
- All 8 `inform.compass_topics` rows (judicial topic_keys) updated with non-null `fc_community_slug`
- All 4 verification queries passed: 8 communities, 0 orphans, 8 non-null slugs, 8/8 MATCH on round-trip check

## Task Commits

1. **Task 1: Write migration SQL** - `1a1766f` (feat) — in C:\Focused Communities repo
2. **Task 2: Checkpoint descriptions simplified** - `c482a8e` (refactor) — in C:\Focused Communities repo
3. **Task 3: Deploy and verify** — migration applied via supabase db push (no additional code commit needed; planning artifacts committed below)

**Plan metadata:** committed with docs(28-02) commit in essentials repo

## Files Created/Modified

- `C:\Focused Communities\supabase\migrations\20260506000001_phase28_judicial_communities.sql` — Full migration: 8 community INSERTs + 8 fc_community_slug UPDATEs, DO $$ block with RAISE EXCEPTION guards, idempotent

## The 8 Final Descriptions (Simplified — Approved at Checkpoint)

| Community | Description |
|-----------|-------------|
| Criminal Justice Philosophy | When someone breaks the law, should a judge focus on punishment — or on helping them change? How a judge answers that shapes every sentence they hand down. |
| Access to Justice | Does it take money and a good lawyer to get a fair shot in court — or should the system work for everyone? Discuss how this candidate sees equal access. |
| Government Deference | When the government says it has the power to do something, should judges take their word for it — or make them prove it? Where's the line between trust and oversight? |
| Court Transparency | Should court hearings be open for anyone to watch, and should rulings be easy for regular people to read and understand? Discuss how open the legal system should be. |
| Legal Interpretation | Does the law mean exactly what it says — word for word — or what it should mean for how the world works today? How judges answer this shapes real outcomes. |
| Bail and Pretrial | If you're accused of a crime but not yet convicted, should you go home while you wait for trial — or stay in jail? How judges set bail changes who waits behind bars. |
| Prosecution Priorities | Prosecutors can't go after every case. Which crimes should they fight hardest — and when should they offer a deal or let something go? Their choices shape how justice works. |
| Police Accountability | When a police officer is accused of wrongdoing, should the prosecutor treat them the same as anyone else? Discuss how a DA or City Attorney should handle cases involving law enforcement. |

## Verification Results

All 4 queries passed against production DB:

**Query 1 — 8 communities exist:** 8 rows returned (access-to-justice, bail-and-pretrial, court-transparency, criminal-justice-philosophy, government-deference, legal-interpretation, police-accountability, prosecution-priorities)

**Query 2 — no orphans:** 8 rows, all topic_keys starting with `judicial-`, zero NULL topic_key values

**Query 3 — fc_community_slug populated:** 8 rows for `topic_key LIKE 'judicial-%' AND is_live = true`, all non-null fc_community_slug

**Query 4 — slug round-trip:** 8 rows, all showing `MATCH` — fc_community_slug on compass_topics matches slug in connect.communities for every judicial topic

## Decisions Made

- **7th-grade descriptions:** User approved simplified framing at checkpoint — plain language ("If you're accused of a crime...") over citizen-evaluation question format ("How should voters assess...")
- **No migration repair needed:** Unlike Phase 23, supabase db push applied cleanly on first attempt

## Deviations from Plan

None — plan executed exactly as written. Migration deployed cleanly, all 4 verification checks passed on first run.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required. Migration applied directly to production Supabase.

## Next Phase Readiness

- COMPASS-06 satisfied: all 8 judicial topics now have companion Focused Communities
- fc_community_slug populated on all 8 judicial compass_topics rows — frontend CTA cards can now resolve community links for judicial profiles
- Phase 28 complete (2/2 plans)
- Phase 29 (Judicial Frontend Links / community CTA display) is unblocked

---
*Phase: 28-judicial-compass-frontend-communities*
*Completed: 2026-05-07*
