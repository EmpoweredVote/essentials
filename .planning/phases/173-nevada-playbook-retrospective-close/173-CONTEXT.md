# Phase 173: Nevada Playbook Retrospective & Close - Context

**Gathered:** 2026-06-30
**Status:** Ready for planning

> **Renumbered from Phase 169 → 173 on 2026-06-30.** Phase numbers 169–172 are occupied by the
> parked **v19.0 frontend detour** (dark-mode design system, section banners, banner asset
> pipeline, elections-page parity) whose completed directories live at
> `.planning/phases/169…172-*`. `gsd-sdk query init.phase-op 169` was resolving to the stale
> `169-dark-mode-design-system-foundation` directory, so the v18.0 Nevada Retrospective was
> renumbered to **173** to avoid the collision. Numeric execution order is otherwise unaffected
> (158 → … → 168 → 173). ROADMAP.md, STATE.md, and REQUIREMENTS.md were updated + committed
> (`5498e9e`) before this context was gathered.

<domain>
## Phase Boundary

Close out the **v18.0 "Las Vegas & Clark County, NV"** milestone. This is a
**verify-and-reconcile + documentation** phase modeled directly on Phase 157 (v17.0 close-out) —
**no new seeding, no reconciling of jurisdiction data, no adding compass stances.** Three deliverables:

1. **Surface (verify-and-reconcile)** — Confirm all covered NV jurisdictions are present and
   correctly wired in `src/lib/coverage.js`, consistent with every other covered state. As of
   2026-06-30 they are **already present** (added incrementally during phases 161–166):
   - **Cities** (`COVERAGE_STATES` → Nevada block): Las Vegas `3240000`, Henderson `3231900`,
     North Las Vegas `3251800`, Boulder City `3206500`, CCSD `3200060`/G5420 — all currently `hasContext: true`.
   - **Clark County** `32003` — present in `COVERAGE_COUNTIES`, currently `hasContext: true`.
   - **State legislature ride-along** — surfaced automatically via `browse_state_officials=NV`
     (Nevada is in `STATE_NAME_TO_ABBREV` → auto-built into `COVERAGE_BROWSE_STATES`); no separate
     grid entry needed. **Verify this is the intended surfacing** (no city-grid row for the legislature).
   So criterion 1 is **presence/consistency verification + the D-01 chip reconciliation**, not a blind add.

2. **Capture learnings** — Update `LOCATION-ONBOARDING.md` with Nevada GOTCHAs, a new
   **Nevada Quick Reference block**, and "Cities Onboarded" rows for the NV jurisdictions.

3. **Audit + close** — Write the DB-verified `.planning/v18.0-MILESTONE-AUDIT.md`, add the v18.0
   "Shipped" entry to `MILESTONES.md`, and flip status in `STATE.md` / `PROJECT.md`.

**NOT in scope:** seeding/reconciling jurisdiction data, fixing pre-existing data defects, adding
compass stances (legislature stances are explicitly deferred — see Deferred), fixing the browse
state-leak bug, or any v19.0 detour work.
</domain>

<decisions>
## Implementation Decisions

### Surfacing + the purple chip (Success criterion 1)
- **D-01 (chip = real DB stance count):** Reconcile every NV entry's `hasContext` against the
  **audit-time DB stance count** (the Phase 157 D-02 rule: `hasContext: true` = purple chip =
  ≥1 compass stance seeded). A jurisdiction with roster + headshots but 0 stances stays **listed
  and browsable** but goes **plain (no purple chip)**. Determine counts from the live DB at audit
  time, not from "we ran a stance phase" assumption.
  - **D-01a (CCSD specifically):** CCSD school-board compass stances were **deferred by design**
    (civic compass is not applied to school boards — see `project_phase166_complete`). CCSD has
    **0 stances by design**, so its chip drops to **plain**. CCSD remains listed/browsable. Do
    **not** invent a school-board-special "roster-seeded" chip semantic — keep the chip meaning
    uniform across all states.
  - **D-01b (Las Vegas + the rest):** Las Vegas was the originally-**parked** phase (v18.0 paused
    at 162, later resumed/completed). Verify its real DB stance count and reconcile its chip
    accordingly — do not assume it has stances. Same reconciliation for Henderson, North Las Vegas,
    Boulder City, Clark County (memory indicates these were seeded with stances — confirm at audit:
    Henderson ~28, Boulder City ~19, North Las Vegas migs 1095–1099, Clark County ~32).
