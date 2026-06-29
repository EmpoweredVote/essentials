---
phase: 167-nv-2026-elections-discovery
verified: 2026-06-29T23:45:00Z
status: human_needed
score: 8/9 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Visit /elections with a NV address (e.g. 100 S. Casino Center Blvd, Las Vegas, NV 89101) — confirm the 2026 ballot renders with Governor, Senate/Assembly races for the correct district, and US House races"
    expected: "Page shows NV 2026 races appropriate to the address; no blank ballot; race count matches district (e.g. 1 Senate if that district is up, all 42 Assembly districts visible if applicable, 1 House race, 6 executive races)"
    why_human: "End-to-end geofence routing + elections page rendering depends on live frontend+backend deployment stack and cannot be verified by reading migration SQL alone"
---

# Phase 167: NV 2026 Elections & Discovery Verification Report

**Phase Goal:** Any NV user visiting /elections sees their 2026 ballot, and the discovery pipeline automatically finds NV candidates from official sources.
**Verified:** 2026-06-29T23:45:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Exactly one essentials.elections row named 'NV 2026 Statewide General' exists with state='NV', election_type='general', jurisdiction_level='state', election_date='2026-11-03' | VERIFIED | Migration 1111 confirmed in SQL (lines 18-22): correct literal values, NOT EXISTS guard; commit 4cb6294d; smoke test output recorded in 167-01-SUMMARY.md shows count=1 on first run and idempotency re-run |
| 2 | 63 essentials.races rows linked to the NV 2026 election (6 STATE_EXEC + 11 STATE_UPPER + 42 STATE_LOWER + 4 NATIONAL_LOWER) | VERIFIED | Migration 1112 SQL read directly: 4 INSERT blocks with correct VALUES lists (Districts 2,8,9,10,12,13,14,16,17,20,21 for Senate; 1-42 Assembly; geo_ids 3201-3204 House); commit c92f59b6; DO $$ post-verify block in SQL aborts transaction on any count mismatch; smoke output in 167-02-SUMMARY.md confirms 63/6/11/42/4 |
| 3 | Zero race rows have NULL office_id | VERIFIED | Migration 1112 DO $$ block asserts n_nulloff=0 and raises EXCEPTION if violated (lines 168-174); 5 ILIKE 'nv' guards on all district JOINs prevent silent NULL resolution; smoke test output "NV races with NULL office_id: 0 (expected 0)" |
| 4 | Zero race rows have non-NULL primary_party (antipartisan invariant) | VERIFIED | Migration 1112: primary_party is NULL literal in all 4 INSERT blocks; DO $$ block asserts n_party=0 (lines 176-182); smoke test output "NV races with non-NULL primary_party: 0 (expected 0)" |
| 5 | Senate races cover districts 2,8,9,10,12,13,14,16,17,20,21 (district 16 not 15) | VERIFIED | VALUES list in migration 1112 lines 62 reads explicitly: (2),(8),(9),(10),(12),(13),(14),(16),(17),(20),(21); smoke test output confirms "Senate District 16 present: YES" and "Senate District 15 absent: YES" |
| 6 | Neither of NV's two US Senators has a 2026 race row | VERIFIED | Migration 1112 contains no NATIONAL_UPPER INSERT block; only NATIONAL_LOWER for House districts 1-4; smoke test "NV US Senate races (should be 0): 0 (expected 0)"; 167-02-SUMMARY.md documents "Cortez Masto 2028, Rosen 2030" |
| 7 | One essentials.discovery_jurisdictions row exists for NV (geoid='32', election_date='2026-11-03', Ballotpedia source_url, 4-domain allowed_domains scoped list, no cron_active) | VERIFIED | Migration 1113 SQL lines 29-35: INSERT with VALUES ('32', 'State of Nevada', 'NV', '2026-11-03', 'https://ballotpedia.org/Nevada_elections,_2026', ARRAY['ballotpedia.org','nvsos.gov','nevada.gov','leg.state.nv.us']); no cron_active column; ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING; commit 2c3398a8 |
| 8 | A real discovery run completed (discovery_runs row status='completed', error_message=NULL) | VERIFIED | 167-03-SUMMARY.md records run id=1e5a2041-8d6c-4334-90e8-1fcdfdf56f15, status='completed', candidates_found=32, error_message=NULL, completed_at=2026-06-29 23:04:46 UTC; D-03 acceptance bar met (zero candidates is acceptable; 32 found) |
| 9 | A NV address on /elections returns the correct 2026 races for that jurisdiction | UNCERTAIN | SC-2 requires end-to-end UI routing. The seeding artifacts are in production and correct (migrations applied, races linked to offices). However, correct rendering also depends on frontend /elections page reading those rows via the backend, and that wiring cannot be verified by SQL inspection alone. |

