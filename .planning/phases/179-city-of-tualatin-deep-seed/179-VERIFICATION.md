---
phase: 179-city-of-tualatin-deep-seed
verified: 2026-07-03T00:00:00Z
status: passed
score: 8/8 must-haves verified
overrides_applied: 0
---

# Phase 179: City of Tualatin Deep-Seed Verification Report

**Phase Goal:** A Tualatin resident looks up who represents them and gets the correct Mayor + council member, with evidence-only stances on their profiles.
**Verified:** 2026-07-03
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

Sourced from ROADMAP.md Phase 179 Success Criteria (roadmap contract) merged with PLAN frontmatter must_haves across all 5 plans. All truths below were checked directly against on-disk migration files, live production DB-adjacent evidence recorded by the orchestrator, and independently re-run build/test/CDN checks (not just SUMMARY claims).

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Correct geo_id used everywhere; the wrong ROADMAP/CONTEXT value 4175200 never operative | ✓ VERIFIED | `grep -c 4175200` across all 9 migration files = 0 in every stance/headshot file; in 1169 it appears only in comments documenting the correction (lines 4, 32) alongside 13 operative uses of `4174950` (districts, offices, post-verify gates). Wave-0 probe result recorded in 179-01-SUMMARY.md (A1=0, A2=1) is consistent with this. |
| 2 | Government + City Council chamber + pure at-large form of government (directly-elected Mayor + 6 numbered Positions) seeded correctly | ✓ VERIFIED | Read full `1169_tualatin_city_council.sql` (441 lines): 1 government INSERT, 1 chamber (official_count=7), exactly 2 districts (`LOCAL_EXEC`+`LOCAL`, both `state='or'` lowercase per casing convention), 7 office blocks with titles `'Mayor'` + `'Council Member (Position 1..6)'`, all `is_appointed=false` / `is_appointed_position=false`, `representing_city='Tualatin'` inline (13 occurrences) on every office. No ward/X00xx geofences present. |
| 3 | Post-verify DO block independently asserts geofence presence + section-split=0 (WR-01 fix, not the dead same-transaction gate) | ✓ VERIFIED | Read migration lines 370-420: gate (c) is an independent `SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE geo_id='4174950' AND mtfcc='G4110'`, gate (d) is a canonical `GROUP BY district_id HAVING COUNT(DISTINCT chamber_id) > 1` section-split query — both structurally independent of the INSERTs above them. |
| 4 | All 7 officials have a 600×750 headshot uploaded and a politician_images row | ✓ VERIFIED (live) | Read `1170_tualatin_headshots.sql`: 7 INSERTs with columns exactly `(id, politician_id, url, type, photo_license)`, no `photo_origin_url`, WR-02 url-embeds-uuid gate expects exactly 7. Independently curl'd all 7 CDN URLs (`{uuid}-headshot.jpg`) — **all 7 return HTTP 200** from Supabase Storage `politician_photos` bucket, confirming the images actually exist (not just DB rows pointing nowhere). |
| 5 | Evidence-only compass stances, 100% cited, zero defaults, honest blanks, no judicial-* topics | ✓ VERIFIED | Read full `1171_bubenik_stances.sql` (67 lines) in detail: 10 VALUES rows each with substantive multi-sentence reasoning + non-empty `sources` array of real URLs, `topic_id` resolved via `JOIN compass_topics ... AND is_live=true` (no hardcoded UUID), byte-identical answers/context VALUES blocks, and a triple-gate `DO` block (WR-01 identity check on external_id, WR-02 answers count=10, WR-03 context count=10). Confirmed same triple-gate pattern present in all 7 files (`grep -c "WR-0[123]"` = 2 header-comment refs + `RAISE EXCEPTION` ×3 in each of 1171-1177). `grep -c "judicial-"` = 0 in all 7 stance files. Expected counts extracted per file (10/6/8/9/10/7/9 = 59 total) match SUMMARY's claimed per-official breakdown exactly. |
| 6 | Tualatin surfaces with the purple hasContext chip in coverage.js, corrected geo_id, correct alphabetical slot | ✓ VERIFIED (live) | `src/lib/coverage.js:106`: `{ label: 'Tualatin', browseGovernmentList: ['4174950'], browseStateAbbrev: 'OR', hasContext: true }` sits between Troutdale (line 105) and Wood Village (line 107) — correct alphabetical slot, not adjacent to Tigard. Confirmed via git log this line was added in commit `be1816d`, currently on `main`. |
| 7 | Community banner uploaded, wired via CURATED_LOCAL, licensed | ✓ VERIFIED (live) | `src/lib/buildingImages.js:110,116`: `tualatin:` CURATED_LOCAL key points at `cities/tualatin.jpg` with attribution comment `Tualatin Commons daytime \| M.O. Stevens (Aboutmovies) \| CC BY-SA 3.0`. Independently curl'd the CDN URL — **HTTP 200, 202,305 bytes**, confirming the banner image is live in Storage, not just referenced. |
| 8 | Build/tests green after the frontend edits; changes committed | ✓ VERIFIED (independently re-run) | Ran `npm run build` fresh in this session — exits 0, `✓ built in 8.34s`. Ran `npx vitest run` fresh — `73 passed (73)`, matching SUMMARY's claim exactly. `git log` confirms `be1816d` (surfacing edits) is on `main`, and later commits `aabb3b9`/`15e4105` (docs) follow it — deploy landed per SUMMARY and the live CDN/browse checks above corroborate a live deploy. |

