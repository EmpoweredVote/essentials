---
phase: 125-ma-tier-3-playbook-retrospective
reviewed: 2026-06-15T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - LOCATION-ONBOARDING.md
findings:
  critical: 2
  warning: 3
  info: 2
  total: 7
status: issues_found
---

# Phase 125: Code Review Report

**Reviewed:** 2026-06-15
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

LOCATION-ONBOARDING.md was updated in Phase 125 with 7 new Cities Onboarded rows (lines 52–58), 4 new MA Quick Reference trap table rows (lines 145–148), 7 new MA Key Facts bullets (lines 165–171), and 6 new STATE-SPECIFIC: MA GOTCHA callouts (lines 200, 202, 376, 378, 380, 411). The geo_id values were DB-verified and are correct. The GOTCHA callout prefix format is consistent across all 11 MA-specific GOTCHAs. The main issues are two accuracy defects in the Cities Onboarded table: Newton's CMS is mislabeled, and Somerville's SC membership count is ambiguous given the two-ex-officio pattern. Three additional quality issues are present.

## Critical Issues

### CR-01: Newton labeled as "CivicEngage/Revize CMS" — Newton uses only CivicEngage; Revize is Fall River's CMS

**File:** `LOCATION-ONBOARDING.md:52`
**Issue:** The Newton Cities Onboarded row reads `newtonma.gov = CivicEngage/Revize CMS`. Newton uses CivicEngage exclusively. Revize is the CMS used by Fall River (line 56). The two CMS platforms have different behaviors: CivicEngage returns HTTP 403 regardless of User-Agent; Revize returns HTTP 200 with group-photo-only pages. Conflating them in the Newton row implies Newton might also be running Revize, which is incorrect. A developer onboarding a future city with CivicEngage would see this label, check Fall River for patterns, and find inconsistent behavior explanations. This could also cause future tooling or detection scripts to misclassify Newton's CMS.

The MA Quick Reference trap table (line 148) correctly distinguishes: "Newton (CivicEngage) HTTP 403 even with Chrome UA; Fall River (Revize) HTTP 200 but group-photo-only". The Newton table row must match this.

**Fix:**
```markdown
| Newton | MA | 2026-06-14 | plurality | Mayor + 16 at-large + 8 ward City Councilors (24 council + Mayor = 25 total); 8-ward-elected SC + Mayor ex-officio (SC geo_id=2508610 NCES LEAID); uses American single-L 'City Councilor'; geo_id=2545560; ext_ids -2545560001..-2545560025 (city) + -2508610001..-2508610008 (SC); newtonma.gov = CivicEngage CMS — HTTP 403 even with Chrome UA — 0/33 headshots (100% gap); Phases 117 |
```

---

### CR-02: Somerville SC ext_ids range implies 7 total SC members but SC has 9 (7 elected + 2 ex-officio)

**File:** `LOCATION-ONBOARDING.md:53`
**Issue:** The Somerville row records `ext_ids ... -2510890001..-2510890007 (SC)` — 7 IDs. The same row states "SC: 7 elected ward members + Mayor + Council President ex-officio (TWO ex-officio)". 7+2 = 9 total SC members. Without explanation, a developer reading this row would compute 7 SC ext_ids and assume the SC has 7 members, missing the 2 ex-officio members. This directly contradicts the GOTCHA at line 202 warning that Somerville's two-ex-officio pattern is different from other cities. The table entry gives no indication that the Mayor and Council President use their city council ext_ids rather than SC-specific ext_ids.

The Newton row (line 52) has the same pattern (`+ -2508610001..-2508610008 (SC)` = 8 IDs for 8 elected SC members + Mayor ex-officio) but Newton only has one ex-officio, so the ID count matches the elected count and is less confusing.

**Fix:** Annotate the SC ext_ids range with a clarification that ex-officio members use their city council ext_ids:
```markdown
ext_ids -2562535001..-2562535012 (city) + -2510890001..-2510890007 (SC elected only; Mayor + Council President use their city ext_ids as ex-officio)
```

---

## Warnings

### WR-01: Newton row uses "Phases 117" (plural) — every other row uses singular "Phase NNN"

