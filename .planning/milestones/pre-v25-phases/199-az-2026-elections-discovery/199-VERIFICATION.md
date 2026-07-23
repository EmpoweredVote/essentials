---
phase: 199-az-2026-elections-discovery
verified: 2026-07-17T00:00:00Z
status: human_needed
score: 13/13 must-haves verified
overrides_applied: 2
overrides:
  - must_have: "Confirmed candidate slate populated for races where filing has closed"
    reason: "Post-research D-01 REVISED (user-accepted): primary is 2026-07-21, 4 days out, so filed slates are contested-primary fields that go stale immediately. Phase ships as PURE STRUCTURE (elections rows + 73 new race shells + discovery arming, zero hand-seeded candidates). The 39 pre-existing US House candidates are retained. A post-07-21 reconcile phase seeds general-election nominees once resolved. User confirmed 'use corrected facts' + 'shells now + post-07-21 reconcile' (199-CONTEXT post_research_updates)."
    accepted_by: "alincoln (user)"
    accepted_at: "2026-07-17T00:00:00Z"
  - must_have: "discovery_jurisdictions rows armed with the AZ election-authority domain allowlist and cron_active=true"
    reason: "Post-research D-08 (user-accepted): no cron_active column exists in essentials.discovery_jurisdictions (confirmed by information_schema — columns are id, jurisdiction_geoid, jurisdiction_name, state, election_date, source_url, allowed_domains, created_at, updated_at). The requirement wording is loose; the discovery cron arms any row whose election_date is within the 180-day window (discoveryCron.ts SWEEP_HORIZON_DAYS=180). Arming is date-driven, not flag-driven. The allowlist portion of the SC IS fully satisfied (4 rows, 5-domain allowlist each)."
    accepted_by: "alincoln (user)"
    accepted_at: "2026-07-17T00:00:00Z"
human_verification:
  - test: "Load /results for a Pima/Tucson-metro AZ street address and open a seats=2 race (Arizona Corporation Commission or any State House District N)."
    expected: "The race renders as a multi-winner (2-seat) contest without error — it must NOT mis-render as a single-winner race. These are the first AZ seats>1 races; the UI/cron seats>1 assumption was previously unverified (Open Q2)."
    why_human: "End-to-end UI render cannot be confirmed by SQL asserts. The programmatic attach path + seats=2 storage are proven (rolled-back throwaway round-trip; seats is never a fetch filter in electionService.ts), so render risk is low — but visual confirmation is owed."
deferred:
  - truth: "General-election nominee candidate slate seeded for legislative + local + statewide races"
    addressed_in: "Post-07-21 reconcile phase (owed; also owed for Ph197/198)"
    evidence: "199-CONTEXT post_research_updates D-01 REVISED: 'A post-07-21 reconcile phase seeds general-election nominees once resolved.' Confirmed candidate filing for the 2026 primary closes/resolves after 2026-07-21."
---

# Phase 199: AZ 2026 Elections & Discovery — Verification Report

**Phase Goal:** Any AZ resident can see their 2026 ballot for statewide, federal, legislative, and Tucson-metro local races, with discovery running to keep candidate rosters current.
**Verified:** 2026-07-17
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

This is a data-seed phase against LIVE production Supabase (`essentials` schema). Verification was performed by querying production directly (read-only SELECTs via a temporary pg script using the EV-Accounts DATABASE_URL, since the MCP supabase tool was unavailable this session; script removed after run) and by reading all 5 migration SQL files. SUMMARY claims were treated as unproven until confirmed against prod. **Every SUMMARY claim matched production.**

### Observable Truths

