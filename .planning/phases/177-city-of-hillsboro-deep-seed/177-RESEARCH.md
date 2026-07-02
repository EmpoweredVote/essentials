# Phase 177: City of Hillsboro Deep-Seed — Research

**Researched:** 2026-07-01
**Domain:** Oregon municipal deep-seed — council-manager city, ward-nominated but at-large-elected council
**Confidence:** HIGH (form of government, geo_id correction, and roster: VERIFIED/CITED; headshot sourcing: HIGH — CivicWeb portal confirmed NO-WAF)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01/D-02:** Hillsboro's council structure must NOT be assumed from memory; ground-truthed
  from hillsboro-oregon.gov / charter at plan time. Tie-breaker rule: WHO VOTES decides routing.
  **RESOLVED in this research** — see §Form of Government below.
- **D-03:** If ward branch fires: one district per ward, 2 offices attached (does not apply — see resolution).
- **D-04:** Ward boundary source restricted to official GIS only if ward branch fires (does not apply).
- **D-05:** Either branch must produce no section-split and no empty LOCAL section.
- **D-06:** Mayor's role ground-truthed from the charter at plan time — **RESOLVED**, directly elected,
  council-manager form, same shape as Beaverton.
- **D-07:** Council President/Vice Mayor = title-on-seat if one exists, verified from official site —
  **RESOLVED**: Rob Harris holds "Council President" as of the 2025-2029 term; title-on-seat only.
- **D-08:** Community banner — executor picks legally-licensed wide shot; Wikimedia first, Unsplash
  fallback; NO AI-generated images; follow `docs/banner-asset-pipeline.md`.
- **D-09:** Banner asset work lives in the final surfacing plan; `offices.representing_city='Hillsboro'`
  set INLINE in the structural migration (not backfilled).
- **D-10:** Researcher pulls seated roster + exact chamber/body name verbatim from
  hillsboro-oregon.gov at plan time; notes WAF status. **RESOLVED**: hillsboro-oregon.gov is
  Akamai WAF-403 (full block, confirmed with Chrome UA). Roster sourced from the CivicWeb portal
  (hillsboro-oregon.civicweb.net) instead — same underlying city data, NO-WAF.
- **D-11:** All live compass topics, one agent at a time, evidence-only, 100% cited, honest blanks,
  zero defaults; skip judicial-* topics (City Attorney is appointed — confirmed below).
- **D-12:** Headshots from hillsboro-oregon.gov first, Ballotpedia/Wikimedia for genuine gaps;
  crop-4:5 then resize 600×750 Lanczos q90; mirrored to Storage. **Adjusted**: primary site is
  WAF-403, so the CivicWeb member-portal images (`hillsboro-oregon.civicweb.net`) are the
  practical primary source — same city-authored photos, just served from the non-WAF portal.
- **D-13:** Add Hillsboro to Oregon block of `src/lib/coverage.js` — **CORRECTED geo_id**, see below.

### Claude's Discretion

