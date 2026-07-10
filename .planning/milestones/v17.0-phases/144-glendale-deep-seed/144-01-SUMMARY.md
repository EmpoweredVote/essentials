# Plan 144-01 Summary — Glendale Reconcile / Data Hygiene

**Status:** ✅ Complete
**Wave:** 1
**Migration:** 902 (`C:/EV-Accounts/backend/migrations/902_glendale_reconcile.sql`) — applied to production + registered in `supabase_migrations.schema_migrations`
**Date:** 2026-06-19

## What was done

Reconciled the pre-existing partial, duplicate-chamber Glendale seed (gov `a7433437-341a-48e7-907e-a61318954f0a`) in one idempotent structural migration, verified live before and after:

1. **geo_id backfill (D-01 / D-02 / GLEN-01)** — `essentials.governments.geo_id` NULL → `0630000` (guarded `WHERE geo_id IS NULL`).
2. **Empty duplicate chamber delete (D-03)** — `c019a553-e888-4338-abf1-8adbd86f9c00` (external_id -200687, name "City Council", 0 offices) deleted, targeted by UUID only. An inline `DO $$` assert confirmed 0 offices before the DELETE (Pitfall 5). Survivor is `771727ec-684b-4eb8-98a6-d7205d9bbac0` (external_id 10450, 5 offices).
3. **Rotational Mayor flag (D-08 / D-09)** — Kassakhian's existing seat (office `b1c10c09-a6ba-4623-aae4-28a08ffca09c`, external_id 686339) title `Councilmember` → `Mayor`, guarded `title <> 'Mayor'`. No separate LOCAL_EXEC row; other 4 seats untouched.

No member retirement in this wave (Najarian retires in Wave 2, per orchestrator decision #1).

## Pre-flight finding

One cosmetic discrepancy vs the plan text: both chambers are named **"City Council"** (`name`), not the literal "Glendale City Council" the plan/research assumed. `name_formal` IS "Glendale City Council". Verification was scoped by `government_id` rather than the literal name string — no structural impact. Pre-state otherwise matched RESEARCH.md exactly (gov geo_id NULL, two chambers, c019a553 empty, Kassakhian seat = b1c10c09).

## Verification (all green)

| Check | Result |
|-------|--------|
| gov geo_id | `0630000` |
| chambers under gov a7433437 | 1 |
| duplicate chamber external_id -200687 remaining | 0 |
| survivor chamber 771727ec official_count | 5 |
| Kassakhian office b1c10c09 title | `Mayor` |
| other 4 survivor seats title | `Councilmember` |
| Glendale split-section (own chamber) | 1 section ("Glendale City Council") — not split |
| global split-section check | 5 rows, all OTHER cities (Whittier/Compton/Carson/South El Monte/South Pasadena) — Glendale ABSENT |
| migration 902 in schema_migrations | yes |
| idempotency re-run | geo=0, chamber_del=0, mayor=0 rows; no error |

## Deviations / notes

- **Chamber `name` is "City Council"** (not "Glendale City Council") — verification scoped by gov id. Cosmetic only.
- **5 OTHER cities' pre-existing split-section defects** (Whittier 8 / Compton 6 / Carson 5 / South El Monte 4 / South Pasadena 3) remain — out of scope (see `project_split_section_defects_5_cities`); Glendale is clean.
- Migration applied via `mcp__supabase-local` (= production DB); on-disk file authoritative.

## key-files
- created: `C:/EV-Accounts/backend/migrations/902_glendale_reconcile.sql`

## Self-Check: PASSED

Migration 902 applied + registered, all verification checks green, idempotent (geo_id IS NULL guard, UUID-scoped delete with empty-chamber assert, title <> target guard, ON CONFLICT ledger insert). Glendale is now a single unambiguous "City Council" chamber with the rotational Mayor flagged — ready for roster completion (Wave 2).
