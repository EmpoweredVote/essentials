# Tarrant County — handoff, 2026-08-08

Session took the Tarrant cluster from "seeded, no faces" to **fully covered, verified, and with
its county election on the ballot**. Everything below is **applied AND pushed** (EV-Accounts
`master` @ `4790c57a`).

**Migrations landed this session: 1632, 1634, 1636.**
**Next free migration: check `origin/master` — do NOT trust this number.** Two separate
number collisions happened in this one session (see Gotchas).

---

## ✅ DONE

| Area | State |
|---|---|
| Headshots | **54 / 54**, every holder has image + `photo_origin_url` + `photo_license` (all `press_use`) |
| Banners | **5 of 6 cities live**; Euless is an accepted coverage gap |
| Rosters | Euless (mig 1632) and Arlington (mig 1634) corrected — **6 real officeholders recovered** |
| Elections | Tarrant County's 3 countywide races seeded for Nov 3 2026 (mig 1636) |

Per-government coverage is 11 Fort Worth / 9 Arlington / 8 NRH / 7 Mansfield / 7 Grapevine /
7 Euless / 5 Tarrant County, **0 vacant seats anywhere**.

---

## ✅✅ DONE 2026-08-09 — the full county ballot is seeded (migration 1640, pushed)

All 42 remaining contests are in. **Tarrant County now: 8 chambers / 47 offices / 0 vacant /
45 races / 66 candidates / 40 officeholders**, every chamber's office count matching its
`official_count`.

Migration 1640 added 7 chambers, 42 offices, 42 races, 60 candidates, 60 politician records and
occupancy for the 35 incumbents.

**Chamber model = Racine County, WI** (governing body + `Countywide Elected Officials` + one
chamber per court). Racine also settled the state-court question: Wisconsin circuit courts are
likewise STATE trial courts elected by county, and Racine models them under the COUNTY government,
so the 13 Texas district courts do the same.

### Lessons from the build (all cost time)
- ⚠ **Reserved words cannot be VALUES column aliases** — `) AS v(full, ...)` is a syntax error.
  Use `fullname/fname/lname`. The whole 6-statement transaction rolled back cleanly on the error;
  **verify nothing committed before retrying** rather than assuming.
- ⚠ Naive `name.split()[-1]` gave **"Sergio De Leon" → last_name "Leon"**. Keep an override map
  for multi-word surnames.
- 🔑 **One name collision in 60, and it was a trap**: "David Cook" already existed as a **Texas
  State Rep with 7 compass answers** — not the Criminal Court No. 1 judge. A separate record was
  created deliberately; linking them would have grafted a legislator's compass profile onto a
  judicial race.
- ⚠ **7 seats have no incumbent on the ballot** (1 Criminal District, 4 District, 1 Justice,
  1 Probate). They are `is_vacant=false` with **no holder** — their occupant is unknown, NOT
  absent. Marking them vacant would recreate the exact 1628 Euless bug.
  ▶ **Owed: source those 7 current occupants.**

### Historical note — what the blocker had been
Mig 1636 seeded only the 3 contests whose offices already existed. The other 42 had no
`essentials.offices` rows at all, so the work was *create offices first, then races, then
candidates*.

### Inventory (from Ballotpedia "Municipal elections in Tarrant County, Texas (2026)", fetched 2026-08-08)

**County administrative — 3 contests**
- County Clerk — Mary Louise Nicholson (i) v. Lydia Bean
- District Attorney — Phil Sorrells (i) v. Tiffany Burks
- District Clerk — Thomas Wilder (i) v. Nathan Smith

**County Courts at Law — 3 contests, all unopposed incumbents**
- No. 1 Don Pierson (i) · No. 2 Jennifer Rymell (i) · No. 3 Mike Hrabal (i)

**County Criminal Courts — 10 contests** (Nos. 1–10; several unopposed)

**Criminal District Courts — 3 contests** (Nos. 1, 3, 4 — note: **no No. 2 on this ballot**)

**Probate Courts — 2 contests** (No. 1 Patricia Burns (i), No. 2 Brook Be…[truncated in extract])

**Justice of the Peace — 8 contests** (Precincts 1–8)

**Texas District Courts — 13 contests**
141st, 231st, 233rd, 236th, 297th, 322nd, 323rd, 324th, 325th, 371st, 372nd, 432nd, 485th

**Total remaining: 42** (3 + 3 + 10 + 3 + 2 + 8 + 13). With the 3 already seeded, the full county
ballot is **45 contests**.

### ✅ DECIDED 2026-08-08 (operator) — do not re-litigate these

