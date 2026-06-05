---
phase: 92-md-state-government-db
reviewed: 2026-06-05T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - C:/EV-Accounts/backend/migrations/269_md_government_chambers.sql
  - C:/EV-Accounts/backend/migrations/270_md_state_executives.sql
  - C:/EV-Accounts/backend/migrations/271_md_executive_headshots.sql
  - scripts/md_executives_headshots.py
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: issues_found
---

# Phase 92: Code Review Report

**Reviewed:** 2026-06-05
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Four files were reviewed: three SQL migrations (chambers, officials, headshots) and a Python
headshot-processing script. The SQL migrations are structurally sound — idempotency guards are
correct, FK lookups use the approved name+state subquery pattern, `STATE_EXEC` state codes are
uppercase, and the `office_id` back-fill range covers all five officials. The image-processing
logic (crop-then-resize, top-crop for too-tall images, mode conversion before save) is correct
for every documented source image.

One critical finding: the Python script builds SQL via f-string interpolation and passes it
directly to psql. While the values are currently hardcoded, the pattern is structurally unsafe
and the `url` parameter specifically comes from a runtime-computed path rather than the
hardcoded OFFICIALS list. Three warnings cover: a documentation conflict between the Python
script and the migration audit about the AG source image dimensions; a `get_db_url` parser that
does not strip surrounding quotes from `.env` values; and a `check_image_exists` failure mode
that silently proceeds when psql is unreachable. Two info items cover minor code quality points.

---

## Critical Issues

### CR-01: SQL Injection via f-string Interpolation in `insert_politician_image` and `check_image_exists`

**File:** `scripts/md_executives_headshots.py:234` and `scripts/md_executives_headshots.py:250-259`

**Issue:** Both `check_image_exists` and `insert_politician_image` build SQL strings using Python
f-string interpolation and pass them to `psql -c`. The `url` parameter in `insert_politician_image`
is the return value of `upload_to_storage` (line 314), which constructs it at runtime from
`STORAGE_BASE` and `storage_path`. If a future refactor ever derives `storage_path` from external
input (e.g. a filename read from the filesystem or a server response body), a crafted value
containing a single-quote could escape the SQL literal and execute arbitrary statements against
the production database. The current execution path is safe because `storage_path` is
`f"{politician_id}-headshot.jpg"` with a hardcoded UUID, but the structural pattern is wrong.
The `politician_id` values are also hardcoded but are read from OFFICIALS, making the call-site
appear parameterized when it is not.

**Fix:** Use `psql --set` variables (bound substitution) or pass the SQL via a named pipe to
avoid embedding values in the SQL string. Minimal safe rewrite:

```python
def insert_politician_image(politician_id: str, url: str, name: str, db_url: str) -> None:
    sql = """
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       :pol_id::uuid,
       :img_url,
       'default', 'public_domain'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = :pol_id::uuid
);
"""
    # psql does not natively support bind parameters; use a temp file approach
    # or switch to psycopg2 which does:
    import psycopg2
    conn = psycopg2.connect(db_url)
    with conn, conn.cursor() as cur:
        cur.execute("""
            INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
            SELECT gen_random_uuid(), %s::uuid, %s, 'default', 'public_domain'
            WHERE NOT EXISTS (
              SELECT 1 FROM essentials.politician_images WHERE politician_id = %s::uuid
            )
        """, (politician_id, url, politician_id))
    conn.close()
```

---

## Warnings

### WR-01: Conflicting Source Image Dimensions for Anthony G. Brown Between Python Script and Migration Audit

**File:** `scripts/md_executives_headshots.py:94` vs `C:/EV-Accounts/backend/migrations/271_md_executive_headshots.sql:20`

**Issue:** The Python script comment at line 94 describes the AG source image as `"JPEG 512x512 square; center-crop to 4:5"`. The migration 271 audit header at line 20 records `"JPEG 192x240 (already 4:5) -> resize 600x750"`. These two descriptions are mutually exclusive — a 512x512 square is not 4:5, and would require a center-crop to ~410x512; a 192x240 image already has a 4:5 ratio and requires no crop. One of these dimension records is wrong.

The `crop_and_resize` logic correctly handles both cases at runtime (the code would produce a
correct 600x750 output regardless of which dimension is true), but the audit comment in migration
271 will be permanently wrong if the Python comment is correct. The migration audit is the
canonical historical record. If the actual download was 512x512, the migration audit line 20 is
inaccurate and should be corrected to `"JPEG 512x512 square -> crop 410x512 -> resize 600x750"`.

