# Phase 194: City of Tucson Deep-Seed - Context

**Gathered:** 2026-07-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Deep-seed the **City of Tucson** (flagship of the Tucson-metro milestone) as a **greenfield city
government** — one `essentials.governments` row for the City of Tucson, a single **City Council
chamber** holding a directly-elected **Mayor** office (LOCAL_EXEC, at-large) plus **6 by-ward
council offices**, each ward office linked to its own **custom LOCAL ward geofence** so a Tucson
address routes to that resident's single ward councilmember (plus the city-wide Mayor). All 7
officials get 600×750 headshots and evidence-only compass stances; the city carries its own licensed
**downtown-streetscape** community banner; and the City of Tucson is surfaced in
`src/lib/coverage.js` with a DB-honest chip. Satisfies **TUC-01 + BANR-01**.

**In scope:** City of Tucson government row (greenfield city, nests under nothing / standard city
pattern); City Council chamber; Mayor (at-large) + 6 by-ward council offices; sourcing + loading the
**6 official ward-boundary LOCAL geofences** (custom X-code, from Tucson GIS/OpenData); 7/7 600×750
headshots; evidence-only compass stances against the existing live compass topic set; one licensed
Tucson downtown-streetscape community banner (processed via `scripts/banners/`, uploaded to Storage,
wired into `src/lib/buildingImages.js`); coverage.js surfacing.

**Out of scope:** The 4 suburbs (Oro Valley 195, Marana 196, Sahuarita 197, South Tucson 198); Pima
County (Phase 193, already shipped); the AZ **state** banner (already live — Downtown Phoenix
skyline); 2026 election shells / candidate discovery (Phase 199); unreviewed local-lens compass
topics (kept out until separately approved); school-board stances (deferred — no school-board badge
built yet).
</domain>

<decisions>
## Implementation Decisions

### Ward routing & geofences
- **D-01:** **Source the 6 official Tucson ward boundaries** from Tucson GIS/OpenData
  (ArcGIS/open-GIS) and load them as **custom LOCAL geofences with X-code geo_ids** — the Pima
  supervisor-district (`X0019`) / Clark County–LV ward pattern — giving **true per-ward routing**:
  a Tucson resident sees **their one ward councilmember + the Mayor**, not all 6. This is the honest
  UX and matches how residents identify with "their" ward, **even though council members are elected
  city-wide** (see D-03). **Fallback = PAUSE + flag**, not silent degradation: if clean official
  ward boundaries can't be sourced at plan/execute time, STOP and surface it rather than attaching
  all 6 to the whole-city boundary.
- **D-02:** The **Mayor is at-large** → attaches to the existing **Tucson city boundary
  `0477000`** (G4110, live in `essentials.geofence_boundaries` from Phase 190), NOT a ward geofence.

### Election-method / partisan handling
- **D-03:** Tucson's hybrid method is **verified and captured**: council members are **nominated by
  ward in a partisan ward primary** but **elected CITY-WIDE (at-large general)**; Mayor is directly
  elected at-large. Confirm the current details at plan time as part of the roster-currency check.
- **D-04:** Tucson runs **partisan municipal elections** (unusual for AZ). **Record party in the DB**
  (data-honest; useful for roster verification/research) but it is **NEVER displayed** on any profile
  per the antipartisan UI policy — same as every other seeded official, no special-casing.

### Seat & title modeling
- **D-05:** **One City Council chamber**: **Mayor** office (LOCAL_EXEC, at-large) + **6 by-ward
  council offices** on the 6 ward geofences. The **Vice Mayor is a title annotation on whichever
  sitting council member currently holds it** (rotates annually — by-district relabel / Pima Chair
  pattern), **NOT a separate 7th+ seat**. A genuinely **vacant** ward seat → **vacant office**, never
  a departed member.

### Compass stances (carried from Phase 193 template)
- **D-06:** Research stances against the **existing live compass topic set — ALL applicable topics**,
  **evidence-only, 100% cited, no defaults, honest blanks**, discrete 1–5 "chairs", **researched one
  official at a time** (quota). Options (5 chairs/topic) come from the live compass API. Exclude the 8
  judicial-* topics. The **10 proposed local compass questions / 8 Local Lens topics remain OUT**
  until separately reviewed.

### Banner
- **D-07:** **Downtown Tucson streetscape** (real licensed photo — e.g., Congress St / historic
  district, ideally with Sentinel Peak or Catalina Mountains backdrop). **No AI, no aerial.** Chosen
  to stay **visually distinct** from Pima County's Catalinas/Saguaro landscape banner and the
  AZ-state Phoenix skyline (Pima deliberately took the natural-landscape scenery so Tucson could take
  the streetscape). Sourced one-at-a-time, processed via `scripts/banners/`, uploaded to Storage,
  wired into `src/lib/buildingImages.js`.

