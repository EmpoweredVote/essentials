# Phase 177: City of Hillsboro Deep-Seed - Context

**Gathered:** 2026-07-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Deep-seed the **City of Hillsboro, Oregon** (Washington County seat / largest WashCo city) to Tier-1 depth: city government (nested under State of Oregon) → **Mayor + City Council** roster → 600×750 headshots → evidence-only compass stances → **community banner** → purple `hasContext` chip in `src/lib/coverage.js` (Oregon block). Satisfies **WASH-03**.

**In scope:**
- 1 city government for Hillsboro (geo_id **4133850**, from v8.0 OR TIGER geofences — already present, no city-boundary load needed).
- 1 chamber (City Council, exact name verbatim from city) + the seated offices: **Mayor + council members** at the correct seat count and structure (verified at plan time — see D-01/D-02).
- **Custom `X00xx` ward geofences ONLY IF** Hillsboro councilors are elected *by ward voters* (verified at plan time; "who votes" tie-breaker — see D-02).
- Headshots; evidence-only stances (all live compass topics); **community horizon banner** (standing constraint since Phase 176); surfacing in `src/lib/coverage.js`.
- `offices.representing_city='Hillsboro'` set **inline in the structural migration** (Beaverton needed backfill mig 1141 — 177+ does it upfront).

**Out of scope:**
- Other WashCo cities: Tigard 178, Tualatin 179, Forest Grove 180, Sherwood 181, Cornelius 182.
- School boards (Phases 183–184; Hillsboro SD 1J board is Phase 183); 2026 elections + discovery (Phase 185); milestone close (186).
- Washington County Commission (done, Phase 175) and Beaverton (done, Phase 176).
- Hillsboro appointed boards/commissions and city-manager staff — elected officials only.

</domain>

<decisions>
## Implementation Decisions

