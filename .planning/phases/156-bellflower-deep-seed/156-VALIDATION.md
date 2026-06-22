---
phase: 156
slug: bellflower-deep-seed
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-22
---

# Phase 156 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This is a SQL-migration data-seeding phase — "tests" are **DB-state assertion queries**
> run via the Supabase MCP (`mcp__supabase-local__execute_sql`), not a unit-test framework.
> Source of truth for the assertions below: `156-RESEARCH.md` §Validation Architecture.
> **KEY DEVIATION from CONTEXT.md hypothesis (research-confirmed):** Bellflower is **BY-DISTRICT**
> (Ord. 1410, Nov 2021), not at-large — Wave 1 relabels/splits the shared At-Large district
> `8db5a2e5` into D1–D5 (Palmdale 146 / West Covina 152 pattern). Rotational mayor confirmed.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | DB-state assertion SQL via Supabase MCP (`mcp__supabase-local__execute_sql`) |
| **Config file** | none — live Supabase (mcp__supabase-local IS production) |
| **Quick run command** | Wave-1 health one-liner: expect `geo_id='0604982'`, `chamber_count=1`, no LOCAL_EXEC office, 5 distinct district_ids on the offices |
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
| 1 | reconcile | BLFL-01 | DB assertion | `governments.geo_id='0604982'` on `d34bdac8` | ⬜ pending |
| 1 | reconcile | BLFL-01 | DB assertion | exactly 1 'City Council' chamber under `d34bdac8` (no merge — already single) | ⬜ pending |
| 1 | reconcile | BLFL-01 | DB assertion | 4 existing offices bidirectional (0 mismatches); Dunton `-200583` + Koops `-201149` + Morse `-201150` + Sanchez `-201151` `office_id` NOT NULL | ⬜ pending |
| 1 | reconcile | BLFL-01 | DB assertion | LOCAL_EXEC "Bellflower Mayor" district `b0002e15` deleted (0 rows); **no** LOCAL_EXEC office under `d34bdac8`; Dunton's office moved to a D5 LOCAL district | ⬜ pending |
| 1 | reconcile | BLFL-01 | DB assertion | by-district relabel: 5 distinct LOCAL district_id values map D1=Morse, D2=Koops, D3=(pending Santa Ines), D4=Sanchez, D5=Dunton; no two offices share a district_id; no 'Council Member' (space) title; split-section check 0 rows | ⬜ pending |
| 2 | roster | BLFL-01 | DB assertion | chamber `official_count=5`; **Santa Ines** D3 created fresh (new `-7010xx` ext_id) + office bidirectional; **Santa Ines** title='Mayor'; **Sanchez** title='Mayor Pro Tem'; Dunton/Koops/Morse title='Councilmember'; exactly 1 Mayor; all 5 `office_id` NOT NULL; no unlinking (4 existing confirmed current) | ⬜ pending |
| 3 | headshots | BLFL-01 | DB assertion | all 5 current officials each have exactly 1 `type='default'` image w/ `photo_origin_url NOT NULL`; 600×750; Santa Ines image sourced from `/photo_gallery/` path (NOT `/revize_photo_gallery/` which 404s) | ⬜ pending |
| 4 | stances | BLFL-01 | DB assertion | every official w/ findable record has ≥1 stance; 0 retired-topic rows; 0 `judicial-*` rows; `COUNT(answers)=COUNT(context)`; no defaulted/neutral values; honest blanks allowed | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- No test scaffolding required — assertions are ad-hoc SQL against live Supabase via MCP.
- **STOP-on-drift pre-flight (Wave 1, MANDATORY):** before any mutation, re-confirm gov UUID `d34bdac8`,
  chamber UUID `a89b567a`, all 4 offices + members + ext_ids, all 4 link directions (expect one-directional:
  pol.office_id NULL), the shared At-Large district UUID `8db5a2e5`, the LOCAL_EXEC Mayor district `b0002e15`,
  the 4 FULL office UUIDs (Dunton `bdd2040f` / Koops `3935cd4b` / Morse `7408185f` / Sanchez `581c5602`),
  **plus live `schema_migrations` MAX and on-disk migration MAX** (expect on-disk 1041 → next 1042; on-disk
  authoritative — re-confirm both, a parallel workstream could advance either). Also query `MIN(external_id)`
  to confirm the next available `-7010xx` slot for Santa Ines before assigning.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Each headshot is the ACTUAL Bellflower official (no name-collision; no superimposed text) | BLFL-01 | Visual judgment — wrong-person guard (the West Covina lesson) | Human-verify checkpoint: inspect each uploaded portrait against bellflower.ca.gov City Council bio pages |
| District map is correct (D1 Morse / D2 Koops / D3 Santa Ines / D4 Sanchez / D5 Dunton) | BLFL-01 | Editorial judgment vs official redistricting map | Confirm per-member district against bellflower.ca.gov redistricting selected_map.php + bios |
| Santa Ines headshot uses `/photo_gallery/` path (the `/revize_photo_gallery/` path 404s) | BLFL-01 | The Revize CDN path varies per member | Human-verify checkpoint: confirm image loads + is the correct person |
| Stance chairs match the evidence (CHAIRS model, never polarity) | BLFL-01 | Editorial judgment on citation quality | Human-verify checkpoint: each stance has a real source URL + reasoning; no defaulted/neutral values |
| City browse view renders roster + photos + stances; no stale/dup office rows | BLFL-01 | Rendered UI (pre-existing view — no new frontend code in this phase) | Visit `https://essentials.empowered.vote/results?browse_geo_id=0604982&browse_mtfcc=G4110` |

---

## Validation Sign-Off

- [ ] Each wave's completion-gate assertions pass
- [ ] Wave-1 STOP-on-drift pre-flight re-confirms all DB invariants + 4 FULL office UUIDs + both migration counters + next `-7010xx` slot
- [ ] By-district relabel applied (D1–D5, no shared district_id); split-section check returns 0 rows post-reconcile
- [ ] No separate LOCAL_EXEC Mayor office remains (Dunton's mis-seeded Mayor office converted to a D5 council seat)
- [ ] Mayor title on Santa Ines's D3 seat; Mayor Pro Tem on Sanchez D4 (Dec 8 2025 reorg); Dunton/Koops/Morse plain Councilmember
- [ ] Santa Ines (D3) created fresh with a new `-7010xx` ext_id; no roster unlinking (4 existing confirmed current)
- [ ] Two blocking human-verify checkpoints honored (headshots, stances)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
