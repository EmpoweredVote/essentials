---
phase: 174
slug: west-metro-school-district-geofences
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-30
---

# Phase 174 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | SQL assertion gates (psql) + loader `--dry-run` + post-insert verification query |
| **Config file** | none — verification is inline SQL run against DATABASE_URL (production Supabase pooler) |
| **Quick run command** | `npx tsx scripts/load-or-westmetro-school-boundaries.ts --dry-run` (from C:/EV-Accounts/backend) |
| **Full suite command** | post-insert section-split scan SQL (4 gates) + 5 address-routing spot-checks |
| **Estimated runtime** | ~30 seconds (download cached) |

---

## Sampling Rate

- **After every task commit:** Run the relevant SQL gate / `--dry-run`
- **After loader live run:** Run the 4-gate section-split scan + count assertion (= 5 new rows, 6 Multnomah untouched)
- **Before `/gsd:verify-work`:** All 4 section-split gates return clean AND all 5 address-routing spot-checks resolve to the correct geo_id
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 174-01-xx | 01 | 1 | WM-GEO-01 | — | N/A (read-only TIGER fetch + idempotent insert) | integration | `npx tsx scripts/load-or-westmetro-school-boundaries.ts --dry-run` | ❌ W0 (script created in this phase) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/load-or-westmetro-school-boundaries.ts` — cloned from `load-or-school-boundaries.ts`; the loader is the test harness (dry-run lists the 5 GEOIDs, asserts EXPECTED_COUNT=5)

*Existing geofence infrastructure (essentials.geofence_boundaries, PostGIS ST_Contains routing) covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Address → school-district routing for all 5 districts | WM-GEO-01 | Requires geocoding a real in-district address and confirming ST_Contains returns the correct G5420 geo_id; depends on live geocoder + PostGIS | Geocode one in-district address per district → run ST_Contains against geofence_boundaries WHERE mtfcc='G5420' → assert returned geo_id matches the district's TIGER GEOID |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
