# Phase 165: Boulder City Deep-Seed - Context

**Gathered:** 2026-06-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Deep-seed the **City of Boulder City, Nevada** government and its **City Council** (directly-elected **Mayor** + **4 at-large** council members) to Tier-1 depth: government → chamber → roster → 600×750 headshots → evidence-only compass stances → purple `hasContext` chip. Satisfies **CLARK-05**. Depends on Phase 158 (NV city geofences — Boulder City G4110 place geofence geo_id `3206500` confirmed loaded).

**In scope:** 1 standalone city government ("City of Boulder City, Nevada, US") + City Council chamber + 5 offices (Mayor + 4 at-large council members — Wave-0 verifies the live roster/count); **single-city-district model** (all 5 on the one G4110 city geofence — Boulder City has **no wards**); headshots; evidence-only stances; surfacing in `src/lib/coverage.js` (add to the existing Nevada block — LV + Henderson + North Las Vegas already present).

**Out of scope:** Boulder City's elected **Municipal Court judge** (deferred to a future judicial-compass phase — parity with LV/Henderson/NLV scope); City Attorney / City Manager / Clerk / non-elected offices; CCSD board (Phase 166); NV 2026 elections (Phase 167). **No ward geofences / no custom ward MTFCC** (at-large city).
</domain>

<decisions>
## Implementation Decisions

This phase **carries forward the North Las Vegas (Phase 164) / Henderson (Phase 163) deep-seed template wholesale** — operator confirmed "Carry forward all" in discussion. The decisions below mirror 163/164 with Boulder-City-specific identifiers; **the one structural divergence is the at-large (no-ward) routing model**. Wave-0 research verifies the live roster, geo_id casing, and ID ranges before any write.

### Routing granularity (THE divergence from 162–164)
- **D-01:** **Single-city-district model is PRIMARY (not a fallback).** Boulder City elects its council **purely at-large** (confirmed: special-charter council/manager form, Mayor + 4 at-large members) — there are **no council wards**. All 5 members (Mayor + 4 council) attach to the **one existing Boulder City G4110 city geofence** (geo_id `3206500`, loaded by Phase 158). A Boulder City address returns the **Mayor + all 4 at-large council members** (no ward-precise routing — correct for an at-large city; no empty LOCAL section, no section-split).
- **D-01a:** **NO ward-boundary loader and NO custom ward MTFCC** this phase (unlike LV X0015 / Henderson X0016 / NLV X0017). Nothing to source — Boulder City has no wards. This removes the entire Wave-0 ward-polygon sourcing task and the `load-*-ward-boundaries.ts` loader from the plan.
- **D-01b:** The directly-elected **Mayor** and **all 4 council members** attach to the same G4110 geofence (`3206500`) but via the two district-type pattern: Mayor on a **LOCAL_EXEC** district, the 4 council members on a **LOCAL** district (both on geo_id `3206500`). Mirrors how prior phases attached the Mayor to the city-wide geofence — here the council members use the city-wide geofence too (no ward polygons). Planner confirms whether council members share one LOCAL district on `3206500` or each gets a distinct LOCAL office row on that shared district (recommend: one shared LOCAL district `3206500`, 4 council offices on it + 1 LOCAL_EXEC Mayor office) — must produce 0 section-split and an at-large "Council Member" label (no ward number).

### Mayor modeling
- **D-02:** Model the **Mayor** (directly elected at-large — Wave-0 verifies current officeholder) as a **distinct directly-elected at-large seat within the City Council chamber** — "Mayor" title, attached to the **LOCAL_EXEC** city-wide district (`3206500`), **sorted first**. Chamber = Mayor + 4 at-large council members (**expected 5 seats**; `official_count` set to the verified count). **Explicitly NOT** rotational / title-on-seat (Boulder City directly elects its Mayor on a separate ballot line). Carries forward LV D-02 / Henderson D-03 / NLV D-03.

