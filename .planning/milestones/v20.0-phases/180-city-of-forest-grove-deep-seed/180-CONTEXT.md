# Phase 180: City of Forest Grove Deep-Seed - Context

**Gathered:** 2026-07-03
**Status:** Ready for planning

> **Note:** The four Forest Grove-specific gray areas (D-14 through D-17 below) were resolved with
> the recommended option because the user was AFK when presented. Each follows established milestone
> precedent (and D-14 folds in the 179-REVIEW template fixes). Amend before planning if a different
> call is wanted.

<domain>
## Phase Boundary

Deep-seed the **City of Forest Grove, Oregon** to Tier-1 depth: city government (nested under State of Oregon) → **Mayor + City Council** roster → 600×750 headshots → evidence-only compass stances → **community banner** → purple `hasContext` chip in `src/lib/coverage.js` (Oregon block). Satisfies **WASH-06**.

**In scope:**
- 1 city government for Forest Grove (ROADMAP states geo_id **4126200** — MUST be Wave-0-verified before use; 2 of 6 stated geo_ids this milestone were wrong: Hillsboro and Tualatin).
- 1 chamber (exact name verbatim from the city) + the seated offices: **Mayor + council members** at the correct seat count and structure (verified at plan time — see D-01/D-02).
- **Custom `X00xx` ward geofences ONLY IF** Forest Grove councilors are elected *by ward/district voters* (verified at plan time; "who votes" tie-breaker — see D-02). Note: Beaverton (176), Tigard (178), and Tualatin (179) all resolved to pure at-large; Forest Grove gets the same verification, not the same assumption.
- Headshots; evidence-only stances (all live compass topics); **community horizon banner** (standing constraint since Phase 176); surfacing in `src/lib/coverage.js`.
- `offices.representing_city='Forest Grove'` set **inline in the structural migration** (177+ convention — no backfill).
- **Two template hardening fixes from 179-REVIEW applied to this phase's pipeline artifacts** (see D-14).

**Out of scope:**
- Other WashCo cities: Sherwood 181, Cornelius 182.
- School boards (Phases 183–184; Forest Grove SD 15 board is Phase 184); 2026 elections + discovery (Phase 185); milestone close (186).
- Washington County Commission (175), Beaverton (176), Hillsboro (177), Tigard (178), Tualatin (179) — all complete.
- Forest Grove appointed boards/commissions and city-manager staff — elected officials only (non-voting/ex-officio seats excluded per D-17).

</domain>

<decisions>
## Implementation Decisions

### Form of government & council routing — VERIFY AT PLAN TIME (directive, carried forward)
- **D-01:** Forest Grove's council structure is **NOT assumed from memory**. Forest Grove is commonly described as council-manager with a Mayor + 6 councilors elected at-large — but the routing branch is decided by the charter/municipal code ground-truthed from **forestgrove-or.gov** at plan time.
- **D-02:** **Tie-breaker rule: WHO VOTES decides routing, not residency.**
  - **If ward/district voters alone elect their councilors:** load **custom `X00xx` ward geofences BEFORE seeding** (Portland X0012 / NLV X0017 / WashCo X0018 precedents). Boundary source = official City of Forest Grove GIS or Washington County open-data portal ONLY; no authoritative machine-readable file = blocker to surface, not a license to hand-trace.
  - **If the whole city votes for all seats (positions/wards = residency requirement only):** **no new geofences** — model at-large on the verified city geo_id, exactly like Beaverton/Tigard/Tualatin.
- **D-03:** If ward branch: one district per ward, offices attached to it (El Monte shared-district precedent). Seat identity lives on the office title, NOT on duplicate district rows.
- **D-04:** Either branch must produce **no section-split** and **no empty LOCAL section** — one Forest Grove address returns the Mayor + the correct council representation.

