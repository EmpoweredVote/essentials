# Phase 190: Arizona TIGER Geofences - Context

**Gathered:** 2026-07-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Make Arizona geographically routable: load all AZ TIGER boundary tiers into
`essentials.geofence_boundaries` (+ matching `essentials.districts` rows) so any AZ
address resolves to its correct **federal (CD), state (SLDU + SLDL), county, and city**
representatives. This is the greenfield groundwork that gates every downstream v22.0
phase — nothing routes without it (no AZ geofence/state/federal/legislature data exists yet).

**In scope:** TIGER `cd119` (congressional, 9 districts), `sldu` (state senate, 30 districts),
`sldl` (state house, 30 districts — 2-seat/multi-member), `place` (incorporated cities,
statewide), `county` (all 15 AZ counties). **AZ FIPS = 04.** A per-state
`smoke-az-geofences.ts` verifier. Section-split scan (must return 0 defects).

**Out of scope:** tribal/reservation (`aiannh`) layer (D-01); unincorporated-community
(`cousub`) subdivisions (D-03); any government/roster/headshot/stance work (Phases 191+);
2026 election shells (Phase 199). No frontend change in this phase.
</domain>

<decisions>
## Implementation Decisions

### TIGER layer set for Arizona
- **D-00:** Load exactly these layers via `load-state-tiger-boundaries.ts`:
  `cd119, sldu, sldl, place, county`. Add an `AZ: new Set([...])` entry to
  `STATE_LAYER_ALLOWLIST`, `STATE_RUN_MAKEVALID`, and the FIPS map (**AZ→04**). Mirrors the
  NV/ME/OR/MD/VA recent-state pattern. **Use `cd119` NOT `cd`** — verify the loader key
  against the actual TIGER2024 zip filename (the ME/OR/NV silent-no-op trap).
- **Casing (locked by precedent):** `state='04'` in `geofence_boundaries`;
  `districts.state='az'` (lowercase) for SLDU/SLDL/COUNTY/LOCAL tiers, `'AZ'` (uppercase)
  for STATE_EXEC/NATIONAL tiers. Casing mismatch = silent routing failure — spot-check after load.

### Tribal lands (`aiannh`)
- **D-01: SKIP `aiannh` (NV D-02 precedent).** No tribal-government representation is in this
  milestone's scope. Notably, two reservations sit **in the Tucson metro** — the Tohono
  O'odham Nation's **San Xavier District** (SW of Tucson) and the **Pascua Yaqui Tribe** —
  plus the Navajo Nation statewide. Addresses on these lands resolve to county/city only
  (acceptable). The `aiannh` national layer also carries the cross-state NAMELSAD-allowlist
  complexity Utah hit (STATEFP designates only the *primary* state). Defer to a future
  milestone if/when tribal-government coverage is wanted.

### Place-layer breadth
- **D-02: Load ALL AZ incorporated `place` (G4110) statewide (~90+)** (NV D-04 precedent),
  not just the 5 Tucson-metro cities. Geofences are cheap; every prior state loaded its full
  G4110 set, enabling future AZ city coverage (Phoenix/Maricopa, etc.) with zero re-load. Add
  AZ city-vintage assertions to `STATE_CITY_ASSERTIONS` for the 5 in-scope cities —
  **Tucson, Oro Valley, Marana, Sahuarita, South Tucson** — verify exact NAMELSAD strings on
  `--dry-run` before the live load.

### Unincorporated communities (`cousub`)
- **D-03: SKIP `cousub` — county-level only (NV D-03 precedent).** Pima County's large
  unincorporated communities — **Catalina Foothills, Casas Adobes, Tanque Verde, Drexel
  Heights** — have no municipal government (the county governs them), exactly like the Las
  Vegas Strip. A Catalina Foothills / Casas Adobes address returns Pima County tiers with
  **no city** and **no township** — correctly recognized as unincorporated. Loading `cousub`
  would add polygons with no governing body to attach.

### Multi-member legislative districts (SLDL 2-seat)
- **D-04 (note, not a tier decision):** Arizona's legislature uses **30 districts**, each
  electing **1 senator + 2 house reps**. At the geofence tier this simply means the load
  produces **30 SLDU + 30 SLDL polygons** (NOT 60 SLDL) — one polygon per district, shared by
  the 2 house seats. This is the Maryland multi-member pattern. Downstream (Phase 192) the
  60-rep seeding must use a NOT-EXISTS guard on `(district_id, politician_id)` — NOT
  `(district_id, chamber_id)`, which would block all but the first rep per district. Recorded
  here so Phase 192 inherits the MD GOTCHA; nothing to decide at the geofence tier.

### Claude's Discretion
- Exact verification addresses for `smoke-az-geofences.ts` (one per representative tier:
  City of Tucson, Oro Valley, Marana, Sahuarita, South Tucson, and one unincorporated Pima
  County address e.g. Catalina Foothills). Planner/executor picks real addresses; criterion
  is correct tier resolution per the success criteria.
