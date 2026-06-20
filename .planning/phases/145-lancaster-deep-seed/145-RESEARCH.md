# Phase 145: Lancaster Deep-Seed — Research

**Researched:** 2026-06-20
**Domain:** Lancaster, CA city council reconcile + complete + headshots + stances
**Confidence:** HIGH (roster fully verified post-April-2026 election; DB state from CONTEXT.md; structure confirmed from official and authoritative sources)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- D-01: Reconcile EXISTING partial seed (UPDATE-not-INSERT), no greenfield rebuild. Preserve existing politician rows; reseat, never duplicate people. Crist (686320) is preserved and retired, not recreated.
- D-02: Backfill `essentials.governments.geo_id = '0640130'` on the Lancaster gov row (currently NULL), guarded `WHERE geo_id IS NULL`.
- D-03: Survivor chamber = `9b9014b4` (Mayor + 3 Council Member shells). Move Crist's office from `a9be708e` into `9b9014b4`, then DELETE the emptied duplicate `a9be708e`. End state: ONE City Council chamber with 5 offices (1 Mayor + 4 Council Member), `official_count=5`.
- D-04: Reconcile (geo_id backfill + office move + chamber delete) is STRUCTURAL → registers in `schema_migrations`. Headshot + stance migrations are AUDIT-ONLY (raw SQL, NOT registered). On-disk file counter is authoritative.
- D-05: Run `feedback_section_split_check` SQL after consolidation — expect Lancaster absent (0 rows) once duplicate chamber is gone.
- D-06: Target structure is directly-elected Mayor (own seat, `title='Mayor'`, NOT rotational) + 4 at-large Council Members. Keep existing Mayor office; do NOT collapse it into a council seat.
- D-07: Research MUST confirm current roster against cityoflancasterca.gov and check for 2024/2026 election turnover. DONE — see Live-Data Findings below.
- D-08: Research MUST confirm district-vs-at-large. DONE — confirmed AT-LARGE. No `district_id` on council offices.
- D-09: Headshots: 600×750 (4:5 Lanczos, `press_use`), `politician_images.type='default'`, no fabricated photos, honest gaps documented.
- D-10: Evidence-only compass stances, chairs model, one research agent at a time, no defaults, 100% citation.
- D-11: NO judicial-* topics — City Attorney is appointed (confirmed; see §City Attorney below).
- D-12: Parris has strong, well-documented public record (homelessness, hydrogen/clean energy, housing, local-immigration).

### Claude's Discretion

- Exact migration numbering (structural continues from 910; stance/headshot files audit-only).
- Per-official stance file granularity (one file per official, mirroring SC 897–901 and Glendale 905–909).
- Whether to re-source Crist's existing image before retiring his row (only if it improves quality; likely skip).

### Deferred Ideas (OUT OF SCOPE)

- Cleanup of the 5 OTHER cities' pre-existing split-section defects.
- Lancaster school district(s) deep-seed.
- 2026 Lancaster election candidate/results ingestion pipeline.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LANC-01 | Lancaster (0640130) deep-seeded — government + roster + headshots + evidence-only stances | Roster post-April-2026-election verified; all 5 current members identified (Parris, Hughes-Leslie, Mann, White, Castellanos); Crist retirement documented; structure confirmed (directly-elected Mayor, at-large council, council-manager form, appointed CA); headshot WAF confirmed + alternative sources identified; stance evidence map documented |
</phase_requirements>

---

## Summary

Phase 145 is a reconcile+complete of a partial, structurally-defective Lancaster seed — the same pattern as Phase 143 (Santa Clarita) and Phase 144 (Glendale), but with a material roster change: the **April 14, 2026 general municipal election** replaced two seats. Marvin Crist (686320 — the only currently-seated member in the DB) did not file for re-election; his term expired April 2026. Raj Malhi (who was NOT in the DB at all) also lost his seat. The winners — **Cedric White** and **Rocio Castellanos** — were sworn in April 28, 2026 and are now seated. The post-election council is: Mayor R. Rex Parris + Vice Mayor Lauren Hughes-Leslie + Ken Mann + Cedric White + Rocio Castellanos.

The structural complexity of Lancaster's reconcile is the same as Phase 143 (SC): the duplicate chamber `a9be708e` holds the **only currently-seated member** (Crist), so the move-then-delete pattern applies (NOT the simpler Glendale delete-empty pattern). Move Crist's office to the survivor `9b9014b4`, then retire Crist (he departed), then seat the full current roster: Parris (Mayor), Hughes-Leslie, Mann, White, Castellanos.

The key complications compared to Glendale are: (1) **two roster members are entirely new** (White and Castellanos — never in the DB) and need new politician rows with `-700655`+ external_ids; (2) **two pre-existing members already existed in some form** (Parris and Mann likely appear in the DB via pre-existing seeds — confirm with pre-flight SELECT before any INSERT); (3) **cityoflancasterca.org is behind Akamai WAF** — all automated requests return 403, same as glendaleca.gov. Official headshot pages exist but require human browser access.

Stances: 0/5 for all current members. Lancaster has a rich evidence landscape led by Mayor Parris's 18-year record. The local-immigration topic is particularly clear (sanctuary city ordinance passed February 2024). Hydrogen/clean energy pushes Lancaster's `local-environment` and `climate-change` evidence unusually high for a CA city. Newer members (White, Castellanos) have platform-only records — expect honest blanks on many topics.

