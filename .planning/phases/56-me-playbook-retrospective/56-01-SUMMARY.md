---
phase: 56
plan: 01
subsystem: documentation
tags: [playbook, retrospective, maine, onboarding, templates, state-machine]
requires: [49-me-geofences, 50-me-government-db, 51-me-federal-officials, 52-me-state-legislature, 53-portland-city-structure, 54-me-city-officials-tiers-2-4, 55-me-2026-elections]
provides: [updated-playbook-with-9-gotchas, maine-entries-in-cities-table, 5-updated-templates, state-md-generalized-entries]
affects: [56-02-verification, future-state-onboardings]
tech-stack:
  added: []
  patterns: [problem-solution-example framing, multi-tier seeding, PowerShell NoBOM generator]
key-files:
  created: [.planning/phases/56-me-playbook-retrospective/56-01-SUMMARY.md]
  modified:
    - LOCATION-ONBOARDING.md
    - .planning/templates/db-foundation.md
    - .planning/templates/officials-seed.md
    - .planning/templates/headshots.md
    - .planning/templates/elections-seed.md
    - .planning/templates/discovery-setup.md
    - .planning/STATE.md
key-decisions:
  - GOTCHA placement inline at step (not summary section) — per locked CONTEXT.md decision
  - Problem+solution+example framing for all generalized entries — prevents overgeneralization
  - [STATE-SPECIFIC] tag on TIGER cd119 and G4110/G4040 items (Maine outliers)
  - Migration 182 status left as pending (DATABASE_URL unavailable for psql check)
  - PowerShell generator pattern in officials-seed.md (not a separate template file)
duration: "10 minutes"
completed: 2026-05-20
---

# Phase 56 Plan 01: ME Playbook Retrospective — Documentation Update Summary

**One-liner:** Updated LOCATION-ONBOARDING.md with 9 inline Maine GOTCHAs + 7 Cities Onboarded rows; added multi-tier seeding, PowerShell NoBOM generator, and Compass/Treasury stubs; promoted 5 STATE.md schema decisions to problem+solution+example form; updated all 5 phase templates with Maine patterns.

---

## Performance

All 3 tasks completed without deviations. Documentation-only phase — no migrations, no code changes.

---

## Accomplishments

### Task 1: LOCATION-ONBOARDING.md

- Added 9 GOTCHA callouts inline at correct steps (per locked CONTEXT.md decision — no summary section):
  1. `slug` GENERATED column on chambers (Step 6 step 3)
  2. `governments` no unique constraint + WHERE NOT EXISTS + Maine UUID example (Step 6 step 2)
  3. Senator uniqueness key `(district_id, politician_id)` (Step 5)
  4. Legislature-elected offices = is_appointed + no race rows (Step 5 + Step 6 step 4)
  5. TIGER cd119 naming `[STATE-SPECIFIC]` (Step 3)
  6+9. `districts.state` casing via abbrev/abbrevUpper (Step 3, consolidated from items 6+9)
  7. RCV election_method on chamber row (Step 2)
  8. G4110 vs G4040 COUSUB `[STATE-SPECIFIC: Maine]` (Step 3)
- Added state-level onboarding context paragraph at Step 3 (Maine Phase 49-01 as example)
- Cities Onboarded table: added Portland + Lewiston + Bangor + South Portland + Auburn + Biddeford + Maine (state) — 7 new rows
- Multi-tier seeding pattern (Tier 1/2/3-4 + GAPS.md rule) at Step 6 step 5
- PowerShell bulk-seed generator pattern at Step 6 step 5
- Compass + Treasury Tracker stub sections at end of file with `[TO BE COMPLETED BY ...]` ownership tags
- Updated Checklist Summary to reference new GOTCHAs and state-level onboarding requirements
- All Cambridge example blockquotes preserved

### Task 2: 5 Phase Templates

**db-foundation.md:**
- Senator Office Uniqueness section (problem + solution + Maine example with Collins/King migration 170)
- Legislature-Elected Offices section (is_appointed + no race rows + state research guidance)

**officials-seed.md:**
- Multi-Tier City Seeding Strategy section (Tier 1/2/3-4 + GAPS.md requirement + ME prefixes)
- PowerShell Bulk-Seed Generator Pattern section (full code snippet + UTF-8 NoBOM encoding rule)
- essentials.offices/politicians Schema Gotchas section (no seat_label, no email col, no short_label, UPDATE pattern)

**headshots.md:**
- State Legislature Headshot Sourcing section (derivable vs UUID-per-rep, Maine Senate + House examples)
- Thumbnail Upscaling section (user approval rule, Lanczos + unsharp mask, 152×202→600×750 Maine example)

**elections-seed.md:**
- RCV chamber GOTCHA (election_method on chamber, not race) inline after Valid Values table
- Legislature-Elected Offices = No Race Rows section (Frey/Bellows/Perry zero race rows)
- Scale Patterns section (PowerShell for 100+ rows, no cron_active column, district-type disambiguation)

