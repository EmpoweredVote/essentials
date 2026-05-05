---
phase: 24
plan: 01
subsystem: compass-communities
tags: [connect, compass, communities, local-topics, sql, migration]
requires: [phase-23]
provides: [phase-24-migration-sql, 10-companion-community-rows]
affects: [phase-24-02]
tech-stack:
  added: []
  patterns: [INSERT-SELECT-subquery, fc_community_slug-backfill]
key-files:
  created:
    - C:/Focused Communities/supabase/migrations/20260504000002_phase24_companion_communities.sql
  modified: []
decisions:
  - local-immigration topic gets slug immigration-policy (decoupled from topic_key)
  - INSERT uses SELECT subquery pattern — never hardcoded UUIDs
  - ON CONFLICT (slug) DO NOTHING makes file safely idempotent
metrics:
  duration: ~10 minutes
  completed: 2026-05-04
---

# Phase 24 Plan 01: Companion Focused Communities Summary

**One-liner:** 10 connect.communities rows + fc_community_slug backfill authored as idempotent migration SQL, all 10 descriptions approved at checkpoint with zero edits.

## What Was Done

- Authored 10 community descriptions (one per Phase 23 LOCAL compass topic)
- User verified all 10 descriptions at checkpoint — approved as written, no edits requested
- Wrote migration SQL at `C:/Focused Communities/supabase/migrations/20260504000002_phase24_companion_communities.sql`
- Migration inserts 10 connect.communities rows (Section 1) and back-fills fc_community_slug on inform.compass_topics (Section 2)

## Approved Descriptions (all 10 — exact text as approved)

| # | slug | name | description |
|---|------|------|-------------|
| 1 | residential-zoning | Residential Zoning | Explore neighborhood character preservation, accessory dwelling units, market-led density, transit-oriented upzoning, and how cities decide who gets to shape their own streets. |
| 2 | growth-and-development | Growth and Development | Discuss growth moratoriums, managed-growth planning, infrastructure-led expansion, aggressive development incentives, and how cities balance new residents with existing ones. |
| 3 | public-safety-approach | Public Safety Approach | Engage with increased police staffing, co-responder models, parallel crisis response investment, and redirecting portions of police budgets to mental-health and social services. |
| 4 | homelessness-response | Homelessness Response | Explore encampment enforcement, shelter-first intake, housing-first programs, root-cause social services, and harm-reduction and tenant-protection approaches to homelessness. |
| 5 | economic-development | Economic Development | Discuss aggressive tax abatements, targeted incentives for priority sectors, infrastructure-led growth, small-business and workforce investment, and market-only approaches. |
| 6 | transportation-priorities | Transportation Priorities | Engage with road and highway investment, balanced multimodal planning, transit expansion, bicycle and pedestrian priority, and transit-oriented density as competing city visions. |
| 7 | local-environment | Local Environment | Explore development-first permitting, light environmental review, balanced impact standards, strong conservation protections, and how cities weigh ecological preservation against growth. |
| 8 | rent-regulation | Rent Regulation | Discuss market-only rent setting, basic tenant protections, modest rent stabilization, strong rent control ordinances, and public housing expansion as approaches to housing costs. |
| 9 | immigration-policy | Immigration Policy | Engage with full federal cooperation, serious-crime-only collaboration, status-quo limited cooperation, sanctuary policies, and strong sanctuary with legal defense funding. |
| 10 | city-sanitation | City Sanitation | Explore strict enforcement and fines, service privatization, status-quo municipal operations, expanded public staffing, and community-led sanitation models for street cleanliness. |

**Note on item 9:** topic_key = `local-immigration` but slug = `immigration-policy`. The INSERT subselect uses `WHERE t.topic_key = 'local-immigration'` and the UPDATE also uses `topic_key = 'local-immigration'`; the community slug is `immigration-policy`. This decouples the public-facing slug from the internal topic_key.

## Migration File

**Path:** `C:/Focused Communities/supabase/migrations/20260504000002_phase24_companion_communities.sql`  
**Commit:** 8d0238d — `feat(24-01): write phase 24 companion communities migration SQL`

**Structure:**
- `BEGIN; ... COMMIT;` — single transaction
- Section 1: 10 `INSERT INTO connect.communities` statements using `INSERT ... SELECT ... FROM inform.compass_topics WHERE t.topic_key = ... AND t.is_live = true` pattern
- Section 2: 10 `UPDATE inform.compass_topics SET fc_community_slug = ...` statements (one per topic)
- `ON CONFLICT (slug) DO NOTHING` on all INSERTs — fully idempotent

**Note:** Do NOT apply this migration here — that is Plan 24-02's job (via `supabase db push`).

## Verification Check Results (all 7 passed)

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| 1. File exists | file present | 6,653 bytes | PASS |
| 2. BEGIN + COMMIT count | 2 | 2 | PASS |
| 3. INSERT INTO connect.communities count | 10 | 10 | PASS |
| 4. UPDATE inform.compass_topics SET fc_community_slug count | 10 | 10 | PASS |
| 5. 'immigration-policy' occurrences | >= 2 | 2 | PASS |
| 6. Hardcoded UUIDs | none | none | PASS |
| 7. WHERE t.topic_key = occurrences | 10 | 10 | PASS |

## Checkpoint Note

No user-requested edits at checkpoint — all 10 descriptions approved as written.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| local-immigration topic_key → immigration-policy slug | Decouples public-facing URL slug from internal topic identifier; prevents confusion with the existing federal immigration topic |
| INSERT-SELECT subquery pattern | Never hardcode UUIDs — query by topic_key at migration time; safe against DB cloning, schema differences |
| ON CONFLICT (slug) DO NOTHING | slug is UNIQUE on connect.communities; makes migration safely re-runnable |
| Omit id/member_count/thread_count/created_at/updated_at/slice_label | All column defaults; inserting them would break idempotency or override defaults |

## Deviations from Plan

None — plan executed exactly as written.

## Next Phase Readiness

Plan 24-02 can run immediately:
- Migration file is at correct path
- File is committed to C:/Focused Communities repo
- Command: `supabase db push` from C:/Focused Communities
- Verification: 10 communities in connect.communities + 10 non-null fc_community_slug rows
