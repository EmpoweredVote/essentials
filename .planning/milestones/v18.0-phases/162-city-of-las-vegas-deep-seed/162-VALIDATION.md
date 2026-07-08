---
phase: 162
slug: city-of-las-vegas-deep-seed
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-27
---

# Phase 162 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from 162-RESEARCH.md §"Validation Architecture". This is a data-seed phase
> (SQL migrations + GIS ingestion + headshot fetch); verification is SQL/HTTP gates +
> address-routing smoke tests, not a unit-test suite.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript smoke scripts via `npx tsx` + inline SQL gates (`psql -f`) |
| **Config file** | none — ad-hoc scripts (project convention for deep-seeds) |
| **Quick run command** | `npx tsx scripts/smoke-nv-geofences.ts` (existing; extend for LV ward routing) |
| **Full suite command** | Inline 9-check SQL/HTTP verification (analog to Phase 161 Plan 03) |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** relevant inline SQL count for that task
- **After every plan wave:** existing `smoke-nv-geofences.ts` + inline SQL counts
- **Before sign-off:** full 9-check E2E green + human-verify checkpoint (address routing + correct-person)
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Req | Behavior | Test Type | Automated Command | File Exists |
|-----|----------|-----------|-------------------|-------------|
| CLARK-02 SC#1 | LV address returns Mayor + correct ward council member | smoke / integration | Post-apply address probe via `npx tsx` (extend `smoke-nv-geofences.ts`) | ❌ W0 |
| CLARK-02 SC#1 | 6 X0015 ward polygons loaded + ST_IsValid | SQL gate | `SELECT COUNT(*), bool_and(ST_IsValid(geom)) FROM essentials.geofence_boundaries WHERE mtfcc='X0015'` = (6, true) | ❌ W0 |
| CLARK-02 SC#2 | 7 officials have 600×750 headshots | SQL gate | `SELECT COUNT(*) FROM essentials.politician_images pi JOIN essentials.politicians p ON p.id=pi.politician_id WHERE p.external_id BETWEEN -3205007 AND -3205001` = 7 | ❌ W0 |
| CLARK-02 SC#3 | Evidence-only stances render (no defaults) | SQL gate | `SELECT COUNT(*) FROM inform.politician_answers pa JOIN essentials.politicians p ON pa.politician_id=p.id WHERE p.external_id BETWEEN -3205007 AND -3205001` ≥ 1; 0 fabricated/default values | ❌ W0 |
| CLARK-02 SC#4 | Las Vegas in coverage.js with hasContext | manual | Inspect `src/lib/coverage.js` + browse `?browse_geo_id=<LV_geo_id>` | ❌ W0 manual |
| — | No section-split after seed | SQL gate | section-split scan query = 0 rows | ❌ W0 |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/load-lv-ward-boundaries.ts` — loads 6 X0015 ward polygons from LV GIS MapServer (new file; analog to `load-dc-ward-boundaries.ts`)
- [ ] Wave-0 DB probes: live ledger MAX (`SELECT MAX(version::int) FROM supabase_migrations.schema_migrations`); external_id collision (`SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -3205007 AND -3205001`); X0015 existence (`SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE mtfcc='X0015'`); LV G4110 city geo_id + casing
- [ ] Extend `smoke-nv-geofences.ts` with an LV ward-routing address probe

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Correct-person headshot + ward labeling | CLARK-02 SC#1/#2 | Visual identity can't be asserted in SQL | Browse a per-ward LV address; confirm Mayor first + the one correct ward member + right photo |
| Coverage chip renders purple | CLARK-02 SC#4 | Frontend render | Visit `essentials.empowered.vote/results?browse_geo_id=<LV_geo_id>&browse_mtfcc=G4110` |

---

## Validation Sign-Off

- [ ] All tasks have automated SQL/HTTP verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (ward loader + probes)
- [ ] 9-check E2E green
- [ ] `nyquist_compliant: true` set in frontmatter (after Wave 0)

**Approval:** pending
