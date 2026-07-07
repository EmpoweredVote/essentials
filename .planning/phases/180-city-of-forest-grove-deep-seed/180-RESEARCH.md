# Phase 180: City of Forest Grove Deep-Seed — Research

**Researched:** 2026-07-03
**Domain:** Oregon municipal deep-seed — council-manager city, Mayor + 6 Councilors, ALL at-large, no wards, no numbered positions
**Confidence:** HIGH (form of government, roster, geo_id, migration counter: all VERIFIED direct from forestgrove-or.gov, live production DB, and on-disk migration listing). **geo_id 4126200 is CONFIRMED CORRECT** — the first of the three remaining WashCo cities (180/181/182) to match the ROADMAP-stated value on the first check (Hillsboro and Tualatin were both wrong). **Headshot sourcing is the one genuinely thin area**: forestgrove-or.gov has NO WAF block for text/HTML content, but its Council bio page and Staff Directory embed photos via a JavaScript/AJAX-loaded widget that a plain `curl`/static fetch cannot retrieve — a different failure mode than a WAF 403, requiring the D-16 fallback chain or a JS-capable fetch at execution.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Form of government & council routing — VERIFY AT PLAN TIME (directive, carried forward)**
- **D-01:** Forest Grove's council structure is NOT assumed from memory. Forest Grove is commonly described as council-manager with a Mayor + 6 councilors elected at-large — but the routing branch is decided by the charter/municipal code ground-truthed from forestgrove-or.gov at plan time.
- **D-02:** Tie-breaker rule: WHO VOTES decides routing, not residency. If ward/district voters alone elect their councilors: load custom X00xx ward geofences BEFORE seeding (official GIS only; no authoritative machine-readable file = blocker to surface, not a license to hand-trace). If the whole city votes for all seats: no new geofences — model at-large on the verified city geo_id, exactly like Beaverton/Tigard/Tualatin.
- **D-03:** If ward branch: one district per ward, offices attached to it. Seat identity lives on the office title, NOT on duplicate district rows.
- **D-04:** Either branch must produce no section-split and no empty LOCAL section.

**Mayor & leadership modeling — VERIFY AT PLAN TIME (directive, carried forward)**
- **D-05:** Mayor's role ground-truthed from the charter at plan time. If directly-elected citywide: the Beaverton 176/Tualatin 179 shape — LOCAL_EXEC district (Mayor) + LOCAL at-large district (councilors), both on the city geo_id, both `state='or'`; Mayor sorts first (groupHierarchy.js). If council-member/rotating president: seat-with-title on the council, no LOCAL_EXEC.
- **D-06:** Council President / Vice Mayor = title-on-seat if one exists — no separate office row.

**Roster & body name — strict ground-truth (carried forward)**
- **D-07:** Researcher pulls the seated roster + exact chamber/body name verbatim from forestgrove-or.gov at plan time. No hardcoding names, seat count, or position naming from memory — account for 2024 turnover. Researcher also notes WAF status so the executor isn't surprised.

**Stance scope + headshots (carried forward, locked)**
- **D-08:** All live compass topics per official, one agent at a time, evidence-only / 100% cited / honest blank spokes / zero default values; 18–21+ depth where the record supports it; skip judicial-* topics. Stance agents author their own migration files directly.
- **D-09:** Headshots from forestgrove-or.gov first; Ballotpedia/Wikimedia for genuine gaps. Crop-to-4:5 then resize to 600×750 (Lanczos q90, no overlays), mirrored to Storage `politician_photos/{uuid}-headshot.jpg`; `photo_license` set at execution by actual source. Genuine gaps documented, no fabrication.

**Community banner (carried forward)**
- **D-10:** Executor picks the best legally-licensed wide shot (see D-15 for the Forest Grove priority hint). Wikimedia Commons first, Unsplash fallback; NO AI-generated images; no baked-in text/graphics. Follow `docs/banner-asset-pipeline.md` (`process_banner.py` → 1700×540 @ 3.15:1 → `upload_banner.py` → `cities/forest-grove.jpg`) + `CURATED_LOCAL` entry with attribution.
- **D-11:** Banner asset work lives in the final surfacing plan. `offices.representing_city='Forest Grove'` is set in the structural migration (inline, no backfill).

**Surfacing (locked)**
- **D-12:** Add Forest Grove to the Oregon block of `COVERAGE_STATES`: `{ label: 'Forest Grove', browseGovernmentList: ['4126200'], browseStateAbbrev: 'OR', hasContext: true }` — alphabetical among Oregon cities.
- **D-13:** Live browse link at completion: `essentials.empowered.vote/results?browse_geo_id=4126200&browse_mtfcc=G4110`.

**Forest Grove-specific decisions (resolved this discussion — recommended defaults, user AFK)**
- **D-14:** Both 179-REVIEW template fixes LOCKED into this phase's artifacts:
  - **WR-01:** headshot pipeline script MUST exit non-zero when any upload fails.
  - **WR-02:** structural migration's `ON CONFLICT (external_id) DO UPDATE` path gets an in-file identity gate in the structural post-verify (assert seated names match the researched roster).
- **D-15:** Banner subject priority hint — Pacific University campus / Old College Hall (signature landmark; oldest university building west of the Mississippi), with historic downtown/Main Street or wine-country horizon as alternates. Clean license + crops-well-to-1700×540 beats subject preference.
- **D-16:** Headshot fallback chain is a STANDING RULE for 180–182 — city site → Ballotpedia/Wikimedia → local-news/community-paper photos pre-authorized as a documented last resort for genuine gaps. License verified per source; `photo_license` set accordingly; never fabricate.
- **D-17:** Non-voting/ex-officio seats EXCLUDED from the roster. Vacant seats: seed the office row only if milestone precedent supports it — otherwise document the vacancy; never seed a placeholder person. Very recent appointees count as seated if confirmed on the official city site.

### Claude's Discretion
- Council office title labeling — planner picks after seeing the official roster page.
- External_id block — Wave-0 DB probe picks an unused OR range (geo_id-derived block is the natural analog).
- Next migration number — memory says next on-disk = 1178 post-Tualatin; Wave-0 confirms on-disk MAX.
- Custom `X00xx` mtfcc + district_type — only if the D-02 ward branch fires; Wave-0 finds next unused code.

### Deferred Ideas (OUT OF SCOPE)
- Remaining west-metro cities (Sherwood 181, Cornelius 182), school boards incl. Forest Grove SD 15 (184), 2026 elections + discovery (185) — already scoped as their own phases.
- Forest Grove appointed boards/commissions, city-manager staff, and any non-voting/ex-officio dais seats (D-17) — not elected officials; out of scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WASH-06 | City of Forest Grove deep-seeded — government + roster + headshots + evidence-only stances. | Fully resolved: **geo_id 4126200 CONFIRMED CORRECT** (verified live against production `essentials.geofence_boundaries` — no correction needed, unlike Hillsboro/Tualatin); pure at-large council-manager form confirmed directly from forestgrove-or.gov's own Elections page ("The Council consists of a Mayor and six Councilors each elected at large for four-year terms"); Mayor directly elected citywide (Beaverton/Tualatin shape, LOCAL_EXEC + LOCAL); plain `'Mayor'`/`'Councilor'` titles (Tigard convention — NO numbered positions, NO wards); 7-member roster identified with exact names/election histories/term-end dates, zero vacant seats, zero currently-appointed seats (Valenzuela's 2020 appointment was superseded by the Nov 2022 election, same treatment class as Tualatin's Pratt); Council President Mariana Valenzuela confirmed via the city's own stipend table (title-on-seat, no separate office row); City Attorney/Municipal Court Judge assumed appointed (consistent with every other OR council-manager city in this milestone — flagged as an assumption, not FG-specific primary-source-confirmed); Mayor's Youth Advisory Council (MYAC) confirmed to be a standalone 20-member student advisory body, NOT a City Council dais seat (D-17 satisfied — nothing to exclude); headshot sourcing is a genuine gap requiring the D-16 fallback chain (forestgrove-or.gov's bio/directory pages are NO-WAF for text but load photos via an AJAX widget not retrievable by static fetch); two Wikimedia Commons banner candidates found matching D-15's exact hint (Old College Hall) and its downtown-Main-Street alternate, both by the same photographer credited on Tigard's and Tualatin's banners. |
</phase_requirements>

---

## Summary

Forest Grove operates under a **council-manager form of government** with a City Council of **7 members: a Mayor plus 6 Councilors, ALL elected at-large citywide for four-year terms** — no wards, no numbered positions, no residency-based seat differentiation of any kind. [VERIFIED: direct `curl` fetch of `https://www.forestgrove-or.gov/362/Elections`, HTTP 200, no WAF — primary-source city text] The city's own Elections page states, in the context of a stipend table: *"...all powers of the City are vested in the Council. The Council consists of a Mayor and six Councilors each elected at large for four-year terms."* A second primary source (the Meet the Council page) independently confirms: *"Forest Grove City Council is comprised of a Mayor and six Councilor positions. Our Mayor presides over Council meetings. All Council members are elected for four-year terms of office through a general election, except when a position is vacated before term completion and filled by special appointment of the Council."* This is structurally identical to **Tigard (Phase 178)** — plain `'Mayor'`/`'Councilor'` titles, no ward or numbered-position language anywhere — and closer to Tigard than to Beaverton/Hillsboro's numbered/ward conventions. **No custom X00xx geofences are needed or appropriate.**

