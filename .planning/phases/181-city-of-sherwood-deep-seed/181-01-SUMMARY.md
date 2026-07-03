---
phase: 181-city-of-sherwood-deep-seed
plan: 01
subsystem: wave-0-verification
tags: [probe, wave-0, sherwood, or, gate]
dependency-graph:
  requires: []
  provides:
    - "confirmed geo_id 4167100 (G4110)"
    - "confirmed ext_id block -4167101..-4167107"
    - "confirmed next structural migration number 1187"
    - "live compass topic_key list + 8 judicial-* skip list"
    - "re-confirmed 7-member Sherwood City Council roster with terms"
    - "per-official headshot re-download confirmations + square-crop nuance"
    - "A4 judge-appointment confirmation (skip judicial-* stances)"
    - "banner crop call (Railroad St primary, Downtown alternate)"
    - "Open Question 2 plan-04 prerequisite"
  affects:
    - "181-02-PLAN.md (government/chamber/roster structural migration)"
    - "181-03-PLAN.md (headshots)"
    - "181-04-PLAN.md (stances)"
    - "181-05-PLAN.md (banner)"
tech-stack:
  added: []
  patterns:
    - "Wave-0 gate: labeled \\echo + SELECT probe file (A-G), gitignored _tmp-*, orchestrator-run, no DDL"
    - "on-disk migration-file MAX authoritative over ledger MAX (ledger is a recognized trap)"
key-files:
  created:
    - "C:/EV-Accounts/backend/scripts/_tmp-sherwood-wave0-probe.sql (separate repo, gitignored, not committed to essentials)"
  modified: []
decisions:
  - "geo_id CORRECTED: 4167100 (not the ROADMAP/CONTEXT-stated 4167450, which returns 0 rows and does not exist)"
  - "Pure at-large + directly-elected Mayor (2-year term, unique in this milestone) + 6 plain-title Councilors — Beaverton/Tualatin/Forest Grove shape, no wards, no X00xx geofences"
  - "A4 confirmed: City Attorney (Sebastian Tapia, Interim) and Municipal Court Judge (Jack Morris) are council-appointed — skip all 8 judicial-* topics in plan 04"
  - "Banner primary: Railroad St - panoramio.jpg (dreid1987, CC BY 3.0) at --vertical-anchor 0.5; alternate: Downtown - panoramio - dreid1987.jpg"
metrics:
  duration: "~35 minutes (Task 1 authoring + orchestrator-run Task 2 verification)"
  completed: 2026-07-03
---

# Phase 181 Plan 01: Wave-0 Verification Gates Summary

Ground-truthed the City of Sherwood deep-seed's highest-risk facts (corrected geo_id, greenfield status,
migration counter, live roster, headshots, and structural model) against the live production DB and
sherwoodoregon.gov before any write — CORRECTING the ROADMAP/CONTEXT-stated geo_id 4167450 (0 rows,
does not exist) to the verified 4167100.

## What Was Built

Task 1 authored the Wave-0 probe file `C:/EV-Accounts/backend/scripts/_tmp-sherwood-wave0-probe.sql`
(gitignored helper in the separate EV-Accounts repo, not committed here) containing labeled `\echo` +
`SELECT` probes A through G, structurally modeled on the Forest Grove Wave-0 probe analog. Task 2 was a
blocking checkpoint in which the inline orchestrator ran the probe file against the live production
database, re-fetched the council roster and headshots directly from sherwoodoregon.gov, confirmed the
A4 judge-appointment assumption, and viewed the banner candidate images. All gates passed.

## Wave-0 Gate Results (run 2026-07-03, live DB + live web)

### Gate A — DB probes (psql, production)

