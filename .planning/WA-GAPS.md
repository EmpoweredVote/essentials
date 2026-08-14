# Washington / Seattle — Gaps

Recorded so the boundary of this milestone is visible rather than silent.
Silent omissions look identical to completed coverage.

Milestone: Seattle deep seed (spec `docs/superpowers/specs/2026-08-13-seattle-wa-deep-seed-design.md`,
plan `docs/superpowers/plans/2026-08-13-seattle-wa-deep-seed.md`).

## Deliberately out of scope

| Gap | Status |
|---|---|
| 147 legislators have 0 stance rows | Deferred by decision; own milestone |
| WA Supreme Court (9 justices) | Not attempted. 4 seats were on the 2026 primary ballot |
| King County Superior Court (~53) + Seattle Municipal Court (7) | Not attempted. Both appear in the 2026 filings |
| Seattle Public Schools board (7 directors) | Not attempted; school boards are search-only with compass deferred by policy |
| **Port of Seattle Commission (5 elected positions)** | Not attempted. Surfaced during King County work — a real elected body for Seattle voters |
| **King Conservation District board** | Not attempted. Same source |

## Headshot gaps (Task 8)

169 of 172 officials have a portrait. The three without one:

| Official | Why |
|---|---|
| **Steffanie Fain** (King County Council D5) | Her county page serves her **signature image**, not a photograph. No portrait found |
| **John Wilson** (King County Assessor) | Only a 195×195 thumbnail on the assessor pages — far below the 600×750 standard |
| **Julie Wise** (King County Director of Elections) | No portrait on any King County elections page; no Wikipedia article under her own name |

Also imperfect but imported:

- **Katie Wilson** (Seattle Mayor) — no official photo exists; her Wikimedia source is a
  distant standing shot, so her face is small even after cropping.
- The 9 Seattle councilmembers use the official seattle.gov studio headshots, which are
  only **300×300** and upscale to 600×750. Correct framing was preferred over resolution
  after the Wikimedia alternatives turned out not to be portraits.

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

## Not a gap — recorded so it is not "fixed" later by mistake

- **Party is NULL on all King County and Seattle officials.** Both are officially
  **nonpartisan** — King County under the 2008 charter amendment, Seattle city offices by
  charter. NULL is the correct value, not missing data.
