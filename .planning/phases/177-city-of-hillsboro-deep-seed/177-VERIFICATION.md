---
phase: 177-city-of-hillsboro-deep-seed
verified: 2026-07-02T15:47:18Z
status: human_needed
score: 8/8 must-haves verified (code/DB level); 4 live-visual items require human confirmation
overrides_applied: 0
human_verification:
  - test: "Browse https://essentials.empowered.vote/results?browse_geo_id=4134100&browse_mtfcc=G4110 and confirm Mayor Beach Pace sorts first, all 6 councilors follow, no empty LOCAL section, no section-split"
    expected: "Mayor-first ordering with all 7 officials rendered under a single non-empty LOCAL/LOCAL_EXEC grouping"
    why_human: "Client-side render ordering (groupHierarchy.js sort behavior) cannot be confirmed via curl/grep against a deployed SPA; requires visual browser check post-deploy of commit 2619363"
  - test: "Confirm all 7 headshots render at 600x750 with no overlays, compass stances are visible on each profile, and no party label appears anywhere"
    expected: "Clean portraits, visible spoke/stance data, zero party affiliation text (antipartisan design)"
    why_human: "Rendering fidelity and absence of a UI-level party label are visual checks, not verifiable from migration SQL or asset HTTP status alone"
  - test: "Confirm the Local section shows the Hillsboro community banner (Orenco Station Plaza photo) instead of the generic tier-gradient fallback"
    expected: "Real banner image renders, confirming offices.representing_city='Hillsboro' + buildingImages.js lowercase 'hillsboro' key resolve correctly at runtime"
    why_human: "This is a runtime resolution path (getBuildingImages() substring match against live office data) that only proves correct in a live-rendered browser session, not from static file inspection"
  - test: "Confirm the purple hasContext chip appears for the Hillsboro entry in the coverage/landing list"
    expected: "Hillsboro shows the purple chip alongside its label in the Oregon coverage block"
    why_human: "Chip rendering is a CSS/component-level visual confirmation tied to the hasContext:true flag; static code inspection confirms the flag is set but not that the chip actually paints correctly in the deployed UI"
---

# Phase 177: City of Hillsboro Deep-Seed Verification Report

**Phase Goal:** A Hillsboro resident (Washington County seat / largest WashCo city) looks up who represents them and gets the correct Mayor + council member, with evidence-only stances on their profiles.
**Verified:** 2026-07-02T15:47:18Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Correct geo_id (4134100, not 4133850) used throughout; at-large form of government correctly modeled (no ward geofences) | VERIFIED | `grep -c 4133850` across all 9 migration files = 0 matches; migration 1150 creates exactly 2 districts (LOCAL_EXEC + LOCAL), both `state='or'` lowercase, `geo_id='4134100'`; SUMMARY-recorded DB audit confirms 2 districts, 0 ward/X00xx rows |
| 2 | One "City of Hillsboro, Oregon, US" government + one City Council chamber (official_count=7) exist | VERIFIED | Migration 1150 lines 40-54 (government + chamber INSERT); SUMMARY-recorded live psql audit: gov=1, chamber official_count=7 |
| 3 | 7 offices exist (Mayor + 6 councilors), each with representing_city='Hillsboro' set inline; all office_id back-filled | VERIFIED | `grep -c representing_city` in migration 1150 = 13 occurrences (7 office INSERT column lists + 6 more references incl. post-verify gate); SUMMARY-recorded audit: offices=7, representing_city count=7, office_id NULLs=0 |
| 4 | Section-split scan returns 0 rows for geo_id 4134100 | VERIFIED (with template caveat) | SUMMARY-recorded independent E2E gate = 0; REVIEW.md WR-01 flags the in-migration DO-block gate (c) as a dead assertion that can never fail by construction — but the *independent* post-apply E2E scan (run outside the migration, per plan Task 2 step 2e) is the real check and passed. Not a phase-blocking defect; flagged as a template fix for Phase 178+. |
| 5 | All 7 officials have a 600×750 headshot uploaded to Supabase Storage, no overlays, correct person, valid JPEG | VERIFIED | Live HTTP check: all 7 `{uuid}-headshot.jpg` URLs return 200; downloaded sample (Pace) confirms exact 600×750 RGB JPEG; migration 1151 has 7 politician_images INSERTs with correct columns (no photo_origin_url) |
| 6 | Each of the 7 officials has evidence-only compass stances (100% cited, no defaults, no judicial-* topics) where a record exists | VERIFIED | Migrations 1152-1158 use topic_key JOIN on `compass_topics.is_live=true`; `grep "'judicial"` across all 7 files = 0 matches; REVIEW.md independently confirmed 60/60 rows cited, 0 uncited, values within 1-5, honest blanks preserved (Sinclair climate-change omitted) |
| 7 | Hillsboro surfaces with the purple hasContext chip in coverage.js | VERIFIED (code-level) | `coverage.js:101` — `{ label: 'Hillsboro', browseGovernmentList: ['4134100'], browseStateAbbrev: 'OR', hasContext: true }`, correctly placed alphabetically between Gresham (line 100) and Maywood Park (line 102) |
| 8 | Community banner (1700×540) uploaded and wired via buildingImages.js CURATED_LOCAL lowercase key | VERIFIED | Live HTTP check: `cities/hillsboro.jpg` returns 200; downloaded and confirmed exactly 1700×540 RGB; `buildingImages.js:112` has `hillsboro:` key pointing at the correct CDN URL with attribution comment at line 108 |
| 9 | npm run build passes with both essentials-repo edits | VERIFIED | `npm run build` run directly by this verifier: exits 0, produces dist/ assets (chunk-size warning only, not an error) |
| 10 | The live browse link surfaces Mayor Pace first + all 6 councilors with headshots + stances, banner renders (not gradient), purple chip appears, no party label | UNCERTAIN (human required) | SUMMARY explicitly documents this as DEFERRED pending frontend deploy of commit 2619363; the checkpoint:human-verify task was auto-approved on code-level evidence, not a live visual check. This is an honest, documented gap — not a fabricated claim. |

