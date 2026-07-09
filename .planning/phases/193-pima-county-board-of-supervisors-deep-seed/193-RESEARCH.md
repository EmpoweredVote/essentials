# Phase 193: Pima County Board of Supervisors Deep-Seed - Research

**Researched:** 2026-07-09
**Domain:** Standalone-county government seeding + custom sub-county geofence loading + evidence-only compass stances + community banner (Postgres/Supabase backend in `C:/EV-Accounts`, React frontend in this repo)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 (Supervisor-district geofences):** Source the 5 official supervisor-district boundaries
  from Pima County GIS (ArcGIS/open-GIS) and load them as custom LOCAL geofences with X-code
  geo_ids — the Clark County / Las Vegas ward pattern (v18.0 phases 161/162) — giving true
  per-district routing (one supervisor per address). Fallback = PAUSE + flag, not silent
  degradation: if clean official boundaries can't be sourced at plan/execute time, stop and surface
  it rather than attaching all 5 supervisors to the whole-county boundary. (Phase 190 loaded only
  the single whole-county boundary: `districts` row geo_id `04019`, label `Pima County`, lowercase
  `state='az'`, `district_type='COUNTY'` — the 5 sub-county supervisor districts do NOT exist yet.)
- **D-02 (Board structure & Chair):** One `Board of Supervisors` chamber with 5 by-district
  supervisor offices on the 5 district geofences. The Chair is a title annotation on the sitting
  supervisor who currently holds it (board selects the chair annually — rotational), NOT a separate
  6th office (the chair is not separately elected; a separate office would double-count a person).
  Follows the by-district relabel pattern.
- **D-03 (Compass stance scope):** Research stances against the existing live compass topic set —
  ALL topics, evidence-only, 100% cited, no defaults, honest blanks where a county supervisor has
  no record on a topic, discrete 1–5 "chairs", researched one supervisor at a time (quota). This is
  the FIRST AZ jurisdiction to get stances and sets the template for Tucson + the suburbs. The 10
  proposed local compass questions / 8 Local Lens topics remain OUT until separately reviewed and
  finalized.
- **D-04 (Pima County banner subject):** Use a county-representative Santa Catalina Mountains /
  Sonoran-desert (saguaro) landscape — reads "Pima County" county-wide and stays visually distinct
  from the future Tucson-city banner (reserve downtown-Tucson streetscapes for Phase 194) and the
  AZ-state Phoenix skyline (already live). Real photo, no AI, no aerial, sourced one-at-a-time,
  processed via `scripts/banners/`, uploaded to Storage, wired into `src/lib/buildingImages.js`.

### Claude's Discretion

- County `ext_id` numbering range for the government/offices/politicians, and the custom geo_id
  X-code for the 5 supervisor districts (follow the LV ward X00xx convention; pick a clean unused
  range at plan time). **Research resolves this: `-4007001..-4007005` (ext_id) and `X0019` (mtfcc) —
  both DB-verified unused. See Standard Stack / Common Pitfalls.**
- Roster-currency re-check before seeding (a blocking human-verify checkpoint like Phase 192's
  Task 2): confirm the current 5 sitting supervisors + who chairs the board before applying, since
  the seed must reflect who represents a resident today. Genuinely vacant seat → vacant office,
  never a departed member.
- Structural-vs-audit migration split (structural registered; headshots + stances audit-only,
  unregistered), and the plan/wave split (likely: geofences+government+roster → headshots →
  stances → banner+coverage → verification).
- Which headshot source wins per supervisor (official Pima County .gov portrait preferred; document
  license per image; descriptive User-Agent to avoid 403/429). **Research resolves this: pima.gov's
  CivicPlus CMS asset host, no WAF, all 5 confirmed reachable — see Code Examples.**

### Deferred Ideas (OUT OF SCOPE)

- 10 proposed local compass questions / 8 Local Lens topics — keep OUT of this phase until
  separately reviewed and finalized; revisit as a compass-topic decision, then potentially re-run
  county/city stance passes against them.
- City of Tucson + 4 suburbs deep-seeds — Phases 194–198.
- 2026 Arizona election shells (incl. Tucson-metro local) — Phase 199.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PIMA-01 | Pima County Board of Supervisors seeded as a standalone county government (5 supervisor districts on LOCAL geofences), NOT nested under State of AZ — roster → 600×750 headshots → evidence-only compass stances | GEOFENCE SOURCE confirmed reachable and clean (5 single-ring polygons, live-verified); ROSTER confirmed current (5 names + party + Chair, cross-verified DB + live GIS `NAME` field + pima.gov); HEADSHOTS confirmed reachable no-WAF for all 5; STANCES topic scope confirmed (36 non-judicial of 44 live topics) with evidence-source list (Legistar, AZ Luminaria, AZPM, Tucson Sentinel, Arizona Daily Star/tucson.com); MIGRATIONS numbering DB-verified (next structural = 1288, ext_id block `-4007001..-4007005`, mtfcc `X0019`) |
| BANR-01 | Every deep-seeded Tucson-metro jurisdiction (incl. Pima County) carries a licensed community banner, processed via `scripts/banners/`, uploaded to Storage, wired into `src/lib/buildingImages.js` | Banner spec confirmed (1700×540 @ 3.15:1, LANCZOS, q90 via `process_banner.py`/`upload_banner.py`, already proven code); `CURATED_LOCAL`/`coverage.js` wiring mechanism confirmed to work identically for a COUNTY label as a city (no code change needed); flagged the address-tier fallback nuance (Pitfall 7) so the planner doesn't over-scope a code fix; specific licensed Catalina/Sonoran-desert Wikimedia source NOT shortlisted — flagged for the execution-phase one-at-a-time sourcing pass |
</phase_requirements>

## Summary

