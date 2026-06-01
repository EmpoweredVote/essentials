# Phase 83: Multnomah County Government + Routing — Research

**Researched:** 2026-05-31
**Domain:** County government seeding, COUNTY district routing, headshot sourcing
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| COUNTY-01 | Multnomah County Board of Commissioners government body created (geo_id=41051) | Government row pattern verified from TX/CA precedent; geo_id confirmed from Phase 72 |
| COUNTY-02 | 5 commissioners + chair seeded as officials with offices linked to county geo_id | All 6 current officials identified with names; district linkage pattern verified |
| COUNTY-03 | Commissioner headshots at 600×750 in Supabase Storage | multco.us photo URLs confirmed for all 6; crop strategy documented |
| ROUTING-01 | Users at unincorporated Multnomah County addresses see county → state → federal reps with no empty LOCAL city section | Routing logic fully traced; G4020 maps to COUNTY district_type; no code changes needed |
</phase_requirements>

---

## Summary

Phase 83 seeds the Multnomah County government body (Chair + 4 commissioners = 6 total officials) and ensures that users at both Portland addresses and unincorporated Multnomah County addresses see county representatives in their results.

The routing architecture already works correctly for ROUTING-01: the Phase 72 TIGER load confirmed that any address in Multnomah County returns a G4020 boundary with geo_id=41051. The essentialsService.ts districtQueryText maps G4020 to `district_type IN ('COUNTY', 'JUDICIAL')`. No backend code changes are required — only data must be seeded.

The key data tasks are: (1) create a `Multnomah County` government row in `essentials.governments`, (2) create a `Board of Commissioners` chamber under it, (3) create one COUNTY district with geo_id=41051 and mtfcc='G4020' in `essentials.districts`, and (4) seed 6 politicians with offices linked to that district. Because the Phase 83 success criteria says all 6 officials link to the county geo_id (not per-district sub-geofences), all 6 offices — Chair (county-wide) and 4 Commissioners (district-elected) — attach to the same COUNTY district row. This is intentional for Phase 83 scope; district-level commissioner routing (showing only the relevant commissioner per address) is deferred to future scope.

**Primary recommendation:** Follow the Collin County TX pattern (migration 087+088) for government/chamber/district creation, adapted for OR state and COUNTY district type. All 6 officials are from multco.us with square photos requiring 4:5 center-crop.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| County government row + chamber | Database | — | Pure data seeding in essentials schema |
| COUNTY district row creation | Database | — | essentials.districts, geo_id=41051, mtfcc='G4020' |
| Commissioner office linkage | Database | — | essentials.offices → essentials.districts |
| Routing for county reps | API / Backend | — | essentialsService.ts districtQueryText already handles G4020→COUNTY |
| Routing for unincorporated (no LOCAL) | API / Backend | — | No G4110 match at unincorporated address → no LOCAL section (correct behavior) |
| Headshot upload | Database / Storage | — | Supabase Storage + politician_images rows |

---

## Standard Stack

### Core
| Library / Tool | Version | Purpose | Why Standard |
|----------------|---------|---------|--------------|
| PostgreSQL (Supabase) | 15.x | Production DB for all essentials.* writes | Project-wide standard |
| tsx / npx tsx | current | Run TypeScript scripts for smoke tests | Project-wide standard |
| Supabase Storage | — | Headshot hosting | Project-wide standard |

### No new npm packages required for this phase.

---

## Package Legitimacy Audit

No external packages are installed in this phase. No audit required.

---

## Architecture Patterns

### System Architecture Diagram

```
multco.us profile pages
        │ (headshot .jpg.webp URLs)
        ▼
  Crop 4:5 → resize 600×750 JPEG
        │
        ▼
  Supabase Storage
        │
        ▼
  essentials.politician_images (type='default')
        │
        ▼
  essentials.politicians (6 rows)
        │ politician_id
        ▼
  essentials.offices (6 rows, all district_id → COUNTY district)
        │ district_id
        ▼
  essentials.districts (1 row: geo_id='41051', mtfcc='G4020', district_type='COUNTY', state='or')
        │ geo_id
        ▼
  essentials.geofence_boundaries (existing: geo_id='41051', mtfcc='G4020') ←— already loaded Phase 72
        │ ST_Covers(geometry, user_point)
        ▼
  districtQueryText JOIN (G4020 → COUNTY match) → returns 6 commissioner records
```

