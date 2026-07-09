---
phase: 191
slug: arizona-state-federal-government
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-08
---

# Phase 191 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This is a DB data-seeding phase — validation is SQL-based (psql against production),
> not an automated unit-test suite (same model as NV 159).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual SQL verification via `psql` (no automated test suite for DB-seeding phases) |
| **Config file** | none — `DATABASE_URL` in `C:/EV-Accounts/backend/.env`; psql at `C:/Program Files/PostgreSQL/18/bin/psql` (PostgreSQL 18.1) |
| **Quick run command** | `psql "$DATABASE_URL" -tAc "<per-task assertion>"` |
| **Full suite command** | The Plan 03 Task 1 audit block (11 assertions) + section-split query |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run that task's `<automated>` psql assertion.
- **After every plan wave:** Re-run the section-split query for state='AZ' (must stay 0).
- **Before phase close (`/gsd:verify-work`):** Plan 03 Task 1 full audit must be all-green.
- **Max feedback latency:** ~5 seconds (single psql round-trip).

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 191-01-01 | 01 | 1 | AZ-STATE-01 | T-191-03 | Pre-check gate: -4004001..-4004007 free before any write; abort on collision | sql | `psql "$DATABASE_URL" -tAc "SELECT (SELECT count(*) FROM essentials.governments WHERE geo_id='04')=1 AND (SELECT count(*) FROM essentials.politicians WHERE external_id BETWEEN -4004007 AND -4004001)=0"` | N/A (read-only) | ⬜ pending |
| 191-01-02 | 01 | 1 | AZ-STATE-01 | T-191-01 / T-191-02 | Idempotent guarded INSERT; INSERT-only, no UPDATE/DELETE of existing rows | sql | `psql "$DATABASE_URL" -tAc "SELECT (SELECT count(*) FROM essentials.politicians WHERE external_id BETWEEN -4004007 AND -4004001)=7 AND (SELECT count(*) FROM essentials.offices o JOIN essentials.districts d ON d.id=o.district_id WHERE d.district_type='STATE_EXEC' AND d.state='AZ' AND d.label='Arizona Corporation Commission')=5 AND (SELECT max(version::int) FROM supabase_migrations.schema_migrations)=1282"` | N/A | ⬜ pending |
| 191-01-03 | 01 | 1 | AZ-STATE-01 | T-191-04 | Licensed headshots only; photo_license recorded per image | sql+image | `psql "$DATABASE_URL" -tAc "SELECT count(*) FROM essentials.politician_images pi JOIN essentials.politicians p ON p.id=pi.politician_id WHERE p.external_id BETWEEN -4004007 AND -4004001 AND pi.url IS NOT NULL"` (>=6) + script 600x750 dimension assert | N/A | ⬜ pending |
| 191-02-01 | 02 | 1 | AZ-STATE-02 | T-191-07 | UUID resolved by external_id (no mis-bind); dims asserted | sql/script | `python "C:/EV-Accounts/backend/scripts/_tmp-az-house-headshots.py"` exits 0 | N/A | ⬜ pending |
| 191-02-02 | 02 | 1 | AZ-STATE-02 | T-191-06 / T-191-09 | Guarded INSERT; Grijalva excluded; audit-only (no register) | sql | `psql "$DATABASE_URL" -tAc "SELECT (SELECT count(*) FROM essentials.politician_images pi JOIN essentials.politicians p ON p.id=pi.politician_id WHERE p.external_id IN (-4001,-4002,-4003,-4004,-4005,-4006,-4007,-4008,-4009) AND pi.url IS NOT NULL)=9 AND (SELECT max(version::int) FROM supabase_migrations.schema_migrations)<>1284"` | N/A | ⬜ pending |
| 191-03-01 | 03 | 2 | AZ-STATE-01, AZ-STATE-02 | T-191-01..09 | Full goal-backward audit; section-split=0; no collision no-op | sql | Plan 03 Task 1 verify block (11-assertion audit) | N/A | ⬜ pending |
| 191-03-02 | 03 | 2 | AZ-STATE-01, AZ-STATE-02 | T-191-10 / T-191-11 | Human identity spot-check + Presmyk resolution (row-count cannot detect wrong-but-present image) | manual | checkpoint:human-verify (browse link + CD smoke) | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*None — this is a DB seeding phase with no test files to create. Existing psql infrastructure (DATABASE_URL + PostgreSQL 18.1) covers all phase requirements. The Task 1 pre-check gate in Plan 01 substitutes for a Wave 0 scaffold.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Headshot identity is the RIGHT person (not a placeholder/wrong-person image) | AZ-STATE-01, AZ-STATE-02 | A DB row-count confirms an image EXISTS but cannot confirm WHO it depicts | Plan 03 Task 2: visual spot-check at `results?browse_state_officials=AZ&browse_label=Arizona` + CD smoke addresses |
| Presmyk headshot licensed source | AZ-STATE-01 | No confirmed licensed source at plan time (asmi.az.gov WAF-403; no Wikimedia portrait) | Plan 03 Task 2: operator provides source URL or defers (NV 159 Andy Matthews precedent) |
| Corporation Commission renders as ONE collegial body (not 5 scattered execs) | AZ-STATE-01 | Grouping/visual presentation is UI-rendered, not a raw DB assertion | Plan 03 Task 2: confirm the 5 commissioners group under one Corporation Commission heading |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or are the explicit human-verify checkpoint (191-03-02)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (every auto task has a psql/script assertion)
- [x] Wave 0 covers all MISSING references (none — DB seeding phase; pre-check gate substitutes)
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-07-08
