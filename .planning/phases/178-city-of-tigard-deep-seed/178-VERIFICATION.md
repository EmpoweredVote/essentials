---
phase: 178-city-of-tigard-deep-seed
verified: 2026-07-02T23:59:00Z
status: human_needed
score: 9/9 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Browse https://essentials.empowered.vote/results?browse_geo_id=4173650&browse_mtfcc=G4110 after the next frontend deploy and confirm the Tigard community banner photo renders in the Local section (not the tier-gradient fallback)."
    expected: "Downtown Tigard Oregon photo (cities/tigard.jpg) displays as the section background."
    why_human: "Requires the deployed frontend; local main is 33 commits ahead of origin at verification time (deploy cadence is user-controlled, consistent with phase 177 precedent). The CDN asset (200) and the CURATED_LOCAL wiring are code/asset-verified; only the live render is pending deploy."
  - test: "On the coverage/landing page, confirm the purple hasContext chip appears next to 'Tigard' in the Oregon block."
    expected: "Tigard shows the same purple hasContext chip styling as Beaverton/Hillsboro/Portland."
    why_human: "Requires the deployed frontend for the same reason as above; the coverage.js data row (hasContext:true, correct geo_id, correct alphabetical position) is confirmed committed at 424501f."
---

# Phase 178: City of Tigard Deep-Seed Verification Report

