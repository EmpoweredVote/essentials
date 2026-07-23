# Phase 218: Vacancies & Missing People - Context

**Gathered:** 2026-07-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Every Collin County office reflects who actually holds it today. For each **unseated
office** (an office row with `politician_id = NULL`) across all 23 resolving Collin
County governments, either seat a researched, cited incumbent OR document the seat as a
genuine vacancy. Also detect **missing seats entirely** — where a governing body has more
real seats than seeded office rows — and add them.

**Scope expanded to all 23 govs** (per operator request 2026-07-23): the 3 Phase-217
reconciled cities with unseated offices (Plano, Princeton, Van Alstyne) are folded in
alongside the 8 originally-scoped cities.

**Data-only.** No new frontend surface. Migrations seed rows via `WHERE NOT EXISTS`
(idempotent). Split-section SQL check must run clean after seeding.

</domain>

<decisions>
## Implementation Decisions

### Scope & target list (re-verified live 2026-07-23)
- **D-01:** Target = **21 unseated offices across 11 cities** (NOT the roadmap's original
  "~9 across 5"): **Anna (2), Blue Ridge (2), Fairview (3), Josephine (1), Lowry Crossing
  (1), Lucas (2), Nevada (3), Parker (3), Plano (1), Princeton (1), Van Alstyne (2)**. The
  original roadmap list undercounted Parker (2→3) and Lucas (1→2) and omitted Anna,
  Fairview, Josephine entirely — those gap numbers were derived from the same stale memory
  snapshot that produced the (already-fixed) Phase 217 premise. Re-verify counts at plan/
  execute time (roster can change).
- **D-02:** Beyond unseated office rows, verify each governing body's **actual seat count**
  against the seeded office rows — if a council legitimately has more seats than modeled,
  add the missing office rows too ("Missing People").

### Headshots — INCLUDED (operator decision)
- **D-03:** Newly-seated officials **DO get 600×750 headshots** as part of Phase 218 (not
  deferred). Follow the established pipeline: 4:5 crop-first, Lanczos, q90, `press_use`,
  `type='default'`, eyes ~1/3 from top, head+shoulders, no text/graphics on the face; use
  the `/find-headshots` skill + WAF/Playwright fallback per prior deep-seed phases. See
  [[headshot_image_sizing]], [[headshot_cropping]], [[headshot_resize_no_distort]],
  [[headshot_no_graphics]], [[headshot_skill]].
- **Note:** This does NOT reopen the milestone's out-of-scope 5 zero-photo cities (Blue
  Ridge, Farmersville, Lowry Crossing, Nevada, Saint Paul) — those have no known online
  source. For newly-seated people in THOSE cities, an honest blank/placeholder is expected
  where no photo source exists; do not fabricate. Headshots are sourced where a source
  exists, blank where it does not (same honest-blank rule as stances).

### Vacancy determination — DEEPER SEARCH (operator decision)
- **D-04:** Evidence-only, no defaults, no guessed incumbents. Seat a person ONLY with a
  cited source. Before declaring an office a **documented vacancy**, exhaust sources beyond
  the official city site + Ballotpedia — check local news archives, council meeting
  minutes/agendas, and official social media. Only after that broader search comes up empty
  is the seat marked an explicit documented vacancy. (Thorough over fast.)

### Party / election method
- **D-05:** Texas municipal offices are **nonpartisan** — `party = NULL`. Never display or
  seed party (antipartisan, see [[antipartisan_display]]). Verify election method (at-large
  vs by-place/by-district) per city at research time; most Collin small cities are at-large
  by numbered place.

### Out of scope
- **D-06:** NO compass stance research this milestone (deferred pending local-compass-question
  lock, per milestone convention + [[stance_research_all_topics]]). Do not seed stances as a
  side effect. Elections/candidate backfill = Phase 219; contact data = Phase 220.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` §"Phase 218: Vacancies & Missing People" — re-verified gap list + success criteria.
- `.planning/ROADMAP.md` §"Milestone-wide conventions" — data-only, evidence-only, split-section check, headshot honest-blank rule.
- `.planning/REQUIREMENTS.md` — COLLIN-PEOPLE-01, COLLIN-PEOPLE-02.

### Schema & seeding pattern
- Schema is authoritative in `essentials` — join `governments → chambers → offices →
  politicians`; politician images in `politician_images`; NO unique geo_id (join on id).
  See [[schema_key_tables]].
- Idempotent seeding recipe: structural migration with `WHERE NOT EXISTS`; migration-ledger
  convention (on-disk counter authoritative). Prior deep-seed precedent (e.g. Sahuarita/
  South Tucson greenfield seeds) shows the office/politician/title pattern — but 218 is
  BROWNFIELD (governments already exist), so seed offices/politicians INTO existing
  governments/chambers, do not recreate governments.
- gsd-executor has NO Supabase MCP — DB-verify steps run inline within each plan.

### Headshot pipeline
- [[headshot_skill]] `/find-headshots`; sizing/cropping conventions above.

### Backend / deploy
- Migrations live in `C:\EV-Accounts` (accounts-api → Render). See [[backend_architecture]],
  [[no_git_in_ev_accounts]] (commit via `git -C`).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- All 23 Collin governments + chambers already exist (browse-verified Phase 217). 218 adds
  offices/politicians into them — no new government/chamber rows for existing bodies.
- `/find-headshots` skill for the photo pipeline.

### Established Patterns
- Collin TX has NO geofence boundaries and offices have `district_id = NULL` — browse works
  via the by-government-list path, NOT geofences. Newly-seated offices need no geofence.
- Nonpartisan municipal: `party = NULL`, at-large-by-place typical.

### Integration Points
- Browse already surfaces these govs; newly-seated people appear automatically once linked.

</code_context>

<specifics>
## Specific Ideas

**Per-city unseated-office breakdown (live DB, 2026-07-23) — re-verify at execute:**

| City | offices | seated | unseated (target) |
|------|---------|--------|-------------------|
| Anna | 7 | 5 | 2 |
| Blue Ridge | 5 | 3 | 2 |
| Fairview | 7 | 4 | 3 |
| Josephine | 6 | 5 | 1 |
| Lowry Crossing | 5 | 4 | 1 |
| Lucas | 7 | 5 | 2 |
| Nevada | 6 | 3 | 3 |
| Parker | 6 | 3 | 3 |
| Plano | 9 | 8 | 1 |
| Princeton | 8 | 7 | 1 |
| Van Alstyne | 7 | 5 | 2 |
| **Total** | | | **21** |

The other 12 Collin govs have zero unseated offices (fully seated) — but still verify seat
count vs real body size (D-02) in case a seat is missing entirely.

</specifics>

<deferred>
## Deferred Ideas

- Compass stances for these officials — deferred this milestone (local-compass-question lock).
- Elections/candidates → Phase 219; contact data (web_form_url/email/valid_to) → Phase 220.
- Headshots for the 5 known zero-photo cities where no online source exists — honest blank,
  not fabricated.

</deferred>

---

*Phase: 218-vacancies-missing-people*
*Context gathered: 2026-07-23*
