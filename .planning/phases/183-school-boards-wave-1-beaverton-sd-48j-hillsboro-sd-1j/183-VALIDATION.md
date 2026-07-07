---
phase: 183
slug: school-boards-wave-1-beaverton-sd-48j-hillsboro-sd-1j
status: ready
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-04
---

# Phase 183 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Populated from 183-RESEARCH.md "Validation Architecture" (data-seed phase: verification is
> SQL/HTTP gates + address-routing smoke tests, not a unit-test suite; Phase 166/174 pattern).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Inline SQL gates (`psql -f` / `psql -c`) + reuse of existing `npx tsx scripts/smoke-or-westmetro-school.ts` |
| **Config file** | none — ad-hoc scripts (project deep-seed convention) |
| **Quick run command** | `npx tsx scripts/smoke-or-westmetro-school.ts` (asserts routing for BOTH geo_ids from Phase 174 — re-run to confirm no regression) |
| **Full suite command** | Inline ~9-check E2E SQL/HTTP verification (see Per-Task Verification Map) |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After structural migration 1203 (Plan 183-02):** office-count, section-split, casing, smoke-routing checks
- **After headshot migration 1204 (Plan 183-03):** headshot-count check
- **Phase gate (Plan 183-04):** all checks green + 0-stance-rows check + coverage.js manual browse-verify before `/gsd:verify-work`
- **Max feedback latency:** ~20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 183-01-01/02 | 01 | 1 | WSCH-01/02 | — | Idempotency guards confirmed before any write | SQL probes | Wave-0 probe file (migration MAX, external_id collision, greenfield, geofence pre-check) | ❌ W0 | ⬜ pending |
| 183-02-* | 02 | 2 | WSCH-01 | Migration re-run integrity | `WHERE NOT EXISTS` idempotency | SQL gate | `SELECT COUNT(*) FROM essentials.offices o JOIN essentials.districts d ON d.id=o.district_id WHERE d.geo_id='4101920' AND d.district_type='SCHOOL' AND d.state='or'` = 7 | ❌ W0 | ⬜ pending |
| 183-02-* | 02 | 2 | WSCH-02 | Migration re-run integrity | `WHERE NOT EXISTS` idempotency | SQL gate | Same office-count gate for `d.geo_id='4100023'` = 7 | ❌ W0 | ⬜ pending |
| 183-02-* | 02 | 2 | WSCH-01/02 | — | — | smoke | `npx tsx scripts/smoke-or-westmetro-school.ts` (existing, Phase 174) exits green for both geo_ids | ✅ (Phase 174) | ⬜ pending |
| 183-02-* | 02 | 2 | WSCH-01/02 | — | — | SQL gate | Section-split scan for `4101920` and `4100023` G5420 = 0 orphan rows | ❌ W0 | ⬜ pending |
| 183-02-* | 02 | 2 | WSCH-01/02 | — | — | SQL gate | `SELECT DISTINCT state FROM essentials.districts WHERE geo_id IN ('4101920','4100023')` = `'or'` only | ❌ W0 | ⬜ pending |
| 183-03-* | 03 | 3 | WSCH-01 | Malicious image payload | Pillow decode fails closed pre-upload | SQL gate | `politician_images` count for `external_id BETWEEN -4101927 AND -4101921` = 7 minus documented gaps | ❌ W0 | ⬜ pending |
| 183-03-* | 03 | 3 | WSCH-02 | Malicious image payload | Pillow decode fails closed pre-upload | SQL gate | `politician_images` count for `external_id BETWEEN -4100030 AND -4100024` = 7 minus documented gaps; no student reps (Hernandez Jimenez/Sayre/Woods excluded) | ❌ W0 | ⬜ pending |
| 183-04-* | 04 | 4 | WSCH-01/02 | — | — | SQL gate | 0 compass stance rows across both external_id ranges (success state) | ❌ W0 | ⬜ pending |
| 183-04-* | 04 | 4 | WSCH-01/02 | — | — | manual | `src/lib/coverage.js` has both entries, no `hasContext`; browse both `?browse_geo_id=...&browse_mtfcc=G5420` links live | ❌ W0 manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] On-disk migration MAX re-confirm: `ls C:/EV-Accounts/backend/migrations` numeric max (confirmed 1202 this session → next 1203)
- [ ] External_id collision re-probe: `-4101921..-4101927` and `-4100024..-4100030` both 0 rows (confirmed 2026-07-04)
- [ ] No pre-existing governments for either district name → 0 rows (confirmed 2026-07-04)
- [ ] Geofence pre-check: both `4101920`/`4100023` G5420 rows exist with valid geometry (confirmed — do NOT re-load)
- [ ] Re-verify both district sites still return HTTP 200 with no WAF at execution time
- [ ] Re-confirm roster hasn't changed (both rosters live-pulled 2026-07-04)
- [ ] Optional: one more Washington County filing-PDF confirmation of Hillsboro "Director, Position N" wording (non-blocking default locked in Plan 183-01)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Correct-person headshots, no student reps seeded | WSCH-01/02 | Visual identity check | Browse a Beaverton address and a Hillsboro address; confirm 7 directors each, correct photos, Chair/Vice-Chair labels visible, no 8th/9th/10th row |
| Card subtitle shows district name | WSCH-01/02 | Frontend render | Confirm "Beaverton School District 48J" / "Hillsboro School District 1J" heading renders above each 7-member group (expected automatic via `getAccordionKey` SCHOOL fallback — no code change) |
| Coverage chip renders as plain (no stance-count chip) | WSCH-01/02 | Frontend render | Visit `essentials.empowered.vote/results?browse_geo_id=4101920&browse_mtfcc=G5420` and `...browse_geo_id=4100023&browse_mtfcc=G5420` |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-07-04 (plan-checker pass; populated from RESEARCH.md Validation Architecture)
