# Phase 204: Compass Lens Switcher (Results Grid) — Specification

**Created:** 2026-07-13
**Ambiguity score:** 0.161 (gate: ≤ 0.20)
**Requirements:** 11 locked

## Goal

Replace the results-grid's binary on/off "Lens" toggle with a single **global, data-driven lens switcher** — a row of lens chips (Custom + every lens from `GET /compass/lenses`) each showing a calibration state — that sets the comparison topic-set for every card at once, defaulting to a per-politician **Custom (overlap)** lens when none is explicitly chosen.

## Background

Today essentials applies compass lenses **silently per office**: `CompassContext.getEffectiveLensKey(districtScope)` returns `'local' | 'federal' | null`, so a local card auto-uses the Local lens, a U.S. House/Senate card auto-uses the Federal lens, and everything else uses the user's full compass. The only user control is a **binary "Lens" on/off toggle** in `src/components/CompassControlsBar.jsx` (backed by session-only `lensOverride`). There is no way to explicitly choose Local vs Federal vs Judicial, no notion of a lens being "not yet calibrated," and Judicial is handled by a separate `JudicialCompassSection` rather than as a grid lens.

The lens data model already exists: `CompassContext.lenses` is hydrated from `GET /compass/lenses` (with `LOCAL/FEDERAL/JUDICIAL_LENS_TOPICS` as offline fallbacks, each `{ key, color, topicIds, autoDistrictTypes }`), and `src/lib/compass.js#computeDisplaySpokes()` already selects "topics both answered, prefer the chosen set, cap 8." The sibling app `C:\EV-CompassV2` already ships a lens switcher + calibration flow (`CalibrationOverlay`, `doCalibrateLens`, `federalLensCalibrated`, `normalizeApiLens`, richer `lenses.js` shape with `name`/`description`) to mirror for parity.

This phase turns that latent data model into an explicit, extensible, calibration-aware switcher on the results grid — retiring the per-office auto-lensing in favor of one clear model: **explicit selection is global; Custom is the default.**

## Requirements

1. **Global lens switcher replaces the on/off toggle**: A multi-lens chip row lives in `CompassControlsBar`, only when the compass is on.
   - Current: `CompassControlsBar.jsx` renders a single binary "Lens" toggle (viewfinder icon) backed by `lensOverride`; Stance Min/Max + CompassKey sit beside it.
   - Target: The binary toggle is removed; a lens-chip row (Custom + each API lens) takes its place, keeping Stance Min/Max + CompassKey unchanged. The row renders only when `compassMode` is on (unchanged FilterBar logo toggle gates it).
   - Acceptance: With compass ON the grid shows the chip row and no binary on/off Lens toggle; with compass OFF neither renders.

2. **Data-driven, N-lens rendering**: The switcher is not hardcoded to a fixed lens count.
   - Current: Lens behavior is hardcoded to `'local'|'federal'|null` in `getEffectiveLensKey`; the switcher does not exist.
   - Target: The switcher renders one chip per lens in `CompassContext.lenses` (hydrated from `GET /compass/lenses`) plus a synthesized **Custom** chip; a future State/International lens appears purely by being returned from the API.
   - Acceptance: Adding a lens row to the `GET /compass/lenses` response (or mock) makes a new chip appear with **no code change**.

3. **Lens display metadata from the API**: Each chip shows a human name + accent color.
   - Current: essentials' fallback `lenses` carry only `key/color/topicIds/autoDistrictTypes` — no `name`/`description`.
   - Target: The switcher consumes `name`, `description`, and `color` per lens from the API response (mirroring CompassV2 `normalizeApiLens`), with sensible fallbacks (title-cased key + default color) when absent.
   - Acceptance: Each chip's visible label matches the API lens `name`; hover/title surfaces its `description`; the chip accent uses the lens `color`.

4. **Calibration state — "fill it" threshold**: Each lens chip renders ready or needs-calibration.
   - Current: No per-lens calibration state exists.
   - Target: A lens is **LIT (ready/selectable)** when the user has answered ≥ `min(8, lensTopicCount)` of that lens's topics; otherwise it renders **greyed with a purple rim** (needs-calibration).
   - Acceptance: A lens with 8 topics where the user answered 8 renders LIT; the same lens with ≤7 answered renders greyed + purple-rimmed. A lens with 6 topics needs 6 answered to be LIT.

5. **Custom lens is always ready**: The default overlap lens is never purple.
   - Current: No Custom lens concept in essentials.
   - Target: A synthesized **Custom** chip renders LIT whenever the user has a compass (≥3 answers, the same bar that gates the compass overlay); it is the default selection.
   - Acceptance: For any user who can see the compass overlay, the Custom chip is LIT and never shows a purple rim.

6. **Purple-rim calibration affordance (hover + click)**: Needs-calibration lenses invite calibration.
   - Current: No affordance exists.
   - Target: Hovering a purple-rimmed chip surfaces a "calibrate this lens?" prompt; clicking it starts calibration for that lens (see Req 7).
   - Acceptance: Hovering a purple chip shows the calibrate prompt; a LIT chip does not.

