---
phase: 185
slug: washco-2026-elections-discovery
status: draft
nyquist_compliant: false
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

| Requirement | Behavior | Test Type | Automated Command | File Exists | Status |
|-------------|----------|-----------|-------------------|-------------|--------|
| WM-ELEC-01 | Race rows exist, each linked to a pre-existing `office_id`; 0 with NULL office_id; 0 with non-NULL `primary_party` (antipartisan) | DB assertion (`DO $$ ... RAISE EXCEPTION`) embedded in races migration | `_apply-migration-<races>.ts` | ✅ (pattern established) | ⬜ pending |
| WM-ELEC-01 | `discovery_jurisdictions` has exactly 8 new OR rows, all `election_date='2026-11-03'`, `state`-cased per existing OR rows | DB assertion embedded in discovery migration | `_apply-migration-<discovery>.ts` | ✅ | ⬜ pending |
| WM-ELEC-01 | 0 school-board race rows for any of the 5 west-metro G5420 districts | DB assertion (negative check) added to races migration post-verify block | `_apply-migration-<races>.ts` | ❌ W0 (3-line addition to existing pattern) | ⬜ pending |
| WM-ELEC-01 | `race_candidates` rows attach only confirmed candidates; no fabricated names; headshots 600×750 where a source photo exists | DB assertion (count matches confirmed slate) + manual headshot spot-check | `_apply-migration-<candidates>.ts` | ✅ | ⬜ pending |
| WM-ELEC-01 | 1 real discovery run completes with `status='completed'`, `error_message IS NULL` | Live smoke test (POST trigger + poll `discovery_runs`) | `curl -X POST .../api/admin/discover/jurisdiction/:id` + poll | ✅ (Phase 167 Plan 03 pattern) | ⬜ pending |
| WM-ELEC-01 | `/elections` returns the seeded races for a known west-metro address | Manual UAT | Load `/elections` for a Beaverton/Hillsboro address | ❌ W0 (no automated E2E for this page; human-verify) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Live re-verify the exact stored `name`/`state` casing of the pre-existing OR 2026 General election row (`SELECT name, state FROM essentials.elections WHERE election_date='2026-11-03'`) before writing the races migration FK subquery.
- [ ] Live re-verify the on-disk migration counter (`ls migrations | sort -n | tail`) — RESEARCH found it already advanced to 1211 (next = 1212); parallel workstreams may advance it again.
- [ ] Direct-fetch each unresolved city's own elections page (Hillsboro, Tigard, Forest Grove, Sherwood, Tualatin Pos1/Pos3) for the actual filed candidate list — 16 of 25 races have no independently-confirmed Nov 2026 candidate yet.
- [ ] Add the "0 school-board races" negative assertion to the races migration post-verify block.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `/elections` shows correct 2026 races for a west-metro address | WM-ELEC-01 | No automated E2E test exists for the `/elections` page in this codebase | Load `/elections` with a Beaverton and a Hillsboro address; confirm county-commission + city-council races appear |
| Candidate headshots render at 600×750 4:5 without distortion | WM-ELEC-01 | Visual quality cannot be asserted programmatically | Spot-check each ingested candidate's `politician_images` render |

---

## Validation Sign-Off

- [ ] All tasks have an embedded DB assertion, a smoke-test command, or a Wave 0 dependency
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (election-row casing, live counter, unresolved candidate slates, school-board negative assertion)
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter (by planner once map is complete)

**Approval:** pending
