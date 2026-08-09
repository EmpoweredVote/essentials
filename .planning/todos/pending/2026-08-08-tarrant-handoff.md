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

## ▶▶ NEXT UP — the rest of the Tarrant County November ballot (operator asked for this)

Mig 1636 seeded only the 3 contests whose offices already existed. **42 more contests are on the
same ballot and none of their offices exist in `essentials.offices`.** This is the blocker: the
work is *create offices first, then races, then candidates*, not just races.

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

### 🔴 Decisions to make BEFORE writing the migration

1. **The 13 "Texas Nth District Court" seats are STATE district courts, not county offices.**
   They appear on the Tarrant ballot but belong to the judicial tier, not
   `Tarrant County, Texas, US`. Putting them under the county government would be wrong and would
   make them render as county offices. Decide the government/chamber before seeding.
   See `project_ca_judicial_districts_null_geoid` — 504 CA judicial districts with NULL `geo_id`
   left the Judges tab empty. Do not repeat that: set `geo_id`.
2. **JP precincts (1–8) are county subdivisions** and need `districts` rows if they are to be
   geo-resolvable; Tarrant's existing offices all share one LOCAL district row.
3. **Judicial coverage has its own rules** — see `project_judicial_compass_design` and
   `project_judicial_discipline_display`. Do not attach stances to judges casually.
4. **Appraisal district board**: Ballotpedia notes a filing deadline of **2026-08-17**, i.e. after
   this handoff. That field is not final — re-check before seeding, and expect additions.

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