### Mayor & leadership modeling — VERIFY AT PLAN TIME (directive, carried forward)
- **D-05:** Mayor's role ground-truthed from the charter at plan time:
  - **If directly-elected citywide:** the Beaverton 176 / Tualatin 179 shape — LOCAL_EXEC district (Mayor) + LOCAL at-large district (councilors), both on the verified city geo_id, both `state='or'`; Mayor sorts first (groupHierarchy.js).
  - **If council-member / rotating president:** seat-with-title on the council, **no LOCAL_EXEC** (avoids the Norwalk/Downey/Bellflower mis-seed class).
- **D-06:** **Council President / Vice Mayor = title-on-seat** if one exists — designation rides on that councilor's office title, verified from the official site. No separate office row.

### Roster & body name — strict ground-truth (carried forward)
- **D-07:** Researcher pulls the **seated roster + exact chamber/body name verbatim** from forestgrove-or.gov at plan time. No hardcoding names, seat count, or position naming from memory — account for 2024 turnover. Researcher also **notes WAF status** of forestgrove-or.gov so the executor isn't surprised (tualatinoregon.gov was NO-WAF; tigard.gov needed the tigardlife fallback).

### Stance scope + headshots (carried forward, locked)
- **D-08:** All live compass topics per official, **one agent at a time**, evidence-only / 100% cited / honest blank spokes / **zero default values**; 18–21+ depth where the record supports it; skip judicial-* topics. Stance agents **author their own migration files directly** (179 pattern — worked well, keep it).
- **D-09:** Headshots from **forestgrove-or.gov** first; Ballotpedia/Wikimedia for genuine gaps. Crop-to-4:5 **then** resize to **600×750** (Lanczos q90, no overlays), mirrored to Storage `politician_photos/{uuid}-headshot.jpg`; `photo_license` set at execution by actual source. Genuine gaps documented, no fabrication.

### Community banner (carried forward)
- **D-10:** **Subject: executor picks the best legally-licensed wide shot** (see D-15 for the Forest Grove priority hint). **Wikimedia Commons first, Unsplash fallback; NO AI-generated images; no baked-in text/graphics.** Follow `docs/banner-asset-pipeline.md` (`process_banner.py` → 1700×540 @ 3.15:1 → `upload_banner.py` → `cities/forest-grove.jpg`) + `CURATED_LOCAL` entry with attribution in `src/lib/buildingImages.js`.
- **D-11:** **Banner asset work lives in the final surfacing plan** (alongside coverage.js) — keeps the proven 5-plan deep-seed shape. `offices.representing_city='Forest Grove'` is set in the **structural** migration.

### Surfacing (locked)
- **D-12:** Add Forest Grove to the **Oregon block** of `COVERAGE_STATES` in `src/lib/coverage.js`: `{ label: 'Forest Grove', browseGovernmentList: ['<verified geo_id>'], browseStateAbbrev: 'OR', hasContext: true }` — city entry alphabetical among the Oregon cities.
- **D-13:** Live browse link at completion: `essentials.empowered.vote/results?browse_geo_id=<verified geo_id>&browse_mtfcc=G4110`.

### Forest Grove-specific decisions (resolved this discussion — recommended defaults, user AFK)
- **D-14: Both 179-REVIEW template fixes are LOCKED into this phase's artifacts** (latent defects, not incidents — fix at the template level so 180–182 inherit them):
  - **WR-01:** the headshot pipeline script MUST **exit non-zero when any upload fails** (179's script exited 0 on partial failure; chained automation could otherwise apply the headshot migration after a partial upload).
  - **WR-02:** the structural migration's `ON CONFLICT (external_id) DO UPDATE` path gets an **in-file identity gate in the structural post-verify** (assert seated names match the researched roster — like the stance files' identity gate), not just the out-of-band Wave-0 Probe D.
