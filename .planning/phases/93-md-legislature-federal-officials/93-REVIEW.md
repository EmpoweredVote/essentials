---
phase: 93-md-legislature-federal-officials
reviewed: 2026-06-05T23:02:58Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - scripts/md_senators_headshots.py
  - scripts/md_delegates_headshots.py
findings:
  critical: 1
  warning: 4
  info: 1
  total: 6
status: issues_found
---

# Phase 93: Code Review Report

**Reviewed:** 2026-06-05T23:02:58Z
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Both scripts share identical logic (download → crop/resize → upload to Storage → insert DB row)
and both carry the same bugs. The critical finding is a data-corruption bug in the idempotency
layer: the pre-flight existence check and the actual INSERT guard use different SQL predicates,
which can result in a Storage object being written but no DB row being created, producing a silent
state divergence that Phase 94 coverage enforcement would not catch (it would see no DB row and
re-attempt, but the Storage object is already there). Four warnings cover connection hygiene,
a hardcoded magic number, and incomplete network error handling. One info item covers a cosmetic
count inconsistency.

---

## Critical Issues

### CR-01: Idempotency guard SQL predicate mismatch — storage uploaded, DB row skipped

**File:** `scripts/md_senators_headshots.py:551-588` and `scripts/md_delegates_headshots.py:1218-1255`

**Issue:**
`check_image_exists` filters on `type = 'default'`:
```sql
WHERE politician_id = %s::uuid AND type = 'default'
```
But `insert_politician_image`'s NOT EXISTS guard has no type filter:
```sql
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images WHERE politician_id = %s::uuid
)
```
These predicates are inconsistent. If a politician already has a row of any type other than
`'default'` (e.g. `'thumbnail'`, `'campaign'`), the pre-flight check returns `False` (no
default row → proceed), the Storage upload runs and the file is written/overwritten, then the
INSERT NOT EXISTS guard finds the existing non-default row and skips the INSERT entirely.
Result: Storage has a fresh `{politician_id}-headshot.jpg` file, but `politician_images` has
no `type='default'` row pointing to it. The politician profile will have no headshot visible,
and Phase 94 coverage enforcement will see 0 DB rows and flag the politician as missing — but
re-running the script will hit the same code path and repeat the upload-without-insert cycle
forever.

**Fix:** Make the NOT EXISTS predicate in `insert_politician_image` match the pre-flight check
by adding the `type = 'default'` filter:
```python
cur.execute(
    """
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(), %s::uuid, %s, 'default', 'public_domain'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = %s::uuid AND type = 'default'
)
""",
    (politician_id, url, politician_id)
)
```
Apply the identical fix to both scripts.

---

## Warnings

### WR-01: DB connection opened per politician — failure in `check_image_exists` leaks unclosed connection

**File:** `scripts/md_senators_headshots.py:551-564` and `scripts/md_delegates_headshots.py:1218-1231`

**Issue:**
`check_image_exists` opens a connection with `psycopg2.connect(db_url)` and wraps the close in
a `finally` block — but it does NOT use `with conn:` (the connection context manager) or
`conn.cursor()` as a context manager in a way that handles exceptions from `cursor()` itself.
If `conn.cursor()` raises (e.g. the connection is already in a broken state), the `with
conn.cursor()` block raises before the `try`, but `conn` was already opened. More specifically:
the code does `try: with conn.cursor() as cur: ... finally: conn.close()` — the `try` wraps the
`with conn.cursor()` block, so if `cur.execute` raises, `conn.close()` still runs correctly.
This path is actually safe.

However, the two-connections-per-politician pattern (`check_image_exists` + `insert_politician_image`
each open a fresh `psycopg2.connect`) means for 140 delegates, 280 TCP connection handshakes
are made sequentially against a remote Supabase Postgres. This is a correctness concern
when Supabase's connection pooler imposes per-session limits — if the pooler reaches its limit
mid-run, connections will start failing with an exception that is caught by the outer
`except Exception as e` block and the politician is logged as `failed`, producing a misleading
error (looks like an image failure, not a DB pool exhaustion).

**Fix:** Pass a single shared connection (or cursor) into both functions, created once in `main()`
and closed once after the loop:
```python
def main():
    ...
    db_url = get_db_url()
    conn = psycopg2.connect(db_url)
    try:
        for ext_id, pol_id, name, source_url in OFFICIALS:
            ...
            if check_image_exists(pol_id, conn):
                ...
            ...
            insert_politician_image(pol_id, storage_url, name, conn)
    finally:
        conn.close()
```
Update `check_image_exists` and `insert_politician_image` to accept a `conn` parameter instead
of `db_url`.

### WR-02: `insert_politician_image` opens connection outside the `with conn:` transaction guard

**File:** `scripts/md_senators_headshots.py:567-588` and `scripts/md_delegates_headshots.py:1234-1255`

