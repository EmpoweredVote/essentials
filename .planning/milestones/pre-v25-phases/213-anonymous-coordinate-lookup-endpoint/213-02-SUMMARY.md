---
phase: 213-anonymous-coordinate-lookup-endpoint
plan: 02
subsystem: api
tags: [express, rate-limit, coordinate-validation, accounts-api, supertest]

# Dependency graph
requires:
  - phase: 213-01
    provides: classifyCoordinate (US bbox + swap guard), getRepresentativesByCoordinate (no-geocode point resolution)
provides:
  - "POST /api/essentials/coordinate-lookup — anonymous HTTP endpoint wiring classifyCoordinate -> 422 taxonomy -> getRepresentativesByCoordinate"
  - "Route mounted in index.ts before the /api/essentials catch-all"
  - "Supertest regression suite: 200 path (exactly one NATIONAL_LOWER rep) + all three 422 codes + no-echo assertion"
affects: [213-03 (live smoke test), 214 (frontend combobox consumes this route directly over HTTP)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dedicated single-route Router file (mirrors essentialsLocationSearch.ts) mounted at its own path before the /api/essentials catch-all"
    - "express-rate-limit keyed on req.ip for an anonymous POST route (mirrors routes/events.ts's trackLimiter)"
    - "Supertest suite mocks only the DB-touching service layer (getRepresentativesByCoordinate); the pure, DB-free validation function (classifyCoordinate) is exercised unmocked through the real HTTP layer"

key-files:
  created:
    - C:/EV-Accounts/backend/src/routes/essentialsCoordinateLookup.ts
    - C:/EV-Accounts/backend/src/routes/essentialsCoordinateLookup.test.ts
  modified:
    - C:/EV-Accounts/backend/src/index.ts

key-decisions:
  - "Route base path is 'coordinate-lookup' (POST /api/essentials/coordinate-lookup), mounted alongside the existing '/api/essentials/location-search' block, both before the '/api/essentials' catch-all (essentialsRouter)"
  - "422 message copy per rejection code lives in a REJECTION_MESSAGES lookup keyed by the exact classifyCoordinate code string (D-07) — never echoes the submitted lat/lng"
  - "Rate limiter: windowMs 60_000, max 30, keyGenerator on req.ip, standardHeaders true — modest abuse protection per D-07's 'planner discretion' note, mirroring events.ts's trackLimiter shape"
  - "Test suite mocks lib/essentialsService.js (getRepresentativesByCoordinate) only; classifyCoordinate is left unmocked since it's a pure, DB-free function (Phase 213-01) and running it for real through the HTTP layer is the strongest proof the 422 taxonomy round-trips correctly"
  - "Doc-comment in essentialsCoordinateLookup.ts avoids the literal string 'req.query' (paraphrased as 'URL query-string parameter') purely to satisfy the plan's own literal grep acceptance check (grep -c \"req.query\" == 0) — no behavior change, same pattern used in 213-01's summary for a similar grep-vs-prose collision"

requirements-completed: []

# Metrics
duration: 3min
completed: 2026-07-21
---

# Phase 213 Plan 02: Coordinate-Lookup Route + Supertest Suite Summary

**POST /api/essentials/coordinate-lookup — a body-only, rate-limited, anonymous HTTP endpoint that classifies a submitted `{lat, lng}` and either returns a 422 with one of three distinct rejection codes or the officials at that point via the Plan 01 `getRepresentativesByCoordinate`, with zero coordinate echo/logging.**

## Performance

- **Duration:** ~3 min (git commit timestamps: 00:41:15 -> 00:43:47)
- **Completed:** 2026-07-21
- **Tasks:** 2 completed
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments

- `essentialsCoordinateLookup.ts` exports a default `Router` with a single `router.post('/', optionalAuth, coordinateLookupLimiter, handler)`. The handler reads `lat`/`lng` from `req.body` (never `req.query`), coerces with `Number(...)`, calls `classifyCoordinate`, maps a rejection to `422 { code, message }` (message never echoes the submitted numbers), and on a valid point calls `getRepresentativesByCoordinate` and returns `200` with the `AddressSearchResult`. The catch block logs only `(err as Error).message`, never `req.body`/`lat`/`lng`.
- A 60s/30-request `express-rate-limit` limiter keyed on `req.ip` mirrors the existing `routes/events.ts` pattern — cheap abuse protection on the anonymous POST route (T-213-06).
- Mounted in `index.ts` as `app.use('/api/essentials/coordinate-lookup', essentialsCoordinateLookupRouter)`, placed directly after the existing `location-search` mount and before the `/api/essentials` catch-all (`essentialsRouter`) — verified by line-number ordering in the acceptance check.
- `essentialsCoordinateLookup.test.ts`: 5-test supertest suite mounting the router on a minimal Express app with `express.json()`. Mocks only `lib/essentialsService.js`'s `getRepresentativesByCoordinate` (the DB-touching call); `classifyCoordinate` runs for real (pure, DB-free) so the 422 taxonomy is proven end-to-end through the actual HTTP layer, not just re-asserted against a stub.
  - 200 path (Bloomington, IN `{lat: 39.17, lng: -86.52}`): non-empty `politicians` array, **exactly one** `NATIONAL_LOWER` record (the BLOCKER 1 regression guard against the nationwide House roster leaking in), `matchedAddress === ''`, and the serialized body contains neither `"39.17"` nor `"-86.52"` (no-echo).
  - Swapped Bloomington (`{lat: -86.52, lng: 39.17}`) -> `422 SWAPPED_COORDINATES`.
  - London (`{lat: 51.5, lng: -0.12}`) -> `422 OUTSIDE_US_BOUNDS`.
  - Malformed (`{lat: "abc", lng: null}`) -> `422 INVALID_COORDINATES`.
  - Missing both (`{}`) -> `422 INVALID_COORDINATES`.
  - All four 422 cases additionally assert `getRepresentativesByCoordinate` was never called (short-circuit before any DB touch).

## Task Commits

1. **Task 1: route + index.ts mount** - `79f715cc` (feat) — EV-Accounts repo
2. **Task 2: supertest suite** - `0d4745c7` (test) — EV-Accounts repo

_Both commits are in `C:/EV-Accounts` (accounts-api backend repo), not the essentials/GSD planning repo._

## Files Created/Modified

- `C:/EV-Accounts/backend/src/routes/essentialsCoordinateLookup.ts` - dedicated Router; single `POST /` handler wiring `classifyCoordinate` -> 422 taxonomy -> `getRepresentativesByCoordinate`; `express-rate-limit` (60s/30, `req.ip`)
- `C:/EV-Accounts/backend/src/routes/essentialsCoordinateLookup.test.ts` - 5-test supertest suite; mocks `essentialsService.js` only, `middleware/auth.js`'s `optionalAuth` as pass-through
- `C:/EV-Accounts/backend/src/index.ts` - import + `app.use('/api/essentials/coordinate-lookup', ...)` mount, placed before the `/api/essentials` catch-all

## Decisions Made

See `key-decisions` in frontmatter above. Notably: the acceptance-criteria grep for `router.post('/'` on a single line required collapsing the handler signature onto one line (rather than the more common multi-argument-per-line Express style) — purely a formatting choice with no behavior impact, made during Task 1 after the first grep check came back 0.

## Deviations from Plan

**1. [Rule 3 - blocking, self-resolved during implementation] `router.post('/'` acceptance-grep required single-line handler signature.**
- **Found during:** Task 1 verification.
- **Issue:** Writing `router.post(\n  '/',\n  ...)` across multiple lines (readable, common style) caused the plan's own acceptance check `grep -c "router.post('/'" == 1` to return 0, since the literal substring spans a line break.
- **Fix:** Collapsed the handler registration to a single line: `router.post('/', optionalAuth, coordinateLookupLimiter, async (req, res) => { ... })`.
- **Files modified:** `essentialsCoordinateLookup.ts`.
- **Commit:** folded into `79f715cc` (pre-commit fix, no separate commit needed).

**2. [Rule 3 - blocking, self-resolved during implementation] Doc-comment literal-string collision with `grep -c "req.query" == 0` acceptance check.**
- **Found during:** Task 1 verification.
- **Issue:** The top-of-file doc comment originally explained the body-only transport decision using the literal phrase "req.query" (to name the thing NOT being read) — this tripped the plan's own literal `grep -c "req.query"` acceptance check (which doesn't exclude comment lines, unlike the logging-check grep which does via `grep -v '^\s*//'`).
- **Fix:** Reworded the comment to "any URL query-string parameter" — same meaning, no behavior change.
- **Files modified:** `essentialsCoordinateLookup.ts`.
- **Commit:** folded into `79f715cc`.

