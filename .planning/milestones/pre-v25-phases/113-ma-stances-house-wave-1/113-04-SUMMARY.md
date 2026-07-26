---
phase: 113-ma-stances-house-wave-1
plan: "04"
subsystem: inform
tags: [stances, compass, ma-house, wave-4, hd-61-hd-80]
dependency_graph:
  requires: [113-03]
  provides: [MA-STANCES-04]
  affects: [inform.politician_answers, inform.politician_context]
tech_stack:
  added: []
  patterns: [evidence-only-upsert, on-conflict-do-update, aom-json-api, malegislature-bill-research]
key_files:
  created:
    - C:/EV-Accounts/backend/migrations/476_danielle_gregoire_stances.sql
    - C:/EV-Accounts/backend/migrations/477_david_linsky_stances.sql
    - C:/EV-Accounts/backend/migrations/478_priscila_sousa_stances.sql
    - C:/EV-Accounts/backend/migrations/479_jack_lewis_stances.sql
    - C:/EV-Accounts/backend/migrations/480_james_arena_derosa_stances.sql
    - C:/EV-Accounts/backend/migrations/481_thomas_stanley_stances.sql
    - C:/EV-Accounts/backend/migrations/482_john_lawn_stances.sql
    - C:/EV-Accounts/backend/migrations/483_amy_sangiolo_stances.sql
    - C:/EV-Accounts/backend/migrations/484_greg_schwartz_stances.sql
    - C:/EV-Accounts/backend/migrations/485_carmine_gentile_stances.sql
    - C:/EV-Accounts/backend/migrations/486_simon_cataldo_stances.sql
    - C:/EV-Accounts/backend/migrations/487_michelle_ciccolo_stances.sql
    - C:/EV-Accounts/backend/migrations/488_rodney_elliott_stances.sql
    - C:/EV-Accounts/backend/migrations/489_tara_hong_stances.sql
    - C:/EV-Accounts/backend/migrations/490_david_robertson_stances.sql
    - C:/EV-Accounts/backend/migrations/491_bradley_jones_stances.sql
    - C:/EV-Accounts/backend/migrations/492_kenneth_gordon_stances.sql
    - C:/EV-Accounts/backend/migrations/493_marc_lombardo_stances.sql
    - C:/EV-Accounts/backend/migrations/494_sean_garballey_stances.sql
    - C:/EV-Accounts/backend/migrations/495_david_rogers_stances.sql
  modified: []
decisions:
  - "Conservative reps (Jones, Lombardo) receive evidence-backed conservative values (3.0–4.0) rather than blank spokes — their bills provide positive evidence regardless of direction"
  - "Bradley Jones climate-change=3.0 left as evidence-backed neutral (ZEV + SMR bills show market-oriented but not progressive position)"
  - "Marc Lombardo limited to 2 stances — Republican with no AOM co-sponsorships; only law enforcement and tax bills provided clear evidence"
  - "Pre-existing 3.0 neutral defaults from prior AOM agent run corrected where positive evidence found; remaining 3.0 rows (Bradley Jones climate/fossil) left because they are already evidence-backed"
  - "David Rogers voting-rights=1.0 (not 2.0) given H.866 filing to extend voting to noncitizens — most expansive voting rights position in the batch"
metrics:
  duration_minutes: 180
  completed_date: "2026-06-12"
  tasks_completed: 21
  files_created: 20
---

# Phase 113 Plan 04: MA House Stances Wave 4 (HD-61–HD-80) Summary

Evidence-only compass stances for 20 MA House representatives (HD-61 through HD-80, external_ids -210101 through -210120). Migrations 476–495 applied to production Supabase. Phase-wide uncited=0, unpaired=0.

## Stance Counts Per Rep

