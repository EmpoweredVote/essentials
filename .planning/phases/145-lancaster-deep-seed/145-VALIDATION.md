---
phase: 145
slug: lancaster-deep-seed
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-19
---

# Phase 145 — Validation Strategy

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
| **Full suite command** | Roster + headshot + stance coverage queries for the Lancaster gov row (`City of Lancaster, California, US`, geo_id `0640130` after backfill) |
| **Estimated runtime** | ~seconds per query |

---

## Sampling Rate

- **After every task commit:** Run the per-migration post-check query for that task.
- **After every plan wave:** Run the full roster/headshot/stance coverage query set.
- **Before `/gsd:verify-work`:** Full suite must be green (5-seat roster, geo_id set, single chamber, split-check returns 0 rows).
- **Max feedback latency:** ~30 seconds.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command (SQL gist) | Status |
|---------|------|------|-------------|-----------------|-----------|------------------------------|--------|
| 145-01-* | 01 | 1 | LANC-01 | read-only verify of structural migration | SQL | `geo_id='0640130'` set on Lancaster gov; exactly **1** chamber slug `lancaster-city-council`; `feedback_section_split_check` returns 0 rows for Lancaster | ⬜ pending |
| 145-02-* | 02 | 2 | LANC-01 | reseat-not-duplicate; retire-not-delete | SQL | survivor chamber has **5** offices (1 Mayor + 4 Councilmember); Parris/-200795, Hughes-Leslie/-201279, Mann/-201281 office-linked; White/-700655 + Castellanos/-700656 created+seated; Crist/686320 is_active=false (preserved) | ⬜ pending |
| 145-03-* | 03 | 3 | LANC-01 | no fabricated photos | SQL | `politician_images` row (type='default', press_use) per member with an available portrait; documented gaps for WAF-blocked sources; no superimposed-text images | ⬜ pending |
| 145-04-* | 04 | 4 | LANC-01 | evidence-only, no defaults | SQL | every `inform.politician_answers` row has a paired `inform.politician_context` with reasoning + real source URL; **zero** default/placeholder values; honest blanks where no record; no judicial-* topics | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements — no test framework to install (DB-verification phase). Pre-flight SELECTs (roster existence, chamber UUIDs, ext_id block) run before Wave 1 writes.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Headshot source retrieval | LANC-01 | cityoflancasterca.org is Akamai-WAF/403 (`checkpoint:human-verify`) | Executor opens the official councilmember page in a browser (or uses the Wikimedia/AVAQMD/Ballotpedia fallbacks noted in RESEARCH.md) to obtain each portrait before processing |
| Roster currency (election turnover) | LANC-01 | Live-data risk — seats can change | Re-confirm the 5 current members against cityoflancasterca.gov / AV Press at apply time before any reseat/retire write |
| Compass render spot-check | LANC-01 | Visual correctness | Load Lancaster on the browse/compass UI; confirm 5 members render with photos + non-defaulted stances and no duplicate/stale rows |

---

## Validation Sign-Off

- [ ] All tasks have a SQL `<automated>` verify or a documented manual-only entry
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 (pre-flight SELECTs) covers existence checks before writes
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
