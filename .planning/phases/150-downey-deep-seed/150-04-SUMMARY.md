---
phase: 150-downey-deep-seed
plan: 04
subsystem: database
tags: [supabase, postgres, compass, stances, chairs-model, downey, la-county]

# Dependency graph
requires:
  - phase: 150-downey-deep-seed
    provides: "Plans 01-03: Downey structure + roster + headshots (migrations 990-993)"
  - phase: 149-pasadena-deep-seed
    provides: "Pasadena stance pattern — paired answers+context, $$dollar-quoting$$, ON CONFLICT DO UPDATE"
provides:
  - "Evidence-only compass stances for all 5 current Downey City Council members (migrations 994-998, AUDIT-ONLY)"
  - "23 total stance rows: Trujillo 5 / Sosa 6 / Frometa 3 / Pemberton 4 / Ortiz 5"
  - "100% citation: all stances paired with inform.politician_context (reasoning + real source URLs)"
  - "DWNY-01 satisfied end-to-end: government + roster + headshots + stances"
affects: [150-downey-deep-seed, 157-wave2-closeout]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Chairs model: 1-5 value = discrete position statement the evidence matches, NOT a polarity axis"
    - "Pre-tenure attribution discipline: votes/actions attributed ONLY to members seated at that time"
    - "Honest-blank discipline: thin records (Dec-2023 seated Pemberton/Ortiz) get many honest blanks — not padded"
    - "Topic_key lookup pattern: JOIN inform.compass_topics ON topic_key AND is_live=true (no hardcoded UUIDs)"

key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/994_mario_trujillo_stances.sql (AUDIT-ONLY)"
    - "C:/EV-Accounts/backend/migrations/995_hector_sosa_stances.sql (AUDIT-ONLY)"
    - "C:/EV-Accounts/backend/migrations/996_claudia_frometa_stances.sql (AUDIT-ONLY)"
    - "C:/EV-Accounts/backend/migrations/997_dorothy_pemberton_stances.sql (AUDIT-ONLY)"
    - "C:/EV-Accounts/backend/migrations/998_horacio_ortiz_stances.sql (AUDIT-ONLY)"
  modified: []

key-decisions:
  - "Chair 4 (not 5) for rent-regulation across all 5 Downey members: all oppose additional local caps while acknowledging state-law baseline (AB 1482) — not 'no regulation ever'"
  - "Frometa local-immigration left BLANK: her 2025 position is genuinely nuanced ('nothing we can do' vs 'terror ICE is instilling') and does not land cleanly on a single chair — no forced value"
  - "Trujillo transportation-priorities = 2 (multimodal/equal investment): 33.6-mile bike-lane commitment fits Chair 2 'invest equally in roads and multimodal options' not Chair 1 (pure transit-priority)"
  - "Ortiz homelessness = 5 (criminal penalties, existing services): 'The solution is not to provide more shelter' is Chair 5 for criminalization topic; homelessness-response = 4 (enforce + basic outreach) since he didn't explicitly call for eliminating all services"
  - "Sosa homelessness = 4 (prohibit encampments + basic shelter options): 4-step plan combines enforcement + nonprofit-delivered services"
  - "Migration numbering shifted: plan authored as 988-992 but those numbers were taken by state_exec_headshots batches — stances applied as 994-998 (on-disk authoritative per project convention)"

patterns-established:
  - "Downey enforcement-first homelessness cluster: Sosa 4 + Ortiz 5 (homelessness); Sosa 4 + Ortiz 4 (homelessness-response) — cross-check consistency"
  - "Local-immigration unanimous = 1: all 5 members (where attributed) co-voted for the 2025 ICE-raid special meeting + $25K protection fund"
  - "rent-regulation unanimous = 4: all 5 members oppose additional local caps beyond California state law"
  - "Thin-record pattern: members seated Dec 2023 (Pemberton 4 stances / Ortiz 5 stances) have extensive honest blanks on state/federal topics and unconfirmed local positions"

requirements-completed: [DWNY-01]

# Metrics
duration: 45min
completed: 2026-06-20
---

# Phase 150 Plan 04: Downey Stances Summary

**Evidence-only CHAIRS-model compass stances for all 5 current Downey City Council members — 23 stances across 5 officials, 100% cited, no defaults, no judicial topics, pre-tenure attribution discipline enforced (Jan 2021 rent-control vote attributed only to Trujillo + Frometa)**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-06-20
- **Completed:** 2026-06-20
- **Tasks:** 2 of 3 (Task 3 is checkpoint:human-verify — PAUSED)
- **Files created:** 5 migration files (audit-only, not registered)

