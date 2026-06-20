# Phase 148: Torrance Deep-Seed — Research

**Researched:** 2026-06-20
**Domain:** Torrance, CA city council reconcile + complete + headshots + evidence-only stances
**Confidence:** HIGH (DB state DB-verified 2026-06-20; city website NO WAF confirmed; government structure confirmed via multiple sources; roster + June 2026 election results confirmed via Torrance Watch unofficial returns)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TORR-01 | Torrance (0680000) deep-seeded — government + roster + headshots + evidence-only stances | Duplicate-chamber partial seed confirmed; by-district + directly-elected mayor structure verified; **NO WAF** on torranceca.gov (all 7 council headshots + clerk + treasurer headshots curl-accessible); 0 stances DB-verified (full research needed); June 2026 election turnover (Kalani wins Mayor, Lieu wins D5 open seat) documented and must be modeled; stance evidence map provided |
</phase_requirements>

---

## Summary

Phase 148 is a reconcile+complete of a partial, structurally-defective Torrance seed, following the same LA County Wave-2 playbook as Phases 143-147. Torrance shares the key structural features of Pomona: (1) a **directly-elected citywide Mayor** (Lancaster/Pomona LOCAL_EXEC model — already correctly modeled in DB as "Torrance Mayor" LOCAL_EXEC district), and (2) **six council districts** (D1-D6) with a separately-elected at-large Mayor.

The DB state is very similar to Pomona: 7 officials exist across two duplicate chambers, but with two important distinctions — (a) **Brigitte Lewis (-201101)** in the doomed chamber is a **duplicate/typo row** for the same person as **Bridgett Lewis (683366)** in the survivor chamber (must DELETE the Brigitte row and her office, not move them), and (b) Mattucci, Sheikh, and Chen in the doomed chamber all share a single At-Large district UUID (84e45ab7) — three offices on one district row, worse than Pomona's two-sharing-one. Additionally, the **June 2026 election (June 2, certifying June 26)** changes two positions: Sharon Kalani defeats incumbent Mayor George Chen, and Betty Lieu wins the open D5 seat vacated by Mattucci (who ran for City Treasurer, not re-election). This means Wave 2 must retire Chen and Mattucci, seat Lieu as new D5, and handle Kalani's transition from D4 councilmember to Mayor — while also handling a vacant D4 seat whose replacement is not yet determined.

The headshot situation is the easiest of all Wave-2 cities so far: **torranceca.gov has NO WAF**. All 7 current council members (including the Mayor-elect Kalani and incoming D5 Lieu) have official portraits directly curl-accessible at `https://www.torranceca.gov/files/assets/city/v/2/government/elected-officials/{filename}.{png|jpg}` and `v/3/headshots/` variants. City Clerk (Poirier) and City Treasurer (Goodrich) — both elected — also have portraits there. The pre-existing DB headshots for Chen (18KB JPEG, too small) and Mattucci (8KB, too small) need replacement; Sheikh's existing 416KB headshot is good quality.

Stance evidence is available through Torrance Watch (torrancewatch.org), the Torrance city council agendas at torranceca.primegov.com (OneMeeting system, replacing Legistar as of Nov 1 2024), and Granicus-archived meeting documents. Key documented votes: Pride Month proclamation (May 7 2024, 4-3), Homekey+ hotel housing opposition (May 23 2025, unanimous-ish), anti-camping ordinance concurrence (Sept 9 2025, majority vs Kalani/others). Political alignment is well-documented: Chen/Mattucci/Kaji labeled "MAGA 3" by local Democratic Party; Kalani/Lewis/Sheikh/Gerson formed a reform coalition. Chen voted NO on Pride; Kalani voted YES.

