---
phase: 69
slug: landing-elections-discovery
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-28
---

# Phase 69 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | SQL smoke queries via Supabase MCP |
| **Config file** | none — all validation via direct DB queries |
| **Quick run command** | `mcp__supabase-local__execute_sql` — run per-plan smoke query |
| **Full suite command** | Run all 4 smoke query blocks from RESEARCH.md §Validation Architecture |
| **Estimated runtime** | ~10 seconds per query |

---

## Sampling Rate

- **After every task commit:** Run the plan's SQL smoke query
- **After every plan wave:** Run full smoke query suite (all 4 blocks)
- **Before `/gsd-verify-work`:** All 4 smoke queries must return expected row counts
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 69-01-01 | 01 | 1 | CITIES-07 | — | N/A | manual | Verify 7 CA city cards appear in Landing.jsx COVERAGE_AREAS | ✅ Landing.jsx | ⬜ pending |
| 69-02-01 | 02 | 1 | ELECT-01 | — | N/A | sql | `SELECT name FROM essentials.elections WHERE state='CA' AND jurisdiction_level='state'` → 2 rows | ✅ DB | ⬜ pending |
| 69-02-02 | 02 | 1 | ELECT-02 | — | N/A | sql | `SELECT election_id, office_id FROM essentials.races WHERE id='bc936a36-...'` → general election UUID + governor office_id | ✅ DB | ⬜ pending |
| 69-03-01 | 03 | 2 | ELECT-03 | — | N/A | sql | `SELECT COUNT(*) FROM essentials.races WHERE election_id=(SELECT id FROM essentials.elections WHERE name='CA 2026 Statewide General') AND position_name LIKE 'U.S. Representative%'` → 52 | ✅ DB | ⬜ pending |
| 69-04-01 | 04 | 2 | ELECT-04 | — | N/A | sql | `SELECT COUNT(*) FROM essentials.discovery_jurisdictions WHERE jurisdiction_geoid IN ('0667000','0668000','0664000','0606000','0626000','0666000','06')` → 7 | ✅ DB | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test stubs needed — all verification is SQL smoke queries run immediately after each migration via the Supabase MCP tool.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 7 CA city cards visible on Landing page | CITIES-07 | UI rendering requires browser | Load essentials.empowered.vote, verify SF / San Jose / Sacramento / Berkeley cards appear alongside LA / SD / Fremont |
| SF/SJ/SAC/Berkeley cards navigate to /results | CITIES-07 | Browser interaction | Click each new city card; verify URL contains `browse_government_list=0667000` etc. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
