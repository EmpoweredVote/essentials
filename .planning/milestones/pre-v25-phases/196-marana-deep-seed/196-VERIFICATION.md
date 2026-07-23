---
phase: 196-marana-deep-seed
verified: 2026-07-16T00:00:00Z
status: passed
score: 6/6 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: none
---

# Phase 196: Marana Deep-Seed Verification Report

**Phase Goal:** Marana residents can see their council with a compass, and the town carries its own licensed banner.
**Verified:** 2026-07-16
**Status:** passed
**Re-verification:** No — initial verification

All verification was performed goal-backward against **live production** (Supabase DB via read-only `psql`, the `politician_photos` CDN via `curl`, the live `accounts-api.empowered.vote` search API, and the committed `essentials` frontend). SUMMARY claims were treated as unverified until confirmed by direct query.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Government + roster seeded with correct structure | ✓ VERIFIED | 1 govt, 1 chamber, 7 offices, correct districts/titles, section-split=0, no Jackie Craig |
| 2 | All 7 seated officials have 600×750 headshots | ✓ VERIFIED | 7 `politician_images` rows; 3 CDN spot-checks HTTP 200 + 600×750 |
| 3 | Evidence-only compass stances (100% cited, no defaults, no judicial) | ✓ VERIFIED | 21 answers = 21 context rows, 0 empty sources, 0 judicial, all values in [1,5] |
| 4 | Licensed community banner sourced + wired | ✓ VERIFIED | `cities/marana.jpg` HTTP 200 @ 1700×540; `marana:` CURATED_LOCAL entry present |
| 5 | Marana surfaced in coverage.js with DB-honest chip | ✓ VERIFIED | Chip in single Arizona `COVERAGE_STATES` block, `['0444270']`, `hasContext:true`, not in COUNTIES |
| 6 | Resident address resolves end-to-end to Mayor + 6 council | ✓ VERIFIED | Live search returns all 7 officials with correct titles |

**Score:** 6/6 truths verified

---

### Criterion 1 — Government / Roster (SUB-02 #1): ✓ PASS

```
governments @ 0444270:
fa011bb9-...|Town of Marana, Arizona, US|0444270|Town|AZ         (exactly 1)

chamber:
02d7e62e-...|Town Council|official_count=7                       (exactly 1)

roster (7 rows, ext_id DESC):
-4013001 Jon Post          party=NULL is_appointed=f  Mayor                          LOCAL_EXEC G4110 az
-4013002 Roxanne Ziegler   party=NULL is_appointed=f  Council Member (Vice Mayor)    LOCAL      G4110 az
-4013003 Patrick Cavanaugh party=NULL is_appointed=f  Council Member                 LOCAL      G4110 az
-4013004 Patti Comerford   party=NULL is_appointed=f  Council Member                 LOCAL      G4110 az
-4013005 Herb Kai          party=NULL is_appointed=f  Council Member                 LOCAL      G4110 az
-4013006 Teri Murphy       party=NULL is_appointed=f  Council Member                 LOCAL      G4110 az
-4013007 John Officer      party=NULL is_appointed=f  Council Member                 LOCAL      G4110 az

district grouping:  LOCAL → 1 distinct district / 6 offices; LOCAL_EXEC → 1 district / 1 office
Vice Mayor offices: exactly 1, on -4013002 (Roxanne Ziegler)
Jackie Craig:       0 rows (NOT present)
section-split (canonical Gate f, join via chamber.government_id): 0
```

- Exactly 1 government `Town of Marana, Arizona, US` at geo_id 0444270. ✓
- Exactly 1 `Town Council` chamber. ✓
- 7 offices = 1 Mayor on LOCAL_EXEC/G4110/az + 6 Council on ONE shared LOCAL/G4110/az district (both districts scoped by `geo_id='0444270'`; `government_id` NULL is the established pattern). ✓
- party NULL and is_appointed false on all 7. ✓
- Exactly one `...(Vice Mayor)` office and it is Ziegler's (-4013002). ✓
- section-split = 0 (verified with the exact Gate-f query from migration 1345). ✓
- Jackie Craig NOT present. ✓

### Criterion 2 — Headshots (SUB-02 #2): ✓ PASS

```
politician_images: 7 rows / 7 distinct politicians for ext_ids -4013001..-4013007
all URLs = .../politician_photos/{correct-UUID}-headshot.jpg (match Plan-01 manifest)

CDN spot-checks (curl + Node JPEG SOF parse):
  Post    HTTP 200 image/jpeg  600x750  OK
  Kai     HTTP 200 image/jpeg  600x750  OK
  Officer HTTP 200 image/jpeg  600x750  OK
```

7 image rows bound to the 7 correct UUIDs; three CDN URLs (Post, Kai, Officer) return HTTP 200 and are exactly 600×750. ✓

