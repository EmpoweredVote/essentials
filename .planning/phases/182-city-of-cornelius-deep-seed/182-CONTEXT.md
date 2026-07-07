# Phase 182: City of Cornelius Deep-Seed - Context

**Gathered:** 2026-07-03
**Status:** Ready for planning

> **Note:** The three Cornelius-specific gray areas (D-14 through D-16 below) were resolved with the
> recommended option because the user was AFK when presented (same handling as Phase 181's header
> note). Each follows established milestone precedent. Amend before planning if a different call is
> wanted.

<domain>
## Phase Boundary

Deep-seed the **City of Cornelius, Oregon** to Tier-1 depth: city government (nested under State of Oregon) → **Mayor + City Council** roster → 600×750 headshots → evidence-only compass stances → **community banner** → purple `hasContext` chip in `src/lib/coverage.js` (Oregon block). Satisfies **WASH-08**. This is the **last west-metro city** of the v20.0 milestone.

**In scope:**
- 1 city government for Cornelius (ROADMAP states geo_id **4115350** — MUST be Wave-0-verified before use; 3 of 7 stated geo_ids this milestone were phantoms, including Sherwood's 4167450→4167100 correction in Phase 181).
- 1 chamber (exact name verbatim from the city) + the seated offices: **Mayor + council members** at the correct seat count and structure (verified at plan time — see D-01/D-02).
- **Custom `X00xx` ward geofences ONLY IF** Cornelius councilors are elected *by ward/district voters* (verified at plan time; "who votes" tie-breaker — see D-02). Note: all five predecessor cities (Beaverton 176, Tigard 178, Tualatin 179, Forest Grove 180, Sherwood 181) resolved to pure at-large; Cornelius gets the same verification, not the same assumption.
- Headshots; evidence-only stances (all live compass topics); **community horizon banner** (standing constraint since Phase 176); surfacing in `src/lib/coverage.js`.
- `offices.representing_city='Cornelius'` set **inline in the structural migration** (177+ convention — no backfill).
- Spanish-language sources admitted as evidence/photo tier per D-15 (first bilingual-majority city of the chain).

**Out of scope:**
- School boards (Phases 183–184); 2026 elections + discovery (Phase 185); milestone close (186).
- Washington County Commission (175) and the six completed cities (176–181).
- Cornelius appointed boards/commissions and city-manager staff — elected officials only (non-voting/ex-officio seats excluded per D-13).

</domain>

<decisions>
## Implementation Decisions

### Form of government & council routing — VERIFY AT PLAN TIME (directive, carried forward)
- **D-01:** Cornelius's council structure is **NOT assumed from memory**. Cornelius is commonly described as council-manager with a Mayor + councilors elected at-large — but the routing branch is decided by the charter/municipal code ground-truthed from the official city site (corneliusor.gov / ci.cornelius.or.us — researcher confirms the live domain) at plan time.
- **D-02:** **Tie-breaker rule: WHO VOTES decides routing, not residency.**
  - **If ward/district voters alone elect their councilors:** load **custom `X00xx` ward geofences BEFORE seeding** (Portland X0012 / NLV X0017 / WashCo X0018 precedents). Boundary source = official City of Cornelius GIS or Washington County open-data portal ONLY; no authoritative machine-readable file = blocker to surface, not a license to hand-trace.
  - **If the whole city votes for all seats (positions = residency requirement only):** **no new geofences** — model at-large on the verified city geo_id, exactly like the five predecessor cities.
- **D-03:** If ward branch: one district per ward, offices attached to it (El Monte shared-district precedent). Seat identity lives on the office title, NOT on duplicate district rows.
- **D-04:** Either branch must produce **no section-split** and **no empty LOCAL section** — one Cornelius address returns the Mayor + the correct council representation.

### Mayor & leadership modeling — VERIFY AT PLAN TIME (directive, carried forward)
- **D-05:** Mayor's role ground-truthed from the charter at plan time:
  - **If directly-elected citywide:** the Beaverton 176 / Tualatin 179 / Forest Grove 180 / Sherwood 181 shape — LOCAL_EXEC district (Mayor) + LOCAL at-large district (councilors), both on the verified city geo_id, both `state='or'`; Mayor sorts first (groupHierarchy.js). Note Sherwood's Mayor is a 2-YEAR term — verify Cornelius's term structure independently, don't copy.
  - **If council-member / rotating president:** seat-with-title on the council, **no LOCAL_EXEC** (avoids the Norwalk/Downey/Bellflower mis-seed class).
- **D-06:** **Council President / Vice Mayor = title-on-seat** if one exists — designation rides on that councilor's office title in commentary only, verified from the official site (Forest Grove Valenzuela / Sherwood Kim Young precedents: plain 'Councilor' title in DB). Plain titles ('Mayor'/'Councilor', no position numbers) unless the city itself uses numbered positions.

### Roster & body name — strict ground-truth (carried forward)
- **D-07:** Researcher pulls the **seated roster + exact chamber/body name verbatim** from the official Cornelius site at plan time. No hardcoding names, seat count, or position naming from memory — account for recent turnover. Researcher also **notes WAF status AND photo availability** of the city site so the executor isn't surprised (forestgrove-or.gov had NO member photos; sherwoodoregon.gov had all 7 as static square webp-as-jpg). Watch for former-Mayor-seated-as-plain-Councilor (Sherwood Keith Mays pitfall).

### Stance scope + headshots (carried forward, locked)
- **D-08:** All live compass topics per official, **one agent at a time**, evidence-only / 100% cited / honest blank spokes / **zero default values**; 18–21+ depth where the record supports it; skip judicial-* topics. Stance agents **author their own migration files directly** (179–181 pattern) and run on **model=sonnet** (181 quota lesson — worked fine, keep it). Small-city reality: Sherwood landed 23 stances across 7 officials — depth is evidence-bounded, never padded; Cornelius may land lower still.
- **D-09:** Headshots from the official Cornelius city site first; then the standing fallback chain (Ballotpedia/Wikimedia → local-news/community-paper/campaign photos as documented last resort — Ballotpedia has NO individual profiles for small WashCo cities, per 180). Crop-to-4:5 **then** resize to **600×750** (Lanczos q90, no overlays), mirrored to Storage `politician_photos/{uuid}-headshot.jpg`; `photo_license` set at execution by actual source. Genuine gaps documented, no fabrication.
- **Pamplin standing authorization (carried from 181 D-16):** pamplinmedia.com fails TLS for ALL fetchers — Cornelius shares Forest Grove's news ecosystem (Forest Grove News-Times is Pamplin). Recover Q&A/coverage via search-index extraction, cite the original article URL, stay strictly evidence-only. Sites that 403 direct fetch get the same treatment. Never fabricate content the index doesn't actually show. Note from 181: curl+pdftotext works on council-minutes PDFs where WebFetch OCR fails.

### Community banner (carried forward)
- **D-10:** **Subject: operator picks the recognizable everyday street view** (see D-14 for the Cornelius priority hint). **Wikimedia Commons first, Unsplash fallback; NO AI-generated images; no baked-in text/graphics.** Follow `docs/banner-asset-pipeline.md` (`process_banner.py` → 1700×540 @ 3.15:1 → `upload_banner.py` → `cities/cornelius.jpg`) + `CURATED_LOCAL` entry with attribution in `src/lib/buildingImages.js` — **new `{ state, src }` entry format** post-WR-03 (state: 'OR').
- **D-11:** **Banner asset work lives in the final surfacing plan** (alongside coverage.js) — keeps the proven 5-plan deep-seed shape. `offices.representing_city='Cornelius'` is set in the **structural** migration.

### Surfacing (locked)
- **D-12:** Add Cornelius to the **Oregon block** of `COVERAGE_STATES` in `src/lib/coverage.js`: `{ label: 'Cornelius', browseGovernmentList: ['<verified geo_id>'], browseStateAbbrev: 'OR', hasContext: true }` — city entry alphabetical among the Oregon cities. Live browse link at completion: `essentials.empowered.vote/results?browse_geo_id=<verified geo_id>&browse_mtfcc=G4110`.

### Roster edge cases (carried forward)
- **D-13:** Non-voting / ex-officio seats are **EXCLUDED** from the roster. Vacant seats: seed the office row only if milestone precedent supports it — otherwise document the vacancy in research/summary; **never seed a placeholder person**. Very recent appointees count as seated officials if confirmed on the official city site.

### Cornelius-specific decisions (resolved this discussion — recommended defaults, user AFK)
- **D-14: Banner subject priority hint — the Adair/Baseline main-street couplet street scene** (Cornelius's everyday drag, the OR-8/TV Highway couplet through downtown), with **Cornelius Place / Cornelius Public Library** (the city's newest recognizable civic landmark) as the alternate. Standing rule applies: two winning subject classes — (1) recognizable everyday **street-level scene**, (2) **wide multi-roofline skyline**. **Failure modes to reject:** single-building roof crop, aerials. Cornelius has the sparsest imagery of the seven cities — Wave-0 browses **Wikimedia Category:Cornelius, Oregon** (and Category:Washington County, Oregon if thin) and presents street-level candidates to the operator FIRST; a clean license + crops-well-to-1700×540 beats subject preference. Operator can swap post-hoc (Forest Grove/Sherwood precedent).
- **D-15: Spanish-language sources are ADMITTED as evidence and photo sources.** Cornelius is Oregon's most heavily Latino city (majority-Latino; the city communicates bilingually). Stance evidence rules are language-agnostic: a Spanish-only article, city communication, or candidate statement counts as evidence under the same triple-gate rigor — **cite the original Spanish-language URL; write the reasoning in English, faithfully summarizing (never embellishing) what the source says.** Same for photos (photo_license by actual source). No machine-translation fabrication — if the agent cannot actually read the source content, it is not evidence.
- **D-16: Deploy verification + structural-migration hygiene locked:**
  - **Verify Render deploys by bundle CONTENT, never by hash** — Render's static-build bundle hash ≠ local build hash (env/ev-ui differences; 45-min false wait in 181). Grep the served JS for the new geo_id / asset path. Render API key in `C:/EV-Accounts/backend/.env` reads deploy status (service srv-d7290ltm5p6s73ct3a2g, essentials-frontend). This goes in the surfacing plan as a directive.
  - **Adopt IN-01 (181-REVIEW info finding) in the structural migration clone:** hoist the repeated chamber-lookup subquery into a single CTE (`WITH chamber AS (...)`) referenced by each office INSERT. Keep the pairwise identity gate and all four-gate patterns intact; keep `slug`/`schema_migrations`/`photo_origin_url` strings out of comments (verify-gates grep whole files).
  - **Check `git -C C:/EV-Accounts status` staged state before ANY commit there** — another workstream's pre-staged files rode into a 181 batch commit and had to be split.

### Claude's Discretion
- **Council office title labeling** — planner picks after seeing the official roster page (city-verbatim vs plain 'Mayor'/'Councilor'; 180/181 used plain).
- **External_id block** — Wave-0 DB probe picks an unused OR range (geo_id-derived block is the natural analog: Sherwood used -4167101..-4167107, so Cornelius's analog is -4115351..-41153xx — subject to Probe A's verified geo_id).
- **Next migration number** — memory says next on-disk = **1196** post-Sherwood; Wave-0 confirms on-disk MAX (on-disk counter is authoritative; stance migs are audit-only and never register; DB ledger MAX is a known trap — it still shows 1178).
- **Custom `X00xx` mtfcc + district_type** — only if the D-02 ward branch fires; Wave-0 finds next unused code.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirement + milestone conventions
- `.planning/ROADMAP.md` §"Phase 182: City of Cornelius Deep-Seed" — goal + 4 success criteria.
- `.planning/ROADMAP.md` §"Milestone-wide conventions" (v20.0 block) — deep-seed rules incl. the **community banner standing constraint**, `representing_city` requirement, `'or'`/`'OR'` casing trap, per-government build order.
- `.planning/REQUIREMENTS.md` §"WASH-08" — the requirement this phase satisfies.

### Same-milestone precedent (PRIMARY analog — the just-completed sister city)
- `.planning/phases/181-city-of-sherwood-deep-seed/181-RESEARCH.md` + `181-0*-SUMMARY.md` — Sherwood execution ground truth: Wave-0 probe shape (incl. the geo_id phantom correction), structural shape, headshot execution (square-source width-crop, webp-as-jpg), stance agents on sonnet authoring their own migrations, banner + coverage.js surfacing, bundle-content deploy verification.
- `.planning/phases/181-city-of-sherwood-deep-seed/181-REVIEW.md` — all 4 warnings FIXED same-session; IN-01 (CTE hoist) adopted by D-16. Nothing latent to carry — first clean-slate clone of the chain.
- `.planning/phases/181-city-of-sherwood-deep-seed/181-CONTEXT.md` — the context lineage this phase mirrors.
- `.planning/phases/178-city-of-tigard-deep-seed/178-PATTERNS.md` — pattern map from the closest analog phases (headshot fallback precedent behind the standing D-09 chain).
- `C:/EV-Accounts/backend/migrations/` — **Sherwood structural migration 1187 and headshots 1188 are the closest adaptable templates; stance template = strengthened 1189–1195 files (four-gate DO block, commit 0946233c)**. Find: `grep -rl "Sherwood" C:/EV-Accounts/backend/migrations/`.
- **Headshot script template = the Sherwood `_tmp-sherwood-headshots.py`** (gitignored, on disk in EV-Accounts backend/scripts) — it alone carries the WR-01/WR-02 fixes (asserts→if/raise; prefetched_bytes guard). Do NOT clone from Forest Grove's script.

### Custom non-TIGER ward geofences (only if D-02 ward branch)
- Custom `X00xx` precedents: Portland X0012; NLV X0017; WashCo commissioner districts X0018 (Phase 175). Find loaders: `grep -rl "X00" C:/EV-Accounts/backend/migrations/`.
- `.planning/phases/175-washington-county-commission-deep-seed/175-CONTEXT.md` — official-GIS-only boundary sourcing rule + custom-district ingest shape.

### Banner pipeline
- `docs/banner-asset-pipeline.md` — process_banner.py → 1700×540 @ 3.15:1 → upload_banner.py → `cities/cornelius.jpg`.
- `src/lib/buildingImages.js` — `CURATED_LOCAL` entry + attribution — **post-WR-03 `{ state, src }` format** (commit 6999052; the sherwood OR entry is the exact template; single-word key `cornelius`, state 'OR').

### Stance research + display
- Memories: [[feedback_stance_research_one_at_a_time]], [[feedback_stance_research_all_topics]], [[feedback_stance_no_default_value]], [[feedback_compass_chairs_not_polarity]], [[project_compass_live_topic_ids]], [[project_stance_research_format]].
- Schema: `inform.politician_answers` / `inform.compass_topics` (topic_key, is_live) / `inform.compass_stances` (chairs); topic_id resolved LIVE via JOIN on topic_key AND is_live=true; ON CONFLICT (politician_id, topic_id).

### Surfacing
- `src/lib/coverage.js` — Oregon block of `COVERAGE_STATES` (Sherwood/Forest Grove/Tigard/Tualatin entries are the exact template; browse via `browseGovernmentList`).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **City geofence** already loaded by v8.0 OR TIGER geofences — ROADMAP states geo_id 4115350 but **Wave-0 Probe A verifies against the DB before any use** (`districts.state` is `'or'` lowercase for city tiers; stated values have been phantoms 3 times this milestone).
- Sherwood migrations (1187 structural, 1188 headshots, 1189–1195 stances) — the freshest adaptable templates, carrying ALL review fixes through 181 (WR-01…WR-04 + the 179/180 fixes); apply the D-16 CTE hoist when cloning the structural file.
- Deep-seed headshot pipeline: the Sherwood `_tmp-sherwood-headshots.py` (gitignored) is the ONLY script copy with the WR-01/WR-02 fixes — clone from it.
- Banner pipeline scripts (`scripts/banners/process_banner.py`, `upload_banner.py`) — proven on 6 cities; `--vertical-anchor` flag available for band crops.
- `essentials.governments` (WHERE NOT EXISTS — no geo_id unique constraint) / `essentials.chambers` (official_count here; **slug GENERATED — never INSERT**) / `essentials.offices` (incl. `representing_city`) / `essentials.politician_images` (id, politician_id, url, type, photo_license — **NO photo_origin_url**).

### Established Patterns
- **Executor/orchestrator split:** gsd-executor writes `.sql`/`.py`; inline orchestrator runs DB probes, applies migrations via `psql -f` with `C:/EV-Accounts/backend/.env` DATABASE_URL (executor has NO DB), runs headshot/banner scripts, runs audits.
- Proven 5-plan deep-seed shape: Wave-0 probes → structural → headshots → stances (one agent at a time, sonnet, authoring own migrations) → surfacing (+banner).
- Section-split scan (0 rows) after seed; antipartisan (party stored, never displayed); Mayor-first via groupHierarchy.js.
- Stance migrations bypass `schema_migrations` → on-disk counter authoritative (next = **1196** per 181 close); structural migrations register normally.
- Verify-gates grep whole files — keep `slug`/`schema_migrations`/`photo_origin_url` out of comments.
- Same-session live verification (179–181 pattern): push → Render deploy (verify by bundle CONTENT grep, not hash — D-16) → Playwright verify → close UAT in-session.

### Integration Points
- Backend `/representatives/me` PIP resolution: Mayor + at-large council via the verified city geofence; ward councilors (if ward branch) via new custom `X00xx` polygons — confirm district_type/state casing matches the backend query.
- `src/lib/coverage.js` Oregon block drives the purple chip + browse link; `src/lib/buildingImages.js` CURATED_LOCAL (`{ state, src }`) drives the banner; `offices.representing_city` drives banner city derivation.

</code_context>

<specifics>
## Specific Ideas

- Headline correctness check: a Cornelius address returns the Mayor + the correct council representation — no empty LOCAL section, no section-split.
- Mayor-first ordering, matching the six completed WashCo cities.
- Live browse link at completion: `essentials.empowered.vote/results?browse_geo_id=<verified geo_id>&browse_mtfcc=G4110` ([[feedback_provide_city_browse_links]]).
- Banner: recognizable everyday Cornelius main-street scene (Adair/Baseline couplet) or a true multi-roofline skyline — never a single-building roof crop, never an aerial; present street-level Wikimedia category candidates to the operator first (D-14).
- Bilingual reality: expect some roster/stance/photo material to exist only in Spanish — that's admissible evidence under D-15, cited to the original Spanish URL with faithful English reasoning.
- Banner should render on the Local section for Cornelius browse immediately (representing_city set inline — no backfill).
- Tailwind/Render hygiene: no raw Windows backslash paths in committed files ([[feedback_tailwind_scans_planning_md]]).

</specifics>

<deferred>
## Deferred Ideas

- School boards (183–184), 2026 elections + discovery (185), milestone retrospective/close (186) — already scoped as their own phases.
- Cornelius appointed boards/commissions, city-manager staff, and any non-voting/ex-officio dais seats (D-13) — not elected officials; out of scope.

### Reviewed Todos (not folded)
None — no pending todos matched this phase.

</deferred>

---

*Phase: 182-city-of-cornelius-deep-seed*
*Context gathered: 2026-07-03*
