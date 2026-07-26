# Phase 193: Pima County Board of Supervisors Deep-Seed - Context

**Gathered:** 2026-07-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Seed the **Pima County Board of Supervisors** as a **standalone county government** (its own
`essentials.governments` row at the county FIPS, **NOT** nested under State of Arizona) — one
Board of Supervisors chamber holding **5 district-elected supervisor offices**, each linked to its
own **custom LOCAL supervisor-district geofence** so a Pima County address routes to that resident's
single supervisor. Each supervisor gets a 600×750 headshot and evidence-only compass stances; the
county carries its own licensed community banner; and Pima County is surfaced in
`src/lib/coverage.js` with a DB-honest chip. Satisfies **PIMA-01 + BANR-01**.

**In scope:** Pima County government row (standalone COUNTY, geo_id `04019`); Board of Supervisors
chamber; 5 by-district supervisor offices; sourcing + loading the 5 supervisor-district LOCAL
geofences (custom X-code, from Pima County GIS); 5/5 600×750 headshots; evidence-only compass
stances against the existing live compass topic set; one licensed Pima County community banner
(processed + uploaded + wired into `src/lib/buildingImages.js`); coverage.js surfacing.

**Out of scope:** City of Tucson (Phase 194) and the 4 suburbs (195–198); the AZ **state** banner
(already live — Downtown Phoenix skyline); 2026 election shells (Phase 199); unreviewed local-lens
compass topics (kept out until separately approved); any Maricopa/Phoenix coverage (different
milestone).
</domain>

<decisions>
## Implementation Decisions

### Supervisor-district geofences
- **D-01:** **Source the 5 official supervisor-district boundaries** from Pima County GIS
  (ArcGIS/open-GIS) and load them as **custom LOCAL geofences** with X-code geo_ids — the
  Clark County / Las Vegas ward pattern (v18.0 phases 161/162) — giving **true per-district
  routing** (one supervisor per address). **Fallback = PAUSE + flag**, not silent degradation: if
  clean official boundaries can't be sourced at plan/execute time, stop and surface it rather than
  attaching all 5 supervisors to the whole-county boundary. (Phase 190 loaded only the single
  whole-county boundary: `districts` row geo_id `04019`, label `Pima County`, lowercase `state='az'`,
  `district_type='COUNTY'` — the 5 sub-county supervisor districts do NOT exist yet.)

### Board structure & Chair
- **D-02:** **One `Board of Supervisors` chamber** with **5 by-district supervisor offices** on the
  5 district geofences. The **Chair is a title annotation on the sitting supervisor** who currently
  holds it (board selects the chair annually — rotational), **NOT a separate 6th office** (the chair
  is not separately elected; a separate office would double-count a person). Follows the by-district
  relabel pattern.

### Compass stance scope
- **D-03:** Research stances against the **existing live compass topic set — ALL topics**,
  **evidence-only, 100% cited, no defaults, honest blanks** where a county supervisor has no record
  on a topic, discrete 1–5 "chairs", **researched one supervisor at a time** (quota). This is the
  FIRST AZ jurisdiction to get stances and sets the template for Tucson + the suburbs. The
  **10 proposed local compass questions / 8 Local Lens topics remain OUT** until separately reviewed
  and finalized.

### Pima County banner subject
- **D-04:** Use a **county-representative Santa Catalina Mountains / Sonoran-desert (saguaro)
  landscape** — reads "Pima County" county-wide and stays **visually distinct** from the future
  Tucson-city banner (reserve downtown-Tucson streetscapes for Phase 194) and the AZ-state Phoenix
  skyline (already live). **Real photo, no AI, no aerial**, sourced one-at-a-time, processed via
  `scripts/banners/`, uploaded to Storage, wired into `src/lib/buildingImages.js`.

### Claude's Discretion
- County `ext_id` numbering range for the government/offices/politicians, and the custom geo_id
  X-code for the 5 supervisor districts (follow the LV ward X00xx convention; pick a clean unused
  range at plan time).
- **Roster-currency re-check before seeding** (a blocking human-verify checkpoint like Phase 192's
  Task 2): confirm the current 5 sitting supervisors + who chairs the board before applying, since
  the seed must reflect who represents a resident *today*. Genuinely vacant seat → vacant office,
  never a departed member.
- Structural-vs-audit migration split (structural registered; headshots + stances audit-only,
  unregistered), and the plan/wave split (likely: geofences+government+roster → headshots →
  stances → banner+coverage → verification).
- Which headshot source wins per supervisor (official Pima County `.gov` portrait preferred;
  document license per image; descriptive User-Agent to avoid 403/429).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase planning
- `.planning/ROADMAP.md` §"Phase 193: Pima County Board of Supervisors Deep-Seed" — goal, depends-on
  (Phase 190), success criteria 1–5.
- `.planning/REQUIREMENTS.md` §"PIMA-01" + §"BANR-01" — the two requirements this phase satisfies.

### Precedent context (closest analog — standalone COUNTY + custom sub-county geofences)
- `.planning/milestones/v18.0-phases/161-clark-county-commission-deep-seed/` — standalone COUNTY
  government pattern (government row at county FIPS, own chamber, by-district commissioner offices,
  `COVERAGE_COUNTIES` surfacing). Mirror this ~1:1 for the Pima Board.
