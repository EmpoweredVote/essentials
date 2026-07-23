---
phase: 110
slug: ma-2026-elections
status: draft
nyquist_compliant: true
nyquist_rationale: "Inline SQL DO blocks in each migration (post-verify section) serve as automated gate enforcement — RAISE EXCEPTION on any count mismatch fires at apply time."
wave_0_complete: true
created: 2026-06-11
---

# Phase 110 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | SQL post-verification DO blocks (project pattern) |
| **Config file** | None — inline in migration files |
| **Quick run command** | Apply migration via apply script, read smoke test output |
| **Full suite command** | NULL office_id check + race count checks per plan |
| **Estimated runtime** | ~30 seconds per migration |

---

## Sampling Rate

- **After every task commit:** Run apply script smoke tests for that migration
- **After every plan wave:** Check MA race counts and NULL office_id counts
- **Before `/gsd:verify-work`:** Full suite SQL checks must return expected counts
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| Assert elections | 01 | 1 | MA-ELECTIONS-01 | — | N/A | smoke | `SELECT COUNT(*) FROM essentials.elections WHERE state='MA' AND name LIKE '2026 Massachusetts%'` → 2 | ✅ apply script | ⬜ pending |
| Assert discovery | 01 | 1 | MA-ELECTIONS-04 | — | N/A | smoke | `SELECT COUNT(*) FROM essentials.discovery_jurisdictions WHERE state='MA' AND jurisdiction_geoid='25'` → 2 | ✅ apply script | ⬜ pending |
| NULL office_id fix | 01 | 1 | MA-ELECTIONS-02 | T-110-01 | UPDATE scoped to WHERE office_id IS NULL | smoke | `SELECT COUNT(*) FROM essentials.races r JOIN essentials.elections e ON r.election_id=e.id WHERE e.state='MA' AND r.office_id IS NULL` → 0 | ✅ DO block + apply script | ⬜ pending |
| Statewide races seed | 01 | 1 | MA-ELECTIONS-02 | — | N/A | smoke | `SELECT COUNT(*) ... WHERE e.name='2026 Massachusetts General Election' AND r.position_name IN ('Governor of Massachusetts','U.S. Senate Massachusetts','U.S. House MA-01'...)` → 11 | ✅ DO block + apply script | ⬜ pending |
| Healey race_candidates | 01 | 1 | MA-ELECTIONS-02 | — | N/A | smoke | `SELECT COUNT(*) FROM essentials.race_candidates rc JOIN essentials.races r ON rc.race_id=r.id JOIN essentials.elections e ON r.election_id=e.id WHERE e.state='MA' AND r.position_name='Governor of Massachusetts' AND rc.politician_id='7cf1080e-6e7e-4f5b-be00-6fb170896a7c'` → 1 | ✅ apply script | ⬜ pending |
| 200 legislative races | 02 | 2 | MA-ELECTIONS-03 | — | N/A | smoke | `SELECT COUNT(*) FROM essentials.races r JOIN essentials.elections e ON r.election_id=e.id WHERE e.state='MA' AND e.name='2026 Massachusetts General Election' AND (r.position_name LIKE 'MA State Senate%' OR r.position_name LIKE 'MA House%')` → 200 | ✅ DO block + apply script | ⬜ pending |
| NULL office_id post-leg | 02 | 2 | MA-ELECTIONS-03 | — | N/A | smoke | `SELECT COUNT(*) FROM essentials.races r JOIN essentials.elections e ON r.election_id=e.id WHERE e.state='MA' AND r.office_id IS NULL` → 0 | ✅ DO block | ⬜ pending |
| Landing.jsx Boston | 03 | 3 | MA-ELECTIONS-01 | — | N/A | file | `grep "Boston" src/pages/Landing.jsx` shows browseGovernmentList: ['2507000'] | manual verify | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Post-verification DO blocks in migrations 357 and 358 (gates: NULL office_id = 0, statewide/federal race count = 11, legislative race count = 200)
- [x] Apply script smoke tests for both migrations (4 tests each)
- [x] Pre-condition asserts: elections count = 2, discovery_jurisdictions count = 2

*Wave 0 verification infrastructure IS the inline SQL DO blocks. Each migration's post-verify block fires `RAISE EXCEPTION` on any count mismatch at apply time — canonical project test pattern.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Landing.jsx Boston entry renders | MA-ELECTIONS-01 | Requires live UI | Load the elections landing page, verify Boston appears as a city browse option |
| Governor race visible on Healey profile | MA-ELECTIONS-02 | Requires live UI | Navigate to Maura Healey politician profile, verify 2026 Governor race appears in Elections section |
| MA legislative races visible | MA-ELECTIONS-03 | Requires live UI + MA address | Enter a Massachusetts state address, verify Elections tab shows state legislature races |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