**Score:** 9/10 truths VERIFIED at code/DB level; 1 truth (live visual end-to-end) is honestly flagged UNCERTAIN by the phase's own SUMMARY and requires human confirmation.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `C:/EV-Accounts/backend/migrations/1150_hillsboro_city_council.sql` | Structural seed: gov+chamber+2 districts+7 offices, ≥250 lines | VERIFIED | Exists, 401 lines per SUMMARY; contains "City of Hillsboro, Oregon, US"; no `slug` in comments; party=NULL on all 7 politicians |
| `C:/EV-Accounts/backend/migrations/1151_hillsboro_headshots.sql` | 7 politician_images INSERTs, audit-only | VERIFIED | Exists; columns exactly (id, politician_id, url, type, photo_license); no photo_origin_url; no ledger INSERT |
| `C:/EV-Accounts/backend/migrations/1152-1158_*_stances.sql` (7 files) | Per-official evidence-only stance migrations | VERIFIED | All 7 files exist on disk; two-statement politician_answers/politician_context structure confirmed in 1152; ON CONFLICT clauses present |
| `src/lib/coverage.js` | Hillsboro entry with hasContext:true | VERIFIED | Line 101, correctly placed, geo_id 4134100 |
| `src/lib/buildingImages.js` | hillsboro CURATED_LOCAL key + attribution | VERIFIED | Line 108 (attribution) + line 112 (key) |
| `C:/EV-Accounts/backend/scripts/_tmp-hillsboro-wave0-probe.sql` | Wave-0 gitignored probe helper | NOT CHECKED (by design) | Gitignored `_tmp-*` helper, intentionally not committed/persisted; SUMMARY documents its one-time use and results |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| offices (mig 1150) | districts (geo_id 4134100) | district_id FK on LOCAL_EXEC/LOCAL rows | VERIFIED | Office INSERT SELECTs join on `d.geo_id = '4134100' AND d.district_type = ...` (confirmed in read migration excerpt, lines 97-113) |
| politicians.office_id | offices.id | back-fill UPDATE on external_id range | VERIFIED (via SUMMARY DB audit) | SUMMARY-recorded gate f: all 7 politicians have non-NULL office_id |
| stance migrations | inform.compass_topics | JOIN on topic_key AND is_live=true | VERIFIED | Confirmed directly in 1152 (line 21: `ON CONFLICT (politician_id, topic_id)`; JOIN pattern present per REVIEW.md text and file structure) |
| buildingImages.js 'hillsboro' | offices.representing_city='Hillsboro' | getBuildingImages() lowercase substring match | VERIFIED (code-level); UNCERTAIN (runtime) | Code-level wiring confirmed (lowercase key present, representing_city set inline in mig 1150); actual runtime resolution in the deployed app is part of the deferred human-verify item |
| coverage.js Oregon entry | browse route (browse_geo_id=4134100) | browseGovernmentList entry | VERIFIED (code-level); UNCERTAIN (runtime) | Entry present with correct geo_id; live route returns HTTP 200 (SPA shell) but actual client-rendered roster/chip requires human browser check |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| coverage.js Hillsboro entry | `browseGovernmentList` | Hardcoded geo_id array `['4134100']` | Yes — matches DB-confirmed geo_id, not a stub value | FLOWING |
| buildingImages.js hillsboro key | banner CDN URL | Static string pointing to a live Supabase Storage object | Yes — HTTP 200 confirmed, correct 1700×540 dimensions on download | FLOWING |
| offices (mig 1150) | representing_city | Inline literal 'Hillsboro' on INSERT | Yes — set directly in the INSERT statement (not defaulted/backfilled empty) | FLOWING |
| stance migrations | politician_answers.value | Research-derived integer 1-5, joined live to compass_topics | Yes — REVIEW.md independently confirmed 60 real cited rows, values 1-4 used, no defaults | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Banner asset is a real, correctly-sized JPEG | `curl` download + PIL `Image.open().size` | (1700, 540) RGB | PASS |
| Mayor Pace headshot is a real, correctly-sized JPEG | `curl` download + PIL `Image.open().size` | (600, 750) RGB | PASS |
| All 8 Storage objects (banner + 7 headshots) resolve | `curl -o /dev/null -w "%{http_code}"` x8 | All 200 | PASS |
| No wrong geo_id (4133850) leaked into any migration | `grep -c 4133850` across 9 files | 0 matches in every file | PASS |
| No debt markers (TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER) in changed files | `grep -E` across all 9 migrations + 2 JS files | 0 matches | PASS |
| No judicial-* topic keys in any stance migration | `grep "'judicial"` across 7 stance files | 0 matches (REVIEW.md confirms 2 prose hits for "judicial warrant" are reasoning text, not topic_key) | PASS |
| party column is NULL on all inserted politicians (antipartisan) | Read migration 1150 politician INSERT VALUES | All 7 rows show literal `NULL` in the party position | PASS |
| `npm run build` passes | `cd essentials && npm run build` | Exit 0, dist/ produced, only a chunk-size advisory (non-blocking) | PASS |