- Council office title labeling — planner picks after seeing the roster (city uses "Councilor,
  Ward N, Position X" verbatim on the CivicWeb portal — see roster table).
- External_id block — Wave-0 confirms unused OR range; this research recommends
  **-4134101..-4134107** (derived from the CORRECTED geo_id 4134100, not the CONTEXT.md-stated
  4133850 — see critical correction below).
- Next migration number — on-disk MAX is confirmed **1149** as of 2026-07-01 (this research
  session); next available is **1150**. CONTEXT.md's estimate of "≥1142" undercounted — 5 more
  non-Hillsboro migrations (1146-1149, unrelated MI/VA federal candidate seeds) landed since.
- Custom `X00xx` mtfcc + district_type — NOT NEEDED (at-large branch resolved; see below).

### Deferred Ideas (OUT OF SCOPE)

- Other WashCo cities: Tigard 178, Tualatin 179, Forest Grove 180, Sherwood 181, Cornelius 182.
- School boards (Phases 183–184; Hillsboro SD 1J is Phase 183); 2026 elections + discovery (185);
  milestone close (186).
- Washington County Commission (done, Phase 175) and Beaverton (done, Phase 176).
- Hillsboro appointed boards/commissions and city-manager staff — elected officials only.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WASH-03 | City of Hillsboro deep-seeded (county seat / largest WashCo city) — government + roster + headshots + evidence-only stances. | Fully resolved: at-large-elected (ward-nominated) council-manager form confirmed via 3 independent sources; directly-elected Mayor confirmed; 7-seat roster verified with exact ward/position labels; headshot source identified (CivicWeb portal, NO-WAF); structural migration shape established from Beaverton template; **critical geo_id correction surfaced** (4134100, not 4133850). |

</phase_requirements>

---

## Summary

Hillsboro has operated under a **council-manager charter form of government for over 90 years**.
The chartered government consists of a directly-elected Mayor (city-wide, 4-year term) and six
Councilors. The city is divided into **three wards (two council positions per ward: Position A
and Position B)**, but — critically — **candidates are only required to RESIDE in their ward;
all Hillsboro voters vote on all six council seats city-wide.** This is confirmed independently
by three sources (city charter language reported via WebSearch, Ballotpedia, and the city's own
"Hillsboro 101" summary): *"the councilors are nominated from three wards and elected by the
city at large."*

**This resolves the central D-01/D-02 tie-breaker exactly like Beaverton: WHO VOTES = the whole
city, for every seat. NO custom X00xx ward geofences are needed.** Model as pure at-large: all
7 officials (Mayor + 6 Councilors) link to the existing city geo_id via one LOCAL_EXEC district
(Mayor) and one shared LOCAL district (all 6 Councilors) — the same pattern used for Beaverton
(migration 1131) and Gresham (migration 246). The wards remain informative metadata (each
councilor's office title can note their ward, e.g. "Councilor, Ward 2, Position A") but do NOT
drive geofence routing.

**CRITICAL CORRECTION — geo_id is WRONG in CONTEXT.md and the phase description.** Both state
Hillsboro's geo_id as `4133850`. **This geo_id does not exist anywhere in
`essentials.geofence_boundaries`.** The actual Census TIGER 2024 place code for "Hillsboro city"
in Oregon (state FIPS 41) is **`4134100`**, confirmed both in the live geofence table
(`geo_id=4134100, mtfcc=G4110, state=41, name='Hillsboro city', source=census_tiger_2024`) and
independently via Data Commons / Census QuickFacts. `4133850` may be a typo or confusion with a
different Hillsboro (there are 6 other "Hillsboro"-named places across the geofence table,
including one in a different state). **Wave-0 must re-verify this before writing any SQL** —
this research treats 4134100 as the correct geo_id going forward.

**hillsboro-oregon.gov is fully Akamai WAF-403** (confirmed both with a default UA and a
full Chrome desktop UA — both return an Akamai "Access Denied" error page, not a 200).
The CivicWeb portal (`hillsboro-oregon.civicweb.net`) mirrors the same official roster data —
including per-member headshot image paths — and returns HTTP 200 with no blocking. This is the
practical primary source for both roster and headshots, in place of the blocked primary domain.

**Primary recommendation:** Seed as pure at-large (mirroring Beaverton exactly), with wards
noted only in office titles as descriptive metadata. Government name `'City of Hillsboro,
Oregon, US'`, chamber `'City Council'`. Mayor office on LOCAL_EXEC district (geo_id 4134100),
6 councilor offices on shared LOCAL district (same geo_id). Ext_id block **-4134101..-4134107**
(clean, verified unused). Structural migration starts at **1150** (disk MAX confirmed 1149 as
of this research session — re-verify at Wave-0 in case intervening work landed).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| City government row | Database / Storage | — | Structural migration inserts into essentials.governments |
| Chamber row | Database / Storage | — | Single 'City Council' chamber, official_count=7 |
| Mayor office (LOCAL_EXEC) | Database / Storage | — | Citywide at-large, links to LOCAL_EXEC district |
| Council offices (LOCAL) | Database / Storage | — | All 6 on shared LOCAL district, city-wide (ward is descriptive metadata only) |
| Official headshots (600×750) | Database / Storage | CDN | politician_images rows + Supabase Storage; source is CivicWeb portal (NO-WAF) |
| Compass stances | Database / Storage | — | inform.politician_answers rows, evidence-only |
| Community banner | Database / Storage | CDN | Supabase Storage `cities/hillsboro.jpg`; wired via `buildingImages.js` CURATED_LOCAL |
| Frontend surfacing | Frontend Server (SSR) | CDN | coverage.js Oregon block, purple hasContext chip |
| Address routing | API / Backend | — | PIP query against G4110 geofence (geo_id 4134100), no ward layer |

---

## CRITICAL: geo_id Correction

**CONTEXT.md and the phase description both state geo_id = `4133850`. This is WRONG.**

[VERIFIED: `psql` query against `essentials.geofence_boundaries` — 2026-07-01]
```sql
SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE geo_id='4133850' AND mtfcc='G4110';
-- Returns 0. This geo_id does not exist in the table at all (any mtfcc).
```

**The correct geo_id is `4134100`:**
```sql
SELECT geo_id, mtfcc, state, name, source FROM essentials.geofence_boundaries WHERE geo_id = '4134100';
--  geo_id  | mtfcc | state |      name      |      source
-- ---------+-------+-------+----------------+-------------------
--  4134100 | G4110 | 41    | Hillsboro city | census_tiger_2024
```

[CITED: datacommons.org/place/geoId/4134100 — confirms GEOID 4134100 = Hillsboro, Oregon]
[CITED: census.gov/quickfacts/fact/table/hillsborocityoregon — same place, no conflicting GEOID found]

The geofence_boundaries table has 8 rows matching "Hillsboro" by name across different states
and MTFCC types (school district, town, city) — the phase author likely transposed digits or
confused Hillsboro with a nearby geo_id. **Wave-0 MUST re-run this exact query before writing
any migration** — do not trust either this research or CONTEXT.md blindly; verify live.

---

## Form of Government — RESOLVED

**D-01 DETERMINATION: WARD-NOMINATED, CITY-WIDE (AT-LARGE) ELECTED. NO WARD-BASED VOTING.**

[MEDIUM-HIGH confidence: cross-verified via 3 independent WebSearch passes hitting different
source sets — charter/eCode360 summary, Ballotpedia summary, and city "Hillsboro 101" summary —
all converge on the same language]

- **Mayor:** Directly elected at-large, city-wide, 4-year term. Nominated and elected by the
  whole city (not tied to any ward).
- **City Council:** 6 Councilors. The city is divided into **3 wards, 2 councilors per ward**
  (Position A and Position B in each ward) — **but wards are a candidate-residency requirement
  only.** [CITED via WebSearch aggregation of charter/eCode360 language]: *"councilors are
  nominated from three wards and elected by the city at large"* and *"All Hillsboro voters
  select from the candidates for each of the three City Council wards."* Once elected, every
  councilor represents the entire city, not just their ward.
- **Term limits:** 4-year terms, max 2 consecutive terms.
- **City Manager:** Appointed by council; runs day-to-day administration (same council-manager
  split as Beaverton — Mayor chairs meetings and votes but does not run operations).
- **City Attorney:** [CITED: qcode.us Hillsboro Charter Chapter VIII "Appointive Officers"] —
  appointed by majority vote of mayor + council, not elected. **No judicial-* compass topics
  needed** (same rule as Beaverton, Boulder City, and all council-manager cities with an
  appointed City Attorney).

**D-02 ROUTING BRANCH: NO NEW GEOFENCES — IDENTICAL TIE-BREAKER OUTCOME TO BEAVERTON.**

Because every Hillsboro voter votes on every council seat regardless of ward, the "who votes"
tie-breaker resolves to **at-large**. Custom `X00xx` ward geofences would be actively WRONG here
(per the CONTEXT.md D-02 warning) — they would hide 4 of 6 councilors from every address, since
ward boundaries do not gate who can vote for a seat. Model exactly like Beaverton (migration
1131) and Gresham (migration 246): one LOCAL_EXEC district (Mayor) + one LOCAL district (all 6
councilors), both on geo_id 4134100.

**Distinction from a true ward-elected city (e.g. Las Vegas, Henderson, North Las Vegas):**
in those NV cities, only ward-resident voters elect their own ward's councilor — that is genuine
ward-based voting and justifies X00xx custom geofences. Hillsboro's "ward" is purely a candidacy
eligibility rule layered on top of city-wide voting — structurally identical to Beaverton's
numbered "Position" seats, just with an added residency constraint that has no bearing on who
votes.

---

## Mayor & Council President Modeling — RESOLVED

**D-06 DETERMINATION: DIRECTLY ELECTED, LOCAL_EXEC, SAME SHAPE AS BEAVERTON.**

Mayor Beach Pace was elected in November 2024 and sworn in January 7, 2025 (Hillsboro's 51st
Mayor), term through January 2, 2029. [CITED: hillsboro-oregon.civicweb.net portal + WebSearch
aggregation of city news]. Model on a **LOCAL_EXEC** district, `is_appointed_position=false`,
`role_canonical=NULL` — places Mayor first via groupHierarchy.js, matching the Beaverton/Gresham
precedent for directly-elected council-manager mayors.

**D-07 DETERMINATION: Council President is title-on-seat, not a separate office.**

Rob Harris (Ward 3, Position B) is confirmed as **Council President** as of his current
2025-2029 term [CITED: hillsboro-oregon.civicweb.net portal listing "Rob Harris (Council
President)"]. This mirrors the Edward Kimmi (Beaverton) precedent exactly — one office row,
title stays the standard councilor format (`'Councilor, Ward 3, Position B'`), with Council
President noted only as a migration comment, never a separate office/district row.

---

## Live Roster — VERBATIM (confirmed 2026-07-01 via CivicWeb portal)

**Official body name:** `City Council` (matches Beaverton/all OR precedent naming). Government
name: `City of Hillsboro, Oregon, US` (following the established OR city government-name
pattern).

**Source:** `hillsboro-oregon.civicweb.net/portal/members.aspx?id=10` — this is the City of
Hillsboro's official CivicWeb-hosted council roster/member page (NOT a third-party mirror; same
municipal government, different subdomain than the WAF-blocked `hillsboro-oregon.gov`).
[VERIFIED: HTTP 200, fetched via WebFetch tool, 2026-07-01]

| Title | Name | Ward / Position | Term | Notes |
|-------|------|-----------------|------|-------|
| Mayor | Beach Pace | Citywide | 07 Jan 2025 – 02 Jan 2029 | 51st Mayor; directly elected Nov 2024 |
| Councilor | Cristian Salgado | Ward 1, Position A | 21 Jan 2025 – 31 Dec 2026 | Appointed 2025 (fills a vacancy); seat up for election Nov 3, 2026 |
| Councilor | Saba Anvery | Ward 1, Position B | 07 Jan 2025 – 02 Jan 2029 | Elected Nov 2024 |
| Councilor | Kipperlyn Sinclair | Ward 2, Position A | 03 Jan 2023 – 05 Jan 2027 | Elected Nov 2022; seat up for election Nov 3, 2026 |
| Councilor | Elizabeth Case | Ward 2, Position B | 07 Jan 2025 – 02 Jan 2029 | Elected Nov 2024 |
| Councilor | Olivia Alcaire | Ward 3, Position A | 21 Feb 2017 – 05 Jan 2027 | Appointed 2017, elected 2018, re-elected 2022; **term-limited, seat up for election Nov 3 2026 — she cannot run again** |
| Councilor | Rob Harris | Ward 3, Position B (Council President) | 07 Jan 2025 – 02 Jan 2029 | Elected Nov 2024; holds rotational Council President title |

**Total officials to seed: 7 (Mayor + 6 Councilors). official_count on chamber = 7.**

**PLAN-TIME / WAVE-0 VERIFICATION REQUIRED:**
1. Re-fetch `hillsboro-oregon.civicweb.net/portal/members.aspx?id=10` immediately before seeding
   to confirm no roster change since 2026-07-01 (esp. Salgado's seat — his term ends Dec 31,
   2026, close to but not overlapping the seed date).
2. Cross-check ward/position labels one more time — an earlier WebSearch summarization pass
   produced a conflicting claim (Sinclair "Position B", Alcaire "Position B") that was refuted by
   the CivicWeb portal itself and independently corroborated by LegiStorm (Sinclair = Ward 2
   Position A) and a second WebSearch pass (Alcaire = Ward 3 Position A, elected 2018/2022).
   **Trust the CivicWeb portal table above; the AI search-summary conflation was wrong.**
3. Confirm Salgado's appointment-vs-election status precisely — he was "appointed in 2025" per
   multiple sources; verify he is not simultaneously an active November 2026 candidate for his
   own seat before executor writes `is_incumbent`/campaign-adjacent stance content.

**Sources:**
- [VERIFIED: hillsboro-oregon.civicweb.net/portal/members.aspx?id=10] — full roster, wards,
  positions, terms, headshot image paths — HTTP 200.
- [CITED: WebSearch aggregation — City Council Election Filing Period news release] — confirms
  the 3 seats up for Nov 3, 2026 election: Ward 1 Position A (Salgado), Ward 2 Position A
  (Sinclair — note: earlier ambiguous summary said "Position B", CivicWeb + LegiStorm both say
  Position A), Ward 3 Position A (Alcaire, term-limited).
- [CITED: hillsboronewstimes.com Ward 2/Ward 3 candidate profile articles] — Case (Ward 2 Pos B)
  and Harris (Ward 3 Pos B) both elected Nov 2024.
- [CITED: legistorm.com/person/bio/561467 Kipperlyn Sinclair] — "Councilor, Ward 2, Position A" —
  independently corroborates CivicWeb.

---

## Headshot Sources

**hillsboro-oregon.gov is Akamai WAF-403 — CONFIRMED BLOCKED, even with a full Chrome desktop
User-Agent.** [VERIFIED: `curl -A "Mozilla/5.0 ... Chrome/120.0 Safari/537.36" ...` returned
HTTP 403 with an Akamai "Access Denied" error body, reference ID format
`#18.xxxxx.xxxxxxx.xxxxxxx`, `errors.edgesuite.net`.] This matches the WAF-blocked class seen at
glendaleca.gov, pomonaca.gov, downeyca.org, and cityofhenderson.com (Akamai) in prior phases.

**Primary headshot source: `hillsboro-oregon.civicweb.net` (CivicWeb portal) — NO-WAF, HTTP 200.**
This is the SAME city government's official member-roster system, just hosted on the CivicWeb
SaaS subdomain rather than the WAF-protected main domain. Per-member headshot image paths are
directly listed in the portal page and follow the pattern:

```
https://hillsboro-oregon.civicweb.net/FileStorage/content/UserImages/user-{N}.jpg
```

| Official | Portal Image Path | Notes |
|----------|-------------------|-------|
| Beach Pace (Mayor) | `/FileStorage/content/UserImages/user-29.jpg` | |
| Olivia Alcaire (Ward 3, Pos A) | `/FileStorage/content/UserImages/user-28.jpg` | |
| Kipperlyn Sinclair (Ward 2, Pos A) | `/FileStorage/content/UserImages/user-37.jpg` | |
| Saba Anvery (Ward 1, Pos B) | `/FileStorage/content/UserImages/user-1233.jpg` | |
| Elizabeth Case (Ward 2, Pos B) | `/FileStorage/content/UserImages/user-90.jpg` | |
| Rob Harris (Ward 3, Pos B) | `/FileStorage/content/UserImages/user-1234.jpg` | |
| Cristian Salgado (Ward 1, Pos A) | `/FileStorage/content/UserImages/user-1249.jpg` | |

[ASSUMED: A test `curl` download of the Beach Pace image returned HTTP 200 with **0 bytes
downloaded** in this research session — this may be a transient network issue, a redirect
requiring `-L`, or a session/referrer requirement of the CivicWeb CDN. **Executor must verify
each image actually downloads a valid JPEG (non-zero size, opens in PIL) before building the
headshot manifest** — do not assume the 200 status alone means the image is retrievable. If the
CivicWeb images prove unretrievable, fall back to Ballotpedia (Rob Harris has a confirmed page:
`ballotpedia.org/Rob_Harris_(Oregon)`) and campaign sites (`elizabethcase.com`,
`electrobharris.com` confirmed to exist) per official.]

**No Wikimedia Commons photo found for Mayor Beach Pace** [searched, no hits] — unlike
Beaverton's Lacey Beaty, there is no ready-made Wikimedia fallback for the Mayor. The CivicWeb
portrait or a Ballotpedia/campaign photo will be the source.

**Photo license:** CivicWeb portal images are official city government photos —
`press_use` (us_government_work pattern, consistent with all prior OR city phases). If a
Ballotpedia/campaign fallback is needed for any individual, license per actual source
(`press_use` for Ballotpedia-hosted campaign photos, consistent with prior precedent).

**No-photo gaps:** [ASSUMED] All 7 officials are expected to have a findable photo (either
CivicWeb portal or Ballotpedia/campaign fallback) — no anticipated zero-source gap. Document
genuine gaps at execution if none are found.

---

## Migration / Schema Technical Reference

### Next Migration Number

[VERIFIED: `ls C:/EV-Accounts/backend/migrations | sort` — 2026-07-01] Disk MAX is **1149**
(`1149_fix_va_5_6_9_incumbent_office_rotation.sql`). **Next available: 1150.**

Note: STATE.md's "next migration 1115" note is stale (predates several intervening federal
candidate-seeding migrations 1120-1149, none of which touch Hillsboro). CONTEXT.md's estimate
of "≥1142" is closer but also stale — 8 more migrations (1142-1149) landed after that note was
written, none related to this phase. **Wave-0 MUST re-confirm the disk MAX immediately before
writing** — do not trust 1150 as final; treat it as this research session's snapshot.