**File:** `LOCATION-ONBOARDING.md:52`
**Issue:** The Newton row ends with `Phases 117` (plural with a trailing space before the pipe). Every other Cities Onboarded row uses the singular form: "Phase 118", "Phase 119", "Phase 120", "Phase 121". The plural form implies multiple phases are cited, but only one number follows. This is inconsistent with the established table convention and creates noise when grep-searching phase references.
**Fix:** Change `Phases 117` to `Phase 117`.

---

### WR-02: MA Quick Reference "MA councillor spelling is city-specific" references "Step 5" but no GOTCHA exists in Step 5 body for this trap

**File:** `LOCATION-ONBOARDING.md:147`
**Issue:** The MA Quick Reference trap table at line 147 lists "MA councillor spelling is city-specific" with "See Step" = `Step 5`. The established pattern for Quick Reference entries is that the "See Step" column references the step where a corresponding GOTCHA blockquote is embedded. The geo_id trap (line 145) correctly maps to "Step 5" where the GOTCHA exists at line 411. The council structure trap (line 146) maps to "Step 1" where the GOTCHA exists at lines 200. But for the councillor spelling trap (line 147), Step 5 contains no `[STATE-SPECIFIC: MA]` GOTCHA about spelling — it is only covered in the Quick Reference trap row itself. A developer "following the GOTCHA" to Step 5 would find nothing. The "See Step" cross-reference is a dangling pointer.
**Fix:** Either add a Step 5 GOTCHA for councillor spelling, or change the "See Step" column to the step where verification actually occurs. Since spelling verification happens during the Step 5 schema decision "What name does the city officially use for council members?" (line 397), no separate GOTCHA body is strictly required — but the cross-reference should be removed or changed to a note that it is covered in the Step 5 required questions checklist rather than a dedicated GOTCHA.

---

### WR-03: Somerville headshot URL description conflates two distinct sources into one ambiguous string

**File:** `LOCATION-ONBOARDING.md:53`
**Issue:** The Somerville Notable patterns cell records `somervillema.gov S3 + /sites/default/files/-2022.jpg pattern`. This conflates two different CDN/path patterns:
1. S3 somervillema-live bucket (used for Mayor Jake Wilson and at-large councillors like Mbah, Strezo)
2. `/sites/default/files/` path with a `-2022.jpg` year suffix (used for ward councillors McLaughlin, Scott, Ewen-Campen, Clingan, Davis)

Reading `S3 + /sites/default/files/-2022.jpg pattern` as a single string implies there is an S3 path that looks like `/sites/default/files/-2022.jpg` — which is not accurate. A developer sourcing headshots for a new Somerville official would not know which pattern applies to which officials.
**Fix:** Separate the two sources with clearer language:
```
somervillema.gov: S3 (Mayor + some at-large) and /sites/default/files/ (-2022.jpg suffix, ward councillors)
```

---

## Info

### IN-01: Medford external_id discrepancy (ext_ids use -2540115xxx despite geo_id=2539835) documented in table but not flagged as a future cleanup item

**File:** `LOCATION-ONBOARDING.md:57`
**Issue:** The Medford row correctly documents "external_id prefix -2540115xxx was seeded from wrong estimate" and the GOTCHA at line 411 explains this perpetual discrepancy. However, neither location records whether a future migration is needed or explicitly marks this as "no cleanup planned." Without that annotation, future developers may not know whether the discrepancy is intentional-permanent or pending repair. This is an informational gap, not a correctness error — the discrepancy exists in the DB, not the playbook.
**Fix:** Add a parenthetical to the Medford row: `(ext_ids use wrong prefix — see Step 5 GOTCHA; no cleanup migration planned)`.

---

### IN-02: New Bedford row uses present-tense "no headshots" but should reference the best-effort migration

**File:** `LOCATION-ONBOARDING.md:55`
**Issue:** The New Bedford row reads "no headshots (headshot migration 588 applied best-effort)". The parenthetical is slightly self-contradictory: "no headshots" followed by "headshot migration 588 applied" implies a migration was applied but produced zero results. The actual situation is that migration 588 was applied as a gap-documentation record (similar to Newton's migration 580). The description is functionally accurate but the pattern used by other gap cities (Fall River: `0/10 headshots`, Waltham: `0/16 headshots`) is more informative. The New Bedford entry does not state the actual headshot count.
**Fix:** Align with the pattern of other gap cities: `no headshots seeded (0/12 — headshot migration 588 applied as gap-documentation)`.

---

_Reviewed: 2026-06-15_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
