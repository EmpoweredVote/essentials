# Phase 93: MD Legislature + Federal Officials - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-05
**Phase:** 93-md-legislature-federal-officials
**Areas discussed:** Delegate district modeling, Headshot scope in Phase 93, Migration wave structure

---

## Delegate District Modeling

### Q1: A/B split district handling

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — add parent rows if needed | Researcher verifies from mgaleg.maryland.gov. If A/B districts elect 3 delegates, add 12 parent STATE_LOWER rows in chambers migration. Full accuracy, slightly more migration work. | ✓ |
| No — model A/B as 2-delegate districts for now | Only seed 2 offices per A/B district. Accept possible 129 vs 141 discrepancy, fix in Phase 94. | |

**User's choice:** Yes — add parent rows if needed
**Notes:** Accuracy over simplicity. Researcher must verify delegate count per A/B district from mgaleg.maryland.gov before planning can proceed.

### Q2: Multi-delegate title convention for whole districts

| Option | Description | Selected |
|--------|-------------|----------|
| All titled 'Delegate' — no positional label | 3 offices all with title='Delegate', same district_id. Simple, matches MD official labels. | ✓ |
| Add positional suffix (Delegate A/B/C) | Invented convention, not used by MD officially. | |
| You decide | Claude picks simplest approach consistent with prior patterns. | |

**User's choice:** All titled 'Delegate' — no positional label
**Notes:** Follow official MD nomenclature. Three offices per whole district, all title='Delegate'.

---

## Headshot Scope in Phase 93

### Q1: Coverage strictness

| Option | Description | Selected |
|--------|-------------|----------|
| Best-effort inline — Phase 94 closes the gap | Source headshots alongside seeding from mgaleg.maryland.gov. Skip if unavailable. Phase 94 enforces 100% coverage. | ✓ |
| Strict — Phase 93 blocked until all 192 headshots uploaded | Phase 93 not complete until every politician_images row confirmed. Phase 94 becomes just UI spot-check. | |

**User's choice:** Best-effort inline — Phase 94 closes the gap
**Notes:** 192 headshots is too large for a blocking requirement; Phase 94 is the enforcement phase.

### Q2: Headshot plan grouping

| Option | Description | Selected |
|--------|-------------|----------|
| Split by chamber — senators first, then delegates | 47 senators is manageable first batch; delegates (141) second. Aligns headshot plans with seeding order. | ✓ |
| Single headshot plan for all 192 | One script covers all legislators + federal. Simpler but one large failure point. | |
| You decide | Claude picks plan structure matching prior patterns. | |

**User's choice:** Split by chamber — senators first, then delegates
**Notes:** Senators headshot plan, then delegates headshot plan, as separate sequential plans.

---

## Migration Wave Structure

### Q1: Plan grouping for politician seeding

| Option | Description | Selected |
|--------|-------------|----------|
| 4 seeding plans: chambers → senators → delegates → federal | 272: chambers, 273: senators, 274: delegates, 275: federal. Each independently verifiable. | ✓ |
| 3 plans: chambers+senators → delegates → federal | Combine chambers + senators. Fewer plans but larger each. | |
| 2 plans: state legislature → federal officials | Chambers + all 188 legislators in one migration. Fewest plans, highest risk. | |

**User's choice:** 4 seeding plans: chambers → senators → delegates → federal
**Notes:** Maximum debuggability. Each migration is independently executable and verifiable. Headshot plans come after all 4 seeding migrations complete.

---

## Claude's Discretion

- External ID numbering: senators `-2410001..-2410047`, delegates `-2420001..-2420141`, US senators `-2430001..-2430002`, US House reps `-2440001..-2440008`
- MD legislative chamber naming convention: follow OR pattern (short + state-qualified formal name)
- Generator script structure: PowerShell generators adapting `generate_or_senate.ps1` / `generate_or_house.ps1`
- Federal chambers: use existing shared "U.S. Senate" / "U.S. House of Representatives" under United States Federal Government (confirmed in DB — no new chambers needed)

## Deferred Ideas

None — discussion stayed within phase scope.
