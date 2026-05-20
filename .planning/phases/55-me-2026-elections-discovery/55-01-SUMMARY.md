---
phase: 55
plan: "01"
subsystem: elections-data
tags: [maine, elections, migration, discovery, sql]
status: complete
completed: "2026-05-20"
duration: "~3 minutes"

dependency-graph:
  requires:
    - "51-me-statewide-officials: Governor/Collins/Pingree/Golden politician rows + external_ids"
    - "52-me-state-legislature: Maine chambers with election_method set"
    - "53-portland-city-structure: Portland geo_id 2360545"
  provides:
    - "essentials.elections: 3 rows (2026 Primary, 2026 General, 2027 Portland)"
    - "essentials.races: 8 rows (4 offices × primary+general)"
    - "essentials.race_candidates: 26 rows (Gov 13, Senate 3, ME-01 3, ME-02 5 + general seeds)"
    - "essentials.discovery_jurisdictions: 3 rows enabling Sunday cron sweep for ME"
  affects:
    - "55-02: Legislative race scaffolding depends on elections rows existing"
    - "Post-June-9 migration: D primary winners for Senate/ME-01/ME-02 general races"

tech-stack:
  added: []
  patterns:
    - "DO $$ DECLARE … BEGIN … END $$; pattern for multi-race migration"
    - "RETURNING id INTO v_race with IS NULL fallback SELECT for idempotency"
    - "WHERE NOT EXISTS pattern for race_candidates (no unique constraint)"
    - "ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING"

key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/183_me_2026_elections_foundation.sql"
  modified: []

decisions:
  - id: GOV-R-SOS-VERIFIED
    description: "Governor R candidate count corrected from 4 (research) to 8 (SOS xlsx verified)"
    rationale: "SOS xlsx FINAL 3.16.26 shows Bush, Charles, Jones, Libby, Mason, McCarthy, Midgley, Wessels = 8R; research had estimated 4R with LOW confidence flag"
  - id: CALABRESE-SMERIGLIO-EXCLUDED
    description: "Calabrese and Smeriglio excluded from US Senate race"
    rationale: "Neither appears in SOS primary xlsx (Collins is the only R) nor in non-party candidate list; excluded per SOS-only policy"
  - id: MIGRATION-RENUMBERED-183
    description: "Migration renumbered from 182 to 183"
    rationale: "182_drop_legacy_civic_spaces_views.sql already existed (unapplied); 183 avoids filename collision"
  - id: MILLS-EXCLUDED
    description: "Janet Mills excluded from US Senate candidates"
    rationale: "Confirmed: she filed (appears in March 16 xlsx) but withdrew April 30, 2026 per STATE.md; withdrawal PDF (Apr 14) doesn't show her because it predates her April 30 withdrawal"
  - id: SENATE-PRIMARY-3-CANDIDATES
    description: "US Senate primary has 3 candidates: Collins (R) + Costello (D) + Platner (D)"
    rationale: "SOS xlsx shows exactly these 3 active; Mills withdrew, Calabrese/Smeriglio not in SOS"

metrics:
  duration: "~3 minutes (2026-05-20T18:06:38Z — 2026-05-20T18:09:56Z)"
  completed: "2026-05-20"
---

# Phase 55 Plan 01: ME 2026 Elections Foundation Summary

**One-liner:** Migration 183 seeds 3 ME election rows, 8 statewide race rows, 26 SOS-verified candidates, and 3 discovery_jurisdictions rows to arm the Sunday cron for both 2026 Maine elections.

## What Was Built

Migration `183_me_2026_elections_foundation.sql` applied to production, establishing the elections infrastructure required by Plan 02's legislative race scaffolding.

### Elections Created (3 rows)

| Name | Date | Type | Level |
|------|------|------|-------|
| 2026 Maine State Primary | 2026-06-09 | primary | state |
| 2026 Maine General Election | 2026-11-03 | general | state |
| 2027 Portland Municipal Election | 2027-11-02 | general | city |

### Races Created (8 rows — 4 offices × primary + general)

| Office | Primary Candidates | General Candidates |
|--------|-------------------|--------------------|
| Governor of Maine | 13 (5D+8R) | 0 (winner TBD) |
| U.S. Senate Maine | 3 (Collins R + Costello D + Platner D) | 1 (Collins) |
| U.S. House ME-01 | 3 (Pingree D + Pietrowicz R + Russell R) | 1 (Pingree) |
| U.S. House ME-02 | 5 (Dunlap/Wood/Baldacci/Loud D + LePage R) | 0 (winner TBD) |

