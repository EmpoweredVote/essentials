---
phase: 212-backend-place-name-resolver-national-fallback
plan: 02
subsystem: backend-data-ingest
tags: [gazetteer, census, place-name-resolver, idempotent-ingest, accounts-api]
dependency graph:
  requires:
    - "212-01: migration 1378 (essentials.gazetteer_places / essentials.gazetteer_counties column contract)"
  provides:
    - "backend/scripts/ingest-gazetteer-places-counties.ts (idempotent nationwide Gazetteer ingest, authored + unit-tested only)"
  affects:
    - "212-03: live run of this script against the production DB (BLOCKING dependency)"
tech-stack:
  added: []
  patterns:
    - "Batched UNNEST upsert (7/6 column arrays) instead of one round-trip per row — mirrors T-212-04 mitigation"
    - "Header-index resolution from the downloaded file's own header row — never hardcodes a column position for an unverified Gazetteer vintage"
    - "isMainModule guard (import.meta.url === file://process.argv[1]) so importing the script for unit tests triggers zero DB/network side effects"
key-files:
  created:
    - "C:/EV-Accounts/backend/scripts/ingest-gazetteer-places-counties.ts"
    - "C:/EV-Accounts/backend/scripts/ingest-gazetteer-places-counties.test.ts"
  modified:
    - "C:/EV-Accounts/backend/vitest.config.ts"
decisions:
  - "Batched UNNEST upsert over a single-row loop — plan's action text explicitly required 'do not issue one round-trip per row' for ~30k+ places; a naive per-row loop would have violated T-212-04"
  - "Added scripts/**/*.test.ts to vitest's include glob (Rule 3 auto-fix) — the plan's own specified test file path lives under scripts/, which vitest.config.ts did not scan by default"
metrics:
  duration: "~25 minutes"
  completed: "2026-07-20"
---

# Phase 212 Plan 02: Gazetteer Places+Counties Ingest Script Summary

Authored the idempotent, build-time Census Gazetteer ingest script (Places + Counties, nationwide) that will populate `essentials.gazetteer_places`/`essentials.gazetteer_counties` — the nationwide place-name fallback source consumed by the Phase 212 resolver — plus its parsing/idempotency unit test. This plan authors and unit-tests only; the live run against production happens in Plan 03.

## What Was Built

**`C:/EV-Accounts/backend/scripts/ingest-gazetteer-places-counties.ts`** — downloads the nationwide `{vintage}_Gaz_place_national.zip` and `{vintage}_Gaz_counties_national.zip` from `www2.census.gov` (these genuinely ship as single national files, unlike TIGER `cd`/`place`/`sldu`/`sldl` per-state products — RESEARCH.md Pitfall 2), extracts via `adm-zip`, and parses each pipe-delimited line by resolving column indexes from the downloaded file's own header row (never a hardcoded index — guards against vintage/column drift per RESEARCH.md Open Question 3 / Assumptions Log A2). Exports:
- `parsePlacesLine` / `parseCountiesLine` / `parsePlacesFile` / `parseCountiesFile` — pure parsers, header-skip + blank-line-skip
- `resolveHeaderIndex` — header-driven column resolution, throws on drift
- `buildPlacesUpsertSql` / `buildCountiesUpsertSql` — parameterized, UNNEST-based batch upsert SQL, `ON CONFLICT (geo_id) DO UPDATE`
- `placeRecordToParams` / `countyRecordToParams` / `transposeToColumnArrays` — per-row-to-column-array transposition for batched writes
- `main()` — the runnable entry, guarded by an `isMainModule` check so importing the module for tests never triggers a DB connection or network call

County subdivisions/townships/MCDs (D-09) are never downloaded — only the Places (incl. CDPs) and Counties files.

