---
phase: 99-md-verification-playbook-retrospective
reviewed: 2026-06-07T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - LOCATION-ONBOARDING.md
findings:
  critical: 1
  warning: 2
  info: 2
  total: 5
status: issues_found
---

# Phase 99: Code Review Report

**Reviewed:** 2026-06-07
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

Reviewed `LOCATION-ONBOARDING.md` after the Phase 99 Plan 02 edits that added Maryland-specific content: 2 Cities Onboarded rows, a Maryland Quick Reference section (10-row trap table + Key Facts list), 5 inline [STATE-SPECIFIC: MD] GOTCHA blocks in Steps 1/3/4/5/6, and 6 new Step 7 pitfall rows.

The document is structurally sound — heading order is correct, `---` rules are placed correctly, table syntax is valid, and all 5 inline GOTCHA blocks render as blockquotes. The factual content of the GOTCHAs is accurate and sourced correctly from 99-RESEARCH.md.

One cross-reference error in the Quick Reference table sends future agents to the wrong step. Two additional issues degrade navigational accuracy. Two informational observations are noted.

## Structural Findings (fallow)

No structural pre-pass was provided.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Quick Reference "MD-GOV-04 NOT EXISTS guard" points to Step 6 but the GOTCHA lives in Step 5

**File:** `LOCATION-ONBOARDING.md:104`
**Issue:** The Maryland Quick Reference table row for `MD-GOV-04 NOT EXISTS guard` has `See Step: Step 6`. Step 6 is "Migration Order" and contains the `cron_active` GOTCHA (line 393). The NOT EXISTS guard GOTCHA — the one a future agent needs — is in Step 5 (line 338, "Schema Decisions Before Migration"). An agent following "See Step 6" will land on the `discovery_jurisdictions has NO cron_active column` block, not the `(district_id, politician_id)` guard block. This is a navigation failure that defeats the purpose of the Quick Reference.

The source of this error is 99-RESEARCH.md line 197 which also listed "Step 6" — the implementation faithfully reproduced the research's mistake. However the final authoritative placement of the GOTCHA is Step 5, making the reference wrong regardless of where it originated.

**Fix:** Change line 104:
```markdown
| MD-GOV-04 NOT EXISTS guard | Step 5 | Multi-member district INSERT must guard on (district_id, politician_id) NOT (district_id, chamber_id) |
```

## Warnings

### WR-01: Quick Reference "politician_photos bucket" points to Step 7 (Common Pitfalls), not Step 4 (Data Sources) where the inline GOTCHA lives

**File:** `LOCATION-ONBOARDING.md:102`
**Issue:** The Quick Reference row for `politician_photos bucket` has `See Step: Step 7`. Step 7 is "Common Pitfalls (Check Before Every Migration)" — a debugging checklist, not a how-to guide. The inline GOTCHA that instructs agents on the correct bucket name lives in Step 4 (Data Sources, line 309). A reader navigating from the Quick Reference to "Step 7" finds only the pitfall table row (which they can already see from the Quick Reference), not the detailed instructional GOTCHA about compound last-names, Peña-Melnyk, and Jacobs J. that appears in Step 4.

This reference came from 99-RESEARCH.md line 195 (`| politician_photos bucket | Step 7 | ...`) and was carried through without correction. Step 4 is the more useful target because that is where the actionable mgaleg discovery GOTCHA (which covers the bucket name alongside the broader headshot sourcing pattern) lives.

**Fix:** Change line 102:
```markdown
| politician_photos bucket | Step 4 | Upload to 'politician_photos' bucket (NOT 'politician-headshots' — that bucket does not exist); path: {politician_id}-headshot.jpg |
```

### WR-02: Quick Reference "Multi-member delegate districts" lists Step 6 as a See-Step reference but Step 6 has no multi-member delegate content

**File:** `LOCATION-ONBOARDING.md:96`
**Issue:** The row `Multi-member delegate districts | Step 5, 6 | ...` implies that Step 6 contains actionable content about multi-member delegate handling. Step 6 (Migration Order) contains the `discovery_jurisdictions cron_active` MD GOTCHA only — no content about delegate NOT EXISTS guards or multi-member INSERT patterns. The multi-member delegate content is in Step 1 (line 143) and Step 5 (line 338). "Step 5, 6" is therefore partially misleading; "Step 1, 5" would be more accurate.

The origin is 99-RESEARCH.md line 189 which also listed "Step 5, 6." The research's intent appears to have been that Step 6 (migration item 5: Incumbents) is where you write the actual INSERT — but Step 6 in this document is the migration sequence checklist, not where the GOTCHA content lives.

**Fix:** Change line 96 to reference Step 1 and Step 5 (where the inline GOTCHAs actually appear):
```markdown
| Multi-member delegate districts | Step 1, 5 | 47 TIGER SLDL polygons cover 141 delegates; 3 per whole-district polygon; NOT EXISTS guard uses (district_id, politician_id) |
```

## Info

### IN-01: Quick Reference table has 10 rows; 99-RESEARCH.md specified 11 — the "REQUIREMENTS.md cron_active wording" row was intentionally dropped

**File:** `LOCATION-ONBOARDING.md:94-105`
**Issue:** The research file (99-RESEARCH.md lines 187-200) specified an 11-row trap table including a row `| REQUIREMENTS.md cron_active wording | — | MD-ELECTIONS-02 requirement text says "cron_active=true" — stale; this column does not exist |`. The 99-02-PLAN.md acceptance criteria overrode this to "exactly 10 rows," and the implementation followed the plan. The informational content of the dropped row is preserved in the Step 6 GOTCHA (line 393: "Note: REQUIREMENTS.md MD-ELECTIONS-02 text says 'cron_active=true' — this wording is stale"), so no information is lost. This is noted for traceability: if a future agent counts Quick Reference rows against the research file, the 10 vs. 11 discrepancy is intentional.

**Fix:** No action required. The information is present in the Step 6 GOTCHA. Document the decision in the SUMMARY if not already noted (it is: 99-02-SUMMARY.md line 36 records "10 rows matching 99-RESEARCH.md content verbatim" — this understates the discrepancy by saying "verbatim" when one row was deliberately dropped).

### IN-02: Step 1 GOTCHA cites "Phase 92 + Phase 93 confirmed" for two distinct facts that were confirmed by separate phases

**File:** `LOCATION-ONBOARDING.md:143`
**Issue:** The Step 1 GOTCHA ends with "Phase 92 + Phase 93 confirmed." This combines two separate facts: (a) State Treasurer is_appointed_position=true — confirmed by Phase 92 (executive chambers); (b) 141 delegates across 47 districts with NOT EXISTS guard on (district_id, politician_id) — confirmed by Phase 93 (legislators). The citation is technically accurate but could mislead a reader who looks up Phase 92 expecting to find delegate-related confirmation — Phase 92 only covers executive chambers. A clearer citation would be "Phase 92 confirmed Treasurer pattern; Phase 93 confirmed delegate count and NOT EXISTS guard."

**Fix (optional):** Update the citation to be more precise:
```
...which blocks all but the first delegate per district. Phase 92 confirmed Treasurer is_appointed_position=true; Phase 93 confirmed 141 delegates and NOT EXISTS guard pattern.
```
This is low priority — the existing text is not incorrect, just imprecise.

---

_Reviewed: 2026-06-07_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