| # | Truth | Status | Evidence (actual prod value) |
|---|-------|--------|------------------------------|
| 1 | `essentials.elections` WHERE state='AZ' → 2 rows (primary 2026-07-21 + general 2026-11-03); primary NOT 2026-08-04 | ✓ VERIFIED | 2 rows: `AZ 2026 Statewide Primary` (primary, **2026-07-21**), `AZ 2026 Statewide General` (general, 2026-11-03) |
| 2 | Total races under the general = 82 | ✓ VERIFIED | `COUNT(*)` = **82** (9 US House + 6 statewide + 1 corp + 30 senate + 30 house + 6 local) |
| 3 | Zero NULL office_id among all races under the general | ✓ VERIFIED | null_office = **0** |
| 4 | Corp Commission = exactly 1 race, seats=2, office chains to district_type='STATE_EXEC' | ✓ VERIFIED | 1 row `Arizona Corporation Commission`, seats=**2**, district_type=**STATE_EXEC**, chamber=Corporation Commission |
| 5 | 30 'State Senate District %' (seats=1) + 30 'State House District %' (seats=2) shells | ✓ VERIFIED | senate seats=1: **30** (0 bad); house seats=2: **30** (0 bad); districts 1–30 both chambers |
| 6 | Exactly 6 local shells (specified set); zero '%Supervisor%'; zero Tucson Mayor/Ward | ✓ VERIFIED | 6 local: S.Tucson CC(3), OV Mayor(1), OV Council(3), Marana Mayor(1), Marana Council(4), Sahuarita Council(3); Supervisor=**0**, Tucson city=**0** |
| 7 | race_candidates under the general = 39 (pure structure, none hand-seeded) | ✓ VERIFIED | **39** (unchanged; matches pre-existing US House slate) |
| 8 | discovery_jurisdictions IN ('04','04019') → 4 rows, each allowlist len=5, dates ∈ {2026-07-21, 2026-11-03}; no cron_active column | ✓ VERIFIED | **4 rows** (State of Arizona ×2, Pima County ×2), each dom_len=**5**, dates 2026-07-21/2026-11-03; no `cron_active` column in schema |
| 9 | Ledger versions 1372–1376 all present | ✓ VERIFIED | schema_migrations has **1372, 1373, 1374, 1375, 1376** |
| 10 | No throwaway/test candidate left behind (`__PHASE199_GATE_THROWAWAY__` = 0) | ✓ VERIFIED | count = **0** (rollback clean) |
| 11 | SC1: 2026 race shells seeded for statewide, all 9 US House, all 90 legislative seats, Tucson-metro local | ✓ VERIFIED | Statewide 6 + Corp; 9 US House present; 90 legislative seats modeled as 60 races (30 senate×1 + 30 house×2 = 90 seats); 6 confirmed local (Pima BoS excluded — not on 2026 ballot; Tucson city excluded — odd-year) |
| 12 | SC2: Confirmed candidate slate populated for races where filing has closed | PASSED (override) | Override: pure-structure phase, no hand-seed; primary 4 days out → slates stale; 39 US House candidates retained; post-07-21 reconcile deferred — accepted by alincoln (user) on 2026-07-17 |
| 13 | SC3: discovery_jurisdictions armed with allowlist and cron_active=true | PASSED (override) | Override: no cron_active column exists; date-window arming (180-day); allowlist portion fully satisfied — accepted by alincoln (user) on 2026-07-17 |

