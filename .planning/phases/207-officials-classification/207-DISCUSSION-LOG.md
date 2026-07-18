# Phase 207: Officials Classification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-17
**Phase:** 207-officials-classification
**Areas discussed:** Judge bucket scope, Educator bucket scope, Signal & precedence, Ambiguous / default handling

---

## Judge bucket scope

### DAs / prosecutors / public defenders

| Option | Description | Selected |
|--------|-------------|----------|
| Judges bucket | Matches Judicial lens scope; requires title override (seeded COUNTY-exec) | ✓ |
| Stay Representatives | Judges tab = the bench only; simpler pure-district_type signal | |
| You decide | Pick cleaner rule during planning from real data | |

**User's choice:** Judges bucket
**Notes:** Aligns the Judges tab membership with the Judicial lens ("judges, DAs, and public defenders").

### Court clerks / court administrators (JUDICIAL dt, non-judge)

| Option | Description | Selected |
|--------|-------------|----------|
| Judges bucket | Judicial-branch officials, already grouped under their court; admin plate cards | ✓ |
| Representatives bucket | Judges strictly = the bench; but re-clutters the list | |
| You decide | Pick during planning based on row counts | |

**User's choice:** Judges bucket — "though I'm not certain if we need to go that deep?"
**Notes:** Resolved by *not* going deep: route the entire `JUDICIAL`/`NATIONAL_JUDICIAL` district_type to Judges with no judge-vs-clerk special-casing. Court staff come along for free (D-01).

---

## Educator bucket scope

### State Board of Education (district_type=STATE_BOARD)

| Option | Description | Selected |
|--------|-------------|----------|
| Educators bucket | All education-governance bodies together; consistent with Education lens | ✓ |
| Stay Representatives | Educators = local K-12 school boards only | |
| You decide | Pick during planning | |

**User's choice:** Educators bucket

### Elected school executives (Superintendent of Public Instruction, STATE_EXEC)

| Option | Description | Selected |
|--------|-------------|----------|
| Stay Representatives | Educators = governing boards only; purely board-based signal | |
| Educators bucket | Sweep education executives in too; needs guarded title override | ✓ |
| You decide | Pick during planning | |

**User's choice:** Educators bucket
**Notes:** Requires a title override on STATE_EXEC rows, guarded against non-school "superintendent" titles (police, public works, streets).

---

## Signal & precedence

### Classifier structure

| Option | Description | Selected |
|--------|-------------|----------|
| One source-of-truth function | New classifyBucket(pol) in classify.js; tabs + grouping call it | ✓ |
| Derive from classifyCategory | Thin mapper on tier/group output; inherits fine-grained coupling | |
| You decide | Pick cleaner structure during planning | |

**User's choice:** One source-of-truth function

### Precedence on conflict

| Option | Description | Selected |
|--------|-------------|----------|
| district_type base + additive overrides | Overrides only pull mistyped rows in; clear types never pulled out | ✓ |
| Title/chamber wins on any conflict | More aggressive; riskier (stray keywords misfile clean rows) | |
| You decide | Resolve during planning against real data | |

**User's choice:** district_type base + additive overrides

---

## Ambiguous / default handling

### Catch-all for unclassified / empty / Uncategorized rows

| Option | Description | Selected |
|--------|-------------|----------|
| Default to Representatives | Catch-all; nobody vanishes; Educator/Judge need positive signal | ✓ |
| Add 'Unknown/Other' bucket | Cleaner separation but a 4th bucket = scope creep | |
| You decide | Pick during planning | |

**User's choice:** Default to Representatives

### Multi-office person (e.g. supervisor + school board)

| Option | Description | Selected |
|--------|-------------|----------|
| Classify per office — can appear in two tabs | Each row classified independently; matches per-office SC wording | ✓ |
| One bucket per person (pick dominant) | Person-level merge; complex, could hide a real office | |
| You decide | Resolve during planning against real data | |

**User's choice:** Classify per office — can appear in two tabs

---

## Claude's Discretion

- Exact function name / export shape (`classifyBucket` vs `classifyOfficialGroup`); enum vs object return.
- Precise override keyword lists + the guard patterns excluding non-school "superintendent" and other false positives.
- Whether/how to extend `classify.test.js` with edge-case unit tests (recommended).
- Whether `classifyBucket` reuses `classifyCategory`/`getBranch` internally or reads `district_type` directly.

## Deferred Ideas

- Person-level (one-bucket-per-human) classification — rejected for now; revisit only if two-tab appearances confuse users.
- A 4th "Unknown/Other" bucket — rejected as scope creep.
- Tabs UI (Phase 208), Education-lens data (Phase 209), per-tab lens defaults (Phase 210) — downstream phases.
