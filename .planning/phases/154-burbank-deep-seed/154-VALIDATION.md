---
phase: 154
slug: burbank-deep-seed
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-21
---

# Phase 154 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This is a SQL-migration data-seeding phase — "tests" are **DB-state assertion queries**
> run via the Supabase MCP (`mcp__supabase-local__execute_sql`), not a unit-test framework.
> Source of truth for the assertions below: `154-RESEARCH.md` §Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | DB-state assertion SQL via Supabase MCP (`mcp__supabase-local__execute_sql`) |
| **Config file** | none — live Supabase (mcp__supabase-local IS production) |
| **Quick run command** | Wave-1 health one-liner (see §Quick Run Command in RESEARCH.md): expect `geo_id='0608954'`, `chamber_count=1`, `official_count=5` |
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
| 1 | reconcile | BURB-01 | DB assertion | `governments.geo_id='0608954'` on `3e3deaea` | ⬜ pending |
| 1 | reconcile | BURB-01 | DB assertion | exactly 1 'City Council' chamber under `3e3deaea`; DOOMED `6a72dbe8` deleted (0 rows) | ⬜ pending |
| 1 | reconcile | BURB-01 | DB assertion | all 5 offices in survivor `73422d25`; all bidirectional (0 mismatches); Anthony `-201161` + Mullins `-201162` `office_id` NOT NULL | ⬜ pending |
| 1 | reconcile | BURB-01 | DB assertion | doomed At-Large district `809bbb35` deleted (0 rows); split-section check returns 0 rows | ⬜ pending |
| 2 | roster | BURB-01 | DB assertion | survivor `official_count=5`; all 5 labels stay `At-Large` (NO relabel); Takahashi title='Mayor'; Mullins title='Vice Mayor'; **no** LOCAL_EXEC office under `3e3deaea` | ⬜ pending |
| 3 | headshots | BURB-01 | DB assertion | all 5 current officials each have exactly 1 `type='default'` image w/ `photo_origin_url NOT NULL`; Rizzotti + Takahashi gaps filled; 600×750 | ⬜ pending |
| 4 | stances | BURB-01 | DB assertion | every official w/ findable record has ≥1 stance; 0 retired-topic rows; 0 `judicial-*` rows; `COUNT(answers)=COUNT(context)`; honest blanks allowed | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- No test scaffolding required — assertions are ad-hoc SQL against live Supabase via MCP.
- **STOP-on-drift pre-flight (Wave 1, MANDATORY):** before any mutation, re-confirm gov UUID `3e3deaea`, both chamber UUIDs (SURVIVOR `73422d25` / DOOMED `6a72dbe8`), all 5 offices + members + ext_ids, both link directions, both At-Large district UUIDs (survivor `15458750` / doomed `809bbb35`), **plus live `schema_migrations` MAX and on-disk migration MAX** (expect on-disk 1025 / live 999 → next 1026; on-disk authoritative — re-confirm both, a parallel workstream could advance either).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Each headshot is the ACTUAL Burbank official (no name-collision; no superimposed text) | BURB-01 | Visual judgment — wrong-person guard (the West Covina lesson) | Human-verify checkpoint: inspect each uploaded portrait against burbankca.gov/elected-officials |
| Mullins existing DB image is a council-member portrait (not a stale City-Clerk headshot) | BURB-01 | Visual judgment — Mullins seeded before her council role was confirmed | Human-verify checkpoint: compare existing image to official `20241223-zizette-mullins-portrait-002.jpg` |
| Stance chairs match the evidence (CHAIRS model, never polarity) | BURB-01 | Editorial judgment on citation quality | Human-verify checkpoint: each stance has a real source URL + reasoning; no defaulted/neutral values |
| City browse view renders roster + photos + stances; no stale/dup office rows | BURB-01 | Rendered UI | Visit `https://essentials.empowered.vote/results?browse_geo_id=0608954&browse_mtfcc=G4110` |

---

## Validation Sign-Off

- [ ] Each wave's completion-gate assertions pass
- [ ] Wave-1 STOP-on-drift pre-flight re-confirms all DB invariants + both migration counters
- [ ] Split-section check returns 0 rows post-reconcile
- [ ] No At-Large→District relabeling occurred (Burbank stays at-large)
- [ ] No separate LOCAL_EXEC Mayor office created (rotational title-on-seat only)
- [ ] No roster unlinking (all 5 confirmed current; Mullins is Vice Mayor, not City Clerk)
- [ ] Three blocking human-verify checkpoints honored (headshots incl. Mullins, stances)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
