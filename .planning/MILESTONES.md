# Milestones

## v22.0 Tucson & Arizona (Shipped: 2026-07-23)

**Phases completed:** 190–203 shipped (AZ foundation + Tucson-metro + Coachella Valley deep-seeds + 2026 race discovery), 68 plans. **Deferred at close:** Phase 206 (AZ 2026 candidate reconcile) + Phases 197/198 title reconcile → scheduled post-Aug-6-certification follow-up (see below); Phase 200 retrospective folded into this close.

**Closeout:** override_closeout. AZ 2026 nominee reconcile deferred because the primary (held 2026-07-21) does not certify until the state canvass ~Aug 6 — seeding certified nominees earlier would write data that can still change through the Aug-11 challenge window. Phase 206 RESEARCH.md + CONTEXT.md are written and execution-ready for a post-Aug-6 pass. See STATE.md → Deferred Items.

**Key accomplishments:**

- Seeded the 7 missing AZ statewide elected officials (Superintendent, State Mine Inspector, 5-member Corporation Commission) via structural migration 1282, then uploaded 6/7 headshots via migration 1283 — Presmyk deferred to a checkpoint.
- 8 net-new 600x750 headshots for AZ US House reps sourced from unitedstates.github.io (public_domain, resize-only), completing federal-delegation headshot coverage for all 9 CDs.
- Full SQL audit confirmed AZ-STATE-01/02 pass 11/11; operator approved the live render and supplied a local headshot file for Les Presmyk, closing the phase's last open item via audit-only migration 1285.
- 5 Pima County Board of Supervisors district boundaries sourced from the county ArcGIS MapServer (outSR=4326) and loaded as clean WGS84 LOCAL geofences (X0019, lowercase az), enabling true one-supervisor-per-address routing.
- Standalone Pima County government (geo_id 04019, not nested under State of Arizona) with a Board of Supervisors chamber holding 5 by-district supervisor offices — each bound to its own LOCAL X0019 district — Allen's D3 seat carrying the rotational-Chair title annotation and Cano's D5 seat flagged appointed.
- All 5 Pima County supervisors serve a 600×750 (crop-first, Lanczos q90) headshot from the CDN, sourced from official pima.gov CivicPlus portraits and bound to the current roster politician rows via audit-only migration 1289.
- 53 evidence-only, 100%-cited compass stances seeded for the 5 Pima County supervisors against the 36 non-judicial live topics — the first Arizona jurisdiction with stances, establishing the AZ evidence-only / honest-blank / discrete-chairs template.
- Licensed Santa Catalina Mountains / Sonoran-desert banner (real ground-level photo, 1700×540) sourced one-at-a-time from Wikimedia Commons, uploaded to cities/pima-county.jpg, and wired into buildingImages.js CURATED_LOCAL (first county-tier key) + a DB-honest hasContext:true coverage chip that browses geo_id 04019.
- Full production audit is all-green across geofences, standalone government/roster, headshots, evidence-only stances, section-split, banner, and coverage chip — PIMA-01 + BANR-01 proven end-to-end in live production; frontend deployed via push.
- 6 City of Tucson ward LOCAL geofences (X0020, lowercase az) loaded to production via the full multi-ring winding-classification ETL — Ward 4/5 faithful MultiPolygons, Ward 4 self-intersection auto-repaired.
- Greenfield City of Tucson government + City Council chamber + 7 offices (at-large Mayor on a NEW LOCAL_EXEC/G4110 district + 6 ward members on LOCAL X0020 districts) applied to production; Vice Mayor is a title annotation on the Ward 1 seat, no 8th office.
- All 7 City of Tucson officials serve a 600×750 CDN headshot bound to their current politician row — sourced from non-WAF hosts (Wikimedia PD, Ballotpedia S3, UCLA Luskin) via Playwright because the official city host is Akamai-WAF-blocked.
- 37 evidence-only, 100%-cited compass stances seeded for all 7 City of Tucson officials against the 36 non-judicial live topics — no neutral defaults, no judicial rows, honest blanks throughout.
- Licensed downtown-Tucson streetscape banner (cities/tucson.jpg) processed, uploaded, and wired; City of Tucson surfaced via a brand-new Arizona COVERAGE_STATES block with a DB-honest hasContext:true chip.
- All 5 ROADMAP success criteria TRUE end-to-end in production — full audit all-green and operator live-browse sign-off confirmed. TUC-01 + BANR-01 satisfied; the City of Tucson deep-seed is complete.
- Greenfield **Town of Marana, Arizona, US** (`geo_id='0444270'`, `type='Town'`, `state='AZ'`)
- All 7 seated officials now serve a **600×750** (4:5, Lanczos q90) headshot from the
- 21 evidence-only compass stances seeded across the 7 Town of Marana officials against the
- Marana has its licensed community banner (BANR-01) live at `cities/marana.jpg`, wired into
- ✅ Complete — applied to production 2026-07-16
- ✅ Complete — applied to production 2026-07-16
- ✅ Complete — applied to production 2026-07-16
- ✅ Complete — banner live + frontend wired 2026-07-16
- 198-01 — City of South Tucson structural migration
- 198-02 — City of South Tucson council headshots
- 198-03 — City of South Tucson evidence-only compass stances
- 198-04 — City of South Tucson community banner (BANR-01) + coverage chip
- ✅ Complete
- ✅ Complete
- ✅ Complete
- ✅ Complete (one manual render human-check owed — see below)
- Authored and ran a one-time ArcGIS ETL loader that pulled Riverside County's 5 official Board of Supervisors district boundaries (f=geojson + outSR=4326) and inserted them as 5 valid WGS84 X0021/state=ca LOCAL geofences in production, gating Plan 02's structural migration.
- Authored and applied to production the structural migration seeding Riverside County as a standalone county government (geo_id 06065, NOT nested under State of CA), a single Board of Supervisors chamber, 5 LOCAL X0021 supervisor-district rows on the Plan 01 geofences, and 5 by-district supervisor offices/politicians (Spiegel D2 carrying the 2026 Chair title annotation, board-only, no appointee) — post-verify gate PASSED and the 5 politician UUIDs captured for Plans 03/04.
- Sourced, processed (crop-first 4:5 -> 600x750 Lanczos q90), and uploaded all 5 Riverside County Board of Supervisors headshots to the politician_photos Storage bucket, then applied the audit-only politician_images migration (1315) -- all 4 official-district-site sources bind license='us_government_work', Ballotpedia-sourced Chuck Washington binds 'press_use'; all 5 CDN URLs verified HTTP 200 at exactly 600x750.
- 202-01 | **Wave:** 1 | **Status:** ✅ Complete | **Date:** 2026-07-12
- 202-02 | **Wave:** 2 | **Status:** ✅ Complete | **Date:** 2026-07-12
- 202-03 | **Wave:** 3 | **Status:** ✅ Complete | **Date:** 2026-07-12
- 202-04 | **Wave:** 3 (deliberately serialized) | **Status:** ✅ Complete | **Date:** 2026-07-12
- 202-05 | **Wave:** 4 | **Status:** ✅ Complete | **Date:** 2026-07-12
- 202-06 | **Wave:** 5 | **Status:** ✅ Complete | **Date:** 2026-07-12
- Lens metadata fallbacks + defensive API normalizer, min(8,size) calibration check, validated `ev:compassLens` persistence, and the Best Match biggest-disagreement fill in `computeDisplaySpokes`, all in `src/lib/compass.js` with 27 new/updated unit tests.
- Turned the latent per-office lens data model into an explicit, persisted, global `activeLensKey` in `CompassContext`, with normalized API hydration and a calibration-return auto-select effect (D-12), while leaving the legacy per-office shims (`getEffectiveLens`/`getEffectiveLensKey`/`toggleLens`) fully functional for out-of-scope profile/elections consumers.
- Data-driven `LensChipRow.jsx` rendering N lens pills (active lens-color fill / LIT-outlined / grey+purple-rim needs-calibration) with mirrored EV-CompassV2 iconography and a desktop-hover / mobile-two-tap "Calibrate this lens?" affordance.
- MiniCompass now honors an explicit lens topic set, CompassControlsBar renders the data-driven LensChipRow in place of the binary Lens toggle, and Results.jsx is rebuilt around the global `activeLensKey` — retiring per-office grid auto-lensing and adding the calibration handoff. Verified live on essentials.empowered.vote and approved.
- ✅ Complete
- ✅ Complete (Task 1 applied+verified; Task 2 live-check approved)
- Added a `locality` signal (incorporated/place_name/county_name) to accounts-api's shared `resolveOfficialsAtPoint`, gated to an 11-state PLACE_LOADED_STATES allowlist, and exposed it on both `/candidates/search` and `/coordinate-lookup`.
- accounts-api locality field deployed to production (commit b0842f57) and live-verified against real Pima County/Tucson/Chicago fixtures on both address and coordinate entry paths, with zero writes — operator approved.
- Threaded the live backend `locality` field through api.jsx (both entry points), usePoliticianData, and Results.jsx's representingCity resolution — via a new pure `unincorporatedLabel()` helper and a dedicated `coordLocality` state for the coordinate-only path — so unincorporated points now render "Unincorporated {County}, ST" in both address and coordinate search modes, instead of a misleading nearest-postal-city guess.
- "Unincorporated {County}, ST" locality label deployed to production (essentials, commit 95dda22f) and live-verified end-to-end in BOTH address and coordinate search modes against real Pima County/Tucson/Chicago fixtures, with full regression sweep — operator approved.