Every technical unknown for this phase was resolved by direct verification against the live
production database and the live Pima County GIS service — **the D-01 geofence-sourcing risk is
RESOLVED, not a pause condition.** Pima County publishes an authoritative "Districts - Pima County
Board of Supervisors" ArcGIS `MapServer` feature layer (layer 5 of `GISOpenData/Boundaries`) with
exactly 5 single-ring polygons, a `DISTRICT` integer field (1–5), and a `NAME` field that already
matches the current roster verified independently on `pima.gov`. This is a cleaner source than the
Las Vegas ward analog (LV wards had up to 30 rings; Pima's are single-ring) and requires the same
`f=json` rings→GeoJSON conversion pattern already coded in `load-lv-ward-boundaries.ts`, or — even
closer as a structural analog — the split COUNTY/LOCAL commissioner-district pattern already built
for Washington County, OR (Phase 175, migration `1120_washco_commission.sql`), adapted to Pima's
5-office-no-separate-Chair model.

Headshots are a non-issue: `pima.gov`'s CivicPlus CMS serves all 5 supervisor portraits from
`content.civicplus.com/api/assets/az-pimacounty/{uuid}` with **no WAF**, confirmed HTTP 200 for all
5, at usable resolutions (300×450 to 733×1100) for the established crop-first 4:5 → 600×750 Lanczos
pipeline. The roster is current as of the research date: Rex Scott (D1), Dr. Matt Heinz (D2),
Jennifer Allen (D3, **2026 Board Chair**), Steve Christy (D4, sole Republican), Andrés Cano (D5,
appointed April 2025 to the seat vacated by Adelita Grijalva's move to US House CD-7 — this is the
same succession already documented in Phase 191).

The migration ledger is DB-verified: numeric ledger MAX = **1286**; on-disk MAX = **1287**
(`1287_az_legislature_headshots.sql`, audit-only/unregistered per Phase 192). Per the project's
established convention (disk-MAX-authoritative, not ledger-MAX-authoritative — confirmed by the
192-01→02 sequence), **the next structural migration number is 1288.** The AZ `ext_id` numbering
convention (`-400Xnnn` blocks: 4=STATE_EXEC, 5=Senate, 6=House) extends cleanly to **`-4007001`
through `-4007005`** for the 5 supervisors (DB-confirmed unused). The next unclaimed custom geofence
`mtfcc` code is **`X0019`** (X0018 was consumed by Washington County's commissioner districts in
v20.0; X0001–X0018 are all otherwise claimed except a pre-existing gap at X0002, which is not
available for reuse without further investigation and should be skipped).

The banner mechanism (`CURATED_LOCAL` substring match in `src/lib/buildingImages.js`, keyed by the
lowercased `browse_label`/`representingCity` string) has never been exercised for a **COUNTY**-tier
government before (Clark County and Washington County — the only two prior standalone-county
deep-seeds — never got a banner; BANR-01 is the first milestone requirement to demand one). The
mechanism itself needs no code change to support this — adding a `'pima county': { state: 'AZ',
src: ... }` entry works identically to a city entry — but the planner should note that the banner
will reliably render via the `COVERAGE_COUNTIES` browse path (`browse_label: 'Pima County'`) and via
any address that has no other city match, while an address inside a not-yet-seeded city (e.g.
Tucson, until Phase 194) will independently resolve to that city's name via `parseCityFromAddress`
and show no local banner until that city ships its own — this is expected graceful degradation, not
a defect.

**Primary recommendation:** Follow the Washington County Commission (Phase 175) migration shape —
NOT the pure Clark County shape — as the primary structural template, because Pima needs true
per-district LOCAL geofence routing (5 distinct districts) rather than 5 offices sharing one COUNTY
district. But diverge from WashCo's Chair model: WashCo's Chair is a separately-elected,
county-wide 5th office (on the COUNTY district) distinct from its 4 LOCAL district commissioners —
Pima's D-02 explicitly forbids that shape. Pima needs exactly **5 offices total**, each on its own
LOCAL `X0019` district, with the Chair modeled with **zero DB footprint** beyond correct roster
facts — matching the Clark County precedent where Chair/Vice-Chair appear nowhere in `title` or
`role_canonical` (display ordering, if any, is a `groupHierarchy.js` frontend concern outside this
phase's scope). Flag this modeling choice as an explicit checkpoint decision for the planner (see
Open Questions).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Supervisor-district boundary polygons | Database / Storage (`essentials.geofence_boundaries`) | Backend loader script (`C:/EV-Accounts/backend/scripts/`) | Geometry lives in Postgres/PostGIS; the loader is a one-time ETL script, not a runtime service |
| Government/chamber/office/politician seed | Database (`essentials.governments/chambers/districts/offices/politicians`) | — | Structural migration, same tier as every prior deep-seed |
| Address → supervisor routing | API / Backend (`essentials/backend` PIP resolver, unchanged code) | Database (geofence + district join) | `essentialsService.ts`'s existing `X%` MTFCC catchall already routes any `X00xx` LOCAL geofence with no code change (confirmed pattern from LV/Henderson/WashCo) |
| 600×750 headshots | Database / Storage (`politician_images`, `politician_photos` bucket) | — | Same as every prior phase; no frontend change |
| Compass stances | Database (`inform.politician_answers`) | — | Evidence-only INSERTs; no frontend change (Compass UI already reads this table generically) |
| Community banner | Frontend (`src/lib/buildingImages.js` CURATED_LOCAL) + Storage (`politician_photos/cities/`) | Frontend (`src/lib/coverage.js` COVERAGE_COUNTIES, drives `browse_label`) | Banner resolution keys off `representingCity`/`browse_label` text match — this is the ONLY frontend code touch in the phase |
| Coverage surfacing (chip) | Frontend (`src/lib/coverage.js` COVERAGE_COUNTIES) | — | `hasContext:true` once ≥1 stance row exists |

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| PostgreSQL/PostGIS (Supabase) | Live prod (`kxsdzaojfaibhuzmclfq`) | Structural + audit migrations | Same DB as every prior phase; `mcp__supabase-local` IS production |
| `psql` CLI | 18 (local install) | Inline orchestrator apply + DB-verify | `gsd-executor` has no Supabase MCP — orchestrator applies via `psql -f` against `C:/EV-Accounts/backend/.env` `DATABASE_URL`, exactly as Phases 161/162/175/191/192 |
| `tsx` (via `npx tsx`) | project-pinned in `C:/EV-Accounts/backend/package.json` | Run the TypeScript geofence loader | Same tool used by `load-lv-ward-boundaries.ts` / `load-washco-commissioner-boundaries.ts` |
| Python 3 (`py -3` launcher) + Pillow (PIL) + `requests` + `psycopg2` | Already installed (confirmed Python 3.14.3, PIL 12.1.1 in Phase 191) | Headshot crop/resize/upload pipeline | Verbatim reuse of `_tmp-az-legislature-headshots.py` shape |
| `scripts/banners/process_banner.py` + `upload_banner.py` (this repo) | Already present | Banner crop-to-1700×540 + Storage upload | No new tooling — reuse as-is |

### Supporting
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| Pima County GIS `MapServer` (ArcGIS REST, `f=json`) | live | Source of the 5 supervisor-district polygons | One-time fetch by the loader script |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pima's own `GISOpenData/Boundaries/MapServer/5` layer | AZGeo Data mirror (`azgeo-open-data-agic.hub.arcgis.com`) | County's own service is the authoritative source and was directly verified reachable — no reason to use the state-level mirror |
| `f=json` + custom rings→GeoJSON conversion (LV pattern) | none — Pima's endpoint is a `MapServer`, not a `FeatureServer`, so `f=geojson` is not natively available the way it is for WashCo's `FeatureServer` | Must use the LV-style `arcgisRingsToGeoJson()` helper, not the WashCo-style direct-GeoJSON path |

**Installation:** No new packages. All tooling (`pg`, `tsx`, `dotenv` in EV-Accounts; PIL/requests/psycopg2 in the Python venv/global) is already present and verified working in Phases 161/162/175/191/192.

**Version verification:** N/A — no new package versions to pin. This phase introduces zero new dependencies.

## Package Legitimacy Audit

**N/A this phase.** No new npm/pip/cargo packages are installed. All backend and pipeline tooling
(`pg`, `tsx`, `dotenv`, Pillow, `requests`, `psycopg2`) is already present in the two repos and was
exercised successfully in Phases 161, 162, 175, 191, and 192. `slopcheck` was not run because there
is nothing to audit — this matches the precedent recorded in every prior deep-seed phase's
`RESEARCH.md` ("no new package installs this plan").

## Architecture Patterns

### System Architecture Diagram

```
Pima County GIS MapServer (layer 5, f=json, native SRID 2868)
        │  outSR=4326 query (DISTRICT + NAME + rings)
        ▼
load-pima-supervisor-boundaries.ts (new, LV-pattern rings→GeoJSON)
        │  INSERT ... ON CONFLICT (geo_id, mtfcc) DO NOTHING
        ▼
essentials.geofence_boundaries (5 rows, mtfcc='X0019', state='az', geo_id='pima-az-supervisor-district-N')
        │  pre-flight assertion (>=5 rows) gates the structural migration
        ▼
Structural migration 1288_pima_county_board_of_supervisors.sql
   ├─ essentials.governments  ('Pima County, Arizona, US', type='County', state='AZ', geo_id='04019', STANDALONE — no parent link to State of Arizona)
   ├─ essentials.chambers     ('Board of Supervisors', official_count=5)
   ├─ essentials.districts    (5× LOCAL rows, one per X0019 geofence — NOT the pre-existing COUNTY row)
   └─ essentials.politicians + essentials.offices  (5 supervisors, ext_id -4007001..-4007005)
        │  office_id back-fill + post-verify DO block (row counts, casing, section-split)
        ▼
Address routing (NO CODE CHANGE — existing X% MTFCC catchall in essentialsService.ts already
routes X0019 the same way it already routes X0015/X0016/X0017/X0018)
        │
        ▼
Resident's profile shows their ONE Pima County supervisor
        │
        ├─ Headshots: pima.gov CivicPlus CMS → crop-first 4:5 → 600×750 Lanczos → politician_images (audit-only migration)
        ├─ Stances: evidence-only research (Legistar/news) → inform.politician_answers (audit-only migrations, one supervisor at a time)
        └─ Banner: Wikimedia CC photo → process_banner.py (1700×540) → upload_banner.py (cities/pima-county.jpg)
                   → src/lib/buildingImages.js CURATED_LOCAL['pima county'] → src/lib/coverage.js COVERAGE_COUNTIES entry (browse_label='Pima County', hasContext:true)
```

### Recommended Project Structure (files this phase touches)
```
C:/EV-Accounts/backend/
├── scripts/load-pima-supervisor-boundaries.ts   # NEW — geofence loader (LV-pattern rings conversion)
├── migrations/1288_pima_county_board_of_supervisors.sql   # NEW — structural (registered)
├── migrations/1289_pima_county_headshots.sql              # NEW — audit-only (unregistered)
└── migrations/1290..129N_pima_stances_*.sql               # NEW — audit-only, one per supervisor (chairs model)

C:/Transparent Motivations/essentials/
├── src/lib/coverage.js         # MODIFIED — add Pima County to COVERAGE_COUNTIES
└── src/lib/buildingImages.js   # MODIFIED — add 'pima county' to CURATED_LOCAL
```

### Pattern 1: Split COUNTY-vs-LOCAL district routing for a multi-member county board (WashCo analog, ADAPTED)
**What:** A standalone county government with N board seats, each requiring its own geographic
sub-district (not the whole-county boundary).
**When to use:** Exactly this phase — Pima needs true per-supervisor routing (D-01), unlike Clark
County (161) where all 7 commissioners share the single pre-existing COUNTY polygon because no
per-commissioner geofence was sourced.
**Divergence from WashCo (175):** WashCo modeled its Chair as a SEPARATE county-wide office on the
COUNTY district (`title='County Chair'`, its own politician + office row distinct from the 4 LOCAL
district commissioners) — **Pima's D-02 explicitly forbids this shape.** Pima has exactly 5
offices, all on LOCAL districts; no office touches the pre-existing COUNTY row (`04019`) at all in
this phase.
```sql
-- Source: C:/EV-Accounts/backend/migrations/1120_washco_commission.sql (adapt: DROP the
-- separate Chair-on-COUNTY block entirely; ALL 5 supervisors get the LOCAL-district shape
-- used there for D1-D4, not the COUNTY shape used for the Chair)
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'az', 'pima-az-supervisor-district-1',
       'Pima County Supervisor District 1', 'X0019'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = 'pima-az-supervisor-district-1' AND district_type = 'LOCAL' AND state = 'az'
);
-- (repeat for districts 2-5)
```

### Pattern 2: Chair as zero-DB-footprint metadata (Clark County precedent, CONFIRMED via live query)
**What:** "Chair is a title annotation" (D-02) — confirmed by direct DB inspection that Clark
County's Chair (Naft) and Vice-Chair (McCurdy) carry **no textual or structural trace whatsoever**
in production: `title='Commissioner (District A)'` (no "(Chair)" suffix), `role_canonical=NULL`.
The distinction exists only in research notes/SUMMARY.md, not in the database.
**When to use:** Recommended default for Pima, matching the strongest precedent. The planner should
explicitly decide (see Open Questions) whether Pima instead wants a literal `(Chair)` suffix on the
2026 chair's (Jennifer Allen, D3) office title, which would be a *new* pattern not yet used anywhere
in the codebase.
```
-- LIVE VERIFIED (2026-07-09):
psql> SELECT external_id, full_name, title FROM essentials.politicians p
      JOIN essentials.offices o ON o.politician_id=p.id
      WHERE external_id BETWEEN -3200307 AND -3200301 ORDER BY external_id;
 -3200301 | Michael Naft (Chair)       | title = 'Commissioner (District A)'   <- no Chair text anywhere
 -3200304 | William McCurdy II (V-Chr) | title = 'Commissioner (District D)'   <- no V-Chair text anywhere
```

### Pattern 3: ArcGIS `MapServer` rings→GeoJSON conversion (LV precedent, directly reused)
**What:** Pima's endpoint is a classic `MapServer` (not a `FeatureServer`), so `f=geojson` is not
available — the response returns `geometry.rings` (ArcGIS JSON), requiring the same
`arcgisRingsToGeoJson()` conversion helper already written for `load-lv-ward-boundaries.ts`.
**When to use:** This phase's loader — copy the helper verbatim; Pima's 5 features are all
single-ring (verified live), simpler than LV's up-to-30-ring wards, so no `ST_MakeValid` fallback
is expected to trigger (but keep the guard — cheap insurance, matches every prior loader).
```javascript
// Source: C:/EV-Accounts/backend/scripts/load-lv-ward-boundaries.ts (verbatim reusable helper)
function arcgisRingsToGeoJson(rings) {
  return JSON.stringify({ type: 'Polygon', coordinates: rings });
}
```
```bash
# VERIFIED LIVE (2026-07-09) — confirms reachability, field names, single-ring geometry:
curl "https://gisdata.pima.gov/arcgis1/rest/services/GISOpenData/Boundaries/MapServer/5/query?where=1%3D1&outFields=DISTRICT,NAME&returnGeometry=false&f=json"
# => {"features":[{"attributes":{"DISTRICT":1,"NAME":"REX SCOTT"}}, ... 5 total, DISTRICT 1-5]}
curl "https://gisdata.pima.gov/arcgis1/rest/services/GISOpenData/Boundaries/MapServer/5/query?where=DISTRICT%3D1&outFields=DISTRICT,NAME&returnGeometry=true&outSR=4326&f=json"
# => 1 feature, geometry.rings length=1, first coord [-110.859, 32.511] (Tucson-area sanity check)
```

### Anti-Patterns to Avoid
- **Reusing the pre-existing COUNTY district (`04019`) for supervisor offices:** That row is the
  whole-county boundary (STATE_UPPER SD-19/STATE_LOWER HD-19/COUNTY all incidentally share the same
  `geo_id='04019'` — confirmed live; three DIFFERENT `district_type` rows exist at that geo_id, so a
  careless join without `district_type='LOCAL'` scoping could silently attach a supervisor office to
  the wrong district row or even the STATE_UPPER/STATE_LOWER district by accident). Always scope by
  `district_type='LOCAL' AND mtfcc='X0019'`, never bare `geo_id='04019'`.
- **Defaulting to Clark County's "all-share-one-COUNTY-district" shape:** That was Clark's
  workaround for the ABSENCE of per-commissioner geofences (Phase 158 never loaded them) — Pima's
  D-01 explicitly requires true per-district geofences, which research confirms ARE cleanly
  available. Do not silently degrade to the Clark shape.
- **Creating a 6th "Chair" office:** D-02 is unambiguous and the Clark precedent (Pattern 2) shows
  the established zero-footprint approach. A separate Chair office would double-count Jennifer
  Allen (District 3 supervisor AND chair are the same person).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ArcGIS rings → PostGIS geometry | A new coordinate-transform library | `ST_GeomFromGeoJSON` + `ST_SetSRID(...,4326)` + `ST_Multi` (already the project's standard idiom in every geofence loader) | Battle-tested across LV/Henderson/N.LV/WashCo; handles both single- and multi-ring inputs |
| Invalid/self-intersecting polygon repair | Custom geometry-cleaning code | `ST_MakeValid` fallback (already coded in every loader) | Standard PostGIS repair function; project convention is RETURNING `ST_IsValid` + conditional `ST_MakeValid` re-run |
| 4:5 headshot cropping without distortion | Custom aspect-ratio math from scratch | The existing `_tmp-az-legislature-headshots.py` crop-first-then-resize pipeline (crop_to_4_5 → resize_600x750 Lanczos q90) | Verbatim reuse; already handles small-thumbnail upscale (min_dim=100 threshold established in Phase 191) |
| Banner crop/resize | Custom PIL script | `scripts/banners/process_banner.py` (1700×540 @ 3.15:1, LANCZOS, q90, `--vertical-anchor` control) | Already built and battle-tested across 50 state + dozens of city banners |

**Key insight:** This phase introduces exactly ONE genuinely new artifact — the Pima supervisor-
district geofence loader — and even that is a near-verbatim recombination of two existing loaders
(LV's rings-conversion helper + WashCo's split-COUNTY/LOCAL migration shape). Everything else is
established pattern reuse.

## Common Pitfalls

### Pitfall 1: Native SRID is Arizona State Plane (2868), not WGS84
**What goes wrong:** Querying the Pima MapServer without `outSR=4326` returns coordinates in the
native projected CRS (huge numbers, not lat/lon), which `ST_GeomFromGeoJSON` will happily accept and
silently store as garbage geometry (never matches any real address).
**Why it happens:** ArcGIS `MapServer` layers default to their configured spatial reference unless
`outSR` is explicitly requested — this is the SAME failure mode documented for both the LV and
WashCo loaders.
**How to avoid:** Always include `&outSR=4326` in the query URL (verified live in this research —
`rings` come back in the ~-110°/32° range only when `outSR=4326` is present).
**Warning signs:** First coordinate pair with absolute values in the hundreds of thousands/millions
instead of ~-110/-111 longitude, ~31-33 latitude.

### Pitfall 2: `04019` is a THREE-WAY district collision (COUNTY + STATE_UPPER + STATE_LOWER)
**What goes wrong:** A naive `WHERE geo_id='04019'` join (without `district_type` scoping) can match
any of 3 different district rows — the whole-county COUNTY boundary, State Senate District 19, or
State House District 19 — all coincidentally sharing the same numeric geo_id.
**Why it happens:** Arizona's legislative district numbering (SD-19/HD-19) happens to number-match
the Pima County FIPS code (04019) by coincidence — confirmed live via
`SELECT * FROM essentials.districts WHERE geo_id='04019'` returning 3 rows.
**How to avoid:** Every WHERE clause touching Pima County's whole-county row (if used at all — this
phase's supervisor offices should NOT use it) must include `AND district_type='COUNTY'`. Supervisor
offices should use the NEW `X0019` LOCAL rows exclusively, sidestepping this collision entirely.
**Warning signs:** A section-split or office-count audit returning an unexpected multiple-of-3 or
mismatched count.

### Pitfall 3: Casing — `state='az'` lowercase for the new LOCAL districts
**What goes wrong:** Using `'AZ'` uppercase in the district WHERE clause silently matches zero rows
(the established #1 failure mode across every prior phase in this milestone).
**Why it happens:** The project convention is `state` lowercase for COUNTY/STATE_UPPER/STATE_LOWER/
LOCAL/LOCAL_EXEC district rows, uppercase for `governments.state` and `offices.representing_state`
(free-text label columns) — confirmed by every prior AZ phase (190/191/192) and every prior
custom-geofence phase (161/162/175).
**How to avoid:** New LOCAL districts: `state='az'` lowercase. `governments.state`:
`'AZ'` uppercase. `offices.representing_state`: `'AZ'` uppercase.
**Warning signs:** Post-verify DO block reports 0 offices linked when 5 were expected.

### Pitfall 4: `X0002` looks free but should not be assumed safe to reuse
**What goes wrong:** A DB query for `DISTINCT mtfcc LIKE 'X0%'` shows `X0001, X0003-X0018` — `X0002`
is conspicuously absent from the sequence, suggesting it may have been reserved, retired, or
associated with a special-cased MTFCC exclusion elsewhere in the codebase (a prior phase's PLAN
interfaces block documents that `essentialsService.ts`'s generic LOCAL/COUNTY catch-all explicitly
EXCLUDES `mtfcc NOT IN ('X0001','X0002','X0003','X0004')` from the X-prefix routing rule).
**Why it happens:** X0001-X0004 are reserved/excluded from the generic catch-all for reasons outside
this research's scope (likely earlier, differently-routed geofence types).
**How to avoid:** Use `X0019` (the next number strictly after the highest confirmed-in-use code,
`X0018` from Washington County), not the `X0002` gap. `X0019` is safely outside the excluded
`X0001-X0004` range and follows the sequential-increment convention every prior custom geofence
phase has used.
**Warning signs:** If a future planner picked `X0002` anyway, the supervisor districts would
silently fail to route (the generic catch-all would skip them), even though the geofence rows
themselves would look correctly inserted.

### Pitfall 5: Migration numbering — disk MAX, not ledger MAX, is authoritative
**What goes wrong:** Assigning migration 1287 (matching ledger MAX+1) would collide with the
existing unregistered `1287_az_legislature_headshots.sql` already on disk.
**Why it happens:** Audit-only migrations (headshots/stances) consume a disk filename but
deliberately do NOT register in `supabase_migrations.schema_migrations`, so `ledger MAX` (1286)
undercounts the true next-available number (disk MAX 1287).
**How to avoid:** DB-verified live in this research: ledger MAX=1286, disk MAX=1287. **Next
structural migration = 1288.** Re-verify both at plan/execute time regardless (drift is expected —
documented explicitly in 191-01-SUMMARY.md and 192-01-SUMMARY.md as a recurring pattern).
**Warning signs:** `psql -f` apply failing on a duplicate filename, or the ledger INSERT
`ON CONFLICT (version) DO NOTHING` silently no-opping (would look like success but wouldn't
actually register).

### Pitfall 6: Judicial compass topics do not apply to county supervisors
**What goes wrong:** Blindly stanced against all 44 live `inform.compass_topics` rows would
include 8 `judicial-*` topic_keys (`judicial-access-to-justice`, `judicial-bail-pretrial`,
`judicial-criminal-justice`, `judicial-government-deference`, `judicial-interpretation`,
`judicial-police-accountability`, `judicial-prosecution-priorities`, `judicial-transparency`) that
have no bearing on a non-judicial elected county supervisor.
**Why it happens:** `inform.compass_topics.office_scope` (a `text[]` column that COULD filter by
office type) is **empty/NULL for all 44 live topics** — confirmed live — so the DB does not enforce
this exclusion; it is a manual research convention only (same convention already applied in every
prior non-judicial-office stance phase, e.g. Pasadena/Downey/Pomona "no judicial topics, appointed
City Attorney").
**How to avoid:** Research against the **36 non-judicial live topics** (44 minus the 8
`judicial-*` keys). Document this exclusion explicitly in the stance-research plan/summary so
reviewers don't mistake 36/36 for an incomplete 44-topic pass.
**Warning signs:** A verification script asserting "44 topics per politician" instead of 36 would
incorrectly flag honest, complete stance coverage as a gap.

### Pitfall 7: Banner text-match only fires reliably via the County browse chip, not arbitrary addresses
**What goes wrong:** Assuming an arbitrary Pima County address will automatically render the new
`'pima county'` CURATED_LOCAL banner entry.
**Why it happens:** `Results.jsx`'s `representingCity` derivation prioritizes (1) `browse_label` in
browse mode, (2) `politician.representing_city` (typically only set for city/LOCAL offices, not
COUNTY-tier), (3) `chamber_name` parsing (also city-shaped), (4) `parseCityFromAddress` on the raw
typed address string. For a Tucson address, step 4 will parse "Tucson" regardless of whether the
City of Tucson government has been seeded yet (Phase 194) — so a Pima County resident who lives IN
Tucson will see no local banner (or, once Phase 194 ships, the Tucson banner) rather than the Pima
County banner, even though their supervisor's stances/office ARE seeded in this phase. For a
resident of unincorporated Pima County, step 4 likely will not produce the literal string "Pima
County" either.
**How to avoid:** This is expected, pre-existing behavior (same situation existed for Clark County
and Washington County, neither of which has ever had its address-tier banner exercised) — not a
regression to fix in this phase. The banner will reliably render via the `COVERAGE_COUNTIES` browse
entry (`browse_label: 'Pima County'` flows directly into `representingCity`) and via
`getBuildingImages()`'s state-scoped substring match once that browse label is set. Do not attempt
to broaden `parseCityFromAddress` or add new address-parsing logic in this phase — out of scope.
**Warning signs:** A verification step expecting the Pima County banner to appear for a raw address
search (not a browse) would fail and should not be treated as a phase blocker.

## Code Examples

### Query the Pima supervisor-district GIS layer (verified live 2026-07-09)
```bash
# Source: https://gisdata.pima.gov/arcgis1/rest/services/GISOpenData/Boundaries/MapServer/5
# All 5 districts, no geometry (fast sanity check):
curl "https://gisdata.pima.gov/arcgis1/rest/services/GISOpenData/Boundaries/MapServer/5/query?where=1%3D1&outFields=DISTRICT,NAME&returnGeometry=false&f=json"
# => DISTRICT 1 "REX SCOTT", 2 "DR. MATT HEINZ", 3 "JENNIFER ALLEN", 4 "STEVE CHRISTY", 5 "ANDRÉS CANO"

# Single district with WGS84 geometry (outSR=4326 mandatory — native SRID is 2868):
curl "https://gisdata.pima.gov/arcgis1/rest/services/GISOpenData/Boundaries/MapServer/5/query?where=DISTRICT%3D1&outFields=DISTRICT,NAME&returnGeometry=true&outSR=4326&f=json"
```

### Fetch a supervisor headshot (verified live, no WAF, CivicPlus CMS)
```bash
# Source: https://www.pima.gov/2317/Board-of-Supervisors (img tags, verified 2026-07-09)
curl -o rex-scott.jpg "https://content.civicplus.com/api/assets/az-pimacounty/2aa1d923-aee8-451d-a8a6-5aa66abf415b?cache=1800"
# HTTP 200, 733x1100 (confirmed via PIL) — well above the min_dim=100 threshold
```

### Migration ledger + external_id probes (run these exact queries at plan/execute time — do not trust this document's numbers without re-verifying)
```sql
-- Ledger MAX (numeric only — schema_migrations also holds Supabase's own timestamp-formatted rows
-- that break a naive CAST; DB-verified this pattern live):
SELECT MAX(CAST(version AS INTEGER)) FROM supabase_migrations.schema_migrations
WHERE version ~ '^[0-9]{1,4}$';
-- => 1286 (DB-verified 2026-07-09)

-- On-disk MAX (authoritative for next-number assignment — see Pitfall 5):
-- ls C:/EV-Accounts/backend/migrations/*.sql, sort by number => 1287 (DB-verified 2026-07-09)

-- external_id collision check for the proposed -4007001..-4007005 block:
SELECT external_id FROM essentials.politicians
WHERE external_id BETWEEN -4007005 AND -4007001;
-- => 0 rows (DB-verified 2026-07-09, confirms the block is unused)

-- Custom mtfcc collision check for X0019:
SELECT DISTINCT mtfcc FROM essentials.geofence_boundaries WHERE mtfcc LIKE 'X0%' ORDER BY 1;
-- => X0001, X0003-X0018 (17 rows; X0019 confirmed unused; X0002 present-but-excluded from routing — see Pitfall 4)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Clark County shape: N offices share ONE pre-existing COUNTY district (no per-district routing) | Washington County / Las Vegas shape: N offices each get their own custom LOCAL district on a sourced sub-jurisdiction geofence | Introduced in v18.0 (LV wards, Phase 162) and v20.0 (WashCo commissioner districts, Phase 175) | Pima follows the newer, more precise shape per D-01 — true per-supervisor address routing, not a countywide fallback |
| County banner as an unaddressed gap (Clark/WashCo never got one) | County banner required cross-cutting requirement (BANR-01) | v22.0 (this milestone) | First time `CURATED_LOCAL` is exercised for a COUNTY-tier label — no code change needed, but no prior county has proven the address-tier fallback path (Pitfall 7) |

**Deprecated/outdated:** None specific to this phase — the "all-share-one-COUNTY-district" shape
used by Clark County is not deprecated, it remains correct for jurisdictions where per-district
geofences genuinely cannot be sourced; it is simply NOT the applicable shape here because Pima's
sourcing succeeded.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Party affiliations (4 Democrats: Scott/Heinz/Allen/Cano; 1 Republican: Christy) sourced from WebSearch (Ballotpedia/AZ Luminaria/tucsonsentinel.com), not an official government filing document read directly by this research pass | Standard Stack / Roster | Party is stored but NEVER displayed (antipartisan design) — low impact even if a party flip occurred; recommend the roster-currency checkpoint (Claude's Discretion in CONTEXT.md) re-confirm at plan/execute time regardless |
| A2 | Jennifer Allen (District 3) is confirmed CURRENT 2026 Chair via a single WebFetch of `pima.gov/2317/Board-of-Supervisors` plus a corroborating WebSearch snippet (tucsonsentinel.com headline "Allen chosen to chair Pima County Board of Supervisors in 2026") | Summary / Roster | If the chair rotated again between this research date and execution date, the wrong supervisor could be documented as chair in the SUMMARY (low impact since Chair has zero DB footprint per Pattern 2 — informational only, no migration content depends on it) |
| A3 | The `X0002` gap in the custom mtfcc sequence is unexplained beyond the confirmed `essentialsService.ts` routing-exclusion list (`X0001,X0002,X0003,X0004`) documented in a prior phase's PLAN interfaces block — this research did not independently re-read that exclusion list from the live backend source file | Common Pitfalls (Pitfall 4) | If the exclusion list has since changed, `X0019` is still safely outside it either way (it's a strictly-higher, never-used number) — low risk |

**If this table is empty:** N/A — see rows above. The two highest-risk technical claims (geofence
source reachability and migration numbering) were BOTH independently DB/live-verified in this
session, not assumed.

## Open Questions

1. **Should the 2026 Board Chair (Jennifer Allen, District 3) get a literal `(Chair)` suffix on her
   office `title`, or should the phase follow the Clark County precedent of zero DB footprint for
   the chair distinction?**
   - What we know: D-02 says "the Chair is a title annotation on the sitting supervisor." The only
     existing precedent (Clark County, live-verified) shows NO textual trace of Chair status
     anywhere in the database — `title='Commissioner (District A)'`, no suffix, `role_canonical`
     NULL. Washington County's Chair is structurally different (a separately-elected 5th office),
     which is explicitly NOT what Pima wants.
   - What's unclear: Whether "title annotation" in D-02 was written expecting a literal string
     change (e.g. `title='Supervisor, District 3 (Chair)'`) or was simply describing "not a separate
     office" using loose language, with the actual precedent being zero-footprint.
   - Recommendation: Default to the Clark County zero-footprint precedent (simplest, matches the
     strongest analog, and avoids a title string that goes stale the moment the board rotates chairs
     again next January) unless the planner/user wants an explicit annotation. If an explicit
     annotation is wanted, it should be clearly flagged as a NEW pattern (not yet used anywhere in
     the codebase) and the planner should decide the exact title string format.

2. **Exact supervisor office title text.** Clark County used `'Commissioner (District A)'`.
   Washington County used `'County Chair'` / (commissioner titles not fully captured in this pass).
   Pima's official title per `pima.gov` is "Supervisor" (e.g. "Supervisor Rex Scott", "District 4
   Supervisor, Andrés Cano" — inconsistent phrasing across the CMS pages themselves: some pages say
   "Supervisor {Name}", others say "District {N} Supervisor, {Name}").
   - Recommendation: `'Supervisor, District N'` (matching the Clark County `'Commissioner (District
     N)'` shape) is the safest normalized choice — consistent with project convention of a clean,
     display-ready title independent of the source site's inconsistent phrasing.

3. **`X0002`'s exact reservation reason.** Not independently re-verified in this session (see A3).
   Does not block this phase (X0019 avoids it either way), but worth a note for a future
   playbook-retrospective cleanup pass if the gap is ever found to be an accidental orphan rather
   than a deliberate exclusion.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `psql` | Inline orchestrator DB apply/verify | ✓ | PostgreSQL 18 client (confirmed on PATH) | — |
| `npx tsx` | Geofence loader execution | ✓ (used successfully in Phases 162/175 from the same `C:/EV-Accounts/backend` checkout) | project-pinned | — |
| Python 3 (`py -3` launcher) + Pillow + requests + psycopg2 | Headshot pipeline | ✓ (confirmed Python 3.14.3 / PIL 12.1.1 in Phase 191; `python`/`python3` not on PATH, use `py -3`) | 3.14.3 | — |
| Pima County GIS `MapServer` (external network dependency) | Geofence sourcing | ✓ (confirmed live, HTTP 200, 5/5 features, single-ring, `outSR=4326` reprojection works) | live service, no version | — |
| `pima.gov` CivicPlus CMS asset host | Headshot sourcing | ✓ (confirmed live, HTTP 200, no WAF, all 5 supervisors) | live service | — |
| `mcp__supabase-local` / Supabase MCP | (NOT available to `gsd-executor`) | ✗ for the executor | — | Inline-orchestrator `psql`/direct-apply pattern (established, no gap) |
| WebSearch / Playwright (for headshot fallback / `/find-headshots` skill) | Only needed if the primary CivicPlus source fails | Not exercised (primary source succeeded) | — | `/find-headshots` skill exists at `~/.claude/commands/find-headshots.md` if ever needed |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** `mcp__supabase-local` unavailable to the executor — the
established inline-orchestrator `psql -f` / direct-`INSERT` pattern (used in every prior phase this
milestone) is not a workaround but the established, correct pattern itself.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3 (project-wide `npm run test` → `vitest run`), no dedicated config file (uses Vite defaults) |
| Config file | none — see Wave 0 note below |
| Quick run command | `npx vitest run src/lib/buildingImages.test.js` (coverage.js has no dedicated test file — see Wave 0 Gaps) |
| Full suite command | `npm run test` |

This phase is overwhelmingly a **backend data-seeding phase** (SQL migrations + a geofence loader +
Python headshot/banner scripts) with exactly **two frontend touches** (`coverage.js`,
`buildingImages.js`). The primary "test" mechanism for the backend work is NOT Vitest — it is the
established in-migration `DO $$ ... RAISE EXCEPTION` post-verify gate pattern plus inline-orchestrator
`psql` audit SELECTs (see every prior phase's VALIDATION.md/VERIFICATION.md for the exact shape).
Vitest is only relevant to the two frontend files.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PIMA-01 (govt/roster) | Standalone Pima County government + 5 supervisor offices on 5 LOCAL X0019 districts, NOT nested under State of Arizona | integration (SQL DO-block + psql audit) | in-migration `DO $$` gate (row counts, section-split) + orchestrator `psql -c "SELECT ..."` audits | ✅ (pattern exists — no new test file needed; SQL gates ARE the test harness for this project's data-seed phases) |
| PIMA-01 (headshots) | 5/5 supervisors have a 600×750 `politician_images` row | smoke (HTTP HEAD/GET + PIL dimension check) | Python pipeline script's own dry-run HTTP-200 pre-check + post-upload CDN HTTP 200 + PIL `(600,750)` assertion (established pattern from Phase 192-02) | ✅ (pattern exists) |
| PIMA-01 (stances) | Evidence-only compass stances, 100% cited, no defaults, honest blanks, 36 non-judicial topics researched per supervisor | manual-only (evidence-based research, not automatable) | N/A — human/agent research process; automated check is a `psql` row-count + citation-completeness audit | ✅ (SQL audit pattern exists from every prior stance phase) |
| BANR-01 | Licensed Pima County banner sourced, processed, uploaded, wired into `buildingImages.js`, surfaced via `coverage.js` | unit (Vitest) + smoke (CDN HTTP) | `npx vitest run src/lib/buildingImages.test.js` + `curl -I https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/pima-county.jpg` | ✅ `buildingImages.test.js` exists; no dedicated `coverage.test.js` exists (see Wave 0 Gaps) |

### Sampling Rate
- **Per task commit:** in-migration `DO $$` gate (backend); `node --input-type=module -e "import(...)"` parse-check (coverage.js, matching the Phase 162 precedent — no dedicated test file exists for coverage.js)
- **Per wave merge:** full `psql` audit suite (row counts, casing, section-split) + `npx vitest run src/lib/buildingImages.test.js`
- **Phase gate:** All SQL post-verify gates green + operator-approved roster-currency checkpoint + `npm run test` green before `/gsd:verify-work`

### Wave 0 Gaps
- No dedicated `coverage.test.js` exists in this codebase for ANY prior county/city addition — the
  established substitute is a `node --input-type=module -e "import(...)"` parse-check plus a
  `grep` for the new label/geo_id (exact pattern used in Phase 162's Task 3 automated verify). This
  is NOT a gap to fill in this phase — it is the project's established practice.
- `buildingImages.test.js` already exists and already exercises the `CURATED_LOCAL` state-scoping
  logic generically (per its existing test cases for Bloomington/Anytown) — adding a Pima County
  entry needs no new test, just confirming the existing suite still passes.

*(No other gaps: this phase's DB-tier validation is fully covered by the established migration
post-verify + inline-orchestrator audit pattern, which is the correct and sufficient harness for
data-seeding phases in this codebase.)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Public read-only data; no auth surface touched |
| V3 Session Management | No | N/A |
| V4 Access Control | No | Public-read RLS policies already in place on all touched tables (`compass_topics`, `politician_answers`, `offices`, etc. — confirmed via `\d` output showing `POLICY "... public read" FOR SELECT`) |
| V5 Input Validation | Yes | Geofence loader must parameterize all SQL binds (`$1`/`$2`/... — never string-concatenate GIS response data into SQL), matching the established LV/WashCo loader pattern |
| V6 Cryptography | No | N/A — no secrets generated or stored by this phase |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection via untrusted GIS geometry/attribute data | Tampering | Parameterized binds (`$1`/`$2`/`$3`/`$4`) for geo_id/name/GeoJSON/source in the loader `INSERT`, exactly as `load-lv-ward-boundaries.ts` and `load-washco-commissioner-boundaries.ts` already do — no string concatenation |
| Invalid/self-intersecting polygon silently corrupting routing | Tampering | `RETURNING ST_IsValid` assertion + conditional `ST_MakeValid` re-run fallback (established pattern; Pima's single-ring geometry makes this unlikely to trigger, but keep the guard) |
| Wrong-district-collision from the `04019` three-way geo_id overlap (Pitfall 2) | Tampering | Always scope district joins with `district_type='LOCAL' AND mtfcc='X0019'`, never bare `geo_id='04019'` |
| Section-split (offices attached under the wrong government) | Tampering | Chamber scoped to `government_id` subquery `WHERE name='Pima County, Arizona, US'`; post-verify `DO` block section-split gate must return 0 rows, matching every prior phase |
| Service-role key / `DATABASE_URL` leakage | Information disclosure | Read from gitignored `C:/EV-Accounts/backend/.env`; never hardcoded in the loader, migration, or banner scripts; applied only by the inline orchestrator |

## Sources

### Primary (HIGH confidence — direct live verification in this session)
- `psql` live queries against production Supabase DB (`C:/EV-Accounts/backend/.env` `DATABASE_URL`) — ledger MAX, disk MAX cross-check, existing `04019` district rows (3-way collision), `essentials.politicians` external_id collision checks (-4007001..-4007005 unused), `inform.compass_topics` (44 rows, all `is_live=true`, `office_scope` empty), `inform.politician_answers` schema, `essentials.offices` schema + `role_canonical` distinct values, `essentials.districts` distinct `district_type` values, X0016/X0017/X0018 precedent district_type check.
- `curl` live queries against `https://gisdata.pima.gov/arcgis1/rest/services/GISOpenData/Boundaries/MapServer/5` (layer discovery, field schema, 5-feature roster confirmation, per-district ring counts, `outSR=4326` sanity check).
- `curl` live fetch of `https://www.pima.gov/2317/Board-of-Supervisors` (CivicPlus asset URLs for all 5 supervisors) + HTTP 200 + PIL dimension confirmation for all 5 headshot source images.
- `C:/EV-Accounts/backend/migrations/1120_washco_commission.sql` (read in full) — the split COUNTY/LOCAL structural template.
- `C:/EV-Accounts/backend/migrations/1055_clark_county_commission.sql` interfaces + `161-01-PLAN.md` (read in full) — the zero-footprint Chair precedent, live-verified against current DB state.
- `C:/EV-Accounts/backend/migrations/1064_las_vegas_city_council.sql` interfaces + `162-01-PLAN.md` (read in full) — the LV ward rings→GeoJSON loader pattern.
- `C:/EV-Accounts/backend/scripts/load-washco-commissioner-boundaries.ts` (read in full) — closest loader analog.
- `C:/Transparent Motivations/essentials/src/lib/coverage.js` + `src/lib/buildingImages.js` + `src/pages/Results.jsx` (read relevant sections) — banner/coverage wiring mechanism.
- `C:/Transparent Motivations/essentials/scripts/banners/process_banner.py` + `upload_banner.py` (read in full) — banner spec.

### Secondary (MEDIUM confidence — WebSearch/WebFetch, cross-verified against the live DB/GIS/CMS data above)
- `pima.gov/2317/Board-of-Supervisors` (WebFetch) — roster + Chair (Jennifer Allen) confirmation; independently cross-verified by the GIS layer's own `NAME` attribute matching all 5 names.
- WebSearch results (Ballotpedia, AZ Luminaria, AZPM, Tucson Sentinel, Tucson Agenda Substack) — party affiliations (4 Dem/1 Rep) and Andrés Cano's April 2025 appointment (replacing Adelita Grijalva, consistent with the CD-7 succession already documented in Phase 191).

### Tertiary (LOW confidence — not deeply used)
- General WebSearch for "Wikimedia Commons Santa Catalina Mountains / Sonoran Desert" — returned only category/index pages, not specific licensed photo candidates. **The planner/execution phase must still do the one-at-a-time banner-sourcing pass** (per project convention) against `commons.wikimedia.org/wiki/Category:Santa_Catalina_Mountains` and `commons.wikimedia.org/wiki/Sonoran_Desert` directly — this research did not shortlist a specific image and license.

## Metadata

**Confidence breakdown:**
- Standard stack / tooling: HIGH — zero new dependencies, 100% reuse of already-proven tooling.
- Geofence sourcing (D-01, the phase's stated highest risk): HIGH — directly queried the live
  ArcGIS endpoint, confirmed exact field names, geometry format, projection, and a clean 5-feature/
  single-ring result matching the current roster.
- Roster/headshots: HIGH — DB + live-site cross-verification; the only MEDIUM-confidence facts are
  party affiliation (never displayed, low impact) and the exact chair rotation history (informational
  only, zero DB footprint per the established Chair pattern).
- Migration numbering / ext_id scheme: HIGH — directly DB-verified, not inferred from stale
  documentation.
- Stance-topic scope: HIGH — directly DB-verified (44 live topics, 8 judicial exclusions by
  established convention).
- Banner mechanism for a COUNTY-tier label: MEDIUM — the wiring mechanism itself is HIGH confidence
  (read the actual resolution code), but this is the FIRST county to exercise it, so the
  address-tier fallback behavior (Pitfall 7) is reasoned from code, not empirically observed in
  production for a county.

**Research date:** 2026-07-09
**Valid until:** 30 days for the DB/migration-numbering facts (re-verify ledger/disk MAX at
plan/execute time regardless, per established project convention that drift is expected); 7 days
for the roster-currency facts (Board composition/chair can change — a blocking roster-currency
human-verify checkpoint is already planned per CONTEXT.md's Claude's Discretion section, mirroring
Phase 192's pattern).
