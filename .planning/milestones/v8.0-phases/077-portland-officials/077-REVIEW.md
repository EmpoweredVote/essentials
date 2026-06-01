---
phase: 077-portland-officials
reviewed: 2026-05-29T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - C:/EV-Accounts/backend/migrations/230_portland_government_structure.sql
  - C:/EV-Accounts/backend/migrations/231_portland_officials.sql
  - C:/EV-Accounts/backend/migrations/232_portland_headshots.sql
  - C:/EV-Accounts/backend/scripts/portland-headshots-process.py
findings:
  critical: 1
  warning: 2
  info: 2
  total: 5
status: issues_found
---

# Phase 077: Code Review Report

**Reviewed:** 2026-05-29
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Four files reviewed: three SQL migrations (government structure, officials seed, audit-only headshots) and one Python image-processing script. Migration 230 is structurally sound. Migration 232 (audit-only) is correctly marked and follows established precedent. The primary correctness bug is in migration 231: the two appointed officials have `is_appointed=false` on their `politicians` row despite being explicitly identified as appointed positions. The Python script has a silent distortion path and a latent `.env` quoting bug.

---

## Critical Issues

### CR-01: `is_appointed=false` on appointed officials' politician rows

**File:** `C:/EV-Accounts/backend/migrations/231_portland_officials.sql:115` and `:151`

**Issue:** Both Raymond C. Lee III (-690003) and Robert L. Taylor (-690004) are seeded with `is_appointed=false` in the `politicians` INSERT, even though:
- The migration header explicitly labels them as APPOINTED
- Their office rows correctly set `is_appointed_position=true`
- The comments state "is_appointed_position=true ONLY on -690003 (Lee III) and -690004 (Taylor)"

The `politicians.is_appointed` column tracks whether the person holds an appointed role. Setting it `false` for both appointed officials creates a data inconsistency between `politicians.is_appointed` (false) and `offices.is_appointed_position` (true). Any UI logic, query, or future migration that checks `politicians.is_appointed` to identify appointed officials will miss these two.

**Fix:** Change `is_appointed` from `false` to `true` in the VALUES clause for both blocks:

Block 3 (Lee III, line 115):
```sql
VALUES (gen_random_uuid(), 'Raymond C. Lee III', 'Raymond', 'Lee', NULL,
        true, true, false, true, -690003)
--            ^^^^
```

Block 4 (Taylor, line 151):
```sql
VALUES (gen_random_uuid(), 'Robert L. Taylor', 'Robert', 'Taylor', NULL,
        true, true, false, true, -690004)
--            ^^^^
```

If the migration has already been applied to the live DB, a corrective UPDATE is also needed:
```sql
UPDATE essentials.politicians
SET is_appointed = true
WHERE external_id IN (-690003, -690004);
```

---

## Warnings

### WR-01: Python script produces silently distorted image on worst-case fallback

**File:** `C:/EV-Accounts/backend/scripts/portland-headshots-process.py:225-232`

**Issue:** In the `else` branch of `process_image` (image is wider than 4:5), when `new_w > w` (cannot derive 4:5 from height alone), the code falls through to a final `else` that prints `"WARNING: Cannot get 4:5 cleanly"` and does **not** crop at all. The function then proceeds to `img.resize((600, 750), Image.LANCZOS)` on the original uncropped image, stretching it to 4:5 — a direct violation of the "never stretch or change aspect ratio" rule from `feedback_headshot_resize_no_distort.md`.

For the current Portland batch this path is not triggered (all source images are 320x320 squares which hit the width-crop path correctly). But any future reuse of this script against a non-square source would silently produce a distorted headshot.

**Fix:** Replace the silent fall-through with an exception that forces manual review:
```python
else:
    raise ValueError(
        f"Cannot crop {w}x{h} to 4:5 without stretching — "
        "provide a taller source image or adjust crop logic manually."
    )
```

### WR-02: `.env` parser does not strip surrounding quotes from values

**File:** `C:/EV-Accounts/backend/scripts/portland-headshots-process.py:26-29`

**Issue:** The hand-rolled `.env` parser splits on `=` and calls `v.strip()`, which removes whitespace but not surrounding quotation marks. If the `.env` file stores values as `SUPABASE_URL="https://..."` or `SUPABASE_SERVICE_ROLE_KEY='...'` (common in many `.env` editors and generators), `SERVICE_KEY` will contain literal `"` or `'` characters, causing the `Authorization: Bearer "..."` header to be malformed and all Supabase API calls to fail with 401.

**Fix:** Strip quotes after stripping whitespace:
```python
k, v = line.split('=', 1)
v = v.strip().strip('"').strip("'")
env[k.strip()] = v
```

---

## Info

### IN-01: `process_image` portrait-crop offset logic is opaque and untested for extreme ratios

**File:** `C:/EV-Accounts/backend/scripts/portland-headshots-process.py:205-214`

**Issue:** When the source image is already portrait or taller than 4:5, the crop applies a `top` offset based on the ratio (`0.05 * h` if ratio > 2.0, `0.02 * h` if ratio > 1.5). These magic numbers have no documented basis and no test. For the current Portland batch all sources are 320x320 (ratio == 1.0, square) so this branch is never reached — but the magic number approach is fragile for future use.

**Fix:** Document the rationale in a comment, or simplify by always using `top=0` (face-at-top assumption) given that `feedback_headshot_cropping.md` says "eyes at ~1/3 from top; full head + shoulders visible" — which is satisfied by taking from the top, not offsetting.

### IN-02: Zimmerman's `photo_origin_url` points to a generic filename that could collide

**File:** `C:/EV-Accounts/backend/migrations/232_portland_headshots.sql:271`

**Issue:** Eric Zimmerman's `photo_origin_url` is `https://www.portland.gov/sites/default/files/public/2025/Profile-Photo.png` — a completely generic filename. The file comment acknowledges this. If portland.gov ever reuses this filename for a different official, `photo_origin_url` will no longer trace back to Zimmerman's actual source image. The Supabase CDN URL remains authoritative, but the audit trail loses fidelity.

**Fix:** No code change required; the CDN URL is the ground truth. Consider adding a comment to the audit migration noting that the CMS filename is non-unique and the CDN copy is the reliable artifact. (Already partially documented in the inline comment.)

---

_Reviewed: 2026-05-29_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