- `--dry-run` first to confirm layer counts (9 CD / 30 SLDU / 30 SLDL / 15 counties / ~90+
  places) + exact NAMELSAD vintage strings before the live load.
- DB pre-check for any pre-existing AZ (`state='04'`) geofence rows before loading — roadmap
  asserts greenfield, but executor DB-verifies inline (gsd-executor has no Supabase MCP; NV
  158 found 4 stray pre-existing CD rows, so verify rather than assume).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase planning
- `.planning/ROADMAP.md` §"Phase 190: Arizona TIGER Geofences" + §"Milestone-wide
  conventions" — locked rules: new-state-foundation-first (Phase 190 gates all others),
  TIGER-first, verify loader key per tier, section-split scan, casing.
- `.planning/REQUIREMENTS.md` §"AZ-GEO-01" — the requirement this phase satisfies.

### Reusable code (backend repo `C:\EV-Accounts`)
- `backend/scripts/load-state-tiger-boundaries.ts` — THE generalized state TIGER loader.
  Add AZ to its four inline allowlists (layer allowlist / city-assertions / make-valid /
  FIPS map). Adding a state is a deliberate code change by design. Supports `--dry-run`.
- `backend/scripts/smoke-nv-geofences.ts` (and `smoke-va-/-or-/-md-/-me-geofences.ts`) —
  copy as the model for a new `smoke-az-geofences.ts` address-routing PIP verifier.

### Playbook
- `LOCATION-ONBOARDING.md` — per-state geofence steps + GOTCHAs (cd119 silent-no-op trap,
  MTFCC pre-flight, casing, G4110 dry-run count). The Nevada block (FIPS 32) is the closest
  analog. Add an **Arizona block in Phase 200** (retrospective), not here.

### Precedent context (closest analog)
- `.planning/milestones/v18.0-phases/158-nevada-tiger-geofences/158-CONTEXT.md` — the NV
  greenfield geofence phase this one mirrors nearly 1:1 (D-01→D-04 map directly).
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `load-state-tiger-boundaries.ts`: parameterized
  `--state AZ --fips 04 --layers cd119,sldu,sldl,place,county`; per-layer record handling for
  all five target layers already wired (used by 9 prior states). Supports `--dry-run`.
- `smoke-{state}-geofences.ts`: per-state PIP smoke test pattern — point-in-polygon
  assertions for representative addresses across tiers.

### Established Patterns
- Per-state allowlists are inline code, intentionally requiring a code change per new state
  (forces explicit layer review).
- `essentials.geofence_boundaries` keyed by `state` (FIPS string, `'04'` for AZ) + `mtfcc`;
  `districts` link via casing-sensitive `state` column.
- Section-split scan (SQL) run after every load — zero rows = clean (see
  `feedback_section_split_check` memory).

### Integration Points
- Backend `informBoundaryService` resolves address → tiers via PostGIS PIP against
  `geofence_boundaries`. No frontend change in this phase.
- Geofence-linked districts here are consumed by Phase 191 (federal CD linkage), Phase 192
  (SLDU/SLDL legislature), and Phases 193–198 (Pima County + Tucson-metro city LOCAL tiers).

### Non-obvious project state
- gsd-executor has no Supabase MCP — DB-verify steps (pre-existing-row check, layer counts,
  section-split scan) run inline within the phase, not via a subagent.
- `mcp__supabase-local` IS production — any verification writes are live (per
  `feedback_supabase_local_is_remote`).
</code_context>

<specifics>
## Specific Ideas

- The unincorporated-Pima-County routing is a headline correctness check — a Catalina
  Foothills / Casas Adobes address → Pima County, no city, no township (the AZ analog of
  NV's Strip-is-unincorporated check).
- Pre-flight `--dry-run` to verify exact NAMELSAD vintage strings for the 5 in-scope cities
  before committing the live load (the `STATE_CITY_ASSERTIONS` gate).
</specifics>

<deferred>
## Deferred Ideas

- **Arizona tribal/reservation (`aiannh`) geofences** — future milestone, only if
  tribal-government coverage (Tohono O'odham, Pascua Yaqui, Navajo Nation) is added (D-01).
- **Unincorporated-community (`cousub`) boundaries** — only if AZ unincorporated-area
  advisory bodies ever become in-scope as representation (D-03). Currently no governing body
  to attach.
- **Phoenix / Maricopa County + statewide AZ city coverage** — out of scope for v22.0
  (Tucson metro only); the full-statewide G4110 load (D-02) means these need no geofence
  re-load when a future wave seeds them.

### Reviewed Todos (not folded)
None — no pending todos matched this phase.
</deferred>

---

*Phase: 190-arizona-tiger-geofences*
*Context gathered: 2026-07-08*
