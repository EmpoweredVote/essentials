# Phase 162: City of Las Vegas Deep-Seed - Context

**Gathered:** 2026-06-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Deep-seed the **City of Las Vegas, Nevada** government and its **City Council** (directly-elected at-large **Mayor** + **6 ward-elected council members**) to Tier-1 depth: government → chamber → roster → 600×750 headshots → evidence-only compass stances → purple `hasContext` chip. Satisfies **CLARK-02**. Depends on Phase 158 (NV city geofences).

**In scope:** 1 standalone city government ("City of Las Vegas, Nevada, US") + City Council chamber + 7 offices (Mayor + 6 ward seats); **6 custom city-ward geofences** (project's first non-TIGER ward polygons) for ward-precise council routing, with a single-city fallback; headshots; evidence-only stances; surfacing in `src/lib/coverage.js`.

**Out of scope:** Clark County Commission (Phase 161, done), Henderson / North Las Vegas / Boulder City (Phases 163–165), CCSD board (Phase 166), NV 2026 elections (Phase 167); county row officers; any non-council city offices (City Attorney, Municipal Court judges, etc. — not the elected Mayor + Council).
</domain>

<decisions>
## Implementation Decisions

### Ward routing granularity
- **D-01:** Build the project's **first custom non-TIGER city-ward geofences** — 6 Las Vegas ward boundary polygons — so an LV address returns its **one correct ward council member** (precisely meeting Success Criterion #1). The at-large **Mayor** attaches to the **whole-city geofence** (LV TIGER place polygon from Phase 158); each of the 6 council members attaches to its **ward polygon**. This is a new GIS ingestion step (sourcing LV ward boundary data is a Wave-0 research task — likely City of Las Vegas / Clark County GIS open data).
- **D-01b (fallback):** If Wave-0 **cannot source clean, reliable ward-boundary polygons**, fall back to the single-CITY-district model: attach all 6 council members to the one LV city geofence, show all 6 (each labeled "Council Member, Ward N"), and **document ward-precise routing as deferred**. The phase still completes — do **not** hard-block the deep-seed. (Mirrors the 161 county-district treatment as the safety net.)

### Mayor modeling
- **D-02:** Model the Mayor (currently **Shelley Berkley**, directly elected at-large, in office since Jan 2025) as a **distinct directly-elected at-large seat within the City Council chamber** — "Mayor" title, attached to the **city-wide geofence**, **sorted first**. The council chamber = Mayor + 6 ward members (**7 seats total**; `official_count` = 7 on the chamber). **Explicitly NOT** the LA-city rotational / title-on-seat pattern — the executor must not pick a ward member as a rotational mayor. Not a separate standalone chamber/government.

### Government modeling + IDs
- **D-03:** Create a **standalone government "City of Las Vegas, Nevada, US"** (mirrors "Clark County, Nevada, US" from 161 and the LA-city naming), **NOT** nested under the State of Nevada (geo_id 32) government — prevents city officials surfacing under the state tier.
- **D-03b:** external_id block for the 7 seats uses NV's negative scheme; exact range chosen by a **Wave-0 collision probe** (must not collide with: US House −32001..−32004; STATE_EXEC −3200001..−3200006; Senate −3203001..−3203021; Assembly −3204001..−3204042; Clark commissioners −3200301..−3200307). Confirm the LV city **geo_id** (TIGER place) loaded by Phase 158 in the same probe.

### Stance topic scope + headshots
- **D-04:** Research **all live compass topics** per official (standing rule), **one agent at a time**, evidence-only / 100% cited / honest blank spokes / **zero default values**. Aim for the **~18–21 stance depth** of prior deep-seeds, not a local-only subset.
- **D-05:** Headshot sourcing chain — **`lasvegasnevada.gov`** council pages first → on WAF/403, established workarounds (Chrome-UA curl, background-image grep) → free alternates (Wikimedia Commons with descriptive UA, official campaign, Ballotpedia) → **document a genuine gap** if none exist. 600×750, crop-4:5 then resize, **no text/graphic overlays, no fabrication**, mirrored to Storage `politician_photos/{uuid}-headshot.jpg`. `photo_license` set at execution from the actual source.

### Claude's Discretion
- Exact LV ward-polygon data source + ingestion mechanism (Wave-0 research; whatever pattern fits — note this is greenfield for the project).
- Exact external_id range for the 7 seats (Wave-0 probe + pick unused block).
- Migration split (structural vs. audit-only headshot vs. per-official stance migrations) — follow the established deep-seed shape; confirm next migration number from the DB ledger MAX in Wave-0 (memory indicates next NV migration ~1064 at v18.0 park — verify against live ledger).
- Council chamber name (e.g., "Las Vegas City Council") — planner's choice matching the official body name.
- Whether ward seats carry a free-text "Council Member, Ward N" title for display clarity even under ward-precise routing — recommended; planner decides.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirement + milestone conventions
- `.planning/ROADMAP.md` §"Phase 162: City of Las Vegas Deep-Seed" — goal + 4 success criteria.
- `.planning/ROADMAP.md` §"Milestone-wide conventions (carry into every phase)" — deep-seed rules (Tier-1 unit, section-split scan, casing, antipartisan, 600×750, hasContext chip, stance evidence rules).
- `.planning/REQUIREMENTS.md` §"CLARK-02" — the requirement this phase satisfies.

### Primary analog — the immediately-prior NV deep-seed (county)
- `.planning/phases/161-clark-county-commission-deep-seed/161-CONTEXT.md` — standalone-government decision (D-04), single-district routing fallback model, Chair/title-on-seat handling, NV external_id scheme, stance + headshot conventions.
- `.planning/phases/161-clark-county-commission-deep-seed/161-PATTERNS.md` + `161-0{1,2,3}-SUMMARY.md` — migration shape, executor/orchestrator split, ledger registration, headshot pipeline, 9-check E2E verification template.

### NV foundation (geofences, casing, IDs)
- `.planning/phases/158-*` (NV geofences) — LV city G4110 place geofence (the at-large Mayor + single-city fallback attach point); casing convention (`state='nv'` lowercase for SLDU/SLDL/COUNTY tiers — confirm city tier casing in Wave-0).
- `.planning/phases/160-nevada-legislature-seed-headshots/160-PATTERNS.md` — NV migration template; executor has NO supabase MCP (inline orchestrator applies migrations via `psql -f` using `C:/EV-Accounts/backend/.env` DATABASE_URL).

### Mayor modeling reference (directly-elected, not rotational)
- LA-city precedent for a **directly-elected** mayor kept distinct from rotational mayors — memory `project_phase153_inglewood_complete` ("directly-elected Mayor kept"). Contrast with rotational pattern in `project_phase156_bellflower_complete` (groupHierarchy.js Mayor>MPT ordering).

### Stance research + display + schema
- Memories: `feedback_stance_research_one_at_a_time`, `feedback_stance_research_all_topics`, `feedback_stance_no_default_value`, `feedback_compass_chairs_not_polarity`, `project_compass_live_topic_ids` (live topic IDs / retired IDs NOT to use), `project_stance_research_format`.
- Schema: `inform.politician_answers` (stances), `inform.compass_topics` (topic_key / is_live), `inform.compass_stances` (chairs) — confirmed shapes in `project_phase155_norwalk_complete`.
- `essentials.governments` / `essentials.chambers` (`official_count`; slug is GENERATED ALWAYS — never INSERT slug) / `essentials.offices` / `essentials.politician_images` (columns: id, politician_id, url, type, photo_license — **no** photo_origin_url) / `essentials.districts` (uses `label`, no name_formal).

### Surfacing
- `src/lib/coverage.js` — add City of Las Vegas to the `hasContext` (purple chip) set (surfacing target is coverage.js, NOT Landing.jsx — memory `project_v170_complete`).
- Browse verification link convention: `essentials.empowered.vote/results?browse_geo_id=<LV_geo_id>&browse_mtfcc=G4110`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- LV city G4110 geofence already loaded by Phase 158 (the Mayor / single-city-fallback attach point) — confirm geo_id + casing in Wave-0.
- Deep-seed migration templates + headshot pipeline (`_tmp-*-headshots.py`, crop-4:5 → 600×750) from phases 155–161 — directly adaptable.
- 161's standalone-county-government migration is the closest structural template for the standalone-city-government INSERT.

### Established Patterns
- Executor/orchestrator split: gsd-executor writes `.sql`/`.py`; inline orchestrator runs all DB probes, applies migrations (`psql -f`), runs the headshot script, runs audits (executor has NO supabase MCP).
- Section-split scan (0 rows) after seed; antipartisan (party stored, never displayed); `chambers.slug` GENERATED ALWAYS; `politician_images` has NO `photo_origin_url`.
- Office uniqueness guard `(district_id, politician_id)` from the county/city seeds.

### Integration Points
- Backend `/representatives/me` resolves tiers via PIP against geofences → returns the chamber's offices. **New:** ward-precise routing requires the 6 ward polygons to resolve to per-ward offices; the at-large Mayor resolves via the city-wide geofence. The single-city fallback resolves all 7 via the one city geofence.
- `src/lib/coverage.js` drives the purple `hasContext` chip surfacing.

</code_context>

<specifics>
## Specific Ideas

- Headline correctness check: a Las Vegas residential address returns the **Mayor + the one correct ward council member** (ward-precise routing), with no empty LOCAL section and no section-split. Under the fallback, it returns Mayor + all 6 ward-labeled council members.
- Mayor sorted first in the council display; ward members in ward order.
- Per-ward free-text label ("Council Member, Ward 1".."Ward 6") for display clarity.

</specifics>

<deferred>
## Deferred Ideas

- **Single-city fallback as a permanent state** — only if Wave-0 ward-polygon sourcing fails; otherwise ward geofences are the goal this phase.
- **Non-elected city offices** (City Attorney, Municipal Court judges, City Manager) — not elected Mayor + Council; out of scope, future phase if wanted.
- **Reusing LV ward polygons for other ward-based NV cities** (Henderson / North Las Vegas in Phases 163–164) — if the ward-geofence pipeline built here generalizes, later city phases may adopt it. Note for those phases.

### Reviewed Todos (not folded)
None — no pending todos matched this phase.

</deferred>

---

*Phase: 162-city-of-las-vegas-deep-seed*
*Context gathered: 2026-06-27*
