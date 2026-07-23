---
phase: 93-md-legislature-federal-officials
plan: "05"
subsystem: database
tags:
  - maryland
  - senate
  - headshots
  - pillow
  - supabase-storage
dependency_graph:
  requires:
    - "Phase 93 Plan 02: 47 MD senators seeded (external_id -2410001..-2410047)"
    - "Supabase Storage bucket politician_photos (pre-existing)"
    - "Pillow + psycopg2 installed (pre-existing)"
  provides:
    - "scripts/md_senators_headshots.py — best-effort headshot ingestion for 47 MD senators"
    - "47 essentials.politician_images rows (type='default', photo_license='public_domain')"
    - "47 JPEG files in Supabase Storage at politician_photos/{politician_id}-headshot.jpg"
  affects:
    - "Phase 93 Plan 06 (delegate headshots): same script template, same bucket/path pattern"
    - "Phase 94 (MD Headshot gap-fill): 47 senators already covered; scope limited to delegates"
    - "Frontend politician profile pages: headshot now renders for all 47 MD senators"
tech_stack:
  added: []
  patterns:
    - "mgaleg.maryland.gov roster page as authoritative image URL source (HEAD probe insufficient — some senators have higher-numbered suffixes e.g. jackson04, watson04)"
    - "politician_photos bucket + {politician_id}-headshot.jpg path (project standard; plan spec 'politician-headshots' bucket does not exist)"
    - "Best-effort D-05 pattern: per-senator try/except, skip on failure, exit 0"
    - "MD headshot URL suffix disambiguation: compound last names use final word (lewisyoung→young04, fryhester→hester01)"
key_files:
  created:
    - "scripts/md_senators_headshots.py"
  modified: []
key_decisions:
  - "Used politician_photos bucket (not politician-headshots from plan spec) — only this bucket exists in production; all prior headshots use this bucket"
  - "Source URLs from authoritative mgaleg roster page (not just HEAD probing) — roster has higher-suffix versions e.g. jackson04, not jackson01"
  - "Compound last name URL disambiguation: Karen Lewis Young → young04.jpg; Katie Fry Hester → hester01.jpg"
  - "waldstreicher1.jpg (suffix '1' not '01') — exact filename per roster page"
requirements-completed: []
duration: 35min
completed: "2026-06-05"
---

# Phase 93 Plan 05: MD State Senators Headshots Summary

**47 Maryland state senators ingested at 600x750 (Lanczos q90) from mgaleg.maryland.gov official portraits into Supabase Storage; 47 politician_images rows inserted with public_domain license**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-06-05T21:53:00Z
- **Completed:** 2026-06-05T22:28:47Z
- **Tasks:** 3
- **Files modified:** 1 (scripts/md_senators_headshots.py created)

## Accomplishments

- Queried production DB for all 47 senator UUIDs (external_id -2410001..-2410047); confirmed 47 rows, 0 null UUIDs
- Probed mgaleg.maryland.gov headshot URLs for all 47 senators via HEAD probe + authoritative roster page scrape; all 47 URLs verified HTTP 200
- Created scripts/md_senators_headshots.py following md_executives_headshots.py template exactly; 47-entry OFFICIALS list; per-senator try/except; D-05 best-effort pattern
- Ran script: OFFICIALS=47, processed=47, skipped_no_url=0, skipped_exists=0, failed=0
- Re-ran for idempotency: OFFICIALS=47, processed=0, skipped_exists=47, no new rows inserted
- SQL verification: 47 rows in politician_images; 0 bad licenses; 0 bad URLs; 0 duplicates

## End-of-Run Summary

```
OFFICIALS=47, processed=47, skipped_no_url=0, skipped_exists=0, failed=0
Total accounted: 47
Done. 47 new uploads, 0 already existed, 0 no-URL skips, 0 failures.
```

**Idempotency re-run:** `Done. 0 new uploads, 47 already existed, 0 no-URL skips, 0 failures.`

## Task Commits

1. **Task 1: Resolve UUIDs + source URLs for all 47 senators** — discovery only, no file commit (embedded in Task 2)
2. **Task 2: Create scripts/md_senators_headshots.py** — `1bd01ac` (feat)
3. **Task 3: Run script and verify** — outputs to Supabase Storage + DB; no code commit (data-only task)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `scripts/md_senators_headshots.py` — 47-entry OFFICIALS list with verified mgaleg.maryland.gov URLs; best-effort D-05 per-senator try/except; 600x750 Lanczos crop+resize; politician_photos bucket upload; psycopg2 politician_images insert

## URL Disambiguation Patterns Discovered

Several senators required non-obvious URL patterns. The authoritative source is the mgaleg.maryland.gov roster page HTML (not probing predictable filenames):

