# Phase 202: Palm Springs Deep-Seed - Research

**Researched:** 2026-07-12
**Domain:** CA municipal deep-seed (by-district city council + rotational mayor) — GIS geofence loading, roster/politician seeding, headshot sourcing, banner reuse, frontend coverage surfacing
**Confidence:** HIGH

## Summary

Phase 202 is the second of three appended Coachella Valley, CA deep-seeds (201 Riverside County done, 202 Palm Springs, 203 Indio next). It is the **same shape** as every prior by-district-city-with-rotational-mayor deep-seed this project has already shipped (Santa Clarita/Ph143, Glendale/Ph144, Bellflower/Ph156, West Covina/Ph152) and structurally identical to the standalone-county deep-seed just completed one phase ago (Riverside County/Ph201) — same 6-step deep-seed unit, same idempotency conventions, same orchestrator/executor split. Nearly every mechanic can be copied from Phase 201's migrations and `201-PATTERNS.md` verbatim, substituting Riverside County's standalone-COUNTY specifics for Palm Springs' CITY specifics (government type `'City'`, chamber `'City Council'`, and — critically — a **rotational Mayor + Mayor Pro Tem title-on-seat** pair, which Riverside's board-only county did not have but five prior CA by-district *cities* already established as a proven pattern).

Two live-research findings materially change what CONTEXT.md assumed and should be corrected before planning:

1. **The banner is already done.** Phase 201 sourced and shipped a Palm Springs city banner (`cities/palm-springs.jpg`, Palm Canyon Dr street scene, CC BY-SA 3.0, already live in `src/lib/buildingImages.js` line 436) as a banner-only add (no deep-seed at the time). **BANR-01 for this phase reduces to adding a `coverage.js` COVERAGE_STATES chip** once stances exist — no new photo sourcing needed.
2. **The ArcGIS Experience app CONTEXT.md points to is stale.** The "2018 Council Districts" Experience app's underlying web map is a **draft/pre-final feature collection** ("Torres1 (not population-balanced)"), not the current district boundaries — and more importantly, Palm Springs **re-districted in 2021** post-Census (Ordinance No. 2060, "Map L," `mappalmsprings.org`/`psdistricts.com`), superseding the 2018 map entirely. This research located and confirmed the actual **current, live, city-GIS-maintained FeatureServer** (`Palm_Springs_Voting_Districts_2022_(View)`, modified Jan 2025, owner `PalmSprings_GIS`) that returns exactly 5 polygon districts in GeoJSON with a `DISTRICT` attribute AND embedded current-councilmember metadata that cross-verifies the roster. Use this endpoint, not the 2018 Experience app.

**Primary recommendation:** Reuse Phase 201's structural-migration / loader / headshot-pipeline / stance-migration templates verbatim (they are themselves reused from Pima County/Ph193), substituting: government type `City`, chamber `City Council`, geofence source = the confirmed `Palm_Springs_Voting_Districts_2022_(View)` FeatureServer (not the 2018 Experience app), next unused custom mtfcc `X0022` (verify at execute time), and the Mayor/Mayor-Pro-Tem title-on-seat pattern from Bellflower (Ph156)/West Covina (Ph152) applied to Soto (D4, Mayor) and Ready (D5, Mayor Pro Tem). Skip banner sourcing entirely — only add the `coverage.js` chip.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Council-district boundary storage (5 polygons) | Database / Storage (`essentials.geofence_boundaries`, PostGIS) | — | Geofences are canonical spatial data, queried via GIST/PIP for address routing |
| Address → district → councilmember routing | API / Backend (accounts-api Express, point-in-polygon resolution) | Database / Storage | Routing logic lives server-side; the frontend only renders what the API resolves |
| Government/chamber/office/politician roster | Database / Storage | — | Structural relational data (`essentials.governments/chambers/districts/offices/politicians`) |
| Headshot images | CDN / Static (Supabase Storage `politician_photos` bucket) | Database / Storage (`politician_images` row pointing at the CDN URL) | Images served from CDN; DB only stores the pointer + metadata |
| Compass stances (evidence-only) | Database / Storage (`inform.politician_answers` / `inform.politician_context`) | — | Structured stance data with citations, no client-side logic |
| Community banner image | CDN / Static (already live, `cities/palm-springs.jpg`) | Frontend Server / Browser (`SectionBanner.jsx` render) | Asset already uploaded (Ph201); only the coverage-chip wiring is new frontend config |
| Coverage/browse surfacing | Frontend Server (build-time static config, `src/lib/coverage.js` + `buildingImages.js`) | Browser (landing page render) | Static arrays consumed at build/render time, no backend round-trip |

