---
phase: 55-me-2026-elections-discovery
verified: 2026-05-20T00:00:00Z
status: passed
score: 10/10 must-haves verified
gaps: []
---

# Phase 55: ME 2026 Elections + Discovery Pipeline — Verification Report

**Phase Goal:** Maine 2026 Primary and General election rows are seeded with known candidates, discovery_jurisdictions are armed for ongoing candidate discovery, and the cron sweep is verified active for Maine.
**Verified:** 2026-05-20
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | 2026 ME Primary (Jun 9) and General (Nov 3) election rows exist | VERIFIED | Both rows in essentials.elections with correct dates, type, level, state='ME' |
| 2 | Governor primary shows 13 SOS-confirmed candidates (5D+8R) | VERIFIED | 13 rows in race_candidates for Governor primary; D: Bellows/Jackson/King III/Shah/H.Pingree; R: Bush/Charles/Jones/Libby/Mason/McCarthy/Midgley/Wessels |
| 3 | US Senate shows Collins + Platner + Costello; Mills absent | VERIFIED | 3 candidates: Susan M. Collins (is_incumbent=true, linked), David Costello, Graham Platner; Mills=0 rows |
| 4 | ME-01 shows Pingree (incumbent); ME-02 shows open seat candidates | VERIFIED | ME-01: Pingree (incumbent, linked) + Pietrowicz + Russell; ME-02: Dunlap/Wood/Baldacci/Loud/LePage; no incumbents on ME-02 |
| 5 | 372 legislative race scaffold rows exist (35×2 + 151×2) | VERIFIED | Senate: 70 rows (35×2); House: 302 rows (151×2); all 372 have non-null office_id |
| 6 | discovery_jurisdictions rows (geoid='23') are active for both 2026 elections | VERIFIED | geoid=23 rows for 2026-06-09 (20 days out, IN SCOPE) and 2026-11-03 (167 days out, IN SCOPE) |
| 7 | Portland 2027 placeholder exists and is inactive by date | VERIFIED | geoid=2360545, election_date=2027-11-02, 531 days out — outside 180-day cron window |
| 8 | Total ME race rows = 380 (372 legislative + 8 statewide) | VERIFIED | COUNT(*)=380; 4 statewide positions × 2 elections = 8; 186 districts × 2 elections = 372 |
| 9 | No election_method column on races table | VERIFIED | Schema inspection: races columns are id/election_id/office_id/position_name/primary_party/seats/description/created_at/updated_at |
| 10 | No cron_active column on discovery_jurisdictions | VERIFIED | Schema inspection: discovery_jurisdictions columns are id/jurisdiction_geoid/jurisdiction_name/state/election_date/source_url/allowed_domains/created_at/updated_at |

**Score:** 10/10 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `essentials.elections` | 3 ME rows | VERIFIED | 2026 Primary, 2026 General, 2027 Portland |
| `essentials.races` | 380 ME rows | VERIFIED | 372 legislative + 8 statewide; all with correct election_id FK |
| `essentials.race_candidates` | 26 statewide rows | VERIFIED | Gov=13, Senate=4, ME-01=4, ME-02=5 |
| `essentials.discovery_jurisdictions` | 3 ME rows | VERIFIED | geoid=23 ×2 + geoid=2360545 ×1 |
| `183_me_2026_elections_foundation.sql` | Migration applied | VERIFIED | Elections, statewide races, 26 candidates, 3 discovery_jurisdictions rows |
| `184_me_2026_legislative_races.sql` | Migration applied | VERIFIED | 372 legislative race scaffold rows; UTF-8 NoBOM encoding |
| `src/cron/discoverySweep.ts` | Cron registered | VERIFIED | Runs Sunday 02:00 UTC; registered in index.ts line 182 |
| `src/lib/discoveryCron.ts` | 180-day window | VERIFIED | SWEEP_HORIZON_DAYS=180; query: election_date > now() AND election_date <= now()+180 |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| discoverySweep.ts | discoveryCron.ts | runDiscoverySweep() import | WIRED | Imported + called in cron handler |
| discoveryCron.ts | discovery_jurisdictions | pool.query WHERE election_date <= horizon | WIRED | Query confirmed; horizon = now() + 180 days |
| index.ts | discoverySweep.ts | startDiscoverySweepCron() | WIRED | Line 52 import, line 182 call inside NODE_ENV guard |
| race_candidates | politicians | politician_id FK | WIRED | Collins linked (is_incumbent=true), Bellows linked (ext=-230003), Pingree linked |
| races | offices | office_id FK | WIRED | All 372 legislative races have non-null office_id; 0 missing |
| races | elections | election_id FK | WIRED | ON DELETE CASCADE FK enforced; all 380 rows linked |

