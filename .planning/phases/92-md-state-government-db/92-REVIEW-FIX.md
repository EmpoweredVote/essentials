---
phase: 92-md-state-government-db
fixed_at: 2026-06-05T00:00:00Z
review_path: .planning/phases/92-md-state-government-db/92-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 92: Code Review Fix Report

**Fixed at:** 2026-06-05
**Source review:** .planning/phases/92-md-state-government-db/92-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4
- Fixed: 4
- Skipped: 0

## Fixed Issues

### CR-01: SQL Injection via f-string Interpolation in `insert_politician_image` and `check_image_exists`

**Files modified:** `scripts/md_executives_headshots.py`
**Commit:** c705551
**Applied fix:** Rewrote both `check_image_exists` and `insert_politician_image` to use psycopg2
parameterized queries (`%s` placeholders) instead of f-string SQL interpolation passed to
`subprocess.run(["psql", ...])`. Removed `import subprocess` (no longer needed); added psycopg2
import with a clear error message if the package is missing. The new functions use
`psycopg2.connect(db_url)` with a `try/finally conn.close()` pattern; `insert_politician_image`
uses `with conn:` for automatic transaction commit/rollback. No behavior change for the happy
path — the parameterized INSERT...WHERE NOT EXISTS logic is preserved.

### WR-01: Conflicting Source Image Dimensions for Anthony G. Brown

**Files modified:** `scripts/md_executives_headshots.py`
**Commit:** c705551
**Applied fix:** Corrected the inline comment at line 99 (formerly 94) from
`"JPEG 512x512 square; center-crop to 4:5"` to `"JPEG 192x240 (already 4:5); no crop needed"`.
The actual source dimensions were confirmed from the SUMMARY.md headshot processing table
(line 204: "Anthony G. Brown | 192x240 | RGB | none (already 4:5)"), which matches the
migration 271 audit record. The Python comment was wrong; the migration audit was correct.

### WR-02: `get_db_url` Does Not Strip Surrounding Quotes from `.env` Values

**Files modified:** `scripts/md_executives_headshots.py`
**Commit:** c705551
**Applied fix:** Changed `return line.split("=", 1)[1].strip()` to capture the stripped value
into `val`, then strip surrounding single or double quotes if the value starts and ends with the
same quote character before returning. This handles the common convention of quoting `.env`
values (e.g. `DATABASE_URL="postgresql://..."`) without breaking unquoted values.

### WR-03: `check_image_exists` Returns `False` on psql Connection Failure

**Files modified:** `scripts/md_executives_headshots.py`
**Commit:** c705551
**Applied fix:** After CR-01 rewrote `check_image_exists` to use psycopg2, connection failures
now raise `psycopg2.OperationalError` (or similar psycopg2 exceptions) that propagate to the
`except Exception` handler in `main()`, recording an `ERROR` entry and preventing spurious
Storage uploads. The original silent `return False` path is gone. The fix is consistent with
the CR-01 rewrite — no separate psql-path fix was needed since psql is no longer used.

---

_Fixed: 2026-06-05_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
