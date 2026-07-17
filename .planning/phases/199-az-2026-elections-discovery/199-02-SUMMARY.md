# 199-02 SUMMARY — AZ 2026 statewide + legislative race shells

**Status:** ✅ Complete
**Wave:** 2
**Applied to production:** 2026-07-17

## What was built
- `1373_az_2026_statewide_races.sql` + `_apply-migration-1373.ts` — 6 statewide single-winner shells + 1 Corporation Commission race (seats=2, STATE_EXEC-anchored).
- `1374_az_2026_legislative_races.sql` + `_apply-migration-1374.ts` — 30 State Senate (seats=1) + 30 State House (seats=2) shells.
- All 67 shells: `primary_party` NULL, non-NULL `office_id`, anchored to the general (resolved by name, no hardcoded UUID).

## Resolved office anchors (verified against production)
Statewide (all district_type=STATE_EXEC, representing_state=AZ):
- Governor `4d870c55-7937-41ba-8716-7a30da7e3e06`
- Secretary of State `520719e6-cb1e-46a2-a99d-b83cc4d16d38`
- Attorney General `2214a2e6-e96b-4055-8d58-471a55e89922`
- Treasurer `21f57932-e817-42a2-a5d6-55430990adfc`
- Superintendent of Public Instruction `ba26bb00-515a-4445-8cc5-b24f28107663`
- State Mine Inspector `73481f59-8969-4734-bd69-cdf6d97df7a3`
- **Corporation Commission** (STATE_EXEC anchor, resolved via subquery): `686d5bbc-4170-4925-910e-a47368ac3cf3` — confirmed `district_type=STATE_EXEC` so `fetchStatewideRaceRows` surfaces the seats=2 race.

Legislative: 30 STATE_UPPER + 30 STATE_LOWER districts (geo_id 04001–04030), each with resolvable offices (House districts each have 2 offices; deterministic `ORDER BY o.id LIMIT 1` LATERAL anchor). `position_name` uses the verified `districts.label` form.

## Verified label form
`State Senate District N` / `State House District N` (N un-padded, 1..30) — taken directly from `districts.label`, guaranteeing exact match with app-expected labels.

## Smoke-test output
- 1373: Statewide shells 6, NULL office_id 0, Corp seats 2, Corp district_type STATE_EXEC, ledger 1373 PRESENT.
- 1374: Senate 30, House 30, House seats!=2 count 0, Legislative NULL office_id 0, ledger 1374 PRESENT.
- Both idempotent on re-apply (counts unchanged).

## Acceptance criteria
- [x] 1373: 6 statewide literals + `'Arizona Corporation Commission'` seats=2; Corp anchor JOINs districts and requires STATE_EXEC; exactly 1 corp race (not 5); ON CONFLICT; `VALUES ('1373')`; no `cron_active`; election_id by name.
- [x] 1374: 30 Senate + 30 House position_names; House seats=2, Senate seats=1; 30 House races (not 60); `ORDER BY o.id LIMIT 1`; ON CONFLICT; `VALUES ('1374')`; no `cron_active`; election_id by name.
- [x] Zero candidates inserted (pure structure).
- [x] Idempotent re-apply.

## Deviations
- Legislative `position_name` sourced from `districts.label` (exact verified form) rather than string-built from geo_id — equivalent to plan intent, eliminates any padding mismatch.
- Corp anchor uses the STATE_EXEC-required subquery with a `WHERE (...) IS NOT NULL` guard so a non-visible anchor would be skipped (post-verify then RAISEs). No fallback to a non-STATE_EXEC anchor.
- Apply scripts run from `C:/EV-Accounts/backend`.

## Enables
73 total new shells after Plan 03 (6+1+30+30 here + 6 local); Plan 04 phase gate expects 82 total under the general (9 US House + 73 new).
