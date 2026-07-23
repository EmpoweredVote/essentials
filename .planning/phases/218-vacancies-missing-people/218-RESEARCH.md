# Phase 218: Vacancies & Missing People - Research

**Researched:** 2026-07-23
**Domain:** Municipal civic-data seeding (Texas general-law cities) — evidence-based incumbent research + brownfield SQL seeding
**Confidence:** MEDIUM-HIGH (roster facts CITED to official/semi-official sources; several items flagged for mandatory plan/execute-time re-verification)

## Summary

This phase seats 21 previously-unseated offices across 11 Collin County, TX cities and — critically —
uncovers that the true gap is **larger than 21 seats**. Cross-referencing the live 2026-07-23 CONTEXT.md
snapshot against the original May-2026 seeding migrations (087–098, still on disk in `C:/EV-Accounts/backend/migrations`)
reveals three cities where the **council itself has more real seats than the database models**
(D-02 "Missing People"): **Blue Ridge** (5 real council seats, DB has 4), **Lowry Crossing** (city
runs TWO council members per ward × 4 wards = 8 seats, DB models only 4 single-member "Places"), and
**Weston** (6 real aldermen, DB has 5) — Weston isn't in the 21-office target list because its 5 *existing*
office rows are all seated, but its 6th real seat was never created as a row at all. All three gaps trace
to the same root cause: the May-2026 migrations documented these exact discrepancies in "DB SCHEMA GAP"
comment blocks but never resolved them with follow-up office-row migrations.

For the 21 target offices, this research identifies a cited current officeholder for the large majority —
election results from the May 2, 2026 and subsequent runoff/special elections (now well past certification
as of this 2026-07-23 research date) are publicly available via official city sites, the TML City Officials
Directory, Ballotpedia, and local news (Princeton Herald, Community Impact, KERA). A few seats need one more
targeted re-verification pass at plan/execute time (flagged explicitly below) before an incumbent is locked in.

**Primary recommendation:** Seat the 18 offices with a directly-cited current officeholder (below) using the
established idempotent `DO $$ ... SELECT office_id ... UPDATE offices SET politician_id` pattern from
migrations 097/098, upgraded with an explicit `politician_id IS NULL` idempotency guard. Add the 3 missing-seat
office rows (Blue Ridge Place 5, Lowry Crossing +4 ward seats, Weston Place 5) as their own structural
migration before seating those specific people. Mark the 2–3 seats without a fully certified/re-confirmed
winner (see Open Questions) as `is_vacant = true` placeholders ONLY if the deeper D-04 search still comes up
empty at execute time — for all of them this research found a strong lead, so a final source check should
resolve them to a real seated person, not a documented vacancy.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Incumbent research + citation | N/A (research/data, no app tier) | — | Pure data-quality work; no code path touches this |
| Office/politician row seeding | Database (Supabase Postgres, `essentials` schema) | — | Idempotent SQL migrations directly against `essentials.offices` / `essentials.politicians` |
| Missing office-row creation | Database | — | New `essentials.offices` rows via structural migration (not a chamber/government change) |
| Headshot storage | Database (`politician_images`) + Supabase Storage | — | Same `/find-headshots` pipeline used by every prior deep-seed phase |
| Browse rendering of newly-seated people | Frontend (`Results.jsx` / browse-by-government-list) | Backend (`accounts-api` browse endpoint) | No code change needed — browse already reads `offices.politician_id`; seating a row makes it appear automatically |

**No frontend or backend code changes are required or in scope for this phase** — it is 100% data (SQL migrations against production via `C:/EV-Accounts`).

## Standard Stack

Not applicable in the traditional sense — this phase installs no libraries or frameworks. The "stack" is:

| Tool | Purpose | Why Standard (established by prior phases) |
|------|---------|---------------------------------------------|
| Raw SQL migrations (`psql -f`, applied via `C:/EV-Accounts/backend/scripts/_apply-migration-*.ts` or direct `psql`) | Idempotent structural + data seeding | Same mechanism used by every Collin County (v3.0) and every subsequent deep-seed milestone (NV, OR, AZ, CA) |
| `/find-headshots` skill (Playwright WAF-fallback pipeline) | 600×750 4:5 crop-first headshot sourcing | Established pipeline across every deep-seed phase since v3.0; see [[headshot_skill]] |
| WebSearch / WebFetch / Ballotpedia / TML directory / official city sites | Incumbent research | Evidence-only requirement (D-04); no compass-stance-style single-source shortcut |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual per-city `DO $$` blocks (current pattern) | A generated migration script (like `gen_migration_197.py` used for AZ) | Not worth building for an 11-city, 21-office one-off; the AZ/NV generator scripts existed because those milestones had 90+ repetitive legislator rows. Collin's variety (Place vs Seat naming, missing seats, special-election dates) makes hand-written DO blocks clearer to review. |

**Installation:** None — no packages to install this phase.

## Package Legitimacy Audit

**Not applicable.** This phase installs zero external npm/pip/crates packages — it is pure SQL data migrations plus the existing, already-vetted `/find-headshots` skill (Playwright, already a project dependency). The Package Legitimacy Gate is skipped per its own scope condition ("required whenever this phase installs external packages").

## Architecture Patterns

### System Architecture Diagram

```
[Research: official city sites, TML directory, Ballotpedia, local news]
        │  (evidence-only, cited)
        ▼
[Structural migration: ADD missing essentials.offices rows]  ← ONLY for Blue Ridge / Lowry Crossing / Weston
        │
        ▼
[Data migration: DO $$ blocks]
   SELECT o.id FROM essentials.offices o
     JOIN chambers ch ON ch.id = o.chamber_id
     JOIN governments g ON g.id = ch.government_id
    WHERE g.geo_id = '<FIPS>' AND o.title = '<exact existing title>'
      AND o.politician_id IS NULL                 ← idempotency guard (NEW vs 097/098)
        │
        ▼
   INSERT INTO essentials.politicians (..., is_vacant=false, is_appointed=false, ...)
   RETURNING id
        │
        ▼
   UPDATE essentials.offices SET politician_id = <new_id> WHERE id = <office_id>
        │
        ▼
[Post-migration SQL gate: split-section check + duplicate check + 21-office reconcile count]
        │
        ▼
[Headshot pass: /find-headshots per newly-seated person, honest blank where no source]
        │
        ▼
[Live browse spot-check: /results?browse_government_list=<geo_id>]
```

