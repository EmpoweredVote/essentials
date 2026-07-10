# Phase 155: Norwalk deep-seed - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-22
**Phase:** 155-norwalk-deep-seed
**Areas discussed:** Form of government, Dual-chamber merge, Roster currency, Headshots

---

## Live DB pre-check (orchestrator, 2026-06-22)

Search by NAME (not geo_id — pre-existing gov rows have geo_id=NULL, Lancaster lesson). Findings:
- Gov `15897159-e6bf-4d7e-9b45-44d62c4ebb8a` "City of Norwalk, California, US", geo_id NULL → 0652526, CA.
- Two duplicate 'City Council' chambers (slug `norwalk-city-council`): `97397b0f` (official_count NULL, 4 offices,
  one-directional) and `e7e787f7` (official_count 5, 1 office, bidirectional-clean).
- 5 offices / 5 distinct people (no dedup): Ayala (Mayor LOCAL_EXEC, -200876), Ramirez (-201327), Rios (-201328),
  Valencia (-201329) [all one-directional], Perez (666845) [bidirectional].
- Two At-Large districts (`5677c0ab` ×3, `f9e8037d` ×1) + Mayor LOCAL_EXEC district `4126e079`.
- All 5: 1 image, 0 stances. Title drift: 'Council Member' vs 'Councilmember'.
- 40+ campaign-finance committee rows (ext_id NULL, inactive) — ignored.
- Out of scope: `d4f9a7fa` Norwalk-La Mirada Unified SD. Next migration on-disk = 1034.

---

## Which areas to discuss (multiSelect)

| Option | Description | Selected |
|--------|-------------|----------|
| Form of government | Mayor type + at-large/by-district; defer to research | ✓ |
| Dual-chamber merge | Survivor choice + At-Large consolidation + link repair | ✓ |
| Roster currency | Verify the 5 against norwalkca.gov | ✓ |
| Headshots | Verify-and-fix the 5 + fill gaps; WAF unknown | ✓ |

**User's choice:** All four areas selected for discussion.

---

## Confirmation — lock all four to recommended positions

| Option | Description | Selected |
|--------|-------------|----------|
| All locked (Recommended) | Write CONTEXT.md exactly as the 4 recommended positions; proceed to plan-phase | ✓ |
| Adjust something | Change one or more positions before writing CONTEXT.md | |

**User's choice:** All locked.
**Notes:** Operator accepted the recommended defaults for all four areas, mirroring the Burbank 154 "all locked"
resolution. The single genuine judgment call (form-of-government default) was resolved as "defer to research, no
guessed default" — the safest position per the Downey lesson.

---

## Resolved positions (see CONTEXT.md for full detail)

- **D-01 Dual-chamber merge:** survive chamber A `97397b0f`; move Perez in; repair 4 one-directional back-pointers;
  consolidate At-Large to `5677c0ab` (drop `f9e8037d`); normalize titles → 'Councilmember'; STOP-on-drift pre-flight.
- **D-02 Form of government:** research-verify against norwalkca.gov, no guessed default. Hypothesis = general-law
  rotational mayor → convert Ayala's Mayor LOCAL_EXEC office to a 5th council seat with mayor-as-title (Downey/WC). If
  directly-elected confirmed → keep LOCAL_EXEC (El Monte/Inglewood/Lancaster). If by-district → relabel + split.
- **D-03 Roster currency:** research-verify all 5 (Nov-2024 turnover possible); unlink-not-delete departed; new
  members -7010xx; ignore committee rows.
- **D-04 Headshots:** verify-and-fix the 5 existing (wrong-person + no-graphics guard), re-crop 4:5→600×750, fill any
  gap honestly; norwalkca.gov WAF status unknown — check.

## Claude's Discretion

Exact reconcile SQL ordering, move-then-delete mechanics, At-Large consolidation mechanics, Mayor-office conversion
mechanics (if rotational), per-member stance chairs, which existing headshots pass vs need re-crop.

## Deferred Ideas

- Norwalk-La Mirada Unified School District (gov `d4f9a7fa`) — out of scope.
- Norwalk split-section check post-reconcile (expect 0 rows).
- Browse school-district-sliver display issue — separate browse-logic follow-up.
- Phase 156 (Bellflower) + Phase 157 (Wave-2 close-out) consume Norwalk's final counts.
