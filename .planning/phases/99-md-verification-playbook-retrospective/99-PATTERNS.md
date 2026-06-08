# Phase 99: MD Verification + Playbook Retrospective — Pattern Map

**Mapped:** 2026-06-07
**Files analyzed:** 5 (all documentation/markdown — no code files)
**Analogs found:** 5 / 5

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `LOCATION-ONBOARDING.md` | documentation | transform (append new section + inline blocks) | `LOCATION-ONBOARDING.md` lines 52-85 (OR Quick Reference) | exact — same structure already exists for CA and OR |
| `.planning/REQUIREMENTS.md` | documentation | transform (checkbox + table update) | `.planning/REQUIREMENTS.md` lines 1-113 (existing traceability block) | exact — same format, editing stale entries |
| `.planning/ROADMAP.md` | documentation | transform (status flag update + plan list) | `.planning/ROADMAP.md` lines 1-18 (milestone list) and lines 1076-1083 (Phase 99 entry) | exact — same `🚧` → `✅` pattern used for every prior milestone |
| `.planning/STATE.md` | documentation | transform (metadata header + body field updates) | `.planning/STATE.md` lines 1-15 (YAML front-matter) | exact — same YAML front-matter + Current Position block |
| `.planning/PROJECT.md` | documentation | transform (current milestone update) | `.planning/PROJECT.md` lines 1-60 (read in pattern extraction) | role-match — precedent from prior milestone closes (v7.0, v8.0, v10.0) |

---

## Pattern Assignments

### `LOCATION-ONBOARDING.md` (documentation, append + inline)

**Analog:** `LOCATION-ONBOARDING.md` — existing California Quick Reference (lines 52-68) and Oregon Quick Reference (lines 72-85)

**Cities Onboarded table row pattern** (lines 29-47, any row):
```markdown
| Maryland (state) | MD | 2026-06-08 | plurality | State legislature: 47 Senate + 141 Delegates; 71 SLDL polygons (not 47 or 141 — sub-districts); legislature-elected Treasurer (is_appointed=true); mgaleg.maryland.gov headshot discovery (scrape HTML, not HEAD probe); Baltimore City dual-tier (G4110 + G4020); external_ids exec -24000x, senators -2410001..-2410047, delegates -2420001..-2420141 |
| Leonardtown | MD | 2026-06-08 | plurality | Tier 1 deep seed (migration 277); Mayor=LOCAL_EXEC + 5 council=LOCAL; mtfcc=NULL on district rows (migration 246 pattern); ext_ids under St. Mary's County government |
```

**Quick Reference section header pattern** (lines 52-53 for CA, lines 72-73 for OR):
```markdown
## Maryland Quick Reference

**Read this before starting any MD city or state work.**
```

**Trap table pattern** (lines 55-68 for CA, lines 75-85 for OR):
```markdown
| Trap | See Step | One-Line Summary |
|------|----------|-----------------|
| [trap name] | Step N | [one-line description — action-oriented] |
```
Each row must be self-contained: trap name, which step to see, one-line fix. Do not use multi-sentence summaries in the table.

**Inline GOTCHA block pattern** (lines 103-106, 145-148):
```markdown
> [GOTCHA] **[STATE-SPECIFIC: MD] [Title in title case]:** [Explanation. Include: what goes wrong without this warning, the correct behavior, and a concrete MD example.]
```
The opening `> [GOTCHA] **[STATE-SPECIFIC: MD]` prefix is mandatory for inline blocks within Steps 1-7.

**Where to insert inline GOTCHAs:**
- Step 1 (Government Structure Research, line 88): Add MD GOTCHA for State Treasurer appointed by GA + multi-member delegate districts
- Step 3 (Geofences, line ~200): Add MD GOTCHA for Baltimore City dual-tier + SLDL 71-polygon / 141-delegate math
- Step 4 (Headshots, line ~300): Add MD GOTCHA for mgaleg HTML scraping + compound last-name pattern + Peña-Melnyk/Jacobs J. edge cases + politician_photos bucket name
- Step 5 (Schema decisions, line ~350): Add MD GOTCHA for NOT EXISTS guard using (district_id, politician_id) not (district_id, chamber_id)
- Step 6 (Migrations, line ~400): Add MD GOTCHA for discovery_jurisdictions cron_active column does not exist

**Step 7 pitfall table rows to add** (lines 374-405, after last OR row):
```markdown
| MD multi-member delegate INSERT blocks on 2nd/3rd delegate | Use NOT EXISTS on (district_id, politician_id) NOT (district_id, chamber_id); chamber_id as discriminator blocks all but the first delegate per district |
| mgaleg headshot suffix not guessable | Scrape roster HTML for actual img src; HEAD probing misses delegates with suffix >01 (e.g., jackson04, young04, harris03) |
| Baltimore City dual-tier missed in smoke test | Assert BOTH geo_id='2404000' (G4110) AND geo_id='24510' (G4020) for any Baltimore City address; "exactly one local row" assertion fails incorrectly |
| MD State Treasurer modeled as voter-elected | Treasurer is elected by General Assembly: is_appointed_position=true, zero race rows, no discovery_jurisdictions entry; AG/Gov/LG/Comptroller ARE voter-elected |
| Upload to wrong MD headshot bucket | Use 'politician_photos' bucket (NOT 'politician-headshots' — that bucket does not exist); path pattern: {politician_id}-headshot.jpg |
| discovery_jurisdictions cron_active column assumed | MD discovery_jurisdictions has no cron_active column; date-based eligibility is the correct mechanism; REQUIREMENTS.md MD-ELECTIONS-02 text is stale on this point |
```

