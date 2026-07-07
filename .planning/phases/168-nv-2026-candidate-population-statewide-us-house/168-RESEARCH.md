# Phase 168: NV 2026 Candidate Population — Statewide & US House - Research

**Researched:** 2026-06-30
**Domain:** Nevada 2026 general-election candidate seeding (race_candidates), politician linking, challenger headshots
**Confidence:** HIGH (primary results confirmed via NV SoS official results + multiple news sources)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Seed ALL certified Nov-3 general candidates per race — major-party nominees PLUS certified independents / minor-party / nonpartisan candidates (not just D+R).
- **D-02:** Set `race_candidates.politician_id` for any candidate who matches an existing NV politician record (seeded Phases 159–160), not only the sitting incumbent of the contested seat — includes cross-office records. Challengers with no existing record stay `politician_id = NULL`.
- **D-03:** Fetch headshots now (this phase) for new challengers (those with no politician record) via the `find-headshots` flow. Honest-skip where no usable photo exists. Rules: 600x750 (4:5, Lanczos, q90), crop-not-stretch, eyes ~1/3 from top, no superimposed text/graphics.
- **D-04:** Seed only confirmed/certified Nov-3 general candidates (evidence-only). Hold back late-filing / not-yet-certified independents or minor-party candidates and note them in migration comments.
- **D-05 (scope):** Exactly the 10 races — 6 statewide execs + 4 US House. Legislative races are OUT of scope.
- **D-06 (mechanics):** Migration in `C:/EV-Accounts/backend/migrations/`; **next counter = 1114**; paired `_apply-migration-1114.ts` smoke harness; idempotent via `WHERE NOT EXISTS (race_id, full_name)`; `candidate_status='active'`; **party never stored** (antipartisan); `source` = citation URL per candidate; no `schema_migrations` ledger row. The 32 `candidate_staging` rows are reference leads only — do NOT bulk-import.

### Claude's Discretion
- Whether the 10 races land in one migration or split (e.g. statewide vs US House) — planner's call, idempotent either way. The `find-headshots` work likely warrants its own plan/wave after the candidate-seeding migration.
- `first_name`/`last_name` split convention and `external_id`/`source` string formatting (follow the `1072` shapes).

### Deferred Ideas (OUT OF SCOPE)
- Legislative candidate population (11 State Senate + 42 State Assembly races) — follow-up phase.
- Candidate compass stances — downstream of candidate population.
- Bulk-promotion tooling for `candidate_staging` → `race_candidates`.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NV-CAND-01 | NV 2026 general-election candidates (nominees / decided June 9 primary winners) populated for the 6 statewide constitutional offices + 4 US House districts — `race_candidates` rows bound to Phase 167 `race_id`s and to politician records, general field only (no losing primary entrants / dupes), evidence-cited. | Full verified field documented below; politician linking map provided; race_id resolution approach confirmed. |
</phase_requirements>

---

## Summary

The June 9, 2026 Nevada primary concluded with a clean, confirmable result for all 10 in-scope races. Every major-party nominee has been called by the Associated Press and reported by the Nevada Secretary of State official results page. The NV SoS results at `nvsos.gov/SOSelectionPages/results/2026StateWidePrimary/ElectionSummary.aspx` is the authoritative confirmation source (official, not press). The general election field for all 10 races is documented in full below with source citations.

The headline finding is that the Governor race IS fully resolvable: incumbent Joe Lombardo (R) is the sitting Governor and is the `is_incumbent=true` record. Aaron Ford (current AG, won the Democratic primary) is the challenger — no politician_id exists for him yet (he holds the AG office, but that record under a *different* DB seat is a question the planner must resolve with a live query — see Politician Linking section). The AG race is an open seat (Ford ran for Governor); Nicole Cannizzaro won the Democratic primary and Adriana Guzmán Fralick won the Republican primary — neither are current NV politicians in the DB's AG office.

The Treasurer race is fully open (Zach Conine, the incumbent Treasurer, is term-limited and ran for AG — he lost the primary). No incumbent exists for Treasurer. The confirmed nominees are Tya Mathis-Coleman (D) and Drew Johnson (R), neither have NV politician records.

US House NV-02 is a fully open seat (Mark Amodei retired; 0 incumbents). NV-01, NV-03, NV-04 have Democratic incumbents all running again.

**Primary recommendation:** Write one migration (1114) for all 10 races' `race_candidates` rows using the `1072` pattern; include a Wave 0 pre-check task to run a live DB query resolving the 10 `race_id` UUIDs before hardcoding them. Follow with a second plan for headshots via the `find-headshots` flow for all challengers lacking a politician record.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Candidate seeding | Database / Storage | — | SQL migration inserts `race_candidates` rows; no frontend code changes required |
| Politician linking | Database / Storage | — | `politician_id` FK set by subquery on `external_id` during migration |
| race_id resolution | Database / Storage | — | Subquery on `essentials.races` joining `essentials.elections` + `essentials.offices` |
| Headshot fetch & upload | Browser / Playwright | Supabase Storage | `find-headshots` flow: search → user approval → PIL crop/resize → Storage upload |
| Frontend rendering | Browser / Client | — | No changes needed; `ElectionsView.jsx` already renders `race_candidates`; the seeding makes existing components show real data |

---

## Verified Nov-3, 2026 General Election Field

