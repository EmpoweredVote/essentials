# Phase 174: West-Metro School-District Geofences - Context

**Gathered:** 2026-06-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Load `G5420` geofence boundaries for **5 west-metro school districts** via the TIGER UNSD
pattern, so school-board phases (183–184) can route any west-metro address to its correct
district. Target districts (WM-GEO-01):

1. Beaverton SD 48J
2. Hillsboro SD 1J
3. Tigard-Tualatin SD 23J
4. Forest Grove SD 15
5. Sherwood SD 88J

**In scope:** Download OR TIGER UNSD shapefile, filter to the 5 target GEOIDs, insert 5
`G5420` rows into `essentials.geofence_boundaries`, run section-split scan (must be 0),
verify address-routing per district.

**Out of scope:** Any other geofence tier (city/county/CD/SLDU/SLDL are complete statewide —
untouched), the 6 Multnomah G5420 districts already loaded in v10.0 (`source =
'tiger_unsd_or_2024'`), school-board rosters/headshots (phases 183–184), 5 tiny WashCo cities
deferred from the milestone.

</domain>

<decisions>
## Implementation Decisions

The phase is mechanical — it replicates the proven v10.0 Multnomah loader. The user accepted
all three recommended defaults below (no further discussion requested).

### Loader packaging
- **D-01:** Create a **dedicated west-metro loader script** (e.g.
  `load-or-westmetro-school-boundaries.ts`), cloned from the existing
  `C:/EV-Accounts/backend/scripts/load-or-school-boundaries.ts`. Do **not** mutate the existing
  Multnomah loader. Rationale: the existing script hardcodes the 6 Multnomah GEOIDs +
  `EXPECTED_COUNT=6`; a separate script keeps each batch's GEOID filter independently auditable,
  satisfying SC#2 ("loader GEOID filter confirmed against the 5 target GEOIDs, not the 6
  Multnomah"). The new script sets `EXPECTED_COUNT = 5` and its own `TARGET_GEOIDS` map of 5
  entries. Same idempotent `ON CONFLICT (geo_id, mtfcc) DO NOTHING` insert; same
  `mtfcc='G5420'`, `state='41'`, `geo_id` = GEOID value directly.

### Source tag
- **D-02:** Tag the 5 new rows with a **distinct source string** —
  `tiger_unsd_or_2024_westmetro` (proposed; planner may refine the exact string) — so the
  phase-186 milestone-close audit can count west-metro school-district rows with a one-line
  `WHERE source = '...'` query, cleanly separated from the 6 Multnomah rows
  (`tiger_unsd_or_2024`). The loader's post-insert verification counts `WHERE state='41' AND
  mtfcc='G5420' AND source='<westmetro tag>'` and asserts `= 5`.

### Verification depth
- **D-03:** Require a **real-address routing spot-check for all 5 districts** — not just the 2
  named in SC#1 (Beaverton, Hillsboro). Each district must demonstrate a known in-district
  address resolving to the correct `G5420` geo_id. SC#1 + SC#2 + SC#3 (section-split = 0) all
  apply. This sets the "done" bar above the literal SC wording.

### Claude's Discretion
- Exact filename of the new loader script and the exact source-tag string (within the
  `tiger_unsd_or_2024_westmetro` intent).
- Which specific in-district test addresses to use for the 5 routing spot-checks.
- Whether to reuse the same `.tmp-or-school-unsd` download cache or a fresh temp dir (both fetch
  the same statewide `tl_2024_41_unsd.zip`).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Loader pattern (the exemplar — clone this)
- `C:/EV-Accounts/backend/scripts/load-or-school-boundaries.ts` — the v10.0 Multnomah loader.
  Defines the EXACT pattern to replicate: TIGER URL
  (`https://www2.census.gov/geo/tiger/TIGER2024/UNSD/tl_2024_41_unsd.zip`), download-with-redirects
  + zip extract + shapefile read, `GEOID` field filter, `ST_ForcePolygonCCW(ST_SetSRID(ST_Force2D(
  ST_GeomFromGeoJSON(...)), 4326))` insert, idempotent `ON CONFLICT (geo_id, mtfcc) DO NOTHING`,
  and the "all-N-GEOIDs-found-or-fail" assert. Change `TARGET_GEOIDS` (5 entries),
  `EXPECTED_COUNT` (5), and `SOURCE` (distinct west-metro tag).

