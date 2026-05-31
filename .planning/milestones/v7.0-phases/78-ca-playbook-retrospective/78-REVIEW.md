---
phase: 78-ca-playbook-retrospective
reviewed: 2026-05-29T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - LOCATION-ONBOARDING.md
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
status: issues_found
---

# Phase 78: Code Review Report

**Reviewed:** 2026-05-29
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

Reviewed `LOCATION-ONBOARDING.md` as updated in Phase 78 to add California-specific GOTCHAs, a California Quick Reference section, and 7 new rows in the Cities Onboarded table. The document's overall structure is sound and the CA GOTCHAs are comprehensive. Four substantive issues were found: one critical guidance error in the San Diego entry that will cause silent data corruption, three warnings around imprecise cross-references and step citations that will mislead future agents, and three informational items.

---

## Critical Issues

### CR-01: San Diego "DISTRICT field" guidance is self-contradictory — will cause column selection error

**File:** `LOCATION-ONBOARDING.md:42`

**Issue:** The San Diego row in the Cities Onboarded table reads:

> `DISTRICT field holds council member name (changes elections) — use integer DISTRICT field for district number`

Both the "holds council member name" and "use this for district number" clauses name the same field (`DISTRICT`). A future agent reading this will not know which field to use for the district number — the sentence implies there are two different `DISTRICT` fields, which is impossible. In practice (per `project_sd_deep_seed.md` memory), the San Diego ArcGIS API exposes a string `DISTRICT` field that holds the council member's name and changes as elections change incumbents, and a separate integer field for the actual district number. That integer field name is not recorded here.

This is a direct data-corruption risk: an agent who uses the string `DISTRICT` field (containing a name) as the district number will insert non-integer or wrong values, producing silent geofence mismatches. The ArcGIS `outSR=4326` pattern already notes the "silent failure" mode; this issue is in the same category.

**Fix:** Record the actual integer field name for San Diego district numbers. Based on the ArcGIS pattern for other CA cities (Sacramento uses `DISTNUM`, San Jose uses `DISTRICTINT`), the SD integer field name needs to be verified from the SD ArcGIS endpoint and recorded explicitly:

```markdown
| San Diego | CA | 2026-05-22 | plurality | ArcGIS outSR=4326 required (WKID 2230 native); string DISTRICT field holds council member name — use the integer district number field instead (verify field name from ArcGIS schema: Sacramento=DISTNUM, SJ=DISTRICTINT, SD=[verify]); sandiego.gov headshots (public_domain); D4 Foster headshot has anomalous CMS filename; ext_ids -650001..-650018 |
```

If the actual field name is confirmed (e.g., from `project_sd_deep_seed.md` or Phase 65 SUMMARY), substitute it directly.

---

## Warnings

### WR-01: Quick Reference "districts.state casing" cites Step 6 — no Step 6 content covers this trap

**File:** `LOCATION-ONBOARDING.md:56`

**Issue:** The California Quick Reference table at line 56 lists:

> `| districts.state casing | Step 3, Step 6 | ...`

Step 3 does contain the inline CA annotation for this (end of the existing `districts.state` GOTCHA at line 199). However, Step 6 contains no GOTCHA, annotation, or reminder about `districts.state='CA'` casing. A future agent following the "Step 6" pointer to find this guidance will not locate it. The Step 6 reference was specified in RESEARCH.md (GOTCHA CA-2 placement map: "Step 3 after TIGER GOTCHA on districts.state + Step 6 inline callout") but the Step 6 inline callout was not written.

This is a broken cross-reference that sends agents hunting for guidance that does not exist at the cited location.

**Fix:** Either (a) add a Step 6 `[REMINDER]` for CA casing, or (b) remove "Step 6" from the Quick Reference `See Step` column:

Option (a) — add to Step 6, item 3 (Chambers):
```markdown
   → [REMINDER] **[STATE-SPECIFIC: CA]** CA legislature district rows use `state='CA'` (uppercase) — JOIN clauses must match. See Step 3 GOTCHA.
```

Option (b) — simpler, update Quick Reference row:
```markdown
| districts.state casing | Step 3 | Pre-existing CA districts use state='CA' (uppercase); lowercase 'ca' returns 0 rows |
```

---

### WR-02: Step 5 external_id GOTCHA documents race-challenger range (-6003xxx) absent from Quick Reference and Step 7 pitfall table

**File:** `LOCATION-ONBOARDING.md:263`

**Issue:** The Step 5 CA external_id GOTCHA (line 263) documents the full CA external_id scheme including "CA Governor race challengers (-6003001 through -6003013)" — a range that is NOT listed in the Quick Reference table (line 58) and NOT in the Step 7 pitfall table (line 366). The Quick Reference entry says "-1000xx range occupied by CA Assembly; CA House reps use -60003xx; always pre-check range" — which is only a partial picture of the occupied ranges.

An agent pre-checking external_id ranges for future CA elections or governors' race challengers will use the Quick Reference and miss the -6003xxx occupation, triggering a duplicate key error that was supposed to be prevented.

**Fix:** Expand the Step 7 pitfall "CA external_id range -1000xx occupied" entry and the Quick Reference "One-Line Summary" to name the pre-flight query as the canonical protection, rather than listing individual ranges:

Step 7 pitfall table fix:
```markdown
| CA external_id range collision | Before assigning any CA external_id, run `SELECT external_id FROM essentials.politicians WHERE external_id BETWEEN -N AND -M`; known occupied ranges include -1000xx (Assembly), -60030xx (House reps), -60031xx (challengers); always query — do not rely on range list |
```

Quick Reference fix:
```markdown
| External ID range collision | Step 5 | Multiple CA ranges occupied; always run pre-flight query before assigning any CA external_id |
```

---

### WR-03: SF ext_ids range uses mixed dash encoding — en-dash in range separator will render incorrectly in some contexts

**File:** `LOCATION-ONBOARDING.md:40`

**Issue:** The San Francisco row reads:

> `ext_ids -630001..–630028`

The separator between the range endpoints is `..–` — two ASCII dots followed by an en-dash (U+2013). Every other range in this document uses either `..` (double dot) or `–` (en-dash) consistently, not both. This appears to be a copy/paste artifact: `..` (the double-dot range notation from RESEARCH.md) was concatenated with `–630028` where the en-dash was part of the negative number formatting. The result is an ambiguous notation that could be read as three separate tokens.

