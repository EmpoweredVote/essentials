---
phase: 116-ma-playbook-retrospective
reviewed: 2026-06-14T00:00:00Z
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

# Phase 116: Code Review Report

**Reviewed:** 2026-06-14
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

Reviewed `LOCATION-ONBOARDING.md` for the Massachusetts Quick Reference block, two Cities Onboarded rows (Massachusetts state + Boston), and five [STATE-SPECIFIC: MA] GOTCHA callouts added in Phase 116 (commits 67c0445 and b6c8591).

The MA-specific GOTCHA content is accurate and follows the established pattern. The Boston School Committee appointed model, hybrid council structure, G4040 COUSUB dual-layer requirement, and ArcGIS X0013 geofence pattern are all correctly documented with production-verified facts.

One critical factual error was introduced: the MA 2026 state primary date is recorded as 2026-09-02 (a Wednesday) — an impossible election date under Massachusetts statute. The correct date is 2026-09-08. Two structural/labeling warnings and two low-severity documentation gaps round out the findings.

One pre-existing issue from Phase 99 (MD trap table row, not Phase 116 scope) is noted at the end for visibility but excluded from the findings counters.

---

## Critical Issues

### CR-01: MA 2026 State Primary Date Is Wrong — September 2 Is a Wednesday

**File:** `LOCATION-ONBOARDING.md:50,151`

**Issue:** The MA 2026 state primary is recorded as `2026-09-02` in two places — the Cities Onboarded table (line 50) and the Massachusetts Key Facts section (line 151). September 2, 2026 is a **Wednesday**, which cannot be a Massachusetts election day. Massachusetts statute (M.G.L. c. 53 §68) sets the state primary as the first Tuesday after the first Monday in September (i.e., the day after Labor Day). Labor Day 2026 is September 7; therefore the 2026 MA state primary is **September 8, 2026**.

This date would be used by a developer seeding election rows or discovery_jurisdictions records for MA legislators. Seeding with 2026-09-02 would produce a wrong election date in the production database.

**Fix:**
```
# Line 50 — Cities Onboarded table, Massachusetts (state) row:
# Change: primary 2026-09-02
# To:     primary 2026-09-08

# Line 151 — Massachusetts Key Facts:
# Change: - Primary 2026: 2026-09-02
# To:     - Primary 2026: 2026-09-08
```

**Verification:** `python3 -c "import datetime; d=datetime.date(2026,9,7); print(d + datetime.timedelta(days=1))"` → `2026-09-08` (Tuesday after Labor Day).

---

## Warnings

### WR-01: Boston External ID Range Labeled "(council)" But Includes Mayor Wu

**File:** `LOCATION-ONBOARDING.md:51,153`

**Issue:** The external ID range `-2507000001..-2507000014` is labeled `(council)` in both the Cities Onboarded table (line 51) and the Massachusetts Key Facts section (line 153). Phase 108-01 SUMMARY confirms these 14 IDs cover **Mayor Wu + 4 at-large councillors + 9 district councillors** — the Mayor is ID -2507000001. Since Mayor Wu is a separately-elected executive (LOCAL_EXEC), not a council member, the label "(council)" misrepresents the range. A developer copying this range for a future MA city that has only councillors (no mayor in the same range) would be confused, or might incorrectly assume the Mayor uses a separate ID range outside this one.

**Fix:**
```
# Line 51 — Cities Onboarded table:
# Change: ext_ids -2507000001..-2507000014 (council)
# To:     ext_ids -2507000001..-2507000014 (Mayor + council)

# Line 153 — Massachusetts Key Facts:
# Change: External ID scheme: Boston council -2507000001..-2507000014, Boston SC -2502790001..-2502790007
# To:     External ID scheme: Boston Mayor+council -2507000001..-2507000014, Boston SC -2502790001..-2502790007
```

### WR-02: Massachusetts Quick Reference Lead Sentence Missing Bold Formatting

**File:** `LOCATION-ONBOARDING.md:128`

**Issue:** The MA Quick Reference section lead sentence reads:

```
Read this before starting any MA city or state work. These traps are MA-specific — general playbook guidance above does not warn for them.
```

All three prior state Quick Reference sections (CA line 57, OR line 77, MD line 94) wrap this sentence in `**bold**`:

```
**Read this before starting any CA city.** These traps are CA-specific ...
**Read this before starting any OR city or state work.** These traps are OR-specific ...
**Read this before starting any MD city or state work.** These traps are MD-specific ...
```

The MA version breaks the established pattern. A developer skimming the file may not notice the warning when the visual weight is inconsistent with the other Quick Reference blocks.

**Fix:**
```markdown
**Read this before starting any MA city or state work.** These traps are MA-specific — general playbook guidance above does not warn for them.
```

---

## Info

### IN-01: Boston ArcGIS FeatureServer URL Is an Incomplete Placeholder

**File:** `LOCATION-ONBOARDING.md:316`

**Issue:** The [STATE-SPECIFIC: MA] Boston council district GOTCHA in Step 3 gives the ArcGIS FeatureServer endpoint as:

```
https://bostonopendata-boston.opendata.arcgis.com/datasets/...
```

The `...` is a placeholder — the full dataset path and layer ID are omitted. By contrast, the analogous Portland OR GOTCHA (line 308) provides the complete endpoint: `https://www.portlandmaps.com/arcgis/rest/services/Public/Basemap_2011_New/MapServer/17`. A developer following the Boston GOTCHA would need to independently discover the correct FeatureServer URL from the Boston Open Data portal, which is extra work and a discovery risk (multiple Boston datasets exist on that domain).

**Fix:** Replace the placeholder with the actual FeatureServer URL used in the Phase 108-01 loader. The load script (`C:/EV-Accounts/backend/scripts/load-boston-council-boundaries.ts`) contains the canonical endpoint. Update the GOTCHA with the full URL once confirmed from the script.

### IN-02: "Zero-Row Assert Gate" Terminology Is Undefined and Potentially Misleading

**File:** `LOCATION-ONBOARDING.md:133,141`

**Issue:** The MA Quick Reference trap table (line 133) and Key Facts section (line 141) both reference a "zero-row assert gate" for verifying the G4110 and G4040 layers. The term is not defined anywhere in the playbook and does not appear in any templates. More importantly, the actual gate described in the Step 3 COUSUB GOTCHA (line 314) is:

```sql
SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE state='25' AND mtfcc='G4040'
```

which **must return 293** — not zero rows. The phrase "zero-row gate" implies a query that returns no rows on success, which is the opposite of what this gate does. A developer unfamiliar with the internal jargon would be confused about what "success" looks like.

**Fix:** Replace "zero-row assert gate" with "count assert gate" or "SELECT COUNT(*) gate" in lines 133 and 141, to match the terminology used in the Step 3 GOTCHA body. Alternatively, add a parenthetical: "zero-row assert gate (a SELECT COUNT(*) that must return the expected count)".

---

## Pre-Existing Issues (Out of Phase 116 Scope)

The following issues were identified in content predating Phase 116. They are noted here for visibility only and are not counted in the Phase 116 findings totals.

**MD Quick Reference trap table row 98 (from Phase 99-02, commit 06492b6):**
The "Multi-member delegate districts" row says "47 TIGER SLDL polygons cover 141 delegates." The correct count is **71 polygons**, as stated in the Maryland Key Facts section (line 111), the Step 3 Baltimore GOTCHA (line 312), and the Step 1 MD GOTCHA (line 177). The "47" figure is the number of senate districts, not SLDL polygon count. This internal inconsistency within the MD section could mislead a developer asserting the SLDL polygon count.

---

_Reviewed: 2026-06-14_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