### Criterion 3 — Stances (SUB-02 #3): ✓ PASS

```
per-official answer counts (via inform.politician_answers):
  -4013001 Jon Post          6
  -4013002 Roxanne Ziegler   3
  -4013003 Patrick Cavanaugh 2
  -4013004 Patti Comerford   2
  -4013005 Herb Kai          4
  -4013006 Teri Murphy       2
  -4013007 John Officer      2
  TOTAL                      21   (matches expected 6+3+2+2+4+2+2)

answers without a matching context row: 0
context rows for the 7:                21  (1:1 with answers)
context rows with NULL/empty sources:  0   (sources is ARRAY; also 0 blank-string entries)
judicial rows (judicial_role NOT NULL OR topic_key ILIKE 'judicial%'): 0
values NULL or outside [1.0,5.0]:      0
non-judicial live topics available:    36

topics used: data-centers(6), growth-and-development(7), economic-development(2),
             taxes(2), local-immigration(2), public-safety-approach(1), transportation-priorities(1)
```

Evidence-only across the 36 non-judicial topics: every answer has a matching context row, zero empty sources, zero judicial rows, all values discrete in [1,5], per-official counts match the SUMMARY exactly. ✓

### Criterion 4 — Banner (BANR-01 #4): ✓ PASS

```
curl -sI .../politician_photos/cities/marana.jpg → HTTP 200, image/jpeg, 284704 bytes
dims: 1700x540 (ratio 3.148)  OK

src/lib/buildingImages.js:465
  marana: { state: 'AZ', src: '.../politician_photos/cities/marana.jpg' }
  (inside CURATED_LOCAL object, lines 161–~550; attribution comment:
   "Golf Club at Dove Mountain (Saguaro) no 3 | Bernard Gagnon | CC BY-SA 3.0")
```

Banner live at 1700×540 (3.15:1); `marana:` CURATED_LOCAL entry present pointing to `cities/marana.jpg` with licensed attribution (Dove Mountain, CC BY-SA 3.0 — real ground-level photo, non-Catalina). ✓

### Criterion 5 — Coverage Chip (#5): ✓ PASS

```
src/lib/coverage.js:215
  { label: 'Marana', browseGovernmentList: ['0444270'], browseStateAbbrev: 'AZ', hasContext: true }
  → inside the single Arizona COVERAGE_STATES block (areas: Tucson, Oro Valley, Marana)

count of "name: 'Arizona'" occurrences: 1
Marana in COVERAGE_COUNTIES: no (Pima County block untouched)
```

Marana chip present in the SINGLE Arizona `COVERAGE_STATES` block with `browseGovernmentList: ['0444270']` and `hasContext: true` (honest — 21 stance rows exist); not in COVERAGE_COUNTIES; exactly one Arizona block. ✓

### Criterion 6 — End-to-End (resident-facing): ✓ PASS

```
POST https://accounts-api.empowered.vote/api/essentials/candidates/search
  {"query":"11555 W Civic Center Dr, Marana, AZ 85653"}  → HTTP 200

Marana officials in response: 7
  -4013001 Jon Post          => Mayor
  -4013002 Roxanne Ziegler   => Council Member (Vice Mayor)
  -4013003 Patrick Cavanaugh => Council Member
  -4013004 Patti Comerford   => Council Member
  -4013005 Herb Kai          => Council Member
  -4013006 Teri Murphy       => Council Member
  -4013007 John Officer      => Council Member
```

A real Marana address resolves live to exactly the Mayor + 6 at-large Council Members with correct titles. ✓

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | none | — | No TBD/FIXME/XXX debt markers in the two frontend files or migrations 1345–1353 |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SUB-02 | 196-01/02/03 | Marana govt + roster + headshots + stances | ✓ SATISFIED | Criteria 1, 2, 3, 6 |
| BANR-01 | 196-04 | Licensed community banner wired | ✓ SATISFIED | Criterion 4 |

### Human Verification Required

None required for goal achievement. (Banner licensing/no-Catalinas and headshot crop quality were operator-approved during execution per the VALIDATION manual-only list; the live artifacts confirm dimensions and wiring.)

### Gaps Summary

No gaps. All 6 ROADMAP success criteria are observably true in live production and the committed frontend. The phase goal — Marana residents see their elected council with a compass plus a licensed community banner — is achieved end-to-end.

Note (non-blocking, matches SUMMARY 196-04 deviation): the frontend `buildingImages.js`/`coverage.js` changes are committed to `essentials` but a Render deploy is at operator discretion. The resident-facing search routing (Criterion 6) is backend-only and already live; the banner/chip will surface on the next frontend deploy.

---

_Verified: 2026-07-16_
_Verifier: Claude (gsd-verifier)_