---

## Candidate Detail Verification

### Governor Primary (13 candidates — SOS verified)

Democrats (5): Shenna Bellows (politician linked), Troy Jackson, Angus King III, Nirav Shah, Hannah Pingree

Republicans (8): Jonathan Bush, Robert Charles, David Jones, James Libby, Garrett Mason, Owen McCarthy, Benjamin Midgley, Robert Wessels

Janet Mills: **absent** (withdrew 2026-04-30 — confirmed)

### US Senate Primary (3 candidates)

- Susan M. Collins — R, is_incumbent=true, politician linked
- David Costello — D, not incumbent
- Graham Platner — D, not incumbent

Calabrese/Smeriglio: **absent** (not in SOS primary xlsx — correct exclusion)

### ME-01 Primary (3 candidates)

- Chellie Pingree — D, is_incumbent=true, politician linked
- Joshua Pietrowicz — R
- Ronald Russell — R

### ME-02 Primary (5 candidates — open seat)

- Matt Dunlap, Jordan Wood, Joe Baldacci, Paige Loud — D (all is_incumbent=false)
- Paul LePage — R (is_incumbent=false)

Jared Golden: **absent** (ME-02 open seat — Golden not running in 2026 — correct)

---

## Discovery Cron Scope

| geoid | Jurisdiction | Election Date | Days Until | Cron Status |
|-------|-------------|---------------|-----------|-------------|
| 23 | State of Maine | 2026-06-09 | 20 days | IN SCOPE (next Sunday 2026-05-24) |
| 23 | State of Maine | 2026-11-03 | 167 days | IN SCOPE |
| 2360545 | City of Portland, Maine | 2027-11-02 | 531 days | OUT OF SCOPE (inactive until ~May 2027) |

---

## Anti-Patterns Found

None. No placeholder candidates, stub races, or TODO patterns detected in migrations 183/184 or cron implementation.

---

## Human Verification Required

None for automated goals. Optional post-June-9 follow-up:

After 2026-06-09 primary results are certified, migration 185 must seed Democratic winners into:
- US Senate Maine general race (winner from Costello vs. Platner)
- ME-02 general race (winner from Dunlap/Wood/Baldacci/Loud D primary)

This is a known, documented future action — not a gap in phase 55.

---

## Summary

Phase 55 goal is fully achieved. All 10 must-haves verified against live database state:

- 3 election rows exist with correct dates and metadata
- 380 race rows structured correctly (372 legislative + 8 statewide)
- 26 SOS-verified statewide candidates seeded with correct incumbent flags and politician links
- 3 discovery_jurisdictions rows armed; both 2026 ME elections fall within the 180-day cron window
- Portland 2027 is naturally inactive by date — no cron_active column needed
- Cron is registered in index.ts, runs Sunday 02:00 UTC, and queries discovery_jurisdictions with the 180-day horizon
- No election_method on races table; no cron_active on discovery_jurisdictions — schema is clean

---

_Verified: 2026-05-20_
_Verifier: Claude (gsd-verifier)_