### Claude's Discretion
- City/office/politician `ext_id` numbering range and the custom geo_id **X-code for the 6 ward
  districts** (follow the LV/Pima `X00xx` convention; pick a clean unused range at plan time — Pima
  used `X0019`).
- **BLOCKING loader-verify checkpoint before loading Tucson wards:** the Phase-193 geofence loader
  passes ArcGIS rings straight as GeoJSON `Polygon.coordinates` (**WR-01** — correct only for
  single-ring geometry). Tucson ward boundaries may be **multi-ring / holed**. Plan MUST verify ring
  structure and, if any ward is multi-ring, fix the loader (`/gsd-code-review 193 --fix` or
  equivalent) BEFORE loading — never silently mis-encode.
- **BLOCKING roster-currency human-verify checkpoint before seeding** (like Phase 192 Task 2 /
  Phase 193): confirm the current Mayor + 6 ward members + who holds Vice Mayor, since the seed must
  reflect who represents a resident *today*.
- Structural-vs-audit migration split (government/chamber/offices/geofences structural + registered;
  headshots + stances audit-only + unregistered) and the plan/wave split (likely: ward
  geofences + government + roster → headshots → stances → banner + coverage → verification).
- Which headshot source wins per official (official City of Tucson `.gov` portrait preferred;
  document license per image; descriptive User-Agent to avoid 403/429).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase planning
- `.planning/ROADMAP.md` §"Phase 194: City of Tucson Deep-Seed" — goal, depends-on (Phase 190),
  success criteria 1–5, "UI hint: yes".
- `.planning/REQUIREMENTS.md` §"TUC-01" + §"BANR-01" — the two requirements this phase satisfies.

### Precedent context (closest analog — county/city standalone deep-seed + custom sub-jurisdiction geofences)
- `.planning/phases/193-pima-county-board-of-supervisors-deep-seed/193-CONTEXT.md` — the **immediate
  template**: standalone-govt pattern, custom X-code LOCAL geofence sourcing (pause+flag fallback),
  by-district relabel Chair→title-annotation, evidence-only all-topics stance scope, banner
  distinctness, coverage/buildingImages wiring. Mirror this ~1:1, swapping supervisor-districts →
  wards and adding a directly-elected Mayor.
- `.planning/milestones/v18.0-phases/162-city-of-las-vegas-deep-seed/` — custom **ward geofence**
  loading pattern (X00xx geo_ids from city GIS; park-drift renumber lesson) — the analog for sourcing
  + loading the 6 Tucson ward LOCAL geofences.
- `.planning/milestones/v18.0-phases/155-norwalk-city-deep-seed/` (and similar CA city seeds) —
  LOCAL_EXEC Mayor + council-chamber city pattern; consult for the Mayor-office shape.

### This milestone's geofence groundwork
- `.planning/phases/190-arizona-tiger-geofences/190-02-SUMMARY.md` — AZ geofence inventory: Tucson
  city boundary `0477000` (G4110) is live in `essentials.geofence_boundaries` (state='04'); the 6
  ward sub-boundaries do NOT exist yet and are this phase's gating dependency.
- `.planning/phases/190-arizona-tiger-geofences/190-CONTEXT.md` — AZ casing rule (LOCAL/lowercase
  `state='az'` for districts), cross-repo + supabase-is-prod notes.

### Prior AZ phase mechanics (conventions to carry)
- `.planning/phases/192-arizona-legislature-seed-headshots/192-01-SUMMARY.md` — blocking
  roster-currency human-verify checkpoint + orchestrator-run psql/MCP apply pattern (executor authors
  SQL/scripts only; orchestrator applies + captures UUIDs + uploads + `git -C` commits).
- Pima loader `C:/EV-Accounts/backend/scripts/load-pima-supervisor-boundaries.ts` — copy-adapt for
  Tucson wards (ArcGIS `f=json` + `outSR=4326` MANDATORY; heed the **WR-01 multi-ring caveat**).

### Banner + surfacing code (frontend repo, current dir)
- `src/lib/buildingImages.js` — where the Tucson banner gets wired (`CURATED_LOCAL`).
- `src/lib/coverage.js` — the DB-honest City of Tucson chip.
- `scripts/banners/process_banner.py` + `scripts/banners/upload_banner.py` — banner processing +
  Storage upload toolchain (banner spec; Storage is no-cache → overwrite = instant refresh).
- `LOCATION-ONBOARDING.md` — per-jurisdiction officials/headshot/banner GOTCHAs.

