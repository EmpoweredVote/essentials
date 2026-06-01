---
phase: 74-or-executives-federal
reviewed: 2026-05-29T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - C:/EV-Accounts/backend/migrations/223_or_executive_officials.sql
  - C:/EV-Accounts/backend/migrations/224_or_federal_officials.sql
  - C:/EV-Accounts/backend/migrations/225_or_headshots.sql
findings:
  critical: 1
  warning: 2
  info: 1
  total: 4
status: issues_found
---

# Phase 74: Code Review Report

**Reviewed:** 2026-05-29
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Three migration files reviewed covering OR constitutional officers (223), OR federal officials (224), and OR headshots (225). Migration 225 is an audit-only file following the established pattern (200_sf_headshots, 209_sd_headshots, etc.) and is structurally sound.

The critical finding is in migration 223: the STATE_EXEC district is inserted with `state = 'or'` (lowercase), which contradicts every other STATE_EXEC district in this codebase (ME, MA, TX all use uppercase postal codes). The migration's own inline comment misattributes lowercase as "ME STATE_* pattern" — but migration 169 confirms ME STATE_EXEC uses uppercase `'ME'`. This will cause the OR executive officials to be silently invisible to any backend query that filters `districts.state = 'OR'`.

Migration 224 is well-structured. The senator external_id updates are idempotent, the NOT EXISTS guard correctly uses `(district_id, chamber_id)` for house reps (unique per district), and the pre-flight assertions are thorough. Two warnings are noted.

---

## Critical Issues

### CR-01: STATE_EXEC District Inserted with Lowercase `state = 'or'`

**File:** `C:/EV-Accounts/backend/migrations/223_or_executive_officials.sql:51`

**Issue:** The OR STATE_EXEC district is inserted with `state = 'or'` (lowercase). Every other STATE_EXEC district in the codebase uses uppercase 2-letter postal codes:
- ME STATE_EXEC: `state = 'ME'` (migration 169, explicitly noted "state='ME' uppercase for STATE_EXEC")
- MA STATE_EXEC: `state = 'MA'` (migration 154, explicitly noted "state='MA' uppercase for STATE_EXEC")
- TX STATE_EXEC: `state = 'TX'` (migration 103)

The migration's own inline comment at line 48 states "matches ME STATE_* pattern: districts.state lowercase for STATE/COUNTY tiers" — this is factually wrong. ME STATE_EXEC uses uppercase. Lowercase `'me'` is used for ME STATE_UPPER/STATE_LOWER legislative districts (migration 172), not for STATE_EXEC. If the backend queries `districts.state = 'OR'` (uppercase, as used everywhere else in this codebase for OR), the 5 OR constitutional officers will be silently excluded from all roster and profile queries.

The same lowercase value propagates through all five office INSERT queries (lines 84, 118, 154, 190, 226) via `WHERE d.state = 'or'`, meaning office rows will be inserted correctly relative to the district (since the insert query matches the inserted value) — but the downstream query risk remains.

**Fix:**
```sql
-- Line 51: change 'or' to 'OR' to match the established pattern
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, district_id, mtfcc)
SELECT gen_random_uuid(), 'STATE_EXEC', 'OR', '41', 'Oregon (Statewide)', 'Oregon (Statewide)', ''
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE district_type = 'STATE_EXEC'
    AND state = 'OR'
    AND geo_id = '41'
);
```

And update the five office-join WHERE clauses (lines 84, 118, 154, 190, 226) to match:
```sql
WHERE d.district_type = 'STATE_EXEC' AND d.state = 'OR' AND d.geo_id = '41'
```

Also correct the idempotency guard comment at line 18 from `state='or'` to `state='OR'`.

**Note:** Since migration 223 has already been applied to production (per phase summaries), a follow-up fix migration is needed to `UPDATE essentials.districts SET state = 'OR' WHERE district_type = 'STATE_EXEC' AND state = 'or' AND geo_id = '41'`.

---

## Warnings

### WR-01: Senator UPDATE Guard Relies on `full_name` — No Pre-flight Assertion

**File:** `C:/EV-Accounts/backend/migrations/224_or_federal_officials.sql:101-109`

**Issue:** The UPDATE that remaps Wyden and Merkley's external_ids guards with `WHERE full_name = 'Ron Wyden' AND external_id = -400065`. This is safe for idempotency (re-run with updated external_id matches 0 rows). However, there is no pre-flight assertion that the old external_ids `-400065` and `-400066` actually exist before attempting the update. If they have already been updated by a partial run or another migration, the UPDATEs silently match 0 rows with no error — leaving the senators with stale external_ids and no indication of failure.

Migration 224 has thorough pre-flight checks for district and chamber existence, but none for the senator rows themselves.

**Fix:** Add a pre-flight assertion in the `DO $$` block:
```sql
-- Assert old senator external_ids exist OR new ones already applied (idempotent check)
IF (SELECT COUNT(*) FROM essentials.politicians
    WHERE full_name IN ('Ron Wyden', 'Jeff Merkley')
      AND (external_id IN (-400065, -400066)
           OR external_id IN (-4101001, -4101002))) < 2 THEN
  RAISE EXCEPTION 'Pre-flight FAILED: Could not locate both OR senators by full_name + expected external_ids';
END IF;
```

### WR-02: `district_id` Column Value Inconsistent with STATE_EXEC Pattern

**File:** `C:/EV-Accounts/backend/migrations/223_or_executive_officials.sql:51`

**Issue:** The `district_id` text column is set to `'Oregon (Statewide)'` (same as `label`). Every other STATE_EXEC district in the codebase uses an empty string `''` for this column:
- MA STATE_EXEC (migration 154): `district_id = ''`
- ME STATE_EXEC (migration 169): `district_id = ''`
- TX STATE_EXEC (migration 103): `district_id = ''`

The NATIONAL_UPPER for OR (migration 174) uses `'Oregon'` as both label and district_id, which is the pattern for NATIONAL tiers. STATE_EXEC follows a different convention. If downstream code ever queries or joins on `district_id` for STATE_EXEC rows, the mismatch with the established empty-string convention may cause unexpected behavior.

**Fix:**
```sql
SELECT gen_random_uuid(), 'STATE_EXEC', 'OR', '41', 'Oregon (Statewide)', '', ''
```

---

## Info

### IN-01: Migration 225 Audit Header Says "Next Applied Migration Remains 225"

**File:** `C:/EV-Accounts/backend/migrations/225_or_headshots.sql:5`

**Issue:** The audit header states "Next applied migration number remains 225 for the next non-audit migration." However, this file itself is numbered 225. The intention is clear (225 is reserved for audit only and the next substantive migration should also be called 225), but this is confusing to future maintainers and inconsistent with the SF headshots pattern where migration 200 is audit-only and the next migration is explicitly stated as 207. If the ledger runner increments past 225, the next migration author may inadvertently use 226.

**Fix:** Revise the comment to be explicit:
```
-- This file occupies sequence number 225 as an audit record.
-- The next applied (non-audit) migration should use number 226.
```

---

_Reviewed: 2026-05-29_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
