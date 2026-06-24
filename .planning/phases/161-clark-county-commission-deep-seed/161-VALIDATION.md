---
phase: 161
slug: clark-county-commission-deep-seed
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-23
---

# Phase 161 — Validation Strategy

> Data-seed phase: validation is SQL/HTTP assertions run by the inline orchestrator (gsd-executor has NO supabase MCP). No pytest/jest.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | SQL assertions via `mcp__supabase-local__execute_sql` + `curl` HTTP-200 checks |
| **Config file** | none — inline orchestrator runs the queries; migrations applied via `psql -f` (DATABASE_URL from `C:/EV-Accounts/backend/.env`) |
| **Quick run command** | per-criterion SQL below (office count → 7) |
| **Full suite command** | all 9 checks; all must pass before `/gsd:verify-work` |
| **Estimated runtime** | < 30 seconds |

---

## Sampling Rate

- **Per migration apply:** office count check (→ 7).
- **Per phase gate:** all 9 checks green + stance rows > 0 for all 7 commissioners before `/gsd:verify-work`.
- **Max feedback latency:** < 30 seconds.

---

## Per-Task Verification Map (9 checks)

| # | Requirement | Check | Command (expected) | Status |
|---|-------------|-------|--------------------|--------|
| 1 | CLARK-01 | BCC office count | `offices in chamber 'Board of County Commissioners' under government 'Clark County, Nevada, US'` → **7** | ⬜ |
| 2 | CLARK-01 | County-district linkage | `offices→districts where d.geo_id='32003' AND d.district_type='COUNTY' AND d.state='nv'` → **7** | ⬜ |
| 3 | CLARK-01 | Headshots present | `politician_images (type='default') for external_id BETWEEN -3200307 AND -3200301` → **7 minus documented gaps** | ⬜ |
| 4 | CLARK-01 | Headshots serve | `curl -sI` each CDN url → **200** (all 7) | ⬜ |
| 5 | CLARK-01 | Evidence-only stances | `inform.politician_answers for the 7 commissioners` → **≥1 per sourced commissioner**, 100% cited, zero defaults | ⬜ |
| 6 | SC | Section-split | COUNTY-tier split SQL below → **0 rows** | ⬜ |
| 7 | SC | Casing | `DISTINCT state on linked districts` → only **'nv'** lowercase | ⬜ |
| 8 | SC | Ledger | `versions 1055/1056 registered` → only **1055** (audit-only 1056 NOT registered); MAX=1055 | ⬜ |
| 9 | SC | No phantom 8th seat | office count = **exactly 7** (Chair is a title-on-seat, not a separate row) | ⬜ |
| — | SC#4 | Coverage chip | `src/lib/coverage.js` COVERAGE_COUNTIES contains Clark County `browseGovernmentList:['32003']`, `hasContext:true` | ⬜ |

### Section-Split Verification SQL (COUNTY tier) — expect 0 rows
```sql
SELECT g.name, p.full_name, COUNT(DISTINCT ch.government_id) AS gov_count
FROM essentials.politicians p
JOIN essentials.offices o   ON o.politician_id = p.id
JOIN essentials.chambers ch ON ch.id = o.chamber_id
JOIN essentials.governments g ON g.id = ch.government_id
JOIN essentials.districts d ON d.id = o.district_id
WHERE d.geo_id = '32003' AND d.district_type = 'COUNTY'
GROUP BY g.name, p.full_name
HAVING COUNT(DISTINCT ch.government_id) > 1;
```

### Address-routing spot check (headline success criterion #1)
A Las Vegas Strip / Paradise address (e.g. `3600 S Las Vegas Blvd, Las Vegas, NV 89109` — Bellagio, unincorporated Paradise) → `/representatives/me` returns "Clark County" with 7 commissioner offices and **no** City-of-Las-Vegas officials. Browse link: `essentials.empowered.vote/results?browse_government_list=32003&browse_label=Clark+County&browse_state=NV&browse_skip_overlap=1`

---

## Wave 0 Requirements (mandatory probes BEFORE authoring/applying SQL)

- [ ] DB probe: ledger MAX → assert **1053**; next structural = **1055**.
- [ ] DB probe: external_id range **-3200301..-3200307** unused in `essentials.politicians`.
- [ ] DB probe: Clark County COUNTY district exists, `state='nv'` (✅ **pre-confirmed 2026-06-23**: id `f3708f34-…`, geo_id 32003, state 'nv').
- [ ] Operator-verification checkpoint: confirm 7-member roster (Chair = **Naft**, NOT Kirkpatrick) against clarkcountynv.gov before applying mig 1055.
- [ ] No test-framework install (SQL/HTTP only).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Correct-person headshots, no overlay, Chair-first ordering | CLARK-01 / SC#2 | Visual correctness not SQL-checkable | Operator spot-checks commissioner profiles in-app; confirm Naft sorts first |
| Address routing (Strip → county, not city) | CLARK-01 / SC#1 | PIP routing best confirmed in live app | Enter Strip + City-of-LV addresses; confirm correct LOCAL section |

---

## Validation Sign-Off

- [ ] All 9 checks have automated SQL/HTTP verification
- [ ] Wave-0 probes complete (ledger, external_id, casing, roster checkpoint)
- [ ] Section-split = 0; ledger MAX=1055; casing 'nv'
- [ ] Stance rows present for all sourced commissioners, evidence-only, zero defaults
- [x] `nyquist_compliant: true`

**Approval:** pending