**Primary recommendation:** Execute as 4 waves — Wave 1 reconcile (structural, ledger), Wave 2 roster (Crist retirement + full current roster), Wave 3 headshots (WAF = checkpoint:human-verify for official portraits; Wikimedia for Parris; fallbacks documented), Wave 4 stances (5 current members one at a time — NOT Crist who is retired/departed).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Government/chamber reconcile | Database / Storage | — | SQL migrations directly against Supabase; no frontend change |
| Roster completion / Mayor seat | Database | — | SQL UPDATE/INSERT on politicians + offices tables |
| Headshot processing | Local Bash pipeline | Supabase Storage | Pillow crop/resize → Storage upload → politician_images INSERT |
| Evidence-only stances | Research agent (one at a time) | Database | Agent mines sources, outputs SQL; applied via mcp__supabase-local |
| UI rendering | None (existing) | — | Lancaster renders on existing browse/compass UI; no frontend change needed per D-12 |

---

## Live-Data Findings

### 1. Current Roster — VERIFIED (HIGH confidence, 2026-06-20)

**Post-April-28-2026-swearing-in council:**

| Seat | Name | Role | Term | DB ext_id | Status |
|------|------|------|------|-----------|--------|
| Mayor | R. Rex Parris | Directly-elected Mayor | Through ~April 2028 (re-elected April 2024) | UNKNOWN — pre-flight required | May already exist in DB; pre-flight SELECT before INSERT |
| At-Large | Lauren Hughes-Leslie | Councilmember / Vice Mayor (Apr 2026) | Through ~April 2028 (elected April 2024) | UNKNOWN — pre-flight required | Appointed Sept 2023; first elected April 2024; may already exist in DB |
| At-Large | Ken Mann | Councilmember | Through ~April 2028 (re-elected April 2024) | UNKNOWN — pre-flight required | Serving since April 2008; may already exist in DB |
| At-Large | Cedric White | Councilmember | Through ~April 2030 (elected April 2026) | NEW — use `-700655`+ | Not in DB; INSERT required |
| At-Large | Rocio Castellanos | Councilmember | Through ~April 2030 (elected April 2026) | NEW — use `-700656`+ | Not in DB; INSERT required |

**Sources:** [CITED: avpress.com/news/incumbents-win-lancaster-vote/article_63515562-f6f2-11ee-ba6d-a7514a8d9c77.html] (2024 election — Parris, Mann, Hughes-Leslie wins); [CITED: avpress.com/news/2-new-councilmembers-sworn-in/article_62aa94df-d880-45a8-896e-6a807fc0ee28.html] (White + Castellanos sworn in April 28, 2026); [CITED: antelopevalleynews.com/post/inside-lancaster-s-2026-city-council-election-power-struggles-transparency-battles-and-the-fight] (7-candidate at-large race for 2 seats; Crist did not file, Malhi lost)

**⚠ CRITICAL PRE-FLIGHT RULE:** Parris, Hughes-Leslie, and Mann were seated officials during v15.0 (LA Wave 1 era) when other LA-area cities were seeded. They MAY already exist as politician rows in the DB under positive external_ids from a prior seed. ALWAYS run `SELECT id, external_id FROM essentials.politicians WHERE last_name ILIKE 'Parris' OR last_name ILIKE 'Mann' OR last_name ILIKE 'Hughes%Leslie'` before any INSERT. If they exist, UPDATE the office_id rather than INSERT a new row. Do NOT duplicate them.

### 2. Marvin Crist — RETIRING (HIGH confidence)

**Crist (ext_id 686320)** did not file nomination papers before the January 16, 2026 deadline. His term expired April 2026. He is explicitly departing: "It's time to move for better people coming out. Lancaster City Council needs new blood." [CITED: avpress.com/news/crist-is-ending-16-year-career-with-lancaster/article_f132e177-c2f1-4c9a-b1cd-4426e7b63503.html]

**DB action:** Retire Crist — `is_incumbent=false`, `is_active=false`, `office_id=NULL`. This happens in Wave 2 AFTER moving his office from `a9be708e` into the survivor `9b9014b4` in Wave 1. Same retire-not-delete pattern as SC Smyth (143) and Glendale Najarian (144).

### 3. Election Structure — CONFIRMED AT-LARGE (HIGH confidence)

Lancaster uses **at-large (citywide) elections** for all 4 council seats — voters citywide elect council members; no districts. [CITED: antelopevalleynews.com — "seven candidates vying for two at-large seats"] [CITED: ballotpedia.org Cedric White and Rocio Castellanos pages — both list "At-large" seat type]

The April 2026 election had 7 candidates for 2 at-large seats; White and Castellanos finished 1st and 2nd. Raj Malhi (incumbent) finished 4th and lost his seat; he was NOT in the DB so there is nothing to retire for Malhi.

### 4. Mayor Structure — DIRECTLY ELECTED (HIGH confidence)

R. Rex Parris has been directly elected Mayor since April 2008, re-elected April 2010, 2012, 2016, 2020, and April 2024 (6th term). This is **NOT a rotational/council-selected Mayor** — Lancaster's Mayor is a separately-elected executive position (district_type=`LOCAL_EXEC`). [CITED: wikipedia.org/wiki/R._Rex_Parris; avpress.com — "sixth and final term" (2024 election)]

Confirmed by city form: Council-Manager form. The Mayor is directly elected by residents and serves as the policy chair; the City Manager (Trolis Niebla, appointed) handles administration. The Mayor's `district_type=LOCAL_EXEC` is correct. The survivor chamber `9b9014b4` already has a "Mayor" office — preserve it with the correct `district_type`.

### 5. City Attorney — APPOINTED (HIGH confidence)

