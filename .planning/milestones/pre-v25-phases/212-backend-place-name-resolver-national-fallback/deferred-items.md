# Deferred Items — Phase 212

## 212-05 Task 1: Pre-existing test failures (out of scope, not caused by this task)

Running `npm run test` in `C:/EV-Accounts/backend` after Task 1 (essentialsLocationSearch.ts +
index.ts mount) shows 9 pre-existing failing test files (19 failing tests), none referencing the
new route file or its imports:

- `tests/architecture/coordinateLeakage.test.ts` — pre-existing `encrypted_lat` string-match violations in `connect.ts`/`essentials.ts`.
- `tests/integration/architecture.test.ts` — pre-existing `supabaseAdmin` architecture violations in `lib/essentialsLegislativeService.ts`, `routes/admin.ts`, `routes/auth.ts`, `routes/campaignFinanceAdmin.ts` (not `essentialsLocationSearch.ts`).
- `tests/integration/compass.test.ts`, `tests/integration/ctcCivicSpaces.test.ts`, `tests/integration/gems.test.ts`, `tests/integration/env-validation.test.ts`, `tests/integration/treasury-cities.test.ts` — fail locally with 401/422/500 mismatches, consistent with a local dev environment missing/invalid env vars and no reachable Supabase/local Postgres instance.
- `test/arcgis-sources-coverage.test.ts` — `error: password authentication failed for user "Chris"` — local Postgres auth failure, unrelated to Task 1.
- `test/essentialsService-tribal-land.test.ts` — `process.exit` from `src/lib/env.ts` env validation, unrelated to Task 1.

**Verified not caused by this task:** `essentialsLocationSearch.ts` does not appear in any
architecture-violation file list, and no test in the failing set imports or exercises the new
route or `locationSearchService.ts`/`essentialsBrowseService.ts` functions it calls. These are
local-environment (missing env vars / no local DB) and pre-existing tech-debt failures, out of
Task 1's scope per the executor's Scope Boundary rule. `npm run build` (tsc) passes cleanly with
zero errors including the new files.