---

### `.planning/REQUIREMENTS.md` (documentation, checkbox + table update)

**Analog:** `.planning/REQUIREMENTS.md` — existing `[x]` checkbox entries and traceability table (lines 1-113)

**Checkbox format** (lines 15-20 for any `[x]` entry):
```markdown
- [x] **MD-ELECTIONS-01**: MD 2026 elections seeded — Governor race + 1 US Senate (Van Hollen) + 8 US House + 47 senate scaffold + 71 SLDL house district scaffold rows (one row per geo_id, seats=N per D-01; 130 total race rows)
- [x] **MD-ELECTIONS-02**: discovery_jurisdictions row created for MD statewide, cron_active=true, armed for 2026 election cycle
- [x] **MD-ELECTIONS-03**: Landing.jsx updated with MD entry — Leonardtown city browse + MD state browse
```
Change `[ ]` → `[x]` for MD-ELECTIONS-01, MD-ELECTIONS-02, MD-ELECTIONS-03. Do NOT alter the requirement text even if it is stale (e.g., "cron_active=true" wording) — deviation is documented in the traceability table, not the requirement text itself.

**Also change** (already `[ ]`, must become `[x]`):
```markdown
- [x] **UI-01**: MiniCompass chart circles reduced by ~50% so the chart fits naturally as a tooltip overlay on candidate tiles
- [x] **UI-02**: Titles/labels removed from around MiniCompass display (no spoke labels, no chart title text visible)
- [x] **POST-ELECTION-01**: ME June 9 primary winners added to US Senate general + ME-01 general + ME-02 general race_candidates rows
- [x] **POST-ELECTION-02**: lavote.gov election ID updated in discovery_jurisdictions for CA November 2026 general
```
UI-01/02 and POST-ELECTION-01/02 are conditionally `[x]` only after 90-03-SUMMARY.md exists. Plan 01 should note this dependency.

**Traceability table update pattern** (lines 77-104):
```markdown
| MD-ELECTIONS-01 | Phase 96 | Complete |
| MD-ELECTIONS-02 | Phase 96 | Complete |
| MD-ELECTIONS-03 | Phase 96 | Complete |
| MD-STANCES-01 | Phase 97 | Complete |
| MD-STANCES-02 | Phase 97 | Complete |
| MD-STANCES-03 | Phase 98 | Complete |
| MD-STANCES-04 | Phase 98 | Complete |
```
Change all "Pending" → "Complete" for these 7 rows. MD-GOV-03/04/05 are already "Complete" in the current file (lines 89-91) — no change needed.

**Footer update** (line 113):
```markdown
*Last updated: 2026-06-08 after Phase 99 verification sweep (v11.0 all 26 requirements confirmed)*
```

---

### `.planning/ROADMAP.md` (documentation, milestone status + Phase 99 plan list)

**Analog:** `.planning/ROADMAP.md` lines 1-18 (milestone list) — every prior `🚧` → `✅` transition

**Milestone list update pattern** (line 18):
```markdown
- ✅ **v11.0 Maryland Essentials** — Phases 90-99 (shipped 2026-06-08) — [archive](milestones/v11.0-ROADMAP.md)
```
Change `🚧` → `✅`, add shipped date, add archive link (archive file does not need to be created unless requested).

**Phase 99 plan list update pattern** (lines 1076-1083, following Phase 98 pattern):
```markdown
#### Phase 99: MD Verification + Playbook Retrospective

**Goal**: v11.0 is verified end-to-end, the playbook is updated with MD-specific GOTCHAs, and the milestone is closed
**Depends on**: Phases 90-98 (all v11.0 work complete)

Plans:

- [x] 99-01-PLAN.md — Verification sweep: re-confirm all 26 v11.0 requirements; update REQUIREMENTS.md checkboxes (MD-ELECTIONS-01/02/03, MD-STANCES-01/02/03/04, UI-01/02, POST-ELECTION-01/02); confirm STATE.md migration counter
- [x] 99-02-PLAN.md — Playbook update: 2 Cities Onboarded rows + Maryland Quick Reference + MD GOTCHAs inline + Step 7 pitfall rows; close v11.0 across ROADMAP.md, STATE.md, PROJECT.md
```

**Phase table row update** (line 1230):
```markdown
| 99. MD Verification + Playbook Retrospective | v11.0 | 2/2 | Complete | 2026-06-08 |
```

---

### `.planning/STATE.md` (documentation, YAML front-matter + body update)

