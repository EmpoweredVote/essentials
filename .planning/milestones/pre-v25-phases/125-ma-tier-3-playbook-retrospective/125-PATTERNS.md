# Phase 125: MA Tier 3 Playbook Retrospective - Pattern Map

**Mapped:** 2026-06-15
**Files analyzed:** 4 (LOCATION-ONBOARDING.md, .planning/STATE.md, .planning/ROADMAP.md, .planning/REQUIREMENTS.md)
**Analogs found:** 4 / 4

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `LOCATION-ONBOARDING.md` | documentation | transform (append rows + embed callouts) | Phase 116-01-PLAN.md pattern applied to LOCATION-ONBOARDING.md | exact |
| `.planning/STATE.md` | documentation | transform (field updates + table row update) | Phase 116-02-PLAN.md Task 1 pattern on STATE.md | exact |
| `.planning/ROADMAP.md` | documentation | transform (milestone status + phase table update) | Phase 116-02-PLAN.md Task 2 pattern on ROADMAP.md | exact |
| `.planning/REQUIREMENTS.md` | documentation | transform (checkbox flip + traceability table update) | No direct analog in Phase 116 (new scope for Phase 125) | role-match (same document-editing pattern) |

---

## Pattern Assignments

### `LOCATION-ONBOARDING.md` (documentation, transform)

**Analog:** `.planning/phases/116-ma-playbook-retrospective/116-01-PLAN.md`

Phase 116-01 is the exact template for what Phase 125 Plan 01 must do. It established:

**Task structure pattern** (116-01-PLAN.md lines 60-134):
- Task 1: Add Cities Onboarded table rows + new state Quick Reference block
- Task 2: Embed `[GOTCHA]` callouts inline within Steps 1-7

**Cities Onboarded table — row format** (LOCATION-ONBOARDING.md lines 29-51):
```markdown
| Newton | MA | 2026-06-14 | plurality | 16 at-large + 8 ward councillors... |
```
- Columns: City | State | Onboarded | Election method | Notable patterns
- Notable patterns cell is dense: includes council seat count, geo_ids, external_id ranges, headshot source/pattern, and any anomaly
- Insert new rows after the existing Boston row (current last row in table, line 51)

**Massachusetts Quick Reference — extension pattern** (LOCATION-ONBOARDING.md lines 126-155):
The existing block structure to extend:
```markdown
## Massachusetts Quick Reference

**Read this before starting any MA city or state work...**

| Trap | See Step | One-Line Summary |
|------|----------|-----------------|
| [existing rows] |

**Massachusetts Key Facts:**
- FIPS: 25 ...
- [key-value pairs]
- Next migration (end of v13.0): 578
```
- Add new trap rows to the existing trap table (do NOT replace the table — append to it)
- Add new Key Facts bullet lines (7 Tier 3 city geo_ids, CivicLive CDN for Lynn, finalsite.net for Medford, CivicEngage/Revize block note, Cloudflare JS challenge note)
- Update the "Next migration" line from 578 to 699

**[GOTCHA] callout format** (LOCATION-ONBOARDING.md lines 173-181 — existing MA GOTCHAs):
```markdown
> [GOTCHA] **[STATE-SPECIFIC: MA] {Title}:** {Multi-sentence explanation including: what the wrong assumption is, what the correct behavior is, which phase confirmed it, and any concrete DB query or command to use.}
```
- Must use `> [GOTCHA] **[STATE-SPECIFIC: MA]` prefix exactly — this is the grep target (`grep -c "STATE-SPECIFIC: MA"`)
- Current baseline: 5 MA-specific GOTCHAs (from Phase 116)
- Phase 125 must add GOTCHAs covering the 10 Tier 3 patterns identified in RESEARCH.md
- Insertion point within a Step: after the last existing `[GOTCHA]` block in that step's section
- The broadly-applicable GOTCHAs (geo_id verification from DB, Cloudflare JS 200-not-content, council structure from official site) may warrant a Step 7 main pitfall table row instead of MA-only label — RESEARCH.md pitfall 1 flags this decision