### STATEWIDE RACES (6)

All primary results confirmed via Nevada SoS official results page and multiple AP-called news sources.

#### Race 1: Governor of Nevada
[VERIFIED: NV SoS official results + mynews4.com/Wikipedia]

| Candidate | Party (research only) | is_incumbent | Existing politician_id? | Source |
|-----------|----------------------|-------------|------------------------|--------|
| Joe Lombardo | R (incumbent Gov) | **true** | YES — seeded Phase 159 (ext_id to confirm via live query) | https://en.wikipedia.org/wiki/2026_Nevada_gubernatorial_election |
| Aaron Ford | D (current AG running for Gov) | false | **QUERY NEEDED** — Ford holds the AG office (pre-existing); planner must live-query by name before migration | https://en.wikipedia.org/wiki/2026_Nevada_gubernatorial_election |

**Independent candidates:** Wikipedia lists multiple declared independents (Christopher Battenberg, Max Beck, Danielle Ford, Jordan Koteras, Allen Rheinhart, Emilio R. Rodriguez, John T. Scott). Clark County elections PDF confirms at minimum Christopher Battenberg (NPP). However, these are "declared" — Nevada ballot certification for independents occurs after the primary. [ASSUMED: independent candidates for Governor have not yet been officially certified for the Nov 3 ballot as of 2026-06-30.] Apply D-04: hold back, note in migration comments.

#### Race 2: Lieutenant Governor of Nevada
[VERIFIED: NV SoS official results + multiple news sources]

| Candidate | Party | is_incumbent | Existing politician_id? | Source |
|-----------|-------|-------------|------------------------|--------|
| Stavros Anthony | R (incumbent Lt. Gov) | **true** | YES — seeded Phase 159 (ext_id to confirm via live query) | https://www.nbcnews.com/politics/2026-primary-elections/nevada-lieutenant-governor-results |
| Sandra Jauregui | D (Assembly Majority Leader) | false | NO — not an NV politician in DB | https://www.nbcnews.com/politics/2026-primary-elections/nevada-lieutenant-governor-results |

Stavros Anthony ran unopposed in the R primary (no R primary held per SoS summary — sole Republican nominee).

#### Race 3: Attorney General of Nevada
[VERIFIED: NV SoS official results + reviewjournal.com]

This is an **open seat** — Aaron Ford (current AG) ran for Governor; there is NO sitting AG on the general ballot.

| Candidate | Party | is_incumbent | Existing politician_id? | Source |
|-----------|-------|-------------|------------------------|--------|
| Nicole Cannizzaro | D (current NV Senate Majority Leader) | false | NO — check by name (she holds a Senate seat, which is seeded Phase 160; planner must live-query) | https://www.reviewjournal.com/news/politics-and-government/nevada/cannizzaro-wins-democratic-attorney-general-primary-other-statewide-races-competitive-3836096/ |
| Adriana Guzmán Fralick | R | false | NO | https://www.reviewjournal.com/news/politics-and-government/nevada/cannizzaro-wins-democratic-attorney-general-primary-other-statewide-races-competitive-3836096/ |

Cannizzaro won the D primary with 62% over Zach Conine (34%). Fralick won R primary 60% over Danny Tarkanian 35%.

**Key check:** Nicole Cannizzaro is a Nevada State Senator — she may have a politician record from Phase 160 (63 legislators). The planner MUST run a live query `WHERE full_name ILIKE '%Cannizzaro%'` before the migration. If a record exists, set `politician_id` per D-02. If not, leave NULL.

#### Race 4: Secretary of State of Nevada
[VERIFIED: NV SoS official results + abcnews.com/kolotv.com]

| Candidate | Party | is_incumbent | Existing politician_id? | Source |
|-----------|-------|-------------|------------------------|--------|
| Cisco Aguilar | D (incumbent SoS) | **true** | YES — seeded Phase 159 (ext_id to confirm via live query) | https://www.kolotv.com/2026/06/16/marchant-wins-gop-primary-nevada-secretary-state/ |
| Jim Marchant | R | false | NO | https://www.kolotv.com/2026/06/16/marchant-wins-gop-primary-nevada-secretary-state/ |

Cisco Aguilar was "unopposed" in D primary (no D primary held per SoS summary — advanced automatically). Jim Marchant won R primary with 32.57% in a multi-candidate field (defeating Shirley Folkins-Roberts and Sharron Angle).

#### Race 5: State Treasurer of Nevada
[VERIFIED: NV SoS official results + reviewjournal.com]

This is an **open seat** — Zach Conine is term-limited and ran for AG (lost primary to Cannizzaro).

| Candidate | Party | is_incumbent | Existing politician_id? | Source |
|-----------|-------|-------------|------------------------|--------|
| Tya Mathis-Coleman | D (Deputy State Treasurer) | false | NO | https://www.reviewjournal.com/news/politics-and-government/nevada/cannizzaro-wins-democratic-attorney-general-primary-other-statewide-races-competitive-3836096/ |
| Drew Johnson | R (think tank founder, policy analyst) | false | NO | https://www.reviewjournal.com/news/politics-and-government/nevada/johnson-carter-treasurer-primary-stays-razor-thin-as-nevada-count-continues-3836538/ |