## Accomplishments

- Applied evidence-only compass stances for all 5 current Downey officials (migrations 994-998, audit-only)
- 23 total stances: Trujillo 5 / Sosa 6 / Frometa 3 / Pemberton 4 / Ortiz 5
- 100% citation verified (0 uncited answers confirmed by SQL check)
- 0 judicial/non-live topic rows confirmed by SQL check
- Schema_migrations MAX = 992, unchanged — audit-only discipline maintained
- Pre-tenure attribution correctly applied: Jan 2021 rent-control vote attributed ONLY to Trujillo (Dec 2020) + Frometa (Dec 2018); Sosa/Pemberton/Ortiz scored from their OWN post-tenure statements
- Frometa's nuanced immigration position left blank per plan (not forced to a chair)

## Per-Member Stance Details

| Member | ext_id | Migration | Stances | Topics Populated |
|--------|--------|-----------|---------|-----------------|
| Mario Trujillo (D5) | -201200 | 994 | 5 | rent-regulation(4), public-safety(4), transportation(2), economic-dev(4), local-immigration(1) |
| Hector Sosa (D2/Mayor) | 675353 | 995 | 6 | rent-regulation(4), homelessness(4), homelessness-response(4), public-safety(4), local-immigration(1), economic-dev(4) |
| Claudia Frometa (D4/Mayor) | 675361 | 996 | 3 | rent-regulation(4), public-safety(4), housing(3) |
| Dorothy Pemberton (D3) | 675360 | 997 | 4 | rent-regulation(4), public-safety(4), homelessness-response(3), local-immigration(1) |
| Horacio Ortiz (D1/Mayor Pro Tem) | -700991 | 998 | 5 | homelessness(5), homelessness-response(4), rent-regulation(4), public-safety(4), local-immigration(1) |

## Honest Blanks (documented)

**All 5 members — blank for state/federal topics:** abortion, trans-athletes, school-vouchers, civil-rights, same-sex-marriage, fossil-fuels, climate-change, healthcare, taxes, voting-rights, social-security, ukraine-support, tariffs, etc. City councilmembers have no documented positions on these.

**Frometa (medium record):**
- `local-immigration`: BLANK — genuinely nuanced. She said both "There is nothing we can do as local government" AND "The terror that ICE is instilling in our neighborhoods by racially profiling members of our community should not be happening." These statements point in different directions (helplessness vs. condemnation); forcing either Chair 1 or Chair 3+ would misrepresent her actual position. Honest blank per plan spec.
- `homelessness`/`homelessness-response`: No documented enforcement-specific statements beyond general pro-police stance → blank
- `economic-development`: No documented position on specific incentive approaches → blank

**Pemberton (thin Dec-2023 record):**
- `homelessness`: No documented statement on criminalization specifically → blank (has homelessness-response from outreach/housing Q&A)
- `economic-development`, `transportation`, `local-immigration` (beyond co-vote): thin record → blanks for topics beyond the 4 cited
- All state/federal topics: blank

**Ortiz (thin Dec-2023 record):**
- `transportation-priorities`: "Undecided on fare-free transit; willing to explore options" — undecided is not a documentable chair → BLANK
- `economic-development`: No documented position → blank
- `cannabis`: Opposes commercial dispensaries (2023 Q&A) but topic_key unconfirmed as live non-judicial → conservative blank
- All state/federal topics: blank

**Pre-tenure blanks properly excluded:**
- Sosa (seated Dec 2022): Jan 2021 rent-control vote NOT attributed
- Pemberton (seated Dec 2023): Jan 2021 rent-control vote NOT attributed
- Ortiz (seated Dec 2023): Jan 2021 rent-control vote NOT attributed
- Each of these three scored ONLY from their own post-tenure documented statements

## Chair Calibration Notes

**rent-regulation Chair 4** (used for all 5 members): "Limit rent regulations to subsidized units; allow market rents broadly." Chair 5 would be "Oppose rent control entirely" which overstates their positions (all acknowledge some tenant protection value or state law baseline). Chair 4 correctly captures "oppose ADDITIONAL local caps" without claiming they oppose all protection.

**transportation-priorities Chair 2** (Trujillo): "Invest equally in roads and multimodal options; require bike lanes and sidewalks on all new road projects." Trujillo's 33.6-mile bike-lane Master Plan commitment = multimodal investment, not pure transit-first. Chair 1 would require a transit-primary stance he hasn't expressed.

