---
phase: 123-ma-tier-3-stances-wave-2
plan: "04"
subsystem: stances
tags: [new-bedford, stances, compass, migrations, ward-councillors, republican-party]
dependency_graph:
  requires:
    - phase: 123-03
      provides: All 12 New Bedford UUIDs + migrations 647-652 (Mayor + At-Large complete)
    - phase: 120
      provides: New Bedford deep seed — all 12 politicians at external_ids -2545000001 to -2545000012
  provides:
    - NEWBED-03 complete — Ward councillor stance migrations (653-658)
    - All 12 New Bedford officials now have stance files (migrations 647-658 complete)
  affects: [inform.politician_answers, inform.politician_context]
tech_stack:
  added: []
  patterns: [evidence-only stance migration, zero-INSERT valid migration, float literal values, double-cast ::text[]::text[] sources, psql CLI for DB access]
key_files:
  created:
    - C:/EV-Accounts/backend/migrations/653_choquette_stances.sql
    - C:/EV-Accounts/backend/migrations/654_pemberton_stances.sql
    - C:/EV-Accounts/backend/migrations/655_oliver_stances.sql
    - C:/EV-Accounts/backend/migrations/656_baptiste_stances.sql
    - C:/EV-Accounts/backend/migrations/657_lopes_stances.sql
    - C:/EV-Accounts/backend/migrations/658_pereira_stances.sql
  modified: []
key-decisions:
  - "Choquette and Oliver (both Republican) received immigration=4.0 from documented non-citizen police ballot question; strongest individual-attributed quotes in NB ward council record"
  - "Pemberton (W2) is zero-INSERT: new member elected Nov 2025, fewer than 6 months of service, no public policy record in WBSM or NB Light"
  - "Baptiste (W4) is zero-INSERT: parking and Zeiterion votes documented but no individual attributed quote on compass topics; vote-without-statement does not satisfy evidence-only rule"
  - "Lopes (W5) is zero-INSERT: rich prior council history (12yr) but too distant without contemporaneous sourcing; recent campaign messaging too generic; MassHire role alone insufficient"
  - "Pereira (W6) received economic-development=2.0: renamed Labor & Industry to Economic Development Committee and created Special Permits & Licensing to cut business wait times — both are individually documented leadership decisions"
requirements-completed: [NEWBED-03]
duration: ~60m
completed: "2026-06-15"
---

# Phase 123 Plan 04: New Bedford Ward Councillor Stances Summary

Evidence-only compass stances for New Bedford ward councillors Choquette (W1, 1 stance), Pemberton (W2, 0), Oliver (W3, 1), Baptiste (W4, 0), Lopes (W5, 0), Pereira (W6/President, 1) applied via migrations 653-658; 3 total stance rows for this plan; 0 unpaired answers; 0 uncited contexts; all 12 New Bedford officials now complete (16 total stance rows).

## Performance

- **Duration:** ~60 min
- **Started:** 2026-06-15T21:00:00Z
- **Completed:** 2026-06-15T22:00:00Z
- **Tasks:** 2
- **Files modified:** 6 migration files created

## Accomplishments

- Applied migrations 653-658 covering 6 New Bedford ward councillors
- Discovered rich Republican-party immigration stance for Choquette and Oliver (non-citizen police ballot question)
- Pereira's Economic Development Committee renaming provided documented stance evidence
- Correctly applied zero-INSERT for 3 officials (Pemberton, Baptiste, Lopes) where evidence is insufficient
- All 12 New Bedford officials now have stance files (NEWBED-03 complete)
- Plan-wide citation check: 0 uncited contexts across all 12 officials

## Task Commits

