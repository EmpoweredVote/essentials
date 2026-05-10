---
phase: 31-donor-court-conflict-map
plan: "01"
subsystem: campaign-finance
tags: [campaign-finance, legal-donors, court-research, la-superior-court, city-attorney]
completed: 2026-05-09
duration: ~45 minutes

dependency_graph:
  requires:
    - 29-bar-evaluation-data (migration 117 politician UUIDs)
    - 26-campaign-finance-gap-closure (contributions ingested for CA candidates)
  provides:
    - court-research-input.json: per-candidate legal firm lists for Plan 02 lacourt.org research
  affects:
    - 31-02-PLAN.md (consumes court-research-input.json)
    - 31-03-PLAN.md (consumes court-research-input.json)

tech_stack:
  added: []
  patterns:
    - fastest-levenshtein fuzzy firm dedup (distance threshold merge/flag)
    - cumulative-dollar 15% threshold (not percentile of donor count)
    - COALESCE employer field pattern (contributor_employer / con_empr fallback)

key_files:
  created:
    - C:/EV-Accounts/backend/scripts/identify-legal-donors.ts
    - C:/EV-Accounts/backend/scripts/court-research-input.json
  modified: []

decisions:
  - id: D1
    decision: Include Hydee Feldstein Soto (4th CA) in LEGAL_CANDIDATES even though plan named only 3 CAs
    rationale: She is present in migration 117 City Attorney section with a UUID; has 2631 confirmed contributions; excluding would silently discard data
    impact: court-research-input.json has 4 CA entries instead of 3

metrics:
  completed: 2026-05-09
---

# Phase 31 Plan 01: Identify Legal Donors Summary

**One-liner:** Extracted top-15% cumulative legal-professional donors per LA City Attorney candidate using COALESCE employer fields, fastest-levenshtein fuzzy dedup, and wrote deterministic court-research-input.json for Plan 02 lacourt.org research.

## What Was Done

Built `identify-legal-donors.ts` in two passes:

**Task 1 (probe mode):** Embedded 32 UUIDs from migration 117 as typed `LEGAL_CANDIDATES` constant. Verified confirmed-contribution coverage at runtime via SQL. Script prints per-candidate counts or "skipped: no confirmed contributions" — prevents hardcoded assumptions about who has data.

**Task 2 (extraction mode):** Full pipeline — occupation-keyword filter, COALESCE employer normalization, firm name normalization (suffix strip, punctuation collapse), fuzzy dedup via Levenshtein distance, 15% cumulative dollar threshold, deterministic sort (total_donated desc, raw_firm_name asc), JSON output.

## Candidates with Confirmed Contribution Data

| Candidate | Type | Confirmed Contributions | Firms in 15% | Grand Total |
|---|---|---|---|---|
| Hydee Feldstein Soto | City Attorney | 2631 | 212 | $2,708,297.93 |
| Marissa Roy | City Attorney | 1270 | 14 | $994,427.27 |
| John McKinney | City Attorney | 125 | 3 | $72,714.00 |
| Aida Ashouri | City Attorney | 71 | 8 (all legal firms found) | $14,079.64 |

**Skipped (no confirmed contributions): 28 judge challengers** — all judge candidates from migration 117 have no politician_sources with research_status='confirmed' in transparent_motivations. This is expected; campaign finance data was only ingested for the LA City Ethics Commission races (City Attorney), not for LA Superior Court judicial races.

## Top Firm per City Attorney Candidate (Sanity Check for Plan 02)

**Ashouri** — `Life Sciences Patent Law Firm` — $300 from 1 donor (ATTORNEY)
- Note: All 8 legal firms found fall below the $2,112 threshold individually. Total legal donations = $1,193. Ashouri has very few contributions overall ($14k grand total, 71 rows). All 8 firms included as honest output.

**McKinney** — `LA County DA's Office` — $5,400 from 1 donor (LAWYER)
- 3 firms reach cumulative 15%: DA's Office ($5,400) + Gunderson Dettmer ($4,750) + Halpern Law ($3,807)

