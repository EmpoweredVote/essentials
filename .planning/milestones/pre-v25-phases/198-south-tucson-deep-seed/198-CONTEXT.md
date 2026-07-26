# Phase 198: South Tucson Deep-Seed - Context

**Gathered:** 2026-07-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Deep-seed the **City of South Tucson, AZ** — a ~1.2 sq-mi incorporated municipality **entirely surrounded by (an enclave within) the City of Tucson**, in Pima County; predominantly Mexican-American, known for its South 4th Avenue Mexican-food/mural district. Residents must see their elected council with a compass, and the city must carry its own licensed banner. Same-shape Tucson-metro city deep-seed (mirrors Pima County 193 / Tucson 194 / Oro Valley 195 / Marana 196 / Sahuarita 197), governed by the milestone-wide conventions in `.planning/ROADMAP.md` (Phases 193–198). **This phase CLOSES the Tucson-metro local-deep-seed track** before AZ elections (Phase 199).

Delivers (ROADMAP success criteria, REQ SUB-04 + BANR-01):
1. South Tucson government + council roster seeded, **form of government / seat structure verified against the official City site at plan time**
2. All seated officials have 600×750 headshots
3. Evidence-only compass stances — 100% cited, no defaults, honest blanks
4. A licensed community banner (real street-scene, no AI, no aerial) wired into `src/lib/buildingImages.js`
5. South Tucson surfaced in `src/lib/coverage.js` with a DB-honest chip

**Out of scope:** appointed staff (City Manager, etc.), school boards (out of scope for the whole milestone), AZ Legislature stances (deferred by design), by-district geofences unless the researcher proves South Tucson elects by ward.
</domain>

<decisions>
## Implementation Decisions

### Roster scope
- **D-01 (carried forward, locked):** Seed **elected officials only** — Mayor + elected City Council members. No appointed officials. Antipartisan: party is never displayed (nonpartisan officials seeded with party NULL). Matches Pima/Tucson/Oro Valley/Marana/Sahuarita.

### Council seat structural model
- **D-02:** **Precedent default — mirror the Oro Valley (195) / Marana (196) / Sahuarita (197) pattern, contingent on researcher verification.** Expectation: South Tucson elects its council **at-large + nonpartisan**. If confirmed, model as Mayor = new `LOCAL_EXEC` seat + **one shared `LOCAL` district** for all council seats (no per-seat districts, no ward geofences). **Researcher MUST verify current form of government and seat count against cityofsouthtucson.org before the planner locks it.** Fall back to a by-ward model with district geofences ONLY if verification proves wards.

### Enclave-inside-Tucson routing
- **D-03:** **BLOCKING enclave-routing verification.** Because South Tucson sits entirely inside the City of Tucson's footprint, the researcher/planner MUST explicitly confirm, before seeding: (a) South Tucson's own TIGER `place` geo_id (FIPS 04) resolves distinctly from Tucson's, and (b) a known in-South-Tucson street address routes to South Tucson and is **not** swallowed by Tucson's geofence (geofence-overlap check). The standard post-seed section-split scan still runs per convention (this is IN ADDITION to it, not a replacement).

### Community banner
- **D-04:** Claude **sources one licensed real photo at a time** (street-scene; no AI-generated, no aerial/drone). **User chose "you decide" on subject** → source 2–3 licensed candidates and present for review. **Two hard collision constraints (enclave-specific):** the banner must NOT read as (i) a Catalina/mountain shot — those belong to Pima County (193) / Oro Valley (195), and Marana (196) owns Tortolita/Dove Mountain — NOR (ii) downtown Tucson — the Tucson city banner (194) is Hotel Congress. South Tucson needs its own **cultural/urban** identity. Candidate subjects to source, in priority order: **Chicano/community murals (front-runner — most distinctive & collision-free), South 4th Avenue restaurant-district streetscape/signage, City welcome sign / Mercado.** If it may conflict with the AZ state banner, show the state shot in the review too. Process via `docs/banner-asset-pipeline.md` → `cities/south-tucson.jpg` + `CURATED_LOCAL` entry + attribution in `buildingImages.js`.

### Stances depth
- **D-05 (carried forward, locked):** **Full, per convention** — evidence-only across all live compass topics, **one research agent at a time** (rate-limit rule), 100% citation, **no default values**, honest blank spokes. Applies to South Tucson's elected officials.

### Headshot sourcing
- **D-06 (carried forward, locked):** **Standard order — direct fetch from cityofsouthtucson.org council pages first**, then `/find-headshots` Playwright WAF fallback, then Ballotpedia/Wikimedia/news. Honest blank (no placeholder) if genuinely none found. 600×750 4:5 Lanczos q90, crop-only, eyes ~1/3 from top, `press_use`, `type='default'`. (Note: very small city — the official site may lack usable portraits, so the Ballotpedia/Wikimedia fallback is more likely to be exercised than in prior phases.)

### Roster currency
- **D-07 (carried forward, locked):** **BLOCKING roster-currency re-verify before apply.** 2026 is an active election year — re-verify the full seated roster against cityofsouthtucson.org immediately before applying the migration and block if anything changed (same guard as Oro Valley 195 / Sahuarita 197). No known South Tucson vacancy/mid-cycle change was flagged during discussion.

