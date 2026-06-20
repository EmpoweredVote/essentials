---
phase: 146
slug: palmdale-deep-seed
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-20
---

# Phase 146 — Validation Strategy

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
| **Full suite command** | Roster + headshot + stance coverage queries for the Palmdale gov row (`City of Palmdale, California, US`, id `4f59ebad-631b-4340-91f0-091a6cecb3bb`, geo_id `0655156` after backfill) |
| **Estimated runtime** | ~seconds per query |

---

## Sampling Rate

- **After every task commit:** Run the per-migration post-check query for that task.
- **After every plan wave:** Run the full roster/headshot/stance coverage query set.
- **Before `/gsd:verify-work`:** Full suite must be green (5-seat roster, geo_id set, single chamber, split-check 0 rows, D1–D5 labels, Bishop link repaired, Mayor flagged on Ohlsen).
- **Max feedback latency:** ~30 seconds.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command (SQL gist) | Status |
|---------|------|------|-------------|-----------------|-----------|------------------------------|--------|
| 146-01-* | 01 | 1 | PLMD-01 | read-only verify of structural migration; UUID-targeted writes only | SQL | `geo_id='0655156'` set on Palmdale gov `4f59ebad…` (guarded `WHERE geo_id IS NULL`); exactly **1** chamber slug `palmdale-city-council` (survivor `000d672d`, `c8e8d31e` deleted); 4 occupied district rows relabeled D1/D2/D4/D5 + new **District 3** row created; `feedback_section_split_check` returns 0 rows for Palmdale; migration 918 registers in `schema_migrations` | ⬜ pending |
| 146-02-* | 02 | 2 | PLMD-01 | create-not-duplicate; keep both link pointers in sync | SQL | Bishop `-201331` `politicians.office_id` repaired (was NULL → office `198661de`); Bettencourt created `-700657` + seated into a **District 3** office in survivor chamber with synced bidirectional link; `title='Mayor'` on Ohlsen's D4 seat `a67a975e` (other 4 = `Councilmember`); survivor chamber `official_count=5`, all 5 `is_active=true`; migration 919 registers in `schema_migrations` | ⬜ pending |
| 146-03-* | 03 | 3 | PLMD-01 | no fabricated photos; correct person; no superimposed text | SQL | Bettencourt `-700657` gets exactly 1 `politician_images` row (type='default', `press_use`, `photo_origin_url` set) from the city ImageRepository portrait (4:5 crop → 600×750 Lanczos q90 JPEG → Storage); all 5 current members have ≥1 type='default' image; Bishop's `scraped_no_license` legacy entry superseded; headshot migration is **audit-only** (schema_migrations MAX unchanged) | ⬜ pending |
| 146-04-* | 04 | 4 | PLMD-01 | evidence-only, no defaults; chairs model | SQL | every `inform.politician_answers` row for the 5 members has a paired `inform.politician_context` with reasoning + real source URL; **zero** default/placeholder values (no neutral/likely defaulting); honest blanks where no record; **no judicial-* topics** (only `is_live=true` non-judicial); all topic_ids live (no retired IDs); stance migrations are **audit-only** (schema_migrations MAX unchanged) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements — no test framework to install (DB-verification phase). Pre-flight SELECTs (re-confirm both link directions, chamber/office/district UUIDs, ext_id block, Bishop's NULL back-pointer, current mayor) run before Wave 1 writes and **STOP on drift**.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Current Mayor flag (`title='Mayor'`) | PLMD-01 | Live-data risk — rotational mayor selected each December; method changed 4/2025; a 2025 title dispute (Loa stripped 7/2025 → Bettencourt interim → Ohlsen selected 12/2/2025) | Re-confirm Eric Ohlsen (D4) currently holds the Mayor title against cityofpalmdaleca.gov + AV Press at apply time before writing `title='Mayor'` on office `a67a975e` |
| Roster currency | PLMD-01 | Live-data risk — seats can change (D3/D4/D5 up Nov 2026, out of scope) | Re-confirm the 5 current members (D1 Bishop, D2 Loa, D3 Bettencourt, D4 Ohlsen, D5 Alarcón) at apply time before any reseat/create write |
| Bettencourt headshot retrieval | PLMD-01 | Portrait fetched from city ImageRepository (HTTP 200, no WAF per research) — but visual correctness is human-judged | Confirm the downloaded portrait is the correct Laura Bettencourt, no superimposed text/graphics, eyes ~1/3 from top, before crop/resize/upload; fallbacks: Ballotpedia / campaign site if city image fails |
| Compass render spot-check | PLMD-01 | Visual correctness | Load Palmdale on the browse/compass UI; confirm 5 members render with photos + non-defaulted stances and no duplicate/stale office rows |

---

## Validation Sign-Off

- [ ] All tasks have a SQL `<automated>` verify or a documented manual-only entry
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 (pre-flight SELECTs) covers existence checks + drift-stop before writes
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
