---
phase: 164-north-las-vegas-deep-seed
plan: 03
title: North Las Vegas stances + final E2E verification (CLARK-04)
status: complete
completed: 2026-06-29
requirements: [CLARK-04]
---

# Phase 164 Plan 03 — Summary

Researched (one agent at a time) and installed evidence-only compass stances for all 5
City of North Las Vegas council members, then proved all 4 CLARK-04 success criteria
end-to-end via 9 SQL/HTTP checks. **18 stances, 100% cited, zero defaults, honest blanks.**

## Stance research (one agent at a time — hard rule honored)

Ward path: **X0017** (ward-precise; not D-01b). Chairs model (value = discrete position
the evidence matches, not a polarity). Each agent covered all 15 city-scope live topics;
judicial topics excluded (council members are not judges).

| ext_id | Member | Migration | Stances | Topics placed |
|--------|--------|-----------|---------|----------------|
| −3207001 | Pamela Goynes-Brown | 1095 | **4** | housing(3), public-safety-approach(4), economic-development(4), growth-and-development(3) |
| −3207002 | Isaac E. Barrón | 1096 | **3** | local-immigration(3), economic-development(4), public-safety-approach(4) |
| −3207003 | Ruth Garcia-Anderson | 1097 | **3** | taxes(3), public-safety-approach(4), housing(3) |
| −3207004 | Scott Black | 1098 | **3** | economic-development(4), growth-and-development(4), rent-regulation(5) |
| −3207005 | Richard Cherchio | 1099 | **5** | housing(3), residential-zoning(3), public-safety-approach(3), taxes(4), economic-development(3) |

**Total: 18 stances.** APEX Industrial Park / Faraday economic-development is the defining
NLV story and showed up as cited evidence for 4 of 5 members, as predicted.

### Evidence-integrity correction (notable)

Two research agents initially placed `homelessness`/`homelessness-response` for Goynes-Brown
and Cherchio based on the Aug 6 2025 NLV encampment Ordinance 3228. On verification: (a) press
coverage reports **no roll-call / no individual member vote or quote**, and (b) the cited
"Campus for Hope" funding is a **West Las Vegas (City of LV / Clark County) project** (officials
quoted are LV Mayor Pro-Tem Knudsen + Sheriff McMahill), **not** an NLV initiative — an
agent conflation. Per the evidence-only / no-default standard, **both homelessness stances were
dropped for both members** (honest blanks) rather than rest on inference + misattribution. The
Garcia-Anderson agent independently and correctly declined the same attribution.

## 9-check verification suite (all pass)

| # | Check | Result |
|---|-------|--------|
| 1 | Council office count | **5** (1 Mayor + 4 wards) |
| 2 | District-type split | **1 LOCAL_EXEC** (Mayor, geo_id 3251800) + **4 LOCAL** (X0017), all state='nv' |
| 3 | Headshot rows (ext −3207001..−3207005) | **5** (0 gaps) |
| 4 | Headshots serve | all **5 CDN URLs → HTTP 200** |
| 5 | Evidence-only stances | **18** answers; **0 uncited** (all paired with non-null reasoning+sources); 0 defaulted values |
| 6 | Section-split orphans | **0** |
| 7 | Casing (linked districts) | **'nv'** only |
| 8 | Ledger registered (1093–1099) | **only 1093** (1094–1099 audit-only) |
| 9 | Ward-precise routing (PIP) | each ward interior point covered by **exactly its own X0017** polygon + city G4110; resolves W1→Barrón, W2→Garcia-Anderson, W3→Black, W4→Cherchio (no overlap, no all-4) |

coverage.js: North Las Vegas (browseGovernmentList ['3251800'], hasContext:true) present in the
NV block alongside Las Vegas + Henderson (Plan 01).

## Files

- `C:/EV-Accounts/backend/migrations/1095_north_las_vegas_goynesbrown_stances.sql` (audit-only)
- `C:/EV-Accounts/backend/migrations/1096_north_las_vegas_barron_stances.sql` (audit-only)
- `C:/EV-Accounts/backend/migrations/1097_north_las_vegas_garciaanderson_stances.sql` (audit-only)
- `C:/EV-Accounts/backend/migrations/1098_north_las_vegas_black_stances.sql` (audit-only)
- `C:/EV-Accounts/backend/migrations/1099_north_las_vegas_cherchio_stances.sql` (audit-only)

## Deviations / gaps

- Homelessness stances dropped for Goynes-Brown + Cherchio (evidence-integrity, above) — honest blanks, not gaps requiring closure.
- Thin records (expected) leave many topics as honest blanks across all members; no fabrication.

## Browse link

essentials.empowered.vote/results?browse_geo_id=3251800&browse_mtfcc=G4110

## Human checkpoint

Task 3 (ward routing + correct-person headshots + stance honesty) presented to operator below.
