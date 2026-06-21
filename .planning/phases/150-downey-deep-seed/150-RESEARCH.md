# Phase 150: Downey deep-seed - Research

**Researched:** 2026-06-20
**Domain:** City of Downey, CA — reconcile partial seed, form-of-government verification, current roster, headshots, stance evidence
**Confidence:** HIGH (roster + government structure); MEDIUM (headshot source paths); MEDIUM (stance evidence depth varies by member)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Reconcile existing seed (backfill geo_id, merge two 'City Council' chambers, idempotent SQL). NOT greenfield.
- D-02: Relabel At-Large → District 1–5 (Palmdale/Pomona by-district relabel pattern). Do NOT tear down and rebuild.
- D-02a: Rotational-mayor handling — **DEFERRED TO RESEARCH** (default = Palmdale rotational pattern if confirmed).
- D-03: Unlink stale members (null office↔politician link), keep their politician/stance/photo rows. Seat current members.
- D-04: Direct curl from downeyca.org first; fallback to operator in-browser downloads + alternate hosts.
- Structural migrations register in `schema_migrations`; headshot + stance migrations are AUDIT-ONLY.
- Evidence-only CHAIRS model stances; NO judicial-* topics; ONE agent at a time.

### Claude's Discretion
- Exact district→member mapping (research-confirmed here).
- Rotational-mayor LOCAL_EXEC resolution (research-confirmed here — Palmdale default applies).
- Per-member stance chairs.
- Dedupe mechanics and SQL ordering (follow 146/147/149 patterns).

### Deferred Ideas (OUT OF SCOPE)
- Downey Unified school district (gov 32e2fad0) — separate government.
- Run split-section check post-reconcile — expect 0 rows.
- Phase 157 (Wave-2 close-out) — runs after all 15 cities.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DWNY-01 | Downey (0619766) deep-seeded — government + roster + headshots + evidence-only stances | Form of government confirmed; full current roster mapped; headshot sources identified; stance evidence scouted per member |
</phase_requirements>

---

## Summary

Downey is a 5-seat general-law city council with a **rotational mayor** selected annually by the council — the Palmdale (Phase 146) pattern applies exactly. The DB currently has a defective seed: two duplicate 'City Council' chambers, 6 offices for 5 real seats, all mislabeled 'At-Large', and one stray LOCAL_EXEC row (Sosa). Research confirms the LOCAL_EXEC row must be collapsed into a normal District 2 seat with `title='Mayor'`.

The six seeded members break down as: four current (Frometa D4, Pemberton D3, Sosa D2, Trujillo D5) + one current in the orphan chamber (Trujillo) + two stale (Saab -700160 departed Nov 2020, Pelc -700161 not findable on current council). District 1 seat holder Horacio Ortiz (elected Nov 2023 special election) has **no politician row in the DB** and must be created. The reconcile thus produces: 2 unlinks (Saab + Pelc), 1 Ortiz creation, and reassignment of their 2 office rows to the correct districts.

downeyca.org is **WAF-403 to all curl** regardless of user-agent — operator in-browser download is required for all 5 portraits. SCAG has a confirmed-accessible photo for Frometa. Ballotpedia, campaign sites, and news sources provide fallback paths for the others. Stance evidence is findable for all 5 members at varying depth: Sosa and Trujillo have the richest records (multi-year statements + 2024 campaign positions); Ortiz and Pemberton are thin (elected Nov 2023, limited council vote record); Frometa has intermediate depth.

**Primary recommendation:** Apply the exact Palmdale (146) reconcile pattern — 2 structural migrations (985 reconcile + 986 roster), then audit-only headshots (987) and per-member stances (988–992). Pre-flight must confirm the precise office-to-district mapping before any write.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Government structure (geo_id, chambers, districts) | Database / Storage | — | Pure data reconcile; no frontend change in this phase |
| Roster management (seat/unlink officials) | Database / Storage | — | SQL writes to essentials schema |
| Headshot processing (crop, resize, upload) | Local operator pipeline | Supabase Storage | Pillow → Storage via service-role key |
| Stance ingestion | Database / Storage | — | inform schema inserts via audit-only SQL |
| Browse/compass rendering | Frontend (existing) | API / Backend | No change needed; Downey renders once geo_id backfilled |

---

## Standard Stack

This phase uses the same proven stack as Phases 146–149. No new packages.

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Supabase MCP (`mcp__supabase-local`) | — | Live DB writes | Production DB access |
| Pillow (Python) | system | Headshot 4:5 crop → 600×750 resize | Established pipeline; Lanczos filter |
| curl | system | Headshot download attempt | Direct protocol; WAF bypass attempt before operator fallback |

### Migration Templates
| Template | Location | Use |
|----------|----------|-----|
| `946_pasadena_reconcile.sql` | `C:/EV-Accounts/backend/migrations/` | Geo_id backfill + chamber merge + district relabel pattern |
| `947_pasadena_complete.sql` | `C:/EV-Accounts/backend/migrations/` | Roster link repair + official_count + new member creation |
| `926_pomona_reconcile.sql` | `C:/EV-Accounts/backend/migrations/` | Earlier 3-office move-then-delete pattern |

