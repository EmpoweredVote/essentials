---
phase: 96
slug: md-2026-elections-discovery-pipeline-landing
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-06
---

# Phase 96 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | SQL post-verification blocks (built into each migration) |
| **Config file** | none — validation is inline in each migration's DO $$ block |
| **Quick run command** | `mcp__supabase-local__execute_sql` — run the verification SELECT from the migration |
| **Full suite command** | Run all 4 migration verification blocks + manually verify Landing.jsx renders MD entry |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run the inline DO $$ verification block from the migration
- **After every plan wave:** Verify row counts match expected totals in RESEARCH.md
- **Before `/gsd-verify-work`:** All migrations applied cleanly, Landing.jsx MD entry visible
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 96-01-01 | 01 | 1 | MD-ELECTIONS-01 | — | N/A | sql-verify | SELECT count FROM essentials.elections WHERE state='MD' — expect 2 rows | ✅ inline | ⬜ pending |
| 96-02-01 | 02 | 2 | MD-ELECTIONS-02 | — | N/A | sql-verify | SELECT count FROM essentials.races WHERE election_id IN (MD elections) — expect 130 rows | ✅ inline | ⬜ pending |
| 96-03-01 | 03 | 3 | MD-ELECTIONS-03 | — | N/A | sql-verify | SELECT count FROM essentials.discovery_jurisdictions WHERE jurisdiction_geoid='24' — expect 2 rows | ✅ inline | ⬜ pending |
| 96-03-02 | 03 | 2 | MD-ELECTIONS-03 | — | N/A | manual | Landing.jsx COVERAGE_CITIES contains MD entry with both browseGovernmentList geo_ids | ✅ code review | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. This phase is pure SQL migrations + one JSX line — no test framework setup needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| MD entry appears on Landing page | MD-ELECTIONS-03 | Requires browser render or dev server | Check Landing.jsx COVERAGE_CITIES for `{ label: 'Leonardtown', state: 'Maryland', ... }` entry with both geo_ids |
| Discovery agent can reach MD races | MD-ELECTIONS-03 | Agent is external cron | Confirm discovery_jurisdictions rows have correct election_date (2026-06-23 and 2026-11-03) and state='MD' |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
