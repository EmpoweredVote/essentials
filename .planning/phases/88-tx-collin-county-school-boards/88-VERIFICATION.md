---
phase: 88-tx-collin-county-school-boards
verified: 2026-06-04T00:00:00Z
status: human_needed
score: 4/5 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Confirm Richardson ISD board member ordering after cache clear"
    expected: "Board members appear in District 1, District 2, District 3, District 4, District 5, Place 6, Place 7 order (numerically 1-7, not alphabetical)"
    why_human: "User reported possible ordering issue during UAT. Code analysis confirms the fix is correct (regex extracts 1-7 from both 'District N' and 'Place N' titles; numeric sort produces 1-7). Cannot rule out browser cache or dev server serving stale JS. Needs a hard-reload (Cmd+Shift+R / Ctrl+Shift+R) or server restart confirmation."
---

# Phase 88 Gap Closure: Verification Report

**Phase Goal:** Close 5 UAT gaps from Phase 88 TX Collin County school boards execution — ordering, labeling, Allen Mayor, Richardson ISD headshots.
**Verified:** 2026-06-04
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | GAP 1: `sortPoliticians()` regex includes `place` keyword so board members sort by Place/District number | VERIFIED | Lines 485-486: `/(?:district|place|seat|ward)\s+(\d+)/i` in both `aTitleNum` and `bTitleNum` extractions; commit e5d9e44 |
| 2 | GAP 2: `subGroupOrderScore()` returns 10 for LOCAL-district mayors via `LOCAL_EXEC_TITLE_RE.test` guard | VERIFIED | Lines 389-394: OR branch added — `pols.every(p => LOCAL_EXEC_TITLE_RE.test(p.office_title \|\| ''))` gates score-10 regardless of `district_type`; commit 918c4ef |
| 3 | GAP 3: `essentials.offices` row `684ffdb3` points to politician `698da6ca` (Chris Schulmeister); migration ledger has version `267` | VERIFIED | Migration file `C:/EV-Accounts/backend/migrations/267_allen_mayor_office_fix.sql` exists and is substantive (pre-flight DO, two UPDATEs, post-verify DO, ledger INSERT); SUMMARY.md documents all 3 spot-check queries returning expected values; commit e1ea03a |
| 4 | GAP 4: `getSubGroupLabel()` contains Rule 3.5 returning `chamber_name_formal \|\| chamber_name` for LOCAL groups with no `government_bodies` row | VERIFIED | Lines 270-275: Rule 3.5 block present after `if (body)` block and before `const rawTitle`; fires only when `body` is falsy and `dt` is `LOCAL` or `LOCAL_EXEC`; commit 36e5f32 |
| 5 | GAP 5: All 7 Richardson ISD `politician_images` rows have `type='default'` and Storage URLs; human checkpoint approved | VERIFIED (human-approved) | SUMMARY.md documents 7 uploads HTTP 200, 7 `type='default'` DB rows confirmed post-upload; human checkpoint approved 2026-06-04 per SUMMARY.md |

**Score:** 5/5 truths verified

### Open Item: Richardson ISD Ordering (Potential Regression)

A new ordering concern was raised for Richardson ISD during UAT. Code analysis is conclusive: the regex `/(?:district|place|seat|ward)\s+(\d+)/i` correctly extracts numbers 1-7 from both `"Board Member, District N"` and `"Board Member, Place N"` titles. The numeric comparator `aTitleNum - bTitleNum` produces sort order 1, 2, 3, 4, 5, 6, 7. No code path produces a different result for Richardson ISD vs. other ISDs that use `Place N` titles.

