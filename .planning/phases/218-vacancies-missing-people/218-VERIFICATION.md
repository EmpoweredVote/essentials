---
phase: 218-vacancies-missing-people
verified: 2026-07-24T03:23:00Z
status: passed
score: 12/12 must-haves verified
behavior_unverified: 0
---

# Phase 218: Vacancies & Missing People Verification Report

**Phase Goal:** For every unseated office (`politician_id IS NULL`) across all 23 resolving Collin County governments, seat a researched, cited incumbent OR document a genuine vacancy; and detect + add offices where a body has more real seats than modeled rows.
**Verified:** 2026-07-24T03:23:00Z
**Status:** passed

## Goal Achievement

### Observable Truths

| # | Truth (source plan) | Status | Evidence |
|---|---------------------|--------|----------|
| 1 | 6 missing office rows added — Blue Ridge +1, Lowry Crossing +4, Weston +1 (218-01) | ✓ VERIFIED | Independent DB query: Blue Ridge non-mayor rows=5, Lowry Crossing=8, Weston=5; migration 1388 (EV-Accounts `0c738e90`) |
| 2 | Josephine Place 5 not duplicated (218-01) | ✓ VERIFIED | Josephine shows single Place 5 row, seated (Chappell); no dup |
| 3 | 18–20 directly-cited incumbents seated, linked to real politician rows (218-02) | ✓ VERIFIED | 20 target offices seated; migration 1389 (`3d9f9dc9`); live spot-check |
| 4 | Every seated politician has party NULL (218-02, D-05 antipartisan) | ✓ VERIFIED | Independent DB: `seated_with_party = 0` across all 23 govs |
| 5 | No compass-stance rows created as a side effect (218-02, D-06) | ✓ VERIFIED | Apply-script before/after stance-row count gate = 0 delta |
| 6 | Each of 7 flagged seats seated-cited OR documented vacant — never ambiguous (218-03) | ✓ VERIFIED | All 7 resolved as SEAT (0 vacancies); migration 1390 (`32f4b2a3`); DB shows 0 unseated-not-vacant in target cities |
| 7 | Lucas office titles remain `Council Member Place N` — landmine held (218-03) | ✓ VERIFIED | Titles intact; Place↔Seat mapping proven via May-2-2026 county canvass PDF |
| 8 | Newly-seated people with a findable source have a 600×750 headshot (218-04, D-03) | ✓ VERIFIED | 12 headshots sourced + uploaded; migration 1391 (`50d2e37d`); dimension/type gates pass |
| 9 | Blue Ridge / Lowry Crossing / Nevada newly-seated left as honest blanks (218-04) | ✓ VERIFIED | Independent DB: 0 `type='default'` image rows for those cities' seated people |
| 10 | 0 ambiguous empty seats across ALL 23 govs (218-05, COLLIN-PEOPLE-02) | ✓ VERIFIED | Independent DB reconcile: `ambiguous = 0` (157 seated + 1 documented vacant = 158 offices) |
| 11 | Other-12 non-target govs' seat counts match real bodies (218-05, D-02) | ✓ VERIFIED | Verify-script gate 3 PASS (0 genuine gaps); Weston official_count metadata note is non-blocking |
| 12 | Split-section clean across all 23 govs (218-05) | ✓ VERIFIED | Verify-script gate 4 PASS (0 rows) |

**Score:** 12/12 truths verified

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| migration 1388 (missing office rows) | ✓ EXISTS + APPLIED | EV-Accounts `0c738e90`, pushed to Render |
| migration 1389 (seat cited incumbents) | ✓ EXISTS + APPLIED | EV-Accounts `3d9f9dc9` |
| migration 1390 (re-verify flagged seats) | ✓ EXISTS + APPLIED | EV-Accounts `32f4b2a3` |
| migration 1391 (headshots audit) | ✓ EXISTS + APPLIED | EV-Accounts `50d2e37d`; 12 images in Storage |
| migration 1392 (Plano Place 6 vacancy) | ✓ EXISTS + APPLIED | EV-Accounts `d1ae2f4b` — phase-close finding |
| `_verify-collin-218-completeness.ts` | ✓ EXISTS + SUBSTANTIVE | Read-only 6-gate battery, all PASS |
| 218-01..05 SUMMARY.md | ✓ ALL PRESENT | Each ends `## Self-Check: PASSED` |

**Artifacts:** 7/7 verified

## Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| COLLIN-PEOPLE-01: Unseated offices seated with cited incumbent where filled | ✓ SATISFIED | 20 directly-cited + 7 re-verified offices seated, each with cited data_source; party NULL |
| COLLIN-PEOPLE-02: Genuine vacancies documented, never ambiguous | ✓ SATISFIED | 0 ambiguous seats across 23 govs; Plano Place 6 documented as `is_vacant=true` with no placeholder |

**Coverage:** 2/2 requirements satisfied

## Anti-Patterns Found

None. No stubs, placeholder rows, fabricated people, or party leakage. Documented vacancy (Plano Place 6) correctly carries no placeholder politician row.

ℹ️ Info (non-blocking, logged for a future pass): Weston `chambers.official_count` is stale at 5 vs actual 6 office rows (office_count > official_count, so it does not trip the missing-seat condition). The 7 unrelated pre-existing duplicate/data-quality rows surfaced during Plan 02's global gate (Indiana township boards, Martin County Circuit Clerk, MA Lt. Governor variant) were logged as out-of-scope, not absorbed into this phase.

## Human Verification Required

Completed — the operator ran the blocking live-browse spot-check (Parker, Princeton, Van Alstyne, Lowry Crossing, Plano) and approved: newly-seated names, flagged vacancies, and headshots render correctly; honest-blank cities show blanks, not wrong faces.

## Gaps Summary

**No gaps found.** Phase goal achieved. Every office across all 23 Collin County governments is either seated with a cited incumbent or documented as a genuine vacancy; the 6 missing-seat rows were added; antipartisan, split-section, no-duplicate, and idempotency gates are clean; headshots present where sourceable with honest blanks elsewhere.

## Verification Metadata

**Verification approach:** Goal-backward, cross-checked against the live production DB independently of the executors
**Must-haves source:** 218-01..05 PLAN.md frontmatter + ROADMAP.md success criteria
**Automated checks:** 6-gate SQL battery PASS + orchestrator independent reconcile PASS
**Human checks required:** 1 (live browse) — completed + approved
**Total verification time:** across-wave, ~5.5h execution wall-clock

---
*Verified: 2026-07-24T03:23:00Z*
*Verifier: Claude (orchestrator — gsd-verifier agent type unavailable in this runtime; verified inline with independent production-DB queries)*
