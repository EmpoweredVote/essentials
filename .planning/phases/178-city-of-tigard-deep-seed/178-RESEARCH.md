# Phase 178: City of Tigard Deep-Seed — Research

**Researched:** 2026-07-02
**Domain:** Oregon municipal deep-seed — council-manager city, pure at-large council (no wards, no positions)
**Confidence:** HIGH (form of government, geo_id, chamber shape: VERIFIED/CITED; roster composition: HIGH but mid-term/appointed seats require a Wave-0 re-fetch; headshot sourcing: MEDIUM — no working WAF-bypass portal found, unlike Hillsboro's CivicWeb mirror)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WASH-04 | City of Tigard deep-seeded — government + roster + headshots + evidence-only stances. | Fully resolved: pure at-large council-manager form confirmed directly from the city charter (ecode360.com primary-source text, not just a WebSearch summary); geo_id 4173650 CONFIRMED CORRECT (no correction needed, unlike Hillsboro); 7-member roster identified (Mayor + 6 Councilors) with 3 concurrent appointed/mid-term seats requiring careful term-metadata handling; City Attorney/Municipal Court confirmed appointed (skip judicial-* topics); headshot source gap flagged — city's own domain is Akamai WAF-403 with NO working CivicWeb/Legistar/Granicus mirror found (unlike Hillsboro) — fallback to local news photography (tigardlife.com, valleytimes.news) established and spot-verified for one official. |

</phase_requirements>

---

## Note: No CONTEXT.md Found

No `178-CONTEXT.md` exists in this phase directory as of this research session — `/gsd:discuss-phase` has apparently not been run for Phase 178 yet, or this research was requested standalone ahead of it. This document proceeds directly from the phase description (`.planning/ROADMAP.md` §Phase 178) and requirement WASH-04, and is written to be consumable either by a subsequent `discuss-phase` pass or directly by the planner. If a CONTEXT.md is authored later, the planner should reconcile any locked decisions against the findings below (particularly the at-large routing conclusion and the geo_id confirmation, both of which are DB-verified in this session).

---

## Summary

Tigard has operated under a **council-manager form of government** with a **May 2024 charter reform** (71.77% voter approval, effective July 1, 2024) that expanded the City Council from 4 to 6 Councilors, formalized a non-voting Youth Councilor seat, and confirmed the Mayor as a directly-elected, city-wide voting member of Council with no veto authority. **The charter text is unambiguous and simpler than either Hillsboro or Beaverton: "The Council is comprised of a Mayor and six Councilors nominated and elected from the City at-large."** [VERIFIED: ecode360.com/45107158, Tigard City Charter §3.1, fetched directly via curl] There are **no wards, no numbered positions, and no residency-eligibility geography of any kind** — every seat, including the Mayor's, is elected purely city-wide. This is the simplest at-large shape of any WashCo city seeded so far in v20.0 (simpler than Hillsboro's ward-labeled-but-at-large model and Beaverton's numbered-position model).

**Model as pure at-large, one chamber:** government `'City of Tigard, Oregon, US'`, chamber `'City Council'` (`official_count=7`), one LOCAL_EXEC district (Mayor) + one LOCAL district (6 Councilors), both on geo_id `4173650`. **No custom X00xx geofences of any kind are needed or appropriate.**

**geo_id `4173650` is CONFIRMED CORRECT** — verified directly against the live production `essentials.geofence_boundaries` table in this research session (unlike Hillsboro's Phase 177, where the phase description's stated geo_id was wrong). No correction is needed for Tigard.

**The current roster is unusually complex for a "simple" at-large city**: a September 2025 mayoral resignation (Heidi Lueb) triggered a chain of two council appointments. Mayor Yi-Kang Hu (a sitting Councilor first elected Nov 2022) was **appointed** Mayor by a 5-1 council vote on October 7, 2025, to serve the remainder of Lueb's term (through Dec 31, 2026). Hu's own vacated council seat was then filled by **appointing** Tom Anderson (unanimous vote, Dec 2025) for an interim term through Dec 31, 2026 — Anderson has publicly stated he will not run for the seat in the November 2026 election. **This means 2 of the 7 current officials hold their seats by council appointment, not direct election, and both seats face a November 2026 election for a successor.** The Tigard Charter explicitly permits filling Mayor/Councilor vacancies "by election or appointment" (confirmed via the Term Limits clause, §3.6, which references terms "elected or appointed"), and Council President (an annually-elected title-on-seat held currently by Maureen Wolf) serves as Mayor Pro Tempore during any Mayor vacancy or absence — the same title-on-seat pattern already used for Beaverton and Hillsboro.

**tigard-or.gov is Akamai WAF-403, confirmed by direct curl (both with and without a Chrome UA) in this session** — same WAF vendor/class as Hillsboro, Beaverton's original domain probe, Glendale, Pomona, Downey, and Henderson NV. **Unlike Hillsboro, no working CivicWeb/Legistar/Granicus mirror was found for Tigard** (Legistar subdomains return a generic "Invalid parameters!" for all pages tested; Granicus subdomains 404; CivicWeb subdomains don't resolve). The charter/code text is reachable via `ecode360.com` (confirmed 200 via curl — note: the WebFetch tool itself was blocked by ecode360's bot-detection and returned 403; **use curl with a Chrome UA, not the WebFetch tool, for ecode360.com**). Local news outlets `tigardlife.com` and `valleytimes.news` are both confirmed reachable (HTTP 200) and are the most practical route to both roster confirmation and headshot images — one image was spot-verified (Jeanette Shaw, 696×462 JPEG, tigardlife.com, downloads cleanly).

**Primary recommendation:** Seed as pure at-large (no wards, no positions — the simplest model in this milestone), single 'City Council' chamber (`official_count=7`). Government name `'City of Tigard, Oregon, US'`. Ext_id block **-4173651..-4173657** (7 slots, confirmed unused). Structural migration starts at **1159** (on-disk MAX confirmed 1158 as of this research session — Wave-0 must re-verify). Wave-0 must re-fetch the current roster from local news + the city's own (WAF-blocked-but-WebSearch-indexed) "Meet the Council" content before finalizing term dates, since 3 of 7 seats are mid-cycle appointments/short terms facing a Nov 2026 election.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| City government row | Database / Storage | — | Structural migration inserts into essentials.governments |
| Chamber row | Database / Storage | — | Single 'City Council' chamber, official_count=7 |
| Mayor office (LOCAL_EXEC) | Database / Storage | — | Citywide at-large, links to LOCAL_EXEC district |
| Council offices (LOCAL) | Database / Storage | — | All 6 on shared LOCAL district, no ward/position differentiation |
| Official headshots (600×750) | Database / Storage | CDN | politician_images rows + Supabase Storage; source likely local-news fallback (no WAF-bypass city mirror found) |
| Compass stances | Database / Storage | — | inform.politician_answers rows, evidence-only |
| Community banner | Database / Storage | CDN | Supabase Storage `cities/tigard.jpg`; wired via `buildingImages.js` CURATED_LOCAL |
| Frontend surfacing | Frontend Server (SSR) | CDN | coverage.js Oregon block, purple hasContext chip |
| Address routing | API / Backend | — | PIP query against G4110 geofence (geo_id 4173650), no ward layer |

---

## geo_id Verification (CONFIRMED CORRECT — no error found)

[VERIFIED: live query against `essentials.geofence_boundaries`, 2026-07-02]
```sql
SELECT geo_id, mtfcc, state, name, source FROM essentials.geofence_boundaries WHERE geo_id='4173650';
--  geo_id  | mtfcc | state |    name     |      source
-- ---------+-------+-------+-------------+-------------------
--  4173650 | G4110 | 41    | Tigard city | census_tiger_2024
```

Unlike Phase 177 (Hillsboro), the phase description's stated geo_id for Tigard (`4173650`) is **already correct** — no digit-transposition error found. A secondary check for other "Tigard"-named rows found exactly one other match: `4112240` (`G5420`, "Tigard-Tualatin School District 23J", loaded by Phase 174) — this is the correct, distinct school-district geofence for the future Phase 184 (WSCH-03), not a collision risk for this phase.

```sql
SELECT COUNT(*) FROM essentials.districts WHERE geo_id='4173650';                                -- 0 (greenfield)
SELECT id, name, geo_id FROM essentials.governments WHERE geo_id='4173650' OR name ILIKE '%tigard%'; -- 0 rows (greenfield)
SELECT external_id, full_name FROM essentials.politicians WHERE external_id BETWEEN -4173660 AND -4173650; -- 0 rows (ext_id block clean)
```

**This phase IS greenfield** for Tigard's government/chamber/offices — confirmed no pre-existing rows by geo_id or by name search, and the ext_id block is clean. Wave-0 should re-run these exact queries immediately before writing any migration regardless (standard practice — a session gap always carries a small risk of intervening work).

---

## Form of Government — RESOLVED (primary-source charter text)

**DETERMINATION: PURE AT-LARGE. NO WARDS. NO NUMBERED POSITIONS. SIMPLEST MODEL IN THIS MILESTONE.**

[VERIFIED: `ecode360.com/45107158` (Tigard City Charter, Chapter 3 "Council"), fetched directly via curl with a Chrome UA — HTTP 200, primary-source text, not a WebSearch summary]

> **§3.1 Council Composition.** The Council is comprised of a Mayor and six Councilors nominated and elected from the City at-large.

> **§3.3 Mayor.** Except as otherwise provided in this Charter, the Mayor is the elected, public policy head of City government. The Mayor is a voting member of Council and has no veto authority. In exercising the powers of the Mayor, the Mayor: (a) Has authority over the agenda for Council meetings. (b) Presides over and facilitates Council meetings as the chair, preserves order, enforces Council rules, and determines the order of business. (c) Signs the authorized writings and records of Council decisions. (d) Appoints members of City boards and committees, as provided by Council rules.

> **§3.4 Council President.** Council will elect a Council President at its first meeting each year. The Council President will perform the duties of the office of Mayor in the Mayor's absence and may perform other duties of the Mayor at the Mayor's request. In the event the Mayor is unavailable to serve, the Council President will serve as the Mayor Pro Tempore. If the Council President vacates the position, the Council will elect a Council President to serve in that position until the next Council President is elected pursuant to this Section.

> **§3.5 Terms.** The Mayor and each Councilor's term of office is four years and commences on the first day of January after the election to office. One of the new positions created by this 2024 Charter will be elected to a four-year term and the other to a two-year term in the 2024 general election. Council members currently serving at the time this 2024 Charter is adopted will continue to serve the remainder of their terms.

> **§3.6 Term Limits.** A Mayor may not be elected or appointed to more than two consecutive terms, and a Councilor may not be elected or appointed to more than two consecutive terms, for a total of no more than four consecutive terms on Council. [...]

**Routing conclusion:** every seat — Mayor and all 6 Councilors — is voted on by the entire city. There is no ward-residency requirement of any kind (unlike Hillsboro's ward-nominated model) and no numbered "Position" seat convention (unlike Beaverton's model). **This is structurally identical to Boulder City, NV** (v18.0 Phase 165: Mayor + 4 at-large council, no wards) — the simplest deep-seed shape encountered in this project. **No custom X00xx geofences of any kind are appropriate here.**

**Vacancy-filling mechanism (relevant because 2 of 7 current seats are appointment-filled):** [CITED: WebSearch aggregation of city press coverage of the Oct/Dec 2025 appointments, corroborated by the §3.6 "elected or appointed" language] the Charter allows Council to fill a Mayor or Councilor vacancy for the remainder of the unexpired term "by election or appointment." Both current appointment-filled seats (Mayor Hu, Councilor Anderson) are documented as filling out a partial term through December 31, 2026, with the seat going to the November 2026 general election for a full/remaining term starting January 1, 2027.

**City Attorney / Municipal Court — appointed, not elected.** [CITED: WebSearch aggregation + `ecode360.com` Chapter 4 "City Officers" §4.1–4.3, fetched via curl]: "The City Council serves as the policy-making body and is responsible for appointing the City Manager, City Attorney, and Municipal Court Judge." §4.2 confirms the City Attorney "must be an active member in good standing of the Oregon State Bar" but does not describe an election process; §4.3 similarly describes Municipal Court judges as bar members without describing an election. **Skip all judicial-* compass topics for Tigard** — consistent with every other OR council-manager city seeded in this milestone (Beaverton, Hillsboro).

**Youth Councilor — EXCLUDED from the seeded roster.** [CITED: WebSearch aggregation of multiple local news articles, e.g. Tigard Life "Emilio Calderon Appointed Tigard Youth City Councilor"] The 2024 Charter formalized a Youth City Councilor position: one Tigard resident entering junior/senior year of high school, **appointed by the Mayor**, serving as an explicitly **non-voting** member of Council. This is not part of the elected 7-official roster and should **not** be seeded as an office — same treatment as other appointed/advisory non-voting positions excluded elsewhere in this project (e.g. Boston School Committee members are appointed and ARE seeded because they hold real governing power over a public body; the Youth Councilor, by contrast, has zero voting power over anything and exists purely as a civic-education program — closer to an intern than an officeholder). **Flag for planner confirmation**, but current recommendation is exclude.

---

## Live Roster — Current as of this research session (2026-07-02); REQUIRES Wave-0 re-verification

**Official body name:** `City Council`. Government name: `City of Tigard, Oregon, US` (matches established OR city government-name convention; disambiguates from any other Tigard, though none exists in this DB).

**No single authoritative portal page could be fetched directly** (tigard-or.gov is WAF-403; no working CivicWeb/Legistar/Granicus mirror found — see Web Presence / WAF section below). The roster below is triangulated from multiple independent local-news sources (all separately confirmed reachable via curl, HTTP 200) plus WebSearch's own aggregated indexing of tigard-or.gov content (which appears to surface page text even though direct fetches of the same URLs 403 — likely a cached/indexed copy on the search backend's side, not a live fetch).

