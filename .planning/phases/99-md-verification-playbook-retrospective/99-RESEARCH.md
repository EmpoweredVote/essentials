# Phase 99: MD Verification + Playbook Retrospective — Research

**Researched:** 2026-06-07
**Domain:** Milestone verification, documentation retrospective, playbook update
**Confidence:** HIGH

---

## Summary

Phase 99 is a documentation and verification phase — no migrations, no new code, no new data. It has three discrete deliverables: (1) a final verification pass confirming all 26 v11.0 requirements pass SQL gates or UI spot-checks, (2) a LOCATION-ONBOARDING.md update adding an MD-specific section, and (3) closing the v11.0 milestone in ROADMAP.md, STATE.md, and PROJECT.md.

The v11.0 execution record is clear: Phases 91-98 are fully verified (every VERIFICATION.md shows `status: passed`), Phase 95 headshots are done, Phase 96 elections are done, Phases 97-98 stances are done. The only genuine outstanding items are Phase 90 Plan 03 (migration 272, POST-ELECTION-01/02) and the REQUIREMENTS.md checkboxes for MD-ELECTIONS-01/02/03 (which are satisfied in production but never updated to `[x]`). Phase 90 Plan 03 has already been written with correct migration number 272 and is ready to execute — it is NOT part of Phase 99 scope; it is its own plan in its own phase.

The playbook update is well-defined: MD introduces three patterns not yet in LOCATION-ONBOARDING.md — multi-member delegate districts with A/B/C subdistricts, State Treasurer appointed by General Assembly, and the mgaleg.maryland.gov headshot URL discovery method.

**Primary recommendation:** Plan Phase 99 as two plans — Plan 01 (verification sweep + REQUIREMENTS.md cleanup) and Plan 02 (playbook update + milestone close). Both are documentation-only; no DB access needed except for re-running verification queries.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Final requirement verification | Database | — | All 26 requirements verified via SQL gates against production Supabase |
| REQUIREMENTS.md checkbox update | Documentation | — | Stale `[ ]` entries for MD-ELECTIONS-01/02/03 need manual update |
| Playbook GOTCHA authoring | Documentation | — | LOCATION-ONBOARDING.md is a markdown file; no code change |
| Milestone close | Documentation | — | ROADMAP.md, STATE.md, PROJECT.md all need status updates |
| STATE.md migration counter | Documentation | — | Must reflect actual next migration after 90-03 runs |

---

## The 26 v11.0 Requirements: Current Status

This is the key input the planner needs to construct the verification task list.

### Requirements already verified by phase VERIFICATION.md files

