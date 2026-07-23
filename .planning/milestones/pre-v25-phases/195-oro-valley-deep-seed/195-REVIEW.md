---
phase: 195-oro-valley-deep-seed
reviewed: 2026-07-11T00:00:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - src/lib/buildingImages.js
  - src/lib/coverage.js
  - C:/EV-Accounts/backend/migrations/1305_town_of_oro_valley.sql
  - C:/EV-Accounts/backend/migrations/1306_town_of_oro_valley_headshots.sql
  - C:/EV-Accounts/backend/migrations/1307_oro_valley_mayor_stances.sql
  - C:/EV-Accounts/backend/migrations/1308_oro_valley_council_1_stances.sql
  - C:/EV-Accounts/backend/migrations/1309_oro_valley_council_2_stances.sql
  - C:/EV-Accounts/backend/migrations/1310_oro_valley_council_3_stances.sql
  - C:/EV-Accounts/backend/migrations/1311_oro_valley_council_4_stances.sql
  - C:/EV-Accounts/backend/migrations/1312_oro_valley_council_5_stances.sql
  - C:/EV-Accounts/backend/migrations/1313_oro_valley_council_6_stances.sql
findings:
  critical: 0
  warning: 1
  info: 3
  total: 4
status: issues_found
---

# Phase 195: Code Review Report

**Reviewed:** 2026-07-11
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

Reviewed the Oro Valley (AZ) deep-seed: two minimal frontend edits (a single `CURATED_LOCAL`
banner entry and one `COVERAGE_STATES` area object appended to the existing Arizona block) plus
nine EV-Accounts migrations (1 structural, 1 audit-only headshots, 7 evidence-only stance files).

Overall the work is high quality and defensively engineered. The structural migration (1305) is
well-guarded: two pre-flight gates, `WHERE NOT EXISTS` on every INSERT, `ON CONFLICT` upserts, and
a seven-clause in-transaction post-verification block that rolls back on any deviation. All SQL
uses literal values (no dynamic string building — no injection surface), dollar-quoted reasoning
prose contains no `$$` sequence that could break quoting, and the `-4009001..-4009007` external_id
block is collision-free (grep confirms it appears only in 1305/1306). The frontend diff is exactly
13 additive lines; the `getBuildingImages` longest-key-first matcher resolves `'oro valley'`
correctly with no substring collision, and the coverage geo_id `0451600` is consistent across
`coverage.js` and 1305. Politician UUIDs are internally consistent across 1306–1313, and the seeded
row count (28) matches the commit message.

No Critical or blocking defects were found. One Warning (a provable factual contradiction in
user-facing stance prose) and three Info items (reproducibility/robustness and stale-comment notes)
are recorded below.

## Warnings

### WR-01: Contradictory tax-vote date between Winfield and Barrett stance files (same council session)

**File:** `C:/EV-Accounts/backend/migrations/1307_oro_valley_mayor_stances.sql:100` and `C:/EV-Accounts/backend/migrations/1308_oro_valley_council_1_stances.sql:142`

**Issue:** Both files describe the same three-tax Council vote and cite the identical AZPM source
URL (`.../2026/1/15/228000-tax-debate-in-oro-valley...`), but they disagree on the date of the vote:

- 1307 (Winfield): "voted **on Jan. 15, 2026** in favor of all three proposed new taxes"
- 1308 (Barrett): "At the **Jan. 14, 2026** Council meeting (reported by AZPM Jan. 15), Barrett
  voted against all three"

Barrett's file explicitly separates the meeting date (Jan 14) from the report date (Jan 15);
Winfield's file appears to have conflated the article's publication date with the meeting date.
Because the reasoning text renders in the compass tooltip/profile, this ships a self-contradicting
date to users. (Vote outcome is internally consistent — use tax "approved 4-3", Barrett among the
3 against — so only the date is wrong.)

**Fix:** Reconcile to the correct meeting date. If the session was Jan 14, update 1307:
```sql
-- 1307, reasoning text
... voted on Jan. 14, 2026 in favor of all three proposed new taxes brought to the Council ...
```
Confirm against the AZPM article and align both files (and re-apply the corrected
`inform.politician_context` row for Winfield, which upserts via `ON CONFLICT DO UPDATE`).

## Info

### IN-01: Stance migrations hardcode politician UUIDs instead of resolving by external_id (inconsistent with 1306)

**File:** `C:/EV-Accounts/backend/migrations/1307_oro_valley_mayor_stances.sql:40` (and 1308–1313, same pattern)

**Issue:** 1305 assigns politician UUIDs via `gen_random_uuid()`, so the specific UUID values are
only known after 1305 runs. The headshot migration 1306 correctly resolves each politician with
`(SELECT id FROM essentials.politicians WHERE external_id = -4009001)`, making it robust to a DB
rebuild. The seven stance files instead hardcode the literal UUID (e.g.
`politician_id = 'd3009d53-a6f0-4ea0-b41d-658ce62e3753'`). If 1305 were ever re-run against a fresh
database, it would generate different UUIDs and 1307–1313 would insert orphaned
`inform.politician_answers` rows (cross-schema, no FK to catch it) that never render. This works
correctly in prod today (the orchestrator captured the live UUIDs into a manifest), and it matches
the established project-wide stance-migration convention (~239 files), so it is not a phase-195
regression — but it is a latent reproducibility gap and is inconsistent with 1306's own safer
approach within the same phase.

**Fix:** Prefer the external_id subselect form used by 1306 for future stance migrations, e.g.
`VALUES ((SELECT id FROM essentials.politicians WHERE external_id = -4009001), '<topic>', 3.0)`.
No action required for the already-applied prod rows.

### IN-02: Stale `TODO_verify_at_task3` reference in 1306 header comment

**File:** `C:/EV-Accounts/backend/migrations/1306_town_of_oro_valley_headshots.sql:14-16`

**Issue:** The header still narrates the per-image `photo_license` as a placeholder
(`'TODO_verify_at_task3'` "finalized by the orchestrator ... after the Playwright sourcing pass"),
but the migration body already carries finalized, per-image license strings (lines 27, 38, 49, 60,
71, 82, 94). The comment is now misleading — a reader could believe the licenses are still
placeholders.

**Fix:** Update the header note to state the licenses were finalized (remove or past-tense the
`TODO_verify_at_task3` language).

### IN-03: Government-row idempotency guard keys on name, not geo_id

**File:** `C:/EV-Accounts/backend/migrations/1305_town_of_oro_valley.sql:49-55, 68-71`

**Issue:** Pre-flight gate (2) and the government INSERT `WHERE NOT EXISTS` both key on
`name = 'Town of Oro Valley, Arizona, US'`. The header notes `essentials.governments` has no unique
constraint on `geo_id`. Consequently a pre-existing government row sharing geo_id `0451600` under a
*different* name would not be detected and a duplicate-geo_id government could be created. Risk is
low here (greenfield town — Phase 190 wrote only the geofence, not a government) and the behavior
follows documented convention, but the guard does not defend against the geo_id-collision case it
warns about elsewhere in the header (line 21).

**Fix:** Optionally strengthen the pre-flight to also assert no existing government row carries
`geo_id = '0451600'`, independent of name. Not required given the greenfield precondition.

---

_Reviewed: 2026-07-11_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