| Probe | Query | Result | Expected |
|-------|-------|--------|----------|
| A1 | `geofence_boundaries` geo_id='4167100' mtfcc='G4110' | 1 | 1 (CORRECTED value) |
| A2 | `geofence_boundaries` geo_id='4167450' mtfcc='G4110' | 0 | 0 (wrong ROADMAP/CONTEXT value confirmed absent) |
| A3 | `geofence_boundaries` geo_id='4111290' mtfcc='G5420' | 1 | 1 (Sherwood SD 88J — distinct, non-colliding; Phase 184 concern only) |
| B | `districts` on geo_id='4167100' | 0 | 0 (greenfield) |
| C | `governments` by geo_id='4167100' OR name ILIKE '%sherwood%' | 0 | 0 (greenfield) |
| D1 | `politicians.external_id` BETWEEN -4167110 AND -4167095 | 0 | 0 (ext_id block -4167101..-4167107 FREE) |
| D2 | name scan (Rosener/Young/Brouse/Giles/Mays/Scott/Standke) | 0 | 0 (no legacy partial-seed) |
| E | ledger `MAX(version)` = 1178 (TRAP) vs on-disk `ls` MAX = 1186 (1186_schimmel_stances.sql) | next = **1187** | on-disk counter authoritative |
| F | `districts.state` for geo_id='4159000' (Portland) | 'or' | lowercase confirmed for plan 02 |
| G | `compass_topics` WHERE is_live=true | 44 live, 8 judicial-* | matches research |

**Confirmed geo_id: 4167100.** **Confirmed ext_id block: -4167101..-4167107** (probed with margin
-4167110..-4167095, all free). **Confirmed next structural migration number: 1187** (ledger MAX 1178 is
a recognized trap; on-disk file MAX 1186 → next 1187 is authoritative).

**Live topic_key list (verbatim, is_live=true, 44 total, 8 judicial-*):**
abortion, ai-regulation, campaign-finance, childcare, city-sanitation, civil-rights, climate-change,
data-centers, deportation, economic-development, fossil-fuels, growth-and-development, healthcare,
homelessness, homelessness-response, housing, immigration, jail-capacity, judicial-access-to-justice,
judicial-bail-pretrial, judicial-criminal-justice, judicial-government-deference,
judicial-interpretation, judicial-police-accountability, judicial-prosecution-priorities,
judicial-transparency, local-environment, local-immigration, medicare/aid, misinformation,
public-safety-approach, redistricting, religious-freedom, rent-regulation, residential-zoning,
same-sex-marriage, school-vouchers, social-security, tariffs, taxes, trans-athletes,
transportation-priorities, ukraine-support, voting-rights.

The 8 `judicial-*` topics (judicial-access-to-justice, judicial-bail-pretrial,
judicial-criminal-justice, judicial-government-deference, judicial-interpretation,
judicial-police-accountability, judicial-prosecution-priorities, judicial-transparency) are ALL SKIPPED
for plan 04 per the A4 confirmation below.

### Gate B — roster re-fetch (sherwoodoregon.gov/government/city-council/, HTTP 200, NO WAF, plain curl)

7-member roster UNCHANGED and re-confirmed with terms:

| Seat | Name | Title on seat | Term | Expires |
|------|------|----------------|------|---------|
| Mayor | Tim Rosener | Mayor (directly elected, citywide) | 2-year | January 2027 |
| Council President | Kim Young | Council President | 4-year | January 2029 |
| Councilor | Renee Brouse | Councilor | 4-year | January 2029 |
| Councilor | Taylor Giles | Councilor | 4-year | January 2027 |
| Councilor | Keith Mays | Councilor (PLAIN — see pitfall note) | 4-year | January 2027 |
| Councilor | Doug Scott | Councilor | 4-year | January 2027 |
| Councilor | Dan Standke | Councilor | 4-year | January 2029 |

ALL 7 held by election — zero appointed, zero vacant seats.

**PITFALL 3 CONFIRMED HANDLED:** Keith Mays is a PLAIN Councilor today. His bio text mentions Mayor
2018-2022, Mayor 2005-2012, and Council President 2001-2004 as HISTORY only — none of these are his
current title. A fresh WebSearch found no post-2026-07-03 resignation or appointment (only 2011-era
recall history for Sherwood, Oregon, and an unrelated Sherwood, Arkansas council agenda — both
irrelevant).

