# Phase 164: North Las Vegas Deep-Seed - Context

**Gathered:** 2026-06-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Deep-seed the **City of North Las Vegas, Nevada** government and its **City Council** (directly-elected at-large **Mayor** + ward-elected council members) to Tier-1 depth: government → chamber → roster → 600×750 headshots → evidence-only compass stances → purple `hasContext` chip. Satisfies **CLARK-04**. Depends on Phase 158 (NV city geofences).

**In scope:** 1 standalone city government ("City of North Las Vegas, Nevada, US") + City Council chamber + offices (Mayor + ward council members; expected Mayor + 4 wards = 5 seats — Wave-0 verifies); **custom city-ward geofences** (new MTFCC) for ward-precise council routing, with a single-city fallback; headshots; evidence-only stances; surfacing in `src/lib/coverage.js` (add to the existing Nevada block — LV + Henderson already present).

**Out of scope:** North Las Vegas's elected **Municipal Court judges** (deferred to a future judicial-compass phase — parity with LV/Henderson scope), City Attorney / City Manager / non-elected offices; Boulder City (Phase 165); CCSD board (Phase 166); NV 2026 elections (Phase 167).
</domain>

<decisions>
## Implementation Decisions

This phase **carries forward the Henderson (Phase 163) deep-seed template wholesale** — operator confirmed "Carry forward all" in discussion. The decisions below mirror 163 with NLV-specific identifiers; Wave-0 research verifies the live roster, geo_id, ward polygons, and ID ranges.

