---
phase: 125-ma-tier-3-playbook-retrospective
plan: "01"
subsystem: documentation
tags: [playbook, retrospective, ma-tier-3, gotcha, cities-onboarded]
dependency_graph:
  requires: [124-05-SUMMARY]
  provides: [LOCATION-ONBOARDING.md MA Tier 3 content]
  affects: [LOCATION-ONBOARDING.md]
tech_stack:
  added: []
  patterns: [grep verification gates, DB verification before documentation write]
key_files:
  created: []
  modified:
    - LOCATION-ONBOARDING.md
decisions:
  - "Medford geo_id from DB is 2539835 (RESEARCH.md had 2540115 as estimate); external_id prefix -2540115xxx was already seeded from the wrong estimate and cannot be changed without migrating 8 politicians — documented as perpetual discrepancy"
  - "Added 6 new STATE-SPECIFIC: MA GOTCHAs (plan required minimum 5) — added Somerville TWO ex-officio GOTCHA as additional coverage"
  - "Added 2 broadly-applicable pitfall rows in Step 7 (MA geo_id estimate wrong; HTTP 200 != accessible with Cloudflare)"
metrics:
  duration: "~9 minutes"
  completed: "2026-06-16"
  tasks_completed: 3
  files_modified: 1
---

# Phase 125 Plan 01: MA Tier 3 Playbook Retrospective — LOCATION-ONBOARDING.md Summary

LOCATION-ONBOARDING.md updated with 7 MA Tier 3 Cities Onboarded rows (DB-verified geo_ids), 4 new MA Quick Reference trap rows + 7 Key Facts bullets, and 6 new STATE-SPECIFIC: MA GOTCHA callouts across Steps 1/4/5 — total MA GOTCHAs now 11 (was 5 at Phase 116 baseline).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Verify 7 Tier 3 geo_ids from DB | (no files) | Read-only DB verification |
| 2 | Add 7 Cities Onboarded rows + extend MA Quick Reference | a98c990 | LOCATION-ONBOARDING.md |
| 3 | Embed 6 new MA GOTCHA callouts + Step 7 pitfall rows | 34402cd | LOCATION-ONBOARDING.md |

## Verification Gates Passed

| Gate | Result |
|------|--------|
| `grep -c "STATE-SPECIFIC: MA" LOCATION-ONBOARDING.md` | 11 (>= 10 required) |
| `grep -c "| MA | 2026-06-1[45]" LOCATION-ONBOARDING.md` | 7 (>= 7 required) |
| `grep -c "2545000" LOCATION-ONBOARDING.md` | 4 (>= 2 required) |
| `grep -c "end of v13.0): 578" LOCATION-ONBOARDING.md` | 0 (== 0 required) |
| `grep -c "Next migration (end of v14.0): 699" LOCATION-ONBOARDING.md` | 1 (== 1 required) |
| `grep -c "WIKIMEDIA_HEADERS" LOCATION-ONBOARDING.md` | 3 (>= 1 required) |
| `grep -c "Just a moment" LOCATION-ONBOARDING.md` | 5 (>= 1 required) |

## Task 1: Verified geo_ids

All 7 Tier 3 city geo_ids verified from DB query against `essentials.geofence_boundaries` (state='25', mtfcc='G4110'):

| City | RESEARCH.md estimate | DB verified value | Match? |
|------|---------------------|-------------------|--------|
| Newton | 2545560 | 2545560 | YES |
| Somerville | 2562535 | 2562535 | YES |
| Lynn | 2537490 | 2537490 | YES |
| New Bedford | 2524000 | **2545000** | NO — corrected |
| Fall River | 2522640 | **2523000** | NO — corrected |
| Medford | 2540115 | **2539835** | NO — corrected |
| Waltham | 2573440 | **2572600** | NO — corrected |

4 of 7 RESEARCH.md estimates were wrong. New Bedford was also confirmed from migration 587 (which used geo_id='2545000' in its INSERT and pre-flight assertion).

**Medford external_id discrepancy:** The actual Medford politicians were seeded with external_id prefix -2540115xxx (using the wrong estimate) rather than -2539835xxx (the actual geo_id). This is a perpetual discrepancy — documented in the Medford Cities Onboarded row and the Step 5 GOTCHA. Changing the external_ids would require a new migration touching 8 politicians; deferred as out of scope for this documentation phase.

## Task 2: Cities Onboarded + MA Quick Reference

