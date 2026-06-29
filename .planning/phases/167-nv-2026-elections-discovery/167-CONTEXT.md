# Phase 167: NV 2026 Elections & Discovery - Context

**Gathered:** 2026-06-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Seed Nevada's 2026 election and race rows so a NV user on `/elections` sees their 2026 ballot,
and arm the candidate-discovery pipeline against an official NV source.

**In scope:**
- `essentials.elections` — the 2026 NV **General Election** row (Nov 3, 2026).
- `essentials.races` — race rows linked to existing incumbent `office_id`s (seeded Phases 159–160):
  - All **6 statewide constitutional executives** up in 2026 (Governor, Lt. Governor, Attorney
    General, Secretary of State, Treasurer, Controller).
  - All **42 Assembly** districts.
  - The **~10–11 State Senate** districts up in 2026 (staggered; exact set is a research item).
  - **4 US House** races (NV-01 … NV-04).
- `essentials.discovery_jurisdictions` — NV row(s) armed for the Nov 3 general, plus **one real
  test discovery run that completes** against the NV source.

**Out of scope (belongs elsewhere):**
- Surfacing NV jurisdictions on Landing/`coverage.js` → **Phase 168** (retrospective/close).
- Seeding individual candidates/challengers → that is discovery's downstream job, not this phase.
- US Senate races (NV's two Senators are NOT up in 2026 — Cortez Masto 2028, Rosen 2030).
- The June 9, 2026 **primary** (already past — see D-02).

</domain>

<decisions>
## Implementation Decisions

### Statewide office scope
- **D-01:** Seed a 2026 race row for **all 6 statewide constitutional executives** actually on the
  NV ballot (Governor, Lt. Governor, AG, Secretary of State, Treasurer, Controller), not just
  Governor. "Governor" in ROADMAP criterion #1 reads as shorthand for the statewide slate. All six
  offices already exist (Phase 159: 5 execs + Gov; Controller Andy Matthews ext_id -3200006).

### Primary handling
- **D-02:** **General Election only.** Seed just the `2026 Nevada General Election` row (Nov 3, 2026)
  and general races. The June 9, 2026 primary is already past (today is 2026-06-29); both the
  /elections ballot view and the 180-day discovery horizon target the upcoming general. Do NOT seed
  a primary election row (departs from VA/MD verbatim parity, which seeded both — intentional, the
  primary is dead).

### Discovery test run
- **D-03:** After seeding the `discovery_jurisdictions` row, **execute one real discovery run** and
  capture that it completed (e.g. a `discovery_runs` row with success status / no error). This
  literally satisfies ROADMAP criterion #3 ("a test discovery run completes against an official NV
  source"), going beyond what VA/MD summaries demonstrated (they only seeded the row).
  - **Acceptance bar:** the run **completes without error**. Candidate count may be small or zero —
    finding/seeding new candidates is discovery's ongoing downstream job, not this phase's gate.
  - **Open for research/planning:** how the discovery runner is invoked in this environment (script
    vs endpoint vs cron trigger) — the planner must confirm the trigger mechanism before relying on it.

### Discovery source
- **D-04:** `source_url` = **NV Secretary of State (nvsos.gov)** official candidate-filing list as
  the canonical source; `allowed_domains` adds **ballotpedia.org** as the established secondary
  (matches VA/MD `allowed_domains` convention). Researcher should confirm the exact nvsos.gov URL /
  that the discovery parser handles it; if nvsos.gov proves unparseable, fall back to the Ballotpedia
  2026-NV-elections page as `source_url` (VA migration 325 precedent) with nvsos.gov in allowed_domains.

### Carried forward from VA/MD/ME pattern (settled — do not re-derive)
- **D-05:** **No `cron_active` column.** `essentials.discovery_jurisdictions` has no such column;
  eligibility is **date-based** (180-day cron window before `election_date`). ROADMAP wording
  "cron_active=true" = a row whose `election_date` (2026-11-03, ~127 days out) is inside the horizon.
  Confirmed identically in MD (281, D-03), VA (325), ME (183).
- **D-06:** **3-plan shape:** (01) elections row → (02) races rows → (03) discovery + test run.
  Races resolve their election FK via subquery on the general-election name + `state='NV'`.
- **D-07:** **Race rows anchor on the district/office, not the incumbent.** Open seats (incumbent
  termed out / not running) still get a row keyed to `office_id`. `ON CONFLICT (election_id,
  position_name) WHERE primary_party IS NULL DO NOTHING` idempotency (VA 324 convention).
- **D-08:** **Migration mechanics:** files in `C:/EV-Accounts/backend/migrations/`; each migration
  idempotent (`ON CONFLICT DO NOTHING`) + `DO $$` post-verify `RAISE EXCEPTION` block + ledger
  `INSERT INTO supabase_migrations.schema_migrations (version)`; paired `_apply-migration-NNN.ts`
  smoke-test script. **Next migration counter = 1109** (per project memory). tsx invoked from
  `C:/EV-Accounts/backend` via `node node_modules/tsx/dist/cli.mjs` (no PATH/.bin).

### Claude's Discretion
- Exact zero-padding/position_name strings for state-legislative races (follow MD `280` legislative
  pattern; e.g. `Nevada Assembly District 01` … `42`, `Nevada State Senate District NN`).
- Whether statewide + legislative + federal races land in one migration or split across the Plan-02
  migration set — planner's call, kept idempotent either way.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirement & roadmap
- `.planning/ROADMAP.md` §"Phase 167" — goal + 3 success criteria.
- `.planning/REQUIREMENTS.md` → **NV-ELEC-01** — the binding requirement.

### Direct prior-art pattern (the template to mirror)
- `.planning/phases/105-va-2026-elections-discovery/105-01-SUMMARY.md` — elections-row migration (322 pattern).
- `.planning/phases/105-va-2026-elections-discovery/105-02-SUMMARY.md` — federal race-row migration (324 pattern; office_id literals after live resolution).
- `.planning/phases/105-va-2026-elections-discovery/105-03-SUMMARY.md` — discovery_jurisdictions migration (325 pattern; D-03 no-cron_active).
- `C:/EV-Accounts/backend/migrations/325_va_2026_discovery.sql` — discovery row reference impl (no `cron_active`, date-based horizon comment).
- `C:/EV-Accounts/backend/migrations/280_md_2026_legislative_races.sql` — **state-legislative** race-row pattern (the part VA lacked; NV needs Assembly + Senate).
- `C:/EV-Accounts/backend/migrations/281_md_2026_discovery.sql` — discovery + ROADMAP "cron_active" reconciliation note (D-03 origin).
- `C:/EV-Accounts/backend/migrations/183_me_2026_elections_foundation.sql` — earliest date-based-horizon precedent.

### NV offices already seeded (race FK targets)
- Project memory `project_phase159_complete.md` — statewide execs + Gov + 4 US House ext_id schemes (-3200006 Controller, House -60003xx-style, etc.).
- Project memory `project_phase160_complete.md` — 63 legislators (Senate -3203001..-3203021 / Assembly -3204001..-3204042); SLDU/SLDL lowercase `state='nv'`, shared geo_id space.

### External (authoritative for race/candidate facts)
- NV Secretary of State — `nvsos.gov` (official candidate filing list; canonical discovery source — D-04).
- `https://ballotpedia.org/` — 2026 NV elections page (secondary source / Senate-seats-up verification).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- VA migrations 322/324/325 + MD 280/281: copy-near-verbatim templates for elections row, races
  rows (federal AND legislative), and discovery row respectively.
- `_apply-migration-NNN.ts` smoke-test harness pattern (4–5 assertions + ledger-present check + idempotency re-run).
- Incumbent `office_id`s for all NV statewide/legislative/House offices already in DB (Phases 159–160) — race rows resolve against them; no new offices created this phase.

### Established Patterns
- Election FK resolution via `WITH gen_elec AS (SELECT id FROM essentials.elections WHERE name=... AND state='NV')` subquery.
- Idempotent migration + `DO $$ RAISE EXCEPTION` post-verify + schema_migrations ledger INSERT.
- On-disk migration counter is authoritative (next = 1109); apply via `psql -f` or tsx from backend dir.

### Integration Points
- `essentials.elections` ← `essentials.races.election_id` ← incumbent `essentials.offices.id`.
- `essentials.discovery_jurisdictions` (date-based eligibility) → discovery runner → `discovery_runs` (test-run completion evidence for D-03).
- `/elections` page reads races by jurisdiction → user-facing acceptance (criterion #2).

</code_context>

<specifics>
## Specific Ideas

- **The exact set of State Senate districts up in 2026** is the one factual unknown — NV Senate has
  21 staggered 4-year seats (~10–11 up per cycle). Researcher must pull the authoritative list from
  nvsos.gov / Ballotpedia before Plan 02; do NOT guess the district numbers.
- Confirm all 6 statewide constitutional offices have a live incumbent `office_id` to link to
  (verify Controller / any office mis-seeded as inactive before writing race rows).

</specifics>

<deferred>
## Deferred Ideas

- Surfacing NV jurisdictions on `coverage.js` / Landing wiring → **Phase 168** (retrospective).
- Seeding actual 2026 candidate rows / headshots / stances → driven by discovery output over time,
  not this phase.
- Any 2026 primary archival rows → intentionally dropped (primary already occurred).

</deferred>

---

*Phase: 167-nv-2026-elections-discovery*
*Context gathered: 2026-06-29*
