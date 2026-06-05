---
phase: 91
slug: md-tiger-geofences
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-05
---

# Phase 91 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | SQL (psql / supabase execute_sql) + TypeScript (tsx) |
| **Config file** | none — scripts created in Wave 1 |
| **Quick run command** | `gsd-sdk query execute_sql --file verify-md-tiger-import.sql` |
| **Full suite command** | `npx tsx scripts/smoke-md-geofences.ts` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run SQL row-count assertions
- **After every plan wave:** Run full SQL verify + smoke test
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| Loader config | 01 | 0 | MD-GEO-01 | — | N/A | manual | inspect load-state-tiger-boundaries.ts | ❌ W0 | ⬜ pending |
| Verify script | 01 | 0 | MD-GEO-05 | — | N/A | manual | read verify-md-tiger-import.sql | ❌ W0 | ⬜ pending |
| Smoke test | 01 | 0 | MD-GEO-05 | — | N/A | manual | read smoke-md-geofences.ts | ❌ W0 | ⬜ pending |
| G4110 dry-run | 02 | 1 | MD-GEO-01 | — | N/A | integration | dry-run count assertion | ❌ W0 | ⬜ pending |
| G4020 dry-run | 02 | 1 | MD-GEO-02 | — | N/A | integration | dry-run count = 24 | ❌ W0 | ⬜ pending |
| SLDU dry-run | 02 | 1 | MD-GEO-03 | — | N/A | integration | dry-run count = 47 | ❌ W0 | ⬜ pending |
| SLDL dry-run | 02 | 1 | MD-GEO-03 | — | N/A | integration | dry-run count ~71 | ❌ W0 | ⬜ pending |
| CD dry-run | 02 | 1 | MD-GEO-04 | — | N/A | integration | dry-run count = 8 | ❌ W0 | ⬜ pending |
| Live load | 03 | 2 | MD-GEO-01..04 | — | N/A | integration | execute_sql row counts | ❌ W0 | ⬜ pending |
| SQL verify | 04 | 3 | MD-GEO-05 | — | N/A | integration | verify-md-tiger-import.sql gates pass | ❌ W0 | ⬜ pending |
| Smoke test run | 04 | 3 | MD-GEO-05 | — | N/A | integration | smoke-md-geofences.ts exits 0 | ❌ W0 | ⬜ pending |
| Section split | 04 | 3 | MD-GEO-06 | — | N/A | integration | section split check = 0 rows | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `C:/EV-Accounts/backend/scripts/verify-md-tiger-import.sql` — adapt OR 7-gate verify script for state='24'
- [ ] `C:/EV-Accounts/backend/scripts/smoke-md-geofences.ts` — adapt OR smoke test; Baltimore City (D-01 invariant), Leonardtown (Phase 95 pre-check), rural Garrett County (no LOCAL tier)
- [ ] `load-state-tiger-boundaries.ts` — 4 MD additions: allowlist, city assertions, makevalid flag, EXPECTED_MD_MTFCC block (with TBD counts pending dry-run)

*These scripts must exist before Wave 1 (dry-run) can run.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Baltimore City returns both G4110 (LOCAL) and G4020 (COUNTY) rows | MD-GEO-02 | Dual-tier invariant requires address lookup | smoke-md-geofences.ts Baltimore City address asserts 2 rows |
| Rural unincorporated address returns no LOCAL (G4110) row | MD-GEO-01 | Requires confirmed unincorporated coordinate | smoke-md-geofences.ts Garrett County point asserts 0 G4110 rows |
| SLDL sub-district rows (47A/47B) are separate rows | MD-GEO-03 | Polygon structure must be verified | dry-run count vs expected ~71 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
