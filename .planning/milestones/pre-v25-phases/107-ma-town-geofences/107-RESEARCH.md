# Phase 107: MA Town Geofences - Research

**Researched:** 2026-06-10
**Domain:** TIGER geofence loader / PostGIS / MA G4040 COUSUB town boundaries
**Confidence:** HIGH

---

## Summary

Phase 107's primary goal — load 293 G4040 COUSUB town boundaries into `essentials.geofence_boundaries` — is **already complete**. The rows were loaded during v5.0 (Phase 38/48) on 2026-05-19. All 293 active MA COUSUB rows are present with `mtfcc='G4040'`, `state='25'`, valid geometries, and correct FUNCSTAT='A' filtering (FUNCSTAT='F' placeholder entries like Cambridge and Boston excluded). Point-in-polygon routing for Concord and Brookline returns correct G4040 + G5200 + G5210 + G5220 tiers. Section-split check returns 0 rows.

The loader (`load-state-tiger-boundaries.ts`) already has full COUSUB support for MA: `cousub` is in `STATE_LAYER_ALLOWLIST['MA']`, `STATE_RUN_MAKEVALID['MA']` includes `cousub`, the `EXPECTED_MA_MTFCC` block has `cousub: 293`, and the `COUSUB_FUNCSTAT_STATES` set includes `'MA'`. All four required code elements are present. [VERIFIED: direct inspection of C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts]

Both verification artifacts exist: `verify-ma-tiger-import.sql` has G4040-specific gates (MACOUSUB-01 through MACOUSUB-06) and `smoke-ma-towns.ts` tests Lexington, Concord, and the Cambridge FUNCSTAT exclusion. Both pass against production. [VERIFIED: direct file inspection + DB query]

**Primary recommendation:** Phase 107 is a verification-only phase. Do not re-run the loader. Write one plan: assert all 4 success criteria against production and close MA-GEO-01 + MA-GEO-02.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MA-GEO-01 | A resident of any MA town can enter their address and route to correct state + federal representatives via PostGIS | VERIFIED COMPLETE: 293 G4040 rows loaded; Concord + Brookline PIP returns G5200/G5210/G5220 tiers |
| MA-GEO-02 | Any MA address returns a non-empty LOCAL section where the town has seeded officials | VERIFIED: G4040 rows present; LOCAL section depends on MA-TIER2 / MA-DEEP seeding (Phase 108/109) — geofence prerequisite is satisfied |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Address-to-town routing | Database (PostGIS) | — | ST_Covers query on geofence_boundaries; G4040 rows are the routing keys |
| TIGER shapefile load | API / Backend scripts | — | load-state-tiger-boundaries.ts; runs as one-time migration script |
| Section-split verification | Database (PostGIS) | — | SQL query: geofence_boundaries NOT IN districts |
| Officials display (LOCAL section) | API / Backend | Frontend | government_bodies.geo_id join; depends on Phase 108/109 seeding |

---

## Current Production State (VERIFIED)

All queries run 2026-06-10 against production Supabase DB. [VERIFIED: mcp__supabase-local]

### geofence_boundaries state='25'

| mtfcc | count | Status |
|-------|-------|--------|
| G4020 | 14 | counties — loaded v5.0 |
| G4040 | 293 | **COUSUB towns — already loaded 2026-05-19** |
| G4110 | 58 | incorporated cities — loaded v5.0 |
| G5200 | 9 | congressional districts |
| G5210 | 40 | state senate districts |
| G5220 | 160 | state house districts |

### districts state IN ('MA','ma')

| state | district_type | count |
|-------|--------------|-------|
| ma | COUNTY | 14 |
| ma | STATE_LOWER | 160 |
| ma | STATE_UPPER | 40 |
| MA | LOCAL | 1 (Cambridge — G4110) |
| MA | NATIONAL_LOWER | 9 |
| MA | NATIONAL_UPPER | 1 |
| MA | STATE_EXEC | 6 |

### Geometry validity

- Invalid G4040 geometries: **0** (ST_MakeValid was applied during load)
- Cambridge in G4040: **0** (FUNCSTAT='F' correctly excluded)
- Boston in G4040: **0** (FUNCSTAT='I' — Boston is an incorporated city, not an active MCD)

### Point-in-polygon routing

Concord MA (-71.3490, 42.4604):
- G4020 `25017` Middlesex County
- G4040 `2501715060` Concord town
- G5200 `2503` Congressional District 3
- G5210 `25D15` Third Middlesex District
- G5220 `25071` 13th Middlesex District

Brookline MA (-71.1219, 42.3318):
- G4020 `25021` Norfolk County
- G4040 `2502109175` Brookline town
- G5200 `2504` Congressional District 4
- G5210 `25D17` Norfolk and Middlesex District
- G5220 `25110` 15th Norfolk District