**Analog:** `.planning/STATE.md` lines 1-15 (YAML front-matter) — same block updated at every milestone close

**YAML front-matter update pattern** (lines 1-15):
```yaml
---
gsd_state_version: 1.0
milestone: v12.0
milestone_name: [next milestone name — TBD after v11.0 close]
status: milestone_complete
last_updated: 2026-06-08T00:00:00Z
last_activity: 2026-06-08 -- Phase 99 execution complete; v11.0 closed
progress:
  total_phases: 10
  completed_phases: 10
  total_plans: 33
  completed_plans: 33
  percent: 100
stopped_at: v11.0 complete — all 26 requirements verified; milestone closed
---
```

**Current Position block update** (lines 19-26):
```markdown
## Current Position

Phase: 99
Plan: Complete
Status: v11.0 milestone closed
Last activity: 2026-06-08

Progress: [█████████] 100%
```

**"Next migration" field update** (line 58):
```markdown
- Next migration: 293
```
Current value is "278" which is stale. Plan 01 confirms the actual value via `SELECT MAX(version) FROM supabase_migrations.schema_migrations` — expected 292 (last applied) → next is 293. After 90-03 applies migration 272, the max applied is still 292 (272 < 292); next remains 293.

**Pending Todos section:** Remove the two ME/CA pending todos after Phase 90 Plan 03 runs. If Plan 03 has not run, keep as-is and note in Plan 01 that STATE.md Pending Todos update is deferred to Phase 90 close.

---

### `.planning/PROJECT.md` (documentation, current milestone update)

**Analog:** `.planning/PROJECT.md` lines 1-60 (read during pattern extraction) — established pattern from v10.0 milestone close

**"What This Is" paragraph update** — append MD coverage to the existing coverage list:
```markdown
Essentials is a civic engagement web app that helps people discover who represents them and who is running in upcoming elections. It covers Monroe County, IN, Los Angeles County, CA, Collin County, TX, Cambridge MA, all of Maine, all of California (7 deep-seeded cities), all of Oregon (Portland deep seed), Multnomah County OR including 22 school districts across 4 states, and all of Maryland (St. Mary's County + Leonardtown deep seed). [...]
```

**Validated requirements block** — add MD milestone deliverables as `✓` bullet points following the existing OR/v10.0 entries. Use the same one-liner format:
```markdown
- ✓ Maryland state coverage: 307 geofence boundaries; 47 senators + 141 delegates + 10 federal officials; 202 officials with headshots; 1516 compass stances; 130 race rows + discovery pipeline — v11.0
- ✓ St. Mary's County + Leonardtown deep seed: county commission + town council seeded with headshots — v11.0
- ✓ MiniCompass compact overlay: dotRadius=2.5 + showLabels=false — v11.0
```

---

## Shared Patterns

### Milestone Close Sequence
**Source:** ROADMAP.md milestone list (lines 5-18) — every completed milestone
**Apply to:** Plan 99-02 (in order)
```
1. ROADMAP.md milestone line: 🚧 → ✅ with shipped date
2. ROADMAP.md Phase 99 plan list: add [x] plan entries
3. ROADMAP.md phase table row: "Not started" → "Complete" with date
4. STATE.md YAML front-matter: status → milestone_complete, progress → 100%
5. STATE.md Current Position: update Phase/Plan/Status/Progress
6. STATE.md "Next migration": confirm correct value via DB query
7. PROJECT.md "What This Is": append MD to coverage summary
8. PROJECT.md Validated: add v11.0 ✓ bullets
```

### GOTCHA Block Insertion Pattern
**Source:** LOCATION-ONBOARDING.md lines 103-106, 145-148 (existing CA/OR GOTCHAs)
**Apply to:** Plan 99-02, all inline GOTCHA blocks added to Steps 1-7
```markdown
> [GOTCHA] **[STATE-SPECIFIC: MD] [Title]:** [Body — concrete problem + correct behavior + MD example.]
```
Always use `> [GOTCHA]` blockquote prefix. Always include `[STATE-SPECIFIC: MD]` tag so agents can filter by state. Never omit the concrete example.

### Verification Lightweight Re-confirm Pattern
**Source:** RESEARCH.md §Verification Query Strategy
**Apply to:** Plan 99-01, all 22 already-verified requirements
For each requirement already showing `status: passed` in its phase VERIFICATION.md, run exactly ONE `SELECT COUNT(*)` query and assert the count matches the VERIFICATION.md value. Do not re-execute the full multi-query verification suite unless the count is wrong.

---

## No Analog Found

None. All five files being modified are well-established markdown documents with clear precedents in the codebase. The pattern for every modification type exists in already-shipped phases (78, 81 for playbook; every prior milestone close for ROADMAP/STATE/PROJECT).

---

## Metadata

**Analog search scope:** `.planning/phases/`, `.planning/milestones/`, `LOCATION-ONBOARDING.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/REQUIREMENTS.md`, `.planning/PROJECT.md`, `.planning/RETROSPECTIVE.md`
**Files scanned:** 14
**Pattern extraction date:** 2026-06-07
