---
phase: 81-or-playbook-retrospective-v8-0-close
plan: 01
subsystem: documentation
tags: [playbook, oregon, gotcha, onboarding]
status: complete
completed: 2026-05-30

dependency_graph:
  requires: []
  provides: [LOCATION-ONBOARDING.md OR content]
  affects: [future OR city onboarding agents]

tech_stack:
  added: []
  patterns: [gotcha-blockquote, state-specific-annotation, quick-reference-block]

key_files:
  created: []
  modified:
    - LOCATION-ONBOARDING.md

decisions:
  - OR-8 placed as new GOTCHA in Step 3 (alongside OR-1) rather than annotation to Cities Onboarded section, for inline discoverability
  - Added optional OR-5 and OR-9 pitfall rows (6 total new rows, not minimum 4) — both reinforced by inline GOTCHAs
  - Oregon Quick Reference inserted between California Quick Reference and Step 1 (matching Phase 78 CA placement pattern)

metrics:
  duration: ~25 minutes
  completed_date: 2026-05-30
  tasks_completed: 3
  files_modified: 1
---

# Phase 81 Plan 01: OR Playbook Retrospective — LOCATION-ONBOARDING.md Update Summary

Updated LOCATION-ONBOARDING.md with 9 OR-specific GOTCHAs, Oregon Quick Reference block, 2 Cities Onboarded rows (Oregon state + Portland), and 6 new Step 7 pitfall rows — mirroring the Phase 78 CA playbook retrospective pattern exactly.

## Deliverable Details

### File Growth

- **Baseline (Phase 78):** 424 lines
- **After Task 1 (Cities Onboarded + Oregon Quick Reference):** 443 lines (+19)
- **After Task 2 (9 inline GOTCHAs):** 455 lines (+12)
- **After Task 3 (6 new pitfall rows):** 461 lines (+6)
- **Final line count:** 461 lines (delta: +37 from Phase 78 baseline)

### Cities Onboarded Table (2 new rows)

Both rows appended after the Berkeley CA row (the last existing row), before the `---` separator:

| Row | City | State | Onboarded | Notes |
|-----|------|-------|-----------|-------|
| 1 | Oregon (state) | OR | 2026-05-30 | All 5 constitutional officers voter-elected; cd119 TIGER key; sos.oregon.gov Blue Book headshots; 241 G4110 cities; oregonlegislature.gov MemberPhotos |
| 2 | Portland | OR | 2026-05-30 | 2024 charter reform; PortlandMaps ArcGIS MapServer Layer 17; portland.gov WAF; gov name disambiguates from Portland ME; staggered ballot |

### Oregon Quick Reference Block

Inserted as `## Oregon Quick Reference` H2 section immediately after the California Quick Reference's trailing `---` separator, before `## Step 1: Government Structure Research`. Contains intro sentence and 8-row trap table:

| Trap | See Step |
|------|----------|
| Portland council NOT in TIGER | Step 3 |
| Portland 2024 charter reform | Step 1, 2 |
| All OR constitutional officers voter-elected | Step 1, 5 |
| portland.gov WAF blocks headshots | Step 4, 7 |
| PowerShell Unicode mangling | Step 6 |
| Federal officials may pre-exist | Step 5 |
| Portland 2026 ballot: D3/D4/Auditor only | Step 2, 6 |
| G4110 count needs dry-run confirmation | Step 3 |

### OR GOTCHAs — Inline Placements (OR-1 through OR-9)

| GOTCHA | Step | Format | Key literals confirmed |
|--------|------|--------|------------------------|
| OR-1: Portland council not in TIGER | Step 3 (after SF consolidated city-county GOTCHA) | New `> [GOTCHA]` | portlandmaps.com/arcgis, portland-or-council-district-, ST_MakeValid, mtfcc=X0012 |
| OR-2: Portland 4-district RCV structure | Step 1 (after CA pre-existing seed GOTCHA) | New `> [GOTCHA]` | charter reform, portland.gov/auditor/elections/elected-city-officials, City of Portland, Oregon, US |
| OR-3: portland.gov WAF / 1_1_320w | Step 4 (after Sacramento AEM/CQ5 GOTCHA) | New `> [GOTCHA]` | 1_1_320w, itok, portland.gov WAF |
| OR-4: PowerShell Unicode [char]0xNNNN | Step 6 (annotation appended to PowerShell generator GOTCHA) | Annotation | [char]0x, Nguyễn, Thuy Tran, [char]0x1EBF |
| OR-5: OR constitutional officers voter-elected | Step 5 (annotation appended to Legislature-elected GOTCHA) | Annotation | Labor Commissioner, voter-elected, is_appointed_position=false |
| OR-6: Federal officials pre-flight | Step 5 (new GOTCHA after CA pre-existing seed, before CA external_id GOTCHA) | New `> [GOTCHA]` | Wyden, Merkley, pre-flight SELECT, UPDATE external_id |
| OR-7: G4110 dry-run required (count=241) | Step 3 (annotation appended to TIGER cd119 GOTCHA) | Annotation | MtfccAssertionError, dry-run, 241 |
| OR-8: Portland City Hall → D4 | Step 3 (new GOTCHA after OR-1, explicit smoke gate doc) | New `> [GOTCHA]` | portland-or-council-district-4, (-122.6794, 45.5231) |
| OR-9: Portland 2026 staggered ballot | Step 2 (after CA jungle primary GOTCHA) | New `> [GOTCHA]` | charter reform, staggered, D3/D4/Auditor, OFFSET 0/1/2 |