### Gate C — headshots

All 7 re-downloaded HTTP 200, each a valid 600x600 JPEG, from:
`https://www.sherwoodoregon.gov/wp-content/uploads/2025/02/{name}-600.jpg`

| Official | URL slug | Status |
|----------|----------|--------|
| Tim Rosener | tim-rosener | 200, 600x600 JPEG |
| Kim Young | kim-young | 200, 600x600 JPEG |
| Renee Brouse | renee-brouse | 200, 600x600 JPEG |
| Taylor Giles | taylor-giles | 200, 600x600 JPEG |
| Keith Mays | keith-mays | 200, 600x600 JPEG |
| Doug Scott | doug-scott | 200, 600x600 JPEG |
| Dan Standke | daniel-standke (NOTE: file uses DANIEL not dan) | 200, 600x600 JPEG |

**SQUARE-SOURCE CROP NUANCE for plan 03:** crop WIDTH 600→480 centered on face for the 4:5 target
(the usual pipeline crops HEIGHT — this source is square so width must be cropped instead), then
resize/upscale to 600x750. No D-16 fallback chain needed for any of the 7 officials (best sourcing in
the milestone, 7/7 clean).

### Gate D — structural decisions confirmed

- **PURE AT-LARGE** + directly-elected Mayor (**2-YEAR term** — unique in this milestone, every other
  WashCo Mayor is 4-year; affects migration comment/label only, not the shape) + 6 councilors, plain
  'Mayor'/'Councilor' titles, NO wards/positions/X00xx geofences — Beaverton/Tualatin/Forest Grove shape:
  1 LOCAL_EXEC Mayor district + 1 LOCAL at-large district on geo_id 4167100, state='or' lowercase.
- Youth Advisory Board confirmed a SEPARATE advisory board, NOT a dais seat — nothing to exclude from
  the 7-member roster (D-13 satisfied cleanly).
- **A4 CONFIRMED** per Dec-2024 org chart (research HIGH-confidence, uncontradicted): City Attorney
  (Sebastian Tapia, Interim) and Municipal Court Judge (Jack Morris) are council-APPOINTED → skip all 8
  judicial-* topics in plan 04.

### Gate E — banner candidates viewed and crop-tested at 3.15:1 (anchor 0.5)

- **PRIMARY:** "Railroad St - panoramio.jpg" (dreid1987, CC BY 3.0, 3264x2448) — crops EXCELLENTLY at
  `--vertical-anchor 0.5`: Old Town storefronts, hanging flower baskets, street lamps, and crosswalk all
  preserved; recognizable everyday main-street scene per D-14. **RECORDED CALL: use this as primary for
  plan 05.**
- **ALTERNATE:** "Downtown - panoramio - dreid1987.jpg" (CC BY 3.0, 3264x2448) — also crops acceptably
  at anchor 0.5 (historic cottages, picket fence, flowers) but reads more residential-lane than
  downtown. Acceptable fallback.

Both candidates to be presented to the operator at plan 05 per D-14.

### Gate F — Open Question 2 (plan-04 prerequisite)

Before attributing the Oct 28 2025 unanimous housing-charter vote per-official in plan 04, confirm the
exact seated roster on that date (Young/Brouse/Standke seated since Jan 2025; all 7 very likely seated,
but the meeting minutes/packet PDF must be checked first — do not assume).

## Deviations from Plan

None — plan executed exactly as written. All Wave-0 gates passed on the first run; no reconciliation,
range-shift, or re-plan was required.

## Self-Check: PASSED

- FOUND: `C:/EV-Accounts/backend/scripts/_tmp-sherwood-wave0-probe.sql` (5995 bytes, confirmed present on disk; not committed — separate gitignored repo per plan)
- FOUND: `.planning/phases/181-city-of-sherwood-deep-seed/181-01-SUMMARY.md` (this file)
