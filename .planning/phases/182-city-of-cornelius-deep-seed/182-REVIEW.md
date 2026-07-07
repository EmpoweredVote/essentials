---
phase: 182-city-of-cornelius-deep-seed
reviewed: 2026-07-04T05:06:28Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - C:/EV-Accounts/backend/migrations/1196_cornelius_city_council.sql
  - C:/EV-Accounts/backend/migrations/1197_cornelius_headshots.sql
  - C:/EV-Accounts/backend/migrations/1198_dalin_stances.sql
  - C:/EV-Accounts/backend/migrations/1199_godinez_valencia_stances.sql
  - C:/EV-Accounts/backend/migrations/1200_baker_stances.sql
  - C:/EV-Accounts/backend/migrations/1201_lopez_stances.sql
  - C:/EV-Accounts/backend/scripts/_tmp-cornelius-headshots.py
  - C:/EV-Accounts/backend/scripts/_tmp-cornelius-wave0-probe.sql
  - src/lib/coverage.js
  - src/lib/buildingImages.js
findings:
  critical: 1
  warning: 4
  info: 4
  total: 9
status: issues_found_fixed
---

# Phase 182: Code Review Report

**Reviewed:** 2026-07-04T05:06:28Z
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

Reviewed the 6 Cornelius migrations (already applied clean to production), the two
gitignored `_tmp-*` helpers, and the two frontend surfacing one-liners. Per the phase
calibration, findings target latent template defects that would propagate when Phase 183+
clones these files.

The SQL migrations are sound: geo_id `4115550` is used consistently everywhere (the
`4115350`/Coquille trap value appears only in warnings/probes, never in data), the
strengthened geofence-name gate, pairwise identity gate, vacant-office gate,
appointed-seat gate, and the WR-01/WR-03/WR-04 stance-gate lineage are all correctly
constructed. UUIDs in 1198–1201 match the Storage URLs in 1197 exactly
(`856f7e70`↔Dalin, `f75a20a9`↔Godinez Valencia, `31df8939`↔Baker, `18d8515e`↔López).
Both accented-name files were byte-verified: UTF-8, no BOM, `é` correctly encoded.
`coverage.js` and `buildingImages.js` follow the post-WR-03 `{ state, src }` convention
with the correct geo_id; no collisions, no findings.

The defect concentration is in the NEW post-UAT circle-inscribed-crop branch of
`_tmp-cornelius-headshots.py` (`process_headshot_bytes`, lines 308–330) — the successor
template for Phase 183+. Verified numerically: for this phase's actual 1600x2000 sources
the branch produces a 996x1244 crop box (ratio 0.800643), not the "exact 4:5 integer
pair" its comment claims; and the circle-detection heuristic fires on any fully-opaque
square RGBA source, which is a realistic Phase 183+ input class (Phase 181 Sherwood's
sources were square).

## Critical Issues

### CR-01: Circle-cutout detection false-positives on fully-opaque square RGBA sources — silent destructive crop

**File:** `C:/EV-Accounts/backend/scripts/_tmp-cornelius-headshots.py:319`
**Issue:** `is_circle_cutout = abs(bw - bh) <= max(4, bw // 100)` classifies an image as
a circular cutout using ONLY the squareness of the alpha bounding box. A fully opaque
RGBA/LA image (alpha = 255 everywhere — common for PNG/WebP headshots saved with an
alpha channel) on a square canvas has a square `getbbox()` and triggers this branch,
which then center-crops to the circle-inscribed 4:5 rectangle (`w ≈ 0.625·bw`,
`h ≈ 0.78·bh`), discarding ~37% of the width and ~22% of the height of a photo that has
no circle in it — typically amputating forehead/chin. The result passes every downstream
check (MIN_DIM, crop, resize, upload, the 1197 url-embeds-uuid gate) and ships a
miscropped portrait to production with zero signal. All 4 Cornelius sources happen to be
genuine circular cutouts, so this phase was unaffected — but square opaque sources are a
proven input class in this exact template lineage (Phase 181 Sherwood: 7/7 square city-site
headshots), so a Phase 183+ clone hitting a square-with-alpha source silently corrupts
production images.
**Fix:** Require evidence of actual transparency in the circle's corner region before
taking the inscribed-crop branch:
```python
corners_transparent = all(
    alpha.getpixel(p) == 0
    for p in ((bbox[0], bbox[1]), (bbox[2]-1, bbox[1]),
              (bbox[0], bbox[3]-1), (bbox[2]-1, bbox[3]-1))
)
is_circle_cutout = corners_transparent and abs(bw - bh) <= max(4, bw // 100)
```
(A circle inscribed in its bbox is transparent at all four bbox corners; a fully opaque
square is transparent at none.)

