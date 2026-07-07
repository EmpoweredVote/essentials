---
phase: 163
slug: henderson-deep-seed
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-28
---

# Phase 163 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from 163-RESEARCH.md §"Validation Architecture". This is a data-seed phase
> (SQL migrations + GIS ingestion + headshot fetch); verification is SQL/HTTP gates +
> address-routing smoke tests, not a unit-test suite. Mirrors Phase 162 (LV).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript smoke scripts via `npx tsx` + inline SQL gates (`psql -f`) |
| **Config file** | none — ad-hoc scripts (project convention for deep-seeds) |
| **Quick run command** | `npx tsx scripts/smoke-nv-geofences.ts` (existing; extend for Henderson ward routing) |
| **Full suite command** | Inline 9-check E2E SQL/HTTP verification (analog to Phase 162 Plan 03) |
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
| CLARK-03 SC#1 | Henderson address returns Mayor + correct ward council member | smoke / integration | Post-apply address probe via `npx tsx` (extend `smoke-nv-geofences.ts`) | ❌ W0 |
| CLARK-03 SC#1 | 4 ward polygons (MTFCC X0016, Wards I–IV) loaded + ST_IsValid | SQL gate | `SELECT COUNT(*), bool_and(ST_IsValid(geom)) FROM essentials.geofence_boundaries WHERE mtfcc='X0016'` = (4, true) | ❌ W0 |
| CLARK-03 SC#1 | Chamber = 5 seats (Mayor at-large + 4 wards), official_count=5 | SQL gate | `SELECT official_count FROM essentials.chambers WHERE ...Henderson City Council` = 5 | ❌ W0 |
| CLARK-03 SC#2 | 5 officials have 600×750 headshots (genuine gaps documented) | SQL gate | `SELECT COUNT(*) FROM essentials.politician_images pi JOIN essentials.politicians p ON p.id=pi.politician_id WHERE p.external_id BETWEEN -3206005 AND -3206001` (target 5; documented gaps allowed) | ❌ W0 |
| CLARK-03 SC#3 | Evidence-only stances render (no defaults) | SQL gate | `SELECT COUNT(*) FROM inform.politician_answers pa JOIN essentials.politicians p ON pa.politician_id=p.id WHERE p.external_id BETWEEN -3206005 AND -3206001` ≥ 1; 0 fabricated/default values | ❌ W0 |
| CLARK-03 SC#4 | Henderson in coverage.js with hasContext | manual | Inspect `src/lib/coverage.js` Nevada block + browse `?browse_geo_id=3231900` | ❌ W0 manual |
| — | No section-split after seed | SQL gate | section-split scan query = 0 rows | ❌ W0 |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/load-henderson-ward-boundaries.ts` — loads 4 X0016 ward polygons from Henderson GIS MapServer (`maps.cityofhenderson.com/arcgis/rest/services/public/OpenDataAdministrativeBoundaries/MapServer/2/query`, `resultRecordCount=100` to avoid the 3-of-4 truncation; new file; analog to `load-lv-ward-boundaries.ts`)
- [ ] Wave-0 DB probes: live on-disk migration MAX (`ls C:/EV-Accounts/backend/migrations | tail` — trust highest file +1, not just `schema_migrations`); external_id collision (`SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -3206005 AND -3206001`); X0016 existence (`SELECT DISTINCT mtfcc FROM essentials.geofence_boundaries WHERE mtfcc LIKE 'X%' ORDER BY mtfcc`); Henderson G4110 city geo_id (expected 3231900) + casing
- [ ] Wave-0 roster verification against cityofhenderson.com (operator checkpoint): Mayor Romero + Ward I Seebock / Ward II Larson / Ward III Cox / Ward IV Stewart, seat count = 5
- [ ] Extend `smoke-nv-geofences.ts` with a Henderson ward-routing address probe

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Correct-person headshot + ward labeling | CLARK-03 SC#1/#2 | Visual identity can't be asserted in SQL | Browse a per-ward Henderson address; confirm Mayor first + the one correct ward member + right photo |
| Coverage chip renders purple | CLARK-03 SC#4 | Frontend render | Visit `essentials.empowered.vote/results?browse_geo_id=3231900&browse_mtfcc=G4110` |

---

## Validation Sign-Off

- [ ] All tasks have automated SQL/HTTP verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (ward loader + probes + roster checkpoint)
- [ ] 9-check E2E green
- [ ] `nyquist_compliant: true` set in frontmatter (after Wave 0)

**Approval:** pending
