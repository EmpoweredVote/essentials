# Phase 166: CCSD Board of Trustees Deep-Seed - Context

**Gathered:** 2026-06-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Deep-seed the **Clark County School District** (CCSD — 5th-largest US school district) government and its **Board of School Trustees** to Tier-1 depth: government → chamber → roster → 600×750 headshots → evidence-only compass stances → purple `hasContext` chip. A Clark County address returns the correct CCSD trustees with evidence-only stances. Satisfies **CCSD-01**. Depends on Phase 158 (NV TIGER geofences — but see D-04: the CCSD G5420 boundary is **NOT yet loaded** and must be added this phase).

**In scope:** 1 standalone government ("Clark County School District, Nevada, US") + "Board of School Trustees" chamber + **all 11 trustees** (7 elected Districts A–G + 4 appointed per NV AB175/2023); **single G5420 SCHOOL-district routing** (load the CCSD TIGER UNSD boundary, attach all 11 to it); 600×750 headshots; evidence-only stances (all live topics swept, education-cluster lead); surfacing in `src/lib/coverage.js` Nevada block (LV + Henderson + NLV + Boulder City already present).

**Out of scope:** Per-trustee sub-district (A–G) geofence routing — deferred (D-02). The **Superintendent** and other non-elected/administrative CCSD offices. NV 2026 elections (Phase 167). New education-specific compass topics (deferred — compass-design concern). No custom ward/trustee MTFCC this phase.
</domain>

<decisions>
## Implementation Decisions

This phase **carries forward the Boulder City (165) / North Las Vegas (164) deep-seed template** for government modeling, IDs, stance/headshot conventions, and the executor-writes-SQL / orchestrator-runs-psql split. The structural divergences are: (a) it is a **school district** (G5420 SCHOOL routing, not city wards), (b) the **G5420 geofence must be loaded** (unlike the city phases which reused existing geofences), and (c) the roster includes **appointed members**.

### Roster scope
- **D-01:** Seed **all 11 trustees** — the full governing board. **7 elected** (Districts A–G) labeled **"Trustee, District A".."Trustee, District G"**; **4 appointed** (per NV AB175/2023, appointed by Clark County, City of Las Vegas, City of Henderson, City of North Las Vegas) labeled by appointing jurisdiction, e.g. **"Trustee, Appointed – City of Henderson"**. Rationale: the appointed four have full board rights (and gain officer-voting rights in 2027 per SB460) and govern the resident's schools — a 7-only roster would look incomplete vs ccsd.net.
- **D-01a:** The appointed-vs-elected distinction must be **transparent in the office title** (appointed seats carry the appointing jurisdiction in the label, not a fabricated district letter). Wave-0 verifies the live 11-member composition + exact appointing bodies + current officeholders (board officers 2026: Stevens President, Bustamante Adams VP, Dominguez Clerk — officer roles are NOT separate seats, just titles on existing trustees; planner decides whether to surface officer roles at all).

### Routing model
- **D-02:** **Single G5420 `SCHOOL`-district routing is PRIMARY** (matches every existing school district in the app — SF, San Diego, Portland, Boston, Berkeley all use one G5420 boundary with all board members attached). All 11 trustees attach to the **one** CCSD G5420 `SCHOOL` district. Any in-district address returns **all 11 trustees**, each labeled by their district letter / appointing jurisdiction. **Per-trustee sub-district (A–G) routing is explicitly DEFERRED** (would require sourcing 7 trustee-district polygons + a custom MTFCC; and the 4 appointed trustees have no sub-district anyway, so it only refines the elected 7). This is correct for the school-district category and consistent with peers.
- **D-02a:** **The CCSD G5420 TIGER UNSD boundary must be LOADED this phase** — confirmed via DB scout that NV has **no** G5420 geofences (Phase 158 loaded G4000/G4020/G4110/G5200/G5210/G5220 + X0015–X0017 city wards, but **skipped school districts**). Existing school districts load it from `census_tiger_2024` / `tiger_unsd_{state}_2024`. Wave-0 finds the CCSD UNSD **GEOID** (the `geo_id` for the G5420 boundary and the standalone government). CCSD is a county-wide unified district, so the G5420 boundary ≈ the Clark County boundary.

