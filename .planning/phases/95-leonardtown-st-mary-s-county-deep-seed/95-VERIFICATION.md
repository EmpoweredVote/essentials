---
phase: 95-leonardtown-st-mary-s-county-deep-seed
verified: 2026-06-06T00:00:00Z
status: human_needed
score: 4/4 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Open the Essentials app with a St. Mary's County address (e.g., 41770 Baldridge St, Leonardtown, MD 20650) and confirm the COUNTY section shows the Board of County Commissioners (President Guy + Commissioners D1-D4) and the LOCAL section shows the Leonardtown Town Council (Mayor Burris + 5 Council Members)"
    expected: "5 commissioners in COUNTY section with correct titles; 1 Mayor + 5 Council Members in LOCAL section; no empty-section overlays; 3+ profile pages render headshots without stretching artifacts; non-St-Mary's MD address does NOT return these officials"
    why_human: "Address routing verification, headshot rendering quality, and false-positive absence cannot be verified programmatically — require live UI with real address input"
---

# Phase 95: Leonardtown / St. Mary's County Deep Seed — Verification Report

**Phase Goal:** St. Mary's County and the Town of Leonardtown are fully seeded so a resident there gets a complete local officials list
**Verified:** 2026-06-06
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | St. Mary's County government row + Board of County Commissioners chamber exist with the county boundary linked | VERIFIED | Migration 276 file exists at C:/EV-Accounts/backend/migrations/276_stmarys_county_government.sql (325 lines); contains `'St. Mary''s County, Maryland, US'` × 20, `'Board of County Commissioners'` × 9, `geo_id='24037'` × 10, `district_type='COUNTY'` × 10, `state='md'` × 15. Post-verification gate `v_office_count <> 5` confirmed. Ledger entry `VALUES ('276')` present. SUMMARY confirms DO block emitted `Post-verification PASSED: gov_count=1, office_count=5, split_orphans=0`. Commits 1df92c7 and b8a66a4 in git log. |
| 2 | Active St. Mary's County Commissioners are seeded as politicians with offices; available headshots at 600x750 in Supabase Storage | VERIFIED | Migration 276 seeds all 5 external_ids (-24037001 through -24037005) with correct titles (President + Commissioner D1-D4); office_id back-fill UPDATE present. Script `scripts/md_local_headshots.py` exists, parses clean (PARSE OK), contains all 5 stmaryscountymd.gov source URLs, TARGET_W=600/TARGET_H=750, Image.LANCZOS, quality=90, NOT EXISTS idempotent guard. 5 UUIDs from SUMMARY all present in `scripts/tmp_md_local_headshots/` as `{uuid}-headshot.jpg`. Pillow-confirmed size (600, 750) on spot-checked file. SUMMARY reports processed=11 failed=0. |
| 3 | Town of Leonardtown government row + town officials seeded; available headshots uploaded | VERIFIED | Migration 277 file exists at C:/EV-Accounts/backend/migrations/277_leonardtown_government.sql (381 lines); contains `'Town of Leonardtown, Maryland, US'` × 12, `'Town Council'` × 9, `geo_id='2446475'` × 13, LOCAL_EXEC × 3, LOCAL × 8, `state='md'` × 19. Mayor block links to LOCAL_EXEC; 5 council blocks link to LOCAL. Pitfall 5 confirmed: `'Vice President'` absent. Pitfall 6 confirmed: `'Christy Hollander'` (not Sterling Hollander). All 6 UUIDs present in tmp dir. SUMMARY confirms DO block emitted `Post-verification PASSED: gov_count=1, office_count=6, split_orphans=0`. Commits verified in git. |
| 4 | A St. Mary's County address lookup returns the County Commissioners without empty-section errors | HUMAN NEEDED | SUMMARY reports human spot-check APPROVED for test address `41770 Baldridge St, Leonardtown MD 20650`; all 7 manual checks passed. This cannot be independently confirmed from the codebase; requires human re-verification of live app. |

