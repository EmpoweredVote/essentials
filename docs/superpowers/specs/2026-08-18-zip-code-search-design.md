# ZIP Code Search — Design

**Date:** 2026-08-18
**Scope:** Public-facing ZIP search — type a 5-digit ZIP, get every official who serves any part of it
**Status:** Approved design, pending implementation plan

---

## 1. What a ZIP can and cannot answer

A street address resolves to a *point*, and a point falls on exactly one side of every
district line. A ZIP resolves to an *area*, and an area straddles lines. That difference is
the entire feature: the answer to "who represents 46220" is legitimately a list of four
state house members, not one.

Ground truth, queried live against the Indiana ZCTAs already in the database (2026-08-18):

| ZIP | US House | State Senate | State House | Places (any overlap) | Places (>=2% of ZIP) |
|---|---|---|---|---|---|
| 46220 Indianapolis | 1 | 3 | **4** | 2 | 1 |
| 46032 Carmel | 1 | 3 | 3 | 2 | 2 |
| 47401 Bloomington | 1 | 2 | 2 | 1 | 1 |
| 46360 Michigan City | 1 | 2 | 2 | **7** | **1** |

Two conclusions fall out, and they pull in opposite directions:

- **The doubling is real and large.** 46220 has four state house members. Collapsing that to
  one would be inventing an answer.
- **Raw overlap over-reports badly.** 46360 touches seven places; six are edge slivers worth
  a fraction of a percent of the ZIP.

A blunt threshold is not the fix. At >=10% area share, 47401 loses Bloomington entirely — a
legitimate answer discarded, because the ZIP is far larger than its Bloomington slice. So the
rule is **rank and collapse, never drop** (Section 4).

## 2. Current state — what exists, what is broken

| Piece | State at design time |
|---|---|
| Point resolution (`resolveOfficialsAtPoint`, `lib/essentialsService.ts:707`) | Works — Census geocode, then `ST_Covers(gb.geometry, point)` |
| `POST /essentials/candidates/search` | Works, **address only** — a bare ZIP 422s `ADDRESS_NOT_FOUND` |
| `GET /essentials/candidates/:zip` | **Broken.** Route exists; `getCandidatesByZip` (`lib/candidateService.ts:264`) ignores the ZIP and returns every active `empower.empowered_profiles` row |
| `src/lib/inputClassifier.js` | Classifies ZIP-shaped input as `'address'` — guaranteeing the 422 above |
| `src/lib/api.jsx:193` `fetchCandidates` | Routes 5-digit input to the broken endpoint. **Defined but never called** |
| ZCTA polygons, `mtfcc='G6350'` | Present but **Indiana only** — 807 rows, `census_tiger_2024`, full resolution |
| `essentials.zip_politicians` | Dead — 297 ZIPs, last written 2026-03-07 |

`G6350` appears **nowhere** in the `EV-Accounts` source tree (verified by full-repo grep). The
Indiana ZCTAs and `zip_politicians` are abandoned artifacts of an earlier attempt; neither has
a reader. We extend the polygon precedent and leave `zip_politicians` alone (Section 8).

No other app in `EV-Accounts` references `/essentials/candidates/`, and `fetchCandidates` has
no callers, so the `:zip` response shape is unconstrained.

## 3. Data — nationwide ZCTA import

New script `backend/scripts/load-zcta-boundaries.sh`, modeled on `scripts/seed-tiger-districts.sh`
(ogr2ogr to a stage table, then upsert).

- **Source:** `tl_2024_us_zcta520.zip` — 529 MB zipped, ~33.8k polygons. TIGER ships ZCTAs as
  one nationwide file; there are no per-state slices, so this is all-or-nothing.
- **Simplification:** `ST_SimplifyPreserveTopology(geom, 0.0005)` (~55 m) at import.
  Full resolution would add an estimated 0.8-1.2 GB to a table whose geometry is currently
  445 MB across 16,186 rows; simplified lands nearer +100-200 MB.
- **Why simplification is safe here:** a ZCTA is only ever the *query shape*, never the
  district geometry an address resolves against. Its effect is a sub-point shift in share
  percentages and some wobble in which slivers appear at all — both already absorbed by the
  collapse rule in Section 4. No address answer changes.
- **Columns:** `mtfcc='G6350'`, `source='census_tiger_2024'`, `geo_id = name = ZCTA5CE20` —
  identical to the 807 Indiana rows, extending a precedent rather than inventing a shape.
- **Upsert key is `(geo_id, mtfcc)`.** That unique index exists
  (`geofence_boundaries_geo_id_mtfcc_key`), so `ON CONFLICT (geo_id, mtfcc) DO UPDATE` is safe
  and idempotent. `geo_id` **alone** is not unique in this table and must never be the key.