## Standard Stack

### Core (reused verbatim from Phase 201 / Phase 193)
| Tool/Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript geofence loader (`backend/scripts/load-*-boundaries.ts`) | project-internal, Node/`pg` | One-time ETL: fetch ArcGIS GeoJSON → PostGIS INSERT | Established convention for every prior county/city district loader (LA County, WashCo, Pima, Riverside) |
| Python headshot pipeline (`backend/scripts/_tmp-*-headshots.py`, gitignored) | project-internal, PIL + requests + psycopg2 | Crop-4:5-then-resize-600×750 → Storage upload → DB row | Reused verbatim per `feedback_headshot_resize_no_distort`; crop-first is mandatory |
| `scripts/banners/process_banner.py` + `upload_banner.py` | project-internal | Banner crop/upload | **Not needed this phase** — Palm Springs banner already live from Ph201 |
| PostGIS (`ST_GeomFromGeoJSON`, `ST_Multi`, `ST_MakeValid`, `ST_IsValid`) | Supabase-managed Postgres extension | Geometry storage/validation | Standard for every geofence loader in this codebase |

### Supporting
| Tool/Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `curl -sI` / `psql -tAc` | n/a (shell) | Orchestrator-run production audit assertions | Final verification wave (mirrors 201-06) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `Palm_Springs_Voting_Districts_2022_(View)` FeatureServer (recommended) | The 2018 ArcGIS Experience app CONTEXT.md points to | Experience app's underlying web map is a static/draft feature collection ("Torres1, not population-balanced"), not a live service, and reflects the SUPERSEDED 2018 map, not the 2021 "Map L" boundaries — do not use |
| `Palm_Springs_Voting_Districts_2022_(View)` FeatureServer | California State Geoportal (`gis.data.ca.gov`) | No Palm Springs council-district-specific dataset found there; city-hosted service is more authoritative and current anyway |

**No new package installs required.** This phase is 100% reuse of already-installed/already-approved tooling (Node `pg`, Python PIL/requests/psycopg2, existing banner scripts). **Package Legitimacy Audit: N/A** — no new external packages introduced.

## Package Legitimacy Audit

Not applicable — this phase installs zero new packages. All tooling (TS geofence loader, Python headshot pipeline, banner scripts) reuses code already vetted and shipped in Phases 193/195/201.

## Architecture Patterns

### System Architecture Diagram

```
ArcGIS FeatureServer (city GIS, live)
  Palm_Springs_Voting_Districts_2022_(View)/FeatureServer/0
        │  ?f=geojson (5 polygons, DISTRICT attribute "1".."5")
        ▼
backend/scripts/load-palmsprings-council-boundaries.ts  (orchestrator-run, one-time ETL)
        │  INSERT ... ON CONFLICT (geo_id, mtfcc) DO NOTHING
        ▼
essentials.geofence_boundaries  (mtfcc='X0022', state='ca', 5 rows)
        │  pre-flight assertion (COUNT >= 5) gates the structural migration
        ▼
backend/migrations/13xx_palm_springs_city_council.sql  (structural, registered)
   → essentials.governments  ('City of Palm Springs, California, US', type='City', geo_id='0655254')
   → essentials.chambers     ('City Council', official_count=5)
   → essentials.districts    (5× LOCAL, mtfcc='X0022', state='ca')
   → essentials.politicians + essentials.offices  (5 by-district seats;
       Soto D4 title='Mayor', Ready D5 title='Mayor Pro Tem', others 'Councilmember')
        │
        ▼
backend/migrations/13xx_palm_springs_headshots.sql  (audit-only)
   → essentials.politician_images  (5 rows → Supabase Storage CDN)
        │
        ▼
backend/migrations/13xx..13xx_palm_springs_councilmember_N_stances.sql  (audit-only, ×5)
   → inform.politician_answers + inform.politician_context  (evidence-only, cited)
        │
        ▼
src/lib/coverage.js       COVERAGE_STATES → CA → { label: 'Palm Springs', ... hasContext:true }
src/lib/buildingImages.js CURATED_LOCAL['palm springs']  (ALREADY LIVE — no change needed)
        │
        ▼
Resident enters a Palm Springs address on essentials.empowered.vote
        │  API resolves address → point-in-polygon against the 5 X0022 districts
        ▼
Results.jsx renders: the ONE correct District N councilmember,
   headshot, evidence-only compass, city banner (via representingCity match)
```

