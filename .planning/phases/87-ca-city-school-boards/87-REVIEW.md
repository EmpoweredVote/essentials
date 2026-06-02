---
phase: 87-ca-city-school-boards
reviewed: 2026-06-02T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - scripts/_tmp-ca-school-headshots.py
  - C:/EV-Accounts/backend/migrations/257_ca_city_school_boards.sql
  - C:/EV-Accounts/backend/migrations/258_ca_city_school_headshots.sql
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: issues_found
---

# Phase 87: Code Review Report

**Reviewed:** 2026-06-02
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Phase 87 seeds 6 CA city school districts (257) and documents 28/34 headshot uploads (258). The SQL
migration is structurally sound: all required invariants are correct (district_type='SCHOOL',
state case conventions, party=NULL, is_appointed=false, slug not in INSERT, WHERE NOT EXISTS
guards, robust post-verification). One critical security defect exists in the Python script
(hardcoded live service-role credential). Three warnings cover real correctness risks in image
processing and a subtle SQL silent-skip scenario.

---

## Critical Issues

### CR-01: Live Supabase service-role JWT hardcoded in tracked Python script

**File:** `scripts/_tmp-ca-school-headshots.py:29`
**Issue:** `SERVICE_KEY` is a live Supabase service role JWT stored in plaintext in a file committed
to git. Service role keys bypass all Row Level Security. Anyone with read access to the repository
(or git history) has full unrestricted read/write access to the production database. Even though
this is a `_tmp-*` script, it is tracked by git and the credential is now in history.

**Fix:** Rotate the service role key immediately in the Supabase dashboard (Dashboard > Settings >
API > Rotate service_role key). For future scripts, load the key from an environment variable:

```python
import os
SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
```

Then invoke as: `SUPABASE_SERVICE_KEY="eyJ..." python3 scripts/_tmp-ca-school-headshots.py`

The rotated key will invalidate the hardcoded value already in git history.

---

## Warnings

### WR-01: EXIF orientation not applied before crop — produces wrong-axis crop on rotated JPEGs

**File:** `scripts/_tmp-ca-school-headshots.py:147-155` (specifically `process_image` calling
`crop_and_resize`)
**Issue:** `Image.open()` in Pillow does not auto-apply EXIF orientation metadata. A JPEG taken in
portrait orientation but stored with landscape pixels + rotation tag will have `w > h` at read
time, causing the wrong crop branch to fire (`current_ratio > target_ratio`) — center-cropping
the width of what is actually a portrait image. The resulting 600x750 will be cropped and
distorted from the wrong axis. The SFUSD source images are from a Drupal CMS and are unlikely to
carry raw EXIF, but FUSD and BUSD WordPress uploads frequently originate from phone cameras.

**Fix:** Apply EXIF transpose before crop:

```python
from PIL import ImageOps

def process_image(raw_bytes: bytes, name: str) -> bytes:
    img = Image.open(io.BytesIO(raw_bytes))
    img = ImageOps.exif_transpose(img)   # <-- add this line
    orig_w, orig_h = img.size
    ...
```

`ImageOps.exif_transpose` is available in Pillow >= 6.0 and handles all EXIF rotation/flip tags.

---

### WR-02: `ON CONFLICT DO NOTHING RETURNING` CTE pattern silently skips office insert on conflict

**File:** `C:/EV-Accounts/backend/migrations/257_ca_city_school_boards.sql:295-324` (all 34
politician/office blocks)
**Issue:** When `ON CONFLICT (external_id) DO NOTHING` fires (politician already exists from a
prior partial run), the CTE `ins_p` returns zero rows. The subsequent `INSERT INTO offices ...
CROSS JOIN ins_p p WHERE p.id IS NOT NULL` then also inserts nothing — silently. The office-level
`WHERE NOT EXISTS` guard is never evaluated because there are no rows to insert. The post-verify
Gate (e) checks for exactly 34 offices and would catch this on re-run, but the failure mode
(transaction rollback with a confusing "expected 34 offices, found N" error rather than "politician
already exists") makes debugging difficult if the migration is ever partially reapplied after a
failed run.

**Fix:** No structural change needed for correctness given the post-verify gate catches it. To
make the failure mode clearer, add an explicit pre-flight check for existing offices in the
external_id range (analogous to the existing external_id pre-flight):

```sql
DO $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM essentials.offices o
  JOIN essentials.politicians p ON p.id = o.politician_id
  WHERE p.external_id BETWEEN -870034 AND -870001;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: % office rows already exist for -870034..-870001', v_count;
  END IF;
END $$;
```

This converts a silent-skip into an explicit early failure.

---

### WR-03: `photo_license = 'public_domain'` applied to screenshotted WordPress images

**File:** `scripts/_tmp-ca-school-headshots.py:193`
**File:** `C:/EV-Accounts/backend/migrations/258_ca_city_school_headshots.sql:401,452`
**Issue:** Mike Chang (-870030) and Jennifer Shanoski (-870034) source URLs are
`Screen-Shot-2022-12-15-at-9.09.01-AM.png` and `Screen-Shot-2022-12-15-at-9.16.22-AM.png` —
these are screenshot filenames, indicating the photos are not official district-produced images
but third-party photos uploaded to the district site. Labeling them `public_domain` may be
incorrect; they could be copyrighted portraits with an implicit license granted to the district
for display only. This creates IP risk.

**Fix:** Change `photo_license` to `'district_website'` (or whatever value is used for
"sourced from official website, license unclear") for the two Berkeley screenshot photos. If
`public_domain` is the only accepted value for display, add a comment flagging these two for
future license review.

---

## Info

### IN-01: `last_name` stores only surname for hyphenated and middle-initial names

**File:** `C:/EV-Accounts/backend/migrations/257_ca_city_school_boards.sql:764` (Jose M. Navarro)
and `:797` (April K. Ybarra)
**Issue:** `full_name` preserves middle initials ('Jose M. Navarro', 'April K. Ybarra') but
`last_name` is just 'Navarro' / 'Ybarra'. The middle initial is lost from any column used for
surname-based lookup. This is consistent with how the rest of the codebase handles middle
initials (first_name captures only the given name), but note the search normalization note in
project memory: name searches use `full_name`, so this is not a search correctness issue.
**No code change required; documenting for awareness.**

---

### IN-02: `_tmp-ca-school-headshots.py` writes processed files to an absolute Windows path

**File:** `scripts/_tmp-ca-school-headshots.py:32`
**Issue:** `TMP_DIR = Path("C:/Transparent Motivations/essentials/scripts/tmp_ca_school_headshots")`
is an absolute Windows path hardcoded in the script. The script cannot be run on any other
machine or path without editing this line. Since this is a `_tmp-*` one-shot script this is
low impact, but the hardcoded path is the reason it is flagged.

**Fix:** Use a relative path or `Path(__file__).parent / "tmp_ca_school_headshots"`:

```python
TMP_DIR = Path(__file__).parent / "tmp_ca_school_headshots"
```

---

_Reviewed: 2026-06-02_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