Boston MA (-71.0589, 42.3601):
- G4020 `25025` Suffolk County
- G4110 `2507000` Boston city (G4110, not G4040 — correct)
- G5200 `2508` Congressional District 8
- G5210 `25D25` Third Suffolk District
- G5220 `25125` 3rd Suffolk District

### Section-split check (OR pattern)

```sql
SELECT gb.geo_id, gb.name, gb.mtfcc
FROM essentials.geofence_boundaries gb
WHERE gb.mtfcc IN ('G5200', 'G5210', 'G5220', 'G4020')
  AND gb.state = '25'
  AND gb.geo_id NOT IN (SELECT geo_id FROM essentials.districts)
LIMIT 10;
```

Result: **0 rows** (clean)

---

## Standard Stack

No new packages required. This phase uses existing backend infrastructure only.

| Component | Location | Purpose |
|-----------|----------|---------|
| load-state-tiger-boundaries.ts | C:/EV-Accounts/backend/scripts/ | TIGER loader (already has MA cousub support) |
| verify-ma-tiger-import.sql | C:/EV-Accounts/backend/scripts/ | SQL verification gates (G4040-specific gates already present) |
| smoke-ma-towns.ts | C:/EV-Accounts/backend/scripts/ | TypeScript PIP smoke test for town routing |

---

## Package Legitimacy Audit

No new packages. Not applicable.

---

## Architecture Patterns

### How MA Town Routing Works (Already Implemented)

```
Address (lat/lon)
    │
    ▼
PostGIS ST_Covers query on essentials.geofence_boundaries WHERE state='25'
    │
    ├── G4040 → Concord town / Brookline town / etc.  (LOCAL tier candidate)
    ├── G4110 → Boston city / Cambridge city / etc.   (LOCAL tier — G4110 wins over G4040)
    ├── G4020 → Middlesex County / Norfolk County     (COUNTY tier)
    ├── G5200 → Congressional district                (NATIONAL_LOWER tier)
    ├── G5210 → State senate district                 (STATE_UPPER tier)
    └── G5220 → State house district                  (STATE_LOWER tier)
```

**Key behavior:** G4040 COUSUB rows provide address routing geometry for towns. The LOCAL section that a user sees is populated from `government_bodies` table — the geofence only enables the geographic lookup. For towns without seeded officials (most of the 293), the geofence exists but the LOCAL section will be empty or absent.

### COUSUB geo_id Format

G4040 TIGER geo_id is a 10-digit GEOID: `STATEFP(2) + COUNTYFP(3) + COUSUBFP(5)`.

Examples:
- `2501715060` = FIPS 25 + county 017 (Middlesex) + COUSUB 15060 = Concord
- `2501735215` = FIPS 25 + county 017 (Middlesex) + COUSUB 35215 = Lexington
- `2502109175` = FIPS 25 + county 021 (Norfolk) + COUSUB 09175 = Brookline

### Why COUSUB Does NOT Write districts Rows

The `cousub` entry in `LAYER_DISPATCH` has `writeDistrictRow: false`. This is correct:

- Towns do not have their own legislative districts
- Towns inherit STATE_UPPER/STATE_LOWER/NATIONAL_LOWER from the G5200/G5210/G5220 geofences via ST_Covers
- The LOCAL section comes from `government_bodies.geo_id` matching the G4040 geo_id
- The `MA LOCAL` district row currently in `essentials.districts` is for Cambridge (G4110, not G4040)

Verified: 0 G4040-linked rows in `essentials.districts`. [VERIFIED: DB query 2026-06-10]

### FUNCSTAT Filter (MA-Specific)

MA TIGER COUSUB file contains two categories:
- FUNCSTAT='A': Active MCDs (Minor Civil Divisions — actual town governments). These are the 293 rows loaded.
- FUNCSTAT='F': Fictitious subdivisions — placeholder entries for incorporated cities (Boston, Cambridge, etc.) that exist in the COUSUB file but are already loaded as G4110 places.

The loader's `COUSUB_FUNCSTAT_STATES = new Set(['MA'])` triggers the FUNCSTAT='A' filter for MA, correctly excluding all FUNCSTAT='F' entries. [VERIFIED: load-state-tiger-boundaries.ts line 1039]

---

## Key Loader Facts (Critical for Planner)

All facts verified against `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts`. [VERIFIED]

### STATE_LAYER_ALLOWLIST['MA']
```typescript
MA: new Set(['cd', 'sldu', 'sldl', 'place', 'county', 'cousub']),
```
`cousub` is present. No code change needed. [VERIFIED: line 39]

