---
phase: 118-somerville-deep-seed
reviewed: 2026-06-14T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - C:/EV-Accounts/backend/migrations/581_somerville_city_government.sql
  - C:/EV-Accounts/backend/migrations/582_somerville_school_committee.sql
  - C:/EV-Accounts/backend/scripts/_tmp-somerville-headshots.py
  - C:/EV-Accounts/backend/migrations/583_somerville_headshots.sql
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 118: Code Review Report

**Reviewed:** 2026-06-14
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Four files reviewed: two SQL seeding migrations (581 city government, 582 school committee), one headshot upload Python script, and one headshot migration (583). All four implement the Somerville Deep Seed following the Newton 578/579 pattern.

No correctness blockers were found. The logic is sound: external_id arithmetic is correct, BETWEEN ranges are valid for negative integers, district type conventions are respected (`LOCAL`/`LOCAL_EXEC`/`SCHOOL`, all lowercase state), office_id back-fill correctly excludes Mayor Wilson and Council President Davis from the SC back-fill, and the two-ex-officio structure is properly handled in post-verification gates.

Three warnings were identified: migration 583 is missing a pre-flight guard that could allow orphan `politician_id = NULL` rows if run out of order (risk is mitigated if the schema has a NOT NULL constraint, but that cannot be verified from SQL alone); migration 582 has no wrapping transaction, creating a partial-failure/re-run deadlock (established Newton pattern, not introduced here); and the Python headshots script's `.env` parser does not strip surrounding quotes from values, which would corrupt config values if the project's `.env` uses quoted syntax.

---

## Warnings

### WR-01: Migration 583 missing pre-flight guard — orphan NULL `politician_id` rows if run out of order

**File:** `C:/EV-Accounts/backend/migrations/583_somerville_headshots.sql:44-52`

**Issue:** Every INSERT block in migration 583 uses this pattern to test for duplicates:

```sql
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -2562535001)
);
```

If migration 581 has not yet run, the inner subquery `(SELECT id ... WHERE external_id = -2562535001)` returns `NULL`. In SQL, `WHERE politician_id = NULL` matches zero rows, so `NOT EXISTS` evaluates to `TRUE` and the INSERT fires — with `politician_id = NULL` as the payload. If `politician_images.politician_id` has a `NOT NULL` or foreign key constraint, this fails with an error (safe). If the column is nullable with no FK, it silently inserts an orphan row that breaks the profile UI.

Migration 583 has no pre-flight block verifying that its dependencies (581, 582) have already been applied, unlike migration 582 which explicitly checks for Mayor Wilson and Council President Davis before proceeding.

**Fix:** Add a pre-flight guard at the top of migration 583, before `BEGIN;`:

```sql
DO $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM essentials.politicians
  WHERE external_id BETWEEN -2562535012 AND -2562535001;
  IF v_count <> 12 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: migration 581 not applied — expected 12 city politicians, found %. Run 581 + 582 first.', v_count;
  END IF;
END $$;
```

---

### WR-02: Migration 582 has no wrapping transaction — partial failure creates unrecoverable state

**File:** `C:/EV-Accounts/backend/migrations/582_somerville_school_committee.sql:49-56`

**Issue:** Migration 581 wraps all DML in an explicit `BEGIN;` / `COMMIT;` transaction, so any failure rolls back the entire migration cleanly. Migration 582 has no such wrapper (following the Newton 579 pattern). If the migration partially succeeds — for example, the government row and chamber are inserted but a later politician block fails — then:

1. Pre-flight 1 (line 50-56) detects the already-inserted government row on any re-run attempt.
2. It immediately raises an exception: `Migration 582 already applied — aborting re-run`.
3. The partial state (government row, no politicians) cannot be corrected by re-running 582 without manual cleanup.

This is the same structural fragility present in Newton 579, so it is an established pattern rather than a regression — but the asymmetry within the same phase (581 has a transaction, 582 does not) is worth flagging.

**Fix:** Wrap the DML in migration 582 with an explicit transaction, consistent with 581:

Add `BEGIN;` after the pre-flight `DO $$` blocks (after line 99) and `COMMIT;` at the very end (after the migration ledger insert, line 614).

---

### WR-03: Python headshots script `.env` parser does not strip surrounding quotes

**File:** `C:/EV-Accounts/backend/scripts/_tmp-somerville-headshots.py:37-42`

**Issue:** The inline `.env` parser uses `line.split('=', 1)` and `v.strip()`. `strip()` removes leading/trailing whitespace but does NOT strip surrounding quotation marks. If the project's `.env` file contains quoted values (e.g., `SUPABASE_URL="https://..."` or `SERVICE_KEY='eyJ...'`), the resulting values will include the literal quote characters. This breaks the Supabase Storage URL construction (`f'{SUPABASE_URL}/storage/v1/object/{BUCKET}/{filename}'`) and the Authorization header, causing all uploads to fail with HTTP 401 or malformed URLs.

**Fix:** Strip surrounding quotes after splitting:

```python
k, v = line.split('=', 1)
k = k.strip()
v = v.strip().strip('"').strip("'")
_env[k] = v
```

Or use the `python-dotenv` library (`from dotenv import load_dotenv; load_dotenv(_env_path)`) which handles all standard `.env` quoting conventions correctly.

---

## Info

### IN-01: Migration 583 post-verification does not assert a minimum headshot count

**File:** `C:/EV-Accounts/backend/migrations/583_somerville_headshots.sql:165-191`

**Issue:** The post-verification block counts headshots with `type='default'` and checks that none have wrong type, but it does not assert that at least 9 rows were inserted (the known-successful count). `v_img_count` is reported in the NOTICE but never validated against a floor. If all 9 uploads failed silently and the migration was applied anyway, the post-verification would pass with `v_img_count = 0`, giving false confidence.

**Fix:** Add a minimum count assertion:

```sql
IF v_img_count < 1 THEN
  RAISE EXCEPTION 'Post-verification FAILED: 0 headshots found for Somerville officials — did the upload script run?';
END IF;
```

A strict check of `v_img_count <> 9` would also work given 9 were confirmed uploaded.

---

### IN-02: Python headshots script calls `urllib3.disable_warnings` but uses `verify=True` throughout

**File:** `C:/EV-Accounts/backend/scripts/_tmp-somerville-headshots.py:598-599`

**Issue:** The `__main__` block imports `urllib3` and calls `urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)`. All `requests.get()` calls in the script use `verify=True` (SSL verification enabled), so `InsecureRequestWarning` can never be triggered. The import and the call are dead code.

**Fix:** Remove the two lines:

```python
# Remove these:
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
```

---

_Reviewed: 2026-06-14_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