No architectural deviations (Rule 4). Plan executed as designed otherwise.

## Issues Encountered

None blocking. Both self-resolved formatting/grep-collision fixes above (Rule 3, within the 3-attempt limit — resolved on first retry each).

## User Setup Required

None — no external service configuration, no new environment variables. The route uses the already-installed `express-rate-limit` dependency (no new package).

## TDD Gate Compliance

Task 2 carries `tdd="true"`, but its `<files>` list contains only the test file itself (`essentialsCoordinateLookup.test.ts`) — the route implementation under test was built in Task 1 (`79f715cc`, a `feat` commit) and committed *before* Task 2's test suite. This means the canonical RED-then-GREEN gate sequence (failing test commit followed by a passing-implementation commit) does not literally apply here: there is no separate RED phase, because the implementation the tests exercise already existed and was already correct when the test file was written. Running `npx vitest run src/routes/essentialsCoordinateLookup.test.ts` immediately produced **5/5 green** on the first execution — there was no failing-red state to observe.

This is a plan-structure characteristic (Task 1 = route + mount, Task 2 = regression-test suite for that route), not a violation of the plan's own instruction, which explicitly said "Write tests RED first **where practical**" — a strict RED phase was not practical given Task 1 necessarily had to ship a working route first (its own acceptance criteria required `tsc --noEmit` clean and the mount-ordering grep to pass, which only make sense against real code, not a stub). No warning is raised for missing RED/GREEND gate commits because the plan's frontmatter `type` is `execute`, not `tdd` — the stricter Plan-Level TDD Gate Enforcement section (which mandates the test-then-feat-commit sequence check) applies only to plans whose frontmatter declares `type: tdd`, which this plan does not.