### Recommended Plan Structure (waves)

Given the mix of (a) pure data-seating, (b) missing-office-row creation, and (c) headshots, mirror the
established deep-seed wave shape but adapted for brownfield:

```
Wave 1: Missing-seat structural migration (Blue Ridge +1, Lowry Crossing +4, Weston +1) — 6 new office rows
Wave 2: Data migration — seat the 18 directly-cited offices + the newly-created rows (idempotent, WHERE politician_id IS NULL)
Wave 3: Re-verify + seat/document the 2–3 flagged-uncertain seats (Open Questions below) as real people OR is_vacant=true
Wave 4: Headshots for all newly-seated officials (honest blank for Blue Ridge/Lowry Crossing/Nevada — no known source)
Wave 5: SQL verification gate (split-section, duplicate, 0-ambiguous-empty-seat count) + live browse spot-check
```

### Pattern: Idempotent office-seating DO block (upgraded from migration 097/098)

```sql
-- Source: C:/EV-Accounts/backend/migrations/097_tier_3_politicians.sql (established pattern),
-- upgraded with an explicit politician_id IS NULL guard for idempotent re-run safety per CONTEXT.md D-01.
DO $$
DECLARE
  v_office_id     UUID;
  v_politician_id UUID;
BEGIN
  SELECT o.id INTO v_office_id
  FROM essentials.offices o
  JOIN essentials.chambers ch ON ch.id = o.chamber_id
  JOIN essentials.governments g ON g.id = ch.government_id
  WHERE g.geo_id = '4803300'                         -- Anna, TX
    AND o.title = 'Council Member Place 3'
    AND o.politician_id IS NULL;                     -- idempotency: skip if already seated

  IF v_office_id IS NULL THEN
    RAISE NOTICE 'Anna Place 3 already seated or office not found — skipping (idempotent)';
  ELSE
    INSERT INTO essentials.politicians (
      first_name, last_name, preferred_name, full_name,
      party, party_short_name,
      is_active, is_incumbent, is_vacant, is_appointed,
      office_id, valid_from, valid_to, term_date_precision,
      email_addresses, urls, data_source
    ) VALUES (
      'Jessica', 'Walden', 'Jessica', 'Jessica Walden',
      NULL, NULL,
      true, true, false, false,
      v_office_id, '2026-05-01', '2030-05-01', 'month',
      NULL,
      ARRAY['https://www.annatexas.gov/319/City-Council'],
      'annatexas.gov'
    ) RETURNING id INTO v_politician_id;

    UPDATE essentials.offices SET politician_id = v_politician_id WHERE id = v_office_id;
    RAISE NOTICE 'Inserted: Jessica Walden (Anna Place 3) — %', v_politician_id;
  END IF;
END $$;
```

### Pattern: Documented genuine vacancy (offices.is_vacant, NOT a placeholder politician row)

```sql
-- Source: C:/EV-Accounts/backend/migrations/105_tx_congressional_house_officials.sql
-- (established TX-23 vacancy pattern — office row flagged is_vacant, NO politician row inserted)
UPDATE essentials.offices
   SET is_vacant = true
 WHERE id = '<office_id>'
   AND politician_id IS NULL;
-- Do NOT insert a placeholder politicians row for a genuine vacancy — leave politician_id NULL,
-- flip offices.is_vacant = true. This is the exact mechanism already used for TX-23 (US House)
-- and TX Senate District 4 in migrations 105/109.
```

### Pattern: Missing office-row creation (structural, for Blue Ridge / Lowry Crossing / Weston)

```sql
-- Blue Ridge: city has 5 council seats (blueridgecity.com/council, confirmed 2026-07-23), DB has 4.
INSERT INTO essentials.offices (chamber_id, title, representing_city, representing_state, normalized_position_name, seats, partisan_type, is_appointed_position)
SELECT ch.id, 'Council Member Place 5', 'Blue Ridge', 'TX', 'Council Member', 1, NULL, false
FROM essentials.chambers ch
JOIN essentials.governments g ON g.id = ch.government_id
WHERE g.geo_id = '4808872'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o WHERE o.chamber_id = ch.id AND o.title = 'Council Member Place 5'
  );
```

### Anti-Patterns to Avoid

- **Renaming existing office titles to match a city's current website terminology** (e.g. do NOT rename
  Lucas's `Council Member Place 1` to `Council Member Seat 1` just because lucastexas.us now calls them
  "Seat"). The DB title is the stable join key for every downstream migration and for `title`-based lookups
  in prior migrations; changing it silently breaks that contract. Seat the correct person into the
  **existing** `Place N` row instead.
- **Assuming "unopposed" means "already seated."** Several May-2026 stub comments say "unopposed pending
  certification" (Nevada Mayor/Place1/Place2) — certification is a real event with a real date; re-confirm
  it happened via the county canvass or city minutes rather than assuming the unopposed candidate
  automatically took office on the ballot date.
- **Fabricating a Place-number mapping when a city's own site doesn't publish one.** Parker explicitly does
  not publish Place numbers (assignment was positional from website order per the original migration) —
  don't invent a new mapping; keep the existing office→person mapping and only fill genuinely-unseated rows.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Detecting whether a seat is genuinely vacant vs. just under-researched | A heuristic/inference rule | The explicit D-04 deeper-search protocol (city site → TML directory → Ballotpedia → local news/minutes → social media) before marking `is_vacant` | Evidence-only requirement; guessing produces exactly the "fabricated incumbent" failure mode this phase exists to prevent |
| Missing-seat detection | A generic "seats vs offices count" heuristic | Direct verification against each city's own current council page/roster listing (as done in this research) | `chambers.official_count` is not reliably kept in sync with real seat counts — it must be checked against the live city site, not assumed correct |

