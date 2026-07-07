---
phase: 184
slug: school-boards-wave-2-tigard-tualatin-sd-23j-forest-grove-sd
status: ready
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-04
---

# Phase 184 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Populated from 184-RESEARCH.md "Validation Architecture" (data-seed phase: verification is
> SQL/HTTP gates + address-routing smoke tests, not a unit-test suite; Phase 183/174/166 pattern).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Inline SQL gates (`psql -f` / `psql -c`) + reuse of existing `npx tsx scripts/smoke-or-westmetro-school.ts` |
| **Config file** | none — data-seed phase, no app-level test suite involved |
| **Quick run command** | `psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM essentials.offices o JOIN essentials.districts d ON d.id=o.district_id WHERE d.geo_id IN ('4112240','4105160','4111290') AND d.district_type='SCHOOL';"` (expect 15) |
| **Full suite command** | `npx tsx scripts/smoke-or-westmetro-school.ts` (all 5 west-metro districts, incl. this wave's 3) + full E2E gate suite pattern from 183-04-SUMMARY.md |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After structural migration (expected 1206):** office-count (5 per district, 15 total), section-split, casing, smoke-routing checks
- **After headshot migration:** headshot-count check (15, or 14 if the Harrington gap ships documented)
- **Phase gate (final plan):** all checks green + 0-stance-rows check + live Playwright browse of all 3 new coverage links before `/gsd:verify-work`
- **Max feedback latency:** ~20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| (probes) | 01 | 1 | WSCH-03/04/05 | — | N/A | SQL probe | `psql -f _tmp-westmetro-school-wave2-probe.sql` | ❌ W0 (clone wave1 probe + IN-03 nits) | ⬜ pending |
| (structural) | 02 | 2 | WSCH-03 | T-injection | parameterized/literal SQL only | SQL | `psql -c "SELECT COUNT(*) FROM essentials.offices o JOIN essentials.districts d ON d.id=o.district_id WHERE d.geo_id='4112240' AND d.district_type='SCHOOL'"` (expect 5) | ✅ psql | ⬜ pending |
| (structural) | 02 | 2 | WSCH-04 | T-injection | parameterized/literal SQL only | SQL | same, geo_id='4105160' (expect 5) | ✅ | ⬜ pending |
| (structural) | 02 | 2 | WSCH-05 | T-injection | parameterized/literal SQL only | SQL | same, geo_id='4111290' (expect 5) | ✅ | ⬜ pending |
| (routing) | 02 | 2 | WSCH-03/04/05 | — | N/A | smoke | `npx tsx scripts/smoke-or-westmetro-school.ts` (exit 0) | ✅ (Phase 174) | ⬜ pending |
| (headshots) | 03 | 3 | WSCH-03/04/05 | T-SSRF (hardcoded URLs only) | no runtime-supplied URLs; parameterized psycopg2 | SQL | headshot-count query over the 3 ext-id blocks (expect 15 or 14+documented gap) | ❌ trivial new query | ⬜ pending |
| (0 stances) | 04 | 4 | WSCH-03/04/05 | — | N/A | SQL | 0-stance-rows query over the 3 ext-id blocks (expect 0 — any row is a defect) | ❌ trivial new query | ⬜ pending |
| (casing) | 02 | 2 | WSCH-03/04/05 | — | N/A | SQL | `SELECT DISTINCT state FROM essentials.districts WHERE geo_id IN ('4112240','4105160','4111290') AND district_type='SCHOOL'` (expect only 'or') | ❌ trivial new query | ⬜ pending |
| (surfacing) | 04 | 4 | WSCH-03/04/05 | — | N/A | node + live | `node --check src/lib/coverage.js` + Playwright browse of all 3 G5420 links | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `C:/EV-Accounts/backend/scripts/_tmp-westmetro-school-wave2-probe.sql` — clone of the wave-1 probe with IN-03 nits applied (accurate ledger comment, margin on BOTH ext-id bounds) and 5-per-district ranges
- [ ] Framework install: none — all dependencies already present

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Board name renders as card subtitle (groupHierarchy Rule 3.5) for all 3 new chambers | WSCH-03/04/05 | Visual render check on live app | Playwright/human browse of the 3 coverage links; confirm subtitle shows the verbatim board name |
| Headshot identity + crop quality (esp. TTSD circular finalsite sources, FGSD Edlio, Sherwood wp-json originals) | WSCH-03/04/05 | Identity/aesthetics not machine-checkable | Human-verify checkpoint on live profile cards |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
