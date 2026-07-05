# Retrospective

## Milestone: v10.0 — Multnomah County & School Boards

**Shipped:** 2026-06-04
**Phases:** 7 (83-89) | **Plans:** 22

### What Was Built

- Multnomah County Board of Commissioners government body + routing fix for unincorporated addresses
- 5 smaller Multnomah cities (Gresham/Troutdale/Fairview/Wood Village/Maywood Park) with officials + headshots
- 18 Multnomah 2026 race rows + discovery pipeline armed
- 6 OR school district G5420 geofences + 38 board members (PPS/Parkrose/Reynolds/Centennial/David Douglas/Riverdale)
- 6 CA city school boards (34 officials); 5 TX Collin County ISDs (35 board members); IN + ME school boards (37 ME officials)
- groupHierarchy.js: mayor-first + seat-label sort + chamber_name fallback (Rule 3.5) fixes
- ENCLAVE_CITY_ALIASES deployed for Maywood Park routing

### What Worked

- TIGER UNSD G5420 pattern: established once in Phase 86 (OR), reused cleanly for CA/TX/IN/ME — 4 state loaders, minimal rework
- Gap-closure discipline: Phase 87-88 UAT failures caught real bugs (groupHierarchy.js sort, SFUSD missing images, Allen Mayor stale data); fixes shipped atomically before close
- Audit-then-merge headshot workflow: Python PIL upload scripts + audit-only migrations = reproducible, traceable uploads

### What Was Inefficient

- Phase 87 and 88 each needed 3 gap-closure plans after initial UAT — school board title/sort conventions vary per district and can't be assumed
- Phase 89 headshots were a dead end: 0/40 uploaded due to CMS blocking. Browser automation (Playwright) should be scoped as a dedicated tool before attempting school board headshots at scale
- SFUSD politician_images gap: 4 rows missing was a seed bug caught only in UAT; pre-flight assertion on images count would have caught this earlier

### Patterns Established

- G5420 TIGER UNSD school board pattern: zip per state → filter GEOIDs → G5420 boundaries → district_type='SCHOOL' → chamber + officials
- Always verify office title from official district website — SFUSD uses 'Commissioner', BUSD uses 'Director', most use 'Board Member'
- groupHierarchy.js Rule 3.5: chamber_name fallback required for school board cards (no qualifyLocalTitle match)
- Richardson ISD hybrid: Districts 1-5 + At-Large Places 6-7 — 'Place N' in office_title needs explicit sort regex

### Key Lessons

- Assume 0 school board headshots when district uses Schoolblocks/Thrillshare/SmartSites/Cloudflare — plan browser automation or manual download before scoping headshot work
- ENCLAVE_CITY_ALIASES requires backend redeploy — coordinate geofence load + env var + deploy as a single unit to avoid routing gaps in production
- Run section-split detector after every school board seed (5 school districts across 4 states — district_type mismatch is easy to introduce)

### Cost Observations

- Agents: stance research pattern not used in v10.0 (data-seeding milestone)
- Sessions: ~5 work sessions across 4 days
- Notable: groupHierarchy.js gap closures consumed more sessions than expected — UI rendering bugs in school board context require app testing, not just SQL smoke tests

## Milestone: v20.0 — West-Metro Washington County, OR

**Shipped:** 2026-07-05
**Phases:** 13 (174–186) | **Plans:** 51

### What Was Built

- West-metro school-district G5420 geofences (5 districts) via the established TIGER UNSD loader (Phase 174)
- Washington County Board of Commissioners as a standalone county government (geo_id 41067, Chair + 4 district commissioners on custom `washco-or-commissioner-district-1..4` geofences) — 67 stance rows
- 7 city deep-seeds end-to-end (gov → roster → 600×750 headshots → evidence-only stances → community banner): Beaverton (91 stances), Hillsboro (60), Tualatin (59), Tigard (48), Forest Grove (39), Sherwood (23), Cornelius (thin 4)
- 5 school-district boards (roster + headshots, 0 compass by design): Beaverton SD 48J, Hillsboro SD 1J, Tigard-Tualatin SD 23J, Forest Grove SD 15, Sherwood SD 88J — 29 trustees, 28/29 headshots
- 2026 election layer: 25 office-anchored race rows, 12 candidates across 8 races, 8 armed discovery jurisdictions + 1 live run

