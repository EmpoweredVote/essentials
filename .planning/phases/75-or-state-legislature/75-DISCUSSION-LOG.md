# Phase 75: OR State Legislature - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-29
**Phase:** 75-or-state-legislature
**Areas discussed:** Headshot quality + fallback, Roster completeness check, External ID scheme for legislators

---

## Headshot Quality + Fallback

| Option | Description | Selected |
|--------|-------------|----------|
| Upscale if needed | Lanczos upscaling acceptable for government-style headshots — same decision as ME house. Executor proceeds without asking again. | ✓ |
| Find higher-res alternative first | Check Wikimedia Commons or official state press site before upscaling. Only upscale as last resort. | |
| Document as known gap + skip | If photo quality insufficient, record as known gap and skip. Prefer clean gap over blurry photo. | |

**User's choice:** Upscale if needed
**Notes:** Consistent with ME house precedent (152×202 → 600×750 Lanczos). Executor has standing approval.

---

### Missing Photos Sub-question

| Option | Description | Selected |
|--------|-------------|----------|
| Document as known gap, skip | Same pattern as Collin County and Cambridge — record in summary as unavailable, no placeholder inserted. | ✓ |
| Try Wikimedia Commons as fallback | Before skipping, check Wikimedia Commons for usable photo. | |
| Hold entire plan until all 90 found | Don't close headshots plan until every legislator has a photo. | |

**User's choice:** Document as known gap, skip
**Notes:** Standard gap-documentation pattern for this project.

---

## Roster Completeness Check

| Option | Description | Selected |
|--------|-------------|----------|
| Trust oregonlegislature.gov as source of truth | Seed every legislator currently listed. Vacancies won't appear — treat count as correct. | ✓ |
| Cross-check with OR SoS certified results | Pull 2024 election results to confirm each seat has a current holder before seeding. | |
| Flag any unexpected count deviations | If site shows fewer than 30 senators or 60 reps, treat as blocker before writing migrations. | |

**User's choice:** Trust oregonlegislature.gov as source of truth
**Notes:** Consistent with ME and CA approach. Unexpected counts (e.g., <30 senators) remain a blocker per D-09 in CONTEXT.md.

---

## External ID Scheme for Legislators

| Option | Description | Selected |
|--------|-------------|----------|
| Lock in -4110001–4110030 (senators) + -4120001–4120060 (house) | Consistent gap-respecting pattern: 411x = state senate, 412x = state house. Planner knows range upfront. | ✓ |
| Leave to researcher/planner | Don't lock the range — researcher confirms from DB and chooses next available block. | |

**User's choice:** Lock in ranges
**Notes:** Ranges chosen to avoid overlap with Phase 74 federal (-4100001–4102006) while following the CA positional prefix pattern (-6001xxx/-6002xxx).

---

## Claude's Discretion

- Headshots plan (75-03) covers all 90 legislators in one plan — no split senators/house needed (clean and analogous to prior headshots phases)
- Researcher to verify oregonlegislature.gov headshot URL pattern directly (not prescribed here)
- Section-split check runs after each of 75-01 and 75-02 (standard protocol)

## Deferred Ideas

- Oregon elections (2026 races for state legislators) — future phase analogous to Phase 69 for CA
- Compass stances for OR state legislators — future phase analogous to Phase 70 for CA
- Portland city deep seed (Phases 76–77) — separate phases after state legislature complete
