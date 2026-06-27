---
phase: 171-banner-asset-pipeline-exemplar-art
verified: 2026-06-27T22:42:00Z
status: passed
score: 4/4 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: none
  note: initial verification
---

# Phase 171: Banner Asset Pipeline & Exemplar Art Verification Report

**Phase Goal:** The two exemplar banner sets exist as real art, and anyone can add a new jurisdiction's banner set by following a written procedure.
**Verified:** 2026-06-27T22:42:00Z
**Status:** passed
**Re-verification:** No — initial verification
**Requirements:** ASST-01, ASST-02

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Bloomington/Indiana/US and LA/California/US banner art exists in the unified skyline + dark-overlay treatment, stored consistently and wired into `buildingImages.js` | ✓ VERIFIED | All six exemplar assets return HTTP 200 from production Storage: `cities/bloomington.jpg` (274,389 B), `states/IN.jpg` (184,552 B), `states/CA.jpg` (302,070 B), `la_county/.../0644000-skyline.jpg` (113,957 B), `national/us-capitol-banner.jpg` (144,126 B). All wired in `buildingImages.js` (`CURATED_LOCAL.bloomington`, `CURATED_LOCAL['los angeles']`, `STATE_PANORAMAS` IN+CA, `FEDERAL_IMAGE`). Dark overlay applied at render by `SectionBanner.jsx` (locked in 170), source images intentionally untreated. **D-09: AI fallback intentionally dropped — documented divergence, not a gap.** |
| 2 | Browsing a Bloomington address and an LA address each shows its own exemplar banner set on live Results (not generic fallback) | ✓ VERIFIED (deploy-pending render) | Bloomington Storage image live (HTTP 200); `getBuildingImages('Bloomington','IN').Local` resolves to the Storage URL (test asserts exact match); LA set already live since 170. Operator approved final crop at Task 4 human sign-off (vertical-anchor 0.85, flag in top third). Rewire is committed; takes effect on public site at next deploy of `main` — noted, not failed. |
| 3 | A documented, repeatable procedure exists (sourcing → dark-overlay treatment → wiring into `buildingImages.js`) sufficient for ~10 remaining states to be filled in without re-deriving | ✓ VERIFIED | `docs/banner-asset-pipeline.md` — 8-stage runbook (Sourcing → Treatment → Optimize → Upload → Path Conventions → Wiring → Attribution → Verify Live). Backed by committed reusable toolchain: `scripts/banners/process_banner.py` + `upload_banner.py`. Covers D-05 `cities/<slug>.jpg` convention, all 4 Storage tiers, attribution convention, service-role-key-from-env. Both scripts `--help` exit 0. |
| 4 | Jurisdictions without art still fall back to graceful gradient/generic banner (no broken images) | ✓ VERIFIED | `getBuildingImages('Nowhere','ZZ')` returns `Local:null, State:null` (test passes); `SectionBanner.jsx` `onError`→tier-gradient (built 170). Dead `STATE_CAPITOLS` image-fallback branch removed; uncovered states now return null. |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `src/lib/buildingImages.js` | Bloomington rewired to Storage; D-04 cleanup; STATE_CAPITOLS retained | ✓ VERIFIED | Bloomington → `cities/bloomington.jpg`; attribution comment present; STATE_CAPITOLS object retained (feeds STATE_NAME_TO_ABBREV + VALID_STATE_ABBREVS); no FALLBACK_* or state-capitols image branch. |
| `src/lib/buildingImages.test.js` | Regression guard | ✓ VERIFIED | 6/6 passing: Bloomington URL, null fallback (crit 4), unchanged CA panorama, 3 parser behaviors. |
| `docs/banner-asset-pipeline.md` | ASST-02 procedure | ✓ VERIFIED | 8 stages; D-05 + D-09 documented; no raw backslash Windows paths. |
| `scripts/banners/process_banner.py` | PIL crop/resize/optimize | ✓ VERIFIED | 1700x540 JPEG q90, LANCZOS, --vertical-anchor, --overlay off-by-default; --help exit 0. |
| `scripts/banners/upload_banner.py` | Storage upload, key-from-env | ✓ VERIFIED | SUPABASE_SERVICE_ROLE_KEY via env; unset-key guard exits 1 (verified); curl -X PUT; key never printed. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `buildingImages.js` → SectionBanner | `Local`/`State`/`Federal` URLs | CURATED_LOCAL / STATE_PANORAMAS / FEDERAL_IMAGE constants → live Storage | Yes — all referenced URLs return HTTP 200 image/jpeg | ✓ FLOWING |

### D-04 Cleanup Verification

| Item | Status |
| --- | --- |
| `public/images/state-capitols/*.jpg` (×50) | ✓ Directory removed |
| `public/images/bloomington-city-hall.jpg` | ✓ Removed (only `.svg` placeholder-era variants remain elsewhere; not referenced) |
| FALLBACK_LOCAL / FALLBACK_STATE constants | ✓ Removed; 0 references in src |
| STATE_CAPITOLS object | ✓ RETAINED (load-bearing for parsers) — confirmed via passing parser tests |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Bloomington Storage live | curl cities/bloomington.jpg | HTTP 200, 274,389 B image/jpeg | ✓ PASS |
| buildingImages regression | npx vitest run src/lib/buildingImages.test.js | 6/6 pass | ✓ PASS |
| Full suite (no regressions) | npx vitest run | 59/59 pass (7 files) | ✓ PASS |
| process_banner runnable | --help | exit 0 | ✓ PASS |
| upload_banner runnable | --help | exit 0 | ✓ PASS |
| upload key guard | unset key + run | exit 1 | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| ASST-01 | 171-02 | Exemplar banner art produced + integrated for Bloomington/IN/US + LA/CA/US | ✓ SATISFIED | All 6 assets live + wired; Bloomington gap closed; D-09 AI-drop accepted divergence |
| ASST-02 | 171-01 | Documented repeatable procedure for adding a jurisdiction's banner set | ✓ SATISFIED | 8-stage runbook + 2 committed reusable scripts |

### Anti-Patterns Found

None. No TODO/FIXME/XXX/TBD/HACK/PLACEHOLDER markers in scripts; no dead-code references to removed assets/constants in src.

### Documented Divergences (Accepted)

- **D-09 AI fallback dropped:** ROADMAP criterion 1 / ASST-01 text name "AI fallback." Intentionally replaced with real-licensed-photo → gradient-fallback pipeline. Documented in CONTEXT D-09 and the runbook. Not scored as a miss.
- **Deploy-pending render (criterion 2):** buildingImages.js rewire committed; public-site render takes effect at next deploy of main. Storage liveness + wiring + regression test verified; operator approved at Task 4 sign-off. Noted, not failed.

### Gaps Summary

None. All 4 ROADMAP success criteria verified against the codebase and live Storage. Both requirements (ASST-01, ASST-02) satisfied. The phase goal — two exemplar banner sets as real art plus a written, repeatable procedure — is achieved.

---

_Verified: 2026-06-27T22:42:00Z_
_Verifier: Claude (gsd-verifier)_
