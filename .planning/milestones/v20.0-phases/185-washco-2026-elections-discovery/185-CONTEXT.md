# Phase 185: WashCo 2026 Elections & Discovery - Context

**Gathered:** 2026-07-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Seed **2026 local race rows** for the west-metro Portland jurisdictions and **arm the candidate-discovery
pipeline** so a Washington County user on `/elections` sees their 2026 local ballot. This is a
**brownfield local-layer** extension — the OR 2026 election rows already exist; this phase adds the
missing local race rows + discovery arming + a bounded slice of real candidates.

**In scope:**
- `essentials.races` — 2026 **General** race rows for the west-metro **county + city** offices that are
  **actually up in Nov 2026** (staggered terms — seat set is a research item), linked to existing
  `office_id`s seeded in Phases 175–184. Covers Washington County Commission + all 7 cities
  (Beaverton, Hillsboro, Tigard, Tualatin, Forest Grove, Sherwood, Cornelius).
- **Candidate ingestion (west-metro only):** seed `race_candidates` rows (candidate name + linkage) for
  the west-metro local races, **plus 600×750 headshots where an official/campaign photo exists**.
  **No compass stances** this phase (deferred).
- `essentials.discovery_jurisdictions` — arm **8 rows** (Washington County + 7 cities), `source_url` =
  Washington County Elections Division candidate-filing page, plus **one real test discovery run that
  completes** (ROADMAP criterion #3).
- **School boards:** confirm no regular 2026 seats (OR special-district elections = May of odd years);
  seed race rows **only** for any 2026 vacancy/special election that a check turns up.

**Out of scope (belongs elsewhere):**
- Creating any `essentials.elections` row — **both OR 2026 rows already exist** (General
  `de10e3a7-f5c2-47e6-acd7-ee87be9413db` Nov 3; Primary `cf4a24d6-f01b-4a8c-a5e5-4a1117b21905` May 19,
  already past). Races FK to the **General**.
- The statewide **121 empty legislative/down-ballot race shells** (full candidate-gap) → deferred, its
  own future phase (see Deferred).
- **Compass stances** for 2026 candidates → later follow-up.
- Surfacing/coverage wiring on Landing → **Phase 186** (retrospective/close).
- The May 19 2026 primary (already past) — no primary races seeded.

</domain>

<decisions>
## Implementation Decisions

### Candidate ingestion scope
- **D-01:** **Arm + ingest west-metro** (chosen over 167-parity arm-only and over the broaden-statewide
  option). Seed race rows + arm discovery + one test run **AND** manually ingest the known post-primary
  candidates for the west-metro local races actually on the Nov 2026 ballot. Rationale: the
  `project_or_2026_candidate_gap` memory explicitly tagged THIS phase to populate the elections tab; the
  frontend already hides 0-candidate races (`100eda9`), so empty shells would otherwise render nothing.
- **D-02:** **Candidate depth = names + headshots, NO stances.** Seed candidate rows + `race_candidates`
  linkage (party-blind — antipartisan) so the ballot shows who's running; add **600×750 (4:5 Lanczos q90)
  headshots** for candidates where an official/campaign photo exists. Compass stances are **explicitly
  deferred** to a later follow-up (heavy for a full challenger slate; rate-limit rule = one research
  agent at a time makes it a separate effort).

### Seat set (which offices get race rows)
- **D-03:** **Only seats actually up in Nov 2026.** OR council/commission terms are staggered — do NOT
  seed a shell for every office. Researcher must pull each jurisdiction's 2026 term-expiration / seats-up
  list from Washington County Elections / official sources before Plan 02. Do NOT guess which seats.
  All 8 west-metro govs currently have **0 races for 2026** (verified live 2026-07-04); offices exist
  (5–7 each) as FK targets.

### School boards
- **D-04:** **Confirm none regular + catch specials.** OR school-board (special-district) elections run
  at the **May election in odd-numbered years** (2025/2027) per ORS 255, so the 5 west-metro boards
  almost certainly have **no regular 2026 seats**. Researcher confirms against Washington County; seed
  **0** regular school-board races. Additionally check for any 2026 board **vacancy/special election** on
  the Nov ballot and seed **only those** if they exist. This is the ROADMAP "5 school boards as
  applicable" resolution.

### Discovery arming
- **D-05:** **County + 7 cities = 8 discovery_jurisdictions rows** (mirrors the existing
  Portland-city + Multnomah-county pattern). School-board rows are NOT armed (D-04; no off-cycle empty
  runs). Existing OR discovery rows today: State of Oregon (`41`), City of Portland (`4159000`),
  Multnomah County (`41051`) — none cover WashCo.
- **D-06:** **`source_url` = Washington County Elections Division** candidate-filing page for all 8 rows
  (the county administers local OR elections — most authoritative for county + city races). Researcher
  confirms the exact URL is reachable/parseable; if it proves hard to parse, fall back to
  `sos.oregon.gov` Candidate-Filings-Local-Measures as `source_url` with the county page + `ballotpedia.org`
  in `allowed_domains` (NV D-04 resilience pattern).
- **D-07:** **One real test discovery run must complete** (ROADMAP criterion #3 / 167 D-03). Acceptance
  bar = run **completes without error**; candidate count may be small/zero. Planner must confirm HOW the
  discovery runner is invoked in this environment (script vs endpoint vs cron trigger) before relying on it.

### Carried forward from Phase 167 (NV) — settled, do NOT re-derive
- **D-08:** **No `essentials.elections` row created** — both OR 2026 rows exist (see domain). Races
  resolve their election FK via subquery on `name='OR 2026 General' AND state ILIKE 'or'`.
- **D-09:** **No `cron_active` column.** `discovery_jurisdictions` eligibility is **date-based** (180-day
  cron horizon before `election_date`); the ROADMAP "cron_active=true" wording = a row whose
  `election_date` (2026-11-03) is inside the horizon. Columns confirmed identically in NV/MD/VA:
  `jurisdiction_geoid, jurisdiction_name, state, election_date, source_url, allowed_domains`.
- **D-10:** **Race rows anchor on the office, not the incumbent.** Open/termed-out seats still get a row
  keyed to `office_id`. Idempotency via **`NOT EXISTS`** guards on `(election_id, office_id)` — there is
  **no DB unique constraint**, so do NOT use `ON CONFLICT`. `primary_party` stays **NULL** (antipartisan);
  `seats` per race defaults to the office's seat count.
- **D-11:** **office_id resolution via chamber→government geo_id, NOT `representing_city`.** The west-metro
  offices have `representing_city = NULL` (Gresham-template gap noted in ROADMAP), so resolve the office
  set by joining `governments.geo_id → chambers.government_id → offices.chamber_id`. Watch the OR
  `districts.state` casing trap (`'or'` vs `'OR'`) on any district joins.
- **D-12:** **Migration mechanics:** files in `C:/EV-Accounts/backend/migrations/`; idempotent via
  `NOT EXISTS` guards + `BEGIN;/COMMIT;`; paired `_apply-migration-NNN.ts` smoke test. **Next migration
  counter = 1210** (on-disk max = 1209 as of 2026-07-04; MO workstream took 1206/1207 → shipped 1208/1209).
  **Verify the counter live at plan time** — parallel workstreams may have advanced it. tsx invoked from
  `C:/EV-Accounts/backend` via `node node_modules/tsx/dist/cli.mjs`. Recent 2026 election migrations do
  NOT write a `schema_migrations` ledger row — on-disk counter authoritative; confirm at plan time.

### Claude's Discretion
- Whether races + candidate ingestion land in one migration or split (e.g. races → race_candidates →
  discovery) — planner's call, kept idempotent either way. NV used a 3-plan shape (elections → races →
  discovery); here elections already exist, so likely (01) races, (02) candidates + headshots,
  (03) discovery + test run — planner decides.
- Exact `position_name` strings per race — mirror the per-jurisdiction chamber names already seeded in
  Phases 175–184 (verbatim official titles).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirement & roadmap
- `.planning/ROADMAP.md` §"Phase 185" — goal + 3 success criteria + `UI hint: yes`.
- `.planning/REQUIREMENTS.md` → **WM-ELEC-01** — the binding requirement.
- `.planning/ROADMAP.md` §"Milestone-wide conventions" — OR `districts.state` casing trap, brownfield
  local-layer scope, per-government build order.

### Direct precedent — mirror THIS shape (elections+races+discovery)
- `.planning/phases/167-nv-2026-elections-discovery/167-CONTEXT.md` — **the settled pattern** for this
  phase type (elections-exist handling, no-`cron_active`, `NOT EXISTS` idempotency, antipartisan NULL,
  test-run acceptance bar, office-via-geo_id linkage). **Read this FIRST.**
- `.planning/phases/167-nv-2026-elections-discovery/167-01/02/03-SUMMARY.md` — plan-by-plan execution
  shape (elections → races → discovery + test run).

### Migration prior-art (schema specifics)
- `C:/EV-Accounts/backend/migrations/1109_seed_tx_ny_2026_house_elections_races.sql` — most recent
  elections/races migration; authoritative for `races` columns, `jurisdiction_level`, `NOT EXISTS`
  guards, `BEGIN/COMMIT`, antipartisan NULL `primary_party`, "{ST} 2026 …" naming.
- `C:/EV-Accounts/backend/migrations/1110_*.sql` — candidate/`race_candidates` wiring pattern (how
  candidates attach AFTER races) — directly relevant since D-01 ingests candidates this phase.
- `C:/EV-Accounts/backend/migrations/325_va_2026_discovery.sql` + `281_md_2026_discovery.sql` —
  `discovery_jurisdictions` row reference impls (no `cron_active`, date-based horizon).

### Candidate-gap context (why this phase ingests candidates)
- Project memory `project_or_2026_candidate_gap` — the OR Nov-2026 general has 123 race shells, only 2
  with candidates; frontend now hides 0-candidate races (`100eda9`); this phase populates west-metro.

### West-metro offices already seeded (race FK targets — Phases 175–184)
- Project memories `project_phase175_complete` … `project_phase184_complete` — geo_ids: WashCo `41067`,
  Beaverton `4105350`, Hillsboro `4134100`, Tigard `4173650`, Tualatin `4174950`, Forest Grove `4126200`,
  Sherwood `4167100`, Cornelius `4115550`; 5 school boards (183/184). Headshot sizing/pipeline conventions.

### Headshot pipeline (for D-02 candidate headshots)
- `docs/banner-asset-pipeline.md` sibling headshot conventions + `/find-headshots` skill
  (`~/.claude/commands/find-headshots.md`). 600×750 4:5 Lanczos q90, `press_use`, `type='default'`.

### External (authoritative for race/candidate facts)
- **Washington County Elections Division** candidate-filing page — canonical discovery `source_url`
  (D-06); researcher to confirm exact URL.
- `https://sos.oregon.gov/elections/Pages/Candidate-Filings-Local-Measures.aspx` — SOS fallback source
  (already used by the State-of-Oregon discovery row).
- `https://ballotpedia.org/` — 2026 west-metro elections pages (secondary verification / seats-up + term
  expirations).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 167 NV migrations + `1109`/`1110`/`325`/`281`: near-verbatim templates for race rows,
  `race_candidates` wiring, and discovery rows.
- `_apply-migration-NNN.ts` smoke-test harness pattern (assertions + idempotency re-run).
- All west-metro `office_id`s already in DB (Phases 175–184) — races resolve against them; **no new
  offices created**.
- `/find-headshots` skill + headshot pipeline for D-02 candidate photos.

### Established Patterns
- Election FK via `WITH gen AS (SELECT id FROM essentials.elections WHERE name='OR 2026 General' AND state ILIKE 'or')`.
- Office set via `governments.geo_id → chambers.government_id → offices.chamber_id` (NOT `representing_city`, which is NULL — D-11).
- Idempotent migration + `DO $$ RAISE EXCEPTION` post-verify; on-disk counter authoritative (next = 1210, verify live).

### Integration Points
- `essentials.elections` (exists) ← `essentials.races.election_id` ← west-metro `essentials.offices.id`.
- `essentials.races` ← `essentials.race_candidates` (candidate ingestion, D-01/D-02).
- `essentials.discovery_jurisdictions` (date-based) → discovery runner → `discovery_runs` (test-run evidence, D-07).
- `/elections` page reads races by jurisdiction → user-facing acceptance (criterion #2); 0-candidate races hidden (`100eda9`).

</code_context>

<specifics>
## Specific Ideas

- **The exact seats-up set is the primary factual unknown** — OR county/city terms stagger. Researcher
  must pull authoritative 2026 term-expiration / filing lists per jurisdiction before Plan for races. Do
  NOT guess seat numbers.
- **School-board election cadence** (ORS 255 — May odd-year) should be confirmed against Washington
  County before asserting "0 regular 2026 board races" (D-04).
- Watch for the **vacant seat pattern** noted in prior phases (e.g. Cornelius TX-23 refill) when deciding
  whether an office up in 2026 already shows `is_vacant`.

</specifics>

<deferred>
## Deferred Ideas

- **Statewide candidate-gap fill** — the 121 empty OR legislative/down-ballot race shells (full
  `project_or_2026_candidate_gap` scope). Own future phase; explicitly out of Phase 185 (west-metro only).
- **Compass stances for 2026 candidates** — evidence-only, one research agent at a time; a later
  follow-up after names + headshots land.
- **Coverage / Landing surfacing** of west-metro election data → Phase 186 (retrospective/close).

</deferred>

---

*Phase: 185-washco-2026-elections-discovery*
*Context gathered: 2026-07-04*
