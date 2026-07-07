# Phase 179: City of Tualatin Deep-Seed — Research

**Researched:** 2026-07-02
**Domain:** Oregon municipal deep-seed — council-manager city, directly-elected Mayor + 6 numbered at-large council positions
**Confidence:** HIGH (form of government, roster, headshot sourcing: VERIFIED direct from tualatinoregon.gov with NO WAF block — the cleanest sourcing situation in the milestone to date). **CRITICAL geo_id correction found: the phase-description/CONTEXT.md value 4175200 does NOT exist in `essentials.geofence_boundaries` — the correct value is `4174950`.**

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Form of government & council routing — VERIFY AT PLAN TIME (directive, carried forward)**
- **D-01:** Tualatin's council structure is NOT assumed from memory. Tualatin is commonly described as council-manager with a Mayor + 6 councilors elected at-large by numbered position — but the routing branch is decided by the charter/municipal code ground-truthed from tualatinoregon.gov at plan time.
- **D-02:** Tie-breaker rule: WHO VOTES decides routing, not residency. If ward/district voters alone elect their councilors: load custom X00xx ward geofences BEFORE seeding (official GIS only; no authoritative machine-readable file = blocker to surface, not a license to hand-trace). If the whole city votes for all seats (positions/wards = residency requirement only): no new geofences — model at-large on the existing city geo_id, exactly like Beaverton/Tigard.
- **D-03:** If ward branch: one district per ward, offices attached to it. Seat identity lives on the office title, NOT on duplicate district rows.
- **D-04:** Either branch must produce no section-split and no empty LOCAL section — one Tualatin address returns the Mayor + the correct council representation.

**Mayor & leadership modeling — VERIFY AT PLAN TIME (directive, carried forward)**
- **D-05:** Mayor's role ground-truthed from the charter at plan time. If directly-elected citywide: the Beaverton 176 shape — LOCAL_EXEC district (Mayor) + LOCAL at-large district (councilors), both on the city geo_id, both `state='or'`; Mayor sorts first (groupHierarchy.js). If council-member/rotating president: seat-with-title on the council, no LOCAL_EXEC (avoids the Norwalk/Downey/Bellflower mis-seed class).
- **D-06:** Council President / Vice Mayor = title-on-seat if one exists — designation rides on that councilor's office title, verified from the official site. No separate office row.

**Roster & body name — strict ground-truth (carried forward)**
- **D-07:** Researcher pulls the seated roster + exact chamber/body name verbatim from tualatinoregon.gov at plan time. No hardcoding names, seat count, or position naming from memory — account for 2024 turnover. Researcher also notes WAF status of tualatinoregon.gov so the executor isn't surprised.

**Stance scope + headshots (carried forward, locked)**
- **D-08:** All live compass topics per official, one agent at a time, evidence-only / 100% cited / honest blank spokes / zero default values; 18–21+ depth where the record supports it; skip judicial-* topics.
- **D-09:** Headshots from tualatinoregon.gov first; Ballotpedia/Wikimedia for genuine gaps. Crop-to-4:5 then resize to 600×750 (Lanczos q90, no overlays), mirrored to Storage `politician_photos/{uuid}-headshot.jpg`; `photo_license` set at execution by actual source. Genuine gaps documented, no fabrication.

**Community banner (carried forward)**
- **D-10:** Subject: executor picks the best legally-licensed wide shot (see D-15 for the Tualatin priority hint). Wikimedia Commons first, Unsplash fallback; NO AI-generated images; no baked-in text/graphics. Follow `docs/banner-asset-pipeline.md` (`process_banner.py` → 1700×540 @ 3.15:1 → `upload_banner.py` → `cities/tualatin.jpg`) + `CURATED_LOCAL` entry with attribution in `src/lib/buildingImages.js`.
- **D-11:** Banner asset work lives in the final surfacing plan (alongside coverage.js) — keeps the proven 5-plan deep-seed shape. `offices.representing_city='Tualatin'` is set in the structural migration.

**Surfacing (locked)**
- **D-12:** Add Tualatin to the Oregon block of `COVERAGE_STATES` in `src/lib/coverage.js`: `{ label: 'Tualatin', browseGovernmentList: ['<geo_id>'], browseStateAbbrev: 'OR', hasContext: true }` — city entry alphabetical next to Tigard (line ~104). **See geo_id correction below — CONTEXT.md's stated `4175200` is wrong; use `4174950`.**
- **D-13:** Live browse link at completion: `essentials.empowered.vote/results?browse_geo_id=<geo_id>&browse_mtfcc=G4110` (**use corrected geo_id 4174950**).

**Tualatin-specific decisions (resolved this discussion — recommended defaults, user AFK)**
- **D-14:** Non-voting / ex-officio seats are EXCLUDED from the roster. If plan-time research finds an appointed, non-voting seat on the dais, it is NOT seeded. Document its existence in the research/summary so the exclusion is deliberate, not an oversight.
- **D-15:** Banner subject priority hint — Tualatin Commons lake plaza / Tualatin River civic horizon (the city's signature spaces), mirroring the Hillsboro hint pattern. As always, a clean license + crops-well-to-1700×540 beats subject preference.
- **D-16:** Headshot fallback — strict chain first (city site → Ballotpedia/Wikimedia), with local-news/community-paper photos PRE-AUTHORIZED as a documented last-resort fallback for genuine gaps, mirroring what Tigard (178) actually needed. License verified per source; `photo_license` set accordingly; never fabricate.

### Claude's Discretion
- Council office title labeling — planner picks after seeing the official roster page (city-verbatim vs simplified).
- External_id block — Wave-0 DB probe picks an unused OR range (geo_id-derived block like -41752xx is the natural analog; Beaverton used -4105351..-4105357). **See geo_id correction — the natural analog block is now -4174951..-4174957 (derived from the corrected geo_id 4174950).**
- Next migration number — Wave-0 confirms on-disk MAX (post-Tigard counter was ~1168; on-disk counter is authoritative; stance migs are audit-only and never register).
- Custom X00xx mtfcc + district_type — only if the D-02 ward branch fires; Wave-0 finds next unused code.

### Deferred Ideas (OUT OF SCOPE)
- Remaining west-metro cities (Forest Grove 180, Sherwood 181, Cornelius 182), school boards incl. Tigard-Tualatin SD 23J (184), 2026 elections + discovery (185) — already scoped as their own phases.
- Tualatin appointed boards/commissions, city-manager staff, and any non-voting/ex-officio dais seats (D-14) — not elected officials; out of scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WASH-05 | City of Tualatin deep-seeded — government + roster + headshots + evidence-only stances. | Fully resolved: **geo_id corrected from CONTEXT.md's 4175200 (does not exist) to the verified 4174950** (`Tualatin city`, G4110, `census_tiger_2024`, confirmed live against production DB); pure at-large council-manager form confirmed directly from tualatinoregon.gov (no WAF block — direct primary-source fetch, best sourcing situation in the milestone); Mayor directly elected citywide (Beaverton 176 shape, LOCAL_EXEC + LOCAL); 6 numbered Council Positions (Beaverton-style title convention); 7-member roster identified with exact names/positions/term-end dates, **zero currently-appointed seats** (simpler than Tigard); all 7 official headshots confirmed hosted and downloadable directly from tualatinoregon.gov (no fallback needed); City Attorney/Municipal Court Judge confirmed appointed (skip judicial-* topics); Youth Advisory Council confirmed to be a separate advisory board, not a council-dais seat (D-14 satisfied — nothing to exclude from the roster itself); banner candidate matching D-15's exact hint found on Wikimedia Commons with a clean license. |
</phase_requirements>

---

## Summary

Tualatin operates under a **council-manager form of government** with a City Council of **7 members: a directly-elected Mayor plus 6 Councilors, each elected at-large to a numbered Position (1–6)**. [VERIFIED: direct curl fetch of `https://tualatinoregon.gov/city-council/`, HTTP 200, no WAF — primary-source city text, not a WebSearch summary] The city's own page states this in one unambiguous sentence: *"The Tualatin City Council has seven members, including the mayor and six city councilors. Each member of the council was elected at large to serve a four-year term, with elections occurring every two years."* A second primary-source page (the city's own 2026 candidate-filing/elections page) independently confirms: *"People interested in running will file for a specific position, but all positions are elected at large – meaning all voters have the opportunity to elect all positions, and all elected candidates represent the entire community."* **There is no ward or district residency requirement of any kind — every seat, including the Mayor's, is voted on by the entire city.** This is structurally identical to Beaverton (Phase 176): directly-elected Mayor + 6 numbered at-large positions, no wards. **No custom X00xx geofences are needed or appropriate.**

