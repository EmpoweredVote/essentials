# Requirements: v25.0 Collin County TX Data-Completeness

> First milestone under gsd-core (v1.7.0). Data-only — closes verified gaps in the
> already-seeded Collin County, TX coverage (23-government browse list). All gaps below
> were confirmed against production DB on 2026-07-23. Restore point: tag `pre-gsd-core-2`.

## v25.0 Requirements

### Browse geo_id reconcile (COLLIN-BROWSE)

**Correction (2026-07-23, Phase 217 quick task 260723-lfc):** The premise below was
STALE. It was derived from an 82-day-old memory snapshot (`project_collin_county_browse`)
recording old phantom-code-style geo_ids that no longer exist anywhere in current `src`.
Verified against production on 2026-07-23: the geo_ids in `src/lib/coverage.js` were
**already correct** — all 24 Texas `coverage.js` entries (23 Collin governments +
Longview) resolve to a real `essentials.governments` row and return seated officials via
the live browse path. See the corrected mapping (including the specific phantom codes
that were retired) + live-verification evidence in
`.planning/quick/260723-lfc-phase-217-verify-document-confirm-all-23/260723-lfc-GEOID-MAPPING.md`.

- [x] **COLLIN-BROWSE-01**: User browsing Collin County sees officials for **Plano** (geo_id `4858016` resolves / renders 8 seated officials).
- [x] **COLLIN-BROWSE-02**: User browsing Collin County sees officials for **Richardson** (geo_id `4861796` resolves / renders 7 seated officials).
- [x] **COLLIN-BROWSE-03**: User browsing Collin County sees officials for **Prosper** (geo_id `4859696`), **Princeton** (geo_id `4859576`), and **Van Alstyne** (geo_id `4874924`) — all resolve / render seated officials.
- [x] **COLLIN-BROWSE-04**: The Collin County browse list (`COVERAGE_STATES` Texas block in `src/lib/coverage.js`) is reconciled against `essentials.governments` — all 24 entries resolve, with the corrected geo_id mapping documented in `260723-lfc-GEOID-MAPPING.md`.

### Elections & candidates (COLLIN-ELECT)

9 of the 18 resolving governments have **zero** races; others are thin (2–3 races vs 5–7 offices).

- [x] **COLLIN-ELECT-01**: The 9 zero-race governments (Blue Ridge, Farmersville, Josephine, Lavon, McKinney, Melissa, Nevada, Saint Paul, Weston) have their most-recent/next municipal races seeded with candidates where public records exist.
- [ ] **COLLIN-ELECT-02**: Cities with thin race coverage are reviewed and backfilled so seats with a known election have a corresponding race record.
- [ ] **COLLIN-ELECT-03**: Every seeded race links to the correct office and shows on the `/results` elections view (no split-section or zero-candidate shells), verified per [[section_split_check]] and [[elections_view_display_rules]].

### Contact data (COLLIN-CONTACT)

`web_form_url` is empty across all 18 resolving governments; email is missing for several.

- [x] **COLLIN-CONTACT-01**: `web_form_url` is populated for Collin County officials where the city publishes a contact form or official contact page.
- [x] **COLLIN-CONTACT-02**: Email addresses are filled for the cities currently at zero or near-zero (Anna, Farmersville, Frisco, Lavon, Murphy, Celina) where publicly listed.
- [ ] **COLLIN-CONTACT-03**: `valid_to` / term-end dates are populated for seated officials where the term is publicly known (data-quality follow-up from earlier phases).

### Vacancies / missing people (COLLIN-PEOPLE)

~9 offices have no seated politician (offices > people).

- [x] **COLLIN-PEOPLE-01**: Vacant offices in Blue Ridge (2), Nevada (3), Parker (2), Lowry Crossing (1), and Lucas (1) are researched; current incumbents are seated where the seat is filled in reality.
- [x] **COLLIN-PEOPLE-02**: Offices that are genuinely vacant (no current officeholder) are documented as such rather than left as ambiguous empty seats.

## Future Requirements (deferred)

- **Compass stances for Collin County** — deferred pending finalization of the proposed local compass questions (see [[local_compass_questions]] / Phase 18 in the old v3.0 track). No stance research until the question set is locked, per [[stance_research_all_topics]].
- **Headshots for 0-photo cities** — Blue Ridge, Farmersville, Lowry Crossing, Nevada, Saint Paul currently have 0 headshots; memory records no online source. Needs manual operator sourcing (drop into the crop pipeline), not automatable this milestone.

## Out of Scope

- **Banners** — the ~135-city banner audit (incl. all 24 TX cities) shipped 2026-07-06 (`fa88356`); nothing to do.
- **New city seeding outside the existing 23-government Collin list** — this milestone completes existing coverage, it does not expand geography.
- **New UI surfaces** — data-only; no frontend feature work beyond the browse geo_id reconcile wiring.

## Traceability

<!-- Filled by roadmap: REQ-ID → Phase. -->

All 12 v25.0 requirements mapped 1:1 to exactly one phase — no orphans, no duplicates.

| Requirement | Phase | Status |
|-------------|-------|--------|
| COLLIN-BROWSE-01 | Phase 217 | Met |
| COLLIN-BROWSE-02 | Phase 217 | Met |
| COLLIN-BROWSE-03 | Phase 217 | Met |
| COLLIN-BROWSE-04 | Phase 217 | Met |
| COLLIN-PEOPLE-01 | Phase 218 | Complete |
| COLLIN-PEOPLE-02 | Phase 218 | Complete |
| COLLIN-ELECT-01 | Phase 219 | Complete |
| COLLIN-ELECT-02 | Phase 219 | Pending |
| COLLIN-ELECT-03 | Phase 219 | Pending |
| COLLIN-CONTACT-01 | Phase 220 | Complete |
| COLLIN-CONTACT-02 | Phase 220 | Complete |
| COLLIN-CONTACT-03 | Phase 220 | Pending |
