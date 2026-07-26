---
phase: 213-anonymous-coordinate-lookup-endpoint
plan: 03
subsystem: api
tags: [render-deploy, curl-smoke, psql, postgis, st_covers, accounts-api, privacy-contract]

# Dependency graph
requires:
  - phase: 213-01
    provides: classifyCoordinate (US bbox + swap guard), getRepresentativesByCoordinate (no-geocode point resolution)
  - phase: 213-02
    provides: POST /api/essentials/coordinate-lookup route (422 taxonomy, rate-limit, no coordinate logging) + index.ts mount + supertest suite
provides:
  - "Live, smoke-verified POST /api/essentials/coordinate-lookup on accounts-api.empowered.vote (Render deploy from master)"
  - "Operator sign-off on the phase's three success criteria proven against the live endpoint"
  - "RSLV-03 satisfied end-to-end (lib core -> route -> live smoke)"
affects: [214 (frontend combobox consumes this live endpoint over HTTP)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Live-host smoke verification (curl against accounts-api.empowered.vote, NOT localhost) after a Render deploy — the project GOTCHA that a Render build hash differs from local is guarded by polling the live route 404->422 before asserting"
    - "Zero-write proof by production psql before/after row-count delta across the tables a lookup could plausibly touch (politicians/offices/districts) + a SELECT-only source assertion over the coordinate code path"
    - "Privacy contract proven at the wire: full-body substring search for the submitted lat/lng confirms no coordinate echo; handler source confirms only (err as Error).message is ever logged"

key-files:
  created:
    - C:/Transparent Motivations/essentials/.planning/phases/213-anonymous-coordinate-lookup-endpoint/213-03-SUMMARY.md
  modified: []

key-decisions:
  - "No new code commit was needed for Task 1 — Plan 01+02 code was already committed on master (5120214c/8b7fe341/a1ab5738/79f715cc/0d4745c7); Task 1 reduced to a push (3337495c..0d4745c7) to trigger the Render auto-deploy"
  - "no-coordinate-leak (Criterion 3 / check d) was verified at SOURCE level only this session — Render live-log dashboard/CLI access was unavailable, so the plan's documented fallback clause ('or, if log access is unavailable, the handler source') applies; the handler's only log statement is console.error with (err as Error).message and the file contains no analytics/telemetry import or call"

patterns-established:
  - "Deploy-then-poll-then-smoke sequence for accounts-api Render pushes: push master -> poll the target route until it stops returning 404/502 (deploy live) -> only then run correctness/privacy assertions against the live host"

requirements-completed: [RSLV-03]

# Metrics
duration: 18min
completed: 2026-07-21
---

# Phase 213 Plan 03: Live Deploy + Privacy/Correctness Smoke Test Summary

**Shipped the anonymous `POST /api/essentials/coordinate-lookup` endpoint to production (Render, from master) and proved its full privacy + correctness contract against the LIVE host — exactly one US House rep + state/federal floor, three distinct 422 codes, zero DB writes, and no coordinate echo/log — with operator sign-off.**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-07-21T07:50:00Z (approx)
- **Completed:** 2026-07-21T08:08:00Z (approx)
- **Tasks:** 2 auto tasks executed + 1 blocking human-verify checkpoint (operator approved)
- **Files modified:** 0 code files (deploy + live verification only); 1 planning artifact created (this SUMMARY)

## Accomplishments

- **Task 1 — Deploy live.** Confirmed local green before push (`npx tsc --noEmit` clean; `npx vitest run src/lib/coordinateValidation.test.ts src/routes/essentialsCoordinateLookup.test.ts` → 17/17 passed). No new code commit was required — the Plan 01+02 commits were already on `master` in `C:/EV-Accounts`. Pushed `git -C "C:/EV-Accounts" push origin master` (`3337495c..0d4745c7`), triggering the Render auto-deploy. Polled the live coordinate-lookup route every 15s; it transitioned 404 → **422** at ~75s, confirming the new deploy is serving. Post-push state: `git log -1 --oneline` = `0d4745c7`, `origin/master..master` count = 0 (fully pushed). Health route `200 {"status":"ok"}`.
- **Task 2 — Live smoke PASS.** The plan's automated verify command printed **`SMOKE_OK`**. All four live checks (valid point, three rejections, zero-write, no-coordinate-log) passed against `accounts-api.empowered.vote`.
- **Task 3 — Operator sign-off.** Live smoke results were presented at the blocking `checkpoint:human-verify`; the operator reviewed and typed **"approved"**.

## Task 2 Live Smoke Results (verbatim)

**Verify automated command:** printed `SMOKE_OK`.

**(a) Valid point — Bloomington, IN (lat 39.17, lng -86.52):**
- HTTP status: `200`
- `matchedAddress`: `""` (empty — no reverse-geocode; D-06 satisfied)
- `politicians` total: 138 (Monroe County is fully deep-seeded, so local/county/school/judicial rows accompany the state+federal floor)
- `NATIONAL_LOWER` count: **exactly 1** — **Erin Houchin**, geo_id `1809`, "U.S. House of Representatives - Indiana 9th Congressional District" (BLOCKER-1 regression guard holds — no ~435-member nationwide roster leak)
- `NATIONAL_UPPER` (US Senators): **Jim Banks, Todd Young**
- `STATE_EXEC` sample: **Mike Braun (Governor)**, Micah Beckwith (Lt. Governor), Todd Rokita (AG), Diego Morales (SoS), Daniel Elliott (Treasurer), + additional state execs
- No-echo check: response body contains **no** `"39.17"`, `"-86.52"`, or `"86.52"` substring anywhere (confirmed via both raw grep and Node full-body string search)

**(b) Rejections — three distinct 422 codes (status + body):**

| Input | HTTP | Code | Message |
|-------|------|------|---------|
| `{lat:-86.52, lng:39.17}` (swapped) | 422 | `SWAPPED_COORDINATES` | "The submitted coordinate appears to have latitude and longitude swapped." |
| `{lat:51.5, lng:-0.12}` (London) | 422 | `OUTSIDE_US_BOUNDS` | "The submitted coordinate falls outside the supported US bounding box." |
| `{lat:"abc"}` (malformed) | 422 | `INVALID_COORDINATES` | "lat and lng must both be finite numbers." |

No message echoes the submitted lat/lng values.

**(c) Zero-write check (production psql, before/after 5+ live lookups):**

| Table | Before | After | Delta |
|-------|--------|-------|-------|
| `essentials.politicians` | 84471 | 84471 | 0 |
| `essentials.offices` | 82869 | 82869 | 0 |
| `essentials.districts` | 6871 | 6871 | 0 |

Source assertion: `resolveOfficialsAtPoint` (shared `ST_Covers` core) and `getRepresentativesByCoordinate` in `essentialsService.ts` are SELECT-only — no INSERT/UPDATE/DELETE anywhere on the coordinate code path.

**(d) No-coordinate-leak check (SOURCE-LEVEL — see caveat):** The only logging statement in `essentialsCoordinateLookup.ts` is the catch block `console.error('[POST /essentials/coordinate-lookup] error:', (err as Error).message)` — logs only the error message, never `req.body`/`lat`/`lng`. The route file contains no analytics/telemetry import or call at all (D-08 — zero coordinate-bearing telemetry, satisfied by absence).

## Decisions Made

- See `key-decisions` in frontmatter. Notably: Task 1 did not require a new commit (code already on master — push-only), and check (d) was verified at source level per the plan's documented fallback because Render live-log access was unavailable this session.

## Deviations from Plan

None — plan executed as written. Task 1's `<action>` anticipated a commit+push, but the code was already committed on master from Plans 01/02 (as the orchestrator's context confirmed), so only the push was needed to trigger the deploy; this is a no-op relative to the plan's intent (get the phase-213 code live on `master`), not a scope change.