**Fix:** Verify the actual source dimensions from the tmp output directory or re-run
`identify scripts/tmp_md_exec_headshots/60329719-1d5b-4bb4-8295-38ea18f6f378-headshot.jpg`
and correct whichever comment is wrong. The migration 271 audit comment is the record that must
match what was actually applied.

---

### WR-02: `get_db_url` Does Not Strip Surrounding Quotes from `.env` Values

**File:** `scripts/md_executives_headshots.py:225`

**Issue:** The parser at line 225 does `line.split("=", 1)[1].strip()`. If the `.env` file
stores the value with surrounding double-quotes (a common convention):
```
DATABASE_URL="postgresql://user:pass@host:5432/db"
```
the returned string will be `'"postgresql://user:pass@host:5432/db"'` (including the
double-quotes). Passing this quoted string to `psql` as the connection argument will cause psql
to fail with `connection to server ... failed: could not connect to server`. The failure path
at line 283-285 does surface the error clearly (`sys.exit(1)`), but it could waste time
diagnosing what appears to be a connection error rather than a parsing issue.

**Fix:**
```python
val = line.split("=", 1)[1].strip()
# Strip surrounding quotes (single or double) if present
if len(val) >= 2 and val[0] == val[-1] and val[0] in ('"', "'"):
    val = val[1:-1]
return val
```

---

### WR-03: `check_image_exists` Returns `False` on psql Connection Failure, Allowing Spurious Uploads

**File:** `scripts/md_executives_headshots.py:239-244`

**Issue:** When psql returns a non-zero exit code (network outage, wrong db_url, auth failure),
`check_image_exists` returns `False` at line 244 (implicitly, via the `if result.returncode ==
0` branch not executing). The caller in `main()` (line 299) interprets `False` as "image does
not exist yet" and proceeds to download, process, and upload the headshot. This means a
transient DB connectivity failure will cause storage uploads to be attempted and may produce
orphaned files in Supabase Storage if `insert_politician_image` also fails. The `NOT EXISTS`
guard in the SQL prevents DB duplicates, but Storage already received an upload.

**Fix:** Raise an exception on psql failure so the outer `except Exception` in `main()` catches
it and records an `ERROR` entry rather than silently treating an unknown DB state as "safe to
proceed":

```python
def check_image_exists(politician_id: str, db_url: str) -> bool:
    sql = f"SELECT COUNT(*) FROM essentials.politician_images WHERE politician_id = '{politician_id}' AND type = 'default';"
    result = subprocess.run(
        ["psql", db_url, "-t", "-c", sql],
        capture_output=True, text=True, timeout=30
    )
    if result.returncode != 0:
        raise RuntimeError(f"psql check failed (rc={result.returncode}): {result.stderr.strip()}")
    count = result.stdout.strip()
    try:
        return int(count) > 0
    except ValueError:
        raise RuntimeError(f"psql returned non-integer count: {result.stdout!r}")
```

---

## Info

### IN-01: `process_image` Reports Dimensions from Already-Saved Image Object

**File:** `scripts/md_executives_headshots.py:176`

**Issue:** Line 176 prints `img.size[0]` and `img.size[1]` after `img.save(out, ...)`. The
`img` variable at this point is the resized PIL Image returned by `crop_and_resize`, which
has dimensions `(600, 750)` — hardcoded by the `img.resize((TARGET_W, TARGET_H), ...)` call.
So the print statement is redundant with the resize log already printed in `crop_and_resize`
at line 145. On some Pillow versions, calling `.size` on an image whose internal file pointer
has been closed by `save()` raises `DecompressionBombWarning` or a similar warning, though in
practice the `size` attribute is cached and the call is safe. The message is not wrong, just
redundant.

**Fix:** Replace with explicit constant values or remove the size portion:
```python
print(f"  Final JPEG: {TARGET_W}x{TARGET_H} ({len(data):,} bytes)")
```

---

### IN-02: Migration 270 Comments Reference "Migration 270" in Header but Script Is Named Phase 92-02

**File:** `C:/EV-Accounts/backend/migrations/270_md_state_executives.sql:6`

**Issue:** The docstring says `Migration 270 / Plan 01` in the header but the Python script
docstring at `scripts/md_executives_headshots.py:4` says `Phase 92-02 / Migration 270`. This
is harmless and accurate — 270 is Plan 01 of Phase 92 — but the migration comment does not
mention "Phase 92-02" consistently, which is a minor traceability gap if someone searches
migration comments by phase number.

**Fix:** Add `-- Phase 92-01` to the top of migration 270 (and 269) headers for consistency
with how other phases reference their plan numbers in migration comments.

---

_Reviewed: 2026-06-05_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
