---
phase: 83-multnomah-county-government-routing
plan: "01"
subsystem: database/seeding
tags: [multnomah-county, oregon, government-seeding, county-routing, migration, smoke-test]
dependency_graph:
  requires:
    - Phase 72 OR TIGER geofences (G4020 geo_id=41051 already loaded)
    - Phase 73 OR government chambers (State of Oregon row exists)
  provides:
    - essentials.governments row for Multnomah County (id=ad7f068e-7628-4e9e-b032-5d688b804239)
    - essentials.chambers row for Board of Commissioners (id=57ac3d4d-7769-4a7a-af84-e2d22a6a109c)
    - essentials.districts COUNTY row (id=37b846d3-d1a1-4f02-8b5b-f63e87983bad, geo_id=41051)
    - 5 politician rows (external_ids -410001, -410010..-410013)
    - 5 office rows linked to COUNTY district
    - smoke-multnomah-county.ts routing smoke test
  affects:
    - Any Multnomah County address now returns 5 COUNTY commissioner rows in districtQueryText
    - Unincorporated Multnomah County addresses show county + state + federal reps (no empty LOCAL section)
tech_stack:
  added: []
  patterns:
    - WITH ins_p CTE pattern for politician + office atomicity (from 231_portland_officials.sql)
    - WHERE NOT EXISTS idempotency guard on governments + chambers + districts (no unique constraints)
    - ON CONFLICT (external_id) DO NOTHING on politicians
    - Post-verification DO block with RAISE EXCEPTION gates (3 gates)
    - districts.state='or' lowercase for COUNTY type (routing query match)
key_files:
  created:
    - C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql
    - C:/EV-Accounts/backend/scripts/smoke-multnomah-county.ts
    - C:/EV-Accounts/backend/scripts/_apply-migration-244.ts
  modified: []
decisions:
  - "5 officials total (not 6): Chair + 4 Commissioners; roadmap 'Chair + 5 = 6' is a count error"
  - "All 5 offices link to single COUNTY district (geo_id=41051) — per-district sub-geofences deferred to future scope"
  - "Corbett OR coordinate (-122.2, 45.5) verified against DB: G4020 present, G4110 absent"
  - "districts.state='or' (lowercase) confirmed correct for COUNTY type by querying existing OR district rows"
metrics:
  duration: "~30 minutes"
  completed: "2026-05-31"
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 0
---

# Phase 83 Plan 01: Multnomah County Government + Routing Summary

**One-liner:** Multnomah County Board of Commissioners seeded via migration 244 with 5 elected officials (Chair Vega Pederson + Commissioners D1-D4) linked to COUNTY district (geo_id=41051), enabling county-level routing for both Portland addresses and unincorporated Multnomah County addresses.

## What Was Built

### Migration 244 (applied to production Supabase)

File: `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql`

Applied as a single BEGIN/COMMIT transaction containing:

1. **Pre-flight DO block**: RAISE NOTICE if government row already exists
2. **Government row INSERT**: `'Multnomah County, Oregon, US'` (type='County', state='OR', geo_id='41051') with WHERE NOT EXISTS guard
3. **Chamber INSERT**: `'Board of Commissioners'` (name_formal='Multnomah County Board of Commissioners') — slug omitted (GENERATED ALWAYS), WHERE NOT EXISTS guard
4. **COUNTY district INSERT**: geo_id='41051', mtfcc='G4020', state='or' (lowercase), district_type='COUNTY', label='Multnomah County' — WHERE NOT EXISTS guard
5. **5 politician + office CTE blocks** (one per official, WITH ins_p pattern)
6. **office_id back-fill**: UPDATE politicians SET office_id WHERE external_id BETWEEN -410013 AND -410001
7. **Post-verification DO block**: 3 gates that RAISE EXCEPTION on failure
8. **Ledger entry**: version='244'

### Smoke Test (smoke-multnomah-county.ts)

File: `C:/EV-Accounts/backend/scripts/smoke-multnomah-county.ts`

Tests 4 success criteria:
- SC1: Portland City Hall boundary check (G4020 + G4110 both present)
- SC2: Portland City Hall returns exactly 5 COUNTY commissioner names
- SC3: Corbett OR (unincorporated) returns G4020 only, NO G4110, + 5 commissioners
- SC4: Section-split check (0 orphans for geo_id=41051)