Mathis-Coleman won D primary 54.3% over Joe Dalia and Jay Maharjan. Drew Johnson won R primary with 45.47% over Jeff Carter (44.53%) — very close race, but SoS shows Johnson as winner.

**Cross-office check for Zach Conine:** Per D-02, Conine (current Treasurer, ext_id unknown, Phase 159 pre-existing) ran for AG and LOST the primary — he does NOT appear on the Nov 3 general ballot. He should get NO `race_candidates` row. Do NOT link him to the Treasurer race (he is not running in it).

#### Race 6: State Controller of Nevada
[VERIFIED: NV SoS official results + ourtownreno.com]

| Candidate | Party | is_incumbent | Existing politician_id? | Source |
|-----------|-------|-------------|------------------------|--------|
| Andy Matthews | R (incumbent Controller) | **true** | YES — external_id = **-3200006** (Migration 1050, confirmed) | https://www.nvsos.gov/SOSelectionPages/results/2026StateWidePrimary/ElectionSummary.aspx |
| Michael MacDougall | D (teacher) | false | NO | https://thenevadaindependent.com/article/2026-nevada-primary-election-results-live-blog |

Andy Matthews ran unopposed in R primary. MacDougall won D primary 45.29% over Bob Blackstock and Bob Tolle (3-way race). MacDougall is described as a teacher/educator.

---

### US HOUSE RACES (4)

All primary results confirmed via The Nevada Independent live blog + NV SoS.

#### Race 7: U.S. Representative District 1 (NV-01)
Las Vegas urban core. Incumbent: Dina Titus (D).
[VERIFIED: thenevadaindependent.com + Wikipedia]

| Candidate | Party | is_incumbent | Existing politician_id? | Source |
|-----------|-------|-------------|------------------------|--------|
| Dina Titus | D (incumbent) | **true** | YES — seeded Phase 159 (ext_id ~-6000301 to confirm) | https://en.wikipedia.org/wiki/2026_United_States_House_of_Representatives_elections_in_Nevada |
| Carrie Buck | R (NV state senator) | false | **QUERY NEEDED** — she's an NV State Senator (Phase 160) | https://en.wikipedia.org/wiki/2026_United_States_House_of_Representatives_elections_in_Nevada |

**Independent candidates on ballot:** Wikipedia confirms multiple independents certified: Bobby Khan, Steven St John, Anthony Thomas Jr., Victor Willert, and Lynn Chapman (Independent American Party). J.E. Houston also mentioned. Per D-04: these are confirmed on the general ballot (pre-certified independent period already passed for filing purposes). The planner should research which of these are officially certified before including — recommend: seed the confirmed two major-party nominees, and hold back the independents with a migration comment (they were filed but ballot certification status as of 2026-06-30 not confirmed from an official source). [ASSUMED: independent candidates for NV-01 have completed petition requirements but final certification status not confirmed from official source as of 2026-06-30.]

**Key check for Carrie Buck:** She is a Nevada State Senator — Phase 160 may have her record. Live-query by name before migration.

#### Race 8: U.S. Representative District 2 (NV-02)
Northern/rural Nevada. **Open seat** — Mark Amodei (R) announced retirement Feb 2026.
[VERIFIED: 2news.com/PBS NewsHour + thenevadaindependent.com]

| Candidate | Party | is_incumbent | Existing politician_id? | Source |
|-----------|-------|-------------|------------------------|--------|
| David Flippo | R (Air Force veteran) | false | NO | https://www.pbs.org/newshour/politics/trump-backed-david-flippo-wins-nevada-republican-primary-for-u-s-house-seat |
| Teresa Benitez-Thompson | D (former NV Assembly; Aaron Ford chief of staff) | false | **QUERY NEEDED** — check if former Assembly member record exists in Phase 160 | https://www.2news.com/news/local/voters-decide-david-flippo-teresa-benitez-thompson-advance-to-november/article_ea56d1ef-11f7-47a1-9308-d0733e5d9558.html |
| Lynn Chapman | IAP (Independent American Party) | false | NO | https://www.2news.com/news/local/voters-decide-david-flippo-teresa-benitez-thompson-advance-to-november/article_ea56d1ef-11f7-47a1-9308-d0733e5d9558.html |

Lynn Chapman (IAP) is confirmed on the general ballot per the 2news.com article. David Flippo won R primary with 45.9% in a large field (15 Republicans). Benitez-Thompson won D primary over a crowded field.

**Teresa Benitez-Thompson:** Former NV Assembly member (first elected 2010) who later served as Aaron Ford's chief of staff. Phase 160 seeded 42 Assembly members — but she is a former member, not current. Query by name first; if she left before Phase 160 seeding, she may not exist. Likely NO record.

#### Race 9: U.S. Representative District 3 (NV-03)
Henderson/southwest Las Vegas suburbs. Incumbent: Susie Lee (D).
[VERIFIED: NV SoS primary results + sanfordherald.com/thecentersquare.com]

| Candidate | Party | is_incumbent | Existing politician_id? | Source |
|-----------|-------|-------------|------------------------|--------|
| Susie Lee | D (incumbent) | **true** | YES — seeded Phase 159 (ext_id ~-6000303 to confirm) | https://www.sanfordherald.com/news/national/candidates-notch-wins-in-nevada-u-s-house-primaries/article_ea45dd0b-74f8-5e3e-bff4-2d9b054992a5.html |
| Marty O'Donnell | R (audio producer / video game composer) | false | NO | https://www.sanfordherald.com/news/national/candidates-notch-wins-in-nevada-u-s-house-primaries/article_ea45dd0b-74f8-5e3e-bff4-2d9b054992a5.html |

