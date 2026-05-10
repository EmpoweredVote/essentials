---
phase: 31-donor-court-conflict-map
verified: 2026-05-09T00:00:00Z
status: human_needed
score: 7/7 must-haves verified
gaps: []
human_verification:
  - test: Legal Donor Activity section visible on judicial profile
    expected: Navigate to a JUDICIAL or city attorney candidate profile. Legal Donor Activity section appears between Bar Evaluation and Campaign Finance sections showing firm cards.
    why_human: isLegalCandidate gate cannot be verified from static analysis alone.
  - test: Legal Donor Activity section hidden on non-legal profile
    expected: Navigate to a city council or state legislature candidate profile. The section must not appear.
    why_human: Gate depends on pol.district_type at runtime; requires a live browser.
  - test: Zero-state renders gracefully
    expected: For a legal candidate with no legal-occupation donors, a no-data message shows with no crash.
    why_human: Requires a candidate with zero legal donors or a controlled API mock.
---
# Phase 31: Donor-Court Conflict Map (Option C Pivot) Verification Report

**Phase Goal (as delivered):** Legal Donor Activity section on judicial / city-attorney candidate profiles, showing donor firms grouped by employer, filtered to legal-occupation donors, fetched at runtime with no DB migration.

**Note on scope pivot:** Original ROADMAP described full court-conflict detection requiring manual lacourt.org research. User approved Option C mid-phase: simplified donor firm display only. Plans 31-02 (court research) and 31-03 (migration 122 + loader) were intentionally skipped. These skips are NOT gaps.

**Verified:** 2026-05-09
**Status:** human_needed - all 7 automated must-haves pass; 3 browser smoke tests remain
**Re-verification:** No - initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | Legal donor firm data is fetchable via a dedicated API endpoint | VERIFIED | Route GET /:id/legal-donor-activity at line 331, before /:id catch-all at line 355 |
| 2  | SQL query uses correct field aliases (never bare con_emp) | VERIFIED | COALESCE uses contributor_employer then con_empr; the alias con_emp never appears |
| 3  | UI section renders only for legal candidates | VERIFIED | polId && isLegalCandidate && LegalDonorActivitySection at CandidateProfile.jsx line 207 |
| 4  | Section sits between BarEvaluationSection and CampaignFinanceSection | VERIFIED | Lines 206-214: BarEvaluationSection then LegalDonorActivitySection then CampaignFinanceSection |
| 5  | Frontend fetches data through a dedicated exported function | VERIFIED | export async function fetchLegalDonorActivity(id) at api.jsx line 286 |
| 6  | Identification script for legal donors exists and is substantive | VERIFIED | identify-legal-donors.ts: 471 lines |
| 7  | Court research input data exists with candidate + firms structure | VERIFIED | court-research-input.json: array with politician_id, firms[] per entry |

**Score:** 7/7 truths verified (automated checks)
---

### Required Artifacts

| Artifact | Min Size | Actual | Status | Details |
|----------|----------|--------|--------|---------|
| identify-legal-donors.ts | 120 lines | 471 lines | VERIFIED | Well above minimum |
| court-research-input.json | 1 entry | Multi-entry | VERIFIED | Contains politician_id, firms[], threshold data |
| getLegalDonorFirms in essentialsProfileService.ts | exists | Line 274 | VERIFIED | Exported async function; full SQL present |
| Route /:id/legal-donor-activity in essentialsPoliticians.ts | exists | Line 331 | VERIFIED | Before catch-all /:id at line 355 |
| fetchLegalDonorActivity export in api.jsx | exists | Line 286 | VERIFIED | Exported; calls apiFetch; handles errors |
| LegalDonorActivitySection.jsx | 50 lines | 135 lines | VERIFIED | Well above minimum |
| CandidateProfile.jsx renders LegalDonorActivitySection gated on isLegalCandidate | exists | Lines 4, 207-209 | VERIFIED | Import at line 4; conditional render at lines 207-209 |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| LegalDonorActivitySection | /api/essentials/politicians/:id/legal-donor-activity | fetchLegalDonorActivity | WIRED | Component calls fetchLegalDonorActivity(politicianId) on mount |
| Route /:id/legal-donor-activity | getLegalDonorFirms | Import in essentialsPoliticians.ts | WIRED | Route calls getLegalDonorFirms(id) at line 338 |
| getLegalDonorFirms | transparent_motivations.contributions | Runtime SQL JOIN | WIRED | No migration; queries existing table at runtime |
| CandidateProfile.jsx | LegalDonorActivitySection | Import + conditional JSX | WIRED | Import at line 4; gate at lines 207-209 |
| Route ordering | Express catch-all prevention | Specific route before /:id | WIRED | Line 331 before line 355; no shadowing |
---