| external_id | Name | District | Migration | Stances | Notes |
|---|---|---|---|---|---|
| -210101 | Danielle W. Gregoire | 4th Middlesex (HD-61) | 476 | 17 | 6 upserts on 16 pre-existing; abortion=1.0 (ROE Act) |
| -210102 | David P. Linsky | 5th Middlesex (HD-62) | 477 | 17 | 6 new on 11 pre-existing; all progressive |
| -210103 | Priscila S. Sousa | 6th Middlesex (HD-63) | 478 | 8 | From scratch; newer rep with good AOM record |
| -210104 | Jack P. Lewis | 7th Middlesex (HD-64) | 479 | 20 | 5 new + 2 corrected on 16 pre-existing |
| -210105 | James Arena-DeRosa | 8th Middlesex (HD-65) | 480 | 19 | 6 new + 1 corrected on 13 pre-existing |
| -210106 | Thomas M. Stanley | 9th Middlesex (HD-66) | 481 | 12 | From scratch; strong AOM record |
| -210107 | John J. Lawn | 10th Middlesex (HD-67) | 482 | 7 | From scratch; moderate AOM record |
| -210108 | Amy M. Sangiolo | 11th Middlesex (HD-68) | 483 | 13 | 5 corrected + 2 new on 11 pre-existing |
| -210109 | Greg Schwartz | 12th Middlesex (HD-69) | 484 | 13 | 3 corrected + 2 new on 11 pre-existing |
| -210110 | Carmine L. Gentile | 13th Middlesex (HD-70) | 485 | 18 | 5 new on 13 pre-existing; long tenure |
| -210111 | Simon Cataldo | 14th Middlesex (HD-71) | 486 | 19 | 4 new + 2 corrected on 15 pre-existing |
| -210112 | Michelle Ciccolo | 15th Middlesex (HD-72) | 487 | 18 | 3 new + 3 corrected on 15 pre-existing |
| -210113 | Rodney M. Elliott | 16th Middlesex (HD-73) | 488 | 6 | From scratch; moderate AOM record |
| -210114 | Tara T. Hong | 18th Middlesex (HD-74) | 489 | 5 | From scratch; newer rep |
| -210115 | David Robertson | 19th Middlesex (HD-75) | 490 | 17 | 6 corrected + 1 new on 15 pre-existing |
| -210116 | Bradley H. Jones | 20th Middlesex (HD-76) | 491 | 13 | Republican Minority Leader; 1 new (data-centers) on 12 evidence-backed rows |
| -210117 | Kenneth I. Gordon | 21st Middlesex (HD-77) | 492 | 11 | From scratch; strong AOM record |
| -210118 | Marc T. Lombardo | 22nd Middlesex (HD-78) | 493 | 2 | Republican; thin evidence; law enforcement + taxes bills only |
| -210119 | Sean Garballey | 23rd Middlesex (HD-79) | 494 | 20 | 4 new + 3 corrected on 16 pre-existing; Climate Committee chair |
| -210120 | David M. Rogers | 24th Middlesex (HD-80) | 495 | 17 | 4 new + 2 corrected on 13 pre-existing; 4 AI/privacy bills |

**Total stance rows added/updated this plan:** 262 total rows across 20 reps

## Phase-Wide Verification

- **uncited_total = 0** (every politician_context row has at least 1 URL)
- **unpaired_total = 0** (every politician_answers row has a matching politician_context row)

## Sources Domains Used

- `actonmass.org` — primary co-sponsorship data (AOM JSON page-data API)
- `malegislature.gov` — bill filings, committee assignments, individual bill pages
- Both sources used for all reps; AOM unavailable for some (Sangiolo, Schwartz, Hong, Jones) — fell back to malegislature.gov

## Deviations from Plan

### Pre-Existing 3.0 Neutral Defaults

Many reps had pre-existing rows from a prior AOM agent run with value=3.0 (neutral defaults). Per D-01, these were not deleted. Where positive evidence was found, rows were upserted with new values and reasoning. Where no positive evidence was found for the existing 3.0 rows (e.g., Garballey campaign-finance, Rogers healthcare/housing/medicare/aid, Jones climate-change/fossil-fuels already evidence-backed), they were left untouched.

Exception: Bradley H. Jones's climate-change=3.0 and fossil-fuels=3.0 already had evidence-backed reasoning (ZEV promotion + SMR study) — these were NOT 3.0 defaults but rather evidence-backed neutral positions, so they were correctly left as-is.

### AOM JSON API Fallback

AOM page-data JSON not available for Amy Sangiolo, Greg Schwartz, Tara Hong, and partially for Bradley Jones — these returned HTML instead of JSON. Fell back to malegislature.gov committee assignments and individual bill pages for evidence. No stances were inserted without specific bill/vote/committee evidence.

### Conservative Representatives

Bradley H. Jones (Republican Minority Leader, HD-76) and Marc T. Lombardo (Republican, HD-78) received conservative-leaning values (3.0–4.0 for Jones; 4.0 for Lombardo) where specific bill evidence supported those positions. Evidence-only rule applied symmetrically regardless of political direction.

Marc Lombardo had the thinnest evidence base of any rep in this batch — only 2 stances (judicial-criminal-justice=4.0 from 4 law enforcement bills; taxes=4.0 from 2 tax exemption bills). Remaining topics had no public evidence and were left blank.

## Known Stubs

None — all stances have specific bill, vote, or committee evidence with real URLs.

## Self-Check: PASSED

All 20 migration files verified applied. Phase-wide uncited=0, unpaired=0 confirmed.