| Requirement | Phase | Verified | Evidence |
|-------------|-------|----------|---------|
| MD-GEO-01 | 91 | VERIFIED | 91-VERIFICATION.md status=passed; 157 G4110 rows confirmed |
| MD-GEO-02 | 91 | VERIFIED | 91-VERIFICATION.md; 24 G4020 rows confirmed |
| MD-GEO-03 | 91 | VERIFIED | 91-VERIFICATION.md; 47 G5210 SLDU rows confirmed |
| MD-GEO-04 | 91 | VERIFIED | 91-VERIFICATION.md; 71 G5220 SLDL rows confirmed |
| MD-GEO-05 | 91 | VERIFIED | 91-VERIFICATION.md; 8 G5200 CD rows confirmed |
| MD-GEO-06 | 91 | VERIFIED | 3-address smoke test passed (Baltimore, Garrett rural, Leonardtown) |
| MD-GOV-01 | 92 | VERIFIED | 92-VERIFICATION.md status=passed; 5 chambers seeded, State Treasurer is_appointed=true |
| MD-GOV-02 | 92 | VERIFIED | 92-VERIFICATION.md; Moore/Miller/Brown/Lierman/Davis headshots confirmed |
| MD-GOV-03 | 93 | VERIFIED | 93-VERIFICATION.md 11/11 pass; 47 senators confirmed in SUMMARY |
| MD-GOV-04 | 93 | VERIFIED | 93-VERIFICATION.md; 141 delegates (140 active + 1 vacant) confirmed |
| MD-GOV-05 | 93 | VERIFIED | 93-VERIFICATION.md; 8 House reps + 2 senators confirmed |
| MD-GOV-06 | 94 | VERIFIED | 94-VERIFICATION.md; 0-gap query: 202/202 non-vacant officials have default images |
| MD-DEEP-01 | 95 | VERIFIED | 95-VERIFICATION.md; St. Mary's County government + chambers seeded |
| MD-DEEP-02 | 95 | VERIFIED | 95-VERIFICATION.md; 5 commissioners seeded with headshots |
| MD-DEEP-03 | 95 | VERIFIED | 95-VERIFICATION.md; Leonardtown Mayor + 5 council seeded with headshots |
| MD-ELECTIONS-01 | 96 | VERIFIED | 96-VERIFICATION.md 9/9; 130 race rows, 0 NULL office_ids |
| MD-ELECTIONS-02 | 96 | VERIFIED | 96-VERIFICATION.md; 2 discovery_jurisdictions rows with correct dates |
| MD-ELECTIONS-03 | 96 | VERIFIED | 96-VERIFICATION.md; Landing.jsx line 24 MD entry confirmed |
| MD-STANCES-01 | 97 | VERIFIED | 97-04-SUMMARY.md; 5 exec stances (migration 282), all cited |
| MD-STANCES-02 | 97 | VERIFIED | 97-04-SUMMARY.md; 47 senators all covered, all cited |
| MD-STANCES-03 | 98 | VERIFIED | 98-07-SUMMARY.md; Q-PHASE-1=140 delegates, all cited |
| MD-STANCES-04 | 98 | VERIFIED | 98-07-SUMMARY.md; 5/6 UI profiles PASS (Brooks NOT FOUND is not a data issue) |

[VERIFIED: project codebase — all VERIFICATION.md files read directly]

### Requirements with outstanding issues

| Requirement | Phase | Status | Issue |
|-------------|-------|--------|-------|
| UI-01 | 90 | Plans done, Phase 90 incomplete | 90-03-PLAN.md not yet executed; UI work itself is complete and human-approved; no VERIFICATION.md for Phase 90 |
| UI-02 | 90 | Plans done, Phase 90 incomplete | Same — showLabels=false wired and approved; phase closure pending 90-03 |
| POST-ELECTION-01 | 90 | Not yet executed | 90-03-PLAN.md targets migration 272 (correct number); ME primary winners not yet added to race_candidates |
| POST-ELECTION-02 | 90 | Not yet executed | 90-03-PLAN.md lavote.gov update — conditional on Nov 2026 ID availability |

[VERIFIED: project codebase — v11.0-MILESTONE-AUDIT.md + 90-03-PLAN.md read directly]

### Key finding: Phase 90 Plan 03 is pre-written and ready

Plan 90-03-PLAN.md already exists with the correct migration number (272). It was written after the audit fixed the collision. This plan should be executed as part of Phase 90 close — NOT as part of Phase 99. Phase 99 should verify its output after it runs.

The planner must decide: does Phase 99 depend on Phase 90 Plan 03 completing first, OR does Phase 99 document that UI-01/02/POST-ELECTION-01/02 are verified by reference to Phase 90 summaries? Given that Phase 90 Plan 03 execution is time-sensitive (ME primary was June 9), it likely runs before Phase 99 planning begins.

### REQUIREMENTS.md checkbox stale entries

REQUIREMENTS.md still shows `[ ]` for MD-ELECTIONS-01, MD-ELECTIONS-02, MD-ELECTIONS-03 even though 96-VERIFICATION.md confirms all three satisfied. These need manual update in Phase 99 Plan 01.

The REQUIREMENTS.md traceability table also shows "Pending" for MD-GOV-03/04/05 (Phase 93) and all Phase 97-98 requirements. Phase 99 Plan 01 should update all checkbox entries to match reality.

---

## MD-Specific GOTCHAs Not Yet in Playbook

This section directly answers "what does LOCATION-ONBOARDING.md need that it doesn't have?"

The existing playbook covers: CA, OR, ME, MA, and TX patterns. Maryland is entirely absent. The following patterns emerged during v11.0 execution.

