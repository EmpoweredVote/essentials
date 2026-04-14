# Request: CA Governor Challenger Candidates — 2026 Primary

**From:** Essentials Frontend Team
**To:** Accounts API Team
**Date:** 2026-04-13
**Priority:** High — CA Governor race currently shows no candidates (open seat, no incumbents)
**Source:** Calmatters, published 2026-03-06: https://calmatters.org/politics/2026/03/california-governor-candidates/

---

## Background

The 2026 CA Governor race is an open seat — Gavin Newsom is term-limited. We confirmed during Elections page QA that the race shows zero candidates because the challenger ingestion script isn't complete yet.

Below is the known candidate list from Calmatters as of March 6, 2026. Please add these as `race_candidates` entries linked to the CA Governor race in the 2026 LA County Primary election.

---

## Candidates to Seed

| Name | Party | Description |
|------|-------|-------------|
| Xavier Becerra | Democrat | Former U.S. Health and Human Services secretary and former California Attorney General |
| Chad Bianco | Republican | Riverside County Sheriff |
| Steve Hilton | Republican | Fox News contributor and former adviser to David Cameron |
| Matt Mahan | Democrat | Mayor of San Jose |
| Katie Porter | Democrat | Former U.S. Representative representing Orange County |
| Tom Steyer | Democrat | Billionaire entrepreneur and former presidential candidate |
| Eric Swalwell | Democrat | U.S. Representative from the Bay Area |
| Tony Thurmond | Democrat | State Superintendent of Public Instruction |
| Antonio Villaraigosa | Democrat | Former Mayor of Los Angeles and former Assembly Speaker |
| Betty Yee | Democrat | Former State Controller |

---

## Notes

- CA uses a top-2 jungle primary — `primary_party` should be `NULL` on the race record (already confirmed correct per your previous note)
- Headshots: don't have them for all candidates yet. Seed with `photo_url = NULL` for now — we'll run the headshot finder separately
- `politician_id` linkage: link where the candidate is already in `essentials.politicians` (Thurmond is already seeded as an incumbent in another race, Swalwell may already exist). Leave `politician_id = NULL` for new entrants with no existing politician record
- This list may not be exhaustive — the CA SoS filing deadline may add more names. Please treat as a starting seed, not a final list

---

## Acceptance Criteria

- `GET /essentials/elections-by-address?address=500+W+Temple+St%2C+Los+Angeles%2C+CA+90012` returns the CA Governor race with at least the 10 candidates above
- Candidate names and party affiliations match the table above
- `primary_party` on the CA Governor race remains `NULL`
