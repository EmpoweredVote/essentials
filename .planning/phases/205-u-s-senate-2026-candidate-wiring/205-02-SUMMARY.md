# 205-02 SUMMARY — Apply migration 878 to production + verify

**Status:** ✅ Complete (Task 1 applied+verified; Task 2 live-check approved)
**Plan:** 205-02 (wave 2) — Apply the human-approved migration to production, then prove the fix.
**Requirements:** REQ-2 (linkage), REQ-3 (surfacing by address), REQ-4 (skip empty), REQ-5 (no collateral change).

## Gate check (T-205-08)
`205-01-SUMMARY.md` records the explicit D-04 human approval ("Approve — apply", 0 corrections, 0 skips). Apply authorized. ✅

## Task 1 — Apply + DB parity + diff (REQ-2/4/5)

### Baseline (pre-apply) vs Post-apply
| Metric | Baseline | Post-apply | Δ |
|--------|----------|-----------|---|
| `races` total | 1,674 | 1,674 | 0 ✅ |
| `race_candidates` total | 2,483 | 2,483 | 0 ✅ |
| `NATIONAL_UPPER` offices | 152 | 152 | 0 ✅ |
| `NATIONAL_UPPER` w/ incumbent | 99 | 99 | 0 ✅ |
| `U.S. House %` races | 45 | 45 | 0 ✅ |
| `U.S. Senate %` races | 51 | 51 | 0 ✅ |
| `U.S. Senate %` w/ NULL office_id | 51 | **0** | −51 ✅ |
| non-Senate races rowcount | 1,623 | 1,623 | 0 ✅ |
| **non-Senate (id:office_id) md5 checksum** | `81fc2bf499489c81544b9e37acf2bda6` | `81fc2bf499489c81544b9e37acf2bda6` | **identical** ✅ |

The byte-identical non-Senate checksum is the load-bearing REQ-5 proof: **no non-Senate race row's `office_id` changed**; only the 51 previously-NULL Senate rows were linked.

### Apply
Executed the exact contents of `supabase/migrations/878_link_us_senate_2026_races.sql` via `mcp__supabase-local__execute_sql` (production). Audit-only per D-01 / RESEARCH Open Question #1 — **no `supabase_migrations.schema_migrations` ledger row registered**; the committed file 878 is the artifact of record. No second apply attempted (guard makes it a no-op regardless).

### REQ-2 parity (post-apply, single query over all 51 rows)
| Check | Result |
|-------|--------|
| total `U.S. Senate %` races | 51 |
| office_id NULL (REQ-4 skip query) | **0** ✅ |
| district_type ≠ NATIONAL_UPPER | **0** ✅ |
| title ILIKE `Candidate for U.S. Senate%` | **0** ✅ |
| district.state ≠ race's state (full-name→USPS map) | **0** ✅ |
| office.representing_state ≠ race's state | **0** ✅ |
| distinct states linked | 35 ✅ |

### REQ-4 skip report
`SELECT position_name FROM essentials.races WHERE position_name ILIKE 'U.S. Senate %' AND office_id IS NULL` → **empty (0 rows)**. Matches the authored skip report: 0 states skipped.

## Task 2 — BLOCKING live address surfacing check (REQ-3)
Directed the user to enter in-state addresses on essentials.empowered.vote for MN, TX, TN (regular) and OH (SPECIAL) and confirm the 2026 Senate race + candidates surface.

**HUMAN VERIFICATION SIGNAL: "Both now surface" — all 4 states confirmed ✅** (2026-07-15).
- **Texas** ✅ — Senate race + candidates surfaced (first attempt).
- **Ohio** (SPECIAL, Husted seat) ✅ — Senate race + candidates surfaced (first attempt); special-election case confirmed live.
- **Minnesota** ✅ — surfaced on retry with `350 South 5th Street, Minneapolis, MN 55415`.
- **Tennessee** ✅ — surfaced on retry with `2400 West End Avenue, Nashville, TN 37203`.

### Diagnosis of the initial MN/TN "nothing" (resolved, not a phase defect)
First-attempt MN/TN addresses (`100 Nicollet Mall`, `600 Dr Martin Luther King Jr Blvd`) returned nothing. Root cause was **address geocoding failure of those specific strings**, NOT a linkage or coverage gap:
- DB parity proved MN and TN general Senate races are linked identically to TX/OH (NATIONAL_UPPER, correct state, candidates present: MN general 2, TN general 8).
- State-level geofence boundaries exist for all four states (MN=27, TN=47, TX=48, OH=39, `geofence_boundaries.has_boundary = true`).
- Cleaner street addresses surfaced both immediately.

### Caveat on the plan's "House parity" wording (RESEARCH assumption was wrong)
The plan/RESEARCH asserted "House parity in the same response" for MN/TX/TN/OH, but **none of those 4 states have U.S. House races in the DB** — U.S. House coverage exists only for MA, MD, ME, OR, UT, VA (45 House races across 6 states). The 4 sample states therefore correctly surface the Senate race **standalone**; there is no House race to appear beside it for these states. This does not affect the Senate-wiring correctness (the actual REQ-3 outcome — Senate candidates surface by address — is confirmed for all 4). Logged as a research/scoping note for any future House-parity phase.

## Task 2 outcome
REQ-3 satisfied: ≥3 mapped states + the OH special surface the 2026 U.S. Senate race with candidates by address. No non-surfacing state remains once addresses geocode.

## Key files
- applied (not newly created): `supabase/migrations/878_link_us_senate_2026_races.sql`
- No files modified by this plan (production data-only apply + read-only verification).

## Self-Check: PASSED (Task 1 + Task 2)