**Decision 1 — the 13 "Texas Nth District Court" seats get `geo_id = '48439'` (Tarrant County),
NOT `'48'` (Texas).** Reuse the existing district row
`0d533885-23fb-4f13-8084-fe01dc57372b` — label `Tarrant County`, `COUNTY`, `48439`, `G4020`,
already shared by all 5 existing Tarrant County offices and backed by an exact geofence.

Rationale: **`geo_id` encodes who VOTES for the office, not which level of government owns it.**
These are Texas state courts constitutionally, but only Tarrant voters elect them. `geo_id = '48'`
would surface all 13 Tarrant judicial races to every voter in Texas.

The pattern is already proven in `essentials.districts` by Indiana:
| label | geo_id | why |
|---|---|---|
| `Indiana Supreme Court Justice (Retain Goff?)` | `18` | statewide retention → statewide electorate |
| `Greene County Superior Court Judge` | `18055` | county FIPS → county electorate |

Same `JUDICIAL` type, different `geo_id`, chosen by electorate. Texas district courts are case 2.

⚠ **Per-court check still owed**: some Texas district courts are **multi-county** (rural benches
share a judge). If any of the 13 serves beyond Tarrant, a county-only `geo_id` under-resolves it
for the other counties' voters. Tarrant's are almost certainly single-county (urban), but confirm
court by court rather than assuming.

**Decision 2 — do NOT create district rows for the 8 JP precincts. Reuse the same county district row.**

Checked 2026-08-08: Tarrant has exactly **two** geofences — the county itself (`48439`/`G4020`)
and one unrelated town. **There is no sub-county geometry at all**: no JP precincts, no
commissioner precincts.

So creating 8 JP district rows means inventing `geo_id`s that **no geofence backs**. A district
whose `geo_id` matches no geofence resolves to nobody and the office becomes **invisible** — it
does not error, it simply never appears for any address. That is exactly
`project_ca_judicial_districts_null_geoid` (504 rows, empty Judges tab), and Indiana has the same
bug in miniature at `1800001`.

Precedent that settles it: **the 4 commissioner precinct offices already share the single county
district row.** Precinct-level granularity is already absent for commissioners and was accepted.

Tradeoff, stated honestly: every Tarrant voter will see all 8 JP races and all 4 commissioner
precincts when they vote in only one of each. That is **over-showing** — wrong but visible and
fixable. Inventing geo_ids gives **under-showing** — wrong and invisible. Over-showing is the
safer failure and is what the data already does.
▶ If precinct accuracy is wanted later, the real fix is sourcing JP/commissioner precinct
boundaries from Tarrant GIS and loading them as **geofences first**. Geometry before district
rows, never the reverse.

### 🔴 Still open

3. **Judicial coverage has its own rules** — see `project_judicial_compass_design` and
   `project_judicial_discipline_display`. Do not attach stances to judges casually.
4. **Appraisal district board**: filing deadline **2026-08-17**, after this handoff. Operator is
   fine topping this off later — re-check after that date and expect additions.

### ⚠ Data-quality caveats on the extract
- The judicial tables are **nested `div`s, not `<table>` elements** — an HTML table parser returns
  zero rows. Parse by section text. My extractor is in
  `<scratchpad>/tcraces/parse_ballot.py`; it works but **bleeds the next section heading into the
  last candidate cell** (e.g. "Trent Loftin, TTarrant County Criminal Court"). **Re-verify every
  candidate list per race** before seeding — do not paste the extract in.
- Ballotpedia carries a standing *"candidate list may not be complete"* notice on every one of
  these. The March 3 primaries are decided so major-party nominees are settled, but late
  independents/write-ins would be missed. Stamp `last_verified_at` (mig 1636 does).

### Model to copy
Mig 1636 is the worked example. Key points:
- County races hang off the **existing `TX 2026 Statewide General`** election row, *not* a new
  county election — matches Racine County → `WI 2026 Statewide General` and Deschutes/Washington →
  `OR 2026 General`. `position_name` carries the county prefix.
- **Dup-check every candidate.** 4 of 6 in mig 1636 already existed, including Tony Tinderholt as a
  sitting TX state rep. Expect the same for judges.
- `race_candidates` has **no party column**; party is not stored (antipartisan display rule).

---

## ▶ ALSO OUTSTANDING

### 0. ▶▶ START HERE NEXT — Texas state races (biggest remaining gap; NOT started)
See item 1. Scoped but untouched: expect ~150 TX House + 31 TX Senate + statewide executive
offices, so it is a multi-migration job on the scale of the county ballot, not a top-off.

