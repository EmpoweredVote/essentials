---
phase: 188
slug: location-stats-strip
status: ready
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-07
---

# Phase 188 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from 188-RESEARCH.md §"Validation Architecture".

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.1.4 (`package.json:41`) |
| **Config file** | none — Vitest runs with Vite defaults; tests colocated `src/**/*.test.js` |
| **Quick run command** | `npx vitest run src/lib/population.test.js` |
| **Full suite command** | `npm test` (= `vitest run`, `package.json:11`) |
| **Estimated runtime** | ~5 seconds (pure-logic, no jsdom/render) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/population.test.js`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 188-02-* | 02 | 2 | STAT-02 | — | `resolvePopulation` federal → US total | unit | `npx vitest run src/lib/population.test.js` | ❌ W0 | ⬜ pending |
| 188-02-* | 02 | 2 | STAT-02 | — | state abbrev → state FIPS → pop (D-04) | unit | same | ❌ W0 | ⬜ pending |
| 188-02-* | 02 | 2 | STAT-02 | — | city geo_id (place FIPS) → pop (D-05 primary) | unit | same | ❌ W0 | ⬜ pending |
| 188-02-* | 02 | 2 | STAT-02 | — | city name+state → index → pop (D-05 fallback) | unit | same | ❌ W0 | ⬜ pending |
| 188-02-* | 02 | 2 | STAT-03 | — | unknown geo_id / bad abbrev / missing city → `null` | unit | same | ❌ W0 | ⬜ pending |
| 188-02-* | 02 | 2 | STAT-03 | — | population 0 / NaN / non-number → `null` | unit | same | ❌ W0 | ⬜ pending |
| 188-03-* | 03 | 3 | STAT-01/03 | — | scrim renders iff `stats.value > 0` (pure predicate, no jsdom) | unit | same pattern | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

> Repo test convention is **pure-logic only, no jsdom/React render** (`SectionBanner.test.js:1-10`, `featureIcons.test.js:1-9`). Test `resolvePopulation()` directly with a small in-test `POP_BY_FIPS` / `NAME_STATE_TO_FIPS` fixture — **do NOT import the ~700KB real bundle**. If the render-guard needs coverage, extract it as a pure predicate (e.g. `shouldRenderStat(stats)`) exported from `SectionBanner.jsx` and unit-test that, exactly as `FALLBACK_GRADIENTS` is exported and tested.

---

## Wave 0 Requirements

- [ ] `src/lib/population.test.js` — covers STAT-02 / STAT-03 resolver behavior (inline fixture maps; no real-bundle import)
- [ ] Framework install: none needed (Vitest ^4.1.4 present)
- [ ] Generator (`scripts/gen-population.mjs`) has no unit test (build-time I/O script) — instead carries an in-script post-fetch **assertion** (row counts > thresholds, header-row shape) that fails loudly rather than writing a bad bundle

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live banner shows population top-right, no title/icon collision, legible on varied art | STAT-01 | Visual layout on real banner art can't be asserted in a pure-logic test (no jsdom render); 188-03 carries a `checkpoint:human-verify` task | Load `/results?browse_geo_id=…` for a city (e.g. Plano TX), a state, and the federal tier; confirm `POPULATION` label + grouped number in the top-right scrim, clear of the corner, not overlapping the bottom-left title or bottom-right icon row, at both mobile (120px) and desktop (180px) bands |
| Bundle regeneration produces live values | STAT-02 | Requires `CENSUS_API_KEY` env var + network; 188-01 carries a `checkpoint:human-action` task | Operator exports `CENSUS_API_KEY`, runs the generator, confirms `src/data/population.js` contains real (non-zero) population values and the recorded raw/min/gzip size |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < ~5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
