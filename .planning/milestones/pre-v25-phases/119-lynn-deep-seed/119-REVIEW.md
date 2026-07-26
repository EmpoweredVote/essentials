---
phase: 119-lynn-deep-seed
reviewed: 2026-06-14T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - C:/EV-Accounts/backend/migrations/584_lynn_city_government.sql
  - C:/EV-Accounts/backend/migrations/585_lynn_school_committee.sql
  - C:/EV-Accounts/backend/scripts/_tmp-lynn-headshots.py
  - C:/EV-Accounts/backend/migrations/586_lynn_headshots.sql
findings:
  critical: 1
  warning: 3
  info: 0
  total: 4
status: issues_found
---

# Phase 119: Code Review Report

**Reviewed:** 2026-06-14
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Reviewed migrations 584 (Lynn city government), 585 (Lynn school committee), the Python headshot upload script, and migration 586 (Lynn headshots). Migration 584 and 585 are structurally sound and follow the established project patterns (Somerville/Newton deep seeds). The `BEGIN;`/`COMMIT;` absence in 585 is consistent with sibling school committee migrations (579, 582) applied via Supabase MCP, not a regression. The primary concern is in migration 586: the post-verification block counts uploaded headshots but never asserts the expected value, meaning a silent failure would pass as clean. Additionally, 586 contains a bare `COMMIT;` that has no corresponding `BEGIN;`, inconsistent with the sibling headshot migrations (580, 583) which have neither. Two lower-severity issues exist in the Python script.

## Critical Issues

### CR-01: Migration 586 post-verification never asserts expected headshot count

**File:** `C:/EV-Accounts/backend/migrations/586_lynn_headshots.sql:190-213`
**Issue:** `v_img_count` is computed and printed in the NOTICE message but is never compared to the expected value of 12. If all 12 `INSERT ... WHERE NOT EXISTS` blocks silently produce 0 rows (e.g., because the `NOT EXISTS` check unexpectedly finds pre-existing rows keyed on `politician_id`, or because the politician subquery returns NULL for one or more entries), the post-verification block exits with PASSED while 0 headshots were actually inserted. The wrong-type check is not a substitute — it only fires if rows exist with the wrong type, not if no rows were inserted at all.

**Fix:**
```sql
IF v_img_count < 12 THEN
  RAISE EXCEPTION 'Migration 586 post-verification FAILED: expected at least 12 headshots (type=default) for Lynn officials, found %', v_img_count;
END IF;
```
Add this check between the `v_wrong_type > 0` check and the final `RAISE NOTICE` at line 213.

## Warnings

### WR-01: Migration 586 has a bare `COMMIT;` without a matching `BEGIN;`

**File:** `C:/EV-Accounts/backend/migrations/586_lynn_headshots.sql:224`
**Issue:** Migration 586 ends with `COMMIT;` (line 224) but has no `BEGIN;`. The sibling headshot migrations 580 (Newton) and 583 (Somerville) have neither `BEGIN;` nor `COMMIT;`. When applied via the Supabase MCP in autocommit mode this is harmless, but if the migration is ever run in a transactional psql session it would commit whatever transaction was already open — potentially committing partial state from a prior failed command. The inconsistency with the two preceding headshot migrations is also a maintenance hazard.

**Fix:** Remove the `COMMIT;` at line 224 to match the established pattern for headshot migrations in this project. The Supabase MCP execution model handles transaction boundaries implicitly.

### WR-02: Python script opens `.env` at module level with no error handling

**File:** `C:/EV-Accounts/backend/scripts/_tmp-lynn-headshots.py:37`
**Issue:** The `.env` file is opened unconditionally at module load time with no `try/except` or existence check. If the script is run from a directory other than the repo root, or if `.env` has been renamed/deleted, the script raises an unhandled `FileNotFoundError` before printing any helpful diagnostic. The env validation block in `main()` (lines 505–513) is never reached in this case.

**Fix:**
```python
_env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
if not os.path.exists(_env_path):
    print(f'ERROR: .env file not found at {_env_path}')
    sys.exit(1)
_env = {}
with open(_env_path) as f:
    ...
```

### WR-03: `urllib3.disable_warnings` fires on every run despite `verify=True`

**File:** `C:/EV-Accounts/backend/scripts/_tmp-lynn-headshots.py:580-581`
**Issue:** `urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)` is called unconditionally in the `if __name__ == '__main__'` block. All `requests.get` calls in this script use `verify=True` (line 314), so no `InsecureRequestWarning` is generated and the suppression is dead code. More importantly, globally silencing these warnings masks any future accidental `verify=False` addition — the warning that would alert a developer is now suppressed by default.

**Fix:** Remove the `urllib3.disable_warnings` call entirely. The project pattern uses `verify=True` throughout; the suppression is unnecessary and misleading.

---

_Reviewed: 2026-06-14_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
