# 151-03 SUMMARY — El Monte headshots (migration 1002, audit-only)

**Status:** COMPLETE ✓ (applied live + committed to EV-Accounts) — pending the final human-verify checkpoint (folded into the Wave-4 stance checkpoint per operator choice to run Waves 3+4 back-to-back).
**Migration:** `1002_elmonte_headshots.sql` (AUDIT-ONLY, NOT registered — ledger stays 1001); EV-Accounts commit on master.
**Date:** 2026-06-21

## What was done
All 7 current members re-sourced from official `ci.el-monte.ca.us` portraits (NO-WAF direct curl, all HTTP 200), processed 4:5 crop FIRST (288×366 → 288×360) → 600×750 Lanczos q90, uploaded to Supabase Storage `politician_photos/{uuid}-headshot.jpg` (x-upsert, public GET 200), standardized to `type='default'` + `photo_license='press_use'` + `photo_origin_url` = documentId source.

- **Cortez (D6, -701001)** — greenfield INSERT (was 0 images), documentId 7435, UUID `aecc3037`.
- **6 pre-existing** re-cropped + UPDATEd from non-canonical `scraped_no_license` paths to canonical `{uuid}-headshot.jpg` press_use (matching the Pasadena 948 standardization):
  - Crippen-Thomas D1 (7431, `bb21e688`) · Herrera D2 (7432, `e39b0a67`) · Ruedas D3 (7433, `0738714b`) · Longoria D4 (7430, `18dbc5bc`) · Galvan D5 (7429, `f034f7ef`) · Ancona Mayor (7434, `c7f76380`).

## Visual verification (done by orchestrator)
Each of the 7 final crops viewed: clean single-person professional studio portrait, **no superimposed text/graphics over any face**, eyes ~1/3 from top, head+shoulders, correct 4:5 600×750, 7 distinct individuals consistent with the official El Monte council portrait set. (Cortez has only a faint photographer mark in the bottom corner — not over the face; acceptable.)

## No honest gaps
All 7 members have an obtainable official portrait — **0 gaps**. Source resolution was a uniform 288×366 official set (upscaled to 600×750, accepted per Pasadena/Layton low-res-official precedent).

## Verification (all green)
- Each of the 7 has exactly one `type='default'` row at canonical `{uuid}-headshot.jpg`, `press_use`, no member >1.
- Integer ledger MAX stays **1001** (1002 NOT registered — audit-only confirmed); file committed to EV-Accounts.

## Pending (final checkpoint — combined with Wave 4)
Human identity sign-off: confirm each face is the correctly-named member (esp. **D6 = Marisol Cortez as Councilmember, not a Mayor role**; Mayor = Ancona via documentId 7434).
