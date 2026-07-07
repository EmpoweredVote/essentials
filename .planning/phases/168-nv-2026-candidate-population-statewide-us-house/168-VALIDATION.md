---
phase: 168
slug: nv-2026-candidate-population-statewide-us-house
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-29
---

# Phase 168 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | tsx smoke harness (TypeScript, no jest/vitest) |
| **Config file** | `_apply-migration-1114.ts` (created in Wave 0 alongside the SQL) |
| **Quick run command** | `node node_modules/tsx/dist/cli.mjs scripts/_apply-migration-1114.ts` (from `C:/EV-Accounts/backend`) |
| **Full suite command** | Same — single smoke-harness file |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run the apply/smoke harness against the live DB
- **After every plan wave:** Re-run the harness (idempotency re-run proves no duplicates)
- **Before `/gsd:verify-work`:** Harness green + manual `/elections` UAT
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 168-W0 | pre-check | 0 | NV-CAND-01 | — | Resolve 10 race UUIDs + incumbent/cross-office politician_ids via live query | query | `psql $DATABASE_URL` race/office/politician resolution | ❌ W0 | ⬜ pending |
| 168-A1 | candidate seed | 1 | NV-CAND-01 | T-168-DATA / — | 10 NV 2026 statewide+House races each have ≥1 active candidate (≥2 for contested) | smoke assertion | `_apply-migration-1114.ts` assert 1 | ❌ W0 | ⬜ pending |
| 168-A2 | candidate seed | 1 | NV-CAND-01 | — | No `is_incumbent=true` row for open-seat races (AG, Treasurer, any open House seat) | smoke assertion | `_apply-migration-1114.ts` assert 2 | ❌ W0 | ⬜ pending |
| 168-A3 | candidate seed | 1 | NV-CAND-01 | — | Idempotency — re-run inserts 0 rows (NOT EXISTS race_id, full_name) | smoke assertion | `_apply-migration-1114.ts` assert 3 | ❌ W0 | ⬜ pending |
| 168-A4 | candidate seed | 1 | NV-CAND-01 | — | All NV 2026 race_candidates have `candidate_status='active'` | smoke assertion | `_apply-migration-1114.ts` assert 4 | ❌ W0 | ⬜ pending |
| 168-A5 | candidate seed | 1 | NV-CAND-01 | T-168-SCOPE / — | Linked incumbents/cross-office carry a valid `politician_id`; challengers NULL | smoke assertion | `_apply-migration-1114.ts` assert 5 | ❌ W0 | ⬜ pending |
| 168-H1 | headshots | 2 | NV-CAND-01 | — | Challenger headshots fetched (or honest-skip recorded); 600×750 4:5, no graphics | manual + count | headshot count + honest-skip ledger | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `_apply-migration-1114.ts` — apply + the smoke assertions above (per-race candidate count, no-incumbent-on-open-seat, idempotency, candidate_status='active', politician_id linkage)
- [ ] Live race_id UUID resolution query (race_ids are `gen_random_uuid()` from mig 1112 — cannot be predicted; MUST resolve before writing migration VALUES)
- [ ] Live politician_id resolution for incumbents + cross-office candidates (Lombardo, Anthony, Aguilar, Matthews, Titus, Lee, Horsford, and cross-office Ford / Cannizzaro / Buck)

*Race_id and politician_id live-resolution is the mandatory Wave-0 gate — the seed migration cannot be authored without it.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live `/elections` page for a NV (Las Vegas) address shows real candidates under each of the 10 races (Governor no longer blank) | NV-CAND-01 | End-to-end render across deployed frontend+backend; no headless harness | Load `essentials.empowered.vote/elections` with a Las Vegas NV address; confirm candidates appear under Governor + the other 9 races |
| Challenger headshots render at correct crop/quality | NV-CAND-01 | Visual judgment | Spot-check a few challenger cards for 4:5 crop, eyes ~⅓, no superimposed graphics |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (race_id + politician_id resolution, smoke harness)
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