### Probe Execution

N/A — this phase's "probes" (Wave-0 `_tmp-hillsboro-wave0-probe.sql`) are gitignored, one-time, orchestrator-run DB gate checks, not a `scripts/*/tests/probe-*.sh` convention. No conventional probe scripts found under `scripts/*/tests/probe-*.sh` for this phase. Skipped per Step 7c discovery (no matching probes declared or found).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| WASH-03 | 177-01 through 177-05 (all 5 plans declare it) | City of Hillsboro deep-seeded — government + roster + headshots + evidence-only stances | SATISFIED | Government/chamber/districts/offices confirmed (migration 1150 + SUMMARY DB audits); 7/7 headshots live and correctly sized; 60 evidence-only cited stances confirmed by independent code review; coverage.js chip + banner wired and verified on disk. REQUIREMENTS.md traceability table (line 114) already marks WASH-03 "Complete" against Phase 177 — consistent with evidence found. Note: the requirement's own checkbox list item (line 56) is still an unchecked `[ ]` — cosmetic inconsistency, not a scope gap, since the traceability table is the authoritative per-requirement status marker in this project's REQUIREMENTS.md convention. |

No orphaned requirements found — REQUIREMENTS.md maps only WASH-03 to Phase 177, and all 5 plans declare exactly `requirements: [WASH-03]`.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `C:/EV-Accounts/backend/migrations/1150_hillsboro_city_council.sql` | 354-367 | Post-verify Gate (c) (section-split check) is a dead assertion — cannot fail by construction, since Steps 3-4 in the same transaction guarantee both districts exist before the gate runs (REVIEW.md WR-01) | WARNING | Does not affect this phase's actual correctness (an independent, real E2E section-split scan was run separately and passed per SUMMARY), but the in-migration NOTICE overstates what was checked. Template hazard for Phase 178+ reuse, not a Phase 177 blocker. |
| `C:/EV-Accounts/backend/migrations/1152-1158_*_stances.sql` | e.g. 1152:21,38 | Inner JOIN on `compass_topics.topic_key` silently drops any row with a misspelled/retired topic_key with no in-migration count assertion (REVIEW.md WR-02) | WARNING | Not manifested in this run — REVIEW.md independently confirmed all 60 authored rows landed (0 silently dropped). Template hazard for future stance migrations, not a Phase 177 defect. |
| `C:/EV-Accounts/backend/migrations/1151_hillsboro_headshots.sql` | 24-27 | NOT EXISTS guard degrades unsafely on NULL politician_id lookup (REVIEW.md IN-01) | INFO | Harmless here (all 7 politicians existed); latent template hazard only. |
| `C:/EV-Accounts/backend/migrations/1150_hillsboro_city_council.sql` | 313-320 | office_id back-fill has no chamber/district filter — could nondeterministically pick an office in a reconcile-style reuse (REVIEW.md IN-02) | INFO | Not applicable to this greenfield city (each politician has exactly one office); latent template hazard only. |

