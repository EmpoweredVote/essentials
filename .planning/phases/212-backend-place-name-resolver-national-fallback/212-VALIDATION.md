---
phase: 212
slug: backend-place-name-resolver-national-fallback
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-20
---

# Phase 212 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^2.1.0 (backend) [VERIFIED: backend/package.json] |
| **Config file** | `C:/EV-Accounts/backend/vitest.config.ts` |
| **Quick run command** | `cd C:/EV-Accounts/backend && npm run test:unit -- <changed test file>` |
| **Full suite command** | `cd C:/EV-Accounts/backend && npm run test` |
| **Estimated runtime** | Quick: ~5-15s per file · Full suite: ~60-120s |

Notes:
- gsd-executor has NO Supabase MCP — live-DB checks (Plans 01, 03) and the phase-gate smoke test (Plan 05) run inline via `psql "$DATABASE_URL"` / `curl` against production, not via MCP. These are the project's standard inline verification convention.
- Unit tests (Plans 02, 04) stub the `pg` pool / `getOverlappingGeoIdsForArea` — no network or live DB.

---

## Sampling Rate

- **After every task commit:** Run the quick run command for the task's test file (unit tasks); for DB/route/live tasks run the task's inline psql/curl `<automated>` check.
- **After every plan wave:** Run the full suite command.
- **Before `/gsd:verify-work`:** Full suite green + the Plan 05 [BLOCKING] live smoke test (8 checks) passed against production.
- **Max feedback latency:** ~15s (single unit file); ~120s (full suite).

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 212-01-01 | 01 | 1 | RSLV-05, RSLV-06 | T-212-02 | Verify (not re-ingest) nationwide G5200/House data before dependent work | live psql | `psql "$DATABASE_URL" -tAc "SELECT count(*) FROM essentials.geofence_boundaries WHERE mtfcc='G5200'"` (>=435) + `... districts WHERE district_type='NATIONAL_LOWER' AND tiger_geoid IS NOT NULL` (>=435) | N/A (read-only audit) | ⬜ pending |
| 212-01-02 | 01 | 1 | RSLV-01, RSLV-02 | T-212-01 | Idempotent IF-NOT-EXISTS DDL; no extension re-create; no population column | file assert | `node -e "...gin_trgm_ops check..."` (both migration files) | ✅ authored here | ⬜ pending |
| 212-02-01 | 02 | 1 | RSLV-02 | T-212-03 | Parameterized upsert (ON CONFLICT); no MCD file; no new deps | unit | `npm run test:unit -- scripts/ingest-gazetteer-places-counties.test.ts` | ✅ W0 (Task 2 creates) | ⬜ pending |
| 212-02-02 | 02 | 1 | RSLV-02 | T-212-03 | Header-skip, USPS→state fidelity, ON CONFLICT DO UPDATE by construction | unit | `npm run test:unit -- scripts/ingest-gazetteer-places-counties.test.ts` | ✅ authored here | ⬜ pending |
| 212-03-01 | 03 | 2 | RSLV-01, RSLV-02 | T-212-06 | Live apply verified via catalog (4 indexes + 2 tables) — false-positive guard | live psql | `psql "$DATABASE_URL" -tAc "SELECT count(*) FROM pg_indexes WHERE indexname IN (...)"` (==4) | N/A (live apply) | ⬜ pending |
| 212-03-02 | 03 | 2 | RSLV-02 | T-212-06 | Live idempotency: second ingest run net-zero-new | live psql | `psql "$DATABASE_URL" -tAc "SELECT (SELECT count(*) FROM essentials.gazetteer_counties), (SELECT count(*) FROM essentials.gazetteer_places)"` | N/A (live run) | ⬜ pending |
| 212-03-03 | 03 | 2 | RSLV-01, RSLV-02 | T-212-08 | Operator confirmation of live schema+data before downstream | manual (blocking) | (human-verify checkpoint — psql catalog + counts) | N/A | ⬜ pending |
| 212-04-01 | 04 | 3 | RSLV-06 | T-212-11 | G5200-only overlap; single-CD geo_id surfaced; zero → honest omit | unit (TDD) | `npm run test:unit -- src/lib/essentialsBrowseService.test.ts` | ✅ W0 (test authored w/ helper) | ⬜ pending |
| 212-04-02 | 04 | 3 | RSLV-01, RSLV-04, RSLV-07 | T-212-09 / T-212-10 / T-212-11 | Parameterized $1/$2; whitelist mapping; state from matched row; name A→Z tiebreak; curated dedupe by id | unit (TDD) | `npm run test:unit -- src/lib/locationSearchService.test.ts` | ✅ W0 (test authored w/ service) | ⬜ pending |
| 212-05-01 | 05 | 4 | RSLV-01, RSLV-04, RSLV-05, RSLV-06 | T-212-13 / T-212-16 | q/geo_id/mtfcc/state validated → 422; reuse fallback fns; single House rep via getPoliticiansByArea; no geocodeAddress | build + grep | `npm run build` + `node -e "...location-search mount check..."` | ✅ authored here | ⬜ pending |
| 212-05-02 | 05 | 4 | RSLV-01, RSLV-05, RSLV-06, RSLV-07 | T-212-14 / T-212-15 | Live: Springfield/Baltimore/Franklin disambiguation, single-CD rep, Gazetteer-only floor, EXPLAIN index scan | manual (blocking) + live curl/psql | 8-check smoke test (see Plan 05 how-to-verify) + `npm run test` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `C:/EV-Accounts/backend/scripts/ingest-gazetteer-places-counties.test.ts` — stubs for RSLV-02 (parsing + ON CONFLICT idempotency-by-construction) — created in Plan 02 Task 2
- [ ] `C:/EV-Accounts/backend/src/lib/locationSearchService.test.ts` — RSLV-01/RSLV-04/RSLV-07 (Springfield/Baltimore/Franklin disambiguation, wrong-state guard, no-geocoder, no-fan-out) — created in Plan 04 Task 2
- [ ] New cases in `C:/EV-Accounts/backend/src/lib/essentialsBrowseService.test.ts` — RSLV-06 getCongressionalOverlapNote (multi-CD / single-CD / zero) — created in Plan 04 Task 1
- [ ] DB pre-flight audit (inline psql, not a test file) confirming Phase 116/125 CD completeness — Plan 01 Task 1