**7 Cities Onboarded rows added** after the Boston row, with election_method='plurality' for all 7:
- Newton (2026-06-14): 24 council + Mayor; CivicEngage 0/33 headshots; geo_id=2545560
- Somerville (2026-06-14): 11 council + Mayor; TWO ex-officio SC; somervillema.gov 9/12 headshots; geo_id=2562535
- Lynn (2026-06-14): 11 council + Mayor; CivicLive CDN; Wikipedia Commons for Mayor; MegieMaddrey.png CDN filename; geo_id=2537490
- New Bedford (2026-06-14): 11 council + Mayor; NOT sanctuary city; geo_id=2545000 (corrected from 2524000)
- Fall River (2026-06-15): 9 all-at-large; Revize 0/10 headshots; geo_id=2523000 (corrected from 2522640)
- Medford (2026-06-15): 7 all-at-large; finalsite.net CDN for Mayor only (1/14); geo_id=2539835 (estimate was 2540115; ext_ids use -2540115xxx)
- Waltham (2026-06-15): 15 council + Mayor; Cloudflare JS challenge 0/16 headshots; geo_id=2572600 (corrected from 2573440)

**4 new MA Quick Reference trap rows added:**
1. MA Tier 3 geo_id estimates wrong — verify from DB (Step 5)
2. MA Tier 3 council structure varies — never assume at-large (Step 1)
3. MA councillor spelling is city-specific (Step 5)
4. MA CivicEngage/Revize + Cloudflare cities block all headshots (Step 4)

**7 new Key Facts bullets added:**
- All 7 Tier 3 city geo_ids (DB-verified)
- CivicLive CDN pattern for Lynn (cdnsm5-hosted2.civiclive.com, punctuation stripping)
- Medford finalsite.net CDN + distinct school domain (mps02155.org)
- CivicEngage/Revize block note (Newton, Fall River = 0 headshots)
- Cloudflare JS challenge note (Waltham = 0 headshots, detect by body text)
- Wikipedia Commons WIKIMEDIA_HEADERS requirement
- Next migration updated from 578 (v13.0) to 699 (v14.0)

## Task 3: New MA GOTCHA Callouts

6 new `[STATE-SPECIFIC: MA]` GOTCHAs added (plan required minimum 5):

**Step 1 (2 new):**
1. MA Tier 3 council structure wrong for every city (Phase 121)
2. Somerville SC has TWO ex-officio members — Mayor AND Council President (Phase 118)

**Step 4 (3 new):**
3. CivicEngage/Revize/Cloudflare block all headshots — HTTP 200 != accessible (Phases 117, 121)
4. Wikipedia Commons requires WIKIMEDIA_HEADERS descriptive bot UA — Chrome returns 429 (Phase 119)
5. CivicLive CDN filenames may strip punctuation from DB last_name (Phase 119)

**Step 5 (1 new):**
6. MA Tier 3 geo_id estimates routinely mismatch the DB — always verify before writing (Phases 120, 121)

**Step 7 (2 new broadly-applicable pitfall rows):**
- MA Tier 3 geo_id estimate wrong (with fix query)
- HTTP 200 does not mean content accessible with Cloudflare JS challenge

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Discovery] Medford geo_id confirmed as 2539835 (not 2540115 as in RESEARCH.md)**
- Found during: Task 1 DB verification
- Issue: RESEARCH.md stated Medford geo_id=2540115; DB query returned 2539835. This means the Medford seed migration used the wrong external_id prefix (-2540115xxx instead of -2539835xxx).
- Fix: Used DB-verified value 2539835 in the Cities Onboarded Notable patterns cell and Step 5 GOTCHA; documented the external_id discrepancy explicitly
- Files modified: LOCATION-ONBOARDING.md (documentation only; no DB changes)
- Commit: a98c990

**2. [Rule 2 - Enhancement] Added 6th GOTCHA (Somerville TWO ex-officio) beyond the 5 minimum**
- Found during: Task 3 review of RESEARCH.md GOTCHA 7
- Issue: Plan specified minimum 5 GOTCHAs; GOTCHA 7 (Somerville TWO ex-officio) was in RESEARCH.md and PATTERNS.md as optional
- Fix: Added it as the 2nd Step 1 GOTCHA since it directly warns about the SC seeding pattern that differs from other MA cities
- Files modified: LOCATION-ONBOARDING.md
- Commit: 34402cd

## Known Stubs

None — all 7 Cities Onboarded rows are populated with verified data from completed phase summaries.

## Threat Flags

None — documentation-only phase; no new network endpoints, auth paths, or schema changes.

## Self-Check: PASSED

- [x] LOCATION-ONBOARDING.md exists and was modified: `git show a98c990 --name-only` and `git show 34402cd --name-only` confirm LOCATION-ONBOARDING.md in both commits
- [x] Commit a98c990 exists: Task 2 commit
- [x] Commit 34402cd exists: Task 3 commit
- [x] All 7 verification grep gates passed (documented above)
- [x] No files accidentally deleted: both commits are insertions-only (18 insertions + 14 insertions = 32 total insertions, 1 deletion for the v13.0 migration line replacement)
