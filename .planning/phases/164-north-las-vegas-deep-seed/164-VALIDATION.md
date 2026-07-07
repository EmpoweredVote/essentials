---
phase: 164
slug: north-las-vegas-deep-seed
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-28
---

# Phase 164 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from 164-RESEARCH.md §"Validation Architecture". This is a data-seed phase
> (SQL migrations + GIS ingestion + headshot fetch); verification is SQL/HTTP gates +
> address-routing smoke tests, not a unit-test suite. Mirrors Phase 163 (Henderson) / 162 (LV).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript smoke scripts via `npx tsx` + inline SQL gates (`psql -f`) |
| **Config file** | none — ad-hoc scripts (project convention for deep-seeds) |
| **Quick run command** | `npx tsx scripts/smoke-nv-geofences.ts` (existing; extend with an NLV ward-routing point per ward) |
| **Full suite command** | Inline 9-check E2E SQL/HTTP verification (analog to Phase 163 Plan 03) |
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
| CLARK-04 SC#1 | NLV address returns Mayor + correct ward council member | smoke / integration | Post-apply address probe via `npx tsx` (extend `smoke-nv-geofences.ts` with an NLV ward interior point per ward) | ❌ W0 |
| CLARK-04 SC#1 | 4 ward polygons (MTFCC X0017, Wards 1–4) loaded + ST_IsValid | SQL gate | `SELECT COUNT(*), bool_and(public.ST_IsValid(geometry)) FROM essentials.geofence_boundaries WHERE mtfcc='X0017'` = (4, true) | ❌ W0 |
| CLARK-04 SC#1 | Chamber = 5 seats (Mayor at-large + 4 wards), official_count=5 | SQL gate | `SELECT official_count FROM essentials.chambers WHERE name ILIKE '%North Las Vegas City Council%'` = 5 | ❌ W0 |
| CLARK-04 SC#1 | Ward-precise routing (each ward interior point → exactly 1 ward member + Mayor) | SQL/HTTP gate | Per-ward interior-point ST_Covers check = exactly 1 X0017 ward each + city G4110 | ❌ W0 |
| CLARK-04 SC#2 | 5 officials have 600×750 headshots (genuine gaps documented) | SQL gate | `SELECT COUNT(*) FROM essentials.politician_images pi JOIN essentials.politicians p ON p.id=pi.politician_id WHERE p.external_id BETWEEN -3207005 AND -3207001` (target 5; documented gaps allowed) | ❌ W0 |
| CLARK-04 SC#3 | Evidence-only stances render (no defaults) | SQL gate | `SELECT COUNT(*) FROM inform.politician_answers pa JOIN essentials.politicians p ON pa.politician_id=p.id WHERE p.external_id BETWEEN -3207005 AND -3207001` ≥ 1; every answer has a paired non-null context row; 0 fabricated/default values | ❌ W0 |
| CLARK-04 SC#4 | North Las Vegas in coverage.js with hasContext:true | manual | Inspect `src/lib/coverage.js` Nevada block + browse `?browse_geo_id=3251800` | ❌ W0 manual |
| — | No section-split after seed | SQL gate | section-split scan = 0 orphan X0017 rows | ❌ W0 |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/load-north-las-vegas-ward-boundaries.ts` — loads 4 X0017 ward polygons from Clark County GISMO `maps.clarkcountynv.gov/.../OpenData/PoliticalBoundaries/MapServer/5` with `where=PLACE=80&outSR=4326` (new file; adapt `load-henderson-ward-boundaries.ts`; `ST_MakeValid` fallback for self-intersecting rings)
- [ ] Wave-0 DB/disk probes: live on-disk migration MAX (`ls C:/EV-Accounts/backend/migrations | grep -oE '^[0-9]+' | sort -n | tail -1` — trust highest file +1, expect 1092 → next **1093**, NOT just `schema_migrations`); external_id collision (`SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -3207005 AND -3207001` → 0); X0017 existence (`SELECT DISTINCT mtfcc FROM essentials.geofence_boundaries WHERE mtfcc LIKE 'X%' ORDER BY mtfcc` — confirm X0017 unclaimed); NLV G4110 city geo_id (expected 3251800) + casing (state='32')
- [ ] Wave-0 roster verification against cityofnorthlasvegas.com / Ballotpedia (operator checkpoint): Mayor Goynes-Brown (at-large) + Ward 1 Barrón / Ward 2 Garcia-Anderson / Ward 3 Black / Ward 4 Cherchio, seat count = 5; confirm Black still seated (advanced to Nov 2026 mayoral runoff — Cox parallel)
- [ ] Wave-0 headshot sourcing: per-member fallback URLs for Barrón, Garcia-Anderson, Black, Cherchio (Goynes-Brown confirmed via Wikimedia Commons public domain)
- [ ] Extend `smoke-nv-geofences.ts` with an NLV ward-routing address probe

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Correct-person headshot + ward labeling | CLARK-04 SC#1/#2 | Visual identity can't be asserted in SQL | Browse a per-ward NLV address; confirm Mayor first + the one correct ward member + right photo |
| Coverage chip renders purple | CLARK-04 SC#4 | Frontend render | Visit `essentials.empowered.vote/results?browse_geo_id=3251800&browse_mtfcc=G4110` |

---

## Validation Sign-Off

- [ ] All tasks have automated SQL/HTTP verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (ward loader + probes + roster checkpoint + headshot URLs)
- [ ] 9-check E2E green
- [ ] `nyquist_compliant: true` set in frontmatter (after Wave 0)

**Approval:** pending
