---
phase: 146-palmdale-deep-seed
plan: 03
wave: 3
status: complete
requirements: [PLMD-01]
migration: C:/EV-Accounts/backend/migrations/920_palmdale_headshots.sql (AUDIT-ONLY, not registered)
---

# Phase 146 Wave 3 — Palmdale Headshots — SUMMARY

**Outcome:** Every current Palmdale member now has exactly one `type='default'` image; the lone gap (Laura Bettencourt) is filled with a clean official 600×750 portrait.

## What was done

1. **Pre-flight image-coverage query** (live DB) confirmed Bettencourt (`-700657`) was the only image gap among the 5 current members — matching RESEARCH/CONTEXT. The other 4 already had a `type='default'` image.
2. **Bettencourt portrait sourced + processed:**
   - Downloaded from `cityofpalmdaleca.gov/ImageRepository/Document?documentID=13184` via `curl` + Chrome UA — **HTTP 200, no WAF** (216×288 PNG, clean professional portrait, US-flag background, no superimposed text/graphics over the face; only a faint photographer credit in the bottom corner).
   - **Visually verified correct person** (Laura Bettencourt) before processing.
   - Cropped to **4:5 FIRST** (216×270, top-biased to keep eyes ~1/3 from top and trim toward the corner credit — never stretched), then resized to **600×750 Lanczos q90 JPEG** (Pillow 12.1.1).
   - Uploaded to Supabase Storage `politician_photos/362f1ec5-20aa-4e7a-a00d-7f626ae70138-headshot.jpg` (the canonical `{uuid}-headshot.jpg` convention the other 4 rows use — **resolves the planner-flagged path discrepancy in favor of project memory**, NOT `{uuid}/default.jpeg`). Public URL returns **HTTP 200** (69,083 bytes, image/jpeg).
3. **Migration 920 (audit-only)** authored + applied via MCP:
   - INSERT `politician_images` for Bettencourt (`type='default'`, `photo_license='press_use'`), guarded `NOT EXISTS`.
   - UPDATE `politicians.photo_origin_url` = documentID=13184 page for Bettencourt.
   - **DELETE Ohlsen's stale old-path scraped duplicate** (`la_county/cities/palmdale/eric-ohlsen.jpg`) by exact URL — he had TWO `type='default'` rows; the canonical `press_use` row is kept. Required so every member has exactly one image.
4. **Full-roster coverage audit:** all 5 members = exactly 1 `type='default'` image. **schema_migrations MAX unchanged (919)** — 920 confirmed audit-only.

## Decisions / deviations

- **Ohlsen duplicate cleanup** was treated as required (not merely optional) because the coverage acceptance criterion is "exactly one `type='default'` per member" — Ohlsen had two.
- **Bishop & Loa left as-is** (existing functional images, `scraped_no_license`): the optional license/path upgrades (Bishop documentID=15391) were skipped to avoid needless re-sourcing of working images per the plan's "do NOT needlessly re-source" guidance. Their single-image coverage passes. Candidate for a future cosmetic license upgrade, not a gap.
- **No fabricated photos.** Bettencourt's portrait is the genuine official city portrait.

## Image coverage (final)

| Member | ext_id | type='default' | license | notes |
|--------|--------|----------------|---------|-------|
| Austin Bishop | -201331 | 1 | scraped_no_license | existing old-path, functional (left as-is) |
| Richard J. Loa | 692504 | 1 | scraped_no_license | existing canonical (left as-is) |
| Laura Bettencourt | -700657 | 1 | press_use | **NEW** — documentID=13184, 600×750 |
| Eric Ohlsen | 692516 | 1 | press_use | canonical kept; old-path duplicate removed |
| Andrea Alarcón | 692518 | 1 | press_use | existing canonical (left as-is) |

## Self-Check: PASSED
- Bettencourt 600×750 4:5, correct person, no overlay, uploaded (HTTP 200), single press_use row ✓
- All 5 members exactly one `type='default'` image ✓
- Ledger unchanged (919); migration 920 audit-only ✓
- No git operations in C:/EV-Accounts ✓

**Awaiting blocking human-verify checkpoint (Task 3) before phase close.**
