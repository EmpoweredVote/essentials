# Phase 149: Pasadena deep-seed — Discussion Log

**Date:** 2026-06-20

## Pre-analysis
- DB pre-check (per `project_v170_wave2_not_greenfield`): Pasadena gov `d25619a9` already exists — geo_id NULL,
  2 duplicate 'City Council' chambers, 8 offices. RECONCILE, not greenfield.
- Pasadena real form = 7 single-member districts + directly-elected Mayor; DB mislabels council as 'At-Large'.

## Areas selected for discussion
User selected all 4 offered gray areas: By-district conversion · Roster currency · Headshot sourcing/WAF · Duplicate cleanup.

## Decisions

### By-district conversion
- Options: relabel existing → D1–7 (recommended) / full rebuild / keep At-Large.
- **Chosen:** Relabel existing rows → District 1–7 + map members to real districts (Pomona/Palmdale pattern); keep directly-elected Mayor on LOCAL_EXEC. → D-02.

### Roster currency
- Options: current-seated retire departed (recommended) / keep as-is / flag-and-defer.
- **Chosen:** Current-seated, retire (unlink, keep records) departed, seat new; verify vs official site. → D-03.

### Headshot sourcing / WAF
- Options: direct-first operator-fallback (recommended) / operator-supplies-all / skip-if-blocked.
- **Chosen:** Direct curl first; operator in-browser + alternate hosts fallback if WAF-403. → D-04.

### Duplicate cleanup
- Options: handle in Wave-1 reconcile (recommended) / separate wave.
- **Chosen:** Fold into Wave-1 reconcile (merge 2 chambers, dedupe Lyon image, backfill Rivas). → D-05.

## Carried forward (not re-discussed; locked by phases 142–148)
4-wave structure; reconcile registers in ledger / headshots+stances audit-only; 600×750 crop-first headshots;
evidence-only chairs-model stances, 100% citation, honest blanks, no judicial, no defaults; structure-hard/
data-soft verdict; next migration number resolved from live ledger MAX at execution.

## Deferred
- 5-city split-section defect sweep (out of scope); phase 157 close-out consumes final counts.
