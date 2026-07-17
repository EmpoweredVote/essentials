---
phase: 198
slug: south-tucson-deep-seed
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-17
---

# Phase 198 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

This is a data-seeding phase (SQL migrations + asset wiring), not an application-code
phase. There is no unit-test framework: verification is fast `grep` assertions against
source files (`buildingImages.js`, `coverage.js`, migration SQL) and `psql` / Supabase-MCP
row-count assertions against the live DB — the same shape approved for Sahuarita (197),
Marana (196), and Oro Valley (195).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — SQL migrations verified via `psql` / Supabase MCP row assertions + `grep` source assertions |
| **Config file** | none |
| **Quick run command** | `grep` assertion on the just-modified file (per task) |
| **Full suite command** | Section-split scan SQL + enclave-routing (`ST_Covers` / `ST_Intersection`) probe + roster/stance/headshot row-count queries against the South Tucson government |
| **Estimated runtime** | < 10 seconds per DB assertion |

---

## Sampling Rate

- **After every task commit:** Run the task's `grep`/`psql` acceptance assertion.
- **After every plan wave:** Run the DB row-count assertions for rows created in that wave (govt, chamber, district, officials, headshots, stances).
- **Before `/gsd:verify-work`:** Section-split scan returns 0 defects AND enclave-routing probe confirms an in-South-Tucson address routes to South Tucson (not Tucson) AND coverage chip reflects DB-honest counts.
- **Max feedback latency:** ~10 seconds.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 198-01-xx | 01 | 1 | SUB-04 | — | N/A (DB seed, no runtime surface) | psql | row-count on `essentials.governments` / `chambers` / `districts` for South Tucson (geo_id 0468850); enclave-routing `ST_Covers` probe returns South Tucson exclusively | ❌ W0 | ⬜ pending |
| 198-02-xx | 02 | 2 | SUB-04 | — | N/A | psql | headshot rows in `essentials.politician_images` (`type='default'`, `press_use`) for each seated official | ❌ W0 | ⬜ pending |
| 198-03-xx | 03 | 3 | SUB-04 | — | N/A | psql | evidence-only stance rows in `inform.politician_answers` (100% cited, no defaults) | ❌ W0 | ⬜ pending |
| 198-04-xx | 04 | 4 | BANR-01 | — | N/A | grep | `cities/south-tucson.jpg` uploaded + `CURATED_LOCAL` entry + attribution in `buildingImages.js`; South Tucson chip in `coverage.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky. Task IDs are representative — execute-phase tracks concrete IDs.*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements — no test framework to install. Each migration ships with a BLOCKING apply-and-row-assert checkpoint (per Sahuarita/Marana/Oro Valley precedent), and each asset-wiring task ships with a `grep` source assertion.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| BLOCKING roster-currency re-verify | SUB-04 | Live web state (southtucsonaz.gov, Cloudflare-blocked) + **July 21 2026 primary (4 days out)** + the **sitting Mayor is herself an incumbent candidate** + council re-votes Mayor/Vice-Mayor/Acting-Mayor titles — none assertable from a static file | Immediately before applying the roster migration, re-fetch the official council roster AND confirm the current Mayor / Vice-Mayor / Acting-Mayor title holders; block if membership or titles changed |
| Banner is a real licensed street-scene (no AI, no aerial; NOT Catalina/Tortolita mountains, NOT downtown Tucson) | BANR-01 | Visual + licensing judgment; mural front-runner subject has no confirmed Commons photo yet | Human reviews sourced candidate(s) + attribution before upload; attempt mural/streetscape first, fall back to verified City Hall / welcome-sign candidates |

---

## Validation Sign-Off

- [ ] All tasks have automated verify (grep/psql) or a documented manual-only justification
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Every migration has a BLOCKING apply-and-row-assert checkpoint
- [ ] Enclave-routing probe (D-03) included as a BLOCKING pre-seed check
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter (set by plan-checker on approval)

**Approval:** pending