No BLOCKER-level anti-patterns found. Both WARNING items are pre-existing template patterns inherited from the Beaverton migration 1131 template, already independently verified as producing correct results in this specific application via separate E2E gates, and explicitly documented in 177-REVIEW.md as "fix the template, not an emergency" — consistent with a non-blocking classification for this phase.

### Human Verification Required

### 1. Live browse roster ordering

**Test:** Visit `https://essentials.empowered.vote/results?browse_geo_id=4134100&browse_mtfcc=G4110` and observe the rendered roster order.
**Expected:** Mayor Beach Pace appears first, followed by all 6 councilors; no empty LOCAL section; no visible section-split (officials scattered across multiple groups).
**Why human:** This depends on client-side sort/group logic (`groupHierarchy.js`) rendering against live data after the frontend deploy of commit `2619363` — not verifiable via static grep or curl against an SPA shell.

### 2. Headshot rendering + stance visibility + no party label

**Test:** On the same browse page, open each of the 7 official profiles.
**Expected:** Each headshot renders cleanly at 600×750 with no overlays; compass stance spokes are visible; no party affiliation text appears anywhere (antipartisan design).
**Why human:** Visual/UI rendering fidelity check; DB-level data (confirmed present, 60 stance rows, party=NULL) does not guarantee correct client rendering.

### 3. Community banner renders (not gradient fallback)

**Test:** On the browse page's Local section, confirm the Hillsboro banner photo (Orenco Station Plaza / MAX train) displays instead of the generic tier-gradient placeholder.
**Expected:** Real photo banner renders.
**Why human:** This is the specific runtime proof that `offices.representing_city='Hillsboro'` + the lowercase `buildingImages.js` key resolve together correctly in the deployed app — a code-level match was confirmed, but end-to-end resolution in a live session was not.

### 4. Purple hasContext chip on the coverage/landing list

**Test:** View the Oregon coverage list (landing/coverage UI) and locate the Hillsboro entry.
**Expected:** Hillsboro shows the purple chip indicating stance-context availability.
**Why human:** Chip rendering is a component/CSS-level visual confirmation; `hasContext: true` is confirmed in source but the actual UI paint was not observed by this verifier.

### Gaps Summary

No BLOCKER gaps found. All database-level and code-level must-haves for WASH-03 are verified either directly (file inspection, live HTTP checks, image dimension checks, git commit history, npm build) or via SUMMARY-recorded live DB audits that this verifier had no independent DB access to re-run but which are corroborated by the independent 177-REVIEW.md code review (which re-derived the same row counts, UUIDs, and topic-key set directly from the committed SQL files rather than trusting the SUMMARY narrative).

The single open item is the phase's own honestly-documented deferral: four live-visual UI checks (roster ordering, headshot/stance rendering, banner rendering, purple chip) were not confirmed against the deployed app because the `checkpoint:human-verify` in Plan 05 Task 3 was auto-approved on code-level evidence rather than an actual browser session, pending a frontend deploy of commit `2619363`. This is not a fabricated PASS — the 177-05-SUMMARY.md explicitly flags this as "DEFERRED" and "not yet independently confirmed," which is exactly the kind of honest gap-reporting this verification process expects. Per the decision tree, any non-empty human-verification list forces `status: human_needed` regardless of how strong the DB/code evidence is.

**Recommendation:** Treat this as a pass at the code/DB level with a mandatory follow-up UAT pass (either immediately after the next frontend deploy, or folded into the Phase 186 West-Metro Playbook Retrospective as the SUMMARY itself suggests). No plan-gap or replan is needed — this is a deploy-timing artifact, not an implementation defect.

---

_Verified: 2026-07-02T15:47:18Z_
_Verifier: Claude (gsd-verifier)_
