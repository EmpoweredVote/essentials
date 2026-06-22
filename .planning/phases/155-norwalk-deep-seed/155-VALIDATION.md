---
phase: 155
slug: norwalk-deep-seed
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-22
---

# Phase 155 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This is a SQL-migration data-seeding phase — "tests" are **DB-state assertion queries**
> run via the Supabase MCP (`mcp__supabase-local__execute_sql`), not a unit-test framework.
> Source of truth for the assertions below: `155-RESEARCH.md` §Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | DB-state assertion SQL via Supabase MCP (`mcp__supabase-local__execute_sql`) |
| **Config file** | none — live Supabase (mcp__supabase-local IS production) |
| **Quick run command** | Wave-1 health one-liner (see §Quick Health Check in RESEARCH.md): expect `geo_id='0652526'`, `chamber_count=1`, `official_count=5` |
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
| 1 | reconcile | NRWK-01 | DB assertion | `governments.geo_id='0652526'` on `15897159` | ⬜ pending |
| 1 | reconcile | NRWK-01 | DB assertion | exactly 1 'City Council' chamber under `15897159`; DOOMED `e7e787f7` deleted (0 rows) | ⬜ pending |
| 1 | reconcile | NRWK-01 | DB assertion | all 5 offices in survivor `97397b0f`; all bidirectional (0 mismatches); Ayala `-200876` + Ramirez `-201327` + Rios `-201328` + Valencia `-201329` `office_id` NOT NULL | ⬜ pending |
| 1 | reconcile | NRWK-01 | DB assertion | doomed At-Large district `f9e8037d` deleted (0 rows); LOCAL_EXEC "Norwalk Mayor" district `4126e079` deleted (0 rows); **no** LOCAL_EXEC office under `15897159`; split-section check returns 0 rows | ⬜ pending |
| 2 | roster | NRWK-01 | DB assertion | survivor `official_count=5`; all 5 district labels `At-Large` (NO relabel); **Perez** title='Mayor'; **Rios** title='Vice Mayor'; **Ayala** title='Councilmember'; titles normalized to 'Councilmember' (no 'Council Member'); no unlinking (all 5 stay active) | ⬜ pending |
| 3 | headshots | NRWK-01 | DB assertion | all 5 current officials each have exactly 1 `type='default'` image w/ `photo_origin_url NOT NULL`; Ramirez image replaced w/ corrected URL; 600×750 | ⬜ pending |
| 4 | stances | NRWK-01 | DB assertion | every official w/ findable record has ≥1 stance; 0 retired-topic rows; 0 `judicial-*` rows; `COUNT(answers)=COUNT(context)`; honest blanks allowed | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- No test scaffolding required — assertions are ad-hoc SQL against live Supabase via MCP.
- **STOP-on-drift pre-flight (Wave 1, MANDATORY):** before any mutation, re-confirm gov UUID `15897159`, both chamber UUIDs (SURVIVOR `97397b0f` / DOOMED `e7e787f7`), all 5 offices + members + ext_ids, both link directions, all three district UUIDs (survivor At-Large `5677c0ab` / doomed At-Large `f9e8037d` / LOCAL_EXEC Mayor `4126e079`), **plus live `schema_migrations` MAX and on-disk migration MAX** (expect on-disk 1033 → next 1034; on-disk authoritative — re-confirm both, a parallel workstream could advance either).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Each headshot is the ACTUAL Norwalk official (no name-collision; no superimposed text) | NRWK-01 | Visual judgment — wrong-person guard (the West Covina lesson) | Human-verify checkpoint: inspect each uploaded portrait against norwalkca.gov City Council bio pages |
| Ramirez headshot uses the corrected live URL (old DB URL returns 404) | NRWK-01 | The DB-seeded Ramirez image 404s on the Revize CDN | Human-verify checkpoint: confirm new image loads + is the correct person |
| Stance chairs match the evidence (CHAIRS model, never polarity) | NRWK-01 | Editorial judgment on citation quality | Human-verify checkpoint: each stance has a real source URL + reasoning; no defaulted/neutral values |
| City browse view renders roster + photos + stances; no stale/dup office rows | NRWK-01 | Rendered UI | Visit `https://essentials.empowered.vote/results?browse_geo_id=0652526&browse_mtfcc=G4110` |

---

## Validation Sign-Off

- [ ] Each wave's completion-gate assertions pass
- [ ] Wave-1 STOP-on-drift pre-flight re-confirms all DB invariants + both migration counters
- [ ] Split-section check returns 0 rows post-reconcile
- [ ] No At-Large→District relabeling occurred (Norwalk stays at-large)
- [ ] No separate LOCAL_EXEC Mayor office remains (mis-seeded Mayor office converted to a council seat; rotational title-on-seat only)
- [ ] Mayor title on Perez's seat, Vice Mayor on Rios (Dec 9 2025 reorg), Ayala plain Councilmember
- [ ] No roster unlinking (all 5 confirmed current)
- [ ] Two blocking human-verify checkpoints honored (headshots, stances)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