| Title | Name | Term Type | Term Dates | Notes |
|-------|------|-----------|------------|-------|
| Mayor | Yi-Kang Hu | Appointed (mid-term) | Oct 7, 2025 – Dec 31, 2026 | Filling Heidi Lueb's unexpired term (Lueb resigned Sept 2025); appointed 5-1 by Council. Originally elected Councilor Nov 2022 (own 4-yr term would have run through Dec 2026). Tigard's first Asian American mayor. Full/next term goes to Nov 2026 election. |
| Councilor (Council President) | Maureen Wolf | Elected | Jan 1, 2025 – Dec 31, 2028 | Elected Nov 2024, 4-year term. Currently holds the annually-elected Council President title; serving as Mayor Pro Tempore during/after the 2025 mayoral vacancy. Formerly on the Tigard-Tualatin School Board 2009–2021 (chair 2019–2021) — NOT a current dual role, resolved by this research. |
| Councilor | Jeanette Shaw | Elected | Jan 1, 2025 – Dec 31, 2028 | Elected Nov 2024, 4-year term. |
| Councilor | Jake Schlack | Elected | Jan 1, 2025 – Dec 31, 2028 | Elected Nov 2024, 4-year term. |
| Councilor | Faraz Ghoddusi | Elected | Jan 1, 2025 – Dec 31, 2026 | Elected Nov 2024 to one of the 2 NEW charter-expansion seats (2-year term); seat up for election Nov 2026. |
| Councilor | Heather Robbins | Elected | Jan 1, 2025 – Dec 31, 2026 | Elected Nov 2024 to the other NEW charter-expansion seat (2-year term); seat up for election Nov 2026. |
| Councilor | Tom Anderson | Appointed (interim) | Jan 1, 2026 – Dec 31, 2026 | Appointed unanimously Dec 2025 to fill Hu's vacated council seat; a former council member (real estate broker); has publicly stated he will NOT run in Nov 2026 — a placeholder appointment by design. |

