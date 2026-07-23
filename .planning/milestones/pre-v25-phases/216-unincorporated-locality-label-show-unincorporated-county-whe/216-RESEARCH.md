# Phase 216: Unincorporated Locality Label - Research

**Researched:** 2026-07-22
**Domain:** Cross-repo (accounts-api backend geofence probe + essentials frontend banner label)
**Confidence:** HIGH

## Summary

This phase is a small, well-precedented cross-repo change. The backend precedent
(`tribal_land`, added Phase 132/133) is a complete, working template for exactly this
shape of feature: a dedicated narrow `ST_Covers` geofence probe, run in the same
`Promise.all` as the district/statewide queries, always present in the response shape,
attached at both return points of `resolveOfficialsAtPoint`. Every backend file:line
reference in 216-CONTEXT.md was re-verified this session and is accurate. One factual
correction to CONTEXT.md's list surfaced during verification: **Utah (UT) is also a
place-loaded state** (see Correction below) — CONTEXT.md's 9-state list should be 10.

The frontend side has one non-obvious complication CONTEXT.md's file:line refs did not
fully unpack: **coordinate-mode data does not flow through `usePoliticianData.js` /
`tribalLand` at all.** Coordinate results are injected directly into `browseResults`
state via `resolveCoordinate()`, bypassing the hook entirely, and `lookupCoordinate()`
in `api.jsx` today does not even unwrap `tribal_land`, let alone a new `locality`
field. Mirroring `tribal_land`'s hook-based pattern alone will silently NOT work for
coordinate searches — a second, parallel piece of state (alongside `browseResults`) is
required. This is the single most important thing for the planner to get right; it is
detailed with exact line numbers below.

**Primary recommendation:** Backend — add two new dedicated `ST_Covers` probes
(place: `mtfcc IN ('G4110','G4120')`; county: `mtfcc = 'G4020'`) inside
`resolveOfficialsAtPoint`, in the same `Promise.all` as the existing `tribalQueryText`,
gated by a new `PLACE_LOADED_STATES` allowlist constant. Frontend — thread `locality`
through both the address path (`usePoliticianData.js`, mirroring `tribalLand`) AND a
new parallel state for coordinate mode (mirroring how `browseResults` bypasses the
hook), then branch in the `representingCity` memo immediately before the
`parseCityFromAddress` fallback (address mode) and in place of the unconditional
`return null` (coordinate mode).

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 — Detection is backend-only.** Frontend cannot distinguish a postal city from
  an incorporated place. Add a locality probe to the shared core `resolveOfficialsAtPoint`.
