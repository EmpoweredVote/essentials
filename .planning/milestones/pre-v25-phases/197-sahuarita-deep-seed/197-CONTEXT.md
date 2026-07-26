# Phase 197: Sahuarita Deep-Seed - Context

**Gathered:** 2026-07-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Deep-seed the **Town of Sahuarita, AZ** (Pima County, south of Tucson in the Santa Cruz Valley) so residents see their elected council with a compass, and the town carries its own licensed banner. Same-shape Tucson-metro city deep-seed (mirrors Pima County 193 / Tucson 194 / Oro Valley 195 / Marana 196), governed by the milestone-wide conventions in `.planning/ROADMAP.md` (Phases 193–198).

Delivers (ROADMAP success criteria, REQ SUB-02 + BANR-01):
1. Sahuarita government + council roster seeded, **form of government / seat structure verified against the official Town site at plan time**
2. All seated officials have 600×750 headshots
3. Evidence-only compass stances — 100% cited, no defaults, honest blanks
4. A licensed community banner (real street-scene/skyline, no AI, no aerial) wired into `src/lib/buildingImages.js`
5. Sahuarita surfaced in `src/lib/coverage.js` with a DB-honest chip

**Out of scope:** appointed staff (Town Manager, etc.), school boards (out of scope for the whole milestone), AZ Legislature stances (deferred by design), by-district geofences unless the researcher proves Sahuarita elects by district.
</domain>

<decisions>
## Implementation Decisions

### Roster scope
- **D-01:** Seed **elected officials only** — Mayor + elected Town Council members. No appointed officials. Antipartisan: party is never displayed (nonpartisan officials seeded with party NULL). Matches Pima/Tucson/Oro Valley/Marana.

### Council seat structural model
- **D-02:** **Mirror the Oro Valley (195) / Marana (196) pattern, contingent on researcher verification.** Expectation: Sahuarita elects its council **at-large + nonpartisan**. If confirmed, model as Mayor = new `LOCAL_EXEC` seat + **one shared `LOCAL` district** for all council seats (no per-seat districts, no ward geofences). If the researcher finds Sahuarita actually elects by ward/district, fall back to a by-district model with district geofences — but the default and expected path is the shared-LOCAL Oro Valley/Marana shape. **Researcher MUST verify current form of government and seat count against sahuaritaaz.gov before the planner locks it.**

### Community banner
- **D-03:** Claude **sources one licensed real photo at a time** (street-scene or skyline; no AI-generated, no aerial/drone). **Must avoid Catalina-range shots** — those would visually collide with the Pima County (193) and Oro Valley (195) banners; the Marana (196) banner uses the Tortolita range (Dove Mountain), so Sahuarita needs its own distinct southern/Santa-Cruz-Valley identity. **User chose "you decide" on subject** → source 2–3 licensed candidates across these Sahuarita-specific subjects and present options for review: **pecan orchards (FICO / Green Valley Pecan — the most distinctive Sahuarita identity), Santa Rita Mountains, Sahuarita Lake / Rancho Sahuarita, Titan Missile Museum.** If it may conflict with the AZ state banner, show the state shot in the review too. Process via `docs/banner-asset-pipeline.md` → `cities/sahuarita.jpg` + `CURATED_LOCAL` entry + attribution in `buildingImages.js`.

### Stances depth
- **D-04:** **Full, per convention** — evidence-only across all live compass topics, **one research agent at a time** (rate-limit rule), 100% citation, **no default values**, honest blank spokes. Applies to Sahuarita's elected officials.

### Headshot sourcing
- **D-05:** **Direct fetch from sahuaritaaz.gov council pages first**; `/find-headshots` Playwright WAF fallback if blocked, then Ballotpedia/Wikimedia. 600×750 4:5 Lanczos q90, crop-only, eyes ~1/3 from top, `press_use`, `type='default'`. (Same approach as Marana/Oro Valley.)

### Roster currency
- **D-06:** **BLOCKING roster-currency re-verify before apply.** 2026 is an active election year — re-verify the full seated roster against sahuaritaaz.gov immediately before applying the migration and block if anything changed (same guard as Oro Valley 195). No known Sahuarita vacancy/mid-cycle change was flagged during discussion.

