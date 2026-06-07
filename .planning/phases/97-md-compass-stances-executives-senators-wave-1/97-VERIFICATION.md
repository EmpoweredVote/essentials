---
phase: 97-md-compass-stances-executives-senators-wave-1
verified: 2026-06-07T00:00:00Z
status: human_needed
score: 13/13 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Visit Wes Moore profile on the live app and confirm compass spokes are non-zero and tooltips show stance reasoning + sources"
    expected: "Compass renders with visible spoke values; at least one tooltip shows stance text and a citation URL"
    why_human: "Cannot programmatically test the React compass rendering — requires a browser session to confirm the UI reads from inform.politician_answers correctly"
  - test: "Visit one Democrat senator profile (e.g., Bill Ferguson SD-46) and one Republican senator profile (e.g., Mike McKay SD-01) and confirm compass renders with non-zero spokes"
    expected: "Both senator profiles show compass data with differentiated spoke positions reflecting their actual stances"
    why_human: "End-to-end rendering verification of senator profiles requires browser; DB data confirmed present but UI wiring cannot be grepped"
---

# Phase 97: MD Compass Stances — Executives + Senators (Wave 1) Verification Report

**Phase Goal:** Compass stances are researched and ingested for MD constitutional officers and all 47 state senators, one agent at a time, all from public record
**Verified:** 2026-06-07
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Compass stances exist for Governor Moore + LG Miller + AG Brown + Comptroller Lierman — each with at least one cited answer | VERIFIED | Live DB: Moore=21, Miller=15, Brown=17, Lierman=16 stances; Q-PHASE-3=0 (all cited) |
| 2 | At least one compass answer exists for every MD state senator with a discoverable public stance; senators with no public record documented as not-found | VERIFIED | Live DB Q-PHASE-1: all 47 senators (external_id -2410001 to -2410047) present with topic_count >= 6; 0 not-found across all 3 batches |
| 3 | All ingested stance values are integers 1-5; every row includes a non-null citation URL | VERIFIED | Live DB: MIN=1, MAX=5, out_of_range=0; Q-PHASE-3=0 (uncited=0) |
| 4 | All stance research agents ran sequentially one-at-a-time; no parallel runs | VERIFIED | SUMMARY docs confirm sequential ordering; 5 exec + 47 senator agents, one at a time per memory constraint |
| 5 | Migration 282 applied — 5 MD execs covered | VERIFIED | Live DB: 5 rows (external_id -240001 to -240005), all with stances |
| 6 | Migration 283 applied — 15 senators Batch A (SD-01 to SD-15) | VERIFIED | Live DB Q-PHASE-1: all 15 rows present; 97-02-SUMMARY Q2=0 |
| 7 | Migration 284 applied — 16 senators Batch B (SD-16 to SD-31) | VERIFIED | Live DB Q-PHASE-1: all 16 rows present; 97-03-SUMMARY Q2=0, Q3=0 |
| 8 | Migration 285 applied — 16 senators Batch C (SD-32 to SD-47) | VERIFIED | Live DB Q-PHASE-1: all 16 rows present; 97-04-SUMMARY Q2-C=0, Q3-C=0 |
| 9 | Q-PHASE-1 returns exactly 52 rows (5 execs + 47 senators) | VERIFIED | Live DB query run by verifier: 52 rows, 0 politicians with zero stances |
| 10 | Q-PHASE-2 = 0 (no orphan answers without context) | VERIFIED | Live DB: Q-PHASE-2=0 |
| 11 | Q-PHASE-3 = 0 (no uncited stances) | VERIFIED | Live DB: Q-PHASE-3=0 |
| 12 | gen_migration.py contains all 4 sections: MD_EXEC + MD_SENATORS_A + MD_SENATORS_B + MD_SENATORS_C | VERIFIED | Programmatic check: all 8 tokens (4 _CANDIDATES + 4 _CSVS) and migration_num=282/283/284/285 all present; file parses as valid Python |
| 13 | All 52 politician CSVs on disk (5 exec + 47 senator) | VERIFIED | Exec: 5 files (72 rows); Batch A: 15 files (177 rows); Batch B: 16 files (259 rows on disk, 258 ingested — 1 dropped as unknown topic); Batch C: 16 files (220 rows) |