- **D-02 — Gate to place-loaded states.** G4110 place geofences are loaded per-state
  only. In un-loaded states a real city looks place-less -> FALSE "unincorporated." So
  emit `incorporated: false` ONLY in place-loaded states; elsewhere emit
  `incorporated: null` (unknown) and the frontend suppresses the label (keeps today's
  behavior). Backend owns the place-loaded-state allowlist (derive from / co-locate
  with the TIGER loader's per-state place list).
- **D-03 — County name in coordinate responses is OK.** County is coarse (not the
  parcel); `tribal_land.name` is already echoed for coordinates. Returning
  `county_name` for coordinate lookups is acceptable and does not violate the
  Phase-213 no-echo model (which is about the raw lat/lng / exact address).
- **D-04 — CDPs show their place name; only truly place-less points say
  "Unincorporated".** TIGER's place layer (G4110) includes Census Designated Places
  (unincorporated communities like "East Los Angeles"). Rule: ANY G4110/G4120
  `ST_Covers` hit => treat as "has a place" (show the place name path, unchanged); only
  ZERO place rows => "Unincorporated {County}". Do NOT try to separate municipalities
  from CDPs (needs a `CLASSFP`/`LSAD` field that isn't loaded).
- **Wording:** county names already include "County" (e.g. "Pima County") ->
  "Unincorporated Pima County, AZ".

### Claude's Discretion
Not explicitly separated into its own section in 216-CONTEXT.md, but the following are
implementation details left open for the planner/researcher to resolve (addressed in
this document): exact field placement of the two new probes relative to the existing
`tribalQueryText`; whether `place_name`/`county_name` should be null'd or left populated
under the un-loaded-state gate; the exact frontend state-threading mechanism for
coordinate mode; naming of the new frontend variable to avoid colliding with the
existing `fromLocality`/`localityLabel` terminology (see Common Pitfalls).

### Deferred Ideas (OUT OF SCOPE)
- Separating true municipalities from CDPs (needs `CLASSFP`/`LSAD`, not loaded) — D-04
  explicitly rejects this for this phase.
- Seeding place-layer geofences for new states (Indiana, etc.) — out of scope; IN stays
  an explicit non-goal / test-invalidity case (Bloomington, IN fixture).
- Reverse-geocoding or resolving anything more precise than the county name for
  coordinate lookups — out of scope per the existing Phase-213 no-echo privacy model,
  which D-03 explicitly does not reopen.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LOC-01 | Backend locality probe in `resolveOfficialsAtPoint` (place + county `ST_Covers`), mirrors `tribal_land` | Exact insertion point identified: `essentialsService.ts` lines 752-776 (tribal precedent) and 765-769 (`Promise.all`); see Code Examples |
| LOC-02 | Place-loaded-state gating (`incorporated:null` outside loaded states) | `STATE_LAYER_ALLOWLIST` (loader source of truth) verified; **10 states confirmed actually loaded**, not 9 — see Correction |
| LOC-03 | `locality` added to `/candidates/search` subset + inherited by coordinate route | Subset object confirmed at `essentialsCandidates.ts:115-120`; coordinate route confirmed verbatim pass-through at `essentialsCoordinateLookup.ts:78-79` |
| LOC-04 | Frontend threads `locality` (api -> hook -> `representingCity`) and renders "Unincorporated {County}, ST" | Address-mode path mirrors `tribal_land` exactly; **coordinate-mode path requires new state — hook is bypassed entirely for coordinate searches** (see Summary + Architecture Patterns) |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Place/county `ST_Covers` geofence probe | API / Backend | Database (PostGIS) | Only the backend has the geofence geometry and can run `ST_Covers`; frontend has no way to distinguish postal city from incorporated place (D-01) |
| Place-loaded-state gating logic | API / Backend | — | The allowlist of which states have G4110 data loaded is backend-owned config (co-located with the TIGER loader), not a frontend concern |
| `locality` field exposure on both search routes | API / Backend | — | Both `/candidates/search` (explicit subset) and `/coordinate-lookup` (verbatim passthrough) are backend route-layer concerns |
| `locality` state threading (api.jsx -> hook -> Results.jsx) | Browser / Client | — | This is a client-rendered SPA (Vite + React, no SSR) — all of `api.jsx`, `usePoliticianData.js`, `Results.jsx` execute in the browser |
| "Unincorporated {County}, ST" banner rendering | Browser / Client | — | `representingCity` memo + `buildBannerProps` are pure client-side render logic |

## Standard Stack

No new libraries are introduced by this phase. It extends existing, already-adopted
infrastructure in both repos.

### Core (existing — no new installs)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PostGIS (`ST_Covers`) | (existing extension) | Geofence point-in-polygon probe | Already the sole mechanism for every other geofence check in `resolveOfficialsAtPoint` (district, statewide, tribal) |
| Express | (existing) | Route layer (`essentialsCandidates.ts`, `essentialsCoordinateLookup.ts`) | Already in use; no new route needed, only response-shape changes |
| Vitest | 4.1.4 (frontend `package.json`); backend `vitest.config.ts` present | Test runner both repos | Already the test runner for both `essentialsService-tribal-land.test.ts` and `bannerProps.test.js` |

**Installation:** None required — this phase touches only existing files.

## Package Legitimacy Audit

**Not applicable.** This phase installs zero new external packages in either repo. No
`npm install` step exists in the implementation plan. Skip the legitimacy gate.

## Architecture Patterns

### System Architecture Diagram

```
                    ┌─────────────────────────────────────────────┐
                    │        accounts-api (C:/EV-Accounts)         │
                    │                                               │
  address string ──▶│ getRepresentativesByAddress()                │
                    │        │                                      │
  {lat,lng} ────────▶│ getRepresentativesByCoordinate()             │
                    │        │                                      │
                    │        ▼                                      │
                    │  resolveOfficialsAtPoint(point, state, ...)   │
                    │        │                                      │
                    │        ├─▶ districtQueryText  ─┐               │
                    │        ├─▶ statewideQueryText  ├─ Promise.all  │
                    │        ├─▶ tribalQueryText      │  (existing)  │
                    │        ├─▶ placeQueryText  (NEW)│              │
                    │        └─▶ countyQueryText (NEW)┘              │
                    │        │                                      │
                    │        ▼                                      │
                    │  locality = gate(placeHit, countyHit, state)  │
                    │        │                                      │
                    │        ▼                                      │
                    │  return {..., tribal_land, locality, county}  │
                    └────────────────┬──────────────────────────────┘
                                     │
                    ┌────────────────┼──────────────────────────────┐
                    │  routes/essentialsCandidates.ts (explicit     │
                    │  subset — MUST add `locality` to the object   │
                    │  literal at lines 115-120)                    │
                    │                                                │
                    │  routes/essentialsCoordinateLookup.ts (line   │
                    │  78-79: `res.json(result)` — verbatim,        │
                    │  inherits `locality` automatically, NO edit   │
                    │  needed here)                                 │
                    └────────────────┬──────────────────────────────┘
                                     │ HTTP JSON
                    ┌────────────────▼──────────────────────────────┐
                    │      essentials (this repo) — Browser/Client   │
                    │                                                │
                    │  api.jsx                                       │
                    │   ├─ searchPoliticians()  — unwraps locality   │
                    │   │  alongside tribal_land (address path)      │
                    │   └─ lookupCoordinate()   — must ALSO unwrap   │
                    │      locality (currently unwraps NOTHING but   │
                    │      politicians+formattedAddress today)       │
                    │                        │                        │
                    │        ┌───────────────┴────────────────┐       │
                    │        ▼                                ▼       │
                    │ usePoliticianData.js              Results.jsx   │
                    │  (address mode only —        resolveCoordinate()│
                    │   mirrors tribalLand)          sets browseResults│
                    │        │                       + NEW coordLocality│
                    │        │                                │       │
                    │        └───────────────┬────────────────┘       │
                    │                        ▼                        │
                    │           representingCity useMemo               │
                    │  (browse label / coordinate-guard / official's  │
                    │   representing_city / chamber_name / NEW        │
                    │   locality check / parseCityFromAddress)        │
                    │                        │                        │
                    │                        ▼                        │
                    │              buildBannerProps('city', ctx)      │
                    │        "Unincorporated Pima County, AZ"         │
                    └───────────────────────────────────────────────┘
```

### Recommended structure (files touched, no new files)
```
C:/EV-Accounts/backend/src/lib/essentialsService.ts       # LOC-01, LOC-02 (probes + gate)
C:/EV-Accounts/backend/src/routes/essentialsCandidates.ts # LOC-03 (subset object)
C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts  # source of truth for gate list (read-only reference, or co-locate PLACE_LOADED_STATES export here)
C:/EV-Accounts/backend/test/essentialsService-locality.test.ts  # NEW, mirrors essentialsService-tribal-land.test.ts

src/lib/api.jsx                    # LOC-04 unwrap in searchPoliticians() AND lookupCoordinate()
src/hooks/usePoliticianData.js     # LOC-04 mirror tribalLand
src/pages/Results.jsx              # LOC-04 new coordLocality state + representingCity branch
src/lib/bannerProps.test.js        # extend with an "Unincorporated {County}, ST" case
```

### Pattern 1: Dedicated narrow ST_Covers probe (mirror `tribal_land`)
**What:** A standalone SQL query, filtered to specific MTFCC codes, run via
`ST_Covers` against the same point, executed in the same `Promise.all` as the other
geofence queries — NOT folded into the main district-join query.
**When to use:** Whenever a field needs to be "always present regardless of whether
any office/district row exists at that point" (place geofences carry
`writeDistrictRow: false` — line 294 — so they never appear in the officials-joined
district rows; a direct probe is the ONLY way to detect them).
**Example (existing precedent, verified this session):**
```typescript
// Source: C:/EV-Accounts backend/src/lib/essentialsService.ts:752-776
const tribalQueryText = `
  SELECT geo_id, name
  FROM essentials.geofence_boundaries
  WHERE mtfcc = 'X0004'
    AND public.ST_Covers(
      geometry,
      public.ST_SetSRID(public.ST_MakePoint($1::float8, $2::float8), 4326)
    )
  LIMIT 1
`;

const [districtResult, statewideResult, tribalResult] = await Promise.all([
  pool.query(districtQueryText, [resolvedLng, resolvedLat]),
  state ? pool.query(statewideQueryText, [state]) : Promise.resolve({ rows: [] }),
  pool.query(tribalQueryText, [resolvedLng, resolvedLat]),
]);

let tribal_land: { on_reservation: boolean; name?: string } = { on_reservation: false };
if (tribalResult.rows.length > 0) {
  tribal_land = { on_reservation: true, name: tribalResult.rows[0].name as string };
}
```
The new probes should be added to this SAME `Promise.all` array (two more entries),
following the identical shape.

### Pattern 2: Nationwide-vs-per-state MTFCC availability
**What:** Not every MTFCC layer is loaded for every state. County (`G4020`) is loaded
NATIONWIDE (a distinct `--nationwide county` load mode exists — verified at
`load-state-tiger-boundaries.ts:1290-1360`, gated by a pre-flight row-count assertion
of 3,050-3,200 records for 50 states + DC). Place (`G4110`/`G4120`) is loaded ONLY for
states explicitly run through the per-state loader.
**When to use:** Any time a new field derives from a TIGER layer, check which mode
(nationwide vs per-state) loaded it before assuming universal availability.
**Example — verified per-state place evidence in the loader source:**
```typescript
// Source: C:/EV-Accounts backend/scripts/load-state-tiger-boundaries.ts:34-47
const STATE_LAYER_ALLOWLIST: Record<string, Set<string>> = {
  CA: new Set(['cd', 'sldu', 'sldl', 'unsd', 'place', 'county', 'cousub']),
  TX: new Set(['cd', 'sldu', 'sldl', 'county', 'place']),
  UT: new Set(['cd119', 'sldu', 'sldl', 'unsd', 'place', 'county', 'aiannh']),
  IN: new Set(['cd', 'sldu', 'sldl', 'unsd', 'place', 'cousub']),   // <- allowlisted but NEVER actually loaded (no assertion evidence — see Correction)
  MA: new Set(['cd', 'sldu', 'sldl', 'place', 'county', 'cousub']),
  ME: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),
  OR: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),
  MD: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),
  VA: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),
  NV: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),
  AZ: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),
  DC: new Set(['sldl']),
};

// Corroborating evidence that a state's 'place' entry was ACTUALLY loaded (not
// just permitted) is the presence of a post-load assertion block:
const STATE_CITY_ASSERTIONS: Record<string, string[]> = {
  UT: ['Magna', 'Kearns', 'Copperton', 'Emigration Canyon', 'White City'],  // <- confirms UT WAS loaded
  TX: ['Longview city', 'Houston city', 'Dallas city', 'Austin city'],
  MA: ['Cambridge city'],
  ME: ['Portland city'],
  OR: ['Portland city'],
  MD: ['Baltimore city'],
  VA: ['Alexandria city'],
  NV: ['Las Vegas city', 'Henderson city', 'North Las Vegas city', 'Boulder City city'],
  AZ: ['Tucson city', 'Oro Valley town', 'Marana town', 'Sahuarita town', 'South Tucson city'],
  // IN and DC absent -> never actually run with 'place'
};
// CA is not in STATE_CITY_ASSERTIONS but has its own EXPECTED_CA_MTFCC block (line 811)
// confirming its place-layer count separately.
```

### Correction to CONTEXT.md's place-loaded-state list
CONTEXT.md states "today: MA, ME, TX, CA, OR, MD, VA, NV, AZ" (9 states). Verification
this session found **UT (Utah) also has confirmed loaded place data** — it appears in
all three of `STATE_LAYER_ALLOWLIST`, `STATE_RUN_MAKEVALID`, AND (decisively)
`STATE_CITY_ASSERTIONS` with 5 real Utah place names asserted post-load. This matches
`MEMORY.md`'s own note: "10 UT cities done; only SLC-D4 gap remains" — UT cities are a
completed deep-seed, which requires the city's G4110 geofence to exist for by-district
routing to work at all.

**Recommendation for the planner:** the `PLACE_LOADED_STATES` gate list should be
**`['CA', 'TX', 'UT', 'MA', 'ME', 'OR', 'MD', 'VA', 'NV', 'AZ']` (10 states)**, not 9.
Indiana (`IN`) is allowlisted in `STATE_LAYER_ALLOWLIST` (meaning a future load run
COULD include it) but has no assertion evidence of ever having been loaded — this is
exactly the Bloomington, IN false-positive risk 216-CONTEXT.md's test fixtures already
warn about, and confirms IN must NOT be in the gate list today.

**Caveat (LOW confidence on completeness, not on the UT finding itself):** this
10-state list is derived from static source-code evidence (allowlist + assertions), not
a live DB query. `STATE_CITY_ASSERTIONS`/`EXPECTED_XX_MTFCC` blocks are load-time
checks; they prove the load happened at some point but this session could not confirm
against live production data (no DB/psql access was available in this research
session). **Recommend the planner or a Wave 0 task run:**
```sql
SELECT DISTINCT state FROM essentials.geofence_boundaries WHERE mtfcc = 'G4110' ORDER BY state;
```
against production before finalizing the hardcoded gate list, to catch any drift
between "was loaded at some point" and "is present today."

### Pattern 3: Frontend hook-bypass for coordinate/browse modes (NOT in 216-CONTEXT.md — new finding)
**What:** `usePoliticianData.js` (and its `tribalLand`/soon `locality` state) is ONLY
wired up for **address-mode** searches. `Results.jsx` explicitly derives `list`/`phase`
from `browseResults`/`browseLoading` — NOT from the hook — whenever
`searchMode === 'browse' || searchMode === 'coordinate'` (verified at
`Results.jsx:494-499`). Coordinate mode's own resolver, `resolveCoordinate()`
(`Results.jsx:1014-1058`), calls `lookupCoordinate()` and stores ONLY `data` into
`browseResults` (line 1057) — it discards everything else the backend returns.
**Why it matters:** `tribal_land` itself has this same latent gap today — the
on-reservation badge (`Results.jsx:1916-1923`) reads `tribalLand` from the hook, which
is never populated for a coordinate search (the hook isn't even `enabled` — its
`enabled` flag is `!!activeQuery && !cachedResult`, and `activeQuery = queryFromUrl`,
which coordinate mode explicitly clears via `next.delete('q')` at line 1030). This is
a pre-existing bug, out of this phase's stated scope, but the SAME wiring gap is what
LOC-04 must not blindly inherit for `locality` — mirroring `tribal_land`'s CURRENT
frontend wiring alone will not make "Unincorporated {County}" work for coordinate
searches.
**Correct fix shape:** add a SECOND state variable dedicated to coordinate-mode
locality (parallel to how `browseResults` is a second data channel alongside the
hook's `data`), populated inside `resolveCoordinate()`:
```javascript
// Results.jsx — new state, alongside existing browseResults/browseLoading:
const [coordLocality, setCoordLocality] = useState(null);

// inside resolveCoordinate(), after lookupCoordinate() gains a `locality` field:
async function resolveCoordinate(lat, lng, raw, { method = 'combobox' } = {}) {
  // ...unchanged setup...
  const { data, error, code, locality } = await lookupCoordinate(lat, lng);
  setBrowseLoading(false);
  if (error) {
    // ...unchanged...
    setCoordLocality(null);
    return;
  }
  track('essentials_coordinate_searched', { method, outcome: 'success' });
  setBrowseResults(data);
  setCoordLocality(locality || null);
}
```
Then `representingCity`'s coordinate-mode branch reads `coordLocality` instead of
unconditionally returning `null`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Point-in-polygon incorporation check | A custom bounding-box or client-side heuristic | The existing `ST_Covers` + `essentials.geofence_boundaries` infrastructure, mirroring `tribalQueryText` exactly | PostGIS is already indexed and battle-tested for this exact query shape at this exact call site; a second implementation risks coordinate-order bugs (the codebase has explicit `$1=lng, $2=lat` comments warning about this at every call site) |
| Place-loaded-state detection | Runtime introspection (e.g. querying `geofence_boundaries` on every request to see if a state has place data) | A static, hardcoded allowlist constant (mirrors `STATE_LAYER_ALLOWLIST`'s own explicit-code-change-required philosophy, line 30-32: "Adding a new state is a code change, on purpose") | The loader's own comment explicitly rejects config-driven/dynamic lists for exactly this class of gate — consistency with that established convention avoids introducing a second, inconsistent pattern in the same codebase |
| "Is this a real city vs. a CDP" distinction | A heuristic on place name (e.g. string-matching against known CDP name patterns) | Nothing — D-04 explicitly defers this; any G4110/G4120 hit means "has a place" | The data needed (`CLASSFP`/`LSAD`) isn't loaded; guessing from name patterns would be unreliable and is explicitly out of scope |

**Key insight:** Every piece of this feature has a working precedent already in the
codebase (`tribal_land` for the backend probe shape; `browseResults`-bypasses-hook for
the coordinate-mode frontend wiring gap). The main risk in this phase is not "what do I
build" but "which existing pattern do I mirror, and did I mirror ALL of it" — the
coordinate-mode gap above is exactly the kind of partial-mirror mistake to avoid.

## Common Pitfalls

### Pitfall 1: Mirroring `tribal_land`'s frontend wiring but missing the coordinate-mode gap
**What goes wrong:** The plan adds `locality` to `usePoliticianData.js` exactly like
`tribalLand`, ships it, and it works perfectly for address searches — but coordinate
searches (a first-class, recently-shipped search mode, SRCH-05/Phase 213/214) never
show "Unincorporated {County}" because the hook is never invoked for that mode.
**Why it happens:** `tribal_land`'s existing frontend code LOOKS like a complete
precedent to mirror, but it was only ever wired for address mode; nothing in
216-CONTEXT.md's file:line refs (`api.jsx:109-120`, `usePoliticianData.js`) flags this.
**How to avoid:** Explicitly add the parallel `coordLocality` state in `Results.jsx`
(Pattern 3 above) and update `lookupCoordinate()` in `api.jsx` to unwrap `locality`
(and, as a bonus low-risk fix, `tribal_land` too, since it has the identical gap today
— though fixing the pre-existing tribal_land gap is not itself an LOC-0x requirement,
flag it as an optional bonus fix during planning, not a silent scope-creep).
**Warning signs:** A UAT/checkpoint scenario that ONLY tests address-mode unincorporated
points would not catch this; the phase's own test fixtures (Pima County, AZ / LA
County, CA) should be exercised via BOTH address search and coordinate search.

### Pitfall 2: Variable-name collision with the existing `locality`/`fromLocality` terminology
**What goes wrong:** `Results.jsx` already has `fromLocality` (line 391,
`searchParams.get('from_locality') === '1'`) and `localityLabel` (line 392,
`searchParams.get('browse_label')`) — an EXISTING, UNRELATED concept from ADR-0001
meaning "did the user arrive here via a locality/place-name search" (city-level
precision vs. parcel-level precision). Naming the new incorporation-status object bare
`locality` in `Results.jsx` risks confusing these two concepts in code review and in
future maintenance.
**Why it happens:** The backend field is correctly named `locality` (that's fine to
keep at the API-contract level), but blindly propagating that name as a local variable
in `Results.jsx` collides with pre-existing, semantically different `locality`-prefixed
names in the SAME file.
**How to avoid:** In `Results.jsx` specifically, destructure/store the new
incorporation-status object under a distinct name — e.g. `incorporationInfo` or
`localityStatus` — while keeping the backend JSON field itself named `locality` (no
backend rename needed; this is purely a frontend local-variable-naming
recommendation). `usePoliticianData.js` and `api.jsx` can keep `locality` as the field
name since they don't have the same collision.
**Warning signs:** Code review comments asking "wait, is this the same `locality` as
`fromLocality`?" — a sign the naming needs disambiguation.

### Pitfall 3: Forgetting the un-loaded-state gate applies to `incorporated`, not to `county_name`
**What goes wrong:** A blanket "if state not in PLACE_LOADED_STATES, return
`{incorporated:null, place_name:null, county_name:null}`" implementation would also
suppress `county_name` for un-loaded states, even though D-03 explicitly says county
name is safe to return everywhere (county data is loaded nationwide, independent of
the place-layer gate).
**Why it happens:** It's simpler to write one combined null-out branch than to reason
about which sub-fields are gated by which condition.
**How to avoid:** Gate ONLY the derived `incorporated` boolean (and, if desired,
`place_name`, since a place hit is meaningless without the loaded-state guarantee) on
`PLACE_LOADED_STATES`. Always run the county probe and populate `county_name`
regardless of state, since D-03 sanctions this and the county layer's nationwide
loading gives it no false-positive risk. This also keeps the query cheap — the county
probe can be UNCONDITIONALLY added to the `Promise.all` (matching `tribalQueryText`'s
unconditional-always-runs pattern) with the state-gate applied only when constructing
the final `locality` object.
**Warning signs:** A test asserting county_name is present for an un-loaded-state
coordinate (e.g. Bloomington, IN) failing unexpectedly.

### Pitfall 4: Coordinate-order bugs in the two new SQL probes
**What goes wrong:** `ST_MakePoint` takes `(longitude, latitude)`; every other query in
this file has an explicit comment warning about this (`$1 = lng, $2 = lat`). A copy-paste
of the tribal probe that doesn't preserve parameter order silently returns wrong-location
results (a real risk given how many prior GOTCHAs in this codebase's history stem from
exactly this lng/lat swap, per `MEMORY.md`'s recurring "ST_MakePoint lng/lat" notes).
**Why it happens:** It's an easy transcription error when writing two new near-identical
queries.
**How to avoid:** Copy the EXACT `ST_SetSRID(ST_MakePoint($1::float8, $2::float8), 4326)`
expression verbatim from `tribalQueryText`, changing only the `mtfcc` filter.
**Warning signs:** A test where a coordinate resolves to a place name from a completely
different region.

## Code Examples

### Backend: adding the two new probes (LOC-01)
```typescript
// Source: mirrors C:/EV-Accounts backend/src/lib/essentialsService.ts:752-776 (tribalQueryText)
const placeQueryText = `
  SELECT geo_id, name
  FROM essentials.geofence_boundaries
  WHERE mtfcc IN ('G4110', 'G4120')
    AND public.ST_Covers(
      geometry,
      public.ST_SetSRID(public.ST_MakePoint($1::float8, $2::float8), 4326)
    )
  LIMIT 1
`;

const countyNameQueryText = `
  SELECT geo_id, name
  FROM essentials.geofence_boundaries
  WHERE mtfcc = 'G4020'
    AND public.ST_Covers(
      geometry,
      public.ST_SetSRID(public.ST_MakePoint($1::float8, $2::float8), 4326)
    )
  LIMIT 1
`;

const [districtResult, statewideResult, tribalResult, placeResult, countyNameResult] = await Promise.all([
  pool.query(districtQueryText, [resolvedLng, resolvedLat]),
  state ? pool.query(statewideQueryText, [state]) : Promise.resolve({ rows: [] as unknown[] }),
  pool.query(tribalQueryText, [resolvedLng, resolvedLat]),
  pool.query(placeQueryText, [resolvedLng, resolvedLat]),
  pool.query(countyNameQueryText, [resolvedLng, resolvedLat]),
]);

// PLACE_LOADED_STATES: co-locate with load-state-tiger-boundaries.ts's
// STATE_LAYER_ALLOWLIST/STATE_CITY_ASSERTIONS as the source of truth; keep this
// list in sync manually when a new state's place layer is loaded (mirrors that
// file's own "adding a state is a code change, on purpose" philosophy).
const PLACE_LOADED_STATES = new Set(['CA', 'TX', 'UT', 'MA', 'ME', 'OR', 'MD', 'VA', 'NV', 'AZ']);

const county_name = countyNameResult.rows[0]?.name ?? null;
let locality: { incorporated: boolean | null; place_name: string | null; county_name: string | null };
if (!state || !PLACE_LOADED_STATES.has(state.toUpperCase())) {
  locality = { incorporated: null, place_name: null, county_name };
} else if (placeResult.rows.length > 0) {
  locality = { incorporated: true, place_name: placeResult.rows[0].name as string, county_name };
} else {
  locality = { incorporated: false, place_name: null, county_name };
}

// Attach at BOTH return points, mirroring tribal_land (lines 784 and 857):
// return { politicians: [], jurisdiction: null, matchedAddress, tribal_land, locality, county: null, jurisdictionGeoIds: {...} };
// return { politicians, jurisdiction, matchedAddress, tribal_land, locality, county, jurisdictionGeoIds };
```

### Backend: adding `locality` to the explicit subset (LOC-03)
```typescript
// Source: C:/EV-Accounts backend/src/routes/essentialsCandidates.ts:115-120
res.status(200).json({
  politicians: result.politicians,
  tribal_land: result.tribal_land ?? { on_reservation: false },
  locality: result.locality ?? { incorporated: null, place_name: null, county_name: null },
  county: result.county ?? null,
  jurisdiction: result.jurisdictionGeoIds,
});
// routes/essentialsCoordinateLookup.ts:78-79 needs NO edit — `res.status(200).json(result)`
// already returns the full AddressSearchResult object verbatim, which will include
// `locality` automatically once it's added to the AddressSearchResult interface
// (essentialsService.ts:159-179) and populated by resolveOfficialsAtPoint.
```

### Frontend: unwrapping `locality` in both api.jsx entry points (LOC-04)
```javascript
// searchPoliticians() — src/lib/api.jsx:109-120 (extends the existing tribal_land unwrap)
let politicians = data;
let tribal_land;
let locality;
if (data && !Array.isArray(data) && Array.isArray(data.politicians)) {
  politicians = data.politicians;
  tribal_land = data.tribal_land;
  locality = data.locality;
}
return { status: status || "fresh", data: politicians, formattedAddress, tribal_land, locality };

// lookupCoordinate() — src/lib/api.jsx:527-551 (currently unwraps NEITHER
// tribal_land NOR locality — must add both fields to the return object)
const data = await res.json();
const politicians = Array.isArray(data) ? data : (data.politicians || []);
return {
  data: politicians,
  error: null,
  code: null,
  formattedAddress: data.matchedAddress ?? '',
  locality: Array.isArray(data) ? null : (data.locality ?? null),
};
```

### Frontend: `representingCity` branch (LOC-04)
```javascript
// src/pages/Results.jsx — inside the representingCity useMemo (currently lines 1141-1188)
// Coordinate-mode guard (currently line 1157-1159, unconditional `return null`):
if (searchMode === 'coordinate') {
  if (coordLocality?.incorporated === false && coordLocality?.county_name) {
    return `Unincorporated ${coordLocality.county_name}`;
  }
  return null;
}

// ...existing representing_city / chamber_name fallback loops, unchanged...

// NEW — inserted immediately BEFORE the parseCityFromAddress fallback (currently line 1183-1187):
if (locality?.incorporated === false && locality?.county_name) {
  return `Unincorporated ${locality.county_name}`;
}
const fromAddress = parseCityFromAddress(addressInput);
if (fromAddress) return fromAddress;
return null;
```
Add `locality` (from the hook) and `coordLocality` (new state) to the memo's
dependency array.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| `representingCity` falls back to `parseCityFromAddress` for any address without a matched official | Locality-aware: checks the new backend-derived `incorporated:false` signal first | This phase (216) | Eliminates the specific misleading-label bug this phase exists to fix — an unincorporated parcel no longer silently displays its nearest postal city as if it were the governing municipality |

No deprecated APIs are involved; this is a straightforward additive extension of an
existing, actively-used pattern (`tribal_land`).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The 10-state `PLACE_LOADED_STATES` list (CA, TX, UT, MA, ME, OR, MD, VA, NV, AZ) reflects what is ACTUALLY loaded in production today, based on static source evidence (`STATE_LAYER_ALLOWLIST` + `STATE_CITY_ASSERTIONS` + `STATE_RUN_MAKEVALID`) rather than a live DB query (no DB access was available this session) | Architecture Patterns / Correction | If a state's place data was later dropped/rolled back, or if UT's assertion evidence is stale, the gate would wrongly mark that state's unincorporated points as `incorporated:false` (false "Unincorporated" label) or wrongly suppress a state that IS loaded. Recommend a Wave 0 task run `SELECT DISTINCT state FROM essentials.geofence_boundaries WHERE mtfcc='G4110'` against production before finalizing the list. |
| A2 | County officials at an unincorporated point (district_type = 'COUNTY') will not populate `representing_city`/`chamber_name` in a way that would return a value from the existing fallback loops (lines 1167-1182) before the new locality check is reached — based on reading the loop conditions, not on a live test against an actual unincorporated-point API response | Code Examples / Frontend representingCity branch | If a county chamber's `chamber_name` happens to match the `/^(\w[\w\s]+?)\s+City\b/` or `/^City of\s+(.+)$/i` regex (unlikely but not verified against live data), the new locality check would never be reached for that jurisdiction, and the old (wrong) label would still show. Verify against the Pima County, AZ / LA County, CA test fixtures during execution. |

**If this table is empty:** N/A — see above; both entries are genuine open
verification gaps, not compliance/policy assumptions.

## Open Questions

1. **Is the 10-state `PLACE_LOADED_STATES` list current in production?**
   - What we know: Static source-code evidence (allowlist + post-load assertions) in
     `load-state-tiger-boundaries.ts` strongly supports CA, TX, UT, MA, ME, OR, MD, VA,
     NV, AZ.
   - What's unclear: Whether a live DB query would confirm the exact same set today
     (no DB/psql access in this research session).
   - Recommendation: Add a Wave 0 verification task (or a plan-time checkpoint) to run
     the `SELECT DISTINCT state ... WHERE mtfcc='G4110'` query against production
     before hardcoding the final list.

2. **Should the pre-existing `tribal_land` coordinate-mode wiring gap be fixed in this
   phase, or filed as a separate follow-up?**
   - What we know: `tribal_land`'s badge (`Results.jsx:1916-1923`) never fires for
     coordinate searches today, because `tribalLand` only comes from the
     address-mode-only hook. This is NOT something LOC-01..04 require fixing.
   - What's unclear: Whether fixing it "for free" while already touching
     `lookupCoordinate()`/`resolveCoordinate()` for `locality` is in scope, or whether
     it should stay a separate, explicitly-tracked bug.
   - Recommendation: The planner should make an explicit, visible decision here (either
     "yes, bundle it, it's a one-line addition alongside `locality`" or "no, defer,
     file as a follow-up") rather than silently doing (or not doing) it as a side effect.

## Environment Availability

Skipped — this phase introduces no new external tool/service/runtime dependency. It
reuses the existing PostgreSQL/PostGIS connection (`pool.query`), the existing Express
route layer, and the existing React/Vite frontend build — all already verified
operational by prior phases (213, 214, 215) shipping to the same stack.

## Validation Architecture

### Test Framework

**Backend (accounts-api)**
| Property | Value |
|----------|-------|
| Framework | Vitest (backend `vitest.config.ts`, `pool: 'forks'`, `environment: 'node'`) |
| Config file | `C:/EV-Accounts/backend/vitest.config.ts` |
| Quick run command | `npx vitest run test/essentialsService-locality.test.ts` (new file, mirrors `essentialsService-tribal-land.test.ts`) |
| Full suite command | `npm test` (= `vitest run`) from `C:/EV-Accounts/backend` |

**Frontend (essentials)**
| Property | Value |
|----------|-------|
| Framework | Vitest (no dedicated `vitest.config.*` — reads Vite defaults; existing pure-logic tests like `bannerProps.test.js` run without jsdom) |
| Config file | none — see `vite.config.js` (no `test` block present; Vitest project-root defaults apply) |
| Quick run command | `npx vitest run src/lib/bannerProps.test.js` |
| Full suite command | `npm test` (= `vitest run`) from repo root |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LOC-01 | Place probe (G4110/G4120 hit -> incorporated:true); county probe always returns county_name; SQL uses `ST_Covers` + correct `$1=lng,$2=lat` param order | unit (static source-pattern assertions, mirrors `essentialsService-tribal-land.test.ts`'s style) | `npx vitest run test/essentialsService-locality.test.ts` | ❌ Wave 0 (new file) |
| LOC-02 | Place-loaded-state gate: `incorporated:null` for a state NOT in `PLACE_LOADED_STATES` (e.g. IN/Bloomington fixture), `incorporated:false` for a place-loaded state with no place hit | unit | same file as LOC-01 | ❌ Wave 0 |
| LOC-03 | `/candidates/search` subset response includes `locality`; coordinate route inherits it verbatim | integration (route-level, mirrors `essentialsCoordinateLookup.test.ts`'s supertest+mock pattern) | `npx vitest run src/routes/essentialsCoordinateLookup.test.ts` (extend) + new `essentialsCandidates.test.ts` (does not exist today — Wave 0 gap) | ❌ Wave 0 (no existing `essentialsCandidates.test.ts` at all) |
| LOC-04 | `buildBannerProps` renders "Unincorporated Pima County, AZ" (no double state); `representingCity` memo returns the unincorporated label for BOTH address and coordinate modes | unit (`bannerProps.test.js` extension) + component/hook-level test for `representingCity` (no existing test file covers this memo directly — manual/UAT acceptable if no `Results.test.jsx` exists) | `npx vitest run src/lib/bannerProps.test.js` | Partial — `bannerProps.test.js` exists (extend it); no test currently exercises `representingCity` directly, verify via manual live checkpoint against the Pima County, AZ / LA County, CA fixtures in BOTH address and coordinate search modes |

### Sampling Rate
- **Per task commit:** the quick-run command scoped to the file(s) touched by that task.
- **Per wave merge:** full suite green in BOTH repos (`npm test` in `C:/EV-Accounts/backend` AND in `C:/Transparent Motivations/essentials`).
- **Phase gate:** full suite green in both repos before `/gsd-verify-work`, PLUS a live
  operator checkpoint exercising both address-mode and coordinate-mode unincorporated
  fixtures (Pima County, AZ and/or LA County, CA), since `representingCity` has no
  existing automated test coverage.

### Wave 0 Gaps
- [ ] `C:/EV-Accounts/backend/test/essentialsService-locality.test.ts` — new file, mirrors `essentialsService-tribal-land.test.ts`'s static-source-assertion style; covers LOC-01/LOC-02.
- [ ] `C:/EV-Accounts/backend/src/routes/essentialsCandidates.test.ts` — does not exist today at all; the `/candidates/search` route currently has NO regression test covering its response shape. Recommend adding at least a smoke test asserting the subset object's keys (`politicians`, `tribal_land`, `locality`, `county`, `jurisdiction`) to guard LOC-03 against future accidental field drops.
- [ ] `src/lib/bannerProps.test.js` — extend with an "Unincorporated {County}, ST" case (no new file needed).
- [ ] No automated test exists for `representingCity` (`Results.jsx`) itself — it is a `useMemo` inside a large page component with no dedicated test file. Executing the plan should either (a) extract the locality-branch logic into a small pure-function helper (testable in isolation, similar to `bannerProps.js`'s own pure-function convention) or (b) rely on a manual live checkpoint. Recommend (a) if the planner wants automated coverage of LOC-04's core logic.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|----------------|---------|-------------------|
| V2 Authentication | No | Both touched routes (`/candidates/search`, `/coordinate-lookup`) are already public/optional-auth; no change to auth posture |
| V3 Session Management | No | No session state introduced |
| V4 Access Control | No | No new access boundary; `locality` is coarse public data (county/place names), not privileged |
| V5 Input Validation | No new surface | The two new SQL probes take the SAME already-validated `resolvedLng`/`resolvedLat` parameters that `tribalQueryText`/`districtQueryText` already use (parameterized `$1`/`$2` — no string interpolation); no new user input is accepted |
| V6 Cryptography | No | Not applicable |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| SQL injection via unparameterized geofence query | Tampering | Already mitigated — all new/existing probes use `pool.query(sql, [resolvedLng, resolvedLat])` parameterized placeholders, never string concatenation (verified in the existing `tribalQueryText`/`districtQueryText` pattern this phase mirrors) |
| Coordinate/location privacy leak via a new response field | Information Disclosure | D-03 explicitly rules this in-scope-and-acceptable: `county_name` is coarse (not parcel-level), and the existing Phase-213 no-raw-coordinate-echo contract (`matchedAddress` cleared, no lat/lng ever returned) is untouched by this phase — `locality` never carries the raw point, only geofence-derived names |

## Sources

### Primary (HIGH confidence — direct codebase verification, this session)
- `C:/EV-Accounts/backend/src/lib/essentialsService.ts` (lines 150-179, 625-858, 874-907, 1038-1080, 581-610) — `AddressSearchResult` interface, `resolveOfficialsAtPoint`, `tribal_land` precedent, both public entry points, `pickCountyFromDistrictRows`/`pickJurisdictionFromDistrictRows`
- `C:/EV-Accounts/backend/src/routes/essentialsCandidates.ts` (lines 105-121) — explicit subset object
- `C:/EV-Accounts/backend/src/routes/essentialsCoordinateLookup.ts` (whole file) — verbatim passthrough confirmed
- `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts` (lines 1-121, 1290-1360) — `STATE_LAYER_ALLOWLIST`, `STATE_CITY_ASSERTIONS`, `STATE_RUN_MAKEVALID`, nationwide-county load mode
- `C:/EV-Accounts/backend/test/essentialsService-tribal-land.test.ts` — test-style precedent
- `C:/EV-Accounts/backend/src/routes/essentialsCoordinateLookup.test.ts` — route-test-style precedent
- `src/lib/api.jsx` (lines 80-124, 510-551) — `searchPoliticians`, `searchLocationsByName`, `lookupCoordinate`
- `src/hooks/usePoliticianData.js` (whole file) — `tribalLand` hook wiring
- `src/pages/Results.jsx` (lines 385-500, 690-720, 937-1074, 1139-1270, 1900-1930, 2180-2195) — `representingCity`, `userState`, `resolveCoordinate`, `fromLocality`/`localityLabel`, tribal badge, banner wiring
- `src/lib/bannerProps.js` (whole file) — `buildBannerProps` state-dedup logic
- `src/lib/bannerProps.test.js` (whole file) — existing test precedent for banner label assembly
- `C:/EV-Accounts/backend/vitest.config.ts`, essentials `vite.config.js`, `package.json` (both repos) — test framework/config confirmation

### Secondary (MEDIUM confidence)
- `MEMORY.md` project notes ("10 UT cities done", "project_ca_judicial_districts_null_geoid" Bloomington IN precedent) — corroborating, not primary, evidence for the UT-loaded / IN-not-loaded correction

### Tertiary (LOW confidence)
- None used as load-bearing claims — all factual claims above trace to direct source-code reads this session.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; 100% reuse of already-adopted, already-tested infrastructure in both repos.
- Architecture: HIGH — every pattern (probe shape, subset-object edit point, verbatim passthrough, hook-vs-browseResults split) was verified by directly reading the current source this session, not from CONTEXT.md claims alone.
- Pitfalls: HIGH for the coordinate-mode wiring gap and the county-gate scoping (both derived from direct code reads); MEDIUM for the place-loaded-state list completeness (static evidence only, no live DB query available — see Open Question 1 / Assumption A1).

**Research date:** 2026-07-22
**Valid until:** 30 days (stable, internal-codebase-only domain; re-verify the `PLACE_LOADED_STATES` list sooner if any new state's TIGER data is loaded in the interim)