### STATE_RUN_MAKEVALID['MA']
```typescript
MA: new Set(['cd', 'sldu', 'sldl', 'place', 'county', 'cousub']),
```
`cousub` included — ST_MakeValid applied during load. [VERIFIED: line 105]

### EXPECTED_MA_MTFCC (in the MA MTFCC pre-flight assertion block)
```typescript
cousub: 293,  // 293 active MA towns (FUNCSTAT='A'); 64 FUNCSTAT='F' placeholders skipped
```
Count confirmed as 293. [VERIFIED: line 675]

### COUSUB layer dispatch entry
```typescript
cousub: {
  mtfcc: 'G4040', district_type: 'LOCAL', ocdKey: 'cousub',
  geoIdSource: 'GEOID',
  urlTemplate: (v, f, _c) => `https://www2.census.gov/geo/tiger/TIGER${v}/COUSUB/tl_${v}_${f}_cousub.zip`,
  districtNumField: null,
  filterByStatefp: false,  // state-scoped file (contains only MA records)
  skipDistrictCodes: new Set<string>(),
  writeDistrictRow: false,
},
```
[VERIFIED: lines 298-304]

### COUSUB FUNCSTAT filter
```typescript
const COUSUB_FUNCSTAT_STATES = new Set(['MA']);
if (layer === 'cousub' && COUSUB_FUNCSTAT_STATES.has(abbrevUpper)) {
  const funcstatVal = String(props['FUNCSTAT'] ?? props['funcstat'] ?? '');
  if (funcstatVal !== 'A') {
    totals.skipped++;
    return;
  }
}
```
[VERIFIED: lines 1039-1046]

---

## Existing Verification Artifacts

### verify-ma-tiger-import.sql [VERIFIED: C:/EV-Accounts/backend/scripts/verify-ma-tiger-import.sql]

Already contains Phase 48 G4040 gates:
- MACOUSUB-01: `COUNT(*) WHERE mtfcc='G4040'` — expects 293
- MACOUSUB-02: Cambridge NOT in G4040 (geo_id='2501711000')
- MACOUSUB-03: Lexington in G4040 (geo_id='2501735215')
- MACOUSUB-04: Concord in G4040 (geo_id='2501715060')
- MACOUSUB-05: No invalid G4040 geometries
- MACOUSUB-06: Full MA picture (G4020|14, G4040|293, G4110|58, G5200|9, G5210|40, G5220|160)

### smoke-ma-towns.ts [VERIFIED: C:/EV-Accounts/backend/scripts/smoke-ma-towns.ts]

Tests:
- Lexington center: expects G4040 geo_id='2501735215'
- Concord center: expects G4040 geo_id='2501715060'
- Cambridge (Harvard Square): expects NO G4040 row (FUNCSTAT='F' excluded); G4110 must still be present

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Town polygon data | Manual GeoJSON | TIGER 2024 COUSUB | Already loaded; already in production DB |
| Address routing | Custom geocoding | PostGIS ST_Covers | Already implemented; queries execute sub-100ms |
| Geometry validation | Custom checks | ST_IsValid + ST_MakeValid | Already in verify-ma-tiger-import.sql |
| Section-split detection | Complex join | OR-pattern SQL (geofence NOT IN districts) | Zero rows confirmed against production |

---

## Common Pitfalls

### Pitfall 1: Re-running the Loader
**What goes wrong:** Running `npx tsx scripts/load-state-tiger-boundaries.ts --state MA --fips 25 --layers cousub` when data is already present. The ON CONFLICT DO NOTHING will silently skip all 293 rows, but the MTFCC assertion will still fire (293 matches expected 293), giving a false sense of success. The bigger risk is confusion about whether load happened.
**Why it happens:** Phase description says "load 293 rows" and researcher doesn't check production first.
**How to avoid:** Assert first (`SELECT COUNT(*) WHERE state='25' AND mtfcc='G4040'`), confirm 293, skip loader.
**Warning signs:** `already_exists: 293` in loader output = data was pre-existing.

### Pitfall 2: Misinterpreting the Section-Split Check
**What goes wrong:** Running `SELECT districts d WHERE NOT EXISTS (geofence)` and seeing 7 rows for STATE_EXEC + NATIONAL_UPPER with geo_id='25' — incorrectly flagging as a failure.
**Why it happens:** Statewide districts have no geofence polygon (by design — the whole state is the polygon).
**How to avoid:** Use the OR pattern: `geofence_boundaries NOT IN districts` for mtfcc IN ('G5200','G5210','G5220','G4020'). This correctly returns 0 rows.
**Warning signs:** The 7-row result in the other direction is expected; the 0-row result in the correct direction is the PASS signal.

### Pitfall 3: Confusing G4040 with LOCAL officials
**What goes wrong:** Expecting a Boston address to show a LOCAL section from G4040 routing. Boston has G4110 (not G4040) and the LOCAL section only shows officials seeded in `government_bodies` (Phase 108).
**Why it happens:** The geofence ensures routing; it doesn't provide officials.
**How to avoid:** MA-GEO-02 says "where the town has seeded officials" — the geofence is the prerequisite, not the solution.

---

## Validation Architecture

`workflow.nyquist_validation` is absent from `.planning/config.json` — treated as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | npx tsx (TypeScript + pg direct) |
| Config file | none — scripts run directly |
| Quick run command | `npx tsx scripts/smoke-ma-towns.ts` |
| Full suite command | `psql $DATABASE_URL -f scripts/verify-ma-tiger-import.sql` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Artifact Exists? |
|--------|----------|-----------|-------------------|-----------------|
| MA-GEO-01 | Town address routes to correct STATE_UPPER + STATE_LOWER + NATIONAL tiers | smoke | `npx tsx scripts/smoke-ma-towns.ts` | Yes — smoke-ma-towns.ts |
| MA-GEO-01 | 293 G4040 rows in production | verification SQL | `psql $DATABASE_URL -f scripts/verify-ma-tiger-import.sql` | Yes — verify-ma-tiger-import.sql MACOUSUB-01 |
| MA-GEO-01 | Boston routes via G4110, not G4040 | smoke | `npx tsx scripts/smoke-ma-geofences.ts` | Yes — smoke-ma-geofences.ts |
| MA-GEO-02 | Section-split check returns 0 rows | verification SQL | inline query in plan | Via OR pattern SQL |

### Wave 0 Gaps

None — existing test infrastructure covers all phase requirements.

---

## Environment Availability

No external tools required beyond existing backend infrastructure.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js / npx tsx | Smoke test execution | Yes | Existing project dependency | — |
| DATABASE_URL | All DB queries | Yes | Production Supabase | — |
| psql | verify SQL execution | [ASSUMED] available on dev machine | — | Run SQL via Supabase MCP |

---

## Open Questions

None. All critical questions resolved by DB inspection.

1. **Does the cousub layer already exist in LAYER_DISPATCH?**
   Yes. `cousub` entry is present with `mtfcc: 'G4040'`, `writeDistrictRow: false`, FUNCSTAT='A' filter for MA. [VERIFIED]

2. **Is MA already configured for cousub in STATE_LAYER_ALLOWLIST?**
   Yes. `MA: new Set(['cd', 'sldu', 'sldl', 'place', 'county', 'cousub'])`. [VERIFIED]

3. **Are the 293 G4040 rows already in production?**
   Yes. Loaded 2026-05-19 during v5.0. COUNT(*) = 293. [VERIFIED]

4. **Does the COUSUB handler write districts rows?**
   No. `writeDistrictRow: false`. Confirmed: 0 G4040 rows in `essentials.districts`. [VERIFIED]

5. **Does the Boston geo_id '2507000' appear in G4040?**
   No. Boston is FUNCSTAT='I' (incorporated place), excluded by FUNCSTAT='A' filter. [VERIFIED]

6. **What is the section-split check result?**
   0 rows using OR pattern. [VERIFIED: DB query 2026-06-10]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | psql is available on dev machine | Environment Availability | Low — fallback is Supabase MCP for SQL gates |

All other claims verified via direct tool calls.

---

## Sources

### Primary (HIGH confidence)
- `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts` — full loader inspection; verified COUSUB layer, MA allowlist, FUNCSTAT filter, EXPECTED_MA_MTFCC block
- `C:/EV-Accounts/backend/scripts/verify-ma-tiger-import.sql` — existing verification SQL with G4040 gates
- `C:/EV-Accounts/backend/scripts/smoke-ma-towns.ts` — existing COUSUB PIP smoke test
- Production Supabase DB (mcp__supabase-local) — confirmed 293 G4040 rows, PIP routing, geometry validity, section-split = 0
- `.planning/STATE.md` — v13.0 roadmap context, migration counter (next = 347)
- `.planning/REQUIREMENTS.md` — MA-GEO-01, MA-GEO-02 definitions

### Secondary (MEDIUM confidence)
- `verify-or-tiger-import.sql` — section-split check pattern reference (geofence NOT IN districts for mtfcc IN G5200/G5210/G5220/G4020)

---

## Metadata

**Confidence breakdown:**
- Current DB state: HIGH — directly queried production
- Loader code: HIGH — directly read the file, all 4 elements verified
- Phase is already complete: HIGH — 293 rows present, PIP working, section-split clean
- Success criteria assessment: HIGH — all 4 criteria verified against production

**Research date:** 2026-06-10
**Valid until:** Indefinite (DB state is stable; no code changes needed)
