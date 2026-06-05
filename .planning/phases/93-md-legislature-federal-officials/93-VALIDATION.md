---
phase: 93
slug: md-legislature-federal-officials
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-05
---

# Phase 93 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | SQL smoke queries via mcp__supabase-local__execute_sql |
| **Config file** | none — live Supabase DB (production) |
| **Quick run command** | `SELECT COUNT(*) FROM essentials.politicians WHERE representing_state = 'MD'` |
| **Full suite command** | Run all smoke test queries in Per-Task Verification Map |
| **Estimated runtime** | ~5 seconds (DB round-trips) |

---

## Sampling Rate

- **After every migration:** Run the migration-specific smoke query
- **After every plan wave:** Run full count queries for all seeded entity types
- **Before `/gsd-verify-work`:** All counts must match expected values
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|--------|
| 93-01-01 | 01 | 1 | MD-GOV-03 | — | N/A | sql | `SELECT COUNT(*) FROM essentials.chambers WHERE name IN ('Maryland Senate','Maryland House of Delegates')` → 2 | ⬜ pending |
| 93-02-01 | 02 | 2 | MD-GOV-03 | — | N/A | sql | `SELECT COUNT(*) FROM essentials.politicians p JOIN essentials.offices o ON o.politician_id=p.id WHERE p.representing_state='md' AND o.title='Senator'` → 47 | ⬜ pending |
| 93-03-01 | 03 | 3 | MD-GOV-04 | — | N/A | sql | `SELECT COUNT(*) FROM essentials.politicians p JOIN essentials.offices o ON o.politician_id=p.id WHERE p.representing_state='md' AND o.title='Delegate'` → 141 | ⬜ pending |
| 93-04-01 | 04 | 4 | MD-GOV-05 | — | N/A | sql | `SELECT COUNT(*) FROM essentials.politicians WHERE representing_state='MD' AND external_id BETWEEN -2440008 AND -2440001` → 8 | ⬜ pending |
| 93-05-01 | 05 | 5 | MD-GOV-06 | — | N/A | sql | `SELECT COUNT(*) FROM essentials.politician_images pi JOIN essentials.politicians p ON p.id=pi.politician_id WHERE p.representing_state IN ('md','MD') AND pi.image_type='headshot'` → ≥47 (senators attempt) | ⬜ pending |
| 93-06-01 | 06 | 6 | MD-GOV-06 | — | N/A | sql | `SELECT COUNT(*) FROM essentials.politician_images pi JOIN essentials.politicians p ON p.id=pi.politician_id WHERE p.representing_state='md' AND pi.image_type='headshot'` → ≥100 (delegates best-effort) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — no test file infrastructure needed. All verification is via SQL smoke queries against the live Supabase DB.

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| A/B subdistrict delegates correctly assigned | MD-GOV-04 | Requires roster cross-reference | Query `SELECT p.name, d.geo_id FROM politicians p JOIN offices o ON o.politician_id=p.id JOIN districts d ON d.id=o.district_id WHERE d.geo_id LIKE '24__[A-C]'` and verify matches mgaleg.maryland.gov roster |
| District 42A vacancy correctly handled | MD-GOV-04 | Vacant seat may or may not need placeholder | Confirm seat is vacant at execution time and skip if so |
| US House reps cover CD-01 through CD-08 | MD-GOV-05 | Requires district cross-check | `SELECT p.name, d.geo_id FROM politicians p JOIN offices o ON o.politician_id=p.id JOIN districts d ON d.id=o.district_id WHERE d.district_type='NATIONAL_LOWER' AND d.state='MD'` → 8 rows, geo_ids 2401–2408 |

---

## Validation Sign-Off

- [ ] All tasks have SQL smoke verify commands
- [ ] Sampling continuity: each migration has a post-migration count assertion
- [ ] No test infrastructure setup needed (DB-only phase)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
