# Phase 161: Clark County Commission Deep-Seed - Context

**Gathered:** 2026-06-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Deep-seed the **Clark County, Nevada** government and its **7-member Board of County Commissioners** (which governs the unincorporated Las Vegas Strip / Paradise / Spring Valley / Sunrise Manor / Enterprise) to Tier-1 depth: government → roster → 600×750 headshots → evidence-only compass stances → purple `hasContext` chip. Satisfies **CLARK-01**.

**In scope:** 1 standalone county government + 1 chamber (Board of County Commissioners) + 7 commissioner offices linked to the existing COUNTY district (geo_id `32003`); headshots; evidence-only stances; surfacing in `src/lib/coverage.js`.

**Out of scope:** per-commission-district (A–G) custom geofences (deferred — see D-01); City of Las Vegas / Henderson / North Las Vegas / Boulder City (Phases 162–164); CCSD board (Phase 165); county row officers (Sheriff, DA, Assessor, Clerk, Recorder, etc. — not the Commission); 2026 elections (Phase 166).
</domain>

<decisions>
## Implementation Decisions

### Commissioner routing granularity
- **D-01:** Attach all 7 commissioners to the **single COUNTY district** (`essentials.districts` id=`f3708f34-6e23-4771-a8f7-44e400a23337`, geo_id `32003`, district_type `COUNTY`, label "Clark County"). A Strip/Paradise/Spring Valley address returns **all 7** "your county commissioners." Mirrors the only existing US-county model (Multnomah County, OR — 5 offices all on the single county district). **No per-district (A–G) geofences this phase** — that would require a first-of-kind non-TIGER custom-polygon ingestion pipeline; the roadmap contemplates custom board-district geofences only for CCSD (Phase 165), not the Commission. Success criterion #1 ("correct commissioner / no empty LOCAL section") is satisfied by populating the county board with no section-split.

### Chair modeling + chamber name
- **D-02:** Chamber name = **"Board of County Commissioners"** (matches the official body name; analogous to Multnomah "Board of Commissioners").
- **D-03:** The board-selected **Chair (currently Marilyn Kirkpatrick)** is modeled as a **title on her commissioner seat** (rotational-mayor / title-on-seat pattern from the LA city phases), NOT a separate office row. Chair sorts first in display (matches Multnomah Chair-first ordering, memory `project_phase83_uat_issues`). No phantom 8th seat.

### Government modeling + IDs
- **D-04:** Create a **standalone government "Clark County, Nevada, US"** (mirror naming of "Multnomah County, Oregon, US"), NOT nested under the State of Nevada (geo_id 32) government. Prevents county officials from surfacing under the state.
- **D-05:** The chamber's offices link to the existing COUNTY district at geo_id `32003`; new **external_id block for the 7 commissioners** in NV's negative scheme — exact range chosen by research/planner, must not collide with existing NV ranges (US House -32001..-32004; STATE_EXEC -3200001..-3200006; Senate -3203001..-3203021; Assembly -3204001..-3204042; senators -400057/-400058). Verify unused range with a Wave-0 DB probe.

### Stance topic scope + headshots
- **D-06:** Research **all live compass topics** per commissioner (standing rule), **one agent at a time** (memory `feedback_stance_research_one_at_a_time`), evidence-only / 100% cited / honest blank spokes / **zero default values** (memories `feedback_stance_no_default_value`, `feedback_compass_chairs_not_polarity`). Aim for the 18–21+ stance depth of prior deep-seeds, not a local-only subset.
- **D-07:** Headshot source = **clarkcountynv.gov** commissioner pages; 600×750 crop-to-4:5 then resize, no text/graphic overlays, mirrored to Storage `politician_photos/{uuid}-headshot.jpg`. `photo_license` set at execution by the actual source (likely `us_government_work`). Genuine gaps documented, no fabrication.

### Claude's Discretion
- Exact external_id range for the 7 commissioners (Wave-0 probe + pick unused block).
- Migration split (single structural migration vs structural + audit-only headshot, plus per-commissioner stance migrations) — follow the established deep-seed migration shape; next migration number = **1055** (confirm DB ledger MAX in Wave-0).
- Whether commissioner offices carry a per-district label (e.g., "Commissioner, District A") as a free-text title even though all route via the single county polygon — recommended for display clarity; planner decides.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirement + milestone conventions
- `.planning/ROADMAP.md` §"Phase 161: Clark County Commission Deep-Seed" — goal + 4 success criteria.
- `.planning/ROADMAP.md` §"Milestone-wide conventions" — deep-seed rules (section-split scan, casing, antipartisan, stance evidence rules).
- `.planning/REQUIREMENTS.md` §"CLARK-01" — the requirement this phase satisfies.

