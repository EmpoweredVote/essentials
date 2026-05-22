---
status: diagnosed
trigger: "Cambridge MA city councillors not appearing when user searches by Cambridge address"
created: 2026-05-18T00:00:00Z
updated: 2026-05-18T00:00:01Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED — Cambridge offices have district_id = NULL, breaking both the address-search and address-search JOIN paths
test: Traced full query chain; confirmed no district_id in migrations 157/158/159; LA City Attorney precedent (migration 115) confirms identical root cause
expecting: Fix requires a new migration to insert a Cambridge LOCAL district row and set district_id on all Cambridge offices
next_action: DONE — returning ROOT CAUSE FOUND

## Symptoms

expected: Cambridge city councillors appear when user searches by Cambridge MA address
actual: No local rep data appears for Cambridge; state + federal officials still show
errors: None reported (silent drop)
reproduction: Enter a Cambridge MA address in the Empowered Vote app
started: Unknown - Phase 41 councillors were seeded in migration 159

## Eliminated

- hypothesis: Cambridge politicians have is_active=false or is_vacant=true
  evidence: Migration 159 explicitly sets is_active=true, is_vacant=false for all 16 politicians
  timestamp: 2026-05-18

- hypothesis: getPoliticiansByGovernmentList filters out Cambridge due to p.is_vacant=false
  evidence: All Cambridge politicians are is_vacant=false per migration 159; this filter is correct and not the cause
  timestamp: 2026-05-18

## Evidence

- timestamp: 2026-05-18
  checked: migrations 157, 158, 159 — all Cambridge office and government creation
  found: district_id column is NEVER referenced in any of the three Cambridge migrations. All 17 offices are inserted without district_id.
  implication: Cambridge offices have district_id = NULL in production

- timestamp: 2026-05-18
  checked: essentialsService.ts getRepresentativesByAddress query (address-search path)
  found: JOIN chain is geofence_boundaries → districts → offices (via o.district_id = d.id INNER JOIN). When district_id is NULL, offices never join and politicians are never returned.
  implication: Address search returns zero Cambridge officials

- timestamp: 2026-05-18
  checked: essentialsBrowseService.ts getPoliticiansByGovernmentList (browse/Landing page path)
  found: Query is governments → chambers → offices → politicians (INNER JOIN p ON p.id = o.politician_id). Does NOT require district_id at all. Cambridge officials DO appear via this path.
  implication: The "Cambridge" shortcut on the Landing page (browseGovernmentList) WORKS; address-based search does NOT.

- timestamp: 2026-05-18
  checked: migration 115_la_city_attorney_controller_district.sql — identical prior bug fix
  found: LA City Attorney and City Controller also had district_id=NULL and were invisible in address search. Migration 115 fixed this by linking offices to the LA LOCAL_EXEC district row.
  implication: The fix pattern is established: insert a Cambridge LOCAL district row, then UPDATE offices SET district_id = <new_district_id>

- timestamp: 2026-05-18
  checked: essentials.districts schema usage across other city migrations
  found: Districts table rows have geo_id, district_type ('LOCAL' or 'LOCAL_EXEC'), mtfcc ('G4110' for incorporated places), label, state. The geofence_boundaries JOIN in getRepresentativesByAddress matches on d.geo_id = gb.geo_id AND (gb.mtfcc='G4110' AND d.district_type IN ('LOCAL','LOCAL_EXEC')).
  implication: Cambridge needs a district row with geo_id='2511000', district_type='LOCAL', mtfcc='G4110', state='MA'

## Resolution

root_cause: |
  Cambridge offices (all 17 rows created in migration 158) have district_id = NULL.
  The address-search query in getRepresentativesByAddress uses an INNER JOIN from
  geofence_boundaries -> districts -> offices (ON o.district_id = d.id). With
  district_id NULL on every Cambridge office, the join produces zero rows and no
  Cambridge officials are returned for any address search.

  The browse path (Landing page Cambridge shortcut, browseGovernmentList=['2511000'])
  is NOT affected — that query joins governments -> chambers -> offices directly
  and does not require district_id, which is why Cambridge appears in browse mode
  but not address-search mode.

fix: |
  New migration (160):
  1. INSERT a district row: geo_id='2511000', district_type='LOCAL', mtfcc='G4110',
     state='MA', label='Cambridge', district_id='0' (at-large)
  2. UPDATE essentials.offices SET district_id = <new_district_uuid>
     WHERE chamber_id IN (SELECT id FROM essentials.chambers WHERE government_id = <cambridge_gov_id>)

verification:
files_changed:
  - C:/EV-Accounts/backend/migrations/160_cambridge_district_link.sql
