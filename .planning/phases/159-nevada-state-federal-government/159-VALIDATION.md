---
phase: 159
slug: nevada-state-federal-government
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-22
---

# Phase 159 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This is a **DB-seeding / reconcile phase** — validation is SQL spot-check + live browse, not an automated unit-test suite.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual SQL verification (mcp__supabase-local__execute_sql) — no automated test suite for DB seeding |
| **Config file** | none |
| **Quick run command** | Direct `SELECT` via mcp__supabase-local__execute_sql |
| **Full suite command** | N/A — validation is SQL-based spot-check + live browse link |
| **Estimated runtime** | ~seconds per query |

---

## Sampling Rate

- **After every structural migration:** Run the relevant SQL audit query for the rows just written
- **After all migrations:** Run the section-split detection query (must return 0 rows)
- **Before phase completion:** All success-criteria SQL checks green + live browse smoke test
- **Max feedback latency:** seconds (interactive SQL)

> **Note:** gsd-executor has NO supabase MCP access. DB writes (migration apply) and DB-verify queries run INLINE in the orchestrator, not inside executor subagents. Executors write migration `.sql` files + headshot processing scripts to disk; the orchestrator applies and verifies.

---

## Per-Requirement Verification Map

| Requirement | Behavior | Test Type | Verification Method | Status |
|-------------|----------|-----------|---------------------|--------|
| NV-STATE-01 | 6 STATE_EXEC officials under State of Nevada with headshots (incl. new Controller) | SQL audit | `SELECT` politicians JOIN offices→chambers→governments WHERE geo_id='32' AND district_type='STATE_EXEC' → 6 rows, all with non-null politician_images.url | ⬜ pending |
| NV-STATE-01 | Controller Andy Matthews exists + renders | Browse check | `essentials.empowered.vote/results?...` statewide NV address shows Controller | ⬜ pending |
| NV-STATE-02 | 4 US House reps have 600×750 headshots | SQL audit | `SELECT` politician_images for the 4 House external_ids → 4 rows non-null url | ⬜ pending |
| NV-STATE-02 | House reps route correctly | Address smoke test | Las Vegas CD-1 address → Titus; sample address per CD-2/3/4 | ⬜ pending |
| NV-STATE-02 | 2 Senators render with headshots (pre-existing) | SQL check | politician_images for both senator ids → 2 rows | ✅ pre-satisfied (verify) |
| SC-4 | districts.state uppercase 'NV' for exec/federal tiers | SQL check | `SELECT district_type, state ... GROUP BY` → STATE_EXEC/NATIONAL_* all 'NV' | ✅ pre-satisfied (verify) |
| Cross-cutting | 0 split-section defects | SQL check | split-section detection query (feedback_section_split_check.md) → 0 rows | ⬜ pending |
| Cross-cutting | No duplicate officials created | SQL check | external_id audit — new rows only for genuinely-missing Controller; no dup politicians | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — this is a DB seeding phase with no test files to create. Existing SQL-audit verification covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Address→official resolution per tier | NV-STATE-01/02 | Requires live geocode + backend; no fixture harness | Enter a Nevada street address in the app; confirm Governor + execs + 2 senators + correct House rep all render |
| Headshot visual correctness | NV-STATE-01/02 | Wrong-person / cropping defects only catchable by eye | Open each official's profile; confirm photo is the right person, 4:5, no text/graphics overlay |
| Controller headshot license | NV-STATE-01 | License provenance is a judgment call | Confirm source license (Wikimedia/public-domain preferred) before upload; no fabricated photo |

---

## Validation Sign-Off

- [x] All requirements have SQL-audit verify or live-browse method
- [x] Sampling continuity: SQL audit after each migration
- [x] Wave 0 covers all MISSING references (none required)
- [x] No watch-mode flags
- [x] Feedback latency < seconds
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-22