### Claude's Discretion
- Banner subject selection (per D-03, "you decide") — source and present candidates; pecan orchards is the front-runner for distinctiveness but final choice is at review.
- Migration numbering (disk-authoritative), ext_id ranges, geofence source (Pima County GIS / TIGER place layer FIPS 04) — planner/researcher decide following prior-phase precedent.
- Exact headshot fetch mechanics within the D-05 order (direct vs Playwright WAF fallback).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone conventions & precedent (READ FIRST)
- `.planning/ROADMAP.md` § "Milestone-wide conventions (carry into every phase)" + "**Phase 197: Sahuarita Deep-Seed**" — the locked build order, banner/stance/surfacing rules, and Sahuarita goal/success criteria.
- `.planning/phases/196-marana-deep-seed/196-01-PLAN.md` — the most recent same-shape precedent (greenfield Town, Mayor `LOCAL_EXEC` + shared `LOCAL` district, nonpartisan officials, BLOCKING roster-currency re-verify).
- `.planning/phases/195-oro-valley-deep-seed/195-01-PLAN.md` + `195-RESEARCH.md` + `195-PATTERNS.md` — the original AZ greenfield-town structural template.
- `.planning/phases/194-city-of-tucson-deep-seed/` — flagship AZ city deep-seed (headshot WAF fallback, coverage.js Arizona block, banner wiring).

### Pipelines & wiring
- `docs/banner-asset-pipeline.md` — banner processing (`scripts/banners/process_banner.py` 1700×540 @ 3.15:1 → `upload_banner.py` → `cities/<slug>.jpg`).
- `src/lib/buildingImages.js` — add Sahuarita `CURATED_LOCAL` entry + attribution.
- `src/lib/coverage.js` — append "Sahuarita" to the EXISTING Arizona `COVERAGE_STATES` block (do not create a new block); `hasContext: true` only once ≥1 stance row exists.

### Verification
- `gsd-executor has no Supabase MCP` → DB-verify steps run inline within the phase (orchestrator/human runs psql/MCP).
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Marana 196 / Oro Valley 195 migrations (greenfield Town govt + Town Council chamber + `LOCAL_EXEC` Mayor + shared `LOCAL` district + nonpartisan officials) — near-copyable structural template.
- `/find-headshots` skill (Playwright WAF fallback) — used successfully for Oro Valley and Marana; sahuaritaaz.gov may be similarly protected.
- `buildingImages.js` `CURATED_LOCAL` + attribution pattern; `coverage.js` Arizona block already exists (Tucson/Oro Valley/Marana entries present).

### Established Patterns
- Per-government build order (governments row via `WHERE NOT EXISTS` → chamber → roster → headshots → stances → banner → coverage chip).
- 600×750 headshot spec (4:5 Lanczos q90, crop-only, eyes ~1/3 from top).
- Evidence-only stances, one agent at a time, honest blanks, no defaults.
- BLOCKING roster-currency re-verify before apply (2026 is an active election year).

### Integration Points
- Sahuarita is in Pima County → already covered by Pima County (193) COVERAGE_COUNTIES + AZ geofences (190). Its geofence is the TIGER `place` layer (FIPS 04) already loaded in Phase 190 — confirm the Sahuarita place geo_id resolves before seeding.
</code_context>

<specifics>
## Specific Ideas

- Banner: explicitly Sahuarita-identity imagery for the southern Santa-Cruz-Valley, NOT Catalina-range (which belongs to Pima/Oro Valley) and NOT Tortolita/Dove Mountain (Marana 196). Pecan orchards (FICO / Green Valley Pecan) are the strongest distinctive candidate; Santa Rita Mountains, Sahuarita Lake / Rancho Sahuarita, and the Titan Missile Museum are secondary candidates.
- Structural expectation: at-large nonpartisan council mirroring Oro Valley/Marana — but the researcher MUST verify current form of government and seat count against sahuaritaaz.gov before the planner locks it.
</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (School boards, AZ Legislature stances, and appointed staff remain out of scope per milestone conventions.)
</deferred>

---

*Phase: 197-sahuarita-deep-seed*
*Context gathered: 2026-07-16*
