# Phase 176: City of Beaverton Deep-Seed - Context

**Gathered:** 2026-06-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Deep-seed the **City of Beaverton, Oregon** (the flagship west-metro city) to Tier-1 depth: city government (nested under State of Oregon) → **Mayor + City Council** roster → 600×750 headshots → evidence-only compass stances → purple `hasContext` chip in `src/lib/coverage.js` (Oregon block). Satisfies **WASH-02**.

**In scope:**
- 1 city government for Beaverton (geo_id **4105350**, from v8.0 OR TIGER geofences — already present, no city-boundary load needed).
- 1 chamber (City Council) + the seated offices: **Mayor + council members** at the correct seat count and structure (verified at plan time — see D-01/D-02).
- **Custom `X00xx` ward geofences ONLY IF** Beaverton elects councilors by geographic district/ward (verified at plan time; Portland X0012 precedent).
- Headshots; evidence-only stances (all live compass topics); surfacing in `src/lib/coverage.js`.

**Out of scope:**
- Other WashCo cities: Hillsboro 177, Tigard 178, Tualatin 179, Forest Grove 180, Sherwood 181, Cornelius 182.
- School boards (Phases 183–184); 2026 elections + discovery (Phase 185); milestone close (186).
- Washington County Commission (already done in Phase 175 / WASH-01).
- Any Beaverton appointed boards/commissions or the city-manager staff org — elected officials (Mayor + Council) only.

</domain>

<decisions>
## Implementation Decisions

### Form of government & council routing — VERIFY AT PLAN TIME (directive)
- **D-01:** Beaverton's council election structure (**at-large / by-position vs ward/district**) is **NOT assumed from memory** — Beaverton passed a new charter in **November 2020**, so the current form must be ground-truthed from **beavertonoregon.gov** (charter + council pages) at plan time. Roadmap explicitly flags this ("form of government verified at plan time — ward vs at-large").
- **D-02:** Routing branch, decided by what D-01 finds:
  - **If ward/district-elected (geographic):** load **custom `X00xx` ward geofences BEFORE seeding** — reuse the established custom ward-geofence ingest (Portland X0012 / Las Vegas / North Las Vegas X0017 precedents). Each Beaverton address then returns its **one** matched councilor (+ Mayor city-wide). Researcher locates the authoritative ward-boundary file (official City of Beaverton / Washington County GIS); planner assigns the custom `X00xx` mtfcc + district_type/label/GEOID scheme before any load.
  - **If at-large or by-position (numbered seats, city-wide vote):** **no new geofences** — every council seat links to the existing **city geo_id 4105350** and returns for **every** Beaverton address.
- **D-03:** Either branch must produce **no section-split** and **no empty LOCAL section** — one address returns the Mayor + the correct council representation.

### Mayor modeling — VERIFY AT PLAN TIME (directive)
- **D-04:** The Mayor's role is ground-truthed from the charter/official site (the 2020 charter may have altered the executive structure toward council-manager). Model per what the charter says:
  - **If directly-elected executive:** distinct **LOCAL_EXEC** "Mayor" office, sorts **first** in display (Portland/Multnomah Mayor-first via groupHierarchy.js). Researcher also confirms whether the Mayor votes on council.
  - **If council-member / rotating council president:** model as a **seat-with-title on the council**, **no separate LOCAL_EXEC** (avoids the Norwalk/Downey/Bellflower LOCAL_EXEC mis-seed).
- **D-05:** Default working expectation is directly-elected executive (Beaverton historically had a strong directly-elected Mayor), but this is **subordinate to what the charter actually says** — do not seed the office type until verified.

### Roster & body name — strict ground-truth
- **D-06:** Researcher pulls the **seated roster + exact chamber/body name verbatim** from beavertonoregon.gov at plan time. **No hardcoding** names or seat count from memory — account for 2024 turnover. Name the chamber exactly as the city labels it (verify; do NOT assume "City Council" wording, seat numbering, or Mayor-Pro-Tem/Council-President title).