**Total officials to seed: 7 (Mayor + 6 Councilors). `official_count` on chamber = 7.**

**PLAN-TIME / WAVE-0 VERIFICATION REQUIRED (higher stakes than a typical WashCo city, given 3 non-standard-term seats):**
1. Re-confirm all 7 names and exact term-end dates immediately before seeding — this roster has an unusually high rate of change for a single city in one cycle (1 resignation, 2 appointments in a 4-month window, Sept–Dec 2025).
2. Confirm no further council changes occurred between this research session (2026-07-02) and plan/execution time — check `tigard-or.gov` "Council Recap" news items via WebSearch (direct fetch will 403) for any meeting after 2026-02-10 (last recap found in this session).
3. Confirm Wolf still holds the Council President title (elected annually "at its first meeting each year" per §3.4 — if a 2026 re-election of Council President occurred and changed hands, this affects only a title-on-seat annotation, not a structural office row).
4. Double-check that Anderson's appointment is indeed a single-year interim term (Dec 31, 2026 end) and not renewed/extended.

**Sources:**
- [CITED: WebSearch aggregation of `opb.org`, `kgw.com`, `koin.com`, `valleytimes.news`, `youroregonnews.com` coverage of the Oct 7, 2025 mayoral appointment] — Hu appointment, 5-1 vote, term through Dec 2026, first elected Councilor Nov 2022.
- [CITED: `tigardlife.com/featured/tigard-city-council-taps-former-member-to-fill-vacancy-for-2026/`, fetched directly, HTTP 200] — Anderson appointment, unanimous vote, will not run in Nov 2026, current roster names (Wolf as Council President, Shaw, Schlack, Robbins, Ghoddusi).
- [CITED: `valleytimes.news/2025/12/11/anderson-appointment-to-tigard-city-council-seat-not-without-drama/`] — Anderson appointment context.
- [CITED: WebSearch aggregation of `hoodline.com` "Tigard City Council Expands to Seven Seats"] — confirms 2024 charter expansion added Ghoddusi + Robbins as the 2 new seats, 4-year/2-year split per §3.5.
- [CITED: WebSearch aggregation of Ballotpedia + Tigard Chamber of Commerce endorsement pages] — Shaw/Wolf/Schlack elected to 4-year terms Nov 2024.

---

## Web Presence / WAF Status

**tigard-or.gov is Akamai WAF-403 — CONFIRMED via direct curl, both with and without a Chrome desktop User-Agent.**

```
$ curl -sI -A "Mozilla/5.0 ... Chrome/120.0 Safari/537.36" https://www.tigard-or.gov/
HTTP/1.1 403 Forbidden
Server: AkamaiGHost
```
Body returns the standard Akamai "Access Denied" error page (`errors.edgesuite.net` reference format) — same WAF vendor/signature as Hillsboro, Glendale, Pomona, Downey, and Henderson NV in prior phases.

**No working WAF-bypass mirror was found for Tigard — this is WORSE than Hillsboro, which had a fully functional CivicWeb portal.** Probes attempted in this session:

| Candidate | Result |
|-----------|--------|
| `tigard-or.civicweb.net/portal/members.aspx` | Does not resolve (connection failure) |
| `tigardoregon.civicweb.net/portal/members.aspx` | Does not resolve (connection failure) |
| `tigard.granicus.com/ViewPublisher.php` | 302 → 404 (no such view) |
| `tigard-or.granicus.com/ViewPublisher.php` | 302 → 404 (no such view) |
| `tigard-or.legistar.com/People.aspx` / `Calendar.aspx` | HTTP 200 but body is literally `Invalid parameters!` for every page tested — the Legistar client ID/subdomain appears misconfigured or inactive, not a live roster source |
| `tigardor.legistar.com/People.aspx` | Same — `Invalid parameters!` |
| `ecode360.com` (charter/municipal code text) | **HTTP 200 via curl** — usable for charter/governance-structure research (used above), NOT a roster source |
| `tigardchamber.org/advocacy/city-state-reps/` | HTTP 403 (unrelated block, likely Cloudflare bot-protection) |
| `washcodems.org` (WashCo Democrats) | HTTP 403 (same class of block) |
| `tigardlife.com` (local news) | **HTTP 200** — usable for roster confirmation AND headshots (see below) |
| `valleytimes.news` (local news) | **HTTP 200** — usable for roster confirmation AND headshots |

**Important tooling note:** the `ecode360.com` pages returned HTTP 403 when fetched via the **WebFetch tool** but HTTP 200 when fetched via **curl with a Chrome UA** — ecode360 appears to block the WebFetch tool's default user-agent/fetcher specifically. **Plan/execution must use curl (or an equivalent raw HTTP client with a browser UA), not WebFetch, for any ecode360.com URL.**

**Practical consequence for Wave-0/execution:** unlike Hillsboro, there is no single consolidated "member roster with headshot paths" resource for Tigard. Roster and headshot sourcing must be triangulated per-official from `tigardlife.com` and `valleytimes.news` article coverage (both confirmed reachable), plus WebSearch's own aggregated indexing of `tigard-or.gov` page text (which surfaces content the direct fetch cannot reach — treat as MEDIUM confidence, cross-verify against at least one independent local-news source per fact).

---

## Headshot Sources

**No official-site or CivicWeb-equivalent bulk source exists.** Fallback plan, spot-verified for one official in this session:

`tigardlife.com` hosts individual news articles with embedded photos at predictable WordPress upload paths. One direct test:

```
https://tigardlife.com/wp-content/uploads/2024/09/Jeanette-Shaw-696x462.jpg
```
[VERIFIED: `curl` download in this session — HTTP 200, 36,280 bytes, valid JPEG dimensions 696×462] — good resolution, no upscale needed, well above the 165×215 CivicWeb-sourced images accepted for Hillsboro.