**Verification commands pattern** (116-01-PLAN.md lines 181-188):
```bash
grep -c "STATE-SPECIFIC: MA" LOCATION-ONBOARDING.md
# Must increase from 5 to >= 8 (3+ new callouts minimum)

grep -c "2026-06-1[4-5].*MA" LOCATION-ONBOARDING.md
# Should show at least 7 new city rows
```

---

### `.planning/STATE.md` (documentation, transform)

**Analog:** `.planning/phases/116-ma-playbook-retrospective/116-02-PLAN.md` Task 1

**Current STATE.md state** (lines 1-15 read):
```yaml
---
gsd_state_version: 1.0
milestone: v14.0
milestone_name: milestone
status: Ready
last_updated: "2026-06-15T23:30:00.000Z"
last_activity: 2026-06-15 -- Phase 124 complete; ...next migration 699
progress:
  total_phases: 26
  completed_phases: 26
  total_plans: 97
  completed_plans: 97
  percent: 100
---
```

**Fields to update** (following 116-02 Task 1 pattern):
- `status:` — change from `Ready` to `v14.0 complete — MA Tier 3 City Coverage milestone closed`
- `last_updated:` — update to `"2026-06-15T00:00:00.000Z"` (or keep existing timestamp)
- `last_activity:` — update to `2026-06-15 -- Phase 125 complete; v14.0 MA Tier 3 City Coverage milestone closed; MA-RETRO-02 satisfied; LOCATION-ONBOARDING.md updated with 7 Cities Onboarded rows + MA Tier 3 GOTCHAs; next migration 699`
- `progress.total_plans:` — increment by 2 (Plans 125-01 and 125-02 add to the total; currently 97, will be 99)
- `progress.completed_plans:` — same increment (97 → 99 after both plans complete)

**v14.0 Roadmap Summary table** (lines 38-46): all 9 rows currently show various "Not started"/"Planned"/etc. statuses — Phase 125 row must change from `Not started` to `Complete (2 plans)`. The other rows were already completed but STATE.md was not updated per-phase — planner should update all rows to reflect actual completed state.

**Key MA Facts section** (lines 48-60): `Next migration: 659` is stale (should be 699 per last_activity). This must be corrected.

**Decisions section**: add closure note following the pattern from 116-02 Task 1:
```
- [Phase 125]: v14.0 MA Tier 3 City Coverage closed 2026-06-15; LOCATION-ONBOARDING.md updated with 7 Cities Onboarded rows (Newton/Somerville/Lynn/New Bedford/Fall River/Medford/Waltham) + 10 MA-specific GOTCHAs; MA-RETRO-02 satisfied
```

**Verification commands pattern** (116-02-PLAN.md lines 93-98):
```bash
grep -n "v14.0 complete" .planning/STATE.md
# Must return at least 1 line
grep "percent: 100" .planning/STATE.md
# Must return 1 line (already 100, must remain)
```

---

### `.planning/ROADMAP.md` (documentation, transform)

**Analog:** `.planning/phases/116-ma-playbook-retrospective/116-02-PLAN.md` Task 2

**Current ROADMAP.md milestone line** (line 20):
```markdown
- 🔄 **v14.0 MA Tier 3 City Coverage** - Phases 117-125 (in progress)
```
Change to:
```markdown
- ✅ **v14.0 MA Tier 3 City Coverage** - Phases 117-125 (shipped 2026-06-15)
```

**Phase 125 section in ROADMAP.md**: Find the Phase 125 entry and update the Plans field from `TBD` or `Not started` to:
```markdown
**Plans:** 2/2 plans complete
Plans:
**Wave 1**

- [x] 125-01-PLAN.md — LOCATION-ONBOARDING.md: 7 Cities Onboarded rows + MA Tier 3 GOTCHAs + MA Quick Reference extension

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 125-02-PLAN.md — v14.0 milestone close (STATE.md + ROADMAP.md + REQUIREMENTS.md)
```

**v14.0 Phase Summary table**: Update Phase 125 row status from `Not started` to `Complete` with date `2026-06-15`.

**RESEARCH.md open question 3** flags that ROADMAP.md Phase 120 shows "Not started" — the full Phase Summary table for v14.0 may be stale for multiple phases. Planner should correct all stale rows (117-124) to `Complete` as part of Plan 02.

