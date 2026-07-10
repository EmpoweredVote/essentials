# Phase 156: Bellflower Deep-Seed — Research

**Researched:** 2026-06-22
**Domain:** City of Bellflower, CA — reconcile deep-seed (form of government, current roster, headshots, evidence-only stances)
**Confidence:** HIGH (all four critical questions resolved via official city site + LA County election results + verified headshot URLs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 (reconcile not greenfield; NO merge — single chamber):** Backfill `essentials.governments.geo_id='0604982'` on gov `d34bdac8` (guard `geo_id IS NULL OR geo_id=''`; state already CA). ONE 'City Council' chamber (`a89b567a`) — no merge, no doomed-chamber delete. Repair 4 one-directional back-pointers (set `politicians.office_id` to match each office's `politician_id`) for Koops, Morse, Sanchez, and Dunton. Title normalization: council offices use 'Council Member' (with space) — normalize all to `'Councilmember'`. Set `official_count` per D-02 outcome. At-Large district `8db5a2e5` holds current council seats. Wave-1 STOP-on-drift pre-flight re-confirms gov UUID, chamber UUID, 4 offices + members/ext_ids, all 4 link directions, both district UUIDs, and live `schema_migrations` MAX + on-disk MAX.
- **D-02 (research-verify mayor type + at-large/by-district — no guessed default):** DEFER TO RESEARCH. DB currently models a separate LOCAL_EXEC Mayor (Ray Dunton, district `b0002e15`). Working hypothesis = general-law rotational mayor. Research MUST verify. No guessed default.
- **D-03 (research-verify the full council; seat missing 5th; unlink-not-delete departed; new members -7010xx):** 4 DB occupants suspect until verified. Nov-2024 election held — turnover possible. Research must find the missing 5th current member.
- **D-04 (verify-and-fix the 4 existing + fill the 5th honestly):** WAF status UNKNOWN — check. 4 current occupants have 1 image each. Verify correct person, no superimposed text/graphics, 600×750 4:5. Fill gap for newly-seated 5th member. Blocking human-verify checkpoint.
- **Wave 4 (evidence-only stances, full greenfield):** CHAIRS model; 100% citation; no defaults; no judicial-* topics (council-manager, appointed City Attorney); ONE agent at a time; all currently at 0 stances.
- **Migration ledger:** Next migration = 1042 (on-disk authoritative; pre-flight re-confirms both MAX values). Structural migs register in schema_migrations; headshot+stance migs AUDIT-ONLY. Commit to EV-Accounts repo via `git -C "C:/EV-Accounts"`.

### Claude's Discretion
- Exact reconcile SQL ordering (follow 151/152/153/154/155 idempotent patterns), back-pointer-repair mechanics, Mayor-office conversion mechanics (if D-02 finds rotational), per-member stance chairs, and which existing headshots pass vs need re-crop.

### Deferred Ideas (OUT OF SCOPE)
- Bellflower Unified School District (gov `f85ca154`) — separate government.
- Run Bellflower's own split-section check post-reconcile (expect 0 rows — single chamber, single At-Large district).
- Browse school-district-sliver display issue — separate browse-logic follow-up.
- Phase 157 (Wave-2 LAC2-RETRO close-out) consumes Bellflower's final per-city counts.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BLFL-01 | City of Bellflower (geo_id 0604982) deep-seeded — government + roster + headshots + evidence-only stances | Form of government confirmed (BY-DISTRICT council + ROTATIONAL Mayor); full current roster verified (5 members: Santa Ines=Mayor/Sanchez=Mayor Pro Tem as of Dec 8 2025; D1=Morse, D2=Koops, D3=Santa Ines, D4=Sanchez, D5=Dunton); Santa Ines is the missing 5th member; all 5 headshots HTTP 200 NO-WAF; Laserfiche + Revize CMS for agendas |
</phase_requirements>

---

## Summary

**Critical Finding 1 — Form of Government (D-02 RESOLVED):** Bellflower is a charter city (Measure B approved by 77.7% of voters Nov 5, 2024; previously a general-law city) operating under a COUNCIL-MANAGER form of government. The five City Council members are elected BY DISTRICT (five geographic districts established by Ordinance No. 1410, adopted November 2021). The Mayor is ROTATIONAL — selected annually by the council from among its own members to serve a one-year term. Bellflower's official city website confirms: "The Mayor is elected by the Council from among its membership; he serves as presiding officer at Council meetings." The DB's existing separate LOCAL_EXEC Mayor office for Ray Dunton is a MIS-SEED and must be converted to a council seat. [VERIFIED: bellflower.ca.gov/government/city_council/index.php]

**Critical Finding 2 — BY-DISTRICT (not At-Large):** Unlike Norwalk (purely at-large), Bellflower switched to district-based elections when it adopted Ordinance No. 1410 in November 2021. Five districts are numbered 1–5. This means the At-Large district `8db5a2e5` currently attached to Koops/Morse/Sanchez's offices must be relabeled or the offices must be moved to correctly labeled district rows. The existing shared At-Large district needs to either be renamed/split per the West Covina/Inglewood/Palmdale pattern. [VERIFIED: bellflower.ca.gov/government/city_council/redistricting/selected_map.php; election results lavote.gov]

**Critical Finding 3 — Current Roster (D-03 RESOLVED — missing 5th is Sonny R. Santa Ines):** The DB has only 4 of 5 council members seated. The missing 5th member is **Sonny R. Santa Ines** (District 3, elected Nov 2022, term expires Dec 2026), currently serving as Mayor (selected Dec 8, 2025). The four DB occupants are all CONFIRMED CURRENT (no unlinking needed): Dunton D5, Koops D2, Morse D1, Sanchez D4. Morse was appointed Oct 2023 (replacing Raymond Hamada who resigned) and then elected in a November 2024 special election (51.33% over Aaron Drake). Koops (D2) and Sanchez (D4) were both re-elected uncontested in Nov 2024. The Dec 8, 2025 reorganization: **Mayor = Sonny R. Santa Ines (D3)**, **Mayor Pro Tem = Victor A. Sanchez (D4)**. [VERIFIED: bellflower.ca.gov/news_detail_T43_R473.php; lavote.gov/text-results/4324]

**Critical Finding 4 — WAF Status + Headshots (D-04 RESOLVED):** bellflower.ca.gov uses Revize CMS (cms5.revize.com) and returns HTTP 200 to standard curl with NO WAF. All five official council headshots are accessible at HTTP 200 via the bellflower.ca.gov redirect path to Revize CDN. Pattern: `bellflower.ca.gov/photo_gallery/Government/City Council/{Name} web.jpg`. No special UA required. All 5 URLs confirmed with sizes. Santa Ines (missing 5th member) headshot also confirmed HTTP 200 (37,743 bytes). [VERIFIED: curl HTTP 200 on all 5 portrait URLs]

**Critical Finding 5 — Charter City Status:** Bellflower voted to become a charter city in November 2024 (Measure B). The charter maintains the existing council-manager form of government and rotational mayor structure — no structural change to how council is elected or how the mayor is selected. The charter gives Bellflower more local control (e.g., bidding procedures, uncontested election cancellations) but does NOT change the five-district elected council with rotational mayor. This does NOT affect the deep-seed migration pattern. [CITED: bellflower.ca.gov/government/charter_city_info.php; Ballotpedia Measure B page]

**Primary recommendation:** Proceed with the full 4-wave reconcile. D-02 and D-03 are fully resolved. Structure: 5 by-district council seats (D1–D5), rotational Mayor title on Santa Ines's D3 seat, rotational Mayor Pro Tem on Sanchez's D4 seat. Convert Dunton's erroneous LOCAL_EXEC Mayor office to a D5 council seat. Drop the orphan "Bellflower Mayor" LOCAL_EXEC district `b0002e15`. Create and seat Santa Ines (D3, -7010xx). By-district relabeling: existing At-Large district `8db5a2e5` must be split into 5 district rows (D1=Morse, D2=Koops, D3=Santa Ines, D4=Sanchez, D5=Dunton) following the Palmdale/West Covina/Inglewood pattern. official_count=5.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Government structure (geo_id, chamber, districts) | Database / Storage | — | Pure DB reconcile — no API/UI change |
| Mayor-type conversion (LOCAL_EXEC → D5 seat) | Database / Storage | — | Migration SQL: convert Dunton's office, drop orphan LOCAL_EXEC district `b0002e15` |
| By-district relabeling (At-Large → D1–D5) | Database / Storage | — | Split shared At-Large `8db5a2e5` into per-seat district rows (Palmdale/West Covina pattern) |
| Roster management (link repair, Santa Ines create, Mayor/MPT titles) | Database / Storage | — | Migration SQL only |
| Headshot ingestion (crop, upload, politician_images) | Database / Storage | API / Backend | Supabase Storage upload + DB row insert |
| Stance research + ingestion | Database / Storage | — | inform.politician_answers + inform.politician_context via MCP |
| Browse surfacing (geo_id → officials) | API / Backend | Browser / Client | geo_id backfill enables existing browse routes |

---

## Standard Stack

No new packages are installed in this phase. Same migration + Supabase MCP pattern as phases 142–155.

### Migration Toolchain (carried forward, no changes)
| Tool | Version | Purpose |
|------|---------|---------|
| Supabase MCP (`mcp__supabase-local`) | live | Apply SQL migrations directly to production DB |
| PostgreSQL SQL | — | Migration file format (`.sql`); idempotent `DO $$ ... $$ LANGUAGE plpgsql` blocks |
| EV-Accounts git repo | master | Migration file storage and commit tracking |
| curl | system | Headshot download from bellflower.ca.gov (HTTP 200, NO WAF, no special UA required) |

### Template Migration Files (confirmed present from Norwalk 155)
| File | Path | Use for Bellflower |
|------|------|-----------------|
| `1034_norwalk_reconcile.sql` | `C:/EV-Accounts/backend/migrations/` | Most recent LOCAL_EXEC Mayor → council seat conversion + one-directional link-repair + geo_id backfill template |
| `1035_norwalk_complete.sql` | `C:/EV-Accounts/backend/migrations/` | Rotational Mayor/VP title-on-seat pattern + official_count=5 |
| `1036_norwalk_headshots.sql` | `C:/EV-Accounts/backend/migrations/` | Most recent headshot audit-only template |
| Palmdale 146 migrations | `C:/EV-Accounts/backend/migrations/` | BY-DISTRICT relabeling pattern (At-Large → D1–D5); relabel existing rows + create missing district rows |

---

## Package Legitimacy Audit

> Not applicable — this phase installs zero new packages. Migration SQL + Supabase MCP only.

---

## Architecture Patterns

### System Architecture Diagram

```
bellflower.ca.gov                Supabase DB (production)
  /government/city_council/       ┌──────────────────────────────────────────┐
  index.php                       │  essentials.governments                   │
  (Revize CMS cms5.revize.com,    │    d34bdac8  geo_id → 0604982             │
   NO WAF — HTTP 200 direct curl) │                                           │
       │                          │  essentials.chambers                      │
       │ curl (no special UA)     │    a89b567a (SINGLE chamber, NO merge)    │
       ▼                          │    official_count = 5                     │
  portrait JPGs (HTTP 200)        │                                           │
  /photo_gallery/Government/      │  essentials.districts (5 — relabeled)    │
  City Council/{name} web.jpg     │    D1 (Morse)                             │
       │                          │    D2 (Koops)                             │
       │ 4:5 crop → 600×750       │    D3 (Santa Ines — new create)           │
       │ Lanczos q90              │    D4 (Sanchez)                           │
       ▼                          │    D5 (Dunton — converted from LOCAL_EXEC)│
  Supabase Storage                │                                           │
  politician_photos/              │  essentials.offices (5)                  │
  {uuid}-headshot.jpg             │    Santa Ines D3 title='Mayor'            │
       │                          │    Sanchez D4 title='Mayor Pro Tem'       │
       ▼                          │    Dunton D5 / Koops D2 / Morse D1        │
  politician_images rows          │    [Dunton converted LOCAL_EXEC→D5]       │
  (audit-only migration)          │                                           │
                                  │  inform.politician_answers                │
Web sources (stances)             │  inform.politician_context                │
  bellflower.ca.gov (Laserfiche   │    (audit-only migrations)                │
  + Revize agendas/minutes)       └──────────────────────────────────────────┘
  Ballotpedia, thedowneypatriot
  lavote.gov election results
```

### Recommended Migration File Names (follow Norwalk 1034/1035/1036 pattern)

```
C:/EV-Accounts/backend/migrations/
├── 1042_bellflower_reconcile.sql   # Wave 1: geo_id + by-district relabel + link repair + Dunton LOCAL_EXEC→D5 (STRUCTURAL, registered)
├── 1043_bellflower_complete.sql    # Wave 2: create Santa Ines D3 + Mayor/MPT titles + official_count=5 (STRUCTURAL, registered)
├── 1044_bellflower_headshots.sql   # Wave 3: headshots (AUDIT-ONLY, NOT registered)
└── 1045_bellflower_stances_*.sql   # Wave 4: per-member stances (AUDIT-ONLY, NOT registered, one file per member)
```

### Pattern: BY-DISTRICT (not At-Large) — West Covina / Palmdale model

Bellflower adopted five council districts via Ordinance No. 1410 (November 2021). The existing shared At-Large district `8db5a2e5` currently covers all 3 seated council offices (Koops/Morse/Sanchez). Dunton's office is on the LOCAL_EXEC Mayor district `b0002e15`. Santa Ines has no office yet.

The relabeling approach (following Palmdale 146 / West Covina 152 precedent):
1. **Relabel** the existing At-Large district `8db5a2e5` to `label='District 1'` (or create 5 new district rows and reassign). Each seated office must point to a distinct district row.
2. Since Norwalk had a single At-Large district that was kept as-is (all 5 offices on one row), Bellflower is different: it has 5 distinct geographic districts. The planner must decide whether to repurpose `8db5a2e5` as one specific district row (e.g., D1 for Morse) and create 4 new rows, or create all 5 fresh district rows with labels D1–D5.
3. **Drop** the orphan "Bellflower Mayor" LOCAL_EXEC district `b0002e15` after converting Dunton's office.
4. The Palmdale pattern (migs 918/919) relabeled existing At-Large rows to occupants and created missing ones — mirror this.

### Pattern: Rotational Mayor = Title on Seat + LOCAL_EXEC Conversion (Norwalk / Downey / Burbank model)

Bellflower's annual reorganization (Dec 8, 2025) selected Mayor = Santa Ines, Mayor Pro Tem = Sanchez.

1. Convert Dunton's LOCAL_EXEC office (`bdd2040f`) to a District 5 council seat:
   - Move it to the survivor chamber `a89b567a` (it's already there — no chamber move needed)
   - Re-point `district_id` from the LOCAL_EXEC district `b0002e15` to the new D5 district row
   - Change `district_type` (if applicable) from LOCAL_EXEC to LOCAL
   - Set `title = 'Councilmember'` (Dunton is NOT the current Mayor; Santa Ines is)
2. Drop the now-orphaned "Bellflower Mayor" LOCAL_EXEC district `b0002e15`
3. Create and seat Santa Ines (D3, new politician, ext_id -7010xx range)
4. Set `title = 'Mayor'` on Santa Ines's D3 office
5. Set `title = 'Mayor Pro Tem'` on Sanchez's D4 office
6. Set `title = 'Councilmember'` on Dunton/Koops/Morse offices
7. `official_count = 5` on chamber `a89b567a`

### Anti-Patterns to Avoid
- **Treating Bellflower as At-Large:** The city switched to by-district elections in 2021 (Ordinance No. 1410). Do NOT leave all 5 offices on the shared At-Large district `8db5a2e5`. Must relabel/split to D1–D5.
- **Keeping the LOCAL_EXEC Mayor office:** Dunton's separate Mayor office is a mis-seed. Bellflower's mayor IS rotational. Convert to D5 council seat.
- **Setting Dunton's title as Mayor:** Dunton was Mayor in a prior year. The Dec 8, 2025 reorganization selected Santa Ines as Mayor and Sanchez as Mayor Pro Tem. Dunton = Councilmember.
- **Skipping the Santa Ines create:** Santa Ines (D3) is the MISSING 5th member — not in the DB. Must create a fresh politician row with a -7010xx ext_id. Do NOT use an existing politician row (no name collision in DB for Bellflower council).
- **Wrong-person headshot guard:** Dunton's bio page URL is named `ray_dunton_mayor_pro_tem.php` (stale URL from when he was Mayor Pro Tem). The image file (`dunton web.jpg`) is the correct portrait. Verify visually.

---

## Form of Government — VERDICT

**BY-DISTRICT (5 Districts) + ROTATIONAL MAYOR. CONFIRMED. DB LOCAL_EXEC MAYOR OFFICE IS A MIS-SEED.**

| Question | Answer | Confidence | Source |
|----------|--------|------------|--------|
| At-large or by-district? | **BY-DISTRICT** — 5 members elected from Districts 1–5 | HIGH | bellflower.ca.gov/government/city_council/index.php (explicit district assignments); Ordinance No. 1410 (Nov 2021) adopted district map; election results showing D1/D2/D3/D4/D5 races |
| CVRA lawsuit / district transition? | Bellflower adopted districts voluntarily via Ordinance No. 1410 (Nov 2021) — no lawsuit; districts applied from Nov 2022 election cycle onward | HIGH | bellflower.ca.gov/government/city_council/redistricting/selected_map.php |
| Mayor directly elected or rotational? | **ROTATIONAL** — selected annually by council from its members | HIGH | bellflower.ca.gov/government/city_council/index.php (explicit: "The Mayor is elected by the Council from among its membership"); Dec 8, 2025 unanimous vote selected Santa Ines |
| Seat count | **5** (Districts 1–5) | HIGH | Official site, election results, all five bio pages |
| Current Mayor (as of Dec 8, 2025) | **Sonny R. Santa Ines** (District 3) | HIGH | bellflower.ca.gov/news_detail_T43_R473.php (Dec 8, 2025 press release) |
| Current Mayor Pro Tem | **Victor A. Sanchez** (District 4) | HIGH | bellflower.ca.gov/news_detail_T43_R473.php |
| City government type | **Council-Manager** (City Manager Ryan Smoot is appointed executive; charter maintained this structure) | HIGH | bellflower.ca.gov/government/city_manager/index.php |
| Charter city status | YES — Measure B approved Nov 5, 2024 (77.7% yes); does NOT change council structure or mayor selection | HIGH | lavote.gov/text-results/4324; bellflower.ca.gov/government/charter_city_info.php |
| DB LOCAL_EXEC Mayor office status | **MIS-SEED — convert to D5 council seat** | HIGH | Mayor is rotational by council selection; no separate directly-elected Mayor exists |
| official_count for the chamber | **5** (all council, rotational Mayor included) | HIGH | Rotational mayor model confirmed; all 5 seats equivalent district council seats |

---

## Roster — VERDICT

**FOUR DB ROWS CONFIRMED CURRENT. SANTA INES IS THE MISSING 5TH (CREATE FRESH). NO UNLINKING NEEDED.**

| Name | DB ext_id | DB pol UUID | District | Actual Role (as of Dec 8, 2025) | Elected/Term | 2024 Election Status | Confirmed Source |
|------|-----------|-------------|----------|-------------------------------|--------------|---------------------|-----------------|
| Ray **Dunton** | -200583 | `31c35458` | District 5 | **Councilmember** (was rotational Mayor in a prior cycle) | First elected 2007; current term Nov 2022–Dec 2026 | NOT up in 2024 (D5 elected 2022) | bellflower.ca.gov/government/city_council/ray_dunton_mayor_pro_tem.php |
| Dan **Koops** | -201149 | `dd2c2cfd` | District 2 | **Councilmember** (was rotational Mayor 2024 cycle) | First elected 2009; re-elected Nov 2024 (uncontested); term 2024–2028 | Won re-election Nov 2024 uncontested | lavote.gov/text-results/4324; Ballotpedia D2 page |
| Wendi **Morse** | -201150 | `d18dcb81` | District 1 | **Councilmember** | Appointed Oct 2023 (replacing Hamada who resigned); won special election Nov 2024 (51.33% over Drake); term expires Dec 2026 | Won special election Nov 2024 | lavote.gov/text-results/4324; downeylatinonews.com |
| Victor A. **Sanchez** | -201151 | `4384a5d8` | District 4 | **Mayor Pro Tem** | First elected Nov 2020; re-elected Nov 2024 (uncontested); term 2024–2028 | Won re-election Nov 2024 uncontested | lavote.gov/text-results/4324; bellflower.ca.gov/news_detail_T43_R473.php |
| Sonny R. **Santa Ines** | NOT IN DB | — | District 3 | **Mayor** | Elected Nov 2022; term 2022–2026 | NOT up in 2024 (D3 elected 2022) | bellflower.ca.gov/government/city_council/sonny_santa_ines_council_member.php; legistorm.com |

**Santa Ines — new create:** Born in San Jose City, Philippines; retired Chief Financial & Administrative Officer; Master's degree from CSULB, Bachelor's in Accounting from Philippine School of Business Administration. Ext_id = -7010xx scheme (query `MIN(external_id)` to avoid collision; next available in -7010xx range). [CITED: bellflower.ca.gov/government/city_council/sonny_santa_ines_council_member.php]

**Dunton in DB as Mayor LOCAL_EXEC:** The DB seeded Dunton with the Mayor title under a LOCAL_EXEC district. He was the rotational Mayor in a prior year (bio page URL still says `mayor_pro_tem` from an even earlier year). His CURRENT title is Councilmember. The LOCAL_EXEC office must be converted to a D5 council seat.

**Koops bio page URL note:** The bio page URL is `dan_koops_mayor.php` (stale — from when Koops held the rotational Mayor title in 2024). Current title = Councilmember.

**2024 election summary (lavote.gov):**
- D1 special election: Wendi Morse 2,736 (51.33%) over Aaron K. Drake 2,594 (48.67%)
- D2: Dan Koops uncontested (3,513 votes, 100%)
- D4: Victor A. Sanchez uncontested (3,203 votes, 100%)
- Measure B (Charter City): YES 17,740 (77.70%) / NO 5,092 (22.30%) — PASSED

**District 1 history note:** Raymond Hamada (appointed 2018, elected 2020) resigned from D1 in 2023. Wendi Morse was appointed Oct 2023 to fill the vacancy, then won the Nov 2024 special election. Morse's term expires Dec 2026 (not 2028 — because she's completing Hamada's unexpired term). [CITED: downeylatinonews.com/en/2024/10/ask-the-candidates-bellflower-city-council-district-1]

---

## Headshots

### WAF Status: NONE — HTTP 200 direct curl, no special UA required

bellflower.ca.gov uses Revize CMS (cms5.revize.com). Standard curl follows HTTP 302 redirect to cms5.revize.com, which then serves the image at HTTP 200. **No Chrome UA required.** Same pattern as norwalkca.gov (Phase 155).

**CMS pattern:** `bellflower.ca.gov/photo_gallery/Government/City Council/{Name} web.jpg?t={timestamp}` → 302 → `cms5.revize.com/revize/bellflowerca/photo_gallery/Government/City Council/...`

Timestamps on URLs are optional — the images serve correctly with or without the `?t=` parameter (verified).

### Official Headshot URLs (all verified HTTP 200 image/jpeg)

| Official | Role | Verified URL | Size (bytes) | Notes |
|---------|------|-------------|-------------|-------|
| Sonny R. **Santa Ines** | Mayor (D3) | `https://bellflower.ca.gov/photo_gallery/Government/City%20Council/Santa%20Ines%20web.jpg` | 37,743 | Missing from DB — must create + upload; older URL variant `/revize_photo_gallery/...` returns 404 — use `/photo_gallery/` path |
| Victor A. **Sanchez** | Mayor Pro Tem (D4) | `https://bellflower.ca.gov/photo_gallery/Government/City%20Council/sanchez%20web.jpg?t=202412122004080` | 39,472 | Dec 2024 timestamp; in DB (verify correct person) |
| Ray **Dunton** | Councilmember (D5) | `https://bellflower.ca.gov/photo_gallery/Government/City%20Council/dunton%20web.jpg` | 43,635 | In DB (verify correct person; bio page URL says "mayor_pro_tem" — stale title, image should be correct) |
| Dan **Koops** | Councilmember (D2) | `https://bellflower.ca.gov/photo_gallery/Government/City%20Council/koops%20web.jpg?t=202412122007070` | 39,461 | Dec 2024 timestamp; in DB (verify correct person) |
| Wendi **Morse** | Councilmember (D1) | `https://bellflower.ca.gov/photo_gallery/Government/City%20Council/morse%20web.jpg?t=202412122008500` | 48,928 | Dec 2024 timestamp; in DB (verify correct person) |

**Curl command (no UA flag needed):**
```bash
curl -s -L -o santa_ines.jpg \
  "https://bellflower.ca.gov/photo_gallery/Government/City%20Council/Santa%20Ines%20web.jpg"
# Returns HTTP 200, image/jpeg, 37743 bytes — no special UA required
```

### Wrong-Person Guard (West Covina lesson)

The four existing DB images were bulk-seeded. Verify each image against the official bio page to confirm the portrait matches the named official. The stale bio page URL for Dunton (`ray_dunton_mayor_pro_tem.php`) could confuse an executor — it is the correct page for Dunton, just with an outdated title in the filename.

Also: Koops's bio page is named `dan_koops_mayor.php` (was Mayor in 2024) — the image at `koops web.jpg` is still the correct Koops portrait, but the executor should visual-confirm.

### Fallback Sources

| Official | Primary Fallback | Notes |
|---------|-----------------|-------|
| Any | Ballotpedia candidate pages | 2024 election pages exist for Morse/Drake (D1), Koops (D2), Sanchez (D4) |
| Santa Ines | bellflower.ca.gov/government/city_council/sonny_santa_ines_mayor.php | Alternate URL (older "mayor" page); confirmed D3 and same image |
| Any | Campaign social media / LinkedIn | Quality variable; check for superimposed text/graphics |

---

## Stance Sources (Wave 4 Survey — non-blocking for structure)

Wave 4 runs one agent at a time per the rate-limit rule. All 5 members currently have 0 stances — full greenfield.

**No judicial topics** — Bellflower is council-manager with an appointed City Attorney (confirmed: council-manager form of government maintained under charter).

**Mandatory check:** Query live `inform.compass_stances` at apply time for current non-judicial topic IDs. Never hardcode retired IDs ([project_compass_live_topic_ids]).

### Agenda/Minutes Access

Bellflower stores council agendas and minutes via:
- **Revize PDF URLs:** `https://www.bellflower.org/city%20council%20agendas/{date}/{item}.pdf` (direct PDFs, NO WAF)
- **Laserfiche archive portal:** `https://portal.laserfiche.com/Portal/Browse.aspx?repo=r-ac13a437` (searchable archive; older records)
- **citizenportal.ai/feed/4604** — Citizen Portal AI meeting tracker (useful for finding recent agenda topics)
- **Bellflower meetings page:** `bellflower.ca.gov/government/city_council/city_council_meetings.php` — links to recent PDF agendas organized by date
- **YouTube:** City meeting videos archived on YouTube channel

Council meets 2nd and 4th Mondays of each month at 7pm (City of Bellflower Chambers, 5000 Clark Ave).

### Key Policy Events to Research (for stance anchors)

**Charter City (Measure B — unanimous council placement):** On July 8, 2024, all five council members unanimously voted to place Measure B on the November ballot. This gives a data point on council cooperation/structure but is not a strong compass stance differentiator. Evidence: bellflower.ca.gov/news_detail_T43_R315.php

**State Housing Opposition (2025):** Paul Gonsalves testified on behalf of Bellflower and 23 other California cities in opposition to state housing legislation before the CA Assembly Housing Committee (July 2025). This suggests the council's general posture on state housing mandates — research further for specific votes.

**Homelessness/Shelter policy:** No Norwalk-equivalent unanimous shelter ban found for Bellflower (unlike Norwalk's 2024 unanimous shelter moratorium). Agents should search specifically for any Bellflower anti-camping ordinances, shelter moratoria, or homelessness response votes. Evidence-only — do NOT assume a specific position without a documented vote.

**Wendi Morse's D1 campaign positions (2024):** On rent regulation, Morse stated she was "undecided" and would balance interests of renters and property owners. [CITED: downeylatinonews.com/en/2024/10/ask-the-candidates-bellflower-city-council-district-1] This is campaign-level evidence — pair with any council vote evidence.

### Per-Member Stance Profile

#### Sonny R. Santa Ines — MEDIUM RECORD (seated Nov 2022, District 3, current Mayor)
- **Background:** Retired CFO/CAFO. Immigrant from Philippines. Research his city council votes since Dec 2022 seating.
- **Research order:** 1st or 2nd. Has served ~3.5 years; should have voting record on key council actions.
- **Key search:** "Sonny Santa Ines" Bellflower council minutes 2023–2025; CSULB/CFO background may inform economic development stances.

#### Ray Dunton — RICHEST RECORD (District 5, first elected 2007)
- **Background:** Longest-serving member on the current council (~17 years). Research his full record since 2020 (recent enough to be relevant).
- **Research order:** 1st. Longest tenure — most documented stances across multiple compass topics.
- **Name-collision risk:** "Ray Dunton" is distinctive; lower collision risk than Norwalk members.

#### Dan Koops — MEDIUM-RICH RECORD (District 2, first elected 2009)
- **Background:** Long-serving member (since 2009). Was the rotational Mayor in 2024. Research his record since 2020.
- **Research order:** 2nd or 3rd. Strong record from many years of service.

#### Victor A. Sanchez — MEDIUM RECORD (District 4, first elected Nov 2020, current Mayor Pro Tem)
- **Background:** Announced candidacy for D4 in 2020 — first person to represent that district directly. Research record since Dec 2020.
- **Research order:** 3rd or 4th.

#### Wendi Morse — THINNEST RECORD (District 1, appointed Oct 2023, elected Nov 2024)
- **Background:** Appointed ~Oct 2023 after Hamada's resignation; served ~2.5 years on council. Shorter tenure than others.
- **Research order:** Last. Shortest tenure; fewer documented votes. Expect more honest blanks.
- **Campaign signal:** "Undecided" on rent regulation (2024 campaign). Use as context but not as a stance placement.

---

## Common Pitfalls

### Pitfall 1: Treating Bellflower as At-Large (the most likely trap)
**What goes wrong:** Executor sees Norwalk was at-large and assumes Bellflower is the same. Leaves all offices on the shared At-Large district `8db5a2e5`.
**Why it happens:** The CONTEXT.md says "At-Large district `8db5a2e5`... holds all 3 current council seats." This describes the DB's CURRENT (incorrect) state, not the correct state.
**How to avoid:** Bellflower adopted FIVE DISTRICTS in 2021 (Ordinance No. 1410). All five offices must be on distinct district rows labeled District 1 through District 5. Follow the Palmdale (146) / West Covina (152) by-district relabeling pattern — NOT the Norwalk (155) at-large pattern.
**Warning signs:** A post-migration query showing multiple offices on the same `district_id` row.

### Pitfall 2: Leaving the LOCAL_EXEC Mayor Office in Place
**What goes wrong:** Executor keeps Dunton's LOCAL_EXEC Mayor office, treating it as correctly modeled.
**Why it happens:** Lancaster / Pasadena / Inglewood all have directly-elected Mayors modeled as LOCAL_EXEC offices. The executor matches on that pattern.
**How to avoid:** Bellflower's mayor IS ROTATIONAL — selected by council annually. Convert Dunton's LOCAL_EXEC office to a D5 council seat. Drop the orphan "Bellflower Mayor" LOCAL_EXEC district `b0002e15`. Follow the Norwalk/Downey/West Covina/Burbank model.

### Pitfall 3: Not Creating Santa Ines
**What goes wrong:** Executor sees 4 existing offices and considers the reconcile complete, missing that a 5th member (Santa Ines) is the current Mayor.
**Why it happens:** The CONTEXT.md pre-check shows 4 offices/4 people. The executor might proceed to Wave 2 without noticing the 5-seat council is under-counted.
**How to avoid:** Bellflower has 5 districts. Only 4 members are seated. The missing 5th is **Sonny R. Santa Ines, District 3, the current Mayor**. Create a fresh politician row with ext_id in the -7010xx scheme and a new D3 office.

### Pitfall 4: Setting Dunton's Title as Mayor
**What goes wrong:** Executor sees Dunton listed as "Mayor" in the DB and sets title='Mayor' on his converted D5 council seat.
**Why it happens:** DB state shows Dunton as Mayor. Pattern-matching fires on DB state.
**How to avoid:** The Dec 8, 2025 reorganization changed the Mayor to **Sonny R. Santa Ines** and Mayor Pro Tem to **Victor A. Sanchez**. Dunton = Councilmember. Koops's bio URL still says "mayor" (he was Mayor in 2024) — also Councilmember now.

### Pitfall 5: Using the Wrong Santa Ines Headshot URL
**What goes wrong:** Executor tries the URL path `revize_photo_gallery/Government/City Council/Sonny R Santa Ines (WEB).jpg` (found on an older bio page) and gets HTTP 404.
**Why it happens:** The older bio page (`sonny_santa_ines_mayor.php`) references a `revize_photo_gallery/` path pattern that returns 404.
**How to avoid:** Use the canonical `/photo_gallery/` path: `https://bellflower.ca.gov/photo_gallery/Government/City%20Council/Santa%20Ines%20web.jpg` — confirmed HTTP 200 (37,743 bytes).

### Pitfall 6: Morse's Term Expiry Confusion
**What goes wrong:** Executor assumes Morse (D1) has a 4-year term expiring 2028 (since she was elected in Nov 2024).
**Why it happens:** Koops and Sanchez both won re-election in Nov 2024 with full 4-year terms (2024–2028). Morse also appears in the Nov 2024 results.
**How to avoid:** Morse won a **special election for an unexpired term** — she is completing Hamada's original term, which expires December 2026 (not 2028). Her next election will be Nov 2026. This affects any term-based data but does not affect the DB migration itself (offices don't store term expiry).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| By-district relabeling | Custom district-split logic | Proven SQL template from Palmdale (146) / West Covina (152) migrations | Idempotent guards already written; splitting shared-district pattern proven |
| LOCAL_EXEC → District seat conversion | New separate office | Convert existing Dunton LOCAL_EXEC office in-place (change district_id, district_type, title) | Norwalk 155 / El Monte 151 / Inglewood 153 inverse patterns exist |
| Mayor title-on-seat | NEW LOCAL_EXEC office | Update `title` field on Santa Ines's D3 seat | West Covina 1011 + Downey + Burbank + Norwalk precedent |
| Headshot fetch | Python scraper or special UA | `curl -L <bellflower.ca.gov URL>` | NO WAF; HTTP 200 with standard curl |
| Stance research | Batch all 5 officials | One agent at a time | Rate-limit rule ([feedback_stance_research_one_at_a_time]) |
| Santa Ines ext_id | Pick a number | Query `MIN(external_id)` from politicians WHERE external_id < -700000 | Avoid collision with existing -7010xx range entries |

**Key insight:** Bellflower's reconcile is more complex than Norwalk because of the by-district relabeling (5 district rows needed) AND the missing-member create, but the headshot fetch is equally simple (NO WAF, direct curl works).

---

## Code Examples

### Headshot Fetch Pattern (Revize CMS, no UA required)
```bash
# Standard curl — NO special User-Agent needed; -L follows the 302 redirect
curl -s -L -o santa_ines.jpg \
  "https://bellflower.ca.gov/photo_gallery/Government/City%20Council/Santa%20Ines%20web.jpg"
# Returns HTTP 200, image/jpeg, 37743 bytes

curl -s -L -o dunton.jpg \
  "https://bellflower.ca.gov/photo_gallery/Government/City%20Council/dunton%20web.jpg"
# Returns HTTP 200, image/jpeg, 43635 bytes

curl -s -L -o koops.jpg \
  "https://bellflower.ca.gov/photo_gallery/Government/City%20Council/koops%20web.jpg?t=202412122007070"
# Returns HTTP 200, image/jpeg, 39461 bytes

curl -s -L -o morse.jpg \
  "https://bellflower.ca.gov/photo_gallery/Government/City%20Council/morse%20web.jpg?t=202412122008500"
# Returns HTTP 200, image/jpeg, 48928 bytes

curl -s -L -o sanchez.jpg \
  "https://bellflower.ca.gov/photo_gallery/Government/City%20Council/sanchez%20web.jpg?t=202412122004080"
# Returns HTTP 200, image/jpeg, 39472 bytes
```

### LOCAL_EXEC Mayor → District 5 Council Seat Conversion (Wave 1 — key Bellflower-specific step)
```sql
-- Source: Norwalk 1034_norwalk_reconcile.sql / El Monte 151 inverse-pattern
-- Step 1: Convert Dunton's LOCAL_EXEC office to District 5 council seat
UPDATE essentials.offices
SET
  district_id = '<new_D5_district_uuid>',  -- new D5 district row created in same migration
  title = 'Councilmember'
WHERE id = 'bdd2040f-8f8d-4543-b017-3caad9be4510'  -- Dunton's LOCAL_EXEC office
  AND title != 'Councilmember';  -- idempotent

-- Step 2: Drop the now-orphaned "Bellflower Mayor" LOCAL_EXEC district
DELETE FROM essentials.districts
WHERE id = 'b0002e15-e006-4791-b2f7-7a3389f58cb3'  -- LOCAL_EXEC "Bellflower Mayor" district
  AND (SELECT COUNT(*) FROM essentials.offices WHERE district_id='b0002e15-e006-4791-b2f7-7a3389f58cb3') = 0;
```

### By-District Relabeling (Wave 1 — Palmdale pattern)
```sql
-- Source: Palmdale 146 migrations (918/919 pattern)
-- Relabel or repurpose existing At-Large district 8db5a2e5 for D1
-- and create new district rows for D2–D5
-- Example: repurpose 8db5a2e5 as District 1 for Morse
UPDATE essentials.districts
SET label = 'District 1'
WHERE id = '8db5a2e5-2172-474a-be23-e51c2a53f970'
  AND label != 'District 1';  -- idempotent

-- Then create 4 new district rows (D2, D3, D4, D5)
-- using INSERT ... ON CONFLICT DO NOTHING pattern
-- Each row: government_id = d34bdac8, state = 'CA', district_type = 'LOCAL',
--           mtfcc = same as existing At-Large row, label = 'District N'

-- Then reassign each office to its correct district_id
UPDATE essentials.offices
SET district_id = '<D2_uuid>'
WHERE id = '3935cd4b-727b-41fb-96c3-87f66b0c385c'  -- Koops's office
  AND district_id != '<D2_uuid>';  -- idempotent
-- Repeat for Sanchez (D4), Dunton (D5 after LOCAL_EXEC conversion)
-- Resolve exact UUIDs at apply time
```

### Rotational Mayor/MPT Title on Seat (Wave 2)
```sql
-- Source: 1035_norwalk_complete.sql / 1011_west_covina_complete.sql patterns
-- Set Mayor title on Santa Ines's D3 council seat (newly created in Wave 2)
UPDATE essentials.offices
SET title = 'Mayor'
WHERE politician_id = '<santa_ines_pol_uuid>'  -- newly created Santa Ines
  AND title != 'Mayor';  -- idempotent

-- Set Mayor Pro Tem title on Sanchez's D4 council seat
UPDATE essentials.offices
SET title = 'Mayor Pro Tem'
WHERE politician_id = '4384a5d8-68b2-4e24-81e2-5208f5c61a34'  -- Victor Sanchez
  AND title != 'Mayor Pro Tem';  -- idempotent

-- All others = Councilmember (Dunton set in Wave 1; normalize Koops/Morse too)
-- official_count = 5 (rotational Mayor is one of the 5 council seats)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Assuming bellflower.ca.gov is WAF-403 (like Downey/Glendale/Pomona) | bellflower.ca.gov has NO WAF — HTTP 200 direct curl (Revize CMS, same as norwalkca.gov) | Phase 156 research | No Chrome UA needed; simpler headshot fetch |
| DB LOCAL_EXEC Mayor office treated as correct | Bellflower is rotational-mayor — LOCAL_EXEC is a mis-seed | Phase 156 research | Convert Dunton's office to D5 council seat in Wave 1 |
| DB models Bellflower as At-Large | Bellflower is BY-DISTRICT (5 districts since 2021) | Phase 156 research | Must relabel At-Large district and create D1–D5 rows |
| Dunton = current Mayor (DB state) | Santa Ines = current Mayor, Sanchez = Mayor Pro Tem (Dec 8, 2025 reorganization) | Phase 156 research | Set titles on Santa Ines/Sanchez, Dunton = Councilmember |
| Bellflower = general-law city | Bellflower = charter city (Measure B Nov 2024) — same council structure maintained | Phase 156 research | No structural change to migration pattern; charter gives more local control only |

**Deprecated/outdated in this phase:**
- The notion that Bellflower's council is at-large (the DB's At-Large district is incorrect — Bellflower has been by-district since Nov 2022 first district election).
- The `revize_photo_gallery/Government/City Council/Sonny R Santa Ines (WEB).jpg` URL path — returns 404. Use `/photo_gallery/Government/City Council/Santa Ines web.jpg`.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The Dec 8, 2025 reorganization results (Santa Ines=Mayor, Sanchez=Mayor Pro Tem) are still current as of June 2026 (no mid-year change) | Roster Verdict | Very low risk — rotational Mayors serve 1-year terms Dec–Dec; next rotation Dec 2026 |
| A2 | Koops (D2) and Sanchez (D4) ran uncontested in Nov 2024 and have full 4-year terms 2024–2028 | Roster Verdict | Low risk — lavote.gov results confirmed |
| A3 | Dunton's current term is 2022–2026 (D5 election cycle) | Roster Verdict | Medium risk — DB was bulk-seeded; official site says "elected November 2022" but does not explicitly state term end date; consistent with D5/D3 2022-election pattern |
| A4 | Morse's term expires Dec 2026 (completing Hamada's unexpired term, not a full 4-year term) | Roster Verdict | Medium risk — Ballotpedia says "term expiring December 2026"; consistent with Oct 2023 appointment + Nov 2024 special election for unexpired term |
| A5 | Existing DB headshots for the 4 members are the correct persons (no wrong-person swap at bulk seed) | Headshots | Low risk — images came from Revize CMS official portraits; verify at Wave-3 apply time |
| A6 | Bellflower's charter (Measure B) maintained the rotational mayor and by-district council structure — no structural changes | Form of Government | Low risk — search results and the web-scraped charter info confirm "five council members elected in accordance with this Charter" with rotational mayor; the charter was explicitly described as maintaining existing structure |

**Highest operational risk:** A4 — Morse's term. This does not affect the migration SQL but could affect the stance pre-tenure attribution rule if Morse's council tenure started Oct 2023 (not Nov 2024); stances from Oct 2023 onward (when she was appointed) should be attributable to her.

---

## Open Questions (RESOLVED — no blockers)

All four critical questions are resolved. No planning blockers remain.

1. **Form of government (D-02):** RESOLVED. By-district (5 districts) + rotational mayor. DB LOCAL_EXEC Mayor is a mis-seed — convert in Wave 1. DB At-Large district is incorrect — relabel to D1–D5 in Wave 1. See "Form of Government — VERDICT."

2. **Current roster (D-03):** RESOLVED. 4 DB rows confirmed current. Santa Ines (D3) is the missing 5th and current Mayor. Create fresh with -7010xx ext_id. No unlinking needed. See "Roster — VERDICT."

3. **Headshots (D-04):** RESOLVED. bellflower.ca.gov has NO WAF (Revize CMS, same as norwalkca.gov). All 5 official portraits accessible at HTTP 200 via standard curl. No broken URLs found. `Santa Ines web.jpg` confirmed 37,743 bytes. See "Headshots" section.

4. **Stance sources (Wave 4):** ASSESSED. Laserfiche + Revize agendas accessible. No Norwalk-equivalent unanimous shelter ban found — agents must search for Bellflower-specific policy votes. Dunton (longest-serving) richest record; Morse (shortest-serving) thinnest. See "Stance Sources" section.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase MCP (`mcp__supabase-local`) | All waves | Confirmed (prior phases 142–155) | Live production | psql via EV-Accounts DATABASE_URL |
| curl with redirect follow (`-L`) | Wave 3 headshot download | Confirmed (all 5 URLs HTTP 200) | System curl | Python urllib (also works) |
| bellflower.ca.gov Revize image system | Wave 3 headshots | Confirmed NO-WAF | HTTP 200 verified all 5 | Ballotpedia / campaign pages |
| EV-Accounts git repo | Migration commit | Confirmed (master branch) | — | N/A |
| Laserfiche portal | Wave 4 stance research | Available (no login required for public records) | `portal.laserfiche.com/Portal/Browse.aspx?repo=r-ac13a437` | Revize PDFs directly from bellflower.ca.gov |

**Missing dependencies with no fallback:** None.

---

## Validation Architecture

### Structural Assertions (Wave 1 completion gate)

| Check | SQL Pattern | Expected Result |
|-------|-------------|-----------------|
| geo_id backfilled | `SELECT geo_id FROM essentials.governments WHERE id='d34bdac8-e928-45c5-aaa8-ca3950ec2d6c'` | `'0604982'` |
| Only one 'City Council' chamber | `SELECT COUNT(*) FROM essentials.chambers WHERE government_id='d34bdac8-...' AND name='City Council'` | 1 |
| All 5 offices in survivor chamber | `SELECT COUNT(*) FROM essentials.offices WHERE chamber_id='a89b567a-6085-44c0-94ce-2a922ebb1fa6'` | 5 (after Santa Ines created in Wave 2) |
| All 4 existing offices bidirectional | `SELECT COUNT(*) FROM essentials.offices o JOIN essentials.politicians p ON p.id=o.politician_id WHERE o.chamber_id='a89b567a...' AND (p.office_id IS NULL OR p.office_id != o.id)` | 0 |
| No LOCAL_EXEC offices remain under this gov | `SELECT COUNT(*) FROM essentials.offices o JOIN essentials.districts d ON d.id=o.district_id WHERE d.government_id='d34bdac8...' AND d.district_type='LOCAL_EXEC'` | 0 |
| LOCAL_EXEC "Bellflower Mayor" district deleted | `SELECT COUNT(*) FROM essentials.districts WHERE id='b0002e15-e006-4791-b2f7-7a3389f58cb3'` | 0 |
| Dunton link repaired | `SELECT office_id FROM essentials.politicians WHERE external_id=-200583` | NOT NULL |
| Koops link repaired | `SELECT office_id FROM essentials.politicians WHERE external_id=-201149` | NOT NULL |
| Morse link repaired | `SELECT office_id FROM essentials.politicians WHERE external_id=-201150` | NOT NULL |
| Sanchez link repaired | `SELECT office_id FROM essentials.politicians WHERE external_id=-201151` | NOT NULL |
| 5 distinct district rows for this gov (D1–D5) | `SELECT COUNT(DISTINCT id) FROM essentials.districts WHERE government_id='d34bdac8...' AND district_type='LOCAL'` | 5 (or at minimum 5 distinct district_id values on the 5 offices) |
| No two offices sharing the same district_id | `SELECT district_id, COUNT(*) FROM essentials.offices WHERE chamber_id='a89b567a...' GROUP BY district_id HAVING COUNT(*) > 1` | 0 rows |

### Roster Assertions (Wave 2 completion gate)

| Check | Expected |
|-------|----------|
| official_count on survivor chamber | 5 |
| Santa Ines politician row created | SELECT COUNT(*) FROM essentials.politicians WHERE first_name='Sonny' AND last_name LIKE '%Santa Ines%' = 1 |
| Santa Ines office created and bidirectional | pol.office_id = office.id (both directions) |
| Santa Ines's office title | 'Mayor' |
| Sanchez's office title | 'Mayor Pro Tem' |
| Dunton/Koops/Morse office titles | 'Councilmember' |
| No LOCAL_EXEC office under this gov | 0 rows |
| All 5 politicians have non-null office_id | 5 non-null values |

### Split-Section Check (post-Wave-1)
```sql
-- Source: feedback_section_split_check — run after every seeding phase; expect 0 rows
SELECT g.name, COUNT(DISTINCT gb.mtfcc) section_count
FROM essentials.governments g
JOIN essentials.government_bodies gb ON gb.government_id = g.id
WHERE g.id = 'd34bdac8-e928-45c5-aaa8-ca3950ec2d6c'
GROUP BY g.name HAVING COUNT(DISTINCT gb.mtfcc) > 1;
-- Expected: 0 rows (Bellflower has single chamber; by-district relabel uses consistent mtfcc)
```

### Quick Health Check Post-Wave-1
```sql
SELECT
  (SELECT geo_id FROM essentials.governments WHERE id='d34bdac8-e928-45c5-aaa8-ca3950ec2d6c') as geo_id,
  (SELECT COUNT(*) FROM essentials.chambers WHERE government_id='d34bdac8-e928-45c5-aaa8-ca3950ec2d6c') as chamber_count,
  (SELECT official_count FROM essentials.chambers WHERE id='a89b567a-6085-44c0-94ce-2a922ebb1fa6') as official_count,
  (SELECT COUNT(*) FROM essentials.offices WHERE chamber_id='a89b567a-6085-44c0-94ce-2a922ebb1fa6') as office_count;
-- Expected: geo_id='0604982', chamber_count=1, official_count=5, office_count=4 (Wave 1) → 5 (after Wave 2)
```

### Headshot Verify Checkpoints (Wave 3 — human-verify blocking)
- All 5 images: correct person (identity verified against official bio page name match)
- All 5 images: 600×750 pixels, 4:5 ratio
- All 5 images: no superimposed text/graphics
- Santa Ines: new upload (no prior DB image); use `Santa Ines web.jpg` URL (NOT the `revize_photo_gallery` variant)
- photo_origin_url set to `bellflower.ca.gov` canonical URL for all 5

### Stance Citation Audit (Wave 4 — blocking human-verify checkpoint)
- 0 uncited answers (`inform.politician_context` exists for every `inform.politician_answers` row)
- 0 judicial-topic rows (Bellflower is council-manager; no judicial topics)
- 0 hardcoded retired topic IDs (verify against live `inform.compass_stances`)
- Pre-tenure attribution: stances not attributed to members before their seating date (Morse: Oct 2023 appointment, Nov 2024 election; Santa Ines: Dec 2022; Sanchez: Dec 2020; Koops: Dec 2009; Dunton: Dec 2007)

---

## Security Domain

> `security_enforcement` not set in config — treated as enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Migration SQL runs via authenticated Supabase MCP session |
| V3 Session Management | No | No session changes |
| V4 Access Control | No | No new API endpoints |
| V5 Input Validation | Yes (minimal) | SQL migrations use hardcoded UUIDs/ext_ids — no user input; parameterized at apply time |
| V6 Cryptography | No | No new secrets; photo URLs are public |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Wrong-person headshot upload | Integrity | Verify each image against official bellflower.ca.gov council bio page — name appears in bio text confirming identity |
| Stale LOCAL_EXEC Mayor title (Dunton) | Integrity | Research confirms Santa Ines=Mayor as of Dec 2025; pre-flight confirms before setting titles |
| At-Large district left in place | Integrity | Research confirms 5 distinct geographic districts since 2021; post-migration check for offices sharing district_id |
| Missing Santa Ines (5th member) | Integrity | Research confirms Santa Ines is missing from DB; Wave 2 must create and seat |
| Retired compass topic ID in stances | Integrity | Query live `inform.compass_stances` at apply time, never hardcode |

---

## Sources

### Primary (HIGH confidence)
- `bellflower.ca.gov/government/city_council/index.php` — current council roster + by-district structure + rotational mayor confirmed via explicit site text [VERIFIED]
- `bellflower.ca.gov/news_detail_T43_R473.php` — Dec 8, 2025 press release: Santa Ines selected Mayor, Sanchez selected Mayor Pro Tem (unanimous council vote, one-year term) [VERIFIED]
- `bellflower.ca.gov/government/city_council/redistricting/selected_map.php` — 5-district map, Ordinance No. 1410 (Nov 2021); election schedule D1/D3/D5 in 2022; D2/D4 in 2024 [VERIFIED]
- `results.lavote.gov/text-results/4324` — November 5, 2024 LA County election results: D1 Morse, D2 Koops, D4 Sanchez; Measure B charter city [VERIFIED]
- Individual bio pages: `bellflower.ca.gov/government/city_council/{member}.php` — district assignments, election dates, headshot URLs for all 5 members [VERIFIED]
- curl HTTP 200 test — all 5 headshot URLs confirmed NO-WAF, image/jpeg, with byte sizes [VERIFIED]

### Secondary (MEDIUM confidence)
- `legistorm.com/person/bio/511013/Sonny_R_Santa_Ines.html` — Santa Ines District 3, elected Nov 2022 term ending Dec 2026 [CITED]
- `downeylatinonews.com/en/2024/10/ask-the-candidates-bellflower-city-council-district-1` — D1 special election context; Hamada vacancy; Morse appointment Oct 2023; Morse rent stance "undecided" [CITED]
- `ballotpedia.org/Bellflower,_California,_Measure_B,_Home_Rule_Charter_Measure_(November_2024)` — charter city measure details [CITED]
- `bellflower.ca.gov/government/charter_city_info.php` — charter maintains existing council structure [CITED]

### Tertiary (LOW confidence — context only)
- `bellflower.ca.gov/government/city_manager/index.php` — Ryan Smoot City Manager confirmation (council-manager form confirmed)
- `bellflowerchamber.org/dignitaries` — secondary roster confirmation
- `archive.org/details/bellfca-Bellflower_City_Council_Meeting_December_8_2025` — Dec 8 2025 council video archive (consistent with primary source)

---

## Metadata

**Confidence breakdown:**
- Form of government (by-district + rotational mayor): HIGH — confirmed via explicit official city site text; Ordinance No. 1410 district map; Dec 8, 2025 reorganization press release; charter city maintains same structure
- Current roster (all 5 confirmed, Santa Ines=Mayor/Sanchez=MPT): HIGH — official press release + bio pages cross-confirm; LA County election results for Nov 2024
- WAF status (NO WAF, direct curl works): HIGH — curl HTTP 200 confirmed on all 5 portrait URLs with byte sizes
- Headshot URLs (all 5 with HTTP 200): HIGH — all five confirmed live (37,743 / 43,635 / 39,461 / 48,928 / 39,472 bytes)
- Stance depth (no Norwalk-equivalent anchor found): MEDIUM — general council accessibility confirmed; specific voting record depth per member not fully mined

**Research date:** 2026-06-22
**Valid until:** 2026-09-22 (council stable until December 2026 reorganization; no CVRA transition — district model already in place)

---

## Live Browse Link
https://essentials.empowered.vote/results?browse_geo_id=0604982&browse_mtfcc=G4110

---

## RESEARCH COMPLETE

**Phase:** 156 — Bellflower deep-seed
**Confidence:** HIGH

### Key Findings
- **BY-DISTRICT (not At-Large):** Bellflower adopted 5 geographic council districts in November 2021 (Ordinance No. 1410). The DB's shared At-Large district `8db5a2e5` must be split/relabeled to D1–D5. This is the most significant structural difference from Norwalk (Phase 155).
- **Rotational Mayor confirmed:** The LOCAL_EXEC Mayor office for Ray Dunton is a mis-seed. Mayor is selected annually by council (Dec 2025: Santa Ines=Mayor, Sanchez=Mayor Pro Tem). Convert Dunton's office to a D5 council seat; drop the orphan LOCAL_EXEC district `b0002e15`.
- **Missing 5th member identified:** Sonny R. Santa Ines (District 3, elected Nov 2022, current Mayor) is the missing member. Create a fresh politician row with -7010xx ext_id and seat him in a new D3 office with title='Mayor'.
- **No WAF on bellflower.ca.gov:** Revize CMS (same as norwalkca.gov). All 5 headshots confirmed HTTP 200 image/jpeg via standard curl, no special UA needed. Santa Ines headshot URL is `/photo_gallery/Government/City Council/Santa Ines web.jpg` (NOT the `revize_photo_gallery` variant which 404s).
- **Charter city status:** Bellflower passed Measure B in Nov 2024 (77.7% yes) but the charter maintains the identical council-manager structure and rotational mayor. No structural impact on migration.

### File Created
`.planning/phases/156-bellflower-deep-seed/156-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Form of government (by-district + rotational) | HIGH | Official city site + redistricting ordinance + Dec 2025 press release + election results all confirm |
| Roster (4 confirmed current + Santa Ines missing) | HIGH | Official bio pages + LA County election results + Dec 2025 reorganization press release |
| Headshots (NO WAF, all 5 HTTP 200) | HIGH | curl confirmed all 5 image/jpeg with byte sizes |
| Stance sources | MEDIUM | Agenda portals identified; per-member voting depth not fully mined (Wave 4 agents must research) |

### Open Questions
- **Santa Ines ext_id:** Query `MIN(external_id)` from politicians to confirm next available -7010xx slot before assigning.
- **District row UUIDs:** The planner must decide whether to repurpose the existing At-Large district `8db5a2e5` as D1 and create 4 new rows (D2/D3/D4/D5), or create all 5 new rows and retire `8db5a2e5`. Either approach valid per Palmdale/West Covina precedent.
- **Morse term expiry:** Confirmed Dec 2026 (unexpired term). No impact on migration SQL but relevant for pre-tenure attribution in Wave 4.

### Ready for Planning
Research complete. Planner can now create PLAN.md files for all 4 waves.
