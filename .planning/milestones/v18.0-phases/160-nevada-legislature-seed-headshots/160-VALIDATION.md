---
phase: 160
slug: nevada-legislature-seed-headshots
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-23
---

# Phase 160 — Validation Strategy

> Per-phase validation contract. This is a **data-seed** phase (no application code), so validation = SQL assertions via Supabase `execute_sql` + `curl` HTTP-200 checks, run inline by the orchestrator (gsd-executor has no Supabase MCP). There is no unit-test framework for seed data in this repo.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | SQL assertions (`mcp__supabase-local__execute_sql`) + `curl -sI` HTTP-200 for CDN headshots |
| **Config file** | none — inline orchestrator runs the queries |
| **Quick run command** | the per-criterion SQL below (per chamber: count = 21 / 42) |
| **Full suite command** | run all 9 checks; all must pass before `/gsd:verify-work` |
| **Estimated runtime** | ~30 seconds (9 SQL queries + headshot spot-checks) |

---

## Sampling Rate

- **After each migration apply:** run that chamber's count check (Senate → 21, Assembly → 42).
- **After the headshot pass:** run the 63-headshot count + CDN HTTP-200 spot-checks.
- **Before `/gsd:verify-work`:** all 9 checks green.
- **Max feedback latency:** ~30 seconds.

---

## Per-Task Verification Map

| Check | Requirement | Test Type | Automated Command (abbrev) | Expected | Status |
|-------|-------------|-----------|-----------------------------|----------|--------|
| Senate count | NV-LEG-01 | SQL | offices in chamber 'Nevada State Senate' @ geo_id=32 | 21 | ⬜ pending |
| Assembly count | NV-LEG-02 | SQL | offices in chamber 'Nevada Assembly' @ geo_id=32 | 42 | ⬜ pending |
| District linkage | NV-LEG-01/02 | SQL | offices→districts GROUP BY district_type | STATE_UPPER 21, STATE_LOWER 42 | ⬜ pending |
| Headshots present | NV-LEG-01/02 | SQL | politician_images for the 63 ext_ids, type='default' | 63 − documented gaps | ⬜ pending |
| Headshots serve | NV-LEG-01/02 | HTTP | `curl -sI <CDN url>` (spot + count) | 200 | ⬜ pending |
| Stances absent | SC#4 | SQL | inform.politician_answers for the 63 ext_ids | 0 | ⬜ pending |
| Casing correct | SC (geo) | SQL | DISTINCT state on linked districts | only 'nv' | ⬜ pending |
| Section-split clean | cross-cutting | SQL | section-split scan (below) | 0 rows | ⬜ pending |
| Ledger | structural | SQL | versions IN ('1053','1054') | only 1053 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red*

### Section-Split Verification SQL (STATE_UPPER/STATE_LOWER, expect 0 rows)
```sql
SELECT g.name, p.full_name, COUNT(DISTINCT ch.government_id) AS gov_count
FROM essentials.politicians p
JOIN essentials.offices o   ON o.politician_id = p.id
JOIN essentials.chambers ch ON ch.id = o.chamber_id
JOIN essentials.governments g ON g.id = ch.government_id
JOIN essentials.districts d ON d.id = o.district_id
WHERE d.state = 'nv' AND d.district_type IN ('STATE_UPPER','STATE_LOWER')
GROUP BY g.name, p.full_name
HAVING COUNT(DISTINCT ch.government_id) > 1;
```

### Address-routing spot check
Legislators are address-routed (not in the statewide-officials list). Pick a known Las Vegas address, confirm via app/`/representatives/me` that the returned State Senator + Assemblymember match the SLDU/SLDL the address falls in. Surfacing review link: `essentials.empowered.vote/results?browse_state_officials=NV` + per-CD/per-district address tests.

---

## Wave 0 Requirements

- [ ] **DB probe A1:** confirm 21 STATE_UPPER + 42 STATE_LOWER districts at `state='nv'`; capture exact geo_id / name_formal keying for Senate (Assembly confirmed 32001–32042).
- [ ] **DB probe:** confirm external_id ranges `-3203001..-3203021` (Senate) and `-3204001..-3204042` (Assembly) are unused.
- [ ] **Operator-verification checkpoint:** review the 63-row roster against leg.state.nv.us before applying migration 1053 (catches any silent mid-2026 appointment).
- [ ] No test-framework install needed (SQL/HTTP assertions only).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Correct-person headshots, no fabrication | NV-LEG-01/02, SC#3 | Visual identity can't be auto-asserted | Operator spot-checks a sample of senators + assembly members render the right person; confirms any documented gaps are genuinely sourceless |
| Address → correct senator + assemblymember | NV-LEG-01/02 | End-to-end geocode+routing | Operator enters Las Vegas + Reno addresses; confirms correct SD + AD member resolve |

---

## Validation Sign-Off

- [ ] All success criteria have an SQL/HTTP assertion or a documented manual check
- [ ] Wave 0 probes resolve the Senate keying + external_id-collision unknowns before any write
- [ ] Roster operator-checkpoint precedes migration 1053 apply
- [ ] Section-split + casing + stance-absence gates all green
- [x] `nyquist_compliant: true`

**Approval:** pending
