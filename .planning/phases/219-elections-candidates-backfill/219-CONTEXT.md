# Phase 219: Elections & Candidates Backfill - Context

**Gathered:** 2026-07-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Every Collin County government with a real municipal election shows its races and
candidates on the ballot lookup (`/results`) — no zero-race governments, no thin coverage
where a seat had a known election. For each of the **12 zero-race governments** (live
re-verified 2026-07-23) seed the government's most-recent held election with its races and
candidates; for **thin cities** (races < offices) backfill any missing race from that same
election.

**Scope = all 23 resolving Collin County govs** (the 3 Ph217-reconciled zero-race cities —
Plano, Richardson, Van Alstyne — folded in per operator request).

**Data-only.** No new frontend surface; the elections view already renders races. Seed rows
via idempotent `WHERE NOT EXISTS`. Brownfield: governments/chambers/offices already exist
(offices seated/documented by Phase 218) — seed `elections` (reuse where shared) → `races`
(linked to existing `office_id`) → `race_candidates`. Split-section SQL check must run clean.

</domain>

<decisions>
## Implementation Decisions

### Reference election (which cycle to seed)
- **D-01:** Seed the **most-recent election each city actually HELD** — for the Collin cities
  that is the **certified May 2, 2026 uniform-date election** (results are public/certified
  now). If a city held nothing in May 2026 (off-cycle, or all seats canceled), fall back to
  its most-recent actual election, verified per city at execute time.
- **D-02:** Do NOT seed the next *upcoming* election (mostly May 2027) — candidate filing
  isn't open, so those would be zero-candidate shells the view hides. Rationale, verified in
  code: `src/pages/Results.jsx:1305` shows the nearest **upcoming** election and **falls back
  to the most-recent past** when none is upcoming — so seeded May 2, 2026 races display today
  and stay consistent with already-seeded neighbor cities (all on `2026-05-02`).

