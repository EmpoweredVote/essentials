# Deferred Items — Phase 216

## Pre-existing test failure (out of scope for 216-01)

`test/essentialsService-tribal-land.test.ts` (accounts-api backend), test case
`emits tribal_land.on_reservation=false when no X0004 row matches`, fails with
`process.exit unexpectedly called with "1"` because it imports the real
`essentialsService.ts` module (which pulls in `./db.js` -> `./env.ts`, which
`process.exit(1)`s on missing SUPABASE_URL/DATABASE_URL/etc.) without stubbing
those env vars first — unlike `test/essentialsService-locality.test.ts` (this
phase's new test file), which stubs them before import.

Confirmed pre-existing: this same test fails identically in a clean baseline
`npm test` run captured before any 216-01 code changes were made. Not caused
by this plan's changes. Left untouched per the executor's scope boundary
(only auto-fix issues directly caused by the current task's changes).

Suggested fix (future, out-of-scope-here): add the same `process.env.X ??= '...'`
stub block used in `essentialsService-locality.test.ts` to the top of
`essentialsService-tribal-land.test.ts`.