### Stance scope + emphasis
- **D-03:** Research **all live compass topics** per trustee (standing rule), **one agent at a time** (parallel burns rate-limit quota), evidence-only / 100% cited / honest blank spokes / **zero default values** / chairs model (not polarity). **Expect MORE honest blanks than a city council** — most live topics are state/federal in scope (abortion, tariffs, Ukraine, Social Security, etc.) and a school trustee leaves no cited record on them; that is correct and honest, not a gap to fill.
- **D-03a:** **Lead the sweep with the education cluster** (all four emphasized by operator):
  1. **School safety / SROs** → `public-safety-approach` (CCSD operates its own police department — the school-resource-officer debate is the richest CCSD-specific vein).
  2. **School choice & vouchers** → `school-vouchers` (charters, Opportunity Scholarships/ESAs, open enrollment).
  3. **Curriculum / book / DEI policy** → `civil-rights` (+ `religious-freedom`, `trans-athletes` — book-review, DEI, transgender-student & athletics policy).
  4. **School funding & growth** → `taxes` (bonds/capital), `childcare` (pre-K), `growth-and-development` + `residential-zoning` (new-school siting/rezoning), `local-immigration`/`immigration` (ICE-on-campus).
  Every placed stance still requires a cited CCSD-board statement/vote, not inference.