### Office scope
- **D-03:** **Mayor + City Council only** this phase. Boulder City's **elected Municipal Court judge** is explicitly **deferred** to a future judicial-compass phase (parity with LV/Henderson/NLV — avoids pulling in the 6-spoke judicial topic set). Non-elected offices (City Attorney, City Manager, City Clerk) out of scope.

### Government modeling + IDs
- **D-04:** Create a **standalone government "City of Boulder City, Nevada, US"** (mirrors "City of Las Vegas/Henderson/North Las Vegas, Nevada, US" + "Clark County, Nevada, US"), **NOT** nested under the State of Nevada (geo_id 32) government. INSERT via `WHERE NOT EXISTS` (no geo_id/name unique constraint). Greenfield — Wave-0 confirmed no pre-existing Boulder City government.
- **D-04a:** Council member title is at-large **"Council Member"** (no ward number) — distinct from the "Council Member, Ward N" labels used in ward cities. Planner picks the exact display string; chamber name "Boulder City City Council" or "Boulder City Council" matching the official body name (planner's choice).
- **D-04b:** external_id block for the seats uses NV's negative scheme; Wave-0 collision probe confirmed the **−3208001..−3208005** block is free (next after LV −3205xxx, Henderson −3206xxx, NLV −3207xxx). Confirm the Boulder City **geo_id** = TIGER place FIPS **3206500** + its casing (`state='32'` on the geofence; district join keys `state='nv'` lowercase) in the same probe.

### Stance topic scope + headshots
- **D-05:** Research **all live compass topics** per official (standing rule), **one agent at a time** (parallel burns rate-limit quota), evidence-only / 100% cited / honest blank spokes / **zero default values** / chairs model (not polarity). No judicial topics (council members are not judges). **Boulder City emphasis (D-07):** flag the controlled-growth ordinance, the no-gambling charter, and the solar-land lease revenue as the richest local-evidence areas (esp. `growth-and-development`, `economic-development`, `taxes`, `local-environment`, `data-centers`) — but every placed stance still requires a cited Boulder-City-council statement/vote, not inference. Honest blanks for thin records.
- **D-06:** Headshot sourcing chain — **`bcnv.org` / `flybouldercity.com`** official council portraits first (Wave-0 confirms the site's WAF/serve behavior — unknown: clean vs Akamai-403) → established workarounds (Chrome-UA curl, background-image grep) → free alternates (Wikimedia Commons with descriptive UA, official campaign, Ballotpedia) → **document a genuine gap** if none exist. 600×750, crop-4:5 then resize (Lanczos q90), **no text/graphic overlays, no fabrication**, mirrored to Storage `politician_photos/{uuid}-headshot.jpg`. `photo_license` set at execution from the actual source. Visually spot-check each portrait for correct-person before insert.

### Boulder City specifics (flagged for stance emphasis)
- **D-07:** Boulder City's defining civic issues — the **Controlled Growth Ordinance** (voter-mandated annual residential building cap, a national landmark in growth control), the **no-gambling charter** (one of two NV cities banning gaming), and the **solar-energy land lease revenue** (Eldorado Valley leases fund the city) — are the richest sources of cited council positions. Research should lead with these for `growth-and-development`, `economic-development`, `taxes`, and `local-environment`/`data-centers`, while still sweeping all live topics.

### Claude's Discretion
- Exact council-office district structure under the single-city model (recommend: 1 shared LOCAL district on geo_id `3206500` carrying 4 at-large "Council Member" offices + 1 LOCAL_EXEC Mayor office on `3206500`; planner confirms it yields 0 section-split and correct display). No ward loader.
- Chamber name ("Boulder City City Council" vs "Boulder City Council") matching the official body.
- Exact external_id assignment within the confirmed −3208xxx block.
- **Migration numbering: next migration is 1100** (Phase 164 registered structural 1093; headshot 1094 + stances 1095–1099 were audit-only/unregistered). ⚠ Wave-0 verifies the live on-disk EV-Accounts `backend/migrations` MAX and trusts the highest on-disk file +1 (not just `schema_migrations`, which is timestamp-versioned). Migration split: structural (registered) + audit-only headshot + per-official stance migrations (audit-only), following the established deep-seed shape.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirement + milestone conventions
- `.planning/ROADMAP.md` §"Phase 165: Boulder City Deep-Seed" — goal + 4 success criteria.
- `.planning/ROADMAP.md` §"Milestone-wide conventions (carry into every phase)" — deep-seed rules (Tier-1 unit, section-split scan, casing, antipartisan, 600×750, hasContext chip, stance evidence rules).
- `.planning/REQUIREMENTS.md` §"CLARK-05" — the requirement this phase satisfies.

### Primary analog — the immediately-prior NV city deep-seed (North Las Vegas)
- `.planning/phases/164-north-las-vegas-deep-seed/164-CONTEXT.md` — the directly-parallel decision set (standalone government, directly-elected Mayor, stance/headshot conventions). **This phase is a near-clone MINUS the ward routing.**
- `.planning/phases/164-north-las-vegas-deep-seed/164-PATTERNS.md`, `164-RESEARCH.md`, `164-VALIDATION.md` — structural-migration shape, headshot fallback-chain pipeline, the 9-check E2E verification template, Wave-0 probe pattern. **Ignore the X0017 ward-loader sections — Boulder City has no wards.**
- `.planning/phases/164-north-las-vegas-deep-seed/164-0{1,2,3}-SUMMARY.md` — executed results: Wave-0 probe→roster checkpoint flow, structural migration (gov + chamber + 1 LOCAL_EXEC Mayor + LOCAL offices), headshot WAF/fallback + visual spot-check, stance one-at-a-time flow, honest-blank handling, the evidence-integrity lesson (verify roll-calls + project jurisdiction before attributing council-vote stances to individuals), external_id→UUID capture step.

### Single-city (no-ward) precedents
- `.planning/phases/161-clark-county-commission-deep-seed/161-CONTEXT.md` + `161-PATTERNS.md` — single-COUNTY-district pattern (all members attach to one district), standalone-government template, NV external_id scheme, ledger registration, executor/orchestrator split. The Boulder City single-city model is structurally closest to this (one shared district, multiple offices) rather than the ward cities.
- North Las Vegas D-01b fallback model (`164-CONTEXT.md` D-01b) — the single-city-district description, now the PRIMARY model here.

### NV foundation + migration mechanics
- `.planning/phases/158-*` (NV geofences) — Boulder City G4110 place geofence (geo_id `3206500`, the at-large attach point); casing convention (`state='nv'` lowercase for district join keys; `governments.state`/`offices.representing_state` uppercase `NV`; geofence `state='32'` FIPS).
- `.planning/phases/160-nevada-legislature-seed-headshots/160-PATTERNS.md` — NV migration template; **executor has NO supabase MCP** (inline orchestrator applies migrations via `psql -f` using `C:/EV-Accounts/backend/.env` DATABASE_URL; runs the headshot `.py`, all DB probes/audits).

### Stance research + display + schema
- Memories: `feedback_stance_research_one_at_a_time`, `feedback_stance_research_all_topics`, `feedback_stance_no_default_value`, `feedback_compass_chairs_not_polarity`, `project_compass_live_topic_ids` (live topic IDs / retired IDs NOT to use), `project_stance_research_format`, `project_phase164_complete` (the just-completed analog + evidence-integrity lesson).
- Schema (confirmed Phases 162–164): `inform.politician_answers` (politician_id, topic_id, value) / `inform.politician_context` (politician_id, topic_id, reasoning, sources) / `inform.compass_topics` (topic_key, is_live) / `inform.compass_stances` (value, text = the chairs). ON CONFLICT (politician_id, topic_id) DO UPDATE.
- `essentials.governments` (INSERT via `WHERE NOT EXISTS`) / `essentials.chambers` (`official_count`; auto-generated path column GENERATED ALWAYS — never INSERT it; name_formal non-empty) / `essentials.offices` (uniqueness guard `(district_id, politician_id)`) / `essentials.politician_images` (id, politician_id, url, type, photo_license — **no** image-origin column) / `essentials.districts` (uses `label`, no name_formal; `government_id` may be NULL — link via geo_id).

### Surfacing
- `src/lib/coverage.js` — add City of Boulder City to the **existing Nevada block** in COVERAGE_STATES (LV `3240000` + Henderson `3231900` + North Las Vegas `3251800` already there with `hasContext:true`). Surfacing target is coverage.js, NOT Landing.jsx.
- Browse verification link convention: `essentials.empowered.vote/results?browse_geo_id=3206500&browse_mtfcc=G4110`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Boulder City G4110 geofence (geo_id `3206500`, `state='32'`) already loaded by Phase 158 — the single at-large attach point. **No ward loader needed** (the `load-*-ward-boundaries.ts` scripts from 162–164 do NOT apply here).
- North Las Vegas `1093_north_las_vegas_city_council.sql` structural migration (two-district-type: 1 LOCAL_EXEC Mayor + LOCAL offices) — closest structural template; **adapt by dropping ward districts** (4 LOCAL ward rows → council members on the one shared LOCAL `3206500` district). Clark County `1055` single-district migration is the cleanest single-shared-district analog.
- Headshot pipeline `_tmp-north-las-vegas-council-headshots.py` (crop-4:5 → 600×750 Lanczos q90, runtime UUID resolve by external_id, RGBA→white-composite, descriptive-UA for Wikimedia, x-upsert to Storage) — directly adaptable; Boulder City site source-cleanliness TBD in Wave-0.
- Per-official stance migration shape `1095..1099_north_las_vegas_*_stances.sql` (VALUES(topic_key,val,reasoning,sources) → JOIN compass_topics is_live → INSERT answers/context ON CONFLICT) — copy verbatim.

### Established Patterns
- Executor/orchestrator split: gsd-executor writes `.sql`/`.py`; inline orchestrator runs all DB probes, applies migrations (`psql -f`), runs the headshot script, runs audits (executor has NO supabase MCP).
- Section-split scan (0 rows) after seed; antipartisan (party stored, never displayed); the chambers auto-generated path column is GENERATED ALWAYS; `politician_images` has NO image-origin column; district join keys lowercase `state='nv'`.
- verify-gates grep whole files — keep `slug`/`schema_migrations`/`photo_origin_url` literals out of SQL comments.
- Wave-0 BLOCKING probe + roster operator checkpoint BEFORE any migration applies (on-disk migration MAX, external_id collision, geo_id/casing, live roster against bcnv.org/Ballotpedia).

### Integration Points
- Backend `/representatives/me` resolves tiers via PIP (ST_Covers) against geofences → returns the chamber's offices. At-large model: all 5 offices resolve via the one Boulder City G4110 geofence — no ward polygons. The Mayor (LOCAL_EXEC) sorts first via groupHierarchy.js LOCAL_EXEC-before-LOCAL ordering.
- `src/lib/coverage.js` drives the purple `hasContext` chip surfacing.

</code_context>

<specifics>
## Specific Ideas

- Headline correctness check: a Boulder City residential address returns the **Mayor + all 4 at-large council members**, with no empty LOCAL section and no section-split. (No ward-precise routing — correct for an at-large city.)
- Mayor sorted first in the council display; council members listed after (at-large "Council Member" label, no ward number).
- Verify the live Boulder City roster + seat count against bcnv.org / flybouldercity.com / Ballotpedia before the structural migration (operator checkpoint, as in LV/Henderson/NLV Plan 01).
- Stance research leads with the Controlled Growth Ordinance, no-gambling charter, and solar-land lease revenue (D-07).

</specifics>

<deferred>
## Deferred Ideas

- **Boulder City elected Municipal Court judge** — deferred to a future judicial-compass phase (6-spoke judicial topic set); out of scope here.
- **Non-elected city offices** (City Attorney, City Manager, City Clerk) — out of scope, future phase if wanted.
- Ward-precise routing / ward geofences — **not applicable** to Boulder City (at-large); intentionally not built.

### Reviewed Todos (not folded)
None — no pending todos matched this phase.

</deferred>

---

*Phase: 165-boulder-city-deep-seed*
*Context gathered: 2026-06-29*
