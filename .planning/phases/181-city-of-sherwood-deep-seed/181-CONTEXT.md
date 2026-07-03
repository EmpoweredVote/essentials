# Phase 181: City of Sherwood Deep-Seed - Context

**Gathered:** 2026-07-03
**Status:** Ready for planning

> **Note:** The three Sherwood-specific gray areas (D-14 through D-16 below) were resolved with the
> recommended option because the user was AFK when presented. Each follows established milestone
> precedent (D-15 folds in the 180-REVIEW latent fixes, mirroring how 180's D-14 folded in the
> 179-REVIEW fixes). Amend before planning if a different call is wanted.

<domain>
## Phase Boundary

Deep-seed the **City of Sherwood, Oregon** to Tier-1 depth: city government (nested under State of Oregon) → **Mayor + City Council** roster → 600×750 headshots → evidence-only compass stances → **community banner** → purple `hasContext` chip in `src/lib/coverage.js` (Oregon block). Satisfies **WASH-07**.

**In scope:**
- 1 city government for Sherwood (ROADMAP states geo_id **4167450** — MUST be Wave-0-verified before use; 2 of 6 stated geo_ids this milestone were wrong, though Forest Grove's stated 4126200 was the first correct one).
- 1 chamber (exact name verbatim from the city) + the seated offices: **Mayor + council members** at the correct seat count and structure (verified at plan time — see D-01/D-02).
- **Custom `X00xx` ward geofences ONLY IF** Sherwood councilors are elected *by ward/district voters* (verified at plan time; "who votes" tie-breaker — see D-02). Note: Beaverton (176), Tigard (178), Tualatin (179), and Forest Grove (180) all resolved to pure at-large; Sherwood gets the same verification, not the same assumption.
- Headshots; evidence-only stances (all live compass topics); **community horizon banner** (standing constraint since Phase 176); surfacing in `src/lib/coverage.js`.
- `offices.representing_city='Sherwood'` set **inline in the structural migration** (177+ convention — no backfill).
- **All three 180-REVIEW latent template fixes applied to this phase's pipeline artifacts** (see D-15).

**Out of scope:**
- Cornelius (182) — the last west-metro city.
- School boards (Phases 183–184; Sherwood SD 88J board is Phase 184); 2026 elections + discovery (Phase 185); milestone close (186).
- Washington County Commission (175), Beaverton (176), Hillsboro (177), Tigard (178), Tualatin (179), Forest Grove (180) — all complete.
- Sherwood appointed boards/commissions and city-manager staff — elected officials only (non-voting/ex-officio seats excluded per D-13).

</domain>

<decisions>
## Implementation Decisions

### Form of government & council routing — VERIFY AT PLAN TIME (directive, carried forward)
- **D-01:** Sherwood's council structure is **NOT assumed from memory**. Sherwood is commonly described as council-manager with a Mayor + 6 councilors elected at-large — but the routing branch is decided by the charter/municipal code ground-truthed from **sherwoodoregon.gov** at plan time.
- **D-02:** **Tie-breaker rule: WHO VOTES decides routing, not residency.**
  - **If ward/district voters alone elect their councilors:** load **custom `X00xx` ward geofences BEFORE seeding** (Portland X0012 / NLV X0017 / WashCo X0018 precedents). Boundary source = official City of Sherwood GIS or Washington County open-data portal ONLY; no authoritative machine-readable file = blocker to surface, not a license to hand-trace.
  - **If the whole city votes for all seats (positions/wards = residency requirement only):** **no new geofences** — model at-large on the verified city geo_id, exactly like Beaverton/Tigard/Tualatin/Forest Grove.
- **D-03:** If ward branch: one district per ward, offices attached to it (El Monte shared-district precedent). Seat identity lives on the office title, NOT on duplicate district rows.
- **D-04:** Either branch must produce **no section-split** and **no empty LOCAL section** — one Sherwood address returns the Mayor + the correct council representation.

### Mayor & leadership modeling — VERIFY AT PLAN TIME (directive, carried forward)
- **D-05:** Mayor's role ground-truthed from the charter at plan time:
  - **If directly-elected citywide:** the Beaverton 176 / Tualatin 179 / Forest Grove 180 shape — LOCAL_EXEC district (Mayor) + LOCAL at-large district (councilors), both on the verified city geo_id, both `state='or'`; Mayor sorts first (groupHierarchy.js).
  - **If council-member / rotating president:** seat-with-title on the council, **no LOCAL_EXEC** (avoids the Norwalk/Downey/Bellflower mis-seed class).
- **D-06:** **Council President / Vice Mayor = title-on-seat** if one exists — designation rides on that councilor's office title, verified from the official site (Forest Grove Valenzuela precedent). No separate office row. 180 also settled title style: **plain titles** ('Mayor'/'Councilor', no position numbers) unless the city itself uses numbered positions.

### Roster & body name — strict ground-truth (carried forward)
- **D-07:** Researcher pulls the **seated roster + exact chamber/body name verbatim** from sherwoodoregon.gov at plan time. No hardcoding names, seat count, or position naming from memory — account for recent turnover. Researcher also **notes WAF status AND photo availability** of sherwoodoregon.gov so the executor isn't surprised (forestgrove-or.gov had NO member photos even via real-browser fetch — perpetual ajax-loader, not WAF).

### Stance scope + headshots (carried forward, locked)
- **D-08:** All live compass topics per official, **one agent at a time**, evidence-only / 100% cited / honest blank spokes / **zero default values**; 18–21+ depth where the record supports it; skip judicial-* topics. Stance agents **author their own migration files directly** (179/180 pattern — worked well, keep it). Small-city reality: 180 landed 39 stances across 7 officials — depth is evidence-bounded, never padded.
- **D-09:** Headshots from **sherwoodoregon.gov** first; then the D-16 standing fallback chain (Ballotpedia/Wikimedia → local-news/community-paper/campaign photos as documented last resort — but note Ballotpedia has NO individual profiles for small WashCo cities, per 180). Crop-to-4:5 **then** resize to **600×750** (Lanczos q90, no overlays), mirrored to Storage `politician_photos/{uuid}-headshot.jpg`; `photo_license` set at execution by actual source (`'sourced'` for press/campaign photos, per 180). Genuine gaps documented, no fabrication.

### Community banner (carried forward + 180 lesson)
- **D-10:** **Subject: operator picks the recognizable everyday street view** (see D-14 for the Sherwood priority hint). **Wikimedia Commons first, Unsplash fallback; NO AI-generated images; no baked-in text/graphics.** Follow `docs/banner-asset-pipeline.md` (`process_banner.py` → 1700×540 @ 3.15:1 → `upload_banner.py` → `cities/sherwood.jpg`) + `CURATED_LOCAL` entry with attribution in `src/lib/buildingImages.js`.
- **D-11:** **Banner asset work lives in the final surfacing plan** (alongside coverage.js) — keeps the proven 5-plan deep-seed shape. `offices.representing_city='Sherwood'` is set in the **structural** migration.

### Surfacing (locked)
- **D-12:** Add Sherwood to the **Oregon block** of `COVERAGE_STATES` in `src/lib/coverage.js`: `{ label: 'Sherwood', browseGovernmentList: ['<verified geo_id>'], browseStateAbbrev: 'OR', hasContext: true }` — city entry alphabetical among the Oregon cities. Live browse link at completion: `essentials.empowered.vote/results?browse_geo_id=<verified geo_id>&browse_mtfcc=G4110`.

### Roster edge cases (carried forward)
- **D-13:** Non-voting / ex-officio seats are **EXCLUDED** from the roster (carries 179 D-14 / 180 D-17). Vacant seats: seed the office row only if the milestone precedent supports it — otherwise document the vacancy in research/summary; **never seed a placeholder person**. Very recent appointees count as seated officials if confirmed on the official city site.

### Sherwood-specific decisions (resolved this discussion — recommended defaults, user AFK)
- **D-14: Banner subject priority hint — Old Town Sherwood street-level scene** (the historic Smockville-era main street / Cannery Square area), refined by the user 2026-07-03. **Two winning subject classes:** (1) a recognizable everyday **street-level scene** a resident knows, or (2) a **wide multi-roofline skyline** — "Dallas Skyline" / "NYC Skyline" framing with many buildings. **Failure modes to reject:** a zoomed-in crop of the top of a single unidentifiable building (the landmark search often decays into this), and aerials. Browse the Wikimedia **Category:Sherwood, Oregon** gallery and present street-level + true-skyline candidates to the operator FIRST (in 180 the operator picked from exactly that gallery). As always, a clean license + crops-well-to-1700×540 beats subject preference.
- **D-15: All three 180-REVIEW latent fixes are LOCKED into this phase's artifacts** (latent defects, not incidents — fix when cloning the 180 templates so 181–182 inherit them):
  - **WR-A (note-text sync):** when cloning the headshot migration's ORCHESTRATOR NOTE, keep the note text in sync with the actual gate default (180's 1179 note still said "default 0 / fails closed" after the gate was edited).
  - **WR-B (pairwise identity gate):** upgrade the structural migration's in-file identity gate from set-membership (two IN lists) to **pairwise `(external_id, full_name)` assertion** against the researched roster.
  - **WR-C (empty-roster guard):** the headshot script's `test_download_guard(OFFICIALS[0])` must guard `len(OFFICIALS) > 0` first (IndexErrors on an empty roster).
  - The WR-01 (sys.exit(1) on any upload failure) and WR-02 (in-file identity gate) fixes from 179-REVIEW are already SHIPPED in the 180 templates — clone from 180, not 179.