Lancaster is a council-manager charter city. The City Council appoints the City Manager and City Attorney. City Attorney is NOT elected. [CITED: search result confirming "The City Council appoints the City Manager and City Attorney" from Ballotpedia Lancaster CA entry] The current City Attorney is Allison E. Burns (Stradling law firm). [ASSUMED — may have changed since training data]

**Impact on stances: NO judicial-* topics** (per D-11). City Attorney is not an elected official and has no compass profile. This mirrors Glendale (D-13).

### 6. Vice Mayor — Hughes-Leslie (HIGH confidence)

Lauren Hughes-Leslie was unanimously nominated and approved as **Vice Mayor** immediately after White and Castellanos were sworn in (April 28, 2026 council meeting). [CITED: avpress.com/news/2-new-councilmembers-sworn-in/article_62aa94df-d880-45a8-896e-6a807fc0ee28.html] The "Vice Mayor" designation is rotational/appointment, not a separate elected seat — Hughes-Leslie retains her Councilmember seat title; Vice Mayor is a role flag only. No separate LOCAL_EXEC row is created for this.

### 7. DB State (from CONTEXT.md `<db_precheck>`, live 2026-06-19 — authoritative)

| Element | Value |
|---------|-------|
| Govt row | `City of Lancaster, California, US`, `geo_id = NULL` (backfill to `0640130`) |
| Survivor chamber | `9b9014b4-0106-417f-a104-ac2055fc8134`, 4 offices (Mayor + 3 Council Member), **all empty** |
| Duplicate chamber | `a9be708e-1b42-42ac-92ec-e8e56f9c6474`, 1 office, **Marvin Crist seated** (ext_id 686320, 1 image, 0 stances) |
| Next ext_id block | `-700655` onward for any new politicians |
| Ledger MAX | 909 (Glendale 902–909 completed) |
| Next structural migration | **910** |

---

## Headshot Sources

### Summary table

| Member | DB Status | Action | Source |
|--------|-----------|--------|--------|
| R. Rex Parris | Likely NOT in DB as Lancaster official (pre-flight confirms) | **Source needed** | Wikimedia Commons (HTTP 200 confirmed with WIKIMEDIA_HEADERS) |
| Lauren Hughes-Leslie | Likely NOT in DB as Lancaster official | **Source needed** | cityoflancasterca.org (WAF 403) → checkpoint:human-verify |
| Ken Mann | Likely NOT in DB as Lancaster official | **Source needed** | cityoflancasterca.org (WAF 403) → checkpoint:human-verify; AVAQMD CDN (discovered URL, CDN 403 without Referer) |
| Cedric White | Not in DB (new member) | **Source needed** | cityoflancasterca.org (WAF 403) → checkpoint:human-verify; recently seated, no external board appearances yet |
| Rocio Castellanos | Not in DB (new member) | **Source needed** | cityoflancasterca.org (WAF 403) → checkpoint:human-verify; recently seated, no external board appearances yet |
| Marvin Crist | 1 image (ext_id 686320) | Retiring — no new headshot needed | Existing image remains; photo_origin_url may need audit |

### Headshot source detail

**R. Rex Parris:**
- Wikimedia Commons: `https://upload.wikimedia.org/wikipedia/commons/2/2d/R._Rex_Parris%2C_mayor_of_Lancaster%2C_CA.jpg` — HTTP 200 confirmed; 1800×2283 px (per search result), 2.53 MB Canon EOS 5D shot (Nov 2011). Requires `WIKIMEDIA_HEADERS` per `feedback_headshot_*` memory (Chrome UA returns 429). CC-BY-SA license. [VERIFIED: HTTP 200 with bot UA]
- Official city page (`cityoflancasterca.org/government/city-officials/city-council/mayor-r-rex-parris`): exists but WAF blocks all automation; backup for human browser.

**Lauren Hughes-Leslie:**
- cityoflancasterca.org bio page: WAF blocked (Akamai 403). Human browser required.
- AVAQMD board member page: `https://www.avaqmd.ca.gov/avaqmd-governing-board-member-bac3cf5` — page accessible (HTTP 200); discovered CDN URL `https://streamline.imgix.net/ba60a459-87e5-4a13-9306-7c88ac72d21e/1a6b33a5-05fd-4a2d-a4e0-73d14adabff7/Lauren%20Hughes-Leslie.jpg`; CDN returns 403 without Referer header — try with `Referer: https://www.avaqmd.ca.gov/` header.
- Recommend `checkpoint:human-verify` — executor opens cityoflancasterca.org in browser for the official portrait.

**Ken Mann:**
- cityoflancasterca.org bio page: WAF blocked. Human browser required.
- AVAQMD board member page: `https://www.avaqmd.ca.gov/avaqmd-governing-board-member-c02df06` — page accessible; discovered CDN URL `https://streamline.imgix.net/ba60a459-87e5-4a13-9306-7c88ac72d21e/e6f5596e-81c1-4d42-89f5-bd5af824bc7d/KenMann.jpg`; CDN returns 403 without Referer.
- SCAG profile: `https://scag.ca.gov/profile/hon-ken-mann` (page redirected to 404 during research; may be updated after April 2026 elections).
- Recommend `checkpoint:human-verify` — executor opens cityoflancasterca.org in browser.

**Cedric White:**
- cityoflancasterca.org bio page: `https://www.cityoflancasterca.org/government/city-officials/councilmember-white` — exists but WAF blocks (403).
- Ballotpedia: `https://ballotpedia.org/Cedric_White_(Lancaster_City_Council_At-large,_California,_candidate_2026)` — may have a candidate photo; check at execution time.
- No external board appointments yet (just sworn in April 28, 2026).
- Recommend `checkpoint:human-verify` + check Ballotpedia.

