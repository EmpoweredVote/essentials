---
phase: 103-alexandria-deep-seed
reviewed: 2026-06-08T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - C:/EV-Accounts/backend/migrations/312_alexandria_government.sql
  - C:/EV-Accounts/backend/migrations/313_acps_school_board.sql
  - C:/EV-Accounts/backend/scripts/_tmp-alexandria-headshots.py
  - C:/EV-Accounts/backend/migrations/314_alexandria_headshots.sql
findings:
  critical: 1
  warning: 6
  info: 0
  total: 7
status: issues_found
---

# Phase 103: Code Review Report

**Reviewed:** 2026-06-08
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Four files reviewed: two city-government seed migrations (312, 313), one headshot-upload Python script, and one headshot-images migration (314). The ACPS migration (313) and headshot migration (314) are structurally sound. The city government migration (312) has a meaningful idempotency divergence from the analog pattern. The Python script has one critical integrity bug (CDN URL mismatch), two warnings (dead parameter, .env quote stripping), and a gate severity issue. Migration 314 has a copyright metadata inaccuracy and a missing ACPS verification gate.

---

## Narrative Findings (AI reviewer)

---

## Critical Issues

### CR-01: CDN_BASE hardcoded to project ID — upload URL and CDN URL can diverge

**File:** `C:/EV-Accounts/backend/scripts/_tmp-alexandria-headshots.py:72`

**Issue:** `CDN_BASE` is hardcoded to `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/...` while the actual storage upload URL in `upload_to_storage` (line 346) is constructed from `SUPABASE_URL` (env var). If these two values ever refer to different Supabase projects (e.g., staging vs. production, or a project migration), `upload_to_storage` would PUT the file to the correct bucket while the returned `cdn_url` points to the wrong (hardcoded) project. That wrong URL is what gets printed in the manifest and would be written into `politician_images.url` by migration 314 — resulting in 404s for all headshots with no upload error raised.

The script has already been run and migration 314 applied, so for the current state this is not an active breakage (both pointed to the same project). But the divergence is a latent correctness trap for any future re-run or adaptation.

**Fix:** Derive CDN_BASE from SUPABASE_URL so they cannot diverge:
```python
# Derive CDN base from the same SUPABASE_URL used for uploads
CDN_BASE = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}"
```
Remove the hardcoded `CDN_BASE = 'https://kxsdzaojfaibhuzmclfq...'` constant at line 72.

---

## Warnings

### WR-01: Migration 312 pre-flight uses RAISE NOTICE instead of RAISE EXCEPTION — re-run is not aborted

**File:** `C:/EV-Accounts/backend/migrations/312_alexandria_government.sql:32-38`

**Issue:** The pre-flight DO block checks whether the government row already exists and, if so, emits a `RAISE NOTICE`. Execution continues normally through the rest of the migration. While each individual INSERT has a `WHERE NOT EXISTS` guard that prevents data duplication, the pre-flight notice does not actually abort a re-run.

Migration 313 (the direct analog) correctly uses `RAISE EXCEPTION` to halt execution if the government row already exists. Migration 312's weaker behavior diverges from the established abort-on-re-run convention and from the template in 103-PATTERNS.md §313. If someone re-runs migration 312 against a production DB with partial state (e.g., some offices missing), the migration will silently proceed without any signal that it already ran, and the post-verification gate will either pass (state is already correct) or raise an exception — but the operator never gets the clear abort signal that the analog pattern provides.

**Fix:** Change `RAISE NOTICE` to `RAISE EXCEPTION` in the pre-flight block, matching migration 313's pattern:
```sql
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name = 'City of Alexandria, Virginia, US') > 0 THEN
    RAISE EXCEPTION 'Migration 312 already applied — aborting re-run';
  END IF;
END $$;
```

---

### WR-02: Neither migration 312 nor 313 wraps in a transaction — partial-failure leaves inconsistent state

**File:** `C:/EV-Accounts/backend/migrations/312_alexandria_government.sql:1` and `C:/EV-Accounts/backend/migrations/313_acps_school_board.sql:1`

**Issue:** Both migrations execute as a sequence of independent autocommit statements (no `BEGIN`/`COMMIT` wrapper). A failure partway through — for example, the government row and chamber insert succeed, but one politician block fails — leaves partial state in the database with no automatic rollback. The post-verification DO block at the end would then catch the inconsistency and `RAISE EXCEPTION`, but by that point the partial rows already exist and the next re-run attempt will be blocked by the pre-flight RAISE EXCEPTION (in 313) or silently proceed with the partial state (in 312 due to WR-01).

This is consistent with the pattern in the analog migrations (277, 254) which also lack transaction wrappers, so it reflects an established project constraint rather than a deviation. However, it means any failure requires manual cleanup before re-running.

**Fix:** Wrap each migration in `BEGIN`/`COMMIT`:
```sql
BEGIN;
-- ... all steps ...
COMMIT;
```
If this pattern is intentionally omitted project-wide (e.g., due to Supabase MCP execution constraints), add a comment documenting the known partial-failure recovery procedure.

---

### WR-03: `cursor` parameter in `process_member` is a dead parameter — removed code path not cleaned up

**File:** `C:/EV-Accounts/backend/scripts/_tmp-alexandria-headshots.py:360`

**Issue:** `process_member(cursor, member: dict)` accepts a `cursor` parameter (psycopg2 cursor), but the function body never uses it. The DB connection and cursor are opened in `main()` (lines 463-464) and passed into every `process_member` call (line 469), but since all DB writes were moved to migration 314, no DB operations remain in the script. The parameter is a dead remnant.

