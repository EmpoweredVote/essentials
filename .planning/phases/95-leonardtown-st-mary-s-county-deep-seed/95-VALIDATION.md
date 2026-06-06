---
phase: 95
slug: leonardtown-st-mary-s-county-deep-seed
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-05
---

# Phase 95 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | SQL gate queries (embedded in migration DO blocks) + manual UI spot-check |
| **Config file** | none — validation embedded in migration post-verification DO blocks |
| **Quick run command** | Run post-verification DO block at end of each migration SQL |
| **Full suite command** | SQL spot-checks via mcp__supabase-local__execute_sql + UI spot-check of 3+ profile pages |
| **Estimated runtime** | ~2 minutes per migration DO block; ~5 minutes for full UI spot-check |

---

## Sampling Rate

- **After every migration applied:** Post-verification DO block runs automatically (embedded in migration SQL)
- **After Plan 95-01 complete:** Run section-split detector query manually (confirms 0 orphan rows)
- **After Plan 95-02 complete:** Python script exit code + UI spot-check of 3+ profile pages
- **Before `/gsd-verify-work`:** All DO blocks passed + headshots visible in UI
- **Max feedback latency:** ~2 minutes

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|--------|
| 95-01-01 | 01 | 1 | MD-DEEP-01 | — | SQL gate rejects duplicate/missing rows | SQL gate | Post-verification DO block in migration 276 | ⬜ pending |
| 95-01-02 | 01 | 1 | MD-DEEP-03 | — | SQL gate rejects wrong geo_id / missing officials | SQL gate | Post-verification DO block in migration 277 | ⬜ pending |
| 95-01-03 | 01 | 1 | MD-DEEP-01, MD-DEEP-03 | — | Section-split detector returns 0 | SQL gate | `SELECT COUNT(*) FROM essentials.geofence_boundaries gb WHERE gb.geo_id IN ('24037','2446475') AND NOT EXISTS (SELECT 1 FROM essentials.districts d WHERE d.geo_id=gb.geo_id)` | ⬜ pending |
| 95-02-01 | 02 | 2 | MD-DEEP-02, MD-DEEP-03 | — | Script exits 0, no ERROR lines in output | Script exit code | `python scripts/md_local_headshots.py` | ⬜ pending |
| 95-02-02 | 02 | 2 | MD-DEEP-01, MD-DEEP-02, MD-DEEP-03 | — | Officials appear in correct UI sections | Manual | Navigate to app with St. Mary's County address + Leonardtown address | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No Wave 0 requirements — this is a DB-seeding phase. No test framework installation needed. Validation is embedded in migration post-verification DO blocks (auto-rollback on failure).

*If Pillow or psycopg2 are missing from prior phases: `pip install Pillow psycopg2-binary` before running Plan 95-02.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| St. Mary's County address returns commissioners in COUNTY section | MD-DEEP-01, MD-DEEP-02 | PostGIS routing requires browser UI test | Navigate to Essentials app with a St. Mary's County address; verify 5 commissioners appear in COUNTY section |
| Leonardtown address returns town council in LOCAL section | MD-DEEP-03 | PostGIS routing requires browser UI test | Navigate to Essentials app with a Leonardtown address; verify Mayor + 5 Council Members appear in LOCAL section |
| Headshots render on profile pages | MD-DEEP-02, MD-DEEP-03 | Image rendering requires browser | Open 3+ politician profile pages; verify headshots display at correct aspect ratio |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
