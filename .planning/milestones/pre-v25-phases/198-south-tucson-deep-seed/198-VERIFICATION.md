---
phase: 198-south-tucson-deep-seed
verified: 2026-07-17T00:00:00Z
status: passed
score: 5/5 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: none
  note: initial verification
---

# Phase 198: South Tucson Deep-Seed Verification Report

**Phase Goal:** South Tucson residents can see their council with a compass, and the city carries its own licensed banner.
**Requirements:** SUB-04 (deep-seed unit), BANR-01 (licensed community banner)
**Verified:** 2026-07-17
**Status:** passed
**Re-verification:** No — initial verification
**Verification stance:** Goal-backward against LIVE PRODUCTION (read-only psql + live CDN/API probes). SUMMARY claims were treated as unverified until confirmed in the DB/code/network.

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth (SC) | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Government + council roster seeded, election method verified | ✓ VERIFIED | 1 govt row `City of South Tucson, Arizona, US` type=`City`, state=`AZ`, geo_id=`0468850`; 1 `City Council` chamber (official_count=7); 7 politicians ext_id -4015001..-4015007 all on ONE shared LOCAL/G4110/`az` district (distinct district_id count=1); party NULL + is_appointed=false on all 7; nonpartisan at-large confirmed |
| 2 | All seated officials have 600×750 headshots | ✓ VERIFIED | `politician_images` count for the 7 ext_ids = 7; 3 spot-checked CDN URLs HTTP 200; `file`-inspected dimensions = **600x750** on Valenzuela/Aguirre/Robles (verified directly, not from SUMMARY) |
| 3 | Evidence-only compass stances — 100% cited, no defaults, honest blanks | ✓ VERIFIED | 14 total answers; per-official 4/1/1/4/1/3/0 (matches manifest exactly); 0 orphan answers w/o context; 0 context rows with NULL/empty `sources`; 0 judicial-topic stances; all values in [1.0,5.0]; Aguirre honest blank (0) |
| 4 | Licensed community banner sourced and wired into `buildingImages.js` | ✓ VERIFIED | Banner live at `cities/south-tucson.jpg` HTTP 200, `file`-confirmed **1700x540** (3.15:1, real City Hall photo, Public Domain); quoted `'south tucson':` CURATED_LOCAL key → correct src |
| 5 | South Tucson surfaced in `coverage.js` with a DB-honest chip | ✓ VERIFIED | Exactly ONE `name: 'Arizona'` block; contains `{ label: 'South Tucson', browseGovernmentList: ['0468850'], browseStateAbbrev: 'AZ', hasContext: true }`; hasContext:true honest (14 stances seeded); COVERAGE_COUNTIES Pima (`04019`) untouched |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| migration 1363 (structural) | greenfield govt + chamber + 1 LOCAL district + 7 offices | ✓ VERIFIED | Ledger `1363` = 1 row (registered); all structural rows present in prod |
| migration 1364 (headshots, audit-only) | 7 politician_images, NOT in ledger | ✓ VERIFIED | 7 images bound; ledger has NO `1364` row |
| migrations 1365–1371 (stances, audit-only) | 14 stances, NOT in ledger | ✓ VERIFIED | 14 answers seeded; ledger has NO `1365`–`1371` rows |
| `cities/south-tucson.jpg` banner | 1700×540 licensed photo | ✓ VERIFIED | HTTP 200, 1700x540, JPEG |
| `src/lib/buildingImages.js` | quoted `'south tucson'` key | ✓ VERIFIED | Line 489 |
| `src/lib/coverage.js` | one AZ block w/ South Tucson chip | ✓ VERIFIED | Line 225 inside single Arizona block (line 205) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| 7 offices | ONE shared LOCAL district | district_id, scoped LOCAL/G4110/az | ✓ WIRED | distinct district_id = 1; no bare geo_id join |
| City Council chamber | South Tucson government | government_id | ✓ WIRED | chamber resolves to geo_id 0468850 govt |
| coverage.js chip | govt 0468850 | browseGovernmentList `['0468850']` | ✓ WIRED | live search probe returns all 7 for an in-limits address |
| buildingImages key | banner asset | src → cities/south-tucson.jpg | ✓ WIRED | asset HTTP 200 |

### Enclave / Data-Integrity Invariants (novel this phase)

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| ST_Area(ST_Intersection(0468850, 0477000)) km² | ~0 (donut hole) | **0** | ✓ |
| LOCAL_EXEC districts for 0468850 | 0 (Pitfall 3) | **0** | ✓ |
| Section-split (offices leaked to non-South-Tucson govt) | 0 | **0** | ✓ |
| District state casing | lowercase `az` | `az` | ✓ |
| Party recorded on any of the 7 | none (antipartisan) | all NULL | ✓ |

### Behavioral Spot-Checks (live production)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Headshot CDN returns image | `curl -sI` ×3 | HTTP 200, byte counts match SUMMARY (71370/50289/81928) | ✓ PASS |
| Headshot dimensions | download + `file` ×3 | 600x750 all three | ✓ PASS |
| Banner CDN + dims | download + `file` | HTTP 200, 1700x540 | ✓ PASS |
| Address routing (enclave) | POST `1601 S 6th Ave, Tucson AZ 85713` | all 7 South Tucson officials returned; geo_id 0477000 appears 0×, 0468850 1×; 0 City-of-Tucson double-matches (the only "Tucson City Council" string is the substring of "South Tucson City Council") | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SUB-04 | 198-01/02/03 | South Tucson deep-seed unit (govt+roster+headshots+stances) | ✓ SATISFIED | Truths 1–3 verified in prod |
| BANR-01 | 198-04 | Licensed community banner + wiring | ✓ SATISFIED | Truths 4–5 verified (banner live + wired) |

### Anti-Patterns Found

None. No LOCAL_EXEC phantom seat, no party leakage, no bare geo_id joins, no orphan/uncited stances, no judicial stances, no section-split. Audit-only migrations (1364–1371) correctly kept out of the ledger.

### Human Verification Required

None outstanding. Plan 04's two blocking human-verify gates (banner selection + end-to-end routing) were approved at execute time, and the verifier independently re-ran the live routing probe and confirmed the result.

### Informational Note (not a gap)

**POST-JULY-21 RECONCILE OWED** (future-dated, explicitly documented in all four SUMMARYs, not actionable now): South Tucson's July 21, 2026 primary was 4 days after the seed date; 3 seats are up (Valenzuela, Flagg, Aguirre) and the sitting Mayor is herself a candidate. The current roster represents residents today and was the correct operator decision ("primary-not-yet-occurred" branch). After the primary is certified and the post-canvass Mayor/Vice-Mayor/Acting-Mayor re-vote is held, membership + title holders should be re-verified and patched. This does not affect the Phase 198 verdict.

### Gaps Summary

No gaps. All 5 ROADMAP success criteria are observably TRUE in live production; both requirements (SUB-04, BANR-01) satisfied; all key links wired; enclave donut-hole routing confirmed clean end-to-end.

---

_Verified: 2026-07-17_
_Verifier: Claude (gsd-verifier)_