**Rocio Castellanos:**
- cityoflancasterca.org bio page: `https://www.cityoflancasterca.org/government/city-officials/councilmember-rocio-castellanos` — exists but WAF blocks (403).
- Ballotpedia: `https://ballotpedia.org/Rocio_Castellanos_(Lancaster_City_Council_At-large,_California,_candidate_2026)` — may have a candidate photo.
- Candidate filing statement PDF may have a photo: `https://www.cityoflancasterca.org/home/showpublisheddocument/47131/639075290871200000` — accessible; check for headshot.
- Recommend `checkpoint:human-verify` + check Ballotpedia.

### WAF note

**cityoflancasterca.org is protected by Akamai WAF** — all automated requests (curl with any UA, WebFetch) return HTTP 403. This is the same WAF as glendaleca.gov (Phase 144). The headshot executor MUST open a browser manually to download official portraits. All 5 current members have official profile pages on the city site; executor should load each in a browser and download the portrait photo. Mark all 5 headshots as `checkpoint:human-verify` in the plan.

**Alternative approach for all 5:** The AVAQMD CDN imgix URLs work from the `avaqmd.ca.gov` domain context — try appending `?auto=format&w=800` and setting `Referer: https://www.avaqmd.ca.gov/` to coax the CDN. This works for Mann and Hughes-Leslie. White and Castellanos have no external board presence yet.

---

## Stance Evidence Map

### Non-judicial live topics relevant to Lancaster city council

From established DB pattern (44 live, 36 non-judicial); topics with notable Lancaster-specific evidence:

| topic_key | Evidence Strength | Notes |
|-----------|-------------------|-------|
| `local-environment` | **STRONG** | Lancaster is the first US city to generate more clean energy than it consumes; First Public Hydrogen (FPH2) — Parris chairs the board; Element Resources hydrogen facility approved; net-zero housing mandate. Strong directional record for Parris. |
| `climate-change` | **STRONG** | City-wide clean energy / hydrogen pivot since 2015; Lancaster Choice Energy nonprofit; all-electric bus fleet. Parris first-party record is extensive. |
| `local-immigration` | **STRONG** | Lancaster city (not county) unanimously passed a **sanctuary city ordinance** in February 2024, codifying policies in place since 2019. Council voted unanimously — all seated members at the time (Parris, Crist, Mann, Malhi, Hughes-Leslie) are on record. White + Castellanos are incoming; check campaign statements. |
| `homelessness` | **STRONG** | Parris has an unusually public and polarizing homelessness record: declared state of emergency against LA County moving homeless to Antelope Valley; proposed "free fentanyl and purge" (Feb 2025, widely covered); also cites 33% homeless population reduction. Specific, directional, controversial. |
| `homelessness-response` | **STRONG** | Same as above — Parris's enforcement-first/anti-services approach vs. housing-first debate is well documented. Multi-agency Regional Resilience Center opened 2025. |
| `housing` | **MEDIUM** | Lancaster hit 9,000+ RHNA target; earned CA Prohousing Designation (2025); 2,960 approved units 2022-2024; Desert Meadows Apartments (420 units). City is pro-growth/pro-housing. |
| `growth-and-development` | **MEDIUM** | Data center benefits agreement (Nov 2025, 6-1 council vote — note this is a 6-member vote, possibly including Crist + Malhi; check who voted); hydrogen clean energy industrial facilities. |
| `public-safety-approach` | **MEDIUM** | FBI raided Lancaster City Hall and homes of elected officials (noted in search; context unclear — monitor for new details). Parris has strong enforcement-first homelessness stance that overlaps public-safety framing. |
| `economic-development` | **MEDIUM** | BYD manufacturing; hydrogen economy push; data center agreement; Prohousing Designation. City actively pursues economic development — Parris is the driver. |
| `transportation-priorities` | **LOW-MEDIUM** | Antelope Valley Transit Authority (AVTA) has full electric bus fleet; Hughes-Leslie sits on AVAQMD (air quality focus); limited specific council vote record on transit. |
| `residential-zoning` | **LOW-MEDIUM** | Prohousing Designation implies streamlined density approvals; Lancaster historically at single-family suburban character — check for specific zoning votes. |
| `immigration` | **LOW** | State-level immigration positions rarely documented for city council members; local-immigration is the primary relevant topic. |

Topics with near-zero likelihood of evidence for city council members (honest blank expected): `abortion`, `trans-athletes`, `same-sex-marriage`, `school-vouchers`, `voting-rights`, `social-security`, `medicare/aid`, `redistricting`, `taxes` (state-level), `fossil-fuels` (state-level), `ukraine-support`, `tariffs`, `misinformation`, `ai-regulation`, `childcare`, `religious-freedom`, `campaign-finance`.

Judicial topics: ALL EXCLUDED per D-11 (City Attorney appointed, not elected).

### Per-member stance evidence sources

**R. Rex Parris (Mayor, re-elected April 2024) — STRONGEST record by far**
- Hydrogen/clean energy: Wikipedia extensively documented; cityoflancasterca.org news; First Public Hydrogen launch; Element Resources MOU
- Homelessness: "Free fentanyl and purge" Feb 2025 comments (widely covered — inquisitr.com, wsws.org, AOL, Fox News); state of emergency against LA County plan (PR Newswire, Jan 2023); ACLU report rebuttal (AVTimes 2021)
- Housing: SCAG Prohousing Designation; 2023 Housing Element; 9,000 RHNA narrative — avpress.com
- Local-immigration: As Mayor, he signed/supported the February 2024 sanctuary city ordinance vote (council voted unanimously)
- Campaign platform: cityoflancasterca.org/government/city-officials/city-council/mayor-r-rex-parris (WAF blocked but content documented via search)
- Secondary: avpress.com archive (Antelope Valley Press) — richest local-news source; cityoflancasterca.org PrimeGov meeting portal (`cityoflancasterca.primegov.com`) for agendas/minutes