---

## Package Legitimacy Audit

No new external packages are installed in this phase — the established headshot + stance pipeline is reused.

---

## Architecture Patterns

### System Architecture Diagram

```
downeyca.org (WAF-403) / SCAG / news / campaign sites
        |
        v
[Operator: in-browser download → verify identity → 4:5 crop → 600×750 resize]
        |
        v
[Supabase Storage: politician_photos/{uuid}-headshot.jpg]
        |
        v
[inform.politician_answers + politician_context: stance INSERT per member]
        |
[essentials schema writes (structural migrations 985/986)]
        |
        v
[Browse + compass UI — Downey appears via geo_id 0619766 once backfilled]
```

### Recommended Project Structure

Follows established 4-wave pattern:

```
C:/EV-Accounts/backend/migrations/
├── 985_downey_reconcile.sql        # STRUCTURAL: geo_id, chamber merge, district relabel
├── 986_downey_complete.sql         # STRUCTURAL: roster seat/unlink, Ortiz create, official_count
├── 987_downey_headshots.sql        # AUDIT-ONLY: politician_images inserts
├── 988_hector_sosa_stances.sql     # AUDIT-ONLY
├── 989_mario_trujillo_stances.sql  # AUDIT-ONLY
├── 990_claudia_frometa_stances.sql # AUDIT-ONLY
├── 991_dorothy_pemberton_stances.sql # AUDIT-ONLY
└── 992_horacio_ortiz_stances.sql   # AUDIT-ONLY (may be 0 stances — thin record)
```

### Pattern 1: Rotational Mayor as Title on Seat (Palmdale Model)

**What:** Mayor is a title held by a rotating council member. No separate Mayor office or LOCAL_EXEC district.
**When to use:** Any CA general-law city where council selects mayor from within its own body.
**Example:**
```sql
-- From 918_palmdale_reconcile.sql pattern:
-- Set title='Mayor' on the district seat of the current rotational mayor.
-- All other seats title='Councilmember'.
-- NO separate LOCAL_EXEC district row created.
UPDATE essentials.offices
SET title = 'Mayor'
WHERE id = '<sosa_office_id>'  -- office cc3bacd0 (current LOCAL_EXEC to repurpose)
AND politician_id = (SELECT id FROM essentials.politicians WHERE external_id = 675353);

-- The LOCAL_EXEC district_type on office cc3bacd0's district must change to LOCAL:
UPDATE essentials.districts
SET district_type = 'LOCAL'
WHERE id = '<sosa_district_id>';
```
[VERIFIED: Phases 146 Palmdale, 143 Santa Clarita, 144 Glendale — all use this pattern]

### Pattern 2: Move-Then-Delete Chamber Merge (Pasadena/Pomona Model)

**What:** Move all offices from doomed chamber into survivor, assert doomed is empty, delete it.
**When to use:** Anytime two chambers share a name/slug and one is orphaned.
**Example:**
```sql
-- Source: 946_pasadena_reconcile.sql
UPDATE essentials.offices SET chamber_id = '<survivor_uuid>'
WHERE chamber_id = '<doomed_uuid>';

-- Assert empty before delete
DO $$ BEGIN
  IF (SELECT COUNT(*) FROM essentials.offices WHERE chamber_id = '<doomed_uuid>') > 0
  THEN RAISE EXCEPTION 'Doomed chamber not empty — STOP';
  END IF;
END $$;

DELETE FROM essentials.chambers WHERE id = '<doomed_uuid>';
```
[VERIFIED: Phases 146, 147, 149 — standard move-then-delete pattern]

### Anti-Patterns to Avoid
- **Creating a separate LOCAL_EXEC Mayor district for a rotational mayor:** Downey's mayor is council-selected; use `title='Mayor'` on the district seat, not a new LOCAL_EXEC office.
- **Guessing district numbers without official confirmation:** The CVRA-transition district map changed in 2024-2025; always confirm occupant→district pairing from official sources.
- **Inserting Ortiz without a pre-flight check for existing rows:** Run `WHERE external_id = <new_id>` guard; always query politician rows by name first.

---

## D-02a Resolution: Form of Government — CONFIRMED ROTATIONAL MAYOR

**Verdict: Apply the Palmdale (146) rotational-mayor pattern. NO separate LOCAL_EXEC Mayor row.**

### Evidence

1. **Official city site (downeyca.org — confirmed via search result snippet):** "The Mayor, as well as the Mayor Pro Tem, are selected annually by and among the members of the City Council to serve for a period of one year." [VERIFIED: downeyca.org/our-city/departments/city-clerk/changes-to-downey-s-election-system — confirmed via web search result text]