### What Worked

- **Clark County (v18.0) cadence transferred cleanly** — the one-government-per-phase deep-seed unit ran 8 times (175–182) with steadily fewer surprises; per-phase PATTERNS/WR (written-requirement) carry-forward caught template bugs before they shipped
- **Same-shape chaining authorization** paid off — the 7 city deep-seeds are near-identical, so chaining them without re-discussing each was efficient and safe
- **geo_id existence-AND-name gate** (added after the Cornelius 4115350→Coquille trap) prevented seeding a city into the wrong geofence; name-match probes are now mandatory in Wave-0
- **DB-verified milestone audit** (Phase 186) gave an honest, countable close — every jurisdiction's officials/headshots/stances verified against production, not assumed

### What Was Inefficient

- **Migration-counter drift** — the on-disk counter vs the DB `schema_migrations` ledger diverged repeatedly (ledger-trap notes in 179/180/181 Wave-0); parallel non-OR workstreams (AZ/MA/IN) consumed migration numbers, forcing per-phase MAX re-checks
- **Multiple stated geo_ids were wrong** (Tualatin 4175200→4174950, Sherwood 4167450→4167100, Cornelius 4115350→4115550) — roster research supplied plausible-but-wrong place codes; every one had to be corrected at plan time
- **Headshot sourcing varied wildly per city** (direct static `<img>`, CivicWeb portal, finalsite upscale trap, transparent-PNG-composite, WAF-403 fallback chains) — no single pipeline; each city needed a bespoke fetch step

### Patterns Established

- Two-table OR state casing: `districts.state='or'` (lowercase, TIGER joins) vs `elections`/`discovery.state='OR'` (uppercase) — verify before every WHERE filter
- Incumbent-based office resolution for plain-'Councilor' at-large councils (no seat_label) — match on (chamber_id, title) + occupant
- `races.position_name` carries unique indexes — race labels must be unique per election
- Circle-cutout PNG headshots: crop 4:5 INSCRIBED in the circle, never full-frame white composite (Cornelius UAT lesson)
- Community banner is a standing per-city constraint: licensed street-level/skyline photo (Wikimedia/Unsplash, no AI), `offices.representing_city` must be set or the Local banner silently falls back to gradient

### Key Lessons

- **Never trust a stated geo_id** — probe existence AND name-match in Wave-0; a plausible code can resolve to a different city entirely
- **Re-check the migration MAX from the live DB every phase** — the on-disk counter is authoritative for stance (audit-only) migrations, but structural migration numbers collide with parallel workstreams
- **School-board compass deferral is honest, not a gap** — plain search-only chip (COVERAGE_SCHOOL_DISTRICTS, no hasContext) is the correct representation until education-native compass topics exist (CCSD precedent)
- **Thin-stance cities are acceptable** — Cornelius (4 rows) with honest blanks beats fabricated defaults; the no-default rule holds even when coverage looks sparse

### Cost Observations

- Agents: stance research run one-at-a-time per official (rate-limit rule) — parallel would burn Anthropic quota; sonnet used for stance agents
- Sessions: ~6 work sessions across 6 days (2026-06-30 → 2026-07-05)
- Notable: the deep-seed unit is now highly repeatable; the dominant cost was per-city research (roster verification + headshot sourcing + evidence-only stance research), not structural seeding

## Milestone: v19.0 — Essentials Dark-Mode Redesign & Section Banners

**Shipped:** 2026-06-28 (build) · formally closed 2026-07-05
**Phases:** 4 (169–172) | **Plans:** 9