**Score:** 8/9 truths verified (1 uncertain — human test required)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `C:/EV-Accounts/backend/migrations/1111_nv_2026_general_election.sql` | Idempotent INSERT of NV 2026 general election row | VERIFIED | File exists, 38 lines; NOT EXISTS guard; BEGIN/COMMIT; DO $$ post-verify; no schema_migrations INSERT; no cron_active; commit 4cb6294d |
| `C:/EV-Accounts/backend/migrations/1112_nv_2026_races.sql` | Idempotent INSERT of 63 NV 2026 race rows | VERIFIED | File exists, 187 lines; 4 INSERT blocks; ILIKE 'nv' on all 4 district JOINs; NOT EXISTS guards; DO $$ asserts 6/11/42/4=63 + NULL checks; no ON CONFLICT; no schema_migrations INSERT; commit c92f59b6 |
| `C:/EV-Accounts/backend/migrations/1113_nv_2026_discovery.sql` | Idempotent INSERT of NV discovery_jurisdictions row | VERIFIED | File exists, 54 lines; correct geoid/date/source_url/domains; ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING; DO $$ post-verify; no cron_active; no schema_migrations INSERT; commit 2c3398a8 |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| migration 1112 race INSERTs | essentials.elections row | JOIN el ON el.name = 'NV 2026 Statewide General' (literal string — matches 1111 name exactly) | WIRED | Read directly in migration SQL lines 47, 63, 87, 106 |
| migration 1112 race INSERTs | essentials.offices via essentials.districts | JOIN districts d (geo_id + district_type + d.state ILIKE 'nv') JOIN offices o ON o.district_id=d.id | WIRED | 5 ILIKE guards confirmed by grep; STATE_EXEC additionally discriminated by o.title = v.title |
| migration 1113 discovery_jurisdictions | essentials.discovery_runs (via discovery trigger) | POST /api/admin/discover/jurisdiction/:id with X-Admin-Token | WIRED | Trigger executed; discovery_runs row 1e5a2041 status='completed', candidates_found=32 |
| discovery trigger auth | ADMIN_INGEST_TOKEN env var | X-Admin-Token header, read from env only | WIRED | Token absent from all committed files; verified by grep of migration SQL + summaries; threat T-167-03-TOKEN mitigated |

---

### Data-Flow Trace (Level 4)

This is a pure data-seeding phase — no application source files were modified. Level 4 data-flow trace is not applicable. The artifacts are SQL migrations, not application components rendering dynamic data. The data flow question is: do the seeded rows contain real values (not stub/empty data)? All 63 race rows have non-NULL office_id (verified by DO $$ block), and the discovery run returned 32 real candidates (not 0), confirming end-to-end data flow.

---

### Behavioral Spot-Checks

| Behavior | Evidence | Status |
|----------|----------|--------|
| Migration 1111 idempotent (count stays 1 on re-run) | 167-01-SUMMARY.md: "Running the apply script a SECOND time still reports count 1 (no duplicate, no error)" | PASS |
| Migration 1112 produces 63 rows, 0 NULL office_id, 0 non-NULL primary_party | Smoke output in 167-02-SUMMARY.md: all 10 checks passed on first run and re-run | PASS |
| Migration 1112 idempotent (count stays 63 on re-run) | 167-02-SUMMARY.md: "re-running the apply script a second time leaves count at 63, no error" | PASS |
| Migration 1113 idempotent (count stays 1 on re-run via ON CONFLICT DO NOTHING) | 167-03-SUMMARY.md: "Idempotency confirmed — ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING; re-running keeps count at 1" | PASS |
| Real discovery run completes (status='completed', error_message NULL) | 167-03-SUMMARY.md: run 1e5a2041 status=completed, candidates_found=32, error_message=NULL, completed_at=2026-06-29 23:04:46 UTC | PASS |
| No admin token in committed artifacts | All 3 migration SQL files grep-verified: no token string present; token was env-only | PASS |

