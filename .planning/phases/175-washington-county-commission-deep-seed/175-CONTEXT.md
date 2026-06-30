# Phase 175: Washington County Commission Deep-Seed - Context

**Gathered:** 2026-06-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Deep-seed the **Washington County, Oregon** government and its **Board of Commissioners** (Chair + 4 district commissioners = 5 seats) to Tier-1 depth: standalone county government → roster → 600×750 headshots → evidence-only compass stances → purple `hasContext` chip. Satisfies **WASH-01**.

**In scope:**
- 1 standalone county government `'Washington County, Oregon, US'` (NOT nested under State of Oregon).
- 1 chamber (the Board) + 5 offices: the at-large **County Chair** + 4 **district commissioners (Districts 1–4)**.
- **Custom per-district geofences (Districts 1–4)** so each WashCo address routes to its one matched commissioner (divergence from Multnomah/Clark — see D-02).
- Headshots; evidence-only stances; surfacing in `src/lib/coverage.js`.

**Out of scope:**
- City governments (Beaverton 176, Hillsboro 177, Tigard 178, Tualatin 179, Forest Grove 180, Sherwood 181, Cornelius 182).
- School boards (Phases 183–184); 2026 elections + discovery (Phase 185).
- Washington County **row officers** (Sheriff, DA, Assessor, Clerk, Treasurer, etc.) — not the Commission; deferred.
- Metro regional government (tri-county) — separate body, deferred.

</domain>

<decisions>
## Implementation Decisions

### Chair modeling
- **D-01:** Washington County's Chair is **directly elected county-wide** (at-large), like Multnomah's Chair — NOT board-rotated like Clark's chair-who-is-also-a-district-commissioner. Model the Chair exactly per **Multnomah migration 244**: a distinct 5th **"County Chair"** office, `role_canonical` NULL, **no separate LOCAL_EXEC**, Chair sorts first in display (groupHierarchy.js Chair-first). The 4 district commissioners are the other 4 seats. Total = **5 offices**.

### Routing granularity — PER-DISTRICT (divergence from precedent)
- **D-02:** Build **custom per-district geofences for Districts 1–4** so each WashCo address returns its **one** matched district commissioner — diverging from the Multnomah/Clark single-county-district model. The mechanism is NOT first-of-kind: it reuses the established **custom `X00xx` ward-geofence ingest** (Portland X0012 / Las Vegas / North Las Vegas X0017 precedents).
- **D-03:** The **Chair routes county-wide** — its office links to the existing **COUNTY district (geo_id 41067**, state `'or'` lowercase, from v8.0 OR geofences). The Chair returns for **every** WashCo address.
- **D-04:** Net behavior: a single WashCo address returns **Chair (county-wide) + exactly 1 district commissioner (1 of 4)**. No section-split; no empty LOCAL section.
- **D-05:** Boundary **source = official Washington County GIS** (county open-data portal). Researcher locates the exact downloadable file (shapefile/GeoJSON) for the 4 commissioner districts; planner assigns a custom `X00xx` mtfcc + the district_type/label/GEOID scheme before any load. Authoritative + current — no Census/TIGER fallback (TIGER does not carry county-commission districts).

### Roster & body name
- **D-06:** Researcher **ground-truths the live roster** (Chair + Districts 1–4) **and the exact official body name** verbatim from washingtoncountyor.gov at plan time — **no hardcoding names or board name from memory** (roster turnover, e.g. 2024 elections, may have occurred). Name the chamber exactly as the county labels it (likely "Board of Commissioners" or "Board of County Commissioners" — verify; do NOT assume).

