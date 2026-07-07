---
phase: 167-nv-2026-elections-discovery
plan: 03
subsystem: database
tags: [postgres, migrations, elections, nevada, discovery]

# Dependency graph
requires:
  - phase: 167-02
    provides: 63 NV 2026 race rows in production (the target scaffold for candidate discovery)
provides:
  - essentials.discovery_jurisdictions row for NV (geoid '32', election_date='2026-11-03', Ballotpedia source_url, 4-domain allowed_domains)
  - migration 1113 applied to live Supabase DB (commit 2c3398a8 in C:/EV-Accounts)
  - discovery_runs row 1e5a2041-8d6c-4334-90e8-1fcdfdf56f15 with status='completed', candidates_found=32, error_message NULL
affects:
  - 168-nv-retro (Phase 168 retrospective — discovery pipeline is now live for NV; surface in coverage.js)
  - future NV discovery re-triggers (must use accounts-api.empowered.vote, NOT stale accounts-api.onrender.com)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "discovery_jurisdictions INSERT: ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING; no schema_migrations ledger INSERT; no cron_active column (D-05/D-08)"
    - "Discovery trigger: POST https://accounts-api.empowered.vote/api/admin/discover/jurisdiction/:id with X-Admin-Token header; 202 async fire-and-forget; poll discovery_runs for completion"
    - "Admin token is env-only (ADMIN_INGEST_TOKEN in C:/EV-Accounts/backend/.env) — never hardcoded or logged"
    - "Live custom domain accounts-api.empowered.vote is authoritative; accounts-api.onrender.com returns 404 (dead hostname)"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/1113_nv_2026_discovery.sql
    - C:/EV-Accounts/backend/scripts/_apply-migration-1113.ts
  modified: []

key-decisions:
  - "Use accounts-api.empowered.vote (custom domain) not accounts-api.onrender.com — the Render hostname returns 404; RESEARCH.md had the wrong host hardcoded"
  - "Admin token supplied via $ADMIN_INGEST_TOKEN env only; appears in no committed file, plan, or summary (T-167-03-TOKEN mitigated)"
  - "An earlier run (5cfb8f3f) failed on exhausted Anthropic API credits; credits were topped up and a second run (1e5a2041) completed successfully with 32 candidates found"
  - "candidates_found=32 exceeds the D-03 acceptance bar (zero is acceptable); discovery is working end-to-end"
  - "No schema_migrations ledger INSERT — matches 1109/1111/1112 pattern; on-disk counter authoritative (next migration 1114)"

patterns-established:
  - "NV discovery re-trigger pattern: POST https://accounts-api.empowered.vote/api/admin/discover/jurisdiction/3ed5ce95-fc7d-4eb8-b5e6-0c6e7b746f46 with X-Admin-Token from env; poll discovery_runs for status='completed'"

requirements-completed: [NV-ELEC-01]

# Metrics
duration: ~45min (includes human-verify gate wait for API credit top-up + second run)
completed: 2026-06-29
---

# Phase 167 Plan 03: NV Discovery Jurisdiction Seed + Test Run — Summary

**Migration 1113 seeded 1 NV discovery_jurisdictions row (geoid='32', Nov 2026, Ballotpedia source, 4-domain allowed_domains); real discovery run completed with 32 candidates found and error_message NULL — D-03 acceptance bar met**

## Performance

- **Duration:** ~45 min (includes blocking human-verify gate for Anthropic API credit top-up)
- **Started:** 2026-06-29T22:40:00Z
- **Completed:** 2026-06-29T23:04:46Z (discovery_runs.completed_at)
- **Tasks:** 2 (Task 1 migration write/apply + Task 2 discovery trigger — human-verify gate)
- **Files modified:** 2 (migration SQL committed; apply script gitignored)

## Accomplishments

- Migration 1113 applied to live production Supabase DB — exactly one `essentials.discovery_jurisdictions` row for NV now exists
- Row carries: jurisdiction_geoid='32', jurisdiction_name='State of Nevada', state='NV', election_date='2026-11-03', source_url='https://ballotpedia.org/Nevada_elections,_2026', allowed_domains=['ballotpedia.org','nvsos.gov','nevada.gov','leg.state.nv.us'] — all verified by smoke tests
- Idempotency confirmed — ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING; re-running keeps count at 1
- Real discovery run triggered against the live Render backend (accounts-api.empowered.vote) and completed: discovery_runs.id=1e5a2041-8d6c-4334-90e8-1fcdfdf56f15, status='completed', candidates_found=32, error_message=NULL
- D-03 acceptance bar fully met; NV candidate discovery pipeline is live
- Admin token was env-only throughout — appears in no committed file, log, or artifact

## Task Commits