## Issues Encountered

None blocking. The route returned 404 for the first ~60s after push (pre-deploy), as expected; the deploy-then-poll loop waited for the 404 → 422 transition before running assertions, exactly per the project GOTCHA that a Render build differs from local and must be verified against the live host.

## Caveat / Follow-up

- **(d) no-coordinate-leak was verified at source level only** (no Render live-log dashboard/CLI access this session). The source proof is strong (single error-message-only log statement; no telemetry in the file), but a live-log grep over the smoke window was not performed. If a belt-and-suspenders live-log confirmation is ever wanted, grep the Render logs for `39.17`/`-86.52` over the smoke window — expected: zero hits.

## User Setup Required

None — no external service configuration, no new environment variables. Uses the already-installed `express-rate-limit`.

## Next Phase Readiness

- `POST /api/essentials/coordinate-lookup` is **live and smoke-verified** on `accounts-api.empowered.vote`. The backend-before-frontend hard dependency for Phase 214 (frontend combobox) is satisfied on the coordinate-lookup side.
- RSLV-03 is now complete end-to-end (lib core 213-01 → route 213-02 → live smoke 213-03).
- No blockers. Phase-level verification/completion is handled by the orchestrator.

## Self-Check: PASSED

- FOUND: SUMMARY at `.planning/phases/213-anonymous-coordinate-lookup-endpoint/213-03-SUMMARY.md`
- CONFIRMED: EV-Accounts master pushed — `git rev-list --count origin/master..master` == 0, HEAD `0d4745c7`
- CONFIRMED: live route returns 422 to empty-body POST and 200 to valid Bloomington point (not 404/502)
- CONFIRMED: `SMOKE_OK` printed by the plan's automated verify command
- Operator sign-off: "approved"

---
*Phase: 213-anonymous-coordinate-lookup-endpoint*
*Completed: 2026-07-21*
