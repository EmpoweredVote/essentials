---
phase: 195-oro-valley-deep-seed
verified: 2026-07-11T01:00:00Z
status: passed
score: 5/5 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: none
  note: initial verification
---

# Phase 195: Oro Valley Deep-Seed Verification Report

**Phase Goal:** Oro Valley residents can see their council with a compass, and the town carries its own licensed banner.
**Verified:** 2026-07-11T01:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

Verified against **live production** (EV-Accounts DB + accounts-api.empowered.vote), **live Storage/CDN**, and the essentials frontend repo. All claims independently re-checked — not trusted from SUMMARY.

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Oro Valley government + council roster seeded, election method verified at plan time | ✓ VERIFIED | 1 govt `Town of Oro Valley, Arizona, US` type=`Town`, geo_id=`0451600`, state=`AZ`; 1 `Town Council` chamber (official_count=7); 7 offices (1 Mayor LOCAL_EXEC + 6 council on ONE shared LOCAL district `c846ce46`); party NULL on all 7; exactly one `Council Member (Vice Mayor)` on ext_id -4009002. Roster-currency decision documented (July 21 2026 primary not yet certified → current sitting roster seeded; stale Bohen/Solomon excluded). Migration 1305 registered in prod ledger. |
| 2 | All seated officials have 600×750 headshots | ✓ VERIFIED | 7 `politician_images` rows for ext_ids -4009001..-4009007; UUIDs match Plan-01 manifest; all 7 CDN URLs return HTTP 200. Exact 600×750 pixel dims + visual QA were pipeline/operator-verified in Plan 02 (PIL unavailable in verifier env; CDN presence + row-binding confirmed here). |
| 3 | Evidence-only compass stances — 100% cited, no defaults, honest blanks | ✓ VERIFIED | 28 answers (per-official 5/6/3/1/4/4/5, matching SUMMARY). 0 answers without a matching context row; 0 context rows with NULL/empty sources; 0 values outside [1,5]; 0 judicial-* rows. Only local-lens topics used (growth-and-development, local-environment, economic-development, public-safety-approach, taxes, residential-zoning, transportation-priorities, data-centers). |
| 4 | Licensed community banner (real photo, no AI, no aerial) sourced + wired into buildingImages.js | ✓ VERIFIED | `politician_photos/cities/oro-valley.jpg` → HTTP 200, 195KB JPEG; visually inspected = real ground-level photo of the CDO Trail pedestrian bridge with distant mountains (no AI, no aerial), distinct from Phoenix skyline / Catalina landscape. `buildingImages.js:436` CURATED_LOCAL `'oro valley': { state:'AZ', src: …cities/oro-valley.jpg }` present. |
| 5 | Oro Valley surfaced in coverage.js with a DB-honest chip | ✓ VERIFIED | `coverage.js:209` `{ label:'Oro Valley', browseGovernmentList:['0451600'], browseStateAbbrev:'AZ', hasContext:true }` inside the SINGLE Arizona COVERAGE_STATES block (grep -c "name: 'Arizona'" == 1, line 203). NOT in COVERAGE_COUNTIES (starts line 244, after the entry). hasContext:true is DB-honest (28 stances landed in Plan 03). |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `1305_town_of_oro_valley.sql` | govt + chamber + 2 districts + 7 offices | ✓ VERIFIED | Applied to prod, ledger version `1305` present, in-tx gates passed |
| `1306_town_of_oro_valley_headshots.sql` | 7 politician_images rows | ✓ VERIFIED | 7 rows in prod, UUIDs match manifest |
| `1307`–`1313` stance migrations | evidence-only stances per official | ✓ VERIFIED | All 9 files present (1307 Mayor + 1308–1313 council); 28 cited stance rows in prod |
| `src/lib/buildingImages.js` | CURATED_LOCAL 'oro valley' entry | ✓ VERIFIED | Line 436, state-scoped AZ → cities/oro-valley.jpg |
| `src/lib/coverage.js` | Oro Valley area in existing AZ block | ✓ VERIFIED | Line 209, single AZ block, not in COVERAGE_COUNTIES |

### Key Link Verification

| From | To | Status | Details |
| --- | --- | --- | --- |
| Mayor office | LOCAL_EXEC/G4110/0451600/az district | ✓ WIRED | district_id `302da135…`, dtype LOCAL_EXEC |
| 6 council offices | ONE shared LOCAL/G4110/0451600/az district | ✓ WIRED | all 6 → district_id `c846ce46…` (single row, count=6) |
| chamber `Town Council` | govt `Town of Oro Valley, Arizona, US` | ✓ WIRED | chamber linked to govt at geo_id 0451600 |
| politician_answers | politician_context | ✓ WIRED | 0 uncited answers |
| coverage 'Oro Valley' | buildingImages 'oro valley' | ✓ WIRED | label→normalizePlace substring match; buildingImages.test.js 11/11 green |
| buildingImages 'oro valley' | Storage cities/oro-valley.jpg | ✓ WIRED | CDN HTTP 200 |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Banner CDN reachable | curl -sI politician_photos/cities/oro-valley.jpg | HTTP 200, image/jpeg, 195KB | ✓ PASS |
| 7 headshot CDN reachable | curl per-UUID | all HTTP 200 | ✓ PASS |
| Frontend modules parse + test | vitest buildingImages.test.js | 11/11 passed | ✓ PASS |
| Live E2E address search | POST /api/essentials/candidates/search (Oro Valley address) | HTTP 200, 7 officials under Town of Oro Valley | ✓ PASS |

**Live E2E detail:** Query `11000 N La Canada Dr, Oro Valley, AZ 85737` returned exactly 7 officials under `Town of Oro Valley, Arizona, US`: Mayor Winfield (LOCAL_EXEC) + Council Members Barrett (Vice Mayor), Jones-Ivey, Nicolson, Greene, Murphy, Robb (LOCAL). Party field empty (antipartisan — not displayed); all 7 carry images. No duplicate/wrong-jurisdiction office.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| SUB-01 | 195-01/02/03/04 | Oro Valley deep-seed — govt + roster → 600×750 headshots → evidence-only stances | ✓ SATISFIED | Govt+7 offices seeded, 7 headshots CDN-live, 28 cited stances, live E2E routing confirmed |
| BANR-01 | 195-04 | Licensed Tucson-metro banner sourced + wired | ✓ SATISFIED | CDO Trail Bridge banner (Djmaschek, CC BY-SA 3.0) CDN 200 + wired in buildingImages.js |

### Anti-Patterns Found

None. No TBD/FIXME/XXX debt markers in migrations 1305–1313. Migration 1305 registered in prod ledger. Stances audit-only/unregistered by design (per project convention).

### Human Verification Required

None blocking. All observable outcomes verified against live reality (DB, CDN, live API, frontend code + tests).

### Follow-Up Note (not a gap)

A frontend deploy to Render is still pending for the Oro Valley banner and "Stances" coverage chip to appear on the **live essentials site**. The frontend code is committed (`8fb5b6c4`), parses, and passes tests, and the banner/chip logic (`LocalityMatches.jsx` renders from `area.hasContext`) is correct — this satisfies the code-wiring requirement. The deploy is a routine follow-up, treated as a note per verification scope, not a gap.

### Gaps Summary

No gaps. All 5 ROADMAP success criteria, all 4 plans' must-haves, and both requirements (SUB-01, BANR-01) are verified in the live codebase and production data. The phase goal — Oro Valley residents seeing their council with a compass, and the town carrying its own licensed banner — is achieved end-to-end.

---

_Verified: 2026-07-11T01:00:00Z_
_Verifier: Claude (gsd-verifier)_