**Issue:**
The function does:
```python
conn = psycopg2.connect(db_url)
try:
    with conn:          # <-- transaction context manager
        with conn.cursor() as cur:
            cur.execute(...)
finally:
    conn.close()
```
If `psycopg2.connect()` itself raises (e.g. DB unreachable at this exact moment — possible on a
long-running script where the DB becomes temporarily unavailable between the check and the
insert), the exception propagates out of `insert_politician_image` to the caller and is caught
by `except Exception as e` in `main()`. This means a DB-unreachable error during the INSERT step
is silently absorbed as a per-politician failure after the Storage upload has already succeeded.
The Storage object is orphaned with no DB row.

While the outer `except` is intentional (D-05 best-effort), the script provides no way to
distinguish "image download failed" from "DB write failed after successful upload". A failed
upload at this stage should ideally be retried or flagged distinctively so the operator knows
to re-run just that record.

**Fix:** Distinguish the failure mode by catching and re-raising DB errors with a clearer
message, or separate the DB-failure case in the summary output. At minimum, log the stage
at which the failure occurred:
```python
try:
    raw = download_image(source_url, name)
    jpeg = process_image(raw, name)
    local_path.write_bytes(jpeg)
    storage_url = upload_to_storage(pol_id, jpeg, name)
except Exception as e:
    print(f"  SKIP: download/process/upload error — {e}")
    failed.append((ext_id, name, f"upload: {e}"))
    continue

try:
    insert_politician_image(pol_id, storage_url, name, db_url)
except Exception as e:
    print(f"  ERROR: storage uploaded but DB insert failed — {e}")
    failed.append((ext_id, name, f"db_insert_after_upload: {e}"))
    continue
```
This makes the "uploaded but no DB row" failure mode visible in the summary.

### WR-03: `download_image` does not validate HTTP response Content-Type — silently processes HTML error pages

**File:** `scripts/md_senators_headshots.py:464-479` and `scripts/md_delegates_headshots.py:1131-1146`

**Issue:**
`urllib.request.urlopen` succeeds (HTTP 200) even when a CDN or web server returns an HTML error
page with a 200 status code (a "soft 404"). `Image.open(io.BytesIO(raw_bytes))` will raise
`PIL.UnidentifiedImageError` with a message like "cannot identify image file" — which is then
caught by the outer `except Exception as e` and treated as a per-politician skip. While D-05
allows this, the error message "SKIP: error — cannot identify image file <_io.BytesIO object...>"
gives no indication that the source URL returned HTML instead of an image, making triage harder.

**Fix:** Add a content-type check after download:
```python
with urllib.request.urlopen(req, timeout=45) as resp:
    content_type = resp.headers.get('Content-Type', '')
    if not content_type.startswith('image/'):
        raise RuntimeError(
            f"Expected image Content-Type, got '{content_type}' — "
            f"possible soft-404 or redirect to HTML error page"
        )
    data = resp.read()
```

### WR-04: `get_db_url` silently returns an empty string on `.env` parse failure — outer code gives misleading error

**File:** `scripts/md_senators_headshots.py:533-548` and `scripts/md_delegates_headshots.py:1200-1215`

**Issue:**
`get_db_url` reads `DATABASE_URL=` from the `.env` file but handles only `FileNotFoundError`.
If the file exists but the line is malformed (e.g. `DATABASE_URL =value` with a space before
`=`), the `startswith("DATABASE_URL=")` check never matches, the loop completes without
returning, and the function falls through to `os.environ.get("DATABASE_URL", "")`. If that
env var is also unset, `""` is returned. `main()` then prints:
```
ERROR: could not find DATABASE_URL in C:/EV-Accounts/backend/.env or environment
```
This message is accurate but the root cause (malformed line vs. missing file vs. missing env var)
is not surfaced. More importantly, if `psycopg2.connect("")` is somehow reached (e.g. if the
early `sys.exit(1)` guard is bypassed), it raises an unhelpful `OperationalError`.

**Fix:** Add explicit handling for the case where the file exists but the key is not found:
```python
def get_db_url() -> str:
    env_path = "C:/EV-Accounts/backend/.env"
    found = False
    try:
        with open(env_path) as f:
            for line in f:
                if line.startswith("DATABASE_URL="):
                    found = True
                    val = line.split("=", 1)[1].strip()
                    if len(val) >= 2 and val[0] == val[-1] and val[0] in ('"', "'"):
                        val = val[1:-1]
                    return val
        if not found:
            print(f"WARNING: {env_path} exists but contains no DATABASE_URL= line")
    except FileNotFoundError:
        pass
    return os.environ.get("DATABASE_URL", "")
```

---

## Info

### IN-01: Hardcoded magic number `47` in senators summary print statement

**File:** `scripts/md_senators_headshots.py:659`

**Issue:**
The summary line reads:
```python
print(f"OFFICIALS=47, processed={len(processed)}, ...")
```
The `47` is a literal integer rather than `len(OFFICIALS)`. If the OFFICIALS list is ever
amended (e.g. a mid-session appointment adds a senator), the printed count will be wrong while
the assertion on line 688 (`assert total == len(OFFICIALS)`) will still pass. The delegates
script correctly uses `len(OFFICIALS)` in the equivalent print statement (line 1326).

**Fix:**
```python
print(f"OFFICIALS={len(OFFICIALS)}, processed={len(processed)}, ...")
```

---

_Reviewed: 2026-06-05T23:02:58Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