---

## v24.0 Results-Page Search & Header Overhaul (Shipped: 2026-07-23)

**Phases completed:** 5 phases (212–216), 21 plans

**Closeout:** override_closeout — 12 pre-existing items acknowledged & deferred (see STATE.md → Deferred Items). All v24.0 phases (212–216) verified passed.

**Key accomplishments:**

- Verified nationwide US House CD data is already complete in production (436 G5200 boundaries, 437 NATIONAL_LOWER tiger_geoid districts) and authored the two migrations the place-name resolver needs — GIN trgm indexes (1377) + Gazetteer reference tables (1378) — with zero live-DB writes.
- `C:/EV-Accounts/backend/scripts/ingest-gazetteer-places-counties.ts`
- Applied migrations 1377 (4 trgm GIN indexes) + 1378 (gazetteer_places/gazetteer_counties tables) to the live production Supabase DB, then ran the nationwide Census Gazetteer ingest live — discovering and fixing 3 real bugs in the Plan 02 script along the way (tab- vs. pipe-delimited parsing, a Windows-broken isMainModule guard, and a counties UNNEST missing a column param) — and proved D-11 idempotency with an identical second run (32,333 places / 3,222 counties, delta == 0).
- New `searchPlaceNames()` pg_trgm resolver (curated `essentials.governments` UNION nationwide Gazetteer, D-05 labels, D-06 curated-boost/name-A-Z ranking, D-07 live has_local_data, RSLV-07 wrong-state guard) plus a `getCongressionalOverlapNote()` helper that reuses the existing overlap machinery to surface the "needs exact address" ambiguity signal — both fully TDD'd (RED commit before GREEN), 29 new tests green, zero new PostGIS queries.
- New `essentialsLocationSearch.ts` Express router exposing `GET /` (ranked place-name candidates) and `GET /resolve` (national-fallback floor: Governor/state execs + US Senators always, single-CD US House rep via reuse of `getPoliticiansByArea`, CD-overlap ambiguity note, best-effort county), mounted before the `/api/essentials` catch-all, `tsc` build green — Task 2 (live deploy + smoke-test) intentionally left unstarted for operator approval.
- Fixed two live-smoke-test defects in the Phase 212 place-name resolver: `/resolve` now returns the actual NATIONAL_LOWER US House member (not an arbitrary overlapping local/state official), and curated governments with `geo_id IS NULL` now resolve their real place geo_id via a LATERAL district lookup, eliminating unresolvable + duplicate candidates.
- Fixed two verifier-confirmed blockers in the place-name resolver's national-fallback path: state-tier resolves no longer 422 (missing 'G4000' MTFCC), and Gazetteer-only places (CDPs/incorporated places with no geofence polygon) now resolve their single overlapping US House district via a point-in-polygon fallback against the place's Census Gazetteer centroid.
- US-bbox + swap-guard `classifyCoordinate` (with Aleutian-antimeridian support) plus a geocode-free `getRepresentativesByCoordinate` that reuses the existing `ST_Covers` politician query and Phase 212 state-scoped floor.
- POST /api/essentials/coordinate-lookup — a body-only, rate-limited, anonymous HTTP endpoint that classifies a submitted `{lat, lng}` and either returns a 422 with one of three distinct rejection codes or the officials at that point via the Plan 01 `getRepresentativesByCoordinate`, with zero coordinate echo/logging.
- Shipped the anonymous `POST /api/essentials/coordinate-lookup` endpoint to production (Render, from master) and proved its full privacy + correctness contract against the LIVE host — exactly one US House rep + state/federal floor, three distinct 422 codes, zero DB writes, and no coordinate echo/log — with operator sign-off.
- Pure `classifyInput()` combobox classifier plus `searchLocationsByName`/`lookupCoordinate` anonymous `api.jsx` client functions, both live-curl-verified against the real Phase 212/213 endpoints and fully covered by 29 new colocated Vitest cases.
- Shared, fully-controlled `<LocationCombobox>` (WAI-ARIA combobox + `useListNavigation({virtual:true})`) wired to the Plan 01 classifier/API client, plus a Google-free `localitySearch.js` exposing `browseAreaRoute` and the new `coordinateRoute` cross-page hand-off contract (`lat`/`lng`/`coord_raw`).
- Results header rewired to one always-editable `<LocationCombobox>` (Address/Browse toggle, address `<input>`, `<LocalityMatches>`, and `<LocationBrowser>` all removed) plus a single shared `resolveCoordinate()` that serves both the in-page coordinate submit and the on-mount `lat`/`lng`/`coord_raw` Landing hand-off, direct-injecting officials into the existing `browseResults` state with a client-sourced (D-05) resting label and banner guard.
- Landing.jsx's search bar now renders the identical shared `<LocationCombobox>` instance powering Results, with its coordinate submit handing off to Results via the Plan 02 `coordinateRoute(lat,lng,raw)` contract; Google Places autocomplete and `LocalityMatches` usage fully removed from Landing, coverage list and candidate-by-name search untouched.
- Deleted the three now-orphaned Google Places modules (`useGooglePlacesAutocomplete.js`, `LocationBrowser.jsx`, `LocalityMatches.jsx`), removed the non-contiguous `.pac-container` CSS block from `index.css` while preserving the unrelated `.ev-candidate-enter` animation, uninstalled `@googlemaps/js-api-loader` via `npm uninstall`, and ran the SRCH-08 scoped + secondary sanity grep gates (fixing two stray comment references outside the documented Civic-API allow-list) — full build and 256/256 test suite green.
- Operator sign-off: APPROVED.
- Added TAB_TYPE_DEFAULTS constant and extracted resolveIsAppointed/matchesAppointedFilter from Results.jsx into classify.js as unit-tested exports, proving the Judges=Appointed exception with an automated assertion instead of code inspection.
- Results.jsx now filters each of the three tab hierarchies (representatives/educators/judges) independently by its own fixed TAB_TYPE_DEFAULTS constant instead of one shared appointedFilter state, FilterBar.jsx is reduced to only the Compass toggle, and three dead filter component files are deleted — verified live at Bloomington, IN (desktop + mobile), operator-approved 2026-07-23.
- LensChipRow.jsx lens buttons go icon-only on desktop with a @floating-ui/react hover/focus tooltip and per-button aria-label, replacing the unreliable native `title` attribute — verified live (desktop/mobile), operator-approved 2026-07-23.
- Phase 216 — Unincorporated locality label: the results banner reads "Unincorporated {County}, {ST}" for a searched point (address or coordinate) outside any incorporated place but within a county, gated to the 11 place-loaded states; shipped + live-verified (accounts-api `b0842f57`, essentials `95dda22f`).
- Close-time polish (folded into v24.0): bare place-name labels — "Bloomington, IN" instead of "City of Bloomington, Indiana, US, IN" — via `cleanPlaceName()` in the Phase 212 resolver (accounts-api `37365399`), and lens tooltips now show the lens name + a plain-language focus summary, e.g. "Judicial Lens — How judges & DAs approach the law" (essentials `f3c02a9d`). Both live-verified at Bloomington, IN.

---

## v23.0 Educators & Judges Tabs (Shipped: 2026-07-20)

**Phases completed:** 5 executed (207, 208, 210, 210.1, 211), 11 plans. Phase 209 (Education Lens Scaffolding) **deferred by design**.

