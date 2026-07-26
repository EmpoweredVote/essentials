# Phase 194: City of Tucson Deep-Seed - Research

**Researched:** 2026-07-09/10
**Domain:** Greenfield city government seeding (at-large Mayor + 6 by-ward council) + custom sub-city
LOCAL geofence loading (multi-ring/holed geometry, confirmed live) + evidence-only compass stances +
community banner (Postgres/PostGIS backend in `C:/EV-Accounts`, React frontend in this repo)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 (Ward geofences):** Source the 6 official Tucson ward boundaries from Tucson GIS/OpenData
  and load them as custom LOCAL geofences with X-code geo_ids (the Pima/LV ward pattern) — true
  per-ward routing. Fallback = PAUSE + flag, not silent degradation, if clean boundaries can't be
  sourced. **Research resolves this as a non-issue for sourcing, but surfaces a REAL geometry
  complication:** the source IS clean and authoritative, but 2 of the 6 wards are genuinely
  multi-ring (see Common Pitfalls / Pitfall 1) — this is not a sourcing failure, it is a geometry
  shape the loader must handle correctly.
- **D-02 (Mayor at-large):** The Mayor attaches to the existing Tucson city boundary `0477000`
  (G4110, live in `essentials.geofence_boundaries` from Phase 190), NOT a ward geofence. **Research
  finds a gap CONTEXT did not flag:** `essentials.districts` has **zero rows** for geo_id `0477000`
  today (Phase 190's "place" layer load explicitly writes geofence_boundaries only, never districts
  rows) — so this phase must ALSO create ONE new `LOCAL_EXEC` districts row pointing at the
  pre-existing geofence, not just attach an office to something that already exists.
- **D-03 (Election-method mechanics):** Confirmed and DB/live cross-verified: council members are
  nominated by ward in a partisan primary (ward-only electorate) but elected CITY-WIDE in the
  partisan general (all voters, all wards, all parties on one ballot) — a "modified ward" system.
  Mayor is directly elected at-large, also partisan.
- **D-04 (Partisan recording, never displayed):** Confirmed: Tucson is "the only [major] city with
  such partisan elections" (Ballotpedia/AZ election-law sources) — party is recorded in `politicians.party`
  per the same antipartisan convention as every prior phase (never surfaced in the UI).
- **D-05 (Seat & title modeling):** One `City Council` chamber holds Mayor (LOCAL_EXEC, at-large) +
  6 by-ward `LOCAL` offices. Vice Mayor is a **title annotation** on the sitting ward member who
  holds it (rotates annually, council-selected) — NOT a 7th office. **Research confirms the CURRENT
  Vice Mayor is Lane Santa Cruz (Ward 1)**, not any other member (see Common Pitfalls / Pitfall 2 —
  this required resolving a genuine conflict between two WebSearch snippets).
- **D-06 (Compass stances):** Evidence-only, 100% cited, no defaults, honest blanks, all applicable
  live topics (36 non-judicial of 44 — re-verified live, unchanged since Phase 193), one official at
  a time (quota). 10 proposed local-lens questions / 8 Local Lens topics stay OUT.
- **D-07 (Banner):** Downtown Tucson streetscape (Congress St / historic district, ideally with a
  Sentinel Peak/Catalina backdrop), real licensed photo, no AI, no aerial, visually distinct from
  Pima's Catalinas/Saguaro landscape and the AZ-state Phoenix skyline.

### Claude's Discretion

- ext_id numbering range + ward X-code. **Research resolves this: `-4008001..-4008007` (7 people)
  and `X0020` (mtfcc) — both DB-verified unused, live-checked 2026-07-10.**
- BLOCKING loader-verify checkpoint before loading wards (WR-01 multi-ring caveat). **Research
  resolves this as a REAL, not hypothetical, requirement: Ward 4 has 2 rings, Ward 5 has 7 rings, all
  confirmed same-winding (no holes) via live signed-area classification — see Pitfall 1. The Pima
  loader's defensive winding-classification code path (never previously exercised) is exactly what's
  needed; do NOT copy Pima's single-ring "fast path" shortcut verbatim.**
- BLOCKING roster-currency human-verify checkpoint. **Research resolves the full current roster
  (cross-verified against 3 independent sources: the live Tucson-wards ArcGIS `NAME` attribute, AZ
  Luminaria/Tucson Sentinel Nov 2025 election coverage, and a Dec 2025 tucson.com Vice Mayor article)
  — see Summary and Code Examples. A blocking checkpoint should still re-confirm this at execute time
  per project convention (drift risk window: a Vice Mayor re-vote each December).**
- Structural-vs-audit migration split + plan/wave split. **Research recommends mirroring Phase 193's
  6-plan wave shape** (see Architecture Patterns / Recommended Project Structure).
- Headshot source. **Research finds `tucsonaz.gov` is Akamai-WAF-blocked (403 to both `curl` and
  WebFetch, regardless of User-Agent) — unlike Pima's un-gated CivicPlus CMS. This is a genuine
  pitfall requiring a different sourcing approach — see Pitfall 3.**

### Deferred Ideas (OUT OF SCOPE)

- 10 proposed local compass questions / 8 Local Lens topics.
- School-board stances (deferred milestone-wide, no school-board badge built).
- Oro Valley / Marana / Sahuarita / South Tucson deep-seeds (Phases 195–198).
- 2026 Arizona election shells (Phase 199).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TUC-01 | City of Tucson deep-seed — Mayor + 6 ward council members (ward-elected vs at-large + AZ partisan handling verified) → roster → 600×750 headshots → evidence-only compass stances | ROSTER fully confirmed current (Mayor Romero + 6 named ward members incl. 2 seated Dec 2025) cross-verified via live GIS `NAME` field + 2 independent news sources; ELECTION METHOD confirmed ("modified ward": partisan ward primary, partisan citywide general) via Ballotpedia-sourced explainer; VICE MAYOR conflict resolved (Santa Cruz, Ward 1, confirmed via Dec-2025 tucson.com vote breakdown); GEOFENCE SOURCE confirmed reachable, 6/6 features, ring-structure live-inspected (2 multi-ring — new finding); HEADSHOTS: primary official source is WAF-blocked, fallback sourcing path documented; MIGRATIONS numbering DB-verified (next structural = 1296, ext_id block `-4008001..-4008007`, mtfcc `X0020`) |
| BANR-01 | Licensed Tucson downtown-streetscape community banner, processed via `scripts/banners/`, wired into `buildingImages.js`, distinct from Pima/AZ-state | Banner mechanism confirmed identical to Pima's CURATED_LOCAL/coverage.js wiring (first CITY-tier AZ entry, and the FIRST Arizona `COVERAGE_STATES` block in `coverage.js` — no `'Arizona'` state entry exists yet); 6 real, appropriately-licensed downtown-Tucson streetscape Wikimedia Commons candidates identified with dimensions/license (shortlist only — one-at-a-time execution-phase sourcing pass still required per project convention) |
</phase_requirements>

## Summary

Every genuinely open technical question for this phase was resolved by direct, live verification —
against the production database, the live Pima-County-hosted Tucson-wards GIS layer, and
cross-checked news sources — rather than left to training-data assumption. Three findings diverge
meaningfully from the Phase 193 template and deserve the planner's close attention:

**1. Ward geometry genuinely requires the multi-ring code path.** Unlike Pima's 5 supervisor
districts (all single-ring, confirmed in 193-RESEARCH.md), Tucson's ward layer returns **Ward 4 with
2 rings and Ward 5 with 7 rings** (live-verified 2026-07-10, `outSR=4326`). Signed-area classification
confirms all extra rings are **exterior (clockwise), not holes** — i.e., these are genuine
MultiPolygons (Tucson's irregular city-limit annexation history produces detached ward parcels/
islands), not holed Polygons. The Pima loader's `arcgisRingsToGeoJson()` winding-classification logic
(written defensively, never actually exercised in Phase 193) is exactly the code this phase needs —
**do not copy Pima's single-ring fast-path shortcut**; copy the full multi-ring-aware version and
let it run its normal (non-fast-path) branch for Wards 4 and 5.