2. **Current mayor:** Hector Sosa (District 2), selected December 2024 at the annual mayor-selection meeting. [VERIFIED: downeychamber.org/downey-area-officials + LegiStorm + Instagram @asmblancapacheco post]

3. **Mayor Pro Tem:** Horacio Ortiz (District 1), selected at the same December 2024 meeting. [VERIFIED: downeychamber.org/downey-area-officials]

4. **No directly-elected mayor:** Downey's November 2026 transition to all-5-single-member districts explicitly considered a "4+1" option (4 districts + at-large elected Mayor) and REJECTED it — confirming the council has never had a directly-elected mayor. [VERIFIED: thedowneypatriot.com — "Downey moves forward with new electoral system, creating fifth district"]

**Implementation instruction for planner:** Collapse the stray LOCAL_EXEC row (office `cc3bacd0`, Hector Sosa) into District 2 by:
- Updating the office's district_id to point at what will be the "District 2" district row
- Setting `district_type = 'LOCAL'` on that district row (currently it is LOCAL_EXEC)
- Setting `title = 'Mayor'` on Sosa's office row (was 'Council Member' or similar)
- Ensuring `official_count = 5` on the survivor chamber (all 5 = council seats; no separate Mayor)

---

## D-03 Resolution: Current Roster — DB Mapping

### Confirmed Current Roster (as of 2026-06-20)

