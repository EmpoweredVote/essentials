---
phase: 193
slug: pima-county-board-of-supervisors-deep-seed
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-09
validated: 2026-07-09
---

# Phase 193 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This is a data-seeding + asset-wiring phase — "validation" = production SQL/HTTP assertions
> (`psql -tAc` / `curl -sI` / PIL dimension checks), NOT a unit-test framework (matches the
> Phase 190–192 pattern). All DB/Storage/GIS operations are ORCHESTRATOR-RUN inline.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — production SQL/HTTP assertions (`psql`, `curl`, Python/PIL) |
| **Config file** | `C:/EV-Accounts/backend/.env` (DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) |
| **Quick run command** | `psql "$DATABASE_URL" -tAc "<assertion>"` (per-check) |
| **Full suite command** | The full audit block (all Per-Task assertions, run inline at the verification wave) |
| **Estimated runtime** | ~seconds per assertion |

---

## Sampling Rate

- **After every seeding/apply step:** Run the relevant `psql -tAc` assertion for that step.
- **After every plan wave:** Run the wave's audit assertions (counts + linkage + section-split).
- **Before phase verification:** Full audit block must be all-green + banner CDN 200 + coverage chip DB-honest.
- **Max feedback latency:** seconds.

---

## Per-Task Verification Map

*Populated by the planner from each plan's `<verify><automated>` blocks. Expected checks (from RESEARCH):*

| Check | Wave | Requirement | Threat Ref | Test Type | Automated Command (shape) | Status |
|-------|------|-------------|------------|-----------|---------------------------|--------|
| 5 supervisor-district geofences loaded (X0019), single-ring, DISTRICT 1–5 | geofence | PIMA-01 | T-193-geo | SQL | `psql -tAc "SELECT count(*) ... geo_id LIKE 'X0019%' / LOCAL district rows = 5"` | ✅ green (193-06 a: 5/valid) |
| Pima County standalone government exists (geo_id 04019, NOT under State of AZ) | seed | PIMA-01 | T-193-gov | SQL | `psql -tAc "SELECT count(*) FROM governments WHERE geo_id='04019'"` | ✅ green (193-06 b: 1) |
| 5 supervisor offices under 'Board of Supervisors' chamber, 1 per district | seed | PIMA-01 | T-193-seed | SQL | `psql -tAc` count = 5; GROUP BY district HAVING count<>1 → 0 | ✅ green (193-06 c: 5/0 violations) |
| Cano (D5) is_appointed=true; roster matches (Scott/Heinz/Allen/Christy/Cano) | seed | PIMA-01 | T-193-roster | SQL | `psql -tAc` is_appointed count = 1 | ✅ green (193-06 d: 1) |
| Address in each district routes to exactly 1 supervisor | seed | PIMA-01 | T-193-route | HTTP/human | live browse per district | ✅ manual — operator sign-off (193-06 Task 2) |
| 5/5 supervisors have 600×750 headshots (politician_images + CDN 200) | headshots | PIMA-01 | T-193-photo | SQL+HTTP | count=5; `curl -sI` 200; PIL 600×750 | ✅ green (193-06 e: 5/5×200/600×750) |
| Evidence-only stances: 100% cited, no default rows, honest blanks | stances | PIMA-01 | T-193-stance | SQL | `psql -tAc` no null/default answer rows; cited-only | ✅ green (193-06 f: 0 uncited/0 judicial/0 out-of-range) |
| Pima County banner uploaded to Storage + wired in buildingImages.js (CURATED_LOCAL 'pima county') | banner | BANR-01 | T-193-banner | HTTP+src | `curl -sI` banner 200; grep buildingImages.js | ✅ green (193-06 i: CDN 200 + h: entry present) |
| Pima County surfaced in coverage.js (COVERAGE_COUNTIES), DB-honest chip | surfacing | PIMA-01 | T-193-cov | src | grep coverage.js Pima block | ✅ green (193-06 h: chip hasContext:true present) |
| Section-split scan clean for the new LOCAL districts | verify | PIMA-01 | T-193-split | SQL | section-split query → 0 rows | ✅ green (193-06 g: 0) |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- No test framework to install — existing `psql`/`curl`/Python(PIL) toolchain covers all assertions.
- Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Address→supervisor routing renders 1 correct supervisor per district | PIMA-01 | UI-resolved; row-count can't confirm rendering | Enter a known-district AZ address on essentials.empowered.vote; confirm 1 supervisor labeled that district |
| Correct-person headshot (esp. appointee Cano D5) | PIMA-01 | Row-count can't confirm WHO a photo depicts | Spot-check the 5 supervisors show the right current person |
| Banner renders for Pima County (first county-tier banner) | BANR-01 | Graceful-degradation nuance (Pitfall 7): address-tier fallback may not show it until browsed via coverage.js chip | Browse Pima County via the coverage chip; confirm the Catalinas/Sonoran banner renders |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or are covered by Manual-Only above
- [x] Sampling continuity: no long stretch without an automated assertion
- [x] Section-split assertion present for the new LOCAL districts (193-06 check g: 0)
- [x] `nyquist_compliant: true` set in frontmatter (after planner finalizes the map)

**Approval:** validated 2026-07-09 — all 10 production audit checks green (193-06-SUMMARY.md); routing/photos/banner manual items signed off by operator via live browse of `/results?browse_geo_id=04019`.

---

## Validation Audit 2026-07-09

| Metric | Count |
|--------|-------|
| Requirements audited | 10 checks (PIMA-01 ×9, BANR-01 ×1) |
| Gaps found | 0 |
| Resolved | 0 (all pre-covered by orchestrator-run production assertions) |
| Escalated | 0 |
| Manual-only (satisfied) | 1 (address→supervisor routing; operator live-browse sign-off) |

**Result:** NYQUIST-COMPLIANT. All 9 automated checks in the Per-Task map ran green in the 193-06 full production audit (10/10, including the combined boolean SELECT → `t`); the sole HTTP/human check (per-district routing) is covered under Manual-Only and was signed off by the operator. No test files generated — this data-seeding phase uses production SQL/HTTP/PIL assertions by design (Phase 190–192 pattern), not a unit-test framework, so there is no automatable gap to fill.
