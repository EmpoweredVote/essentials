---
phase: 06-admin-review-ui-email-per-race-trigger
verified: 2026-04-25T00:00:00Z
status: passed
score: 12/12 must-haves verified
---

# Phase 6: Admin Review UI + Email + Per-Race Trigger — Verification Report

**Phase Goal:** Admin can review, approve, and dismiss staged candidates through a browser UI, receives email when items need attention, and can trigger discovery for individual races.
**Verified:** 2026-04-25
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Admin can navigate to /admin/staging and see pending staged candidates grouped by race | VERIFIED | App.jsx:59 routes /admin/staging to StagingQueue behind RequireAuth. StagingQueue.jsx calls fetchStagingQueue() on mount and renders via groupByRace(). |
| 2 | Each row shows candidate name, confidence badge, jurisdiction, clickable source URL | VERIFIED | StagingQueue.jsx:74-92 QueueRow renders full_name, confidence badge, jurisdiction_name, and citation_url as anchor with target=_blank. |
| 3 | Rows for elections within 30 days show urgency visual indicator | VERIFIED | StagingQueue.jsx:163-176 urgent flag drives orange border on section and row plus days-away text in header. |
| 4 | Candidates sorted uncertain first, matched second, official third within each race group | VERIFIED | StagingQueue.jsx:43-47 groupByRace() sorts by CONFIDENCE_ORDER {uncertain:0, matched:1, official:2}. |
| 5 | Flagged/withdrawal rows show flag_reason text | VERIFIED | StagingQueue.jsx:77-79 entry.flagged && entry.flag_reason renders flag_reason in red span. |
| 6 | Approve/Dismiss use correct backend paths with optimistic UI and Undo toast | VERIFIED | adminApi.js:170,191 POST to /admin/discovery/staging/:id/approve and /dismiss. StagingQueue.jsx:118-145 optimistic filter + Undo reloads queue from server. |
| 7 | Backend staging endpoints gated by requireAuth + requireAdmin (JWT) | VERIFIED | stagingQueueAdmin.ts:45,76,142 each handler passes requireAuth, requireAdmin as route-level middleware args. Not requireAdminToken. |
| 8 | DiscoveryRunSummary exposes uncertainStaged, matchedStaged, officialStaged counters | VERIFIED | discoveryService.ts:166-177 interface declares all three. Incremented at lines 337-339. Returned in summary object. |
| 9 | Review email fires when candidatesStaged > 0 with correct urgent vs. non-urgent subject | VERIFIED | discoveryService.ts:415-429 gated on candidatesStaged > 0. Subject prefixed [URGENT] when daysUntilElection <= 30. Uses uncertainStaged as X in subject per plan spec. |
| 10 | Failure branch sends discovery-run-failed email before re-throwing | VERIFIED | discoveryService.ts:484-500 catch block sends email with subject "Discovery run failed -- [J]", then throw err. sendEmail awaited; emailService catches internally so email failure cannot mask discovery error. |
| 11 | Zero-candidate regression alert fires when current=0 AND prior completed run had >0 | VERIFIED | discoveryService.ts:433-458 checks agentResult.candidates.length === 0, queries prior completed run, sends alert only if prevCount > 0. Subject: "Zero candidates returned -- [J] (was N)". |
| 12 | POST /api/admin/discover/race/:id returns 202 with raceId/jurisdictionId/jurisdictionName and correct 404/422 codes | VERIFIED | essentialsDiscovery.ts:84-149 CTE resolves race to jurisdiction. 404 RACE_NOT_FOUND when CTE empty, 404 NO_DISCOVERY_JURISDICTION when no jurisdiction, 422 VALIDATION_ERROR for non-UUID, 202 body includes all three fields per spec. |

**Score:** 12/12 truths verified

---

## Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| src/pages/admin/StagingQueue.jsx | VERIFIED | 200 lines. Full implementation: grouping, sorting, urgency UI, optimistic UI, toast, Undo. No stubs or placeholders. |
| src/lib/adminApi.js | VERIFIED | fetchStagingQueue, approveStagingCandidate, dismissStagingCandidate implemented at lines 153-203. Correct error status propagation. |
| src/App.jsx | VERIFIED | /admin/staging route at line 59 with RequireAuth wrapper. StagingQueue imported at line 11. BrowserRouter provided by main.jsx. |
| backend/src/routes/stagingQueueAdmin.ts | VERIFIED | 207 lines. Three endpoints with UUID validation, pool.query DB access, full 404/409/422/500 error handling. |
| backend/src/lib/discoveryService.ts | VERIFIED | 504 lines. DiscoveryRunSummary updated with all three new counters. Email logic in success (step 7b) and failure (step 8b) branches. Zero-candidate regression alert present. |
| backend/src/routes/essentialsDiscovery.ts | VERIFIED | 290 lines. POST /discover/race/:id added at line 84 in existing router per plan spec. No new file created. |
| backend/src/index.ts | VERIFIED | stagingQueueAdminRouter imported and mounted at line 104. essentialsDiscoveryRouter + requireAdminToken mounted at line 107. |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| StagingQueue.jsx | adminApi.js | import | WIRED | Lines 2-6 import all three API functions; all three called in event handlers. |
| adminApi.js | /api/admin/discovery/staging | apiFetch | WIRED | apiFetch prepends /api (auth.js:2). Paths resolve to /api/admin/discovery/staging[/:id/approve or /dismiss]. |
| stagingQueueAdmin.ts | pool.query | direct pg | WIRED | All three handlers query essentials.candidate_staging directly; supabase client never used. |
| discoveryService.ts | sendEmail | await sendEmail | WIRED | Three call sites (review, zero-regression, failure). All awaited. emailService.ts catches internally; errors never propagate. |
| essentialsDiscovery.ts | runDiscoveryForJurisdiction | fire-and-forget | WIRED | Race endpoint resolves jurisdiction then fires runDiscoveryForJurisdiction().catch(). 202 returned immediately. |
| App.jsx | StagingQueue | Route element | WIRED | Route at line 59; StagingQueue imported at line 11; BrowserRouter in main.jsx. |

---

## Route Mount Analysis

The two routers share the /api/admin prefix without collision:

- stagingQueueAdminRouter (index.ts:104) no middleware at mount; requireAuth + requireAdmin applied per-route inside stagingQueueAdmin.ts. Handles GET /discovery/staging, POST /discovery/staging/:id/approve, POST /discovery/staging/:id/dismiss.
- requireAdminToken + essentialsDiscoveryRouter (index.ts:107) X-Admin-Token gated. Handles POST /discover/jurisdiction/:id and POST /discover/race/:id.

Note: The inline comment on each handler in stagingQueueAdmin.ts says "Auth applied at mount in index.ts" -- this is a stale comment. The actual router.get/post() call arguments correctly pass requireAuth and requireAdmin per-route. Functional behavior matches the plan spec.

---

## Anti-Patterns Found

None. No TODO/FIXME/placeholder comments, empty returns, or stub handlers found in any key file across all three sub-plans.

---

## Human Verification Required

### 1. Urgency UI rendering

**Test:** Load /admin/staging with a staged candidate whose election is within 30 days.
**Expected:** Race section has an orange border, each row in that section has an orange left border, header shows "N days away" in orange text.
**Why human:** CSS class application and visual rendering cannot be verified by grep.

### 2. Undo toast behavior

**Test:** Approve or dismiss a candidate, then click "Undo" within 5 seconds.
**Expected:** The entry reappears in the queue (server reload triggered).
**Why human:** Requires interactive browser session; timeout behavior and successful re-fetch are runtime concerns.

### 3. Email delivery end-to-end

**Test:** Trigger a discovery run (via POST /api/admin/discover/race/:id or /discover/jurisdiction/:id) that produces uncertain candidates for an election within 30 days.
**Expected:** Admin receives email at ADMIN_EMAIL with subject "[URGENT] N candidates need review -- [Jurisdiction] election in D days" within seconds of run completion.
**Why human:** Requires ADMIN_EMAIL and RESEND_API_KEY env vars set and a live discovery run that returns results.

---

_Verified: 2026-04-25_
_Verifier: Claude (gsd-verifier)_