1. **Task 1: Write migration 1113 (NV discovery_jurisdictions row) + paired apply/smoke script** - `2c3398a8` in C:/EV-Accounts (feat)
2. **Task 2: Trigger one real NV discovery run** — no file commit (live HTTP call + DB poll only; human-verify gate)

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/1113_nv_2026_discovery.sql` — Idempotent INSERT of NV discovery_jurisdictions row; ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING; DO $$ post-verify block; no ledger INSERT; no cron_active column
- `C:/EV-Accounts/backend/scripts/_apply-migration-1113.ts` — Apply + smoke-test harness: 5 checks (NV row count=1, election_date=2026-11-03, allowed_domains length=4, source_url=Ballotpedia URL, jurisdiction_geoid=32); gitignored (not committed)

## Decisions Made

- **Host correction — accounts-api.empowered.vote not accounts-api.onrender.com**: The RESEARCH.md and PLAN.md hardcoded the stale Render hostname, which returns 404 (no server). The working host is the live custom domain `https://accounts-api.empowered.vote`. All future NV discovery re-triggers must use this hostname.
- **Admin token env-only**: The ADMIN_INGEST_TOKEN was read from `C:/EV-Accounts/backend/.env` and passed as the X-Admin-Token header. It was never hardcoded, echoed, or committed. The threat T-167-03-TOKEN mitigation is confirmed.
- **First run failure, second run success**: An earlier discovery run (id 5cfb8f3f) was triggered but failed mid-run due to exhausted Anthropic API credits. After a credit top-up, a second run (id 1e5a2041) was triggered and completed with candidates_found=32 and error_message=NULL.
- **NV discovery_jurisdictions UUID**: 3ed5ce95-fc7d-4eb8-b5e6-0c6e7b746f46 — this is the canonical UUID for future NV discovery re-triggers.

## Deviations from Plan

### Auto-noted Corrections

**1. [Host Correction] Discovery endpoint hostname differs from PLAN.md**
- **Found during:** Task 2 (trigger live discovery run)
- **Issue:** PLAN.md and RESEARCH.md hardcoded `accounts-api.onrender.com` as the discovery trigger URL, which returns 404 (the Render subdomain is no longer the live host)
- **Correct host:** `https://accounts-api.empowered.vote` (live custom domain on Render)
- **Fix:** Operator used the correct host when triggering the run; this SUMMARY records the correction for all future NV discovery work
- **Impact:** No files changed; documentation corrected here

---

**Total deviations:** 1 (host correction, documentation-only)
**Impact on plan:** No scope change. The migration was applied exactly as written. The discovery run succeeded on the correct host.

## Discovery Run Details

| Field | Value |
|-------|-------|
| discovery_runs.id | 1e5a2041-8d6c-4334-90e8-1fcdfdf56f15 |
| discovery_jurisdiction_id | 3ed5ce95-fc7d-4eb8-b5e6-0c6e7b746f46 |
| status | completed |
| candidates_found | 32 |
| error_message | NULL |
| completed_at | 2026-06-29 23:04:46 UTC |
| Prior failed run | 5cfb8f3f (exhausted API credits before top-up) |

## Issues Encountered

- **Anthropic API credits exhausted mid-first-run**: The first discovery run (5cfb8f3f) hit the rate limit / credit cap and failed before completing. The operator added API credits; a second run (1e5a2041) completed cleanly with 32 candidates found. This is normal operational risk for the discovery pipeline, not a code or config defect.
- **Stale hostname in plan artifacts**: RESEARCH.md and PLAN.md had `accounts-api.onrender.com` hardcoded. The correct live host is `accounts-api.empowered.vote`. Noted as a correction for future work; no code change required.

## Known Stubs

None — the discovery pipeline is fully live. The 32 candidates found are stored in the discovery system; ingestion into `essentials.candidates` is a downstream operation (Phase 168 and beyond).

## Threat Flags

No new externally-reachable surface introduced beyond what was already documented in the threat model. T-167-03-TOKEN (admin token disclosure) was fully mitigated — token is env-only, in no committed artifact.

## Next Phase Readiness

- Phase 168 (Nevada Playbook Retrospective & Close) can proceed — NV-ELEC-01 is fully satisfied
- NV discovery pipeline is live: 1 discovery_jurisdictions row + confirmed completed discovery run
- Next migration counter is **1114**
- Future NV discovery re-triggers: `POST https://accounts-api.empowered.vote/api/admin/discover/jurisdiction/3ed5ce95-fc7d-4eb8-b5e6-0c6e7b746f46` with X-Admin-Token from $ADMIN_INGEST_TOKEN env

## Self-Check: PASSED

- [x] `C:/EV-Accounts/backend/migrations/1113_nv_2026_discovery.sql` — confirmed created and applied (commit 2c3398a8)
- [x] Commit `2c3398a8` exists in C:/EV-Accounts master branch (confirmed by orchestrator)
- [x] discovery_runs row 1e5a2041 shows status='completed', candidates_found=32, error_message=NULL (confirmed by orchestrator DB query)
- [x] No admin token in any committed file, plan, or summary — confirmed
- [x] ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING present in migration — confirmed by plan spec
- [x] No cron_active column reference in migration — confirmed by plan spec (D-05)
- [x] No schema_migrations ledger INSERT — confirmed by plan spec (D-08)
- [x] Next migration counter is 1114

---
*Phase: 167-nv-2026-elections-discovery*
*Completed: 2026-06-29*