- The Indiana rows are overwritten with their simplified versions, so resolution is uniform
  nationwide instead of one state behaving differently from the other 49.
- **`state` is `char(2)`** and Indiana's rows carry FIPS `'18'`. ZCTAs cross state lines, so
  the import derives the *dominant* state via `ST_PointOnSurface` against the county layer.
  This column is for indexing and display only — the resolver never relies on it for
  correctness (see the multi-state rule in Section 4).

### Coverage this does and does not buy

Loading ZIPs nationwide does not make every tier available nationwide. Present layer counts:

| Layer | MTFCC | Rows | Nationwide? |
|---|---|---|---|
| Congressional | G5200 | 441 | **Yes** (435 + DC/territories) |
| County | G4020 | 3,222 | **Yes** (3,144 counties) |
| State senate | G5210 | 484 | No — subset of states |
| State house | G5220 | 1,216 | No — subset of states |
| Places | G4110 | 4,236 | No — `PLACE_LOADED_STATES`, 11 states |

So a Florida ZIP returns its US Representative, both Senators, the President, and a county
name — and no state legislators, because Florida's SLDU/SLDL polygons are not loaded. That is
the honest answer and the existing coverage messaging already handles "not yet here." ZIP
search does not gate on state.

## 4. Resolver — `resolveOfficialsInArea`

### Trap 1: the fallback clause silently admits ZCTAs to the district join

The district join in `resolveOfficialsAtPoint` ends with:

```sql
OR (gb.mtfcc NOT IN ('G5210','G5220','G5200','G4020','G4040','G4110','G4120',
                     'G5400','G5410','G5420','G5200V26')
    AND gb.mtfcc NOT LIKE 'X%')
```

That branch means *match any district type for this geo_id*. `G6350` is in neither the
excluded list nor the `X%` family, so a ZCTA row falls straight through it and joins to any
district whose `geo_id` literally equals the ZIP string.

> **This is not confined to the new code path.** Once nationwide ZCTAs are loaded, the
> existing address path inherits the same fallback. `'G6350'` MUST be added to the excluded
> MTFCC set **and** to `MTFCC_DISTRICT_TYPE_GUARD` in `lib/geoIdGuard.ts`, which the code
> comments require be kept in step. This is a prerequisite of the import, not a follow-up.

### The spatial predicate

The area path reuses the point path's entire SELECT/JOIN body and swaps only the predicate:

```sql
WHERE gb.geometry OPERATOR(public.&&) $zcta          -- GIST-driven prefilter
  AND public.ST_Intersects(gb.geometry, $zcta)
  AND NOT public.ST_Touches(gb.geometry, $zcta)
```

One spatial predicate with an explicit `&&` prefilter — per the 2026-07-01 browse-stall fix,
never an `OR` of mixed-direction spatial predicates, which cannot drive
`idx_geofence_boundaries_geometry` and forces a Parallel Seq Scan over every polygon.
`ST_Touches` excludes districts that only share a border.

### Share, ranking, and collapse

Share is `ST_Area(ST_Intersection(gb.geometry, $zcta)) / ST_Area($zcta)`, computed planar in
4326. It is a ratio taken at a single latitude, so degree distortion cancels and we pay
nothing for a geography cast. Share is computed only for the geofence-overlap results;
officials from the separate statewide query carry no share, because a state contains the whole
ZIP by definition and a percentage there would be noise.

**Every overlapping district is returned with its share. Nothing is dropped.** Cards sort by
share descending; anything under 2% renders behind an "also partly in this ZIP" disclosure.
The server-side threshold that would have lost Bloomington from 47401 does not exist — the
2% figure is a presentation boundary only, and a resident of a sliver can still reach their
actual council member.

### Multi-state ZIPs

Statewide officials (President, Senators, Governor, state supreme court) are included for
**every** state whose share of the ZCTA is >=1%. The ~1% of ZIPs straddling a state line get
both delegations rather than one arbitrary side. The 1% floor is a chosen threshold, not a
derived one.

### Shared query body

The point path's SELECT/JOIN text is already duplicated once (point vs. statewide) and carries
hand-maintained "keep in step with" comments. Before adding a third caller, that body is
extracted into a single constant both paths consume, parameterized on the spatial predicate.
This is a targeted refactor of code the feature must touch anyway — not general cleanup — and
it is what stops the MTFCC guard list from drifting across three copies.

## 5. API

`GET /api/essentials/candidates/:zip` — **replace the existing stub's body**, keep the path.
The current implementation is a live wrong-answer bug, and the frontend already routes 5-digit
input to it.

Response mirrors the `/candidates/search` wrapper, adding two fields:

- `share` per politician — the fraction of the ZIP their district covers
- `ambiguity` — `[{ district_type, count }]`, driving the section copy ("4 state house
  members serve this ZIP")

### Trap 2: the stub's cache key must not be reused

`getCandidatesByZip` already writes `candidates:zip:${zip}` with a 900 s TTL. Reusing that key
serves the old every-active-profile payload to the new reader. The key becomes
`candidates:zip:v2:${zip}`.

Route ordering note: `/:zip` is declared at line 65, ahead of `/search` at line 98. There is
no live conflict because `/search` is POST and `/:zip` is GET, but any future GET sibling on
this router must be declared *above* `/:zip` or it will be shadowed.

### Verified non-issue: the typeahead does not leak ZIPs

`searchPlaceNames` (`lib/locationSearchService.ts:190`) matches against
`essentials.governments`, `gazetteer_places`, and `gazetteer_counties`. It only *left-joins*
`geofence_boundaries`, to read `mtfcc` — it never matches on `geofence_boundaries.name`. So
33.8k rows named `"46220"` cannot surface as location-typeahead candidates. Checked rather
than assumed. `G6350` is deliberately **not** added to `KNOWN_MTFCCS`: a ZCTA is not a
`/resolve` target, and a 422 there is correct.

## 6. Frontend

- **`src/lib/inputClassifier.js`** gains a `'zip'` kind, ordered **before** the existing
  checks. A *bare* 5-digit or ZIP+4 is `'zip'`; a ZIP embedded in a longer string
  (`123 Main St, Bloomington IN 47401`) stays `'address'`. `inputClassifier.test.js` already
  exists, so this goes test-first.
- **`LocationCombobox`** treats `'zip'` like `'address'` and `'coordinate'`: no debounced
  resolver query, an inline Enter-hint row, handled by the host page on submit.
- **`Results.jsx`** gains a `?zip=` entry mode alongside `browse_by_area`, `browse_by_state`,
  and `browse_federal_officials`. Those browse modes already render many officials per office
  without claiming any is yours, so the doubled-office layout largely exists.
- **Voice: area, not personal.** The heading is "Officials serving 46220", with a prompt to
  enter a full street address for a personalized answer. No card asserts that an official is
  *your* representative — a ZIP does not establish which side of a line the visitor lives on,
  and claiming otherwise would be wrong for most of the four people listed.
- **Banner:** a ZIP has no image of its own. v1 uses the state banner. A dominant-place banner
  is a follow-up, and this path deliberately does not read `representing_city`, which is known
  to hijack banner selection.

## 7. Testing

- **Vitest, `classifyInput`:** bare 5-digit, ZIP+4, ZIP embedded mid-string, ZIP-with-address,
  leading/trailing whitespace.
- **Backend units:** share arithmetic, the `ambiguity` rollup, the >=1% multi-state rule, and
  the 2% presentation split.
- **End-to-end fixtures — the four Indiana ZIPs, because ground truth exists (Section 1):**
  - 46220 returns **4** state house members (proves doubling is not collapsed)
  - 46360 shows **1** place with **6** collapsed (proves slivers do not dominate)
  - 47401 **keeps** Bloomington (proves the naive-threshold regression stays fixed)
  - 46032 returns 3 senate + 3 house (a second multi-district case)
- **Guard:** `'G6350'` is rejected by the district join, asserted directly rather than
  inferred from a clean result set.
- **Performance:** `EXPLAIN` on the new predicate asserts no Seq Scan, matching
  `backend/scripts/validate_pipeline.py:415`. Run after touching any spatial query.

## 8. Out of scope

- Population-weighted shares ("38% of this ZIP's residents"). More honest than area and what
  Census crosswalks use, but it needs a block-level population and geometry import — a data
  lift larger than this whole feature.
- Retiring `essentials.zip_politicians` (297 stale ZIPs). Dead, but deleting it is unrelated
  cleanup and belongs in its own change.
- ZIP support in the elections and browse endpoints.
- Dominant-place banners for ZIP results.
- Gating ZIP search by state coverage — see Section 3.

## 9. Decision log

| Decision | Choice | Rationale |
|---|---|---|
| Audience | Public site search box | Operator confirmed 2026-08-18 |
| Sliver handling | Show all, rank by share, collapse under 2% | A hard cutoff loses Bloomington from 47401 |
| ZIP geometry | Nationwide, simplified ~50 m | Any ZIP resolves; ~1/6 the storage of full resolution; ZCTA is query shape only |
| Result voice | Area — "Officials serving 46220" | A ZIP cannot establish personal representation |
| Multi-state floor | >=1% share | Chosen, not derived |
| Shared query body | Extract before adding a third caller | Three hand-synced copies of the MTFCC guard would drift |
