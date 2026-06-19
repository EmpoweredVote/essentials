---
phase: 142
slug: long-beach-deep-seed
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-19
---

# Phase 142 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This phase ships DB migrations + headshot uploads + evidence-only stances — there is no
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
| **Full suite command** | Roster + headshot + stance coverage queries for gov `5e5c3e0b-5479-4759-ac7e-2ea0aecabd38` |
| **Estimated runtime** | ~seconds per query |

---

## Sampling Rate

- **After every migration:** Run the migration's post-verification query (row counts, no NULLs, no duplicate chamber names)
- **After the structure wave:** Verify gov `geo_id=0643000`, single Mayor chamber + single Council chamber (no duplicate `name_formal`), 9 council offices + 3 citywide officer offices all linked, no orphan/duplicate office rows (run `feedback_section_split_check` query)
- **Before `/gsd:verify-work`:** Full roster (12 officials) seated; headshots present-or-documented; stance coverage complete with 100% citation and honest blanks
- **Max feedback latency:** seconds (interactive SQL)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 142-01-01 | 01 | 1 | LBCH-01 | — | N/A (read-only verification) | sql | `SELECT geo_id FROM essentials.governments WHERE id='5e5c3e0b-...'` returns `0643000` | ✅ | ⬜ pending |
| 142-01-02 | 01 | 1 | LBCH-01 | — | N/A | sql | duplicate-chamber check returns 0 rows (Mayor chamber renamed) | ✅ | ⬜ pending |
| 142-02-01 | 02 | 2 | LBCH-01 | — | N/A | sql | 12 officials linked to LB offices (Mayor + 9 council + 3 citywide officers) | ✅ | ⬜ pending |
| 142-03-01 | 03 | 3 | LBCH-01 | — | N/A | sql | `politician_images` exactly 1 `type='default'` per official (dedupe done); new officers present-or-gap-documented | ✅ | ⬜ pending |
| 142-04-01 | 04 | 4 | LBCH-01 | — | N/A | sql | `inform.politician_answers` rows > 0 for each official with a findable record; 100% citation; blanks honest | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · Task IDs are indicative — finalize against PLAN.md.*

---

## Wave 0 Requirements

- Existing DB + MCP/psql access covers all phase verification. No test framework install required.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Stance evidence quality (every value cites a real public-record source; no defaulted values) | LBCH-01 | Evidence judgment can't be automated | Spot-check each `politician_answers` row has a citation; confirm blank spokes where record is silent |
| Headshot correctness (right person, 600×750, no superimposed text) | LBCH-01 | Visual check | Open uploaded portraits for the 3 new officers; confirm crop/quality |
| Browse render spot-check (roster + photos display) | LBCH-01 | UI render | Load a Long Beach address in the app; confirm roster + photos appear (note: Landing.jsx coverage wiring is Phase 157) |

---

## Validation Sign-Off

- [ ] Every migration has a post-verification SQL check
- [ ] Structure wave passes `feedback_section_split_check` (no split sections, no duplicate chamber names)
- [ ] Roster complete: 12 officials seated and linked
- [ ] Headshots: 1 `type='default'` per official or documented gap
- [ ] Stances: full coverage with 100% citation, honest blanks, no defaults
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
