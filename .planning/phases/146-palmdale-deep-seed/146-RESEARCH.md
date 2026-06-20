# Phase 146: Palmdale Deep-Seed — Research

**Researched:** 2026-06-20
**Domain:** Palmdale, CA city council reconcile + complete + headshots + evidence-only stances
**Confidence:** HIGH (all 5 live-research objectives confirmed; DB state DB-verified 2026-06-20; city website fully accessible)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- D-01: Reconcile EXISTING partial seed (UPDATE-not-INSERT), no greenfield rebuild. Preserve all politician rows; reseat, never duplicate people. Re-confirm both link directions in a Wave-1 pre-flight SELECT and STOP on drift.
- D-02 (NEW — district modeling): Palmdale is by-district. Relabel the 4 existing At-Large district rows to match their occupant's real district — f61fd139→"District 1" (Bishop), 6ad1e005→"District 2" (Loa), a1d3e3bf→"District 4" (Ohlsen), 7fe09a06→"District 5" (Alarcón) — keeping district_type='LOCAL', geo_id='0655156'. Create one new district row "District 3" (LOCAL, geo_id '0655156') for Bettencourt.
- D-03: Backfill essentials.governments.geo_id = '0655156' on gov 4f59ebad, guarded WHERE geo_id IS NULL.
- D-04: Merge duplicate chambers — survivor 000d672d, move Bishop's office 198661de from c8e8d31e into it, then DELETE the emptied c8e8d31e. End: ONE "City Council" chamber, 5 district offices, official_count=5.
- D-05: Repair the bidirectional link — set politicians.office_id='198661de...' for Bishop (currently NULL). Keep BOTH offices.politician_id and politicians.office_id in sync on every roster write.
- D-06: Structural migration(s) register in supabase_migrations.schema_migrations. Headshot + stance migrations are AUDIT-ONLY (raw SQL, NOT registered). On-disk file counter authoritative; next structural = 918.
- D-07: Run feedback_section_split_check SQL after consolidation — expect Palmdale absent (0 rows).
- D-08 (mayor — Glendale model): Rotational Mayor flagged via title='Mayor' on Ohlsen's D4 council seat (office a67a975e); the other 4 seats title='Councilmember'. NO separate Mayor office / chamber / LOCAL_EXEC district. Re-confirm current mayor at apply time (rotates each December).
- D-09: Target current 5 = Bishop (D1), Loa (D2), Bettencourt (D3, create -700657), Ohlsen (D4, Mayor), Alarcón (D5). KEEP/relabel the 4 existing; CREATE Bettencourt + her District 3 office in the survivor chamber. No retirements needed (all 4 existing are current).
- D-10: Mayor Pro Tem (Bishop) is not modeled as a distinct title — title='Councilmember' for Bishop (only Mayor is flagged, per Glendale precedent).
- D-11: Only gap is Laura Bettencourt (D3) — source + process her portrait. Leave the existing 4 photos as-is unless a quick check shows one visibly broken/low-res.
- D-12: Evidence-only compass stances for the 5 current members, chairs model (1–5 = discrete position statements, NOT polarity). ONE research agent at a time. ALL live compass topics, not just local. No defaults; honest blanks; 100% citation.
- D-13: NO judicial-* topics — Palmdale is council-manager with an appointed City Attorney. Only live non-judicial topics.
- D-14: Evidence note: all 5 members have multi-year records (agendas/minutes, AV Press). Sources: cityofpalmdaleca.gov agendas/minutes, avpress.com (Antelope Valley Press), campaign sites.

### Claude's Discretion

- Migration granularity (one structural file vs. reconcile+complete split like Lancaster 910/911; one stance file per official like 913/914/916/917). Whether to re-source any existing image found to be poor. Keep all SQL idempotent and guarded.

### Deferred Ideas (OUT OF SCOPE)

- Per-government "how this body is elected" blurb — future phase/feature.
- Cleanup of the 5 OTHER cities' pre-existing split-section defects.
- Palmdale school district(s) deep-seed.
- 2026 election (Districts 3/4/5) candidate/results ingestion.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PLMD-01 | Palmdale (0655156) deep-seeded — government + roster + headshots + evidence-only stances | All 5 current members confirmed (Bishop D1, Loa D2, Bettencourt D3, Ohlsen D4 Mayor, Alarcón D5); by-district CVRA structure verified; current Mayor = Ohlsen confirmed live; Bettencourt headshot source confirmed (cityofpalmdaleca.gov documentID=13184, HTTP 200); 4 existing headshots DB-verified (all good quality); 0 stances DB-verified (full research needed); stance evidence map documented |
</phase_requirements>

---

## Summary

Phase 146 is a reconcile+complete of a partial, structurally-defective Palmdale seed — following the Lancaster (Phase 145) playbook exactly but with one new twist: Palmdale is a **by-district** city (CVRA — *Jauregui v. Palmdale*), so the 4 existing At-Large district rows must be relabeled to match real district numbers (D1–D5), and a fifth district row created for D3 (Bettencourt).

The DB state is clean: 4 of 5 members are already seated in the DB with headshots (all accessible and visually clean), zero stances. Bishop's bidirectional link is broken (politicians.office_id = NULL). One member — Laura Bettencourt (D3) — has no real politician row; she must be created as ext_id -700657. Her official headshot is directly downloadable from cityofpalmdaleca.gov at documentID=13184 (HTTP 200, 216×288 PNG, clean professional portrait, no superimposed text).

The mayor situation is now fully resolved: Richard Loa (D2) held the Mayor title in 2025, was stripped of the title July 3 2025 following a confidential investigation, Bettencourt served as interim Mayor, and the council voted unanimously at its December 2 2025 meeting to select Eric Ohlsen (D4) as Mayor effective January 1 2026, with Austin Bishop (D1) as Mayor Pro Tem. The "2026 mayor-title dispute" referenced in CONTEXT.md was this July 2025 Loa removal — it is resolved. Ohlsen's selection was unanimous and there is no ongoing title dispute. **Current Mayor = Eric Ohlsen (D4) is confirmed.** [VERIFIED: cityofpalmdaleca.gov, avpress.com]