### Reusable code (backend repo `C:\EV-Accounts`)
- `backend/migrations/` — structural (registered) vs audit-only (headshots/stances, unregistered)
  migration convention; **disk-MAX authoritative for numbering** (Phase 193 used through 1294).
- `backend/scripts/_tmp-*-headshots.py` — gitignored crop-first 600×750 Lanczos headshot pipeline +
  Storage x-upsert, reused verbatim in Phases 192/193.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Pima 193 unit is the template** — standalone-government migration shape + custom X-code
  geofence loader + evidence-only stance pipeline + banner wiring. Copy-adapt, swapping
  supervisor-districts → 6 wards and adding the at-large Mayor office.
- Phase 192/193 headshot pipeline (crop-to-4:5 → resize 600×750 Lanczos → Storage x-upsert) — reuse
  verbatim for the 7 Tucson officials.
- `scripts/banners/process_banner.py` + `upload_banner.py` — reuse for the Tucson banner.

### Established Patterns
- `essentials.governments` → chambers → offices → politicians; district linkage via casing-sensitive
  `state` column. Tucson ward-district rows follow the **LOCAL / lowercase `state='az'`** convention
  (like Pima's X0019), NOT the uppercase `'AZ'` used by STATE_EXEC/NATIONAL tiers — confirm at plan
  time.
- Officials become profile-visible automatically once office + politician + image rows exist; address
  routing resolves via geofences — so the **6 ward geofences are the gating dependency** (city
  boundary `0477000` already exists for the at-large Mayor).
- Compass stances live in `inform.politician_answers`; evidence-only, no default rows; options per
  topic come from the live compass API (36 non-judicial topics; `applies_local` flag).
- **geo_id collision guard:** every office↔district join MUST scope
  `district_type='LOCAL' AND mtfcc='<ward X-code>' AND state='az'` — never a bare geo_id (Phase 193's
  `04019` was a 3-way collision; assume Tucson X-codes need the same disciplined scoping).

### Integration Points
- The 6 ward geofences nest inside the existing Tucson city boundary `0477000`; the section-split
  scan must stay clean after loading them.
- `coverage.js` (City of Tucson chip) + `buildingImages.js` (banner wiring) are the only frontend
  touches (plus the UI-hint work if `/gsd:ui-phase` is run).
- Downstream: the 4 suburb deep-seeds (195–198) reuse this city unit; the Tucson banner must not
  clash with Pima's Catalinas/Saguaro banner or the suburb banners.

### Non-obvious project state
- `gsd-executor` has **NO Supabase MCP/Storage access and NO web tools** — DB pre-checks, migration
  apply, headshot upload, stance writes, and banner upload are **ORCHESTRATOR-RUN** inline (executor
  authors SQL/scripts only). Stance research needs **general-purpose agents run one-at-a-time**
  (quota), exactly as Phase 193.
- All backend work is cross-repo in `C:/EV-Accounts` (`master`→Render, commit via `git -C`);
  `mcp__supabase-local` **IS live production**.
- **Verify-grep false-positive caution** (from 193): don't write literal `f=geojson`,
  `schema_migrations`, or too-tight centroid boxes in files — comments can trip `! grep` audit gates.

</code_context>

<specifics>
## Specific Ideas

- **Per-ward routing is the point:** a Tucson resident should see *their one* ward member + the Mayor,
  so the 6 official ward boundaries must be sourced (pause + flag rather than fake it with the whole
  city boundary), despite the at-large general election.
- **The election method is genuinely unusual** — ward primary → city-wide general, and partisan.
  Capture it honestly (party stored, never shown), and confirm the mechanics at plan time.
- **Vice Mayor reads as** "this sitting council member currently serves as Vice Mayor," not as its own
  elected seat.
- **Banner = Tucson the city** (downtown streetscape), deliberately distinct from Pima's natural
  desert scenery and Phoenix's skyline.
- This city unit is the **flagship template** for the 4 suburb deep-seeds that follow (195–198).

</specifics>

<deferred>
## Deferred Ideas

- **10 proposed local compass questions / 8 Local Lens topics** — keep OUT until separately reviewed
  and finalized; potentially re-run city stance passes against them later.
- **School-board stances** — deferred milestone-wide until a school-board badge is built.
- **Oro Valley / Marana / Sahuarita / South Tucson deep-seeds** — Phases 195–198.
- **2026 Arizona election shells** (incl. Tucson-metro local races) — Phase 199.

### Reviewed Todos (not folded)
None — no pending todos matched this phase.

</deferred>

---

*Phase: 194-city-of-tucson-deep-seed*
*Context gathered: 2026-07-09*