**Verification commands** (following 116-02 Task 2 pattern):
```bash
grep -c "shipped 2026-06-15" .planning/ROADMAP.md
# Must return 1

grep -c "125-01-PLAN.md" .planning/ROADMAP.md
# Must return 1

grep -c "125-02-PLAN.md" .planning/ROADMAP.md
# Must return 1
```

---

### `.planning/REQUIREMENTS.md` (documentation, transform)

**No direct Phase 116 analog** — Phase 116 did not include a REQUIREMENTS.md update step. However, the checkbox-flip pattern is consistent with how every other milestone close has worked.

**Current checkbox states** (lines 1-97 read):
- Already `[x]`: NEWTON-03, SOMERVILLE-01, SOMERVILLE-02, SOMERVILLE-03, LYNN-03, NEWBED-03, FALLRIV-03, MEDFORD-03, WALTHAM-03 (9 reqs)
- Still `[ ]` requiring flip: NEWTON-01, NEWTON-02, LYNN-01, LYNN-02, NEWBED-01, NEWBED-02, FALLRIV-01, FALLRIV-02, MEDFORD-01, MEDFORD-02, WALTHAM-01, WALTHAM-02, MA-RETRO-02 (13 reqs)

**Checkbox format to copy** (line 10 for a `[ ]` → `[x]` flip):
```markdown
- [ ] **NEWTON-01:** A Newton address returns...
→
- [x] **NEWTON-01:** A Newton address returns...
```
Only change `[ ]` to `[x]` — do not alter the requirement text.

**Traceability table** (lines 74-97): All `⬜` symbols must change to `✅` for the 13 requirements being closed. Format:
```markdown
| NEWTON-01 | 117 | ⬜ |
→
| NEWTON-01 | 117 | ✅ |
```

**RESEARCH.md verification gate for NEWBED-02**: Before flipping NEWBED-02 to `[x]`, planner must verify:
```sql
SELECT version FROM supabase_migrations.schema_migrations WHERE version='588';
```
If migration 588 is not present, NEWBED-02 stays `[ ]`. RESEARCH.md confidence for NEWBED-02 is LOW (120-02-SUMMARY not read during research).

**MA-RETRO-02**: This requirement is satisfied by Phase 125 Plan 01 itself — flip to `[x]` only after Plan 01 completes.

---

## Shared Patterns

### [GOTCHA] Blockquote Format
**Source:** `LOCATION-ONBOARDING.md` lines 173-181 (existing MA GOTCHAs)
**Apply to:** All new GOTCHA callouts in Plan 01
```markdown
> [GOTCHA] **[STATE-SPECIFIC: MA] {Short title that names the trap}:** {Explanation paragraph. Include: wrong assumption an agent might make, correct behavior, concrete fix (DB query / command / URL pattern), and phase number that confirmed it.}
```
- The label `[STATE-SPECIFIC: MA]` is the grep target; do not vary the casing or spacing
- Place after the last existing `[GOTCHA]` within the relevant step section, not at the end of the file

### Massachusetts Quick Reference Trap Table Format
**Source:** `LOCATION-ONBOARDING.md` lines 130-137 (existing MA trap table)
**Apply to:** New trap rows added in Plan 01
```markdown
| {Trap name} | Step N | {One-line summary — concise, no line breaks} |
```
- Keep One-Line Summary under ~120 characters; detail goes in the GOTCHA blockquote in the step body
- The "See Step" column must reference the step where the corresponding GOTCHA is embedded

### Massachusetts Key Facts Bullet Format
**Source:** `LOCATION-ONBOARDING.md` lines 140-154 (existing MA Key Facts)
**Apply to:** New bullet lines appended in Plan 01
```markdown
- {Label}: {Value} ({parenthetical context if needed})
```
- No trailing punctuation
- geo_ids listed as bare numbers (e.g., `2523000`) not quoted strings

### Milestone Completion Sequence
**Source:** Phase 116-02-PLAN.md full structure
**Apply to:** Phase 125 Plan 02
The correct order for milestone close:
1. STATE.md — update status, last_activity, decisions section, roadmap summary table
2. ROADMAP.md — flip milestone emoji + date, update phase summary table, update phase 125 plan list
3. REQUIREMENTS.md — flip all remaining `[ ]` to `[x]`, update traceability table ⬜→✅