**2. The current Tucson roster includes a very recent (Nov 4, 2025) election that changed 2 of the 6
wards, and the Vice Mayor question required resolving a genuine conflict between two AI-generated
WebSearch summaries.** One search snippet incorrectly named Nikki Lee (Ward 4) as Vice Mayor; the
correct, independently-sourced answer (via a Dec-2025 tucson.com "Political Notebook" article
describing the actual 4–3 council vote) is **Lane Santa Cruz (Ward 1), re-selected for a second
consecutive year**, over a nomination of Paul Cunningham. Separately, Ward 5 (Selina Barajas,
unopposed) and Ward 6 (Miranda Schubert, 67% over a GOP opponent) are **new members seated December
2025**, replacing Richard Fimbres and Steve Kozachik respectively — both are gone from the current
council per the direct GIS `NAME` field and 3 independent news sources (AZ Luminaria, Tucson
Sentinel, AZPM), not merely "possibly outdated." Ward 3 (Kevin Dahl) was up in the same November 2025
election and **won re-election** (68% over a GOP challenger) — no personnel change there.

**Current confirmed roster (2026-07-10, cross-verified 3 ways):**
| Seat | Name | Party | Notes |
|------|------|-------|-------|
| Mayor (at-large) | Regina Romero | Democratic | Elected 2019, re-elected 2023; term through 2027 |
| Ward 1 | Lane Santa Cruz | Democratic | **Vice Mayor 2026** (2nd consecutive year); term through 2027 |
| Ward 2 | Paul Cunningham | Democratic | 4th term; term through 2027 |
| Ward 3 | Kevin Dahl | Democratic | Re-elected Nov 2025 (68% vs. GOP Wittenbraker); term through 2029 |
| Ward 4 | Nikki Lee | Democratic | Term through 2027 |
| Ward 5 | Selina Barajas | Democratic | **NEW** — elected Nov 2025 unopposed, seated Dec 2025; term through 2029; first woman to represent Ward 5; replaces Richard Fimbres |
| Ward 6 | Miranda Schubert | Democratic | **NEW** — elected Nov 2025 (67% vs. GOP Tolkoff), seated Dec 2025; term through 2029; replaces Steve Kozachik |

All 7 are currently Democratic (0 vacancies, 0 appointed) — an honest, verifiable fact to record
(party stored per D-04, never displayed). **This roster still needs the blocking human-verify
checkpoint at execute time** per CONTEXT's Claude's Discretion — the underlying GIS layer's `NAME`
attribute is a live, authoritative cross-check the checkpoint can re-run trivially.

**3. Two structural gaps this phase must close that Pima's template didn't have to:** (a) no
`essentials.districts` row exists yet for the Mayor's at-large boundary (`0477000`/G4110) — Phase
190's place-layer load explicitly does not write district rows — so this migration creates ONE new
`LOCAL_EXEC` district row in addition to the 6 new `LOCAL` ward rows; (b) `coverage.js` has **no
Arizona entry in `COVERAGE_STATES` at all yet** — this is the first Arizona CITY to be surfaced (Pima
County used the separate `COVERAGE_COUNTIES` array) — the planner must add a new `{ name: 'Arizona',
abbrev: 'AZ', areas: [...] }` block, not find an existing one to append to.