1. **Task 1: Ward councillors Choquette, Pemberton, Oliver (653-655)** - `86d7063` (feat)
2. **Task 2: Ward councillors Baptiste, Lopes, Pereira (656-658)** - `ac4597f` (feat)

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/653_choquette_stances.sql` - Ward 1 Leo Choquette: 1 stance
- `C:/EV-Accounts/backend/migrations/654_pemberton_stances.sql` - Ward 2 Scott Pemberton: 0 stances (zero-INSERT)
- `C:/EV-Accounts/backend/migrations/655_oliver_stances.sql` - Ward 3 Shawn Oliver: 1 stance
- `C:/EV-Accounts/backend/migrations/656_baptiste_stances.sql` - Ward 4 Derek Baptiste: 0 stances (zero-INSERT)
- `C:/EV-Accounts/backend/migrations/657_lopes_stances.sql` - Ward 5 Joseph Lopes: 0 stances (zero-INSERT)
- `C:/EV-Accounts/backend/migrations/658_pereira_stances.sql` - Ward 6 Ryan Pereira: 1 stance

## Per-Official Stance Counts

| Official | External ID | Migration | Stances Written | Blank Spokes Note |
|----------|-------------|-----------|-----------------|-------------------|
| Leo Choquette (W1, R) | -2545000007 | 653 | 1 | Republican; non-citizen police ballot question |
| Scott Pemberton (W2) | -2545000008 | 654 | 0 | New member Nov 2025; <6 months service; no record |
| Shawn Oliver (W3, R) | -2545000009 | 655 | 1 | Republican; Lt. Gov. candidate; same ballot question |
| Derek Baptiste (W4) | -2545000010 | 656 | 0 | Votes documented but no individual attributed quotes |
| Joseph Lopes (W5) | -2545000011 | 657 | 0 | 12yr prior record too distant; recent too generic |
| Ryan Pereira (W6/Pres) | -2545000012 | 658 | 1 | Created Economic Development Committee + Licensing |
| **Task 2 total** | | | **3** | |

## All 12 New Bedford Officials (Complete Record)

| External ID | Full Name | Stances | Migration |
|-------------|-----------|---------|-----------|
| -2545000001 | Jon Mitchell (Mayor) | 6 | 647 |
| -2545000002 | Ian Abreu (At-Large) | 1 | 648 |
| -2545000003 | Shane Burgo (At-Large) | 2 | 649 |
| -2545000004 | Naomi Carney (At-Large) | 1 | 650 |
| -2545000005 | Brian Gomes (At-Large) | 2 | 651 |
| -2545000006 | James Roy (At-Large) | 1 | 652 |
| -2545000007 | Leo Choquette (W1) | 1 | 653 |
| -2545000008 | Scott Pemberton (W2) | 0 | 654 |
| -2545000009 | Shawn Oliver (W3) | 1 | 655 |
| -2545000010 | Derek Baptiste (W4) | 0 | 656 |
| -2545000011 | Joseph Lopes (W5) | 0 | 657 |
| -2545000012 | Ryan Pereira (W6) | 1 | 658 |
| **TOTAL** | | **16** | 647-658 |

## Topics Covered

### Leo Choquette (653)
- **immigration (4.0)**: "Hiring non-citizens as New Bedford police officers is not responsible government" (WBSM SouthCoast Now); co-authored ballot question with Oliver to restrict NBPD to US citizens only

### Scott Pemberton (654)
- No stances — new councillor (Nov 2025 election, office Jan 2026); <6 months public record

### Shawn Oliver (655)
- **immigration (4.0)**: Co-authored non-citizen police ballot question with Choquette; "always identified as a conservative"; joined Republican Party Aug 2025; running as Republican Lt. Gov. candidate (Shortsleeve ticket, announced June 2026)

### Derek Baptiste (656)
- No stances — votes documented (opposed parking reduction, cut Zeiterion) but no individual attributed quotes on compass topics; vote-without-statement does not satisfy evidence-only rule

### Joseph Lopes (657)
- No stances — former Council President (12yr) and MassHire Executive Director but no recent individual compass-topic statements; old record too distant

### Ryan Pereira (658)
- **economic-development (2.0)**: As 2026 Council President, renamed Labor & Industry → Economic Development Committee; created Special Permits and Licensing committee to reduce business wait times from months to weeks; "foster economic growth in New Bedford"

## Blank-Spoke Explanation

Pemberton, Baptiste, and Lopes have zero stances. Key reasons:

1. **Pemberton**: Elected November 2025, took office January 2026 — fewer than six months of service. No individual public statements documented in WBSM, NB Light, or SouthCoast Today. New members often lack a public record.

2. **Baptiste**: Multiple votes documented (opposed parking minimum reduction 8-3; voted to cut Zeiterion funding 6-5) but no individual attributed quotes or statements. A vote without a stated reason does not establish a compass position — other interpretations are plausible (concerns about neighborhood quality, fiscal prudence respectively).

3. **Lopes**: Long prior record (Ward 6 2009-2022, former Council President multiple terms) but that record is too old and unsourced for evidence-based placement under current rules. His 2025 campaign messaging was generic ("build bridges," "continue progress"). MassHire Executive Director role establishes background but not a compass position. Recent WBSM and NB Light coverage of his Ward 5 campaign contains no individual policy positions.

## Verification Results

| Check | Result |
|-------|--------|
| Migration 653 (Choquette) applied | 1 row in politician_answers |
| Migration 654 (Pemberton) applied | 0 rows (zero-INSERT, intended) |
| Migration 655 (Oliver) applied | 1 row in politician_answers |
| Migration 656 (Baptiste) applied | 0 rows (zero-INSERT, intended) |
| Migration 657 (Lopes) applied | 0 rows (zero-INSERT, intended) |
| Migration 658 (Pereira) applied | 1 row in politician_answers |
| Unpaired answers (653-658 officials) | 0 |
| Uncited contexts (653-658 officials) | 0 |
| Plan-wide citation check (ext_id -2545000012 to -2545000007) | 0 |
| Total NB stance rows (all 12 officials) | 16 |

## Decisions Made

1. **immigration=4.0 for Choquette AND Oliver**: Both co-authored the 2024 ballot question to restrict NBPD hiring to US citizens only. Choquette stated "Hiring non-citizens as NBPD officers is not responsible government." Oliver confirmed conservative, citizenship-first values. These are direct, individually-attributed, on-record statements — not inferred from party affiliation alone.

2. **Zero-INSERT for Baptiste**: His votes (8-3 parking; 6-5 Zeiterion) are documented facts but voting without a public statement cannot conclusively establish a compass position. The evidence-only rule requires that we can state WHY someone holds a value. Baptiste may have had quality-of-life or fiscal concerns for either vote that don't map to any specific compass topic.

3. **Zero-INSERT for Lopes**: Despite 12 years of council service and the Executive Director role at MassHire, the evidence-only rule requires contemporaneous sourcing. His prior council record would need contemporary news coverage or statements to be usable. The 2025 campaign messaging is too generic to assign values. Blank spokes accurately reflect what we can document, not what we might infer.

4. **economic-development=2.0 for Pereira**: The committee renaming and the creation of Special Permits & Licensing are individually-attributed, explicitly-stated policy decisions with stated rationales. These are not inferred — Pereira explained each in a WBSM interview. Value 2 (government should facilitate and invest in economic development) is supported by creating infrastructure to accelerate business formation.

## Deviations from Plan

None — plan executed exactly as written. All 6 officials researched and processed; blank-spoke officials documented per evidence-only rule.

## Known Stubs

None — all stances are wired to real evidence with path-bearing source URLs. Zero-INSERT officials are intentional blank spokes, not stubs.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. All writes are to existing tables (inform.politician_answers, inform.politician_context) using established patterns. No external_ids outside -2545000007 to -2545000012 were touched.

## Next Phase Readiness

- **NEWBED-03** is complete — all 12 New Bedford officials have been researched and have stance files (647-658)
- **Phase 123 Plan 05** (if it exists) can reference this completion
- No blockers — all 12 NB officials fully processed with evidence-only stances

## Self-Check: PASSED

- Migration files exist on disk:
  - C:/EV-Accounts/backend/migrations/653_choquette_stances.sql: FOUND (1 stance, verified)
  - C:/EV-Accounts/backend/migrations/654_pemberton_stances.sql: FOUND (0 stances, verified)
  - C:/EV-Accounts/backend/migrations/655_oliver_stances.sql: FOUND (1 stance, verified)
  - C:/EV-Accounts/backend/migrations/656_baptiste_stances.sql: FOUND (0 stances, verified)
  - C:/EV-Accounts/backend/migrations/657_lopes_stances.sql: FOUND (0 stances, verified)
  - C:/EV-Accounts/backend/migrations/658_pereira_stances.sql: FOUND (1 stance, verified)
- DB row counts confirmed: 1, 0, 1, 0, 0, 1 (all 6 ward councillors)
- 0 unpaired, 0 uncited across all 6 ward councillors
- Plan-wide citation check (ext_id -2545000012 to -2545000007): 0
- All 12 NB officials total: 16 stance rows (plans 03+04 combined)
