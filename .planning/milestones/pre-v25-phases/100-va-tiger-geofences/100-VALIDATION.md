---
phase: 100
slug: va-tiger-geofences
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-08
---

# Phase 100 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Custom TypeScript smoke test + SQL verification (no Jest/Vitest — matches OR/MA/ME/MD pattern) |
| **Config file** | none — standalone scripts |
| **Quick run command** | `npx tsx scripts/smoke-va-geofences.ts` |
| **Full suite command** | `psql $DATABASE_URL -f scripts/verify-va-tiger-import.sql && npx tsx scripts/smoke-va-geofences.ts` |
| **Estimated runtime** | ~30 seconds (SQL gates ~5s + smoke test ~25s) |

---

## Sampling Rate

- **After every task commit:** Run `npx tsx scripts/smoke-va-geofences.ts`
- **After every plan wave:** Run `psql $DATABASE_URL -f scripts/verify-va-tiger-import.sql && npx tsx scripts/smoke-va-geofences.ts`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 100-01-01 | 01 | 0 | VA-GEO-01 | — | N/A | manual check | `grep -n "STATE_LAYER_ALLOWLIST" C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts` | ✅ W0 | ⬜ pending |
| 100-01-02 | 01 | 0 | VA-GEO-02 | — | N/A | manual check | `grep -n "STATE_CITY_ASSERTIONS" C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts` | ✅ W0 | ⬜ pending |
| 100-01-03 | 01 | 0 | VA-GEO-01 | — | N/A | manual check | `grep -n "STATE_RUN_MAKEVALID" C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts` | ✅ W0 | ⬜ pending |
| 100-01-04 | 01 | 0 | VA-GEO-01 | — | N/A | manual check | `grep -n "EXPECTED_VA_MTFCC" C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts` | ✅ W0 | ⬜ pending |
| 100-01-05 | 01 | 0 | VA-GEO-01 | — | N/A | script | `npx tsx scripts/load-state-tiger-boundaries.ts --state VA --fips 51 --layers cd119,sldu,sldl,place,county --dry-run` | ❌ W0 | ⬜ pending |
| 100-01-06 | 01 | 0 | VA-GEO-03 | — | N/A | script | `npx tsx scripts/smoke-va-geofences.ts` | ❌ W0 | ⬜ pending |
| 100-02-01 | 02 | 1 | VA-GEO-01 | — | N/A | SQL | `psql $DATABASE_URL -f scripts/verify-va-tiger-import.sql` | ❌ W0 | ⬜ pending |
| 100-02-02 | 02 | 1 | VA-GEO-02 | — | N/A | SQL (Gate 4) | `psql $DATABASE_URL -f scripts/verify-va-tiger-import.sql` | ❌ W0 | ⬜ pending |
| 100-02-03 | 02 | 1 | VA-GEO-03 | — | N/A | smoke test | `npx tsx scripts/smoke-va-geofences.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `C:/EV-Accounts/backend/scripts/verify-va-tiger-import.sql` — 7-gate SQL verification (adapt from verify-md-tiger-import.sql; Gate 4 Alexandria dual-tier; Gate 7 OR-direction)
- [ ] `C:/EV-Accounts/backend/scripts/smoke-va-geofences.ts` — 3-address smoke test: Alexandria, Richmond, rural Shenandoah (adapt from smoke-md-geofences.ts)

*Loader edits to load-state-tiger-boundaries.ts (not new files):*
- [ ] `STATE_LAYER_ALLOWLIST['VA']` — add `VA: new Set(['cd119', 'sldu', 'sldl', 'place', 'county'])`
- [ ] `STATE_CITY_ASSERTIONS['VA']` — add `VA: ['Alexandria city']`
- [ ] `STATE_RUN_MAKEVALID['VA']` — add `VA: new Set(['cd119', 'sldu', 'sldl', 'place', 'county'])`
- [ ] `EXPECTED_VA_MTFCC block` — insert after MD block: `{cd119:11, sldu:40, sldl:0, place:0, county:133}` (sldl/place sentinel 0 until dry-run confirms)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dry-run reveals actual sldl count (~100) | VA-GEO-01 | EXPECTED_VA_MTFCC sentinel is 0; actual count only appears in loader output | Run dry-run, note `[sldl] VA MTFCC pre-flight assertion PASSED: N records`; update sentinel to N before live load |
| Dry-run reveals actual place count | VA-GEO-01 | G4110-only count unknown (TIGERweb shows 433 but actual file differs); sentinel 0 | Same as above — note `[place]` count from dry-run output; update sentinel |
| Alexandria NAMELSAD casing check | VA-GEO-02 | STATE_CITY_ASSERTIONS gate fires on dry-run if casing is wrong | Dry-run output shows `STATE_CITY_ASSERTIONS gate output: Seen NAMELSAD values: [...]`; confirm 'Alexandria city' (lowercase) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