**Score:** 4/4 truths — 3 VERIFIED by code evidence, 1 HUMAN NEEDED per design (checkpoint:human-verify gate)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `C:/EV-Accounts/backend/migrations/276_stmarys_county_government.sql` | St. Mary's County government + chamber + COUNTY district + 5 commissioners + offices | VERIFIED | File exists, 325 lines, all structural assertions pass. `slug` column appears only in SQL comments (3× in comment text, 0× in any INSERT column list). No debt markers. |
| `C:/EV-Accounts/backend/migrations/277_leonardtown_government.sql` | Leonardtown government + Town Council chamber + LOCAL_EXEC + LOCAL districts + 6 officials + offices | VERIFIED | File exists, 381 lines, all structural assertions pass including `'Vice President'` absent and `'Council Member'` × 5. No debt markers. |
| `scripts/md_local_headshots.py` | 2-source headshot pipeline for 11 MD local officials | VERIFIED | File exists, 426 lines, AST parses clean. All 14 required pattern checks pass (politician_photos, type='default', photo_license='public_domain', TARGET_W=600, TARGET_H=750, Image.LANCZOS, quality=90, Referer, Leonardtown hotlink URL, both external_id ranges, tmp_md_local_headshots, NOT EXISTS, x-upsert). |
| `scripts/tmp_md_local_headshots/` | 11 processed 600x750 JPEGs, one per politician_id | VERIFIED | Directory contains exactly 11 `*-headshot.jpg` files. UUID cross-check confirms all 11 expected UUIDs present (matching SUMMARY ID mapping table). Spot-check via Pillow confirms size (600, 750). Earhart re-crop fix committed as `1b14068`. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| Migration 276 | essentials.districts (geo_id='24037', COUNTY) | `geo_id = '24037' AND district_type = 'COUNTY' AND state = 'md'` | WIRED | Pattern found in migration at lines 73-78 (INSERT) and in every office block WHERE clause. |
| Migration 277 | essentials.districts (geo_id='2446475', LOCAL_EXEC + LOCAL) | Two district INSERTs with `geo_id = '2446475' AND state = 'md'` | WIRED | LOCAL_EXEC INSERT at lines 81-86; LOCAL INSERT at lines 92-97. Mayor office WHERE uses LOCAL_EXEC; council offices use LOCAL. |
| Post-verification DO block in 276 | essentials.offices joined to essentials.districts | `v_office_count <> 5` gate at line 294 | WIRED | Gate joins offices + districts on `geo_id='24037' AND district_type='COUNTY' AND state='md'`; raises EXCEPTION on failure. |
| Post-verification DO block in 277 | essentials.offices joined to essentials.districts | `v_office_count <> 6` gate at line 350 | WIRED | Gate joins offices + districts on `geo_id='2446475' AND state='md'` (no district_type filter — counts both LOCAL_EXEC + LOCAL). |
| `scripts/md_local_headshots.py` | essentials.politicians (both external_id ranges) | psycopg2 SELECT at lines 122-128 | WIRED | Query uses `BETWEEN -24037005 AND -24037001 OR BETWEEN -2446475006 AND -2446475001`; asserts `len(result) != EXPECTED_COUNT` exits sys.exit(1). |
| `scripts/md_local_headshots.py` | Supabase Storage politician_photos bucket | POST to `/storage/v1/object/politician_photos/{id}-headshot.jpg` with `x-upsert: true` | WIRED | upload_to_storage() at line 226; header present at line 234. BUCKET constant = 'politician_photos'. |
| `scripts/md_local_headshots.py` | essentials.politician_images | psycopg2 INSERT with `NOT EXISTS (... AND type = 'default')` | WIRED | insert_politician_image() at lines 291-312; WHERE NOT EXISTS guard at line 301 includes `AND type = 'default'`. |
| Leonardtown download branch | leonardtown.somd.com images | `Referer: https://leonardtown.somd.com/government/government-initial.htm` | WIRED | Conditional at lines 197-198: `if 'leonardtown.somd.com' in url: headers['Referer'] = ...`. SUMMARY confirms all 6 Leonardtown downloads succeeded. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|-------------------|--------|
| `scripts/md_local_headshots.py` | `uuid_map` (politician UUIDs) | psycopg2 SELECT on essentials.politicians WHERE external_id BETWEEN ranges | Yes — live DB query with sys.exit(1) guard if count != 11 | FLOWING |
| `scripts/md_local_headshots.py` | OFFICIALS list (11 tuples) | Built at runtime from uuid_map + URL_BY_EXT dict | Yes — real UUIDs from DB, verified source URLs | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Migration 276 file exists and is non-empty | PowerShell Test-Path + line count | EXISTS, 325 lines | PASS |
| Migration 277 file exists and is non-empty | PowerShell Test-Path + line count | EXISTS, 381 lines | PASS |
| Headshot script parses as valid Python 3 | `python -c "import ast; ast.parse(...)"` | PARSE OK | PASS |
| 11 JPEG files in tmp_md_local_headshots | PowerShell Get-ChildItem count | 11 | PASS |
| All 11 JPEG UUIDs match expected UUIDs from SUMMARY | UUID cross-check script | All 11 present, 0 missing, 0 extra | PASS |
| Sample JPEG dimensions | Pillow size check on 608317e3 (James R. Guy) | (600, 750) | PASS |
| Git commits 108f30e, 41cdf75, 1b14068 exist | `git log --oneline --no-walk` | All 3 found with correct messages | PASS |
| No TBD/FIXME/XXX debt markers in phase 95 files | Select-String on 3 files | CLEAN on all 3 | PASS |