**Migration split for this phase (following the Beaverton 176 shape):**
- `1150_hillsboro_city_council.sql` — structural (registered in schema_migrations); includes
  `offices.representing_city='Hillsboro'` INLINE (per D-09 — no backfill needed, contrast with
  Beaverton's follow-up migration 1141).
- `1151_hillsboro_headshots.sql` — audit-only (NOT registered)
- `1152_pace_stances.sql` through `1157_harris_stances.sql` — 6 more stance migrations (7 total
  officials), audit-only (one per official, NOT registered)

Total: 1 structural + 1 headshots + 7 stance = 9 migrations consumed (1150-1158, adjust exact
numbers once Wave-0 confirms the true starting point). Banner upload does not consume a
migration number (Storage-only + `buildingImages.js`/`coverage.js` source edits).

### Ext_id Block

**Recommended range: -4134101 to -4134107** (7 slots: Mayor + 6 Councilors), derived from the
CORRECTED geo_id `4134100` (NOT `-4133850x` — that range is derived from the wrong geo_id and
must not be used).

[VERIFIED: `SELECT external_id FROM essentials.politicians WHERE external_id BETWEEN -4134107
AND -4134100` — 0 rows. Range is clean.]

**Assignment suggestion:**
| Official | ext_id |
|----------|--------|
| Mayor Beach Pace | -4134101 |
| Councilor Salgado (Ward 1, Pos A) | -4134102 |
| Councilor Anvery (Ward 1, Pos B) | -4134103 |
| Councilor Sinclair (Ward 2, Pos A) | -4134104 |
| Councilor Case (Ward 2, Pos B) | -4134105 |
| Councilor Alcaire (Ward 3, Pos A) | -4134106 |
| Councilor Harris (Ward 3, Pos B, Council President) | -4134107 |

Wave-0 must re-run `SELECT external_id FROM essentials.politicians WHERE external_id BETWEEN
-4134110 AND -4134100` to reconfirm range is clean at execution time.

### Schema Shapes (confirmed identical to Beaverton mig 1131 / Gresham mig 246)

```sql
-- governments: slug GENERATED ALWAYS — NEVER INSERT slug; no unique constraint on geo_id
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'City of Hillsboro, Oregon, US',
       'LOCAL', 'OR', 'Hillsboro', '4134100'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments WHERE name = 'City of Hillsboro, Oregon, US'
);

-- chambers: slug GENERATED ALWAYS — never include in INSERT column list
INSERT INTO essentials.chambers (id, name, name_formal, government_id, official_count)
SELECT gen_random_uuid(), 'City Council', 'Hillsboro City Council',
       (SELECT id FROM essentials.governments WHERE name = 'City of Hillsboro, Oregon, US'),
       7
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers WHERE name = 'City Council'
    AND government_id = (SELECT id FROM essentials.governments
                          WHERE name = 'City of Hillsboro, Oregon, US')
);

-- districts: state='or' LOWERCASE for LOCAL/LOCAL_EXEC; no name_formal column; government_id NULL
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL_EXEC', 'or', '4134100', 'Hillsboro (Mayor, Citywide)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts WHERE geo_id='4134100' AND district_type='LOCAL_EXEC' AND state='or'
);

INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'or', '4134100', 'Hillsboro (At-Large)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts WHERE geo_id='4134100' AND district_type='LOCAL' AND state='or'
);

-- offices: guard on (district_id, politician_id) — NOT EXISTS; representing_city inline per D-09
-- offices columns confirmed present: representing_city (text)
-- representing_state = 'OR' (uppercase); representing_city = 'Hillsboro'
```

**politician_images schema:** `id, politician_id, url, type, photo_license` — NO
`photo_origin_url` column [VERIFIED: confirmed in 176-RESEARCH.md + CONTEXT.md code context].

**Stance schema:** `inform.politician_answers` ON CONFLICT `(politician_id, topic_id)`; topic_id
resolved LIVE via `JOIN inform.compass_topics WHERE topic_key='...' AND is_live=true`; value is
integer 1-5 (chairs model). [VERIFIED: 44 live topics currently in `inform.compass_topics` — see
full list below.]

### Office Title Convention

Recommended (city-verbatim, matches CivicWeb portal exactly): `'Councilor, Ward N, Position X'`
for each councilor (e.g. `'Councilor, Ward 2, Position A'`), `'Mayor'` for the Mayor. This
differs slightly from Beaverton's numbered-position convention (`'Council Member (Position N)'`)
because Hillsboro's own site labels seats by ward+position, not a flat number 1-6 — **planner's
discretion to confirm exact wording, but ward+position is the more citizen-accurate label per
the LOCATION-ONBOARDING.md "Citizen Experience First" principle** (model the government as
residents know it).

### OR Casing Rules (identical to Beaverton — critical, wrong case = silent routing failure)

| Context | Casing | Why |
|---------|--------|-----|
| `governments.state` | `'OR'` (uppercase) | Governments table convention |
| `districts.state` for LOCAL/LOCAL_EXEC | `'or'` (lowercase) | Matches geocoder return + TIGER loader |
| `offices.representing_state` | `'OR'` (uppercase) | Offices table convention |
| `essentials.politicians.party` | `NULL` | Antipartisan design — never set |

### Geofence Pre-Check (CORRECTED geo_id)

```sql
SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE geo_id='4134100' AND mtfcc='G4110';
-- Expected: 1 (VERIFIED already true in this research session)
SELECT COUNT(*) FROM essentials.districts WHERE geo_id='4134100';
-- Expected: 0 (no city districts yet — this migration creates them) — VERIFIED true
SELECT COUNT(*) FROM essentials.governments WHERE geo_id='4134100' OR name ILIKE '%hillsboro%';
-- Expected: 0 (no pre-existing Hillsboro government row) — VERIFIED true, NOT-greenfield risk is LOW
```

**This phase IS greenfield** for Hillsboro's government/chamber/offices — no pre-existing rows
found by geo_id or by name search. (Contrast with several v17.0 LA-area phases which were
reconcile-heavy; this one is a clean insert like Beaverton 176.)

### Live Compass Topics (44 total, is_live=true)

[VERIFIED: `SELECT topic_key FROM inform.compass_topics WHERE is_live=true`] abortion,
ai-regulation, campaign-finance, childcare, city-sanitation, civil-rights, climate-change,
data-centers, deportation, economic-development, fossil-fuels, growth-and-development,
healthcare, homelessness, homelessness-response, housing, immigration, jail-capacity,
judicial-access-to-justice, judicial-bail-pretrial, judicial-criminal-justice,
judicial-government-deference, judicial-interpretation, judicial-police-accountability,
judicial-prosecution-priorities, judicial-transparency, local-environment, local-immigration,
medicare/aid, misinformation, public-safety-approach, redistricting, religious-freedom,
rent-regulation, residential-zoning, same-sex-marriage, school-vouchers, social-security,
tariffs, taxes, trans-athletes, transportation-priorities, ukraine-support, voting-rights.

**Skip all 8 judicial-* topics** — City Attorney is appointed, not elected (confirmed above).

---

## Architecture Patterns

### Closest Analog: Beaverton (migration 1131) — near-identical structure

Hillsboro is structurally almost identical to Beaverton: council-manager, directly-elected
mayor, at-large-elected councilors (Beaverton: numbered positions city-wide; Hillsboro:
ward-labeled but still city-wide voted). The only material difference is the label convention
(ward+position vs flat position number) and that Hillsboro additionally needs the community
banner work (D-08/D-09), which Beaverton's original 176 plan did NOT scope (though a
`beaverton` CURATED_LOCAL banner entry has since appeared in `buildingImages.js` — see note
in Assumptions Log).