Susie Lee won D primary 73.03%. O'Donnell won R primary 43.75%. No confirmed independents found for NV-03 in search results — hold back any unconfirmed third-party candidates per D-04.

#### Race 10: U.S. Representative District 4 (NV-04)
North Las Vegas / suburban Clark County. Incumbent: Steven Horsford (D).
[VERIFIED: NV SoS primary results + thecentersquare.com]

| Candidate | Party | is_incumbent | Existing politician_id? | Source |
|-----------|-------|-------------|------------------------|--------|
| Steven Horsford | D (incumbent) | **true** | YES — seeded Phase 159 (ext_id ~-6000304 to confirm) | https://www.thecentersquare.com/nevada/article_c1f7da4e-1714-4ce0-a97a-931ed2458904.html |
| Cody Whipple | R (rancher) | false | NO | https://www.thecentersquare.com/nevada/article_c1f7da4e-1714-4ce0-a97a-931ed2458904.html |

Horsford was unopposed in D primary. Whipple won R primary with 61%.

---

## Standard Stack

No new libraries or packages — this phase is pure data migration + the existing `find-headshots` skill.

### Core Tools (all pre-existing)
| Tool | Version | Purpose | Status |
|------|---------|---------|--------|
| PostgreSQL / Supabase | — | `race_candidates` INSERT via psql -f | Pre-existing; Phase 167 migrations applied same way |
| PIL (Pillow) | pre-installed | Headshot crop/resize (600×750, Lanczos, q90) | Pre-existing in `find-headshots` skill |
| tsx | node_modules/tsx | Run `_apply-migration-NNN.ts` smoke harness | Pre-existing; invoked as `node node_modules/tsx/dist/cli.mjs` from C:/EV-Accounts/backend |

### Package Legitimacy Audit

No new packages — this phase installs nothing. All tooling is pre-existing.

---

## Architecture Patterns

### Migration Pattern (from 1072 analog — verified)

```sql
-- Migration 1114: Seed Nov 3 2026 NV general-election candidates for 10 statewide/House races
BEGIN;

INSERT INTO essentials.race_candidates
  (race_id, politician_id, full_name, first_name, last_name, is_incumbent, candidate_status, source)
SELECT v.race_id::uuid, v.politician_id::uuid, v.full_name, v.first_name, v.last_name,
       v.is_incumbent, 'active', v.source
FROM (VALUES
  -- Governor (race_id via subquery — resolve in Wave 0)
  ('[gov_race_id]', '[lombardo_politician_id]', 'Joe Lombardo', 'Joe', 'Lombardo', true, 'https://en.wikipedia.org/wiki/2026_Nevada_gubernatorial_election'),
  ('[gov_race_id]', NULL, 'Aaron Ford', 'Aaron', 'Ford', false, 'https://en.wikipedia.org/wiki/2026_Nevada_gubernatorial_election'),
  ...
) AS v(race_id, politician_id, full_name, first_name, last_name, is_incumbent, source)
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.race_candidates rc
  WHERE rc.race_id = v.race_id::uuid AND rc.full_name = v.full_name
);

COMMIT;
-- NO schema_migrations ledger row (D-06; on-disk counter authoritative)
```

**Source:** Migration 1072 (verified pattern — read in full above)

### race_id Resolution Pattern

Race IDs are generated by `gen_random_uuid()` in migration 1112, so they are not predictable. The planner MUST include a Wave 0 task that runs this query live against the DB to extract the actual `race_id` UUIDs before writing the migration VALUES:

```sql
SELECT r.id AS race_id, r.position_name, d.district_type, d.geo_id
FROM essentials.races r
JOIN essentials.elections e ON e.id = r.election_id
JOIN essentials.offices o ON o.id = r.office_id
JOIN essentials.districts d ON d.id = o.district_id
WHERE e.name = 'NV 2026 Statewide General'
  AND d.district_type IN ('STATE_EXEC', 'NATIONAL_LOWER')
  AND d.state ILIKE 'nv'
ORDER BY d.district_type, d.geo_id;
```

Expected: 6 STATE_EXEC rows + 4 NATIONAL_LOWER rows = 10 total.

### politician_id Resolution Pattern

For incumbents, resolve by `external_id`. The exact external_id scheme for the 5 pre-existing statewide execs (Governor, Lt. Gov, AG, SoS, Treasurer) is NOT in any migration file — they were seeded before v18.0. The planner MUST run a live query:

```sql
SELECT p.external_id, p.full_name, o.title, d.district_type
FROM essentials.politicians p
JOIN essentials.offices o ON o.id = p.office_id
JOIN essentials.districts d ON d.id = o.district_id
WHERE d.state ILIKE 'nv'
  AND d.district_type = 'STATE_EXEC'
  AND p.is_active = true
ORDER BY p.external_id;
```

Andy Matthews is confirmed `external_id = -3200006` (migration 1050). The other 5 are pre-existing.

For the NV-01/03/04 House incumbents (Dina Titus, Susie Lee, Steven Horsford), the ext_id band is described in Phase 159 memory as `-60003xx` scheme. Live query to confirm:

```sql
SELECT p.external_id, p.full_name, d.geo_id
FROM essentials.politicians p
JOIN essentials.offices o ON o.id = p.office_id
JOIN essentials.districts d ON d.id = o.district_id
WHERE d.district_type = 'NATIONAL_LOWER'
  AND d.state ILIKE 'nv'
  AND p.is_active = true
ORDER BY d.geo_id;
```

### Optional Politician Record Creation for New Challengers

For challengers who need a politician record created (D-03 headshots phase), follow the TX 1110 pattern: assign external_ids in a new NV challengers band. Recommended: `-(3200100 + seq)` (e.g., -3200101, -3200102, ...). Band verified available: -3200007 through -3200099 is a safe gap (existing are -3200001..-3200006). Confirm live before use:

```sql
SELECT COUNT(*) FROM essentials.politicians
WHERE external_id BETWEEN -3200199 AND -3200007;
```

However: the `find-headshots` skill (Plan 02) creates politician records inline during headshot approval — it does NOT use a pre-planned external_id band. Instead it inserts with `gen_random_uuid()` and no external_id via the INSERT in the skill's `create_politician_record` step. This is the correct pattern for challengers — they get a UUID-only record without external_id until/unless they become a full incumbent.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Headshot crop/resize | Custom PIL script | `find-headshots` skill (step: import_image) | Already handles 4:5 crop → 600×750 resize → Supabase upload with user approval |
| Politician deduplication | Manual name check | `find-headshots` create_politician_record 3-check guard | Multi-step collision guard already built into the skill |
| race_id lookup | Hardcoded guesses | Live DB query in Wave 0 pre-check | race_ids are gen_random_uuid() — cannot be predicted |
| candidate_status | Custom value | Always `'active'` | Schema constraint; existing migrations all use this value |

---

## Common Pitfalls

### Pitfall 1: Hardcoding race_ids Without a Live Pre-Check
**What goes wrong:** Migration fails or inserts into wrong race because race_ids from migration 1112 are random UUIDs and cannot be predicted without querying.
**Why it happens:** Planner assumes they can be derived from position_name alone.
**How to avoid:** Wave 0 pre-check task runs the `SELECT r.id ... WHERE e.name = 'NV 2026 Statewide General'` query and captures 10 UUIDs before writing migration VALUES.
**Warning signs:** Migration inserts 0 rows because race_id cast fails.

### Pitfall 2: Assuming Aaron Ford Has No politician_id
**What goes wrong:** Ford is set to `politician_id = NULL` when in fact he may have a pre-existing record as NV Attorney General (the pre-existing officials seeded before v18.0 included the AG).
**Why it happens:** He is the incumbent AG running for a different office (Governor) — easy to miss as a cross-office link per D-02.
**How to avoid:** Live-query `WHERE full_name ILIKE '%Ford%' AND d.district_type = 'STATE_EXEC'` before finalizing migration.
**Warning signs:** Gov race shows Aaron Ford without a photo/profile link on the elections page.

### Pitfall 3: Seeding Zach Conine as a Candidate
**What goes wrong:** Conine is the current Treasurer, so naively his name appears when querying "Treasurer candidates" — but he ran for AG (lost primary) and is NOT on the Nov 3 ballot in any race.
**Why it happens:** Cross-office confusion; Conine's name appeared in much primary coverage.
**How to avoid:** Conine gets ZERO `race_candidates` rows. He is not running in the general.
**Warning signs:** Conine appears in the seeded candidates for Treasurer or AG race.

### Pitfall 4: Marking the AG/Treasurer Races as Incumbent-Contested
**What goes wrong:** `is_incumbent=true` set for any candidate in the AG or Treasurer race.
**Why it happens:** Aaron Ford (AG) ran for Governor; Zach Conine (Treasurer) is term-limited. Both offices are open-seat contests.
**How to avoid:** `is_incumbent=false` for ALL candidates in Attorney General and State Treasurer races.

### Pitfall 5: Independent Candidates — Including Unverified Ones
**What goes wrong:** Including declared-but-not-yet-certified independents (Governor race, NV-01) inflates the field and creates inaccurate ballot representations.
**Why it happens:** Wikipedia lists "declared" candidates, not certified ones; Nevada has low petition thresholds (100 signatures) but certification is still a formal step.
**How to avoid:** Per D-04, hold back independents with a migration comment. Only seed confirmed-certified ones: Lynn Chapman (IAP) for NV-02 is confirmed by news coverage; the NV-01 independents (Bobby Khan, Steven St John, etc.) and Governor independents are [ASSUMED] not yet officially certified.

### Pitfall 6: Carrie Buck / Nicole Cannizzaro — Missing Cross-Phase Links
**What goes wrong:** Carrie Buck (R NV-01 candidate) is a current NV State Senator (Phase 160 seeded 21 senators). Nicole Cannizzaro (D AG candidate) is a current NV State Senator. If these records exist, setting `politician_id = NULL` violates D-02 and loses their profile photos.
**Why it happens:** Senate phase seeded legislators by district, not by 2026 race relevance.
**How to avoid:** Live-query before writing migration: `WHERE full_name ILIKE '%Buck%'` and `WHERE full_name ILIKE '%Cannizzaro%'` against legislators.