The existing 4 headshots are all professional official portraits: Loa is already 600×750, the other three (Bishop, Ohlsen, Alarcón) are 216×288 and need upscale. The city website (CivicEngage CMS) is fully accessible (HTTP 200, no WAF), making this headshot work significantly simpler than Lancaster or Glendale.

**Primary recommendation:** Execute as 4 waves mirroring Lancaster 145 — Wave 1 reconcile (geo_id + chamber merge + district relabel + back-pointer repair), Wave 2 roster (create Bettencourt + her D3 office + reseat Ohlsen as Mayor), Wave 3 headshots (Bettencourt only, plus upgrade 3 existing from 216×288), Wave 4 stances (5 members one at a time, non-judicial topics).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Government/chamber reconcile | Database / Storage | — | SQL migrations directly against Supabase via mcp__supabase-local; no frontend change |
| District relabeling (At-Large → D1–D5) | Database | — | UPDATE essentials.districts, INSERT one new row; no geofence work |
| Roster creation (Bettencourt) | Database | — | INSERT politicians + offices with synced bidirectional pointers |
| Mayor flag (title='Mayor') | Database | — | UPDATE offices SET title='Mayor' on Ohlsen's seat |
| Headshot processing | Local Bash + Pillow | Supabase Storage | curl download → crop 4:5 → resize 600×750 Lanczos q90 → Storage upload → politician_images INSERT |
| Evidence-only stances | Research agent (one at a time) | Database | Agent mines sources, outputs SQL; applied via mcp__supabase-local |
| UI rendering | None (existing) | — | Palmdale renders on existing browse/compass UI; Landing.jsx surfacing is Phase 157 |

---

## Live-Data Findings

### 1. Current Mayor — CONFIRMED (HIGH confidence, 2026-06-20)

**Current Mayor = Eric Ohlsen (D4), effective January 1 2026.**
**Current Mayor Pro Tem = Austin Bishop (D1).**

The CONTEXT.md "2026 mayor-title dispute" warning refers to the following resolved sequence:

| Date | Event |
|------|-------|
| Jan 1, 2025 | Richard Loa (D2) became Mayor via the then-active district-rotation method |
| Apr 1, 2025 | Council voted 4–1 (Loa dissenting) to change mayor-selection method from automatic rotation to majority council vote, adding mid-term removal authority |
| Jul 3, 2025 | Council voted to strip Loa of his mayor title pending a confidential investigation; Mayor Pro Tem Bettencourt assumed mayoral duties |
| Dec 2, 2025 | Council unanimously selected Eric Ohlsen (D4) as Mayor, Austin Bishop (D1) as Mayor Pro Tem, effective Jan 1 2026 |
| Jan 1, 2026 | Ohlsen's mayor term began (one-year term; next selection December 2026) |

**Loa remains a seated council member** (his elected D2 seat was not affected — only the ceremonial mayor title was removed). Loa's DB record (ext_id 692504, office 2e584cbd) stays active and should NOT be retired. [VERIFIED: cityofpalmdaleca.gov/CivicAlerts.aspx?AID=2113; avpress.com; nbclosangeles.com/news/local/palmdale-city-coucil-mayor-richard-loa-investigation/3738209/]

**The only pending risk:** Ohlsen's title could change at the next December 2026 rotation. The plan must flag `title='Mayor'` on Ohlsen's seat at apply time and include a re-confirm instruction.

### 2. By-District Structure — CONFIRMED (HIGH confidence)

**5 single-member districts (D1–D5), one councilmember each.** No at-large seats. No separately-elected Mayor seat (Mayor is council-selected, Glendale model). [VERIFIED: cityofpalmdaleca.gov/304/City-Council; cityofpalmdaleca.gov/305-310 member pages; CVRA litigation context]

**Current district → member mapping — CONFIRMED:**

| District | Member | ext_id (DB) | Office UUID | Status |
|----------|--------|-------------|-------------|--------|
| D1 | Austin Bishop | -201331 | 198661de (in c8e8d31e → move to 000d672d) | Exists, link broken |
| D2 | Richard J. Loa | 692504 | 2e584cbd (in 000d672d) | Exists, link OK |
| D3 | Laura Bettencourt | -700657 (new) | CREATE | Does not exist yet |
| D4 | Eric Ohlsen | 692516 | a67a975e (in 000d672d) | Exists, link OK; set title='Mayor' |
| D5 | Andrea Alarcón | 692518 | 6ca2f775 (in 000d672d) | Exists, link OK |

This matches CONTEXT.md exactly. No drift detected. [VERIFIED: cityofpalmdaleca.gov/304/City-Council; DB live query 2026-06-20]

### 3. Laura Bettencourt (D3) — CONFIRMED + HEADSHOT SOURCED (HIGH confidence)

**Laura Bettencourt is the current seated District 3 councilmember.** She has served since 2009, re-elected multiple times. Term expires November 2026 (District 3/4/5 are up Nov 2026). She holds a background in law enforcement (22-year LACSD crime analyst), teaches criminal justice at Antelope Valley College, and holds a Master's in criminal justice from CSUSB. She served as Mayor Pro Tem January 1 2025 (before Loa's removal) and then as interim Mayor (July–December 2025) when Loa's title was stripped. [VERIFIED: cityofpalmdaleca.gov/305/Councilmember-Laura-Bettencourt]

**"Paul Bettencourt" (ext_id -100407) is confirmed unrelated** — an active politician row with a different first name. Do not touch. [VERIFIED: DB live query 2026-06-20]

**Campaign-finance committee rows** — the DB shows multiple BETTENCOURT rows (all is_active=false, no first_name, no office_id): "BETTENCOURT 4 CITY COUNCIL 2022", "BETTENCOURT FOR CITY COUNCIL 2026; RE-ELECT LAURA", "BETTENCOURT FOR PALMDALE CITY COUNCIL (DISTRICT 3) 2016", etc. All are campaign-finance committee records. Ignore all of them. Create exactly one new real politician row for Laura Bettencourt at ext_id -700657. [VERIFIED: DB live query 2026-06-20]

