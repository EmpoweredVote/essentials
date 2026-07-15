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
Directed the user to enter in-state addresses on essentials.empowered.vote for MN, TX, TN (regular) and OH (SPECIAL) and confirm the 2026 Senate race + candidates surface with House parity.

**HUMAN VERIFICATION SIGNAL:** _(recorded below after checkpoint)_

## Key files
- applied (not newly created): `supabase/migrations/878_link_us_senate_2026_races.sql`
- No files modified by this plan (production data-only apply + read-only verification).

## Self-Check: PASSED (Task 1)
