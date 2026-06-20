# Plan 143-01 Summary — Santa Clarita Reconcile / Data Hygiene

**Status:** ✅ Complete
**Wave:** 1
**Migration:** 894 (`C:/EV-Accounts/backend/migrations/894_santa_clarita_reconcile.sql`) — applied to production + registered in `supabase_migrations.schema_migrations`
**Date:** 2026-06-19

## What was done

Reconciled the pre-existing partial, duplicate-chamber Santa Clarita seed (gov `42164a8f-2e0a-4786-9099-ce36f3f97101`) in one idempotent migration, verified live before and after:

1. **geo_id backfill (D-01 / SCLR-01)** — `essentials.governments.geo_id` NULL → `0669088`
2. **Retire Cameron Smyth (-700180, RESEARCH override of D-02)** — departed Dec 10 2024; `office_id` NULL, `is_incumbent=false`, `is_active=false`. NOT reseated, NOT deleted.
3. **Chamber A teardown** — duplicate `City Council` chamber `315e67c5` (external_id -200978) + its 3 offices deleted (FK-safe: detach → offices → chamber), plus its two now-orphaned districts: At-Large `388fccb6` and stale `LOCAL_EXEC` "Santa Clarita Mayor" `d8663b4b` (the latter contradicted D-05).
4. **Title normalize (D-03)** — surviving Chamber B titles confirmed `'Councilmember'` (no space-variant remained).
5. **Gibbs image dedupe (Pitfall 6)** — deleted the `scraped_no_license` row for `434cd9b0…`, kept `press_use` (2→1).
6. **Office back-links + count** — Gibbs/Weste/Ayala `office_id` confirmed non-NULL; Chamber B `official_count=5`.

## ⚠️ Major pre-flight finding — reseat decision (user-approved)

RESEARCH.md/CONTEXT D-02 assumed Chamber A held "1 empty Mayor + 2 council, only Smyth seated." **Live state was different:** Chamber A held **three** seated politicians, two of them the real current members that already existed in the DB:

| Person | id | external_id | Chamber A office | images |
|--------|----|-----|------|--------|
| Marsha McLean | `9476ec1c` | **-201394** | "Council Member" | 1 |
| Cameron Smyth | `dcf156cb` | -700180 | "Council Member" | 0 |
| Bill Miranda | `069fc0f2` | **-200980** | "Mayor" (LOCAL_EXEC) | 1 |

**Decision (user-approved): RESEAT the existing McLean/Miranda rows** into Chamber B in Plan 02 — preserving their identity + existing headshots — rather than INSERTing duplicate `-700181/-700182` people (which the plans originally specified). Downstream plans 03/04 retarget to **-201394 (McLean)** and **-200980 (Miranda)**. After 894 they are active but office-less (transient; reseated in 895).

## Verification (all green)

| Check | Result |
|-------|--------|
| gov geo_id | `0669088` |
| chambers named 'City Council' under gov | 1 |
| Chamber A (-200978) remaining | 0 |
| Chamber A offices remaining | 0 |
| Smyth (-700180) state (active/incumbent/office) | false / false / NULL |
| Gibbs (434cd9b0…) images | 1 |
| Chamber B official_count | 5 |
| Chamber B 'Council Member' space-variant titles | 0 |
| orphaned Chamber-A districts remaining | 0 |
| McLean/Miranda active + office-less | -201394 ✓, -200980 ✓ |
| SC split-section (name_formal distinct sections) | 1 (clean) |
| migration 894 in schema_migrations | yes |

## Deviations / notes

- **Reseat strategy** (above) deviates from the plans' insert-fresh `-700181/-700182` approach — avoids duplicate persons (plans' own Assumption A4). Plans 02/03/04 adapted to `-201394/-200980`.
- **`districts.district_id` is a TEXT code, not a uuid self-FK** — dropped the redundant child-district guard (no offices/children/inform refs verified separately before deleting the two orphan districts).
- **Out-of-scope pre-existing split-section defects flagged:** the global split-section check returns 5 rows for OTHER cities — Whittier (8), Compton (6), Carson (5), South El Monte (4), South Pasadena (3) — from prior phases. Santa Clarita is NOT among them. Recommend a future cleanup phase; not touched here.
- **Inactive duplicate Bill Miranda** (`16ce8126`, external_id 665694, `is_active=false`) and several inactive campaign-committee junk rows (external_id NULL) left as-is (already inactive, won't display).

## key-files
- created: `C:/EV-Accounts/backend/migrations/894_santa_clarita_reconcile.sql`

## Self-Check: PASSED

Migration applied + registered, all 12 verification checks green, idempotent (geo_id IS NULL guard, id-scoped deletes, title <> target, office_id IS DISTINCT FROM guards, ON CONFLICT on ledger insert). Santa Clarita is now a single unambiguous 'City Council' chamber ready for roster completion (Wave 2).
