# Phase 192: Arizona Legislature (seed + headshots) - Context

**Gathered:** 2026-07-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Seed the **full 90-member Arizona Legislature** as profile-visible officials under the
existing **State of Arizona** government (geo_id `04`), each with a 600×750 headshot, and
each office linked to the correct Phase 190 legislative-district geofence:

- **30 state senators** — 1 per legislative district, on the **SLDU** (STATE_UPPER) geofence.
- **60 state house representatives** — 2 per legislative district, on the **SLDL**
  (STATE_LOWER) geofence (30 SLDL polygons, each shared by 2 reps).

Satisfies **AZ-LEG-01**. Mirrors the NV v18.0 Legislature seed (Phase 160) and reuses the
government/chamber/office pattern established by AZ Phase 191.

**In scope:** 2 net-new legislative chambers (Senate + House) under State of Arizona; 90
offices (30 + 60) linked to SLDU/SLDL districts; 90 politician rows for current sitting
members; 90/90 600×750 headshots; structural + audit-only migrations; verification audit.

**Out of scope (explicitly deferred by design — NOT gaps):**
- **Compass stances for all 90 legislators** — deferred milestone-wide (NV v18.0 pattern).
  Success criterion #4 requires **0 stances present** and confirmed-deferred, not blank spokes.
- Pima County + Tucson-metro local officials (Phases 193–198); 2026 election shells (Phase 199);
  the Arizona playbook/retrospective (Phase 200). No frontend change — officials become
  profile-visible automatically once office + politician + image rows exist (address routing
  already resolves via Phase 190 geofences).

</domain>

<decisions>
## Implementation Decisions

### House multi-member district modeling (headline AZ-specific call)
- **D-01:** Model the 60 house reps as **two undifferentiated `State Representative` offices
  per legislative district**, both linked to the **same SLDL district_id** (geo_id `040NN`,
  `district_type='STATE_LOWER'`). No Seat A/B, post number, or any artificial seat distinction —
  Arizona elects both reps at-large within the district on a top-two basis and voters never see
  a seat label. **The planner MUST verify** the `essentials.offices` table permits two rows on
  one `district_id` (check for any unique constraint on `district_id` / `chamber_id`); if a
  constraint forbids it, surface the exact constraint and the minimal disambiguator needed
  (e.g. `normalized_position_name`) rather than inventing voter-facing seat labels.

### Roster snapshot & vacancy
- **D-02:** Seed the **current sitting 56th Arizona Legislature** members as of the seed date
  (exact roster + district assignments confirmed at research/plan time from azleg.gov). A
  **genuine vacancy** is seeded as a **vacant office (no politician attached)** — never backfill
  a departed member. 191 D-04 precedent. No 2026-incoming / future-session members.

### Headshots & gap policy
- **D-03:** Target **90/90 headshots at 600×750** (4:5, Lanczos q90, crop-first, no distortion).
  Primary source **azleg.gov member pages** (format confirmed by researcher); fallback order at
  planner discretion (official portrait → Wikimedia Commons w/ **descriptive User-Agent** →
  Ballotpedia). If a member truly has **no sourceable photo**, **pause at a checkpoint** for an
  **operator-supplied file** (191 Presmyk precedent, `photo_license='operator_supplied'`) rather
  than ship a blank profile or accept a documented gap.

### Chamber & title naming
- **D-04:** Two chambers under State of Arizona, using the **short-`name` + full-`name_formal`**
  convention already used by AZ 191's executive chambers:
  - Senate → `name='State Senate'`, `name_formal='Arizona State Senate'`; title **`State Senator`**.
  - House → `name='House of Representatives'`, `name_formal='Arizona House of Representatives'`;
    title **`State Representative`**.
  (Planner may reconcile against the exact string style of the 7 existing AZ chambers if it finds
  a closer in-DB precedent, but must not invent a third convention.)

### Locked by precedent (NOT re-decided — inherited from NV 160 + AZ 190/191)
- **District keying GOTCHA:** legislative districts use **lowercase `az`** (TIGER). SLDU and SLDL
  **share the same geo_id space** — both are `04001..04030` (AZ senate/house districts are
  coterminous). Therefore **`district_type` is MANDATORY** in every office↔district WHERE; with it,
  the key `d.geo_id='040NN' AND d.district_type='STATE_UPPER'|'STATE_LOWER'` is unambiguous.
  Confirmed live: 30 STATE_UPPER + 30 STATE_LOWER rows, both min `04001` / max `04030`.
