# Phase 157: Wave 2 close-out - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-19
**Phase:** 157-wave-2-close-out
**Areas discussed:** Purple-chip criteria, Audit pass bar, Split-section cleanup, Audit doc format

---

## Purple-chip criteria

| Option | Description | Selected |
|--------|-------------|----------|
| ≥1 stance = purple | List all 15 as browsable; hasContext:true only for cities with ≥1 seeded stance. Roster-only/0-stance city listed but plain. Honest, matches convention. | ✓ |
| Roster = purple | Any city with a seeded roster gets the chip even with 0 stances. Simpler but overpromises context. | |
| Threshold (e.g. ≥5) | Only chip cities above a minimum stance count. Stronger bar but risks hiding legitimately thin small cities. | |

**User's choice:** ≥1 stance = purple
**Notes:** Keeps the purple chip's "has compass context" promise honest; per-city stance count read from live DB at audit time, not assumed.

---

## Audit pass bar

| Option | Description | Selected |
|--------|-------------|----------|
| Structure hard / data soft | Hard: gov + chamber + correct roster for all 15. Headshot gaps + thin/blank stances = documented acceptable gaps. Missing structure/roster = blocker. | ✓ |
| Full Tier 1 required | Every city must have gov + chamber + roster + headshots + stances before close. Unrealistic given 403 walls + honest-blank policy. | |
| Roster-only | Only require gov + chamber + roster; don't verify headshots/stances. Weak — wouldn't surface coverage gaps. | |

**User's choice:** Structure hard / data soft
**Notes:** Matches prior-wave reality (100% headshot gaps acceptable; honest-blank stances acceptable). Acceptable gaps documented, not treated as failures.

---

## Split-section cleanup

| Option | Description | Selected |
|--------|-------------|----------|
| Defer + document | Keep out of scope. Record in audit known-issues + as deferred idea. No data changes in 157. | ✓ |
| Fold cleanup in | Fix all 5 cities' defects in close-out. Cleaner but scope creep. | |
| Create phase now | Add an explicit new ROADMAP.md phase for the cleanup. More formal than a deferred note. | |

**User's choice:** Defer + document
**Notes:** Defects are pre-existing (v7.0/v15.0), already flagged OUT-OF-SCOPE in Phase 143. Candidate for its own future cleanup phase.

---

## Audit doc format

| Option | Description | Selected |
|--------|-------------|----------|
| Root file + per-city table | .planning/v17.0-MILESTONE-AUDIT.md (matches recent v16/v11/v10) with per-city DB-verified table + verdicts; then MILESTONES.md entry + STATE/PROJECT flip. | ✓ |
| milestones/ subdir | Same content in .planning/milestones/ (older convention). Diverges from 3 most recent milestones. | |
| MILESTONES.md only | Put the table directly in MILESTONES.md; no standalone file. Buries DB-verified detail, breaks pattern. | |

**User's choice:** Root file + per-city table
**Notes:** Follows the location of the 3 most recent milestone audits (v16.0/v11.0/v10.0).

---

---

# Update — 2026-06-22 (post-wave revision)

**Trigger:** All 15 city phases (142–156) now complete; context re-opened to reflect actual wave outcomes. Sequencing-dependency block lifted.

**Areas revised:** Shared UI fix deployment · Roster audit baseline · Per-city audit gotchas

## Shared UI fix deployment (new D-08)

| Option | Description | Selected |
|--------|-------------|----------|
| Verify committed + flag deploy | Audit records wave-era shared UI fixes (e.g. groupHierarchy.js Mayor>MPT) are committed to main + notes pending deploy. Not a blocker, not a deploy action. | ✓ |
| Include deploy in close-out | Actively trigger/confirm production deploy. Expands scope into deployment. | |
| Out of scope | Touch only Landing.jsx; ignore shared UI fixes entirely. | |

**Notes:** Keeps "surfaced cities render correctly" honest without making 157 a deploy phase. `src/lib/groupHierarchy.js` is the concrete file.

## Roster audit baseline (new D-03a)

| Option | Description | Selected |
|--------|-------------|----------|
| Current officeholders; uncertain = gap | HARD roster check verifies current post-June-2026 occupants; election-uncertain seats logged as documented gaps not blockers. | ✓ |
| Strict — uncertain seats block close | Any unverifiable post-election seat blocks close. Risks stalling on free-source-unverifiable data. | |
| Keep generic count check | Roster-vs-official_count only; no currency requirement. | |

**Notes:** Many cities reseated for June 2026 turnover; matches structure-hard/data-soft.

## Per-city audit gotchas (new D-04a + D-07 enhancement)

| Option | Description | Selected |
|--------|-------------|----------|
| Both audit checks + GOTCHA rows | Bake patterns into D-04 queries (geo_id join, merge-survivor verify, wrong-person headshot spot-check, split-section query) AND D-07 GOTCHA rows. | ✓ |
| GOTCHAs only | Onboarding rows only; audit stays count-based. | |
| Claude's discretion | Don't enumerate; trust audit agent. | |

**Notes:** `districts.government_id` is NULL — join via geo_id. Run split-section detection per city.

---

## Claude's Discretion

- Exact wording of GOTCHA entries and "Notable patterns" cells in LOCATION-ONBOARDING.md — synthesized from per-city artifacts.
- Audit table column layout beyond the required DB-verified dimensions.

## Deferred Ideas

- Split-section defect cleanup across 5 cities (Whittier/Compton/Carson/South El Monte/South Pasadena) — deferred to a future dedicated cleanup phase; documented in the v17.0 audit known-issues section.