```
City of Hillsboro, Oregon, US (governments)
└── City Council (chambers, official_count=7)
    ├── LOCAL_EXEC district (geo_id=4134100, state='or', mtfcc=NULL)
    │   └── Mayor office → Beach Pace (-4134101)
    └── LOCAL district (geo_id=4134100, state='or', mtfcc=NULL)
        ├── Councilor office, Ward 1 Pos A → Cristian Salgado (-4134102)
        ├── Councilor office, Ward 1 Pos B → Saba Anvery (-4134103)
        ├── Councilor office, Ward 2 Pos A → Kipperlyn Sinclair (-4134104)
        ├── Councilor office, Ward 2 Pos B → Elizabeth Case (-4134105)
        ├── Councilor office, Ward 3 Pos A → Olivia Alcaire (-4134106)
        └── Councilor office, Ward 3 Pos B → Rob Harris (-4134107, Council President title-on-seat)
```

### System Architecture Diagram

```
Hillsboro resident address
        |
        v
  Backend /representatives/me
        |
  PIP query against geofence_boundaries
        |
  ┌─────────────────────────────────────────┐
  │  G4110 city boundary (geo_id=4134100)   │
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

- **Do NOT create ward/district geofences** — every seat is city-wide voted despite the ward
  residency-eligibility label. This is the single highest-risk mistake for this phase — the
  "3 wards, 2 per ward" framing is easy to misread as ward-elected without checking who votes.
- **Do NOT create a separate Council President office** for Rob Harris — title-on-seat only.
- **Do NOT insert `slug`** on chambers — GENERATED ALWAYS (migration will fail).
- **Do NOT use `photo_origin_url`** in politician_images INSERT — column does not exist.
- **Do NOT default stance values** — blank spoke is correct when no evidence found.
- **Do NOT use ON CONFLICT on districts** — no unique constraint; use WHERE NOT EXISTS.
- **Do NOT use geo_id `4133850`** — verified nonexistent; use `4134100`.
- **Do NOT trust hillsboro-oregon.gov fetches** — Akamai WAF-403 confirmed even with Chrome UA;
  use the CivicWeb portal (`hillsboro-oregon.civicweb.net`) instead for roster + headshots.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Headshot resize | Custom PIL script | Existing `_tmp-*-headshots.py` pipeline (e.g. `_tmp-beaverton-headshots.py` as the direct template) | Phases 159-176 all reuse the same crop-4:5→600x750 Lanczos pattern |
| Stance research | Parallel agents | One agent at a time | Rate-limit rule — parallel burns quota with no usable output |
| Geofence load | Custom boundary ingest | None needed | At-large — city G4110 (4134100) already loaded |
| groupHierarchy ordering | Custom sort | groupHierarchy.js Mayor-first rule | Already handles LOCAL_EXEC-first + position ordering |
| Banner processing | Custom crop/resize script | `scripts/banners/process_banner.py` + `upload_banner.py` | Already built, proven on Beaverton/Bloomington/50 states |

---

## Common Pitfalls

### Pitfall 1: Misreading "3 wards, 2 councilors per ward" as ward-elected
**What goes wrong:** The planner builds custom X00xx ward geofences because the framing sounds
like a district system.
**Why it happens:** "Ward" strongly implies geographic voting in most US cities (e.g. NV cities
in this same codebase ARE ward-elected).
**How to avoid:** Confirm via the charter/Ballotpedia/city summary language before writing any
geofence code — Hillsboro's wards are a CANDIDACY residency rule only; voting is city-wide for
every seat. Same exact tie-breaker outcome as Beaverton's numbered positions.
**Warning signs:** If executor finds themselves downloading a ward shapefile, stop — re-verify
the charter language first.

### Pitfall 2: Using the wrong geo_id (4133850 instead of 4134100)
**What goes wrong:** Every migration and geofence join silently returns 0 rows because
`4133850` does not exist in `geofence_boundaries` at all.
**Why it happens:** CONTEXT.md and the phase description both carry this incorrect geo_id
forward from an earlier (unverified) research pass.
**How to avoid:** Use `4134100`, confirmed live in this research session. Wave-0 must re-run
the geofence pre-check query regardless — do not trust this document's number blindly either.
**Warning signs:** Any `SELECT COUNT(*) FROM geofence_boundaries WHERE geo_id='...'` returning 0
before you've inserted anything new is a signal to stop and re-verify the geo_id.

### Pitfall 3: Council President as a separate office
**What goes wrong:** Rob Harris's Council President title gets modeled as a second office row
or a LOCAL_EXEC seat.
**How to avoid:** One row, title stays `'Councilor, Ward 3, Position B'` (or the planner's chosen
convention); Council President noted only in a migration comment. Same as Beaverton's Kimmi.

### Pitfall 4: districts.state uppercase 'OR' for LOCAL districts
**What goes wrong:** Routing fails silently — address lookup returns no city-level officials.
**How to avoid:** All LOCAL/LOCAL_EXEC/COUNTY districts in Oregon use `state='or'` (lowercase).
Only NATIONAL_LOWER and STATE_EXEC use uppercase 'OR'.

### Pitfall 5: hillsboro-oregon.gov headshot fetch silently fails
**What goes wrong:** Executor's headshot script attempts to curl/fetch hillsboro-oregon.gov and
gets an HTML "Access Denied" body saved as if it were a JPEG (corrupting the pipeline or
producing a 0-byte/invalid image upload).
**How to avoid:** Use the CivicWeb portal image paths (`hillsboro-oregon.civicweb.net/FileStorage
/content/UserImages/user-{N}.jpg`) directly — confirmed HTTP 200, no WAF. **Verify actual
non-zero byte download and valid JPEG parse before uploading** — this research's own curl test
returned 200 but 0 bytes on one attempt (likely fixable with `-L` or a proper local output path,
not necessarily a server-side issue, but confirm before trusting the pipeline).

### Pitfall 6: Stale migration counter estimate
**What goes wrong:** Structural migration numbered 1131-1140-ish based on stale STATE.md/
CONTEXT.md notes, colliding with the actual disk MAX (1149 as of this research).
**How to avoid:** Wave-0 re-runs `ls C:/EV-Accounts/backend/migrations | sort -t_ -k1,1n | tail`
immediately before writing any migration file — treat every counter estimate (including this
document's "1150") as provisional.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Council-manager Hillsboro (pre-existing, 90+ years) | Same — no charter change found (unlike Beaverton's 2020 reform) | N/A | Simpler research than Beaverton — no "which era of charter applies" question |
| Prior Mayor (Steve Callaway) | Beach Pace (51st Mayor) | Jan 7, 2025 | Confirms current-term roster |
| N/A | 3 of 6 council seats up Nov 3, 2026 (Salgado Ward1-A, Sinclair Ward2-A, Alcaire Ward3-A) | Election filing began; Alcaire term-limited | Seed the CURRENTLY-seated incumbents (through their term end dates above) — do not pre-seed any 2026 candidate as the incumbent |

**Deprecated/outdated:**
- Ward numbers/letters do NOT correspond to geographic voting districts — same caution as
  Beaverton's numbered positions, just with an extra residency-eligibility layer that has zero
  bearing on routing.

---

## Community Banner (D-08/D-09)

Follow `docs/banner-asset-pipeline.md` Stages 1-8 exactly, matching the Beaverton precedent
already present in the codebase:

- **Storage path:** `cities/hillsboro.jpg` (Stage 5 — standalone-city scheme).
- **Wiring:** Add `hillsboro: '...supabase.co/.../politician_photos/cities/hillsboro.jpg'` to
  `CURATED_LOCAL` in `src/lib/buildingImages.js` (alongside the existing `beaverton` entry —
  see exact current file state below).
- **Attribution comment:** Add above `CURATED_LOCAL` per the existing convention, e.g.
  `//   hillsboro - <Title> | <Author> | <License>` once the final image is chosen.
