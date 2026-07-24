---
phase: 218
slug: vacancies-missing-people
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-23
---

# Phase 218 — Validation Strategy

> Per-phase validation contract. This is a DB-seeding data-completeness phase — per the
> established convention (every prior deep-seed: 193-198, 201-203, v3.0 Collin), validation
> is **inline SQL gates + live HTTP/browse spot-checks**, NOT a unit-test framework.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — inline `psql` SQL gates + live browse spot-check (established data-seed convention) |
| **Config file** | N/A |
| **Quick run command** | Inline `psql` SELECT gates (office-count + no-ambiguous-null-seat), run per migration |
| **Full suite command** | Inline `psql` gates + split-section check + live `curl`/browse spot-check |
| **Estimated runtime** | ~seconds per gate |

> ⚠ gsd-executor has NO Supabase MCP — DB-verify gates run inline within each plan's tasks (via the operator or an inline psql path), consistent with prior deep-seed phases.

---

## Sampling Rate

- **After every seeding migration commit:** run the office-count + no-ambiguous-null-seat SQL gates for the affected city.
- **After every wave:** full 21-office (+6 missing-seat) reconcile count against the RESEARCH.md target table.
- **Phase gate (before close):** split-section check clean + live browse spot-check of ≥3 of the 11 target cities showing newly-seated names.

---

## Per-Requirement Verification Map

| Req | Behavior | Type | Gate |
|-----|----------|------|------|
| COLLIN-PEOPLE-01 | Unseated offices seated with cited incumbent where filled | SQL gate | `offices WHERE government∈11-target AND politician_id IS NULL AND is_vacant IS NOT TRUE` → 0 rows after seeding |
| COLLIN-PEOPLE-02 | Genuine vacancies flagged, never ambiguous | SQL gate | `offices WHERE politician_id IS NULL AND is_vacant IS NOT TRUE` across ALL 23 govs → 0 rows at phase close |
| D-02 missing-seat | No body has fewer office rows than real seats (Blue Ridge +1, Lowry Crossing +4, Weston +1 confirmed) | SQL + manual | `chambers.official_count` vs `COUNT(offices)` per gov; cross-check live roster |
| Split-section | No accidental government/chamber duplication from seeding | SQL gate | project standard split-section query after every migration ([[section_split_check]]) |
| Headshots (D-03) | Newly-seated officials have 600×750 headshot where a source exists; honest blank where none | SQL + visual | `politician_images` present for seated people w/ source; blank documented for Blue Ridge/Lowry Crossing/Nevada |

---

## Wave 0 Requirements

*None — no test-framework scaffolding needed. SQL gates above are the entire verification surface, consistent with every prior Collin/AZ/NV/CA deep-seed phase.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Newly-seated names render on browse | COLLIN-PEOPLE-01 | No headless browse test harness | Live `GET /results?browse_government_list=<geo_id>&browse_state=TX` for ≥3 target cities; confirm seated names appear |
| Headshot visual QA | D-03 | Image quality/crop is visual | Spot-check ≥3 newly-sourced headshots for 4:5 crop, eyes ~1/3, no graphics |
| 3 flagged re-verify seats | COLLIN-PEOPLE-01 | Needs 2nd independent source | Fairview Seat 4, Van Alstyne Place 6, Nevada Mayor/Place1/Place2 — confirm before locking |

---

## Validation Sign-Off

- [x] Every unseated target office either seated (cited) or `is_vacant=true` (documented) — including the undiscovered Plano Council Member Place 6, found by Plan 05's full-23-gov sweep and documented via migration 1392
- [x] `politician_id IS NULL AND is_vacant IS NOT TRUE` returns 0 rows across all 23 govs
- [x] 6 missing-seat office rows added (Blue Ridge +1, Lowry Crossing +4, Weston +1)
- [x] Split-section check clean after every migration
- [x] Live browse spot-check green for ≥3 target cities — human-approved for Parker, Princeton, Van Alstyne, Lowry Crossing, and Plano
- [x] `nyquist_compliant: true` set once gates pass

**Approval:** approved