### GOTCHA 1: Multi-member delegate districts — 3 delegates per TIGER polygon

**Pattern:** MD House of Delegates has 47 geographic districts, but 141 delegate positions. Most districts have 3 delegates who all share the same SLDL polygon. A single TIGER G5220 polygon row covers 3 politicians.

**Modeling:** Use a single `district_id` (linked to the polygon) for all 3 delegates in a whole-numbered district. The office uniqueness key is `(district_id, politician_id)` NOT `(district_id, chamber_id)` — identical to the US Senate two-senators pattern.

**NOT EXISTS guard:** The WHERE NOT EXISTS guard for delegate INSERTs must check `(district_id, politician_id)` — NOT `(district_id, chamber_id)`. Using chamber_id as the discriminator would block the 2nd and 3rd delegate INSERTs.

**Sub-district exception:** Districts with A/B or A/B/C sub-designations have separate TIGER polygons (e.g., District 47A and 47B each have their own polygon row). These sub-districts have 2 or 3 delegates split between them, not all 3 on one polygon.

**Count math:** 47 districts × 3 = 141 but TIGER loads only 71 SLDL polygons (whole districts collapse to 1 polygon; A/B sub-districts get 2 polygons). The discrepancy (141 delegates, 71 polygons) is correct — it is not a data error.

[VERIFIED: project codebase — STATE.md "Key MD Facts" + 93-SUMMARY files]

### GOTCHA 2: A/B (and A/B/C) sub-district handling

**Pattern:** Some MD districts are subdivided (e.g., District 42 → 42A + 42B + 42C; District 43 → 43A + 43B). Each subdistrict is its own TIGER polygon, its own district row, and has 2-3 delegates.

**District numbering:** The TIGER G5220 district_id format for sub-districts is the same geo_id system but with the alphabetic suffix implied by the polygon itself. Whole districts (e.g., District 3, District 8) have one polygon covering the full numbered area.

**Headshot URL edge case:** mgaleg.maryland.gov URL discovery for delegates uses the delegate's last name as the key. For compound last names (e.g., Lewis Young → `young04`, Fry Hester → `hester01`, White Holland → `white01`, Fraser-Hidalgo → `fraser01`, Palakovich Carr → `palakovich01`), the pattern is inconsistent — first word vs. last word varies by person. Always scrape the roster HTML page to find the actual `img src` URL; do NOT guess the suffix number.

[VERIFIED: project codebase — STATE.md "Accumulated Context" mgaleg compound last name patterns]

### GOTCHA 3: State Treasurer appointed by General Assembly (not voters)

**Pattern:** Maryland's State Treasurer is elected by the General Assembly, not by voters. This is different from Oregon (all 5 officers voter-elected) and similar to Maine (AG/SoS/Treasurer legislature-elected).

**Schema impact:** `is_appointed_position=true` on the State Treasurer chamber. Zero race rows for this office. No discovery_jurisdictions entry.

**Do not confuse:** Maryland Governor, LG, AG, and Comptroller ARE voter-elected. Only the Treasurer is legislature-elected. The AG in Maryland (Anthony Brown) IS on the ballot — do not copy Maine's pattern of treating the AG as appointed.

**Full MD constitutional officer list:**
- Governor (Wes Moore) — voter-elected
- Lieutenant Governor (Aruna Miller) — voter-elected  
- Attorney General (Anthony Brown) — voter-elected
- Comptroller (Brooke Lierman) — voter-elected
- State Treasurer (Dereck Davis) — General Assembly-elected, is_appointed_position=true

[VERIFIED: project codebase — STATE.md + 92-VERIFICATION.md]

### GOTCHA 4: mgaleg.maryland.gov headshot URL discovery

**Pattern:** The Maryland General Assembly website (mgaleg.maryland.gov) hosts official portraits for all 47 senators and 141 delegates. The URL structure is not guessable — the suffix number (senator01, senator02, senator03, etc.) requires probing.

**Discovery method:** Scrape the roster page HTML for the chamber to find actual `img src` values. HEAD probing alone misses delegates with higher suffix numbers (e.g., `jackson04`, `watson04`, `harris03`, `young04`).