- **Subject guidance (D-08):** downtown/civic horizon preferred (Main Street, Hillsboro Civic
  Center, Orenco Station per CONTEXT.md hint) but license quality and 3.15:1 crop-fit are the
  deciding factors over subject preference. Wikimedia Commons first, Unsplash fallback. No
  AI-generated images (banner-asset-pipeline.md explicitly forbids this).
- **NOTE — Beaverton banner precedent already exists:** `src/lib/buildingImages.js` currently
  contains a `beaverton: '.../cities/beaverton.jpg'` `CURATED_LOCAL` entry with attribution
  `"Beaverton Central and The Round, Beaverton, Oregon | M.O. Stevens | CC BY 3.0"` — this means
  the "first inline city" framing in CONTEXT.md D-08/D-09 is slightly stale (Beaverton's banner
  was apparently completed in a follow-on commit after 176-05-SUMMARY.md, which did not mention
  it). This does not block Hillsboro's own banner work — just note that Hillsboro is the SECOND
  inline-banner city, not literally the first, and the `beaverton` entry is the freshest
  copy-paste template (more relevant than the older `bloomington` entry).

**Verify live per Stage 8:**
```
https://essentials.empowered.vote/results?browse_geo_id=4134100&browse_mtfcc=G4110
```

---

## Surfacing