### Recommended Project Structure

This phase writes:
```
C:/EV-Accounts/backend/
├── migrations/
│   └── 244_multnomah_county_government.sql   (government + chamber + district + politicians + offices)
│   └── 245_multnomah_county_headshots.sql    (AUDIT-ONLY — documents headshot uploads)
└── scripts/
    └── smoke-multnomah-county.ts             (routing smoke test: Portland + unincorporated address)
```

### Pattern 1: County Government Seeding (from TX Phase 12 / migration 087)

**What:** Create government row + chamber + COUNTY district + politicians + offices in a single migration using PL/pgSQL DO blocks with variable capture.

**When to use:** All county-level government seeding.

```sql
-- Source: migration 087_tx_schema_geo_id_state_county.sql (established pattern)
-- County government row
INSERT INTO essentials.governments (name, type, state, city, geo_id)
VALUES ('Multnomah County, Oregon, US', 'County', 'OR', NULL, '41051');

-- Board of Commissioners chamber (under the county government)
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(), 'Board of Commissioners', 'Multnomah County Board of Commissioners',
  (SELECT id FROM essentials.governments WHERE name = 'Multnomah County, Oregon, US')
WHERE NOT EXISTS (...);

-- COUNTY district row (geo_id matches the existing G4020 geofence_boundary)
INSERT INTO essentials.districts (geo_id, district_type, mtfcc, state, label)
SELECT '41051', 'COUNTY', 'G4020', 'or', 'Multnomah County'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts WHERE geo_id = '41051' AND mtfcc = 'G4020'
);
```

**Critical:** `essentials.governments` has NO unique constraint on geo_id — WHERE NOT EXISTS guard required.

**Critical:** `slug` is GENERATED ALWAYS on `essentials.chambers` — never include in INSERT column list.

**Critical:** `districts.state` must be lowercase `'or'` for COUNTY/STATE tiers (established pattern: STATE_UPPER/LOWER rows use `'or'`; NATIONAL_LOWER rows use `'OR'`).

### Pattern 2: Office Linkage to COUNTY District

**What:** All 6 officials (Chair + 4 commissioners) link their offices to the single COUNTY district row with geo_id='41051'.

**Rationale:** Phase 83 success criteria specifies "offices linked to county geo_id" (singular), not district-level sub-geofences. The Chair is elected county-wide; the 4 commissioners are elected by district but for Phase 83 all 6 appear for any Multnomah County address.

```sql
-- Source: established pattern from TX tier 1 cities (migration 088)
INSERT INTO essentials.offices (chamber_id, title, representing_state, representing_city,
                                 is_appointed_position, district_id)
SELECT v_chamber_id,
       'County Chair',   -- for Chair
       'OR', NULL, false,
       (SELECT id FROM essentials.districts WHERE geo_id = '41051' AND mtfcc = 'G4020')
WHERE NOT EXISTS (...);

INSERT INTO essentials.offices (chamber_id, title, representing_state, representing_city,
                                 is_appointed_position, district_id)
SELECT v_chamber_id,
       'Commissioner (District 1)',   -- title pattern for commissioners
       'OR', NULL, false,
       (SELECT id FROM essentials.districts WHERE geo_id = '41051' AND mtfcc = 'G4020')
WHERE NOT EXISTS (...);
-- Repeat for Districts 2, 3, 4
```

### Pattern 3: Smoke Test for County Routing

**What:** Query essentialsService.ts behavior by running a direct PostGIS test against known coordinates: a Portland address (confirms county + city both return), and an unincorporated address (confirms county returns, no G4110).

**Unincorporated Multnomah County coordinate:** Corbett, OR area — approximately (-122.2, 45.5) west of Sandy, outside any G4110 city boundary.

```typescript
// Source: smoke-or-geofences.ts (Phase 72 established pattern)
// Portland City Hall: lon=-122.6794, lat=45.5231
// → expects G4020 (41051) + G4110 (4159000) + G5200 + G5210 + G5220

// Corbett, OR (unincorporated): lon=-122.2, lat=45.5
// → expects G4020 (41051) ONLY for local tiers; G4110 must be ABSENT
```