**Fix:**
```markdown
ext_ids -630001..–630028
```
should be:
```markdown
ext_ids -630001..-630028
```
(consistent double-dot notation with ASCII hyphens for negative numbers, matching the Sacramento row's `ext_ids -660001, -660010..-660017` style)

---

### WR-04: ArcGIS GOTCHA (line 205) lists "LA" as an ArcGIS city — LA is not in the Cities Onboarded table and has no city-level deep seed

**File:** `LOCATION-ONBOARDING.md:205`

**Issue:** The DataSF vs ArcGIS GOTCHA at line 205 reads:

> `ArcGIS MapServer (LA, Sacramento, San Diego, Fremont, San Jose): returns CA State Plane feet by default`

The California Quick Reference at line 59 similarly lists `LA/Sacramento/SD/Fremont/SJ` as ArcGIS users. However, the Cities Onboarded table contains no "Los Angeles" row — LA is referenced only in the lavote.gov GOTCHA as a discovery pipeline city. An agent starting a LA city onboarding will see "LA" listed as an ArcGIS MapServer city but find no LA row in the Cities Onboarded table to understand what was actually seeded and what patterns were used.

Additionally, the ArcGIS GOTCHA at line 205 cites "Phases 63/64/65/66/67/68 confirmed per city" but Phase 64 is not a city listed in the Cities Onboarded table (city sequence is: 63=SF, 65=SD, 66=Sacramento, 67=Fremont, 68=Berkeley). Phase 64 appears to be LAUSD geofences, not a city ArcGIS endpoint. The phase attribution is misleading.

**Fix:** Qualify the LA reference to make clear LA's ArcGIS pattern is inferred, not confirmed from a deep seed, and correct the phase citation:

```markdown
ArcGIS MapServer (Sacramento, San Diego, Fremont, San Jose; LA County GeoHub also uses ArcGIS — anticipated but not confirmed via city deep seed): ...
```

Phase citation fix: replace "Phases 63/64/65/66/67/68" with "Phases 63/65/66/67/68" (removing Phase 64 which is LAUSD geofences, not a city ArcGIS endpoint).

---

## Info

### IN-01: AEM/CQ5 GOTCHA (line 238) curl pattern omits quotes around the URL argument

**File:** `LOCATION-ONBOARDING.md:238`

**Issue:** The curl command in the AEM/CQ5 GOTCHA reads:

> `curl -s <url> | grep -o 'background-image:url([^)]+)'`

The `<url>` placeholder uses angle-bracket notation with no quotes. If a future agent substitutes a URL containing query parameters or special characters, the unquoted form will cause shell word-splitting errors. The RESEARCH.md example (line 534) correctly shows the URL double-quoted: `curl -s "https://www.cityofsacramento.gov/mayor-council/mayor"`.

**Fix:**
```markdown
`curl -s "<url>" | grep -o 'background-image:url([^)]+)'`
```

---

### IN-02: "RCV at seed time" Quick Reference entry cites "Step 2, Step 6" but the Step 6 reference is a generic reminder, not a CA GOTCHA

**File:** `LOCATION-ONBOARDING.md:63`

**Issue:** The Quick Reference entry for "RCV at seed time" cites "Step 2, Step 6." The Step 2 content is correct — the CA annotation is embedded inline in the existing RCV GOTCHA at line 124. However, the Step 6 reference points only to a generic `[REMINDER]` at line 293 ("If any chamber uses RCV/IRV: set `election_method='rcv'` on this chamber row") that has no CA-specific tag or context. A reader following the Step 6 pointer will not find a CA-tagged item, which reduces the value of the cross-reference.

This is a minor usability issue, not a correctness bug — the guidance itself is present in Step 2.

**Fix:** Either tag the Step 6 reminder as `[STATE-SPECIFIC: CA]` like the others, or remove "Step 6" from the Quick Reference citation and keep only "Step 2."

---

### IN-03: Step 7 pitfall table SRID reference (line 364) oversimplifies — CA uses multiple State Plane zones with different SRIDs

**File:** `LOCATION-ONBOARDING.md:364`

**Issue:** The Step 7 pitfall table row reads:

> `ArcGIS outSR=4326 omitted for CA city boundaries | CA State Plane feet (SRID 2229) looks valid to PostGIS but ST_Covers returns 0 rows for all addresses`

SRID 2229 is California State Plane Zone V (LA/San Bernardino area). San Diego uses WKID 2230 (Zone VI), and Fremont uses WKID 102643 (Zone III, a different CRS entirely). Listing only SRID 2229 in the pitfall row implies all CA ArcGIS endpoints use the same projection, which is false. An agent who encounters SRID 2230 or 102643 without seeing them in the pitfall table may not recognize the same root cause.

**Fix:** Broaden the pitfall description to acknowledge multiple zones:

```markdown
| ArcGIS outSR=4326 omitted for CA city boundaries | CA ArcGIS endpoints use CA State Plane feet (SRID varies by region: 2229 for LA, 2230 for SD, 102643 for Fremont/Bay Area) — all look valid to PostGIS but ST_Covers returns 0 rows; always add outSR=4326 |
```

---

_Reviewed: 2026-05-29_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