**geo_id CONFIRMED CORRECT — no correction needed.** [VERIFIED: live query against production `essentials.geofence_boundaries`, 2026-07-03] `SELECT geo_id, mtfcc, state, name, source FROM essentials.geofence_boundaries WHERE geo_id='4126200'` returns exactly one row: **`4126200`, mtfcc `G4110`, state `41`, name `Forest Grove city`, source `census_tiger_2024`**. This is the first of the three remaining WashCo cities (Forest Grove 180, Sherwood 181, Cornelius 182) to match the ROADMAP-stated value on the first check — Hillsboro (177) and Tualatin (179) both required a correction. A companion row exists for the school district: `4105160`, G5420, "Forest Grove School District 15" (loaded by Phase 174, relevant to the future Phase 184, not a collision risk here).

**Mayor Malynda Wenzl** is directly elected citywide (not a rotating council-member title): first elected to Council in 2014, elected **Mayor** in November 2022 (term through Dec 31, 2026 — one of four seats up for election Nov 3, 2026 per the city's own Elections page). Model as the **Beaverton/Tualatin shape**: one LOCAL_EXEC district (Mayor) + one shared LOCAL district (all 6 Councilors), both on geo_id `4126200`, both `state='or'`.

**Zero currently-appointed or vacant seats.** All 7 seats are presently held by election. Councilor Mariana Valenzuela was originally *appointed* in 2020 to fill a vacancy, but was subsequently elected in Nov 2022 — her CURRENT term is by election, exactly the same treatment class as Tualatin's Valerie Pratt (`is_appointed=false` is correct for her present seating, not the Tigard-style `is_appointed=true` treatment).

**Council President Mariana Valenzuela** holds the title — confirmed via the city's own compensation table on the Elections page, which lists a distinct monthly stipend for "Council President" ($792) separate from "Mayor" ($1,000) and "Councilors" ($667). This is the same title-on-seat treatment as Hillsboro's Rob Harris, Tigard's Maureen Wolf, and Tualatin's Valerie Pratt — no separate office row.

**7-member roster** (all confirmed live from forestgrove-or.gov's "Meet the Council" bio page, cross-checked against the Elections page's 2026-candidate list and a 2024-election news account for internal consistency — no discrepancies found):

| Seat | Name | Election History | Current Term |
|------|------|-------------------|---------------|
| Mayor | Malynda Wenzl | Elected to Council 2014; elected Mayor Nov 2022 | Through Dec 2026 (up Nov 2026) |
| Councilor | Michael ("Mike") Marshall | Elected Nov 2022 | Through Dec 2026 (up Nov 2026) |
| Councilor | Karen Martinez | Elected Nov 2022 | Through Dec 2026 (up Nov 2026) |
| Councilor (Council President) | Mariana Valenzuela | Appointed 2020; elected Nov 2022 | Through Dec 2026 (up Nov 2026) |
| Councilor | Donna Gustafson | Elected Nov 2020; reelected Nov 2024 | Through Dec 2028 |
| Councilor | Angel (Angelene) Falconer | Elected Nov 2024 (first Forest Grove term) | Through Dec 2028 |
| Councilor | Brian Schimmel | Elected Nov 2024 (narrowly, see pitfall below) | Through Dec 2028 |

**⚠ CRITICAL PITFALL FOUND — do not misattribute Falconer's bio history to Forest Grove.** Her official Forest Grove bio text reads: *"Angel's commitment to public service began in Milwaukie, where she was first elected to the city council in 2016. During her tenure, she served as council president and was re-elected to the council in 2020."* **"Milwaukie" is a DIFFERENT Oregon city** (a Portland-metro suburb, not Forest Grove or Milwaukee, Wisconsin). Falconer moved to Forest Grove in 2022 and is explicitly described elsewhere on the same page as *"a newly elected city councilor"* — her Forest Grove seat is her Nov 2024 election, corroborated by a Forest Grove News-Times headline: *"Election 2024: Gustafson, Truax and Falconer lead in early results for Forest Grove City Council."* **Do NOT record a 2016/2020/council-president history for her in the structural migration or in stance research — that entire history belongs to a different council in a different city.**

**Extremely close 2024 race, third seat.** [CITED: WebSearch aggregation of Forest Grove News-Times coverage] Early results for the three 2024 seats showed Gustafson 19.8%, Peter Truax 19.21%, Falconer 19.21%, **Schimmel 19.18%**, Jordan Miller 13.8%, Wolanda Groombridge 12.22% — an extremely tight margin between Truax and Schimmel. The city's own current "Meet the Council" roster confirms **Schimmel**, not Truax, holds the third 2024 seat — the certified final count evidently favored Schimmel narrowly. This is 2024-election history, useful only to confirm Schimmel's seating is correct and stable — not a 2026-election matter.

**forestgrove-or.gov has NO WAF block for HTML/text content** — every page tested in this session (`/611/Meet-the-Council`, `/362/Elections`, `/27/Government`, `/365/City-Council`, `/directory.aspx?EID=58`) returned direct HTTP 200 via plain `curl`, with or without a Chrome User-Agent. This is the best text-sourcing situation in the milestone alongside Tualatin. **However, headshot images are a genuine, different problem**: the Meet the Council bio page and the individual Staff Directory pages (CivicPlus `CityDirectory`/`StaffDirectory` widgets) reference a photo slot in their markup but the actual `<img>` source is populated by client-side JavaScript/AJAX that a static `curl` fetch does not execute — **zero headshot image URLs were recoverable from the raw HTML in this session**, despite the pages themselves loading cleanly. This is a materially different failure mode than Beaverton/Hillsboro/Tigard's Akamai WAF-403 (which blocks the whole page) — here the *text* is fully open but the *photos* require either a JS-capable fetch (e.g., a headless-browser tool) or the D-16 fallback chain. **Recommend the executor first attempt a JS-rendering fetch of `forestgrove-or.gov/directory.aspx?EID=<n>` for each of the 7 officials (Playwright or equivalent, if available in the execution environment) before falling back to Ballotpedia/Wikimedia/local news** — the photos plausibly exist in the CMS and are simply not curl-visible, unlike a genuine absence.

**Mayor's Youth Advisory Council (MYAC)** is confirmed to be a standalone 20-member student advisory body (composed of 8th–12th graders, itself with voting members within its own structure) — **not** a seat on the City Council dais. [CITED: WebSearch aggregation of forestgrove-or.gov's "Mayor's Youth Advisory Commission" page and Resolution 2022-06] This is structurally identical to Tualatin's Youth Advisory Council (a separate board), not Tigard's Youth Councilor (a non-voting seat directly on Council). **D-17 finding: there is no non-voting seat on the Forest Grove council dais to exclude — the roster is cleanly 7 members, no judgment call required.**

**Primary recommendation:** Seed as pure at-large with plain titles — Tigard's exact structural shape (the closest analog: no ward/position differentiation, no current appointments) — single 'City Council' chamber (`official_count=7`). Government name `'City of Forest Grove, Oregon, US'`. geo_id `4126200` (confirmed correct). Ext_id block **-4126201..-4126207** (7 slots, confirmed unused). Next structural migration **1178** (on-disk MAX confirmed 1177 as of this research session — the Tualatin stance migrations 1171–1177; ledger MAX is 1169, Tualatin's structural migration — both independently re-confirmed live, matching this milestone's memory expectation exactly). Community banner: two strong Wikimedia Commons candidates matching D-15's hints — Old College Hall (Pacific University) and Downtown Forest Grove — both need a compositional judgment call at execution given their un-panoramic native aspect ratios.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| City government row | Database / Storage | — | Structural migration inserts into essentials.governments |
| Chamber row | Database / Storage | — | Single 'City Council' chamber, official_count=7 |
| Mayor office (LOCAL_EXEC) | Database / Storage | — | Directly-elected citywide, links to LOCAL_EXEC district |
| Council offices (LOCAL, plain titles) | Database / Storage | — | All 6 share one LOCAL district; no ward/position differentiation |
| Official headshots (600×750) | Database / Storage | CDN | politician_images rows + Supabase Storage; requires D-16 fallback chain (JS-loaded photos not curl-visible) |
| Compass stances | Database / Storage | — | inform.politician_answers rows, evidence-only |
| Community banner | Database / Storage | CDN | Supabase Storage `cities/forest-grove.jpg`; wired via `buildingImages.js` CURATED_LOCAL |
| Frontend surfacing | Frontend Server (SSR) | CDN | coverage.js Oregon block, purple hasContext chip |
| Address routing | API / Backend | — | PIP query against G4110 geofence (geo_id 4126200 — confirmed correct), no ward layer |

---

## geo_id Verification (CONFIRMED CORRECT — no correction needed)

[VERIFIED: live query against production `essentials.geofence_boundaries`, 2026-07-03]

```sql
SELECT geo_id, mtfcc, state, name, source FROM essentials.geofence_boundaries WHERE geo_id='4126200';
--  geo_id  | mtfcc | state |       name        |      source
-- ---------+-------+-------+--------------------+-------------------
--  4126200 | G4110 | 41    | Forest Grove city  | census_tiger_2024
-- (1 row)

SELECT geo_id, mtfcc, state, name, source FROM essentials.geofence_boundaries WHERE name ILIKE '%forest grove%';
--  geo_id  | mtfcc | state |              name                | source
-- ---------+-------+-------+-----------------------------------+------------------------------
--  4105160 | G5420 | 41    | Forest Grove School District 15   | tiger_unsd_or_2024_westmetro
--  4126200 | G4110 | 41    | Forest Grove city                 | census_tiger_2024
```

**No correction needed.** Unlike Hillsboro (4133850→4134100) and Tualatin (4175200→4174950), the ROADMAP/CONTEXT-stated geo_id `4126200` for Forest Grove is the exact, correct, and sole G4110 row. The other "Forest Grove"-named row (`4105160`, G5420, school district) is a distinct, correct geofence for the future Phase 184 (WSCH-04) — not a collision risk.

