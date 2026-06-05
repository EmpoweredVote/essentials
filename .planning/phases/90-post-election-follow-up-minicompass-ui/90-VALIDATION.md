---
phase: 90
slug: post-election-follow-up-minicompass-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-04
---

# Phase 90 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Visual / manual (UI); SQL queries via mcp__supabase-local (DB) |
| **Config file** | none |
| **Quick run command** | Visual check in browser after each UI change |
| **Full suite command** | `npm run dev` → navigate to /elections or /results with compass active |
| **Estimated runtime** | ~30 seconds (DB queries instant; UI manual) |

---

## Sampling Rate

- **After every task commit:** Run quick browser check (UI tasks) or SQL query (DB tasks)
- **After every plan wave:** Run full suite — dev server + visual MiniCompass inspection
- **Before `/gsd-verify-work`:** All DB queries green + visual sign-off on MiniCompass
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| ME race_candidates insert | 01 | 1 | POST-ELECTION-01 | — | N/A | SQL query | `SELECT COUNT(*) FROM essentials.race_candidates rc JOIN essentials.races r ON rc.race_id = r.id JOIN essentials.elections e ON r.election_id = e.id WHERE e.state='23' AND e.election_date='2026-11-03'` | ✅ | ⬜ pending |
| lavote election_id update | 01 | 1 | POST-ELECTION-02 | — | N/A | SQL query | `SELECT election_id FROM essentials.discovery_jurisdictions WHERE source_url LIKE '%lavote%'` | ✅ | ⬜ pending |
| ev-ui dotRadius patch | 02 | 1 | UI-01 | — | N/A | manual | Visual inspection — hover candidate tile, dots visually ~50% smaller | ❌ Wave 0 | ⬜ pending |
| MiniCompass showLabels | 02 | 1 | UI-02 | — | N/A | manual | Visual inspection — no label text or reserved whitespace visible | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- UI-01 and UI-02 are visual requirements — no automated test can verify them. Human UAT is the gate.

*Existing DB infrastructure (mcp__supabase-local) covers all DB requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dots visually ~50% smaller | UI-01 | SVG r= values have no DOM-testable assertion | Run dev server → navigate to /elections or /results → hover candidate tile → confirm radar dots are visually smaller than before |
| No labels/titles visible, no whitespace reserved | UI-02 | CSS/SVG rendering requires visual inspection | Run dev server → hover candidate tile → confirm no spoke labels, no chart title, no visible whitespace gutters around chart |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