- **D-16: Pamplin Media search-index extraction is PRE-AUTHORIZED as a documented evidence/photo source tier.** Sherwood's local paper (Sherwood Gazette) is Pamplin Media, and **pamplinmedia.com fails TLS for ALL fetchers** (curl/Playwright/WebFetch). Recover Q&A/coverage content via search-index extraction (the 180 workaround), cite the original article URL, and stay strictly evidence-only per D-08. Sites that 403 direct fetch (newsinthegrove-class) get the same treatment. Never fabricate content the index doesn't actually show.

### Claude's Discretion
- **Council office title labeling** — planner picks after seeing the official roster page (city-verbatim vs plain 'Mayor'/'Councilor'; 180 used plain).
- **External_id block** — Wave-0 DB probe picks an unused OR range (geo_id-derived block is the natural analog; Forest Grove used -4126201..-4126207, so Sherwood's analog is -4167451..-41674xx).
- **Next migration number** — memory says next on-disk = **1187** post-Forest Grove (confirmed against disk: max is 1186); Wave-0 confirms on-disk MAX (on-disk counter is authoritative; stance migs are audit-only and never register; DB ledger MAX is a known trap — it still shows 1178).
- **Custom `X00xx` mtfcc + district_type** — only if the D-02 ward branch fires; Wave-0 finds next unused code.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirement + milestone conventions
- `.planning/ROADMAP.md` §"Phase 181: City of Sherwood Deep-Seed" — goal + 4 success criteria.
- `.planning/ROADMAP.md` §"Milestone-wide conventions" (v20.0 block) — deep-seed rules incl. the **community banner standing constraint**, `representing_city` requirement, `'or'`/`'OR'` casing trap, per-government build order.
- `.planning/REQUIREMENTS.md` §"WASH-07" — the requirement this phase satisfies.

### Same-milestone precedent (PRIMARY analog — the just-completed sister city)
- `.planning/phases/180-city-of-forest-grove-deep-seed/180-RESEARCH.md` + `180-0*-SUMMARY.md` — Forest Grove execution ground truth: Wave-0 probe shape, hybrid structural shape (Beaverton district split + Tigard plain titles), no-city-photos D-16 fallback execution, stance agents authoring their own migrations, banner + coverage.js surfacing, same-session live verification.
- `.planning/phases/180-city-of-forest-grove-deep-seed/` code-review report (REVIEW file) — source of the three WR latent fixes locked in D-15.
- `.planning/phases/180-city-of-forest-grove-deep-seed/180-CONTEXT.md` — the context lineage this phase mirrors.
- `.planning/phases/178-city-of-tigard-deep-seed/178-PATTERNS.md` — pattern map from the closest analog phases (tigardlife headshot fallback precedent behind the D-16 standing chain).
- `C:/EV-Accounts/backend/migrations/` — **Forest Grove structural migration 1178 and headshots 1179 are the closest adaptable templates** (they already carry the 179-REVIEW WR-01/WR-02 fixes). Find: `grep -rl "Forest Grove\|Tualatin" C:/EV-Accounts/backend/migrations/`.

### Custom non-TIGER ward geofences (only if D-02 ward branch)
- Custom `X00xx` precedents: Portland X0012; NLV X0017; WashCo commissioner districts X0018 (Phase 175). Find loaders: `grep -rl "X00" C:/EV-Accounts/backend/migrations/`.
- `.planning/phases/175-washington-county-commission-deep-seed/175-CONTEXT.md` — official-GIS-only boundary sourcing rule + custom-district ingest shape.

### Banner pipeline
- `docs/banner-asset-pipeline.md` — process_banner.py → 1700×540 @ 3.15:1 → upload_banner.py → `cities/sherwood.jpg`.
- `src/lib/buildingImages.js` — `CURATED_LOCAL` entry + attribution (Tigard/Tualatin/'forest grove' entries are the template; single-word key `sherwood`).

### Stance research + display
- Memories: [[feedback_stance_research_one_at_a_time]], [[feedback_stance_research_all_topics]], [[feedback_stance_no_default_value]], [[feedback_compass_chairs_not_polarity]], [[project_compass_live_topic_ids]], [[project_stance_research_format]].
- Schema: `inform.politician_answers` / `inform.compass_topics` (topic_key, is_live) / `inform.compass_stances` (chairs); topic_id resolved LIVE via JOIN on topic_key AND is_live=true; ON CONFLICT (politician_id, topic_id).

### Surfacing
- `src/lib/coverage.js` — Oregon block of `COVERAGE_STATES` (Forest Grove/Tigard/Tualatin entries are the exact template; browse via `browseGovernmentList`).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **City geofence** already loaded by v8.0 OR TIGER geofences — ROADMAP states geo_id 4167450 but **Wave-0 Probe A verifies against the DB before any use** (`districts.state` is `'or'` lowercase for city tiers).
- Forest Grove (1178 structural, 1179 headshots, 1180–1186 stances) migrations — the freshest adaptable templates, already carrying the WR-01/WR-02 fixes; apply D-15's three new fixes when cloning.
- Deep-seed headshot pipeline (`_tmp-*-headshots.py`, backend/scripts/_* gitignored) — reusable, with D-15 WR-C empty-roster guard added.
- Banner pipeline scripts (`scripts/banners/process_banner.py`, `upload_banner.py`) — proven on 5 cities; `--vertical-anchor` flag available for band crops (180 used 0.95).
- `essentials.governments` (WHERE NOT EXISTS — no geo_id unique constraint) / `essentials.chambers` (official_count here; **slug GENERATED — never INSERT**) / `essentials.offices` (incl. `representing_city`) / `essentials.politician_images` (id, politician_id, url, type, photo_license — **NO photo_origin_url**).

### Established Patterns
- **Executor/orchestrator split:** gsd-executor writes `.sql`/`.py`; inline orchestrator runs DB probes, applies migrations via `psql -f` with `C:/EV-Accounts/backend/.env` DATABASE_URL (executor has NO DB), runs headshot/banner scripts, runs audits.
- Proven 5-plan deep-seed shape: Wave-0 probes → structural → headshots → stances (one agent at a time, authoring own migrations) → surfacing (+banner).
- Section-split scan (0 rows) after seed; antipartisan (party stored, never displayed); Mayor-first via groupHierarchy.js.
- Stance migrations bypass `schema_migrations` → on-disk counter authoritative (next = **1187** per 180 close, confirmed on disk); structural migrations register normally.
- Verify-gates grep whole files — keep `slug`/`schema_migrations`/`photo_origin_url` out of comments.
- Same-session live verification preferred (179/180 pattern): push → Render deploy → Playwright verify → close UAT in-session.

### Integration Points
- Backend `/representatives/me` PIP resolution: Mayor + at-large council via the verified city geofence; ward councilors (if ward branch) via new custom `X00xx` polygons — confirm district_type/state casing matches the backend query.
- `src/lib/coverage.js` Oregon block drives the purple chip + browse link; `src/lib/buildingImages.js` CURATED_LOCAL drives the banner; `offices.representing_city` drives banner city derivation.

</code_context>

<specifics>
## Specific Ideas

- Headline correctness check: a Sherwood address returns the Mayor + the correct council representation — no empty LOCAL section, no section-split.
- Mayor-first ordering, matching the five completed WashCo cities.
- Live browse link at completion: `essentials.empowered.vote/results?browse_geo_id=<verified geo_id>&browse_mtfcc=G4110` ([[feedback_provide_city_browse_links]]).
- Banner: recognizable everyday Old Town Sherwood street view, or a true multi-roofline skyline if one exists — never a single-building roof crop, never an aerial (user-refined rule, 2026-07-03); present street-level Wikimedia category candidates first.
- Banner should render on the Local section for Sherwood browse immediately (representing_city set inline — no backfill).
- Tailwind/Render hygiene: no raw Windows backslash paths in committed files ([[feedback_tailwind_scans_planning_md]]).

</specifics>

<deferred>
## Deferred Ideas

- Cornelius (182), school boards incl. Sherwood SD 88J (184), 2026 elections + discovery (185) — already scoped as their own phases.
- Sherwood appointed boards/commissions, city-manager staff, and any non-voting/ex-officio dais seats (D-13) — not elected officials; out of scope.

### Reviewed Todos (not folded)
None — no pending todos matched this phase.

</deferred>

---

*Phase: 181-city-of-sherwood-deep-seed*
*Context gathered: 2026-07-03*