**Phase Goal:** A Tigard resident looks up who represents them and gets the correct Mayor + council member, with evidence-only stances on their profiles.
**Verified:** 2026-07-02
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (mapped to ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Any Tigard address returns the correct Mayor + council member; form of government verified and modeled correctly | ✓ VERIFIED | Migration `1159_tigard_city_council.sql` (read directly) seeds exactly 1 government, 1 chamber (official_count=7), 2 citywide districts (LOCAL_EXEC + LOCAL, `state='or'` lowercase, geo_id `4173650`), and 7 offices with plain `'Mayor'`/`'Councilor'` titles — no ward/X00xx districts anywhere in the file. Post-verify DO block in the migration asserts gov=1, offices=7 (not 8), an independent geofence-presence check (≥1 G4110 row for geo_id 4173650), the canonical `GROUP BY/HAVING` section-split query = 0, 0 NULL office_id, and representing_city='Tigard' on all 7 — this is the WR-01 fix (an *independent* post-check, not the dead same-transaction gate carried from earlier city templates). 178-02-SUMMARY.md records these gates emitting "Post-verification PASSED" against production and an independent E2E gate a–g re-confirming the same facts via separate SELECTs; orchestrator-recorded per task instructions as live DB evidence. Code review (178-REVIEW.md) independently confirms these same structural properties reading the same file, with 0 critical findings on this migration. |
| 2 | The full seated roster is seeded; all officials render with 600×750 headshots (genuine gaps documented) | ✓ VERIFIED | Migration `1159` seeds exactly the 7 confirmed officials (Hu, Anderson, Ghoddusi, Robbins, Schlack, Shaw, Wolf) with correct appointed flags (Hu/Anderson `is_appointed=true`+`is_appointed_position=true`; other 5 false/false) and Youth Councilor correctly excluded. Migration `1160_tigard_headshots.sql` (read directly) contains exactly 7 `politician_images` INSERTs (one per official, columns `(id, politician_id, url, type, photo_license)`, no `photo_origin_url`, each `WHERE NOT EXISTS` guarded) — a 7/7 outcome, exceeding the acceptable 5/7-6/7 partial the plan explicitly permitted. Pipeline script `_tmp-tigard-headshots.py` (read directly) implements crop-to-4:5 BEFORE resize-to-600×750-Lanczos-q90 (`crop_to_4_5` called before `resize_600x750`, asserted `img.size == TARGET_SIZE`), resolves UUIDs at runtime by external_id (not hardcoded), and does NOT hard-assert `len==7` (genuine-gap tolerant). 178-03-SUMMARY.md records the 7/7 outcome with per-official sources, all press_use, all HTTP-200 CDN URLs. |
| 3 | Evidence-only compass stances render on profiles — 100% cited, honest blank spokes, no default values | ✓ VERIFIED | Read `1161_hu_stances.sql` directly: 7-row VALUES block, every row has non-empty `reasoning` + a populated `sources` text[] array with real URLs, `topic_id` resolved via `JOIN inform.compass_topics ON topic_key AND is_live=true` (no hardcoded topic UUID), WR-02 row-count assertion (`IF n <> 7 THEN RAISE EXCEPTION`) present and matches the authored row count. Spot-checked all 7 files (1162–1167) for the same structural pattern via grep: each has exactly one `RAISE EXCEPTION` count-assertion, `is_live = true` present twice (answers + context), zero `judicial-*` topic_key occurrences across all 7 files. WR-02 expected counts verified to exactly match 178-04-SUMMARY.md's claimed per-official counts (Anderson 4, Wolf 10 spot-checked directly against file content — both match). Wolf's school-vouchers stance was pruned before authoring for failing the evidence-only bar (inferred, not cited) — documented in 178-04-SUMMARY.md as an honest-blank correction, not a shortcut. `local-immigration` blank for all 7 — consistent with RESEARCH's stated expectation (no Tigard-specific sanctuary action). |
| 4 | Tigard appears with the purple hasContext chip in the Oregon coverage block (frontend code committed; live render pending deploy) | ✓ VERIFIED (code); pending live render (see Human Verification) | Read `src/lib/coverage.js` directly: `{ label: 'Tigard', browseGovernmentList: ['4173650'], browseStateAbbrev: 'OR', hasContext: true }` present, alphabetically between 'Portland' and 'Troutdale', matching column alignment. Read `src/lib/buildingImages.js` directly: `tigard:` key present in `CURATED_LOCAL` pointing at the `cities/tigard.jpg` CDN URL, with an attribution comment line above the object (`tigard - Downtown Tigard Oregon | M.O. Stevens (Aboutmovies) | Public Domain`). Both edits are committed in this repo at `424501f` (verified via `git show 424501f` — 2 files changed, 3 insertions, no unrelated changes, no raw backslash paths). The roadmap SC explicitly separates "frontend code committed" (satisfied) from "live render pending deploy" (expected outstanding, per task framing) — routed to Human Verification below, not treated as a gap. |

**Score:** 4/4 roadmap success criteria verified at the code/DB level; 2 explicitly-scoped items (live banner render, live purple-chip render) are deploy-gated and routed to human verification per design.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `C:/EV-Accounts/backend/migrations/1159_tigard_city_council.sql` | Structural seed: gov+chamber+2 districts+7 offices, WR-01 fix, ledger row | ✓ VERIFIED | 442 lines; contains "City of Tigard, Oregon, US"; pre-flight abort guard; WR-01 independent post-verify; ledger INSERT `VALUES ('1159')` present |
| `C:/EV-Accounts/backend/migrations/1160_tigard_headshots.sql` | Audit-only politician_images inserts | ✓ VERIFIED | 108 lines; 7 INSERTs, all guarded `WHERE NOT EXISTS`; no ledger row (audit-only, confirmed absent via grep) |
| `C:/EV-Accounts/backend/migrations/1161_hu_stances.sql` … `1167_wolf_stances.sql` | 7 evidence-only, audit-only stance files | ✓ VERIFIED | All 7 present; two-statement structure + WR-02 assertion in each; row counts match SUMMARY (7/4/7/6/6/8/10); 0 judicial-* topics; no ledger rows |
| `C:/EV-Accounts/backend/scripts/_tmp-tigard-headshots.py` | Download→crop→resize→upload pipeline | ✓ VERIFIED (gitignored helper, exists on disk) | Crop-before-resize order enforced; runtime UUID resolution; no hard `len==7` assert; TARGET_SIZE=(600,750), Lanczos, q90 all present |
| `C:/EV-Accounts/backend/scripts/_tmp-tigard-wave0-probe.sql` | Read-only Wave-0 probe (gitignored) | ✓ VERIFIED (exists on disk) | Present at 2114 bytes; consumed once per plan design |
| `src/lib/coverage.js` | Tigard purple hasContext chip entry | ✓ VERIFIED | Read directly; committed at 424501f |
| `src/lib/buildingImages.js` | `tigard` CURATED_LOCAL banner key | ✓ VERIFIED | Read directly; committed at 424501f |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| offices (mig 1159) | districts (geo_id 4173650) | `district_id` FK on LOCAL_EXEC/LOCAL rows | ✓ WIRED | 7 office INSERTs each `FROM essentials.districts d ... WHERE d.geo_id = '4173650'` |
| politicians.office_id | offices.id | back-fill UPDATE on external_id IN (...) | ✓ WIRED | Explicit 7-value IN list in the back-fill UPDATE; post-verify gate (e) asserts 0 NULLs |
| `1160` politician_images | politicians (by external_id) | subselect on external_id | ✓ WIRED | Each of the 7 INSERTs subselects `politicians WHERE external_id = -417365X` |
| each stance migration | inform.compass_topics (is_live=true) | JOIN on topic_key | ✓ WIRED | Confirmed present in 1161 (read directly) and via grep across 1162–1167 (`is_live = true` count=2 in each) |
| each stance migration | inform.politician_answers / politician_context | `ON CONFLICT (politician_id, topic_id) DO UPDATE` | ✓ WIRED | Confirmed in 1161 directly; pattern consistent across all 7 (two-statement structure grep count=2 in each) |
| coverage.js Oregon areas | browse route (browse_geo_id=4173650) | `browseGovernmentList` entry | ✓ WIRED | `browseGovernmentList: ['4173650']` present in the committed Tigard row |
| buildingImages.js CURATED_LOCAL 'tigard' | offices.representing_city='Tigard' | `getBuildingImages()` lowercased substring match | ✓ WIRED (per code review) | `representing_city='Tigard'` set inline in mig 1159 offices; `tigard:` key present in CURATED_LOCAL; code review's IN-06 notes the substring-match pattern is pre-existing/intentional |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| WASH-04 | 178-01, 178-02, 178-03, 178-04, 178-05 (declared in all 5 PLAN frontmatters) | City of Tigard deep-seeded — government + roster + headshots + evidence-only stances | ✓ SATISFIED (data/code); live-render sub-items pending deploy | Structural seed, headshots, and stances all verified directly in migration files; frontend surfacing committed. REQUIREMENTS.md traceability table still shows "Pending" for WASH-04 — this is the pre-verification state and is expected to flip to Complete as part of phase closure, not a gap in this phase's work. |

No orphaned requirements found — WASH-04 is the only requirement ID mapped to Phase 178 in REQUIREMENTS.md, and it is declared in every plan's frontmatter.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `1159_tigard_city_council.sql` | 138 | "placeholder appointment by design" (comment) | ℹ️ Info | Describes the real-world political situation (Anderson is an interim appointee who will not run in Nov 2026) — not a code stub or incomplete-work marker. No debt-marker gate triggered (no TBD/FIXME/XXX found in any of the 9 migration files scanned). |
| `_tmp-tigard-headshots.py` (via 178-REVIEW.md WR-04/WR-05) | 129, 160 | Dead/misleading fallback URL; hardcoded CDN_BASE vs env-derived upload endpoint | ⚠️ Warning (pre-existing, non-blocking) | Robustness gaps in a gitignored, single-use, already-executed helper script — do not affect the already-applied, already-verified production data (code review confirms cross-file UUID/URL consistency in the actual applied migrations). Flagged by 178-REVIEW.md as template-hardening items for the next city, not phase-178 gaps. |
| `1161`–`1167` stance migrations (via 178-REVIEW.md WR-01) | various | Hardcoded politician UUIDs with no in-file assertion tying UUID→external_id | ⚠️ Warning (pre-existing, non-blocking) | Code review confirms the UUID set is internally consistent with mig 1160's storage URLs and the 178-02-SUMMARY.md UUID table — production correctness corroborated. Recommended hardening for future city templates, not a defect in this phase's shipped data. |
| `1160_tigard_headshots.sql` (via 178-REVIEW.md WR-02) | 25-105 | No post-verification DO block (unlike 1159/stance files) | ⚠️ Warning (pre-existing, non-blocking) | 178-03-SUMMARY.md records an independent orchestrator-run count check (`SELECT COUNT(*) ... = 7`) outside the migration file, so the row count was verified at apply time even without an in-file gate. |

None of the review's 5 warnings or 6 info items were rated "critical" by the code reviewer, and none block goal achievement — they are latent hardening recommendations for future west-metro city migrations (179+), consistent with the code review's own "no blockers found" conclusion.

### Human Verification Required

### 1. Community banner live render

**Test:** Browse `https://essentials.empowered.vote/results?browse_geo_id=4173650&browse_mtfcc=G4110` after the next frontend deploy.
**Expected:** The Local section shows the Downtown Tigard Oregon community banner photo, not the tier-gradient fallback.
**Why human:** The banner CDN asset (`cities/tigard.jpg`) and the `buildingImages.js` wiring are both code/asset-verified (CDN returns 200; CURATED_LOCAL key committed), but the live render depends on the essentials frontend deploy, which is user-controlled and was 33 commits behind local `main` at verification time (same pattern as phase 177).

### 2. Purple hasContext chip live render

**Test:** View the Oregon block on the coverage/landing page after the next frontend deploy.
**Expected:** 'Tigard' shows the purple hasContext chip, matching Beaverton/Hillsboro/Portland.
**Why human:** `coverage.js` data row is confirmed committed with `hasContext: true`; only the live render is deploy-gated.

### Gaps Summary

No gaps found. All 4 roadmap success criteria are verified at the code/DB level by direct file reads (migrations 1159–1167, coverage.js, buildingImages.js) cross-referenced against the orchestrator-recorded live DB/Playwright evidence in the 5 SUMMARY.md files and independently corroborated by the existing 178-REVIEW.md code review (0 critical findings). The only outstanding items are the two explicitly deploy-gated live-render checks (community banner, purple chip) that this phase's own SUMMARY.md and task framing correctly identify as pending the next frontend deploy — not a defect in the phase's delivered work. Status is `human_needed` rather than `passed` per the verification decision tree, since these two items require a human/deploy step to close out.