### Uncontested / canceled seats (Texas cancels an unopposed election)
- **D-03:** Where a seat's election was **uncontested/canceled** (TX declares the lone
  candidate elected without a ballot), **still seed the race** and seed that single
  declared-elected candidate — `candidate_status = 'won'` (or 'unopposed'),
  `is_incumbent` as verified. One candidate ≠ zero-candidate shell, so it renders. This makes
  "thin" coverage accurate rather than a defect: a city stays thin only where a seat genuinely
  had no election in the reference cycle (document that, don't fabricate a race).

### Candidate roster depth
- **D-04:** Seed the **full filed field per race — winners AND losers** — with
  `candidate_status` (won/lost) and `is_incumbent`. Matches existing neighbor data (e.g.
  Frisco = 11 candidates / 3 races, Parker = 7/2). Evidence-only: only candidates who actually
  appeared on the ballot / filed, cited; never guessed.

### Candidate headshots
- **D-05:** **Incumbents/winners already seated in Phase 218 reuse their existing politician
  photo** (link via `race_candidates.politician_id` → existing `politician_images`). For
  **non-incumbent candidates**, source 600×750 (4:5 crop-first, Lanczos, q90, eyes ~1/3 from
  top, head+shoulders, no text/graphics) where a real source exists; **honest-blank otherwise**
  — no fabrication. The 5 known zero-source cities (Blue Ridge, Farmersville, Lowry Crossing,
  Nevada, Saint Paul) stay blank where no source exists. See [[headshot_image_sizing]],
  [[headshot_cropping]], [[headshot_resize_no_distort]], [[headshot_no_graphics]],
  [[headshot_skill]].

### Locked milestone conventions (carried forward — not re-decided)
- **D-06:** Evidence-only, cited; no fabricated candidates/incumbents; TX municipal offices
  are **nonpartisan** (`party = NULL`, never displayed — [[antipartisan_display]]).
- **D-07:** **No compass stance research this milestone** (deferred pending local-compass-
  question lock). Do not seed stances as a side effect. See [[stance_research_all_topics]].
- **D-08:** Hide zero-candidate shells; run the split-section SQL check after seeding
  ([[section_split_check]], [[elections_view_display_rules]]).

### Claude's Discretion
- **Election-record linkage:** Prefer **reusing the existing shared `2026-05-02` TX election
  row** (neighbors already link to it) rather than minting per-city elections — confirm/select
  the right shared `elections.id` at plan/execute time. Per-city elections only if the shared
  row's scope doesn't fit.
- Per-city sourcing order and which thin cities to backfill first — planner/researcher choose.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` §"Phase 219: Elections & Candidates Backfill" — goal, re-verified
  12-zero-race list, success criteria (esp. #3 no split-section/no zero-candidate shells, #4
  resident sees their actual current/next race).
- `.planning/ROADMAP.md` §"Milestone-wide conventions" — data-only, evidence-only, split-
  section check, "elections view hides zero-candidate shells", headshot out-of-scope 5 cities.
- `.planning/REQUIREMENTS.md` — COLLIN-ELECT-01, COLLIN-ELECT-02, COLLIN-ELECT-03.

### Schema & seeding path (essentials schema, verified live 2026-07-23)
- Join path: `governments (has geo_id) → chambers → offices (office_id) → races → elections`;
  candidates in `race_candidates` (`race_id`, `politician_id`, `full_name`, `photo_url`,
  `is_incumbent`, `candidate_status`, `source`, `occupational_designation`, `website_url`).
  `races` = `election_id`, `office_id`, `position_name`, `primary_party`, `seats`. `elections`
  = `election_date`, `election_type`, `jurisdiction_level`, `state`. See [[schema_key_tables]].
- Idempotent `WHERE NOT EXISTS` seeding; on-disk migration-ledger counter authoritative.
  Migrations live in `C:\EV-Accounts` (accounts-api → Render); commit via `git -C`
  ([[backend_architecture]], [[no_git_in_ev_accounts]]). gsd-executor has NO Supabase MCP —
  DB-verify steps run inline per plan.
- Prior elections-seeding precedent: [[phase199_complete]] (AZ 2026, 82 races) and
  `.planning/phases/206-az-2026-candidate-reconcile/206-RESEARCH.md` (idempotent seeding
  recipe, migration 1296 pattern, incumbent-reuse UUID manifests, nonpartisan-municipal
  legitimately-empty caveat).

### Display / view behavior
- `src/pages/Results.jsx:1295-1370` — `nearestElection` / display logic: nearest **upcoming**
  election, **falls back to most-recent past** when none upcoming (why D-01 May-2026 displays).
- [[elections_view_display_rules]] — /results hides zero-candidate shells + shows only nearest
  election; seats badge.

### Headshot pipeline
- [[headshot_skill]] `/find-headshots`; sizing/cropping conventions in D-05.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- All 23 Collin governments + chambers + offices already exist (Phase 217 browse-verified,
  Phase 218 seated/documented). 219 seeds elections/races/candidates INTO them.
- Existing shared `2026-05-02` election row + neighbor race data to mirror in shape.
- `/find-headshots` skill for challenger photo sourcing.

### Established Patterns
- Collin TX has NO geofences; offices `district_id = NULL`; browse via by-government-list
  ([[collin_county_browse]]). Races link on `office_id` — no geofence needed.
- Every existing Collin race is `2026-05-02`; displays via the past-fallback in Results.jsx.

### Integration Points
- Browse already surfaces these govs; seeded races appear in the Elections section
  automatically once linked to an existing `office_id` under the browsed government.

</code_context>

<specifics>
## Specific Ideas

**Live DB state, all 23 Collin browse govs (2026-07-23) — re-verify at execute:**

| Bucket | Governments (races/offices) |
|--------|------------------------------|
| **Zero-race (12)** | Plano (0/9), McKinney (0/7), Melissa (0/7), Richardson (0/7), Van Alstyne (0/7), Blue Ridge (0/6), Farmersville (0/6), Josephine (0/6), Lavon (0/6), Nevada (0/6), Saint Paul (0/6), Weston (0/6) |
| **Thin (races < offices)** | Lowry Crossing (1/9), Princeton (1/8), Longview (1/7), Allen (2/7), Anna (2/7), Lucas (2/7), Murphy (2/7), Prosper (2/7), Parker (2/6), Celina (3/7), Frisco (3/7), Fairview (3/7) |

- Existing races are all `2026-05-02` (Longview `2026-06-13`, a runoff). Reuse the shared
  election row per D-01/discretion note.
- **Longview (`4843888`) is technically Gregg County, not Collin**, but it is in the 23-gov
  browse list — treat as in-scope; confirm its most-recent race at execute time.

</specifics>

<deferred>
## Deferred Ideas

- Compass stances for these candidates/officials — deferred this milestone (local-compass-
  question lock).
- Contact data (`web_form_url`, missing emails, `valid_to` term-end dates) → Phase 220.
- Next-upcoming (May 2027) race shells — not seeded now (D-02); revisit once TX 2027 filing
  opens as a future roster-reconcile.

### Reviewed Todos (not folded)
- **Audit Phase 212 gazetteer place data (encoding + invalid records)** — gazetteer/search
  data, unrelated to elections seeding. Stays in backlog.
- **Color-code city/county/state area-type in LocationCombobox rows** — UI polish, out of this
  data-only phase. Stays in backlog.
- **LocationCombobox non-blocking search refinements (from 214 review)** — UI, out of scope.
  Stays in backlog.

</deferred>

---

*Phase: 219-elections-candidates-backfill*
*Context gathered: 2026-07-23*
