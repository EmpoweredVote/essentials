# 199-03 SUMMARY — AZ 2026 Tucson-metro local race shells

**Status:** ✅ Complete
**Wave:** 2
**Applied to production:** 2026-07-17

## What was built
- `1375_az_2026_local_races.sql` + `_apply-migration-1375.ts` — exactly 6 local race shells under the general, plus negative-scope post-verify (zero Pima BoS, zero City of Tucson) + ledger.
- Pure structure: no candidates. All `primary_party` NULL, non-NULL `office_id`, election_id resolved by name.

## Resolved local office anchors (verified against production)
| position_name | seats | office_id | chain geo_id |
|---|---|---|---|
| Oro Valley Mayor | 1 | `b3c8f75c-e8f9-4097-ab14-5790e380f9df` (literal) | 0451600 ✓ |
| Marana Mayor | 1 | `ac3daf57-c50a-4056-af79-acdda23551df` (literal) | 0444270 ✓ |
| South Tucson City Council | 3 | subquery (chamber `City Council`) | 0468850 ✓ |
| Oro Valley Town Council | 3 | subquery (chamber `Town Council`) | 0451600 ✓ |
| Marana Town Council | 4 | subquery (chamber `Town Council`) | 0444270 ✓ |
| Sahuarita Town Council | 3 | subquery (chamber `Town Council`) | 0462140 ✓ |

Both mayor offices confirmed to chain office→chamber→government to the correct geo_id (both sit in the "Town Council" chamber). Councils resolved via deterministic `ORDER BY o.id LIMIT 1` over each government's council chamber. No City-of-Tucson (0477000) or Pima BoS office in scope.

## Smoke-test output
Local shells 6; Oro Valley Mayor geo_id 0451600; Marana Mayor geo_id 0444270; Pima BoS shells 0; Tucson city shells 0; Local NULL office_id 0; ledger 1375 PRESENT. Idempotent on re-apply.

## Acceptance criteria
- [x] Exactly the 6 position_name literals; seats South Tucson=3, OV Mayor=1, OV Council=3, Marana Mayor=1, Marana Council=4, Sahuarita Council=3
- [x] No Pima County / Supervisor race; no Tucson ward / Tucson Mayor race
- [x] `ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING`
- [x] Post-verify asserts each office chains to expected geo_id (OV 0451600, Marana 0444270, South Tucson 0468850, Sahuarita 0462140)
- [x] Negative assert `%Supervisor%`=0 and `Tucson Mayor`/`%Tucson Ward%`=0 (South Tucson City Council NOT tripped)
- [x] `VALUES ('1375')`; no `cron_active`; election_id by name; idempotent; zero candidates

## Deviations
- Council anchors resolved via chamber→government subquery (self-resolving at apply time) rather than hardcoded office_ids; mayors use verified literals. Both satisfy the visibility (geo_id chain) rule.
- Apply script runs from `C:/EV-Accounts/backend`.