### Recommended Project Structure
No new source directories. Files touched:
```
EV-Accounts (backend, separate repo, master → Render):
  backend/scripts/load-palmsprings-council-boundaries.ts   # new, one-time loader
  backend/scripts/_tmp-palmsprings-headshots.py             # new, gitignored, orchestrator-run
  backend/migrations/13xx_palm_springs_city_council.sql     # new, structural, registered
  backend/migrations/13xx_palm_springs_headshots.sql        # new, audit-only
  backend/migrations/13xx..13xx_palm_springs_councilmember_N_stances.sql  # new ×5, audit-only

essentials (this repo, main → Render):
  src/lib/coverage.js         # append 1 COVERAGE_STATES → CA entry
  src/lib/buildingImages.js   # NO CHANGE — 'palm springs' key already present (line 436)
```

### Pattern 1: Rotational Mayor / Mayor Pro Tem as title-on-seat (NOT a separate office)
**What:** The Mayor and Mayor Pro Tem are annually-rotating titles assigned to two of the five by-district council seats — never a separate `LOCAL_EXEC` district, chamber, or office row.
**When to use:** Every CA general-law/charter city where the council selects its own Mayor from among sitting district members (confirmed proven pattern: Santa Clarita/143, Glendale/144, West Covina/152, Bellflower/156).
**Example (from `1043_bellflower_complete.sql`-shape, reused for `1011_west_covina_complete.sql`):**
```sql
-- Source: C:/EV-Accounts/backend/migrations pattern, confirmed in
-- .planning/milestones/v17.0-phases/152-west-covina-deep-seed/152-02-PLAN.md
UPDATE essentials.offices SET title='Mayor'
  WHERE politician_id = '<Soto's D4 office politician_id>' AND title IS DISTINCT FROM 'Mayor';
UPDATE essentials.offices SET title='Mayor Pro Tem'
  WHERE politician_id = '<Ready's D5 office politician_id>' AND title IS DISTINCT FROM 'Mayor Pro Tem';
UPDATE essentials.offices SET title='Councilmember'
  WHERE politician_id IN ('<Garner>','<Bernstein>','<deHarte>') AND title IS DISTINCT FROM 'Councilmember';
-- Inside the same transaction: exactly-one-Mayor assert (RAISE EXCEPTION unless COUNT=1)
```
`official_count` on the chamber = **5** (the Mayor is one of the 5 by-district seats — NOT a 6th excluded seat, unlike a Lancaster/Pomona-style directly-elected-mayor city).

### Pattern 2: ArcGIS "Experience app" ≠ the live data — always resolve to the underlying FeatureServer
**What:** ArcGIS Experience Builder / Web AppBuilder apps are UI shells; they reference a Web Map item, which in turn references either (a) live FeatureServer/MapServer layers, or (b) a static embedded `featureCollection` (a frozen snapshot, possibly a draft). Only case (a) is loadable via `?f=geojson` for an ETL script.
**When to use:** Any time a city GIS "map app" URL is the only clue given — resolve it before assuming it's a queryable service.
**Example (verified working end-to-end this session):**
```
1. Experience app item id  → GET https://www.arcgis.com/sharing/rest/content/items/<experienceId>/data?f=json
   → find the referenced Web Map itemId (and portal, if not arcgis.com)
2. Web Map itemId → GET https://www.arcgis.com/sharing/rest/content/items/<webmapId>/data?f=json
   → inspect operationalLayers[]; if a layer has a "url" field ending in /FeatureServer/N, that's usable;
     if it has an embedded "featureCollection" instead, that map is a static/draft snapshot — do NOT use it.
3. Query the live layer directly:
   GET https://services.arcgis.com/f48yV21HSEYeCYMI/arcgis/rest/services/
       Palm_Springs_Voting_Districts_2022_%28View%29/FeatureServer/0/query
       ?where=1%3D1&outFields=*&returnGeometry=true&f=geojson&outSR=4326
   → confirmed: FeatureCollection, 5 features, geometry.type="Polygon", fields FID/DISTRICT/CouncilName/Contact/GlobalID
```
Note the URL-encoded parentheses (`%28View%29`) in the service name — required, the literal `(View)` is part of the service's REST path segment.

