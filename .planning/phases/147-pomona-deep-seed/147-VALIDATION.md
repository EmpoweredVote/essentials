---
phase: 147
slug: pomona-deep-seed
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-20
---

# Phase 147 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This phase ships DB migrations + headshot upload + evidence-only stances — there is no
> unit-test framework. Validation is **SQL verification queries** against the live Supabase
> Postgres DB (via `mcp__supabase-local__execute_sql` or `psql -f` using
> `C:/EV-Accounts/backend/.env` `DATABASE_URL`), plus manual render spot-checks.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | SQL verification queries (no JS/py test runner applies) |
| **Config file** | none — queries run via MCP `execute_sql` or `psql -f` |
| **Quick run command** | `mcp__supabase-local__execute_sql` (per-migration post-checks) |
| **Full suite command** | Roster + headshot + stance coverage queries for the Pomona gov row (id `3c2c2a4b-a63c-4049-bcf6-e925fcb7d6c4`, geo_id `0658072` after backfill) |
| **Estimated runtime** | ~seconds per query |

---

## Sampling Rate

- **After every task commit:** Run the per-migration post-check query for that task.
- **After every plan wave:** Run the full roster/headshot/stance coverage query set.
- **Before `/gsd:verify-work`:** Full suite must be green (directly-elected Mayor + 6 district seats = 7 officials, geo_id set, single surviving chamber, split-check 0 rows, D1–D6 labels distinct, broken `office_id` links repaired, Ontiveros-Cole D4 created).
- **Max feedback latency:** ~30 seconds.

---

## Per-Task Verification Map

> Pomona-specific facts confirmed in 147-RESEARCH.md (DB queried 2026-06-20). The planner finalizes
> exact per-task SQL as it writes each wave's plan.

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command (SQL gist) | Status |
|---------|------|------|-------------|-----------------|-----------|------------------------------|--------|
| 147-01-* | 01 | 1 | POMO-01 | read-only verify of structural migration; UUID-targeted writes only | SQL | `geo_id='0658072'` set on Pomona gov `3c2c2a4b…` (guarded `WHERE geo_id IS NULL`); exactly **1** surviving council chamber (survivor `ddabfccc`, duplicate `54a55a35` offices moved-then-deleted); shared district UUID `35d17606` resolved into distinct **D4** + **D5** rows; all 6 district labels distinct (D1–D6); `feedback_section_split_check` returns 0 rows for Pomona; migration 926 applied | ⬜ pending |
| 147-02-* | 02 | 2 | POMO-01 | create-not-duplicate; keep both link pointers in sync | SQL | broken `politicians.office_id = NULL` repaired for Garcia/Lustro/Sandoval; Ontiveros-Cole created `-700658` + seated into the **D4** office in survivor chamber with synced bidirectional link; directly-elected **Mayor** modeled per Lancaster LOCAL_EXEC pattern (not rotational title flag); survivor chamber `official_count` reflects full council; all current members `is_active=true`; migration 927 applied | ⬜ pending |
| 147-03-* | 03 | 3 | POMO-01 | no fabricated photos; correct person; no superimposed text; reject stale wrong-person images | SQL | each official with an available portrait gets exactly 1 `politician_images` row (type='default', `photo_origin_url` set); **pomonaca.gov is WAF-403** → use confirmed alt sources (PCE 2020 CivicPlus for Sandoval/Garcia/Lustro/Ontiveros-Cole; existing DB photo for Martin); **reject** stale PCE-2025 wrong-person images for Martin/Canales; Preciado 150×150 too small (document gap or re-source); honest gaps documented; headshot migration is **audit-only** | ⬜ pending |
| 147-04-* | 04 | 4 | POMO-01 | evidence-only, no defaults; chairs model | SQL | every `inform.politician_answers` row has a paired `inform.politician_context` with reasoning + real source URL; **zero** default/placeholder values; honest blanks where no record; **no judicial-* topics** (only `is_live=true` non-judicial); all topic_ids live (no retired IDs); evidence drawn from Legistar / The Pomonan / Nov 17 2025 RSO 5-1 vote; one research agent at a time; stance migrations **audit-only** | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements — no test framework to install (DB-verification phase). Pre-flight SELECTs (re-confirm both chamber UUIDs + their offices, the shared district UUID `35d17606`, the three NULL `office_id` links, the `-700658` ext_id is free, and the current 7-member roster) run before Wave 1 writes and **STOP on drift**.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Roster currency (7 officials) | POMO-01 | Live-data risk — Lustro confirmed not running June 2026 primary; exact seat end dates unclear | Re-confirm the current Mayor + D1–D6 occupants against an official source at apply time before any reseat/create write |
| Mayor identity & office model | POMO-01 | Pomona has a directly-elected citywide Mayor (Lancaster LOCAL_EXEC model), distinct from the rotational Glendale/Palmdale title flag | Confirm who currently holds the directly-elected Mayor seat and that the existing "Pomona Mayor" LOCAL_EXEC row is reused (not duplicated) before writing |
| Headshot identity (WAF-403 city site) | POMO-01 | pomonaca.gov fully WAF-403; alt sources need visual identity confirmation; known stale wrong-person PCE-2025 images | Visually confirm each portrait is the correct person (no superimposed text, eyes ~1/3 from top) BEFORE crop/resize/upload; explicitly reject PCE-2025 Martin/Canales images that show Torres/Gonzalez |
| Compass render spot-check | POMO-01 | Visual correctness | Load Pomona on the browse/compass UI; confirm officials render with photos + non-defaulted stances and no duplicate/stale office rows |

---

## Validation Sign-Off

- [ ] All tasks have a SQL `<automated>` verify or a documented manual-only entry
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 (pre-flight SELECTs) covers existence checks + drift-stop before writes
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
