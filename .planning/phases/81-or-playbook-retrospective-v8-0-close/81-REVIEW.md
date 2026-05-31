---
phase: 81-or-playbook-retrospective-v8-0-close
reviewed: 2026-05-31T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - LOCATION-ONBOARDING.md
findings:
  critical: 2
  warning: 2
  info: 1
  total: 5
status: issues_found
---

# Phase 81: Code Review Report

**Reviewed:** 2026-05-31
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

`LOCATION-ONBOARDING.md` was reviewed for structural integrity, content accuracy, internal consistency of OR-specific additions, and format consistency against the existing CA Quick Reference pattern. The OR additions are largely well-structured and follow the established playbook format. Four defects were found: one incorrect field name in a GOTCHA body (contradicted by the same document's pitfall table and the research source), one year label typo in the Step 7 pitfall table, one duplicate label in the Cities Onboarded table, and one missing pitfall row for a documented OR GOTCHA.

---

## Critical Issues

### CR-01: Step 4 GOTCHA body says "notes field" — should be `photo_origin_url`

**File:** `LOCATION-ONBOARDING.md:267`
**Issue:** The OR WAF GOTCHA body instructs: "Record the canonical `/public/` path in a **notes field** for audit trail." The column `photo_origin_url` does not exist in `politician_images` under the name "notes field." The Step 7 pitfall table at line 400 correctly names the field as `photo_origin_url`, and the RESEARCH.md source (GOTCHA OR-3) also specifies `photo_origin_url`. An agent following the GOTCHA body would write `notes = '...'` instead of `photo_origin_url = '...'`, producing a migration that sets the wrong column or fails with a column-not-found error.

**Fix:** Change "a notes field" to `photo_origin_url` in the GOTCHA body:

```markdown
Record the canonical `/public/` path in `photo_origin_url` for audit trail.
```

---

### CR-02: Step 7 pitfall table says "2025 charter reform" — should be "2024 charter reform"

**File:** `LOCATION-ONBOARDING.md:403`
**Issue:** The pitfall table row reads: "Staggered terms: D3+D4+Auditor on 2026 ballot; Mayor+D1+D2 on 2028 ballot **(4-year terms from 2025 charter reform)**". Every other reference to this event throughout the document correctly identifies it as the **2024 charter reform** (lines 105, 149, 232, 267, 399). The reform was Portland's November 2024 vote, effective January 2025. "2025 charter reform" is factually wrong and contradicts the rest of the document. An agent reading only the pitfall table before writing election migration notes would record an incorrect year.

**Fix:** Change "2025 charter reform" to "2024 charter reform":

```markdown
| Portland 2026 races include all 12 council seats | Staggered terms: D3+D4+Auditor on 2026 ballot; Mayor+D1+D2 on 2028 ballot (4-year terms from 2024 charter reform) |
```

---

## Warnings

### WR-01: OR external_id table row has duplicate "House" label — US House vs. State House are indistinguishable

**File:** `LOCATION-ONBOARDING.md:46`
**Issue:** The Oregon (state) row in the Cities Onboarded table contains: `external_ids: exec -4100001..-4100005, US Senators -4101001/-4101002, House -4102001..-4102006, State Senate -4110001..-4110030, House -4120001..-4120060`. The word "House" appears twice with no disambiguation. The first range (`-4102001..-4102006`) covers OR's 6 US House representatives; the second (`-4120001..-4120060`) covers 60 OR State House representatives. A reader or agent scanning this row cannot determine which "House" range belongs to federal seats and which belongs to state seats without cross-referencing other sources.

**Fix:** Label the ranges explicitly:

```markdown
external_ids: exec -4100001..-4100005, US Senators -4101001/-4101002, US House -4102001..-4102006, State Senate -4110001..-4110030, State House -4120001..-4120060
```

---

### WR-02: GOTCHA OR-6 (OR senators pre-existing under wrong external_ids) is missing a Step 7 pitfall table row

**File:** `LOCATION-ONBOARDING.md:370-404`
**Issue:** GOTCHA OR-6 (Step 5 inline GOTCHA at line 292) documents that OR senators Wyden and Merkley pre-existed under non-canonical external_ids requiring UPDATE rather than INSERT. The RESEARCH.md explicitly specifies a pitfall table entry for this GOTCHA: `| OR senators pre-existed under non-canonical external_ids | Pre-flight query: SELECT external_id, full_name WHERE full_name IN (senators); if pre-exist with offices, UPDATE external_id — do not INSERT |`. This row was not added to the Step 7 pitfall table during Phase 81 execution. The OR Quick Reference at line 82 does reference this trap, but the Step 7 pitfall table (which agents are instructed to review "before every migration") lacks it — making the coverage inconsistent between the Quick Reference and the pitfall checklist.

**Fix:** Add to the Step 7 pitfall table after the existing OR rows:

```markdown
| OR federal senators pre-exist under non-canonical external_ids | Pre-flight SELECT by senator full_name before INSERT; if they pre-exist with correct offices, UPDATE external_id to canonical scheme — do not INSERT new rows |
```

---

## Info

### IN-01: Step 7 pitfall table header says "How to Catch It" but OR-specific rows describe remediation, not detection

**File:** `LOCATION-ONBOARDING.md:374-403`
**Issue:** The Step 7 pitfall table has columns `| Pitfall | How to Catch It |`. The existing pre-OR rows consistently answer "how to catch it" (e.g., "Verify: does the Mayor appear on the ballot as a standalone race?"). Several new OR-specific rows in the right column describe the fix rather than the detection method (e.g., line 398: "Source from PortlandMaps ArcGIS MapServer Layer 17 per-OBJECTID; always add outSR=4326 and ST_MakeValid" is a remediation step, not a detection query). This is a minor inconsistency with existing column semantics and does not impede usability, but the column header may mislead agents about what the right column is for.

**Fix:** Either rename the column header to "How to Catch It / Fix" to acknowledge the dual-purpose usage that emerged during OR additions, or restructure OR rows to lead with a detection check. The column rename is lower effort and accurately describes current content.

---

_Reviewed: 2026-05-31_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