### Stance scope + headshots (carried-forward, locked)
- **D-07:** Research **all live compass topics** per official (standing rule), **one agent at a time** ([[feedback_stance_research_one_at_a_time]]), evidence-only / 100% cited / honest blank spokes / **zero default values** ([[feedback_stance_no_default_value]], [[feedback_compass_chairs_not_polarity]]). Aim for the 18–21+ depth of prior deep-seeds, not a local-only subset.
- **D-08:** Headshots from **washingtoncountyor.gov** commissioner pages; crop-to-4:5 then resize to **600×750** (Lanczos, no text/graphic overlays), mirrored to Storage `politician_photos/{uuid}-headshot.jpg`. `photo_license` set at execution by the actual source (likely `us_government_work`). Genuine gaps documented, no fabrication.

### Claude's Discretion / Wave-0 probes
- **External_id range** for the 5 officials in OR's negative scheme — Wave-0 DB probe to pick an unused block (Multnomah used -410001 Chair + -410010..-410013 commissioners; pick a non-colliding OR range).
- **Next migration number** — best estimate **1118** (highest on disk = 1117); confirm DB ledger MAX in Wave-0. Migration split: structural (gov + chamber + 5 offices + custom district geofences) + audit-only headshots + per-official stance migrations, per established deep-seed shape.
- **Custom `X00xx` mtfcc code + district_type** for the 4 commission-district geofences — Wave-0 finds the next unused code; planner decides district_type.
- Whether commissioner offices carry a free-text district label ("Commissioner, District 1"..) for display clarity — recommended; planner decides.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirement + milestone conventions
- `.planning/ROADMAP.md` §"Phase 175: Washington County Commission Deep-Seed" — goal + 4 success criteria.
- `.planning/ROADMAP.md` §"Milestone-wide conventions" — deep-seed rules (section-split scan, casing, antipartisan, stance evidence rules).
- `.planning/REQUIREMENTS.md` §"WASH-01" — the requirement this phase satisfies.

### County-government precedent (PRIMARY analog — same state)
- `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql` — the exact same-state model: standalone `'Multnomah County, Oregon, US'` (type='County', state='OR', city=NULL, geo_id 41051); chamber 'Board of Commissioners'; COUNTY district state `'or'` lowercase; **Chair (-410001) modeled as a "County Chair" office, role_canonical NULL** + 4 commissioners (-410010..-410013), all offices on the COUNTY district. **This settles D-01.**
- `C:/EV-Accounts/backend/migrations/245_multnomah_county_headshots.sql` — headshot migration shape (multco.us source pattern).
- Memory [[project_phase83_uat_issues]] — COUNTY section placement + Multnomah Chair-first ordering ground truth.

### County deep-seed procedure (the v18.0 template)
- `C:/EV-Accounts/backend/migrations/1055_clark_county_commission.sql` — county deep-seed migration template: idempotent district guard, office NOT EXISTS guard on **(district_id, politician_id)**, in-migration DO-block gating (gov + offices + 0 section-split), governments has NO unique constraint on geo_id → WHERE NOT EXISTS required.
- Memory [[project_phase161_complete]] — Clark County county-government pattern, coverage.js COVERAGE_COUNTIES surfacing, psql `-f` apply (executor has no DB), stance ON CONFLICT shape.

### Custom non-TIGER district geofences (for D-02 per-district polygons)
- Custom `X00xx` ward-geofence precedents (the reusable ingest mechanism): Portland X0012; Las Vegas / North Las Vegas X0017 (memory [[project_phase164_complete]] — "X0017 wards (GISMO PLACE=80)"). Find loaders via: `grep -rl "X00" C:/EV-Accounts/backend/migrations/`.
- `C:/EV-Accounts/backend/migrations/254_or_school_districts.sql` — recent OR custom-district + board pattern (zone-based geofences for OR districts).
- Phase 174 (`.planning/phases/174-west-metro-school-district-geofences/`) — most recent OR geofence loader work (TIGER UNSD); review for the OR geofence loader key conventions (`cd119` not `cd`) and section-split gate.