| Senator | Last Name in DB | mgaleg Image URL | Disambiguation Reason |
|---------|----------------|-----------------|----------------------|
| Karen Lewis Young (SD-03) | Lewis Young | young04.jpg | Compound last name; mgaleg uses 'young' (final word); suffix 04 for uniqueness |
| Katie Fry Hester (SD-09) | Fry Hester | hester01.jpg | Compound last name; mgaleg uses 'hester' (final word) |
| Carl Jackson (SD-08) | Jackson | jackson04.jpg | Multiple Jacksons in the legislature; higher suffix than expected |
| Ron Watson (SD-23) | Watson | watson04.jpg | Multiple Watsons; suffix 04 not 01 |
| Kevin M. Harris (SD-27) | Harris | harris03.jpg | Multiple Harris entries; suffix 03 |
| Alonzo T. Washington (SD-22) | Washington | washington02.jpg | Disambiguates from Mary Washington (SD-43) |
| Mary Washington (SD-43) | Washington | washington01.jpg | Disambiguates from Alonzo Washington (SD-22) |
| Jeff Waldstreicher (SD-18) | Waldstreicher | waldstreicher1.jpg | Single-digit suffix '1' not '01' — unique pattern |

**Lesson:** HEAD probing with suffixes 01-03 is insufficient for finding correct URLs. Always fetch the roster page and extract `<img src>` attributes to get the definitive filenames.

## Senators with No Resolvable URL

**None** — all 47 senators successfully sourced. Phase 94 senator scope: 0 gaps.

## Storage Bucket Deviation

**[Rule 1 - Bug] Fixed bucket name from plan spec to actual project bucket**
- **Found during:** Task 2 (script creation)
- **Issue:** Plan 93-05 specified `BUCKET='politician-headshots'` and prefix `md-senators/` — but this bucket does not exist in production Supabase. Only `politician_photos` and `slice-photos` buckets exist. All prior headshots (OR, ME, MA, CA, MD executives) use `politician_photos/{politician_id}-headshot.jpg`.
- **Fix:** Used `BUCKET='politician_photos'` with `{politician_id}-headshot.jpg` storage path, matching the project-wide standard established by md_executives_headshots.py and all prior state headshot scripts.
- **Verification:** 47 rows inserted with URLs containing `politician_photos`; verified via SQL and browser access.
- **Committed in:** 1bd01ac (Task 2 commit)

Note: The verification SQL in the plan spec (`pi.url NOT LIKE '%politician-headshots/md-senators/%'`) cannot be applied as written because the `politician-headshots` bucket doesn't exist. The equivalent verification is `pi.url LIKE '%politician_photos%'` — all 47 rows pass this check (bad_url_count=0).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected storage bucket from plan-specified 'politician-headshots' to actual 'politician_photos'**
- **Found during:** Task 2 (script creation)
- **Issue:** Plan spec: BUCKET='politician-headshots', storage prefix 'md-senators/', path 'politician-headshots/md-senators/{politician_id}.jpg'. Production reality: only 'politician_photos' bucket exists; all prior headshots use 'politician_photos/{politician_id}-headshot.jpg'.
- **Fix:** Script uses politician_photos bucket + {politician_id}-headshot.jpg path, matching every other headshot in the project (md_executives, or_senators, me_senators, ca_senate, etc.)
- **Files modified:** scripts/md_senators_headshots.py (path constants)
- **Verification:** 47 DB rows have URL containing 'politician_photos'; storage files accessible via public URL
- **Committed in:** 1bd01ac

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug: wrong bucket name in plan spec)
**Impact on plan:** Fix essential — using a non-existent bucket would cause 100% upload failure. No scope creep.

## Verification SQL Results

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| senator_image_count | ≥1 (best-effort floor) | 47 | YES |
| bad_license_count (not 'public_domain') | 0 | 0 | YES |
| bad_url_count (URL not containing 'politician_photos') | 0 | 0 | YES |
| duplicate type='default' rows per senator | 0 | 0 | YES |
| idempotent re-run new rows | 0 | 0 | YES |

## Next Phase Readiness

- All 47 MD senator headshots ingested; Phase 94 senator scope is 0 gaps
- Plan 93-06 (delegate headshots) can follow the same script template
- Frontend senator profile pages will now render headshots for all 47 MD senators

## Self-Check: PASSED

- File `scripts/md_senators_headshots.py` exists — FOUND
- `python -m py_compile` exits 0 — CONFIRMED
- OFFICIALS list has 47 entries — CONFIRMED (regex count=47)
- All structural checks passed (bucket, TMP_DIR, type, Lanczos, mgaleg URL, no md-executives) — ALL OK
- Script ran exit 0, processed=47 — CONFIRMED
- SQL: senator_image_count=47, bad_license=0, bad_url=0, duplicates=0 — ALL PASS
- Idempotency re-run: 0 new uploads — CONFIRMED

---
*Phase: 93-md-legislature-federal-officials*
*Completed: 2026-06-05*