**URL pattern:** `https://mgaleg.maryland.gov/mgaleg-sys/images/officials/[year]/[lastname][NN].jpg`

**Senators:** Straightforward — one senator per district, filename is `{lastname}01` in most cases.

**Delegates:** More complex due to the compound-last-name pattern described in GOTCHA 2.

**Special case:** Joseline Peña-Melnyk — file is `pena.jpg` (strips the Melnyk suffix and the tilde). Jacobs J. headshot filename has a space: `jacobs j.jpg` → URL-encode as `jacobs%20j.jpg`.

**Bucket:** Headshots upload to the `politician_photos` bucket (NOT `politician-headshots` — that bucket does not exist). Path pattern: `{politician_id}-headshot.jpg`.

[VERIFIED: project codebase — STATE.md "Accumulated Context"]

### GOTCHA 5: Baltimore City dual-tier

**Pattern:** Baltimore City is both a G4110 incorporated place (geo_id=`2404000`) AND a G4020 independent city-county (geo_id=`24510`). Any Baltimore City address returns BOTH rows — similar to SF's consolidated city-county, but using a G4020 (county-level) row instead of a second G4110.

**Assertion:** Smoke tests for Baltimore must assert BOTH `geo_id='2404000'` (G4110) AND `geo_id='24510'` (G4020) are present. An assertion of "exactly one local row" would fail incorrectly.

[VERIFIED: project codebase — STATE.md "Accumulated Context" Baltimore City dual-tier confirmed]

### GOTCHA 6: REQUIREMENTS.md stale checkbox trap

**Stale entries to fix in Phase 99:**
- MD-ELECTIONS-01: `[ ]` → `[x]` (96-VERIFICATION.md confirmed satisfied)
- MD-ELECTIONS-02: `[ ]` → `[x]` (96-VERIFICATION.md confirmed satisfied, with deviation note on cron_active column)
- MD-ELECTIONS-03: `[ ]` → `[x]` (96-VERIFICATION.md confirmed satisfied)
- Traceability table: MD-ELECTIONS-01/02/03 → "Pending" → "Complete"
- Traceability table: MD-STANCES-01/02/03/04 → "Pending" → "Complete"
- Traceability table: MD-GOV-03/04/05 → "Pending" → "Complete"

[VERIFIED: project codebase — REQUIREMENTS.md read directly; 96-VERIFICATION.md confirms satisfaction]

---

## Maryland Quick Reference Block (for Playbook)

This is the content to add to LOCATION-ONBOARDING.md as a new "Maryland Quick Reference" section parallel to the existing California Quick Reference and Oregon Quick Reference sections.

```
## Maryland Quick Reference

**Read this before starting any MD city or state work.**

| Trap | See Step | One-Line Summary |
|------|----------|-----------------|
| Multi-member delegate districts | Step 5, 6 | 47 TIGER SLDL polygons cover 141 delegates; 3 per whole-district polygon; NOT EXISTS guard uses (district_id, politician_id) |
| A/B subdistrict polygons | Step 5 | Districts with A/B/C suffix have separate polygons; 71 total TIGER polygons (not 47 or 141) |
| State Treasurer appointed by GA | Step 5 | Treasurer is legislature-elected: is_appointed_position=true, zero race rows; AG/Gov/LG/Comptroller ARE voter-elected |
| mgaleg headshot URL discovery | Step 4 | Scrape roster page HTML for img src — HEAD probing misses higher suffix numbers (jackson04, young04, etc.) |
| Compound last-name mgaleg keys | Step 4 | Lewis Young→young04, White Holland→white01, Fraser-Hidalgo→fraser01 — pattern varies; always scrape to confirm |
| Baltimore City dual-tier | Step 3 | Like SF: returns G4110 (2404000) AND G4020 (24510) — assert BOTH in smoke tests |
| politician_photos bucket | Step 7 | Upload to 'politician_photos' bucket (NOT 'politician-headshots' — does not exist) |
| Peña-Melnyk headshot filename | Step 4 | mgaleg uses pena.jpg (strips Melnyk suffix and tilde); Jacobs J. filename has space → URL-encode |
| MD-GOV-04 NOT EXISTS guard | Step 6 | Multi-member district INSERT must guard on (district_id, politician_id) NOT (district_id, chamber_id) |
| discovery_jurisdictions cron_active | Step 6 | MD discovery_jurisdictions has no cron_active column; date-based eligibility is the correct mechanism |
| REQUIREMENTS.md cron_active wording | — | MD-ELECTIONS-02 requirement text says "cron_active=true" — stale; this column does not exist |
```

