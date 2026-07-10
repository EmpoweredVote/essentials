# Phase 184: School Boards Wave 2 — Tigard-Tualatin SD 23J + Forest Grove SD 15 + Sherwood SD 88J - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-04
**Phase:** 184-school-boards-wave-2-tigard-tualatin-sd-23j-forest-grove-sd-
**Areas discussed:** Wave-1 template fixes, Migration granularity, Zone routing × 3, Headshot sourcing

---

## Session note (AFK handling)

The command was invoked as `/gsd-discuss-phase 14 --chain`. Phase 14 does not exist in the
roadmap; the phase-selection question (offering Phase 184 as the likely intent) timed out with
no response, as did the gray-area selection question. Per the Phase 181/182/183 precedent
(documented in each of those CONTEXT headers), all four gray areas were auto-selected and each
resolved with the **recommended option**. Phase resolution to 184 was grounded in: STATE.md
`stopped_at: Phase 183 complete — ready to discuss Phase 184`; 184 being the only pending
discussable phase; and standing memory authorizing same-shape deep-seed chaining while AFK.

---

## Wave-1 template fixes

| Option | Description | Selected |
|--------|-------------|----------|
| Apply all fixes (Recommended) | Bake 183-REVIEW WR-01 (live office NOT EXISTS guard via pol-union CTE), WR-02 (chamber_id IS NOT NULL post-verify), WR-03 (headshot INSERT…SELECT skips missing politician) + IN-01..04 nits into the 184 clones | ✓ (recommended, AFK) |
| Clone verbatim | Copy 1203/1205 shapes unchanged; fix templates later | |

**User's choice:** Recommended option (AFK) — apply all fixes.
**Notes:** 183-REVIEW.md explicitly frames the Warnings as "exactly the class that bites the
next same-shape district seed"; standing memory queued them for the Ph184 clones. Fix SQL is
written out in the review.

---

## Migration granularity

| Option | Description | Selected |
|--------|-------------|----------|
| One shared migration (Recommended) | All 3 boards in one structural migration (254 precedent = 6 boards; 1203 = 2 boards); single shared ~4-plan set | ✓ (recommended, AFK) |
| One migration per district | Three smaller files; more ledger rows, same content | |

**User's choice:** Recommended option (AFK) — carried from 183 D-P1; planner may still split if cleaner.

---

## Zone routing × 3

| Option | Description | Selected |
|--------|-------------|----------|
| Carry D-Z1/D-Z2 unchanged (Recommended) | WHO VOTES decides routing; verify each district's election method at plan time; whole-district fallback if zone-voted with no official GIS; never hand-trace | ✓ (recommended, AFK) |
| Assume at-large like Wave 1 | Skip per-district verification since both Wave-1 boards were at-large | |

**User's choice:** Recommended option (AFK) — Wave-1's at-large outcome is evidence, not proof, for Wave 2; verification stays mandatory per district.

---

## Headshot sourcing

| Option | Description | Selected |
|--------|-------------|----------|
| Carry D-R5 + finalsite lesson (Recommended) | Official district site first, fallback chain after; if finalsite-hosted, fetch UNTRANSFORMED originals (t_image_size_6 = upscale trap); crop-4:5-first → 600×750 Lanczos q90 | ✓ (recommended, AFK) |
| District site only | No fallback chain; document gaps immediately | |

**User's choice:** Recommended option (AFK).

---

## Claude's Discretion

- External_id blocks (geo-derived: -4112241.., -4105161.., -4111291..; Wave-0 probe verifies,
  IN-03 margins + IN-04 decade check applied)
- Next migration number (expected 1206; on-disk counter authoritative, Wave-0 re-confirms and
  checks filename collisions)
- Structural migration granularity (one file vs per-district)
- Government naming (follow 1203/1107/254 lineage; researcher confirms browse rendering)

## Deferred Ideas

- 2026 school-board election races + discovery (Phase 185)
- Milestone retrospective / GOTCHAs / coverage reconciliation (Phase 186)
- District banner art (future backlog; D-B1 ships plain)
- Ext-id scheme headroom redesign (geo_id × 100) — only if a >9-seat roster ever appears
- Superintendent/staff/student-rep representation — out of scope by design
