# Phase 182: City of Cornelius Deep-Seed — Research

**Researched:** 2026-07-03
**Domain:** Oregon municipal deep-seed — council-manager city, Mayor (2-year term, directly elected citywide) + 4 Councilors (4-year staggered terms, all at-large), no wards, no numbered positions. **Unusually high current turnover: 2 of 4 filled councilor seats are appointed (not elected), plus 1 genuinely VACANT seat.**
**Confidence:** HIGH (form of government, roster, geo_id correction, headshots, migration counter: all VERIFIED direct from `corneliusor.gov`, the 2008 City of Cornelius Charter (fetched via Wayback Machine snapshot of `codepublishing.com`, which itself 403s live), and live production DB queries this session). **geo_id 4115350 (ROADMAP/CONTEXT-stated) is WRONG — CORRECTED to 4115550.** This is the **fourth** of seven WashCo cities in this milestone requiring a geo_id correction (after Hillsboro 4133850→4134100, Tualatin 4175200→4174950, Sherwood 4167450→4167100), and the **worst failure mode yet**: 4115350 is not merely absent — it belongs to a **different, real Oregon city (Coquille)**. **Headshot sourcing is exceptionally clean**: all 4 filled-seat portraits are directly downloadable via plain `curl` (no WAF) from `corneliusor.gov`'s `/ImageRepository/Document?documentID=N` endpoint, each already a professional 1600×2000 (exact 4:5 ratio) studio portrait — the best-quality source images found in the milestone, though composited on a transparent PNG circle-mask requiring a white-background composite step before resize.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Form of government & council routing — VERIFY AT PLAN TIME (directive, carried forward)**
- **D-01:** Cornelius's council structure is NOT assumed from memory. Cornelius is commonly described as council-manager with a Mayor + councilors elected at-large — but the routing branch is decided by the charter/municipal code ground-truthed from the official city site at plan time.
- **D-02:** Tie-breaker rule: WHO VOTES decides routing, not residency. If ward/district voters alone elect their councilors: load custom X00xx ward geofences BEFORE seeding (official GIS only). If the whole city votes for all seats: no new geofences — model at-large on the verified city geo_id, exactly like the five predecessor cities.
- **D-03:** If ward branch: one district per ward, offices attached to it. Seat identity lives on the office title, NOT on duplicate district rows.
- **D-04:** Either branch must produce no section-split and no empty LOCAL section.

**Mayor & leadership modeling — VERIFY AT PLAN TIME (directive, carried forward)**
- **D-05:** Mayor's role ground-truthed from the charter at plan time. If directly-elected citywide: the Beaverton/Tualatin/Forest Grove/Sherwood shape — LOCAL_EXEC district (Mayor) + LOCAL at-large district (councilors), both on the city geo_id, both `state='or'`; Mayor sorts first (groupHierarchy.js). If council-member/rotating president: seat-with-title on the council, no LOCAL_EXEC.
- **D-06:** Council President / Vice Mayor = title-on-seat if one exists — no separate office row. Plain titles ('Mayor'/'Councilor', no position numbers) unless the city itself uses numbered positions.

**Roster & body name — strict ground-truth (carried forward)**
- **D-07:** Researcher pulls the seated roster + exact chamber/body name verbatim from the official Cornelius site at plan time. No hardcoding names, seat count, or position naming from memory. Researcher also notes WAF status AND photo availability of the city site.

**Stance scope + headshots (carried forward, locked)**
- **D-08:** All live compass topics per official, one agent at a time, evidence-only / 100% cited / honest blank spokes / zero default values; 18–21+ depth where the record supports it; skip judicial-* topics. Stance agents author their own migration files directly, run on model=sonnet.
- **D-09:** Headshots from the official Cornelius city site first; then the standing fallback chain. Crop-to-4:5 then resize to 600×750 (Lanczos q90, no overlays), mirrored to Storage `politician_photos/{uuid}-headshot.jpg`; `photo_license` set at execution by actual source. Genuine gaps documented, no fabrication.
- **Pamplin standing authorization (carried from 181 D-16):** `pamplinmedia.com` fails TLS for ALL fetchers — Cornelius shares Forest Grove's news ecosystem (Forest Grove News-Times is Pamplin). Recover Q&A/coverage via search-index extraction, cite the original article URL, stay strictly evidence-only. curl+pdftotext works on council-minutes PDFs where WebFetch OCR fails.

**Community banner (carried forward)**
- **D-10:** Subject: operator picks the recognizable everyday street view (see D-14 for the Cornelius priority hint). Wikimedia Commons first, Unsplash fallback; NO AI-generated images; no baked-in text/graphics. Follow `docs/banner-asset-pipeline.md`.
- **D-11:** Banner asset work lives in the final surfacing plan. `offices.representing_city='Cornelius'` is set in the structural migration.

**Surfacing (locked)**
- **D-12:** Add Cornelius to the Oregon block of `COVERAGE_STATES` in `src/lib/coverage.js`: `{ label: 'Cornelius', browseGovernmentList: ['<verified geo_id>'], browseStateAbbrev: 'OR', hasContext: true }` — alphabetical among the Oregon cities. Live browse link at completion: `essentials.empowered.vote/results?browse_geo_id=<verified geo_id>&browse_mtfcc=G4110`.

**Roster edge cases (carried forward)**
- **D-13:** Non-voting / ex-officio seats are EXCLUDED. Vacant seats: seed the office row only if milestone precedent supports it — otherwise document the vacancy in research/summary; never seed a placeholder person. Very recent appointees count as seated officials if confirmed on the official city site.

**Cornelius-specific decisions (resolved this discussion — recommended defaults, user AFK)**
- **D-14:** Banner subject priority hint — Adair/Baseline main-street couplet street scene, with Cornelius Place/Cornelius Public Library as the alternate. Two winning subject classes: (1) recognizable everyday street-level scene, (2) wide multi-roofline skyline. Reject single-building roof crops and aerials. Wave-0 browses Wikimedia Category:Cornelius, Oregon (and Category:Washington County, Oregon if thin) and presents street-level candidates to the operator FIRST; clean license + crops-well-to-1700×540 beats subject preference.
- **D-15:** Spanish-language sources are ADMITTED as evidence and photo sources. Cornelius is Oregon's most heavily Latino city. Cite the original Spanish-language URL; write reasoning in English, faithfully summarizing. No machine-translation fabrication.
- **D-16:** Verify Render deploys by bundle CONTENT, never by hash. Adopt IN-01 (CTE hoist) in the structural migration clone. Check `git -C C:/EV-Accounts status` staged state before ANY commit there.

### Claude's Discretion
- Council office title labeling — planner picks after seeing the official roster page.
- External_id block — Wave-0 DB probe picks an unused OR range (geo_id-derived block is the natural analog).
- Next migration number — Wave-0 confirms on-disk MAX (on-disk counter is authoritative; DB ledger MAX is a known trap).
- Custom `X00xx` mtfcc + district_type — only if the D-02 ward branch fires.