**Primary recommendation:** Execute as 4 waves mirroring Pomona 147 — Wave 1 reconcile (geo_id + chamber merge [4 offices: move Chen+Sheikh, repurpose Mattucci's office for Lieu D5, DELETE Brigitte Lewis duplicate] + district relabels/creates), Wave 2 roster (retire Chen + seat Kalani as Mayor + create Betty Lieu D5 + bidirectional link repairs + official_count), Wave 3 headshots (7 officials + optionally Clerk/Treasurer, all NO-WAF curl-accessible), Wave 4 stances (7 officials, one at a time, non-judicial topics only).

**Scope decision on Clerk/Treasurer:** Rebecca Poirier (City Clerk) and Tim Goodrich (City Treasurer) are both ELECTED officials with official portrait pages on torranceca.gov. They are elected citywide positions, NOT council seats. Whether to include them in this phase is a planning decision — they have separate chambers needed (or can be deferred). **Recommendation:** Defer Clerk/Treasurer to a follow-on pass; focus this phase on the 7-member City Council (Mayor + 6 councilmembers) per the standard Wave-2 scope.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Government/chamber reconcile | Database / Storage | — | SQL migrations via psql + mcp__supabase-local; no frontend change |
| District relabeling (At-Large → D1-D6) + creation | Database | — | UPDATE 5 existing rows + INSERT 1 new row (District 5 for Lieu); no geofence work |
| Roster repair (bidirectional links) + turnover (Chen retire, Kalani Mayor, Lieu create) | Database | — | UPDATE politicians.office_id + retire Chen + INSERT Betty Lieu + offices |
| Mayor seat (LOCAL_EXEC) — already modeled | Database | — | "Torrance Mayor" district + title='Mayor' already exist; just merge Chen's office to survivor chamber; then swap Chen→Kalani |
| Duplicate person cleanup (Brigitte Lewis) | Database | — | DELETE politician -201101 + her office bf157ee7; NO stance/headshot data to lose |
| Headshot processing | Local Bash + Pillow | Supabase Storage | curl from torranceca.gov (NO WAF) → crop 4:5 → resize 600×750 Lanczos q90 → Storage upload → politician_images INSERT |
| Evidence-only stances | Research agent (one at a time) | Database | Agent mines sources; outputs SQL applied via psql |
| UI rendering | None (existing) | — | Torrance renders on existing browse/compass UI; Landing.jsx surfacing is Phase 157 |

---

## Live-Data Findings

### 1. Form of Government — CONFIRMED (HIGH confidence)

**Council-manager form of government.** Torrance is a charter city. The City Manager is the chief administrative officer.

**Directly-elected Mayor (at-large, 4-year term)**: The Mayor is elected by all registered voters of Torrance. This is the Lancaster/Pomona LOCAL_EXEC model — NOT the Glendale/Palmdale rotational council-selected model. [VERIFIED: torranceca.gov/government/about; torranceca.gov district-elections page: "one Mayor, who remains elected 'At-Large'"]

**Six by-district councilmembers**: Adopted 2018 (ordinance June 19, 2018). Districts 2, 4, 6 phased in 2020; Districts 1, 3, 5 phased in 2022. Each councilmember must live in and represents their district. [VERIFIED: torranceca.gov/government/city-council-and-elected-officials/district-elections]

**No judicial topics**: The City Attorney is an appointed position (not elected). From torranceca.gov/government/city-attorney: "appointed by the City Council." NOT elected. [VERIFIED: torranceca.gov city attorney pages + search results confirming appointed status]

**Elected Clerk and Treasurer (OUT OF SCOPE for this phase)**: Rebecca Poirier (City Clerk, first elected 2014) and Tim Goodrich (City Treasurer, elected 2022) are both elected citywide positions. They exist on separate areas of torranceca.gov with individual profile pages. They are NOT part of the City Council chamber. **Deferred:** Include in a Torrance follow-on phase or when a Clerk/Treasurer chamber model is established. Do not add them to the City Council chamber.

### 2. Council Structure — CONFIRMED (HIGH confidence, 2026-06-20)

**7 elected officials in City Council scope: 1 directly-elected Mayor (citywide) + 6 district councilmembers (D1-D6).** 4-year terms. Council elections staggered: D2/D4/D6 cycle together (last D2/D4 elected 2024; Kalani re-elected D4 2024); D1/D3/D5 cycle together (last elected 2022; D1/D3 re-elected June 2026; D5 open seat June 2026). Mayor on its own cycle: Chen elected 2022, now defeated by Kalani June 2026. [VERIFIED: torranceca.gov/government/city-council-and-elected-officials/district-elections; Torrance Watch 2026 results]

### 3. June 2026 Election Results — CONFIRMED UNOFFICIAL (HIGH confidence pending June 26 certification)

**Results as of 2026-06-20 (unofficial, certifying June 26, 2026):**

| Race | Winner | Loser | Vote Share |
|------|--------|-------|-----------|
| Mayor | **Sharon Kalani** (Challenger) | George Chen (Incumbent) | 51% Kalani / 49% Chen |
| D1 | **Jon Kaji** (Incumbent) | David Kartsonis | Re-elected |
| D3 | **Asam Sheikh** (Incumbent) | Mike Mauno | Re-elected |
| D5 | **Betty Lieu** (Open Seat) | Michelle K. Brooks + Harry Ward MD | 68% Lieu |
| City Treasurer | **Mike Griffiths** | Aurelio Mattucci + Charles Deemer | Open seat (Goodrich not running) |

[VERIFIED: Torrance Watch torrancewatch.org 2026 election results page, checked 2026-06-20; unofficial counts confirmed by WebSearch cross-check]

**Key roster changes from this election:**
1. **George Chen (Mayor, -201036)**: LOSES. Must be RETIRED from the Mayor office.
2. **Sharon Kalani (D4, 683370)**: WINS Mayor race. Must be MOVED from her D4 Council Member office to the Mayor (LOCAL_EXEC) office.
3. **Aurelio Mattucci (D5, -201103)**: Left council to run for Treasurer (LOST Treasurer race). D5 office VACANT for incoming Lieu.
4. **Betty Lieu**: NEW politician, does not exist in DB. Must be CREATED at ext_id -700659 and seated in D5.
5. **D4 seat**: VACANT after Kalani vacates to become Mayor. **Replacement TBD** — by appointment or special election. DO NOT seed a D4 council member; leave the D4 office without a politician_id for now.

### 4. Current Elected Roster (post-June-2026 election) — CONFIRMED

| Role | Member | ext_id (DB) | politician_id (DB) | Chamber | Status |
|------|--------|-------------|---------------------|---------|--------|
| Mayor (at-large) | Sharon Kalani | 683370 | 0695e308-a400-426d-9f1b-4e674e5daf02 | B (survivor → LOCAL_EXEC) | EXISTS in B as D4; move to LOCAL_EXEC Mayor role |
| D1 Council Member | Jon Kaji | 683364 | e9af3b91-ab9c-4f97-bc18-c1baef871e85 | B (survivor) | EXISTS; link OK |
| D2 Council Member | Bridgett Lewis | 683366 | 9e24181e-f5e5-477f-a6e0-94a007b6b3a0 | B (survivor) | EXISTS; link OK |
| D3 Council Member | Asam Sheikh | -201102 | 9ac3ac10-0177-40fd-8887-72d90ed396ed | A (doomed → move to B) | EXISTS in A; link BROKEN |
| D4 Council Member | **VACANT** (Kalani vacates to become Mayor) | — | — | B (survivor) | TBD — appointment/special election |
| D5 Council Member | Betty Lieu | **-700659 (NEW)** | CREATE | B (survivor) | Does NOT exist in DB |
| D6 Council Member | Jeremy Gerson | 683376 | d8767eea-759a-4298-9e3b-089659d15732 | B (survivor) | EXISTS; link OK |

**Officials being retired from their current offices:**
- George Chen (-201036, politician_id 3dfd7349): Mayor → RETIRE (mark is_incumbent=false; unlink from Mayor office)
- Aurelio Mattucci (-201103, politician_id 2b4b35a8): D5 council member → RETIRE

**Duplicate row to DELETE:**
- Brigitte Lewis (-201101, politician_id 7f74014f): Typo duplicate of Bridgett Lewis (683366). Has 0 stances, 0 headshots. DELETE politician row + DELETE her office (bf157ee7). Do NOT move.

### 5. DB State Verification (live 2026-06-20) — COMPLETE

| Element | Value | Notes |
|---------|-------|-------|
| gov id | b3e97e65-2b89-4594-b38e-65c531fa801c | Name: "City of Torrance, California, US" |
| gov geo_id | NULL (empty string) | Needs backfill to '0680000' |
| gov state | CA | Already correct |
| Chamber A (doomed) | 2583b565-7f75-4e32-b150-24db4792ea51 | official_count=NULL; 4 offices: Chen/Mayor(LOCAL_EXEC), Brigitte Lewis(At-Large), Mattucci(At-Large), Sheikh(At-Large) |
| Chamber B (survivor) | f6fcb0ba-bc72-4176-9ca3-dc6c9973301d | official_count=7 (stale); 4 offices: Gerson, Kaji, Kalani, Bridgett Lewis |
| District rows | 6 total: 5 At-Large (LOCAL) + 1 "Torrance Mayor" (LOCAL_EXEC) | All have geo_id='0680000', state='CA' |
| Shared district (PROBLEM) | 84e45ab7: SHARED by Brigitte Lewis (bf157ee7), Mattucci (220e2cb5), AND Sheikh (0542b22b) | THREE offices sharing one district UUID |
| Brigitte Lewis duplicate | politician 7f74014f (-201101) + office bf157ee7 | Typo of Bridgett Lewis (683366); 0 stances, 0 headshots; DELETE both |
| Betty Lieu | NOT in politicians table | Must CREATE at ext_id -700659 + office + district |
| Bidirectional links | Sheikh=BROKEN (NULL office_id), Chen=BROKEN, Mattucci=BROKEN; Kaji=OK, Lewis/Bridgett=OK, Kalani=OK, Gerson=OK | 3 broken links |
| Existing headshots | Chen: 18KB JPEG (too small); Sheikh: 416KB (good); Mattucci: 8KB (too small) | Chen/Mattucci need replacement; Gerson/Kaji/Kalani/Lewis: NO headshot |
| Stances | 0 for all 8 DB politicians | Full research needed |
| schema_migrations MAX | 927 | Confirmed live 2026-06-20 |
| on-disk migration files MAX | 877 (supabase/migrations dir) | Wave-2 phases use EV-Accounts/backend/migrations + apply via mcp__supabase-local |
| Next structural migration | **936** | Per STATE.md (925 Palmdale audit-only, 926/927 Pomona structural) |
| ext_id -700659 | FREE | Confirmed: highest -700xxx used is -700658 (Ontiveros-Cole, Pomona) |

### 6. District UUID Mapping and Reconcile Plan (HIGH confidence)

The 5 existing At-Large district UUIDs map to offices as follows (verified by joining offices → districts):

| District UUID | Current occupant office(s) | Correct label | Action |
|---------------|---------------------------|---------------|--------|
| 302ce5a0-7d1c-47f5-9d38-4029c04e902e | Kaji (8391fb00) in Chamber B | "District 1" | Relabel |
| 738b8cd8-5fe8-442b-8371-74f6781072aa | Bridgett Lewis (95879f8c) in Chamber B | "District 2" | Relabel |
| 84e45ab7-b30f-44ad-b379-b83dc6cedb8f | SHARED: Brigitte Lewis (bf157ee7, DELETE) + Mattucci (220e2cb5, repurpose for Lieu D5) + Sheikh (0542b22b, move to B) | "District 3" (Sheikh) | Relabel; then repoint Mattucci's office to new D5 UUID; then Brigitte Lewis office is DELETEd |
| 91e386c4-4562-4a56-bc36-cf3e15cbf581 | Kalani (143f683f) in Chamber B | "District 4" | Relabel (Kalani vacates; office will be unlinked from Kalani in Wave 2) |
| 95177e7e-78e2-4139-a82b-9469bbcb7965 | Gerson (7f596dd4) in Chamber B | "District 6" | Relabel |
| a99b86b0-9025-4e4a-b037-017f8cfc607c | Chen (c5b5b1b3) Mayor/LOCAL_EXEC in Chamber A | "Torrance Mayor" (LOCAL_EXEC) | KEEP as-is; move Chen's office from A to B; then in Wave 2 swap politician to Kalani |
| (NEW) | Betty Lieu (new) | "District 5" | CREATE (LOCAL, geo_id='0680000', state='CA'); repurpose Mattucci's old office for Lieu |

**Total final districts for Torrance: 7 rows** — "Torrance Mayor" (LOCAL_EXEC) + "District 1" through "District 6" (all LOCAL).

**Key difference from Pomona:** No new district 4 needs creating (it already exists as 91e386c4, just relabeled). The only NEW district row needed is "District 5" for Lieu (replacing the shared district currently used by Mattucci's office).

### 7. Headshot Sources and Status — CONFIRMED (HIGH confidence)

**torranceca.gov: NO WAF — all images directly curl-accessible (HTTP 200).**

Image URL patterns:
- `/files/assets/city/v/2/government/elected-officials/{filename}.{png|jpg}` — council members
- `/files/assets/city/v/3/headshots/{filename}.{png|jpg}` — council members (alternate path)
- `/files/assets/city/v/2/headshots/{filename}.{png|jpg}` — Clerk/Treasurer

| Member | Official Portrait URL | File Size | DB Headshot? | Action |
|--------|----------------------|-----------|--------------|--------|
| Sharon Kalani (new Mayor) | `…/20251712-headshot-sharon-kalani-001.jpg` | 333KB | YES (old small; will need canonical path update) | Download → crop 4:5 → 600×750 → upload canonical |
| Jon Kaji (D1) | `…/20251312-headshot-jon-kaji-001.jpg` | 285KB | NO | Download → crop → resize → upload |
| Bridgett Lewis (D2) | `…/20251312-headshot-bridgett-lewis-001.png` | 2.3MB | NO | Download → crop → resize → upload |
| Asam Sheikh (D3) | `…/20251712-headshot-asam-sheikh-001.jpg` | 416KB | YES (good quality) | Verify dimensions; reprocess to 600×750 canonical if needed |
| Betty Lieu (D5, new) | Need to find URL (not yet on city site as council member) | — | NO | See below |
| Jeremy Gerson (D6) | `…/20251216-headshot-jeremy-gerson-001.png` | 113KB | NO | Download → crop → resize → upload |
| George Chen (RETIRING Mayor) | `…/20251125-headshot-mayor-george-chen-001.jpg` | 289KB | YES (18KB JPEG — too small/old, cc_by_sa_4.0) | Chen is being retired; do NOT upload new photo; leave DB row as-is or skip |

**Betty Lieu headshot situation:**
Betty Lieu is newly-elected (June 2026) and has no page on torranceca.gov yet (not yet sworn in). Sources to check:
1. Torrance Unified School District — Lieu has been a TUSD board member since 2018; TUSD likely has her photo
2. Her campaign/personal website
3. Ballotpedia
4. LinkedIn
5. checkpoint:human-verify if no source found before certification

**Canonical headshot path for all new uploads**: `politician_photos/{politician_uuid}-headshot.jpg` with type='default', license=press_use.

**Existing DB headshots to assess:**
- Sheikh (9ac3ac10-0177-40fd-8887-72d90ed396ed-headshot.jpg, 416KB): Good quality — verify dimensions; if already 600×750, keep; otherwise reprocess.
- Chen (3dfd7349-e0e2-486d-8767-8dfc203ca986/default.jpeg, 18KB, cc_by_sa_4.0): Tiny — Chen is retiring; leave as-is. No new upload needed for a retiring official.
- Mattucci (2b4b35a8-1498-46ad-aa9b-04650b454262-headshot.jpg, 8KB): Tiny — Mattucci is retiring; leave as-is.
- Kalani (683370 politician_images): Has a row but need to check if it needs updating. New official portrait from torranceca.gov is 333KB — good quality replacement.

### 8. Stance Evidence Map

**Local evidence sources:**
- `torranceca.primegov.com` — OneMeeting system; Torrance council agendas + minutes from Nov 1, 2024 onward. Prior records in Granicus (`torrance.granicus.com`).
- `torrancewatch.org` — Nonpartisan civic reference; individual candidate pages document key votes with citations. **Excellent per-member documented votes.**
- `davisvanguard.org` — Covered anti-camping ordinance Sept 2025
- Official torranceca.gov news releases (torranceca.gov/Home/Components/News)
- `rafu.com` — Rafu Shimpo, covered 2026 council race

**Key documented votes (compass-mappable):**

| Vote | Date | Outcome | Chen | Kalani | Kaji | Sheikh | Lewis | Gerson | Mattucci |
|------|------|---------|------|--------|------|--------|-------|--------|----------|
| Pride Month proclamation | May 7, 2024 | 4-3 YES | NO | YES | TBD | YES | YES | YES | NO |
| Homekey+ hotel housing opposition | May 23, 2025 | Unanimous | YES | YES | YES | YES | YES | YES | YES |
| Anti-camping ordinance concurrence | Sept 9, 2025 | Majority | YES | NO | TBD | YES | TBD | TBD | YES (introduced) |
| Airport landing ban | Jan 23, 2024 | 5-1 YES | NO | YES | TBD | TBD | TBD | TBD | TBD |

Sources: [CITED: torrancewatch.org/races/2026/mayor — Chen vs Kalani vote comparison; CITED: torrancewatch.org/races/2026/district-3 — Sheikh voting record; CITED: WebSearch davisvanguard.org + WebSearch for Council votes]

**Per-member stance evidence preview:**

| Member | Evidence Expectation | Key Topics |
|--------|---------------------|------------|
| Sharon Kalani (new Mayor, was D4) | STRONG — seated 2020, re-elected 2024; just won mayor race; extensive campaign record; documented votes | housing, homelessness-response (anti-camping NO), lgbtq-rights, local-environment, public-safety-approach |
| Jon Kaji (D1) | MODERATE — seated 2022; opposition to homeless hotel project documented; finance-focused record | housing, homelessness, growth-and-development, economic-development |
| Bridgett Lewis (D2) | MODERATE — seated 2022; part of Kalani/Lewis/Sheikh/Gerson reform coalition; limited separate vote documentation | homelessness, lgbtq-rights (implied YES on Pride), public-safety-approach |
| Asam Sheikh (D3) | STRONG — seated 2022, re-elected 2026; Pride YES documented; anti-camping YES documented; extensive endorsements | lgbtq-rights, homelessness-response, public-safety-approach, housing |
| Betty Lieu (D5, new) | LOW-MODERATE — new to council; TUSD board background; limited city-council-level record | education (TUSD perspective may inform), housing, local-environment |
| Jeremy Gerson (D6) | MODERATE — seated 2022; part of reform coalition; limited individual documentation found | homelessness, lgbtq-rights (implied YES on Pride) |

**Topics with evidence at Torrance city council level:**
- `lgbtq-rights` (check live topic UUID): STRONG — Pride proclamation May 2024 (4-3 vote) maps directly; Chen=NO, Kalani/Sheikh=YES
- `homelessness` (4938766b or check): STRONG — Homekey+ hotel opposition; anti-camping ordinance
- `homelessness-response` (6fbf39ae): STRONG — anti-camping ordinance (enforcement vs services debate)
- `housing` (669cac97): STRONG — RHNA 4,928 units; housing element; Homekey+ opposition
- `public-safety-approach` (e9ebefcd): MEDIUM — enforcement approach; TPOA endorsements (Kaji); Mattucci introduced military-camp proposal
- `residential-zoning` (d4f18138): MEDIUM — RHNA housing density; housing element
- `growth-and-development` (fb25c1ac): MEDIUM — El Camino Village annexation (Kaji initiated); development patterns
- `local-environment` (1935979c): MEDIUM — Torrance Refining Company (HF acid hazard, fenceline monitoring); active community advocacy
- `economic-development` (eb3d1247): LOW-MEDIUM — Sister Cities (Chen championed; Kalani opposed); El Camino Village
- `transportation-priorities` (ba59337e): LOW — Metro C Line extension; airport landing ban (Chen NO, Kalani YES)

Topics expected to be blank for most members: `abortion`, `trans-athletes`, `same-sex-marriage`, `school-vouchers`, `voting-rights`, `social-security`, `medicare/aid`, `redistricting`, `taxes` (state-level), `fossil-fuels`, `ukraine-support`, `tariffs`, `ai-regulation`, `childcare`, `religious-freedom`, `campaign-finance`, `data-centers`, `civil-rights`, `immigration` (state/federal), `deportation`, `climate-change` (state-level), `rent-regulation` (not a Torrance issue — no RSO exists here).

**Judicial topics — ALL EXCLUDED**: Torrance is council-manager with appointed City Attorney. Not elected. No judicial topics apply. [VERIFIED: torranceca.gov/government/city-attorney confirms appointed status]

**Research order for Wave 4 stances (most-documented first):**
Kalani → Sheikh → Chen (retiring but has long record worth capturing) → Kaji → Lewis → Gerson → Lieu (new, limited record)

---

## Architecture Patterns

### Recommended Wave Structure

```
Wave 1 — Reconcile (structural, registers in schema_migrations)
  Migration 936:
  ├── UPDATE governments SET geo_id='0680000' WHERE id='b3e97e65-...' AND geo_id IS NULL (or = '')
  ├── DELETE the duplicate "Brigitte Lewis" politician and her office FIRST:
  │   DELETE FROM essentials.offices WHERE id='bf157ee7-...'  (Brigitte's office in doomed A)
  │   DELETE FROM essentials.politicians WHERE id='7f74014f-...'  (Brigitte Lewis -201101)
  ├── MOVE 2 offices from A to B (Chen/Mayor + Sheikh; Mattucci's office stays in A for now to repurpose):
  │   UPDATE offices SET chamber_id='f6fcb0ba-...' WHERE id IN ('c5b5b1b3-...', '0542b22b-...')
  ├── REPOINT Mattucci's office to new District 5 UUID THEN MOVE to Chamber B:
  │   INSERT INTO districts (label='District 5', district_type='LOCAL', geo_id='0680000', state='CA') RETURNING id;
  │   UPDATE offices SET district_id='<new-d5-uuid>', chamber_id='f6fcb0ba-...' WHERE id='220e2cb5-...'
  ├── Assert Chamber A has 0 offices, then DELETE Chamber A:
  │   DO $$ assert count=0 $$ DELETE FROM essentials.chambers WHERE id='2583b565-...'
  ├── Relabel 5 At-Large district rows:
  │   UPDATE districts SET label='District 1' WHERE id='302ce5a0-...'  (Kaji)
  │   UPDATE districts SET label='District 2' WHERE id='738b8cd8-...'  (Lewis/Bridgett)
  │   UPDATE districts SET label='District 3' WHERE id='84e45ab7-...'  (Sheikh)
  │   UPDATE districts SET label='District 4' WHERE id='91e386c4-...'  (Kalani seat, vacating)
  │   UPDATE districts SET label='District 6' WHERE id='95177e7e-...'  (Gerson)
  └── Register in schema_migrations as version=936

Wave 2 — Roster (structural, registers in schema_migrations)
  Migration 937:
  ├── RETIRE George Chen:
  │   UPDATE essentials.politicians SET is_incumbent=false WHERE id='3dfd7349-...'
  │   UPDATE essentials.offices SET politician_id=NULL WHERE id='c5b5b1b3-...'  (Mayor office)
  ├── MOVE Kalani to Mayor office (LOCAL_EXEC):
  │   UPDATE essentials.offices SET politician_id='0695e308-...' WHERE id='c5b5b1b3-...'
  │   UPDATE essentials.politicians SET office_id='c5b5b1b3-...' WHERE id='0695e308-...'
  │   UPDATE essentials.offices SET title='Mayor' WHERE id='c5b5b1b3-...'  (confirm title)
  │   UPDATE essentials.offices SET politician_id=NULL WHERE id='143f683f-...'  (D4 seat vacated by Kalani)
  ├── RETIRE Aurelio Mattucci:
  │   UPDATE essentials.politicians SET is_incumbent=false WHERE id='2b4b35a8-...'
  │   UPDATE essentials.offices SET politician_id=NULL WHERE id='220e2cb5-...'  (D5 office, repurposed for Lieu)
  ├── REPAIR broken bidirectional link — Sheikh:
  │   UPDATE essentials.politicians SET office_id='0542b22b-...' WHERE id='9ac3ac10-...'
  ├── CREATE Betty Lieu politician (external_id=-700659, is_active=true):
  │   INSERT INTO essentials.politicians (first_name, last_name, external_id, is_active, is_incumbent, is_appointed_position)
  │   VALUES ('Betty', 'Lieu', -700659, true, true, false)
  ├── SET Lieu in D5 office:
  │   UPDATE essentials.offices SET politician_id='<new-lieu-uuid>' WHERE id='220e2cb5-...'
  │   UPDATE essentials.politicians SET office_id='220e2cb5-...' WHERE external_id=-700659
  ├── UPDATE official_count: UPDATE essentials.chambers SET official_count=7 WHERE id='f6fcb0ba-...'
  │   (7 = Mayor Kalani + D1 Kaji + D2 Lewis + D3 Sheikh + D4 [vacant] + D5 Lieu + D6 Gerson)
  │   NOTE: official_count=7 is correct even with D4 vacant (still 7 total seats)
  └── Register in schema_migrations as version=937

Wave 3 — Headshots (audit-only, NOT registered in schema_migrations)
  Migration 938 (audit-only):
  ├── Kalani: curl from torranceca.gov (kalani 333KB jpg) → crop 4:5 → 600×750 → upload canonical
  ├── Kaji: curl from torranceca.gov (kaji 285KB jpg) → crop 4:5 → 600×750 → upload
  ├── Lewis: curl from torranceca.gov (lewis 2.3MB png) → crop 4:5 → 600×750 → upload
  ├── Sheikh: assess existing DB headshot (416KB); if already 600×750 + press_use + canonical path, keep; else reprocess
  ├── Lieu: checkpoint:human-verify (not yet on torranceca.gov; check TUSD site/campaign site)
  ├── Gerson: curl from torranceca.gov (gerson 113KB png) → crop 4:5 → 600×750 → upload
  ├── Chen: SKIP (retiring; existing 18KB DB headshot may stay; no need for new upload)
  ├── Mattucci: SKIP (retiring; existing 8KB DB headshot may stay)
  └── All new uploads: type='default', press_use, canonical path {uuid}-headshot.jpg

Wave 4 — Stances (audit-only, NOT registered; one agent per official)
  Migrations 939–945 (approx; planner assigns):
  ├── Kalani (D4→Mayor, seated 2020, strong documented record)
  ├── Sheikh (D3, seated 2022, re-elected 2026, strong endorsements + documented votes)
  ├── Chen (Mayor retiring, long record 2018–2026, NO on Pride/anti-camping-ish, refinery)
  ├── Kaji (D1, seated 2022, moderate documentation)
  ├── Lewis (D2, seated 2022, reform coalition, limited individual documentation)
  ├── Gerson (D6, seated 2022, reform coalition, limited individual documentation)
  └── Lieu (D5, new June 2026; TUSD board background; limited city council record — likely few stances)
```

### SQL Patterns (carry from Pomona 926/927 exactly, with Torrance UUIDs)

**geo_id backfill (note: geo_id may be empty string '' not NULL — use both guards):**
```sql
UPDATE essentials.governments
SET geo_id = '0680000'
WHERE id = 'b3e97e65-2b89-4594-b38e-65c531fa801c'
AND (geo_id IS NULL OR geo_id = '');
```

**Delete Brigitte Lewis duplicate (BEFORE move-then-delete):**
```sql
-- Delete Brigitte Lewis duplicate office (Chamber A, doomed) FIRST
DELETE FROM essentials.offices WHERE id = 'bf157ee7-0229-4ab2-98ce-3e5e004f7a20';
-- Then delete the duplicate politician row (no stances or images to orphan)
DELETE FROM essentials.politicians WHERE id = '7f74014f-1a20-4f11-a00d-28b12135d18d';
```

**Move-then-delete (2 offices moved, 1 repurposed with district change):**
```sql
-- Create District 5 FIRST (needed for Mattucci's office repoint)
INSERT INTO essentials.districts (label, district_type, geo_id, state)
VALUES ('District 5', 'LOCAL', '0680000', 'CA')
RETURNING id;  -- capture this UUID for the next UPDATE

-- Move Chen's Mayor office and Sheikh's office from A to B
UPDATE essentials.offices
SET chamber_id = 'f6fcb0ba-bc72-4176-9ca3-dc6c9973301d'
WHERE id IN (
  'c5b5b1b3-6e68-41a0-9722-b02d9e1e34f3',  -- Chen/Mayor (LOCAL_EXEC)
  '0542b22b-61e1-4a3d-be3c-104a33252d21'   -- Sheikh D3
);

-- Repoint Mattucci's office to District 5 AND move to Chamber B (now repurposed as D5)
UPDATE essentials.offices
SET district_id = '<new-district-5-uuid>',
    chamber_id  = 'f6fcb0ba-bc72-4176-9ca3-dc6c9973301d'
WHERE id = '220e2cb5-f268-423a-b9a8-2f187f94d9b5';

-- Assert 0 offices remain in Chamber A
DO $$ BEGIN
  IF (SELECT COUNT(*) FROM essentials.offices WHERE chamber_id = '2583b565-7f75-4e32-b150-24db4792ea51') > 0
  THEN RAISE EXCEPTION 'Chamber A still has offices — ABORT';
  END IF;
END $$;

-- Delete Chamber A
DELETE FROM essentials.chambers WHERE id = '2583b565-7f75-4e32-b150-24db4792ea51';
```

**District relabeling (5 rows):**
```sql
UPDATE essentials.districts SET label = 'District 1' WHERE id = '302ce5a0-7d1c-47f5-9d38-4029c04e902e';
UPDATE essentials.districts SET label = 'District 2' WHERE id = '738b8cd8-5fe8-442b-8371-74f6781072aa';
UPDATE essentials.districts SET label = 'District 3' WHERE id = '84e45ab7-b30f-44ad-b379-b83dc6cedb8f';
UPDATE essentials.districts SET label = 'District 4' WHERE id = '91e386c4-4562-4a56-bc36-cf3e15cbf581';
UPDATE essentials.districts SET label = 'District 6' WHERE id = '95177e7e-78e2-4139-a82b-9469bbcb7965';
```

**Retire Chen + Move Kalani to Mayor (Wave 2):**
```sql
-- Retire Chen (strip politician from Mayor office; mark not incumbent)
UPDATE essentials.offices SET politician_id = NULL
WHERE id = 'c5b5b1b3-6e68-41a0-9722-b02d9e1e34f3';
UPDATE essentials.politicians SET is_incumbent = false, office_id = NULL
WHERE id = '3dfd7349-e0e2-486d-8767-8dfc203ca986';

-- Move Kalani into Mayor office (bidirectional)
UPDATE essentials.offices SET politician_id = '0695e308-a400-426d-9f1b-4e674e5daf02',
  title = 'Mayor'
WHERE id = 'c5b5b1b3-6e68-41a0-9722-b02d9e1e34f3';
UPDATE essentials.politicians SET office_id = 'c5b5b1b3-6e68-41a0-9722-b02d9e1e34f3'
WHERE id = '0695e308-a400-426d-9f1b-4e674e5daf02';

-- Vacate D4 council seat (Kalani left it)
UPDATE essentials.offices SET politician_id = NULL
WHERE id = '143f683f-96a8-4924-92fa-fbc6bc3444e9';
```

**Retire Mattucci + Create Betty Lieu D5 (Wave 2):**
```sql
-- Retire Mattucci
UPDATE essentials.politicians SET is_incumbent = false, office_id = NULL
WHERE id = '2b4b35a8-1498-46ad-aa9b-04650b454262';
UPDATE essentials.offices SET politician_id = NULL
WHERE id = '220e2cb5-f268-423a-b9a8-2f187f94d9b5';

-- Create Betty Lieu
INSERT INTO essentials.politicians
  (first_name, last_name, external_id, is_active, is_incumbent, is_appointed_position)
VALUES
  ('Betty', 'Lieu', -700659, true, true, false);

-- Seat Lieu in D5 office (bidirectional)
UPDATE essentials.offices
SET politician_id = '<new-lieu-politician-uuid>',
    title = 'Council Member'
WHERE id = '220e2cb5-f268-423a-b9a8-2f187f94d9b5';

UPDATE essentials.politicians
SET office_id = '220e2cb5-f268-423a-b9a8-2f187f94d9b5'
WHERE external_id = -700659;
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Duplicate-politician cleanup | New merge logic | Simple DELETE in migration order (office first, then politician) | Brigitte Lewis has 0 stances/images; straight DELETE is safe and idempotent |
| District relabeling | Complex migration | Simple UPDATE by UUID (5 rows) | Known UUIDs from DB-verified mapping |
| Three-sharing-one district fix | Complex reassignment | INSERT new D5 row FIRST, then UPDATE Mattucci's office district_id + chamber_id in same UPDATE | Sequential dependency; guarded with assert before chamber delete |
| Mayor transition (Chen→Kalani) | New mayor logic | NULL the politician_id on Mayor office, then set Kalani's politician_id there + vacate D4 | Proven bidirectional pattern; two separate UPDATEs with assert |
| Image crop/resize | Custom script | Reuse Lancaster/Palmdale/Pomona Pillow pipeline (4:5 crop FIRST → 600×750 Lanczos q90) | Tested across phases 142-147 |
| Storage upload | Custom HTTP | Supabase Python client with service-role key from C:/EV-Accounts/backend/.env | Proven across 142-147 |
| Headshot sourcing | Custom download | `curl -L "{url}" -o {filename}` (no WAF; direct HTTP 200 on all torranceca.gov portrait URLs) | Verified working 2026-06-20 |
| Stance SQL | New template | Copy 935_canales_stances.sql pattern exactly | Tested across 30+ officials |
| Compass topic lookup | Hardcode UUIDs | Always query WHERE is_live = true at apply time | 6 retired IDs exist; never hardcode |

---

## Common Pitfalls

### Pitfall 1: Treating Brigitte Lewis (-201101) as a real council member to MOVE (not DELETE)
**What goes wrong:** Planner sees 4 offices in Chamber A (Chen, Brigitte Lewis, Mattucci, Sheikh) and moves all 4 to Chamber B, ending up with two Lewis rows in the survivor chamber.
**Why it happens:** Prior phases (Pomona) moved all Chamber A offices. Torrance is different: "Brigitte Lewis" is a typo duplicate of "Bridgett Lewis" (683366) who is already correctly in Chamber B with a good bidirectional link.
**How to avoid:** Wave 1 MUST: (1) DELETE Brigitte Lewis's office (bf157ee7) AND politician row (7f74014f) FIRST, BEFORE any chamber moves. Then move Chen + Sheikh + repurpose Mattucci's office. The assert (0 offices in Chamber A) will pass after 3 items (not 4) are handled.
**Warning signs:** Post-Wave-1 SELECT showing two rows with last_name='Lewis' in the survivor chamber; or `official_count` being 8 instead of 7.

### Pitfall 2: Three offices sharing district 84e45ab7 — only fixing one
**What goes wrong:** Planner sees "At-Large → District 3" for Sheikh and updates only Sheikh's district. Mattucci's office still points at 84e45ab7 (now relabeled "District 3") and Brigitte Lewis's (deleted) office is cleaned up — but if done in wrong order, Mattucci's office ends up on "District 3".
**Why it happens:** In prior phases each office had its own distinct At-Large district. Here, three offices share UUID 84e45ab7. After relabeling to "District 3", Mattucci's D5 office (before being repurposed) incorrectly points at "District 3".
**How to avoid:** Wave 1 MUST: (1) CREATE District 5 FIRST, (2) UPDATE Mattucci's office to district_id=<new D5 UUID> AND chamber_id=<survivor> in same UPDATE, (3) THEN move Sheikh's office. Order: DELETE Brigitte → INSERT District 5 → UPDATE Mattucci's office (district_id + chamber_id) → UPDATE Chen's office (chamber_id) → UPDATE Sheikh's office (chamber_id) → assert Chamber A = 0 → DELETE Chamber A.
**Warning signs:** Post-Wave-1 SELECT showing Mattucci's (now repurposed) office with district_label='District 3'.

### Pitfall 3: Missing the June 2026 election turnover (treating pre-election roster as final)
**What goes wrong:** Planner seats George Chen as Mayor and Aurelio Mattucci as D5, as if the election did not happen. The data renders with stale officials.
**Why it happens:** The election was June 2 and certifies June 26 — still 6 days away. Chen and Mattucci still appear as current officials on the Chamber of Commerce site and older search results. A researcher who doesn't check the latest election results will miss the turnover.
**How to avoid:** Wave 2 MUST: retire Chen (Mayor, lost), retire Mattucci (D5, left council for Treasurer race), seat Kalani as Mayor (she vacates D4), create Betty Lieu for D5. D4 council seat is LEFT VACANT (no replacement yet determined).
**Warning signs:** Post-Wave-2 SELECT showing Chen with is_incumbent=true; or Mattucci with is_incumbent=true; or no Betty Lieu row in politicians.

### Pitfall 4: Using wrong Mayor model (rotational vs directly-elected)
**What goes wrong:** Planner models Kalani as Mayor by setting title='Mayor' on her D4 council seat (Glendale/Palmdale rotational model) instead of moving her to the LOCAL_EXEC Mayor office.
**Why it happens:** Glendale and Palmdale used the rotational-mayor model. Torrance is a directly-elected Mayor (Lancaster/Pomona model). The DB ALREADY has a correct "Torrance Mayor" LOCAL_EXEC district (a99b86b0) and a Mayor office (c5b5b1b3) — just like Pomona's pre-existing "Pomona Mayor" district.
**How to avoid:** Wave 2 MUST: NULL Kalani's D4 council office's politician_id; SET Kalani on the LOCAL_EXEC Mayor office (c5b5b1b3); SET her office_id back-pointer to the LOCAL_EXEC office. Do NOT set title='Mayor' on her D4 seat.
**Warning signs:** Any UPDATE setting title='Mayor' on office id 143f683f (the D4 seat) is a bug.

### Pitfall 5: Setting official_count to 6 (forgetting the vacant D4 seat)
**What goes wrong:** Planner counts seated officials post-Wave-2: Mayor Kalani + D1 Kaji + D2 Lewis + D3 Sheikh + D5 Lieu + D6 Gerson = 6 seated. Sets official_count=6.
**Why it happens:** D4 is vacant (no politician seated); planner counts only seated officials.
**How to avoid:** official_count tracks TOTAL SEATS, not filled seats. Torrance has 7 total positions (1 Mayor + 6 council). Set official_count=7 even with D4 vacant.
**Warning signs:** official_count=6 is wrong; correct value is 7.

### Pitfall 6: Chen's headshot license (cc_by_sa_4.0) — treating as press_use
**What goes wrong:** Executor notices Chen's existing headshot has license=cc_by_sa_4.0 and reasserts it as press_use.
**Why it happens:** All Wave-2 headshot migrations use press_use. But Chen's headshot was uploaded with a specific creative-commons license (possibly from Wikimedia) — changing it would misrepresent the actual license.
**How to avoid:** Chen is being retired. Do NOT upload a new headshot for Chen in Wave 3. Leave his existing DB row (18KB, cc_by_sa_4.0) unchanged. If the system displays Chen's photo anywhere, the license will remain correct.
**Warning signs:** Any INSERT/UPDATE to politician_images for politician_id '3dfd7349-...' (Chen) in Wave 3 is likely wrong.

### Pitfall 7: Betty Lieu headshot — she may not be on torranceca.gov yet
**What goes wrong:** Wave 3 tries to curl Betty Lieu's portrait from torranceca.gov and fails because she hasn't been sworn in yet (certification June 26, 2026).
**Why it happens:** All other officials have portraits on the official city site. Lieu's is there as TUSD board member but not yet as council member.
**How to avoid:** Include checkpoint:human-verify in Wave 3 for Lieu's headshot. First try TUSD's board page (she's been a board member since 2018). If not found, try her campaign website. Mark as honest gap if no source found by Wave 3 execution.
**Warning signs:** 404 on any torranceca.gov URL for a "Betty Lieu" council page before late June/early July 2026.

### Pitfall 8: Not capturing the geo_id empty-string case
**What goes wrong:** Migration 936 uses `WHERE geo_id IS NULL` but the DB has an empty string ('') not NULL for Torrance's geo_id. The UPDATE runs 0 rows affected.
**Why it happens:** Prior phases consistently had NULL. The DB query showed geo_id as blank (empty string) for Torrance.
**How to avoid:** Use `WHERE (geo_id IS NULL OR geo_id = '')` as the guard for the geo_id backfill UPDATE.
**Warning signs:** Post-migration SELECT on governments WHERE id='b3e97e65-...' still shows empty geo_id.

---

## Package Legitimacy Audit

Not applicable — this phase installs no new npm/Python packages. Uses existing Pillow + Supabase client proven in phases 142-147.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| psql | Migration apply | Yes | 18.1 | mcp__supabase-local execute_sql |
| Python Pillow | Headshot crop/resize | Yes (confirmed phases 142-147) | 10.x | pip install Pillow |
| curl | Headshot download | Yes | Bash tool | — |
| Supabase Storage | Headshot upload | Yes | Production | — |
| mcp__supabase-local | Migration apply + verification | Yes | Production | psql fallback |
| torranceca.gov | Official portraits | **AVAILABLE (HTTP 200, NO WAF)** | All 7 council images confirmed | None needed |
| TUSD board page | Betty Lieu headshot | Unknown — check at apply time | — | Campaign site; Ballotpedia; checkpoint:human-verify |

**Missing dependencies with no fallback:** None.

**Notes on torranceca.gov image access:**
- All 7 current council member images confirmed HTTP 200 at specific `/files/assets/city/...` URLs (verified 2026-06-20)
- Image sizes range 113KB to 2.3MB — all are usable quality for 600×750 output
- No WAF, no Cloudflare, no Akamai blocking on image paths (the main council pages do use Akamai for page delivery, but the `/files/` image paths are clean)
- Betty Lieu NOT YET on torranceca.gov council pages — handle with checkpoint

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
| TORR-01 | gov row has geo_id='0680000' | SQL assertion | `SELECT geo_id FROM essentials.governments WHERE id='b3e97e65-...'` = '0680000' | N/A |
| TORR-01 | Exactly 1 'City Council' chamber for Torrance | SQL assertion | `SELECT COUNT(*) FROM essentials.chambers WHERE government_id='b3e97e65-...'` = 1 | N/A |
| TORR-01 | 7 offices in survivor chamber | SQL assertion | `SELECT COUNT(*) FROM essentials.offices WHERE chamber_id='f6fcb0ba-...'` = 7 | N/A |
| TORR-01 | No split-section (feedback_section_split_check) | SQL assertion | Section split check query returns 0 rows for Torrance | N/A |
| TORR-01 | 5 district rows labeled District 1-4, 6 (LOCAL) | SQL assertion | `SELECT label FROM districts WHERE geo_id='0680000' AND district_type='LOCAL' ORDER BY label` = D1/D2/D3/D4/D5/D6 | N/A |
| TORR-01 | 1 LOCAL_EXEC district row ("Torrance Mayor") | SQL assertion | `SELECT COUNT(*) FROM districts WHERE geo_id='0680000' AND district_type='LOCAL_EXEC'` = 1 | N/A |
| TORR-01 | Brigitte Lewis duplicate deleted | SQL assertion | `SELECT COUNT(*) FROM politicians WHERE external_id=-201101` = 0 | N/A |
| TORR-01 | Sheikh bidirectional link repaired | SQL assertion | `SELECT office_id FROM politicians WHERE external_id=-201102` IS NOT NULL | N/A |
| TORR-01 | Kalani seated as Mayor (LOCAL_EXEC office) | SQL assertion | `SELECT p.last_name FROM politicians p JOIN offices o ON o.politician_id=p.id WHERE o.district_id='a99b86b0-...'` = 'Kalani' | N/A |
| TORR-01 | Chen retired (not incumbent) | SQL assertion | `SELECT is_incumbent FROM politicians WHERE external_id=-201036` = false | N/A |
| TORR-01 | Betty Lieu created and seated in D5 | SQL assertion | `SELECT COUNT(*) FROM politicians WHERE external_id=-700659` = 1; D5 office has politician_id | N/A |
| TORR-01 | D4 seat has NULL politician_id (vacant) | SQL assertion | `SELECT politician_id FROM offices WHERE id='143f683f-...'` IS NULL | N/A |
| TORR-01 | All active members have headshots | SQL assertion | `SELECT COUNT(DISTINCT pi.politician_id) FROM politician_images pi JOIN offices o ON o.politician_id=pi.politician_id WHERE o.chamber_id='f6fcb0ba-...'` = 6 (Lieu may be gap) | N/A |
| TORR-01 | 0 stance rows with judicial topic_ids | SQL assertion | Verify no judicial topic_ids in politician_answers for Torrance politicians | N/A |
| TORR-01 | 100% citation | SQL assertion | Every politician_answers row has matching politician_context row | N/A |

### Wave-by-Wave Verification Checks

**Wave 1 (reconcile):**
- `geo_id = '0680000'` on Torrance gov row (not empty, not NULL)
- `SELECT COUNT(*) FROM chambers WHERE government_id = 'b3e97e65-...'` = 1 (one chamber)
- `SELECT COUNT(*) FROM chambers WHERE id = '2583b565-...'` = 0 (doomed chamber gone)
- `SELECT COUNT(*) FROM offices WHERE chamber_id = 'f6fcb0ba-...'` = 7 (all 7 offices now in survivor)
- `SELECT COUNT(*) FROM politicians WHERE external_id = -201101` = 0 (Brigitte Lewis deleted)
- District labels: 302ce5a0='District 1', 738b8cd8='District 2', 84e45ab7='District 3', 91e386c4='District 4', 95177e7e='District 6'
- New District 5 row: `SELECT COUNT(*) FROM districts WHERE label='District 5' AND geo_id='0680000'` = 1
- Mattucci's (repurposed) office points at District 5: `SELECT d.label FROM offices o JOIN districts d ON d.id=o.district_id WHERE o.id='220e2cb5-...'` = 'District 5'
- `SELECT MAX(version) FROM supabase_migrations.schema_migrations` includes 936
- Section split check: 1 chamber for Torrance, 0 rows from split-section query

**Wave 2 (roster):**
- Kalani: `SELECT o.district_id FROM politicians p JOIN offices o ON o.politician_id=p.id WHERE p.external_id=683370` = 'a99b86b0-...' (LOCAL_EXEC Mayor district)
- Chen: `SELECT is_incumbent FROM politicians WHERE external_id=-201036` = false
- Mattucci: `SELECT is_incumbent FROM politicians WHERE external_id=-201103` = false
- Sheikh: `SELECT office_id FROM politicians WHERE external_id=-201102` IS NOT NULL
- Betty Lieu: `SELECT COUNT(*) FROM politicians WHERE external_id=-700659` = 1
- Betty Lieu: `politicians.office_id IS NOT NULL` for -700659
- D4 seat: `SELECT politician_id FROM offices WHERE id='143f683f-...'` IS NULL (vacant)
- `official_count = 7` on chamber f6fcb0ba
- `SELECT COUNT(*) FROM offices WHERE chamber_id='f6fcb0ba-...'` = 7
- `SELECT MAX(version) FROM supabase_migrations.schema_migrations` includes 937

**Wave 3 (headshots):**
- At least 6 of 7 active council members have politician_images rows with type='default'
  (Lieu may be gap — document honestly if no source found)
- All headshot Storage URLs return HTTP 200
- No 600×750 violations: verify dimensions on new uploads
- schema_migrations MAX unchanged (not registered)
- Chen's DB image row is unchanged (is_incumbent=false officials retain their photos)

**Wave 4 (stances):**
- All active members (Kalani, Kaji, Lewis, Sheikh, Lieu, Gerson) have stances > 0
  (Lieu may be very limited — honest blanks acceptable)
- Chen (retired but modeled): stances are for his historical record; apply if evidence found
- Mattucci (retired): stances apply if evidence found
- 0 rows with judicial topic_ids
- 0 rows with retired topic_ids
- 100% citation: every politician_answers row has matching politician_context row
- schema_migrations MAX unchanged

### Sampling Rate
- **Per task commit:** wave-level verification SELECT queries
- **Per wave merge:** full verification checklist above
- **Phase gate:** All assertions green before /gsd:verify-work

### Wave 0 Gaps
None — no new test infrastructure required. All verification is SQL assertions matching the established CA deep-seed pattern from phases 142-147.

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
| A1 | Sharon Kalani's June 2026 mayoral win is final — results certify June 26; as of June 20 she leads 51-49% | Live-Data §3 | If Chen somehow closes the gap and wins certification, Wave 2 must be rewritten; monitor June 26 certification before applying Wave 2 |
| A2 | Betty Lieu's D5 win (68%) is final | Live-Data §3 | 68% lead is decisive; risk of reversal is minimal but re-confirm before applying Wave 2 |
| A3 | D4 council seat will remain vacant until appointment/special election after Kalani vacates | Live-Data §3+§4 | If Torrance already filled D4 (unlikely — standard CA practice is council vote/appointment post-certification), would need a new member row |
| A4 | The existing Kalani DB row (683370, 0695e308-...) is the same Sharon Kalani who won the 2026 Mayor race | DB State §5 | High confidence — cross-referenced name, district D4 assignment, and election records; re-confirm at apply time |
| A5 | -700659 is the correct next external_id for Betty Lieu | DB State §5 | DB-verified as free 2026-06-20 (highest -700xxx used is -700658); re-confirm at apply time |
| A6 | The torranceca.gov image URLs remain accessible (no WAF added before Wave 3 execution) | Headshots §7 | If WAF added post-research, fall back to: Ballotpedia, campaign sites, checkpoint:human-verify |
| A7 | Betty Lieu's TUSD board page has an accessible headshot | Headshots §7 | Unverified — to check at apply time; honest gap documented if not found |
| A8 | Mattucci's old office (220e2cb5) can be cleanly repurposed for Betty Lieu D5 without DB side-effects | SQL Patterns | Standard pattern from Pomona; the office row is just updated with new district_id, chamber_id, and politician_id; no constraint violations expected |
| A9 | The City Attorney is still appointed (not elected) | Form of Gov §1 | Unlikely to have changed; confirmed by torranceca.gov city attorney page; re-confirm at apply time |
| A10 | Pride proclamation May 2024 vote: Chen=NO, Kalani=YES, Sheikh=YES (4-3) | Stance Evidence §8 | Confirmed from torrancewatch.org candidate pages with stated vote attributions; per-member confirmation needed from actual meeting minutes for citation quality |

**All other claims (DB UUIDs, headshot HTTP 200, form of government, elected officials list, district structure) were verified or cited — no additional user confirmation needed.**

---

## Open Questions

1. **D4 vacancy: who fills it and when?**
   - What we know: Kalani wins Mayor race (certifying June 26). She vacates her D4 council seat. Standard CA practice is for the city council to appoint a replacement within 60 days.
   - What's unclear: Whether Torrance holds a special election or council appointment; timing relative to when this phase will be executed.
   - Recommendation: Leave D4 office with NULL politician_id in Wave 2. Add a note in verification: "D4 vacancy expected to be filled by appointment ~August 2026." The seat will render as vacant on the browse view, which is accurate.

2. **Betty Lieu headshot: TUSD vs campaign site?**
   - What we know: Lieu has been on TUSD board since 2018 — she certainly has an official TUSD portrait. She also ran a 2026 campaign.
   - What's unclear: Whether the TUSD board photo page is curl-accessible and shows a usable portrait.
   - Recommendation: Wave 3 executor checks TUSD board member page first (https://www.tusd.org/board); if found and accessible, use it. Otherwise campaign site → Ballotpedia → checkpoint:human-verify.

3. **Should retiring officials (Chen, Mattucci) get Wave 4 stances?**
   - What we know: Chen has a long (2018-2026) documented record as Mayor and prior councilmember. Mattucci introduced the anti-camping ordinance and has documented positions. Both are being retired but their public record exists.
   - What's unclear: Whether the research agent can find sufficient evidence for both retiring officials.
   - Recommendation: YES — include Chen and Mattucci in Wave 4 stance research. Their historical record is relevant (residents may have interacted with them), and the evidence map suggests 4-6 stances available for Chen and 2-3 for Mattucci. If research yields nothing verifiable, honest blanks apply.

4. **geo_id empty string vs NULL: which does the DB have?**
   - What we know: The DB query showed `geo_id` for Torrance as empty (blank column display). In Pomona and other prior phases it was NULL.
   - What's unclear: Whether it's actually NULL or an empty string ''.
   - Recommendation: Wave 1 migration must use `WHERE (geo_id IS NULL OR geo_id = '')` as the guard to handle both cases safely.

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: DB live query 2026-06-20] — gov UUID b3e97e65, geo_id=empty/NULL, 2 chambers (2583b565 doomed / f6fcb0ba survivor), 8 total offices, district UUIDs, 3 broken bidirectional links, Brigitte Lewis duplicate confirmed, -700659 free, 0 stances all politicians, schema_migrations MAX=927
- [VERIFIED: torranceca.gov image URLs — HTTP 200 curl 2026-06-20] — All 7 council member portraits + Clerk + Treasurer portraits curl-accessible; sizes 113KB–2.3MB; no WAF; URL pattern `files/assets/city/v/2/government/elected-officials/{filename}` and `v/3/headshots/{filename}` confirmed
- [VERIFIED: torranceca.gov/government/city-council-and-elected-officials/district-elections (via WebSearch + WebFetch)] — 6 district council seats + at-large Mayor; district elections adopted 2018; D2/4/6 phased 2020, D1/3/5 phased 2022
- [VERIFIED: Torrance Watch torrancewatch.org — checked 2026-06-20] — June 2026 election results: Kalani leads Mayor 51%/49% (unofficial, certifying June 26); Lieu wins D5 68%; Kaji/Sheikh re-elected D1/D3

### Secondary (MEDIUM confidence)
- [CITED: torrancechamber.com/elected-officials/] — Current roster with names, districts, and email addresses confirmed
- [CITED: torrancewatch.org/races/2026/mayor] — Chen/Kalani policy differences; specific documented votes (Pride May 2024, anti-camping Sept 2025)
- [CITED: torrancewatch.org/races/2026/district-3] — Sheikh background, documented votes (Pride YES, anti-camping YES)
- [CITED: torrancewatch.org/races/2026/district-1] — Kaji background, homelessness hotel opposition, El Camino Village annexation
- [CITED: davisvanguard.org Sept 2025] — Torrance anti-camping ordinance coverage; Mattucci introduced proposal
- [CITED: torranceca.gov/government/city-attorney] — City Attorney is appointed (confirmed via search result + WebSearch)
- [CITED: WebSearch result — torranceca.gov/government/about] — Council-manager form of government; elected positions are 7 council + Clerk + Treasurer; appointed = City Manager + City Attorney
- [CITED: WebSearch result] — Pride Month proclamation vote May 7, 2024 (4-3); Homekey+ hotel opposition May 23, 2025 (unanimous); anti-camping ordinance concurrence Sept 9, 2025

### Tertiary (LOW confidence)
- [ASSUMED] D4 seat will remain vacant pending appointment post-Kalani — consistent with CA municipal law (no evidence of immediate successor announced)
- [ASSUMED] Betty Lieu has a usable portrait on the TUSD board page — consistent with 8-year tenure; not verified
- [ASSUMED] The specific per-member vote breakdown on anti-camping ordinance Sept 2025 (Kalani=NO; others TBD) — Torres Watch confirms Kalani voted NO; individual votes for Kaji/Lewis/Gerson not yet confirmed from minutes

---

## Metadata

**Confidence breakdown:**
- Roster (7 members, district mapping, DB UUIDs): HIGH — DB-verified + election results confirmed
- Form of government (council-manager, directly-elected Mayor): HIGH — multiple official sources
- DB state (chambers, districts, offices, bidirectional links, duplicate row): HIGH — live DB query 2026-06-20
- June 2026 election results: HIGH (unofficial, certifying June 26 — high confidence in Kalani win given 51% margin)
- Headshot sources (no WAF, all curl-accessible): HIGH — HTTP 200 confirmed on all 7 council member portrait URLs
- Stance evidence map: MEDIUM — news coverage patterns; per-member vote confirmation needed from OneMeeting minutes at apply time
- Betty Lieu headshot source: LOW — not yet on torranceca.gov; TUSD source unverified

**Research date:** 2026-06-20
**Valid until:** 2026-11-30 (D4 appointment/special election may fill vacant seat within 60 days of Kalani taking office; June 26 certification may confirm results; otherwise current seating stable)
