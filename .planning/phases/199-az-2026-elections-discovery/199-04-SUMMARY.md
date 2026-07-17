# 199-04 SUMMARY — AZ 2026 discovery arming + phase gate

**Status:** ✅ Complete (one manual render human-check owed — see below)
**Wave:** 3
**Applied to production:** 2026-07-17

## What was built
- `1376_az_2026_discovery.sql` + `_apply-migration-1376.ts` — 4 `discovery_jurisdictions` rows + discovery post-verify + the full 6-part phase gate + ledger.

## Discovery rows (4)
{FIPS `04` State of Arizona, `04019` Pima County, Arizona} × {2026-07-21 primary, 2026-11-03 general}, each with the curated 5-domain allowlist `['azsos.gov','azcleanelections.gov','pima.gov','recorder.pima.gov','ballotpedia.org']`. `state='AZ'`. No `cron_active` column (arming is date-window driven). Idempotent via `WHERE NOT EXISTS (jurisdiction_geoid, election_date)` — the table has no unique constraint on that pair, so `ON CONFLICT` is not usable.

## discoveryCron near-date finding
`discoveryCron.ts` window = `WHERE election_date > now() AND election_date <= now() + 180 days` (SWEEP_HORIZON_DAYS=180). Today 2026-07-17: primary 2026-07-21 is **4 days in the future** (not past) → armed; general 2026-11-03 → armed. No near-past edge case. After the primary date passes, that row simply falls out of the window (harmless); the general row stays armed.

## Phase gate (all green, emitted by the apply script)
- `PHASE GATE total races: 82` (9 US House + 6 statewide + 1 corp + 30 senate + 30 house + 6 local)
- `PHASE GATE NULL office_id: 0`
- `PHASE GATE Pima BoS: 0`
- `PHASE GATE Tucson city: 0`
- `PHASE GATE candidates unchanged: 39` (no candidates hand-seeded this phase)
- `PHASE GATE seats=2 attach path: OK` — a throwaway `race_candidates` row against the Corp Commission (seats=2) race round-tripped through the join query inside a transaction, then `ROLLBACK`; `throwaway rolled back: OK` confirms nothing committed.

## Acceptance criteria
- [x] 1376 SQL: geoids `'04'`/`'04019'`; `'State of Arizona'`/`'Pima County, Arizona'`; `'2026-07-21'` (×2) + `'2026-11-03'` (×2); no `'2026-08-04'`; 5-element ARRAY; idempotency guard; `VALUES ('1376')`; no `cron_active`
- [x] Apply script prints 4 rows, allowlist length 5, both dates, ledger PRESENT
- [x] Idempotent re-apply (4 rows; 82 races stable)
- [x] Prod: 4 rows in ('04','04019'); every row array_length=5
- [x] Phase gate assertions 1–5 emitted as grep-able `PHASE GATE …` lines
- [x] seats=2 attach path proven via rolled-back INSERT; nothing committed
- [ ] **seats=2 render `<human-check>` at `/results`** — OWED. Programmatic attach-path + seats=2 storage are proven, and `seats` is never a fetch filter (electionService.ts), so render risk is low, but a visual confirmation that a Corp Commission / State House District race displays as a multi-winner (not single-winner) contest for an AZ address is still owed to the user.

## Deviations
- Idempotency uses `WHERE NOT EXISTS` (no unique constraint on the geoid/date pair).
- Phase gate assertions 1–6 folded into the 1376 apply script (not a standalone script), per plan option.
- Apply script runs from `C:/EV-Accounts/backend`.

## Phase 199 closing
AZ-ELEC-01 structural + discovery scope fully satisfied across Plans 01–04: elections rows (2), 73 new race shells (82 total under the general), 4 armed discovery rows. **Deferred (not this phase):** a post-07-21 candidate reconcile to seed general-election nominees (also owed for Ph197/198).