### Ward routing granularity
- **D-01:** Build **custom non-TIGER North Las Vegas city-ward geofences** (one polygon per ward) so an NLV address returns its **one correct ward council member** (Success Criterion #1). Mirrors Phases 162/163: use a **new custom MTFCC** (LV claimed X0015, Henderson claimed X0016 — Wave-0 picks the next unclaimed X-code, likely **X0017**) and a `north-las-vegas-nv-council-ward-N` geo_id pattern; rely on the existing backend `X%`-catchall LOCAL routing (essentialsService.ts ~L646) — **no backend edit**. The at-large **Mayor** attaches to the **whole-city geofence** (NLV TIGER place polygon from Phase 158); each ward member attaches to its ward polygon. Sourcing the ward-boundary data is a Wave-0 research task (City of North Las Vegas GIS / Clark County GIS open data; ArcGIS MapServer like LV/Henderson, or other).
- **D-01b (fallback):** If Wave-0 **cannot source clean ward-boundary polygons** OR confirms NLV elects council **purely at-large with no ward representation**, fall back to the single-CITY-district model: attach all council members to the one NLV city geofence, show all (each labeled "Council Member, Ward N" if ward-residency applies), and **document ward-precise routing as deferred**. The phase still completes — do **not** hard-block the deep-seed. (Mirrors 161/162/163 safety net.)
- **Note on NLV mechanics:** NLV elects council members **by ward** (4 wards). Even where NV cities use citywide voting with ward-residency requirements, each resident has exactly **one** ward representative, so ward-precise routing remains the correct goal — Wave-0 confirms distinct wards exist and that polygons are sourceable.

### Office scope
- **D-02:** **Mayor + City Council only** this phase. North Las Vegas's **elected Municipal Court judges** are explicitly **deferred** to a future judicial-compass phase (parity with LV/Henderson). Keeps the NV city set consistent and avoids pulling in the 6-spoke judicial topic set.

### Mayor modeling
- **D-03:** Model the Mayor (currently **Pamela Goynes-Brown**, directly elected at-large, elected 2022 — Wave-0 verifies) as a **distinct directly-elected at-large seat within the City Council chamber** — "Mayor" title, attached to the **city-wide geofence**, **sorted first**. Chamber = Mayor + ward members (**expected 5 seats: Mayor + 4 wards**; `official_count` set to the verified count). **Explicitly NOT** rotational / title-on-seat. Carries forward LV's D-02 / Henderson's D-03.

### Government modeling + IDs
- **D-04:** Create a **standalone government "City of North Las Vegas, Nevada, US"** (mirrors "City of Las Vegas, Nevada, US" / "City of Henderson, Nevada, US" / "Clark County, Nevada, US"), **NOT** nested under the State of Nevada (geo_id 32) government. INSERT via `WHERE NOT EXISTS` (no geo_id unique constraint).
- **D-04b:** external_id block for the seats uses NV's negative scheme; exact range chosen by a **Wave-0 collision probe** (must not collide with: US House −32001..−32004; STATE_EXEC −3200001..−3200006; Senate −3203001..−3203021; Assembly −3204001..−3204042; Clark commissioners −3200301..−3200307; **LV city −3205001..−3205007**; **Henderson city −3206001..−3206005**). Likely a fresh **−3207xxx** block. Confirm the NLV city **geo_id** (TIGER place, expected FIPS **3251800**) loaded by Phase 158 + its casing in the same probe.

### Stance topic scope + headshots
- **D-05:** Research **all live compass topics** per official (standing rule), **one agent at a time** (parallel burns rate-limit quota), evidence-only / 100% cited / honest blank spokes / **zero default values** / chairs model (not polarity). No judicial topics (council members are not judges). Realistic depth where documented; honest blanks for thin records (esp. recently-seated members).
- **D-06:** Headshot sourcing chain — **`cityofnorthlasvegas.com`** (or `clarkcountynv.gov` where applicable) official council portraits first → on WAF/403, established workarounds (Chrome-UA curl, background-image grep) → free alternates (Wikimedia Commons with descriptive UA, official campaign, Ballotpedia) → **document a genuine gap** if none exist. NLV site sourcing behavior is **unknown** (clean Azure-blob like LV vs Akamai-403 like Henderson) — the fallback chain ensures the phase never hard-blocks on a photo gap. 600×750, crop-4:5 then resize, **no text/graphic overlays, no fabrication**, mirrored to Storage `politician_photos/{uuid}-headshot.jpg`. `photo_license` set at execution from the actual source.

### Claude's Discretion
- NLV ward-polygon data source + ingestion mechanism (Wave-0 research; adapt the LV/Henderson `load-*-ward-boundaries.ts` loader — likely an ArcGIS MapServer `f=json&outSR=4326` rings→GeoJSON load, with `ST_MakeValid` fallback for self-intersecting rings as Henderson ward 2 required).
- Exact new custom MTFCC for NLV wards (Wave-0 confirms next unclaimed X-code after X0016).
- Exact external_id range (Wave-0 probe + pick unused −3207xxx block).
- **Migration numbering: next migration is 1091** (Phase 163 registered structural 1084; headshot 1085 + stances 1086-1090 were audit-only/unregistered; ⚠ verify the live on-disk EV-Accounts `backend/migrations` MAX in Wave-0 — the v18.0-park drift previously pushed numbers past the registered ledger MAX; trust the highest on-disk file +1, not just `schema_migrations`). Migration split: structural (registered) + audit-only headshot + per-official stance migrations (audit-only), following the established deep-seed shape.
- Council chamber name (e.g., "North Las Vegas City Council") — planner's choice matching the official body name.
- Per-ward free-text "Council Member, Ward N" title for display clarity — recommended; planner decides.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirement + milestone conventions
- `.planning/ROADMAP.md` §"Phase 164: North Las Vegas Deep-Seed" — goal + 4 success criteria.
- `.planning/ROADMAP.md` §"Milestone-wide conventions (carry into every phase)" — deep-seed rules (Tier-1 unit, section-split scan, casing, antipartisan, 600×750, hasContext chip, stance evidence rules).
- `.planning/REQUIREMENTS.md` §"CLARK-04" — the requirement this phase satisfies.

### Primary analog — the immediately-prior NV city deep-seed (Henderson)
- `.planning/phases/163-henderson-deep-seed/163-CONTEXT.md` — the directly-parallel decision set (ward geofences, directly-elected Mayor, standalone government, stance/headshot conventions). **This phase is a near-clone.**
- `.planning/phases/163-henderson-deep-seed/163-PATTERNS.md`, `163-RESEARCH.md`, `163-VALIDATION.md` — ward-loader pattern (incl. `ST_MakeValid` for self-intersecting rings), structural-migration shape, headshot fallback-chain pipeline (RGBA→white-composite, 3× upscale of small Ballotpedia images), the 9-check E2E verification template.
- `.planning/phases/163-henderson-deep-seed/163-0{1,2,3}-SUMMARY.md` — executed results incl. WAF-403 per-member fallback chain, stance one-at-a-time flow, honest-blank handling, external_id→UUID capture step.

### Secondary analog — Las Vegas (clean-source counter-case)
- `.planning/phases/162-city-of-las-vegas-deep-seed/162-CONTEXT.md` + `162-PATTERNS.md` + `162-0{1,2,3}-SUMMARY.md` — LV's clean Azure-blob headshot path (the non-WAF case NLV may match), ward-loader origin, migration-renumber drift lesson.

### County analog + NV foundation
- `.planning/phases/161-clark-county-commission-deep-seed/161-CONTEXT.md` + `161-PATTERNS.md` — standalone-government template, single-district fallback, NV external_id scheme, ledger registration, executor/orchestrator split.
- `.planning/phases/158-*` (NV geofences) — NLV city G4110 place geofence (the at-large Mayor + single-city-fallback attach point); casing convention (`state='nv'` lowercase for district join keys; `governments.state`/`offices.representing_state` uppercase `NV`).
- `.planning/phases/160-nevada-legislature-seed-headshots/160-PATTERNS.md` — NV migration template; executor has NO supabase MCP (inline orchestrator applies migrations via `psql -f` using `C:/EV-Accounts/backend/.env` DATABASE_URL).

### Stance research + display + schema
- Memories: `feedback_stance_research_one_at_a_time`, `feedback_stance_research_all_topics`, `feedback_stance_no_default_value`, `feedback_compass_chairs_not_polarity`, `project_compass_live_topic_ids` (live topic IDs / retired IDs NOT to use), `project_stance_research_format`.
- Schema (confirmed in Phases 162/163): `inform.politician_answers` (politician_id, topic_id, value) / `inform.politician_context` (politician_id, topic_id, reasoning, sources) / `inform.compass_topics` (topic_key, is_live) / `inform.compass_stances` (value, text = the chairs). ON CONFLICT (politician_id, topic_id) DO UPDATE.
- `essentials.governments` (INSERT via `WHERE NOT EXISTS`) / `essentials.chambers` (`official_count`; slug GENERATED ALWAYS — never INSERT slug; name_formal non-empty) / `essentials.offices` (uniqueness guard `(district_id, politician_id)`) / `essentials.politician_images` (id, politician_id, url, type, photo_license — **no** photo_origin_url) / `essentials.districts` (uses `label`, no name_formal; `government_id` may be NULL — link via geo_id).

### Surfacing
- `src/lib/coverage.js` — add City of North Las Vegas to the **existing Nevada block** in COVERAGE_STATES (LV + Henderson already there with `hasContext:true`). Surfacing target is coverage.js, NOT Landing.jsx.
- Browse verification link convention: `essentials.empowered.vote/results?browse_geo_id=<NLV_geo_id>&browse_mtfcc=G4110`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `C:/EV-Accounts/backend/scripts/load-lv-ward-boundaries.ts` (Phase 162) + Henderson's ward loader (Phase 163) — the ward-geofence loader to adapt for NLV (ArcGIS `f=json&outSR=4326` rings→GeoJSON, `ST_Multi(ST_SetSRID(...))`, `ST_IsValid`/`ST_MakeValid` fallback). NLV city G4110 geofence already loaded by Phase 158 (Mayor / single-city-fallback attach point) — confirm geo_id + casing in Wave-0.
- Henderson `1084_*` structural migration (two-district-type: 1 LOCAL_EXEC Mayor + N LOCAL wards) — closest structural template; LV `1075_las_vegas_city_council.sql` is the original.
- Headshot pipeline `_tmp-henderson-headshots.py` / `_tmp-lv-city-council-headshots.py` (crop-4:5 → 600×750, runtime UUID resolve by external_id, RGBA→white-composite, x-upsert to Storage) — directly adaptable; NLV source-cleanliness TBD in Wave-0.

### Established Patterns
- Executor/orchestrator split: gsd-executor writes `.sql`/`.py`; inline orchestrator runs all DB probes, applies migrations (`psql -f`), runs the headshot script, runs audits (executor has NO supabase MCP).
- Section-split scan (0 rows) after seed; antipartisan (party stored, never displayed); `chambers.slug` GENERATED ALWAYS; `politician_images` has NO `photo_origin_url`; district join keys lowercase `state='nv'`.
- Custom ward MTFCC routes LOCAL via essentialsService.ts `X%`-catchall — no backend change.
- verify-gates grep whole files — keep `slug`/`schema_migrations`/`photo_origin_url` literals out of SQL comments.

### Integration Points
- Backend `/representatives/me` resolves tiers via PIP (ST_Covers) against geofences → returns the chamber's offices. Ward-precise routing requires the ward polygons to resolve to per-ward offices; the at-large Mayor resolves via the city-wide geofence. The single-city fallback resolves all seats via the one city geofence.
- `src/lib/coverage.js` drives the purple `hasContext` chip surfacing.

</code_context>

<specifics>
## Specific Ideas

- Headline correctness check: an NLV residential address returns the **Mayor + the one correct ward council member** (ward-precise routing), with no empty LOCAL section and no section-split. Under the fallback, it returns Mayor + all ward-labeled council members.
- Mayor sorted first in the council display; ward members in ward order.
- Per-ward free-text label ("Council Member, Ward 1..4" matching NLV's official ward naming) for display clarity.
- Verify the live NLV roster + seat count against cityofnorthlasvegas.com before the structural migration (operator checkpoint, as in LV/Henderson Plan 01).

</specifics>

<deferred>
## Deferred Ideas

- **North Las Vegas elected Municipal Court judges** — deferred to a future judicial-compass phase (6-spoke judicial topic set); out of scope here.
- **Single-city fallback as a permanent state** — only if Wave-0 ward-polygon sourcing fails or NLV is confirmed pure at-large; otherwise ward geofences are the goal.
- **Non-elected city offices** (City Attorney, City Manager) — out of scope, future phase if wanted.
- **Generalizing the ward-geofence pipeline** to Boulder City (Phase 165) if the NLV loader proves reusable (Boulder City is small and may be pure at-large — likely the single-city model).

### Reviewed Todos (not folded)
None — no pending todos matched this phase.

</deferred>

---

*Phase: 164-north-las-vegas-deep-seed*
*Context gathered: 2026-06-28*
