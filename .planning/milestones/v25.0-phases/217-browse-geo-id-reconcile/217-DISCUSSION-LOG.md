# Phase 217: Browse Geo_ID Reconcile - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-23
**Phase:** 217-browse-geo-id-reconcile
**Areas discussed:** Phase shape (stale premise), 5-city gap treatment

---

## Pre-discussion discovery

During scout, verified against production DB that the roadmap/REQUIREMENTS premise is
**stale**: `coverage.js` already carries the corrected geo_ids for all 5 flagged cities,
and all 24 Texas browse entries resolve to real governments with seated rosters. The
milestone was scoped against an 82-day-old memory snapshot (`project_collin_county_browse`)
rather than current code. The browse-resolution bug is already fixed. This reframed the
discussion from "how to implement the fix" to "how to run a phase whose work is already done."

---

## Phase Shape (given the premise is stale)

| Option | Description | Selected |
|--------|-------------|----------|
| Verify + document | Live spot-check 5 cities render, document corrected geo_id mapping, log 5-city gaps as follow-ups. No code/DB changes. | ✓ |
| Mark done, skip formal phase | Accept the discuss-time DB verification, flip REQUIREMENTS to met, jump to 218 with no 217 CONTEXT/plan. | |
| Re-audit whole milestone first | Re-verify 218/219/220 gaps against live DB before touching 217, in case they too came from stale memory. | |

**User's choice:** Verify + document
**Notes:** Recommended option. Closes COLLIN-BROWSE-01..04 honestly without fabricating
work. A quick per-phase DB re-verify for 218–220 was captured as a deferred recommendation
rather than a full re-audit now.

---

## 5-City Gap Treatment (Plano/Richardson/Prosper/Princeton/Van Alstyne)

| Option | Description | Selected |
|--------|-------------|----------|
| Log as follow-ups | Document the vacancies/zero-race/contact gaps as explicit follow-up notes; keep 217 scoped to browse-resolution per roadmap convention. | ✓ |
| Fix now in 217 | Expand 217 to seat vacancies, backfill races, fill contacts for the 5 cities now. | |

**User's choice:** Log as follow-ups
**Notes:** Recommended option, matches the roadmap's milestone-wide convention that gaps
in the 5 disjoint reconciled govs are documented, not absorbed. The 5 cities are outside
the 18-government set 218–220 operate on.

---

## Claude's Discretion

- Exact wording/location of the geo_id mapping doc and the follow-up-log format left to planning.

## Deferred Ideas

- Fix the 5-city gaps (vacancies/elections/contacts) in a later phase or a scoped 219/220 extension.
- Re-verify 218/219/220 gap lists against live DB before seeding (stale-premise warning).
- Correct the two stale memories (`project_collin_county_browse`, `project_v250_milestone_opened`).
