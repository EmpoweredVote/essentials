# ACCOUNTS TEAM REQUEST — Indianapolis: Nashville-precedent consolidation + 20 missing councillors

**Raised** 2026-09-29 · **Decision already taken by the operator:** follow the **Nashville precedent**.
**Scope of this document:** roster research and plan only. **No production writes were made.**

---

## Why Indianapolis is unreachable today

`City of Indianapolis, Indiana, US` carries **`geo_id = NULL`**, and a landing-page chip is keyed on
`governments.geo_id`, so no browse URL can address it. Migration `CC_0183` (2026-09-29) fixed exactly
this for Lexington-Fayette and Wichita, but **its own gate refused Indianapolis**, correctly:

* `18097` (Marion County FIPS) is **already taken** by `Marion County, Indiana, US`, which holds 11
  chambers and 38 seated officials.
* `1836003` (Indianapolis place FIPS) **names no district in the database at all** — it is not in
  `essentials.geofence_boundaries`.

So it was never a one-column fix. It is a modelling question, and the operator has now answered it.

## The operator's ruling: Nashville precedent

> One government row on the **county FIPS**, labelled with the **city name**, no separate county entry.

Nashville is the working example — `Metropolitan Government of Nashville and Davidson County`,
`geo_id 47037` (a COUNTY fips), label `Nashville`:

| chamber | offices | with district_id | seated | representing_city |
|---|---|---|---|---|
| Metropolitan Council | 41 | 41 | 41 | Nashville |
| Office of the Mayor | 1 | 1 | 1 | Nashville |

**Every office carries a `district_id` and a non-empty `representing_city`.** That second column is
load-bearing: `buildingImages` resolves a city banner off `representing_city`, so an empty string
means no banner even once a chip exists.

## What Indianapolis looks like right now

Two rows that are **not duplicates** — they are two halves of one consolidated government.

**`City of Indianapolis, Indiana, US`** — `geo_id NULL`, 6 chambers, 6 seated:

* `City Mayor` — 1 office, 1 seated
* `/Marion City/County Council - District 8`
* `/Marion City/County Council - District 12`
* `/Marion City/County Council - District 13`
* `/Marion City/County Council - District 14`
* `/Marion City/County Council - District 18`

Three defects in that alone:

1. **One chamber per district** instead of one council chamber holding N district offices. Nashville
   has 41 offices in ONE chamber; Indianapolis has 5 chambers of 1 each.
2. **A leading slash in every chamber name** — `/Marion City/County Council - District 12`.
3. **`representing_city` is the empty string**, not `Indianapolis`.

**`Marion County, Indiana, US`** — `geo_id 18097`, 11 chambers, 38 seated: Assessor, Auditor, Circuit
Court Clerk, Coroner, Prosecuting Attorney, Recorder, Sheriff, Surveyor, Treasurer, 1 Circuit Court
judge and **28 Superior Court judges**.

## The roster is 5 of 25

indy.gov states its own denominator, verbatim:

> "The City-County has 25 Councilors, one for each district. Councilors serve a four-year term."

We hold **five** — districts 8, 12, 13, 14 and 18. All five names match the city's own list exactly,
so what is seeded is correct; it is simply 20 short. **Twenty councillors must be created.**

## The roster, cross-checked against two independent city sources

**Source A — the rendered member index**, `https://www.indy.gov/activity/city-county-council-members`.
Gives district to name for all 25, plus the 25-seat and four-year-term statement quoted above.

**Source B — the Hygraph CMS that indy.gov runs on**,
`https://api-us-east-1-indy.graphcms.com/v2/ckp3xrh1i657g01xp53az2mv4/master` (the public read
endpoint the site itself queries). Returns **25 published `Person` records** whose names match Source
A exactly, each with a biography that independently states the district for **23 of the 25**.

> **indy.gov cannot be read with a plain HTTP fetch.** Every page returns HTTP 200 with a ~4.3 KB
> client-rendered shell; on a councillor page the person's name appears only inside the canonical URL
> and nowhere in the body. `curl` with a browser user-agent is not enough — this needs a headless
> render, or the GraphQL endpoint above. **A 200 here is not evidence of content.**

