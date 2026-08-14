# Seattle, WA Deep Seed — Design

**Date:** 2026-08-13
**Scope:** Seattle city + King County + WA state legislature
**Status:** Approved design, pending implementation plan

---

## 1. Why this milestone looks different from prior deep seeds

Washington is nearly greenfield, and one gap gates everything else.

| Layer | State at design time |
|---|---|
| Federal delegation | Present — 10 House + 2 Senate, incumbents seated |
| Statewide executives | Present — 5 (`-5300001..-5300005`) |
| WA 2026 General election | Present — 10 congressional races, 69 candidates pre-verified |
| State legislature | **Absent** — 0 of 49 districts |
| King County | **Absent** — only a TIGER county polygon |
| City of Seattle | **Absent** — no `governments` row |
| G4110 place geofences, statewide | **Absent** — 0 places in all of WA |

That last row is the gate. WA currently holds county (39, G4020), congressional (10, G5200) and state (1, G4000) polygons only. **No WA address routes to any city.** Until the places layer loads, a Seattle official cannot be reached from a Seattle address, so the geofence work precedes every other deliverable.

A second consequence shapes the candidate scope: **Seattle has no city office on the 2026 ballot.** Mayor, City Attorney and Council Positions 8 and 9 were elected in November 2025 (terms to 2029); Districts 1–7 were elected in 2023 (terms to 2027). The 2026 candidate layer therefore lives entirely at the county and legislative tiers.

---

## 2. Geofence foundation

| Layer | MTFCC | Count | Source |
|---|---|---|---|
| WA places (all) | G4110 | ~281 | TIGER `PLACE`, state 53 |
| WA legislative districts (upper) | **G5210** | 49 | TIGER `SLDU` |
| WA legislative districts (lower) | **G5220** | 49 | TIGER `SLDL` |
| Seattle council districts | **X0025** | 7 | Seattle ArcGIS / data.seattle.gov |
| King County council districts | **X0026** | 9 | King County GIS ArcGIS |

X0025 and X0026 are the next free custom MTFCCs (X0024 = `bend-or-park-rec-district` is the current maximum).

### Multi-member House districts

Each of the 49 WA legislative districts elects **one Senator and two Representatives** (Positions 1 and 2) over the *same* boundary. SLDL is therefore 49 polygons covering 98 representatives — not 98 polygons. This is the Maryland delegate pattern and inherits its trap:

> The `NOT EXISTS` idempotency guard must key on `(district_id, politician_id)`, **not** `(district_id, chamber_id)`. Keyed on chamber, the second seat in every district silently fails to insert and the roster lands at 49 instead of 98.

### Verify, do not assume

- **MTFCC orientation — CONFIRMED INVERTED 2026-08-13.** The table above is corrected: `sldu` loads as **G5210** (upper/Senate) and `sldl` as **G5220** (lower/House), the opposite of a plain TIGER reading and the same as CA/VA/NV/AZ here. Verified twice — by loader config and independently by the boundary names ("Legislative (Senate) District 34" carries mtfcc G5210). The original presumption in this spec was backwards; verifying at load rather than hard-coding is what caught it.
- **`geo_id` is not unique across MTFCCs.** `53001` is Adams County (G4020), LD 1 Senate (G5210), and LD 1 House (G5220) at once. Join on `(geo_id, mtfcc)`.
- **The loader writes district rows itself** for `sldu`/`sldl` (`writeDistrictRow=true`), so all 98 `essentials.districts` rows already exist after the load. Downstream migrations create chambers and offices only.
- **geo_ids.** Seattle is presumably `5363000` and King County `53033`. Both are confirmed against loaded TIGER data before any government row is written. The playbook records four prior cities where an estimated geo_id was wrong, including one that resolved to an entirely different city.
- **`districts.government_id` is frequently NULL.** Join districts by `geo_id`, never by `government_id`.
- **State casing is inconsistent by table.** Follow the existing per-table convention rather than assuming; `districts.state` and `elections.state` do not agree across prior states.

---

## 3. Government, chamber and office model

### City of Seattle — `geo_id` 5363000

Mayor-council (strong mayor), under State of Washington.

| Chamber | Seats | District type | Notes |
|---|---|---|---|
| Mayor | 1 | LOCAL_EXEC | Katie Wilson — directly elected, not council-selected |
| City Council | 9 | LOCAL | Districts 1–7 on X0025; Positions 8 and 9 citywide |
| City Attorney | 1 | LOCAL_EXEC | Erika Evans — Seattle elects its city attorney |