**OR-8 placement decision:** Chose new `> [GOTCHA]` in Step 3 immediately after OR-1 (not annotation to Cities Onboarded section) — inline placement provides better discoverability for agents working through the geofences step.

### Step 7 Pitfall Table (6 new rows)

Added after the last CA row (`| CA external_id range collision |`), before the `---` separator:

| New Pitfall Row | Type |
|-----------------|------|
| Portland council district boundaries not in TIGER | Required (OR-1) |
| Portland council structure seeded from pre-2025 charter | Required (OR-2) |
| portland.gov headshots not downloadable from /public/ direct paths | Required (OR-3) |
| PowerShell Unicode encoding: non-ASCII names mangled in PS 5.1 scripts | Required (OR-4) |
| OR constitutional officers modeled as appointed (Maine pattern) | Optional OR-5 — added |
| Portland 2026 races include all 12 council seats | Optional OR-9 — added |

Total pitfall rows: 14 original + 5 CA (Phase 78) + 6 OR (Phase 81) = 25 total

### Verification Results

All acceptance criteria passed:

- `STATE-SPECIFIC: OR` count: 9 (>=7 required)
- `STATE-SPECIFIC: CA` count: 12 (>=11 required; Phase 78 baseline preserved)
- `Oregon Quick Reference`: exactly 1 occurrence
- `California Quick Reference`: exactly 1 occurrence
- Both Cities Onboarded rows present (Oregon state + Portland OR)
- All 4 required OR pitfall rows present (plus 2 optional)
- All required literal strings present: portlandmaps.com/arcgis, ST_MakeValid, charter reform, portland.gov/auditor/elections/elected-city-officials, City of Portland Oregon US, 1_1_320w, itok, [char]0x, Thuy Tran (Vietnamese name reference), Labor Commissioner, Wyden, Merkley, MtfccAssertionError, dry-run, portland-or-council-district-4, staggered
- Cambridge content preserved (cd119 present, Cambridge present, Frey/Bellows present)
- CA Phase 78 baseline preserved (sos.ca.gov present, California Quick Reference intact)
- File grew from 424 to 461 lines (+37)

## Commits

| Task | Commit | Files |
|------|--------|-------|
| Task 1: Cities Onboarded + Oregon Quick Reference | e4decb8 | LOCATION-ONBOARDING.md (+19 lines) |
| Task 2: 9 inline OR GOTCHAs | f6c022e | LOCATION-ONBOARDING.md (+12 lines) |
| Task 3: 6 OR pitfall table rows | 765fa5c | LOCATION-ONBOARDING.md (+6 lines) |

## Deviations from Plan

None. All 9 GOTCHAs placed per the 81-RESEARCH.md placement map. OR-8 was the only choice left to executor — new GOTCHA selected over annotation (rationale: Step 3 inline placement maximizes discoverability for geofence-phase agents). Added 6 pitfall rows instead of the minimum 4 (included the recommended optional OR-5 and OR-9 rows).

## No Regressions

- Cambridge row (`| Cambridge | MA | 2026-05-17 |`): preserved
- Portland ME row (`| Portland | ME | 2026-05-19 | rcv |`): preserved (state column distinguishes from new OR Portland row)
- Maine state row (`| Maine (state) | ME | 2026-05-20 |`): preserved
- California state row (`| California (state) | CA | 2026-05-21 |`): preserved
- Berkeley row (`| Berkeley | CA | 2026-05-22 |`): preserved
- All 11 CA GOTCHAs from Phase 78: preserved (12 total `STATE-SPECIFIC: CA` markers)
- All 5 CA pitfall rows from Phase 78: preserved

## Known Stubs

None. This plan updates documentation only — no data sourcing or UI rendering involved.

## Threat Flags

None. Documentation-only changes; no new network endpoints, auth paths, or schema changes.

## Self-Check: PASSED

- LOCATION-ONBOARDING.md exists and has 461 lines: confirmed
- Commits e4decb8, f6c022e, 765fa5c all exist in git log: confirmed
- All holistic verification checks passed (ALL_PASS from verification script)
