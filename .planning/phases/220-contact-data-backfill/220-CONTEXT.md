# Phase 220: Contact Data Backfill - Context

**Gathered:** 2026-07-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Every Collin County official's profile carries a real, working way to reach them — a
`web_form_url` and/or `email_addresses` entry — plus an accurate term-end (`valid_to`) where
publicly documented. Scope = **all 23 resolving Collin County browse governments** (the 3
Ph217-reconciled cities folded in per operator request), covering every seated official,
including those newly seated by Phase 218 and 219 winners.

**Data-only.** No new frontend surface — profiles already render contact fields. All writes
are contact/term fields on `essentials.politicians`; seed idempotently via `WHERE NOT EXISTS`.
Evidence-only and cited: never fabricate an email or form URL; honest-blank where the city
publishes nothing.

**Live baseline (verified 2026-07-24, re-verify at execute):**

| Field | State |
|-------|-------|
| `web_form_url` | **0 / 23 govs** — empty everywhere (the primary gap) |
| `email_addresses` | 9 cities fully missing (Anna, Farmersville, Frisco, Lavon, Longview, Murphy, Princeton, Prosper, Van Alstyne); partial: Allen 6/7, Fairview 4/7, Parker 3/6, Saint Paul 4/6, Weston 5/6, Celina 1/7; rest complete |
| `valid_to` | **Already 100% populated** for every official with plausible derived term-end dates (218/219 seeding) — COLLIN-CONTACT-03 essentially met |
| `urls[]` | Already broadly populated (each official's council/profile page) — NOT a contact method for this phase |

</domain>

<decisions>
## Implementation Decisions

### web_form_url policy (COLLIN-CONTACT-01)
- **D-01:** **Apply the city's single official contact-form URL to every official of that
  city.** Small TX cities publish one city-wide "Contact Us" / CivicPlus `/FormCenter` form,
  not per-councilmember forms — that shared form is a valid working contact method for each
  official under that government. Leave `web_form_url` blank only where the city publishes no
  contact form at all (a plain listing/mailto page does NOT qualify — see D-04).

### Email policy (COLLIN-CONTACT-02)
- **D-02:** **Seat-specific aliases yes; generic city catch-alls no.** Seed published
  seat/role aliases as the official's email (e.g. `District1@`, `mayor@mckinneytexas.org` —
  the pattern already present in McKinney) and personal addresses where published. Do **NOT**
  seed a shared generic `council@`/`info@` city-wide alias onto individual officials — leave
  email blank in that case and rely on the city-wide contact form (D-01) for the working
  method. Seat aliases attach to the seat/office, so they persist correctly across incumbents.

### valid_to / term-end dates (COLLIN-CONTACT-03)
- **D-03:** **Treat as essentially met — spot-check + fix outliers, no mass re-write.**
  `valid_to` is already populated for 100% of officials with plausible derived dates
  (`valid_from` + 3/4-yr term, `term_date_precision = 'month'`). Sample-verify a handful
  against public sources, correct any obviously-wrong or stale/expired dates surfaced, and
  document COLLIN-CONTACT-03 as complete. Do not independently re-verify all ~160 officials.

### Contact-method bar (Success Criterion #4)
- **D-04:** **A `web_form_url` OR an `email_addresses` entry is required to satisfy "at least
  one working contact method."** The council/profile page already in `urls[]` does NOT count.
  Given D-01 (city-wide form on all officials), every official in a city that publishes any
  contact form will meet the bar; officials in a city with neither a form nor a published
  email are honest-blank and documented — never manufacture a method.

### Locked milestone conventions (carried forward — not re-decided)
- **D-05:** Evidence-only, cited; no fabricated contact data; honest-blank where nothing is
  published. TX municipal offices are nonpartisan (`party = NULL`, never displayed —
  [[antipartisan_display]]).
- **D-06:** **No compass stance research this milestone** (deferred pending local-compass-
  question lock). Do not seed stances as a side effect. See [[stance_research_all_topics]].
- **D-07:** Data-only; idempotent `WHERE NOT EXISTS` seeding; run the split-section SQL check
  after writing ([[section_split_check]]). Migrations live in `C:\EV-Accounts` (accounts-api
  → Render); commit via `git -C` ([[backend_architecture]], [[no_git_in_ev_accounts]]).
  gsd-executor has NO Supabase MCP — DB-verify steps run inline per plan.

