---
phase: 205
slug: u-s-senate-2026-candidate-wiring
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-15
---

# Phase 205 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This is a **data-only production migration** — there is no traditional unit-test framework.
> Validation = DB-parity SQL queries (read-only, against production) + a live in-state address
> smoke test on essentials.empowered.vote. Source: `205-RESEARCH.md` → `## Validation Architecture`.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Raw SQL parity queries via `mcp__supabase-local__execute_sql` / `psql` (read-only) + live browser smoke check |
| **Config file** | none — ad hoc verification queries documented in RESEARCH.md `## Validation Architecture` |
| **Quick run command** | Single-state resolution query (REQ-2 join) — sub-second |
| **Full suite command** | The 5-query verification block (REQ-2, REQ-4, REQ-5 diff) run in sequence, immediately after the `UPDATE` in the same session |
| **Estimated runtime** | ~5 seconds (SQL) + manual live address checks |

---

## Sampling Rate

- **After the migration `UPDATE`:** run the full 5-query verification block once, in the same session.
- **Phase gate (before `/gsd:verify-work`):** all parity queries green + ≥3 live in-state address checks (MN, TX, TN, plus OH as the special-election case) confirmed on essentials.empowered.vote.
- **Max feedback latency:** seconds for SQL; minutes for live checks.

---

## Per-Task Verification Map

| Req | Behavior | Verification Type | Automated Command / Query | Expected Result |
|-----|----------|-------------------|---------------------------|-----------------|
| REQ-1 | 2026 seat map produced & reviewable | manual review (blocking checkpoint) | Present the 35-row state→office_id map at the D-04 human checkpoint | Human approval before any `UPDATE` |
| REQ-2 | Race→seat-office linkage correct | DB parity query | `SELECT r.position_name, o.title, d.district_type, d.state FROM essentials.races r JOIN essentials.offices o ON r.office_id=o.id JOIN essentials.districts d ON o.district_id=d.id WHERE r.position_name ILIKE 'U.S. Senate %'` | Every mapped row: `district_type='NATIONAL_UPPER'`, `o.title NOT ILIKE 'Candidate for U.S. Senate%'`, `d.state` matches race's state |
| REQ-3 | Candidates surface by address | live smoke test | Enter in-state address on essentials.empowered.vote for MN, TX, TN, OH | Response includes the Senate race + its `race_candidates`, alongside the House race (parity) |
| REQ-4 | Confident-only / skip report | DB query + written report | `SELECT position_name FROM essentials.races WHERE position_name ILIKE 'U.S. Senate %' AND office_id IS NULL` (post-migration) | Empty result (research found 0 skips); any remaining row documented with a reason in the skip report |
| REQ-5 | No collateral changes | before/after diff | Compare baseline counts pre/post migration | `races` total unchanged; `race_candidates` unchanged; `NATIONAL_UPPER` office/incumbent counts unchanged; only the targeted `U.S. Senate %` rows' `office_id` differ |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*None — this phase requires no new test infrastructure; all verification is direct read-only SQL against production plus a manual live-site check. Existing infrastructure (Supabase/psql + deployed site) covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Seat-map approval | REQ-1 | Blocking human checkpoint (D-04) — a wrong seat is invisible to SQL but wrong for voters | Present the full 35-row state→seat(→incumbent) table, specials flagged, before any `UPDATE` runs; wait for explicit approval |
| Candidates surface by address | REQ-3 | Confirms the real user-facing surfacing path end-to-end | Enter a real in-state address for MN, TX, TN, OH on essentials.empowered.vote; confirm the Senate race + candidates appear with House parity in the same response |

---

## Validation Sign-Off

- [ ] Every requirement (1–5) has a parity query, before/after diff, or defined manual check
- [ ] Sampling continuity: full verification block runs in the same session as the `UPDATE`
- [ ] Wave 0 covers all MISSING references (none required)
- [ ] Live address sample ≥3 states incl. the OH special
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
