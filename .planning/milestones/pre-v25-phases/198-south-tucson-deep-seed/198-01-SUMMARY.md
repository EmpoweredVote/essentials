# Phase 198 · Plan 01 — Summary

**Plan:** 198-01 — City of South Tucson structural migration
**Requirement:** SUB-04
**Status:** ✅ Complete — applied to production 2026-07-17
**Autonomous:** false (orchestrator-run + operator roster decision)

## What was built

Greenfield **City of South Tucson, Arizona, US** seeded to live production via
`C:/EV-Accounts/backend/migrations/1363_city_of_south_tucson.sql` (disk MAX 1362 → 1363, no drift;
ledger registered as `'1363'`):

- 1 government row — `type='City'` (delta from the Sahuarita/Oro-Valley/Marana Town precedent; confirmed against the live Tucson `0477000` `type='City'` row), `state='AZ'`, `city='South Tucson'`, `geo_id='0468850'`.
- 1 `City Council` chamber (`name_formal='South Tucson City Council'`, `official_count=7`).
- 1 NEW shared `LOCAL`/`G4110`/`0468850` district (`state='az'`, label `City of South Tucson (At-Large)`). **NO `LOCAL_EXEC` row** (Pitfall 3 — no separately-elected Mayor).
- 7 at-large offices/politicians, `party=NULL` (nonpartisan/antipartisan), `is_appointed=false`, all sharing the one LOCAL district. Three council-chosen titles as `title` annotations (Sahuarita pattern extended to a **third** title).

## D-03 enclave check (milestone's first enclave jurisdiction) — PASSED

Re-verified live 2026-07-17 immediately before apply AND re-asserted in-migration:
- `ST_Area(ST_Intersection(0468850, 0477000))` = **0 km²** — true donut hole (`ST_Intersects=true` = shared boundary edge only).
- `ST_Covers` point-in-South-Tucson resolves **exclusively** to 0468850, NULL for Tucson 0477000.
- Post-apply re-assert: intersection area < 0.001 km² ✓.

## Roster decision (D-07 — BLOCKING roster-currency)

**Operator decision 2026-07-17: seed the CURRENT roster now** ("primary-not-yet-occurred" branch).
- The July 21, 2026 primary is **4 days out** and had **not** occurred / been certified at apply time; no post-canvass Mayor/Vice-Mayor/Acting-Mayor re-vote had been held.
- `southtucsonaz.gov` is Cloudflare-JS-challenge-blocked; roster sourced from RESEARCH (Tucson Spotlight Nov-2024 swearing-in + AZ Luminaria Jun-2026 voter guide), representing residents today.
- ⚠️ **POST-JULY-21 RECONCILE OWED**: after the primary is certified and the new council holds its post-canvass title re-vote, re-verify membership + all three title holders and patch if anything changed. Three seats are up (Valenzuela, Flagg, Aguirre) and the **sitting Mayor Valenzuela is herself an incumbent candidate**.

## Post-verify gates — ALL PASSED

Combined boolean assertion returned `true`: gov=1 (type='City'), 7 offices all on the one LOCAL/G4110 row, 0 non-LOCAL districts for 0468850, exactly 1 new LOCAL district, party NULL + is_appointed=false + office_id backfilled on all 7, exactly one Mayor (-4015001) / Vice Mayor (-4015002) / Acting Mayor (-4015003), section-split=0, enclave overlap < 0.001 km². Ledger `1363` = 1.

## 7 politician UUID manifest (for Plans 02 headshots + 03 stances)

| external_id | UUID | Name | Title |
|-------------|------|------|-------|
| -4015001 | `94fd53ed-f05a-4e65-a600-0fb5076f2109` | Roxanna Valenzuela | Mayor |
| -4015002 | `cbee242a-e992-46e6-a7ea-5aad11816c50` | Melissa Brown-Dominguez | Vice Mayor |
| -4015003 | `a6888435-018b-448c-8272-163a330fd5e3` | Pablo Robles | Acting Mayor |
| -4015004 | `0a258242-d8c2-43ca-89ae-b891db3e21d8` | Dulce Jimenez | Council Member |
| -4015005 | `1ce510bf-2eed-4335-83a8-54fa2079b8a3` | Paul Diaz | Council Member |
| -4015006 | `932bed88-cb72-4611-8394-05f6f476d307` | Brian Flagg | Council Member |
| -4015007 | `aec8b558-0a8b-4ee1-bc26-1cb9369f6ed5` | Cesar Aguirre | Council Member |

## Self-Check: PASSED