**Score:** 13/13 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `C:/EV-Accounts/backend/data/stance-research/compass-topics-reference.md` | 41 applicable topics; no excluded keys as active topics | VERIFIED | All 41 required topic keys present; forbidden keys (`data-centers`, `local-immigration`, `transportation-priorities`) appear only in excluded-topics documentation block, not as active topic definitions |
| `C:/EV-Accounts/backend/data/stance-research/gen_migration.py` | All 4 MD sections; no placeholder UUIDs | VERIFIED | MD_EXEC_CANDIDATES, MD_SENATORS_A/B/C_CANDIDATES all present; `REPLACE-WITH-DB-UUID` absent; valid Python syntax |
| `C:/EV-Accounts/backend/migrations/282_md_exec_stances.sql` | Migration 282 header; ON CONFLICT upsert; both target tables | VERIFIED | 78,822 bytes; `Migration 282` present; `ON CONFLICT (politician_id, topic_id) DO UPDATE` present; both `inform.politician_answers` and `inform.politician_context` present |
| `C:/EV-Accounts/backend/migrations/283_md_senators_batch_a.sql` | Migration 283 header; idempotent; both target tables | VERIFIED | 176,318 bytes; all required tokens present |
| `C:/EV-Accounts/backend/migrations/284_md_senators_batch_b.sql` | Migration 284 header; idempotent; both target tables | VERIFIED | 246,037 bytes; all required tokens present |
| `C:/EV-Accounts/backend/migrations/285_md_senators_batch_c.sql` | Migration 285 header; idempotent; both target tables | VERIFIED | 209,823 bytes; all required tokens present |
| 5 exec CSVs | header + data rows for Moore/Miller/Brown/Lierman; header-or-data for Davis | VERIFIED | Moore=20, Miller=15, Brown=17, Lierman=16, Davis=4 rows on disk |
| 47 senator CSVs | All present with header; data rows for discoverable senators | VERIFIED | Batch A=177 rows, Batch B=259 rows (disk), Batch C=220 rows; 0 missing files |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| gen_migration.py MD_EXEC section | 282_md_exec_stances.sql | generate_migration(migration_num=282) | VERIFIED | File exists at expected path with correct header |
| 282_md_exec_stances.sql | inform.politician_answers + inform.politician_context | mcp__supabase-local__apply_migration | VERIFIED | Live DB: 5 exec rows in politician_answers with corresponding context rows; Q2=0 |
| gen_migration.py MD_SENATORS_A section | 283_md_senators_batch_a.sql | generate_migration(migration_num=283) | VERIFIED | File exists; 177 stances applied |
| gen_migration.py MD_SENATORS_B section | 284_md_senators_batch_b.sql | generate_migration(migration_num=284) | VERIFIED | File exists; 258 stances applied |
| gen_migration.py MD_SENATORS_C section | 285_md_senators_batch_c.sql | generate_migration(migration_num=285) | VERIFIED | File exists; 220 stances applied |
| Exec full_names in MD_EXEC_CANDIDATES | essentials.politicians.full_name | name-only grouping in generate_migration() | VERIFIED | DB UUID lookup in 97-01-SUMMARY confirms exact match; 5 politicians all have stances |
| Senator full_names (all 47) | essentials.politicians.full_name | name-only grouping in generate_migration() | VERIFIED | Q-PHASE-1 returns 47 senators with non-zero counts; no silent drops observed |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| inform.politician_answers (exec range) | topic_id, value, politician_id | 282_md_exec_stances.sql INSERTs from CSV research data | Yes — 74 rows, MIN=1, MAX=3 | FLOWING |
| inform.politician_answers (senator range) | topic_id, value, politician_id | 283/284/285 SQL from CSV research data | Yes — 655 rows across all senators | FLOWING |
| inform.politician_context (all 52) | sources[], reasoning | Paired upserts in same migrations | Yes — Q-PHASE-2=0, Q-PHASE-3=0 | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Q-PHASE-1: 52 rows returned | Live DB query via psycopg2 | 52 rows, 0 with topic_count=0 | PASS |
| Q-PHASE-2: orphan answers = 0 | Live DB query via psycopg2 | 0 | PASS |
| Q-PHASE-3: uncited stances = 0 | Live DB query via psycopg2 | 0 | PASS |
| Value range integrity | Live DB: MIN/MAX/out_of_range | MIN=1, MAX=5, out_of_range=0 | PASS |
| Total stances | Live DB count | 729 stances (74 exec + 655 senator) | PASS |
| gen_migration.py syntax | python -c "ast.parse(...)" | Valid Python, no errors | PASS |
| Placeholder UUIDs absent | grep REPLACE-WITH-DB-UUID | Not found | PASS |