| District | Member | Title | Seated | Source |
|----------|--------|-------|--------|--------|
| District 1 | Horacio Ortiz | Mayor Pro Tem | Dec 2023 (special) + re-elected Nov 2024 | [VERIFIED: downeychamber.org, LegiStorm, Downey Patriot, LA Vote results] |
| District 2 | Hector Sosa | Mayor (rotational) | Dec 2022 → re-elects not needed until 2026 | [VERIFIED: downeychamber.org, LegiStorm, downeyca.org search snippets] |
| District 3 | Dorothy Pemberton | Mayor Pro Tem (outgoing after Dec 2024 selection) | Dec 2023 (special) + re-elected Nov 2024 | [VERIFIED: downeychamber.org, LA Vote results 4324 — 68.44%] |
| District 4 | Claudia M. Frometa | Councilmember | Dec 2018 + re-elected Nov 2022 | [VERIFIED: downeychamber.org, LegiStorm, Voter's Edge] |
| District 5 | Mario Trujillo | Councilmember | Dec 2020 + re-elected Nov 2024 | [VERIFIED: downeychamber.org, LA Vote results 4324 — 64.78%] |

### District Election Cycle Notes
- Districts 1, 3, 5 elect in odd years (next: Nov 2026 under NEW all-single-member map)
- Districts 2, 4 elect in even years (next: Nov 2026 for D4; D2 not up until 2026)
- The new 5-district map (all single-member) takes effect at the November 2026 election — the current seated members (especially Trujillo in D5 which was previously at-large) continue until their terms end

### Stale Members (to unlink — do NOT delete their politician/stance/photo rows)

| Seeded Person | ext_id | Status | Why Stale |
|--------------|--------|--------|-----------|
| Alex Saab | -700160 | STALE — departed Nov 2020 | Term-limited out of District 5; Mario Trujillo replaced him. [VERIFIED: Downey Latino News, Downey Patriot "Alex Saab thanks community for 8 years"] |
| Don Pelc | -700161 | STALE — not findable on current council | No source confirms this person on Downey council 2022-2026. Likely a pre-2020 or inaccurate seed. [ASSUMED — zero sources confirm current service; treat as stale] |

### DB State After Reconcile (target)

| ext_id | Person | Seat | DB Action |
|--------|--------|------|-----------|
| 675353 | Hector Sosa | District 2, `title='Mayor'` | Relabel district to "District 2" LOCAL; set `title='Mayor'` on office |
| 675360 | Dorothy Pemberton | District 3 | Relabel district to "District 3" |
| 675361 | Claudia Frometa | District 4 | Relabel district to "District 4" |
| -201200 | Mario Trujillo | District 5 | Move from orphan chamber (a30fd533) to survivor (7cb8a90c); relabel district "District 5" |
| -700160 | Alex Saab | — | Unlink: null both `offices.politician_id` and `politicians.office_id`; repurpose his office row for Ortiz (District 1) |
| -700161 | Don Pelc | — | Unlink: null both pointers; repurpose his office row OR use as the District seat for a remaining district |
| NEW -700XXX | Horacio Ortiz | District 1 | Create new politician row; seat into repurposed office; assign District 1 district row |

**Next custom ext_id:** The CONTEXT.md does not state a cap. The most recent custom ext_ids used are in the -700xxx range. Check `SELECT MIN(external_id) FROM essentials.politicians WHERE external_id < 0` and confirm the next free slot above -701000. Likely **-700985** or the next sequential after the highest used -700xxx. Pre-flight must confirm.

### Office-to-District Relabel Map (6 existing office rows → 5 district seats)

The 6 offices currently in the DB must be rationalized to 5. Two strategies used in prior phases:
- **Repurpose stale office rows:** Saab's office (`44ca5c68`) → District 1 (Ortiz); Pelc's office (`2ecc0a3e`) → one of D2/D3/D4/D5 as needed (or eliminate if other districts have their own offices).

The planner must run a pre-flight SELECT to confirm which district UUID each of the 5 At-Large district rows currently references before assigning. The exact SQL pairing is a planner/implementer task (Claude's Discretion per CONTEXT.md D-02).

---

## D-04 Resolution: Headshots — WAF Status and Sources

### WAF Status

**downeyca.org is WAF-403 to all curl, regardless of user-agent.** Both WebFetch and curl with Chrome UA return 403. [VERIFIED: direct curl tests in this session — HTTP 403 with default UA and full Chrome UA]

downeyca.org appears to run a CivicPlus/CivicEngage-based CMS with Cloudflare WAF. The WAF blocks all non-browser traffic. **Operator in-browser download is required for all 5 council member portraits.**

### Photo Source Map per Member

| Member | Primary Source | URL Pattern / Notes | Confidence |
|--------|---------------|---------------------|------------|
| **Claudia Frometa (D4)** | SCAG profile | `https://scag.ca.gov/sites/default/files/styles/memeber_image/public/2024-08/claudia-frometa.jpg?itok=sHDJLwxt` — HTTP 200 confirmed by curl | HIGH [VERIFIED: curl returned 200] |
| **Hector Sosa (D2/Mayor)** | downeyca.org official portrait (in-browser) | `/our-city/mayor-city-council/hector-sosa-district-2` — accessible via browser; operator must download | MEDIUM [ASSUMED: page exists; no curl access] |
| **Dorothy Pemberton (D3)** | downeyca.org official portrait (in-browser) | `/our-city/mayor-city-council/vacant-district-3` (URL slug uses 'vacant' but page title is Pemberton) — operator in-browser | MEDIUM [ASSUMED] |
| **Mario Trujillo (D5)** | downeyca.org official portrait (in-browser) | `/our-city/mayor-city-council/mario-trujillo-district-5` — operator in-browser | MEDIUM [ASSUMED] |
| **Horacio Ortiz (D1)** | downeyca.org official portrait (in-browser) | `/our-city/mayor-city-council/timonthy-horn-district-1` (URL slug reflects prior occupant Timothy Horn) — operator in-browser | MEDIUM [ASSUMED] |

### Fallback Sources (if official site portrait is unusable — wrong aspect, text overlay, etc.)

| Member | Fallback 1 | Fallback 2 |
|--------|-----------|-----------|
| Frometa | Campaign Facebook: facebook.com/claudiafrometa4downeycitycouncil | SCAG (already primary) |
| Sosa | Campaign Facebook / Instagram @councilman_horactiosozajr | Downey Patriot news photos |
| Pemberton | Campaign Facebook: facebook.com/dorothypembertonfordowney | Downey Latino News article photos |
| Trujillo | Ballotpedia candidate page | Downey Latino News article photos |
| Ortiz | Campaign Facebook: facebook.com/horacioortizfordowney | Downey Patriot news photos |

**No member has a confirmed zero-source honest gap** at research time — all 5 have identifiable photo sources. However, news/social photos may have superimposed text or wrong aspect ratios requiring careful selection.

### Processing Requirements (mandatory per project rules)
- Crop to 4:5 ratio FIRST (never stretch)
- THEN resize to 600×750 via Lanczos filter, q90 JPEG
- Upload to `politician_photos/{uuid}-headshot.jpg` (x-upsert)
- `type = 'default'`, `photo_license` matching real source
- No superimposed text over face — reject any "Re-Elect" banner photos

---

## Wave 4: Stance Evidence Scout

**Compass model:** CHAIRS (1–5 = discrete position statements, NOT a polarity axis). No judicial topics. Evidence-only; 100% citation required. Blank spoke is honest if no evidence found. One research agent at a time.

**Council-manager context:** Downey has an appointed City Manager. No judicial topics apply. Focus on local government topics: housing, homelessness, public safety, transportation, economic development, taxes, local-immigration.

### Evidence Summary per Member

#### Hector Sosa (D2, Mayor) — ext_id 675353
**Record depth: MEDIUM-HIGH** (elected Nov 2022; 2+ years of council + campaign statements)

Key documented positions:
- **Rent regulation:** Opposes additional rent control: "More rent control will not solve the problem at the root. We need more housing." (2022 campaign, Downey Latino News) [CITED: downeylatinonews.com/en/2022/10/ask-the-candidates-hector-sosa]
- **Homelessness:** Enforcement-first approach (anti-camping law enforcement) + wrap-around services via nonprofits. "In Downey, it is illegal to sleep overnight in our parks and sidewalks." Released 4-step homelessness plan. [CITED: thedowneypatriot.com — "Hector Sosa releases plan to reduce homelessness"]
- **Public safety:** Supports budget increases for police and fire. [CITED: downeylatinonews.com 2022]
- **Local-immigration (2025):** Called for special meeting on ICE raids, said raids are "literally terrorizing our community" — co-sponsored $25K allocation to assist ICE-impacted families. [CITED: calonews.com — "Downey's residents demand action"]
- **Economic development:** Advocates reducing city hall red tape; business-friendly streamlining. [CITED: 2022 candidate Q&A]
- **Rent control vote (2021):** Unanimous council rejection of rent control; Sosa may have been on the council — verify seating date (he was seated Dec 2022, so NOT on council for the Jan 2021 vote). Exclude pre-tenure votes.

**Expected stance coverage:** homelessness-response (enforcement-first), rent-regulation (oppose caps), public-safety-approach (pro-police), local-immigration (nuanced — opposed to raids but enforcement-background language), economic-development (anti-red-tape/business-friendly). Likely 5–8 stances.

#### Mario Trujillo (D5) — ext_id -201200
**Record depth: HIGH** (elected Nov 2020; 4+ years of council + mayor service + 2024 campaign)

Key documented positions:
- **Rent regulation:** Opposes strict caps; "balance that protects tenants from unreasonable rent hikes while also considering the interests of property owners." (2024 Downey Latino News Q&A) [CITED: downeylatinonews.com/en/2024/10/making-downey-a-destination]
- **Rent control vote (Jan 2021):** Voted with unanimous council to reject Alvarez's rent control proposal. Stated "any additional rent control measures would be redundant and unnecessary." [CITED: caanet.org/downey-rejects-rent-control-proposal + thedowneypatriot.com/articles/council-decides-against-stricter-rent-control]
- **Public safety:** Strong supporter; introduced $25K recruitment incentive for officers; authorized private security for parks. [CITED: Downey Latino News 2024]
- **Transportation:** Committed to implementing 33.6 miles of bike lanes per 2015 Downey Bicycle Master Plan. [CITED: 2024 candidate Q&A]
- **Economic development:** Recruited Sprouts grocery store; secured bowling alley/arcade for vacant Sears. [CITED: 2024 Downey Latino News Q&A]
- **Local-immigration (2025):** Pushed Downey to fight ICE raids; called raids "absolutely horrendous"; moved for special meeting and potential lawsuit. [CITED: Downey Patriot June 2025]

**Expected stance coverage:** rent-regulation (oppose caps), public-safety-approach (pro-police funding), transportation (bike-lane/multi-modal), economic-development (business attraction), local-immigration (pro-immigrant community protection). Likely 6–9 stances.

#### Claudia Frometa (D4) — ext_id 675361
**Record depth: MEDIUM** (elected Dec 2018; 6+ years; 3-time mayor; less documented in local news than Sosa/Trujillo)

Key documented positions:
- **Rent regulation / 2021 vote:** Co-voted unanimously to reject rent control (Jan 2021 meeting). Stated opposition. [CITED: thedowneypatriot.com/articles/council-decides-against-stricter-rent-control]
- **Housing:** "We need housing" — supportive of housing development. Proposed ~5% of each existing district be taken to form new D5 during redistricting. [CITED: Downey Patriot redistricting coverage]
- **Public safety:** Opposes defunding police; Downey was early adopter of body cameras/de-escalation. [CITED: Downey Legend — "Get to Know Mayor Claudia Frometa"]
- **Local-immigration (2025):** Stated "There is nothing we can do as local government" but also issued a more assertive statement: "The terror that ICE is instilling in our neighborhoods by racially profiling members of our community should not be happening." Complex/nuanced — may not land cleanly on a single chair. [CITED: calonews.com]
- **Background:** First female immigrant elected to Downey council; healthcare + emergency management background. [CITED: LegiStorm, Downey Legend]

**Expected stance coverage:** rent-regulation (oppose caps), public-safety-approach (pro-police). Immigration stance is nuanced — may be a blank or low-confidence chair. Likely 3–5 stances; honest blanks for thin areas.

#### Dorothy Pemberton (D3) — ext_id 675360
**Record depth: LOW-MEDIUM** (seated Dec 2023; only ~18 months of council; limited vote record)

Key documented positions:
- **Rent regulation:** Opposes additional rent caps: "Expenses for owners are not going down just like all other costs for the general public." Favors ADUs and supply-side approaches. [CITED: Downey Latino News 2024 candidate Q&A]
- **Public safety:** Supports current police budget pending review; "Public safety is a top priority." Does not support police budget cuts. [CITED: 2024 Downey Latino News Q&A]
- **Homelessness:** Supports outreach/services but opposes developing homeless housing in Downey. [CITED: Downey Latino News 2024]
- **Local-immigration (2025):** Co-voted for special meeting and $25K ICE-impact fund. [CITED: calonews.com]

**Expected stance coverage:** rent-regulation (oppose caps), public-safety-approach (pro-police), homelessness (outreach-yes/housing-no). Thin record → likely 2–4 stances; many honest blanks. Seated Dec 2023 — pre-tenure votes excluded.

#### Horacio Ortiz (D1, Mayor Pro Tem) — NEW POLITICIAN (must be created)
**Record depth: LOW** (seated Dec 2023; first-term; limited documented council votes)

Key documented positions:
- **Homelessness:** "The solution is not to provide more shelter." Enforcement-first; anti-camping law enforcement; opposes shelter development in Downey. [CITED: downeylatinonews.com/en/2023/10/the-solution-is-not-to-provide-more-shelter-horacio-ortiz-candidate-for-district-1]
- **Rent regulation:** Opposes additional rent control "beyond state limits." [CITED: 2023 Downey Latino News candidate Q&A]
- **Public safety:** Strong supporter; "I stand by the Downey Police Department. I will make sure they have the resources they need." Supports police substation in District 1. [CITED: 2023 Downey Latino News]
- **Local-immigration (2025):** Seconded Trujillo's motion for special meeting on ICE raids; co-voted for $25K allocation. [CITED: calonews.com]
- **Cannabis:** Opposes commercial cannabis dispensaries. [CITED: 2023 Downey Latino News]
- **Transit:** Undecided on fare-free transit; "willing to explore options." [CITED: 2023 Downey Latino News]

**Expected stance coverage:** homelessness-response (enforcement-first/anti-shelter), rent-regulation (oppose caps), public-safety-approach (pro-police). Likely 2–4 stances; many honest blanks (thin council record, seated Dec 2023).

### Unanimous Rent Control Rejection (Jan 2021) — Attribution Notes
The Jan 26 2021 unanimous council vote to reject rent control applies to **Trujillo** (seated Dec 2020) and **Frometa** (seated Dec 2018). Sosa (seated Dec 2022), Pemberton (Dec 2023), and Ortiz (Dec 2023) were NOT on the council for this vote — do not attribute it to them. [CITED: thedowneypatriot.com, caanet.org/downey-rejects-rent-control-proposal]

### Topics NOT applicable to Downey council
- judicial-* (all): Downey has an appointed City Attorney — not elected
- school-vouchers, trans-athletes, abortion, same-sex-marriage, civil-rights (federal): City council, not state/federal legislature
- fossil-fuels, climate-change: No documented council-level vote evidence found

---

## Common Pitfalls

### Pitfall 1: Sosa's LOCAL_EXEC district row needs its district_type changed, not just the office title
**What goes wrong:** Planner changes `offices.title` to 'Councilmember' but leaves the district row with `district_type = 'LOCAL_EXEC'`. The district row will then still surface incorrectly as an executive-type seat.
**How to avoid:** In the reconcile SQL, update BOTH the office title AND the district's `district_type = 'LOCAL'`. The district currently holding Sosa's seat is labeled LOCAL_EXEC — it must be converted to LOCAL.

### Pitfall 2: Ortiz has no politician row — pre-flight must confirm absence
**What goes wrong:** Implementer assumes Ortiz row doesn't exist and creates a duplicate.
**How to avoid:** Run `SELECT id FROM essentials.politicians WHERE first_name ILIKE '%horacio%' AND last_name ILIKE '%ortiz%'` as part of Wave-1 pre-flight. If found, reuse; if not found, create with next available custom ext_id.

### Pitfall 3: Trujillo's DB last_name = '-' (full name in first_name field)
**What goes wrong:** The CONTEXT.md notes Trujillo's DB entry has `last_name='-'` and `first_name` holds the full name. Implementer may try to read `last_name` for display.
**How to avoid:** After seating Trujillo, correct the `first_name` and `last_name` fields to canonical form: `first_name='Mario'`, `last_name='Trujillo'` (or whatever the DB convention is — check other -201xxx ext_ids for the convention).

### Pitfall 4: Don Pelc attribution uncertainty
**What goes wrong:** Implementer assumes Pelc was District 1 and tries to "move" Ortiz into Pelc's old seat, but Pelc may have been from a different district.
**How to avoid:** In pre-flight, query `SELECT o.id, d.label, d.district_type, pol.external_id FROM essentials.offices o JOIN essentials.districts d ON d.id = o.district_id JOIN essentials.politicians pol ON pol.id = o.politician_id WHERE pol.external_id = -700161` to confirm Pelc's actual district label before reassigning.

### Pitfall 5: Saab's office being in chamber 7cb8a90c vs. Trujillo's in orphan a30fd533
**What goes wrong:** Implementer moves Trujillo but also moves Saab's office, creating confusion about which At-Large rows belong to which district after relabeling.
**How to avoid:** Step-by-step: (1) move Trujillo from a30fd533 to 7cb8a90c first, (2) then unlink Saab and Pelc, (3) then relabel all 5 district rows, (4) then assign Ortiz to one of the freed office rows.

### Pitfall 6: District 5 is currently at-large citywide (not a geographic district)
**What goes wrong:** Planner labels D5 as "District 5" but the geo_id association implies a geographic boundary. The current D5 seat is elected citywide.
**How to avoid:** The `districts` row for D5 should use `geo_id = '0619766'` (the full city geo_id, not a sub-district geo_id) and `district_type = 'LOCAL'`. This matches how other at-large-within-single-member-council cities model their seats. The Nov 2026 transition to a bounded D5 is out of scope for this phase — seed current reality.

### Pitfall 7: Frometa's SCAG photo requires token-free URL
**What goes wrong:** The itok parameter in the SCAG URL is a Drupal image style token that may expire or rotate.
**How to avoid:** Download the Frometa photo immediately at apply time; do not defer. If the itok URL fails, fall back to the base URL without the itok parameter or the operator's in-browser download of the downeyca.org portrait.

---

## Migration Ledger Confirmation

**On-disk MAX (verified by ls of C:/EV-Accounts/backend/migrations/):** `984_state_exec_seed_batch_e.sql`
**schema_migrations registered MAX (from CONTEXT.md, sourced from DB pre-check 2026-06-20):** 947
**Unused gap:** 957–979 (Pasadena audit-only files 948–956 not registered; state_exec batches 980–984 not registered)
**Next structural migration:** **985** (first file after 984)
**Pre-flight MUST re-confirm** both the on-disk MAX and the live `schema_migrations` MAX before writing migration 985.

---

## Runtime State Inventory

This is a reconcile/reseat phase, not a rename/refactor. No string-level renames. Skip this section — no runtime state inventory required.

**N/A — verified: no stored data key names or OS-registered state change in this phase.**

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chamber deduplication | Custom merge logic | Proven move-then-delete SQL from mig 926/946 | Edge cases: bidirectional pointers, foreign key constraints |
| Image cropping | PIL one-liner | Established Pillow pipeline (4:5 crop → 600×750 Lanczos q90) | Aspect ratio enforcement, quality settings |
| Stance insertion | Raw INSERT without conflict handling | `ON CONFLICT (politician_id, topic_id) DO UPDATE` pattern | Idempotency — re-runs must be safe |

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| At-large city council seeding | By-district relabel of existing rows | CVRA-driven changes mean most CA cities now have district elections |
| Separate Mayor office/district for all mayors | `title='Mayor'` on council seat for rotational mayors | Matches Glendale, Palmdale, Santa Clarita precedent |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Don Pelc (-700161) is a stale/departed council member with no current seat | Roster | If Pelc is somehow current, we'd incorrectly unlink an active official — but zero sources confirm Pelc on the 2022-2026 council; risk is LOW |
| A2 | downeyca.org official portrait pages contain usable, identity-verified headshots | Headshots | If portrait pages contain group photos or low-res images, operator must use fallback sources |
| A3 | Horacio Ortiz does NOT have an existing politician row in the DB | Roster | Pre-flight SELECT confirms this; if found, reuse existing row |
| A4 | Frometa's SCAG itok URL remains valid at apply time | Headshots | SCAG Drupal image tokens occasionally rotate; download immediately at apply time |
| A5 | The 2021 rent-control vote record is attributable to Trujillo and Frometa but NOT Sosa/Pemberton/Ortiz | Stances | If any of the latter three were somehow on council in Jan 2021, stance attribution changes — but seating dates are confirmed |

---

## Open Questions

1. **Which At-Large district row maps to which existing council member?**
   - What we know: 5 At-Large district rows exist for the 6 offices; each office points at one district_id
   - What's unclear: The exact district_id UUID currently assigned to each of the 5 occupied offices (Frometa, Pemberton, Sosa, Saab, Pelc); Trujillo's office in the orphan chamber points at its own district row
   - Recommendation: Wave-1 pre-flight SELECT joins offices + districts + politicians to establish the full matrix before any write. The planner should include this pre-flight SELECT in the Plan 01 task.

2. **Next available custom ext_id for Ortiz**
   - What we know: -700xxx range in use; recent entries go up to -700658 (Pomona Ontiveros-Cole)
   - What's unclear: Whether any -700xxx values between -700659 and -700984 have been assigned in later phases
   - Recommendation: Pre-flight `SELECT MIN(external_id) FROM essentials.politicians WHERE external_id <= -700659 AND external_id > -701000` to find the next free slot. Given migration ledger = 985, next likely ext_id = **-700985**.

3. **Trujillo's `first_name`/`last_name` DB field corruption**
   - The CONTEXT.md notes `last_name='-'` and `first_name` holds the full name
   - Recommendation: Planner should include a name-field correction in migration 986 (set `first_name='Mario'`, `last_name='Trujillo'` with a `WHERE external_id = -201200` guard).

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| curl | Headshot download attempt | Yes | system | Operator in-browser download (WAF-403 confirmed — use fallback) |
| Pillow (Python) | Headshot 4:5 → 600×750 | Yes | system | — |
| Supabase MCP (`mcp__supabase-local`) | All DB writes | Yes | — | — |
| downeyca.org direct curl | Headshot source | BLOCKED (WAF-403) | — | Operator in-browser download |
| SCAG (Frometa) | Frometa headshot | Yes (HTTP 200 confirmed) | — | Campaign Facebook |

**Missing dependencies with no fallback:** None — all blocking requirements have alternatives.
**Missing dependencies with fallback:** downeyca.org WAF-403 → operator in-browser download for 4 of 5 portraits.

---

## Validation Architecture

Per project convention, structural migrations are verified immediately post-apply via inline SQL assertions (STOP-on-drift pattern in each migration). Stance and headshot migrations are audit-only and verified by count queries after apply.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | How to Verify |
|--------|----------|-----------|---------------|
| DWNY-01a | governments.geo_id = '0619766' | SQL assertion | `SELECT geo_id FROM essentials.governments WHERE id = '1a31cf01-5e05-46d9-88f3-6b94aaa0c607'` = '0619766' |
| DWNY-01b | Single 'City Council' chamber | SQL assertion | `SELECT COUNT(*) FROM essentials.chambers WHERE government_id = '1a31cf01...' AND name = 'City Council'` = 1 |
| DWNY-01c | 5 district offices, no stale links | SQL assertion | `SELECT COUNT(*) FROM essentials.offices o JOIN essentials.politicians p ON p.id = o.politician_id WHERE o.chamber_id = '<survivor>'` = 5 |
| DWNY-01d | Roster = current 5 members | SQL assertion | ext_ids 675353, 675360, 675361, -201200, NEW_ORTIZ all linked with both pointers in sync |
| DWNY-01e | Headshots 5 or fewer (honest gaps OK) | SQL count | `SELECT COUNT(*) FROM essentials.politician_images WHERE politician_id IN (...)` >= documented count |
| DWNY-01f | Stances 100% cited, no defaults | SQL count + manual review | All `inform.politician_answers` rows have paired `politician_context` with source URLs |
| DWNY-01g | Split-section check = 0 | SQL assertion | `feedback_section_split_check` query returns 0 rows for geo_id 0619766 |

### Wave 0 Gaps
None — test infrastructure already established from phases 146–149. No new framework needed.

---

## Security Domain

No new authentication, API endpoints, or data-handling patterns introduced in this phase. Pure DB reconcile + static media upload. Security domain: not applicable.

---

## Sources

### Primary (HIGH confidence)
- `downeychamber.org/downey-area-officials/` — authoritative current roster listing (Mayor: Sosa D2, Pro Tem: Ortiz D1, members: Pemberton D3, Frometa D4, Trujillo D5)
- LA County Registrar results `lavote.gov/text-results/4324` — Nov 2024 election: Trujillo D5 64.78%, Pemberton D3 68.44%
- `downeylatinonews.com` (2023 Nov) — special election results: Ortiz D1 52.42%, Pemberton D3 53.54%
- `thedowneypatriot.com` — Jan 2021 rent control vote (unanimous rejection); Dec 2024 mayor selection process
- `thedowneypatriot.com` — "Downey moves forward with new electoral system" — confirms no directly-elected mayor; rotational only
- `scag.ca.gov/profile/hon-claudia-m-frometa` — Frometa SCAG profile + accessible headshot URL

### Secondary (MEDIUM confidence)
- `downeylatinonews.com` 2022/2023/2024 candidate Q&As — Sosa/Pemberton/Trujillo/Ortiz policy positions
- `calonews.com` — ICE raids council response 2025 (individual attribution: Trujillo motion, Ortiz seconded, Pemberton third vote)
- `caanet.org/downey-rejects-rent-control-proposal/` — 2021 rent control rejection (unanimous; Trujillo and Frometa attributed, not the 2023-seated members)
- `legistorm.com` — Sosa (District 2), Ortiz (District 1), Frometa (District 4), Trujillo (District 5), Pemberton (District 3) seating dates

### Tertiary (LOW confidence)
- Google search snippets from downeyca.org (WAF-403 prevented direct fetch) — rotational mayor language quoted in web search result text
- Various Downey Patriot articles referenced indirectly via search results

---

## Metadata

**Confidence breakdown:**
- Form of government (rotational mayor): HIGH — multiple independent sources confirm
- Current roster (all 5 members + districts): HIGH — verified via election results + Chamber of Commerce listing
- Stale member identification (Saab departed): HIGH — documented term end; Pelc: MEDIUM (no source confirms service but also none confirms departure; marked ASSUMED stale)
- Headshot sources (WAF-403 status): HIGH — direct curl tests confirmed; specific fallback URLs: MEDIUM
- Stance evidence (Sosa/Trujillo): MEDIUM-HIGH — first-party statements + vote records; (Frometa): MEDIUM; (Pemberton/Ortiz): LOW-MEDIUM — thin recent record

**Research date:** 2026-06-20
**Valid until:** 2026-07-20 (30 days for stable local government data; re-confirm rotational mayor at apply time — mayors rotate each December)