## Next Phase Readiness

- `POST /api/essentials/coordinate-lookup` is live in the codebase (pending Render deploy on push to `master`), fully wired to the Plan 01 building blocks, rate-limited, and covered by a 5-test regression suite plus a clean `tsc --noEmit`.
- Plan 03 should smoke-test the live endpoint (curl/Postman per the sequential-executor's no-Supabase-MCP note) against a real DB-backed Render deployment, confirming the 200/422 contract holds end-to-end and that RSLV-03's traceability can finally be marked complete in REQUIREMENTS.md (per 213-01's summary note, RSLV-03 spans all three plans in this phase — lib core -> route -> live smoke test).
- No blockers. `express-rate-limit` behavior (429 on the 31st request within 60s) was not exercised in this unit-test suite (would require 31 sequential supertest calls against the same in-process app instance) — if Plan 03's live smoke test wants to verify the rate limiter fires, that's the natural place to do it against the deployed instance.

## Self-Check: PASSED

- FOUND: `backend/src/routes/essentialsCoordinateLookup.ts`
- FOUND: `backend/src/routes/essentialsCoordinateLookup.test.ts`
- FOUND: `app.use('/api/essentials/coordinate-lookup', essentialsCoordinateLookupRouter)` in `backend/src/index.ts` (line 158, before the line-179 `/api/essentials` catch-all)
- FOUND: commit `79f715cc` (feat, Task 1)
- FOUND: commit `0d4745c7` (test, Task 2)
- CONFIRMED: `npx tsc --noEmit` clean
- CONFIRMED: `npx vitest run src/routes/essentialsCoordinateLookup.test.ts` — 5/5 passed
- CONFIRMED: no regressions in `essentialsLocationSearch.test.ts` (11 tests) or `coordinateValidation.test.ts` (12 tests) — 23/23 passed together

---
*Phase: 213-anonymous-coordinate-lookup-endpoint*
*Completed: 2026-07-21*