## Production DB State After Migration

### IDs

| Entity | ID |
|--------|-----|
| Government (Multnomah County, Oregon, US) | ad7f068e-7628-4e9e-b032-5d688b804239 |
| Chamber (Board of Commissioners) | 57ac3d4d-7769-4a7a-af84-e2d22a6a109c |
| COUNTY district (geo_id=41051) | 37b846d3-d1a1-4f02-8b5b-f63e87983bad |

### Politicians + Offices

| external_id | full_name | politician_id | office_id | title |
|-------------|-----------|---------------|-----------|-------|
| -410001 | Jessica Vega Pederson | 27f6b552-0e36-429a-a6fd-bb7108b80b35 | 4b4821cf-9a97-4044-8132-706290d22e27 | County Chair |
| -410010 | Meghan Moyer | bfaf8f7d-59f9-4747-925b-c546d84b58ad | 1c0cc8d8-3f2f-4ca8-b347-d63bf965c929 | Commissioner (District 1) |
| -410011 | Shannon Singleton | 9c2b5568-9201-4d99-95e3-f2ecc1eaf2d3 | 3f01e9e8-bac6-4f0c-9793-ed14fbe2b22b | Commissioner (District 2) |
| -410012 | Julia Brim-Edwards | 0e37f57f-ccdb-4a6c-90b9-8f5fd7410080 | d86184f8-b07d-4e21-a57b-c97cd4834f45 | Commissioner (District 3) |
| -410013 | Vince Jones-Dixon | 28a723ed-300a-4ed6-8454-fca5bdb4ae4a | bcfd62a9-4a8f-4e36-b37c-0aee92511feb | Commissioner (District 4) |

### Smoke Test Output (full stdout)

```
=== Pre-flight: Phase 72 G4020 geofence integrity ===
  G4020 row confirmed: geo_id=41051  name=Multnomah County  state=41

=== Pre-flight: Corbett OR coordinate validation ===
  Corbett coordinate confirmed: G4020 present, G4110 absent

=== SC1/SC3: Boundary tests ===

--- Portland OR City Hall (-122.6794, 45.5231) ---
  G4020  geo_id=41051  name=Multnomah County
  G4110  geo_id=4159000  name=Portland city
  G5200  geo_id=4101  name=Congressional District 1
  G5210  geo_id=41017  name=State Senate District 17
  G5220  geo_id=41033  name=State House District 33
  X0012  geo_id=portland-or-council-district-4  name=District 4
  OK: G4020 present
  OK: G4110 present
  OK: G4020 geo_id=41051 (Multnomah County)
  OK: G4110 geo_id=4159000 (Portland city)

--- Corbett OR (unincorporated Multnomah County) (-122.2, 45.5) ---
  G4020  geo_id=41051  name=Multnomah County
  G5200  geo_id=4103  name=Congressional District 3
  G5210  geo_id=41026  name=State Senate District 26
  G5220  geo_id=41052  name=State House District 52
  OK: G4020 present
  OK: G4110 absent (correct — no city boundary at this address)

=== SC2: Portland City Hall COUNTY officials ===
  Returned 5 COUNTY officials (expected 5):
    Jessica Vega Pederson (COUNTY)
    Julia Brim-Edwards (COUNTY)
    Meghan Moyer (COUNTY)
    Shannon Singleton (COUNTY)
    Vince Jones-Dixon (COUNTY)
  SC2: All 5 commissioner names match expected set [PASS]

=== SC3: Corbett OR COUNTY officials ===
  Returned 5 COUNTY officials (expected 5):
    Jessica Vega Pederson (COUNTY)
    Julia Brim-Edwards (COUNTY)
    Meghan Moyer (COUNTY)
    Shannon Singleton (COUNTY)
    Vince Jones-Dixon (COUNTY)
  SC3: All 5 commissioner names match expected set at unincorporated address [PASS]

=== SC4: Section-split check (geo_id='41051') ===
  SC4: Section-split check OK (COUNTY district row present for geo_id='41051')

=== Smoke Test Results ===
ALL ASSERTIONS PASSED

Phase 83 success criteria:
  SC1: Portland City Hall returns G4020 (41051) + G4110 (4159000) [PASS]
  SC2: Portland City Hall returns exactly 5 COUNTY commissioner names [PASS]
  SC3: Corbett OR (unincorporated) returns G4020 only + 5 COUNTY officials, NO G4110 [PASS]
  SC4: Section-split check — 0 orphans for geo_id=41051 [PASS]
```

