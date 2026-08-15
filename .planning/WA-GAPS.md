# Washington / Seattle — Gaps

Recorded so the boundary of this milestone is visible rather than silent.
Silent omissions look identical to completed coverage.

Milestone: Seattle deep seed (spec `docs/superpowers/specs/2026-08-13-seattle-wa-deep-seed-design.md`,
plan `docs/superpowers/plans/2026-08-13-seattle-wa-deep-seed.md`).
Scope seeded: Seattle city (11 officials) + standalone King County (14) + the full WA
legislature (49 Senate + 98 House = 147) + 5 statewide executives.
All figures below were re-verified against the production DB and the live browse API on 2026-08-15.

## Deliberately out of scope

| Gap | Status |
|---|---|
| 147 legislators have 0 stance rows | Deferred by decision; own milestone. New corpus (leg.wa.gov roll calls), NOT the Legistar tooling Task 10 used |
| WA Supreme Court (9 justices) | Not attempted. 4 seats were on the 2026 primary ballot |
| King County Superior Court (~53) + Seattle Municipal Court (7) | Not attempted. Both appear in the 2026 filings |
| Seattle Public Schools board (7 directors) | Not attempted; school boards are search-only with compass deferred by policy |
| **Port of Seattle Commission (5 elected positions)** | Not attempted. Surfaced during King County work — a real elected body for Seattle voters |
| **King Conservation District board** | Not attempted. Same source |

## Roster gaps

- ✅ **CLOSED 2026-08-15 — all 9 statewide elected executives are now seeded** (migrations 1760 +
  1761). The gap was real: only 5 were present, so any WA address returned 5 statewide officials
  instead of 9. Added: **State Auditor** Pat McCarthy, **Commissioner of Public Lands** Dave
  Upthegrove, **Insurance Commissioner** Patty Kuderer, **Superintendent of Public Instruction**
  Chris Reykdal. Verified live — `?browse_state_officials=WA` returns 9, and a Seattle address
  returns all 9 plus its 3 legislators.
  - None of the four is on the 2026 ballot. Washington elects statewide executives to four-year
    terms in presidential years; all four were last elected 2024-11-05 and next stand in 2028.
    No race rows were created, which matches the WA 2026 election already in the DB.
  - **Reykdal's party is NULL and that is correct** — Superintendent of Public Instruction is
    nonpartisan. The certified 2024 results prove it: every other statewide race prints a party
    preference beside each name ("Prefers Democratic Party"), the SPI race prints none.

## Stance coverage (Task 10)

**11 evidence rows across 7 of the 25 Seattle + King County officials. The other 18 are blank,
and that is a researched finding, not unfinished work.** Migrations 1754 and 1759; full
dispositions in `backend/data/stance-research/2026-08-15-wa-task10-blank-recheck.md` and
`backend/data/stance-research/2026-08-15-wa-growth-second-instrument.md` (EV-Accounts repo).

| Where | Rows | Officials with rows |
|---|---|---|
| Seattle (11 officials) | 2 | 1 — Strauss (`local-environment` 3, `taxes` 1) |
| King County (14 officials) | 9 | 6 — Balducci, Dembowski, Perry, Zahilay, Barón, Mosqueda |

Why the 18 blanks are honest and not a backlog:

- The entire roll-call corpus was read — King County 12,631 agenda items (2018–2026), Seattle
  10,639 (2020–2026) — then re-swept at a 10% dissent threshold, which surfaced 260 divided King
  County items and 284 Seattle items. Both re-check rows came from that lower band.
- **10 of the 18 cannot be reached by the vote-first method at all**: 6 hold non-legislative
  offices (Executive, Sheriff, Assessor, Prosecuting Attorney, Elections Director, City Attorney)
  and 6 took office in January 2026 with almost no record.
- Seattle's divided votes cluster on tax mechanics, procedure, appointments, labour agreements and
  fees; the compass ladders describe substantive policy. That mismatch, not a thin search, is why
  Seattle seats only one official.
- A No vote against a proposal is direction, not a chair. Dunn and von Reichbauer voted No on most
  seatable instruments and stay blank on purpose.

⚠ **Known unread windows:** Seattle 2020 and earlier, and King County before 2018, are not indexed.
Only von Reichbauer (in office since 1994) and Dunn (2005) have service inside them.