**CRITICAL FINDING — geo_id correction required.** The phase description, ROADMAP.md, and CONTEXT.md all state Tualatin's geo_id as **`4175200`**. [VERIFIED: live query against production `essentials.geofence_boundaries`, 2026-07-02] **This geo_id does not exist in the table (0 rows).** A name search (`WHERE name ILIKE '%tualatin%'`) found the correct row: **`4174950`, mtfcc `G4110`, name `Tualatin city`, source `census_tiger_2024`**. This is the same class of error the milestone has already seen once (Hillsboro's Phase 177 stated `4133850`, corrected to `4134100`). **Every geo_id reference in the plan — districts, offices, coverage.js, the browse link — must use `4174950`, not `4175200`.** The other "Tualatin"-named row found (`4112240`, G5420, "Tigard-Tualatin School District 23J", loaded by Phase 174) is the distinct, correct school-district geofence for the future Phase 184 — not a collision risk here.

**Mayor Frank Bubenik** is directly elected citywide (not a rotating council-member title): first elected to Council in Nov 2010, elected **Mayor** in Nov 2018, reelected Mayor in Nov 2022 (term Jan 2023–Dec 2026). A second primary source (the city's own 2026 election-filing page) independently states: *"The Mayor is elected at a state general election for a four-year term and serves as Chairman of Council and presides over its deliberations."* This matches D-05's directly-elected-citywide branch exactly — model as the **Beaverton 176 shape**: one LOCAL_EXEC district (Mayor) + one shared LOCAL district (all 6 Councilors), both on geo_id `4174950`, both `state='or'`.

**Zero currently-appointed seats** — a meaningful contrast with Tigard (178), which had 2 of 7 seats filled by council appointment. All 7 Tualatin seats are currently held by election (Councilor Valerie Pratt was originally *appointed* in August 2019 to fill a vacancy, but has since been elected in 2020 and reelected in 2024 — her current term is by election, so `is_appointed=false` is the correct current-state flag, unlike Tigard's Hu/Anderson who are mid-term appointees as of this research date).

**Council President Valerie Pratt (Position 6)** holds the annually-elected Council President title — same title-on-seat treatment as Hillsboro's Rob Harris, Beaverton's Kimmi, and Tigard's Maureen Wolf. No separate office row.

**tualatinoregon.gov has NO WAF block whatsoever** — direct `curl` (with or without a Chrome UA) returns clean 200s for the homepage, the roster page, and every headshot image tested. This is a materially better sourcing situation than every prior WashCo city (Beaverton, Hillsboro, Tigard all hit Akamai WAF-403 on their primary domain). The site underwent a recent redesign (staging references to `juiceboxint.com`, a web agency, visible in WP REST API GUIDs) — some pre-redesign URL slugs referenced in older search results (e.g. `citycouncil/form-government`) now 404; use the live URLs discovered in this session (`tualatinoregon.gov/city-council/`, `tualatinoregon.gov/city-council/elections/`).

**All 7 official headshots are hosted directly on tualatinoregon.gov and confirmed downloadable in this session** — 6 councilors at `Council_<Name>.jpg` (484×484 JPEG, ~25–40KB each) and the Mayor at `Home_Mayor.jpg` (1250×1330 JPEG, 185KB). No fallback sourcing is needed for any of the 7 — the best headshot outcome of any WashCo city seeded so far.

**Youth Advisory Council** is confirmed to be a separate advisory **board/committee** (listed alongside the Architectural Review Board, Arts Advisory Committee, Budget Advisory Committee, etc. under "Boards & Committees") — **not** a seat on the City Council dais itself, unlike Tigard's mayor-appointed non-voting Youth Councilor who sits on Council. D-14 is satisfied with an explicit "nothing to exclude from the roster" finding — there is no non-voting seat on the Tualatin council dais to exclude.

**Primary recommendation:** Seed as pure at-large with numbered Council positions (Beaverton's exact structural shape — the closest analog in this project), single 'City Council' chamber (`official_count=7`). Government name `'City of Tualatin, Oregon, US'`. Corrected geo_id `4174950`. Ext_id block **-4174951..-4174957** (7 slots, confirmed unused). Next structural migration **1169** (on-disk MAX confirmed 1168 as of this research session — the file is an unrelated NC candidate-reconciliation migration, but the on-disk-counter convention still applies; Wave-0 must re-verify). Community banner: "Tualatin Commons daytime.JPG" (Wikimedia Commons, CC BY-SA 3.0) matches D-15's exact hint and is high-resolution with a clean license.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| City government row | Database / Storage | — | Structural migration inserts into essentials.governments |
| Chamber row | Database / Storage | — | Single 'City Council' chamber, official_count=7 |
| Mayor office (LOCAL_EXEC) | Database / Storage | — | Directly-elected citywide, links to LOCAL_EXEC district |
| Council offices (LOCAL, numbered positions) | Database / Storage | — | All 6 share one LOCAL district; position number lives on the office title, not on a duplicate district row |
| Official headshots (600×750) | Database / Storage | CDN | politician_images rows + Supabase Storage; source = tualatinoregon.gov directly, no fallback needed |
| Compass stances | Database / Storage | — | inform.politician_answers rows, evidence-only |
| Community banner | Database / Storage | CDN | Supabase Storage `cities/tualatin.jpg`; wired via `buildingImages.js` CURATED_LOCAL |
| Frontend surfacing | Frontend Server (SSR) | CDN | coverage.js Oregon block, purple hasContext chip |
| Address routing | API / Backend | — | PIP query against G4110 geofence (geo_id 4174950 — CORRECTED), no ward layer |

---

## geo_id Correction (CRITICAL — CONTEXT.md/ROADMAP.md value is WRONG)

[VERIFIED: live query against production `essentials.geofence_boundaries`, 2026-07-02]

```sql
SELECT geo_id, mtfcc, state, name, source FROM essentials.geofence_boundaries WHERE geo_id='4175200';
-- 0 rows

SELECT geo_id, mtfcc, state, name, source FROM essentials.geofence_boundaries WHERE name ILIKE '%tualatin%';
--  geo_id  | mtfcc | state |                name                 |            source
-- ---------+-------+-------+-------------------------------------+------------------------------
--  4112240 | G5420 | 41    | Tigard-Tualatin School District 23J | tiger_unsd_or_2024_westmetro
--  4174950 | G4110 | 41    | Tualatin city                       | census_tiger_2024
```

**The correct geo_id for the City of Tualatin is `4174950`.** The value `4175200` stated in `.planning/ROADMAP.md` §Phase 179, `.planning/REQUIREMENTS.md`, and `179-CONTEXT.md` does not exist anywhere in `essentials.geofence_boundaries`. This is the same class of error as Hillsboro's Phase 177 (`4133850` → `4134100`), except this time the wrong value returns **zero** rows rather than a different real place — so a structural migration written against `4175200` would silently create a government/chamber/offices with no matching geofence, and no Tualatin address would ever route to it (a phantom deep-seed). **This must be corrected everywhere before Wave-0**: the plan, the structural migration, `coverage.js`, and the completion browse link all need `4174950`.

The other "Tualatin" match (`4112240`, G5420, "Tigard-Tualatin School District 23J") is a **different, correct** geofence — the west-metro school district loaded by Phase 174, relevant to the future Phase 184 (WSCH-03), not a collision risk for this phase.

```sql
SELECT COUNT(*) FROM essentials.districts WHERE geo_id='4174950';                                     -- 0 (greenfield)
SELECT id, name, geo_id FROM essentials.governments WHERE geo_id='4174950' OR name ILIKE '%tualatin%'; -- 0 rows (greenfield)
SELECT external_id, full_name FROM essentials.politicians WHERE external_id BETWEEN -4174960 AND -4174940; -- 0 rows (ext_id block clean)
```

**This phase IS greenfield** for Tualatin's government/chamber/offices — confirmed no pre-existing rows by (corrected) geo_id or by name search, and the ext_id block derived from the corrected geo_id is clean. **Wave-0 must re-run these exact queries against `4174950` immediately before writing any migration** — both to reconfirm greenfield status and because a session gap always carries a small risk of intervening work.

---

## Form of Government — RESOLVED (primary-source city text, direct fetch, no WAF)

**DETERMINATION: PURE AT-LARGE WITH NUMBERED POSITIONS. NO WARDS. DIRECTLY-ELECTED MAYOR. Beaverton (176) is the exact structural analog.**

[VERIFIED: `curl -A "<Chrome UA>" https://tualatinoregon.gov/city-council/` — HTTP 200, no WAF, primary-source city text]

> "The Tualatin City Council has seven members, including the mayor and six city councilors. Each member of the council was elected at large to serve a four-year term, with elections occurring every two years. Tualatin uses a council-manager form of government. In this system, the council retains the decision-making authority of the city, but the charter creates an office of city manager that is appointed by the council. The city manager takes charge of the daily supervision of the city's operations..."

[VERIFIED: `curl -A "<Chrome UA>" https://tualatinoregon.gov/city-council/elections/` — HTTP 200, no WAF; independently confirms the at-large finding and adds mayor-election and term-limit detail]

> "People interested in running will file for a specific position, but all positions are elected at large – meaning all voters have the opportunity to elect all positions, and all elected candidates represent the entire community. All positions, including the mayor, are term limited to 12-years in any 20-year period. However, if a mayor has previously served two full terms as a city councilor, they may serve two consecutive terms as mayor, potentially allowing someone up to 16 years total on the City Council in that scenario."

[CITED: WebSearch aggregation surfacing city-page text — "The Mayor is elected at a state general election for a four-year term and serves as Chairman of Council and presides over its deliberations."] — confirms the Mayor holds a directly-elected, chair-of-council role (not a chief-executive role — the City Manager, appointed by Council, runs day-to-day operations), consistent with every other council-manager city in this milestone.

**Routing conclusion:** every seat — Mayor and all 6 numbered Council Positions — is voted on by the entire city. There is no ward-residency requirement of any kind. **No custom X00xx geofences of any kind are appropriate here.** Model exactly as **Beaverton (Phase 176)**: one LOCAL_EXEC district (Mayor, citywide) + one shared LOCAL district (all 6 Council Positions), both on geo_id `4174950`, both `state='or'`.

**Term-limit nuance (for migration comments, not structural):** 12 years in any 20-year period applies to all positions including Mayor, with a carve-out allowing up to 16 total years if a councilor-then-mayor never served two full consecutive terms in either role alone. This is background context, not something the schema needs to model — no politician currently seated is near this limit except possibly Bubenik (councilor since 2010 + mayor since 2018 = 16 years by end of current term in Dec 2026), which is exactly why the city's own 2026 election page shows Bubenik as *not* a prospective mayoral candidate for the next term (only Gonzalez and Pratt are listed as qualified mayoral candidates for Nov 2026) — this is 2026-election information, out of scope for this phase's seed of the *currently* seated roster, but useful context: **do not assume Bubenik will still be Mayor after Dec 31, 2026** if execution slips past that date.

**City Attorney / Municipal Court Judge — appointed, not elected.** [CITED: WebSearch aggregation — municipal judges are typically appointed by city council and serve at its pleasure; consistent with the council-manager structure and every other OR council-manager city in this milestone (Beaverton, Hillsboro, Tigard)] **Skip all 8 judicial-* compass topics for Tualatin.**

**Youth Advisory Council — NOT a council-dais seat; nothing to exclude.** [VERIFIED: direct fetch of tualatinoregon.gov's "Boards & Committees" listing] The Youth Advisory Council is listed alongside 10 other advisory boards/committees (Architectural Review Board, Arts Advisory Committee, Budget Advisory Committee, Core Area Parking District Board, Council Committee on Advisory Appointments, Downtown Revitalization Community Advisory Committee, Inclusion/Diversity/Equity/Access Advisory Committee, Library Advisory Committee, Parks Advisory Committee, Planning Commission, Teen Library Committee). **This is structurally different from Tigard's Youth Councilor**, which sits as a non-voting member directly on the City Council itself. Tualatin's Youth Advisory Council is a separate, independent advisory body with no seat on the 7-member Council. **D-14 finding: there is no non-voting seat on the Tualatin council dais to exclude — the roster is cleanly 7 members, no judgment call required.**

---

## Live Roster — Verified 2026-07-02 direct from tualatinoregon.gov (no WAF, primary source)

**Official body name:** `City Council`. Government name: `City of Tualatin, Oregon, US` (matches established OR city government-name convention).

[VERIFIED: direct `curl` fetch of `https://tualatinoregon.gov/city-council/`, HTTP 200, bio text for all 7 members read in full]

| Position | Name | Elected | Reelected | Current Term | Notes |
|----------|------|---------|-----------|---------------|-------|
| Mayor | Frank Bubenik | First elected Councilor Nov 2010; elected Mayor Nov 2018 | Reelected Mayor Nov 2022 | Jan 2023 – Dec 2026 | Directly-elected citywide, not a rotating title. Term-limit note above — do not assume automatic Dec 2026 renewal. |
| Position 1 | María (Antonieta) Reyes | Nov 2018 | Nov 2022 | Jan 2023 – Dec 2026 | |
| Position 2 | Christen Sacco | Nov 2020 | Nov 2024 | Jan 2025 – Dec 2028 | |
| Position 3 | Bridget Brooks | Nov 2018 | Nov 2022 | Jan 2023 – Dec 2026 | |
| Position 4 | Cyndy Hillier | Nov 2020 | Nov 2024 | Jan 2025 – Dec 2028 | |
| Position 5 | Octavio Gonzalez | Nov 2022 | — (first term) | Jan 2023 – Dec 2026 | |
| Position 6 | Valerie Pratt (Council President) | Appointed Aug 2019 (replacing outgoing Councilor Joelle Davis); elected Nov 2020 | Reelected Nov 2024 | Jan 2025 – Dec 2028 | Current term is by ELECTION, not appointment — `is_appointed=false` is correct for her present seating. Holds the annually-elected Council President title (title-on-seat, no separate office row). |

**Total officials to seed: 7 (Mayor + 6 numbered Council Positions). `official_count` on chamber = 7.**

**Zero currently-appointed seats** — contrast with Tigard (178), which had 2 of 7 seats (Mayor Hu, Councilor Anderson) filled by mid-term council appointment as of that research date. All 7 Tualatin politicians should use `is_appointed=false` / `is_appointed_position=false` (uniform, matching Hillsboro's shape, not Tigard's mixed shape).

**Independent cross-check (2026 election filing page, confirms current incumbents):** [VERIFIED: `curl` of `https://tualatinoregon.gov/city-council/elections/`, HTTP 200] the city's own November 3, 2026 General Election table lists current incumbents exactly matching the roster above: Mayor (Bubenik), Position 1 (Reyes), Position 3 (Brooks), and Position 5 (Gonzalez) are the four seats up for election in Nov 2026 (all four currently hold Jan 2023–Dec 2026 terms, consistent with the table above); Positions 2, 4, and 6 (Sacco, Hillier, Pratt) are not up in 2026 (Jan 2025–Dec 2028 terms) — this is a fully internally-consistent staggered-term structure with no discrepancies found. **This is 2026-election information, useful only as a term-date cross-check for this phase — do NOT seed any 2026 candidate as an incumbent; Phase 185 (WashCo 2026 Elections & Discovery) owns that data.**

**PLAN-TIME / WAVE-0 VERIFICATION REQUIRED (standard, lower stakes than Tigard given no appointment churn):**
1. Re-confirm all 7 names and term dates are unchanged since this research session (2026-07-02) — no resignation/appointment activity was found in this session, unlike Tigard's Sept–Dec 2025 turnover chain.
2. Reconfirm the corrected geo_id `4174950` is still the only Tualatin G4110 row and remains greenfield.
3. Reconfirm all 7 headshot URLs still resolve (spot-checked in this session; a site redesign is visibly in progress, so URLs could shift again before execution).

**Sources:**
- [VERIFIED: `https://tualatinoregon.gov/city-council/`, direct curl, HTTP 200] — full bio text for all 7 current members, positions, elected/reelected years, Council President designation.
- [VERIFIED: `https://tualatinoregon.gov/city-council/elections/`, direct curl, HTTP 200] — 2026 election-cycle incumbent/position table, independently cross-confirms the 7-member roster and term-end dates; term-limit rule (12-year/20-year).
- [CITED: WebSearch aggregation of the (now-restructured) "Form of Government" city page] — Mayor's role as elected chairman of council, council-manager structure detail.

---

## Web Presence / WAF Status

**tualatinoregon.gov has NO WAF block — confirmed via direct curl, both with and without a Chrome UA.**

```
$ curl -sI https://www.tualatinoregon.gov/
HTTP/1.1 301 Moved Permanently
Server: Apache
Location: https://tualatinoregon.gov/
```
```
$ curl -sI https://tualatinoregon.gov/
HTTP/1.1 200 OK
Server: Apache
```

This is a **materially better sourcing situation than every prior WashCo city** — Beaverton, Hillsboro, and Tigard all hit an Akamai WAF-403 on their primary domain and needed a CivicWeb/Legistar/local-news fallback. Tualatin needs none of that.

**Site redesign note:** the site is running a fresh WordPress theme (`app/themes/tualatin/`) with WP REST API GUIDs referencing a staging environment at `tualatinoregon.gov.staging3.juiceboxint.com` (a web design agency) — evidence of a recent (2025–2026) redesign. **Some older URL slugs referenced by pre-redesign search-index snippets now 404** (e.g., `citycouncil/form-government`, `citycouncil/about-our-city-government` both returned HTTP 404 in this session despite being surfaced by WebSearch). **Use the live URLs confirmed in this session:**

| Purpose | Live URL | Status |
|---------|----------|--------|
| Council roster + bios | `https://tualatinoregon.gov/city-council/` | HTTP 200 |
| Election cycle / term dates | `https://tualatinoregon.gov/city-council/elections/` | HTTP 200 |
| Boards & Committees index | `https://tualatinoregon.gov/city-council/boards-committees/` | HTTP 200 (via WP REST discovery) |
| Charter PDF (old attachment path) | `https://www.tualatinoregon.gov/sites/default/files/fileattachments/city_council/page/4661/city_charter.pdf` | **HTTP 404 — stale post-redesign; do not rely on this exact path at execution; re-search if the charter's exact statutory clause text is needed** |
| Municode charter mirror | `https://library.municode.com/or/tualatin/codes/city_charter_and_municipal_code_?nodeId=CH` | HTTP 200 but Angular SPA shell — requires a JS-rendering fetch or the Municode API, not usable via plain curl |

**Practical consequence for Wave-0/execution:** unlike Tigard, no fallback sourcing chain is needed for roster or headshots — go directly to `tualatinoregon.gov/city-council/`. If exact charter statutory clause text is needed (e.g., for a migration comment quoting the precise "Mayor shall be elected" section number), a fresh WebSearch/site-search pass will be needed since the charter PDF's old path 404s and Municode requires JS rendering — this is a nice-to-have, not a blocker, since the plain-English city-page text above already resolves the D-01/D-02/D-05 routing questions unambiguously.

---

## Headshot Sources — ALL 7 CONFIRMED, NO FALLBACK NEEDED

[VERIFIED: direct `curl` download of every image in this session — all HTTP 200]

| Position | Name | Source URL | Dimensions | Size |
|----------|------|-------------|------------|------|
| Mayor | Frank Bubenik | `https://tualatinoregon.gov/app/uploads/2025/09/Home_Mayor.jpg` | 1250×1330 | 185,205 bytes |
| 1 | María Reyes | `https://tualatinoregon.gov/app/uploads/2025/09/Council_Maria-Reyes.jpg` | 484×484 | 40,434 bytes |
| 2 | Christen Sacco | `https://tualatinoregon.gov/app/uploads/2025/09/Council_Christen-Sacco.jpg` | 484×484 (confirmed 200; dimensions not independently re-verified, same upload batch as the others) | 25,633 bytes |
| 3 | Bridget Brooks | `https://tualatinoregon.gov/app/uploads/2025/09/Council_Bridget-Brooks.jpg` | 484×484 (same batch) | 31,095 bytes |
| 4 | Cyndy Hillier | `https://tualatinoregon.gov/app/uploads/2025/09/Council_Cyndy-Hillier.jpg` | 484×484 (same batch) | 31,040 bytes |
| 5 | Octavio Gonzalez | `https://tualatinoregon.gov/app/uploads/2025/09/Council_Octavio-Gonzalez.jpg` | 484×484 (same batch) | 33,516 bytes |
| 6 | Valerie Pratt | `https://tualatinoregon.gov/app/uploads/2025/09/Council_Valerie-Pratt.jpg` | 484×484 (same batch) | 35,402 bytes |

**Crop/resize math:** the Mayor's source (1250×1330, aspect ≈0.94:1) crops cleanly to 4:5 by trimming width to 1064px (height stays at 1330) — no upscale needed. The 6 councilor images (484×484, square) crop to 4:5 by trimming width to 387px (height stays at 484), then upscale ~1.55× to reach 600×750 — a modest upscale, well within the acceptable range used throughout this project (contrast Henderson NV's 3× upscale on some sources). **This is the best headshot-sourcing outcome of any WashCo city seeded in this milestone — no CivicWeb/local-news fallback chain is needed at all.**

**Photo license:** `press_use`, per the milestone convention already applied to Hillsboro's CivicWeb-portal-sourced images (an official government-hosted portrait, even when not literally a press photo, is tagged `press_use` throughout this project) — apply the same here for consistency, unless the executor finds an explicit different license notice on the page (none was found in this session).

**D-16 fallback chain is NOT NEEDED for this phase** — document this explicitly since D-16 pre-authorizes a local-news fallback for "genuine gaps," and there are none: 7/7 headshots sourced cleanly from the primary official-site chain (step 1 of the D-09/D-16 chain).

---

## Community Banner

Follow `docs/banner-asset-pipeline.md` Stages 1–8, matching the Beaverton/Hillsboro/Tigard precedent already present in `src/lib/buildingImages.js`.

**Primary candidate — matches D-15's exact hint:** [VERIFIED: Wikimedia Commons API `imageinfo` query, 2026-07-02] `File:Tualatin Commons daytime.JPG` — **3655×2345 pixels**, uploaded 2009-01-24 by user `Aboutmovies` (M.O. Stevens — the same photographer credited on Tigard's banner image), licensed **CC BY-SA 3.0** [VERIFIED: `extmetadata.LicenseShortName` = "CC BY-SA 3.0", `AttributionRequired` = true]. Depicts "Tualatin Commons" — the city's man-made-lake civic plaza, exactly the D-15 priority hint ("Tualatin Commons lake plaza"). High resolution (3655×2345, aspect ≈1.56:1) — crops cleanly to the pipeline's 3.15:1 target by trimming height to ≈1160px, well within the source resolution, no upscale needed.

**Alternate candidates (Tualatin River civic-horizon theme, per D-15's second option):**
- `File:Panorama of Tualatin River and Railway Bridge - Outside Portland - Oregon - USA.jpg` — 4912×1080 (aspect ≈4.55:1, wider than needed — would need width-cropping rather than height-cropping), 2012, "Own work" by Adam Jones — **license not yet confirmed in this session, verify at execution before using.**
- `File:Tualatin River at Browns Ferry Park Tualatin.jpg` — 1600×1200, 2009, by Aboutmovies (same uploader as the primary candidate) — **license not yet confirmed in this session** (likely also CC BY-SA given the same uploader/era as the primary candidate, but must be verified directly, not assumed).

**Recommendation: use "Tualatin Commons daytime.JPG" as the primary choice** — it has a directly confirmed license, matches D-15's first-listed hint (Commons lake plaza) exactly, and has ample resolution for a clean crop. Only fall back to the river alternates if the Commons image proves unsuitable at execution (e.g., due to a compositional issue not visible from metadata alone — the executor should view the actual image before finalizing).

- **Storage path:** `cities/tualatin.jpg` (Stage 5 — standalone-city scheme, matching `beaverton`/`hillsboro`/`tigard`).
- **Wiring:** Add `tualatin: '...supabase.co/.../politician_photos/cities/tualatin.jpg'` to `CURATED_LOCAL` in `src/lib/buildingImages.js`, alongside the existing `beaverton`/`hillsboro`/`tigard` entries [CONFIRMED current state: `src/lib/buildingImages.js` lines 107–114 as of this research session].
- **Attribution comment:** `//   tualatin - Tualatin Commons daytime | M.O. Stevens (Aboutmovies) | CC BY-SA 3.0` per the existing convention.
- **No AI-generated images** (per `docs/banner-asset-pipeline.md`).

**Verify live per Stage 8 (after corrected geo_id):**
```
https://essentials.empowered.vote/results?browse_geo_id=4174950&browse_mtfcc=G4110
```

---

## Migration / Schema Technical Reference

### Next Migration Number

[VERIFIED: `ls C:/EV-Accounts/backend/migrations | sort` — 2026-07-02] Disk MAX is **1168** (`1168_nc_general_field_reconciliation.sql` — an unrelated North Carolina candidate-list reconciliation migration, not part of this milestone, but it still occupies the highest on-disk number and the on-disk-counter convention applies regardless of subject matter). **Next available: 1169.**

[VERIFIED: ledger `MAX(version::bigint) WHERE version ~ '^[0-9]{1,6}$'` = **1159** — Tigard's structural migration, the only registered migration since Hillsboro's 1150; all Tigard headshot/stance migrations (1160–1167) correctly remain unregistered, and the unrelated NC migration 1168 also does not appear in the ledger — confirming the audit-only / on-disk-counter convention held.] **Do not use the ledger MAX (1159) as the next number — it is 9 behind the true on-disk MAX (1168).** This mirrors the exact trap flagged in Tigard's Wave-0 research (Probe E int-overflow note) — always cross-check both sources.

**Migration split for this phase (following the Beaverton/Hillsboro/Tigard shape):**
- `1169_tualatin_city_council.sql` — structural (registered in schema_migrations); government + chamber + 2 districts (LOCAL_EXEC + LOCAL) + 7 offices, `representing_city='Tualatin'` set INLINE (Hillsboro/Tigard D-09 improvement — no follow-up backfill migration).
- `1170_tualatin_headshots.sql` — audit-only (NOT registered)
- `1171_bubenik_stances.sql` through `1177_pratt_stances.sql` (or similar per-official naming) — 7 stance migrations, audit-only (one per official, NOT registered)

Total: 1 structural + 1 headshots + 7 stance = 9 migrations consumed (1169–1177). **Re-verify the exact starting number at Wave-0 regardless** — this research's on-disk MAX (1168) could itself be stale by the time planning/execution runs, especially given the unrelated NC migration shows other workstreams are actively consuming numbers from the same shared counter. Banner upload does not consume a migration number.

### Ext_id Block

**Recommended range: -4174951 to -4174957** (7 slots: Mayor + 6 Council Positions), derived from the **corrected** geo_id `4174950`.

[VERIFIED: `SELECT external_id FROM essentials.politicians WHERE external_id BETWEEN -4174960 AND -4174940` — 0 rows. Range is clean.]

**Suggested assignment (planner's discretion to reorder):**
| Official | ext_id |
|----------|--------|
| Mayor Frank Bubenik | -4174951 |
| Position 1 María Reyes | -4174952 |
| Position 2 Christen Sacco | -4174953 |
| Position 3 Bridget Brooks | -4174954 |
| Position 4 Cyndy Hillier | -4174955 |
| Position 5 Octavio Gonzalez | -4174956 |
| Position 6 Valerie Pratt (Council President) | -4174957 |

Wave-0 must re-run `SELECT external_id FROM essentials.politicians WHERE external_id BETWEEN -4174960 AND -4174940` to reconfirm the range is still clean at execution time.

### Schema Shapes (Beaverton mig 1131 is the closest analog — directly-elected Mayor + numbered at-large positions, no appointed seats; adapt geo_id and reuse Hillsboro/Tigard's WR-01/WR-02 + representing_city-inline improvements)

```sql
-- governments: slug GENERATED ALWAYS — NEVER INSERT slug; no unique constraint on geo_id
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'City of Tualatin, Oregon, US',
       'LOCAL', 'OR', 'Tualatin', '4174950'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments WHERE name = 'City of Tualatin, Oregon, US'
);

-- chambers: slug GENERATED ALWAYS — never include in INSERT column list
INSERT INTO essentials.chambers (id, name, name_formal, government_id, official_count)
SELECT gen_random_uuid(), 'City Council', 'Tualatin City Council',
       (SELECT id FROM essentials.governments WHERE name = 'City of Tualatin, Oregon, US'),
       7
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers WHERE name = 'City Council'
    AND government_id = (SELECT id FROM essentials.governments
                          WHERE name = 'City of Tualatin, Oregon, US')
);

-- districts: state='or' LOWERCASE for LOCAL/LOCAL_EXEC; no name_formal column; government_id NULL
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL_EXEC', 'or', '4174950', 'Tualatin (Mayor, Citywide)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts WHERE geo_id='4174950' AND district_type='LOCAL_EXEC' AND state='or'
);

INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'or', '4174950', 'Tualatin (At-Large)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts WHERE geo_id='4174950' AND district_type='LOCAL' AND state='or'
);

-- offices: guard on (district_id, politician_id) — NOT EXISTS; representing_city inline
-- representing_state = 'OR' (uppercase); representing_city = 'Tualatin'
-- title convention (Beaverton precedent): 'Mayor' for the LOCAL_EXEC seat,
-- 'Council Member (Position N)' for each of the 6 LOCAL seats
```

**politician_images schema:** `id, politician_id, url, type, photo_license` — NO `photo_origin_url` column (confirmed absent in every prior-phase research, unchanged).

**Stance schema:** `inform.politician_answers` ON CONFLICT `(politician_id, topic_id)`; topic_id resolved LIVE via `JOIN inform.compass_topics WHERE topic_key='...' AND is_live=true`; value integer 1-5 (chairs model). [VERIFIED: 44 live topics, 8 judicial-* — re-confirmed live in this session, unchanged from Hillsboro/Tigard.]

### Migration Template Fixes to Carry Forward (from 177-REVIEW.md / 178-RESEARCH.md — apply proactively)

**WR-01 (dead post-verify gate):** replace the inherited "section-split" gate with an independent canonical query (not the same-transaction dead gate):
```sql
SELECT COUNT(*) INTO v_split_count
FROM (
  SELECT o.district_id
  FROM essentials.offices o
  JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.geo_id = '4174950'
  GROUP BY o.district_id
  HAVING COUNT(DISTINCT o.chamber_id) > 1
) x;
```
plus a separate assertion that the G4110 geofence row exists: `SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE geo_id='4174950' AND mtfcc='G4110'` must be ≥ 1 — **this assertion is exactly the kind of check that would have caught the 4175200 error immediately if it had been run against the wrong value; run it against the corrected 4174950 in this phase, but treat this as a standing lesson: always run this exact geofence-existence probe as the very first Wave-0 step for every future WashCo city.**

**WR-02 (stance migrations silently drop rows on topic_key mismatch):** append a count-assert DO block after each stance migration's INSERT statements, per the Tigard-established pattern:
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

**Numbered positions exist (unlike Tigard's plain titles) — follow Beaverton's exact convention:** `'Mayor'` for the LOCAL_EXEC seat, `'Council Member (Position N)'` for each of the 6 LOCAL seats (verified directly from Beaverton's structural migration 1131, the closest analog for a directly-elected-mayor + numbered-position city). Do not invent a different title string — reuse the exact Beaverton convention for consistency across the milestone's numbered-position cities.

### OR Casing Rules (identical to Beaverton/Hillsboro/Tigard — critical, wrong case = silent routing failure)

| Context | Casing | Why |
|---------|--------|-----|
| `governments.state` | `'OR'` (uppercase) | Governments table convention |
| `districts.state` for LOCAL/LOCAL_EXEC | `'or'` (lowercase) | [RE-VERIFIED live this session: Beaverton 4105350, Portland 4159000, Hillsboro 4134100, Tigard 4173650 all return `state='or'`] |
| `offices.representing_state` | `'OR'` (uppercase) | Offices table convention |
| `essentials.politicians.party` | `NULL` | Antipartisan design — never set, regardless of any news characterization of individual members' party affiliation |

### Live Compass Topics (44 total, is_live=true — re-verified live this session, unchanged from Hillsboro/Tigard)

abortion, ai-regulation, campaign-finance, childcare, city-sanitation, civil-rights, climate-change, data-centers, deportation, economic-development, fossil-fuels, growth-and-development, healthcare, homelessness, homelessness-response, housing, immigration, jail-capacity, judicial-access-to-justice, judicial-bail-pretrial, judicial-criminal-justice, judicial-government-deference, judicial-interpretation, judicial-police-accountability, judicial-prosecution-priorities, judicial-transparency, local-environment, local-immigration, medicare/aid, misinformation, public-safety-approach, redistricting, religious-freedom, rent-regulation, residential-zoning, same-sex-marriage, school-vouchers, social-security, tariffs, taxes, trans-athletes, transportation-priorities, ukraine-support, voting-rights.

**Skip all 8 judicial-* topics** — City Attorney and Municipal Court judges are appointed, not elected (confirmed above).

---

## Architecture Patterns

### Closest Analog: Beaverton, OR (Phase 176) — directly-elected Mayor + numbered at-large positions, no wards, no current appointments

Tualatin is structurally almost identical to Beaverton: a directly-elected Mayor + 6 councilors elected at-large by numbered Position, zero ward/geography differentiation, and (unlike Tigard) zero currently-appointed seats. The Beaverton structural migration (1131) is the direct template — same district shape, same title convention, same office count.

```
City of Tualatin, Oregon, US (governments)
└── City Council (chambers, official_count=7)
    ├── LOCAL_EXEC district (geo_id=4174950, state='or', mtfcc=NULL)
    │   └── Mayor office → Frank Bubenik (-4174951, elected, term through Dec 2026)
    └── LOCAL district (geo_id=4174950, state='or', mtfcc=NULL)
        ├── Council Member (Position 1) → María Reyes (-4174952, term through Dec 2026)
        ├── Council Member (Position 2) → Christen Sacco (-4174953, term through Dec 2028)
        ├── Council Member (Position 3) → Bridget Brooks (-4174954, term through Dec 2026)
        ├── Council Member (Position 4) → Cyndy Hillier (-4174955, term through Dec 2028)
        ├── Council Member (Position 5) → Octavio Gonzalez (-4174956, term through Dec 2026)
        └── Council Member (Position 6) → Valerie Pratt (-4174957, Council President title-on-seat, term through Dec 2028)
```

### System Architecture Diagram

```
Tualatin resident address
        |
        v
  Backend /representatives/me
        |
  PIP query against geofence_boundaries
        |
  ┌─────────────────────────────────────────┐
  │  G4110 city boundary (geo_id=4174950)   │   <-- CORRECTED geo_id, not 4175200
  │  → LOCAL_EXEC district (Mayor)          │
  │  → LOCAL district (all 6 Positions)     │
  └─────────────────────────────────────────┘
        |
        v
  7 officials returned
  (Mayor first via groupHierarchy.js)
        |
        v
  frontend PoliticianCard render
  (600x750 headshot + compass stances + Local-section banner)
```

### Anti-Patterns to Avoid

- **Do NOT use geo_id `4175200`** — it does not exist in `essentials.geofence_boundaries`. Use `4174950`.
- **Do NOT create any ward geofences** — Tualatin has none; every seat is at-large.
- **Do NOT flatten the numbered-position titles to plain "Councilor"** — unlike Tigard, Tualatin's charter/site explicitly uses numbered Positions 1–6; use Beaverton's `'Council Member (Position N)'` convention.
- **Do NOT mark any of the 7 officials as currently appointed** — unlike Tigard's Hu/Anderson, all 7 Tualatin seats are presently held by election (Pratt's 2019 appointment has since been superseded by two elections).
- **Do NOT store or surface party affiliation** — antipartisan design forbids this regardless of source prominence.
- **Do NOT seed any 2026 election candidate as an incumbent** — the 2026 election-page data found in this session (Gonzalez/Pratt as mayoral candidates, Dittman for Position 5, etc.) is FUTURE election data, owned by Phase 185, not this phase's structural seed of the *currently seated* roster.
- **Do NOT rely on the old `citycouncil/form-government` or `citycouncil/about-our-city-government` URL paths** — both 404 post-redesign; use `city-council/` and `city-council/elections/` instead.
- **Do NOT insert `slug`** on chambers — GENERATED ALWAYS (migration will fail).
- **Do NOT use `photo_origin_url`** in politician_images INSERT — column does not exist.
- **Do NOT default stance values** — blank spoke is correct when no evidence found.
- **Do NOT use ON CONFLICT on districts** — no unique constraint; use WHERE NOT EXISTS.
- **Do NOT reuse the Beaverton/Hillsboro dead post-verify gate verbatim** — apply the WR-01 fix above.
- **Do NOT reuse the stance migration template without WR-02's count-assert** — apply the fix above.
- **Do NOT use the ledger MAX (1159) as the next migration number** — the true on-disk MAX is 1168 (an unrelated NC migration); next is 1169.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Headshot resize | Custom PIL script | Existing `_tmp-*-headshots.py` pipeline (e.g. `_tmp-tigard-headshots.py` as the most recent template) | Phases 159-178 all reuse the same crop-4:5→600x750 Lanczos pattern |
| Stance research | Parallel agents | One agent at a time | Rate-limit rule — parallel burns quota with no usable output |
| Geofence load | Custom boundary ingest | None needed | At-large — city G4110 (4174950, corrected) already loaded |
| groupHierarchy ordering | Custom sort | groupHierarchy.js Mayor-first rule | Already handles LOCAL_EXEC-first + position ordering |
| Banner processing | Custom crop/resize script | `scripts/banners/process_banner.py` + `upload_banner.py` | Already built, proven on Beaverton/Hillsboro/Tigard/50 states |
| geo_id trust | Trusting the phase description's stated geo_id at face value | Always run the geofence-existence probe FIRST (`SELECT ... WHERE geo_id=X AND mtfcc='G4110'`) | Two of five WashCo cities so far (Hillsboro, Tualatin) had a wrong stated geo_id — treat this as an expected-not-exceptional risk for the remaining cities (Forest Grove 180, Sherwood 181, Cornelius 182) |

---

## Common Pitfalls

### Pitfall 1: Seeding against the stated geo_id (4175200) without verifying it first
**What goes wrong:** A structural migration is written and applied against `4175200`, creating a government/chamber/offices with no matching G4110 geofence row — the government exists in the database but is permanently unreachable by address lookup (a phantom deep-seed that passes a naive "row exists" check but fails the actual routing success criterion).
**Why it happens:** The phase description, ROADMAP.md, and CONTEXT.md all independently repeat the same wrong value, creating false confidence through repetition.
**How to avoid:** Run `SELECT geo_id, mtfcc, name FROM essentials.geofence_boundaries WHERE geo_id='4175200'` BEFORE writing any migration. This research already ran it — 0 rows — and found the correct value (`4174950`) via a name search. Wave-0 must re-run both queries regardless.
**Warning signs:** Any Wave-0 probe that returns 0 rows for a geofence lookup on a value taken from the phase description should immediately trigger a name-based search, not a "greenfield, proceed" conclusion — a 0-row geofence probe on a *city* (as opposed to a genuinely new office/politician) usually means the ID is wrong, not that the geofence is missing.

### Pitfall 2: Using Tigard's plain "Councilor" title instead of Tualatin's numbered "Council Member (Position N)"
**What goes wrong:** Copy-pasting the most recently completed sibling phase's title convention without re-checking whether this city actually uses numbered positions.
**Why it happens:** Tigard (178) was the immediately preceding phase and used plain titles; pattern-matching to the most recent analog is a natural but incorrect shortcut here.
**How to avoid:** Tualatin's own city-page text and election-filing page both explicitly reference "Position 1" through "Position 6" — use Beaverton's numbered-position convention instead, since it is the correct structural analog for this specific city.

### Pitfall 3: Marking Valerie Pratt as an appointed seat because her original 2019 seating was via appointment
**What goes wrong:** A structural migration sets `is_appointed=true` for Pratt because her Wikipedia-style bio mentions she was "appointed in August 2019, replacing outgoing Councilor Joelle Davis."
**Why it happens:** The word "appointed" appears in her bio text, inviting a surface-level pattern-match to Tigard's Hu/Anderson appointed-seat handling.
**How to avoid:** Read the full bio: "appointed in August 2019 ... Since then, Councilor Pratt was elected in 2020 and reelected in 2024." Her CURRENT term (Jan 2025–Dec 2028) is by election, not appointment — `is_appointed=false` / `is_appointed_position=false` is correct for her present seating, same as all other 6 officials.

### Pitfall 4: Seeding a 2026-election candidate as a current incumbent
**What goes wrong:** The city's own elections page prominently displays 2026 candidate names (Gonzalez and Pratt running for Mayor, Beth Dittman for Position 5, etc.) — these could be mistakenly seeded as the current officeholder for a seat.
**Why it happens:** The election page and the roster page are both fetched in the same research pass and could be conflated.
**How to avoid:** Only the "City Council" roster page's bio text (elected/reelected history) determines the CURRENT seat-holder. The election page is used only as a term-date cross-check in this research, and belongs entirely to Phase 185 (WashCo 2026 Elections & Discovery) for actual candidate/race seeding.

### Pitfall 5: districts.state uppercase 'OR' for LOCAL districts
**What goes wrong:** Routing fails silently — address lookup returns no city-level officials.
**How to avoid:** All LOCAL/LOCAL_EXEC/COUNTY districts in Oregon use `state='or'` (lowercase). Re-verified live this session against Beaverton/Portland/Hillsboro/Tigard.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Councilor Joelle Davis (Position 6) | Councilor Valerie Pratt (appointed, then elected/reelected) | August 2019 (appointment); confirmed by election Nov 2020, Nov 2024 | Pratt's seat has been stable and fully elected for two full cycles — no current appointment flag needed |
| Pre-redesign tualatinoregon.gov URL structure (`citycouncil/form-government`, etc.) | New WordPress theme + URL structure (`city-council/`, `city-council/elections/`) | Site redesign, evidenced by 2025/09 and 2026/02 upload directories and a `juiceboxint.com` staging reference | Old URLs referenced in stale search-index snippets now 404; use the live URLs found in this session |
| N/A | Mayor Bubenik's term-limit exposure (16-year cap scenario) means he is NOT among the 2026 mayoral candidates per the city's own election page | Ongoing — Nov 3, 2026 election | Do not assume Bubenik continues past Dec 31, 2026 if execution slips; this phase seeds the CURRENTLY seated roster only |

**Deprecated/outdated:**
- The phase-description/ROADMAP/CONTEXT geo_id value `4175200` is incorrect and should be treated as obsolete the moment this research is read — use `4174950`.

---

## Surfacing

**Entry to add to `src/lib/coverage.js` Oregon block** (`COVERAGE_STATES`, name='Oregon', abbrev='OR', `areas` array — currently 9 entries as of this research session: Beaverton, Fairview, Gresham, Hillsboro, Maywood Park, Portland, Tigard, Troutdale, Wood Village):

```js
{ label: 'Tualatin', browseGovernmentList: ['4174950'], browseStateAbbrev: 'OR', hasContext: true },
```

**Sort position:** Alphabetically between 'Troutdale' and 'Wood Village' ("Tr" < "Tu" < "Wo" — note this is a DIFFERENT position than Tigard's, which sorts between 'Portland' and 'Troutdale'; do not insert Tualatin next to Tigard).

**Browse link at completion (corrected geo_id):** `essentials.empowered.vote/results?browse_geo_id=4174950&browse_mtfcc=G4110`

**hasContext: true** is correct once at least 1 stance row is inserted for a Tualatin official.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | geo_id 4174950 is the correct, sole G4110 row for the City of Tualatin | geo_id Correction | LOW — directly verified against the live production DB by both a direct-value lookup (0 rows for the stated 4175200) and a name search (exactly 1 G4110 match); high confidence given the exact TIGER name match ("Tualatin city") |
| A2 | Tualatin's council is at-large with numbered Positions 1-6 and a directly-elected Mayor, with zero ward/residency requirement | Form of Government | LOW — directly quoted from two independent primary-source city pages fetched with no WAF obstruction, not a WebSearch summary; internally cross-consistent with the 2026 election-cycle table |
| A3 | The 7-member roster (Bubenik, Reyes, Sacco, Brooks, Hillier, Gonzalez, Pratt) reflects the CURRENT seated council as of 2026-07-02 | Live Roster | LOW-MEDIUM — sourced directly from the official city roster page (not triangulated from local news, unlike Tigard); the 2026-election-cycle table independently cross-confirms all term-end dates with no discrepancy found; residual risk is only a change between this research date and execution |
| A4 | Valerie Pratt's current term is properly classified as "elected" (not "appointed") given her 2019 appointment was superseded by two subsequent elections | Live Roster | LOW-MEDIUM — a judgment call on how to interpret an official whose SEAT origin was appointment but whose CURRENT mandate is electoral; flagged explicitly for planner confirmation, though the recommended treatment (is_appointed=false) matches the plain reading of her bio text |
| A5 | The Youth Advisory Council is a standalone advisory board with no seat on the City Council dais (unlike Tigard's Youth Councilor) | Form of Government | LOW — directly confirmed by the "Boards & Committees" page listing it alongside 10 other clearly-non-council advisory bodies |
| A6 | City Attorney and Municipal Court Judge are appointed (Council-appointed), not elected | Form of Government | LOW-MEDIUM — confirmed via WebSearch aggregation of the general "municipal judges are typically council-appointed" pattern, not a Tualatin-specific primary-source clause; consistent with every other OR council-manager city in this milestone |
| A7 | All 7 headshot source URLs (tualatinoregon.gov/app/uploads/2025/09/...) will remain stable and reachable at execution time | Headshot Sources | LOW-MEDIUM — the site is mid-redesign (evidenced by 2025/09 and 2026/02 upload directories and a staging-environment reference); a further redesign between this research date and execution could move these paths, though the pattern (WordPress media uploads) is generally stable |
| A8 | "Tualatin Commons daytime.JPG" (Wikimedia Commons, CC BY-SA 3.0) is a suitable, cleanly-licensed banner candidate | Community Banner | LOW — license and dimensions directly confirmed via the Wikimedia API; only the final compositional judgment (does the specific crop look good at 3.15:1) is untested until execution |
| A9 | Ext_id range -4174951..-4174957 is unused | Migration Reference | LOW — confirmed via live DB query in this session |
| A10 | Disk migration MAX is 1168 (next=1169) as of this research session, and this number belongs to an unrelated NC-elections migration rather than a prior WashCo phase | Migration Reference | LOW-MEDIUM — directly verified via `ls`, but the presence of an interleaved unrelated migration (1168) confirms the shared counter is actively used by other concurrent workstreams; a further migration could land between this research and Wave-0, so re-verification is mandatory, not optional, more so than in prior single-workstream phases |

---

## Open Questions

1. **Exact charter statutory clause text for Mayor's election and Council President's duties**
   - What we know: the city's own plain-English pages (`city-council/`, `city-council/elections/`) unambiguously answer the D-01/D-02/D-05/D-06 routing questions without needing the literal charter section numbers.
   - What's unclear: the precise charter section citation (e.g., "§X.Y") for a migration comment, since the old PDF path 404s and the Municode mirror is a JS SPA not fetchable via plain curl in this session.
   - Recommendation: Low priority — does not change any structural conclusion. If a precise citation is desired for migration-comment completeness, a fresh WebSearch/Municode-JS-render pass could be attempted at Wave-0, but the routing/roster conclusions in this document do not depend on it.

2. **Whether any council roster change occurred between this research session (2026-07-02) and plan/execution time**
   - What we know: no resignation, appointment, or Council President re-election was found in this session; the roster appears stable (no equivalent of Tigard's Sept–Dec 2025 turnover chain was found for Tualatin).
   - What's unclear: whether any change occurs between now and execution.
   - Recommendation: Wave-0 should re-fetch `tualatinoregon.gov/city-council/` fresh immediately before finalizing the roster — cheap to do given the direct, no-WAF access, and standard practice regardless of apparent stability.

3. **Whether the site's ongoing redesign will move the headshot upload paths before execution**
   - What we know: all 7 image URLs (`app/uploads/2025/09/...`) resolved cleanly with HTTP 200 in this session.
   - What's unclear: whether a further redesign push moves these paths.
   - Recommendation: Wave-0 headshot-retrievability spot-check (as Tigard's Plan 01 did for one official) should re-test at least 2–3 of the 7 URLs before committing to the full headshot pipeline script.

---

## Environment Availability

No new external tools needed beyond the existing project infrastructure. No new geofences to load (corrected city geo_id `4174950` already present from the v8.0 OR TIGER load — this research also confirms this directly, correcting the phase description's stated value).

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL / psql | Migration apply | Yes (via EV-Accounts .env, verified live this session) | PostgreSQL 18.1 client | — |
| tualatinoregon.gov | Roster + Headshots + Governance text | **YES — no WAF, direct HTTP 200 confirmed this session** | WordPress (recently redesigned) | Not needed |
| Wikimedia Commons | Community banner source | Yes — 1 strong primary candidate (license-confirmed) + 2 secondary candidates (license unconfirmed) | — | Unsplash fallback per pipeline doc |
| Python 3 + Pillow + requests | Headshot resize pipeline | Yes (existing `_tmp-*-headshots.py` pattern) | — | — |
| scripts/banners/process_banner.py + upload_banner.py | Community banner | Yes (proven on Beaverton/Hillsboro/Tigard/50 states) | — | — |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | SQL verification queries (inline psql, no test runner) |
| Config file | None — inline verification gates in plan |
| Quick run command | `psql $DATABASE_URL -c "SELECT COUNT(*) FROM essentials.offices o JOIN essentials.politicians p ON o.politician_id=p.id JOIN essentials.chambers ch ON o.chamber_id=ch.id WHERE ch.name='City Council' AND ch.government_id=(SELECT id FROM essentials.governments WHERE name='City of Tualatin, Oregon, US')"` |
| Full suite command | 9-check E2E gate (see below), extended with a banner-render check |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WASH-05 | Correct geo_id used (4174950, not 4175200) | SQL count | `SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE geo_id='4174950' AND mtfcc='G4110'` = 1 | Wave-0 inline — MUST run before any other probe |
| WASH-05 | 7 officials seeded with offices | SQL count | `SELECT COUNT(*)... = 7` | Wave-0 inline |
| WASH-05 | Mayor sorts first in display | SQL + live browse | `groupHierarchy.js` + human verify | Existing code |
| WASH-05 | 7 headshots at 600×750 in Storage | SQL count + CDN HTTP 200 | `SELECT COUNT(*) FROM essentials.politician_images WHERE...` | Wave-2 inline; expect 7/7 given confirmed direct-source retrievability (contrast Tigard's genuine-gap risk) |
| WASH-05 | Evidence-only stances render | SQL count + live browse | `SELECT COUNT(*) FROM inform.politician_answers WHERE politician_id=...` | Wave-3 inline |
| WASH-05 | Purple hasContext chip | Browser/live browse | `essentials.empowered.vote/results?browse_geo_id=4174950&browse_mtfcc=G4110` | Wave-3 human verify |
| WASH-05 | Community banner renders (not gradient fallback) | Browser/live browse | Same browse URL — Local section shows photo | Wave-3 human verify |
| WASH-05 | Section-split = 0 rows | SQL (WR-01-fixed canonical query) | Section-split query after seed | Wave-1 inline |
| WASH-05 | No duplicate government row | SQL | `SELECT COUNT(*) FROM essentials.governments WHERE name='City of Tualatin, Oregon, US'` = 1 | Wave-1 inline |

### 9-Check E2E Verification Gate (Wave-1 structural plan) + Banner Check (Wave-3)

1. `essentials.geofence_boundaries` row exists for geo_id='4174950' AND mtfcc='G4110' — **run this FIRST, before any other Wave-0 probe**, given the geo_id error found in this research
2. `governments` row count = 1 for name='City of Tualatin, Oregon, US'
3. `chambers` row exists with name='City Council', official_count=7
4. `districts` rows: exactly 1 LOCAL_EXEC + 1 LOCAL for geo_id='4174950' state='or'
5. `offices` count = 7 for Tualatin chamber, `representing_city='Tualatin'` set on all 7 (inline)
6. `politician_images` count for Tualatin politicians — target 7/7 (no genuine-gap risk expected, unlike Tigard)
7. `politician_answers` count ≥ 1 per official (honest blanks OK; 0 for any official = re-check)
8. Section-split query (WR-01-fixed canonical version) returns 0 rows for geo_id 4174950
9. Human-verify: live browse link shows Mayor first + all 6 councilors (Position 1-6), compass stances visible, no party label
10. (Wave-3 banner) Human-verify: Local section banner shows the Tualatin Commons photo, not the tier gradient fallback

### Wave 0 Gaps

- [ ] **DB probe (run first): confirm geo_id 4174950 (NOT 4175200) has exactly 1 G4110 row** — this research found the stated phase-description value to be wrong; re-verify the correction before writing any migration
- [ ] DB probe: confirm no existing government/chamber rows for Tualatin (name + corrected geo_id)
- [ ] DB probe: confirm ext_id range -4174951..-4174957 is unused
- [ ] DB probe / disk `ls`: re-confirm disk migration MAX (this research found 1168 → next 1169; note the interleaved unrelated NC migration — re-verify carefully)
- [ ] Fresh fetch of `tualatinoregon.gov/city-council/` to re-confirm the 7-member roster is unchanged since 2026-07-02
- [ ] Spot-check 2-3 of the 7 headshot URLs for continued retrievability (site is mid-redesign)
- [ ] View the "Tualatin Commons daytime.JPG" image directly before finalizing the banner choice (metadata-only judgment was used in this research)

---

## Sources

### Primary (HIGH confidence)
- `essentials.geofence_boundaries` / `essentials.districts` / `essentials.governments` / `essentials.politicians` live queries (psql, this session) — found the stated geo_id (4175200) does not exist; found and confirmed the correct geo_id (4174950); confirmed greenfield status; confirmed clean ext_id range.
- `https://tualatinoregon.gov/city-council/` — fetched directly via curl, HTTP 200, no WAF — full roster, bios, positions, election/reelection years, Council President designation, all 7 headshot image URLs.
- `https://tualatinoregon.gov/city-council/elections/` — fetched directly via curl, HTTP 200 — 2026 election-cycle incumbent/candidate table (used only as a term-date cross-check), term-limit rule (12-year/20-year), at-large confirmation language, Mayor's chairman-of-council role.
- `https://commons.wikimedia.org/w/api.php` (imageinfo query) — confirmed license (CC BY-SA 3.0) and dimensions (3655×2345) for "Tualatin Commons daytime.JPG"; confirmed dimensions for two alternate river candidates.
- `ls C:/EV-Accounts/backend/migrations | sort` — confirmed disk MAX is 1168 as of 2026-07-02.
- `inform.compass_topics` live query — confirmed 44 live topics, 8 of which are judicial-*, unchanged from prior phases.
- `C:/EV-Accounts/backend/migrations/1131_beaverton_city_council.sql` — direct structural/schema template (numbered-position title convention, district shape, no-appointed-seats pattern).
- `src/lib/buildingImages.js` / `src/lib/coverage.js` (read directly) — confirmed current CURATED_LOCAL and Oregon coverage.js block state.
- Tigard Phase 178 artifacts (178-RESEARCH.md, 178-PATTERNS.md, 178-01 through 178-05-SUMMARY.md) — WR-01/WR-02 fix precedent, migration-split shape, Wave-0 gate pattern, on-disk-vs-ledger counter trap.

### Secondary (MEDIUM confidence)
- WebSearch aggregation surfacing the (now-restructured) "Form of Government" city page text — Mayor's chairman-of-council role, general council-manager structure description; independently corroborated by the two directly-fetched primary sources above.
- WebSearch aggregation on municipal-judge appointment norms — City Attorney/Municipal Court Judge appointed, not elected; general pattern, not a Tualatin-specific primary-source clause.

### Tertiary (LOW confidence)
- `library.municode.com` charter mirror — confirmed reachable (HTTP 200) but is a JS-rendered Angular SPA not readable via plain curl in this session; not relied upon for any load-bearing claim.
- The old charter PDF path (`tualatinoregon.gov/sites/default/files/.../city_charter.pdf`) — confirmed 404 (stale, pre-redesign); not used.
- Wikimedia Commons alternate banner candidates (Panorama of Tualatin River / Browns Ferry Park) — dimensions confirmed but license not independently verified in this session; not the recommended primary choice.

---

## Metadata

**Confidence breakdown:**
- geo_id correction: HIGH — directly verified against live production DB via both a direct-value-miss and a name-search hit; unambiguous.
- Form of government (at-large, numbered positions, directly-elected Mayor): HIGH — directly quoted from two independent primary-source city pages fetched with zero WAF obstruction, cross-consistent with the 2026 election-cycle data.
- Roster (7 of 7 officials, names/positions/terms): HIGH — sourced directly from the official city roster page (not triangulated from third-party news, a stronger sourcing situation than Tigard); independently cross-confirmed by the election-cycle table.
- Headshot sourcing: HIGH — all 7 confirmed downloadable directly from the official source in this session; no fallback chain needed.
- Migration shape (schema): HIGH — directly inherited from the Beaverton template (closest structural analog: directly-elected mayor + numbered positions + no current appointments), with the Hillsboro/Tigard WR-01/WR-02/representing_city-inline improvements carried forward.
- Ext_id range + migration counter: HIGH — both independently confirmed live in this session; the migration counter carries a MEDIUM note given the interleaved unrelated NC migration demonstrates active concurrent use of the shared counter.
- Community banner: MEDIUM-HIGH — primary candidate's license and dimensions are directly confirmed; only the final compositional judgment is untested.

**Research date:** 2026-07-02
**Valid until:** 2026-07-16 (shorter than the usual 30-day window, consistent with the milestone's other recent-research validity windows, given the site's evidenced ongoing redesign and the standard risk of an unnoticed roster change before execution).