- **Reconcile check done:** the Legislature is **greenfield** — 0 legislative chambers/offices/
  politicians currently seeded (191 seeded only the 7 executive chambers). Still DB-pre-check with
  ON CONFLICT / NOT EXISTS guards before INSERT (defensive; matches 191).
- **districts has NO `name_formal` column** (NV 160 schema correction) — use `label` if referencing
  district names.
- **Party never displays** (antipartisan) — legislators are partisan but party is not surfaced.
- **Migrations:** structural migs REGISTER in `supabase_migrations.schema_migrations`; headshot migs
  are **AUDIT-ONLY** (unregistered, no footer, applied via `psql -f`). Migration file numbering is
  **DISK-authoritative** (check on-disk MAX, not the ledger); **never `max(version::int)`** — it
  THROWS on mixed-format version strings; use `count(*) WHERE version='NNNN'`.
- **Cross-repo:** all backend/migration/script work lives in **`C:/EV-Accounts`** (default branch
  `master`, push deploys to Render); commit via `git -C "C:/EV-Accounts"`. `mcp__supabase-local`
  **IS production**. `_tmp-*`/`_*` headshot scripts are gitignored by convention — only SQL migrations commit.
- **Executor/orchestrator split:** `gsd-executor` has **NO Supabase MCP** — it only WRITES `.sql`/`.py`
  files. The inline orchestrator (execute-phase) runs all DB probes, applies migrations (psql -f via
  `DATABASE_URL` in `C:/EV-Accounts/backend/.env`, or supabase MCP), runs headshot scripts, and audits.

### Claude's Discretion
- **ext_id numbering** — pick a **clean, collision-safe AZ legislative block** at plan time. Follow the
  NV sibling convention (`-3203xxx` Senate / `-3204xxx` Assembly). ⚠ AZ's old `-400091..094` range and
  the `-4004xxx`/`-4001..-4009` ranges from 191 are taken, **and** the shared national candidate pool is
  occupied past `-400503` — choose a range that collides with neither (191 gotcha).
- Plan/wave split (NV 160 used 3 plans: legislature seed → headshots → verification; the 2-chamber /
  90-member volume may warrant splitting Senate vs House headshots into separate waves).
- Exact headshot fallback source per member when multiple exist (document `photo_license` per image).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase planning
- `.planning/ROADMAP.md` §"Phase 192: Arizona Legislature (seed + headshots)" — goal, depends-on
  (Phase 190), success criteria 1–4 (30 senators on SLDU, 60 reps on SLDL, 90/90 headshots, 0 stances).
- `.planning/REQUIREMENTS.md` §"AZ-LEG-01" — the requirement this phase satisfies (stances deferred).

### Closest analog — mirror nearly 1:1 (NV Legislature, archived milestone)
- `.planning/milestones/v18.0-phases/160-nevada-state-legislature/160-01-PLAN.md` +
  `160-01-SUMMARY.md` — legislature seed pattern (2 chambers under a State government; offices linked
  to SLDU/SLDL via `district_type`; ext_id ranges; titles). **KEY GOTCHA source** for lowercase-state +
  district_type keying and the `districts` no-`name_formal` correction.
- `.../160-02-*` — headshot pipeline (crop-4:5 → 600×750 Lanczos q90 → Storage upsert; `us_government_work`
  license). *(NV sourced from `archive.leg.state.nv.us`; AZ source differs — see D-03.)*
- `.../160-03-SUMMARY.md` (or the verification doc) — verification SQL audit shape (resident sees their
  senator + 2 representatives, each with a headshot; 0 stances confirmed).
  *(If the archived path differs, locate via `find .planning/milestones -ipath '*160-nevada*'`.)*

### This milestone's precedent (Arizona)
- `.planning/phases/191-arizona-state-federal-government/191-CONTEXT.md` — AZ chamber/office conventions,
  the `State of Arizona` government row (geo_id `04`), migration/ext_id/cross-repo gotchas, the executor
  split, and the operator-supplied-headshot checkpoint precedent (Presmyk).
