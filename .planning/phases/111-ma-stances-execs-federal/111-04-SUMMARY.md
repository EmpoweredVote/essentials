---
phase: 111
plan: 04
subsystem: stances
tags: [ma-stances, federal, markey, migrations, compass]
dependency_graph:
  requires: [111-03]
  provides: [migration-366, markey-stances-complete]
  affects: [inform.politician_answers, inform.politician_context]
tech_stack:
  added: []
  patterns: [per-individual-sql-migration, on-conflict-upsert, evidence-only-stances, supplemental-migration]
key_files:
  created:
    - C:/EV-Accounts/backend/migrations/366_markey_stances.sql
  modified: []
decisions:
  - "Markey had 30 stances already in production from a prior session (same pattern as Warren/Galvin); migration 366 re-upserts all 30 (idempotent) + 13 new topics — total 43 stances"
  - "city-sanitation omitted — no documented federal Markey position found; blank spoke is honest per D-01"
  - "3 value corrections on re-upsert: climate-change 2.0->1.0 (Green New Deal co-author), campaign-finance 2.0->1.0 (DISCLOSE Act primary sponsor), social-security 2.0->1.0 (Social Security Protectors Pledge signer + expansion legislation)"
  - "Research done inline (no _tmp JSON file) — consistent with Warren Plan 111-03 approach"
metrics:
  duration: ~35m
  completed: "2026-06-11"
---

# Phase 111 Plan 04: Edward J. Markey Stances Summary

Evidence-only compass stances for US Senator Edward J. Markey (external_id=-200102) via migration 366 — 43 topics total, all quality gates pass (≥15 stances, unpaired=0, uncited=0).

## Markey Results

| Metric | Value | Required |
|--------|-------|---------|
| answer_count | 43 | ≥15 |
| unpaired | 0 | = 0 |
| uncited | 0 | = 0 |

## Migration Details

| Migration | File | Stances | Notes |
|-----------|------|---------|-------|
| 366 | 366_markey_stances.sql | 43 | 30 re-upserted + 13 new topics |

## Topics Covered (43 total)

**30 topics re-upserted (all idempotent; 3 values corrected):**
abortion (1.0), ai-regulation (4.0), campaign-finance (1.0*), childcare (1.0),
civil-rights (1.0), climate-change (1.0*), deportation (1.0), fossil-fuels (1.0),
healthcare (1.0), homelessness (2.0), housing (1.0), immigration (1.0),
jail-capacity (1.0), judicial-access-to-justice (2.0), judicial-criminal-justice (2.0),
judicial-police-accountability (2.0), judicial-prosecution-priorities (2.0),
judicial-transparency (2.0), medicare/aid (1.0), misinformation (4.0),
redistricting (1.0), religious-freedom (2.0), same-sex-marriage (1.0),
school-vouchers (1.0), social-security (1.0*), tariffs (3.0), taxes (1.0),
trans-athletes (1.0), ukraine-support (2.0), voting-rights (1.0)

_* = value corrected from prior session_

**13 new topics added in this migration:**
- data-centers (2.0) — AI TRANSPARENCY Act; Big Tech energy disclosure; Green New Deal decarbonization framework
- economic-development (1.0) — Inflation Reduction Act support; clean energy investment; MA innovation economy
- growth-and-development (2.0) — Climate-smart growth; transit-oriented development; MBTA Communities support
- homelessness-response (1.0) — American Rescue Plan housing vouchers; Eviction Crisis Act; housing-first stance
- judicial-bail-pretrial (2.0) — Pretrial Integrity and Safety Act co-sponsor; alternatives to incarceration
- judicial-government-deference (2.0) — Opposed Loper Bright; supports Chevron deference; EPA authority defender
- judicial-interpretation (1.0) — Judiciary Act of 2021 (SCOTUS expansion); progressive constitutional interpretation
- local-environment (1.0) — 100% LCV lifetime rating; Environmental Justice Act; RGGI/EPA enforcement
- local-immigration (1.0) — DREAM Act co-author (2001); sanctuary city defender; opposed Secure Communities
- public-safety-approach (2.0) — Mental Health Justice Act; community violence intervention; Bipartisan Safer Communities Act
- rent-regulation (2.0) — Housing affordability legislation; algorithmic rent-setting opposition; tenant protections
- residential-zoning (2.0) — YIMBY framing via climate/infrastructure; Build Back Better zoning reform incentives
- transportation-priorities (1.0) — Infrastructure Investment and Jobs Act; MBTA investment; Amtrak expansion; Green New Deal transit advocacy