```sql
SELECT COUNT(*) FROM essentials.districts WHERE geo_id='4126200';                                       -- 0 (greenfield)
SELECT id, name, geo_id FROM essentials.governments WHERE geo_id='4126200' OR name ILIKE '%forest grove%'; -- 0 rows (greenfield)
SELECT external_id, full_name FROM essentials.politicians WHERE external_id BETWEEN -4126210 AND -4126195; -- 0 rows (ext_id block clean)
```

**This phase IS greenfield** for Forest Grove's government/chamber/offices — confirmed no pre-existing rows by geo_id or by name search, and the ext_id block is clean. **Wave-0 must re-run this exact geofence-existence probe as the first step regardless** — standing lesson from Hillsboro/Tualatin (never trust the stated value without a direct check, even when it turns out correct).

---

## Form of Government — RESOLVED (primary-source city text, direct fetch, no WAF)

**DETERMINATION: PURE AT-LARGE, PLAIN TITLES. NO WARDS, NO NUMBERED POSITIONS. DIRECTLY-ELECTED MAYOR. Tigard (178) is the exact structural analog for title convention; Beaverton/Tualatin is the exact analog for the Mayor/Council district split.**

[VERIFIED: `curl https://www.forestgrove-or.gov/362/Elections` — HTTP 200, no WAF, primary-source city text]

> "...all powers of the City are vested in the Council. The Council consists of a Mayor and six Councilors each elected at large for four-year terms. Benefits: Council positions receive a monthly stipend in the amount of $1000 for Mayor; $667 for Councilors; and $792 for Council President."

[VERIFIED: `curl https://www.forestgrove-or.gov/611/Meet-the-Council` — HTTP 200, no WAF; independently confirms the at-large finding]

> "Forest Grove City Council is comprised of a Mayor and six Councilor positions. Our Mayor presides over Council meetings. All Council members are elected for four-year terms of office through a general election, except when a position is vacated before term completion and filled by special appointment of the Council. The Council is governed by the Forest Grove City Charter and adopted Council Rules."

[CITED: WebSearch aggregation of forestgrove-or.gov's Government/City Council pages and the amlegal.com code library index] — City Charter enacted May 19, 2009; Council-Manager form; "The mayor serves as the leader of the governing body and presides over the Council meetings. The mayor is a voting member of the Council and has no veto authority." City Manager serves at the pleasure of the Council and runs daily operations. This is consistent with every other OR council-manager city in the milestone.

**Routing conclusion:** every seat — Mayor and all 6 Councilor seats — is voted on by the entire city. There is no ward-residency requirement of any kind. **No custom X00xx geofences of any kind are appropriate here.** Model exactly as **Beaverton (176) / Tualatin (179)** for the district split (LOCAL_EXEC + LOCAL), but use **Tigard (178)'s plain title convention** (`'Mayor'` / `'Councilor'`, no numbered positions, no ward suffixes) — Forest Grove's own text never uses "Position N" or "Ward" language anywhere found in this session.

**City Attorney / Municipal Court Judge — assumed appointed, not elected.** [ASSUMED — no Forest-Grove-specific primary source was found confirming this in the time available this session; based on the consistent pattern across every other OR council-manager city in this milestone (Beaverton, Hillsboro, Tigard, Tualatin), all of which independently confirmed council-appointed municipal judges] **Recommend Wave-0 do a quick confirming check** (e.g., search `forestgrove-or.gov` for "Municipal Court Judge" appointment language) before finalizing the judicial-* skip — the pattern is very likely to hold, but this specific claim is flagged in the Assumptions Log below rather than treated as independently verified for Forest Grove.

**Mayor's Youth Advisory Council (MYAC) — NOT a council-dais seat; nothing to exclude.** [CITED: WebSearch aggregation of forestgrove-or.gov's "Mayor's Youth Advisory Commission" page (`/600/Mayors-Youth-Advisory-Commission`) and Resolution 2022-06 recognizing MYAC] MYAC is a standalone student advisory body (8th–12th graders, itself composed of ~20 voting *student* members within its own internal structure) that "serve[s] and improve[s] the Forest Grove community... connecting youth to local government" — it is not a seat on the 7-member City Council. **D-17 finding: there is no non-voting seat on the Forest Grove council dais to exclude — the roster is cleanly 7 members.**

---

## Live Roster — Verified 2026-07-03 direct from forestgrove-or.gov (no WAF, primary source)

**Official body name:** `Forest Grove City Council` (formal); chamber name `City Council` follows the milestone convention. Government name: `City of Forest Grove, Oregon, US`.

[VERIFIED: direct `curl` fetch of `https://www.forestgrove-or.gov/611/Meet-the-Council`, HTTP 200, bio text for all 7 members read in full via stripped-HTML text extraction]

| Seat | Name | Election History (Forest Grove only) | Current Term | Notes |
|------|------|----------------------------------------|---------------|-------|
| Mayor | Malynda Wenzl | Elected to Council 2014; elected Mayor Nov 2022 | Jan 2023 – Dec 2026 | Directly-elected citywide, not rotating. First female mayor of Forest Grove. Up for election Nov 3, 2026. |
| Councilor | Michael ("Mike") Marshall | Elected Nov 2022 | Jan 2023 – Dec 2026 | Up for election Nov 3, 2026. |
| Councilor | Karen Martinez | Elected Nov 2022 | Jan 2023 – Dec 2026 | Up for election Nov 3, 2026. |
| Councilor (Council President) | Mariana Valenzuela | Appointed 2020 (vacancy fill); elected Nov 2022 | Jan 2023 – Dec 2026 | Current term is by ELECTION — `is_appointed=false` correct. Holds annually-designated Council President title (title-on-seat, no separate office row). Up for election Nov 3, 2026. |
| Councilor | Donna Gustafson | Elected Nov 2020; reelected Nov 2024 | Jan 2025 – Dec 2028 | Not up in 2026. |
| Councilor | Angel (Angelene) Falconer | Elected Nov 2024 (first FG term) | Jan 2025 – Dec 2028 | **Her bio's "2016/council-president/re-elected 2020" history is about Milwaukie, OR — a different city — do NOT attribute to Forest Grove.** Not up in 2026. |
| Councilor | Brian Schimmel | Elected Nov 2024 (narrow win over Peter Truax) | Jan 2025 – Dec 2028 | Not up in 2026. |

**Total officials to seed: 7 (Mayor + 6 Councilors). `official_count` on chamber = 7. Zero vacancies, zero currently-appointed seats.**

**Independent cross-check (Elections page 2026-candidate list):** [VERIFIED: `curl` of `https://www.forestgrove-or.gov/362/Elections`, HTTP 200] the city's own list of seats up for the Nov 3, 2026 General Election reads exactly: "Mayor Malynda Wenzl, Councilor Mike Marshall, Councilor Karen Martinez, Council President Mariana Valenzuela" — this independently confirms 4 of the 7 seats (all elected Nov 2022, terms expiring Dec 2026) and, by elimination, confirms Gustafson/Falconer/Schimmel are the 3 seats elected Nov 2024 (terms expiring Dec 2028) — fully internally consistent, no discrepancies found. **This is 2026-election information, useful only as a term-date cross-check for this phase — do NOT seed any 2026 candidate as an incumbent; Phase 185 (WashCo 2026 Elections & Discovery) owns that data.**

**Independent cross-check (2024 election, local news):** [CITED: WebSearch aggregation of Forest Grove News-Times coverage, "Election 2024: Gustafson, Truax and Falconer lead in early results for Forest Grove City Council"] Early results for the 3 seats on the Nov 2024 ballot: Gustafson 19.8%, Peter Truax 19.21%, Falconer 19.21%, Schimmel 19.18%, Jordan Miller 13.8%, Wolanda Groombridge 12.22%. The certified final count evidently favored **Schimmel** over Truax for the third seat (extremely close — a shift of a handful of votes) — confirmed by the current official roster showing Schimmel, not Truax, seated. **PLAN-TIME / WAVE-0 VERIFICATION REQUIRED:** re-confirm this narrow outcome is still reflected on the live "Meet the Council" page immediately before finalizing the roster (cheap to do, standard practice, and this is the one seat in the roster with a genuinely close margin worth double-checking).

**Sources:**
- [VERIFIED: `https://www.forestgrove-or.gov/611/Meet-the-Council`, direct curl, HTTP 200] — full bio text for all 7 current members, election history, Council President context clue.
- [VERIFIED: `https://www.forestgrove-or.gov/362/Elections`, direct curl, HTTP 200] — 2026 election-cycle candidate/position list, stipend table (confirms Council President as a distinct title), at-large confirmation language.
- [CITED: WebSearch aggregation of forestgrove-or.gov Government/City Charter pages] — Council-Manager form, Charter enacted 2009, Mayor's non-veto/presiding role.
- [CITED: WebSearch aggregation of Forest Grove News-Times, "Election 2024..." headline and early-results percentages] — 2024 election context, Schimmel/Truax race closeness.

---

## Web Presence / WAF Status

**forestgrove-or.gov has NO WAF block for HTML/text pages — confirmed via direct curl, both with and without a Chrome UA.**

```
$ curl -sI https://www.forestgrove-or.gov/611/Meet-the-Council
HTTP/1.1 200 OK
$ curl -sI https://www.forestgrove-or.gov/362/Elections
HTTP/1.1 200 OK
$ curl -sI https://www.forestgrove-or.gov/directory.aspx?EID=58
HTTP/1.1 200 OK
```