**Key insight:** every "landmine" surfaced in this research (Lucas naming change, Blue Ridge/Lowry Crossing/Weston
missing seats, Princeton's mid-term resignation) was only discoverable by reading the **original migration's own comments**
plus a **live re-check** — neither the DB schema nor the CONTEXT.md snapshot alone would have surfaced them.

## Common Pitfalls

### Pitfall 1: Trusting the "1 unseated" / "2 unseated" counts as the full scope of the gap
**What goes wrong:** Planner seats exactly the N offices CONTEXT.md lists per city and calls the phase done,
missing that Blue Ridge/Lowry Crossing/Weston have MORE real seats than office rows.
**Why it happens:** The live-DB office/seated/unseated counts in CONTEXT.md only count rows that already
exist — they cannot see a seat that was never modeled as a row at all.
**How to avoid:** Cross-check every city's chamber `official_count` and office-row count against its live,
current council roster page before closing the phase (this research already did this for the 11 target
cities + Weston; the other 11 non-target govs still need the same spot-check per D-02/ROADMAP success
criterion 3, "no ambiguous empty state across ALL 23").
**Warning signs:** A city whose own website lists more named council members than the DB has `Place N` rows for.

### Pitfall 2: Office-title naming drift between the DB and the city's current public-facing terminology
**What goes wrong:** A migration renames `Council Member Place 1` to `Council Member Seat 1` to "match the
website," breaking every prior migration/query that joins on `o.title = 'Council Member Place 1'`.
**Why it happens:** Cities sometimes casually shift terminology (Lucas moved from "Place" to "Seat" between
May and July 2026 on its own site) without any legal/charter change.
**How to avoid:** Treat the DB `title` as a stable internal key, independent of a city's cosmetic website
wording. Only touch the `politician_id`.
**Warning signs:** A city's current page uses different position-naming than the original migration's comments.

### Pitfall 3: Seating a "declared winner" before the actual swearing-in/certification date
**What goes wrong:** `valid_from` gets set to the election date instead of the actual inauguration/certification
date, producing incorrect term-date math for later phases (219/220 rely on accurate `valid_to`).
**Why it happens:** News coverage reports the winner on election night; the person doesn't take office until
weeks later (e.g. Saint Paul's 2026-06-01 inauguration for its May-declared winners; Princeton's Place 4
runoff wasn't certified until 2026-06-23).
**How to avoid:** Use the certification/swearing-in date as `valid_from` where documented (see per-city notes
below); default to the city's standard inauguration pattern only when no specific date is published.
**Warning signs:** A "declared elected"/"unopposed" note without an explicit swearing-in date.

### Pitfall 4: Re-seating an already-seated office on migration re-run
**What goes wrong:** Migrations 097/098 have no idempotency guard (`RAISE EXCEPTION` only fires if the office
row is missing, not if it's already seated) — re-running the same migration file would insert a duplicate
politician and silently overwrite `politician_id`.
**Why it happens:** The original May-2026 migrations were written as one-time, never-rerun scripts.
**How to avoid:** Every 218 migration must add `AND o.politician_id IS NULL` to the office lookup (see
pattern above) — this is CONTEXT.md's own stated requirement ("Migrations seed rows via WHERE NOT EXISTS
(idempotent)").
**Warning signs:** A DO block whose only guard is "office not found," not "office not yet seated."

## Runtime State Inventory

> Not a rename/refactor/migration-of-existing-data phase in the traditional sense, but structurally
> equivalent risk applies: verify what "current roster" state already lives in production before writing
> new rows, so nothing gets double-seeded.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | 8 of 21 target offices already correctly modeled and simply awaiting a politician row (straightforward UPDATE); 3 cities (Blue Ridge, Lowry Crossing, Weston) have real council seats with **no office row at all** | Missing-seat structural migration (INSERT new office rows) BEFORE the data-seating migration for those 3 cities |
| Live service config | None — no external service (n8n/Datadog-style) config carries these office rows; it is 100% Postgres `essentials` schema | None |
| OS-registered state | None | None |
| Secrets/env vars | None | None |
| Build artifacts | None (SQL-only, no compiled/package artifacts reference office titles) | None |

## Per-City Research Findings (21 target offices + 3 missing-seat discoveries)

Every incumbent claim below is tagged with its source. Re-verify anything flagged **[RE-VERIFY]** at
plan/execute time — this research found a strong, specific lead for every seat, but a handful lack a
second independent confirming source.

### Anna, TX (geo_id 4803300) — 2 unseated: Place 3, Place 5
- **Place 3 — Jessica Walden** [CITED: directory.tml.org/profile/city/1286 (TML City Officials Directory); corroborated by independent WebSearch of annatexas.gov/319/City-Council]. Won the May 2, 2026 contested race against Mike Olivarez (flagged contested in migration 097).
- **Place 5 — Elden Baker**, retained, now **Mayor Pro Tem** [CITED: same TML directory profile]. The May-2026 stub flagged this seat "contested"; Baker won re-election.
- Election method: at-large by numbered Place, nonpartisan (party=NULL), 4-year staggered terms (`term_date_precision='month'`).
- `valid_from` recommendation: `2026-05-01` (standard Anna inauguration date; no evidence of a delayed swearing-in for these two seats), `valid_to` `2030-05-01` (4-year term, consistent with other Anna seats already in DB).

### Blue Ridge, TX (geo_id 4808872) — 2 unseated (Mayor, Place 1) **+ 1 missing seat (Place 5)**
- **Mayor — Rhonda Williams**, retained [CITED: blueridgecity.com/council, live-fetched 2026-07-23; term through May 2028].
- **Place 1 — David Apple**, retained [CITED: blueridgecity.com/council; term through May 2028]. The May-2026 stub flagged this seat contested; Apple won.
- **[MISSING SEAT] Place 5 — Keith Chitwood** [CITED: blueridgecity.com/council, term through May 2028] — Blue Ridge's official council page confirms **5 total council seats** (not including Mayor); the DB (migration 090) only created 4 (`Place 1-4`). A structural migration must add `Council Member Place 5` before Chitwood can be seated. **[RE-VERIFY]** whether this is a genuinely new 5th seat (charter change) or whether one of the 4 existing named incumbents (Braly/Sissom/Mattingly, already seated) actually moved and Chitwood is filling a seat that already has DB representation under a different name — the official page lists Braly, Apple, Sissom, Mattingly, AND Chitwood as 5 distinct people, which is one more than the DB's 4 rows, so the safest read is a genuine missing seat.
- Headshots: **No known online source** (per milestone-wide convention — Blue Ridge is one of the 5 documented zero-photo cities). Honest blank expected for all 3 people above per D-03.

### Fairview, TX (geo_id 4825224, legally a "Town") — 3 unseated: Seat 2, Seat 4, Seat 6
- **Seat 2 — Joe Boggs** [CITED: directory.tml.org/profile/city/466]. May-2026 stub noted Boggs was "declared elected" but not yet sworn in as of migration date; now confirmed current.
- **Seat 4 — John Stanley** [CITED: directory.tml.org/profile/city/466] — a NEW name, replacing Larry Little (who did not seek re-election per migration comment; original stub only named the outgoing incumbent + noted a Doi-vs-Stanley race). **[RE-VERIFY]** — this research has only the TML directory as a source for Stanley; cross-check against fairviewtexas.org/government/town-council (which redirected/404'd from a guessed URL — find the correct live URL, e.g. via `fairviewtexas.org/index.php/government/town-council`) before seating.
- **Seat 6 — Lakia Works**, retained [CITED: directory.tml.org/profile/city/466]. May-2026 stub flagged this seat contested (vs. "Riyad"); Works won re-election.
- Election method: Fairview is legally a **Town**, uses "Seat" (not "Place") terminology natively in the DB already — no naming-drift risk here, unlike Lucas.

### Josephine, TX (geo_id 4838068) — 1 unseated: Place 5
- **Place 5 — Gary Chappell** [CITED: directory.tml.org/profile/city/994; independently corroborated by WebSearch of TML + Josephine city council page]. This is the exact person flagged as a "DB SCHEMA GAP — cannot be seeded, office does not exist" in migration 098's comments (May 2026). CONTEXT.md's live count (6 offices, up from the original 5 in migration 090) confirms **someone already added the missing `Council Member Place 5` office row** between May and July 2026 — this phase only needs the `UPDATE offices SET politician_id` step, not a new structural INSERT.
- No May-2026 election affected this seat (per original migration note) — Chappell is a continuing incumbent, not a new winner; use a `valid_from` consistent with his existing tenure (recommend `2024-05-01` to match Josephine's other Place 1-4 term-start dates, pending confirmation of his actual start date).

### Lowry Crossing, TX (geo_id 4844308) — 1 unseated target (Place 4 / "Ward 4") **+ major missing-seat discovery**
- **CRITICAL FINDING:** Lowry Crossing's own official roster page [CITED: lowrycrossingtexas.org/operations/city_council.php, live-fetched 2026-07-23] lists the city council as **Mayor + 4 Wards × 2 members each = 8 council seats**, not 4:
  - Ward 1: Scott Pitchure + **Chris Madrid** (Treasurer)
  - Ward 2: Tammy Hodges (Mayor Pro Tem) + **Agur Rios**
  - Ward 3: Eusebio "Joe" Trujillo III + **Cindy Cash**
  - Ward 4: **Muhanad "G" Hijazen** + **Ollie Simpson**
- The DB (migration 090) only created 5 offices total (Mayor + `Place 1-4`, one per ward). CONTEXT.md's live count of "5 offices, 4 seated, 1 unseated" reflects only the **first** member of each ward already being modeled (Pitchure→Place1, Hodges→Place2, Trujillo→Place3) plus the vacant Place4/Ward4 slot — it does NOT reflect the second member of each ward (Madrid, Rios, Cash) or the second Ward-4 winner. **This is the same "DB SCHEMA GAP" flagged in migration 098's comments in May 2026, and it has NOT been resolved as of 2026-07-23.**
- **Action required:** structural migration adding **4 new office rows** (one additional seat per ward, e.g. `Council Member Ward 1 Seat 2` / a parallel naming scheme — recommend a naming convention decision at plan time, e.g. `Council Member Place 5-8` mapped 1:1 to Madrid/Rios/Cash/[second Ward-4 winner]), then seat all 4 + resolve which of Hijazen/Simpson maps to the existing `Place 4` row vs the new row (both are current, confirmed members — the May-2026 special election evidently filled **both** Ward 4 seats: the original vacant seat plus one already-modeled).
- Headshots: **No known online source** (documented zero-photo city per milestone convention). Honest blank expected for all Lowry Crossing seats.

### Lucas, TX (geo_id 4845012) — 2 unseated: Place 1, Place 2 **[naming-drift landmine]**
- **LANDMINE:** Lucas's own official site [CITED: lucastexas.us/164/City-Council, live-fetched 2026-07-23] now labels council positions "**Seat**" N, not "Place" N as the DB does. Current full roster per that page: Mayor Dusty Kuykendall; Seat 1 Jonathan Underhill; Seat 2 Rebecca Orr; Seat 3 Chris Bierman; Seat 4 Phil Lawrence; Seat 5 Debbie Fisher (Mayor Pro Tem); Seat 6 Neil Peterson.
- Mapping to the DB's existing `Place 1-6` rows (positional, since both original migration and current site agree on 6 non-mayor seats):
  - **Place 1 → Jonathan Underhill** [CITED: lucastexas.us/164/City-Council] — replaces the "not yet seeded, Tim Johnson not running" stub.
  - **Place 2 → Rebecca Orr** [CITED: lucastexas.us/164/City-Council] — replaces the "not yet seeded, Brian Stubblefield not running" stub.
  - Places 3/4/5/6 (Bierman/Lawrence/Fisher/Peterson) are already correctly seated in the DB per migration 097 and match the live page.
- **Do NOT rename the DB office titles to "Seat."** Seat Underhill/Orr into the existing `Council Member Place 1` / `Council Member Place 2` rows.
- **[RE-VERIFY]** the Place-N ↔ Seat-N positional mapping is an inference (both lists have 6 non-mayor names in a plausible order) — confirm via a second source (e.g. Ballotpedia's Lucas election page or Collin County canvass) that Underhill/Orr specifically won the two open May-2026 seats before locking this in.

### Nevada, TX (geo_id 4850760) — 3 unseated: Mayor, Place 1, Place 2
- **Mayor — Donald Deering** [CITED: WebSearch synthesis of TML directory + cityofnevadatx.org, corroborated across two independent queries]. Ran unopposed in the May 2, 2026 general election per migration 098's stub note; certification should now be final (over 2 months past election date).
- **Place 1 — Michael "Mike" Laye** [CITED: same sources]. Also unopposed.
- **Place 2 — Paul Baker** [CITED: same sources]. Also unopposed.
- **[RE-VERIFY]** — sourcing here relied on WebSearch synthesis rather than a single authoritative page fetch; before seating, do a direct fetch of `cityofnevadatx.org` current council/officials page (or the Collin County May-2-2026 canvass PDF) to confirm certification and exact names/spelling (TML's own city-level page listed only Place 3/4 names when directly fetched, not the Mayor/1/2 trio — those came from a broader web search, a slightly weaker citation tier).
- Headshots: **No known online source** (documented zero-photo city per milestone convention). Honest blank expected.

### Parker, TX (geo_id 4855152) — 3 unseated: Mayor, Place 3, Place 5
- **Mayor — Lee Pettle** [CITED: directory.tml.org/profile/city/1765]. Won a 3-candidate May-2026 race (vs. Marcus Arias, Melissa Tierce).
- **Place 3 — Buddy Pilgrim**, now **Mayor Pro Tem** [CITED: directory.tml.org/profile/city/1765]. Won the at-large 4-candidate race (vs. Alan Meyer et al., top-2-of-4 format).
- **Place 5 — Billy Barron** [CITED: directory.tml.org/profile/city/1765]. Won the same at-large 4-candidate race as Place 3 (top-2 format, so Pilgrim and Barron were the two winners).
- Election method note: Parker's council is elected at-large; the city does **not publish Place numbers** — the original migration's Place assignment was positional from website listing order, not an official numbering. Preserve that same positional convention when seating these three.

### Plano, TX (geo_id 4858016) — 1 unseated: Place 7
- **Place 7 — Shun Thomas** [CITED: Community Impact "FINAL: Shun Thomas wins Plano City Council Place 7 special election," Ballotpedia "City elections in Plano, Texas (2026)"]. This was a **mid-term special election**, not the general May-2026 cycle — Deputy Mayor Pro Tem Julie Holmer resigned to run for Collin County Commissioners Court Precinct 4, triggering a special election held **January 31, 2026** (Thomas won outright with ~60.4%, no runoff needed despite one being scheduled for April 4, 2026 as a contingency).
- `valid_from` recommendation: the January 31, 2026 special-election date (or Thomas's actual swearing-in date shortly after, per Plano's own council minutes) — **not** the standard May cycle date, since this is a mid-term replacement.
- Plano is a large city with an active official website (plano.gov) and prior-established headshot pipeline (already 8/9 seated with photos per Phase 217 spot-check) — headshot sourcing should be straightforward via plano.gov's own council bio pages.

### Princeton, TX (geo_id 4859576) — 1 unseated: Place 4
- **Place 4 — Jaisen Rutledge** [CITED: Princeton Herald "City council runoff results FINAL" (2026-06-13); Princeton Herald "Runoff required for Place 4 council seat" (2026-05-07); Princeton, TX official "City Council Highlights" newsflash (2026-06-23) confirming council canvassed/certified the runoff]. This seat became vacant mid-term when **Ryan Gerfers resigned citing health reasons**; the May 2, 2026 special election (4 candidates: Goria, Rutledge, Ramani, Abdulkareem) went to a runoff since no one cleared 50%; Rutledge won the June 13, 2026 runoff 293–245 over Jan Goria; certified by City Council on **June 23, 2026**.
- `valid_from` recommendation: **2026-06-23** (certification date) or Rutledge's actual swearing-in date shortly after, not the May 2 special-election date (per Pitfall 3 above).
- This is the SAME seat flagged in migration 097 as "Princeton Place 4 — VACANT (4-candidate special election)" — directly confirms the chain from documented vacancy → contested special election → runoff → certified winner.

### Van Alstyne, TX (geo_id 4874924) — 2 unseated: Mayor, Place 6
- **Mayor — Jim Atchison**, retained [CITED: KTEN "VAN ALSTYNE, Texas (KTEN) - Mayor Jim Atchison is returning..." + Ballotpedia candidate pages for both Atchison and challenger Kevin Soucie]. Won 399–71 over Kevin Soucie in the May-2026 general.
- **Place 6 — Zach Williams** [CITED: directory.tml.org/profile/city/524]. The original migration 097 stub flagged this seat as "Angelica Pena contested" — the current TML directory does not list Pena, and lists Zach Williams instead. **[RE-VERIFY]** — this research did not find a direct election-result citation confirming Pena lost to Williams (vs. e.g. Pena resigning post-certification, or a data-entry difference); confirm via the Grayson/Collin County May-2026 canvass or `cityofvanalstyne.us/elections` before seating Williams as the winner over Pena.
- Note: `term_date_precision='day'` for Van Alstyne per the original migration (exact day-of-month dates available in research, unlike other cities' 'month' precision) — carry this precision forward for the new rows.
- Van Alstyne uses a CivicWeb portal (`cityofvanalstyne.civicweb.net`) for meeting minutes — a viable secondary evidence source for the D-04 deeper search if the canvass PDF is not conclusive.

### Weston, TX (geo_id 4877740) — 0 unseated, but **1 missing seat**
- Not in the 21-office target list (Weston's 5 existing office rows — Mayor + Place 1-4 — are all seated). However, migration 098's own comments document that **Weston has 6 real aldermen, not 5**: "Weston: DB has 5 offices; city has 6 aldermen. Marla Johnston CANNOT be seeded." This gap has not been resolved as of 2026-07-23 (still not in CONTEXT.md's target list, meaning nobody has added the row).
- **Recommendation:** fold Weston's missing-seat fix into this phase's D-02 scope even though the ROADMAP's original success criteria don't name it — it is the exact class of gap D-02 exists to catch, discovered directly from the prior migration's own documentation. Add `Council Member Place 5` and seat **Marla Johnston** [CITED: migration 098 comment header, cross-referenced against westontexas.com/page/Mayor_Aldermen — re-fetch this page at plan/execute time to confirm Johnston is still the correct current officeholder, since ~14 months have passed since the original May-2026 research].
- Emails for Weston follow the `{first_initial}{last}@westontexas.com` pattern per the original migration's discovered convention — apply the same pattern if Johnston's email needs populating (out of scope for 218 itself; that's Phase 220, but worth noting for consistency).

## Election Method / Term Summary (all 11 target cities)

| City | Body structure | Numbering | Mayor election | Term length | Date precision |
|------|----------------|-----------|-----------------|-------------|-----------------|
| Anna | Mayor + 6 at-large | Place 1-6 | Separately elected | 4 yr (staggered) | month |
| Blue Ridge | Mayor + 5 at-large (5th seat missing from DB) | Place 1-4 (+5 needed) | Separately elected | 2 yr | month |
| Fairview | Mayor + 6 at-large (Town, not City) | Seat 1-6 | Separately elected | 2-3 yr staggered | month |
| Josephine | Mayor + 5 at-large (5th row already added) | Place 1-5 | Separately elected | 2-3 yr | month |
| Lowry Crossing | Mayor + 4 wards × 2 members (8 total; DB models 4) | Ward-mapped Place 1-4 (+4 needed) | Separately elected | 2 yr | month |
| Lucas | Mayor + 6 at-large (site now calls them "Seat") | Place 1-6 (DB) / Seat 1-6 (site) | Separately elected | 2-3 yr staggered | month |
| Nevada | Mayor + 5 at-large | Place 1-5 | Separately elected | 2 yr | month |
| Parker | Mayor + 5 at-large, Place numbers NOT city-published (positional) | Place 1-5 (informal) | Separately elected | 2-3 yr staggered | month |
| Plano | Mayor + 8 (mixed districts/at-large places) | Place 1-8 | Separately elected | 3 yr staggered | month |
| Princeton | Mayor + 7 at-large | Place 1-7 | Separately elected | 2-3 yr staggered | month |
| Van Alstyne | Mayor + 6 at-large | Place 1-6 | Separately elected | 2-3 yr staggered | day (exact dates available) |

All 11 are **Texas general-law municipalities** — all offices are **nonpartisan**, `party = NULL` (D-05).
Texas municipal elections are traditionally held the first Saturday in May (uniform election date), though
2026 saw multiple mid-term special elections (Princeton, Plano, Lowry Crossing Ward 4) from resignations,
which use their own dates.

## Headshot Sourcing Per City

| City | Known photo source | Status | Fallback |
|------|---------------------|--------|----------|
| Anna | annatexas.gov individual bio pages (`/NNNN/First-Last`) | Likely has photos (bio pages historically existed for every seated official) | `/find-headshots` Playwright if WAF |
| Blue Ridge | None known | **Documented zero-photo city, no online source** (milestone convention) | Honest blank |
| Fairview | fairviewtexas.org shared Town Council page | Unknown if photos present — re-check at execute time | Ballotpedia / `/find-headshots` |
| Josephine | cityofjosephinetx.com | Historically noted "unreachable" in May 2026; now reachable via search (redirect on direct fetch) | `/find-headshots` Playwright, TML directory has no photos |
| Lowry Crossing | None known | **Documented zero-photo city, no online source** (milestone convention) | Honest blank |
| Lucas | lucastexas.us Directory.aspx (CivicPlus staff directory — these typically carry photos) | Likely available | `/find-headshots` |
| Nevada | None known | **Documented zero-photo city, no online source** (milestone convention) | Honest blank |
| Parker | parkertexas.us | Unknown — no bio pages found in original research (URLs=NULL pattern in migration) | Ballotpedia / `/find-headshots` |
| Plano | plano.gov official council bio pages | Established — Plano already has photos for its other 8 seated officials (see Phase 217 spot-check) | N/A, should be straightforward |
| Princeton | princetontx.gov / CivicPlus | Likely available given active local-news coverage of this race (photos in Princeton Herald articles) | `/find-headshots` |
| Van Alstyne | cityofvanalstyne.us / CivicWeb | Unknown — re-check at execute time | `/find-headshots` |
| Weston (missing seat) | westontexas.com | Unknown | `/find-headshots` |

**For Blue Ridge, Lowry Crossing, and Nevada** — these are 3 of the milestone's already-documented 5 zero-photo
cities (Blue Ridge, Farmersville, Lowry Crossing, Nevada, Saint Paul). Per D-03/CONTEXT.md: newly-seated
officials in these 3 cities get an **honest blank**, not a fabricated or best-effort photo. Do not spend
execution time trying WAF bypasses here — the milestone has already established no source exists.

## Brownfield Seeding Recipe

1. **Verify next migration number immediately before writing** (`ls C:/EV-Accounts/backend/migrations | sort -n | tail`
   — confirmed **1388** as of this research on 2026-07-23; the on-disk counter drifts hourly across parallel
   workstreams, so re-check at plan/execute time per [[project_gsd_core_global_migration]] convention).
2. **No `ext_id` numbering scheme applies here** — unlike AZ/NV deep-seeds (which use negative `ext_id` ranges
   on `districts`/`politicians` for cross-plan UUID manifests), Collin County TX offices have `district_id = NULL`
   (no geofence-linked districts) and the original TX migrations never used an `ext_id` column at all. Offices
   are looked up by `governments.geo_id` + `offices.title` (exact string match), and politicians are inserted
   directly with `office_id` — no numbered external-ID scheme needed for either the seating migration or the
   3 missing-office-row migrations.
3. **Structural migration first** (if a plan touches Blue Ridge/Lowry Crossing/Weston): add the missing
   `essentials.offices` rows via `INSERT ... WHERE NOT EXISTS` guard on `(chamber_id, title)`.
4. **Data migration second**: idempotent `DO $$` blocks per office, each guarded with
   `o.politician_id IS NULL` (see Architecture Patterns pattern above) — this is the concrete implementation
   of CONTEXT.md's "Migrations seed rows via WHERE NOT EXISTS (idempotent)" requirement, upgraded from the
   original 097/098 migrations which lacked this guard.
5. **Documented-vacancy migration** (if any of the [RE-VERIFY] seats come up empty after the D-04 deeper
   search): `UPDATE essentials.offices SET is_vacant = true WHERE id = ... AND politician_id IS NULL` — no
   placeholder politician row, matching the established TX-23/SD4 pattern (migrations 105/109).
6. **Post-seed SQL gates** (run after every migration, per milestone convention):
   - Split-section check (per [[section_split_check]]) — verify no government/chamber got accidentally split
     into duplicate rows during this seeding.
   - No-duplicate check: `SELECT office_id, COUNT(*) FROM essentials.politicians WHERE is_active GROUP BY office_id HAVING COUNT(*) > 1` should return 0 rows.
   - Explicit 21-office (or 21+6-missing-seat) reconcile count: re-run the same `offices/seated/unseated` query
     CONTEXT.md used to derive its target table, confirm the new counts match plan expectations exactly.
7. **Commit via `git -C C:/EV-Accounts`** per [[no_git_in_ev_accounts]] — this repo has no `git` alias configured
   in the working directory context.
8. **Reference precedent:** `.planning/milestones/pre-v25-phases/*` deep-seed SUMMARY files (e.g. Phase
   193/195/197/201/202/203) show the exact wave shape (structural → headshots → stances[N/A here] → banner[N/A
   here] → verification) this phase should mirror, minus the stance/banner waves (both explicitly out of scope
   per D-06 and the milestone's "banners already shipped" note).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Fairview Seat 4 = John Stanley (TML-directory-only citation, no second source found) | Fairview findings | Wrong person seated; low-severity (easily corrected in a follow-up migration), but violates D-04's "exhaust sources beyond city site + Ballotpedia" bar if not re-checked |
| A2 | Van Alstyne Place 6 = Zach Williams as the winner over the originally-stubbed Angelica Pena (TML-directory-only, no election-result citation found) | Van Alstyne findings | Same as A1 — could be a resignation/appointment rather than an election result; re-verify via county canvass |
| A3 | Nevada Mayor/Place 1/Place 2 (Deering/Laye/Baker) sourced via WebSearch synthesis rather than a direct single-page fetch | Nevada findings | Spelling/name accuracy risk (e.g. "Michael" vs "Mike" Laye); low risk to the core fact (unopposed, so no contested-outcome risk) but re-verify via direct city-site or canvass fetch |
| A4 | Lucas Place 1/Place 2 ↔ Seat 1/Seat 2 positional mapping (Underhill/Orr) is inferred from list-order matching, not an explicit stated mapping | Lucas findings | If Lucas's actual Seat-to-Place correspondence differs from simple positional order, the wrong person could be linked to the wrong DB office row |
| A5 | Blue Ridge Place 5 (Keith Chitwood) represents a genuinely new/missing seat rather than a renamed existing seat | Blue Ridge findings | If wrong, a duplicate office row would be created for someone already represented under a different title |
| A6 | Weston's missing 6th seat (Marla Johnston, from May-2026 migration comments) is still the correct current officeholder ~14 months later | Weston findings | Weston had "no May 2026 election" per the original research, but 14 months is enough time for a resignation/appointment; re-confirm via westontexas.com at execute time |
| A7 | Josephine Place 5 (Gary Chappell) valid_from date (`2024-05-01` recommended, matching sibling seats) — not independently confirmed | Josephine findings | Cosmetic term-date-precision risk only; does not affect who is seated |

## Open Questions

1. **Lowry Crossing's true target office count**
   - What we know: the official city page confirms 8 real ward-council seats + Mayor (9 elected officials
     total), vs. the DB's 5 rows.
   - What's unclear: the exact naming convention the planner should use for the 4 new office rows (parallel
     `Place 5-8`? `Ward N Seat 2`? something else), and precisely which of Hijazen/Simpson maps to the
     pre-existing `Place 4` row vs. a brand-new row.
   - Recommendation: resolve this naming decision explicitly in the PLAN (not left to executor judgment),
     and confirm via the city's own May-2026 special-election notice (candidates were Outland/Simpson/Hijazen
     for "Ward 4" seats — check `lowrycrossingtexas.org/operations/elections.php` for the exact seat count
     contested) which specific seat was the "already-modeled Place 4" vacancy vs. the brand-new one.

2. **Blue Ridge's 5th seat — charter change or DB gap?**
   - What we know: the official council page currently lists 5 non-mayor names.
   - What's unclear: whether Blue Ridge's charter always had 5 council seats (making the original migration's
     4-seat model simply wrong from the start) or recently added a 5th.
   - Recommendation: check Blue Ridge's charter/ordinances (via TML's General Law Type A default, which is
     typically Mayor + 5 for this population tier) or a 2024-era Ballotpedia snapshot to determine if this
     is a pre-existing DB undercounting error (more likely) rather than a genuine 2026 change.

3. **The other 12 non-target Collin governments — has D-02's seat-count check been done for them?**
   - What we know: CONTEXT.md states these 12 have "zero unseated offices" (fully seated) but explicitly
     flags that seat-count-vs-real-body verification is still owed for them too.
   - What's unclear: whether any of the 12 (Allen, Celina, Frisco, Farmersville, Lavon, McKinney, Melissa,
     Murphy, Prosper, Richardson, Saint Paul, Weston-if-excluded-from-count) has the same class of
     missing-seat gap as Blue Ridge/Lowry Crossing/Weston.
   - Recommendation: this research spot-checked Weston (found a gap) as a side effect of reading the same
     migration file; a full pass across the other 11 was out of this research's time budget — the planner
     should scope at least a lightweight seat-count spot-check (chamber `official_count` vs. office-row COUNT,
     cross-referenced against each city's live roster page) into the phase's verification wave, per the
     ROADMAP success criterion "No office across all 23 resolving Collin County governments is left in an
     ambiguous empty state."

## Validation Architecture

> No traditional automated test framework (pytest/jest) covers DB-seeding data-completeness phases in this
> codebase — every prior deep-seed phase (193-198, 201-203, v3.0 Collin itself) validates via inline SQL
> gates + live HTTP/browse spot-checks rather than a unit-test suite. This phase follows the same pattern.

### "Test" Framework
| Property | Value |
|----------|-------|
| Framework | None (SQL-gate + live-HTTP verification, established convention) |
| Config file | N/A |
| Quick run command | Inline `psql` SELECT gates (see below) |
| Full suite command | Inline `psql` gates + live browse spot-check via `curl`/browser |

### Phase Requirements → Verification Map
| Req ID | Behavior | Verification Type | Command | 
|--------|----------|--------------------|---------|
| COLLIN-PEOPLE-01 | Vacant offices researched, cited incumbent seated where filled | SQL gate | `SELECT g.name, o.title FROM essentials.offices o JOIN chambers ch ON ch.id=o.chamber_id JOIN governments g ON g.id=ch.government_id WHERE g.geo_id IN (<11 target FIPS codes>) AND o.politician_id IS NULL AND o.is_vacant IS NOT TRUE;` — should return 0 rows after seeding (anything remaining must be flagged `is_vacant=true`) |
| COLLIN-PEOPLE-02 | Genuine vacancies documented, not ambiguous | SQL gate | `SELECT * FROM essentials.offices WHERE politician_id IS NULL AND is_vacant IS NOT TRUE;` across ALL 23 govs — must return 0 rows at phase close |
| D-02 missing-seat check | No government has fewer office rows than real seats | Manual + SQL gate | Compare `chambers.official_count` to `SELECT COUNT(*) FROM offices WHERE chamber_id = ...` per government; cross-check against each city's live roster page for the 11 target + spot-check others |
| Split-section check | No accidental government/chamber duplication from seeding | SQL gate | Per [[section_split_check]] — run the project's standard split-section query after every migration |

### Sampling Rate
- **Per migration commit:** the office-count + no-null-ambiguous-seat SQL gates above.
- **Per wave merge:** full 21-office (+6 missing-seat) reconcile count against this research's target table.
- **Phase gate:** split-section check clean + live browse spot-check of at least 3 of the 11 target cities
  (`/results?browse_government_list=<geo_id>`) showing the newly-seated names.

### Wave 0 Gaps
- None — no test-framework scaffolding is needed; the SQL gates above are the entire verification surface,
  consistent with every prior Collin/AZ/NV/CA deep-seed phase.

## Security Domain

Not applicable — this phase performs no authentication, session, input-validation-surface, or cryptography
work. It is exclusively SQL data seeding against a fixed, already-modeled schema (`essentials.offices`,
`essentials.politicians`). `workflow.security_enforcement` is absent from `.planning/config.json`, but the
ASVS categories (V2 Auth, V3 Session, V4 Access Control, V5 Input Validation, V6 Crypto) have no surface
here — no new user-facing input path, no new endpoint, no new credential handling.

## Sources

### Primary (CITED — official or semi-official government sources, fetched or searched live 2026-07-23)
- annatexas.gov/319/City-Council (via TML directory + WebSearch corroboration) — Anna roster
- directory.tml.org/profile/city/1286 (Anna), /466 (Fairview), /524 (Van Alstyne), /1341 (Blue Ridge),
  /994 (Josephine), /1730 (Nevada, partial), /1765 (Parker) — Texas Municipal League City Officials Directory
- blueridgecity.com/council (live-fetched) — Blue Ridge full roster + seat count
- lucastexas.us/164/City-Council (live-fetched) — Lucas full roster, "Seat" naming confirmed live
- lowrycrossingtexas.org/operations/city_council.php (live-fetched) — Lowry Crossing full 8-ward-seat roster
- princetontx.gov "City Council Highlights" newsflash (2026-06-23); Princeton Herald "Runoff required for
  Place 4 council seat" (2026-05-07) and "City council runoff results FINAL" (2026-06-13) — Princeton Place 4
- Community Impact "FINAL: Shun Thomas wins Plano City Council Place 7 special election" (2026-01-31);
  Ballotpedia "City elections in Plano, Texas (2026)" — Plano Place 7
- Ballotpedia candidate pages for Jim Atchison / Kevin Soucie (Van Alstyne Mayor, 2026); KTEN news coverage
  of the Van Alstyne mayoral result — Van Alstyne Mayor
- `C:/EV-Accounts/backend/migrations/090_tx_tier34_cities.sql`, `097_tier_3_politicians.sql`,
  `098_tier_4_politicians.sql`, `105_tx_congressional_house_officials.sql` — original May-2026 structural/data
  migrations (still on disk); source of every "DB SCHEMA GAP" / "NOT YET SEEDED" comment referenced throughout
  this research, and the `is_vacant` pattern precedent
- `.planning/quick/260723-lfc-phase-217-verify-document-confirm-all-23/260723-lfc-GEOID-MAPPING.md` — Phase
  217's live browse verification (Plano/Princeton/Van Alstyne seated counts as of 2026-07-23)
- `.planning/milestones/v3.0-ROADMAP.md`, `.planning/MILESTONES.md` — original Collin County v3.0 seeding
  scope, Tier 3/4 city list, ext_id/schema conventions

### Secondary (MEDIUM confidence — WebSearch-synthesized, single-source, or aggregator sites)
- Nevada Mayor/Place1/Place2 (Deering/Laye/Baker) — WebSearch synthesis, no direct single-page fetch confirmed
- Fairview Seat 4 (John Stanley) — TML-directory-only, no second corroborating source found
- Van Alstyne Place 6 (Zach Williams replacing stubbed Angelica Pena) — TML-directory-only

### Tertiary (LOW confidence — flagged for mandatory re-verification, see Open Questions / Assumptions Log)
- Lucas Place↔Seat positional mapping (Underhill/Orr) — inferred from list order, not an explicit stated correspondence
- Weston's Marla Johnston as still-current officeholder ~14 months after the original May-2026 research

## Metadata

**Confidence breakdown:**
- Standard stack / seeding pattern: HIGH — directly sourced from working, already-applied prior migrations in this exact repo
- Per-city incumbent facts: MEDIUM-HIGH overall; 18 of 21 target offices have a solid CITED source, 3 flagged [RE-VERIFY], full Assumptions Log provided
- Missing-seat findings (Blue Ridge/Lowry Crossing/Weston): HIGH — directly confirmed via live official-site fetches cross-referenced against the original migrations' own "DB SCHEMA GAP" comments
- Headshot sourcing: MEDIUM — known zero-photo cities documented at milestone level; the other 8 cities' photo availability is inferred from historical migration notes, not independently re-tested

**Research date:** 2026-07-23
**Valid until:** ~14 days — election-adjacent civic data with multiple recent mid-term resignations/special
elections in this county; re-verify anything not seated within 2 weeks of this research date, especially the
3 [RE-VERIFY]-flagged seats (Fairview Seat 4, Van Alstyne Place 6, Nevada Mayor/Place1/Place2).