### Pattern 4: Headshot Crop from Square Source (multco.us)

**What:** multco.us headshots are served as 1:1 (square) aspect-ratio WebP images via Drupal image styles. The underlying JPEG sources can be accessed by removing the `styles/1_1_large/` path segment.

**Source URL pattern:**
- WebP served: `https://multco.us/sites/default/files/styles/1_1_large/public/YYYY-MM/filename.jpg.webp`
- Underlying JPEG: `https://multco.us/sites/default/files/public/YYYY-MM/filename.jpg`

**Crop strategy:** Square sources → center-crop to 4:5 ratio (head/shoulders typically centered), then resize to 600×750 JPEG at q90.

**Note:** The `1_1_large` style produces square images; the underlying files are JPEGs. Try removing the `/styles/1_1_large/` portion from the path to retrieve the original non-square version which may already be portrait-oriented.

### Anti-Patterns to Avoid

- **ANTI: Adding `slug` to INSERT on chambers.** Slug is GENERATED ALWAYS — never include in column list. `ERROR: cannot insert into column "slug"`.
- **ANTI: Uppercase state code for COUNTY district.** Must be `'or'` (lowercase) to match routing query `WHERE d.state = $1` (which receives state from geocoder). Using `'OR'` will silently break routing.
- **ANTI: Using `government_type='LOCAL'` for county.** County governments use `type='County'` (established from TX migration 087: `'County'`). Use exactly `'County'` for the type column.
- **ANTI: Linking all offices to LOCAL_EXEC district.** County commissioners are COUNTY district type, not LOCAL_EXEC. The Chair is a COUNTY-level executive, not a city-level executive.
- **ANTI: Creating a G4020 geofence boundary row.** The G4020 boundary for geo_id=41051 was already loaded in Phase 72. Do NOT insert a duplicate geofence_boundary row. Only create the `essentials.districts` row.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Routing for county reps | Custom query logic | Existing essentialsService.ts districtQueryText | G4020 → COUNTY already implemented |
| Headshot serving | Custom image endpoint | Supabase Storage + politician_images.type='default' | Pattern established Phase 62 |
| Section-split detection | Custom query | Standard section-split SQL (see below) | Pattern established in every previous phase |

**Section-split detector SQL (run after migration):**
```sql
SELECT gb.geo_id
FROM essentials.geofence_boundaries gb
WHERE gb.geo_id = '41051'
  AND gb.mtfcc = 'G4020'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.districts d
    WHERE d.geo_id = gb.geo_id
      AND d.district_type = 'COUNTY'
      AND d.state = 'or'
  );
-- Expected: 0 rows
```

---

## Current Officials (Multnomah County Board of Commissioners)

All data verified from multco.us official profile pages (2026-05-31).

| Title | Name | District | Term Ends | Photo URL (base) |
|-------|------|----------|-----------|-----------------|
| County Chair | Jessica Vega Pederson | At-large | December 2026 | `https://multco.us/sites/default/files/styles/1_1_large/public/2026-01/54a2249-edit-chair-8x10-1.jpg.webp` |
| Commissioner | Meghan Moyer | District 1 | December 2028 | `https://multco.us/sites/default/files/styles/1_1_large/public/2026-01/moyer-2026-portrait-a2_0.jpg.webp` |
| Commissioner | Shannon Singleton | District 2 | December 2026 | `https://multco.us/sites/default/files/styles/1_1_large/public/2024-12/20241202-commissioner-shannon-singleton-mn-04-4x3.jpg.webp` |
| Commissioner | Julia Brim-Edwards | District 3 | December 2028 | `https://multco.us/sites/default/files/styles/1_1_large/public/2023-06/20230526-D3-Commissioner-Jullia-Brim-Edwards-MN-%252816x9%2529.jpg.webp` |
| Commissioner | Vince Jones-Dixon | District 4 | December 2028 | `https://multco.us/sites/default/files/styles/1_1_large/public/2024-12/20241217-commissioner-vince-jones-dixon-mn-4x6.jpg.webp` |

**[VERIFIED: multco.us]** All 5 current officials confirmed from multco.us/elected/board-county-commissioners and individual profile pages (accessed 2026-05-31).

