# Requirements: Essentials — Elections Page

**Defined:** 2026-04-12
**Core Value:** A resident can look up who represents them — and who is on their ballot — without creating an account.

## v1 Requirements (Milestone v2.0)

### Elections Page — Core

- [x] **ELEC-01**: User can navigate to a dedicated Elections page at `/elections`
- [x] **ELEC-02**: Connected user with stored location lands on Elections page and sees their local election results immediately — no address input required
- [x] **ELEC-03**: Inform user (no account) sees an address input and can search for elections by address
- [x] **ELEC-04**: Connected user without jurisdiction sees an address input (same as Inform for location)
- [x] **ELEC-05**: User can see county shortcut buttons (Monroe County, LA County) to quickly load elections for those areas without typing
- [x] **ELEC-06**: User can type a different address to explore elections outside their stored location
- [x] **ELEC-07**: Candidate order within each race is randomized per session (seeded shuffle — not alphabetical)

### Elections Page — Unopposed & Empty Races

- [x] **ELEC-08**: Race with exactly 1 candidate shows that candidate's card plus an "Running Unopposed" badge on the section header
- [x] **ELEC-09**: Race with 0 candidates shows a section notice ("No candidates have filed") instead of a candidate list
- [x] **ELEC-10**: No races are hidden — unopposed and empty races surface alongside contested races

### Backend

- [x] **ELEC-11**: Backend elections query uses LEFT JOIN on race_candidates so races with 0 candidates are returned (not silently dropped by current INNER JOIN)

### Navigation

- [x] **ELEC-12**: Landing page includes an Elections card/button alongside the county cards, linking to `/elections`
- [x] **ELEC-13**: Site header includes an Elections navigation entry linking to `/elections`

## Future Requirements

### Data Completeness

- **DATA-01**: All races for Monroe County, IN 2026 primary verified and filled
- **DATA-02**: All races for LA County, CA 2026 primary verified and filled
- **DATA-03**: Candidate headshots uploaded for all candidates where available

### Elections Page — Enhancements

- **ELEC-F01**: Filter elections by tier (Local / State / Federal)
- **ELEC-F02**: Share a specific election/race via deep link
- **ELEC-F03**: Election deadline/voter registration reminders

## Out of Scope

| Feature | Reason |
|---------|--------|
| Incumbency highlighting | Antipartisan mission — no pole position for incumbents |
| Alphabetical candidate ordering | Antipartisan — seeded random prevents name-order bias |
| Hiding empty/unopposed races | Wrong direction — surfacing these is informative civic content |
| Real-time results / live tallying | Out of scope for civic lookup product |
| Voter registration | Handled by external services |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ELEC-11 | Phase 1 | Complete ✓ |
| ELEC-01 | Phase 2 | Complete ✓ |
| ELEC-02 | Phase 2 | Complete ✓ |
| ELEC-03 | Phase 2 | Complete ✓ |
| ELEC-04 | Phase 2 | Complete ✓ |
| ELEC-05 | Phase 2 | Complete ✓ |
| ELEC-06 | Phase 2 | Complete ✓ |
| ELEC-07 | Phase 2 | Complete ✓ |
| ELEC-08 | Phase 3 | Complete ✓ |
| ELEC-09 | Phase 3 | Complete ✓ |
| ELEC-10 | Phase 3 | Complete ✓ |
| ELEC-12 | Phase 4 | Complete ✓ |
| ELEC-13 | Phase 4 | Complete ✓ |

**Coverage:**
- v1 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-12*
*Last updated: 2026-04-12 — traceability updated after roadmap creation*