**Roy** — `California Department of Justice` — $41,053 from 13 donors (ATTORNEY, DEPUTY ATTORNEY GENERAL, LAWYER)
- 14 firms reach cumulative 15% threshold ($149,164)

**Feldstein Soto** — `City of Los Angeles` — $75,774 from 20 donors (6 occupation variants including CITY ATTORNEY, DEPUTY CITY ATTORNEY)
- 212 firms needed to reach $406k threshold (15% of $2.7M grand total)

## Fuzzy Dedup Results

| Candidate | firms after dedup | needs_review in 15% |
|---|---|---|
| Hydee Feldstein Soto | 284 | 61 |
| Marissa Roy | 224 | 4 |
| John McKinney | 24 | 0 |
| Aida Ashouri | 8 | 0 |

Notable fuzzy pairs flagged for review in Feldstein Soto data:
- "alston and bird" vs "alston bird" (distance=4)
- "latham and watkins" vs "latham watkins" (distance=4)
- "ervin cohen jessup" vs "ervin cohen and jessup" (distance=4)
- "lewis brisbois bisgaard smith" vs "lewis brisbois bisgaard and smith" (distance=4)
- "dla piper (us)" vs "dla piper" (distance=5)

These are genuine alternate spellings of the same firm in the Socrata data — Plan 02 human researcher should consolidate during lacourt.org lookup.

## Data Anomalies

1. **Ashouri legal donation total below threshold**: Only $1,193 in legal-professional donations vs $2,112 (15%) threshold. Script correctly includes all 8 firms (honest output for sparse data).

2. **"Stripe" flagged for review with law firm names** (Hydee): Payment processor "Stripe" is a 3-letter normalized form that has Levenshtein distance ≤6 from many short law firm abbreviations. It is NOT a law firm — it appears in the data because a donor listed occupation as "attorney" and employer as "Stripe." Plan 02 researcher can discard it.

3. **"disney" and "lacera" flagged** (Hydee): Same issue — large employers appear when their attorney employees donate. These are not law firms active in courts but legal-department employees. Researcher judgment required.

4. **Associate volume logged**: Hydee (1 row) and Roy (9 rows) had donors with bare "associate" occupation. Per spec, excluded from legal filter to avoid non-legal collisions.

## Verification Passes

- [x] `court-research-input.json` exists at `C:/EV-Accounts/backend/scripts/`
- [x] No plain `con_emp` usage in script (only `con_empr`)
- [x] Extended legal keywords present: esquire, partner, esq, solicitor, litigator
- [x] Threshold logic present: `grand_total * 0.15`, cumulative walk
- [x] JSON shape valid: all required keys present, firms sorted desc by total_donated
- [x] Deterministic: identical bytes on re-run (confirmed via diff)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ESM `__dirname` undefined in tsx context**

- **Found during:** Task 2 first run
- **Issue:** Script used `__dirname` which is not defined in ES module context under tsx
- **Fix:** Added `import { fileURLToPath } from 'url'` and reconstructed `__dirname` from `import.meta.url`
- **Files modified:** `identify-legal-donors.ts`

### Decisions Made

**1. Hydee Feldstein Soto included in output (4 CAs, not 3)**

Plan named 3 City Attorney candidates but migration 117 hardcodes all 4 including Feldstein Soto. She has 2631 confirmed contributions and is the largest legal donor corpus in the dataset. Excluding her would waste the most valuable data for Plan 02 research.

## Next Phase Readiness

Plan 02 can begin immediately. `court-research-input.json` is ready. Researcher should focus on:
1. Feldstein Soto's 212-firm list (very large — may want to sub-select top 50 by total_donated for initial lacourt.org pass)
2. Roy's 14 firms — actionable size for manual research
3. McKinney's 3 firms — quick to verify
4. Ashouri's 8 firms — sparse data, low research priority

**Concerns for Plan 02:**
- "City of Los Angeles" (top firm for Feldstein Soto) is the incumbent City Attorney's own office — Feldstein Soto's legal colleagues donating to her campaign. This is expected behavior, not a court conflict. Plan 02 researcher should apply conflict framing only to private law firms appearing in court.
- Ashouri's legal donor base is very sparse ($1,193 total) — may have limited court-conflict surface area.