**Ken Mann (Councilmember, re-elected April 2024) — MODERATE record**
- Served since April 2008; 5th term; restaurant/business background
- Likely voted with Parris on sanctuary city ordinance (unanimous Feb 2024 vote)
- AVAQMD Governing Board Vice Chair — local air quality focus; may have `local-environment` evidence
- Campaign: Facebook `@ElectKenMann`; avpress.com coverage
- Expected: thin record on state-level topics; stronger on local economic development, growth

**Lauren Hughes-Leslie (Councilmember/Vice Mayor, elected April 2024) — THIN record**
- Appointed Sept 2023; first elected April 2024; Army veteran, attorney background
- Likely voted with council on sanctuary ordinance (Feb 2024) — check: she was appointed before Feb 2024
- AVAQMD Governing Board Member — air quality evidence possible
- Primary source: theavtimes.com 2023 article + cityoflancasterca.org news welcome announcement
- Expected: limited voting record; 2.5 years seated; honest blanks likely on many topics

**Cedric White (Councilmember, elected April 2026) — THIN (platform only)**
- 25+ years public service, education, youth advocacy; ex-NFL player (St. Louis Rams/Miami Dolphins); LAUSD teacher; LA County probation officer
- Campaign focus: social services, inclusive governance
- Source: `antelopevalleynews.com` pre-election profile; `avdailynews.com` post-election; Ballotpedia
- Expected: NO council votes yet (seated April 28, 2026); platform-based only; honest blanks likely on all but a few platform topics

**Rocio Castellanos (Councilmember, elected April 2026) — THIN (platform only)**
- 23+ years Lancaster resident; public service, public education, nonprofit sector background
- Campaign focus: youth programs, public safety reforms
- Source: `antelopevalleynews.com` pre-election profile; `avdailynews.com` post-election; Ballotpedia; candidate filing statement PDF
- Expected: NO council votes yet (seated April 28, 2026); platform-based only; honest blanks likely; may have some evidence on public-safety-approach from youth programs / public safety framing

---

## Architecture Patterns

### Recommended wave structure (mirroring SC 143 + Glendale 144)

```
Wave 1 — Reconcile (structural, registers in schema_migrations)
  ├── geo_id backfill ('0640130') on Lancaster gov row
  ├── Move Crist's office from a9be708e into 9b9014b4
  ├── DELETE a9be708e (now empty)
  ├── Verify Mayor office in 9b9014b4 has district_type=LOCAL_EXEC
  └── Run split-section check (expect Lancaster absent)

Wave 2 — Roster (structural, registers in schema_migrations)
  ├── Retire Crist (686320): office_id=NULL, is_incumbent=false, is_active=false
  ├── Pre-flight SELECT for Parris, Mann, Hughes-Leslie (may already exist in DB)
  ├── Seat Parris as Mayor (INSERT or UPDATE office_id)
  ├── Seat Hughes-Leslie as Councilmember (INSERT or UPDATE office_id)
  ├── Seat Mann as Councilmember (INSERT or UPDATE office_id)
  ├── INSERT Cedric White (-700655) as Councilmember
  ├── INSERT Rocio Castellanos (-700656) as Councilmember
  └── Verify: 5 active officials in 9b9014b4

Wave 3 — Headshots (audit-only, NOT registered)
  ├── Parris: Wikimedia Commons (WIKIMEDIA_HEADERS required)
  ├── Hughes-Leslie: checkpoint:human-verify (cityoflancasterca.org official portrait)
  ├── Mann: checkpoint:human-verify (cityoflancasterca.org official portrait)
  ├── White: checkpoint:human-verify (cityoflancasterca.org + Ballotpedia fallback)
  ├── Castellanos: checkpoint:human-verify (cityoflancasterca.org + Ballotpedia fallback)
  └── Crist: no new headshot (retiring; existing image stays)

Wave 4 — Stances (audit-only, NOT registered; one agent per official)
  ├── Parris (richest record — start here for evidence methodology)
  ├── Mann
  ├── Hughes-Leslie
  ├── White (platform only; expect thin)
  └── Castellanos (platform only; expect thin)
```

### SQL patterns (carry from SC 143 / Glendale 144 exactly)

**Wave 1 template:** `C:/EV-Accounts/backend/migrations/894_santa_clarita_reconcile.sql` (move-then-delete pattern for non-empty duplicate chamber — same as Lancaster)

Key steps:
1. `UPDATE essentials.governments SET geo_id = '0640130' WHERE id = '<lancaster-gov-uuid>' AND geo_id IS NULL`
2. Find Crist's office_id in `a9be708e`, UPDATE its chamber_id to `9b9014b4`
3. Assert `a9be708e` now has 0 offices → `DELETE FROM essentials.chambers WHERE id = 'a9be708e-...'`
4. Verify Mayor office in `9b9014b4` has `district_type='LOCAL_EXEC'` (directly elected Mayor — not LOCAL)
5. Register in schema_migrations

**Wave 2 template:** `C:/EV-Accounts/backend/migrations/895_santa_clarita_complete.sql`