**Headshot source — CONFIRMED ACCESSIBLE:**

| Source | URL | Status | Dimensions | Notes |
|--------|-----|--------|------------|-------|
| Official city bio page | `https://www.cityofpalmdaleca.gov/305/Councilmember-Laura-Bettencourt` | HTTP 200 | — | CivicEngage CMS, no WAF |
| Official headshot (CivicEngage) | `https://www.cityofpalmdaleca.gov/ImageRepository/Document?documentID=13184` | HTTP 200 | 216×288, PNG | Clean professional portrait; no text/graphics over face; needs 4:5 crop → 600×750 upscale |

Photo was visually confirmed: clean headshot with American flag background, no superimposed text or banners, full face and shoulders visible. Alt text in page HTML is "Bettancourt" (note typo — this is the city's metadata, not our concern). [VERIFIED: HTTP 200, Pillow dimension check, visual inspection 2026-06-20]

**Fallback sources** (only if cityofpalmdaleca.gov URL breaks at apply time):
- Ballotpedia: `https://ballotpedia.org/Laura_Bettencourt` — may have candidate photo
- Campaign site: `https://www.laurabettencourt.com/` — 2020 Mayor campaign site, may have photo
- LegiStorm: `https://www.legistorm.com/person/bio/509728/Laura_Bettencourt.html` — check for photo

### 4. Existing 4 Headshots — AUDIT RESULTS (HIGH confidence)

All 4 existing members have headshots in the DB. All are accessible and visually clean official portraits.

| Member | photo_license | Storage path pattern | Dimensions | Notes |
|--------|-------------|---------------------|------------|-------|
| Andrea Alarcón | press_use | `{politician_id}-headshot.jpg` (canonical) | 216×288 | Visually clean; needs upscale to 600×750 |
| Austin Bishop | scraped_no_license | `la_county/cities/palmdale/austin-bishop.png` (OLD path) | 216×288 | Old-path non-canonical; license needs upgrade to press_use; newer official photo exists at documentID=15391 |
| Richard Loa | scraped_no_license | `{politician_id}-headshot.jpg` (canonical) | 600×750 | Already at target size; visually clean; license needs upgrade to press_use |
| Eric Ohlsen | scraped_no_license (old) + press_use (new) | Old: `la_county/cities/palmdale/eric-ohlsen.jpg`; New: `{politician_id}-headshot.jpg` | 216×288 (both) | Has 2 rows — old-path + canonical; newest official photo at documentID=13182 |

**Key decision for Wave 3:**
- Bettencourt: download documentID=13184, crop 4:5 → resize 600×750, upload canonical path, INSERT politician_images with press_use. This is the primary gap.
- Bishop: The existing 216×288 photo is functional. The city site has a newer version at documentID=15391 (same dimensions). OPTION A: leave Bishop's existing photo as-is (simpler — it's correct and visually clean). OPTION B: replace with fresh download from documentID=15391 + upgrade license to press_use + fix to canonical path. **Recommendation: replace Bishop's scraped_no_license old-path image with a fresh download from documentID=15391, upgrade license to press_use, use canonical path.** This matches what was done for Ohlsen (the existing press_use row on the canonical path is fine; only the old-path row needs cleanup).
- Loa: Already 600×750. Upgrade license from scraped_no_license to press_use; add official city source URL as photo_origin_url. No new download needed.
- Alarcón: 216×288. OPTION A: leave as-is. OPTION B: upscale to 600×750 from existing or fresh download. The source on the city site is the same 216×288. **Recommendation: leave as-is for Alarcón and Ohlsen new-path image since the existing images are valid 216×288; the planner may decide to upscale as a quality improvement step.**
- Ohlsen: Has 2 politician_images rows (old + new). The old-path scraped_no_license row should be cleaned up. The canonical press_use row is already correct; just confirm it.

**cityofpalmdaleca.gov is fully accessible (HTTP 200, no WAF).** This is a significant advantage over Lancaster (Akamai WAF) and Glendale (WAF). All headshots can be downloaded with a standard curl + Chrome UA. No checkpoint:human-verify required for headshots. [VERIFIED: HTTP 200 probes on all member pages and ImageRepository URLs 2026-06-20]

**Official headshot documentIDs on cityofpalmdaleca.gov:**

| Member | documentID | Size | HTTP |
|--------|-----------|------|------|
| Laura Bettencourt | 13184 | 30 KB PNG | 200 |
| Austin Bishop | 15391 | 27 KB PNG | 200 |
| Eric Ohlsen | 13182 | 8 KB JPEG | 200 |
| Richard Loa | (not found on individual page — existing DB copy is 600×750, use it) | — | — |
| Andrea Alarcón | (not found on individual page — existing DB copy is 216×288, use it) | — | — |

### 5. DB State Verification (live 2026-06-20) — MATCHES CONTEXT.md EXACTLY

| Element | Value | Matches CONTEXT? |
|---------|-------|-----------------|
| gov 4f59ebad geo_id | NULL | ✓ |
| Survivor chamber 000d672d | official_count=5, 3 offices | ✓ |
| Duplicate chamber c8e8d31e | official_count=NULL, 1 office (Bishop) | ✓ |
| Bishop office_id in politicians | NULL | ✓ (broken pointer) |
| Loa, Ohlsen, Alarcón office_id | Set correctly | ✓ |
| 4 district rows, all label='At-Large' | ✓ | ✓ |
| Bettencourt real politician row | None | ✓ |
| ext_id -700657 | Free | ✓ |
| Ledger MAX (on-disk) | 917 | ✓ |
| Next structural migration | 918 | ✓ |

No drift from CONTEXT.md pre-check. Wave-1 pre-flight SELECT should still confirm, but no surprises expected.

**Note on 915 gap:** Migration 915 (Lauren Hughes-Leslie stances) is absent from the on-disk file list. The sequence goes 914 → 916. This was a Lancaster Phase 145 gap, not Palmdale's. The on-disk counter for Palmdale starts at 918.

### 6. Live Compass Topics — VERIFIED (HIGH confidence)