| District | Name | Council role | District confirmed by | CMS record updated | Action | Per-person source |
|---|---|---|---|---|---|---|
| 1 | Leroy Robinson | Councilor | both | 2024-03-03 | CREATE | https://my.indy.gov/activity/councillor-leroy-robinson |
| 2 | Brienne Delaney | Councilor | both | 2024-03-03 | CREATE | https://my.indy.gov/activity/councilor-brienne-delaney |
| 3 | Dan Boots | Councilor | both | 2025-07-11 | CREATE | https://www.indy.gov/activity/councillor-dan-boots |
| 4 | Nick Roberts | Councilor | both | 2024-03-03 | CREATE | https://my.indy.gov/activity/councilor-nick-roberts |
| 5 | Maggie A. Lewis | Council President | **index only** | 2026-09-08 | CREATE | https://my.indy.gov/activity/councillor-maggie-a-lewis |
| 6 | Carlos Perkins | Councilor | both | 2024-03-03 | CREATE | https://my.indy.gov/activity/councilor-carlos-perkins |
| 7 | John Barth | Council Vice President | both | 2026-01-06 | CREATE | https://www.indy.gov/activity/councillor-john-barth |
| 8 | Ron Gibson | Councilor | both | 2026-09-24 | already seeded | https://my.indy.gov/activity/councilor-ron-gibson |
| 9 | Keith L. Graves | Councilor | both | 2024-03-03 | CREATE | https://www.indy.gov/activity/councillor-keith-l-graves |
| 10 | Alison "Ali" Brown | Councilor | both | 2026-01-06 | CREATE | https://www.indy.gov/activity/councillor-ali-brown |
| 11 | Crista Lee Wells | Councilor | both | 2026-02-12 | CREATE | https://www.indy.gov/activity/councillor-crista-carlino |
| 12 | Vop Osili | Councilor | both | 2026-01-06 | already seeded | https://my.indy.gov/activity/councillor-vop-osili |
| 13 | Jesse Brown | Councilor | both | 2026-07-23 | already seeded | https://my.indy.gov/activity/councilor-jesse-brown |
| 14 | Andy Nielsen | Councilor | both | 2025-01-27 | already seeded | https://my.indy.gov/activity/councilor-andy-nielsen |
| 15 | Rena Allen | Councilor | both | 2024-06-10 | CREATE | https://my.indy.gov/activity/councilor-rena-allen |
| 16 | Jessica McCormick | Councilor | both | 2024-03-03 | CREATE | https://www.indy.gov/activity/councillor-jessica-mccormick |
| 17 | Jared Evans | Council Majority Leader | both | 2026-01-06 | CREATE | https://www.indy.gov/activity/councillor-jared-evans |
| 18 | Kristin Jones | Councilor | both | 2024-03-03 | already seeded | https://www.indy.gov/activity/councillor-kristin-jones |
| 19 | Frank Mascari | Councilor | both | 2024-03-03 | CREATE | https://my.indy.gov/activity/councillor-frank-mascari |
| 20 | Michael-Paul Hart | Councilor | both | 2024-03-03 | CREATE | https://www.indy.gov/activity/councillor-michael-paul-hart |
| 21 | Josh Masquelier | Councilor | both | 2026-09-17 | CREATE | https://www.indy.gov/activity/councilor-josh-masquelier |
| 22 | Paul Annee | Councilor | both | 2025-05-14 | CREATE | https://www.indy.gov/activity/councillor-paul-annee |
| 23 | Derek Cahill | Councilor | **index only** | 2024-03-03 | CREATE | https://my.indy.gov/activity/councilor-derek-cahill |
| 24 | Michael Dilk | Councilor | both | 2026-08-18 | CREATE | https://www.indy.gov/activity/councillor-michael-dilk |
| 25 | Brian Mowery | Council Minority Leader | both | 2025-05-14 | CREATE | https://my.indy.gov/activity/councillor-brian-mowery |

**Two rows rest on Source A alone** — District 5 (Maggie A. Lewis) and District 23 (Derek Cahill).
Both have CMS records and both appear on the index; their bios simply do not restate the district in
a parseable form. Worth one headless render each to close, rather than seeding on a single source.

> **District 11's slug is a name change, not an error:** `councillor-crista-carlino` redirects to
> `councilor-crista-lee-wells`. Slugs across the site are inconsistent — both `councilor-` and
> `councillor-`, across both `www.indy.gov` and `my.indy.gov`. Do not normalise them; use the URLs
> in the table.

**Party is deliberately not tabulated.** Only 9 of 25 bios use the `(Democrat)` convention, and party
never displays in this product anyway.

**Terms are deliberately absent.** No page states a term start or end. Per ADR 0002 `term_start` is
nullable **on purpose**, with `start_precision` to record imprecision — so seed it NULL rather than
inventing `2024-01-01` from "four-year term" plus the 2023 election date.

## Proposed migration

Take the slot from the allocator, never by hand — `node scripts/steward.mjs slot shared --purpose "..."`
from `C:/EV-Accounts/backend`. Apply as `postgres` over the `supabase-local` MCP, and **verify on row
counts, never on a green "Applied OK"**.

1. Move the Mayor office and the 5 council offices from the `City of Indianapolis` government to
   `Marion County`'s government id.
2. Collapse the 5 `/Marion City/County Council - District N` chambers into **one** chamber named
   `City-County Council`; drop the emptied chambers.
3. Create the **20 missing councillors** as politicians + offices + `office_terms`, districts 1-25,
   `term_start` NULL with `start_precision`.
4. Set `representing_city = 'Indianapolis'` on all 26 city offices (25 council + Mayor).
   Leave the 38 county offices alone — they are county-wide and carry no city.
5. Rename the government to the consolidated form, keeping `geo_id = 18097`.
6. Retire the now-empty `City of Indianapolis` row.

**Verify after applying:** one government on `18097`; `City-County Council` holds 25 offices, 25
seated, 25 distinct districts; Mayor 1 of 1; 26 offices with `representing_city = 'Indianapolis'`;
`City of Indianapolis` gone; the county's 38 untouched.

## Two things this does NOT fix

* **No council-district polygons exist.** The only Indiana local district geofences in
  `geofence_boundaries` are Monroe County Council's four, from the Bloomington seed. Indianapolis will
  be reachable **by chip only**; an address cannot route to a council district until polygons load.
  Nashville has the same property and ships fine — a limit to state, not a blocker.
* **No banner.** `cities/indianapolis.jpg` does not exist. Fort Wayne and Gary already hold IN city
  keys, so check adjacency against both and against `states/IN.jpg`. The chip should wait for a
  certified banner, the same rule that gated Nashville.

## Essentials-side follow-up (this repo, after the migration lands)

One entry in the existing Indiana block of `src/lib/coverage.js`:

```js
{ label: 'Indianapolis', browseGovernmentList: ['18097'], browseStateAbbrev: 'IN', hasContext: false },
```

`hasContext: false` — measured 2026-09-29: no Indianapolis or Marion County officeholder holds a row
in `inform.politician_answers`.

> **Adding this means Marion County must come OUT of any county list**, exactly as Davidson County is
> absent for Nashville. One place, one entry.
