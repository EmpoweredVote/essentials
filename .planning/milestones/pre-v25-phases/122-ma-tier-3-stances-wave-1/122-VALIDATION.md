---
phase: 122
slug: ma-tier-3-stances-wave-1
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-14
---

# Phase 122 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | SQL migration verification (Supabase MCP) |
| **Config file** | none — migrations applied via mcp__supabase-local__apply_migration |
| **Quick run command** | `SELECT COUNT(*) FROM inform.politician_answers WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = '{id}') AND answer IS NOT NULL;` |
| **Full suite command** | Pre-check + post-check SQL queries per plan |
| **Estimated runtime** | ~30 seconds per politician |

---

## Sampling Rate

- **After every task commit:** Run citation spot-check query for applied politician
- **After every plan wave:** Run full coverage query for all politicians in that plan
- **Before `/gsd:verify-work`:** All politicians must have attempted rows (non-null or blank-spoke documented)
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 122-01-01 | 01 | 1 | NEWTON-03 | — | No uncited stance values | SQL | `SELECT COUNT(*) FROM inform.politician_answers WHERE politician_id=... AND citation_url IS NULL AND answer IS NOT NULL` | ✅ | ⬜ pending |
| 122-02-01 | 02 | 2 | SOMERVILLE-03 | — | No uncited stance values | SQL | Same pattern for Somerville politicians | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Verify migration 597 applied status: `SELECT version FROM supabase_migrations.schema_migrations WHERE version = '597'`
- [ ] Verify active compass topic count: `SELECT COUNT(*) FROM inform.compass_topics WHERE is_active = true`
- [ ] Pre-check existing Newton/Somerville stance rows: `SELECT COUNT(*) FROM inform.politician_answers pa JOIN essentials.politicians p ON pa.politician_id = p.id WHERE p.external_id LIKE '-2545560%' OR p.external_id LIKE '-2562535%'`
- [ ] Resolve Newton politician UUIDs from external_ids (-2545560001 to -2545560025)
- [ ] Resolve Somerville politician UUIDs from external_ids (-2562535001 to -2562535012)
- [ ] Confirm next migration number (expected 598)

*These Wave 0 steps are mandatory before any stance research begins.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Compass renders correctly for Newton profile | NEWTON-03 | Requires browser UI check | Load a Newton official's profile on essentials.empowered.vote and verify compass spokes display |
| Compass renders correctly for Somerville profile | SOMERVILLE-03 | Requires browser UI check | Load a Somerville official's profile and verify compass spokes display |
| Blank spokes honest (no default Neutral) | Both | Human judgment required | Spot-check 2-3 officials with known-sparse records; confirm no defaulted values |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
