---
phase: 167-nv-2026-elections-discovery
plan: 02
subsystem: database
tags: [postgres, migrations, elections, nevada, races]

# Dependency graph
requires:
  - phase: 167-01
    provides: essentials.elections row 'NV 2026 Statewide General' (election_id FK anchor for all 63 races)
provides:
  - 63 essentials.races rows linked to 'NV 2026 Statewide General' (6 STATE_EXEC + 11 STATE_UPPER + 42 STATE_LOWER + 4 NATIONAL_LOWER)
  - migration 1112 applied to live Supabase DB
  - idempotent race INSERT pattern with NOT EXISTS guard on (election_id, office_id)
affects:
  - 167-03 (discovery migration — the race rows are the target scaffold for candidate discovery)
  - /elections page: NV users will see all 63 2026 ballot races

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Race INSERT via VALUES list + JOIN districts (by geo_id + district_type + ILIKE 'nv') + JOIN offices — no ON CONFLICT"
    - "STATE_EXEC resolution: JOIN on office title within single-geo_id='32' STATE_EXEC district"
    - "ILIKE 'nv' mandatory on every districts JOIN (mixed-casing trap D-09)"
    - "NOT EXISTS guard on (election_id, office_id) for all race INSERTs"
    - "DO $$ post-verify block asserting 6+11+42+4=63, 0 NULL office_id, 0 non-NULL primary_party"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/1112_nv_2026_races.sql
    - C:/EV-Accounts/backend/scripts/_apply-migration-1112.ts
  modified: []

key-decisions:
  - "STATE_EXEC resolution by office title (not external_id): all 6 offices share geo_id='32' district, so title is the discriminator ('Governor', 'Lieutenant Governor', 'Attorney General', 'Secretary of State', 'Treasurer', 'Controller')"
  - "position_name strings are free-text display labels independent of office title: 'Governor of Nevada', 'Lieutenant Governor of Nevada', etc. — plan wording adopted as-is"
  - "geo_id derivation for STATE_UPPER/STATE_LOWER: '320' || lpad(dn::text, 2, '0') correctly maps district 2 → '32002', district 42 → '32042' (verified Task 0)"
  - "Senate districts verified: 2,8,9,10,12,13,14,16,17,20,21 — district 16 (Krasner, 2026 cycle), NOT district 15 (Taylor, 2028 cycle)"
  - "NV's 2 US Senators intentionally absent: Cortez Masto 2028, Rosen 2030"
  - "No schema_migrations ledger INSERT — matches 1109 pattern; on-disk counter authoritative (next migration 1113)"

requirements-completed: [NV-ELEC-01]

# Metrics
duration: 25min
completed: 2026-06-29
---

# Phase 167 Plan 02: NV 2026 Race Rows — Summary

**63 NV 2026 race rows seeded across 4 tiers (6 STATE_EXEC + 11 STATE_UPPER + 42 STATE_LOWER + 4 NATIONAL_LOWER), all with non-NULL office_id and NULL primary_party, idempotent, no US Senate races**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-06-29T22:15:00Z
- **Completed:** 2026-06-29T22:40:00Z
- **Tasks:** 2 (Task 0 pre-check read-only + Task 1 write/apply)
- **Files modified:** 1 (migration SQL committed; apply script gitignored)

## Accomplishments

- Migration 1112 applied to live production Supabase DB — exactly 63 `essentials.races` rows linked to `NV 2026 Statewide General`
- All 4 tiers verified: STATE_EXEC=6, STATE_UPPER=11, STATE_LOWER=42, NATIONAL_LOWER=4
- 0 rows with NULL office_id (D-09 threat mitigated by ILIKE guard + DO $$ post-verify)
- 0 rows with non-NULL primary_party (antipartisan invariant D-05)
- Senate districts verified correct: 02,08,09,10,12,13,14,16,17,20,21 — district 16 present, district 15 absent
- NV's 2 US Senators absent: 0 NATIONAL_UPPER races for this election (Cortez Masto 2028, Rosen 2030)
- Idempotency confirmed — re-running the apply script a second time leaves count at 63, no error
- No `supabase_migrations.schema_migrations` ledger row written — matches 1109 pattern; next migration counter is 1113

## Task 0: Pre-Check Results (Verified Live DB)

All geo_id formats and office-resolution conditions confirmed before writing any SQL:

| Tier | geo_id format | district_type | Notes |
|------|--------------|--------------|-------|
| STATE_EXEC | `'32'` | `STATE_EXEC` | All 6 offices share this single district; resolved by `o.title` |
| STATE_UPPER | `'32001'..'32021'` | `STATE_UPPER` | Format: `'320' || lpad(dn::text, 2, '0')`; 21 total, 11 up in 2026 |
| STATE_LOWER | `'32001'..'32042'` | `STATE_LOWER` | Same geo_id format as UPPER, different district_type |
| NATIONAL_LOWER | `'3201'..'3204'` | `NATIONAL_LOWER` | 4-char format; hardcoded VALUES list |

**STATE_EXEC office titles (verbatim from DB):**
- 'Attorney General', 'Controller', 'Governor', 'Lieutenant Governor', 'Secretary of State', 'Treasurer'
- position_name strings in migration use full-form: 'Attorney General of Nevada', 'State Controller of Nevada', 'Governor of Nevada', 'Lieutenant Governor of Nevada', 'Secretary of State of Nevada', 'State Treasurer of Nevada'