### Verification Gate Pattern
**Source:** Phase 116-01-PLAN.md lines 181-188, Phase 116-02-PLAN.md lines 93-98
**Apply to:** Both Plan 01 and Plan 02 verify blocks
```bash
grep -c "STATE-SPECIFIC: MA" LOCATION-ONBOARDING.md
grep -c "2026-06-1[4-5].*MA" LOCATION-ONBOARDING.md
grep -c "shipped 2026-06-15" .planning/ROADMAP.md
grep -n "v14.0 complete" .planning/STATE.md
```
Each `grep -c` result must meet a minimum threshold before the task is marked done.

---

## No Analog Found

No files in this phase lack analogs — all four targets have direct or role-match analogs from Phase 116.

---

## Key Decisions for Planner

### Plan split recommendation (from RESEARCH.md)
Phase 116 succeeded as two sequential plans. Replicate exactly:
- **Plan 01** (Wave 1): LOCATION-ONBOARDING.md — 7 Cities Onboarded rows + MA Quick Reference extension + 10 MA-specific GOTCHA callouts
- **Plan 02** (Wave 2, blocked on Plan 01): STATE.md + ROADMAP.md + REQUIREMENTS.md — v14.0 milestone close

### GOTCHA placement guide for Plan 01

| GOTCHA | Insert location | Broadly applicable? |
|--------|----------------|---------------------|
| MA geo_id estimates are wrong — verify from DB | MA Quick Reference trap table + Step 5 GOTCHA body | YES — consider Step 5 main pitfall table row too |
| Council structure varies — never assume | MA Quick Reference trap table + Step 1 GOTCHA body | YES — Step 1 main pitfall table |
| Councillor spelling is city-specific (single-L vs. double-L) | MA Quick Reference trap table | MA-specific |
| CivicEngage/Revize blocks all HTTP (Newton, Fall River) | MA Quick Reference trap table + Step 4 GOTCHA body | Moderately broad — applies to any city using these CMS |
| Cloudflare JS challenge: HTTP 200 != content accessible | MA Quick Reference trap table + Step 4 GOTCHA body | YES — Step 7 pitfall table |
| Wikipedia Commons requires WIKIMEDIA_HEADERS (429 on Chrome UA) | MA Quick Reference trap table + Step 4 GOTCHA body | Broadly applicable |
| Somerville SC has TWO ex-officio members (Mayor + Council President) | MA Quick Reference trap table + Step 1 GOTCHA body | MA-specific |
| Newly-elected Nov 2025 officials have no photos yet | MA Quick Reference trap table | MA-specific (odd-year cycle note) |
| CivicLive CDN filename != DB last_name (hyphen stripped) | MA Quick Reference trap table + Step 4 GOTCHA body | Broadly applicable |
| Medford school/city domains are distinct (mps02155.org vs medfordma.org) | MA Quick Reference Key Facts | MA-specific |

### Open questions for planner to resolve in Plan 01

1. **New Bedford geo_id** — RESEARCH.md assumes 2524000 (LOW confidence). Planner must add a DB verification gate before writing the New Bedford row: `SELECT geo_id FROM essentials.geofence_boundaries WHERE state='25' AND mtfcc='G4110' AND name ILIKE '%new bedford%'`

2. **NEWBED-02 verification** — Before flipping to `[x]`, verify: `SELECT version FROM supabase_migrations.schema_migrations WHERE version='588'`

3. **ROADMAP.md v14.0 Phase Summary table** — multiple rows (117-124) likely show stale "Not started" status; planner should read the full v14.0 section and correct all rows in Plan 02.

---

## Metadata

**Analog search scope:** `.planning/phases/116-ma-playbook-retrospective/`, `LOCATION-ONBOARDING.md`, `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`
**Files scanned:** 7 (116-01-PLAN.md, 116-02-PLAN.md, LOCATION-ONBOARDING.md lines 1-200, STATE.md lines 1-80, ROADMAP.md lines 1-60, REQUIREMENTS.md full, 125-RESEARCH.md full)
**Pattern extraction date:** 2026-06-15