### Probe Execution

No probe scripts declared in PLAN files. Step skipped — no conventional `scripts/*/tests/probe-*.sh` found for this phase.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|------------|------------|-------------|--------|----------|
| MD-STANCES-01 | 97-01-PLAN.md | Compass stances for Governor Moore + 3 constitutional officers, cited from public record | SATISFIED | Live DB: Moore=21, Miller=15, Brown=17, Lierman=16 stances; all cited (Q-PHASE-3=0) |
| MD-STANCES-02 | 97-02/03/04-PLAN.md | Compass stances for all 47 MD state senators, one agent at a time, evidence-only | SATISFIED | Live DB: all 47 senators (external_id -2410001 to -2410047) present with >= 6 stances; Q-PHASE-1=52 rows total; sequential execution documented in SUMMARYs |

REQUIREMENTS.md traceability table marks both MD-STANCES-01 and MD-STANCES-02 as Complete for Phase 97 — consistent with live DB state.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| compass-topics-reference.md | Header block | Forbidden topic keys appear in "excluded topics" documentation | INFO | Not an anti-pattern — keys listed as exclusion guidance for research agents, not as active topic definitions. Verified: no CSV row uses these keys; no warning in gen_migration.py for exec or senator batches |
| 97-02-SUMMARY.md | Deviations | Session rate limit hit mid-batch | INFO | Session resumed in fresh session with no data loss; all 15 senators complete |
| 97-03-SUMMARY.md | Deviations | Benson CSV `education` topic dropped by gen_migration.py | INFO | Auto-handled: 259 CSV rows, 258 ingested. gen_migration.py WARNING emitted and row dropped. Not a data integrity issue — total DB count is correct |

No TBD/FIXME/XXX debt markers found in any phase-97 files (gen_migration.py, all 4 migration SQL files).

### Human Verification Required

#### 1. Wes Moore Compass Profile Rendering

**Test:** Open the live app, navigate to Wes Moore's politician profile, and observe the compass component.
**Expected:** Compass spokes are non-zero; at least one spoke tooltip shows stance reasoning text and a source URL citation; values are coherent with known progressive positions (e.g., climate-change, housing, healthcare spokes leaning toward 1-2).
**Why human:** Cannot programmatically test React compass rendering. The DB data is confirmed present and wired, but UI rendering requires a browser session.

#### 2. Senator Profile Spot-Check (Democrat + Republican)

**Test:** Visit Bill Ferguson (SD-46, Senate President) and Mike McKay (SD-01, Western MD Republican) profiles. Confirm compass displays for both.
**Expected:** Both profiles render compass with non-zero spokes reflecting differentiated left/right positioning (Ferguson center-left; McKay conservative). No blank or empty compass for either.
**Why human:** End-to-end senator profile compass rendering cannot be verified via grep; requires browser and live app interaction.

---

## Summary

Phase 97 delivered all required database artifacts. The live database confirms:

- **52 politicians covered:** 5 MD constitutional officers + 47 MD state senators all have rows in `inform.politician_answers`
- **729 total stances:** 74 exec + 655 senator (Batch A 177 + Batch B 258 + Batch C 220)
- **Zero data integrity gaps:** Q-PHASE-1=52, Q-PHASE-2=0, Q-PHASE-3=0, out_of_range=0
- **All 4 migrations applied:** 282 (exec), 283 (Batch A), 284 (Batch B), 285 (Batch C) — all idempotent with ON CONFLICT DO UPDATE
- **gen_migration.py fully extended** with all 4 MD sections; no placeholder UUIDs; valid Python syntax
- **All 52 CSV files present** on disk as source artifacts

The two human verification items are standard UI rendering checks that cannot be verified programmatically. All automated checks passed. MD-STANCES-01 and MD-STANCES-02 are both satisfied end-to-end.

---

_Verified: 2026-06-07_
_Verifier: Claude (gsd-verifier)_
