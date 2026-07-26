# Phase 216 — Unincorporated Locality Label — CONTEXT

Pre-planning context (decisions locked with the user 2026-07-22; backend already mapped this session).
This is the discuss-phase output — the planner/researcher should build on it, not re-derive it.

## Goal
When a searched point (address OR anonymous coordinate) falls **outside any incorporated place** but
within a county, the results-page locality banner reads **"Unincorporated {County}, {ST}"**
(e.g. "Unincorporated Pima County, AZ") instead of the misleading current output.

## Current (broken) behavior — grounded
- Banner label = `representingCity` memo (`src/pages/Results.jsx:1172`) → `buildBannerProps('city', …)`
  (`src/lib/bannerProps.js:38`) → `"{representingCity}, {userState}"` (state-dedup added main@81365925).
- `representingCity` resolution order: browse → `browse_label`; **coordinate → `null` → banner shows
  generic "Your City"**; else officials' `representing_city` → chamber "City of X" → **`parseCityFromAddress`
  (postal city, e.g. "Tucson") even on an unincorporated parcel** — mislabels unincorporated points.

## Locked decisions
- **D-01 — Detection is backend-only.** Frontend cannot distinguish a postal city from an incorporated
  place. Add a locality probe to the shared core `resolveOfficialsAtPoint`.