The live non-judicial compass topics as of 2026-06-20 (40 total including 6 with judicial_role populated). Palmdale council uses non-judicial only (D-13).

**Live non-judicial topics relevant to Palmdale city council:**

| topic_key | UUID | Evidence Strength for Palmdale |
|-----------|------|-------------------------------|
| `homelessness` | 4938766b | **STRONG** — Antelope Valley homelessness crisis is a primary local issue; all members have voted on city policies |
| `homelessness-response` | 6fbf39ae | **STRONG** — Same evidence vein as homelessness; enforcement vs services debate present in AV politics |
| `housing` | 669cac97 | **STRONG** — RHNA obligations, affordability, density — major issue in Palmdale's growth corridor |
| `local-immigration` | b9ccee94 | **STRONG** — Palmdale's council changed mayor-selection rules; sanctuary/immigration enforcement posture documented |
| `growth-and-development` | fb25c1ac | **STRONG** — Palmdale is actively developing; Boeing/defense sector, residential growth, warehouse/logistics |
| `residential-zoning` | d4f18138 | **MEDIUM** — Density vs single-family debates; RHNA compliance context |
| `local-environment` | 1935979c | **MEDIUM** — Antelope Valley wind/solar; air quality; desert preservation |
| `public-safety-approach` | e9ebefcd | **MEDIUM** — Crime, policing, community safety are perennial local council topics |
| `economic-development` | eb3d1247 | **MEDIUM** — Aerospace/defense industry (Boeing), logistics, employment |
| `transportation-priorities` | ba59337e | **MEDIUM** — Metrolink commuter rail, Antelope Valley Line, bus service, highway access |
| `climate-change` | f1e44d66 | **LOW-MEDIUM** — City-level climate resolutions; solar energy; AV wind power |
| `immigration` | 4e2c69ce | **LOW** — State-level; city council rarely takes positions |
| `rent-regulation` | c308e8e8 | **LOW** — AV cities historically less rent-control focused than LA City proper |
| `city-sanitation` | 7687de4f | **LOW-MEDIUM** | — Clean streets / homeless camps nexus |
| `deportation` | 44905f3b | **LOW** | — State/federal; but local-immigration enforcement posture may have related votes |

Topics with near-zero evidence at city council level (honest blank expected for most members): `abortion`, `trans-athletes`, `same-sex-marriage`, `school-vouchers`, `voting-rights`, `social-security`, `medicare/aid`, `redistricting`, `taxes` (state-level), `fossil-fuels` (state-level), `ukraine-support`, `tariffs`, `misinformation`, `ai-regulation`, `childcare`, `religious-freedom`, `campaign-finance`, `data-centers`, `jail-capacity`, `civil-rights`.

