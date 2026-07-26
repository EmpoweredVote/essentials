---
phase: 194
slug: city-of-tucson-deep-seed
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-09
---

# Phase 194 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This is a **DB-seeding + asset phase**, not an application-code phase. There is no unit-test
> framework to run — validation is **live-DB row assertions (via `mcp__supabase-local`), geofence
> routing probes, section-split scans, image dimension/count checks, stance-citation audits, and
> grep-based frontend-wiring checks**, all ORCHESTRATOR-RUN (executor has no Supabase/Storage/web access).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — DB assertions via `mcp__supabase-local.execute_sql`; grep for frontend wiring; ImageMagick `identify` for headshot dims |
| **Config file** | none |
| **Quick run command** | `SELECT` row-count / routing probes against live Supabase (orchestrator-run) |
| **Full suite command** | Section-split scan + geofence routing probes + stance-citation audit + `identify` on all 7 headshots + `grep` coverage.js/buildingImages.js |
| **Estimated runtime** | ~60 seconds (interactive orchestrator queries) |

---

## Sampling Rate

- **After every structural migration apply:** Run the row-count / FK-integrity SELECT for that table
- **After ward geofence load:** Run per-ward routing probes + section-split scan
- **After headshot upload:** `identify` dimension + count check (7/7 at 600×750)
- **After stance writes:** citation-coverage audit (0 uncited, 0 default rows)
- **Before `/gsd:verify-work`:** all success-criteria probes green
- **Max feedback latency:** ~60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 194-*-* | ward geofences | 1 | TUC-01 | — | multi-ring wards load as faithful MultiPolygon (no self-intersection) | DB assertion | `SELECT ST_IsValid(geom), ST_NumGeometries(geom) per ward geo_id` | ❌ W0 | ⬜ pending |
| 194-*-* | government+roster | 2 | TUC-01 | — | 1 govt + 1 chamber + 7 offices (Mayor + 6 wards); Vice Mayor = title annotation, not a 7th seat | DB assertion | `SELECT` office/politician counts + join scoped `district_type='LOCAL' AND mtfcc='X0020' AND state='az'` | ❌ W0 | ⬜ pending |
| 194-*-* | routing | 2 | TUC-01 | — | a per-ward test coordinate returns exactly that ward member + the at-large Mayor | DB routing probe | geofence point-in-polygon probe per ward centroid | ❌ W0 | ⬜ pending |
| 194-*-* | headshots | 3 | TUC-01 | — | 7/7 portraits at exactly 600×750, license documented | image assertion | `identify -format '%wx%h'` on each; count = 7 | ❌ W0 | ⬜ pending |
| 194-*-* | stances | 4 | TUC-01 | — | evidence-only rows, 100% cited, 0 default rows, judicial-* excluded | DB audit | `SELECT` uncited/default-row count = 0 in `inform.politician_answers` | ❌ W0 | ⬜ pending |
| 194-*-* | banner | 5 | BANR-01 | — | licensed real streetscape (no AI/aerial) processed, uploaded, wired | grep + Storage check | `grep` Tucson entry in `src/lib/buildingImages.js` CURATED_LOCAL; Storage object exists | ❌ W0 | ⬜ pending |
| 194-*-* | coverage | 5 | TUC-01 | — | City of Tucson chip surfaced, DB-honest, in a new AZ block | grep | `grep` City of Tucson in `src/lib/coverage.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*Exact task IDs assigned by the planner; this map is keyed by deliverable and refined once PLAN.md files exist.*

---

## Wave 0 Requirements

- No test-framework install required — this phase has no application-code unit surface.
- Wave 0 = **pre-seed BLOCKING checkpoints** (these gate everything downstream):
  - [ ] **Loader ring-structure verify** — confirm the ward loader copies Phase 193's winding-classification helper in full (Ward 4 = 2 rings, Ward 5 = 7 rings → MultiPolygon; the single-ring fast path is INCORRECT here / WR-01).
  - [ ] **Roster-currency human-verify** — confirm sitting Mayor + 6 ward members + who holds Vice Mayor (research says Lane Santa Cruz / Ward 1) reflect who represents a resident *today*; flag any vacant seat.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Banner is a real, licensed, non-AI, non-aerial downtown streetscape distinct from Pima/Phoenix | BANR-01 | Visual + license judgement can't be asserted programmatically | Review the sourced photo against D-07; confirm license/attribution recorded |
| Headshots are correct-person, head-and-shoulders, undistorted | TUC-01 | Identity + crop quality is a visual check | Eyeball each 600×750 crop against the official/source portrait |
| Roster reflects who serves today (incl. Vice Mayor holder) | TUC-01 | Ground truth is real-world civic state, not a queryable invariant | Human confirms against official City of Tucson + news sources at the roster checkpoint |

---

## Validation Sign-Off

- [x] Every deliverable has an orchestrator-run DB/asset/grep assertion (above) — confirmed present in all 6 PLAN.md
- [x] Sampling continuity: assertion after each migration apply, load, upload, and stance write — no 3 consecutive tasks without an automated verify
- [x] Both BLOCKING Wave-0 checkpoints planned as gating tasks (194-01 Task 2 loader ring-verify, 194-02 Task 2 roster-currency), both `autonomous: false`
- [x] Section-split-scan-clean assertion is a task in 194-01/194-06
- [x] `nyquist_compliant: true` set in frontmatter

> `wave_0_complete` stays `false` intentionally — the two Wave-0 gates are *planned* but *execute* during `/gsd:execute-phase 194`; it flips to `true` once those checkpoints actually pass at runtime.

**Approval:** approved 2026-07-09 (plan-checker: 0 blockers, Dimension 8 PASS)