**Maryland Key Facts:**
- FIPS: 24 (state='24' in geofence_boundaries; districts.state='md' for STATE/COUNTY tiers, 'MD' for NATIONAL)
- TIGER SLDL: 71 polygons (not 47 or 141 — sub-districts create extra polygons)
- TIGER SLDU: 47 polygons (1 per senate district)
- Legislature: 47 senators + 141 delegates (3 per whole district, split for A/B/C sub-districts)
- Constitutional officers (voter-elected): Governor, LG, AG, Comptroller
- State Treasurer: General Assembly-elected (is_appointed_position=true; NO race rows)
- Legislature headshots: mgaleg.maryland.gov/mgaleg-sys/images/officials/{year}/{lastname}{NN}.jpg
- Executive headshots: governor.maryland.gov official portraits (600x750 standard)
- Federal headshots: congress.gov primary + Wikimedia Commons fallback
- External ID scheme: exec -240001..-240005, senators -2410001..-2410047, delegates -2420001..-2420141, US House -2440001..-2440008
- US senators pre-existed under -400033 (Van Hollen) / -400034 (Alsobrooks)
- Elections site: elections.maryland.gov
- Legislature site: mgaleg.maryland.gov

---

## What the Planner Needs to Know

### Plans Structure

Phase 99 should be 2 plans based on the precedent from Phase 78 (CA retrospective) and Phase 81 (OR retrospective):

**Plan 99-01: Verification Sweep + REQUIREMENTS.md Cleanup**
- Re-run key SQL verification queries against production for all 26 requirements
- For already-verified requirements (22/26): a lightweight re-confirm using the same SQL from the respective VERIFICATION.md
- For Phase 90 (UI-01, UI-02, POST-ELECTION-01, POST-ELECTION-02): verify Phase 90 Plan 03 has been executed; reference 90-03-SUMMARY.md
- Update REQUIREMENTS.md checkboxes: MD-ELECTIONS-01/02/03, MD-STANCES-01/02/03/04, MD-GOV-03/04/05 → all `[x]`
- Update traceability table: all "Pending" → "Complete" for executed requirements
- Document any remaining known deviations (cron_active wording stale, MD-GOV-01 "4 chambers" vs actual 5)

**Plan 99-02: Playbook Update + Milestone Close**
- Add "Maryland (state)" row to Cities Onboarded table in LOCATION-ONBOARDING.md
- Add "Leonardtown" row to Cities Onboarded table
- Add "## Maryland Quick Reference" section with the GOTCHAs catalogued above
- Add MD-specific GOTCHA blocks inline within Steps 1-7 (following the existing pattern: `> [GOTCHA] **[STATE-SPECIFIC: MD] ...`)**
- Add MD-specific entries to Step 7 Common Pitfalls table
- Update ROADMAP.md v11.0 status: `🚧` → `✅` with shipped date
- Update STATE.md milestone and status fields
- Update PROJECT.md (check if it exists at .planning/PROJECT.md)

### Verification Query Strategy

The planner does NOT need to re-execute all migrations. The verification pass re-runs lightweight SELECT counts against production. The existing VERIFICATION.md files provide the exact SQL queries to re-use.

**For each requirement, the verification query is:**