## Post-Apply SQL Gate Results

| Gate | Query | Result | Expected | Status |
|------|-------|--------|----------|--------|
| Government row | COUNT(*) FROM governments WHERE name='Multnomah County, Oregon, US' | 1 | 1 | PASS |
| Chamber row | COUNT(*) FROM chambers WHERE name='Board of Commissioners' AND gov_id=... | 1 | 1 | PASS |
| COUNTY district | COUNT(*) FROM districts WHERE geo_id='41051' AND district_type='COUNTY' AND state='or' | 1 | 1 | PASS |
| Politicians | COUNT(*) FROM politicians WHERE external_id IN (-410001,..) | 5 | 5 | PASS |
| Offices | COUNT(*) FROM offices JOIN districts WHERE geo_id='41051' AND district_type='COUNTY' | 5 | 5 | PASS |
| office_id back-fill | COUNT(*) WHERE external_id IN (..) AND office_id IS NOT NULL | 5 | 5 | PASS |
| Ledger entry | COUNT(*) FROM schema_migrations WHERE version='244' | 1 | 1 | PASS |
| Section-split | Orphan detector for geo_id='41051' | 0 | 0 | PASS |

Idempotency confirmed: all 8 counts unchanged after second apply.

## Deviations from Plan

### Plan Count Discrepancy (Roadmap vs. RESEARCH)

The plan objective notes the roadmap says "6 seats" but RESEARCH confirms 1 Chair + 4 Commissioners = 5 seats. This plan implements the verified 5-seat structure. The roadmap text is wrong; the plan already documented this reconciliation. No new deviation.

### Corbett Coordinate Verified (Assumption Resolved)

RESEARCH.md marked the Corbett coordinate (-122.2, 45.5) as `[ASSUMED]`. Pre-flight DB query confirmed: G4020 present (geo_id=41051), G4110 absent. The assumed coordinate is correct — no update needed to TEST_ADDRESSES.

## Commits

| Task | Commit | Files | Description |
|------|--------|-------|-------------|
| Task 1 | `796f4b0` | `migrations/244_multnomah_county_government.sql`, `scripts/_apply-migration-244.ts` | Migration 244 + apply script |
| Task 2 | `f36ef44` | `scripts/smoke-multnomah-county.ts` | Routing smoke test (4 SC all PASS) |

Both commits in the EV-Accounts repo (C:/EV-Accounts).

## Requirements Satisfied

| ID | Description | Status |
|----|-------------|--------|
| COUNTY-01 | Multnomah County Board of Commissioners government body created (geo_id=41051) | SATISFIED |
| COUNTY-02 | 5 commissioners + chair seeded with offices linked to county geo_id | SATISFIED |
| ROUTING-01 | Unincorporated addresses see county+state+federal reps; no empty LOCAL section | SATISFIED |

COUNTY-03 (headshots) is addressed in a separate plan.

## Known Stubs

None. All 5 politicians are fully seeded with real name data from multco.us. Headshots are deferred to plan 83-02 (COUNTY-03) as designed — this is explicit plan scope, not a stub.

## Threat Flags

No new security-relevant surface introduced. Migration writes to essentials schema under developer-privileged DB connection. DATABASE_URL is developer-local via dotenv; smoke test never logs it.

## Self-Check: PASSED

- [x] `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql` — exists
- [x] `C:/EV-Accounts/backend/scripts/smoke-multnomah-county.ts` — exists
- [x] Migration applied to production Supabase — confirmed via _apply-migration-244.ts output
- [x] Smoke test exits 0 with ALL ASSERTIONS PASSED — confirmed above
- [x] Commit `796f4b0` exists in EV-Accounts repo — confirmed
- [x] Commit `f36ef44` exists in EV-Accounts repo — confirmed
- [x] Idempotency verified: second apply produces same counts — confirmed
