---
phase: 167
slug: nv-2026-elections-discovery
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-29
---

# Phase 167 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This phase ships SQL migrations + one discovery HTTP run — there is NO JS/py unit-test
> framework. Validation = per-migration `_apply-migration-NNN.ts` smoke tests (assert row
> counts / column values against the LIVE DB) + direct SQL-query assertions + the
> `discovery_runs.status` check. That is the feedback signal, sampled per task.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (no unit-test runner). Apply-script smoke tests (tsx) + raw SQL assertions via psql / Supabase MCP |
| **Config file** | none — each migration ships a paired `C:/EV-Accounts/backend/scripts/_apply-migration-NNN.ts` |
| **Quick run command** | `node node_modules/tsx/dist/cli.mjs scripts/_apply-migration-NNN.ts` (run from `C:/EV-Accounts/backend`) |
| **Full suite command** | Re-run all three apply scripts (1111/1112/1113) — idempotent (`NOT EXISTS` guards), re-run keeps counts stable |
| **Estimated runtime** | ~5–10s per migration apply; discovery run ~90s poll for `discovery_runs.status='completed'` |

---

## Sampling Rate

- **After every task commit:** Run that migration's apply script; assert its smoke-test counts pass.
- **After every plan wave:** Re-run the wave's apply scripts to confirm idempotency (counts unchanged).
- **Before `/gsd:verify-work`:** All three migrations applied + the discovery test run shows `status='completed'`.
- **Max feedback latency:** ~90s (discovery poll); migrations are near-instant.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 167-01-01 | 01 | 1 | NV-ELEC-01 | — | N/A | sql-assert | apply 1111 → `SELECT count(*) FROM essentials.elections WHERE name='NV 2026 Statewide General'` = 1 | ❌ W0 | ⬜ pending |
| 167-02-01 | 02 | 2 | NV-ELEC-01 | — | N/A | sql-assert | apply 1112 → 63 NV race rows (6 exec + 11 senate + 42 assembly + 4 house); 0 NULL office_id; 0 non-NULL primary_party | ❌ W0 | ⬜ pending |
| 167-03-01 | 03 | 3 | NV-ELEC-01 | T-167-01 | Admin token required to trigger discovery | sql-assert + http | apply 1113 → 1 NV discovery_jurisdictions row; then `POST /api/admin/discover/jurisdiction/:id` → poll `discovery_runs.status='completed'` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] DB pre-check (Plan 02): `SELECT geo_id FROM essentials.districts WHERE district_type='STATE_UPPER' AND state ILIKE 'nv'` — confirm SLDU geo_id format BEFORE writing race rows (research open question, LOW confidence).
- [ ] DB pre-check (Plan 02): confirm all 6 STATE_EXEC + 4 NATIONAL_LOWER + 42 STATE_LOWER offices resolve via `ILIKE 'nv'` and are active.
- [ ] Confirm `ADMIN_INGEST_TOKEN` is available for the Plan 03 discovery trigger.

*Existing infrastructure (apply-script smoke tests) covers all migration verification.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| A NV address on `/elections` returns the correct 2026 races (criterion #2) | NV-ELEC-01 | End-to-end page render against geofences; no automated harness | Hit `/elections` (or the races API) with a NV address; confirm the seeded statewide + legislative + House races appear for that jurisdiction |
| Discovery run completes against official NV source (criterion #3) | NV-ELEC-01 | Requires live admin-token HTTP call to Render | `POST /api/admin/discover/jurisdiction/:id` with `X-Admin-Token`; poll `discovery_runs.status='completed'` (zero candidates acceptable per D-03) |

---

## Validation Sign-Off

- [ ] All tasks have an apply-script smoke test or SQL assertion or Wave 0 dependency
- [ ] Sampling continuity: each migration self-verifies on apply
- [ ] Wave 0 covers the SLDU geo_id pre-check + office/active pre-checks + admin-token availability
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
