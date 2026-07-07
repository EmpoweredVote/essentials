---
phase: 166
slug: ccsd-board-of-trustees-deep-seed
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-29
---

# Phase 166 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from 166-RESEARCH.md §"Validation Architecture". This is a data-seed phase
> (G5420 TIGER UNSD geofence load + SQL migrations + headshot fetch); verification is
> SQL/HTTP gates + address-routing smoke tests, NOT a unit-test suite. Mirrors Phase 165
> (Boulder City) MINUS the at-large city checks PLUS the G5420-load + 11-office +
> elected/appointed-flag checks. CCSD UNSD GEOID = `3200060` (NCES + Census confirmed).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript smoke scripts via `npx tsx` + inline SQL gates (`psql -f`) |
| **Config file** | none — ad-hoc scripts (project deep-seed convention) |
| **Quick run command** | `npx tsx scripts/smoke-nv-geofences.ts` (extend: assert CCSD G5420 `3200060` covers a Clark County point) |
| **Full suite command** | Inline 10-check E2E SQL/HTTP verification |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** relevant inline SQL count for that task
- **After Wave 1 (G5420 loader + structural migration 1107):** checks 1–6, 9, 10
- **After Wave 2 (headshots 1108):** check 7
- **After Wave 3 (stances 1109–1119):** check 8; run all 10 for sign-off
- **Phase gate:** all 10 green + operator browse-verify (correct-person headshots + 11-trustee render + elected/appointed labels) before `/gsd:verify-work`
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Req | Behavior | Test Type | Automated Command | File Exists |
|-----|----------|-----------|-------------------|-------------|
| CCSD-01 SC#1 | G5420 boundary loaded WITH geometry | SQL gate | `SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE geo_id='3200060' AND mtfcc='G5420' AND geometry IS NOT NULL` = 1, `source='tiger_unsd_nv_2024'` | ❌ W0 |
| CCSD-01 SC#1 | Clark County address returns the SCHOOL tier (G5420) | smoke | Extend `smoke-nv-geofences.ts`: existing Strip/LV/Henderson/NLV/Boulder City points ALSO return G5420 geo_id=3200060 | ❌ W0 |
| CCSD-01 SC#1 | Clark County address returns all 11 trustees | SQL/HTTP | `SELECT COUNT(*) FROM essentials.offices o JOIN essentials.districts d ON d.id=o.district_id WHERE d.geo_id='3200060' AND d.district_type='SCHOOL' AND d.state='nv'` = 11 | ❌ W0 |
| CCSD-01 SC#1 | 7 elected + 4 appointed split | SQL gate | `SELECT is_appointed_position, COUNT(*) FROM essentials.offices o JOIN essentials.districts d ON d.id=o.district_id WHERE d.geo_id='3200060' AND d.district_type='SCHOOL' GROUP BY 1` → false:7, true:4 | ❌ W0 |
| CCSD-01 SC#1 | Chamber present, official_count=11 (if set) | SQL gate | `SELECT official_count FROM essentials.chambers WHERE name='Board of School Trustees'` = 11 (or NULL if omitted) | ❌ W0 |
| CCSD-01 SC#1 | No section-split | SQL gate | section-split scan for geo_id=3200060 G5420 = 0 orphan rows | ❌ W0 |
| CCSD-01 SC#2 | ≤11 trustees have 600×750 headshots; gaps documented | SQL gate | `SELECT COUNT(*) FROM essentials.politician_images pi JOIN essentials.politicians p ON p.id=pi.politician_id WHERE p.external_id BETWEEN -3209011 AND -3209001` (target = 11 − documented gaps) | ❌ W0 |
| CCSD-01 SC#3 | Evidence-only stances render (no defaults) | SQL gate | `SELECT COUNT(*) FROM inform.politician_answers pa JOIN essentials.politicians p ON pa.politician_id=p.id WHERE p.external_id BETWEEN -3209011 AND -3209001` ≥ 1; every answer paired with non-null context; 0 default values | ❌ W0 |
| CCSD-01 SC#4 | CCSD in coverage.js with hasContext:true | manual | Inspect `src/lib/coverage.js` NV block + browse `?browse_geo_id=3200060&browse_mtfcc=G5420` | ❌ W0 manual |
| — | Casing correct | SQL gate | `SELECT DISTINCT state FROM essentials.districts WHERE geo_id='3200060'` = `'nv'` only; geofence row state='32' | ❌ W0 |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] On-disk migration MAX: `ls C:/EV-Accounts/backend/migrations | grep -oE '^[0-9]+' | sort -n | tail -1` (research confirmed 1106 → next **1107**; re-verify before write — trust highest file +1, NOT just `schema_migrations`)
- [ ] external_id collision: `SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -3209011 AND -3209001` → 0
- [ ] No pre-existing CCSD government: `SELECT COUNT(*) FROM essentials.governments WHERE name='Clark County School District, Nevada, US'` → 0
- [ ] No pre-existing G5420 row for NV: `SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE geo_id='3200060'` → 0 (confirms greenfield load)
- [ ] Confirm TS loader deps present: `ls C:/EV-Accounts/backend/node_modules/adm-zip C:/EV-Accounts/backend/node_modules/shapefile`
- [ ] Loader `--dry-run`: `npx tsx scripts/load-ccsd-school-boundary.ts --dry-run` confirms GEOID `3200060` found in `tl_2024_32_unsd.zip` BEFORE the real run
- [ ] Roster operator checkpoint vs ccsd.net/trustees: 7 elected A–G (Stevens A, Dominguez B, Henry C, Zamora D, Biassotti E, Bustamante Adams F, Cavazos G) + 4 appointed (Barron→NLV, Esparza-Stoffregen→Henderson, Johnson→Las Vegas, Satory→Clark County); confirm exact spellings/diacritics + appointing jurisdictions; officers (President/VP/Clerk) are title-on-seat, NOT separate seats
- [ ] Headshot WAF probe + fallback chain per trustee (ccsd.net Chrome-UA+Referer test; both ccsd.net and BoardDocs returned 403 in research → expect fallbacks: Ballotpedia/Wikimedia descriptive-UA/campaign; appointed trustees likely thin → document gaps)
- [ ] Extend `smoke-nv-geofences.ts`: the 4 incorporated-city points + the Strip point should ALL now return G5420 geo_id=3200060 (CCSD covers the whole county)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Correct-person headshots + elected/appointed labels | CCSD-01 SC#1/#2 | Visual identity + label render can't be asserted in SQL | Browse a Clark County address; confirm 11 trustees, District A–G labels + appointed-jurisdiction labels, right photos, no text/graphic overlays |
| Coverage chip renders purple | CCSD-01 SC#4 | Frontend render | Visit `essentials.empowered.vote/results?browse_geo_id=3200060&browse_mtfcc=G5420` |

---

## Validation Sign-Off

- [ ] All tasks have automated SQL/HTTP verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (probes + loader dry-run + roster checkpoint + headshot WAF chain)
- [ ] 10-check E2E green (incl. G5420 geometry load + 11-office + elected/appointed split)
- [ ] `nyquist_compliant: true` set in frontmatter (after Wave 0)

**Approval:** pending
