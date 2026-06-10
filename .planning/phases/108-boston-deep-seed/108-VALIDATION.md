---
phase: 108
slug: boston-deep-seed
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-10
---

# Phase 108 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | SQL assertions + Supabase MCP queries |
| **Config file** | none — DB-only phase |
| **Quick run command** | `supabase db execute` spot checks |
| **Full suite command** | SELECT count assertions after each migration |
| **Estimated runtime** | ~30 seconds per migration verification |

---

## Sampling Rate

- **After every task commit:** Run quick SELECT assertion for inserted rows
- **After every plan wave:** Run full count + routing verification
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 108-01-01 | 01 | 1 | MA-DEEP-01 | — | N/A | manual | SELECT count(*) FROM essentials.governments WHERE geo_id='2507000' | ✅ | ⬜ pending |
| 108-01-02 | 01 | 1 | MA-DEEP-01 | — | N/A | manual | SELECT count(*) FROM essentials.offices WHERE district_id IN (SELECT id FROM essentials.districts WHERE geo_id='2507000') | ❌ W0 | ⬜ pending |
| 108-02-01 | 02 | 2 | MA-DEEP-03 | — | N/A | manual | SELECT count(*) FROM essentials.districts WHERE district_type='SCHOOL' AND geo_id='2502790' | ❌ W0 | ⬜ pending |
| 108-02-02 | 02 | 2 | MA-DEEP-03 | — | N/A | manual | SELECT count(*) FROM essentials.geofence_boundaries WHERE geo_id='2502790' AND mtfcc='G5420' | ❌ W0 | ⬜ pending |
| 108-03-01 | 03 | 3 | MA-DEEP-02 | — | N/A | manual | SELECT count(*) FROM essentials.politician_images WHERE type='default' AND politician_id IN (Boston officials) | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.* This is a DB-only seeding phase with no new test files — verification is done via SQL assertions against Supabase after each migration.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Boston address returns LOCAL + LOCAL_EXEC section | MA-DEEP-01 | Requires live routing query with address geocoding | Use /representatives/me with a Boston MA address after seeding |
| Boston address returns SCHOOL section | MA-DEEP-03 | Requires live routing query | Use /representatives/me with a Boston MA address after Plan 02 |
| Council district boundaries route correctly | MA-DEEP-01 | Requires ArcGIS boundary load + point-in-polygon test | Test with addresses in each of the 9 council districts |
| Headshots render at 600×750 in UI | MA-DEEP-02 | Visual verification | Navigate to Boston official profile pages in the live app |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