Total: 26 race_candidate rows.

### Discovery Jurisdictions Created (3 rows)

| GeoID | Name | Election Date | Days Until (from 2026-05-20) |
|-------|------|--------------|------------------------------|
| 23 | State of Maine | 2026-06-09 | 20 days (within 180-day window) |
| 23 | State of Maine | 2026-11-03 | 167 days (within 180-day window) |
| 2360545 | City of Portland, Maine | 2027-11-02 | 531 days (outside window — inactive until ~May 2027) |

Both 2026 ME elections will be swept by the next Sunday cron run (2026-05-24).

## Verification Results

All checks passed after applying migration 183:

```
ME elections count: 3
ME 2026 race count (<2027): 8
Total candidate rows (ME): 26
Discovery jurisdictions count (ME): 3
Mills in candidates: 0 (correct — excluded)
Golden as is_incumbent: 0 (correct — open seat)
Collins is_incumbent=true: 2 (primary + general, correct)
Gov primary candidates: 13 (SOS-verified)
ME-02 incumbents: 0 (correct — all open seat candidates)
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Migration renumbered 182 → 183**

- **Found during:** Task 1 pre-write check
- **Issue:** `182_drop_legacy_civic_spaces_views.sql` already existed in the migrations directory (unapplied). Using `182` would create a filename collision.
- **Fix:** Named file `183_me_2026_elections_foundation.sql` instead. The legacy views migration (182) remains unapplied and unaffected.
- **Files modified:** N/A (new file at 183)
- **Commit:** 4e4fbeb

**2. [Rule 1 - Bug] Governor R candidate count corrected from 4 to 8**

- **Found during:** Task 1 SOS pre-write verification
- **Issue:** Research estimated 5D+4R=9 total Governor candidates with LOW confidence on R count. SOS xlsx FINAL 3.16.26 shows 8 R candidates: Bush, Charles, Jones, **Libby**, Mason, **McCarthy**, **Midgley**, **Wessels** (4 additional R candidates not in research).
- **Fix:** Inserted all 8 R candidates (13 total Governor primary candidates).
- **Files modified:** 183_me_2026_elections_foundation.sql
- **Commit:** 4e4fbeb

**3. [Rule 1 - Bug] Calabrese and Smeriglio excluded from US Senate**

- **Found during:** Task 1 SOS pre-write verification
- **Issue:** Plan mentioned Carmen Calabrese and Daniel Smeriglio as R Senate challengers. Neither appears in the SOS primary xlsx or the non-party candidate list (5/18/2026). The only R Senate candidate is Collins herself.
- **Fix:** Excluded both; seeded only Collins (R), Costello (D), Platner (D).
- **Files modified:** 183_me_2026_elections_foundation.sql
- **Commit:** 4e4fbeb

**4. [Rule 1 - Bug] US Senate primary candidate count: 3 (not 5)**

- **Found during:** SOS verification
- **Issue:** Plan said "5 candidates (Collins + 4 challengers)". SOS shows Collins + Costello + Platner = 3 active (Mills withdrew, Calabrese/Smeriglio not in SOS).
- **Fix:** Seeded 3 candidates per SOS data.
- **Files modified:** 183_me_2026_elections_foundation.sql
- **Commit:** 4e4fbeb

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Migration 183 (not 182) | 182 filename taken by unapplied legacy views migration |
| Governor: 8R (not 4R) | SOS xlsx authoritative; 4 extra R candidates confirmed |
| Calabrese/Smeriglio excluded | Not found in any SOS list; cannot seed without citation |
| Mills excluded | Withdrew 2026-04-30 (after March 16 xlsx); STATE.md confirmed |
| Senate: 3 candidates (not 5) | SOS-only sourcing; no citation for 2 plan-listed candidates |

## Next Phase Readiness

Plan 55-02 (legislative race scaffolding for 372 ME legislature seats) can proceed immediately — the election rows it depends on now exist in production.

**Post-June-9 follow-up migration required:**
- Add D primary winner to US Senate general race
- Add R primary winner to ME-01 general race (if challenger beats Pingree — unlikely)
- Add D + R winners to ME-02 general race

**Portland 2027:** Discovery jurisdiction row exists but is outside the 180-day cron window until approximately May 2027. No action needed.
