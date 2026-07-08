# Plan 142-01 Summary — Long Beach Reconcile / Data Hygiene

**Status:** ✅ Complete
**Wave:** 1
**Migration:** 878 (`C:/EV-Accounts/backend/migrations/878_long_beach_reconcile.sql`) — applied to production + registered in `supabase_migrations.schema_migrations`
**Date:** 2026-06-19

## What was done

Reconciled the pre-existing partial Long Beach seed (gov `5e5c3e0b-5479-4759-ac7e-2ea0aecabd38`). All five data-hygiene defects fixed in one idempotent migration, verified live before and after:

1. **geo_id backfill (D-07)** — `essentials.governments.geo_id` NULL → `0643000`
2. **Mayor chamber rename (D-08)** — chamber `867f4e3f` → `name`/`name_formal` = `'Mayor of Long Beach'`, eliminating the duplicate `name_formal='Long Beach City Council'` shared by both chambers (split-section risk). Targeted by **id only**; `slug` (GENERATED) untouched.
3. **Image dedupe (D-09)** — deleted 3 duplicate `politician_images` rows by specific id: Cindy Allen `230a4412` (kept press_use `677466b1`), Megan Kerr `9e12052f`, Roberto Uranga `40d4cf42`.
4. **Rex Richardson office_id (D-10)** — back-filled `politicians.office_id` = `06c1def0…` (Mayor office already linked to him; reverse link was NULL).
5. **District relabel (Open Q2)** — 8 council districts `'At-Large'` → `'District 1'…'District 9'` (label-only; `geo_id`/`district_id` unchanged → flat-district D-06 preserved). D8 intentionally absent (seated in Wave 2).

## Verification (all green)

| Check | Result |
|-------|--------|
| gov geo_id | `0643000` |
| chambers named 'Long Beach City Council' | 1 |
| Mayor chamber name_formal | 'Mayor of Long Beach' |
| LB officials with >1 image | 0 |
| Rex Richardson office_id | `06c1def0-1f1b-4b9a-97a3-dc2903083edc` |
| council districts still 'At-Large' | 0 |
| duplicate name_formal in government (split-section) | 0 |
| migration 878 in schema_migrations | yes |

## Deviations / notes

- **Plan assumed duplicate on `name`; actual duplicate was on `name_formal`** (both chambers had `name='City Council'`, `name_formal='Long Beach City Council'`). Adapted the rename + verification to target `name_formal`. No scope change.
- **Megan Kerr (665835) and Roberto Uranga (665839) had two `scraped_no_license` copies each** — neither had a press_use row. Kept one copy each; the kept row still has `photo_license='scraped_no_license'`. **Flagged for Wave 3 image audit** to upgrade the license to `press_use` from the official longbeach.gov CDN source.

## key-files
- created: `C:/EV-Accounts/backend/migrations/878_long_beach_reconcile.sql`

## Self-Check: PASSED

Migration applied, all 8 verification checks green, idempotent (guards on geo_id IS NULL / office_id IS NULL / id-scoped deletes; rename + relabel set identical values on re-apply). Long Beach structure is now unambiguous and ready for roster completion (Wave 2).
