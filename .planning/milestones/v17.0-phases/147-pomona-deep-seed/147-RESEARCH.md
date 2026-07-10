# Phase 147: Pomona Deep-Seed — Research

**Researched:** 2026-06-20
**Domain:** Pomona, CA city council reconcile + complete + headshots + evidence-only stances
**Confidence:** HIGH (DB state DB-verified 2026-06-20; city website WAF-blocked confirmed; government structure confirmed via multiple sources; roster confirmed via Nov 2024 LA County election results)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| POMO-01 | Pomona (0658072) deep-seeded — government + roster + headshots + evidence-only stances | 6 of 7 officials already exist in DB (1 missing: Ontiveros-Cole D4); by-district + directly-elected mayor structure verified; WAF-blocked site documented; alternative headshot sources confirmed accessible; 0 stances DB-verified (full research needed); stance evidence map provided |
</phase_requirements>

---

## Summary

Phase 147 is a reconcile+complete of a partial, structurally-defective Pomona seed, following the same LA County Wave-2 playbook as Phases 143-146. Pomona has two distinctive structural features not seen in prior LA County Wave-2 cities: (1) a **directly-elected citywide Mayor** (Lancaster model — separate LOCAL_EXEC seat, already partially modeled in DB as "Pomona Mayor"), and (2) **six council districts** (D1-D6) instead of five, requiring 6 district rows rather than 5.

The DB state is materially more complex than Palmdale: 6 of 7 officials already exist but are split across two duplicate chambers; three officials have broken `politicians.office_id` bidirectional links; two district rows need to be created (District 4 for Ontiveros-Cole and District 5 for Lustro, who currently shares a district UUID with Garcia); and one official — Elizabeth Ontiveros-Cole (D4, re-elected Nov 2024) — has no politician row at all and must be created at ext_id -700658.

The headshot situation is the hardest of the LA County Wave-2 cities so far: **pomonaca.gov returns HTTP 403 on all paths** (WAF-blocked, similar to Lancaster/Glendale) with no known working URL pattern. Three of the seven officials have no headshot; three of four existing headshots have quality or provenance issues. The Pomona Choice Energy site (pomonachoiceenergy.org) provides accessible 2020-era CivicPlus portraits for Sandoval, Garcia, Lustro, and Ontiveros-Cole, but the 2025 "new member" photos on that site appear to be stale placeholders (wrong people). All headshots will require human browser retrieval from pomonaca.gov, campaign sites, or verified secondary sources.

Stance evidence is available through Pomona city council agendas/minutes (on Legistar), The Pomonan magazine (thepomonan.com), and LA Public Press — particularly for the rent stabilization ordinance vote (November 17 2025, 5-1) which documents individual positions for all current members.

**Primary recommendation:** Execute as 4 waves mirroring Lancaster 145 and Palmdale 146 — Wave 1 reconcile (geo_id + chamber merge + district relabels + 2 new districts + Lustro district_id fix), Wave 2 roster (Ontiveros-Cole create + all bidirectional link repairs + official_count=7), Wave 3 headshots (7 officials, WAF-challenged, checkpoint:human-verify for pomonaca.gov photos), Wave 4 stances (7 officials, one at a time, non-judicial topics only).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Government/chamber reconcile | Database / Storage | — | SQL migrations via psql + mcp__supabase-local; no frontend change |
| District relabeling (At-Large → D1-D6) + creation | Database | — | UPDATE 4 existing rows + INSERT 2 new rows; no geofence work |
| Roster repair (bidirectional links) + Ontiveros-Cole create | Database | — | UPDATE politicians.office_id + INSERT politicians + offices |
| Mayor seat (LOCAL_EXEC) — already modeled | Database | — | "Pomona Mayor" district + title='Mayor' already exist; just merge to survivor chamber |
| Headshot processing | Local Bash + Pillow | Supabase Storage | curl (alt sources) or human browser (pomonaca.gov) → crop 4:5 → resize 600×750 Lanczos q90 → Storage upload → politician_images INSERT |
| Evidence-only stances | Research agent (one at a time) | Database | Agent mines sources; outputs SQL applied via psql |
| UI rendering | None (existing) | — | Pomona renders on existing browse/compass UI; Landing.jsx surfacing is Phase 157 |

---

## Live-Data Findings

### 1. Form of Government — CONFIRMED (HIGH confidence)

**Council-manager form of government.** Pomona has been a charter city since 1911. The City Manager is the chief administrative officer, directly responsible to the Mayor and City Council.

**Directly-elected Mayor (at-large, 4-year term)**: The Mayor is elected by all registered voters of Pomona. This is the Lancaster model — NOT the Glendale/Palmdale rotational council-selected model. The Mayor is NOT council-selected and does NOT rotate. [VERIFIED: pomonaca.gov election information; municipode.com Pomona City Code Article IV; search result confirmation "Mayor elected every four years"]