- **D-15: Banner subject priority hint — Pacific University campus / Old College Hall** (Forest Grove's signature landmark; oldest university building west of the Mississippi), with historic downtown/Main Street or wine-country horizon as alternates. As always, a clean license + crops-well-to-1700×540 beats subject preference.
- **D-16: Headshot fallback chain is now a STANDING RULE for 180–182** — city site → Ballotpedia/Wikimedia → local-news/community-paper photos pre-authorized as a documented last resort for genuine gaps (tigardlife precedent from 178, adopted per-city in 179). License verified per source; `photo_license` set accordingly; never fabricate.
- **D-17: Non-voting / ex-officio seats are EXCLUDED from the roster** (carries 179 D-14). Vacant seats: seed the office row only if the milestone precedent supports it — otherwise document the vacancy in research/summary; **never seed a placeholder person**. Very recent appointees count as seated officials if confirmed on the official city site.

### Claude's Discretion
- **Council office title labeling** — planner picks after seeing the official roster page (city-verbatim vs simplified).
- **External_id block** — Wave-0 DB probe picks an unused OR range (geo_id-derived block is the natural analog; Beaverton used -4105351..-4105357, Tualatin aligned with its geo_id).
- **Next migration number** — memory says next on-disk = **1178** post-Tualatin; Wave-0 confirms on-disk MAX (on-disk counter is authoritative; stance migs are audit-only and never register; DB ledger MAX is a known trap).
- **Custom `X00xx` mtfcc + district_type** — only if the D-02 ward branch fires; Wave-0 finds next unused code.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirement + milestone conventions
- `.planning/ROADMAP.md` §"Phase 180: City of Forest Grove Deep-Seed" — goal + 4 success criteria.
- `.planning/ROADMAP.md` §"Milestone-wide conventions" (v20.0 block) — deep-seed rules incl. the **community banner standing constraint**, `representing_city` requirement, `'or'`/`'OR'` casing trap, per-government build order.
- `.planning/REQUIREMENTS.md` §"WASH-06" — the requirement this phase satisfies.

### Same-milestone precedent (PRIMARY analog — the just-completed sister city)
- `.planning/phases/179-city-of-tualatin-deep-seed/179-RESEARCH.md` + `179-0*-SUMMARY.md` — Tualatin execution ground truth: Wave-0 probe shape (incl. the wrong-stated-geo_id catch), Beaverton-shape structural seed, no-WAF direct headshots, stance agents authoring their own migrations, banner + coverage.js surfacing, same-session live verification.
- `.planning/phases/179-city-of-tualatin-deep-seed/` code-review report (REVIEW file) — source of the WR-01/WR-02 template fixes locked in D-14.
- `.planning/phases/178-city-of-tigard-deep-seed/178-PATTERNS.md` — pattern map from the closest analog phases (tigardlife headshot fallback precedent for D-16).
- `.planning/phases/177-city-of-hillsboro-deep-seed/177-CONTEXT.md` — the context lineage this phase mirrors (verify-at-plan-time directives, banner + inline representing_city conventions).
- `C:/EV-Accounts/backend/migrations/` — Tualatin structural migration 1169 and Beaverton mig 1131 are the closest adaptable templates. Find: `grep -rl "Tualatin\|Beaverton" C:/EV-Accounts/backend/migrations/`.

### Custom non-TIGER ward geofences (only if D-02 ward branch)
- Custom `X00xx` precedents: Portland X0012; NLV X0017; WashCo commissioner districts X0018 (Phase 175). Find loaders: `grep -rl "X00" C:/EV-Accounts/backend/migrations/`.
- `.planning/phases/175-washington-county-commission-deep-seed/175-CONTEXT.md` — official-GIS-only boundary sourcing rule + custom-district ingest shape.

### Banner pipeline
- `docs/banner-asset-pipeline.md` — process_banner.py → 1700×540 @ 3.15:1 → upload_banner.py → `cities/forest-grove.jpg`.
- `src/lib/buildingImages.js` — `CURATED_LOCAL` entry + attribution (Beaverton/Hillsboro/Tigard/Tualatin entries are the template).

### Stance research + display
- Memories: [[feedback_stance_research_one_at_a_time]], [[feedback_stance_research_all_topics]], [[feedback_stance_no_default_value]], [[feedback_compass_chairs_not_polarity]], [[project_compass_live_topic_ids]], [[project_stance_research_format]].
- Schema: `inform.politician_answers` / `inform.compass_topics` (topic_key, is_live) / `inform.compass_stances` (chairs); topic_id resolved LIVE via JOIN on topic_key AND is_live=true; ON CONFLICT (politician_id, topic_id).

### Surfacing
- `src/lib/coverage.js` — Oregon block of `COVERAGE_STATES` (Tigard/Tualatin entries are the exact template; browse via `browseGovernmentList`).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **City geofence** already loaded by v8.0 OR TIGER geofences — ROADMAP states geo_id 4126200 but **Wave-0 Probe A verifies against the DB before any use** (`districts.state` is `'or'` lowercase for city tiers).
- Tualatin (1169 structural, 1170 headshots, 1171–1177 stances) + Beaverton (1131 structural) migrations — directly adaptable same-milestone templates.
- Deep-seed headshot pipeline (`_tmp-*-headshots.py`, backend/scripts/_* gitignored) — reusable, **with the D-14 WR-01 non-zero-exit fix applied**.
- Banner pipeline scripts (`scripts/banners/process_banner.py`, `upload_banner.py`) — proven on Beaverton/Hillsboro/Tigard/Tualatin.
- `essentials.governments` (WHERE NOT EXISTS — no geo_id unique constraint) / `essentials.chambers` (official_count here; **slug GENERATED — never INSERT**) / `essentials.offices` (incl. `representing_city`) / `essentials.politician_images` (id, politician_id, url, type, photo_license — **NO photo_origin_url**).

### Established Patterns
- **Executor/orchestrator split:** gsd-executor writes `.sql`/`.py`; inline orchestrator runs DB probes, applies migrations via `psql -f` with `C:/EV-Accounts/backend/.env` DATABASE_URL (executor has NO DB), runs headshot/banner scripts, runs audits.
- Proven 5-plan deep-seed shape: Wave-0 probes → structural → headshots → stances (one agent at a time, authoring own migrations) → surfacing (+banner).
- Section-split scan (0 rows) after seed; antipartisan (party stored, never displayed); Mayor-first via groupHierarchy.js.
- Stance migrations bypass `schema_migrations` → on-disk counter authoritative (next = 1178 per 179 close); structural migrations register normally.
- Verify-gates grep whole files — keep `slug`/`schema_migrations`/`photo_origin_url` out of comments.
- Deploy-gated verification items persist as UAT and close post-deploy (178 precedent); 179 closed live in-session — prefer that when deploys allow.

### Integration Points
- Backend `/representatives/me` PIP resolution: Mayor + at-large council via the verified city geofence; ward councilors (if ward branch) via new custom `X00xx` polygons — confirm district_type/state casing matches the backend query.
- `src/lib/coverage.js` Oregon block drives the purple chip + browse link; `src/lib/buildingImages.js` CURATED_LOCAL drives the banner; `offices.representing_city` drives banner city derivation.

</code_context>

<specifics>
## Specific Ideas

- Headline correctness check: a Forest Grove address returns the Mayor + the correct council representation — no empty LOCAL section, no section-split.
- Mayor-first ordering, matching Beaverton/Hillsboro/Tigard/Tualatin display.
- Live browse link at completion: `essentials.empowered.vote/results?browse_geo_id=<verified geo_id>&browse_mtfcc=G4110` ([[feedback_provide_city_browse_links]]).
- Banner should render on the Local section for Forest Grove browse immediately (representing_city set inline — no backfill).
- Tailwind/Render hygiene: no raw Windows backslash paths in committed files ([[feedback_tailwind_scans_planning_md]]).

</specifics>

<deferred>
## Deferred Ideas

- Remaining west-metro cities (Sherwood 181, Cornelius 182), school boards incl. Forest Grove SD 15 (184), 2026 elections + discovery (185) — already scoped as their own phases.
- Forest Grove appointed boards/commissions, city-manager staff, and any non-voting/ex-officio dais seats (D-17) — not elected officials; out of scope.

### Reviewed Todos (not folded)
None — no pending todos matched this phase.

</deferred>

---

*Phase: 180-city-of-forest-grove-deep-seed*
*Context gathered: 2026-07-03*