**Status:** FIXED (2026-07-04, orchestrator --fix pass). Circle branch now requires BOTH a square alpha bbox AND transparent bbox corners (4 inset corner probes, alpha < 16) — fully-opaque square sources (Sherwood-class) route to the plain composite + crop_to_4_5 path. Compile-checked.

## Warnings

### WR-01: `alpha.getbbox()` can return None — unguarded subscript crashes with a cryptic TypeError

**File:** `C:/EV-Accounts/backend/scripts/_tmp-cornelius-headshots.py:317-318`
**Issue:** For a fully transparent source (alpha = 0 everywhere — e.g., a blank
placeholder PNG like the vacant-seat documentID=1975 class of asset), `getbbox()` returns
`None` and `bbox[2] - bbox[0]` raises `TypeError: 'NoneType' object is not subscriptable`.
It is caught by `process_member`'s try/except (FAILED + WR-01 exit-1 gate), so it fails
closed — but the manifest error line gives a Phase 183+ operator no clue the source was
a blank image rather than a code bug.
**Fix:**
```python
bbox = alpha.getbbox()
if bbox is None:
    raise Exception('source image is fully transparent (no opaque pixels) — blank/placeholder asset?')
```

**Status:** FIXED. `bbox is None` now raises ValueError('source image is fully transparent (blank) — refusing to process') before any subscript.

### WR-02: `w -= w % 4` does not deliver the promised "exact 4:5 integer pair" — odd h silently breaks the invariant

**File:** `C:/EV-Accounts/backend/scripts/_tmp-cornelius-headshots.py:326-329`
**Issue:** `h = w * 5 // 4` is odd whenever `w/4` is odd, and the crop box
`(cx - w//2, cy - h//2, cx + w//2, cy + h//2)` then has height `h - 1`, not `h`. This is
not hypothetical — it fires on this phase's real 1600x2000 sources: `r=800 → w=996 →
h=1245 (odd)` → actual box **996x1244**, ratio 0.800643. That drift (0.000643) squeaks
under `crop_to_4_5()`'s 0.001 early-return tolerance, so the box is resized to 600x750
with a small silent aspect distortion instead of being corrected; for smaller sources
(`w < ~640`) the drift exceeds the tolerance and triggers an unintended second crop pass.
Degenerate tiny circles also go negative (`r=1 → w=-4`), relying on downstream exceptions.
The comment `# keep exact 4:5 integer pair` documents an invariant the code does not hold,
which is exactly the kind of trusted-comment trap that propagates through template clones.
**Fix:**
```python
w -= w % 8            # w=8k -> h=10k (even); w//2 and h//2 both exact
h = w * 5 // 4
if w < MIN_DIM:
    raise Exception(f'circle cutout too small for inscribed 4:5 crop (w={w})')
```

**Status:** FIXED. `w -= w % 8` — w=8k gives h=10k: exact 4:5 integer pair, both even, no drift under crop_to_4_5's tolerance.

### WR-03: Plain `assert` used for the CDN-base guard and the 600x750 size invariant — contradicts the file's own `-O`-stripping rule

**File:** `C:/EV-Accounts/backend/scripts/_tmp-cornelius-headshots.py:179-181, 338`
**Issue:** Lines 148–149 correctly state that plain `assert` is stripped under
`-O`/`PYTHONOPTIMIZE` and that guards must be explicit `if: raise` — yet the module-level
SUPABASE_URL/CDN-base derivation guard (line 179) and the final
`assert img.size == TARGET_SIZE` (line 338) are plain asserts. Under `-O`, a malformed
`SUPABASE_URL` produces a silently wrong `CDN_BASE`, and the manifest URLs the
orchestrator cross-checks against migration 1197 diverge from the actual upload host —
the exact "silent host divergence" the guard exists to make impossible.
**Fix:** Convert both to explicit checks:
```python
if not (SUPABASE_URL.startswith('https://') and '.supabase.co' in SUPABASE_URL):
    raise ValueError(f'SUPABASE_URL missing or malformed: {SUPABASE_URL!r}')
...
if img.size != TARGET_SIZE:
    raise Exception(f'Expected {TARGET_SIZE}, got {img.size}')
```

**Status:** FIXED. Both plain asserts (CDN-base derivation, 600x750 size invariant) converted to explicit `if: raise ValueError` — survive -O/PYTHONOPTIMIZE.

### WR-04: 1197's post-verify gate is permanently satisfied by Cornelius rows — a stale-clone in Phase 183+ passes vacuously