This is the CivicPlus platform (same family of CMS used by several other project cities) — page structure includes widget containers (`CityDirectory`/`StaffDirectory`, `data-moduleWidgetType="cityDirectory"`) whose actual photo `<img src>` is populated client-side. **A raw `curl` fetch of every page tested in this session returned zero headshot image URLs** — the only images found in the raw HTML were site chrome (logo, social-media icons, quick-link icons at documentIDs 27/40/41/43/48/49/52/61/62/64/73/78–85) — **none of these are headshots.** This is a **different problem than a WAF block**: the text content (bios, election data, charter references) is fully open and reliable, but the photos require either (a) a JS-capable fetch (headless browser) to execute the widget's AJAX call, or (b) the D-16 fallback chain.

| Purpose | Live URL | Status |
|---------|----------|--------|
| Council roster + bios | `https://www.forestgrove-or.gov/611/Meet-the-Council` | HTTP 200, text only — no headshots recoverable via curl |
| Elections / stipends / term dates | `https://www.forestgrove-or.gov/362/Elections` | HTTP 200 |
| Government overview | `https://www.forestgrove-or.gov/27/Government` | HTTP 200 |
| City Council landing | `https://www.forestgrove-or.gov/365/City-Council` | HTTP 200 |
| Staff Directory (per-person) | `https://www.forestgrove-or.gov/directory.aspx?EID=<n>` (Wenzl = EID 58) | HTTP 200, text only — no headshot recoverable via curl |
| Boards & Commissions | `https://www.forestgrove-or.gov/352/Boards-and-Commissions` | Found via WebSearch, not independently fetched this session |
| Agenda Center (for stance evidence) | `https://www.forestgrove-or.gov/AgendaCenter` | HTTP 200 — usable for council-vote stance evidence at execution |
| City Charter (old CMS path) | `https://www.forestgrove-or.gov/citycouncil/page/city-charter` | **HTTP 404 — stale path, do not use** |
| Charter mirror (Cloudflare-protected) | `https://codelibrary.amlegal.com/codes/forestgrove/...` | **Cloudflare JS challenge ("Just a moment...") — not fetchable via plain curl; if exact charter clause text is needed, a JS-capable fetch or manual browser visit is required** |

**Practical consequence for Wave-0/execution:** roster/governance text sourcing is excellent (best-in-class alongside Tualatin). **Headshot sourcing is the one area requiring extra effort** — recommend the executor first attempt to view `forestgrove-or.gov/directory.aspx?EID=<n>` with a JS-rendering tool (a browser or headless-browser fetch) for each of the 7 officials before invoking the D-16 fallback chain (Ballotpedia — no individual candidate pages were found for these officials in this session; Wikimedia — unlikely for sitting local officials; local news — `forestgrovenewstimes.com` and `newsinthegrove.com` both surfaced as active local outlets covering city council elections and could carry usable photos).

---

## Headshot Sources — GENUINE SOURCING GAP, D-16 FALLBACK CHAIN REQUIRED

[VERIFIED: multiple `curl` fetches this session — zero headshot `<img>` URLs recoverable from raw HTML for any of the 7 officials]

Unlike Tualatin (7/7 confirmed directly, no fallback needed) and closer to Tigard's thinner sourcing situation, **no headshot image URLs could be confirmed downloadable in this research session for any of the 7 Forest Grove officials.** This is NOT evidence that photos don't exist — the Meet the Council and Staff Directory pages clearly reference person-specific slots and the CivicPlus platform conventionally displays a portrait per member — it is evidence that a plain-text fetch tool cannot retrieve them.

**Recommended sourcing order for the executor (per D-16 standing rule, adapted for this phase's specific finding):**
1. **First attempt:** a JS-capable fetch (browser automation / headless browser, if available in the execution environment) of `https://www.forestgrove-or.gov/directory.aspx?EID=<n>` for each official, and/or the rendered `Meet the Council` page — this is the most likely source of an official, high-quality portrait and should be tried before falling to external sources.
2. **Fallback:** Ballotpedia — no individual Ballotpedia candidate pages were found linked from `ballotpedia.org/Forest_Grove,_Oregon` for any of the 7 officials in this session (small-city local elections are not always individually covered by Ballotpedia) — worth a direct per-name Ballotpedia search at execution regardless, since this can change.
3. **Fallback:** Wikimedia Commons — unlikely to carry photos of sitting local officials, but worth a quick per-name check.
4. **Fallback (pre-authorized per D-16):** local news / community-paper photos — `forestgrovenewstimes.com` (Pamplin Media Group, the same publisher family as `tigardlife.com`/`valleytimes.news` used successfully in Phase 178) and `newsinthegrove.com` both actively cover Forest Grove City Council elections and events (State of the City addresses, election results) and are plausible per-official photo sources. Facebook campaign pages are a manual-only last resort, not scriptable, per the Tigard precedent.

**Genuine gaps are an acceptable, honestly-documented outcome** if any of the 7 cannot be sourced through this chain — do not force a low-quality or fabricated substitute. Given the strength of Forest Grove's text sourcing, a full or near-full 7/7 outcome is plausible with the JS-capable-fetch-first approach, but this cannot be guaranteed at research time the way Tualatin's was.

**Photo license:** `press_use` for any official-site or CivicWeb-equivalent source (project convention); verify and record the actual license per source if a local-news or Ballotpedia image is used instead — never assume `press_use` for a source that isn't government-hosted.

---

## Community Banner

Follow `docs/banner-asset-pipeline.md` Stages 1–8, matching the Beaverton/Hillsboro/Tigard/Tualatin precedent in `src/lib/buildingImages.js`.

**Primary candidate family — matches D-15's exact hint (Old College Hall, Pacific University):** [VERIFIED: Wikimedia Commons API `imageinfo` query, 2026-07-03] Three related images, all by the same photographer credited on Tigard's and Tualatin's banners:

| File | Dimensions | License | Notes |
|------|-----------|---------|-------|
| `Old College Hall Pacific University front.JPG` | 2254×1445 | CC BY 3.0 | Full facade view; National Register of Historic Places building |
| `Old College Hall Pacific University back.JPG` | 2028×1465 | CC BY 3.0 | Rear/cupola view |
| `Old College Hall Pacific University side.JPG` | 2204×1448 | CC BY 3.0 | Side/angled view |

All three: uploaded 2009-02-28 by user `Aboutmovies` (M.O. Stevens — same photographer as Tigard's "Downtown Tigard Oregon.JPG" and Tualatin's "Tualatin Commons daytime.JPG"), aspect ratio ≈1.5–1.6:1. **Cropping to the pipeline's 3.15:1 target requires a significant height trim** (e.g., the front.JPG's 1445px height must crop to ≈715px to hit 3.15:1 at its native 2254px width — roughly a 50% vertical crop) — this risks cutting off the building's distinctive cupola or base depending on which of the three angles is chosen. **The executor should view all three images directly before choosing** — this is exactly the kind of compositional judgment call flagged as untested in prior-phase research (Tualatin A8).

**Alternate candidate — matches D-15's downtown/Main Street alternate hint:** [VERIFIED: Wikimedia Commons API, 2026-07-03] `File:Downtown Forest Grove, Oregon.JPG` — **1748×1086**, same photographer (Aboutmovies/M.O. Stevens), 2009, **Public Domain** (`PD-self` — no attribution legally required, though the project convention credits sources anyway), described as "looking west along Pacific Avenue at Main Street." Aspect ratio ≈1.61:1 — also requires a substantial height crop (1086→≈555px at 3.15:1) but is a street-level wide shot that may crop more forgivingly than a building-portrait shot (retains storefronts along the visible street rather than needing to preserve one specific architectural feature).

**Additional candidates found but not deeply vetted (worth a quick look at execution):** a 2020-dated Wikimedia Commons photo series titled "Forest Grove, Oregon (November 2020) - NN.jpg" (multiple numbered images, some explicitly tagged "Forest Grove Downtown Historic District") — license/dimensions not checked in this session; and `File:Forest Theater (Forest Grove, Oregon).jpg` (a single downtown landmark, 2014) — also not vetted. Given time constraints, this research prioritized the D-15-hinted candidates (Old College Hall, downtown Main Street) which were both found with clean licenses and adequate resolution; these additional finds are noted only as a wider search net if the primary candidates don't crop well.

