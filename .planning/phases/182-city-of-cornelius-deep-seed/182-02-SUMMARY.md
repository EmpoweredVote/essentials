---
phase: 182-city-of-cornelius-deep-seed
plan: 02
subsystem: database
tags: [postgres, supabase, migrations, sql, oregon, cornelius, vacant-seat, appointed-seat]

# Dependency graph
requires:
  - phase: 182-city-of-cornelius-deep-seed
    plan: 01
    provides: "Wave-0 verified geo_id 4115550, ext_id block -4115551..-4115555, next migration 1196, vacant-seat decision option (a), roster confirmation"
provides:
  - "1196_cornelius_city_council.sql — authored structural migration (not yet applied): government + chamber + 2 districts + 5 offices (4 filled + 1 vacant) + office_id backfill + post-verify DO block + ledger row"
affects: [182-03-city-of-cornelius-deep-seed, 182-04-city-of-cornelius-deep-seed, 182-05-city-of-cornelius-deep-seed]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "D-16/IN-01 CTE hoist for repeated chamber lookups — `WITH chamber AS (...)` defined per office-INSERT statement (alongside ins_p) and referenced via `(SELECT id FROM chamber)`, replacing the doubly-nested inline subquery each Sherwood-template block repeated"
    - "TX-23 vacant-seat precedent (migration 105) applied to a modern city-council seat for the first time this milestone — office-only INSERT, politician_id=NULL, is_vacant=true, no politician row, external_id intentionally unused"
    - "Strengthened geofence post-verify gate — asserts geo_id AND mtfcc AND name (not existence alone), catching a stated-vs-actual geo_id trap (Coquille) before it can ship"

key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/1196_cornelius_city_council.sql (separate repo, NOT yet committed there — awaiting orchestrator apply + commit)"
  modified: []

key-decisions:
  - "official_count=5 per the Wave-0-recorded vacant-seat decision option (a): TX-23 precedent, office row with politician_id=NULL, is_vacant=true, no politician row, no placeholder person"
  - "Baker + Lopez modeled with the Tigard 1159 appointed-seat block (is_appointed=true on politician, is_appointed_position=true on office) — 2 of 4 filled seats appointed, the highest appointed-seat density in the milestone"
  - "Godinez Valencia's Council President designation kept as a comment-only title-on-seat note; single office row, plain 'Councilor' title, no separate office row created"
  - "Geofence post-verify gate strengthened to check name='Cornelius city' (not existence alone) — this phase's Pitfall 1, the 4115350/Coquille trap"
  - "Pairwise (external_id, full_name) identity gate used (D-15 WR-B pattern) instead of two independent IN-list membership checks, so a name/id transposition on re-run cannot silently pass"

requirements-completed: []  # WASH-08 spans plans 01-05; this plan only authors the structural migration. Task 2 (apply + verify + commit) is reserved for the orchestrator per the plan's stated execution architecture and has NOT yet run.

# Metrics
duration: 20min
completed: 2026-07-04
---

# Phase 182 Plan 02: City of Cornelius Structural Migration Summary

**Authored `1196_cornelius_city_council.sql` (419 lines, UTF-8 no BOM) seeding City of Cornelius (geo_id 4115550) + City Council chamber (official_count=5) + LOCAL_EXEC/LOCAL districts + 5 offices — Mayor Dalin (elected) + Councilor Godinez Valencia (elected, Council-President title-on-seat) + Councilor Baker (appointed) + Councilor Edén López (appointed, first accented name this milestone) + 1 genuine TX-23-precedent vacant seat — with the D-16 chamber-CTE hoist, a strengthened name-matched geofence gate, and a pairwise identity gate; migration is authored and verified by inspection only — Task 2 (psql apply + orchestrator E2E verification + commit in the C:/EV-Accounts repo) is reserved for the orchestrator per this plan's explicit execution architecture and has not yet run.**

## Performance

