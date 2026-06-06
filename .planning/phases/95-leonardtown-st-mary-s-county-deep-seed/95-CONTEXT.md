# Phase 95: Leonardtown / St. Mary's County Deep Seed - Context

**Gathered:** 2026-06-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Seed St. Mary's County government (Board of County Commissioners) and the Town of Leonardtown government into the DB, with elected officials, offices, and available headshots, so a St. Mary's County address lookup returns the correct local officials without empty-section errors.

Scope:
- St. Mary's County: government row + Board of County Commissioners chamber + district(s) + active commissioners + office rows
- Town of Leonardtown: government row + Town Council chamber + district(s) + active Mayor + Council members + office rows
- Headshots for all officials where an official government website photo exists
- Verification query confirming correct address routing

Out of scope:
- MD geofence loading (done in Phase 91 — G4020 St. Mary's geo_id='24037' already present; G4110 Leonardtown place boundary already present)
- Appointed/administrative staff (County Administrator, Town Manager)
- Compass stances (Phase 97)
- Elections data (Phase 96)

</domain>

<decisions>
## Implementation Decisions

### Officials Scope

- **D-01:** Seed elected officials only — the public's directly-voted representatives. No County Administrator, Town Manager, or other appointed staff. Consistent with Multnomah County, OR precedent and the project's democratic-accountability design.

### Plan Structure

- **D-02:** Two plans:
  - **Plan 95-01:** Both government seedings — St. Mary's County AND Leonardtown in one plan (two migrations: one per government). Total scope is small (~10-12 officials across both governments).
  - **Plan 95-02:** Headshots + verification — Python script to source/process/upload photos for all available officials; DB gap-check query; UI spot-check of 3+ profile pages.

### Headshot Fallback

- **D-03:** Official government website is the sole source. If no photo is found on stmaryscountymd.gov / Leonardtown's official site, document the gap and move on — no LinkedIn, news articles, or social media. Consistent with Collin County Tier 3-4 gap documentation pattern.
- **D-04:** Headshots processed at 600×750 (4:5, Lanczos, q90) — crop first, then resize (never stretch). Stored in `politician_photos` bucket at `{politician_id}-headshot.jpg`.

### County Board Model — Researcher to Confirm

- **D-05 (open — researcher resolves):** The St. Mary's County Board of County Commissioners has 5 seats (President + 4 Commissioners). The election model is not confirmed. Researcher must check stmaryscountymd.gov before writing migrations. The three possible SQL patterns are:

  **Option A — All at-large (single COUNTY district, 5 offices):**
  All 5 commissioners are elected county-wide. One `COUNTY` district row with `geo_id='24037'`. Five `offices` rows all pointing to the same district. Title format: `'President, Board of County Commissioners'` + `'Commissioner'`.

  **Option B — All by geographic district (5 individual district rows):**
  Each commissioner represents a geographic sub-county district. Requires 5 district rows (different geo_ids from geofence_boundaries) OR 5 offices pointing to sub-district boundaries. Follow Multnomah County D1-D4 pattern extended to 5.

  **Option C — Mixed (President at-large + 4 by district):**
  President elected county-wide (uses COUNTY district); 4 commissioners each from a geographic district. Hybrid approach — 5 district rows total.

  **Most likely:** MD county commissioners are typically elected at-large from the whole county (Option A). Researcher should confirm before writing the migration.

### Claude's Discretion

- External ID range for St. Mary's County officials: Use `-24037001` through `-24037009` (follows `-{FIPS_code}{seq}` pattern; MD county FIPS for St. Mary's is 037, full FIPS 24037).
- External ID range for Leonardtown officials: Use `-2443701` through `-2443709` (Census place FIPS ~43700 → geo_id likely '2443700'; confirm via DB query).
- Migration numbering: start from 276 (confirm by listing `C:/EV-Accounts/backend/migrations/` before writing).
- Post-verification DO block pattern: include in each migration (gates: government row count, offices count, section-split detector). Follow migration 244 (Multnomah County) as the template.
- Leonardtown geo_id: researcher should run `SELECT geo_id FROM essentials.geofence_boundaries WHERE state='24' AND mtfcc='G4110' AND name ILIKE '%leonardtown%'` to confirm the exact geo_id before writing the migration.
- Headshot script name: `md_local_headshots.py` (covers both county and town in one script).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and Roadmap
- `.planning/REQUIREMENTS.md` — MD-DEEP-01 (St. Mary's County government + commissioners chamber + county boundary linked), MD-DEEP-02 (commissioners seeded with headshots), MD-DEEP-03 (Leonardtown government + officials + headshots); Phase 95 success criteria
- `.planning/ROADMAP.md` §Phase 95 — 4 success criteria (county gov row + chamber, commissioners with headshots, Leonardtown with headshots, address lookup works)

### Closest Migration Templates
- `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql` — CLOSEST template for county government seeding; shows government row → chamber → COUNTY district → 5 politicians + offices → office_id back-fill → post-verification DO block. Use this structure for St. Mary's County.
- `C:/EV-Accounts/backend/migrations/269_md_government_chambers.sql` — MD government row pattern (confirms `state='MD'` uppercase, `type='County'` for MD counties); check for any MD-specific casing decisions.

### Headshot Script Templates
- `scripts/md_executives_headshots.py` — Template for headshot script: Supabase REST upload, Pillow processing (crop 4:5 → resize 600×750 Lanczos q90), psycopg2 DB insert, idempotent NOT EXISTS check
- `scripts/md_senators_headshots.py` — Shows external_id range query pattern to get politician UUIDs dynamically

### DB Schema Constraints (critical)
- `essentials.chambers` — `slug` is GENERATED ALWAYS — never include in INSERT column list
- `essentials.governments` — NO unique constraint on `geo_id` — WHERE NOT EXISTS guard required on every INSERT
- `essentials.districts` — `state='md'` (lowercase) for COUNTY/LOCAL district types; `state='MD'` (uppercase) for NATIONAL_LOWER only
- `essentials.politician_images` — `type='default'` (not 'headshot'); UI filters with `.find(img => img.type === 'default')`; bucket: `politician_photos`; path: `{politician_id}-headshot.jpg`

### Geofence Verification
- Run before writing migrations: `SELECT geo_id, name, mtfcc FROM essentials.geofence_boundaries WHERE state='24' AND mtfcc='G4020' AND geo_id='24037'` — confirms St. Mary's County boundary present
- Run before writing migrations: `SELECT geo_id, name, mtfcc FROM essentials.geofence_boundaries WHERE state='24' AND mtfcc='G4110' AND name ILIKE '%leonardtown%'` — confirms Leonardtown place boundary and returns exact geo_id

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql` — Full county government migration template; copy structure verbatim and substitute MD values
- `scripts/md_executives_headshots.py` — Headshot script template; copy and substitute sources

### Established Patterns
- Post-verification DO block (3 gates): government row count, offices count, section-split detector — MANDATORY in every seeding migration; rolls back on failure
- `ON CONFLICT (external_id) DO NOTHING` on politicians insert + `WHERE NOT EXISTS (district_id, politician_id)` guard on offices insert — idempotent pair
- `office_id` back-fill via UPDATE at end of migration (idempotent: `WHERE p.office_id IS NULL`)
- `is_appointed_position=false` for elected commissioners and council members; `is_appointed=false` on politician row

### Integration Points
- Phase 91 loaded all MD geofences — St. Mary's County (G4020) and Leonardtown (G4110) boundaries are already in `geofence_boundaries`; the migrations here create the linking `districts` rows
- Phase 96 (MD Elections) will add election races that reference these government/chamber rows — seeding must be clean before Phase 96
- Address lookup routing: creating `districts` rows with correct `geo_id` and `state='md'` (lowercase) is the key that makes PostGIS ST_Covers queries return these officials

</code_context>

<specifics>
## Specific Ideas

- St. Mary's County Board of County Commissioners website: stmaryscountymd.gov — researcher should check for current member roster and headshot photos
- Leonardtown official website: researcher should find it (likely leonardtownmd.gov or similar) and check for Mayor + Council members list
- The section-split detector query from feedback memory should be run after seeding: zero rows means the geofence boundary and district rows are correctly linked

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 95-Leonardtown / St. Mary's County Deep Seed*
*Context gathered: 2026-06-05*