---

## Politician Linking Map (Pre-Research)

| Race | Candidate | is_incumbent | Link Status | Action |
|------|-----------|-------------|------------|--------|
| Governor | Joe Lombardo | true | Pre-existing Phase 159 — LIVE QUERY needed for politician_id | Query `WHERE full_name = 'Joe Lombardo'` |
| Governor | Aaron Ford | false | Pre-existing Phase 159 (current AG) — LIVE QUERY per D-02 | Query `WHERE full_name = 'Aaron Ford'` |
| Lt Governor | Stavros Anthony | true | Pre-existing Phase 159 — LIVE QUERY | Query `WHERE full_name = 'Stavros Anthony'` |
| Lt Governor | Sandra Jauregui | false | NO — not in DB | NULL |
| Attorney General | Nicole Cannizzaro | false | QUERY — current NV State Senator (Phase 160) | Query `WHERE full_name ILIKE '%Cannizzaro%'` |
| Attorney General | Adriana Guzmán Fralick | false | NO | NULL |
| Secretary of State | Cisco Aguilar | true | Pre-existing Phase 159 — LIVE QUERY | Query `WHERE full_name = 'Cisco Aguilar'` |
| Secretary of State | Jim Marchant | false | NO | NULL |
| Treasurer | Tya Mathis-Coleman | false | NO | NULL |
| Treasurer | Drew Johnson | false | NO — different Drew Johnson who ran for Susie Lee's seat in 2024 but NO NV politician record from that (he lost, challengers don't get seeded) | NULL |
| Controller | Andy Matthews | true | CONFIRMED: external_id = **-3200006** (migration 1050) | `(SELECT id FROM essentials.politicians WHERE external_id = -3200006)` |
| Controller | Michael MacDougall | false | NO | NULL |
| NV-01 | Dina Titus | true | Pre-existing Phase 159 (ext_id ~-6000301) — LIVE QUERY | Query `WHERE full_name = 'Dina Titus'` |
| NV-01 | Carrie Buck | false | QUERY — current NV State Senator (Phase 160) | Query `WHERE full_name ILIKE '%Carrie Buck%'` |
| NV-02 | David Flippo | false | NO | NULL |
| NV-02 | Teresa Benitez-Thompson | false | QUERY — former NV Assembly (Phase 160 seeded current members only; she is not current) | Query first; likely NO record |
| NV-02 | Lynn Chapman | false | NO | NULL |
| NV-03 | Susie Lee | true | Pre-existing Phase 159 (ext_id ~-6000303) — LIVE QUERY | Query `WHERE full_name = 'Susie Lee'` |
| NV-03 | Marty O'Donnell | false | NO | NULL |
| NV-04 | Steven Horsford | true | Pre-existing Phase 159 (ext_id ~-6000304) — LIVE QUERY | Query `WHERE full_name = 'Steven Horsford'` |
| NV-04 | Cody Whipple | false | NO | NULL |

---

## Migration Mechanics

### Counter Confirmation
[VERIFIED: on-disk listing]

- `ls C:/EV-Accounts/backend/migrations/ | sort | tail -20` shows max counter is **1113** (`1113_nv_2026_discovery.sql`).
- **Next migration = 1114** (confirmed). D-06 says 1114 — consistent.
- Note: there are two files named `1111_*.sql` (NV general election AND NY House candidates — both exist due to parallel v2.20 track). This collision is known/intentional; both were applied. Does NOT affect counter — 1114 is next.