### What Was Built

- Figma dark-mode design system migrated into `src/index.css` `@theme` tokens (single source of truth, GitHub-dark palette); Inter/Manrope self-hosted; ev-ui dark overrides via `.dark .ev-* {…!important}`
- Reusable `SectionBanner` component (full-bleed image + dark gradient + location label/pin, tinted fallback, empty stats + feature-icon scaffolding slots)
- Results converted to continuous City → State → Federal scroll with banner dividers; tier sort control removed
- Banner asset pipeline: `docs/banner-asset-pipeline.md` runbook + `scripts/banners/{process,upload}_banner.py`; 2 exemplar sets live (Bloomington/IN/US + LA/CA/US)
- Elections page brought to dark parity + the same banner dividers (behavior-preserving, color-only diff)

### What Worked

- **Token-first sequencing** — Phase 169 established the dark palette as a single source of truth before any component work, so 170–172 only referenced tokens, never re-derived literals; the "stale dark literal" grep became a clean, repeatable verification gate
- **Scaffolding-not-features discipline** — BANR-04 shipped empty stats/icon slots as structure only; resisting the urge to wire live data kept the milestone tight and the deferred list honest
- **Operator visual sign-off per phase** — dark-mode/banner correctness is inherently visual; each phase ended with a human deploy-and-confirm checkpoint rather than pretending code-level checks were sufficient

### What Was Inefficient

- **The milestone was never formally closed for 7 days** — all 4 phases were built, verified, and deployed by 2026-06-28, but the pivot to v18.0/v20.0 left the tracking docs (PROJECT.md/STATE.md/memory) frozen at "parked, 171–172 pending." That stale language caused real confusion at resume time ("what's next?" → nothing, it was done). **Lesson: run the formal close immediately after the last phase verifies, even for a detour milestone — or the records rot.**
- **Parking snapshots vs milestone archives were conflated** — `v19.0-{ROADMAP,REQUIREMENTS,STATE}.md` lived in `.planning/` root as parking snapshots and were mistaken for (absent) milestone archives; the frozen REQUIREMENTS snapshot even showed 4 requirements unchecked that were actually complete
- **ev-ui local alias lag** — `vite.config.js` aliases `@empoweredvote/ev-ui` → local `../ev-ui/dist`, which lagged the npm build; newer exports were absent there and a direct import broke the build (had to shim locally)

### Patterns Established

- Dark tokens: change only the **dark VALUES** in `@theme`, keep names — beware the two-#59b0c4 trap (dark ev-teal-light vs light --ev-light-blue)
- ev-ui dark overrides require `!important` and header child hooks (`.ev-header-secondary/-nav/-mobile-menu`)
- Banner asset convention: `cities/<slug>.jpg`, `states/<ABBR>.jpg`, `national/…`; dark overlay applied at render by `SectionBanner`, source images stored untreated
- Single-source-of-truth for banner inputs: derive `buildingImageMap`/`representingCity`/`userState` once in the parent (Results) and thread as props — child never re-derives (anti-pattern grep guard)

### Key Lessons

- **Close detour milestones the moment they verify** — a "we'll formalize it later" close is the single biggest process debt this project has hit; stale "parked" status outlived the actual work by a week
- **Visual milestones need deployed human sign-off** — code-level verification (grep for stale literals, wiring, tests) is necessary but not sufficient; the "passed (code) / human_needed (visual)" split is the honest status
- **Keep parking snapshots clearly distinct from milestone archives** — name/locate them so they're never mistaken for a formal close

### Cost Observations

- Frontend-only; no stance-research agents; 59/59 unit tests + clean build gated each phase
- Sessions: ~4 focused sessions over 4 days (2026-06-25 → 06-28), then a short close session 2026-07-05
- Notable: cheapest milestone type (no per-jurisdiction research), but the deferred-close cost real confusion later — process debt, not token cost