**Entry to add to `src/lib/coverage.js` Oregon block** (`COVERAGE_STATES`, name='Oregon',
abbrev='OR', `areas` array — currently 7 entries: Beaverton, Fairview, Gresham, Maywood Park,
Portland, Troutdale, Wood Village):

```js
{ label: 'Hillsboro', browseGovernmentList: ['4134100'], browseStateAbbrev: 'OR', hasContext: true },
```

**Sort position:** Alphabetically between 'Gresham' and 'Maywood Park' (H comes after G, before
M). **Use the corrected geo_id `4134100`** — do not copy `4133850` from CONTEXT.md.

**Browse link at completion:** `essentials.empowered.vote/results?browse_geo_id=4134100&browse_mtfcc=G4110`

**hasContext: true** is correct once at least 1 stance row is inserted for a Hillsboro official.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The corrected geo_id 4134100 (not CONTEXT.md's 4133850) is the true Hillsboro, OR place code | geo_id Correction | Would silently break all routing/geofence joins; re-verified twice in this session via independent DB query + Data Commons cross-check — LOW residual risk, but Wave-0 must re-confirm live |
| A2 | Hillsboro's council is ward-nominated but city-wide (at-large) elected — wards are a residency requirement only | Form of Government | If wrong, would require custom X00xx ward geofences instead; risk mitigated by 3 independently-sourced confirmations of the same charter language, but none is a direct primary-source charter PDF fetch (hillsboro-oregon.gov WAF-blocked; qcode.us charter mirror not directly fetched in this session) |
| A3 | CivicWeb portal roster (Ward/Position labels, terms) reflects the CURRENT seated council as of 2026-07-01, not a stale cache | Live Roster | If CivicWeb is stale, Salgado's Dec-31-2026 term-end + the 3 seats up for Nov 2026 election could be inaccurate; Wave-0 should re-fetch immediately before seeding |
| A4 | CivicWeb portal headshot image URLs are downloadable (non-zero bytes, valid JPEG) despite one 0-byte curl test in this session | Headshot Sources | If images don't actually download, executor needs Ballotpedia/campaign-site fallback for all 7 — adds research overhead but does not block the phase (fallbacks already identified for at least Harris/Case) |
| A5 | photo_license for CivicWeb portal images is `press_use` (us_government_work pattern) | Headshot Sources | May need adjustment per actual image metadata found at execution |
| A6 | Ext_id range -4134101..-4134107 is unused | Migration Reference | Confirmed via live DB query in this session — LOW risk, but Wave-0 should re-run immediately before writing |
| A7 | Disk migration MAX is 1149 (next=1150) as of this research session | Migration Reference | Other work may land between research and planning/execution — Wave-0 must re-run `ls` before writing any migration file |
| A8 | Rob Harris currently holds the Council President title (as of the 2025-2029 term) | Mayor & Council President Modeling | If the title rotated to someone else since, only affects a migration comment — no structural office row depends on this |
| A9 | City Attorney is appointed (per charter Chapter VIII), so no judicial-* stance topics apply | Live Roster / Stance Scope | If wrong (e.g. an elected City Attorney was added since charter amendment), a small number of judicial-* stances would be incorrectly omitted — low likelihood, single-source (qcode.us charter mirror search summary, not directly fetched) |

---

## Open Questions (RESOLVED)

1. **Is the qcode.us Hillsboro Charter Chapter VIII text directly verifiable, or only via
   WebSearch summary?** *(RESOLVED-BY-PRECEDENT — appointed-City-Attorney/skip-judicial-topics
   decision is implemented in Plan 04 with documented low-risk rationale; Beaverton and Boulder
   City skipped judicial topics on the same grounds without issue.)*
   - What we know: WebSearch surfaced a summary claiming appointed City Attorney, sourced from
     `library.qcode.us/lib/hillsboro_or/pub/municipal_code/item/city_of_hillsboro_city_charter-chapter_viii`.
   - What's unclear: This research did not directly WebFetch that URL to quote the primary text
     verbatim (time-boxed to the more critical geo_id/at-large questions).
   - Recommendation: If a planner or executor has spare verification budget, directly fetch
     `library.qcode.us/lib/hillsboro_or/pub/municipal_code/item/city_of_hillsboro_city_charter-chapter_viii`
     to quote the appointed-attorney clause verbatim before finalizing the "skip judicial topics"
     decision. Low risk either way — even Beaverton and Boulder City skipped judicial topics on
     similar (less-verified) grounds without issue.

2. **Does the CivicWeb headshot CDN require a specific header/referrer to serve images?**
   *(RESOLVED — operationally gated by Plan 177-01 Task 2.C: test-download gate with byte-validity
   check and documented fallback before the headshot manifest is built.)*
   - What we know: The portal page itself returns 200 and lists image paths; one direct curl
     attempt at the Mayor's image path returned 200 status but 0 bytes written locally.
   - What's unclear: Whether this is a curl/local-write issue in the research sandbox, a
     redirect requiring `-L`, or an actual server-side block on non-browser requests.
   - Recommendation: Executor's headshot pipeline script should test-download one image first
     (e.g. via the existing `_tmp-*-headshots.py` requests-based approach with descriptive
     headers, matching the Beaverton script's `DESCRIPTIVE_HEADERS` pattern) before building
     the full manifest. If it fails, fall back to Ballotpedia (Harris confirmed) and campaign
     sites (Case, Harris confirmed to exist; check others).

---

## Environment Availability

No new external tools needed beyond the existing project infrastructure. No new geofences to
load (city geo_id 4134100 already present from v8.0 OR TIGER load).

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL / psql | Migration apply | Yes (via EV-Accounts .env) | Live | — |
| hillsboro-oregon.gov | Roster + Headshots | **NO — Akamai WAF-403 confirmed** | — | hillsboro-oregon.civicweb.net (NO-WAF, same city data) |
| hillsboro-oregon.civicweb.net | Roster + Headshots (practical primary) | Yes (HTTP 200) | CivicWeb SaaS | Ballotpedia / campaign sites per official |
| Ballotpedia | Headshot fallback | Partial (confirmed for Rob Harris) | — | Campaign sites |
| Wikimedia Commons | Mayor headshot fallback | **No hit found for Beach Pace** | — | CivicWeb portal / Ballotpedia |
| Python 3 + Pillow + requests | Headshot resize pipeline | Yes (existing `_tmp-*-headshots.py` pattern) | — | — |
| scripts/banners/process_banner.py + upload_banner.py | Community banner | Yes (proven on Beaverton/Bloomington/50 states) | — | — |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | SQL verification queries (inline psql, no test runner) |
| Config file | None — inline verification gates in plan |
| Quick run command | `psql $DATABASE_URL -c "SELECT COUNT(*) FROM essentials.offices o JOIN essentials.politicians p ON o.politician_id=p.id JOIN essentials.chambers ch ON o.chamber_id=ch.id WHERE ch.name='City Council' AND ch.government_id=(SELECT id FROM essentials.governments WHERE name='City of Hillsboro, Oregon, US')"` |
| Full suite command | 9-check E2E gate (see below), extended with a 10th banner-render check |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WASH-03 | 7 officials seeded with offices | SQL count | `SELECT COUNT(*)... = 7` | Wave-0 inline |
| WASH-03 | Mayor sorts first in display | SQL + live browse | `groupHierarchy.js` + human verify | Existing code |
| WASH-03 | 7 headshots at 600×750 in Storage | SQL count + CDN HTTP 200 | `SELECT COUNT(*) FROM essentials.politician_images WHERE...` | Wave-2 inline |
| WASH-03 | Evidence-only stances render | SQL count + live browse | `SELECT COUNT(*) FROM inform.politician_answers WHERE politician_id=...` | Wave-3 inline |
| WASH-03 | Purple hasContext chip | Browser/live browse | `essentials.empowered.vote/results?browse_geo_id=4134100&browse_mtfcc=G4110` | Wave-3 human verify |
| WASH-03 | Community banner renders (not gradient fallback) | Browser/live browse | Same browse URL — Local section shows photo | Wave-3 human verify |
| WASH-03 | Section-split = 0 rows | SQL | Section-split query after seed | Wave-1 inline |
| WASH-03 | No duplicate government row | SQL | `SELECT COUNT(*) FROM essentials.governments WHERE name='City of Hillsboro, Oregon, US'` = 1 | Wave-1 inline |

### 9-Check E2E Verification Gate (Wave-1 structural plan) + Banner Check (Wave-3)

1. `governments` row count = 1 for name='City of Hillsboro, Oregon, US'
2. `chambers` row exists with name='City Council', official_count=7
3. `districts` rows: exactly 1 LOCAL_EXEC + 1 LOCAL for geo_id='4134100' state='or'
4. `offices` count = 7 for Hillsboro chamber, `representing_city='Hillsboro'` set on all 7 (inline, no backfill)
5. `politician_images` count = 7 for Hillsboro politicians (all HTTP 200 from CDN)
6. `politician_answers` count ≥ 1 per official (honest blanks OK; 0 for any official = re-check)
7. Section-split query returns 0 rows for geo_id 4134100
8. Districts.state casing verified: all 'or' (lowercase)
9. Human-verify: live browse link shows Mayor first + all 6 councilors, compass stances visible, no party label
10. (Wave-3 banner) Human-verify: Local section banner shows the Hillsboro photo, not the tier gradient fallback

### Wave 0 Gaps

- [ ] DB probe: **re-confirm geo_id is 4134100, not 4133850** (this research's single most
      important verification item)
- [ ] DB probe: confirm no existing government/chamber rows for Hillsboro (name + geo_id)
- [ ] DB probe: confirm ext_id range -4134101..-4134107 is unused
- [ ] DB probe / disk `ls`: re-confirm disk migration MAX (this research found 1149 → next 1150)
- [ ] Re-fetch `hillsboro-oregon.civicweb.net/portal/members.aspx?id=10` to confirm current roster
- [ ] Test-download one CivicWeb headshot image to confirm the pipeline can retrieve real bytes

---

## Sources

### Primary (HIGH confidence)
- `essentials.geofence_boundaries` live query (psql, this session) — confirmed geo_id 4134100
  is the correct Hillsboro OR G4110 place row; confirmed geo_id 4133850 does not exist at all.
- `essentials.districts` / `essentials.governments` / `essentials.politicians` live queries —
  confirmed greenfield status (no pre-existing Hillsboro rows) and clean ext_id range.
- `hillsboro-oregon.civicweb.net/portal/members.aspx?id=10` (WebFetch, HTTP 200) — full current
  roster with exact ward/position labels, term dates, headshot image paths.
- `curl -A <Chrome UA> https://www.hillsboro-oregon.gov/...` — confirmed Akamai WAF-403 (Access
  Denied HTML body) even with a full desktop browser User-Agent.
- `ls C:/EV-Accounts/backend/migrations | sort` — confirmed disk MAX is 1149 as of 2026-07-01.
- `inform.compass_topics` live query — confirmed 44 live topics, 8 of which are judicial-*.
- Beaverton phase 176 artifacts (176-RESEARCH.md, 176-PATTERNS.md, 176-02-SUMMARY.md,
  176-05-SUMMARY.md) — direct structural/schema template, ext_id scheme precedent, migration
  split shape, coverage.js edit pattern.
- `src/lib/buildingImages.js` (read directly) — confirmed current CURATED_LOCAL state including
  the already-existing `beaverton` banner entry.
- `src/lib/coverage.js` (grep) — confirmed current Oregon block (7 entries).
- `docs/banner-asset-pipeline.md` (read directly) — full banner pipeline procedure.

### Secondary (MEDIUM confidence)
- Data Commons (datacommons.org/place/geoId/4134100) — independent cross-check of the corrected
  GEOID.
- Census QuickFacts (census.gov/quickfacts/fact/table/hillsborocityoregon) — same place,
  population/demographic confirmation.
- LegiStorm bio pages (Kipperlyn Sinclair, Beach Pace) — independently corroborate CivicWeb
  portal ward/position labels.
- Ballotpedia (Rob Harris, general Hillsboro page) — election-method summary + fallback headshot
  source confirmation.
- hillsboronewstimes.com candidate profile articles (Elizabeth Case, Rob Harris) — election date
  and ward confirmation.
- qcode.us Hillsboro Charter Chapter VIII (WebSearch summary only, not directly fetched) —
  appointed City Attorney claim.

### Tertiary (LOW confidence)
- WebSearch AI-generated summaries that initially conflated Sinclair/Alcaire position letters
  (A vs B) — refuted by the CivicWeb portal primary source and LegiStorm; retained here only as
  a documented pitfall, not as a source used in the final roster table.
- CivicWeb headshot image byte-download test — inconclusive (200 status, 0 bytes in one local
  test); flagged as an Open Question for Wave-0/executor verification.

---

## Metadata

**Confidence breakdown:**
- geo_id correction: HIGH — directly verified against live production DB + independent Census
  cross-check; this is a load-bearing correction to the phase description and CONTEXT.md.
- Form of government (ward-nominated, at-large elected): MEDIUM-HIGH — 3 independently-sourced
  WebSearch passes converge, but no single primary-source charter PDF was directly fetched
  (hillsboro-oregon.gov WAF-blocked; qcode.us mirror not directly fetched this session).
- Roster (7 of 7 officials, wards/positions/terms): HIGH — primary-sourced from the official
  CivicWeb portal (not a third-party mirror), cross-corroborated by LegiStorm + local news for
  several members.
- Headshot sourcing: MEDIUM — site confirmed reachable (unlike Beaverton's CivicPlus JS-render
  problem, CivicWeb portal exposes direct image paths), but one test download was inconclusive.
- Migration shape (schema): HIGH — directly inherited from the just-completed, same-milestone
  Beaverton template (176-PATTERNS.md), itself verified against OR migrations 244/246.
- Ext_id range + migration counter: HIGH at time of writing, but both are point-in-time
  snapshots that Wave-0 must re-verify (explicitly flagged).

**Research date:** 2026-07-01
**Valid until:** 2026-08-01 (30-day stable; note 3 council seats face a Nov 3, 2026 election —
recheck roster if planning/execution slips past that date).
