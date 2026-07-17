---
phase: 199
slug: az-2026-elections-discovery
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-17
---

# Phase 199 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This is a **data-seed phase with no unit-test framework** — validation is SQL assertions
> inside each migration (`DO $$ … RAISE EXCEPTION`) plus a companion `_apply-migration-137X.ts`
> smoke-test script (VA 322/324/325 precedent). Every success criterion maps to an automated check.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | In-migration `DO $$ … RAISE EXCEPTION` blocks + `_apply-migration-*.ts` (pg smoke tests via `npx tsx`) |
| **Config file** | none — pattern is per-migration |
| **Quick run command** | `cd C:/EV-Accounts && npx tsx backend/scripts/_apply-migration-<N>.ts` |
| **Full suite command** | Re-run each apply script in order (1372→final); all idempotent (row counts stable on re-apply) |
| **Estimated runtime** | ~5–15 seconds per apply script |

---

## Sampling Rate

- **After every task commit:** Run that migration's `_apply-migration-<N>.ts` (executes the `DO $$` verifier)
- **After every plan wave:** Re-run all apply scripts written so far, in order
- **Before `/gsd:verify-work`:** Every apply script green + idempotent (re-run leaves counts unchanged)
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------------|-----------|-------------------|--------|
| Primary election row | elections | 1 | AZ-ELEC-01 | N/A (read-only civic data) | in-migration assert | `election_date='2026-07-21'` for `AZ 2026 Statewide Primary`; AZ election count = 2 | ⬜ pending |
| Statewide + Corp shells | races | 2 | AZ-ELEC-01 | N/A | in-migration assert | 6 statewide position_names, each `office_id NOT NULL`; 1 corp race `seats=2` | ⬜ pending |
| Legislative shells | races | 2 | AZ-ELEC-01 | N/A | in-migration assert | 30 `State Senate District %` + 30 `State House District %` (House `seats=2`); zero NULL office_id | ⬜ pending |
| Local shells (7) | races | 2 | AZ-ELEC-01 | N/A | in-migration assert | exactly 7 local rows; `NOT EXISTS` any `%Pima%Supervisor%` or `%Tucson Ward%`/`Tucson Mayor` | ⬜ pending |
| Race-count total | races | 2 | AZ-ELEC-01 | N/A | in-migration assert | `COUNT(*) races WHERE election_id='e21f5757…'` = 83 (9 existing + 74 new) | ⬜ pending |
| Discovery rows (4) | discovery | 3 | AZ-ELEC-01 | allowlist bounds cron sources | in-migration assert | 4 rows geoid ∈ {`04`,`04019`}; `array_length(allowed_domains,1)=5`; dates ∈ {`2026-07-21`,`2026-11-03`}; no `cron_active` ref | ⬜ pending |
| Ledger + idempotency | all | all | AZ-ELEC-01 | N/A | apply-script | `schema_migrations` has each migration number; re-run → counts unchanged | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase validation: each migration ships its own `DO $$` verifier
  and a `_apply-migration-<N>.ts` smoke test (established OR/VA/MD/AZ 191–198 pattern). No test
  framework to stand up.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| AZ resident sees 2026 ballot in-app | AZ-ELEC-01 | End-to-end UI render is not covered by SQL asserts | After seed, load `/results` for a Pima/Tucson-metro address; confirm statewide + legislative + local 2026 races appear as shells |
| `seats=2` races render correctly | AZ-ELEC-01 | First AZ `seats>1` races; UI/cron assumption unverified (Open Q2) | Confirm a Corp Commission / House `seats=2` race displays without error and doesn't mis-render as single-winner |

---

## Validation Sign-Off

- [x] All tasks have automated in-migration verify or apply-script coverage
- [x] Sampling continuity: every migration self-verifies on apply (no 3-in-a-row gap)
- [x] Wave 0 covers all MISSING references (none — pattern is self-contained)
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-07-17