### Stance scope + headshots (carried-forward, locked)
- **D-07:** Research **all live compass topics** per official (standing rule), **one agent at a time** ([[feedback_stance_research_one_at_a_time]]), evidence-only / 100% cited / honest blank spokes / **zero default values** ([[feedback_stance_no_default_value]], [[feedback_compass_chairs_not_polarity]]). Aim for the **18–21+** depth of prior deep-seeds, not a local-only subset ([[feedback_stance_research_all_topics]]).
- **D-08:** Headshots from **beavertonoregon.gov** (mayor/council pages); fallback to Ballotpedia/Wikimedia for genuine gaps only. Crop-to-4:5 **then** resize to **600×750** (Lanczos, no text/graphic overlays), mirrored to Storage `politician_photos/{uuid}-headshot.jpg`. `photo_license` set at execution by the actual source. Genuine gaps documented, no fabrication.

### Surfacing (locked)
- **D-09:** Add Beaverton to the **Oregon block** of `src/lib/coverage.js` `COVERAGE_STATES` with `{ label: 'Beaverton', browseGovernmentList: ['4105350'], browseStateAbbrev: 'OR', hasContext: true }` (purple chip). This is a **city** entry (COVERAGE_STATES → Oregon.areas), NOT a county entry. Confirmed Beaverton is not yet present.

### Claude's Discretion / Wave-0 probes
- **External_id range** for the Beaverton officials in OR's negative scheme — Wave-0 DB probe to pick an unused block (Multnomah used -410xxx; Portland its own range; pick a non-colliding OR city range).
- **Next migration number** — best estimate **1127** (highest on disk = 1126; confirmed 2026-06-30). Confirm DB ledger MAX in Wave-0. Migration split follows the deep-seed shape: structural (gov + chamber + offices [+ custom ward geofences if D-02 ward branch]) + audit-only headshots + per-official stance migrations.
- **Custom `X00xx` mtfcc + district_type** — only if D-02 resolves to the ward branch; Wave-0 finds the next unused code; planner decides district_type/label.
- Whether council offices carry a free-text seat/district label for display clarity — recommended if ward-based; planner decides.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirement + milestone conventions
- `.planning/ROADMAP.md` §"Phase 176: City of Beaverton Deep-Seed" — goal + 4 success criteria.
- `.planning/ROADMAP.md` §"Milestone-wide conventions" — deep-seed rules (section-split scan, casing, antipartisan, stance evidence rules).
- `.planning/REQUIREMENTS.md` §"WASH-02" — the requirement this phase satisfies (form-of-government-verified clause).

### Same-milestone precedent (PRIMARY analog — the just-completed template)
- `.planning/phases/175-washington-county-commission-deep-seed/175-CONTEXT.md` — the immediately-prior WashCo deep-seed context; same executor/orchestrator split, Wave-0 probes, verify-at-plan-time directive pattern, stance/headshot locks.
- Memory [[project_phase175_complete]] — WashCo close: standalone govt pattern, migs 1120–1126, next migration 1127, section-split gates.

### City deep-seed migration templates
- `C:/EV-Accounts/backend/migrations/` OR city migrations (Portland deep-seed; memory [[project_or_geofences_complete]] Portland geo_id 4159000) — closest same-state **city** analog for a Mayor + Council government under State of Oregon.
- `C:/EV-Accounts/backend/migrations/1055_clark_county_commission.sql` + Clark headshots — deep-seed migration mechanics: idempotent guards, office NOT EXISTS on **(district_id, politician_id)**, in-migration DO-block gating (gov + offices + 0 section-split), governments has NO unique constraint on geo_id → `WHERE NOT EXISTS` required.
- Memory [[project_phase156_bellflower_complete]] / [[project_phase155_norwalk_complete]] — LOCAL_EXEC Mayor mis-seed → At-Large conversion gotcha; rotational-vs-directly-elected Mayor verification; groupHierarchy.js Mayor > MPT ordering + label.

### Custom non-TIGER ward geofences (only if D-02 ward branch)
- Custom `X00xx` ward-geofence precedents (reusable ingest): Portland X0012; Las Vegas / North Las Vegas X0017 (memory [[project_phase164_complete]] — "X0017 wards (GISMO PLACE=80)"). Find loaders: `grep -rl "X00" C:/EV-Accounts/backend/migrations/`.
- `.planning/phases/174-west-metro-school-district-geofences/` — most recent OR geofence loader work (TIGER UNSD); OR geofence loader key conventions (`cd119` not `cd`) + section-split gate.

