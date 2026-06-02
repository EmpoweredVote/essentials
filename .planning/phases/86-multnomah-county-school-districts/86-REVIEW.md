---
phase: 86-multnomah-county-school-districts
reviewed: 2026-06-01T00:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - C:/EV-Accounts/backend/scripts/_tmp-or-school-headshots.py
  - C:/EV-Accounts/backend/migrations/255_or_school_headshots.sql
findings:
  critical: 2
  warning: 4
  info: 2
  total: 8
status: issues_found
---

# Phase 86: Code Review Report

**Reviewed:** 2026-06-01
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Two files reviewed: the headshot processing script (`_tmp-or-school-headshots.py`) and the audit-only migration (`255_or_school_headshots.sql`). The SQL migration is structurally sound — the `RAISE EXCEPTION` guard at the top reliably prevents accidental application, and the 38 INSERT patterns follow established project conventions.

The Python script has two critical issues: SSL verification is globally disabled (not scoped to the one domain that needs it), and two Centennial source URLs contain unencoded literal spaces that will cause `requests` to raise a `MissingSchema` or `InvalidURL` exception, blocking those two members from uploading. Four warnings cover a dead function, a storage-before-DB sequencing risk that can leave orphaned storage objects, a misleading log line, and the implicit-rollback-on-close pattern.

The script has already run (the migration audit records 38/38 success), but the URL-with-spaces finding warrants verification because requests behavior with space-containing URLs is version-dependent — some versions raise, others silently percent-encode. If the two Centennial members (-860033 Will Mohring and -860036 Michael Newman) have valid DB rows and CDN images, the script happened to survive. If not, they are silently missing.

## Critical Issues

### CR-01: SSL Verification Globally Disabled — All Hosts Accept Invalid Certificates

**File:** `C:/EV-Accounts/backend/scripts/_tmp-or-school-headshots.py:465`
**Issue:** `verify=False` is passed to every `requests.get()` call via `download_image()`, which is used for all 38 members across 6 domains. The comment says this is for `ddouglas.k12.or.us`, but it applies universally. Any MITM between the script and ppsnet.finalsite.com, parkrose.com, resources.finalsite.net, etc. can serve an arbitrary image that gets uploaded as a headshot. This is a data integrity vulnerability — wrong images get permanently stored in Supabase Storage for the wrong politicians.
**Fix:** Scope `verify=False` only to the David Douglas URLs, or use a per-domain flag:

```python
def download_image(url: str, verify_ssl: bool = True) -> bytes:
    resp = requests.get(
        url,
        headers=BROWSER_HEADERS,
        timeout=30,
        allow_redirects=True,
        verify=verify_ssl,
    )
    ...

# In process_member:
needs_no_verify = 'ddouglas.k12.or.us' in source_url
raw_bytes = download_image(source_url, verify_ssl=not needs_no_verify)
```

---

### CR-02: Two Centennial Source URLs Contain Unencoded Literal Spaces

**File:** `C:/EV-Accounts/backend/scripts/_tmp-or-school-headshots.py:281,307`
**Issue:** Two ROSTER entries have `source_url` values with raw spaces in the filename portion:
- `-860033` Will Mohring: `...3490/Will Mohring P6 At-Large (1)_1752530741.png`
- `-860036` Michael Newman: `...3490/Michael Newman P6 At-Large (1)_1752531598.png`

RFC 3986 prohibits unencoded spaces in URLs. The `requests` library behavior on space-containing URLs is version-dependent: older versions raise `InvalidURL`, newer versions percent-encode silently. The audit migration claims 38/38 success, but if these two members' DB rows are missing, that claim is wrong. The parentheses `(1)` are also technically invalid in a URL path without encoding.
**Fix:** Percent-encode the filenames at definition time:

```python
# -860033 Will Mohring
'source_url': 'https://files.smartsites.parentsquare.com/3490/Will%20Mohring%20P6%20At-Large%20%281%29_1752530741.png',

# -860036 Michael Newman
'source_url': 'https://files.smartsites.parentsquare.com/3490/Michael%20Newman%20P6%20At-Large%20%281%29_1752531598.png',
```

Or verify post-run that both `-860033` and `-860036` have valid `politician_images` rows and accessible CDN images.

---

## Warnings

### WR-01: Storage Upload Succeeds Before DB Insert — Orphaned Storage Objects Possible

**File:** `C:/EV-Accounts/backend/scripts/_tmp-or-school-headshots.py:598-601`
**Issue:** In `process_member`, the image is uploaded to Supabase Storage (step 7, line 598) before the DB row is inserted (step 8, line 601). If the `insert_politician_images_row` call raises (e.g., network error, constraint violation), the image is permanently stored in the `politician_photos` bucket with no corresponding `politician_images` row. The member is reported as failed and the script exits 1, but the storage object is already live — a subsequent re-run will re-upload (upsert) and then succeed on the DB insert, leaving the storage object count one ahead of the DB. More importantly, the first failed run leaves a dangling public URL in storage pointing to the correct image, which is not accessible via the UI (no DB row) but is publicly readable.

This is lower severity for a one-shot script, but is worth noting for future reuse.
**Fix:** Insert the DB row first (inside a transaction), then upload to storage only on DB success. Alternatively, wrap both operations in a try block that attempts storage deletion on DB failure:

```python
# Upload storage
cdn_url = upload_to_storage(politician_uuid, jpeg_bytes)
try:
    inserted = insert_politician_images_row(cursor, politician_uuid, cdn_url)
    conn.commit()
except Exception as db_err:
    # Attempt to clean up orphaned storage object
    conn.rollback()
    delete_from_storage(politician_uuid)  # add this helper
    raise db_err
```

---

### WR-02: `fetch_politician_id` Is Defined but Never Called (Dead Code)

**File:** `C:/EV-Accounts/backend/scripts/_tmp-or-school-headshots.py:445-454`
**Issue:** `fetch_politician_id(cursor, external_id)` is a fully implemented function that queries `essentials.politicians WHERE external_id = %s` and validates the returned UUID against a live DB query. However, `process_member` never calls it — it uses `member['politician_id']` (the hardcoded UUID from the ROSTER dict) directly. This means:
1. The UUIDs in the ROSTER dict are never cross-validated against the DB at runtime.
2. A stale or mis-typed UUID in the ROSTER would silently write a `politician_images` row pointing to a non-existent (or wrong) politician.

The guard in `insert_politician_images_row` would still succeed if the UUID doesn't match any politician (no FK constraint enforcement check is visible), potentially leaving orphaned image rows.
**Fix:** Call `fetch_politician_id` to verify the UUID at the start of `process_member`:

```python
# Verify UUID matches DB
db_uuid = fetch_politician_id(cursor, external_id)
if db_uuid != politician_uuid:
    raise ValueError(
        f'UUID mismatch for external_id={external_id}: '
        f'roster={politician_uuid}, db={db_uuid}'
    )
```

---

### WR-03: Mode Logged After RGB Conversion — Log Is Always Misleading

**File:** `C:/EV-Accounts/backend/scripts/_tmp-or-school-headshots.py:578-580`
**Issue:** The `print` on line 580 logs `mode={img.mode}` after the image has already been converted to `'RGB'` on line 578-579. The log will always print `mode=RGB` regardless of the original image mode, hiding whether a PNG with alpha channel or palette mode was actually processed. This makes the logs useless for post-run diagnosis of unexpected color conversions.
**Fix:** Log the original mode before conversion:

```python
img = Image.open(io.BytesIO(raw_bytes))
original_mode = img.mode
if img.mode != 'RGB':
    img = img.convert('RGB')
print(f'  Original size: {img.width}x{img.height} mode={original_mode}')
```

---

### WR-04: `NOT EXISTS` Guard in Python Checks Only for Any Row — Won't Update a Wrong URL

**File:** `C:/EV-Accounts/backend/scripts/_tmp-or-school-headshots.py:539-550`
**Issue:** `insert_politician_images_row` skips the INSERT if any `politician_images` row for that `politician_id` already exists, regardless of whether the existing row has the correct CDN URL or `type='default'`. This means:
- If a politician previously had a `type='headshot'` or wrong-URL row inserted (e.g., from an earlier phase or a failed partial run), the new correct row is silently skipped.
- The function returns `False` and prints "Row already existed (skipped insert)" without inspecting whether the existing row is actually correct.
- The `cdn_url` in the result dict will contain the freshly uploaded storage URL, but the DB will still point to whatever was there before.

**Fix:** At minimum, log a warning when the skip occurs with the existing row's URL so discrepancies are detectable. Optionally add an UPDATE path:

```python
cursor.execute(
    'SELECT url, type FROM essentials.politician_images WHERE politician_id = %s::uuid LIMIT 1',
    (politician_uuid,)
)
existing = cursor.fetchone()
if existing:
    existing_url, existing_type = existing
    if existing_url != url or existing_type != 'default':
        print(f'  WARNING: Existing row has url={existing_url}, type={existing_type} — mismatch, skipping insert')
    return False
```

---

## Info

### IN-01: `urllib3.disable_warnings` Called at Module Level in `__main__` Block Only

**File:** `C:/EV-Accounts/backend/scripts/_tmp-or-school-headshots.py:712-713`
**Issue:** `urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)` is called in the `if __name__ == '__main__'` guard. If `download_image` were ever imported and called from another module, SSL warnings would not be suppressed but `verify=False` would still be in effect — a confusing inconsistency. Minor for a `_tmp` script but worth noting.
**Fix:** Either move the warning suppression into `download_image` where `verify=False` is used, or leave as-is since this is a single-use `_tmp` script.

---

### IN-02: Hardcoded CDN Base URL Will Break if Storage Project Changes

**File:** `C:/EV-Accounts/backend/scripts/_tmp-or-school-headshots.py:47`
**Issue:** `CDN_BASE` hardcodes the Supabase project ID `kxsdzaojfaibhuzmclfq` inline. The `SUPABASE_URL` env var is already loaded from `.env` (which presumably contains the same project ID), so CDN_BASE could be derived from it. If the project is ever migrated or the URL format changes, this constant silently diverges from reality while the DB rows and `.env` get updated.
**Fix:** Derive from `SUPABASE_URL`:

```python
CDN_BASE = f'{SUPABASE_URL}/storage/v1/object/public/{BUCKET}'
```

---

_Reviewed: 2026-06-01_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
