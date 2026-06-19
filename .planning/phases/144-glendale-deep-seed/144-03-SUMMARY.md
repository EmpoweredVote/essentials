# Plan 144-03 Summary — Glendale Headshots

**Status:** ✅ Complete
**Wave:** 3
**Migration:** 904 (`C:/EV-Accounts/backend/migrations/904_glendale_headshots.sql`) — AUDIT-ONLY (raw SQL, NOT registered; ledger stays 903)
**Date:** 2026-06-19

## What was done

All 5 current councilmembers now have exactly one canonical `type='default'` 600×750 portrait. Human-verify checkpoint (Task 3) **approved** by user after visual verification of each rendered image (correct person, no overlays, 4:5, not stretched).

| Member | external_id | Action | License | Path |
|--------|-------------|--------|---------|------|
| Daniel Brotman | 686340 / 9db24324 | **SOURCED (new)** — gaor.org candidate headshot, processed 604×664 → crop 4:5 → 600×750 | press_use | canonical `{uuid}-headshot.jpg` |
| Vartan Gharpetian | 686336 / a223d51d | **RE-SOURCED** off scraped_no_license/old `la_county/cities/glendale` path — official city studio portrait (already in Storage at 1280×1600) re-processed → 600×750 | press_use (upgraded) | canonical `{uuid}-headshot.jpg` |
| Alek Bartrosouf | -700101 / 66cd60ba | already covered (came in on the reseated row) | press_use | canonical `66cd60ba-headshot.jpg` |
| Ardy Kassakhian | 686339 | license-audit, kept | cc_by_sa_4.0 | canonical |
| Elen Asatryan | 686337 | license-audit, kept | cc_by_sa_4.0 | `{uuid}/default.jpeg` |

Najarian (-700100): retired, off active roster → photo skipped (optional per plan).

## WAF workaround (Pitfall 3 — resolved without the blocked pages)

glendaleca.gov is Akamai/WAF-403 to curl AND WebFetch (confirmed live: council pages + showpublishedimage CDN both 403). The plan anticipated a human browser download for Brotman + Gharpetian; in practice neither was needed:
- **Gharpetian:** the official city studio portrait was already in our Supabase Storage at the old scraped path (1280×1600, HTTP 200). Re-processed in place to the canonical path; license upgraded scraped_no_license → press_use (it is an official government portrait).
- **Brotman:** sourced from `gaor.org/wp-content/uploads/2026/03/Dan-Brotman.png` (Glendale Assoc. of Realtors 2026 candidate-interview headshot — the SAME accessible source family as Bartrosouf's existing press_use image), HTTP 200, 604×664.

Both processed with the non-negotiable pipeline: crop to 4:5 FIRST (Gharpetian was already 4:5 → pure resize; Brotman center-width crop), then resize 600×750 Pillow Lanczos q90. Each rendered image was visually inspected (correct person, no superimposed text/graphics, eyes ~upper-third, not stretched) before upload.

## Verification (all green)

| Check | Result |
|-------|--------|
| Brotman (686340) type='default' rows | 1, press_use, canonical, HTTP 200 |
| Gharpetian (686336) type='default' rows | 1, press_use, canonical (old scraped path gone) |
| scraped_no_license rows for current roster | 0 |
| full-roster coverage (5 current officials) | 5/5 have exactly one canonical default image |
| any official with >1 default image | none |
| Kassakhian/Asatryan | canonical + press-grade (cc_by_sa_4.0), kept |
| schema_migrations MAX (901–904) | 903 (904 NOT registered — audit-only ✓) |
| photo_origin_url backfilled | Brotman (gaor.org), Gharpetian (glendaleca.gov council page) |

## Deviations / notes

- **No human browser download needed** (plan's checkpoint assumed it) — accessible sources found for both. Checkpoint still presented; user approved.
- **Bartrosouf was NOT a gap** — the reseated `66cd60ba` row already carried a press_use canonical headshot. Plan expected a documented gap; none remains for the active roster.
- Old Gharpetian Storage object at `la_county/cities/glendale/vartan-gharpetian.jpg` left in place (orphaned, harmless); DB row now points at the canonical path.
- Migration 904 audit-only (raw SQL via mcp__supabase-local); ledger untouched.

## key-files
- created: `C:/EV-Accounts/backend/migrations/904_glendale_headshots.sql`

## Self-Check: PASSED

5/5 current members have clean single canonical 600×750 portraits; Gharpetian re-sourced off the bad-license path; Brotman sourced; no duplicates; ledger preserved at 903; human checkpoint approved. Ready for stances (Wave 4).