- **D-01c:** All NV geo_ids / browse params are already correct in `coverage.js` (verified
  2026-06-30) — surfacing work is verify + the D-01 chip edits only, not new entries.

### Milestone audit pass bar (Success criterion 3) — carried forward from 157
- **D-02 (structure-hard / data-soft):** Close-blocking bar = **roster structure correctness only**
  (official_count match, correct mayor type, district-vs-at-large, correct chamber after any
  reconcile). Verifying **Las Vegas** structure is part of the hard check (it was the parked phase).
  The following are **documented acceptable gaps, NOT close blockers**:
  - NV legislature compass stances (deferred by design — criterion explicitly allows legislature as
    seed+headshots only).
  - CCSD no-stance (deferred by design — D-01a).
  - Any headshot-source 403 gaps / upscaled low-res sources (consistent with prior-wave reality,
    e.g. Henderson Akamai-403 fallback chain).
- **D-03 (DB-verified, per-jurisdiction):** Verify counts directly against the live Supabase DB
  (`mcp__supabase-local` IS production; queries are read-only). Per jurisdiction: government row,
  chamber + `official_count`, roster count, headshot count, stance count + gap notes. **NV query
  gotchas to bake in:** (a) state casing is **lowercase `'nv'`** (SLDU/SLDL + city districts);
  (b) `essentials.districts` has **no `name_formal`** (use `label`); (c) join districts via geo_id;
  (d) statewide officials are browsed via `browse_state_officials=NV` (not geo_id+G5200).
  **Note:** the `gsd-executor` has **no supabase MCP** — DB-verify runs **inline in main context**
  (or via `psql -f`), as established in prior phases.

### Audit doc format + close mechanics (Success criterion 3) — carried forward from 157
- **D-04:** Write a standalone **`.planning/v18.0-MILESTONE-AUDIT.md`** (root `.planning/`
  location, matching recent milestones v17.0/v16.0/v11.0 — NOT the `.planning/milestones/` subdir).
  Include a per-jurisdiction DB-verified count table (gov / chamber / roster vs official_count /
  headshots / stances + gap notes), the structure-hard/data-soft verdict per jurisdiction, and the
  known-issues / follow-up section (D-06).