### Stance research + display
- Memories: [[feedback_stance_research_one_at_a_time]], [[feedback_stance_research_all_topics]], [[feedback_stance_no_default_value]], [[feedback_compass_chairs_not_polarity]], [[project_compass_live_topic_ids]] (live topic IDs / retired IDs not to use), [[project_stance_research_format]].
- Schema: `inform.politician_answers` (stances), `inform.compass_topics` (topic_key/is_live), `inform.compass_stances` (chairs) — confirmed shapes in [[project_phase155_norwalk_complete]]; topic_id resolved LIVE via JOIN on topic_key AND is_live=true; ON CONFLICT (politician_id, topic_id).

### Surfacing
- `src/lib/coverage.js` — add Washington County to the **COVERAGE_COUNTIES** block with `hasContext:true` (purple chip). Browse link uses `browse_government_list` + `browse_skip_overlap=1` (memory [[project_v170_complete]]: surfacing target is coverage.js, NOT Landing.jsx).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **COUNTY district geo_id 41067** already loaded by v8.0 OR TIGER geofences (state `'or'` lowercase, district_type COUNTY) — Chair office links here; verify exact id/casing in Wave-0.
- Multnomah migration 244/245 + Clark 1055/1056 are directly adaptable templates (gov + chamber + offices + headshots).
- Custom `X00xx` ward-geofence loaders (Portland/LV/NLV) are the adaptable mechanism for the 4 commission-district polygons.
- Deep-seed headshot pipeline (`_tmp-*-headshots.py`) from phases 159–164 — directly reusable.
- `essentials.governments` / `essentials.chambers` (official_count; **slug GENERATED ALWAYS — never INSERT slug**) / `essentials.offices` / `essentials.politician_images` (columns: id, politician_id, url, type, photo_license — **NO photo_origin_url**) shapes confirmed across 159–164.

### Established Patterns
- **Executor/orchestrator split:** gsd-executor writes `.sql`/`.py`; inline orchestrator runs all DB probes, applies migrations via `psql -f` using `C:/EV-Accounts/backend/.env` DATABASE_URL (executor has NO DB / no supabase MCP), runs headshot script, runs audits.
- Section-split scan (0 rows) after seed; antipartisan (party stored, never displayed); Chair-first display via groupHierarchy.js.
- Stance migrations apply via raw SQL and never register in `schema_migrations` → on-disk file counter is authoritative.
- Verify-gates grep whole files — keep `slug`/`schema_migrations`/`photo_origin_url` out of comments ([[project_phase159_complete]]).

### Integration Points
- Backend `/representatives/me` resolves tiers via PIP: Chair via the COUNTY geofence (41067); the 4 commissioners via the new custom per-district polygons. Confirm the backend district-resolution query matches the chosen district_type/state casing for the custom polygons.
- `src/lib/coverage.js` COVERAGE_COUNTIES drives the purple `hasContext` chip + browse link.

</code_context>

<specifics>
## Specific Ideas

- Headline correctness check: an unincorporated Washington County address returns the County Chair + that address's specific District commissioner — no empty LOCAL section, no section-split.
- Chair-first ordering on the board (County Chair first), matching Multnomah display.
- Per-commissioner free-text district label ("District 1".."District 4") for display clarity even though Chair routes county-wide.
- Tailwind/Render hygiene: avoid raw Windows `\` paths in committed files ([[feedback_tailwind_scans_planning_md]]); Render dns-result-order=verbatim ([[project_render_dns_fix]]).

</specifics>

<deferred>
## Deferred Ideas

- **Washington County row officers** (Sheriff, District Attorney, Assessor, Clerk, Treasurer, etc.) — separate future phase if county-wide elected officers beyond the Commission are wanted (mirrors Clark deferral).
- **Metro regional government** (tri-county Metro Council) — distinct regional body; separate future phase.

### Reviewed Todos (not folded)
None — no pending todos matched this phase.

</deferred>

---

*Phase: 175-washington-county-commission-deep-seed*
*Context gathered: 2026-06-30*