**`C:/EV-Accounts/backend/scripts/ingest-gazetteer-places-counties.test.ts`** — 18 Vitest cases (all green, no network/DB): header-index resolution + drift-guard, single-line parsing (geo_id/name/state/lsad/intptlat/intptlong), header-row skip, blank-line skip, USPS→state verbatim fidelity ("IL" maps to "IL", never inferred from name), upsert SQL shape (`ON CONFLICT (geo_id) DO UPDATE`, parameterized `$1..$7`/`$1..$6` array placeholders), and the `transposeToColumnArrays` batching contract (including a round-trip test against real parsed fixture records).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Batched UNNEST upsert instead of a per-row loop**
- **Found during:** Task 1, while implementing the actual upsert execution functions (`upsertPlaces`/`upsertCounties`)
- **Issue:** The plan's action text explicitly requires "Batch inserts (do not issue one round-trip per row — ~30k+ places)" and the threat model's T-212-04 mitigation requires "Batched inserts, single connection from shared pool." An initial straightforward per-record `pool.query()` loop would have issued one round trip per row (~30k+ round trips for Places alone), directly violating both.
- **Fix:** Rewrote `buildPlacesUpsertSql`/`buildCountiesUpsertSql` to use `INSERT ... SELECT * FROM UNNEST($1::text[], $2::text[], ...) ON CONFLICT (geo_id) DO UPDATE` — a fixed-shape query (7 params for places, 6 for counties) where each param is a column array, not a single value. `transposeToColumnArrays()` turns an array of per-row param tuples into the column arrays the UNNEST query expects. `upsertPlaces`/`upsertCounties` chunk records into batches of 1000 and issue exactly one `pool.query()` call per batch.
- **Files modified:** `C:/EV-Accounts/backend/scripts/ingest-gazetteer-places-counties.ts`, its test file (added `transposeToColumnArrays` coverage + updated the upsert-SQL-shape assertions to match the UNNEST pattern)
- **Commit:** 7a6bb7b1

**2. [Rule 3 - Blocking] Added `scripts/**/*.test.ts` to vitest's include glob**
- **Found during:** Task 2, running the plan's specified verify command (`npm run test:unit -- scripts/ingest-gazetteer-places-counties.test.ts`)
- **Issue:** `backend/vitest.config.ts`'s `include` array only scanned `../tests/**`, `src/**`, and `test/**` — `scripts/**` was not included. Running the exact command the plan specifies (and the plan's own `files_modified` frontmatter, which puts the test file at `scripts/ingest-gazetteer-places-counties.test.ts`) silently matched zero test files; the command exited 0 only because the `src` positional filter arg still matched the full existing `src/**` suite, masking the omission.
- **Fix:** Added `'scripts/**/*.{test,spec}.{ts,js}'` to the `include` array. Verified no existing `scripts/*.ts` filename accidentally matches the new `*.test.ts`/`*.spec.ts` glob (checked filenames like `test-pdf.ts`, `test-tiger-baseline-ca.ts`, `_test-netfile-years.ts` — none end in `.test.ts`/`.spec.ts`), and re-ran the full `npm run test:unit` suite before and after the change (274 tests passed before → 292 passed after, zero regressions, zero unrelated file newly matched).
- **Files modified:** `C:/EV-Accounts/backend/vitest.config.ts`
- **Commit:** 7a6bb7b1

## Verification

Ran the plan's exact specified command from `C:/EV-Accounts/backend`:
```
npm run test:unit -- scripts/ingest-gazetteer-places-counties.test.ts
```
Result: 23 test files / 292 tests passed (18 new + 274 pre-existing, all green, zero regressions).

Also ran `npm run test` (full suite including integration tests) as an extra check — 9 pre-existing test files failed with DB-password-auth / missing-env-var / network-dependent errors unrelated to this change (e.g. `arcgis-sources-coverage.test.ts` needs a live DB connection, `search.test.ts`'s live-network assertions). None reference Gazetteer/ingest code; these are pre-existing environment-dependent failures outside this task's scope (not run or fixed, per the scope boundary — the plan's own verify command is `test:unit`, not `test`, precisely to avoid this class of failure).

Grep confirmations:
- `ON CONFLICT (geo_id) DO UPDATE` present (both `buildPlacesUpsertSql` and `buildCountiesUpsertSql`)
- Parameterized placeholders only (`$1::text[]` etc.) — no string-interpolated field values anywhere in the SQL builders
- No reference to a county-subdivision/MCD/cousub *file download* — the only "cousub"/"MCD" occurrences are explanatory code comments documenting the D-09 exclusion, not an actual fetch/URL
- `git -C "C:/EV-Accounts" diff --stat -- backend/package.json` — empty (no dependency change)

## Self-Check: PASSED

- FOUND: C:/EV-Accounts/backend/scripts/ingest-gazetteer-places-counties.ts
- FOUND: C:/EV-Accounts/backend/scripts/ingest-gazetteer-places-counties.test.ts
- FOUND: C:/EV-Accounts/backend/vitest.config.ts (modified)
- FOUND commit: 7a6bb7b1 (EV-Accounts repo, master, local only — not pushed)