- `.planning/milestones/v18.0-phases/162-city-of-las-vegas-deep-seed/` — custom **ward geofence**
  loading pattern (X00xx geo_ids from county/city GIS; park-drift renumber lesson) — the analog for
  sourcing + loading the 5 supervisor-district LOCAL geofences.

### This milestone's geofence groundwork
- `.planning/phases/190-arizona-tiger-geofences/190-CONTEXT.md` — AZ casing rule, cross-repo +
  supabase-is-prod notes.
- `.planning/phases/190-arizona-tiger-geofences/190-02-SUMMARY.md` — AZ geofence/district inventory
  (the Pima County boundary row `04019` this phase's districts nest within).

### Prior AZ phase decisions (conventions to carry)
- `.planning/phases/191-arizona-state-federal-government/191-CONTEXT.md` — cross-repo/migration-ledger
  conventions, headshot-source precedent, elected-vs-appointed + vacancy policy.
- `.planning/phases/192-arizona-legislature-seed-headshots/192-01-SUMMARY.md` — the blocking
  roster-currency human-verify checkpoint + orchestrator-run psql apply pattern (executor authors
  SQL only; orchestrator applies + captures UUIDs).

### Banner + surfacing code (frontend repo, current dir)
- `src/lib/buildingImages.js` — where the Pima County banner gets wired.
- `src/lib/coverage.js` — `COVERAGE_COUNTIES` block for the DB-honest Pima County chip.
- `scripts/banners/process_banner.py` + `scripts/banners/upload_banner.py` — banner processing +
  Storage upload toolchain (banner spec).
- `LOCATION-ONBOARDING.md` — per-jurisdiction officials/headshot/banner GOTCHAs.

### Reusable code (backend repo `C:\EV-Accounts`)
- `backend/migrations/` — structural (registered) vs audit-only (headshots/stances, unregistered)
  migration convention.
- `backend/scripts/_tmp-*-headshots.py` — gitignored headshot pipeline pattern (crop_to_4_5 /
  resize_600x750 / upload_to_storage, reused verbatim in Phase 192).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Clark County standalone-COUNTY migration shape + LV ward-geofence loader — copy-adapt for the Pima
  government + 5 supervisor-district geofences.
- Phase 192's headshot pipeline (`_tmp-az-legislature-headshots.py`) — reuse the crop-first
  600×750 Lanczos pipeline + Storage x-upsert verbatim for the 5 supervisors.
- `scripts/banners/process_banner.py` + `upload_banner.py` — reuse for the county banner.

### Established Patterns
- `essentials.governments` → chambers → offices → politicians; district linkage via casing-sensitive
  `state` column. NOTE: the Pima County boundary row uses **lowercase `state='az'`** (verified),
  unlike the STATE_EXEC/NATIONAL tiers which use uppercase `'AZ'` — the 5 supervisor-district rows
  should follow the LOCAL/lowercase convention; confirm casing at plan time.
- Officials become profile-visible automatically once office + politician + image rows exist; address
  routing resolves via geofences — so the 5 supervisor-district geofences are the gating dependency.
- Migration counter is DB-ledger authoritative; verify MAX before assigning (currently 1287 after
  Phase 192). Structural migs registered; headshot + stance migs audit-only/unregistered.
- Compass stances live in `inform.politician_answers`; evidence-only, no default rows (Phase 192
  asserted 0 stances — this phase is the first to write AZ stance rows).

### Integration Points
- The 5 supervisor-district geofences nest inside the existing whole-county boundary `04019`;
  section-split scan must stay clean after loading them.
- `coverage.js` `COVERAGE_COUNTIES` + `buildingImages.js` banner wiring are the only frontend touches.
- Downstream: Phase 194 (Tucson) reuses this deep-seed unit; the Pima County banner must not clash
  with the Tucson-city banner.

### Non-obvious project state
- `gsd-executor` has NO Supabase MCP/Storage access — DB pre-checks, migration apply, headshot
  upload, and stance writes are ORCHESTRATOR-RUN inline (executor authors SQL/scripts only), exactly
  as in Phase 192.
- All backend work is cross-repo in `C:/EV-Accounts` (`master`→Render, commit via `git -C`);
  `mcp__supabase-local` IS live production.
- Pima County government row does NOT exist yet (greenfield government); the county boundary geofence
  DOES exist (`04019`).

</code_context>

<specifics>
## Specific Ideas

- Per-district routing is the point: a Pima resident should see *their one* supervisor, so the 5
  official district boundaries must be sourced (pause + flag rather than fake it with the county
  boundary).
- The Chair should read as "this sitting supervisor currently chairs the board," not as its own
  elected seat.
- The county banner should feel like Pima County the *place* (Catalinas / Sonoran desert), not like
  downtown Tucson — that streetscape is reserved for the Tucson city banner in Phase 194.
- This phase sets the AZ stance template: evidence-only, honest blanks, all live topics.

</specifics>

<deferred>
## Deferred Ideas

- **10 proposed local compass questions / 8 Local Lens topics** — keep OUT of this phase until
  separately reviewed and finalized; revisit as a compass-topic decision, then potentially re-run
  county/city stance passes against them.
- **City of Tucson + 4 suburbs deep-seeds** — Phases 194–198.
- **2026 Arizona election shells** (incl. Tucson-metro local) — Phase 199.

### Reviewed Todos (not folded)
None — no pending todos matched this phase.

</deferred>

---

*Phase: 193-pima-county-board-of-supervisors-deep-seed*
*Context gathered: 2026-07-09*