### Anti-Patterns to Avoid
- **Treating the 2018 "Council Districts" ArcGIS Experience app as current:** it references a DRAFT web map ("Torres1, not population-balanced") and even if it referenced the true 2018-adopted map ("Middleton Test 6b"), that map was superseded by the 2021 post-Census "Map L" (Ordinance 2060). Use the confirmed `Palm_Springs_Voting_Districts_2022_(View)` FeatureServer instead.
- **Creating a separate Mayor office/chamber/LOCAL_EXEC district:** wrong model for Palm Springs (rotational, not directly-elected like Lancaster/Pomona/El Monte). Title-on-seat only.
- **Re-sourcing the Palm Springs banner:** it's already live (`cities/palm-springs.jpg`); redoing this work wastes a sourcing pass that Phase 201 already completed and the operator already implicitly reviewed as part of the CA-city-banner-audit track.
- **Hardcoding the next X-code / ext_id / migration number from this document:** all three counters are disk/DB-authoritative and shift as other phases (196-198 AZ suburbs, 203 Indio) execute in parallel tracks — DB-verify at execute time (see Assumptions Log).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ArcGIS ring-winding / geometry repair | A custom polygon-fixing routine | `ST_MakeValid` (already the established fallback in every prior loader) | Self-intersecting rings from ArcGIS exports are common; Postgres/PostGIS's repair function is the proven fix, reused verbatim across Pima/WashCo/Riverside |
| District-to-councilmember address resolution | A new point-in-polygon endpoint | The existing PIP routing already used for every LOCAL-tier district (no new backend code needed — this phase is pure data) | The routing mechanism is generic across all `district_type='LOCAL'` rows; adding data, not code |
| Headshot crop/resize | A new image-processing script | The existing `crop_to_4_5()` / `resize_600x750()` / `process_headshot_bytes()` functions from `_tmp-pima-supervisors-headshots.py` / `_tmp-riverside-supervisors-headshots.py` | Byte-identical requirement (4:5 crop-first-then-resize, `feedback_headshot_resize_no_distort`); no reason to reimplement |

**Key insight:** This phase has essentially zero net-new code. It is a data-population exercise using five already-proven scripts/migration templates. The engineering risk is almost entirely in **getting the source data right** (the correct current district boundaries, the correct current roster/titles, the correct current headshot sources) — not in writing new logic.

## Common Pitfalls

### Pitfall 1: Using the wrong (stale) district map
**What goes wrong:** Loading the 2018 map (or its draft precursor) instead of the 2021 "Map L" boundaries, silently shipping wrong district shapes that misroute some addresses to the wrong councilmember.
**Why it happens:** CONTEXT.md's compiled recon pointed at the 2018 ArcGIS Experience app, which is the top web-search hit and looks authoritative (it's an official-looking City GIS page), but is superseded.
**How to avoid:** Use the confirmed `Palm_Springs_Voting_Districts_2022_(View)` FeatureServer (owner `PalmSprings_GIS`, modified January 2025) — this is the maintained, current layer, and its embedded `CouncilName` attribute cross-verifies against the live roster (see Sources).
**Warning signs:** A loaded district's `CouncilName`/attribute data (if present) doesn't match the current officeholder, or a feature count ≠ 5.

### Pitfall 2: `DISTRICT` field is a string, not an integer
**What goes wrong:** A loader that does strict integer parsing/comparison on the `DISTRICT` attribute may mis-handle it if written assuming a numeric type.
**Why it happens:** The confirmed FeatureServer's `DISTRICT` field returns string values (`"1"`, `"2"`, ... `"5"`), not integers.
**How to avoid:** Parse defensively (`parseInt(feature.properties.DISTRICT, 10)`), same defensive fallback-chain discipline used in every prior county loader (LA County/Pima/Riverside all defend against unexpected attribute typing/naming).
**Warning signs:** A district with `geo_id` ending in `NaN` or a rejected/skipped feature.