### Requirement & milestone conventions
- `.planning/REQUIREMENTS.md` → **WM-GEO-01** — the single requirement this phase satisfies.
- `.planning/ROADMAP.md` → "Milestone-wide conventions" + "Phase 174" success criteria. Key
  conventions: only net-new geofence work in the milestone is this G5420 load; no city/county/CD/
  SLDU/SLDL changes; section-split scan must be clean.

### Schema & section-split scan
- `.planning/STATE.md` — migration counter (next at milestone start = 1115; on-disk counter
  authoritative). NOTE: this loader writes via the TS script's own DB pool, **not** a registered
  migration — confirm at plan time whether any migration ledger entry is warranted (the v10.0
  loader did not register one).
- Section-split scan: the standard split-section SQL (per `feedback_section_split_check`) was
  designed for `government_bodies`/office coverage. **Researcher must confirm** the correct
  0-row scan formulation for the *geofence* tier (G5420 boundaries) — likely an overlap/
  duplicate-geo_id check across the 5 new district geo_ids rather than the office-coverage query.

[No additional external ADRs/specs — requirements fully captured in decisions above.]

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `C:/EV-Accounts/backend/scripts/load-or-school-boundaries.ts` — clone wholesale; only the
  GEOID map, expected count, and source tag change.
- TIGER UNSD statewide zip `tl_2024_41_unsd.zip` contains ALL Oregon school districts — the same
  download serves both the Multnomah and west-metro filters (district selection is purely the
  GEOID filter).
- `npx tsx scripts/<loader>.ts --dry-run` flag already supported by the exemplar (prints
  would-insert rows without writing) — use it to confirm the 5 GEOIDs resolve before the live run.

### Established Patterns
- `essentials.geofence_boundaries` columns: `geo_id, ocd_id, name, state, mtfcc, geometry,
  source, imported_at`. Both `geo_id` and `ocd_id` are set to the GEOID value; `name` is the
  human district name; geometry forced CCW polygon SRID 4326.
- DB state confirmed clean (2026-06-30): exactly 6 G5420/state='41' rows exist, all
  `source='tiger_unsd_or_2024'` (Centennial 28J, David Douglas 40, Parkrose 3, Portland Public
  Schools, Reynolds 7, Riverdale 51J). None of the 5 west-metro districts present.

### Integration Points
- `gsd-executor` has **no Supabase MCP** — DB-verify steps run inline within the phase (or via
  the loader's own pg Pool / a `psql -f`). The loader runs from `C:/EV-Accounts/backend` against
  `DATABASE_URL` (production Supabase pooler).
- Downstream: phases 183–184 link school-board officials to these G5420 boundaries via
  `essentials.districts` (OR rows have NULL `government_id`; join via geo_id). The 5 geo_ids
  produced here are the contract those phases depend on.

</code_context>

<specifics>
## Specific Ideas

- **Research-verify (RISK):** Confirm all 5 districts are *unified* (present in the UNSD /
  `tl_2024_41_unsd` shapefile) and not elementary-only (ELSD) or secondary/union-high (SCSD). The
  48J/1J/23J/15/88J naming strongly suggests unified K-12 (the "J" = joint/multi-county, not
  non-unified), but if any district lives in a different TIGER layer the loader's "all-5-found"
  assert will fail — the researcher must resolve each district's correct layer + GEOID before the
  loader is finalized.
- **GEOID sourcing:** The 5 target GEOIDs must be looked up and verified (the Multnomah set was
  "verified via TIGERweb REST API layer 14, 2026-06-01"). Researcher should produce the 5
  confirmed GEOIDs the same way and cross-check the resolved district names against the loader's
  `--dry-run` output.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 174-west-metro-school-district-geofences*
*Context gathered: 2026-06-30*
