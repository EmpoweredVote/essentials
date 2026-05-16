---
phase: 37
verified: 2026-05-16T00:00:00Z
status: passed
score: 3/3
---

## Summary

All three must-haves verified against the actual codebase. LOCATION-ONBOARDING.md exists at project root with a complete 8-step cold-start checklist (287 lines). Five phase templates exist in .planning/templates/. All four Cambridge-specific decisions (Mayor is appointed, odd-year elections, STV election method, "Councillor" double-l spelling) appear explicitly in both the checklist and the templates. Phase goal achieved.

## Must-Haves Checked

### 1. LOCATION-ONBOARDING.md at project root with complete cold-start checklist
- Status: passed
- Evidence: File exists at C:/Transparent Motivations/essentials/LOCATION-ONBOARDING.md, 287 lines. All 8 required steps present and substantive: Step 1 (government structure / officials), Step 2 (election system), Step 3 (geofences), Step 4 (data sources), Step 5 (schema decisions), Step 6 (migration order covering government DB, officials seed, elections, headshots, and discovery), Step 7 (pitfall table), Step 8 (template links). Each step has a required-questions checklist, a decisions table to record, source guidance, and Cambridge example annotation. Public sources only throughout (no paid data services referenced).

### 2. Phase templates in .planning/templates/ for DB foundation, officials seed, headshots, discovery setup, and compass stances
- Status: passed
- Evidence: All five files exist and are substantive:
  - .planning/templates/db-foundation.md (112 lines) — government row + chambers + offices SQL template, pre-migration checklist, verification queries, Cambridge example
  - .planning/templates/officials-seed.md (100 lines) — politician INSERT pattern, dual-office pattern with SQL, verification queries, Cambridge example
  - .planning/templates/headshots.md (96 lines) — 600x750 Lanczos crop+resize spec, source priority, upload pattern, verification queries
  - .planning/templates/discovery-setup.md (88 lines) — discovery_jurisdictions INSERT, inactive-by-default rule, activation protocol, Cambridge example
  - .planning/templates/compass-stances.md (114 lines) — one-at-a-time rate limit rule, citation requirement, apply script pattern with parseInt(r.value) note, Cambridge example

### 3. Both artifacts reference Cambridge-specific decisions as example annotations
- Status: passed
- Evidence (all four required Cambridge decisions found in LOCATION-ONBOARDING.md):
  - Mayor is appointed: Step 1 line 42 ("Mayor is_appointed_position: true on the Mayor office row") and Step 5 ("Mayor modeling: is_appointed_position = true; district_type = LOCAL")
  - Odd-year elections: Step 2 ("Massachusetts law requires municipal elections in odd-numbered years — there is NO Cambridge city election in 2026")
  - STV election method: Step 2 ("stv_proportional (Single Transferable Vote — Cambridge has used STV since 1941, the longest-running STV jurisdiction in the US)")
  - Councillor double-l spelling: Step 5 ('"Councillor" (double-l — Cambridge official spelling; do not auto-normalize to "Councilor")')
  - All four decisions also appear in the relevant templates (db-foundation.md, officials-seed.md, headshots.md, discovery-setup.md, compass-stances.md), framed as "Cambridge examples, not defaults"

## Gaps

None.

## Human Verification Items

None. All three must-haves are fully verifiable from static file content.
