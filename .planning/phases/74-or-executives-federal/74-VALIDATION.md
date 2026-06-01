---
phase: 74
slug: or-executives-federal
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-29
---

# Phase 74 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Inline SQL via mcp__supabase-local__execute_sql (no external test scripts needed) |
| **Config file** | none — all verification is SQL against live Supabase DB |
| **Quick run command** | mcp__supabase-local__execute_sql (SELECT COUNT queries — see task map below) |
| **Full suite command** | mcp__supabase-local__execute_sql with section-split detector + roster smoke test |
| **Estimated runtime** | ~10 seconds per verification query |

---

## Sampling Rate

- **After every task commit:** Inline SQL count gate for the just-applied migration
- **After every plan wave:** Full section-split detector + routing smoke test
- **Before `/gsd-verify-work`:** All SQL gates must return expected counts
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 74-01-01 | 01 | 1 | SC-1 pre-flight | T-74-01 | External_id range clear; no name collisions; 5 chambers present | sql | `SELECT external_id, full_name FROM essentials.politicians WHERE external_id BETWEEN -4100099 AND -4100001` | ✅ (live DB) | ⬜ pending |
| 74-01-02 | 01 | 1 | SC-1 migration | T-74-02, T-74-03 | 5 exec politicians + 1 STATE_EXEC district + 5 offices applied | sql | `SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -4100005 AND -4100001` | ✅ (live DB) | ⬜ pending |
| 74-01-03 | 01 | 1 | SC-1 verification | T-74-04 | Section-split detector 0 rows; all offices is_appointed=false; SoS=Tobias Read | sql | Section-split detector: `SELECT gb.geo_id FROM essentials.geofence_boundaries gb LEFT JOIN essentials.districts d ON d.geo_id=gb.geo_id WHERE gb.state='41' GROUP BY gb.geo_id, gb.mtfcc HAVING COUNT(DISTINCT d.id)!=1` | ✅ (live DB) | ⬜ pending |
| 74-02-01 | 02 | 1 | SC-2, SC-3 pre-flight | T-74-05 | Federal chamber names confirmed; NATIONAL districts exist; external_id range clear | sql | `SELECT id, name FROM essentials.chambers WHERE name ILIKE '%senate%' OR name ILIKE '%house%'` | ✅ (live DB) | ⬜ pending |
| 74-02-02 | 02 | 1 | SC-2, SC-3 migration | T-74-06 | 2 senators + 6 House reps + 8 offices applied | sql | `SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -4102006 AND -4101001` | ✅ (live DB) | ⬜ pending |
| 74-02-03 | 02 | 1 | SC-5 routing | T-74-07 | Portland City Hall routes to Suzanne Bonamici via NATIONAL_LOWER geo_id=4101 | sql | `SELECT p.full_name FROM essentials.politicians p JOIN essentials.offices o ON o.politician_id=p.id JOIN essentials.districts d ON d.id=o.district_id WHERE d.geo_id='4101' AND d.district_type='NATIONAL_LOWER'` | ✅ (live DB) | ⬜ pending |
| 74-03-01 | 03 | 2 | SC-4 exec headshots | — | 5 exec headshots uploaded to Storage at {politician_id}-headshot.jpg; politician_images type='default' | sql | `SELECT COUNT(*) FROM essentials.politician_images pi JOIN essentials.politicians p ON p.id=pi.politician_id WHERE p.external_id BETWEEN -4100005 AND -4100001 AND pi.type='default'` | ✅ (live DB) | ⬜ pending |
| 74-03-02 | 03 | 2 | SC-4 federal headshots | — | 8 federal headshots uploaded; type='default'; no type='headshot' rows | sql | `SELECT COUNT(*) FROM essentials.politician_images pi JOIN essentials.politicians p ON p.id=pi.politician_id WHERE p.external_id BETWEEN -4102006 AND -4101001 AND pi.type='default'` | ✅ (live DB) | ⬜ pending |
| 74-03-03 | 03 | 2 | SC-4 audit migration | — | 225 audit SQL written; NOT applied via Supabase ledger | check | File exists: `C:/EV-Accounts/backend/migrations/225_or_headshots.sql` AND it does NOT appear in `SELECT version FROM supabase_migrations.schema_migrations WHERE version='225'` | ✅ (filesystem + DB) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — all verification is inline SQL against the live Supabase DB using mcp__supabase-local__execute_sql. No external scripts, smoke test TypeScript files, or Wave 0 infrastructure is needed for this data-seeding phase.

All tasks have ✅ automated verify commands listed above. Wave 0 is complete by default.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Headshot visual quality (eyes ~1/3 from top, no artifacts) | SC-4 | Cannot be asserted programmatically | After upload, open profile page for one official; verify portrait looks correct and not pixelated |
| sos.oregon.gov Blue Book images load without 403 | SC-4 | Network/header dependent | Test `curl -A "Mozilla/5.0" -H "Referer: https://sos.oregon.gov/" URL` for one executive before mass download |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands (inline SQL via mcp__supabase-local__execute_sql)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] No Wave 0 infrastructure needed — all SQL runs live
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending execution