### County-government precedent (the primary analog)
- Multnomah County, OR seed in `C:/EV-Accounts/backend/migrations/` (phase 83 — "Board of Commissioners", 5 offices on single COUNTY district). Find via: `grep -rl "Multnomah County" C:/EV-Accounts/backend/migrations/`.
- Memory `project_phase83_uat_issues` — COUNTY section placement + Multnomah Chair-first ordering ground truth.

### Recent NV deep-seed patterns (migration shape, casing, executor split)
- `.planning/phases/160-nevada-legislature-seed-headshots/160-PATTERNS.md` + `160-SUMMARY` files — migration template, executor/orchestrator split (gsd-executor has NO supabase MCP — inline orchestrator applies migrations via psql/supabase MCP), ledger registration, grep-gate hygiene.
- Memory `project_phase160_complete` — next migration 1055; NV external_id scheme; apply via `psql -f` using `C:/EV-Accounts/backend/.env` DATABASE_URL.

### Stance research + display
- Memories: `feedback_stance_research_one_at_a_time`, `feedback_stance_research_all_topics`, `feedback_stance_no_default_value`, `feedback_compass_chairs_not_polarity`, `project_compass_live_topic_ids` (live topic IDs / retired IDs not to use), `project_stance_research_format`.
- Schema: `inform.politician_answers` (stances), `inform.compass_topics` (topic_key/is_live), `inform.compass_stances` (chairs) — confirmed shapes in `project_phase155_norwalk_complete`.

### Surfacing
- `src/lib/coverage.js` — add Clark County to the `hasContext` (purple chip) set (memory `project_v170_complete`: surfacing target is coverage.js, NOT Landing.jsx).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- COUNTY district already loaded by Phase 158: id `f3708f34-6e23-4771-a8f7-44e400a23337`, geo_id `32003`, district_type `COUNTY`, label "Clark County", state likely 'NV' (verify casing in Wave-0 — county/state tiers per 158-CONTEXT casing rule).
- Deep-seed migration templates + headshot pipeline (`_tmp-*-headshots.py`) from phases 155–160 — directly adaptable.
- `essentials.governments` / `essentials.chambers` (official_count, generated slug — never INSERT slug) / `essentials.offices` / `essentials.politician_images` shapes confirmed across 159/160.

### Established Patterns
- Executor/orchestrator split: gsd-executor writes .sql/.py; inline orchestrator runs all DB probes, applies migrations (psql -f / supabase MCP), runs headshot script, runs audits.
- Section-split scan (0 rows) after seed; antipartisan (party stored, not displayed); chambers.slug GENERATED ALWAYS; politician_images columns = (id, politician_id, url, type, photo_license) — NO photo_origin_url.

### Integration Points
- Backend `/representatives/me` resolves county tier via PIP against the COUNTY geofence → returns the chamber's offices.
- `src/lib/coverage.js` drives the purple `hasContext` chip surfacing.

</code_context>

<specifics>
## Specific Ideas

- Headline correctness check: a Las Vegas Strip address returns the Clark County board with no empty LOCAL section and no section-split (Strip is unincorporated → county, no city).
- Chair-first ordering for the board (Kirkpatrick first), matching Multnomah display.
- Per-commissioner free-text district label ("District A".."District G") for clarity even though routing is county-wide.

</specifics>

<deferred>
## Deferred Ideas

- **Per-commission-district (A–G) geofences** for exact 1-commissioner-per-address routing — future enhancement if Clark County GIS commission-district polygons are ingested (would be the project's first non-TIGER custom geofences).
- **Clark County row officers** (Sheriff/LVMPD, District Attorney, Assessor, Clerk, Recorder, Treasurer, Public Administrator) — separate future phase if county-wide elected officers beyond the Commission are wanted.
- Mesquite (smallest incorporated Clark County city) — future Clark County wave (REQUIREMENTS Future).

### Reviewed Todos (not folded)
None — no pending todos matched this phase.

</deferred>

---

*Phase: 161-clark-county-commission-deep-seed*
*Context gathered: 2026-06-23*
