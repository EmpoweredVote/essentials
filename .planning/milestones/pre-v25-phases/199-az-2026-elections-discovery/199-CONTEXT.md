# Phase 199: AZ 2026 Elections & Discovery - Context

**Gathered:** 2026-07-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Any AZ resident can see their 2026 ballot for statewide, federal, legislative, and Tucson-metro
local races, with the discovery cron armed to keep candidate rosters current.

**Delivers (AZ-ELEC-01):**
1. 2026 race shells for statewide offices, the 9 US House seats (already done), the 90 legislative
   seats, and cycle-confirmed Tucson-metro local races (Pima County + covered cities).
2. Confirmed candidate slate populated for the high-salience tier (statewide + federal); the 90
   legislative + local races ship as shells for the discovery cron to fill.
3. `discovery_jurisdictions` rows armed for AZ (date-window eligibility, not a flag).

**DB starting state (verified 2026-07-17):**
- `essentials.elections`: 1 AZ row — "AZ 2026 Statewide General" (2026-11-03), id
  `e21f5757-071e-4851-9c06-83520d96460e`. No primary row.
- `essentials.races` under that election: 9 US House shells (District 1–9), primary_party NULL.
- `essentials.race_candidates`: 39 candidates already attached to the 9 US House races.
- AZ office universe (existing, by chamber): Governor 1, Secretary of State 1, Attorney General 1,
  Treasurer 1, Superintendent of Public Instruction 1, State Mine Inspector 1, Corporation
  Commission 5, State Senate 30, House of Representatives 60, U.S. House 9, U.S. Senate 2 (NOT up
  in 2026), Board of Supervisors 5 (Pima), Town Council 21 (Oro Valley/Marana/Sahuarita), City
  Council 14 (Tucson wards/South Tucson).

</domain>

<decisions>
## Implementation Decisions

### Candidate-population strategy
- **D-01:** Hand-seed confirmed candidates only for the high-salience, low-volume tier — **statewide**
  (Governor, SoS, AG, Treasurer, Superintendent, Mine Inspector, Corporation Commission) **+ federal**
  (verify/complete the existing 9 US House races, already carrying 39 candidates). AZ candidate filing
  for state/federal closed ~April 6, 2026, so confirmed slates are public via the AZ SoS.
- **D-02:** Leave the **90 legislative seats + all Tucson-metro local races as shells** for the armed
  discovery cron to populate. Do NOT hand-seed their candidates in this phase.

### Local race-shell scope
- **D-03:** Seed local shells **only where the 2026 cycle is confirmed** by research. Known cycle facts
  to verify: Pima Board of Supervisors is up in 2026 (gubernatorial cycle); Oro Valley / Marana /
  Sahuarita run **even-year** elections (Aug primary / Nov general 2026); **Tucson city council runs
  odd-year** elections (2025/2027) → likely NO 2026 city race — confirm and skip if so; South Tucson
  cycle to be verified.
- **D-04:** Seed shells **only against offices that already exist** in the DB. Do NOT create new office
  rows this phase. Pima's other county constitutional offices (Sheriff, Recorder, Assessor, County
  Attorney, Clerk of Superior Court, County Treasurer/Superintendent) and Superior Court judicial
  retention are NOT seeded as offices → deferred (see Deferred Ideas).

### Primary election row
- **D-05:** Seed the **AZ 2026 Statewide Primary (2026-08-04)** election row in addition to the existing
  general (2026-11-03), mirroring the VA/MD elections phases, so primary races/candidates can anchor
  and the discovery date-window covers both dates.

### Discovery rows + allowlist
- **D-06:** Arm **statewide (FIPS `04`) + Pima County** jurisdictions, **one row per election date** →
  4 `discovery_jurisdictions` rows total ({AZ 04, Pima} × {2026-08-04, 2026-11-03}).
- **D-07:** Allowlist per row (curated AZ election-authority set): `azsos.gov`, `azcleanelections.gov`,
  `pima.gov` / `recorder.pima.gov`, `ballotpedia.org`. (Researcher confirms exact `source_url` per
  jurisdiction/date and the canonical Pima elections domain.)
- **D-08:** **No `cron_active` column exists** — the requirement wording ("cron_active=true") is loose.
  The cron arms any row whose `election_date` is within the 180-day window (confirmed in
  `241_or_discovery_jurisdictions.sql` and the VA/MD Phase 96 D-03 lesson). Do NOT add a
  `cron_active` column or reference it in migrations.

### Claude's Discretion
- Migration numbering + which repo the migrations live in (in-repo `supabase/migrations/` vs
  cross-repo `C:/EV-Accounts/backend/migrations/`) — resolve during research; migration number is
  disk-authoritative (Ph191 lesson). AZ deep-seeds 194–198 used the cross-repo executor-authors /
  orchestrator-applies split.
- Exact `ext_id` / seat-anchoring scheme for new statewide + legislative + local race shells.
- Whether the covered AZ cities already appear in `src/pages/Landing.jsx` COVERAGE_CITIES (UI hint
  = yes); add only if missing — cities were deep-seeded in 194–198 and are likely present.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope + requirements
- `.planning/ROADMAP.md` §"Phase 199: AZ 2026 Elections & Discovery" — goal + 3 success criteria.
- `.planning/REQUIREMENTS.md` — AZ-ELEC-01 (lines ~57–59).

### Elections + race-shell + discovery pattern (directly analogous prior phase)
- `.planning/phases/105-va-2026-elections-discovery/105-01-PLAN.md` — elections-row seed pattern
  (elections rows are the FK target; races resolve `election_id` via name subquery).