### Pitfall 3: Assuming the directly-elected-mayor ballot measure has passed
**What goes wrong:** Modeling Palm Springs with a Lancaster/Pomona-style directly-elected `LOCAL_EXEC` Mayor because of the active 2026 public discussion.
**Why it happens:** KESQ and The Palm Springs Post have covered an active "Citizens for an Elected Mayor" petition drive and City Council review process (Feb–July 2026 meetings, most recently a July 22, 2026 public input session) proposing a citywide-elected 4-year-term Mayor beginning November 2026.
**How to avoid:** As of this research (2026-07-12) **no measure has been adopted** — it is still in the petition/review stage, with the earliest possible ballot date being November 2026 and no confirmed placement yet. The rotational model (Ordinance-based, in place since 2019) is still the live model. Re-verify at execute time (and again before any Nov-2026-elections phase) since this is an active, fast-moving local story.
**Warning signs:** Any source dated after this research citing a passed charter amendment or a certified ballot measure.

### Pitfall 4: X-code / ext_id / migration-number collisions from stale documentation
**What goes wrong:** Hardcoding `X0022`, a specific `-401Nxxx` ext_id block, or migration number `1328` directly from this document once other phases (Indio/203, or the still-open AZ suburb phases 196-198) have executed in the interim and consumed those slots.
**Why it happens:** All three counters are disk/DB-authoritative, not fixed at research time (explicitly true in this project — see Phase 201's own pattern doc, which had to correct its own `-4008001` planning estimate to the actual `-4010001` at execute time).
**How to avoid:** DB-verify each counter immediately before authoring the structural migration: `SELECT DISTINCT mtfcc FROM essentials.geofence_boundaries WHERE mtfcc LIKE 'X00%' ORDER BY mtfcc` for the next X-code; `SELECT MIN(external_id) FROM essentials.politicians WHERE external_id < 0` (or the established `-400N` county/city-council block scan) for ext_id; a fresh `ls backend/migrations | sort -n | tail` (or `SELECT MAX(version::int) FROM supabase_migrations.schema_migrations`) for the next migration number.
**Warning signs:** An `ON CONFLICT` no-op on insert, or a migration number that already exists on disk.

## Code Examples

### Confirmed working ArcGIS query (verified this session, returns 5 valid polygons)
```
GET https://services.arcgis.com/f48yV21HSEYeCYMI/arcgis/rest/services/Palm_Springs_Voting_Districts_2022_%28View%29/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&f=geojson&outSR=4326
```
Response: `FeatureCollection`, 5 `Polygon` features, `properties.DISTRICT` = `"1".."5"` (string), `properties.CouncilName` present (useful as a live cross-check, not a data source of record).

### Government + chamber INSERT (adapt from Riverside `1314_riverside_county_board_of_supervisors.sql` shape)
```sql
-- Source: pattern verified in .planning/phases/201-riverside-county-board-of-supervisors-deep-seed/201-PATTERNS.md
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(), 'City of Palm Springs, California, US', 'City', 'CA', 'Palm Springs', '0655254'
WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE name = 'City of Palm Springs, California, US');

INSERT INTO essentials.chambers (id, name, name_formal, government_id, official_count)
SELECT gen_random_uuid(), 'City Council', 'Palm Springs City Council',
       (SELECT id FROM essentials.governments WHERE name = 'City of Palm Springs, California, US'), 5
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'City Council'
    AND government_id = (SELECT id FROM essentials.governments WHERE name = 'City of Palm Springs, California, US')
);
```
Casing convention unchanged: `districts.state='ca'` lowercase (LOCAL routing key); `governments.state='CA'` / `offices.representing_state='CA'` uppercase (free-text labels).

### `coverage.js` insertion (only new frontend change; alphabetical CA array, between Norwalk and Palmdale)
```javascript
// src/lib/coverage.js — COVERAGE_STATES → California → areas[]
{ label: 'Palm Springs', browseGovernmentList: ['0655254'], browseStateAbbrev: 'CA', hasContext: true },
```
Stage `hasContext: false` first if the coverage-wave runs before the stance-wave completes (established Pima/WashCo/Riverside precedent — flip on only once ≥1 stance row exists).

## State of the Art

| Old Approach (CONTEXT.md assumption) | Current Approach (this research) | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 2018 "Council Districts" ArcGIS Experience app as the geofence source | `Palm_Springs_Voting_Districts_2022_(View)` FeatureServer (city GIS, actively maintained) | District lines changed 2021 (Ordinance 2060, post-2020-Census); GIS layer refreshed Jan 2025 | Loading the old map risks shipping the wrong district shapes |
| Palm Springs banner needs sourcing (BANR-01) | Banner already sourced + live (Ph201, `cities/palm-springs.jpg`) | 2026-07-12 (Phase 201) | BANR-01 for this phase = coverage.js chip only, not a new photo pass |
| "Directly-elected mayor" possibly adopted (KESQ early-2026 mention) | Still rotational as of 2026-07-12; petition/review process ongoing, no measure adopted, next public session July 22 2026 | Ongoing — re-check at execute time | Confirms the by-district relabel + title-on-seat pattern still applies; do not model a LOCAL_EXEC Mayor |

**Deprecated/outdated:** The 2018 council-district map and its ArcGIS Experience app wrapper — superseded by 2021's Map L, itself now served from a different, unrelated FeatureServer than the Experience app references.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Next unused custom mtfcc code is `X0022` (after X0019 Pima / X0020 Tucson wards / X0021 Riverside supervisors) | Summary, Pattern diagram, Pitfall 4 | Low — a collision would surface immediately via the `ON CONFLICT`/pre-flight assertion pattern already in every loader template; DB-verify before authoring |
| A2 | Next ext_id block for the 5 Palm Springs councilmembers follows the established `-401Nxxx` county/city convention (exact block TBD) | Pattern 1 example, Pitfall 4 | Low — same idempotent/collision-safe convention as every prior phase; must DB-verify the actual free block, not assume a specific number |
| A3 | Next migration number is 1328 (disk MAX observed as 1327 — `1327_utahco_candidate_office_rows_delete.sql` — at research time, 2026-07-12) | Code Examples, Pitfall 4 | Low — disk-authoritative convention already established; other in-flight phases (196-198 AZ, 203 Indio) may consume numbers first; re-check at execute time |
| A4 | Ballotpedia coverage of Palm Springs officials is thin/inconsistent (city is outside Ballotpedia's "100 largest cities" scheduled-coverage scope, per Ballotpedia's own note) | Common Pitfalls headshot sourcing context (not a numbered pitfall above, folded into general headshot-sourcing note) | Low-Medium — may mean fewer headshot fallback options than in larger cities; campaign sites / local press (thepalmspringspost.com) and Wikimedia should be tried first |
| A5 | The `CouncilName` attribute embedded in the confirmed FeatureServer (Garner D1 / Bernstein D2 / deHarte D3 / Soto D4 / Ready D5) reflects the CURRENT roster as of the January 2025 layer update, and remains accurate as of this research (2026-07-12) | Summary, Roster cross-check | Low — independently corroborated by KESQ/Palm Springs Post reporting on the Dec 2025 Soto swearing-in and by palmspringsca.gov term-date search snippets; still, re-verify roster at execute time per standard practice |

**If this table is empty:** N/A — see rows above. All other factual claims in this document (ArcGIS endpoint mechanics, banner CDN presence, migration/pattern precedents) were directly verified via WebFetch/Bash/Grep against live services or the project's own committed files this session.

## Open Questions

1. **Exact next-free X-code / ext_id block / migration number**
   - What we know: precedent counters as of 2026-07-12 (X0021 max, migration 1327 max, `-4010005` the most recent county/city ext_id used)
   - What's unclear: whether phases 196-198 (AZ suburbs) or 203 (Indio) will execute before 202 and consume the "next" slot
   - Recommendation: DB/disk-verify all three counters as the first pre-flight step of the structural-migration plan wave, exactly as Phase 201's own plan set did (it had to correct its own pre-planned ext_id block at execute time)

2. **Best headshot source per councilmember**
   - What we know: `palmspringsca.gov` is Akamai WAF-403 to bots (confirmed live this session); Ballotpedia coverage is thin (city not in Ballotpedia's scheduled top-100); The Palm Springs Post and KESQ have recent, good-quality photos of the Dec 2025 swearing-in (Soto + Ready together); campaign-style personal sites likely exist for at least Soto (health-care-executive candidate) and possibly deHarte (per CONTEXT.md's `rondeharte.com` note)
   - What's unclear: per-member final source and license — this is normally resolved at execute time (per-member WAF/reachability probing, same discipline as every prior phase)
   - Recommendation: probe each of the 5 members individually at execute time (Wikimedia Commons category search, Ballotpedia candidate pages for 2022/2024 election cycles, thepalmspringspost.com photo archive, individual campaign sites) — do not assume a single CMS pattern works for all 5, matching the Riverside precedent where 5 different district-site domains were needed

3. **Whether the directly-elected-mayor petition affects the phase's stance research window**
   - What we know: an active petition/council-review process is underway with a July 22, 2026 public input session
   - What's unclear: whether any councilmember's compass stances should reference this live local debate (e.g., a "local governance/democracy" adjacent topic, if one exists in the live compass topic set) — likely NOT a fit for the existing ~36 non-judicial topic set (housing/taxes/public-safety/etc.), but worth a quick check during stance research
   - Recommendation: treat as background context only unless a live compass topic is a genuine match; do not force a stance on this issue into an unrelated topic

## Environment Availability

Skipped — no new external tool/service dependency beyond what every prior deep-seed phase already uses (Node/`pg`, Python/PIL/requests/psycopg2, `psql`, `curl`), all already confirmed available in this project's toolchain across 15+ prior deep-seed phases.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x (`"test": "vitest run"` in `package.json`) |
| Config file | none dedicated — Vite's default test config picks up `*.test.js` colocated with source |
| Quick run command | `npm test -- src/lib/buildingImages.test.js src/lib/compass.test.js` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CV-02 | 5 Palm Springs district geofences load, roster/office data correct, address routes to 1 councilmember | integration (DB-level) | orchestrator-run `psql` audit block (mirrors `201-06-PLAN.md` Task 1) — not a vitest test, this is backend/DB data, not frontend logic | ✅ pattern exists (201-06) |
| CV-02 | `getBuildingImages()` still resolves the pre-existing `'palm springs'` CURATED_LOCAL key unchanged | unit | `npx vitest run src/lib/buildingImages.test.js` | ✅ (existing suite; no new test needed — no code change to this file) |
| BANR-01 | `coverage.js` new Palm Springs entry has the correct shape (`label`/`browseGovernmentList`/`browseStateAbbrev`/`hasContext`) | manual/visual (no dedicated coverage.js unit test file found in this repo) | `node scripts/gen-coverage.mjs` (prebuild generator, sanity-checks the array shape) | ⚠️ no dedicated `coverage.test.js` — this repo verifies coverage.js correctness via the prebuild generator + live-browse checkpoint, not a unit test, consistent with every prior phase (193/194/195/201 none added a coverage.js unit test either) |

### Sampling Rate
- **Per task commit:** `npm test -- <touched-file>.test.js` for any frontend file change (only `coverage.js` this phase; no test file exists specifically for it, so this step is effectively `node scripts/gen-coverage.mjs` + `npm run build` sanity)
- **Per wave merge:** `npm run build` (full Vite build, catches `coverage.js`/`buildingImages.js` syntax errors — per `feedback_tailwind_scans_planning_md` neighboring concern, though that rule is about `.planning/*.md` not this file)
- **Phase gate:** Full production DB/CDN audit block (mirrors `201-06-PLAN.md` exactly) + blocking human-verify live-browse checkpoint, both ORCHESTRATOR-RUN (the executor has no DB/Storage/browser access, per every prior phase's established split)

### Wave 0 Gaps
None — existing test infrastructure (Vitest + `buildingImages.test.js`) covers the one frontend-logic surface this phase touches (unchanged), and the DB/CDN audit pattern from Phase 201 is a complete, proven, directly-reusable template for the one new frontend-config surface (`coverage.js`) plus all backend structural/audit assertions.

## Security Domain

> `security_enforcement` not found in `.planning/config.json` — treated as enabled per default.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | This phase has no auth surface — public read-only civic data |
| V3 Session Management | No | N/A |
| V4 Access Control | No | No new access-controlled resource; migrations applied by a trusted operator only, not exposed to any API endpoint |
| V5 Input Validation | Yes (indirect) | The ArcGIS response's `DISTRICT` attribute must be defensively parsed (see Pitfall 2) and range-checked (1-5) before forming a `geo_id`, exactly as every prior loader does — reject any out-of-range value rather than silently accepting it |
| V6 Cryptography | No | No new secrets; existing `SUPABASE_SERVICE_ROLE_KEY` env-var handling unchanged (already established, not touched this phase) |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malformed/self-intersecting geometry from an ArcGIS export | Tampering (data integrity) | `ST_MakeValid` repair fallback (established in every prior loader); reject a load if `ST_IsValid` still fails post-repair |
| Wrong-district / wrong-person data (stale source map, stale roster) | Tampering (data integrity, not security in the traditional sense but the project's own STRIDE registers treat this as a first-class risk) | Cross-verify the FeatureServer's embedded `CouncilName` against independent press sources (KESQ/Palm Springs Post) before writing the structural migration; live-browse human-verify checkpoint at phase close (mirrors Ph201 Task 2) |
| Non-idempotent migration re-application | Tampering | `WHERE NOT EXISTS` / `ON CONFLICT` / `IS DISTINCT FROM` guards on every INSERT/UPDATE, exactly as every prior migration in this codebase |
| Package-install supply-chain risk | Tampering (supply chain) | N/A this phase — zero new package installs |

## Sources

### Primary (HIGH confidence — directly verified via tool this session)
- `Palm_Springs_Voting_Districts_2022_(View)/FeatureServer/0` (ArcGIS REST, `services.arcgis.com/f48yV21HSEYeCYMI`) — queried directly for fields, feature count, geometry validity, and full attribute dump (5 features, DISTRICT 1-5, CouncilName matches Garner/Bernstein/deHarte/Soto/Ready)
- `arcgis.com/sharing/rest/content/items/1a70cef86eb344a68d15547186bcb5a9/data` and the chained web-map/app item lookups — confirmed the 2018 Experience app references a draft/embedded feature collection, not a live service
- `arcgis.com/sharing/rest/content/items/d5a5a0d3eebc4dbdbf73325c3f0d61e1` — confirmed the "Palm Springs Voting Districts" app (owner `PalmSprings_GIS`, modified Jan 2025) as the current maintained resource
- `.planning/phases/201-riverside-county-board-of-supervisors-deep-seed/201-PATTERNS.md`, `201-06-PLAN.md`, `201-06-SUMMARY.md` — read in full; the direct structural/migration/audit template for this phase
- `.planning/milestones/v17.0-phases/156-bellflower-deep-seed/156-02-PLAN.md`, `.planning/milestones/v17.0-phases/152-west-covina-deep-seed/152-02-PLAN.md` — read in full; the Mayor/Mayor-Pro-Tem title-on-seat precedent
- `C:/EV-Accounts/backend/migrations/` directory listing — confirmed disk-MAX migration number (1327 as of 2026-07-12)
- `src/lib/buildingImages.js` (this repo) — confirmed the `'palm springs'` CURATED_LOCAL key is already live (line 436) and `src/lib/coverage.js` COVERAGE_STATES/COVERAGE_COUNTIES structure/insertion pattern

### Secondary (MEDIUM confidence — WebSearch cross-verified with official/press sources)
- KESQ (`kesq.com`) — multiple 2026 articles on the directly-elected-mayor petition/review process (Feb, Apr, Jul 2026), consistently reporting no measure has been adopted yet, most recent public session scheduled July 22, 2026
- thepalmspringspost.com — Naomi Soto's Dec 2025 swearing-in as 28th mayor, David Ready as Mayor Pro Tem
- `mappalmsprings.org` / news coverage of the 2021 redistricting — confirms "Map L" adopted via Ordinance 2060, superseding the 2018 map
- `palmspringsca.gov/government/mayor-city-council` search-snippet term dates — Garner/Bernstein/deHarte all 12/2022-12/2026; Soto/Ready both 12/2024-12/2028 (confirms the D1/D2/D3 vs D4/D5 staggered-election pattern)

### Tertiary (LOW confidence — flagged for validation)
- Ballotpedia's own note that Palm Springs is outside its "100 largest cities" scheduled-coverage scope — implies thinner headshot-source coverage there than in larger prior deep-seed cities; not independently verified beyond the one search snippet

## Metadata

**Confidence breakdown:**
- Standard stack / architecture: HIGH — 100% reuse of already-shipped, already-verified tooling and migration templates from Phases 193/195/201
- Geofence source (ArcGIS endpoint): HIGH — directly queried and confirmed working (5 valid polygons, correct fields) this session, superseding CONTEXT.md's stale pointer
- Roster / mayor model: HIGH — cross-verified via the live GIS layer's embedded attributes AND independent press reporting (KESQ, Palm Springs Post)
- Headshot sourcing: MEDIUM — WAF-403 confirmed, general fallback strategy proven from prior phases, but exact per-member final source is an execute-time task (as it is in every prior phase)
- Banner: HIGH — confirmed already live in `buildingImages.js`, no new sourcing needed

**Research date:** 2026-07-12
**Valid until:** ~14 days for the ArcGIS endpoint/roster (fast-moving: active mayor-selection-process news cycle, and district data could theoretically be touched again); ~30 days for the reused migration/pattern templates (stable, proven across 15+ prior phases)