**homelessness Chair 5** (Ortiz): "Banning public camping and sleeping with criminal penalties to maintain public safety and order, relying on existing social services for those who seek help." Ortiz's "The solution is not to provide more shelter" + anti-camping law enforcement places him at the strict enforcement end while the "existing social services for those who seek help" clause covers the absence of explicit service-minimization language.

**Frometa immigration BLANK** (correct, per plan): Two contradictory quotes exist. Forcing a chair on this would be dishonest. The plan spec explicitly allows a low-confidence/blank for this member's 2025 immigration position.

## Verification Results

All SQL checks passed:

- **0 uncited rows**: `SELECT ... WHERE NOT EXISTS (SELECT 1 FROM inform.politician_context c WHERE c.politician_id=a.politician_id ...)` → 0 rows
- **0 judicial/inactive topic rows**: `JOIN inform.compass_topics t WHERE judicial_role IN ('judge','city_attorney_da') OR is_live=false` → 0 rows
- **schema_migrations MAX = 992**: unchanged — audit-only discipline confirmed
- **All 5 officials have ≥1 stance**: Trujillo 5 / Sosa 6 / Frometa 3 / Pemberton 4 / Ortiz 5

## Deviations from Plan

**1. Migration numbers shifted from plan (plan said 988-992, applied as 994-998)**
- **Found during:** Pre-flight
- **Issue:** Plan was authored expecting on-disk MAX of 987, but state_exec_headshots batches (985-989) and Downey structural/headshot migrations (990-993) filled those numbers
- **Fix:** Applied as migrations 994-998 (next 5 free numbers after on-disk MAX of 993)
- **Impact:** None — on-disk counter is authoritative per project convention; audit-only files simply start at the next available number

**2. homelessness topic added for Sosa and Ortiz (beyond plan's listed topics)**
- **Found during:** Task 2 (applying homelessness-response for Sosa/Ortiz, reviewing chair calibration)
- **Issue:** RESEARCH.md evidence for Sosa (anti-camping law enforcement, park prohibition statement) and Ortiz (anti-shelter/enforcement-first) also cleanly maps to the `homelessness` criminalization topic (separate from `homelessness-response`)
- **Fix:** Added `homelessness` = 4 for Sosa and `homelessness` = 5 for Ortiz — both well-cited, both from already-cited sources
- **Rule:** Rule 2 (missing critical functionality — evidence existed, the stance captures it accurately)
- **Impact:** Improves compass coverage accuracy; adds 2 additional cited stances (total 23 instead of 21)

None beyond the above — plan executed as specified otherwise.

## Known Stubs

None — all inserted stances reference real public-record source URLs. No placeholder text or empty-source rows.

## Threat Surface Scan

No new network endpoints, auth paths, or schema changes introduced. Pure SQL INSERT into existing `inform.politician_answers` and `inform.politician_context` tables via psql operator against production. No new threat surface beyond what was already in the threat model.

## Task Commits

**Note:** Migration files (994-998) live at `C:/EV-Accounts/backend/migrations/` outside the git repo. They were applied via psql directly to production Supabase. The essentials git repo commit captures the SUMMARY.md + STATE.md metadata only.

1. **Task 1 + 2 (Trujillo/Sosa/Frometa/Pemberton/Ortiz stances)** — migrations 994-998 applied directly to production DB via psql
2. **Task 3 (checkpoint:human-verify)** — PAUSED, awaiting human review

## DWNY-01 Status

DWNY-01 is satisfied end-to-end pending human checkpoint approval:
- Government (geo_id 0619766 backfilled) ✓ (Plan 01, mig 990)
- Roster (5 current members, correct districts, Ortiz created) ✓ (Plan 02, mig 991)
- Mayor correction (Frometa = Mayor, Ortiz = Mayor Pro Tem) ✓ (mig 992)
- Headshots (5/5 current members) ✓ (Plan 03, mig 993)
- Stances (23/5 members, 100% cited, chairs model, no defaults) ✓ (Plan 04, migs 994-998)

## Self-Check: PASSED

- Migration files 994-998: confirmed at `C:/EV-Accounts/backend/migrations/` ✓
- DB verify: all 5 officials have stances ✓
- 0 uncited answers ✓
- 0 judicial/inactive topics ✓
- schema_migrations MAX = 992 unchanged ✓

---
*Phase: 150-downey-deep-seed*
*Completed: 2026-06-20*