**No judicial topics**: The City Attorney is an appointed position (external law firm: Best Best & Krieger LLP). City Attorney Sonia Carvalho leads the office. NOT elected. [VERIFIED: pomonaca.gov/government/departments/city-attorney confirmed City Attorney's Office]

**Vice Mayor**: The council designates a Vice Mayor (currently Nora Garcia). This is a ceremonial internal title, not a separately-elected position. The Vice Mayor designation is NOT modeled in the schema (not done in any prior phase). Model Garcia as title='Councilmember' on her D3 seat.

### 2. Council Structure — CONFIRMED (HIGH confidence, 2026-06-20)

**7 elected officials total: 1 directly-elected Mayor (citywide) + 6 district councilmembers (D1-D6).** Each councilmember is elected only by registered voters of their own district and must reside in that district. 4-year terms for all. Council elections are staggered: D1/D4/D6 cycle together (last elected Nov 2024), D2/D3/D5 cycle together (up June/Nov 2026). Mayor on its own 4-year cycle (last re-elected Nov 2024). [VERIFIED: pomonaca.gov elections information; LA County Registrar election results 4324 confirmed D1/D4/D6 Nov 2024 winners]

### 3. Current Elected Roster — CONFIRMED (HIGH confidence, 2026-06-20)

| Role | Member | ext_id (DB) | politician_id (DB) | Office UUID | Chamber | Status |
|------|--------|-------------|---------------------|-------------|---------|--------|
| Mayor (at-large) | Tim Sandoval | -200916 | 48f36a82-cb26-4701-ba08-5566533982cb | 657cb0b2 (in Chamber A → move to B) | A (doomed) | Exists; pointer broken |
| D1 Council Member | Debra Martin | 675752 | db853cfa-ab6d-4a30-bfbc-fb05b3956970 | e9e216c1 (in Chamber B) | B (survivor) | Exists; pointer OK |
| D2 Council Member | Victor Preciado | 675753 | 56cecf7c-6de0-440f-b8e2-34945ec52333 | b6ac307c (in Chamber B) | B (survivor) | Exists; pointer OK |
| D3 Council Member (Vice Mayor) | Nora Garcia | -201350 | 6fa28860-c3d6-45bf-8aad-eac353dc4559 | 315a0a8a (in Chamber A → move to B) | A (doomed) | Exists; pointer broken |
| D4 Council Member | Elizabeth Ontiveros-Cole | -700658 (NEW) | CREATE | CREATE | B (survivor) | Does NOT exist |
| D5 Council Member | Steve Lustro | -201352 | 07e0311b-5013-49ac-849e-7aeaa3402ea2 | 8570f2ad (in Chamber A → move to B) | A (doomed) | Exists; pointer broken |
| D6 Council Member | Lorraine Canales | 675765 | 3a578edc-56ad-43cf-ac8f-68d05fd5d7a8 | 4c594891 (in Chamber B) | B (survivor) | Exists; pointer OK |

**November 2024 election results (confirmed via LA County Registrar results page 4324):**
- D1: Debra Martin (58.54%) defeated incumbent John Nolte (41.46%) — TURNOVER
- D4: Elizabeth Ontiveros-Cole (54.54%) defeated Guillermo Gonzalez (45.46%) — INCUMBENT RE-ELECTED
- D6: Lorraine Canales (53.79%) defeated Miranda Sheffield (46.21%) — NEW vs prior candidate

**June 2026 primary (in progress as of 2026-06-20):**
- D2: Victor Preciado (incumbent, 47.06%) leading
- D3: Nora Garcia (incumbent, 69.77%) leading
- D5: Steve Lustro NOT on ballot — Elliott Rothman leading (53.04%); Lustro is term-limited or chose not to run. Lustro is the current seated D5 member through December 2026 or until results certify.

[VERIFIED: LA County Registrar results page 4324; thepomonan.com primary results; MSN/direct search for June 2026 Pomona results]

**Important note on Debra Martin**: The DB has `external_id=675752` for "Debra Martin" as a pre-existing row. This was loaded during the v7.0 provider import when Debra Martin was first elected to D1 in a prior cycle. She is the same person who won in Nov 2024 — no new politician row needed. Verify this is the correct Debra Martin (D1, Pomona) at apply time.

**Important note on Lorraine Canales**: The DB has `external_id=675765` for "Lorraine Canales". She won D6 in Nov 2024, replacing Robert Torres. The DB row may have been created from the prior D6 occupant data (Robert Torres). Verify at apply time that this DB row correctly represents Lorraine Canales (not Torres). The existing headshot photo (469×469 PNG) MUST be verified visually — the Pomona Choice Energy HTML source shows their "Canales" image placeholder still has `alt="Robert S. Torres"` (stale data), suggesting this may be Torres's photo.

### 4. DB State Verification (live 2026-06-20) — COMPLETE

| Element | Value | Notes |
|---------|-------|-------|
| gov id | 3c2c2a4b-a63c-4049-bcf6-e925fcb7d6c4 | Name: "City of Pomona, California, US" |
| gov geo_id | NULL | Needs backfill to '0658072' |
| gov state | CA | Already correct |
| Chamber A (doomed) | 54a55a35-54b0-4f2a-b5f8-843665a0c3ae | official_count=NULL; 3 offices (Mayor, Garcia, Lustro) |
| Chamber B (survivor) | ddabfccc-820f-4b10-bc0f-a7ba47d9bb0d | official_count=7; 3 offices (Canales, Martin, Preciado) |
| District rows | 5 total: 4 At-Large (LOCAL) + 1 "Pomona Mayor" (LOCAL_EXEC) | All have geo_id='0658072', state='CA' |
| Shared district (PROBLEM) | 35d17606: SHARED by Garcia (office 315a0a8a) AND Lustro (office 8570f2ad) | Must relabel to D3 (Garcia) + CREATE new D5 for Lustro |
| Ontiveros-Cole | NOT in politicians table (only campaign-finance committee rows) | Must CREATE politician -700658 + office + D4 district |
| Bidirectional link status | Garcia=NULL, Lustro=NULL, Sandoval=NULL; Martin=OK, Preciado=OK, Canales=OK | |
| Headshots | 3 exist (Canales, Martin, Preciado); 3 missing (Garcia, Lustro, Sandoval) | See §5 for quality assessment |
| Stances | 0 for all 6 existing politicians | Full research needed |
| On-disk migration MAX | 925 (925_eric_ohlsen_stances.sql) | Next structural migration = 926 |
| schema_migrations MAX | 919 | Next structural migration registers as 926 |
| ext_id -700658 | FREE | Confirmed by DB query |

### 5. District UUID Mapping and Reconcile Plan (HIGH confidence)

The 4 existing At-Large district UUIDs map to occupants as follows (verified by joining offices → districts):

| District UUID | Current occupant office | Correct label | Action |
|---------------|------------------------|---------------|--------|
| 35d17606-34ce-47cd-ad83-abde1821cabe | Garcia (315a0a8a) AND Lustro (8570f2ad) — SHARED | "District 3" (Garcia) | Relabel to "District 3"; then UPDATE Lustro's office district_id to NEW District 5 UUID |
| e282b5d3-b1dc-4966-ad72-9f0629660f79 | Martin (e9e216c1) | "District 1" | Relabel |
| 3a213f0d-bcbd-4243-b576-b9c18c621520 | Preciado (b6ac307c) | "District 2" | Relabel |
| 1946c2e2-a863-45fd-a2d7-56f20c7201ae | Canales (4c594891) | "District 6" | Relabel |
| 3ec78ed9-41f9-4a4d-bab0-b891e93c6340 | Sandoval (657cb0b2) | "Pomona Mayor" (LOCAL_EXEC) | KEEP as-is |
| (NEW) | Ontiveros-Cole | "District 4" | CREATE (LOCAL, geo_id='0658072', state='CA') |
| (NEW) | Lustro | "District 5" | CREATE (LOCAL, geo_id='0658072', state='CA'); UPDATE Lustro's office to use this UUID |

**Total final districts for Pomona: 7 rows** — "Pomona Mayor" (LOCAL_EXEC) + "District 1" through "District 6" (all LOCAL).

### 6. Headshot Sources and Status — CONFIRMED (HIGH confidence for accessibility; MEDIUM for photo identity)

**pomonaca.gov: FULLY WAF-BLOCKED** — HTTP 403 on ALL paths tested:
- Individual member pages: 403
- ShowPublishedDocument: 403
- ShowPublishedImage: 403
- Known document URL (home/showpublisheddocument/2552/...): 403

No working URL pattern found. All headshots must come from alternative sources. This requires `checkpoint:human-verify` for any photo claimed to come from the official city site.

**Existing DB headshots audit:**

| Member | DB headshot | Dimensions | License | Quality | Path type | Action |
|--------|-------------|------------|---------|---------|-----------|--------|
| Debra Martin | YES (1280×1700 JPEG) | Near 4:5 ratio | press_use | GOOD — large, good quality | Canonical ({uuid}-headshot.jpg) but different subdomain | Crop 4:5 → resize 600×750 |
| Lorraine Canales | YES (469×469 PNG) | Square (NOT 4:5) | None | SUSPECT — may be Robert Torres (prior D6 occupant) | Old path (/politician_id/default.jpg) | Verify identity; if Torres, replace |
| Victor Preciado | YES (150×150 PNG) | Too small | None | POOR — 150×150 is too small for quality upscale | Old path (/politician_id/default.jpg) | Replace with better source |
| Nora Garcia | NO | — | — | MISSING | — | Source new |
| Steve Lustro | NO | — | — | MISSING | — | Source new |
| Tim Sandoval | NO | — | — | MISSING | — | Source new |
| Elizabeth Ontiveros-Cole | NO (politician row doesn't exist yet) | — | — | MISSING | — | Source after create |

**Alternative headshot sources (all HTTP 200 confirmed):**

| Source | Members Available | URL Pattern | Dimensions | Notes |
|--------|-------------------|-------------|------------|-------|
| Pomona Choice Energy (2020 CivicPlus) | Sandoval, Garcia, Lustro, Ontiveros-Cole | `https://pomonachoiceenergy.org/wp-content/uploads/2020/06/{filename}.jpg` | 172×230 | 2020 official CivicPlus photos; correct identity confirmed from page HTML (alt text matches); usable but ~6 years old |
| Pomona Choice Energy (2025 "new") | Martin, Canales | `https://pomonachoiceenergy.org/wp-content/uploads/2025/02/638723568891930000.png` etc. | 469×469 | STALE — HTML `alt` shows "Rubio R. Gonzalez" (Martin) and "Robert S. Torres" (Canales). Do NOT use these. |
| timsandoval.com | Sandoval | `/about/` page | Unknown | Campaign site; check for headshot |
| noraforpomona.com | Garcia | `/about/` | Unknown | Campaign site; active |
| debramartinforcouncil.com | Martin | `/about/` | Unknown | Has headshot; verify quality |
| Instagram @mayorsandoval | Sandoval | Social media | Varies | Profile/official photos |
| Wikimedia Commons | Any | commons.wikimedia.org | Varies | Search by name; check for official portraits |
| Ballotpedia | Any | ballotpedia.org | Varies | Often has candidate photos |
| nolte4pomona.com | Nolte (prior D1, NOT current) | — | — | Wrong person — ignore |

**Recommended headshot sourcing order for each member:**
1. **Tim Sandoval**: Try timsandoval.com/about; fallback PCE 2020 (172×230); fallback Ballotpedia
2. **Nora Garcia**: Try noraforpomona.com/about; fallback PCE 2020 (172×230)
3. **Steve Lustro**: PCE 2020 (172×230) is the best accessible option; or Ballotpedia/LinkedIn
4. **Elizabeth Ontiveros-Cole**: PCE 2020 (172×230, alt="Elizabeth Ontiveros-Cole" confirmed); or debramartinforcouncil.com (wrong person — ignore); or Ballotpedia
5. **Debra Martin**: Existing DB 1280×1700 JPEG is good — crop 4:5 → 600×750. VERIFY it's Martin not prior D1 occupant.
6. **Victor Preciado**: 150×150 too small. Try PCE 2020 photo (172×230, confirmed via HTML alt="Victor Preciado")
7. **Lorraine Canales**: DB 469×469 PNG may be Torres. Verify; if wrong, replace. PCE 2025 photos are Torres/Gonzalez — do NOT use. Try Ballotpedia/campaign sites.

Since pomonaca.gov is WAF-blocked, all 7 member headshots require either verified alternative sources (PCE 2020, campaign sites) or human browser retrieval. The planner should include `checkpoint:human-verify` before each upload where source provenance is uncertain.

**Canonical headshot path for all new uploads**: `politician_photos/{politician_uuid}-headshot.jpg` with type='default', press_use.

### 7. Stance Evidence Map

**Local evidence sources:**
- `pomona.legistar.com` — City council agendas, staff reports, meeting minutes. Complete record of votes.
- `thepomonan.com` — Local magazine with detailed council vote coverage
- `lapublicpress.org` — Rent control coverage with individual member votes
- `la.streetsblog.org` — Housing/transportation coverage for Pomona
- `caanet.org`, `thelabradagroup.com` — Rent control ordinance coverage (5% cap, Nov 2025 vote)
- Individual campaign sites for platform stances

**November 17 2025 Rent Stabilization vote (5-1, permanent 5% cap RSO)**:
This is the most valuable single vote for cross-member differentiation:
- YES: Sandoval, Preciado, Garcia, and at least 2 others (5-1 total)
- NO: One member (likely Martin or Canales — Nov 2024 new members described as "more business-friendly")
- Specific per-member votes need confirmation from Legistar minutes

**Per-member stance evidence preview:**

| Member | Evidence Expectation | Key Topics |
|--------|---------------------|------------|
| Tim Sandoval (Mayor) | STRONG — re-elected Mayor 2024, serving since 2018; extensive documented record | housing, homelessness, rent-regulation, growth-and-development, local-immigration, public-safety-approach |
| Nora Garcia (D3, Vice Mayor) | STRONG — seated 2018, re-running 2026; campaign platform documented | housing, rent-regulation, public-safety-approach, local-environment (warehouse zoning ban) |
| Victor Preciado (D2) | MODERATE — seated 2018/2022; check Legistar for votes | housing, growth-and-development, homelessness |
| Elizabeth Ontiveros-Cole (D4) | MODERATE — seated 2016/re-elected 2024; long record | housing, homelessness, public-safety-approach; RSO abstain (if confirmed) |
| Steve Lustro (D5) | MODERATE — seated 2018/re-elected 2022; known PPOA police endorsement 2018 | public-safety-approach (police funding); homelessness; housing |
| Debra Martin (D1) | LOW-MODERATE — new Nov 2024; described as "business-friendly"; limited voting record | rent-regulation (likely NO), housing; check Legistar for any 2025 votes |
| Lorraine Canales (D6) | LOW-MODERATE — new Nov 2024; limited voting record | housing; check campaign platform |

**Topics with evidence at Pomona city council level:**
- `rent-regulation` (c308e8e8): STRONG — permanent 5% RSO vote Nov 2025 directly maps
- `housing` (669cac97): STRONG — RHNA obligations, RSO debate, density policy
- `homelessness` (4938766b): STRONG — LA County homelessness is Pomona's primary local issue
- `homelessness-response` (6fbf39ae): STRONG — enforcement vs services debate documented
- `local-immigration` (b9ccee94): MEDIUM — Pomona was historically a sanctuary city concern
- `growth-and-development` (fb25c1ac): MEDIUM — logistics/warehouse zoning (Garcia's anti-warehouse stance is documented)
- `public-safety-approach` (e9ebefcd): MEDIUM — police funding; PPOA endorsements
- `local-environment` (1935979c): MEDIUM — Garcia's warehouse zoning ban = documented environment angle
- `residential-zoning` (d4f18138): MEDIUM — density policy, anti-warehouse
- `economic-development` (eb3d1247): LOW-MEDIUM — Pomona Compassion Fund; business development
- `transportation-priorities` (ba59337e): LOW-MEDIUM — Metrolink, local transit
- `city-sanitation` (7687de4f): LOW — homeless encampment cleanup nexus

Topics expected to be blank for most members: `abortion`, `trans-athletes`, `same-sex-marriage`, `school-vouchers`, `voting-rights`, `social-security`, `medicare/aid`, `redistricting`, `taxes` (state-level), `fossil-fuels`, `ukraine-support`, `tariffs`, `ai-regulation`, `childcare`, `religious-freedom`, `campaign-finance`, `data-centers`, `civil-rights`, `immigration` (state/federal), `deportation`, `climate-change` (state-level).

**Judicial topics — ALL EXCLUDED**: Pomona is council-manager with appointed City Attorney (Best Best & Krieger LLP, Sonia Carvalho). No elected judges or City Attorney. [VERIFIED: pomonaca.gov/government/departments/city-attorney]

**Research order for Wave 4 stances (longest record first):**
Sandoval → Garcia → Preciado → Lustro → Ontiveros-Cole → Martin → Canales

---

## Architecture Patterns

### Recommended Wave Structure

```
Wave 1 — Reconcile (structural, registers in schema_migrations)
  Migration 926:
  ├── UPDATE governments SET geo_id='0658072' WHERE id='3c2c2a4b-...' AND geo_id IS NULL
  ├── MOVE 3 offices (Mayor 657cb0b2, Garcia 315a0a8a, Lustro 8570f2ad) from A to B:
  │   UPDATE offices SET chamber_id='ddabfccc-...' WHERE id IN ('657cb0b2-...', '315a0a8a-...', '8570f2ad-...')
  ├── Assert Chamber A has 0 offices, then DELETE FROM chambers WHERE id='54a55a35-...'
  ├── Relabel 4 At-Large district rows:
  │   UPDATE districts SET label='District 1' WHERE id='e282b5d3-...'  (Martin)
  │   UPDATE districts SET label='District 2' WHERE id='3a213f0d-...'  (Preciado)
  │   UPDATE districts SET label='District 3' WHERE id='35d17606-...'  (Garcia only)
  │   UPDATE districts SET label='District 6' WHERE id='1946c2e2-...'  (Canales)
  ├── CREATE District 4 row: INSERT INTO districts (label='District 4', district_type='LOCAL', geo_id='0658072', state='CA')
  ├── CREATE District 5 row: INSERT INTO districts (label='District 5', district_type='LOCAL', geo_id='0658072', state='CA')
  ├── UPDATE Lustro's office to point at new District 5 UUID:
  │   UPDATE offices SET district_id='<new-d5-uuid>' WHERE id='8570f2ad-...'
  └── Register in schema_migrations

Wave 2 — Roster (structural, registers in schema_migrations)
  Migration 927:
  ├── Repair 3 broken bidirectional links:
  │   UPDATE politicians SET office_id='657cb0b2-...' WHERE id='48f36a82-...'  (Sandoval)
  │   UPDATE politicians SET office_id='315a0a8a-...' WHERE id='6fa28860-...'  (Garcia)
  │   UPDATE politicians SET office_id='8570f2ad-...' WHERE id='07e0311b-...'  (Lustro)
  ├── CREATE Elizabeth Ontiveros-Cole politician (external_id=-700658, is_active=true)
  ├── CREATE her District 4 office in Chamber B, title='Council Member'
  ├── SET bidirectional link: UPDATE politicians SET office_id=<new-office> WHERE external_id=-700658
  ├── UPDATE chambers SET official_count=7 WHERE id='ddabfccc-...'
  └── Register in schema_migrations

Wave 3 — Headshots (audit-only, NOT registered in schema_migrations)
  Migration 928 (audit-only):
  ├── Martin: crop DB 1280×1700 JPEG → 4:5 → resize 600×750 → replace in Storage at canonical path
  ├── Sandoval: source from timsandoval.com or PCE 2020 → crop 4:5 → resize 600×750 → upload
  ├── Garcia: source from noraforpomona.com or PCE 2020 → crop 4:5 → resize 600×750 → upload
  ├── Lustro: source from PCE 2020 (172×230) → crop 4:5 → resize 600×750 → upload
  ├── Ontiveros-Cole: source from PCE 2020 or Ballotpedia → crop 4:5 → resize 600×750 → upload
  ├── Preciado: PCE 2020 is 172×230 (better than 150×150 in DB) → crop 4:5 → resize 600×750 → replace
  ├── Canales: VERIFY DB photo identity (469×469 — check if Torres); if wrong, source from campaign/Ballotpedia
  ├── All uploads: type='default', press_use, canonical path {uuid}-headshot.jpg
  └── checkpoint:human-verify before any photo from pomonaca.gov (WAF-blocked; browser retrieval needed)

Wave 4 — Stances (audit-only, NOT registered; one agent per official)
  Migrations 929–935 (approx; planner assigns):
  ├── Sandoval (longest record, Mayor since 2018)
  ├── Garcia (seated 2018, Vice Mayor, anti-warehouse documented)
  ├── Preciado (seated 2018/2022)
  ├── Lustro (seated 2018/2022, PPOA endorsement context)
  ├── Ontiveros-Cole (seated 2016/re-elected 2024)
  ├── Martin (new Nov 2024; limited record)
  └── Canales (new Nov 2024; limited record)
```

### SQL Patterns (carry from Palmdale 918/919 exactly)

**geo_id backfill (identical to all prior phases):**
```sql
UPDATE essentials.governments
SET geo_id = '0658072'
WHERE id = '3c2c2a4b-a63c-4049-bcf6-e925fcb7d6c4'
AND geo_id IS NULL;
```

**Move-then-delete (3 offices, not 1 — new for Pomona):**
```sql
-- Move all 3 Chamber A offices to Chamber B
UPDATE essentials.offices
SET chamber_id = 'ddabfccc-820f-4b10-bc0f-a7ba47d9bb0d'
WHERE id IN (
  '657cb0b2-f607-4a8d-898c-5a15a49451fb',  -- Sandoval/Mayor
  '315a0a8a-a950-4bac-984d-7b60a192c176',  -- Garcia
  '8570f2ad-a8e4-476f-a437-4083da315095'   -- Lustro
);

-- Assert 0 offices remain in Chamber A before delete
DO $$ BEGIN
  IF (SELECT COUNT(*) FROM essentials.offices WHERE chamber_id = '54a55a35-54b0-4f2a-b5f8-843665a0c3ae') > 0
  THEN RAISE EXCEPTION 'Chamber A still has offices — ABORT';
  END IF;
END $$;

DELETE FROM essentials.chambers WHERE id = '54a55a35-54b0-4f2a-b5f8-843665a0c3ae';
```

**District relabeling (same pattern as Palmdale, 4 rows):**
```sql
UPDATE essentials.districts SET label = 'District 1'
WHERE id = 'e282b5d3-b1dc-4966-ad72-9f0629660f79';

UPDATE essentials.districts SET label = 'District 2'
WHERE id = '3a213f0d-bcbd-4243-b576-b9c18c621520';

UPDATE essentials.districts SET label = 'District 3'
WHERE id = '35d17606-34ce-47cd-ad83-abde1821cabe';

UPDATE essentials.districts SET label = 'District 6'
WHERE id = '1946c2e2-a863-45fd-a2d7-56f20c7201ae';
```

**Create 2 new district rows + update Lustro's office (NEW vs Palmdale):**
```sql
-- Create District 4 for Ontiveros-Cole
INSERT INTO essentials.districts (label, district_type, geo_id, state)
VALUES ('District 4', 'LOCAL', '0658072', 'CA');

-- Create District 5 for Lustro
INSERT INTO essentials.districts (label, district_type, geo_id, state)
VALUES ('District 5', 'LOCAL', '0658072', 'CA');

-- Update Lustro's office to use new District 5 UUID
UPDATE essentials.offices
SET district_id = '<new-district-5-uuid>'
WHERE id = '8570f2ad-a8e4-476f-a437-4083da315095';
```

**Create Ontiveros-Cole (Wave 2, from Lancaster White/Castellanos pattern):**
```sql
-- Create Elizabeth Ontiveros-Cole
INSERT INTO essentials.politicians
  (first_name, last_name, external_id, is_active, is_incumbent, is_appointed_position)
VALUES
  ('Elizabeth', 'Ontiveros-Cole', -700658, true, true, false);

-- Create her District 4 office in Chamber B
INSERT INTO essentials.offices
  (chamber_id, district_id, title, politician_id)
VALUES
  ('ddabfccc-820f-4b10-bc0f-a7ba47d9bb0d',
   '<new-district-4-uuid>',
   'Council Member',
   '<new-ontiveros-cole-politician-uuid>');

-- Repair bidirectional: set politicians.office_id = new office UUID
UPDATE essentials.politicians
SET office_id = '<new-office-uuid>'
WHERE external_id = -700658;
```

**Stance template (from Palmdale 921-925):**
```sql
WITH pol AS (SELECT id FROM essentials.politicians WHERE external_id = -200916)
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
VALUES ((SELECT id FROM pol), '<topic-uuid>', <1-5>)
ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = EXCLUDED.value;
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chamber move-then-delete (3 offices) | New detach logic | Same UUID-targeted move + assert + delete pattern as Palmdale/SC | Proven idempotent; only diff is 3 offices vs 1 |
| District relabeling | Complex migration | Simple UPDATE by UUID (4 rows) | Known UUIDs from DB-verified mapping |
| Shared-district fix (Lustro) | Complex reassignment logic | INSERT new D5 row FIRST, then UPDATE Lustro's office district_id | Sequential dependency; guarded with NOT EXISTS |
| Image crop/resize | Custom script | Reuse Lancaster/Palmdale Pillow pipeline (4:5 crop FIRST → 600×750 Lanczos q90) | Tested across phases 142-146 |
| Storage upload | Custom HTTP | Supabase Python client with service-role key | Proven across 142-146 |
| Person deduplication | New logic | Pre-flight SELECT by last_name + first_name + external_id | Campaign-finance rows for Ontiveros-Cole exist (no first_name, no external_id) |
| Stance SQL | New template | Copy 925_eric_ohlsen_stances.sql pattern exactly | Tested across 25+ officials |
| Compass topic lookup | Hardcode UUIDs | Always query WHERE is_live = true at apply time | 6 retired IDs exist; never hardcode |

---

## Common Pitfalls

### Pitfall 1: Moving only 1 office from Chamber A instead of 3
**What goes wrong:** Planner sees the Palmdale pattern (move 1 office: Bishop) and copies it, moving only one of the three Chamber A offices to Chamber B.
**Why it happens:** Palmdale's Chamber A had only 1 office (Bishop). Pomona's Chamber A has 3 offices (Sandoval, Garcia, Lustro). The delete will fail (Chamber A still has offices) or the roster will be incomplete.
**How to avoid:** Wave 1 must move ALL 3 offices: `WHERE id IN ('657cb0b2-...', '315a0a8a-...', '8570f2ad-...')`. The inline assert (count = 0 before delete) will catch any missed moves.
**Warning signs:** Delete of Chamber A failing with a foreign-key constraint; or post-Wave-1 showing only 4 offices in Chamber B instead of 6.

### Pitfall 2: Forgetting that Lustro shares a district UUID with Garcia
**What goes wrong:** Planner relabels 35d17606 to "District 3" (correct for Garcia) but doesn't create a new "District 5" row for Lustro, leaving his office pointing at "District 3" — wrong.
**Why it happens:** In Palmdale, each office had its own distinct At-Large district UUID. In Pomona, Garcia and Lustro share UUID 35d17606. After relabeling it to "District 3", Lustro's office still points at that UUID, incorrectly placing him in District 3.
**How to avoid:** Wave 1 MUST: (1) CREATE new District 5 row, (2) UPDATE Lustro's office `district_id` to the new D5 UUID. Both in the same migration, with D5 INSERT before the UPDATE.
**Warning signs:** Post-Wave-1 SELECT showing Lustro's office with district_label='District 3'.

### Pitfall 3: Using the Glendale/Palmdale rotational Mayor model
**What goes wrong:** Planner uses `title='Mayor'` on Sandoval's existing council seat (Glendale model) instead of recognizing the correctly-modeled LOCAL_EXEC district that already exists.
**Why it happens:** The last two AV cities (Glendale, Palmdale) used rotational-mayor model. Pomona uses a directly-elected Mayor like Lancaster — and the DB ALREADY has a correct "Pomona Mayor" LOCAL_EXEC district (3ec78ed9) + Sandoval's Mayor office (657cb0b2). No new Mayor district/office/title change needed.
**How to avoid:** Sandoval's office already has `title='Mayor'` and a LOCAL_EXEC district. The only work for his office is MOVING it from Chamber A to Chamber B (chamber_id update). Do NOT create a new office, district, or LOCAL_EXEC row for the Mayor.
**Warning signs:** Any INSERT of a new Mayor office or LOCAL_EXEC district row is a bug.

### Pitfall 4: Missing Elizabeth Ontiveros-Cole entirely (0 offices vs 6 target)
**What goes wrong:** After Wave 1, Chamber B has 6 offices (3 moved from A + 3 already in B). Planner assumes 6 = done (Mayor + 5 council = 6). But Pomona has 7 officials (Mayor + 6 council). D4 Ontiveros-Cole is completely absent.
**Why it happens:** No Office, no politician row — she's invisible in the initial SELECT. Planner counts offices and sees 6, not realizing 7 is the target.
**How to avoid:** Wave 2 MUST create Ontiveros-Cole politician (ext_id -700658, first_name='Elizabeth', last_name='Ontiveros-Cole') + her D4 office + bidirectional link. Target `official_count=7` on Chamber B, not 6.
**Warning signs:** Post-Wave-2 `official_count=7` query succeeds but `SELECT COUNT(*) FROM offices WHERE chamber_id=ddabfccc` = 6 instead of 7.

### Pitfall 5: Using "Canales" PCE 2025 photo (which is actually Robert Torres)
**What goes wrong:** Executor sources Lorraine Canales's headshot from the Pomona Choice Energy "2025 new member" URL and uploads it as Canales. The image is actually Robert Torres (prior D6 occupant).
**Why it happens:** The PCE page labels the image "District 6 — Lorraine Canales" but the alt text in HTML is "Robert S. Torres" and the filename contains a CivicPlus timestamp from early 2025 when the site was updated with the new labels but not new photos. The same applies to Martin/Gonzalez.
**How to avoid:** Never use the PCE 2025-upload photos (URLs containing `/2025/02/638723568...`). For Martin, use the existing DB 1280×1700 JPEG. For Canales, find a verified photo (campaign site, news article, Ballotpedia) or use checkpoint:human-verify.
**Warning signs:** Any photo URL containing `/2025/02/638723568891930000` or `/2025/02/638723568911570000`.

### Pitfall 6: Confusing campaign-finance committee rows with real politicians
**What goes wrong:** DB has campaign-finance rows for "ONTIVEROS-COLE FOR CITY COUNCIL DISTRICT 4 2016" and "ONTIVEROS-COLE FOR DISTRICT 4 COUNCILMEMBER 2024". Executor UPDATEs one of these instead of INSERTing a new row.
**Why it happens:** Campaign-finance rows look similar to politician rows in a `SELECT * WHERE last_name ILIKE '%ontiveros%'`. They have NULL first_name and NULL external_id.
**How to avoid:** Filter `WHERE first_name IS NOT NULL` or `WHERE external_id IS NOT NULL`. Create exactly one new row: INSERT with first_name='Elizabeth', last_name='Ontiveros-Cole', external_id=-700658.
**Warning signs:** Any UPDATE targeting a row with NULL first_name is a bug.

### Pitfall 7: Assuming pomonaca.gov is accessible like Palmdale
**What goes wrong:** Executor tries to curl headshots directly from pomonaca.gov ImageRepository or ShowPublishedDocument, receives 403, and marks all 7 headshots as "failed" or "checkpoint required" without trying alternative sources.
**Why it happens:** Palmdale (cityofpalmdaleca.gov) had NO WAF and all headshots could be curled. Pomona is different — it's fully WAF-blocked. The executor may not know to check alternative sources first.
**How to avoid:** Never attempt direct curl to pomonaca.gov. Go directly to: PCE 2020 photos for Sandoval/Garcia/Lustro/Ontiveros-Cole, existing DB for Martin, campaign sites for Canales. Browser retrieval is the last resort for any confirmed official portrait not available elsewhere.
**Warning signs:** Any curl command targeting `www.pomonaca.gov`.

### Pitfall 8: Incorrect bidirectional link repair direction
**What goes wrong:** Executor updates `offices.politician_id` (already set) but forgets to update `politicians.office_id` (broken for Garcia, Lustro, Sandoval).
**Why it happens:** The offices already have `politician_id` set correctly (offices know their politician). What's broken is `politicians.office_id` (politicians don't know their office). It's easy to confuse the two directions.
**How to avoid:** For each of the 3 broken members: `UPDATE essentials.politicians SET office_id='<office-uuid>' WHERE id='<politician-uuid>'`. DO NOT touch `offices.politician_id`.
**Warning signs:** Post-Wave-2 SELECT on politicians.office_id for Garcia/Lustro/Sandoval still returning NULL.

---

## Package Legitimacy Audit

Not applicable — this phase installs no new npm/Python packages. Uses existing Pillow + Supabase client proven in phases 142-146.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| psql | Migration apply | Yes | 18.1 | mcp__supabase-local execute_sql |
| Python Pillow | Headshot crop/resize | Yes (confirmed) | 10.x | pip install Pillow |
| curl | Headshot download (alt sources) | Yes | Bash tool | — |
| Supabase Storage | Headshot upload | Yes | Production | — |
| mcp__supabase-local | Migration apply + verification | Yes | Production | psql fallback |
| pomonaca.gov | Official portraits | **UNAVAILABLE (HTTP 403 WAF)** | — | PCE 2020, campaign sites, human browser |
| pomonachoiceenergy.org | Alt headshot source (2020 photos) | Available (HTTP 200) | — | Campaign sites, Ballotpedia |
| timsandoval.com | Sandoval headshot | To verify at apply time | — | PCE 2020 |
| noraforpomona.com | Garcia headshot | To verify at apply time | — | PCE 2020 |

**Missing dependencies with no fallback:** None — all blocking dependencies are available.

**Missing dependencies with fallback (WAF-blocked official source):**
- pomonaca.gov is blocked. Multiple verified alternative sources exist (PCE 2020 photos, campaign sites). Browser retrieval is last resort.
- All 7 headshots should be achievable via alternatives; planner should include checkpoint:human-verify for any photo requiring human browser session.

---

## Validation Architecture

No automated test framework applies (per established CA deep-seed pattern). Verification gates are SQL assertions run after each migration.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | SQL assertion queries via psql / mcp__supabase-local |
| Config file | none — assertions are inline SQL |
| Quick run command | Individual SELECT queries per wave |
| Full suite command | Full checklist before /gsd:verify-work |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| POMO-01 | gov row has geo_id='0658072' | SQL assertion | `SELECT geo_id FROM essentials.governments WHERE id='3c2c2a4b-...'` = '0658072' | N/A |
| POMO-01 | Exactly 1 'City Council' chamber for Pomona | SQL assertion | `SELECT COUNT(*) FROM essentials.chambers WHERE government_id='3c2c2a4b-...'` = 1 | N/A |
| POMO-01 | 7 active offices in survivor chamber | SQL assertion | `SELECT COUNT(*) FROM essentials.offices WHERE chamber_id='ddabfccc-...'` = 7 | N/A |
| POMO-01 | No duplicate chambers (split-section check) | SQL assertion | `SELECT COUNT(DISTINCT chamber_id) FROM offices WHERE chamber_id IN (SELECT id FROM chambers WHERE government_id='3c2c2a4b-...')` = 1 | N/A |
| POMO-01 | 6 district rows labeled District 1-6 | SQL assertion | `SELECT label FROM districts WHERE geo_id='0658072' AND district_type='LOCAL' ORDER BY label` | N/A |
| POMO-01 | 1 LOCAL_EXEC district row ("Pomona Mayor") | SQL assertion | `SELECT COUNT(*) FROM districts WHERE geo_id='0658072' AND district_type='LOCAL_EXEC'` = 1 | N/A |
| POMO-01 | All 3 broken bidirectional links repaired | SQL assertion | `SELECT office_id FROM politicians WHERE external_id IN (-200916,-201350,-201352)` all NOT NULL | N/A |
| POMO-01 | Ontiveros-Cole politician row created | SQL assertion | `SELECT COUNT(*) FROM politicians WHERE external_id=-700658` = 1 | N/A |
| POMO-01 | All 7 members have headshots | SQL assertion | `SELECT COUNT(DISTINCT politician_id) FROM politician_images WHERE politician_id IN (7 UUIDs) AND type='default'` = 7 | N/A |
| POMO-01 | 0 stance rows with judicial topic_ids | SQL assertion | Query inform.compass_topics WHERE is_live=true AND judicial_role IS NOT NULL; verify none in politician_answers | N/A |
| POMO-01 | 100% citation | SQL assertion | All politician_answers rows have matching politician_context rows | N/A |

### Wave-by-Wave Verification Checks

**Wave 1 (reconcile):**
- `geo_id = '0658072'` on Pomona gov row
- `SELECT COUNT(*) FROM chambers WHERE government_id = '3c2c2a4b-...'` = 1 (one chamber)
- `SELECT COUNT(*) FROM chambers WHERE id = '54a55a35-...'` = 0 (doomed chamber gone)
- `SELECT COUNT(*) FROM offices WHERE chamber_id = 'ddabfccc-...'` = 6 (before Wave 2)
- District labels: e282b5d3='District 1', 3a213f0d='District 2', 35d17606='District 3', 1946c2e2='District 6', 3ec78ed9='Pomona Mayor'
- New District 4 row exists: `SELECT COUNT(*) FROM districts WHERE label='District 4' AND geo_id='0658072'` = 1
- New District 5 row exists: `SELECT COUNT(*) FROM districts WHERE label='District 5' AND geo_id='0658072'` = 1
- Lustro's office points at District 5: `SELECT d.label FROM offices o JOIN districts d ON d.id=o.district_id WHERE o.id='8570f2ad-...'` = 'District 5'
- `SELECT MAX(version) FROM supabase_migrations.schema_migrations` includes 926
- Split-section check: 1 chamber for Pomona

**Wave 2 (roster):**
- Sandoval: `politicians.office_id IS NOT NULL` for 48f36a82
- Garcia: `politicians.office_id IS NOT NULL` for 6fa28860
- Lustro: `politicians.office_id IS NOT NULL` for 07e0311b
- Ontiveros-Cole: `SELECT COUNT(*) FROM politicians WHERE external_id = -700658` = 1
- Ontiveros-Cole: `politicians.office_id IS NOT NULL` (bidirectional from INSERT)
- `official_count = 7` on chamber ddabfccc
- `SELECT COUNT(*) FROM offices WHERE chamber_id='ddabfccc-...'` = 7
- All 7 members: `is_active = true`
- `SELECT MAX(version) FROM supabase_migrations.schema_migrations` includes 927

**Wave 3 (headshots):**
- All 7 members have at least 1 politician_images row with type='default'
- No rows have photo from `pomonachoiceenergy.org/wp-content/uploads/2025/02/638723568...` URLs (stale/wrong-person)
- All 7 headshot Storage URLs return HTTP 200
- schema_migrations MAX unchanged (not registered)

**Wave 4 (stances):**
- All 7 current members have stances (COUNT > 0 for each)
- 0 rows with judicial topic_ids
- 0 rows with retired topic_ids
- 100% citation: every politician_answers row has matching politician_context row
- schema_migrations MAX unchanged

### Sampling Rate
- **Per task commit:** wave-level verification SELECT queries
- **Per wave merge:** full verification checklist above
- **Phase gate:** All assertions green before /gsd:verify-work

### Wave 0 Gaps
None — no new test infrastructure required. All verification is SQL assertions matching the established CA deep-seed pattern from phases 142-146.

---

## Security Domain

No explicit security_enforcement configuration in .planning/config.json. This is a data migration phase (SQL + headshots + stances) with no new API endpoints, authentication flows, or user-facing input validation.

Standard controls:
- All DB writes use parameterized SQL / UUID-keyed statements (no user input in migrations)
- Service-role key stored in C:/EV-Accounts/backend/.env (not committed to git)
- Storage uploads use Supabase service-role authentication
- No new code deployed to EV-Accounts API

No additional ASVS review required.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Debra Martin (ext_id 675752) in DB is the same person who won D1 in Nov 2024 — not a prior D1 occupant with same name | Roster §3 | If prior occupant, Wave 2 must create a new Martin row; verify by checking DB politician's term/biographical data at apply time |
| A2 | Lorraine Canales (ext_id 675765) in DB is the Lorraine Canales who won D6 in Nov 2024 — not the prior D6 occupant (Robert Torres) with wrong name | Roster §3 | If this row was created for Torres and renamed, the headshot (469×469 PNG) may show Torres; verify photo identity at apply time |
| A3 | Steve Lustro is still seated as D5 member through Nov/Dec 2026; he did not file for re-election (2026 primary shows no incumbent in D5) | Roster §3 | If Lustro resigned or was removed, need to check for a replacement/appointment at apply time |
| A4 | -700658 is the correct next external_id for Ontiveros-Cole | DB State §4 | DB-verified as free 2026-06-20; re-confirm at apply time |
| A5 | The Pomona rent stabilization vote (Nov 17 2025, 5-1) had Sandoval/Garcia/Preciado on YES side and Martin on NO | Stance Evidence §7 | Per-member vote breakdown needs Legistar confirmation at apply time; do not assert a member voted YES/NO without Legistar citation |
| A6 | The PCE 2020 photos (172×230) correctly show the named individuals | Headshots §6 | The 2020 photos are from the CivicPlus CMS system with correct alt text. High confidence they are correct, but visually confirm before upload |
| A7 | Nora Garcia serves as Vice Mayor (council-selected, not modeled in schema) | Form of Government §1 | If Pomona changed its Vice Mayor designation to a directly-elected position (unlikely for charter city), research would need updating |
| A8 | The City Attorney is still appointed (Best Best & Krieger / Sonia Carvalho) and not elected | §1 | If Pomona changed to an elected City Attorney model, judicial topics would apply; confirm at apply time |

**All other claims in this research were verified or cited — no additional user confirmation needed.**

---

## Open Questions

1. **Wave 1 and Wave 2 as one migration or two?**
   - What we know: Palmdale used two migrations (918 reconcile / 919 roster). Lancaster used two (910 / 911).
   - What's unclear: Pomona's Wave 1 is more complex (3-office move + 4 relabels + 2 creates + 1 office district update). Could combine with Wave 2 if careful about UUID dependencies.
   - Recommendation: Split into two migrations (926 reconcile / 927 roster). District 4+5 UUIDs are generated at INSERT time in 926 and needed in 927 — SQL can capture them with `RETURNING id` into a CTE.

2. **Photo identity verification for Martin and Canales DB entries?**
   - What we know: Both rows were in the DB pre-Phase 147; Martin has press_use license which suggests it was sourced correctly; Canales photo may be Torres.
   - What's unclear: Definitive visual confirmation of who appears in each photo.
   - Recommendation: Planner adds visual-confirm task in Wave 3 before any upload; if Canales photo is Torres, source new photo from campaign site.

3. **Lustro's departure date from D5?**
   - What we know: He's NOT running in June 2026 primary; his term is 2022-2026.
   - What's unclear: Whether his seat is "officially vacant" in any way before November 2026 or whether he continues seated until the election.
   - Recommendation: Seat Lustro as the current active D5 member. Stance research should note his term is ending; do not exclude him — he still represents District 5 and his record is relevant.

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: LA County Registrar results page lavote.gov/text-results/4324] — Nov 2024 election: Martin D1 (58.54%), Ontiveros-Cole D4 (54.54%), Canales D6 (53.79%), Sandoval Mayor (53%)
- [VERIFIED: DB live query 2026-06-20] — gov UUID 3c2c2a4b, geo_id=NULL, 2 chambers, 6 offices, district UUIDs, 3 broken bidirectional links, -700658 free, all 0 stances
- [VERIFIED: pomonachoiceenergy.org/about/leadership/ raw HTML 2026-06-20] — Full roster with 2020 CivicPlus photo URLs; alt text confirms identity for Sandoval/Garcia/Preciado/Lustro/Ontiveros-Cole; reveals 2025 "new member" photos are stale (Torres/Gonzalez)
- [VERIFIED: HTTP 200 probe 2026-06-20] — All 7 PCE 2020 photo URLs accessible; all pomonaca.gov paths return HTTP 403
- [VERIFIED: Storage HTTP 200 2026-06-20] — Canales, Martin, Preciado existing headshots in Supabase Storage accessible
- [VERIFIED: Pillow 2026-06-20] — Canales 469×469 PNG, Martin 1280×1700 JPEG, Preciado 150×150 PNG; PCE 2020 photos 172×230

### Secondary (MEDIUM confidence)
- [CITED: WebSearch result — pomonaca.gov elections information] — "Mayor at-large + 6 district councilmembers; Mayor elected every 4 years; council elections staggered"
- [CITED: thepomonan.com primary results + MSN June 2026 results article] — June 2026 primary D2/D3/D5 results; Lustro not on ballot
- [CITED: lapublicpress.org / caanet.org rent control coverage] — Nov 17 2025 RSO vote 5-1; per-member positions identified (partial confirmation)
- [CITED: noraforpomona.com/about] — Garcia: housing affordability, warehouse zoning ban, anti-outsourcing
- [CITED: pomonaca.gov/government/departments/city-attorney (confirmed by search)] — City Attorney appointed; Best Best & Krieger LLP
- [CITED: Steve Lustro Ballotpedia + "Friends of Steve Lustro 2022" campaign finance] — D5, re-elected 2022, term 2022-2026

### Tertiary (LOW confidence)
- [ASSUMED] Steve Lustro is still seated through 2026 (term-limited, not resigned/removed) — consistent with 2022 re-election + no news of departure
- [ASSUMED] Martin (ext_id 675752) is the correct Debra Martin who won D1 in Nov 2024 — consistent with press_use license on her photo
- [ASSUMED] Pomona has no term-limits preventing current members from being unseated mid-term — standard CA council procedure

---

## Metadata

**Confidence breakdown:**
- Roster (7 members, district mapping, DB UUIDs): HIGH — DB-verified + election results confirmed
- Form of government (council-manager, directly-elected Mayor): HIGH — multiple official sources
- DB state (chambers, districts, offices, bidirectional links): HIGH — live DB query 2026-06-20
- Headshot sources (WAF-blocked, alternative sources): HIGH for WAF status; MEDIUM for alternative source quality
- Stance evidence map: MEDIUM — news coverage patterns; individual vote confirmation needed at Legistar
- Ontiveros-Cole identity (-700658, no existing real politician row): HIGH — DB query confirmed no real row exists

**Research date:** 2026-06-20
**Valid until:** 2026-11-30 (Pomona Nov 2026 election will affect D2/D3/D5; current seating stable until election results certify)