**Recommendation:** Try "Old College Hall Pacific University front.JPG" first (matches D-15's top-priority hint exactly, clean CC BY 3.0 license, highest resolution of the three angles). If the crop to 3.15:1 loses too much of the building's identity, fall back to "Downtown Forest Grove, Oregon.JPG" (Public Domain, street-level wide shot, matches D-15's alternate hint).

- **Storage path:** `cities/forest-grove.jpg` (Stage 5 — standalone-city scheme, matching `beaverton`/`hillsboro`/`tigard`/`tualatin`).
- **Wiring:** Add `'forest-grove': '...supabase.co/.../politician_photos/cities/forest-grove.jpg'` to `CURATED_LOCAL` in `src/lib/buildingImages.js` (verify at execution whether the key should be `'forest-grove'` or `'forestgrove'` — check how `getBuildingImages()`'s substring match against `offices.representing_city.toLowerCase()` would need to match `'forest grove'` with a space; **the hyphenated key `forest-grove` will NOT substring-match `'forest grove'` (with a space)** — use the exact lowercased city string with its actual spacing, i.e. likely `'forest grove'` as the key, not a hyphenated slug. **Verify this against the live `getBuildingImages()` match loop before finalizing the key** — this is a new trap not present in any single-word city name so far in the milestone (Beaverton/Hillsboro/Tigard/Tualatin are all one word).
- **Attribution comment:** e.g. `//   forest grove - Old College Hall, Pacific University (front) | M.O. Stevens (Aboutmovies) | CC BY 3.0` per the existing convention.
- **No AI-generated images** (per `docs/banner-asset-pipeline.md`).

**Verify live per Stage 8:**
```
https://essentials.empowered.vote/results?browse_geo_id=4126200&browse_mtfcc=G4110
```

---

## Migration / Schema Technical Reference

### Next Migration Number

[VERIFIED: `ls C:/EV-Accounts/backend/migrations | sort -n` — 2026-07-03] On-disk MAX is **1177** (`1177_pratt_stances.sql` — the last of Tualatin's stance migrations). **Next available: 1178.** This matches the milestone-memory expectation exactly (no interleaved unrelated migration this time, unlike Tualatin's session which found a stray NC migration at 1168).

[VERIFIED: `SELECT MAX(version::bigint) FROM supabase_migrations.schema_migrations WHERE version ~ '^[0-9]{1,6}$'` = **1169** — Tualatin's structural migration, the only registered migration since Tigard's 1159; all of Tualatin's headshot/stance migrations (1170–1177) correctly remain unregistered.] **Do not use the ledger MAX (1169) as the next number — the true on-disk MAX is 1177.** Standing lesson, re-confirmed again this session: always cross-check both the on-disk `ls` and the ledger `MAX`, never trust one alone.

**Migration split for this phase (following the Tigard/Tualatin shape):**
- `1178_forest_grove_city_council.sql` — structural (registered in schema_migrations); government + chamber + 2 districts (LOCAL_EXEC + LOCAL) + 7 offices, `representing_city='Forest Grove'` set INLINE (no follow-up backfill migration).
- `1179_forest_grove_headshots.sql` — audit-only (NOT registered); expect a partial outcome pending the D-16 fallback chain's success rate.
- `1180_wenzl_stances.sql` through `1186_schimmel_stances.sql` (or similar per-official naming) — 7 stance migrations, audit-only (one per official, NOT registered).

Total: 1 structural + 1 headshots + 7 stance = 9 migrations consumed (1178–1186). **Re-verify the exact starting number at Wave-0 regardless** — the shared counter has already once (Tualatin's session) shown interleaved use by other workstreams.

### Ext_id Block

**Recommended range: -4126201 to -4126207** (7 slots: Mayor + 6 Councilors), derived from geo_id `4126200`.

[VERIFIED: `SELECT external_id FROM essentials.politicians WHERE external_id BETWEEN -4126210 AND -4126195` — 0 rows. Range is clean.]

**Suggested assignment (planner's discretion to reorder):**
| Official | ext_id |
|----------|--------|
| Mayor Malynda Wenzl | -4126201 |
| Councilor Michael Marshall | -4126202 |
| Councilor Karen Martinez | -4126203 |
| Councilor Mariana Valenzuela (Council President) | -4126204 |
| Councilor Donna Gustafson | -4126205 |
| Councilor Angel Falconer | -4126206 |
| Councilor Brian Schimmel | -4126207 |

Wave-0 must re-run the range query to reconfirm it is still clean at execution time.

### Schema Shapes (Tigard mig 1159 is the closest title-convention analog — plain titles, no wards/positions, no current appointments; Beaverton/Tualatin is the closest district-split analog — directly-elected Mayor + shared at-large Council district)

```sql
-- governments: slug GENERATED ALWAYS — NEVER INSERT slug; no unique constraint on geo_id
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'City of Forest Grove, Oregon, US',
       'LOCAL', 'OR', 'Forest Grove', '4126200'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments WHERE name = 'City of Forest Grove, Oregon, US'
);

-- chambers: slug GENERATED ALWAYS — never include in INSERT column list
INSERT INTO essentials.chambers (id, name, name_formal, government_id, official_count)
SELECT gen_random_uuid(), 'City Council', 'Forest Grove City Council',
       (SELECT id FROM essentials.governments WHERE name = 'City of Forest Grove, Oregon, US'),
       7
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers WHERE name = 'City Council'
    AND government_id = (SELECT id FROM essentials.governments
                          WHERE name = 'City of Forest Grove, Oregon, US')
);

-- districts: state='or' LOWERCASE for LOCAL/LOCAL_EXEC; no name_formal column; government_id NULL
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL_EXEC', 'or', '4126200', 'Forest Grove (Mayor, Citywide)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts WHERE geo_id='4126200' AND district_type='LOCAL_EXEC' AND state='or'
);

INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'or', '4126200', 'Forest Grove (At-Large)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts WHERE geo_id='4126200' AND district_type='LOCAL' AND state='or'
);

-- offices: guard on (district_id, politician_id) — NOT EXISTS; representing_city inline
-- representing_state = 'OR' (uppercase); representing_city = 'Forest Grove'
-- title convention (Tigard precedent — plain titles, no positions/wards): 'Mayor' for the LOCAL_EXEC seat,
-- 'Councilor' for each of the 6 LOCAL seats
```

**politician_images schema:** `id, politician_id, url, type, photo_license` — NO `photo_origin_url` column (confirmed absent in every prior-phase research, unchanged).

**Stance schema:** `inform.politician_answers` ON CONFLICT `(politician_id, topic_id)`; topic_id resolved LIVE via `JOIN inform.compass_topics WHERE topic_key='...' AND is_live=true`; value integer 1-5 (chairs model). [VERIFIED: 44 live topics, 8 judicial-* — re-confirmed live in this session, unchanged from Hillsboro/Tigard/Tualatin.]

### Migration Template Fixes to Carry Forward (D-14 — locked, from 179-REVIEW.md)

**WR-01 (non-zero exit on partial headshot upload failure):** the headshot pipeline script (`_tmp-forest-grove-headshots.py`) MUST exit non-zero if any upload fails, not exit 0 on a partial success. This is especially relevant for this phase given the genuine headshot-sourcing gap identified above — a chained automation must not proceed to apply the headshot migration on a silently-partial upload run.

**WR-02 (in-file identity gate in structural post-verify):** the structural migration's post-verify block must assert the seated names match the researched roster — not just rely on the out-of-band Wave-0 Probe D. Example addition to the post-verify `DO $$` block:
```sql
DO $$
DECLARE v_name_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_name_count
  FROM essentials.politicians
  WHERE external_id IN (-4126201,-4126202,-4126203,-4126204,-4126205,-4126206,-4126207)
    AND full_name IN ('Malynda Wenzl','Michael Marshall','Karen Martinez','Mariana Valenzuela',
                       'Donna Gustafson','Angel Falconer','Brian Schimmel');
  IF v_name_count <> 7 THEN
    RAISE EXCEPTION 'Post-verification FAILED: identity gate — expected 7 matching names, found %', v_name_count;
  END IF;
END $$;
```
Also carry forward the standard independent geofence-existence assertion (not a same-transaction dead gate):
```sql
SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE geo_id='4126200' AND mtfcc='G4110'; -- must be >= 1
```

And the stance-migration row-count assertion (WR-02's other half, per Tigard/Tualatin pattern):
```sql
DO $$
DECLARE n INTEGER;
BEGIN
  SELECT COUNT(*) INTO n FROM inform.politician_answers WHERE politician_id = '<uuid>';
  IF n <> <expected_count> THEN
    RAISE EXCEPTION 'Expected % answers, found % — topic_key mismatch dropped rows', <expected_count>, n;
  END IF;
END $$;
```

### Office Title Convention

**Plain titles — follow Tigard's exact convention (NOT Beaverton's numbered positions, NOT Hillsboro's ward+position):** `'Mayor'` for the LOCAL_EXEC seat, `'Councilor'` for each of the 6 LOCAL seats. Forest Grove's own site text uses no "Position N" or "Ward N" language anywhere found in this session — confirmed twice (Meet the Council + Elections pages). Council President Valenzuela keeps the plain `'Councilor'` title with the Council President designation carried only in a migration comment (title-on-seat, no separate office row, no title-string change — this mirrors exactly how Tigard's Maureen Wolf and Tualatin's Valerie Pratt were handled).

### OR Casing Rules (identical to every prior WashCo city — critical, wrong case = silent routing failure)

| Context | Casing | Why |
|---------|--------|-----|
| `governments.state` | `'OR'` (uppercase) | Governments table convention |
| `districts.state` for LOCAL/LOCAL_EXEC | `'or'` (lowercase) | [RE-VERIFIED live this session against the existing OR geofence rows] |
| `offices.representing_state` | `'OR'` (uppercase) | Offices table convention |
| `essentials.politicians.party` | `NULL` | Antipartisan design — never set |

### Live Compass Topics (44 total, is_live=true — re-verified live this session, unchanged from Hillsboro/Tigard/Tualatin)

abortion, ai-regulation, campaign-finance, childcare, city-sanitation, civil-rights, climate-change, data-centers, deportation, economic-development, fossil-fuels, growth-and-development, healthcare, homelessness, homelessness-response, housing, immigration, jail-capacity, judicial-access-to-justice, judicial-bail-pretrial, judicial-criminal-justice, judicial-government-deference, judicial-interpretation, judicial-police-accountability, judicial-prosecution-priorities, judicial-transparency, local-environment, local-immigration, medicare/aid, misinformation, public-safety-approach, redistricting, religious-freedom, rent-regulation, residential-zoning, same-sex-marriage, school-vouchers, social-security, tariffs, taxes, trans-athletes, transportation-priorities, ukraine-support, voting-rights.

**Skip all 8 judicial-* topics** — City Attorney and Municipal Court judges assumed appointed (see Assumptions Log — this specific claim was not FG-primary-source-confirmed in this session, unlike the roster/at-large findings; recommend a fast confirming check at Wave-0).

---

## Stance Evidence Landscape (guidance for the stance plan, not exhaustive research)

**Bio-derived themes (from the Meet the Council page, useful starting points, not stances themselves):**
- **Mayor Wenzl:** homelessness, affordable housing, local economy, balanced growth while retaining "small-town essence," community infrastructure.
- **Councilor Gustafson:** homelessness, affordable housing, economic downturn impacts, opioid epidemic / mental-health/rehab access, City Club community revitalization outreach.
- **Councilor Martinez:** homelessness resolution ("help homeless off the streets... on the road to becoming self-supporting"), drug use and theft concerns, pro-police-funding/public-safety, fiscal accountability/transparency.
- **Councilor Marshall:** community's future, local business-owner perspective (no specific policy stance quoted in the bio itself — thinner starting material).
- **Councilor Schimmel:** "building systems that empower individuals," community-leader/staff unity — largely values-language, thin on specific policy positions in the bio text.
- **Councilor Valenzuela:** youth programs/recreation, homelessness, economic development, community youth resources.
- **Councilor Falconer:** land use and transportation, climate/sustainability, 2040 Visioning project, self-reliant/resilient community — **but her cited "council president" and 2016-era record is from Milwaukie, OR, and must NOT be used as Forest Grove stance evidence.**

**No Forest Grove-specific council vote (e.g., a camping-ban ordinance, a rent-stabilization measure) was found via WebSearch in the time available this session** — a general search for "Forest Grove homelessness camping ban 2025" surfaced only statewide Oregon homelessness-policy coverage, not a Forest Grove-specific vote. **This does not mean no such record exists** — it means the stance-research agents should plan to consult primary sources directly rather than relying on a general web search: the city's own **Agenda Center** (`forestgrove-or.gov/AgendaCenter`, confirmed HTTP 200 in this session) for council meeting minutes/agendas, and the two local outlets found in this session — `forestgrovenewstimes.com` (Pamplin Media Group, same publisher family as Tigard's `tigardlife.com`) and `newsinthegrove.com` — for council-vote reporting.

**Expect a genuinely thinner record than Tualatin's** (which had two independently-fetched primary-source pages with extensive detail) and possibly comparable to or thinner than Tigard's — honest blank spokes are an acceptable and expected outcome per the milestone's evidence-only rule, especially for Marshall and Schimmel whose bios contain almost no specific policy language.

---

## Architecture Patterns

### Closest Analogs: Tigard (Phase 178) for title convention, Beaverton/Tualatin (176/179) for district split

Forest Grove combines Tigard's plain-title, no-appointment structural shape with Beaverton/Tualatin's directly-elected-Mayor district split. No single prior phase is a 100% match — the structural migration should be assembled from Tigard's title/appointment-absence pattern and Beaverton/Tualatin's district shape.

```
City of Forest Grove, Oregon, US (governments)
└── City Council (chambers, official_count=7)
    ├── LOCAL_EXEC district (geo_id=4126200, state='or', mtfcc=NULL)
    │   └── Mayor office → Malynda Wenzl (-4126201, elected Mayor Nov 2022, term through Dec 2026)
    └── LOCAL district (geo_id=4126200, state='or', mtfcc=NULL)
        ├── Councilor → Michael Marshall (-4126202, elected Nov 2022, term through Dec 2026)
        ├── Councilor → Karen Martinez (-4126203, elected Nov 2022, term through Dec 2026)
        ├── Councilor (Council President) → Mariana Valenzuela (-4126204, appointed 2020/elected Nov 2022, term through Dec 2026)
        ├── Councilor → Donna Gustafson (-4126205, elected Nov 2020/reelected Nov 2024, term through Dec 2028)
        ├── Councilor → Angel Falconer (-4126206, elected Nov 2024, term through Dec 2028)
        └── Councilor → Brian Schimmel (-4126207, elected Nov 2024, term through Dec 2028)
```

### System Architecture Diagram

```
Forest Grove resident address
        |
        v
  Backend /representatives/me
        |
  PIP query against geofence_boundaries
        |
  ┌─────────────────────────────────────────┐
  │  G4110 city boundary (geo_id=4126200)   │   <-- CONFIRMED correct geo_id
  │  → LOCAL_EXEC district (Mayor)          │
  │  → LOCAL district (all 6 Councilors)    │
  └─────────────────────────────────────────┘
        |
        v
  7 officials returned
  (Mayor first via groupHierarchy.js)
        |
        v
  frontend PoliticianCard render
  (600x750 headshot [pending D-16 chain] + compass stances + Local-section banner)
```

### Anti-Patterns to Avoid

- **Do NOT attribute Angel Falconer's Milwaukie, OR history (2016 election, council president, 2020 re-election) to Forest Grove** — this is the single highest-risk misread found in this research; her Forest Grove seat is Nov 2024, first term.
- **Do NOT invent numbered positions or wards** — Forest Grove uses plain `'Mayor'`/`'Councilor'` titles exclusively; confirmed twice from primary-source city text.
- **Do NOT mark Valenzuela as currently appointed** — her 2020 appointment was superseded by the Nov 2022 election; `is_appointed=false` is correct for her present seating (same treatment as Tualatin's Pratt).
- **Do NOT seed Peter Truax** — he lost the extremely close 2024 race to Brian Schimmel; the current official roster shows Schimmel seated.
- **Do NOT seed a Youth Councilor or MYAC seat as an 8th office** — MYAC is a standalone advisory board, not a Council dais seat.
- **Do NOT treat the absence of curl-visible headshot URLs as a genuine sourcing gap without first trying a JS-capable fetch** — this is a different problem than Tigard's genuine no-bulk-portal gap; the CivicPlus widget likely has real photos behind client-side JS.
- **Do NOT use a hyphenated `forest-grove` key in `buildingImages.js` CURATED_LOCAL without verifying the match-loop logic** — the city name has an internal space ("Forest Grove"), unlike every single-word city banner key so far in this milestone; verify the exact key format against the live `getBuildingImages()` substring-match code before finalizing.
- **Do NOT store or surface party affiliation** — antipartisan design forbids this regardless of source prominence.
- **Do NOT seed any 2026 election candidate as an incumbent** — Phase 185 owns that data.
- **Do NOT insert `slug`** on chambers — GENERATED ALWAYS (migration will fail).
- **Do NOT use `photo_origin_url`** in politician_images INSERT — column does not exist.
- **Do NOT default stance values** — blank spoke is correct when no evidence found.
- **Do NOT use ON CONFLICT on districts** — no unique constraint; use WHERE NOT EXISTS.
- **Do NOT use the ledger MAX (1169) as the next migration number** — the true on-disk MAX is 1177; next is 1178.
- **Do NOT skip the D-14 WR-01/WR-02 fixes** — apply both to this phase's structural and headshot migrations, same as Tualatin.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Headshot resize | Custom PIL script | Existing `_tmp-*-headshots.py` pipeline (e.g. `_tmp-tualatin-headshots.py` as the most recent template) | Phases 159-179 all reuse the same crop-4:5→600x750 Lanczos pattern |
| Stance research | Parallel agents | One agent at a time | Rate-limit rule — parallel burns quota with no usable output |
| Geofence load | Custom boundary ingest | None needed | At-large — city G4110 (4126200, confirmed correct) already loaded |
| groupHierarchy ordering | Custom sort | groupHierarchy.js Mayor-first rule | Already handles LOCAL_EXEC-first ordering |
| Banner processing | Custom crop/resize script | `scripts/banners/process_banner.py` + `upload_banner.py` | Already built, proven on Beaverton/Hillsboro/Tigard/Tualatin/50 states |
| JS-rendered content fetch | Custom headless-browser script from scratch | Check for an existing project browser-automation tool (e.g. a Playwright MCP tool, if available in the execution environment) before writing a new one | Avoid reinventing JS-rendering infrastructure for a one-off headshot pull |
| geo_id trust | Trusting the phase description's stated geo_id at face value | Always run the geofence-existence probe FIRST | This time it was correct — but 2 of 5 prior WashCo cities had it wrong; the probe habit must not lapse just because it passed |

---

## Common Pitfalls

### Pitfall 1: Attributing Angel Falconer's Milwaukie, OR record to Forest Grove
**What goes wrong:** A stance-research agent or the structural migration author reads Falconer's bio, sees "first elected to the city council in 2016... served as council president... re-elected... in 2020," and records this as Forest Grove history or election data.
**Why it happens:** The bio text describes her pre-Forest-Grove career in a different Oregon city (Milwaukie) in the same paragraph as her Forest Grove candidacy, with no clear typographic separation.
**How to avoid:** Read the full sentence: "Angel's commitment to public service began in **Milwaukie**, where she was first elected..." — Milwaukie is a distinct Portland-metro city. Her Forest Grove seat begins with her Nov 2024 election (she moved to Forest Grove in 2022, per the same bio, and is described elsewhere on the page as "a newly elected city councilor").
**Warning signs:** Any pre-2022 Forest-Grove-attributed vote or council action for Falconer should trigger a re-read of the source bio paragraph in full.

### Pitfall 2: Seeding Peter Truax instead of (or in addition to) Brian Schimmel
**What goes wrong:** An early-results news snippet ("Gustafson, Truax and Falconer lead in early results") is taken as the final outcome, seeding Truax as the third 2024 winner.
**Why it happens:** Early/live election results (19.21% Truax vs. 19.18% Schimmel) show Truax narrowly ahead; the final certified count evidently flipped this by a small margin.
**How to avoid:** Trust the CURRENT official "Meet the Council" roster (which lists Schimmel, not Truax) over any "early results" news snippet — this research explicitly cross-checked and confirms Schimmel is the seated official.
**Warning signs:** Any stance/headshot research surfacing "Truax" as a current Forest Grove councilor should be treated as stale pre-certification data.

### Pitfall 3: Treating the lack of curl-visible headshots as a hard "no photo exists" finding
**What goes wrong:** The headshot pipeline script is written assuming zero sources exist and immediately falls back to Ballotpedia/local-news without attempting to retrieve the likely-present CMS photo.
**Why it happens:** A static `curl` fetch genuinely returns no headshot URLs, which superficially resembles Tigard's genuine no-bulk-portal gap.
**How to avoid:** Recognize this is a JS-rendering limitation, not a content-absence finding — the CivicPlus `CityDirectory`/`StaffDirectory` widget markup clearly reserves a photo slot per person. Attempt a JS-capable fetch first (per the Headshot Sources section above) before invoking the D-16 external fallback chain.
**Warning signs:** A 0/7 headshot outcome without first attempting a rendered-page fetch should be treated as premature, not final.

### Pitfall 4: Using a hyphenated `forest-grove` CURATED_LOCAL key that never matches
**What goes wrong:** The banner never renders (falls back to the tier gradient) because `getBuildingImages()`'s substring match against the lowercased `representing_city` value (`'forest grove'`, with a space) never matches a hyphenated key (`'forest-grove'`).
**Why it happens:** Every prior WashCo city banner key (`beaverton`, `hillsboro`, `tigard`, `tualatin`) is a single word, so this class of bug hasn't occurred yet in this milestone.
**How to avoid:** Read `src/lib/buildingImages.js`'s exact match-loop logic live at execution before choosing the key — likely needs the literal string `'forest grove'` (with a space, matching `representing_city.toLowerCase()`) rather than a slugified variant.
**Warning signs:** Live browse shows the tier-gradient fallback instead of the uploaded banner despite a successful upload and a seemingly-correct `representing_city='Forest Grove'` value.

### Pitfall 5: districts.state uppercase 'OR' for LOCAL districts
**What goes wrong:** Routing fails silently — address lookup returns no city-level officials.
**How to avoid:** All LOCAL/LOCAL_EXEC districts in Oregon use `state='or'` (lowercase), consistent across every prior WashCo city.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | geo_id 4126200 is the correct, sole G4110 row for the City of Forest Grove | geo_id Verification | LOW — directly verified against the live production DB via both a direct-value lookup and a name search; exact TIGER name match ("Forest Grove city") |
| A2 | Forest Grove's council is pure at-large with plain titles ('Mayor'/'Councilor'), zero ward/position differentiation, directly-elected Mayor | Form of Government | LOW — directly quoted from two independent primary-source city pages (Meet the Council + Elections) fetched with no WAF obstruction |
| A3 | The 7-member roster (Wenzl, Marshall, Martinez, Valenzuela, Gustafson, Falconer, Schimmel) reflects the CURRENT seated council as of 2026-07-03 | Live Roster | LOW — sourced directly from the official city roster page; independently cross-confirmed by the 2026-election-candidate list (4 of 7 seats) and a 2024-election news account (the other 3) with no discrepancy found |
| A4 | Valenzuela's current term is properly classified as "elected" (not "appointed") given her 2020 appointment was superseded by the Nov 2022 election | Live Roster | LOW-MEDIUM — a judgment call flagged explicitly for planner confirmation, matching the same treatment class already established for Tualatin's Pratt |
| A5 | Angel Falconer's "2016/council-president/2020" history refers to Milwaukie, OR and NOT Forest Grove | Live Roster | LOW — directly stated in her own bio text ("Angel's commitment to public service began in Milwaukie") and corroborated by the "newly elected" framing and 2022 move-to-Forest-Grove date on the same page |
| A6 | Brian Schimmel (not Peter Truax) holds the third 2024-elected seat | Live Roster | LOW-MEDIUM — confirmed by the CURRENT official roster page (primary source, higher trust than an "early results" news snippet), but the underlying race was extremely close and Wave-0 should re-confirm immediately before finalizing |
| A7 | City Attorney and Municipal Court Judge are appointed (council-appointed), not elected, for Forest Grove specifically | Form of Government | MEDIUM — this is the one governance claim in this research that is [ASSUMED] rather than [VERIFIED]/[CITED] for Forest Grove itself; based on a consistent pattern across every other OR council-manager city in the milestone, but not independently confirmed via a Forest-Grove-specific primary source in this session; if wrong, could mean 8 judicial-* topics are wrongly skipped for a Forest Grove official |
| A8 | The Mayor's Youth Advisory Council (MYAC) is a standalone advisory body with no seat on the City Council dais | Form of Government | LOW-MEDIUM — confirmed via WebSearch aggregation of the city's own MYAC page and a recognition resolution, not an independently-fetched primary-source page in this session (unlike the roster/at-large findings) |
| A9 | No Forest Grove-specific headshot image URL is recoverable via a plain static (non-JS) fetch, but the underlying CMS likely has real photos behind client-side JavaScript | Headshot Sources | MEDIUM — directly observed (0 headshot URLs found across multiple page fetches), but the "likely has real photos" half of this claim is an inference from the widget markup, not a confirmed fact; if the CMS genuinely has no photos at all, the D-16 external fallback chain becomes the primary path rather than a backup |
| A10 | Ext_id range -4126201..-4126207 is unused | Migration Reference | LOW — confirmed via live DB query in this session |
| A11 | On-disk migration MAX is 1177 (next=1178) as of this research session | Migration Reference | LOW — directly verified via `ls`, matches the milestone-memory expectation exactly; still subject to the standard re-verification-at-Wave-0 rule given the shared counter |
| A12 | "Old College Hall Pacific University front.JPG" and "Downtown Forest Grove, Oregon.JPG" will crop acceptably to 3.15:1 despite their native ~1.5-1.6:1 aspect ratios | Community Banner | MEDIUM — license and dimensions directly confirmed via the Wikimedia API, but neither image's native aspect ratio is close to panoramic; the compositional judgment (will a ~50% height crop still look good) is genuinely untested until the executor views the actual images |

---

## Open Questions

1. **Whether forestgrove-or.gov's photo widgets are retrievable via a JS-capable fetch, and what quality/format the underlying photos are**
   - What we know: the Meet the Council and Staff Directory pages reserve a photo slot per official in their markup (`CityDirectory`/`StaffDirectory` widget), but a static curl fetch returns none.
   - What's unclear: whether a rendered-page fetch (browser automation) would recover real, usable headshots, and if so at what resolution.
   - Recommendation: attempt a JS-capable fetch at Wave-0/execution before falling to the external D-16 fallback chain — check whether a browser-automation tool (e.g., a Playwright MCP tool) is available in the execution environment.

2. **Whether City Attorney / Municipal Court Judge are confirmed appointed for Forest Grove specifically**
   - What we know: every other OR council-manager city in this milestone has confirmed this pattern; Forest Grove almost certainly follows it given the identical Council-Manager charter structure.
   - What's unclear: no Forest-Grove-specific primary source was fetched confirming this in the time available this session.
   - Recommendation: a fast confirming WebSearch/site-search at Wave-0 (low cost, low risk given the strong cross-city pattern) before finalizing the judicial-* topic skip.

3. **Exact charter section numbers for Mayor's role / Council President designation (if wanted for migration comments)**
   - What we know: the plain-English city-page text (Elections + Meet the Council) unambiguously answers the D-01/D-02/D-05/D-06 routing questions without needing literal charter section numbers.
   - What's unclear: the amlegal.com code library mirror is Cloudflare-JS-protected and not fetchable via plain curl in this session.
   - Recommendation: low priority — does not change any structural conclusion; skip unless migration-comment completeness is specifically desired.

4. **Whether any council roster change occurred between this research session (2026-07-03) and plan/execution time, especially re-confirming the close Schimmel/Truax outcome**
   - What we know: no resignation, appointment, or Council President re-designation was found in this session.
   - What's unclear: whether any change occurs between now and execution.
   - Recommendation: Wave-0 should re-fetch `forestgrove-or.gov/611/Meet-the-Council` fresh immediately before finalizing the roster — cheap to do given the direct, no-WAF access.

---

## Environment Availability

No new external tools strictly required beyond the existing project infrastructure — however, a JS-capable fetch tool (e.g., a headless-browser/Playwright MCP tool) would materially improve the headshot-sourcing outcome for this phase if available in the execution environment. No new geofences to load (city geo_id `4126200` already present from the v8.0 OR TIGER load, confirmed correct this session).

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL / psql | Migration apply | Yes (via EV-Accounts .env, verified live this session) | PostgreSQL 18.1 client | — |
| forestgrove-or.gov | Roster + Governance text | **YES — no WAF, direct HTTP 200 confirmed this session** | CivicPlus CMS | Not needed for text |
| forestgrove-or.gov headshot photos | Headshots | **Text pages yes; photo widget NOT curl-retrievable** | CivicPlus `CityDirectory` widget (JS/AJAX) | D-16 fallback chain (Ballotpedia/Wikimedia/local news) or a JS-capable fetch tool |
| JS-capable fetch / headless browser | Headshot retrieval (recommended, not confirmed available) | **UNKNOWN — not tested in this research session** | — | Fall back to D-16 external chain if unavailable |
| Wikimedia Commons | Community banner source | Yes — 4 strong candidates found (3 Old College Hall angles + 1 downtown Public Domain shot), all license-confirmed | — | Unsplash fallback per pipeline doc |
| Python 3 + Pillow + requests | Headshot resize pipeline | Yes (existing `_tmp-*-headshots.py` pattern) | — | — |
| scripts/banners/process_banner.py + upload_banner.py | Community banner | Yes (proven on Beaverton/Hillsboro/Tigard/Tualatin/50 states) | — | — |

**Missing dependencies with no fallback:** none — the JS-capable fetch tool is a "nice to have" for headshot quality, not a blocker (D-16's external chain is the guaranteed fallback).

**Missing dependencies with fallback:** JS-capable fetch for headshots (fallback = D-16 chain: Ballotpedia/Wikimedia/local news).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | SQL verification queries (inline psql, no test runner) |
| Config file | None — inline verification gates in plan |
| Quick run command | `psql $DATABASE_URL -c "SELECT COUNT(*) FROM essentials.offices o JOIN essentials.politicians p ON o.politician_id=p.id JOIN essentials.chambers ch ON o.chamber_id=ch.id WHERE ch.name='City Council' AND ch.government_id=(SELECT id FROM essentials.governments WHERE name='City of Forest Grove, Oregon, US')"` |
| Full suite command | 9-check E2E gate (see below), extended with a banner-render check |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WASH-06 | Correct geo_id used (4126200, confirmed) | SQL count | `SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE geo_id='4126200' AND mtfcc='G4110'` = 1 | Wave-0 inline — MUST run before any other probe |
| WASH-06 | 7 officials seeded with offices | SQL count | `SELECT COUNT(*)... = 7` | Wave-0 inline |
| WASH-06 | Mayor sorts first in display | SQL + live browse | `groupHierarchy.js` + human verify | Existing code |
| WASH-06 | Headshots at 600×750 in Storage | SQL count + CDN HTTP 200 | `SELECT COUNT(*) FROM essentials.politician_images WHERE...` | Wave-2 inline; genuine-gap risk flagged — do not hard-assert 7/7 |
| WASH-06 | Evidence-only stances render | SQL count + live browse | `SELECT COUNT(*) FROM inform.politician_answers WHERE politician_id=...` | Wave-3 inline |
| WASH-06 | Purple hasContext chip | Browser/live browse | `essentials.empowered.vote/results?browse_geo_id=4126200&browse_mtfcc=G4110` | Wave-3 human verify |
| WASH-06 | Community banner renders (not gradient fallback) | Browser/live browse | Same browse URL — Local section shows photo; verify `CURATED_LOCAL` key matches the two-word city name correctly | Wave-3 human verify |
| WASH-06 | Section-split = 0 rows | SQL (canonical query) | Section-split query after seed | Wave-1 inline |
| WASH-06 | No duplicate government row | SQL | `SELECT COUNT(*) FROM essentials.governments WHERE name='City of Forest Grove, Oregon, US'` = 1 | Wave-1 inline |

### 9-Check E2E Verification Gate (Wave-1 structural plan) + Banner Check (Wave-3)

1. `essentials.geofence_boundaries` row exists for geo_id='4126200' AND mtfcc='G4110' — run this FIRST
2. `governments` row count = 1 for name='City of Forest Grove, Oregon, US'
3. `chambers` row exists with name='City Council', official_count=7
4. `districts` rows: exactly 1 LOCAL_EXEC + 1 LOCAL for geo_id='4126200' state='or'
5. `offices` count = 7 for Forest Grove chamber, `representing_city='Forest Grove'` set on all 7 (inline)
6. `politician_images` count for Forest Grove politicians — genuine-gap risk noted; document actual outcome honestly
7. `politician_answers` count ≥ 1 per official (honest blanks OK; 0 for any official = re-check)
8. Section-split query (canonical version) returns 0 rows for geo_id 4126200
9. Human-verify: live browse link shows Mayor first + all 6 councilors, compass stances visible, no party label
10. (Wave-3 banner) Human-verify: Local section banner shows a Forest Grove photo, not the tier gradient fallback (watch specifically for the two-word CURATED_LOCAL key trap)

### Wave 0 Gaps

- [ ] DB probe (run first): confirm geo_id 4126200 has exactly 1 G4110 row (this research found it correct — re-verify regardless)
- [ ] DB probe: confirm no existing government/chamber rows for Forest Grove (name + geo_id)
- [ ] DB probe: confirm ext_id range -4126201..-4126207 is unused
- [ ] DB probe / disk `ls`: re-confirm disk migration MAX (this research found 1177 → next 1178)
- [ ] Fresh fetch of `forestgrove-or.gov/611/Meet-the-Council` to re-confirm the 7-member roster is unchanged, especially the close Schimmel/Truax seat
- [ ] Attempt a JS-capable fetch of the Staff Directory / Meet the Council photo widgets for all 7 officials before invoking the D-16 external fallback chain
- [ ] Quick confirming check that City Attorney/Municipal Court Judge are appointed for Forest Grove specifically (currently an assumption, A7)
- [ ] View the Old College Hall (3 angles) and Downtown Forest Grove images directly before finalizing the banner choice — compositional judgment on the 3.15:1 crop was not performed in this research
- [ ] Verify the exact `CURATED_LOCAL` key format needed for a two-word city name (`'forest grove'` vs. `'forest-grove'`) against the live `getBuildingImages()` match-loop code

---

## Sources

### Primary (HIGH confidence)
- `essentials.geofence_boundaries` / `essentials.districts` / `essentials.governments` / `essentials.politicians` live queries (psql, this session) — confirmed geo_id 4126200 is correct and sole; confirmed greenfield status; confirmed clean ext_id range.
- `https://www.forestgrove-or.gov/611/Meet-the-Council` — fetched directly via curl, HTTP 200, no WAF — full roster, bios, election histories, Council President context clue, all confirmed via stripped-HTML text extraction.
- `https://www.forestgrove-or.gov/362/Elections` — fetched directly via curl, HTTP 200 — at-large confirmation language, stipend table (confirms Council President as distinct title), 2026 election-cycle candidate/position list.
- `ls C:/EV-Accounts/backend/migrations | sort -n` — confirmed disk MAX is 1177 as of 2026-07-03.
- `SELECT MAX(version::bigint) FROM supabase_migrations.schema_migrations WHERE version ~ '^[0-9]{1,6}$'` — confirmed ledger MAX is 1169.
- `https://commons.wikimedia.org/w/api.php` (imageinfo query) — confirmed license and dimensions for 3 Old College Hall angles (CC BY 3.0) and 1 Downtown Forest Grove image (Public Domain).
- `inform.compass_topics` live query — confirmed 44 live topics, 8 of which are judicial-*, unchanged from prior phases.
- Tualatin Phase 179 artifacts (179-RESEARCH.md, 179-PATTERNS via 178-PATTERNS.md cross-reference) — WR-01/WR-02 fix precedent, migration-split shape, Wave-0 gate pattern.

### Secondary (MEDIUM confidence)
- WebSearch aggregation of forestgrove-or.gov's Government/City Charter pages — Council-Manager form, Charter enacted 2009, Mayor's non-veto/presiding role; independently corroborated by the two directly-fetched primary sources above.
- WebSearch aggregation of Forest Grove News-Times, "Election 2024: Gustafson, Truax and Falconer lead in early results" — 2024 election context and the close Schimmel/Truax margin; cross-checked against the current official roster (a primary source) for the actual outcome.
- WebSearch aggregation of forestgrove-or.gov's Mayor's Youth Advisory Commission page and Resolution 2022-06 — MYAC's standalone-board status.
- WebSearch aggregation on municipal-judge appointment norms — City Attorney/Municipal Court Judge appointed pattern, not a Forest-Grove-specific primary-source clause (flagged in Assumptions Log, A7).

### Tertiary (LOW confidence)
- `codelibrary.amlegal.com` charter mirror — confirmed to exist (search-indexed section titles like "SECTION 25. MAYOR.") but Cloudflare-JS-protected, not fetchable via plain curl in this session; not relied upon for any load-bearing claim.
- Additional unvetted Wikimedia Commons banner candidates ("Forest Grove, Oregon (November 2020) - NN.jpg" series, "Forest Theater" photo) — found but not license/dimension-checked in this session; noted only as a wider search net.

---

## Metadata

**Confidence breakdown:**
- geo_id verification: HIGH — directly verified against live production DB, confirmed correct on the first check (unlike Hillsboro/Tualatin).
- Form of government (pure at-large, plain titles, directly-elected Mayor): HIGH — directly quoted from two independent primary-source city pages fetched with zero WAF obstruction.
- Roster (7 of 7 officials, names/positions/election histories): HIGH — sourced directly from the official city roster page, cross-confirmed by the 2026-candidate list and 2024-election news account with no discrepancy found; one MEDIUM-risk item flagged (A6, the close Schimmel/Truax outcome) for Wave-0 re-confirmation.
- Headshot sourcing: LOW-MEDIUM — a genuine, actively-flagged gap; text access is excellent but photo retrieval requires either a JS-capable fetch (untested/unconfirmed availability) or the D-16 external fallback chain.
- Migration shape (schema): HIGH — directly inherited from the Tigard (title convention) + Beaverton/Tualatin (district split) templates, with the D-14 WR-01/WR-02 improvements carried forward.
- Ext_id range + migration counter: HIGH — both independently confirmed live in this session, matching the milestone-memory expectation exactly.
- Community banner: MEDIUM — two candidate families found with confirmed licenses and adequate resolution, but neither has a near-panoramic native aspect ratio; the compositional crop judgment is untested until execution.

**Research date:** 2026-07-03
**Valid until:** 2026-07-17 (standard 14-day window for this milestone, consistent with the pattern of active concurrent site changes and election-cycle data seen across prior WashCo phases).