### MUST_HAVE Detail Verification

**MUST_HAVE_1 - COALESCE field names**

SQL at essentialsProfileService.ts lines 279-282 uses contributor_employer (LA format) then con_empr (TX format) then Unknown Firm as fallback. The incorrect alias con_emp does not appear anywhere in the function.
STATUS: VERIFIED

**MUST_HAVE_2 - Route placement before catch-all**

essentialsPoliticians.ts: /:id/legal-donor-activity registered at line 331; /:id catch-all at line 355. Express evaluates routes in registration order; no shadowing.
STATUS: VERIFIED

**MUST_HAVE_3 - isLegalCandidate gate**

CandidateProfile.jsx lines 207-209: LegalDonorActivitySection renders only when polId is truthy AND isLegalCandidate is true.
STATUS: VERIFIED

**MUST_HAVE_4 - Section ordering**

CandidateProfile.jsx: BarEvaluationSection at line 206, LegalDonorActivitySection at lines 207-209, CampaignFinanceSection at lines 210-214. Correct order confirmed.
STATUS: VERIFIED

**MUST_HAVE_5 - fetchLegalDonorActivity export**

api.jsx line 286: export async function fetchLegalDonorActivity(id) with error handling and apiFetch call to /essentials/politicians/id/legal-donor-activity.
STATUS: VERIFIED

**MUST_HAVE_6 - identify-legal-donors.ts line count**

471 lines at C:/EV-Accounts/backend/scripts/identify-legal-donors.ts. Minimum was 120.
STATUS: VERIFIED

**MUST_HAVE_7 - court-research-input.json structure**

File confirmed: array of candidate objects each containing politician_id, candidate_name, grand_total, threshold_cutoff, and firms[] with detailed firm objects (firm_name, raw_firm_name, total_donated, donor_count, occupations_seen, is_fuzzy_match, needs_review).
STATUS: VERIFIED
---

### Anti-Patterns Found

None detected. No TODO/FIXME/placeholder patterns in verified files. No empty handlers. No stub returns in component or route.

---

### Human Verification Required

#### 1. Legal Donor Activity section visible on judicial candidate profile

**Test:** Navigate to a JUDICIAL or city attorney candidate profile in the live app (e.g., Hydee Feldstein Soto, politician_id 3f90952e-7d1b-413d-a0e1-e319fb23fa05).

**Expected:** Legal Donor Activity section appears between Bar Evaluation and Campaign Finance sections. Firm cards show firm name, total donated as formatted currency, donor count, and occupation tags with overflow badge if more than 3 tags.

**Why human:** isLegalCandidate gate depends on pol.district_type returned by the API at runtime; correct section visibility requires a live browser session.

#### 2. Legal Donor Activity section hidden on non-legal candidate profile

**Test:** Navigate to a city council, state legislature, or federal representative candidate profile.

**Expected:** The Legal Donor Activity section does not appear anywhere on the page - no heading, no cards, no empty state.

**Why human:** Must confirm the isLegalCandidate condition correctly evaluates to false for non-legal district types in a live session.

#### 3. Zero-state renders gracefully

**Test:** Navigate to a legal candidate with no matched legal-occupation donors, or use browser dev tools to mock an empty firms array response.

**Expected:** Section renders with the heading and a no-data message. No crash. No blank whitespace block.

**Why human:** Requires either a real candidate with zero legal donors or controlled API interception; cannot be confirmed from static code review.

---

### Intentionally Skipped (Not Gaps)

The following plans were bypassed by explicit user decision (Option C pivot):

- Plan 31-02, Task 2: Manual lacourt.org court research - skipped; no court data needed for Option C
- Plan 31-03: Migration 122 + apply-court-research.ts - skipped; no DB table needed; contributions queried at runtime

These are product decisions, not implementation gaps. Migration 122 remains unassigned and may be used by a future phase.

---

_Verified: 2026-05-09_
_Verifier: Claude (gsd-verifier)_