**Score:** 13/13 truths verified (11 direct + 2 override)

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | General-election nominee candidate slate | Post-07-21 reconcile phase (owed) | 199-CONTEXT D-01 REVISED: "post-07-21 reconcile phase seeds general-election nominees once resolved" |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `C:/EV-Accounts/backend/migrations/1372_az_2026_primary_election.sql` | Primary election row + ledger | ✓ VERIFIED | Idempotent INSERT, `ON CONFLICT (name, election_date, state)`, DO$$ verify, `VALUES ('1372')` |
| `1373_az_2026_statewide_races.sql` | 6 statewide + 1 corp seats=2 | ✓ VERIFIED | STATE_EXEC-guarded corp anchor; DO$$ asserts 6 + seats=2 + STATE_EXEC |
| `1374_az_2026_legislative_races.sql` | 30 Senate + 30 House shells | ✓ VERIFIED | LATERAL office anchor; House seats=2; districts.label position names |
| `1375_az_2026_local_races.sql` | Exactly 6 local shells | ✓ VERIFIED | Mayors by office literal, councils by chamber→geo_id subquery; negative asserts |
| `1376_az_2026_discovery.sql` | 4 discovery rows + phase gate | ✓ VERIFIED | 5-domain allowlist; WHERE NOT EXISTS idempotency; DO$$ asserts |
| `_apply-migration-137{2..6}.ts` | Apply scripts w/ smoke tests | ✓ VERIFIED | 1376 carries the full 6-part phase gate incl. rolled-back seats=2 attach probe |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| races.election_id | elections (general e21f5757) | name subquery `WHERE name='AZ 2026 Statewide General'` | ✓ WIRED | All 82 races anchor to the general; 0 NULL office_id; primary row is bare (0 races) |
| races.office_id | offices→chambers→districts/governments | office anchoring per race | ✓ WIRED | Corp→STATE_EXEC; legislative→district geo_id; local→city geo_id (post-verify chains asserted) |
| discovery_jurisdictions | discovery cron | election_date within 180-day window | ✓ WIRED | discoveryCron.ts window `election_date > now() AND <= now()+180d`; both dates armed as of 2026-07-17 |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| 1372_...sql | 11 | Literal `2026-08-04` in comment ("It is NOT the old 2026-08-04 date") | ℹ️ Info | Negative-assertion documentation only; NOT a data value. Prod primary date confirmed 2026-07-21. |
| 1376_...sql | 9 | Literal `2026-08-04` in comment ("NOT 2026-08-04") | ℹ️ Info | Same — documentation of the correction, not a seeded value. |

- `cron_active` token: **absent** from all 5 migration files (grep confirmed) and no such column exists in the table.
- No TBD/FIXME/XXX debt markers found in the phase's migration files.
- The two `2026-08-04` mentions are explicit "NOT this date" clarifications; the strict "must not contain" check is technically tripped in comments only, with zero risk (production uses 2026-07-21). Classified Info, not a blocker.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| AZ-ELEC-01 | 199-01..04 | AZ 2026 race shells + candidate slate where filing closed + discovery arming | ✓ SATISFIED (with 2 user-accepted overrides) | Structural + discovery scope fully in prod; candidate-slate clause deferred to post-07-21 reconcile per user decision |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Prod race/election/discovery counts | read-only pg SELECTs vs DATABASE_URL | All 10 criteria matched expected | ✓ PASS |
| Ledger idempotency | schema_migrations 1372–1376 present | All 5 present | ✓ PASS |
| seats=2 attach path | rolled-back race_candidates round-trip (from 199-04 gate) | OK; throwaway not persisted (prod count=0) | ✓ PASS |

### Human Verification Required

#### 1. seats=2 race renders as multi-winner at /results

**Test:** Load `/results` for a Pima/Tucson-metro AZ street address and open a seats=2 race (Arizona Corporation Commission, or any State House District N).
**Expected:** The race displays as a multi-winner (2-seat) contest without error — must NOT mis-render as single-winner. These are the first AZ seats>1 races.
**Why human:** End-to-end UI render is not covered by SQL asserts. Programmatic attach path + seats=2 storage are proven; visual confirmation is the one owed item.

### Gaps Summary

No structural gaps. All 10 production verification criteria and all 3 ROADMAP success criteria are satisfied — two of the SCs (candidate slate; `cron_active=true`) resolve via user-accepted post-research overrides that are documented in 199-CONTEXT and confirmed against the live schema. The phase delivered exactly the pure-structure scope agreed after research: 2 elections rows, 73 new race shells (82 total under the general, 0 NULL office_id), 4 armed discovery rows with a 5-domain allowlist, ledger 1372–1376, and no leaked test data.

Status is **human_needed** solely because one deliberately-deferred visual check remains: confirming a seats=2 race renders as multi-winner at `/results`. A post-07-21 candidate reconcile is separately deferred (also owed for Ph197/198) and is not a gap in this phase's scope.

**Key numbers:** 2 elections · 82 races (0 NULL office_id) · 1 corp seats=2 STATE_EXEC · 30 Senate seats=1 + 30 House seats=2 · 6 local (0 Pima BoS / 0 Tucson city) · 39 candidates unchanged · 4 discovery rows × 5 domains · ledger 1372–1376 · 0 throwaway rows.

---

_Verified: 2026-07-17_
_Verifier: Claude (gsd-verifier)_
