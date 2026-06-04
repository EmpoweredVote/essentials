---
status: resolved
trigger: "Frisco TX city council section labeled 'Council Place 3' instead of 'Frisco City Council'"
created: 2026-06-03T00:00:00Z
updated: 2026-06-04T00:00:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED — government_bodies table has no TX rows, so government_body_name is '' for all Frisco politicians; groupHierarchy.js getSubGroupLabel falls through all named-body rules to the final fallback (line 271) which normalizes office_title → "Council Place N"
test: Complete — traced full execution path through DB data and groupHierarchy.js
expecting: n/a
next_action: n/a — diagnosis complete

## Symptoms

expected: Representatives tab section labeled "Frisco City Council" (or government/chamber name)
actual: Section labeled "Council Place 3"
errors: none
reproduction: Enter 5515 Ohio Dr, Frisco, TX 75035 — Representatives tab shows "Council Place 3" as section header
started: Discovered during Phase 88 UAT

## Eliminated

- hypothesis: chambers.display_name is wrong for Frisco
  evidence: chambers table has name='City Council', name_formal='Frisco City Council' — both correct
  timestamp: 2026-06-03

- hypothesis: offices have wrong titles
  evidence: office titles are "Council Member Place 1" through "Council Member Place 6" and "Mayor" — correct, these are not the source of the problem; they become the label only because government_body_name is empty
  timestamp: 2026-06-03

## Evidence

- timestamp: 2026-06-03
  checked: essentials.government_bodies — state column distinct values
  found: Only 'CA', 'IN', 'MA', 'US' — NO 'TX' rows exist
  implication: The government_bodies LEFT JOIN in all API queries returns NULL for every Frisco politician; COALESCE(gvb.display_name, '') returns ''

- timestamp: 2026-06-03
  checked: essentials.districts for Frisco geo_id=4827684
  found: state='tx' (lowercase), geo_id='4827684', district_type='LOCAL', mtfcc='G4110'
  implication: Even if TX rows existed in government_bodies, the join uses gvb.state = d.state — would need lowercase 'tx' to match; government_bodies only has uppercase states

- timestamp: 2026-06-03
  checked: getSubGroupLabel in groupHierarchy.js (lines 194-274)
  found: With government_body_name='', body='' is falsy; Rule 1 (body===accordionGovName) false; Rule 2/3 (if body) false; falls to final fallback at line 271 which does rawTitle.replace(council variants → 'Council') on first.office_title
  implication: "Council Member Place N" → "Council Place N" — this is the displayed label

- timestamp: 2026-06-03
  checked: essentials.chambers for Frisco
  found: name='City Council', name_formal='Frisco City Council', website_url set correctly
  implication: chamber_name and chamber_name_formal ARE available in politician records; they are not used by getSubGroupLabel in the LOCAL/no-body path

## Resolution

root_cause: The essentials.government_bodies table has no Texas rows. All Frisco politicians receive government_body_name='' from the API (the LEFT JOIN produces NULL, COALESCE returns ''). In groupHierarchy.js getSubGroupLabel(), the empty body string causes Rules 1, 2, and 3 to be skipped, and the final fallback (line 271) normalizes office_title "Council Member Place N" to "Council Place N" instead of using the chamber name.

fix: (not applied — find_root_cause_only mode)
verification: (not applied)
files_changed: []