**File:** `C:/EV-Accounts/backend/migrations/1197_cornelius_headshots.sql:94-98`
**Issue:** The gate counts rows `WHERE p.external_id BETWEEN -4115554 AND -4115551` and
requires exactly 4. Now that these 4 rows exist in production forever, a Phase 183+ clone
that updates the four INSERT blocks but forgets to update the gate's BETWEEN range will
count Cornelius's 4 existing rows, find `n = 4`, and PASS while verifying nothing about
the new city's inserts — the same silent-vacuous-pass failure class the WR-A/WR-B lineage
exists to close. (The stance files' identity gates don't share this shape: a stale UUID
there fails loudly on the external_id pairing.)
**Fix:** In the template, gate on the exact rows this file inserts rather than an
external_id range — e.g., assert each of the 4 (politician external_id, url) pairs
individually, or at minimum add a companion assertion that each INSERTed politician_id
subquery is non-NULL and its image row exists:
```sql
IF (SELECT COUNT(*) FROM (VALUES (-4115551),(-4115552),(-4115553),(-4115554)) v(ext)
    JOIN essentials.politicians p ON p.external_id = v.ext
    JOIN essentials.politician_images pi ON pi.politician_id = p.id
      AND pi.url LIKE '%' || p.id::text || '%') <> 4 THEN ...
```
so the checked ID list sits adjacent to the INSERTs and is copy-edited with them.

**Status:** FIXED (EV-Accounts commit 5be4ce99). Gate rewritten to derive its identity set from a VALUES list of the SAME uuids the INSERTs use (NOT EXISTS per-uuid check) with an explicit WHEN-CLONING note; a clone that edits INSERTs but not the gate now fails loudly. Re-applied against production: idempotent inserts held (INSERT 0 0 x4), new gate passes.

## Info

### IN-01: Pipeline header documentation not updated for the post-UAT circle-crop branch

**File:** `C:/EV-Accounts/backend/scripts/_tmp-cornelius-headshots.py:27-38, 61-64, 333`
**Issue:** The header still promises "composite onto white, then resize straight to
600x750" and calls the crop step "a NO-OP here" — but the post-UAT circle branch crops
every Cornelius source to ~996x1245 before resize. A Phase 183+ cloner reading the header
gets a wrong model of the pipeline. Relatedly, line 333 prints `Original size:` AFTER the
circle crop has already replaced `img`, logging the cropped size under a misleading label.
**Fix:** Update the PIPELINE NUANCE section and step list to describe the
circle-inscribed-crop branch; move the `Original size` print above the composite block or
relabel it `Working size`.

**Status:** FIXED. Header rewritten to describe the circle-inscribed-crop pipeline (and the corner-check guard); post-crop log relabeled 'Working size (post-composite/cutout-crop)'.

### IN-02: Descriptive User-Agent carries an apparent placeholder contact address

**File:** `C:/EV-Accounts/backend/scripts/_tmp-cornelius-headshots.py:192`
**Issue:** `contact alincoln@empowered.vote` — "alincoln" looks like a placeholder
(project contact is jmadison@empowered.vote). A dead contact defeats the purpose of a
descriptive UA (site operators cannot reach you before blocking).
**Fix:** Use a monitored address in the template.

**Status:** FIXED. UA contact corrected to jmadison@empowered.vote.

### IN-03: .env parser does not strip surrounding quotes from values

**File:** `C:/EV-Accounts/backend/scripts/_tmp-cornelius-headshots.py:161-168`
**Issue:** `v.strip()` keeps `"` / `'` wrappers; a quoted `SUPABASE_SERVICE_ROLE_KEY` or
`SUPABASE_URL` in .env would break the Bearer header / CDN-base assert. Fails loudly
today, but a one-line `v.strip().strip('\'"')` makes the template robust to the common
dotenv quoting convention.
**Fix:** `_env[k.strip()] = v.strip().strip('"\'')`

**Status:** NOT FIXED (accepted). Current .env has unquoted values; noted for the successor template.

### IN-04: Probe A3's "EXPECT exactly 1 row" expectation is only true while no other Cornelius-named place is TIGER-loaded

**File:** `C:/EV-Accounts/backend/scripts/_tmp-cornelius-wave0-probe.sql:28-31`
**Issue:** `name ILIKE '%cornelius%'` across all of `geofence_boundaries` expects exactly
1 row, but Cornelius, NC (geo_id 3714700) is a real G4110 incorporated place; the day NC
TIGER loads, this probe's stated expectation becomes wrong and a future operator may
misread a correct 2-row result as a failure. Template hygiene for Phase 183+ clones:
scope the name search by state prefix or phrase the expectation as "exactly 1 row per
loaded state".
**Fix:** `WHERE mtfcc = 'G4110' AND name ILIKE '%cornelius%' AND geo_id LIKE '41%'`

---

_Reviewed: 2026-07-04T05:06:28Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

**Status:** NOT FIXED (accepted). Probe already ran and passed; note stands for future TIGER loads (Cornelius, NC geo 3714700).
