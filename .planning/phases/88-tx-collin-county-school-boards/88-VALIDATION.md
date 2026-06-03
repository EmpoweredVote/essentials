---
phase: 88
slug: tx-collin-county-school-boards
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-02
---

# Phase 88 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | No automated test framework — verification via PostGIS SQL smoke queries |
| **Config file** | none |
| **Quick run command** | `psql $DATABASE_URL -c "SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE mtfcc='G5420' AND state='48';"` |
| **Full suite command** | Run all 5 PostGIS coordinate smoke queries in the Per-Task Verification Map below |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command
- **After every plan wave:** Run all 5 smoke queries
- **Before `/gsd-verify-work`:** All 5 smoke queries must return rows + section-split must return 0
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|--------|
| 88-01-T1 | 01 | 1 | TX-SCHOOL-01..05 | — | N/A | smoke | `SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE mtfcc='G5420' AND state='48'` returns 5 | ⬜ pending |
| 88-01-T2 | 01 | 1 | TX-SCHOOL-01 | — | N/A | smoke | `SELECT g.name FROM essentials.geofence_boundaries gb JOIN essentials.districts d ON d.geo_id=gb.geo_id WHERE ST_Covers(gb.geometry, ST_SetSRID(ST_Point(-96.6989, 33.0198), 4326)) AND gb.mtfcc='G5420'` returns 'Plano ISD' | ⬜ pending |
| 88-01-T3 | 01 | 1 | TX-SCHOOL-02 | — | N/A | smoke | Same query with McKinney coord (-96.6155, 33.1976) returns 'McKinney ISD' | ⬜ pending |
| 88-01-T4 | 01 | 1 | TX-SCHOOL-03 | — | N/A | smoke | Same query with Allen coord (-96.6706, 33.1032) returns 'Allen ISD' | ⬜ pending |
| 88-01-T5 | 01 | 1 | TX-SCHOOL-04 | — | N/A | smoke | Same query with Frisco coord (-96.8236, 33.1501) returns 'Frisco ISD' | ⬜ pending |
| 88-01-T6 | 01 | 1 | TX-SCHOOL-05 | — | N/A | smoke | Same query with Richardson coord (-96.7298, 32.9482) returns 'Richardson ISD' | ⬜ pending |
| 88-01-T7 | 01 | 1 | All | — | N/A | DB assertion | Section-split check returns 0 rows (embedded in migration 261 post-verification DO block) | ⬜ pending |
| 88-02-T1 | 02 | 2 | TX-SCHOOL-01..05 | — | N/A | manual | Migration 262 headshot SQL reviewed and committed (audit-only, no apply) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test files needed — verification is via PostGIS SQL smoke queries run directly against the production DB.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Board member photos visible on profile pages | TX-SCHOOL-01..05 | Headshots require visual inspection of upload + UI render | After migration 262 headshot SQL confirmed, check each politician profile page in the app |
| Office titles display correctly (Place N vs District N) | TX-SCHOOL-05 | Richardson ISD hybrid structure (Districts 1-5, Places 6-7) needs visual check | Navigate to a Richardson address in the app; verify board member section shows correct office titles |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or manual verification defined
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0: no new infrastructure needed
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
