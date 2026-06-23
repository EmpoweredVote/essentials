# Phase 158: Nevada TIGER Geofences - Context

**Gathered:** 2026-06-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Make Nevada geographically routable: load all NV TIGER boundary tiers into
`essentials.geofence_boundaries` (+ matching `essentials.districts` rows) so any NV
address resolves to its correct **federal (CD + US Senate), state (SLDU + SLDL),
county, and city** representatives. This is the greenfield groundwork that gates every
downstream v18.0 phase — nothing routes without it.

**In scope:** TIGER `cd119` (congressional), `sldu` (state senate), `sldl` (state
assembly), `place` (incorporated cities, statewide), `county`. NV FIPS = **32**.
A per-state `smoke-nv-geofences.ts` verifier. Section-split scan.

**Out of scope:** tribal/reservation (`aiannh`) layer; unincorporated-town (`cousub`)
subdivisions; any government/roster/headshot/stance work (those are Phases 159+).
Pre-existing NV federal/exec data is NOT touched here (that reconcile is Phase 159).
</domain>

<decisions>
## Implementation Decisions

### TIGER layer set for Nevada
- **D-01:** Load exactly these layers via `load-state-tiger-boundaries.ts`:
  `cd119, sldu, sldl, place, county`. Add a `NV: new Set([...])` entry to
  `STATE_LAYER_ALLOWLIST`, `STATE_RUN_MAKEVALID`, and the FIPS map (NV→32). Mirrors the
  ME/OR/MD/VA recent-state pattern. **Use `cd119` NOT `cd`** — verify the loader key
  against the actual TIGER2024 zip filename (the ME/OR silent-no-op trap).
- **D-02 (Tribal lands — `aiannh`):** **SKIP.** No tribal-government representation is in
  this milestone's scope, and the `aiannh` national layer carries the cross-state
  NAMELSAD-allowlist complexity Utah hit (STATEFP designates only the *primary* state).
  Defer to a future milestone if/when tribal-government coverage is wanted. (Las Vegas
  Paiute Colony, Moapa, Fort Mojave addresses will resolve to county/city only — acceptable.)
- **D-03 (Unincorporated towns — `cousub`):** **SKIP — county-level only.** Nevada's big
  unincorporated areas (Paradise, Spring Valley, Sunrise Manor, Enterprise) are towns with
  *advisory* boards only; the **Clark County Commission governs** them. Loading `cousub`
  would add township polygons with no governing body to attach. This directly satisfies
  success-criterion #1: a Strip address returns Clark County tiers with **no city** and
  **no township** — correctly recognized as unincorporated.

### Place-layer breadth
- **D-04:** Load **all** NV incorporated `place` (G4110) cities statewide (~19), not just the
  5 in-scope metro cities. Geofences are cheap; every prior state loaded its full G4110 set,
  enabling future NV city coverage with zero re-load. Add NV city-vintage assertions to
  `STATE_CITY_ASSERTIONS` (e.g. `'Las Vegas city', 'Henderson city', 'North Las Vegas city',
  'Boulder City city'` — verify exact NAMELSAD strings on `--dry-run`).

### Claude's Discretion
- Exact verification addresses for `smoke-nv-geofences.ts` (one per: Strip/unincorporated,
  City of Las Vegas, Henderson, North Las Vegas, Boulder City) — planner/executor picks
  real addresses; criterion is correct tier resolution per the success criteria.
- `--dry-run` first to confirm counts + exact NAMELSAD strings before the live load.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase planning
- `.planning/ROADMAP.md` §"Phase 158" + §"Milestone-wide conventions" — locked rules:
  TIGER-first, verify loader key per tier, section-split scan, `districts.state` casing
  (uppercase 'NV' for STATE/NATIONAL tiers that backend queries match; lowercase for the
  state-subdivision tiers — spot-check after load per the ME/OR casing rule).
- `.planning/REQUIREMENTS.md` §"NV-GEO-01" — the requirement this phase satisfies.

### Reusable code (backend repo `C:\EV-Accounts`)
- `backend/scripts/load-state-tiger-boundaries.ts` — THE generalized state TIGER loader.
  Add NV to its four inline allowlists (allowlist / city-assertions / make-valid / FIPS map).
  Adding a state is a deliberate code change by design.
- `backend/scripts/smoke-va-geofences.ts` (and `smoke-or-/-md-/-me-geofences.ts`) — copy as
  the model for a new `smoke-nv-geofences.ts` address-routing verifier.

### Playbook
- `LOCATION-ONBOARDING.md` — Quick Reference blocks for ME/OR/MD/VA show the per-state
  geofence steps + GOTCHAs (cd119 trap, MTFCC pre-flight, casing). Add a Nevada block in Phase 168.

### Memory (non-obvious project state)
- Pre-existing NV data found 2026-06-22: only **4 G5200 congressional-district** geofences
  exist for state='32' — the rest (cities/counties/SLDU/SLDL) are greenfield. State+federal
  *officials* are partly pre-seeded but that's Phase 159's concern, not 158. (See memory
  `project_nv_preexisting_seed`.)
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `load-state-tiger-boundaries.ts`: parameterized `--state NV --fips 32 --layers cd119,sldu,sldl,place,county`; per-layer record handling for all five target layers already wired (used by 8 prior states). Supports `--dry-run`.
- `smoke-{state}-geofences.ts`: per-state PIP smoke test pattern — point-in-polygon assertions for representative addresses across tiers.

### Established Patterns
- Per-state allowlists are inline code, intentionally requiring a code change per new state (forces explicit layer review).
- `essentials.geofence_boundaries` keyed by `state` (FIPS string, '32' for NV) + `mtfcc`; `districts` link via casing-sensitive `state` column.
- Section-split scan (SQL) run after every load — zero rows = clean (see `feedback_section_split_check` memory).

### Integration Points
- Backend `informBoundaryService` resolves address → tiers via PostGIS PIP against `geofence_boundaries`. No frontend change in this phase.
- Geofence-linked districts here are consumed by Phases 159 (federal CD linkage), 160 (SLDU/SLDL), 161–166 (county/city/CCSD).
</code_context>

<specifics>
## Specific Ideas

- The Strip-is-unincorporated routing is the headline correctness check — Strip address → Clark County, no city, no township.
- Pre-flight `--dry-run` to verify exact NAMELSAD vintage strings before committing the live load (the `STATE_CITY_ASSERTIONS` gate).
</specifics>

<deferred>
## Deferred Ideas

- **Nevada tribal/reservation (`aiannh`) geofences** — future milestone, only if tribal-government coverage is added (D-02).
- **Unincorporated-town (`cousub`) boundaries** — only if Nevada town advisory boards ever become in-scope as representation (D-03). Currently advisory-only → no governing body to attach.
- Washoe County / Reno–Sparks and rural NV city deep-seeds — future Nevada waves (already in REQUIREMENTS.md Future).

### Reviewed Todos (not folded)
None — no pending todos exist.
</deferred>

---

*Phase: 158-nevada-tiger-geofences*
*Context gathered: 2026-06-22*