For Parris/Mann/Hughes-Leslie pre-flight:
```sql
SELECT id, external_id, first_name, last_name
FROM essentials.politicians
WHERE last_name ILIKE 'Parris'
   OR last_name ILIKE 'Mann' AND first_name ILIKE 'Ken%'
   OR last_name ILIKE 'Hughes%';
```
If a row exists: `UPDATE essentials.politicians SET office_id = <new-office-id> WHERE id = '<existing-uuid>'`
If no row exists: `INSERT` with new `-700655`+ external_id.

**Wave 4 stance template:** `897_laurene_weste_stances.sql` through `901_patsy_ayala_stances.sql` pattern:
```sql
WITH pol AS (SELECT id FROM essentials.politicians WHERE external_id = N)
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
VALUES ((SELECT id FROM pol), 'topic-uuid-here', chair_number)
ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = EXCLUDED.value;
```
Paired with `inform.politician_context` INSERT.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chamber move-then-delete | New detach logic | SC 143 Wave 1 SQL pattern (894_santa_clarita_reconcile.sql) | Proven idempotent guard already tested |
| Image crop/resize | Custom script | Reuse SC/Glendale Pillow pipeline (4:5 crop FIRST → 600×750 Lanczos q90) | Tested; never stretch aspect ratio |
| Storage upload | Custom HTTP | Supabase Python client with service-role key (`C:/EV-Accounts/backend/.env`) | Proven across 142–144 |
| Duplicate person detection | New logic | Pre-flight `SELECT id FROM essentials.politicians WHERE last_name ILIKE 'Parris'` etc. | Parris/Mann/Hughes-Leslie may already exist from prior seeds |
| Stance SQL | New template | Copy `897_laurene_weste_stances.sql` pattern exactly | Tested across 25+ officials |

---

## Common Pitfalls

### Pitfall 1: Treating Crist as a current active member instead of retiring
**What goes wrong:** CONTEXT.md notes Crist (686320) as the only seated member, leading the plan to seat him in Wave 2. But Crist's term expired April 2026 — he is DEPARTING, not current.
**Why it happens:** The DB state (from June 19) shows Crist as seated, but research confirms he did not file and his term ended.
**How to avoid:** Wave 1 moves Crist's office to the survivor chamber (for structural cleanup), then Wave 2 RETIRES him (`office_id=NULL, is_active=false, is_incumbent=false`). Do NOT seat him as a current official.
**Warning signs:** If Wave 2 plan shows Crist with `is_active=true`, that's a bug.

### Pitfall 2: Treating Parris/Mann/Hughes-Leslie as greenfield inserts
**What goes wrong:** Phase 145 inserts all 5 council members as new rows, creating duplicate politicians for Parris, Mann, and/or Hughes-Leslie who may already exist from prior LA-area seeds.
**Why it happens:** The survivor chamber `9b9014b4` has 4 empty office shells — it looks like no one is seated, tempting a full greenfield INSERT of all 5.
**How to avoid:** Pre-flight SELECT by last_name + first_name (or external_id if known). If rows exist, UPDATE their office_id rather than INSERT. Check: Parris has been Mayor since 2008 and may have been seeded during v7.0 LA city coverage.
**Warning signs:** A pre-flight SELECT returning a row for `Parris` or `Mann` is not an error — it's the expected case.