Headshots present a real, not hypothetical, sourcing obstacle: `tucsonaz.gov` (the official Mayor/
Council bio-page host) returned HTTP 403 to both `curl` (with a full modern browser User-Agent) and
the WebFetch tool — an Akamai WAF, unlike Pima's un-gated CivicPlus CMS. The established project
fallback (the `/find-headshots` skill's Playwright-based browser navigation, `mcp__playwright__
browser_navigate`) is the documented workaround for exactly this failure mode and should be used
rather than a raw HTTP fetch; Wikipedia (confirmed reachable, HTTP 200) has at least Mayor Romero's
portrait, and several ward members have personal campcampaign sites (`nikkilee.vote`,
`mirandaforward6.com`, `tucward1.com`) found via search that may host usable, differently-licensed
photos.

The election-method mechanics (D-03/D-04) are now fully documented from an authoritative,
election-law-focused explainer (not just a training-data assumption): Tucson runs a **"modified
ward" system** — ward-restricted partisan primary, then a citywide partisan general where all
registered voters vote on the complete slate of ward winners — and Ballotpedia-class sources
independently confirm Tucson is described as **the only major U.S. city with partisan municipal
elections**. This is exactly what CONTEXT anticipated and it is now DB/live-confirmed, not assumed.

**Primary recommendation:** Follow the Phase 193 (Pima) migration/plan shape almost verbatim —
standalone-government-style seed except the government is a CITY not a COUNTY, one `City Council`
chamber (matching the existing multi-city precedent where an at-large Mayor and district/ward
council members share ONE chamber, e.g. Beaverton/La Verne — confirmed live), 6 new LOCAL ward
districts (`X0020`) + 1 new LOCAL_EXEC district (`0477000`/G4110, NOT previously created), 7
politicians/offices (`-4008001..-4008007`), Vice Mayor as a title-suffix annotation on the Ward-1
seat (mirroring Pima's Chair-suffix pattern, which is itself a LOCKED, already-precedented shape —
not the earlier "zero-footprint" alternative). The one truly new engineering surface is the
multi-ring geofence loader — budget real verification time for it, it is not defensive-only this
time.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Ward boundary polygons (incl. multi-ring Wards 4/5) | Database / Storage (`essentials.geofence_boundaries`) | Backend loader script (`C:/EV-Accounts/backend/scripts/`) | Geometry lives in PostGIS; the loader is a one-time ETL script, not a runtime service |
| Mayor at-large boundary (reuse existing G4110 geofence, NEW districts row) | Database (`essentials.districts`) | — | Geofence row already exists (Phase 190); only the district-routing row is new |
| Government/chamber/office/politician seed | Database (`essentials.governments/chambers/districts/offices/politicians`) | — | Structural migration, same tier as every prior deep-seed |
| Address → Mayor + ward-member routing | API / Backend (`essentialsService.ts`, unchanged code) | Database (geofence + district join) | The `district_type`-to-`mtfcc` mapping already includes `G4110→(LOCAL,LOCAL_EXEC)` and the generic `X%` catch-all for `X0020` — zero code change needed |
| 600×750 headshots | Database / Storage (`politician_images`, `politician_photos` bucket) | Playwright (fallback sourcing for WAF-blocked `.gov` source) | Same DB/Storage tier as every prior phase; sourcing tier differs from Pima (WAF blocks direct HTTP) |
| Compass stances | Database (`inform.politician_answers`) | — | Evidence-only INSERTs; no frontend change |
| Community banner | Frontend (`src/lib/buildingImages.js` CURATED_LOCAL) + Storage (`politician_photos/cities/`) | Frontend (`src/lib/coverage.js`, NEW `COVERAGE_STATES` Arizona block) | First AZ entry in `coverage.js`'s city-tier array — genuinely new code path, not just a new row in an existing array |
| Coverage surfacing (chip) | Frontend (`src/lib/coverage.js`) | — | `hasContext:true` once ≥1 stance row exists |

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| PostgreSQL/PostGIS (Supabase) | Live prod (`kxsdzaojfaibhuzmclfq`) | Structural + audit migrations | Same DB as every prior phase |
| `psql` CLI | 18.1 (confirmed on PATH, 2026-07-10) | Inline orchestrator apply + DB-verify | `gsd-executor` has no Supabase MCP — orchestrator applies via `psql` against `C:/EV-Accounts/backend/.env` `DATABASE_URL` |
| `npx tsx` | project-pinned | Run the TypeScript ward geofence loader | Same tool as `load-pima-supervisor-boundaries.ts`/`load-lv-ward-boundaries.ts` |
| Python 3 (`py -3`) + Pillow + `requests` + `psycopg2` | Already installed (Phase 191/193 precedent) | Headshot crop/resize/upload pipeline | Verbatim reuse |
| `mcp__playwright__browser_navigate` (+ snapshot/click/close) | Already available per `/find-headshots` skill | Headshot sourcing **fallback** for the WAF-blocked `tucsonaz.gov` host | Confirmed necessary this phase (curl/WebFetch both 403) — NOT optional tooling, budget for it |
| `scripts/banners/process_banner.py` + `upload_banner.py` | Already present | Banner crop-to-1700×540 + Storage upload | No new tooling |

### Supporting
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| Tucson wards ArcGIS layer (hosted on Pima County's GIS, `GISOpenData/Boundaries2/MapServer/3`) | live | Source of the 6 ward polygons + current council-member `NAME` cross-check | One-time fetch by the loader script; `NAME` field doubles as a free roster-currency spot-check |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pima-hosted `Boundaries2/MapServer/3` (City of Tucson's own authoritative layer, republished via Pima IT) | `gisdata.tucsonaz.gov` or `gis.tucsonaz.gov` directly | Both are behind the same Akamai WAF that blocks headshot fetches — the Pima-hosted mirror is reachable NOW (confirmed live, no WAF) and is the City's own authoritative dataset (metadata literally points back to `gis.pima.gov/data/contents/metadet.cfm?name=ward_cot`), so prefer it |
| Direct `curl`/WebFetch for headshots | Playwright browser navigation (`/find-headshots` skill pattern) | `tucsonaz.gov` 403s both `curl` (any User-Agent) and WebFetch — a real browser context is required |

**Installation:** No new packages. All tooling already present and proven in Phases 161/162/175/191/
192/193.

**Version verification:** N/A — zero new dependencies introduced.

## Package Legitimacy Audit

**N/A this phase.** No new npm/pip/cargo packages are installed. All tooling (`pg`, `tsx`, `dotenv`,
Pillow, `requests`, `psycopg2`, Playwright MCP) is already present and proven across Phases 161, 162,
175, 191, 192, 193. `slopcheck` was not run — nothing to audit (matches every prior deep-seed
phase's RESEARCH.md).

## Architecture Patterns

### System Architecture Diagram

```
Tucson Wards GIS layer (Pima-hosted authoritative mirror, MapServer/3, native SRID 2868)
        │  outSR=4326 query (WARD + NAME + rings) — LIVE-VERIFIED 2026-07-10
        ▼
load-tucson-ward-boundaries.ts (new; Pima-pattern rings→GeoJSON, FULL multi-ring path exercised)
        │  INSERT ... ON CONFLICT (geo_id, mtfcc) DO NOTHING
        ▼
essentials.geofence_boundaries (6 rows, mtfcc='X0020', state='az', geo_id='tucson-az-ward-N')
   (Ward 4 → MultiPolygon/2 exteriors; Ward 5 → MultiPolygon/7 exteriors; Wards 1/2/3/6 → Polygon)
        │  pre-flight assertion (>=6 rows) gates the structural migration
        ▼
Structural migration 1296_city_of_tucson.sql
   ├─ essentials.governments  ('City of Tucson, Arizona, US', type='City', state='AZ', geo_id='0477000')
   ├─ essentials.chambers     ('City Council', official_count=7 — Mayor + 6 ward members, ONE chamber)
   ├─ essentials.districts    NEW LOCAL_EXEC row (geo_id='0477000', mtfcc='G4110', state='az' — did NOT
   │                          exist before this phase; reuses the Phase-190 geofence, not a new geofence)
   │                          + 6 NEW LOCAL rows (geo_id='tucson-az-ward-N', mtfcc='X0020', state='az')
   └─ essentials.politicians + essentials.offices  (7 people, ext_id -4008001..-4008007)
        │  office_id back-fill + post-verify DO block (row counts, casing, section-split, VM annotation)
        ▼
Address routing (NO CODE CHANGE — G4110→(LOCAL,LOCAL_EXEC) mapping + generic X% catch-all
already cover both the Mayor's and the 6 wards' district_type/mtfcc combinations)
        │
        ▼
Resident's profile shows their ONE ward councilmember + the city-wide Mayor
        │
        ├─ Headshots: tucsonaz.gov WAF-blocked → Playwright fallback (or Wikipedia/campaign-site for
        │             Romero et al.) → crop-first 4:5 → 600×750 Lanczos → politician_images (audit-only)
        ├─ Stances: evidence-only research (news coverage — tucsonaz.gov agendas ALSO WAF-blocked, so
        │           rely on AZ Luminaria/Tucson Sentinel/AZPM/tucson.com) → inform.politician_answers
        └─ Banner: Wikimedia CC downtown-Tucson streetscape → process_banner.py (1700×540)
                   → upload_banner.py (cities/tucson.jpg)
                   → buildingImages.js CURATED_LOCAL['tucson'] → coverage.js NEW Arizona COVERAGE_STATES
                     block (first AZ city entry — no existing block to append to)
```

### Recommended Project Structure (files this phase touches)
```
C:/EV-Accounts/backend/
├── scripts/load-tucson-ward-boundaries.ts        # NEW — geofence loader (multi-ring-aware, not the fast-path)
├── migrations/1296_city_of_tucson.sql            # NEW — structural (registered)
├── migrations/1297_city_of_tucson_headshots.sql  # NEW — audit-only (unregistered)
└── migrations/1298..130N_tucson_*_stances.sql    # NEW — audit-only, one per official (Mayor + 6 wards)

C:/Transparent Motivations/essentials/
├── src/lib/coverage.js         # MODIFIED — ADD new Arizona COVERAGE_STATES block (first AZ city)
└── src/lib/buildingImages.js   # MODIFIED — add 'tucson' to CURATED_LOCAL
```

### Pattern 1: One chamber holds both an at-large Mayor and district/ward council members
**What:** A single `City Council` (or similarly named) chamber row holds offices of TWO different
`district_type`s: one `LOCAL_EXEC` office (Mayor, on the whole-city G4110 district) and N `LOCAL`
offices (council members, on their own sub-city districts).
**When to use:** Exactly this phase. **Live-confirmed precedent (not assumed):** Beaverton, OR
(`City Council` chamber, `official_count=7`, holds 6 `LOCAL` Council-Member-Position offices + 1
`LOCAL_EXEC` Mayor office) and La Verne, CA (`City Council` chamber holds 3 `LOCAL` Council-Member
offices + 1 `LOCAL_EXEC` Mayor office) — both queried live 2026-07-10.
```sql
-- Verified live pattern (Beaverton): ONE chamber, TWO district_types among its offices
SELECT c.name, c.official_count, COUNT(o.id)
FROM essentials.chambers c
JOIN essentials.governments g ON g.id = c.government_id
LEFT JOIN essentials.offices o ON o.chamber_id = c.id
WHERE g.name ILIKE '%Beaverton%' GROUP BY c.id;
-- => City Council | 7 | 7   (6 LOCAL Council Members + 1 LOCAL_EXEC Mayor, same chamber)
```

### Pattern 2: Vice Mayor / Chair as a title-suffix annotation (LOCKED shape, carried from Pima)
**What:** D-05 requires the Vice Mayor to read as "this sitting Ward-1 council member currently
serves as Vice Mayor," via a literal `(Vice Mayor)` suffix on the office `title` — the SAME locked
shape Phase 193 used for the Pima Chair (`'Supervisor, District 3 (Chair)'`), NOT the earlier
"zero-DB-footprint" Clark County alternative (which CONTEXT.md's Pima discussion explicitly
overrode).
```sql
-- Adapt verbatim from 1288_pima_county_board_of_supervisors.sql Gate (f):
-- title = 'Council Member, Ward 1 (Vice Mayor)' for Lane Santa Cruz's office ONLY.
-- role_canonical stays NULL on all 7 offices — annotation lives in `title` only.
```

### Pattern 3: ArcGIS `MapServer` rings→GeoJSON conversion — the MULTI-RING path is now real
**What:** Tucson's wards layer is the SAME MapServer family Pima used (`f=json`, `geometry.rings`,
`outSR=4326` mandatory — native SRID 2868). **Unlike Pima, 2 of the 6 features are genuinely
multi-ring** — this phase actually exercises the winding-order classification branch that Pima's
loader carried only as defensive insurance.
```javascript
// Source: C:/EV-Accounts/backend/scripts/load-pima-supervisor-boundaries.ts
// (arcgisRingsToGeoJson — copy the FULL function, including the multi-ring/hole-classification
// branch below the `if (rings.length === 1)` fast path — Wards 4/5 will actually execute it)
function ringSignedArea(ring) { /* shoelace formula — verbatim reuse */ }
function arcgisRingsToGeoJson(rings) {
  if (rings.length === 1) return JSON.stringify({ type: 'Polygon', coordinates: [rings[0]] });
  // classify each ring by winding order (CW=exterior, CCW=hole), group into polygons,
  // emit MultiPolygon when >1 exterior detected — VERBATIM from the Pima loader.
}
```
```bash
# VERIFIED LIVE (2026-07-10) — confirms reachability, field names, and the REAL multi-ring finding:
curl "https://gisdata.pima.gov/arcgis1/rest/services/GISOpenData/Boundaries2/MapServer/3/query?where=1%3D1&outFields=WARD,NAME&returnGeometry=false&f=json"
# => 6 features: WARD 1 "Lane Santa Cruz", 2 "Paul Cunningham", 3 "Kevin Dahl",
#    4 "Nikki Lee", 5 "Selina Barajas", 6 "Miranda Schubert"
curl "https://gisdata.pima.gov/arcgis1/rest/services/GISOpenData/Boundaries2/MapServer/3/query?where=1%3D1&outFields=WARD,NAME&returnGeometry=true&outSR=4326&f=json"
# => rings per ward: Ward1=1, Ward2=1, Ward3=1, Ward4=2, Ward5=7, Ward6=1
# => signed-area check: ALL rings in Ward4 and Ward5 are clockwise (exterior) — confirmed
#    MultiPolygon (disjoint annexed parcels), NOT a holed Polygon. No CCW/hole rings detected.
```

### Anti-Patterns to Avoid
- **Copying Pima's single-ring fast path verbatim without the multi-ring branch:** Would silently
  drop 6 of Ward 5's 7 exterior rings (and 1 of Ward 4's 2), producing an under-sized ward polygon
  that mis-routes addresses in the dropped parcels — a real, not hypothetical, risk this phase.
- **Skipping the new `essentials.districts` row for `0477000`/G4110/LOCAL_EXEC:** The Mayor's office
  cannot attach to anything if this row is never created — Phase 190 never wrote it (place-layer
  loads write geofences only).
- **Assuming an existing Arizona block in `coverage.js`:** None exists — grep confirms zero
  `Arizona` matches in `COVERAGE_STATES` today. Must add a new state block, not append to one.
- **Fetching `tucsonaz.gov` with plain `curl`/WebFetch and treating a 403 as "site down":** It is an
  Akamai WAF, not an outage — use the Playwright-based `/find-headshots` fallback instead of retrying
  the same request.
- **Creating a 7th "Vice Mayor" office:** D-05 is explicit and Pattern 2 shows the locked shape — one
  office (Ward 1) carries the annotation; there is no separately-elected Vice Mayor seat.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ArcGIS multi-ring/holed rings → PostGIS geometry | A new coordinate-transform library, or a "just concatenate the rings" shortcut | The existing `arcgisRingsToGeoJson()` winding-classification helper (already written in `load-pima-supervisor-boundaries.ts`, just never exercised past its fast path) | Battle-tested logic; Tucson is simply the first phase to actually run its multi-ring branch |
| Invalid/self-intersecting polygon repair | Custom geometry-cleaning code | `ST_MakeValid` fallback (same established idiom) | Standard PostGIS repair; more likely to actually trigger here than in Pima given the multi-ring geometry |
| Headshot sourcing from a WAF-blocked `.gov` host | Custom scraping/proxy/User-Agent-spoofing code | `/find-headshots` skill's Playwright browser-navigation flow (already built, already MCP-available) | Purpose-built for exactly this failure mode; do not reinvent |
| 4:5 headshot cropping + banner crop/resize | Custom PIL scripts | `_tmp-*-headshots.py` pipeline + `scripts/banners/process_banner.py` (both already proven) | Verbatim reuse |

**Key insight:** This phase's only genuinely new code is the ward geofence loader (adapted from
Pima's, exercising its previously-dormant multi-ring branch) and the new-Arizona-block addition to
`coverage.js`. Everything else — chamber/office/politician seeding shape, headshot pipeline, banner
pipeline — is established pattern reuse, now live-confirmed against a second AZ jurisdiction and a
second at-large-Mayor-plus-districts city (Beaverton/La Verne precedent).

## Common Pitfalls

### Pitfall 1: Two of the six wards are genuinely multi-ring (MultiPolygon, not a Polygon-with-holes)
**What goes wrong:** Treating all 6 ward features as single-ring (as Pima's 5 supervisor districts
were) and using the naive `{type:'Polygon', coordinates:[rings[0]]}` shortcut would silently discard
1 of Ward 4's 2 rings and 6 of Ward 5's 7 rings — under-representing those wards' actual boundaries
and mis-routing any address inside a dropped detached parcel.
**Why it happens:** Tucson's city-limit annexation history is highly irregular (detached islands and
panhandles are common for Sun Belt cities that annexed incrementally); ward boundaries inherit this
irregularity. Confirmed live: Ward 4 = 2 rings, Ward 5 = 7 rings, Wards 1/2/3/6 = 1 ring each.
**How to avoid:** Use the FULL winding-order classification helper (signed-area shoelace formula,
CW=exterior/CCW=hole, group into polygons, emit MultiPolygon when >1 exterior) — already written in
`load-pima-supervisor-boundaries.ts` as defensive code, now genuinely load-bearing. Live signed-area
computation (2026-07-10) confirms ALL extra rings in both wards are clockwise/exterior — zero holes
detected — so the expected output is `MultiPolygon` for Wards 4 and 5, `Polygon` for the other 4.
**Warning signs:** A ward's stored geometry area is suspiciously small relative to its known
footprint, or a resident living in a known Ward 4/5 annexed parcel resolves to the wrong ward (or no
ward) at address-lookup time.

### Pitfall 2: Vice Mayor identity — two independent WebSearch AI summaries disagreed
**What goes wrong:** A first-pass WebSearch answer confidently stated "Ward 4: Vice Mayor - Council
Member Nikki Lee" — this is WRONG. A second, differently-worded search correctly surfaced the actual
December 2025 council vote (4–3, Schubert/Barajas/Santa Cruz/Romero for retaining Santa Cruz vs.
Lee/Cunningham/Dahl for Cunningham) confirming **Lane Santa Cruz (Ward 1)** is Vice Mayor for a
second consecutive year.
**Why it happens:** AI-generated WebSearch answer summaries can blend stale cached knowledge with
fresh snippets and produce a confident-sounding but wrong composite; a single search pass is not
sufficient for a fact this load-bearing.
**How to avoid:** Cross-verify any single-source claim about a rotating title (Vice Mayor/Chair) with
at least one article describing the ACTUAL vote/decision (names, count, date), not just a summary
snippet. The blocking roster-currency checkpoint at execute time should independently re-confirm
this specific fact (it is genuinely rotation-prone — voted annually each December).
**Warning signs:** Two search results for "who is Vice Mayor" naming different people — treat as a
hard stop requiring a tie-breaking primary source, not an average/guess.

### Pitfall 3: Official headshot source (`tucsonaz.gov`) is Akamai-WAF-blocked
**What goes wrong:** `curl` (with a full modern Chrome User-Agent + Accept headers) and the WebFetch
tool both return HTTP 403 for every `tucsonaz.gov` page tested (Ward bio pages, Mayor's page),
unlike Pima's un-gated CivicPlus CMS asset host from Phase 193.
**Why it happens:** `tucsonaz.gov` sits behind an Akamai WAF (`X-Reference-Error` header confirms
Akamai) that blocks non-browser HTTP clients regardless of User-Agent string — a TLS/behavioral
fingerprint block, not a simple header check.
**How to avoid:** Use the `/find-headshots` skill's Playwright-based flow
(`mcp__playwright__browser_navigate` + snapshot + manual image-URL extraction) instead of raw HTTP
fetches for `tucsonaz.gov` bio pages. Confirmed-reachable alternates: Wikipedia (200 OK, has at least
Mayor Romero), and several ward members' personal campaign sites found via search (`nikkilee.vote`,
`mirandaforward6.com`, `tucward1.com`) — these carry their own licensing considerations (press_use/
unclear) and should be documented per-image like every prior phase.
**Warning signs:** A `curl -I` or WebFetch call against any `tucsonaz.gov` path returning 403 with an
`X-Reference-Error` header — this is the WAF signature, not a missing-page 404.

### Pitfall 4: Official meeting-agenda source (also `tucsonaz.gov`) is the same WAF — affects stance research
**What goes wrong:** Assuming stance-research agents can cite `tucsonaz.gov` Mayor & Council agendas/
minutes directly (Tucson does NOT use Legistar — it hosts its own agenda archive on the same
WAF-protected domain).
**Why it happens:** Same Akamai WAF as Pitfall 3 covers the entire `tucsonaz.gov` domain, not just
bio pages.
**How to avoid:** Rely on the same evidence-source list already proven for Pima — AZ Luminaria,
Tucson Sentinel, AZPM, Tucson Spotlight, tucson.com/Arizona Daily Star — which report ON council
actions/votes and are independently reachable (all confirmed reachable via WebSearch this session).
Do not block stance research on fetching primary agenda PDFs from `tucsonaz.gov`.
**Warning signs:** A stance-research plan step whose only cited source is a `tucsonaz.gov` URL that
was never actually fetched/verified reachable.

### Pitfall 5: `essentials.districts` has NO row yet for the Mayor's boundary (`0477000`/G4110)
**What goes wrong:** Assuming "the Tucson city boundary already exists" (true for
`geofence_boundaries`, per Phase 190's 190-02-SUMMARY.md) means the Mayor's office can attach
directly — it cannot. `essentials.districts WHERE geo_id='0477000'` returns **zero rows**
(confirmed live 2026-07-10); Phase 190's place-layer load explicitly writes geofence boundaries only,
never district rows (documented in its own summary: "place writes no district rows").
**Why it happens:** G4110 (TIGER place/city boundary) is a special layer where the geofence and the
district-routing row are decoupled by design — county/state-legislative layers get both in one load,
place does not.
**How to avoid:** This migration must explicitly `INSERT INTO essentials.districts` a NEW
`district_type='LOCAL_EXEC'`, `state='az'` (lowercase, milestone convention), `geo_id='0477000'`,
`mtfcc='G4110'` row before (or in the same transaction as) attaching the Mayor's office to it.
**Warning signs:** The Mayor's office INSERT's `WHERE d.geo_id='0477000' AND d.district_type=
'LOCAL_EXEC'` subquery silently matches 0 rows (classic silent-no-op failure mode already documented
for casing mistakes in every prior AZ phase).

### Pitfall 6: `coverage.js` has no Arizona block in `COVERAGE_STATES` yet
**What goes wrong:** Assuming an existing `{ name: 'Arizona', ... }` entry can simply have Tucson
appended to its `areas` array.
**Why it happens:** Pima County (Phase 193) used the separate `COVERAGE_COUNTIES` array (grep of
`coverage.js` for "Arizona" returns zero matches in `COVERAGE_STATES`) — Tucson is the FIRST Arizona
CITY entry.
**How to avoid:** Add a brand-new `{ name: 'Arizona', abbrev: 'AZ', areas: [{ label: 'Tucson',
browseGovernmentList: ['0477000'], browseStateAbbrev: 'AZ', hasContext: true }] }` block, following
the exact shape of existing state blocks (e.g., Nevada's, confirmed live in `coverage.js`), rather
than searching for a non-existent Arizona block to edit.
**Warning signs:** A grep for `name: 'Arizona'` in `coverage.js` before this phase returning 0
matches — confirmed, this is expected and not a bug to "fix" by looking harder.

### Pitfall 7: District/state-casing convention drift across older non-AZ city phases
**What goes wrong:** Copying the exact casing seen in some pre-existing `LOCAL_EXEC`/`LOCAL` city
district rows (e.g., La Verne/Los Alamitos/San Gabriel, CA, all use uppercase `state='CA'`) would
contradict the AZ-milestone's own established, disciplined convention (lowercase `state='az'` for
every LOCAL-tier district row, confirmed in Phases 190/191/192/193).
**Why it happens:** Different phases at different times used different casing conventions for
`districts.state` on LOCAL/LOCAL_EXEC rows — CA precedent uses uppercase, OR precedent (Beaverton,
Tigard, Troutdale — confirmed live) uses LOWERCASE, matching the AZ convention. **The routing JOIN
does NOT actually depend on this casing** — confirmed by reading `essentialsService.ts`: the
geofence-to-district join is `d.geo_id = gb.geo_id` plus a `mtfcc`-to-`district_type` CASE mapping,
with NO `state`-matching condition in that join at all. `districts.state` only affects a SEPARATE,
cosmetic join to `essentials.government_bodies` (chamber website/display-name enrichment).
**How to avoid:** Follow the AZ-milestone's own established lowercase convention (`state='az'`) for
BOTH the new ward `LOCAL` rows AND the new Mayor `LOCAL_EXEC` row, for consistency with Phases
190-193 — not because routing would otherwise break (it wouldn't), but for milestone-wide consistency
and because `government_bodies` enrichment (if ever added for Tucson) would then work correctly too.
**Warning signs:** None routing-breaking — this is a consistency/cosmetic-enrichment risk, not a
routing risk. Flag any deviation in code review regardless.

### Pitfall 8: Judicial compass topics do not apply (re-verified, unchanged from Phase 193)
**What goes wrong:** Stanced against all 44 live `inform.compass_topics` rows would include 8
`judicial-*` keys that have no bearing on a Mayor or ward council member.
**Why it happens:** `office_scope` remains empty/NULL for all 44 live topics (re-confirmed live
2026-07-10, `SELECT COUNT(*) ... WHERE office_scope IS NOT NULL AND array_length(office_scope,1)>0`
= 0) — this is a manual research convention, not DB-enforced.
**How to avoid:** Research against the 36 non-judicial live topics, exactly as Phase 193.
**Warning signs:** A verification script asserting "44 topics per official" would incorrectly flag
honest, complete 36/36 coverage as a gap.

### Pitfall 9: Migration numbering — disk MAX (1295), not ledger MAX, is authoritative
**What goes wrong:** Assuming the next structural migration number is ledger-MAX+1.
**Why it happens:** Ledger MAX is now **1288** (Phase 193's structural migration registered itself);
disk MAX is **1295** (`1295_ut_sd18_mccay_primary_loss_cull.sql`, an unrelated Utah phase that ran
after Phase 193 and consumed several more disk numbers, e.g. via audit-only stance migrations, without
all of them necessarily registering).
**How to avoid:** DB/disk-verified live 2026-07-10: ledger MAX=1288, disk MAX=1295. **Next structural
migration = 1296.** Re-verify both at plan/execute time regardless (drift is expected and has
recurred every single phase this milestone).
**Warning signs:** `psql -f` apply failing on a duplicate filename.

## Code Examples

### Query the Tucson wards GIS layer (verified live 2026-07-10)
```bash
# Source: https://gisdata.pima.gov/arcgis1/rest/services/GISOpenData/Boundaries2/MapServer/3
# (Pima-County-hosted mirror of the City of Tucson's own authoritative "Wards - City of Tucson"
# dataset — metadata points back to gis.pima.gov/data/contents/metadet.cfm?name=ward_cot)
# All 6 wards, no geometry (fast sanity + roster cross-check):
curl "https://gisdata.pima.gov/arcgis1/rest/services/GISOpenData/Boundaries2/MapServer/3/query?where=1%3D1&outFields=WARD,NAME&returnGeometry=false&f=json"
# => WARD 1 "Lane Santa Cruz", 2 "Paul Cunningham", 3 "Kevin Dahl", 4 "Nikki Lee",
#    5 "Selina Barajas", 6 "Miranda Schubert"

# Full geometry, WGS84 (outSR=4326 mandatory — native SRID is 2868, same AZ State Plane as Pima):
curl "https://gisdata.pima.gov/arcgis1/rest/services/GISOpenData/Boundaries2/MapServer/3/query?where=1%3D1&outFields=WARD,NAME&returnGeometry=true&outSR=4326&f=json"
# => ring counts: Ward1=1, Ward2=1, Ward3=1, Ward4=2, Ward5=7, Ward6=1 — Ward4/5 are MultiPolygon
```

### tucsonaz.gov WAF confirmation (verified live 2026-07-10)
```bash
curl -sIL -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36" \
  "https://www.tucsonaz.gov/Government/Mayor-Council-and-City-Manager/Mayor-Regina-Romero"
# => HTTP/1.1 403 Forbidden; X-Reference-Error header confirms Akamai WAF (not a 404/outage)
curl -s -o /dev/null -w "%{http_code}\n" "https://en.wikipedia.org/wiki/Regina_Romero"
# => 200 (Wikipedia reachable as a headshot-sourcing fallback)
```

### Migration ledger + external_id + mtfcc probes (run these exact queries at plan/execute time)
```sql
-- Ledger MAX (DB-verified 2026-07-10):
SELECT MAX(CAST(version AS INTEGER)) FROM supabase_migrations.schema_migrations
WHERE version ~ '^[0-9]{1,4}$';
-- => 1288

-- On-disk MAX (authoritative for next-number assignment — DB-verified 2026-07-10):
-- ls C:/EV-Accounts/backend/migrations/*.sql, sort by number => 1295
-- Next structural migration = 1296.

-- external_id collision check for the proposed -4008001..-4008007 block (7 people):
SELECT external_id FROM essentials.politicians WHERE external_id BETWEEN -4008007 AND -4008001;
-- => 0 rows (confirmed unused 2026-07-10)

-- Custom mtfcc collision check for X0020:
SELECT DISTINCT mtfcc FROM essentials.geofence_boundaries WHERE mtfcc LIKE 'X0%' ORDER BY 1;
-- => X0001, X0003-X0019 (X0019 = Pima); X0020 confirmed unused, safely outside the
--    excluded X0001-X0004 generic-catch-all range

-- Confirm essentials.districts has ZERO rows for the Mayor's boundary today:
SELECT COUNT(*) FROM essentials.districts WHERE geo_id='0477000';
-- => 0 (this phase must create the LOCAL_EXEC row)

-- Confirm 0477000/G4110 geofence_boundaries row already exists (from Phase 190):
SELECT geo_id, mtfcc, state, name FROM essentials.geofence_boundaries WHERE geo_id='0477000';
-- => 0477000 | G4110 | 04 | Tucson city   (state stored as FIPS numeric here — geofence_boundaries'
--    own convention, unrelated to districts.state; see Pitfall 7)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Pima's supervisor-district loader treated multi-ring handling as defensive-only insurance | Tucson's ward loader actually exercises the multi-ring/MultiPolygon branch for 2 of 6 features | This phase (first real trigger) | Confirms the winding-classification code was worth writing defensively — validate its output carefully (e.g., total ward area sanity, no dropped rings) since it is now load-bearing, not dead code |
| Prior AZ phases (190-193) sourced headshots from un-gated hosts (pima.gov CivicPlus) | Tucson's official host is WAF-gated | This phase (first WAF encounter in the AZ milestone) | Must budget Playwright-based sourcing time, not assume a quick `curl` pipeline |

**Deprecated/outdated:** None specific to this phase.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Party affiliations (all 7 = Democratic) sourced from WebSearch/Ballotpedia/news coverage, not an official filing document read directly | Summary / Roster | Party is stored but NEVER displayed (antipartisan design) — low impact; the blocking roster-currency checkpoint should re-confirm regardless |
| A2 | The exact Ward-5/Ward-4 ring geometries are confirmed disjoint exteriors (no holes) via this session's own signed-area computation on the live-fetched GeoJSON, not an independently-published GIS QA document | Common Pitfalls / Pitfall 1 | If a ring were actually a hole misclassified as exterior by a degenerate/near-zero area edge case, the loader's own `AREA_EPS` guard (already coded) would throw loudly rather than silently mis-store — low risk given the guard exists |
| A3 | Specific banner candidates (Wikimedia Commons downtown-Tucson streetscape shots) are shortlisted by dimension/license only, NOT independently visually reviewed for "best downtown-Tucson-streetscape read" the way Pima's execution phase did with 10 ranked candidates | Standard Stack / Don't Hand-Roll | Low impact — the execution-phase one-at-a-time sourcing pass (project convention, same as every prior banner) will do the actual visual selection; this research only narrows the field |
| A4 | Vice Mayor / roster facts are current as of 2026-07-10 research date; the council could theoretically re-vote or a seat could change before execution | Summary / Roster | Low-to-medium impact if execution happens weeks later without re-checking — mitigated by the already-planned blocking roster-currency human-verify checkpoint (Claude's Discretion in CONTEXT.md) |

**If this table is empty:** N/A — see rows above. The two highest-risk technical claims (ward
geofence multi-ring structure and current roster/Vice-Mayor identity) were BOTH independently
live-verified against primary GIS data and cross-checked news sources in this session, not assumed
from a single source.

## Open Questions (RESOLVED)

> Both open questions are non-blocking and resolved to a recommendation below; each `Recommendation:`
> is the RESOLVED answer. Plan 194-02 implements Q2's answer (title-suffix annotation only).

1. **RESOLVED — Should the multi-ring loader re-verify total ward area or feature count against a second,
   independent source (e.g., the City's own published ward-population/area figures) before trusting
   the winding-classification output?**
   - What we know: Signed-area classification confirms all 9 rings across Wards 4/5 are exterior
     (clockwise), consistent with disjoint annexed parcels rather than holes.
   - What's unclear: Whether any of those small disjoint parcels are populated (i.e., whether
     dropping one would ever actually mis-route a real address) or purely unpopulated annexed
     rights-of-way/parkland.
   - Recommendation: Not a blocker — load all rings faithfully regardless (the correct behavior is to
     preserve the source geometry exactly, populated or not); if the planner wants extra confidence,
     a smoke test could probe a coordinate inside the largest secondary ring of Ward 5 as a bonus
     check, but this is not required for correctness.

2. **RESOLVED — Exact Vice Mayor annotation text and whether the annotation should also appear in `remarks`.**
   - What we know: D-05 + Pattern 2 establish `title='Council Member, Ward 1 (Vice Mayor)'` as the
     locked shape (mirroring Pima's `(Chair)` suffix).
   - What's unclear: Whether to also note the rotation mechanic (annual, council-selected) in a
     `remarks` field the way some prior phases have.
   - Recommendation: Follow Pima's exact precedent — annotation lives in `title` only, nothing in
     `remarks` (Pima's migration did not use `remarks` for this either).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `psql` | Inline orchestrator DB apply/verify | ✓ | PostgreSQL 18.1 (confirmed on PATH 2026-07-10) | — |
| `npx tsx` | Ward geofence loader execution | ✓ (same `C:/EV-Accounts/backend` checkout as Phases 162/175/193) | project-pinned | — |
| Python 3 (`py -3`) + Pillow + requests + psycopg2 | Headshot/banner pipeline | ✓ (confirmed working in Phases 191/193) | 3.14.3 (Phase 191 check) | — |
| Tucson wards GIS layer (`gisdata.pima.gov/.../Boundaries2/MapServer/3`) | Geofence sourcing | ✓ (confirmed live, HTTP 200, 6/6 features, `outSR=4326` reprojection works, multi-ring confirmed) | live service, no version | — |
| `tucsonaz.gov` (official headshot + agenda source) | Headshot sourcing, stance-research primary citations | ✗ (Akamai WAF, 403 to curl + WebFetch) | — | Playwright browser navigation (`/find-headshots` skill) for headshots; news-outlet coverage (AZ Luminaria/Tucson Sentinel/AZPM/tucson.com) for stance citations |
| `mcp__playwright__browser_navigate` (+ snapshot/click/close) | Headshot sourcing fallback | ✓ (MCP-available per `/find-headshots` skill) | — | — |
| `mcp__supabase-local` / Supabase MCP | (NOT available to `gsd-executor`) | ✗ for the executor | — | Inline-orchestrator `psql` pattern (established, no gap) |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** `tucsonaz.gov` (WAF-blocked) — Playwright + alternate sources
as documented above. `mcp__supabase-local` unavailable to the executor — established inline-
orchestrator `psql` pattern is the correct workflow itself, not a workaround.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3 (project-wide `npm run test` → `vitest run`), no dedicated config file |
| Config file | none |
| Quick run command | `npx vitest run src/lib/buildingImages.test.js` |
| Full suite command | `npm run test` |

This phase is overwhelmingly backend data-seeding (SQL migrations + a geofence loader + Python
headshot/banner scripts) with exactly TWO frontend touches (`coverage.js` — a genuinely NEW Arizona
block, not an edit to an existing one; `buildingImages.js`). The primary "test" mechanism for the
backend work is the established in-migration `DO $$ ... RAISE EXCEPTION` post-verify gate pattern
plus inline-orchestrator `psql` audit SELECTs — same harness as every prior deep-seed phase.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TUC-01 (govt/roster) | Standalone-shaped City of Tucson government, ONE City Council chamber, Mayor (LOCAL_EXEC, `0477000`/G4110) + 6 ward offices (LOCAL, `X0020`), Vice Mayor annotation on Ward 1 only | integration (SQL DO-block + psql audit) | in-migration `DO $$` gate (row counts, section-split, VM-annotation count+identity) + orchestrator `psql -c "SELECT ..."` audits | ✅ pattern exists (Phase 193 precedent) |
| TUC-01 (geofences) | 6 X0020/`az` ward geofences loaded, ST_IsValid, correct geometry TYPE (MultiPolygon for Wards 4/5, Polygon for 1/2/3/6) | integration (psql + PostGIS functions) | `psql -tAc "SELECT geo_id, ST_GeometryType(geometry), ST_IsValid(geometry) FROM essentials.geofence_boundaries WHERE mtfcc='X0020' ORDER BY geo_id"` — expect exactly 2 `ST_MultiPolygon` rows (Wards 4/5) and 4 `ST_MultiPolygon` (ST_Multi-wrapped Polygon) rows all valid | ✅ pattern exists, NEW assertion (geometry-type check) needed given Pitfall 1 |
| TUC-01 (headshots) | 7/7 officials have a 600×750 `politician_images` row | smoke (HTTP GET + PIL dimension check) | Python pipeline's dry-run HTTP-200 pre-check + post-upload CDN HTTP 200 + PIL `(600,750)` assertion | ✅ pattern exists |
| TUC-01 (stances) | Evidence-only, 100% cited, no defaults, honest blanks, 36 non-judicial topics per official | manual-only (evidence-based research) | `psql` row-count + citation-completeness audit (same shape as Phase 193) | ✅ pattern exists |
| BANR-01 | Licensed Tucson banner sourced/processed/uploaded/wired; NEW Arizona `coverage.js` block added | unit (Vitest) + smoke (CDN HTTP) | `npx vitest run src/lib/buildingImages.test.js` + `curl -I <CDN banner URL>` + `node --input-type=module -e "import(...)"` parse-check on `coverage.js` | ✅ `buildingImages.test.js` exists; no dedicated `coverage.test.js` (established non-gap, per Phase 162/193 precedent) |

### Sampling Rate
- **Per task commit:** in-migration `DO $$` gate (backend); `node --input-type=module -e "import(...)"` parse-check (coverage.js/buildingImages.js)
- **Per wave merge:** full `psql` audit suite (row counts, casing, section-split, geometry-type check) + `npx vitest run src/lib/buildingImages.test.js`
- **Phase gate:** All SQL post-verify gates green + operator-approved roster-currency checkpoint + `npm run test` green before `/gsd:verify-work`

### Wave 0 Gaps
- No dedicated `coverage.test.js` exists for ANY prior county/city addition — established substitute
  is a `node --input-type=module -e "import(...)"` parse-check plus a grep for the new label/geo_id
  (Phase 162/193 precedent). NOT a gap to fill this phase.
- `buildingImages.test.js` already exists and exercises `CURATED_LOCAL` state-scoping generically —
  adding a Tucson entry needs no new test file, just confirming the existing suite still passes.
- NEW (not present in Pima's Wave 0): a geometry-TYPE assertion (`ST_GeometryType` = `ST_MultiPolygon`
  for Wards 4/5) should be added to the post-load psql audit — this check did not exist for Pima
  (whose 5 districts were all simple single-exterior polygons, ST_Multi-wrapped) because it was never
  needed there; it is a genuinely useful NEW gate for this phase given Pitfall 1.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Public read-only data; no auth surface touched |
| V3 Session Management | No | N/A |
| V4 Access Control | No | Public-read RLS policies already in place on all touched tables |
| V5 Input Validation | Yes | Ward geofence loader must parameterize all SQL binds — never string-concatenate GIS response data into SQL |
| V6 Cryptography | No | N/A |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection via untrusted GIS geometry/attribute data | Tampering | Parameterized binds ($1 geo_id / $2 name / $3 GeoJSON / $4 source) in the loader `INSERT`, exactly as the Pima/LV/WashCo loaders |
| Multi-ring geometry silently mis-encoded (dropped rings, wrong exterior/hole classification) | Tampering | Full winding-order classification (signed-area shoelace, CW=exterior/CCW=hole) + `AREA_EPS` degenerate-ring guard that hard-fails rather than silently mis-store — this phase actually exercises this defense for the first time |
| Invalid/self-intersecting polygon silently corrupting routing | Tampering | `RETURNING ST_IsValid` + conditional `ST_MakeValid` re-run fallback |
| Section-split (offices attached under the wrong government) | Tampering | Chamber scoped to `government_id` subquery; post-verify `DO` block section-split gate must return 0 |
| Attempting to bypass a WAF via header/UA spoofing for headshot sourcing | (N/A — this is a legitimate sourcing concern, not an attack) | Use the sanctioned Playwright-based `/find-headshots` browser-navigation flow rather than crafting evasive request headers — this is both more reliable and avoids any appearance of adversarial scraping against a `.gov` host |
| Service-role key / `DATABASE_URL` leakage | Information disclosure | Read from gitignored `.env`; never hardcoded |

## Sources

### Primary (HIGH confidence — direct live verification in this session, 2026-07-10)
- `psql` live queries against production Supabase DB — ledger MAX (1288), disk MAX (1295) cross-check,
  `essentials.districts` zero-rows-for-`0477000` confirmation, `essentials.geofence_boundaries`
  `0477000`/G4110 existing-row confirmation, external_id collision check (`-4008001..-4008007`
  unused), mtfcc collision check (`X0020` unused), `essentials.chambers` schema (`slug` GENERATED
  ALWAYS column), Beaverton/La Verne one-chamber-two-district-types live precedent, LV ward office
  title-string precedent, `inform.compass_topics` re-verification (44 live, 8 judicial, `office_scope`
  still empty for all).
- `curl`/direct HTTP queries against `https://gisdata.pima.gov/arcgis1/rest/services/GISOpenData/
  Boundaries2/MapServer/3` — layer discovery (via the ArcGIS Online item-search API, found the
  correct `Boundaries2` MapServer distinct from Pima's supervisor-district `Boundaries` MapServer),
  field schema (`WARD`, `NAME`, `KEYID`), 6-feature roster confirmation, per-ward ring counts,
  `outSR=4326` sanity check, and the signed-area ring-winding classification computed directly in
  this session (Node.js shoelace-formula script against the live-fetched GeoJSON).
- `curl -I`/WebFetch against `tucsonaz.gov` — direct confirmation of the Akamai WAF 403 (with
  `X-Reference-Error` header) for both a headshot bio page and the Mayor's page, with and without a
  full browser User-Agent.
- `C:/EV-Accounts/backend/migrations/1288_pima_county_board_of_supervisors.sql` (read in full) — the
  Chair-title-annotation pattern, post-verify DO-block gate shape, migration-ledger registration
  convention.
- `C:/EV-Accounts/backend/scripts/load-pima-supervisor-boundaries.ts` (read in full) — the
  `arcgisRingsToGeoJson()` winding-classification helper (including its never-yet-exercised multi-ring
  branch, now load-bearing for this phase).
- `C:/Transparent Motivations/essentials/src/lib/coverage.js` + `src/lib/buildingImages.js` (read
  relevant sections) — confirmed zero existing Arizona `COVERAGE_STATES` block; confirmed exact
  `CURATED_LOCAL` wiring shape used for Pima County.
- `C:/EV-Accounts/backend/src/lib/essentialsService.ts` (read the core routing query, lines ~614-680)
  — confirmed the geofence↔district join is `geo_id` + `mtfcc`-to-`district_type` mapping only, with
  NO `state`-casing dependency in that join (the `state`-matching join is a separate, cosmetic
  `government_bodies` enrichment join) — resolves the casing-convention question (Pitfall 7) with
  code-level certainty rather than inference.

### Secondary (MEDIUM confidence — WebSearch/WebFetch, cross-verified against the live GIS `NAME` field above)
- `azluminaria.org` (2025-08-06, 2025-11-04) — Ward 3/5/6 primary + general election results, party
  affiliations, margins.
- `tucsonsentinel.com` (2025-11-04) — "Dahl wins 2nd term; Schubert & Barajas new faces on Council as
  Dems sweep Tucson election" — headline confirmation of the partisan sweep and specific vote shares.
- `tucson.com` "Political Notebook: New Tucson council retains Santa Cruz as vice mayor" — the
  authoritative Vice Mayor vote breakdown (4–3, named councilmembers on each side) resolving the
  Pitfall 2 conflict.
- Ballotpedia-sourced WebSearch summary on Tucson's "modified ward" partisan election system —
  independently corroborated by the mechanics described in AZ Luminaria/Tucson Sentinel primary-vs-
  general coverage (ward-restricted primary, citywide general).
- Ballotpedia (`ballotpedia.org/Paul_Cunningham`, `ballotpedia.org/Nikki_Lee`) via WebSearch snippet
  (direct WebFetch to ballotpedia.org returned 403 — also apparently bot-protected) — party
  affiliation and term-date confirmation for Cunningham and Lee.

### Tertiary (LOW confidence — shortlist only, not independently visually reviewed)
- Wikimedia Commons search/category results for downtown-Tucson streetscape photos — 6 candidates
  identified with dimension/license metadata (`Tucson - Downtown (7176890768).jpg`, 5760×3840, CC BY
  2.0, Bill Morrow, being the strongest resolution/aspect-ratio candidate found this session; also
  `Downtown Tucson 2013.JPG`, `FOX Theater AZ Tucson NRHP 03000905.jpg`, `Downtown Tucson.jpg`, others
  in `Category:Downtown Tucson, Arizona` and `Category:Congress Street (Tucson, Arizona)`). **The
  execution-phase one-at-a-time sourcing pass (project convention, matching Pima's approach) must
  still make the final visual selection** — this research narrows the field but does not finalize it.

## Metadata

**Confidence breakdown:**
- Standard stack / tooling: HIGH — zero new dependencies; Playwright MCP already available for the
  one genuinely new sourcing need (WAF-blocked headshots).
- Geofence sourcing (D-01): HIGH for reachability/field-schema/roster-cross-check; HIGH for the
  multi-ring finding itself (directly computed from live-fetched geometry, not inferred) — this is
  the phase's single most important technical finding and it changes how the loader must be written.
- Roster/Vice-Mayor/election-method: HIGH — cross-verified via 3+ independent sources including the
  live GIS `NAME` attribute itself; the Vice Mayor conflict was explicitly resolved (not just
  reported) via a primary vote-breakdown article.
- Headshot sourcing: MEDIUM — the WAF block is HIGH-confidence (directly reproduced), but the exact
  Playwright-navigation success rate against `tucsonaz.gov` was not tested in this research session
  (only the raw-HTTP failure mode was confirmed); budget contingency time.
- Migration numbering / ext_id scheme / mtfcc: HIGH — directly DB-verified.
- Stance-topic scope: HIGH — directly DB re-verified, unchanged from Phase 193.
- Banner subject: MEDIUM — mechanism and shortlist candidates are solid, but final visual selection
  is explicitly deferred to the execution-phase sourcing pass per project convention.

**Research date:** 2026-07-10
**Valid until:** 30 days for DB/migration-numbering facts (re-verify ledger/disk MAX at plan/execute
time regardless — drift has recurred every phase this milestone); 7 days for roster-currency facts
(the Vice Mayor title rotates annually each December and a re-vote or resignation could occur; the
already-planned blocking human-verify checkpoint should re-run the live GIS `NAME` cross-check at
execute time, which takes one `curl` call).