### Stance research + display
- Memories: [[feedback_stance_research_one_at_a_time]], [[feedback_stance_research_all_topics]], [[feedback_stance_no_default_value]], [[feedback_compass_chairs_not_polarity]], [[project_compass_live_topic_ids]] (live topic IDs / retired IDs not to use), [[project_stance_research_format]].
- Schema: `inform.politician_answers` (stances), `inform.compass_topics` (topic_key/is_live), `inform.compass_stances` (chairs) — confirmed shapes in [[project_phase155_norwalk_complete]]; topic_id resolved LIVE via JOIN on topic_key AND is_live=true; ON CONFLICT (politician_id, topic_id).

### Surfacing
- `src/lib/coverage.js` — Oregon block of `COVERAGE_STATES` (add Beaverton city entry, geo_id 4105350, `hasContext:true`). Browse link uses `browseGovernmentList` (memory [[project_v170_complete]]: surfacing target is coverage.js, NOT Landing.jsx).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **City geo_id 4105350** already loaded by v8.0 OR TIGER geofences (memory [[project_beaverton_or_recon]]: "Beaverton geo_id=4105350 (NOT 4105000)") — city-wide council seats + Mayor link here; verify exact id/casing in Wave-0.
- WashCo 175 + Clark 1055/1056 + Portland OR city migrations are directly adaptable templates (gov + chamber + offices + headshots).
- Custom `X00xx` ward-geofence loaders (Portland/LV/NLV) are the adaptable mechanism IF Beaverton is ward-based.
- Deep-seed headshot pipeline (`_tmp-*-headshots.py`) from phases 159–164 — directly reusable (backend/scripts/_* gitignored).
- `essentials.governments` / `essentials.chambers` (official_count; **slug GENERATED ALWAYS — never INSERT slug**) / `essentials.offices` / `essentials.politician_images` (columns: id, politician_id, url, type, photo_license — **NO photo_origin_url**) shapes confirmed across 159–175.

### Established Patterns
- **Executor/orchestrator split:** gsd-executor writes `.sql`/`.py`; inline orchestrator runs all DB probes, applies migrations via `psql -f` using `C:/EV-Accounts/backend/.env` DATABASE_URL (executor has NO DB / no supabase MCP), runs headshot script, runs audits.
- Section-split scan (0 rows) after seed; antipartisan (party stored, never displayed); Mayor-first display via groupHierarchy.js.
- Stance migrations apply via raw SQL and never register in `schema_migrations` → on-disk file counter is authoritative.
- Verify-gates grep whole files — keep `slug`/`schema_migrations`/`photo_origin_url` out of comments ([[project_phase159_complete]]).

### Integration Points
- Backend `/representatives/me` resolves tiers via PIP: Mayor + city-wide council via the city geofence (4105350); ward councilors (if ward branch) via new custom `X00xx` polygons. Confirm the backend district-resolution query matches the chosen district_type/state casing for any custom polygons.
- `src/lib/coverage.js` Oregon block drives the purple `hasContext` chip + browse link.

</code_context>

<specifics>
## Specific Ideas

- Headline correctness check: a Beaverton address returns the Mayor + the correct council representation — no empty LOCAL section, no section-split.
- Mayor-first ordering on the council, matching Portland/Multnomah display.
- Live browse link at completion: `essentials.empowered.vote/results?browse_geo_id=4105350&browse_mtfcc=G4110` ([[feedback_provide_city_browse_links]]).
- Tailwind/Render hygiene: avoid raw Windows `\` paths in committed files ([[feedback_tailwind_scans_planning_md]]); Render dns-result-order=verbatim ([[project_render_dns_fix]]).

</specifics>

<deferred>
## Deferred Ideas

- Other west-metro cities (Hillsboro 177 … Cornelius 182), school boards (183–184), 2026 elections + discovery (185) — already scoped as their own phases.
- Beaverton appointed boards/commissions and city-manager staff — not elected officials; out of scope for this deep-seed.

### Reviewed Todos (not folded)
None — no pending todos matched this phase.

</deferred>

---

*Phase: 176-city-of-beaverton-deep-seed*
*Context gathered: 2026-06-30*