- **D-05:** Add the v18.0 "Shipped" entry to `.planning/MILESTONES.md` (follow the existing entry
  shape: Delivered / Phases completed / Key accomplishments / Stats / Git range / What's next), then
  flip milestone status in `.planning/STATE.md` + `.planning/PROJECT.md`.

### LOCATION-ONBOARDING.md update (Success criterion 2)
- **D-06 (NV GOTCHAs + Cities Onboarded rows):** Add one "Cities Onboarded" table row per NV
  jurisdiction (existing 5-column format: City | State | Onboarded | Election method | Notable
  patterns), pulling notable-pattern detail from each phase's CONTEXT/STATE summaries. Capture the
  net-new Nevada GOTCHAs that recurred across 158–168 (WAF map per city; ward-MTFCC custom
  geofences; standalone-county-not-under-state pattern for Clark County; lowercase `'nv'` casing;
  Wikimedia descriptive-UA requirement; etc.).
- **D-07 (Nevada Quick Reference block — FULL playbook scope):** Add a consolidated **Nevada Quick
  Reference** block to `LOCATION-ONBOARDING.md` (new deliverable vs 157). Include the reusable
  scaffolding facts:
  - **ext_id schemes:** Clark County `-3200301..-3200307`; constitutional officers / Controller
    `-3200006`; State Senate `-3203001..-3203021`; Assembly `-3204001..-3204042`; Henderson
    `-3206001..-3206005`; Boulder City `-3208xxx`; North Las Vegas `-3207xxx`.
  - **Geofence MTFCCs:** Henderson wards **X0016**, North Las Vegas wards **X0017** (custom LOCAL
    ward geofences); Strip = unincorporated Clark County.
  - **WAF map:** Henderson cityofhenderson.com = Akamai 403 (per-member fallback chain); plus
    NO-WAF vs WAF notes per city as recorded in phase artifacts.
  - **Casing rule:** state code is lowercase **`'nv'`** everywhere (districts, SLDU/SLDL).
  - **Browse params:** statewide officials via `?browse_state_officials=NV`; city/county via
    `browse_government_list=<geo_id>`; CCSD via `browse_geo_id=3200060&browse_mtfcc=G5420`.
  - **Geo_ids:** LV 3240000 · Henderson 3231900 · N. Las Vegas 3251800 · Boulder City 3206500 ·
    Clark County 32003 · CCSD 3200060.
  - **Migration-counter convention:** on-disk counter authoritative; stance migrations apply
    **audit-only** (unregistered, don't bump `schema_migrations`). Next migration **1115** (counter
    at 1114 per ROADMAP Phase 168 scope note — confirm at execution).

### Known-issues / follow-up to record (Success criterion 3)
- **D-08:** The audit's known-issues / follow-up section MUST record **all four** of:
  1. **NV legislature compass stances** — 63 legislators seeded + headshots but no stances;
     deferred to a dedicated follow-up milestone (the OR v8.0→v9.0 split pattern).
  2. **Mesquite** — Clark County's smallest incorporated city, not seeded; candidate for a future
     Clark County wave.
  3. **Browse-government-list state-leak bug** — government-list browse of an *unseeded* city leaks
     stale prior-location officials under the wrong state banner (see STATE.md outcome note +
     `project_browse_government_list_state_leak`). Deferred fix, not blocking.
  4. **v19.0 detour phase-renumber note** — phase numbers 169–172 are occupied by the parked v19.0
     frontend detour; this phase was renumbered 169→173. Record so future readers understand the gap.

### Claude's Discretion
- Exact wording of GOTCHA entries, "Notable patterns" cells, and Quick Reference phrasing —
  synthesize from per-phase CONTEXT/STATE artifacts.
- Audit table column layout beyond the required DB-verified dimensions.
- Whether to spot-check a sample of NV headshots for wrong-person errors (recommended, not required).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### This phase's spec
- `.planning/ROADMAP.md` §"Phase 173: Nevada Playbook Retrospective & Close" — goal + 3 success criteria
- `.planning/REQUIREMENTS.md` — NV-RETRO-01 acceptance text (line ~84)

### Direct precedent (mirror this phase's structure on it)
- `.planning/phases/157-wave-2-close-out/157-CONTEXT.md` — the v17.0 close-out context; D-01..D-08
  here are adapted from its D-01..D-08. Same three-deliverable shape.
- `.planning/v17.0-MILESTONE-AUDIT.md` — most recent milestone audit; use as **format + location**
  precedent for `v18.0-MILESTONE-AUDIT.md`.
- `.planning/v16.0-MILESTONE-AUDIT.md` — additional audit-format precedent.

### Surfacing target
- `src/lib/coverage.js` — the **real** `COVERAGE_STATES` / `COVERAGE_COUNTIES` /
  `COVERAGE_BROWSE_STATES` definition (Landing.jsx imports `COVERAGE_STATES` from here). Nevada
  block at ~line 184; Clark County at ~line 240; statewide auto-built from `STATE_NAME_TO_ABBREV`
  (~line 196). All NV entries already present — verify + reconcile `hasContext` per D-01.
- `src/pages/Landing.jsx` — consumer only; renders `COVERAGE_STATES.map(...)`. No edits expected
  unless render wiring changes.

### Learnings target
- `LOCATION-ONBOARDING.md` (repo root, ~104KB) — "Cities Onboarded" table (~line 25) + GOTCHA
  entries; add the Nevada Quick Reference block (D-07). This is the playbook to update.

### Milestone close targets
- `.planning/MILESTONES.md` — add v18.0 "Shipped" entry (follow existing entry shape)
- `.planning/STATE.md` / `.planning/PROJECT.md` — milestone status flip targets

### Per-phase source artifacts (for audit counts + onboarding rows)
- `.planning/phases/158-*` through `.planning/phases/168-*` CONTEXT/STATE summaries — per-jurisdiction
  geo_ids, rosters, ext_id ranges, headshot/stance counts, gotchas.
- Auto-memory (recalled): `project_phase159_complete` … `project_phase166_complete`,
  `project_phase161_complete`, `project_phase164_complete`, `project_phase165_complete`,
  `project_nv_preexisting_seed`, `project_v180_milestone` — NV per-phase outcomes + ext_id/geo_id facts.
- `feedback_section_split_check` (auto-memory) — split-section detection SQL to run per jurisdiction.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/coverage.js` Nevada block: established entry pattern
  `{ label, browseGovernmentList: ['<geo_id>'], browseStateAbbrev: 'NV', hasContext: <bool> }`;
  CCSD uses `{ browseGeoId, browseMtfcc: 'G5420' }`. All 6 NV jurisdictions already present →
  surfacing is verify + the D-01 chip reconciliation, not insertion.
- `LOCATION-ONBOARDING.md` "Cities Onboarded" table: established 5-column row format with rich
  "Notable patterns" cells (mirror the v15.0/v17.0 LA-area rows).

### Established Patterns
- `hasContext: true` = purple chip = ≥1 compass stance seeded (coverage.js header comment, line 5).
  Honored verbatim by D-01.
- Milestone close = standalone `.planning/vX.0-MILESTONE-AUDIT.md` + MILESTONES.md "Shipped" entry +
  STATE/PROJECT status flip.
- DB is production: `mcp__supabase-local` reads are live; audit queries are read-only verification.
  `gsd-executor` has no supabase MCP → DB-verify runs inline in main context (or `psql -f`).

### Integration Points
- Landing.jsx browse wiring routes through the by-government-list browse endpoint using geo_ids
  (same mechanism every covered city uses); statewide via `browse_state_officials`.
</code_context>

<specifics>
## Specific Ideas

- Audit verdicts must distinguish a genuine structural defect (blocker) from an acceptable
  documented gap (deferred legislature stances, CCSD no-stance, headshot 403 walls) — phrase so a
  reader can tell "incomplete on purpose" from "broken."
- Purple chip applied from real DB stance counts, not from "we ran a stance phase" assumption —
  CCSD completed with 0 stances by design and therefore goes plain.
- The Nevada Quick Reference is the highest-leverage artifact for the next NV wave / new state —
  consolidate the scattered ext_id / MTFCC / WAF / casing facts in one block.
</specifics>

<deferred>
## Deferred Ideas

- **NV legislature compass stances** — evidence-only stances for all 63 legislators; deferred to a
  dedicated follow-up milestone. Recorded in the v18.0 audit known-issues (D-08.1). No data changes here.
- **Mesquite** (Clark County's smallest incorporated city) — future Clark County wave (D-08.2).
- **Browse-government-list state-leak bug** — deferred fix; recorded in audit known-issues (D-08.3).
- **v19.0 frontend detour (phases 169–172)** — dark-mode / banners / elections-parity work is its
  own (parked) milestone, out of scope here; only the renumber note is recorded (D-08.4). v19.0 has
  no `.planning/milestones/v19.0-*` artifacts yet — formalizing/closing v19.0 is a separate effort.

</deferred>

---

*Phase: 173-nevada-playbook-retrospective-close*
*Context gathered: 2026-06-30*