### 1. 🔴 All Texas STATE races are missing (statewide gap, not Tarrant-specific)
`TX 2026 Statewide General` contains **only 38 U.S. House races + U.S. Senate**. There is **no
Governor, Lt. Governor, Attorney General, Comptroller, and no state legislative race** — in a
Texas gubernatorial year. This affects every Texas voter in the app and is arguably bigger than
the county ballot. Verified by direct query, not assumed.

### 2. Stances — 54 people (multi-session)
Not started. Evidence-only, one researcher agent at a time, blank spoke is a correct outcome,
never cite an unfetched URL. **Calibration: Newton's 48 rows took several sessions and yielded 13.**
No Tarrant chip may gain `hasContext` until stances exist.

### 3. Three candidate headshots owed
Jared Williams, Nydia Cardenas, and **Tony Tinderholt** (no image despite being a sitting state
rep). O'Hare / Simmons / Ramirez already have photos.

### 4. Euless banner
Accepted gap. Commons has only a 1046x683 welcome sign, a high school and a Michaels storefront.
Revisit only if a licensed photo appears.

---

## 🔑 GOTCHAS THIS SESSION (all cost real time)

1. **Migration numbers collided TWICE.** Another session took 1631 concurrently (I renumbered mine
   to 1632); 1633 was taken while I wrote the Arlington fix. `git fetch` immediately before
   choosing **and re-check after every push**.
2. 🔴 **Occupancy seeded from ELECTION RESULTS is wrong.** Texas cancels the election when a
   candidate is unopposed, so an unopposed winner leaves **no results row** and the seeder reads
   that absence as a vacancy. This produced 6 phantom vacancies across Euless and Arlington.
   **Seed occupancy from the jurisdiction's roster page.**
   **Cheap detector:** `count(*) FILTER (WHERE o.is_vacant)` per government — a cluster of
   vacancies in one city means they were inferred, not real.
3. **`politicians.is_incumbent` DEFAULTS TO TRUE.** Set it false explicitly for challengers.
4. **`politicians.office_id` is live** (not the deprecated column some docs claim). When moving
   someone between offices you must update **both** `office_terms.office_id` and
   `politicians.office_id` or the two disagree.
5. **Playwright defeats the Akamai 403** on arlingtontx.gov, fortworthtexas.gov and eulesstx.gov —
   curl gets 403, real Chrome gets 200. Earlier notes generalised the opposite from one host.
6. **Wayback `web/<ts>id_/<url>` serves full-res originals the live WAF blocks** (needs
   `curl --compressed`). If the bare path 404s, the archived form may carry a query string
   (`?w=1080`).
7. **Operator preference: my banner crops leave too much sky.** Use `--vertical-anchor ~0.68`,
   not the 0.5 default.
8. **`docs/banner-asset-pipeline.md` Stage 6 is stale** — `CURATED_LOCAL` values are
   `{ state, src }` objects now, not bare strings.

---

## Verify state quickly

```sql
-- expect 54 / 54 / 54 / 0
SELECT count(*) FILTER (WHERE NOT o.is_vacant) AS filled,
       count(pi.id) AS with_image,
       count(*) FILTER (WHERE p.photo_origin_url IS NOT NULL) AS with_origin,
       count(*) FILTER (WHERE o.is_vacant) AS vacant
FROM essentials.offices o
JOIN essentials.chambers c ON c.id = o.chamber_id
JOIN essentials.governments g ON g.id = c.government_id
LEFT JOIN essentials.office_current_holder och ON och.office_id = o.id
LEFT JOIN essentials.politicians p ON p.id = och.politician_id
LEFT JOIN essentials.politician_images pi ON pi.politician_id = p.id
WHERE g.name IN ('City of Arlington, Texas, US','City of Euless, Texas, US',
  'City of Fort Worth, Texas, US','City of Grapevine, Texas, US','City of Mansfield, Texas, US',
  'City of North Richland Hills, Texas, US','Tarrant County, Texas, US');

-- expect 3 races / 6 candidates / 0 unlinked
SELECT r.position_name, count(rc.id) AS cands, count(rc.politician_id) AS linked
FROM essentials.races r
JOIN essentials.offices o ON o.id = r.office_id
JOIN essentials.chambers c ON c.id = o.chamber_id
JOIN essentials.governments g ON g.id = c.government_id
LEFT JOIN essentials.race_candidates rc ON rc.race_id = r.id
WHERE g.name = 'Tarrant County, Texas, US'
GROUP BY r.position_name ORDER BY 1;
```