*Framework already present (Vitest ^2.1.0) — no install needed. All new test files are authored inside the plan that owns the code under test (test-first per TDD tasks).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live migration apply + Gazetteer ingest against production | RSLV-01, RSLV-02 | gsd-executor has no Supabase MCP; production DB write must be operator-confirmed (false-positive guard — tsc passes without the live schema) | Plan 03 Task 3: psql catalog (4 trgm indexes), row counts (~3143 counties, tens of thousands of places), spot-check `name ILIKE 'Paradise'` |
| Deployed endpoint disambiguation + national floor | RSLV-01, RSLV-05, RSLV-06, RSLV-07 | Requires the deployed accounts-api (Render, push to master) + live DB + EXPLAIN; cannot be asserted in unit tests | Plan 05 Task 2: 8 live curl/psql checks incl. Springfield/Baltimore/Franklin, single-CD House rep, Gazetteer-only floor, EXPLAIN index scan |

*The unit-testable behaviors (parsing, ranking, disambiguation logic, overlap filtering, input validation) all have automated Vitest coverage; only live-DB apply and deployed-endpoint behavior are manual, by project convention (no MCP for the executor).*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (unit tasks: Vitest; live/DB/route tasks: inline psql/curl/build; two blocking human-verify checkpoints cover the non-automatable live-production steps)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (every code task has an automated command; the two manual checkpoints are each preceded by automated-verify tasks)
- [x] Wave 0 covers all MISSING references (3 test files + 1 pre-flight audit enumerated above; each authored in its owning plan)
- [x] No watch-mode flags (all commands are `run`/one-shot; `npm run test`/`test:unit` are non-watch)
- [x] Feedback latency < 120s (quick unit ~15s; full suite ~120s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-07-20
</content>
