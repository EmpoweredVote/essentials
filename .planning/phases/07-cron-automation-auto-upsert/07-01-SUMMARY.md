---
phase: 07-cron-automation-auto-upsert
plan: 01
subsystem: api
tags: [typescript, postgres, discovery, cron, candidate-staging, race-candidates]

# Dependency graph
requires:
  - phase: 05-discovery-engine
    provides: runDiscoveryForJurisdiction(), discoveryService.ts, candidate_staging schema
  - phase: 06-admin-review-ui-email-per-race-trigger
    provides: candidate_staging status/reviewed_by/reviewed_at columns, per-run email notification
provides:
  - opts.autoUpsert flag on runDiscoveryForJurisdiction() — high-confidence candidates bypass staging queue
  - opts.suppressRunEmail flag — suppresses per-run review email for cron sweep use
  - autoUpsertToRaceCandidates() helper — idempotent SELECT-then-INSERT into race_candidates
  - DiscoveryRunSummary.autoUpserted count — cron sweep reporting
affects:
  - 07-02 (cron sweep job that will consume opts.autoUpsert and opts.suppressRunEmail)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SELECT-then-INSERT idempotency for race_candidates (no ON CONFLICT — no unique index on (race_id, full_name))"
    - "Audit trail: auto-upserted candidates get candidate_staging row with status='approved', reviewed_by='cron'"
    - "Email suppression as opt-in flag — alerting defaults to on; cron sweeps opt out"

key-files:
  created: []
  modified:
    - C:/EV-Accounts/backend/src/lib/discoveryService.ts

key-decisions:
  - "autoUpsert eligibility requires confidence='official' OR 'matched' AND raceId IS NOT NULL — uncertain and unmatched-race candidates always go to pending staging"
  - "Auto-upserted candidates write a candidate_staging audit row with status='approved' reviewed_by='cron' reviewed_at=now() — the staging table remains the single source of truth for audit"
  - "suppressRunEmail only gates the per-run review notification — zero-candidate regression alert and failure email fire unconditionally regardless of flag"
  - "autoUpsertToRaceCandidates uses SELECT-then-INSERT (not ON CONFLICT) because race_candidates has no unique index on (race_id, full_name)"
  - "firstName = first token, lastName = remaining tokens joined (null if single-token name)"

patterns-established:
  - "Cron callers pass triggeredBy='cron', autoUpsert=true, suppressRunEmail=true as a bundle"
  - "On-demand callers pass no opts (or triggeredBy='on_demand') — behavior unchanged from Phase 5"

# Metrics
duration: 2min
completed: 2026-04-25
---

# Phase 7 Plan 01: Auto-Upsert Branch + suppressRunEmail Summary

**runDiscoveryForJurisdiction() extended with autoUpsert branch (official/matched candidates skip staging queue) and suppressRunEmail flag, with SELECT-then-INSERT idempotent race_candidates helper and full audit trail**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-25T21:44:09Z
- **Completed:** 2026-04-25T21:46:21Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Extended `opts` type on `runDiscoveryForJurisdiction()` with `autoUpsert` and `suppressRunEmail` without breaking on-demand callers (default `{}` covers all new fields)
- Added `autoUpsertToRaceCandidates()` async helper — checks for existing row by `(race_id, lower(full_name))`, inserts with `first_name`/`last_name` split and `source='discovery_cron'`, returns `'inserted' | 'already_present'`
- In candidate loop: eligibility gate `opts.autoUpsert && raceId !== null && (confidence === 'official' || confidence === 'matched')` routes to auto-upsert path; everything else goes to unchanged `'pending'` staging path
- Auto-upserted candidates write a `candidate_staging` audit row with `status='approved'`, `reviewed_by='cron'`, `reviewed_at=now()` — preserving full audit trail
- `suppressRunEmail` gates only the per-run review notification; zero-candidate regression alert and failure email (catch block) are unaffected
- `DiscoveryRunSummary.autoUpserted` field added for cron sweep total reporting
- Build passes cleanly (`npm run build` — zero TypeScript errors)

## Task Commits

1. **Task 1: autoUpsert branch + suppressRunEmail + helper + summary field** - `12063c8` (feat)

**Plan metadata:** (pending — committed after SUMMARY + STATE)

## Files Created/Modified

- `C:/EV-Accounts/backend/src/lib/discoveryService.ts` — Extended opts type, added `autoUpsertToRaceCandidates` helper, added autoUpsert branch in candidate loop, added `suppressRunEmail` guard on review email, added `autoUpserted` to `DiscoveryRunSummary`

## Decisions Made

- **Auto-upsert eligibility gate:** `raceId !== null && (confidence === 'official' || confidence === 'matched')`. Uncertain candidates and candidates with no resolved race always go to pending staging — human review required for those.
- **SELECT-then-INSERT not ON CONFLICT:** `race_candidates` has no unique index on `(race_id, full_name)` (only a partial unique on `external_id WHERE external_id IS NOT NULL`). ON CONFLICT would require a unique constraint. SELECT-then-INSERT is safe given sequential (non-parallel) jurisdiction processing.
- **Audit row strategy:** The staging table rows with `status='approved'` are the audit trail for auto-upserted candidates — admin can always inspect what the cron inserted and why.
- **suppressRunEmail semantics:** Zero-candidate regression alert is a data-quality signal that must fire even during cron sweeps (could indicate source page change). Failure email is in the catch block — also unconditional. Only the per-candidate-staged review email is suppressible.
- **firstName / lastName split:** First whitespace token = firstName; remaining tokens joined = lastName; single-token names get lastName=null. This matches the pattern used by approveCandidate() in Phase 6.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no new environment variables, no external service configuration.

## Next Phase Readiness

Plan 07-02 (cron sweep job) can now call:

```typescript
await runDiscoveryForJurisdiction(jurisdictionId, {
  triggeredBy: 'cron',
  autoUpsert: true,
  suppressRunEmail: true,
});
```

And use `summary.autoUpserted` to accumulate sweep totals for the single cron-completion email.

No blockers. The function signature, semantics, and return type are stable and ready for Plan 02 to consume.

---
*Phase: 07-cron-automation-auto-upsert*
*Completed: 2026-04-25*