## Headshots (Task 8)

**181 of 181 — no gaps.** Seattle 11/11, King County 14/14, Senate 49/49, House 98/98,
statewide executives 9/9 (DB-verified 2026-08-15, and all four new CDN URLs return HTTP 200).

A previous version of this file listed Steffanie Fain, John Wilson and Julie Wise as missing.
All three were imported on 2026-08-14 and the file was not updated. Corrected here.

Imperfect but imported, recorded so they are not mistaken for finished work:

- **Dave Upthegrove** (Commissioner of Public Lands) — the DNR portrait is only **312x312**,
  so the 4:5 window takes 250x312 and upscales 2.4x. Soft. Chosen over a sharp 900x1200
  Wikimedia studio portrait because that one dates from about 2015, during his King County
  Council service, and shows him with dark hair rather than grey. Current likeness beat
  sharpness. ⚠ Its source file is named `em_cpl_block_312x312.png` with alt text "Commissioner
  Upthegrove" — it reads like a CMS badge graphic and is a real portrait; and it is an RGBA PNG
  whose transparent surround becomes **black wedges** under a naive RGB conversion. Composite on
  white before cropping.
- **Chris Reykdal** (Superintendent of Public Instruction) — the OSPI portrait is **400x350
  landscape**, so the crop upscales 2.1x. The only sharper option (Wikimedia, 1716x1965) is a
  mid-speech shot with a microphone in frame.

- **Katie Wilson** (Seattle Mayor) — no official photo exists; her Wikimedia source is a
  distant standing shot, so her face is small even after cropping.
- The 9 Seattle councilmembers use the official seattle.gov studio headshots, which are
  only **300x300** and upscale to 600x750. Correct framing was preferred over resolution
  after the Wikimedia alternatives turned out not to be portraits.
- **Julie Wise** (King County Director of Elections) — her source file carries no alt text.
  Identity rests on it being the only content image on King County Elections' own
  "Meet the Director" page; Ballotpedia has no photo of her to corroborate. Operator approved
  on that basis.

## Data gaps

- **`office_terms.how_started` is NULL for all 147 legislators.** Several members arrived by
  county-council appointment to fill a vacancy rather than by election, and that distinction
  was not verified per member.
- **27 of 147 legislators have year-only term starts**, stored as `YYYY-01-01` with
  `start_precision='year'`. The day and month are explicitly not claimed.
- **King County countywide officers have NULL emails** (Executive, Prosecuting Attorney,
  Assessor, Director of Elections, Sheriff). Their addresses are not published on the pages
  consulted, and pattern-inferred emails are never acceptable. The 9 councilmembers do have
  official emails from the county GIS layer.
- **Steffanie Fain's `office_terms.term_start` is 2026-01-01, but she was sworn in 2025-11-25**
  (Kent Reporter; King County Council) filling the District 5 vacancy left when Upthegrove
  became Commissioner of Public Lands. Found, not fixed — check before any occupancy claim.

## Election data

- The 2026 general is seeded from **candidate filings**, not from certified results: 140 races
  and 382 candidates, every candidate carrying `provisional_until = 2026-08-24`. The cull is
  gated on the **certified canvass**, not on the primary date.
- Race mix: 98 WA House + 24 WA Senate + 10 U.S. House + 7 King County + 1 Seattle (Council
  District 5). No statewide executive and no U.S. Senate seat is on the WA 2026 ballot.

## Not a gap — recorded so it is not "fixed" later by mistake

- **Party is NULL on all King County and Seattle officials.** Both are officially
  **nonpartisan** — King County under the 2008 charter amendment, Seattle city offices by
  charter. NULL is the correct value, not missing data.
- **The 147 legislators do not appear under `?browse_state_officials=WA`.** That endpoint
  returns statewide executives plus federal officials for every state (WA, OR and MD all
  return 41 rows in the same shape). Legislators are reached by **address**, through their
  G5210/G5220 district geofences — verified live: a downtown Seattle address returns exactly
  1 senator and 2 representatives (Positions 1 and 2).
- **`COVERAGE_COUNTIES` has no importers and is tree-shaken out of the production bundle**, so
  the King County entry in `src/lib/coverage.js` is source-only documentation with zero runtime
  effect. Do not "fix" its absence from the live bundle.
