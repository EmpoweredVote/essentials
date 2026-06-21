---
phase: 153
slug: inglewood-deep-seed
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-21
---

# Phase 153 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This is a SQL-migration data-seeding phase — "tests" are **DB-state assertion queries**
> run via the Supabase MCP (`mcp__supabase-local__execute_sql`), not a unit-test framework.
> Source of truth for the assertions below: `153-RESEARCH.md` §Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | DB-state assertion SQL via Supabase MCP (`mcp__supabase-local__execute_sql`) |
| **Config file** | none — live Supabase (mcp__supabase-local IS production) |
| **Quick run command** | Wave-1 health one-liner (see §Quick Run Command in RESEARCH.md) |
| **Full suite command** | Run all wave completion-gate assertion blocks below |
| **Estimated runtime** | ~5 seconds (MCP round-trips) |

---

## Sampling Rate

- **After every structural migration (Wave 1/2):** Run that wave's completion-gate assertions
- **After every wave:** Run the wave's full assertion block
- **Before `/gsd:verify-work`:** All wave assertion blocks must pass + split-section check returns 0 rows
- **Max feedback latency:** ~5 seconds

---

## Per-Wave Verification Map

| Wave | Plan | Requirement | Validation Type | Assertion (expected) | Status |
|------|------|-------------|-----------------|----------------------|--------|
| 1 | reconcile | INGL-01 | DB assertion | `governments.geo_id='0636546'` on `af811c4b` | ⬜ pending |
| 1 | reconcile | INGL-01 | DB assertion | exactly 1 'City Council' chamber under `af811c4b`; DOOMED `8b99bcf0` deleted (0 rows) | ⬜ pending |
| 1 | reconcile | INGL-01 | DB assertion | all survivor-chamber offices bidirectional (0 mismatches); Eloy `-201081` + Dotson `-201082` `office_id` NULL | ⬜ pending |
| 1 | reconcile | INGL-01 | DB assertion | split-section check returns 0 rows | ⬜ pending |
| 2 | roster | INGL-01 | DB assertion | survivor `official_count=4`; 4 council labels = District 1–4 (no 'At-Large'); Mayor `LOCAL_EXEC`; Padilla D2 located-or-created | ⬜ pending |
| 3 | headshots | INGL-01 | DB assertion | 5 current officials each have exactly 1 `type='default'` image w/ `photo_origin_url NOT NULL`; Faulk deduped to 1; Eloy 666263 photo migrated | ⬜ pending |
| 4 | stances | INGL-01 | DB assertion | every official w/ findable record has ≥1 stance; 0 retired-topic rows; 0 `judicial-*` rows; `COUNT(answers)=COUNT(context)`; honest blanks allowed | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- No test scaffolding required — assertions are ad-hoc SQL against live Supabase via MCP.
- **STOP-on-drift pre-flight (Wave 1, MANDATORY):** before any mutation, re-confirm gov UUID, both chamber UUIDs, all offices + members + ext_ids, both link directions, the office→district map (incl. shared-district check), the Eloy-Morales duplicate, **and locate Alex Padilla (D2) by querying ALL offices under gov `af811c4b` — not filtered by the two known chamber UUIDs** (RESEARCH open flag), plus live `schema_migrations` MAX and on-disk migration MAX (expect 1011 / 1017 → next 1018).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Each headshot is the ACTUAL Inglewood official (no name-collision; no superimposed text) | INGL-01 | Visual judgment — wrong-person guard (the West Covina lesson) | Human-verify checkpoint: inspect each uploaded portrait against cityofinglewood.org district page |
| Stance chairs match the evidence (CHAIRS model, never polarity) | INGL-01 | Editorial judgment on citation quality | Human-verify checkpoint: each stance has a real source URL + reasoning; no defaulted/neutral values |
| City browse view renders roster + photos + stances; no stale/dup office rows | INGL-01 | Rendered UI | Visit `https://essentials.empowered.vote/results?browse_geo_id=0636546&browse_mtfcc=G4110` |

---

## Validation Sign-Off

- [ ] Each wave's completion-gate assertions pass
- [ ] Wave-1 STOP-on-drift pre-flight re-confirms all DB invariants + locates Padilla + both migration counters
- [ ] Split-section check returns 0 rows post-reconcile
- [ ] Two blocking human-verify checkpoints honored (headshots, stances)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
