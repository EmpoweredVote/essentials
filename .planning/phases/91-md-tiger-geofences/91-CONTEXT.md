# Phase 91: MD TIGER Geofences - Context

**Gathered:** 2026-06-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Load all Maryland TIGER 2024 boundary layers into `geofence_boundaries` with `state='24'` so any MD address routes correctly to city (LOCAL), county (COUNTY), state senate (STATE_UPPER), state house (STATE_LOWER), and congressional (NATIONAL_LOWER) tiers via PostGIS spatial matching.

Layers in scope: G4110 (incorporated cities), G4020 (24 counties), SLDU (47 senate districts), SLDL (141+ house delegate boundaries including A/B sub-districts), CD (8 congressional districts).

This phase is pure infrastructure — no politicians are seeded here. Phase 92+ depends on these boundaries existing.

</domain>

<decisions>
## Implementation Decisions

### Baltimore City — Independent City Handling

- **D-01:** Baltimore City is a Maryland independent city coextensive with a county (analogous to SF in CA). For any Baltimore City address, routing MUST return BOTH a G4110 row (LOCAL tier, city) AND a G4020 row (COUNTY tier, city-as-county). Smoke test must assert both rows for a Baltimore City address.
- **D-02:** Baltimore County (a separate G4020 entity that surrounds Baltimore City but does not include it) is a normal county row. Do not confuse the two — a Baltimore County address should NOT return the G4110 Baltimore City row.

### SLDL Sub-District Boundaries

- **D-03:** Load one `geofence_boundaries` row per letter-district — e.g., 47A and 47B are separate rows, not merged into a single district 47 row. This matches the TIGER file structure and allows Phase 93 to link each delegate to their precise sub-district polygon.
- **D-04:** The researcher must confirm the actual count of SLDL boundary rows in the TIGER file (expected: more than 47 due to A/B sub-districts). The pre-flight assertion must use the confirmed count, not a hardcoded 47.

### COUSUB Layer

- **D-05:** Skip MD G4040 entirely for this phase. MD COUSUB is explicitly out of scope for v11.0. Do not invest research time investigating coverage gaps — if a gap surfaces in production, it goes in v12.0.

### Known Loader Conventions (carry forward from OR/MA)

- **D-06:** `geofence_boundaries.state = '24'` (FIPS as string).
- **D-07:** `districts.state = 'md'` (lowercase) for COUNTY, STATE_UPPER, STATE_LOWER tiers; `districts.state = 'MD'` (uppercase) for NATIONAL_LOWER — same pattern as OR/MA/ME.
- **D-08:** Congressional districts use `cd119` loader key (TIGER 2024 file is `tl_2024_24_cd119.zip`) — confirmed from OR Phase 72 pattern.
- **D-09:** G4110 layer must be dry-run first to confirm actual incorporated city count before live run. OR actual count (241) differed from expected (242); MD count is unknown and must be verified.
- **D-10:** Section split check (0 rows = clean) MUST be run after all layers are loaded — same query used in every prior geofence phase.

### Claude's Discretion

- Specific smoke test addresses (Baltimore City, a rural MD county, Leonardtown/St. Mary's County are good candidates since Phase 95 targets that area)
- Exact MTFCC codes to claim for each layer (follow the established pattern: G4020/G4110/G5200/G5210/G5220)
- Pre-flight assertion structure (follow OR/MA pattern: dry-run count assertions before live load)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and Roadmap
- `.planning/REQUIREMENTS.md` — MD-GEO-01 through MD-GEO-06 requirements with acceptance criteria; MD COUSUB explicitly out of scope
- `.planning/ROADMAP.md` §Phase 91 — Success criteria: Baltimore address returns 5 tiers; rural address returns 4 tiers (no LOCAL gap); section split check = 0 rows; TIGER 2024 count assertions pass

### Location Onboarding Playbook
- `LOCATION-ONBOARDING.md` — Step 3 TIGER loading pattern; section split check query; CA Quick Reference for G4110/G4020 dual-return precedent (SF independent city); OR Quick Reference for cd119 key and dry-run pattern

### Prior Geofence Phase Patterns (read for conventions, not for copy-paste)
- Memory: project_or_geofences_complete.md — OR Phase 72 confirmed values: cd119 key, state='41', dry-run count, districts.state casing, no COUSUB
- Memory: project_ma_geofences_complete.md — MA Phase 38: G4110 = incorporated cities only, state='25', G4040 towns not loaded

### Established Verification Pattern
- `C:/EV-Accounts/backend/scripts/verify-or-tiger-import.sql` — 7-gate SQL verification script from OR phase; adapt for state='24'
- `C:/EV-Accounts/backend/scripts/smoke-or-geofences.ts` — 3-address smoke test from OR phase; adapt addresses for MD

### DB Schema
- `geofence_boundaries` table (Supabase production) — columns: geo_id, name, state, mtfcc, boundary (PostGIS geometry)
- `districts` table (Supabase production) — columns: geo_id, name, state, district_type; state casing differs by tier (see D-07)

</canonical_refs>

<code_context>
## Existing Code Insights

### Established Patterns
- TIGER loader script pattern from OR (Phase 72) and MA (Phase 38): download zip → unzip shapefile → use `shp2pgsql` or equivalent to load into a staging table → INSERT INTO geofence_boundaries from staging
- Dry-run: load to staging table first, count rows, assert against expected; only then INSERT into production table
- `mcp__supabase-local__apply_migration` tool for SQL migrations; `mcp__supabase-local__execute_sql` for verification queries
- Section split check query: `SELECT ... WHERE government_bodies.geo_id NOT IN (SELECT geo_id FROM geofence_boundaries WHERE state='24')` — zero rows expected after all layers loaded

### Integration Points
- Phase 92 (MD State Government DB) depends on G4020 county boundaries existing so government rows can be geo-linked
- Phase 93 (MD Legislature) depends on SLDU (47 senate) + SLDL (141+ delegate) + CD (8 congressional) boundaries for office → district linking
- Phase 95 (Leonardtown / St. Mary's County) depends on the St. Mary's County G4020 boundary
- Phase 96 (MD Elections) depends on all boundaries being routable for address-based election lookup

### No Existing MD Code
- No MD-specific scripts exist in `scripts/` — all TIGER loading was done via SQL migrations and one-off scripts for OR/MA phases. The researcher should follow the same approach.

</code_context>

<specifics>
## Specific Ideas

- Smoke test must include a Baltimore City address (asserts G4110 + G4020 both returned — this is the D-01 invariant).
- Leonardtown, MD (St. Mary's County) is a good smoke test candidate — Phase 95 targets it, so validating routing now catches any county boundary issues early.
- A rural unincorporated MD address (no G4110) should return county + legislative + congressional tiers only — the "3 tiers, no LOCAL" case per the roadmap success criteria.

</specifics>

<deferred>
## Deferred Ideas

- MD COUSUB (G4040 towns) — explicitly out of scope for v11.0; tracked in REQUIREMENTS.md Future Requirements section for v12.0
- MD COUSUB coverage gap analysis — skipped per D-05; revisit if user reports unincorporated address routing gaps after v11.0 ships

</deferred>

---

*Phase: 91-MD TIGER Geofences*
*Context gathered: 2026-06-05*