### Claude's Discretion
- Banner subject selection (per D-04, "you decide") — source and present candidates; a Chicano/community mural is the front-runner for distinctiveness but final choice is at review.
- Migration numbering (disk-authoritative), ext_id ranges, geofence source (Pima County GIS / TIGER place layer FIPS 04) — planner/researcher decide following prior-phase precedent.
- Exact headshot fetch mechanics within the D-06 order (direct vs Playwright WAF fallback vs Ballotpedia).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone conventions & precedent (READ FIRST)
- `.planning/ROADMAP.md` § "Milestone-wide conventions (carry into every phase)" + "**Phase 198: South Tucson Deep-Seed**" — the locked build order, banner/stance/surfacing rules, and South Tucson goal/success criteria.
- `.planning/phases/197-sahuarita-deep-seed/` (CONTEXT + `197-01`..`197-04` PLANs + RESEARCH/PATTERNS) — the most recent same-shape precedent (greenfield Town, Mayor `LOCAL_EXEC` + shared `LOCAL` district, nonpartisan officials, evidence-only stances, banner wiring, coverage chip, BLOCKING roster-currency re-verify).
- `.planning/phases/196-marana-deep-seed/196-01-PLAN.md` — prior same-shape precedent (official-portrait Playwright WAF-clear pattern, recused-official handling).
- `.planning/phases/195-oro-valley-deep-seed/195-01-PLAN.md` + `195-RESEARCH.md` + `195-PATTERNS.md` — the original AZ greenfield-town structural template.
- `.planning/phases/194-city-of-tucson-deep-seed/` — flagship AZ city deep-seed (headshot WAF fallback, coverage.js Arizona block, banner wiring). **Especially relevant here** since South Tucson is the enclave inside Tucson — reuse its geofence/coverage precedent and avoid banner collision with `cities/tucson.jpg` (Hotel Congress).

### Pipelines & wiring
- `docs/banner-asset-pipeline.md` — banner processing (`scripts/banners/process_banner.py` 1700×540 @ 3.15:1 → `upload_banner.py` → `cities/<slug>.jpg`).
- `src/lib/buildingImages.js` — add South Tucson `CURATED_LOCAL` entry + attribution (existing AZ keys: `tucson`, `oro valley`, `marana`, `sahuarita`; use a distinct key with no same-named-city collision, storage file `cities/south-tucson.jpg` hyphenated).
- `src/lib/coverage.js` — append "South Tucson" to the EXISTING Arizona `COVERAGE_STATES` block (do not create a new block); `hasContext: true` only once ≥1 stance row exists. Pima County stays in `COVERAGE_COUNTIES`.

### Verification
- `gsd-executor has no Supabase MCP` → DB-verify steps (geo_id resolution, enclave-routing probe, section-split scan) run inline within the phase (orchestrator/human runs psql/MCP).
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Sahuarita 197 / Marana 196 / Oro Valley 195 migrations (greenfield city govt + City Council chamber + `LOCAL_EXEC` Mayor + shared `LOCAL` district + nonpartisan officials) — near-copyable structural template.
- `/find-headshots` skill (Playwright WAF fallback) — used across Oro Valley/Marana/Sahuarita.
- `buildingImages.js` `CURATED_LOCAL` + attribution pattern; `coverage.js` Arizona block already exists (Tucson/Oro Valley/Marana/Sahuarita entries present — South Tucson appends to it).

### Established Patterns
- Per-government build order (governments row via `WHERE NOT EXISTS` → chamber → roster → headshots → stances → banner → coverage chip).
- 600×750 headshot spec (4:5 Lanczos q90, crop-only, eyes ~1/3 from top).
- Evidence-only stances, one agent at a time, honest blanks, no defaults.
- BLOCKING roster-currency re-verify before apply (2026 is an active election year).

### Integration Points
- South Tucson is in Pima County → already covered by Pima County (193) COVERAGE_COUNTIES + AZ geofences (190). Its geofence is the TIGER `place` layer (FIPS 04) already loaded in Phase 190 — **D-03 makes confirming the South Tucson place geo_id + in-enclave routing (vs Tucson) a BLOCKING pre-seed check** because of the enclave overlap.
</code_context>

<specifics>
## Specific Ideas

- Banner: explicitly South Tucson **cultural/urban** identity — Chicano/community murals (front-runner), South 4th Avenue restaurant-district streetscape/signage, or City welcome sign / Mercado. Must NOT be a Catalina/mountain shot (belongs to Pima/Oro Valley), NOT Tortolita/Dove Mountain (Marana), and NOT downtown Tucson (Tucson = Hotel Congress). South Tucson is the one covered jurisdiction whose banner should be people/street/art rather than landscape.
- Structural expectation: at-large nonpartisan council mirroring Oro Valley/Marana/Sahuarita — but the researcher MUST verify current form of government and seat count against cityofsouthtucson.org before the planner locks it.
- Enclave caveat: South Tucson is wholly inside Tucson — treat the geofence-overlap / address-routing verification as a first-class blocking check, not a routine geo_id lookup.
</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (School boards, AZ Legislature stances, and appointed staff remain out of scope per milestone conventions.)
</deferred>

---

*Phase: 198-south-tucson-deep-seed*
*Context gathered: 2026-07-17*
