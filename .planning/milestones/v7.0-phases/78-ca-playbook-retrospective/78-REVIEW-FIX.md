---
phase: 78-ca-playbook-retrospective
fixed_at: 2026-05-30T00:00:00Z
review_path: .planning/phases/78-ca-playbook-retrospective/78-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 78: Code Review Fix Report

**Fixed at:** 2026-05-30
**Source review:** .planning/phases/78-ca-playbook-retrospective/78-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5 (1 Critical + 4 Warnings; Info findings excluded per fix_scope=critical_warning)
- Fixed: 5
- Skipped: 0

## Fixed Issues

### CR-01: San Diego "DISTRICT field" guidance is self-contradictory

**Files modified:** `LOCATION-ONBOARDING.md`
**Commit:** 7e08104
**Applied fix:** In the San Diego row of the Cities Onboarded table, changed `DISTRICT field holds council member name (changes elections) — use integer DISTRICT field for district number` to `NAME field holds council member name (changes with elections) — use integer DISTRICT field for district number`. This eliminates the impossible self-reference to two fields with the same name and correctly identifies that the string field holding the council member's name is `NAME`, while `DISTRICT` is the integer district number field to use.

---

### WR-01: Quick Reference "districts.state casing" cites Step 6 — no Step 6 content covers this trap

**Files modified:** `LOCATION-ONBOARDING.md`
**Commit:** f7e3b3c
**Applied fix:** Removed "Step 6" from the Quick Reference `See Step` column for the `districts.state casing` row. Row now reads `| districts.state casing | Step 3 | ...` — the guidance exists only in Step 3, which is where the inline CA annotation actually lives.

---

### WR-02: Step 5 external_id GOTCHA documents race-challenger range absent from Quick Reference and Step 7

**Files modified:** `LOCATION-ONBOARDING.md`
**Commit:** c3989f9
**Applied fix:** Two changes:
1. Quick Reference row updated from `-1000xx range occupied by CA Assembly; CA House reps use -60003xx; always pre-check range` to `Multiple CA ranges occupied; always run pre-flight query before assigning any CA external_id`.
2. Step 7 pitfall row updated from `| CA external_id range -1000xx occupied | CA Assembly pre-existing seed occupied -1000xx; CA House reps use -60003xx scheme |` to the pre-flight query approach naming the query pattern and listing known occupied ranges (-1000xx Assembly, -60030xx House reps, -60031xx challengers).

---

### WR-03: SF ext_ids range uses mixed dash encoding

**Files modified:** `LOCATION-ONBOARDING.md`
**Commit:** 8908d85
**Applied fix:** Fixed `ext_ids -630001..–630028` (double-dot + en-dash) to `ext_ids -630001..-630028` (consistent double-dot with ASCII hyphen), matching the notation style used in all other city rows.

---

### WR-04: ArcGIS GOTCHA lists "LA" as confirmed ArcGIS city — LA has no city deep seed

**Files modified:** `LOCATION-ONBOARDING.md`
**Commit:** 5e9e2ff
**Applied fix:** Two changes:
1. In the ArcGIS GOTCHA at line 205, replaced `ArcGIS MapServer (LA, Sacramento, San Diego, Fremont, San Jose):` with `ArcGIS MapServer (Sacramento, San Diego, Fremont, San Jose; LA County GeoHub also uses ArcGIS — anticipated but not confirmed via city deep seed):`.
2. Fixed phase citation from `Phases 63/64/65/66/67/68 confirmed per city` to `Phases 63/65/66/67/68 confirmed per city` (removing Phase 64 which is LAUSD geofences, not a city ArcGIS endpoint).
3. Also updated the Quick Reference row to remove `LA/` from `LA/Sacramento/SD/Fremont/SJ` with the same qualification about LA being anticipated but not confirmed.

---

## Skipped Issues

None — all in-scope findings were fixed.

---

_Fixed: 2026-05-30_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
