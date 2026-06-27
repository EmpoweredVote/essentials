# Plan 171-02 Summary — Bloomington Exemplar Art + D-04 Cleanup (ASST-01)

**Status:** Tasks 1–3 complete & verified; Task 4 (human visual sign-off) awaiting approval.
**Requirements:** ASST-01

## What was built

The genuine remaining ASST-01 art gap — the Bloomington exemplar banner — sourced, treated,
uploaded to production Supabase Storage, and wired in; plus the confirmed-safe D-04 dead-code /
dead-asset cleanup and an address-parser regression guard.

### Task 1 — Source, treat, upload (live test of the Plan 01 toolchain)
- **Image:** `Bloomington_IN_Kirkwood.jpg` (Wikimedia Commons) — Kirkwood Avenue, the downtown
  spine running to IU's Sample Gates; city-as-subject per D-02. **CC BY-SA 3.0, author Yahala**,
  native 3004×1993 (no upscaling).
- Processed via `process_banner.py` → center-crop to 3.15:1 → **1700×540 JPEG q90** (222 KB).
- Uploaded via `upload_banner.py` to `politician_photos/cities/bloomington.jpg` (D-05 prefix).
- **Verified:** public URL returns `200 image/jpeg` (227,710 bytes).
- **Toolchain defect found & fixed:** `upload_banner.py` crashed on a U+2192 `→` under Windows'
  cp1252 console (`UnicodeEncodeError`) before the PUT ran. Replaced with `->` (ASCII-safe).
  This is exactly the "live test surfaces a real defect" value the plan anticipated.

### Task 2 — Rewire + attribution + D-04 cleanup
- `CURATED_LOCAL.bloomington` now points at the Storage `cities/bloomington.jpg` URL (was
  `/images/bloomington-city-hall.jpg`), with an inline `// bloomington - Title | Author | License`
  attribution comment.
- **Reachability re-confirmed before deleting:** all 50 `STATE_CAPITOLS` keys are covered by
  `STATE_PANORAMAS` (set-difference empty), and `FALLBACK_LOCAL`/`FALLBACK_STATE` had zero reads.
- Removed: the unreachable `else if (STATE_CAPITOLS[abbrev])` image branch (uncurated states now
  return `null` → SectionBanner gradient fallback), the two `FALLBACK_*` constants, and the dead
  local assets (`public/images/state-capitols/*.jpg` ×50, `bloomington-city-hall.jpg`,
  `city-hall-generic.svg`, `state-capitol-generic.svg`).
- **KEPT** the `STATE_CAPITOLS` object (load-bearing: feeds `STATE_NAME_TO_ABBREV` +
  `VALID_STATE_ABBREVS` used by the address parsers). Stale doc-comments refreshed.

### Task 3 — Address-parser regression guard
- New `src/lib/buildingImages.test.js` (vitest), 6/6 passing: Bloomington→Storage URL,
  null Local/State for unknown jurisdiction (criterion 4), unchanged CA panorama, and the three
  parser behaviors (IN abbrev, Bloomington city, SD full-name path).

## Verification
- `cities/bloomington.jpg` → HTTP 200 image/jpeg, 1700×540 q90. ✓
- buildingImages.js: 1 Bloomington Storage ref; 0 non-comment `FALLBACK_*`/`state-capitols` refs;
  `STATE_CAPITOLS` object retained (4 refs). ✓
- All 4 dead local assets deleted from disk. ✓
- Full suite: **59/59 pass**; production build: **succeeds**. ✓
- **Task 4 (pending):** human visual sign-off — Bloomington live (criterion 2), LA regression,
  gradient fallback (criterion 4).

## Commits
- `fix(171-02)`: upload_banner.py ASCII-safe (cp1252 crash fix)
- `feat(171-02)`: rewire Bloomington to Storage + D-04 cleanup
- `test(171-02)`: parser/fallback regression guard

## Deviations
- D-09 (AI generation dropped) honored — Bloomington is a real licensed photo. Intentional
  divergence from ASST-01's "AI fallback" text, not a gap.
- One toolchain fix to a Plan 01 file (`upload_banner.py`) discovered during the live test.

## Note for sign-off
The Storage image is live now, but the `buildingImages.js` rewire is committed and **not yet
deployed** — verify on a local dev server (`npm run dev`) or a preview build, or after deploying.