Per the citizen-experience principle, titles follow Seattle's own usage: **"Councilmember"** as one word; district seats as `Councilmember, District N`; the at-large pair as `Councilmember, Position 8 (Citywide)` and `Position 9`.

### King County — `geo_id` 53033

A **standalone `governments` row**, not nested under State of Washington, following the Clark County NV and Washington County OR pattern.

| Office | Count | Notes |
|---|---|---|
| County Executive | 1 | Girmay Zahilay, elected Nov 2025 |
| Metropolitan King County Council | 9 | Districts 1–9 on X0026, nonpartisan; Chair is a title on a seat |
| Prosecuting Attorney | 1 | Leesa Manion — on the 2026 ballot |
| Assessor | 1 | John Wilson — incumbent, not seeking re-election |
| Director of Elections | 1 | Julie Wise — on the 2026 ballot |

**Sheriff:** appointed under the 2020 charter amendment. Seeded with `is_appointed=true` and `chambers.policy_engagement_level='none'` — the administrative treatment prior cities gave appointed clerks and auditors. It appears in the roster without drawing a compass it has no electoral record to support.

### WA Legislature

Under the existing State of Washington row. Chambers named in the short form already used there (`State Senate`, `House of Representatives`), matching the existing bare `Governor` / `Attorney General`.

### External ID scheme

Extends the established WA convention rather than opening a new band.

```
-5300001..-5300005   statewide execs        (EXISTING)
-5310001..-5310049   State Senate           (49)
-5320001..-5320098   House of Representatives (98, two per district)
-5363001..-5363011   Seattle                (Mayor, 9 council, City Attorney)
-5303301..-5303314   King County            (13 elected + appointed Sheriff)
```

Verified: the `-5400000..-5300000` band contains nothing but the five statewide executives. All four new ranges are collision-free.

### Occupancy

Set through both gates the schema requires: an `office_terms` row with real `term_start`/`term_end` values **and** `politicians.is_incumbent`. Term dates come from official sources and are never left NULL/NULL — that combination reads downstream as "currently serving" and would mask a later departure.

---

## 4. Headshots

| Tier | Host | Count | Probe result |
|---|---|---|---|
| Seattle | seattle.gov | 11 | HTTP 200, **0 `<img>` tags** |
| King County | kingcounty.gov | 13 | HTTP 200, 10 `<img>` tags |
| Legislature | leg.wa.gov | 147 | HTTP 200, roster served |

All three hosts answer plain `curl` with a Chrome UA and show **no WAF challenge** — no Cloudflare interstitial, no Akamai 403, no "Just a moment" body. This retires the single largest recurring risk in this playbook up front; six prior cities finished at or near 0% headshot coverage purely because of host blocking.

**One wrinkle.** The Seattle council roster returns 72KB with zero `<img>` tags, so portraits are CSS `background-image` or JS-rendered — the Sacramento AEM pattern, where `WebFetch` silently fails and `curl` + `grep` is required. Fallback ladder for Seattle's 11: per-member bio pages first, then Playwright.

Standard image handling applies: 600×750, 4:5, q90, eyes at roughly the upper third, crop *then* resize (never distort), no graphics or logos composited in.

---

## 5. Banners

**A conflict exists and must be resolved deliberately:** the WA state banner is *already* a Seattle photograph — Space Needle and Mt. Rainier, at `src/lib/buildingImages.js:670`. A default Seattle city banner would duplicate the state banner almost exactly.

Two new `CURATED_LOCAL` entries, sourced one at a time, real photography (no AI generation, no aerials), cropped tight with the ~0.68 anchor so the frame is not mostly sky:

- **Seattle (5363000)** — deliberately *not* a Space Needle skyline. A street-level civic or neighborhood subject, so the city reads as distinct from the state shot that already owns that skyline.
- **King County (53033)** — a county subject that is likewise not the Seattle skyline, keeping all three tiers visually separable.
- **State of Washington** — unchanged; keeps the existing Space Needle image.

---

## 6. Candidates and the August 21 cull

| Race group | Status |
|---|---|
| US House CD7 / CD9 | Already seeded, 4–5 candidates each, pre-verified |
| WA legislative — Senate seats on this cycle + all 98 House seats | To seed, full filed field |
| King County — Prosecutor, Assessor, Elections Director, 4 of 9 Council | To seed; first even-year county cycle |
| Seattle city | **None** — no city office on the 2026 ballot |

King County moved from odd- to even-year elections under a 2022 charter amendment; 2026 is the first even-year cycle, which is why the county tier carries a real candidate field.

