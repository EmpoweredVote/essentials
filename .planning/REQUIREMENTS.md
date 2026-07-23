# Requirements: v25.0 Collin County TX Data-Completeness

> First milestone under gsd-core (v1.7.0). Data-only — closes verified gaps in the
> already-seeded Collin County, TX coverage (23-government browse list). All gaps below
> were confirmed against production DB on 2026-07-23. Restore point: tag `pre-gsd-core-2`.

## v25.0 Requirements

### Browse geo_id reconcile (COLLIN-BROWSE)

5 of the 23 hardcoded Collin browse geo_ids resolve to **no** `essentials.governments` row,
so the Collin County browse button silently returns nothing for them — including the two
largest cities. Root cause appears to be wrong FIPS place codes in the hardcoded list.

- [ ] **COLLIN-BROWSE-01**: User browsing Collin County sees officials for **Plano** (currently empty — hardcoded `4863000` resolves to nothing; correct place FIPS ≈ `4858016`).
- [ ] **COLLIN-BROWSE-02**: User browsing Collin County sees officials for **Richardson** (currently empty).
- [ ] **COLLIN-BROWSE-03**: User browsing Collin County sees officials for **Prosper**, **Princeton**, and **Van Alstyne** (currently empty).
- [ ] **COLLIN-BROWSE-04**: The Collin County browse list (`COVERAGE_AREAS` / hardcoded geo_ids) is reconciled against `essentials.governments` so all 23 governments resolve, with a documented mapping of any corrected geo_ids.

### Elections & candidates (COLLIN-ELECT)

9 of the 18 resolving governments have **zero** races; others are thin (2–3 races vs 5–7 offices).

- [ ] **COLLIN-ELECT-01**: The 9 zero-race governments (Blue Ridge, Farmersville, Josephine, Lavon, McKinney, Melissa, Nevada, Saint Paul, Weston) have their most-recent/next municipal races seeded with candidates where public records exist.
- [ ] **COLLIN-ELECT-02**: Cities with thin race coverage are reviewed and backfilled so seats with a known election have a corresponding race record.
- [ ] **COLLIN-ELECT-03**: Every seeded race links to the correct office and shows on the `/results` elections view (no split-section or zero-candidate shells), verified per [[section_split_check]] and [[elections_view_display_rules]].

### Contact data (COLLIN-CONTACT)

`web_form_url` is empty across all 18 resolving governments; email is missing for several.

- [ ] **COLLIN-CONTACT-01**: `web_form_url` is populated for Collin County officials where the city publishes a contact form or official contact page.
- [ ] **COLLIN-CONTACT-02**: Email addresses are filled for the cities currently at zero or near-zero (Anna, Farmersville, Frisco, Lavon, Murphy, Celina) where publicly listed.
- [ ] **COLLIN-CONTACT-03**: `valid_to` / term-end dates are populated for seated officials where the term is publicly known (data-quality follow-up from earlier phases).

### Vacancies / missing people (COLLIN-PEOPLE)

~9 offices have no seated politician (offices > people).

- [ ] **COLLIN-PEOPLE-01**: Vacant offices in Blue Ridge (2), Nevada (3), Parker (2), Lowry Crossing (1), and Lucas (1) are researched; current incumbents are seated where the seat is filled in reality.
- [ ] **COLLIN-PEOPLE-02**: Offices that are genuinely vacant (no current officeholder) are documented as such rather than left as ambiguous empty seats.

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
| COLLIN-BROWSE-01 | Phase 217 | Pending |
| COLLIN-BROWSE-02 | Phase 217 | Pending |
| COLLIN-BROWSE-03 | Phase 217 | Pending |
| COLLIN-BROWSE-04 | Phase 217 | Pending |
| COLLIN-PEOPLE-01 | Phase 218 | Pending |
| COLLIN-PEOPLE-02 | Phase 218 | Pending |
| COLLIN-ELECT-01 | Phase 219 | Pending |
| COLLIN-ELECT-02 | Phase 219 | Pending |
| COLLIN-ELECT-03 | Phase 219 | Pending |
| COLLIN-CONTACT-01 | Phase 220 | Pending |
| COLLIN-CONTACT-02 | Phase 220 | Pending |
| COLLIN-CONTACT-03 | Phase 220 | Pending |