Step 7b: Behavioral spot-checks cannot be re-run from this environment (requires live DB access). Results above are drawn from executor-recorded smoke test output in SUMMARY.md files, which are consistent with the SQL logic read directly from committed migration files.

---

### Probe Execution

Step 7c: No `scripts/*/tests/probe-*.sh` files declared or found for this phase. The phase used apply scripts (`_apply-migration-111{1,2,3}.ts`) as its verification mechanism; those are gitignored (confirmed in SUMMARY.md) and ran at execution time. No probe-style shell scripts were declared.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| NV-ELEC-01 | 167-01, 167-02, 167-03 | NV 2026 elections seeded (Governor, all 42 Assembly, ~10 Senate, 4 US House); discovery pipeline armed; US Senators correctly absent | SATISFIED | Elections row (mig 1111) + 63 race rows (mig 1112) + discovery_jurisdictions (mig 1113) + completed discovery run — all confirmed in committed SQL and SUMMARY records |

**Roadmap success criteria cross-check:**

| SC | Text | Status |
|----|------|--------|
| SC-1 | NV 2026 election + race rows seeded — Governor, all 42 Assembly, ~10 Senate, 4 US House; US Senators absent | SATISFIED — 6 STATE_EXEC (Governor + 5 officers), 42 Assembly, 11 Senate, 4 House = 63 rows; 0 US Senate |
| SC-2 | NV address on /elections returns correct 2026 races | UNCERTAIN — seeding artifacts are in production and correct; end-to-end UI rendering requires human test |
| SC-3 | discovery_jurisdictions rows present; test discovery run completes against official NV source | SATISFIED — 1 NV row (geoid=32, Nov 2026, Ballotpedia source); run 1e5a2041 completed with 32 candidates found; "cron_active" wording in ROADMAP is stale (D-05 design decision: no such column; date-based horizon is correct and intentional) |

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| (none) | No TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER markers found in any of the 3 migration files | — | Clean |
| (none) | No schema_migrations INSERT in any migration (correct per D-08) | — | Clean |
| (none) | No cron_active column reference in migration 1113 (correct per D-05) | — | Clean |
| (none) | No ON CONFLICT in migration 1112 (correct per D-07 — races has no unique constraint) | — | Clean |

---

### Human Verification Required

#### 1. NV Address on /elections Returns Correct 2026 Ballot

**Test:** Open essentials.empowered.vote/elections with a Las Vegas, NV address (e.g. "100 S Casino Center Blvd, Las Vegas, NV 89101") and observe what ballot races are presented.

**Expected:** The ballot section shows NV 2026 races — at minimum: 1 Governor race, 1 race for the relevant Senate district (if that district is one of the 11 up in 2026), 1 Assembly race for the correct district, 1 US House race for the applicable CD, and the 5 other statewide executive races. No blank ballot or "no elections found" message.

**Why human:** End-to-end result depends on the live frontend routing the address through geofences to the correct district IDs, the backend joining those district IDs to races via offices, and the /elections page rendering the returned rows. All of those layers are pre-existing application code untouched by this phase. The seeding work this phase did is verified correct; the question is whether the existing routing correctly threads the needle from NV geofence to the seeded races. A stale backend deploy or any routing edge case would only be visible by actually running the page.

---

### Gaps Summary

No blocking gaps. All seeding artifacts (3 migrations, 3 commits) exist, are substantive, and are correctly wired. The migrations were applied to the live production DB and verified by in-transaction DO $$ assertions plus external smoke scripts. The discovery pipeline ran end-to-end with 32 candidates found.

The single uncertain item (Truth 9 / SC-2: /elections rendering for a NV address) is a UI integration check that cannot be confirmed from SQL alone. It is not a gap in the seeding work — it is a standard end-of-phase human UAT step for any new-state elections phase. The seeding foundation is correct and complete.

**Status: human_needed** — automated checks all pass (8/9 truths verified, 1 human-verify item remaining).

---

_Verified: 2026-06-29T23:45:00Z_
_Verifier: Claude (gsd-verifier)_
