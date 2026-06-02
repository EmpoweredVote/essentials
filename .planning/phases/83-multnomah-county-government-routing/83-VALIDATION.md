---
phase: 83
slug: multnomah-county-government-routing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-31
---

# Phase 83 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | tsx smoke scripts (project standard) |
| **Config file** | none (scripts use dotenv) |
| **Quick run command** | `npx tsx scripts/smoke-multnomah-county.ts` |
| **Full suite command** | `npx tsx scripts/smoke-multnomah-county.ts` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsx scripts/smoke-multnomah-county.ts`
- **After every plan wave:** Run `npx tsx scripts/smoke-multnomah-county.ts`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 83-01-01 | 01 | 1 | COUNTY-01 | — | N/A (public data) | sql-gate | `SELECT COUNT(*) FROM essentials.governments WHERE name = 'Multnomah County, Oregon, US'` | ❌ W0 | ⬜ pending |
| 83-01-02 | 01 | 1 | COUNTY-02 | — | N/A (public data) | sql-gate | `SELECT COUNT(*) FROM essentials.offices o JOIN essentials.districts d ON o.district_id=d.id WHERE d.geo_id='41051'` | ❌ W0 | ⬜ pending |
| 83-01-03 | 01 | 1 | ROUTING-01 | — | N/A (public data) | smoke | `npx tsx scripts/smoke-multnomah-county.ts` | ❌ W0 | ⬜ pending |
| 83-02-01 | 02 | 2 | COUNTY-03 | — | N/A (public data) | sql-gate | `SELECT COUNT(*) FROM essentials.politician_images pi JOIN essentials.politicians p ON pi.politician_id=p.id WHERE p.external_id LIKE '-41000%'` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/smoke-multnomah-county.ts` — covers ROUTING-01 (Portland + unincorporated coordinate tests); queries essentials DB directly

*SQL gates for COUNTY-01 and COUNTY-02 are embedded in migration 244 as post-verification DO blocks.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| All 6 headshots display correctly in UI | COUNTY-03 | Visual quality check (crop, no distortion, faces visible) | Load a Multnomah County address in the app; inspect commissioner cards for photos at correct aspect ratio |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
