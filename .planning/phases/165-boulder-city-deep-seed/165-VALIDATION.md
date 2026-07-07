---
phase: 165
slug: boulder-city-deep-seed
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-29
---

# Phase 165 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from 165-RESEARCH.md §"Validation Architecture". This is a data-seed phase
> (SQL migrations + headshot fetch; NO GIS ingestion — Boulder City is at-large, the
> G4110 geofence is already loaded by Phase 158); verification is SQL/HTTP gates +
> address-routing smoke tests, not a unit-test suite. Mirrors Phase 164 (NLV) / 163
> (Henderson) MINUS the ward loader and ward-routing checks.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript smoke scripts via `npx tsx` + inline SQL gates (`psql -f`) |
| **Config file** | none — ad-hoc scripts (project convention for deep-seeds) |
| **Quick run command** | `npx tsx scripts/smoke-nv-geofences.ts` (existing; extend with a Boulder City interior point) |
| **Full suite command** | Inline 9-check E2E SQL/HTTP verification (analog to Phase 164 Plan 03, ward checks dropped) |
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
| CLARK-05 SC#1 | A Boulder City address returns Mayor + all 4 at-large council members (no ward routing) | smoke / integration | Post-apply address probe via `npx tsx` (extend `smoke-nv-geofences.ts` with a Boulder City interior point → expect Mayor + 4 council) | ❌ W0 |
| CLARK-05 SC#1 | Single-city model: all 5 offices attach to the ONE G4110 geofence geo_id=3206500 (no new geofence rows added this phase) | SQL gate | `SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE geo_id='3206500' AND mtfcc='G4110'` = 1; 0 new ward/X-MTFCC rows created | ❌ W0 |
| CLARK-05 SC#1 | Chamber = 5 seats (Mayor at-large + 4 at-large council), official_count=5 | SQL gate | `SELECT official_count FROM essentials.chambers WHERE name ILIKE '%Boulder City%Council%'` = 5 | ❌ W0 |
| CLARK-05 SC#1 | District structure: 1 LOCAL_EXEC (Mayor) + 1 shared LOCAL (4 council) both on geo_id=3206500; Mayor sorts first | SQL/HTTP gate | LOCAL_EXEC district on 3206500 carries 1 Mayor office; LOCAL district on 3206500 carries exactly 4 "Council Member" (at-large, no ward number) offices; groupHierarchy LOCAL_EXEC-before-LOCAL | ❌ W0 |
| CLARK-05 SC#2 | 5 officials have 600×750 headshots (genuine gaps documented) | SQL gate | `SELECT COUNT(*) FROM essentials.politician_images pi JOIN essentials.politicians p ON p.id=pi.politician_id WHERE p.external_id BETWEEN -3208005 AND -3208001` (target 5; research found 0 expected gaps) | ❌ W0 |
| CLARK-05 SC#3 | Evidence-only stances render (no defaults) | SQL gate | `SELECT COUNT(*) FROM inform.politician_answers pa JOIN essentials.politicians p ON pa.politician_id=p.id WHERE p.external_id BETWEEN -3208005 AND -3208001` ≥ 1; every answer has a paired non-null context row; 0 fabricated/default values | ❌ W0 |
| CLARK-05 SC#4 | Boulder City in coverage.js with hasContext:true | manual | Inspect `src/lib/coverage.js` Nevada block + browse `?browse_geo_id=3206500` | ❌ W0 manual |
| — | No section-split after seed; no empty LOCAL section | SQL gate | section-split scan = 0 orphan rows; LOCAL section non-empty (4 council members present) | ❌ W0 |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] **NO ward loader** — Boulder City is at-large; the `load-*-ward-boundaries.ts` scripts from 162–164 do NOT apply. Nothing to source.
- [ ] Wave-0 DB/disk probes: live on-disk migration MAX (`ls C:/EV-Accounts/backend/migrations | grep -oE '^[0-9]+' | sort -n | tail -1` — trust highest file +1; research confirmed 1099 on-disk → next **1100**, NOT just `schema_migrations`); external_id collision (`SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -3208005 AND -3208001` → 0); Boulder City G4110 city geo_id (expected 3206500) + casing (state='32' on geofence); confirm no pre-existing "City of Boulder City" government
- [ ] Wave-0 roster verification against bcnv.org / flybouldercity.com / Ballotpedia (operator checkpoint): Mayor Joe Hardy (at-large, directly elected) + council Sherri Jorgensen / Cokie Booth / Steve Walton / Denise E. Ashurst; seat count = 5, all at-large, no wards; flag the June 9 / Nov 3 2026 ballot turnover (Hardy/Booth/Walton up) but all 5 remain seated → seed `is_active=true, is_incumbent=true`
- [ ] Wave-0 headshot sourcing: flybouldercity.com DocumentIds confirmed clean (HTTP 200, image/jpeg, no WAF) — Hardy 10964, Jorgensen 9459, Booth 10924, Walton 10899, Ashurst 14763; 0 expected gaps
- [ ] Extend `smoke-nv-geofences.ts` with a Boulder City interior-point address probe (expect Mayor + 4 council)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Correct-person headshot + at-large labeling | CLARK-05 SC#1/#2 | Visual identity can't be asserted in SQL | Browse a Boulder City address; confirm Mayor Hardy first + all 4 at-large "Council Member" entries + right photos (no ward numbers) |
| Coverage chip renders purple | CLARK-05 SC#4 | Frontend render | Visit `essentials.empowered.vote/results?browse_geo_id=3206500&browse_mtfcc=G4110` |

---

## Validation Sign-Off

- [ ] All tasks have automated SQL/HTTP verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (probes + roster checkpoint + headshot URLs — NO ward loader)
- [ ] 9-check E2E green (ward-routing checks dropped — single-city at-large model)
- [ ] `nyquist_compliant: true` set in frontmatter (after Wave 0)

**Approval:** pending
