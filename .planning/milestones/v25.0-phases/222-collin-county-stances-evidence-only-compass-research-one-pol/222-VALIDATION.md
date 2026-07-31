---
phase: 222
slug: collin-county-stances-evidence-only-compass-research-one-pol
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-24
---

# Phase 222 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `222-RESEARCH.md` §"Validation Architecture". This is a **civic-data seeding phase** —
> no JS/TS unit-test suite covers it. Validation is inline SQL gates + cited-source resampling
> + a live browse spot-check, matching every prior deep-seed/stance phase (150, 193–198, 201–203, 218–220).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | In-transaction migration assertions + post-apply SQL gates (the 1307–1313 / 998 convention) |
| **Config file** | None — one numbered migration file per government in `C:/EV-Accounts/backend/migrations` |
| **Quick run command** | The migration's own `BEGIN; … COMMIT;` block, applied via `mcp__supabase-local__execute_sql` |
| **Full suite command** | Re-run the §A worklist query after all migrations apply, then the evidence-integrity gate and the split-section check |
| **Estimated runtime** | ~5 seconds per gate query |

**Apply-path constraint (from RESEARCH.md §E):** the executor **authors** migration SQL and commits it;
the **orchestrator/operator applies** it via `mcp__supabase-local__execute_sql`. gsd-executor has no
Supabase MCP access. Plans must not assume the executor can run the apply step.

---

## Sampling Rate

- **After every government (task commit):** run the evidence-integrity gate scoped to that government's newly-written rows — must return 0 rows.
- **After every tier (plan wave):** re-run the BEFORE/AFTER coverage query and record the per-government delta.
- **Before `/gsd-verify-work`:** full gate set green + the cited-source resample below complete + browse spot-check screenshot captured.
- **Max feedback latency:** one government (≈4–8 people) — never more than one city's work at risk.

---

## Per-Task Verification Map

Task IDs are assigned by the planner; the rows below are the requirement-level contract each task inherits.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| *(per-government)* | TBD | 1–4 | COLLIN-STANCE-01 | — | Every in-scope officeholder is genuinely attempted, never silently skipped | manual (register-based) | Diff the §A live worklist against `222-CONFIRMED-BLANK.md` entries ∪ applied migration rows — every name appears in **exactly one** | ❌ W0 — register created progressively | ⬜ pending |
| *(per-government)* | TBD | 1–4 | COLLIN-STANCE-02 | — | No stance exists without cited evidence | SQL gate | See **Evidence-integrity gate** below — must return 0 rows | ✅ runnable now | ⬜ pending |

### Evidence-integrity gate (COLLIN-STANCE-02)

```sql
SELECT pa.politician_id, pa.topic_id, pa.value
FROM inform.politician_answers pa
LEFT JOIN inform.politician_context pc
  ON pc.politician_id = pa.politician_id AND pc.topic_id = pa.topic_id
WHERE pa.politician_id IN (/* this phase's newly-written politician_ids */)
  AND (
        pa.value IS NULL
     OR pa.value NOT BETWEEN 1 AND 5
     OR pa.value <> ROUND(pa.value)            -- no fractional stances (see corrupted_fractional_stances)
     OR pc.politician_id IS NULL               -- answer written without a context/evidence row
     OR pc.sources IS NULL
     OR COALESCE(array_length(pc.sources, 1), 0) = 0
     OR pa.topic_id NOT IN (/* the 11 canonical topic UUIDs from RESEARCH.md §B */)
  );
```

**Expected: 0 rows.** Any row is a phase defect, not a data curiosity.

---

## Wave 0 Requirements

- [ ] `222-CONFIRMED-BLANK.md` — the per-person blank register (D-08), created at first use and appended per government
- [ ] **BEFORE snapshot** — run the §A worklist + coverage queries and record live counts *before any write*, superseding CONTEXT.md's 157/55/102 discussion-time anchor
- [ ] **Live topic-ID verification** — confirm the 8 Local Lens + 3 legacy-tail UUIDs still resolve before authoring any migration
- [ ] **Live migration-number check** — re-read the highest numeric prefix in `C:/EV-Accounts/backend/migrations` (was 1415 at research time; concurrent milestones move it)

*No test framework install is required — this phase adds no code.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cited source actually contains an explicit, on-topic position matching the assigned chair | COLLIN-STANCE-02 | Requires reading the source; no query can assert semantic match | Re-fetch each sampled `pc.sources[]` URL; confirm the quote/vote is present, on-topic, and matches the assigned direction. Check the inversion-trap table in `politician-stance-researcher.md` for that topic_key. |
| Genuine-attempt coverage (nobody silently skipped) | COLLIN-STANCE-01 | "Was this person searched?" is not observable in the DB | Every one of the live worklist's names appears in either an applied migration **or** `222-CONFIRMED-BLANK.md` with the sources checked — exactly one, never neither |
| Compass spokes render for a newly-stanced officeholder | COLLIN-STANCE-02 | Renders inside the ev-ui iframe widget | Browse spot-check (below) — **screenshot**, not a Playwright text snapshot |
| `coverage.js` `hasContext` chip reconcile | COLLIN-STANCE-02 | Cross-repo UI constant, not DB state | Any government moving 0 → ≥1 stance must gain `hasContext: true` in `src/lib/coverage.js` (RESEARCH.md Pitfall 5 — 12 of 24 TX entries currently lack it) |

### Cited-source resample (the phase's primary defense against false positives)

Per RESEARCH.md, a full re-verification of every claim is impractical; this sample is the contract:

- **100%** of Tier-1 city stances (Plano, Frisco, McKinney, Allen, Richardson, Prosper, Celina) — highest-traffic profiles
- **100%** of any stance with `value` 1 or 5 — the extremes are where inversion-trap errors surface
- **20% random sample** across Tiers 2–4

**False-positive definition:** a stance applied without explicit, on-topic evidence — inferred from party,
from a vague/suggestive statement, or pattern-matched from a similar official. Watch for `reasoning` text
that is generically evaluative ("supports responsible growth", "balances competing interests") instead of
citing a specific dated vote, quote, or action. D-04 requires the latter.

### Browse spot-check

Per `browse_link_format`, all 23 Collin entries are `browseGovernmentList` cities:
`?browse_government_list=<geo_id>&browse_label=<Label>&browse_state=TX`

Minimum set: one Tier-1 city (Frisco — `?browse_government_list=4827684&browse_label=Frisco&browse_state=TX`)
plus one city this phase flips from zero to non-zero.

---

## Validation Sign-Off

- [ ] BEFORE snapshot recorded before the first write; AFTER snapshot recorded at close, with the per-government delta
- [ ] Evidence-integrity gate returns 0 rows across every politician this phase touched
- [ ] Worklist ∪ blank-register reconciliation is exhaustive — every in-scope name in exactly one bucket
- [ ] Cited-source resample complete at the rates above, with misses corrected (not just noted)
- [ ] Split-section check returns 0 rows (standing milestone convention)
- [ ] Browse spot-check screenshots captured for both required cities
- [ ] `coverage.js` `hasContext` reconciled for every newly-stanced government
- [ ] No stance was defaulted — blanks are recorded as blanks
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