| Requirement | Verification Query Type |
|-------------|------------------------|
| MD-GEO-01..06 | SELECT COUNT(*) FROM geofence_boundaries WHERE state='24' AND mtfcc IN (...) — already in 91-VERIFICATION.md |
| MD-GOV-01 | SELECT COUNT(*) FROM chambers WHERE government_id = (MD govt UUID) — already in 92-VERIFICATION.md |
| MD-GOV-02 | SELECT COUNT(*) FROM politician_images WHERE politician_id IN (...exec UUIDs...) AND type='default' |
| MD-GOV-03 | SELECT COUNT(*) FROM politicians WHERE external_id BETWEEN -2410047 AND -2410001 |
| MD-GOV-04 | SELECT COUNT(*) FROM politicians WHERE external_id BETWEEN -2420141 AND -2420001 |
| MD-GOV-05 | SELECT COUNT(*) FROM politicians WHERE external_id IN (-400033,-400034) + BETWEEN -2440008 AND -2440001 |
| MD-GOV-06 | 0-gap query from 94-02-SUMMARY.md (exact SQL reproduced there) |
| MD-DEEP-01..03 | SELECT COUNT(*) for St. Mary's County + Leonardtown governments/chambers/politicians |
| MD-ELECTIONS-01 | SELECT COUNT(*) FROM races WHERE ... MD general 2026 = 130 |
| MD-ELECTIONS-02 | SELECT COUNT(*) FROM discovery_jurisdictions WHERE state='MD' |
| MD-ELECTIONS-03 | Read src/pages/Landing.jsx to confirm MD entry present |
| MD-STANCES-01..03 | Q-PHASE-1 style queries from 97/98 SUMMARY files |
| MD-STANCES-04 | Reference 98-07-UAT.md (already human-verified) |
| UI-01/02 | Reference 90-02-SUMMARY.md (already human-verified) |
| POST-ELECTION-01/02 | Reference 90-03-SUMMARY.md (to be executed) |

### Current Migration Counter

STATE.md line 58 reads: "Next migration: 278" — this is STALE [VERIFIED: STATE.md read directly].

The actual situation after all phases 90-98:
- Migration 272: 90-03 (ME winners + lavote update) — written but NOT yet applied
- Migration 278: 96-01 (MD 2026 elections) — applied
- Migration 292: 98-07 (MD delegates batch G) — applied per 98-07-SUMMARY.md

The current next migration number is **293**. The STATE.md "Next migration" field was bumped to 273 by Plan 90-03 instructions (after 272 applies). Given migration 292 is the last applied migration, the correct current value is 293. Phase 99 Plan 01 should confirm this via `SELECT MAX(version) FROM supabase_migrations.schema_migrations` and update STATE.md accordingly.

[VERIFIED: project codebase — 90-03-PLAN.md (migration 272 target) + 98-07-SUMMARY.md (migration 292 applied) + STATE.md ("Next migration: 278" stale)]

### Files to Modify in Phase 99

| File | What to Change |
|------|---------------|
| `LOCATION-ONBOARDING.md` | Add MD to Cities Onboarded table (2 rows); add ## Maryland Quick Reference section; add [GOTCHA] blocks inline in Steps 1-7; add MD pitfall rows to Step 7 table |
| `.planning/REQUIREMENTS.md` | Update MD-ELECTIONS-01/02/03 + MD-STANCES-01/02/03/04 + MD-GOV-03/04/05 checkboxes and traceability table |
| `.planning/ROADMAP.md` | Change `🚧 **v11.0 Maryland Essentials**` to `✅` with shipped date; update Phase 99 entry with plans/completion |
| `.planning/STATE.md` | Update milestone, status, progress, current position, "Next migration" counter |
| `.planning/PROJECT.md` | If exists: update current milestone and completion notes |

No migrations. No code changes. No new data.

---

## Patterns from Prior Retrospective Phases

These precedents tell the planner exactly how to structure the plans.

**Phase 45 (MA Playbook Retrospective):** 2 plans — Plan 01 GOTCHA extraction, Plan 02 milestone close.
**Phase 56 (ME Playbook Retrospective):** 2 plans — Plan 01 playbook update, Plan 02 milestone close.
**Phase 78 (CA Playbook Retrospective):** 2 plans — Plan 01 playbook update (7 Cities Onboarded rows + CA Quick Reference + 11 CA GOTCHAs), Plan 02 milestone close.
**Phase 81 (OR Playbook Retrospective):** 2 plans — Plan 01 playbook update (OR Quick Reference + 9 OR GOTCHAs), Plan 02 milestone close.