### Government modeling + IDs
- **D-04:** Create a **standalone government "Clark County School District, Nevada, US"** (mirrors the school-district naming convention + the NV city/county standalone pattern), **NOT** nested under the State of Nevada (geo_id 32) government. INSERT via `WHERE NOT EXISTS`. Greenfield — DB scout confirmed no pre-existing CCSD government.
- **D-04a:** Chamber name = **"Board of School Trustees"** (CCSD's official body name — operator chose official over the generic "Board of Education" used by peer districts). District `label` = the CCSD district name; `district_type = SCHOOL` (matches all peer school districts).
- **D-04b:** external_id block uses NV's negative scheme — next block after Boulder City `−3208xxx` is **`−3209001..−3209011`** (11 seats). Wave-0 collision-probe confirms it's free. `geo_id` = the CCSD UNSD GEOID (Wave-0). Casing: `governments.state`/`offices.representing_state` uppercase `NV`; geofence `state='32'` FIPS; district join keys `state='nv'` lowercase.

### Headshots
- **D-05:** Headshot sourcing chain — **ccsd.net/trustees** official portraits + **BoardDocs** (go.boarddocs.com/nv/ccsdlv) first (Wave-0 confirms WAF/serve behavior — unknown) → established workarounds (Chrome-UA curl, background-image grep) → free alternates (Wikimedia Commons with descriptive UA, official campaign, Ballotpedia) → **document a genuine gap** if none exist. 600×750, crop-4:5 then resize (Lanczos q90), **no text/graphic overlays, no fabrication**, mirrored to Storage `politician_photos/{uuid}-headshot.jpg`. `photo_license` set at execution from the actual source. Visually spot-check each portrait for correct-person before insert. Appointed trustees (newer, AB175) may have thinner photo coverage — document gaps honestly.

### Claude's Discretion
- Exact office-row structure under the single G5420 SCHOOL district (recommend: 1 shared SCHOOL district on the CCSD GEOID carrying all 11 trustee offices; must produce 0 section-split and correct labels).
- Whether to surface board-officer roles (President/VP/Clerk) as title annotations or omit them (they are not separate seats).
- Exact external_id assignment within the confirmed `−3209xxx` block.
- Exact display string for trustee labels (district-letter vs "District A" format; appointed-jurisdiction phrasing).
- **Migration numbering: next migration is ~1107** (Phase 165 registered structural 1100; headshot 1101 + stances 1102–1106 were audit-only/unregistered). ⚠ Wave-0 verifies the live on-disk EV-Accounts `backend/migrations` MAX and trusts highest on-disk file +1 (not just `schema_migrations`, which is timestamp-versioned). Migration split: structural (registered, incl. the G5420 geofence load) + audit-only headshot + per-trustee stance migrations (audit-only), following the established deep-seed shape.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirement + milestone conventions
- `.planning/ROADMAP.md` §"Phase 166: CCSD Board of Trustees Deep-Seed" — goal + 4 success criteria.
- `.planning/ROADMAP.md` §"Milestone-wide conventions (carry into every phase)" — deep-seed rules (Tier-1 unit, section-split scan, casing, antipartisan, 600×750, hasContext chip, stance evidence rules).
- `.planning/REQUIREMENTS.md` §"CCSD-01" — the requirement this phase satisfies.

### Primary analog — the immediately-prior NV deep-seeds
- `.planning/phases/165-boulder-city-deep-seed/165-CONTEXT.md` — the directly-parallel decision set (standalone government, evidence-only stances, headshot pipeline, single-district routing). **This phase reuses 165's template MINUS the city model PLUS the G5420 geofence load + appointed-member roster.**
- `.planning/phases/164-north-las-vegas-deep-seed/` (`164-PATTERNS.md`, `164-RESEARCH.md`, `164-VALIDATION.md`, `164-0{1,2,3}-SUMMARY.md`) — structural-migration shape, headshot fallback-chain pipeline, the multi-check E2E verification template, Wave-0 probe pattern, external_id→UUID capture, evidence-integrity lesson (verify roll-calls + project jurisdiction before attributing a board-vote stance to an individual). **Ignore the X0017 ward-loader sections — CCSD uses G5420, no wards.**
- `.planning/phases/161-clark-county-commission-deep-seed/161-CONTEXT.md` + `161-PATTERNS.md` — single-shared-district pattern (all members attach to one district), standalone-government template, NV external_id scheme, ledger registration, executor/orchestrator split. Structurally closest (one shared district, many offices) to the CCSD single-G5420 model.

### School-district routing precedent (the convention this phase follows)
- DB ground truth (scout, this session): every existing school district — San Francisco Unified (geo_id `0634410`), San Diego Unified (`0634320`), Portland Public Schools (`4110040`), Boston Public Schools (`2502790`), Berkeley Unified (`0604740`) — models **one `SCHOOL` district on the single G5420 boundary** with all 5–7 board members attached. Their G5420 boundaries are loaded from `census_tiger_2024` / `tiger_unsd_*_2024`. **CCSD must replicate this AND load its own G5420 boundary** (NV has none yet).
- `.planning/phases/158-*` (NV geofences) — loader key/casing conventions; confirms NV loaded G4000/G4020/G4110/G5200/G5210/G5220 + X0015–X0017 but **NOT G5420** (school districts skipped). The G5420 TIGER UNSD loader pattern from the OR/CA/MA school-district phases is the template.

### NV foundation + migration mechanics
- `.planning/phases/160-nevada-legislature-seed-headshots/160-PATTERNS.md` — NV migration template; **executor has NO supabase MCP** (inline orchestrator applies migrations via `psql -f` using `C:/EV-Accounts/backend/.env` DATABASE_URL; runs the headshot `.py`, all DB probes/audits).

### Stance research + display + schema
- Memories: `feedback_stance_research_one_at_a_time`, `feedback_stance_research_all_topics`, `feedback_stance_no_default_value`, `feedback_compass_chairs_not_polarity`, `project_compass_live_topic_ids` (live topic IDs / retired IDs NOT to use), `project_stance_research_format`.
- Live compass topics (scout, this session): 45 live in `inform.compass_topics` (is_live=true). Education-relevant: `public-safety-approach`, `school-vouchers`, `civil-rights`, `religious-freedom`, `trans-athletes`, `taxes`, `childcare`, `growth-and-development`, `residential-zoning`, `local-immigration`, `immigration`. Most others are state/federal-scope → honest blanks for trustees.
- Schema (confirmed Phases 161–165): `inform.politician_answers` (politician_id, topic_id, value) / `inform.politician_context` (politician_id, topic_id, reasoning, sources) / `inform.compass_topics` (topic_key, is_live) / `inform.compass_stances` (value, text = the chairs). ON CONFLICT (politician_id, topic_id) DO UPDATE.
- `essentials.governments` (INSERT via `WHERE NOT EXISTS`; **no** `government_type` column) / `essentials.chambers` (`official_count`; auto-generated path column GENERATED ALWAYS — never INSERT it; name_formal non-empty) / `essentials.offices` (uniqueness guard `(district_id, politician_id)`) / `essentials.politician_images` (id, politician_id, url, type, photo_license — **no** image-origin column) / `essentials.districts` (uses `label`, no name_formal; `government_id` may be NULL — link via geo_id; `district_type='SCHOOL'`) / `essentials.geofence_boundaries` (geo_id, ocd_id, name, state, mtfcc, geometry, source — the G5420 load target).

### Surfacing
- `src/lib/coverage.js` — add Clark County School District to the **existing Nevada block** in COVERAGE_STATES (LV `3240000` + Henderson `3231900` + NLV `3251800` + Boulder City `3206500` already there). Surfacing target is coverage.js, NOT Landing.jsx. Use the CCSD GEOID + `G5420` for the browse link.
- Browse verification link convention: `essentials.empowered.vote/results?browse_geo_id=<CCSD_GEOID>&browse_mtfcc=G5420`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Peer school-district structural migrations (SF/SD/Portland/Boston/Berkeley: one `SCHOOL` district on a G5420 geo_id, 5–7 offices attached) — the closest structural template. Adapt for 11 offices + the appointed-jurisdiction labels.
- The TIGER UNSD (G5420) geofence loader used by the OR/CA/MA school-district phases (`source` values `census_tiger_2024` / `tiger_unsd_*_2024`) — needed because NV's G5420 is not loaded.
- Headshot pipeline from NLV/Boulder City (`_tmp-*-headshots.py`: crop-4:5 → 600×750 Lanczos q90, runtime UUID resolve by external_id, RGBA→white-composite, descriptive-UA for Wikimedia, x-upsert to Storage) — directly adaptable; ccsd.net/BoardDocs source-cleanliness TBD in Wave-0.
- Per-official stance migration shape `1102..1106_*_stances.sql` (VALUES(topic_key,val,reasoning,sources) → JOIN compass_topics is_live → INSERT answers/context ON CONFLICT) — copy verbatim, per trustee.

### Established Patterns
- Executor/orchestrator split: gsd-executor writes `.sql`/`.py`/loader; inline orchestrator runs all DB probes, applies migrations (`psql -f`), runs the geofence loader + headshot script, runs audits (executor has NO supabase MCP).
- Section-split scan (0 rows) after seed; antipartisan (party stored, never displayed); chambers auto-generated path column is GENERATED ALWAYS; `politician_images` has NO image-origin column; district join keys lowercase `state='nv'`.
- verify-gates grep whole files — keep `slug`/`schema_migrations`/`photo_origin_url` literals out of SQL comments.
- Wave-0 BLOCKING probe + roster operator checkpoint BEFORE any migration applies (on-disk migration MAX, external_id collision, CCSD GEOID + casing, live 11-member roster against ccsd.net/Ballotpedia, G5420 boundary availability in TIGER).

### Integration Points
- Backend `/representatives/me` resolves tiers via PIP (ST_Covers) against `geofence_boundaries` → returns the chamber's offices. School tier: all 11 offices resolve via the one CCSD G5420 boundary (already proven for SF/SD/Portland). No sub-district polygons.
- `src/lib/coverage.js` drives the purple `hasContext` chip surfacing.

</code_context>

<specifics>
## Specific Ideas

- Headline correctness check: a Clark County residential address returns **all 11 CCSD trustees** (7 District-A–G + 4 appointed), with no empty SCHOOL section and no section-split.
- Appointed trustees labeled by appointing jurisdiction ("Trustee, Appointed – City of Henderson" etc.), elected as "Trustee, District A"…; appointed-vs-elected distinction visible, not hidden.
- Stance research leads with school-police/SROs, vouchers/choice, curriculum/book/DEI/trans-athletes, and funding/growth — but sweeps all live topics, honest blanks on state/federal-only topics.
- CCSD's own police department + the SRO debate is flagged as the single richest CCSD-specific evidence vein.

</specifics>

<deferred>
## Deferred Ideas

- **Per-trustee sub-district (A–G) geofence routing** — sourcing the 7 trustee-electoral-district polygons (CCSD/Clark County GIS) + a custom MTFCC to route each address to its ONE elected trustee. Deferred to a future precision phase if the polygons prove sourceable; the 4 appointed seats have no sub-district regardless.
- **ALL CCSD trustee stances** — DEFERRED 2026-06-29 (operator decision during execution). The current civic compass is dominated by state/federal topics a school-board trustee has no cited record on; applying it would render a near-empty compass. Plan 03 was not executed (no stance research, no migrations 1109–1119). Revisit when education-native compass topics exist, or apply a curated education subset later. See 166-03-SUMMARY.md.
- **Education-native compass topics** — the live compass lacks education-specific spokes (teacher pay/contracts, curriculum standards, school-safety as its own topic). A compass-design concern (see `project_local_compass_questions`), not this phase. (This is the precondition for the deferred stance work above.)
- **CCSD Superintendent + non-elected/administrative offices** — out of scope (appointed executive, not a board seat).
- **Other NV school districts** (Washoe, rural counties) — future NV waves.

### Reviewed Todos (not folded)
None — no pending todos matched this phase.

</deferred>

---

*Phase: 166-ccsd-board-of-trustees-deep-seed*
*Context gathered: 2026-06-29*