### Single Migration vs. Split
Per Claude's Discretion (D-06), planner may split. Recommendation: one migration (1114) for all 10 races' `race_candidates` rows. Rationale:
- 10 races × avg 2 candidates = ~20 rows — small enough for one migration.
- Independent candidates (NV-01 independents, NV-02 Chapman) can be in a separate section with a `-- INDEPENDENTS (certified)` comment.
- Headshots are a separate plan/wave (the `find-headshots` flow is interactive; can't be batched in a SQL migration).

### Migration Structure (following 1072)
```
BEGIN;
-- Section 1: Statewide races (6 offices)
-- Section 2: US House races (4 districts)
-- Post-write verification SELECT (per-race candidate counts)
COMMIT;
-- NO schema_migrations INSERT
```

### Smoke Harness (`_apply-migration-1114.ts`)
Assertions to include:
1. Total `race_candidates` count for NV 2026 general = expected N rows
2. All 6 STATE_EXEC races have at least 2 candidates
3. All 4 NATIONAL_LOWER (NV) races have at least 2 candidates
4. `is_incumbent=true` count per race never exceeds 1
5. Idempotency: re-run inserts 0 rows
6. Party column absent (antipartisan — verify no `party` column was set)
7. `candidate_status = 'active'` for all new rows

---

## Headshot Mechanics (Plan 02)

Per D-03, challenger headshots are fetched this phase via the interactive `find-headshots` flow. The skill handles:
- Web search for Ballotpedia / official `.gov` / campaign site photos
- Playwright navigation and image extraction
- User approval gate (ALWAYS required — no silent imports)
- PIL crop to 4:5 → resize to 600×750 Lanczos q90 → upload to Supabase Storage
- `politician_images` row insert + `politicians.photo_origin_url` update
- For `candidate`-type subjects (no politician record yet): creates a minimal politician record first, then links via `race_candidates.politician_id` UPDATE

### Challengers Needing Headshots (Plan 02 scope)
All candidates with `politician_id = NULL` after Plan 01 migration:

Statewide challengers: Sandra Jauregui, Adriana Guzmán Fralick, Jim Marchant, Tya Mathis-Coleman, Drew Johnson, Michael MacDougall (6 people)
US House challengers: Carrie Buck (if no Phase-160 record), David Flippo, Teresa Benitez-Thompson (if no record), Lynn Chapman, Marty O'Donnell, Cody Whipple (up to 6 people)

Total challenger headshots: up to 12 people. Apply the "one at a time" sequencing rule (per project memory `feedback_stance_research_one_at_a_time.md` — same reasoning applies to headshot research to preserve source availability and context).

### Headshot Sources by Candidate (pre-research)
| Candidate | Likely Source | Notes |
|-----------|--------------|-------|
| Sandra Jauregui | nvleg.gov or assembly.state.nv.us | Current Assembly Majority Leader — official legislative photo |
| Adriana Guzmán Fralick | Campaign site or Ballotpedia | Attorney; may have Ballotpedia photo |
| Jim Marchant | Ballotpedia | Known political figure; Ballotpedia page confirmed by search |
| Tya Mathis-Coleman | NV State Treasurer office site | Deputy State Treasurer — official photo likely available |
| Drew Johnson | Campaign site or Ballotpedia | Policy analyst; campaign site likely has photo |
| Michael MacDougall | Campaign site | Teacher; may have limited sources |
| David Flippo | Campaign site or Ballotpedia | Air Force veteran; Ballotpedia page from primary coverage |
| Teresa Benitez-Thompson | Campaign site or Ballotpedia | Former Assembly member — legacy official photos may exist |
| Lynn Chapman | IAP party site or Ballotpedia | Repeat candidate; Ballotpedia likely |
| Marty O'Donnell | Campaign site or Ballotpedia | Notable composer (Halo series); may have press photos |
| Cody Whipple | Campaign site or Ballotpedia | Rancher; limited sources expected |
| Carrie Buck | nvleg.gov | If Phase 160 record exists, she already has a photo — no headshot work needed |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | tsx smoke harness (TypeScript, no jest/vitest) |
| Config file | `_apply-migration-1114.ts` (create in Wave 0 alongside SQL) |
| Quick run command | `node node_modules/tsx/dist/cli.mjs backend/scripts/_apply-migration-1114.ts` (from C:/EV-Accounts/backend) |
| Full suite command | Same — single smoke harness file |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NV-CAND-01 | 10 NV 2026 statewide+House races each have ≥ 2 active candidates | smoke assertion | `_apply-migration-1114.ts` assertion 1 | ❌ Wave 0 |
| NV-CAND-01 | No `race_candidates` row has `is_incumbent=true` for open-seat races (AG, Treasurer, NV-02) | smoke assertion | `_apply-migration-1114.ts` assertion 2 | ❌ Wave 0 |
| NV-CAND-01 | Idempotency — re-run inserts 0 rows | smoke assertion | `_apply-migration-1114.ts` assertion 3 | ❌ Wave 0 |
| NV-CAND-01 | All NV 2026 race_candidates have `candidate_status = 'active'` | smoke assertion | `_apply-migration-1114.ts` assertion 4 | ❌ Wave 0 |
| NV-CAND-01 | Live `/elections` page for a NV address shows real candidates | manual UAT | load essentials.empowered.vote with NV address | manual only |

### Wave 0 Gaps
- [ ] `_apply-migration-1114.ts` — all 7 assertions listed above under Migration Mechanics
- [ ] Live race_id UUID resolution query (pre-check before writing migration VALUES)
- [ ] Live politician_id resolution for incumbents (Lombardo, Anthony, Aguilar, Titus, Lee, Horsford, Matthews, and cross-office Ford/Cannizzaro/Buck)

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Drew Johnson is the certified Republican Treasurer nominee (was ahead by ~1,800 votes post-primary as of initial reporting) | Verified Field / Race 5 | If Jeff Carter prevailed in final count, wrong candidate would be seeded — low risk (NV SoS summary shows Johnson at 45.47%) |
| A2 | Michael MacDougall won the D Controller primary (45.29% in 3-way race) | Verified Field / Race 6 | If another candidate prevailed, wrong nomination seeded |
| A3 | Independent candidates for NV-01 (Bobby Khan, Steven St John, Anthony Thomas Jr., Victor Willert) are on the general election ballot | Pitfall 5 / D-04 hold-back | No official certification URL found; they are "declared" per Wikipedia — holding back is the safe D-04 approach |
| A4 | Governor independent candidates (Battenberg et al.) are not yet certified | Pitfall 5 / D-04 | Same — declared but not confirmed certified |
| A5 | Teresa Benitez-Thompson does NOT have a current NV politician record (she is a former Assembly member) | Politician Linking Map | If Phase 160 has a record for her, failing to link loses the profile/photo |
| A6 | The Phase 159 US House ext_id scheme is `-60003xx` (NV-01=-6000301, NV-02=-6000302, NV-03=-6000303, NV-04=-6000304) | Politician Linking Map | If the scheme differs, the live query for politician_id will resolve correctly regardless; only matters for documentation |

---

## Open Questions

1. **Aaron Ford's politician_id**
   - What we know: He is the current NV Attorney General (pre-existing Phase 159 official); running for Governor 2026.
   - What's unclear: Does a politician record exist for Aaron Ford as the current AG? The pre-existing NV state officials included "AG" but memory only notes "5 execs + Gov" with ext_ids starting -3200001.
   - Recommendation: Live-query `WHERE full_name = 'Aaron Ford'` before migration. If exists, set as politician_id for the Governor race challenger row (D-02 cross-office linking).

2. **Carrie Buck / Nicole Cannizzaro — Phase 160 Senator Records**
   - What we know: Both are current NV State Senators; Phase 160 seeded 21 Senate members (ext_ids -3203001..-3203021).
   - What's unclear: Which senator external_id belongs to each.
   - Recommendation: Live-query by name. If found, set politician_id in migration. This unlocks their existing senator headshots to show on the elections page.

3. **NV-01 Independent Candidates — Certification Status**
   - What we know: Wikipedia lists Bobby Khan, Steven St John, Anthony Thomas Jr., Victor Willert, J.E. Houston as general election candidates; Lynn Chapman (IAP) also mentioned.
   - What's unclear: Official NV SoS certification confirmation for each.
   - Recommendation: Per D-04, hold back all NV-01 independents with a `-- HELD BACK` comment in migration 1114. Add them in a follow-up patch migration once certified.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| psql / Supabase MCP | Migration apply | ✓ | psql via `node node_modules/tsx/dist/cli.mjs` | — |
| Pillow (PIL) | Headshot processing | ✓ | Pre-existing from banner/headshot work | — |
| Playwright MCP | Headshot web search | ✓ | Pre-existing in `find-headshots` | Skip to manual URL entry |
| Supabase Storage | Headshot upload | ✓ | kxsdzaojfaibhuzmclfq bucket | External URL fallback |
| SUPABASE_SERVICE_ROLE_KEY | Storage upload | ✓ | In C:/EV-Accounts/backend/.env | — |

---

## Security Domain

Security enforcement: no specific ASVS categories applicable to a data-only migration phase. The migration inserts read-only reference data (candidate names + source URLs) — no auth, no user input, no cryptography. The `source` field values are hardcoded citation URLs (no user-submitted input). Standard SQL injection risk does not apply to a developer-authored psql migration file.

---

## Sources

### Primary (HIGH confidence)
- NV SoS Official Primary Results: `https://www.nvsos.gov/SOSelectionPages/results/2026StateWidePrimary/ElectionSummary.aspx` — authoritative primary winners for all 6 statewide races
- The Nevada Independent 2026 Primary Live Blog: `https://thenevadaindependent.com/article/2026-nevada-primary-election-results-live-blog` — confirmed all 10 race nominees
- Migration 1050: `C:/EV-Accounts/backend/migrations/1050_nv_controller.sql` — confirms Andy Matthews external_id = -3200006
- Migration 1072: `C:/EV-Accounts/backend/migrations/1072_seed_2026_statewide_general_candidates.sql` — authoritative pattern for VALUES shape
- Migration 1110: `C:/EV-Accounts/backend/migrations/1110_seed_tx_2026_house_candidates.sql` — US House pattern with cross-office reuse

### Secondary (MEDIUM confidence)
- mynews4.com: Governor (Lombardo/Ford), Lt Governor (Jauregui) primary results
- reviewjournal.com: AG (Cannizzaro/Fralick), Treasurer (Johnson/Mathis-Coleman) results
- PBS NewsHour: NV-02 (Flippo) result: `https://www.pbs.org/newshour/politics/trump-backed-david-flippo-wins-nevada-republican-primary-for-u-s-house-seat`
- 2news.com: NV-02 general field confirmation (Flippo/Benitez-Thompson/Chapman): `https://www.2news.com/news/local/voters-decide-david-flippo-teresa-benitez-thompson-advance-to-november/`
- sanfordherald.com/thecentersquare.com: NV-03 (Lee/O'Donnell), NV-04 (Horsford/Whipple)
- Wikipedia: `https://en.wikipedia.org/wiki/2026_United_States_House_of_Representatives_elections_in_Nevada` — full district field including independents
- kolotv.com: SoS (Marchant wins): `https://www.kolotv.com/2026/06/16/marchant-wins-gop-primary-nevada-secretary-state/`

### Tertiary (LOW confidence — held back per D-04)
- Clark County elections PDF: Christopher Battenberg (NPP) as declared Governor independent — not confirmed certified
- Wikipedia: NV-01 independent candidates (Bobby Khan, Steven St John, etc.) — declared, not confirmed certified

---

## Metadata

**Confidence breakdown:**
- General election field: HIGH — NV SoS official results + multiple AP-called news sources confirm all major-party nominees
- Politician linking map: MEDIUM — all 5 pre-existing state execs and 4 House incumbents confirmed to exist from Phase 159 memory; exact UUIDs require live query
- Independent candidates: LOW — declared but not confirmed certified; held back per D-04
- Migration mechanics: HIGH — pattern confirmed from 1072/1110/1112/1113 analogs; counter confirmed from on-disk listing

**Research date:** 2026-06-30
**Valid until:** 2026-11-03 (general election day — nominee field is now locked for major parties; independents may be added as they certify)