**Pattern:** Playbook update always in Plan 01. Milestone close (ROADMAP + STATE + PROJECT) always in Plan 02. Phase 99 should follow this pattern.

[VERIFIED: project codebase — ROADMAP.md plan lists for Phases 45/56/78/81 read directly]

---

## Common Pitfalls for This Phase

### Pitfall 1: Over-verifying already-verified requirements
**What goes wrong:** The planner schedules full re-execution of verification queries for all 22 already-verified requirements, making Plan 01 a 45-minute slog.
**Prevention:** For requirements with existing VERIFICATION.md files showing `status: passed`, a single lightweight re-confirm (one SELECT COUNT(*)) is sufficient. Reserve detailed re-checking for the 4 Phase 90 requirements.

### Pitfall 2: Missing REQUIREMENTS.md stale checkboxes
**What goes wrong:** Phase 99 closes the milestone but REQUIREMENTS.md still shows 9+ unchecked requirements, creating false impression of incomplete work.
**Prevention:** Plan 01 must explicitly update ALL stale `[ ]` entries and traceability "Pending" entries. This is a documentation task, not a data task.

### Pitfall 3: STATE.md migration counter still wrong after Phase 99
**What goes wrong:** STATE.md "Next migration" is updated to 273 (by Phase 90 Plan 03) but doesn't reflect that migrations 278-292 have since been applied.
**Prevention:** Plan 01 task: query `SELECT MAX(version) FROM supabase_migrations.schema_migrations` and set STATE.md "Next migration" to the result + 1 (expected: 293).

### Pitfall 4: Phase 90 Plan 03 treated as Phase 99 scope
**What goes wrong:** Planner folds execution of migration 272 (ME winners) into Phase 99 instead of Phase 90.
**Prevention:** Phase 90 Plan 03 is its own plan in its own phase directory. Phase 99 only verifies its output. If it hasn't run yet, Phase 99 depends on it completing first.

### Pitfall 5: Playbook GOTCHA for MD omits the distinct sub-district polygon pattern
**What goes wrong:** The GOTCHA says "47 districts" but doesn't explain the 71-polygon / 141-delegate mapping, leading future agents to the same confusion that Phase 93 encountered.
**Prevention:** The GOTCHA must explicitly state: 71 TIGER SLDL polygons, 141 delegate positions, 3 per whole-district polygon; sub-districts have separate polygons; NOT EXISTS guard uses (district_id, politician_id).

---

## Open Questions (RESOLVED)

All three open questions identified during the 2026-06-07 research session were resolved before Phase 99 planning was finalized. Resolution markers are inlined below.

1. **Has Phase 90 Plan 03 (migration 272) been executed?**
   - What we know: The plan exists at `.planning/phases/90-post-election-follow-up-minicompass-ui/90-03-PLAN.md` with correct migration 272 target. The ME primary was June 9, 2026 (today is June 7 per system context).
   - What's unclear: As of the time this research was written (June 7), June 9 has NOT yet passed. Plan 03 cannot execute until after primary results are known.
   - Recommendation: Phase 99 planning should assume Plan 90-03 will be complete before Phase 99 executes. If not, Phase 99 Plan 01 must note that POST-ELECTION-01/02 and UI-01/02 are verified by reference to Phase 90 summaries, not by a Phase 99 query.
   - > **RESOLVED (2026-06-09+):** The June 9 ME primary has now passed (current date is June 9 or later as of plan revision), so Phase 90 Plan 03 is unblocked and resolvable. Even in the case where 90-03 has not yet been executed when Phase 99 runs, the DEFER fallback in Plan 99-01 Task 1 explicitly handles missing 90-03-SUMMARY.md by recording UI-01/UI-02/POST-ELECTION-01/POST-ELECTION-02 as `status: DEFER` (not `FAIL`) and not blocking milestone close. Acceptance criteria already enforce this DEFER pathway.