### Deferred Ideas (OUT OF SCOPE)
- School boards (Phases 183–184); 2026 elections + discovery (Phase 185); milestone close (186).
- Washington County Commission (175) and the six completed cities (176–181).
- Cornelius appointed boards/commissions and city-manager staff — elected officials only (non-voting/ex-officio seats excluded per D-13).
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WASH-08 | City of Cornelius deep-seeded — government + roster + headshots + evidence-only stances. | Fully resolved: **geo_id CORRECTED 4115350 → 4115550** (the ROADMAP/CONTEXT-stated value belongs to a completely different city, "Coquille city," in `essentials.geofence_boundaries`; `4115550` is the sole G4110 row named "Cornelius city"); council-manager form confirmed via the primary-source **2008 City of Cornelius Charter** — §7: "The council consists of a mayor and four councilors nominated and elected by the city at large" (pure at-large, zero ward/position differentiation confirmed); Mayor directly elected citywide on a **2-year term** (§25, matching Sherwood's pattern, NOT the 4-year Beaverton/Tualatin/Forest Grove pattern); 4 Councilors elected at-large on 4-year staggered terms, 2 elected per general-election cycle (§24); Council President elected by the council from its own membership (§9, title-on-seat, no separate office — currently Angeles Godinez Valencia); **current roster has only 3 filled councilor seats + 1 genuinely VACANT seat** (the City is actively accepting applications, July 1–22 2026, to fill the vacancy — confirmed via a live "News Flash" on the city site and independently confirmed by the leftover placeholder image for the vacant slot being visually blank); **2 of the 3 filled councilor seats are currently held by APPOINTMENT, not election** (Edgar Baker: Appointed June 2026–Dec 2026; Edén López: Appointed April 2023–Dec 2026) — the highest appointed-seat density of any city in this milestone; headshot sourcing is exceptional — all 4 filled-seat portraits are static, curl-downloadable, professional 1600×2000 (exact 4:5) studio images from `corneliusor.gov`'s CivicEngage `/ImageRepository/` endpoint, no WAF; `ci.cornelius.or.us` (an alternate domain referenced in search results) is CONFIRMED DEAD (connection failure) — `corneliusor.gov` is the sole live official domain; a strong, directly-attributable local-immigration stance-evidence anchor was found in the Nov 17, 2025 council minutes (Mayor Dalin + Council President Godinez Valencia both on-record re: federal immigration enforcement and the Equity Corps of Oregon), directly relevant given D-15's bilingual-evidence authorization; the best available Wikimedia Commons banner candidate — "Cornelius Civic Center - Oregon.JPG" — is confirmed to depict the Cornelius Public Library/City Hall building, an EXACT match to D-14's named alternate ("Cornelius Place/Cornelius Public Library"), CC BY-SA 3.0, by the same photographer (M.O. Stevens) who shot the Beaverton/Hillsboro/Tigard/Tualatin banners; no true street-level Adair/Baseline main-street scene was found on Commons (confirmed the sparsest-imagery city in the milestone, as CONTEXT.md anticipated). |

</phase_requirements>

---

## Summary

Cornelius operates under a **council-manager form of government** established by the **2008 City of Cornelius Charter** (effective July 1, 2008), fetched via a Wayback Machine snapshot of `codepublishing.com/OR/Cornelius/html/CorneliusCH.html` (the live `codepublishing.com` page 403s to both `curl` and `WebFetch`; the Wayback copy is a reliable, dated primary-source mirror). [VERIFIED: primary-source charter text, Wayback Machine snapshot] **Charter §7: "The council consists of a mayor and four councilors nominated and elected by the city at large."** This is unambiguous, textual, primary-source confirmation of pure at-large routing — no ward geofences needed, matching all five predecessor WashCo cities. **§25: the Mayor is elected for a two-year term** (matching Sherwood's pattern, the only other 2-year WashCo Mayor in this milestone — every other predecessor Mayor is 4-year). **§24: at each general election, two councilors are elected for four-year terms "by position"** — this "by position" language is a **staggering mechanism** (which 2 of the 4 seats come up each cycle), not a public-facing numbered-seat label; the city's own live roster page and staff directory use plain `'Mayor'`/`'Councilor'` titles exclusively, with zero ward or position-number text found anywhere on the site. **§9: the council elects a Council President from its own membership at its first meeting of each odd-numbered year** — a title-on-seat, not a separate office, exactly like every predecessor city's Council President/Vice-Mayor pattern.

**geo_id CORRECTED: 4115350 (ROADMAP/CONTEXT-stated) → 4115550 (verified correct).** [VERIFIED: live query against production `essentials.geofence_boundaries`, 2026-07-03]
```sql
SELECT name, geo_id, mtfcc FROM essentials.geofence_boundaries WHERE geo_id='4115350';
--      name      | geo_id  | mtfcc
-- ----------------+---------+-------
--  Coquille city  | 4115350 | G4110      <-- a real, unrelated Oregon city, NOT Cornelius

SELECT name, geo_id, mtfcc FROM essentials.geofence_boundaries WHERE mtfcc='G4110' AND name ILIKE '%cornelius%';
--      name       | geo_id  | mtfcc
-- -----------------+---------+-------
--  Cornelius city  | 4115550 | G4110
```
This is a **materially more dangerous failure mode** than the prior three corrections in this milestone (Hillsboro/Tualatin pointed at superseded-but-plausible values; Sherwood's stated value simply didn't exist at all). Here, the stated value **exists and silently resolves to a different real city's geofence** — had this gone unverified, Cornelius's entire roster would have been seeded onto Coquille's boundary, routing zero Cornelius addresses correctly while polluting Coquille's (currently unseeded) government slot. **All downstream ext_id ranges, district rows, and coverage.js entries in this research use the CORRECTED value `4115550` — never `4115350`.**

**Current roster is the most fragmented of the milestone: only 4 of the 5 designed seats are currently filled, and 2 of those 4 are held by appointment rather than election.** [VERIFIED: direct `curl` fetch of `corneliusor.gov/267/City-Council`, HTTP 200, no WAF; individual bio pages at `/Directory.aspx?eid=N`]

| Seat | Name | Status | Term | Notes |
|------|------|--------|------|-------|
| Mayor | Jeffrey C. Dalin | **ELECTED** | Jan 2025–Dec 2026 (2-yr) | Longest tenure in the milestone: first appointed Nov 2011, elected/re-elected every 2 years since Jan 2013 (8 consecutive terms). Up for election Nov 2026 — no challenger certified as of this session. |
| Councilor (Council President) | Angeles Godinez Valencia | **ELECTED** (2021), **RE-ELECTED** (2025) | Jan 2025–Dec 2028 (4-yr) | Holds the Council President title (§9, title-on-seat). Not up in 2026. |
| Councilor | Edgar Baker | **APPOINTED** | June 2026–Dec 2026 | Interim appointment filling a vacancy; certified as a Nov 2026 candidate to keep the seat for a full term. |
| Councilor | Edén López | **APPOINTED** | April 2023–Dec 2026 | Bio lists ONLY "Appointed," no interceding "Elected"/"Re-Elected" entry (contrast Godinez Valencia's two-entry elected history) — treat as currently appointed. City's Nov-2026-election page separately lists her as the incumbent candidate. |
| Councilor | **VACANT** | — | — | Formerly held by Citlalli Nuñez-Barragán (confirmed actively voting as of the Nov 17, 2025 council minutes). Application period to fill the seat is OPEN as of this research date (opens July 1, closes July 22, 2026). The seat's leftover directory image (`documentID=1975`, still alt-tagged "Citlalli Nuñez-Barragán") is now visually a BLANK placeholder — confirms genuine current vacancy, not a stale-but-still-seated official. |

**Total designed seats: 5 (Mayor + 4 councilors per Charter §7). Currently filled: 4. Currently vacant: 1.** This is the first WashCo city in the milestone with a genuine current vacancy — no predecessor city (175–181) had one.

**`corneliusor.gov` has NO WAF and is the cleanest headshot-sourcing situation in the milestone.** [VERIFIED: 4/4 direct downloads this session via plain `curl`, HTTP 200 each, all `image/png`, all exactly **1600×2000 pixels (exact 4:5 ratio)**] Images are served from a CivicEngage/CivicPlus `/ImageRepository/Document?documentID=N` endpoint (Dalin=2325, Godinez Valencia=1977, Baker=2324, López=1979) and are professional studio portraits composited as a **circular photo cutout on a fully transparent PNG background** (confirmed by direct visual inspection of all 4 images) — this requires a **white-background composite step** (same technique as the Henderson/Seebock RGBA precedent already in the pipeline) before the resize step, but because the canvas is already exactly 4:5, essentially **no crop judgment is needed** — composite-then-resize-to-600×750 directly. `ci.cornelius.or.us` — an alternate domain referenced in early search results — is **CONFIRMED DEAD** (curl connection failure, no TLS handshake) and must not be cited or fetched.

**Primary recommendation:** Seed as pure at-large with plain titles — the exact Tigard/Forest Grove/Sherwood structural shape (no ward/position differentiation) combined with the Beaverton/Tualatin/Forest Grove/Sherwood Mayor+Council district split — single `'City Council'` chamber. Government name `'City of Cornelius, Oregon, US'`. geo_id `4115550` (CORRECTED). Ext_id block **-4115551..-4115555** (5 slots, confirmed unused; derived from the CORRECTED geo_id). Next structural migration **1196** (on-disk MAX confirmed 1195 this session — Sherwood's `1195_standke_stances.sql`). Community banner: the sparsest imagery in the milestone — best available candidate is "Cornelius Civic Center - Oregon.JPG" (the Public Library/City Hall, D-14's named alternate), requiring a significant aspect-ratio crop from its native 1679×1412 to the pipeline's 1700×540 target; no true street-level main-street or skyline candidate was found on Wikimedia Commons.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| City government row | Database / Storage | — | Structural migration inserts into essentials.governments |
| Chamber row | Database / Storage | — | Single 'City Council' chamber, official_count=5 (recommended — see Migration Reference) |
| Mayor office (LOCAL_EXEC) | Database / Storage | — | Directly-elected citywide, 2-year term, links to LOCAL_EXEC district |
| Council offices (LOCAL, plain titles) | Database / Storage | — | All 4 designed seats share one LOCAL district; 2 filled-appointed, 1 filled-elected, 1 vacant |
| Official headshots (600×750) | Database / Storage | CDN | politician_images rows + Supabase Storage; sourced directly from corneliusor.gov, no fallback chain needed for the 4 filled seats |
| Compass stances | Database / Storage | — | inform.politician_answers rows, evidence-only; expect a thinner-than-average yield given 2 recent appointees + 1 vacancy |
| Community banner | Database / Storage | CDN | Supabase Storage `cities/cornelius.jpg`; wired via `buildingImages.js` CURATED_LOCAL |
| Frontend surfacing | Frontend Server (SSR) | CDN | coverage.js Oregon block, purple hasContext chip |
| Address routing | API / Backend | — | PIP query against G4110 geofence (geo_id 4115550 — CORRECTED), no ward layer |

---

## geo_id Verification — CORRECTED (4115350 → 4115550)

[VERIFIED: live query against production `essentials.geofence_boundaries`, 2026-07-03]

```sql
SELECT name, geo_id, mtfcc FROM essentials.geofence_boundaries WHERE geo_id='4115350';
--      name      | geo_id  | mtfcc
-- ----------------+---------+-------
--  Coquille city  | 4115350 | G4110

SELECT name, geo_id, mtfcc FROM essentials.geofence_boundaries WHERE mtfcc='G4110' AND name ILIKE '%cornelius%';
--      name       | geo_id  | mtfcc
-- -----------------+---------+-------
--  Cornelius city  | 4115550 | G4110
```

**CORRECTION REQUIRED — HIGHEST-RISK VARIANT SEEN THIS MILESTONE.** Unlike Sherwood (stated value returned 0 rows, an obviously-wrong/absent value that a Wave-0 probe would immediately catch), Cornelius's stated `4115350` **exists and successfully resolves** — just to the wrong city (Coquille, an unrelated small coastal Oregon city, currently unseeded in the DB). A naive Wave-0 probe that only checks "does this geo_id have a G4110 row" (rather than confirming the row's `name` field matches the target city) would **pass incorrectly**. **Wave-0 must verify both geo_id existence AND name match before proceeding.**

```sql
SELECT COUNT(*) FROM essentials.governments WHERE name ILIKE '%cornelius%';                                  -- 0 (greenfield)
SELECT id, name, geo_id FROM essentials.chambers WHERE name ILIKE '%cornelius%';                             -- 0 (greenfield)
SELECT external_id, full_name FROM essentials.politicians WHERE external_id BETWEEN -4115560 AND -4115540;  -- 0 rows (ext_id block clean)
SELECT MAX(version::bigint) FROM supabase_migrations.schema_migrations WHERE version ~ '^[0-9]{1,6}$';       -- 1187 (Sherwood structural — LEDGER TRAP, not the true next value)
```

**This phase IS greenfield** for Cornelius's government/chamber/offices — confirmed no pre-existing rows by name search and by ext_id-block collision. **Wave-0 must re-run this exact geofence-existence-AND-name-match probe as the first step regardless** — the fourth consecutive lesson this milestone that the stated value must never be trusted at face value, and now proven that "the query returns a row" is an insufficient check on its own.

---

## Form of Government — RESOLVED (primary-source charter text, no WAF)

**DETERMINATION: PURE AT-LARGE, PLAIN TITLES. NO WARDS, NO NUMBERED POSITIONS. DIRECTLY-ELECTED MAYOR ON A 2-YEAR TERM.**

[VERIFIED: 2008 City of Cornelius Charter, fetched via Wayback Machine snapshot of the `codepublishing.com` mirror — the live page 403s both `curl` and `WebFetch`, but the Wayback copy is dated, complete, and internally consistent with the live roster page's title conventions]

- **§7. Council:** "The council consists of a mayor and four councilors nominated and elected by the city at large." — unambiguous at-large confirmation.
- **§8. Mayor:** presides over council meetings, appoints commission/committee members with council consent, signs council-decision records, "serves as the political head of the city government." (Standard weak-mayor/council-manager duties — no independent veto or executive department head power described.)
- **§9. Council President:** elected by the council from its own membership at its first meeting of each odd-numbered year; presides in the Mayor's absence and acts as Mayor when the Mayor cannot perform duties. **Title-on-seat, not a separate office** — currently held by Angeles Godinez Valencia.
- **§12. Quorum:** "the mayor and two councilors or three councilors is a quorum" — the Mayor is a substantive participating member of council business (same functional posture as every predecessor WashCo Mayor, none of whom have an independent veto either), but this does not change the LOCAL_EXEC/LOCAL structural modeling convention established by Beaverton/Tualatin/Forest Grove/Sherwood.
- **§24. Councilors:** "At each general election... two councilors will be elected for four-year terms by position." — this is a **staggering mechanism** only (2 of the 4 seats up each cycle, so the council never fully turns over at once). It does NOT create numbered public-facing seat titles — confirmed by cross-checking against the live roster/staff-directory pages, which use plain `'Mayor'`/`'Councilor'` exclusively with zero "Position N" text anywhere.
- **§25. Mayor:** "At every general election... a mayor will be elected for a two-year term." — **2-year Mayor term**, matching Sherwood (181), NOT the 4-year pattern of Beaverton/Hillsboro/Tigard/Tualatin/Forest Grove.
- **§26. State Law:** "All elections for city offices must be nonpartisan." — antipartisan modeling (`party=NULL`) is doubly confirmed by both the project's standing convention and the Charter's own text.
- **§31/§32. Vacancies:** a vacant elective position is filled "by appointment by a majority of the remaining councilors," with the appointee's term running "until expiration of the term of office of the last person elected to that office." — this directly explains Baker's (June 2026–Dec 2026) and López's (April 2023–Dec 2026) appointed-not-elected current status, and is the mechanism that will eventually fill the currently-open vacancy.
- **§33. City Manager:** established — confirms council-manager form of government.

**Zero ward, position-number, or district language of any kind found anywhere in the Charter or the live city site.** Model exactly as the Beaverton/Tualatin/Forest Grove/Sherwood LOCAL_EXEC (Mayor) + LOCAL (shared at-large Councilor district) split.

---

## Live Roster — Verified 2026-07-03, cross-checked against individual staff-directory bio pages

[VERIFIED: direct `curl` fetch of `https://www.corneliusor.gov/267/City-Council`, HTTP 200, no WAF; individual bio pages `https://www.corneliusor.gov/Directory.aspx?eid={31,32,34,35}`, HTTP 200 each]

| Seat | Name | Election History (from bio page "Election Information") | Current Status |
|------|------|------------------------------------------------------------|-----------------|
| Mayor | Jeffrey C. Dalin | Appointed Nov 2011–Dec 2012; Elected Jan 2013–Dec 2014; Re-Elected every 2 years through Jan 2025–Dec 2026 (8 consecutive terms) | **ELECTED**, `is_appointed=false` |
| Councilor (Council President) | Angeles Godinez Valencia | Elected Jan 2021–Dec 2024; Re-Elected Jan 2025–Dec 2028 | **ELECTED**, `is_appointed=false` |
| Councilor | Edgar Baker | Appointed June 2026–Dec 2026 (single entry) | **APPOINTED**, `is_appointed=true`, `is_appointed_position=true` |
| Councilor | Edén López | Appointed April 2023–Dec 2026 (single entry, no interceding elected record) | **APPOINTED**, `is_appointed=true`, `is_appointed_position=true` |
| Councilor | VACANT (formerly Citlalli Nuñez-Barragán) | — | **VACANT** — see Roster Edge Case below |

**PITFALL GUARD — do not seat Citlalli Nuñez-Barragán as a current official.** She is confirmed actively voting as of the November 17, 2025 council minutes (found via WebSearch snippet of the minutes PDF), but is NOT on the current live roster page — her seat is now listed as "Vacant Position" and the city is actively recruiting a replacement (application window July 1–22, 2026, i.e., open as of this research date). Her name persists only as stale `alt`/`title` text on the seat's leftover placeholder image (`documentID=1975`); the image itself, when downloaded and visually inspected, is a **plain blank blue background with no person in it** — independently confirming the seat is genuinely vacant, not merely mis-labeled.

**Roster edge case — how to model the vacant seat (open decision for the planner):** A real precedent exists in the codebase for a genuinely vacant office row: `migrations/105_tx_congressional_house_officials.sql` seeds TX-23 (a vacant US House seat) as `INSERT INTO essentials.offices (..., politician_id, ..., is_vacant) SELECT ..., NULL, ..., true FROM ...` — a real office row, `politician_id=NULL`, `is_vacant=true`, and **no politician row is created at all**. The `essentials.offices` table's `politician_id` column IS nullable, and a `vacant_since` timestamptz column also exists (nullable) for optionally recording when the vacancy began. This satisfies D-13's "never seed a placeholder person" rule while still representing the seat. **This is a real, findable precedent, but it is from a different milestone (TX congressional) — not yet used anywhere in the WashCo city chain.** The planner should decide, at plan time, whether to (a) seed the 5th office row with `politician_id=NULL, is_vacant=true` (official_count=5, matches the Charter's designed seat count), or (b) omit the vacant seat's office row entirely and document it only in the migration comment/summary (official_count=4, matches currently-filled seats only). **Recommendation: option (a)**, both because the TX-23 precedent exists and because it correctly represents the Charter's designed 5-seat body to any future backend/frontend logic that counts seats — but this is genuinely a first for this milestone and should be an explicit, documented decision rather than a silent default either way.

---

## Web Presence / WAF Status — Best headshot sourcing in the milestone; primary domain confirmed

[VERIFIED: direct curl this session]

| URL/Domain | Status | Notes |
|---|---|---|
| `https://www.corneliusor.gov/` | **HTTP 200, no WAF** | Confirmed live, CivicEngage/CivicPlus CMS. This is the sole live official domain. |
| `https://www.corneliusor.gov/267/City-Council` | **HTTP 200, no WAF** | Full current roster with plain-text titles, term info, and static `<img>` headshot tags. |
| `https://www.corneliusor.gov/Directory.aspx?eid=N` | **HTTP 200, no WAF** (N=31 Dalin, 32 López, 34 Baker, 35 Godinez Valencia) | Individual bio pages with an "Election Information" list — the exact appointed-vs-elected history used above. |
| `https://www.corneliusor.gov/ImageRepository/Document?documentID=N` | **HTTP 200, no WAF, direct binary download** | Headshot source — see Headshot Sources below. |
| `https://www.ci.cornelius.or.us/...` | **CONFIRMED DEAD** — curl connection failure (exit 35, no TLS handshake) | This domain appeared in early WebSearch results (e.g., "Mayor & City Council Members \| Cornelius Oregon") but does NOT resolve/connect. **Do not cite or attempt to fetch this domain.** |
| `https://www.codepublishing.com/OR/Cornelius/html/CorneliusCH.html` | **HTTP 403** (both curl with browser UA and WebFetch) | The live municipal-code/charter mirror is blocked. **Use the Wayback Machine snapshot instead** (`web.archive.org/web/2026/https://www.codepublishing.com/OR/Cornelius/html/CorneliusCH.html`, confirmed HTTP 200, full charter text) — same class of workaround as prior phases' WAF-blocked charter mirrors. |
| `https://ballotpedia.org/Cornelius,_Oregon` | HTTP 200, but **no individual officeholder profiles** beyond naming the Mayor | Consistent with every prior WashCo city — Ballotpedia does not maintain per-councilor pages for small WashCo cities. |
| `https://www.corneliusor.gov/AgendaCenter/...` (minutes/agenda PDFs) | Directly fetchable | A WebSearch snippet of a Nov 2025 minutes PDF returned garbled OCR-style text ("Cornelius \*\*\*\*\* Oregon's Family Town...") — strongly suggesting these are **scanned/image PDFs**, not text-native. Per D-09/181's standing guidance, use `curl` + `pdftotext` (not WebFetch's OCR) to extract readable text from these documents at stance-research time. |
| `pamplinmedia.com` | Not independently re-tested this session, but carried forward as **known-dead per 181 D-16** | Cornelius shares Forest Grove's local-news ecosystem (Forest Grove News-Times is Pamplin Media) — expect the same TLS failure and apply the same search-index-extraction fallback. |

---

## Headshot Sources — 4/4 filled seats CONFIRMED, best image quality in the milestone

[VERIFIED: 4/4 direct binary downloads this session, all HTTP 200, all `image/png`]

| Official | documentID | Dimensions | Format | Notes |
|---|---|---|---|---|
| Jeffrey C. Dalin (Mayor) | 2325 | 1600×2000 | PNG, RGBA | Professional studio portrait, circular photo cutout on a fully transparent background |
| Angeles Godinez Valencia (Council President) | 1977 | 1600×2000 | PNG, RGBA | Same treatment |
| Edgar Baker (Councilor) | 2324 | 1600×2000 | PNG, RGBA | Same treatment |
| Edén López (Councilor) | 1979 | 1600×2000 | PNG, RGBA | Same treatment |
| VACANT seat's leftover image (documentID=1975, still alt-tagged "Citlalli Nuñez-Barragán") | 1975 | 1600×2000 | PNG, RGBA | **Confirmed BLANK — a plain solid-blue background, no person.** Do not use; the vacancy has no photo, correctly. |

**Pipeline note:** all 4 usable source images are a **circular photo cutout composited on a fully transparent PNG canvas** that is ALREADY exactly 1600×2000 (a precise 4:5 ratio matching the 600×750 target). This means:
1. **Composite onto white FIRST** (same RGBA-to-white technique already in the pipeline from the Henderson/Seebock precedent) — the transparent corners outside the circle would otherwise render as black/undefined in a naive RGB conversion.
2. **No crop judgment is needed** — the canvas ratio already matches 4:5 exactly; go straight to a Lanczos resize to 600×750 after the white composite.
3. This is a **higher-quality, lower-effort headshot outcome than every predecessor WashCo city** — no crop decision, no upscaling from a low-resolution source, no per-official manual web search required.

**No fallback chain is needed for the 4 filled seats.** The vacant seat obviously has no photo — document as a genuine, correctly-empty gap (do not force any prior officeholder's photo onto it).

---

## Community Banner

**Cornelius has the sparsest Wikimedia Commons imagery of the seven WashCo cities — confirmed via the Commons API, exactly as CONTEXT.md's D-14 anticipated.** [VERIFIED: `commons.wikimedia.org/w/api.php` categorymembers query, 2026-07-03]

`Category:Cornelius, Oregon` contains only 25 files, dominated by: the Albert S. Sholes House (a historic residence, 2 images), 9 Cornelius Methodist Cemetery photographs (DPLA archival), 2 elementary-school building photos, a church, a strip mall, a Walmart-under-construction photo (2016), a defunct/uncertain-tenant supermarket storefront, 2 map files, and 3 civic/town-center images. **No true street-level main-street couplet scene (the Adair/Baseline "everyday drag" D-14 hints at) and no wide multi-roofline skyline were found.**

**Best available candidates** (all directly queried via the Commons API for license + dimensions, and visually inspected via direct download for two of the three):

| Candidate | Dimensions | License | Photographer | Assessment |
|---|---|---|---|---|
| **"Cornelius Civic Center - Oregon.JPG"** | 1679×1412 (~1.19:1) | CC BY-SA 3.0 | M.O. Stevens (same photographer as the Beaverton/Hillsboro/Tigard/Tualatin banners) | Description: "Cornelius, Oregon Civic Center that serves as city hall and the [Cornelius Public] library." **This is an exact match to D-14's named alternate** ("Cornelius Place/Cornelius Public Library" — the city's newest recognizable civic landmark, per Wikipedia's own cross-link to `Cornelius_Public_Library`). Requires a significant horizontal crop (from 1.19:1 down to the pipeline's 3.15:1 target) — will lose most of the vertical building context; a genuine compositional judgment call for the executor. |
| "Cornelius Town Center - Oregon.JPG" | 1814×2034 (~0.89:1, PORTRAIT) | CC BY-SA 3.0 | M.O. Stevens | Description: "houses the city council chambers." Portrait-oriented with a flagpole in frame — a poor structural fit for a 3.15:1 wide crop (would require an extreme ~74% vertical trim); single-building risk. Not recommended as primary. |
| "Grande Foods, Cornelius, Oregon.jpg" | 3968×2232 (~1.78:1) | CC BY-SA 2.0 | Flickr user "Chris" | A former supermarket storefront (once "Hanks Thriftway," briefly "Oregon's first Latino supermarket," closed after Walmart's 2010 arrival; 2016 caption notes the tenant was unknown at the time and may have changed since). Single-building storefront, uncertain current subject accuracy — **reject** per D-14's single-building failure mode and stale-subject risk. |

`Category:Washington County, Oregon` is a **container category** (13 subcategories, e.g. "Scenic images of Washington County, Oregon," "Structures in Washington County, Oregon" — no files directly in the parent category). A deeper dig into these subcategories for a Cornelius-adjacent street scene was not completed this session (budget/scope) — **flagged as an Open Question for Wave-0**, alongside checking the Unsplash fallback per the standing D-10 rule.

**Recommendation:** present "Cornelius Civic Center - Oregon.JPG" (the library/city hall) to the operator as the leading candidate — it directly satisfies D-14's named alternate, has a clean, verified CC BY-SA 3.0 license, and continues the M.O. Stevens photographer continuity already established across four prior WashCo banners — while being transparent that **no ideal street-level or skyline candidate exists on Commons for this city**, and that the crop from 1679×1412 to 1700×540 will be a materially larger aspect-ratio compression than any predecessor banner has required.

---

## Migration / Schema Technical Reference

**Government name:** `'City of Cornelius, Oregon, US'`
**Chamber name:** `'City Council'`, `name_formal`: `'Cornelius City Council'`
**geo_id:** `'4115550'` (CORRECTED — never `'4115350'`)
**official_count:** **5 recommended** (Mayor + 4 designed councilor seats per Charter §7, including the vacant seat if seeded per the TX-23 precedent above) — see the Roster Edge Case decision point; if the planner chooses to omit the vacant seat's office row entirely, `official_count=4`.
**Ext_id block:** `-4115551` through `-4115555` (5 slots — Mayor + 4 councilor seats, one of which is vacant). **Confirmed unused** via live DB query this session (`SELECT external_id, full_name FROM essentials.politicians WHERE external_id BETWEEN -4115560 AND -4115540` → 0 rows).
**Next structural migration:** **1196**. [VERIFIED: `ls C:/EV-Accounts/backend/migrations` sorted numerically — on-disk MAX is `1195` (Sherwood's `1195_standke_stances.sql`), matching the milestone-memory expectation exactly. **DB ledger MAX is `1187`** (Sherwood's structural migration — the only ledger-registering migration since 181) — this is the "known trap" carried forward; the on-disk file counter, not the ledger, is authoritative for the next number.]
**Closest structural-migration template:** `C:/EV-Accounts/backend/migrations/1187_sherwood_city_council.sql` (entire file — same LOCAL_EXEC+LOCAL split, same plain-title convention, same pre-flight/post-verify/pairwise-identity-gate shape). **Key structural adaptations needed for Cornelius, absent from the Sherwood template:**
1. **Appointed-seat handling for 2 of the 4 filled councilor seats** (Baker, López) — reuse the `is_appointed=true`/`is_appointed_position=true` pattern from Tigard's mig 1159 (Hu/Anderson blocks), NOT Sherwood's uniform `false,false` (Sherwood had zero appointed seats).
2. **A genuinely vacant 5th seat** — no predecessor WashCo migration has modeled one; the closest codebase precedent is `migrations/105_tx_congressional_house_officials.sql`'s TX-23 block (`politician_id=NULL`, `is_vacant=true`, no politician row). See Roster Edge Case above for the explicit planner decision this requires.
3. **A UTF-8 accented officeholder name** (Edén López, "é") — the **first** accented name in the WashCo chain (Sherwood/Forest Grove/Tigard/Tualatin/Beaverton/Hillsboro rosters were all plain-ASCII). Postgres/the `essentials.politicians` table are UTF-8 and this is a proven-safe pattern elsewhere in the codebase (e.g. `migrations/076_pasadena_races_and_candidates.sql`, `080_covina_races_and_candidates.sql` both use accented Spanish names successfully) — just ensure the migration `.sql` file itself is saved as UTF-8 without a BOM.
**Closest headshot-migration template:** `C:/EV-Accounts/backend/migrations/1188_sherwood_headshots.sql` — same `(id, politician_id, url, type, photo_license)` shape, `photo_license='press_use'` for city-site-sourced portraits, omit `photo_origin_url` (column does not exist).
**Headshot-script template:** `_tmp-sherwood-headshots.py` (on disk, gitignored) — adapt the RGBA-composite-onto-white step (already present in this script per the Henderson lesson) but note Cornelius's sources need NO crop step (already exactly 4:5), simplifying the pipeline relative to Sherwood's 600×600 square sources.
**Wave-0 probe template:** `_tmp-sherwood-wave0-probe.sql` — adapt the geo_id-and-NAME-match check (see geo_id Verification section above — a name-match assertion is critical this phase, not just an existence check).

---

## Stance Evidence Landscape (guidance for the stance plan, not exhaustive research)

**Expect a thinner-than-average stance yield.** Of the 4 filled seats, 2 (Baker, López) are recent/ongoing appointees whose institutional voting/public-statement record is likely thin — Baker's appointment is only weeks old as of this research date (June 2026), and López, while appointed since April 2023, may have a correspondingly modest public record depending on what stance-research finds. The vacant 5th seat obviously yields zero stances. **Mayor Dalin, by contrast, has the single longest tenure of any official researched in this milestone (continuously seated/elected since Nov 2011)** — a genuinely deep record is plausible if stance-research finds it, though this research did not exhaustively mine it.

**Strong anchor found — local-immigration topic, directly attributable to two officials:** [MEDIUM confidence — WebSearch aggregation of a Nov 17, 2025 council minutes document, not independently re-fetched in full this session] Council President Godinez Valencia reminded the community of immigration-related resources on the City's website and encouraged registration with the **Equity Corps of Oregon**; Mayor Dalin separately reported that metro-area mayors and city managers were actively sharing information about federal immigration-enforcement activity, and emphasized community safety/documentation — urging residents not to intervene directly but to record incidents when safe to do so. This is directly on-topic for the `local-immigration` compass spoke and should be independently verified (primary-source minutes PDF, via `curl`+`pdftotext` per the OCR note above) and cited to the original document at stance-research time.

**Bilingual evidence expected, per D-15.** Cornelius is Oregon's most heavily Latino city (majority-Latino population; the city communicates bilingually, per its own site structure). Council minutes, city newsletters, and candidate statements may exist only in Spanish — these are admissible evidence under D-15's language-agnostic rule (cite the original Spanish URL, write faithful English-language reasoning, never machine-translate-and-embellish). Stance-research agents should actively search for Spanish-language primary sources, not just English-language ones, given this city's demographic reality.

**Local news:** no dedicated Cornelius newspaper exists; coverage would come from the Forest Grove News-Times / Hillsboro News-Times (both Pamplin Media, sharing the west-metro news desk). Per the standing D-16/181 authorization, `pamplinmedia.com` is expected to fail TLS for all fetchers — use search-index extraction, cite the original article URL, and stay strictly evidence-only.

**Ballotpedia** has a Cornelius city page but, consistent with every prior small WashCo city, contains no individual officeholder profiles beyond naming the Mayor — not useful as a stance-evidence source, though potentially still useful for a general-election/incumbency cross-check.

---

## Architecture Patterns

### Closest Analogs: Sherwood (181) for the district split + Mayor 2-year term, Tigard (178) for appointed-seat handling

Cornelius combines Sherwood's directly-elected-Mayor-on-a-2-year-term district split with Tigard's appointed-seat pattern (applied to 2 seats instead of Tigard's 2) — plus a genuinely new wrinkle, a real vacant seat, that neither predecessor needed to model.

```
City of Cornelius, Oregon, US (governments)
└── City Council (chambers, official_count=5 recommended)
    ├── LOCAL_EXEC district (geo_id=4115550, state='or', mtfcc=NULL)
    │   └── Mayor office → Jeffrey C. Dalin (-4115551, ELECTED, 2-year term, expires Dec 2026)
    └── LOCAL district (geo_id=4115550, state='or', mtfcc=NULL)
        ├── Councilor (Council President) → Angeles Godinez Valencia (-4115552, ELECTED, term expires Dec 2028)
        ├── Councilor → Edgar Baker (-4115553, APPOINTED, term expires Dec 2026)
        ├── Councilor → Edén López (-4115554, APPOINTED, term expires Dec 2026)
        └── Councilor → VACANT (-4115555 unused, or NULL-politician office row per TX-23 precedent)
```

### System Architecture Diagram

```
Cornelius resident address
        |
        v
  Backend /representatives/me
        |
  PIP query against geofence_boundaries
        |
  ┌───────────────────────────────────────────┐
  │  G4110 city boundary (geo_id=4115550)     │   <-- CORRECTED geo_id (was stated 4115350,
  │  → LOCAL_EXEC district (Mayor)            │        which actually belongs to Coquille)
  │  → LOCAL district (4 designed Councilor   │
  │    seats — 3 filled, 1 vacant)            │
  └───────────────────────────────────────────┘
        |
        v
  4 (or 5, if vacant seat seeded) officials returned
  (Mayor first via groupHierarchy.js)
        |
        v
  frontend PoliticianCard render
  (600x750 headshot [4/4 confirmed for filled seats] + compass stances + Local-section banner)
```

### Anti-Patterns to Avoid

- **Do NOT use geo_id `4115350`** — it belongs to Coquille, a completely different Oregon city. The correct value is `4115550`.
- **Do NOT cite or fetch `ci.cornelius.or.us`** — the domain does not resolve/connect. Use `corneliusor.gov` exclusively.
- **Do NOT model Baker or López as elected (`is_appointed=false`)** — both are currently seated by council appointment per their own official bio pages; use the Tigard `is_appointed=true`/`is_appointed_position=true` pattern for both.
- **Do NOT seat Citlalli Nuñez-Barragán as a current official** — she is not on the live roster; her seat is vacant, and her name should not be inserted as an active politician anywhere in this phase's migrations.
- **Do NOT invent a placeholder name for the vacant seat** — either seed the office row with `politician_id=NULL, is_vacant=true` (TX-23 precedent) or omit it entirely and document the gap; never fabricate an occupant.
- **Do NOT confuse the Charter §24 "elected... by position" staggering language with numbered public seat titles** — the city's own site uses plain `'Mayor'`/`'Councilor'` exclusively; do not append position numbers.
- **Do NOT model the Mayor's term as 4 years** — Cornelius's Mayor serves a 2-year term (§25), like Sherwood, not the 4-year Beaverton/Hillsboro/Tigard/Tualatin/Forest Grove pattern.
- **Do NOT skip the RGBA-to-white composite step on the headshot pipeline** — all 4 source images have a fully transparent background outside a circular photo mask; a naive RGB conversion will produce black corners.
- **Do NOT crop the headshot sources** — they are already exactly 1600×2000 (4:5); go straight from composite to resize.
- **Do NOT store or surface party affiliation** — antipartisan design forbids this; the Charter's own §26 ("all elections... must be nonpartisan") reinforces this.
- **Do NOT insert `slug`** on chambers — GENERATED ALWAYS.
- **Do NOT use `photo_origin_url`** in politician_images INSERT — column does not exist.
- **Do NOT default stance values** — blank spoke is correct when no evidence found; expect a lower stance count than most predecessor cities given the appointee/vacancy-heavy roster.
- **Do NOT use ON CONFLICT on districts or governments** — no unique constraints; use WHERE NOT EXISTS.
- **Do NOT use the ledger MAX (1187) as the next migration number** — the true on-disk MAX is 1195; next is 1196.
- **Do NOT fetch `codepublishing.com`'s live charter page directly** — it 403s; use the Wayback Machine snapshot.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Headshot resize | Custom PIL script | Existing `_tmp-*-headshots.py` pipeline (`_tmp-sherwood-headshots.py` as the closest template, for its RGBA-composite step) | Proven crop/composite→600×750 Lanczos pattern; Cornelius's sources skip the crop step (already 4:5) but still need the composite step |
| Stance research | Parallel agents | One agent at a time | Rate-limit rule — parallel burns quota with no usable output |
| Geofence load | Custom boundary ingest | None needed | At-large — city G4110 (4115550, CORRECTED) already loaded from v8.0 |
| groupHierarchy ordering | Custom sort | groupHierarchy.js Mayor-first rule | Already handles LOCAL_EXEC-first ordering |
| Banner processing | Custom crop/resize script | `scripts/banners/process_banner.py` + `upload_banner.py` | Already built, proven on Beaverton/Hillsboro/Tigard/Tualatin/Forest Grove/Sherwood/50 states |
| Scanned council-minutes PDF reading | WebFetch OCR | `curl` + `pdftotext` | WebFetch's OCR path has repeatedly failed on scanned Agenda Center PDFs in this milestone; the raw-text extraction path works |
| Charter text access | Retrying the live `codepublishing.com` 403 | Wayback Machine snapshot | Reliable, dated, complete mirror; same workaround class as prior WAF-blocked charter mirrors |
| geo_id trust | Trusting the phase description's stated geo_id at face value, or trusting "the query returned a row" | Always run the geofence-existence-AND-name-match probe FIRST | Fourth correction this milestone, and the first where the wrong value silently resolves to a real, different city |

---

## Common Pitfalls

### Pitfall 1: Trusting geo_id 4115350 because the query returns a row
**What goes wrong:** A structural migration is written against `4115350`, which DOES exist in `essentials.geofence_boundaries` — but as "Coquille city," not Cornelius. Every Cornelius office would silently attach to Coquille's real, unrelated geofence, breaking routing for Cornelius residents while corrupting a different city's future seed slot.
**Why it happens:** Every prior geo_id correction this milestone involved a value that was either absent (0 rows) or superseded — this is the first time the stated value resolves successfully but to the WRONG city, which a naive "does this geo_id have a G4110 row" check would miss entirely.
**How to avoid:** Always check the `name` column matches the target city, not just that a row exists: `SELECT name, geo_id, mtfcc FROM essentials.geofence_boundaries WHERE geo_id='4115350'` returns `Coquille city`, not `Cornelius city`. The correct value, found by name search, is `4115550`.
**Warning signs:** Any migration comment or Wave-0 note that says "geo_id 4115350 confirmed" without a name-match check should be treated as unverified.

### Pitfall 2: Modeling Baker and/or López as elected
**What goes wrong:** A stance-research agent or structural migration treats Baker/López's seats as ordinary at-large-elected positions, missing the `is_appointed=true`/`is_appointed_position=true` flags and the corresponding narrower, appointment-anchored evidence expectations.
**Why it happens:** The Charter's at-large language (§7) applies to how seats are ORIGINALLY filled at a general election — it doesn't override the fact that both of these specific officials currently hold their seats via council appointment (§32) to fill a mid-term vacancy, a status their own bio pages state explicitly.
**How to avoid:** Cross-check each official's individual bio page's "Election Information" list — an entry that says only "Appointed" (with no separate "Elected"/"Re-Elected" line) means the official is CURRENTLY appointed, not elected, regardless of the Charter's general at-large election method.
**Warning signs:** A migration block that sets `is_appointed=false` for Baker or López, or a stance-research agent that describes either of them as "elected at-large" without qualification.

### Pitfall 3: Seeding a placeholder person for the vacant seat
**What goes wrong:** A structural migration invents a name, or reuses Citlalli Nuñez-Barragán's name/photo, to fill the 5th seat and hit a round "5 officials" count.
**Why it happens:** Every prior WashCo city had a fully-filled roster, creating an implicit expectation that Cornelius's should too; the leftover stale `alt`-text on the vacant seat's placeholder image could be misread as "this person is still seated."
**How to avoid:** The seat is genuinely vacant as of this research date (confirmed by both the live roster page's "Vacant Position" label AND the visually-blank placeholder image). Either seed the office row with `politician_id=NULL, is_vacant=true` (TX-23 precedent) or omit it and document the gap — never invent or reuse a name.
**Warning signs:** Any politician row named "Citlalli Nuñez-Barragán" (or any other name) attached to the 5th councilor seat.

### Pitfall 4: Treating "elected... by position" (§24) as a numbered public seat title
**What goes wrong:** A migration titles seats "Councilor, Position 1" / "Position 2" etc., based on a literal reading of the Charter's staggering language.
**Why it happens:** The phrase "by position" sounds like it should map to a Beaverton-style numbered-position convention.
**How to avoid:** Cross-check against the live roster and staff-directory pages, both of which use plain `'Mayor'`/`'Councilor'` with zero numbered-position text anywhere. "By position" governs the election SCHEDULE (which 2 of 4 seats are up each cycle), not a public label.
**Warning signs:** Any office title string containing the word "Position" followed by a number.

### Pitfall 5: districts.state uppercase 'OR' for LOCAL districts
**What goes wrong:** Routing fails silently — address lookup returns no city-level officials.
**How to avoid:** All LOCAL/LOCAL_EXEC districts in Oregon use `state='or'` (lowercase), consistent across every prior WashCo city.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | geo_id 4115550 is the correct, sole G4110 row for "Cornelius city" (and 4115350 belongs to Coquille, not Cornelius) | geo_id Verification | LOW — directly verified against the live production DB via both a direct-value lookup (returns "Coquille city" for 4115350) and a name search (exactly 1 G4110 row named "Cornelius city," at 4115550) |
| A2 | Cornelius's council is pure at-large with plain titles, Mayor directly elected on a 2-year term, per the 2008 Charter | Form of Government | LOW — directly quoted from the primary-source Charter text (via a dated, complete Wayback Machine mirror) and independently cross-checked against the live roster/directory pages' plain-title convention |
| A3 | The current roster (Dalin/Godinez Valencia/Baker/López + 1 vacant) reflects the seated council as of 2026-07-03 | Live Roster | LOW — sourced directly from the official city roster page and cross-checked against each official's individual bio page; the vacancy is doubly confirmed (label + visually-blank placeholder image) |
| A4 | Baker and López are CURRENTLY appointed, not elected | Live Roster | LOW-MEDIUM — directly stated on each official's own bio page ("Appointed" with no separate elected entry); the small residual risk is that López's bio may simply be stale/incomplete rather than reflecting an unbroken appointed status since April 2023 — flagged as Open Question 3, does not change the recommended `is_appointed=true` flag either way |
| A5 | The vacant seat's departure date (when Nuñez-Barragán's tenure ended) is unknown | Live Roster / Roster Edge Case | LOW — does not block modeling; `vacant_since` can be left NULL, or a quick Wave-0/execution-time check of Agenda Center minutes between Nov 2025 and now could locate the exact date if desired |
| A6 | "Cornelius Civic Center - Oregon.JPG" depicts the Cornelius Public Library/City Hall, matching D-14's named alternate | Community Banner | LOW — directly confirmed via the Commons API's `ImageDescription` field, which explicitly states "serves as city hall and the library," cross-linked to the `Cornelius_Public_Library` Wikipedia article |
| A7 | No street-level main-street or skyline banner candidate exists in `Category:Cornelius, Oregon` on Wikimedia Commons | Community Banner | MEDIUM — the category was fully enumerated via the API (25 files, all reviewed by title/description) and a targeted full-text Commons search for "Cornelius Oregon downtown"/"TV Highway Cornelius" also returned no matches, but the `Category:Washington County, Oregon` subcategory tree (13 subcats) was not exhaustively searched this session — a Wave-0 dig into "Scenic images of Washington County, Oregon" or "Structures in Washington County, Oregon" could still surface a better candidate |
| A8 | On-disk migration MAX is 1195 (next=1196) as of this research session | Migration Reference | LOW — directly verified via `ls` sorted numerically, matches the milestone-memory expectation exactly |
| A9 | Ext_id range -4115551..-4115555 is unused | Migration Reference | LOW — confirmed via live DB query this session |
| A10 | The Nov 17, 2025 council-minutes immigration-enforcement discussion (Godinez Valencia + Dalin) is accurately characterized | Stance Evidence Landscape | MEDIUM — sourced via a WebSearch snippet/summary of the minutes document, not an independently re-fetched and fully-read primary-source PDF in this session; stance-research agents should re-fetch and read the actual PDF (via curl+pdftotext) before citing it as evidence |

---

## Open Questions

1. **Whether to seed the vacant 5th councilor seat as a NULL-politician office row (TX-23 precedent) or omit it entirely**
   - What we know: a real precedent exists (`migrations/105_tx_congressional_house_officials.sql`, TX-23), and the schema supports it (`offices.politician_id` nullable, `offices.is_vacant` boolean, `offices.vacant_since` nullable timestamptz).
   - What's unclear: this precedent is from a different milestone/chamber (US House), not yet used anywhere in the WashCo city chain; D-13's default framing ("seed the office row only if milestone precedent supports it") is ambiguous about whether a cross-milestone precedent counts.
   - Recommendation: present both options to the planner/discuss step explicitly; this research recommends option (a) — seed it — since it correctly represents the Charter's designed 5-seat body, but flag it as a genuinely new decision, not a silent default.

2. **Deeper Wikimedia Commons search for a Cornelius-adjacent street-level or skyline banner candidate**
   - What we know: `Category:Cornelius, Oregon` is fully enumerated (25 files, none ideal); `Category:Washington County, Oregon` is a 13-subcategory container not yet dug into.
   - What's unclear: whether "Scenic images of Washington County, Oregon" or "Structures in Washington County, Oregon" contain a Cornelius-specific or immediately-adjacent street scene.
   - Recommendation: Wave-0/the banner plan should spend a short, bounded search pass on these two subcategories, plus an Unsplash check per the standing D-10 fallback rule, before defaulting to the Civic Center/Library candidate.

3. **Whether Edén López's "Appointed April 2023–Dec 2026" bio entry reflects continuous appointed status, or an incompletely-updated bio that omits a subsequent election**
   - What we know: her bio lists only one "Appointed" entry, unlike Godinez Valencia's two-entry elected/re-elected history; the city's Nov-2026-election page separately lists her as an incumbent candidate for that cycle.
   - What's unclear: whether she has, at some point since April 2023, actually stood for and won an election that her bio simply doesn't reflect.
   - Recommendation: does not block planning — `is_appointed=true` is the correct current-status flag regardless of this ambiguity's resolution. A quick Washington County SEL101 filing check at Wave-0/stance-research could resolve it if a specific claim depends on the distinction.

4. **Whether any roster change occurs between this research session (2026-07-03) and plan/execution time — especially given the OPEN vacancy-fill application window (closes July 22, 2026)**
   - What we know: the vacancy application period is open NOW and will close July 22, 2026 — a new councilor could plausibly be appointed before this phase executes, depending on timing.
   - What's unclear: the exact appointment timeline/date.
   - Recommendation: Wave-0 should re-fetch `corneliusor.gov/267/City-Council` fresh immediately before finalizing the roster — cheap to do given the direct, no-WAF access — specifically checking whether the "Vacant Position" seat has been filled.

---

## Environment Availability

No new external tools required beyond the existing project infrastructure. This phase has a materially LOWER external-dependency risk than most WashCo cities: no JS-capable fetch tool is needed for headshots (unlike Forest Grove), no bulk-portal-absence gap exists (unlike Tigard), and no custom geofence ingest is needed (pure at-large, city geo_id `4115550` already present from the v8.0 OR TIGER load, corrected and confirmed this session).

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL / psql | Migration apply | Yes (via EV-Accounts `.env`, verified live this session) | PostgreSQL 18.1 client, confirmed working this session | — |
| corneliusor.gov | Roster + governance text + headshots | **YES — no WAF, direct HTTP 200 confirmed this session for text AND images** | CivicEngage/CivicPlus CMS | Not needed |
| ci.cornelius.or.us | (attempted, not needed) | **NO — connection failure, does not resolve** | — | Use `corneliusor.gov` exclusively; do not cite the dead domain |
| codepublishing.com (live charter mirror) | Charter text | **NO — HTTP 403** for both curl and WebFetch | — | Wayback Machine snapshot (confirmed HTTP 200, full text) |
| Wikimedia Commons | Community banner source | Yes — category fully enumerated, 3 candidates identified and license-checked, though none ideal | — | Unsplash fallback per pipeline doc; deeper Washington County subcategory search recommended (Open Question 2) |
| pamplinmedia.com | Stance/photo evidence (shared Forest Grove News-Times ecosystem) | Not independently re-tested this session; carried forward as known-dead per 181 D-16 | — | D-16 search-index extraction |
| corneliusor.gov AgendaCenter (scanned minutes PDFs) | Stance evidence | Yes — directly fetchable; appear to be scanned/OCR'd, not text-native | — | `curl` + `pdftotext` (not WebFetch OCR) |
| Python 3 + Pillow + requests | Headshot resize pipeline | Yes (existing `_tmp-*-headshots.py` pattern) | — | — |
| scripts/banners/process_banner.py + upload_banner.py | Community banner | Yes (proven on Beaverton/Hillsboro/Tigard/Tualatin/Forest Grove/Sherwood/50 states) | — | — |

**Missing dependencies with no fallback:** none.

**Missing dependencies with fallback:** `codepublishing.com` live charter fetch (fallback = Wayback Machine snapshot, already used successfully this session); `pamplinmedia.com` direct fetch (fallback = D-16 search-index extraction); AgendaCenter scanned PDFs (fallback = `curl`+`pdftotext` instead of WebFetch OCR).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | SQL verification queries (inline psql, no test runner) |
| Config file | None — inline verification gates in plan |
| Quick run command | `psql $DATABASE_URL -c "SELECT COUNT(*) FROM essentials.offices o JOIN essentials.chambers ch ON o.chamber_id=ch.id WHERE ch.name='City Council' AND ch.government_id=(SELECT id FROM essentials.governments WHERE name='City of Cornelius, Oregon, US')"` |
| Full suite command | E2E gate (see below), extended with a banner-render check and a vacant-seat-representation check |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WASH-08 | Correct geo_id used (4115550, CORRECTED — and NOT accidentally attached to Coquille's 4115350) | SQL count + name check | `SELECT name, geo_id FROM essentials.geofence_boundaries WHERE geo_id='4115550'` = 1 row, name='Cornelius city' | Wave-0 inline — MUST run before any other probe |
| WASH-08 | 4 filled + (0 or 1 vacant per planner decision) officials seeded with offices | SQL count | `SELECT COUNT(*)...` matches the planner's chosen official_count (4 or 5) | Wave-0 inline |
| WASH-08 | Mayor sorts first in display | SQL + live browse | `groupHierarchy.js` + human verify | Existing code |
| WASH-08 | Headshots at 600×750 in Storage for all 4 filled seats | SQL count + CDN HTTP 200 | `SELECT COUNT(*) FROM essentials.politician_images WHERE...` = 4 | Wave-2 inline; expect full 4/4 given confirmed direct sourcing |
| WASH-08 | Evidence-only stances render | SQL count + live browse | `SELECT COUNT(*) FROM inform.politician_answers WHERE politician_id=...` | Wave-3 inline; expect a lower total than predecessor cities given the appointee/vacancy-heavy roster |
| WASH-08 | Purple hasContext chip | Browser/live browse | `essentials.empowered.vote/results?browse_geo_id=4115550&browse_mtfcc=G4110` | Wave-3 human verify |
| WASH-08 | Community banner renders (not gradient fallback) | Browser/live browse | Same browse URL — Local section shows photo; single-word `'cornelius'` key | Wave-3 human verify |
| WASH-08 | Section-split = 0 rows | SQL (canonical query) | Section-split query after seed | Wave-1 inline |
| WASH-08 | No duplicate government row | SQL | `SELECT COUNT(*) FROM essentials.governments WHERE name='City of Cornelius, Oregon, US'` = 1 | Wave-1 inline |
| WASH-08 | Baker and López both flagged `is_appointed=true` | SQL | `SELECT is_appointed FROM essentials.politicians WHERE external_id IN (-4115553,-4115554)` both true | Wave-1 inline |

### E2E Verification Gate (Wave-1 structural plan) + Banner Check (Wave-3)

1. `essentials.geofence_boundaries` row exists for geo_id='4115550' AND mtfcc='G4110' AND name='Cornelius city' — run this FIRST, checking the name field explicitly (not just row existence — Pitfall 1)
2. `governments` row count = 1 for name='City of Cornelius, Oregon, US'
3. `chambers` row exists with name='City Council', official_count matching the planner's vacant-seat decision (4 or 5)
4. `districts` rows: exactly 1 LOCAL_EXEC + 1 LOCAL for geo_id='4115550' state='or'
5. `offices` count matches official_count for the Cornelius chamber, `representing_city='Cornelius'` set on all filled offices (inline)
6. `politician_images` count for Cornelius politicians — expect full 4/4 given confirmed direct sourcing
7. `politician_answers` count ≥ 1 per filled official where evidence exists (honest blanks OK for thin-record appointees; 0 for Mayor Dalin specifically would warrant a re-check given his long tenure)
8. Section-split query (canonical version) returns 0 rows for geo_id 4115550
9. Human-verify: live browse link shows Mayor first + 3 filled councilors (+ vacant seat representation if seeded), compass stances visible, no party label
10. (Wave-3 banner) Human-verify: Local section banner shows a Cornelius photo, not the tier gradient fallback

### Wave 0 Gaps

- [ ] DB probe (run first): confirm geo_id 4115550 has exactly 1 G4110 row named "Cornelius city" — and confirm 4115350 is NOT Cornelius (belongs to Coquille)
- [ ] DB probe: confirm no existing government/chamber rows for Cornelius (name search) — this research found 0
- [ ] DB probe: confirm ext_id range -4115551..-4115555 is unused — this research found 0 rows
- [ ] DB probe / disk `ls`: re-confirm disk migration MAX (this research found 1195 → next 1196)
- [ ] Fresh fetch of `corneliusor.gov/267/City-Council` to re-confirm the roster — specifically whether the vacant seat has been filled given the July 22, 2026 application deadline
- [ ] Re-download all 4 headshot documentIDs to confirm continued availability (this research found 4/4 HTTP 200, 1600×2000 PNG each)
- [ ] Planner decision: seed the vacant 5th seat as a NULL-politician office row (TX-23 precedent) or omit it — document whichever is chosen
- [ ] Search `Category:Scenic images of Washington County, Oregon` and `Category:Structures in Washington County, Oregon` on Wikimedia Commons, plus Unsplash, for a stronger banner candidate before defaulting to the Civic Center/Library image
- [ ] Fetch and read (via curl+pdftotext) the actual Nov 17, 2025 council minutes PDF before citing the immigration-enforcement discussion as stance evidence

---

## Security Domain

This phase is a data-seeding/migration phase with no new user-facing input surface, no new authentication/session code, and no new API endpoints. Most ASVS categories are not applicable.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No new auth surface introduced |
| V3 Session Management | No | No new session surface introduced |
| V4 Access Control | No | No new access-control surface introduced |
| V5 Input Validation | Marginal | All migration values are static, researcher-authored SQL literals — no dynamic/untrusted user input is concatenated into any query in this phase's deliverables |
| V6 Cryptography | No | No new cryptographic surface introduced |

### Known Threat Patterns for this phase's stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection via migration authoring | Tampering | All migration SQL is static and researcher/executor-authored (no runtime string interpolation of external input); this is the same posture as every prior WashCo structural/headshot/stance migration in this milestone |
| Untrusted third-party image ingestion (headshots/banner) | Tampering | Images are sourced only from the official city site, Wikimedia Commons (license-verified), or the pre-authorized fallback chain — never from arbitrary user-submitted URLs; processed through the existing Pillow-based composite/resize pipeline (no execution of downloaded content) |
| Mojibake / encoding corruption of accented names (Edén López) | Tampering (data integrity) | Save the migration `.sql` file as UTF-8 without a BOM; the `essentials.politicians` table and Postgres connection are both UTF-8, and accented Spanish names are a proven-safe pattern elsewhere in the codebase (Pasadena/Covina migrations) |

---

## Package Legitimacy Audit

**No new external packages are installed by this phase.** All tooling (psql, curl, Python 3 + Pillow + requests/psycopg2, the existing `scripts/banners/*.py` pipeline) is already installed and proven across the six preceding WashCo deep-seed phases (175–181). The Package Legitimacy Gate protocol does not apply — there is nothing to audit.

---

## Sources

### Primary (HIGH confidence)
- `essentials.geofence_boundaries` / `essentials.governments` / `essentials.chambers` / `essentials.politicians` / `inform.compass_topics` / `supabase_migrations.schema_migrations` live queries (psql, this session) — CORRECTED geo_id from `4115350` (belongs to Coquille) to `4115550` (confirmed sole Cornelius G4110 row); confirmed greenfield status; confirmed clean ext_id range; confirmed ledger-vs-disk migration counter trap (ledger 1187, disk 1195).
- `https://web.archive.org/web/2026/https://www.codepublishing.com/OR/Cornelius/html/CorneliusCH.html` — the 2008 City of Cornelius Charter, fetched directly, full text (§1–§42) — form of government, Mayor/Council terms, Council President, vacancy-filling mechanism.
- `https://www.corneliusor.gov/267/City-Council` — fetched directly via curl, HTTP 200, no WAF — full current roster with titles and headshot `<img>` tags.
- `https://www.corneliusor.gov/Directory.aspx?eid={31,32,34,35}` — individual staff-directory bio pages, fetched directly — "Election Information" appointed-vs-elected history for all 4 filled officials.
- `https://www.corneliusor.gov/ImageRepository/Document?documentID={1975,1977,1979,2324,2325}` — direct binary downloads, all HTTP 200 — headshot source images, dimensions, and (for the vacant seat's leftover image) visual confirmation of a blank placeholder.
- `https://commons.wikimedia.org/w/api.php` (categorymembers + imageinfo queries) — confirmed the full 25-file `Category:Cornelius, Oregon` listing, license, and dimensions for all banner candidates; two candidates additionally directly viewed.
- `ls C:/EV-Accounts/backend/migrations | sed -E 's/^([0-9]+)_.*/\1/' | sort -n` — confirmed disk MAX is 1195 as of 2026-07-03.
- `C:/EV-Accounts/backend/migrations/1187_sherwood_city_council.sql`, `1159_tigard_city_council.sql`, `105_tx_congressional_house_officials.sql` — read in full/targeted-grep this session for structural, appointed-seat, and vacant-seat modeling precedents respectively.
- Direct curl connection tests — `corneliusor.gov` (HTTP 200, no WAF), `ci.cornelius.or.us` (connection failure, confirmed dead), `codepublishing.com` (HTTP 403).

### Secondary (MEDIUM confidence)
- WebSearch aggregation of a Nov 17, 2025 Cornelius council minutes PDF (title text garbled — consistent with a scanned/OCR'd document) — immigration-enforcement discussion attributed to Mayor Dalin and Council President Godinez Valencia; not independently re-fetched and fully read in this session.
- WebFetch of `https://www.corneliusor.gov/385/Elections-2024` (auto-redirected/served the live 2026 election page instead) — Nov 2026 election-cycle candidate confirmation (Dalin unopposed for Mayor; López incumbent + Baker candidate for the 2 councilor seats up).
- WebFetch of `https://ballotpedia.org/Cornelius,_Oregon` — incorporation date, Mayor name; confirmed no individual officeholder profiles (consistent with prior WashCo cities).

### Tertiary (LOW confidence)
- Additional unvetted Wikimedia Commons files in `Category:Cornelius, Oregon` beyond the 3 directly assessed (e.g., the Sanborn Fire Insurance Map subcategory, the 9 Cornelius Methodist Cemetery DPLA photos, the 2 Albert S. Sholes House photos) — reviewed by title/category only, near-certainly not usable banner candidates.
- `Category:Washington County, Oregon` subcategory tree — enumerated at the top level only (13 subcategories); not dug into for Cornelius-adjacent street scenes (Open Question 2).

---

## Metadata

**Confidence breakdown:**
- Standard stack / migration shape: HIGH — direct template reuse from Sherwood/Tigard/TX-23, all read in full or targeted-grep this session.
- Architecture (form of government, roster): HIGH — primary-source Charter text + live city-site cross-check, zero contradictions found.
- geo_id: HIGH — directly verified and corrected against the live production DB, with the specific failure mode (wrong-city collision) identified and documented.
- Pitfalls: HIGH — all five pitfalls are grounded in this session's direct findings, not speculative.
- Community banner: MEDIUM — best-available candidate identified and license-verified, but genuinely no ideal match exists in the searched scope; a deeper subcategory search remains open.
- Stance evidence landscape: MEDIUM — a strong anchor was found, but the overall landscape survey (per D-08's "guidance, not exhaustive research" framing) was not exhaustive, and the vacant/appointee-heavy roster makes yield harder to predict than in prior cities.

**Research date:** 2026-07-03
**Valid until:** 7 days (fast-moving — the vacancy-fill application window closes July 22, 2026, and could change the roster before execution; the geo_id/Charter/schema findings are stable for longer, but the roster snapshot specifically should be re-verified at Wave-0 regardless)