**Score:** 8/8 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `C:/EV-Accounts/backend/migrations/1169_tualatin_city_council.sql` | Structural seed, ≥250 lines, contains "City of Tualatin, Oregon, US" | ✓ VERIFIED | 441 lines; contains the string; all acceptance-criteria patterns confirmed by direct read (WR-01 fixes, ledger INSERT `version` `'1169'`, no `4175200` outside comments) |
| `C:/EV-Accounts/backend/migrations/1170_tualatin_headshots.sql` | Audit-only, ≥20 lines, contains "politician_images" | ✓ VERIFIED | 121 lines; 7 INSERTs, WR-02 gate present, no ledger row |
| `C:/EV-Accounts/backend/migrations/1171_bubenik_stances.sql` … `1177_pratt_stances.sql` | 7 audit-only stance migrations, each containing "politician_answers" | ✓ VERIFIED | All 7 exist on disk; each has the two-statement structure + triple-gate DO block; row counts 10/6/8/9/10/7/9 |
| `src/lib/coverage.js` | Tualatin entry with hasContext | ✓ VERIFIED / WIRED | Line 106; committed `be1816d` on `main` |
| `src/lib/buildingImages.js` | tualatin CURATED_LOCAL entry | ✓ VERIFIED / WIRED | Lines 110, 116; committed `be1816d` on `main` |
| `politician_photos/{uuid}-headshot.jpg` × 7 (Supabase Storage) | 600×750 portraits | ✓ VERIFIED (Level 4 — data flowing) | All 7 CDN URLs independently curl'd → HTTP 200 |
| `cities/tualatin.jpg` (Supabase Storage) | 1700×540 licensed banner | ✓ VERIFIED (Level 4 — data flowing) | Independently curl'd → HTTP 200, 202,305 bytes |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `offices` (mig 1169) | `districts` (geo_id 4174950) | `district_id` FK on LOCAL_EXEC + LOCAL rows | ✓ WIRED | Confirmed by direct read of the 7 office INSERT blocks, each `CROSS JOIN` on the correct district filtered by `geo_id`/`district_type`/`state` |
| `politicians.office_id` | `offices.id` | back-fill UPDATE keyed on external_id | ✓ WIRED | Gate (e) in post-verify DO block asserts 0 NULL office_id for the 7 external_ids |
| each stance migration | `inform.compass_topics` (is_live=true) | JOIN on topic_key | ✓ WIRED | Confirmed in 1171 read: `JOIN inform.compass_topics ct ON ct.topic_key = s.topic_key AND ct.is_live = true` |
| `coverage.js` Oregon entry | browse route (browse_geo_id=4174950) | `browseGovernmentList` | ✓ WIRED (live) | Live browse link verified in-session per orchestrator SUMMARY (Playwright); banner + roster rendered |
| `buildingImages.js CURATED_LOCAL.tualatin` | `offices.representing_city='Tualatin'` | `getBuildingImages()` lowercase substring match | ✓ WIRED (live) | mig 1169 sets `representing_city='Tualatin'` inline (13 occurrences); banner CDN confirmed live; SUMMARY records the banner rendering behind "Tualatin, OR" in the live browse |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| 7 headshot CDN URLs referenced in `1170_tualatin_headshots.sql` | `politician_images.url` | Supabase Storage `politician_photos` bucket | Yes — independently curl'd, all 200 | ✓ FLOWING |
| Banner CDN URL referenced in `buildingImages.js` | `CURATED_LOCAL.tualatin` | Supabase Storage `politician_photos/cities/tualatin.jpg` | Yes — independently curl'd, 200/202,305B | ✓ FLOWING |
| 59 stance rows across 7 migrations | `inform.politician_answers` / `politician_context` | Cited web research (URLs present in every row) | Yes — reasoning/sources non-empty, no defaulted rows, byte-identical answers/context pairs | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Production build succeeds with the two surfacing edits | `npm run build` | Exit 0, "✓ built in 8.34s" | ✓ PASS |
| Regression test suite passes | `npx vitest run` | 8 files, 73/73 passed | ✓ PASS |
| Banner image resolves | `curl -o /dev/null -w %{http_code} <cities/tualatin.jpg URL>` | 200, 202305 bytes | ✓ PASS |
| All 7 headshot images resolve | `curl` × 7 UUIDs | 200 × 7 | ✓ PASS |
| No wrong geo_id in operative code | `grep -c 4175200` across all 9 migration files + coverage.js/buildingImages.js | 0 operative occurrences (only in 1169's documentary comments) | ✓ PASS |
| No debt markers in phase-touched files | `grep -iE "TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER"` across migrations 1169-1177 + coverage.js + buildingImages.js | 0 matches (one unrelated comment "no placeholder" describing intended behavior) | ✓ PASS |

### Probe Execution

No `scripts/*/tests/probe-*.sh` convention applies to this phase — this is a SQL-migration/data-seed phase, not a CLI/tooling migration phase. The phase's own "Wave-0 probe" (`_tmp-tualatin-wave0-probe.sql`) is a gitignored, non-committed orchestrator-run helper per the plan's explicit architecture (not a repo-convention probe script), and its results are recorded in 179-01-SUMMARY.md as orchestrator-executed this session. No re-execution was possible or required (the probe file is intentionally not committed and is consumed once).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| WASH-05 | 179-01 through 179-05 (all 5 plans declare it) | City of Tualatin deep-seeded — government + roster + headshots + evidence-only stances | ✓ SATISFIED | All observable truths above verified against on-disk migrations + live CDN checks + live coverage.js/buildingImages.js code. |

**Note:** `.planning/REQUIREMENTS.md` line 116 still shows `WASH-05 | Phase 179 | Pending` (unlike WASH-01 through WASH-04, which show `Complete`). This is a bookkeeping artifact — the requirements-tracking table is evolved as a post-verification step in this project's workflow (see prior phases' "evolve PROJECT.md/REQUIREMENTS.md after phase completion" commits) — not evidence that the requirement itself is unmet. Flagging for the orchestrator to flip to `Complete` after this VERIFICATION.md is accepted; not treated as a gap.