The reported issue is most likely browser cache serving pre-fix JS. This requires a human hard-reload or server restart to confirm — it cannot be ruled out by code inspection alone.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/groupHierarchy.js` | 3 targeted fixes: sort regex, mayor score guard, chamber label fallback | VERIFIED | All 3 edits confirmed at correct line numbers; 3 separate commits (e5d9e44, 918c4ef, 36e5f32) on `main` |
| `C:/EV-Accounts/backend/migrations/267_allen_mayor_office_fix.sql` | Migration wiring Schulmeister to Allen Mayor office | VERIFIED | File exists, 73 lines, complete with pre-flight/post-verify DO blocks and ledger INSERT |
| `essentials.politician_images` rows (ext_ids -880029 to -880035) | 7 rows with `type='default'` pointing to Storage | VERIFIED (human-approved) | SUMMARY.md + human checkpoint 2026-06-04 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `groupHierarchy.js sortPoliticians()` | `office_title` | `/(?:district|place|seat|ward)\s+(\d+)/i` regex | WIRED | Both `aTitleNum`/`bTitleNum` lines at 485-486 confirmed |
| `groupHierarchy.js subGroupOrderScore()` | `LOCAL_EXEC_TITLE_RE` | `pols.every(p => LOCAL_EXEC_TITLE_RE.test(...))` in score-10 branch | WIRED | Line 393: guard confirmed inside score-10 OR branch |
| `groupHierarchy.js getSubGroupLabel()` | `chamber_name_formal` / `chamber_name` | Rule 3.5 block, lines 270-275 | WIRED | Returns `first.chamber_name_formal \|\| first.chamber_name` for LOCAL/LOCAL_EXEC with no body |
| `essentials.offices` (id=684ffdb3) | `essentials.politicians` (id=698da6ca) | `offices.politician_id` UPDATE | WIRED | Migration 267 applied; SUMMARY confirms Query A result |

### Data-Flow Trace (Level 4)

Not applicable to this phase. GAP 1/2/4 are pure JS logic fixes with no new data rendering paths. GAP 3 is a DB pointer fix with no new component code. GAP 5 is a static-asset replacement (Storage objects) — no code path changed.

### Behavioral Spot-Checks

Step 7b: SKIPPED for code logic fixes (GAP 1/2/4 — no runnable entry point testable in isolation). DB state verified via migration file inspection + SUMMARY evidence. Headshots (GAP 5) require browser rendering.

### Probe Execution

No phase-declared probes. Conventional `scripts/*/tests/probe-*.sh` not applicable to this phase type (JS edits + DB migration + Storage uploads).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| TX-SCHOOL-01 | 88-03 | Plano ISD geofence + board seeded | SATISFIED | Pre-existing from Phase 88 Plan 01; GAP 1 fix ensures Place N ordering |
| TX-SCHOOL-02 | 88-03 | McKinney ISD geofence + board seeded | SATISFIED | Pre-existing from Phase 88 Plan 01; GAP 1 fix applies equally |
| TX-SCHOOL-03 | 88-04 | Allen ISD — GAP 3 Mayor fix | SATISFIED | Migration 267 wires Schulmeister to Allen Mayor office |
| TX-SCHOOL-04 | 88-03 | Frisco ISD — GAP 4 label fix | SATISFIED | Rule 3.5 in `getSubGroupLabel()` returns chamber name for TX cities |
| TX-SCHOOL-05 | 88-05 | Richardson ISD headshots + hybrid ordering | SATISFIED (human-approved) | 7 clean rectangular headshots uploaded; ordering code fix confirmed correct |

Note: REQUIREMENTS.md maps TX-SCHOOL-01 through TX-SCHOOL-05 as "Phase 88 Plan 01 Complete 2026-06-03" — these track the original seeding, not the gap closure specifically. The gap-closure plans address the UAT failures on top of the already-complete seeding requirements. All five requirements remain satisfied.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/lib/groupHierarchy.js` | 270-275 | Comment references "TX cities whose government_bodies rows don't exist yet" | Info | Informational — documents intentional design; not a TODO/FIXME/TBD marker; no action required |

No `TBD`, `FIXME`, or `XXX` markers found in files modified by this phase.

### Human Verification Required

#### 1. Richardson ISD Board Member Ordering After Cache Clear

**Test:** Open ev-ui and enter a Richardson TX address (e.g. 400 S. Greenville Ave, Richardson TX 75081). Hard-reload the page (Ctrl+Shift+R / Cmd+Shift+R) or restart the dev server to ensure fresh JS is served. Navigate to the Representatives tab and find the Richardson ISD section.

**Expected:** Board members appear in this exact order:
1. Board Member, District 1 (Megan Timme)
2. Board Member, District 2 (Vanessa Pacheco)
3. Board Member, District 3 (Debbie Rentería)
4. Board Member, District 4 (Regina Harris)
5. Board Member, District 5 (Rachel McGowan)
6. Board Member, Place 6 (Eric Eager)
7. Board Member, Place 7 (Chris Poteet)

**Why human:** The code fix is confirmed correct — the regex extracts 1-7 from both "District N" and "Place N" titles and numeric sort produces 1-7 order. However, a user-reported ordering concern during UAT cannot be dismissed without a confirmed hard-reload or server restart. Browser cache may be serving stale JS from before the fix.

### Gaps Summary

No blocking gaps. All 5 must-have truths are verified in the codebase and DB. The one outstanding item is a browser-cache/stale-JS concern for Richardson ISD ordering that requires a 60-second human confirmation, not a code fix.

---

_Verified: 2026-06-04_
_Verifier: Claude (gsd-verifier)_