**Senate seats are staggered.** WA senators serve four-year terms, so only roughly half the 49 districts have a Senate race in any given even year, while all 98 House seats are up every cycle. The exact set of Senate districts on the 2026 ballot is read from the SoS filed-candidate list — never inferred from district numbering or from a prior cycle's pattern.

**Sequencing.** Full filed fields are seeded and verified now. A **single cull event on August 21** — the SoS certification deadline for the August 4 primary — drops non-advancers across all WA races at once, including the 69 congressional candidates already waiting on that gate. One gate, one cull, one verification pass.

**Guards:**

- `races` and `race_candidates` have **no unique constraint** on the dedupe key. Idempotency uses `NOT EXISTS`, never `ON CONFLICT`.
- Partial unique indexes on `(election_id, position_name)` require every row in one election to carry a **distinct `position_name`**. WA's two-per-district House seats make this sharp: `LD 43 Representative Position 1` and `Position 2` must be separately labeled or the second silently collides.
- The cull gates on the **certified canvass**, not on press calls. A race that looks decided on election night can still move.
- An unopposed race that vanishes from the ballot resolves to `won`, not to absent.

---

## 7. Stances — Seattle 11 + King County 13

Per the approved sequencing, stances cover the city and county tiers only. **The 147 legislators ship with zero stance rows and an explicit GAPS entry**, to be researched in a following milestone where roll-call verification gets a phase built for it.

### Corpus

Both bodies publish a genuine roll-call record — `seattle.legistar.com` and `kingcounty.legistar.com` — the same class of primary source that made the Berkeley annotated agenda work. Campaign material is a fallback, not a substitute.

### Rules

- **Evidence-only, no defaulting.** A silent record produces a blank spoke, and a blank spoke is the correct answer. Nobody is parked at a middle value to fill a row.
- **A chair needs evidence describing *that chair*.** Direction is not a chair. "Least extreme option" is a tiebreaker only; reaching for it means the row is not evidenced and should not be filled.
- **Sourcing is tested per row**, not per politician. A politician-level aggregate can look well-sourced while individual rows are bare.
- **Never cite an unfetched URL.** Every citation is retrieved before it is written.
- **Co-sponsorship counts as much as authorship.** An executive's signed plan outranks a co-sponsorship.
- **Excluding a topic is not neutral.** Several topics have their pro end at the high chair; orientation is read off the live topic record, never assumed.
- **Party never displays on profiles.**

### The specific risk: thin in-office records

Six of the 24 took office in January 2026 — Mayor Wilson, City Attorney Evans, Councilmembers Lin, Foster and Rinck, and Zahilay in the Executive seat. Seven months of Legistar is not much of a record.

Their strongest evidence is prior-role and campaign material — Wilson's Transit Riders Union tenure especially, which is extensively documented. That evidence is legitimate, but it is precisely where the pre-tenure defect class originated: prior-role advocacy written up as though it were officeholder action.

Those rows are therefore sourced to what they actually are — a platform position or an advocacy record, labeled as such. Where that is not enough to identify a specific chair, **the spoke stays blank.**

Debora Juarez is the inverse case: appointed to District 5 in 2025, but a councilmember from 2016 to 2023, so she carries a deep record.

---

## 8. Explicit gaps

Recorded so the boundary is visible rather than silent. Each becomes follow-on work.

| Gap | Reason |
|---|---|
| 147 legislators have 0 stance rows | Deferred by sequencing decision; own milestone |
| WA Supreme Court (9 justices) | Out of scope this milestone |
| King County Superior Court (~53) + Seattle Municipal Court (7) | Out of scope this milestone |
| Seattle Public Schools board (7 directors) | Out of scope; school boards are search-only with compass deferred by policy |

---

## 9. Deliverables checklist

1. TIGER G4110 places load for WA (~281) — **gates everything else**
2. TIGER SLDU + SLDL load (49 + 49), MTFCC orientation verified at load
3. Seattle council district geofences (7, X0025)
4. King County council district geofences (9, X0026)
5. `governments` rows: City of Seattle (5363000), King County (53033, standalone)
6. Chambers and offices: Seattle 11, King County 13 (+ appointed Sheriff), legislature 147
7. Incumbents seated with real `office_terms` dates and `is_incumbent`
8. Headshots: 171 targets across three open hosts
9. Banners: two new `CURATED_LOCAL` entries, state banner untouched
10. 2026 candidate field: legislative + King County, full filed roster
11. August 21 cull across all WA races, gated on certified canvass
12. Stances: Seattle 11 + King County 13, evidence-only
13. GAPS entry covering section 8
14. `LOCATION-ONBOARDING.md` rows for Seattle and King County, plus a Washington Quick Reference section