7. **Calibration handoff to the Compass app**: Clicking a purple chip routes out and returns.
   - Current: essentials does not host the quiz; the CompassCard "Take the Quiz" CTA already links to `COMPASS_URL` with a `return` param.
   - Target: Clicking a purple-rimmed lens navigates to `compass.empowered.vote` scoped to that lens (its unanswered topics), carrying a return URL back to the exact current results view; on return the lens reflects its new calibration state.
   - Acceptance: Clicking a purple chip navigates to a `COMPASS_URL` URL that identifies the lens and includes a `return` back to the current `/results` URL; after answering there and returning, that lens renders LIT.

8. **Explicit selection is global; per-office auto-lensing retired**: One clear model.
   - Current: `getEffectiveLensKey` silently changes spokes per office (federal cards auto-use Federal, etc.).
   - Target: Clicking a LIT lens applies its topic set to **every** card's compass; with **no** lens explicitly selected the default is **Custom** for every card. The silent per-office auto-lensing no longer changes spokes.
   - Acceptance: With no lens selected, a federal-office card's spokes come from the Custom overlap (not the Federal lens). Clicking Federal switches every card to the Federal topic set.

9. **Custom (overlap) algorithm**: Precise, deterministic spoke selection.
   - Current: The lens-off path uses only `selectedTopics ∩ both-answered`, capped at 8 (no fill from other overlaps).
   - Target: For each card, candidate = topics **both** the user and that politician answered, within scope. If ≤8 candidates, show all. If >8: take the user's saved-compass topics (that are both-answered) first, then fill remaining slots up to 8 with other both-answered topics ordered by **largest stance difference** (biggest disagreement), ties broken by topic display order.
   - Acceptance: On a fixture where the user+politician share >8 topics, the resulting ≤8 spokes are the user's compass topics first, then the widest-gap remaining topics, with topic-display-order tie-breaks — verified by unit test.

10. **Cross-lens "not enough" fallback**: Non-matching cards are honest, not auto-switched.
    - Current: N/A (no explicit narrow lens selection today).
    - Target: When an explicitly-selected lens yields <3 shared spokes for a card (e.g. Judicial lens on a Mayor card), that card shows the existing **"not enough shared topics"** state — it does **not** silently fall back to Custom.
    - Acceptance: With Judicial selected, a judge card renders Judicial spokes and a mayor card renders "not enough shared topics."

11. **Selected lens persists across visits**: The choice survives reload.
    - Current: `lensOverride` is deliberately session-only (resets on reload).
    - Target: The selected lens is persisted (e.g. `localStorage['ev:compassLens']`) for both guests and logged-in users; a reload/new visit restores the last-selected lens rather than resetting to Custom.
    - Acceptance: Select Federal, reload the page → Federal is still the active lens. Clear the key → the grid defaults to Custom.

## Boundaries

**In scope:**
- The global lens-switcher chip row on the results grid, inside `CompassControlsBar`, replacing the binary on/off "Lens" toggle.
- N-lens, data-driven rendering from `GET /compass/lenses` + a synthesized Custom lens.
- Per-lens calibration state (LIT vs greyed+purple-rim) using the `min(8, size)` "fill it" threshold.
- Purple-rim hover prompt + click → calibration handoff to `compass.empowered.vote` (lens-scoped, return URL).
- Global explicit selection applying to all cards; Custom as the default; retiring per-office auto-lensing.
- The Custom overlap algorithm (compass-first, then biggest disagreements, topic-order tie-break).
- Cross-lens "not enough shared topics" fallback for non-matching cards.
- Persisting the selected lens across visits (localStorage).

**Out of scope:**
- **Per-card lens controls** — explicitly rejected as overwhelming; the switcher is one global control.
- **Building the calibration quiz inside essentials** — reuse the Compass app via the existing return-URL handoff; no quiz duplication.
- **Stance Min/Max and CompassKey behavior** — unchanged; they stay beside the switcher.
- **The compass on/off logo toggle (FilterBar `compassMode`)** — unchanged; it still gates whether any compass/switcher shows.
- **Reworking the standalone `JudicialCompassSection`** — Judicial becomes a grid lens; the separate judicial profile section stays as-is this phase.
- **Authoring new lens content (State/International topic sets)** — those arrive later as data from `GET /compass/lenses`; this phase only guarantees the switcher renders whatever the API returns.
- **Backend changes to `GET /compass/lenses`** — assumed to already return `name`/`description`/`color`/`topicIds` per lens (see Constraints).

## Constraints