**Stats:** 70 commits · 55 files changed (6 source: `classify.js`/`classify.test.js`/`compass.js`/`compass.test.js`/`Results.jsx`/`index.css`) · +8,362 / −265 · 3 days (2026-07-17 → 2026-07-20) · git range `d1598b1f` → `821b3ee1`

**Delivered:** Added **Educators** (school-board) and **Judges** as first-class, compass-integrated tabs beside **Representatives** and **Elections** on the results/officials view. School-board and judicial office-holders are pulled out of the Representatives list (decluttering the LA-style school-board sprawl), tabs hide entirely when a location has none, and the default compass lens shifts per tab. Frontend/data only — no new geographic/seeding data; classification runs off existing chamber/office/geo-type data. Ran alongside the still-open v22.0 (Tucson & Arizona) close. In-scope requirements 7/7 satisfied; EDU-01/02 deferred with Phase 209. Cross-phase integration PASS; build clean; 211/211 tests. DB-verified at close in the [v23.0 milestone audit](milestones/v23.0-MILESTONE-AUDIT.md).

**Key accomplishments:**

- **Single-source classifier (207):** `classifyBucket(pol)` in `src/lib/classify.js` buckets every office-holder into representative/educator/judge via a `district_type` base plus additive-only title/chamber overrides (DA/prosecutor, school superintendent, LOCAL-mistyped school boards), null-safe, verified with 54 new unit tests across 3 real contrasting locations (LA, Bloomington/Monroe County IN, an AZ city). CLASS-01.
- **Educators & Judges tabs (208):** `Results.jsx` partitions the live `deduped` roster through `classifyBucket` at a single call site, renders four tabs (Representatives · Educators · Judges · Elections) via one shared `renderPeopleTab` pipeline for full parity, hides empty Educators/Judges tabs, falls back to Representatives on stale/unknown `?view=`, and relocates the election summary + day-pill to the location-header row. Operator-approved on live. TAB-01/02/03.
- **Per-tab compass lens shift (210 + 210.1):** pure `resolveTabLens` + `TAB_DEFAULTS` in `compass.js`, wired via a `tabLensMemory` state + tab-entry effect that shifts the global lens switcher per tab (Judges → Judicial, Educators → Education-scaffolding with honest best-available fallback, Representatives → Best Match), explicit picks remembered per tab and reset on reload; the deferred `education` lens key degrades to Custom overlap without throwing. Gap-closure 210.1 fixed the CR-01 calibrate-and-return revert race. CMP-01/02.
- **Deep-dive federal stances (211):** full-compass, evidence-based, 100%-cited stance research applied for Trump / Vance / Rubio (27 / 20 / 21 live rows) — 0 uncited, 0 null, 0 value drift vs the citation bundle; honest blank spokes for hyper-local/judicial topics; all three compasses render live (Rubio's was empty before). RES-01.
- **Education lens deferred honestly (209):** rather than ship a fabricated Education lens, Phase 209 was deferred (no educator stance research, undefined 5-notch spectrum values, thin topic set). The Educators tab already degrades gracefully; lighting the lens later is a data-only change. EDU-01/02 carried to a future milestone.

**Deferred by design:** Phase 209 / EDU-01 / EDU-02 (Education lens authoring). **Accepted tech debt:** one optional CR-01 calibrate-return live re-check (fix applied + unit/build-verified); RES-01 doc checkbox synced at close; Nyquist VALIDATION.md absent for 208/210.1/211 (optional for a frontend/data milestone).

---

## v21.0 Smart Banners (Shipped: 2026-07-08)

**Phases completed:** 3 phases (187–189), 8 plans

**Stats:** 69 commits · 63 files changed (23 non-planning) · +8,633 / −99 · 2 days (2026-07-07 → 2026-07-08) · git range `c14ea89b` → `d46e823d`

**Delivered:** Filled v19.0's two inert `SectionBanner` scaffolding slots (`featureIcons` + `stats`), turning every section banner into a location-aware hub. Frontend-only, no backend/DB changes. A tethered EV-product icon row deep-links each banner's OWN location (never the user's) into other EV products, and a Census-sourced population strip shows a legible fact per tier — both wired identically into Results and Elections through one shared prop-assembly helper, degrading gracefully to the v19.0 title-only banner when no links or stats exist. 14/14 requirements.

**Key accomplishments:**

- **Tethered Treasury deep-links (187):** per-tier resolvers (`findMatchingMunicipality` / `findStateTreasuryEntity` / `findFederalTreasuryEntity`) build a `financials.empowered.vote/?entity=<name-state>` link carrying the *banner's own* location, omitting the icon entirely on no-match — no dead links, no greyed placeholders (ICON-01/02/03, TETH-01/02/03/04).
- **Accessible feature-icon chip (187):** bottom-right EV-product chip with an @floating-ui hover/focus tooltip, resolved once via `featureIconMap` and drilled through all 6 section banners across both pages.
- **Census population pipeline (188):** build-time Node/ESM generator (`scripts/gen-population.mjs`) pulls live ACS5-2023 population for ~32K places + 52 states/territories + the national total into a committed FIPS-keyed bundle (`src/data/population.js`); `STATE_FIPS_TO_ABBREV` promoted to an exported single source of truth (STAT-02).
- **Pure `resolvePopulation` + graceful omission (188):** null-on-any-miss resolver (state-abbrev→FIPS, city via geo_id OR name|state index, federal US total) with an injectable maps seam and a 13-case fixture Vitest matrix; `shouldRenderStat` gates the scrim so misses omit cleanly — no zeros, nulls, or broken labels (STAT-01/03).
- **`buildBannerProps` single source of truth (189):** all 6 hand-assembled `<SectionBanner>` call sites (3 per page) replaced with uniform `buildBannerProps(tier, ctx)` one-liners, closing the last Results/Elections prop-assembly divergence (SBAN-01/02/03).
- **Verified cross-page parity + empty-state (189):** 189-VERIFICATION PASS 8/8, operator-approved live — identical icon row + stats strip on both pages across city/state/federal tiers, and a link-less/stat-less banner renders exactly as in v19.0 with no empty containers, layout shift, or console errors (SBAN-04).

**Archived:** `milestones/v21.0-ROADMAP.md`, `milestones/v21.0-REQUIREMENTS.md`. No milestone audit produced — Phase 189 served as the integration/verification phase (PASS 8/8, live operator sign-off).

**Known deferred items at close:** 12 pre-acknowledged cross-milestone artifacts (1 debug + 3 UAT + 8 verification gaps from v5.0/v13.0/v18.0/v20.0) — see STATE.md Deferred Items. None belong to v21.0.

---

## v20.0 Beaverton & Washington County, OR (Shipped: 2026-07-05)

**Delivered:** The Washington County west-metro local layer deep-seeded onto Oregon's existing state
foundation — Washington County Board of Commissioners + 7 west-metro cities + 5 school-district boards →
600×750 headshots + evidence-only compass stances (school boards deferred by design) → 2026 election race
shells + confirmed candidate slate + armed discovery pipeline. Every west-metro resident routes to their
county, city, and school district, and city/county officials carry a compass. DB-verified at close in the
[v20.0 milestone audit](v20.0-MILESTONE-AUDIT.md).

**Phases completed:** 174 (school-district G5420 geofences) → 175 (Washington County Commission) → 176–182
(7 city deep-seeds) → 183–184 (5 school-board boards) → 185 (2026 elections + candidates + discovery) → 186
(close-out: audit + playbook + milestone close). Phases 169–172 belong to the separately-parked v19.0
frontend detour and are not part of this milestone.

**Key accomplishments:**

- **Washington County opened as a standalone county government** (geo_id 41067, NOT under State of OR) —
  Board of Commissioners = Chair + 4 district commissioners on custom LOCAL geofences
  (`washco-or-commissioner-district-1..4`); 5/5 headshots + stances, 67 stance rows (Phase 175)

- **7 west-metro cities deep-seeded** — Beaverton (7, 91 stances), Hillsboro (7, 60), Tualatin (7, 59),
  Tigard (7, 48), Forest Grove (7, 39), Sherwood (7, 23), Cornelius (4, thin 4-row honest blanks);
  **51 city/county officials, 51/51 headshots, 50/51 with stances, 391 stance rows** (Phases 175–182)

- **5 school-district boards seeded** (roster + headshots, compass DEFERRED by design) — Beaverton SD 48J,
  Hillsboro SD 1J, Tigard-Tualatin SD 23J, Sherwood SD 88J, Forest Grove SD 15; 29 trustees, 28/29
  headshots (1 Harrington gap, no source) on Phase-174 G5420 geofences (Phases 183–184)

- **2026 election layer** — 25 office-anchored OR 2026 General west-metro race rows, 12 candidate rows across
  8 confirmed races (4 new challengers + 8 reuse, per-row citations, antipartisan), 8 discovery_jurisdictions
  armed + one live discovery run completed; 17 races correctly ship 0 candidates pending open filing (Phase 185)

- **All 8 city/county jurisdictions carry the purple `hasContext` chip** (DB-verified honest); 5 school
  districts plain + search-only (compass deferred) — coverage.js reconciled, no edits needed (Phase 186)

- **New patterns documented** — two-table OR state casing (`districts.state='or'` vs `elections/discovery.state='OR'`);
  incumbent-based office resolution for plain-'Councilor' at-large councils; `races.position_name` unique-index
  constraint; shared migration-counter drift; May-primary+Nov-runoff vs straight-to-November election mechanics;
  `chambers.policy_engagement_level` as the admin/no-compass lever

**Stats:**

- 12 phases (174–185) + 1 close-out (186); date range 2026-06-30 → 2026-07-05
- EV-Accounts migrations: structural per city/county/school (175–184) + elections layer 1213/1215/1216/1218/1219
- 80 seated officials · 79/80 headshots · 391 city/county stance rows · 25 races · 12 candidates · 8 discovery jurisdictions
- Known deferred items at close: 12 (see STATE.md Deferred Items) — 3 v20.0 per-phase verification checkpoints
  (Ph177/178/180, operator-approved live + DB-verified in the milestone audit) + 9 stale cross-milestone leftovers

**What's next:** v19.0 Essentials Dark-Mode Redesign & Section Banners remains parked (Phases 169–172) —
resume it, or open a new milestone. Post-close follow-ups (non-blocking) tracked in the v20.0 audit:
Cornelius thin stances, Forest Grove SD-15 headshot gap, 2 new-challenger headshots, ongoing 2026 candidate discovery.

---

## v18.0 Las Vegas & Clark County, NV (Shipped: 2026-06-30)

**Delivered:** Nevada opened as a fully-covered new state — TIGER geofences (all tiers) → State of
Nevada government (Governor + constitutional officers + federal delegation) → 63 state legislators
(seed + 600×750 headshots) → Clark County Commission (governing the unincorporated Las Vegas Strip /
Paradise / Spring Valley) → 4 Clark County metro cities deep-seeded (Las Vegas, Henderson, North Las
Vegas, Boulder City) → CCSD Board of Trustees deep-seeded → NV 2026 elections + discovery pipeline
armed → statewide + US House candidates populated. All 6 metro jurisdictions surfaced in
`src/lib/coverage.js`. DB-verified at close in the [v18.0 milestone audit](v18.0-MILESTONE-AUDIT.md).

**Phases completed:** 158–168 (state foundation through elections + candidates) + 173 (close-out:
audit + surfacing + playbook + milestone close). Phases 169–172 belong to the separately-parked v19.0
frontend detour and are not part of this milestone.

**Key accomplishments:**

- **Nevada opened as a new state** — TIGER geofences loaded for all boundary tiers (G4110 cities,
  G4020 counties, CDs, SLDU, SLDL); any NV address routes to the correct federal, state, county,
  and city representatives (Phase 158)

- **63 NV state legislators seeded with offices + 600×750 headshots** (21 Senate + 42 Assembly,
  archive.leg.state.nv.us, us_government_work license) — compass stances deferred to follow-up
  (the OR v8.0→v9.0 split pattern) (Phase 160)

- **6 Clark County metro jurisdictions deep-seeded** — Clark County Commission (7 members + Chair
  Naft title-on-seat, governs the unincorporated Strip), City of Las Vegas (7, 36 stances),
  Henderson (5, 28 stances), North Las Vegas (5, 18 stances), Boulder City (5, 19 stances), CCSD
  (11 trustees, 0 stances by design); **40 seated metro officials, 36/40 headshots, 133 total metro
  stance rows** (Phases 161–166)

- **5/6 jurisdictions carry the purple `hasContext` chip** (Las Vegas, Henderson, North Las Vegas,
  Boulder City, Clark County); CCSD plain chip by design (school-board compass deferred) (Phase 173)

- **0 split-section defects** across all 6 metro jurisdictions (scan clean)
- **New structural patterns established and documented** — standalone-county-not-under-state (Clark
  County is its own government, geo_id 32003, NOT nested under State of NV); custom LOCAL ward MTFCC
  codes (Henderson wards X0016, North Las Vegas wards X0017); lowercase `'nv'` casing for all
  district joins; Strip = unincorporated Clark County (no G4110 city match at a Strip address)

- **NV 2026 elections + discovery armed** — Governor + 42 Assembly + ~10 Senate + 4 US House race
  rows + discovery_jurisdictions cron_active (Phase 167); statewide + US House candidate roster
  populated (Phase 168)

- **Nevada playbook captured** — 6 Cities Onboarded rows, 3 NV GOTCHAs, Nevada Quick Reference block
  (ext_id schemes, geo_ids, WAF map, browse params) added to `LOCATION-ONBOARDING.md` (Phase 173)

**Stats:**

- 11 data phases (158–168) + 1 close-out phase (173); date range 2026-06-22 → 2026-06-30
- 40 metro seated officials · 36/40 headshots · 133 metro stance rows
- 63 legislature ride-along (seed + headshots only, 0 stances by design)
- **Next migration: 1115** (on-disk counter authoritative; stance migrations apply audit-only /
  unregistered; structural migrations register normally)

**Tech debt carried forward (D-08):**

- **NV legislature compass stances deferred** — 63 legislators seeded + headshots but 0 stances;
  explicit follow-up milestone (the OR v8.0→v9.0 split pattern) (D-08.1)

- **Mesquite** — Clark County's smallest incorporated city (~20k pop.) not seeded; candidate for a
  future Clark County wave (D-08.2)

- **Browse-government-list state-leak bug** — browsing an unseeded city leaks stale prior-location
  officials under the wrong state banner; backend follow-up fix deferred (D-08.3)

- **Phase renumber 169→173** — phase numbers 169–172 are occupied by the parked v19.0 frontend
  detour; the NV Retrospective was renumbered to 173 on 2026-06-30 to avoid directory collision;
  numeric execution order is otherwise unaffected (D-08.4)

**Audit:** [v18.0-MILESTONE-AUDIT.md](v18.0-MILESTONE-AUDIT.md)

---

## v19.0 Essentials Dark-Mode Redesign & Section Banners (Shipped: 2026-06-28 · formally closed: 2026-07-05)

**Delivered:** A frontend-only detour that adopted the Figma dark-mode visual design across the
Results/Representatives and Elections pages and replaced the Local/State/National tier sort buttons with
scrollable, full-bleed, location-aware `SectionBanner` dividers between City → State → Federal — recreating
Aditi's Bloomington-banner treatment as a reusable, data-ready system. Build completed 2026-06-25 → 06-28
(all phases verified + operator-signed-off + deployed); the formal milestone close was deferred while the
v18.0 (NV) and v20.0 (WashCo OR) data-track milestones ran, then executed 2026-07-05.

**Phases completed:** 169 (dark-token foundation: DARK-01/02) → 170 (section banners + continuous scroll +
sort-button removal on Results: BANR-01/02/03/04, NAV-01) → 171 (banner asset pipeline + 2 exemplar sets:
ASST-01/02) → 172 (Elections page parity: DARK-03, BANR-05).

**Key accomplishments:**

- **Figma dark-mode design system** — GitHub-dark palette migrated into `src/index.css` `@theme` tokens
  (single source of truth: ev-navy #0d1117, ev-navy-card #161b22, ev-teal-light #00c8d7, +text tokens);
  Inter/Manrope self-hosted; ev-ui components dark-themed via `.dark .ev-* {…!important}`; light mode
  untouched; PoliticianCard 4:5 geometry preserved (Phase 169)

- **Reusable `SectionBanner` component** — full-bleed image + dark gradient + location label/pin, tinted
  gradient fallback, empty stats + feature-icon scaffolding slots; tier sort control removed; Results
  renders City → State → Federal in one continuous scroll (Phase 170)

- **Banner asset pipeline** — `docs/banner-asset-pipeline.md` 8-stage runbook + `scripts/banners/`
  (`process_banner.py` 1700×540 q90 LANCZOS + `upload_banner.py` service-role-key-from-env); 6 exemplar
  assets live in Storage (Bloomington/IN/US + LA/CA/US) wired into `buildingImages.js`; D-04 dead-asset
  cleanup (Phase 171)

- **Elections page parity** — dark-token swap + `SectionBanner` per tier threaded from Results; seeded
  ordering, unopposed/no-candidate handling, `elections/me` auto-load, and MiniCompass all preserved
  (provably color-only diff); operator deploy sign-off (Phase 172)

**Stats:**

- 4 phases (169–172), 9 plans; build date range 2026-06-25 → 2026-06-28
- Frontend-only — no backend/DB schema changes; 59/59 unit tests green + build clean at each phase
- 11/11 requirements (DARK/BANR/NAV/ASST); all phase VERIFICATION.md files `passed`

**What's next:** Deferred dark/banner enhancements (out of v19.0 scope) — live banner stats data-slot
wiring, feature-icon links, banner art for the ~10 remaining covered states, and Landing + profile-page
dark treatment. A natural next milestone if the frontend track resumes.

**Audit:** [v19.0-MILESTONE-AUDIT.md](v19.0-MILESTONE-AUDIT.md)

---

## v17.0 LA County City Coverage — Wave 2 (Shipped: 2026-06-22)

**Delivered:** 15 LA County cities deep-seeded end-to-end (government + roster → 600×750 headshots →
evidence-only compass stances) and surfaced on the Landing page. This wave was **reconcile-heavy** —
most cities were already partially seeded (v7.0-era skeletons), so each phase pre-checked the DB,
merged duplicate chambers, relabeled At-Large→by-district where charters had changed, and reseated
for June-2026 election turnover. DB-verified at close (read-only) in the v17.0 milestone audit.

**Phases completed:** 142–156 (one city per phase) + 157 (close-out: audit + surfacing + milestone close)

**Key accomplishments:**

- **15 cities deep-seeded** — Long Beach, Santa Clarita, Glendale, Lancaster, Palmdale, Pomona,
  Torrance, Pasadena, Downey, El Monte, West Covina, Inglewood, Burbank, Norwalk, Bellflower;
  **92 seated officials**, **91/92 headshots** at 600×750 (only Lancaster Ken Mann gap),
  **445 evidence-only compass stance rows** (Phases 142–156)

- **All 15 cities carry ≥1 stance → all surfaced with the purple `hasContext` chip** in
  `src/lib/coverage.js` (verified honest against per-city DB stance counts, D-02)

- **Reconcile patterns proven & documented** — duplicate-chamber merges (Pasadena, Inglewood,
  West Covina), At-Large→by-district relabels (Palmdale, Pomona, El Monte Ord. 3010, Bellflower
  Ord. 1410), directly-elected vs rotational mayor disambiguation (Downey Frometa-not-Sosa,
  Norwalk Perez-not-Ayala), wrong-person headshot fixes (West Covina Gutierrez; Pomona stale-PCE
  avoidance); captured as the "LA County Wave-2 (v17.0)" GOTCHA block in LOCATION-ONBOARDING.md

- **Split-section scan clean** across all 15 Wave-2 cities (0 rows)
- Shared UI fix `src/lib/groupHierarchy.js` (Mayor > Mayor Pro Tem ordering) committed to main (a235f25)

**Stats:**

- 16 phases (142–157); structural migrations through ~1047 on disk (next migration: 1048)
- 5 days (2026-06-18 → 2026-06-22)
- 15 cities · 92 officials · 91/92 headshots · **445 stance rows**; split-section 0/15
- Stance migrations applied **audit-only** (raw SQL; bypass `supabase_migrations.schema_migrations`) —
  counts verified from `inform.politician_answers`; the on-disk file counter is authoritative

**Tech debt carried forward:**

- **Split-section cleanup — 5 NON-Wave-2 councils** (Whittier, Compton, Carson, South El Monte,
  South Pasadena): pre-existing v7.0/v15.0 defects, out of scope since Phase 143; candidate for a
  dedicated cleanup phase (see audit LAC2-SPLITSEC-01)

- **groupHierarchy.js Mayor>Mayor-Pro-Tem fix** committed to main (a235f25) — **production deploy
  still pending** (LAC2-DEPLOY-01)

- Lancaster Ken Mann headshot backfill; 9 honest blank-spoke officials to revisit as records accrue

**Audit:** [v17.0-MILESTONE-AUDIT.md](v17.0-MILESTONE-AUDIT.md)

---

## v16.0 Utah Coverage (Shipped: 2026-06-18)

**Delivered:** Full Utah coverage parity with prior states — all 10 Utah city governments
deep-seeded end-to-end (roster → headshots → evidence-only stances) and complete compass
coverage for the entire 104-member state legislature. Utah is the third US state (after
Oregon and Maryland) with full legislature-wide compass coverage. Surfaced on the Landing
page. Executed as a continuous ad-hoc push immediately after v15.0; formalized as a
milestone retroactively 2026-06-18 (DB-verified).

**Phases completed:** 139–141 (migrations 777–876)

**Key accomplishments:**

- 10 Utah cities deep-seeded biggest-first — Salt Lake City, West Valley City, West Jordan,
  Provo, Orem, Ogden, Sandy, St. George, Lehi, Layton; ~72 elected officials, 71/72 headshots
  at 600×750 (only SLC D4 Napier-Pearce gap), 296 evidence-only city stance rows (Phase 139)

- Utah State Senate split-section repair — 4 senators repointed from county chambers to the
  Utah State Senate chamber; Senate 29/29, House 75/75, section-split scan clean (Phase 140)

- **Full legislature compass coverage — 104/104 Utah state legislators with evidence-only
  stances (29 Senate + 75 House), 955 stance rows**; every value name-confirmed on le.utah.gov
  roll calls / sponsored bills / first-party statements; no defaults, honest blanks (Phase 140)

- Landing.jsx integration — all 10 UT cities in COVERAGE_STATES (browseStateAbbrev:'UT' +
  hasContext:true); legislature surfaces via browse_state=UT (districts.state='ut') (Phase 141)

**Stats:**

- 3 phases (139–141), migrations 777–876
- 2 days (2026-06-17 → 2026-06-18)
- 1,251 total Utah stance rows (955 legislature + 296 city); next migration: 877

**Tech debt carried forward:**

- SLC/Ogden/Layton have 5 duplicate/stale council office rows (incl. a duplicate Victoria
  Petro record with 9 stranded stances) that render as duplicate councilmembers — cleanup
  migration pending (see audit UT-CITY-01)

- SLC D4 Napier-Pearce: no portrait + 0 stances (appointed 2026-06-09; intentional)
- HD64 Jackie Larson: revisit other topics after the 2027 Utah session

**Archive:** [milestones/v16.0-ROADMAP.md](milestones/v16.0-ROADMAP.md) | Requirements: [milestones/v16.0-REQUIREMENTS.md](milestones/v16.0-REQUIREMENTS.md) | Audit: [v16.0-MILESTONE-AUDIT.md](v16.0-MILESTONE-AUDIT.md)

---

## v10.0 Multnomah County & School Boards (Shipped: 2026-06-04)

**Delivered:** Expanded Portland coverage to the full Multnomah County area and added elected school board coverage across all currently-covered cities (OR, CA, TX, IN, ME). Established the G5420 TIGER UNSD school board seeding pattern across 4 states — 22 school districts, 109+ board members seeded, 4 state-specific boundary loaders created.

**Phases completed:** 83–89 (22 plans total)

**Key accomplishments:**

- Multnomah County Board of Commissioners government body seeded — 5 commissioners + Chair Vega Pederson with headshots; unincorporated OR address routing fixed (no empty LOCAL section) (Phase 83)
- 5 smaller Multnomah cities seeded — Gresham (7 officials, 7 headshots), Troutdale (7/7), Fairview (7, no-photo), Wood Village (5/5), Maywood Park (5, no-photo); ENCLAVE_CITY_ALIASES deployed for Maywood Park routing; groupHierarchy.js mayor-first fix (Phase 84)
- 18 Multnomah 2026 race rows seeded + discovery_jurisdictions armed for geo_id=41051 (Phase 85)
- 6 Multnomah County school district G5420 geofences (load-or-school-boundaries.ts, TIGER UNSD) + 38 board members seeded — PPS, Parkrose, Reynolds, Centennial, David Douglas, Riverdale (Phase 86)
- 6 CA city school boards seeded — SFUSD/SDUSD/SCUSD/SJUSD/FUSD/BUSD, 34 officials, office titles per district (Commissioner/Director/Trustee); groupHierarchy.js seat-label sort fix (Phase 87)
- 5 Collin County TX ISDs seeded — Plano/McKinney/Allen/Frisco/Richardson, 35 board members, Richardson hybrid Place ordering (Districts 1-5 + Places 6-7); Allen Mayor re-pointed via migration 267 (Phase 88)
- IPS all 7 seats wired (D3 inserted + D2/D7 updated), MCCSC D7 updated; 5 ME city school boards seeded — Lewiston/Bangor/South Portland/Auburn/Biddeford, 37 officials; all 40 Phase 89 CMS-blocked (no-photo documented) (Phase 89)

**Stats:**

- 7 phases (83-89), 22 plans
- 4 days (2026-05-31 → 2026-06-04)
- 113 commits; 749 files changed, 27,907 insertions
- Next migration: 268

**Tech debt carried forward:**

- 40/40 Phase 89 officials (ME + IN school boards) have no headshots — CMS platforms block server-side fetches; browser automation required
- South Portland D1 (Rauscher) + At-Large (Ryan) names assumed from JS-only source
- Fairview + Maywood Park + Allen ISD + Whitehurst-Payne: confirmed online headshot unavailability

**Archive:** [milestones/v10.0-ROADMAP.md](milestones/v10.0-ROADMAP.md) | Requirements: [milestones/v10.0-REQUIREMENTS.md](milestones/v10.0-REQUIREMENTS.md) | Audit: [milestones/v10.0-MILESTONE-AUDIT.md](milestones/v10.0-MILESTONE-AUDIT.md)

---

## v9.0 Oregon Legislature Stances (Shipped: 2026-05-31)

**Delivered:** Full legislature-wide compass coverage for Oregon — 536 stance values for all 90 state legislators (30 senators + 60 house reps), 100% citation rate, making Oregon the first US state with complete compass coverage. All stances from oregonlegislature.gov OLIS floor vote records + public record sources. 90 sequential research runs (no parallel); zero not-found legislators.

**Phases completed:** 82 (3 plans total)

**Key accomplishments:**

- 215 stances for all 30 OR senators (SD-01..SD-30); HIGH evidence senators reached 10-12 stances (Gelser Blouin, Wagner, Frederick, Drazan) — migration 242 applied (Phase 82 Wave 1)
- 321 stances for all 60 OR house reps (HD-01..HD-60); no not-found legislators — OLIS floor votes provided minimum evidence for all; Eastern OR members capped at 3 per rate-limit guidance — migration 243 applied (Phase 82 Wave 2)
- Verification: 536/536 citation parity (100% — zero uncited answers); compass spot-check 6/6 profiles PASS (3 senators + 3 house reps) (Phase 82 Wave 3)

**Stats:**

- 1 phase (82), 3 plans
- Shipped same day as v8.0 close (2026-05-31)
- 536 total stances; 90 sequential research runs; next migration: 244

**Archive:** No separate roadmap archive (single-phase milestone). Requirements: see REQUIREMENTS.md archival.

---

## v8.0 Oregon (Shipped: 2026-05-31)

**Delivered:** Full Oregon state coverage — TIGER geofences, government structure with 5 voter-elected constitutional officers, 90 state legislators with headshots from oregonlegislature.gov, Portland deep seed (2024 charter reform: 4-district × 3-seat RCV council), OR 2026 elections + discovery pipeline (105 race rows), 321 compass stances across 24 OR officials, and OR-specific GOTCHAs documented in the playbook.

**Phases completed:** 72-81 + 77.1 inserted (25 plans total)

**Key accomplishments:**

- Oregon TIGER boundaries loaded — 241 G4110 cities + 6 CD (cd119 key) + 30 SLDU + 60 SLDL + 36 G4020 counties; Portland geo_id=4159000 confirmed; any OR address routes to correct federal, state, and local representatives (Phase 72)
- OR state government scaffolded — 5 voter-elected constitutional officers (Kotek, Rayfield, Read, Steiner, Stephenson), 2 US Senators (Wyden + Merkley), 6 US House reps; all 13 with headshots (Phases 73-74)
- 30 OR state senators + 60 OR house reps seeded with offices linked to STATE districts; 90/90 headshots from oregonlegislature.gov; Portland City Hall → Lisa Reynolds (SD-17) + Shannon Isadore (HD-33) end-to-end (Phase 75)
- Portland deep seed — 2024 charter reform: 4 multi-member council districts (3 seats each, RCV), Mayor Wilson + 12 council + City Auditor Rede + 2 appointed officials; council district boundaries from PortlandMaps ArcGIS (not TIGER); 14 headshots from portland.gov 1_1_320w URLs; Phase 77.1 fixed is_appointed=true omission (Phases 76-77, 77.1)
- OR 2026 elections + discovery pipeline — 105 race rows (Governor + Senate + 6 US House + 30 OR Senate + 60 OR House + 7 Portland City); discovery_jurisdictions for OR statewide + Portland (Phases 79)
- 321 compass stances across 24 OR officials — Kotek 31, Rayfield 24, Bonamici 24, Bentz 21, Hoyle 20; all cited from public record; compass renders on Kotek profile (Phase 80)
- OR Playbook retrospective — 9 OR-specific GOTCHAs (Portland charter reform, per-OBJECTID ArcGIS load, PowerShell Unicode encoding), Oregon Quick Reference block, 2 new Cities Onboarded rows (Phase 81)

**Stats:**

- 10 phases (+ 1 inserted: 77.1), 25 plans
- 9 days (2026-05-28 → 2026-05-31) active; geofences prepared 2026-05-28
- Next migration: 242

**Acknowledged at close:** Phase 75 audit trail gap (6-profile visual spot-check not formally recorded; DB state verified correct). GAP-1 (is_appointed=false on Lee III/Taylor) resolved by Phase 77.1 before close.

**Archive:** [milestones/v8.0-ROADMAP.md](milestones/v8.0-ROADMAP.md) | Audit: [milestones/v8.0-MILESTONE-AUDIT.md](milestones/v8.0-MILESTONE-AUDIT.md)

---

## v7.0 California (Shipped: 2026-05-29)

**Delivered:** Full California state coverage — TIGER geofences for all tiers + LAUSD school board, State of California government DB (8 constitutional officers + 120 state legislators + 54 federal officials), LA backlog closure, 6 CA city deep seeds at full Tier 1 depth (SF/SJ/SD/SAC/Fremont/Berkeley), CA 2026 elections + discovery pipeline armed, 965 compass stances across 68 CA officials, and CA-specific GOTCHAs documented in the playbook.

**Phases completed:** 57-70, 78 (~~71 folded into 78~~) — 42 plans total

**Key accomplishments:**

- California TIGER boundaries loaded — 482 G4110 cities + 404 G4040 CCDs + 80 SLDU + 40 SLDL + 52 CD + 58 G4020 counties; SF consolidated city-county + East LA unincorporated routing confirmed; LAUSD 7 board district geofences (mtfcc=G5420) (Phases 57-58)
- State of California government DB — 8 constitutional officers (deduped from pre-existing seed), 40 CA senators + 80 assembly members with offices linked to STATE districts, 2 US Senators + 52 US House reps; all 174 officials with headshots at 600×750 (Phases 59-61)
- LA backlog closed — CA Governor 2026 race (all SOS-verified challenger candidates), lavote.gov election ID current, 7 LAUSD board members seeded with headshots, LA city structure gaps resolved (Phase 62)
- 6 CA city deep seeds — SF (20 officials, DataSF Socrata, RCV), San Jose (11 officials, ArcGIS DISTRICTINT, RCV), San Diego (11 officials, WKID 2230), Sacramento (9 officials, AEM/CQ5 curl+grep), Fremont (7 officials, 403 workaround), Berkeley (10 officials, Socrata, RCV); all cities with council district geofences + headshots (Phases 63-68)
- CA 2026 elections + discovery — 2 election rows, Governor race + 52 US House races, lavote.gov discovery row, 7 city discovery_jurisdictions rows; all cron_active (Phase 69)
- 965 compass stances across 68 CA officials — SF 366, San Diego 164, Berkeley 126, San Jose 133, Sacramento 120, Fremont 56; all cited from public record (Phase 70)
- CA Playbook retrospective — 11 CA-specific GOTCHAs (charter vs general law cities, RCV jurisdictions, AEM/CQ5 headshot pattern, lavote.gov election ID cycle, LAUSD sub-district pattern), California Quick Reference block, 7 new Cities Onboarded rows (Phase 78)

**Stats:**

- 14 active phases (+ 1 folded: 71), 42 plans
- 8 days active (2026-05-21 → 2026-05-29)
- Next migration: 242 (v8.0 started immediately after)

**Archive:** [milestones/v7.0-ROADMAP.md](milestones/v7.0-ROADMAP.md) | Requirements: [milestones/v7.0-REQUIREMENTS.md](milestones/v7.0-REQUIREMENTS.md)

---

## v6.0 Maine Essentials (Shipped: 2026-05-20)

**Delivered:** Full Maine state coverage — geofences, government structure, executives, 186 state legislators with headshots, Portland deep seed + Tier 2 city incumbents, 380 race rows for 2026 elections with discovery cron armed, and a playbook retrospective that captured 9 Maine GOTCHAs into LOCATION-ONBOARDING.md + 5 updated templates.

**Phases completed:** 49-56 (20 plans total)

**Key accomplishments:**

- Maine TIGER boundaries loaded — 23 cities (G4110) + 2 CD + 35 SLDU + 151 SLDL + 16 counties; any ME address correctly routes to federal, state, and city representatives (Phase 49)
- State of Maine government scaffolded — 6 chambers, 4 executive constitutional officers (Governor Mills + legislature-elected AG/SoS/Treasurer), 2 US Senators (Collins + King), 2 US House reps (Pingree ME-01 + Golden ME-02); all 8 with headshots (Phases 50-51)
- 35 ME state senators + 151 ME house reps seeded with offices + 185 headshots (100% coverage; house thumbnails upscaled from 152×202 with user sign-off) (Phase 52)
- Portland Tier 1 deep seed — 18 officials (Mayor + 9 Council + 4 School Board + Auditor + City Manager + City Clerk), RCV chambers, headshots, Landing.jsx entry (Phase 53)
- Tier 2 city incumbents — Lewiston (8), Bangor (9), South Portland (7), Auburn (8), Biddeford (10); 18 skeletal cities documented as known gaps (Phase 54)
- 380 ME race rows for 2026 — Governor (13 candidates, open seat), US Senate (3 candidates, Collins incumbent), 2 US House races, 372 legislative scaffolding rows with non-null office_id; discovery cron armed for 2026-06-09 + 2026-11-03 (Phase 55)
- LOCATION-ONBOARDING.md retrofitted with 9 Maine GOTCHAs inline at correct steps + Maine in Cities Onboarded + Compass/Treasury stubs; 5 templates updated with state legislature headshots, multi-tier seeding, PowerShell generator, RCV chamber, legislature-elected = appointed (Phase 56)

**Stats:**

- 8 phases (49-56), 14 plans
- Next migration: 185 (post-June-9 ME primary winners follow-up)

**Sign-off:** Human approved Phase 56-02 verification (see .planning/phases/56-me-playbook-retrospective/56-02-VERIFICATION.md)

**What's next:** v6.1 scope TBD — candidates: post-June-9 D primary winners migration, ME G4040 COUSUB town coverage, Compass/Treasury team playbook contributions

---

## v5.0 Location Onboarding Playbook (Shipped: 2026-05-18)

**Delivered:** Built a cold-start, repeatable playbook for onboarding any US city, then proved it by taking Cambridge, MA to Indiana/LA caliber coverage — geofences, government structure, incumbents, headshots, elections, discovery pipeline, and compass stances. The playbook (LOCATION-ONBOARDING.md + 6 templates) is now generalized for any US city.

**Phases completed:** 37-47 (21 plans total; Phase 43 intentionally folded into Phase 44)

**Key accomplishments:**

- `LOCATION-ONBOARDING.md` cold-start playbook (8 steps, 6 templates, 13 Cambridge learnings with [GOTCHA] callouts) — repeatable process for onboarding any US city with no local insider knowledge; new `elections-seed.md` template captures patterns missing before v5.0
- Massachusetts state layer — 281 geofence boundaries (58 G4110 cities + 40 Senate + 160 House + 9 congressional + 14 county); 200 MA legislators + 6 executives + 11 federal officials with 17 headshots at 600×750
- Cambridge city structure — 9-seat at-large City Council (stv_proportional), School Committee, Mayor correctly modeled as council-internal appointed title (not a separately elected exec), City Manager, 16 incumbents with full contact data, Landing page entry
- Cambridge headshots — 15/16 officials at 600×750 JPEG in Supabase Storage; Luisa de Paula Santos confirmed genuine unavailability (group photo ~85px/person)
- MA 2026 elections + discovery pipeline — primary (2026-09-01) + general (2026-11-03) election rows, 10+ Cambridge-area district races, Azeem 2nd Middlesex primary explicitly seeded with politician_id linked, discovery pipeline armed (cron_active=true for geoid='25')
- Cambridge compass stances — 162 stance values for 8/9 councillors + City Manager (10 politicians), all cited from public record; compass renders correctly on councillor profiles (human-verified)

**Stats:**

- 91 files changed (17,480 insertions, 1,340 deletions)
- 10 active phases (+ 1 skipped by design), 21 plans
- 4 days (2026-05-15 → 2026-05-18)

**Git range:** `bda422b` (docs: start milestone v5.0) → `20f0d17` (docs(47): complete phase)

**What's next:** Planning next milestone — `/gsd:new-milestone`

---

## v4.0 Compass Experience (Shipped: 2026-05-14)

**Delivered:** Turned the political compass from an opt-in checkbox into the primary experience for calibrated users — mini compasses on every candidate tile, a Local Lens preset that snaps to 8 curated local topics, synchronized global Min/Max + Lens controls, and automatic compass-default mode on the Elections and Results pages.

**Phases completed:** 33-36 (7 plans total; Phase 35 Hover Modal intentionally parked)

**Key accomplishments:**

- `LOCAL_LENS_TOPICS` (8 verified UUIDs) + `toggleLocalLens()` in CompassContext with snapshot/restore and localStorage persistence — one click to filter all compasses to housing/homelessness/public safety/immigration/transportation topics
- `computeDisplaySpokes()` extracted as a shared pure function in `compass.js` — single source of truth for lens-aware bilateral spoke selection across CompassCard and MiniCompass; fallback algorithm and maxSpokes cap preserved
- `MiniCompass.jsx` — label-free `RadarChartCore` tile with portal tooltip (getScreenCTM dot hit-detection), silent absence below 3 bilateral spokes, and container opacity 0.7 when replacement spokes are present with Lens active
- Mini compass wired into Elections + Representatives candidate tiles via overlay pattern — gradient fade, per-race scope filtering, race deduplication, auto-enable for calibrated users
- `CompassControlsBar.jsx` shared component — sticky Min/Max (Heroicon SVG arrows-pointing-in/out) + Local Lens + Judicial Lens toggle bar extracted from both pages; single source of truth for controls
- Calibrated users (≥3 answers) arrive at `/elections` and Results in compass mode automatically — localStorage null-check auto-enable; explicit `'false'` suppresses re-enable; dual-tab parity verified (Elections + Reps tabs)

**Stats:**

- 32 files changed (4,919 insertions, 221 deletions)
- 3 days (2026-05-12 → 2026-05-14)
- 4 phases (3 active + 1 parked), 7 plans

**Git range:** `f4299302` (docs(33): research phase) → `fa88e8c` (docs(36): complete phase)

**What's next:** Planning next milestone — `/gsd:new-milestone`

---

## v3.0 Collin County, TX Coverage (Shipped: 2026-05-12)

**Delivered:** Populated the Essentials + Compass database for 23 Collin County, TX cities — government structures, 120+ incumbent officials across all tiers, discovery pipeline setup, headshots for Tier 1+2, compass stances where public record exists, and full TX state/federal coverage including 38 US House members and all 31 senators + 150 state reps with geofence boundaries.

**Phases completed:** 12-21 (33 plans total)

**Key accomplishments:**

- Seeded 23 Collin County TX city/town governments with complete structure (23 chambers, 151 offices, all Census FIPS codes); 120+ incumbent politicians across 4 tiers with is_active + is_incumbent flags
- Discovery pipeline armed for 23 TX cities — test run confirmed working (2 Allen Mayor candidates staged from collincountytx.gov); weekly cron at Sunday 02:00 UTC; county domain allowlist enforced
- 100% Tier 1+2 headshot coverage (57 politicians at 600×750 in Supabase Storage); Tier 3/4 best-effort — 34 confirmed online gaps user-verified as unavailable
- 26 compass stance rows for 19 Collin County politicians across 5 cities (Plano, McKinney, Allen, Frisco, Richardson); compass widget renders on all three required profiles (human-verified)
- 38 TX US House members seeded with NATIONAL_LOWER districts + Collin County G4020 geofence; PostGIS county-congressional intersection wired end-to-end — browsing Collin County shows 5 correct US reps in production
- 8 TX state/federal executives (Abbott, Patrick, Paxton, Hegar, Buckingham, Miller, Cornyn, Cruz) with chambers, offices, Wikipedia headshots — all 8 profile pages render correctly
- 31 TX senators + 150 TX state reps with 181 geofence boundaries loaded; any TX address point query returns correct STATE_UPPER + STATE_LOWER results (verified 5 addresses)

**Stats:**

- ~12,590 total LOC (JS/JSX/TS, frontend)
- 10 phases, 33 plans
- 12 days (2026-04-30 → 2026-05-12)

**Git range:** `94e4aa8` (docs(12): research phase TX DB Foundation) → `8657219` (docs(18): add phase verification — 5/5 must-haves passed)

**What's next:** Planning next milestone — `/gsd:new-milestone`

---

## v3.2 Legal Candidate Evaluation Framework (Shipped: 2026-05-10)

**Delivered:** Built civic infrastructure for evaluating judges and City Attorney/DA candidates — an 8-topic judicial compass, bar evaluation data from LACBA/CJP, stance research for 3 LA City Attorney candidates, legal donor activity display, and campaign finance gap closure — all from free/public sources.

**Phases completed:** 26-32 (17 plans total)

**Key accomplishments:**

- Built complete judicial compass DB — 8 topics, 40 stances, 'judicial' role_scope in `compass_topic_roles`; `judicial_role` column on topics enables judge vs. City Attorney/DA sub-role filtering
- JudicialCompassSection.jsx with burnt orange styling, deriveJudicialSubRole, filterJudicialTopics, and EmptyNotchRow for "Stance research in progress"; deployed to production
- Bar evaluation data surfaced — 32 LACBA ratings for LA legal candidates, 2 CJP disciplinary records for Patrick Connolly with plain-language voter-facing descriptions; BarEvaluationSection.jsx on all legal profiles
- Stance research complete for all 3 LA City Attorney candidates — 16 judicial compass stances with source citations from public record (Ashouri 6/6, McKinney 5/6, Roy 5/6)
- Legal Donor Activity — firm-level legal-professional donor data for 4 candidates via real-time contributions query; LegalDonorActivitySection.jsx deployed; no paid APIs required
- Campaign finance gap closed — 16 active LA candidates with la_socrata sources; 246 sources ingested; reusable maintenance procedure documented

**Stats:**

- 67 files created/modified (+11,268 / -200 lines)
- ~12,489 total LOC (JS/JSX/TS, frontend)
- 7 phases, 17 plans
- 4 days (2026-05-06 → 2026-05-10)

**Git range:** `ee6ede1` (docs(26): research campaign finance gap) → `edd560d` (docs(32): complete legal-profile-fixes phase)

**What's next:** v3.0 remaining — Collin County headshots (Phase 17) and compass stances ingestion for Plano/McKinney/Allen (Phase 18)

---

## v3.1 Local Compass Expansion (Shipped: 2026-05-05)

**Delivered:** Expanded the political compass with 10 new LOCAL-scope topics and 10 companion Focused Communities, and wired frontend scope filtering so city council profiles show only locally-relevant questions.

**Phases completed:** 22-25 (7 plans total)

**Key accomplishments:**

- Audited compass scope mechanism — confirmed scope lives in `compass_topic_roles` join table (not `compass_stances`); 42 existing politician answers for "Criminalization of Homelessness" → keep-both decision documented
- Added 10 new LOCAL-scope compass topics with full 5-stance metadata — 50 stance rows and 14 scope-role rows applied to production `inform` schema via Supabase migration
- Seeded 10 companion Focused Communities in `connect.communities` with authored descriptions and `fc_community_slug` backfill — all 10 live at fc.empowered.vote
- Closed Affordable Housing LOCAL scope gap — topic was missing local scope row; migration 20260505000001 added it
- Wired `districtScope` filtering in CompassCard/Profile/CandidateProfile.jsx — local politicians now see only LOCAL-applicable compass topics; cross-cutting topics correctly default to all tiers

**Stats:**

- 29 files created/modified (4,510 insertions, 49 deletions)
- 11,658 total LOC JSX/JS (frontend)
- 4 phases, 7 plans
- 2 days (2026-05-04 → 2026-05-05)

**Git range:** `e2332c1` (docs: start milestone v3.1) → `63512af` (docs(25): complete scope-audit-retirement phase)

**What's next:** v3.0 remaining — Collin County headshots (Phase 17) and compass stances ingestion for Plano/McKinney/Allen (Phase 18)

---

## v2.1 Claude Candidate Discovery (Shipped: 2026-04-25)

**Delivered:** A Claude-powered candidate discovery pipeline that finds, scores, and stages candidates from official election authority sources — scaling to any jurisdiction by adding a single config row, with admin review UI, email alerts, and weekly automated discovery.

**Phases completed:** 5-7 (9 plans total)

**Key accomplishments:**

- 3-table DB schema (discovery_jurisdictions, candidate_staging, discovery_runs) with `citation_url NOT NULL` enforcing hallucination prevention at the schema layer
- Claude agent runner with forced `tool_choice=report_candidates` citation output and server-side web_search — every discovered candidate has a verifiable source URL before reaching the service layer
- Discovery orchestrator with Levenshtein fuzzy name matching at 85% threshold, three-tier confidence scoring (official/matched/uncertain), and withdrawal detection diffed against existing race_candidates
- Admin staging queue — JWT-gated React UI with race grouping, confidence badges, 30-day urgency indicators, and optimistic approve/dismiss with Undo toast
- Email notifications — urgency-aware review email, zero-candidate regression alert, and failure alert via Resend
- Weekly cron sweep at Sunday 02:00 UTC with in-process lock, sequential jurisdiction processing, auto-upsert for official/matched candidates, and sweep-summary email

**Stats:**

- ~57 files created/modified across backend + frontend
- ~1,733 LOC TypeScript (6 core discovery-layer files)
- 3 phases, 9 plans
- 3 days (2026-04-23 → 2026-04-25)

**Git range (backend):** `36cb281` chore(05-01) → `0d89b91` fix(stag-04)

**What's next:** Race completeness audit — detect missing races (not just missing candidates) from official ballot data

---

## v2.0 Elections Page (Shipped: 2026-04-13)

**Delivered:** A dedicated `/elections` page that gives any user instant access to their local ballot — Connected users auto-load with no address input, Inform users get address entry with county shortcuts, and all races surface regardless of candidate count.

**Phases completed:** 1-4 (4 plans total)

**Key accomplishments:**

- Fixed backend LEFT JOIN so races with zero filed candidates are returned with `candidates: []` — not silently dropped by INNER JOIN
- Built standalone `/elections` page with tier-aware auto-load: Connected users with stored jurisdiction see their races instantly via `elections/me`; Inform and no-jurisdiction users get address input with Monroe County and LA County shortcuts
- Fixed hardcoded Indiana state labels in ElectionsView — "State Legislature" / "State Executive" now render correctly for all states
- Three-state race rendering: contested (normal), unopposed ("Running Unopposed" photo overlay), empty ("No candidates have filed" coral notice box)
- Branch-priority ordering within government bodies (Executive → Legislative → Judicial) plus civic-priority Local tier ordering (Mayor → City Council → Township → County → Courts)
- Two discoverability entry points: "Upcoming Elections" landing card and "Elections" header nav item on all pages

**Stats:**

- 28 files created/modified
- ~9,769 lines of JSX/JS/TS (frontend)
- 4 phases, 4 plans
- 2 days (2026-04-12 → 2026-04-13)

**Git range:** `3cbf840` → `45e8389`

**What's next:** Data completeness (CA/IN candidate ingestion, headshots) and Elections page enhancements (tier filter, deep links)

---

## v1.9 Compare UX & Search Fixes (Shipped: 2026-03-01)

**Phases completed:** 0 phases, 0 plans, 0 tasks

**Key accomplishments:**

- (none recorded)

---