**discovery-setup.md:**
- State-Level Discovery section (geoid = state FIPS, one row per state+election_date pair)
- Discovery at Scale section (sequential processing, no cron_active column, 380 ME rows example)

### Task 3: STATE.md

- 5 Key Decisions promoted to problem+solution+example form:
  1. Senator uniqueness key
  2. Legislature-elected offices (AG/SoS/Treasurer)
  3. G4110 vs G4040 COUSUB (MA + Maine combined into one generalized entry)
  4. TIGER cd119 naming [STATE-SPECIFIC trap]
  5. districts.state casing (abbrev/abbrevUpper)
- Pending Todos audited:
  - Migration 171: labeled `[LA backlog]` — genuinely unfinished LA work
  - Migration 182: labeled `[DB pending verification]` — DATABASE_URL unavailable; manual check required
  - Post-June-9 follow-up: labeled `[ME TIME-SENSITIVE]` with explicit target (week of 2026-06-09) and migration 185 action
  - CA items: labeled `[CA backlog]` and `[CA operational note]`
- Current Position updated to Phase 56 In Progress, Plan 1/2 complete
- Session Continuity updated

---

## Task Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 9cd62d4 | feat(56-01): update LOCATION-ONBOARDING.md with 9 Maine GOTCHAs + Maine cities + Compass/Treasury stubs |
| 2 | 8be8e63 | feat(56-01): update 5 phase templates with Maine patterns |
| 3 | 6a9db89 | feat(56-01): promote Maine schema decisions in STATE.md to generalized entries; audit pending todos |

---

## Files Created

- `.planning/phases/56-me-playbook-retrospective/56-01-SUMMARY.md` (this file)

## Files Modified

- `LOCATION-ONBOARDING.md` — +60/-7 lines (9 GOTCHAs, 7 Cities Onboarded rows, multi-tier/PowerShell patterns, Compass/Treasury stubs, updated Checklist Summary)
- `.planning/templates/db-foundation.md` — +46 lines (Senator Uniqueness + Legislature-Elected sections)
- `.planning/templates/officials-seed.md` — +90 lines (Multi-Tier, PowerShell, Schema Gotchas sections)
- `.planning/templates/headshots.md` — +45 lines (Legislature Headshot Sourcing + Thumbnail Upscaling sections)
- `.planning/templates/elections-seed.md` — +50 lines (RCV GOTCHA, Legislature-Elected section, Scale Patterns section)
- `.planning/templates/discovery-setup.md` — +40 lines (State-Level Discovery + Discovery at Scale sections)
- `.planning/STATE.md` — +18/-14 lines (5 Key Decisions generalized, Pending Todos audited, Current Position + Session updated)

---

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| GOTCHAs placed inline at steps, not in summary section | CONTEXT.md locked decision — prevents "read reference section after hitting problem" trap |
| [STATE-SPECIFIC] tag on cd119 and G4110/G4040 | These are Maine outliers; other states may differ; tag prompts verification not blind copying |
| PowerShell pattern in officials-seed.md (not a new template file) | Pattern is short enough to fit inline; separate file would be sparse |
| Compass/Treasury as stub sections with ownership tags | Phase 56 writes the scaffold; respective teams author content; avoids blank sections that look forgotten |
| Migration 182 kept as pending (not removed) | DATABASE_URL unavailable during audit; safer to leave as [needs verification] than assume applied |
| G4110 + G4040 MA and Maine entries combined | Same underlying problem — consolidating avoids duplicate gotchas with different examples |
| Problem+solution+example framing for all STATE.md generalizations | Prevents overgeneralization (next state judges applicability from the problem description, not Maine values) |

---

## Deviations from Plan

None — plan executed exactly as written. All 3 tasks completed; all verification checks passed on first run.

---

## Issues Encountered

**Migration 182 DB check:** The plan specified a psql check to determine if migration 182 had been applied. `DATABASE_URL` was not set in the shell context at execution time, causing the psql command to fail. Following the plan's fallback instruction ("if psql check failed — keep with note"), migration 182 was labeled `[DB pending verification]` rather than removed. No blocking issue; manual verification can be done in any session with DB access.

---

## Next Phase Readiness

**Phase 56-02** (verification + readability review) is ready to execute. Prerequisites:
- LOCATION-ONBOARDING.md updated (this plan) ✓
- All 5 templates updated (this plan) ✓
- STATE.md generalized (this plan) ✓

Phase 56-02 will:
1. Run ME address smoke test (Portland, Bangor, rural address)
2. Confirm discovery sweep is active for both 2026 ME elections
3. Readability review: would Chris Andrews be able to onboard Missouri solo?
4. Confirm all 9 GOTCHAs are inline at correct steps (post-update audit)