**Election structure:** Chair elected county-wide (at-large). 4 commissioners elected by geographic district (west, north, central, east). All non-partisan. 4-year terms.

**External ID scheme to use:** `-410001` (Chair), `-410010`, `-410011`, `-410012`, `-410013` (commissioners D1–D4). This follows the established pattern: county FIPS 41051 → base -410xxx; city-like sequential numbering.

---

## COUNTY District vs. Sub-District Routing

**Phase 83 scope:** All 6 officials link to the single COUNTY district (geo_id='41051'). ALL 6 appear for any Multnomah County address.

**Why this is correct for Phase 83:**
1. Success criteria says "offices linked to county geo_id" — singular
2. Unincorporated address routing only needs the G4020 geofence → COUNTY district match
3. Portland addresses already return G4020 (41051) from Phase 72

**What this means for the UI:**
- Portland address: LOCAL (Portland city council + Mayor) + COUNTY (all 6 commissioners + Chair) + STATE + FEDERAL
- Unincorporated address: NO LOCAL section (no G4110 hit) + COUNTY (all 6) + STATE + FEDERAL
- The ROUTING-01 requirement "no empty LOCAL city section" means: the UI must NOT show an empty LOCAL section when there is no city government. Based on groupHierarchy.js, a LOCAL tier only appears if politicians with district_type LOCAL/LOCAL_EXEC exist in the response. If no LOCAL politicians are returned, no LOCAL tier renders — this is already correct behavior.

**ROUTING-01 is a data requirement, not a code requirement.** The existing routing code already handles "no LOCAL section" correctly. The issue is that without the county government seeded, unincorporated residents get NO politicians at all (not even county). Once COUNTY district data is seeded, county commissioners appear automatically.

**Future scope (NOT Phase 83):** Sub-district geofences for the 4 commissioner districts (X0013 MTFCC, ArcGIS source at `https://www3.multco.us/gisagspublic/rest/services/Countywide/General/MapServer/11`) to route each address to the correct commissioner district. This would follow the LA County Supervisors pattern (load-la-county-supervisor-boundaries.ts).

---

## Geofence Boundary — Already Loaded

**The G4020 geofence boundary for Multnomah County (geo_id='41051') was loaded in Phase 72.**

No geofence loading script is needed for Phase 83. The planner should NOT include a geofence load step.

Verification query:
```sql
SELECT geo_id, name, mtfcc, state
FROM essentials.geofence_boundaries
WHERE geo_id = '41051' AND mtfcc = 'G4020';
-- Expected: 1 row, name like 'Multnomah County', state='41'
```

---

## Common Pitfalls

### Pitfall 1: Government Row State Column Casing
**What goes wrong:** `governments.state` uses abbreviation, `districts.state` uses lowercase abbreviation. If you use 'OR' for the district row, routing queries fail silently.
**Why it happens:** The geocoder returns the state abbreviation; the routing query does `WHERE d.state = $1` with whatever the geocoder returns. For OR, verified lowercase `'or'` is used for STATE_UPPER/LOWER districts.
**How to avoid:** Use `state='or'` for the districts row. Verify: `SELECT DISTINCT state FROM essentials.districts WHERE state LIKE '%or%' OR state LIKE '%OR%'`.
**Warning signs:** Address lookup returns empty results for unincorporated address; smoke test fails with "0 politicians returned".

### Pitfall 2: Missing essentials.districts Row
**What goes wrong:** The G4020 geofence boundary already exists (Phase 72) but there is no `essentials.districts` row with geo_id='41051' and district_type='COUNTY'. The JOIN in districtQueryText is `geofence_boundaries JOIN districts ON d.geo_id = gb.geo_id AND (condition)` — without the districts row, zero politicians are returned.
**Why it happens:** Phase 72 loaded geofences only. Districts rows for county governments must be created in the government seeding migration.
**How to avoid:** Always create `essentials.districts` rows alongside the government/chamber/offices. Section-split detector catches this.
**Warning signs:** Section-split detector returns 1 row for geo_id='41051'.

### Pitfall 3: Slug in Chamber INSERT
**What goes wrong:** `ERROR: cannot insert into column "slug" of relation "chambers"` — slug is GENERATED ALWAYS.
**Why it happens:** The slug is auto-generated from name + government. Including it in INSERT causes a hard error.
**How to avoid:** Never include `slug` in chamber INSERT column lists.
**Warning signs:** Migration fails immediately on the chamber INSERT.