- **Duration:** ~20 min (Task 1 authoring only)
- **Completed:** 2026-07-04T02:20:00Z (Task 1); Task 2 pending orchestrator action
- **Tasks:** 1 of 2 completed by this executor (Task 2 is `checkpoint:human-verify` reserved for the orchestrator — see `<mcp_tools>` constraint: this agent has no DB access)
- **Files modified:** 1 (outside this worktree's repo)

## Accomplishments

- Authored `C:/EV-Accounts/backend/migrations/1196_cornelius_city_council.sql` per the Sherwood 1187 template shape, adapting for Cornelius's specific deltas:
  - Pre-flight hard-abort DO block referencing migration 1196.
  - Government INSERT (name='City of Cornelius, Oregon, US', state='OR', geo_id='4115550') guarded `WHERE NOT EXISTS`.
  - Chamber INSERT (name_formal='Cornelius City Council', official_count=5) guarded `WHERE NOT EXISTS`.
  - Two districts: LOCAL_EXEC (`'Cornelius (Mayor, Citywide, 2-Year Term)'`) + LOCAL (`'Cornelius (At-Large)'`), both `state='or'` lowercase, `geo_id='4115550'`.
  - D-16/IN-01 CTE hoist: every office INSERT defines `WITH chamber AS (...)` (alongside `ins_p` where applicable) and references `(SELECT id FROM chamber)` for `chamber_id`, eliminating the doubly-nested inline chamber subquery.
  - 5 office blocks: Mayor Jeffrey C. Dalin (-4115551, elected, LOCAL_EXEC); Councilor Angeles Godinez Valencia (-4115552, elected, Council-President note-only); Councilor Edgar Baker (-4115553, appointed); Councilor Edén López (-4115554, appointed, accented literals); vacant 5th seat (office-only, `politician_id=NULL`, `is_vacant=true`, ext_id -4115555 intentionally unused, PITFALL GUARD comment against seating Citlalli Nuñez-Barragán).
  - `office_id` back-fill UPDATE scoped to the 4 filled external_ids only.
  - Post-verification DO block asserting: gov_count=1, office_count=5, STRENGTHENED name-matched geofence (`geo_id='4115550' AND mtfcc='G4110' AND name='Cornelius city'`), canonical section-split query=0, office_id nulls=0, representing_city count=5, vacant_office=1, appointed_positions=2, and the pairwise (external_id, full_name) identity gate=4.
  - Ledger `INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('1196')`.
- Verified by inspection (no DB access available to this agent): 419 lines (exceeds the 250-line minimum), file confirmed UTF-8 without a byte-order mark (first bytes `2d 2d 20` = `-- `), forbidden literal strings `slug` and `photo_origin_url` absent, accented literals `Edén`/`López` present and correctly encoded, migration number `'1196'` present exactly once in the ledger INSERT.
- Confirmed via `git -C "C:/EV-Accounts" status --short` that no `1196_*` file was pre-staged by another workstream and nothing else conflicts with this migration's path.
- Confirmed via on-disk `ls` of the migrations directory that `1196_cornelius_city_council.sql` did not already exist and that 1195 remains the highest prior structural migration number — matching the Wave-0-recorded next-migration value exactly.

## Task Commits

This plan has no in-worktree code commits for Task 1: the plan's sole artifact
(`1196_cornelius_city_council.sql`) is authored in a separate git repository (`C:/EV-Accounts`)
per the plan's explicit execution architecture ("gsd-executor WRITES the `.sql` file... The
INLINE ORCHESTRATOR applies it via `psql` ... and commits it in the C:/EV-Accounts repo"). No
files inside this worktree were created or modified by Task 1; `git status --short` in this
worktree returns clean. The migration file itself has NOT been committed in the C:/EV-Accounts
repo — that commit happens only after the orchestrator applies it and the in-migration + E2E
gates pass (Task 2).

**Plan metadata:** SUMMARY.md commit (this file) — see commit hash in final response.

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/1196_cornelius_city_council.sql` — structural migration (separate repo; authored, NOT yet applied or committed there)

## Decisions Made

- Followed the Sherwood 1187 structural analog exactly for shape (directly-elected 2-year Mayor + shared at-large LOCAL district + plain titles + D-15 WR-B pairwise identity gate), layering in the Tigard 1159 appointed-seat block for Baker + López and the TX-23 (migration 105) vacant-seat block for the 5th seat, per the plan's explicit deltas.
- Implemented the D-16/IN-01 CTE hoist by defining `WITH chamber AS (...)` once per office-INSERT statement (each statement's own WITH clause, since CTEs cannot span multiple top-level statements in plain SQL) and referencing `(SELECT id FROM chamber)` for `chamber_id` — eliminating the doubly-nested `chamber_id = (SELECT id FROM chambers WHERE name=... AND government_id=(SELECT id FROM governments WHERE name=...))` pattern the Sherwood template repeats inline in every block.
- Used the exact accented literals `'Edén López'` / `'Edén'` / `'López'` for the politician row, matching the Pasadena migration 076 precedent (`'Erica Margarita Múnoz'`) for saving accented names cleanly in a UTF-8-no-BOM file.
- Did not create a separate office row for Godinez Valencia's Council President designation — modeled strictly as a comment-only title-on-seat note per the plan's explicit instruction, matching the Sherwood/Tigard/Tualatin/Forest Grove precedent for similar internal titles.
- Strengthened the geofence post-verify assertion to check `name='Cornelius city'` in addition to `geo_id` and `mtfcc`, per the plan's explicit Pitfall-1 requirement (the stated `4115350` resolves to `'Coquille city'`, a different real city, per Wave-0 Probe A2).

## Issues Encountered

None. `182-PATTERNS.md` (referenced in the plan's `<read_first>` list) does not exist on disk in
this worktree, consistent with the same absence already documented in 182-01-SUMMARY.md. Proceeded
using the plan's own detailed `<action>`/`<roster>`/`<interfaces>` blocks plus the four analog
migration files explicitly named in `<read_first>` (Sherwood 1187, Tigard 1159 lines 101-168, TX
Congressional 105 TX-23 block, Pasadena 076 accented-name precedent), all of which exist and were
read directly. No functional impact — every literal value (geo_id, ext_id block, roster names,
migration number, vacant-seat decision) came from the plan's frontmatter/roster/interfaces blocks
and 182-01-SUMMARY.md, not from the missing PATTERNS file.

## User Setup Required

None for this plan's Task 1. Task 2 requires the orchestrator (which holds DB access via
`DATABASE_URL` and the `psql` CLI) to:
1. Apply the migration: `psql "$DATABASE_URL" -f C:/EV-Accounts/backend/migrations/1196_cornelius_city_council.sql`
2. Confirm the in-migration DO block emits `Post-verification PASSED` (listing
   `pairwise_identity=4, appointed_positions=2, vacant_office=1`).
3. Run the independent E2E gate (items a-i in the plan's Task 2 `<how-to-verify>`).
4. Check `git -C "C:/EV-Accounts" status` for pre-staged files from other workstreams, stage ONLY
   `backend/migrations/1196_cornelius_city_council.sql`, and commit in the C:/EV-Accounts repo.

## Next Phase Readiness

**Task 1 (author migration) is COMPLETE. Task 2 (apply + verify + commit) is a
`checkpoint:human-verify`, `gate="blocking"` reserved for the orchestrator** — this executor has
no DB access and cannot run `psql` or query the live schema (per the plan's `<mcp_tools>`
constraint). Downstream plans 03 (headshots) and 04 (stances) depend on Task 2 completing, since
they need the minted politician UUIDs for the 4 filled external_ids
(-4115551..-4115554) which only exist once the migration is actually applied.

Values confirmed and ready for the orchestrator to apply/verify:
- **Migration file:** `C:/EV-Accounts/backend/migrations/1196_cornelius_city_council.sql` (419
  lines, UTF-8 no BOM, no forbidden literal strings).
- **geo_id:** `4115550` ('Cornelius city', G4110). NEVER `4115350` (Coquille city trap).
- **Roster (ext_id → name → seat):** -4115551 Jeffrey C. Dalin (Mayor, elected) · -4115552
  Angeles Godinez Valencia (Councilor, elected, Council-President note) · -4115553 Edgar Baker
  (Councilor, appointed) · -4115554 Edén López (Councilor, appointed) · -4115555 UNUSED (vacant
  seat, no politician row).
- **official_count:** 5 (Mayor + 4 councilor seats, 1 vacant).
- **Next migration after 1196:** 1197 (for plan 03's headshot migration).

## Self-Check: PASSED

- FOUND: `C:/EV-Accounts/backend/migrations/1196_cornelius_city_council.sql`
- FOUND: commit `335c650` (SUMMARY.md)
- No unexpected file deletions in the commit.