The dead parameter is misleading — a reader expects DB writes to happen in this function and may not notice they are missing from the pipeline.

**Fix:** Remove the `cursor` parameter from `process_member` and update the call site:
```python
# Function signature:
def process_member(member: dict) -> dict:

# Call site in main():
result = process_member(member)
```
Also remove the cursor/conn open/close block from `main()` since no DB operations remain in the script (lines 458-474 cursor/conn lines). The script is upload-only; the DB connection is unused entirely.

---

### WR-04: `.env` parser does not strip surrounding quotes from values — credentials with quoted values fail silently

**File:** `C:/EV-Accounts/backend/scripts/_tmp-alexandria-headshots.py:59-66`

**Issue:** The `.env` parser at lines 59-66 does:
```python
k, v = line.split('=', 1)
_env[k.strip()] = v.strip()
```
If a `.env` value is written with surrounding quotes (e.g., `SUPABASE_URL="https://abc.supabase.co"` or `SERVICE_KEY='eyJ...'`), the quotes are included in the value. The subsequent `requests` calls then use a URL like `"https://abc.supabase.co"` (with literal quotes) or an `Authorization: Bearer 'eyJ...'` header (with literal quotes), which will fail with cryptic HTTP errors rather than the clear validation message in `main()`.

**Fix:** Strip surrounding quotes after splitting:
```python
k, v = line.split('=', 1)
v = v.strip().strip('"').strip("'")
_env[k.strip()] = v
```

---

### WR-05: ACPS best-effort gate logs a warning but does not exit non-zero — partial ACPS failure is masked

**File:** `C:/EV-Accounts/backend/scripts/_tmp-alexandria-headshots.py:516-521`

**Issue:** When fewer than 6 of 9 ACPS headshots succeed, the script prints `"WARNING: Only N/9 ACPS headshots succeeded"` but does not call `sys.exit(1)` and continues to print `"All 7 Alexandria headshots uploaded successfully."` The exit code is 0 (success). If the ACPS threshold is a meaningful quality gate ("minimum 6 required by plan best-effort target"), a caller or CI script has no way to distinguish a fully successful run from a degraded run that missed the ACPS target.

**Fix:** Either exit with a non-zero code when the ACPS best-effort minimum is not met, or clearly document that ACPS failures are intentionally non-fatal. If non-fatal, remove the minimum threshold language to avoid implying a gate exists:
```python
# Option A: exit non-zero on ACPS shortfall
if len(acps_success) < 6:
    print(f'WARNING: ...')
    sys.exit(2)  # distinct from sys.exit(1) used for required failures

# Option B: remove the threshold check entirely and just report
print(f'ACPS: {len(acps_success)}/9 uploaded (best-effort).')
```

---

### WR-06: `photo_license = 'public_domain'` applied to Sandy Marks' alxnow.com news photo — likely incorrect

**File:** `C:/EV-Accounts/backend/migrations/314_alexandria_headshots.sql:120-127`

**Issue:** Sandy Marks' headshot is sourced from an alxnow.com news article (election night photo, April 2026). News photography from a commercial news outlet is copyrighted journalism, not public domain. All other 15 headshots in this migration use official government portraits (alexandriava.gov) or school district official photos (resources.finalsite.net), which can more plausibly be labeled `public_domain`. Storing an incorrect license value risks content-use liability if the platform relies on this metadata to determine usage rights.

The `photo_license` value for Marks should reflect the actual rights status rather than default-inheriting from the government photo batch.

**Fix:** Use a more accurate license value for the Marks row. Options depending on schema enumeration:
```sql
-- If schema supports 'unknown' or 'news_photo':
'unknown'   -- safest if usage rights are unclear

-- Or document the source with a comment and flag for follow-up:
-- TODO: Replace with official portrait once alexandriava.gov creates profile page for Sandy Marks
-- Source alxnow.com is commercial journalism; photo_license value should be verified
```
If `photo_license` only accepts `'public_domain'` as a valid value, add a `-- FIXME` comment and create a tracking ticket to replace with an official portrait when it becomes available.

---

### WR-07: Migration 314 post-verification does not check ACPS image count — silent missing rows undetected

**File:** `C:/EV-Accounts/backend/migrations/314_alexandria_headshots.sql:248-263`

**Issue:** The post-verification DO block only gates on the Alexandria city count (`v_expected_alex := 7`). ACPS image count (expected 9) is not checked at all — not even as a `RAISE NOTICE`. If any of the 9 ACPS `INSERT` statements produce 0 rows (e.g., due to the `WHERE NOT EXISTS` guard firing because `politician_id` is NULL from a failed subquery lookup), the migration would commit silently with fewer than 9 ACPS rows and the post-verification would pass.

**Fix:** Add an informational ACPS count check. Even a NOTICE is better than no check:
```sql
DECLARE
  v_alex_img_count INTEGER;
  v_acps_img_count INTEGER;
  v_expected_alex INTEGER := 7;
BEGIN
  -- ... existing Alexandria gate ...

  -- ACPS count (best-effort: NOTICE not EXCEPTION)
  SELECT COUNT(*) INTO v_acps_img_count
  FROM essentials.politician_images pi
  JOIN essentials.politicians p ON p.id = pi.politician_id
  WHERE p.external_id BETWEEN -5100090009 AND -5100090001
    AND pi.type = 'default';
  RAISE NOTICE 'ACPS image count: % of 9', v_acps_img_count;
  IF v_acps_img_count < 6 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected at least 6 ACPS headshots, found %', v_acps_img_count;
  END IF;
```

---

_Reviewed: 2026-06-08_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