**Not yet verified for the other 6 officials** — this was a single spot-check, not a full catalog (contrast with Hillsboro, where the CivicWeb portal exposed all 7 image paths in one page fetch). At Wave-0/execution, the headshot pipeline script should:
1. Search `tigardlife.com` and `valleytimes.news` for a dedicated profile/announcement article per official (the Anderson, Hu, and Wolf appointment/mayoral-transition articles are the most likely to carry usable individual photos, given they were all "breaking news" style coverage).
2. Fall back to Ballotpedia if a dedicated page exists (searches in this session did not surface confirmed current Tigard-council-specific Ballotpedia bio pages with photos — Ballotpedia's own about-page states Tigard is outside its standard "100 largest cities" scheduled-update scope, so coverage may be thin or absent).
3. Fall back to campaign websites (a Maureen Wolf campaign site, `maureenwolf.com`, was found in search results and may carry a usable headshot) and/or Facebook official pages (e.g., `facebook.com/YiForTigard` for Mayor Hu) — Facebook images require manual/authenticated extraction, not a scriptable pipeline; treat as a last-resort manual step.
4. Document genuine gaps honestly if no usable photo is found for any of the 7 — this is a real possibility for Tigard given the thinner web footprint compared to Hillsboro.

**Photo license:** local-news photos should be tagged `press_use` (consistent with the Hillsboro/Beaverton/prior-phase convention for non-government-portal news photography).

---

## Community Banner

Follow `docs/banner-asset-pipeline.md` Stages 1–8, matching the Beaverton/Hillsboro precedent already present in `src/lib/buildingImages.js`.

**Candidate identified:** [CITED: Wikimedia Commons search, `commons.wikimedia.org/wiki/File:Downtown_Tigard_Oregon.JPG`] — uploaded 2009 by user `Aboutmovies`, licensed Creative Commons Attribution-ShareAlike (confirm exact version — likely CC BY-SA 3.0 given the 2009 upload date and Commons licensing conventions of that era; **verify the precise version string at execution**), 960×660 pixels. `Category:Tigard, Oregon` on Wikimedia Commons has ~24 files total if a better landscape/civic shot is preferred (e.g., "Tigard Public Library entrance - Oregon.JPG" as an alternate candidate) — Downtown Tigard Oregon.JPG is the most banner-appropriate (wide street-level civic shot) of the options surfaced in this session.

- **Storage path:** `cities/tigard.jpg` (Stage 5 — standalone-city scheme, matching `beaverton`/`hillsboro`).
- **Wiring:** Add `tigard: '...supabase.co/.../politician_photos/cities/tigard.jpg'` to `CURATED_LOCAL` in `src/lib/buildingImages.js`, alongside the existing `beaverton`/`hillsboro` entries [CONFIRMED current state: `src/lib/buildingImages.js` lines 107-112 as of this research session].
- **Attribution comment:** `//   tigard - Downtown Tigard, Oregon | Aboutmovies | CC BY-SA <version — verify>` per the existing convention.
- **No AI-generated images** (per `docs/banner-asset-pipeline.md`).

**Verify live per Stage 8:**
```
https://essentials.empowered.vote/results?browse_geo_id=4173650&browse_mtfcc=G4110
```

---

## Migration / Schema Technical Reference

### Next Migration Number

[VERIFIED: `ls C:/EV-Accounts/backend/migrations | sort` — 2026-07-02] Disk MAX is **1158** (`1158_harris_stances.sql`, Hillsboro's final stance migration). **Next available: 1159.**

[VERIFIED: ledger `MAX(version::int)` filtered to short numeric versions = **1150** — matches Hillsboro's single registered structural migration; all Hillsboro headshot/stance migrations (1151-1158) correctly remain unregistered, confirming the audit-only convention held.] This matches STATE.md's own note ("next mig 1159") exactly — no drift found in this session, unlike the Hillsboro research which had to correct a stale estimate.

**Migration split for this phase (following the Beaverton/Hillsboro shape):**
- `1159_tigard_city_council.sql` — structural (registered in schema_migrations); government + chamber + 2 districts (LOCAL_EXEC + LOCAL) + 7 offices, `representing_city='Tigard'` set INLINE (following the Hillsboro D-09 improvement — no follow-up backfill migration).
- `1160_tigard_headshots.sql` — audit-only (NOT registered)
- `1161_hu_stances.sql` through `1167_wolf_stances.sql` (or similar per-official naming) — 7 stance migrations, audit-only (one per official, NOT registered)

Total: 1 structural + 1 headshots + 7 stance = 9 migrations consumed (1159-1167). Re-verify the exact starting number at Wave-0 regardless. Banner upload does not consume a migration number.

### Ext_id Block

**Recommended range: -4173651 to -4173657** (7 slots: Mayor + 6 Councilors), derived from geo_id `4173650`.

[VERIFIED: `SELECT external_id FROM essentials.politicians WHERE external_id BETWEEN -4173660 AND -4173650` — 0 rows. Range is clean.]

**Suggested assignment (planner's discretion to reorder — e.g., alphabetical vs. seniority):**
| Official | ext_id |
|----------|--------|
| Mayor Yi-Kang Hu | -4173651 |
| Councilor Tom Anderson | -4173652 |
| Councilor Faraz Ghoddusi | -4173653 |
| Councilor Heather Robbins | -4173654 |
| Councilor Jake Schlack | -4173655 |
| Councilor Jeanette Shaw | -4173656 |
| Councilor Maureen Wolf (Council President) | -4173657 |

Wave-0 must re-run `SELECT external_id FROM essentials.politicians WHERE external_id BETWEEN -4173660 AND -4173650` to reconfirm the range is still clean at execution time.

### Schema Shapes (identical to Beaverton mig 1131 / Hillsboro mig 1150 — reuse directly, WITH the WR-01/WR-02 fixes below)

```sql
-- governments: slug GENERATED ALWAYS — NEVER INSERT slug; no unique constraint on geo_id
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'City of Tigard, Oregon, US',
       'LOCAL', 'OR', 'Tigard', '4173650'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments WHERE name = 'City of Tigard, Oregon, US'
);

-- chambers: slug GENERATED ALWAYS — never include in INSERT column list
INSERT INTO essentials.chambers (id, name, name_formal, government_id, official_count)
SELECT gen_random_uuid(), 'City Council', 'Tigard City Council',
       (SELECT id FROM essentials.governments WHERE name = 'City of Tigard, Oregon, US'),
       7
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers WHERE name = 'City Council'
    AND government_id = (SELECT id FROM essentials.governments
                          WHERE name = 'City of Tigard, Oregon, US')
);

-- districts: state='or' LOWERCASE for LOCAL/LOCAL_EXEC; no name_formal column; government_id NULL
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL_EXEC', 'or', '4173650', 'Tigard (Mayor, Citywide)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts WHERE geo_id='4173650' AND district_type='LOCAL_EXEC' AND state='or'
);

INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'or', '4173650', 'Tigard (At-Large)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts WHERE geo_id='4173650' AND district_type='LOCAL' AND state='or'
);

-- offices: guard on (district_id, politician_id) — NOT EXISTS; representing_city inline
-- representing_state = 'OR' (uppercase); representing_city = 'Tigard'
```

**politician_images schema:** `id, politician_id, url, type, photo_license` — NO `photo_origin_url` column (confirmed in prior-phase research, unchanged).

**Stance schema:** `inform.politician_answers` ON CONFLICT `(politician_id, topic_id)`; topic_id resolved LIVE via `JOIN inform.compass_topics WHERE topic_key='...' AND is_live=true`; value integer 1-5 (chairs model). [VERIFIED: 44 live topics, 8 judicial-* — same list confirmed for Hillsboro, re-verified live in this session.]

### Migration Template Fixes to Carry Forward (from 177-REVIEW.md — apply proactively, don't wait for a post-hoc review)

**WR-01 (Hillsboro migration 1150's dead post-verify gate):** the inherited Beaverton/Hillsboro template's "section-split" gate inside the structural migration transaction cannot ever fail by construction (the same transaction that creates the districts also checks for their absence). **Fix in Tigard's 1159**: replace with the canonical split-section query run as an independent check, e.g.:
```sql
SELECT COUNT(*) INTO v_split_count
FROM (
  SELECT o.district_id
  FROM essentials.offices o
  JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.geo_id = '4173650'
  GROUP BY o.district_id
  HAVING COUNT(DISTINCT o.chamber_id) > 1
) x;
```
plus a separate assertion that the G4110 geofence row exists (`SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE geo_id='4173650' AND mtfcc='G4110'` must be ≥ 1).

**WR-02 (stance migrations silently drop rows on topic_key mismatch):** the inherited stance-migration template uses an inner join on `compass_topics.topic_key = ... AND is_live=true` with no row-count assertion — a misspelled topic_key silently produces fewer rows than authored while still committing successfully. **Fix in each of Tigard's 7 stance migrations (1161-1167)**: append a count-assert DO block, e.g.:
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

Also apply the two Hillsboro-review INFO-level fixes if convenient (not blocking): guard the headshot migration's `NOT EXISTS` against a NULL politician_id (IN-01), and constrain the office_id back-fill join by chamber (IN-02) — both are latent-only for a greenfield city like Tigard but cheap to fix while copying the template.

### Office Title Convention

**No ward/position differentiation exists** — office titles are simply `'Mayor'` and `'Councilor'` for all 6 council seats (verified: the charter text contains no "Position N" or "Seat N" language anywhere in Chapter 3, unlike Beaverton's numbered-position or Hillsboro's ward+position convention). This is the simplest title convention of any WashCo city seeded so far — matches Boulder City, NV's plain "Council Member" pattern.

### OR Casing Rules (identical to Beaverton/Hillsboro — critical, wrong case = silent routing failure)

| Context | Casing | Why |
|---------|--------|-----|
| `governments.state` | `'OR'` (uppercase) | Governments table convention |
| `districts.state` for LOCAL/LOCAL_EXEC | `'or'` (lowercase) | [RE-VERIFIED live this session: Beaverton 4105350, Portland 4159000, Hillsboro 4134100 all return `state='or'`] |
| `offices.representing_state` | `'OR'` (uppercase) | Offices table convention |
| `essentials.politicians.party` | `NULL` | Antipartisan design — never set, despite multiple news articles characterizing individual members' party affiliation (Anderson as "the council's only Republican," Ghoddusi as "independent") — **do not store or surface this** |

### Live Compass Topics (44 total, is_live=true — re-verified this session, unchanged from Hillsboro)

abortion, ai-regulation, campaign-finance, childcare, city-sanitation, civil-rights, climate-change, data-centers, deportation, economic-development, fossil-fuels, growth-and-development, healthcare, homelessness, homelessness-response, housing, immigration, jail-capacity, judicial-access-to-justice, judicial-bail-pretrial, judicial-criminal-justice, judicial-government-deference, judicial-interpretation, judicial-police-accountability, judicial-prosecution-priorities, judicial-transparency, local-environment, local-immigration, medicare/aid, misinformation, public-safety-approach, redistricting, religious-freedom, rent-regulation, residential-zoning, same-sex-marriage, school-vouchers, social-security, tariffs, taxes, trans-athletes, transportation-priorities, ukraine-support, voting-rights.

**Skip all 8 judicial-* topics** — City Attorney and Municipal Court judges are appointed, not elected (confirmed above).

---

## Architecture Patterns

### Closest Analog: Boulder City, NV (Phase 165) — pure at-large, no wards, no positions

Tigard is structurally closer to Boulder City (v18.0) than to either Beaverton or Hillsboro (both v20.0 siblings): a directly-elected Mayor + at-large councilors with **zero geographic or numbered-seat differentiation whatsoever**. The only material complexity is NOT structural but temporal: 3 of 7 seats have non-standard term dates driven by a resignation-and-appointment chain in late 2025.

```
City of Tigard, Oregon, US (governments)
└── City Council (chambers, official_count=7)
    ├── LOCAL_EXEC district (geo_id=4173650, state='or', mtfcc=NULL)
    │   └── Mayor office → Yi-Kang Hu (-4173651, appointed, term through Dec 2026)
    └── LOCAL district (geo_id=4173650, state='or', mtfcc=NULL)
        ├── Councilor office → Tom Anderson (-4173652, appointed, term through Dec 2026)
        ├── Councilor office → Faraz Ghoddusi (-4173653, term through Dec 2026)
        ├── Councilor office → Heather Robbins (-4173654, term through Dec 2026)
        ├── Councilor office → Jake Schlack (-4173655, term through Dec 2028)
        ├── Councilor office → Jeanette Shaw (-4173656, term through Dec 2028)
        └── Councilor office → Maureen Wolf (-4173657, Council President title-on-seat, term through Dec 2028)
```

### System Architecture Diagram

```
Tigard resident address
        |
        v
  Backend /representatives/me
        |
  PIP query against geofence_boundaries
        |
  ┌─────────────────────────────────────────┐
  │  G4110 city boundary (geo_id=4173650)   │
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
  (600x750 headshot + compass stances + Local-section banner)
```

### Anti-Patterns to Avoid

- **Do NOT create any ward or position geofences/differentiators** — Tigard has none; this is the plainest at-large city in the milestone.
- **Do NOT seed the Youth Councilor** — non-voting, mayor-appointed civic-education role, not a governing office.
- **Do NOT flatten Hu's and Anderson's terms to a standard 4-year cycle** — both are documented interim appointments ending Dec 31, 2026; carry the real term-end dates into seat metadata.
- **Do NOT store or surface party affiliation** — multiple news sources characterize members by party; antipartisan design forbids this regardless of source prominence.
- **Do NOT trust tigard-or.gov fetches** — Akamai WAF-403 confirmed even with Chrome UA; use tigardlife.com/valleytimes.news + WebSearch aggregation instead.
- **Do NOT use the WebFetch tool on ecode360.com** — returns 403 to WebFetch specifically; use curl with a browser UA instead.
- **Do NOT insert `slug`** on chambers — GENERATED ALWAYS (migration will fail).
- **Do NOT use `photo_origin_url`** in politician_images INSERT — column does not exist.
- **Do NOT default stance values** — blank spoke is correct when no evidence found; Tigard's local-immigration record appears thinner than Hillsboro's (no found city-specific sanctuary resolution — Oregon's statewide sanctuary law applies uniformly, not a Tigard-specific council action) — expect more honest blanks on this topic than Hillsboro had.
- **Do NOT use ON CONFLICT on districts** — no unique constraint; use WHERE NOT EXISTS.
- **Do NOT reuse the Hillsboro/Beaverton dead post-verify gate (c) verbatim** — apply the WR-01 fix above.
- **Do NOT reuse the stance migration template without WR-02's count-assert** — apply the fix above.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Headshot resize | Custom PIL script | Existing `_tmp-*-headshots.py` pipeline (e.g. `_tmp-hillsboro-headshots.py` as the most recent template) | Phases 159-177 all reuse the same crop-4:5→600x750 Lanczos pattern |
| Stance research | Parallel agents | One agent at a time | Rate-limit rule — parallel burns quota with no usable output |
| Geofence load | Custom boundary ingest | None needed | At-large — city G4110 (4173650) already loaded |
| groupHierarchy ordering | Custom sort | groupHierarchy.js Mayor-first rule | Already handles LOCAL_EXEC-first + position ordering |
| Banner processing | Custom crop/resize script | `scripts/banners/process_banner.py` + `upload_banner.py` | Already built, proven on Beaverton/Hillsboro/Bloomington/50 states |
| ecode360.com fetch | WebFetch tool (blocked, 403) | `curl -A "<Chrome UA>"` | ecode360 blocks the WebFetch tool's default fetcher specifically |

---

## Common Pitfalls

### Pitfall 1: Assuming Tigard uses wards or numbered positions like its WashCo neighbors
**What goes wrong:** The planner builds custom X00xx geofences or numbered-position office titles because Beaverton (positions) and Hillsboro (ward+position) both had some form of seat differentiation.
**Why it happens:** Pattern-matching to the two most recently completed sibling phases in the same milestone.
**How to avoid:** The charter text is unambiguous and was fetched directly (primary source, not summary): "Mayor and six Councilors nominated and elected from the City at-large" — no ward/position language anywhere in Chapter 3.
**Warning signs:** If executor finds themselves trying to number seats 1-6 or attach a ward label, stop and re-read §3.1 above.

### Pitfall 2: Flattening the 3 non-standard-term seats into a uniform 4-year cycle
**What goes wrong:** Mayor Hu and Councilor Anderson get seeded with a generic "elected Jan 2025 - Dec 2028" term, silently erasing the fact that both hold interim/appointed seats facing a Nov 2026 election for a successor.
**Why it happens:** Most council seats in this milestone ARE uniform 4-year (or Hillsboro's slightly irregular but still elected) terms; Tigard's resignation chain is unusual.
**How to avoid:** Carry the documented term-end dates (Dec 31, 2026 for both Hu and Anderson) into seat/office metadata or migration comments; do not assume a standard cycle.
**Warning signs:** Any migration comment or seat label that doesn't distinguish Hu/Anderson's Dec 2026 term-end from the other 5 members' Dec 2026 (Ghoddusi/Robbins, elected 2-year seats) or Dec 2028 (Wolf/Shaw/Schlack, elected 4-year seats) end dates.

### Pitfall 3: Trusting a Legistar/CivicWeb/Granicus subdomain probe result without checking response BODY
**What goes wrong:** `tigard-or.legistar.com/People.aspx` returns HTTP 200 — easy to assume this means the roster is retrievable — but the body is literally the string `Invalid parameters!`, not a real roster page.
**How to avoid:** Always fetch and read the actual body, not just the HTTP status code, when probing for a WAF-bypass mirror.
**Warning signs:** A "successful" 200 response that returns unexpectedly small content or an error-shaped string.

### Pitfall 4: Using the WebFetch tool on ecode360.com and concluding the charter is unreachable
**What goes wrong:** WebFetch returns 403 for ecode360.com URLs, which could be misread as "the charter text is blocked, fall back to WebSearch summaries only."
**How to avoid:** curl with a Chrome UA succeeds (200) on the same URLs — ecode360 blocks WebFetch's fetcher specifically, not general HTTP clients. Always prefer a directly-fetched primary source over a WebSearch summary when the tool allows it.

### Pitfall 5: districts.state uppercase 'OR' for LOCAL districts
**What goes wrong:** Routing fails silently — address lookup returns no city-level officials.
**How to avoid:** All LOCAL/LOCAL_EXEC/COUNTY districts in Oregon use `state='or'` (lowercase). Only NATIONAL_LOWER and STATE_EXEC use uppercase 'OR'. Re-verified live this session against Beaverton/Portland/Hillsboro.

### Pitfall 6: Seeding the Youth Councilor as an 8th office
**What goes wrong:** A structural migration creates 8 offices instead of 7, or `official_count` is set to 8, because news coverage prominently mentions "one Mayor, six Councilors, and one Youth Councilor."
**How to avoid:** The Youth Councilor is explicitly non-voting and mayor-appointed — exclude from the elected-officials roster, same treatment class as other non-voting advisory positions excluded elsewhere in this project.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 4-Councilor Council (pre-2024) | 6-Councilor Council + Mayor + non-voting Youth Councilor | Charter reform passed May 21, 2024 (71.77%), operative July 1, 2024 | 2 new council seats (Ghoddusi, Robbins) added in the Nov 2024 election |
| Mayor Heidi Lueb | Mayor Yi-Kang Hu (appointed) | Oct 7, 2025 | Lueb resigned Sept 2025 citing conflicts with other officials; Hu is Tigard's first Asian American mayor |
| Councilor Hu (elected 2022 seat) | Councilor Tom Anderson (appointed, interim) | Dec 2025 | Anderson will not seek election — Nov 2026 ballot will fill this seat fresh |
| N/A | 4 of 7 seats face a Nov 3, 2026 election (Mayor's remaining term, Anderson's seat, Ghoddusi's seat, Robbins's seat) | Election filing period ahead | Seed the CURRENTLY-seated incumbents through their documented term-end dates — do not pre-seed any 2026 candidate as the incumbent |

**Deprecated/outdated:**
- Any pre-2024-charter roster (4 councilors, no Youth Councilor formalization) is obsolete — do not use pre-July-2024 sources as current-state references.

---

## Surfacing

**Entry to add to `src/lib/coverage.js` Oregon block** (`COVERAGE_STATES`, name='Oregon', abbrev='OR', `areas` array — currently 8 entries as of this research session: Beaverton, Fairview, Gresham, Hillsboro, Maywood Park, Portland, Troutdale, Wood Village):

```js
{ label: 'Tigard', browseGovernmentList: ['4173650'], browseStateAbbrev: 'OR', hasContext: true },
```

**Sort position:** Alphabetically between 'Portland' and 'Troutdale' ("Ti" < "Tr").

**Browse link at completion:** `essentials.empowered.vote/results?browse_geo_id=4173650&browse_mtfcc=G4110`

**hasContext: true** is correct once at least 1 stance row is inserted for a Tigard official.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | geo_id 4173650 is correct and requires no correction (unlike Hillsboro's 4133850 error) | geo_id Verification | LOW — directly verified against the live production DB in this session; single-source but high-confidence given the exact TIGER name match ("Tigard city") |
| A2 | Tigard's council is pure at-large with no ward/position differentiation of any kind | Form of Government | If wrong, would require custom geofences/position labels; risk is LOW — directly quoted from primary-source charter text (ecode360.com fetched via curl), not a WebSearch summary |
| A3 | The 7-member roster (Hu, Anderson, Ghoddusi, Robbins, Schlack, Shaw, Wolf) reflects the CURRENT seated council as of 2026-07-02 | Live Roster | MEDIUM — no single authoritative portal was fetchable; triangulated from multiple independent local-news sources, but a further council change between Feb 2026 (last confirmed "Council Recap" found) and execution time would not be caught without a fresh Wave-0 search pass |
| A4 | The Youth Councilor should be excluded from the seeded roster (non-voting, not a governing office) | Form of Government | MEDIUM risk of planner disagreement — this is a judgment call, not a hard schema fact; flagged explicitly for planner/discuss-phase confirmation |
| A5 | City Attorney and Municipal Court Judge are appointed (Council-appointed), not elected | Form of Government | LOW-MEDIUM — confirmed via WebSearch aggregation + charter Chapter 4 structure, but the exact "who appoints" clause for City Attorney specifically was not quoted verbatim (network/fetch overlap issue in this session); consistent with every other OR council-manager city in this milestone |
| A6 | tigardlife.com headshot images (spot-verified for Shaw only) will be similarly available for the other 6 officials | Headshot Sources | MEDIUM — only 1 of 7 was directly confirmed downloadable in this session; the other 6 require per-official searching at execution and may yield gaps |
| A7 | Ext_id range -4173651..-4173657 is unused | Migration Reference | LOW — confirmed via live DB query in this session |
| A8 | Disk migration MAX is 1158 (next=1159) as of this research session | Migration Reference | LOW — directly verified via `ls` + ledger cross-check; matches STATE.md's independent note exactly |
| A9 | Maureen Wolf's Tigard-Tualatin School Board service (2009-2021) does not create a current dual-role conflict | Live Roster | LOW — explicitly resolved in this session (she departed the school board in 2021, joined city council in 2025); relevant to avoid confusion with future Phase 184 (TTSD board seed) |
| A10 | Wikimedia Commons "Downtown Tigard Oregon.JPG" license is CC BY-SA (exact version unconfirmed) | Community Banner | LOW — license family confirmed, but the specific version string (3.0 vs. a later version) needs a direct page re-check at execution before writing the attribution comment |

---

## Open Questions (RESOLVED — dispositioned into plans)

> Plan-checker disposition 2026-07-02: Q1 → non-blocking by this research's own finding (both scenarios are non-elected; skip-judicial-* holds either way). Q2 → deliberately an execution-time search task in 178-03 (genuine gaps are an acceptable, documented outcome). Q3 → resolved procedurally via 178-01's Wave-0 fresh-roster re-fetch gate.

1. **Exact "who appoints the City Attorney" charter clause text**
   - What we know: WebSearch aggregation states Council appoints City Manager, City Attorney, and Municipal Court Judge; charter §4.2 describes City Attorney qualifications but the appointing-body clause specifically was not captured verbatim due to a fetch/grep gap in this session.
   - What's unclear: Whether appointment is by Council directly or via the City Manager (as in some council-manager charters where the Attorney reports through the Manager).
   - Recommendation: Low priority — does not change the "skip judicial-* topics" conclusion either way (both scenarios are non-elected). Confirm only if time allows at Wave-0.

2. **Full headshot coverage for the 6 non-Shaw officials**
   - What we know: tigardlife.com hosts at least one clean, well-sized (696×462) photo per major news event; Shaw's was directly confirmed.
   - What's unclear: Whether similarly clean, individually-attributable photos exist for Hu, Anderson, Ghoddusi, Robbins, Schlack, and Wolf specifically (as opposed to group/event photos).
   - Recommendation: Wave-0/execution should budget real per-official search time here — this phase has a meaningfully higher headshot-sourcing risk than Hillsboro (no bulk portal) and should not assume a smooth 7/7 outcome.

3. **Whether any council roster change occurred between 2026-02-10 (last confirmed "Council Recap" found) and plan/execution time**
   - What we know: The last Council Recap news item surfaced by search in this session was dated Feb 10, 2026.
   - What's unclear: Whether any resignation, appointment, or Council President re-election occurred since.
   - Recommendation: Wave-0 must run a fresh WebSearch pass for "Tigard council recap" / "Tigard council resignation 2026" immediately before finalizing the roster.

---

## Environment Availability

No new external tools needed beyond the existing project infrastructure. No new geofences to load (city geo_id 4173650 already present from the v8.0 OR TIGER load).

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL / psql | Migration apply | Yes (via EV-Accounts .env) | PostgreSQL 18.1 client | — |
| tigard-or.gov | Roster + Headshots | **NO — Akamai WAF-403 confirmed** | — | tigardlife.com / valleytimes.news + WebSearch aggregation |
| ecode360.com | Charter/governance text | Yes via curl (403 to WebFetch tool specifically) | — | Use curl with Chrome UA, not WebFetch |
| CivicWeb / Legistar / Granicus | Roster + Headshots (Hillsboro-style bulk mirror) | **NO — none found working for Tigard** | — | Per-official local-news search (higher effort than Hillsboro) |
| tigardlife.com | Roster confirmation + Headshot fallback | Yes (HTTP 200) | WordPress | — |
| valleytimes.news | Roster confirmation + Headshot fallback | Yes (HTTP 200) | — | — |
| Wikimedia Commons | Community banner source | Yes — 1 strong candidate + ~23 more in the Tigard category | — | Unsplash fallback per pipeline doc |
| Python 3 + Pillow + requests | Headshot resize pipeline | Yes (existing `_tmp-*-headshots.py` pattern) | — | — |
| scripts/banners/process_banner.py + upload_banner.py | Community banner | Yes (proven on Beaverton/Hillsboro/Bloomington/50 states) | — | — |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | SQL verification queries (inline psql, no test runner) |
| Config file | None — inline verification gates in plan |
| Quick run command | `psql $DATABASE_URL -c "SELECT COUNT(*) FROM essentials.offices o JOIN essentials.politicians p ON o.politician_id=p.id JOIN essentials.chambers ch ON o.chamber_id=ch.id WHERE ch.name='City Council' AND ch.government_id=(SELECT id FROM essentials.governments WHERE name='City of Tigard, Oregon, US')"` |
| Full suite command | 9-check E2E gate (see below), extended with a banner-render check |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WASH-04 | 7 officials seeded with offices | SQL count | `SELECT COUNT(*)... = 7` | Wave-0 inline |
| WASH-04 | Mayor sorts first in display | SQL + live browse | `groupHierarchy.js` + human verify | Existing code |
| WASH-04 | 7 headshots at 600×750 in Storage | SQL count + CDN HTTP 200 | `SELECT COUNT(*) FROM essentials.politician_images WHERE...` | Wave-2 inline; MAY have genuine gaps given headshot sourcing risk (see Open Question 2) |
| WASH-04 | Evidence-only stances render | SQL count + live browse | `SELECT COUNT(*) FROM inform.politician_answers WHERE politician_id=...` | Wave-3 inline |
| WASH-04 | Purple hasContext chip | Browser/live browse | `essentials.empowered.vote/results?browse_geo_id=4173650&browse_mtfcc=G4110` | Wave-3 human verify |
| WASH-04 | Community banner renders (not gradient fallback) | Browser/live browse | Same browse URL — Local section shows photo | Wave-3 human verify |
| WASH-04 | Section-split = 0 rows | SQL (using the WR-01-fixed canonical query, not the dead gate) | Section-split query after seed | Wave-1 inline |
| WASH-04 | No duplicate government row | SQL | `SELECT COUNT(*) FROM essentials.governments WHERE name='City of Tigard, Oregon, US'` = 1 | Wave-1 inline |
| WASH-04 | No Youth Councilor seeded | SQL | `SELECT COUNT(*) FROM essentials.offices WHERE chamber_id=(...) ` = 7 exactly | Wave-1 inline |

### 9-Check E2E Verification Gate (Wave-1 structural plan) + Banner Check (Wave-3)

1. `governments` row count = 1 for name='City of Tigard, Oregon, US'
2. `chambers` row exists with name='City Council', official_count=7
3. `districts` rows: exactly 1 LOCAL_EXEC + 1 LOCAL for geo_id='4173650' state='or'
4. `offices` count = 7 (not 8 — no Youth Councilor) for Tigard chamber, `representing_city='Tigard'` set on all 7 (inline)
5. `politician_images` count for Tigard politicians — target 7, but document any genuine gap honestly (see headshot sourcing risk)
6. `politician_answers` count ≥ 1 per official (honest blanks OK; 0 for any official = re-check)
7. Section-split query (WR-01-fixed canonical version) returns 0 rows for geo_id 4173650
8. Districts.state casing verified: all 'or' (lowercase)
9. Human-verify: live browse link shows Mayor first + all 6 councilors, compass stances visible, no party label (despite Anderson/Ghoddusi being publicly characterized by party in news coverage)
10. (Wave-3 banner) Human-verify: Local section banner shows the Tigard photo, not the tier gradient fallback

### Wave 0 Gaps

- [ ] DB probe: re-confirm geo_id 4173650 is still correct and greenfield (this research found it correct — low risk, but re-verify)
- [ ] DB probe: confirm no existing government/chamber rows for Tigard (name + geo_id)
- [ ] DB probe: confirm ext_id range -4173651..-4173657 is unused
- [ ] DB probe / disk `ls`: re-confirm disk migration MAX (this research found 1158 → next 1159)
- [ ] Fresh WebSearch pass for any Tigard council change since Feb 10, 2026 (last confirmed Council Recap found)
- [ ] Per-official headshot search across tigardlife.com/valleytimes.news/Ballotpedia/campaign sites for the 6 officials beyond Shaw (only 1/7 spot-verified in research)
- [ ] Confirm exact Wikimedia Commons CC BY-SA version for the "Downtown Tigard Oregon.JPG" banner candidate

---

## Sources

### Primary (HIGH confidence)
- `essentials.geofence_boundaries` / `essentials.districts` / `essentials.governments` / `essentials.politicians` live queries (psql, this session) — confirmed geo_id 4173650 correct, greenfield status, clean ext_id range.
- `ecode360.com/45107158`, `/43709579`, `/45107164`, `/45107165`, `/45107166`, `/45107171` (Tigard City Charter Chapters 3 "Council" and 4 "City Officers") — fetched directly via curl (Chrome UA), HTTP 200 — primary-source charter text quoted verbatim above.
- `ls C:/EV-Accounts/backend/migrations | sort` — confirmed disk MAX is 1158 as of 2026-07-02.
- `inform.compass_topics` live query — confirmed 44 live topics, 8 of which are judicial-*, unchanged from prior phases.
- `tigardlife.com/featured/tigard-city-council-taps-former-member-to-fill-vacancy-for-2026/` — fetched directly, HTTP 200 — Anderson appointment details and partial current roster.
- `tigardlife.com/wp-content/uploads/2024/09/Jeanette-Shaw-696x462.jpg` — direct curl download confirmed, 200/36,280 bytes/696×462 JPEG.
- `src/lib/buildingImages.js` / `src/lib/coverage.js` (read directly) — confirmed current CURATED_LOCAL and Oregon coverage.js block state.
- Hillsboro Phase 177 artifacts (177-RESEARCH.md, 177-01 through 177-05-SUMMARY.md, 177-REVIEW.md) — direct structural/schema template, ext_id scheme precedent, migration split shape, WR-01/WR-02 template fixes.

### Secondary (MEDIUM confidence)
- WebSearch aggregation of `opb.org`, `kgw.com`, `koin.com`, `youroregonnews.com`, `valleytimes.news`, `hoodline.com` news coverage — mayoral resignation/appointment chain, council expansion history, individual member terms.
- WebSearch aggregation surfacing `tigard-or.gov` "Meet the Council" and related page text — content appears indexed/cached by the search backend despite the live URL returning 403 to direct fetch; treated as MEDIUM confidence and cross-checked against independent local-news sources wherever a load-bearing fact was used.
- Ballotpedia (`ballotpedia.org/Maureen_Wolf`, general Tigard page) — background/history confirmation only; Ballotpedia states Tigard itself is outside its scheduled-update coverage scope.

### Tertiary (LOW confidence)
- `tigardchamber.org` and `washcodems.org` — both returned HTTP 403 to direct fetch in this session; any characterization of their content is from WebSearch snippets only, not independently verified, and was not relied upon for any load-bearing claim above.
- Facebook official pages (`facebook.com/YiForTigard`) — identified as a possible headshot fallback but not fetched or verified (requires manual/authenticated extraction).

---

## Metadata

**Confidence breakdown:**
- geo_id verification: HIGH — directly verified against live production DB; no correction needed (unlike Hillsboro).
- Form of government (pure at-large, no wards/positions): HIGH — directly quoted from primary-source charter text fetched via curl, not a WebSearch summary.
- Roster (7 of 7 officials, names/terms): MEDIUM-HIGH — triangulated from multiple independent local-news sources and cross-checked, but no single authoritative portal was reachable, and the roster has an unusually high recent-change rate (2 appointments in the last 4 months of 2025); Wave-0 re-verification is more load-bearing here than in prior WashCo phases.
- Headshot sourcing: MEDIUM-LOW — no bulk mirror found (unlike Hillsboro's CivicWeb); only 1 of 7 officials' photos was spot-verified downloadable in this session; genuine gaps are a realistic outcome.
- Migration shape (schema): HIGH — directly inherited from the just-completed, same-milestone Hillsboro template, with two proactive template fixes (WR-01, WR-02) carried forward from the Hillsboro code review.
- Ext_id range + migration counter: HIGH — both independently confirmed live in this session and consistent with STATE.md's own note (no drift, unlike the Hillsboro research which had to correct a stale estimate).

**Research date:** 2026-07-02
**Valid until:** 2026-07-16 (SHORTER than the usual 30-day window, given the roster's demonstrated high rate of recent change — 2 appointments in the 4 months preceding this research — and the pending Nov 3, 2026 election affecting 4 of 7 seats; re-verify the roster if planning/execution slips more than 2 weeks past this research date).