### Form of government & council routing — VERIFY AT PLAN TIME (directive)
- **D-01:** Hillsboro's council structure is **NOT assumed from memory**. Hillsboro is commonly described as Mayor + 6 councilors tied to **3 wards (2 councilors per ward)** — but the routing branch is decided by the charter/municipal code ground-truthed from **hillsboro-oregon.gov** at plan time.
- **D-02:** **Tie-breaker rule: WHO VOTES decides routing, not residency.**
  - **If ward voters alone elect their councilors (ward-elected):** load **custom `X00xx` ward geofences BEFORE seeding** (Portland X0012 / LV / NLV X0017 / WashCo-district precedents). Each Hillsboro address then returns its ward's councilors + the Mayor.
  - **If the whole city votes for all seats (wards = residency requirement only):** **no new geofences** — model at-large on the existing city geo_id **4133850**, exactly like Beaverton, even though wards exist on paper. Ward geofences in this case would be actively wrong (they'd hide 4 of 6 councilors from every address).
- **D-03:** **If ward branch: one district per ward, 2 offices attached** (El Monte shared-district precedent). Seat identity lives on the office title, NOT on duplicate district rows — no duplicated polygons (split-section defect class).
- **D-04:** **Ward boundary source (ward branch only): official City of Hillsboro GIS or Washington County open-data portal ONLY.** Researcher locates the exact downloadable shapefile/GeoJSON at plan time. If no authoritative machine-readable file exists, that is a **blocker to surface**, not a license to hand-trace from PDF/Ballotpedia maps.
- **D-05:** Either branch must produce **no section-split** and **no empty LOCAL section** — one address returns the Mayor + the correct council representation.

### Mayor & leadership modeling — VERIFY AT PLAN TIME (directive)
- **D-06:** Mayor's role ground-truthed from the charter at plan time:
  - **If directly-elected citywide:** the exact **Beaverton 176 shape** — 2 citywide districts on geo_id 4133850, both `state='or'`: **LOCAL_EXEC district (Mayor)** + **LOCAL at-large district (councilors)**; Mayor sorts first (groupHierarchy.js). (If ward branch fires, the LOCAL districts are the ward polygons instead.)
  - **If council-member / rotating president:** seat-with-title on the council, **no LOCAL_EXEC** (avoids the Norwalk/Downey/Bellflower mis-seed class).
- **D-07:** **Council President / Vice Mayor = title-on-seat** if one exists — the designation rides on that councilor's office title, verified from the official site at plan time (Clark Chair Naft / Bellflower groupHierarchy precedent). No separate office row.

### Community banner (first inline city)
- **D-08:** **Subject: executor picks the best legally-licensed wide shot.** Priority hint: downtown/civic horizon (Main Street, Hillsboro Civic Center, Orenco Station) — but a clean license + crops-well-to-1700×540 beats subject preference. **Wikimedia Commons first, Unsplash fallback; NO AI-generated images; no baked-in text/graphics.** Follow `docs/banner-asset-pipeline.md` (`process_banner.py` → 1700×540 @ 3.15:1 → `upload_banner.py` → `cities/hillsboro.jpg`) + `CURATED_LOCAL` entry with attribution in `src/lib/buildingImages.js`.
- **D-09:** **Banner asset work lives in the final surfacing plan** (alongside coverage.js) — keeps the proven 5-plan deep-seed shape. `offices.representing_city='Hillsboro'` is set in the **structural** migration (the banner component derives its city from that field).

### Roster & body name — strict ground-truth (carried forward, confirmed)
- **D-10:** Researcher pulls the **seated roster + exact chamber/body name verbatim** from hillsboro-oregon.gov at plan time. No hardcoding names, seat count, or ward/position naming from memory — account for 2024 turnover. Researcher also **notes WAF status** of hillsboro-oregon.gov (Pomona/Downey/Glendale were 403; Palmdale/Norwalk were not) so the executor isn't surprised.

### Stance scope + headshots (carried forward, confirmed unchanged)
- **D-11:** All live compass topics per official, **one agent at a time**, evidence-only / 100% cited / honest blank spokes / **zero default values**; 18–21+ depth where the record supports it; skip judicial-* topics.
- **D-12:** Headshots from **hillsboro-oregon.gov** first; Ballotpedia/Wikimedia for genuine gaps only. Crop-to-4:5 **then** resize to **600×750** (Lanczos q90, no overlays), mirrored to Storage `politician_photos/{uuid}-headshot.jpg`; `photo_license` set at execution by actual source. Genuine gaps documented, no fabrication.

### Surfacing (locked)
- **D-13:** Add Hillsboro to the **Oregon block** of `COVERAGE_STATES` in `src/lib/coverage.js`: `{ label: 'Hillsboro', browseGovernmentList: ['4133850'], browseStateAbbrev: 'OR', hasContext: true }` — city entry next to Beaverton (line ~98).

### Claude's Discretion
- **Council office title labeling** — planner picks after seeing the official roster page (city-verbatim vs simplified; user explicitly deferred).
- **External_id block** — Wave-0 DB probe picks an unused OR range (Beaverton used -4105351..-4105357; a geo_id-derived block like -41338xx is the natural analog).
- **Next migration number** — Wave-0 confirms on-disk MAX (post-Beaverton counter was ≥1142; LA dedupe/rotational fixes consumed 1142–1145). On-disk counter is authoritative.
- **Custom `X00xx` mtfcc + district_type** — only if D-02 ward branch fires; Wave-0 finds next unused code.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirement + milestone conventions
- `.planning/ROADMAP.md` §"Phase 177: City of Hillsboro Deep-Seed" — goal + 4 success criteria.
- `.planning/ROADMAP.md` §"Milestone-wide conventions" (v20.0 block) — deep-seed rules incl. the **community banner standing constraint** and `representing_city` requirement, `'or'`/`'OR'` casing trap, districts have no `name_formal` / NULL `government_id`.
- `.planning/REQUIREMENTS.md` §"WASH-03" — the requirement this phase satisfies.

### Same-milestone precedent (PRIMARY analog — the just-completed sister city)
- `.planning/phases/176-city-of-beaverton-deep-seed/176-CONTEXT.md` — the Beaverton context this phase mirrors (verify-at-plan-time directives, stance/headshot locks).
- `.planning/phases/176-city-of-beaverton-deep-seed/176-0*-SUMMARY.md` — execution ground truth: Wave-0 probe shape (176-01), structural seed with LOCAL_EXEC + LOCAL districts (176-02, migration 1131), headshot pipeline (176-03), 7 stance migrations 1133–1139 (176-04), coverage.js surfacing (176-05).
- `C:/EV-Accounts/backend/migrations/1131_*.sql` (Beaverton structural) — closest adaptable template; plus mig **1141** (representing_city backfill — 177 does this inline instead).

### Custom non-TIGER ward geofences (only if D-02 ward branch)
- Custom `X00xx` precedents: Portland X0012; NLV X0017; WashCo commissioner districts (Phase 175, X0018). Find loaders: `grep -rl "X00" C:/EV-Accounts/backend/migrations/`.
- `.planning/phases/175-washington-county-commission-deep-seed/175-CONTEXT.md` — official-GIS-only boundary sourcing rule (D-05 there) + custom-district ingest shape.

### Banner pipeline
- `docs/banner-asset-pipeline.md` — process_banner.py → 1700×540 @ 3.15:1 → upload_banner.py → `cities/<slug>.jpg`.
- `src/lib/buildingImages.js` — `CURATED_LOCAL` entry + attribution (Beaverton entry from commit 12251c4 is the template).

### Stance research + display
- Memories: [[feedback_stance_research_one_at_a_time]], [[feedback_stance_research_all_topics]], [[feedback_stance_no_default_value]], [[feedback_compass_chairs_not_polarity]], [[project_compass_live_topic_ids]], [[project_stance_research_format]].
- Schema: `inform.politician_answers` / `inform.compass_topics` (topic_key, is_live) / `inform.compass_stances` (chairs); topic_id resolved LIVE via JOIN on topic_key AND is_live=true; ON CONFLICT (politician_id, topic_id).

### Surfacing
- `src/lib/coverage.js` — Oregon block of `COVERAGE_STATES` (Beaverton entry line ~98 is the exact template; browse via `browseGovernmentList`).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **City geo_id 4133850** already loaded by v8.0 OR TIGER geofences (verify id/casing in Wave-0 — `districts.state` is `'or'` lowercase for city tiers).
- Beaverton migration 1131 (structural), 1132 (headshots), 1133–1139 (stances) — directly adaptable same-milestone templates.
- Deep-seed headshot pipeline (`_tmp-*-headshots.py`, backend/scripts/_* gitignored) — directly reusable.
- Banner pipeline scripts (`scripts/banners/process_banner.py`, `upload_banner.py`) — proven on Beaverton.
- `essentials.governments` (WHERE NOT EXISTS — no geo_id unique constraint) / `essentials.chambers` (official_count here; **slug GENERATED — never INSERT**) / `essentials.offices` (incl. `representing_city`) / `essentials.politician_images` (id, politician_id, url, type, photo_license — **NO photo_origin_url**).

### Established Patterns
- **Executor/orchestrator split:** gsd-executor writes `.sql`/`.py`; inline orchestrator runs DB probes, applies migrations via `psql -f` with `C:/EV-Accounts/backend/.env` DATABASE_URL (executor has NO DB), runs headshot/banner scripts, runs audits.
- Proven 5-plan deep-seed shape: Wave-0 probes → structural → headshots → stances (one agent at a time) → surfacing (+banner, this phase).
- Section-split scan (0 rows) after seed; antipartisan (party stored, never displayed); Mayor-first via groupHierarchy.js.
- Stance migrations bypass `schema_migrations` → on-disk counter authoritative; structural migrations register normally.
- Verify-gates grep whole files — keep `slug`/`schema_migrations`/`photo_origin_url` out of comments.

### Integration Points
- Backend `/representatives/me` PIP resolution: Mayor + at-large council via city geofence 4133850; ward councilors (if ward branch) via new custom `X00xx` polygons — confirm district_type/state casing matches the backend query.
- `src/lib/coverage.js` Oregon block drives the purple chip + browse link; `src/lib/buildingImages.js` CURATED_LOCAL drives the banner; `offices.representing_city` drives banner city derivation.

</code_context>

<specifics>
## Specific Ideas

- Headline correctness check: a Hillsboro address returns the Mayor + the correct council representation — no empty LOCAL section, no section-split.
- Mayor-first ordering, matching Beaverton/Portland display.
- Live browse link at completion: `essentials.empowered.vote/results?browse_geo_id=4133850&browse_mtfcc=G4110` ([[feedback_provide_city_browse_links]]).
- Banner should render on the Local section for Hillsboro browse immediately (representing_city set inline — no backfill).
- Tailwind/Render hygiene: no raw Windows `\` paths in committed files ([[feedback_tailwind_scans_planning_md]]).

</specifics>

<deferred>
## Deferred Ideas

- Remaining west-metro cities (Tigard 178 … Cornelius 182), school boards incl. Hillsboro SD 1J (183–184), 2026 elections + discovery (185) — already scoped as their own phases.
- Hillsboro appointed boards/commissions and city-manager staff — not elected officials; out of scope.

### Reviewed Todos (not folded)
None — no pending todos matched this phase.

</deferred>

---

*Phase: 177-city-of-hillsboro-deep-seed*
*Context gathered: 2026-07-01*