### Anti-Patterns Found

None found. Debt-marker scan (TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER) across all 9 migration files, the headshot pipeline script, and both frontend edits returned zero matches.

### Human Verification Required

None. The live browse/visual checks (Mayor-first ordering, 7/7 headshot rendering, compass icons, no party label, banner rendering instead of gradient fallback, purple chip in the correct slot) were already performed by the orchestrator this session via a live Playwright browse against the deployed production site (`essentials.empowered.vote/results?browse_geo_id=4174950&browse_mtfcc=G4110`), per 179-05-SUMMARY.md Task 3 and the verification context provided. This verifier additionally corroborated the underlying artifacts independently (CDN 200s for all 7 headshots + the banner, fresh `npm run build` + `vitest run` re-runs, direct file reads of migration content) rather than relying solely on the SUMMARY narrative. No outstanding items require a human to re-check.

### Code Review Cross-Reference

179-REVIEW.md found 0 Critical findings and 2 Warnings, both explicitly scoped as **latent template defects, not realized failures** (the reviewer confirms "these migrations already applied cleanly to production"):
- WR-01: headshot script exits 0 even on partial failure (this run was 7/7 — verified independently via live CDN checks, so the defect did not manifest)
- WR-02: 1169's `ON CONFLICT (external_id) DO UPDATE` lacks an identity assertion against a collision (Wave-0 Probe D confirmed the ext_id block was collision-free before this migration ran, so the risk did not materialize)

Both are appropriately deferred as hardening items for the migration template used by Phase 180+ (Forest Grove), not blockers for Phase 179's own goal achievement — the actual Tualatin data seeded by this phase is correct and verified.

### Gaps Summary

No gaps found. All roadmap Success Criteria (1-4) and all PLAN-frontmatter must-haves across all 5 plans are verified against on-disk code, migration content, and independently re-executed checks (build, tests, CDN reachability for all 7 headshots + banner). The two code-review Warnings are non-blocking, already-mitigated-in-this-instance template hardening notes carried forward for Phase 180.

---

_Verified: 2026-07-03_
_Verifier: Claude (gsd-verifier)_