- **D-02 — Gate to place-loaded states.** G4110 place geofences are loaded per-state only (today: MA, ME,
  TX, CA, OR, MD, VA, NV, AZ). In un-loaded states a real city looks place-less → FALSE "unincorporated."
  So emit `incorporated: false` ONLY in place-loaded states; elsewhere emit `incorporated: null` (unknown)
  and the frontend suppresses the label (keeps today's behavior). Backend owns the place-loaded-state
  allowlist (derive from / co-locate with the TIGER loader's per-state place list).
- **D-03 — County name in coordinate responses is OK.** County is coarse (not the parcel); `tribal_land.name`
  is already echoed for coordinates. Returning `county_name` for coordinate lookups is acceptable and does
  not violate the Phase-213 no-echo model (which is about the raw lat/lng / exact address).
- **D-04 — CDPs show their place name; only truly place-less points say "Unincorporated".** TIGER's place
  layer (G4110) includes Census Designated Places (unincorporated communities like "East Los Angeles").
  Rule: ANY G4110/G4120 `ST_Covers` hit ⇒ treat as "has a place" (show the place name path, unchanged);
  only ZERO place rows ⇒ "Unincorporated {County}". Do NOT try to separate municipalities from CDPs
  (needs a `CLASSFP`/`LSAD` field that isn't loaded).
- **Wording:** county names already include "County" (e.g. "Pima County") → "Unincorporated Pima County, AZ".

## Backend findings (accounts-api @ C:/EV-Accounts) — from this session's Explore
- Shared core: `backend/src/lib/essentialsService.ts` → `resolveOfficialsAtPoint` (~625-858), called by
  BOTH `getRepresentativesByAddress` (~874-907) and `getRepresentativesByCoordinate` (~1038-1080).
- Overlap is PostGIS `ST_Covers(gb.geometry, ST_SetSRID(ST_MakePoint($lng,$lat),4326))` over
  `essentials.geofence_boundaries gb` (~637-702). MTFCC map (~668-684) already knows G4110/G4120=LOCAL,
  G4020=COUNTY.
- **`tribal_land` is the exact precedent to mirror** (~753-776): a dedicated direct-geofence `ST_Covers`
  query filtered to `mtfcc = 'X0004'`, run in `Promise.all` with the district/statewide queries, defaulted
  to `{on_reservation:false}`, flipped on a hit, attached at BOTH return points (~784 empty-early-return and
  ~857 normal return).
- Place probe to ADD: `ST_Covers` filtered to `mtfcc IN ('G4110','G4120')` → zero rows = no incorporated place.
- County name: `ST_Covers` filtered to `mtfcc = 'G4020'` → `{geo_id, name}`. Counties are loaded NATIONWIDE
  with valid FIPS `geo_id` (`load-state-tiger-boundaries.ts` ~1314+). (The existing `county` field is
  officials-joined and can be null, so a dedicated probe is the robust county-name source.)
- **Envelope caveat:** `POST /essentials/candidates/search` (`routes/essentialsCandidates.ts:115-120`) returns
  only a 4-field SUBSET `{politicians, tribal_land, county, jurisdiction}` — the new `locality` field MUST be
  added to this explicit object. The coordinate route (`routes/essentialsCoordinateLookup.ts:78`) returns the
  full result verbatim, so it inherits `locality` automatically.
- Place geofences carry `writeDistrictRow:false` (`load-state-tiger-boundaries.ts:284-294`) → NOT in the
  officials-joined result → a direct geofence probe is mandatory (can't infer from the officials list).

## Proposed emitted field
`locality: { incorporated: boolean|null, place_name: string|null, county_name: string|null }`
- place-loaded state + G4110/G4120 hit → `{incorporated:true, place_name, county_name}`
- place-loaded state + no place hit → `{incorporated:false, place_name:null, county_name}`
- un-loaded state → `{incorporated:null, …}` (frontend suppresses "Unincorporated" label)

## Frontend integration points
- `src/lib/api.jsx:109-120` — unwrap `locality` alongside `tribal_land` (candidates/search subset path).
- `src/lib/api.jsx` coordinate path (`lookupCoordinate`, ~527) — pass `locality` through.
- `src/hooks/usePoliticianData.js` — surface `locality` (mirror `tribalLand`).
- `src/pages/Results.jsx` `representingCity` (~1172) — when `locality.incorporated === false && county_name`,
  return `Unincorporated {county_name}` BEFORE the `parseCityFromAddress` fallback AND for coordinate mode
  (currently returns null at ~1188). Browse mode unchanged. Verify `buildBannerProps` state-dedup still yields
  "Unincorporated Pima County, AZ" (no double state).

## Test fixtures
- Valid: an unincorporated address/coordinate in a **place-loaded** state — unincorporated **Pima County, AZ**
  or unincorporated **LA County, CA**.
- ⚠ **Bloomington, IN is INVALID** here (Indiana places are not loaded → would false-positive as unincorporated).
- Backend: unit-test the locality probe (place hit → incorporated:true; no place → false+county; un-loaded
  state → null). Mirror `tribal_land` tests.

## Success criteria
- Address & coordinate lookups in a place-loaded state return `locality`; an unincorporated point yields
  `{incorporated:false, county_name:"…"}`; a city point yields `{incorporated:true, place_name:"…"}`.
- Results banner shows "Unincorporated {County}, {ST}" for unincorporated points in loaded states; unchanged
  ("Your City"/postal city) for un-loaded states; browse mode untouched.
- No regression to `tribal_land`, `county`, or the existing banner label for incorporated/CDP points.

## ⭐ AUTHORITATIVE DB GROUND TRUTH (supersedes the tentative state list above + RESEARCH's static analysis)
Live query against production `essentials.geofence_boundaries` (2026-07-22),
`SELECT LEFT(geo_id,2) fips, COUNT(*) FROM … WHERE mtfcc='G4110' GROUP BY 1`:

| FIPS | State | G4110 places |
|------|-------|-------------|
| 04 | AZ | 91 |
| 06 | CA | 482 |
| 18 | **IN** | **566** |
| 23 | ME | 23 |
| 24 | MD | 157 |
| 25 | MA | 58 |
| 29 | MO | **1** (incidental) |
| 32 | NV | 19 |
| 41 | OR | 241 |
| 48 | TX | 1228 |
| 49 | UT | 255 |
| 51 | VA | 227 |

Corrections this forces:
- **Indiana IS place-loaded (566).** Earlier "IN excluded" (CONTEXT + RESEARCH static analysis) is WRONG per live data. So **Bloomington/Monroe County, IN is a VALID fixture** — an unincorporated Monroe County point (outside Bloomington city limits) should show "Unincorporated Monroe County, IN".
- **Missouri (1 place) must be EXCLUDED** from the gate — with only 1 place loaded, a real MO city point would look place-less → false "unincorporated."
- **Recommended `PLACE_LOADED_STATES` (meaningful coverage):** AZ, CA, IN, ME, MD, MA, NV, OR, TX, UT, VA (11 states; exclude MO).
- **Planner decision:** prefer a **dynamic gate** — "does this point's state have ANY G4110 rows loaded?" derived from the DB (auto-expands as states load) — over a hardcoded list, if cheap; otherwise hardcode the 11-state list above with a comment pointing at this query. Either way the gate MUST exclude states with negligible coverage (MO).

## Requirements (to register on the phase)
- LOC-01 backend locality probe in resolveOfficialsAtPoint (place + county ST_Covers), mirrors tribal_land
- LOC-02 place-loaded-state gating (incorporated:null outside loaded states)
- LOC-03 locality added to /candidates/search subset + inherited by coordinate route
- LOC-04 frontend threads locality (api → hook → representingCity) and renders "Unincorporated {County}, ST"
