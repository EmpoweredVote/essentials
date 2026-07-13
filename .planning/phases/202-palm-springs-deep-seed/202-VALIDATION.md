---
phase: 202
slug: palm-springs-deep-seed
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-12
---

# Phase 202 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x (`"test": "vitest run"` in `package.json`) |
| **Config file** | none dedicated — Vite default config picks up colocated `*.test.js` |
| **Quick run command** | `npm test -- src/lib/buildingImages.test.js` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

**Note:** This is a data deep-seed phase. The primary validation surface is a DB/CDN
audit block run by the ORCHESTRATOR against production (mirrors `201-06-PLAN.md`), not
Vitest. The executor has no DB/Storage/browser access — structural correctness is proven
via `psql` audit assertions + a blocking live-browse human-verify checkpoint.

---

## Sampling Rate

- **After every task commit:** For any frontend file change (only `coverage.js` this phase), run `npm run build` sanity + `node scripts/gen-coverage.mjs`
- **After every plan wave:** Run `npm run build` (catches `coverage.js`/`buildingImages.js` syntax errors)
- **Before `/gsd:verify-work`:** Full production DB/CDN audit block green + live-browse checkpoint signed off
- **Max feedback latency:** ~30 seconds (build) / audit block is orchestrator-run at phase gate

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 202-*-* | geofence | 1 | CV-02 | T-202-01 (malformed geometry) | `ST_MakeValid` repair; reject if `ST_IsValid` still fails; DISTRICT range-checked 1–5 | integration (DB) | orchestrator-run `psql` audit (mirrors 201-06 Task 1) | ✅ pattern (201-06) | ⬜ pending |
| 202-*-* | roster/office | 2 | CV-02 | T-202-02 (wrong-district/stale roster) | Cross-verify FeatureServer `CouncilName` vs press; Mayor/MPT as title-on-seat, no LOCAL_EXEC row | integration (DB) | orchestrator-run `psql` audit + live-browse routing probe | ✅ pattern (156/152/201) | ⬜ pending |
| 202-*-* | headshots | 2 | CV-02 | — | 600×750 4:5 crop-first, no distortion | manual/visual | orchestrator visual-QA artifact | ✅ pattern | ⬜ pending |
| 202-*-* | stances | 3 | CV-02 | — | evidence-only, 100% cited, honest blanks, no defaults, one agent at a time | manual (agent-audited) | stance-citation audit | ✅ pattern | ⬜ pending |
| 202-*-* | coverage.js chip | 3 | BANR-01 | T-202-03 (non-idempotent) | correct `label`/`browseGovernmentList`/`browseStateAbbrev`/`hasContext` shape | build/visual | `node scripts/gen-coverage.mjs` + `npm run build` | ⚠️ no unit (per every prior phase) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.* Vitest + `buildingImages.test.js`
cover the one frontend-logic surface this phase touches (unchanged — the `'palm springs'`
CURATED_LOCAL key and banner already shipped in Phase 201). The DB/CDN audit pattern from
Phase 201 is a complete, proven, directly-reusable template for the new `coverage.js`
config surface plus all backend structural/audit assertions.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| A probe address in each of the 5 districts routes to exactly one councilmember | CV-02 | Requires live production DB + geofence GIST query; executor has no DB access | Orchestrator runs 5 point-in-polygon probes via `psql`, one per district centroid, asserts exactly one member returned |
| City surfaces in browse with a DB-honest chip | BANR-01 | Requires live app render | Live-browse `/results?browse_geo_id=0655254`; confirm chip + roster + compass render |
| Headshots crop/size correct, no distortion | CV-02 | Visual judgment | Orchestrator visual-QA artifact review (4:5, eyes ~1/3 from top) |
| Stances are evidence-only with honest blanks | CV-02 | Citation judgment | Audit each applied stance has a live citation; no defaulted spokes |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or orchestrator-run audit assertions
- [x] Sampling continuity: no 3 consecutive tasks without a verification step
- [x] Wave 0 covers all MISSING references (none — existing infra sufficient)
- [x] No watch-mode flags
- [x] Feedback latency < 30s (build) / audit at phase gate
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-07-12
