# Phase 155: Norwalk Deep-Seed - Research

**Researched:** 2026-06-22
**Domain:** City of Norwalk, CA — reconcile deep-seed (form of government, current roster, headshots, evidence-only stances)
**Confidence:** HIGH (all four critical questions resolved via official city site + news releases + verified headshot URLs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 (reconcile not greenfield):** Backfill `essentials.governments.geo_id='0652526'` on gov `15897159-e6bf-4d7e-9b45-44d62c4ebb8a` (guard `geo_id IS NULL OR geo_id=''`; state already CA). Merge two duplicate 'City Council' chambers: SURVIVOR = `97397b0f-61f1-4251-bf29-3fd5f99c0108` (4 offices, one-directional). DOOMED = `e7e787f7-4695-4747-9dd7-b111472ca9ae` (1 office, bidirectional-clean). Move Jennifer Perez from doomed to survivor + re-point to surviving At-Large district `5677c0ab`. Delete doomed chamber + doomed At-Large district `f9e8037d`. Repair 4 one-directional back-pointers (Ayala/Ramirez/Rios/Valencia: set `politicians.office_id`). Title normalize to `'Councilmember'`. Set `official_count` per D-02 outcome. Wave-1 STOP-on-drift pre-flight re-confirms all UUIDs + both ledger MAX values.
- **D-02 (research-verify mayor type + at-large/by-district — no guessed default):** DEFER TO RESEARCH. DB currently models a separate LOCAL_EXEC Mayor (Tony Ayala, district `4126e079`). Working hypothesis = general-law rotational mayor (convert to council seat). Research MUST verify. No guessed default.
- **D-03 (research-verify all 5; unlink-not-delete departed; new members -7010xx; official_count per D-02):** All 5 DB occupants suspect until verified. Nov-2024 election held — turnover possible.
- **D-04 (verify-and-fix the 5 existing + fill gaps):** All 5 have 1 image; WAF unknown; wrong-person guard from West Covina. Re-crop/replace any failing 600×750 / superimposed-graphics check. Headshot wave audit-only migration.
- **Wave 4 (evidence-only stances, full greenfield):** CHAIRS model; 100% citation; no defaults; no judicial-* topics; ONE agent at a time; all 5 currently at 0 stances.
- **Migration ledger:** Next migration = 1034 (on-disk authoritative; pre-flight re-confirms both MAX values). Structural migs register in schema_migrations; headshot+stance migs AUDIT-ONLY. Commit to EV-Accounts repo via `git -C "C:/EV-Accounts"`.

### Claude's Discretion
- Exact reconcile SQL ordering (follow 151/152/153/154 idempotent patterns), survivor-chamber move-then-delete mechanics, At-Large district consolidation mechanics, Mayor-office conversion mechanics (if D-02 finds rotational), per-member stance chairs, and which existing headshots pass vs need re-crop.

### Deferred Ideas (OUT OF SCOPE)
- Norwalk-La Mirada Unified School District (gov `d4f9a7fa`) — separate government.
- Split-section check post-reconcile (expect 0 rows — Norwalk is NOT in the known split-section defect set).
- Browse school-district-sliver display issue — separate browse-logic follow-up.
- Phase 156 (Bellflower) and Phase 157 (close-out) are downstream.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NRWK-01 | City of Norwalk (geo_id 0652526) deep-seeded — government + roster + headshots + evidence-only stances | Form of government confirmed (AT-LARGE council + ROTATIONAL Mayor); full current roster verified (all 5 DB rows are correct current members, with correct titles: Perez=Mayor/Rios=Vice Mayor as of Dec 9 2025); headshot URLs confirmed NO-WAF with 5 direct URLs verified HTTP 200; Ramirez old image URL broken — corrected URL confirmed; shelter-ban controversy documented for stance research |
</phase_requirements>

---

## Summary

**Critical Finding 1 — Form of Government (D-02 RESOLVED):** Norwalk is a general-law city operating under the COUNCIL-MANAGER form of government. The five City Council members are elected AT-LARGE (citywide, no district boundaries). The Mayor is ROTATIONAL — selected annually by the council from among its own members to serve a one-year term. There is NO directly-elected Mayor. The official city site (norwalkca.gov) states explicitly: "Each year the Council selects one of its members to serve as Mayor and one member to serve as Vice Mayor. The Mayor presides over all Council meetings and is the ceremonial head of the City for official functions." The DB's existing separate LOCAL_EXEC Mayor office for Tony Ayala is a MIS-SEED and must be converted to a council seat with the rotational title on the correct current person. [VERIFIED: norwalkca.gov/government/mayor_and_city_council/index.php]

**Critical Finding 2 — Current Roster (D-03 RESOLVED — all 5 confirmed current):** The Nov 5, 2024 general election WAS held (vote for 3 seats): incumbents Ramirez, Rios, and Valencia all ran and retained their seats over challengers Bryan A. Lopez and Nicholas Garcia. The two seats not up in 2024 (Ayala and Perez, elected 2017/2022 cycle) are continuing members. All 5 DB occupants are CORRECT current council members — NO unlinking needed. The rotational titles as of the Dec 9, 2025 reorganization: **Mayor = Jennifer Perez**, **Vice Mayor = Margarita L. Rios**, Ayala/Ramirez/Valencia = Councilmember. [VERIFIED: norwalkca.gov/news_detail_T3_R66.html (Dec 9, 2025 press release) + norwalkca.gov/government/mayor_and_city_council/index.php (current roster)]

**Critical Finding 3 — WAF Status + Headshots (D-04 RESOLVED):** norwalkca.gov uses Revize CMS (cms3.revize.com) and returns HTTP 200 to standard curl with NO special UA required — NO WAF. All five official council headshots are accessible at HTTP 200 via the norwalkca.gov redirect path (which proxies to Revize CDN). **IMPORTANT:** The existing DB image for Rick Ramirez uses the old CDN filename `638169002126970000.jpg` which now 404s on Revize. The correct/current URL is `Image/Government/Mayor And City Council/Rick Ramirez/RR - Digital Images - Copy.jpg?t=202508201332230` — confirmed HTTP 200 (27,965 bytes). All 5 images verified. [VERIFIED: curl HTTP 200 on all 5 portrait URLs; verified via Python urllib with redirect following]

**Critical Finding 4 — Stance Sources Assessed:** The unanimous Aug 6, 2024 shelter ban (moratorium on emergency shelters, supportive housing, transitional housing) — extended Sept 17, 2024 — followed by a state lawsuit (Nov 2024) and eventual settlement (city agrees to overturn, pay $250K into housing trust fund) is the dominant Norwalk policy controversy. The vote was UNANIMOUS across all 5 members — all are on record pro-ban. This drives homelessness-response, housing, and residential-zoning stances for all 5 members. Individual record depth varies: Ramirez (longest serving, 2003+) and Rios (2017+) have the deepest records; Valencia (2020+) has medium depth; Perez (2017+) has medium depth; Ayala (2017+) has medium depth.

**Primary recommendation:** Proceed with the full 4-wave reconcile. D-02 and D-03 are fully resolved. Structure: 5 at-large council seats, rotational Mayor title on Perez's existing seat (after merger), rotational Vice Mayor on Rios's seat. Convert Ayala's erroneous LOCAL_EXEC Mayor office to a council seat with 'Councilmember' title. Drop the orphan "Norwalk Mayor" LOCAL_EXEC district `4126e079`. official_count=5. No person unlinking. Headshots: all 5 accessible NO-WAF; Ramirez existing DB image likely stale (old filename 404s — replace with current URL). Wave 4 stance anchor: the unanimous 2024 shelter ban is the key differentiating vote for homelessness topics.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Government structure (geo_id, chamber merge, districts) | Database / Storage | — | Pure DB reconcile — no API/UI change |
| Mayor-type conversion (LOCAL_EXEC → At-Large seat) | Database / Storage | — | Migration SQL: convert office type, drop orphan district, set title on Perez's seat |
| Roster management (link repair, Mayor/VP titles) | Database / Storage | — | Migration SQL only |
| Headshot ingestion (crop, upload, politician_images) | Database / Storage | API / Backend | Supabase Storage upload + DB row insert |
| Stance research + ingestion | Database / Storage | — | inform.politician_answers + inform.politician_context via MCP |
| Browse surfacing (geo_id → officials) | API / Backend | Browser / Client | geo_id backfill enables existing browse routes |

---

## Standard Stack

No new packages are installed in this phase. Same migration + Supabase MCP pattern as phases 142–154.

### Migration Toolchain (carried forward, no changes)
| Tool | Version | Purpose |
|------|---------|---------|
| Supabase MCP (`mcp__supabase-local`) | live | Apply SQL migrations directly to production DB |
| PostgreSQL SQL | — | Migration file format (`.sql`); idempotent `DO $$ ... $$ LANGUAGE plpgsql` blocks |
| EV-Accounts git repo | master | Migration file storage and commit tracking |
| curl / Python urllib | system | Headshot download from norwalkca.gov (HTTP 200, no special UA required) |

### Template Migration Files (confirmed present from prior phases)
| File | Path | Use for Norwalk |
|------|------|-----------------|
| `1026_burbank_reconcile.sql` | `C:/EV-Accounts/backend/migrations/` | Most recent dual-chamber-merge + one-directional link-repair + geo_id backfill template |
| `1027_burbank_complete.sql` | `C:/EV-Accounts/backend/migrations/` | Rotational Mayor title-on-seat pattern |
| `1011_west_covina_complete.sql` | `C:/EV-Accounts/backend/migrations/` | Mayor/VP title-on-seat, official_count=5 |
| `1018_inglewood_reconcile.sql` | `C:/EV-Accounts/backend/migrations/` | LOCAL_EXEC Mayor → council seat conversion pattern (El Monte inverse also relevant) |

---

## Package Legitimacy Audit

> Not applicable — this phase installs zero new packages. Migration SQL + Supabase MCP only.

---

## Architecture Patterns

### System Architecture Diagram

```
norwalkca.gov                    Supabase DB (production)
  /government/mayor_and_          ┌──────────────────────────────────┐
  city_council/index.php          │  essentials.governments           │
  (Revize CMS, NO WAF —           │    15897159  geo_id→0652526       │
   HTTP 200 direct curl)          │                                  │
       │                          │  essentials.chambers             │
       │ curl (no special UA)     │    97397b0f (SURVIVOR, At-Large)  │
       ▼                          │    e7e787f7 (DOOMED→delete)       │
  portrait JPGs (HTTP 200)        │                                  │
  4:5 crop → 600×750              │  essentials.offices (5)          │
  Lanczos q90                     │    5 At-Large seats               │
       │                          │    Perez title='Mayor'            │
       ▼                          │    Rios title='Vice Mayor'        │
  Supabase Storage                │    Ayala / Ramirez / Valencia     │
  politician_photos/              │    [Ayala converted from          │
  {uuid}-headshot.jpg             │     LOCAL_EXEC→council seat]      │
       │                          │                                  │
       ▼                          │  essentials.politicians (5)      │
  politician_images rows          │    all 5 confirmed current        │
  (audit-only migration)          │                                  │
                                  │  inform.politician_answers        │
Web sources (stances)             │  inform.politician_context        │
  norwalkca.gov (council minutes) │    (audit-only migrations)        │
  theeastsiderla.com              └──────────────────────────────────┘
  calmatters.org / abc7.com
  gov.ca.gov (Newsom shelter suit)
  Ballotpedia candidate pages
```

### Recommended Migration File Names (follow 1026/1027/1028 pattern)

```
C:/EV-Accounts/backend/migrations/
├── 1034_norwalk_reconcile.sql     # Wave 1: geo_id + chamber merge + link repair + Ayala LOCAL_EXEC→council (STRUCTURAL, registered)
├── 1035_norwalk_complete.sql      # Wave 2: verify roster + Mayor/VP titles + official_count=5 (STRUCTURAL, registered)
├── 1036_norwalk_headshots.sql     # Wave 3: headshots (AUDIT-ONLY, NOT registered)
└── 1037_norwalk_stances_*.sql     # Wave 4: per-member stances (AUDIT-ONLY, NOT registered, one file per member)
```

### Pattern: At-Large Stays At-Large

Norwalk's council is confirmed AT-LARGE — five members elected citywide. No by-district relabeling needed. The surviving At-Large district `5677c0ab` covers all 5 seats post-merge.

### Pattern: Rotational Mayor = Title on Seat (West Covina / Downey / Burbank model) + LOCAL_EXEC Conversion

Norwalk's annual reorganization selects a Mayor and Vice Mayor by council vote. These are titles, not separate offices. **Unlike Burbank**, the DB already has a separate LOCAL_EXEC Mayor office for Ayala that must be CONVERTED:

1. Convert Ayala's LOCAL_EXEC office (`5edc1993`) to an At-Large council seat:
   - Move it to the survivor chamber `97397b0f`
   - Re-point its district_id from the LOCAL_EXEC district `4126e079` to the surviving At-Large district `5677c0ab`
   - Change `district_type` from `LOCAL_EXEC` to `LOCAL` (At-Large)
   - Set `title = 'Councilmember'` (Ayala is NOT the current Mayor)
2. Drop the now-orphaned "Norwalk Mayor" LOCAL_EXEC district `4126e079`
3. Set `title = 'Mayor'` on Jennifer Perez's office
4. Set `title = 'Vice Mayor'` on Margarita Rios's office
5. Set `title = 'Councilmember'` on Ayala/Ramirez/Valencia offices
6. `official_count = 5` (all 5 council seats, rotational Mayor counted in)

### Anti-Patterns to Avoid
- **Keeping the LOCAL_EXEC Mayor office:** The DB's existing separate Mayor office for Ayala is a mis-seed. Do NOT keep it. Convert it to a 5th council seat.
- **Ayala as Mayor title:** Ayala was Mayor in Dec 2024. The Dec 9, 2025 reorganization selected Perez as Mayor and Rios as Vice Mayor. The CURRENT title-on-seat is Perez=Mayor, Rios=Vice Mayor — NOT Ayala.
- **Relabeling At-Large to District N:** Norwalk is confirmed AT-LARGE. No CVRA district conversion has occurred. Do not relabel.
- **Unlinking any of the 5 members:** All 5 are current. Ramirez/Rios/Valencia won re-election Nov 2024; Ayala/Perez are mid-term.
- **Using the old Ramirez image URL:** `638169002126970000.jpg` returns HTTP 404 on Revize CDN. Use `RR - Digital Images - Copy.jpg?t=202508201332230` instead.

---

## Form of Government — VERDICT

**AT-LARGE + ROTATIONAL MAYOR. CONFIRMED. DB LOCAL_EXEC MAYOR OFFICE IS A MIS-SEED.**

| Question | Answer | Confidence | Source |
|----------|--------|------------|--------|
| At-large or by-district? | **AT-LARGE** — 5 members elected citywide | HIGH | norwalkca.gov/government/mayor_and_city_council/index.php (explicit) |
| CVRA lawsuit / district transition? | No CVRA challenge found; Norwalk remains at-large | HIGH | No mention in official sources or Ballotpedia |
| Mayor directly elected or rotational? | **ROTATIONAL** — selected annually by council, 1-year term | HIGH | norwalkca.gov/government/mayor_and_city_council/index.php (explicit: "Each year the Council selects one of its members to serve as Mayor") |
| Seat count | **5** (all At-Large) | HIGH | norwalkca.gov council page; Ballotpedia 2024 candidate list |
| Current Mayor (as of Dec 9, 2025) | **Jennifer Perez** | HIGH | norwalkca.gov/news_detail_T3_R66.html (Dec 9, 2025 press release) |
| Current Vice Mayor | **Margarita L. Rios** | HIGH | norwalkca.gov/news_detail_T3_R66.html |
| City government type | **Council-Manager** (City Manager is appointed executive) | HIGH | norwalkca.gov (council form description) |
| DB LOCAL_EXEC Mayor office status | **MIS-SEED — convert to council seat** | HIGH | Mayor is rotational by council selection; no separate directly-elected Mayor exists |
| official_count for the chamber | **5** (all council, rotational Mayor included) | HIGH | Rotational Mayor model confirmed; all 5 seats equivalent At-Large council seats |

---

## Roster — VERDICT

**ALL FIVE DB ROWS ARE CORRECT CURRENT COUNCIL MEMBERS. NO UNLINKING NEEDED. TITLES TO UPDATE.**

| Name | DB ext_id | DB pol UUID | Actual Role (as of Dec 9, 2025) | Elected/Term | 2024 Election Status | Confirmed Source |
|------|-----------|-------------|-------------------------------|--------------|---------------------|-----------------|
| Jennifer **Perez** | 666845 | `3ed36508` | **Mayor** (rotational, Dec 2025–Dec 2026) | Elected 2017; re-elected 2022; term 2022–2026 | NOT up in 2024 | norwalkca.gov/news_detail_T3_R66.html; index.php |
| Margarita L. **Rios** | -201328 | `bd64253b` | **Vice Mayor** (rotational, Dec 2025–Dec 2026) | Elected 2017; re-elected Nov 2024; term 2024–2028 | Won re-election Nov 2024 | norwalkca.gov/news_detail_T3_R66.html; Ballotpedia 2024 |
| Tony **Ayala** | -200876 | `5e8bcf17` | **Councilmember** (was Mayor Dec 2024–Dec 2025) | Elected 2017; re-elected 2022; term 2022–2026 | NOT up in 2024 | norwalkca.gov/government/mayor_and_city_council/ayala.php; news_detail_T3_R23 |
| Rick **Ramirez** | -201327 | `e3b9af1b` | **Councilmember** | Re-elected Nov 2024; term 2024–2028 | Won re-election Nov 2024 | norwalkca.gov/councilmember_ramirez.php; Ballotpedia 2024 |
| Ana **Valencia** | -201329 | `ba647863` | **Councilmember** | Elected 2020; re-elected Nov 2024; term 2024–2028 | Won re-election Nov 2024 | norwalkca.gov/government/mayor_and_city_council/valencia.php; Ballotpedia 2024 |

**No members to unlink. No new members to create.** All 5 DB persons are confirmed seated as of June 2026.

**2024 election note:** The Nov 5, 2024 election was a "vote for 3" contest. Incumbents Ramirez, Rios, and Valencia ran against challengers Bryan A. Lopez and Nicholas Garcia. All three incumbents retained their seats. [CITED: Ballotpedia 2024 candidate pages for Ramirez, Rios, Valencia, Lopez, Garcia]

**Title-on-seat changes needed vs DB current state:**
- DB has Ayala as `Mayor` (LOCAL_EXEC) → convert to `Councilmember` on At-Large seat
- Perez is currently `Councilmember` → set title `Mayor`
- Rios is currently `Council Member` (or `Councilmember`) → set title `Vice Mayor`
- Ramirez, Valencia → normalize to `Councilmember` (no title change beyond normalization)

---

## Headshots

### WAF Status: NONE — HTTP 200 direct curl, no special UA required

norwalkca.gov uses Revize CMS (cms3.revize.com). Standard curl returns HTTP 302 redirect to cms3.revize.com, which then serves the image. Following the redirect with `-L` flag yields HTTP 200. **No Chrome UA required.** This is simpler than Burbank (which required Chrome UA).

**CMS pattern:** `norwalkca.gov/Image/Government/Mayor And City Council/{Name}/{filename}.jpg?t={timestamp}` → 302 → `cms3.revize.com/revize/norwalkca/Image/...`

All 5 portraits use the naming convention `{Initials} - Digital Images - Copy.jpg` (except Ramirez's old broken URL `638169002126970000.jpg` — now corrected).

### Official Headshot URLs (all verified HTTP 200 via Python urllib following redirects)

| Official | Role | Verified URL | Size (bytes) | Notes |
|---------|------|-------------|-------------|-------|
| Jennifer **Perez** | Mayor | `https://www.norwalkca.gov/Image/Government/Mayor%20And%20City%20Council/Jennifer%20Perez/JP%20-%20Digital%20Images%20-%20Copy.jpg?t=202512101807300` | 33,919 | Updated Dec 2025 |
| Margarita **Rios** | Vice Mayor | `https://www.norwalkca.gov/Image/Government/Mayor%20And%20City%20Council/Margarita%20%20Rios/MR%20-%20Digital%20Images%20-%20Copy.jpg?t=202512101808020` | 28,505 | ⚠ DOUBLE SPACE in "Margarita  Rios" path — note the TWO spaces in the URL (`%20%20`) |
| Tony **Ayala** | Councilmember | `https://www.norwalkca.gov/Image/Government/Mayor%20And%20City%20Council/Tony%20Ayala/TA%20-%20Digital%20Images%20-%20Copy.jpg?t=202508201329270` | 33,710 | Aug 2025 update |
| Rick **Ramirez** | Councilmember | `https://www.norwalkca.gov/Image/Government/Mayor%20And%20City%20Council/Rick%20Ramirez/RR%20-%20Digital%20Images%20-%20Copy.jpg?t=202508201332230` | 27,965 | ⚠ DB image uses OLD 404 URL `638169002126970000.jpg` — MUST replace with this corrected URL |
| Ana **Valencia** | Councilmember | `https://www.norwalkca.gov/Image/Government/Mayor%20And%20City%20Council/Ana%20Valencia/AV%20-%20Digital%20Images%20-%20Copy.jpg?t=202508201340330` | 22,441 | Aug 2025 update |

**Curl command (no UA flag needed):**
```bash
curl -s -L -o perez.jpg \
  "https://www.norwalkca.gov/Image/Government/Mayor%20And%20City%20Council/Jennifer%20Perez/JP%20-%20Digital%20Images%20-%20Copy.jpg?t=202512101807300"
# Returns HTTP 200, image/jpeg — no special UA required
```

### Existing DB Images — Known Issue (Ramirez)

All 5 current council members have exactly 1 image in the DB. Wave 3 must:
1. **Verify correct person** (wrong-person guard — West Covina lesson)
2. **No superimposed text/graphics** (e.g., "Re-Elect" banners — [[feedback_headshot_no_graphics]])
3. **600×750 pixels, 4:5 ratio** ([[feedback_headshot_image_sizing]])
4. **Replace Ramirez's existing image**: The DB-seeded image used `638169002126970000.jpg` which returns HTTP 404 on Revize CDN. This image may be broken in the DB already. Replace with `RR - Digital Images - Copy.jpg?t=202508201332230`.

### Fallback Sources

| Official | Primary Fallback | Notes |
|---------|-----------------|-------|
| Any | Ballotpedia candidate pages | 2024 election pages exist for Ramirez/Rios/Valencia; quality variable |
| Ramirez | Facebook `Ramirez4Norwalk` | Campaign social media — no-graphics check required |
| Ayala | Facebook `AyalaforNorwalkCityCouncil` | Campaign social media |
| Perez | Facebook `jenniferperezfornorwalkcitycouncil` | Campaign social media |
| Any | LegiStorm bios | Lower-quality but text-confirmed identity |

---

## Stance Sources (Wave 4 Survey — non-blocking for structure)

Wave 4 runs one agent at a time per the rate-limit rule. All 5 members currently have 0 stances — full greenfield.

**No judicial topics** — Norwalk is council-manager with an appointed City Attorney (confirmed: council-manager form of government).

**Mandatory check:** Query live `inform.compass_stances` at apply time for current non-judicial topic IDs. Never hardcode retired IDs ([[project_compass_live_topic_ids]]).

### Key Policy Event: The 2024 Shelter Ban (All 5 Members)

On August 6, 2024, the Norwalk City Council voted **unanimously** to impose a 45-day moratorium on new emergency shelters, supportive housing, single-room occupancy housing, and transitional housing. On September 17, 2024, the council voted to **extend the moratorium** for 10 months and 15 days.

- Governor Newsom warned Norwalk to reverse the ban (Sept 16, 2024). The state stripped Norwalk of certain housing funds.
- The state filed a lawsuit (Nov 4, 2024).
- Settlement announced: Norwalk agreed to overturn the ban, pay $250,000 into a housing trust fund, and accept state monitoring. [CITED: gov.ca.gov/2025/09/05 (settlement); calmatters.org/housing/2024/10 (Newsom retaliation); abc7.com/amp/post/norwalk-council-votes-expand-moratorium (Sept 2024 extension)]

**Stance implication:** The shelter ban was UNANIMOUS — all 5 members are on record in favor of the ban. This provides direct evidence for the `homelessness-response` and/or `housing` compass topics for all 5 members. The chairs placement should reflect the council's restrictive stance (ban on shelters/supportive housing = low-tolerance enforcement-first approach to homelessness).

**Pre-tenure attribution rule:** Standard A5 rule applies — only attribute pre-2020 votes to Ramirez (2003+) and pre-2017 votes are Ramirez-only. Ayala (2017), Rios (2017), Perez (2017), Valencia (2020) were not seated before their respective election years.

### Per-Member Stance Profile

#### Jennifer Perez — MEDIUM RECORD (seated 2017, current Mayor)
- **Homelessness/Housing:** Unanimously voted for shelter ban + extension (Aug–Sept 2024). [CITED: ABC7/CalMatters coverage]
- **Economic development / businesses:** CA JPIA executive committee role; California Contract Cities Association president — strong regional economic development orientation.
- **Research order:** 2nd or 3rd. Record since 2017; look for votes on housing element, zoning, budget issues.
- **Key search:** "Jennifer Perez Norwalk" council minutes 2018–2025; CA Contract Cities quotes.

#### Margarita L. Rios — MEDIUM RECORD (seated 2017, current Vice Mayor)
- **Homelessness/Housing:** Unanimously voted for shelter ban (2024); served as 2024 rotational Mayor during the ban period — Rios's "2024 theme of Safe and Clean resonated throughout the city" (per her bio page). [CITED: norwalkca.gov/government/mayor_and_city_council/rios.php bio text]
- **Public safety:** 20+ years law enforcement career; school resource officer; Criminal Justice degree. Strong public-safety stance evidence likely.
- **Community development:** Former Norwalk-La Mirada USD School Board member (7 years); STEM/PLTW advocate.
- **Research order:** 2nd or 3rd. Rich background — look for law-enforcement-policy votes.
- **Name-collision risk:** "Margarita Rios" is a common name — verify each source is the Norwalk council member specifically.

#### Tony Ayala — MEDIUM RECORD (seated 2017, served as Mayor Dec 2024–Dec 2025)
- **Homelessness/Housing:** Unanimously voted for shelter ban + extension (2024); served as Mayor DURING the Newsom lawsuit period (Nov 2024 onward). Quoted re: "strengthening safety net for families" at Dec 2024 reorganization.
- **Research order:** 3rd. Record since 2017; look for Mayor statements during shelter ban controversy (Fall 2024–Spring 2025).
- **Name-collision risk:** "Tony Ayala" and "Anthony Ayala" — verify full context. Different from the Santa Clarita Ayala (Mariel Ayala, 143). Search "Norwalk" to disambiguate.

#### Rick Ramirez — RICHEST RECORD (seated 2003 — longest tenure by far)
- **Homelessness/Housing:** Voted for shelter ban + extension (2024). Served as Mayor 2007-2008, 2021-2022 ([[thenorwalkpatriot.com/news/2021/12/23]]). Rich 20+ year voting record available.
- **Public safety:** 30 years law enforcement; public safety is stated top priority throughout tenure.
- **Research order:** 1st. Longest record — 2003 to present. Most likely to have documented stances across multiple compass topics.
- **Key search:** Norwalk council minutes 2003–2025; Norwalk Patriot archives; law enforcement policy votes.

#### Ana Valencia — THINNEST RECORD (seated 2020)
- **Homelessness/Housing:** Voted for shelter ban + extension (2024). Elected 2020 — fewer years of council record.
- **Background:** Education background; worked on "pressing and fundamental needs" per bio.
- **Research order:** Last. Shortest council tenure of the 5; fewer documented votes. Expect honest blanks for some topics.

---

## Common Pitfalls

### Pitfall 1: Leaving the LOCAL_EXEC Mayor Office in Place
**What goes wrong:** Executor skips converting Ayala's LOCAL_EXEC Mayor office, treating it as a correctly-modeled separate mayoral seat.
**Why it happens:** The DB already has it; the pattern of directly-elected Mayors (Lancaster/Pasadena/Inglewood) uses this same office type.
**How to avoid:** Norwalk's mayor IS ROTATIONAL — confirmed by official city site. The LOCAL_EXEC office is a mis-seed. Follow the Downey/West Covina/Burbank model: convert to council seat, drop orphan LOCAL_EXEC district, set rotational title on the CORRECT current person (Perez, not Ayala).

### Pitfall 2: Setting Ayala's Title as Mayor
**What goes wrong:** Executor sees Ayala listed as "Mayor" in the DB and sets title='Mayor' on his converted council seat.
**Why it happens:** The DB was seeded with Ayala as Mayor (he was Mayor during 2024-2025). Pattern-matching fires on DB state.
**How to avoid:** The Dec 9, 2025 reorganization changed the Mayor to Jennifer Perez and Vice Mayor to Margarita Rios. As of June 2026, Ayala is a regular Councilmember. Set Perez = Mayor, Rios = Vice Mayor, Ayala = Councilmember.

### Pitfall 3: Using the Broken Ramirez Image URL
**What goes wrong:** Wave 3 executor uses the existing DB-seeded image URL `638169002126970000.jpg` to verify Ramirez's headshot and gets a 404.
**Why it happens:** The DB has this old filename from the bulk seed. It was a valid CDN path at seeding time but has since been replaced.
**How to avoid:** Use the confirmed working URL: `Image/Government/Mayor And City Council/Rick Ramirez/RR - Digital Images - Copy.jpg?t=202508201332230`. The Ramirez image in the DB must be replaced/re-uploaded even if the pixel dimensions are otherwise correct.

### Pitfall 4: Missing the Double-Space in the Rios Image URL
**What goes wrong:** Curl fails to fetch Rios's headshot because the path has `Margarita  Rios` (two spaces) but the encoded URL uses `Margarita%20Rios` (one space).
**Why it happens:** The HTML source shows two spaces in the folder name: `Margarita  Rios`. Standard URL encoding collapses two spaces to one.
**How to avoid:** Encode the path as `Margarita%20%20Rios` (double `%20`) or use Python `urllib.parse.quote('Margarita  Rios')` which correctly encodes both spaces. Confirmed working: the URL with `%20%20` returns HTTP 200 (28,505 bytes).

### Pitfall 5: Attributing the Shelter Ban Vote to Pre-Tenure Members
**What goes wrong:** Stance research agent attributes the Aug 2024 shelter ban to all 5 members but notes it was "unanimous" without checking who was seated by Aug 2024.
**Why it happens:** All 5 were seated by 2020; the 2024 vote is within all their tenures. This pitfall is actually SAFE — all 5 were seated in Aug 2024.
**How to avoid:** No exclusion needed for the shelter ban — all 5 voted. However, for OLDER votes (pre-2017 for Ramirez), only attribute to Ramirez.

### Pitfall 6: Conflating norwalk.org and norwalkca.gov
**What goes wrong:** Fetching images or pages from `norwalk.org` instead of `norwalkca.gov` (both redirect to the same Revize CMS but the canonical domain is `norwalkca.gov`).
**Why it happens:** Google results show both domain aliases. Both work and serve the same Revize content.
**How to avoid:** Prefer `norwalkca.gov` as the canonical domain for `photo_origin_url` fields. The Ramirez corrected image was found on `norwalk.org` but also works on `norwalkca.gov`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chamber merge | Custom office-move logic | Proven SQL template from `1026_burbank_reconcile.sql` | Idempotent guards already written |
| LOCAL_EXEC → At-Large conversion | New separate office | Convert existing Ayala LOCAL_EXEC office in-place (change chamber_id, district_id, district_type, title) | El Monte/Inglewood inverse patterns exist; fewer new rows |
| Mayor title-on-seat | NEW LOCAL_EXEC office | Update `title` field on Perez's existing At-Large seat | West Covina 1011 + Downey + Burbank precedent |
| Headshot fetch | Python scraper or WebFetch | `curl -L <norwalkca.gov URL>` | NO WAF; HTTP 200 with standard curl; simpler than Burbank |
| Stance research | Batch all 5 officials | One agent at a time | Rate-limit rule ([[feedback_stance_research_one_at_a_time]]) |
| Shelter ban stance | Assume it's not evidence | Use for all 5 members (unanimous vote, all seated Aug 2024) | Unanimous vote = direct evidence for all 5; key homelessness-response anchor |

**Key insight:** Norwalk's reconcile is slightly more complex than Burbank because the LOCAL_EXEC Mayor office must be converted, but the roster is clean (no unlinking, no new creates) and the headshots are simpler (no special UA needed, just a corrected Ramirez URL).

---

## Code Examples

### Headshot Fetch Pattern (Revize CMS, no UA required)
```bash
# Standard curl — NO special User-Agent needed; -L follows the 302 redirect
curl -s -L -o perez.jpg \
  "https://www.norwalkca.gov/Image/Government/Mayor%20And%20City%20Council/Jennifer%20Perez/JP%20-%20Digital%20Images%20-%20Copy.jpg?t=202512101807300"
# Returns HTTP 200, image/jpeg, 33919 bytes

# CRITICAL: Rios has double-space in folder name — use %20%20
curl -s -L -o rios.jpg \
  "https://www.norwalkca.gov/Image/Government/Mayor%20And%20City%20Council/Margarita%20%20Rios/MR%20-%20Digital%20Images%20-%20Copy.jpg?t=202512101808020"
# Returns HTTP 200, image/jpeg, 28505 bytes

# Ramirez — use CORRECTED filename (old 638169... URL is 404)
curl -s -L -o ramirez.jpg \
  "https://www.norwalkca.gov/Image/Government/Mayor%20And%20City%20Council/Rick%20Ramirez/RR%20-%20Digital%20Images%20-%20Copy.jpg?t=202508201332230"
# Returns HTTP 200, image/jpeg, 27965 bytes
```

### LOCAL_EXEC Mayor → At-Large Council Seat Conversion (Wave 1 — key Norwalk-specific step)
```sql
-- Source: El Monte (151) / Downey (150) inverse-pattern; Norwalk's LOCAL_EXEC Mayor is a mis-seed
-- Step 1: Move Ayala's LOCAL_EXEC office into the survivor At-Large chamber and district
UPDATE essentials.offices
SET
  chamber_id = '97397b0f-61f1-4251-bf29-3fd5f99c0108',    -- survivor chamber
  district_id = '5677c0ab-e038-45d9-a744-141b28329036',   -- survivor At-Large district
  title = 'Councilmember'
WHERE id = '5edc1993-...'                                  -- Ayala's LOCAL_EXEC office
  AND chamber_id != '97397b0f-61f1-4251-bf29-3fd5f99c0108'; -- idempotent

-- Step 2: Drop the now-orphaned "Norwalk Mayor" LOCAL_EXEC district
-- (Only after confirming no other offices point to it)
DELETE FROM essentials.districts
WHERE id = '4126e079-d0ff-494e-8371-d6ef2e98da3f'         -- LOCAL_EXEC "Norwalk Mayor" district
  AND (SELECT COUNT(*) FROM essentials.offices WHERE district_id='4126e079-d0ff-494e-8371-d6ef2e98da3f') = 0;
-- Resolve exact UUIDs by ext_id query at apply time
```

### Rotational Mayor/VP Title on Seat (Wave 2)
```sql
-- Source: 1011_west_covina_complete.sql + 1027_burbank_complete.sql patterns
-- Set Mayor title on Perez's At-Large council seat
UPDATE essentials.offices
SET title = 'Mayor'
WHERE politician_id = '3ed36508-9ae9-41af-aaba-e5e39bb87aa7'  -- Jennifer Perez
  AND title != 'Mayor';  -- idempotent

-- Set Vice Mayor title on Rios's At-Large council seat
UPDATE essentials.offices
SET title = 'Vice Mayor'
WHERE politician_id = 'bd64253b-0bd1-4b9f-85b1-76180c760d07'  -- Margarita Rios
  AND title != 'Vice Mayor';  -- idempotent

-- All others = Councilmember (Ayala already set in Wave 1; normalize Ramirez/Valencia too)
-- official_count = 5 (rotational Mayor is one of the 5 council seats — West Covina/Burbank model)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Assuming norwalkca.gov is WAF-403 (like Downey/Glendale) | norwalkca.gov has NO WAF — HTTP 200 direct curl | Phase 155 research | No Chrome UA needed; simpler headshot fetch |
| DB LOCAL_EXEC Mayor office treated as correct | Norwalk is rotational — LOCAL_EXEC is a mis-seed | Phase 155 research | Convert Ayala's office to At-Large council seat in Wave 1 |
| Ayala = current Mayor (DB state) | Perez = current Mayor, Rios = Vice Mayor (Dec 9, 2025 reorganization) | Phase 155 research | Set titles on Perez/Rios, not Ayala |
| Ramirez headshot via old `638169002126970000.jpg` URL | Updated URL: `RR - Digital Images - Copy.jpg` | Phase 155 research | Old URL 404s on CDN; must use corrected path |

**Deprecated/outdated in this phase:**
- The `638169002126970000.jpg` Ramirez image filename — replaced by the standard `{Initials} - Digital Images - Copy.jpg` pattern used for all other members.
- The notion that Norwalk has a directly-elected Mayor (the DB's LOCAL_EXEC model is incorrect).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The Dec 9, 2025 reorganization results (Perez=Mayor, Rios=Vice Mayor) are still current as of June 2026 (no mid-year change) | Roster Verdict | Very low risk — rotational Mayors serve 1-year terms Dec–Dec; next rotation Dec 2026 |
| A2 | All 3 incumbents (Ramirez/Rios/Valencia) won in the Nov 5, 2024 election | Roster Verdict | Low risk — all 3 are currently listed on the official city site with active bios; their Ballotpedia pages list them as 2024 candidates but vote totals not fetched |
| A3 | Existing DB headshots for the 5 members don't have superimposed graphics (seeded from official sources) | Headshots | Low risk — images came from the same Revize CMS at seeding time; verify at Wave-3 apply time |
| A4 | The shelter ban vote was unanimous for ALL 5 council members (not a split vote with one dissenter) | Stances | Low risk — multiple news sources confirm "unanimous"; verified in gov.ca.gov/abc7/CalMatters coverage |
| A5 | norwalkca.gov has no CVRA district-election lawsuit or transition pending | Form of Government | Medium risk — no evidence found, but was not searched exhaustively; if a CVRA challenge exists, district structure would differ |

**Highest operational risk:** A5 — a CVRA challenge not yet in the public record. However, the official city site explicitly describes the council as at-large as of June 2026 with no mention of pending district transitions.

---

## Open Questions (RESOLVED — no blockers)

All four critical questions are resolved. No planning blockers remain.

1. **Form of government (D-02):** RESOLVED. At-large + rotational mayor. DB LOCAL_EXEC Mayor is a mis-seed — convert in Wave 1. See "Form of Government — VERDICT."

2. **Current roster (D-03):** RESOLVED. All 5 DB rows confirmed current. Perez=Mayor, Rios=Vice Mayor as of Dec 9, 2025. No unlinking needed. See "Roster — VERDICT."

3. **Headshots (D-04):** RESOLVED. norwalkca.gov has NO WAF. All 5 official portraits accessible at HTTP 200 via standard curl. Ramirez's old URL is broken — corrected URL confirmed HTTP 200. See "Headshots" section.

4. **Stance sources (Wave 4):** ASSESSED. The unanimous 2024 shelter ban is the key policy anchor for all 5 members. Ramirez richest (2003+), Valencia thinnest (2020+). See "Stance Sources" section.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase MCP (`mcp__supabase-local`) | All waves | Confirmed (prior phases 142–154) | Live production | psql via EV-Accounts DATABASE_URL |
| curl with redirect follow (`-L`) | Wave 3 headshot download | Confirmed (all 5 URLs HTTP 200) | System curl | Python urllib (also confirmed) |
| norwalkca.gov Revize image system | Wave 3 headshots | Confirmed NO-WAF | HTTP 200 verified | Ballotpedia / Facebook campaign pages |
| EV-Accounts git repo | Migration commit | Confirmed (master branch) | — | N/A |

**Missing dependencies with no fallback:** None.

---

## Validation Architecture

### Structural Assertions (Wave 1 completion gate)

| Check | SQL Pattern | Expected Result |
|-------|-------------|-----------------|
| geo_id backfilled | `SELECT geo_id FROM essentials.governments WHERE id='15897159-e6bf-4d7e-9b45-44d62c4ebb8a'` | `'0652526'` |
| Only one 'City Council' chamber | `SELECT COUNT(*) FROM essentials.chambers WHERE government_id='15897159-...' AND name='City Council'` | 1 |
| DOOMED chamber deleted | `SELECT COUNT(*) FROM essentials.chambers WHERE id='e7e787f7-4695-4747-9dd7-b111472ca9ae'` | 0 |
| All 5 offices in survivor chamber | `SELECT COUNT(*) FROM essentials.offices WHERE chamber_id='97397b0f-61f1-4251-bf29-3fd5f99c0108'` | 5 |
| All 5 offices bidirectional | `SELECT COUNT(*) FROM essentials.offices o JOIN essentials.politicians p ON p.id=o.politician_id WHERE o.chamber_id='97397b0f...' AND p.office_id != o.id` | 0 |
| Doomed At-Large district deleted | `SELECT COUNT(*) FROM essentials.districts WHERE id='f9e8037d-e311-4583-9623-3201259ba7e4'` | 0 |
| LOCAL_EXEC "Norwalk Mayor" district deleted | `SELECT COUNT(*) FROM essentials.districts WHERE id='4126e079-d0ff-494e-8371-d6ef2e98da3f'` | 0 |
| No LOCAL_EXEC offices remain under this gov | `SELECT COUNT(*) FROM essentials.offices o JOIN essentials.districts d ON d.id=o.district_id WHERE d.government_id='15897159...' AND d.district_type='LOCAL_EXEC'` | 0 |
| Ayala link repaired | `SELECT office_id FROM essentials.politicians WHERE external_id=-200876` | NOT NULL |
| Ramirez link repaired | `SELECT office_id FROM essentials.politicians WHERE external_id=-201327` | NOT NULL |
| Rios link repaired | `SELECT office_id FROM essentials.politicians WHERE external_id=-201328` | NOT NULL |
| Valencia link repaired | `SELECT office_id FROM essentials.politicians WHERE external_id=-201329` | NOT NULL |

### Roster Assertions (Wave 2 completion gate)

| Check | Expected |
|-------|----------|
| official_count on survivor chamber | 5 |
| All 5 district labels are 'At-Large' | 5 offices with district label='At-Large' |
| Perez's office title | 'Mayor' |
| Rios's office title | 'Vice Mayor' |
| Ayala's office title | 'Councilmember' |
| No LOCAL_EXEC office under this gov | 0 rows |
| All 5 politicians have non-null office_id | 5 non-null values |

### Split-Section Check (post-Wave-1)
```sql
-- Source: feedback_section_split_check — run after every seeding phase; expect 0 rows
SELECT g.name, COUNT(DISTINCT gb.mtfcc) section_count
FROM essentials.governments g
JOIN essentials.government_bodies gb ON gb.government_id = g.id
WHERE g.id = '15897159-e6bf-4d7e-9b45-44d62c4ebb8a'
GROUP BY g.name HAVING COUNT(DISTINCT gb.mtfcc) > 1;
-- Expected: 0 rows (Norwalk is not in the known split-section defect set; single At-Large district after consolidation)
```

### Quick Health Check Post-Wave-1
```sql
SELECT
  (SELECT geo_id FROM essentials.governments WHERE id='15897159-e6bf-4d7e-9b45-44d62c4ebb8a') as geo_id,
  (SELECT COUNT(*) FROM essentials.chambers WHERE government_id='15897159-e6bf-4d7e-9b45-44d62c4ebb8a') as chamber_count,
  (SELECT official_count FROM essentials.chambers WHERE id='97397b0f-61f1-4251-bf29-3fd5f99c0108') as official_count;
-- Expected: geo_id='0652526', chamber_count=1, official_count=5
```

### Headshot Verify Checkpoints (Wave 3 — human-verify blocking)
- All 5 images: correct person (identity verified against official bio page name match)
- All 5 images: 600×750 pixels, 4:5 ratio
- All 5 images: no superimposed text/graphics
- Ramirez: existing DB image replaced with corrected URL (`RR - Digital Images - Copy.jpg`)
- photo_origin_url set to `norwalkca.gov` canonical URL for all 5

### Stance Citation Audit (Wave 4 — blocking human-verify checkpoint)
- 0 uncited answers (`inform.politician_context` exists for every `inform.politician_answers` row)
- 0 judicial-topic rows (Norwalk is council-manager; no judicial topics)
- 0 hardcoded retired topic IDs (verify against live `inform.compass_stances`)
- Shelter ban (Aug/Sept 2024) anchors at least one stance for all 5 members

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
| Wrong-person headshot upload | Integrity | Verify each image against official norwalkca.gov council page bio — name appears in bio text confirming identity |
| Stale LOCAL_EXEC Mayor title (Ayala) | Integrity | Research confirms Perez=Mayor as of Dec 2025; pre-flight confirms before setting titles |
| Broken Ramirez image URL | Integrity | Use corrected URL `RR - Digital Images - Copy.jpg` — confirmed HTTP 200 in research |
| Retired compass topic ID in stances | Integrity | Query live `inform.compass_stances` at apply time, never hardcode |

---

## Sources

### Primary (HIGH confidence)
- `norwalkca.gov/government/mayor_and_city_council/index.php` — current council roster (Perez=Mayor, Rios=VM) + at-large + rotational mayor confirmed via explicit site text
- `norwalkca.gov/news_detail_T3_R66.html` — Dec 9, 2025 press release: Perez selected Mayor, Rios selected Vice Mayor (one-year term)
- `norwalkca.gov/news_detail_T3_R23.html` — Dec 10, 2024 press release: Ayala selected Mayor, Perez selected Vice Mayor (one-year term; confirms prior cycle)
- Individual bio pages: `norwalkca.gov/government/mayor_and_city_council/{member}.php` — titles, elections, bios, image URLs verified for all 5
- Python urllib redirect-following test — all 5 headshot URLs confirmed HTTP 200 image/jpeg

### Secondary (MEDIUM confidence)
- `Ballotpedia.org` — Nov 5, 2024 at-large election candidates (Ramirez/Rios/Valencia + challengers Lopez/Garcia) confirmed
- `gov.ca.gov/2024/09/16` + `gov.ca.gov/2025/09/05` — Norwalk shelter ban events + settlement (unanimous vote evidence)
- `calmatters.org/housing/2024/10` — Newsom vs Norwalk shelter ban; "builders remedy" context
- `abc7.com` — Sept 17, 2024 moratorium extension vote coverage
- `thenorwalkpatriot.com` — Ramirez 2021 Mayor selection; historical record

### Tertiary (LOW confidence — context only)
- `norwalkchamber.com/elected-officials/` — secondary roster confirmation
- `citizenportal.ai` — Dec 2025 reorganization article (consistent with primary source; blocked on WebFetch but confirmed by same news)
- `facebook.com/cityofnorwalkca` — Dec 9, 2025 reorganization post (consistent with primary source)

---

## Metadata

**Confidence breakdown:**
- Form of government (at-large + rotational mayor): HIGH — confirmed via explicit official city site text; no contradictory sources found
- Current roster (all 5 confirmed, Perez=Mayor/Rios=VM): HIGH — official press release + bio pages cross-confirm
- WAF status (NO WAF, direct curl works): HIGH — curl HTTP 200 confirmed on all 5 portrait URLs
- Headshot URLs (all 5 with HTTP 200): HIGH — Python urllib test confirmed all 5 live
- Ramirez corrected URL: HIGH — `RR - Digital Images - Copy.jpg` confirmed HTTP 200 (27,965 bytes)
- Stance depth (shelter ban unanimous, Ramirez richest): MEDIUM — general controversy confirmed; granular per-member vote/statement not fully mined

**Research date:** 2026-06-22
**Valid until:** 2026-09-22 (council is stable until December 2026 reorganization; no CVRA transition anticipated)

---

## Live Browse Link
https://essentials.empowered.vote/results?browse_geo_id=0652526&browse_mtfcc=G4110