2. **Does .planning/PROJECT.md exist?**
   - What we know: STATE.md references it: "See: .planning/PROJECT.md (updated 2026-06-04 after v10.0 milestone archival)".
   - What's unclear: Content not read in this research session.
   - Recommendation: Plan 02 task should read PROJECT.md first before writing updates.
   - > **RESOLVED (2026-06-09):** Confirmed via STATE.md reference — `.planning/PROJECT.md` exists and was last updated 2026-06-04 after v10.0 milestone archival. Plan 99-02 Task 2 lists PROJECT.md in its `<files>` and `<read_first>` (lines 1-10 for "What This Is" paragraph; lines 110-120 for Validated section append-point; lines 127-145 for Current Milestone block), so the executor reads it before writing updates. No further action required.

3. **Benjamin Brooks NOT FOUND in UI — should this be documented as a known gap?**
   - What we know: 98-07-SUMMARY.md notes Benjamin Brooks has no office record in app UI; marked as not a stances data quality issue.
   - What's unclear: Is this a missing office row that should be fixed, or is Brooks correctly not showing?
   - Recommendation: Include in Plan 01 as an INFO note with a verification query; flag for human decision on whether a fix migration is needed. Do not block milestone close on this.
   - > **RESOLVED (2026-06-09):** Plan 99-01 Task 1's MD-STANCES-04 row instruction already cites 98-07-UAT.md "5/6 UI profiles PASS" and explicitly states `Note Brooks NOT-FOUND as INFO per RESEARCH.md Open Question 3 — does not block PASS`. The INFO note path is wired into the verification matrix as designed; no separate gap entry needed. Brooks NOT-FOUND is documented as a known UI observation, not a stances data defect, and does not gate milestone close.

---

## Environment Availability

Phase 99 is documentation-only (SQL selects + markdown edits). No migrations, no code changes, no scripts.

| Dependency | Required By | Available | Fallback |
|------------|------------|-----------|---------|
| mcp__supabase-local | Verification queries (SELECT only) | Yes — production DB | — |
| Text editor | LOCATION-ONBOARDING.md, REQUIREMENTS.md | Yes | — |
| .planning/PROJECT.md | Plan 02 milestone close | To be verified | STATE.md already handles most milestone data |

---

## Sources

### Primary (HIGH confidence)
- `.planning/STATE.md` — accumulated context, migration counter, MD facts, external ID scheme
- `.planning/REQUIREMENTS.md` — all 26 requirement IDs and traceability table
- `.planning/ROADMAP.md` — phase structure, prior retrospective patterns (Phases 45/56/78/81)
- `.planning/phases/9*/9*-VERIFICATION.md` — all phase verification results read directly
- `.planning/phases/98-md-compass-stances-house-delegates-wave-2/98-07-SUMMARY.md` — final delegate stances, 2171 total rows
- `.planning/phases/94-md-headshots/94-02-SUMMARY.md` — 0-gap headshot verification, 202/202
- `.planning/phases/96-md-2026-elections-discovery-pipeline-landing/96-VERIFICATION.md` — elections verification 9/9
- `LOCATION-ONBOARDING.md` — current state of playbook, existing section structure
- `.planning/v11.0-MILESTONE-AUDIT.md` — audit findings, blockers, integration issues

### Secondary (MEDIUM confidence)
- `.planning/phases/90-post-election-follow-up-minicompass-ui/90-03-PLAN.md` — migration 272 spec, Phase 90 Plan 03 status

---

## Metadata

**Confidence breakdown:**
- Requirement status: HIGH — all VERIFICATION.md files read directly
- Playbook GOTCHAs: HIGH — all sourced from STATE.md accumulated context and SUMMARY files
- Migration counter: MEDIUM — derived from last applied (292) + known pending (272); direct DB query in Plan 01 will confirm
- Open questions: All three RESOLVED during 2026-06-09 plan revision; see "## Open Questions (RESOLVED)" section above.

**Research date:** 2026-06-07
**Resolutions added:** 2026-06-09 (during Phase 99 plan revision pass)
**Valid until:** Phase 99 planning (no external sources — all internal project knowledge)