### Claude's Discretion
- Per-city sourcing order, and which of the 9 fully-missing email cities to work first —
  planner/researcher choose.
- Exact `web_form_url` value per city (top-level `/FormCenter`, a specific "Contact the City
  Council" form, or the department form) — pick the most official/durable published form URL
  at research/execute time.
- How thoroughly to spot-check `valid_to` (D-03) — pick a representative sample size.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` §"Phase 220: Contact Data Backfill" — goal, re-verified gap list
  (web_form_url empty across all 23; email fully-missing cities incl. the 3 reconciled;
  Celina partial 1/7), 4 success criteria.
- `.planning/ROADMAP.md` §"Milestone-wide conventions" — data-only, evidence-only, split-
  section check, no compass stances this milestone.
- `.planning/REQUIREMENTS.md` — COLLIN-CONTACT-01, COLLIN-CONTACT-02, COLLIN-CONTACT-03.

### Schema & write path (essentials schema, verified live 2026-07-24)
- All contact/term fields live on **`essentials.politicians`**: `email_addresses` (text[]),
  `web_form_url` (text), `urls` (text[]), `valid_from`/`valid_to` (text),
  `term_date_precision` (text). Join path to scope the 23 govs:
  `governments (geo_id) → chambers (government_id) → offices (chamber_id) →
  politicians (id = offices.politician_id)`. See [[schema_key_tables]].
- The 23 Collin browse geo_ids are hardcoded in `src/lib/coverage.js:118-141`
  ([[collin_county_browse]]) — the authoritative in-scope government set.
- Prior seeding precedent for idempotent migrations against these same govs:
  `.planning/phases/219-elections-candidates-backfill/219-CONTEXT.md` (migration ledger,
  `git -C C:\EV-Accounts`, inline DB-verify).

### Display behavior
- Profiles already render contact fields — no view change. Confirm which fields the profile
  UI surfaces (web_form_url vs email vs urls) during research to ensure D-04's "working
  method" actually displays.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- All 23 Collin governments/chambers/offices/politicians already exist (Ph217 browse-verified,
  Ph218 seated, Ph219 winners). Phase 220 only UPDATEs contact/term fields on existing
  `politicians` rows — no new rows.
- Existing seat-alias email pattern in McKinney (`District1@`, `mayor@mckinneytexas.org`) is
  the model for D-02.

### Established Patterns
- Collin TX has NO geofences; browse via by-government-list ([[collin_county_browse]]). Contact
  fields are per-politician, no geo linkage needed.
- `valid_to` values are derived term-ends (`valid_from` + term length, `precision = 'month'`),
  already applied consistently by 218/219 seeding.

### Integration Points
- Contact fields already surface on the official profile once populated — no wiring needed.

</code_context>

<specifics>
## Specific Ideas

- **Fully-missing email cities to prioritize:** Anna, Farmersville, Frisco, Lavon, Longview,
  Murphy, Princeton, Prosper, Van Alstyne (0 emails each as of 2026-07-24).
- **Partial email cities:** Allen (6/7), Fairview (4/7), Parker (3/6), Saint Paul (4/6),
  Weston (5/6), Celina (1/7).
- **Longview (`4843888`) is technically Gregg County, not Collin**, but it is in the 23-gov
  browse list — treat as in-scope.
- The 5 zero-headshot cities (Blue Ridge, Farmersville, Lowry Crossing, Nevada, Saint Paul)
  are a headshot concern only (Phase 221) — several already have full email coverage; contact
  work here is unaffected by their headshot gap.

</specifics>

<deferred>
## Deferred Ideas

- **`urls[]` backfill** — not in COLLIN-CONTACT scope (already broadly populated); do not treat
  as a phase deliverable. Any gaps noted, not filled.
- **Compass stances** for these officials — deferred this milestone (local-compass-question
  lock).
- **Collin County Headshots** → Phase 221.
- **Collin County Stances** → Phase 222.

### Reviewed Todos (not folded)
- **Color-code city/county/state area-type in LocationCombobox rows** — UI polish, out of this
  data-only phase. Stays in backlog.
- **Audit Phase 212 gazetteer place data (encoding + invalid records)** — gazetteer/search
  data, unrelated to contact backfill. Stays in backlog.
- **LocationCombobox non-blocking search refinements (from 214 review)** — UI, out of scope.
  Stays in backlog.

</deferred>

---

*Phase: 220-contact-data-backfill*
*Context gathered: 2026-07-24*