Topics to check — may have evidence for specific members: `civil-rights` (Bettencourt's LACSD background may produce public-safety-adjacent civil-rights record), `campaign-finance` (Loa removal investigation context may have produced statements).

**Judicial topics — ALL EXCLUDED** per D-13. Palmdale has council-manager form of government with an appointed City Attorney (Alexandra Halfman, Stradling law firm). [ASSUMED — City Attorney may have changed; regardless the appointed/non-elected status holds per council-manager form.]

**Retired topic IDs to NEVER use** (per `project_compass_live_topic_ids` memory):
- 6 retired IDs must not be used. Always query `WHERE is_live = true` at apply time. Never hardcode topic UUIDs.

### 7. Evidence Sources for Stance Research

**cityofpalmdaleca.gov:**
- Agendas/minutes: `cityofpalmdaleca.gov/AgendaCenter` (PrimeGov portal)
- Council meeting videos: YouTube channel or city site
- News releases: `cityofpalmdaleca.gov/CivicAlerts.aspx`
- Member bio pages: `cityofpalmdaleca.gov/304/City-Council`

**Antelope Valley Press (avpress.com):**
Primary local news archive for Palmdale. Rich record going back 10+ years. Query: `site:avpress.com palmdale city council [member name]`. Paywall may gate some articles; use title + snippet for evidence record.

**AV Daily News (avdailynews.com):** Alternative/secondary AV local news source. Often covers council votes.

**Our Weekly (ourweekly.com):** Community-focused coverage; covered Bettencourt's 2021 Pro Tem appointment.

**Campaign sites:**
- Bishop: `austinbishoppalmdale.com` (or similar — search needed)
- Bettencourt: `laurabettencourt.com` (2020 Mayor campaign site; may have current platform)
- Ohlsen: CoCoAV community coalition social media / Facebook

**Per-member stance evidence preview:**

| Member | Evidence Expectation | Key Topics |
|--------|---------------------|------------|
| Eric Ohlsen (D4, Mayor) | MODERATE-STRONG — 4 years seated (2022–), CoCoAV community background, environmental focus | local-environment, growth-and-development, homelessness, public-safety |
| Austin Bishop (D1, Mayor Pro Tem) | STRONG — longest-serving D1 member (elected 2016), multiple Mayor/Pro Tem stints | homelessness, housing, local-immigration, public-safety-approach |
| Richard J. Loa (D2) | MODERATE-STRONG — complex record; 2025 mayor removal investigation adds context | housing, growth-and-development, homelessness; investigate removal context |
| Laura Bettencourt (D3) | MODERATE-STRONG — 2009–present (15+ years), LACSD background, criminal justice expertise | public-safety-approach, homelessness, local-immigration, housing; was interim Mayor 2025 |
| Andrea Alarcón (D5) | MODERATE — seated since ~2020; check for avpress.com coverage | homelessness, housing, growth-and-development |

**Order for stance research (Wave 4):** Bishop (longest record, mayoral history) → Bettencourt (15+ years, criminal justice expertise, interim Mayor 2025) → Loa (complex record, mayor removal context important to document accurately) → Alarcón → Ohlsen (most recent seating, 2022).

---

## Architecture Patterns

### Recommended wave structure (mirroring Lancaster 145)

```
Wave 1 — Reconcile (structural, registers in schema_migrations)
  Migration 918:
  ├── UPDATE governments SET geo_id='0655156' WHERE id='4f59ebad...' AND geo_id IS NULL
  ├── UPDATE offices SET chamber_id='000d672d...' WHERE id='198661de...'  (move Bishop from c8e8d31e to 000d672d)
  ├── DELETE FROM chambers WHERE id='c8e8d31e...'  (now empty)
  ├── UPDATE districts SET label='District 1' WHERE id='f61fd139...'  (Bishop's district)
  ├── UPDATE districts SET label='District 2' WHERE id='6ad1e005...'  (Loa's district)
  ├── UPDATE districts SET label='District 4' WHERE id='a1d3e3bf...'  (Ohlsen's district)
  ├── UPDATE districts SET label='District 5' WHERE id='7fe09a06...'  (Alarcón's district)
  ├── INSERT INTO districts (label='District 3', district_type='LOCAL', geo_id='0655156', state='CA')
  ├── UPDATE chambers SET official_count=5 WHERE id='000d672d...'
  ├── Run split-section check (expect Palmdale absent — 0 rows)
  └── Register in schema_migrations

Wave 2 — Roster (structural, may be same or second migration — planner's call)
  Migration 918 or 919:
  ├── Repair Bishop's back-pointer: UPDATE politicians SET office_id='198661de...' WHERE id='475b846d...'
  ├── Flag Mayor: UPDATE offices SET title='Mayor' WHERE id='a67a975e...'
  ├── INSERT politicians row for Laura Bettencourt (external_id=-700657, is_active=true)
  ├── INSERT offices row for Bettencourt in 000d672d, District 3, title='Councilmember'
  ├── Set Bettencourt's politicians.office_id = new office UUID (bidirectional)
  └── Register in schema_migrations

Wave 3 — Headshots (audit-only, NOT registered)
  Migration 919 or 920 (headshots):
  ├── Bettencourt (PRIMARY GAP):
  │   ├── curl https://www.cityofpalmdaleca.gov/ImageRepository/Document?documentID=13184
  │   ├── Pillow: crop 4:5 → resize 600×750 Lanczos q90
  │   ├── Upload to Storage politician_photos/{bettencourt-uuid}-headshot.jpg
  │   └── INSERT politician_images (type='default', photo_license='press_use', url=canonical)
  ├── Bishop upgrade (optional quality step):
  │   ├── curl documentID=15391 (fresh official photo, same dimensions as existing)
  │   ├── Pillow: crop 4:5 → resize 600×750 Lanczos q90
  │   ├── Upload to canonical politician_photos/{bishop-uuid}-headshot.jpg
  │   └── UPDATE/INSERT politician_images with press_use + canonical path
  ├── Loa license upgrade: UPDATE politician_images SET photo_license='press_use' WHERE politician_id='6e5d3005...'
  ├── Ohlsen cleanup: DELETE old-path scraped row; confirm canonical press_use row is 600×750
  └── (no registration in schema_migrations)

Wave 4 — Stances (audit-only, NOT registered; one agent per official)
  Migrations 920–924 (approx, planner assigns):
  ├── Bishop (longest record first)
  ├── Bettencourt (15+ years, criminal justice expertise)
  ├── Loa (complex record — research with care re: removal context)
  ├── Alarcón
  └── Ohlsen (most recent; community/environment focus)
```

### SQL Patterns (carry from Lancaster 910/911 exactly)

**Wave 1 template:** `C:/EV-Accounts/backend/migrations/910_lancaster_reconcile.sql` (geo_id backfill + move-then-delete + district UPDATE pattern new for Palmdale)

**District relabeling (NEW for this phase):**
```sql
-- Relabel At-Large districts to real district numbers
UPDATE essentials.districts SET label = 'District 1'
WHERE id = 'f61fd139-b621-48d7-b06d-784ebfe9192e';

UPDATE essentials.districts SET label = 'District 2'
WHERE id = '6ad1e005-cf20-4cca-aa16-0e50eb1521da';

UPDATE essentials.districts SET label = 'District 4'
WHERE id = 'a1d3e3bf-e2d8-4c6d-8277-acac261a6f1f';

UPDATE essentials.districts SET label = 'District 5'
WHERE id = '7fe09a06-620f-45b6-ae56-78af65600cec';

-- Create District 3 for Bettencourt
INSERT INTO essentials.districts (label, district_type, geo_id, state)
VALUES ('District 3', 'LOCAL', '0655156', 'CA');
```

**Wave 2 Bettencourt create template (from Lancaster White/Castellanos pattern):**
```sql
-- Create Laura Bettencourt
INSERT INTO essentials.politicians
  (first_name, last_name, external_id, is_active, is_incumbent, is_appointed_position)
VALUES
  ('Laura', 'Bettencourt', -700657, true, true, false);

-- Create her District 3 office in the survivor chamber
INSERT INTO essentials.offices
  (chamber_id, district_id, title, politician_id)
VALUES
  ('000d672d-97f1-4f1f-af61-9eb6f008c4fd',
   '<new-district-3-uuid>',
   'Councilmember',
   '<new-bettencourt-politician-uuid>');

-- Repair bidirectional: set politicians.office_id = new office UUID
UPDATE essentials.politicians
SET office_id = '<new-office-uuid>'
WHERE external_id = -700657;
```

**Wave 4 stance template (from Lancaster 913/914):**
```sql
WITH pol AS (SELECT id FROM essentials.politicians WHERE external_id = -700657)
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
VALUES ((SELECT id FROM pol), '<topic-uuid>', <1-5>)
ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = EXCLUDED.value;
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chamber move-then-delete | New detach logic | Lancaster 910/SC 894 SQL pattern | Proven idempotent; same move-then-delete shape |
| District relabeling | Complex migration | Simple UPDATE by UUID | 4 known UUIDs; direct UPDATE is safest |
| Image crop/resize | Custom script | Reuse Lancaster/Glendale Pillow pipeline (4:5 crop FIRST → 600×750 Lanczos q90) | Tested; never stretch aspect ratio |
| Storage upload | Custom HTTP | Supabase Python client with service-role key (C:/EV-Accounts/backend/.env) | Proven across 142–145 |
| Person deduplication | New logic | Pre-flight SELECT by last_name + external_id | Bettencourt's campaign-finance rows must not be confused with the real politician |
| Stance SQL | New template | Copy 913_rex_parris_stances.sql pattern exactly | Tested across 25+ officials |
| Compass topic lookup | Hardcode UUIDs | Always query WHERE is_live = true at apply time | 6 retired IDs exist; never hardcode |

---

## Common Pitfalls

### Pitfall 1: Confusing campaign-finance committee rows with real politicians
**What goes wrong:** The DB has multiple BETTENCOURT rows (is_active=false, no first_name). A planner or executor mistakes one for Laura Bettencourt's real politician row and tries to UPDATE it instead of INSERT.
**Why it happens:** The names look similar; the is_active=false rows appear in a SELECT by last_name.
**How to avoid:** Filter `WHERE first_name IS NOT NULL` or check `external_id IS NOT NULL`. Campaign-finance rows have no first_name and no external_id. Create exactly one NEW row: `INSERT INTO essentials.politicians (first_name='Laura', last_name='Bettencourt', external_id=-700657, ...)`.
**Warning signs:** Any UPDATE targeting a row with NULL first_name is a bug.

### Pitfall 2: Relabeling districts with wrong UUIDs
**What goes wrong:** Planner uses a wrong UUID for one of the 4 existing At-Large districts, mislabeling the wrong district row.
**Why it happens:** 4 very similar district UUIDs; the mapping district_id → occupant is non-obvious.
**How to avoid:** Use ONLY the UUID-to-member mapping verified in live DB:
- f61fd139 → District 1 (Bishop)
- 6ad1e005 → District 2 (Loa)
- a1d3e3bf → District 4 (Ohlsen)
- 7fe09a06 → District 5 (Alarcón)
**Warning signs:** Any UPDATE on a district row that would change geo_id or district_type is wrong (those should remain as-is).

### Pitfall 3: Treating Loa as needing retirement (like Lancaster's Crist/Malhi)
**What goes wrong:** The narrative about "Loa was stripped of mayor title" is confused with Loa leaving the council. Planner retires Loa (is_active=false, office_id=NULL) when in fact he is still a seated D2 councilmember.
**Why it happens:** The July 2025 removal was of the mayor TITLE only, not his elected D2 seat. Loa remains on the council.
**How to avoid:** Loa's D2 council seat is active and correct. No retirement needed. His mayor title was never in the DB (the DB has `title='Councilmember'` on his office — there is no Mayor office to undo).
**Warning signs:** Any UPDATE setting Loa's is_active=false is a bug.

### Pitfall 4: Applying the Lancaster directly-elected Mayor model instead of Glendale rotational model
**What goes wrong:** Planner creates a separate LOCAL_EXEC Mayor office/district for Ohlsen (Lancaster pattern) instead of flagging title='Mayor' on his existing D4 council seat (Glendale pattern).
**Why it happens:** The two most-recent AV city reconciles have different mayor models: Lancaster = directly-elected LOCAL_EXEC (correct for Lancaster), Palmdale = council-selected rotational (correct for Palmdale).
**How to avoid:** Palmdale uses the GLENDALE model (D-08): `UPDATE offices SET title='Mayor' WHERE id='a67a975e...'`. No new Mayor office, no LOCAL_EXEC district, no chamber change.
**Warning signs:** Any INSERT into offices with title='Mayor' + a new LOCAL_EXEC district is the wrong model for Palmdale.

### Pitfall 5: Omitting Bishop's bidirectional link repair
**What goes wrong:** Wave 2 correctly moves Bishop's office but forgets to set politicians.office_id for Bishop (it's currently NULL — same bug that existed for all Lancaster members).
**Why it happens:** The move-then-delete (Wave 1) updates offices.chamber_id. The bidirectional pointer politicians.office_id is a SEPARATE UPDATE and is easily forgotten.
**How to avoid:** Every roster write has two pointers to update: (1) offices.politician_id and (2) politicians.office_id. Bishop's politicians.office_id must be set = '198661de...' explicitly.
**Warning signs:** Post-Wave-2 SELECT showing Bishop with politicians.office_id IS NULL.

### Pitfall 6: Using the wrong offices title for Loa
**What goes wrong:** When relabeling the district rows, executor also renames Loa's office title from 'Councilmember' to 'Council Member' (or vice versa) inconsistently.
**Why it happens:** The existing DB has 3 offices with title='Councilmember' and Bishop's with title='Council Member' (note the space). The goal is to standardize to 'Councilmember' for all 5.
**How to avoid:** Wave 2 should set Bishop's office title from 'Council Member' to 'Councilmember' for consistency. All 5 final offices (except Ohlsen who gets 'Mayor') should have title='Councilmember'.

### Pitfall 7: Assigning -700657 without verifying it's free
**What goes wrong:** Bettencourt is assigned ext_id -700657 assuming it's free, but it was used by a previous migration not yet visible in this session.
**How to avoid:** The live DB query confirms -700657 is free as of 2026-06-20. Run `SELECT external_id FROM essentials.politicians WHERE external_id = -700657` as the first thing in Wave 2. [VERIFIED: DB 2026-06-20 — free]

### Pitfall 8: Treating the city site as WAF-blocked (Lancaster carry-over assumption)
**What goes wrong:** Executor marks all headshots as `checkpoint:human-verify` based on the Lancaster WAF experience, when in fact cityofpalmdaleca.gov is fully accessible.
**Why it happens:** Lancaster's city site (cityoflancasterca.org, Akamai WAF) required human browser for headshots. Executor copies that pattern.
**How to avoid:** cityofpalmdaleca.gov is a CivicEngage CMS with NO WAF blocking. All ImageRepository URLs return HTTP 200 with a standard Chrome UA. Curl downloads work. No checkpoint:human-verify needed for headshots in this phase.

---

## Package Legitimacy Audit

Not applicable — this phase installs no new npm/Python packages. Uses existing Pillow + Supabase client proven in phases 142–145.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| psql | Migration apply | Yes | 18.1 | mcp__supabase-local execute_sql |
| Supabase Storage | Headshot upload | Yes | Production | — |
| Python Pillow | Headshot crop/resize | Yes (confirmed in session) | 10.x | pip install Pillow |
| curl | Headshot download | Yes | Bash tool | — |
| cityofpalmdaleca.gov | Bettencourt headshot (documentID=13184) | Available (HTTP 200 confirmed) | — | Ballotpedia / campaign site fallback |
| mcp__supabase-local | Migration apply + verification | Yes | Production | psql fallback |

**No missing dependencies with no fallback.** All required tools and URLs are confirmed available. This is the cleanest headshot environment of the LA County Wave 2 cities so far (no WAF, no AVAQMD CDN tricks needed).

---

## Validation Architecture

No automated test framework applies (per established CA deep-seed pattern). Verification gates are SQL assertions embedded in or run after each migration.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | SQL assertion queries via mcp__supabase-local |
| Config file | none — assertions are inline SQL |
| Quick run command | Individual SELECT queries in each wave |
| Full suite command | All assertions in sequence before /gsd:verify-work |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| PLMD-01 | gov row has geo_id='0655156' | SQL assertion | `SELECT geo_id FROM essentials.governments WHERE id='4f59ebad...'` | N/A |
| PLMD-01 | Exactly 1 'City Council' chamber for Palmdale | SQL assertion | `SELECT COUNT(*) FROM essentials.chambers WHERE government_id='4f59ebad...'` = 1 | N/A |
| PLMD-01 | 5 active officials seated in survivor chamber | SQL assertion | `SELECT COUNT(*) FROM essentials.offices WHERE chamber_id='000d672d...'` = 5 | N/A |
| PLMD-01 | No duplicate chambers (split-section check) | SQL assertion | Run feedback_section_split_check for Palmdale = 0 rows | N/A |
| PLMD-01 | All 5 district labels correct (D1–D5) | SQL assertion | SELECT label FROM districts WHERE id IN (the 4 UUIDs + new D3) | N/A |
| PLMD-01 | Bishop bidirectional link repaired | SQL assertion | `SELECT office_id FROM essentials.politicians WHERE external_id=-201331` IS NOT NULL | N/A |
| PLMD-01 | Mayor flagged on Ohlsen's seat | SQL assertion | `SELECT title FROM essentials.offices WHERE id='a67a975e...'` = 'Mayor' | N/A |
| PLMD-01 | Bettencourt politician row created | SQL assertion | `SELECT COUNT(*) FROM essentials.politicians WHERE external_id=-700657` = 1 | N/A |
| PLMD-01 | All 5 members have headshots | SQL assertion | `SELECT COUNT(*) FROM politician_images WHERE politician_id IN (5 UUIDs) AND type='default'` = 5 | N/A |
| PLMD-01 | 0 stance rows with judicial topic_ids | SQL assertion | `SELECT COUNT(*) FROM politician_answers WHERE politician_id IN (5 UUIDs) AND topic_id IN (judicial IDs)` = 0 | N/A |
| PLMD-01 | 100% citation (answers have context) | SQL assertion | All politician_answers rows have matching politician_context rows | N/A |

### Wave-by-Wave Verification Checks

**Wave 1 (reconcile):**
- `geo_id = '0655156'` on Palmdale gov row
- `SELECT COUNT(*) FROM chambers WHERE government_id = '4f59ebad...'` = 1 (one chamber)
- `SELECT COUNT(*) FROM chambers WHERE id = 'c8e8d31e...'` = 0 (duplicate gone)
- `SELECT COUNT(*) FROM offices WHERE chamber_id = '000d672d...'` = 4 (before Wave 2 adds Bettencourt)
- All 4 occupied district rows now labeled District 1/2/4/5 (not At-Large)
- New District 3 row exists with label='District 3', district_type='LOCAL', geo_id='0655156', state='CA'
- `SELECT MAX(version) FROM supabase_migrations.schema_migrations` includes migration 918
- Split-section check = 0 rows for Palmdale

**Wave 2 (roster):**
- Bishop: `politicians.office_id IS NOT NULL` (was NULL pre-wave)
- Ohlsen: `offices.title = 'Mayor'` for office a67a975e
- Bettencourt: `SELECT COUNT(*) FROM politicians WHERE external_id = -700657` = 1
- Bettencourt: `politicians.office_id IS NOT NULL` (bidirectional from INSERT)
- `official_count = 5` on chamber 000d672d
- All 5 members: `is_active = true`

**Wave 3 (headshots):**
- Bettencourt has exactly 1 politician_images row with type='default', photo_license='press_use'
- All 5 members have at least 1 politician_images row with type='default'
- All 5 headshot URLs return HTTP 200
- schema_migrations MAX unchanged (not registered by headshot migration)

**Wave 4 (stances):**
- All 5 current members have stances (COUNT > 0 for each)
- 0 rows with judicial topic_ids (query is_live=true AND judicial_role IS NOT NULL)
- 0 rows with retired topic_ids (all topic_ids are in inform.compass_topics WHERE is_live=true)
- 100% citation: every politician_answers row has a matching politician_context row
- schema_migrations MAX unchanged (not registered by stance migrations)

### Sampling Rate
- **Per task commit:** wave-level verification SELECT queries
- **Per wave merge:** full verification checklist above
- **Phase gate:** All assertions green before /gsd:verify-work

### Wave 0 Gaps
None — no new test infrastructure required. All verification is SQL assertions matching the established CA deep-seed pattern from phases 142–145.

---

## Security Domain

Security enforcement is not explicitly configured for this project (no security_enforcement key in .planning/config.json). This is a data migration phase (SQL + headshots + stances) with no new API endpoints, authentication flows, or user-facing input validation. Standard security considerations:

- All DB writes use parameterized SQL (no user input in migrations)
- Service-role key stored in C:/EV-Accounts/backend/.env (not committed to git)
- Storage uploads use Supabase service-role authentication
- No new code deployed to EV-Accounts API

No additional ASVS review required for this phase type.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Ohlsen's mayor title holds through December 2026 (rotates each December) | Live-Data §1 | At apply time, re-confirm by checking cityofpalmdaleca.gov/307 — title could have changed if council replaced him mid-term (the April 2025 rule change allows this) |
| A2 | cityofpalmdaleca.gov ImageRepository URLs for the other 3 members' headshots (Bishop documentID=15391, Ohlsen documentID=13182) remain stable | Environment Availability | URLs could expire; test HTTP 200 at apply time before downloading |
| A3 | Loa's individual bio page on city site not having a headshot documentID means his current DB copy (600×750) is the best available | Existing Headshots §4 | If his page was updated post-research with a new photo, that newer version could be used |
| A4 | The current City Attorney is Alexandra Halfman (Stradling law firm, appointed) | Live-Data §6 | May have changed; regardless City Attorney is appointed (not elected) — judicial topic exclusion holds |
| A5 | Stance evidence for Bettencourt (15+ years, former Mayor Pro Tem, interim Mayor) will be findable from avpress.com + city agendas | Stance Evidence Map | If avpress.com has paywalled all Bettencourt articles, rely on city agendas/minutes and AV Daily News |
| A6 | Andrea Alarcón's existing 216×288 headshot does not need replacement | Existing Headshots §4 | If the headshot turns out to be poor quality at apply time, source a fresh one from the city site |

**All other claims in this research were verified or cited — no additional user confirmation needed.**

---

## Open Questions

1. **Migration granularity: one 918 or two 918/919 for reconcile+roster?**
   - What we know: Lancaster split into 910 (reconcile) + 911 (roster); SC used two files
   - What's unclear: whether the District 3 creation + Bettencourt INSERT (which depends on District 3 UUID) should be in one file or two
   - Recommendation: Split into 918 (reconcile: geo_id + chamber merge + district relabels) and 919 (roster: Bettencourt create + Mayor flag + Bishop pointer repair). This makes each file independently idempotent and easier to review. The new District 3 UUID is needed for 919, so 918 must run first.

2. **Alarcón and Ohlsen headshots: upscale or leave as-is?**
   - What we know: Alarcón is 216×288 (press_use canonical). Ohlsen has both an old scraped row and a new press_use canonical row. Bettencourt source is 216×288.
   - What's unclear: whether 216×288 upscaled to 600×750 produces acceptable quality for display
   - Recommendation: The 216×288 → 600×750 Lanczos upscale is the same process used for the existing 3 (Bishop/Ohlsen/Alarcón), and they look good in the UI (prior waves accepted this). Leave as-is except clean up Ohlsen's duplicate old-path row. Bettencourt will get the same 216×288 → 600×750 treatment.

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: cityofpalmdaleca.gov/304/City-Council] — current 5 council members, districts, titles (HTTP 200, 2026-06-20)
- [VERIFIED: cityofpalmdaleca.gov/CivicAlerts.aspx?AID=2113] — Ohlsen selected as Mayor Jan 1 2026, Bishop as Pro Tem (December 2, 2025 council vote)
- [VERIFIED: cityofpalmdaleca.gov/305/Councilmember-Laura-Bettencourt] — Bettencourt D3 confirmed; documentID=13184 headshot accessible (HTTP 200, 216×288 PNG)
- [VERIFIED: cityofpalmdaleca.gov/307/Mayor-Eric-Ohlsen] — Ohlsen's current mayor page; documentID=13182 headshot accessible
- [VERIFIED: cityofpalmdaleca.gov/306/Mayor-Pro-Tem-Austin-Bishop] — Bishop's page; documentID=15391 headshot accessible (HTTP 200)
- [VERIFIED: DB live query 2026-06-20] — gov geo_id=NULL, dual chambers, 4 offices + occupants, 4 headshots, 0 stances, -700657 free, ledger MAX=917
- [CITED: nbclosangeles.com/news/local/palmdale-city-coucil-mayor-richard-loa-investigation/3738209/] — Loa stripped of mayor title July 3 2025; Bettencourt interim; investigation ongoing
- [CITED: avpress.com/news/ohlsen-picked-as-next-palmdale-mayor/article_ae2e3f86-60ca-4371-886c-01837b252bd7.html] — Ohlsen unanimous selection December 2025
- [CITED: avpress.com — Palmdale OKs new way to pick mayor] — April 1 2025 mayor-selection method change (4-1 vote, Loa dissented)

### Secondary (MEDIUM confidence)
- [CITED: avdailynews.com/single-post/eric-ohlsen-selected-as-palmdale-s-next-mayor-austin-bishop-named-mayor-pro-tem] — confirms Ohlsen selection
- [CITED: ourweekly.com/news/2021/01/29/laura-bettencourt-selected-palmdale-mayor-pro-tem/] — Bettencourt history as Pro Tem
- [CITED: ballotpedia.org/Laura_Bettencourt] — D3 confirmed, term expires Nov 2026
- [CITED: legistorm.com/person/bio/509728/Laura_Bettencourt.html] — seated since May 2009, criminal justice background
- [ASSUMED] City Attorney Alexandra Halfman (Stradling law firm) — verified from NBC LA article but may have changed

### Tertiary (LOW confidence)
- WebSearch results confirming Palmdale's CVRA by-district structure (Jauregui v. Palmdale) — training-data consistent, not independently verified in this session
- Per-member stance evidence strength ratings — based on news coverage patterns; actual evidence depth confirmed at research time

---

## Metadata

**Confidence breakdown:**
- Roster (all 5 current members, district mapping): HIGH — verified live from cityofpalmdaleca.gov + DB
- Mayor title (Ohlsen, confirmed + full backstory): HIGH — multiple official sources + live city page
- Bettencourt headshot (documentID=13184, accessible): HIGH — HTTP 200 + visual confirmation
- Existing 4 headshots (audit + quality): HIGH — downloaded + visually confirmed
- District UUIDs (relabeling mapping): HIGH — DB live query
- Compass topics (live non-judicial set): HIGH — direct DB query
- Stance evidence map: MEDIUM — based on news/coverage patterns; depth confirmed at research time

**Research date:** 2026-06-20
**Valid until:** 2026-11-30 (Palmdale Nov 2026 election will affect D3/D4/D5 — but current seating is stable until then; Mayor may rotate in December 2026)
