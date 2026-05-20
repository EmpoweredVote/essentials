# Phase 56: ME Playbook Retrospective - Research

**Researched:** 2026-05-20
**Domain:** Documentation audit — LOCATION-ONBOARDING.md, .planning/templates/*, STATE.md — against the actual Maine onboarding (Phases 49–55)
**Confidence:** HIGH (all findings from reading the actual source files and confirmed STATE.md entries)

---

## Summary

This is a documentation phase, not a code or migration phase. The research task is: read what we have, compare it against what Maine taught us, and identify every gap that must be filled before the playbook can stand alone for the next state.

The current LOCATION-ONBOARDING.md (301 lines) was written after the Cambridge (MA) proof-of-concept. It is Cambridge-centric — the "Cities Onboarded" table has one row, all examples are Cambridge, and the gotcha callouts are tuned to city onboarding not state-level onboarding. Maine added a full state legislature, legislature-elected appointed offices, RCV jurisdictions (Portland + cities), the G4110 vs. G4040 COUSUB distinction, state-level TIGER loading, and a PowerShell bulk-seed generator pattern — none of which appears in the playbook.

The six template files (db-foundation, officials-seed, headshots, elections-seed, discovery-setup, compass-stances) are mostly Cambridge-calibrated. The headshots template has no state legislature sourcing pattern. The elections-seed template has no mention of legislature-elected appointed offices or RCV on the chamber row. The officials-seed template has no multi-tier seeding pattern (Tier 1 deep, Tier 2 incumbents only, Tier 3-4 skeletal with NULL politician_id).

STATE.md is the richest document — it has 95 lines of accumulated Maine-specific decisions, many of which should be promoted to general playbook entries. The pending todos section has three items that need audit for staleness: migration 171 (LA council votes, unapplied), migration 182 (legacy views drop, unapplied), and the post-June-9 follow-up migration (D primary winners).

**Primary recommendation:** Plan two tasks — (1) update LOCATION-ONBOARDING.md with all 9 GOTCHA callouts inline at the right steps plus Maine in the Cities Onboarded table, then update all 4 template files with Maine patterns; (2) verification pass: run the smoke test, confirm all 9 GOTCHAs are inline, audit STATE.md pending todos, and do a readability review.

---

## What Exists Today

### LOCATION-ONBOARDING.md — Current State

Location: `/c/Transparent Motivations/essentials/LOCATION-ONBOARDING.md` (321 lines)

**What it has:**
- 8-step framework (Government Structure → Election System → Geofences → Data Sources → Schema Decisions → Migration Order → Common Pitfalls → Phase Templates)
- "Cities Onboarded" table with one entry: Cambridge MA
- 13-row Common Pitfalls table in Step 7
- Inline [GOTCHA] callouts in Steps 2, 5, 6 for: election_method TEXT column (not pg_constraint), governments WHERE NOT EXISTS, offices unique index drop (Council-Manager), race_candidates WHERE NOT EXISTS
- Links to all 6 template files
- Cambridge-specific examples throughout
- NO mention of state-level onboarding (legislatures, TIGER loading, executive chambers)
- NO Maine entry in Cities Onboarded table
- NO callouts for: slug on chambers, Senator uniqueness key, legislature-elected = appointed, RCV on chamber row, G4110 vs G4040 COUSUB distinction, TIGER file naming (cd119), districts.state casing

**Gaps (things Maine taught that are not in the playbook):**

| Gap | Where to Add |
|-----|-------------|
| GOTCHA: slug is GENERATED on chambers — never INSERT it | Step 6 step 3 (Chambers) |
| GOTCHA: governments has no unique constraint on geo_id — WHERE NOT EXISTS | Step 6 step 2 — already partially present; needs Maine example |
| GOTCHA: Senator uniqueness key = (district_id, politician_id) not (district_id, chamber_id) | New callout — Step 6 step 3 or Step 5 |
| GOTCHA: Legislature-elected offices need is_appointed=true, no election race rows | Step 6 step 4 or Step 5 |
| GOTCHA: TIGER congressional file may not be named `cd` — check archive for state | Step 3 |
| GOTCHA: districts.state casing — lowercase for STATE/COUNTY/LOCAL tiers, uppercase for NATIONAL_LOWER | Step 3 or Step 6 step 1 |
| GOTCHA: RCV jurisdictions need election_method='rcv' on the chamber row, not just the race | Step 2 or Step 6 step 3 |
| GOTCHA: Cities (G4110 PLACE) vs. towns (G4040 COUSUB) — wrong layer = missing LOCAL routing | Step 3 |
| GOTCHA: districts.state value set by loader's abbrev/abbrevUpper — verify loader config before running | Step 3 (same as TIGER casing) |
| Maine entry in Cities Onboarded table | Cities Onboarded table |
| State-level onboarding context (legislature, executive chambers, TIGER loader) | Needs a new section or expanded Step 3/6 |
| Multi-tier city seeding pattern (Tier 1 deep, Tier 2 incumbents, Tier 3-4 skeletal + GAPS.md) | Step 6 step 5 |
| PowerShell bulk-seed generator pattern for 150+ rows | Step 6 step 5 or Step 8 link |
| Compass/Treasury stub ownership | New section at end |

### Template Files — Current State

**db-foundation.md** (158 lines)
- Has: slug GENERATED gotcha, governments WHERE NOT EXISTS gotcha, election_method TEXT column gotcha, Council-Manager index drop gotcha
- Missing: Senate uniqueness key, legislature-elected = appointed pattern, multi-tier offices pattern

**officials-seed.md** (105 lines)
- Has: dual-office pattern (Council-Manager), Cambridge example
- Missing: multi-tier seeding (Tier 1 deep / Tier 2 incumbents-only / Tier 3-4 skeletal with NULL), PowerShell generator for 150+ rows, official name sourcing from legislature websites (nicknames vs. legal names trap)

**headshots.md** (96 lines)
- Has: crop/resize spec, Cambridge sources
- Missing: state legislature headshot sourcing pattern (mainelegislature.org pattern — Senate at /uploads/visual_edit/[name].jpg; House at /house/Repository/MemberProfiles/[guid]_[Name]-year.jpg with non-derivable GUIDs); thumbnail upscaling decision (152×202 → 600×750 approved)

**elections-seed.md** (189 lines)
- Has: election_method reference block, race_candidates WHERE NOT EXISTS gotcha, discovery_jurisdictions cron horizon logic
- Missing: legislature-elected = appointed (no race rows for AG/SoS/Treasurer), RCV election_method on chamber (not race), PowerShell generator for 372 legislative race rows, "no cron_active column — horizon is date-based" clarification, races table has no election_method column

**discovery-setup.md** (109 lines)
- Has: Cambridge inactive-until-filing pattern, domain whitelist pattern
- Missing: state-level discovery (geoid='23' = whole state), discovery at scale (372 races — verify agent handles without quota burn), no cron_active column clarification

**compass-stances.md** (129 lines)
- Has: rate limit one-at-a-time rule, citation requirement, Cambridge example
- Missing: stub ownership note for state onboarding (Compass Team authors compass section; this template is for Essentials only)

### STATE.md — Pending Todos to Audit

The three items flagged in CONTEXT.md for staleness audit:

1. **Migration 171 (LA council votes, unapplied)** — 171_la_council_votes.sql exists in the migrations folder per Phase 52 research. This is an LA-specific migration that has not been applied. It is genuinely unfinished work, NOT a Maine item. Keep in pending todos with a note that it predates the Maine phases and is LA backlog.

2. **Migration 182 (legacy views drop, unapplied)** — Referenced in STATE.md known architecture section as "182 is unapplied legacy views drop." Needs verification: does the file exist? Is it safe to apply? Should it stay as pending or be promoted to active? The planner should schedule a DB query to check `SELECT version FROM supabase_migrations.schema_migrations WHERE version::int BETWEEN 180 AND 185` to see which are applied.

3. **Post-June-9 follow-up migration (D primary winners)** — Explicitly noted in STATE.md: "Post-June-9 follow-up migration required: add D primary winners to US Senate general + ME-01 general + ME-02 general race rows." This is a real, time-sensitive todo. June 9 is about 20 days from research date (2026-05-20). Keep this prominently in pending todos.

### GOTCHAs — The 9 Approved Items and Their Current Playbook Status

| # | GOTCHA | Currently in Playbook? | Where to Add |
|---|--------|----------------------|--------------|
| 1 | slug is GENERATED on essentials.chambers — never INSERT | db-foundation.md pre-flight checklist (YES), LOCATION-ONBOARDING.md Step 7 pitfalls table (YES), not inline at Step 6 step 3 | Add inline callout at Step 6 step 3 |
| 2 | essentials.governments has NO unique constraint on geo_id | Step 6 step 2 (YES inline), Step 7 (YES), db-foundation.md (YES) | Already covered — add Maine example |
| 3 | Senate uniqueness key = (district_id, politician_id) not (district_id, chamber_id) | NOT present anywhere | Add inline at Step 5 or Step 6 step 3 |
| 4 | Legislature-elected offices (AG, SoS, Treasurer) need is_appointed=true + no election race rows | NOT present in playbook | Add inline at Step 5 and Step 6 step 4 |
| 5 | TIGER congressional file may not be named `cd` — check archive (Maine = tl_2024_23_cd119.zip) [STATE-SPECIFIC] | NOT present in LOCATION-ONBOARDING.md (exists in 49-RESEARCH.md only) | Add inline at Step 3 |
| 6 | districts.state casing: lowercase for STATE/COUNTY/LOCAL, uppercase for NATIONAL_LOWER — set by loader abbrev/abbrevUpper | NOT present in LOCATION-ONBOARDING.md | Add inline at Step 3 or Step 6 step 1 |
| 7 | RCV jurisdictions need election_method='rcv' on the chamber row, not just the race | NOT present in LOCATION-ONBOARDING.md | Add inline at Step 2 or Step 6 step 3 |
| 8 | Cities (G4110 PLACE) vs towns (G4040 COUSUB) — wrong layer = missing LOCAL routing [STATE-SPECIFIC: Maine 23 G4110 / majority G4040] | NOT present in LOCATION-ONBOARDING.md | Add inline at Step 3 |
| 9 | districts.state value set by loader's abbrev/abbrevUpper — verify loader config before running | Same as #6 — same underlying issue, two aspects | Consolidate with #6 inline at Step 3 |

GOTCHAs 8 and 9 share the same inline location as #5 and #6 respectively. The framing decision (consolidate vs. separate) is at Claude's discretion per CONTEXT.md.

---

## Architecture Patterns

### Phase 56 Document Architecture

```
LOCATION-ONBOARDING.md            # Primary playbook — update inline
.planning/templates/
├── db-foundation.md               # Update: Senate uniqueness key, legislature-elected
├── officials-seed.md              # Update: multi-tier pattern, PowerShell generator note
├── headshots.md                   # Update: legislature headshot sourcing, thumbnail upscaling
├── elections-seed.md              # Update: legislature-elected = appointed, no election_method on races, no cron_active col
├── discovery-setup.md             # Update: state-level discovery, scale note
└── compass-stances.md             # Update: stub ownership note
STATE.md                           # Audit pending todos; promote general entries (no new format)
```

No new template files are needed. The CONTEXT.md says "Key migration/script templates as separate files in .planning/templates/" — but there are no migration templates that don't already exist in template form (the PowerShell generator was one-off scripted in the phase). The planner should decide whether to create a `powershell-bulk-generator.md` template or just add the pattern inline in officials-seed.md.

### Inline GOTCHA Format

From CONTEXT.md: format as "problem + how we responded + Maine example, so the next state can verify and adapt rather than copy blindly."

Template:
```markdown
> [GOTCHA] **[Problem statement]:** [What goes wrong without this knowledge.] In Maine, [how we responded]. For your state: [what to verify/adapt].
```

Universal GOTCHAs (no STATE-SPECIFIC tag):
- slug is GENERATED (items 1, 2, 3, 4) — true for all states; Maine example is illustrative

State-specific GOTCHAs (add [STATE-SPECIFIC] tag):
- Item 5: cd vs cd119 — Maine uses cd119; other states may use cd; always check archive
- Item 8: G4110 vs G4040 — Maine has only 23 G4110 cities; most residents are in COUSUB towns; other states vary dramatically

### Maine Entry — Cities Onboarded Table

Add row to the Cities Onboarded table in LOCATION-ONBOARDING.md:

| Column | Value |
|--------|-------|
| City/State | Portland + 22 other ME cities |
| State | ME |
| Onboarded | 2026-05-19 |
| Election method | rcv (Portland), plurality (all other cities) |
| Notable patterns | 23 G4110 cities (majority of ME residents in G4040 COUSUB towns, not cities); legislature-elected executive offices (AG/SoS/Treasurer) = is_appointed=true, no race rows; state senate uniqueness key = (district_id, politician_id); Tier 1/2/3-4 multi-tier seeding with GAPS.md; PowerShell generator for 372 legislative race rows; thumbnail upscaling (152×202 → 600×750 approved) |

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 372 legislative race INSERT blocks | Write by hand | PowerShell generator script (.ps1) producing the SQL file | Phase 55-02 proved this — hand-writing 372 blocks is error-prone; generator was 15 lines of PS1 |
| State legislature headshot collection | Batch scrape | /find-headshots skill (one-at-a-time per-profile click) | House GUIDs are non-derivable; each profile must be visited |
| Multi-tier city gap documentation | Silence (omit ungapped cities) | GAPS.md with explicit "not attempted" status rows | Silent omissions become permanent confusion; documented gaps become a future phase backlog |

---

## Common Pitfalls in Documentation Work

### Pitfall 1: Overgeneralizing from Maine + MA
**What goes wrong:** Writing "towns use G4040 COUSUB" as universal fact when Texas cities are all G4110 PLACE, Indiana uses cousub, and Alaska uses a completely different model.
**How to avoid:** Frame every GOTCHA as "problem + how we responded + Maine example." Let the next onboarder judge applicability. The [STATE-SPECIFIC] tag signals "verify this for your state."

### Pitfall 2: Burying GOTCHAs in a summary section
**What goes wrong:** The GOTCHA is documented but a future onboarder doesn't see it until after they hit the problem — because they were working through steps, not reading a reference section.
**How to avoid (locked decision):** Every GOTCHA goes inline at the step where the mistake would be made. No summary GOTCHA section.

### Pitfall 3: Leaving pending todos stale
**What goes wrong:** Todos that were relevant 3 months ago (but are now resolved or superseded) create confusion about what actually needs doing.
**How to avoid:** During Phase 56, read each pending todo and make a decision: still relevant (keep), resolved (remove), or superseded (update). The three todos in scope are: 171 (LA, keep as LA backlog), 182 (check if applied), post-June-9 migration (keep, time-sensitive).

### Pitfall 4: Writing stubs that are blank
**What goes wrong:** "Compass section — TO BE COMPLETED" with no structure looks the same as a forgotten section.
**How to avoid (locked decision):** Stubs get ownership tags: `[TO BE COMPLETED BY COMPASS TEAM]`, `[TO BE COMPLETED BY TREASURY TEAM]` with a one-line description of what belongs there and who should author it.

---

## Code Examples

### GOTCHA Callout Format (Inline)

Universal GOTCHA (no state tag):
```markdown
> [GOTCHA] **slug is a GENERATED column on essentials.chambers:** Never include `slug` in an INSERT column list — PostgreSQL will throw an error. In Maine, we verified this against the Phase 50 migration pattern. For your state: omit `slug` from every chamber INSERT; the value is auto-computed from the chamber name.
```

State-specific GOTCHA:
```markdown
> [GOTCHA] **[STATE-SPECIFIC] TIGER congressional file naming:** The file may not be named `cd` — check the actual TIGER archive for your state before configuring the loader. In Maine, the congressional file is `tl_2024_23_cd119.zip` (the loader key is `cd119`, not `cd`). For your state: browse `https://www2.census.gov/geo/tiger/TIGER2024/CD/` and find your FIPS file before writing the STATE_LAYER_ALLOWLIST entry.
```

### Multi-Tier Officials Seeding Pattern (for officials-seed.md)

```
Tier 1 (largest city, e.g., Portland):
  - Seed all incumbents with full contact data (name, email, term dates)
  - Upload headshots for all seats
  - Document any gaps explicitly

Tier 2 cities (next 5 by population):
  - Seed incumbents only (no headshots in same phase unless easy)
  - Email where available on official site; NULL otherwise
  - GAPS.md entry per city for missing seats

Tier 3-4 cities (remaining):
  - Skeletal offices only: office rows exist, politician_id=NULL
  - GAPS.md row with status "not attempted"
  - No seeding — placeholder for future phase
```

### PowerShell Generator Pattern (brief reference for officials-seed.md)

For 150+ repetitive INSERT blocks (e.g., 372 legislative race rows):
```powershell
# Pattern from Phase 55-02 (generate_me_legislative_races.ps1)
# Uses [System.IO.File]::WriteAllLines to avoid BOM issues
$rows = 1..35 | ForEach-Object {
    "INSERT INTO essentials.races (id, election_id, position_name, office_id, primary_party)"
    "SELECT gen_random_uuid(), (SELECT id FROM essentials.elections WHERE name = '...' AND state = 'ME'),"
    "  'ME State Senate District $_',"
    "  (SELECT o.id FROM essentials.offices o JOIN essentials.districts d ON o.district_id = d.id"
    "   WHERE d.geo_id = '23' || lpad('$_', 3, '0') AND d.district_type = 'STATE_UPPER' AND d.state = 'me')"
    "  NULL"
    "WHERE NOT EXISTS (SELECT 1 FROM essentials.races WHERE position_name = 'ME State Senate District $_' AND election_id = ...);"
}
[System.IO.File]::WriteAllLines($outputPath, $rows, [System.Text.UTF8Encoding]::new($false))
```
Note: `UTF8Encoding::new($false)` = UTF-8 without BOM. BOM causes psql parse failures.

---

## STATE.md — What to Promote vs. Keep

### Promote to general LOCATION-ONBOARDING.md entries (problem + solution + Maine example framing)

| Current STATE.md entry | Promote as | Framing |
|------------------------|-----------|---------|
| "slug is GENERATED on essentials.chambers" | GOTCHA #1 inline | Universal — applies to all states |
| "governments has NO unique constraint on geo_id" | GOTCHA #2 inline | Universal — WHERE NOT EXISTS required |
| "Senator uniqueness key = (district_id, politician_id)" | GOTCHA #3 inline | Universal for any bicameral state |
| "Maine AG/SoS/Treasurer are legislature-elected → is_appointed=true, no election race rows" | GOTCHA #4 inline + Step 5 decision table | Universal — check for any state with legislature-elected officers |
| "districts.state lowercase/uppercase by tier" | GOTCHA #6 inline at Step 3 | Universal loader behavior — verify for every state |

### Keep as Maine-specific reference in STATE.md

| Entry | Why keep |
|-------|---------|
| ME government UUID (da88de8b...) | Maine-specific reference; future migrations need this |
| ME chamber slugs | Maine-specific reference |
| ME executive external_ids (-230001 etc.) | Maine-specific |
| ME federal external_ids (-230101 etc.) | Maine-specific |
| ME senator/rep external_id ranges (-231001../-232001..) | Maine-specific |
| All city geo_ids and external_id prefixes | Maine-specific |

### Promote to general entries (with Maine as example)

| Entry | General form |
|-------|-------------|
| "TIGER congressional file may not be named cd" | GOTCHA #5 — always check TIGER archive for your state's CD filename |
| "G4110 cities vs. G4040 COUSUB towns" | GOTCHA #8 — Maine outlier (23/majority towns); always check your state's PLACE layer coverage |
| "geofence_boundaries.state = FIPS '23'; districts.state = abbreviation 'ME'" | Already in Step 3 / GOTCHA #6 scope |
| "Run TIGER loader from C:/EV-Accounts/backend (not C:/EV-Accounts)" | Operational note in Step 3 |
| "mainelegislature.org headshot sourcing" | headshots.md state legislature section |
| "discovery at state level: geoid='23' covers all ME races" | elections-seed.md / discovery-setup.md |

---

## Verification Checks for Phase 56-02

The four checks required for v6.0 sign-off (from CONTEXT.md):

**Check 1: ME address smoke test**
- Portland (geo_id=2360545, lon=-70.2553, lat=43.6591) → must return ME city council, state reps, federal reps
- Bangor (geo_id=2302795) → must return ME city council, state reps, ME-02 rep
- Rural address (Somerset County, no G4110) → must return state reps + ME-02 only, no LOCAL city officials
- Query: use the standard /representatives endpoint with a full street address for each

**Check 2: Discovery sweep confirmed active**
- SQL: `SELECT jurisdiction_geoid, election_date, is_active, would_be_swept FROM essentials.discovery_jurisdictions WHERE jurisdiction_geoid = '23' ORDER BY election_date;`
- Expected: two rows — 2026-06-09 and 2026-11-03, both with `is_active=true` or `would_be_swept=true`

**Check 3: Playbook readability review**
- Read LOCATION-ONBOARDING.md straight through asking: "Would Chris Andrews be able to onboard Missouri without asking a question not answered here?"
- Focus on: GOTCHAs inline at right steps, examples show problem-solving approach not just Maine values

**Check 4: All 9 GOTCHAs present**
- Walk through Steps 2, 3, 5, 6 of the playbook
- Confirm each of the 9 GOTCHA callouts is present inline at the correct step
- Confirm [STATE-SPECIFIC] tag on items #5 and #8

---

## Pending Todos Audit Results

From the research reading of STATE.md (line 103-115):

| Todo Item | Status | Recommendation |
|-----------|--------|---------------|
| Migration 171 (LA council votes, unapplied) | LA backlog — predates ME phases | Keep in pending todos; note it is LA backlog, not ME |
| Migration 182 (legacy views drop, unapplied) | Unknown — needs DB check | Plan task: query schema_migrations; if NOT applied, keep; if applied, remove |
| Post-June-9 follow-up migration (D primary winners) | Active — June 9 is 20 days away | Keep prominently; add target date note |
| CA Governor challenger candidates | Out of scope for Phase 56 | Keep — CA backlog |
| LAUSD sub-district geofences | Out of scope for Phase 56 | Keep — CA backlog |
| lavote.gov election ID changes | Out of scope for Phase 56 | Keep — CA operational note |

---

## Open Questions

1. **Migration 182 applied status**
   - What we know: STATE.md says "182 is unapplied legacy views drop"
   - What's unclear: Has it been applied since that note was written?
   - Recommendation: Plan task should query `SELECT version FROM supabase_migrations.schema_migrations WHERE version = '182'` — if it returns a row, remove the todo; if not, keep it and decide whether to apply in Phase 56.

2. **Whether to create a powershell-bulk-generator.md template**
   - What we know: The generator was used in Phase 39 (MA), Phase 52 (senators + reps), Phase 55-02 (372 legislative races)
   - What's unclear: Is this pattern recurrent enough to warrant a standalone template file, or should it be a section in officials-seed.md?
   - Recommendation: Add a "Bulk SQL Generation" section to officials-seed.md rather than a new file. The pattern is short enough (see Code Examples above) that a dedicated file would be sparse.

3. **Compass section content**
   - What we know: Phase 56 writes stubs with ownership tags, not full content
   - What's unclear: What minimal structure should the stub have?
   - Recommendation: One paragraph per system (Compass, Treasury Tracker) — what the section is for, what data format it needs, who authors it, and one example Maine value if available. The goal is a clear home, not a blank page.

---

## Sources

### Primary (HIGH confidence)
- `LOCATION-ONBOARDING.md` — read in full (321 lines); all gap findings verified from actual file content
- `.planning/templates/*.md` — all 6 files read; gap findings verified from actual content
- `.planning/STATE.md` — read in full (124 lines); all pending todos and key decisions verified
- `.planning/phases/49-me-geofences/49-RESEARCH.md` — TIGER patterns, cd119, G4110 vs G4040, districts.state casing
- `.planning/phases/52-me-state-legislature/52-RESEARCH.md` — state legislature patterns, headshot sourcing, PowerShell generator
- `.planning/phases/52-me-state-legislature/52-CONTEXT.md` — Senate uniqueness key, is_appointed decisions
- `.planning/phases/53-portland-city-structure/53-RESEARCH.md` — multi-tier city seeding, Portland structure, COUSUB vs PLACE
- `.planning/phases/54-me-city-officials-tiers-2-4/54-CONTEXT.md` — multi-tier decision, GAPS.md pattern
- `.planning/phases/54-me-city-officials-tiers-2-4/GAPS.md` — documented gap format (17 cities, not attempted)
- `.planning/phases/55-me-2026-elections-discovery/55-RESEARCH.md` — elections schema, no election_method on races, no cron_active column
- `.planning/phases/55-me-2026-elections-discovery/55-CONTEXT.md` — PowerShell generator decision, discovery at state scale
- `.planning/phases/56-me-playbook-retrospective/56-CONTEXT.md` — all locked decisions, GOTCHA list, verification checks

### Secondary (MEDIUM confidence)
- `.planning/phases/50-me-government-db/50-01-PLAN.md` — slug GENERATED constraint in migration plan prose
- `.planning/phases/53-portland-city-structure/53-02-PLAN.md` — multi-tier office pattern, Portland council seeding

---

## Metadata

**Confidence breakdown:**
- Gap identification in LOCATION-ONBOARDING.md: HIGH — read the file, cross-referenced against the 9 approved GOTCHAs
- Gap identification in template files: HIGH — read all 6 files; gaps are evident from missing sections
- STATE.md pending todos audit: HIGH — read the file; recommendations are based on the actual entries
- Verification check procedures: HIGH — defined from CONTEXT.md locked decisions

**Research date:** 2026-05-20
**Valid until:** This is internal documentation — valid indefinitely; no external dependencies
