---
phase: 185-washco-2026-elections-discovery
plan: 01
status: complete
completed: 2026-07-04
requirements: [WM-ELEC-01]
---

# Plan 185-01 SUMMARY — Seed 25 west-metro OR 2026 General race rows

## Outcome
25 office-anchored `essentials.races` rows seeded live for the west-metro Nov 3 2026 ballot
(Washington County Chair + D4, and the on-ballot mayor/council seats across all 7 cities).
Applied idempotently, antipartisan, 0 school-board races, no ledger row.

## CRITICAL for Plans 02/03 — migration numbering (BASE)
- **Live migration counter had DRIFTED** past RESEARCH's 1212 estimate: on-disk max at execution
  time was **1212** (1210/1211 = MN 2026 House workstream, 1212 = `1212_fix_in9_incumbent_flags.sql`
  from an IN workstream). RESEARCH's assumed BASE=1212 was STALE.
- **BASE = 1213** (races, this plan) → **BASE+1 = 1214** (candidates, Plan 02) → **BASE+2 = 1215**
  (discovery, Plan 03). **Plans 02/03 MUST still re-verify the live counter** — parallel workstreams
  advance it multiple times per day. Take each migration's number as `live_max + 1` at write time.

## OR 2026 General election row (confirmed live — Plans 02/03 consume)
- `id = de10e3a7-f5c2-47e6-acd7-ee87be9413db`, `name = 'OR 2026 General'`, `state = 'OR'`,
  `election_type = 'general'`, `election_date = '2026-11-03'`. Exactly ONE row.
- FK subquery used: `JOIN essentials.elections el ON el.name = 'OR 2026 General' AND el.state ILIKE 'or'`.

## What was built
- `C:/EV-Accounts/backend/migrations/1213_seed_washco_2026_local_races.sql`
- `C:/EV-Accounts/backend/scripts/_apply-migration-1213.ts` (gitignored `_`-prefixed smoke harness — local only)

## Key decisions / deviations
- **position_name uniqueness (deviation from PLAN's "o.title verbatim"):** `essentials.races` has TWO
  unique indexes forcing `position_name` distinct per election (`races_election_position_party_unique`
  and `idx_races_election_position_no_party` WHERE primary_party IS NULL). Because all 25 races share the
  OR 2026 General election, `o.title` verbatim collided ("Mayor"×5, "Councilor"×several). Resolved by
  giving each race a unique `{City} {Body} {Seat}` label (house convention, cf. Fairview OR / Salt Lake
  County / Utah County). Plain-`Councilor` at-large seats got lettered **Seat A/B/C by alphabetical
  incumbent surname** (display-only — Plan 02 attaches candidates by office_id, not by this label):
  - Tigard: Anderson=A, Ghoddusi=B, Robbins=C
  - Forest Grove: Marshall=A, Martinez=B, Valenzuela=C
  - Sherwood: Giles=A, Mays=B, Scott=C
  - Cornelius: Baker=A, López=B
- **Office resolution via incumbent** (not `o.title`) was mandatory: Tigard/FG/Sherwood/Cornelius have
  multiple offices all titled `Councilor` in one LOCAL district. All 25 incumbents confirmed live to
  resolve to exactly one office each. Per-geo_id race counts verified: Beaverton=1, WashCo Chair=1,
  WashCo D4=1, Cornelius=3, Forest Grove=4, Hillsboro=3, Sherwood=4, Tigard=4, Tualatin=4 = 25.
- **Seats-up certification spot-check:** RESEARCH was dated 2026-07-04 (same day as execution); runoffs
  (Chair Fai/Treece, D4 Callaway/Sinclair, Beaverton Pos1 Philip/Kocher) unchanged. No reversal. Race
  SHELLS are office-anchored and carry no candidate names, so this is a Plan 02 concern regardless.

## Verification
- Smoke script exits 0 on first apply AND idempotent re-run (still 25, 0 new rows). ✓
- In-migration `DO $$` gate passed: 25 west-metro races, 0 non-NULL primary_party, 0 school-board races. ✓
- No `supabase_migrations.schema_migrations` row for 1213 (confirmed via live SELECT). ✓

## Observations (out of scope, for context)
- **123 pre-existing OR 2026 General races** (statewide/legislative shells from
  `project_or_2026_candidate_gap`) already existed; 0 touched west-metro geo_ids. All post-verify
  assertions were therefore **scoped to the 9 west-metro geo_ids** (a broad `el.name`-only count would
  wrongly include the 123). **2 of those 123 pre-existing shells have NULL office_id** — NOT from this
  migration (all 25 of mine resolve via the office join). Pre-existing defect, noted only.
- **Commit provenance:** parallel workstreams `git add -A`-commit in `C:/EV-Accounts` concurrently.
  The 1213 SQL file landed in the repo swept into commit `04a849bb` ("feat(162-07): IN 2026 US House
  seed") rather than a dedicated 185-01 commit. File is tracked + clean + correct; not rewriting shared
  history (branch is ahead of origin). Plans 02/03 files may likewise be swept by the concurrent committer.