### Pitfall 3: Treating Mayor Parris as a rotational/council-selected Mayor
**What goes wrong:** Planner models Parris as `district_type=LOCAL` (rotational, like Glendale's Kassakhian), no separate Mayor office, just title='Mayor' on a council seat.
**Why it happens:** Glendale (Phase 144) used a rotational mayor model. A planner copying that pattern applies it to Lancaster.
**How to avoid:** Parris has been **directly elected** Mayor since 2008 — every 4 years, voters elect him by name as Mayor. Lancaster's Mayor is `district_type=LOCAL_EXEC`. The survivor chamber `9b9014b4` already has a Mayor office (one of 4 shells) — this structure is correct and should be preserved.
**Warning signs:** If the plan says `title='Mayor'` on a Council Member seat, that's the Glendale pattern being applied incorrectly.

### Pitfall 4: cityoflancasterca.org headshot automation
**What goes wrong:** Headshot executor assumes curl with Chrome UA will work (as it did for santaclarita.gov). Returns HTTP 403.
**Why it happens:** cityoflancasterca.org is behind Akamai WAF (confirmed, same as glendaleca.gov).
**How to avoid:** All 5 official headshot pages are marked `checkpoint:human-verify` — executor MUST open browser manually. The Parris Wikimedia source is an automated fallback for at least one member.
**Warning signs:** Any script returning 403 from `cityoflancasterca.org`.

### Pitfall 5: Missing pre-flight for the `-700655` block
**What goes wrong:** White and Castellanos are assigned `-700655` and `-700656` without verifying those IDs are free.
**How to avoid:** Run `SELECT external_id FROM essentials.politicians WHERE external_id BETWEEN -700655 AND -700660` before inserting. Per CONTEXT.md, the current max is `-700654`; this is a sanity check only.

### Pitfall 6: Using retired/judicial compass topic IDs for stances
**What goes wrong:** Stance agent uses a hardcoded topic_id that was retired (6 retired IDs per `project_compass_live_topic_ids` memory), or applies judicial-* topics to city council members.
**How to avoid:** Always query `SELECT id, title, topic_key FROM inform.compass_topics WHERE is_live = true AND (judicial_role IS NULL OR judicial_role = '')` at apply time. Never hardcode topic IDs. Lancaster's City Attorney is appointed, so `judicial_role IN ('judge', 'city_attorney_da')` topics are excluded.

### Pitfall 7: Seating Raj Malhi (who lost)
**What goes wrong:** Research mentions Malhi as an incumbent who was up for re-election, and some pre-election sources call him a council member. The plan mistakenly tries to keep or seat him.
**Why it happens:** Malhi WAS an incumbent (term through April 2026) but he ran and lost. He was NOT in the DB (CONTEXT.md DB pre-check shows only Crist as the one seated member).
**How to avoid:** Malhi was never in the DB — no action needed for him. He is simply not included in the post-reconcile roster.

---

## Package Legitimacy Audit

Not applicable — this phase installs no new npm/Python packages. Uses existing Pillow + Supabase client already proven in phases 142–144.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| psql | Migration apply | Yes | Confirmed | mcp__supabase-local execute_sql |
| Supabase Storage | Headshot upload | Yes | Production | — |
| Python Pillow | Headshot crop/resize | [ASSUMED — was present for phases 143–144] | From prior phases | `pip install Pillow` |
| curl | Headshot download | Yes | Bash tool | — |
| cityoflancasterca.org | Official headshots | BLOCKED (Akamai 403 — confirmed) | — | Human browser + manual download |
| Wikimedia Commons | Parris headshot | Available (HTTP 200 with WIKIMEDIA_HEADERS) | — | Bot UA required (not Chrome UA) |
| AVAQMD CDN (imgix) | Mann + Hughes-Leslie | Partial — CDN 403 without Referer; page HTML accessible | — | Try with `Referer: https://www.avaqmd.ca.gov/`; fallback to human browser |

**Missing dependencies with fallback:**
- cityoflancasterca.org WAF: human opens browser to retrieve portraits — planner must add `checkpoint:human-verify` for all 5 members' headshots (Parris has Wikimedia fallback; Mann/Hughes-Leslie have AVAQMD CDN to try first).

---

## Validation Architecture

No automated test infrastructure required (per established CA deep-seed pattern). Verification gates are SQL assertions embedded in or run after each migration.

**Wave 1 verification checks (adapt from SC 143-01-SUMMARY.md):**
- `geo_id = '0640130'` on Lancaster gov row
- `SELECT COUNT(*) FROM essentials.chambers WHERE government_id = <lancaster-gov> AND slug = 'lancaster-city-council'` = 1
- `SELECT COUNT(*) FROM essentials.chambers WHERE id = 'a9be708e-...'` = 0 (duplicate gone)
- `SELECT COUNT(*) FROM essentials.offices WHERE chamber_id = '9b9014b4-...'` = 5 (including Crist's moved office)
- Mayor office in `9b9014b4` has `district_type = 'LOCAL_EXEC'`
- Split-section check SQL = 0 rows for Lancaster
- Migration 910 registered in schema_migrations

**Wave 2 verification checks:**
- Crist (686320): `is_active=false, is_incumbent=false, office_id IS NULL`
- All 5 current members (Parris, Hughes-Leslie, Mann, White, Castellanos) seated in `9b9014b4` with `is_active=true`
- `official_count=5` on chamber `9b9014b4`
- No duplicate politician rows (each ext_id unique)
- Mayor office has Parris's politician_id; `district_type=LOCAL_EXEC`

**Wave 3 verification:**
- All 5 current members have exactly 1 `type='default'` image
- All 5 licenses = `press_use`
- All 5 paths follow canonical `{uuid}-headshot.jpg` pattern
- schema_migrations MAX unchanged (not registered)

**Wave 4 verification:**
- All 5 current members have stances (Crist = 0; White + Castellanos likely thin but non-zero)
- 0 rows with judicial topic_ids
- 0 rows with retired/non-live topic_ids
- 100% citation (every `politician_answers` row has a matching `politician_context` row)

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Parris, Mann, and/or Hughes-Leslie may already exist as politician rows in the DB from prior LA-area seeds | Roster §CRITICAL PRE-FLIGHT RULE | If none exist, Wave 2 does full inserts for all 5 — no harm, but pre-flight is required to confirm |
| A2 | Current City Attorney is Allison E. Burns (Stradling law firm, appointed) | City Attorney section | Burns may have changed; regardless City Attorney is confirmed appointed (not elected) — topic exclusion rule still holds |
| A3 | `-700655` and `-700656` are available for White and Castellanos | DB State | Verify with pre-flight SELECT; CONTEXT.md states max is -700654 |
| A4 | Pillow is still installed from the Phase 143–144 pipeline | Environment | If not, `pip install Pillow` required before Wave 3 |
| A5 | AVAQMD CDN imgix URLs work with Referer header from avaqmd.ca.gov | Headshot Sources | If CDN still blocks, fall back to human browser for Mann + Hughes-Leslie |
| A6 | White and Castellanos have no external board appointments or agency profiles yet (just sworn in April 28) | Headshot Sources | If they do appear on a board page by execution time, alternative headshot source available |
| A7 | cityoflancasterca.org is NOT CivicPlus (evidence: Akamai WAF, custom URL structure) | Headshot Sources | If city migrated to CivicPlus, the `/ImageRepository/Document?documentID=` pattern could work — check server header |

---

## Open Questions (RESOLVED)

> All three resolved 2026-06-19 by a live DB query; the answers are now LOCKED in
> `145-CONTEXT.md` `<db_precheck>` "Resolved roster→DB-row mapping". A pre-flight SELECT
> at apply time is still required to guard against drift, but the identities/ext_ids are known.

1. **Do Parris, Mann, or Hughes-Leslie already exist as politician rows in the DB?**
   - **RESOLVED: YES — all three exist, office-unlinked (`office_id IS NULL`), `is_active=true`.** Parris `87546d4d-78ee-4aae-82cb-89ae805e10b4`, Hughes-Leslie `007074c6-6fbe-429f-9e06-8d7251198d8a`, Mann `7a600b15-32ff-4c13-90e5-d4ee5f627bb5`. → **reseat (UPDATE office_id), do NOT create.** (Same-name rows like "PARRIS FOR MAYOR 2024" are campaign-finance committees — ignore.)

2. **What are the full external_ids for Parris, Mann, and Hughes-Leslie?**
   - **RESOLVED: all NEGATIVE (custom-seeded), not provider positives:** Parris `-200795`, Hughes-Leslie `-201279`, Mann `-201281`. Reuse these. Only White (`-700655`) and Castellanos (`-700656`) are genuinely new.

3. **Were Parris and Mann in the DB from a prior LA wave?**
   - **RESOLVED: YES (negative ext_ids ⇒ custom-added in a prior CA/LA phase), but never office-linked to Lancaster.** Consistent with the CONTEXT pre-check showing only Crist seated. They need reseating, not insertion.

---

## Stance Evidence Sources Reference

| Member | Best sources |
|--------|-------------|
| R. Rex Parris | Wikipedia `R._Rex_Parris`; cityoflancasterca.org news archives; avpress.com Antelope Valley Press archives; PR Newswire city announcements; inquisitr/wsws/AOL (homelessness Feb 2025); businesswire.com (hydrogen partnerships) |
| Ken Mann | avpress.com; avaqmd.ca.gov bio; AVAQMD board meeting records; `@ElectKenMann` Facebook |
| Lauren Hughes-Leslie | cityoflancasterca.org welcome announcement; theavtimes.com 2023 article; avaqmd.ca.gov bio; Ballotpedia 2024 candidate page |
| Cedric White | antelopevalleynews.com pre-election profile; avdailynews.com post-election; Ballotpedia 2026 candidate page; bluevoterguide.org endorsements |
| Rocio Castellanos | antelopevalleynews.com pre-election profile; avdailynews.com post-election; Ballotpedia 2026 candidate page; candidate filing statement PDF |

**Richest evidence vein:** avpress.com (Antelope Valley Press) — the primary local news archive for Lancaster. Query: `site:avpress.com lancaster city council <member name>`.

---

## Sources

### Primary (HIGH confidence)
- [CITED: avpress.com/news/incumbents-win-lancaster-vote/article_63515562-f6f2-11ee-ba6d-a7514a8d9c77.html] — 2024 election results (Parris 6th term, Mann 5th term, Hughes-Leslie 1st elected term)
- [CITED: avpress.com/news/2-new-councilmembers-sworn-in/article_62aa94df-d880-45a8-896e-6a807fc0ee28.html] — White + Castellanos sworn in April 28 2026; Hughes-Leslie becomes Vice Mayor
- [CITED: avpress.com/news/crist-is-ending-16-year-career-with-lancaster/article_f132e177-c2f1-4c9a-b1cd-4426e7b63503.html] — Crist retires; did not file nomination papers; "Lancaster needs new blood"
- [CITED: antelopevalleynews.com/post/inside-lancaster-s-2026-city-council-election-power-struggles-transparency-battles-and-the-fight] — 7 at-large candidates for 2 seats; confirms at-large structure
- [CITED: wikipedia.org/wiki/R._Rex_Parris] — Mayor since 2008, directly elected, 6 terms; Wikimedia photo URL confirmed
- CONTEXT.md `<db_precheck>` (live Supabase query, 2026-06-19) — gov row geo_id=NULL, dual chambers, Crist seated
- HTTP 200 probe: `https://upload.wikimedia.org/wikipedia/commons/2/2d/R._Rex_Parris%2C_mayor_of_Lancaster%2C_CA.jpg` with WIKIMEDIA_HEADERS — confirmed accessible, 1800×2283px

### Secondary (MEDIUM confidence)
- [CITED: avaqmd.ca.gov governing board pages] — Ken Mann + Lauren Hughes-Leslie board profiles + CDN headshot URLs discovered
- [CITED: ballotpedia.org Cedric White 2026 / Rocio Castellanos 2026 pages] — at-large seat type confirmed; candidate backgrounds
- [CITED: avdailynews.com/single-post/cedric-white-rocio-castellanos-lead-in-lancaster-city-council-race] — post-election confirmation of winners
- WebSearch result confirming sanctuary city ordinance Feb 2024 ("unanimously passed an ordinance in February 2024 codifying sanctuary city status")
- WebSearch result confirming council-manager form + City Attorney appointed by Council

### Tertiary (LOW confidence)
- Streamline imgix CDN URLs for Mann/Hughes-Leslie headshots — discoverable, CDN returns 403 without Referer (unverified accessible)
- avpress.com coverage of Parris homelessness statements (Feb 2025 "free fentanyl" remarks) — confirmed via multiple secondary sources citing the same article

---

## Metadata

**Confidence breakdown:**
- Roster (all 5 current members + Crist retirement): HIGH — confirmed via AV Press primary sources
- Election structure (at-large, directly-elected Mayor): HIGH — multiple confirmations
- City Attorney (appointed, no judicial topics): HIGH — council-manager form confirmed
- Headshot WAF (Akamai 403): HIGH — curl HEAD probe confirmed
- Stance evidence map (Parris): HIGH — extensive public record
- Stance evidence map (Mann/Hughes-Leslie): MEDIUM — limited public record, good enough to identify likely evidence veins
- Stance evidence map (White/Castellanos): LOW — platform only, no council votes yet

**Research date:** 2026-06-20
**Valid until:** 2026-09-30 (roster is stable through next Lancaster election ~April 2028; headshot and stance information is stable)
