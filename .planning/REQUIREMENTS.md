# Requirements: Essentials — v4.0 Compass Experience

**Defined:** 2026-05-12
**Core Value:** A resident can look up who represents them — and who is on their ballot — without creating an account.

## v4.0 Requirements

Requirements for the Compass Experience milestone. Phases 33–36.

### Local Lens System

- [x] **LENS-01**: CompassContext exposes `localLensActive` boolean state and `toggleLocalLens()` function
- [x] **LENS-02**: `LOCAL_LENS_TOPICS` constant defines 8 topic UUIDs in order: Housing (669cac97), Homelessness (4938766b), Residential Zoning (d4f18138), Civil Rights (0bc588c6), Public Safety Approach (e9ebefcd), Local Immigration Enforcement (b9ccee94), Economic Development Incentives (eb3d1247), Transportation Priorities (ba59337e)
- [x] **LENS-03**: Activating Local Lens sets `selectedTopics` to `LOCAL_LENS_TOPICS` (preserves current `invertedSpokes` unchanged)
- [x] **LENS-04**: Deactivating Local Lens restores the exact `selectedTopics` and `invertedSpokes` that were in place before activation
- [x] **LENS-05**: `localLensActive` state and pre-lens snapshot persisted to localStorage; survive page navigation and tab switching

### Mini Compass on Candidate Tiles

- [ ] **MINI-01**: A mini `RadarChartCore` renders without spoke labels in the right-side space of each candidate tile when compass mode is active
- [ ] **MINI-02**: Mini compass is sized to fill the maximum available space within the candidate tile without overflow
- [ ] **MINI-03**: Mini compass requires a minimum of 3 overlapping bilateral spokes; tile renders without compass (silently) when threshold not met
- [ ] **MINI-04**: Spoke fallback algorithm: any preferred spoke where either party lacks an answer is replaced from the scoped pool of topics where both have answered; same algorithm as `CompassCard.jsx`
- [ ] **MINI-05**: Green magnifying-glass icon in top-right of each mini compass; glows green when Local Lens is active, dims when inactive
- [ ] **MINI-06**: Clicking the Local Lens icon on any candidate tile toggles the global `localLensActive` state, updating all visible compasses simultaneously

### Hover Modal

- [ ] **MODAL-01**: Hovering a mini compass opens a `FloatingPortal` containing a full `RadarChartCore` with spoke title labels visible
- [ ] **MODAL-02**: Modal compass includes legend (user color + candidate color), Local Lens icon, Min/Max buttons
- [ ] **MODAL-03**: Modal dismisses on mouse-leave (no click required)

### Global Controls Bar

- [x] **CTRL-01**: A global compass controls bar renders above the elections/reps list when compass mode is active; contains Min/Max buttons that operate on `CompassContext.invertedSpokes` and affect all mini compasses simultaneously
- [x] **CTRL-02**: Global controls bar includes a Local Lens toggle button that mirrors `localLensActive` state

### Compass-Default Experience

- [x] **DEFAULT-01**: Calibrated users (those with ≥3 answers in `CompassContext.userAnswers`) see compass tiles by default on the `/elections` page — no checkbox interaction required
- [x] **DEFAULT-02**: Same compass-default behavior on the Results page Elections tab
- [x] **DEFAULT-03**: Same compass-default behavior on the Results page Representatives tab
- [x] **DEFAULT-04**: Uncalibrated users (0 answers) see the existing `PoliticianCard` (horizontal) view unchanged — no regression
- [x] **DEFAULT-05**: `/elections` page and Results Elections tab are kept in feature parity for all compass-related changes throughout this milestone

## Future Requirements

### Judicial Lens

- **JLENS-01**: A second "Judicial Lens" preset covering the 8 judicial compass topics (parallel to Local Lens)
- **JLENS-02**: Lens selector UI allows users to cycle through unlocked lenses (Local → Judicial → off)

### Lens Management

- **LMGMT-01**: Admin interface to update which topics are in the Local Lens preset without a code deploy
- **LMGMT-02**: User-created custom lens presets saved to their account

## Out of Scope

| Feature | Reason |
|---------|--------|
| Judicial Lens implementation | Deferred — Local Lens ships first; Judicial follows same pattern once Local is proven |
| Mobile touch interactions for hover modal | Mouse-over pattern only for v4.0; tap behavior deferred |
| Compass animation / transitions | Polish concern — functional correctness first |
| Saving lens configurations to user account | Not needed for v4.0; localStorage is sufficient |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LENS-01 | Phase 33 | Complete |
| LENS-02 | Phase 33 | Complete |
| LENS-03 | Phase 33 | Complete |
| LENS-04 | Phase 33 | Complete |
| LENS-05 | Phase 33 | Complete |
| MINI-01 | Phase 34 | Pending |
| MINI-02 | Phase 34 | Pending |
| MINI-03 | Phase 34 | Pending |
| MINI-04 | Phase 34 | Pending |
| MINI-05 | Phase 34 | Pending |
| MINI-06 | Phase 34 | Pending |
| MODAL-01 | Phase 35 | Pending |
| MODAL-02 | Phase 35 | Pending |
| MODAL-03 | Phase 35 | Pending |
| CTRL-01 | Phase 36 | Complete |
| CTRL-02 | Phase 36 | Complete |
| DEFAULT-01 | Phase 36 | Complete |
| DEFAULT-02 | Phase 36 | Complete |
| DEFAULT-03 | Phase 36 | Complete |
| DEFAULT-04 | Phase 36 | Complete |
| DEFAULT-05 | Phase 36 | Complete |

**Coverage:**
- v4.0 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-12*
*Last updated: 2026-05-12 after initial definition*