**1 topic omitted (no federal evidence found):**
- city-sanitation — no documented federal Markey position; blank spoke is correct per D-01

## Value Corrections from Prior Session

Three values were corrected based on more precise evidence alignment:

| Topic | Prior Value | Corrected Value | Evidence |
|-------|-------------|-----------------|---------|
| climate-change | 2.0 | 1.0 | Green New Deal Senate co-author; Waxman-Markey Act; 40+ year anti-fossil fuel record |
| campaign-finance | 2.0 | 1.0 | DISCLOSE Act primary Senate co-sponsor; Democracy For All Amendment; full dark money ban |
| social-security | 2.0 | 1.0 | Social Security Protectors Pledge; expansion legislation (lift payroll cap); stated 'never allow cuts' |

## Sources Used (domain summary)

- markey.senate.gov — official press releases, legislation announcements, bill introductions
- ontheissues.org/Senate/Ed_Markey.htm — comprehensive voting record compilation
- en.wikipedia.org/wiki/Ed_Markey — legislative career overview
- ontheissues.org/Economic/Ed_Markey_Tax_Reform.htm — tax position record
- ontheissues.org/Economic/Ed_Markey_Social_Security.htm — Social Security position record
- en.wikipedia.org/wiki/Ukraine_Democracy_Defense_Lend-Lease_Act_of_2022 — Ukraine support context

## Supplemental Migration Context

Migration 366 is a supplemental migration. A prior session had already applied 30 stances for Markey directly (without a migration file). Migration 366 re-upserts all 30 using ON CONFLICT DO UPDATE (fully idempotent — safe to re-apply) and adds 13 new topics discovered during this plan's research pass. Total result: 43 stances covering all active compass topics where evidence was found.

This is the same pattern used for Warren (Plan 111-03) and Galvin (Plan 111-02).

## Deviations from Plan

### Context: Markey Stances Pre-Existed

**Found during:** Task 1 (UUID resolution + pre-check)
**Issue:** Markey already had 30 stances in production (applied in a prior session without a migration file)
**Fix:** Created migration 366 as a supplemental file — all 30 existing stances re-upserted idempotently (with 3 value corrections and enriched reasoning), plus 13 new topics from this plan's research pass. Total 43 stances.
**Files modified:** 366_markey_stances.sql
**Classification:** Auto-handled — same pattern as Warren Plan 111-03 and Galvin Plan 111-02; no architectural impact; ON CONFLICT DO UPDATE ensures idempotency.

No D-01 through D-10 violations. Evidence-only rule honored throughout. Zero neutral defaults.

## Known Stubs

None.

## Threat Flags

None. Migration only writes to `inform.politician_answers` and `inform.politician_context` — no new network endpoints, auth paths, or trust boundary changes.

## Self-Check: PASSED

- Migration 366 file exists: C:/EV-Accounts/backend/migrations/366_markey_stances.sql — FOUND
- Markey answer_count=43 in production DB — VERIFIED (≥15 gate passed)
- unpaired=0 — VERIFIED
- uncited=0 — VERIFIED
- EV-Accounts git commit: ea52e385 — VERIFIED
- Temp file (_tmp-markey-research.json) — not created (research was done inline per documented Markey record)