### Probe Execution

No probe scripts declared for this phase. Phase is data-seed only (SQL migrations + Python script) — behavioral correctness verified via post-verification DO blocks in the migrations (self-contained transaction-level gates that roll back on failure).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| MD-DEEP-01 | 95-01-PLAN.md | St. Mary's County government + Board of County Commissioners chamber seeded; county boundary linked | SATISFIED | Migration 276 seeds government + chamber + COUNTY district linking geo_id='24037'. Post-verification DO block confirms gov_count=1, office_count=5, split_orphans=0. |
| MD-DEEP-02 | 95-01-PLAN.md, 95-02-PLAN.md | Active St. Mary's County Commissioners seeded with offices + available headshots | SATISFIED (implementation) — REQUIREMENTS.md NOT UPDATED | 5 commissioner politicians + offices seeded (276). 5 headshots at 600x750 uploaded via md_local_headshots.py. REQUIREMENTS.md still shows `[ ]` (Pending) — this is a documentation discrepancy; implementation is complete. |
| MD-DEEP-03 | 95-01-PLAN.md, 95-02-PLAN.md | Town of Leonardtown government + town officials seeded with available headshots | SATISFIED | Migration 277 seeds Leonardtown government + Town Council chamber + 6 officials. 6 headshots at 600x750 uploaded. REQUIREMENTS.md shows `[x]`. |

**REQUIREMENTS.md discrepancy:** `MD-DEEP-02` is marked `- [ ]` (Pending) and its traceability row shows "Pending" — but the implementation is complete. This is a documentation gap, not an implementation gap. The same REQUIREMENTS.md shows `MD-DEEP-01` and `MD-DEEP-03` as `[x]`, so the inconsistency is specific to MD-DEEP-02.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| 276_stmarys_county_government.sql | 5, 15, 50 | `slug` mentioned | INFO | All 3 occurrences are in SQL comments explicitly documenting the GENERATED ALWAYS constraint — not in any INSERT column list. Not a stub. |

No TBD/FIXME/XXX markers. No placeholder returns. No hardcoded empty state. No TODO/HACK patterns.

### Human Verification Required

**Status per design:** Plan 95-02 Task 3 was defined as `type="checkpoint:human-verify" gate="blocking"`. The SUMMARY documents approval. However, since the verifier cannot independently confirm live UI behavior, this item is carried forward as the standard human-verification check.

#### 1. Address Lookup and UI Rendering

**Test:** Open the Essentials app locally (`npm run dev`). Use address `41770 Baldridge St, Leonardtown, MD 20650`.

**Expected:**
- COUNTY section shows 'Board of County Commissioners' with 5 members: James R. Guy (President, Board of County Commissioners), Eric Colvin (Commissioner, District 1), Michael L. Hewitt (Commissioner, District 2), Mike Alderson, Jr. (Commissioner, District 3), Scott R. Ostrow (Commissioner, District 4).
- LOCAL section shows 'Town Council' with 6 members: Daniel W. Burris (Mayor) and 5 Council Members (Mattingly, Colvin, Earhart, Hollander, Slade).
- 3+ profile pages render headshots at correct 4:5 aspect ratio without stretching or browser artifacts (including Earhart whose re-crop was committed in `1b14068`).
- A non-St-Mary's MD address (e.g., a Baltimore City address) does NOT return St. Mary's commissioners or Leonardtown officials.
- Network tab shows politician_photos/{id}-headshot.jpg URLs returning HTTP 200 image/jpeg.

**Why human:** Address routing verification, headshot aspect-ratio correctness, and false-positive absence cannot be verified from the codebase. This was already approved once per SUMMARY — re-verification is lightweight.

### Gaps Summary

No blocking gaps found. All three ROADMAP success criteria are met by verifiable codebase evidence:

1. St. Mary's County government structure — migration 276 fully wired and applied (post-verification DO block PASSED per SUMMARY).
2. Commissioners with headshots — migration 276 + headshot script both substantive and wired; 5 JPEGs at 600x750 confirmed on disk.
3. Leonardtown government + headshots — migration 277 + headshot script; 6 JPEGs at 600x750 confirmed on disk.
4. Address lookup correctness — cannot verify without running the app; human approval required (per plan design, already obtained once per SUMMARY).

**Documentation gap (non-blocking):** `REQUIREMENTS.md` MD-DEEP-02 checkbox should be updated from `[ ]` to `[x]` and the traceability row changed from "Pending" to "Complete". This is cosmetic — no code change needed.

---

_Verified: 2026-06-06_
_Verifier: Claude (gsd-verifier)_
