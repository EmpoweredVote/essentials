---
phase: 185
slug: washco-2026-elections-discovery
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-04
---

# Phase 185 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This phase has **no application code** — it is pure SQL migrations plus one live HTTP discovery trigger. Verification is via embedded DB assertions and the established `_apply-migration-<N>.ts` smoke-test harness.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — SQL migrations with embedded `DO $$ ... RAISE EXCEPTION` post-verify blocks + paired tsx smoke-test scripts |
| **Config file** | none |
| **Quick run command** | `node node_modules/tsx/dist/cli.mjs scripts/_apply-migration-<N>.ts` (run from `C:/EV-Accounts/backend`) |
| **Full suite command** | Re-run every phase `_apply-migration-<N>.ts` script for idempotency (each must exit 0 twice: first apply + no-op re-run) |
| **Estimated runtime** | ~10–30 seconds per migration |

---

## Sampling Rate

- **After every task commit:** Run the paired `_apply-migration-<N>.ts` smoke script for that migration.
- **After every plan wave:** Re-run every `_apply-migration-<N>.ts` script in the phase (idempotency check — no rows duplicated on re-apply).
- **Before `/gsd:verify-work`:** Live discovery run must show `status='completed'`, `error_message IS NULL`.
- **Max feedback latency:** ~30 seconds.

---

## Per-Task Verification Map

| Plan / Task | Requirement | Behavior | Test Type | Automated Command | File Exists | Status |
|-------------|-------------|----------|-----------|-------------------|-------------|--------|
| 185-01 T1 | WM-ELEC-01 | Live migration counter + OR 2026 General election row casing re-verified (Wave 0) | Live check | `ls migrations \| sort -n \| tail -1` + `SELECT name,state FROM elections WHERE election_date='2026-11-03'` | n/a (verification) | ⬜ pending |
| 185-01 T2 | WM-ELEC-01 | 25 race rows exist, each linked to a pre-existing office_id; 0 NULL office_id; 0 non-NULL primary_party; 0 school-board races (negative assertion) | DB assertion (`DO $$ ... RAISE EXCEPTION`) embedded in races migration | `_apply-migration-{BASE}.ts` | ✅ (pattern established) | ⬜ pending |
| 185-02 T1 | WM-ELEC-01 | Unresolved-city candidate slates re-fetched; names cited or recorded "0 confirmed" (Wave 0) | Manual re-fetch → verified by T2 citation-coverage assertion | (records names+URLs) | n/a | ⬜ pending |
| 185-02 T2 | WM-ELEC-01 | race_candidates attach only cited candidates; 0 active rows with NULL politician_id; 0 dup full_name per race; every row has a source; reuse candidates share existing rows | DB assertion embedded in candidates migration | `_apply-migration-{BASE+1}.ts` | ✅ | ⬜ pending |
| 185-02 T3 | WM-ELEC-01 | New challengers with a source photo have a 600×750 press_use headshot; no duplicate for reused candidates | DB assertion (image count) + manual visual spot-check | `_apply-migration-{BASE+1}.ts` | ✅ | ⬜ pending |
| 185-03 T1 | WM-ELEC-01 | Exactly 8 OR discovery_jurisdictions rows (election_date 2026-11-03, state 'OR'); 0 school-board rows | DB assertion embedded in discovery migration | `_apply-migration-{BASE+2}.ts` | ✅ | ⬜ pending |
| 185-03 T2 | WM-ELEC-01 | 1 real discovery run completes with `status='completed'`, `error_message IS NULL` | Live smoke test (POST trigger + poll `discovery_runs`) | `POST .../api/admin/discover/jurisdiction/:id` + poll | ✅ (Phase 167 Plan 03 pattern) | ⬜ pending |
| phase gate | WM-ELEC-01 | `/elections` returns the seeded races for a known west-metro address | Manual UAT | Load `/elections` for a Beaverton/Hillsboro address | ❌ (no automated E2E; human-verify) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements (folded into the relevant plans)

- [x] Live re-verify the on-disk migration counter → **185-01 Task 1** (BASE recorded in 185-01 SUMMARY for Plans 02/03).
- [x] Live re-verify the exact stored `name`/`state` casing of the OR 2026 General election row → **185-01 Task 1**.
- [x] Add the "0 school-board races" negative assertion to the races migration post-verify block → **185-01 Task 2**.
- [x] Direct-fetch each unresolved city's own elections page (Hillsboro, Tigard, Forest Grove, Sherwood, Tualatin Pos1/Pos3) for the actual filed candidate list → **185-02 Task 1**.
- [x] Confirm a stable Hillsboro elections URL + Cornelius redirect target → **185-03 Task 1**.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `/elections` shows correct 2026 races for a west-metro address | WM-ELEC-01 | No automated E2E test exists for the `/elections` page in this codebase | Load `/elections` with a Beaverton and a Hillsboro address; confirm county-commission + city-council races appear |
| Candidate headshots render at 600×750 4:5 without distortion | WM-ELEC-01 | Visual quality cannot be asserted programmatically | Spot-check each ingested candidate's `politician_images` render |

---

## Validation Sign-Off

- [x] All tasks have an embedded DB assertion, a smoke-test command, or a Wave 0 dependency
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (election-row casing, live counter, unresolved candidate slates, school-board negative assertion)
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter (by planner once map is complete)

**Approval:** planner-complete (pending execution)
