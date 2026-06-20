---
phase: 143
slug: santa-clarita-deep-seed
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-19
---

# Phase 143 — Validation Strategy

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
| **Full suite command** | Roster + headshot + stance coverage queries for gov `42164a8f-2e0a-4786-9099-ce36f3f97101` |
| **Estimated runtime** | ~seconds per query |

---

## Sampling Rate

- **After every migration:** Run the migration's post-verification query (row counts, no NULLs, no duplicate chamber names, no orphan offices)
- **After the structure wave:** Verify gov `geo_id=0669088`; exactly ONE `'City Council'` chamber remains (Chamber A `-200978` retired); 5 council offices all linked to current members; Smyth (`-700180`) detached (`office_id NULL, is_incumbent=false, is_active=false`); run `feedback_section_split_check` query (0 rows)
- **Before `/gsd:verify-work`:** Full roster (5 current councilmembers: Weste/Ayala/Gibbs/McLean/Miranda) seated, Weste flagged Mayor; headshots present-or-documented; stance coverage complete with 100% citation and honest blanks
- **Max feedback latency:** seconds (interactive SQL)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 143-01-01 | 01 | 1 | SCLR-01 | — | N/A (read-only verification) | sql | `SELECT geo_id FROM essentials.governments WHERE id='42164a8f-...'` returns `0669088` | ✅ | ⬜ pending |
| 143-01-02 | 01 | 1 | SCLR-01 | — | N/A | sql | Chamber A (`-200978`) + its 3 offices deleted; exactly 1 `'City Council'` chamber (`11243`) remains; split-section check returns 0 rows | ✅ | ⬜ pending |
| 143-01-03 | 01 | 1 | SCLR-01 | — | N/A | sql | Smyth (`-700180`) `office_id IS NULL AND is_incumbent=false AND is_active=false` (retired, not reseated) | ✅ | ⬜ pending |
| 143-02-01 | 02 | 2 | SCLR-01 | — | N/A | sql | 5 current councilmembers seated in chamber `11243` (Weste/Ayala/Gibbs in DB + McLean/Miranda inserted w/ reserved `-700xxx`); Weste seat title flags Mayor; titles normalized to `'Councilmember'` | ✅ | ⬜ pending |
| 143-03-01 | 03 | 3 | SCLR-01 | — | N/A | sql | `politician_images` exactly 1 `type='default'` per member (Gibbs deduped 2→1); McLean/Miranda/any-gap headshots present-or-documented (600×750) | ✅ | ⬜ pending |
| 143-04-01 | 04 | 4 | SCLR-01 | — | N/A | sql | `inform.politician_answers` rows > 0 for each member with a findable record; 100% citation; blanks honest; no defaults | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · Task IDs are indicative — finalize against PLAN.md.*

---

## Wave 0 Requirements

- Existing DB + MCP/psql access covers all phase verification. No test framework install required.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Roster currency (the 5 seated are the CURRENT council; Smyth correctly excluded) | SCLR-01 | Requires cross-check vs santaclarita.gov | Confirm Weste/Ayala/Gibbs/McLean/Miranda against the live city-council page; confirm Smyth departed |
| Stance evidence quality (every value cites a real public-record source; no defaulted values) | SCLR-01 | Evidence judgment can't be automated | Spot-check each `politician_answers` row has a citation; confirm blank spokes where record is silent |
| Headshot correctness (right person, 600×750, no superimposed text) | SCLR-01 | Visual check | Open uploaded portraits (santaclarita.gov WordPress PNGs); confirm crop/quality |
| Browse render spot-check (roster + photos display) | SCLR-01 | UI render | Load a Santa Clarita address in the app; confirm roster + photos appear (Landing.jsx coverage wiring is Phase 157) |

---

## Validation Sign-Off

- [ ] Every migration has a post-verification SQL check
- [ ] Structure wave passes `feedback_section_split_check` (one chamber, no split sections, no orphan offices)
- [ ] Smyth retired (detached, not reseated); roster complete: 5 current councilmembers seated and linked
- [ ] Headshots: 1 `type='default'` per member or documented gap
- [ ] Stances: full coverage with 100% citation, honest blanks, no defaults
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
