# Phase 196: Marana Deep-Seed - Context

**Gathered:** 2026-07-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Deep-seed the **Town of Marana, AZ** (Pima County, NW of Tucson) so residents see their elected council with a compass, and the town carries its own licensed banner. Same-shape Tucson-metro city deep-seed (mirrors Pima County 193 / Tucson 194 / Oro Valley 195), governed by the milestone-wide conventions in `.planning/ROADMAP.md` (Phases 193–198).

Delivers (ROADMAP success criteria, REQ SUB-02 + BANR-01):
1. Marana government + council roster seeded, **form of government / seat structure verified against the official Town site at plan time**
2. All seated officials have 600×750 headshots
3. Evidence-only compass stances — 100% cited, no defaults, honest blanks
4. A licensed community banner (real street-scene/skyline, no AI, no aerial) wired into `src/lib/buildingImages.js`
5. Marana surfaced in `src/lib/coverage.js` with a DB-honest chip

**Out of scope:** appointed staff, school boards (out of scope for the whole milestone), AZ Legislature stances (deferred by design), by-district geofences unless the researcher proves Marana elects by district.
</domain>

<decisions>
## Implementation Decisions

### Roster scope
- **D-01:** Seed **elected officials only** — Mayor + elected Town Council members. No appointed officials (Town Manager, etc.). Antipartisan: party is never displayed (nonpartisan officials seeded with party NULL). Matches Pima/Tucson/Oro Valley.

### Council seat structural model
- **D-02:** **Mirror the Oro Valley (195) pattern, contingent on researcher verification.** Expectation: Marana elects its council **at-large + nonpartisan**. If confirmed, model as Mayor = new `LOCAL_EXEC` seat + **one shared `LOCAL` district** for all council seats (no per-seat districts, no ward geofences). If the researcher finds Marana actually elects by ward/district, fall back to a by-district model with district geofences — but the default and expected path is the shared-LOCAL Oro Valley shape.

### Community banner
- **D-03:** Claude **sources one licensed real photo at a time** (street-scene or skyline; no AI-generated, no aerial/drone). **Must avoid Catalina-range shots** — Marana sits by the Tortolita range, and a Catalinas image would visually collide with the Pima County (193) and Oro Valley (195) banners. Candidate subjects: Dove Mountain, Marana Main St / downtown, Heritage River Park, Tortolita foothills. Present options for review; if it may conflict with the AZ state banner, show the state shot in the review too. Process via `docs/banner-asset-pipeline.md` → `cities/marana.jpg` + `CURATED_LOCAL` entry + attribution in `buildingImages.js`.

### Stances depth
- **D-04:** **Full, per convention** — evidence-only across all live compass topics, **one research agent at a time** (rate-limit rule), 100% citation, **no default values**, honest blank spokes. Applies to Marana's elected officials.

### Claude's Discretion
- Exact headshot sourcing pipeline (direct fetch vs `/find-headshots` Playwright WAF fallback) — follow whatever the Marana Town site (or Ballotpedia/Wikimedia fallback) allows, 600×750 4:5 Lanczos q90, crop-only, `press_use`, `type='default'`.
- Migration numbering (disk-authoritative), ext_id ranges, geofence source (Pima County GIS / TIGER place 04) — planner/researcher decide following prior-phase precedent.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone conventions & precedent (READ FIRST)
- `.planning/ROADMAP.md` § "Milestone-wide conventions (carry into every phase)" + "#### Phase 196: Marana Deep-Seed" — the locked build order, banner/stance/surfacing rules, and Marana goal/success criteria.
- `.planning/phases/195-oro-valley-deep-seed/195-01-PLAN.md` — the direct structural precedent (greenfield Town, Mayor `LOCAL_EXEC` + shared `LOCAL` district, nonpartisan officials, BLOCKING roster-currency re-verify during active 2026 election before apply).
- `.planning/phases/195-oro-valley-deep-seed/195-RESEARCH.md` + `195-PATTERNS.md` — research/pattern template for an AZ greenfield town deep-seed.
- `.planning/phases/194-city-of-tucson-deep-seed/` — flagship AZ city deep-seed (headshot WAF fallback, coverage.js Arizona block, banner wiring).

### Pipelines & wiring
- `docs/banner-asset-pipeline.md` — banner processing (`scripts/banners/process_banner.py` 1700×540 @ 3.15:1 → `upload_banner.py` → `cities/<slug>.jpg`).
- `src/lib/buildingImages.js` — add Marana `CURATED_LOCAL` entry + attribution.
- `src/lib/coverage.js` — append "Marana" to the EXISTING Arizona `COVERAGE_STATES` block (do not create a new block); `hasContext: true` only once ≥1 stance row exists.

### Verification
- `gsd-executor has no Supabase MCP` → DB-verify steps run inline within the phase (orchestrator/human runs psql/MCP).
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Oro Valley 195 migrations (greenfield Town govt + Town Council chamber + LOCAL_EXEC Mayor + shared LOCAL district + nonpartisan officials) — near-copyable structural template.
- `/find-headshots` skill (Playwright WAF fallback) — used successfully for Oro Valley (orovalleyaz.gov was Akamai-blocked); marana.gov may be similar.
- `buildingImages.js` `CURATED_LOCAL` + attribution pattern; `coverage.js` Arizona block already exists (Tucson/Oro Valley entries present).

### Established Patterns
- Per-government build order (governments row via `WHERE NOT EXISTS` → chamber → roster → headshots → stances → banner → coverage chip).
- 600×750 headshot spec (4:5 Lanczos q90, crop-only, eyes ~1/3 from top).
- Evidence-only stances, one agent at a time, honest blanks.
- BLOCKING roster-currency re-verify before apply (2026 is an active election year).

### Integration Points
- Marana is in Pima County → already covered by Pima County (193) COVERAGE_COUNTIES + AZ geofences (190). Its geofence is the TIGER `place` layer (FIPS 04) already loaded in Phase 190 — confirm the Marana place geo_id resolves before seeding.
</code_context>

<specifics>
## Specific Ideas

- Banner: explicitly Tortolita/Marana-identity imagery, NOT Catalina-range (which belongs to Pima/Oro Valley). Dove Mountain and Heritage River Park are strong Marana-specific candidates.
- Structural expectation: at-large nonpartisan council mirroring Oro Valley — but the researcher MUST verify current form of government and seat count against marana.gov before the planner locks it.
</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (School boards, AZ Legislature stances, and appointed staff remain out of scope per milestone conventions.)
</deferred>

---

*Phase: 196-marana-deep-seed*
*Context gathered: 2026-07-15*
