# Phase 184 — Plan 01 (Wave-0) SUMMARY

**Executed inline (no subagents):** 2026-07-04
**Gate status:** ALL WAVE-0 GATES PASS — cleared to author the structural migration.

## DB probes (psql on production, read-only)

| Probe | Expected | Actual | Verdict |
|-------|----------|--------|---------|
| A — geofences (4112240 / 4105160 / 4111290, G5420) | 3 rows, correct names, valid, source=tiger_unsd_or_2024_westmetro | 3 rows: 4105160 Forest Grove SD 15, 4111290 Sherwood SD 88J, 4112240 Tigard-Tualatin SD 23J — all `ST_IsValid=t`, correct source | ✓ |
| B — greenfield governments | 0 | 0 | ✓ |
| C — greenfield SCHOOL districts | 0 | 0 | ✓ |
| D — ext-id collision (3 blocks, margin both bounds) | 0 | 0 | ✓ |
| E — ledger MAX | (trap) | 1203 — ledger lags; **on-disk MAX authoritative** | ✓ |
| F — casing (PPS geo_id 4110040 SCHOOL) | `or` lowercase | `or` | ✓ |
| G — 0-stance baseline (all 3 ext-id ranges) | 0 | 0 | ✓ |

## Migration numbers — CORRECTED (collision resolved)

**On-disk MAX is now 1207**, not 1205. A concurrent **Missouri 2026-House** workstream claimed BOTH
originally-planned numbers:
- `1206_seed_mo_2026_house_elections_races.sql` (taken)
- `1207_seed_mo_2026_house_candidates.sql` (taken)

Therefore Phase 184 uses:
- **Structural migration = `1208_or_westmetro_school_boards_wave2.sql`** (was planned as 1206; registered in ledger)
- **Headshot audit migration = `1209_or_westmetro_school_boards_wave2_headshots.sql`** (was planned as 1207; audit-only, no ledger row)

Re-confirm on-disk MAX again immediately before authoring the headshot migration (collisions are real —
this is the second consecutive wave hit by one: Wave 1 planned 1204 → shipped 1205).

## Confirmed facts for plans 02–04

- **geo_ids / names (verbatim):** 4112240 = "Tigard-Tualatin School District 23J"; 4105160 = "Forest Grove School District 15"; 4111290 = "Sherwood School District 88J".
- **ext-id blocks (5-wide, collision-free):** TTSD -4112241..-4112245, FGSD -4105161..-4105165, SSD -4111291..-4111295.
- **districts.state casing:** `or` (lowercase) in all JOIN/WHERE; `OR` uppercase only on governments.state / offices.representing_state.
- **All three boards: 5-seat, whole-district at-large** (D-Z1 does NOT fire; D-Z2 moot; no sub-zone geofences). 15 offices total, `official_count=5` each — NOT 7/21.
- **Verbatim chamber names:** TTSD `School Board`, FGSD `School Board`, SSD `Board of Directors`.

## Rosters — re-verified same-day (2026-07-04, direct/rendered fetch)

**TTSD (5/5, Chair/VC re-verified per A3 — no rotation drift):**
| Pos | Name | ext_id | Office title |
|-----|------|--------|--------------|
| 1 | David Jaimes | -4112241 | Director, Position 1 |
| 2 | Kristen Miles | -4112242 | Director, Position 2 |
| 3 | Tristan Irvin | -4112243 | Director, Position 3 (Vice Chair) |
| 4 | Jill Zurschmeide | -4112244 | Director, Position 4 (Chair) |
| 5 | Crystal Weston | -4112245 | Director, Position 5 |

**FGSD (5/5; Harrington seated P4; Student Rep = separate non-voting seat, EXCLUDED per D-R4):**
| Pos | Name | ext_id | Office title |
|-----|------|--------|--------------|
| 1 | Brisa Franco | -4105161 | Director, Position 1 |
| 2 | Pete Truax | -4105162 | Director, Position 2 |
| 3 | Alma Lozano | -4105163 | Director, Position 3 (Vice Chair) |
| 4 | Linda Harrington | -4105164 | Director, Position 4 |
| 5 | Kristy Kottkey | -4105165 | Director, Position 5 (Chair) |

**SSD (5/5; verbatim literal Chair/VC title strings from the district page; no student rep, no vacancy):**
| Pos | Name | ext_id | Office title (VERBATIM) |
|-----|------|--------|--------------------------|
| 1 | Harmony Carson | -4111291 | Board Chair/Director, Position 1 |
| 2 | Matt Kaufman | -4111292 | Director, Position 2 |
| 3 | Abby Hawkins | -4111293 | Board Vice Chair/Director, Position 3 |
| 4 | Hans Moller | -4111294 | Director, Position 4 |
| 5 | Matt Thornton | -4111295 | Director, Position 5 |

## Headshot sources — re-checked (15 URLs, 3 CDNs)

- **TTSD finalsite (5/5, HTTP 200):** 19802 / 3285 / 21726 / 24588 / 27253 B — all small, real; Lanczos-upscale-with-caveat (A5), same class as Hillsboro Wave 1.
- **FGSD Edlio (4 real + 1 gap):** Franco 246K / Truax 292K / Lozano 200K / Kottkey 270K (HTTP 200, genuine). **Linda Harrington = 4341 B "Coming Soon" placeholder PNG (HTTP 200 but NOT a photo)** → attempt local-news photo at plan-03 execution; else honest documented gap (D-R5). Do NOT ship the placeholder.
- **SSD WP REST (5/5, HTTP 200 on resolved `large` URLs):** media 10012 Carson native 2400×3000 → 819×1024 large; 10127 Kaufman native **1831×1694 near-square (center-crop, A6)**; 10011 Hawkins / 10010 Moller / 10013 Thornton all 2400×3000 → 819×1024. `resolve_wp_media_large_url` pattern validated via `py`. Never use the on-page fly-images URL.
- **FGSD domain:** `www.fgsdk12.org` = 200; `fgsd.k12.or.us` = 000 (dead — never scrape).

## Handoff to plan 02
Author `1208_or_westmetro_school_boards_wave2.sql` (structural, registered) using the rosters/titles/ext-ids
above, WR-01 `pol`-union CTE + WR-02 chamber_id-NOT-NULL post-verify, `official_count=5`, lowercase `or`.