- `.planning/phases/191-arizona-state-federal-government/191-0{1,2,3}-SUMMARY.md` — as-built AZ officials
  seed + headshot pipeline (copy-adapt structural + audit migration shapes).
- `.planning/phases/190-arizona-tiger-geofences/190-02-SUMMARY.md` — final AZ geofence/district inventory
  the legislative linkage depends on (SLDU 30 / SLDL 30, lowercase `az`, geo_id `04001..04030`).

### Reusable code (backend repo `C:\EV-Accounts`)
- `backend/migrations/` — structural (registered) vs audit-only (headshots) migration convention; the AZ
  191 migrations (`128x` range) are the freshest shape templates.
- `backend/scripts/_tmp-*-headshot.py` — gitignored inline headshot-processing helper pattern (crop→resize→upload).

### Playbook (add AZ block in Phase 200, not here)
- `LOCATION-ONBOARDING.md` — per-state officials/headshot GOTCHAs.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **AZ 191 migrations** (structural + audit pair) — copy-adapt for the 2 legislative chambers + 90 offices/
  politicians and the 90 headshot rows.
- **NV 160 legislature seed** — the direct structural analog for "2 chambers + members linked to SLDU/SLDL
  via `district_type`"; AZ differs only in the 2-reps-per-SLDL-district fan-out (D-01) and headshot source (D-03).
- **Headshot pipeline** (`_tmp-*-headshot.py`) — crop-4:5 → 600×750 Lanczos q90 → Storage upsert; reuse verbatim.

### Established Patterns
- `essentials.governments` (id, name, type, geo_id) → `chambers` (id, external_id, government_id, name,
  name_formal) → `offices` (id, politician_id, chamber_id, district_id, normalized_position_name,
  partisan_type) → `politicians` → `politician_images`. Government row for AZ already exists (geo_id `04`).
- Officials become profile-visible automatically once office + politician + image rows exist — no frontend change.
- Migration counter is DB-ledger authoritative BUT file numbering is disk-authoritative; structural migs
  registered, headshot migs audit-only.

### Integration Points
- Legislative offices consume the **SLDU (30) + SLDL (30) district rows** loaded in Phase 190 (lowercase `az`).
- Both chambers hang off the **existing** `State of Arizona` government (geo_id `04`) — do NOT create a new government.
- Downstream: Phase 199 (2026 elections) reuses these legislative offices for race shells; a future milestone
  runs the deferred compass-stance pass over these 90 members.

### Non-obvious project state
- `gsd-executor` has no Supabase MCP — DB pre-checks (existing rows, migration MAX, section-split, stance=0
  audit) run inline within the phase, not via subagent.
- SLDU and SLDL share the geo_id space (`04001..04030`) — an office↔district join WITHOUT `district_type`
  will double-match and silently mislink senators to house districts and vice versa.

</code_context>

<specifics>
## Specific Ideas

- The two house reps in a district read as **two equal `State Representative` offices**, not "Seat 1 / Seat 2" —
  match how Arizona actually elects (top-two, at-large within the LD).
- A resident in LD-N should see **1 senator + 2 representatives, all labeled District N** (AZ senate and house
  districts are coterminous) — this is correct and expected, not a bug.
- Pursue a complete **90/90** headshot set; treat a truly unsourceable member as an operator checkpoint
  (supply a file), never a blank profile.
- **0 compass stances** is a required, verified end-state for this phase — the verification audit must assert
  it and label it *deferred by design*, matching the NV v18.0 pattern.

</specifics>

<deferred>
## Deferred Ideas

- **Compass stances for all 90 AZ legislators** — deferred milestone-wide (NV v18.0 pattern); a future
  stance-research pass, evidence-only, one agent at a time.
- **Legislative committee/leadership structure** (Speaker, President, committee chairs) — not modeled;
  members seeded as plain chamber offices only.
- **2026 legislative election race shells** — Phase 199.

### Reviewed Todos (not folded)
None — no pending todos matched this phase.

</deferred>

---

*Phase: 192-arizona-legislature-seed-headshots*
*Context gathered: 2026-07-08*