- `.planning/phases/105-va-2026-elections-discovery/105-02-PLAN.md` — race-shell seed pattern
  (one race row per seat, zero NULL office_ids, resolve election_id by name subquery).
- `.planning/phases/105-va-2026-elections-discovery/105-03-PLAN.md` — discovery_jurisdictions arm
  pattern (rows per election date, allowlist, ledger entry, apply-script smoke tests) + Landing.jsx.

### Discovery migration exemplars (in-repo)
- `supabase/migrations/241_or_discovery_jurisdictions.sql` — canonical shape: `(id,
  jurisdiction_geoid, jurisdiction_name, state, election_date, source_url, allowed_domains)`,
  `WHERE NOT EXISTS` idempotency, NO `cron_active` column, date-window arming comment.
- `supabase/migrations/223_ca_discovery_jurisdictions.sql` — second exemplar.

No new external specs/ADRs introduced by this discussion.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `essentials.races` schema: `(id, election_id, office_id, position_name, primary_party, seats,
  description, created_at, updated_at)`. Shells = one row per up-in-2026 office linked to the AZ
  election, `office_id` non-NULL.
- `essentials.race_candidates` — where confirmed candidates attach (race_id → races.id).
- `essentials.discovery_jurisdictions` — columns: `id, jurisdiction_geoid, jurisdiction_name,
  state, election_date, source_url, allowed_domains`. No `cron_active`.
- `essentials.offices` (positions/seats) join `essentials.chambers` for level grouping; filter by
  `offices.representing_state IN ('AZ','Arizona')`.

### Established Patterns
- Elections/discovery migrations follow the OR/VA/MD exemplars: idempotent INSERTs, post-verify
  `DO $$` count-check with `RAISE EXCEPTION`, mandatory `schema_migrations` ledger entry, and a
  companion apply-script with smoke tests.
- Cross-repo migration split (AZ 191–198): executor authors SQL, orchestrator applies via psql.

### Integration Points
- Discovery cron reads `discovery_jurisdictions` rows within the 180-day `election_date` window —
  arming is date-driven, no flag.
- `src/pages/Landing.jsx` COVERAGE_CITIES surfaces covered jurisdictions (verify AZ cities present).

</code_context>

<specifics>
## Specific Ideas

- US Senate is deliberately excluded — neither AZ seat is up in 2026 (Kelly 2028, Gallego 2030).
- Corporation Commission has 5 seats but only a subset is up per cycle — researcher confirms how
  many of the 5 are on the 2026 ballot before seeding shells for all 5.

</specifics>

<deferred>
## Deferred Ideas

- **Pima County constitutional offices** (Sheriff, Recorder, Assessor, County Attorney, Clerk of
  Superior Court, County Treasurer, County Superintendent) — not seeded as offices; would require
  new office rows + geofences. Future phase.
- **Superior Court judicial retention races** (Pima) — future judicial-compass-aligned phase.
- **School board 2026 races** — deferred per standing project rule (no school-board work until a
  school-board badge exists).
- **Hand-seeding legislative + local candidates** — intentionally left to the discovery cron (D-02);
  a later reconcile phase can backfill any the cron misses.

</deferred>

<post_research_updates>
## Post-Research Decision Updates (2026-07-17, after 199-RESEARCH.md)

Research (HIGH confidence; SQL-verified DB facts + multi-source cycle facts) corrected several
locked decisions. User confirmed "use corrected facts" + "shells now + post-07-21 reconcile".
**These OVERRIDE the conflicting items above.**

- **D-05 CORRECTED:** AZ 2026 primary is **2026-07-21** (HB 2022, signed 2026-02-06), NOT
  2026-08-04. Seed the primary election row + both primary discovery rows with `2026-07-21`.
- **D-03 CORRECTED (Pima BoS):** Pima County Board of Supervisors is **NOT on the 2026 ballot**
  (AZ county supervisors run in presidential years; all 5 elected Nov 2024 → next 2028).
  **Seed ZERO Pima BoS race shells.**
- **D-03 CONFIRMED (South Tucson):** South Tucson **does** have 2026 races (3 council seats) →
  seed those shells. Tucson city council remains odd-year → **zero** Tucson city shells.
- **Corporation Commission:** only **2 of 5** seats up in 2026 (at-large 2-winner) → seed the
  confirmed on-ballot seats only, not all 5 (see RESEARCH.md seed manifest for exact anchoring).
- **AZ House multi-member:** the `(election_id, position_name) WHERE primary_party IS NULL`
  partial-unique index forbids 60 identically-shaped House shells → model House as **30 races
  with `seats=2`** (first `seats=2` races for AZ; planner must confirm frontend/cron tolerate it).
- **D-01 REVISED — candidates:** Ship this phase as **pure structure** — elections rows + all
  race shells + discovery arming, with **NO hand-seeded candidates** (statewide/Corp-Commission
  included). Rationale: primary is 4 days out, so filed slates are contested primary fields that
  go stale immediately. A **post-07-21 reconcile phase** (already owed for Ph197/198) seeds
  general-election nominees once resolved. The existing 39 US House candidates stay as-is.
- **Migration location/number:** cross-repo `C:/EV-Accounts/backend/migrations/`, next number
  **1372** (disk-authoritative — re-confirm at execute time). No `src/pages/Landing.jsx` /
  coverage.js edit needed (AZ cities already surfaced per research).

</post_research_updates>

---

*Phase: 199-az-2026-elections-discovery*
*Context gathered: 2026-07-17 · Updated post-research: 2026-07-17*