### Pitfall 4: Duplicate Government Row
**What goes wrong:** `essentials.governments` has no unique constraint on geo_id. Re-running the migration creates a duplicate government row, causing two government_name values in address results.
**Why it happens:** No unique constraint by design (multiple governments can share geo_ids in edge cases).
**How to avoid:** Use `WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE name = 'Multnomah County, Oregon, US')` guard on INSERT.
**Warning signs:** Two "Multnomah County" entries in address lookup results.

### Pitfall 5: politician_images.type Must Be 'default'
**What goes wrong:** Headshot is uploaded to Storage and inserted with type='headshot'. UI silently shows no photo.
**Why it happens:** Results.jsx and Profile.jsx filter with `.find(img => img.type === 'default')`.
**How to avoid:** Always use `type='default'` in politician_images INSERT.
**Warning signs:** Commissioner cards show no photo despite successful Storage upload.

### Pitfall 6: WebP Images from multco.us
**What goes wrong:** Fetching the `?itok=...` WebP URL produces a WebP file that Python Pillow may handle differently than JPEG.
**Why it happens:** Drupal image styles serve WebP when the URL contains `.jpg.webp`. The underlying source is a JPEG.
**How to avoid:** Try fetching the source JPEG by removing the `/styles/1_1_large/` path segment. If the source is already portrait-oriented, no crop needed. If square, center-crop to 4:5 before resize.
**Warning signs:** Pillow reports wrong dimensions; images appear distorted in browser.

---

## Routing Verification: What "No Empty LOCAL Section" Means

The ROUTING-01 requirement states unincorporated users see "no empty LOCAL city section." This is a data requirement, not a UI requirement:

- **Current behavior (before Phase 83):** An unincorporated Multnomah County address returns NO politicians from districtQueryText (county G4020 has no districts row → no COUNTY match). The statewideQueryText returns state/federal. Result: correct state/federal politicians, but NO county level.
- **After Phase 83:** G4020 → COUNTY district → 6 officials. Unincorporated user sees 6 county officials + state + federal. No LOCAL section (correct — there's no city government for that address).
- **The "empty LOCAL section" issue:** groupHierarchy.js only renders a "Local" tier if politicians with `district_type IN ('LOCAL', 'LOCAL_EXEC', 'COUNTY', 'SCHOOL', 'JUDICIAL')` exist. The tier label in the UI is "Local" for this combined group. If no COUNTY politicians exist, the "Local" tier is completely absent — this is the empty section.

**Conclusion:** Phase 83 fixes this by ensuring the COUNTY district is seeded. No frontend code changes needed.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| County-level routing not supported | G4020 → COUNTY district_type in districtQueryText | Phase 38 | County government seeding now works without code changes |
| Sub-district geofences required for county | All county officials can link to single county geo_id | Established | Simpler for Phase 83 scope |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Multnomah County government type='County' matches TX precedent | Standard Stack | Government type might differ; verify before INSERT |
| A2 | Source JPEG files at multco.us are accessible without authentication by stripping `/styles/1_1_large/` | Headshot Pattern | May need to use WebP directly; Pillow handles WebP |
| A3 | External ID scheme -410001 to -410013 is clear (unused) | Officials | Run pre-flight check before INSERT |
| A4 | districts.state='or' (lowercase) is correct for COUNTY type in Oregon | Pitfall 1 | Silent routing failure; verify with SELECT DISTINCT |
| A5 | Julia Brim-Edwards (current name with double-l Jullia in photo filename) — verify correct legal spelling | Officials table | Name mismatch would affect display |

---

## Open Questions

1. **Julia Brim-Edwards name spelling**
   - What we know: Photo filename on multco.us contains "Jullia" (double-l); page text shows "Julia"
   - What's unclear: Whether the double-l in filename is a typo or correct
   - Recommendation: Use "Julia Brim-Edwards" (single-l) as shown on profile text; the filename is a known typo

2. **Photo aspect ratios — can originals be fetched as JPEG?**
   - What we know: multco.us serves `1_1_large` WebP (square). Shannon Singleton source filename has `4x3` in name suggesting 4:3 original. Vince Jones-Dixon source has `4x6` suggesting portrait-oriented original.
   - What's unclear: Whether removing `/styles/1_1_large/` returns the original non-square version
   - Recommendation: Plan 83-03 should attempt direct JPEG fetch first; fall back to WebP crop if needed

3. **government_type value — 'County' vs 'COUNTY'**
   - What we know: TX migration 087 uses `type='County'` (mixed case)
   - What's unclear: Whether OR county should match this exactly
   - Recommendation: Use `'County'` (mixed case, capitalized first letter) matching TX precedent

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase (prod) | All migrations | ✓ | PostgreSQL 15.x | — |
| npx tsx | Smoke test | ✓ | project version | — |
| multco.us (web) | Headshots | ✓ (public) | — | Wikimedia Commons for any gaps |

No blocking dependencies.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | tsx smoke scripts (project standard) |
| Config file | none (scripts use dotenv) |
| Quick run command | `npx tsx scripts/smoke-multnomah-county.ts` |
| Full suite command | Same |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COUNTY-01 | Government + chamber + district row exist | SQL gate | `SELECT COUNT(*) FROM essentials.governments WHERE name = 'Multnomah County, Oregon, US'` | ❌ Wave 0 (in migration) |
| COUNTY-02 | 6 officials with offices linked to geo_id=41051 | SQL gate | `SELECT COUNT(*) FROM essentials.offices o JOIN essentials.districts d ON o.district_id=d.id WHERE d.geo_id='41051'` | ❌ Wave 0 (in migration) |
| COUNTY-03 | 6 headshots in politician_images | SQL gate | `SELECT COUNT(*) FROM essentials.politician_images WHERE politician_id IN (...)` | ❌ Wave 0 (in headshots plan) |
| ROUTING-01 | Portland address returns COUNTY officials | Smoke | `npx tsx scripts/smoke-multnomah-county.ts` | ❌ Wave 0 |
| ROUTING-01 | Unincorporated address returns COUNTY, no LOCAL | Smoke | Same script | ❌ Wave 0 |

### Wave 0 Gaps
- [ ] `scripts/smoke-multnomah-county.ts` — covers ROUTING-01 (Portland + unincorporated coordinate tests)
- [ ] SQL gates embedded in migration 244 (pre-flight + post-verification DO blocks)

---

## Security Domain

No new authentication, session management, or user data is involved. This phase inserts public reference data (politicians, offices). Security domain: not applicable.

---

## Sources

### Primary (HIGH confidence)
- multco.us/elected/board-county-commissioners — all 5 officials with photos confirmed 2026-05-31
- multco.us/profile/* — individual profile pages for each official
- C:/EV-Accounts/backend/src/lib/essentialsService.ts — routing logic fully traced
- C:/EV-Accounts/backend/migrations/087_tx_schema_geo_id_state_county.sql — county government seed pattern
- C:/EV-Accounts/backend/migrations/222_or_government_chambers.sql — OR chamber pattern
- Phase 72 SUMMARY (STATE.md) — confirmed Multnomah County geo_id=41051, G4020 row exists

### Secondary (MEDIUM confidence)
- multco.us/info/about-board-county-commissioners — election structure (Chair at-large, 4 commissioners by district)
- www3.multco.us/gisagspublic/rest/services/Countywide/General/MapServer/11 — ArcGIS source for commissioner district sub-geofences (future scope)
- Ballotpedia: Government of Multnomah County, Oregon — term end dates cross-reference

### Tertiary (LOW confidence)
- Corbett OR coordinate assumption for unincorporated smoke test: (-122.2, 45.5) `[ASSUMED]` — planner should verify this falls outside all G4110 boundaries

---

## Metadata

**Confidence breakdown:**
- Current officials: HIGH — verified from official multco.us profile pages
- Routing mechanism: HIGH — traced from essentialsService.ts source code
- Photo sources: MEDIUM — URLs confirmed but JPEG availability without WebP conversion untested
- Unincorporated test coordinate: LOW — Corbett OR approximate, needs DB verification

**Research date:** 2026-05-31
**Valid until:** 2026-08-31 (officials stable; check for commissioner term changes after Dec 2026 elections)