**All 11 Senate target districts confirmed:** each of geo_ids 32002, 32008, 32009, 32010, 32012, 32013, 32014, 32016, 32017, 32020, 32021 has exactly 1 active office.

**All 42 Assembly districts confirmed:** all 42 STATE_LOWER districts have exactly 1 office each.

**All 4 House districts confirmed:** geo_ids 3201–3204 each have exactly 1 NATIONAL_LOWER office.

**STATE_EXEC sanity:** count returned 6 (acceptance criteria ≥6 exact).

## Task Commits

1. **Task 1: Write migration 1112 (63 NV 2026 race rows) + paired apply/smoke script** - `c92f59b6` in C:/EV-Accounts (feat)

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/1112_nv_2026_races.sql` — Idempotent INSERT of 63 NV 2026 race rows across 4 tiers; NOT EXISTS guard on (election_id, office_id); DO $$ post-verify block aborting transaction on any failure; BEGIN/COMMIT; no ON CONFLICT; no ledger INSERT; ILIKE 'nv' on every districts JOIN
- `C:/EV-Accounts/backend/scripts/_apply-migration-1112.ts` — Apply + smoke-test harness: 9 checks (total=63, 4 tier counts, NULL office_id=0, primary_party=0, US Senate=0, D16 present, D15 absent); gitignored (not committed)

## Decisions Made

- **STATE_EXEC resolution by office title**: All 6 statewide executives share a single district row (geo_id='32', district_type='STATE_EXEC'). The VALUES list pairs each office title (from DB) with its display position_name string, then JOINs `offices o ON o.district_id = d.id AND o.title = v.title`. This cleanly resolves each of the 6 offices without any ambiguity.
- **geo_id derivation expression**: `'320' || lpad(v.dn::text, 2, '0')` produces the correct 5-char geo_id for both STATE_UPPER (max district 21) and STATE_LOWER (max district 42) tiers. This was verified against live DB data before writing the migration (Task 0 pre-check).
- **District 16 not 15**: The 11 Senate districts up in 2026 were hardcoded from the plan (verified from leg.state.nv.us + NVSoS cross-check in research). District 16 (Krasner) is the 2026 cycle; district 15 (Taylor) is the 2028 cycle. Confirmed by spot-check smoke tests.
- **No schema_migrations ledger INSERT**: Matches the 1109 canonical pattern (D-08). On-disk counter (1112) is authoritative.

## Deviations from Plan

None — plan executed exactly as written.

**Note on Task 0:** Task 0 is a read-only pre-check (no files written, no commit). The PATTERNS.md noted geo_id formats as LOW-confidence (A4); Task 0 confirmed them from the live DB. No correction to planned approach was needed — the assumed format '32002' for Senate District 2 was correct.

## Smoke Test Results

All smoke tests passed on both first run and idempotency re-run:

```
Migration 1112 applied successfully
Total NV 2026 races: 63 (expected 63)
NV STATE_EXEC (statewide execs): 6 (expected 6)
NV STATE_UPPER (Senate): 11 (expected 11)
NV STATE_LOWER (Assembly): 42 (expected 42)
NV NATIONAL_LOWER (US House): 4 (expected 4)
NV races with NULL office_id: 0 (expected 0)
NV races with non-NULL primary_party: 0 (expected 0)
NV US Senate races (should be 0): 0 (expected 0)
Senate District 16 present: YES (expected YES)
Senate District 15 absent: YES (correct) (expected YES)
```

psql tier breakdown verified:
```
 district_type  | count
----------------+-------
 NATIONAL_LOWER |     4
 STATE_EXEC     |     6
 STATE_LOWER    |    42
 STATE_UPPER    |    11
```

Senate position_names verified: Districts 02,08,09,10,12,13,14,16,17,20,21 — no District 15.

## Known Stubs

None — all 63 race rows have non-NULL office_id, NULL primary_party, seats=1, and are fully populated. Position_names are display strings following the established convention for each tier.

## Threat Flags

No new externally-reachable surface introduced. This is a hardcoded-literal operator migration with no user input crossing any trust boundary. The T-167-02-INT (data integrity) threat was mitigated by mandatory `ILIKE 'nv'` on all district JOINs + the DO $$ post-verify block asserting 0 NULL office_id rows.

## Next Phase Readiness

- Plan 03 (migration 1113: discovery_jurisdictions) can proceed — the 63 race rows are in production
- Next migration counter is 1113

## Self-Check: PASSED

- [x] `C:/EV-Accounts/backend/migrations/1112_nv_2026_races.sql` — confirmed created (187 lines)
- [x] `C:/EV-Accounts/backend/scripts/_apply-migration-1112.ts` — confirmed created (83 lines, gitignored)
- [x] Commit `c92f59b6` exists in C:/EV-Accounts master branch (verified via git commit output)
- [x] Apply script exits 0 with total=63 on first run and re-run (idempotency verified)
- [x] 0 NULL office_id, 0 non-NULL primary_party — both verified by apply script + DO $$ block
- [x] Senate districts: 16 present, 15 absent — verified by smoke tests 9/10
- [x] No `ON CONFLICT` in SQL (comment line only, not a statement) — verified by grep
- [x] No `schema_migrations` INSERT in SQL (comment line only) — verified by grep
- [x] 5 ILIKE guards in migration — verified by grep count
- [x] Next migration counter is 1113

---
*Phase: 167-nv-2026-elections-discovery*
*Completed: 2026-06-29*