- **Data-driven, no hardcoded lens count** — the switcher reads `CompassContext.lenses` (API-hydrated) + synthesizes Custom; adding a lens must be a data change only.
- **API metadata dependency** — chip labels require `name` (and ideally `description`/`color`) per lens from `GET /compass/lenses`, mirroring CompassV2 `normalizeApiLens`. If the essentials endpoint does not yet return `name`/`description`, a backend/data addition is a prerequisite (⚠ assumption — see Ambiguity Report). Offline fallback derives a title-cased label from the lens `key`.
- **Calibration handoff reuses `COMPASS_URL` + `return`** — the same mechanism the CompassCard "Take the Quiz" CTA uses today; the lens-scoping query contract must be agreed with the Compass app.
- **Reuse `computeDisplaySpokes`** — extend it (or its caller) for the Custom biggest-disagreement fill (Req 9) and the `min(8, size)` calibration check (Req 4), rather than forking spoke logic.
- **Persistence tradeoff acknowledged** — persisting a narrow lens (Req 11) can, on a later visit, leave many cards in the "not enough shared topics" state (Req 10). This is an accepted, intentional tradeoff, not a bug.
- **Parity with EV-CompassV2** — lens shape, calibration semantics, and naming should stay consistent with `C:\EV-CompassV2\src\lib\lenses.js` and its calibration flow where practical.

## Acceptance Criteria

- [ ] With compass ON, the results grid shows the lens-chip row (Custom + each API lens) and the old binary on/off "Lens" toggle is gone; with compass OFF, neither renders.
- [ ] Adding a lens to the `GET /compass/lenses` response (or mock) makes a new chip appear with no code change.
- [ ] Each chip's label matches the API lens `name` and its accent uses the lens `color`.
- [ ] A lens with the user having answered ≥ `min(8, itsTopicCount)` topics renders LIT; below that it renders greyed with a purple rim.
- [ ] The Custom chip renders LIT (never purple) for any user who can see the compass overlay, and is the default when nothing is selected.
- [ ] Hovering a purple-rimmed chip shows a "calibrate this lens?" prompt; a LIT chip does not.
- [ ] Clicking a purple-rimmed chip navigates to a `COMPASS_URL` URL identifying the lens with a `return` back to the current `/results` view; after answering there and returning, that lens renders LIT.
- [ ] Clicking a LIT lens applies its topic set to every card; with no lens selected, every card uses the Custom overlap (a federal card uses Custom, not the Federal lens).
- [ ] For a card sharing >8 topics with the user, the Custom spokes = user's saved-compass topics first, then largest-stance-difference fill, ties by topic order (unit-tested on a fixture).
- [ ] With a narrow lens selected (e.g. Judicial), non-matching cards (<3 shared spokes) show the existing "not enough shared topics" state — no silent fallback to Custom.
- [ ] Selecting Federal then reloading the page keeps Federal active (persisted); clearing `ev:compassLens` defaults the grid to Custom.

## Ambiguity Report

| Dimension          | Score | Min   | Status | Notes                                                            |
|--------------------|-------|-------|--------|------------------------------------------------------------------|
| Goal Clarity       | 0.90  | 0.75  | ✓      | Model locked: global switcher, N lenses, Custom default          |
| Boundary Clarity   | 0.80  | 0.70  | ✓      | Explicit in/out; per-card + in-app quiz excluded                 |
| Constraint Clarity | 0.80  | 0.65  | ⚠      | Depends on `GET /compass/lenses` returning name/description/color |
| Acceptance Criteria| 0.82  | 0.70  | ✓      | 11 pass/fail criteria; Custom algorithm unit-testable            |
| **Ambiguity**      | 0.161 | ≤0.20 | ✓      |                                                                  |

Status: ✓ = met minimum. ⚠ note: the API metadata dependency (lens `name`/`description`/`color`) is an assumption the planner must confirm; if unmet, a small backend/data task precedes the UI work.

## Interview Log

| Round | Perspective     | Question summary                                   | Decision locked                                                        |
|-------|-----------------|----------------------------------------------------|-----------------------------------------------------------------------|
| 1     | Researcher      | Surface: per-card vs grid?                         | Single **global switcher on the results grid** (per-card rejected)     |
| 1     | Researcher      | Which lenses show, and when?                       | **All lenses always**, extensible N-lens (future State/International)  |
| 1     | Boundary Keeper | Roadmap placement                                  | **Standalone phase** (204)                                            |
| 1     | Simplifier      | Explicit vs per-office auto lensing                | **Explicit is global; Custom is default; retire per-office auto**      |
| 1     | Failure Analyst | Purple-rim interaction                             | Hover → "calibrate?" prompt; click → that lens's calibration           |
| 2     | Boundary Keeper | Calibration threshold                              | LIT when answered ≥ **min(8, lens size)** ("enough to fill it")        |
| 2     | Boundary Keeper | Calibration handoff location                       | **Hand off to compass.empowered.vote**, lens-scoped, return URL        |
| 2     | Failure Analyst | Cross-lens fallback for non-matching cards         | Show **"not enough shared topics"** (no auto-fallback)                 |
| 3     | Seed Closer     | Custom fill when >8 shared topics                  | **Compass topics first, then biggest disagreements**, ties by order    |
| 3     | Seed Closer     | Persistence of selection                           | **Persist across visits** (localStorage)                              |
| 3     | Seed Closer     | Switcher placement vs existing controls            | **Replace** the on/off Lens toggle in CompassControlsBar              |

---

*Phase: 204-compass-lens-switcher*
*Spec created: 2026-07-13*
*Next step: /gsd:discuss-phase 204 — implementation decisions (chip layout, calibration query contract, computeDisplaySpokes extension, persistence key)*
