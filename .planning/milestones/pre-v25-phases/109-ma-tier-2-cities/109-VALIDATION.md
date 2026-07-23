---
phase: 109
slug: ma-tier-2-cities
status: draft
nyquist_compliant: true
nyquist_rationale: "Inline SQL DO blocks in each migration (Step 7) serve as automated gate enforcement — RAISE EXCEPTION on any count mismatch fires at apply time."
wave_0_complete: true
created: 2026-06-10
---

# Phase 109 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | SQL post-verification DO blocks (project pattern) |
| **Config file** | None — inline in migration files |
| **Quick run command** | Apply migration via Supabase MCP, read RAISE NOTICE output |
| **Full suite command** | Section-split query + politician count + office_id NULL check per city |
| **Estimated runtime** | ~30 seconds per migration |

---

## Sampling Rate

- **After every task commit:** Run SQL smoke query for that city's politician count
- **After every plan wave:** Section-split check for all seeded cities
- **Before `/gsd:verify-work`:** Full suite SQL checks must return expected counts
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| Worcester gov seed | 01 | 1 | MA-TIER2-01 | — | N/A | smoke | `SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -258200011 AND -258200001` → expect 11 | ✅ DO block | ⬜ pending |
| Springfield gov seed | 02 | 1 | MA-TIER2-02 | — | N/A | smoke | `SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -256700015 AND -256700001` | ✅ DO block | ⬜ pending |
| Lowell gov seed | 03 | 1 | MA-TIER2-02 | — | N/A | smoke | `SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -253700013 AND -253700001` | ✅ DO block | ⬜ pending |
| Brockton gov seed | 04 | 1 | MA-TIER2-02 | — | N/A | smoke | `SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -250900013 AND -250900001` | ✅ DO block | ⬜ pending |
| Quincy gov seed | 05 | 1 | MA-TIER2-02 | — | N/A | smoke | `SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -255574511 AND -255574501` | ✅ DO block | ⬜ pending |
| Section-split check | all | post | MA-TIER2-01, MA-TIER2-02 | — | N/A | integration | Section-split count query (expect 0 rows) | ✅ DO block | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Post-verification DO blocks in each city migration (gates: 1 government, 1 chamber, correct district count, correct politician count, 0 NULL office_id)
- [x] Section-split count check after all 5 cities seeded (expect 0 rows = clean)

*Wave 0 verification infrastructure IS the inline SQL DO blocks. Each migration's Step 7 DO block fires `RAISE EXCEPTION` on any count mismatch at apply time — this is the canonical project test pattern (no separate pre-written test files; the gates ship inside the migration that creates the data).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Worcester LOCAL section in UI | MA-TIER2-01 | Requires live UI + geocoded address | Enter Worcester address, verify LOCAL section shows Mayor Petty + 11 councillors |
| Springfield LOCAL section in UI | MA-TIER2-02 | Requires live UI + geocoded address | Enter Springfield address, verify LOCAL section shows Mayor Sarno + councillors |
| Lowell LOCAL section — council-manager model | MA-TIER2-02 | Requires live UI + geocoded address | Enter Lowell address, verify LOCAL section shows Mayor Gitschier + council (no exec separately) |
| Brockton LOCAL section in UI | MA-TIER2-02 | Requires live UI + geocoded address | Enter Brockton address, verify LOCAL section shows Mayor Rodrigues + councillors |
| Quincy LOCAL section in UI | MA-TIER2-02 | Requires live UI + geocoded address | Enter Quincy address, verify LOCAL section shows Mayor Koch + councillors |
| Headshots visible in UI | MA-TIER2-02 | Visual check | Verify uploaded headshots render correctly at 600×750 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
