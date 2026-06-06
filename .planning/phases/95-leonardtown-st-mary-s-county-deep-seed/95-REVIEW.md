---
phase: 95-leonardtown-st-mary-s-county-deep-seed
reviewed: 2026-06-06T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - scripts/md_local_headshots.py
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 95: Code Review Report

**Reviewed:** 2026-06-06
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

Reviewed `scripts/md_local_headshots.py`, the headshot download/process/upload pipeline for
11 MD local officials (St. Mary's County + Leonardtown). The script follows the established
project pattern from `md_executives_headshots.py` closely and is structurally sound: idempotency
guard, DB-resolved UUIDs, crop-before-resize, upsert storage, parameterized SQL.

No critical (data-loss or security) issues found. Two warnings address a partial-state gap and
a misleading error classification that could cause silent data inconsistency on re-run. Two info
items cover minor code quality points.

---

## Warnings

### WR-01: Storage upload succeeds but DB insert fails — partial state silently recovers incorrectly on re-run

**File:** `scripts/md_local_headshots.py:353-368`

**Issue:** The idempotency check (`check_image_exists`) queries only `politician_images` (the DB).
If `upload_to_storage` (line 367) succeeds but `insert_politician_image` (line 368) throws, the
image exists in Supabase Storage but has no DB row. On re-run, `check_image_exists` returns
`False` (no DB row), so the script re-downloads, re-processes, and re-uploads the image — the
storage upsert overwrites the previous upload with a freshly processed copy. This is functionally
safe because storage is an upsert, but it means a partial-state run silently re-does work that
was partly completed instead of detecting the inconsistency. More importantly, if the DB insert
keeps failing (e.g. schema mismatch, constraint violation) the script will loop forever across
re-runs, always re-uploading to storage and always failing the insert, with no accumulated error
state to diagnose from.

**Fix:** After the storage upload, if `insert_politician_image` raises, append `"ERROR"` to
`results` as already done, but also log the storage path that was written so the operator can
manually reconcile or the script can check storage existence separately. Alternatively, verify
the DB insert succeeds before writing the summary as "partial run" rather than masked by the
existing error path. At minimum, add a comment noting this failure mode so future maintainers
do not assume re-runs are fully clean.

```python
# After line 367, make failure state explicit:
try:
    storage_url = upload_to_storage(pol_id, jpeg, name)
except Exception as upload_err:
    print(f"  ERROR (storage): {upload_err}")
    results.append((ext_id, name, f"ERROR: storage upload failed: {upload_err}"))
    print()
    continue

try:
    insert_politician_image(pol_id, storage_url, name, db_url)
except Exception as db_err:
    print(f"  ERROR (DB insert after successful upload): {db_err}")
    print(f"  Storage file written: {pol_id}-headshot.jpg  <-- manual reconciliation needed")
    results.append((ext_id, name, f"ERROR: DB insert failed (storage written): {db_err}"))
    print()
    continue

results.append((ext_id, name, "OK", storage_url))
```

---

### WR-02: `urllib.error.URLError` not caught in `upload_to_storage` — network timeouts produce ambiguous error messages

**File:** `scripts/md_local_headshots.py:239-243`

**Issue:** `upload_to_storage` catches only `urllib.error.HTTPError` (an HTTP-level error with a
status code). A network-level failure — timeout, DNS failure, connection refused — raises
`urllib.error.URLError` instead, which is not caught here. The raw `URLError` propagates to the
outer `except Exception` in `main()` at line 371 and is printed as `ERROR: <urlopen error
timed out>` with no indication that this was a storage upload (not a download). An operator
reading the log cannot tell whether the image was successfully processed but failed to upload,
or whether the error occurred earlier. After a timeout the Supabase Storage server may or may
not have received the full payload, leaving state ambiguous.

**Fix:** Catch `urllib.error.URLError` alongside `HTTPError` and re-raise as a RuntimeError
with a clear label:

```python
try:
    with urllib.request.urlopen(req, timeout=60) as resp:
        resp.read()
except urllib.error.HTTPError as e:
    body = e.read().decode()
    raise RuntimeError(f"Storage upload HTTP {e.code} for {name}: {body}")
except urllib.error.URLError as e:
    raise RuntimeError(f"Storage upload network error for {name}: {e.reason}")
```

---

## Info

### IN-01: `process_image` log line reports constant dimensions — redundant after resize

**File:** `scripts/md_local_headshots.py:215`

**Issue:** Line 215 logs `Final JPEG: {img.size[0]}x{img.size[1]}`. Because `crop_and_resize`
always returns an image resized to exactly `TARGET_W x TARGET_H` (600x750), this log line will
always print `Final JPEG: 600x750`. The byte count is useful but the dimensions add no diagnostic
value. If `TARGET_W`/`TARGET_H` constants are ever changed, the log still always confirms the
new target rather than detecting any unexpected resize failure.

**Fix:** Either remove the dimensions from the log or add an assertion before logging:

```python
assert img.size == (TARGET_W, TARGET_H), f"Unexpected resize result: {img.size}"
print(f"  Final JPEG: {img.size[0]}x{img.size[1]} ({len(data):,} bytes)")
```

---

### IN-02: Each official opens two separate DB connections — `check_image_exists` then `insert_politician_image`

**File:** `scripts/md_local_headshots.py:277-312`

**Issue:** For each official, `check_image_exists` opens and closes a connection (lines 277-288),
and then `insert_politician_image` opens and closes a second connection (lines 293-312). Over 11
officials this creates up to 22 short-lived connections in addition to the 1 used by
`resolve_politician_uuids`. Supabase's connection pooler handles this gracefully for a script
this small, but the pattern is inconsistent with `resolve_politician_uuids` which reuses a single
connection. The check-then-insert is also a TOCTOU pattern — two simultaneous script instances
could both pass `check_image_exists` and both attempt the insert (the `WHERE NOT EXISTS` in the
SQL makes this safe from duplicate rows, but both would upload to storage).

**Fix:** Pass a single open connection through the processing loop rather than opening a new
connection per function call. This is a low-priority refactor for a one-shot migration script,
but worth noting for future script patterns.

---

_Reviewed: 2026-06-06_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
